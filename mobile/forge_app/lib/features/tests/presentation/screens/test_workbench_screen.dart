import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../mistakes/data/mistake_repository.dart';
import '../../domain/models/test_attempt_result.dart';
import '../../domain/models/test_question.dart';
import '../../domain/models/test_session.dart';
import '../../services/code_execution_service.dart';
import '../../services/mock_code_execution_service.dart';
import '../../services/test_analysis_service.dart';
import '../../services/test_scoring_service.dart';
import '../widgets/code_editor_widget.dart';
import '../widgets/question_palette_sheet.dart';
import '../widgets/submit_confirmation_dialog.dart';
import '../widgets/test_case_runner_panel.dart';
import 'test_result_screen.dart';

/// Full-screen focused assessment workbench.
/// Directly implementing Stitch Screen `3fa798519d5c4a1d9306d19a010837b1` ("FORGE — Test Engine Workbench").
class TestWorkbenchScreen extends StatefulWidget {
  final TestSession initialSession;
  final CodeExecutionService? codeExecutionService;
  final MistakeRepository? mistakeRepository;
  final Future<void> Function(TestSession session)? onSaveSessionDraft;
  final Future<void> Function(dynamic result)? onFinalizeSubmission;

  const TestWorkbenchScreen({
    super.key,
    required this.initialSession,
    this.codeExecutionService,
    this.mistakeRepository,
    this.onSaveSessionDraft,
    this.onFinalizeSubmission,
  });

  @override
  State<TestWorkbenchScreen> createState() => _TestWorkbenchScreenState();
}

class _TestWorkbenchScreenState extends State<TestWorkbenchScreen> {
  late TestSession _session;
  late final CodeExecutionService _codeExecutor;
  Timer? _timer;
  int _remainingSeconds = 0;
  bool _isExecutingCode = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _session = widget.initialSession;
    _codeExecutor = widget.codeExecutionService ?? MockCodeExecutionService();
    _remainingSeconds = _session.remainingSeconds;
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final remaining = _session.remainingSeconds;
      setState(() => _remainingSeconds = remaining);

      if (remaining <= 0) {
        timer.cancel();
        _autoSubmit();
      }
    });
  }

  void _autoSubmit() {
    if (_isSubmitting) return;
    _submitAssessment(isAuto: true);
  }

  void _jumpToQuestion(int index) {
    if (index >= 0 && index < _session.questions.length) {
      setState(() {
        _session = _session.copyWith(currentIndex: index);
      });
      widget.onSaveSessionDraft?.call(_session);
    }
  }

  void _nextQuestion() {
    if (_session.currentIndex < _session.questions.length - 1) {
      _jumpToQuestion(_session.currentIndex + 1);
    }
  }

  void _prevQuestion() {
    if (_session.currentIndex > 0) {
      _jumpToQuestion(_session.currentIndex - 1);
    }
  }

  void _toggleFlag() {
    final q = _session.currentQuestion;
    if (q == null) return;
    final currentState = _session.states[q.id] ?? QuestionSessionState(questionId: q.id);
    final updatedState = currentState.copyWith(isFlagged: !currentState.isFlagged);
    final newStates = Map<String, QuestionSessionState>.from(_session.states)..[q.id] = updatedState;

    setState(() {
      _session = _session.copyWith(states: newStates);
    });
    widget.onSaveSessionDraft?.call(_session);
  }

  void _onCodeChanged(String newCode) {
    final q = _session.currentQuestion;
    if (q == null) return;
    final currentState = _session.states[q.id] ?? QuestionSessionState(questionId: q.id);
    final updatedState = currentState.copyWith(codeDraft: newCode);
    final newStates = Map<String, QuestionSessionState>.from(_session.states)..[q.id] = updatedState;

    setState(() {
      _session = _session.copyWith(states: newStates);
    });
  }

  void _onOptionSelected(int optionIndex) {
    final q = _session.currentQuestion;
    if (q == null) return;
    final currentState = _session.states[q.id] ?? QuestionSessionState(questionId: q.id);
    final isAlreadySelected = currentState.selectedOption == optionIndex;
    final updatedState = isAlreadySelected
        ? currentState.copyWith(clearOption: true)
        : currentState.copyWith(selectedOption: optionIndex);

    final newStates = Map<String, QuestionSessionState>.from(_session.states)..[q.id] = updatedState;

    setState(() {
      _session = _session.copyWith(states: newStates);
    });
    widget.onSaveSessionDraft?.call(_session);
  }

  Future<void> _runCode() async {
    final q = _session.currentQuestion;
    if (q == null || q.type != QuestionType.coding || _isExecutingCode) return;

    final currentState = _session.states[q.id];
    final code = currentState?.codeDraft ?? q.starterCodeCpp ?? '';

    setState(() => _isExecutingCode = true);

    try {
      final verdict = await _codeExecutor.runCode(
        question: q,
        sourceCode: code,
      );

      if (mounted) {
        final updatedState = (currentState ?? QuestionSessionState(questionId: q.id)).copyWith(
          latestVerdict: verdict,
        );
        final newStates = Map<String, QuestionSessionState>.from(_session.states)..[q.id] = updatedState;

        setState(() {
          _session = _session.copyWith(states: newStates);
          _isExecutingCode = false;
        });
        widget.onSaveSessionDraft?.call(_session);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isExecutingCode = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Execution failed: $e')),
        );
      }
    }
  }

  Future<void> _submitCodingQuestion() async {
    final q = _session.currentQuestion;
    if (q == null || q.type != QuestionType.coding || _isExecutingCode) return;

    final currentState = _session.states[q.id];
    final code = currentState?.codeDraft ?? q.starterCodeCpp ?? '';

    setState(() => _isExecutingCode = true);

    try {
      final verdict = await _codeExecutor.submitCode(
        question: q,
        sourceCode: code,
      );

      if (mounted) {
        final updatedState = (currentState ?? QuestionSessionState(questionId: q.id)).copyWith(
          latestVerdict: verdict,
        );
        final newStates = Map<String, QuestionSessionState>.from(_session.states)..[q.id] = updatedState;

        setState(() {
          _session = _session.copyWith(states: newStates);
          _isExecutingCode = false;
        });
        widget.onSaveSessionDraft?.call(_session);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isExecutingCode = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission evaluation failed: $e')),
        );
      }
    }
  }

  void _showSubmitConfirmation() {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => SubmitConfirmationDialog(
        session: _session,
        onConfirm: () => _submitAssessment(isAuto: false),
      ),
    );
  }

  Future<void> _submitAssessment({required bool isAuto}) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    _timer?.cancel();

    // 1. Evaluate score deterministically
    var result = TestScoringService.evaluateSession(_session);
    // 2. Generate insights
    final insights = TestAnalysisService.generateInsights(result);
    result = TestAttemptResult(
      id: result.id,
      attemptId: result.attemptId,
      testTitle: result.testTitle,
      testType: result.testType,
      date: result.date,
      completedAtIso: result.completedAtIso,
      timeTakenSeconds: result.timeTakenSeconds,
      totalQuestions: result.totalQuestions,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      skippedCount: result.skippedCount,
      scorePct: result.scorePct,
      accuracyPct: result.accuracyPct,
      topicScores: result.topicScores,
      difficultyScores: result.difficultyScores,
      questionResults: result.questionResults,
      strongTopics: result.strongTopics,
      weakTopics: result.weakTopics,
      analysisInsights: insights,
    );

    // 3. Callback persistence if provided
    if (widget.onFinalizeSubmission != null) {
      await widget.onFinalizeSubmission!(result);
    }

    if (!mounted) return;

    // 4. Navigate directly to TestResultScreen in place
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => TestResultScreen(
          result: result,
          mistakeRepository: widget.mistakeRepository,
          onBackToTests: () => Navigator.of(context).pop(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final q = _session.currentQuestion;
    final totalQ = _session.totalQuestions;
    final currentIdx = _session.currentIndex;
    final isFlagged = q != null && (_session.states[q.id]?.isFlagged ?? false);

    final minutes = _remainingSeconds ~/ 60;
    final seconds = _remainingSeconds % 60;
    final timeFormatted =
        '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    final timerAlertColor = _remainingSeconds < 60
        ? const Color(0xFFEF4444)
        : _remainingSeconds < 300
            ? const Color(0xFFF59E0B)
            : ForgeColors.accentAmber;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _showSubmitConfirmation();
        }
      },
      child: Scaffold(
        backgroundColor: ForgeColors.canvas,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Top Assessment Telemetry Header (Stitch Screen 3fa798519d5c4a1d9306d19a010837b1)
              _buildTopTelemetryBar(
                timeFormatted: timeFormatted,
                timerColor: timerAlertColor,
                currentIdx: currentIdx,
                totalQ: totalQ,
                isFlagged: isFlagged,
                questionType: q?.type ?? QuestionType.mcq,
              ),

              // 2. Hardware / Sandbox telemetry Sub-bar
              _buildSandboxSubBar(isFlagged),

              // 3. Main Question Scrollable Body
              Expanded(
                child: q == null
                    ? const Center(child: Text('No Question Available'))
                    : SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Problem Title & Tags
                            _buildProblemHeader(q),
                            const SizedBox(height: 12),

                            // Description & Constraints
                            _buildProblemDescription(q),
                            const SizedBox(height: 16),

                            // Coding View vs MCQ View
                            if (q.type == QuestionType.coding) ...[
                              CodeEditorWidget(
                                initialCode: _session.states[q.id]?.codeDraft ?? q.starterCodeCpp ?? '',
                                starterCode: q.starterCodeCpp,
                                onCodeChanged: _onCodeChanged,
                              ),
                              const SizedBox(height: 12),
                              TestCaseRunnerPanel(
                                sampleCases: q.sampleCases,
                                verdict: _session.states[q.id]?.latestVerdict,
                                isExecuting: _isExecutingCode,
                              ),
                            ] else if (q.type == QuestionType.mcq) ...[
                              _buildMcqOptions(q),
                            ],

                            const SizedBox(height: 16),
                          ],
                        ),
                      ),
              ),

              // 4. Sticky Bottom Execution Command Dock (Stitch Spec)
              _buildExecutionCommandDock(
                isCoding: q?.type == QuestionType.coding,
                hasPrev: currentIdx > 0,
                hasNext: currentIdx < totalQ - 1,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopTelemetryBar({
    required String timeFormatted,
    required Color timerColor,
    required int currentIdx,
    required int totalQ,
    required bool isFlagged,
    required QuestionType questionType,
  }) {
    final typeBadge = questionType == QuestionType.coding ? 'CODING' : 'MCQ';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _session.title.toUpperCase(),
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                InkWell(
                  onTap: () {
                    showModalBottomSheet<void>(
                      context: context,
                      backgroundColor: Colors.transparent,
                      builder: (_) => QuestionPaletteSheet(
                        session: _session,
                        onSelectQuestion: _jumpToQuestion,
                      ),
                    );
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Q${currentIdx + 1}/$totalQ [$typeBadge]',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.accentAmber,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_drop_down, size: 14, color: ForgeColors.accentAmber),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Timer Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: timerColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: timerColor, width: 1),
            ),
            child: Row(
              children: [
                Icon(Icons.timer_outlined, size: 14, color: timerColor),
                const SizedBox(width: 6),
                Text(
                  timeFormatted,
                  style: ForgeTypography.labelMd.copyWith(
                    color: timerColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSandboxSubBar(bool isFlagged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: const BoxDecoration(
        color: ForgeColors.canvas,
        border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
      ),
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  Text(
                    'ENV: LINUX-X86',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary, fontSize: 10),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    '•',
                    style: TextStyle(color: ForgeColors.borderSubtle, fontSize: 10),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'MEM: 256MB',
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.textSecondary, fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: _toggleFlag,
            child: Row(
              children: [
                Icon(
                  isFlagged ? Icons.bookmark : Icons.bookmark_border,
                  size: 13,
                  color: isFlagged ? const Color(0xFFF59E0B) : ForgeColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  isFlagged ? 'FLAGGED' : 'FLAG',
                  style: ForgeTypography.labelSm.copyWith(
                    color: isFlagged ? const Color(0xFFF59E0B) : ForgeColors.textSecondary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProblemHeader(TestQuestion q) {
    Color diffColor;
    if (q.difficulty.toLowerCase() == 'easy') {
      diffColor = const Color(0xFF10B981);
    } else if (q.difficulty.toLowerCase() == 'medium') {
      diffColor = const Color(0xFFF59E0B);
    } else {
      diffColor = const Color(0xFFEF4444);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: diffColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: diffColor.withValues(alpha: 0.4)),
              ),
              child: Text(
                q.difficulty.toUpperCase(),
                style: ForgeTypography.labelSm.copyWith(
                  color: diffColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceLevel2,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                q.topic.toUpperCase(),
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          q.title,
          style: ForgeTypography.headlineSm.copyWith(
            color: ForgeColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildProblemDescription(TestQuestion q) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            q.description,
            style: ForgeTypography.bodyMd.copyWith(
              color: ForgeColors.textPrimary,
              height: 1.45,
            ),
          ),
          if (q.constraints.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'CONSTRAINTS:',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            ...q.constraints.map((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Text(
                    '• $c',
                    style: ForgeTypography.bodySm.copyWith(
                      color: ForgeColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _buildMcqOptions(TestQuestion q) {
    final selectedIdx = _session.states[q.id]?.selectedOption;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: List.generate(q.options.length, (idx) {
        final isSelected = selectedIdx == idx;
        final letter = String.fromCharCode(65 + idx); // A, B, C, D

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => _onOptionSelected(idx),
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? ForgeColors.accentAmber.withValues(alpha: 0.12) : ForgeColors.surfaceLevel1,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isSelected ? ForgeColors.accentAmber : ForgeColors.borderSubtle,
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isSelected ? ForgeColors.accentAmber : ForgeColors.surfaceLevel2,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      letter,
                      style: ForgeTypography.labelSm.copyWith(
                        color: isSelected ? ForgeColors.canvas : ForgeColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      q.options[idx],
                      style: ForgeTypography.bodyMd.copyWith(
                        color: ForgeColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildExecutionCommandDock({
    required bool isCoding,
    required bool hasPrev,
    required bool hasNext,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: const BoxDecoration(
        color: ForgeColors.surfaceLevel1,
        border: Border(top: BorderSide(color: ForgeColors.borderSubtle)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // Previous Question Button
            IconButton(
              onPressed: hasPrev ? _prevQuestion : null,
              icon: const Icon(Icons.chevron_left),
              color: ForgeColors.textPrimary,
              disabledColor: ForgeColors.borderSubtle,
              tooltip: 'Previous Question',
            ),
            // Next Question Button
            IconButton(
              onPressed: hasNext ? _nextQuestion : null,
              icon: const Icon(Icons.chevron_right),
              color: ForgeColors.textPrimary,
              disabledColor: ForgeColors.borderSubtle,
              tooltip: 'Next Question',
            ),
            const SizedBox(width: 8),
            // Run Code Button (Coding Only)
            if (isCoding) ...[
              OutlinedButton(
                onPressed: _isExecutingCode ? null : _runCode,
                style: OutlinedButton.styleFrom(
                  foregroundColor: ForgeColors.textPrimary,
                  side: const BorderSide(color: ForgeColors.borderSubtle),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                child: Text('RUN SAMPLES', style: ForgeTypography.labelSm),
              ),
              const SizedBox(width: 6),
              OutlinedButton(
                onPressed: _isExecutingCode ? null : _submitCodingQuestion,
                style: OutlinedButton.styleFrom(
                  foregroundColor: ForgeColors.accentAmber,
                  side: BorderSide(color: ForgeColors.accentAmber.withValues(alpha: 0.5)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                child: Text('SUBMIT CODE', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.accentAmber)),
              ),
              const SizedBox(width: 8),
            ],
            // Primary Submit Button
            ElevatedButton(
              onPressed: _showSubmitConfirmation,
              style: ElevatedButton.styleFrom(
                backgroundColor: ForgeColors.accentAmber,
                foregroundColor: ForgeColors.canvas,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              ),
              child: Text(
                'SUBMIT TEST',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.canvas,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
