/// Domain representation of a task in `public.study_tasks`.
class StudyTask {
  final String id;
  final String userId;
  final String date; // 'YYYY-MM-DD'
  final String taskId;
  final String title;
  final String category;
  final String? startTime;
  final String? endTime;
  final String status; // 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'
  final bool isStudy;
  final String? notes;
  final bool crossesMidnight;
  final String? rescheduledTo;
  final Map<String, dynamic> metadata;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const StudyTask({
    required this.id,
    required this.userId,
    required this.date,
    required this.taskId,
    required this.title,
    required this.category,
    this.startTime,
    this.endTime,
    this.status = 'NOT_STARTED',
    this.isStudy = false,
    this.notes,
    this.crossesMidnight = false,
    this.rescheduledTo,
    this.metadata = const {},
    this.createdAt,
    this.updatedAt,
  });

  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isInProgress => status.toUpperCase() == 'IN_PROGRESS';
  bool get isNotStarted => !isCompleted && !isInProgress;

  /// Pillar classification
  bool get isDsa =>
      category.toLowerCase().contains('dsa') ||
      category.toLowerCase().contains('algo');

  bool get isDev =>
      category.toLowerCase().contains('dev') ||
      category.toLowerCase().contains('project');

  bool get isGym =>
      category.toLowerCase().contains('gym') ||
      category.toLowerCase().contains('workout') ||
      category.toLowerCase().contains('train') ||
      category.toLowerCase().contains('body');

  bool get isCoreCs =>
      category.toLowerCase().contains('cs') ||
      category.toLowerCase().contains('study') ||
      isStudy;

  factory StudyTask.fromMap(Map<String, dynamic> map) {
    return StudyTask(
      id: map['id']?.toString() ?? '',
      userId: map['user_id']?.toString() ?? '',
      date: map['date']?.toString() ?? '',
      taskId: map['task_id']?.toString() ?? '',
      title: map['title']?.toString() ?? 'Directive',
      category: map['category']?.toString() ?? 'study',
      startTime: map['start_time']?.toString(),
      endTime: map['end_time']?.toString(),
      status: map['status']?.toString() ?? 'NOT_STARTED',
      isStudy: map['is_study'] == true,
      notes: map['notes']?.toString(),
      crossesMidnight: map['crosses_midnight'] == true,
      rescheduledTo: map['rescheduled_to']?.toString(),
      metadata: map['metadata'] is Map
          ? Map<String, dynamic>.from(map['metadata'] as Map)
          : const {},
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
      updatedAt: map['updated_at'] != null
          ? DateTime.tryParse(map['updated_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'date': date,
    'task_id': taskId,
    'title': title,
    'category': category,
    'start_time': startTime,
    'end_time': endTime,
    'status': status,
    'is_study': isStudy,
    'notes': notes,
    'crosses_midnight': crossesMidnight,
    'rescheduled_to': rescheduledTo,
    'metadata': metadata,
    'updated_at': DateTime.now().toIso8601String(),
  };

  StudyTask copyWith({
    String? status,
    String? title,
    String? category,
    String? startTime,
    String? endTime,
    String? notes,
    String? date,
    Map<String, dynamic>? metadata,
  }) {
    return StudyTask(
      id: id,
      userId: userId,
      date: date ?? this.date,
      taskId: taskId,
      title: title ?? this.title,
      category: category ?? this.category,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      isStudy: isStudy,
      notes: notes ?? this.notes,
      crossesMidnight: crossesMidnight,
      rescheduledTo: rescheduledTo,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
