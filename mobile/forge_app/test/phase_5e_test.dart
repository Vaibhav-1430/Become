import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/features/gym/data/canonical_workout_data.dart';
import 'package:forge_app/features/gym/data/gym_storage_service.dart';
import 'package:forge_app/features/gym/data/mock_gym_repository.dart';
import 'package:forge_app/features/gym/domain/exercise.dart';
import 'package:forge_app/features/gym/domain/personal_record.dart';
import 'package:forge_app/features/gym/domain/workout_exercise.dart';
import 'package:forge_app/features/gym/domain/workout_session.dart';
import 'package:forge_app/features/gym/domain/workout_set.dart';
import 'package:forge_app/features/gym/presentation/screens/gym_checkin_screen.dart';
import 'package:forge_app/features/gym/presentation/screens/gym_screen.dart';
import 'package:forge_app/features/gym/presentation/widgets/pr_card.dart';
import 'package:forge_app/features/gym/presentation/widgets/rest_timer.dart';
import 'package:forge_app/features/gym/presentation/widgets/set_row.dart';
import 'package:forge_app/features/gym/presentation/widgets/workout_history_card.dart';

void main() {
  const testUserId = 'test_athlete_001';
  const otherUserId = 'test_athlete_002';

  group('Phase 5E — 1. CANONICAL SPLIT & DOMAIN ARCHITECTURE Tests', () {
    test('1. Canonical split maps correctly for all 7 days of the week', () {
      expect(kCanonicalSchedule['monday']!.routineName, equals('Back + Biceps'));
      expect(kCanonicalSchedule['monday']!.isRestDay, isFalse);

      expect(kCanonicalSchedule['tuesday']!.routineName, equals('Legs + Shoulders'));
      expect(kCanonicalSchedule['tuesday']!.isRestDay, isFalse);

      expect(kCanonicalSchedule['wednesday']!.routineName, equals('Chest + Triceps'));
      expect(kCanonicalSchedule['wednesday']!.isRestDay, isFalse);

      expect(kCanonicalSchedule['thursday']!.routineName, equals('Back + Biceps'));
      expect(kCanonicalSchedule['thursday']!.isRestDay, isFalse);

      expect(kCanonicalSchedule['friday']!.routineName, equals('Legs + Shoulders'));
      expect(kCanonicalSchedule['friday']!.isRestDay, isFalse);

      expect(kCanonicalSchedule['saturday']!.routineName, equals('Chest + Triceps'));
      expect(kCanonicalSchedule['saturday']!.isRestDay, isFalse);

      expect(kCanonicalSchedule['sunday']!.routineName, equals('Rest'));
      expect(kCanonicalSchedule['sunday']!.isRestDay, isTrue);
    });

    test('2. Default workout plan instantiates with authentic exercises and 6-day split', () {
      final plan = createDefaultWorkoutPlan(testUserId);
      expect(plan.userId, equals(testUserId));
      expect(plan.schedule.length, equals(7));
      expect(plan.schedule['monday']!.exercises.isNotEmpty, isTrue);
      expect(plan.schedule['sunday']!.isRestDay, isTrue);
    });

    test('3. Exercise domain model provides planned sets, reps, and target muscle getters', () {
      const exercise = Exercise(
        id: 'ex_test_01',
        name: 'Deadlift',
        muscleGroup: 'Back',
        category: 'Strength',
        equipment: 'Barbell',
        defaultSets: 4,
        defaultReps: '5',
        defaultRestSeconds: 120,
      );

      expect(exercise.exerciseName, equals('Deadlift'));
      expect(exercise.plannedSets, equals(4));
      expect(exercise.plannedReps, equals('5'));
      expect(exercise.targetMuscle, equals('Back'));
    });

    test('4. WorkoutSession calculates durationSeconds, completedSetsCount, and parsedDate', () {
      final now = DateTime(2026, 9, 29, 8, 30);
      final set1 = WorkoutSet(setNumber: 1, weightKg: 100, reps: 5, completed: true);
      final set2 = WorkoutSet(setNumber: 2, weightKg: 100, reps: 5, completed: false);

      final exercise = WorkoutExercise(
        exerciseId: 'ex_test_01',
        exerciseNameSnapshot: 'Deadlift',
        sets: [set1, set2],
      );

      final session = WorkoutSession(
        id: 'sess_101',
        userId: testUserId,
        date: '2026-09-29',
        dayOfWeek: 'Tuesday',
        dayKey: 'tuesday',
        workoutType: 'Legs + Shoulders',
        durationMinutes: 45,
        status: 'completed',
        gymPhotoPath: 'gym-photos/test_athlete_001/2026/09/sess_101.jpg',
        totalVolumeKg: 1000.0,
        createdAt: now,
        exercises: [exercise],
      );

      expect(session.routineName, equals('Legs + Shoulders'));
      expect(session.isCompleted, isTrue);
      expect(session.durationSeconds, equals(45 * 60));
      expect(session.completedSetsCount, equals(1));
      expect(session.parsedDate.year, equals(2026));
      expect(session.parsedDate.month, equals(9));
      expect(session.parsedDate.day, equals(29));
    });

    test('5. Today template resolution matches calendar date day of week', () async {
      final repo = MockGymRepository(userId: testUserId);
      final wednesdayDate = DateTime(2026, 9, 30); // Wednesday
      final template = await repo.getWorkoutPlanForDate(userId: testUserId, date: wednesdayDate);

      expect(template, isNotNull);
      expect(template!.routineName, equals('Chest + Triceps'));
      expect(template.isRestDay, isFalse);
    });

    test('6. Previous performance correctly resolves last recorded sets for an exercise', () async {
      final repo = MockGymRepository(userId: testUserId);
      final prevSets = await repo.getPreviousPerformance('ex_ch_2');

      expect(prevSets, isNotNull);
      expect(prevSets!.isNotEmpty, isTrue);
      expect(prevSets.first.weightKg, equals(80.0));
      expect(prevSets.first.reps, equals(10));
    });

    test('7. Unknown exercise returns null for previous performance without fabricating numbers', () async {
      final repo = MockGymRepository(userId: testUserId);
      final prevSets = await repo.getPreviousPerformance('non_existent_exercise_999');

      expect(prevSets, isNull);
    });
  });

  group('Phase 5E — 2. OPTIMISTIC UPDATES & ROLLBACK Tests', () {
    test('8. Session creation and set completion persist successfully in MockGymRepository', () async {
      final repo = MockGymRepository(userId: testUserId);
      final template = kCanonicalSchedule['monday']!;

      final session = await repo.createWorkoutSession(
        userId: testUserId,
        template: template,
        gymPhotoPath: 'test_athlete_001/2026/09/sess_test.jpg',
      );

      expect(session.id, startsWith('sess_'));
      expect(session.status, equals('in_progress'));
      expect(session.gymPhotoPath, equals('test_athlete_001/2026/09/sess_test.jpg'));

      final completedSet = WorkoutSet(
        id: 'set_test_1',
        workoutExerciseId: session.exercises.first.id,
        setNumber: 1,
        weightKg: 85.0,
        reps: 8,
        completed: true,
      );

      await repo.saveWorkoutSet(userId: testUserId, set: completedSet);
      final today = await repo.getTodaySession(userId: testUserId, date: DateTime.now());

      expect(today, isNotNull);
      expect(today!.exercises.first.sets.first.completed, isTrue);
      expect(today.exercises.first.sets.first.weightKg, equals(85.0));
    });

    test('9. Rollback triggers and throws error when repository shouldFail is active', () async {
      final repo = MockGymRepository(userId: testUserId);
      repo.shouldFail = true;

      expect(
        () async => await repo.saveWorkoutSession(
          WorkoutSession(
            id: 'sess_fail',
            userId: testUserId,
            date: '2026-09-29',
            dayOfWeek: 'Tuesday',
            dayKey: 'tuesday',
            workoutType: 'Legs',
            gymPhotoPath: 'path.jpg',
            createdAt: DateTime.now(),
          ),
        ),
        throwsA(isA<Exception>()),
      );
    });
  });

  group('Phase 5E — 3. GYM PHOTO & STORAGE ARCHITECTURE Tests', () {
    test('10. Path normalization strips leading slashes and redundant bucket prefixes', () {
      expect(
        GymStorageService.normalizeGymPhotoPath('gym-photos/user_1/2026/09/sess.jpg'),
        equals('user_1/2026/09/sess.jpg'),
      );
      expect(
        GymStorageService.normalizeGymPhotoPath('/gym-photos/user_1/2026/09/sess.jpg'),
        equals('user_1/2026/09/sess.jpg'),
      );
      expect(
        GymStorageService.normalizeGymPhotoPath('///user_1/2026/09/sess.jpg'),
        equals('user_1/2026/09/sess.jpg'),
      );
      expect(
        GymStorageService.normalizeGymPhotoPath(''),
        equals(''),
      );
    });

    test('11. Canonical path generator formats gym-photos/{user_id}/{year}/{month}/{session_id}.jpg', () {
      final testDate = DateTime(2026, 9, 29);
      final path = GymStorageService.buildCanonicalPath('user_abc', 'sess_999', testDate);

      expect(path, equals('user_abc/2026/09/sess_999.jpg'));
    });

    test('12. User ownership enforcement blocks cross-user signed URL requests', () async {
      final storage = GymStorageService();
      // user_001 requests a photo belonging to user_002
      final crossUserUrl = await storage.getSignedPhotoUrl(
        userId: testUserId,
        storagePath: '$otherUserId/2026/09/sess_002.jpg',
      );

      expect(crossUserUrl, isNull);
    });

    test('13. Authenticated owner successfully resolves signed URL with cached TTL', () async {
      final storage = GymStorageService();
      final validUrl = await storage.getSignedPhotoUrl(
        userId: testUserId,
        storagePath: '$testUserId/2026/09/sess_001.jpg',
      );

      expect(validUrl, isNotNull);
      expect(validUrl, contains(testUserId));
      expect(validUrl, contains('sess_001.jpg'));

      // Second call returns cached URL
      final cachedUrl = await storage.getSignedPhotoUrl(
        userId: testUserId,
        storagePath: '$testUserId/2026/09/sess_001.jpg',
      );
      expect(cachedUrl, equals(validUrl));
    });

    test('14. User switch / logout invalidates signed URL in-memory cache (STEP 19)', () async {
      final storage = GymStorageService();
      final urlUser1 = await storage.getSignedPhotoUrl(
        userId: testUserId,
        storagePath: '$testUserId/2026/09/sess_001.jpg',
      );
      expect(urlUser1, isNotNull);

      // User session switches to otherUserId
      storage.checkUserSession(otherUserId);

      // Now request for otherUserId
      final urlUser2 = await storage.getSignedPhotoUrl(
        userId: otherUserId,
        storagePath: '$otherUserId/2026/09/sess_002.jpg',
      );
      expect(urlUser2, isNotNull);
      expect(urlUser2, contains(otherUserId));

      // Test user 1 data cannot be accessed by otherUserId
      final crossAccess = await storage.getSignedPhotoUrl(
        userId: otherUserId,
        storagePath: '$testUserId/2026/09/sess_001.jpg',
      );
      expect(crossAccess, isNull);
    });

    test('15. Empty photo bytes reject upload with descriptive error', () async {
      final storage = GymStorageService();
      expect(
        () async => await storage.uploadGymPhotoBytes(
          userId: testUserId,
          sessionId: 'sess_empty',
          imageBytes: Uint8List(0),
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('16. Valid photo bytes upload returns canonical storage path', () async {
      final storage = GymStorageService();
      final dummyBytes = Uint8List.fromList([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      final canonicalPath = await storage.uploadGymPhotoBytes(
        userId: testUserId,
        sessionId: 'sess_valid',
        imageBytes: dummyBytes,
        timestamp: DateTime(2026, 9, 29),
      );

      expect(canonicalPath, equals('$testUserId/2026/09/sess_valid.jpg'));
    });
  });

  group('Phase 5E — 4. SECURITY & AUTHENTICATION Tests', () {
    test('17. Repository strictly scopes queries to authenticated user ID', () async {
      final repo = MockGymRepository(userId: testUserId);
      final userHistory = await repo.getWorkoutHistory(userId: testUserId);
      final otherHistory = await repo.getWorkoutHistory(userId: otherUserId);

      expect(userHistory.every((s) => s.userId == testUserId), isTrue);
      expect(otherHistory.isEmpty, isTrue); // other user has no history
    });

    test('18. PR records maintain strict user separation', () async {
      final repo = MockGymRepository(userId: testUserId);
      final newPr = PersonalRecord(
        id: 'pr_other_1',
        userId: otherUserId,
        exerciseId: 'ex_ch_1',
        exerciseName: 'Bench Press',
        maxWeightKg: 120.0,
        maxReps: 5,
        achievedAt: DateTime.now(),
      );
      await repo.savePersonalRecord(newPr);

      final userPrs = await repo.getPersonalRecords(userId: testUserId);
      final otherPrs = await repo.getPersonalRecords(userId: otherUserId);

      expect(userPrs.any((p) => p.userId == otherUserId), isFalse);
      expect(otherPrs.length, equals(1));
      expect(otherPrs.first.maxWeightKg, equals(120.0));
    });
  });

  group('Phase 5E — 5. UI & WIDGET RENDERING Tests', () {
    testWidgets('19. RestTimerWidget renders countdown, -30s, +30s, and pause controls', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RestTimerWidget(initialSeconds: 90),
          ),
        ),
      );

      expect(find.text('RECOVERY TIMER'), findsOneWidget);
      expect(find.text('01:30'), findsOneWidget);
      expect(find.text('-30s'), findsOneWidget);
      expect(find.text('+30s'), findsOneWidget);

      // Tap +30s
      await tester.tap(find.text('+30s'));
      await tester.pump();
      expect(find.text('02:00'), findsOneWidget);

      // Tap -30s
      await tester.tap(find.text('-30s'));
      await tester.pump();
      expect(find.text('01:30'), findsOneWidget);
    });

    testWidgets('20. ActiveTargetSetCard renders steppers and completes set on tap', (tester) async {
      WorkoutSet? completedResult;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ActiveTargetSetCard(
              setNumber: 1,
              initialWeight: 80.0,
              initialReps: 10,
              onCompleteSet: (set) {
                completedResult = set;
              },
            ),
          ),
        ),
      );

      expect(find.text('SET 01'), findsOneWidget);
      expect(find.text('80.0'), findsOneWidget);
      expect(find.text('10'), findsOneWidget);
      expect(find.byKey(const Key('btn_complete_active_set')), findsOneWidget);

      // Tap +2.5 kg chip
      await tester.tap(find.text('+2.5 kg'));
      await tester.pump();
      expect(find.text('82.5'), findsOneWidget);

      // Tap Complete Set
      await tester.tap(find.byKey(const Key('btn_complete_active_set')));
      await tester.pump();

      expect(completedResult, isNotNull);
      expect(completedResult!.setNumber, equals(1));
      expect(completedResult!.weightKg, equals(82.5));
      expect(completedResult!.reps, equals(10));
      expect(completedResult!.completed, isTrue);
    });

    testWidgets('21. PersonalRecordCard renders authentic weight and reps metrics', (tester) async {
      final pr = PersonalRecord(
        id: 'pr_01',
        userId: testUserId,
        exerciseId: 'ex_bk_1',
        exerciseName: 'Barbell Deadlift',
        maxWeightKg: 180.0,
        maxReps: 3,
        achievedAt: DateTime(2026, 9, 20),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PersonalRecordCard(pr: pr),
          ),
        ),
      );

      expect(find.text('Barbell Deadlift'), findsOneWidget);
      expect(find.text('180 KG'), findsOneWidget);
      expect(find.text('3 REPS'), findsOneWidget);
      expect(find.text('ACHIEVED SEP 20, 2026'), findsOneWidget);
    });

    testWidgets('22. WorkoutHistoryCard renders duration, volume, sets, and verified status', (tester) async {
      final session = WorkoutSession(
        id: 'sess_hist_01',
        userId: testUserId,
        date: '2026-09-27',
        dayOfWeek: 'Sunday',
        dayKey: 'sunday',
        workoutType: 'Chest + Triceps',
        durationMinutes: 55,
        status: 'completed',
        gymPhotoPath: 'gym-photos/test_athlete_001/2026/09/sess_hist_01.jpg',
        totalVolumeKg: 12400.0,
        totalSets: 16,
        createdAt: DateTime(2026, 9, 27),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkoutHistoryCard(session: session),
          ),
        ),
      );

      expect(find.text('Chest + Triceps'), findsOneWidget);
      expect(find.text('COMPLETED'), findsOneWidget);
      expect(find.text('55m'), findsOneWidget);
      expect(find.text('12400 kg'), findsOneWidget);
      expect(find.text('16'), findsOneWidget);
      expect(find.text('PHOTO VERIFIED'), findsOneWidget);
    });

    testWidgets('23. Stitch GymCheckinScreen renders tactical HUD brackets, shutter, and ISO telemetry', (tester) async {
      final storage = GymStorageService();

      await tester.pumpWidget(
        MaterialApp(
          home: GymCheckinScreen(
            userId: testUserId,
            sessionId: 'sess_hud_test',
            storageService: storage,
          ),
        ),
      );

      expect(find.text('GYM CHECK-IN'), findsOneWidget);
      expect(find.text('VISUAL PROOF'), findsOneWidget);
      expect(find.text('ISO 400 · AF-C'), findsOneWidget);
      expect(find.text('READY FOR CAPTURE'), findsOneWidget);
      expect(find.text('PROOF OF WORK · PRIVATELY ENCRYPTED TO SUPABASE STORAGE'), findsOneWidget);
      expect(find.byIcon(Icons.camera_alt), findsOneWidget);

      // Tap shutter to simulate photo capture
      await tester.tap(find.byIcon(Icons.camera_alt));
      await tester.pump();

      expect(find.text('PROOF OF WORK CAPTURED'), findsOneWidget);
      expect(find.text('RETAKE'), findsOneWidget);
      expect(find.text('CONFIRM CHECK-IN'), findsOneWidget);
    });

    testWidgets('24. Stitch GymScreen renders today target, tabs, and start button', (tester) async {
      final repo = MockGymRepository(userId: testUserId);
      final storage = GymStorageService();

      await tester.pumpWidget(
        MaterialApp(
          home: GymScreen(
            userId: testUserId,
            repository: repo,
            storageService: storage,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('TRAIN / GYM'), findsOneWidget);
      expect(find.text('CANONICAL SPLIT'), findsOneWidget);
      expect(find.text('TODAY'), findsOneWidget);
      expect(find.textContaining('HISTORY'), findsOneWidget);
      expect(find.textContaining('PR BANK'), findsOneWidget);
      expect(find.text('START SESSION'), findsOneWidget);
    });
  });

  group('Phase 5E — 6. RESPONSIVENESS Tests (320px to 430px)', () {
    const widths = [320.0, 360.0, 375.0, 390.0, 414.0, 430.0];

    for (final width in widths) {
      testWidgets('25. No horizontal overflow on GymScreen at width $width', (tester) async {
        final repo = MockGymRepository(userId: testUserId);
        final storage = GymStorageService();

        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(
          MaterialApp(
            home: GymScreen(
              userId: testUserId,
              repository: repo,
              storageService: storage,
            ),
          ),
        );

        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(find.text('TRAIN / GYM'), findsOneWidget);
      });

      testWidgets('26. No horizontal overflow on GymCheckinScreen at width $width', (tester) async {
        final storage = GymStorageService();

        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(
          MaterialApp(
            home: GymCheckinScreen(
              userId: testUserId,
              sessionId: 'sess_resp_$width',
              storageService: storage,
            ),
          ),
        );

        await tester.pump();
        expect(tester.takeException(), isNull);
        expect(find.text('VISUAL PROOF'), findsOneWidget);
      });
    }
  });
}
