import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';

/// The official FORGE Monolithic Emblem.
/// Features corner register ticks and the precision isometric anvil/core lattice monogram.
class ForgeEmblem extends StatelessWidget {
  final double size;

  const ForgeEmblem({
    super.key,
    this.size = 80.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainer,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(
          color: ForgeColors.outlineVariant.withValues(alpha: 0.6),
          width: 1.0,
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Corner Register Ticks
          Positioned(
            top: -1,
            left: -1,
            child: _buildCornerTick(isTop: true, isLeft: true),
          ),
          Positioned(
            top: -1,
            right: -1,
            child: _buildCornerTick(isTop: true, isLeft: false),
          ),
          Positioned(
            bottom: -1,
            left: -1,
            child: _buildCornerTick(isTop: false, isLeft: true),
          ),
          Positioned(
            bottom: -1,
            right: -1,
            child: _buildCornerTick(isTop: false, isLeft: false),
          ),
          // Central Vector Monogram
          Center(
            child: SizedBox(
              width: size * 0.5,
              height: size * 0.5,
              child: CustomPaint(
                painter: _EmblemMonogramPainter(
                  accentColor: ForgeColors.primaryContainer,
                  fillColor: const Color(0xFF13171F),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCornerTick({required bool isTop, required bool isLeft}) {
    return Container(
      width: 6,
      height: 6,
      decoration: BoxDecoration(
        border: Border(
          top: isTop
              ? const BorderSide(color: ForgeColors.primary, width: 1.5)
              : BorderSide.none,
          bottom: !isTop
              ? const BorderSide(color: ForgeColors.primary, width: 1.5)
              : BorderSide.none,
          left: isLeft
              ? const BorderSide(color: ForgeColors.primary, width: 1.5)
              : BorderSide.none,
          right: !isLeft
              ? const BorderSide(color: ForgeColors.primary, width: 1.5)
              : BorderSide.none,
        ),
      ),
    );
  }
}

class _EmblemMonogramPainter extends CustomPainter {
  final Color accentColor;
  final Color fillColor;

  _EmblemMonogramPainter({
    required this.accentColor,
    required this.fillColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 40.0;

    Offset pt(double x, double y) => Offset(x * scale, y * scale);

    // 1. Outer Hexagon Lattice (opacity 0.4)
    final outerPaint = Paint()
      ..color = accentColor.withValues(alpha: 0.4)
      ..strokeWidth = 1.5 * scale
      ..style = PaintingStyle.stroke
      ..strokeJoin = StrokeJoin.round;

    final outerPath = Path()
      ..moveTo(pt(20, 4).dx, pt(20, 4).dy)
      ..lineTo(pt(34, 12).dx, pt(34, 12).dy)
      ..lineTo(pt(34, 28).dx, pt(34, 28).dy)
      ..lineTo(pt(20, 36).dx, pt(20, 36).dy)
      ..lineTo(pt(6, 28).dx, pt(6, 28).dy)
      ..lineTo(pt(6, 12).dx, pt(6, 12).dy)
      ..close();
    canvas.drawPath(outerPath, outerPaint);

    // 2. Inner Anvil Hexagon (Filled with #13171F and stroked with accent)
    final innerFillPaint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;

    final innerStrokePaint = Paint()
      ..color = accentColor
      ..strokeWidth = 1.75 * scale
      ..style = PaintingStyle.stroke
      ..strokeJoin = StrokeJoin.round;

    final innerPath = Path()
      ..moveTo(pt(20, 10).dx, pt(20, 10).dy)
      ..lineTo(pt(29, 15.5).dx, pt(29, 15.5).dy)
      ..lineTo(pt(29, 26.5).dx, pt(29, 26.5).dy)
      ..lineTo(pt(20, 32).dx, pt(20, 32).dy)
      ..lineTo(pt(11, 26.5).dx, pt(11, 26.5).dy)
      ..lineTo(pt(11, 15.5).dx, pt(11, 15.5).dy)
      ..close();
    canvas.drawPath(innerPath, innerFillPaint);
    canvas.drawPath(innerPath, innerStrokePaint);

    // 3. Central Convergence Lines
    final linePaint = Paint()
      ..color = accentColor
      ..strokeWidth = 1.5 * scale
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(pt(20, 10), pt(20, 20), linePaint);
    canvas.drawLine(pt(20, 20), pt(29, 25), linePaint);
    canvas.drawLine(pt(20, 20), pt(11, 25), linePaint);

    // 4. Center Anchor Circle
    final circlePaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(pt(20, 20), 2.0 * scale, circlePaint);
  }

  @override
  bool shouldRepaint(covariant _EmblemMonogramPainter oldDelegate) =>
      oldDelegate.accentColor != accentColor || oldDelegate.fillColor != fillColor;
}
