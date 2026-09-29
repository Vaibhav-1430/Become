import 'package:flutter/material.dart';
import '../../core/theme/forge_colors.dart';
import '../../core/theme/forge_spacing.dart';
import '../../core/theme/forge_typography.dart';

/// Tactical Divider matching Stitch specifications.
/// Uses a centered badge over a continuous structural line.
class ForgeDivider extends StatelessWidget {
  final String? label;
  final bool showDots;

  const ForgeDivider({
    super.key,
    this.label,
    this.showDots = false,
  });

  @override
  Widget build(BuildContext context) {
    if (label == null) {
      return const Divider(
        color: ForgeColors.surfaceContainer,
        thickness: 1,
        height: ForgeSpacing.spaceLg,
      );
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        const Divider(
          color: ForgeColors.surfaceContainer,
          thickness: 1,
          height: ForgeSpacing.spaceLg,
        ),
        Container(
          color: ForgeColors.canvas,
          padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceSm),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (showDots) ...[
                Container(
                  width: 5,
                  height: 5,
                  decoration: const BoxDecoration(
                    color: ForgeColors.outlineVariant,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Text(
                  label!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.outlineVariant,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              if (showDots) ...[
                const SizedBox(width: 6),
                Container(
                  width: 5,
                  height: 5,
                  decoration: const BoxDecoration(
                    color: ForgeColors.outlineVariant,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
