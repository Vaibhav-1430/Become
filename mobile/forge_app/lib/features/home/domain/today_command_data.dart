import '../../plan/domain/study_task.dart';

/// Summary for an execution pillar on the Today's Command dashboard.
class PillarSummary {
  final String title;
  final String metric;
  final double progress; // 0.0 to 1.0
  final String footerText;
  final bool isCompleted;

  const PillarSummary({
    required this.title,
    required this.metric,
    required this.progress,
    required this.footerText,
    this.isCompleted = false,
  });

  factory PillarSummary.empty(String title) {
    return PillarSummary(
      title: title,
      metric: 'No Directives',
      progress: 0.0,
      footerText: 'Pending',
    );
  }
}

/// Unified domain aggregate representing all data displayed on Today's Command screen.
class TodayCommandData {
  final String greeting;
  final String semester;
  final String dateHeader;
  final double targetHours;
  final double completedHours;
  final int streakDays;
  final StudyTask? heroTask;
  final PillarSummary dsaSummary;
  final PillarSummary devSummary;
  final PillarSummary studySummary;
  final PillarSummary trainSummary;
  final List<StudyTask> directives;
  final bool isLoading;
  final String? errorMessage;

  const TodayCommandData({
    required this.greeting,
    this.semester = 'SEM 05',
    required this.dateHeader,
    required this.targetHours,
    required this.completedHours,
    this.streakDays = 0,
    this.heroTask,
    required this.dsaSummary,
    required this.devSummary,
    required this.studySummary,
    required this.trainSummary,
    required this.directives,
    this.isLoading = false,
    this.errorMessage,
  });

  int get completionPercentage {
    if (targetHours <= 0) return 0;
    return ((completedHours / targetHours) * 100).round().clamp(0, 100);
  }

  int get activePillarsCount {
    int count = 0;
    if (dsaSummary.progress > 0) count++;
    if (devSummary.progress > 0) count++;
    if (studySummary.progress > 0) count++;
    if (trainSummary.progress > 0) count++;
    return count;
  }

  TodayCommandData copyWith({
    String? greeting,
    String? semester,
    String? dateHeader,
    double? targetHours,
    double? completedHours,
    int? streakDays,
    StudyTask? heroTask,
    PillarSummary? dsaSummary,
    PillarSummary? devSummary,
    PillarSummary? studySummary,
    PillarSummary? trainSummary,
    List<StudyTask>? directives,
    bool? isLoading,
    String? errorMessage,
  }) {
    return TodayCommandData(
      greeting: greeting ?? this.greeting,
      semester: semester ?? this.semester,
      dateHeader: dateHeader ?? this.dateHeader,
      targetHours: targetHours ?? this.targetHours,
      completedHours: completedHours ?? this.completedHours,
      streakDays: streakDays ?? this.streakDays,
      heroTask: heroTask ?? this.heroTask,
      dsaSummary: dsaSummary ?? this.dsaSummary,
      devSummary: devSummary ?? this.devSummary,
      studySummary: studySummary ?? this.studySummary,
      trainSummary: trainSummary ?? this.trainSummary,
      directives: directives ?? this.directives,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
