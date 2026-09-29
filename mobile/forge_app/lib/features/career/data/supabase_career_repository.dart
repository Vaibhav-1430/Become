import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/sync/conflict/conflict_resolver.dart';
import '../../../../core/sync/engine/sync_engine.dart';
import '../../../../core/sync/models/sync_operation.dart';
import '../../../../core/sync/storage/local_store.dart';
import '../../auth/data/auth_service.dart';
import '../domain/internship.dart';
import '../domain/placement_readiness.dart';
import 'career_repository.dart';

/// Production-grade Supabase implementation of [CareerRepository] with offline persistence and sync.
/// Queries `public.internships` and `public.placement_hub_data` with strict RLS and user isolation.
class SupabaseCareerRepository implements CareerRepository {
  final SupabaseClient? _clientOverride;
  final LocalStore _localStore;
  String? _overrideUserId;

  SupabaseCareerRepository({
    String? overrideUserId,
    SupabaseClient? client,
    LocalStore? localStore,
  })  : _overrideUserId = overrideUserId,
        _clientOverride = client,
        _localStore = localStore ?? LocalStore.instance;

  SupabaseClient? get _client {
    final override = _clientOverride;
    if (override != null) return override;
    if (ForgeSupabase.instance.isInitialized) {
      return ForgeSupabase.instance.client;
    }
    return null;
  }

  @override
  void setUserId(String? userId) {
    _overrideUserId = userId;
  }

  String get _currentUserId {
    final uid = _overrideUserId ?? AuthService.current.currentUser?.id ?? _client?.auth.currentUser?.id;
    if (uid == null || uid.isEmpty) {
      throw StateError('User not authenticated');
    }
    return uid;
  }

  @override
  Future<List<Internship>> getInternships({String? statusFilter, String? searchQuery}) async {
    final userId = _currentUserId;

    // 1. Read from local store
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'internship',
    );
    final localItems = localRecords.map((r) => Internship.fromJson(r)).toList();

    List<Internship> items = localItems;

    // 2. Fetch remote when online
    final client = _client;
    if (client != null) {
      try {
        var query = client
            .from('internships')
            .select()
            .eq('user_id', userId);

        if (statusFilter != null && statusFilter.isNotEmpty && statusFilter.toUpperCase() != 'ALL') {
          query = query.eq('status', statusFilter.toUpperCase());
        }

        final response = await query.order('created_at', ascending: false);
      final remoteList = (response as List<dynamic>)
          .map((json) => Internship.fromJson(json as Map<String, dynamic>))
          .toList();

      final List<Internship> reconciled = [];
      for (final remote in remoteList) {
        final existingLocal = localRecords.firstWhere(
          (l) => l['id'] == remote.id,
          orElse: () => <String, dynamic>{},
        );

        final resolvedMap = ConflictResolver.resolve(
          entityType: 'internship',
          localData: existingLocal,
          remoteData: remote.toJson(includeId: true),
        );

        final item = Internship.fromJson(resolvedMap);
        reconciled.add(item);

        await _localStore.saveRecord(
          userId: userId,
          entityType: 'internship',
          entityId: item.id,
          data: item.toJson(includeId: true),
          isDirty: existingLocal['_dirty'] == true,
        );
      }

      // Preserve local un-synced additions
      for (final local in localItems) {
        if (!reconciled.any((r) => r.id == local.id)) {
          reconciled.add(local);
        }
      }

      items = reconciled;
    } catch (e) {
      debugPrint('[SupabaseCareerRepository] getInternships network error: $e');
      items = localItems;
    }
  }

  if (statusFilter != null && statusFilter.isNotEmpty && statusFilter.toUpperCase() != 'ALL') {
      items = items.where((i) => i.status.toUpperCase() == statusFilter.toUpperCase()).toList();
    }

    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      final q = searchQuery.trim().toLowerCase();
      return items.where((i) =>
        i.company.toLowerCase().contains(q) ||
        i.role.toLowerCase().contains(q) ||
        (i.notes?.toLowerCase().contains(q) ?? false)
      ).toList();
    }

    return items;
  }

  @override
  Future<Internship?> getInternshipById(String id) async {
    final userId = _currentUserId;

    // Check local store first
    final localRec = await _localStore.getRecord(
      userId: userId,
      entityType: 'internship',
      entityId: id,
    );
    if (localRec != null) {
      return Internship.fromJson(localRec);
    }

    final client = _client;
    if (client != null) {
      try {
        final response = await client
            .from('internships')
            .select()
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

        if (response == null) return null;
        return Internship.fromJson(response);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  @override
  Future<Internship> createInternship(Internship internship) async {
    final userId = _currentUserId;
    final stableId = internship.id.isNotEmpty
        ? internship.id
        : 'int_${DateTime.now().microsecondsSinceEpoch}';

    final created = internship.copyWith(id: stableId, userId: userId);
    final row = created.toJson(includeId: true, forCloud: true);
    row['user_id'] = userId;

    // 1. Save locally with dirty flag
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'internship',
      entityId: stableId,
      data: row,
      isDirty: true,
    );

    // 2. Persistent Sync Queue operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'internship',
      entityId: stableId,
      operationType: SyncOperationType.create,
      payload: row,
    );
    await _localStore.enqueue(op);

    // 3. Trigger SyncEngine in background
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return created;
  }

  @override
  Future<Internship> updateInternship(Internship internship) async {
    final userId = _currentUserId;
    final row = internship.toJson(includeId: true, forCloud: true);
    row['user_id'] = userId;

    // 1. Save locally
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'internship',
      entityId: internship.id,
      data: row,
      isDirty: true,
    );

    // 2. Persistent Sync Queue operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'internship',
      entityId: internship.id,
      operationType: SyncOperationType.update,
      payload: row,
    );
    await _localStore.enqueue(op);

    // 3. Trigger SyncEngine in background
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return internship;
  }

  @override
  Future<void> deleteInternship(String id) async {
    final userId = _currentUserId;

    await _localStore.deleteRecord(
      userId: userId,
      entityType: 'internship',
      entityId: id,
    );

    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'internship',
      entityId: id,
      operationType: SyncOperationType.delete,
      payload: {'id': id, 'user_id': userId},
    );
    await _localStore.enqueue(op);

    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();
  }

  @override
  Future<InternshipPipelineStats> getPipelineStats() async {
    final items = await getInternships();
    return InternshipPipelineStats.fromInternships(items);
  }

  @override
  Future<PlacementReadiness> getPlacementReadiness() async {
    final userId = _currentUserId;

    final client = _client;
    if (client != null) {
      try {
        final results = await Future.wait<dynamic>([
          client.from('dsa_progress').select('problem_id, status').eq('user_id', userId),
          client.from('development_progress').select('item_id, category, status').eq('user_id', userId),
          client.from('placement_hub_data').select('*').eq('user_id', userId).maybeSingle(),
          client.from('internships').select('id, status').eq('user_id', userId),
        ]);

      final dsaRows = (results[0] as List<dynamic>?) ?? [];
      final dsaSolved = dsaRows.where((r) {
        final s = (r['status'] as String? ?? '').toUpperCase();
        return s == 'SOLVED' || s == 'COMPLETED';
      }).length;

      final devRows = (results[1] as List<dynamic>?) ?? [];
      final devCompleted = devRows.where((r) {
        final cat = r['category'] as String? ?? 'topics';
        final s = (r['status'] as String? ?? '').toUpperCase();
        return cat == 'topics' && (s == 'SOLVED' || s == 'COMPLETED');
      }).length;

      int mockInterviews = 0;
      int questionsPracticed = 0;
      int questionsMastered = 0;
      int weeklyTests = 0;
      double weeklyTestAvgAccuracy = 0.0;
      int coreTopicsDone = 0;
      int sysDesignTopicsDone = 0;

      final hub = results[2] as Map<String, dynamic>?;
      if (hub != null) {
        await _localStore.saveRecord(
          userId: userId,
          entityType: 'placement_hub_data',
          entityId: 'readiness',
          data: hub,
          isDirty: false,
        );

        mockInterviews = (hub['mock_interviews_count'] as num?)?.toInt() ?? 0;
        questionsPracticed = (hub['questions_practiced'] as num?)?.toInt() ?? 0;
        questionsMastered = (hub['questions_mastered'] as num?)?.toInt() ?? 0;
        weeklyTests = (hub['weekly_tests_completed'] as num?)?.toInt() ?? 0;
        weeklyTestAvgAccuracy = (hub['weekly_test_avg_accuracy'] as num?)?.toDouble() ?? 0.0;
        coreTopicsDone = (hub['core_topics_done'] as num?)?.toInt() ?? 0;
        sysDesignTopicsDone = (hub['sys_design_topics_done'] as num?)?.toInt() ?? 0;
      }

      int projectsCompleted = 0;
      int projectsInProgress = 0;
      for (final r in devRows) {
        final cat = r['category'] as String? ?? '';
        if (cat == 'projects') {
          final s = (r['status'] as String? ?? '').toUpperCase();
          if (s == 'COMPLETED') projectsCompleted++;
          if (s == 'IN_PROGRESS') projectsInProgress++;
        }
      }

      return PlacementReadiness.compute(
        dsaSolved: dsaSolved,
        dsaTotal: 443,
        devCompletedTopics: devCompleted,
        devTotalTopics: 13,
        projectsCompleted: projectsCompleted,
        projectsInProgress: projectsInProgress,
        coreTopicsDone: coreTopicsDone,
        coreTopicsTotal: 45,
        sysDesignTopicsDone: sysDesignTopicsDone,
        sysDesignTopicsTotal: 15,
        mockInterviewsCount: mockInterviews,
        questionsPracticed: questionsPracticed,
        questionsMastered: questionsMastered,
        weeklyTestsCompleted: weeklyTests,
        weeklyTestAvgAccuracy: weeklyTestAvgAccuracy,
      );
    } catch (_) {
      // Fall through to local fallback
    }
  }

  // Offline fallback: load cached telemetry from local store
  final localHub = await _localStore.getRecord(
    userId: userId,
    entityType: 'placement_hub_data',
    entityId: 'readiness',
  );
  final dsaRecords = await _localStore.getRecords(userId: userId, entityType: 'dsa_progress');
  final devRecords = await _localStore.getRecords(userId: userId, entityType: 'development_progress');

  final dsaSolved = dsaRecords.where((r) => r['status'] == 'SOLVED').length;
  final devCompleted = devRecords.where((r) => r['status'] == 'COMPLETED').length;

  return PlacementReadiness.compute(
    dsaSolved: dsaSolved,
    dsaTotal: 443,
    devCompletedTopics: devCompleted,
    devTotalTopics: 13,
    projectsCompleted: 0,
    projectsInProgress: 0,
    coreTopicsDone: (localHub?['core_topics_done'] as num?)?.toInt() ?? 0,
    coreTopicsTotal: 45,
    sysDesignTopicsDone: (localHub?['sys_design_topics_done'] as num?)?.toInt() ?? 0,
    sysDesignTopicsTotal: 15,
    mockInterviewsCount: (localHub?['mock_interviews_count'] as num?)?.toInt() ?? 0,
    questionsPracticed: (localHub?['questions_practiced'] as num?)?.toInt() ?? 0,
    questionsMastered: (localHub?['questions_mastered'] as num?)?.toInt() ?? 0,
    weeklyTestsCompleted: (localHub?['weekly_tests_completed'] as num?)?.toInt() ?? 0,
    weeklyTestAvgAccuracy: (localHub?['weekly_test_avg_accuracy'] as num?)?.toDouble() ?? 0.0,
  );
}

@override
Future<PlacementTarget> getPlacementTarget() async {
  final userId = _currentUserId;

  final localRec = await _localStore.getRecord(
    userId: userId,
    entityType: 'placement_hub_data',
    entityId: 'target',
  );
  if (localRec != null) {
    return PlacementTarget.fromJson(localRec);
  }

  final client = _client;
  if (client != null) {
    try {
      final response = await client
          .from('placement_hub_data')
          .select('placement_target')
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null && response['placement_target'] != null) {
        final targetJson = response['placement_target'];
        if (targetJson is Map<String, dynamic>) {
          final t = PlacementTarget.fromJson(targetJson);
          await _localStore.saveRecord(
            userId: userId,
            entityType: 'placement_hub_data',
            entityId: 'target',
            data: t.toJson(),
            isDirty: false,
          );
          return t;
        }
      }
    } catch (_) {
      // Fall through to default
    }
  }
  return const PlacementTarget();
}

  @override
  Future<void> updatePlacementTarget(PlacementTarget target) async {
    final userId = _currentUserId;

    await _localStore.saveRecord(
      userId: userId,
      entityType: 'placement_hub_data',
      entityId: 'target',
      data: target.toJson(),
      isDirty: true,
    );

    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'placement_hub_data',
      entityId: 'target',
      operationType: SyncOperationType.update,
      payload: {
        'user_id': userId,
        'placement_target': target.toJson(),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
    );
    await _localStore.enqueue(op);

    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();
  }
}
