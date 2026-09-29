# PRODUCTION INTEGRATION AUDIT: FORGE CROSS-PLATFORM & PHYSICAL DEVICE

**Project:** FORGE Super-App (Web + Mobile)  
**Location:** `d:\BOSS_Study_OS`  
**Date:** September 29, 2026  
**Status:** AUDIT COMPLETE — ROOT CAUSES IDENTIFIED — READY FOR IMPLEMENTATION

---

## 1. Executive Summary & Problem Scope

Physical Android device testing revealed that logging in with an existing, active web account presented an empty application:
- Study tasks, study sessions, and calendar directives did not appear.
- DSA progress and development topics did not show user-solved status.
- Career screen failed with `Bad state: User not authenticated`.
- Mistake Bank and Gym history appeared blank.
- Analytics displayed zeros or failed queries.
- Gym check-in camera was a synthetic mock byte generator rather than a real camera.
- The top header collided with the Android system status bar.
- Hardcoded demo telemetry (14d streak, 78.2% accuracy, 6 SRS due, 142.5h logged) masked true user data.

This comprehensive audit traces the exact root causes across Authentication, Initial Cloud Hydration, Repository Lifecycle, Database Schemas, Android Native configuration, and UI Layout.

---

## 2. Comprehensive Issue Matrix

| ID | Issue | Affected Subsystem | Root Cause | Affected Files | Affected DB Tables | Security Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | Zero Cloud Data on Mobile Login | Mobile (Core/Sync) | No initial cloud hydration service existed. `LocalStore` starts empty, and Realtime only captures future mutations. | `lib/main.dart`, `lib/core/sync/` | All 11 synchronized tables | Medium: Data desynchronization |
| **AUD-02** | Session Restoration Asynchrony Race | Mobile (Auth) | `main.dart` checked `AuthService.current.isAuthenticated` synchronously before `restoreSession()` completed. | `lib/main.dart`, `lib/features/auth/` | `auth.users`, `public.profiles` | Low: Forces re-login |
| **AUD-03** | Missing Default Supabase Credentials | Mobile (Config) | `AppConfig` lacked default production fallback URL and publishable key, falling back to `MockAuthService` (`usr_mock_001`). | `lib/core/config/app_config.dart` | `auth.users` | High: Auth to mock user |
| **AUD-04** | Career Screen Auth Crash | Mobile (Career) | `SupabaseCareerRepository` accessed `_client?.auth.currentUser?.id` before session was ready, throwing uncaught `StateError`. | `lib/features/career/data/supabase_career_repository.dart`, `career_screen.dart` | `public.internships`, `public.placement_hub_data` | None: UI crash |
| **AUD-05** | Analytics Schema Mismatch Errors | Mobile (Analytics) | Queries referenced non-existent columns (`is_solved` on `dsa_progress`, `topic_id`/`is_completed` on `development_progress`), causing 400 Bad Request. | `lib/features/analytics/data/supabase_analytics_repository.dart` | `public.dsa_progress`, `public.development_progress` | None: Query failure |
| **AUD-06** | Hardcoded Telemetry & Demo Residue | Mobile (DSA/Dev/Home) | Repositories returned hardcoded metrics (`streakDays: 14`, `srsDue: 6`, `accuracy: 78.2%`, `142.5h`, `commits: 184`) instead of computing from cloud data. | `lib/features/dsa/data/supabase_dsa_repository.dart`, `supabase_dev_repository.dart`, `supabase_home_repository.dart` | `dsa_progress`, `development_progress` | None: Fabricated metrics |
| **AUD-07** | Dummy Gym Camera & Missing Permissions | Mobile/Android Native | `GymCheckinScreen` generated mock JPEG bytes. `camera` dependency missing from `pubspec.yaml`, `CAMERA` permission missing from `AndroidManifest.xml`. | `lib/features/gym/presentation/screens/gym_checkin_screen.dart`, `pubspec.yaml`, `AndroidManifest.xml` | `storage.objects` (`gym-photos`) | High: Bypasses proof-of-workout |
| **AUD-08** | Header / System Status Bar Overlap | Mobile (UI) | `ForgeTopBar` had a hardcoded 56px height without `SafeArea` top inset handling, rendering underneath Android status bar icons. | `lib/features/home/presentation/widgets/forge_top_bar.dart`, `home_shell_screen.dart` | None | None: Visual / Touch collision |
| **AUD-09** | Premature "LIVE" Sync Indicator | Mobile (Sync UI) | `ForgeSyncIndicator` rendered `LIVE` if the Realtime channel connected, even before initial cloud hydration or with empty data. | `lib/core/sync/presentation/forge_sync_indicator.dart`, `sync_engine.dart` | None | None: Misleading sync state |

---

## 3. Deep Root-Cause Analysis

### AUD-01 & AUD-02: Authentication & Initial Cloud Hydration Pipeline
- **Mechanism:** When a user logs in on Web, `js/supabase-service.js` dispatches `loadUserData()`, executing 12 parallel queries across `study_tasks`, `study_sessions`, `dsa_progress`, `development_progress`, `mistakes`, `workout_sessions`, `personal_records`, `internships`, and `placement_hub_data`. It populates `Store.state` and `localStorage`.
- **The Mobile Flaw:** In `mobile/forge_app`, no such mechanism existed. The app relied solely on `LocalStore` (which is empty on a fresh install) and Phase 6 `RealtimeSyncService`. Realtime channels only broadcast *in-flight events*. They never download historical records.
- **Session Restoration Race:** In `lib/main.dart`:
  ```dart
  await ForgeSupabase.instance.initialize();
  if (ForgeSupabase.instance.isInitialized) {
    AuthService.current = SupabaseAuthService();
  }
  final initialRoute = AuthService.current.isAuthenticated ? AppRoutes.home : AppRoutes.welcome;
  runApp(ForgeApp(initialRoute: initialRoute));
  ```
  `AuthService.current.restoreSession()` was never awaited! The synchronous check evaluated `_currentUser == null`, sending an already-authenticated user back to `WelcomeScreen`.
- **Proposed Fix:**
  1. Introduce an explicit `CloudHydrationService` in `lib/core/sync/hydration/cloud_hydration_service.dart`.
  2. Implement a deterministic auth lifecycle in `main.dart` and `AuthService`:
     `INITIALIZING -> RESTORING SESSION -> AUTHENTICATED -> INITIAL CLOUD HYDRATION -> LOCAL DATA READY -> REALTIME ACTIVE -> READY`.
  3. Ensure `restoreSession()` is awaited during startup.
  4. Upon sign-in or session restoration, immediately invoke `CloudHydrationService.hydrate(userId)`.

### AUD-03: Configuration Fallback
- **Mechanism:** `AppConfig` read environment variables via `String.fromEnvironment('SUPABASE_URL')` without fallback.
- **The Flaw:** When running standard `flutter run` on a device without `--dart-define`, `AppConfig.isConfigured` was `false`. `ForgeSupabase` skipped initialization and reverted `AuthService` to `MockAuthService` (`usr_mock_001`).
- **Proposed Fix:** Configure default fallback values in `AppConfig` matching the production project (`https://wirxgkodkfqycufayzmk.supabase.co` and `sb_publishable_ompHx9iH2riZyrcxcEkCQw_-F-n1EVj`), while preserving `--dart-define` override capability.

### AUD-04: Career Screen Authentication Lifecycle Crash
- **Mechanism:** `SupabaseCareerRepository._currentUserId` checked:
  ```dart
  String get _currentUserId {
    final uid = _overrideUserId ?? _client?.auth.currentUser?.id;
    if (uid == null || uid.isEmpty) throw StateError('User not authenticated');
    return uid;
  }
  ```
  When `CareerScreen` initialized in `HomeShellScreen`'s `IndexedStack`, the widget mounted immediately. If `_client?.auth.currentUser` was momentarily resolving, it threw `StateError('User not authenticated')`, displaying the red error screen.
- **Proposed Fix:**
  1. Wire user ID resolution through `_overrideUserId ?? AuthService.current.currentUser?.id ?? _client?.auth.currentUser?.id`.
  2. Handle unauthenticated states gracefully in `CareerScreen` with a loading indicator during session restoration rather than throwing an unhandled exception.

### AUD-05: Analytics Schema Mismatch
- **Mechanism:** `SupabaseAnalyticsRepository` issued:
  ```dart
  client.from('dsa_progress').select('problem_id, status, is_solved')
  client.from('development_progress').select('topic_id, status, is_completed')
  ```
- **Database Reality:**
  - `dsa_progress` has: `id, user_id, problem_id, status, notes, solved_at, revisit_at, created_at, updated_at`. (`is_solved` does NOT exist; solved state is `status = 'SOLVED'`).
  - `development_progress` has: `id, user_id, category, item_id, status, notes, repo_link, live_link, content, solved_at, created_at, updated_at`. (`topic_id` and `is_completed` do NOT exist; topic ID is `item_id`, completed state is `status = 'COMPLETED'`).
- **Proposed Fix:** Align column names with the canonical database schema:
  `dsa_progress`: `problem_id, status, solved_at`
  `development_progress`: `item_id, category, status, solved_at`

### AUD-06: Hardcoded/Demo Metrics
- **Mechanism:**
  - In `SupabaseDsaRepository.getDsaProgress()`: `streakDays: 14`, `srsDueCount: 6`, `accuracyPct: 78.2`.
  - In `SupabaseDevRepository.getDevProgress()`: `hoursLogged: 142.5`, `commitsCount: 184`, `oaReadyCount: 4`, `oaTotalCount: 6`.
  - In `SupabaseHomeRepository.getTodayCommandData()`: `streakDays: 14`.
- **Proposed Fix:** Compute all metrics dynamically from actual user records in `LocalStore` / Supabase. If the user has zero progress, show 0.0% / "NO DSA PROGRESS YET" / authentic zeros.

### AUD-07: Gym Check-In Camera
- **Mechanism:** `GymCheckinScreen._triggerShutter()` constructed a byte array with synthetic headers and dummy optical raster bytes.
- **Missing Infrastructure:**
  - `pubspec.yaml` lacked the `camera` package.
  - `AndroidManifest.xml` lacked `android.permission.CAMERA` and camera hardware feature declarations.
- **Proposed Fix:**
  1. Add `camera: ^0.11.0+2` to `pubspec.yaml`.
  2. Add `android.permission.CAMERA` and `<uses-feature android:name="android.hardware.camera" android:required="false" />` to `AndroidManifest.xml`.
  3. Replace the mock viewfinder in `GymCheckinScreen` with `CameraController`, camera preview, front/rear camera toggle, flashlight toggle, real capture, photo preview, retake option, and upload to the canonical path in the private `gym-photos` bucket.

### AUD-08: Android Status Bar Overlap
- **Mechanism:** `ForgeTopBar` had `preferredSize => const Size.fromHeight(ForgeSpacing.topBarHeight)` and returned a `Container(height: 56.0)` without accounting for `MediaQuery.of(context).padding.top`.
- **The Result:** On Android devices with edge-to-edge transparent system bars, clock and battery icons rendered on top of the FORGE logo and profile button.
- **Proposed Fix:**
  1. In `ForgeTopBar`: Implement `preferredSize => Size.fromHeight(ForgeSpacing.topBarHeight + MediaQuery.of(context).padding.top)`.
  2. Wrap header content in `SafeArea(bottom: false)` or add `EdgeInsets.only(top: MediaQuery.of(context).padding.top)`.

### AUD-09: Synchronization Indicator State Accuracy
- **Mechanism:** `ForgeSyncIndicator` switched to `LIVE // ALL PROTOCOLS SYNCED` solely on `RealtimeSyncService.status == RealtimeStatus.connected`.
- **Proposed Fix:** The indicator must require `AuthService.current.isAuthenticated && CloudHydrationService.isHydrated && RealtimeSyncService.isConnected && SyncEngine.pendingCount == 0`. While hydration is underway, display `HYDRATING CLOUD STATE...`.

---

## 4. Database & RLS Audit Findings

- **Tables:** All 15 canonical tables exist in Supabase and possess correct columns and foreign key constraints:
  `profiles`, `study_tasks`, `study_sessions`, `dsa_progress`, `development_progress`, `mistakes`, `workout_plans`, `workout_sessions`, `workout_exercises`, `workout_sets`, `personal_records`, `ai_settings`, `placement_hub_data`, `internships`, `syllabus_nodes`.
- **RLS Policies:** All tables enforce `auth.uid() = user_id` (or relational existence for `workout_exercises` and `workout_sets`).
- **Realtime Publication:** All collaborative tables are enrolled in `supabase_realtime` with `REPLICA IDENTITY FULL`.
- **Storage Bucket:** `gym-photos` bucket is configured with private access and owner-scoped RLS policies:
  `auth.uid()::text = (storage.foldername(name))[1]`.
- **Database Action Required:** **Zero database schema modifications required**. The server schema and RLS policies are completely correct. The failures were entirely due to client-side auth resolution, missing initial hydration, and invalid column select strings in Flutter.

---

## 5. Implementation Plan

1. **Step 1: Configuration & Credentials (`AppConfig`)**
   - Provide production fallback credentials in `AppConfig` so physical APK runs initialize Supabase by default.
2. **Step 2: Authentication Lifecycle & Session Restoration (`main.dart` & `AuthService`)**
   - Await `restoreSession()` before route resolution.
   - Guard against null `currentUser` across all repositories.
3. **Step 3: Initial Cloud Hydration Service (`CloudHydrationService`)**
   - Create `CloudHydrationService` executing parallel fetches for all 11 tables on login/session restoration.
   - Populate `LocalStore` with clean (`_dirty: false`) records.
4. **Step 4: Repository Telemetry & Column Fixes**
   - Fix invalid columns in `SupabaseAnalyticsRepository` (`is_solved` -> `status`, `topic_id`/`is_completed` -> `item_id`/`status`).
   - Remove hardcoded metrics in `SupabaseDsaRepository`, `SupabaseDevRepository`, `SupabaseHomeRepository`.
   - Update `SupabaseCareerRepository` to resolve user ID safely.
5. **Step 5: Android Status Bar Safe-Area Layout**
   - Update `ForgeTopBar` with top padding matching system status bar insets.
6. **Step 6: Real Android Camera Integration**
   - Add `camera` dependency to `pubspec.yaml` and camera permissions to `AndroidManifest.xml`.
   - Re-implement `GymCheckinScreen` with real `CameraController`, preview, capture, and upload.
7. **Step 7: Sync Indicator Accuracy**
   - Link `ForgeSyncIndicator` to hydration state.
8. **Step 8: Automated Verification & Regression**
   - Run `flutter analyze` (must be 0 issues).
   - Run `flutter test --no-pub` (all 313 baseline tests + new hydration tests must pass).
9. **Step 9: Final Report**
   - Document all changes in `PRODUCTION_INTEGRATION_REPAIR_REPORT.md`.
