import '../domain/models/test_execution_verdict.dart';
import '../domain/models/test_question.dart';

/// Abstract contract for C++ compilation and testcase execution.
abstract class CodeExecutionService {
  /// Evaluates source code against visible sample testcases (or custom input).
  /// Does not finalize the test question answer.
  Future<ExecutionVerdict> runCode({
    required TestQuestion question,
    required String sourceCode,
    String? customInput,
  });

  /// Evaluates source code against the full suite (sample + hidden testcases).
  /// Returns the definitive evaluation verdict.
  Future<ExecutionVerdict> submitCode({
    required TestQuestion question,
    required String sourceCode,
  });
}
