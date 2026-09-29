import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../conflict/conflict_resolver.dart';
import '../network/connectivity_service.dart';
import '../storage/local_store.dart';
import 'package:forge_app/core/supabase/supabase_client.dart';

/// Connection states for the Supabase Realtime WebSocket channel.
enum RealtimeStatus {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error,
}

/// Structured representation of an inbound Realtime Postgres change event.
class RealtimeSyncEvent {
  final String entityType;
  final String entityId;
  final String eventType; // 'INSERT', 'UPDATE', 'DELETE'
  final Map<String, dynamic> record;
  final Map<String, dynamic>? oldRecord;
  final DateTime timestamp;

  const RealtimeSyncEvent({
    required this.entityType,
    required this.entityId,
    required this.eventType,
    required this.record,
    this.oldRecord,
    required this.timestamp,
  });

  @override
  String toString() =>
      'RealtimeSyncEvent($eventType $entityType:$entityId at $timestamp)';
}

/// Abstract contract for Supabase Realtime channel subscription to enable hermetic testing.
abstract class RealtimeChannelAdapter {
  Future<void> subscribe({required void Function(RealtimeStatus status) onStatusChange});
  Future<void> unsubscribe();
}

/// Production implementation backed by Supabase RealtimeChannel.
class SupabaseRealtimeChannelAdapter implements RealtimeChannelAdapter {
  final RealtimeChannel _channel;

  SupabaseRealtimeChannelAdapter(this._channel);

  @override
  Future<void> subscribe({required void Function(RealtimeStatus status) onStatusChange}) async {
    _channel.subscribe((status, [error]) {
      switch (status) {
        case RealtimeSubscribeStatus.subscribed:
          onStatusChange(RealtimeStatus.connected);
          break;
        case RealtimeSubscribeStatus.closed:
          onStatusChange(RealtimeStatus.disconnected);
          break;
        case RealtimeSubscribeStatus.timedOut:
          onStatusChange(RealtimeStatus.reconnecting);
          break;
        case RealtimeSubscribeStatus.channelError:
          onStatusChange(RealtimeStatus.error);
          break;
      }
    });
  }

  @override
  Future<void> unsubscribe() async {
    await _channel.unsubscribe();
  }
}

/// Centralized Realtime Synchronization Service for FORGE Mobile (Phase 6).
///
/// Responsibilities:
/// 1. Establishes user-scoped Postgres change subscriptions via Supabase Realtime.
/// 2. Performs strict echo suppression to eliminate infinite sync loops.
/// 3. Applies Phase 5I ConflictResolver to inbound remote events before writing to LocalStore.
/// 4. Performs targeted delta watermark reconciliation upon reconnect.
/// 5. Dispatches reactive notification streams for seamless UI updating without reload.
class RealtimeSyncService extends ChangeNotifier {
  static RealtimeSyncService? _instance;

  static RealtimeSyncService get instance {
    _instance ??= RealtimeSyncService();
    return _instance!;
  }

  static set instance(RealtimeSyncService service) {
    _instance = service;
  }

  final LocalStore _localStore;
  final ConnectivityService _connectivity;
  final SupabaseClient? _clientOverride;

  String? _activeUserId;
  RealtimeStatus _status = RealtimeStatus.disconnected;
  RealtimeChannelAdapter? _channelAdapter;
  StreamSubscription<NetworkStatus>? _networkSubscription;

  // Echo suppression: LRU tracking signatures written locally within the echo window.
  final Map<String, DateTime> _recentLocalWrites = {};
  static const Duration echoWindow = Duration(seconds: 20);

  // Reconnect watermark safety window (Hardening correction 1):
  // Query records updated_at >= lastReconciledAt - safetyWindow.
  DateTime? _lastReconciledAt;
  static const Duration watermarkSafetyWindow = Duration(seconds: 30);

  // Inbound remote change broadcast stream
  final StreamController<RealtimeSyncEvent> _remoteChangeController =
      StreamController<RealtimeSyncEvent>.broadcast();

  bool _isDisposed = false;
  bool _isReconcilingDelta = false;

  RealtimeSyncService({
    LocalStore? localStore,
    ConnectivityService? connectivity,
    SupabaseClient? client,
  })  : _localStore = localStore ?? LocalStore.instance,
        _connectivity = connectivity ?? ConnectivityService.instance,
        _clientOverride = client {
    _initNetworkListener();
  }

  SupabaseClient? get _client => _clientOverride ?? ForgeSupabase.instance.client;

  RealtimeStatus get status => _status;
  bool get isConnected => _status == RealtimeStatus.connected;
  String? get activeUserId => _activeUserId;
  DateTime? get lastReconciledAt => _lastReconciledAt;
  Stream<RealtimeSyncEvent> get onRemoteChange => _remoteChangeController.stream;

  /// Sets the active authenticated user and initiates/rebinds subscriptions.
  void setActiveUserId(String? userId) {
    if (_activeUserId == userId) return;

    // Disconnect old user channel if any
    unsubscribeUserChannel();

    _activeUserId = userId;
    _recentLocalWrites.clear();
    _lastReconciledAt = null;

    if (userId != null && userId.isNotEmpty) {
      if (_connectivity.isOnline) {
        subscribeUserChannel(userId);
      }
    }
  }

  void _initNetworkListener() {
    _networkSubscription = _connectivity.onStatusChange.listen((netStatus) {
      if (netStatus == NetworkStatus.online) {
        final uid = _activeUserId;
        if (uid != null && uid.isNotEmpty) {
          if (_status == RealtimeStatus.disconnected || _status == RealtimeStatus.error) {
            _updateStatus(RealtimeStatus.reconnecting);
            subscribeUserChannel(uid);
          }
          // Reconnect delta reconciliation (Hardening corrections 1 & 2)
          reconcileMissedEvents(uid);
        }
      } else {
        _updateStatus(RealtimeStatus.disconnected);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Echo Suppression
  // ---------------------------------------------------------------------------

  /// Registers a locally initiated write to suppress remote echo loops.
  void markLocalWrite(String entityType, String entityId) {
    final key = '$entityType:$entityId';
    _recentLocalWrites[key] = DateTime.now();
    _cleanOldEchoSignatures();
  }

  /// Determines whether an inbound remote event was triggered by our own write.
  bool isEcho(String entityType, String entityId) {
    _cleanOldEchoSignatures();
    final key = '$entityType:$entityId';
    final writeTime = _recentLocalWrites[key];
    if (writeTime == null) return false;

    // Within active echo window
    return DateTime.now().difference(writeTime) <= echoWindow;
  }

  void _cleanOldEchoSignatures() {
    final now = DateTime.now();
    _recentLocalWrites.removeWhere((_, time) => now.difference(time) > echoWindow);
  }

  // ---------------------------------------------------------------------------
  // Subscriptions & Realtime Channel
  // ---------------------------------------------------------------------------

  /// Subscribes to user-scoped Postgres change events for all synchronized entities.
  Future<void> subscribeUserChannel(String userId, {RealtimeChannelAdapter? adapterOverride}) async {
    if (_isDisposed) return;
    _updateStatus(RealtimeStatus.connecting);

    if (adapterOverride != null) {
      _channelAdapter = adapterOverride;
    }

    if (_channelAdapter != null) {
      await _channelAdapter!.subscribe(onStatusChange: (s) {
        _updateStatus(s);
        if (s == RealtimeStatus.connected) {
          reconcileMissedEvents(userId);
        }
      });
      return;
    }

    final client = _client;
    if (client == null) {
      _updateStatus(RealtimeStatus.disconnected);
      return;
    }

    try {
      final channelName = 'forge_sync_$userId';
      final channel = client.channel(channelName);

      // Subscribe to all 10 collaborative entities with RLS and user_id filter
      final entities = [
        'study_tasks',
        'study_sessions',
        'dsa_progress',
        'development_progress',
        'mistakes',
        'workout_sessions',
        'workout_sets',
        'personal_records',
        'internships',
        'placement_hub_data',
      ];

      for (final table in entities) {
        channel.onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: table,
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => handleInboundPostgresChange(table, payload),
        );
      }

      final adapter = SupabaseRealtimeChannelAdapter(channel);
      _channelAdapter = adapter;
      await adapter.subscribe(onStatusChange: (s) {
        _updateStatus(s);
        if (s == RealtimeStatus.connected) {
          reconcileMissedEvents(userId);
        }
      });
    } catch (e) {
      debugPrint('[RealtimeSyncService] Subscription error: $e');
      _updateStatus(RealtimeStatus.error);
    }
  }

  /// Unsubscribes from the active Realtime channel.
  Future<void> unsubscribeUserChannel() async {
    final adapter = _channelAdapter;
    _channelAdapter = null;
    if (adapter != null) {
      try {
        await adapter.unsubscribe();
      } catch (_) {}
    }
    _updateStatus(RealtimeStatus.disconnected);
  }

  // ---------------------------------------------------------------------------
  // Inbound Remote Event Handling
  // ---------------------------------------------------------------------------

  /// Dispatches an inbound Postgres change payload through echo suppression,
  /// ConflictResolver, LocalStore reconciliation, and UI notification.
  Future<void> handleInboundPostgresChange(
    String table,
    PostgresChangePayload payload,
  ) async {
    if (_isDisposed) return;
    final userId = _activeUserId;
    if (userId == null) return;

    final eventType = payload.eventType.name.toUpperCase(); // 'INSERT', 'UPDATE', 'DELETE'
    final record = payload.newRecord;
    final oldRecord = payload.oldRecord;

    await processInboundEvent(
      userId: userId,
      table: table,
      eventType: eventType,
      record: record,
      oldRecord: oldRecord,
    );
  }

  /// Hermetic event processing method (used in production and unit tests).
  Future<void> processInboundEvent({
    required String userId,
    required String table,
    required String eventType,
    required Map<String, dynamic> record,
    Map<String, dynamic>? oldRecord,
  }) async {
    final entityType = _mapTableToEntityType(table);
    final entityId = _extractEntityId(table, record, oldRecord);

    if (entityId.isEmpty) return;

    // 1. Echo Suppression Check:
    // If this change originated from our own write within the echo window, suppress redundant sync.
    if (isEcho(entityType, entityId)) {
      debugPrint('[RealtimeSyncService] Echo suppressed for $entityType:$entityId');
      return;
    }

    // 2. Conflict Resolution & Local Reconciliation
    if (eventType == 'DELETE') {
      final existingLocal = await _localStore.getRecord(
        userId: userId,
        entityType: entityType,
        entityId: entityId,
      );

      // If local is marked dirty by user offline, preserve it
      if (existingLocal == null || existingLocal['_dirty'] != true) {
        await _localStore.deleteRecord(
          userId: userId,
          entityType: entityType,
          entityId: entityId,
        );
      }
    } else {
      // INSERT or UPDATE
      final existingLocal = await _localStore.getRecord(
        userId: userId,
        entityType: entityType,
        entityId: entityId,
      ) ?? <String, dynamic>{};

      // Apply Phase 5I ConflictResolver
      final resolvedData = ConflictResolver.resolve(
        entityType: entityType,
        localData: existingLocal,
        remoteData: record,
      );

      // Save into LocalStore with isDirty = false (inbound remote changes are never dirty)
      await _localStore.saveRecord(
        userId: userId,
        entityType: entityType,
        entityId: entityId,
        data: resolvedData,
        isDirty: existingLocal['_dirty'] == true,
      );
    }

    // 3. Dispatch Reactive Remote Change Notification
    final event = RealtimeSyncEvent(
      entityType: entityType,
      entityId: entityId,
      eventType: eventType,
      record: record,
      oldRecord: oldRecord,
      timestamp: DateTime.now(),
    );

    if (!_remoteChangeController.isClosed) {
      _remoteChangeController.add(event);
    }
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Reconnect Watermark Reconciliation (Hardening Corrections 1 & 2)
  // ---------------------------------------------------------------------------

  /// Performs efficient, targeted delta reconciliation using watermark safety window.
  Future<void> reconcileMissedEvents(String userId) async {
    if (_isReconcilingDelta || _isDisposed) return;
    _isReconcilingDelta = true;

    try {
      final client = _client;
      if (client == null) {
        _lastReconciledAt = DateTime.now().toUtc();
        _isReconcilingDelta = false;
        return;
      }

      // Hardening Correction 1: Overlap safety window
      final watermark = _lastReconciledAt != null
          ? _lastReconciledAt!.subtract(watermarkSafetyWindow)
          : DateTime.now().subtract(const Duration(days: 7)); // Initial boot or fresh connection

      final watermarkIso = watermark.toUtc().toIso8601String();

      // Hardening Correction 2: Targeted delta queries (only subscribed entities, with updated_at filter)
      final tablesToReconcile = [
        'study_tasks',
        'dsa_progress',
        'development_progress',
        'mistakes',
        'workout_sessions',
        'personal_records',
        'internships',
        'placement_hub_data',
      ];

      for (final table in tablesToReconcile) {
        try {
          final res = await client
              .from(table)
              .select('*')
              .eq('user_id', userId)
              .gte('updated_at', watermarkIso);

          final rows = (res as List<dynamic>?) ?? [];
          for (final row in rows) {
            final rowMap = row as Map<String, dynamic>;
            final entityType = _mapTableToEntityType(table);
            final entityId = _extractEntityId(table, rowMap, null);

            if (entityId.isEmpty) continue;

            final existingLocal = await _localStore.getRecord(
              userId: userId,
              entityType: entityType,
              entityId: entityId,
            ) ?? <String, dynamic>{};

            final resolved = ConflictResolver.resolve(
              entityType: entityType,
              localData: existingLocal,
              remoteData: rowMap,
            );

            await _localStore.saveRecord(
              userId: userId,
              entityType: entityType,
              entityId: entityId,
              data: resolved,
              isDirty: existingLocal['_dirty'] == true,
            );
          }
        } catch (e) {
          debugPrint('[RealtimeSyncService] Delta reconciliation error for $table: $e');
        }
      }

      _lastReconciledAt = DateTime.now().toUtc();
    } finally {
      _isReconcilingDelta = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Mappings
  // ---------------------------------------------------------------------------

  String _mapTableToEntityType(String table) {
    switch (table) {
      case 'study_tasks':
        return 'study_task';
      case 'study_sessions':
        return 'study_session';
      case 'dsa_progress':
        return 'dsa_progress';
      case 'development_progress':
        return 'development_progress';
      case 'mistakes':
        return 'mistake';
      case 'workout_plans':
        return 'workout_plan';
      case 'workout_sessions':
        return 'workout_session';
      case 'workout_sets':
        return 'workout_set';
      case 'personal_records':
        return 'personal_record';
      case 'internships':
        return 'internship';
      case 'placement_hub_data':
        return 'placement_hub_data';
      default:
        return table;
    }
  }

  String _extractEntityId(String table, Map<String, dynamic> record, Map<String, dynamic>? oldRecord) {
    final r = record.isNotEmpty ? record : (oldRecord ?? {});
    switch (table) {
      case 'study_tasks':
        return (r['task_id'] ?? r['id'] ?? '').toString();
      case 'dsa_progress':
        return (r['problem_id'] ?? r['id'] ?? '').toString();
      case 'development_progress':
        final cat = r['category'] ?? '';
        final itemId = r['item_id'] ?? '';
        return cat.isNotEmpty && itemId.isNotEmpty ? '${cat}__$itemId' : (r['id'] ?? '').toString();
      case 'personal_records':
        return (r['exercise_id'] ?? r['id'] ?? '').toString();
      case 'placement_hub_data':
        return 'target';
      default:
        return (r['id'] ?? '').toString();
    }
  }

  void _updateStatus(RealtimeStatus newStatus) {
    if (_isDisposed) return;
    if (_status != newStatus) {
      _status = newStatus;
      notifyListeners();
    }
  }

  /// Sets status directly for test environments.
  void setStatusForTesting(RealtimeStatus status) {
    _updateStatus(status);
  }

  /// Sets lastReconciledAt directly for test environments.
  void setLastReconciledAtForTesting(DateTime time) {
    _lastReconciledAt = time;
  }

  @override
  void dispose() {
    _isDisposed = true;
    _networkSubscription?.cancel();
    _remoteChangeController.close();
    super.dispose();
  }
}
