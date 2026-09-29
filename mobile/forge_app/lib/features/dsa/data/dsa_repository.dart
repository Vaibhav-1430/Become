import '../domain/dsa_section.dart';
import '../domain/dsa_progress.dart';

abstract class DsaRepository {
  Future<List<DsaSection>> getCurriculum();
  Future<Set<String>> getSolvedProblemIds();
  Future<bool> toggleProblemSolved(String problemId, bool isSolved);
  Future<DsaProgress> getDsaProgress();
  Future<void> refresh();
}
