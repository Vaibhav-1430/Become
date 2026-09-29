import 'package:flutter/material.dart';
import '../../core/theme/forge_colors.dart';
import '../../core/theme/forge_spacing.dart';

/// Reusable Chassis / Card component for FORGE.
/// Clean, dark container with crisp borders and optional accent stripe.
class ForgeCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? backgroundColor;
  final Color? borderColor;
  final double borderWidth;
  final Color? leftAccentColor;
  final double leftAccentWidth;
  final BorderRadius? borderRadius;

  const ForgeCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(ForgeSpacing.spaceMd),
    this.backgroundColor,
    this.borderColor,
    this.borderWidth = 1.0,
    this.leftAccentColor,
    this.leftAccentWidth = 0.0,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorderRadius = borderRadius ?? ForgeSpacing.borderRadiusSm;
    final effectiveBg = backgroundColor ?? ForgeColors.surfaceContainerLow;
    final effectiveBorderColor = borderColor ?? ForgeColors.outlineVariant.withValues(alpha: 0.5);

    Widget content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: effectiveBg,
        borderRadius: effectiveBorderRadius,
        border: Border.all(
          color: effectiveBorderColor,
          width: borderWidth,
        ),
      ),
      child: child,
    );

    if (leftAccentColor != null && leftAccentWidth > 0) {
      content = ClipRRect(
        borderRadius: effectiveBorderRadius,
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(
                color: leftAccentColor!,
                width: leftAccentWidth,
              ),
            ),
          ),
          child: content,
        ),
      );
    }

    return content;
  }
}
