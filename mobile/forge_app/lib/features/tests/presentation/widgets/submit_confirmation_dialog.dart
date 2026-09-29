import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/models/test_session.dart';

/// Modal dialog confirming assessment submission.
/// Displays clear inventory of answered vs unanswered items.
class SubmitConfirmationDialog extends StatelessWidget {
  final TestSession session;
  final VoidCallback onConfirm;

  const SubmitConfirmationDialog({
    super.key,
    required this.session,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final answered = session.answeredCount;
    final total = session.totalQuestions;
    final unanswered = total - answered;
    final flagged = session.flaggedCount;

    final remainingSec = session.remainingSeconds;
    final minutes = remainingSec ~/ 60;
    final seconds = remainingSec % 60;
    final timeStr = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    return Dialog(
      backgroundColor: ForgeColors.surfaceLevel2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: ForgeColors.borderSubtle),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.assessment_outlined,
                  color: ForgeColors.accentAmber,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'SUBMIT TEST ASSESSMENT?',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Inventory Table
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceLevel1,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: ForgeColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _buildInventoryRow('Answered Questions', '$answered / $total', const Color(0xFF10B981)),
                  const Divider(color: ForgeColors.borderSubtle, height: 12),
                  _buildInventoryRow('Unanswered Questions', '$unanswered', unanswered > 0 ? const Color(0xFFEF4444) : ForgeColors.textSecondary),
                  const Divider(color: ForgeColors.borderSubtle, height: 12),
                  _buildInventoryRow('Flagged for Review', '$flagged', const Color(0xFFF59E0B)),
                  const Divider(color: ForgeColors.borderSubtle, height: 12),
                  _buildInventoryRow('Remaining Time', timeStr, ForgeColors.accentAmber),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (unanswered > 0)
              Text(
                'Warning: You have $unanswered unanswered questions. Submitting now will finalize your score.',
                style: ForgeTypography.bodySm.copyWith(
                  color: const Color(0xFFEF4444),
                  fontSize: 11,
                ),
              ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ForgeColors.textPrimary,
                      side: const BorderSide(color: ForgeColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text('CONTINUE', style: ForgeTypography.labelSm),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      onConfirm();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ForgeColors.accentAmber,
                      foregroundColor: ForgeColors.canvas,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'SUBMIT FINAL',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.canvas,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: ForgeTypography.bodySm.copyWith(
            color: ForgeColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: ForgeTypography.labelSm.copyWith(
            color: valueColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
