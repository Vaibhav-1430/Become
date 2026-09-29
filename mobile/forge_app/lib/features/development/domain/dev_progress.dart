import 'dev_topic.dart';

class DevProgress {
  final int totalTopics;
  final int completedTopics;
  final double hoursLogged;
  final int commitsCount;
  final double stackMasteryPct;
  final int oaReadyCount;
  final int oaTotalCount;
  final DevTopic? activeFocusTopic;

  const DevProgress({
    required this.totalTopics,
    required this.completedTopics,
    this.hoursLogged = 142.5,
    this.commitsCount = 184,
    this.stackMasteryPct = 68.4,
    this.oaReadyCount = 4,
    this.oaTotalCount = 6,
    this.activeFocusTopic,
  });

  double get overallPct =>
      totalTopics == 0 ? 0.0 : (completedTopics / totalTopics) * 100;
}
