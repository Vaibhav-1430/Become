import 'dart:typed_data';
import 'package:intl/intl.dart';
import '../domain/exercise.dart';
import '../domain/workout_plan.dart';
import '../domain/workout_template.dart';
import '../domain/workout_session.dart';
import '../domain/workout_exercise.dart';
import '../domain/workout_set.dart';
import '../domain/personal_record.dart';
import 'gym_repository.dart';
import 'canonical_workout_data.dart';
import 'gym_storage_service.dart';

class MockGymRepository implements GymRepository {
  final String userId;
  bool shouldFail = false;

  late WorkoutPlan _plan;
  final List<WorkoutSession> _sessions = [];
  final List<PersonalRecord> _prs = [];

  MockGymRepository({
    this.userId = 'mock_user_123',
    WorkoutPlan? initialPlan,
    List<WorkoutSession>? initialSessions,
    List<PersonalRecord>? initialPrs,
  }) {
    _plan = initialPlan ?? createDefaultWorkoutPlan(userId);
    if (initialSessions != null) {
      _sessions.addAll(initialSessions);
    } else {
      _seedDefaultHistory();
    }
    if (initialPrs != null) {
      _prs.addAll(initialPrs);
    } else {
      _seedDefaultPrs();
    }
  }

  void _seedDefaultHistory() {
    final now = DateTime.now();
    // Seed 1 completed session for 2 days ago
    final prevDate = now.subtract(const Duration(days: 2));
    final prevDateStr = DateFormat('yyyy-MM-dd').format(prevDate);
    final dayKey = getDayKeyForDate(prevDate);
    final template = kCanonicalSchedule[dayKey] ?? kCanonicalSchedule['wednesday']!;

    final completedSession = WorkoutSession(
      id: 'sess_prev_01',
      userId: userId,
      date: prevDateStr,
      dayOfWeek: template.dayName,
      dayKey: dayKey,
      workoutType: template.routineName,
      durationMinutes: 62,
      status: 'completed',
      gymPhotoPath: GymStorageService.buildCanonicalPath(userId, 'sess_prev_01', prevDate),
      totalVolumeKg: 14250.0,
      totalSets: 18,
      totalReps: 164,
      createdAt: prevDate,
      startedAt: prevDate.subtract(const Duration(minutes: 62)),
      endedAt: prevDate,
      exercises: [
        WorkoutExercise(
          id: 'we_01',
          sessionId: 'sess_prev_01',
          exerciseId: 'ex_ch_2',
          exerciseNameSnapshot: 'Barbell Incline Bench Press',
          muscleGroup: 'Chest',
          orderIndex: 0,
          sets: [
            WorkoutSet(
              setNumber: 1,
              weightKg: 80.0,
              reps: 10,
              rpe: 8.0,
              completed: true,
              completedAt: prevDate,
            ),
            WorkoutSet(
              setNumber: 2,
              weightKg: 82.5,
              reps: 9,
              rpe: 8.5,
              completed: true,
              completedAt: prevDate,
            ),
            WorkoutSet(
              setNumber: 3,
              weightKg: 85.0,
              reps: 9,
              rpe: 9.0,
              completed: true,
              isWeightPr: true,
              completedAt: prevDate,
            ),
          ],
        ),
      ],
    );

    _sessions.add(completedSession);
  }

  void _seedDefaultPrs() {
    _prs.add(PersonalRecord(
      id: 'pr_01',
      userId: userId,
      exerciseId: 'ex_ch_2',
      exerciseName: 'Barbell Incline Bench Press',
      maxWeightKg: 85.0,
      maxReps: 9,
      achievedAt: DateTime.now().subtract(const Duration(days: 2)),
    ));
  }

  @override
  Future<WorkoutPlan> getWorkoutPlan() async {
    return _plan;
  }

  @override
  Future<WorkoutTemplate?> getTemplateForDate(DateTime date) async {
    final dayKey = getDayKeyForDate(date);
    return _plan.schedule[dayKey];
  }

  @override
  Future<WorkoutSession?> getSessionForDate(String dateStr) async {
    try {
      return _sessions.firstWhere((s) => s.date == dateStr);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<WorkoutSession>> getWorkoutHistory({String? userId, int limit = 30}) async {
    final targetId = userId ?? this.userId;
    final sorted = List<WorkoutSession>.from(_sessions.where((s) => s.userId == targetId))
      ..sort((a, b) => b.date.compareTo(a.date));
    return sorted.take(limit).toList();
  }

  @override
  Future<List<PersonalRecord>> getPersonalRecords({String? userId}) async {
    final targetId = userId ?? this.userId;
    return List<PersonalRecord>.from(_prs.where((p) => p.userId == targetId));
  }

  @override
  Future<List<WorkoutSet>?> getPreviousPerformance(String exerciseId) async {
    for (final session in _sessions) {
      for (final ex in session.exercises) {
        if (ex.exerciseId == exerciseId && ex.sets.isNotEmpty) {
          return ex.sets;
        }
      }
    }
    return null;
  }

  @override
  Future<WorkoutSession> saveWorkoutSession(WorkoutSession session) async {
    if (shouldFail) {
      throw Exception('Simulated database persistence failure');
    }

    _sessions.removeWhere((s) => s.id == session.id || s.date == session.date);
    _sessions.add(session);
    return session;
  }

  @override
  Future<PersonalRecord?> savePersonalRecord(PersonalRecord pr) async {
    if (shouldFail) {
      throw Exception('Simulated PR persistence failure');
    }

    _prs.removeWhere((p) => p.exerciseId == pr.exerciseId && p.userId == pr.userId);
    _prs.add(pr);
    return pr;
  }

  @override
  Future<String> uploadCheckInPhoto(Uint8List imageBytes, String sessionId, [DateTime? date]) async {
    if (shouldFail) {
      throw Exception('Simulated photo upload network failure');
    }

    if (imageBytes.isEmpty) {
      throw Exception('No gym photo provided');
    }

    return GymStorageService.buildCanonicalPath(userId, sessionId, date);
  }

  @override
  Future<String?> getSignedPhotoUrl(String photoPath) async {
    final cleanPath = GymStorageService.normalizeGymPhotoPath(photoPath);
    if (cleanPath.isEmpty) return null;

    final pathOwnerId = cleanPath.split('/').first;
    if (pathOwnerId != userId) {
      return null; // Cross-user security block
    }

    return 'https://storage.supabase.co/mock/gym-photos/$cleanPath?token=simulated_jwt';
  }

  @override
  Future<WorkoutTemplate?> getWorkoutPlanForDate({required String userId, required DateTime date}) {
    return getTemplateForDate(date);
  }

  @override
  Future<WorkoutSession?> getTodaySession({required String userId, required DateTime date}) {
    final dateStr = DateFormat('yyyy-MM-dd').format(date);
    return getSessionForDate(dateStr);
  }

  @override
  Future<WorkoutSession> createWorkoutSession({
    required String userId,
    required WorkoutTemplate template,
    required String gymPhotoPath,
  }) async {
    final now = DateTime.now();
    final dateStr = DateFormat('yyyy-MM-dd').format(now);
    final sid = 'sess_${now.millisecondsSinceEpoch}';

    final sessionExercises = template.exercises.asMap().entries.map((entry) {
      final idx = entry.key;
      final ex = entry.value;
      final sets = List.generate(
        ex.defaultSets,
        (sIdx) => WorkoutSet(
          id: 'set_${sid}_${ex.id}_$sIdx',
          workoutExerciseId: 'we_${sid}_${ex.id}',
          setNumber: sIdx + 1,
          weightKg: 60.0,
          reps: 10,
          completed: false,
        ),
      );

      return WorkoutExercise(
        id: 'we_${sid}_${ex.id}',
        sessionId: sid,
        exerciseId: ex.id,
        exerciseNameSnapshot: ex.name,
        muscleGroup: ex.muscleGroup,
        orderIndex: idx,
        sets: sets,
      );
    }).toList();

    final session = WorkoutSession(
      id: sid,
      userId: userId,
      date: dateStr,
      dayOfWeek: template.dayName,
      dayKey: template.dayKey,
      workoutType: template.routineName,
      durationMinutes: 0,
      status: 'in_progress',
      gymPhotoPath: gymPhotoPath,
      totalVolumeKg: 0.0,
      totalSets: sessionExercises.fold(0, (acc, e) => acc + e.sets.length),
      totalReps: 0,
      createdAt: now,
      startedAt: now,
      exercises: sessionExercises,
    );

    return saveWorkoutSession(session);
  }

  @override
  Future<WorkoutSession> updateWorkoutSession(WorkoutSession session) {
    return saveWorkoutSession(session);
  }

  @override
  Future<void> saveWorkoutSet({required String userId, required WorkoutSet set}) async {
    if (shouldFail) {
      throw Exception('Simulated set persistence failure');
    }
    // Update local session state
    for (var i = 0; i < _sessions.length; i++) {
      final s = _sessions[i];
      final updatedExercises = s.exercises.map((ex) {
        final updatedSets = ex.sets.map((sItem) {
          if (sItem.id == set.id ||
              (ex.id == set.workoutExerciseId && sItem.setNumber == set.setNumber) ||
              (sItem.workoutExerciseId != null && sItem.workoutExerciseId == set.workoutExerciseId && sItem.setNumber == set.setNumber)) {
            return set;
          }
          return sItem;
        }).toList();
        return ex.copyWith(sets: updatedSets);
      }).toList();
      _sessions[i] = s.copyWith(exercises: updatedExercises);
    }
  }

  @override
  Future<void> deleteWorkoutSession(String sessionId) async {
    _sessions.removeWhere((s) => s.id == sessionId);
  }

  @override
  Future<WorkoutPlan> saveWorkoutPlan(WorkoutPlan plan) async {
    _plan = plan;
    return _plan;
  }

  final List<Exercise> _customExercises = [];

  @override
  Future<List<Exercise>> getAllExercises() async {
    return [...kCanonicalExercises, ..._customExercises];
  }

  @override
  Future<Exercise> addCustomExercise(Exercise exercise) async {
    _customExercises.add(exercise);
    return exercise;
  }

  @override
  Future<void> refresh() async {}
}
