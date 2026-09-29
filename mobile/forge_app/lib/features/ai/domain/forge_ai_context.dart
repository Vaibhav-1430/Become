class ForgeAiContext {
  final String currentDate;
  final String currentTime;
  final int pendingTasksCount;
  final int completedTasksCount;
  final int solvedDsaCount;
  final int totalDsaCount;
  final int completedDevCount;
  final int totalDevCount;
  final int availableWindowMins;
  final String? nextDsaProblemTitle;
  final String? activeDevTopicTitle;

  const ForgeAiContext({
    required this.currentDate,
    required this.currentTime,
    required this.pendingTasksCount,
    required this.completedTasksCount,
    required this.solvedDsaCount,
    required this.totalDsaCount,
    required this.completedDevCount,
    required this.totalDevCount,
    this.availableWindowMins = 45,
    this.nextDsaProblemTitle,
    this.activeDevTopicTitle,
  });

  Map<String, dynamic> toJson() {
    return {
      'currentDate': currentDate,
      'currentTime': currentTime,
      'pendingTasksCount': pendingTasksCount,
      'completedTasksCount': completedTasksCount,
      'dsaProgress': '$solvedDsaCount/$totalDsaCount',
      'devProgress': '$completedDevCount/$totalDevCount',
      'availableWindowMins': availableWindowMins,
      if (nextDsaProblemTitle != null) 'nextDsa': nextDsaProblemTitle,
      if (activeDevTopicTitle != null) 'activeDev': activeDevTopicTitle,
    };
  }
}
