import '../domain/dsa_section.dart';
import '../domain/dsa_problem.dart';
import '../domain/dsa_progress.dart';
import 'dsa_repository.dart';
import 'striver_a2z_data.dart';
import '../../../core/services/streak_service.dart';

class MockDsaRepository implements DsaRepository {
  final Set<String> _solvedIds;
  bool shouldFail = false;

  MockDsaRepository({Set<String>? initialSolvedIds})
      : _solvedIds = initialSolvedIds ?? <String>{'425', '1211'};

  @override
  Future<void> refresh() async {}

  @override
  Future<Set<String>> getSolvedProblemIds() async {
    return Set<String>.from(_solvedIds);
  }

  @override
  Future<List<DsaSection>> getCurriculum() async {
    return kStriverA2ZSections.map((section) {
      final updatedTopics = section.topics.map((topic) {
        final updatedProblems = topic.problems.map((prob) {
          final isSolved = _solvedIds.contains(prob.id);
          return prob.copyWith(isSolved: isSolved);
        }).toList();
        return topic.copyWithProblems(updatedProblems);
      }).toList();
      return section.copyWithTopics(updatedTopics);
    }).toList();
  }

  @override
  Future<bool> toggleProblemSolved(String problemId, bool isSolved) async {
    final previousState = _solvedIds.contains(problemId);

    // Optimistic update
    if (isSolved) {
      _solvedIds.add(problemId);
    } else {
      _solvedIds.remove(problemId);
    }

    if (shouldFail) {
      // Rollback
      if (previousState) {
        _solvedIds.add(problemId);
      } else {
        _solvedIds.remove(problemId);
      }
      throw Exception('Simulated persistence failure');
    }

    return true;
  }

  @override
  Future<DsaProgress> getDsaProgress() async {
    final curriculum = await getCurriculum();

    int totalProblems = 0;
    int solvedProblems = 0;
    int totalEasy = 0;
    int solvedEasy = 0;
    int totalMedium = 0;
    int solvedMedium = 0;
    int totalHard = 0;
    int solvedHard = 0;
    DsaProblem? nextProblem;

    for (final section in curriculum) {
      for (final topic in section.topics) {
        for (final p in topic.problems) {
          totalProblems++;
          final diff = p.difficulty.toLowerCase();
          if (diff == 'easy') {
            totalEasy++;
            if (p.isSolved) solvedEasy++;
          } else if (diff == 'medium') {
            totalMedium++;
            if (p.isSolved) solvedMedium++;
          } else if (diff == 'hard') {
            totalHard++;
            if (p.isSolved) solvedHard++;
          }

          if (p.isSolved) {
            solvedProblems++;
          } else {
            nextProblem ??= p;
          }
        }
      }
    }

    return DsaProgress(
      totalProblems: totalProblems,
      solvedProblems: solvedProblems,
      totalEasy: totalEasy,
      solvedEasy: solvedEasy,
      totalMedium: totalMedium,
      solvedMedium: solvedMedium,
      totalHard: totalHard,
      solvedHard: solvedHard,
      streakDays: StreakService.instance.currentStreak,
      srsDueCount: 6,
      accuracyPct: 78.2,
      nextProblem: nextProblem,
    );
  }
}
