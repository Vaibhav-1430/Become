import 'package:flutter/foundation.dart';
import '../../services/streak_service.dart';
import '../hydration/cloud_hydration_service.dart';
import '../../../features/auth/data/auth_service.dart';
import '../../supabase/supabase_client.dart';

enum RefreshDomain {
  all,
  gym,
  learn,
  dsa,
  development,
  home,
  plan,
  analytics,
  career,
  mistakes,
  tests,
}

/// Central coordinator for authoritative cloud-pull refreshes across all screens.
/// Guarantees that refreshing a section synchronizes cloud data into LocalStore,
/// updates repository caches, recalculates streaks, and triggers UI rebuilds.
class RefreshCoordinator extends ChangeNotifier {
  static final RefreshCoordinator _instance = RefreshCoordinator._internal();
  static RefreshCoordinator get instance => _instance;

  RefreshCoordinator._internal();

  final Set<RefreshDomain> _activeRefreshes = <RefreshDomain>{};
  String? _lastError;

  bool isRefreshing([RefreshDomain domain = RefreshDomain.all]) {
    if (domain == RefreshDomain.all) {
      return _activeRefreshes.isNotEmpty;
    }
    return _activeRefreshes.contains(domain) || _activeRefreshes.contains(RefreshDomain.all);
  }

  String? get lastError => _lastError;

  /// Refreshes all application domains from Supabase.
  Future<bool> refreshAll() async {
    if (_activeRefreshes.contains(RefreshDomain.all)) return false;

    _activeRefreshes.add(RefreshDomain.all);
    _lastError = null;
    notifyListeners();

    try {
      final userId = AuthService.current.currentUser?.id ??
          ForgeSupabase.instance.client?.auth.currentUser?.id;

      if (userId == null || userId.isEmpty) {
        throw Exception('User not authenticated');
      }

      // Execute full cloud hydration
      final success = await CloudHydrationService.instance.hydrate(userId, force: true);

      // Recompute canonical streak
      await StreakService.instance.recomputeStreak(userId: userId);

      return success;
    } catch (e) {
      _lastError = e.toString().replaceAll('Exception: ', '');
      debugPrint('[RefreshCoordinator] refreshAll error: $e');
      return false;
    } finally {
      _activeRefreshes.remove(RefreshDomain.all);
      notifyListeners();
    }
  }

  Future<bool> _executeDomainRefresh(
    RefreshDomain domain,
    Future<void> Function()? onRefresh, {
    bool recomputeStreak = false,
  }) async {
    if (isRefreshing(domain)) return false;

    _activeRefreshes.add(domain);
    _lastError = null;
    notifyListeners();

    try {
      if (onRefresh != null) {
        await onRefresh();
      }
      if (recomputeStreak) {
        final userId = AuthService.current.currentUser?.id ??
            ForgeSupabase.instance.client?.auth.currentUser?.id;
        if (userId != null && userId.isNotEmpty) {
          await StreakService.instance.recomputeStreak(userId: userId);
        }
      }
      return true;
    } catch (e) {
      _lastError = e.toString().replaceAll('Exception: ', '');
      debugPrint('[RefreshCoordinator] refresh ${domain.name} error: $e');
      return false;
    } finally {
      _activeRefreshes.remove(domain);
      notifyListeners();
    }
  }

  /// Refreshes Gym domain (workout plans, sessions, exercises, sets, personal records).
  Future<bool> refreshGym({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.gym, onRefresh);
  }

  /// Refreshes Learn domain (DSA and Development progress, AI, Tests).
  Future<bool> refreshLearn({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.learn, onRefresh, recomputeStreak: true);
  }

  /// Refreshes DSA specifically.
  Future<bool> refreshDsa({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.dsa, onRefresh, recomputeStreak: true);
  }

  /// Refreshes Development specifically.
  Future<bool> refreshDevelopment({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.development, onRefresh);
  }

  /// Refreshes Home domain.
  Future<bool> refreshHome({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.home, onRefresh, recomputeStreak: true);
  }

  /// Refreshes Plan domain (tasks and calendar).
  Future<bool> refreshPlan({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.plan, onRefresh, recomputeStreak: true);
  }

  /// Refreshes Analytics domain.
  Future<bool> refreshAnalytics({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.analytics, onRefresh, recomputeStreak: true);
  }

  /// Refreshes Career domain.
  Future<bool> refreshCareer({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.career, onRefresh);
  }

  /// Refreshes Mistakes domain.
  Future<bool> refreshMistakes({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.mistakes, onRefresh);
  }

  /// Refreshes Tests domain.
  Future<bool> refreshTests({Future<void> Function()? onRefresh}) {
    return _executeDomainRefresh(RefreshDomain.tests, onRefresh);
  }
}
