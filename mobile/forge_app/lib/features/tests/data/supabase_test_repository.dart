import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/sync/engine/sync_engine.dart';
import '../../../../core/sync/models/sync_operation.dart';
import '../../../../core/sync/storage/local_store.dart';
import '../../dsa/data/dsa_repository.dart';
import '../../dsa/data/supabase_dsa_repository.dart';
import '../../development/data/dev_repository.dart';
import '../../development/data/supabase_dev_repository.dart';
import '../domain/models/test_attempt_result.dart';
import '../domain/models/test_session.dart';
import '../services/syllabus_boundary_service.dart';
import 'test_repository.dart';

/// Production-grade Supabase implementation of [TestRepository] with offline persistence and deduplicated sync.
/// Queries `dsa_progress` and `development_progress` for boundary enforcement,
/// and persists test attempts to `placement_hub_data.weekly_tests` with strict RLS and user isolation.
class SupabaseTestRepository implements TestRepository {
  final SupabaseClient? _clientOverride;
  final DsaRepository _dsaRepo;
  final DevRepository _devRepo;
  final LocalStore _localStore;
  String? _overrideUserId;
  String? _cachedUserId;

  final List<TestAttemptResult> _cachedHistory = [];
  bool _isHistoryCached = false;

  SupabaseTestRepository({
    SupabaseClient? client,
    DsaRepository? dsaRepository,
    DevRepository? devRepository,
    LocalStore? localStore,
  })  : _clientOverride = client,
        _dsaRepo = dsaRepository ?? SupabaseDsaRepository(client: client),
        _devRepo = devRepository ?? SupabaseDevRepository(client: client),
        _localStore = localStore ?? LocalStore.instance;

  SupabaseClient get _client {
    final override = _clientOverride;
    if (override != null) return override;
    final forgeClient = ForgeSupabase.instance.client;
    if (ForgeSupabase.instance.isInitialized && forgeClient != null) {
      return forgeClient;
    }
    return Supabase.instance.client;
  }

  @override
  void setUserId(String? userId) {
    _overrideUserId = userId;
    invalidateCache();
  }

  @override
  void invalidateCache() {
    _cachedHistory.clear();
    _isHistoryCached = false;
  }

  String get _currentUserId {
    final uid = _overrideUserId ?? _client.auth.currentUser?.id;
    if (uid == null || uid.isEmpty) {
      throw StateError('User not authenticated');
    }
    if (_cachedUserId != null && _cachedUserId != uid) {
      invalidateCache();
      _cachedUserId = uid;
    } else {
      _cachedUserId = uid;
    }
    return uid;
  }

  @override
  Future<SyllabusBoundary> getSyllabusBoundary() async {
    return SyllabusBoundaryService.detectBoundary(
      dsaRepository: _dsaRepo,
      devRepository: _devRepo,
    );
  }

  @override
  Future<TestSession> generateTest({
    required TestType type,
    int? questionCount,
    int durationMinutes = 30,
  }) async {
    final boundary = await getSyllabusBoundary();
    return SyllabusBoundaryService.generateSession(
      boundary: boundary,
      type: type,
      requestedQuestionCount: questionCount,
      durationMinutes: durationMinutes,
    );
  }

  @override
  Future<TestAttemptResult> saveTestAttempt(TestAttemptResult result) async {
    final userId = _currentUserId;

    // 1. Update in-memory cache
    _cachedHistory.removeWhere((r) => r.id == result.id || r.attemptId == result.attemptId);
    _cachedHistory.insert(0, result);
    _isHistoryCached = true;

    // 2. Persist locally in LocalStore
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'test_attempt',
      entityId: result.id,
      data: result.toJson(),
      isDirty: true,
    );

    // 3. Persistent Sync Queue operation (deduplicated by stable result.id)
    final op = SyncOperation.createPending(
      id: 'op_test_${result.id}',
      userId: userId,
      entityType: 'test_attempt',
      entityId: result.id,
      operationType: SyncOperationType.create,
      payload: {
        'user_id': userId,
        'weekly_tests': [result.toJson()],
        'weak_areas': result.weakTopics.map((t) => {
          'topic': t,
          'subject': result.testType.name.toUpperCase(),
          'count': 1,
        }).toList(),
      },
    );
    await _localStore.enqueue(op);

    // 4. Background sync if online
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return result;
  }

  @override
  Future<List<TestAttemptResult>> getTestHistory() async {
    final userId = _currentUserId;

    // 1. Check local store
    final localRecs = await _localStore.getRecords(
      userId: userId,
      entityType: 'test_attempt',
    );
    if (localRecs.isNotEmpty) {
      final list = localRecs.map((r) => TestAttemptResult.fromJson(r)).toList();
      _cachedHistory.clear();
      _cachedHistory.addAll(list);
      _isHistoryCached = true;
    }

    if (_isHistoryCached) {
      return List<TestAttemptResult>.from(_cachedHistory);
    }

    try {
      final hubRow = await _client
          .from('placement_hub_data')
          .select('weekly_tests')
          .eq('user_id', userId)
          .maybeSingle();

      if (hubRow == null || hubRow['weekly_tests'] == null) {
        return List<TestAttemptResult>.from(_cachedHistory);
      }

      final rawList = (hubRow['weekly_tests'] as List<dynamic>?) ?? [];
      final parsed = rawList
          .map((item) => TestAttemptResult.fromJson(item as Map<String, dynamic>))
          .toList();

      for (final p in parsed) {
        await _localStore.saveRecord(
          userId: userId,
          entityType: 'test_attempt',
          entityId: p.id,
          data: p.toJson(),
          isDirty: false,
        );
      }

      _cachedHistory.clear();
      _cachedHistory.addAll(parsed);
      _isHistoryCached = true;

      return List<TestAttemptResult>.from(_cachedHistory);
    } catch (_) {
      return List<TestAttemptResult>.from(_cachedHistory);
    }
  }

  @override
  Future<TestAttemptResult?> getTestAttemptById(String id) async {
    final history = await getTestHistory();
    try {
      return history.firstWhere((r) => r.id == id || r.attemptId == id);
    } catch (_) {
      return null;
    }
  }
}
