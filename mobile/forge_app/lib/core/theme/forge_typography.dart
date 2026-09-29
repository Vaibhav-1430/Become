import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'forge_colors.dart';

/// Centralized typography based on Stitch Kinetic Discipline.
/// Headlines and Body use Inter; Metrics and Technical UI labels use JetBrains Mono.
abstract final class ForgeTypography {
  // --- INTER (Headlines, Body, General UI) ---

  static TextStyle get headlineXl => GoogleFonts.inter(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 38 / 32,
        letterSpacing: -0.64,
        color: ForgeColors.onSurface,
      );

  static TextStyle get headlineLg => GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 30 / 24,
        letterSpacing: -0.36,
        color: ForgeColors.onSurface,
      );

  static TextStyle get headlineMd => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 26 / 20,
        letterSpacing: -0.20,
        color: ForgeColors.onSurface,
      );

  static TextStyle get headlineSm => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 22 / 16,
        letterSpacing: -0.08,
        color: ForgeColors.onSurface,
      );

  static TextStyle get bodyLg => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 24 / 16,
        color: ForgeColors.onSurface,
      );

  static TextStyle get bodyMd => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 20 / 14,
        color: ForgeColors.onSurface,
      );

  static TextStyle get bodySm => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 16 / 12,
        color: ForgeColors.onSurfaceVariant,
      );

  // --- JETBRAINS MONO (Technical Instrumentation, Metrics, Status Pills, Timestamps) ---

  static TextStyle get monoMetric => GoogleFonts.jetBrainsMono(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        height: 32 / 28,
        letterSpacing: -0.56,
        color: ForgeColors.onSurface,
      );

  static TextStyle get labelLg => GoogleFonts.jetBrainsMono(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 18 / 14,
        letterSpacing: 0.28,
        color: ForgeColors.onSurface,
      );

  static TextStyle get labelMd => GoogleFonts.jetBrainsMono(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 16 / 12,
        letterSpacing: 0.36,
        color: ForgeColors.onSurfaceVariant,
      );

  static TextStyle get labelSm => GoogleFonts.jetBrainsMono(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        height: 14 / 10,
        letterSpacing: 0.40,
        color: ForgeColors.outline,
      );
}
