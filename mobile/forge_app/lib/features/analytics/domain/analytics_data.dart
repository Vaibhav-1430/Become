import '../../plan/domain/study_session.dart';

/// Single daily activity data point for the 14-day tactical activity chart.
class DailyActivityBar {
  final String date; // 'YYYY-MM-DD'
  final int dayOfMonth;
  final int completedTasks;
  final int focusMinutes;
  final bool isGood; // >= 2 completed tasks, matches web 'isGood'

  const DailyActivityBar({
    required this.date,
    required this.dayOfMonth,
    this.completedTasks = 0,
    this.focusMinutes = 0,
    this.isGood = false,
  });
}

/// Comprehensive analytics data model derived strictly from persisted FORGE data.
class AnalyticsData {
  // Study Streak & Consistency
  final int streakDays;
  final int totalStudyDays;

  // Authentic Timed Focus Metrics (from `public.study_sessions`)
  final int totalFocusMinutes;
  final int totalBreakMinutes;
  final int sessionCount;
  final int averageSessionMinutes;
  final int longestSessionMinutes;
  final int breakRatioPercent;
  final String primaryCategory;
  final Map<String, int> categorySpread;
  final List<StudySession> recentSessions;

  // 14-Day Activity Bar Chart
  final List<DailyActivityBar> dailyHistory;

  // DSA Mastery (from `public.dsa_progress`)
  final int dsaSolved;
  final int dsaTotal;
  final int dsaEasySolved;
  final int dsaMediumSolved;
  final int dsaHardSolved;

  // Development Mastery (from `public.development_progress`)
  final int devCompletedTopics;
  final int devTotalTopics;

  // Gym / Physical Training (from `public.workout_sessions` & `personal_records`)
  final int weeklyWorkoutsCompleted;
  final int weeklyWorkoutsPlanned;
  final double lifetimeVolumeKg;
  final int lifetimeSets;
  final int totalWorkouts;
  final int personalRecordsCount;

  // Error Defense / Mistake Bank (from `public.mistakes`)
  final int totalMistakes;
  final int unresolvedDeficits;
  final int dueSrsToday;
  final double recoveryAccuracy;

  const AnalyticsData({
    this.streakDays = 0,
    this.totalStudyDays = 0,
    this.totalFocusMinutes = 0,
    this.totalBreakMinutes = 0,
    this.sessionCount = 0,
    this.averageSessionMinutes = 0,
    this.longestSessionMinutes = 0,
    this.breakRatioPercent = 0,
    this.primaryCategory = 'None',
    this.categorySpread = const {},
    this.recentSessions = const [],
    this.dailyHistory = const [],
    this.dsaSolved = 0,
    this.dsaTotal = 0,
    this.dsaEasySolved = 0,
    this.dsaMediumSolved = 0,
    this.dsaHardSolved = 0,
    this.devCompletedTopics = 0,
    this.devTotalTopics = 0,
    this.weeklyWorkoutsCompleted = 0,
    this.weeklyWorkoutsPlanned = 0,
    this.lifetimeVolumeKg = 0.0,
    this.lifetimeSets = 0,
    this.totalWorkouts = 0,
    this.personalRecordsCount = 0,
    this.totalMistakes = 0,
    this.unresolvedDeficits = 0,
    this.dueSrsToday = 0,
    this.recoveryAccuracy = 0.0,
  });

  /// Computed DSA percentage
  double get dsaPercentage =>
      dsaTotal > 0 ? (dsaSolved / dsaTotal) * 100.0 : 0.0;

  /// Computed Development percentage
  double get devPercentage =>
      devTotalTopics > 0 ? (devCompletedTopics / devTotalTopics) * 100.0 : 0.0;

  /// Explicit flag: True ONLY if user has genuine persisted telemetry.
  /// If false, the UI renders the explicit empty state with zero fake telemetry.
  bool get hasData =>
      streakDays > 0 ||
      totalStudyDays > 0 ||
      sessionCount > 0 ||
      dsaSolved > 0 ||
      devCompletedTopics > 0 ||
      totalWorkouts > 0 ||
      totalMistakes > 0;
}
