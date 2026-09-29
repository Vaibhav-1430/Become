import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../supabase/supabase_client.dart';
import '../conflict/conflict_resolver.dart';
import '../storage/local_store.dart';
import '../../services/streak_service.dart';

/// Status of the Initial Cloud Hydration pipeline.
enum HydrationStatus {
  unhydrated,
  hydrating,
  hydrated,
  partialFailure,
  error,
}

/// Centralized service responsible for hydrating the local database with all
/// existing cloud records for an authenticated user upon sign-in or session restore.
///
/// Prevents the "empty account on mobile" failure by ensuring that an existing
/// cloud account's historical tasks, DSA, Dev, Gym, Mistake, and Career data
/// are downloaded and populated into [LocalStore] before declaring readiness.
class CloudHydrationService extends ChangeNotifier {
  static CloudHydrationService? _instance;

  static CloudHydrationService get instance {
    _instance ??= CloudHydrationService();
    return _instance!;
  }

  static set instance(CloudHydrationService service) {
    _instance = service;
  }

  final LocalStore _localStore;
  final SupabaseClient? _clientOverride;

  HydrationStatus _status = HydrationStatus.unhydrated;
  String? _hydratedUserId;
  DateTime? _lastHydratedAt;
  String? _errorMessage;
  final List<String> _failedDomains = [];

  CloudHydrationService({
    LocalStore? localStore,
    SupabaseClient? client,
  })  : _localStore = localStore ?? LocalStore.instance,
        _clientOverride = client;

  SupabaseClient? get _client => _clientOverride ?? ForgeSupabase.instance.client;

  HydrationStatus get status => _status;
  bool get isHydrated => _status == HydrationStatus.hydrated;
  bool get isHydrating => _status == HydrationStatus.hydrating;
  bool get isPartialFailure => _status == HydrationStatus.partialFailure;
  String? get hydratedUserId => _hydratedUserId;
  DateTime? get lastHydratedAt => _lastHydratedAt;
  String? get errorMessage => _errorMessage;
  List<String> get failedDomains => List.unmodifiable(_failedDomains);

  /// Performs full initial cloud hydration for [userId] with domain-level isolation.
  ///
  /// Prevents a single failing domain from crashing the entire hydration pipeline.
  /// If one domain encounters an error (e.g. RLS or schema constraint), other domains
  /// are successfully saved to [LocalStore], and the pipeline transitions to
  /// [HydrationStatus.partialFailure] instead of silent complete failure.
  Future<bool> hydrate(String userId, {bool force = false}) async {
    if (userId.isEmpty) return false;

    if (!force && _status == HydrationStatus.hydrated && _hydratedUserId == userId) {
      return true;
    }

    if (_status == HydrationStatus.hydrating) {
      return false;
    }

    _status = HydrationStatus.hydrating;
    _errorMessage = null;
    _failedDomains.clear();
    notifyListeners();

    final client = _client;
    if (client == null) {
      _status = HydrationStatus.error;
      _errorMessage = 'Supabase client not initialized';
      notifyListeners();
      return false;
    }

    try {
      if (kDebugMode) {
        debugPrint('[CloudHydrationService] Beginning initial cloud hydration for user: $userId');
      }

      int successCount = 0;
      int failureCount = 0;
      List<dynamic> sessionRows = [];

      Future<void> safeHydrateTable({
        required String domain,
        required String entityType,
        required Future<dynamic> Function() fetchFn,
        required String Function(Map<String, dynamic>) idSelector,
        void Function(List<dynamic>)? onRowsCaptured,
      }) async {
        try {
          final res = await fetchFn();
          final rows = res as List<dynamic>;
          if (onRowsCaptured != null) {
            onRowsCaptured(rows);
          }
          await _hydrateTable(userId, entityType, rows, idSelector: idSelector);
          successCount++;
        } catch (e) {
          failureCount++;
          _failedDomains.add(domain);
          debugPrint('[CloudHydrationService] Failed to hydrate domain $domain ($entityType): $e');
        }
      }

      // Parallel domain dispatch with individual failure boundaries
      await Future.wait([
        safeHydrateTable(
          domain: 'Tasks',
          entityType: 'study_task',
          fetchFn: () => client.from('study_tasks').select('*').eq('user_id', userId),
          idSelector: (m) => m['id']?.toString() ?? m['task_id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'Sessions',
          entityType: 'study_session',
          fetchFn: () => client.from('study_sessions').select('*').eq('user_id', userId),
          idSelector: (m) => m['id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'DSA',
          entityType: 'dsa_progress',
          fetchFn: () => client.from('dsa_progress').select('*').eq('user_id', userId),
          idSelector: (m) => m['problem_id']?.toString() ?? m['id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'Development',
          entityType: 'development_progress',
          fetchFn: () => client.from('development_progress').select('*').eq('user_id', userId),
          idSelector: (m) => m['item_id']?.toString() ?? m['id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'Mistakes',
          entityType: 'mistake',
          fetchFn: () => client.from('mistakes').select('*').eq('user_id', userId),
          idSelector: (m) => m['id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'Gym Plan',
          entityType: 'workout_plan',
          fetchFn: () => client.from('workout_plans').select('*').eq('user_id', userId),
          idSelector: (_) => 'plan',
        ),
        safeHydrateTable(
          domain: 'Gym Sessions',
          entityType: 'workout_session',
          fetchFn: () => client.from('workout_sessions').select('*').eq('user_id', userId),
          idSelector: (m) => m['id']?.toString() ?? '',
          onRowsCaptured: (rows) => sessionRows = rows,
        ),
        safeHydrateTable(
          domain: 'Gym PRs',
          entityType: 'personal_record',
          fetchFn: () => client.from('personal_records').select('*').eq('user_id', userId),
          idSelector: (m) => m['exercise_id']?.toString() ?? m['id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'Internships',
          entityType: 'internship',
          fetchFn: () => client.from('internships').select('*').eq('user_id', userId),
          idSelector: (m) => m['id']?.toString() ?? '',
        ),
        safeHydrateTable(
          domain: 'Career Hub',
          entityType: 'placement_hub_data',
          fetchFn: () => client.from('placement_hub_data').select('*').eq('user_id', userId),
          idSelector: (_) => 'hub',
        ),
        safeHydrateTable(
          domain: 'Profile',
          entityType: 'profile',
          fetchFn: () => client.from('profiles').select('*').eq('id', userId),
          idSelector: (m) => m['id']?.toString() ?? userId,
        ),
      ]);

      // Relational hydration for workout exercises and sets
      if (sessionRows.isNotEmpty) {
        final sessionIds = sessionRows.map((s) => s['id']?.toString()).whereType<String>().toList();
        if (sessionIds.isNotEmpty) {
          try {
            final exercisesRes = await client.from('workout_exercises').select('*').inFilter('session_id', sessionIds);
            final exercises = exercisesRes as List<dynamic>;
            final exerciseIds = exercises.map((e) => e['id']?.toString()).whereType<String>().toList();

            List<dynamic> sets = [];
            if (exerciseIds.isNotEmpty) {
              final setsRes = await client.from('workout_sets').select('*').inFilter('workout_exercise_id', exerciseIds);
              sets = setsRes as List<dynamic>;
            }

            final exerciseMap = <String, List<Map<String, dynamic>>>{};
            for (final ex in exercises) {
              final exMap = Map<String, dynamic>.from(ex as Map);
              final sessId = exMap['session_id'] as String?;
              if (sessId != null) {
                exerciseMap.putIfAbsent(sessId, () => []).add(exMap);
              }
            }

            final setsMap = <String, List<Map<String, dynamic>>>{};
            for (final st in sets) {
              final stMap = Map<String, dynamic>.from(st as Map);
              final exId = stMap['workout_exercise_id'] as String?;
              if (exId != null) {
                setsMap.putIfAbsent(exId, () => []).add(stMap);
              }
            }

            for (final s in sessionRows) {
              final sMap = Map<String, dynamic>.from(s as Map);
              final sessId = sMap['id'] as String?;
              if (sessId == null || sessId.isEmpty) continue;

              final sessEx = exerciseMap[sessId] ?? [];
              final fullExercises = sessEx.map((ex) {
                final exId = ex['id'] as String;
                final exSets = setsMap[exId] ?? [];
                return {
                  ...ex,
                  'sets': exSets,
                };
              }).toList();

              sMap['exercises'] = fullExercises;
              await _localStore.saveRecord(
                userId: userId,
                entityType: 'workout_session',
                entityId: sessId,
                data: sMap,
                isDirty: false,
              );
            }
          } catch (e) {
            debugPrint('[CloudHydrationService] Relational workout hydration warning: $e');
          }
        }
      }

      // Recompute canonical streak across application
      await StreakService.instance.recomputeStreak(userId: userId);

      _hydratedUserId = userId;
      _lastHydratedAt = DateTime.now().toUtc();

      if (failureCount == 0) {
        _status = HydrationStatus.hydrated;
        if (kDebugMode) {
          debugPrint('[CloudHydrationService] Initial cloud hydration COMPLETE for user: $userId');
        }
      } else if (successCount > 0) {
        _status = HydrationStatus.partialFailure;
        _errorMessage = 'Partial hydration failure: ${_failedDomains.join(", ")}';
        debugPrint('[CloudHydrationService] Hydration PARTIAL failure: $_errorMessage');
      } else {
        _status = HydrationStatus.error;
        _errorMessage = 'All domains failed during cloud hydration';
        debugPrint('[CloudHydrationService] Hydration TOTAL failure: $_errorMessage');
      }

      notifyListeners();
      return _status == HydrationStatus.hydrated;
    } catch (e) {
      debugPrint('[CloudHydrationService] Global hydration failure: $e');
      _status = HydrationStatus.error;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Internal helper to hydrate rows of a table into LocalStore.
  Future<void> _hydrateTable(
    String userId,
    String entityType,
    List<dynamic> rows, {
    required String Function(Map<String, dynamic>) idSelector,
  }) async {
    for (final raw in rows) {
      final map = Map<String, dynamic>.from(raw as Map);
      final entityId = idSelector(map);
      if (entityId.isEmpty) continue;

      final existingLocal = await _localStore.getRecord(
        userId: userId,
        entityType: entityType,
        entityId: entityId,
      );

      final resolved = (existingLocal != null && existingLocal['_dirty'] == true)
          ? ConflictResolver.resolve(
              entityType: entityType,
              localData: existingLocal,
              remoteData: map,
            )
          : map;

      await _localStore.saveRecord(
        userId: userId,
        entityType: entityType,
        entityId: entityId,
        data: resolved,
        isDirty: existingLocal != null && existingLocal['_dirty'] == true,
      );
    }
  }

  /// Resets hydration state on account switch or logout.
  void reset() {
    _status = HydrationStatus.unhydrated;
    _hydratedUserId = null;
    _lastHydratedAt = null;
    _errorMessage = null;
    _failedDomains.clear();
    notifyListeners();
  }
}
