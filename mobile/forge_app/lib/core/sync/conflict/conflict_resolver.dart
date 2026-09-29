
/// Strategy applied during conflict resolution.
enum ConflictStrategy {
  lastWriteWins,
  fieldLevelMerge,
  appendOnly,
  serverAuthoritative,
  localAuthoritative,
  monotonicMax,
}

/// Centralized resolver enforcing domain-specific conflict rules per entity.
class ConflictResolver {
  const ConflictResolver._();

  /// Resolves conflict between local state and incoming remote state for any entity.
  static Map<String, dynamic> resolve({
    required String entityType,
    required Map<String, dynamic> localData,
    required Map<String, dynamic> remoteData,
  }) {
    switch (entityType) {
      case 'study_task':
        return _resolveStudyTask(localData, remoteData);
      case 'study_session':
        return _resolveStudySession(localData, remoteData);
      case 'dsa_progress':
        return _resolveDsaProgress(localData, remoteData);
      case 'development_progress':
        return _resolveDevProgress(localData, remoteData);
      case 'mistake':
        return _resolveMistake(localData, remoteData);
      case 'workout_session':
        return _resolveWorkoutSession(localData, remoteData);
      case 'workout_set':
        return _resolveWorkoutSet(localData, remoteData);
      case 'personal_record':
        return _resolvePersonalRecord(localData, remoteData);
      case 'internship':
        return _resolveInternship(localData, remoteData);
      case 'placement_hub_data':
        return _resolvePlacementHub(localData, remoteData);
      default:
        // Default to Last-Write-Wins based on updated_at
        return _resolveLastWriteWins(localData, remoteData);
    }
  }

  /// 1. study_tasks:
  /// Strategy: Local-Authoritative for user-initiated status transition when dirty;
  /// otherwise Last-Write-Wins based on updated_at timestamp.
  static Map<String, dynamic> _resolveStudyTask(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final isDirty = local['_dirty'] == true;
    if (isDirty) {
      // Local user took an explicit action (e.g. marked completed offline) -> preserve local status
      final merged = Map<String, dynamic>.from(remote);
      merged['status'] = local['status'];
      merged['completed_at'] = local['completed_at'];
      merged['updated_at'] = local['updated_at'] ?? DateTime.now().toUtc().toIso8601String();
      return merged;
    }
    return _resolveLastWriteWins(local, remote);
  }

  /// 2. study_sessions:
  /// Strategy: Append-Only. Study sessions are discrete logged events.
  /// If local exists and remote is empty or older, preserve local session.
  static Map<String, dynamic> _resolveStudySession(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    if (remote.isEmpty) return local;
    return _resolveLastWriteWins(local, remote);
  }

  /// 3. dsa_progress:
  /// Strategy: Local-Authoritative / Union for 'SOLVED'.
  /// If problem was solved locally, it remains solved unless explicitly revoked.
  static Map<String, dynamic> _resolveDsaProgress(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final merged = Map<String, dynamic>.from(remote);
    final localSolved = local['status'] == 'SOLVED';
    final remoteSolved = remote['status'] == 'SOLVED';

    if (localSolved || remoteSolved) {
      merged['status'] = 'SOLVED';
      merged['solved_at'] = local['solved_at'] ?? remote['solved_at'] ?? DateTime.now().toUtc().toIso8601String();
    } else {
      merged['status'] = 'NOT_STARTED';
      merged['solved_at'] = null;
    }
    merged['updated_at'] = DateTime.now().toUtc().toIso8601String();
    return merged;
  }

  /// 4. development_progress:
  /// Strategy: Local-Authoritative / Union for 'COMPLETED'.
  static Map<String, dynamic> _resolveDevProgress(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final merged = Map<String, dynamic>.from(remote);
    final localComp = local['status'] == 'COMPLETED';
    final remoteComp = remote['status'] == 'COMPLETED';

    if (localComp || remoteComp) {
      merged['status'] = 'COMPLETED';
      merged['solved_at'] = local['solved_at'] ?? remote['solved_at'] ?? DateTime.now().toUtc().toIso8601String();
    } else {
      merged['status'] = 'NOT_STARTED';
      merged['solved_at'] = null;
    }
    merged['updated_at'] = DateTime.now().toUtc().toIso8601String();
    return merged;
  }

  /// 5. mistakes:
  /// Strategy: Field-Level Merge with monotonic repeat counts.
  /// Preserves local question/solution edits if dirty, merges repeat count monotonically.
  static Map<String, dynamic> _resolveMistake(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final merged = Map<String, dynamic>.from(remote);
    final isDirty = local['_dirty'] == true;

    final localRepeat = (local['repeat_count'] as num?)?.toInt() ?? 1;
    final remoteRepeat = (remote['repeat_count'] as num?)?.toInt() ?? 1;
    merged['repeat_count'] = localRepeat > remoteRepeat ? localRepeat : remoteRepeat;

    // Preserve local non-empty notes if remote has empty notes
    final localNotes = local['notes'] ?? local['personal_note'];
    final remoteNotes = remote['notes'] ?? remote['personal_note'];
    if ((remoteNotes == null || remoteNotes.toString().trim().isEmpty) &&
        (localNotes != null && localNotes.toString().trim().isNotEmpty)) {
      merged['notes'] = localNotes;
    }

    if (isDirty) {
      // Local edits take precedence
      if (local['resolved'] != null) merged['resolved'] = local['resolved'];
      if (local['solution'] != null) merged['solution'] = local['solution'];
      if (local['key_takeaway'] != null) merged['key_takeaway'] = local['key_takeaway'];
      if (local['notes'] != null) merged['notes'] = local['notes'];
      if (local['next_review_date'] != null) merged['next_review_date'] = local['next_review_date'];
      merged['updated_at'] = local['updated_at'] ?? DateTime.now().toUtc().toIso8601String();
    }
    return merged;
  }

  /// 6. workout_sessions:
  /// Strategy: Append-Only. Preserves local offline session metrics and notes.
  static Map<String, dynamic> _resolveWorkoutSession(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final isDirty = local['_dirty'] == true;
    if (isDirty || remote.isEmpty) {
      return Map<String, dynamic>.from(local);
    }
    return _resolveLastWriteWins(local, remote);
  }

  /// 7. workout_sets:
  /// Strategy: Append-Only with stable client IDs.
  static Map<String, dynamic> _resolveWorkoutSet(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    if (remote.isEmpty) return local;
    return _resolveLastWriteWins(local, remote);
  }

  /// 8. personal_records:
  /// Strategy: Monotonic Max. The highest weight / volume / reps wins.
  static Map<String, dynamic> _resolvePersonalRecord(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final merged = Map<String, dynamic>.from(remote);
    final localWeight = (local['weight_kg'] as num?)?.toDouble() ?? 0.0;
    final remoteWeight = (remote['weight_kg'] as num?)?.toDouble() ?? 0.0;

    if (localWeight > remoteWeight) {
      merged['weight_kg'] = localWeight;
      merged['reps'] = local['reps'];
      merged['achieved_at'] = local['achieved_at'];
    }
    return merged;
  }

  /// 9. internships:
  /// Strategy: Field-Level Merge with Last-Write-Wins on updated_at.
  static Map<String, dynamic> _resolveInternship(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final isDirty = local['_dirty'] == true;
    if (isDirty) {
      final merged = Map<String, dynamic>.from(remote);
      // Preserve local status and notes
      if (local['status'] != null) merged['status'] = local['status'];
      if (local['notes'] != null) merged['notes'] = local['notes'];
      if (local['applied_date'] != null) merged['applied_date'] = local['applied_date'];
      merged['updated_at'] = DateTime.now().toUtc().toIso8601String();
      return merged;
    }
    return _resolveLastWriteWins(local, remote);
  }

  /// 10. placement_hub_data:
  /// Strategy: Field-Level Merge with deduplicated weekly_tests.
  /// Preserves existing cloud fields without overwriting unrelated fields.
  static Map<String, dynamic> _resolvePlacementHub(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    final merged = Map<String, dynamic>.from(remote);
    // Merge weekly_tests lists deduplicating by attempt id
    final remoteTests = List<dynamic>.from(remote['weekly_tests'] as List? ?? []);
    final localTests = List<dynamic>.from(local['weekly_tests'] as List? ?? []);

    final Map<String, dynamic> testsMap = {};
    for (final t in remoteTests) {
      if (t is Map && t['id'] != null) {
        testsMap[t['id'].toString()] = t;
      }
    }
    for (final t in localTests) {
      if (t is Map && t['id'] != null) {
        testsMap[t['id'].toString()] = t; // Local recent attempt adds/updates
      }
    }

    merged['weekly_tests'] = testsMap.values.toList();
    if (local['weak_areas'] != null) {
      merged['weak_areas'] = local['weak_areas'];
    }
    merged['updated_at'] = DateTime.now().toUtc().toIso8601String();
    return merged;
  }

  /// Standard Last-Write-Wins comparison based on ISO-8601 `updated_at`.
  static Map<String, dynamic> _resolveLastWriteWins(
    Map<String, dynamic> local,
    Map<String, dynamic> remote,
  ) {
    if (remote.isEmpty) return local;
    if (local.isEmpty) return remote;

    final localUpdatedStr = local['updated_at'] ?? local['_localUpdatedAt'];
    final remoteUpdatedStr = remote['updated_at'];

    if (localUpdatedStr == null) return remote;
    if (remoteUpdatedStr == null) return local;

    try {
      final localTime = DateTime.parse(localUpdatedStr.toString());
      final remoteTime = DateTime.parse(remoteUpdatedStr.toString());
      return localTime.isAfter(remoteTime) ? local : remote;
    } catch (_) {
      return remote;
    }
  }
}
