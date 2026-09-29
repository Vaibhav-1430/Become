import 'workout_exercise.dart';

class WorkoutSession {
  final String id;
  final String userId;
  final String date;
  final String dayOfWeek;
  final String dayKey;
  final String workoutType;
  final int durationMinutes;
  final String status;
  final String gymPhotoPath;
  final double totalVolumeKg;
  final int totalSets;
  final int totalReps;
  final String? notes;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final DateTime createdAt;
  final List<WorkoutExercise> exercises;

  const WorkoutSession({
    required this.id,
    required this.userId,
    required this.date,
    required this.dayOfWeek,
    required this.dayKey,
    required this.workoutType,
    this.durationMinutes = 0,
    this.status = 'completed',
    required this.gymPhotoPath,
    this.totalVolumeKg = 0.0,
    this.totalSets = 0,
    this.totalReps = 0,
    this.notes,
    this.startedAt,
    this.endedAt,
    required this.createdAt,
    this.exercises = const [],
  });

  String get routineName => workoutType;
  bool get isCompleted => status.toLowerCase() == 'completed';
  int get durationSeconds => durationMinutes * 60;
  int get completedSetsCount => exercises.fold(0, (acc, e) => acc + e.completedSetsCount);
  DateTime get parsedDate => DateTime.tryParse(date) ?? createdAt;

  WorkoutSession copyWith({
    String? id,
    String? userId,
    String? date,
    String? dayOfWeek,
    String? dayKey,
    String? workoutType,
    int? durationMinutes,
    int? durationSeconds,
    String? status,
    String? gymPhotoPath,
    double? totalVolumeKg,
    int? totalSets,
    int? totalReps,
    String? notes,
    DateTime? startedAt,
    DateTime? endedAt,
    DateTime? completedAt,
    DateTime? createdAt,
    List<WorkoutExercise>? exercises,
  }) {
    return WorkoutSession(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      date: date ?? this.date,
      dayOfWeek: dayOfWeek ?? this.dayOfWeek,
      dayKey: dayKey ?? this.dayKey,
      workoutType: workoutType ?? this.workoutType,
      durationMinutes: durationMinutes ??
          (durationSeconds != null ? (durationSeconds / 60).round() : this.durationMinutes),
      status: status ?? this.status,
      gymPhotoPath: gymPhotoPath ?? this.gymPhotoPath,
      totalVolumeKg: totalVolumeKg ?? this.totalVolumeKg,
      totalSets: totalSets ?? this.totalSets,
      totalReps: totalReps ?? this.totalReps,
      notes: notes ?? this.notes,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? completedAt ?? this.endedAt,
      createdAt: createdAt ?? this.createdAt,
      exercises: exercises ?? this.exercises,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'date': date,
      'day_of_week': dayOfWeek,
      'day_key': dayKey,
      'workout_type': workoutType,
      'duration_minutes': durationMinutes,
      'status': status,
      'gym_photo_path': gymPhotoPath,
      'total_volume_kg': totalVolumeKg,
      'total_sets': totalSets,
      'total_reps': totalReps,
      if (notes != null) 'notes': notes,
      if (startedAt != null) 'started_at': startedAt!.toIso8601String(),
      if (endedAt != null) 'ended_at': endedAt!.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'exercises': exercises.map((e) => e.toJson()).toList(),
    };
  }

  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    final rawExercises = json['exercises'] as List<dynamic>? ?? [];
    final exercises = rawExercises
        .map((e) => WorkoutExercise.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    return WorkoutSession(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      date: json['date'] as String? ?? '',
      dayOfWeek: json['day_of_week'] as String? ?? '',
      dayKey: json['day_key'] as String? ?? '',
      workoutType: json['workout_type'] as String? ?? 'Workout',
      durationMinutes: (json['duration_minutes'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'completed',
      gymPhotoPath: json['gym_photo_path'] as String? ?? '',
      totalVolumeKg: (json['total_volume_kg'] as num?)?.toDouble() ?? 0.0,
      totalSets: (json['total_sets'] as num?)?.toInt() ?? 0,
      totalReps: (json['total_reps'] as num?)?.toInt() ?? 0,
      notes: json['notes'] as String?,
      startedAt: json['started_at'] != null
          ? DateTime.tryParse(json['started_at'] as String)
          : null,
      endedAt: json['ended_at'] != null
          ? DateTime.tryParse(json['ended_at'] as String)
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      exercises: exercises,
    );
  }
}
