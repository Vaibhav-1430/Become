import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/services/streak_service.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../data/dev_repository.dart';
import '../../domain/dev_topic.dart';
import '../../domain/dev_progress.dart';

class DevelopmentScreen extends StatefulWidget {
  final DevRepository repository;

  const DevelopmentScreen({
    super.key,
    required this.repository,
  });

  @override
  State<DevelopmentScreen> createState() => _DevelopmentScreenState();
}

class _DevelopmentScreenState extends State<DevelopmentScreen> {
  List<DevTopic> _topics = [];
  DevProgress? _progress;
  bool _isLoading = true;
  String? _errorMessage;
  String _activeCategory = 'ALL';

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
      final topics = await widget.repository.getTopics();
      final progress = await widget.repository.getDevProgress();

      if (mounted) {
        setState(() {
          _topics = topics;
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

  Future<void> _handleToggleCompleted(DevTopic topic, bool isCompleted) async {
    setState(() {
      _topics = _topics.map((t) {
        if (t.id == topic.id) {
          return t.copyWith(
            isCompleted: isCompleted,
            progressPct: isCompleted ? 100.0 : 0.0,
          );
        }
        return t;
      }).toList();
    });

    try {
      await widget.repository.toggleTopicCompleted(topic.id, isCompleted);
      final updatedProgress = await widget.repository.getDevProgress();
      if (mounted) {
        setState(() {
          _progress = updatedProgress;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _topics = _topics.map((t) {
            if (t.id == topic.id) {
              return t.copyWith(
                isCompleted: !isCompleted,
                progressPct: !isCompleted ? 100.0 : 0.0,
              );
            }
            return t;
          }).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to update topic status: $e',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
            ),
            backgroundColor: ForgeColors.error,
          ),
        );
      }
    }
  }

  Future<void> _launchResourceUrl(String urlString) async {
    final uri = Uri.tryParse(urlString);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Could not open resource: $urlString',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
            ),
            backgroundColor: ForgeColors.surfaceContainer,
          ),
        );
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
                      color: ForgeColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(3),
                      border: Border.all(color: ForgeColors.borderSubtle),
                    ),
                    child: Text(
                      'DEV',
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: ForgeColors.borderSubtle),
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
              IconButton(
                key: const Key('btn_sync_dev'),
                icon: const Icon(Icons.sync, color: ForgeColors.onSurfaceVariant, size: 18),
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
                onPressed: () async {
                  await RefreshCoordinator.instance.refreshDevelopment(
                    onRefresh: widget.repository.refresh,
                  );
                  await _loadData();
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
          const SizedBox(height: 16),
          Text(
            'LOADING TECH TRACKS...',
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
              'Failed to load Development data',
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
        const DevProgress(
          totalTopics: 16,
          completedTopics: 0,
        );

    final filteredTopics = _activeCategory == 'ALL'
        ? _topics
        : _topics.where((t) => t.trackCategory == _activeCategory).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 80),
      children: [
        // Protocol Breadcrumb & State Capsule
        _buildProtocolBreadcrumb(),
        const SizedBox(height: 12),

        // Telemetry Summary 2x2 Grid
        _buildTelemetryGrid(progress),
        const SizedBox(height: 14),

        // Active Core Track Banner
        _buildActiveCoreTrackBanner(),
        const SizedBox(height: 16),

        // Track Switcher / Filter Pills
        _buildTrackFilterPills(),
        const SizedBox(height: 12),

        // Technology Cards List
        ...filteredTopics.map((topic) => _buildTechCard(topic)),
      ],
    );
  }

  Widget _buildProtocolBreadcrumb() {
    return Container(
      padding: const EdgeInsets.only(bottom: 8),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
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
                    color: ForgeColors.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    'SKILL MATRIX // PRODUCTION CAPABILITY',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurfaceVariant,
                      fontSize: 9,
                      letterSpacing: 0.8,
                    ),
                    overflow: TextOverflow.ellipsis,
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
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: ForgeColors.tertiary,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
              Text(
                'SYNC OK',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.tertiary,
                  fontSize: 9,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryGrid(DevProgress progress) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.30,
      children: [
        // Metric 1: Hours Logged
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: ForgeColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'HOURS LOGGED',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text('TGT: 200h', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary, fontSize: 9)),
                ],
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text('${progress.hoursLogged}', style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 4),
                  Text('HRS', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant)),
                ],
              ),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (progress.hoursLogged / 200).clamp(0.0, 1.0),
                  backgroundColor: ForgeColors.surfaceContainerHighest,
                  color: ForgeColors.primary,
                  minHeight: 3,
                ),
              ),
            ],
          ),
        ),

        // Metric 2: Code Commits
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: ForgeColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'CODE COMMITS',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text('[MTH]', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.tertiary, fontSize: 9)),
                ],
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text('${progress.commitsCount}', style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      '+22/wk',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.tertiary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Container(width: 5, height: 5, decoration: const BoxDecoration(color: ForgeColors.tertiary, shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Git Master Sync',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Metric 3: Stack Mastery
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: ForgeColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'STACK MASTERY',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text('AVG', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9)),
                ],
              ),
              Text(
                '${progress.stackMasteryPct.toStringAsFixed(1)}%',
                style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.primaryContainer, fontWeight: FontWeight.w700),
              ),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (progress.stackMasteryPct / 100).clamp(0.0, 1.0),
                  backgroundColor: ForgeColors.surfaceContainerHighest,
                  color: ForgeColors.primaryContainer,
                  minHeight: 3,
                ),
              ),
            ],
          ),
        ),

        // Metric 4: OA Ready Stacks
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: ForgeColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'OA READY STACKS',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text('PASS', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.secondary, fontSize: 9)),
                ],
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text('${progress.oaReadyCount}/${progress.oaTotalCount}', style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.secondary, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      'TIER-1',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Container(width: 5, height: 5, decoration: const BoxDecoration(color: ForgeColors.secondary, shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Tier-1 Valid',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

  Widget _buildActiveCoreTrackBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: ForgeColors.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(width: 6, height: 6, decoration: BoxDecoration(color: ForgeColors.primaryContainer, borderRadius: BorderRadius.circular(1))),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'ACTIVE FOCUS // FULL-STACK NEXT.JS & SYSTEMS',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 9,
                          letterSpacing: 0.8,
                        ),
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
                  color: ForgeColors.primaryContainer.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(3),
                  border: Border.all(color: ForgeColors.primaryContainer.withValues(alpha: 0.4)),
                ),
                child: Text(
                  '74% COMPLETE',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.primaryContainer,
                    fontWeight: FontWeight.w700,
                    fontSize: 9,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Title & Subtitle
          Text(
            'Next.js 14 App Router, Server Actions & Distributed Caching',
            style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            'Module 04: Optimistic Mutations with Redis & TanStack Query',
            style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
          ),
          const SizedBox(height: 10),

          // Progress bar & lesson count
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: ForgeColors.canvas,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        '14/19 Lessons + 2 Projects',
                        style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurfaceVariant),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        '1h 20m remaining today',
                        style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary, fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: const LinearProgressIndicator(
                    value: 0.74,
                    backgroundColor: ForgeColors.surfaceContainerHighest,
                    color: ForgeColors.primaryContainer,
                    minHeight: 5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Action buttons
          SizedBox(
            width: double.infinity,
            height: 42,
            child: ElevatedButton.icon(
              key: const Key('btn_continue_dev_workbench'),
              onPressed: () => _launchResourceUrl(
                'https://youtube.com/playlist?list=PLu71SKxNbfoBAaWGtn9GA2PTw0HO0tXzq&si=xoz4tS-8kNPq-9-K',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: ForgeColors.primaryContainer,
                foregroundColor: ForgeColors.onPrimaryContainer,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              icon: const Icon(Icons.play_arrow, size: 18),
              label: Text(
                'CONTINUE REPO WORKBENCH',
                style: ForgeTypography.labelMd.copyWith(
                  color: ForgeColors.onPrimaryContainer,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _launchResourceUrl('https://github.com'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: ForgeColors.borderSubtle),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  icon: const Icon(Icons.difference, size: 14, color: ForgeColors.onSurface),
                  label: Text('View Commit Diff', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _launchResourceUrl('https://nextjs.org/docs'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: ForgeColors.borderSubtle),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  icon: const Icon(Icons.menu_book, size: 14, color: ForgeColors.onSurface),
                  label: Text('Doc Reference', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrackFilterPills() {
    final categories = ['ALL', 'FRONTEND', 'BACKEND', 'DEVOPS', 'PROJECTS'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                'ACTIVE ENGINEERING TRACKS',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.onSurfaceVariant,
                  letterSpacing: 0.8,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${_topics.where((t) => t.isCompleted).length} / ${_topics.length} DONE',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: categories.map((cat) {
              final isSelected = _activeCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 6.0),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _activeCategory = cat;
                    });
                  },
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? ForgeColors.primaryContainer
                          : ForgeColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: isSelected
                            ? ForgeColors.primaryContainer
                            : ForgeColors.borderSubtle,
                      ),
                    ),
                    child: Text(
                      cat == 'ALL' ? 'ALL (${_topics.length})' : cat,
                      style: ForgeTypography.labelSm.copyWith(
                        color: isSelected
                            ? ForgeColors.onPrimaryContainer
                            : ForgeColors.onSurfaceVariant,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTechCard(DevTopic topic) {
    final isMastered = topic.isCompleted;
    final isActive = topic.id == 'nextjs';
    final statusText = isMastered
        ? 'MASTERED'
        : isActive
            ? 'ACTIVE'
            : 'IN PROGRESS';

    final statusColor = isMastered
        ? ForgeColors.tertiary
        : isActive
            ? ForgeColors.primary
            : ForgeColors.onSurfaceVariant;

    return Container(
      key: Key('dev_card_${topic.id}'),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isActive
              ? ForgeColors.primaryContainer.withValues(alpha: 0.6)
              : ForgeColors.borderSubtle,
        ),
      ),
      child: Row(
        children: [
          // Code Badge Box
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: ForgeColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Text(
              topic.code,
              style: ForgeTypography.labelSm.copyWith(
                color: statusColor,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Info Column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        topic.name,
                        style: ForgeTypography.bodyMd.copyWith(
                          color: ForgeColors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(2),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        statusText,
                        style: ForgeTypography.labelSm.copyWith(
                          color: statusColor,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  topic.subtitle,
                  style: ForgeTypography.bodySm.copyWith(color: ForgeColors.onSurfaceVariant),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Progress percentage & action button
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${topic.progressPct.toStringAsFixed(0)}%',
                style: ForgeTypography.labelSm.copyWith(
                  color: statusColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  // Toggle Complete Checkbox
                  GestureDetector(
                    key: Key('btn_toggle_dev_${topic.id}'),
                    onTap: () => _handleToggleCompleted(topic, !topic.isCompleted),
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: topic.isCompleted
                            ? ForgeColors.tertiary.withValues(alpha: 0.2)
                            : ForgeColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: topic.isCompleted
                              ? ForgeColors.tertiary
                              : ForgeColors.borderSubtle,
                        ),
                      ),
                      child: topic.isCompleted
                          ? const Icon(Icons.check, size: 14, color: ForgeColors.tertiary)
                          : null,
                    ),
                  ),
                  const SizedBox(width: 6),

                  // Open External Resource Button
                  ElevatedButton(
                    key: Key('btn_open_resource_${topic.id}'),
                    onPressed: () => _launchResourceUrl(topic.sourceUrl),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isActive
                          ? ForgeColors.primaryContainer
                          : ForgeColors.surfaceContainer,
                      foregroundColor: isActive
                          ? ForgeColors.onPrimaryContainer
                          : ForgeColors.onSurface,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: const Size(54, 26),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      side: BorderSide(
                        color: isActive
                            ? ForgeColors.primaryContainer
                            : ForgeColors.borderSubtle,
                      ),
                    ),
                    child: Text(
                      isActive
                          ? 'RESUME'
                          : isMastered
                              ? 'AUDIT'
                              : 'OPEN',
                      style: ForgeTypography.labelSm.copyWith(
                        color: isActive
                            ? ForgeColors.onPrimaryContainer
                            : ForgeColors.onSurface,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
