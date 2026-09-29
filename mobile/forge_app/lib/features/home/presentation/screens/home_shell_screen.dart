import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../shared/widgets/forge_bottom_nav.dart';
import '../widgets/forge_top_bar.dart';
import '../../../plan/presentation/screens/plan_calendar_screen.dart';
import '../../../learn/presentation/screens/learn_hub_screen.dart';
import '../../../gym/presentation/screens/gym_screen.dart';
import '../../../career/presentation/screens/career_screen.dart';
import 'todays_command_screen.dart';

/// The Main Authenticated Shell for FORGE Mobile.
/// Houses the TopBar, BottomNav dock, and manages navigation between tabs.
/// Today's Command is the primary destination (Index 0: HOME).
class HomeShellScreen extends StatefulWidget {
  const HomeShellScreen({super.key});

  @override
  State<HomeShellScreen> createState() => _HomeShellScreenState();
}

class _HomeShellScreenState extends State<HomeShellScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: const ForgeTopBar(),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          TodaysCommandScreen(),
          PlanCalendarScreen(),
          LearnHubScreen(),
          GymScreen(),
          CareerScreen(),
        ],
      ),
      bottomNavigationBar: ForgeBottomNav(
        currentIndex: _currentIndex,
        onIndexChanged: (index) {
          setState(() => _currentIndex = index);
        },
      ),
    );
  }
}
