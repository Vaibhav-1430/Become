import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../../../shared/widgets/forge_card.dart';
import '../../../auth/data/auth_service.dart';
import '../../../auth/presentation/widgets/sso_buttons.dart';
import '../widgets/cad_grid_background.dart';
import '../widgets/forge_emblem.dart';

/// Screen 1: FORGE — Welcome (Screen ID: 09a1030da0bc4c61bb240e293c74ca17)
/// Faithfully reproduces the Stitch Kinetic Discipline visual design.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      body: Stack(
        children: [
          // Background Precision Grid
          const Positioned.fill(
            child: CadGridBackground(opacity: 0.8),
          ),

          // Safe Scrollable Content
          SafeArea(
            child: ResponsiveContentWrapper(
              maxWidth: AppConstants.maxContentWidth,
              padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top Telemetry Header Row
                    _buildHeader(context),

                    const SizedBox(height: ForgeSpacing.spaceLg),

                    // Center Hero & Architecture
                    _buildHeroSection(context),

                    const SizedBox(height: ForgeSpacing.spaceMd),

                    // 2x2 Bento Pillar Grid
                    _buildPillarsGrid(),

                    const SizedBox(height: ForgeSpacing.spaceMd),

                    // Telemetry Metric Pill
                    _buildTelemetryPill(),

                    const SizedBox(height: ForgeSpacing.spaceLg),

                    // Bottom Actions
                    _buildFooter(context),

                    const SizedBox(height: ForgeSpacing.spaceSm),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 8, bottom: 12),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Color(0x20504535), // border-outline-variant/30
            width: 1.0,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left: System Online Indicator
          Expanded(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: ForgeColors.tertiary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: ForgeColors.tertiary.withValues(alpha: 0.5),
                        blurRadius: 4,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'SYSTEM :: ONLINE',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurface,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Right: Build Version Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: ForgeSpacing.borderRadiusXs,
              border: Border.all(
                color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
                width: 0.8,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.terminal,
                  size: 13,
                  color: ForgeColors.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  AppConstants.buildVersion,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return Column(
      children: [
        // Monolithic Emblem
        const ForgeEmblem(size: 80),

        const SizedBox(height: ForgeSpacing.spaceLg),

        // Tagline
        Text(
          'PERSONAL OPERATING SYSTEM',
          textAlign: TextAlign.center,
          style: ForgeTypography.labelSm.copyWith(
            color: ForgeColors.primary,
            letterSpacing: 2.5,
            fontWeight: FontWeight.w700,
          ),
        ),

        const SizedBox(height: 4),

        // Title
        Text(
          AppConstants.appName,
          textAlign: TextAlign.center,
          style: ForgeTypography.headlineXl.copyWith(
            letterSpacing: 3.0,
            fontWeight: FontWeight.w800,
          ),
        ),

        const SizedBox(height: 8),

        // Subtitle & Value Proposition
        Text(
          AppConstants.appTagline,
          textAlign: TextAlign.center,
          style: ForgeTypography.headlineSm.copyWith(
            color: ForgeColors.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),

        const SizedBox(height: 6),

        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 320),
          child: Text(
            AppConstants.appSubtitle,
            textAlign: TextAlign.center,
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPillarsGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildPillarCard(
                tag: '01 // ALGO',
                icon: Icons.terminal,
                title: 'ALGORITHMIC',
                subtitle: 'Striver A2Z / SRS',
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildPillarCard(
                tag: '02 // BUILD',
                icon: Icons.code,
                title: 'CAPSTONES',
                subtitle: 'Full-Stack / Systems',
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildPillarCard(
                tag: '03 // BODY',
                icon: Icons.fitness_center,
                title: 'RESILIENCE',
                subtitle: 'Gym Conditioning',
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildPillarCard(
                tag: '04 // TIER-1',
                icon: Icons.work_outline,
                title: 'PIPELINE',
                subtitle: 'FAANG Readiness',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPillarCard({
    required String tag,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return ForgeCard(
      backgroundColor: ForgeColors.surfaceContainerLow,
      padding: const EdgeInsets.all(ForgeSpacing.spaceSm + 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  tag,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                icon,
                size: 15,
                color: ForgeColors.onSurfaceVariant,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.outline,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryPill() {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: ForgeColors.surfaceContainer,
          borderRadius: ForgeSpacing.borderRadiusXs,
          border: Border.all(
            color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
            width: 0.8,
          ),
        ),
        child: Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              '[ENV: PROD_STAGE]',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
              ),
            ),
            _buildDotSeparator(),
            Text(
              '[LATENCY: 14ms]',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.primary,
              ),
            ),
            _buildDotSeparator(),
            Text(
              '[AUTH: SECURE]',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.tertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDotSeparator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Container(
        width: 3,
        height: 3,
        decoration: const BoxDecoration(
          color: ForgeColors.outlineVariant,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Column(
      children: [
        // Primary CTA: GET STARTED
        ForgePrimaryButton(
          label: 'GET STARTED',
          trailing: const Icon(
            Icons.arrow_forward,
            size: 18,
            color: ForgeColors.canvas,
          ),
          onPressed: () {
            Navigator.of(context).pushNamed(AppRoutes.signIn);
          },
        ),

        const SizedBox(height: 10),

        // Secondary CTA: SSO GitHub
        GithubSsoButton(
          label: 'SIGN IN WITH GITHUB // SSO',
          onPressed: () async {
            final navigator = Navigator.of(context);
            await MockAuthService().signInWithGithub();
            navigator.pushReplacementNamed(AppRoutes.home);
          },
        ),

        const SizedBox(height: 8),

        // Disclaimer
        Text(
          'By continuing, you initialize your daily execution protocol.',
          textAlign: TextAlign.center,
          style: ForgeTypography.labelSm.copyWith(
            color: ForgeColors.outline,
          ),
        ),
      ],
    );
  }
}
