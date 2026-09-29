import 'package:flutter/material.dart';

/// Subtle technical precision CAD grid background.
/// Renders 24px grid lines at 0.02 opacity across the canvas.
class CadGridBackground extends StatelessWidget {
  final Widget? child;
  final double opacity;

  const CadGridBackground({
    super.key,
    this.child,
    this.opacity = 0.6,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _CadGridPainter(opacity: opacity),
      child: child,
    );
  }
}

class _CadGridPainter extends CustomPainter {
  final double opacity;

  _CadGridPainter({required this.opacity});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.025 * opacity)
      ..strokeWidth = 1.0;

    const double step = 24.0;

    for (double x = 0; x <= size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    for (double y = 0; y <= size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _CadGridPainter oldDelegate) =>
      oldDelegate.opacity != opacity;
}
