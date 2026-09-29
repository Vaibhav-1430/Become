import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';
import 'package:forge_app/core/utils/uuid_generator.dart';
import 'package:forge_app/features/gym/data/mock_gym_repository.dart';
import 'package:forge_app/features/gym/data/supabase_gym_repository.dart';
import 'package:forge_app/features/gym/domain/exercise.dart';
import 'package:forge_app/features/gym/domain/workout_session.dart';
import 'package:forge_app/features/gym/domain/workout_set.dart';
import 'package:forge_app/features/gym/domain/workout_template.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PART 20 — GYM_CRUD_TEST', () {
    const testUserId = 'user_gym_crud_1430';
    const altUserId = 'user_gym_isolation_9999';

    setUp(() async {
      final store = LocalStore.instance;
      await store.clearUserStore(testUserId);
      await store.clearUserStore(altUserId);
    });

    test('1. Create and retrieve custom exercise', () async {
      final repo = MockGymRepository(userId: testUserId);

      const customEx = Exercise(
        id: 'cust_ex_101',
        name: 'Incline Cable Fly',
        muscleGroup: 'Chest',
        category: 'Chest',
        equipment: 'Cable',
        defaultSets: 4,
        defaultReps: '12',
      );

      final added = await repo.addCustomExercise(customEx);
      expect(added.id, equals('cust_ex_101'));

      final allExercises = await repo.getAllExercises();
      expect(allExercises.any((e) => e.name == 'Incline Cable Fly'), isTrue);
    });

    test('2. Edit and save workout plan schedule', () async {
      final repo = MockGymRepository(userId: testUserId);
      final initialPlan = await repo.getWorkoutPlan();

      final newSchedule = Map<String, WorkoutTemplate>.from(initialPlan.schedule);
      final dayKey = initialPlan.schedule.keys.first;
      final currentTempl = newSchedule[dayKey]!;
      final updatedExercises = List<Exercise>.from(currentTempl.exercises)
        ..add(
          const Exercise(
            id: 'ex_cable_curl',
            name: 'Bicep Cable Curl',
            muscleGroup: 'Biceps',
            category: 'Biceps',
            equipment: 'Cable',
            defaultSets: 3,
            defaultReps: '12',
          ),
        );

      newSchedule[dayKey] = currentTempl.copyWith(exercises: updatedExercises);
      final updatedPlan = initialPlan.copyWith(schedule: newSchedule);

      final saved = await repo.saveWorkoutPlan(updatedPlan);
      expect(saved.schedule[dayKey]!.exercises.any((e) => e.name == 'Bicep Cable Curl'), isTrue);
    });

    test('3. Log workout sets and verify previous performance', () async {
      final repo = MockGymRepository(userId: testUserId);

      const testExerciseId = 'ex_ch_2';
      final prevBefore = await repo.getPreviousPerformance(testExerciseId);
      expect(prevBefore, isNotNull);
      expect(prevBefore!.isNotEmpty, isTrue);

      final set1 = WorkoutSet(
        id: 'set_1',
        workoutExerciseId: 'we_01',
        setNumber: 1,
        weightKg: 85.0,
        reps: 10,
        completed: true,
      );

      await repo.saveWorkoutSet(userId: testUserId, set: set1);
      final prevAfter = await repo.getPreviousPerformance(testExerciseId);
      expect(prevAfter, isNotNull);
      expect(prevAfter!.first.weightKg, equals(85.0));
    });

    test('4. Complete session with photo reference and fetch in history', () async {
      final store = LocalStore.instance;
      final repo = SupabaseGymRepository(
        currentUserId: testUserId,
        localStore: store,
      );

      final sid = UuidGenerator.v4();
      final photoPath = 'gym-photos/$testUserId/2026/09/$sid.jpg';

      final session = WorkoutSession(
        id: sid,
        userId: testUserId,
        date: '2026-09-29',
        dayOfWeek: 'Tuesday',
        dayKey: 'tue',
        workoutType: 'Legs + Core',
        durationMinutes: 45,
        status: 'completed',
        gymPhotoPath: photoPath,
        totalVolumeKg: 3500.0,
        totalSets: 15,
        totalReps: 150,
        createdAt: DateTime.now(),
        exercises: const [],
      );

      await repo.saveWorkoutSession(session);

      final history = await repo.getWorkoutHistory(userId: testUserId);
      expect(history.any((s) => s.id == sid), isTrue);
      final fetched = history.firstWhere((s) => s.id == sid);
      expect(fetched.gymPhotoPath, equals(photoPath));
      expect(fetched.status, equals('completed'));
    });

    test('5. Delete session cascades to local cache and removes workout card', () async {
      final store = LocalStore.instance;
      final repo = SupabaseGymRepository(
        currentUserId: testUserId,
        localStore: store,
      );

      final sid = UuidGenerator.v4();
      final session = WorkoutSession(
        id: sid,
        userId: testUserId,
        date: '2026-09-29',
        dayOfWeek: 'Tuesday',
        dayKey: 'tue',
        workoutType: 'Shoulders',
        durationMinutes: 30,
        status: 'completed',
        gymPhotoPath: '',
        totalVolumeKg: 1200.0,
        totalSets: 10,
        totalReps: 100,
        createdAt: DateTime.now(),
        exercises: const [],
      );

      await repo.saveWorkoutSession(session);
      var history = await repo.getWorkoutHistory(userId: testUserId);
      expect(history.any((s) => s.id == sid), isTrue);

      // Perform deletion
      await repo.deleteWorkoutSession(sid);

      // Verify deletion from history
      history = await repo.getWorkoutHistory(userId: testUserId);
      expect(history.any((s) => s.id == sid), isFalse);

      // Verify deletion from LocalStore
      final cached = await store.getRecord(
        userId: testUserId,
        entityType: 'workout_session',
        entityId: sid,
      );
      expect(cached, isNull);
    });

    test('6. Account isolation prevents cross-user gym history leakage', () async {
      final store = LocalStore.instance;

      final sessionA = WorkoutSession(
        id: UuidGenerator.v4(),
        userId: testUserId,
        date: '2026-09-29',
        dayOfWeek: 'Tuesday',
        dayKey: 'tue',
        workoutType: 'User A Routine',
        durationMinutes: 40,
        status: 'completed',
        gymPhotoPath: '',
        totalVolumeKg: 1000.0,
        totalSets: 8,
        totalReps: 80,
        createdAt: DateTime.now(),
        exercises: const [],
      );

      final repoA = SupabaseGymRepository(
        currentUserId: testUserId,
        localStore: store,
      );
      await repoA.saveWorkoutSession(sessionA);

      final repoB = SupabaseGymRepository(
        currentUserId: altUserId,
        localStore: store,
      );

      final historyB = await repoB.getWorkoutHistory(userId: altUserId);
      expect(historyB.any((s) => s.id == sessionA.id), isFalse);
    });

    test('7. Refresh method executes without error', () async {
      final repo = MockGymRepository(userId: testUserId);
      await expectLater(repo.refresh(), completes);
    });
  });
}
