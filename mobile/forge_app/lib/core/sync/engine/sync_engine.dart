import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../supabase/supabase_client.dart';
import '../models/sync_failure.dart';
import '../models/sync_operation.dart';
import '../network/connectivity_service.dart';
import '../storage/local_store.dart';
import '../realtime/realtime_sync_service.dart';
import '../hydration/cloud_hydration_service.dart';
import '../refresh/refresh_coordinator.dart';
import 'remote_sync_handler.dart';

/// High-level synchronization states presented to the UI.
enum SyncState {
  synced,
  pendingSync,
  syncing,
  offline,
  syncError,
  partialFailure,
}

/// Snapshot of the active synchronization status across all subsystems.
class SyncStatusData {
  final SyncState state;
  final int pendingCount;
  final int failedMutationCount;
  final SyncFailureCategory? failureCategory;
  final String? userFriendlyMessage;
  final String? lastError;
  final DateTime? lastSyncTime;
  final bool isOnline;
  final RealtimeStatus realtimeStatus;
  final HydrationStatus hydrationStatus;
  final bool isAuthValid;

  const SyncStatusData({
    this.state = SyncState.synced,
    this.pendingCount = 0,
    this.failedMutationCount = 0,
    this.failureCategory,
    this.userFriendlyMessage,
    this.lastError,
    this.lastSyncTime,
    this.isOnline = true,
    this.realtimeStatus = RealtimeStatus.connected,
    this.hydrationStatus = HydrationStatus.hydrated,
    this.isAuthValid = true,
  });

  SyncStatusData copyWith({
    SyncState? state,
    int? pendingCount,
    int? failedMutationCount,
    SyncFailureCategory? failureCategory,
    String? userFriendlyMessage,
    String? lastError,
    DateTime? lastSyncTime,
    bool? isOnline,
    RealtimeStatus? realtimeStatus,
    HydrationStatus? hydrationStatus,
    bool? isAuthValid,
  }) {
    return SyncStatusData(
      state: state ?? this.state,
      pendingCount: pendingCount ?? this.pendingCount,
      failedMutationCount: failedMutationCount ?? this.failedMutationCount,
      failureCategory: failureCategory ?? this.failureCategory,
      userFriendlyMessage: userFriendlyMessage ?? this.userFriendlyMessage,
      lastError: lastError ?? this.lastError,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      isOnline: isOnline ?? this.isOnline,
      realtimeStatus: realtimeStatus ?? this.realtimeStatus,
      hydrationStatus: hydrationStatus ?? this.hydrationStatus,
      isAuthValid: isAuthValid ?? this.isAuthValid,
    );
  }
}

/// Centralized, production-hardened offline synchronization engine for FORGE Mobile.
class SyncEngine extends ChangeNotifier {
  static SyncEngine? _instance;

  static SyncEngine get instance {
    _instance ??= SyncEngine();
    return _instance!;
  }

  static set instance(SyncEngine engine) {
    _instance = engine;
  }

  final LocalStore _localStore;
  final ConnectivityService _connectivity;
  RemoteSyncHandler _remoteHandler;

  bool _isSyncing = false;
  String? _activeUserId;
  StreamSubscription<NetworkStatus>? _networkSubscription;
  StreamSubscription<AuthState>? _authSubscription;

  SyncStatusData _statusData = const SyncStatusData();

  SyncStatusData get statusData => _statusData;
  SyncState get state => _statusData.state;
  int get pendingCount => _statusData.pendingCount;
  bool get isSyncing => _isSyncing;

  SyncEngine({
    LocalStore? localStore,
    ConnectivityService? connectivity,
    RemoteSyncHandler? remoteHandler,
  })  : _localStore = localStore ?? LocalStore.instance,
        _connectivity = connectivity ?? ConnectivityService.instance,
        _remoteHandler = remoteHandler ?? SupabaseRemoteSyncHandler() {
    _initNetworkListener();
    _initAuthListener();
  }

  void setRemoteHandler(RemoteSyncHandler handler) {
    _remoteHandler = handler;
  }

  void setActiveUserId(String? userId) {
    if (_activeUserId != userId) {
      _activeUserId = userId;
      RealtimeSyncService.instance.setActiveUserId(userId);
      refreshStatus();
    }
  }

  /// Sets status data directly (useful for deterministic UI testing).
  void setStatusForTesting(SyncStatusData data) {
    _updateStatus(data);
  }

  void _initNetworkListener() {
    _networkSubscription = _connectivity.onStatusChange.listen((status) {
      final isOnline = status == NetworkStatus.online;
      if (isOnline) {
        debugPrint('[SyncEngine] Network restored: Triggering queue upload & reconciliation');
        processPendingQueue();
      } else {
        debugPrint('[SyncEngine] Network dropped: Transitioning to OFFLINE mode');
        _updateStatus(_statusData.copyWith(
          state: SyncState.offline,
          isOnline: false,
          failureCategory: SyncFailureCategory.networkUnavailable,
          userFriendlyMessage: 'Offline. Changes will sync when connection returns.',
        ));
      }
    });
  }

  void _initAuthListener() {
    try {
      if (ForgeSupabase.instance.isInitialized) {
        final client = ForgeSupabase.instance.client;
        if (client != null) {
          _authSubscription = client.auth.onAuthStateChange.listen((data) {
            final AuthChangeEvent event = data.event;
            final Session? session = data.session;
            debugPrint('[SyncEngine] Supabase Auth State Event: $event');
            switch (event) {
              case AuthChangeEvent.signedIn:
              case AuthChangeEvent.tokenRefreshed:
              case AuthChangeEvent.initialSession:
                if (session?.user != null) {
                  setActiveUserId(session!.user.id);
                  processPendingQueue();
                }
                break;
              case AuthChangeEvent.signedOut:
                setActiveUserId(null);
                break;
              case AuthChangeEvent.userUpdated:
              case AuthChangeEvent.mfaChallengeVerified:
              case AuthChangeEvent.passwordRecovery:
                break;
              default:
                break;
            }
          });
        }
      }
    } catch (_) {}
  }

  /// Validates the current Supabase session and proactively refreshes an expired access token.
  Future<bool> validateAndRefreshSession() async {
    try {
      if (!ForgeSupabase.instance.isInitialized) return true;
      final client = ForgeSupabase.instance.client;
      if (client == null) return false;

      final session = client.auth.currentSession;
      final user = client.auth.currentUser;

      if (session == null || user == null) {
        debugPrint('[SyncEngine] No active Supabase session.');
        return false;
      }

      if (session.isExpired) {
        debugPrint('[SyncEngine] JWT access token is expired. Invoking Supabase refreshSession()...');
        try {
          final res = await client.auth.refreshSession();
          if (res.session == null) {
            debugPrint('[SyncEngine] Refresh returned null session.');
            return false;
          }
          debugPrint('[SyncEngine] Supabase session refreshed successfully.');
        } catch (refreshError) {
          debugPrint('[SyncEngine] Failed to refresh Supabase session: $refreshError');
          return false;
        }
      }
      return true;
    } catch (e) {
      debugPrint('[SyncEngine] Error in validateAndRefreshSession: $e');
      return false;
    }
  }

  /// Refreshes pending count and current UI state from the local store and network status.
  Future<void> refreshStatus() async {
    final userId = _activeUserId;
    if (userId == null) {
      _updateStatus(const SyncStatusData(
        state: SyncState.synced,
        pendingCount: 0,
        failedMutationCount: 0,
        isAuthValid: false,
      ));
      return;
    }

    final queue = await _localStore.getQueue(userId);
    final count = queue.where((op) => op.status != SyncOperationStatus.synced).length;
    final failedCount = queue.where((op) => op.status == SyncOperationStatus.error).length;
    final isOnline = _connectivity.isOnline;

    SyncState newState;
    SyncFailureCategory? category;
    String? message;

    if (_isSyncing) {
      newState = SyncState.syncing;
      message = 'SYNCING CLOUD STATE...';
    } else if (!isOnline) {
      newState = SyncState.offline;
      category = SyncFailureCategory.networkUnavailable;
      message = count > 0 ? 'OFFLINE // $count QUEUED' : 'OFFLINE MODE';
    } else if (failedCount > 0) {
      newState = SyncState.syncError;
      category = SyncFailureCategory.queueError;
      message = 'SYNC FAILED // TAP TO RETRY';
    } else if (CloudHydrationService.instance.isPartialFailure) {
      newState = SyncState.partialFailure;
      category = SyncFailureCategory.hydrationError;
      message = 'SYNC PARTIAL // TAP TO REVIEW';
    } else if (count > 0) {
      newState = SyncState.pendingSync;
      message = '$count PENDING SYNC';
    } else {
      newState = SyncState.synced;
      message = 'ALL PROTOCOLS SYNCED';
    }

    _updateStatus(_statusData.copyWith(
      state: newState,
      pendingCount: count,
      failedMutationCount: failedCount,
      failureCategory: category,
      userFriendlyMessage: message,
      isOnline: isOnline,
      realtimeStatus: RealtimeSyncService.instance.status,
      hydrationStatus: CloudHydrationService.instance.status,
      isAuthValid: true,
    ));
  }

  /// Authoritative, comprehensive Sync Now action implementing the 11-step pipeline.
  Future<bool> syncNow() async {
    if (_isSyncing) {
      debugPrint('[SyncEngine] Sync already in progress. Skipping concurrent run.');
      return false;
    }

    final userId = _activeUserId;
    if (userId == null) {
      _updateStatus(_statusData.copyWith(
        state: SyncState.syncError,
        failureCategory: SyncFailureCategory.authRequired,
        userFriendlyMessage: 'Session expired. Sign in again.',
      ));
      return false;
    }

    // Step 1: Prevent concurrent sync & check offline
    if (!_connectivity.isOnline) {
      _updateStatus(_statusData.copyWith(
        state: SyncState.offline,
        isOnline: false,
        failureCategory: SyncFailureCategory.networkUnavailable,
        userFriendlyMessage: 'Offline. Changes will sync when connection returns.',
      ));
      return false;
    }

    _isSyncing = true;
    _updateStatus(_statusData.copyWith(
      state: SyncState.syncing,
      userFriendlyMessage: 'SYNCING CLOUD STATE...',
      lastError: null,
    ));

    try {
      // Step 2 & 4: Auth session validation & auto-refresh
      final authOk = await validateAndRefreshSession();
      if (!authOk) {
        _isSyncing = false;
        _updateStatus(_statusData.copyWith(
          state: SyncState.syncError,
          failureCategory: SyncFailureCategory.authRequired,
          userFriendlyMessage: 'Session expired. Sign in again.',
        ));
        return false;
      }

      // Step 5: Flush pending mutations with retry & safety
      final queueOk = await _flushQueue(userId, force: true);

      // Step 6: Reconcile cloud state (hydration into LocalStore)
      final hydrationOk = (ForgeSupabase.instance.isInitialized && _remoteHandler is! MockRemoteSyncHandler)
          ? await CloudHydrationService.instance.hydrate(userId, force: true)
          : true;

      // Step 7: Revalidate realtime subscription
      RealtimeSyncService.instance.setActiveUserId(userId);

      // Step 8-10: Notify repositories and refresh affected UI
      await RefreshCoordinator.instance.refreshAll();

      _isSyncing = false;
      final remainingQueue = await _localStore.getQueue(userId);
      final remainingCount = remainingQueue.where((op) => op.status != SyncOperationStatus.synced).length;
      final failedCount = remainingQueue.where((op) => op.status == SyncOperationStatus.error).length;

      SyncState finalState;
      SyncFailureCategory? finalCategory;
      String? finalMsg;

      if (!queueOk || failedCount > 0 || remainingCount > 0) {
        finalState = (failedCount > 0 || !queueOk) ? SyncState.syncError : SyncState.pendingSync;
        finalCategory = SyncFailureCategory.queueError;
        finalMsg = failedCount > 0
            ? 'SYNC FAILED // TAP TO RETRY'
            : 'Pending changes could not be uploaded. Retry.';
      } else if (!hydrationOk && CloudHydrationService.instance.status == HydrationStatus.partialFailure) {
        finalState = SyncState.partialFailure;
        finalCategory = SyncFailureCategory.hydrationError;
        finalMsg = 'SYNC PARTIAL // TAP TO REVIEW';
      } else if (!hydrationOk && CloudHydrationService.instance.status == HydrationStatus.error) {
        finalState = SyncState.syncError;
        finalCategory = SyncFailureCategory.hydrationError;
        finalMsg = 'Cloud data fetch incomplete. Tap to retry.';
      } else {
        finalState = SyncState.synced;
        finalMsg = 'ALL PROTOCOLS SYNCED';
      }

      _updateStatus(_statusData.copyWith(
        state: finalState,
        pendingCount: remainingCount,
        failedMutationCount: failedCount,
        failureCategory: finalCategory,
        userFriendlyMessage: finalMsg,
        lastSyncTime: DateTime.now(),
      ));

      return finalState == SyncState.synced;
    } catch (e) {
      _isSyncing = false;
      final failureCat = SyncFailure.classify(e);
      final sf = SyncFailure(
        category: failureCat,
        rawError: e.toString(),
        timestamp: DateTime.now(),
      );
      sf.logDiagnostics(
        operationType: 'syncNow',
        userId: userId,
        stage: 'global_catch',
      );

      _updateStatus(_statusData.copyWith(
        state: SyncState.syncError,
        failureCategory: failureCat,
        userFriendlyMessage: sf.userFriendlyMessage,
        lastError: e.toString(),
      ));
      return false;
    }
  }

  /// Process pending queue operations with backoff, ordering, and session validation.
  Future<bool> processPendingQueue({bool force = false}) async {
    if (_isSyncing) {
      debugPrint('[SyncEngine] Sync already in progress. Skipping concurrent run.');
      return false;
    }

    final userId = _activeUserId;
    if (userId == null) return false;

    if (!_connectivity.isOnline && !force) {
      await refreshStatus();
      return false;
    }

    _isSyncing = true;
    _updateStatus(_statusData.copyWith(
      state: SyncState.syncing,
      userFriendlyMessage: 'SYNCING CLOUD STATE...',
      lastError: null,
    ));

    try {
      final success = await _flushQueue(userId, force: force);
      _isSyncing = false;

      final remainingQueue = await _localStore.getQueue(userId);
      final remainingCount = remainingQueue.where((op) => op.status != SyncOperationStatus.synced).length;
      final failedCount = remainingQueue.where((op) => op.status == SyncOperationStatus.error).length;

      SyncState endState;
      SyncFailureCategory? endCat;
      String? endMsg;

      if (!_connectivity.isOnline) {
        endState = SyncState.offline;
        endCat = SyncFailureCategory.networkUnavailable;
        endMsg = remainingCount > 0 ? 'OFFLINE // $remainingCount QUEUED' : 'OFFLINE MODE';
      } else if (failedCount > 0) {
        endState = SyncState.syncError;
        endCat = SyncFailureCategory.queueError;
        endMsg = 'SYNC FAILED // TAP TO RETRY';
      } else if (remainingCount > 0) {
        endState = SyncState.pendingSync;
        endMsg = '$remainingCount PENDING SYNC';
      } else {
        endState = SyncState.synced;
        endMsg = 'ALL PROTOCOLS SYNCED';
      }

      _updateStatus(_statusData.copyWith(
        state: endState,
        pendingCount: remainingCount,
        failedMutationCount: failedCount,
        failureCategory: endCat,
        userFriendlyMessage: endMsg,
        lastSyncTime: DateTime.now(),
      ));

      return success;
    } catch (globalError) {
      _isSyncing = false;
      final cat = SyncFailure.classify(globalError);
      final sf = SyncFailure(
        category: cat,
        rawError: globalError.toString(),
        timestamp: DateTime.now(),
      );
      sf.logDiagnostics(
        operationType: 'processPendingQueue',
        userId: userId,
        stage: 'global_catch',
      );

      final remainingQueue = await _localStore.getQueue(userId);
      _updateStatus(_statusData.copyWith(
        state: SyncState.syncError,
        pendingCount: remainingQueue.length,
        failureCategory: cat,
        userFriendlyMessage: sf.userFriendlyMessage,
        lastError: globalError.toString(),
      ));
      return false;
    }
  }

  /// Internal queue flusher with dependency ordering, bounded backoff, and idempotent retry.
  Future<bool> _flushQueue(String userId, {bool force = false}) async {
    final queue = await _localStore.getQueue(userId);
    if (queue.isEmpty) {
      return true;
    }

    final sortedOps = _orderOperations(queue);
    int errorCount = 0;
    int uncompletedCount = 0;

    for (final op in sortedOps) {
      if (op.status == SyncOperationStatus.error && !force) {
        errorCount++;
        uncompletedCount++;
        continue;
      }

      final now = DateTime.now();
      if (!force && op.nextRetryAt != null && now.isBefore(op.nextRetryAt!)) {
        debugPrint('[SyncEngine] Skipping op ${op.id} until next retry at ${op.nextRetryAt}');
        uncompletedCount++;
        continue;
      }

      await _localStore.updateOperation(op.copyWith(status: SyncOperationStatus.syncing));

      try {
        RealtimeSyncService.instance.markLocalWrite(op.entityType, op.entityId);
        await _remoteHandler.executeOperation(op);

        // Success: reconcile local record dirty flag & remove from queue
        await _reconcileLocalRecord(op);
        await _localStore.removeOperation(op.userId, op.id);
      } catch (e) {
        uncompletedCount++;
        final errStr = e.toString();
        final failureCat = SyncFailure.classify(errStr);
        final sf = SyncFailure(
          category: failureCat,
          rawError: errStr,
          tableOrEntity: op.entityType,
          timestamp: DateTime.now(),
        );
        sf.logDiagnostics(
          operationType: op.operationType.toString(),
          userId: op.userId,
          stage: 'executeOperation',
          pendingCount: queue.length,
          retryAttempt: op.retryCount + 1,
        );

        // Auto-refresh token if error was jwt expired and retry immediately once
        if (failureCat == SyncFailureCategory.authExpired) {
          final refreshed = await validateAndRefreshSession();
          if (refreshed) {
            try {
              await _remoteHandler.executeOperation(op);
              await _reconcileLocalRecord(op);
              await _localStore.removeOperation(op.userId, op.id);
              uncompletedCount--;
              continue;
            } catch (_) {}
          }
        }

        final isPermanent = _isPermanentError(errStr);
        final nextRetryCount = op.retryCount + 1;

        if (isPermanent || nextRetryCount >= 5) {
          await _localStore.updateOperation(op.copyWith(
            status: SyncOperationStatus.error,
            lastError: errStr,
            retryCount: nextRetryCount,
          ));
          errorCount++;
        } else {
          // Bounded exponential backoff: 2^retryCount seconds (1s, 2s, 4s, 8s, 16s)
          final backoffSec = math.pow(2, nextRetryCount).toInt();
          final nextRetry = DateTime.now().add(Duration(seconds: backoffSec));

          await _localStore.updateOperation(op.copyWith(
            status: SyncOperationStatus.pending,
            lastError: errStr,
            retryCount: nextRetryCount,
            nextRetryAt: nextRetry,
          ));
        }
      }
    }

    return errorCount == 0 && uncompletedCount == 0;
  }

  /// Dependency ordering ensures parent entities sync before children:
  /// 1. workout_plan
  /// 2. workout_session
  /// 3. gym_photo
  /// 4. workout_set & personal_record
  /// 5. mistakes
  /// 6. study_task & study_session
  /// 7. dsa_progress & dev_progress
  /// 8. internships & placement_hub_data
  List<SyncOperation> _orderOperations(List<SyncOperation> ops) {
    final list = List<SyncOperation>.from(ops);
    int priority(String type) {
      switch (type) {
        case 'workout_plan':
          return 1;
        case 'workout_session':
          return 2;
        case 'gym_photo':
          return 3;
        case 'workout_set':
          return 4;
        case 'personal_record':
          return 5;
        case 'mistake':
          return 6;
        case 'study_task':
          return 7;
        case 'study_session':
          return 8;
        case 'dsa_progress':
          return 9;
        case 'development_progress':
          return 10;
        case 'internship':
          return 11;
        case 'placement_hub_data':
        case 'test_attempt':
          return 12;
        default:
          return 99;
      }
    }

    list.sort((a, b) {
      final pA = priority(a.entityType);
      final pB = priority(b.entityType);
      if (pA != pB) return pA.compareTo(pB);
      return a.createdAt.compareTo(b.createdAt);
    });

    return list;
  }

  /// Determines if an error is truly unrecoverable (schema violation) vs transient.
  /// NOTE: JWT expiration is NEVER treated as permanent because it is automatically refreshed.
  bool _isPermanentError(String error) {
    final lower = error.toLowerCase();
    if (lower.contains('jwt expired') || lower.contains('token expired')) {
      return false; // Handled by session refresh
    }
    return lower.contains('400') ||
        lower.contains('bad request') ||
        lower.contains('schema violation') ||
        lower.contains('column') ||
        lower.contains('row-level security');
  }

  /// Reconciles local record by clearing its dirty flag.
  Future<void> _reconcileLocalRecord(SyncOperation op) async {
    try {
      final record = await _localStore.getRecord(
        userId: op.userId,
        entityType: op.entityType,
        entityId: op.entityId,
      );
      if (record != null) {
        await _localStore.saveRecord(
          userId: op.userId,
          entityType: op.entityType,
          entityId: op.entityId,
          data: record,
          isDirty: false,
        );
      }
    } catch (_) {}
  }

  bool _isDisposed = false;

  void _updateStatus(SyncStatusData data) {
    if (_isDisposed) return;
    _statusData = data;
    notifyListeners();
  }

  @override
  void dispose() {
    _isDisposed = true;
    _networkSubscription?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }
}
