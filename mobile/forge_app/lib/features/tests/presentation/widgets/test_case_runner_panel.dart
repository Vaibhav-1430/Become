import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../domain/models/test_execution_verdict.dart';
import '../../domain/models/test_question.dart';

/// Test Case inspection and Execution Verdict panel.
/// Matches Stitch screen `3fa798519d5c4a1d9306d19a010837b1` telemetry specs.
class TestCaseRunnerPanel extends StatefulWidget {
  final List<TestCase> sampleCases;
  final ExecutionVerdict? verdict;
  final bool isExecuting;

  const TestCaseRunnerPanel({
    super.key,
    required this.sampleCases,
    this.verdict,
    this.isExecuting = false,
  });

  @override
  State<TestCaseRunnerPanel> createState() => _TestCaseRunnerPanelState();
}

class _TestCaseRunnerPanelState extends State<TestCaseRunnerPanel> {
  int _selectedCaseIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Verdict Banner if present
          if (widget.isExecuting) _buildExecutingBanner(),
          if (!widget.isExecuting && widget.verdict != null) _buildVerdictBanner(widget.verdict!),

          // Tab Bar for Sample Cases
          if (widget.sampleCases.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(widget.sampleCases.length, (idx) {
                    final isSelected = idx == _selectedCaseIndex;
                    final caseResult = widget.verdict?.caseResults.isNotEmpty == true &&
                            idx < widget.verdict!.caseResults.length
                        ? widget.verdict!.caseResults[idx]
                        : null;

                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: InkWell(
                        onTap: () => setState(() => _selectedCaseIndex = idx),
                        borderRadius: BorderRadius.circular(4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSelected ? ForgeColors.surfaceLevel3 : Colors.transparent,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: isSelected ? ForgeColors.accentAmber : Colors.transparent,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                'Case ${idx + 1}',
                                style: ForgeTypography.labelSm.copyWith(
                                  color: isSelected ? ForgeColors.textPrimary : ForgeColors.textSecondary,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                              if (caseResult != null) ...[
                                const SizedBox(width: 4),
                                Icon(
                                  caseResult.passed ? Icons.check_circle : Icons.cancel,
                                  size: 11,
                                  color: caseResult.passed ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),
            // Selected Case Details
            if (_selectedCaseIndex < widget.sampleCases.length)
              _buildCaseBody(widget.sampleCases[_selectedCaseIndex]),
          ],
        ],
      ),
    );
  }

  Widget _buildExecutingBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: ForgeColors.accentAmber.withValues(alpha: 0.1),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(ForgeColors.accentAmber),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            'EXECUTING IN LIVE SANDBOX...',
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.accentAmber,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerdictBanner(ExecutionVerdict verdict) {
    Color bannerColor;
    IconData icon;
    String label;

    switch (verdict.status) {
      case ExecutionStatus.passed:
        bannerColor = const Color(0xFF10B981);
        icon = Icons.check_circle;
        label = 'PASSED ${verdict.passedCases}/${verdict.totalCases} SAMPLES';
        break;
      case ExecutionStatus.wrongAnswer:
        bannerColor = const Color(0xFFEF4444);
        icon = Icons.cancel;
        label = 'WRONG ANSWER (${verdict.passedCases}/${verdict.totalCases} passed)';
        break;
      case ExecutionStatus.compileError:
        bannerColor = const Color(0xFFF59E0B);
        icon = Icons.error_outline;
        label = 'COMPILATION ERROR';
        break;
      case ExecutionStatus.runtimeError:
        bannerColor = const Color(0xFFEF4444);
        icon = Icons.warning_amber_rounded;
        label = 'RUNTIME ERROR';
        break;
      case ExecutionStatus.timeLimitExceeded:
        bannerColor = const Color(0xFFF59E0B);
        icon = Icons.timer_off;
        label = 'TIME LIMIT EXCEEDED';
        break;
      case ExecutionStatus.memoryLimitExceeded:
        bannerColor = const Color(0xFFF59E0B);
        icon = Icons.memory;
        label = 'MEMORY LIMIT EXCEEDED';
        break;
      case ExecutionStatus.networkError:
      case ExecutionStatus.systemError:
        bannerColor = const Color(0xFFEF4444);
        icon = Icons.cloud_off;
        label = verdict.status == ExecutionStatus.networkError ? 'NETWORK ERROR' : 'SYSTEM ERROR';
        break;
      case ExecutionStatus.idle:
      case ExecutionStatus.running:
        bannerColor = ForgeColors.accentAmber;
        icon = Icons.info_outline;
        label = 'READY';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bannerColor.withValues(alpha: 0.12),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: bannerColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: ForgeTypography.labelSm.copyWith(
                    color: bannerColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (verdict.timeMs > 0)
                Text(
                  '${verdict.timeMs}ms',
                  style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary),
                ),
            ],
          ),
          if (verdict.compilerMessage != null && verdict.compilerMessage!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: ForgeColors.canvas,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                verdict.compilerMessage!,
                style: ForgeTypography.labelSm.copyWith(
                  color: const Color(0xFFEF4444),
                  fontSize: 11,
                ),
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCaseBody(TestCase tc) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'INPUT:',
            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary),
          ),
          const SizedBox(height: 2),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: ForgeColors.canvas,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              tc.input ?? tc.args.toString(),
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textPrimary),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'EXPECTED OUTPUT:',
            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary),
          ),
          const SizedBox(height: 2),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: ForgeColors.canvas,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              tc.output ?? tc.expected.toString(),
              style: ForgeTypography.labelSm.copyWith(
                color: const Color(0xFF10B981),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
