enum QuestionType {
  coding,
  mcq,
  conceptual,
}

class TestCase {
  final String? input;
  final String? output;
  final String? explanation;
  final List<dynamic> args;
  final dynamic expected;

  const TestCase({
    this.input,
    this.output,
    this.explanation,
    this.args = const [],
    this.expected,
  });

  Map<String, dynamic> toJson({bool includeHidden = true}) => {
        'input': input,
        'output': output,
        'explanation': explanation,
        'args': args,
        if (includeHidden) 'expected': expected,
      };

  factory TestCase.fromJson(Map<String, dynamic> json) => TestCase(
        input: json['input'] as String?,
        output: json['output'] as String?,
        explanation: json['explanation'] as String?,
        args: (json['args'] as List<dynamic>?) ?? const [],
        expected: json['expected'],
      );
}

class TestQuestion {
  final String id;
  final String title;
  final String description;
  final String category; // 'dsa', 'development', 'core_cs', 'sql', 'aptitude'
  final String topic;
  final String topicId;
  final String difficulty; // 'Easy', 'Medium', 'Hard'
  final QuestionType type;
  final int sectionIndex; // For DSA progression mapping
  final List<String> constraints;
  final String? starterCodeCpp;
  final String? functionName;
  final List<TestCase> sampleCases;
  final List<TestCase> hiddenCases;
  final List<String> options;
  final int? correctOptionIndex;
  final String? explanation;
  final String? referenceSolutionCpp;

  const TestQuestion({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.topic,
    required this.topicId,
    required this.difficulty,
    required this.type,
    this.sectionIndex = 0,
    this.constraints = const [],
    this.starterCodeCpp,
    this.functionName,
    this.sampleCases = const [],
    this.hiddenCases = const [],
    this.options = const [],
    this.correctOptionIndex,
    this.explanation,
    this.referenceSolutionCpp,
  });

  Map<String, dynamic> toJson({bool includeSensitiveAnswers = true}) => {
        'id': id,
        'title': title,
        'description': description,
        'category': category,
        'topic': topic,
        'topicId': topicId,
        'difficulty': difficulty,
        'type': type.name,
        'sectionIndex': sectionIndex,
        'constraints': constraints,
        'starterCodeCpp': starterCodeCpp,
        'functionName': functionName,
        'sampleCases': sampleCases.map((c) => c.toJson(includeHidden: true)).toList(),
        if (includeSensitiveAnswers)
          'hiddenCases': hiddenCases.map((c) => c.toJson(includeHidden: true)).toList(),
        'options': options,
        if (includeSensitiveAnswers) 'correctOptionIndex': correctOptionIndex,
        if (includeSensitiveAnswers) 'explanation': explanation,
        if (includeSensitiveAnswers) 'referenceSolutionCpp': referenceSolutionCpp,
      };

  factory TestQuestion.fromJson(Map<String, dynamic> json) => TestQuestion(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Untitled Problem',
        description: json['description'] as String? ?? '',
        category: json['category'] as String? ?? 'dsa',
        topic: json['topic'] as String? ?? 'General',
        topicId: json['topicId'] as String? ?? 'general',
        difficulty: json['difficulty'] as String? ?? 'Medium',
        type: QuestionType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => QuestionType.mcq,
        ),
        sectionIndex: json['sectionIndex'] as int? ?? 0,
        constraints: (json['constraints'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
        starterCodeCpp: json['starterCodeCpp'] as String?,
        functionName: json['functionName'] as String?,
        sampleCases: (json['sampleCases'] as List<dynamic>?)
                ?.map((c) => TestCase.fromJson(c as Map<String, dynamic>))
                .toList() ??
            const [],
        hiddenCases: (json['hiddenCases'] as List<dynamic>?)
                ?.map((c) => TestCase.fromJson(c as Map<String, dynamic>))
                .toList() ??
            const [],
        options: (json['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
        correctOptionIndex: json['correctOptionIndex'] as int?,
        explanation: json['explanation'] as String?,
        referenceSolutionCpp: json['referenceSolutionCpp'] as String?,
      );
}
