import 'package:flutter/foundation.dart';
import '../../../../core/sync/storage/local_store.dart';
import '../../auth/data/auth_service.dart';
import '../../../core/services/streak_service.dart';
import '../../../core/utils/forge_date_utils.dart';
import '../../plan/data/plan_repository.dart';
import '../../plan/data/supabase_plan_repository.dart';
import '../../plan/domain/study_task.dart';
import '../domain/today_command_data.dart';
import 'home_repository.dart';

/// Real Supabase implementation of [HomeRepository].
/// Assembles real user profile, study tasks, and focus sessions.
class SupabaseHomeRepository implements HomeRepository {
  final PlanRepository _planRepository;
  final String? _overrideUserId;

  // Cached aggregate for offline stability
  TodayCommandData? _cachedData;

  SupabaseHomeRepository({PlanRepository? planRepository, String? overrideUserId})
      : _planRepository = planRepository ?? SupabasePlanRepository(),
        _overrideUserId = overrideUserId;

  @override
  Future<TodayCommandData> getTodayCommandData({String? dateStr}) async {
    final targetDate = dateStr ?? ForgeDateUtils.todayDateString();
    final user = AuthService.current.currentUser;
    final effectiveUserId = _overrideUserId ?? user?.id ?? 'anonymous';
    final userName = user?.firstName ?? 'Operator';
    final dateHeader = '${ForgeDateUtils.formatLongDate(targetDate)} • Execution Protocol Active';

    try {
      // 1. Fetch real tasks for target date
      final tasks = await _planRepository.getTasksForDate(targetDate);

      // 2. Fetch real study sessions for target date
      final sessions = await _planRepository.getSessionsForDate(targetDate);
      double loggedStudyHours = 0.0;
      for (final s in sessions) {
        loggedStudyHours += s.activeHours;
      }

      // If no recorded study sessions yet, calculate duration of completed tasks
      if (loggedStudyHours == 0.0) {
        loggedStudyHours = tasks.where((t) => t.isCompleted).length * 1.0;
      }

      const double targetHours = 6.5;

      // 3. Find next Hero command (first uncompleted DSA, then uncompleted DEV/STUDY/TRAIN)
      StudyTask? heroTask;
      final pendingTasks = tasks.where((t) => !t.isCompleted).toList();
      if (pendingTasks.isNotEmpty) {
        heroTask = pendingTasks.firstWhere(
          (t) => t.isDsa,
          orElse: () => pendingTasks.first,
        );
      }

      // 4. Compute Pillar Summaries
      // Canonical DSA progress from LocalStore / dsa_progress
      final dsaRecords = await LocalStore.instance.getRecords(
        userId: effectiveUserId,
        entityType: 'dsa_progress',
      );
      final dsaSolvedCount = dsaRecords.where((r) => r['status']?.toString().toUpperCase() == 'SOLVED').length;
      const int dsaTotal = 443;
      final dsaProgressPct = (dsaSolvedCount / dsaTotal).clamp(0.0, 1.0);
      final dsaSummary = PillarSummary(
        title: 'DSA',
        metric: '$dsaSolvedCount/$dsaTotal Solved',
        progress: dsaProgressPct,
        footerText: '${(dsaProgressPct * 100).toStringAsFixed(1)}% Completed',
        isCompleted: dsaSolvedCount >= dsaTotal,
      );

      // Canonical Development progress from LocalStore / development_progress
      final devRecords = await LocalStore.instance.getRecords(
        userId: effectiveUserId,
        entityType: 'development_progress',
      );
      final completedTopicSet = <String>{};
      for (final r in devRecords) {
        final s = r['status']?.toString().toUpperCase();
        if (s == 'COMPLETED' || s == 'SOLVED' || s == 'DONE') {
          final itemId = (r['item_id'] ?? r['topic_id'])?.toString();
          if (itemId != null && itemId.isNotEmpty) completedTopicSet.add(itemId);
        }
      }
      const int devTotal = 16;
      final devCompleted = completedTopicSet.length;
      final devProgressPct = (devCompleted / devTotal).clamp(0.0, 1.0);
      final devSummary = PillarSummary(
        title: 'DEV',
        metric: '$devCompleted/$devTotal Tracks',
        progress: devProgressPct,
        footerText: '${(devProgressPct * 100).round()}% Completed',
        isCompleted: devCompleted >= devTotal,
      );

      final studyTasks = tasks.where((t) => t.isCoreCs).toList();
      final trainTasks = tasks.where((t) => t.isGym).toList();

      final studySummary = _computePillarSummary('STUDY', studyTasks, 'Done');
      final trainSummary = _computePillarSummary('TRAIN', trainTasks, 'Sets');

      final streakDays = await StreakService.instance.recomputeStreak(userId: effectiveUserId);

      final aggregate = TodayCommandData(
        greeting: 'Good morning, $userName',
        semester: user?.cohortTarget?.contains('Class') == true ? 'SEM 05' : 'CORE',
        dateHeader: dateHeader,
        targetHours: targetHours,
        completedHours: loggedStudyHours,
        streakDays: streakDays,
        heroTask: heroTask,
        dsaSummary: dsaSummary,
        devSummary: devSummary,
        studySummary: studySummary,
        trainSummary: trainSummary,
        directives: tasks,
        isLoading: false,
      );

      _cachedData = aggregate;
      return aggregate;
    } catch (e) {
      debugPrint('[SupabaseHomeRepository] Error building TodayCommandData: $e');
      if (_cachedData != null) {
        return _cachedData!.copyWith(
          errorMessage: 'OFFLINE MODE // SERVING CACHED TELEMETRY',
        );
      }
      return TodayCommandData(
        greeting: 'Good morning, $userName',
        dateHeader: dateHeader,
        targetHours: 6.5,
        completedHours: 0.0,
        dsaSummary: PillarSummary.empty('DSA'),
        devSummary: PillarSummary.empty('DEV'),
        studySummary: PillarSummary.empty('STUDY'),
        trainSummary: PillarSummary.empty('TRAIN'),
        directives: const [],
        isLoading: false,
        errorMessage: 'NETWORK TIMEOUT // COULD NOT RETRIEVE COMMANDS',
      );
    }
  }

  PillarSummary _computePillarSummary(String title, List<StudyTask> tasks, String suffix) {
    if (tasks.isEmpty) {
      return PillarSummary(
        title: title,
        metric: 'No Directives',
        progress: 0.0,
        footerText: 'Pending',
      );
    }

    final completedCount = tasks.where((t) => t.isCompleted).length;
    final totalCount = tasks.length;
    final progress = (completedCount / totalCount).clamp(0.0, 1.0);
    final percentage = (progress * 100).round();

    return PillarSummary(
      title: title,
      metric: '$completedCount/$totalCount $suffix',
      progress: progress,
      footerText: progress == 1.0 ? 'Done' : '$percentage% Completed',
      isCompleted: progress == 1.0,
    );
  }

  @override
  Future<bool> toggleDirectiveCompletion(String taskId, bool currentCompleted) {
    return _planRepository.toggleTaskCompletion(taskId, currentCompleted);
  }
}
