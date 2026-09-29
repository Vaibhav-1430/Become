import '../../dsa/data/dsa_repository.dart';
import '../../development/data/dev_repository.dart';
import '../data/question_bank_data.dart';
import '../domain/models/test_question.dart';
import '../domain/models/test_session.dart';

class SyllabusBoundary {
  final int maxDsaSection; // -1 if no DSA studied yet
  final Set<String> eligibleDsaTopicIds;
  final Set<String> eligibleDevTopicIds;
  final bool hasDsaEligibility;
  final bool hasDevEligibility;

  const SyllabusBoundary({
    required this.maxDsaSection,
    required this.eligibleDsaTopicIds,
    required this.eligibleDevTopicIds,
    required this.hasDsaEligibility,
    required this.hasDevEligibility,
  });

  bool isEligibleFor(TestType type) {
    switch (type) {
      case TestType.dsa:
        return hasDsaEligibility;
      case TestType.development:
        return hasDevEligibility;
      case TestType.mixed:
        return hasDsaEligibility || hasDevEligibility;
    }
  }

  String get dsaBoundaryLabel {
    if (maxDsaSection < 0) return 'No DSA topics completed';
    if (maxDsaSection == 0) return 'Section 0: Basics (Maths, Recursion)';
    if (maxDsaSection == 1) return 'Section 1: Sorting Techniques';
    if (maxDsaSection == 2) return 'Section 2: Arrays (Easy & Medium)';
    if (maxDsaSection == 3) return 'Section 3: Binary Search';
    return 'Section $maxDsaSection';
  }
}

class SyllabusBoundaryService {
  /// Detect the authentic studied boundary from real user progress.
  /// Strictly adheres to the rule: Never include topics the user has not covered.
  static Future<SyllabusBoundary> detectBoundary({
    required DsaRepository dsaRepository,
    required DevRepository devRepository,
  }) async {
    // 1. Inspect DSA progress
    final solvedProblemIds = await dsaRepository.getSolvedProblemIds();
    final curriculum = await dsaRepository.getCurriculum();

    int maxDsaSection = -1;
    final eligibleDsaTopics = <String>{};

    for (final section in curriculum) {
      for (final topic in section.topics) {
        final anySolvedInTopic = topic.problems.any((p) => solvedProblemIds.contains(p.id));
        if (anySolvedInTopic) {
          eligibleDsaTopics.add(topic.name);
          if (section.sectionIndex > maxDsaSection) {
            maxDsaSection = section.sectionIndex;
          }
        }
      }
    }

    // 2. Inspect Dev progress
    final completedDevTopicIds = await devRepository.getCompletedTopicIds();
    final eligibleDevTopics = Set<String>.from(completedDevTopicIds);

    final hasDsa = maxDsaSection >= 0 && eligibleDsaTopics.isNotEmpty;
    final hasDev = eligibleDevTopics.isNotEmpty;

    return SyllabusBoundary(
      maxDsaSection: maxDsaSection,
      eligibleDsaTopicIds: eligibleDsaTopics,
      eligibleDevTopicIds: eligibleDevTopics,
      hasDsaEligibility: hasDsa,
      hasDevEligibility: hasDev,
    );
  }

  /// Filters question bank strictly by studied topics.
  static List<TestQuestion> getEligibleQuestions({
    required SyllabusBoundary boundary,
    required TestType type,
    List<TestQuestion>? customBank,
  }) {
    final bank = customBank ?? kForgeQuestionBank;

    switch (type) {
      case TestType.dsa:
        if (!boundary.hasDsaEligibility) return const [];
        return bank.where((q) {
          if (q.category != 'dsa') return false;
          // Must not exceed max section reached
          if (q.sectionIndex > boundary.maxDsaSection) return false;
          return true;
        }).toList();

      case TestType.development:
        if (!boundary.hasDevEligibility) return const [];
        return bank.where((q) {
          if (q.category != 'development') return false;
          // Topic must be in eligible covered topics
          return boundary.eligibleDevTopicIds.contains(q.topicId);
        }).toList();

      case TestType.mixed:
        final dsaQuestions = boundary.hasDsaEligibility
            ? bank.where((q) {
                if (q.category != 'dsa') return false;
                return q.sectionIndex <= boundary.maxDsaSection;
              }).toList()
            : <TestQuestion>[];

        final devQuestions = boundary.hasDevEligibility
            ? bank.where((q) {
                if (q.category != 'development') return false;
                return boundary.eligibleDevTopicIds.contains(q.topicId);
              }).toList()
            : <TestQuestion>[];

        // Foundational Core CS questions are permissible in Mixed tests if either DSA or Dev is active
        final coreQuestions = (boundary.hasDsaEligibility || boundary.hasDevEligibility)
            ? bank.where((q) => q.category == 'core_cs').toList()
            : <TestQuestion>[];

        return [...dsaQuestions, ...devQuestions, ...coreQuestions];
    }
  }

  /// Generates a test session of questions from the eligible pool.
  static TestSession generateSession({
    required SyllabusBoundary boundary,
    required TestType type,
    int? requestedQuestionCount,
    int durationMinutes = 30,
    List<TestQuestion>? customBank,
  }) {
    final eligible = getEligibleQuestions(
      boundary: boundary,
      type: type,
      customBank: customBank,
    );

    if (eligible.isEmpty) {
      throw StateError('No test available yet. Complete more topics to unlock your first test.');
    }

    final pool = List<TestQuestion>.from(eligible);
    // Shuffle deterministically or randomly
    pool.shuffle();

    final targetCount = requestedQuestionCount != null
        ? requestedQuestionCount.clamp(1, pool.length)
        : (type == TestType.dsa ? 5 : type == TestType.development ? 8 : 10).clamp(1, pool.length);

    final selectedQuestions = pool.take(targetCount).toList();

    final now = DateTime.now().millisecondsSinceEpoch;
    final targetEnd = now + (durationMinutes * 60 * 1000);

    final states = <String, QuestionSessionState>{};
    for (final q in selectedQuestions) {
      states[q.id] = QuestionSessionState(
        questionId: q.id,
        codeDraft: q.type == QuestionType.coding ? q.starterCodeCpp : null,
      );
    }

    return TestSession(
      id: 'test_${DateTime.now().toIso8601String().substring(0, 10)}_${DateTime.now().millisecondsSinceEpoch}',
      attemptId: 'att_${DateTime.now().millisecondsSinceEpoch}',
      title: '${type.label} (${selectedQuestions.length} Questions)',
      type: type,
      durationMinutes: durationMinutes,
      startTimeMillis: now,
      targetEndTimeMillis: targetEnd,
      questions: selectedQuestions,
      states: states,
      currentIndex: 0,
      isCompleted: false,
    );
  }
}
