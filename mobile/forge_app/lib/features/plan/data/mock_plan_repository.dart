import '../../../core/utils/forge_date_utils.dart';
import '../domain/study_session.dart';
import '../domain/study_task.dart';
import 'plan_repository.dart';

/// In-memory mock implementation of [PlanRepository] for tests and offline preview.
class MockPlanRepository implements PlanRepository {
  final Map<String, List<StudyTask>> _tasksByDate = {};
  final Map<String, List<StudySession>> _sessionsByDate = {};

  MockPlanRepository() {
    _seedDefaultData();
  }

  void _seedDefaultData() {
    final today = ForgeDateUtils.todayDateString();
    const stitchDate = '2024-10-24';

    final sampleTasks = [
      StudyTask(
        id: 'tsk_01',
        userId: 'usr_mock_001',
        date: today,
        taskId: 'dsa_01',
        title: 'Binary Trees & Traversal',
        category: 'DSA',
        startTime: '10:00',
        endTime: '11:20',
        status: 'COMPLETED',
        isStudy: true,
      ),
      StudyTask(
        id: 'tsk_02',
        userId: 'usr_mock_001',
        date: today,
        taskId: 'dev_01',
        title: 'Full-Stack Dev — Auth0 Integration',
        category: 'DEV',
        startTime: '13:00',
        endTime: '15:10',
        status: 'NOT_STARTED',
        isStudy: true,
      ),
      StudyTask(
        id: 'tsk_03',
        userId: 'usr_mock_001',
        date: today,
        taskId: 'gym_01',
        title: 'Chest & Triceps Hypertrophy (5 Sets Pending)',
        category: 'GYM',
        startTime: '17:30',
        endTime: '18:45',
        status: 'IN_PROGRESS',
        isStudy: false,
      ),
      StudyTask(
        id: 'tsk_04',
        userId: 'usr_mock_001',
        date: today,
        taskId: 'core_01',
        title: 'Mistake Bank Review — 4 LeetCode Weaknesses',
        category: 'CORE CS',
        startTime: '21:00',
        endTime: '22:00',
        status: 'NOT_STARTED',
        isStudy: true,
      ),
    ];

    _tasksByDate[today] = List.from(sampleTasks);
    _tasksByDate[stitchDate] = sampleTasks.map((t) => t.copyWith(date: stitchDate)).toList();
  }

  @override
  Future<List<StudyTask>> getTasksForDate(String dateStr) async {
    return List.from(_tasksByDate[dateStr] ?? []);
  }

  @override
  Future<Map<String, List<StudyTask>>> getTasksForMonth(int year, int month) async {
    return Map.from(_tasksByDate);
  }

  @override
  Future<bool> toggleTaskCompletion(String taskId, bool currentCompleted) async {
    final newStatus = currentCompleted ? 'NOT_STARTED' : 'COMPLETED';
    return updateTaskStatus(taskId, newStatus);
  }

  @override
  Future<bool> updateTaskStatus(String taskId, String newStatus) async {
    for (final tasks in _tasksByDate.values) {
      final index = tasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        tasks[index] = tasks[index].copyWith(status: newStatus);
        return true;
      }
    }
    return false;
  }

  @override
  Future<StudyTask?> createDirective(StudyTask task) async {
    final list = _tasksByDate.putIfAbsent(task.date, () => []);
    list.add(task);
    return task;
  }

  @override
  Future<List<StudySession>> getSessionsForDate(String dateStr) async {
    return List.from(_sessionsByDate[dateStr] ?? []);
  }

  void seedTasksForDate(String dateStr, List<StudyTask> tasks) {
    _tasksByDate[dateStr] = List.from(tasks);
  }
}
