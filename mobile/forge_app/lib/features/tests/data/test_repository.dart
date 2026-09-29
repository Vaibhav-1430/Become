import '../domain/models/test_attempt_result.dart';
import '../domain/models/test_session.dart';
import '../services/syllabus_boundary_service.dart';

/// Abstract contract for Test Engine data and persistence.
abstract class TestRepository {
  /// Detects the user's authentic syllabus boundary based on real progress.
  Future<SyllabusBoundary> getSyllabusBoundary();

  /// Generates a new test session strictly conforming to the covered topics.
  Future<TestSession> generateTest({
    required TestType type,
    int? questionCount,
    int durationMinutes = 30,
  });

  /// Persists a completed test attempt result in the database.
  Future<TestAttemptResult> saveTestAttempt(TestAttemptResult result);

  /// Retrieves the authenticated user's test attempt history.
  Future<List<TestAttemptResult>> getTestHistory();

  /// Retrieves a specific test attempt by its ID.
  Future<TestAttemptResult?> getTestAttemptById(String id);

  /// Clears in-memory caches on user switch or sign out.
  void invalidateCache();

  /// Sets the active user ID (for testing or session override).
  void setUserId(String? userId);
}
