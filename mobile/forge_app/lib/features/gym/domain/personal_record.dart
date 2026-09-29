class PersonalRecord {
  final String? id;
  final String userId;
  final String exerciseId;
  final String exerciseName;
  final double maxWeightKg;
  final int maxReps;
  final DateTime achievedAt;
  final String? sessionId;

  const PersonalRecord({
    this.id,
    required this.userId,
    required this.exerciseId,
    required this.exerciseName,
    required this.maxWeightKg,
    required this.maxReps,
    required this.achievedAt,
    this.sessionId,
  });

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'user_id': userId,
      'exercise_id': exerciseId,
      'exercise_name': exerciseName,
      'max_weight_kg': maxWeightKg,
      'max_reps': maxReps,
      'achieved_at': achievedAt.toIso8601String(),
      if (sessionId != null) 'session_id': sessionId,
    };
  }

  factory PersonalRecord.fromJson(Map<String, dynamic> json) {
    return PersonalRecord(
      id: json['id'] as String?,
      userId: json['user_id'] as String? ?? '',
      exerciseId: json['exercise_id'] as String? ?? '',
      exerciseName: json['exercise_name'] as String? ?? 'Exercise',
      maxWeightKg: (json['max_weight_kg'] as num?)?.toDouble() ?? 0.0,
      maxReps: (json['max_reps'] as num?)?.toInt() ?? 0,
      achievedAt: json['achieved_at'] != null
          ? DateTime.parse(json['achieved_at'] as String)
          : DateTime.now(),
      sessionId: json['session_id'] as String?,
    );
  }
}
