import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../domain/mistake.dart';
import '../../data/mistake_repository.dart';
import '../widgets/add_edit_mistake_sheet.dart';

/// Screen for in-depth diagnosis and review of a single mistake record.
class MistakeDetailScreen extends StatefulWidget {
  final Mistake initialMistake;
  final MistakeRepository repository;
  final VoidCallback? onMistakeChanged;

  const MistakeDetailScreen({
    super.key,
    required this.initialMistake,
    required this.repository,
    this.onMistakeChanged,
  });

  @override
  State<MistakeDetailScreen> createState() => _MistakeDetailScreenState();
}

class _MistakeDetailScreenState extends State<MistakeDetailScreen> {
  late Mistake _mistake;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _mistake = widget.initialMistake;
  }

  Future<void> _toggleResolved() async {
    setState(() => _isLoading = true);
    try {
      final updated = await widget.repository.toggleResolved(_mistake.id, _mistake.resolved);
      setState(() => _mistake = updated);
      widget.onMistakeChanged?.call();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(updated.resolved
                ? 'Flaw marked as fixed! Conceptual mastery recorded.'
                : 'Flaw reopened for review.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _incrementRevisit() async {
    setState(() => _isLoading = true);
    try {
      final updated = await widget.repository.incrementRevisit(_mistake.id);
      setState(() => _mistake = updated);
      widget.onMistakeChanged?.call();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Revisit scheduled for ${updated.revisitDate}. Repeat count: ${updated.repeatCount}x')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to schedule revisit: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteMistake() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ForgeColors.surfaceContainer,
        title: Text('DELETE FLAW RECORD', style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.error)),
        content: Text(
          'Are you sure you want to permanently delete this mistake record from Error Defense?',
          style: ForgeTypography.bodyMd,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('CANCEL', style: ForgeTypography.labelMd.copyWith(color: ForgeColors.outline)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('DELETE', style: ForgeTypography.labelMd.copyWith(color: ForgeColors.error, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final ok = await widget.repository.deleteMistake(_mistake.id);
      if (ok) {
        widget.onMistakeChanged?.call();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Mistake record deleted.')),
          );
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete mistake: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openEditModal() {
    AddEditMistakeSheet.show(
      context,
      initialMistake: _mistake,
      onSave: (updated) async {
        final res = await widget.repository.updateMistake(updated);
        setState(() => _mistake = res);
        widget.onMistakeChanged?.call();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: ForgeColors.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ERROR DEFENSE // DIAGNOSIS',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outline,
                  letterSpacing: 1.0,
                ),
              ),
              Text(
                _mistake.topic,
                style: ForgeTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  color: ForgeColors.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: ForgeColors.outline),
            onPressed: _openEditModal,
            tooltip: 'Edit Classification',
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: ForgeColors.error),
            onPressed: _deleteMistake,
            tooltip: 'Delete Record',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(ForgeSpacing.margin),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Meta badges row
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: ForgeColors.surfaceContainer,
                      borderRadius: ForgeSpacing.borderRadiusXs,
                      border: Border.all(color: ForgeColors.primaryContainer.withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      _mistake.subject.toUpperCase(),
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.primaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: ForgeColors.surfaceContainer,
                      borderRadius: ForgeSpacing.borderRadiusXs,
                      border: Border.all(color: ForgeColors.outlineVariant),
                    ),
                    child: Text(
                      _mistake.source,
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _mistake.resolved
                          ? ForgeColors.tertiary.withValues(alpha: 0.15)
                          : ForgeColors.error.withValues(alpha: 0.15),
                      borderRadius: ForgeSpacing.borderRadiusXs,
                      border: Border.all(
                        color: _mistake.resolved ? ForgeColors.tertiary : ForgeColors.error,
                      ),
                    ),
                    child: Text(
                      _mistake.resolved ? 'FIXED ✓' : 'UNRESOLVED',
                      style: ForgeTypography.labelSm.copyWith(
                        color: _mistake.resolved ? ForgeColors.tertiary : ForgeColors.error,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (_mistake.repeatCount > 1)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: ForgeColors.primaryContainer.withValues(alpha: 0.2),
                        borderRadius: ForgeSpacing.borderRadiusXs,
                        border: Border.all(color: ForgeColors.primaryContainer),
                      ),
                      child: Text(
                        'REPEATED ${_mistake.repeatCount}×',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Question Title Card
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'QUESTION / PROBLEM',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _mistake.question,
                      style: ForgeTypography.headlineSm.copyWith(
                        fontWeight: FontWeight.w600,
                        color: ForgeColors.onSurface,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Logged on ${_mistake.date}',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outlineVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Deficit Box (Your Answer)
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLowest,
                  border: Border(
                    left: const BorderSide(color: ForgeColors.error, width: 3),
                    top: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
                    right: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
                    bottom: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.close, color: ForgeColors.error, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'DEFICIT (YOUR ANSWER / WHY I FAILED)',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.error,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _mistake.userAnswer?.isNotEmpty == true
                          ? _mistake.userAnswer!
                          : 'No incorrect answer text recorded.',
                      style: ForgeTypography.bodyMd.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Defense Protocol (Correct Answer)
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLowest,
                  border: Border(
                    left: const BorderSide(color: ForgeColors.tertiary, width: 3),
                    top: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
                    right: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
                    bottom: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check, color: ForgeColors.tertiary, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'DEFENSE PROTOCOL (CORRECT SOLUTION)',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.tertiary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _mistake.correctAnswer?.isNotEmpty == true
                          ? _mistake.correctAnswer!
                          : 'No reference answer recorded.',
                      style: ForgeTypography.bodyMd.copyWith(
                        color: ForgeColors.onSurface,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Explanation Box
              if (_mistake.explanation?.isNotEmpty == true) ...[
                Container(
                  padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                  decoration: BoxDecoration(
                    color: ForgeColors.surfaceContainerLow,
                    borderRadius: ForgeSpacing.borderRadiusSm,
                    border: Border.all(color: ForgeColors.secondary.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CONCEPT & INVARIANT EXPLANATION',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.secondary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _mistake.explanation!,
                        style: ForgeTypography.bodyMd.copyWith(
                          color: ForgeColors.onSurface,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // Mistake Type & Personal Note
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'MISTAKE CLASSIFICATION',
                            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: ForgeColors.surfaceContainerHigh,
                            borderRadius: ForgeSpacing.borderRadiusXs,
                          ),
                          child: Text(
                            _mistake.mistakeType,
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'PERSONAL NOTE / BLUNDER ANALYSIS:',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primaryContainer),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _mistake.personalNote?.isNotEmpty == true
                          ? _mistake.personalNote!
                          : 'No personal notes logged.',
                      style: ForgeTypography.bodySm.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Revisit Schedule Row
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('SCHEDULED REVISIT (SRS)', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                          const SizedBox(height: 2),
                          Text(
                            _mistake.revisitDate ?? 'Not set',
                            style: ForgeTypography.bodyMd.copyWith(
                              color: ForgeColors.primaryContainer,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _isLoading ? null : _incrementRevisit,
                      icon: const Icon(Icons.replay, size: 16, color: ForgeColors.primaryContainer),
                      label: Text(
                        'REVISIT (+3d)',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Primary Toggle Action
              _mistake.resolved
                  ? ForgeSecondaryButton(
                      label: 'REOPEN DEFICIT',
                      leading: const Icon(Icons.refresh, size: 18, color: ForgeColors.error),
                      onPressed: _isLoading ? null : _toggleResolved,
                    )
                  : ForgePrimaryButton(
                      label: 'MARK FIXED ✓',
                      leading: const Icon(Icons.check_circle_outline, size: 18, color: ForgeColors.canvas),
                      isLoading: _isLoading,
                      onPressed: _toggleResolved,
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
