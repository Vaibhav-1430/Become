import 'exercise.dart';

class WorkoutTemplate {
  final String dayKey;
  final String dayName;
  final String routineName;
  final bool isRestDay;
  final List<String> muscleGroups;
  final int targetDurationMinutes;
  final List<Exercise> exercises;

  const WorkoutTemplate({
    required this.dayKey,
    required this.dayName,
    required this.routineName,
    required this.isRestDay,
    this.muscleGroups = const [],
    this.targetDurationMinutes = 60,
    this.exercises = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'dayKey': dayKey,
      'dayName': dayName,
      'routineName': routineName,
      'isRestDay': isRestDay,
      'muscleGroups': muscleGroups,
      'targetDurationMinutes': targetDurationMinutes,
      'exercises': exercises.map((e) => e.toJson()).toList(),
    };
  }

  factory WorkoutTemplate.fromJson(Map<String, dynamic> json) {
    final rawExercises = json['exercises'] as List<dynamic>? ?? [];
    final exercises = rawExercises
        .map((e) => Exercise.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    return WorkoutTemplate(
      dayKey: json['dayKey'] as String? ?? 'monday',
      dayName: json['dayName'] as String? ?? 'Monday',
      routineName: json['routineName'] as String? ?? 'Workout',
      isRestDay: json['isRestDay'] as bool? ?? false,
      muscleGroups: (json['muscleGroups'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      targetDurationMinutes:
          (json['targetDurationMinutes'] as num?)?.toInt() ?? 60,
      exercises: exercises,
    );
  }

  WorkoutTemplate copyWith({
    String? dayKey,
    String? dayName,
    String? routineName,
    bool? isRestDay,
    List<String>? muscleGroups,
    int? targetDurationMinutes,
    List<Exercise>? exercises,
  }) {
    return WorkoutTemplate(
      dayKey: dayKey ?? this.dayKey,
      dayName: dayName ?? this.dayName,
      routineName: routineName ?? this.routineName,
      isRestDay: isRestDay ?? this.isRestDay,
      muscleGroups: muscleGroups ?? this.muscleGroups,
      targetDurationMinutes: targetDurationMinutes ?? this.targetDurationMinutes,
      exercises: exercises ?? this.exercises,
    );
  }
}
