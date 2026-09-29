import '../domain/study_session.dart';
import '../domain/study_task.dart';

/// Contract for Plan & Calendar task data access.
abstract class PlanRepository {
  /// Fetches tasks for a specific date ('YYYY-MM-DD').
  Future<List<StudyTask>> getTasksForDate(String dateStr);

  /// Fetches all tasks for a specific month grouped by date string.
  Future<Map<String, List<StudyTask>>> getTasksForMonth(int year, int month);

  /// Toggles task completion between 'COMPLETED' and 'NOT_STARTED'.
  Future<bool> toggleTaskCompletion(String taskId, bool currentCompleted);

  /// Updates task status explicitly ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED').
  Future<bool> updateTaskStatus(String taskId, String newStatus);

  /// Inserts a new study task.
  Future<StudyTask?> createDirective(StudyTask task);

  /// Fetches focus study sessions for a specific date.
  Future<List<StudySession>> getSessionsForDate(String dateStr);
}
