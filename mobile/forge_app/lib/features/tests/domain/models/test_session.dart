import 'test_execution_verdict.dart';
import 'test_question.dart';

enum TestType {
  dsa,
  development,
  mixed,
}

extension TestTypeExtension on TestType {
  String get label {
    switch (this) {
      case TestType.dsa:
        return 'DSA Assessment';
      case TestType.development:
        return 'Full-Stack Development Test';
      case TestType.mixed:
        return 'Comprehensive Placement Simulation';
    }
  }

  String get badge {
    switch (this) {
      case TestType.dsa:
        return 'DSA';
      case TestType.development:
        return 'DEV';
      case TestType.mixed:
        return 'MIXED';
    }
  }
}

class QuestionSessionState {
  final String questionId;
  final String? codeDraft;
  final int? selectedOption;
  final String? textAnswer;
  final bool isFlagged;
  final ExecutionVerdict? latestVerdict;

  const QuestionSessionState({
    required this.questionId,
    this.codeDraft,
    this.selectedOption,
    this.textAnswer,
    this.isFlagged = false,
    this.latestVerdict,
  });

  bool get isAnswered {
    if (selectedOption != null) return true;
    if (latestVerdict != null && latestVerdict!.isAccepted) return true;
    if (textAnswer != null && textAnswer!.trim().isNotEmpty) return true;
    if (codeDraft != null && codeDraft!.trim().isNotEmpty) return true;
    return false;
  }

  QuestionSessionState copyWith({
    String? codeDraft,
    int? selectedOption,
    String? textAnswer,
    bool? isFlagged,
    ExecutionVerdict? latestVerdict,
    bool clearOption = false,
  }) =>
      QuestionSessionState(
        questionId: questionId,
        codeDraft: codeDraft ?? this.codeDraft,
        selectedOption: clearOption ? null : (selectedOption ?? this.selectedOption),
        textAnswer: textAnswer ?? this.textAnswer,
        isFlagged: isFlagged ?? this.isFlagged,
        latestVerdict: latestVerdict ?? this.latestVerdict,
      );

  Map<String, dynamic> toJson() => {
        'questionId': questionId,
        'codeDraft': codeDraft,
        'selectedOption': selectedOption,
        'textAnswer': textAnswer,
        'isFlagged': isFlagged,
        'latestVerdict': latestVerdict?.toJson(),
      };

  factory QuestionSessionState.fromJson(Map<String, dynamic> json) => QuestionSessionState(
        questionId: json['questionId'] as String,
        codeDraft: json['codeDraft'] as String?,
        selectedOption: json['selectedOption'] as int?,
        textAnswer: json['textAnswer'] as String?,
        isFlagged: json['isFlagged'] as bool? ?? false,
        latestVerdict: json['latestVerdict'] != null
            ? ExecutionVerdict.fromJson(json['latestVerdict'] as Map<String, dynamic>)
            : null,
      );
}

class TestSession {
  final String id;
  final String attemptId;
  final String title;
  final TestType type;
  final int durationMinutes;
  final int startTimeMillis;
  final int targetEndTimeMillis;
  final List<TestQuestion> questions;
  final Map<String, QuestionSessionState> states;
  final int currentIndex;
  final bool isCompleted;

  const TestSession({
    required this.id,
    required this.attemptId,
    required this.title,
    required this.type,
    required this.durationMinutes,
    required this.startTimeMillis,
    required this.targetEndTimeMillis,
    required this.questions,
    required this.states,
    this.currentIndex = 0,
    this.isCompleted = false,
  });

  int get totalQuestions => questions.length;

  int get answeredCount =>
      questions.where((q) => states[q.id]?.isAnswered ?? false).length;

  int get flaggedCount =>
      questions.where((q) => states[q.id]?.isFlagged ?? false).length;

  int get remainingSeconds {
    final now = DateTime.now().millisecondsSinceEpoch;
    final diff = (targetEndTimeMillis - now) ~/ 1000;
    return diff > 0 ? diff : 0;
  }

  bool get isExpired => remainingSeconds <= 0;

  TestQuestion? get currentQuestion =>
      (currentIndex >= 0 && currentIndex < questions.length)
          ? questions[currentIndex]
          : null;

  TestSession copyWith({
    int? currentIndex,
    Map<String, QuestionSessionState>? states,
    bool? isCompleted,
  }) =>
      TestSession(
        id: id,
        attemptId: attemptId,
        title: title,
        type: type,
        durationMinutes: durationMinutes,
        startTimeMillis: startTimeMillis,
        targetEndTimeMillis: targetEndTimeMillis,
        questions: questions,
        states: states ?? this.states,
        currentIndex: currentIndex ?? this.currentIndex,
        isCompleted: isCompleted ?? this.isCompleted,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'attemptId': attemptId,
        'title': title,
        'type': type.name,
        'durationMinutes': durationMinutes,
        'startTimeMillis': startTimeMillis,
        'targetEndTimeMillis': targetEndTimeMillis,
        'questions': questions.map((q) => q.toJson(includeSensitiveAnswers: true)).toList(),
        'states': states.map((k, v) => MapEntry(k, v.toJson())),
        'currentIndex': currentIndex,
        'isCompleted': isCompleted,
      };

  factory TestSession.fromJson(Map<String, dynamic> json) => TestSession(
        id: json['id'] as String,
        attemptId: json['attemptId'] as String? ?? 'att_${DateTime.now().millisecondsSinceEpoch}',
        title: json['title'] as String? ?? 'FORGE Assessment',
        type: TestType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => TestType.dsa,
        ),
        durationMinutes: json['durationMinutes'] as int? ?? 30,
        startTimeMillis: json['startTimeMillis'] as int? ?? DateTime.now().millisecondsSinceEpoch,
        targetEndTimeMillis: json['targetEndTimeMillis'] as int? ??
            (DateTime.now().millisecondsSinceEpoch + 30 * 60 * 1000),
        questions: (json['questions'] as List<dynamic>?)
                ?.map((q) => TestQuestion.fromJson(q as Map<String, dynamic>))
                .toList() ??
            const [],
        states: (json['states'] as Map<String, dynamic>?)?.map(
              (k, v) => MapEntry(
                k,
                QuestionSessionState.fromJson(v as Map<String, dynamic>),
              ),
            ) ??
            {},
        currentIndex: json['currentIndex'] as int? ?? 0,
        isCompleted: json['isCompleted'] as bool? ?? false,
      );
}
