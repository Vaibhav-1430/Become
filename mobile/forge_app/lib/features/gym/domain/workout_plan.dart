import 'workout_template.dart';

class WorkoutPlan {
  final String? id;
  final String userId;
  final bool isConfigured;
  final Map<String, dynamic> settings;
  final Map<String, WorkoutTemplate> schedule;
  final DateTime createdAt;
  final DateTime updatedAt;

  const WorkoutPlan({
    this.id,
    required this.userId,
    this.isConfigured = true,
    this.settings = const {
      'trackRPE': true,
      'trackRestTime': true,
      'trackPRs': true,
    },
    required this.schedule,
    required this.createdAt,
    required this.updatedAt,
  });

  WorkoutPlan copyWith({
    String? id,
    String? userId,
    bool? isConfigured,
    Map<String, dynamic>? settings,
    Map<String, WorkoutTemplate>? schedule,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return WorkoutPlan(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      isConfigured: isConfigured ?? this.isConfigured,
      settings: settings ?? this.settings,
      schedule: schedule ?? this.schedule,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'user_id': userId,
      'is_configured': isConfigured,
      'settings': settings,
      'schedule': schedule.map((key, val) => MapEntry(key, val.toJson())),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory WorkoutPlan.fromJson(Map<String, dynamic> json) {
    final rawSchedule = json['schedule'] as Map<String, dynamic>? ?? {};
    final scheduleMap = <String, WorkoutTemplate>{};

    rawSchedule.forEach((key, value) {
      if (value is Map) {
        scheduleMap[key] = WorkoutTemplate.fromJson(Map<String, dynamic>.from(value));
      }
    });

    return WorkoutPlan(
      id: json['id'] as String?,
      userId: json['user_id'] as String? ?? '',
      isConfigured: json['is_configured'] as bool? ?? true,
      settings: (json['settings'] as Map<String, dynamic>?) ??
          const {'trackRPE': true, 'trackRestTime': true, 'trackPRs': true},
      schedule: scheduleMap,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
    );
  }
}
