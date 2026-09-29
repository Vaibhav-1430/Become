# PHASE GYM WEB DATA, DUPLICATE, DELETE & WORKOUT PLAN REPAIR REPORT
**Project:** BOSS Study OS / FORGE Gym & Lifestyle System  
**Timestamp:** 2026-09-30  
**Status:** COMPLETE & VERIFIED  

---

## Executive Summary
This report details the comprehensive audit, root cause isolation, and repair of the Web Gym data pipeline, duplicate session collapse, workout plan persistence, relational data reconstruction, and deletion flow. All repairs strictly reuse existing architecture (`WorkoutPlan`, `WorkoutSession`, `WorkoutExercise`, `WorkoutSet`, `PersonalRecord`, `GymPhoto`, `SupabaseService`, `SyncEngine`, `Store`, `ConflictResolver`) without using fake fallbacks or ad-hoc defaults.

---

## 1. Root Cause of Undefined Workout Type
Inspection of `js/store.js`, `js/supabase-service.js`, and `js/gym.js` revealed three distinct faults causing `undefined` in workout history and planned split cards:
1. **Broken Default Wednesday Split:** In `Store.initDefaultGymSplit()`, Wednesday was defined as:
   ```javascript
   wednesday: {
       dayKey: 'wednesday',
       dayName: 'Chest + Triceps',
       isRestDay: false,
       muscleGroups: ['Chest', 'Triceps'],
       exercises: []
   }
   ```
   Notice that `routineName` was **completely missing** from the Wednesday object (while other days had `routineName`). When accessing `split.wednesday.routineName`, the engine received `undefined`.
2. **Hardcoded Reset Bug in `Store.getGymState()`:**
   `Store.getGymState()` contained a destructive condition:
   ```javascript
   if (this.memoryState.gym.schedule.monday.routineName !== 'Back + Biceps') {
       this.initDefaultGymSplit(true);
   }
   ```
   Any time a user customized Monday or during reload before hydration, this check forcibly overwrote the entire custom user plan with the default split (re-introducing the broken Wednesday without `routineName`).
3. **Database Schema Mapping Discrepancy:**
   In PostgreSQL Supabase schema, `workout_sessions` stores the split title in `workout_type`. During data hydration (`fetchAllUserData` and `pullCloudDataToLocal`), the database row was assigned to the local session without normalizing `workoutType` or `routineName`, causing `s.routineName` in history rendering to evaluate to `undefined`.

---

## 2. Root Cause of Missing Exercise / Set / Volume Data
In Workout History, sessions displayed:
```
0 exercises / 0 sets
Volume: 0 kg
Duration: 0 min
```
even though the weekly dashboard showed activity and underlying exercises/sets existed in the relational tables:
1. **Relational Table Isolation:** In Supabase, workout exercises and sets are stored in separate relational tables:
   ```
   workout_sessions (parent)
       └── workout_exercises (child)
               └── workout_sets (child)
   ```
   The read query in `fetchAllUserData` retrieved `workout_sessions`, but did not link `workout_exercises` and `workout_sets` hierarchically into each session object.
2. **Missing Denormalized Aggregates:** If a session row in the database had `0` or `null` for `total_sets`, `total_volume_kg`, or `duration_minutes`, the UI was rendering those zeros directly instead of computing the true aggregates from the loaded relational child records.
3. **Realtime Hydration Wipeout:** When a Realtime update occurred for `workout_sessions`, the raw table payload (which only contains the session row without child exercises/sets) was replacing the local in-memory session, overwriting the previously loaded `exercises` array with `undefined`.

---

## 3. Root Cause of Duplicate Sessions
The duplication of sessions (e.g. `Sep 28, 2026 Back + Biceps` appearing twice) had two architectural causes:
1. **Double Cloud Push in `finishWorkout()`:**
   In `GymEngine.finishWorkout()`:
   ```javascript
   const savedSession = Store.saveWorkoutSession({...}); // Push 1 via SyncEngine
   if (SupabaseService.isAuthenticated()) {
       SupabaseService.saveWorkoutSession(savedSession); // Push 2 direct race condition!
   }
   ```
   Both calls were initiated within milliseconds of each other.
2. **Client-Server ID Divergence:**
   `Store.saveWorkoutSession` created non-UUID IDs such as `'gym_sess_' + Date.now()`. When `SupabaseService.saveWorkoutSession` attempted to insert the record, it omitted `id` from `sessionRow` and performed a blind `.insert()`. Supabase generated a brand new server UUID (`v4`). When the Realtime listener or sync pull returned the server record, the app compared IDs and saw `'gym_sess_...'` vs server UUID, treating them as two separate workouts.

---

## 4. Canonical Workout Type & Weekday Representation
### Canonical Weekday Mapping:
Standardized across Plan Editor, Store, Supabase, and Mobile:
- `monday`: Index 1, DayName "Monday"
- `tuesday`: Index 2, DayName "Tuesday"
- `wednesday`: Index 3, DayName "Wednesday"
- `thursday`: Index 4, DayName "Thursday"
- `friday`: Index 5, DayName "Friday"
- `saturday`: Index 6, DayName "Saturday"
- `sunday`: Index 0, DayName "Sunday"

### Canonical Read Model (`WorkoutSessionViewModel`):
Created `Store.toWorkoutSessionViewModel(s)`:
- `id`: RFC 4122 v4 UUID
- `userId`: Stable user UUID
- `date`: `YYYY-MM-DD`
- `dayOfWeek`: Full name ('Monday' ... 'Sunday')
- `dayKey`: Lowercase key ('monday' ... 'sunday')
- `workoutType`: Canonical split name
- `routineName`: Canonical split name (identical)
- `durationMinutes`: Real duration (or calculated from `endedAt - startedAt`)
- `exerciseCount`: `count(workout_exercises)`
- `setCount`: `count(workout_sets)`
- `totalVolumeKg`: `SUM(weight × reps)`
- `totalReps`: `SUM(reps)`
- `status`: `'completed'`
- `gymPhoto`: Stable photo object with signed URL / path
- `personalRecords`: Array of PR records
- `exercises`: Array of child exercises with sets

---

## 5. Duplicate Prevention & Deduplication Pipeline
1. **Stable UUID Lifecycle:**
   Sessions strictly generate RFC 4122 v4 UUIDs before being saved locally or sent to the cloud:
   `CREATE ONCE (UUID v4) -> LOCAL STORE -> SUPABASE (upsert on ID) -> REALTIME (matched on ID) -> LOCAL STORE`
2. **Defensive Deduplication:**
   Implemented `Store.deduplicateWorkoutSessions(sessions)`:
   - Primary key match: `session.id`
   - Secondary signature match:
     `${date}|${workoutType.toLowerCase()}|${startedAt}|${endedAt}|${durationMinutes}|${totalSets}|${totalVolumeKg}|${photoPath}`
   Collapses legacy duplicate records that were assigned different IDs while strictly preserving separate legitimate workouts performed on the same day.

---

## 6. Delete Flow Implementation
Added visible `[🗑️ DELETE]` button on each history card and in the workout log modal.
1. **Confirmation Dialog:** Opens dedicated `deleteWorkoutModal` displaying session date, workout type, volume, and set count, with clear warning that deletion permanently removes session, exercises, sets, and check-in photo.
2. **Safe Relational Cascading Delete:**
   In `SupabaseService.deleteWorkoutSession(sessionId)`:
   - Validates user ownership (`session.user_id === currentUser.id`)
   - Queries child `workout_exercises`
   - Deletes all child `workout_sets`
   - Deletes all child `workout_exercises`
   - Deletes `workout_sessions` row
   - Deletes associated check-in photo from private Storage bucket
3. **Optimistic UI with Rollback Safety:**
   `GymEngine.deleteWorkout(sessionId)` creates an in-memory backup of the session. If deletion throws an error, local state is rolled back and an error toast is displayed.

---

## 7. Added `↻ REFRESH` Action
Added visible `↻ REFRESH` button in the Gym subnavigation bar:
- Prevents concurrent requests with `isRefreshing` guard
- Dispatches cloud pull via `SupabaseService.fetchAllUserData()`
- Reconciles through `SyncEngine.reconcile()`
- Updates button state to `REFRESHING...` -> `✓ UPDATED` -> `↻ REFRESH`
- Re-renders view without full page reload

---

## 8. Workout Plan Persistence & Freeform Split Support
- Plan editor now supports both quick presets and freeform workout names (e.g., `Chest + Biceps`).
- Saves both `routineName` and `workoutType` to local storage and Supabase `workout_plans`.
- Re-reads persisted plan from `Store` after saving to ensure local and cloud state agreement.
- Guarantees survival across:
  `EDITOR -> LOCAL STORE -> SUPABASE -> REFRESH -> HYDRATION -> RENDER`

---

## 9. Verification & Test Results

### Web Test Suite (`scripts/test_gym_web_repair.js`):
- `WORKOUT_PLAN_PERSISTENCE_TEST`: **PASS**
- `WORKOUT_PLAN_RELOAD_TEST`: **PASS**
- `WORKOUT_PLAN_LOGOUT_LOGIN_TEST`: **PASS**
- `WORKOUT_TYPE_NO_UNDEFINED_TEST`: **PASS**
- `WEEKDAY_MAPPING_TEST`: **PASS**
- `WORKOUT_HISTORY_RELATIONAL_DATA_TEST`: **PASS**
- `WORKOUT_EXERCISE_COUNT_TEST`: **PASS**
- `WORKOUT_SET_COUNT_TEST`: **PASS**
- `WORKOUT_VOLUME_TEST`: **PASS**
- `WORKOUT_DURATION_TEST`: **PASS**
- `WORKOUT_DUPLICATE_DETECTION_TEST`: **PASS**
- `WORKOUT_REFRESH_NO_DUPLICATE_TEST`: **PASS**
- `WORKOUT_REALTIME_NO_DUPLICATE_TEST`: **PASS**
- `WORKOUT_RETRY_NO_DUPLICATE_TEST`: **PASS**
- `WORKOUT_DELETE_TEST`: **PASS**
- `WORKOUT_DELETE_CHILDREN_TEST`: **PASS**
- `WORKOUT_DELETE_ROLLBACK_TEST`: **PASS**
- `GYM_MONTHLY_SUMMARY_TEST`: **PASS**
- `GYM_WEEKLY_SUMMARY_TEST`: **PASS**
- `GYM_CANONICAL_DATA_TEST`: **PASS**
**Result:** 20 / 20 PASSED (100%)

### Gym Photo Pipeline Suite (`scripts/test_gym_photo_visibility.js`):
- All 14 tests: **PASS** (100%)

### Mobile Test Suite:
- `flutter analyze`: **0 issues**
- `flutter test --no-pub`: **344 / 344 PASSED** (100%)
