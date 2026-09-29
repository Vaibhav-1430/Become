import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';

/// GitHub SSO Button styled identically to Stitch screens.
class GithubSsoButton extends StatelessWidget {
  final String label;
  final String? subtitle;
  final String? trailingTag;
  final VoidCallback onPressed;

  const GithubSsoButton({
    super.key,
    required this.label,
    this.subtitle,
    this.trailingTag,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: ForgeColors.surfaceContainer,
          foregroundColor: ForgeColors.onSurface,
          side: const BorderSide(color: ForgeColors.outlineVariant, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: ForgeSpacing.borderRadiusSm,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: ForgeSpacing.spaceMd,
            vertical: 12,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Custom GitHub Octocat Icon
            const CustomPaint(
              size: Size(18, 18),
              painter: _GithubIconPainter(color: ForgeColors.onSurface),
            ),
            const SizedBox(width: ForgeSpacing.spaceMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.onSurface,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.6,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (trailingTag != null) ...[
              const SizedBox(width: 4),
              Text(
                trailingTag!,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Google SSO Button matching Stitch specifications.
class GoogleSsoButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const GoogleSsoButton({
    super.key,
    this.label = 'CONTINUE WITH GOOGLE',
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: ForgeColors.surfaceContainerLow,
          foregroundColor: ForgeColors.onSurfaceVariant,
          side: const BorderSide(color: ForgeColors.surfaceContainer, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: ForgeSpacing.borderRadiusSm,
          ),
          padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceMd),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CustomPaint(
              size: Size(16, 16),
              painter: _GoogleIconPainter(),
            ),
            const SizedBox(width: ForgeSpacing.spaceMd),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: ForgeTypography.labelMd.copyWith(
                  color: ForgeColors.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Vector painter for the GitHub silhouette.
class _GithubIconPainter extends CustomPainter {
  final Color color;

  const _GithubIconPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    // Simplified clean SVG path for the GitHub mark
    final path = Path()
      ..moveTo(12, 2)
      ..cubicTo(6.477, 2, 2, 6.484, 2, 12.017)
      ..cubicTo(2, 16.442, 4.865, 20.222, 8.839, 21.546)
      ..cubicTo(9.339, 21.638, 9.521, 21.329, 9.521, 21.063)
      ..cubicTo(9.521, 20.826, 9.513, 20.195, 9.508, 19.36)
      ..cubicTo(6.726, 19.965, 6.139, 18.017, 6.139, 18.017)
      ..cubicTo(5.685, 16.859, 5.029, 16.551, 5.029, 16.551)
      ..cubicTo(4.121, 15.931, 5.098, 15.943, 5.098, 15.943)
      ..cubicTo(6.101, 16.013, 6.628, 16.975, 6.628, 16.975)
      ..cubicTo(7.52, 18.505, 8.969, 18.063, 9.538, 17.807)
      ..cubicTo(9.63, 17.16, 9.888, 16.719, 10.174, 16.469)
      ..cubicTo(7.954, 16.216, 5.619, 15.356, 5.619, 11.518)
      ..cubicTo(5.619, 10.425, 6.009, 9.53, 6.648, 8.83)
      ..cubicTo(6.545, 8.577, 6.202, 7.558, 6.746, 6.18)
      ..cubicTo(6.746, 6.18, 7.586, 5.91, 9.496, 7.206)
      ..cubicTo(10.294, 6.984, 11.147, 6.873, 12, 6.869)
      ..cubicTo(12.85, 6.873, 13.705, 6.984, 14.504, 7.206)
      ..cubicTo(16.413, 5.91, 17.251, 6.18, 17.251, 6.18)
      ..cubicTo(17.797, 7.558, 17.454, 8.577, 17.352, 8.83)
      ..cubicTo(17.992, 9.53, 18.38, 10.425, 18.38, 11.518)
      ..cubicTo(18.38, 15.366, 16.041, 16.213, 13.814, 16.461)
      ..cubicTo(14.173, 16.77, 14.492, 17.381, 14.492, 18.316)
      ..cubicTo(14.492, 19.654, 14.48, 20.735, 14.48, 21.063)
      ..cubicTo(14.48, 21.331, 14.66, 21.643, 15.168, 21.545)
      ..cubicTo(19.138, 20.218, 22, 16.442, 22, 12.017)
      ..cubicTo(22, 6.484, 17.522, 2, 12, 2)
      ..close();

    canvas.drawPath(path, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _GithubIconPainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Vector painter for the 4-color Google G icon.
class _GoogleIconPainter extends CustomPainter {
  const _GoogleIconPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.save();
    canvas.scale(scale);

    // Red
    final redPaint = Paint()..color = const Color(0xFFEA4335);
    final redPath = Path()
      ..moveTo(12, 5)
      ..cubicTo(13.56, 5, 14.96, 5.55, 16.07, 6.45)
      ..lineTo(19.12, 3.4)
      ..cubicTo(17.26, 1.71, 14.8, 1, 12, 1)
      ..cubicTo(7.37, 1, 3.44, 3.63, 1.55, 7.45)
      ..lineTo(5.24, 10.32)
      ..cubicTo(6.11, 7.42, 8.78, 5, 12, 5)
      ..close();
    canvas.drawPath(redPath, redPaint);

    // Blue
    final bluePaint = Paint()..color = const Color(0xFF4285F4);
    final bluePath = Path()
      ..moveTo(23.49, 12.27)
      ..cubicTo(23.49, 11.48, 23.42, 10.73, 23.3, 10)
      ..lineTo(12, 10)
      ..lineTo(12, 14.51)
      ..lineTo(18.47, 14.51)
      ..cubicTo(18.18, 15.99, 17.33, 17.24, 16.07, 18.09)
      ..lineTo(19.77, 20.96)
      ..cubicTo(21.93, 18.97, 23.49, 16.02, 23.49, 12.27)
      ..close();
    canvas.drawPath(bluePath, bluePaint);

    // Yellow
    final yellowPaint = Paint()..color = const Color(0xFFFBBC05);
    final yellowPath = Path()
      ..moveTo(5.24, 14.68)
      ..cubicTo(4.98, 13.9, 4.84, 13.06, 4.84, 12.2)
      ..cubicTo(4.84, 11.34, 4.98, 10.5, 5.24, 9.72)
      ..lineTo(1.55, 6.85)
      ..cubicTo(0.56, 8.82, 0, 10.45, 0, 12.2)
      ..cubicTo(0, 13.95, 0.56, 15.58, 1.55, 17.55)
      ..lineTo(5.24, 14.68)
      ..close();
    canvas.drawPath(yellowPath, yellowPaint);

    // Green
    final greenPaint = Paint()..color = const Color(0xFF34A853);
    final greenPath = Path()
      ..moveTo(12, 23.4)
      ..cubicTo(15.24, 23.4, 17.95, 22.32, 19.93, 20.48)
      ..lineTo(16.23, 17.61)
      ..cubicTo(15.16, 18.33, 13.79, 18.77, 12, 18.77)
      ..cubicTo(8.78, 18.77, 6.11, 16.35, 5.24, 13.45)
      ..lineTo(1.55, 16.32)
      ..cubicTo(3.44, 20.14, 7.37, 23.4, 12, 23.4)
      ..close();
    canvas.drawPath(greenPath, greenPaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _GoogleIconPainter oldDelegate) => false;
}
