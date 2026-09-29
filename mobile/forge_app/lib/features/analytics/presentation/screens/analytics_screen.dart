import 'package:flutter/material.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/analytics_data.dart';
import '../../data/analytics_repository.dart';
import '../../data/mock_analytics_repository.dart';
import '../../data/supabase_analytics_repository.dart';

/// Screen: FORGE Analytics & Telemetry Dashboard.
/// Displays 100% authentic derived metrics matching the web `#view-stats` implementation.
/// Zero fake telemetry: if no user data exists, displays explicit empty state.
class AnalyticsScreen extends StatefulWidget {
  final AnalyticsRepository? repository;

  const AnalyticsScreen({super.key, this.repository});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  late final AnalyticsRepository _repository;

  AnalyticsData _data = const AnalyticsData();
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ??
        (ForgeSupabase.instance.isInitialized
            ? SupabaseAnalyticsRepository()
            : MockAnalyticsRepository());
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _repository.getAnalyticsData();
      if (!mounted) return;
      setState(() {
        _data = res;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'FAILED TO LOAD ANALYTICS TELEMETRY: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: ForgeColors.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.insights, color: ForgeColors.primaryContainer, size: 18),
              const SizedBox(width: 8),
              Text(
                'FORGE // ANALYTICS',
                style: ForgeTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Sync Analytics',
            icon: const Icon(Icons.sync, color: ForgeColors.textSecondary, size: 20),
            onPressed: () async {
              await RefreshCoordinator.instance.refreshAnalytics();
              await _loadData();
            },
          ),
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: ForgeSpacing.borderRadiusXs,
              border: Border.all(color: ForgeColors.outlineVariant),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.bolt, size: 14, color: ForgeColors.primaryContainer),
                const SizedBox(width: 4),
                Text(
                  '${_data.streakDays}d',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await RefreshCoordinator.instance.refreshAnalytics();
            await _loadData();
          },
          color: ForgeColors.primaryContainer,
          backgroundColor: ForgeColors.surfaceContainer,
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: ForgeColors.primaryContainer),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(ForgeSpacing.margin),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 40, color: ForgeColors.error),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.error),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: ForgeColors.surfaceContainer,
                  foregroundColor: ForgeColors.primary,
                ),
                onPressed: _loadData,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('RETRY TELEMETRY'),
              ),
            ],
          ),
        ),
      );
    }

    if (!_data.hasData) {
      return _buildEmptyState();
    }

    return ListView(
      padding: const EdgeInsets.all(ForgeSpacing.margin),
      children: [
        // Hero Consistency Cards
        _buildHeroConsistencyGrid(),
        const SizedBox(height: 16),

        // 14-Day Activity Bar Chart
        _buildActivityHistoryChart(),
        const SizedBox(height: 16),

        // Authentic Focus Session Telemetry
        _buildFocusTelemetryCard(),
        const SizedBox(height: 16),

        // Pillar Mastery Bento
        _buildPillarMasteryBento(),
        const SizedBox(height: 16),

        // Physical Training & Lifestyle
        _buildGymTelemetryCard(),
        const SizedBox(height: 16),

        // Recent Study Sessions Log
        _buildRecentSessionsSection(),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildHeroConsistencyGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 360;

        Widget buildStreakCard() => Container(
              padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceContainerLow,
                borderRadius: ForgeSpacing.borderRadiusSm,
                border: Border.all(color: ForgeColors.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          'STREAK',
                          style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                        ),
                      ),
                      const Icon(Icons.local_fire_department, size: 16, color: ForgeColors.primaryContainer),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${_data.streakDays}',
                    style: ForgeTypography.monoMetric.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ForgeColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('Consecutive days', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                ],
              ),
            );

        Widget buildStudyDaysCard() => Container(
              padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceContainerLow,
                borderRadius: ForgeSpacing.borderRadiusSm,
                border: Border.all(color: ForgeColors.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          'STUDY DAYS',
                          style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                        ),
                      ),
                      const Icon(Icons.calendar_month, size: 16, color: ForgeColors.secondary),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${_data.totalStudyDays}',
                    style: ForgeTypography.monoMetric.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ForgeColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('Active days recorded', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                ],
              ),
            );

        Widget buildSessionsCard() => Container(
              padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceContainerLow,
                borderRadius: ForgeSpacing.borderRadiusSm,
                border: Border.all(color: ForgeColors.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          'SESSIONS',
                          style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                        ),
                      ),
                      const Icon(Icons.timer_outlined, size: 16, color: ForgeColors.tertiary),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${_data.sessionCount}',
                    style: ForgeTypography.monoMetric.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ForgeColors.tertiary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('Blocks logged', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                ],
              ),
            );

        if (isCompact) {
          return Column(
            children: [
              Row(
                children: [
                  Expanded(child: buildStreakCard()),
                  const SizedBox(width: 8),
                  Expanded(child: buildStudyDaysCard()),
                ],
              ),
              const SizedBox(height: 8),
              buildSessionsCard(),
            ],
          );
        }

        return Row(
          children: [
            Expanded(child: buildStreakCard()),
            const SizedBox(width: 8),
            Expanded(child: buildStudyDaysCard()),
            const SizedBox(width: 8),
            Expanded(child: buildSessionsCard()),
          ],
        );
      },
    );
  }

  Widget _buildActivityHistoryChart() {
    final bars = _data.dailyHistory;
    if (bars.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '14-DAY ACTIVITY HISTOGRAM',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.outline,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'COMPLETED TASKS',
                  style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primaryContainer),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Bars container
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: bars.map((b) {
                final barHeight = (b.completedTasks * 16.0).clamp(6.0, 72.0);
                final color = b.isGood
                    ? ForgeColors.primaryContainer
                    : (b.completedTasks > 0 ? ForgeColors.primary : ForgeColors.surfaceContainerHighest);

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (b.completedTasks > 0)
                          Text(
                            '${b.completedTasks}',
                            style: const TextStyle(fontSize: 9, color: ForgeColors.outline),
                          ),
                        const SizedBox(height: 2),
                        Container(
                          width: double.infinity,
                          height: barHeight,
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${b.dayOfMonth}',
                          style: const TextStyle(fontSize: 10, color: ForgeColors.outline),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFocusTelemetryCard() {
    final focusHours = _data.totalFocusMinutes ~/ 60;
    final focusMins = _data.totalFocusMinutes % 60;

    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology, color: ForgeColors.primaryContainer, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'AUTHENTIC FOCUS TELEMETRY',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurface,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 2x2 Metric Breakdown
          Row(
            children: [
              Expanded(
                child: _buildSubMetric(
                  label: 'TOTAL ACTIVE FOCUS',
                  value: '${focusHours}h ${focusMins}m',
                  sub: '${_data.sessionCount} sessions completed',
                  accentColor: ForgeColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSubMetric(
                  label: 'AVERAGE DURATION',
                  value: '${_data.averageSessionMinutes}m',
                  sub: 'Longest: ${_data.longestSessionMinutes}m',
                  accentColor: ForgeColors.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildSubMetric(
                  label: 'BREAK RATIO',
                  value: '${_data.breakRatioPercent}%',
                  sub: '${_data.totalBreakMinutes}m total recovery',
                  accentColor: ForgeColors.tertiary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSubMetric(
                  label: 'PRIMARY CATEGORY',
                  value: _data.primaryCategory,
                  sub: _formatSpread(_data.categorySpread),
                  accentColor: ForgeColors.onSurface,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSubMetric({
    required String label,
    required String value,
    required String sub,
    required Color accentColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceSm),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLowest,
        borderRadius: ForgeSpacing.borderRadiusXs,
        border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: ForgeColors.outline, letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Text(
            value,
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              color: accentColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            style: const TextStyle(fontSize: 10, color: ForgeColors.outline),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildPillarMasteryBento() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PILLAR MASTERY PROGRESSION',
          style: ForgeTypography.labelSm.copyWith(
            color: ForgeColors.outline,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 10),

        // DSA Card
        Container(
          padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: ForgeSpacing.borderRadiusSm,
            border: Border.all(color: ForgeColors.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(Icons.code, size: 16, color: ForgeColors.primaryContainer),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'STRIVER DSA A2Z',
                            style: ForgeTypography.labelMd.copyWith(fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_data.dsaSolved} / ${_data.dsaTotal}',
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: _data.dsaTotal > 0 ? (_data.dsaSolved / _data.dsaTotal) : 0.0,
                  backgroundColor: ForgeColors.surfaceContainerHighest,
                  valueColor: const AlwaysStoppedAnimation(ForgeColors.primaryContainer),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${_data.dsaEasySolved} Easy · ${_data.dsaMediumSolved} Med · ${_data.dsaHardSolved} Hard',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_data.dsaPercentage.toStringAsFixed(1)}%',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.primaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Development Card
        Container(
          padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: ForgeSpacing.borderRadiusSm,
            border: Border.all(color: ForgeColors.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(Icons.laptop_chromebook, size: 16, color: ForgeColors.secondary),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'FULL-STACK DEVELOPMENT',
                            style: ForgeTypography.labelMd.copyWith(fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_data.devCompletedTopics} / ${_data.devTotalTopics}',
                    style: ForgeTypography.labelMd.copyWith(
                      color: ForgeColors.secondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: _data.devTotalTopics > 0
                      ? (_data.devCompletedTopics / _data.devTotalTopics)
                      : 0.0,
                  backgroundColor: ForgeColors.surfaceContainerHighest,
                  valueColor: const AlwaysStoppedAnimation(ForgeColors.secondary),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '13 Technology Tracks',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_data.devPercentage.toStringAsFixed(1)}%',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.secondary,
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

  Widget _buildGymTelemetryCard() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.fitness_center, color: ForgeColors.tertiary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'PHYSICAL TRAINING & LIFESTYLE',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildSubMetric(
                  label: 'WEEKLY CONSISTENCY',
                  value: '${_data.weeklyWorkoutsCompleted} / ${_data.weeklyWorkoutsPlanned}',
                  sub: 'Sessions completed this week',
                  accentColor: ForgeColors.tertiary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSubMetric(
                  label: 'LIFETIME VOLUME',
                  value: '${_data.lifetimeVolumeKg.toStringAsFixed(0)} kg',
                  sub: '${_data.lifetimeSets} sets logged',
                  accentColor: ForgeColors.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildSubMetric(
                  label: 'TOTAL WORKOUTS',
                  value: '${_data.totalWorkouts}',
                  sub: 'Verified photo check-ins',
                  accentColor: ForgeColors.primaryContainer,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSubMetric(
                  label: 'PERSONAL RECORDS',
                  value: '${_data.personalRecordsCount}',
                  sub: 'Strength benchmarks',
                  accentColor: ForgeColors.secondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentSessionsSection() {
    final sessions = _data.recentSessions;
    if (sessions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'AUTHENTIC STUDY LOGS',
          style: ForgeTypography.labelSm.copyWith(
            color: ForgeColors.outline,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: ForgeSpacing.borderRadiusSm,
            border: Border.all(color: ForgeColors.outlineVariant),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: sessions.length,
            separatorBuilder: (_, index) => const Divider(
              color: ForgeColors.surfaceContainer,
              height: 1,
            ),
            itemBuilder: (context, index) {
              final s = sessions[index];
              final activeM = s.activeSeconds ~/ 60;
              final breakM = s.breakSeconds ~/ 60;

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    // Date & subject
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                s.date,
                                style: const TextStyle(fontSize: 11, color: ForgeColors.outline),
                              ),
                              if (s.startTime != null) ...[
                                const SizedBox(width: 4),
                                Text(
                                  '• ${s.startTime}',
                                  style: const TextStyle(fontSize: 11, color: ForgeColors.primary),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            s.subject,
                            style: ForgeTypography.bodyMd.copyWith(
                              fontWeight: FontWeight.bold,
                              color: ForgeColors.onSurface,
                            ),
                          ),
                          if (s.topic != null && s.topic!.isNotEmpty)
                            Text(
                              s.topic!,
                              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                            ),
                        ],
                      ),
                    ),

                    // Metrics
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${activeM}m focus',
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.tertiary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (breakM > 0)
                          Text(
                            '${breakM}m break',
                            style: const TextStyle(fontSize: 10, color: ForgeColors.outline),
                          ),
                        if (s.cameraEnabled)
                          const Text(
                            '📷 ON',
                            style: TextStyle(fontSize: 10, color: ForgeColors.secondary),
                          ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.margin),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.bar_chart_outlined, size: 48, color: ForgeColors.outlineVariant),
          const SizedBox(height: 14),
          Text(
            'INSUFFICIENT TELEMETRY',
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'No authentic study sessions, completed tasks, or workouts have been recorded on this account yet. Zero demo or hardcoded numbers are shown.\n\nExecute directives on Today\'s Command or log study sessions to activate telemetry.',
            style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.outline),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: ForgeColors.primaryContainer,
              foregroundColor: ForgeColors.onPrimaryContainer,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('REFRESH TELEMETRY', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: _loadData,
          ),
        ],
      ),
    );
  }

  String _formatSpread(Map<String, int> spread) {
    if (spread.isEmpty) return 'No sessions logged';
    return spread.entries.map((e) => '${e.key}: ${e.value}').take(3).join(' · ');
  }
}
