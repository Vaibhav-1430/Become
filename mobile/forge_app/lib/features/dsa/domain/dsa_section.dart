import 'dsa_topic.dart';

class DsaSection {
  final int sectionIndex;
  final String name;
  final List<DsaTopic> topics;

  const DsaSection({
    required this.sectionIndex,
    required this.name,
    required this.topics,
  });

  int get totalProblems =>
      topics.fold(0, (acc, topic) => acc + topic.totalProblems);
  int get solvedProblems =>
      topics.fold(0, (acc, topic) => acc + topic.solvedProblems);
  bool get isCompleted => totalProblems > 0 && solvedProblems == totalProblems;
  double get progressPct =>
      totalProblems == 0 ? 0.0 : (solvedProblems / totalProblems) * 100;

  DsaSection copyWithTopics(List<DsaTopic> newTopics) {
    return DsaSection(
      sectionIndex: sectionIndex,
      name: name,
      topics: newTopics,
    );
  }
}
