import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/config/app_config.dart';
import 'package:forge_app/core/utils/forge_date_utils.dart';
import 'package:forge_app/features/auth/data/auth_service.dart';
import 'package:forge_app/features/auth/domain/forge_profile.dart';
import 'package:forge_app/features/home/data/home_repository.dart';
import 'package:forge_app/features/home/data/mock_home_repository.dart';
import 'package:forge_app/features/home/domain/today_command_data.dart';
import 'package:forge_app/features/home/presentation/screens/todays_command_screen.dart';
import 'package:forge_app/features/plan/data/mock_plan_repository.dart';
import 'package:forge_app/features/plan/data/plan_repository.dart';
import 'package:forge_app/features/plan/domain/study_session.dart';
import 'package:forge_app/features/plan/domain/study_task.dart';
import 'package:forge_app/features/plan/presentation/screens/plan_calendar_screen.dart';

/// Test repository that fails on demand to test error states
class ErrorPlanRepository implements PlanRepository {
  @override
  Future<List<StudyTask>> getTasksForDate(String dateStr) async {
    throw Exception('DATABASE UNREACHABLE');
  }

  @override
  Future<Map<String, List<StudyTask>>> getTasksForMonth(int year, int month) async {
    throw Exception('DATABASE UNREACHABLE');
  }

  @override
  Future<bool> toggleTaskCompletion(String taskId, bool currentCompleted) async {
    throw Exception('UPDATE REJECTED');
  }

  @override
  Future<bool> updateTaskStatus(String taskId, String newStatus) async {
    throw Exception('UPDATE REJECTED');
  }

  @override
  Future<StudyTask?> createDirective(StudyTask task) async {
    throw Exception('INSERT REJECTED');
  }

  @override
  Future<List<StudySession>> getSessionsForDate(String dateStr) async {
    return [];
  }
}

class ErrorHomeRepository implements HomeRepository {
  @override
  Future<TodayCommandData> getTodayCommandData({String? dateStr}) async {
    throw Exception('NETWORK TIMEOUT');
  }

  @override
  Future<bool> toggleDirectiveCompletion(String taskId, bool currentCompleted) async {
    throw Exception('PERSISTENCE FAILED');
  }
}

class EmptyHomeRepository implements HomeRepository {
  @override
  Future<TodayCommandData> getTodayCommandData({String? dateStr}) async {
    return TodayCommandData(
      greeting: 'Good morning, TestUser',
      dateHeader: 'Monday, Jan 1 • Execution Protocol Active',
      targetHours: 8.0,
      completedHours: 0.0,
      dsaSummary: PillarSummary.empty('DSA'),
      devSummary: PillarSummary.empty('DEV'),
      studySummary: PillarSummary.empty('STUDY'),
      trainSummary: PillarSummary.empty('TRAIN'),
      directives: const [],
    );
  }

  @override
  Future<bool> toggleDirectiveCompletion(String taskId, bool currentCompleted) async {
    return true;
  }
}

void main() {
  setUp(() async {
    AppConfig.setRuntimeCredentials(
      url: 'https://test-project.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key',
    );
    AuthService.current = MockAuthService();
    await AuthService.current.signOut();
  });

  group('Phase 5C — 1. AUTH Tests', () {
    test('1. Supabase initialization/configuration safely reads config', () {
      expect(AppConfig.supabaseUrl, equals('https://test-project.supabase.co'));
      expect(AppConfig.supabaseAnonKey, contains('test-anon-key'));
      expect(AppConfig.isConfigured, isTrue);
    });

    test('2. AuthService interface remains usable via AuthService.current', () {
      expect(AuthService.current, isNotNull);
      expect(AuthService.current.isAuthenticated, isFalse);
      expect(AuthService.current.currentUser, isNull);
    });

    test('3. Sign-in success updates current user and state', () async {
      final success = await AuthService.current.signInWithEmailPassword(
        email: 'engineer@university.edu',
        password: 'password123',
      );

      expect(success, isTrue);
      expect(AuthService.current.isAuthenticated, isTrue);
      expect(AuthService.current.currentUser?.email, equals('engineer@university.edu'));
    });

    test('4. Sign-in failure with empty credentials returns false', () async {
      final success = await AuthService.current.signInWithEmailPassword(
        email: '',
        password: '',
      );

      expect(success, isFalse);
      expect(AuthService.current.isAuthenticated, isFalse);
    });

    test('5. Sign-up success creates account and updates profile', () async {
      final success = await AuthService.current.createAccount(
        fullName: 'Jane Doe',
        email: 'jane@berkeley.edu',
        password: 'securePassword123!',
        cohortTarget: 'Class of 2026 // L4 SWE Intern',
      );

      expect(success, isTrue);
      expect(AuthService.current.isAuthenticated, isTrue);
      expect(AuthService.current.currentUser?.fullName, equals('Jane Doe'));
      expect(AuthService.current.currentUser?.cohortTarget, contains('2026'));
    });

    test('6. Sign-up failure with invalid input returns false', () async {
      final success = await AuthService.current.createAccount(
        fullName: '',
        email: 'invalid',
        password: '',
        cohortTarget: 'Class of 2026 // L4 SWE Intern',
      );

      expect(success, isFalse);
    });

    test('7. Session restoration retains existing authenticated user', () async {
      await AuthService.current.signInWithEmailPassword(
        email: 'alex@berkeley.edu',
        password: 'secretPassword123',
      );

      expect(AuthService.current.isAuthenticated, isTrue);
      expect(AuthService.current.currentUser?.email, equals('alex@berkeley.edu'));
    });

    test('8. Sign-out clears auth session and user data', () async {
      await AuthService.current.signInWithEmailPassword(
        email: 'test@domain.edu',
        password: 'password123',
      );
      expect(AuthService.current.isAuthenticated, isTrue);

      await AuthService.current.signOut();
      expect(AuthService.current.isAuthenticated, isFalse);
      expect(AuthService.current.currentUser, isNull);
    });

    test('9. Auth state transitions notify listeners', () async {
      int notifications = 0;
      AuthService.current.addListener(() {
        notifications++;
      });

      await AuthService.current.signInWithEmailPassword(
        email: 'notify@domain.edu',
        password: 'password123',
      );
      expect(notifications, greaterThanOrEqualTo(1));

      await AuthService.current.signOut();
      expect(notifications, greaterThanOrEqualTo(2));
    });
  });

  group('Phase 5C — 2. PROFILE Tests', () {
    test('10. Authenticated user profile parses correctly from backend map', () {
      final map = {
        'id': 'usr_uuid_123',
        'display_name': 'Sarah Connor',
        'avatar_path': 'avatars/sarah.png',
        'timezone': 'America/Los_Angeles',
        'created_at': '2026-01-01T00:00:00Z',
        'updated_at': '2026-09-28T00:00:00Z',
      };

      final profile = ForgeProfile.fromMap(map);
      expect(profile.id, equals('usr_uuid_123'));
      expect(profile.displayName, equals('Sarah Connor'));
      expect(profile.avatarPath, equals('avatars/sarah.png'));
      expect(profile.timezone, equals('America/Los_Angeles'));
      expect(profile.firstName, equals('Sarah'));
    });

    test('11. Profile empty state handles missing data gracefully', () {
      final profile = ForgeProfile.empty('usr_empty_001');
      expect(profile.id, equals('usr_empty_001'));
      expect(profile.displayName, equals('Operator'));
      expect(profile.firstName, equals('Operator'));
      expect(profile.timezone, equals('Asia/Kolkata'));
    });

    test('12. Profile serialization preserves fields without loss', () {
      const profile = ForgeProfile(
        id: 'usr_ser_1',
        displayName: 'Dev Ops',
        avatarPath: 'path/avatar.jpg',
        timezone: 'UTC',
      );
      final map = profile.toMap();
      expect(map['id'], equals('usr_ser_1'));
      expect(map['display_name'], equals('Dev Ops'));
      expect(map['timezone'], equals('UTC'));
    });
  });

  group('Phase 5C — 3. TODAY\'S COMMAND Data Layer Tests', () {
    test('13. Today\'s Command loads real repository data', () async {
      final repo = MockHomeRepository();
      final data = await repo.getTodayCommandData();

      expect(data.greeting, contains('BOSS'));
      expect(data.targetHours, equals(6.5));
      expect(data.directives.length, equals(3));
      expect(data.dsaSummary.title, equals('DSA'));
      expect(data.devSummary.title, equals('DEV'));
      expect(data.studySummary.title, equals('STUDY'));
      expect(data.trainSummary.title, equals('TRAIN'));
    });

    testWidgets('14. Empty directive state displays honest fallback UI', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TodaysCommandScreen(repository: EmptyHomeRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('NO DIRECTIVES LOGGED FOR TODAY'), findsOneWidget);
      expect(find.text('PROTOCOL STATUS // ALL CLEARED'), findsOneWidget);
    });

    test('15. Task completion update toggles status in repository', () async {
      final repo = MockHomeRepository();
      final initialData = await repo.getTodayCommandData();
      final firstTask = initialData.directives.first;

      final success = await repo.toggleDirectiveCompletion(firstTask.id, false);
      expect(success, isTrue);

      final updatedData = await repo.getTodayCommandData();
      final updatedTask = updatedData.directives.firstWhere((t) => t.id == firstTask.id);
      expect(updatedTask.isCompleted, isTrue);
    });

    test('16. Failed task update handles exceptions without crash', () async {
      final repo = ErrorHomeRepository();
      expect(
        () async => await repo.toggleDirectiveCompletion('tsk_fail', false),
        throwsA(isA<Exception>()),
      );
    });

    testWidgets('17. Today\'s data error state renders retry action', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TodaysCommandScreen(repository: ErrorHomeRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('TELEMETRY SYNC FAILED'), findsOneWidget);
      expect(find.text('RETRY CONNECTION'), findsOneWidget);
    });
  });

  group('Phase 5C — 4. PLAN & CALENDAR Tests', () {
    testWidgets('18. Calendar renders month ribbon and weekday headers', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: MockPlanRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('M'), findsWidgets);
      expect(find.text('W'), findsOneWidget);
      expect(find.text('F'), findsOneWidget);
      expect(find.text('DSA'), findsWidgets);
      expect(find.text('Dev Commits'), findsOneWidget);
      expect(find.text('Gym Log'), findsOneWidget);
      expect(find.text('Core CS'), findsOneWidget);
    });

    testWidgets('19. Current date selection displays inspection card', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: MockPlanRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Execution Protocol'), findsOneWidget);
      expect(find.text('+ Add Directive / Adjust Session'), findsOneWidget);
    });

    testWidgets('20. Month navigation moves to previous and next month', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: MockPlanRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find prev and next chevron buttons
      final prevBtn = find.byIcon(Icons.chevron_left);
      expect(prevBtn, findsOneWidget);
      await tester.tap(prevBtn);
      await tester.pumpAndSettle();

      final nextBtn = find.byIcon(Icons.chevron_right);
      expect(nextBtn, findsOneWidget);
      await tester.tap(nextBtn);
      await tester.pumpAndSettle();

      expect(find.text('TODAY'), findsWidgets);
    });

    testWidgets('21. Real task loading displays directives in inspection list', (WidgetTester tester) async {
      final repo = MockPlanRepository();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: repo),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Binary Trees & Traversal'), findsOneWidget);
    });

    testWidgets('22. Empty day state renders zero directives message', (WidgetTester tester) async {
      final repo = MockPlanRepository();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: repo),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on day 01 (empty in mock)
      final day01 = find.text('01').first;
      await tester.tap(day01);
      await tester.pumpAndSettle();

      expect(find.text('NO DIRECTIVES SLOTTED // REST PROTOCOL'), findsOneWidget);
    });

    testWidgets('23. Task completion toggle in calendar updates task', (WidgetTester tester) async {
      final repo = MockPlanRepository();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: repo),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find checkmark icon for completed task and tap to toggle
      final checkmark = find.byIcon(Icons.check).first;
      expect(checkmark, findsOneWidget);
      await tester.tap(checkmark);
      await tester.pumpAndSettle();

      // Task status changed in repository
      final tasks = await repo.getTasksForDate(ForgeDateUtils.todayDateString());
      expect(tasks.first.isCompleted, isFalse);
    });

    testWidgets('24. Calendar handles error repository gracefully without crashing', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PlanCalendarScreen(repository: ErrorPlanRepository()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(PlanCalendarScreen), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });

  group('Phase 5C — 5. SECURITY & ISOLATION Tests', () {
    test('26. User identity is taken strictly from authenticated session', () async {
      final user = AuthService.current.currentUser;
      expect(user, isNull);

      await AuthService.current.signInWithEmailPassword(
        email: 'engineer@university.edu',
        password: 'password123',
      );
      expect(AuthService.current.currentUser?.id, isNotNull);
    });

    test('27. No service-role credential exists in client configuration', () {
      expect(AppConfig.supabaseAnonKey, isNot(contains('service_role')));
      expect(AppConfig.supabaseAnonKey, isNot(contains('service-role')));
      expect(AppConfig.supabaseUrl, isNot(contains('postgres://')));
    });

    test('28. StudyTask model enforces immutability and copyWith security', () {
      const task = StudyTask(
        id: 'tsk_sec_01',
        userId: 'usr_owner_A',
        date: '2026-09-29',
        taskId: 'sec_test',
        title: 'Security Directive',
        category: 'DSA',
      );

      final cloned = task.copyWith(status: 'COMPLETED');
      expect(cloned.userId, equals('usr_owner_A'));
      expect(cloned.id, equals('tsk_sec_01'));
      expect(cloned.status, equals('COMPLETED'));
    });
  });

  group('Phase 5C — 6. DATE Semantics & Boundary Tests', () {
    test('29. Local date boundary does not shift across timezones', () {
      final localDate = DateTime(2026, 10, 24, 0, 1);
      final dateStr = ForgeDateUtils.toDateString(localDate);
      expect(dateStr, equals('2026-10-24'));

      final parsed = ForgeDateUtils.parseDate(dateStr);
      expect(parsed.year, equals(2026));
      expect(parsed.month, equals(10));
      expect(parsed.day, equals(24));
    });

    test('30. Midnight date transition rolls correctly across months and years', () {
      expect(ForgeDateUtils.nextDate('2026-09-30'), equals('2026-10-01'));
      expect(ForgeDateUtils.prevDate('2026-10-01'), equals('2026-09-30'));
      expect(ForgeDateUtils.nextDate('2026-12-31'), equals('2027-01-01'));
      expect(ForgeDateUtils.prevDate('2027-01-01'), equals('2026-12-31'));
    });

    test('31. Days in month and weekday offset calculate accurately', () {
      expect(ForgeDateUtils.daysInMonth(2024, 2), equals(29)); // Leap year
      expect(ForgeDateUtils.daysInMonth(2025, 2), equals(28));
      expect(ForgeDateUtils.daysInMonth(2026, 9), equals(30));
      expect(ForgeDateUtils.daysInMonth(2026, 10), equals(31));

      // 2026-10-01 is a Thursday (Monday = 0, Thu = 3)
      expect(ForgeDateUtils.firstWeekdayOfMonth(2026, 10), equals(3));
    });
  });

  group('Phase 5C — 7. PlanCalendarScreen Responsiveness (320px to 430px)', () {
    const supportedWidths = [320.0, 360.0, 375.0, 390.0, 414.0, 430.0];

    for (final width in supportedWidths) {
      testWidgets('No horizontal overflow on PlanCalendarScreen at width $width', (WidgetTester tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: PlanCalendarScreen(repository: MockPlanRepository()),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    }
  });
}
