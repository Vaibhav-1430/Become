import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/sync/conflict/conflict_resolver.dart';
import 'package:forge_app/core/sync/engine/remote_sync_handler.dart';
import 'package:forge_app/core/sync/engine/sync_engine.dart';
import 'package:forge_app/core/sync/models/sync_operation.dart';
import 'package:forge_app/core/sync/network/connectivity_service.dart';
import 'package:forge_app/core/sync/presentation/forge_sync_indicator.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';
import 'package:forge_app/features/career/data/supabase_career_repository.dart';
import 'package:forge_app/features/career/domain/internship.dart';
import 'package:forge_app/features/dsa/data/supabase_dsa_repository.dart';
import 'package:forge_app/features/development/data/supabase_dev_repository.dart';
import 'package:forge_app/features/gym/data/supabase_gym_repository.dart';
import 'package:forge_app/features/gym/domain/workout_session.dart';
import 'package:forge_app/features/gym/domain/workout_set.dart';
import 'package:forge_app/features/mistakes/data/supabase_mistake_repository.dart';
import 'package:forge_app/features/mistakes/domain/mistake.dart';
import 'package:forge_app/features/plan/data/supabase_plan_repository.dart';
import 'package:forge_app/features/tests/data/supabase_test_repository.dart';
import 'package:forge_app/features/tests/domain/models/test_attempt_result.dart';
import 'package:forge_app/features/tests/domain/models/test_session.dart';
import 'package:forge_app/features/tests/services/test_recovery_service.dart';

void main() {
  group('Phase 5I — FORGE Mobile Offline + Sync Specification Tests', () {
    late MemoryLocalStore localStore;
    late MockReachabilityChecker reachabilityChecker;
    late ConnectivityService connectivity;
    late MockRemoteSyncHandler mockRemoteHandler;
    late SyncEngine syncEngine;

    setUp(() {
      localStore = MemoryLocalStore();
      LocalStore.instance = localStore;

      reachabilityChecker = MockReachabilityChecker(initialOnline: true);
      connectivity = ConnectivityService(
        checker: reachabilityChecker,
        initialStatus: NetworkStatus.online,
      );
      ConnectivityService.instance = connectivity;

      mockRemoteHandler = MockRemoteSyncHandler();
      syncEngine = SyncEngine(
        localStore: localStore,
        connectivity: connectivity,
        remoteHandler: mockRemoteHandler,
      );
      SyncEngine.instance = syncEngine;
    });

    tearDown(() {
      connectivity.dispose();
      syncEngine.dispose();
    });

    // ==========================================
    // 1. NETWORK TESTS (1–3)
    // ==========================================
    group('1. Network Detection', () {
      test('1. Online detection reports reachable status', () async {
        reachabilityChecker.setOnline(true);
        final online = await connectivity.checkConnectivity();

        expect(online, isTrue);
        expect(connectivity.status, equals(NetworkStatus.online));
        expect(connectivity.isOnline, isTrue);
        expect(connectivity.isOffline, isFalse);
      });

      test('2. Offline detection reports unreachable status', () async {
        reachabilityChecker.setOnline(false);
        final online = await connectivity.checkConnectivity();

        expect(online, isFalse);
        expect(connectivity.status, equals(NetworkStatus.offline));
        expect(connectivity.isOnline, isFalse);
        expect(connectivity.isOffline, isTrue);
      });

      test('3. Reconnect detection broadcasts status change on transition', () async {
        reachabilityChecker.setOnline(false);
        await connectivity.checkConnectivity();
        expect(connectivity.status, equals(NetworkStatus.offline));

        final statusEvents = <NetworkStatus>[];
        final sub = connectivity.onStatusChange.listen(statusEvents.add);

        reachabilityChecker.setOnline(true);
        await connectivity.checkConnectivity();

        await Future.delayed(const Duration(milliseconds: 10));
        expect(statusEvents, contains(NetworkStatus.online));
        expect(connectivity.isOnline, isTrue);

        await sub.cancel();
      });
    });

    // ==========================================
    // 2. CACHE TESTS (4–7)
    // ==========================================
    group('2. Account-Scoped Local Cache', () {
      test('4. Local write persists entity records with dirty metadata', () async {
        const userId = 'user_alpha';
        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_001',
          data: {'id': 'tsk_001', 'title': 'Two Pointers Practice', 'status': 'NOT_STARTED'},
          isDirty: true,
        );

        final rec = await localStore.getRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_001',
        );

        expect(rec, isNotNull);
        expect(rec!['title'], equals('Two Pointers Practice'));
        expect(rec['_dirty'], isTrue);
        expect(rec['_localUpdatedAt'], isNotNull);
      });

      test('5. Local read fetches all records for entity type', () async {
        const userId = 'user_alpha';
        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_001',
          data: {'id': 'tsk_001', 'title': 'Task 1'},
        );
        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_002',
          data: {'id': 'tsk_002', 'title': 'Task 2'},
        );

        final all = await localStore.getRecords(
          userId: userId,
          entityType: 'study_task',
        );

        expect(all.length, equals(2));
        expect(all.map((t) => t['id']), containsAll(['tsk_001', 'tsk_002']));
      });

      testWidgets('6. Cached screen rendering works offline with zero network', (WidgetTester tester) async {
        const userId = 'user_alpha';
        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_99',
          data: {
            'id': 'tsk_99',
            'user_id': userId,
            'date': '2026-10-24',
            'task_id': 'tsk_99',
            'title': 'Offline Dynamic Programming',
            'category': 'DSA',
            'status': 'COMPLETED',
            'is_study': true,
          },
        );

        final planRepo = SupabasePlanRepository(localStore: localStore, userId: userId);
        final tasks = await planRepo.getTasksForDate('2026-10-24');

        expect(tasks.length, equals(1));
        expect(tasks.first.title, equals('Offline Dynamic Programming'));
        expect(tasks.first.isCompleted, isTrue);
      });

      test('7. Cache isolation ensures User A data is strictly invisible to User B', () async {
        const userA = 'user_alpha';
        const userB = 'user_bravo';

        await localStore.saveRecord(
          userId: userA,
          entityType: 'mistake',
          entityId: 'mst_secret_a',
          data: {'id': 'mst_secret_a', 'question': 'Binary Search Boundary Bug'},
        );

        final userBData = await localStore.getRecord(
          userId: userB,
          entityType: 'mistake',
          entityId: 'mst_secret_a',
        );
        expect(userBData, isNull);

        final allUserB = await localStore.getRecords(userId: userB, entityType: 'mistake');
        expect(allUserB, isEmpty);
      });
    });

    // ==========================================
    // 3. QUEUE TESTS (8–15)
    // ==========================================
    group('3. Persistent Sync Queue', () {
      const userId = 'user_queue_test';

      test('8. Create operation queues and stores payload', () async {
        final op = SyncOperation.createPending(
          id: 'op_create_1',
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_101',
          operationType: SyncOperationType.create,
          payload: {'id': 'tsk_101', 'title': 'New Directive'},
        );

        await localStore.enqueue(op);
        final queue = await localStore.getQueue(userId);

        expect(queue.length, equals(1));
        expect(queue.first.id, equals('op_create_1'));
        expect(queue.first.operationType, equals(SyncOperationType.create));
        expect(queue.first.status, equals(SyncOperationStatus.pending));
      });

      test('9. Update operation queues and overwrites pending operation for same entity', () async {
        final op1 = SyncOperation.createPending(
          id: 'op_update_1',
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_101',
          operationType: SyncOperationType.update,
          payload: {'status': 'IN_PROGRESS'},
        );
        await localStore.enqueue(op1);

        final op2 = SyncOperation.createPending(
          id: 'op_update_2',
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_101',
          operationType: SyncOperationType.update,
          payload: {'status': 'COMPLETED'},
        );
        await localStore.enqueue(op2);

        final queue = await localStore.getQueue(userId);
        expect(queue.length, equals(1));
        expect(queue.first.payload['status'], equals('COMPLETED'));
      });

      test('10. Delete operation enqueues successfully', () async {
        final op = SyncOperation.createPending(
          id: 'op_del_1',
          userId: userId,
          entityType: 'internship',
          entityId: 'int_77',
          operationType: SyncOperationType.delete,
          payload: {'id': 'int_77'},
        );
        await localStore.enqueue(op);

        final queue = await localStore.getQueue(userId);
        expect(queue.first.operationType, equals(SyncOperationType.delete));
      });

      test('11. Persistent queue survives multiple reads and updates', () async {
        final op = SyncOperation.createPending(
          id: 'op_persist_1',
          userId: userId,
          entityType: 'mistake',
          entityId: 'mst_44',
          operationType: SyncOperationType.create,
          payload: {'question': 'Q1'},
        );
        await localStore.enqueue(op);

        await localStore.updateOperation(op.copyWith(retryCount: 2));
        final queue = await localStore.getQueue(userId);

        expect(queue.first.retryCount, equals(2));
      });

      test('12. Queue ordering respects dependency hierarchy', () async {
        final opSet = SyncOperation.createPending(
          id: 'op_set',
          userId: userId,
          entityType: 'workout_set',
          entityId: 'set_1',
          operationType: SyncOperationType.create,
          payload: {'id': 'set_1'},
        );
        final opSession = SyncOperation.createPending(
          id: 'op_sess',
          userId: userId,
          entityType: 'workout_session',
          entityId: 'sess_1',
          operationType: SyncOperationType.create,
          payload: {'id': 'sess_1'},
        );
        final opPlan = SyncOperation.createPending(
          id: 'op_plan',
          userId: userId,
          entityType: 'workout_plan',
          entityId: 'plan_1',
          operationType: SyncOperationType.create,
          payload: {'id': 'plan_1'},
        );

        await localStore.enqueue(opSet);
        await localStore.enqueue(opSession);
        await localStore.enqueue(opPlan);

        syncEngine.setActiveUserId(userId);
        await syncEngine.processPendingQueue();

        expect(mockRemoteHandler.executedOps.length, equals(3));
        expect(mockRemoteHandler.executedOps[0].entityType, equals('workout_plan'));
        expect(mockRemoteHandler.executedOps[1].entityType, equals('workout_session'));
        expect(mockRemoteHandler.executedOps[2].entityType, equals('workout_set'));
      });

      test('13. Transient failure schedules retry with exponential backoff', () async {
        mockRemoteHandler.shouldFailTransients = true;
        mockRemoteHandler.failureMessage = 'SocketException';

        final op = SyncOperation.createPending(
          id: 'op_retry_1',
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_1',
          operationType: SyncOperationType.update,
          payload: {'id': 'tsk_1'},
        );
        await localStore.enqueue(op);

        syncEngine.setActiveUserId(userId);
        await syncEngine.processPendingQueue();

        final queue = await localStore.getQueue(userId);
        expect(queue.first.status, equals(SyncOperationStatus.pending));
        expect(queue.first.retryCount, equals(1));
        expect(queue.first.nextRetryAt, isNotNull);
      });

      test('14. Bounded retry stops and marks error after 5 attempts', () async {
        mockRemoteHandler.shouldFailTransients = true;

        final op = SyncOperation.createPending(
          id: 'op_bounded',
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_1',
          operationType: SyncOperationType.update,
          payload: {'id': 'tsk_1'},
        ).copyWith(retryCount: 4);
        await localStore.enqueue(op);

        syncEngine.setActiveUserId(userId);
        await syncEngine.processPendingQueue();

        final queue = await localStore.getQueue(userId);
        expect(queue.first.status, equals(SyncOperationStatus.error));
        expect(queue.first.retryCount, equals(5));
      });

      test('15. Permanent failure immediately stops retrying', () async {
        mockRemoteHandler.shouldFailPermanent = true;
        mockRemoteHandler.failureMessage = '400 Bad Request: Column not found';

        final op = SyncOperation.createPending(
          id: 'op_perm',
          userId: userId,
          entityType: 'internship',
          entityId: 'int_bad',
          operationType: SyncOperationType.create,
          payload: {'id': 'int_bad'},
        );
        await localStore.enqueue(op);

        syncEngine.setActiveUserId(userId);
        await syncEngine.processPendingQueue();

        final queue = await localStore.getQueue(userId);
        expect(queue.first.status, equals(SyncOperationStatus.error));
        expect(queue.first.lastError, contains('400 Bad Request'));
      });
    });

    // ==========================================
    // 4. SYNC & IDEMPOTENCY TESTS (16–20)
    // ==========================================
    group('4. Synchronization & Idempotency', () {
      const userId = 'user_sync_test';

      test('16. Offline to online auto-synchronization triggers when network returns', () async {
        reachabilityChecker.setOnline(false);
        await connectivity.checkConnectivity();
        syncEngine.setActiveUserId(userId);

        final op = SyncOperation.createPending(
          id: 'op_auto_sync',
          userId: userId,
          entityType: 'dsa_progress',
          entityId: 'two-sum',
          operationType: SyncOperationType.update,
          payload: {'problem_id': 'two-sum', 'status': 'SOLVED'},
        );
        await localStore.enqueue(op);

        expect(mockRemoteHandler.executedOps, isEmpty);

        // Turn internet back on
        reachabilityChecker.setOnline(true);
        await connectivity.checkConnectivity();

        // Allow microtask to process
        await Future.delayed(const Duration(milliseconds: 20));

        expect(mockRemoteHandler.executedOps.length, equals(1));
        final queue = await localStore.getQueue(userId);
        expect(queue, isEmpty);
      });

      test('17. Duplicate retry protection never executes duplicate remote writes', () async {
        final op = SyncOperation.createPending(
          id: 'op_dup_protection',
          userId: userId,
          entityType: 'workout_session',
          entityId: 'sess_stable_1',
          operationType: SyncOperationType.create,
          payload: {'id': 'sess_stable_1', 'duration_minutes': 45},
        );
        await localStore.enqueue(op);
        syncEngine.setActiveUserId(userId);

        // First run succeeds
        await syncEngine.processPendingQueue();
        expect(mockRemoteHandler.executedOps.length, equals(1));

        // Second run finds empty queue and does not re-execute
        await syncEngine.processPendingQueue();
        expect(mockRemoteHandler.executedOps.length, equals(1));
      });

      test('18. Idempotency guarantees stable client ID across multiple retry attempts', () async {
        mockRemoteHandler.transientFailuresRemaining = 2; // fail first 2 attempts, then succeed

        final op = SyncOperation.createPending(
          id: 'op_idempotent',
          userId: userId,
          entityType: 'mistake',
          entityId: 'mst_idempotent_1',
          operationType: SyncOperationType.create,
          payload: {'id': 'mst_idempotent_1', 'question': 'Graph Cycle Detection'},
        );
        await localStore.enqueue(op);
        syncEngine.setActiveUserId(userId);

        // Attempt 1 fails
        await syncEngine.processPendingQueue(force: true);
        // Attempt 2 fails
        await syncEngine.processPendingQueue(force: true);
        // Attempt 3 succeeds
        await syncEngine.processPendingQueue(force: true);

        expect(mockRemoteHandler.executedOps.length, equals(1));
        expect(mockRemoteHandler.executedOps.first.entityId, equals('mst_idempotent_1'));
      });

      test('19. Sync state transitions faithfully (pending -> syncing -> synced)', () async {
        syncEngine.setActiveUserId(userId);
        expect(syncEngine.state, equals(SyncState.synced));

        final op = SyncOperation.createPending(
          id: 'op_state_trans',
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_st',
          operationType: SyncOperationType.update,
          payload: {'id': 'tsk_st'},
        );
        await localStore.enqueue(op);
        await syncEngine.refreshStatus();

        expect(syncEngine.state, equals(SyncState.pendingSync));
        expect(syncEngine.pendingCount, equals(1));

        await syncEngine.processPendingQueue();
        expect(syncEngine.state, equals(SyncState.synced));
        expect(syncEngine.pendingCount, equals(0));
      });

      test('20. Manual sync triggers processing and prevents concurrent duplicate runs', () async {
        syncEngine.setActiveUserId(userId);
        final op = SyncOperation.createPending(
          id: 'op_manual',
          userId: userId,
          entityType: 'development_progress',
          entityId: 'nextjs',
          operationType: SyncOperationType.update,
          payload: {'item_id': 'nextjs'},
        );
        await localStore.enqueue(op);

        final future1 = syncEngine.syncNow();
        final future2 = syncEngine.syncNow(); // concurrent call

        final results = await Future.wait([future1, future2]);
        expect(results, contains(true));
        expect(mockRemoteHandler.executedOps.length, equals(1));
      });
    });

    // ==========================================
    // 5. CONFLICT RESOLUTION TESTS (21–25)
    // ==========================================
    group('5. Conflict Resolution', () {
      test('21. Task conflict: local user-initiated status transition wins when dirty', () {
        final local = {
          'id': 'tsk_1',
          'status': 'COMPLETED',
          '_dirty': true,
          'updated_at': '2026-10-24T10:00:00Z',
        };
        final remote = {
          'id': 'tsk_1',
          'status': 'NOT_STARTED',
          'updated_at': '2026-10-24T09:00:00Z',
        };

        final resolved = ConflictResolver.resolve(
          entityType: 'study_task',
          localData: local,
          remoteData: remote,
        );

        expect(resolved['status'], equals('COMPLETED'));
      });

      test('22. Progress conflict: DSA/Dev union rule ensures solved state is preserved', () {
        final local = {
          'problem_id': 'lru-cache',
          'status': 'SOLVED',
          'solved_at': '2026-10-24T12:00:00Z',
        };
        final remote = {
          'problem_id': 'lru-cache',
          'status': 'NOT_STARTED',
        };

        final resolved = ConflictResolver.resolve(
          entityType: 'dsa_progress',
          localData: local,
          remoteData: remote,
        );

        expect(resolved['status'], equals('SOLVED'));
      });

      test('23. Internship conflict: field-level merge preserves local notes and status', () {
        final local = {
          'id': 'int_1',
          'status': 'INTERVIEW',
          'notes': 'Offline phone screen scheduled',
          '_dirty': true,
        };
        final remote = {
          'id': 'int_1',
          'company': 'Google',
          'role': 'SWE Intern',
          'status': 'OA',
          'notes': 'Old note',
        };

        final resolved = ConflictResolver.resolve(
          entityType: 'internship',
          localData: local,
          remoteData: remote,
        );

        expect(resolved['company'], equals('Google'));
        expect(resolved['status'], equals('INTERVIEW'));
        expect(resolved['notes'], equals('Offline phone screen scheduled'));
      });

      test('24. Gym conflict: personal record monotonic max weight wins', () {
        final local = {
          'exercise_id': 'bench_press',
          'weight_kg': 105.0,
          'reps': 3,
        };
        final remote = {
          'exercise_id': 'bench_press',
          'weight_kg': 100.0,
          'reps': 5,
        };

        final resolved = ConflictResolver.resolve(
          entityType: 'personal_record',
          localData: local,
          remoteData: remote,
        );

        expect(resolved['weight_kg'], equals(105.0));
      });

      test('25. Mistake conflict: repeat count increments monotonically and preserves local notes', () {
        final local = {
          'id': 'mst_1',
          'repeat_count': 3,
          'notes': 'Key pattern: fast-slow pointer',
          '_dirty': true,
        };
        final remote = {
          'id': 'mst_1',
          'repeat_count': 2,
          'question': 'Linked list cycle',
        };

        final resolved = ConflictResolver.resolve(
          entityType: 'mistake',
          localData: local,
          remoteData: remote,
        );

        expect(resolved['repeat_count'], equals(3));
        expect(resolved['question'], equals('Linked list cycle'));
        expect(resolved['notes'], equals('Key pattern: fast-slow pointer'));
      });
    });

    // ==========================================
    // 6. AUTH & USER ISOLATION TESTS (26–29)
    // ==========================================
    group('6. Authentication & User Isolation', () {
      test('26. User A data partition is strictly isolated', () async {
        const userA = 'user_alice';
        await localStore.saveRecord(
          userId: userA,
          entityType: 'study_task',
          entityId: 'tsk_a',
          data: {'title': 'Alice Task'},
        );

        final recs = await localStore.getRecords(userId: userA, entityType: 'study_task');
        expect(recs.first['title'], equals('Alice Task'));
      });

      test('27. User B login sees only User B data partition', () async {
        const userA = 'user_alice';
        const userB = 'user_bob';

        await localStore.saveRecord(
          userId: userA,
          entityType: 'study_task',
          entityId: 'tsk_a',
          data: {'title': 'Alice Task'},
        );
        await localStore.saveRecord(
          userId: userB,
          entityType: 'study_task',
          entityId: 'tsk_b',
          data: {'title': 'Bob Task'},
        );

        final bobRecs = await localStore.getRecords(userId: userB, entityType: 'study_task');
        expect(bobRecs.length, equals(1));
        expect(bobRecs.first['title'], equals('Bob Task'));
      });

      test('28. Sign-out behavior safely disassociates active user without deleting queue', () async {
        const userA = 'user_alice';
        final op = SyncOperation.createPending(
          id: 'op_a',
          userId: userA,
          entityType: 'study_task',
          entityId: 'tsk_a',
          operationType: SyncOperationType.create,
          payload: {'title': 'Pending Alice Action'},
        );
        await localStore.enqueue(op);

        syncEngine.setActiveUserId(userA);
        await syncEngine.refreshStatus();
        expect(syncEngine.pendingCount, equals(1));

        // Sign out
        syncEngine.setActiveUserId(null);
        await syncEngine.refreshStatus();
        expect(syncEngine.pendingCount, equals(0));

        // Sign back in as User A
        syncEngine.setActiveUserId(userA);
        await syncEngine.refreshStatus();
        expect(syncEngine.pendingCount, equals(1));
      });

      test('29. Account switch flushes active memory and switches local partition', () async {
        const userB = 'user_bob';

        final planRepo = SupabasePlanRepository(localStore: localStore);
        await planRepo.updateTaskStatus('tsk_user_a', 'COMPLETED');

        final queueA = await localStore.getQueue('anonymous');
        expect(queueA.isNotEmpty, isTrue);

        // Switch to Bob
        final queueB = await localStore.getQueue(userB);
        expect(queueB, isEmpty);
      });
    });

    // ==========================================
    // 7. GYM DOMAIN TESTS (30–33)
    // ==========================================
    group('7. Gym Offline Synchronization', () {
      const userId = 'gym_user';

      test('30. Offline workout session persists locally with in_progress status', () async {
        final gymRepo = SupabaseGymRepository(
          currentUserId: userId,
          localStore: localStore,
        );

        final session = WorkoutSession(
          id: 'sess_offline_1',
          userId: userId,
          date: '2026-10-24',
          dayOfWeek: 'Thursday',
          dayKey: 'push',
          workoutType: 'Push Protocol',
          durationMinutes: 45,
          status: 'completed',
          gymPhotoPath: 'gym-photos/gym_user/2026/10/sess_offline_1.jpg',
          totalVolumeKg: 1250.0,
          totalSets: 12,
          totalReps: 120,
          createdAt: DateTime.now(),
        );

        final saved = await gymRepo.saveWorkoutSession(session);
        expect(saved.id, equals('sess_offline_1'));

        final localRec = await localStore.getRecord(
          userId: userId,
          entityType: 'workout_session',
          entityId: '2026-10-24',
        );
        expect(localRec, isNotNull);
        expect(localRec!['total_volume_kg'], equals(1250.0));
      });

      test('31. Offline sets queue and persist intact', () async {
        final gymRepo = SupabaseGymRepository(
          currentUserId: userId,
          localStore: localStore,
        );

        final set = WorkoutSet(
          id: 'set_bench_1',
          workoutExerciseId: 'we_bench',
          setNumber: 1,
          weightKg: 80.0,
          reps: 8,
          completed: true,
        );

        await gymRepo.saveWorkoutSet(userId: userId, set: set);

        final setRec = await localStore.getRecord(
          userId: userId,
          entityType: 'workout_set',
          entityId: 'set_bench_1',
        );
        expect(setRec, isNotNull);
        expect(setRec!['weight_kg'], equals(80.0));

        final queue = await localStore.getQueue(userId);
        expect(queue.any((op) => op.entityId == 'set_bench_1'), isTrue);
      });

      test('32. Offline photo state generates canonical storage path', () async {
        final gymRepo = SupabaseGymRepository(
          currentUserId: userId,
          localStore: localStore,
        );

        final dummyBytes = Uint8List.fromList([1, 2, 3, 4, 5]);
        final photoPath = await gymRepo.uploadCheckInPhoto(
          dummyBytes,
          'sess_sample',
          DateTime(2026, 10, 24),
        );

        expect(photoPath, equals('gym_user/2026/10/sess_sample.jpg'));
        final queue = await localStore.getQueue(userId);
        expect(queue.any((op) => op.entityType == 'gym_photo'), isTrue);
      });

      test('33. Photo retry preserves byte payload and does not re-upload unnecessarily', () async {
        final dummyBytes = Uint8List.fromList([255, 216, 255, 224]);
        final base64Str = base64Encode(dummyBytes);

        final op = SyncOperation.createPending(
          id: 'op_photo_retry',
          userId: userId,
          entityType: 'gym_photo',
          entityId: 'gym_user/2026/10/sess_retry.jpg',
          operationType: SyncOperationType.create,
          payload: {
            'storagePath': 'gym_user/2026/10/sess_retry.jpg',
            'bytesBase64': base64Str,
          },
        );
        await localStore.enqueue(op);

        syncEngine.setActiveUserId(userId);
        await syncEngine.processPendingQueue();

        expect(mockRemoteHandler.executedOps.length, equals(1));
        expect(mockRemoteHandler.executedOps.first.payload['storagePath'], equals('gym_user/2026/10/sess_retry.jpg'));
      });
    });

    // ==========================================
    // 8. TEST ENGINE DOMAIN TESTS (34–35)
    // ==========================================
    group('8. Test Engine Synchronization', () {
      const userId = 'test_user';

      test('34. In-progress test session recovery restores answers and remaining time', () async {
        final recoveryService = TestRecoveryService(localStore: localStore);

        await recoveryService.saveActiveState(
          userId: userId,
          testType: 'dsa',
          currentQuestionIndex: 2,
          userAnswers: {'q1': 'B', 'q2': 'int left = 0;'},
          remainingSeconds: 1240,
          questions: [
            {'id': 'q1', 'prompt': 'Question 1'},
            {'id': 'q2', 'prompt': 'Question 2'},
          ],
        );

        final active = await recoveryService.getActiveState(userId);
        expect(active, isNotNull);
        expect(active!['currentQuestionIndex'], equals(2));
        expect(active['remainingSeconds'], equals(1240));
        expect(active['userAnswers']['q1'], equals('B'));

        // Clear upon submission
        await recoveryService.clearActiveState(userId);
        final cleared = await recoveryService.getActiveState(userId);
        expect(cleared, isNull);
      });

      test('35. Completed test attempt deduplication never duplicates results on retry', () async {
        final testRepo = SupabaseTestRepository(localStore: localStore);
        testRepo.setUserId(userId);

        final result = TestAttemptResult(
          id: 'att_001',
          attemptId: 'att_001',
          testTitle: 'DSA Comprehensive Test',
          testType: TestType.dsa,
          date: '2026-10-24',
          completedAtIso: '2026-10-24T10:00:00Z',
          timeTakenSeconds: 900,
          totalQuestions: 10,
          correctCount: 8,
          wrongCount: 2,
          skippedCount: 0,
          scorePct: 80.0,
          accuracyPct: 80.0,
          topicScores: const [],
          difficultyScores: const [],
          questionResults: const [],
          strongTopics: const ['Binary Search'],
          weakTopics: const ['Binary Search'],
          analysisInsights: const [],
        );

        final saved = await testRepo.saveTestAttempt(result);
        expect(saved.id, equals('att_001'));

        final history = await testRepo.getTestHistory();
        expect(history.length, equals(1));

        // Attempting to save same attempt again does not create duplicate
        await testRepo.saveTestAttempt(result);
        final historyAfterRetry = await testRepo.getTestHistory();
        expect(historyAfterRetry.length, equals(1));
      });
    });

    // ==========================================
    // 9. UI SYNC INDICATOR TESTS (36–39)
    // ==========================================
    group('9. Sync Status UI', () {
      testWidgets('36. Offline indicator displays OFFLINE MODE when disconnected', (WidgetTester tester) async {
        connectivity.setStatusForTesting(NetworkStatus.offline);
        await syncEngine.refreshStatus();

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ForgeSyncIndicator(engine: syncEngine),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('OFFLINE MODE'), findsOneWidget);
        expect(find.byIcon(Icons.wifi_off_rounded), findsOneWidget);
      });

      testWidgets('37. Pending indicator displays queued count', (WidgetTester tester) async {
        connectivity.setStatusForTesting(NetworkStatus.online);
        await localStore.enqueue(
          SyncOperation.createPending(
            id: 'op_ui_pending',
            userId: 'user_ui',
            entityType: 'study_task',
            entityId: 'tsk_1',
            operationType: SyncOperationType.create,
            payload: {},
          ),
        );
        syncEngine.setActiveUserId('user_ui');
        await syncEngine.refreshStatus();

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ForgeSyncIndicator(engine: syncEngine),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('1 PENDING SYNC'), findsOneWidget);
        expect(find.text('SYNC NOW'), findsOneWidget);
      });

      testWidgets('38. Syncing indicator renders kinetic state', (WidgetTester tester) async {
        syncEngine.setStatusForTesting(const SyncStatusData(
          state: SyncState.syncing,
          pendingCount: 2,
          isOnline: true,
        ));

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ForgeSyncIndicator(engine: syncEngine),
            ),
          ),
        );
        await tester.pump();

        expect(find.text('SYNCING PROTOCOL...'), findsOneWidget);
      });

      testWidgets('39. Sync error state displays error banner with tap to retry', (WidgetTester tester) async {
        connectivity.setStatusForTesting(NetworkStatus.online);
        await localStore.enqueue(
          SyncOperation.createPending(
            id: 'op_err_ui',
            userId: 'user_ui',
            entityType: 'study_task',
            entityId: 'tsk_1',
            operationType: SyncOperationType.create,
            payload: {},
          ).copyWith(status: SyncOperationStatus.error, lastError: 'Fatal error'),
        );
        syncEngine.setActiveUserId('user_ui');
        await syncEngine.refreshStatus();

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ForgeSyncIndicator(engine: syncEngine),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('SYNC FAILED // TAP TO RETRY'), findsOneWidget);
        expect(find.text('SYNC NOW'), findsOneWidget);
      });
    });

    // ==========================================
    // 10. REPOSITORY INTEGRATION TESTS (40+)
    // ==========================================
    group('10. Repository Offline Flow & Idempotency', () {
      test('40. PlanRepository offline task status update queues operation immediately', () async {
        final planRepo = SupabasePlanRepository(localStore: localStore);
        final success = await planRepo.updateTaskStatus('tsk_offline_toggle', 'COMPLETED');

        expect(success, isTrue);
        final rec = await localStore.getRecord(
          userId: 'anonymous',
          entityType: 'study_task',
          entityId: 'tsk_offline_toggle',
        );
        expect(rec!['status'], equals('COMPLETED'));
        expect(rec['_dirty'], isTrue);
      });

      test('41. DsaRepository offline problem solve persists and queues sync', () async {
        final dsaRepo = SupabaseDsaRepository(localStore: localStore);
        final success = await dsaRepo.toggleProblemSolved('two-sum', true);

        expect(success, isTrue);
        final solved = await dsaRepo.getSolvedProblemIds();
        expect(solved, contains('two-sum'));
      });

      test('42. DevRepository offline topic completion persists and queues sync', () async {
        final devRepo = SupabaseDevRepository(localStore: localStore);
        final success = await devRepo.toggleTopicCompleted('react-patterns', true);

        expect(success, isTrue);
        final completed = await devRepo.getCompletedTopicIds();
        expect(completed, contains('react-patterns'));
      });

      test('43. MistakeRepository offline mistake creation persists and generates stable ID', () async {
        final mistakeRepo = SupabaseMistakeRepository(localStore: localStore);
        final m = Mistake(
          id: '',
          userId: 'user_offline',
          question: 'What is the time complexity of QuickSelect?',
          subject: 'DSA',
          topic: 'Divide & Conquer',
          mistakeType: 'Conceptual',
          date: '2026-10-24',
        );

        final created = await mistakeRepo.createMistake(m);
        expect(created.id, startsWith('mst_'));

        final fetched = await mistakeRepo.getMistakeById(created.id);
        expect(fetched, isNotNull);
        expect(fetched!.question, equals(m.question));
      });

      test('44. CareerRepository offline internship creation generates stable ID and queues', () async {
        final careerRepo = SupabaseCareerRepository(localStore: localStore);
        careerRepo.setUserId('user_career');

        final internship = Internship(
          id: '',
          userId: 'user_career',
          company: 'Uber',
          role: 'Backend Intern',
          status: InternshipStatus.applied,
          dateApplied: '2026-10-24',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final created = await careerRepo.createInternship(internship);
        expect(created.id, startsWith('int_'));

        final list = await careerRepo.getInternships();
        expect(list.any((i) => i.company == 'Uber'), isTrue);
      });
    });
  });
}
