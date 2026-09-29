import '../domain/mistake.dart';

/// Contract for Mistake Bank data access.
abstract class MistakeRepository {
  /// Fetches mistakes filtered by optional subject, status, or search query.
  /// Status can be 'all', 'unresolved', 'resolved', 'repeated', 'dueRevision'.
  Future<List<Mistake>> getMistakes({
    String? subject,
    String? status,
    String? query,
  });

  /// Computes authentic mistake metrics and SRS readiness statistics.
  Future<MistakeStats> getMistakeStats();

  /// Fetches a single mistake by its unique identifier.
  Future<Mistake?> getMistakeById(String id);

  /// Creates and logs a new mistake.
  Future<Mistake> createMistake(Mistake mistake);

  /// Updates existing mistake classification, notes, or revisit schedule.
  Future<Mistake> updateMistake(Mistake mistake);

  /// Toggles resolved / fixed state.
  Future<Mistake> toggleResolved(String id, bool currentResolved);

  /// Increments repeat count and reschedules revisit date by +3 days.
  Future<Mistake> incrementRevisit(String id);

  /// Deletes a mistake record.
  Future<bool> deleteMistake(String id);

  /// Clears in-memory cache on user account switch or explicit invalidation.
  void invalidateCache();
}
