class WorkoutSet {
  final String? id;
  final String? workoutExerciseId;
  final int setNumber;
  final double weightKg;
  final int reps;
  final double? rpe;
  final bool completed;
  final bool isWeightPr;
  final bool isRepPr;
  final DateTime completedAt;

  WorkoutSet({
    this.id,
    this.workoutExerciseId,
    required this.setNumber,
    required this.weightKg,
    required this.reps,
    this.rpe,
    this.completed = true,
    this.isWeightPr = false,
    this.isRepPr = false,
    DateTime? completedAt,
  }) : completedAt = completedAt ?? DateTime.now();

  WorkoutSet copyWith({
    String? id,
    String? workoutExerciseId,
    int? setNumber,
    double? weightKg,
    int? reps,
    double? rpe,
    bool? completed,
    bool? isWeightPr,
    bool? isRepPr,
    DateTime? completedAt,
  }) {
    return WorkoutSet(
      id: id ?? this.id,
      workoutExerciseId: workoutExerciseId ?? this.workoutExerciseId,
      setNumber: setNumber ?? this.setNumber,
      weightKg: weightKg ?? this.weightKg,
      reps: reps ?? this.reps,
      rpe: rpe ?? this.rpe,
      completed: completed ?? this.completed,
      isWeightPr: isWeightPr ?? this.isWeightPr,
      isRepPr: isRepPr ?? this.isRepPr,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (workoutExerciseId != null) 'workout_exercise_id': workoutExerciseId,
      'set_number': setNumber,
      'weight_kg': weightKg,
      'reps': reps,
      if (rpe != null) 'rpe': rpe,
      'completed': completed,
      'is_weight_pr': isWeightPr,
      'is_rep_pr': isRepPr,
      'completed_at': completedAt.toIso8601String(),
    };
  }

  factory WorkoutSet.fromJson(Map<String, dynamic> json) {
    return WorkoutSet(
      id: json['id'] as String?,
      workoutExerciseId: json['workout_exercise_id'] as String?,
      setNumber: (json['set_number'] as num?)?.toInt() ?? 1,
      weightKg: (json['weight_kg'] as num?)?.toDouble() ?? 0.0,
      reps: (json['reps'] as num?)?.toInt() ?? 0,
      rpe: (json['rpe'] as num?)?.toDouble(),
      completed: json['completed'] as bool? ?? true,
      isWeightPr: json['is_weight_pr'] as bool? ?? false,
      isRepPr: json['is_rep_pr'] as bool? ?? false,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : DateTime.now(),
    );
  }
}
