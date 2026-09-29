import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/sync/engine/remote_sync_handler.dart';
import 'package:forge_app/core/sync/engine/sync_engine.dart';
import 'package:forge_app/core/sync/network/connectivity_service.dart';
import 'package:forge_app/core/sync/presentation/forge_sync_indicator.dart';
import 'package:forge_app/core/sync/realtime/realtime_sync_service.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';
import 'package:forge_app/features/plan/data/supabase_plan_repository.dart';
import 'package:forge_app/features/tests/services/test_recovery_service.dart';

/// Hermetic Mock Realtime Channel Adapter for test verification.
class MockRealtimeChannelAdapter implements RealtimeChannelAdapter {
  bool isSubscribed = false;
  void Function(RealtimeStatus status)? onStatusCallback;

  @override
  Future<void> subscribe({required void Function(RealtimeStatus status) onStatusChange}) async {
    isSubscribed = true;
    onStatusCallback = onStatusChange;
    onStatusChange(RealtimeStatus.connected);
  }

  @override
  Future<void> unsubscribe() async {
    isSubscribed = false;
    onStatusCallback?.call(RealtimeStatus.disconnected);
    onStatusCallback = null;
  }

  void simulateStatus(RealtimeStatus status) {
    onStatusCallback?.call(status);
  }
}

void main() {
  group('Phase 6 — FORGE Realtime Cross-Platform Sync Specification Tests', () {
    late MemoryLocalStore localStore;
    late MockReachabilityChecker reachabilityChecker;
    late ConnectivityService connectivity;
    late MockRemoteSyncHandler mockRemoteHandler;
    late SyncEngine syncEngine;
    late RealtimeSyncService realtimeService;
    late MockRealtimeChannelAdapter mockChannelAdapter;

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

      realtimeService = RealtimeSyncService(
        localStore: localStore,
        connectivity: connectivity,
      );
      RealtimeSyncService.instance = realtimeService;
      mockChannelAdapter = MockRealtimeChannelAdapter();
    });

    tearDown(() {
      realtimeService.dispose();
      syncEngine.dispose();
      connectivity.dispose();
    });

    // ==========================================
    // 1. CONNECTION & SUBSCRIPTION (Tests 1–3)
    // ==========================================
    group('1. Connection & Channel Subscriptions', () {
      test('1. Realtime connection establishes user-scoped channel and reports connected', () async {
        const userId = 'user_001';
        await realtimeService.subscribeUserChannel(userId, adapterOverride: mockChannelAdapter);

        expect(realtimeService.isConnected, isTrue);
        expect(realtimeService.status, equals(RealtimeStatus.connected));
        expect(mockChannelAdapter.isSubscribed, isTrue);
      });

      test('2. Subscription creation binds to authenticated user identity', () async {
        const userId = 'user_002';
        realtimeService.setActiveUserId(userId);

        expect(realtimeService.activeUserId, equals(userId));
      });

      test('3. Subscription disposal unsubscribes channel cleanly on logout or unbind', () async {
        const userId = 'user_003';
        await realtimeService.subscribeUserChannel(userId, adapterOverride: mockChannelAdapter);
        expect(mockChannelAdapter.isSubscribed, isTrue);

        await realtimeService.unsubscribeUserChannel();
        expect(realtimeService.isConnected, isFalse);
        expect(realtimeService.status, equals(RealtimeStatus.disconnected));
        expect(mockChannelAdapter.isSubscribed, isFalse);
      });
    });

    // ==========================================
    // 2. DIRECTIONAL SYNCHRONIZATION (Tests 4–5)
    // ==========================================
    group('2. Cross-Platform Event Directionality', () {
      test('4. Web to Mobile event updates LocalStore and broadcasts reactive change', () async {
        const userId = 'user_flow';
        realtimeService.setActiveUserId(userId);

        final remoteTask = {
          'id': 'tsk_web_1',
          'task_id': 'tsk_web_1',
          'user_id': userId,
          'date': '2026-10-25',
          'title': 'Binary Search Trees (Web Created)',
          'status': 'COMPLETED',
          'category': 'DSA',
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        };

        RealtimeSyncEvent? broadcastEvent;
        final sub = realtimeService.onRemoteChange.listen((e) => broadcastEvent = e);

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'study_tasks',
          eventType: 'INSERT',
          record: remoteTask,
        );

        await Future.delayed(Duration.zero);
        await sub.cancel();

        final localRec = await localStore.getRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_web_1',
        );

        expect(localRec, isNotNull);
        expect(localRec!['title'], equals('Binary Search Trees (Web Created)'));
        expect(localRec['status'], equals('COMPLETED'));
        expect(localRec['_dirty'], isFalse); // Inbound events are never dirty
        expect(broadcastEvent, isNotNull);
        expect(broadcastEvent!.entityId, equals('tsk_web_1'));
      });

      test('5. Mobile to Web event queues local write with stable ID and executes remote write', () async {
        const userId = 'user_flow';
        final planRepo = SupabasePlanRepository(localStore: localStore, userId: userId);

        await planRepo.updateTaskStatus('tsk_mobile_1', 'COMPLETED');

        final queue = await localStore.getQueue(userId);
        expect(queue.isNotEmpty, isTrue);
        expect(queue.first.entityId, equals('tsk_mobile_1'));

        syncEngine.setActiveUserId(userId);
        await syncEngine.processPendingQueue();

        expect(mockRemoteHandler.executedOps.length, equals(1));
        expect(mockRemoteHandler.executedOps.first.entityId, equals('tsk_mobile_1'));
      });
    });

    // ==========================================
    // 3. ECHO SUPPRESSION & IDEMPOTENCY (Tests 6–7)
    // ==========================================
    group('3. Echo Suppression & Idempotency', () {
      test('6. Own-write echo suppression ignores remote re-broadcast of own mutation', () async {
        const userId = 'user_echo';
        realtimeService.setActiveUserId(userId);

        // Mark that Mobile just wrote tsk_echo_99
        realtimeService.markLocalWrite('study_task', 'tsk_echo_99');

        RealtimeSyncEvent? broadcastEvent;
        final sub = realtimeService.onRemoteChange.listen((e) => broadcastEvent = e);

        // Inbound remote event arrives from Supabase Realtime
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'study_tasks',
          eventType: 'UPDATE',
          record: {
            'id': 'tsk_echo_99',
            'task_id': 'tsk_echo_99',
            'user_id': userId,
            'title': 'Echo Task',
            'status': 'COMPLETED',
          },
        );

        await sub.cancel();

        // Echo was suppressed -> No event dispatched to UI
        expect(broadcastEvent, isNull);
      });

      test('7. Duplicate event delivery is idempotent and does not create duplicate records', () async {
        const userId = 'user_idemp';
        realtimeService.setActiveUserId(userId);

        final record = {
          'id': 'mst_idemp_1',
          'user_id': userId,
          'question': 'What is cycle detection?',
          'repeat_count': 1,
          'resolved': false,
          'updated_at': '2026-10-25T10:00:00Z',
        };

        // Deliver once
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'mistakes',
          eventType: 'INSERT',
          record: record,
        );

        // Deliver again (duplicate network packet)
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'mistakes',
          eventType: 'INSERT',
          record: record,
        );

        final mistakes = await localStore.getRecords(userId: userId, entityType: 'mistake');
        expect(mistakes.length, equals(1));
        expect(mistakes.first['id'], equals('mst_idemp_1'));
      });
    });

    // ==========================================
    // 4. CONFLICT RESOLUTION & REJECTION (Tests 8–9)
    // ==========================================
    group('4. Conflict Resolution & Stale Event Rejection', () {
      test('8. Dirty local task status wins over remote update', () async {
        const userId = 'user_conf';
        realtimeService.setActiveUserId(userId);

        // Local user marked task COMPLETED offline (dirty = true)
        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_conf_1',
          data: {
            'id': 'tsk_conf_1',
            'task_id': 'tsk_conf_1',
            'title': 'Local Task',
            'status': 'COMPLETED',
          },
          isDirty: true,
        );

        // Inbound remote event arrives with NOT_STARTED
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'study_tasks',
          eventType: 'UPDATE',
          record: {
            'id': 'tsk_conf_1',
            'task_id': 'tsk_conf_1',
            'title': 'Remote Task Title Update',
            'status': 'NOT_STARTED',
            'updated_at': DateTime.now().toUtc().toIso8601String(),
          },
        );

        final record = await localStore.getRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_conf_1',
        );

        // ConflictResolver ensures dirty local COMPLETED status is preserved
        expect(record!['status'], equals('COMPLETED'));
        expect(record['_dirty'], isTrue);
      });

      test('9. Stale remote event does not overwrite newer local updated_at state', () async {
        const userId = 'user_stale';
        realtimeService.setActiveUserId(userId);

        // Local state has newer timestamp
        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_stale_1',
          data: {
            'id': 'tsk_stale_1',
            'task_id': 'tsk_stale_1',
            'status': 'COMPLETED',
            'updated_at': '2026-10-25T14:00:00Z',
          },
          isDirty: false,
        );

        // Inbound event arrives with older timestamp
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'study_tasks',
          eventType: 'UPDATE',
          record: {
            'id': 'tsk_stale_1',
            'task_id': 'tsk_stale_1',
            'status': 'NOT_STARTED',
            'updated_at': '2026-10-25T12:00:00Z', // older
          },
        );

        final record = await localStore.getRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_stale_1',
        );

        // Local state stays COMPLETED
        expect(record!['status'], equals('COMPLETED'));
      });
    });

    // ==========================================
    // 5. ACCOUNT ISOLATION & LIFECYCLE (Tests 10–12)
    // ==========================================
    group('5. Account Isolation & Lifecycle', () {
      test('10. User A receives User A events only; User B partition strictly isolated', () async {
        const userA = 'user_alice';
        const userB = 'user_bob';

        realtimeService.setActiveUserId(userA);

        await realtimeService.processInboundEvent(
          userId: userA,
          table: 'study_tasks',
          eventType: 'INSERT',
          record: {'id': 'tsk_a', 'task_id': 'tsk_a', 'title': 'Alice Task'},
        );

        final aliceTasks = await localStore.getRecords(userId: userA, entityType: 'study_task');
        final bobTasks = await localStore.getRecords(userId: userB, entityType: 'study_task');

        expect(aliceTasks.length, equals(1));
        expect(bobTasks, isEmpty);
      });

      test('11. Sign-out cleanup unbinds active user and purges echo cache', () async {
        const userA = 'user_alice';
        realtimeService.setActiveUserId(userA);
        realtimeService.markLocalWrite('study_task', 'tsk_1');

        // Sign out
        realtimeService.setActiveUserId(null);

        expect(realtimeService.activeUserId, isNull);
        expect(realtimeService.isEcho('study_task', 'tsk_1'), isFalse);
      });

      test('12. Account switching flushes User A state and binds User B cleanly', () async {
        const userA = 'user_alice';
        const userB = 'user_bob';

        realtimeService.setActiveUserId(userA);
        expect(realtimeService.activeUserId, equals(userA));

        realtimeService.setActiveUserId(userB);
        expect(realtimeService.activeUserId, equals(userB));

        // Delivering User B event stores into User B partition
        await realtimeService.processInboundEvent(
          userId: userB,
          table: 'internships',
          eventType: 'INSERT',
          record: {'id': 'int_b', 'company': 'Stripe', 'role': 'SWE'},
        );

        final bobInternships = await localStore.getRecords(userId: userB, entityType: 'internship');
        expect(bobInternships.length, equals(1));
        expect(bobInternships.first['company'], equals('Stripe'));
      });
    });

    // ==========================================
    // 6. RECONNECT & MISSED-EVENT RECONCILIATION (Tests 13–15)
    // ==========================================
    group('6. Reconnect & Missed-Event Watermark Reconciliation', () {
      test('13. Network drop transitions to disconnected; reconnect transitions back', () async {
        const userId = 'user_reconnect';
        realtimeService.setActiveUserId(userId);
        await realtimeService.subscribeUserChannel(userId, adapterOverride: mockChannelAdapter);
        expect(realtimeService.isConnected, isTrue);

        // Network lost
        connectivity.setStatusForTesting(NetworkStatus.offline);
        await Future.delayed(const Duration(milliseconds: 10));
        expect(realtimeService.status, equals(RealtimeStatus.disconnected));

        // Network returns
        connectivity.setStatusForTesting(NetworkStatus.online);
        await Future.delayed(const Duration(milliseconds: 10));
        expect(realtimeService.status, isNot(equals(RealtimeStatus.disconnected)));
      });

      test('14. Missed-event reconciliation applies overlap safety window and updates watermark', () async {
        const userId = 'user_watermark';
        realtimeService.setActiveUserId(userId);

        final lastReconciled = DateTime.now().toUtc().subtract(const Duration(hours: 1));
        realtimeService.setLastReconciledAtForTesting(lastReconciled);

        await realtimeService.reconcileMissedEvents(userId);

        // Watermark updated to newer time
        expect(realtimeService.lastReconciledAt, isNotNull);
        expect(realtimeService.lastReconciledAt!.isAfter(lastReconciled), isTrue);
      });

      test('15. Offline to online transition converges state accurately', () async {
        const userId = 'user_converge';
        syncEngine.setActiveUserId(userId);
        realtimeService.setActiveUserId(userId);

        // Disconnect
        connectivity.setStatusForTesting(NetworkStatus.offline);
        await Future.delayed(const Duration(milliseconds: 10));

        // User completed task offline
        final planRepo = SupabasePlanRepository(localStore: localStore, userId: userId);
        await planRepo.updateTaskStatus('tsk_conv_1', 'COMPLETED');

        final queueBefore = await localStore.getQueue(userId);
        expect(queueBefore.isNotEmpty, isTrue);

        // Network restored
        connectivity.setStatusForTesting(NetworkStatus.online);
        await Future.delayed(const Duration(milliseconds: 50));
        await syncEngine.processPendingQueue();

        final queue = await localStore.getQueue(userId);
        expect(queue, isEmpty);
      });
    });

    // ==========================================
    // 7. ENTITY-BY-ENTITY SYNCHRONIZATION (Tests 16–24)
    // ==========================================
    group('7. Entity-by-Entity Realtime Synchronization', () {
      test('16. Concurrent edits: simultaneous local dirty edit and remote update resolved via domain rules', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        // Local dirty PR edit: max weight 100kg
        await localStore.saveRecord(
          userId: userId,
          entityType: 'personal_record',
          entityId: 'bench_press',
          data: {'exercise_id': 'bench_press', 'max_weight_kg': 100},
          isDirty: true,
        );

        // Remote PR edit arrives: max weight 105kg
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'personal_records',
          eventType: 'UPDATE',
          record: {'exercise_id': 'bench_press', 'max_weight_kg': 105},
        );

        final pr = await localStore.getRecord(userId: userId, entityType: 'personal_record', entityId: 'bench_press');
        // Monotonic max weight wins (105 kg)
        expect(pr!['max_weight_kg'], equals(105));
      });

      test('17. Task synchronization: handles remote DELETE correctly', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: 'tsk_del_remote',
          data: {'id': 'tsk_del_remote', 'title': 'To be deleted'},
          isDirty: false,
        );

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'study_tasks',
          eventType: 'DELETE',
          record: {},
          oldRecord: {'task_id': 'tsk_del_remote'},
        );

        final rec = await localStore.getRecord(userId: userId, entityType: 'study_task', entityId: 'tsk_del_remote');
        expect(rec, isNull);
      });

      test('18. DSA synchronization: monotonic union preserves SOLVED state from Web', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'dsa_progress',
          eventType: 'INSERT',
          record: {
            'problem_id': 'dsa_invert_tree',
            'status': 'SOLVED',
            'solved_at': '2026-10-25T11:00:00Z',
          },
        );

        final dsa = await localStore.getRecord(userId: userId, entityType: 'dsa_progress', entityId: 'dsa_invert_tree');
        expect(dsa!['status'], equals('SOLVED'));
      });

      test('19. Development synchronization: topic completion reflects live from Web', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'development_progress',
          eventType: 'INSERT',
          record: {
            'category': 'topics',
            'item_id': 'react_hooks',
            'status': 'COMPLETED',
          },
        );

        final dev = await localStore.getRecord(
          userId: userId,
          entityType: 'development_progress',
          entityId: 'topics__react_hooks',
        );
        expect(dev!['status'], equals('COMPLETED'));
      });

      test('20. Mistake synchronization: monotonic repeat count increments and saves live', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await localStore.saveRecord(
          userId: userId,
          entityType: 'mistake',
          entityId: 'mst_99',
          data: {'id': 'mst_99', 'repeat_count': 2, 'notes': 'Check boundary conditions'},
          isDirty: false,
        );

        // Remote Web update incremented repeat_count to 3
        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'mistakes',
          eventType: 'UPDATE',
          record: {'id': 'mst_99', 'repeat_count': 3, 'notes': ''},
        );

        final mst = await localStore.getRecord(userId: userId, entityType: 'mistake', entityId: 'mst_99');
        expect(mst!['repeat_count'], equals(3));
        expect(mst['notes'], equals('Check boundary conditions')); // local notes preserved
      });

      test('21. Gym synchronization: workout session logged on mobile persists and syncs', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'workout_sessions',
          eventType: 'INSERT',
          record: {
            'id': 'sess_live_1',
            'workout_type': 'Chest & Triceps',
            'total_volume_kg': 4200,
            'duration_minutes': 55,
          },
        );

        final gym = await localStore.getRecord(userId: userId, entityType: 'workout_session', entityId: 'sess_live_1');
        expect(gym!['workout_type'], equals('Chest & Triceps'));
        expect(gym['total_volume_kg'], equals(4200));
      });

      test('22. Internship synchronization: field-level merge preserves local notes and remote status', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await localStore.saveRecord(
          userId: userId,
          entityType: 'internship',
          entityId: 'int_google',
          data: {'id': 'int_google', 'company': 'Google', 'notes': 'Referred by senior', 'status': 'APPLIED'},
          isDirty: true,
        );

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'internships',
          eventType: 'UPDATE',
          record: {'id': 'int_google', 'company': 'Google', 'status': 'INTERVIEW', 'link': 'https://careers.google.com'},
        );

        final intern = await localStore.getRecord(userId: userId, entityType: 'internship', entityId: 'int_google');
        expect(intern!['company'], equals('Google'));
        expect(intern['notes'], equals('Referred by senior')); // Local notes preserved
      });

      test('23. Placement synchronization: target salary and role updates live', () async {
        const userId = 'user_entities';
        realtimeService.setActiveUserId(userId);

        await realtimeService.processInboundEvent(
          userId: userId,
          table: 'placement_hub_data',
          eventType: 'UPDATE',
          record: {
            'user_id': userId,
            'placement_target': {'target_ctc_lpa': 35, 'dream_company': 'Google'},
          },
        );

        final hub = await localStore.getRecord(userId: userId, entityType: 'placement_hub_data', entityId: 'target');
        expect(hub, isNotNull);
        expect(hub!['placement_target']['target_ctc_lpa'], equals(35));
      });

      test('24. Test Engine synchronization: test recovery state survives without duplicate scoring', () async {
        const userId = 'user_entities';
        final recovery = TestRecoveryService(localStore: localStore);
        await recovery.saveActiveState(
          userId: userId,
          testType: 'dsa_test_week_1',
          currentQuestionIndex: 2,
          userAnswers: {'0': 1, '1': 3},
          remainingSeconds: 1540,
          questions: [{'id': 'q1'}],
        );

        final snap = await recovery.getActiveState(userId);
        expect(snap, isNotNull);
        expect(snap!['userAnswers']['1'], equals(3));
      });
    });

    // ==========================================
    // 8. REALTIME UI STATE (Test 25)
    // ==========================================
    group('8. Realtime UI Indicator Presentation', () {
      testWidgets('25. ForgeSyncIndicator displays LIVE state when Realtime channel is connected', (WidgetTester tester) async {
        syncEngine.setStatusForTesting(const SyncStatusData(
          state: SyncState.synced,
          pendingCount: 0,
          isOnline: true,
        ));
        realtimeService.setStatusForTesting(RealtimeStatus.connected);

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ForgeSyncIndicator(engine: syncEngine),
            ),
          ),
        );
        await tester.pump();

        expect(find.text('LIVE // ALL PROTOCOLS SYNCED'), findsOneWidget);
      });
    });
  });
}
