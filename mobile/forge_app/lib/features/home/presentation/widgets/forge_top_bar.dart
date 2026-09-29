import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../core/services/streak_service.dart';
import '../../../auth/data/auth_service.dart';

/// Top Bar for the Authenticated Command Center Shell.
class ForgeTopBar extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback? onAvatarTap;

  const ForgeTopBar({
    super.key,
    this.onAvatarTap,
  });

  @override
  Size get preferredSize => const Size.fromHeight(ForgeSpacing.topBarHeight);

  @override
  Widget build(BuildContext context) {
    final user = AuthService.current.currentUser;
    final initial = user?.fullName.isNotEmpty == true
        ? user!.fullName[0].toUpperCase()
        : 'B';

    return SafeArea(
      bottom: false,
      child: Container(
        height: ForgeSpacing.topBarHeight,
      padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin),
      decoration: const BoxDecoration(
        color: ForgeColors.canvas,
        border: Border(
          bottom: BorderSide(
            color: ForgeColors.surfaceContainer,
            width: 1.0,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Leading Terminal Icon & Brand Name & Status Badge
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.terminal,
                color: ForgeColors.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                AppConstants.appName,
                style: ForgeTypography.headlineMd.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainer,
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  border: Border.all(
                    color: ForgeColors.outlineVariant.withValues(alpha: 0.6),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: ForgeColors.tertiary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'SYS.ACT',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.tertiary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Trailing Streak & Avatar
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Streak Badge (Navigates to Analytics)
              AnimatedBuilder(
                animation: StreakService.instance,
                builder: (context, _) {
                  return InkWell(
                    onTap: () {
                      Navigator.of(context).pushNamed(AppRoutes.analytics);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: ForgeColors.surfaceContainer,
                        borderRadius: ForgeSpacing.borderRadiusXs,
                        border: Border.all(
                          color: ForgeColors.outlineVariant.withValues(alpha: 0.6),
                          width: 0.8,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.local_fire_department,
                            size: 16,
                            color: ForgeColors.primaryContainer,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            StreakService.instance.formattedStreak,
                            style: ForgeTypography.labelMd.copyWith(
                              color: ForgeColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(width: 10),

              // User Avatar
              InkWell(
                onTap: () {
                  _showProfileSheet(context);
                },
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: ForgeColors.primaryContainer,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                  ),
                  child: Center(
                    child: Text(
                      initial,
                      style: ForgeTypography.labelMd.copyWith(
                        color: ForgeColors.canvas,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
  }

  void _showProfileSheet(BuildContext context) {
    final user = AuthService.current.currentUser;
    showModalBottomSheet(
      context: context,
      backgroundColor: ForgeColors.surfaceContainer,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(ForgeSpacing.spaceLg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 32,
                    height: 4,
                    decoration: BoxDecoration(
                      color: ForgeColors.outlineVariant,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user?.fullName ?? 'Operator',
                  style: ForgeTypography.headlineSm.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  user?.email ?? 'engineer@university.edu',
                  style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                ),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.insights, color: ForgeColors.primaryContainer),
                  title: Text(
                    'ANALYTICS & METRICS',
                    style: ForgeTypography.labelMd.copyWith(color: ForgeColors.primary),
                  ),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).pushNamed(AppRoutes.analytics);
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.shield_outlined, color: ForgeColors.error),
                  title: Text(
                    'ERROR DEFENSE // MISTAKE BANK',
                    style: ForgeTypography.labelMd.copyWith(color: ForgeColors.onSurface),
                  ),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).pushNamed(AppRoutes.mistakes);
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.work_outline, color: ForgeColors.primary),
                  title: Text(
                    'CAREER & INTERNSHIPS',
                    style: ForgeTypography.labelMd.copyWith(color: ForgeColors.onSurface),
                  ),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).pushNamed(AppRoutes.career);
                  },
                ),
                const Divider(color: ForgeColors.outlineVariant, height: 20),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.logout, color: ForgeColors.error),
                  title: Text(
                    'SIGN OUT // TERMINATE SESSION',
                    style: ForgeTypography.labelMd.copyWith(color: ForgeColors.error),
                  ),
                  onTap: () async {
                    Navigator.of(ctx).pop();
                    await AuthService.current.signOut();
                    if (context.mounted) {
                      Navigator.of(context).pushNamedAndRemoveUntil(
                        AppRoutes.welcome,
                        (route) => false,
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
