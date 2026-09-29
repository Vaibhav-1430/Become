import '../domain/today_command_data.dart';

/// Contract for Today's Command dashboard data loading and task completion.
abstract class HomeRepository {
  /// Fetches unified TodayCommandData for the given or current date.
  Future<TodayCommandData> getTodayCommandData({String? dateStr});

  /// Toggles task completion state directly from dashboard.
  Future<bool> toggleDirectiveCompletion(String taskId, bool currentCompleted);
}
