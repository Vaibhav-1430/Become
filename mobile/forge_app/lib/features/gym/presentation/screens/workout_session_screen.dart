import 'dart:async';
import 'package:flutter/material.dart';
import '../../domain/exercise.dart';
import '../../domain/workout_session.dart';
import '../../domain/workout_exercise.dart';
import '../../domain/workout_set.dart';
import '../../domain/personal_record.dart';
import '../../data/gym_repository.dart';
import '../widgets/exercise_card.dart';
import '../widgets/rest_timer.dart';

/// Screen managing real workout session execution and logging.
class WorkoutSessionScreen extends StatefulWidget {
  const WorkoutSessionScreen({
    super.key,
    required this.session,
    required this.repository,
    this.onSessionFinished,
  });

  final WorkoutSession session;
  final GymRepository repository;
  final ValueChanged<WorkoutSession>? onSessionFinished;

  @override
  State<WorkoutSessionScreen> createState() => _WorkoutSessionScreenState();
}

class _WorkoutSessionScreenState extends State<WorkoutSessionScreen> {
  late WorkoutSession _session;
  int _activeExerciseIndex = 0;
  Timer? _elapsedTimer;
  int _elapsedSeconds = 0;
  bool _isSaving = false;
  String? _errorMessage;
  final List<PersonalRecord> _personalRecords = [];

  @override
  void initState() {
    super.initState();
    _session = widget.session;
    _elapsedSeconds = _session.durationSeconds;
    _startElapsedTimer();
    _loadPrs();
  }

  void _startElapsedTimer() {
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        _elapsedSeconds++;
      });
    });
  }

  Future<void> _loadPrs() async {
    try {
      final prs = await widget.repository.getPersonalRecords(userId: _session.userId);
      if (mounted) {
        setState(() {
          _personalRecords.clear();
          _personalRecords.addAll(prs);
        });
      }
    } catch (_) {
      // Non-blocking PR load
    }
  }

  @override
  void dispose() {
    _elapsedTimer?.cancel();
    super.dispose();
  }

  String _formatElapsed(int totalSecs) {
    final m = totalSecs ~/ 60;
    final s = totalSecs % 60;
    final h = m ~/ 60;
    final remM = m % 60;
    if (h > 0) {
      return '${h.toString().padLeft(2, '0')}:${remM.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${remM.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  PersonalRecord? _getPrForExercise(String exerciseId) {
    for (final pr in _personalRecords) {
      if (pr.exerciseId == exerciseId) return pr;
    }
    return null;
  }

  void _handleSetCompleted(WorkoutExercise exercise, WorkoutSet completedSet) async {
    // Optimistic local state update
    final updatedSets = exercise.sets.map((s) {
      if (s.id == completedSet.id) {
        return completedSet;
      }
      return s;
    }).toList();

    final updatedExercise = exercise.copyWith(sets: updatedSets);
    final updatedExercises = _session.exercises.map((e) {
      if (e.id == exercise.id) {
        return updatedExercise;
      }
      return e;
    }).toList();

    // Check if this set broke a PR
    final existingPr = _getPrForExercise(exercise.exerciseId);
    bool isNewPr = false;
    if (completedSet.weightKg > 0) {
      if (existingPr == null || completedSet.weightKg > existingPr.maxWeightKg) {
        isNewPr = true;
      }
    }

    final previousSession = _session;

    setState(() {
      _session = _session.copyWith(
        exercises: updatedExercises,
        durationSeconds: _elapsedSeconds,
      );
    });

    try {
      await widget.repository.saveWorkoutSet(
        userId: _session.userId,
        set: completedSet,
      );

      if (isNewPr) {
        final newPr = PersonalRecord(
          id: 'pr_${exercise.exerciseId}_${DateTime.now().millisecondsSinceEpoch}',
          userId: _session.userId,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          maxWeightKg: completedSet.weightKg,
          maxReps: completedSet.reps,
          achievedAt: DateTime.now(),
        );
        await widget.repository.savePersonalRecord(newPr);
        if (mounted) {
          setState(() {
            _personalRecords.removeWhere((p) => p.exerciseId == exercise.exerciseId);
            _personalRecords.add(newPr);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFE5A93C),
              content: Text(
                'NEW PR! ${exercise.exerciseName}: ${completedSet.weightKg} kg × ${completedSet.reps} reps',
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0C0E12),
                ),
              ),
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      // Rollback on persistence error
      if (mounted) {
        setState(() {
          _session = previousSession;
          _errorMessage = 'Failed to persist set. Changes reverted.';
        });
      }
    }
  }

  void _handleAddSet(WorkoutExercise exercise) {
    final nextSetNum = exercise.sets.length + 1;
    final lastSet = exercise.sets.isNotEmpty ? exercise.sets.last : null;
    final newSet = WorkoutSet(
      id: 'set_${DateTime.now().millisecondsSinceEpoch}',
      workoutExerciseId: exercise.id,
      setNumber: nextSetNum,
      weightKg: lastSet?.weightKg ?? 60.0,
      reps: lastSet?.reps ?? 10,
      completed: false,
    );

    final updatedSets = [...exercise.sets, newSet];
    final updatedExercise = exercise.copyWith(sets: updatedSets);
    final updatedExercises = _session.exercises.map((e) {
      if (e.id == exercise.id) {
        return updatedExercise;
      }
      return e;
    }).toList();

    setState(() {
      _session = _session.copyWith(exercises: updatedExercises);
    });
  }

  Future<void> _finishWorkout() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final finishedSession = _session.copyWith(
      durationSeconds: _elapsedSeconds,
      status: 'completed',
      completedAt: DateTime.now(),
    );

    try {
      final saved = await widget.repository.updateWorkoutSession(finishedSession);
      if (!mounted) return;
      if (widget.onSessionFinished != null) {
        widget.onSessionFinished!(saved);
      } else {
        Navigator.of(context).pop(saved);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = 'Failed to complete session: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercises = _session.exercises;
    final hasExercises = exercises.isNotEmpty;
    final activeExercise = hasExercises && _activeExerciseIndex < exercises.length
        ? exercises[_activeExerciseIndex]
        : null;

    final totalCompletedSets = _session.completedSetsCount;
    final totalPlannedSets = _session.totalSets;
    final totalVolume = _session.totalVolumeKg;

    return Scaffold(
      backgroundColor: const Color(0xFF0C0E12),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0C0E12),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFFF0F6FC)),
          onPressed: () {
            // Confirm before backing out of active session
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                backgroundColor: const Color(0xFF13171F),
                title: const Text(
                  'EXIT ACTIVE SESSION?',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFF0F6FC),
                  ),
                ),
                content: const Text(
                  'Your completed sets are preserved, but the session is not marked complete yet.',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF8B949E)),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: const Text('RESUME', style: TextStyle(color: Color(0xFFE5A93C))),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).pop();
                    },
                    child: const Text('EXIT', style: TextStyle(color: Color(0xFFEF4444))),
                  ),
                ],
              ),
            );
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _session.routineName.toUpperCase(),
              style: const TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFFE5A93C),
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              _formatElapsed(_elapsedSeconds),
              style: const TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFFF0F6FC),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _isSaving
                ? const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFE5A93C)),
                    ),
                  )
                : TextButton(
                    onPressed: _finishWorkout,
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFFE5A93C),
                      foregroundColor: const Color(0xFF0C0E12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    ),
                    child: const Text(
                      'FINISH',
                      style: TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Error banner if any
            if (_errorMessage != null)
              Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(fontFamily: 'Inter', fontSize: 11, color: Color(0xFFFCA5A5)),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 14, color: Color(0xFF8B949E)),
                      onPressed: () => setState(() => _errorMessage = null),
                    ),
                  ],
                ),
              ),

            // Top Rest Timer Component
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: RestTimerWidget(initialSeconds: 90),
            ),

            // Exercise Selector Chips
            if (exercises.length > 1)
              SizedBox(
                height: 38,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: exercises.length,
                  itemBuilder: (context, index) {
                    final ex = exercises[index];
                    final isActive = index == _activeExerciseIndex;
                    final isDone = ex.sets.isNotEmpty && ex.sets.every((s) => s.completed);

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isDone) ...[
                              const Icon(Icons.check, size: 12, color: Color(0xFF10B981)),
                              const SizedBox(width: 4),
                            ],
                            Text(
                              ex.exerciseName,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 12,
                                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                                color: isActive
                                    ? const Color(0xFF0C0E12)
                                    : (isDone ? const Color(0xFF10B981) : const Color(0xFF8B949E)),
                              ),
                            ),
                          ],
                        ),
                        selected: isActive,
                        selectedColor: const Color(0xFFE5A93C),
                        backgroundColor: const Color(0xFF13171F),
                        side: BorderSide(
                          color: isActive
                              ? const Color(0xFFE5A93C)
                              : (isDone ? const Color(0xFF10B981).withValues(alpha: 0.3) : const Color(0xFF1F2430)),
                        ),
                        onSelected: (val) {
                          if (val) {
                            setState(() {
                              _activeExerciseIndex = index;
                            });
                          }
                        },
                      ),
                    );
                  },
                ),
              ),

            const SizedBox(height: 8),

            // Active Exercise Card with sets & steppers
            Expanded(
              child: activeExercise == null
                  ? const Center(
                      child: Text(
                        'No exercises in this session',
                        style: TextStyle(color: Color(0xFF8B949E)),
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ActiveExerciseCard(
                            exerciseIndex: _activeExerciseIndex + 1,
                            exercise: Exercise(
                              id: activeExercise.exerciseId,
                              name: activeExercise.exerciseName,
                              muscleGroup: activeExercise.muscleGroup ?? 'General',
                              category: activeExercise.muscleGroup ?? 'General',
                              equipment: activeExercise.equipment ?? 'Standard',
                              defaultSets: activeExercise.sets.isNotEmpty ? activeExercise.sets.length : 4,
                            ),
                            completedSets: activeExercise.sets.where((s) => s.completed).toList(),
                            prBenchmark: _getPrForExercise(activeExercise.exerciseId),
                            onCompleteSet: (set) => _handleSetCompleted(activeExercise, set),
                          ),
                          const SizedBox(height: 10),
                          Center(
                            child: TextButton.icon(
                              onPressed: () => _handleAddSet(activeExercise),
                              icon: const Icon(Icons.add, size: 16, color: Color(0xFFE5A93C)),
                              label: const Text(
                                'ADD EXTRA SET',
                                style: TextStyle(
                                  fontFamily: 'JetBrains Mono',
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFE5A93C),
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
            ),

            // Bottom workout telemetry bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xFF13171F),
                border: Border(top: BorderSide(color: Color(0xFF1F2430))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'COMPLETED SETS',
                        style: TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 9,
                          color: Color(0xFF8B949E),
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$totalCompletedSets / $totalPlannedSets',
                        style: const TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFF0F6FC),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'TOTAL VOLUME',
                        style: TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 9,
                          color: Color(0xFF8B949E),
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${totalVolume.toInt()} KG',
                        style: const TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFE5A93C),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
