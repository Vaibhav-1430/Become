import 'package:flutter/material.dart';
import '../../core/theme/forge_colors.dart';
import '../../core/theme/forge_spacing.dart';
import '../../core/theme/forge_typography.dart';

/// Primary Industrial CTA Button.
/// Matches Stitch specification: #E5A93C background with #0C0E12 bold text,
/// 48-52px height, 4px corner radius, and subtle tactile press feedback.
class ForgePrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Widget? leading;
  final Widget? trailing;
  final bool isLoading;
  final double height;
  final Color? backgroundColor;
  final Color? foregroundColor;

  const ForgePrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.height = ForgeSpacing.buttonHeight,
    this.backgroundColor,
    this.foregroundColor,
  });

  @override
  State<ForgePrimaryButton> createState() => _ForgePrimaryButtonState();
}

class _ForgePrimaryButtonState extends State<ForgePrimaryButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.backgroundColor ?? ForgeColors.primaryContainer;
    final fgColor = widget.foregroundColor ?? ForgeColors.canvas;

    return GestureDetector(
      onTapDown: widget.onPressed != null ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: widget.onPressed != null ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: SizedBox(
          width: double.infinity,
          height: widget.height,
          child: ElevatedButton(
            onPressed: widget.isLoading ? null : widget.onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: bgColor,
              foregroundColor: fgColor,
              disabledBackgroundColor: bgColor.withValues(alpha: 0.6),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: ForgeSpacing.borderRadiusSm,
              ),
              padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceLg),
            ),
            child: widget.isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (widget.leading != null) ...[
                        widget.leading!,
                        const SizedBox(width: ForgeSpacing.spaceSm),
                      ],
                      Flexible(
                        child: Text(
                          widget.label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: ForgeTypography.headlineSm.copyWith(
                            color: fgColor,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      if (widget.trailing != null) ...[
                        const SizedBox(width: ForgeSpacing.spaceSm),
                        widget.trailing!,
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// Secondary Ghost / Outlined Button.
/// Matches Stitch specification: #1E2024 surface, 1px border #504535, #E2E2E8 text.
class ForgeSecondaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Widget? leading;
  final Widget? trailing;
  final double height;
  final Color? backgroundColor;
  final Color? borderColor;

  const ForgeSecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.leading,
    this.trailing,
    this.height = ForgeSpacing.buttonHeight,
    this.backgroundColor,
    this.borderColor,
  });

  @override
  State<ForgeSecondaryButton> createState() => _ForgeSecondaryButtonState();
}

class _ForgeSecondaryButtonState extends State<ForgeSecondaryButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onPressed != null ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: widget.onPressed != null ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: SizedBox(
          width: double.infinity,
          height: widget.height,
          child: OutlinedButton(
            onPressed: widget.onPressed,
            style: OutlinedButton.styleFrom(
              backgroundColor: widget.backgroundColor ?? ForgeColors.surfaceContainer,
              foregroundColor: ForgeColors.onSurface,
              side: BorderSide(
                color: widget.borderColor ?? ForgeColors.outlineVariant,
                width: 1,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: ForgeSpacing.borderRadiusSm,
              ),
              padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceLg),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.leading != null) ...[
                  widget.leading!,
                  const SizedBox(width: ForgeSpacing.spaceSm),
                ],
                Flexible(
                  child: Text(
                    widget.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.onSurface,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                if (widget.trailing != null) ...[
                  const Spacer(),
                  widget.trailing!,
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
