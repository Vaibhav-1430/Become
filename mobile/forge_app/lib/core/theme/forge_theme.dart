import 'package:flutter/material.dart';
import 'forge_colors.dart';
import 'forge_spacing.dart';
import 'forge_typography.dart';

/// Dark Industrial ThemeData for FORGE.
abstract final class ForgeTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ForgeColors.canvas,
      canvasColor: ForgeColors.canvas,
      colorScheme: const ColorScheme(
        brightness: Brightness.dark,
        primary: ForgeColors.primaryContainer,
        onPrimary: ForgeColors.onPrimaryContainer,
        primaryContainer: ForgeColors.primaryContainer,
        onPrimaryContainer: ForgeColors.onPrimaryContainer,
        secondary: ForgeColors.secondary,
        onSecondary: ForgeColors.onSecondary,
        secondaryContainer: ForgeColors.secondaryContainer,
        onSecondaryContainer: ForgeColors.onSecondaryContainer,
        tertiary: ForgeColors.tertiary,
        onTertiary: ForgeColors.onTertiary,
        error: ForgeColors.error,
        onError: ForgeColors.onError,
        errorContainer: ForgeColors.errorContainer,
        onErrorContainer: ForgeColors.onErrorContainer,
        surface: ForgeColors.surface,
        onSurface: ForgeColors.onSurface,
        onSurfaceVariant: ForgeColors.onSurfaceVariant,
        outline: ForgeColors.outline,
        outlineVariant: ForgeColors.outlineVariant,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: ForgeColors.canvas,
        foregroundColor: ForgeColors.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: ForgeTypography.headlineSm,
        iconTheme: const IconThemeData(color: ForgeColors.onSurfaceVariant, size: 20),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ForgeColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: ForgeSpacing.spaceMd,
          vertical: ForgeSpacing.spaceSm + 2,
        ),
        hintStyle: ForgeTypography.labelMd.copyWith(
          color: ForgeColors.outlineVariant,
        ),
        labelStyle: ForgeTypography.labelSm.copyWith(
          color: ForgeColors.onSurfaceVariant,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: ForgeSpacing.borderRadiusSm,
          borderSide: const BorderSide(color: ForgeColors.surfaceContainer, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: ForgeSpacing.borderRadiusSm,
          borderSide: const BorderSide(color: ForgeColors.primaryContainer, width: 1),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: ForgeSpacing.borderRadiusSm,
          borderSide: const BorderSide(color: ForgeColors.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: ForgeSpacing.borderRadiusSm,
          borderSide: const BorderSide(color: ForgeColors.error, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ForgeColors.primaryContainer,
          foregroundColor: ForgeColors.canvas,
          textStyle: ForgeTypography.headlineSm.copyWith(
            fontWeight: FontWeight.bold,
          ),
          elevation: 0,
          minimumSize: const Size.fromHeight(ForgeSpacing.buttonHeight),
          shape: RoundedRectangleBorder(
            borderRadius: ForgeSpacing.borderRadiusSm,
          ),
          padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceLg),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ForgeColors.onSurface,
          backgroundColor: ForgeColors.surfaceContainer,
          textStyle: ForgeTypography.labelMd,
          elevation: 0,
          minimumSize: const Size.fromHeight(ForgeSpacing.buttonHeight),
          side: const BorderSide(color: ForgeColors.outlineVariant, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: ForgeSpacing.borderRadiusSm,
          ),
          padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceLg),
        ),
      ),
      cardTheme: CardThemeData(
        color: ForgeColors.surfaceContainerLow,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: ForgeSpacing.borderRadiusSm,
          side: const BorderSide(color: ForgeColors.outlineVariant, width: 0.8),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(
        color: ForgeColors.surfaceContainer,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
