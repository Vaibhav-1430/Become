import 'workout_set.dart';

class WorkoutExercise {
  final String? id;
  final String? sessionId;
  final String exerciseId;
  final String exerciseNameSnapshot;
  final String? muscleGroup;
  final String? equipment;
  final int orderIndex;
  final bool skipped;
  final String? notes;
  final List<WorkoutSet> sets;

  const WorkoutExercise({
    this.id,
    this.sessionId,
    required this.exerciseId,
    required this.exerciseNameSnapshot,
    this.muscleGroup,
    this.equipment,
    this.orderIndex = 0,
    this.skipped = false,
    this.notes,
    this.sets = const [],
  });

  String get exerciseName => exerciseNameSnapshot;
  int get completedSetsCount => sets.where((s) => s.completed).length;

  WorkoutExercise copyWith({
    String? id,
    String? sessionId,
    String? exerciseId,
    String? exerciseNameSnapshot,
    String? muscleGroup,
    String? equipment,
    int? orderIndex,
    bool? skipped,
    String? notes,
    List<WorkoutSet>? sets,
  }) {
    return WorkoutExercise(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      exerciseId: exerciseId ?? this.exerciseId,
      exerciseNameSnapshot: exerciseNameSnapshot ?? this.exerciseNameSnapshot,
      muscleGroup: muscleGroup ?? this.muscleGroup,
      equipment: equipment ?? this.equipment,
      orderIndex: orderIndex ?? this.orderIndex,
      skipped: skipped ?? this.skipped,
      notes: notes ?? this.notes,
      sets: sets ?? this.sets,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (sessionId != null) 'session_id': sessionId,
      'exercise_id': exerciseId,
      'exercise_name_snapshot': exerciseNameSnapshot,
      if (muscleGroup != null) 'muscle_group': muscleGroup,
      if (equipment != null) 'equipment': equipment,
      'order_index': orderIndex,
      'skipped': skipped,
      if (notes != null) 'notes': notes,
      'sets': sets.map((s) => s.toJson()).toList(),
    };
  }

  factory WorkoutExercise.fromJson(Map<String, dynamic> json) {
    final rawSets = json['sets'] as List<dynamic>? ?? [];
    final sets = rawSets
        .map((s) => WorkoutSet.fromJson(Map<String, dynamic>.from(s as Map)))
        .toList();

    return WorkoutExercise(
      id: json['id'] as String?,
      sessionId: json['session_id'] as String?,
      exerciseId: json['exercise_id'] as String? ?? '',
      exerciseNameSnapshot: json['exercise_name_snapshot'] as String? ?? 'Exercise',
      muscleGroup: json['muscle_group'] as String?,
      equipment: json['equipment'] as String?,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      skipped: json['skipped'] as bool? ?? false,
      notes: json['notes'] as String?,
      sets: sets,
    );
  }
}
