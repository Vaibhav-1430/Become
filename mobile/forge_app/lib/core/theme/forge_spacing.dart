import 'package:flutter/material.dart';

/// Spacing and dimensions for FORGE mobile following the 4px/8px grid system.
abstract final class ForgeSpacing {
  static const double spaceXs = 4.0;
  static const double spaceSm = 8.0;
  static const double spaceMd = 12.0;
  static const double spaceLg = 16.0;
  static const double spaceXl = 24.0;
  static const double space2Xl = 32.0;

  // Layout gutters & margins
  static const double margin = 16.0;
  static const double marginExpanded = 20.0;
  static const double gutter = 16.0;
  static const double gutterCompact = 8.0;

  // Component heights
  static const double buttonHeight = 48.0;
  static const double primaryButtonHeight = 52.0;
  static const double inputHeight = 44.0;
  static const double topBarHeight = 56.0;
  static const double bottomNavHeight = 64.0;

  // Corner radii (Soft Industrial)
  static const double radiusXs = 2.0;
  static const double radiusSm = 4.0;
  static const double radiusMd = 6.0;
  static const double radiusLg = 8.0;
  static const double radiusXl = 12.0;
  static const double radiusFull = 999.0;

  static const BorderRadius borderRadiusXs = BorderRadius.all(Radius.circular(radiusXs));
  static const BorderRadius borderRadiusSm = BorderRadius.all(Radius.circular(radiusSm));
  static const BorderRadius borderRadiusMd = BorderRadius.all(Radius.circular(radiusMd));
  static const BorderRadius borderRadiusLg = BorderRadius.all(Radius.circular(radiusLg));
  static const BorderRadius borderRadiusXl = BorderRadius.all(Radius.circular(radiusXl));
}
