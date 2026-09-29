import '../domain/models/test_attempt_result.dart';
import '../domain/models/test_question.dart';
import '../domain/models/test_session.dart';

/// Deterministic scoring service for FORGE Test Engine assessments.
class TestScoringService {
  /// Computes a complete, deterministic [TestAttemptResult] from an active or finished [TestSession].
  static TestAttemptResult evaluateSession(TestSession session) {
    int correctCount = 0;
    int wrongCount = 0;
    int skippedCount = 0;

    final topicMap = <String, _TopicAccumulator>{};
    final diffMap = <String, _DiffAccumulator>{};
    final questionResults = <QuestionResult>[];

    for (int i = 0; i < session.questions.length; i++) {
      final q = session.questions[i];
      final state = session.states[q.id];

      // Track accumulators
      final topicAcc = topicMap.putIfAbsent(
        q.topic,
        () => _TopicAccumulator(topic: q.topic, subject: q.category.toUpperCase()),
      );
      topicAcc.total++;

      final diffAcc = diffMap.putIfAbsent(
        q.difficulty,
        () => _DiffAccumulator(difficulty: q.difficulty),
      );
      diffAcc.total++;

      bool isCorrect = false;
      bool isSkipped = false;
      String userAnswerStr = '';
      String correctAnswerStr = '';

      if (q.type == QuestionType.mcq) {
        final selected = state?.selectedOption;
        if (selected == null) {
          isSkipped = true;
          userAnswerStr = 'Not Answered';
        } else {
          userAnswerStr = selected < q.options.length ? q.options[selected] : 'Option #$selected';
          isCorrect = selected == q.correctOptionIndex;
        }
        correctAnswerStr = (q.correctOptionIndex != null && q.correctOptionIndex! < q.options.length)
            ? q.options[q.correctOptionIndex!]
            : 'Unknown';
      } else if (q.type == QuestionType.coding) {
        final verdict = state?.latestVerdict;
        final code = state?.codeDraft ?? '';
        final isStarter = q.starterCodeCpp != null && code.trim() == q.starterCodeCpp!.trim();

        if (code.trim().isEmpty || isStarter) {
          isSkipped = true;
          userAnswerStr = 'No Code Submitted';
        } else {
          userAnswerStr = 'Code Submitted';
          isCorrect = verdict != null && verdict.isAccepted;
        }
        correctAnswerStr = q.referenceSolutionCpp ?? 'Refer to model solution';
      } else if (q.type == QuestionType.conceptual) {
        final txt = state?.textAnswer?.trim() ?? '';
        if (txt.isEmpty) {
          isSkipped = true;
          userAnswerStr = 'Not Answered';
        } else {
          userAnswerStr = txt;
          // Conceptual answer is credited if substantial (> 20 characters)
          isCorrect = txt.length >= 20;
        }
        correctAnswerStr = q.explanation ?? 'Conceptual insight';
      }

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
        topicAcc.correct++;
        diffAcc.correct++;
      } else {
        wrongCount++;
      }

      questionResults.add(QuestionResult(
        index: i + 1,
        questionId: q.id,
        title: q.title,
        topic: q.topic,
        subject: q.category.toUpperCase(),
        difficulty: q.difficulty,
        type: q.type,
        isCorrect: isCorrect,
        isSkipped: isSkipped,
        userAnswer: userAnswerStr,
        correctAnswer: correctAnswerStr,
        explanation: q.explanation,
        userCode: state?.codeDraft,
        verdict: state?.latestVerdict,
      ));
    }

    final totalAttempted = correctCount + wrongCount;
    final totalQ = session.questions.length;
    final scorePct = totalQ > 0 ? (correctCount / totalQ) * 100 : 0.0;
    final accuracyPct = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0.0;

    final elapsedMs = DateTime.now().millisecondsSinceEpoch - session.startTimeMillis;
    final timeTakenSeconds = (elapsedMs ~/ 1000).clamp(0, session.durationMinutes * 60);

    final topicScores = topicMap.values.map((a) => a.toTopicScore()).toList();
    final difficultyScores = diffMap.values.map((a) => a.toDifficultyScore()).toList();

    final strongTopics = topicScores.where((t) => t.accuracyPct >= 70.0).map((t) => t.topic).toList();
    final weakTopics = topicScores.where((t) => t.accuracyPct < 60.0).map((t) => t.topic).toList();

    return TestAttemptResult(
      id: session.id,
      attemptId: session.attemptId,
      testTitle: session.title,
      testType: session.type,
      date: DateTime.now().toIso8601String().substring(0, 10),
      completedAtIso: DateTime.now().toIso8601String(),
      timeTakenSeconds: timeTakenSeconds,
      totalQuestions: totalQ,
      correctCount: correctCount,
      wrongCount: wrongCount,
      skippedCount: skippedCount,
      scorePct: scorePct,
      accuracyPct: accuracyPct,
      topicScores: topicScores,
      difficultyScores: difficultyScores,
      questionResults: questionResults,
      strongTopics: strongTopics,
      weakTopics: weakTopics,
      analysisInsights: const [], // Populated by TestAnalysisService
    );
  }
}

class _TopicAccumulator {
  final String topic;
  final String subject;
  int total = 0;
  int correct = 0;

  _TopicAccumulator({required this.topic, required this.subject});

  TopicScore toTopicScore() => TopicScore(
        topic: topic,
        subject: subject,
        total: total,
        correct: correct,
      );
}

class _DiffAccumulator {
  final String difficulty;
  int total = 0;
  int correct = 0;

  _DiffAccumulator({required this.difficulty});

  DifficultyScore toDifficultyScore() => DifficultyScore(
        difficulty: difficulty,
        total: total,
        correct: correct,
      );
}
