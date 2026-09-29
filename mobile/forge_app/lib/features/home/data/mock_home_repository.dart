import '../../auth/data/auth_service.dart';
import '../../plan/domain/study_task.dart';
import '../domain/today_command_data.dart';
import 'home_repository.dart';
import '../../../core/services/streak_service.dart';

/// In-memory mock implementation of [HomeRepository] ensuring 100% Phase 5B test compatibility.
class MockHomeRepository implements HomeRepository {
  final List<StudyTask> _directives = [
    const StudyTask(
      id: 'tsk_dsa_424',
      userId: 'usr_mock_001',
      date: '2024-10-24',
      taskId: 'striver_424',
      title: 'Striver #424 (Longest Repeating Character)',
      category: 'DSA',
      startTime: '16:00',
      endTime: '17:00',
      status: 'NOT_STARTED',
      isStudy: true,
      metadata: {'tag1': 'Medium', 'tag2': 'Sliding Window'},
    ),
    const StudyTask(
      id: 'tsk_gym_01',
      userId: 'usr_mock_001',
      date: '2024-10-24',
      taskId: 'gym_chest',
      title: "Gym Check-in & Workout (Chest + Triceps)",
      category: 'GYM',
      startTime: '17:30',
      endTime: '18:35',
      status: 'NOT_STARTED',
      isStudy: false,
      metadata: {'tag1': "Gold's Gym", 'tag2': '65m Est'},
    ),
    const StudyTask(
      id: 'tsk_study_vm',
      userId: 'usr_mock_001',
      date: '2024-10-24',
      taskId: 'os_vm',
      title: 'Core CS: OS Virtual Memory Review',
      category: 'STUDY',
      startTime: '20:00',
      endTime: '21:00',
      status: 'NOT_STARTED',
      isStudy: true,
      metadata: {'tag1': 'Silberschatz Ch 9', 'tag2': 'Quiz Prep'},
    ),
  ];

  @override
  Future<TodayCommandData> getTodayCommandData({String? dateStr}) async {
    final user = AuthService.current.currentUser;
    final userName = user?.firstName ?? 'BOSS';

    return TodayCommandData(
      greeting: 'Good morning, $userName',
      semester: 'SEM 05',
      dateHeader: 'Thursday, Oct 24 • Execution Protocol Active',
      targetHours: 6.5,
      completedHours: 5.25,
      streakDays: StreakService.instance.currentStreak,
      heroTask: const StudyTask(
        id: 'hero_dsa_01',
        userId: 'usr_mock_001',
        date: '2024-10-24',
        taskId: 'dsa_hero',
        title: 'DSA — Two Pointers & Sliding Window',
        category: 'DSA',
        startTime: '16:00',
        status: 'NOT_STARTED',
        notes: 'Striver A2Z Step 3 • 2 problems remaining to finish medium tier',
      ),
      dsaSummary: const PillarSummary(
        title: 'DSA',
        metric: '3/5 Solved',
        progress: 0.60,
        footerText: '60% Completed',
      ),
      devSummary: const PillarSummary(
        title: 'DEV',
        metric: 'Next.js 14 Actions',
        progress: 0.75,
        footerText: '1.5h logged',
      ),
      studySummary: const PillarSummary(
        title: 'STUDY',
        metric: 'Dist. Systems Ch4',
        progress: 1.0,
        footerText: 'Done',
        isCompleted: true,
      ),
      trainSummary: const PillarSummary(
        title: 'TRAIN',
        metric: 'Push Day A',
        progress: 0.0,
        footerText: '5:30 PM (Pending)',
      ),
      directives: _directives,
    );
  }

  @override
  Future<bool> toggleDirectiveCompletion(String taskId, bool currentCompleted) async {
    final idx = _directives.indexWhere((t) => t.id == taskId);
    if (idx != -1) {
      final newStatus = currentCompleted ? 'NOT_STARTED' : 'COMPLETED';
      _directives[idx] = _directives[idx].copyWith(status: newStatus);
      return true;
    }
    return false;
  }
}
