import 'package:flutter/material.dart';
import '../../core/theme/forge_colors.dart';
import '../../core/theme/forge_spacing.dart';
import '../../core/theme/forge_typography.dart';

/// Industrial text input field matching Stitch specifications.
class ForgeTextField extends StatelessWidget {
  final String label;
  final String? rightTag;
  final Widget? rightAction;
  final bool isRequired;
  final String? hintText;
  final TextEditingController? controller;
  final bool isPassword;
  final bool isPasswordVisible;
  final VoidCallback? onTogglePasswordVisibility;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final TextInputType keyboardType;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final bool enabled;

  const ForgeTextField({
    super.key,
    required this.label,
    this.rightTag,
    this.rightAction,
    this.isRequired = false,
    this.hintText,
    this.controller,
    this.isPassword = false,
    this.isPasswordVisible = false,
    this.onTogglePasswordVisibility,
    this.leadingIcon,
    this.trailingIcon,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.onChanged,
    this.validator,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Label Header Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      label.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.onSurface,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  if (isRequired) ...[
                    const SizedBox(width: 4),
                    const Text(
                      '*',
                      style: TextStyle(
                        color: ForgeColors.primaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 6),
            if (rightAction != null)
              rightAction!
            else if (rightTag != null)
              Text(
                rightTag!,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outlineVariant,
                ),
              ),
          ],
        ),
        const SizedBox(height: ForgeSpacing.spaceXs + 2),
        // Input Container
        TextFormField(
          controller: controller,
          obscureText: isPassword && !isPasswordVisible,
          keyboardType: keyboardType,
          onChanged: onChanged,
          validator: validator,
          enabled: enabled,
          style: ForgeTypography.labelMd.copyWith(
            color: ForgeColors.onSurface,
            letterSpacing: isPassword && !isPasswordVisible ? 2.0 : 0.2,
          ),
          cursorColor: ForgeColors.primaryContainer,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: ForgeTypography.labelMd.copyWith(
              color: ForgeColors.outlineVariant.withValues(alpha: 0.7),
            ),
            filled: true,
            fillColor: ForgeColors.surface,
            prefixIcon: leadingIcon != null
                ? Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: leadingIcon,
                  )
                : null,
            prefixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 20),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      isPasswordVisible ? Icons.visibility_off : Icons.visibility,
                      color: ForgeColors.onSurfaceVariant,
                      size: 18,
                    ),
                    onPressed: onTogglePasswordVisibility,
                  )
                : trailingIcon,
            suffixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 20),
            errorText: errorText,
            errorStyle: ForgeTypography.labelSm.copyWith(color: ForgeColors.error),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: ForgeSpacing.spaceMd,
              vertical: 12,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: ForgeSpacing.borderRadiusSm,
              borderSide: const BorderSide(
                color: ForgeColors.surfaceContainer,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: ForgeSpacing.borderRadiusSm,
              borderSide: const BorderSide(
                color: ForgeColors.primaryContainer,
                width: 1,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: ForgeSpacing.borderRadiusSm,
              borderSide: const BorderSide(
                color: ForgeColors.error,
                width: 1,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: ForgeSpacing.borderRadiusSm,
              borderSide: const BorderSide(
                color: ForgeColors.error,
                width: 1,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
