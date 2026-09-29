import 'package:flutter/foundation.dart';
import '../sync/storage/local_store.dart';
import '../../features/auth/data/auth_service.dart';
import '../supabase/supabase_client.dart';

/// Canonical, single-source-of-truth service for calculating and providing
/// the global activity streak across all FORGE Mobile screens.
///
/// Implements 1:1 mathematical parity with web `TaskEngine.calculateStreak()`.
class StreakService extends ChangeNotifier {
  static final StreakService _instance = StreakService._internal();
  static StreakService get instance => _instance;

  StreakService._internal();

  int _currentStreak = 0;
  DateTime? _lastComputedDate;
  String? _lastUserId;

  int get currentStreak => _currentStreak;
  String get formattedStreak => '${_currentStreak}d';
  DateTime? get lastComputedDate => _lastComputedDate;
  String? get lastUserId => _lastUserId;

  /// Recomputes the streak from persistent LocalStore and/or Supabase cloud state.
  Future<int> recomputeStreak({String? userId}) async {
    final effectiveUserId = userId ??
        AuthService.current.currentUser?.id ??
        (ForgeSupabase.instance.isInitialized
            ? ForgeSupabase.instance.client?.auth.currentUser?.id
            : null);

    if (effectiveUserId == null || effectiveUserId.isEmpty || effectiveUserId == 'anonymous') {
      _currentStreak = 0;
      _lastUserId = effectiveUserId;
      _lastComputedDate = DateTime.now();
      notifyListeners();
      return 0;
    }

    try {
      // 1. Fetch completed study tasks from LocalStore
      final store = LocalStore.instance;
      final tasks = await store.getRecords(
        userId: effectiveUserId,
        entityType: 'study_task',
      );

      final completedDates = <String>{};

      for (final t in tasks) {
        final status = (t['status'] ?? '').toString().toUpperCase();
        if (status == 'COMPLETED') {
          final dateStr = (t['date'] ?? t['date_key'] ?? '').toString();
          if (dateStr.length >= 10) {
            completedDates.add(dateStr.substring(0, 10));
          }
        }
      }

      // 2. If LocalStore was empty, attempt quick fallback query to Supabase if online
      if (completedDates.isEmpty && ForgeSupabase.instance.isInitialized) {
        try {
          final client = ForgeSupabase.instance.client;
          if (client != null) {
            final cloudRows = await client
                .from('study_tasks')
                .select('date, status')
                .eq('user_id', effectiveUserId)
                .or('status.eq.COMPLETED,status.eq.completed')
                .limit(400);

            for (final row in cloudRows as List<dynamic>) {
              final d = row['date']?.toString();
              if (d != null && d.length >= 10) {
                completedDates.add(d.substring(0, 10));
              }
            }
          }
        } catch (_) {}
      }

      // 3. Compute consecutive days matching TaskEngine.calculateStreak()
      final now = DateTime.now();
      final todayStr = _formatDate(now);
      final yesterdayStr = _formatDate(now.subtract(const Duration(days: 1)));

      int streak = 0;
      DateTime checkDate = now;

      if (completedDates.contains(todayStr)) {
        streak++;
        checkDate = now.subtract(const Duration(days: 1));
      } else if (completedDates.contains(yesterdayStr)) {
        checkDate = now.subtract(const Duration(days: 1));
      } else {
        // Neither today nor yesterday had completed study tasks
        _currentStreak = 0;
        _lastComputedDate = now;
        _lastUserId = effectiveUserId;
        notifyListeners();
        return 0;
      }

      while (streak < 365) {
        final dStr = _formatDate(checkDate);
        if (completedDates.contains(dStr)) {
          streak++;
          checkDate = checkDate.subtract(const Duration(days: 1));
        } else {
          break;
        }
      }

      _currentStreak = streak;
      _lastComputedDate = now;
      _lastUserId = effectiveUserId;
      notifyListeners();
      return _currentStreak;
    } catch (e) {
      debugPrint('[StreakService] Error recomputing streak: $e');
      return _currentStreak;
    }
  }

  /// Manually set streak value (e.g. from Analytics snapshot) if fresher.
  void setStreak(int value) {
    if (_currentStreak != value) {
      _currentStreak = value;
      notifyListeners();
    }
  }

  String _formatDate(DateTime dt) {
    return '${dt.year.toString().padLeft(4, '0')}-'
        '${dt.month.toString().padLeft(2, '0')}-'
        '${dt.day.toString().padLeft(2, '0')}';
  }
}
