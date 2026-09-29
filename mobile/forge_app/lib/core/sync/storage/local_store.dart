import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/sync_operation.dart';

/// Contract for the account-scoped local offline storage engine.
abstract class LocalStore {
  static LocalStore? _instance;

  /// Global instance of [LocalStore]. Defaults to [PreferencesLocalStore] (or [MemoryLocalStore] in test).
  static LocalStore get instance {
    if (_instance == null) {
      if (Platform.environment.containsKey('FLUTTER_TEST')) {
        _instance = MemoryLocalStore();
      } else {
        _instance = PreferencesLocalStore();
      }
    }
    return _instance!;
  }

  static set instance(LocalStore store) {
    _instance = store;
  }

  /// Saves a single entity record locally for a specific user.
  Future<void> saveRecord({
    required String userId,
    required String entityType,
    required String entityId,
    required Map<String, dynamic> data,
    bool isDirty = false,
  });

  /// Saves multiple entity records in a single batch.
  Future<void> saveRecords({
    required String userId,
    required String entityType,
    required Map<String, Map<String, dynamic>> records,
  });

  /// Retrieves a single entity record.
  Future<Map<String, dynamic>?> getRecord({
    required String userId,
    required String entityType,
    required String entityId,
  });

  /// Retrieves all records of a specific entity type for a user.
  Future<List<Map<String, dynamic>>> getRecords({
    required String userId,
    required String entityType,
  });

  /// Deletes a specific entity record.
  Future<void> deleteRecord({
    required String userId,
    required String entityType,
    required String entityId,
  });

  /// Clears all records of a specific entity type for a user.
  Future<void> clearEntity({
    required String userId,
    required String entityType,
  });

  /// Clears all data associated with a specific user account.
  Future<void> clearUserStore(String userId);

  // --- SYNC QUEUE OPERATIONS ---

  /// Retrieves the ordered list of pending sync operations for a user.
  Future<List<SyncOperation>> getQueue(String userId);

  /// Appends an operation to the persistent sync queue.
  Future<void> enqueue(SyncOperation op);

  /// Updates an existing operation in the queue (e.g. status, retry count).
  Future<void> updateOperation(SyncOperation op);

  /// Removes an operation from the queue upon successful completion.
  Future<void> removeOperation(String userId, String opId);

  /// Clears the entire sync queue for a user.
  Future<void> clearQueue(String userId);

  // --- IN-PROGRESS TEST RECOVERY ---

  /// Persists in-progress test session state for offline crash recovery.
  Future<void> saveActiveTestSession(String userId, Map<String, dynamic> sessionData);

  /// Retrieves any active test session state.
  Future<Map<String, dynamic>?> getActiveTestSession(String userId);

  /// Clears active test session state upon submission or discard.
  Future<void> clearActiveTestSession(String userId);
}

/// Production implementation of [LocalStore] backed by [SharedPreferences].
class PreferencesLocalStore implements LocalStore {
  SharedPreferences? _prefs;

  Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  String _entityKey(String userId, String entityType) =>
      'forge_user_${userId}_entity_$entityType';

  String _queueKey(String userId) =>
      'forge_user_${userId}_sync_queue';

  String _activeTestKey(String userId) =>
      'forge_user_${userId}_active_test';

  @override
  Future<void> saveRecord({
    required String userId,
    required String entityType,
    required String entityId,
    required Map<String, dynamic> data,
    bool isDirty = false,
  }) async {
    final prefs = await _getPrefs();
    final key = _entityKey(userId, entityType);
    final raw = prefs.getString(key);
    Map<String, dynamic> map = {};
    if (raw != null) {
      try {
        map = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      } catch (_) {}
    }

    final record = Map<String, dynamic>.from(data);
    record['_dirty'] = isDirty;
    record['_localUpdatedAt'] = DateTime.now().toUtc().toIso8601String();
    map[entityId] = record;

    await prefs.setString(key, jsonEncode(map));
  }

  @override
  Future<void> saveRecords({
    required String userId,
    required String entityType,
    required Map<String, Map<String, dynamic>> records,
  }) async {
    final prefs = await _getPrefs();
    final key = _entityKey(userId, entityType);
    final raw = prefs.getString(key);
    Map<String, dynamic> map = {};
    if (raw != null) {
      try {
        map = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      } catch (_) {}
    }

    final nowStr = DateTime.now().toUtc().toIso8601String();
    for (final entry in records.entries) {
      final rec = Map<String, dynamic>.from(entry.value);
      rec['_dirty'] = rec['_dirty'] ?? false;
      rec['_localUpdatedAt'] ??= nowStr;
      map[entry.key] = rec;
    }

    await prefs.setString(key, jsonEncode(map));
  }

  @override
  Future<Map<String, dynamic>?> getRecord({
    required String userId,
    required String entityType,
    required String entityId,
  }) async {
    final prefs = await _getPrefs();
    final key = _entityKey(userId, entityType);
    final raw = prefs.getString(key);
    if (raw == null) return null;
    try {
      final map = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      final rec = map[entityId];
      if (rec != null) {
        return Map<String, dynamic>.from(rec as Map);
      }
    } catch (_) {}
    return null;
  }

  @override
  Future<List<Map<String, dynamic>>> getRecords({
    required String userId,
    required String entityType,
  }) async {
    final prefs = await _getPrefs();
    final key = _entityKey(userId, entityType);
    final raw = prefs.getString(key);
    if (raw == null) return [];
    try {
      final map = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      return map.values.map((v) => Map<String, dynamic>.from(v as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<void> deleteRecord({
    required String userId,
    required String entityType,
    required String entityId,
  }) async {
    final prefs = await _getPrefs();
    final key = _entityKey(userId, entityType);
    final raw = prefs.getString(key);
    if (raw == null) return;
    try {
      final map = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      map.remove(entityId);
      await prefs.setString(key, jsonEncode(map));
    } catch (_) {}
  }

  @override
  Future<void> clearEntity({
    required String userId,
    required String entityType,
  }) async {
    final prefs = await _getPrefs();
    await prefs.remove(_entityKey(userId, entityType));
  }

  @override
  Future<void> clearUserStore(String userId) async {
    final prefs = await _getPrefs();
    final prefix = 'forge_user_${userId}_';
    final keys = prefs.getKeys().where((k) => k.startsWith(prefix)).toList();
    for (final k in keys) {
      await prefs.remove(k);
    }
  }

  @override
  Future<List<SyncOperation>> getQueue(String userId) async {
    final prefs = await _getPrefs();
    final key = _queueKey(userId);
    final rawList = prefs.getStringList(key);
    if (rawList == null || rawList.isEmpty) return [];

    final List<SyncOperation> ops = [];
    for (final str in rawList) {
      try {
        ops.add(SyncOperation.fromJson(str));
      } catch (e) {
        debugPrint('[PreferencesLocalStore] Corrupted queue item dropped: $e');
      }
    }
    return ops;
  }

  @override
  Future<void> enqueue(SyncOperation op) async {
    final prefs = await _getPrefs();
    final key = _queueKey(op.userId);
    final list = prefs.getStringList(key) ?? [];
    
    // Idempotency: check if an identical operation is already pending
    final existingIndex = list.indexWhere((itemStr) {
      try {
        final parsed = jsonDecode(itemStr) as Map<String, dynamic>;
        return parsed['id'] == op.id ||
            (parsed['entityType'] == op.entityType &&
             parsed['entityId'] == op.entityId &&
             parsed['operationType'] == op.operationType.name);
      } catch (_) {
        return false;
      }
    });

    if (existingIndex != -1) {
      list[existingIndex] = op.toJson();
    } else {
      list.add(op.toJson());
    }

    await prefs.setStringList(key, list);
  }

  @override
  Future<void> updateOperation(SyncOperation op) async {
    final prefs = await _getPrefs();
    final key = _queueKey(op.userId);
    final list = prefs.getStringList(key) ?? [];

    final idx = list.indexWhere((itemStr) {
      try {
        final parsed = jsonDecode(itemStr) as Map<String, dynamic>;
        return parsed['id'] == op.id;
      } catch (_) {
        return false;
      }
    });

    if (idx != -1) {
      list[idx] = op.toJson();
      await prefs.setStringList(key, list);
    }
  }

  @override
  Future<void> removeOperation(String userId, String opId) async {
    final prefs = await _getPrefs();
    final key = _queueKey(userId);
    final list = prefs.getStringList(key);
    if (list == null) return;

    list.removeWhere((itemStr) {
      try {
        final parsed = jsonDecode(itemStr) as Map<String, dynamic>;
        return parsed['id'] == opId;
      } catch (_) {
        return false;
      }
    });

    await prefs.setStringList(key, list);
  }

  @override
  Future<void> clearQueue(String userId) async {
    final prefs = await _getPrefs();
    await prefs.remove(_queueKey(userId));
  }

  @override
  Future<void> saveActiveTestSession(String userId, Map<String, dynamic> sessionData) async {
    final prefs = await _getPrefs();
    await prefs.setString(_activeTestKey(userId), jsonEncode(sessionData));
  }

  @override
  Future<Map<String, dynamic>?> getActiveTestSession(String userId) async {
    final prefs = await _getPrefs();
    final raw = prefs.getString(_activeTestKey(userId));
    if (raw == null) return null;
    try {
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> clearActiveTestSession(String userId) async {
    final prefs = await _getPrefs();
    await prefs.remove(_activeTestKey(userId));
  }
}

/// Pure in-memory implementation of [LocalStore] for hermetic, ultra-fast testing.
class MemoryLocalStore implements LocalStore {
  // Map of userId -> Map of entityType -> Map of entityId -> record
  final Map<String, Map<String, Map<String, dynamic>>> _data = {};
  // Map of userId -> List of SyncOperation
  final Map<String, List<SyncOperation>> _queues = {};
  // Map of userId -> active test session map
  final Map<String, Map<String, dynamic>> _activeTests = {};

  void reset() {
    _data.clear();
    _queues.clear();
    _activeTests.clear();
  }

  @override
  Future<void> saveRecord({
    required String userId,
    required String entityType,
    required String entityId,
    required Map<String, dynamic> data,
    bool isDirty = false,
  }) async {
    final userMap = _data.putIfAbsent(userId, () => {});
    final entityMap = userMap.putIfAbsent(entityType, () => {});
    final rec = Map<String, dynamic>.from(data);
    rec['_dirty'] = isDirty;
    rec['_localUpdatedAt'] = DateTime.now().toUtc().toIso8601String();
    entityMap[entityId] = rec;
  }

  @override
  Future<void> saveRecords({
    required String userId,
    required String entityType,
    required Map<String, Map<String, dynamic>> records,
  }) async {
    final userMap = _data.putIfAbsent(userId, () => {});
    final entityMap = userMap.putIfAbsent(entityType, () => {});
    final nowStr = DateTime.now().toUtc().toIso8601String();
    for (final entry in records.entries) {
      final rec = Map<String, dynamic>.from(entry.value);
      rec['_dirty'] = rec['_dirty'] ?? false;
      rec['_localUpdatedAt'] ??= nowStr;
      entityMap[entry.key] = rec;
    }
  }

  @override
  Future<Map<String, dynamic>?> getRecord({
    required String userId,
    required String entityType,
    required String entityId,
  }) async {
    final rec = _data[userId]?[entityType]?[entityId];
    if (rec == null) return null;
    return Map<String, dynamic>.from(rec);
  }

  @override
  Future<List<Map<String, dynamic>>> getRecords({
    required String userId,
    required String entityType,
  }) async {
    final entityMap = _data[userId]?[entityType];
    if (entityMap == null) return [];
    return entityMap.values.map((v) => Map<String, dynamic>.from(v)).toList();
  }

  @override
  Future<void> deleteRecord({
    required String userId,
    required String entityType,
    required String entityId,
  }) async {
    _data[userId]?[entityType]?.remove(entityId);
  }

  @override
  Future<void> clearEntity({
    required String userId,
    required String entityType,
  }) async {
    _data[userId]?.remove(entityType);
  }

  @override
  Future<void> clearUserStore(String userId) async {
    _data.remove(userId);
    _queues.remove(userId);
    _activeTests.remove(userId);
  }

  @override
  Future<List<SyncOperation>> getQueue(String userId) async {
    final list = _queues[userId];
    if (list == null) return [];
    return List<SyncOperation>.from(list);
  }

  @override
  Future<void> enqueue(SyncOperation op) async {
    final list = _queues.putIfAbsent(op.userId, () => []);
    final idx = list.indexWhere((o) =>
        o.id == op.id ||
        (o.entityType == op.entityType &&
            o.entityId == op.entityId &&
            o.operationType == op.operationType));
    if (idx != -1) {
      list[idx] = op;
    } else {
      list.add(op);
    }
  }

  @override
  Future<void> updateOperation(SyncOperation op) async {
    final list = _queues[op.userId];
    if (list == null) return;
    final idx = list.indexWhere((o) => o.id == op.id);
    if (idx != -1) {
      list[idx] = op;
    }
  }

  @override
  Future<void> removeOperation(String userId, String opId) async {
    _queues[userId]?.removeWhere((o) => o.id == opId);
  }

  @override
  Future<void> clearQueue(String userId) async {
    _queues.remove(userId);
  }

  @override
  Future<void> saveActiveTestSession(String userId, Map<String, dynamic> sessionData) async {
    _activeTests[userId] = Map<String, dynamic>.from(sessionData);
  }

  @override
  Future<Map<String, dynamic>?> getActiveTestSession(String userId) async {
    final m = _activeTests[userId];
    if (m == null) return null;
    return Map<String, dynamic>.from(m);
  }

  @override
  Future<void> clearActiveTestSession(String userId) async {
    _activeTests.remove(userId);
  }
}
