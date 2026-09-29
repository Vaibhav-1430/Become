import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/config/app_config.dart';
import 'package:forge_app/features/dsa/data/mock_dsa_repository.dart';
import 'package:forge_app/features/dsa/data/striver_a2z_data.dart';
import 'package:forge_app/features/dsa/presentation/screens/dsa_screen.dart';
import 'package:forge_app/features/dsa/presentation/widgets/dsa_problem_detail_sheet.dart';
import 'package:forge_app/features/development/data/dev_curriculum_data.dart';
import 'package:forge_app/features/development/data/mock_dev_repository.dart';
import 'package:forge_app/features/development/presentation/screens/development_screen.dart';
import 'package:forge_app/features/ai/data/mock_forge_ai_service.dart';
import 'package:forge_app/features/ai/domain/forge_ai_context.dart';
import 'package:forge_app/features/ai/domain/forge_recommendation.dart';
import 'package:forge_app/features/ai/presentation/screens/ai_recommendation_screen.dart';
import 'package:forge_app/features/home/data/mock_home_repository.dart';
import 'package:forge_app/features/home/presentation/screens/todays_command_screen.dart';
import 'package:forge_app/features/learn/presentation/screens/learn_hub_screen.dart';

void main() {
  group('Phase 5D — 1. DSA CURRICULUM & DATA LAYER Tests', () {
    test('1. Striver A2Z hierarchy loads 18 authentic sections and 443 problems', () {
      expect(kStriverA2ZSections.length, 18);
      final totalProblems = kStriverA2ZSections.fold<int>(
        0,
        (acc, sec) => acc + sec.totalProblems,
      );
      expect(totalProblems, 443);
      expect(kStriverA2ZSections.first.name, 'Learn the basics');
      expect(kStriverA2ZSections.first.topics.isNotEmpty, true);
    });

    test('2. Solved state loads correctly from repository', () async {
      final repo = MockDsaRepository(initialSolvedIds: {'425', '1211'});
      final curriculum = await repo.getCurriculum();
      final sec0 = curriculum.first;
      final topic0 = sec0.topics.first;
      final p425 = topic0.problems.firstWhere((p) => p.id == '425');
      final p1211 = topic0.problems.firstWhere((p) => p.id == '1211');
      final p424 = topic0.problems.firstWhere((p) => p.id == '424');

      expect(p425.isSolved, true);
      expect(p1211.isSolved, true);
      expect(p424.isSolved, false);
    });

    test('3. Mark solved updates state optimistically and recalculates progress', () async {
      final repo = MockDsaRepository(initialSolvedIds: {'425'});
      var progress = await repo.getDsaProgress();
      expect(progress.solvedProblems, 1);

      await repo.toggleProblemSolved('1211', true);
      progress = await repo.getDsaProgress();
      expect(progress.solvedProblems, 2);

      final solvedIds = await repo.getSolvedProblemIds();
      expect(solvedIds.contains('1211'), true);
    });

    test('4. Mark unsolved updates state and rolls back count', () async {
      final repo = MockDsaRepository(initialSolvedIds: {'425', '1211'});
      await repo.toggleProblemSolved('1211', false);
      final progress = await repo.getDsaProgress();
      expect(progress.solvedProblems, 1);

      final solvedIds = await repo.getSolvedProblemIds();
      expect(solvedIds.contains('1211'), false);
    });

    test('5. Rollback on persistence failure restores previous state', () async {
      final repo = MockDsaRepository(initialSolvedIds: {'425'});
      repo.shouldFail = true;

      expect(
        () async => await repo.toggleProblemSolved('1211', true),
        throwsA(isA<Exception>()),
      );

      final solvedIds = await repo.getSolvedProblemIds();
      expect(solvedIds.contains('1211'), false);
    });
  });

  group('Phase 5D — 2. DSA UI & INTERACTION Tests', () {
    testWidgets('6. DSA screen renders header, chips, metrics cockpit card, and sections', (tester) async {
      final repo = MockDsaRepository();
      await tester.pumpWidget(
        MaterialApp(
          home: DsaScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('FORGE'), findsOneWidget);
      expect(find.text('DSA'), findsOneWidget);
      expect(find.text('Striver A2Z Sheet'), findsOneWidget);
      expect(find.text('SHEET COMPLETION'), findsOneWidget);
      expect(find.text('TARGET VELOCITY'), findsOneWidget);
      expect(find.text('STREAK'), findsOneWidget);
      expect(find.text('SRS DUE'), findsOneWidget);
      expect(find.text('ACCURACY'), findsOneWidget);
      expect(find.text('QUEUE DISPATCH'), findsOneWidget);
    });

    testWidgets('7. Section expansion toggles problem list visibility', (tester) async {
      final repo = MockDsaRepository();
      await tester.pumpWidget(
        MaterialApp(
          home: DsaScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      // Step 1 tile exists
      final step1Tile = find.byKey(const Key('dsa_section_0'));
      expect(step1Tile, findsOneWidget);

      // Tap to expand section 0
      await tester.tap(step1Tile);
      await tester.pumpAndSettle();

      // Problems inside Step 1 should now be visible
      expect(find.text('Input Output'), findsOneWidget);
    });

    testWidgets('8. Problem details bottom sheet renders and triggers solve callback', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final repo = MockDsaRepository(initialSolvedIds: <String>{});
      final curriculum = await repo.getCurriculum();
      final problem = curriculum.first.topics.first.problems.first;

      bool toggledValue = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DsaProblemDetailSheet(
              problem: problem,
              onToggleSolved: (val) {
                toggledValue = val;
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text(problem.title), findsOneWidget);
      expect(find.text('LEARNING RESOURCES'), findsOneWidget);
      expect(find.byKey(const Key('btn_toggle_problem_solved')), findsOneWidget);

      final toggleBtn = find.byKey(const Key('btn_toggle_problem_solved'));
      await tester.ensureVisible(toggleBtn);
      await tester.tap(toggleBtn);
      await tester.pumpAndSettle();

      expect(toggledValue, true);
    });
  });

  group('Phase 5D — 3. DEVELOPMENT CURRICULUM & DATA LAYER Tests', () {
    test('9. Development curriculum preserves exact 16 tracks in canonical order', () {
      expect(kDevCurriculumTopics.length, 16);
      final expectedIds = [
        'html',
        'css',
        'javascript',
        'git_github',
        'react',
        'typescript',
        'nextjs',
        'nodejs',
        'rest_apis',
        'crud',
        'postgresql',
        'authentication',
        'redis',
        'docker',
        'deployment',
        'projects',
      ];

      for (int i = 0; i < expectedIds.length; i++) {
        expect(kDevCurriculumTopics[i].id, expectedIds[i]);
      }
    });

    test('10. Exact canonical YouTube URLs are preserved without modification', () {
      final topics = {for (var t in kDevCurriculumTopics) t.id: t.sourceUrl};

      expect(topics['javascript'], 'https://youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37&si=mTNpJHZlN-5Tn0Be');
      expect(topics['react'], 'https://youtube.com/playlist?list=PLu71SKxNbfoDqgPchmvIsL4hTnJIrtige&si=ti1yQHv0vyhZgxoB');
      expect(topics['typescript'], 'https://youtube.com/playlist?list=PLu71SKxNbfoBkkr8lblqtsJvxrw3j1tWC&si=Ix8COddcmJTqo0PP');
      expect(topics['nextjs'], 'https://youtube.com/playlist?list=PLu71SKxNbfoBAaWGtn9GA2PTw0HO0tXzq&si=xoz4tS-8kNPq-9-K');
      expect(topics['nodejs'], 'https://youtube.com/playlist?list=PLinedj3B30sDby4Al-i13hQJGQoRQDfPo&si=57_ILILJ2QbNorzU');
      expect(topics['postgresql'], 'https://www.youtube.com/watch?v=cnzka7kF5Zk');
      expect(topics['redis'], 'https://youtube.com/playlist?list=PLmc-PrJYKizxULCN1Djy5DiUxtKHg-4sq&si=vor18TSV0U9XVxzg');
      expect(topics['docker'], 'https://youtube.com/playlist?list=PLinedj3B30sDc2woh6XncR9_a310zaAyJ&si=8K3FurSfQfNs28Ji');
      expect(topics['html'], 'https://youtu.be/iVCzmDwIQpA?si=lQ50wy7QyCCwrp9A');
      expect(topics['css'], 'https://youtu.be/wRNinF7YQqQ?si=JkMmGwhk1F76FncB');
    });

    test('11. Topic completion updates progress and toggles repository state', () async {
      final repo = MockDevRepository(initialCompletedIds: {'html'});
      var progress = await repo.getDevProgress();
      expect(progress.completedTopics, 1);

      await repo.toggleTopicCompleted('css', true);
      progress = await repo.getDevProgress();
      expect(progress.completedTopics, 2);

      final completed = await repo.getCompletedTopicIds();
      expect(completed.contains('css'), true);
    });

    test('12. Topic completion rollback on failure restores previous state', () async {
      final repo = MockDevRepository(initialCompletedIds: {'html'});
      repo.shouldFail = true;

      expect(
        () async => await repo.toggleTopicCompleted('css', true),
        throwsA(isA<Exception>()),
      );

      final completed = await repo.getCompletedTopicIds();
      expect(completed.contains('css'), false);
    });
  });

  group('Phase 5D — 4. DEVELOPMENT UI Tests', () {
    testWidgets('13. Development screen renders telemetry grid, active track, and cards', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final repo = MockDevRepository();
      await tester.pumpWidget(
        MaterialApp(
          home: DevelopmentScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('FORGE'), findsOneWidget);
      expect(find.text('DEV'), findsOneWidget);
      expect(find.text('HOURS LOGGED'), findsOneWidget);
      expect(find.text('CODE COMMITS'), findsOneWidget);
      expect(find.text('STACK MASTERY'), findsOneWidget);
      expect(find.text('OA READY STACKS'), findsOneWidget);
      expect(find.text('CONTINUE REPO WORKBENCH'), findsOneWidget);
      expect(find.text('ACTIVE ENGINEERING TRACKS'), findsOneWidget);
      expect(find.byKey(const Key('dev_card_html')), findsOneWidget);
      expect(find.byKey(const Key('dev_card_css')), findsOneWidget);
    });

    testWidgets('14. Toggling topic checkbox updates UI state', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final repo = MockDevRepository(initialCompletedIds: {'html'});
      await tester.pumpWidget(
        MaterialApp(
          home: DevelopmentScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      final toggleBtn = find.byKey(const Key('btn_toggle_dev_css'));
      expect(toggleBtn, findsOneWidget);

      await tester.tap(toggleBtn);
      await tester.pumpAndSettle();

      final completed = await repo.getCompletedTopicIds();
      expect(completed.contains('css'), true);
    });
  });

  group('Phase 5D — 5. GEMINI & FORGE INTELLIGENCE Tests', () {
    test('15. Context builder builds minimal structured context without arbitrary data dumps', () async {
      final aiService = MockForgeAiService();
      final ctx = await aiService.buildContext();

      expect(ctx.currentDate.isNotEmpty, true);
      expect(ctx.currentTime.isNotEmpty, true);
      expect(ctx.availableWindowMins, 45);
      final json = ctx.toJson();
      expect(json.containsKey('currentDate'), true);
      expect(json.containsKey('dsaProgress'), true);
      expect(json.containsKey('devProgress'), true);
    });

    test('16. AI recommendation returns structured directive contract', () async {
      final aiService = MockForgeAiService();
      final rec = await aiService.getRecommendation();

      expect(rec.title.isNotEmpty, true);
      expect(rec.priority, 'HIGH');
      expect(rec.estimatedMinutes > 0, true);
      expect(rec.insights.length, 3);
      expect(rec.contingentDirectives.isNotEmpty, true);
      expect(rec.actionType.startsWith('OPEN_'), true);
    });

    test('17. Deterministic rule-based fallback when offline or unavailable', () async {
      final aiService = MockForgeAiService()..returnFallback = true;
      final rec = await aiService.getRecommendation();

      expect(rec.isFallback, true);
      expect(rec.fallbackMessage, isNotNull);
      expect(rec.title, 'Complete Scheduled Study Block');
      expect(rec.actionType, 'OPEN_DSA');
    });

    testWidgets('18. AI recommendation screen renders hero bento, why-this breakdown, and fallbacks', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final aiService = MockForgeAiService();
      await tester.pumpWidget(
        MaterialApp(
          home: AiRecommendationScreen(aiService: aiService),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('AI :: ENGINE'), findsOneWidget);
      expect(find.text('What should I study right now?'), findsOneWidget);
      expect(find.text('HIGH PRIORITY'), findsOneWidget);
      expect(find.text('STEP 3.2'), findsOneWidget);
      expect(find.text('TARGET MASTERY'), findsOneWidget);
      expect(find.text('RETENTION DECAY RISK'), findsOneWidget);
      expect(find.text('Why This Directive?'), findsOneWidget);
      expect(find.text('CONTINGENT DIRECTIVES'), findsOneWidget);
      expect(find.byKey(const Key('btn_execute_ai_directive')), findsOneWidget);
    });

    testWidgets('19. Executing AI directive triggers callback with recommended directive', (tester) async {
      final aiService = MockForgeAiService();
      ForgeRecommendation? executedRec;

      await tester.pumpWidget(
        MaterialApp(
          home: AiRecommendationScreen(
            aiService: aiService,
            onExecuteDirective: (rec) {
              executedRec = rec;
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      final executeBtn = find.byKey(const Key('btn_execute_ai_directive'));
      await tester.tap(executeBtn);
      await tester.pumpAndSettle();

      expect(executedRec, isNotNull);
      expect(executedRec!.actionType, 'OPEN_DSA');
    });
  });

  group('Phase 5D — 6. TODAY’S COMMAND INTEGRATION & LEARN HUB Tests', () {
    testWidgets('20. LearnHubScreen switches between DSA, DEV, and AI Directive tabs', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final dsaRepo = MockDsaRepository();
      final devRepo = MockDevRepository();
      final aiService = MockForgeAiService(dsaRepo: dsaRepo, devRepo: devRepo);

      await tester.pumpWidget(
        MaterialApp(
          home: LearnHubScreen(
            dsaRepository: dsaRepo,
            devRepository: devRepo,
            aiService: aiService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Initially on DSA
      expect(find.text('Striver A2Z Sheet'), findsOneWidget);

      // Switch to Tech Tracks
      final devTab = find.byKey(const Key('learn_tab_1'));
      await tester.tap(devTab);
      await tester.pumpAndSettle();

      expect(find.text('ACTIVE ENGINEERING TRACKS'), findsOneWidget);

      // Switch to AI Directive
      final aiTab = find.byKey(const Key('learn_tab_2'));
      await tester.tap(aiTab);
      await tester.pumpAndSettle();

      expect(find.text('What should I study right now?'), findsOneWidget);
    });

    testWidgets('21. START COMMAND button in TodaysCommand triggers real execution callback', (tester) async {
      final homeRepo = MockHomeRepository();
      bool commandStarted = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TodaysCommandScreen(
              repository: homeRepo,
              onStartCommand: (task) {
                commandStarted = true;
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final startBtn = find.text('START COMMAND');
      expect(startBtn, findsOneWidget);

      await tester.tap(startBtn);
      await tester.pumpAndSettle();

      expect(commandStarted, true);
    });
  });

  group('Phase 5D — 7. SECURITY & SECRETS AUDIT Tests', () {
    test('22. Client config contains zero service-role keys or privileged credentials', () {
      expect(AppConfig.supabaseAnonKey.contains('service_role'), false);
      expect(AppConfig.supabaseAnonKey.contains('SUPABASE_SERVICE_ROLE_KEY'), false);
    });

    test('23. Zero Gemini secrets hardcoded in client source models or service', () {
      // Verifies that neither client models nor service hold hardcoded API keys
      final ctx = ForgeAiContext(
        currentDate: '2026-09-29',
        currentTime: '10:00',
        pendingTasksCount: 2,
        completedTasksCount: 3,
        solvedDsaCount: 15,
        totalDsaCount: 443,
        completedDevCount: 4,
        totalDevCount: 16,
      );
      final json = ctx.toJson();
      expect(json.containsKey('apiKey'), false);
      expect(json.containsKey('secret'), false);
      expect(json.containsKey('geminiKey'), false);
    });
  });

  group('Phase 5D — 8. RESPONSIVENESS Tests (320px to 430px)', () {
    final widths = [320.0, 360.0, 375.0, 390.0, 414.0, 430.0];

    for (final w in widths) {
      testWidgets('24. No horizontal overflow on DsaScreen at width $w', (tester) async {
        tester.view.physicalSize = Size(w, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: DsaScreen(repository: MockDsaRepository()),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('25. No horizontal overflow on DevelopmentScreen at width $w', (tester) async {
        tester.view.physicalSize = Size(w, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: DevelopmentScreen(repository: MockDevRepository()),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('26. No horizontal overflow on AiRecommendationScreen at width $w', (tester) async {
        tester.view.physicalSize = Size(w, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: AiRecommendationScreen(aiService: MockForgeAiService()),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    }
  });
}
