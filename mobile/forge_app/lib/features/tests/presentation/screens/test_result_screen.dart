import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../mistakes/data/mistake_repository.dart';
import '../../../mistakes/domain/mistake.dart';
import '../../domain/models/test_attempt_result.dart';

/// Comprehensive assessment result & performance analysis screen.
/// Includes Mistake Bank integration for failed or skipped questions.
class TestResultScreen extends StatefulWidget {
  final TestAttemptResult result;
  final MistakeRepository? mistakeRepository;
  final VoidCallback? onRetake;
  final VoidCallback? onBackToTests;

  const TestResultScreen({
    super.key,
    required this.result,
    this.mistakeRepository,
    this.onRetake,
    this.onBackToTests,
  });

  @override
  State<TestResultScreen> createState() => _TestResultScreenState();
}

class _TestResultScreenState extends State<TestResultScreen> {
  final Set<String> _addedMistakeQuestionIds = <String>{};
  final Map<String, bool> _addingMistakeMap = {};

  Future<void> _addToMistakeBank(QuestionResult qr) async {
    final repo = widget.mistakeRepository;
    if (repo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mistake repository unavailable')),
      );
      return;
    }

    setState(() => _addingMistakeMap[qr.questionId] = true);

    try {
      final mistake = Mistake(
        id: 'mistake_${DateTime.now().millisecondsSinceEpoch}',
        userId: 'current_user',
        question: qr.title,
        subject: qr.subject,
        topic: qr.topic,
        source: 'FORGE Assessment (${widget.result.testTitle})',
        date: DateTime.now().toIso8601String().substring(0, 10),
        userAnswer: qr.userAnswer,
        correctAnswer: qr.correctAnswer,
        explanation: qr.explanation ?? 'Review core algorithm & edge cases.',
        mistakeType: qr.isSkipped ? 'Time management / Unattempted' : 'Algorithmic / Implementation error',
        repeatCount: 1,
        resolved: false,
      );

      await repo.createMistake(mistake);

      if (mounted) {
        setState(() {
          _addingMistakeMap[qr.questionId] = false;
          _addedMistakeQuestionIds.add(qr.questionId);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text('Added "${qr.title}" to Mistake Bank!'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _addingMistakeMap[qr.questionId] = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add to Mistake Bank: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final res = widget.result;
    final minutes = res.timeTakenSeconds ~/ 60;
    final seconds = res.timeTakenSeconds % 60;
    final timeStr = '${minutes}m ${seconds}s';

    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: ForgeColors.textPrimary),
          onPressed: widget.onBackToTests ?? () => Navigator.of(context).pop(),
        ),
        title: Text(
          'ASSESSMENT RESULT',
          style: ForgeTypography.labelMd.copyWith(
            color: ForgeColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Hero Score Banner
              _buildHeroScoreCard(res, timeStr),
              const SizedBox(height: 16),

              // 2. Deterministic Insights
              if (res.analysisInsights.isNotEmpty) ...[
                _buildSectionHeader('DIAGNOSTIC ANALYSIS', Icons.analytics_outlined),
                const SizedBox(height: 8),
                _buildInsightsCard(res.analysisInsights),
                const SizedBox(height: 16),
              ],

              // 3. Topic Breakdown
              if (res.topicScores.isNotEmpty) ...[
                _buildSectionHeader('TOPIC PERFORMANCE', Icons.category_outlined),
                const SizedBox(height: 8),
                _buildTopicBreakdown(res.topicScores),
                const SizedBox(height: 16),
              ],

              // 4. Difficulty Breakdown
              if (res.difficultyScores.isNotEmpty) ...[
                _buildSectionHeader('DIFFICULTY PERFORMANCE', Icons.speed_outlined),
                const SizedBox(height: 8),
                _buildDifficultyBreakdown(res.difficultyScores),
                const SizedBox(height: 16),
              ],

              // 5. Question-by-Question Review
              _buildSectionHeader('QUESTION REVIEW (${res.questionResults.length})', Icons.list_alt_outlined),
              const SizedBox(height: 8),
              ...res.questionResults.map(_buildQuestionResultCard),

              const SizedBox(height: 24),
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: widget.onBackToTests ?? () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: ForgeColors.textPrimary,
                        side: const BorderSide(color: ForgeColors.borderSubtle),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text('EXIT TO TESTS', style: ForgeTypography.labelSm),
                    ),
                  ),
                  if (widget.onRetake != null) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: widget.onRetake,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ForgeColors.accentAmber,
                          foregroundColor: ForgeColors.canvas,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Text(
                          'RETAKE TEST',
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.canvas,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroScoreCard(TestAttemptResult res, String timeStr) {
    final scoreColor = res.scorePct >= 70
        ? const Color(0xFF10B981)
        : res.scorePct >= 50
            ? const Color(0xFFF59E0B)
            : const Color(0xFFEF4444);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        children: [
          Text(
            res.testTitle.toUpperCase(),
            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            '${res.scorePct.toStringAsFixed(0)}%',
            style: ForgeTypography.monoMetric.copyWith(
              color: scoreColor,
              fontSize: 48,
              height: 1.1,
            ),
          ),
          Text(
            '${res.correctCount} of ${res.totalQuestions} Solved Correctly',
            style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.textPrimary),
          ),
          const SizedBox(height: 14),
          const Divider(color: ForgeColors.borderSubtle, height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildMetricItem('ACCURACY', '${res.accuracyPct.toStringAsFixed(1)}%', ForgeColors.textPrimary),
              _buildMetricItem('TIME TAKEN', timeStr, ForgeColors.textPrimary),
              _buildMetricItem('SKIPPED', '${res.skippedCount}', res.skippedCount > 0 ? const Color(0xFFEF4444) : ForgeColors.textSecondary),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary, fontSize: 10)),
        const SizedBox(height: 2),
        Text(value, style: ForgeTypography.labelMd.copyWith(color: color, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: ForgeColors.accentAmber),
        const SizedBox(width: 8),
        Text(
          title,
          style: ForgeTypography.labelMd.copyWith(
            color: ForgeColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildInsightsCard(List<String> insights) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: insights.map((insight) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('• ', style: TextStyle(color: ForgeColors.accentAmber, fontSize: 14)),
                Expanded(
                  child: Text(
                    insight,
                    style: ForgeTypography.bodySm.copyWith(
                      color: ForgeColors.textPrimary,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTopicBreakdown(List<TopicScore> topics) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        children: topics.map((t) {
          final pct = t.accuracyPct;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(t.topic, style: ForgeTypography.bodySm.copyWith(color: ForgeColors.textPrimary, fontWeight: FontWeight.w600)),
                    Text('${t.correct}/${t.total} (${pct.toStringAsFixed(0)}%)', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary)),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: t.total > 0 ? t.correct / t.total : 0,
                    minHeight: 4,
                    backgroundColor: ForgeColors.surfaceLevel3,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      pct >= 70 ? const Color(0xFF10B981) : pct >= 50 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444),
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDifficultyBreakdown(List<DifficultyScore> diffs) {
    return Row(
      children: diffs.map((d) {
        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: ForgeColors.surfaceLevel1,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: ForgeColors.borderSubtle),
            ),
            child: Column(
              children: [
                Text(d.difficulty.toUpperCase(), style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary, fontSize: 10)),
                const SizedBox(height: 4),
                Text('${d.correct}/${d.total}', style: ForgeTypography.labelMd.copyWith(color: ForgeColors.textPrimary, fontWeight: FontWeight.bold)),
                Text('${d.accuracyPct.toStringAsFixed(0)}%', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.accentAmber, fontSize: 10)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuestionResultCard(QuestionResult qr) {
    final isAdded = _addedMistakeQuestionIds.contains(qr.questionId);
    final isAdding = _addingMistakeMap[qr.questionId] ?? false;

    Color badgeColor;
    String badgeText;
    if (qr.isCorrect) {
      badgeColor = const Color(0xFF10B981);
      badgeText = 'CORRECT';
    } else if (qr.isSkipped) {
      badgeColor = ForgeColors.textSecondary;
      badgeText = 'SKIPPED';
    } else {
      badgeColor = const Color(0xFFEF4444);
      badgeText = 'WRONG';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
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
              Text(
                'Q${qr.index}.',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.accentAmber,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  qr.title,
                  style: ForgeTypography.bodySm.copyWith(
                    color: ForgeColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badgeText,
                  style: ForgeTypography.labelSm.copyWith(
                    color: badgeColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Your Answer: ${qr.userAnswer}',
            style: ForgeTypography.bodySm.copyWith(
              color: qr.isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              fontSize: 12,
            ),
          ),
          if (!qr.isCorrect) ...[
            const SizedBox(height: 2),
            Text(
              'Expected: ${qr.correctAnswer}',
              style: ForgeTypography.bodySm.copyWith(
                color: ForgeColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
          if (qr.explanation != null && qr.explanation!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: ForgeColors.canvas,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                qr.explanation!,
                style: ForgeTypography.bodySm.copyWith(
                  color: ForgeColors.textSecondary,
                  fontSize: 11,
                ),
              ),
            ),
          ],
          // Add to Mistake Bank option for wrong/skipped questions
          if (!qr.isCorrect && widget.mistakeRepository != null) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: isAdded || isAdding ? null : () => _addToMistakeBank(qr),
                icon: isAdding
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        isAdded ? Icons.check : Icons.bookmark_add_outlined,
                        size: 13,
                        color: isAdded ? const Color(0xFF10B981) : ForgeColors.accentAmber,
                      ),
                label: Text(
                  isAdded ? 'ADDED TO MISTAKES' : 'ADD TO MISTAKE BANK',
                  style: ForgeTypography.labelSm.copyWith(
                    color: isAdded ? const Color(0xFF10B981) : ForgeColors.accentAmber,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: isAdded ? const Color(0xFF10B981) : ForgeColors.accentAmber.withValues(alpha: 0.5),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
