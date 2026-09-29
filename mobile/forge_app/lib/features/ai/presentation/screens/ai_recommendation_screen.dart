import 'package:flutter/material.dart';
import '../../../../core/services/streak_service.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/forge_recommendation.dart';
import '../../data/forge_ai_service.dart';

class AiRecommendationScreen extends StatefulWidget {
  final ForgeAiService aiService;
  final void Function(ForgeRecommendation)? onExecuteDirective;

  const AiRecommendationScreen({
    super.key,
    required this.aiService,
    this.onExecuteDirective,
  });

  @override
  State<AiRecommendationScreen> createState() => _AiRecommendationScreenState();
}

class _AiRecommendationScreenState extends State<AiRecommendationScreen> {
  ForgeRecommendation? _recommendation;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchRecommendation();
  }

  Future<void> _fetchRecommendation() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final rec = await widget.aiService.getRecommendation();
      if (mounted) {
        setState(() {
          _recommendation = rec;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _handleExecute(ForgeRecommendation rec) {
    if (widget.onExecuteDirective != null) {
      widget.onExecuteDirective!(rec);
    } else {
      Navigator.of(context).pop(rec);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopAppBar(),
            Expanded(
              child: _isLoading
                  ? _buildLoadingState()
                  : _errorMessage != null
                      ? _buildErrorState()
                      : _buildMainContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopAppBar() {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: ForgeColors.canvas,
        border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.terminal, color: ForgeColors.onSurfaceVariant, size: 20),
                const SizedBox(width: 8),
                Text(
                  'FORGE',
                  style: ForgeTypography.headlineMd.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: ForgeColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(3),
                      border: Border.all(color: ForgeColors.outlineVariant),
                    ),
                    child: Text(
                      'AI :: ENGINE',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.primary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.local_fire_department,
                      color: ForgeColors.primary,
                      size: 15,
                    ),
                    const SizedBox(width: 4),
                    AnimatedBuilder(
                      animation: StreakService.instance,
                      builder: (context, _) => Text(
                        StreakService.instance.formattedStreak,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                key: const Key('btn_close_ai_screen'),
                icon: const Icon(Icons.close, color: ForgeColors.onSurfaceVariant, size: 20),
                onPressed: () {
                  if (Navigator.of(context).canPop()) {
                    Navigator.of(context).pop();
                  }
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            color: ForgeColors.primary,
            strokeWidth: 2.5,
          ),
          const SizedBox(height: 20),
          Text(
            'AI :: ANALYZING',
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.primary,
              letterSpacing: 1.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'CONTEXT :: SYNCING',
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.onSurfaceVariant,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: ForgeColors.error, size: 36),
            const SizedBox(height: 12),
            Text(
              'AI Engine Unavailable',
              style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface),
            ),
            const SizedBox(height: 6),
            Text(
              _errorMessage ?? 'Unable to connect to FORGE intelligence.',
              style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchRecommendation,
              style: ElevatedButton.styleFrom(
                backgroundColor: ForgeColors.surfaceContainer,
                foregroundColor: ForgeColors.primary,
                side: const BorderSide(color: ForgeColors.primary),
              ),
              child: const Text('RETRY'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMainContent() {
    final rec = _recommendation!;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
      children: [
        // System Diagnosis Header
        _buildDiagnosisHeader(rec),
        const SizedBox(height: 16),

        // Fallback Notice Banner if applicable
        if (rec.isFallback) ...[
          _buildFallbackBanner(rec.fallbackMessage),
          const SizedBox(height: 12),
        ],

        // Dominant Hero Bento Card
        _buildPrimaryHeroBento(rec),
        const SizedBox(height: 16),

        // "Why This Directive?" Analytical Breakdown
        _buildAnalyticalBreakdown(rec),
        const SizedBox(height: 16),

        // Contingent Directives
        _buildContingentDirectives(rec),
      ],
    );
  }

  Widget _buildDiagnosisHeader(ForgeRecommendation rec) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: ForgeColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                'INTELLIGENT DIRECTIVE DISPATCH',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.primary,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'What should I study right now?',
          style: ForgeTypography.headlineLg.copyWith(
            color: ForgeColors.onSurface,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: ForgeColors.borderSubtle),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.memory, color: ForgeColors.secondary, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Calculated based on 48h retention decay, upcoming mock evaluation in 5 days, and Striver A2Z pace.',
                  style: ForgeTypography.bodySm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFallbackBanner(String? message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: ForgeColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: ForgeColors.warning.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: ForgeColors.warning, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message ?? 'FORGE Rule-Based Recommendation active.',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.warning),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrimaryHeroBento(ForgeRecommendation rec) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: ForgeColors.primary.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Indicator Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ForgeColors.errorContainer.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: ForgeColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: ForgeColors.error,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          'HIGH PRIORITY',
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.error,
                            fontWeight: FontWeight.w700,
                            fontSize: 9,
                            letterSpacing: 0.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  rec.stepTag,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Pillar & Duration tags
          Row(
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: ForgeColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(3),
                    border: Border.all(color: ForgeColors.borderSubtle),
                  ),
                  child: Text(
                    rec.categoryTag,
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.secondary,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.schedule, size: 13, color: ForgeColors.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(
                    '${rec.estimatedMinutes}m',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Title
          Text(
            rec.title,
            style: ForgeTypography.headlineSm.copyWith(
              color: ForgeColors.onSurface,
              fontWeight: FontWeight.w700,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 14),

          // Key Metrics Grid in Tabular Mono
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: ForgeColors.canvas.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('EST. TIME', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                          const SizedBox(height: 2),
                          Text('${rec.estimatedMinutes}m', style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 32, color: ForgeColors.borderSubtle),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('TARGET MASTERY', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                          const SizedBox(height: 2),
                          Text(rec.targetMastery, style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.tertiary, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(height: 1, color: ForgeColors.borderSubtle),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('RETENTION DECAY RISK', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(width: 6, height: 6, decoration: const BoxDecoration(color: ForgeColors.error, shape: BoxShape.circle)),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              rec.retentionDecayRisk,
                              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.error, fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('DOWNSTREAM IMPACT', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        rec.downstreamImpact,
                        style: ForgeTypography.labelSm.copyWith(color: ForgeColors.secondary, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Primary CTA Trigger Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              key: const Key('btn_execute_ai_directive'),
              onPressed: () => _handleExecute(rec),
              style: ElevatedButton.styleFrom(
                backgroundColor: ForgeColors.primaryContainer,
                foregroundColor: ForgeColors.onPrimaryContainer,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              icon: const Icon(Icons.play_arrow, size: 20),
              label: Text(
                'EXECUTE DIRECTIVE',
                style: ForgeTypography.labelMd.copyWith(
                  color: ForgeColors.onPrimaryContainer,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticalBreakdown(ForgeRecommendation rec) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.analytics, color: ForgeColors.primary, size: 18),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'Why This Directive?',
                        style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  'CONFIDENCE 95%',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Insight items
          ...rec.insights.map((insight) {
            Color badgeColor;
            switch (insight.tagColor) {
              case 'error':
                badgeColor = ForgeColors.error;
                break;
              case 'tertiary':
                badgeColor = ForgeColors.tertiary;
                break;
              default:
                badgeColor = ForgeColors.secondary;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceContainer.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: ForgeColors.borderSubtle.withValues(alpha: 0.5)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: badgeColor.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Text(
                      insight.number,
                      style: ForgeTypography.labelSm.copyWith(
                        color: badgeColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          insight.title,
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.onSurface,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          insight.description,
                          style: ForgeTypography.bodySm.copyWith(
                            color: ForgeColors.onSurfaceVariant,
                            height: 1.25,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildContingentDirectives(ForgeRecommendation rec) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                'CONTINGENT DIRECTIVES',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.onSurfaceVariant,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                'FALLBACKS',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outline,
                  fontSize: 9,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...rec.contingentDirectives.map((directive) {
          final pillarColor = directive.pillar == 'DEV'
              ? ForgeColors.secondary
              : directive.pillar == 'REVISION'
                  ? ForgeColors.error
                  : ForgeColors.primary;

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: ForgeColors.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(2),
                            ),
                            child: Text(
                              directive.pillar,
                              style: ForgeTypography.labelSm.copyWith(
                                color: pillarColor,
                                fontWeight: FontWeight.w700,
                                fontSize: 9,
                              ),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Flexible(
                            child: Text(
                              '• ${directive.durationText}',
                              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              '• ${directive.priorityText}',
                              style: ForgeTypography.labelSm.copyWith(
                                color: pillarColor,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        directive.title,
                        style: ForgeTypography.bodySm.copyWith(
                          color: ForgeColors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, size: 18, color: ForgeColors.onSurfaceVariant),
                  onPressed: () {
                    final altRec = ForgeRecommendation(
                      title: directive.title,
                      priority: directive.priorityText,
                      stepTag: directive.pillar,
                      pillar: directive.pillar,
                      categoryTag: '${directive.pillar} // CONTINGENT',
                      estimatedMinutes: int.tryParse(directive.durationText.replaceAll('m', '')) ?? 30,
                      targetMastery: '+6% Progression',
                      retentionDecayRisk: 'Normal',
                      downstreamImpact: 'Secondary objective',
                      actionType: directive.actionType,
                      actionTargetId: directive.targetId,
                    );
                    _handleExecute(altRec);
                  },
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
