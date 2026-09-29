import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/features/career/data/mock_career_repository.dart';
import 'package:forge_app/features/career/domain/internship.dart';
import 'package:forge_app/features/career/domain/placement_readiness.dart';
import 'package:forge_app/features/career/presentation/screens/career_screen.dart';
import 'package:forge_app/features/career/presentation/screens/internship_detail_screen.dart';
import 'package:forge_app/features/career/presentation/widgets/add_edit_internship_sheet.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // ---------------------------------------------------------------------------
  // 1. INTERNSHIP DOMAIN & STATUS ENUM TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5G — 1. INTERNSHIP DOMAIN & STATUS TESTS', () {
    test('1. Status constants, display labels, and badges', () {
      expect(InternshipStatus.all, [
        'SAVED',
        'APPLIED',
        'OA',
        'INTERVIEW',
        'SELECTED',
        'REJECTED',
      ]);

      expect(InternshipStatus.displayName(InternshipStatus.saved), 'Saved');
      expect(InternshipStatus.displayName(InternshipStatus.applied), 'Applied');
      expect(InternshipStatus.displayName(InternshipStatus.oa), 'Online Assessment (OA)');
      expect(InternshipStatus.displayName(InternshipStatus.interview), 'Interview Round');
      expect(InternshipStatus.displayName(InternshipStatus.selected), 'Selected 🎉');
      expect(InternshipStatus.displayName(InternshipStatus.rejected), 'Rejected');

      expect(InternshipStatus.badgeLabel(InternshipStatus.saved), 'SAVED');
      expect(InternshipStatus.badgeLabel(InternshipStatus.applied), 'APPLIED');
      expect(InternshipStatus.badgeLabel(InternshipStatus.oa), 'OA STAGE');
      expect(InternshipStatus.badgeLabel(InternshipStatus.interview), 'TECH ROUND');
      expect(InternshipStatus.badgeLabel(InternshipStatus.selected), 'OFFER 🎉');
      expect(InternshipStatus.badgeLabel(InternshipStatus.rejected), 'REJECTED');
    });

    test('2. Internship JSON round-trip serialization', () {
      final json = {
        'id': 'test-app-001',
        'user_id': 'user_123',
        'company': 'Google',
        'role': 'Software Engineering Intern',
        'date_applied': '2026-09-29',
        'status': 'APPLIED',
        'link': 'https://careers.google.com/jobs/123',
        'notes': 'Referred by mentor; focus on Trees & Graphs',
        'created_at': '2026-09-29T10:00:00.000Z',
        'updated_at': '2026-09-29T12:00:00.000Z',
      };

      final internship = Internship.fromJson(json);
      expect(internship.id, 'test-app-001');
      expect(internship.userId, 'user_123');
      expect(internship.company, 'Google');
      expect(internship.role, 'Software Engineering Intern');
      expect(internship.dateApplied, '2026-09-29');
      expect(internship.status, 'APPLIED');
      expect(internship.link, 'https://careers.google.com/jobs/123');
      expect(internship.notes, 'Referred by mentor; focus on Trees & Graphs');
      expect(internship.isApplied, isTrue);
      expect(internship.isActive, isTrue);

      final serialized = internship.toJson(includeId: true, forCloud: false);
      expect(serialized['id'], 'test-app-001');
      expect(serialized['company'], 'Google');
      expect(serialized['status'], 'APPLIED');
      expect(serialized['notes'], 'Referred by mentor; focus on Trees & Graphs');
    });

    test('3. Internship copyWith immutability and equality', () {
      const original = Internship(
        id: '1',
        userId: 'u1',
        company: 'Stripe',
        role: 'Backend Intern',
        dateApplied: '2026-09-01',
        status: 'APPLIED',
      );

      final updated = original.copyWith(
        status: 'INTERVIEW',
        notes: 'Round 1 System Design Scheduled',
      );

      expect(original.status, 'APPLIED');
      expect(updated.status, 'INTERVIEW');
      expect(updated.isInterview, isTrue);
      expect(updated.notes, 'Round 1 System Design Scheduled');
      expect(updated.company, 'Stripe');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PLACEMENT READINESS CALCULATION TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5G — 2. PLACEMENT READINESS ENGINE TESTS', () {
    test('4. Empty data returns zero readiness and NOT ENOUGH DATA status', () {
      final emptyReadiness = PlacementReadiness.compute();

      expect(emptyReadiness.overallScore, 0);
      expect(emptyReadiness.statusLabel, '[NOT ENOUGH DATA]');
      expect(emptyReadiness.hasAnyData, isFalse);
      expect(emptyReadiness.pillars.length, 8);
      // All pillars should have hasData false
      for (final pillar in emptyReadiness.pillars) {
        expect(pillar.hasData, isFalse);
      }
    });

    test('5. Authentic calculation from audited web formula with real telemetry', () {
      final readiness = PlacementReadiness.compute(
        dsaSolved: 240,
        dsaTotal: 443,
        devCompletedTopics: 10,
        devTotalTopics: 13,
        projectsCompleted: 3,
        projectsInProgress: 1,
        coreTopicsDone: 35,
        coreTopicsTotal: 45,
        sysDesignTopicsDone: 10,
        sysDesignTopicsTotal: 15,
        mockInterviewsCount: 2,
        questionsPracticed: 20,
        questionsMastered: 18,
        weeklyTestsCompleted: 5,
        weeklyTestAvgAccuracy: 88.0,
      );

      expect(readiness.overallScore, greaterThan(60));
      expect(readiness.pillars.every((p) => p.hasData), isTrue);

      final dsaPillar = readiness.pillars.firstWhere((p) => p.key == 'dsa');
      expect(dsaPillar.percent, isNotNull);
      expect(dsaPillar.percent!, greaterThanOrEqualTo(50));

      final devPillar = readiness.pillars.firstWhere((p) => p.key == 'dev');
      expect(devPillar.percent, isNotNull);
      expect(devPillar.percent!, greaterThanOrEqualTo(70));

      // Diagnostics check
      expect(readiness.diagnostics.length, 4);
      expect(readiness.nextAction, isNotEmpty);
    });

    test('6. PlacementTarget JSON round-trip', () {
      const target = PlacementTarget(
        achieved: false,
        placedDate: '2026-12-01',
        company: 'Google',
        role: 'Founding Engineer / SDE-1',
        packageVal: '45 LPA',
        note: 'Targeting Bangalore HQ',
      );

      final json = target.toJson();
      final recovered = PlacementTarget.fromJson(json);

      expect(recovered.company, 'Google');
      expect(recovered.role, 'Founding Engineer / SDE-1');
      expect(recovered.packageVal, '45 LPA');
      expect(recovered.placedDate, '2026-12-01');
      expect(recovered.note, 'Targeting Bangalore HQ');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. CAREER REPOSITORY CRUD & PIPELINE STATS TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5G — 3. CAREER REPOSITORY & PIPELINE STATS TESTS', () {
    late MockCareerRepository repo;

    setUp(() {
      repo = MockCareerRepository(userId: 'test_user_alpha');
    });

    test('7. Unauthenticated access rejected', () async {
      final unauthRepo = MockCareerRepository(userId: '');
      expect(() => unauthRepo.getInternships(), throwsStateError);
      expect(
        () => unauthRepo.createInternship(const Internship(company: 'Co', role: 'Role')),
        throwsStateError,
      );
    });

    test('8. Full CRUD operations with status persistence', () async {
      // 1. Create
      final app = await repo.createInternship(const Internship(
        company: 'Uber',
        role: 'SWE Intern',
        dateApplied: '2026-09-29',
        status: 'APPLIED',
        link: 'https://uber.com/jobs/swe-intern',
        notes: 'Referral sent via LinkedIn',
      ));

      expect(app.id, isNotEmpty);
      expect(app.company, 'Uber');
      expect(app.status, 'APPLIED');
      expect(app.userId, 'test_user_alpha');

      // 2. Read
      final list = await repo.getInternships();
      expect(list.length, 1);
      expect(list.first.company, 'Uber');

      final fetched = await repo.getInternshipById(app.id);
      expect(fetched, isNotNull);
      expect(fetched!.role, 'SWE Intern');

      // 3. Update Status
      final updated = await repo.updateInternship(
        fetched.copyWith(status: 'OA', notes: 'OA Link received, 70 min duration'),
      );
      expect(updated.status, 'OA');
      expect(updated.notes, contains('OA Link received'));

      final refetched = await repo.getInternshipById(app.id);
      expect(refetched!.status, 'OA');

      // 4. Delete
      await repo.deleteInternship(app.id);
      final afterDelete = await repo.getInternships();
      expect(afterDelete, isEmpty);
    });

    test('9. Pipeline statistics correctly compute breakdown', () async {
      await repo.createInternship(const Internship(company: 'A', role: 'R', status: 'SAVED'));
      await repo.createInternship(const Internship(company: 'B', role: 'R', status: 'APPLIED'));
      await repo.createInternship(const Internship(company: 'C', role: 'R', status: 'OA'));
      await repo.createInternship(const Internship(company: 'D', role: 'R', status: 'INTERVIEW'));
      await repo.createInternship(const Internship(company: 'E', role: 'R', status: 'SELECTED'));
      await repo.createInternship(const Internship(company: 'F', role: 'R', status: 'REJECTED'));

      final stats = await repo.getPipelineStats();

      expect(stats.total, 6);
      expect(stats.saved, 1);
      expect(stats.oaStage, 1);
      expect(stats.techRound, 1);
      expect(stats.offers, 1);
      expect(stats.rejected, 1);
      // Active = SAVED + APPLIED + OA + INTERVIEW = 4
      expect(stats.active, 4);
    });

    test('10. Filter by status and search query', () async {
      await repo.createInternship(const Internship(company: 'Microsoft', role: 'SWE', status: 'APPLIED'));
      await repo.createInternship(const Internship(company: 'Amazon', role: 'SDE', status: 'INTERVIEW'));
      await repo.createInternship(const Internship(company: 'Apple', role: 'iOS Intern', status: 'APPLIED'));

      final appliedList = await repo.getInternships(statusFilter: 'APPLIED');
      expect(appliedList.length, 2);
      expect(appliedList.every((a) => a.status == 'APPLIED'), isTrue);

      final searchList = await repo.getInternships(searchQuery: 'Amazon');
      expect(searchList.length, 1);
      expect(searchList.first.company, 'Amazon');
    });

    test('11. Target save and retrieval', () async {
      const target = PlacementTarget(
        company: 'MAANG / TIER-1',
        role: 'Full Stack Engineer',
        packageVal: '35 LPA',
      );

      await repo.updatePlacementTarget(target);
      final retrieved = await repo.getPlacementTarget();

      expect(retrieved.company, 'MAANG / TIER-1');
      expect(retrieved.role, 'Full Stack Engineer');
      expect(retrieved.packageVal, '35 LPA');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. MULTI-ACCOUNT USER ISOLATION & CACHE INVALIDATION
  // ---------------------------------------------------------------------------
  group('Phase 5G — 4. SECURITY & USER ISOLATION TESTS', () {
    test('12. Strict account isolation and cache invalidation on user switch', () async {
      final repo = MockCareerRepository(userId: 'account_A');

      // Account A creates 2 applications
      await repo.createInternship(const Internship(company: 'Corp Alpha', role: 'Dev', status: 'APPLIED'));
      await repo.createInternship(const Internship(company: 'Corp Beta', role: 'Dev', status: 'INTERVIEW'));

      var listA = await repo.getInternships();
      expect(listA.length, 2);

      // Switch to Account B
      repo.setUserId('account_B');

      // Account B should see ZERO applications from Account A
      var listB = await repo.getInternships();
      expect(listB, isEmpty);

      final statsB = await repo.getPipelineStats();
      expect(statsB.total, 0);

      // Account B creates their own application
      await repo.createInternship(const Internship(company: 'Corp Gamma', role: 'QA', status: 'SAVED'));
      listB = await repo.getInternships();
      expect(listB.length, 1);
      expect(listB.first.company, 'Corp Gamma');

      // Switch back to Account A
      repo.setUserId('account_A');

      // Account A data must be intact with zero cross-contamination
      listA = await repo.getInternships();
      expect(listA.length, 2);
      expect(listA.any((a) => a.company == 'Corp Gamma'), isFalse);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. UI & PRESENTATION TESTS
  // ---------------------------------------------------------------------------
  group('Phase 5G — 5. UI & PRESENTATION TESTS', () {
    late MockCareerRepository repo;

    setUp(() {
      repo = MockCareerRepository(userId: 'ui_tester_01');
    });

    testWidgets('13. CareerScreen renders empty state when zero applications exist', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: CareerScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('CAREER // READINESS'), findsOneWidget);
      expect(find.text('NO APPLICATIONS TRACKED YET'), findsOneWidget);
      expect(find.text('LOG APP'), findsOneWidget);
    });

    testWidgets('14. CareerScreen renders HUD telemetry, readiness gauge, and application cards', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await repo.createInternship(const Internship(
        company: 'NVIDIA',
        role: 'Deep Learning Intern',
        dateApplied: '2026-09-29',
        status: 'APPLIED',
      ));
      await repo.createInternship(const Internship(
        company: 'Stripe',
        role: 'Core Systems',
        dateApplied: '2026-09-20',
        status: 'INTERVIEW',
      ));

      await tester.pumpWidget(
        MaterialApp(
          home: CareerScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('CAREER // READINESS'), findsOneWidget);
      expect(find.text('COMMAND TELEMETRY'), findsOneWidget);
      expect(find.text('NVIDIA'), findsOneWidget);
      expect(find.text('Stripe'), findsOneWidget);
      expect(find.textContaining('ACTIVE PIPELINE'), findsOneWidget);
    });

    testWidgets('15. Status filter chip interaction filters application list', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await repo.createInternship(const Internship(company: 'Atlassian', role: 'Full Stack', status: 'APPLIED'));
      await repo.createInternship(const Internship(company: 'Datadog', role: 'DevOps', status: 'INTERVIEW'));

      await tester.pumpWidget(
        MaterialApp(
          home: CareerScreen(repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Atlassian'), findsOneWidget);
      expect(find.text('Datadog'), findsOneWidget);

      // Tap TECH ROUND filter chip
      final interviewChip = find.textContaining('TECH ROUND');
      expect(interviewChip, findsWidgets);
      await tester.tap(interviewChip.first);
      await tester.pumpAndSettle();

      expect(find.text('Datadog'), findsOneWidget);
      expect(find.text('Atlassian'), findsNothing);
    });

    testWidgets('16. AddEditInternshipSheet form validation requires company and role', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AddEditInternshipSheet(
              onSave: (item) async {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Commit button without entering company
      final commitBtn = find.text('SAVE APPLICATION');
      expect(commitBtn, findsOneWidget);
      await tester.ensureVisible(commitBtn);
      await tester.tap(commitBtn);
      await tester.pumpAndSettle();

      expect(find.text('Company name is required'), findsOneWidget);
    });

    testWidgets('17. AddEditInternshipSheet successfully creates new application', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AddEditInternshipSheet(
              onSave: (item) async {
                await repo.createInternship(item);
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Enter company and role
      final textFields = find.byType(TextField);
      expect(textFields, findsWidgets);

      await tester.enterText(textFields.at(0), 'Microsoft');
      await tester.enterText(textFields.at(1), 'Software Engineer Intern');

      final commitBtn = find.text('SAVE APPLICATION');
      await tester.ensureVisible(commitBtn);
      await tester.tap(commitBtn);
      await tester.pumpAndSettle();

      final list = await repo.getInternships();
      expect(list.length, 1);
      expect(list.first.company, 'Microsoft');
      expect(list.first.role, 'Software Engineer Intern');
    });

    testWidgets('18. InternshipDetailScreen renders details and updates status', (tester) async {
      final app = await repo.createInternship(const Internship(
        company: 'Goldman Sachs',
        role: 'Summer Analyst',
        dateApplied: '2026-09-15',
        status: 'APPLIED',
        notes: 'Hackerrank assessment pending',
      ));

      await tester.pumpWidget(
        MaterialApp(
          home: InternshipDetailScreen(
            initialInternship: app,
            repository: repo,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Goldman Sachs'), findsOneWidget);
      expect(find.text('Summer Analyst'), findsOneWidget);
      expect(find.text('Hackerrank assessment pending'), findsOneWidget);

      // Advance status to OA
      final oaStatusBtn = find.textContaining('OA');
      expect(oaStatusBtn, findsWidgets);
      await tester.tap(oaStatusBtn.first);
      await tester.pumpAndSettle();

      final updated = await repo.getInternshipById(app.id);
      expect(updated!.status, 'OA');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. RESPONSIVE VERIFICATION TESTS (320px to 430px)
  // ---------------------------------------------------------------------------
  group('Phase 5G — 6. RESPONSIVENESS Tests (320px to 430px)', () {
    const widths = [320.0, 360.0, 375.0, 390.0, 414.0, 430.0];
    late MockCareerRepository repo;

    setUp(() async {
      repo = MockCareerRepository(userId: 'resp_tester');
      await repo.createInternship(const Internship(
        company: 'Very Long Enterprise Technology Corporation International',
        role: 'Lead Systems Software Engineering Resident Specialist',
        dateApplied: '2026-09-29',
        status: 'INTERVIEW',
        notes: 'Extremely detailed technical preparation notes testing responsive card text bounds',
      ));
    });

    for (final width in widths) {
      testWidgets('19. No horizontal overflow on CareerScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: CareerScreen(repository: repo),
          ),
        );
        await tester.pumpAndSettle();

        final ex = tester.takeException();
        expect(ex, isNull);
      });

      testWidgets('20. No horizontal overflow on InternshipDetailScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        final app = (await repo.getInternships()).first;

        await tester.pumpWidget(
          MaterialApp(
            home: InternshipDetailScreen(
              initialInternship: app,
              repository: repo,
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('21. No horizontal overflow on AddEditInternshipSheet at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: AddEditInternshipSheet(
                onSave: (item) async {},
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    }
  });
}
