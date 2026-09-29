import 'package:flutter/material.dart';
import '../../../../core/services/streak_service.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../data/dsa_repository.dart';
import '../../domain/dsa_section.dart';
import '../../domain/dsa_problem.dart';
import '../../domain/dsa_progress.dart';
import '../widgets/dsa_problem_detail_sheet.dart';

class DsaScreen extends StatefulWidget {
  final DsaRepository repository;

  const DsaScreen({
    super.key,
    required this.repository,
  });

  @override
  State<DsaScreen> createState() => _DsaScreenState();
}

class _DsaScreenState extends State<DsaScreen> {
  List<DsaSection> _curriculum = [];
  DsaProgress? _progress;
  bool _isLoading = true;
  String? _errorMessage;

  // Track expanded section index (default to 2: Step 3 / Arrays like Stitch)
  int _expandedSectionIndex = 2;
  String _searchQuery = '';
  bool _isSearchVisible = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final curriculum = await widget.repository.getCurriculum();
      final progress = await widget.repository.getDsaProgress();

      if (mounted) {
        setState(() {
          _curriculum = curriculum;
          _progress = progress;
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

  Future<void> _handleToggleSolved(DsaProblem problem, bool isSolved) async {
    // 1. Optimistic UI update
    setState(() {
      _curriculum = _curriculum.map((section) {
        final updatedTopics = section.topics.map((topic) {
          final updatedProblems = topic.problems.map((p) {
            if (p.id == problem.id) {
              return p.copyWith(isSolved: isSolved);
            }
            return p;
          }).toList();
          return topic.copyWithProblems(updatedProblems);
        }).toList();
        return section.copyWithTopics(updatedTopics);
      }).toList();
    });

    try {
      await widget.repository.toggleProblemSolved(problem.id, isSolved);
      final updatedProgress = await widget.repository.getDsaProgress();
      if (mounted) {
        setState(() {
          _progress = updatedProgress;
        });
      }
    } catch (e) {
      // 2. Rollback on failure
      if (mounted) {
        setState(() {
          _curriculum = _curriculum.map((section) {
            final updatedTopics = section.topics.map((topic) {
              final updatedProblems = topic.problems.map((p) {
                if (p.id == problem.id) {
                  return p.copyWith(isSolved: !isSolved);
                }
                return p;
              }).toList();
              return topic.copyWithProblems(updatedProblems);
            }).toList();
            return section.copyWithTopics(updatedTopics);
          }).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to update DSA progress: $e',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
            ),
            backgroundColor: ForgeColors.error,
          ),
        );
      }
    }
  }

  void _showProblemDetail(DsaProblem problem) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DsaProblemDetailSheet(
        problem: problem,
        onToggleSolved: (newVal) => _handleToggleSolved(problem, newVal),
      ),
    );
  }

  Color _getDifficultyColor(String diff) {
    switch (diff.toLowerCase()) {
      case 'easy':
        return ForgeColors.tertiary;
      case 'medium':
        return ForgeColors.primary;
      case 'hard':
        return ForgeColors.error;
      default:
        return ForgeColors.primary;
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
      padding: const EdgeInsets.symmetric(horizontal: 8),
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
                const Icon(Icons.terminal, color: ForgeColors.primary, size: 20),
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
                      color: ForgeColors.primary.withValues(alpha: 0.1),
                      border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Text(
                      'DSA',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                key: const Key('btn_search_dsa'),
                icon: Icon(
                  _isSearchVisible ? Icons.close : Icons.search,
                  color: ForgeColors.onSurfaceVariant,
                  size: 18,
                ),
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
                onPressed: () {
                  setState(() {
                    _isSearchVisible = !_isSearchVisible;
                    if (!_isSearchVisible) _searchQuery = '';
                  });
                },
              ),
              IconButton(
                key: const Key('btn_sync_dsa'),
                icon: const Icon(Icons.sync, color: ForgeColors.onSurfaceVariant, size: 18),
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
                onPressed: () async {
                  await RefreshCoordinator.instance.refreshDsa(
                    onRefresh: widget.repository.refresh,
                  );
                  await _loadData();
                },
              ),
              const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: ForgeColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.local_fire_department,
                      color: ForgeColors.primary,
                      size: 14,
                    ),
                    const SizedBox(width: 3),
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
          const SizedBox(height: 16),
          Text(
            'LOADING DSA CURRICULUM...',
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.onSurfaceVariant,
              letterSpacing: 1.2,
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
              'Failed to load DSA data',
              style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface),
            ),
            const SizedBox(height: 6),
            Text(
              _errorMessage ?? 'Unknown error',
              style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
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
    final progress = _progress ??
        const DsaProgress(
          totalProblems: 443,
          solvedProblems: 0,
          totalEasy: 0,
          solvedEasy: 0,
          totalMedium: 0,
          solvedMedium: 0,
          totalHard: 0,
          solvedHard: 0,
        );

    final filteredCurriculum = _searchQuery.isEmpty
        ? _curriculum
        : _curriculum.map((section) {
            final matchingTopics = section.topics.map((topic) {
              final matchingProblems = topic.problems.where((p) {
                return p.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                    p.difficulty.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                    p.id.contains(_searchQuery);
              }).toList();
              return topic.copyWithProblems(matchingProblems);
            }).where((t) => t.problems.isNotEmpty).toList();
            return section.copyWithTopics(matchingTopics);
          }).where((s) => s.topics.isNotEmpty).toList();

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
          children: [
            if (_isSearchVisible) ...[
              TextField(
                key: const Key('dsa_search_field'),
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurface),
                decoration: InputDecoration(
                  hintText: 'Search problems, topics, difficulty...',
                  hintStyle: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
                  prefixIcon: const Icon(Icons.search, color: ForgeColors.primary, size: 20),
                  filled: true,
                  fillColor: ForgeColors.surfaceContainer,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: const BorderSide(color: ForgeColors.borderSubtle),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val.trim();
                  });
                },
              ),
              const SizedBox(height: 12),
            ],

            // Subheader Sheet Selection Chips
            _buildSheetChips(),
            const SizedBox(height: 12),

            // Metrics Cockpit Card
            _buildMetricsCockpitCard(progress),
            const SizedBox(height: 16),

            // Topics Accordion List
            ...filteredCurriculum.asMap().entries.map((entry) {
              final index = entry.key;
              final section = entry.value;
              final isExpanded = _expandedSectionIndex == index;
              return _buildSectionAccordion(section, index, isExpanded);
            }),
          ],
        ),

        // Quick Action Sticky Execution Bar
        if (progress.nextProblem != null)
          Positioned(
            left: 16,
            right: 16,
            bottom: 12,
            child: _buildStickyQueueBar(progress.nextProblem!),
          ),
      ],
    );
  }

  Widget _buildSheetChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: ForgeColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.5)),
            ),
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
                Text(
                  'Striver A2Z Sheet',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Text(
              'LeetCode 75',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainer,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Text(
              'Blind 75',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsCockpitCard(DsaProgress progress) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Sheet Completion + Target Velocity
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SHEET COMPLETION',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                        letterSpacing: 0.8,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '${progress.solvedProblems}',
                          style: ForgeTypography.monoMetric.copyWith(color: ForgeColors.onSurface),
                        ),
                        Text(
                          '/${progress.totalProblems}',
                          style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurfaceVariant),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            progress.solvedProblems == 0
                                ? '[NO DSA PROGRESS YET]'
                                : '[${progress.overallPct.toStringAsFixed(1)}%]',
                            style: ForgeTypography.labelSm.copyWith(
                              color: progress.solvedProblems == 0
                                  ? ForgeColors.onSurfaceVariant
                                  : ForgeColors.tertiary,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'TARGET VELOCITY',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                        letterSpacing: 0.8,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '+4 daily pace',
                      style: ForgeTypography.labelMd.copyWith(
                        color: ForgeColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Segmented Difficulty Progress Bar
          Container(
            height: 8,
            width: double.infinity,
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(4),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Row(
                children: [
                  if (progress.totalProblems > 0 && progress.solvedEasy > 0)
                    Flexible(
                      flex: progress.solvedEasy,
                      child: Container(color: ForgeColors.tertiary),
                    ),
                  if (progress.totalProblems > 0 && progress.solvedMedium > 0)
                    Flexible(
                      flex: progress.solvedMedium,
                      child: Container(color: ForgeColors.primary),
                    ),
                  if (progress.totalProblems > 0 && progress.solvedHard > 0)
                    Flexible(
                      flex: progress.solvedHard,
                      child: Container(color: ForgeColors.error),
                    ),
                  Flexible(
                    flex: progress.totalProblems - progress.solvedProblems > 0
                        ? progress.totalProblems - progress.solvedProblems
                        : 1,
                    child: Container(color: Colors.transparent),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Difficulty Breakdown Pills
          Row(
            children: [
              Expanded(
                child: _buildDiffPill(
                  label: 'EASY',
                  solved: progress.solvedEasy,
                  total: progress.totalEasy,
                  color: ForgeColors.tertiary,
                ),
              ),
              const SizedBox(width: 5),
              Expanded(
                child: _buildDiffPill(
                  label: 'MEDIUM',
                  solved: progress.solvedMedium,
                  total: progress.totalMedium,
                  color: ForgeColors.primary,
                ),
              ),
              const SizedBox(width: 5),
              Expanded(
                child: _buildDiffPill(
                  label: 'HARD',
                  solved: progress.solvedHard,
                  total: progress.totalHard,
                  color: ForgeColors.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Streak & Micro Metrics Row
          Container(
            padding: const EdgeInsets.only(top: 10),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: ForgeColors.borderSubtle)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.bolt, color: ForgeColors.primary, size: 15),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('STREAK', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                            Text('${progress.streakDays}d', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 20, color: ForgeColors.borderSubtle),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 6.0),
                    child: Row(
                      children: [
                        const Icon(Icons.replay, color: ForgeColors.secondary, size: 15),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SRS DUE', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                              Text('${progress.srsDueCount}', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.secondary, fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Container(width: 1, height: 20, color: ForgeColors.borderSubtle),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 6.0),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: ForgeColors.tertiary, size: 15),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('ACCURACY', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                              Text('${progress.accuracyPct.toStringAsFixed(0)}%', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDiffPill({
    required String label,
    required int solved,
    required int total,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 5, height: 5, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 4),
              Text(
                label,
                style: ForgeTypography.labelSm.copyWith(color: color, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            '$solved/$total',
            style: ForgeTypography.labelMd.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionAccordion(DsaSection section, int index, bool isExpanded) {
    final stepNum = (section.sectionIndex + 1).toString().padLeft(2, '0');
    final isMastered = section.isCompleted;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainer,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isExpanded
              ? ForgeColors.primary.withValues(alpha: 0.5)
              : ForgeColors.borderSubtle,
        ),
      ),
      child: Column(
        children: [
          // Section Header Tile
          InkWell(
            key: Key('dsa_section_$index'),
            onTap: () {
              setState(() {
                _expandedSectionIndex = isExpanded ? -1 : index;
              });
            },
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isMastered
                          ? ForgeColors.tertiary.withValues(alpha: 0.15)
                          : ForgeColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: isMastered
                            ? ForgeColors.tertiary.withValues(alpha: 0.4)
                            : ForgeColors.primary.withValues(alpha: 0.4),
                      ),
                    ),
                    child: isMastered
                        ? const Icon(Icons.check, size: 16, color: ForgeColors.tertiary)
                        : Text(
                            stepNum,
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Step ${section.sectionIndex + 1}: ${section.name}',
                          style: ForgeTypography.bodyMd.copyWith(
                            color: ForgeColors.onSurface,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(
                              '${section.solvedProblems}/${section.totalProblems}',
                              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
                            ),
                            const SizedBox(width: 5),
                            Container(width: 3, height: 3, decoration: const BoxDecoration(color: ForgeColors.outlineVariant, shape: BoxShape.circle)),
                            const SizedBox(width: 5),
                            Flexible(
                              child: Text(
                                isMastered
                                    ? 'MASTERED'
                                    : '${section.progressPct.toStringAsFixed(0)}% DONE',
                                style: ForgeTypography.labelSm.copyWith(
                                  color: isMastered ? ForgeColors.tertiary : ForgeColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: isExpanded ? ForgeColors.primary : ForgeColors.onSurfaceVariant,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),

          // Expanded Content: Subtopics & Problems
          if (isExpanded) ...[
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: ForgeColors.borderSubtle)),
              ),
              child: Column(
                children: section.topics.map((topic) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Subtopic Header Banner
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        color: ForgeColors.surfaceContainerHigh.withValues(alpha: 0.5),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                topic.name.toUpperCase(),
                                style: ForgeTypography.labelSm.copyWith(
                                  color: ForgeColors.onSurfaceVariant,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.8,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${topic.solvedProblems}/${topic.totalProblems} DONE',
                              style: ForgeTypography.labelSm.copyWith(
                                color: topic.isCompleted ? ForgeColors.tertiary : ForgeColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Problem Rows
                      ...topic.problems.map((prob) {
                        final diffColor = _getDifficultyColor(prob.difficulty);
                        return InkWell(
                          key: Key('dsa_problem_${prob.id}'),
                          onTap: () => _showProblemDetail(prob),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(color: ForgeColors.borderSubtle.withValues(alpha: 0.5)),
                              ),
                            ),
                            child: Row(
                              children: [
                                // Solved Toggle Checkbox Icon
                                GestureDetector(
                                  onTap: () => _handleToggleSolved(prob, !prob.isSolved),
                                  child: Container(
                                    width: 22,
                                    height: 22,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: prob.isSolved
                                          ? ForgeColors.tertiary.withValues(alpha: 0.2)
                                          : Colors.transparent,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: prob.isSolved
                                            ? ForgeColors.tertiary
                                            : ForgeColors.borderSubtle,
                                        width: 1.5,
                                      ),
                                    ),
                                    child: prob.isSolved
                                        ? const Icon(Icons.check, size: 14, color: ForgeColors.tertiary)
                                        : null,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        prob.title,
                                        style: ForgeTypography.bodyMd.copyWith(
                                          color: prob.isSolved
                                              ? ForgeColors.onSurfaceVariant
                                              : ForgeColors.onSurface,
                                          decoration: prob.isSolved
                                              ? TextDecoration.lineThrough
                                              : null,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: diffColor.withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(2),
                                              border: Border.all(color: diffColor.withValues(alpha: 0.3)),
                                            ),
                                            child: Text(
                                              prob.difficulty.toUpperCase(),
                                              style: ForgeTypography.labelSm.copyWith(
                                                color: diffColor,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                          if (prob.leetcodeUrl != null) ...[
                                            const SizedBox(width: 6),
                                            const Icon(Icons.code, size: 12, color: ForgeColors.primary),
                                          ],
                                          if (prob.youtubeUrl != null) ...[
                                            const SizedBox(width: 4),
                                            const Icon(Icons.play_circle_fill, size: 12, color: ForgeColors.error),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.info_outline, size: 18, color: ForgeColors.onSurfaceVariant),
                                  onPressed: () => _showProblemDetail(prob),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStickyQueueBar(DsaProblem nextProblem) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerHigh.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: ForgeColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(Icons.terminal, color: ForgeColors.primary, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'QUEUE DISPATCH',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                    fontSize: 10,
                    letterSpacing: 0.8,
                  ),
                ),
                Text(
                  nextProblem.title,
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            key: const Key('btn_run_next_problem'),
            onTap: () => _showProblemDetail(nextProblem),
            borderRadius: BorderRadius.circular(4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: ForgeColors.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'RUN',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onPrimary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.open_in_new, size: 14, color: ForgeColors.onPrimary),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
