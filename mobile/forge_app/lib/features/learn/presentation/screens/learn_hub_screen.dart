import 'package:flutter/material.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../dsa/data/dsa_repository.dart';
import '../../../dsa/data/supabase_dsa_repository.dart';
import '../../../dsa/presentation/screens/dsa_screen.dart';
import '../../../development/data/dev_repository.dart';
import '../../../development/data/supabase_dev_repository.dart';
import '../../../development/presentation/screens/development_screen.dart';
import '../../../ai/data/forge_ai_service.dart';
import '../../../ai/presentation/screens/ai_recommendation_screen.dart';
import '../../../plan/data/supabase_plan_repository.dart';
import '../../../tests/data/test_repository.dart';
import '../../../tests/presentation/screens/test_hub_screen.dart';

class LearnHubScreen extends StatefulWidget {
  final DsaRepository? dsaRepository;
  final DevRepository? devRepository;
  final ForgeAiService? aiService;
  final TestRepository? testRepository;
  final int initialTabIndex;

  const LearnHubScreen({
    super.key,
    this.dsaRepository,
    this.devRepository,
    this.aiService,
    this.testRepository,
    this.initialTabIndex = 0,
  });

  @override
  State<LearnHubScreen> createState() => _LearnHubScreenState();
}

class _LearnHubScreenState extends State<LearnHubScreen> {
  late final DsaRepository _dsaRepo;
  late final DevRepository _devRepo;
  late final ForgeAiService _aiService;

  late int _selectedTab; // 0: DSA, 1: DEV, 2: AI, 3: TESTS

  @override
  void initState() {
    super.initState();
    _dsaRepo = widget.dsaRepository ?? SupabaseDsaRepository();
    _devRepo = widget.devRepository ?? SupabaseDevRepository();
    _aiService = widget.aiService ??
        ForgeAiService(
          planRepository: SupabasePlanRepository(),
          dsaRepository: _dsaRepo,
          devRepository: _devRepo,
        );

    _selectedTab = widget.initialTabIndex;
  }

  bool _isRefreshing = false;

  Future<void> _handleRefresh() async {
    setState(() => _isRefreshing = true);
    try {
      await RefreshCoordinator.instance.refreshLearn();
      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: ForgeColors.primaryContainer,
            content: Text('Learn protocols refreshed', style: TextStyle(fontFamily: 'Inter')),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: ForgeColors.error,
            content: Text('Learn refresh failed: $e', style: const TextStyle(fontFamily: 'Inter')),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            // Learn Pillar Tab Switcher with horizontal scroll to prevent overflow on 320px
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: const BoxDecoration(
                color: ForgeColors.canvas,
                border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildSubTab(0, 'DSA', Icons.terminal),
                          const SizedBox(width: 6),
                          _buildSubTab(1, 'TRACKS', Icons.laptop_chromebook),
                          const SizedBox(width: 6),
                          _buildSubTab(2, 'AI', Icons.smart_toy_outlined),
                          const SizedBox(width: 6),
                          _buildSubTab(3, 'TESTS', Icons.quiz_outlined),
                        ],
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Refresh Learn Protocols',
                    icon: _isRefreshing
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFE5A93C)),
                          )
                        : const Icon(Icons.sync, size: 18, color: ForgeColors.textSecondary),
                    onPressed: _isRefreshing ? null : _handleRefresh,
                  ),
                ],
              ),
            ),

            // Tab Content
            Expanded(
              child: IndexedStack(
                index: _selectedTab,
                children: [
                  DsaScreen(repository: _dsaRepo),
                  DevelopmentScreen(repository: _devRepo),
                  AiRecommendationScreen(
                    aiService: _aiService,
                    onExecuteDirective: (rec) {
                      if (rec.actionType == 'OPEN_DSA') {
                        setState(() => _selectedTab = 0);
                      } else if (rec.actionType == 'OPEN_DEV') {
                        setState(() => _selectedTab = 1);
                      }
                    },
                  ),
                  TestHubScreen(
                    testRepository: widget.testRepository,
                    dsaRepository: _dsaRepo,
                    devRepository: _devRepo,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubTab(int index, String label, IconData icon) {
    final isSelected = _selectedTab == index;

    return InkWell(
      key: Key('learn_tab_$index'),
      onTap: () {
        setState(() {
          _selectedTab = index;
        });
      },
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? ForgeColors.primaryContainer : ForgeColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isSelected ? ForgeColors.primaryContainer : ForgeColors.borderSubtle,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 13,
              color: isSelected ? ForgeColors.onPrimaryContainer : ForgeColors.onSurfaceVariant,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: ForgeTypography.labelSm.copyWith(
                color: isSelected ? ForgeColors.onPrimaryContainer : ForgeColors.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
