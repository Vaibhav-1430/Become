/// Execution status states for the coding evaluation engine.
enum ExecutionStatus {
  idle,
  running,
  passed,
  wrongAnswer,
  compileError,
  runtimeError,
  timeLimitExceeded,
  memoryLimitExceeded,
  systemError,
  networkError,
}

/// Result of evaluating an individual test case.
class TestCaseResult {
  final int caseIndex;
  final bool isSample;
  final bool passed;
  final String? input;
  final String? expected;
  final String? actual;
  final String? reason;

  const TestCaseResult({
    required this.caseIndex,
    required this.isSample,
    required this.passed,
    this.input,
    this.expected,
    this.actual,
    this.reason,
  });

  Map<String, dynamic> toJson() => {
        'caseIndex': caseIndex,
        'isSample': isSample,
        'passed': passed,
        'input': input,
        'expected': expected,
        'actual': actual,
        'reason': reason,
      };

  factory TestCaseResult.fromJson(Map<String, dynamic> json) => TestCaseResult(
        caseIndex: json['caseIndex'] as int? ?? 0,
        isSample: json['isSample'] as bool? ?? true,
        passed: json['passed'] as bool? ?? false,
        input: json['input'] as String?,
        expected: json['expected'] as String?,
        actual: json['actual'] as String?,
        reason: json['reason'] as String?,
      );
}

/// Comprehensive verdict returned by the code execution engine.
class ExecutionVerdict {
  final ExecutionStatus status;
  final String? compilerMessage;
  final String? stdout;
  final String? stderr;
  final int timeMs;
  final double? memoryMb;
  final int passedCases;
  final int totalCases;
  final List<TestCaseResult> caseResults;
  final String compiler;

  const ExecutionVerdict({
    required this.status,
    this.compilerMessage,
    this.stdout,
    this.stderr,
    this.timeMs = 0,
    this.memoryMb,
    this.passedCases = 0,
    this.totalCases = 0,
    this.caseResults = const [],
    this.compiler = 'g++ (GCC 14.1.0) C++17',
  });

  bool get isAccepted => status == ExecutionStatus.passed;

  String get displayTitle {
    switch (status) {
      case ExecutionStatus.idle:
        return 'Ready';
      case ExecutionStatus.running:
        return 'Executing...';
      case ExecutionStatus.passed:
        return 'Accepted';
      case ExecutionStatus.wrongAnswer:
        return 'Wrong Answer';
      case ExecutionStatus.compileError:
        return 'Compilation Error';
      case ExecutionStatus.runtimeError:
        return 'Runtime Error';
      case ExecutionStatus.timeLimitExceeded:
        return 'Time Limit Exceeded';
      case ExecutionStatus.memoryLimitExceeded:
        return 'Memory Limit Exceeded';
      case ExecutionStatus.systemError:
        return 'System Error';
      case ExecutionStatus.networkError:
        return 'Network Error';
    }
  }

  Map<String, dynamic> toJson() => {
        'status': status.name,
        'compilerMessage': compilerMessage,
        'stdout': stdout,
        'stderr': stderr,
        'timeMs': timeMs,
        'memoryMb': memoryMb,
        'passedCases': passedCases,
        'totalCases': totalCases,
        'caseResults': caseResults.map((c) => c.toJson()).toList(),
        'compiler': compiler,
      };

  factory ExecutionVerdict.fromJson(Map<String, dynamic> json) => ExecutionVerdict(
        status: ExecutionStatus.values.firstWhere(
          (s) => s.name == json['status'],
          orElse: () => ExecutionStatus.idle,
        ),
        compilerMessage: json['compilerMessage'] as String?,
        stdout: json['stdout'] as String?,
        stderr: json['stderr'] as String?,
        timeMs: (json['timeMs'] as num?)?.toInt() ?? 0,
        memoryMb: (json['memoryMb'] as num?)?.toDouble(),
        passedCases: (json['passedCases'] as int?) ?? 0,
        totalCases: (json['totalCases'] as int?) ?? 0,
        caseResults: (json['caseResults'] as List<dynamic>?)
                ?.map((c) => TestCaseResult.fromJson(c as Map<String, dynamic>))
                .toList() ??
            const [],
        compiler: json['compiler'] as String? ?? 'g++ (GCC 14.1.0) C++17',
      );
}
