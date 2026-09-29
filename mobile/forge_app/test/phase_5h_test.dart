import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/features/dsa/data/mock_dsa_repository.dart';
import 'package:forge_app/features/dsa/domain/dsa_problem.dart';
import 'package:forge_app/features/dsa/domain/dsa_section.dart';
import 'package:forge_app/features/dsa/domain/dsa_topic.dart';
import 'package:forge_app/features/development/data/mock_dev_repository.dart';
import 'package:forge_app/features/development/domain/dev_topic.dart';
import 'package:forge_app/features/mistakes/data/mock_mistake_repository.dart';
import 'package:forge_app/features/tests/data/mock_test_repository.dart';
import 'package:forge_app/features/tests/domain/models/test_attempt_result.dart';
import 'package:forge_app/features/tests/domain/models/test_execution_verdict.dart';
import 'package:forge_app/features/tests/domain/models/test_question.dart';
import 'package:forge_app/features/tests/domain/models/test_session.dart';
import 'package:forge_app/features/tests/presentation/screens/test_hub_screen.dart';
import 'package:forge_app/features/tests/presentation/screens/test_result_screen.dart';
import 'package:forge_app/features/tests/presentation/screens/test_workbench_screen.dart';
import 'package:forge_app/features/tests/services/mock_code_execution_service.dart';
import 'package:forge_app/features/tests/services/syllabus_boundary_service.dart';
import 'package:forge_app/features/tests/services/test_analysis_service.dart';
import 'package:forge_app/features/tests/services/test_scoring_service.dart';

// Helper mock DSA repository that starts with ZERO solved problems
class EmptyDsaRepository extends MockDsaRepository {
  final Set<String> _solved = {};

  @override
  Future<Set<String>> getSolvedProblemIds() async => Set.from(_solved);

  @override
  Future<bool> toggleProblemSolved(String problemId, bool isSolved) async {
    if (isSolved) {
      _solved.add(problemId);
    } else {
      _solved.remove(problemId);
    }
    return true;
  }

  @override
  Future<List<DsaSection>> getCurriculum() async {
    return [
      DsaSection(
        sectionIndex: 0,
        name: 'Learn the basics',
        topics: [
          DsaTopic(
            name: 'Basic Maths',
            sectionIndex: 0,
            problems: [
              DsaProblem(
                id: 'p_basics_1',
                title: 'Count Digits',
                difficulty: 'Easy',
                sectionIndex: 0,
                topicName: 'Basic Maths',
                isSolved: _solved.contains('p_basics_1'),
              ),
            ],
          ),
        ],
      ),
      DsaSection(
        sectionIndex: 3,
        name: 'Binary Search',
        topics: [
          DsaTopic(
            name: 'BS on 1D Arrays',
            sectionIndex: 3,
            problems: [
              DsaProblem(
                id: 'p_bs_1',
                title: 'Binary Search',
                difficulty: 'Easy',
                sectionIndex: 3,
                topicName: 'BS on 1D Arrays',
                isSolved: _solved.contains('p_bs_1'),
              ),
            ],
          ),
        ],
      ),
    ];
  }
}

// Helper mock Dev repository that starts with ZERO completed topics
class EmptyDevRepository extends MockDevRepository {
  final Set<String> _completed = {};

  @override
  Future<Set<String>> getCompletedTopicIds() async => Set.from(_completed);

  @override
  Future<bool> toggleTopicCompleted(String topicId, bool isCompleted) async {
    if (isCompleted) {
      _completed.add(topicId);
    } else {
      _completed.remove(topicId);
    }
    return true;
  }

  @override
  Future<List<DevTopic>> getTopics() async {
    return [
      DevTopic(
        id: 'html',
        name: 'HTML',
        code: 'HTM',
        trackCategory: 'FRONTEND',
        sourceUrl: 'https://example.com',
        subtitle: 'HTML Foundations',
        isCompleted: _completed.contains('html'),
      ),
      DevTopic(
        id: 'css',
        name: 'CSS',
        code: 'CSS',
        trackCategory: 'FRONTEND',
        sourceUrl: 'https://example.com',
        subtitle: 'CSS Foundations',
        isCompleted: _completed.contains('css'),
      ),
    ];
  }
}

void main() {
  group('Phase 5H — 1. QUESTION ELIGIBILITY & SYLLABUS BOUNDARY Tests', () {
    test('1. User with ZERO solved problems and ZERO completed topics has no test eligibility', () async {
      final emptyDsa = EmptyDsaRepository();
      final emptyDev = EmptyDevRepository();

      final boundary = await SyllabusBoundaryService.detectBoundary(
        dsaRepository: emptyDsa,
        devRepository: emptyDev,
      );

      expect(boundary.hasDsaEligibility, isFalse);
      expect(boundary.hasDevEligibility, isFalse);
      expect(boundary.isEligibleFor(TestType.dsa), isFalse);
      expect(boundary.isEligibleFor(TestType.development), isFalse);
      expect(boundary.isEligibleFor(TestType.mixed), isFalse);

      final eligibleDsa = SyllabusBoundaryService.getEligibleQuestions(
        boundary: boundary,
        type: TestType.dsa,
      );
      expect(eligibleDsa, isEmpty);
    });

    test('2. Uncovered topics are strictly excluded from question pool', () async {
      final emptyDsa = EmptyDsaRepository();
      final emptyDev = EmptyDevRepository();

      // User has only solved Section 0 problem
      await emptyDsa.toggleProblemSolved('p_basics_1', true);

      final boundary = await SyllabusBoundaryService.detectBoundary(
        dsaRepository: emptyDsa,
        devRepository: emptyDev,
      );

      expect(boundary.hasDsaEligibility, isTrue);
      expect(boundary.maxDsaSection, 0);

      final eligibleDsa = SyllabusBoundaryService.getEligibleQuestions(
        boundary: boundary,
        type: TestType.dsa,
      );

      // Section 0 questions should be included
      expect(eligibleDsa.any((q) => q.sectionIndex == 0), isTrue);
      // Section 2 (Arrays) or Section 3 (Binary Search) MUST NOT be included
      expect(eligibleDsa.any((q) => q.sectionIndex > 0), isFalse);
    });

    test('3. Development question eligibility strictly requires completed dev topics', () async {
      final emptyDsa = EmptyDsaRepository();
      final emptyDev = EmptyDevRepository();

      // User marks HTML as completed
      await emptyDev.toggleTopicCompleted('html', true);

      final boundary = await SyllabusBoundaryService.detectBoundary(
        dsaRepository: emptyDsa,
        devRepository: emptyDev,
      );

      expect(boundary.hasDevEligibility, isTrue);
      expect(boundary.eligibleDevTopicIds, contains('html'));
      expect(boundary.eligibleDevTopicIds, isNot(contains('css')));

      final eligibleDev = SyllabusBoundaryService.getEligibleQuestions(
        boundary: boundary,
        type: TestType.development,
      );

      expect(eligibleDev.every((q) => q.topicId == 'html'), isTrue);
      expect(eligibleDev.any((q) => q.topicId == 'css'), isFalse);
    });

    test('4. Test generator throws StateError if no questions are eligible', () async {
      final emptyDsa = EmptyDsaRepository();
      final emptyDev = EmptyDevRepository();

      final boundary = await SyllabusBoundaryService.detectBoundary(
        dsaRepository: emptyDsa,
        devRepository: emptyDev,
      );

      expect(
        () => SyllabusBoundaryService.generateSession(
          boundary: boundary,
          type: TestType.dsa,
        ),
        throwsA(isA<StateError>()),
      );
    });
  });

  group('Phase 5H — 2. CODE EXECUTION SERVICE Tests', () {
    final mockExecutor = MockCodeExecutionService();
    const testCodingQ = TestQuestion(
      id: 'dsa_count_digits',
      title: 'Count Digits',
      description: 'Count digits in n',
      category: 'dsa',
      topic: 'Basic Maths',
      topicId: 'dsa_basics',
      difficulty: 'Easy',
      type: QuestionType.coding,
      starterCodeCpp: '// starter code',
      sampleCases: [
        TestCase(input: '156', output: '3', expected: 3),
      ],
      hiddenCases: [
        TestCase(input: '987', output: '3', expected: 3),
      ],
    );

    test('5. Sample run executes without finalizing full evaluation', () async {
      final verdict = await mockExecutor.runCode(
        question: testCodingQ,
        sourceCode: 'int countDigits(int n) { return 3; }',
      );

      expect(verdict.status, ExecutionStatus.passed);
      expect(verdict.passedCases, testCodingQ.sampleCases.length);
    });

    test('6. Trigger compile error returns Compilation Error status', () async {
      final verdict = await mockExecutor.submitCode(
        question: testCodingQ,
        sourceCode: '// TRIGGER_COMPILE_ERROR\nint x = 10',
      );

      expect(verdict.status, ExecutionStatus.compileError);
      expect(verdict.compilerMessage, contains('expected ";"'));
    });

    test('7. Trigger runtime error returns Runtime Error status', () async {
      final verdict = await mockExecutor.submitCode(
        question: testCodingQ,
        sourceCode: '// TRIGGER_RUNTIME_ERROR',
      );

      expect(verdict.status, ExecutionStatus.runtimeError);
    });

    test('8. Trigger TLE returns Time Limit Exceeded status', () async {
      final verdict = await mockExecutor.submitCode(
        question: testCodingQ,
        sourceCode: '// TRIGGER_TLE',
      );

      expect(verdict.status, ExecutionStatus.timeLimitExceeded);
      expect(verdict.timeMs, 2500);
    });

    test('9. Trigger MLE returns Memory Limit Exceeded status', () async {
      final verdict = await mockExecutor.submitCode(
        question: testCodingQ,
        sourceCode: '// TRIGGER_MLE',
      );

      expect(verdict.status, ExecutionStatus.memoryLimitExceeded);
    });

    test('10. Trigger Wrong Answer returns Wrong Answer verdict with diff', () async {
      final verdict = await mockExecutor.submitCode(
        question: testCodingQ,
        sourceCode: '// TRIGGER_WRONG_ANSWER',
      );

      expect(verdict.status, ExecutionStatus.wrongAnswer);
      expect(verdict.caseResults.any((c) => !c.passed), isTrue);
    });

    test('11. Trigger Network Error returns Network Error status', () async {
      final verdict = await mockExecutor.submitCode(
        question: testCodingQ,
        sourceCode: '// TRIGGER_NETWORK_ERROR',
      );

      expect(verdict.status, ExecutionStatus.networkError);
    });
  });

  group('Phase 5H — 3. SCORING & ANALYSIS SERVICE Tests', () {
    test('12. TestScoringService calculates exact score, accuracy, and topic breakdown', () {
      const q1 = TestQuestion(
        id: 'q1',
        title: 'Q1 MCQ',
        description: '...',
        category: 'dsa',
        topic: 'Arrays',
        topicId: 'dsa_arrays',
        difficulty: 'Easy',
        type: QuestionType.mcq,
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 1,
      );

      const q2 = TestQuestion(
        id: 'q2',
        title: 'Q2 MCQ',
        description: '...',
        category: 'dsa',
        topic: 'Arrays',
        topicId: 'dsa_arrays',
        difficulty: 'Medium',
        type: QuestionType.mcq,
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
      );

      const q3 = TestQuestion(
        id: 'q3',
        title: 'Q3 MCQ',
        description: '...',
        category: 'development',
        topic: 'HTML',
        topicId: 'html',
        difficulty: 'Easy',
        type: QuestionType.mcq,
        options: ['A', 'B'],
        correctOptionIndex: 0,
      );

      final session = TestSession(
        id: 'test_1',
        attemptId: 'att_1',
        title: 'Test',
        type: TestType.mixed,
        durationMinutes: 30,
        startTimeMillis: DateTime.now().millisecondsSinceEpoch - 60000,
        targetEndTimeMillis: DateTime.now().millisecondsSinceEpoch + 180000,
        questions: [q1, q2, q3],
        states: {
          'q1': const QuestionSessionState(questionId: 'q1', selectedOption: 1), // Correct
          'q2': const QuestionSessionState(questionId: 'q2', selectedOption: 2), // Wrong
          'q3': const QuestionSessionState(questionId: 'q3'), // Skipped
        },
      );

      final result = TestScoringService.evaluateSession(session);

      expect(result.totalQuestions, 3);
      expect(result.correctCount, 1);
      expect(result.wrongCount, 1);
      expect(result.skippedCount, 1);
      // Score = 1/3 * 100 ~ 33.3%
      expect(result.scorePct, closeTo(33.3, 0.5));
      // Accuracy = 1/2 attempted * 100 = 50.0%
      expect(result.accuracyPct, 50.0);

      // Topic scores
      final arrayScore = result.topicScores.firstWhere((t) => t.topic == 'Arrays');
      expect(arrayScore.total, 2);
      expect(arrayScore.correct, 1);
    });

    test('13. TestAnalysisService produces deterministic insights without AI', () {
      final result = TestAttemptResult(
        id: 'test_1',
        attemptId: 'att_1',
        testTitle: 'DSA Assessment',
        testType: TestType.dsa,
        date: '2026-09-29',
        completedAtIso: '2026-09-29T10:00:00Z',
        timeTakenSeconds: 300,
        totalQuestions: 5,
        correctCount: 4,
        wrongCount: 1,
        skippedCount: 0,
        scorePct: 80.0,
        accuracyPct: 80.0,
        topicScores: const [
          TopicScore(topic: 'Basic Maths', subject: 'DSA', total: 3, correct: 3),
          TopicScore(topic: 'Arrays', subject: 'DSA', total: 2, correct: 1),
        ],
        difficultyScores: const [
          DifficultyScore(difficulty: 'Easy', total: 3, correct: 3),
          DifficultyScore(difficulty: 'Medium', total: 2, correct: 1),
        ],
        questionResults: const [],
        strongTopics: ['Basic Maths'],
        weakTopics: [],
        analysisInsights: const [],
      );

      final insights = TestAnalysisService.generateInsights(result);

      expect(insights, isNotEmpty);
      expect(insights.any((i) => i.contains('Basic Maths') && i.contains('100%')), isTrue);
      expect(insights.any((i) => i.contains('Medium-level questions')), isTrue);
    });
  });

  group('Phase 5H — 4. PERSISTENCE & MULTI-ACCOUNT ISOLATION Tests', () {
    test('14. User A attempts are isolated from User B', () async {
      final mockTestRepo = MockTestRepository(initialUserId: 'user_A');

      final attemptA = TestAttemptResult(
        id: 'attempt_A',
        attemptId: 'att_A',
        testTitle: 'User A Test',
        testType: TestType.dsa,
        date: '2026-09-29',
        completedAtIso: '2026-09-29T10:00:00Z',
        timeTakenSeconds: 120,
        totalQuestions: 5,
        correctCount: 4,
        wrongCount: 1,
        skippedCount: 0,
        scorePct: 80.0,
        accuracyPct: 80.0,
        topicScores: const [],
        difficultyScores: const [],
        questionResults: const [],
        strongTopics: const [],
        weakTopics: const [],
        analysisInsights: const [],
      );

      await mockTestRepo.saveTestAttempt(attemptA);

      final historyA = await mockTestRepo.getTestHistory();
      expect(historyA.length, 1);
      expect(historyA.first.id, 'attempt_A');

      // Switch to User B
      mockTestRepo.setUserId('user_B');

      final historyB = await mockTestRepo.getTestHistory();
      expect(historyB, isEmpty);

      // User B cannot access User A attempt
      final attemptBRetrieval = await mockTestRepo.getTestAttemptById('attempt_A');
      expect(attemptBRetrieval, isNull);
    });
  });

  group('Phase 5H — 5. UI & WORKBENCH WIDGET Tests', () {
    testWidgets('15. Empty state displays "No test available yet" when user has 0 eligible topics', (tester) async {
      final emptyDsa = EmptyDsaRepository();
      final emptyDev = EmptyDevRepository();
      final testRepo = MockTestRepository(dsaRepository: emptyDsa, devRepository: emptyDev);

      await tester.pumpWidget(
        MaterialApp(
          home: TestHubScreen(
            testRepository: testRepo,
            dsaRepository: emptyDsa,
            devRepository: emptyDev,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('No test available yet'), findsOneWidget);
      expect(find.text('Complete more topics to unlock your first test.'), findsOneWidget);
    });

    testWidgets('16. TestWorkbenchScreen renders question navigation and C++ editor', (tester) async {
      const q1 = TestQuestion(
        id: 'q1',
        title: 'Count Digits Test Problem',
        description: 'Count digits in integer n.',
        category: 'dsa',
        topic: 'Basic Maths',
        topicId: 'dsa_basics',
        difficulty: 'Easy',
        type: QuestionType.coding,
        starterCodeCpp: 'int countDigits(int n) { return 0; }',
        sampleCases: [
          TestCase(input: '156', output: '3', expected: 3),
        ],
      );

      final session = TestSession(
        id: 'test_session_1',
        attemptId: 'att_1',
        title: 'DSA ASSESSMENT',
        type: TestType.dsa,
        durationMinutes: 30,
        startTimeMillis: DateTime.now().millisecondsSinceEpoch,
        targetEndTimeMillis: DateTime.now().millisecondsSinceEpoch + 1800000,
        questions: [q1],
        states: {
          'q1': const QuestionSessionState(
            questionId: 'q1',
            codeDraft: 'int countDigits(int n) { return 0; }',
          ),
        },
      );

      await tester.pumpWidget(
        MaterialApp(
          home: TestWorkbenchScreen(
            initialSession: session,
            codeExecutionService: MockCodeExecutionService(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('DSA ASSESSMENT'), findsOneWidget);
      expect(find.text('Count Digits Test Problem'), findsOneWidget);
      expect(find.text('C++17 (GCC)'), findsOneWidget);
      expect(find.text('RUN SAMPLES'), findsOneWidget);
      expect(find.text('SUBMIT TEST'), findsOneWidget);
    });

    testWidgets('17. MCQ option selection updates session state', (tester) async {
      const qMcq = TestQuestion(
        id: 'q_mcq',
        title: 'Array Indexing Time Complexity',
        description: 'What is the time complexity of array indexing?',
        category: 'dsa',
        topic: 'Basic Maths',
        topicId: 'dsa_basics',
        difficulty: 'Easy',
        type: QuestionType.mcq,
        options: ['O(1)', 'O(N)', 'O(log N)', 'O(N^2)'],
        correctOptionIndex: 0,
      );

      final session = TestSession(
        id: 'session_mcq',
        attemptId: 'att_mcq',
        title: 'DSA TEST',
        type: TestType.dsa,
        durationMinutes: 30,
        startTimeMillis: DateTime.now().millisecondsSinceEpoch,
        targetEndTimeMillis: DateTime.now().millisecondsSinceEpoch + 1800000,
        questions: [qMcq],
        states: {
          'q_mcq': const QuestionSessionState(questionId: 'q_mcq'),
        },
      );

      await tester.pumpWidget(
        MaterialApp(
          home: TestWorkbenchScreen(
            initialSession: session,
            codeExecutionService: MockCodeExecutionService(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('O(1)'), findsOneWidget);
      expect(find.text('O(N)'), findsOneWidget);

      // Tap option O(1)
      await tester.tap(find.text('O(1)'));
      await tester.pumpAndSettle();

      // Tap SUBMIT TEST to trigger confirmation dialog and verify answered tally is 1
      await tester.tap(find.text('SUBMIT TEST'));
      await tester.pumpAndSettle();

      expect(find.text('SUBMIT TEST ASSESSMENT?'), findsOneWidget);
      expect(find.text('1 / 1'), findsOneWidget); // 1 of 1 answered
    });

    testWidgets('18. TestResultScreen integrates with MistakeBank', (tester) async {
      final mockMistakeRepo = MockMistakeRepository();

      const testResult = TestAttemptResult(
        id: 'test_res_1',
        attemptId: 'att_res_1',
        testTitle: 'DSA Assessment',
        testType: TestType.dsa,
        date: '2026-09-29',
        completedAtIso: '2026-09-29T10:00:00Z',
        timeTakenSeconds: 300,
        totalQuestions: 2,
        correctCount: 1,
        wrongCount: 1,
        skippedCount: 0,
        scorePct: 50.0,
        accuracyPct: 50.0,
        topicScores: [
          TopicScore(topic: 'Basic Maths', subject: 'DSA', total: 2, correct: 1),
        ],
        difficultyScores: [
          DifficultyScore(difficulty: 'Easy', total: 2, correct: 1),
        ],
        questionResults: [
          QuestionResult(
            index: 1,
            questionId: 'q_wrong',
            title: 'Failed Problem',
            topic: 'Basic Maths',
            subject: 'DSA',
            difficulty: 'Easy',
            type: QuestionType.mcq,
            isCorrect: false,
            isSkipped: false,
            userAnswer: 'Wrong Answer',
            correctAnswer: 'Right Answer',
            explanation: 'Correct logic explanation.',
          ),
        ],
        strongTopics: [],
        weakTopics: ['Basic Maths'],
        analysisInsights: ['Needs improvement in Basic Maths.'],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: TestResultScreen(
            result: testResult,
            mistakeRepository: mockMistakeRepo,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('ASSESSMENT RESULT'), findsOneWidget);
      expect(find.text('50%'), findsAtLeastNWidgets(1));

      // Scroll and tap Add to Mistake Bank
      await tester.scrollUntilVisible(find.text('ADD TO MISTAKE BANK'), 100);
      await tester.tap(find.text('ADD TO MISTAKE BANK'));
      await tester.pumpAndSettle();

      expect(find.text('ADDED TO MISTAKES'), findsOneWidget);

      // Verify mistake was added to repository
      final mistakes = await mockMistakeRepo.getMistakes();
      expect(mistakes.any((m) => m.question == 'Failed Problem'), isTrue);
    });
  });

  group('Phase 5H — 6. RESPONSIVENESS Tests (320px to 430px)', () {
    const testWidths = [320.0, 360.0, 390.0, 412.0, 430.0];

    for (final width in testWidths) {
      testWidgets('19. No horizontal overflow on TestHubScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 800);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        final mockTestRepo = MockTestRepository();

        await tester.pumpWidget(
          MaterialApp(
            home: TestHubScreen(
              testRepository: mockTestRepo,
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('20. No horizontal overflow on TestWorkbenchScreen at width $width', (tester) async {
        tester.view.physicalSize = Size(width, 800);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        const q = TestQuestion(
          id: 'q1',
          title: 'Two Sum / Array Hashing',
          description: 'Find two indices summing to target.',
          category: 'dsa',
          topic: 'Arrays',
          topicId: 'dsa_arrays',
          difficulty: 'Medium',
          type: QuestionType.coding,
          starterCodeCpp: 'class Solution { public: vector<int> twoSum() {} };',
          sampleCases: [
            TestCase(input: '[2,7,11,15], 9', output: '[0,1]', expected: [0, 1]),
          ],
        );

        final session = TestSession(
          id: 's1',
          attemptId: 'a1',
          title: 'SUNDAY WEEKLY TEST',
          type: TestType.dsa,
          durationMinutes: 30,
          startTimeMillis: DateTime.now().millisecondsSinceEpoch,
          targetEndTimeMillis: DateTime.now().millisecondsSinceEpoch + 1800000,
          questions: [q],
          states: {
            'q1': const QuestionSessionState(
              questionId: 'q1',
              codeDraft: 'class Solution { public: vector<int> twoSum() {} };',
            ),
          },
        );

        await tester.pumpWidget(
          MaterialApp(
            home: TestWorkbenchScreen(
              initialSession: session,
              codeExecutionService: MockCodeExecutionService(),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    }
  });
}
