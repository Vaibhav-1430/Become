import '../domain/exercise.dart';
import '../domain/workout_template.dart';
import '../domain/workout_plan.dart';

/// Authentic exercises sourced directly from js/store.js (DEFAULT_EXERCISE_LIBRARY)
const List<Exercise> kCanonicalExercises = [
  // CHEST
  Exercise(
    id: 'ex_ch_1',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    category: 'Mid Chest',
    equipment: 'Barbell',
    defaultSets: 4,
    defaultReps: '8–10',
    defaultRestSeconds: 90,
  ),
  Exercise(
    id: 'ex_ch_2',
    name: 'Barbell Incline Bench Press',
    muscleGroup: 'Chest',
    category: 'Upper Chest',
    equipment: 'Barbell',
    defaultSets: 4,
    defaultReps: '8–10',
    defaultRestSeconds: 90,
  ),
  Exercise(
    id: 'ex_ch_5',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    category: 'Upper Chest',
    equipment: 'Dumbbell',
    defaultSets: 3,
    defaultReps: '10–12',
    defaultRestSeconds: 75,
  ),
  Exercise(
    id: 'ex_ch_13',
    name: 'Weighted Dips',
    muscleGroup: 'Chest',
    category: 'Lower Chest / Triceps',
    equipment: 'Bodyweight / Belt',
    defaultSets: 3,
    defaultReps: '8–12',
    defaultRestSeconds: 90,
  ),

  // BACK
  Exercise(
    id: 'ex_back_1',
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    category: 'Lats (Width)',
    equipment: 'Cable Machine',
    defaultSets: 4,
    defaultReps: '10–12',
    defaultRestSeconds: 75,
  ),
  Exercise(
    id: 'ex_back_4',
    name: 'Barbell Bent Over Row',
    muscleGroup: 'Back',
    category: 'Upper Back / Lats (Thickness)',
    equipment: 'Barbell',
    defaultSets: 4,
    defaultReps: '8–10',
    defaultRestSeconds: 90,
  ),
  Exercise(
    id: 'ex_back_9',
    name: 'Seated Cable Row',
    muscleGroup: 'Back',
    category: 'Mid Back',
    equipment: 'Cable Machine',
    defaultSets: 3,
    defaultReps: '10–12',
    defaultRestSeconds: 75,
  ),
  Exercise(
    id: 'ex_back_21',
    name: 'Hyperextension',
    muscleGroup: 'Back',
    category: 'Lower Back',
    equipment: 'Bench',
    defaultSets: 3,
    defaultReps: '12–15',
    defaultRestSeconds: 60,
  ),

  // BICEPS
  Exercise(
    id: 'ex_bic_1',
    name: 'Barbell Curl',
    muscleGroup: 'Biceps',
    category: 'Biceps',
    equipment: 'Barbell',
    defaultSets: 3,
    defaultReps: '10–12',
    defaultRestSeconds: 60,
  ),
  Exercise(
    id: 'ex_bic_5',
    name: 'Hammer Curl',
    muscleGroup: 'Biceps',
    category: 'Brachialis',
    equipment: 'Dumbbell',
    defaultSets: 3,
    defaultReps: '10–12',
    defaultRestSeconds: 60,
  ),
  Exercise(
    id: 'ex_bic_10',
    name: 'Cable Curl',
    muscleGroup: 'Biceps',
    category: 'Biceps',
    equipment: 'Cable',
    defaultSets: 3,
    defaultReps: '12–15',
    defaultRestSeconds: 60,
  ),

  // LEGS
  Exercise(
    id: 'ex_leg_1',
    name: 'Barbell Back Squat',
    muscleGroup: 'Legs',
    category: 'Quads / Glutes',
    equipment: 'Barbell',
    defaultSets: 4,
    defaultReps: '6–8',
    defaultRestSeconds: 120,
  ),
  Exercise(
    id: 'ex_leg_3',
    name: 'Leg Press',
    muscleGroup: 'Legs',
    category: 'Quads',
    equipment: 'Machine',
    defaultSets: 4,
    defaultReps: '10–12',
    defaultRestSeconds: 90,
  ),
  Exercise(
    id: 'ex_leg_7',
    name: 'Romanian Deadlift',
    muscleGroup: 'Legs',
    category: 'Hamstrings / Glutes',
    equipment: 'Barbell',
    defaultSets: 4,
    defaultReps: '8–10',
    defaultRestSeconds: 90,
  ),
  Exercise(
    id: 'ex_leg_10',
    name: 'Standing Calf Raise',
    muscleGroup: 'Legs',
    category: 'Calves',
    equipment: 'Machine',
    defaultSets: 4,
    defaultReps: '12–15',
    defaultRestSeconds: 60,
  ),

  // SHOULDERS
  Exercise(
    id: 'ex_sh_1',
    name: 'Overhead Barbell Press',
    muscleGroup: 'Shoulders',
    category: 'Front / Mid Deltoids',
    equipment: 'Barbell',
    defaultSets: 4,
    defaultReps: '6–8',
    defaultRestSeconds: 90,
  ),
  Exercise(
    id: 'ex_sh_5',
    name: 'Dumbbell Lateral Raises',
    muscleGroup: 'Shoulders',
    category: 'Lateral Deltoids',
    equipment: 'Dumbbell',
    defaultSets: 4,
    defaultReps: '12–15',
    defaultRestSeconds: 60,
  ),
  Exercise(
    id: 'ex_sh_12',
    name: 'Face Pull',
    muscleGroup: 'Shoulders',
    category: 'Rear Delts / Upper Back',
    equipment: 'Cable Rope',
    defaultSets: 4,
    defaultReps: '12–15',
    defaultRestSeconds: 60,
  ),

  // TRICEPS
  Exercise(
    id: 'ex_tri_1',
    name: 'Skull Crushers',
    muscleGroup: 'Triceps',
    category: 'Long Head',
    equipment: 'EZ Bar',
    defaultSets: 3,
    defaultReps: '10–12',
    defaultRestSeconds: 60,
  ),
  Exercise(
    id: 'ex_tri_4',
    name: 'Triceps Rope Pushdown',
    muscleGroup: 'Triceps',
    category: 'Lateral Head',
    equipment: 'Cable Rope',
    defaultSets: 3,
    defaultReps: '12–15',
    defaultRestSeconds: 60,
  ),
];

/// Canonical FORGE 6-day split templates
final Map<String, WorkoutTemplate> kCanonicalSchedule = {
  'monday': WorkoutTemplate(
    dayKey: 'monday',
    dayName: 'Monday',
    routineName: 'Back + Biceps',
    isRestDay: false,
    muscleGroups: ['Back', 'Biceps'],
    targetDurationMinutes: 65,
    exercises: [
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_back_4'), // Barbell Row
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_back_1'), // Lat Pulldown
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_back_9'), // Cable Row
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_bic_1'),  // Barbell Curl
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_bic_5'),  // Hammer Curl
    ],
  ),
  'tuesday': WorkoutTemplate(
    dayKey: 'tuesday',
    dayName: 'Tuesday',
    routineName: 'Legs + Shoulders',
    isRestDay: false,
    muscleGroups: ['Legs', 'Shoulders'],
    targetDurationMinutes: 70,
    exercises: [
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_leg_1'), // Back Squat
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_leg_7'), // Romanian Deadlift
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_leg_3'), // Leg Press
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_sh_1'),  // Overhead Press
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_sh_5'),  // Lateral Raises
    ],
  ),
  'wednesday': WorkoutTemplate(
    dayKey: 'wednesday',
    dayName: 'Wednesday',
    routineName: 'Chest + Triceps',
    isRestDay: false,
    muscleGroups: ['Chest', 'Triceps'],
    targetDurationMinutes: 65,
    exercises: [
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_ch_2'),  // Incline Bench Press
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_ch_1'),  // Flat Bench Press
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_ch_13'), // Weighted Dips
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_tri_4'), // Cable Pushdown
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_tri_1'), // Skull Crushers
    ],
  ),
  'thursday': WorkoutTemplate(
    dayKey: 'thursday',
    dayName: 'Thursday',
    routineName: 'Back + Biceps',
    isRestDay: false,
    muscleGroups: ['Back', 'Biceps'],
    targetDurationMinutes: 65,
    exercises: [
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_back_4'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_back_1'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_back_9'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_bic_1'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_bic_10'),
    ],
  ),
  'friday': WorkoutTemplate(
    dayKey: 'friday',
    dayName: 'Friday',
    routineName: 'Legs + Shoulders',
    isRestDay: false,
    muscleGroups: ['Legs', 'Shoulders'],
    targetDurationMinutes: 70,
    exercises: [
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_leg_1'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_leg_7'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_leg_3'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_sh_1'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_sh_12'), // Face Pull
    ],
  ),
  'saturday': WorkoutTemplate(
    dayKey: 'saturday',
    dayName: 'Saturday',
    routineName: 'Chest + Triceps',
    isRestDay: false,
    muscleGroups: ['Chest', 'Triceps'],
    targetDurationMinutes: 65,
    exercises: [
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_ch_2'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_ch_5'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_ch_13'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_tri_4'),
      kCanonicalExercises.firstWhere((e) => e.id == 'ex_tri_1'),
    ],
  ),
  'sunday': const WorkoutTemplate(
    dayKey: 'sunday',
    dayName: 'Sunday',
    routineName: 'Rest',
    isRestDay: true,
    muscleGroups: [],
    targetDurationMinutes: 0,
    exercises: [],
  ),
};

WorkoutPlan createDefaultWorkoutPlan(String userId) {
  final now = DateTime.now();
  return WorkoutPlan(
    userId: userId,
    isConfigured: true,
    settings: const {
      'trackRPE': true,
      'trackRestTime': true,
      'trackPRs': true,
    },
    schedule: kCanonicalSchedule,
    createdAt: now,
    updatedAt: now,
  );
}

String getDayKeyForDate(DateTime date) {
  switch (date.weekday) {
    case DateTime.monday:
      return 'monday';
    case DateTime.tuesday:
      return 'tuesday';
    case DateTime.wednesday:
      return 'wednesday';
    case DateTime.thursday:
      return 'thursday';
    case DateTime.friday:
      return 'friday';
    case DateTime.saturday:
      return 'saturday';
    case DateTime.sunday:
    default:
      return 'sunday';
  }
}
