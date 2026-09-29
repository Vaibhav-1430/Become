import 'package:flutter/material.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../dsa/data/dsa_repository.dart';
import '../../../dsa/data/supabase_dsa_repository.dart';
import '../../../development/data/dev_repository.dart';
import '../../../development/data/supabase_dev_repository.dart';
import '../../../mistakes/data/mistake_repository.dart';
import '../../../mistakes/data/supabase_mistake_repository.dart';
import '../../data/mock_test_repository.dart';
import '../../data/supabase_test_repository.dart';
import '../../data/test_repository.dart';
import '../../domain/models/test_attempt_result.dart';
import '../../domain/models/test_session.dart';
import '../../services/code_execution_service.dart';
import '../../services/judge0_code_execution_service.dart';
import '../../services/syllabus_boundary_service.dart';
import 'test_result_screen.dart';
import 'test_workbench_screen.dart';

/// Test Engine Command Center & Assessment Launcher.
class TestHubScreen extends StatefulWidget {
  final TestRepository? testRepository;
  final DsaRepository? dsaRepository;
  final DevRepository? devRepository;
  final MistakeRepository? mistakeRepository;
  final CodeExecutionService? codeExecutionService;

  const TestHubScreen({
    super.key,
    this.testRepository,
    this.dsaRepository,
    this.devRepository,
    this.mistakeRepository,
    this.codeExecutionService,
  });

  @override
  State<TestHubScreen> createState() => _TestHubScreenState();
}

class _TestHubScreenState extends State<TestHubScreen> with SingleTickerProviderStateMixin {
  late final TestRepository _testRepo;
  late final MistakeRepository _mistakeRepo;
  late final CodeExecutionService _codeExecutor;

  late TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;
  SyllabusBoundary? _boundary;
  List<TestAttemptResult> _history = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    final dsaRepo = widget.dsaRepository ?? SupabaseDsaRepository();
    final devRepo = widget.devRepository ?? SupabaseDevRepository();

    _testRepo = widget.testRepository ??
        (ForgeSupabase.instance.isInitialized
            ? SupabaseTestRepository(
                client: ForgeSupabase.instance.client,
                dsaRepository: dsaRepo,
                devRepository: devRepo,
              )
            : MockTestRepository(
                dsaRepository: dsaRepo,
                devRepository: devRepo,
              ));

    _mistakeRepo = widget.mistakeRepository ??
        (ForgeSupabase.instance.isInitialized
            ? SupabaseMistakeRepository(client: ForgeSupabase.instance.client)
            : SupabaseMistakeRepository());

    _codeExecutor = widget.codeExecutionService ?? Judge0CodeExecutionService();

    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _testRepo.getSyllabusBoundary(),
        _testRepo.getTestHistory(),
      ]);

      if (mounted) {
        setState(() {
          _boundary = results[0] as SyllabusBoundary;
          _history = results[1] as List<TestAttemptResult>;
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

  Future<void> _startTest(TestType type) async {
    final b = _boundary;
    if (b == null || !b.isEligibleFor(type)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No test available yet. Complete more topics to unlock your first test.'),
        ),
      );
      return;
    }

    try {
      final session = await _testRepo.generateTest(
        type: type,
        questionCount: type == TestType.dsa ? 5 : type == TestType.development ? 8 : 10,
        durationMinutes: type == TestType.mixed ? 45 : 30,
      );

      if (!mounted) return;

      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => TestWorkbenchScreen(
            initialSession: session,
            codeExecutionService: _codeExecutor,
            mistakeRepository: _mistakeRepo,
            onFinalizeSubmission: (result) async {
              if (result is TestAttemptResult) {
                await _testRepo.saveTestAttempt(result);
                _loadData();
              }
            },
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate test: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        title: Text(
          'FORGE TEST ENGINE',
          style: ForgeTypography.labelMd.copyWith(
            color: ForgeColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: ForgeColors.accentAmber,
          labelColor: ForgeColors.accentAmber,
          unselectedLabelColor: ForgeColors.textSecondary,
          labelStyle: ForgeTypography.labelSm.copyWith(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'ASSESSMENTS'),
            Tab(text: 'HISTORY'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(ForgeColors.accentAmber),
              ),
            )
          : _errorMessage != null
              ? _buildErrorView()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildAssessmentSelectionTab(),
                    _buildHistoryTab(),
                  ],
                ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 36, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text(
              'Failed to load Test Engine',
              style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.textPrimary),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              style: ElevatedButton.styleFrom(backgroundColor: ForgeColors.accentAmber),
              child: Text('RETRY', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.canvas)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAssessmentSelectionTab() {
    final b = _boundary;
    final hasAny = b != null && (b.hasDsaEligibility || b.hasDevEligibility);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Syllabus Boundary Hero Card
          _buildBoundaryHeroCard(b),
          const SizedBox(height: 16),

          if (!hasAny) ...[
            _buildNoTestAvailableCard(),
          ] else ...[
            Text(
              'SELECT ASSESSMENT TYPE',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),

            // DSA Test Card
            _buildTestOptionCard(
              title: 'DSA ASSESSMENT',
              subtitle: 'Data structures & algorithm coding problems with live sandbox execution.',
              specs: '5 Questions • 30 Mins • C++ Sandbox',
              badge: 'DSA',
              isEligible: b.hasDsaEligibility,
              lockReason: 'Complete at least 1 DSA problem to unlock.',
              onTap: () => _startTest(TestType.dsa),
            ),
            const SizedBox(height: 12),

            // Development Test Card
            _buildTestOptionCard(
              title: 'FULL-STACK DEVELOPMENT',
              subtitle: 'Modern web, frontend architecture, backend systems & dev tooling.',
              specs: '8 Questions • 30 Mins • Tech Tracks',
              badge: 'DEV',
              isEligible: b.hasDevEligibility,
              lockReason: 'Complete at least 1 tech track in Development to unlock.',
              onTap: () => _startTest(TestType.development),
            ),
            const SizedBox(height: 12),

            // Mixed Placement Simulation
            _buildTestOptionCard(
              title: 'COMPREHENSIVE OA SIMULATION',
              subtitle: 'Balanced placement test combining DSA coding, full-stack dev & core CS.',
              specs: '10 Questions • 45 Mins • Full Spectrum',
              badge: 'MIXED',
              isEligible: hasAny,
              lockReason: 'Complete DSA or Dev curriculum to unlock.',
              onTap: () => _startTest(TestType.mixed),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBoundaryHeroCard(SyllabusBoundary? b) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, size: 18, color: ForgeColors.accentAmber),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'SYLLABUS BOUNDARY ACTIVE',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'ENFORCED',
                  style: ForgeTypography.labelSm.copyWith(
                    color: const Color(0xFF10B981),
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'The Test Engine strictly queries your verified Study OS progress. Questions outside your studied curriculum are excluded.',
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.textSecondary,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          const Divider(color: ForgeColors.borderSubtle, height: 1),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'DSA Boundary:',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary, fontSize: 11),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  b?.dsaBoundaryLabel ?? 'Checking...',
                  style: ForgeTypography.labelSm.copyWith(color: ForgeColors.accentAmber, fontSize: 11),
                  textAlign: TextAlign.right,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Dev Tech Tracks:',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary, fontSize: 11),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${b?.eligibleDevTopicIds.length ?? 0} Tracks Covered',
                  style: ForgeTypography.labelSm.copyWith(color: ForgeColors.accentAmber, fontSize: 11),
                  textAlign: TextAlign.right,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNoTestAvailableCard() {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        children: [
          const Icon(Icons.lock_clock_outlined, size: 40, color: ForgeColors.accentAmber),
          const SizedBox(height: 12),
          Text(
            'No test available yet',
            style: ForgeTypography.headlineSm.copyWith(
              color: ForgeColors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Complete more topics to unlock your first test.',
            style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTestOptionCard({
    required String title,
    required String subtitle,
    required String specs,
    required String badge,
    required bool isEligible,
    required String lockReason,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: isEligible ? onTap : null,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isEligible ? ForgeColors.surfaceLevel1 : ForgeColors.surfaceLevel1.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isEligible ? ForgeColors.borderSubtle : ForgeColors.borderSubtle.withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isEligible ? ForgeColors.accentAmber.withValues(alpha: 0.15) : ForgeColors.surfaceLevel2,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge,
                    style: ForgeTypography.labelSm.copyWith(
                      color: isEligible ? ForgeColors.accentAmber : ForgeColors.textSecondary,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: ForgeTypography.labelMd.copyWith(
                      color: isEligible ? ForgeColors.textPrimary : ForgeColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (!isEligible)
                  const Icon(Icons.lock, size: 14, color: ForgeColors.textSecondary)
                else
                  const Icon(Icons.arrow_forward_ios, size: 12, color: ForgeColors.accentAmber),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: ForgeTypography.bodySm.copyWith(
                color: ForgeColors.textSecondary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    specs,
                    style: ForgeTypography.labelSm.copyWith(
                      color: isEligible ? ForgeColors.accentAmber : ForgeColors.textSecondary,
                      fontSize: 10,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (!isEligible) ...[
                  const SizedBox(width: 8),
                  Text(
                    'LOCKED',
                    style: ForgeTypography.labelSm.copyWith(color: const Color(0xFFEF4444), fontSize: 10),
                  ),
                ],
              ],
            ),
            if (!isEligible) ...[
              const SizedBox(height: 6),
              Text(
                lockReason,
                style: ForgeTypography.bodySm.copyWith(
                  color: ForgeColors.textSecondary.withValues(alpha: 0.7),
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab() {
    if (_history.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.history_outlined, size: 40, color: ForgeColors.textSecondary),
              const SizedBox(height: 12),
              Text(
                'No tests attempted yet.',
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _history.length,
      itemBuilder: (context, index) {
        final item = _history[index];
        final minutes = item.timeTakenSeconds ~/ 60;
        final seconds = item.timeTakenSeconds % 60;
        final timeStr = '${minutes}m ${seconds}s';

        final scoreColor = item.scorePct >= 70
            ? const Color(0xFF10B981)
            : item.scorePct >= 50
                ? const Color(0xFFF59E0B)
                : const Color(0xFFEF4444);

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: ForgeColors.surfaceLevel1,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: ForgeColors.borderSubtle),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            title: Text(
              item.testTitle,
              style: ForgeTypography.bodyMd.copyWith(
                color: ForgeColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '${item.date} • $timeStr • Accuracy: ${item.accuracyPct.toStringAsFixed(0)}%',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.textSecondary,
                  fontSize: 11,
                ),
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${item.scorePct.toStringAsFixed(0)}%',
                  style: ForgeTypography.labelMd.copyWith(
                    color: scoreColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${item.correctCount}/${item.totalQuestions}',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.textSecondary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => TestResultScreen(
                    result: item,
                    mistakeRepository: _mistakeRepo,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
