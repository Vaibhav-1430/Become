import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/streak_service.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../dsa/data/striver_a2z_data.dart';
import '../../development/data/dev_curriculum_data.dart';
import '../../plan/domain/study_session.dart';
import '../domain/analytics_data.dart';
import 'analytics_repository.dart';

/// Production Supabase implementation of [AnalyticsRepository].
/// Gathers authentic, real-time analytics from:
/// - `public.study_tasks`
/// - `public.study_sessions`
/// - `public.dsa_progress`
/// - `public.development_progress`
/// - `public.workout_sessions` & `public.personal_records`
/// - `public.mistakes`
class SupabaseAnalyticsRepository implements AnalyticsRepository {
  final SupabaseClient? _clientOverride;

  String? _cachedUserId;
  AnalyticsData? _cachedData;

  SupabaseAnalyticsRepository({SupabaseClient? client})
      : _clientOverride = client;

  SupabaseClient? get _client => _clientOverride ?? ForgeSupabase.instance.client;

  String? get _currentUserId => _client?.auth.currentUser?.id;

  @override
  void invalidateCache() {
    _cachedData = null;
    _cachedUserId = null;
  }

  void _checkUserCache() {
    final uid = _currentUserId;
    if (_cachedUserId != uid) {
      _cachedUserId = uid;
      _cachedData = null;
    }
  }

  @override
  Future<AnalyticsData> getAnalyticsData({int historyDays = 14}) async {
    _checkUserCache();
    final client = _client;
    final userId = _currentUserId;

    if (client == null || userId == null) {
      return _cachedData ?? const AnalyticsData();
    }

    try {
      final now = DateTime.now();
      final todayStr = _formatDate(now);
      final startDateStr = _formatDate(now.subtract(Duration(days: historyDays - 1)));

      // Concurrent queries across authenticated endpoints
      final results = await Future.wait([
        // 0. Completed Study Tasks (for streak & study days)
        client
            .from('study_tasks')
            .select('date, status, is_study, category')
            .eq('user_id', userId)
            .eq('status', 'COMPLETED'),

        // 1. Study Sessions (lifetime focus & categories)
        client
            .from('study_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('date', ascending: false),

        // 2. DSA Progress
        client
            .from('dsa_progress')
            .select('problem_id, status')
            .eq('user_id', userId),

        // 3. Dev Progress
        client
            .from('development_progress')
            .select('item_id, category, status')
            .eq('user_id', userId),

        // 4. Workout Sessions
        client
            .from('workout_sessions')
            .select('date, total_volume_kg, total_sets')
            .eq('user_id', userId),

        // 5. Personal Records
        client
            .from('personal_records')
            .select('id')
            .eq('user_id', userId),

        // 6. Mistakes
        client
            .from('mistakes')
            .select('id, resolved, repeat_count, revisit_date')
            .eq('user_id', userId),
      ]);

      // 0. Process Tasks -> Streak & Study Days
      final tasksRaw = results[0] as List;
      final completedDates = <String>{};
      final dailyCompletedCount = <String, int>{};

      for (final t in tasksRaw) {
        final d = t['date']?.toString();
        if (d != null && d.isNotEmpty) {
          completedDates.add(d);
          dailyCompletedCount[d] = (dailyCompletedCount[d] ?? 0) + 1;
        }
      }

      final totalStudyDays = completedDates.length;

      // Authentic streak calculation matching web TaskEngine.calculateStreak
      int streak = 0;
      DateTime checkDate = now;
      if (completedDates.contains(todayStr)) {
        streak++;
        checkDate = now.subtract(const Duration(days: 1));
      } else {
        // If today has not completed tasks yet, check from yesterday
        final yesterdayStr = _formatDate(now.subtract(const Duration(days: 1)));
        if (completedDates.contains(yesterdayStr)) {
          checkDate = now.subtract(const Duration(days: 1));
        }
      }

      while (streak < 365) {
        final dateStr = _formatDate(checkDate);
        if (completedDates.contains(dateStr)) {
          streak++;
          checkDate = checkDate.subtract(const Duration(days: 1));
        } else {
          break;
        }
      }

      // Keep canonical StreakService synchronized
      StreakService.instance.setStreak(streak);

      // 1. Process Study Sessions
      final sessionsRaw = results[1] as List;
      final sessions = sessionsRaw
          .map((m) => StudySession.fromMap(m as Map<String, dynamic>))
          .toList();

      int totalFocusSec = 0;
      int totalBreakSec = 0;
      int maxFocusSec = 0;
      final Map<String, int> catCounts = {};
      final Map<String, int> dailyFocusSec = {};

      for (final s in sessions) {
        totalFocusSec += s.activeSeconds;
        totalBreakSec += s.breakSeconds;
        if (s.activeSeconds > maxFocusSec) maxFocusSec = s.activeSeconds;

        final c = s.subject.isNotEmpty ? s.subject : 'DSA';
        catCounts[c] = (catCounts[c] ?? 0) + 1;

        if (s.date.compareTo(startDateStr) >= 0 && s.date.compareTo(todayStr) <= 0) {
          dailyFocusSec[s.date] = (dailyFocusSec[s.date] ?? 0) + s.activeSeconds;
        }
      }

      final totalFocusMins = totalFocusSec ~/ 60;
      final totalBreakMins = totalBreakSec ~/ 60;
      final avgMins = sessions.isNotEmpty ? (totalFocusSec ~/ sessions.length) ~/ 60 : 0;
      final maxMins = maxFocusSec ~/ 60;
      final totalCombinedSec = totalFocusSec + totalBreakSec;
      final breakRatio = totalCombinedSec > 0
          ? ((totalBreakSec / totalCombinedSec) * 100).round()
          : 0;

      String topCat = 'None';
      int maxCatCount = 0;
      catCounts.forEach((k, v) {
        if (v > maxCatCount) {
          maxCatCount = v;
          topCat = k;
        }
      });

      // 14-Day Activity Bar Chart
      final dailyBars = <DailyActivityBar>[];
      for (int i = historyDays - 1; i >= 0; i--) {
        final d = now.subtract(Duration(days: i));
        final dStr = _formatDate(d);
        final completed = dailyCompletedCount[dStr] ?? 0;
        final fMins = (dailyFocusSec[dStr] ?? 0) ~/ 60;
        dailyBars.add(DailyActivityBar(
          date: dStr,
          dayOfMonth: d.day,
          completedTasks: completed,
          focusMinutes: fMins,
          isGood: completed >= 2,
        ));
      }

      // 2. Process DSA Progress
      final dsaRaw = results[2] as List;
      final solvedProblemIds = <String>{};
      for (final d in dsaRaw) {
        final isSolved = d['status']?.toString().toUpperCase() == 'SOLVED';
        if (isSolved && d['problem_id'] != null) {
          solvedProblemIds.add(d['problem_id'].toString());
        }
      }

      int dsaTotal = 0;
      final diffMap = <String, String>{};
      for (final s in kStriverA2ZSections) {
        for (final t in s.topics) {
          for (final p in t.problems) {
            dsaTotal++;
            diffMap[p.id] = p.difficulty;
          }
        }
      }
      final dsaSolved = solvedProblemIds.length;

      // Classify easy, medium, hard
      int easyCount = 0;
      int medCount = 0;
      int hardCount = 0;
      for (final id in solvedProblemIds) {
        final diff = (diffMap[id] ?? 'medium').toLowerCase();
        if (diff == 'easy') {
          easyCount++;
        } else if (diff == 'hard') {
          hardCount++;
        } else {
          medCount++;
        }
      }

      // 3. Process Dev Progress
      final devRaw = results[3] as List;
      final completedTopicIds = <String>{};
      for (final dev in devRaw) {
        final statusUpper = dev['status']?.toString().toUpperCase();
        final isComp = statusUpper == 'COMPLETED' || statusUpper == 'SOLVED' || statusUpper == 'DONE';
        final itemId = dev['item_id']?.toString();
        if (isComp && itemId != null) {
          completedTopicIds.add(itemId);
        }
      }
      final devTotal = kDevCurriculumTopics.length;
      final devCompleted = completedTopicIds.length;

      // 4. Process Workout Sessions & Volume
      final gymRaw = results[4] as List;
      double volume = 0;
      int sets = 0;
      int weekCompleted = 0;
      final weekStart = now.subtract(Duration(days: now.weekday - 1));
      final weekStartStr = _formatDate(weekStart);

      for (final g in gymRaw) {
        final v = (g['total_volume_kg'] as num?)?.toDouble() ?? 0.0;
        final s = (g['total_sets'] as num?)?.toInt() ?? 0;
        volume += v;
        sets += s;

        final gDate = g['date']?.toString() ?? '';
        if (gDate.compareTo(weekStartStr) >= 0) {
          weekCompleted++;
        }
      }

      final prRaw = results[5] as List;
      final prCount = prRaw.length;

      // 5. Process Mistakes
      final mistakesRaw = results[6] as List;
      int totalMistakes = mistakesRaw.length;
      int unresolved = 0;
      int dueToday = 0;

      for (final m in mistakesRaw) {
        final res = m['resolved'] == true;
        if (!res) {
          unresolved++;
          final revDate = m['revisit_date']?.toString();
          if (revDate != null && revDate.isNotEmpty && revDate.compareTo(todayStr) <= 0) {
            dueToday++;
          }
        }
      }
      final accuracy = totalMistakes > 0
          ? ((totalMistakes - unresolved) / totalMistakes) * 100.0
          : 0.0;

      final data = AnalyticsData(
        streakDays: streak,
        totalStudyDays: totalStudyDays,
        totalFocusMinutes: totalFocusMins,
        totalBreakMinutes: totalBreakMins,
        sessionCount: sessions.length,
        averageSessionMinutes: avgMins,
        longestSessionMinutes: maxMins,
        breakRatioPercent: breakRatio,
        primaryCategory: topCat,
        categorySpread: catCounts,
        recentSessions: sessions.take(10).toList(),
        dailyHistory: dailyBars,
        dsaSolved: dsaSolved,
        dsaTotal: dsaTotal,
        dsaEasySolved: easyCount,
        dsaMediumSolved: medCount,
        dsaHardSolved: hardCount,
        devCompletedTopics: devCompleted,
        devTotalTopics: devTotal,
        weeklyWorkoutsCompleted: weekCompleted,
        weeklyWorkoutsPlanned: 4, // standard 4-day split default
        lifetimeVolumeKg: volume,
        lifetimeSets: sets,
        totalWorkouts: gymRaw.length,
        personalRecordsCount: prCount,
        totalMistakes: totalMistakes,
        unresolvedDeficits: unresolved,
        dueSrsToday: dueToday,
        recoveryAccuracy: accuracy,
      );

      _cachedData = data;
      return data;
    } catch (e) {
      debugPrint('[SupabaseAnalyticsRepository] getAnalyticsData error: $e');
      return _cachedData ?? const AnalyticsData();
    }
  }

  String _formatDate(DateTime d) {
    return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }
}
