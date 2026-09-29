import 'package:flutter/material.dart';
import '../../core/theme/forge_colors.dart';
import '../../core/theme/forge_spacing.dart';
import '../../core/theme/forge_typography.dart';

/// Status pill or technical metric pill styled with JetBrains Mono.
class ForgePill extends StatelessWidget {
  final String label;
  final Widget? leading;
  final Widget? trailing;
  final Color? dotColor;
  final Color? textColor;
  final Color? backgroundColor;
  final Color? borderColor;
  final EdgeInsetsGeometry padding;
  final TextStyle? textStyle;

  const ForgePill({
    super.key,
    required this.label,
    this.leading,
    this.trailing,
    this.dotColor,
    this.textColor,
    this.backgroundColor,
    this.borderColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    this.textStyle,
  });

  /// Factory for a status dot badge (e.g. `SYS :: READY` or `SYSTEM :: ONLINE`)
  factory ForgePill.status({
    Key? key,
    required String label,
    Color dotColor = ForgeColors.tertiary,
    Color? textColor,
  }) {
    return ForgePill(
      key: key,
      label: label,
      dotColor: dotColor,
      textColor: textColor ?? dotColor,
      backgroundColor: ForgeColors.surfaceContainerLow,
      borderColor: ForgeColors.outlineVariant.withValues(alpha: 0.5),
    );
  }

  /// Factory for bracketed monospace metric pill (e.g. `[LATENCY: 14ms]`)
  factory ForgePill.metric({
    Key? key,
    required String label,
    Color textColor = ForgeColors.outline,
    Color? backgroundColor,
  }) {
    return ForgePill(
      key: key,
      label: label,
      textColor: textColor,
      backgroundColor: backgroundColor ?? ForgeColors.surfaceContainer,
      borderColor: ForgeColors.outlineVariant.withValues(alpha: 0.4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor ?? ForgeColors.surfaceContainer,
        borderRadius: ForgeSpacing.borderRadiusXs,
        border: Border.all(
          color: borderColor ?? ForgeColors.outlineVariant.withValues(alpha: 0.5),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (dotColor != null) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: dotColor!.withValues(alpha: 0.5),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
          ],
          if (leading != null) ...[
            leading!,
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: textStyle ??
                ForgeTypography.labelSm.copyWith(
                  color: textColor ?? ForgeColors.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 4),
            trailing!,
          ],
        ],
      ),
    );
  }
}
