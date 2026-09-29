import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/sync/conflict/conflict_resolver.dart';
import '../../../core/sync/engine/sync_engine.dart';
import '../../../core/sync/models/sync_operation.dart';
import '../../../core/sync/storage/local_store.dart';
import '../../auth/data/auth_service.dart';
import '../domain/mistake.dart';
import 'mistake_repository.dart';

/// Production Supabase implementation of [MistakeRepository] with offline persistence and sync.
/// Queries `public.mistakes` with RLS enforced by Supabase auth.
class SupabaseMistakeRepository implements MistakeRepository {
  final SupabaseClient? _clientOverride;
  final LocalStore _localStore;

  String? _cachedUserId;
  final List<Mistake> _cache = [];

  SupabaseMistakeRepository({
    SupabaseClient? client,
    LocalStore? localStore,
  })  : _clientOverride = client,
        _localStore = localStore ?? LocalStore.instance;

  SupabaseClient? get _client => _clientOverride ?? ForgeSupabase.instance.client;

  String? get _currentUserId => AuthService.current.currentUser?.id ?? _client?.auth.currentUser?.id;

  void _checkUserCache() {
    final uid = _currentUserId;
    if (_cachedUserId != uid) {
      _cachedUserId = uid;
      _cache.clear();
    }
  }

  @override
  void invalidateCache() {
    _cache.clear();
    _cachedUserId = null;
  }

  @override
  Future<List<Mistake>> getMistakes({
    String? subject,
    String? status,
    String? query,
  }) async {
    _checkUserCache();
    final client = _client;
    final userId = _currentUserId ?? 'anonymous';

    // 1. Read from persistent local store
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'mistake',
    );
    if (localRecords.isNotEmpty) {
      _cache.clear();
      _cache.addAll(localRecords.map((r) => Mistake.fromMap(r)));
    }

    if (client == null || _currentUserId == null) {
      return _filterLocal(subject, status, query);
    }

    // 2. Fetch remote data when online
    try {
      var builder = client
          .from('mistakes')
          .select('*')
          .eq('user_id', userId);

      if (subject != null && subject.isNotEmpty && subject.toLowerCase() != 'all') {
        builder = builder.eq('subject', subject);
      }

      final res = await builder.order('created_at', ascending: false);
      final remoteList = (res as List)
          .map((m) => Mistake.fromMap(m as Map<String, dynamic>))
          .toList();

      final List<Mistake> reconciled = [];
      for (final rMistake in remoteList) {
        final existingLocal = localRecords.firstWhere(
          (l) => l['id'] == rMistake.id,
          orElse: () => <String, dynamic>{},
        );

        final resolvedMap = ConflictResolver.resolve(
          entityType: 'mistake',
          localData: existingLocal,
          remoteData: rMistake.toMap(),
        );

        final m = Mistake.fromMap(resolvedMap);
        reconciled.add(m);

        await _localStore.saveRecord(
          userId: userId,
          entityType: 'mistake',
          entityId: m.id,
          data: m.toMap(),
          isDirty: existingLocal['_dirty'] == true,
        );
      }

      // Preserve local offline additions
      for (final local in _cache) {
        if (!reconciled.any((r) => r.id == local.id)) {
          reconciled.add(local);
        }
      }

      _cache.clear();
      _cache.addAll(reconciled);

      return _filterLocal(subject, status, query);
    } catch (e) {
      debugPrint('[SupabaseMistakeRepository] getMistakes network error: $e');
      return _filterLocal(subject, status, query);
    }
  }

  List<Mistake> _filterLocal(String? subject, String? status, String? query) {
    List<Mistake> list = List.from(_cache);

    if (subject != null && subject.isNotEmpty && subject.toLowerCase() != 'all') {
      list = list.where((m) => m.subject.toLowerCase() == subject.toLowerCase()).toList();
    }

    if (status != null && status.isNotEmpty && status.toLowerCase() != 'all') {
      final nowStr = DateTime.now().toIso8601String().substring(0, 10);
      switch (status) {
        case 'unresolved':
          list = list.where((m) => !m.resolved).toList();
          break;
        case 'resolved':
          list = list.where((m) => m.resolved).toList();
          break;
        case 'repeated':
          list = list.where((m) => m.repeatCount > 1).toList();
          break;
        case 'dueRevision':
          list = list.where((m) => m.isDueForRevision(nowStr)).toList();
          break;
      }
    }

    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      list = list.where((m) {
        return m.question.toLowerCase().contains(q) ||
            m.topic.toLowerCase().contains(q) ||
            (m.explanation?.toLowerCase().contains(q) ?? false) ||
            (m.personalNote?.toLowerCase().contains(q) ?? false);
      }).toList();
    }

    return list;
  }

  @override
  Future<MistakeStats> getMistakeStats() async {
    _checkUserCache();
    if (_cache.isEmpty) {
      await getMistakes();
    }
    return _computeStatsFromList(_cache);
  }

  MistakeStats _computeStatsFromList(List<Mistake> list) {
    if (list.isEmpty) return const MistakeStats();

    final todayStr = DateTime.now().toIso8601String().substring(0, 10);
    final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7)).toIso8601String().substring(0, 10);

    int total = list.length;
    int unresolved = 0;
    int repeated = 0;
    int dueForRevision = 0;
    int recent7d = 0;
    final Map<String, int> vectorCounts = {};

    for (final m in list) {
      if (!m.resolved) unresolved++;
      if (m.repeatCount > 1) repeated++;
      if (m.isDueForRevision(todayStr)) dueForRevision++;
      if (m.date.compareTo(sevenDaysAgo) >= 0) recent7d++;

      final key = m.topic.isNotEmpty ? m.topic : m.mistakeType;
      vectorCounts[key] = (vectorCounts[key] ?? 0) + 1;
    }

    String topVector = 'None';
    int maxCount = 0;
    vectorCounts.forEach((k, v) {
      if (v > maxCount) {
        maxCount = v;
        topVector = k;
      }
    });

    final accuracy = total > 0 ? ((total - unresolved) / total) * 100.0 : 0.0;

    return MistakeStats(
      total: total,
      unresolved: unresolved,
      repeated: repeated,
      dueForRevision: dueForRevision,
      recent7d: recent7d,
      recoveryAccuracy: accuracy,
      topDeficitVector: topVector,
    );
  }

  @override
  Future<Mistake?> getMistakeById(String id) async {
    _checkUserCache();
    try {
      return _cache.firstWhere((m) => m.id == id);
    } catch (_) {
      final userId = _currentUserId ?? 'anonymous';
      final rec = await _localStore.getRecord(
        userId: userId,
        entityType: 'mistake',
        entityId: id,
      );
      if (rec != null) return Mistake.fromMap(rec);
      return null;
    }
  }

  @override
  Future<Mistake> createMistake(Mistake mistake) async {
    _checkUserCache();
    final userId = _currentUserId ?? 'anonymous';
    final now = DateTime.now();

    final stableId = mistake.id.isNotEmpty
        ? mistake.id
        : 'mst_${DateTime.now().microsecondsSinceEpoch}';

    final created = mistake.copyWith(
      id: stableId,
      userId: userId,
      createdAt: mistake.createdAt,
      updatedAt: now,
    );

    // 1. Update memory cache
    _cache.insert(0, created);

    // 2. Persist locally with dirty flag
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'mistake',
      entityId: stableId,
      data: created.toMap(),
      isDirty: true,
    );

    // 3. Persistent Sync Queue operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'mistake',
      entityId: stableId,
      operationType: SyncOperationType.create,
      payload: created.toMap(),
    );
    await _localStore.enqueue(op);

    // 4. Background sync
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return created;
  }

  @override
  Future<Mistake> updateMistake(Mistake mistake) async {
    _checkUserCache();
    final userId = _currentUserId ?? 'anonymous';
    final now = DateTime.now();

    final updated = mistake.copyWith(updatedAt: now);

    // 1. Update memory cache
    final idx = _cache.indexWhere((m) => m.id == mistake.id);
    if (idx >= 0) {
      _cache[idx] = updated;
    } else {
      _cache.insert(0, updated);
    }

    // 2. Persist locally
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'mistake',
      entityId: mistake.id,
      data: updated.toMap(),
      isDirty: true,
    );

    // 3. Persistent Sync Queue operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'mistake',
      entityId: mistake.id,
      operationType: SyncOperationType.update,
      payload: updated.toMap(),
    );
    await _localStore.enqueue(op);

    // 4. Background sync
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return updated;
  }

  @override
  Future<Mistake> toggleResolved(String id, bool currentResolved) async {
    _checkUserCache();
    final mistake = await getMistakeById(id);
    if (mistake == null) {
      throw StateError('Mistake not found: $id');
    }
    final updated = mistake.copyWith(resolved: !currentResolved);
    return updateMistake(updated);
  }

  @override
  Future<Mistake> incrementRevisit(String id) async {
    _checkUserCache();
    final mistake = await getMistakeById(id);
    if (mistake == null) {
      throw StateError('Mistake not found: $id');
    }
    final nextDate = DateTime.now().add(const Duration(days: 3)).toIso8601String().substring(0, 10);
    final updated = mistake.copyWith(
      repeatCount: mistake.repeatCount + 1,
      revisitDate: nextDate,
      resolved: false,
    );
    return updateMistake(updated);
  }

  @override
  Future<bool> deleteMistake(String id) async {
    _checkUserCache();
    final userId = _currentUserId ?? 'anonymous';

    _cache.removeWhere((m) => m.id == id);
    await _localStore.deleteRecord(
      userId: userId,
      entityType: 'mistake',
      entityId: id,
    );

    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'mistake',
      entityId: id,
      operationType: SyncOperationType.delete,
      payload: {'id': id, 'user_id': userId},
    );
    await _localStore.enqueue(op);

    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return true;
  }
}
