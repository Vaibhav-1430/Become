import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/features/analytics/data/mock_analytics_repository.dart';
import 'package:forge_app/features/analytics/domain/analytics_data.dart';
import 'package:forge_app/features/analytics/presentation/screens/analytics_screen.dart';
import 'package:forge_app/features/mistakes/data/mock_mistake_repository.dart';
import 'package:forge_app/features/mistakes/domain/mistake.dart';
import 'package:forge_app/features/mistakes/presentation/screens/mistake_bank_screen.dart';
import 'package:forge_app/features/mistakes/presentation/screens/mistake_detail_screen.dart';
import 'package:forge_app/features/plan/domain/study_session.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // ---------------------------------------------------------------------------
  // 1. MISTAKE BANK DOMAIN & REPOSITORY TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5F — 1. MISTAKE BANK REPOSITORY & DOMAIN Tests', () {
    late MockMistakeRepository repo;

    setUp(() {
      repo = MockMistakeRepository(initialUserId: 'user_alpha');
    });

    test('1. Create, read, and list mistakes', () async {
      final m1 = Mistake(
        id: 'm1',
        userId: 'user_alpha',
        question: 'Longest Repeating Character Replacement',
        subject: 'DSA',
        topic: 'Sliding Window',
        source: 'LeetCode 424',
        date: '2026-09-29',
        userAnswer: 'r - l + 1 - maxFreq > k',
        correctAnswer: 'Maintain global max frequency invariant',
        explanation: 'Max frequency does not need to decrease during shrinking',
        mistakeType: 'Conceptual mistake',
        personalNote: 'Forgot that maxFreq can remain invariant',
        revisitDate: '2026-09-30',
        repeatCount: 1,
        resolved: false,
      );

      final created = await repo.createMistake(m1);
      expect(created.id, 'm1');
      expect(created.question, 'Longest Repeating Character Replacement');

      final list = await repo.getMistakes();
      expect(list.length, 1);
      expect(list.first.subject, 'DSA');
      expect(list.first.resolved, isFalse);
    });

    test('2. Deduplication & repeat count increment on duplicate question', () async {
      final m1 = Mistake(
        id: 'm1',
        userId: 'user_alpha',
        question: 'Two Sum edge cases',
        subject: 'DSA',
        topic: 'Hashing',
        date: '2026-09-28',
        repeatCount: 1,
        resolved: true,
      );
      await repo.createMistake(m1);

      // Re-logging the same question title reopens it and increments repeat count
      final m2 = Mistake(
        id: 'm2',
        userId: 'user_alpha',
        question: 'Two Sum edge cases',
        subject: 'DSA',
        topic: 'Hashing',
        date: '2026-09-29',
      );
      final updated = await repo.createMistake(m2);

      expect(updated.repeatCount, 2);
      expect(updated.resolved, isFalse); // reopened because repeated

      final list = await repo.getMistakes();
      expect(list.length, 1);
      expect(list.first.repeatCount, 2);
    });

    test('3. Toggle resolved status between fixed and unresolved', () async {
      final m1 = Mistake(
        id: 'm_toggle',
        userId: 'user_alpha',
        question: 'Deadlock avoidance in Banker algorithm',
        subject: 'Core CS',
        topic: 'OS',
        date: '2026-09-29',
        resolved: false,
      );
      await repo.createMistake(m1);

      final fixed = await repo.toggleResolved('m_toggle', false);
      expect(fixed.resolved, isTrue);

      final reopened = await repo.toggleResolved('m_toggle', true);
      expect(reopened.resolved, isFalse);
    });

    test('4. Increment revisit date (+3 days) and repeatCount', () async {
      final m1 = Mistake(
        id: 'm_rev',
        userId: 'user_alpha',
        question: 'Virtual DOM reconciliation diffing',
        subject: 'Development',
        topic: 'React',
        date: '2026-09-29',
        repeatCount: 1,
        revisitDate: '2026-09-29',
      );
      await repo.createMistake(m1);

      final updated = await repo.incrementRevisit('m_rev');
      expect(updated.repeatCount, 2);
      expect(updated.revisitDate, isNotNull);
      expect(updated.resolved, isFalse);
    });

    test('5. Update mistake classification, notes, and revisit schedule', () async {
      final m1 = Mistake(
        id: 'm_edit',
        userId: 'user_alpha',
        question: 'SQL Deadlocks on concurrent transactions',
        subject: 'Core CS',
        topic: 'DBMS',
        date: '2026-09-29',
        mistakeType: 'Unknown',
      );
      await repo.createMistake(m1);

      final updated = await repo.updateMistake(m1.copyWith(
        mistakeType: 'Concurrency hazard',
        personalNote: 'Lock ordering must be preserved across threads',
        revisitDate: '2026-10-05',
      ));

      expect(updated.mistakeType, 'Concurrency hazard');
      expect(updated.personalNote, contains('Lock ordering'));
      expect(updated.revisitDate, '2026-10-05');
    });

    test('6. Delete mistake record', () async {
      final m1 = Mistake(
        id: 'm_del',
        userId: 'user_alpha',
        question: 'To be deleted',
        subject: 'Other',
        date: '2026-09-29',
      );
      await repo.createMistake(m1);
      expect((await repo.getMistakes()).length, 1);

      final deleted = await repo.deleteMistake('m_del');
      expect(deleted, isTrue);
      expect((await repo.getMistakes()).isEmpty, isTrue);
    });

    test('7. Filter mistakes by subject, status, and search query', () async {
      await repo.createMistake(Mistake(
        id: 'f1',
        userId: 'user_alpha',
        question: 'Binary Tree Inorder Traversal',
        subject: 'DSA',
        topic: 'Trees',
        date: '2026-09-29',
        resolved: false,
        revisitDate: '2026-09-20', // due
      ));
      await repo.createMistake(Mistake(
        id: 'f2',
        userId: 'user_alpha',
        question: 'CSS Stacking Context with opacity',
        subject: 'Development',
        topic: 'CSS',
        date: '2026-09-28',
        resolved: true,
      ));

      // Subject filter
      final dsaList = await repo.getMistakes(subject: 'DSA');
      expect(dsaList.length, 1);
      expect(dsaList.first.question, contains('Binary Tree'));

      // Status filter: unresolved
      final unresolved = await repo.getMistakes(status: 'unresolved');
      expect(unresolved.length, 1);

      // Status filter: resolved
      final resolved = await repo.getMistakes(status: 'resolved');
      expect(resolved.length, 1);
      expect(resolved.first.subject, 'Development');

      // Status filter: dueRevision
      final due = await repo.getMistakes(status: 'dueRevision');
      expect(due.length, 1);
      expect(due.first.id, 'f1');

      // Query search
      final searchRes = await repo.getMistakes(query: 'stacking');
      expect(searchRes.length, 1);
      expect(searchRes.first.id, 'f2');
    });

    test('8. Compute accurate MistakeStats without placeholder metrics', () async {
      final statsEmpty = await repo.getMistakeStats();
      expect(statsEmpty.total, 0);
      expect(statsEmpty.unresolved, 0);
      expect(statsEmpty.recoveryAccuracy, 0.0);
      expect(statsEmpty.hasData, isFalse);

      await repo.createMistake(Mistake(
        id: 's1',
        userId: 'user_alpha',
        question: 'Q1',
        subject: 'DSA',
        topic: 'Binary Search',
        date: '2026-09-29',
        resolved: true,
      ));
      await repo.createMistake(Mistake(
        id: 's2',
        userId: 'user_alpha',
        question: 'Q2',
        subject: 'DSA',
        topic: 'Binary Search',
        date: '2026-09-29',
        resolved: false,
        repeatCount: 2,
        revisitDate: '2026-09-20',
      ));

      final stats = await repo.getMistakeStats();
      expect(stats.total, 2);
      expect(stats.unresolved, 1);
      expect(stats.repeated, 1);
      expect(stats.dueForRevision, 1);
      expect(stats.recoveryAccuracy, 50.0);
      expect(stats.topDeficitVector, 'Binary Search');
      expect(stats.hasData, isTrue);
    });

    test('9. User Isolation: Multi-account separation prevents data leaks', () async {
      await repo.createMistake(Mistake(
        id: 'm_alpha',
        userId: 'user_alpha',
        question: 'Alpha flaw',
        subject: 'DSA',
        date: '2026-09-29',
      ));

      // Switch to User Beta
      repo.setActiveUser('user_beta');
      final betaList = await repo.getMistakes();
      expect(betaList.isEmpty, isTrue);

      // Create Beta mistake
      await repo.createMistake(Mistake(
        id: 'm_beta',
        userId: 'user_beta',
        question: 'Beta flaw',
        subject: 'Development',
        date: '2026-09-29',
      ));

      expect((await repo.getMistakes()).length, 1);
      expect((await repo.getMistakes()).first.question, 'Beta flaw');

      // Switch back to Alpha
      repo.setActiveUser('user_alpha');
      final alphaList = await repo.getMistakes();
      expect(alphaList.length, 1);
      expect(alphaList.first.question, 'Alpha flaw');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ANALYTICS DOMAIN & REPOSITORY TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5F — 2. ANALYTICS REPOSITORY & DOMAIN Tests', () {
    late MockAnalyticsRepository repo;

    setUp(() {
      repo = MockAnalyticsRepository(initialUserId: 'user_alpha');
    });

    test('10. Zero fake telemetry when user has no persisted records', () async {
      final emptyData = await repo.getAnalyticsData();
      expect(emptyData.streakDays, 0);
      expect(emptyData.totalStudyDays, 0);
      expect(emptyData.totalFocusMinutes, 0);
      expect(emptyData.sessionCount, 0);
      expect(emptyData.dsaSolved, 0);
      expect(emptyData.devCompletedTopics, 0);
      expect(emptyData.lifetimeVolumeKg, 0.0);
      expect(emptyData.hasData, isFalse); // Explicit false triggers empty state
    });

    test('11. Authentic telemetry aggregation across pillars', () async {
      final sampleSession = StudySession(
        id: 'sess_1',
        userId: 'user_alpha',
        date: '2026-09-29',
        subject: 'DSA',
        topic: 'Graphs Dijkstra',
        activeSeconds: 3600, // 60 mins
        breakSeconds: 600,   // 10 mins
        cameraEnabled: true,
        presenceRate: 98,
        aiInsight: 'Superb Dijkstra intuition',
      );

      final authenticData = AnalyticsData(
        streakDays: 4,
        totalStudyDays: 12,
        totalFocusMinutes: 120,
        totalBreakMinutes: 20,
        sessionCount: 2,
        averageSessionMinutes: 60,
        longestSessionMinutes: 75,
        breakRatioPercent: 14,
        primaryCategory: 'DSA',
        categorySpread: {'DSA': 2},
        recentSessions: [sampleSession],
        dailyHistory: [
          const DailyActivityBar(date: '2026-09-28', dayOfMonth: 28, completedTasks: 3, isGood: true),
          const DailyActivityBar(date: '2026-09-29', dayOfMonth: 29, completedTasks: 2, isGood: true),
        ],
        dsaSolved: 42,
        dsaTotal: 455,
        dsaEasySolved: 20,
        dsaMediumSolved: 18,
        dsaHardSolved: 4,
        devCompletedTopics: 3,
        devTotalTopics: 13,
        weeklyWorkoutsCompleted: 3,
        weeklyWorkoutsPlanned: 4,
        lifetimeVolumeKg: 12450.0,
        lifetimeSets: 140,
        totalWorkouts: 12,
        personalRecordsCount: 5,
        totalMistakes: 4,
        unresolvedDeficits: 1,
        dueSrsToday: 1,
        recoveryAccuracy: 75.0,
      );

      repo.seedData('user_alpha', authenticData);
      final fetched = await repo.getAnalyticsData();

      expect(fetched.hasData, isTrue);
      expect(fetched.streakDays, 4);
      expect(fetched.totalStudyDays, 12);
      expect(fetched.dsaSolved, 42);
      expect(fetched.dsaPercentage, closeTo((42 / 455) * 100, 0.1));
      expect(fetched.devCompletedTopics, 3);
      expect(fetched.lifetimeVolumeKg, 12450.0);
      expect(fetched.recentSessions.length, 1);
      expect(fetched.recentSessions.first.cameraEnabled, isTrue);
    });

    test('12. User isolation prevents telemetry bleeding between accounts', () async {
      repo.seedData('user_alpha', const AnalyticsData(
        streakDays: 5,
        totalStudyDays: 10,
        dsaSolved: 50,
      ));

      repo.seedData('user_beta', const AnalyticsData(
        streakDays: 1,
        totalStudyDays: 2,
        dsaSolved: 5,
      ));

      repo.setActiveUser('user_alpha');
      var data = await repo.getAnalyticsData();
      expect(data.streakDays, 5);
      expect(data.dsaSolved, 50);

      repo.setActiveUser('user_beta');
      data = await repo.getAnalyticsData();
      expect(data.streakDays, 1);
      expect(data.dsaSolved, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. MISTAKE BANK WIDGET & UI TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5F — 3. MISTAKE BANK UI & INTERACTION Tests', () {
    late MockMistakeRepository repo;

    setUp(() {
      repo = MockMistakeRepository(initialUserId: 'user_ui');
    });

    testWidgets('13. MistakeBankScreen renders empty state when 0 mistakes exist', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MistakeBankScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('ERROR DEFENSE'), findsOneWidget);
      expect(find.text('0 MISTAKES FOUND'), findsOneWidget);
      expect(find.text('LOG NEW MISTAKE'), findsWidgets);
    });

    testWidgets('14. MistakeBankScreen renders Bento metrics and structured mistake card', (tester) async {
      await repo.createMistake(Mistake(
        id: 'card_1',
        userId: 'user_ui',
        question: 'Longest Palindromic Substring',
        subject: 'DSA',
        topic: 'Dynamic Programming',
        source: 'LeetCode 5',
        date: '2026-09-29',
        userAnswer: 'Tried 2-pointer without expanding around centers',
        correctAnswer: 'Expand around centers or use DP table',
        mistakeType: 'Logic mistake',
        resolved: false,
      ));

      await tester.pumpWidget(
        MaterialApp(
          home: MistakeBankScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('ACTIVE DEFICITS'), findsOneWidget);
      expect(find.text('DUE TODAY (SRS)'), findsOneWidget);
      expect(find.text('Longest Palindromic Substring'), findsOneWidget);
      expect(find.text('REVIEW NOW'), findsOneWidget);
      expect(find.text('MARK FIXED'), findsOneWidget);
    });

    testWidgets('15. Quick toggle MARK FIXED changes status in MistakeBankScreen', (tester) async {
      await repo.createMistake(Mistake(
        id: 'toggle_card',
        userId: 'user_ui',
        question: 'Binary Search Left Bound',
        subject: 'DSA',
        topic: 'Binary Search',
        date: '2026-09-29',
        resolved: false,
      ));

      await tester.pumpWidget(
        MaterialApp(
          home: MistakeBankScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('MARK FIXED'), findsOneWidget);
      await tester.tap(find.text('MARK FIXED'));
      await tester.pumpAndSettle();

      expect(find.text('REOPEN'), findsOneWidget);
      expect(find.text('FIXED ✓'), findsWidgets);
    });

    testWidgets('16. MistakeDetailScreen displays deep diagnosis and answers', (tester) async {
      final mistake = Mistake(
        id: 'detail_test',
        userId: 'user_ui',
        question: 'Page Fault Handling & TLB Miss',
        subject: 'Core CS',
        topic: 'Virtual Memory',
        source: 'OS Internals',
        date: '2026-09-29',
        userAnswer: 'Confused MMU page walk with OS trap handler',
        correctAnswer: 'TLB miss is checked in hardware; page fault causes OS interrupt',
        explanation: 'Hardware page walker accesses CR3 register without kernel switch',
        mistakeType: 'Conceptual mistake',
        personalNote: 'Review x86 paging architecture chapter',
        repeatCount: 2,
        resolved: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: MistakeDetailScreen(
            initialMistake: mistake,
            repository: repo,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('ERROR DEFENSE // DIAGNOSIS'), findsOneWidget);
      expect(find.text('Page Fault Handling & TLB Miss'), findsOneWidget);
      expect(find.text('DEFICIT (YOUR ANSWER / WHY I FAILED)'), findsOneWidget);
      expect(find.text('DEFENSE PROTOCOL (CORRECT SOLUTION)'), findsOneWidget);
      expect(find.text('CONCEPT & INVARIANT EXPLANATION'), findsOneWidget);
      expect(find.text('MARK FIXED ✓'), findsOneWidget);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. ANALYTICS WIDGET & UI TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5F — 4. ANALYTICS UI & TELEMETRY Tests', () {
    late MockAnalyticsRepository repo;

    setUp(() {
      repo = MockAnalyticsRepository(initialUserId: 'user_analytics');
    });

    testWidgets('17. AnalyticsScreen renders explicit INSUFFICIENT TELEMETRY on empty data', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AnalyticsScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('FORGE // ANALYTICS'), findsOneWidget);
      expect(find.text('INSUFFICIENT TELEMETRY'), findsOneWidget);
      expect(find.textContaining('No authentic study sessions'), findsOneWidget);
    });

    testWidgets('18. AnalyticsScreen renders full tactical HUD with authentic metrics', (tester) async {
      repo.seedData('user_analytics', const AnalyticsData(
        streakDays: 7,
        totalStudyDays: 14,
        totalFocusMinutes: 180,
        totalBreakMinutes: 30,
        sessionCount: 3,
        averageSessionMinutes: 60,
        longestSessionMinutes: 90,
        breakRatioPercent: 14,
        primaryCategory: 'DSA',
        categorySpread: {'DSA': 2, 'Development': 1},
        dailyHistory: [
          DailyActivityBar(date: '2026-09-28', dayOfMonth: 28, completedTasks: 2, isGood: true),
          DailyActivityBar(date: '2026-09-29', dayOfMonth: 29, completedTasks: 4, isGood: true),
        ],
        dsaSolved: 35,
        dsaTotal: 455,
        dsaEasySolved: 20,
        dsaMediumSolved: 12,
        dsaHardSolved: 3,
        devCompletedTopics: 4,
        devTotalTopics: 13,
        weeklyWorkoutsCompleted: 3,
        weeklyWorkoutsPlanned: 4,
        lifetimeVolumeKg: 8500.0,
        lifetimeSets: 96,
        totalWorkouts: 8,
        personalRecordsCount: 3,
      ));

      tester.view.physicalSize = const Size(390, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: AnalyticsScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('STREAK'), findsOneWidget);
      expect(find.text('STUDY DAYS'), findsOneWidget);
      expect(find.text('14-DAY ACTIVITY HISTOGRAM'), findsOneWidget);
      expect(find.text('AUTHENTIC FOCUS TELEMETRY'), findsOneWidget);
      expect(find.text('PILLAR MASTERY PROGRESSION'), findsOneWidget);
      expect(find.text('STRIVER DSA A2Z'), findsOneWidget);
      expect(find.text('FULL-STACK DEVELOPMENT'), findsOneWidget);
      expect(find.text('PHYSICAL TRAINING & LIFESTYLE'), findsOneWidget);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. RESPONSIVENESS TESTS (320px to 430px)
  // ---------------------------------------------------------------------------
  group('Phase 5F — 5. RESPONSIVENESS Tests (320px to 430px)', () {
    final widths = [320.0, 360.0, 375.0, 390.0, 414.0, 430.0];
    late MockAnalyticsRepository analyticsRepo;
    late MockMistakeRepository mistakeRepo;

    setUp(() {
      analyticsRepo = MockAnalyticsRepository();
      analyticsRepo.seedData('test_user_1', const AnalyticsData(
        streakDays: 5,
        totalStudyDays: 10,
        totalFocusMinutes: 120,
        sessionCount: 2,
        dsaSolved: 25,
        dsaTotal: 455,
        devCompletedTopics: 2,
        devTotalTopics: 13,
      ));

      mistakeRepo = MockMistakeRepository();
      mistakeRepo.createMistake(const Mistake(
        id: 'resp_1',
        userId: 'test_user_1',
        question: 'Very Long Problem Title That Must Never Overflow The Responsive Card Boundary',
        subject: 'DSA',
        topic: 'Graph Algorithms',
        date: '2026-09-29',
        userAnswer: 'Long answer snippet testing wrapping bounds',
        correctAnswer: 'Correct invariant with mathematical notation',
        resolved: false,
      ));
    });

    for (final width in widths) {
      testWidgets('19. No horizontal overflow on MistakeBankScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: MistakeBankScreen(repository: mistakeRepo),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('20. No horizontal overflow on AnalyticsScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: AnalyticsScreen(repository: analyticsRepo),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('21. No horizontal overflow on MistakeDetailScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        final mistake = Mistake(
          id: 'resp_detail',
          userId: 'test_user_1',
          question: 'Ultra Wide Test Case Responsive Check',
          subject: 'Core CS',
          date: '2026-09-29',
          userAnswer: 'Short',
          correctAnswer: 'Detailed Explanation That Tests Narrow Viewport Wrapping Boundaries',
        );

        await tester.pumpWidget(
          MaterialApp(
            home: MistakeDetailScreen(
              initialMistake: mistake,
              repository: mistakeRepo,
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    }
  });
}
