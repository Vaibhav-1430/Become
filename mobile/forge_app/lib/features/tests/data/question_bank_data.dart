import '../domain/models/test_question.dart';

/// Authentic Question Bank for FORGE Test Engine.
/// Sourced directly from verified Study OS curriculum & test-questions.js specifications.
final List<TestQuestion> kForgeQuestionBank = [
  // ===========================================================================
  // DSA CODING PROBLEMS (Strict Striver A2Z Progression)
  // ===========================================================================
  const TestQuestion(
    id: 'dsa_count_digits',
    title: 'Count Digits',
    description:
        'Given an integer n, return the number of digits in n that evenly divide n (i.e. n % digit == 0). A digit divides n if leaves remainder 0.\n\nExample:\nInput: n = 156\nOutput: 3 (1, 5 is not dividing, 6 divides? Here count digits: 156 has 3 total digits)',
    category: 'dsa',
    topic: 'Basic Maths',
    topicId: 'dsa_basics',
    difficulty: 'Easy',
    type: QuestionType.coding,
    sectionIndex: 0,
    constraints: ['1 <= n <= 10^9'],
    functionName: 'countDigits',
    starterCodeCpp: '''#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countDigits(int n) {
        // Write your solution here
        return 0;
    }
};''',
    sampleCases: [
      TestCase(
        input: 'n = 156',
        output: '3',
        explanation: '156 contains 3 digits.',
        args: [156],
        expected: 3,
      ),
      TestCase(
        input: 'n = 7',
        output: '1',
        explanation: '7 is a single digit integer.',
        args: [7],
        expected: 1,
      ),
    ],
    hiddenCases: [
      TestCase(args: [987654], expected: 6),
      TestCase(args: [1000000], expected: 7),
      TestCase(args: [42], expected: 2),
      TestCase(args: [1000000000], expected: 10),
    ],
    explanation:
        'Repeatedly divide n by 10 or calculate floor(log10(n)) + 1. Time complexity: O(log10(N)), Space: O(1).',
    referenceSolutionCpp: '''class Solution {
public:
    int countDigits(int n) {
        int count = 0;
        while (n > 0) {
            count++;
            n /= 10;
        }
        return count;
    }
};''',
  ),

  const TestQuestion(
    id: 'dsa_palindrome_number',
    title: 'Palindrome Number',
    description:
        'Given an integer x, return true if x is a palindrome, and false otherwise.\nAn integer is a palindrome when it reads the same forward and backward.\n\nExample 1:\nInput: x = 121 -> Output: true\n\nExample 2:\nInput: x = -121 -> Output: false',
    category: 'dsa',
    topic: 'Basic Maths',
    topicId: 'dsa_basics',
    difficulty: 'Easy',
    type: QuestionType.coding,
    sectionIndex: 0,
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    functionName: 'isPalindrome',
    starterCodeCpp: '''#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPalindrome(int x) {
        // Write your solution here
        return false;
    }
};''',
    sampleCases: [
      TestCase(
        input: 'x = 121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and right to left.',
        args: [121],
        expected: true,
      ),
      TestCase(
        input: 'x = -121',
        output: 'false',
        explanation: 'From left to right it is -121. From right to left it is 121-.',
        args: [-121],
        expected: false,
      ),
    ],
    hiddenCases: [
      TestCase(args: [10], expected: false),
      TestCase(args: [12321], expected: true),
      TestCase(args: [0], expected: true),
      TestCase(args: [1221], expected: true),
    ],
    explanation:
        'Negative numbers are not palindromes. Reverse the number arithmetically and compare. Time: O(log10(X)), Space: O(1).',
    referenceSolutionCpp: '''class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) return false;
        long long orig = x, rev = 0;
        while (x > 0) {
            rev = rev * 10 + (x % 10);
            x /= 10;
        }
        return orig == rev;
    }
};''',
  ),

  const TestQuestion(
    id: 'dsa_reverse_array',
    title: 'Reverse an Array',
    description:
        'Given an array of integers nums, reverse the elements in-place and return the reversed array.\n\nExample:\nInput: nums = [1, 2, 3, 4, 5]\nOutput: [5, 4, 3, 2, 1]',
    category: 'dsa',
    topic: 'Basic Recursion & Arrays',
    topicId: 'dsa_basics',
    difficulty: 'Easy',
    type: QuestionType.coding,
    sectionIndex: 0,
    constraints: ['1 <= nums.length <= 10^4', '-10^5 <= nums[i] <= 10^5'],
    functionName: 'reverseArray',
    starterCodeCpp: '''#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reverseArray(vector<int>& nums) {
        // Write your solution here
        return nums;
    }
};''',
    sampleCases: [
      TestCase(
        input: 'nums = [1, 2, 3, 4, 5]',
        output: '[5, 4, 3, 2, 1]',
        args: [
          [1, 2, 3, 4, 5]
        ],
        expected: [5, 4, 3, 2, 1],
      ),
      TestCase(
        input: 'nums = [42]',
        output: '[42]',
        args: [
          [42]
        ],
        expected: [42],
      ),
    ],
    hiddenCases: [
      TestCase(
        args: [
          [10, 20, 30]
        ],
        expected: [30, 20, 10],
      ),
      TestCase(
        args: [
          [1, 2]
        ],
        expected: [2, 1],
      ),
    ],
    explanation: 'Swap elements from both ends using two pointers moving towards the center.',
    referenceSolutionCpp: '''class Solution {
public:
    vector<int> reverseArray(vector<int>& nums) {
        int l = 0, r = nums.size() - 1;
        while (l < r) {
            swap(nums[l++], nums[r--]);
        }
        return nums;
    }
};''',
  ),

  const TestQuestion(
    id: 'dsa_two_sum',
    title: 'Two Sum',
    description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume each input has exactly one solution, and you may not use the same element twice.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9 -> Output: [0, 1]\n\nExample 2:\nInput: nums = [3,2,4], target = 6 -> Output: [1, 2]',
    category: 'dsa',
    topic: 'Arrays (Easy & Medium)',
    topicId: 'dsa_arrays',
    difficulty: 'Medium',
    type: QuestionType.coding,
    sectionIndex: 2,
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    functionName: 'twoSum',
    starterCodeCpp: '''#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};''',
    sampleCases: [
      TestCase(
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] == 9, so return [0, 1].',
        args: [
          [2, 7, 11, 15],
          9
        ],
        expected: [0, 1],
      ),
      TestCase(
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'nums[1] + nums[2] == 6, so return [1, 2].',
        args: [
          [3, 2, 4],
          6
        ],
        expected: [1, 2],
      ),
    ],
    hiddenCases: [
      TestCase(
        args: [
          [3, 3],
          6
        ],
        expected: [0, 1],
      ),
      TestCase(
        args: [
          [-1, -2, -3, -4, -5],
          -8
        ],
        expected: [2, 4],
      ),
    ],
    explanation: 'Use an unordered hash map storing value -> index. Lookup complement in O(1) time.',
    referenceSolutionCpp: '''class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (mp.count(complement)) {
                return {mp[complement], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};''',
  ),

  const TestQuestion(
    id: 'dsa_binary_search',
    title: 'Binary Search',
    description:
        'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.\nYou must write an algorithm with O(log n) runtime complexity.\n\nExample:\nInput: nums = [-1,0,3,5,9,12], target = 9 -> Output: 4',
    category: 'dsa',
    topic: 'Binary Search',
    topicId: 'dsa_binary_search',
    difficulty: 'Easy',
    type: QuestionType.coding,
    sectionIndex: 3,
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All elements in nums are unique.'],
    functionName: 'search',
    starterCodeCpp: '''#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your solution here
        return -1;
    }
};''',
    sampleCases: [
      TestCase(
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4',
        args: [
          [-1, 0, 3, 5, 9, 12],
          9
        ],
        expected: 4,
      ),
      TestCase(
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1',
        args: [
          [-1, 0, 3, 5, 9, 12],
          2
        ],
        expected: -1,
      ),
    ],
    hiddenCases: [
      TestCase(
        args: [
          [5],
          5
        ],
        expected: 0,
      ),
      TestCase(
        args: [
          [2, 5],
          2
        ],
        expected: 0,
      ),
      TestCase(
        args: [
          [2, 5],
          5
        ],
        expected: 1,
      ),
    ],
    explanation: 'Divide search space in half with low <= high bounds checking mid.',
    referenceSolutionCpp: '''class Solution {
public:
    int search(vector<int>& nums, int target) {
        int low = 0, high = nums.size() - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }
};''',
  ),

  // ===========================================================================
  // DSA MCQS
  // ===========================================================================
  const TestQuestion(
    id: 'dsa_mcq_array_access',
    title: 'Array Random Access Complexity',
    description: 'What is the time complexity of accessing an element in an array by its index?',
    category: 'dsa',
    topic: 'Basic Maths',
    topicId: 'dsa_basics',
    difficulty: 'Easy',
    type: QuestionType.mcq,
    sectionIndex: 0,
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correctOptionIndex: 0,
    explanation:
        'Arrays occupy contiguous memory locations. Indexing directly calculates memory address (base + index * size) in O(1) constant time.',
  ),

  const TestQuestion(
    id: 'dsa_mcq_bs_complexity',
    title: 'Binary Search Worst Case',
    description: 'What is the worst-case time complexity of Binary Search on a sorted array of size N?',
    category: 'dsa',
    topic: 'Binary Search',
    topicId: 'dsa_binary_search',
    difficulty: 'Easy',
    type: QuestionType.mcq,
    sectionIndex: 3,
    options: ['O(1)', 'O(N)', 'O(log2 N)', 'O(N log N)'],
    correctOptionIndex: 2,
    explanation:
        'Binary search halves the search space at each iteration, resulting in O(log2 N) worst-case time complexity.',
  ),

  const TestQuestion(
    id: 'dsa_mcq_two_pointer',
    title: 'Two Sum Sorted Array Optimal Space',
    description:
        'Given a sorted array, what is the most optimal auxiliary space complexity to find two numbers that sum to target?',
    category: 'dsa',
    topic: 'Arrays (Easy & Medium)',
    topicId: 'dsa_arrays',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    sectionIndex: 2,
    options: ['O(N)', 'O(log N)', 'O(1)', 'O(N^2)'],
    correctOptionIndex: 2,
    explanation:
        'Because the array is already sorted, a two-pointer approach from both ends finds the target in O(N) time using O(1) auxiliary space without hash tables.',
  ),

  // ===========================================================================
  // FULL-STACK DEVELOPMENT MCQS (Strictly mapped to kDevCurriculumTopics)
  // ===========================================================================
  const TestQuestion(
    id: 'dev_mcq_html_semantics',
    title: 'HTML5 Semantic Structure',
    description: 'Which of the following HTML5 elements should be used to enclose independent, self-contained content?',
    category: 'development',
    topic: 'HTML',
    topicId: 'html',
    difficulty: 'Easy',
    type: QuestionType.mcq,
    options: ['<section>', '<article>', '<div>', '<aside>'],
    correctOptionIndex: 1,
    explanation:
        '<article> represents a complete, self-contained composition in a document, page, application, or site that is independently distributable or reusable.',
  ),

  const TestQuestion(
    id: 'dev_mcq_css_flexbox',
    title: 'CSS Flexbox Main Axis Alignment',
    description:
        'In CSS Flexible Box Layout with flex-direction: row, which property aligns items along the horizontal main axis?',
    category: 'development',
    topic: 'CSS',
    topicId: 'css',
    difficulty: 'Easy',
    type: QuestionType.mcq,
    options: ['align-items', 'justify-content', 'align-content', 'place-items'],
    correctOptionIndex: 1,
    explanation:
        'justify-content aligns flex items along the main axis. For row direction, the main axis is horizontal.',
  ),

  const TestQuestion(
    id: 'dev_mcq_js_closure',
    title: 'JavaScript Closures',
    description: 'What is a closure in JavaScript?',
    category: 'development',
    topic: 'JavaScript',
    topicId: 'javascript',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: [
      'A function bundled together with references to its surrounding lexical environment',
      'A method to terminate an asynchronous Promise chain',
      'A function that only executes inside a try/catch block',
      'An encrypted callback passed to Web Workers'
    ],
    correctOptionIndex: 0,
    explanation:
        'A closure is the combination of a function bundled together with references to its lexical environment, allowing access to an outer function scope from an inner function.',
  ),

  const TestQuestion(
    id: 'dev_mcq_git_rebase',
    title: 'Git Rebase vs Merge',
    description: 'What is the primary architectural difference between "git merge" and "git rebase"?',
    category: 'development',
    topic: 'Git & GitHub',
    topicId: 'git_github',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: [
      'Merge creates a new commit preserving history, whereas rebase rewrites commit history onto a new base',
      'Merge is only for remote repositories, while rebase is purely local',
      'Rebase always deletes all branches except main',
      'Merge discards uncommitted work, while rebase stashes it'
    ],
    correctOptionIndex: 0,
    explanation:
        'Git merge preserves branch topology with a merge commit. Git rebase applies commits one by one on top of the target base, creating a linear history.',
  ),

  const TestQuestion(
    id: 'dev_mcq_react_hooks',
    title: 'React Hooks Dependency Rule',
    description: 'Why must React Hooks only be called at the top level of function components?',
    category: 'development',
    topic: 'React',
    topicId: 'react',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: [
      'To ensure hooks are called in the exact same order on every render for state persistence',
      'Because JavaScript V8 cannot parse closures inside conditional blocks',
      'To prevent the JSX compiler from infinite looping',
      'Hooks require window object binding which is only available at top level'
    ],
    correctOptionIndex: 0,
    explanation:
        'React relies on the call order of Hooks between renders to match state variables to their corresponding useState/useEffect internal cells.',
  ),

  const TestQuestion(
    id: 'dev_mcq_ts_generics',
    title: 'TypeScript Generics Purpose',
    description: 'What is the primary benefit of using Generics in TypeScript?',
    category: 'development',
    topic: 'TypeScript',
    topicId: 'typescript',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: [
      'To create reusable components that can work over a variety of types while preserving type safety',
      'To convert TypeScript code directly to WebAssembly at runtime',
      'To enforce private variable encapsulation without classes',
      'To automatically polyfill modern ES APIs for legacy browsers'
    ],
    correctOptionIndex: 0,
    explanation:
        'Generics allow functions, interfaces, and classes to define type placeholders that enforce strict compile-time types without losing type information through "any".',
  ),

  const TestQuestion(
    id: 'dev_mcq_nextjs_rendering',
    title: 'Next.js Server Side Rendering (SSR)',
    description:
        'In Next.js, what is the primary behavior of Server-Side Rendering (SSR) compared to Static Site Generation (SSG)?',
    category: 'development',
    topic: 'Next.js',
    topicId: 'nextjs',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: [
      'SSR generates HTML on each client request, whereas SSG generates HTML at build time',
      'SSR only runs on the user browser, whereas SSG runs on Cloudflare Workers',
      'SSR requires Redis for caching, while SSG requires PostgreSQL',
      'SSR is disabled in production builds'
    ],
    correctOptionIndex: 0,
    explanation:
        'Server-Side Rendering computes the page HTML on demand for each incoming request, making it ideal for dynamic user-specific data.',
  ),

  const TestQuestion(
    id: 'dev_mcq_nodejs_event_loop',
    title: 'Node.js Event Loop Architecture',
    description: 'Which phase of the Node.js event loop executes timers scheduled by setTimeout() and setInterval()?',
    category: 'development',
    topic: 'Node.js',
    topicId: 'nodejs',
    difficulty: 'Hard',
    type: QuestionType.mcq,
    options: ['Timers phase', 'Poll phase', 'Check phase', 'Close callbacks phase'],
    correctOptionIndex: 0,
    explanation:
        'The Timers phase of the event loop executes callbacks scheduled by setTimeout() and setInterval().',
  ),

  // ===========================================================================
  // CORE CS MCQS (DBMS, OS, CN)
  // ===========================================================================
  const TestQuestion(
    id: 'core_mcq_dbms_acid',
    title: 'DBMS ACID Isolation',
    description:
        'Which ACID property ensures that the concurrent execution of transactions results in a system state that would be obtained if transactions were executed sequentially?',
    category: 'core_cs',
    topic: 'DBMS',
    topicId: 'dbms',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctOptionIndex: 2,
    explanation:
        'Isolation ensures that transactions execute independently and concurrent operations appear serialized without dirty reads or non-repeatable reads.',
  ),

  const TestQuestion(
    id: 'core_mcq_os_deadlock',
    title: 'OS Coffman Deadlock Conditions',
    description: 'Which of the following is NOT one of Coffman’s four necessary conditions for a deadlock to occur?',
    category: 'core_cs',
    topic: 'Operating Systems',
    topicId: 'os',
    difficulty: 'Hard',
    type: QuestionType.mcq,
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'Preemption Allowed',
      'Circular Wait'
    ],
    correctOptionIndex: 2,
    explanation:
        'The condition is "No Preemption" (resources cannot be forcibly taken from a process holding them), not "Preemption Allowed".',
  ),

  const TestQuestion(
    id: 'core_mcq_cn_tcp',
    title: 'Computer Networks TCP Handshake',
    description: 'What sequence of flags is transmitted during a standard TCP 3-way connection handshake?',
    category: 'core_cs',
    topic: 'Computer Networks',
    topicId: 'cn',
    difficulty: 'Medium',
    type: QuestionType.mcq,
    options: ['SYN -> SYN-ACK -> ACK', 'ACK -> SYN -> ACK', 'FIN -> ACK -> FIN-ACK', 'SYN -> ACK -> RST'],
    correctOptionIndex: 0,
    explanation:
        'TCP connection establishment uses a 3-way handshake: Client sends SYN, Server replies with SYN-ACK, Client sends ACK.',
  ),
];
