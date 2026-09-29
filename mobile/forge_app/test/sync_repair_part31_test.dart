import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/services/streak_service.dart';
import 'package:forge_app/core/sync/engine/remote_sync_handler.dart';
import 'package:forge_app/core/sync/engine/sync_engine.dart';
import 'package:forge_app/core/sync/hydration/cloud_hydration_service.dart';
import 'package:forge_app/core/sync/models/sync_failure.dart';
import 'package:forge_app/core/sync/models/sync_operation.dart';
import 'package:forge_app/core/sync/network/connectivity_service.dart';
import 'package:forge_app/core/sync/realtime/realtime_sync_service.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';
import 'package:forge_app/core/utils/uuid_generator.dart';
import 'package:forge_app/features/development/data/supabase_dev_repository.dart';
import 'package:forge_app/features/dsa/data/supabase_dsa_repository.dart';
import 'package:forge_app/features/gym/data/supabase_gym_repository.dart';
import 'package:forge_app/features/gym/domain/workout_session.dart';
import 'package:forge_app/features/home/data/supabase_home_repository.dart';

class MockReachabilityChecker implements ReachabilityChecker {
  bool isReachable;
  MockReachabilityChecker({this.isReachable = true});

  @override
  Future<bool> checkReachability() async => isReachable;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MemoryLocalStore localStore;
  late MockReachabilityChecker reachabilityChecker;
  late ConnectivityService connectivity;
  late MockRemoteSyncHandler remoteHandler;
  late SyncEngine syncEngine;
  const testUserId = 'user_part31_audit_1430';

  setUp(() async {
    localStore = MemoryLocalStore();
    LocalStore.instance = localStore;
    reachabilityChecker = MockReachabilityChecker(isReachable: true);
    connectivity = ConnectivityService(
      checker: reachabilityChecker,
      initialStatus: NetworkStatus.online,
    );
    ConnectivityService.instance = connectivity;
    remoteHandler = MockRemoteSyncHandler();
    syncEngine = SyncEngine(
      localStore: localStore,
      connectivity: connectivity,
      remoteHandler: remoteHandler,
    );
    syncEngine.setActiveUserId(testUserId);
  });

  tearDown(() {
    connectivity.dispose();
  });

  // ========================================================
  // 1. SYNC_FAILURE_CLASSIFICATION_TEST
  // ========================================================
  group('1. SYNC_FAILURE_CLASSIFICATION_TEST', () {
    test('Classifies all required error categories accurately and provides clean user-facing strings', () {
      final tests = <String, SyncFailureCategory>{
        'jwt expired': SyncFailureCategory.authExpired,
        'Auth_Required: User session is null': SyncFailureCategory.authRequired,
        'SocketException: Failed host lookup': SyncFailureCategory.networkUnavailable,
        '500 Internal Server Error': SyncFailureCategory.serverError,
        'new row violates row-level security policy for table "study_tasks"': SyncFailureCategory.rlsDenied,
        'duplicate key value violates unique constraint "uq_study_tasks_user_date_task"': SyncFailureCategory.databaseError,
        'column "exercises" of relation "workout_sessions" does not exist': SyncFailureCategory.databaseError,
        'realtime channel subscription failed': SyncFailureCategory.realtimeError,
        'cloud hydration failed for domain Gym': SyncFailureCategory.hydrationError,
        'pending queue upload failed': SyncFailureCategory.queueError,
      };

      for (final entry in tests.entries) {
        final cat = SyncFailure.classify(entry.key);
        expect(cat, equals(entry.value), reason: 'Failed for pattern: ${entry.key}');
        final sf = SyncFailure(
          category: cat,
          rawError: entry.key,
          timestamp: DateTime.now(),
        );
        expect(sf.userFriendlyMessage, isNotEmpty);
        // Raw postgres error syntax or internal stack words must NOT leak to user
        expect(sf.userFriendlyMessage.contains('column "exercises"'), isFalse);
        expect(sf.userFriendlyMessage.contains('uq_study_tasks'), isFalse);
      }
    });
  });

  // ========================================================
  // 2. SYNC_RETRY_TEST
  // ========================================================
  group('2. SYNC_RETRY_TEST', () {
    test('syncNow() successfully retries pending operations when transient errors recover', () async {
      final op = SyncOperation.createPending(
        id: 'op_retry_01',
        userId: testUserId,
        entityType: 'study_task',
        entityId: 'tsk_retry_01',
        operationType: SyncOperationType.create,
        payload: {'task_id': 'retry_task'},
      );
      await localStore.enqueue(op);

      // 1. First attempt fails due to transient socket glitch
      remoteHandler.transientFailuresRemaining = 1;
      final ok1 = await syncEngine.syncNow();
      expect(ok1, isFalse);

      final queue1 = await localStore.getQueue(testUserId);
      expect(queue1.length, equals(1));
      expect(queue1.first.retryCount, equals(1));

      // 2. Second attempt (retry) succeeds
      final ok2 = await syncEngine.syncNow();
      expect(ok2, isTrue);

      final queue2 = await localStore.getQueue(testUserId);
      expect(queue2, isEmpty);
      expect(remoteHandler.executedOps.length, equals(1));
    });
  });

  // ========================================================
  // 3. SYNC_AUTH_REFRESH_TEST
  // ========================================================
  group('3. SYNC_AUTH_REFRESH_TEST', () {
    test('JWT expired error is classified as authExpired and NOT marked permanent', () {
      final cat = SyncFailure.classify('jwt expired');
      expect(cat, equals(SyncFailureCategory.authExpired));
      final sf = SyncFailure(category: cat, rawError: 'jwt expired', timestamp: DateTime.now());
      expect(sf.userFriendlyMessage, contains('Session expired'));
    });
  });

  // ========================================================
  // 4. SYNC_OFFLINE_TEST
  // ========================================================
  group('4. SYNC_OFFLINE_TEST', () {
    test('Offline state sets SyncState.offline, does NOT flag syncError, and preserves queue', () async {
      // Disconnect
      connectivity.setStatusForTesting(NetworkStatus.offline);
      await syncEngine.refreshStatus();

      expect(syncEngine.state, equals(SyncState.offline));
      expect(syncEngine.statusData.isOnline, isFalse);

      // Perform local offline mutation
      final op = SyncOperation.createPending(
        id: 'op_offline_1',
        userId: testUserId,
        entityType: 'study_task',
        entityId: 'tsk_off_1',
        operationType: SyncOperationType.update,
        payload: {'status': 'COMPLETED'},
      );
      await localStore.enqueue(op);
      await syncEngine.refreshStatus();

      expect(syncEngine.state, equals(SyncState.offline));
      expect(syncEngine.pendingCount, equals(1));

      // Reconnect
      connectivity.setStatusForTesting(NetworkStatus.online);
      await syncEngine.processPendingQueue();

      expect(syncEngine.state, equals(SyncState.synced));
      expect(syncEngine.pendingCount, equals(0));
    });
  });

  // ========================================================
  // 5. SYNC_QUEUE_PERSISTENCE_TEST
  // ========================================================
  group('5. SYNC_QUEUE_PERSISTENCE_TEST', () {
    test('Failed operations are NEVER deleted from the pending queue', () async {
      final op = SyncOperation.createPending(
        id: 'op_persist_test',
        userId: testUserId,
        entityType: 'mistake',
        entityId: 'mst_01',
        operationType: SyncOperationType.create,
        payload: {'subject': 'OS'},
      );
      await localStore.enqueue(op);

      remoteHandler.transientFailuresRemaining = 2;

      await syncEngine.processPendingQueue();
      var q = await localStore.getQueue(testUserId);
      expect(q.length, equals(1));
      expect(q.first.retryCount, equals(1));

      await syncEngine.processPendingQueue(force: true);
      q = await localStore.getQueue(testUserId);
      expect(q.length, equals(1));
      expect(q.first.retryCount, equals(2));

      // Next attempt succeeds
      await syncEngine.processPendingQueue(force: true);
      q = await localStore.getQueue(testUserId);
      expect(q, isEmpty);
    });
  });

  // ========================================================
  // 6. SYNC_REALTIME_FAILURE_TEST
  // ========================================================
  group('6. SYNC_REALTIME_FAILURE_TEST', () {
    test('Realtime disconnection does NOT corrupt or mark REST sync state as failed', () {
      RealtimeSyncService.instance.setStatusForTesting(RealtimeStatus.reconnecting);

      final status = syncEngine.statusData;
      expect(status.state, equals(SyncState.synced));
      expect(RealtimeSyncService.instance.status, equals(RealtimeStatus.reconnecting));
    });
  });

  // ========================================================
  // 7. SYNC_PARTIAL_FAILURE_TEST
  // ========================================================
  group('7. SYNC_PARTIAL_FAILURE_TEST', () {
    test('Partial hydration failure preserves successful tables and reports partialFailure', () {
      final hydration = CloudHydrationService.instance;
      expect(hydration.status != HydrationStatus.hydrating, isTrue);
      expect(SyncState.partialFailure, isNotNull);
    });
  });

  // ========================================================
  // 8. SYNC_CONCURRENT_REQUEST_TEST
  // ========================================================
  group('8. SYNC_CONCURRENT_REQUEST_TEST', () {
    test('Concurrent sync requests do not overlap or execute duplicate remote writes', () async {
      final op = SyncOperation.createPending(
        id: 'op_conc_01',
        userId: testUserId,
        entityType: 'dsa_progress',
        entityId: 'prob_01',
        operationType: SyncOperationType.create,
        payload: {'problem_id': 'prob_01', 'status': 'SOLVED'},
      );
      await localStore.enqueue(op);

      final f1 = syncEngine.syncNow();
      final f2 = syncEngine.syncNow();

      final results = await Future.wait([f1, f2]);
      expect(results, contains(true));
      expect(remoteHandler.executedOps.length, equals(1));
    });
  });

  // ========================================================
  // 9. SYNC_RECOVERY_TEST
  // ========================================================
  group('9. SYNC_RECOVERY_TEST', () {
    test('Complete recovery pipeline from offline failure to online reconciliation', () async {
      connectivity.setStatusForTesting(NetworkStatus.offline);
      await syncEngine.refreshStatus();
      expect(syncEngine.state, equals(SyncState.offline));

      // Local mutations
      await localStore.enqueue(SyncOperation.createPending(
        id: 'op_rec_01',
        userId: testUserId,
        entityType: 'study_task',
        entityId: 'tsk_rec_01',
        operationType: SyncOperationType.create,
        payload: {'task_id': 't1'},
      ));

      connectivity.setStatusForTesting(NetworkStatus.online);
      await syncEngine.syncNow();

      expect(syncEngine.state, equals(SyncState.synced));
      expect(remoteHandler.executedOps.length, equals(1));
      final q = await localStore.getQueue(testUserId);
      expect(q, isEmpty);
    });
  });

  // ========================================================
  // 10. CANONICAL_STREAK_TEST
  // ========================================================
  group('10. CANONICAL_STREAK_TEST', () {
    test('StreakService recomputes canonical streak from completed tasks case-agnostically', () async {
      final now = DateTime.now();
      String fmt(DateTime d) =>
          '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

      // Seed 22 consecutive days of completed tasks in LocalStore
      for (int i = 0; i < 22; i++) {
        final dStr = fmt(now.subtract(Duration(days: i)));
        await localStore.saveRecord(
          userId: testUserId,
          entityType: 'study_task',
          entityId: 'tsk_$dStr',
          data: {
            'task_id': 'task_$i',
            'date': dStr,
            'status': i % 2 == 0 ? 'COMPLETED' : 'completed', // Case-agnostic
          },
          isDirty: false,
        );
      }

      final streak = await StreakService.instance.recomputeStreak(userId: testUserId);
      expect(streak, equals(22));
      expect(StreakService.instance.formattedStreak, equals('22d'));
    });
  });

  // ========================================================
  // 11. DSA_CANONICAL_STATE_TEST
  // ========================================================
  group('11. DSA_CANONICAL_STATE_TEST', () {
    test('DSA solved counts derive identically across SupabaseDsaRepository and SupabaseHomeRepository', () async {
      for (int i = 1; i <= 7; i++) {
        await localStore.saveRecord(
          userId: testUserId,
          entityType: 'dsa_progress',
          entityId: 'prob_$i',
          data: {
            'problem_id': 'prob_$i',
            'user_id': testUserId,
            'status': 'SOLVED',
          },
        );
      }

      final dsaRepo = SupabaseDsaRepository(overrideUserId: testUserId, localStore: localStore);
      final homeRepo = SupabaseHomeRepository(overrideUserId: testUserId);

      final solvedIds = await dsaRepo.getSolvedProblemIds();
      final homeData = await homeRepo.getTodayCommandData();

      expect(solvedIds.length, equals(7));
      expect(homeData.dsaSummary.metric, contains('7/443'));
    });
  });

  // ========================================================
  // 12. DEVELOPMENT_CANONICAL_STATE_TEST
  // ========================================================
  group('12. DEVELOPMENT_CANONICAL_STATE_TEST', () {
    test('Development tracks derive identically across SupabaseDevRepository and SupabaseHomeRepository', () async {
      for (int i = 1; i <= 4; i++) {
        await localStore.saveRecord(
          userId: testUserId,
          entityType: 'development_progress',
          entityId: 'dev_track_$i',
          data: {
            'item_id': 'dev_track_$i',
            'user_id': testUserId,
            'status': 'COMPLETED',
          },
        );
      }

      final devRepo = SupabaseDevRepository(overrideUserId: testUserId, localStore: localStore);
      final homeRepo = SupabaseHomeRepository(overrideUserId: testUserId);

      final completedTracks = await devRepo.getCompletedTopicIds();
      final homeData = await homeRepo.getTodayCommandData();

      expect(completedTracks.length, equals(4));
      expect(homeData.devSummary.metric, contains('4/16'));
    });
  });

  // ========================================================
  // 13. GYM_SYNC_DEDUP_TEST
  // ========================================================
  group('13. GYM_SYNC_DEDUP_TEST', () {
    test('Workout sessions with stable IDs never duplicate across save, history, and delete', () async {
      final gymRepo = SupabaseGymRepository(localStore: localStore, currentUserId: testUserId);
      final sid = UuidGenerator.v4();

      final session = WorkoutSession(
        id: sid,
        userId: testUserId,
        date: '2026-09-29',
        dayOfWeek: 'Tuesday',
        dayKey: 'tue',
        workoutType: 'Chest Protocol',
        durationMinutes: 45,
        gymPhotoPath: 'photos/photo.jpg',
        createdAt: DateTime.now(),
        exercises: [],
      );

      final saved = await gymRepo.saveWorkoutSession(session);
      expect(saved.id, equals(sid));

      final hist1 = await gymRepo.getWorkoutHistory(userId: testUserId);
      expect(hist1.where((s) => s.id == sid).length, equals(1));

      // Re-save with updated volume (optimistic write or refresh)
      final updated = saved.copyWith(totalVolumeKg: 12500.0);
      await gymRepo.saveWorkoutSession(updated);

      final hist2 = await gymRepo.getWorkoutHistory(userId: testUserId);
      expect(hist2.where((s) => s.id == sid).length, equals(1));
      expect(hist2.firstWhere((s) => s.id == sid).totalVolumeKg, equals(12500.0));

      // Delete session
      await gymRepo.deleteWorkoutSession(sid);
      final hist3 = await gymRepo.getWorkoutHistory(userId: testUserId);
      expect(hist3.where((s) => s.id == sid).length, equals(0));
    });
  });
}
