import '../../dsa/data/dsa_repository.dart';
import '../../dsa/data/mock_dsa_repository.dart';
import '../../development/data/dev_repository.dart';
import '../../development/data/mock_dev_repository.dart';
import '../domain/models/test_attempt_result.dart';
import '../domain/models/test_session.dart';
import '../services/syllabus_boundary_service.dart';
import 'test_repository.dart';

/// In-memory mock implementation of [TestRepository] for tests and offline preview.
class MockTestRepository implements TestRepository {
  final DsaRepository _dsaRepo;
  final DevRepository _devRepo;
  String? _currentUserId = 'mock_user_1';

  final Map<String, List<TestAttemptResult>> _attemptsByUser = {};

  MockTestRepository({
    DsaRepository? dsaRepository,
    DevRepository? devRepository,
    String? initialUserId = 'mock_user_1',
  })  : _dsaRepo = dsaRepository ?? MockDsaRepository(),
        _devRepo = devRepository ?? MockDevRepository(),
        _currentUserId = initialUserId;

  @override
  void setUserId(String? userId) {
    _currentUserId = userId;
  }

  @override
  void invalidateCache() {
    // No-op for mock, or clear memory if needed
  }

  String get _activeUser => _currentUserId ?? 'anonymous';

  @override
  Future<SyllabusBoundary> getSyllabusBoundary() async {
    return SyllabusBoundaryService.detectBoundary(
      dsaRepository: _dsaRepo,
      devRepository: _devRepo,
    );
  }

  @override
  Future<TestSession> generateTest({
    required TestType type,
    int? questionCount,
    int durationMinutes = 30,
  }) async {
    final boundary = await getSyllabusBoundary();
    return SyllabusBoundaryService.generateSession(
      boundary: boundary,
      type: type,
      requestedQuestionCount: questionCount,
      durationMinutes: durationMinutes,
    );
  }

  @override
  Future<TestAttemptResult> saveTestAttempt(TestAttemptResult result) async {
    final list = _attemptsByUser.putIfAbsent(_activeUser, () => []);
    list.removeWhere((r) => r.id == result.id || r.attemptId == result.attemptId);
    list.insert(0, result);
    return result;
  }

  @override
  Future<List<TestAttemptResult>> getTestHistory() async {
    final list = _attemptsByUser[_activeUser] ?? [];
    return List<TestAttemptResult>.from(list);
  }

  @override
  Future<TestAttemptResult?> getTestAttemptById(String id) async {
    final list = _attemptsByUser[_activeUser] ?? [];
    try {
      return list.firstWhere((r) => r.id == id || r.attemptId == id);
    } catch (_) {
      return null;
    }
  }
}
