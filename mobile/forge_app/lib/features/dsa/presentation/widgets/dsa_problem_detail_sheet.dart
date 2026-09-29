import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/dsa_problem.dart';

class DsaProblemDetailSheet extends StatelessWidget {
  final DsaProblem problem;
  final ValueChanged<bool> onToggleSolved;

  const DsaProblemDetailSheet({
    super.key,
    required this.problem,
    required this.onToggleSolved,
  });

  Color _getDifficultyColor(String diff) {
    switch (diff.toLowerCase()) {
      case 'easy':
        return ForgeColors.tertiary;
      case 'medium':
        return ForgeColors.primary;
      case 'hard':
        return ForgeColors.error;
      default:
        return ForgeColors.primary;
    }
  }

  Future<void> _launchExternalUrl(BuildContext context, String urlString) async {
    final uri = Uri.tryParse(urlString);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Could not open link: $urlString',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
            ),
            backgroundColor: ForgeColors.surfaceContainer,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final diffColor = _getDifficultyColor(problem.difficulty);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainer,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
            // Drag Handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: ForgeColors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Top Badges Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: diffColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: diffColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    problem.difficulty.toUpperCase(),
                    style: ForgeTypography.labelSm.copyWith(
                      color: diffColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ForgeColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: ForgeColors.borderSubtle),
                  ),
                  child: Text(
                    'ID #${problem.id}',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurfaceVariant,
                    ),
                  ),
                ),
                const Spacer(),
                if (problem.isSolved)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: ForgeColors.tertiary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: ForgeColors.tertiary.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.check_circle,
                          size: 13,
                          color: ForgeColors.tertiary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'SOLVED',
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.tertiary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Title
            Text(
              problem.title,
              style: ForgeTypography.headlineSm.copyWith(
                color: ForgeColors.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              problem.topicName,
              style: ForgeTypography.bodySm.copyWith(
                color: ForgeColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 20),

            // External Links Section
            Text(
              'LEARNING RESOURCES',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.onSurfaceVariant,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (problem.leetcodeUrl != null)
                  OutlinedButton.icon(
                    onPressed: () => _launchExternalUrl(context, problem.leetcodeUrl!),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: ForgeColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    ),
                    icon: const Icon(Icons.code, size: 16, color: ForgeColors.primary),
                    label: Text(
                      'LeetCode',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
                    ),
                  ),
                if (problem.articleUrl != null)
                  OutlinedButton.icon(
                    onPressed: () => _launchExternalUrl(context, problem.articleUrl!),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: ForgeColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    ),
                    icon: const Icon(Icons.menu_book, size: 16, color: ForgeColors.secondary),
                    label: Text(
                      'Article / Editorial',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
                    ),
                  ),
                if (problem.youtubeUrl != null)
                  OutlinedButton.icon(
                    onPressed: () => _launchExternalUrl(context, problem.youtubeUrl!),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: ForgeColors.borderSubtle),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    ),
                    icon: const Icon(Icons.play_circle_fill, size: 16, color: ForgeColors.error),
                    label: Text(
                      'Video Tutorial',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),

            // Primary Toggle Action Button
            GestureDetector(
              key: const Key('btn_toggle_problem_solved'),
              onTap: () {
                final nextVal = !problem.isSolved;
                onToggleSolved(nextVal);
              },
              child: Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  color: problem.isSolved
                      ? ForgeColors.surfaceContainerHigh
                      : ForgeColors.primary,
                  borderRadius: BorderRadius.circular(4),
                  border: problem.isSolved
                      ? Border.all(color: ForgeColors.error.withValues(alpha: 0.5))
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      problem.isSolved ? Icons.remove_done : Icons.check_circle,
                      size: 18,
                      color: problem.isSolved ? ForgeColors.error : ForgeColors.onPrimary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      problem.isSolved ? 'MARK AS UNSOLVED' : 'MARK SOLVED',
                      style: ForgeTypography.labelMd.copyWith(
                        color: problem.isSolved
                            ? ForgeColors.error
                            : ForgeColors.onPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
}
