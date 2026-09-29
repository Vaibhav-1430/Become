import 'dart:convert';
import 'package:http/http.dart' as http;
import '../domain/models/test_execution_verdict.dart';
import '../domain/models/test_question.dart';
import 'code_execution_service.dart';

/// Production C++ Code Execution Service using the public Judge0 CE engine.
/// Completely open, requires NO client-side API keys or secrets.
class Judge0CodeExecutionService implements CodeExecutionService {
  final http.Client _httpClient;
  final String _endpoint;

  Judge0CodeExecutionService({
    http.Client? httpClient,
    String endpoint = 'https://ce.judge0.com/submissions?base64_encoded=true&wait=true',
  })  : _httpClient = httpClient ?? http.Client(),
        _endpoint = endpoint;

  @override
  Future<ExecutionVerdict> runCode({
    required TestQuestion question,
    required String sourceCode,
    String? customInput,
  }) async {
    return _execute(
      question: question,
      sourceCode: sourceCode,
      isSubmission: false,
      customInput: customInput,
    );
  }

  @override
  Future<ExecutionVerdict> submitCode({
    required TestQuestion question,
    required String sourceCode,
  }) async {
    return _execute(
      question: question,
      sourceCode: sourceCode,
      isSubmission: true,
    );
  }

  Future<ExecutionVerdict> _execute({
    required TestQuestion question,
    required String sourceCode,
    required bool isSubmission,
    String? customInput,
  }) async {
    final testCases = isSubmission
        ? [...question.sampleCases, ...question.hiddenCases]
        : question.sampleCases;

    final harness = _buildHarness(
      sourceCode: sourceCode,
      functionName: question.functionName ?? 'solution',
      testCases: testCases,
      customInput: customInput,
    );

    try {
      final base64Source = base64Encode(utf8.encode(harness));
      final payload = {
        'source_code': base64Source,
        'language_id': 105, // C++ (GCC 14.1.0, C++17)
        'cpu_time_limit': 2.5,
        'memory_limit': 256000,
      };

      final response = await _httpClient.post(
        Uri.parse(_endpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode != 200 && response.statusCode != 201) {
        return ExecutionVerdict(
          status: ExecutionStatus.systemError,
          compilerMessage: 'Judge server returned HTTP ${response.statusCode}',
          compiler: 'g++ (GCC 14.1.0) C++17',
        );
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      final rawStdoutB64 = data['stdout'] as String?;
      final rawStderrB64 = data['stderr'] as String?;
      final rawCompileB64 = data['compile_output'] as String?;

      final stdout = rawStdoutB64 != null ? utf8.decode(base64Decode(rawStdoutB64)) : '';
      final stderr = rawStderrB64 != null ? utf8.decode(base64Decode(rawStderrB64)) : '';
      final compileOutput = rawCompileB64 != null ? utf8.decode(base64Decode(rawCompileB64)) : '';

      final statusObj = data['status'] as Map<String, dynamic>?;
      final statusId = statusObj?['id'] as int? ?? -1;
      final statusDesc = statusObj?['description'] as String? ?? 'Unknown';

      final timeSec = double.tryParse(data['time']?.toString() ?? '0') ?? 0.0;
      final timeMs = (timeSec * 1000).toInt();
      final memoryKb = (data['memory'] as num?)?.toDouble() ?? 0.0;
      final memoryMb = memoryKb > 0 ? memoryKb / 1024 : null;

      // 1. Compilation Error (Status ID 6 or non-empty compileOutput)
      if (statusId == 6 || compileOutput.trim().isNotEmpty) {
        return ExecutionVerdict(
          status: ExecutionStatus.compileError,
          compilerMessage: compileOutput.trim().isNotEmpty ? compileOutput.trim() : stderr.trim(),
          stderr: stderr,
          compiler: 'g++ (GCC 14.1.0) C++17',
        );
      }

      // 2. Time Limit Exceeded (Status ID 5)
      if (statusId == 5 || statusDesc.toLowerCase().contains('time limit')) {
        return ExecutionVerdict(
          status: ExecutionStatus.timeLimitExceeded,
          compilerMessage: 'Time Limit Exceeded: Execution took longer than 2.5 seconds.',
          timeMs: timeMs,
          compiler: 'g++ (GCC 14.1.0) C++17',
        );
      }

      // 3. Memory Limit Exceeded (Status ID 12)
      if (statusId == 12 || statusDesc.toLowerCase().contains('memory limit')) {
        return ExecutionVerdict(
          status: ExecutionStatus.memoryLimitExceeded,
          compilerMessage: 'Memory Limit Exceeded: Process exceeded 256 MB.',
          timeMs: timeMs,
          memoryMb: memoryMb,
          compiler: 'g++ (GCC 14.1.0) C++17',
        );
      }

      // 4. Runtime Error (Status ID >= 7)
      if (statusId >= 7 || statusDesc.toLowerCase().contains('runtime error') || stderr.trim().isNotEmpty) {
        return ExecutionVerdict(
          status: ExecutionStatus.runtimeError,
          compilerMessage: stderr.trim().isNotEmpty ? stderr.trim() : statusDesc,
          stderr: stderr,
          timeMs: timeMs,
          memoryMb: memoryMb,
          compiler: 'g++ (GCC 14.1.0) C++17',
        );
      }

      // 5. Case verification
      final caseResults = <TestCaseResult>[];
      int passedCount = 0;

      for (int i = 0; i < testCases.length; i++) {
        final tc = testCases[i];
        final pattern = RegExp('__CASE_START_${i}__([\\s\\S]*?)__CASE_END_${i}__');
        final match = pattern.firstMatch(stdout);
        final rawCaseOutput = match?.group(1)?.trim() ?? '';

        final expectedStr = tc.expected?.toString().trim() ?? '';
        final actualStr = rawCaseOutput.trim();

        final isPassed = actualStr == expectedStr;
        if (isPassed) passedCount++;

        caseResults.add(TestCaseResult(
          caseIndex: i + 1,
          isSample: i < question.sampleCases.length,
          passed: isPassed,
          input: tc.input ?? tc.args.toString(),
          expected: expectedStr,
          actual: actualStr,
          reason: isPassed ? null : 'Expected $expectedStr, received $actualStr',
        ));
      }

      final allPassed = passedCount == testCases.length;

      return ExecutionVerdict(
        status: allPassed ? ExecutionStatus.passed : ExecutionStatus.wrongAnswer,
        stdout: stdout,
        stderr: stderr,
        timeMs: timeMs,
        memoryMb: memoryMb,
        passedCases: passedCount,
        totalCases: testCases.length,
        caseResults: caseResults,
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    } catch (e) {
      return ExecutionVerdict(
        status: ExecutionStatus.networkError,
        compilerMessage: 'Network error connecting to execution judge: $e',
        compiler: 'g++ (GCC 14.1.0) C++17',
      );
    }
  }

  String _buildHarness({
    required String sourceCode,
    required String functionName,
    required List<TestCase> testCases,
    String? customInput,
  }) {
    final buffer = StringBuffer();
    buffer.writeln(sourceCode);
    buffer.writeln();
    buffer.writeln('int main() {');
    buffer.writeln('    Solution __sol;');

    for (int i = 0; i < testCases.length; i++) {
      final tc = testCases[i];
      buffer.writeln('    std::cout << "__CASE_START_${i}__\\n";');
      if (tc.args.isNotEmpty) {
        final arg0 = tc.args[0];
        if (arg0 is int) {
          if (tc.args.length > 1 && tc.args[1] is int) {
            buffer.writeln('    std::cout << __sol.$functionName($arg0, ${tc.args[1]}) << "\\n";');
          } else {
            buffer.writeln('    std::cout << __sol.$functionName($arg0) << "\\n";');
          }
        } else if (arg0 is List) {
          buffer.write('    std::vector<int> __v$i = {');
          buffer.write(arg0.join(', '));
          buffer.writeln('};');
          if (tc.args.length > 1 && tc.args[1] is int) {
            buffer.writeln('    auto __res$i = __sol.$functionName(__v$i, ${tc.args[1]});');
            buffer.writeln('    if (__res$i.size() >= 2) std::cout << "[" << __res$i[0] << ", " << __res$i[1] << "]\\n";');
          } else {
            buffer.writeln('    auto __res$i = __sol.$functionName(__v$i);');
            buffer.writeln('    std::cout << "[";');
            buffer.writeln('    for (size_t k = 0; k < __res$i.size(); ++k) {');
            buffer.writeln('        std::cout << __res$i[k] << (k + 1 < __res$i.size() ? ", " : "");');
            buffer.writeln('    }');
            buffer.writeln('    std::cout << "]\\n";');
          }
        }
      }
      buffer.writeln('    std::cout << "__CASE_END_${i}__\\n";');
    }

    buffer.writeln('    return 0;');
    buffer.writeln('}');
    return buffer.toString();
  }
}
