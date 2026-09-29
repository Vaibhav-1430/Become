import '../domain/analytics_data.dart';
import 'analytics_repository.dart';

/// In-memory mock implementation of [AnalyticsRepository] for deterministic testing.
class MockAnalyticsRepository implements AnalyticsRepository {
  String _activeUserId;
  final Map<String, AnalyticsData> _userData = {};

  MockAnalyticsRepository({String initialUserId = 'test_user_1'})
      : _activeUserId = initialUserId;

  void setActiveUser(String userId) {
    _activeUserId = userId;
  }

  void seedData(String userId, AnalyticsData data) {
    _userData[userId] = data;
  }

  @override
  void invalidateCache() {
    // Retains user isolation
  }

  @override
  Future<AnalyticsData> getAnalyticsData({int historyDays = 14}) async {
    return _userData[_activeUserId] ?? const AnalyticsData();
  }
}
