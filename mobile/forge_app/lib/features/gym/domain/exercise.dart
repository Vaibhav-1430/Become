class Exercise {
  final String id;
  final String name;
  final String muscleGroup;
  final String category;
  final String equipment;
  final int defaultSets;
  final String defaultReps;
  final int defaultRestSeconds;

  const Exercise({
    required this.id,
    required this.name,
    required this.muscleGroup,
    required this.category,
    required this.equipment,
    this.defaultSets = 4,
    this.defaultReps = '8–10',
    this.defaultRestSeconds = 90,
  });

  String get exerciseName => name;
  int get plannedSets => defaultSets;
  String get plannedReps => defaultReps;
  String get targetMuscle => muscleGroup;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'muscleGroup': muscleGroup,
      'category': category,
      'equipment': equipment,
      'defaultSets': defaultSets,
      'defaultReps': defaultReps,
      'defaultRestSeconds': defaultRestSeconds,
    };
  }

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Exercise',
      muscleGroup: json['muscleGroup'] as String? ?? 'General',
      category: json['category'] as String? ?? json['muscleGroup'] as String? ?? 'General',
      equipment: json['equipment'] as String? ?? 'Standard',
      defaultSets: (json['defaultSets'] as num?)?.toInt() ?? 4,
      defaultReps: json['defaultReps'] as String? ?? '8–10',
      defaultRestSeconds: (json['defaultRestSeconds'] as num?)?.toInt() ?? 90,
    );
  }
}
