import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/sync/conflict/conflict_resolver.dart';
import '../../../core/sync/engine/sync_engine.dart';
import '../../../core/sync/models/sync_operation.dart';
import '../../../core/sync/storage/local_store.dart';
import '../../../core/utils/forge_date_utils.dart';
import '../../auth/data/auth_service.dart';
import '../domain/study_session.dart';
import '../domain/study_task.dart';
import 'plan_repository.dart';

/// Production Supabase implementation of [PlanRepository] with offline persistence and sync.
/// Queries `public.study_tasks` and `public.study_sessions` with RLS.
class SupabasePlanRepository implements PlanRepository {
  final SupabaseClient? _clientOverride;
  final LocalStore _localStore;

  // In-memory cache for fast UI access
  final Map<String, List<StudyTask>> _dateTasksCache = {};

  final String? _clientUserIdOverride;
  String? _overrideUserId;

  SupabasePlanRepository({
    SupabaseClient? client,
    LocalStore? localStore,
    String? userId,
  })  : _clientOverride = client,
        _clientUserIdOverride = userId,
        _localStore = localStore ?? LocalStore.instance;

  SupabaseClient? get _client => _clientOverride ?? ForgeSupabase.instance.client;

  String? get _currentUserId => _overrideUserId ?? _clientUserIdOverride ?? AuthService.current.currentUser?.id ?? _client?.auth.currentUser?.id;

  void setUserId(String? userId) {
    _overrideUserId = userId;
  }

  @override
  Future<List<StudyTask>> getTasksForDate(String dateStr) async {
    final client = _client;
    final userId = _currentUserId ?? 'anonymous';

    // 1. Read from persistent local store first
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'study_task',
    );
    final localTasks = localRecords
        .where((r) => r['date'] == dateStr)
        .map((r) => StudyTask.fromMap(r))
        .toList();

    if (localTasks.isNotEmpty) {
      _dateTasksCache[dateStr] = localTasks;
    }

    if (client == null || _currentUserId == null) {
      return _dateTasksCache[dateStr] ?? localTasks;
    }

    // 2. Fetch remote data when online
    try {
      final res = await client
          .from('study_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateStr)
          .order('start_time', ascending: true);

      final List<StudyTask> remoteTasks = [];
      for (final raw in res as List) {
        final remoteMap = Map<String, dynamic>.from(raw as Map);
        final existingLocal = localRecords.firstWhere(
          (l) => l['id'] == remoteMap['id'],
          orElse: () => <String, dynamic>{},
        );

        // Conflict resolution: preserve local user actions if dirty
        final resolvedMap = ConflictResolver.resolve(
          entityType: 'study_task',
          localData: existingLocal,
          remoteData: remoteMap,
        );

        final task = StudyTask.fromMap(resolvedMap);
        remoteTasks.add(task);

        // Reconcile into local store
        await _localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: task.id,
          data: task.toMap(),
          isDirty: existingLocal['_dirty'] == true,
        );
      }

      // Preserve any purely offline tasks created locally that haven't synced yet
      for (final lt in localTasks) {
        if (!remoteTasks.any((rt) => rt.id == lt.id)) {
          remoteTasks.add(lt);
        }
      }

      _dateTasksCache[dateStr] = remoteTasks;
      return remoteTasks;
    } catch (e) {
      debugPrint('[SupabasePlanRepository] getTasksForDate network error: $e');
      return _dateTasksCache[dateStr] ?? localTasks;
    }
  }

  @override
  Future<Map<String, List<StudyTask>>> getTasksForMonth(int year, int month) async {
    final client = _client;
    final userId = _currentUserId ?? 'anonymous';

    final startDate = '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-01';
    final days = ForgeDateUtils.daysInMonth(year, month);
    final endDate = '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${days.toString().padLeft(2, '0')}';

    // 1. Read all local tasks for month from local store
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'study_task',
    );
    final Map<String, List<StudyTask>> grouped = {};
    for (final r in localRecords) {
      final d = r['date'] as String?;
      if (d != null && d.compareTo(startDate) >= 0 && d.compareTo(endDate) <= 0) {
        final task = StudyTask.fromMap(r);
        grouped.putIfAbsent(task.date, () => []).add(task);
        _dateTasksCache.putIfAbsent(task.date, () => []).add(task);
      }
    }

    if (client == null || _currentUserId == null) {
      return grouped.isNotEmpty ? grouped : _dateTasksCache;
    }

    // 2. Fetch remote month tasks
    try {
      final res = await client
          .from('study_tasks')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('start_time', ascending: true);

      final Map<String, List<StudyTask>> remoteGrouped = {};
      for (final raw in res as List) {
        final remoteMap = Map<String, dynamic>.from(raw as Map);
        final existingLocal = localRecords.firstWhere(
          (l) => l['id'] == remoteMap['id'],
          orElse: () => <String, dynamic>{},
        );

        final resolvedMap = ConflictResolver.resolve(
          entityType: 'study_task',
          localData: existingLocal,
          remoteData: remoteMap,
        );

        final task = StudyTask.fromMap(resolvedMap);
        remoteGrouped.putIfAbsent(task.date, () => []).add(task);
        _dateTasksCache.putIfAbsent(task.date, () => []).add(task);

        await _localStore.saveRecord(
          userId: userId,
          entityType: 'study_task',
          entityId: task.id,
          data: task.toMap(),
          isDirty: existingLocal['_dirty'] == true,
        );
      }

      return remoteGrouped.isNotEmpty ? remoteGrouped : grouped;
    } catch (e) {
      debugPrint('[SupabasePlanRepository] getTasksForMonth network error: $e');
      return grouped.isNotEmpty ? grouped : _dateTasksCache;
    }
  }

  @override
  Future<bool> toggleTaskCompletion(String taskId, bool currentCompleted) async {
    final newStatus = currentCompleted ? 'NOT_STARTED' : 'COMPLETED';
    return updateTaskStatus(taskId, newStatus);
  }

  @override
  Future<bool> updateTaskStatus(String taskId, String newStatus) async {
    final userId = _currentUserId ?? 'anonymous';
    final nowIso = DateTime.now().toUtc().toIso8601String();

    // 1. Update in-memory cache
    StudyTask? targetTask;
    for (final entry in _dateTasksCache.entries) {
      final idx = entry.value.indexWhere((t) => t.id == taskId);
      if (idx != -1) {
        final updated = entry.value[idx].copyWith(status: newStatus);
        entry.value[idx] = updated;
        targetTask = updated;
      }
    }

    // 2. Persist locally with dirty flag
    final existingLocal = await _localStore.getRecord(
      userId: userId,
      entityType: 'study_task',
      entityId: taskId,
    );

    final updatedMap = existingLocal != null
        ? Map<String, dynamic>.from(existingLocal)
        : (targetTask?.toMap() ?? {'id': taskId, 'status': newStatus});

    updatedMap['status'] = newStatus;
    updatedMap['updated_at'] = nowIso;

    await _localStore.saveRecord(
      userId: userId,
      entityType: 'study_task',
      entityId: taskId,
      data: updatedMap,
      isDirty: true,
    );

    // 3. Persistent Sync Queue operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'study_task',
      entityId: taskId,
      operationType: SyncOperationType.update,
      payload: {
        'id': taskId,
        'user_id': userId,
        'status': newStatus,
        'updated_at': nowIso,
      },
    );
    await _localStore.enqueue(op);

    // 4. Trigger SyncEngine in background if online (never await / never block user)
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return true;
  }

  @override
  Future<StudyTask?> createDirective(StudyTask task) async {
    final userId = _currentUserId ?? 'anonymous';
    final nowIso = DateTime.now().toUtc().toIso8601String();

    // Generate stable client ID if not present
    final stableId = task.id.isNotEmpty
        ? task.id
        : 'tsk_${DateTime.now().microsecondsSinceEpoch}';

    final created = StudyTask(
      id: stableId,
      userId: userId,
      date: task.date,
      taskId: task.taskId.isNotEmpty ? task.taskId : stableId,
      title: task.title,
      category: task.category,
      startTime: task.startTime,
      endTime: task.endTime,
      status: task.status,
      isStudy: task.isStudy,
      notes: task.notes,
      crossesMidnight: task.crossesMidnight,
      rescheduledTo: task.rescheduledTo,
      metadata: task.metadata,
      createdAt: task.createdAt,
      updatedAt: DateTime.now(),
    );
    final payload = created.toMap();
    payload['user_id'] = userId;
    payload['created_at'] = nowIso;
    payload['updated_at'] = nowIso;

    // 1. Update in-memory cache
    _dateTasksCache.putIfAbsent(created.date, () => []).add(created);

    // 2. Save locally with dirty flag
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'study_task',
      entityId: stableId,
      data: payload,
      isDirty: true,
    );

    // 3. Enqueue sync operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'study_task',
      entityId: stableId,
      operationType: SyncOperationType.create,
      payload: payload,
    );
    await _localStore.enqueue(op);

    // 4. Background sync
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return created;
  }

  @override
  Future<List<StudySession>> getSessionsForDate(String dateStr) async {
    final client = _client;
    final userId = _currentUserId ?? 'anonymous';

    // 1. Read from local store
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'study_session',
    );
    final localSessions = localRecords
        .where((r) => r['date'] == dateStr)
        .map((r) => StudySession.fromMap(r))
        .toList();

    if (client == null || _currentUserId == null) {
      return localSessions;
    }

    // 2. Fetch remote if online
    try {
      final res = await client
          .from('study_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateStr)
          .order('start_time', ascending: true);

      final remoteSessions = (res as List)
          .map((m) => StudySession.fromMap(m as Map<String, dynamic>))
          .toList();

      for (final session in remoteSessions) {
        await _localStore.saveRecord(
          userId: userId,
          entityType: 'study_session',
          entityId: session.id,
          data: session.toMap(),
          isDirty: false,
        );
      }

      // Preserve local un-synced sessions
      for (final ls in localSessions) {
        if (!remoteSessions.any((rs) => rs.id == ls.id)) {
          remoteSessions.add(ls);
        }
      }

      return remoteSessions;
    } catch (e) {
      debugPrint('[SupabasePlanRepository] getSessionsForDate network error: $e');
      return localSessions;
    }
  }
}
