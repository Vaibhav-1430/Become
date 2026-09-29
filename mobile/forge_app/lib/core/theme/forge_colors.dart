import 'package:flutter/material.dart';

/// Centralized color palette for the FORGE mobile app based on the
/// Stitch "Kinetic Discipline" design system (Technical Precision / Modern Industrial).
abstract final class ForgeColors {
  // Canvas & Surfaces
  static const Color canvas = Color(0xFF0C0E12); // surface-container-lowest
  static const Color surfaceContainerLowest = Color(0xFF0C0E12);
  static const Color surface = Color(0xFF111317); // surface & background
  static const Color surfaceDim = Color(0xFF111317);
  static const Color surfaceBright = Color(0xFF37393E);
  static const Color surfaceContainerLow = Color(0xFF1A1C20);
  static const Color surfaceContainer = Color(0xFF1E2024);
  static const Color surfaceContainerHigh = Color(0xFF282A2E);
  static const Color surfaceContainerHighest = Color(0xFF333539);
  static const Color surfaceVariant = Color(0xFF333539);

  // Structural Borders
  static const Color borderSubtle = Color(0xFF262D3D);
  static const Color borderLight = Color(0x14FFFFFF); // rgba(255, 255, 255, 0.08)
  static const Color outline = Color(0xFF9D8F7C);
  static const Color outlineVariant = Color(0xFF504535);

  // Primary / Industrial Amber Accents
  static const Color primaryContainer = Color(0xFFE5A93C); // Core Amber Accent
  static const Color primary = Color(0xFFFFC665); // High-contrast amber display
  static const Color primaryFixed = Color(0xFFFFDEAD);
  static const Color primaryFixedDim = Color(0xFFFABC4D);
  static const Color onPrimary = Color(0xFF432C00);
  static const Color onPrimaryContainer = Color(0xFF5E4000);
  static const Color inversePrimary = Color(0xFF7E5700);

  // Secondary Accents (Engineering Cyan/Blue)
  static const Color secondary = Color(0xFF7BD0FF);
  static const Color secondaryContainer = Color(0xFF00A6E0);
  static const Color onSecondary = Color(0xFF00354A);
  static const Color onSecondaryContainer = Color(0xFF00374D);
  static const Color secondaryFixed = Color(0xFFC4E7FF);
  static const Color secondaryFixedDim = Color(0xFF7BD0FF);

  // Tertiary Accents (System Online / Passing / Algorithmic Green)
  static const Color tertiary = Color(0xFF59E8AB);
  static const Color tertiaryContainer = Color(0xFF35CB91);
  static const Color onTertiary = Color(0xFF003824);
  static const Color onTertiaryContainer = Color(0xFF005035);
  static const Color tertiaryFixed = Color(0xFF6FFBBE);
  static const Color tertiaryFixedDim = Color(0xFF4EDEA3);

  // Status & Semantic Signals
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFFFB4AB);
  static const Color errorContainer = Color(0xFF93000A);
  static const Color onError = Color(0xFF690005);
  static const Color onErrorContainer = Color(0xFFFFDAD6);
  static const Color info = Color(0xFF38BDF8);

  // Text Hierarchy
  static const Color onSurface = Color(0xFFE2E2E8); // Primary text
  static const Color onSurfaceVariant = Color(0xFFD4C4B0); // Secondary text
  static const Color textMuted = Color(0xFF64748B); // Slate muted text
  static const Color inverseSurface = Color(0xFFE2E2E8);
  static const Color inverseOnSurface = Color(0xFF2F3035);

  // Design system aliases
  static const Color accentAmber = primaryContainer;
  static const Color textPrimary = onSurface;
  static const Color textSecondary = onSurfaceVariant;
  static const Color surfaceLevel1 = surfaceContainerLow;
  static const Color surfaceLevel2 = surfaceContainerHigh;
  static const Color surfaceLevel3 = surfaceContainerHighest;
}
