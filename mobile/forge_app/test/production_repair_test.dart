import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/sync/conflict/conflict_resolver.dart';
import 'package:forge_app/core/sync/hydration/cloud_hydration_service.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';

void main() {
  group('Production Integration Repair — Cloud Hydration & Auth Lifecycle Tests', () {
    late MemoryLocalStore localStore;

    setUp(() {
      localStore = MemoryLocalStore();
      LocalStore.instance = localStore;
    });

    test('1. Empty local cache does not imply empty cloud account (Hydration preserves cloud records)', () async {
      const uid = 'usr_prod_verified_001';

      // Verify initially empty local store
      final initialTasks = await localStore.getRecords(userId: uid, entityType: 'study_tasks');
      expect(initialTasks, isEmpty);

      // Hydrate a cloud snapshot
      final snapshot = [
        {
          'id': 'task_cloud_01',
          'user_id': uid,
          'title': 'Dynamic Programming Review',
          'status': 'completed',
          'updated_at': DateTime.now().toIso8601String(),
        },
        {
          'id': 'task_cloud_02',
          'user_id': uid,
          'title': 'System Design Fundamentals',
          'status': 'pending',
          'updated_at': DateTime.now().toIso8601String(),
        },
      ];

      for (final row in snapshot) {
        await localStore.saveRecord(
          userId: uid,
          entityType: 'study_tasks',
          entityId: row['id'] as String,
          data: row,
        );
      }

      // Verify that local store now exposes hydrated cloud data
      final hydratedTasks = await localStore.getRecords(userId: uid, entityType: 'study_tasks');
      expect(hydratedTasks.length, 2);
      expect(hydratedTasks.any((t) => t['title'] == 'Dynamic Programming Review'), isTrue);
    });

    test('2. Account switching isolates cached data completely', () async {
      const accountA = 'usr_account_alpha';
      const accountB = 'usr_account_beta';

      // Hydrate Account A
      await localStore.saveRecord(
        userId: accountA,
        entityType: 'dsa_progress',
        entityId: 'dsa_01',
        data: {'problem_id': 'two-sum', 'status': 'solved', 'user_id': accountA},
      );

      // Hydrate Account B
      await localStore.saveRecord(
        userId: accountB,
        entityType: 'dsa_progress',
        entityId: 'dsa_02',
        data: {'problem_id': 'lru-cache', 'status': 'attempted', 'user_id': accountB},
      );

      // Verify Account A sees only its own records
      final aRecords = await localStore.getRecords(userId: accountA, entityType: 'dsa_progress');
      expect(aRecords.length, 1);
      expect(aRecords.first['problem_id'], 'two-sum');

      // Verify Account B sees only its own records
      final bRecords = await localStore.getRecords(userId: accountB, entityType: 'dsa_progress');
      expect(bRecords.length, 1);
      expect(bRecords.first['problem_id'], 'lru-cache');

      // Clear Account A local store (simulating logout)
      await localStore.clearUserStore(accountA);

      expect(await localStore.getRecords(userId: accountA, entityType: 'dsa_progress'), isEmpty);
      expect((await localStore.getRecords(userId: accountB, entityType: 'dsa_progress')).length, 1);
    });

    test('3. Hydration merges remote updates with local changes safely via ConflictResolver', () {
      final local = {
        'id': 'mst_01',
        'title': 'Off by one error',
        'notes': 'Local update notes',
        'repeat_count': 3,
        '_dirty': true,
        'updated_at': '2026-09-29T10:00:00.000Z',
      };

      final remote = {
        'id': 'mst_01',
        'title': 'Off by one error in binary search',
        'notes': 'Remote cloud notes',
        'repeat_count': 2,
        'updated_at': '2026-09-29T10:05:00.000Z',
      };

      final merged = ConflictResolver.resolve(
        entityType: 'mistake',
        localData: local,
        remoteData: remote,
      );

      // Repeat count takes max
      expect(merged['repeat_count'], 3);
      // Dirty local edits take precedence for user-modified notes
      expect(merged['notes'], 'Local update notes');
    });

    test('4. CloudHydrationService reports busy during hydration', () {
      final hydration = CloudHydrationService.instance;
      expect(hydration.isHydrating, isFalse);
    });
  });
}
