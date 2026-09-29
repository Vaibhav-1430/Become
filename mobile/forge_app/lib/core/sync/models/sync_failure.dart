import 'package:flutter/foundation.dart';

/// Exhaustive classification of synchronization failures for FORGE Mobile.
enum SyncFailureCategory {
  authExpired,
  authRequired,
  networkUnavailable,
  serverError,
  rlsDenied,
  databaseError,
  realtimeError,
  queueError,
  hydrationError,
  unknownError,
}

/// Rich sync failure descriptor preserving internal diagnostics while
/// exposing clean, non-leaking user-facing explanations.
@immutable
class SyncFailure {
  final SyncFailureCategory category;
  final String rawError;
  final String? tableOrEntity;
  final int? httpStatus;
  final String? postgrestCode;
  final DateTime timestamp;

  const SyncFailure({
    required this.category,
    required this.rawError,
    this.tableOrEntity,
    this.httpStatus,
    this.postgrestCode,
    required this.timestamp,
  });

  /// User-facing message that hides raw Postgres/stack errors.
  String get userFriendlyMessage {
    switch (category) {
      case SyncFailureCategory.authExpired:
        return 'Session expired. Re-authenticating...';
      case SyncFailureCategory.authRequired:
        return 'Session expired. Sign in again.';
      case SyncFailureCategory.networkUnavailable:
        return 'Offline. Changes will sync when connection returns.';
      case SyncFailureCategory.serverError:
        return 'Cloud server error. Retrying later.';
      case SyncFailureCategory.rlsDenied:
        return 'Cloud access denied. Check account permissions.';
      case SyncFailureCategory.databaseError:
        return 'Cloud database request failed. Tap to retry.';
      case SyncFailureCategory.realtimeError:
        return 'Live connection interrupted. Reconnecting...';
      case SyncFailureCategory.queueError:
        return 'Pending changes could not be uploaded. Retry.';
      case SyncFailureCategory.hydrationError:
        return 'Cloud data fetch incomplete. Tap to retry.';
      case SyncFailureCategory.unknownError:
        return 'Sync failed. Tap to retry.';
    }
  }

  /// Categorizes an exception string or error object into [SyncFailureCategory].
  static SyncFailureCategory classify(dynamic error) {
    if (error == null) return SyncFailureCategory.unknownError;
    final str = error.toString().toLowerCase();

    if (str.contains('network') ||
        str.contains('socketexception') ||
        str.contains('failed host lookup') ||
        str.contains('connection refused') ||
        str.contains('offline') ||
        str.contains('timeout')) {
      return SyncFailureCategory.networkUnavailable;
    }

    if (str.contains('jwt expired') ||
        str.contains('token expired') ||
        str.contains('invalid_jwt')) {
      return SyncFailureCategory.authExpired;
    }

    if (str.contains('auth_required') ||
        str.contains('not authenticated') ||
        str.contains('session is null') ||
        str.contains('missing access token') ||
        str.contains('invalid claim')) {
      return SyncFailureCategory.authRequired;
    }

    if (str.contains('row-level security') ||
        str.contains('permission denied') ||
        str.contains('rls') ||
        str.contains('403') ||
        str.contains('forbidden')) {
      return SyncFailureCategory.rlsDenied;
    }

    if (str.contains('500') ||
        str.contains('502') ||
        str.contains('503') ||
        str.contains('504') ||
        str.contains('internal server error')) {
      return SyncFailureCategory.serverError;
    }

    if (str.contains('realtime') ||
        str.contains('channel') ||
        str.contains('subscription')) {
      return SyncFailureCategory.realtimeError;
    }

    if (str.contains('hydration') || str.contains('cloud hydration')) {
      return SyncFailureCategory.hydrationError;
    }

    if (str.contains('queue') || str.contains('pending queue')) {
      return SyncFailureCategory.queueError;
    }

    if (str.contains('postgrest') ||
        str.contains('column') ||
        str.contains('constraint') ||
        str.contains('duplicate key') ||
        str.contains('syntax error') ||
        str.contains('42p01') ||
        str.contains('23505') ||
        str.contains('22p02')) {
      return SyncFailureCategory.databaseError;
    }

    return SyncFailureCategory.unknownError;
  }

  /// Internal diagnostic logger ensuring tokens and credentials are NEVER exposed.
  void logDiagnostics({
    required String operationType,
    required String? userId,
    required String stage,
    int pendingCount = 0,
    int retryAttempt = 0,
    String? realtimeStatus,
  }) {
    if (kDebugMode) {
      debugPrint('====================================================');
      debugPrint('[FORGE SYNC DIAGNOSTICS]');
      debugPrint('  Category: $category');
      debugPrint('  Operation: $operationType');
      debugPrint('  Table/Entity: ${tableOrEntity ?? "N/A"}');
      debugPrint('  User ID: ${userId != null ? "${userId.substring(0, userId.length > 8 ? 8 : userId.length)}..." : "null"}');
      debugPrint('  Stage: $stage');
      debugPrint('  HTTP Status: ${httpStatus ?? "N/A"}');
      debugPrint('  PostgREST Code: ${postgrestCode ?? "N/A"}');
      debugPrint('  Pending Count: $pendingCount');
      debugPrint('  Retry Attempt: $retryAttempt');
      debugPrint('  Realtime Status: ${realtimeStatus ?? "N/A"}');
      debugPrint('  Error: $rawError');
      debugPrint('====================================================');
    }
  }

  @override
  String toString() => 'SyncFailure($category: $rawError)';
}
