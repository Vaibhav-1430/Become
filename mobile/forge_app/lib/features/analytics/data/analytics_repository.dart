import '../domain/analytics_data.dart';

/// Contract for Analytics telemetry derivation.
abstract class AnalyticsRepository {
  /// Fetches unified telemetry aggregated across tasks, sessions, DSA, dev, and gym.
  Future<AnalyticsData> getAnalyticsData({int historyDays = 14});

  /// Flushes in-memory caches on user switch.
  void invalidateCache();
}
