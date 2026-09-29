import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../conflict/conflict_resolver.dart';
import '../models/sync_operation.dart';
import '../../supabase/supabase_client.dart';

/// Contract for executing remote write operations against Supabase or test mocks.
abstract class RemoteSyncHandler {
  Future<void> executeOperation(SyncOperation op);
}

/// Production implementation executing remote operations against Supabase backend.
/// Strictly enforces PostgreSQL schema constraints, UUID validation, and relational cascades.
class SupabaseRemoteSyncHandler implements RemoteSyncHandler {
  final SupabaseClient? _clientOverride;

  static final RegExp _uuidRegex = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  static bool _isValidUuid(String? str) {
    if (str == null || str.isEmpty) return false;
    return _uuidRegex.hasMatch(str);
  }

  SupabaseRemoteSyncHandler({SupabaseClient? client})
      : _clientOverride = client;

  SupabaseClient? get _client {
    if (_clientOverride != null) return _clientOverride;
    try {
      if (ForgeSupabase.instance.isInitialized) {
        return ForgeSupabase.instance.client;
      }
    } catch (_) {}
    return null;
  }

  @override
  Future<void> executeOperation(SyncOperation op) async {
    final client = _client;
    if (client == null) {
      throw Exception('Supabase client is not available');
    }

    switch (op.entityType) {
      case 'study_task':
        await _handleStudyTask(client, op);
        break;
      case 'study_session':
        await _handleStudySession(client, op);
        break;
      case 'dsa_progress':
        await _handleDsaProgress(client, op);
        break;
      case 'development_progress':
        await _handleDevProgress(client, op);
        break;
      case 'mistake':
        await _handleMistake(client, op);
        break;
      case 'workout_plan':
        await _handleWorkoutPlan(client, op);
        break;
      case 'workout_session':
        await _handleWorkoutSession(client, op);
        break;
      case 'workout_set':
        await _handleWorkoutSet(client, op);
        break;
      case 'personal_record':
        await _handlePersonalRecord(client, op);
        break;
      case 'internship':
        await _handleInternship(client, op);
        break;
      case 'placement_hub_data':
      case 'test_attempt':
        await _handlePlacementHubData(client, op);
        break;
      case 'gym_photo':
        await _handleGymPhoto(client, op);
        break;
      default:
        debugPrint('[SupabaseRemoteSyncHandler] Unknown entityType: ${op.entityType}');
    }
  }

  Future<void> _handleStudyTask(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      if (_isValidUuid(op.entityId)) {
        await client
            .from('study_tasks')
            .delete()
            .eq('id', op.entityId)
            .eq('user_id', op.userId);
      } else {
        await client
            .from('study_tasks')
            .delete()
            .eq('task_id', op.entityId)
            .eq('user_id', op.userId);
      }
    } else {
      final payload = Map<String, dynamic>.from(op.payload);
      payload['user_id'] = op.userId;
      payload.remove('_dirty');
      payload.remove('_localUpdatedAt');

      // Ensure id is a valid UUID or remove it so PostgreSQL generates it
      final idVal = payload['id']?.toString();
      if (!_isValidUuid(idVal)) {
        payload.remove('id');
      }

      // If updating an existing task by user_id and task_id
      if (op.operationType == SyncOperationType.update && payload.containsKey('task_id')) {
        await client
            .from('study_tasks')
            .update(payload)
            .eq('user_id', op.userId)
            .eq('task_id', payload['task_id']);
      } else {
        // Upsert by composite natural key (user_id, date, task_id)
        await client
            .from('study_tasks')
            .upsert(payload, onConflict: 'user_id,date,task_id');
      }
    }
  }

  Future<void> _handleStudySession(SupabaseClient client, SyncOperation op) async {
    final payload = Map<String, dynamic>.from(op.payload);
    payload['user_id'] = op.userId;
    payload.remove('_dirty');
    payload.remove('_localUpdatedAt');
    final idVal = payload['id']?.toString();
    if (!_isValidUuid(idVal)) {
      payload.remove('id');
    }
    await client.from('study_sessions').upsert(payload, onConflict: 'id');
  }

  Future<void> _handleDsaProgress(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client
          .from('dsa_progress')
          .delete()
          .eq('user_id', op.userId)
          .eq('problem_id', op.entityId);
      return;
    }
    final payload = Map<String, dynamic>.from(op.payload);
    payload['user_id'] = op.userId;
    payload.remove('_dirty');
    payload.remove('_localUpdatedAt');
    final idVal = payload['id']?.toString();
    if (!_isValidUuid(idVal)) {
      payload.remove('id');
    }
    await client.from('dsa_progress').upsert(payload, onConflict: 'user_id,problem_id');
  }

  Future<void> _handleDevProgress(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client
          .from('development_progress')
          .delete()
          .eq('user_id', op.userId)
          .eq('item_id', op.entityId);
      return;
    }
    final payload = Map<String, dynamic>.from(op.payload);
    payload['user_id'] = op.userId;
    payload.remove('_dirty');
    payload.remove('_localUpdatedAt');
    final idVal = payload['id']?.toString();
    if (!_isValidUuid(idVal)) {
      payload.remove('id');
    }
    await client.from('development_progress').upsert(payload, onConflict: 'user_id,category,item_id');
  }

  Future<void> _handleMistake(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client
          .from('mistakes')
          .delete()
          .eq('id', op.entityId)
          .eq('user_id', op.userId);
    } else {
      final payload = Map<String, dynamic>.from(op.payload);
      payload['user_id'] = op.userId;
      payload.remove('_dirty');
      payload.remove('_localUpdatedAt');
      final idVal = payload['id']?.toString();
      if (!_isValidUuid(idVal)) {
        payload.remove('id');
      }
      await client.from('mistakes').upsert(payload, onConflict: 'id');
    }
  }

  Future<void> _handleWorkoutPlan(SupabaseClient client, SyncOperation op) async {
    final payload = Map<String, dynamic>.from(op.payload);
    payload['user_id'] = op.userId;
    payload.remove('_dirty');
    payload.remove('_localUpdatedAt');
    final idVal = payload['id']?.toString();
    if (!_isValidUuid(idVal)) {
      payload.remove('id');
    }
    await client.from('workout_plans').upsert(payload, onConflict: 'user_id');
  }

  Future<void> _handleWorkoutSession(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client
          .from('workout_sessions')
          .delete()
          .eq('id', op.entityId)
          .eq('user_id', op.userId);
      return;
    }

    final payload = Map<String, dynamic>.from(op.payload);
    payload['user_id'] = op.userId;
    payload.remove('_dirty');
    payload.remove('_localUpdatedAt');

    // Remove exercises array before upserting into public.workout_sessions table
    final rawExercises = payload.remove('exercises') as List<dynamic>?;

    final sessId = payload['id']?.toString();
    if (!_isValidUuid(sessId)) {
      payload.remove('id');
    }

    final sessionRes = await client
        .from('workout_sessions')
        .upsert(payload, onConflict: 'id')
        .select('id')
        .maybeSingle();

    final effectiveSessionId = sessionRes != null
        ? sessionRes['id']?.toString()
        : sessId;

    // Relational cascade into workout_exercises and workout_sets
    if (rawExercises != null && effectiveSessionId != null && effectiveSessionId.isNotEmpty) {
      for (final rawEx in rawExercises) {
        final exMap = Map<String, dynamic>.from(rawEx as Map);
        final rawSets = exMap.remove('sets') as List<dynamic>?;
        exMap['session_id'] = effectiveSessionId;

        final exId = exMap['id']?.toString();
        if (!_isValidUuid(exId)) {
          exMap.remove('id');
        }

        final exRes = await client
            .from('workout_exercises')
            .upsert(exMap, onConflict: 'id')
            .select('id')
            .maybeSingle();

        final effectiveExId = exRes != null ? exRes['id']?.toString() : exId;

        if (rawSets != null && effectiveExId != null && effectiveExId.isNotEmpty) {
          for (final rawSet in rawSets) {
            final setMap = Map<String, dynamic>.from(rawSet as Map);
            setMap['workout_exercise_id'] = effectiveExId;
            final setId = setMap['id']?.toString();
            if (!_isValidUuid(setId)) {
              setMap.remove('id');
            }
            await client.from('workout_sets').upsert(setMap, onConflict: 'id');
          }
        }
      }
    }
  }

  Future<void> _handleWorkoutSet(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client.from('workout_sets').delete().eq('id', op.entityId);
    } else {
      final payload = Map<String, dynamic>.from(op.payload);
      payload.remove('_dirty');
      payload.remove('_localUpdatedAt');
      final idVal = payload['id']?.toString();
      if (!_isValidUuid(idVal)) {
        payload.remove('id');
      }
      await client.from('workout_sets').upsert(payload, onConflict: 'id');
    }
  }

  Future<void> _handlePersonalRecord(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client
          .from('personal_records')
          .delete()
          .eq('user_id', op.userId)
          .eq('exercise_id', op.entityId);
      return;
    }

    final payload = Map<String, dynamic>.from(op.payload);
    payload['user_id'] = op.userId;
    payload.remove('_dirty');
    payload.remove('_localUpdatedAt');

    // Clean session_id: if empty or not UUID, omit to prevent 22P02 invalid UUID syntax
    final sessId = payload['session_id']?.toString();
    if (!_isValidUuid(sessId)) {
      payload.remove('session_id');
    }

    final prId = payload['id']?.toString();
    if (!_isValidUuid(prId)) {
      payload.remove('id');
    }

    // Unique constraint on PostgreSQL is (user_id, exercise_id)
    await client
        .from('personal_records')
        .upsert(payload, onConflict: 'user_id,exercise_id');
  }

  Future<void> _handleInternship(SupabaseClient client, SyncOperation op) async {
    if (op.operationType == SyncOperationType.delete) {
      await client
          .from('internships')
          .delete()
          .eq('id', op.entityId)
          .eq('user_id', op.userId);
    } else {
      final payload = Map<String, dynamic>.from(op.payload);
      payload['user_id'] = op.userId;
      payload.remove('_dirty');
      payload.remove('_localUpdatedAt');
      final idVal = payload['id']?.toString();
      if (!_isValidUuid(idVal)) {
        payload.remove('id');
      }
      await client.from('internships').upsert(payload, onConflict: 'id');
    }
  }

  Future<void> _handlePlacementHubData(SupabaseClient client, SyncOperation op) async {
    // 1. Fetch remote placement row to preserve existing fields without clobbering
    Map<String, dynamic> remote = {};
    try {
      final res = await client
          .from('placement_hub_data')
          .select('*')
          .eq('user_id', op.userId)
          .maybeSingle();
      if (res != null) {
        remote = Map<String, dynamic>.from(res as Map);
      }
    } catch (_) {}

    // 2. Resolve conflict with field-level merge
    final local = Map<String, dynamic>.from(op.payload);
    final resolved = ConflictResolver.resolve(
      entityType: 'placement_hub_data',
      localData: local,
      remoteData: remote,
    );
    resolved['user_id'] = op.userId;
    resolved.remove('_dirty');
    resolved.remove('_localUpdatedAt');

    await client.from('placement_hub_data').upsert(resolved, onConflict: 'user_id');
  }

  Future<void> _handleGymPhoto(SupabaseClient client, SyncOperation op) async {
    final storagePath = op.payload['storagePath'] as String?;
    final bytesBase64 = op.payload['bytesBase64'] as String?;
    if (storagePath == null || storagePath.isEmpty || bytesBase64 == null) {
      return;
    }

    final bytes = base64Decode(bytesBase64);
    await client.storage.from('gym-photos').uploadBinary(
          storagePath,
          bytes,
          fileOptions: const FileOptions(
            contentType: 'image/jpeg',
            upsert: true,
          ),
        );
  }
}

/// Testable Mock Remote Sync Handler.
class MockRemoteSyncHandler implements RemoteSyncHandler {
  final List<SyncOperation> executedOps = [];
  final Map<String, Map<String, dynamic>> remoteTables = {};
  
  // Simulation controls
  bool shouldFailTransients = false;
  bool shouldFailPermanent = false;
  int transientFailuresRemaining = 0;
  String? failureMessage;

  void reset() {
    executedOps.clear();
    remoteTables.clear();
    shouldFailTransients = false;
    shouldFailPermanent = false;
    transientFailuresRemaining = 0;
    failureMessage = null;
  }

  @override
  Future<void> executeOperation(SyncOperation op) async {
    if (shouldFailPermanent) {
      throw Exception('400 Bad Request: ${failureMessage ?? "Permanent schema violation"}');
    }
    if (shouldFailTransients || transientFailuresRemaining > 0) {
      if (transientFailuresRemaining > 0) transientFailuresRemaining--;
      throw Exception('SocketException: ${failureMessage ?? "Connection reset by peer"}');
    }

    executedOps.add(op);
    final tableKey = '${op.entityType}_${op.userId}';
    final table = remoteTables.putIfAbsent(tableKey, () => {});

    if (op.operationType == SyncOperationType.delete) {
      table.remove(op.entityId);
    } else {
      table[op.entityId] = Map<String, dynamic>.from(op.payload);
    }
  }
}
