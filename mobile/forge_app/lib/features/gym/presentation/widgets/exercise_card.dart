import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/exercise.dart';
import '../../domain/workout_set.dart';
import '../../domain/personal_record.dart';
import 'set_row.dart';

class ActiveExerciseCard extends StatelessWidget {
  final int exerciseIndex;
  final Exercise exercise;
  final List<WorkoutSet> completedSets;
  final PersonalRecord? prBenchmark;
  final ValueChanged<WorkoutSet> onCompleteSet;

  const ActiveExerciseCard({
    super.key,
    required this.exerciseIndex,
    required this.exercise,
    required this.completedSets,
    this.prBenchmark,
    required this.onCompleteSet,
  });

  @override
  Widget build(BuildContext context) {
    final targetSets = exercise.defaultSets;
    final nextSetNumber = completedSets.length + 1;
    final isFinished = completedSets.length >= targetSets;

    // Default weight from previous sets or standard starting point
    final defaultWeight = completedSets.isNotEmpty
        ? completedSets.last.weightKg
        : (prBenchmark != null ? prBenchmark!.maxWeightKg * 0.9 : 60.0);
    final defaultReps = completedSets.isNotEmpty ? completedSets.last.reps : 10;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle.withValues(alpha: 0.8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'EXERCISE ${exerciseIndex.toString().padLeft(2, '0')} // ${exercise.category.toUpperCase()}',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    exercise.name,
                    style: ForgeTypography.headlineSm.copyWith(
                      color: ForgeColors.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Target: ${exercise.defaultSets} Sets × ${exercise.defaultReps} • Rest: ${exercise.defaultRestSeconds}s',
                    style: ForgeTypography.bodySm.copyWith(
                      color: ForgeColors.onSurfaceVariant,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const Icon(Icons.fitness_center, color: ForgeColors.outline, size: 20),
            ],
          ),
          const SizedBox(height: 10),

          // PR Banner Pill
          if (prBenchmark != null)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: ForgeColors.borderSubtle.withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.emoji_events, size: 14, color: ForgeColors.primary),
                  const SizedBox(width: 6),
                  Text(
                    'SESSION PR BENCHMARK: ',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.outline,
                      fontSize: 10,
                    ),
                  ),
                  Text(
                    '${prBenchmark!.maxWeightKg.toStringAsFixed(1)} kg × ${prBenchmark!.maxReps} reps',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),

          // Set Execution Matrix Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            child: Row(
              children: [
                SizedBox(
                  width: 32,
                  child: Text(
                    'SET',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline, fontSize: 10),
                  ),
                ),
                Expanded(
                  child: Text(
                    'WEIGHT',
                    textAlign: TextAlign.right,
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline, fontSize: 10),
                  ),
                ),
                const SizedBox(width: 16),
                SizedBox(
                  width: 44,
                  child: Text(
                    'REPS',
                    textAlign: TextAlign.right,
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline, fontSize: 10),
                  ),
                ),
                const SizedBox(width: 16),
                SizedBox(
                  width: 54,
                  child: Text(
                    'STATUS',
                    textAlign: TextAlign.right,
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline, fontSize: 10),
                  ),
                ),
              ],
            ),
          ),

          // Render Completed Sets
          for (final set in completedSets) CompletedSetRow(set: set),

          // Render Active Set (if not finished)
          if (!isFinished)
            ActiveTargetSetCard(
              setNumber: nextSetNumber,
              initialWeight: defaultWeight,
              initialReps: defaultReps,
              onCompleteSet: onCompleteSet,
            ),

          // Render Remaining Queued Sets
          for (int s = nextSetNumber + 1; s <= targetSets; s++)
            QueuedSetRow(
              setNumber: s,
              targetWeight: defaultWeight,
              targetReps: exercise.defaultReps,
            ),
        ],
      ),
    );
  }
}

class UpcomingExerciseCard extends StatelessWidget {
  final int exerciseIndex;
  final Exercise exercise;
  final List<WorkoutSet>? previousPerformance;

  const UpcomingExerciseCard({
    super.key,
    required this.exerciseIndex,
    required this.exercise,
    this.previousPerformance,
  });

  @override
  Widget build(BuildContext context) {
    String prevSummary = 'No previous record';
    if (previousPerformance != null && previousPerformance!.isNotEmpty) {
      final best = previousPerformance!.reduce((a, b) => a.weightKg > b.weightKg ? a : b);
      prevSummary = '${best.weightKg.toStringAsFixed(1)} kg × ${best.reps}';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: ForgeColors.borderSubtle.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'EXERCISE ${exerciseIndex.toString().padLeft(2, '0')} // ${exercise.category.toUpperCase()}',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        fontSize: 9,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '0/${exercise.defaultSets} SETS',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  exercise.name,
                  style: ForgeTypography.bodyMd.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  '${exercise.muscleGroup} • ${exercise.defaultSets} Sets × ${exercise.defaultReps}',
                  style: ForgeTypography.bodySm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'PREV LOAD',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outline,
                  fontSize: 9,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                prevSummary,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
