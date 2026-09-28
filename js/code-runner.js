/**
 * BOSS Study OS — Production Code Execution Engine
 * Provides genuine, sandboxed execution for JavaScript and Python in the browser.
 * NEVER fakes compilation, execution, or accepted results.
 */

const CodeRunner = {
    pyodideInstance: null,
    isPyodideLoading: false,
    _pyodideInitPromise: null,

    async ensurePyodideReady() {
        return this.initPyodide();
    },

    disposePyodide() {
        this.pyodideInstance = null;
        this.isPyodideLoading = false;
        this._pyodideInitPromise = null;
    },

    /**
     * Deep equality comparison for arrays, objects, primitives
     */
    deepEqual(a, b) {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (a === null || b === null) return a === b;
        if (typeof a !== 'object') return a === b;

        // Handle array comparison
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepEqual(a[i], b[i])) return false;
            }
            return true;
        }

        // Handle object comparison
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (let k of keysA) {
            if (!keysB.includes(k) || !this.deepEqual(a[k], b[k])) return false;
        }
        return true;
    },

    /**
     * Problem-aware semantic output validator
     * Validates results logically rather than relying on fragile string comparisons.
     */
    validateAnswer(questionId, functionName, actual, expected, tc) {
        // Special Semantic Validator for Two Sum
        if (questionId === 'dsa_two_sum' || functionName === 'twoSum') {
            const nums = tc?.args?.[0];
            const target = tc?.args?.[1];

            // Parse returned indices from whatever format (array, string like "[0, 1]", "{0, 1}", "0, 1", etc.)
            let indices = null;
            if (Array.isArray(actual)) {
                indices = actual.map(x => Number(x)).filter(x => !isNaN(x));
            } else if (typeof actual === 'string') {
                const matches = actual.match(/-?\d+/g);
                if (matches) {
                    indices = matches.map(x => parseInt(x, 10));
                }
            } else if (typeof actual === 'object' && actual !== null) {
                indices = Object.values(actual).map(x => Number(x)).filter(x => !isNaN(x));
            }

            if (!indices || indices.length !== 2) {
                return {
                    isValid: false,
                    reason: `Expected 2 indices, but got ${actual === undefined ? 'nothing' : JSON.stringify(actual)}`
                };
            }

            const [i, j] = indices;
            if (!Number.isInteger(i) || !Number.isInteger(j)) {
                return { isValid: false, reason: `Indices must be integers: got [${i}, ${j}]` };
            }

            if (i === j) {
                return { isValid: false, reason: `Cannot use the same element twice: index ${i} used twice` };
            }

            if (!Array.isArray(nums)) {
                // Fallback if test case args are missing: compare to expected
                const expectedNormalized = Array.isArray(expected) ? [...expected].sort((a, b) => a - b) : null;
                const actualNormalized = [...indices].sort((a, b) => a - b);
                const isEq = expectedNormalized && actualNormalized[0] === expectedNormalized[0] && actualNormalized[1] === expectedNormalized[1];
                return { isValid: isEq, reason: isEq ? '' : `Output ${JSON.stringify(indices)} does not match expected ${JSON.stringify(expected)}` };
            }

            if (i < 0 || i >= nums.length || j < 0 || j >= nums.length) {
                return {
                    isValid: false,
                    reason: `Indices [${i}, ${j}] are out of bounds for array of length ${nums.length}`
                };
            }

            const sum = nums[i] + nums[j];
            if (sum !== target) {
                return {
                    isValid: false,
                    reason: `nums[${i}] (${nums[i]}) + nums[${j}] (${nums[j]}) = ${sum}, which does not equal target ${target}`
                };
            }

            // Both indices valid, distinct, and nums[i] + nums[j] === target!
            return { isValid: true };
        }

        // General validation: parse actual if it's a string (from C++)
        let parsedActual = actual;
        if (typeof actual === 'string') {
            const trimmed = actual.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                trimmed === 'true' || trimmed === 'false' ||
                !isNaN(Number(trimmed))) {
                try {
                    const jsonCandidate = trimmed.startsWith('{') && trimmed.endsWith('}')
                        ? '[' + trimmed.slice(1, -1) + ']'
                        : trimmed;
                    parsedActual = JSON.parse(jsonCandidate);
                } catch (e) {
                    parsedActual = trimmed;
                }
            }
        }

        // Deep compare parsedActual with expected
        if (this.deepEqual(parsedActual, expected)) {
            return { isValid: true };
        }

        // Also normalize number comparisons
        if (typeof parsedActual === 'number' && typeof expected === 'number') {
            return { isValid: Math.abs(parsedActual - expected) < 1e-6 };
        }

        // Fallback string normalized comparison
        const actNorm = String(actual).replace(/\s+/g, '');
        const expNorm = (typeof expected === 'object' ? JSON.stringify(expected) : String(expected)).replace(/\s+/g, '');
        return {
            isValid: actNorm === expNorm,
            reason: actNorm === expNorm ? '' : `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
        };
    },

    /**
     * Build the worker script string for sandboxed JavaScript execution
     */
    buildJsWorkerScript() {
        return `
            self.onmessage = function(e) {
                const { code, functionName, testCases, isCustom, customInput, questionId } = e.data;
                const logs = [];
                const customConsole = {
                    log: function(...args) {
                        logs.push(args.map(a => {
                            if (typeof a === 'object' && a !== null) {
                                try { return JSON.stringify(a); } catch (e) { return String(a); }
                            }
                            return String(a);
                        }).join(' '));
                    },
                    error: function(...args) { logs.push('[ERROR] ' + args.join(' ')); },
                    warn: function(...args) { logs.push('[WARN] ' + args.join(' ')); }
                };

                let userFn = null;
                try {
                    // Evaluate code in scope with isolated console (supports standalone fn or Solution class)
                    const factory = new Function('console', code + '; if (typeof ' + functionName + ' !== "undefined") return ' + functionName + '; if (typeof Solution !== "undefined") { const inst = new Solution(); if (typeof inst["' + functionName + '"] === "function") return inst["' + functionName + '"].bind(inst); } return null;');
                    userFn = factory(customConsole);
                } catch (compileErr) {
                    self.postMessage({
                        status: 'COMPILE_ERROR',
                        error: compileErr.name + ': ' + compileErr.message,
                        logs: logs,
                        passedCount: 0,
                        totalCount: testCases ? testCases.length : 0,
                        timeMs: 0
                    });
                    return;
                }

                if (typeof userFn !== 'function') {
                    self.postMessage({
                        status: 'COMPILE_ERROR',
                        error: 'Function "' + functionName + '" is not defined. Please implement function ' + functionName + '(...)',
                        logs: logs,
                        passedCount: 0,
                        totalCount: testCases ? testCases.length : 0,
                        timeMs: 0
                    });
                    return;
                }

                // Handle custom input run
                if (isCustom) {
                    const start = performance.now();
                    let resultVal = undefined;
                    let runtimeError = null;
                    try {
                        let parsedArgs = [];
                        if (typeof customInput === 'string' && customInput.trim()) {
                            try {
                                const parsed = JSON.parse('[' + customInput.trim() + ']');
                                parsedArgs = parsed;
                            } catch (pErr) {
                                parsedArgs = [customInput.trim()];
                            }
                        }
                        resultVal = userFn.apply(null, parsedArgs);
                    } catch (rErr) {
                        runtimeError = rErr.name + ': ' + rErr.message;
                    }
                    const elapsed = Math.round(performance.now() - start);

                    self.postMessage({
                        status: runtimeError ? 'RUNTIME_ERROR' : 'CUSTOM_SUCCESS',
                        result: resultVal,
                        error: runtimeError,
                        logs: logs,
                        timeMs: elapsed
                    });
                    return;
                }

                // Run test suite
                let passedCount = 0;
                let failedCase = null;
                const totalCount = testCases.length;
                const start = performance.now();

                for (let i = 0; i < totalCount; i++) {
                    const tc = testCases[i];
                    let actual = undefined;
                    try {
                        // Deep clone args so user function doesn't mutate test cases
                        const clonedArgs = JSON.parse(JSON.stringify(tc.args || []));
                        actual = userFn.apply(null, clonedArgs);
                    } catch (rErr) {
                        const elapsed = Math.round(performance.now() - start);
                        self.postMessage({
                            status: 'RUNTIME_ERROR',
                            error: 'Runtime Error on test case ' + (i + 1) + ': ' + rErr.message,
                            passedCount: passedCount,
                            totalCount: totalCount,
                            logs: logs,
                            timeMs: elapsed,
                            failedCase: {
                                index: i + 1,
                                input: JSON.stringify(tc.args),
                                expected: JSON.stringify(tc.expected),
                                error: rErr.message
                            }
                        });
                        return;
                    }

                    // Semantic validation for Two Sum or deep compare
                    let isCorrect = false;
                    if (questionId === 'dsa_two_sum' || functionName === 'twoSum') {
                        const nums = tc.args ? tc.args[0] : null;
                        const target = tc.args ? tc.args[1] : null;
                        if (Array.isArray(actual) && actual.length === 2 && Array.isArray(nums)) {
                            const [idxA, idxB] = actual;
                            isCorrect = (Number.isInteger(idxA) && Number.isInteger(idxB) &&
                                         idxA !== idxB && idxA >= 0 && idxA < nums.length &&
                                         idxB >= 0 && idxB < nums.length &&
                                         (nums[idxA] + nums[idxB] === target));
                        }
                    }

                    if (!isCorrect) {
                        isCorrect = (function deepEq(a, b) {
                            if (a === b) return true;
                            if (typeof a !== typeof b) return false;
                            if (a === null || b === null) return a === b;
                            if (typeof a !== 'object') return a === b;
                            if (Array.isArray(a)) {
                                if (!Array.isArray(b) || a.length !== b.length) return false;
                                for (let j = 0; j < a.length; j++) {
                                    if (!deepEq(a[j], b[j])) return false;
                                }
                                return true;
                            }
                            const kA = Object.keys(a), kB = Object.keys(b);
                            if (kA.length !== kB.length) return false;
                            for (let k of kA) {
                                if (!kB.includes(k) || !deepEq(a[k], b[k])) return false;
                            }
                            return true;
                        })(actual, tc.expected);
                    }

                    if (isCorrect) {
                        passedCount++;
                    } else if (!failedCase) {
                        failedCase = {
                            index: i + 1,
                            input: JSON.stringify(tc.args),
                            expected: JSON.stringify(tc.expected),
                            actual: JSON.stringify(actual)
                        };
                    }
                }

                const elapsed = Math.round(performance.now() - start);
                self.postMessage({
                    status: passedCount === totalCount ? 'ACCEPTED' : 'WRONG_ANSWER',
                    passedCount: passedCount,
                    totalCount: totalCount,
                    failedCase: failedCase,
                    logs: logs,
                    timeMs: elapsed
                });
            };
        `;
    },

    /**
     * Execute JavaScript code in an isolated Web Worker with strict TLE timeout
     */
    async runJavaScript(code, functionName, testCases, isCustom = false, customInput = '', questionId = '') {
        return new Promise((resolve) => {
            const workerBlob = new Blob([this.buildJsWorkerScript()], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(workerBlob);
            const worker = new Worker(workerUrl);

            let hasFinished = false;
            const timeoutDuration = 2500; // 2.5 seconds max execution time

            const timer = setTimeout(() => {
                if (!hasFinished) {
                    hasFinished = true;
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                    resolve({
                        status: 'TLE',
                        error: '⏱️ Time Limit Exceeded (2.5s). Solution did not terminate in time. Check for infinite loops.',
                        passedCount: 0,
                        totalCount: testCases ? testCases.length : 0,
                        timeMs: 2500,
                        logs: []
                    });
                }
            }, timeoutDuration);

            worker.onmessage = function(e) {
                if (!hasFinished) {
                    hasFinished = true;
                    clearTimeout(timer);
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                    resolve(e.data);
                }
            };

            worker.onerror = function(err) {
                if (!hasFinished) {
                    hasFinished = true;
                    clearTimeout(timer);
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                    resolve({
                        status: 'RUNTIME_ERROR',
                        error: 'Worker execution error: ' + err.message,
                        passedCount: 0,
                        totalCount: testCases ? testCases.length : 0,
                        timeMs: 0,
                        logs: []
                    });
                }
            };

            worker.postMessage({
                code,
                functionName,
                testCases,
                isCustom,
                customInput,
                questionId
            });
        });
    },

    /**
     * Initialize Pyodide WebAssembly Python 3 engine
     */
    async initPyodide() {
        if (this.pyodideInstance) return this.pyodideInstance;
        if (this._pyodideInitPromise) return this._pyodideInitPromise;

        this.isPyodideLoading = true;
        this._pyodideInitPromise = (async () => {
            try {
                if (typeof loadPyodide === 'undefined') {
                    if (typeof document !== 'undefined') {
                        const existing = document.querySelector('script[src*="pyodide.js"]');
                        if (existing) {
                            await new Promise((resolve, reject) => {
                                existing.addEventListener('load', resolve);
                                existing.addEventListener('error', () => reject(new Error('Failed to load Pyodide script')));
                            });
                        } else {
                            await new Promise((resolve, reject) => {
                                const script = document.createElement('script');
                                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
                                script.async = true;
                                script.onload = resolve;
                                script.onerror = () => reject(new Error('Failed to load Pyodide from CDN'));
                                document.head.appendChild(script);
                            });
                        }
                    } else {
                        throw new Error('DOM document not available for Pyodide script injection');
                    }
                }

                if (typeof loadPyodide !== 'function') {
                    throw new Error('loadPyodide function is not defined');
                }

                this.pyodideInstance = await loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
                });
                this.isPyodideLoading = false;
                return this.pyodideInstance;
            } catch (e) {
                this.isPyodideLoading = false;
                this._pyodideInitPromise = null;
                console.warn('[CodeRunner] Pyodide load failed:', e);
                throw e;
            }
        })();

        return this._pyodideInitPromise;
    },

    /**
     * Execute Python code using Pyodide WebAssembly
     */
    async runPython(code, functionName, testCases, isCustom = false, customInput = '', questionId = '') {
        try {
            const pyodide = await this.initPyodide();
            const logs = [];

            // Setup stdout capture in Python
            await pyodide.runPythonAsync(`
import sys
import io
import json

class PyCapture(io.StringIO):
    def __init__(self):
        super().__init__()
        self.captured_logs = []
    def write(self, s):
        if s and s != '\\n':
            self.captured_logs.append(s)
        super().write(s)

sys_capture = PyCapture()
sys.stdout = sys_capture
            `);

            // Execute user code
            await pyodide.runPythonAsync(code);

            // Handle custom input
            if (isCustom) {
                const start = performance.now();
                let pyCustomRes = await pyodide.runPythonAsync(`
try:
    fn = None
    if 'Solution' in globals() and isinstance(globals()['Solution'], type):
        _inst = globals()['Solution']()
        fn = getattr(_inst, '${functionName}', None) or getattr(_inst, '${functionName.toLowerCase()}', None)
    if not fn:
        fn = globals().get('${functionName}') or globals().get('${functionName.toLowerCase()}')
    if not fn:
        for k, v in globals().items():
            if callable(v) and not k.startswith('_'):
                fn = v
                break
    if fn:
        args = json.loads('[${customInput.replace(/'/g, "\\'") || ''}]')
        res = fn(*args)
        json.dumps(res)
    else:
        "FUNC_NOT_FOUND"
except Exception as e:
    "ERROR: " + str(e)
                `);
                const elapsed = Math.round(performance.now() - start);
                const pyLogs = pyodide.runPython(`sys_capture.captured_logs.copy()`).toJs();

                if (pyCustomRes === 'FUNC_NOT_FOUND') {
                    return { status: 'COMPILE_ERROR', error: `Function "${functionName}" not found in Python script.`, logs: pyLogs, timeMs: elapsed };
                }
                if (typeof pyCustomRes === 'string' && pyCustomRes.startsWith('ERROR: ')) {
                    return { status: 'RUNTIME_ERROR', error: pyCustomRes, logs: pyLogs, timeMs: elapsed };
                }

                return { status: 'CUSTOM_SUCCESS', result: JSON.parse(pyCustomRes), logs: pyLogs, timeMs: elapsed };
            }

            // Evaluate test cases
            let passedCount = 0;
            let failedCase = null;
            const start = performance.now();

            for (let i = 0; i < testCases.length; i++) {
                const tc = testCases[i];
                const tcArgsJson = JSON.stringify(tc.args || []);
                const tcExpectedJson = JSON.stringify(tc.expected);

                const pyTestResult = await pyodide.runPythonAsync(`
try:
    fn = None
    if 'Solution' in globals() and isinstance(globals()['Solution'], type):
        _inst = globals()['Solution']()
        fn = getattr(_inst, '${functionName}', None) or getattr(_inst, '${functionName.toLowerCase()}', None)
    if not fn:
        fn = globals().get('${functionName}') or globals().get('${functionName.toLowerCase()}')
    if not fn:
        for k, v in globals().items():
            if callable(v) and not k.startswith('_'):
                fn = v
                break
    args = json.loads('''${tcArgsJson}''')
    res = fn(*args)
    json.dumps({ 'actual': res })
except Exception as e:
    json.dumps({ 'error': str(e) })
                `);

                const parsed = JSON.parse(pyTestResult);
                if (parsed.error) {
                    const elapsed = Math.round(performance.now() - start);
                    return {
                        status: 'RUNTIME_ERROR',
                        error: `Runtime Error on test case ${i + 1}: ${parsed.error}`,
                        passedCount,
                        totalCount: testCases.length,
                        timeMs: elapsed,
                        logs: []
                    };
                }

                const validation = this.validateAnswer(questionId, functionName, parsed.actual, tc.expected, tc);

                if (validation.isValid) {
                    passedCount++;
                } else if (!failedCase) {
                    failedCase = {
                        index: i + 1,
                        input: tcArgsJson,
                        expected: tcExpectedJson,
                        actual: JSON.stringify(parsed.actual),
                        reason: validation.reason || ''
                    };
                }
            }

            const elapsed = Math.round(performance.now() - start);
            const pyLogs = pyodide.runPython(`sys_capture.captured_logs.copy()`).toJs();

            return {
                status: passedCount === testCases.length ? 'ACCEPTED' : 'WRONG_ANSWER',
                passedCount,
                totalCount: testCases.length,
                failedCase,
                logs: pyLogs,
                timeMs: elapsed
            };

        } catch (err) {
            return {
                status: 'COMPILE_ERROR',
                error: `Python Syntax/Execution Error: ${err.message}`,
                passedCount: 0,
                totalCount: testCases ? testCases.length : 0,
                logs: [],
                timeMs: 0
            };
        }
    },

    formatCppArg(val) {
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'string') return JSON.stringify(val);
        if (Array.isArray(val)) {
            return '{' + val.map(v => this.formatCppArg(v)).join(', ') + '}';
        }
        return String(val);
    },

    getCppType(val) {
        if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
        if (typeof val === 'boolean') return 'bool';
        if (typeof val === 'string') return 'std::string';
        if (Array.isArray(val)) {
            const inner = val.length > 0 ? this.getCppType(val[0]) : 'int';
            return 'std::vector<' + inner + '>';
        }
        return 'auto';
    },

    buildCppHarness(code, functionName, testCases, isCustom, customInput) {
        if (/\bint\s+main\s*\(/.test(code)) {
            return { fullSource: code, stdin: isCustom ? customInput : '' };
        }

        const includes = `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <cmath>
#include <climits>
using namespace std;
`;

        const helpers = `
template<typename T>
void __printVal(const T& val) { std::cout << val; }
template<typename T>
void __printVal(const std::vector<T>& vec) {
    std::cout << "[";
    for(size_t i = 0; i < vec.size(); ++i) {
        if(i > 0) std::cout << ",";
        __printVal(vec[i]);
    }
    std::cout << "]";
}
inline void __printVal(bool b) { std::cout << (b ? "true" : "false"); }
`;

        let mainBody = '';
        if (isCustom) {
            let args = [];
            if (customInput && customInput.trim()) {
                const trimmed = customInput.trim();
                try {
                    args = JSON.parse('[' + trimmed + ']');
                } catch (e) {
                    const numTokens = trimmed.split(/[\s,]+/).map(t => Number(t)).filter(n => !isNaN(n));
                    if (numTokens.length > 0) {
                        if (testCases && testCases[0] && Array.isArray(testCases[0].args?.[0])) {
                            if (numTokens.length > 1 && numTokens[0] === numTokens.length - 1) {
                                args = [numTokens.slice(1)];
                            } else {
                                args = [numTokens];
                            }
                        } else if (testCases && testCases[0] && typeof testCases[0].args?.[0] === 'number') {
                            args = [numTokens[0]];
                        } else {
                            args = [trimmed];
                        }
                    } else {
                        args = [trimmed];
                    }
                }
            } else if (testCases && testCases.length > 0) {
                args = testCases[0].args || [];
            }

            mainBody = `
int main() {
    Solution sol;
    ${args.map((arg, aIdx) => `${this.getCppType(arg)} __arg_${aIdx} = ${this.formatCppArg(arg)};`).join('\n    ')}
    std::cout << "\\n__CASE_START__0__\\n";
    __printVal(sol.${functionName}(${args.map((_, aIdx) => `__arg_${aIdx}`).join(', ')}));
    std::cout << "\\n__CASE_END__0__\\n";
    return 0;
}
`;
        } else {
            const casesCode = (testCases || []).map((tc, idx) => {
                const args = tc.args || [];
                return `
    {
        ${args.map((arg, aIdx) => `${this.getCppType(arg)} __arg_${aIdx} = ${this.formatCppArg(arg)};`).join('\n        ')}
        std::cout << "\\n__CASE_START__${idx}__\\n";
        __printVal(sol.${functionName}(${args.map((_, aIdx) => `__arg_${aIdx}`).join(', ')}));
        std::cout << "\\n__CASE_END__${idx}__\\n";
    }
`;
            }).join('');

            mainBody = `
int main() {
    Solution sol;
    ${casesCode}
    return 0;
}
`;
        }

        return {
            fullSource: `${includes}\n${helpers}\n${code}\n${mainBody}`,
            stdin: ''
        };
    },

    async callJudgeEndpoint(sourceCode, stdin = '') {
        const payload = {
            source_code: sourceCode,
            language_id: 105, // C++ (GCC 14.1.0 with C++17 support)
            stdin: stdin || undefined,
            cpu_time_limit: 2.5,
            memory_limit: 256000
        };

        const toB64 = (str) => {
            if (!str) return '';
            if (typeof Buffer !== 'undefined') return Buffer.from(str).toString('base64');
            return btoa(unescape(encodeURIComponent(str)));
        };

        const fromB64 = (str) => {
            if (!str) return null;
            if (typeof Buffer !== 'undefined') return Buffer.from(str, 'base64').toString('utf8');
            try { return decodeURIComponent(escape(atob(str))); } catch (e) { return atob(str); }
        };

        // Attempt 1: Call secure backend proxy (/api/judge)
        try {
            const judgeUrl = (typeof window !== 'undefined' && window.location && window.location.origin)
                ? `${window.location.origin}/api/judge`
                : 'http://localhost:3000/api/judge';

            const res = await fetch(judgeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                return data;
            }
        } catch (backendErr) {
            console.warn('Backend /api/judge proxy unreachable, trying direct sandbox...', backendErr);
        }

        // Attempt 2: Direct public Judge0 CE sandbox (CORS enabled, public endpoint)
        const base64Payload = {
            source_code: toB64(sourceCode),
            language_id: 105,
            stdin: stdin ? toB64(stdin) : undefined,
            cpu_time_limit: 2.5,
            memory_limit: 256000
        };

        const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(base64Payload)
        });
        const raw = await res.json();

        return {
            status: raw.status || { id: -1, description: 'Unknown' },
            time: raw.time || '0.000',
            memory: raw.memory || 0,
            stdout: fromB64(raw.stdout),
            stderr: fromB64(raw.stderr),
            compile_output: fromB64(raw.compile_output)
        };
    },

    async runCpp(code, functionName, testCases, isCustom = false, customInput = '', questionId = '') {
        try {
            const harness = this.buildCppHarness(code, functionName, testCases, isCustom, customInput);
            const data = await this.callJudgeEndpoint(harness.fullSource, harness.stdin);

            const timeMs = Math.round(parseFloat(data.time || 0) * 1000) || 1;
            const memoryMb = data.memory ? (data.memory / 1024).toFixed(1) : null;

            // 1. Compilation Error
            if ((data.status && data.status.id === 6) || (data.compile_output && data.compile_output.trim())) {
                const compMsg = (data.compile_output || '').trim() || (data.stderr || '').trim() || 'Compilation failed';
                return {
                    status: 'COMPILE_ERROR',
                    error: compMsg,
                    compiler: 'g++ (GCC 14.1.0) C++17',
                    passedCount: 0,
                    totalCount: testCases ? testCases.length : 0,
                    logs: [],
                    timeMs: 0
                };
            }

            // 2. Time Limit Exceeded
            if (data.status && (data.status.id === 5 || /time limit/i.test(data.status.description))) {
                return {
                    status: 'TLE',
                    error: '⏱️ Time Limit Exceeded: Execution took longer than 2.5 seconds. Check for infinite loops or non-terminating recursion.',
                    compiler: 'g++ (GCC 14.1.0) C++17',
                    passedCount: 0,
                    totalCount: testCases ? testCases.length : 0,
                    logs: [],
                    timeMs: timeMs
                };
            }

            // 3. Memory Limit Exceeded
            if (data.status && (data.status.id === 12 || /memory limit/i.test(data.status.description))) {
                return {
                    status: 'MLE',
                    error: '💥 Memory Limit Exceeded: Process exceeded configured memory limit (256 MB).',
                    compiler: 'g++ (GCC 14.1.0) C++17',
                    passedCount: 0,
                    totalCount: testCases ? testCases.length : 0,
                    logs: [],
                    timeMs: timeMs
                };
            }

            // 4. Runtime Error
            if (data.status && (data.status.id >= 7 || /runtime error/i.test(data.status.description) || (data.stderr && data.stderr.trim()))) {
                const rtMsg = (data.stderr ? data.stderr.trim() : '') || (data.status ? data.status.description : 'Runtime Error');
                return {
                    status: 'RUNTIME_ERROR',
                    error: `💥 Runtime Error: ${rtMsg}`,
                    compiler: 'g++ (GCC 14.1.0) C++17',
                    passedCount: 0,
                    totalCount: testCases ? testCases.length : 0,
                    logs: [],
                    timeMs: timeMs,
                    memoryMb
                };
            }

            const cleanStdout = (data.stdout || '').replace(/\r\n/g, '\n');
            const collectedLogs = [];

            // 5. Custom Input execution
            if (isCustom) {
                let cleanResult = cleanStdout.trim();
                const m = cleanStdout.match(/__CASE_START__0__\s*\n([\s\S]*?)\n__CASE_END__0__/);
                if (m) {
                    cleanResult = m[1].trim();
                    if (cleanResult.includes('\n')) {
                        const lines = cleanResult.split('\n');
                        cleanResult = lines[lines.length - 1].trim();
                        collectedLogs.push(...lines.slice(0, -1).map(l => l.trim()).filter(Boolean));
                    }
                }
                return {
                    status: 'CUSTOM_SUCCESS',
                    result: cleanResult,
                    compiler: 'g++ (GCC 14.1.0) C++17',
                    input: customInput || (testCases && testCases[0] ? JSON.stringify(testCases[0].args) : ''),
                    logs: collectedLogs,
                    timeMs: timeMs,
                    memoryMb
                };
            }

            // 6. Test Suite evaluation
            let passedCount = 0;
            let failedCase = null;

            for (let i = 0; i < testCases.length; i++) {
                const tc = testCases[i];
                const regex = new RegExp(`__CASE_START__${i}__\\s*\\n([\\s\\S]*?)\\n__CASE_END__${i}__`);
                const match = cleanStdout.match(regex);
                const rawOutput = match ? match[1].trim() : '';

                let actual = rawOutput;
                if (rawOutput.includes('\n')) {
                    const lines = rawOutput.split('\n');
                    actual = lines[lines.length - 1].trim();
                    const userLogs = lines.slice(0, -1).map(l => l.trim()).filter(Boolean);
                    if (userLogs.length > 0) collectedLogs.push(...userLogs);
                }

                const validation = this.validateAnswer(questionId, functionName, actual, tc.expected, tc);

                if (validation.isValid) {
                    passedCount++;
                } else if (!failedCase) {
                    failedCase = {
                        index: i + 1,
                        input: JSON.stringify(tc.args),
                        expected: JSON.stringify(tc.expected),
                        actual: actual,
                        reason: validation.reason || ''
                    };
                }
            }

            return {
                status: passedCount === testCases.length ? 'ACCEPTED' : 'WRONG_ANSWER',
                passedCount,
                totalCount: testCases.length,
                failedCase,
                compiler: 'g++ (GCC 14.1.0) C++17',
                logs: collectedLogs,
                timeMs: timeMs,
                memoryMb
            };

        } catch (err) {
            return {
                status: 'COMPILE_ERROR',
                error: `GCC Backend Connection Error: ${err.message}`,
                passedCount: 0,
                totalCount: testCases ? testCases.length : 0,
                logs: [],
                timeMs: 0
            };
        }
    },

    /**
     * Dispatch code execution according to language
     */
    async executeCode({ language, code, functionName, testCases, isCustom = false, customInput = '', questionId = '' }) {
        if (language === 'javascript') {
            return await this.runJavaScript(code, functionName, testCases, isCustom, customInput, questionId);
        } else if (language === 'python') {
            return await this.runPython(code, functionName, testCases, isCustom, customInput, questionId);
        } else if (language === 'cpp') {
            return await this.runCpp(code, functionName, testCases, isCustom, customInput, questionId);
        } else {
            return {
                status: 'ERROR',
                error: `Unsupported language: ${language}`,
                passedCount: 0,
                totalCount: testCases ? testCases.length : 0,
                timeMs: 0,
                logs: []
            };
        }
    }
};

if (typeof window !== 'undefined') {
    window.CodeRunner = CodeRunner;
}
if (typeof module !== 'undefined') {
    module.exports = { CodeRunner };
}
