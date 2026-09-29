import 'dsa_problem.dart';

class DsaTopic {
  final String name;
  final int sectionIndex;
  final List<DsaProblem> problems;

  const DsaTopic({
    required this.name,
    required this.sectionIndex,
    required this.problems,
  });

  int get totalProblems => problems.length;
  int get solvedProblems => problems.where((p) => p.isSolved).length;
  bool get isCompleted => totalProblems > 0 && solvedProblems == totalProblems;
  double get progressPct =>
      totalProblems == 0 ? 0.0 : (solvedProblems / totalProblems) * 100;

  DsaTopic copyWithProblems(List<DsaProblem> newProblems) {
    return DsaTopic(
      name: name,
      sectionIndex: sectionIndex,
      problems: newProblems,
    );
  }
}
