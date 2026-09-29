import 'dart:convert';

/// Types of offline synchronization operations.
enum SyncOperationType {
  create,
  update,
  delete,
}

/// Lifecycle statuses of a queued synchronization operation.
enum SyncOperationStatus {
  pending,
  syncing,
  synced,
  error,
}

/// Represents an atomic, idempotent synchronization operation stored locally.
class SyncOperation {
  final String id;
  final String userId;
  final String entityType;
  final String entityId;
  final SyncOperationType operationType;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int retryCount;
  final SyncOperationStatus status;
  final String? lastError;
  final DateTime? nextRetryAt;
  final Map<String, dynamic>? extraMetadata;

  const SyncOperation({
    required this.id,
    required this.userId,
    required this.entityType,
    required this.entityId,
    required this.operationType,
    required this.payload,
    required this.createdAt,
    required this.updatedAt,
    this.retryCount = 0,
    this.status = SyncOperationStatus.pending,
    this.lastError,
    this.nextRetryAt,
    this.extraMetadata,
  });

  /// Factory constructor to create a fresh pending operation
  factory SyncOperation.createPending({
    required String id,
    required String userId,
    required String entityType,
    required String entityId,
    required SyncOperationType operationType,
    required Map<String, dynamic> payload,
    Map<String, dynamic>? extraMetadata,
  }) {
    final now = DateTime.now().toUtc();
    return SyncOperation(
      id: id,
      userId: userId,
      entityType: entityType,
      entityId: entityId,
      operationType: operationType,
      payload: Map<String, dynamic>.from(payload),
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      status: SyncOperationStatus.pending,
      extraMetadata: extraMetadata != null ? Map<String, dynamic>.from(extraMetadata) : null,
    );
  }

  SyncOperation copyWith({
    String? id,
    String? userId,
    String? entityType,
    String? entityId,
    SyncOperationType? operationType,
    Map<String, dynamic>? payload,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? retryCount,
    SyncOperationStatus? status,
    String? lastError,
    DateTime? nextRetryAt,
    Map<String, dynamic>? extraMetadata,
  }) {
    return SyncOperation(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operationType: operationType ?? this.operationType,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      retryCount: retryCount ?? this.retryCount,
      status: status ?? this.status,
      lastError: lastError ?? this.lastError,
      nextRetryAt: nextRetryAt ?? this.nextRetryAt,
      extraMetadata: extraMetadata ?? this.extraMetadata,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'entityType': entityType,
      'entityId': entityId,
      'operationType': operationType.name,
      'payload': payload,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'retryCount': retryCount,
      'status': status.name,
      'lastError': lastError,
      'nextRetryAt': nextRetryAt?.toIso8601String(),
      'extraMetadata': extraMetadata,
    };
  }

  factory SyncOperation.fromMap(Map<String, dynamic> map) {
    return SyncOperation(
      id: map['id'] as String,
      userId: map['userId'] as String,
      entityType: map['entityType'] as String,
      entityId: map['entityId'] as String,
      operationType: SyncOperationType.values.firstWhere(
        (e) => e.name == map['operationType'],
        orElse: () => SyncOperationType.update,
      ),
      payload: Map<String, dynamic>.from(map['payload'] as Map? ?? {}),
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
      retryCount: (map['retryCount'] as num?)?.toInt() ?? 0,
      status: SyncOperationStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => SyncOperationStatus.pending,
      ),
      lastError: map['lastError'] as String?,
      nextRetryAt: map['nextRetryAt'] != null
          ? DateTime.parse(map['nextRetryAt'] as String)
          : null,
      extraMetadata: map['extraMetadata'] != null
          ? Map<String, dynamic>.from(map['extraMetadata'] as Map)
          : null,
    );
  }

  String toJson() => jsonEncode(toMap());

  factory SyncOperation.fromJson(String source) =>
      SyncOperation.fromMap(jsonDecode(source) as Map<String, dynamic>);
}
