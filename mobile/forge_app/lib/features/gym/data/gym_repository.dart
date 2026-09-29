import 'dart:typed_data';
import '../domain/exercise.dart';
import '../domain/workout_plan.dart';
import '../domain/workout_template.dart';
import '../domain/workout_session.dart';
import '../domain/workout_set.dart';
import '../domain/personal_record.dart';

abstract class GymRepository {
  /// Loads the active weekly workout plan.
  Future<WorkoutPlan> getWorkoutPlan();

  /// Saves or updates the weekly workout plan.
  Future<WorkoutPlan> saveWorkoutPlan(WorkoutPlan plan);

  /// Resolves the planned workout template for the given calendar date.
  Future<WorkoutTemplate?> getTemplateForDate(DateTime date);

  /// Retrieves any logged session for the specified date ('YYYY-MM-DD').
  Future<WorkoutSession?> getSessionForDate(String dateStr);

  /// Retrieves chronological workout history.
  Future<List<WorkoutSession>> getWorkoutHistory({String? userId, int limit = 30});

  /// Deletes a workout session by ID across local cache and Supabase.
  Future<void> deleteWorkoutSession(String sessionId);

  /// Retrieves the user's recorded personal records.
  Future<List<PersonalRecord>> getPersonalRecords({String? userId});

  /// Retrieves the previous performance sets for a specific exercise.
  Future<List<WorkoutSet>?> getPreviousPerformance(String exerciseId);

  /// Persists a logged workout session with exercises and sets.
  Future<WorkoutSession> saveWorkoutSession(WorkoutSession session);

  /// Saves or updates a personal record if it beats previous records.
  Future<PersonalRecord?> savePersonalRecord(PersonalRecord pr);

  /// Uploads mandatory verification gym photo and returns canonical storage path.
  Future<String> uploadCheckInPhoto(Uint8List imageBytes, String sessionId, [DateTime? date]);

  /// Resolves temporary signed URL for a photo's canonical storage path.
  Future<String?> getSignedPhotoUrl(String photoPath);

  /// Resolves workout plan for specific user and date
  Future<WorkoutTemplate?> getWorkoutPlanForDate({required String userId, required DateTime date});

  /// Resolves today's session if one already exists
  Future<WorkoutSession?> getTodaySession({required String userId, required DateTime date});

  /// Instantiates a new workout session from a template and verified gym photo
  Future<WorkoutSession> createWorkoutSession({
    required String userId,
    required WorkoutTemplate template,
    required String gymPhotoPath,
  });

  /// Updates an existing workout session
  Future<WorkoutSession> updateWorkoutSession(WorkoutSession session);

  /// Persists an individual set completion
  Future<void> saveWorkoutSet({required String userId, required WorkoutSet set});

  /// Retrieves all available exercises (canonical + custom).
  Future<List<Exercise>> getAllExercises();

  /// Adds a custom exercise.
  Future<Exercise> addCustomExercise(Exercise exercise);

  /// Authoritatively refreshes Gym state from Supabase.
  Future<void> refresh();
}
