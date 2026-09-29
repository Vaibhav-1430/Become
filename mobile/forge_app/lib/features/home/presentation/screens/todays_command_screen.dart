import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../../../shared/widgets/forge_card.dart';
import '../../../auth/data/auth_service.dart';
import '../../../plan/domain/study_task.dart';
import '../../data/home_repository.dart';
import '../../data/mock_home_repository.dart';
import '../../data/supabase_home_repository.dart';
import '../../domain/today_command_data.dart';

import '../../../ai/data/forge_ai_service.dart';
import '../../../ai/presentation/screens/ai_recommendation_screen.dart';
import '../../../dsa/data/supabase_dsa_repository.dart';
import '../../../dsa/presentation/screens/dsa_screen.dart';
import '../../../development/data/supabase_dev_repository.dart';
import '../../../development/presentation/screens/development_screen.dart';
import '../../../plan/data/supabase_plan_repository.dart';
import '../../../../core/sync/presentation/forge_sync_indicator.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/services/streak_service.dart';

/// Screen 4: Today's Command (Screen ID: eaa5c555324444d8a97d1c0ba5a4caba)
/// Primary execution dashboard faithfully matching the Stitch visual design.
/// Consumes real data from HomeRepository with offline-safe fallback.
class TodaysCommandScreen extends StatefulWidget {
  final HomeRepository? repository;
  final void Function(StudyTask? task)? onStartCommand;
  final VoidCallback? onOpenAiRecommendation;
  final ForgeAiService? aiService;

  const TodaysCommandScreen({
    super.key,
    this.repository,
    this.onStartCommand,
    this.onOpenAiRecommendation,
    this.aiService,
  });

  @override
  State<TodaysCommandScreen> createState() => _TodaysCommandScreenState();
}

class _TodaysCommandScreenState extends State<TodaysCommandScreen> {
  late final HomeRepository _repository;
  TodayCommandData? _data;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ??
        (ForgeSupabase.instance.isInitialized
            ? SupabaseHomeRepository()
            : MockHomeRepository());
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _repository.getTodayCommandData();
      if (!mounted) return;
      StreakService.instance.setStreak(data.streakDays);
      setState(() {
        _data = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'FAILED TO LOAD COMMAND TELEMETRY: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleDirective(StudyTask directive) async {
    if (_data == null) return;

    final wasCompleted = directive.isCompleted;
    final newStatus = wasCompleted ? 'NOT_STARTED' : 'COMPLETED';
    final previousDirectives = List<StudyTask>.from(_data!.directives);

    // Optimistic UI update
    setState(() {
      final updatedDirectives = _data!.directives.map((d) {
        if (d.id == directive.id) {
          return d.copyWith(status: newStatus);
        }
        return d;
      }).toList();

      _data = _data!.copyWith(directives: updatedDirectives);
    });

    try {
      final success = await _repository.toggleDirectiveCompletion(directive.id, wasCompleted);
      if (!success && mounted) {
        // Rollback
        setState(() {
          _data = _data!.copyWith(directives: previousDirectives);
        });
      }
    } catch (e) {
      if (!mounted) return;
      // Rollback on failure
      setState(() {
        _data = _data!.copyWith(directives: previousDirectives);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: ForgeColors.errorContainer,
          content: Text(
            'PERSISTENCE FAILED // REVERTING DIRECTIVE STATE',
            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.error),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ResponsiveContentWrapper(
      maxWidth: AppConstants.maxContentWidth,
      padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin),
      child: RefreshIndicator(
        color: ForgeColors.primary,
        backgroundColor: ForgeColors.surfaceContainerHigh,
        onRefresh: () async {
          await RefreshCoordinator.instance.refreshHome();
          await _loadData();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(
            top: ForgeSpacing.spaceMd,
            bottom: ForgeSpacing.space2Xl,
          ),
          child: _isLoading
              ? _buildLoadingSkeleton()
              : _errorMessage != null
                  ? _buildErrorView()
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // 0. Non-intrusive Global Sync Indicator
                        const ForgeSyncIndicator(),

                        const SizedBox(height: ForgeSpacing.spaceSm),

                        // 1. Greeting Header Section
                        _buildGreetingSection(),

                        const SizedBox(height: ForgeSpacing.spaceMd),

                        // 2. Visually Dominant Hero: "TODAY'S COMMAND"
                        _buildHeroCommandCard(context),

                        const SizedBox(height: ForgeSpacing.spaceLg),

                        // 3. Pillar Execution Status Matrix
                        _buildPillarMatrixSection(),

                        const SizedBox(height: ForgeSpacing.spaceLg),

                        // 4. Upcoming Directives Section
                        _buildUpcomingDirectivesSection(),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Greeting Skeleton
        Container(
          height: 80,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: ForgeSpacing.borderRadiusXs,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(width: 180, height: 20, color: ForgeColors.surfaceContainer),
              const SizedBox(height: 8),
              Container(width: 240, height: 14, color: ForgeColors.surfaceContainerLowest),
            ],
          ),
        ),
        const SizedBox(height: ForgeSpacing.spaceMd),

        // Hero Skeleton
        Container(
          height: 200,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainer,
            borderRadius: ForgeSpacing.borderRadiusSm,
            border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(width: 120, height: 16, color: ForgeColors.surfaceContainerHigh),
              const SizedBox(height: 16),
              Container(width: 260, height: 24, color: ForgeColors.surfaceContainerHigh),
              const SizedBox(height: 8),
              Container(width: 200, height: 16, color: ForgeColors.surfaceContainerLow),
              const Spacer(),
              Row(
                children: [
                  Expanded(child: Container(height: 36, color: ForgeColors.surfaceContainerLowest)),
                  const SizedBox(width: 8),
                  Expanded(child: Container(height: 36, color: ForgeColors.surfaceContainerLowest)),
                  const SizedBox(width: 8),
                  Expanded(child: Container(height: 36, color: ForgeColors.surfaceContainerLowest)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: ForgeSpacing.spaceLg),

        // Telemetry Loading Indicator
        Center(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: ForgeColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'INITIALIZING REAL-TIME TELEMETRY...',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.outline,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorView() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceLg),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.error.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, size: 36, color: ForgeColors.error),
          const SizedBox(height: 12),
          Text(
            'TELEMETRY SYNC FAILED',
            style: ForgeTypography.labelMd.copyWith(
              color: ForgeColors.error,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage ?? 'Network unreachable or configuration invalid.',
            textAlign: TextAlign.center,
            style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          ForgePrimaryButton(
            label: 'RETRY CONNECTION',
            onPressed: _loadData,
          ),
        ],
      ),
    );
  }

  Widget _buildGreetingSection() {
    final user = AuthService.current.currentUser;
    final userName = user != null && user.fullName.isNotEmpty
        ? user.fullName.split(' ').first
        : 'BOSS';

    final greetingText = _data?.greeting.isNotEmpty == true
        ? _data!.greeting
        : 'Good morning, $userName';

    final dateText = _data?.dateHeader ?? 'Thursday, Oct 24 • Execution Protocol Active';
    final semText = _data?.semester ?? 'SEM 05';

    final targetHours = _data?.targetHours ?? 8.0;
    final completedHours = _data?.completedHours ?? 6.5;
    final percentage = _data?.completionPercentage ?? 81;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Expanded(
              child: Text(
                greetingText,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: ForgeTypography.headlineMd.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              semText,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          dateText,
          style: ForgeTypography.bodySm.copyWith(
            color: ForgeColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 12),
        // Live Target Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: ForgeSpacing.borderRadiusXs,
            border: Border.all(
              color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
              width: 0.8,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: ForgeColors.primaryContainer,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'DAILY TARGET',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.onSurfaceVariant,
                          letterSpacing: 1.0,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${completedHours.toStringAsFixed(1)}h',
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    ' / ',
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.outline,
                    ),
                  ),
                  Text(
                    '${targetHours.toStringAsFixed(1)}h',
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '($percentage%)',
                    style: ForgeTypography.labelSm.copyWith(
                      color: percentage >= 80 ? ForgeColors.tertiary : ForgeColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCommandCard(BuildContext context) {
    final hero = _data?.heroTask;

    if (hero == null) {
      return ForgeCard(
        backgroundColor: ForgeColors.surfaceContainer,
        leftAccentColor: ForgeColors.tertiary,
        leftAccentWidth: 3.5,
        padding: const EdgeInsets.all(ForgeSpacing.spaceLg),
        borderColor: ForgeColors.outlineVariant.withValues(alpha: 0.7),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.check_circle, size: 16, color: ForgeColors.tertiary),
                const SizedBox(width: 6),
                Text(
                  'PROTOCOL STATUS // ALL CLEARED',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.tertiary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'No Pending High-Priority Directives',
              style: ForgeTypography.headlineSm.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'All targeted tasks completed or scheduled for later blocks.',
              style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    final subtitle = hero.notes != null && hero.notes!.isNotEmpty
        ? hero.notes!
        : 'Striver A2Z Step 3 • 2 problems remaining to finish medium tier';

    return ForgeCard(
      backgroundColor: ForgeColors.surfaceContainer,
      leftAccentColor: ForgeColors.primaryContainer,
      leftAccentWidth: 3.5,
      padding: const EdgeInsets.all(ForgeSpacing.spaceLg),
      borderColor: ForgeColors.outlineVariant.withValues(alpha: 0.7),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Top Tag
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ForgeColors.primaryContainer.withValues(alpha: 0.12),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(
                      color: ForgeColors.primaryContainer.withValues(alpha: 0.3),
                      width: 0.8,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.bolt,
                        size: 13,
                        color: ForgeColors.primary,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          'AI RECOMMENDATION • HIGH PRIORITY',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.primary,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'EXEC_01',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outline,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Command Headline
          Text(
            hero.title,
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: -0.2,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            subtitle,
            style: ForgeTypography.bodyMd.copyWith(
              color: ForgeColors.onSurfaceVariant,
            ),
          ),

          const SizedBox(height: 14),

          // Command Metrics Grid
          Container(
            padding: const EdgeInsets.only(top: 10),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Color(0x30504535),
                  width: 1.0,
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildMetricCell(
                    label: 'Est. Time',
                    value: '45m',
                    valueColor: ForgeColors.onSurface,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildMetricCell(
                    label: 'Load',
                    value: 'High',
                    valueColor: ForgeColors.error,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildMetricCell(
                    label: 'Streak Risk',
                    value: 'High',
                    valueColor: ForgeColors.primaryContainer,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Primary CTA Button
          ForgePrimaryButton(
            label: 'START COMMAND',
            leading: const Icon(
              Icons.play_arrow,
              size: 20,
              color: ForgeColors.canvas,
            ),
            onPressed: () {
              if (widget.onStartCommand != null) {
                widget.onStartCommand!(hero);
                return;
              }

              if (widget.onOpenAiRecommendation != null) {
                widget.onOpenAiRecommendation!();
                return;
              }

              final nav = Navigator.maybeOf(context);
              if (nav != null) {
                nav.push(
                  MaterialPageRoute(
                    builder: (ctx) => AiRecommendationScreen(
                      aiService: widget.aiService ??
                          ForgeAiService(
                            planRepository: SupabasePlanRepository(),
                            dsaRepository: SupabaseDsaRepository(),
                            devRepository: SupabaseDevRepository(),
                          ),
                      onExecuteDirective: (rec) {
                        Navigator.of(ctx).pop();
                        if (rec.actionType == 'OPEN_DSA') {
                          nav.push(
                            MaterialPageRoute(
                              builder: (_) => DsaScreen(repository: SupabaseDsaRepository()),
                            ),
                          );
                        } else if (rec.actionType == 'OPEN_DEV') {
                          nav.push(
                            MaterialPageRoute(
                              builder: (_) => DevelopmentScreen(repository: SupabaseDevRepository()),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCell({
    required String label,
    required String value,
    required Color valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLowest.withValues(alpha: 0.6),
        borderRadius: ForgeSpacing.borderRadiusXs,
        border: Border.all(
          color: ForgeColors.outlineVariant.withValues(alpha: 0.3),
          width: 0.8,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.outline,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: ForgeTypography.labelMd.copyWith(
              color: valueColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPillarMatrixSection() {
    final dsa = _data?.dsaSummary ?? const PillarSummary(title: 'DSA', metric: '3/5 Solved', progress: 0.60, footerText: '60% Completed');
    final dev = _data?.devSummary ?? const PillarSummary(title: 'DEV', metric: 'Next.js 14 Actions', progress: 0.75, footerText: '1.5h logged');
    final study = _data?.studySummary ?? const PillarSummary(title: 'STUDY', metric: 'Dist. Systems Ch4', progress: 1.0, footerText: 'Done', isCompleted: true);
    final train = _data?.trainSummary ?? const PillarSummary(title: 'TRAIN', metric: 'Push Day A', progress: 0.15, footerText: '5:30 PM (Pending)');

    final activeCount = _data?.activePillarsCount ?? 3;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                'PILLAR EXECUTION STATUS',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outline,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$activeCount / 4 ACTIVE',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildPillarStatusCard(
                title: 'DSA',
                icon: Icons.code,
                iconColor: ForgeColors.primary,
                metric: dsa.metric,
                progress: dsa.progress,
                progressColor: ForgeColors.primaryContainer,
                footer: Text(
                  dsa.footerText,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildPillarStatusCard(
                title: 'DEV',
                icon: Icons.terminal,
                iconColor: ForgeColors.secondary,
                metric: dev.metric,
                progress: dev.progress,
                progressColor: ForgeColors.secondary,
                footer: Text(
                  dev.footerText,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildPillarStatusCard(
                title: 'STUDY',
                icon: Icons.menu_book,
                iconColor: ForgeColors.tertiary,
                metric: study.metric,
                progress: study.progress,
                progressColor: ForgeColors.tertiary,
                footer: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (study.progress >= 1.0) ...[
                      const Icon(
                        Icons.check_circle,
                        size: 13,
                        color: ForgeColors.tertiary,
                      ),
                      const SizedBox(width: 3),
                    ],
                    Text(
                      study.footerText,
                      style: ForgeTypography.labelSm.copyWith(
                        color: study.progress >= 1.0 ? ForgeColors.tertiary : ForgeColors.onSurfaceVariant,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildPillarStatusCard(
                title: 'TRAIN',
                icon: Icons.fitness_center,
                iconColor: ForgeColors.outline,
                metric: train.metric,
                progress: train.progress,
                progressColor: ForgeColors.outline,
                footer: Text(
                  train.footerText,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.outline,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPillarStatusCard({
    required String title,
    required IconData icon,
    required Color iconColor,
    required String metric,
    required double progress,
    required Color progressColor,
    required Widget footer,
  }) {
    return ForgeCard(
      backgroundColor: ForgeColors.surfaceContainerLow,
      padding: const EdgeInsets.all(ForgeSpacing.spaceSm + 2),
      borderColor: ForgeColors.outlineVariant.withValues(alpha: 0.5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.onSurfaceVariant,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Icon(icon, size: 16, color: iconColor),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            metric,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: ForgeColors.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(progressColor),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 8),
          footer,
        ],
      ),
    );
  }

  Widget _buildUpcomingDirectivesSection() {
    final directives = _data?.directives ?? [];

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                'UPCOMING DIRECTIVES',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outline,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'VIEW TIMELINE',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (directives.isEmpty)
          Container(
            padding: const EdgeInsets.all(ForgeSpacing.spaceLg),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainerLow,
              borderRadius: ForgeSpacing.borderRadiusXs,
              border: Border.all(
                color: ForgeColors.outlineVariant.withValues(alpha: 0.3),
                width: 0.8,
              ),
            ),
            child: Center(
              child: Column(
                children: [
                  const Icon(Icons.calendar_today, size: 28, color: ForgeColors.outline),
                  const SizedBox(height: 8),
                  Text(
                    'NO DIRECTIVES LOGGED FOR TODAY',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.outline,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Navigate to PLAN tab to schedule daily execution items.',
                    style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          )
        else
          ...directives.map((directive) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: _buildDirectiveTile(directive),
            );
          }),
      ],
    );
  }

  Widget _buildDirectiveTile(StudyTask directive) {
    final timeStr = directive.startTime != null && directive.startTime!.isNotEmpty
        ? directive.startTime!
        : '12:00';

    final tag1 = directive.metadata['tag1']?.toString() ??
        (directive.category.isNotEmpty ? directive.category.toUpperCase() : 'GENERAL');
    final tag2 = directive.metadata['tag2']?.toString() ??
        (directive.isCompleted ? 'COMPLETED' : 'PENDING');

    final isTimeActive = timeStr == '16:00' && !directive.isCompleted;

    return InkWell(
      onTap: () => _toggleDirective(directive),
      borderRadius: ForgeSpacing.borderRadiusXs,
      child: Container(
        padding: const EdgeInsets.all(ForgeSpacing.spaceSm + 2),
        decoration: BoxDecoration(
          color: directive.isCompleted
              ? ForgeColors.surfaceContainerLowest.withValues(alpha: 0.4)
              : ForgeColors.surfaceContainerLowest,
          borderRadius: ForgeSpacing.borderRadiusXs,
          border: Border.all(
            color: directive.isCompleted
                ? ForgeColors.tertiary.withValues(alpha: 0.4)
                : ForgeColors.outlineVariant.withValues(alpha: 0.4),
            width: 0.8,
          ),
        ),
      child: Row(
        children: [
          Container(
            width: 48,
            padding: const EdgeInsets.symmetric(vertical: 4),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: ForgeSpacing.borderRadiusXs,
              border: Border.all(
                color: ForgeColors.outlineVariant.withValues(alpha: 0.3),
                width: 0.8,
              ),
            ),
            child: Center(
              child: Text(
                timeStr,
                style: ForgeTypography.labelSm.copyWith(
                  color: isTimeActive ? ForgeColors.primary : ForgeColors.onSurfaceVariant,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  directive.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: ForgeTypography.bodySm.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        tag1,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.outline,
                        ),
                      ),
                    ),
                    Text(
                      ' • ',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                      ),
                    ),
                    Flexible(
                      child: Text(
                        tag2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.outline,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right,
            size: 18,
            color: ForgeColors.outline,
          ),
        ],
      ),
    ),
  );
}
}
