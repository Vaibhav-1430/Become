import 'dsa_problem.dart';

class DsaProgress {
  final int totalProblems;
  final int solvedProblems;
  final int totalEasy;
  final int solvedEasy;
  final int totalMedium;
  final int solvedMedium;
  final int totalHard;
  final int solvedHard;
  final int streakDays;
  final int srsDueCount;
  final double accuracyPct;
  final DsaProblem? nextProblem;

  const DsaProgress({
    required this.totalProblems,
    required this.solvedProblems,
    required this.totalEasy,
    required this.solvedEasy,
    required this.totalMedium,
    required this.solvedMedium,
    required this.totalHard,
    required this.solvedHard,
    this.streakDays = 14,
    this.srsDueCount = 6,
    this.accuracyPct = 78.2,
    this.nextProblem,
  });

  double get overallPct =>
      totalProblems == 0 ? 0.0 : (solvedProblems / totalProblems) * 100;
  double get easyPct =>
      totalEasy == 0 ? 0.0 : (solvedEasy / totalEasy) * 100;
  double get mediumPct =>
      totalMedium == 0 ? 0.0 : (solvedMedium / totalMedium) * 100;
  double get hardPct =>
      totalHard == 0 ? 0.0 : (solvedHard / totalHard) * 100;
}
