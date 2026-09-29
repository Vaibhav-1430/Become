import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../../config/app_config.dart';

/// Network status states across the FORGE application.
enum NetworkStatus {
  online,
  offline,
  unknown,
}

/// Interface for evaluating true network reachability.
abstract class ReachabilityChecker {
  Future<bool> checkReachability();
}

/// Default production reachability checker that verifies internet access via socket / HTTP.
class DefaultReachabilityChecker implements ReachabilityChecker {
  @override
  Future<bool> checkReachability() async {
    if (Platform.environment.containsKey('FLUTTER_TEST')) {
      return true;
    }
    try {
      // 1. Try to resolve Supabase host or public DNS
      final host = Uri.tryParse(AppConfig.supabaseUrl)?.host;
      final target = (host != null && host.isNotEmpty) ? host : 'one.one.one.one';
      
      final result = await InternetAddress.lookup(target)
          .timeout(const Duration(seconds: 3));
      
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      // Fallback: check google DNS
      try {
        final result = await InternetAddress.lookup('dns.google')
            .timeout(const Duration(seconds: 3));
        return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
      } catch (_) {
        return false;
      }
    }
  }
}

/// Mock reachability checker for deterministic unit/widget testing.
class MockReachabilityChecker implements ReachabilityChecker {
  bool _isReachable = true;

  MockReachabilityChecker({bool initialOnline = true}) : _isReachable = initialOnline;

  void setOnline(bool online) {
    _isReachable = online;
  }

  @override
  Future<bool> checkReachability() async => _isReachable;
}

/// Centralized service providing real-time network and connectivity state.
class ConnectivityService extends ChangeNotifier {
  static ConnectivityService? _instance;

  static ConnectivityService get instance {
    _instance ??= ConnectivityService();
    return _instance!;
  }

  static set instance(ConnectivityService service) {
    _instance = service;
  }

  ReachabilityChecker _checker;
  NetworkStatus _status = NetworkStatus.unknown;
  Timer? _heartbeatTimer;
  final StreamController<NetworkStatus> _statusController =
      StreamController<NetworkStatus>.broadcast();

  ConnectivityService({ReachabilityChecker? checker, NetworkStatus initialStatus = NetworkStatus.unknown})
      : _checker = checker ?? DefaultReachabilityChecker(),
        _status = initialStatus;

  NetworkStatus get status => _status;
  bool get isOnline => _status == NetworkStatus.online;
  bool get isOffline => _status == NetworkStatus.offline;
  Stream<NetworkStatus> get onStatusChange => _statusController.stream;

  /// Replace reachability checker (useful for test environments)
  void setChecker(ReachabilityChecker checker) {
    _checker = checker;
  }

  /// Start periodic background connectivity checks
  void startMonitoring({Duration interval = const Duration(seconds: 15)}) {
    _heartbeatTimer?.cancel();
    if (Platform.environment.containsKey('FLUTTER_TEST')) {
      _updateStatus(NetworkStatus.online);
      return;
    }
    checkConnectivity();
    _heartbeatTimer = Timer.periodic(interval, (_) => checkConnectivity());
  }

  /// Stop monitoring (useful on app pause or teardown)
  void stopMonitoring() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  /// Explicitly triggers a reachability probe and updates listeners if state changed.
  Future<bool> checkConnectivity() async {
    try {
      final reachable = await _checker.checkReachability();
      final newStatus = reachable ? NetworkStatus.online : NetworkStatus.offline;
      _updateStatus(newStatus);
      return reachable;
    } catch (_) {
      _updateStatus(NetworkStatus.offline);
      return false;
    }
  }

  /// Manually overrides status (useful for simulated offline/reconnect testing).
  void setStatusForTesting(NetworkStatus newStatus) {
    _updateStatus(newStatus);
  }

  bool _isDisposed = false;

  void _updateStatus(NetworkStatus newStatus) {
    if (_isDisposed) return;
    if (_status != newStatus) {
      _status = newStatus;
      if (!_statusController.isClosed) {
        _statusController.add(newStatus);
      }
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _heartbeatTimer?.cancel();
    _statusController.close();
    super.dispose();
  }
}
