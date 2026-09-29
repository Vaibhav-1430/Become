import '../domain/models/test_execution_verdict.dart';
import '../domain/models/test_question.dart';
import 'code_execution_service.dart';

/// Deterministic mock execution service for unit/widget tests.
/// Never calls external servers; produces predictable verdicts.
class MockCodeExecutionService implements CodeExecutionService {
  ExecutionVerdict? forcedVerdict;
  Duration latency;

  MockCodeExecutionService({
    this.forcedVerdict,
    this.latency = Duration.zero,
  });

  @override
  Future<ExecutionVerdict> runCode({
    required TestQuestion question,
    required String sourceCode,
    String? customInput,
  }) async {
    if (latency > Duration.zero) {
      await Future<void>.delayed(latency);
    }

    if (forcedVerdict != null) return forcedVerdict!;

    return _evaluate(question, sourceCode, isSubmission: false, customInput: customInput);
  }

  @override
  Future<ExecutionVerdict> submitCode({
    required TestQuestion question,
    required String sourceCode,
  }) async {
    if (latency > Duration.zero) {
      await Future<void>.delayed(latency);
    }

    if (forcedVerdict != null) return forcedVerdict!;

    return _evaluate(question, sourceCode, isSubmission: true);
  }

  ExecutionVerdict _evaluate(
    TestQuestion question,
    String sourceCode, {
    required bool isSubmission,
    String? customInput,
  }) {
    // 1. Simulation triggers for unit testing
    if (sourceCode.contains('// TRIGGER_COMPILE_ERROR')) {
      return const ExecutionVerdict(
        status: ExecutionStatus.compileError,
        compilerMessage: 'error: expected ";" at end of declaration\nint x = 10\n          ^',
        stderr: 'Compilation terminated with exit code 1.',
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }
    if (sourceCode.contains('// TRIGGER_RUNTIME_ERROR')) {
      return const ExecutionVerdict(
        status: ExecutionStatus.runtimeError,
        compilerMessage: null,
        stderr: 'terminate called after throwing an instance of "std::out_of_range"',
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }
    if (sourceCode.contains('// TRIGGER_TLE')) {
      return const ExecutionVerdict(
        status: ExecutionStatus.timeLimitExceeded,
        compilerMessage: 'Time Limit Exceeded: Process exceeded 2.500s.',
        timeMs: 2500,
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }
    if (sourceCode.contains('// TRIGGER_MLE')) {
      return const ExecutionVerdict(
        status: ExecutionStatus.memoryLimitExceeded,
        compilerMessage: 'Memory Limit Exceeded: Process exceeded 256.0 MB.',
        timeMs: 340,
        memoryMb: 257.4,
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }
    if (sourceCode.contains('// TRIGGER_NETWORK_ERROR')) {
      return const ExecutionVerdict(
        status: ExecutionStatus.networkError,
        compilerMessage: 'Network error: Failed to connect to judge host.',
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }
    if (sourceCode.contains('// TRIGGER_WRONG_ANSWER')) {
      final cases = isSubmission
          ? [...question.sampleCases, ...question.hiddenCases]
          : question.sampleCases;
      return ExecutionVerdict(
        status: ExecutionStatus.wrongAnswer,
        compilerMessage: null,
        stdout: 'Output: 0\nExpected: 3',
        timeMs: 12,
        passedCases: 0,
        totalCases: cases.length,
        caseResults: cases.asMap().entries.map((e) {
          return TestCaseResult(
            caseIndex: e.key + 1,
            isSample: e.key < question.sampleCases.length,
            passed: false,
            input: e.value.input ?? e.value.args.toString(),
            expected: e.value.expected.toString(),
            actual: '0',
            reason: 'Mismatch: expected ${e.value.expected}, got 0',
          );
        }).toList(),
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }

    // Default: Check if code has non-empty implementation and doesn't equal raw starter code
    final isRawStarter = question.starterCodeCpp != null &&
        sourceCode.trim() == question.starterCodeCpp!.trim();
    final isEmpty = sourceCode.trim().isEmpty;

    if (isEmpty || isRawStarter) {
      final cases = isSubmission
          ? [...question.sampleCases, ...question.hiddenCases]
          : question.sampleCases;
      return ExecutionVerdict(
        status: ExecutionStatus.wrongAnswer,
        compilerMessage: null,
        timeMs: 4,
        passedCases: 0,
        totalCases: cases.length,
        caseResults: cases.asMap().entries.map((e) {
          return TestCaseResult(
            caseIndex: e.key + 1,
            isSample: e.key < question.sampleCases.length,
            passed: false,
            input: e.value.input ?? e.value.args.toString(),
            expected: e.value.expected.toString(),
            actual: 'null',
            reason: 'Starter code returned placeholder answer.',
          );
        }).toList(),
      );
    }

    // If sourceCode has actual solution code, treat as passed
    final cases = isSubmission
        ? [...question.sampleCases, ...question.hiddenCases]
        : question.sampleCases;

    return ExecutionVerdict(
      status: ExecutionStatus.passed,
      stdout: '[All test cases passed]',
      timeMs: 6,
      memoryMb: 11.2,
      passedCases: cases.length,
      totalCases: cases.length,
      caseResults: cases.asMap().entries.map((e) {
        return TestCaseResult(
          caseIndex: e.key + 1,
          isSample: e.key < question.sampleCases.length,
          passed: true,
          input: e.value.input ?? e.value.args.toString(),
          expected: e.value.expected.toString(),
          actual: e.value.expected.toString(),
        );
      }).toList(),
      compiler: 'g++ (GCC 14.1.0) C++17',
    );
  }
}
