import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/models/test_question.dart';
import '../../domain/models/test_session.dart';

/// Modal bottom sheet displaying the interactive Question Palette matrix.
class QuestionPaletteSheet extends StatelessWidget {
  final TestSession session;
  final ValueChanged<int> onSelectQuestion;

  const QuestionPaletteSheet({
    super.key,
    required this.session,
    required this.onSelectQuestion,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: ForgeColors.surfaceLevel2,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        border: Border(
          top: BorderSide(color: ForgeColors.borderSubtle),
          left: BorderSide(color: ForgeColors.borderSubtle),
          right: BorderSide(color: ForgeColors.borderSubtle),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: ForgeColors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'QUESTION PALETTE',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${session.answeredCount}/${session.totalQuestions} Answered',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.accentAmber,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Legend
            Wrap(
              spacing: 12,
              runSpacing: 6,
              children: [
                _buildLegendItem(ForgeColors.accentAmber, 'Active'),
                _buildLegendItem(const Color(0xFF10B981), 'Answered'),
                _buildLegendItem(const Color(0xFFF59E0B), 'Flagged'),
                _buildLegendItem(ForgeColors.surfaceLevel1, 'Unanswered'),
              ],
            ),
            const SizedBox(height: 16),
            // Question Matrix
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(session.questions.length, (idx) {
                final q = session.questions[idx];
                final state = session.states[q.id];
                final isCurrent = idx == session.currentIndex;
                final isAnswered = state?.isAnswered ?? false;
                final isFlagged = state?.isFlagged ?? false;
                final isCoding = q.type == QuestionType.coding;

                Color bg = ForgeColors.surfaceLevel1;
                Color border = ForgeColors.borderSubtle;
                Color text = ForgeColors.textSecondary;

                if (isCurrent) {
                  border = ForgeColors.accentAmber;
                  text = ForgeColors.accentAmber;
                } else if (isAnswered) {
                  bg = const Color(0xFF10B981).withValues(alpha: 0.15);
                  border = const Color(0xFF10B981);
                  text = const Color(0xFF10B981);
                } else if (isFlagged) {
                  bg = const Color(0xFFF59E0B).withValues(alpha: 0.15);
                  border = const Color(0xFFF59E0B);
                  text = const Color(0xFFF59E0B);
                }

                return InkWell(
                  onTap: () {
                    Navigator.of(context).pop();
                    onSelectQuestion(idx);
                  },
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: border, width: isCurrent ? 2 : 1),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Text(
                          '${idx + 1}',
                          style: ForgeTypography.labelMd.copyWith(
                            color: text,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (isCoding)
                          Positioned(
                            bottom: 2,
                            child: Container(
                              width: 4,
                              height: 4,
                              decoration: const BoxDecoration(
                                color: ForgeColors.accentAmber,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        if (isFlagged && !isCurrent)
                          const Positioned(
                            top: 2,
                            right: 2,
                            child: Icon(
                              Icons.bookmark,
                              size: 10,
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: ForgeTypography.labelSm.copyWith(
            color: ForgeColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
