import 'package:flutter/material.dart';
import '../../core/theme/forge_colors.dart';
import '../../core/theme/forge_spacing.dart';
import '../../core/theme/forge_typography.dart';

/// Navigation item data for FORGE bottom navigation dock.
class ForgeNavItem {
  final String label;
  final IconData icon;

  const ForgeNavItem({
    required this.label,
    required this.icon,
  });
}

/// The Fixed Bottom Navigation Bar matching Stitch Kinetic Discipline specifications.
/// 5 Destinations: HOME, PLAN, LEARN, TRAIN, CAREER.
/// 64px height + device safe bottom inset. Active indicator tick/dot in Industrial Amber.
class ForgeBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onIndexChanged;

  static const List<ForgeNavItem> items = [
    ForgeNavItem(label: 'HOME', icon: Icons.dashboard),
    ForgeNavItem(label: 'PLAN', icon: Icons.calendar_today_outlined),
    ForgeNavItem(label: 'LEARN', icon: Icons.code),
    ForgeNavItem(label: 'TRAIN', icon: Icons.fitness_center),
    ForgeNavItem(label: 'CAREER', icon: Icons.work_outline),
  ];

  const ForgeBottomNav({
    super.key,
    required this.currentIndex,
    required this.onIndexChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: ForgeSpacing.bottomNavHeight + MediaQuery.of(context).padding.bottom,
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
      decoration: const BoxDecoration(
        color: ForgeColors.canvas,
        border: Border(
          top: BorderSide(
            color: ForgeColors.surfaceContainer,
            width: 1.0,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (index) {
          final item = items[index];
          final isActive = index == currentIndex;

          return Expanded(
            child: InkWell(
              onTap: () => onIndexChanged(index),
              child: SizedBox(
                height: ForgeSpacing.bottomNavHeight,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      item.icon,
                      size: 20,
                      color: isActive ? ForgeColors.primaryContainer : ForgeColors.onSurfaceVariant,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.label,
                      style: ForgeTypography.labelSm.copyWith(
                        color: isActive ? ForgeColors.primaryContainer : ForgeColors.onSurfaceVariant,
                        fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 2),
                    // Active indicator dot
                    Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isActive ? ForgeColors.primaryContainer : Colors.transparent,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
