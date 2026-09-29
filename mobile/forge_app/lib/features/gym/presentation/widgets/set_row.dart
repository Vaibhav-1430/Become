import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/workout_set.dart';

class CompletedSetRow extends StatelessWidget {
  final WorkoutSet set;
  final VoidCallback? onDelete;

  const CompletedSetRow({
    super.key,
    required this.set,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLowest.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: ForgeColors.borderSubtle.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: Text(
              set.setNumber.toString().padLeft(2, '0'),
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.onSurfaceVariant,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              '${set.weightKg.toStringAsFixed(1)} kg',
              textAlign: TextAlign.right,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 44,
            child: Text(
              '${set.reps}',
              textAlign: TextAlign.right,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: ForgeColors.tertiary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(3),
              border: Border.all(color: ForgeColors.tertiary.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check, size: 12, color: ForgeColors.tertiary),
                const SizedBox(width: 3),
                Text(
                  set.isWeightPr ? 'PR' : 'DONE',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.tertiary,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class QueuedSetRow extends StatelessWidget {
  final int setNumber;
  final double targetWeight;
  final String targetReps;

  const QueuedSetRow({
    super.key,
    required this.setNumber,
    required this.targetWeight,
    required this.targetReps,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLowest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: ForgeColors.borderSubtle.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: Text(
              setNumber.toString().padLeft(2, '0'),
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              '${targetWeight.toStringAsFixed(1)} kg',
              textAlign: TextAlign.right,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
              ),
            ),
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 44,
            child: Text(
              targetReps,
              textAlign: TextAlign.right,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: BorderRadius.circular(3),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Text(
              'QUEUED',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
                fontSize: 9,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ActiveTargetSetCard extends StatefulWidget {
  final int setNumber;
  final double initialWeight;
  final int initialReps;
  final ValueChanged<WorkoutSet> onCompleteSet;

  const ActiveTargetSetCard({
    super.key,
    required this.setNumber,
    required this.initialWeight,
    required this.initialReps,
    required this.onCompleteSet,
  });

  @override
  State<ActiveTargetSetCard> createState() => _ActiveTargetSetCardState();
}

class _ActiveTargetSetCardState extends State<ActiveTargetSetCard> {
  late double _weight;
  late int _reps;

  @override
  void initState() {
    super.initState();
    _weight = widget.initialWeight;
    _reps = widget.initialReps;
  }

  void _adjustWeight(double delta) {
    setState(() {
      _weight = (_weight + delta).clamp(0.0, 500.0);
    });
  }

  void _adjustReps(int delta) {
    setState(() {
      _reps = (_reps + delta).clamp(0, 100);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainer,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: ForgeColors.primaryContainer,
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: ForgeColors.primaryContainer.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(3),
                      border: Border.all(
                        color: ForgeColors.primaryContainer.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Text(
                      'SET ${widget.setNumber.toString().padLeft(2, '0')}',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.primaryContainer,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'CURRENT TARGET',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurface,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              Text(
                'GOAL: 8-10 REPS',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.onSurfaceVariant,
                  fontSize: 10,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Stepper Controls Row (Ergonomic 48px touch targets)
          Row(
            children: [
              // Weight Stepper
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: ForgeColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: ForgeColors.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'WEIGHT (KG)',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.outline,
                          fontSize: 9,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            key: const Key('btn_weight_decrement'),
                            onPressed: () => _adjustWeight(-2.5),
                            icon: const Icon(Icons.remove, size: 18),
                            style: IconButton.styleFrom(
                              backgroundColor: ForgeColors.surfaceContainer,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              minimumSize: const Size(36, 36),
                              padding: EdgeInsets.zero,
                            ),
                          ),
                          Text(
                            _weight.toStringAsFixed(1),
                            key: const Key('active_set_weight_text'),
                            style: ForgeTypography.headlineSm.copyWith(
                              color: ForgeColors.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          IconButton(
                            key: const Key('btn_weight_increment'),
                            onPressed: () => _adjustWeight(2.5),
                            icon: const Icon(Icons.add, size: 18),
                            style: IconButton.styleFrom(
                              backgroundColor: ForgeColors.surfaceContainer,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              minimumSize: const Size(36, 36),
                              padding: EdgeInsets.zero,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Reps Stepper
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: ForgeColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: ForgeColors.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'REPETITIONS',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.outline,
                          fontSize: 9,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            key: const Key('btn_reps_decrement'),
                            onPressed: () => _adjustReps(-1),
                            icon: const Icon(Icons.remove, size: 18),
                            style: IconButton.styleFrom(
                              backgroundColor: ForgeColors.surfaceContainer,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              minimumSize: const Size(36, 36),
                              padding: EdgeInsets.zero,
                            ),
                          ),
                          Text(
                            '$_reps',
                            key: const Key('active_set_reps_text'),
                            style: ForgeTypography.headlineSm.copyWith(
                              color: ForgeColors.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          IconButton(
                            key: const Key('btn_reps_increment'),
                            onPressed: () => _adjustReps(1),
                            icon: const Icon(Icons.add, size: 18),
                            style: IconButton.styleFrom(
                              backgroundColor: ForgeColors.surfaceContainer,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              minimumSize: const Size(36, 36),
                              padding: EdgeInsets.zero,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Quick Calibration Chips
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton(
                onPressed: () => _adjustWeight(-2.5),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(60, 28),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  side: const BorderSide(color: ForgeColors.borderSubtle),
                ),
                child: Text('-2.5 kg', style: ForgeTypography.labelSm.copyWith(fontSize: 10)),
              ),
              const SizedBox(width: 6),
              OutlinedButton(
                onPressed: () => _adjustWeight(2.5),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(60, 28),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  side: const BorderSide(color: ForgeColors.borderSubtle),
                ),
                child: Text('+2.5 kg', style: ForgeTypography.labelSm.copyWith(fontSize: 10)),
              ),
              const SizedBox(width: 6),
              OutlinedButton(
                onPressed: () => _adjustReps(1),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(54, 28),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  side: const BorderSide(color: ForgeColors.borderSubtle),
                ),
                child: Text('+1 rep', style: ForgeTypography.labelSm.copyWith(fontSize: 10)),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Complete Button (48px height)
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              key: const Key('btn_complete_active_set'),
              onPressed: () {
                final completedSet = WorkoutSet(
                  setNumber: widget.setNumber,
                  weightKg: _weight,
                  reps: _reps,
                  completed: true,
                  completedAt: DateTime.now(),
                );
                widget.onCompleteSet(completedSet);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: ForgeColors.primary,
                foregroundColor: ForgeColors.onPrimary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              icon: const Icon(Icons.done_all, size: 20),
              label: Text(
                'COMPLETE SET ${widget.setNumber}',
                style: ForgeTypography.labelMd.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: ForgeColors.onPrimary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
