import 'test_execution_verdict.dart';
import 'test_question.dart';
import 'test_session.dart';

class TopicScore {
  final String topic;
  final String subject;
  final int total;
  final int correct;

  const TopicScore({
    required this.topic,
    required this.subject,
    required this.total,
    required this.correct,
  });

  double get accuracyPct => total > 0 ? (correct / total) * 100 : 0.0;

  Map<String, dynamic> toJson() => {
        'topic': topic,
        'subject': subject,
        'total': total,
        'correct': correct,
      };

  factory TopicScore.fromJson(Map<String, dynamic> json) => TopicScore(
        topic: json['topic'] as String? ?? 'General',
        subject: json['subject'] as String? ?? 'DSA',
        total: (json['total'] as int?) ?? 0,
        correct: (json['correct'] as int?) ?? 0,
      );
}

class DifficultyScore {
  final String difficulty;
  final int total;
  final int correct;

  const DifficultyScore({
    required this.difficulty,
    required this.total,
    required this.correct,
  });

  double get accuracyPct => total > 0 ? (correct / total) * 100 : 0.0;

  Map<String, dynamic> toJson() => {
        'difficulty': difficulty,
        'total': total,
        'correct': correct,
      };

  factory DifficultyScore.fromJson(Map<String, dynamic> json) => DifficultyScore(
        difficulty: json['difficulty'] as String? ?? 'Medium',
        total: (json['total'] as int?) ?? 0,
        correct: (json['correct'] as int?) ?? 0,
      );
}

class QuestionResult {
  final int index; // 1-indexed
  final String questionId;
  final String title;
  final String topic;
  final String subject;
  final String difficulty;
  final QuestionType type;
  final bool isCorrect;
  final bool isSkipped;
  final String userAnswer;
  final String correctAnswer;
  final String? explanation;
  final String? userCode;
  final ExecutionVerdict? verdict;

  const QuestionResult({
    required this.index,
    required this.questionId,
    required this.title,
    required this.topic,
    required this.subject,
    required this.difficulty,
    required this.type,
    required this.isCorrect,
    required this.isSkipped,
    required this.userAnswer,
    required this.correctAnswer,
    this.explanation,
    this.userCode,
    this.verdict,
  });

  Map<String, dynamic> toJson() => {
        'index': index,
        'questionId': questionId,
        'title': title,
        'topic': topic,
        'subject': subject,
        'difficulty': difficulty,
        'type': type.name,
        'isCorrect': isCorrect,
        'isSkipped': isSkipped,
        'userAnswer': userAnswer,
        'correctAnswer': correctAnswer,
        'explanation': explanation,
        'userCode': userCode,
        'verdict': verdict?.toJson(),
      };

  factory QuestionResult.fromJson(Map<String, dynamic> json) => QuestionResult(
        index: (json['index'] as int?) ?? 1,
        questionId: json['questionId'] as String? ?? '',
        title: json['title'] as String? ?? 'Problem',
        topic: json['topic'] as String? ?? 'General',
        subject: json['subject'] as String? ?? 'DSA',
        difficulty: json['difficulty'] as String? ?? 'Medium',
        type: QuestionType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => QuestionType.mcq,
        ),
        isCorrect: json['isCorrect'] as bool? ?? false,
        isSkipped: json['isSkipped'] as bool? ?? false,
        userAnswer: json['userAnswer'] as String? ?? '',
        correctAnswer: json['correctAnswer'] as String? ?? '',
        explanation: json['explanation'] as String?,
        userCode: json['userCode'] as String?,
        verdict: json['verdict'] != null
            ? ExecutionVerdict.fromJson(json['verdict'] as Map<String, dynamic>)
            : null,
      );
}

class TestAttemptResult {
  final String id;
  final String attemptId;
  final String testTitle;
  final TestType testType;
  final String date;
  final String completedAtIso;
  final int timeTakenSeconds;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int skippedCount;
  final double scorePct;
  final double accuracyPct;
  final List<TopicScore> topicScores;
  final List<DifficultyScore> difficultyScores;
  final List<QuestionResult> questionResults;
  final List<String> strongTopics;
  final List<String> weakTopics;
  final List<String> analysisInsights;

  const TestAttemptResult({
    required this.id,
    required this.attemptId,
    required this.testTitle,
    required this.testType,
    required this.date,
    required this.completedAtIso,
    required this.timeTakenSeconds,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.skippedCount,
    required this.scorePct,
    required this.accuracyPct,
    required this.topicScores,
    required this.difficultyScores,
    required this.questionResults,
    required this.strongTopics,
    required this.weakTopics,
    required this.analysisInsights,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'attemptId': attemptId,
        'testTitle': testTitle,
        'testType': testType.name,
        'date': date,
        'completedAtIso': completedAtIso,
        'timeTakenSeconds': timeTakenSeconds,
        'totalQuestions': totalQuestions,
        'correctCount': correctCount,
        'wrongCount': wrongCount,
        'skippedCount': skippedCount,
        'score': scorePct,
        'accuracy': accuracyPct,
        'topicScores': topicScores.map((t) => t.toJson()).toList(),
        'difficultyScores': difficultyScores.map((d) => d.toJson()).toList(),
        'questionResults': questionResults.map((q) => q.toJson()).toList(),
        'strongTopics': strongTopics,
        'weakTopics': weakTopics,
        'analysisInsights': analysisInsights,
      };

  factory TestAttemptResult.fromJson(Map<String, dynamic> json) => TestAttemptResult(
        id: json['id'] as String? ?? 'test_${DateTime.now().millisecondsSinceEpoch}',
        attemptId: json['attemptId'] as String? ?? 'att_${DateTime.now().millisecondsSinceEpoch}',
        testTitle: json['testTitle'] as String? ?? 'FORGE Assessment',
        testType: TestType.values.firstWhere(
          (t) => t.name == json['testType'],
          orElse: () => TestType.dsa,
        ),
        date: json['date'] as String? ?? DateTime.now().toIso8601String().substring(0, 10),
        completedAtIso: json['completedAtIso'] as String? ?? DateTime.now().toIso8601String(),
        timeTakenSeconds: (json['timeTakenSeconds'] as num?)?.toInt() ?? 0,
        totalQuestions: (json['totalQuestions'] as int?) ?? 0,
        correctCount: (json['correctCount'] as int?) ?? 0,
        wrongCount: (json['wrongCount'] as int?) ?? 0,
        skippedCount: (json['skippedCount'] as int?) ?? 0,
        scorePct: (json['score'] as num?)?.toDouble() ?? 0.0,
        accuracyPct: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
        topicScores: (json['topicScores'] as List<dynamic>?)
                ?.map((t) => TopicScore.fromJson(t as Map<String, dynamic>))
                .toList() ??
            const [],
        difficultyScores: (json['difficultyScores'] as List<dynamic>?)
                ?.map((d) => DifficultyScore.fromJson(d as Map<String, dynamic>))
                .toList() ??
            const [],
        questionResults: (json['questionResults'] as List<dynamic>?)
                ?.map((q) => QuestionResult.fromJson(q as Map<String, dynamic>))
                .toList() ??
            const [],
        strongTopics: (json['strongTopics'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
        weakTopics: (json['weakTopics'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
        analysisInsights: (json['analysisInsights'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      );
}
