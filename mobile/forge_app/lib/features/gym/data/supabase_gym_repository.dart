import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/sync/engine/sync_engine.dart';
import '../../../core/sync/models/sync_operation.dart';
import '../../../core/sync/storage/local_store.dart';
import '../../../core/utils/uuid_generator.dart';
import '../domain/exercise.dart';
import '../domain/workout_plan.dart';
import '../domain/workout_template.dart';
import '../domain/workout_session.dart';
import '../domain/workout_exercise.dart';
import '../domain/workout_set.dart';
import '../domain/personal_record.dart';
import 'gym_repository.dart';
import 'canonical_workout_data.dart';
import 'gym_storage_service.dart';
import '../../auth/data/auth_service.dart';

class SupabaseGymRepository implements GymRepository {
  final SupabaseClient? _clientOverride;
  final String? _overrideUserId;
  final GymStorageService _storageService;
  final LocalStore _localStore;

  String? _cachedUserId;
  WorkoutPlan? _cachedPlan;
  final Map<String, WorkoutSession> _sessionCache = {};
  final List<PersonalRecord> _cachedPrs = [];

  SupabaseGymRepository({
    SupabaseClient? client,
    String? overrideUserId,
    String? currentUserId,
    GymStorageService? storageService,
    LocalStore? localStore,
  })  : _clientOverride = client,
        _overrideUserId = overrideUserId ?? currentUserId,
        _storageService = storageService ?? GymStorageService(client: client),
        _localStore = localStore ?? LocalStore.instance;

  SupabaseClient? get _client =>
      _clientOverride ?? (ForgeSupabase.instance.isInitialized ? ForgeSupabase.instance.client : null);

  String? get _currentUserId {
    return _overrideUserId ?? AuthService.current.currentUser?.id ?? _client?.auth.currentUser?.id;
  }

  /// Verifies user identity and invalidates in-memory caches if session changed
  void _verifyUserSession() {
    final uid = _currentUserId;
    if (_cachedUserId != null && _cachedUserId != uid) {
      _cachedPlan = null;
      _sessionCache.clear();
      _cachedPrs.clear();
      _storageService.clearCache();
    }
    _cachedUserId = uid;
  }

  @override
  Future<WorkoutPlan> getWorkoutPlan() async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';

    // 1. Read from local store
    final localRec = await _localStore.getRecord(
      userId: userId,
      entityType: 'workout_plan',
      entityId: 'plan',
    );
    if (localRec != null) {
      _cachedPlan = WorkoutPlan.fromJson(localRec);
    }

    if (_cachedPlan != null) {
      return _cachedPlan!;
    }

    final client = _client;
    if (userId == 'anonymous' || client == null) {
      return _cachedPlan ?? createDefaultWorkoutPlan(userId);
    }

    try {
      final response = await client
          .from('workout_plans')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _cachedPlan = WorkoutPlan.fromJson(response);
      } else {
        final defaultPlan = createDefaultWorkoutPlan(userId);
        await client.from('workout_plans').upsert(defaultPlan.toJson(), onConflict: 'user_id');
        _cachedPlan = defaultPlan;
      }

      await _localStore.saveRecord(
        userId: userId,
        entityType: 'workout_plan',
        entityId: 'plan',
        data: _cachedPlan!.toJson(),
        isDirty: false,
      );

      return _cachedPlan!;
    } catch (_) {
      final fallbackPlan = _cachedPlan ?? createDefaultWorkoutPlan(userId);
      _cachedPlan = fallbackPlan;
      return fallbackPlan;
    }
  }

  @override
  Future<WorkoutPlan> saveWorkoutPlan(WorkoutPlan plan) async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';
    final savedPlan = plan.copyWith(userId: userId, updatedAt: DateTime.now());

    _cachedPlan = savedPlan;

    await _localStore.saveRecord(
      userId: userId,
      entityType: 'workout_plan',
      entityId: 'plan',
      data: savedPlan.toJson(),
      isDirty: true,
    );

    final client = _client;
    if (client != null && userId != 'anonymous') {
      try {
        await client.from('workout_plans').upsert(savedPlan.toJson(), onConflict: 'user_id');
      } catch (_) {
        final op = SyncOperation.createPending(
          id: 'op_${DateTime.now().microsecondsSinceEpoch}',
          userId: userId,
          entityType: 'workout_plan',
          entityId: 'plan',
          operationType: SyncOperationType.update,
          payload: savedPlan.toJson(),
        );
        await _localStore.enqueue(op);
      }
    }

    return savedPlan;
  }

  @override
  Future<WorkoutTemplate?> getTemplateForDate(DateTime date) async {
    final plan = await getWorkoutPlan();
    final dayKey = getDayKeyForDate(date);
    final templ = plan.schedule[dayKey];

    // If template exists but has no exercises, fallback to canonical exercises
    if (templ != null) {
      if (templ.exercises.isEmpty && !templ.isRestDay) {
        final canonical = kCanonicalSchedule[dayKey];
        if (canonical != null && canonical.exercises.isNotEmpty) {
          return templ.copyWith(exercises: canonical.exercises);
        }
      }
      return templ;
    }
    return kCanonicalSchedule[dayKey];
  }

  @override
  Future<WorkoutSession?> getSessionForDate(String dateStr) async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';

    // 1. Check in-memory cache
    if (_sessionCache.containsKey(dateStr)) {
      return _sessionCache[dateStr];
    }

    // 2. Check local store records for matching date
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'workout_session',
    );
    for (final r in localRecords) {
      if (r['date'] == dateStr) {
        final sess = WorkoutSession.fromJson(r);
        _sessionCache[dateStr] = sess;
        _sessionCache[sess.id] = sess;
        return sess;
      }
    }

    final client = _client;
    if (userId == 'anonymous' || client == null) {
      return null;
    }

    try {
      final sessionRow = await client
          .from('workout_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('date', dateStr)
          .maybeSingle();

      if (sessionRow == null) return null;

      final session = await _loadSessionDetails(sessionRow);
      _sessionCache[dateStr] = session;
      _sessionCache[session.id] = session;

      await _localStore.saveRecord(
        userId: userId,
        entityType: 'workout_session',
        entityId: session.id,
        data: session.toJson(),
        isDirty: false,
      );

      return session;
    } catch (_) {
      return _sessionCache[dateStr];
    }
  }

  @override
  Future<List<WorkoutSession>> getWorkoutHistory({String? userId, int limit = 30}) async {
    _verifyUserSession();
    final effectiveUserId = userId ?? _currentUserId ?? 'anonymous';

    // 1. Read from local store and deduplicate by session.id
    final localRecords = await _localStore.getRecords(
      userId: effectiveUserId,
      entityType: 'workout_session',
    );

    final localMap = <String, WorkoutSession>{};
    final legacyDateKeysToRemove = <String>{};

    for (final r in localRecords) {
      final sess = WorkoutSession.fromJson(r);
      if (sess.id.isNotEmpty) {
        localMap[sess.id] = sess;
      }
      final entityId = r['_entityId']?.toString();
      if (entityId != null && entityId == sess.date && entityId != sess.id) {
        legacyDateKeysToRemove.add(entityId);
      }
    }

    // Clean up legacy date-keyed records in background
    for (final dateKey in legacyDateKeysToRemove) {
      await _localStore.deleteRecord(
        userId: effectiveUserId,
        entityType: 'workout_session',
        entityId: dateKey,
      );
    }

    final client = _client;
    if (effectiveUserId == 'anonymous' || client == null) {
      final cachedList = localMap.values.toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      return cachedList.take(limit).toList();
    }

    try {
      final rows = await client
          .from('workout_sessions')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('date', ascending: false)
          .limit(limit);

      final sessionMap = <String, WorkoutSession>{};
      for (final r in rows as List<dynamic>) {
        final sess = await _loadSessionDetails(r as Map<String, dynamic>);
        sessionMap[sess.id] = sess;
        _sessionCache[sess.id] = sess;
        _sessionCache[sess.date] = sess;

        await _localStore.saveRecord(
          userId: effectiveUserId,
          entityType: 'workout_session',
          entityId: sess.id,
          data: sess.toJson(),
          isDirty: false,
        );
      }
      final sessions = sessionMap.values.toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      return sessions;
    } catch (_) {
      final cachedList = localMap.values.toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      return cachedList.take(limit).toList();
    }
  }

  Future<WorkoutSession> _loadSessionDetails(Map<String, dynamic> sessionRow) async {
    final sessionId = sessionRow['id'] as String;
    final client = _client;

    if (client == null) {
      return WorkoutSession.fromJson(sessionRow);
    }

    final exRows = await client
        .from('workout_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', ascending: true);

    final exercises = <WorkoutExercise>[];
    for (final exRow in exRows as List<dynamic>) {
      final exMap = exRow as Map<String, dynamic>;
      final exId = exMap['id'] as String;

      final setRows = await client
          .from('workout_sets')
          .select('*')
          .eq('workout_exercise_id', exId)
          .order('set_number', ascending: true);

      final sets = (setRows as List<dynamic>)
          .map((s) => WorkoutSet.fromJson(s as Map<String, dynamic>))
          .toList();

      exercises.add(WorkoutExercise.fromJson({
        ...exMap,
        'sets': sets.map((s) => s.toJson()).toList(),
      }));
    }

    return WorkoutSession.fromJson({
      ...sessionRow,
      'exercises': exercises.map((e) => e.toJson()).toList(),
    });
  }

  @override
  Future<void> deleteWorkoutSession(String sessionId) async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';

    // 1. Remove from in-memory cache
    String? foundDate;
    _sessionCache.removeWhere((key, value) {
      if (value.id == sessionId) {
        foundDate = value.date;
        return true;
      }
      return false;
    });

    // 2. Remove from LocalStore (by UUID and by date if exists)
    await _localStore.deleteRecord(
      userId: userId,
      entityType: 'workout_session',
      entityId: sessionId,
    );
    if (foundDate != null) {
      await _localStore.deleteRecord(
        userId: userId,
        entityType: 'workout_session',
        entityId: foundDate!,
      );
    }

    // 3. Remote deletion if online
    final client = _client;
    if (client != null && userId != 'anonymous') {
      try {
        final exRows = await client
            .from('workout_exercises')
            .select('id')
            .eq('session_id', sessionId);
        for (final ex in exRows as List<dynamic>) {
          final exId = ex['id'] as String;
          await client.from('workout_sets').delete().eq('workout_exercise_id', exId);
        }
        await client.from('workout_exercises').delete().eq('session_id', sessionId);
        await client.from('workout_sessions').delete().eq('id', sessionId).eq('user_id', userId);
      } catch (e) {
        debugPrint('[SupabaseGymRepository] Remote delete failed, queuing sync: $e');
        final op = SyncOperation.createPending(
          id: 'op_${DateTime.now().microsecondsSinceEpoch}',
          userId: userId,
          entityType: 'workout_session',
          entityId: sessionId,
          operationType: SyncOperationType.delete,
          payload: {'id': sessionId},
        );
        await _localStore.enqueue(op);
      }
    }
  }

  @override
  Future<List<PersonalRecord>> getPersonalRecords({String? userId}) async {
    _verifyUserSession();
    final effectiveUserId = userId ?? _currentUserId ?? 'anonymous';

    // 1. Read from local store
    final localRecs = await _localStore.getRecords(
      userId: effectiveUserId,
      entityType: 'personal_record',
    );
    if (localRecs.isNotEmpty) {
      _cachedPrs.clear();
      _cachedPrs.addAll(localRecs.map((r) => PersonalRecord.fromJson(r)));
    }

    final client = _client;
    if (effectiveUserId == 'anonymous' || client == null) {
      return List<PersonalRecord>.from(_cachedPrs);
    }

    try {
      final rows = await client
          .from('personal_records')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('achieved_at', ascending: false);

      _cachedPrs.clear();
      for (final r in rows as List<dynamic>) {
        final pr = PersonalRecord.fromJson(r as Map<String, dynamic>);
        _cachedPrs.add(pr);
        await _localStore.saveRecord(
          userId: effectiveUserId,
          entityType: 'personal_record',
          entityId: pr.id ?? pr.exerciseId,
          data: pr.toJson(),
          isDirty: false,
        );
      }
      return List<PersonalRecord>.from(_cachedPrs);
    } catch (_) {
      return List<PersonalRecord>.from(_cachedPrs);
    }
  }

  @override
  Future<List<WorkoutSet>?> getPreviousPerformance(String exerciseId) async {
    _verifyUserSession();
    final userId = _currentUserId;
    final client = _client;
    if (userId == null || client == null) {
      for (final s in _sessionCache.values) {
        for (final ex in s.exercises) {
          if (ex.exerciseId == exerciseId && ex.sets.isNotEmpty) {
            return ex.sets;
          }
        }
      }
      return null;
    }

    try {
      final exRows = await client
          .from('workout_exercises')
          .select('id, session_id, workout_sessions!inner(user_id, date)')
          .eq('exercise_id', exerciseId)
          .eq('workout_sessions.user_id', userId)
          .order('workout_sessions(date)', ascending: false)
          .limit(1);

      if ((exRows as List<dynamic>).isEmpty) return null;

      final lastExId = exRows.first['id'] as String;
      final setRows = await client
          .from('workout_sets')
          .select('*')
          .eq('workout_exercise_id', lastExId)
          .order('set_number', ascending: true);

      final sets = (setRows as List<dynamic>)
          .map((s) => WorkoutSet.fromJson(s as Map<String, dynamic>))
          .toList();

      return sets.isNotEmpty ? sets : null;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<WorkoutSession> saveWorkoutSession(WorkoutSession session) async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';
    final stableId = session.id.isNotEmpty
        ? session.id
        : UuidGenerator.v4();

    final savedSession = session.copyWith(id: stableId, userId: userId);

    // 1. Update in-memory cache
    _sessionCache[savedSession.id] = savedSession;
    _sessionCache[savedSession.date] = savedSession;

    // 2. Persist locally in LocalStore with stable ID key
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'workout_session',
      entityId: savedSession.id,
      data: savedSession.toJson(),
      isDirty: true,
    );

    // Also persist by date if date differs from ID so getSessionForDate and legacy tests resolve immediately
    if (savedSession.date != savedSession.id) {
      await _localStore.saveRecord(
        userId: userId,
        entityType: 'workout_session',
        entityId: savedSession.date,
        data: savedSession.toJson(),
        isDirty: false,
      );
    }

    // 3. Enqueue SyncOperation for the session
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'workout_session',
      entityId: stableId,
      operationType: SyncOperationType.create,
      payload: {
        'id': stableId,
        'user_id': userId,
        'date': savedSession.date,
        'day_of_week': savedSession.dayOfWeek,
        'day_key': savedSession.dayKey.toLowerCase(),
        'workout_type': savedSession.workoutType,
        'duration_minutes': savedSession.durationMinutes,
        'status': savedSession.status,
        'gym_photo_path': savedSession.gymPhotoPath,
        'total_volume_kg': savedSession.totalVolumeKg,
        'total_sets': savedSession.totalSets,
        'total_reps': savedSession.totalReps,
        'notes': savedSession.notes ?? '',
        'started_at': savedSession.startedAt?.toIso8601String(),
        'ended_at': savedSession.endedAt?.toIso8601String() ?? DateTime.now().toUtc().toIso8601String(),
        'created_at': savedSession.createdAt.toIso8601String(),
      },
    );
    await _localStore.enqueue(op);

    // 4. Background sync if online
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return savedSession;
  }

  @override
  Future<PersonalRecord?> savePersonalRecord(PersonalRecord pr) async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';
    final stableId = (pr.id != null && pr.id!.isNotEmpty && !pr.id!.startsWith('pr_'))
        ? pr.id!
        : UuidGenerator.v4();
    final savedPr = PersonalRecord(
      id: stableId,
      userId: userId,
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      maxWeightKg: pr.maxWeightKg,
      maxReps: pr.maxReps,
      achievedAt: pr.achievedAt,
      sessionId: pr.sessionId,
    );

    _cachedPrs.removeWhere((p) => p.exerciseId == savedPr.exerciseId);
    _cachedPrs.add(savedPr);

    await _localStore.saveRecord(
      userId: userId,
      entityType: 'personal_record',
      entityId: stableId,
      data: savedPr.toJson(),
      isDirty: true,
    );

    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'personal_record',
      entityId: stableId,
      operationType: SyncOperationType.create,
      payload: {
        'id': stableId,
        'user_id': userId,
        'exercise_id': savedPr.exerciseId,
        'exercise_name': savedPr.exerciseName,
        'max_weight_kg': savedPr.maxWeightKg,
        'max_reps': savedPr.maxReps,
        'achieved_at': savedPr.achievedAt.toIso8601String(),
        'session_id': savedPr.sessionId,
      },
    );
    await _localStore.enqueue(op);

    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return savedPr;
  }

  @override
  Future<String> uploadCheckInPhoto(Uint8List imageBytes, String sessionId, [DateTime? date]) async {
    _verifyUserSession();
    final userId = _currentUserId ?? 'anonymous';
    final canonicalPath = GymStorageService.buildCanonicalPath(userId, sessionId, date);

    final client = _client;
    if (client == null || userId == 'anonymous') {
      final op = SyncOperation.createPending(
        id: 'op_photo_${sessionId}_${DateTime.now().microsecondsSinceEpoch}',
        userId: userId,
        entityType: 'gym_photo',
        entityId: canonicalPath,
        operationType: SyncOperationType.create,
        payload: {
          'storagePath': canonicalPath,
          'bytesBase64': base64Encode(imageBytes),
        },
      );
      await _localStore.enqueue(op);
      return canonicalPath;
    }

    try {
      return await _storageService.uploadGymPhoto(
        imageBytes: imageBytes,
        sessionId: sessionId,
        userId: userId,
        date: date,
      );
    } catch (_) {
      final op = SyncOperation.createPending(
        id: 'op_photo_${sessionId}_${DateTime.now().microsecondsSinceEpoch}',
        userId: userId,
        entityType: 'gym_photo',
        entityId: canonicalPath,
        operationType: SyncOperationType.create,
        payload: {
          'storagePath': canonicalPath,
          'bytesBase64': base64Encode(imageBytes),
        },
      );
      await _localStore.enqueue(op);
      return canonicalPath;
    }
  }

  @override
  Future<String?> getSignedPhotoUrl(String photoPath) {
    _verifyUserSession();
    final userId = _currentUserId;
    if (userId == null) return Future.value(null);
    return _storageService.getSignedGymPhotoUrl(
      rawPath: photoPath,
      currentUserId: userId,
    );
  }

  @override
  Future<WorkoutTemplate?> getWorkoutPlanForDate({required String userId, required DateTime date}) {
    return getTemplateForDate(date);
  }

  @override
  Future<WorkoutSession?> getTodaySession({required String userId, required DateTime date}) {
    final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    return getSessionForDate(dateStr);
  }

  @override
  Future<WorkoutSession> createWorkoutSession({
    required String userId,
    required WorkoutTemplate template,
    required String gymPhotoPath,
  }) async {
    final now = DateTime.now();
    final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final sid = UuidGenerator.v4();

    final sessionExercises = template.exercises.asMap().entries.map((entry) {
      final idx = entry.key;
      final ex = entry.value;
      final weId = UuidGenerator.v4();
      final sets = List.generate(
        ex.defaultSets,
        (sIdx) => WorkoutSet(
          id: UuidGenerator.v4(),
          workoutExerciseId: weId,
          setNumber: sIdx + 1,
          weightKg: 60.0,
          reps: 10,
          completed: false,
        ),
      );

      return WorkoutExercise(
        id: weId,
        sessionId: sid,
        exerciseId: ex.id,
        exerciseNameSnapshot: ex.name,
        muscleGroup: ex.muscleGroup,
        orderIndex: idx,
        sets: sets,
      );
    }).toList();

    final session = WorkoutSession(
      id: sid,
      userId: userId,
      date: dateStr,
      dayOfWeek: template.dayName,
      dayKey: template.dayKey,
      workoutType: template.routineName,
      durationMinutes: 0,
      status: 'in_progress',
      gymPhotoPath: gymPhotoPath,
      totalVolumeKg: 0.0,
      totalSets: sessionExercises.fold(0, (acc, e) => acc + e.sets.length),
      totalReps: 0,
      createdAt: now,
      startedAt: now,
      exercises: sessionExercises,
    );

    return saveWorkoutSession(session);
  }

  @override
  Future<WorkoutSession> updateWorkoutSession(WorkoutSession session) {
    return saveWorkoutSession(session);
  }

  @override
  Future<void> saveWorkoutSet({required String userId, required WorkoutSet set}) async {
    _verifyUserSession();
    final rawId = set.id;
    final stableId = (rawId != null && rawId.isNotEmpty)
        ? rawId
        : UuidGenerator.v4();
    final updatedSet = set.copyWith(id: stableId);

    await _localStore.saveRecord(
      userId: userId,
      entityType: 'workout_set',
      entityId: stableId,
      data: updatedSet.toJson(),
      isDirty: true,
    );

    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'workout_set',
      entityId: stableId,
      operationType: SyncOperationType.create,
      payload: {
        'id': stableId,
        'workout_exercise_id': updatedSet.workoutExerciseId,
        'set_number': updatedSet.setNumber,
        'weight_kg': updatedSet.weightKg,
        'reps': updatedSet.reps,
        if (updatedSet.rpe != null) 'rpe': updatedSet.rpe,
        'completed': updatedSet.completed,
        'completed_at': updatedSet.completedAt.toIso8601String(),
      },
    );
    await _localStore.enqueue(op);

    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();
  }

  @override
  Future<List<Exercise>> getAllExercises() async {
    final userId = _currentUserId ?? 'anonymous';
    final customRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'custom_exercise',
    );
    final customExercises = customRecords.map((r) => Exercise.fromJson(r)).toList();
    return [...kCanonicalExercises, ...customExercises];
  }

  @override
  Future<Exercise> addCustomExercise(Exercise exercise) async {
    final userId = _currentUserId ?? 'anonymous';
    final stableId = exercise.id.isNotEmpty && !exercise.id.startsWith('ex_')
        ? exercise.id
        : UuidGenerator.v4();
    final savedExercise = Exercise(
      id: stableId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      category: exercise.category,
      equipment: exercise.equipment,
      defaultSets: exercise.defaultSets,
      defaultReps: exercise.defaultReps,
      defaultRestSeconds: exercise.defaultRestSeconds,
    );

    await _localStore.saveRecord(
      userId: userId,
      entityType: 'custom_exercise',
      entityId: stableId,
      data: savedExercise.toJson(),
      isDirty: true,
    );

    return savedExercise;
  }

  @override
  Future<void> refresh() async {
    _cachedPlan = null;
    _sessionCache.clear();
    _cachedPrs.clear();
    await getWorkoutPlan();
    await getWorkoutHistory(limit: 30);
    await getPersonalRecords();
  }
}
