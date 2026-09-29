import 'package:flutter/material.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../auth/data/auth_service.dart';
import '../../data/career_repository.dart';
import '../../data/mock_career_repository.dart';
import '../../data/supabase_career_repository.dart';
import '../../domain/internship.dart';
import '../../domain/placement_readiness.dart';
import '../widgets/add_edit_internship_sheet.dart';
import 'internship_detail_screen.dart';

/// Primary CAREER dashboard implementing Stitch Screen `5b7621640049478594d0d138efa94ec5`
/// ("FORGE Career — Placement Readiness").
class CareerScreen extends StatefulWidget {
  final CareerRepository? repository;

  const CareerScreen({super.key, this.repository});

  @override
  State<CareerScreen> createState() => _CareerScreenState();
}

class _CareerScreenState extends State<CareerScreen> {
  late final CareerRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  PlacementReadiness _readiness = const PlacementReadiness();
  List<Internship> _internships = [];
  InternshipPipelineStats _stats = const InternshipPipelineStats();
  String _selectedStatusFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    final uid = AuthService.current.currentUser?.id;
    _repository = widget.repository ??
        (ForgeSupabase.instance.isInitialized
            ? SupabaseCareerRepository(client: ForgeSupabase.instance.client, overrideUserId: uid)
            : (MockCareerRepository()..setUserId(uid)));
    _loadCareerData();
  }

  Future<void> _loadCareerData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _repository.getPlacementReadiness(),
        _repository.getInternships(statusFilter: _selectedStatusFilter),
        _repository.getPipelineStats(),
      ]);

      if (mounted) {
        setState(() {
          _readiness = results[0] as PlacementReadiness;
          _internships = results[1] as List<Internship>;
          _stats = results[2] as InternshipPipelineStats;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _filterByStatus(String status) async {
    setState(() {
      _selectedStatusFilter = status;
      _isLoading = true;
    });

    try {
      final items = await _repository.getInternships(statusFilter: status);
      if (mounted) {
        setState(() {
          _internships = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _openAddSheet() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddEditInternshipSheet(
        onSave: (newItem) async {
          await _repository.createInternship(newItem);
          await _loadCareerData();
        },
      ),
    );
  }

  Future<void> _openDetail(Internship item) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => InternshipDetailScreen(
          initialInternship: item,
          repository: _repository,
        ),
      ),
    );

    if (result == true || mounted) {
      _loadCareerData();
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case InternshipStatus.selected:
        return ForgeColors.tertiary;
      case InternshipStatus.interview:
        return ForgeColors.secondary;
      case InternshipStatus.oa:
        return ForgeColors.primaryContainer;
      case InternshipStatus.rejected:
        return ForgeColors.error;
      case InternshipStatus.saved:
        return ForgeColors.outline;
      case InternshipStatus.applied:
      default:
        return ForgeColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: ForgeColors.primary),
                onPressed: () => Navigator.of(context).pop(),
              )
            : const Icon(Icons.terminal, color: ForgeColors.primary, size: 20),
        titleSpacing: 0,
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'FORGE',
                style: ForgeTypography.headlineMd.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerHigh,
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.6)),
                ),
                child: Text(
                  'CAREER // READINESS',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Sync Career Pipeline',
            icon: const Icon(Icons.sync, color: ForgeColors.textSecondary, size: 20),
            onPressed: () async {
              await RefreshCoordinator.instance.refreshCareer();
              await _loadCareerData();
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
                const Icon(Icons.local_fire_department, size: 14, color: ForgeColors.primaryContainer),
                const SizedBox(width: 4),
                Text(
                  '${_stats.active} active',
                  style: ForgeTypography.labelSm.copyWith(
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
            await RefreshCoordinator.instance.refreshCareer();
            await _loadCareerData();
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
                onPressed: _loadCareerData,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('RETRY TELEMETRY'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(ForgeSpacing.margin),
      children: [
        // Cohort Synchronized Meta Pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceSm, vertical: 6),
          decoration: BoxDecoration(
            color: ForgeColors.surface,
            borderRadius: ForgeSpacing.borderRadiusXs,
            border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: ForgeColors.tertiary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'SYNCED: COHORT',
                        style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '18ms // L4 BAR',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // 2. Command Telemetry (Placement Readiness Card)
        _buildCommandTelemetryCard(),
        const SizedBox(height: 14),

        // 3. Primary Action Directive Card
        _buildActionDirectiveCard(),
        const SizedBox(height: 14),

        // 4. Verification Pillars
        _buildVerificationPillarsCard(),
        const SizedBox(height: 18),

        // 5. Active Applications & Pipeline Tracker
        _buildPipelineSection(),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildCommandTelemetryCard() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surface,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.radar, color: ForgeColors.primary, size: 16),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'COMMAND TELEMETRY',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.onSurfaceVariant,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerHighest,
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.3)),
                ),
                child: Text(
                  _readiness.statusLabel,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Big Metric Block
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    _readiness.hasAnyData ? '${_readiness.overallScore}' : '0',
                    style: ForgeTypography.monoMetric.copyWith(
                      color: ForgeColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '/ 100',
                    style: ForgeTypography.labelLg.copyWith(color: ForgeColors.outline),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _readiness.hasAnyData ? 'Verified Real' : 'No Data',
                    style: ForgeTypography.labelSm.copyWith(
                      color: _readiness.hasAnyData ? ForgeColors.tertiary : ForgeColors.outline,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Deterministic',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Placement Readiness Index (L4-SWE)',
            style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),

          // 8-Segment Precision Gauge
          _buildPrecisionGauge(_readiness.overallScore),
          const SizedBox(height: 12),

          // 4-Box Diagnostic Grid
          _buildDiagnosticGrid(),
        ],
      ),
    );
  }

  Widget _buildPrecisionGauge(int score) {
    final activeSegments = (score / 12.5).round().clamp(0, 8);

    return Row(
      children: List.generate(8, (index) {
        final isActive = index < activeSegments;
        final color = isActive ? ForgeColors.primaryContainer : ForgeColors.surfaceContainerHighest;

        return Expanded(
          child: Container(
            height: 6,
            margin: EdgeInsets.only(right: index == 7 ? 0 : 3),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildDiagnosticGrid() {
    final diag = _readiness.diagnostics;
    if (diag.isEmpty) return const SizedBox.shrink();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: diag.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.7,
      ),
      itemBuilder: (context, index) {
        final d = diag[index];
        return Container(
          padding: const EdgeInsets.all(ForgeSpacing.spaceSm),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLowest,
            borderRadius: ForgeSpacing.borderRadiusXs,
            border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                d.label,
                style: const TextStyle(fontSize: 10, color: ForgeColors.outline, letterSpacing: 0.5),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                d.value,
                style: ForgeTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  color: d.isPassing ? ForgeColors.primary : ForgeColors.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 1),
              Text(
                d.subtitle,
                style: const TextStyle(fontSize: 9, color: ForgeColors.outline),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionDirectiveCard() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.primaryContainer.withValues(alpha: 0.8), width: 1.5),
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
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: ForgeColors.primaryContainer,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'CRITICAL DIRECTIVE',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'TARGET FOCUS',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Text(
            _readiness.nextAction.toUpperCase(),
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              color: ForgeColors.onSurface,
            ),
          ),
          const SizedBox(height: 4),

          Text(
            'Vector needing attention: ${_readiness.needsAttentionArea}',
            style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationPillarsCard() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surface,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.4)),
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
                    const Icon(Icons.verified, size: 16, color: ForgeColors.outline),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'VERIFICATION PILLARS',
                        style: ForgeTypography.headlineSm.copyWith(
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '8 AUDIT VECTORS',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
            ],
          ),
          const SizedBox(height: 10),

          ..._readiness.pillars.map((pillar) {
            final percent = pillar.percent ?? 0;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          pillar.name,
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.onSurface,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        pillar.statusBadge,
                        style: ForgeTypography.labelSm.copyWith(
                          color: pillar.hasData ? ForgeColors.tertiary : ForgeColors.outline,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          pillar.metricDetail,
                          style: const TextStyle(fontSize: 11, color: ForgeColors.onSurfaceVariant),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        pillar.hasData ? '$percent%' : 'Pending',
                        style: ForgeTypography.labelSm.copyWith(
                          color: pillar.hasData ? ForgeColors.primary : ForgeColors.outline,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: pillar.hasData ? (percent / 100.0) : 0.05,
                      backgroundColor: ForgeColors.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation(
                        pillar.hasData ? ForgeColors.primaryContainer : ForgeColors.outlineVariant,
                      ),
                      minHeight: 4,
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

  Widget _buildPipelineSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ACTIVE PIPELINE (${_internships.length})',
                    style: ForgeTypography.headlineSm.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_stats.active} applications actively in play',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: _openAddSheet,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: ForgeColors.surface,
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.add, size: 14, color: ForgeColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      'LOG APP',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Filter chips horizontal list
        _buildFilterChips(),
        const SizedBox(height: 12),

        // Applications list or empty state
        if (_internships.isEmpty)
          _buildEmptyPipeline()
        else
          ..._internships.map((app) => _buildApplicationCard(app)),
      ],
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'key': 'ALL', 'label': 'ALL (${_stats.total})'},
      {'key': InternshipStatus.applied, 'label': 'APPLIED'},
      {'key': InternshipStatus.oa, 'label': 'OA STAGE (${_stats.oaStage})'},
      {'key': InternshipStatus.interview, 'label': 'TECH ROUND (${_stats.techRound})'},
      {'key': InternshipStatus.selected, 'label': 'OFFER (${_stats.offers})'},
      {'key': InternshipStatus.saved, 'label': 'SAVED (${_stats.saved})'},
      {'key': InternshipStatus.rejected, 'label': 'REJECTED (${_stats.rejected})'},
    ];

    return SizedBox(
      height: 30,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (_, index) => const SizedBox(width: 6),
        itemBuilder: (context, index) {
          final f = filters[index];
          final isSelected = _selectedStatusFilter.toUpperCase() == f['key']!.toUpperCase();

          return ChoiceChip(
            label: Text(
              f['label']!,
              style: ForgeTypography.labelSm.copyWith(
                color: isSelected ? ForgeColors.canvas : ForgeColors.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            selected: isSelected,
            selectedColor: ForgeColors.primaryContainer,
            backgroundColor: ForgeColors.surfaceContainerLowest,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            shape: RoundedRectangleBorder(
              borderRadius: ForgeSpacing.borderRadiusXs,
              side: BorderSide(
                color: isSelected ? ForgeColors.primaryContainer : ForgeColors.outlineVariant,
                width: 0.8,
              ),
            ),
            onSelected: (val) {
              if (val) {
                _filterByStatus(f['key']!);
              }
            },
          );
        },
      ),
    );
  }

  Widget _buildApplicationCard(Internship app) {
    final statusColor = _getStatusColor(app.status);

    return InkWell(
      onTap: () => _openDetail(app),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
        decoration: BoxDecoration(
          color: ForgeColors.surface,
          borderRadius: ForgeSpacing.borderRadiusSm,
          border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Company & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    app.company,
                    style: ForgeTypography.headlineSm.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ForgeColors.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    InternshipStatus.badgeLabel(app.status),
                    style: ForgeTypography.labelSm.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),

            // Role
            Text(
              app.role,
              style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurfaceVariant),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),

            // Footer (Applied Date & Link tag)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    app.dateApplied != null ? 'Applied: ${app.dateApplied}' : 'Saved Application',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (app.link?.isNotEmpty == true) ...[
                      const Icon(Icons.link, size: 14, color: ForgeColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        'Link',
                        style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary),
                      ),
                      const SizedBox(width: 4),
                    ],
                    const Icon(Icons.chevron_right, size: 16, color: ForgeColors.outline),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyPipeline() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLowest,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.work_outline, size: 40, color: ForgeColors.outlineVariant),
          const SizedBox(height: 12),
          Text(
            'NO APPLICATIONS TRACKED YET',
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Tap "+ LOG APP" to start tracking your internship pipeline, OA assessments, and interview rounds.',
            style: ForgeTypography.bodySm.copyWith(color: ForgeColors.outline),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
