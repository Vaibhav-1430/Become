import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/streak_service.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/sync/engine/sync_engine.dart';
import '../../../core/sync/models/sync_operation.dart';
import '../../../core/sync/storage/local_store.dart';
import '../../auth/data/auth_service.dart';
import '../domain/dsa_section.dart';
import '../domain/dsa_problem.dart';
import '../domain/dsa_progress.dart';
import 'dsa_repository.dart';
import 'striver_a2z_data.dart';

class SupabaseDsaRepository implements DsaRepository {
  final SupabaseClient? _clientOverride;
  final String? _overrideUserId;
  final LocalStore _localStore;

  final Set<String> _cachedSolvedIds = <String>{};
  bool _isCacheInitialized = false;

  SupabaseDsaRepository({
    SupabaseClient? client,
    String? overrideUserId,
    LocalStore? localStore,
  })  : _clientOverride = client,
        _overrideUserId = overrideUserId,
        _localStore = localStore ?? LocalStore.instance;

  SupabaseClient? get _client =>
      _clientOverride ?? (ForgeSupabase.instance.isInitialized ? ForgeSupabase.instance.client : null);

  String? get _currentUserId {
    return _overrideUserId ?? AuthService.current.currentUser?.id ?? _client?.auth.currentUser?.id;
  }

  @override
  Future<void> refresh() async {
    _cachedSolvedIds.clear();
    _isCacheInitialized = false;
    await getSolvedProblemIds();
  }

  @override
  Future<Set<String>> getSolvedProblemIds() async {
    final userId = _currentUserId ?? 'anonymous';

    // 1. Read from persistent local store first
    final localRecords = await _localStore.getRecords(
      userId: userId,
      entityType: 'dsa_progress',
    );
    for (final r in localRecords) {
      final statusUpper = r['status']?.toString().toUpperCase();
      if (statusUpper == 'SOLVED') {
        _cachedSolvedIds.add(r['problem_id'] as String);
      } else {
        _cachedSolvedIds.remove(r['problem_id'] as String);
      }
    }
    _isCacheInitialized = true;

    final client = _client;
    if (userId == 'anonymous' || client == null) {
      return Set<String>.from(_cachedSolvedIds);
    }

    // 2. Fetch remote data when online
    try {
      final response = await client
          .from('dsa_progress')
          .select('problem_id, status')
          .eq('user_id', userId);

      final solved = <String>{};
      for (final row in response as List<dynamic>) {
        final pid = row['problem_id'] as String?;
        final statusUpper = row['status']?.toString().toUpperCase();
        if (pid != null && statusUpper == 'SOLVED') {
          solved.add(pid);
          // Save to local store
          await _localStore.saveRecord(
            userId: userId,
            entityType: 'dsa_progress',
            entityId: pid,
            data: {
              'user_id': userId,
              'problem_id': pid,
              'status': 'SOLVED',
            },
            isDirty: false,
          );
        }
      }

      // Preserve local dirty solved problems
      for (final r in localRecords) {
        if (r['_dirty'] == true && r['status']?.toString().toUpperCase() == 'SOLVED') {
          solved.add(r['problem_id'] as String);
        }
      }

      _cachedSolvedIds.clear();
      _cachedSolvedIds.addAll(solved);
      return Set<String>.from(_cachedSolvedIds);
    } catch (e) {
      debugPrint('[SupabaseDsaRepository] getSolvedProblemIds network error: $e');
      return Set<String>.from(_cachedSolvedIds);
    }
  }

  @override
  Future<List<DsaSection>> getCurriculum() async {
    if (!_isCacheInitialized) {
      await getSolvedProblemIds();
    }

    return kStriverA2ZSections.map((section) {
      final updatedTopics = section.topics.map((topic) {
        final updatedProblems = topic.problems.map((prob) {
          final isSolved = _cachedSolvedIds.contains(prob.id);
          return prob.copyWith(isSolved: isSolved);
        }).toList();
        return topic.copyWithProblems(updatedProblems);
      }).toList();
      return section.copyWithTopics(updatedTopics);
    }).toList();
  }

  @override
  Future<bool> toggleProblemSolved(String problemId, bool isSolved) async {
    // 1. Optimistic memory update
    if (isSolved) {
      _cachedSolvedIds.add(problemId);
    } else {
      _cachedSolvedIds.remove(problemId);
    }

    final userId = _currentUserId ?? 'anonymous';
    final now = DateTime.now().toUtc().toIso8601String();

    // 2. Local persistence with dirty flag
    await _localStore.saveRecord(
      userId: userId,
      entityType: 'dsa_progress',
      entityId: problemId,
      data: {
        'user_id': userId,
        'problem_id': problemId,
        'status': isSolved ? 'SOLVED' : 'NOT_STARTED',
        'solved_at': isSolved ? now : null,
        'updated_at': now,
      },
      isDirty: true,
    );

    // 3. Persistent Sync Queue operation
    final op = SyncOperation.createPending(
      id: 'op_${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      entityType: 'dsa_progress',
      entityId: problemId,
      operationType: SyncOperationType.update,
      payload: {
        'user_id': userId,
        'problem_id': problemId,
        'status': isSolved ? 'SOLVED' : 'NOT_STARTED',
        'solved_at': isSolved ? now : null,
        'updated_at': now,
      },
    );
    await _localStore.enqueue(op);

    // 4. Trigger SyncEngine in background
    SyncEngine.instance.setActiveUserId(userId);
    SyncEngine.instance.processPendingQueue();

    return true;
  }

  @override
  Future<DsaProgress> getDsaProgress() async {
    final curriculum = await getCurriculum();

    int totalProblems = 0;
    int solvedProblems = 0;
    int totalEasy = 0;
    int solvedEasy = 0;
    int totalMedium = 0;
    int solvedMedium = 0;
    int totalHard = 0;
    int solvedHard = 0;
    DsaProblem? nextProblem;

    for (final section in curriculum) {
      for (final topic in section.topics) {
        for (final p in topic.problems) {
          totalProblems++;
          final diff = p.difficulty.toLowerCase();
          if (diff == 'easy') {
            totalEasy++;
            if (p.isSolved) solvedEasy++;
          } else if (diff == 'medium') {
            totalMedium++;
            if (p.isSolved) solvedMedium++;
          } else if (diff == 'hard') {
            totalHard++;
            if (p.isSolved) solvedHard++;
          }

          if (p.isSolved) {
            solvedProblems++;
          } else {
            nextProblem ??= p;
          }
        }
      }
    }

    int streakDays = 0;
    int srsDueCount = 0;
    double accuracyPct = 0.0;

    final userId = _currentUserId;
    if (userId != null && userId != 'anonymous') {
      final records = await _localStore.getRecords(userId: userId, entityType: 'dsa_progress');
      final solvedDates = <String>{};
      final now = DateTime.now();
      for (final r in records) {
        if (r['status'] == 'SOLVED') {
          final sAt = r['solved_at']?.toString();
          if (sAt != null && sAt.length >= 10) {
            solvedDates.add(sAt.substring(0, 10));
          }
        }
        final revAt = r['revisit_at']?.toString();
        if (revAt != null && revAt.isNotEmpty) {
          final revDate = DateTime.tryParse(revAt);
          if (revDate != null && revDate.isBefore(now)) {
            srsDueCount++;
          }
        }
      }

      if (solvedDates.isNotEmpty) {
        final todayStr = '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
        DateTime check = now;
        if (solvedDates.contains(todayStr)) {
          streakDays++;
          check = check.subtract(const Duration(days: 1));
        } else {
          final yDate = now.subtract(const Duration(days: 1));
          final yStr = '${yDate.year.toString().padLeft(4, '0')}-${yDate.month.toString().padLeft(2, '0')}-${yDate.day.toString().padLeft(2, '0')}';
          if (solvedDates.contains(yStr)) {
            check = yDate;
          }
        }
        while (streakDays < 365) {
          final dStr = '${check.year.toString().padLeft(4, '0')}-${check.month.toString().padLeft(2, '0')}-${check.day.toString().padLeft(2, '0')}';
          if (solvedDates.contains(dStr)) {
            streakDays++;
            check = check.subtract(const Duration(days: 1));
          } else {
            break;
          }
        }
      }

      if (totalProblems > 0) {
        accuracyPct = double.parse(((solvedProblems / totalProblems) * 100).toStringAsFixed(1));
      }
    }

    return DsaProgress(
      totalProblems: totalProblems,
      solvedProblems: solvedProblems,
      totalEasy: totalEasy,
      solvedEasy: solvedEasy,
      totalMedium: totalMedium,
      solvedMedium: solvedMedium,
      totalHard: totalHard,
      solvedHard: solvedHard,
      streakDays: StreakService.instance.currentStreak > 0
          ? StreakService.instance.currentStreak
          : streakDays,
      srsDueCount: srsDueCount,
      accuracyPct: accuracyPct,
      nextProblem: nextProblem,
    );
  }
}
