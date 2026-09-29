import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';
import 'package:forge_app/features/gym/data/supabase_gym_repository.dart';
import 'package:forge_app/features/gym/domain/workout_session.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PART 19 — GYM_DUPLICATE_SESSION_REGRESSION_TEST', () {
    const testUserId = 'user_gym_dup_test_1430';
    const canonicalSessionId = '00000000-0000-0000-0000-000000000001';
    const workoutDate = '2026-09-28';

    setUp(() async {
      final store = LocalStore.instance;
      await store.clearUserStore(testUserId);
    });

    test('1. Multi-path hydration and refresh preserves exactly ONE workout session', () async {
      final store = LocalStore.instance;

      final sessionPayload = {
        'id': canonicalSessionId,
        'user_id': testUserId,
        'date': workoutDate,
        'day_of_week': 'Monday',
        'day_key': 'mon',
        'workout_type': 'Back + Biceps',
        'duration_minutes': 51,
        'status': 'completed',
        'gym_photo_path': 'gym-photos/$testUserId/2026/09/$canonicalSessionId.jpg',
        'total_volume_kg': 2155.0,
        'total_sets': 17,
        'total_reps': 142,
        'created_at': '2026-09-28T18:00:00Z',
      };

      // Step A: Hydration writes record under UUID
      await store.saveRecord(
        userId: testUserId,
        entityType: 'workout_session',
        entityId: canonicalSessionId,
        data: sessionPayload,
      );

      // Step B: Legacy or alternative path also wrote record under date string
      await store.saveRecord(
        userId: testUserId,
        entityType: 'workout_session',
        entityId: workoutDate,
        data: sessionPayload,
      );

      // Step C: Verify LocalStore contains 2 raw entries before repository deduplication
      final rawRecords = await store.getRecords(
        userId: testUserId,
        entityType: 'workout_session',
      );
      expect(rawRecords.length, equals(2));

      // Step D: SupabaseGymRepository loads history and enforces UUID-based deduplication
      final repo = SupabaseGymRepository(
        currentUserId: testUserId,
        localStore: store,
      );

      final history = await repo.getWorkoutHistory(userId: testUserId);

      // CRITICAL ASSERTION: Exactly ONE session must be returned, not two!
      expect(history.length, equals(1));
      expect(history.first.id, equals(canonicalSessionId));
      expect(history.first.workoutType, equals('Back + Biceps'));
      expect(history.first.durationMinutes, equals(51));
      expect(history.first.totalVolumeKg, equals(2155.0));
      expect(history.first.totalSets, equals(17));
    });

    test('2. Optimistic mutation + server response + realtime echo yields exactly ONE record', () async {
      final store = LocalStore.instance;
      final repo = SupabaseGymRepository(
        currentUserId: testUserId,
        localStore: store,
      );

      final newSession = WorkoutSession(
        id: canonicalSessionId,
        userId: testUserId,
        date: workoutDate,
        dayOfWeek: 'Monday',
        dayKey: 'mon',
        workoutType: 'Back + Biceps',
        durationMinutes: 51,
        status: 'completed',
        gymPhotoPath: 'gym-photos/$testUserId/2026/09/$canonicalSessionId.jpg',
        totalVolumeKg: 2155.0,
        totalSets: 17,
        totalReps: 142,
        createdAt: DateTime.parse('2026-09-28T18:00:00Z'),
        exercises: const [],
      );

      // 1. Optimistic write locally
      await repo.saveWorkoutSession(newSession);

      // 2. Simulated server response (overwrites/upserts with same ID)
      await repo.saveWorkoutSession(newSession);

      // 3. Simulated Realtime echo (same session payload arrives via subscription)
      await store.saveRecord(
        userId: testUserId,
        entityType: 'workout_session',
        entityId: canonicalSessionId,
        data: newSession.toJson(),
      );

      final history = await repo.getWorkoutHistory(userId: testUserId);

      // Must remain exactly ONE session
      expect(history.length, equals(1));
      expect(history.first.id, equals(canonicalSessionId));
    });
  });
}
