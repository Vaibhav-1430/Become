import 'package:flutter/material.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/mistake.dart';
import '../../data/mistake_repository.dart';
import '../../data/mock_mistake_repository.dart';
import '../../data/supabase_mistake_repository.dart';
import '../widgets/add_edit_mistake_sheet.dart';
import 'mistake_detail_screen.dart';

/// Screen: FORGE — Error Defense (Mistake Bank)
/// Matches Stitch Screen ID: `d075249f0c794057aa136c6ba139bda2`.
/// 100% real persisted data from `public.mistakes`.
class MistakeBankScreen extends StatefulWidget {
  final MistakeRepository? repository;

  const MistakeBankScreen({super.key, this.repository});

  @override
  State<MistakeBankScreen> createState() => _MistakeBankScreenState();
}

class _MistakeBankScreenState extends State<MistakeBankScreen> {
  late final MistakeRepository _repository;

  List<Mistake> _mistakes = [];
  MistakeStats _stats = const MistakeStats();
  bool _isLoading = true;
  String? _errorMessage;

  String _selectedSubject = 'ALL';
  String _selectedStatus = 'all'; // 'all', 'unresolved', 'resolved', 'dueRevision', 'repeated'
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  bool _isSearchVisible = false;

  final List<String> _subjectTabs = ['ALL', 'DSA', 'DEVELOPMENT', 'CORE CS', 'COLLEGE'];

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ??
        (ForgeSupabase.instance.isInitialized
            ? SupabaseMistakeRepository()
            : MockMistakeRepository());
    _loadData();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _repository.getMistakes(
        subject: _selectedSubject == 'ALL' ? null : _selectedSubject,
        status: _selectedStatus == 'all' ? null : _selectedStatus,
        query: _searchQuery.isEmpty ? null : _searchQuery,
      );
      final stats = await _repository.getMistakeStats();

      if (!mounted) return;
      setState(() {
        _mistakes = list;
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'FAILED TO LOAD ERROR DEFENSE DATA: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleResolved(Mistake m) async {
    try {
      await _repository.toggleResolved(m.id, m.resolved);
      _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    }
  }

  void _openAddSheet() {
    AddEditMistakeSheet.show(
      context,
      onSave: (newMistake) async {
        await _repository.createMistake(newMistake);
        _loadData();
      },
    );
  }

  void _openDetail(Mistake m) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MistakeDetailScreen(
          initialMistake: m,
          repository: _repository,
          onMistakeChanged: _loadData,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        leading: const Icon(Icons.terminal, color: ForgeColors.primary, size: 20),
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
                  'ERROR DEFENSE',
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
            tooltip: 'Sync Error Defense',
            icon: const Icon(Icons.sync, color: ForgeColors.textSecondary, size: 20),
            onPressed: () async {
              await RefreshCoordinator.instance.refreshMistakes();
              await _loadData();
            },
          ),
          IconButton(
            icon: Icon(
              _isSearchVisible ? Icons.search_off : Icons.search,
              color: _isSearchVisible ? ForgeColors.primary : ForgeColors.outline,
            ),
            onPressed: () {
              setState(() {
                _isSearchVisible = !_isSearchVisible;
                if (!_isSearchVisible) {
                  _searchCtrl.clear();
                  _searchQuery = '';
                  _loadData();
                }
              });
            },
            tooltip: 'Search & Filter',
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: ForgeColors.primaryContainer),
            onPressed: _openAddSheet,
            tooltip: 'Log Mistake',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: ForgeColors.primaryContainer,
        foregroundColor: ForgeColors.onPrimaryContainer,
        icon: const Icon(Icons.add, size: 18),
        label: Text(
          'LOG MISTAKE',
          style: ForgeTypography.labelMd.copyWith(
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        onPressed: _openAddSheet,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await RefreshCoordinator.instance.refreshMistakes();
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

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin, vertical: 12),
      children: [
        // System Audit Tag
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
                      color: ForgeColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'MISTAKE BANK // SYSTEM AUDIT',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        letterSpacing: 1.2,
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
              'STATUS: SYNCED',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.tertiary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Bento Grid Metrics
        _buildBentoGrid(),
        const SizedBox(height: 12),

        // Rapid Drill Trigger banner
        if (_stats.dueForRevision > 0) ...[
          _buildSrsRecallBanner(),
          const SizedBox(height: 12),
        ],

        // Search Bar (if visible)
        if (_isSearchVisible) ...[
          TextField(
            controller: _searchCtrl,
            style: ForgeTypography.bodyMd,
            decoration: InputDecoration(
              hintText: 'Search flaw, topic, or invariant...',
              prefixIcon: const Icon(Icons.search, size: 18, color: ForgeColors.outline),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 16),
                      onPressed: () {
                        _searchCtrl.clear();
                        _searchQuery = '';
                        _loadData();
                      },
                    )
                  : null,
            ),
            onChanged: (v) {
              _searchQuery = v;
              _loadData();
            },
          ),
          const SizedBox(height: 10),
        ],

        // Category Filter Tabs
        _buildCategoryTabs(),
        const SizedBox(height: 10),

        // Status Filter Chips
        _buildStatusFilterRow(),
        const SizedBox(height: 14),

        // Structured Mistake Cards or Empty State
        if (_mistakes.isEmpty)
          _buildEmptyState()
        else
          ..._mistakes.map((m) => _buildMistakeCard(m)),

        const SizedBox(height: 80), // spacing for FAB
      ],
    );
  }

  Widget _buildBentoGrid() {
    return Column(
      children: [
        Row(
          children: [
            // Active Deficits
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ACTIVE DEFICITS',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '${_stats.unresolved}',
                          style: ForgeTypography.headlineLg.copyWith(
                            fontWeight: FontWeight.bold,
                            color: ForgeColors.onSurface,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'FLAWS',
                          style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Criticality: ',
                            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                          ),
                          TextSpan(
                            text: _stats.unresolved > 5
                                ? 'HIGH'
                                : (_stats.unresolved > 0 ? 'MODERATE' : 'OPTIMAL'),
                            style: ForgeTypography.labelSm.copyWith(
                              color: _stats.unresolved > 5
                                  ? ForgeColors.error
                                  : (_stats.unresolved > 0 ? ForgeColors.primaryContainer : ForgeColors.tertiary),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Due Today SRS
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainer,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(
                    color: _stats.dueForRevision > 0
                        ? ForgeColors.primaryContainer
                        : ForgeColors.outlineVariant,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'DUE TODAY (SRS)',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.primary,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (_stats.dueForRevision > 0) ...[
                          const SizedBox(width: 4),
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: ForgeColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          _stats.dueForRevision.toString().padLeft(2, '0'),
                          style: ForgeTypography.headlineLg.copyWith(
                            fontWeight: FontWeight.bold,
                            color: ForgeColors.primary,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'RECALL',
                          style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Interval: 24h - 48h',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            // Recovery Accuracy
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'RECOVERY ACCURACY',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _stats.total > 0
                          ? '${_stats.recoveryAccuracy.toStringAsFixed(1)}%'
                          : '100.0%',
                      style: ForgeTypography.headlineLg.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ForgeColors.tertiary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: _stats.total > 0 ? (_stats.recoveryAccuracy / 100.0) : 1.0,
                        backgroundColor: ForgeColors.surfaceContainerHighest,
                        valueColor: const AlwaysStoppedAnimation(ForgeColors.tertiary),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Top Deficit Vector
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TOP DEFICIT VECTOR',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _stats.topDeficitVector.toUpperCase(),
                      style: ForgeTypography.headlineSm.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ForgeColors.error,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${_stats.repeated} repeated flaws',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSrsRecallBanner() {
    return Container(
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        border: Border(
          left: const BorderSide(color: ForgeColors.primaryContainer, width: 3),
          top: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.6)),
          right: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.6)),
          bottom: BorderSide(color: ForgeColors.outlineVariant.withValues(alpha: 0.6)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: ForgeColors.primaryContainer, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SRS Critical Recall',
                      style: ForgeTypography.headlineSm.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ForgeColors.onSurface,
                      ),
                    ),
                    Text(
                      '${_stats.dueForRevision} critical flaws scheduled for immediate algorithmic recall',
                      style: ForgeTypography.bodySm.copyWith(color: ForgeColors.outline),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: ForgeColors.primaryContainer,
                foregroundColor: ForgeColors.onPrimaryContainer,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              icon: const Icon(Icons.play_arrow, size: 18),
              label: const Text(
                'FILTER DUE SRS RECALL',
                style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
              onPressed: () {
                setState(() {
                  _selectedStatus = 'dueRevision';
                });
                _loadData();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _subjectTabs.length,
        separatorBuilder: (_, index) => const SizedBox(width: 6),
        itemBuilder: (context, index) {
          final tab = _subjectTabs[index];
          final isSelected = _selectedSubject == tab;

          return InkWell(
            onTap: () {
              setState(() => _selectedSubject = tab);
              _loadData();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? ForgeColors.primary : ForgeColors.surfaceContainer,
                borderRadius: ForgeSpacing.borderRadiusXs,
                border: Border.all(
                  color: isSelected ? ForgeColors.primary : ForgeColors.outlineVariant,
                ),
              ),
              child: Text(
                tab,
                style: ForgeTypography.labelSm.copyWith(
                  color: isSelected ? ForgeColors.canvas : ForgeColors.outline,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusFilterRow() {
    final statuses = [
      {'key': 'all', 'label': 'ALL'},
      {'key': 'unresolved', 'label': 'UNRESOLVED'},
      {'key': 'dueRevision', 'label': 'DUE REVISION'},
      {'key': 'repeated', 'label': 'REPEATED'},
      {'key': 'resolved', 'label': 'FIXED'},
    ];

    return SizedBox(
      height: 30,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: statuses.length,
        separatorBuilder: (_, index) => const SizedBox(width: 6),
        itemBuilder: (context, index) {
          final item = statuses[index];
          final isSelected = _selectedStatus == item['key'];

          return ChoiceChip(
            label: Text(
              item['label']!,
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
              setState(() => _selectedStatus = item['key']!);
              _loadData();
            },
          );
        },
      ),
    );
  }

  Widget _buildMistakeCard(Mistake m) {
    final todayStr = DateTime.now().toIso8601String().substring(0, 10);
    final isDue = m.isDueForRevision(todayStr);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(
          color: m.resolved
              ? ForgeColors.outlineVariant
              : (isDue ? ForgeColors.primaryContainer : ForgeColors.outlineVariant),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Meta
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Text(
                        m.source.toUpperCase(),
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text('•', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        m.subject.toUpperCase(),
                        style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              if (m.resolved)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: ForgeColors.tertiary.withValues(alpha: 0.15),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                  ),
                  child: Text(
                    'FIXED ✓',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.tertiary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              else if (isDue)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: ForgeColors.primaryContainer,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                  ),
                  child: Text(
                    'DUE TODAY',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: ForgeColors.surfaceContainer,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(color: ForgeColors.outlineVariant),
                  ),
                  child: Text(
                    'ACTIVE',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),

          // Problem Title & Topic
          Text(
            m.question,
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.w600,
              color: ForgeColors.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'TOPIC: ${m.topic} // ${m.mistakeType}',
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.outline,
            ),
          ),
          const SizedBox(height: 10),

          // Deficit (User Answer / Why I Failed)
          if (m.userAnswer?.isNotEmpty == true) ...[
            Container(
              padding: const EdgeInsets.all(ForgeSpacing.spaceSm),
              decoration: const BoxDecoration(
                color: ForgeColors.surfaceContainerLowest,
                border: Border(
                  left: BorderSide(color: ForgeColors.error, width: 2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.close, color: ForgeColors.error, size: 14),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'DEFICIT (WHY I FAILED):',
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.error,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    m.userAnswer!,
                    style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],

          // Defense Protocol (Correct Answer)
          if (m.correctAnswer?.isNotEmpty == true || m.explanation?.isNotEmpty == true) ...[
            Container(
              padding: const EdgeInsets.all(ForgeSpacing.spaceSm),
              decoration: const BoxDecoration(
                color: ForgeColors.surfaceContainerLowest,
                border: Border(
                  left: BorderSide(color: ForgeColors.tertiary, width: 2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check, color: ForgeColors.tertiary, size: 14),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'DEFENSE PROTOCOL:',
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.tertiary,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    m.correctAnswer ?? m.explanation!,
                    style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurface),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Action Bar
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  // Review Now
                  InkWell(
                    onTap: () => _openDetail(m),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: ForgeColors.primaryContainer,
                        borderRadius: ForgeSpacing.borderRadiusXs,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.restart_alt, size: 14, color: ForgeColors.onPrimaryContainer),
                          const SizedBox(width: 4),
                          Text(
                            'REVIEW NOW',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.onPrimaryContainer,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Fixed toggle
                  InkWell(
                    onTap: () => _toggleResolved(m),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: ForgeColors.surfaceContainer,
                        borderRadius: ForgeSpacing.borderRadiusXs,
                        border: Border.all(color: ForgeColors.outlineVariant),
                      ),
                      child: Text(
                        m.resolved ? 'REOPEN' : 'MARK FIXED',
                        style: ForgeTypography.labelSm.copyWith(
                          color: m.resolved ? ForgeColors.error : ForgeColors.tertiary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              if (m.repeatCount > 1)
                Text(
                  '${m.repeatCount}× flaw',
                  style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.shield_outlined, size: 48, color: ForgeColors.outlineVariant),
          const SizedBox(height: 14),
          Text(
            '0 MISTAKES FOUND',
            style: ForgeTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _searchQuery.isNotEmpty || _selectedStatus != 'all' || _selectedSubject != 'ALL'
                ? 'No flaws match your currently applied filters.'
                : 'Your mistake bank is completely clear. Whenever you encounter a wrong answer, syntax trap, or logic blunder, log it here to build permanent error defense.',
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.outline,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: ForgeColors.primaryContainer,
              foregroundColor: ForgeColors.onPrimaryContainer,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            icon: const Icon(Icons.add, size: 16),
            label: const Text('LOG NEW MISTAKE', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: _openAddSheet,
          ),
        ],
      ),
    );
  }
}
