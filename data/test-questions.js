/**
 * BOSS Study OS — Structured Weekly Test Question Bank
 * Strictly categorized by Subject, Topic ID, and Section Index.
 * Includes complete test cases (sample + hidden) for automated code evaluation.
 */

const TEST_QUESTION_BANK = {
    // ------------------------------------------------------------------------
    // DSA CODING QUESTIONS (Striver A2Z Progression)
    // ------------------------------------------------------------------------
    dsa: [
        // --- Section 0: Learn the Basics ---
        {
            id: 'dsa_count_digits',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 0,
            topicId: 'dsa_basics',
            topic: 'Basic Maths',
            difficulty: 'Easy',
            title: 'Count Digits',
            striverId: '367',
            description: `Given an integer <code>n</code>, return the number of digits in <code>n</code>.<br><br><b>Example:</b><br>Input: <code>n = 156</code><br>Output: <code>3</code>`,
            constraints: ['1 &le; n &le; 10<sup>9</sup>'],
            functionName: 'countDigits',
            starterCode: {
                javascript: `function countDigits(n) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def countDigits(self, n: int) -> int:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countDigits(int n) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'n = 156', output: '3', explanation: '156 has 3 digits: 1, 5, 6.', args: [156], expected: 3 },
                { input: 'n = 7', output: '1', explanation: '7 is a single-digit integer.', args: [7], expected: 1 }
            ],
            hiddenCases: [
                { args: [987654], expected: 6 },
                { args: [1000000], expected: 7 },
                { args: [42], expected: 2 },
                { args: [1000000000], expected: 10 }
            ],
            explanation: `Count digits by repeatedly dividing the number by 10 until it becomes 0, or by computing <code>Math.floor(Math.log10(n)) + 1</code>. Time complexity: O(log10(N)), Space complexity: O(1).`,
            referenceSolution: {
                javascript: `function countDigits(n) {\n    let count = 0;\n    while (n > 0) {\n        count++;\n        n = Math.floor(n / 10);\n    }\n    return count;\n}`,
                python: `class Solution:\n    def countDigits(self, n: int) -> int:\n        count = 0\n        while n > 0:\n            count += 1\n            n //= 10\n        return count`,
                cpp: `class Solution {\npublic:\n    int countDigits(int n) {\n        int count = 0;\n        while (n > 0) {\n            count++;\n            n /= 10;\n        }\n        return count;\n    }\n};`
            }
        },
        {
            id: 'dsa_palindrome_number',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 0,
            topicId: 'dsa_basics',
            topic: 'Basic Maths',
            difficulty: 'Easy',
            title: 'Palindrome Number',
            striverId: '374',
            description: `Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a palindrome integer, and <code>false</code> otherwise.<br>An integer is a palindrome when it reads the same backward as forward.`,
            constraints: ['-2<sup>31</sup> &le; x &le; 2<sup>31</sup> - 1'],
            functionName: 'isPalindrome',
            starterCode: {
                javascript: `function isPalindrome(x) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(int x) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.', args: [121], expected: true },
                { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-.', args: [-121], expected: false }
            ],
            hiddenCases: [
                { args: [10], expected: false },
                { args: [12321], expected: true },
                { args: [0], expected: true },
                { args: [1221], expected: true },
                { args: [123456], expected: false }
            ],
            explanation: `Negative numbers cannot be palindromes because of the minus sign. Reverse the digits of positive numbers arithmetically and compare with the original number. Time: O(log10(X)), Space: O(1).`,
            referenceSolution: {
                javascript: `function isPalindrome(x) {\n    if (x < 0) return false;\n    let original = x, reversed = 0;\n    while (x > 0) {\n        reversed = reversed * 10 + (x % 10);\n        x = Math.floor(x / 10);\n    }\n    return original === reversed;\n}`,
                python: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        if x < 0:\n            return False\n        orig, rev = x, 0\n        while x > 0:\n            rev = rev * 10 + (x % 10)\n            x //= 10\n        return orig == rev`,
                cpp: `class Solution {\npublic:\n    bool isPalindrome(int x) {\n        if (x < 0) return false;\n        long long orig = x, rev = 0;\n        while (x > 0) {\n            rev = rev * 10 + (x % 10);\n            x /= 10;\n        }\n        return orig == rev;\n    }\n};`
            }
        },
        {
            id: 'dsa_reverse_array',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 0,
            topicId: 'dsa_basics',
            topic: 'Basic Recursion & Arrays',
            difficulty: 'Easy',
            title: 'Reverse an Array',
            striverId: '342',
            description: `Given an array of integers <code>nums</code>, reverse the elements in-place and return the reversed array.<br><br><b>Example:</b><br>Input: <code>nums = [1, 2, 3, 4, 5]</code><br>Output: <code>[5, 4, 3, 2, 1]</code>`,
            constraints: ['1 &le; nums.length &le; 10<sup>4</sup>', '-10<sup>5</sup> &le; nums[i] &le; 10<sup>5</sup>'],
            functionName: 'reverseArray',
            starterCode: {
                javascript: `function reverseArray(nums) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def reverseArray(self, nums: list) -> list:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> reverseArray(vector<int>& nums) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'nums = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]', explanation: 'Elements reversed in-place.', args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
                { input: 'nums = [10, 20]', output: '[20, 10]', explanation: 'Two elements swapped.', args: [[10, 20]], expected: [20, 10] }
            ],
            hiddenCases: [
                { args: [[1]], expected: [1] },
                { args: [[4, 3, 2, 1]], expected: [1, 2, 3, 4] },
                { args: [[-5, 0, 5, 10]], expected: [10, 5, 0, -5] },
                { args: [[7, 7, 7]], expected: [7, 7, 7] }
            ],
            explanation: `Use two pointers (one at the beginning and one at the end), swap the elements, and increment left / decrement right until pointers cross. Time: O(N), Space: O(1).`,
            referenceSolution: {
                javascript: `function reverseArray(nums) {\n    let left = 0, right = nums.length - 1;\n    while (left < right) {\n        const temp = nums[left];\n        nums[left] = nums[right];\n        nums[right] = temp;\n        left++;\n        right--;\n    }\n    return nums;\n}`,
                python: `class Solution:\n    def reverseArray(self, nums: list) -> list:\n        left, right = 0, len(nums) - 1\n        while left < right:\n            nums[left], nums[right] = nums[right], nums[left]\n            left += 1\n            right -= 1\n        return nums`,
                cpp: `class Solution {\npublic:\n    vector<int> reverseArray(vector<int>& nums) {\n        int l = 0, r = nums.size() - 1;\n        while (l < r) {\n            swap(nums[l++], nums[r--]);\n        }\n        return nums;\n    }\n};`
            }
        },

        // --- Section 1: Learn Important Sorting Techniques ---
        {
            id: 'dsa_selection_sort',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 1,
            topicId: 'dsa_sorting',
            topic: 'Sorting Techniques',
            difficulty: 'Easy',
            title: 'Selection Sort',
            striverId: '947',
            description: `Given an unsorted array of integers <code>nums</code>, sort the array in ascending order using the <b>Selection Sort</b> algorithm and return the sorted array.`,
            constraints: ['1 &le; nums.length &le; 1000', '-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup>'],
            functionName: 'selectionSort',
            starterCode: {
                javascript: `function selectionSort(nums) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def selectionSort(self, nums: list) -> list:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> selectionSort(vector<int>& nums) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'nums = [64, 25, 12, 22, 11]', output: '[11, 12, 22, 25, 64]', explanation: 'Sorted ascending order.', args: [[64, 25, 12, 22, 11]], expected: [11, 12, 22, 25, 64] },
                { input: 'nums = [5, 4, 3, 2, 1]', output: '[1, 2, 3, 4, 5]', explanation: 'Reverse sorted array sorted.', args: [[5, 4, 3, 2, 1]], expected: [1, 2, 3, 4, 5] }
            ],
            hiddenCases: [
                { args: [[1]], expected: [1] },
                { args: [[3, -1, 4, 1, 5, 9, 2]], expected: [-1, 1, 2, 3, 4, 5, 9] },
                { args: [[0, 0, 0]], expected: [0, 0, 0] },
                { args: [[10, -10, 5, -5]], expected: [-10, -5, 5, 10] }
            ],
            explanation: `Selection Sort works by finding the minimum element from the unsorted part and placing it at the beginning of the sorted part. Time: O(N^2), Space: O(1).`,
            referenceSolution: {
                javascript: `function selectionSort(nums) {\n    const n = nums.length;\n    for (let i = 0; i < n - 1; i++) {\n        let minIdx = i;\n        for (let j = i + 1; j < n; j++) {\n            if (nums[j] < nums[minIdx]) minIdx = j;\n        }\n        if (minIdx !== i) {\n            const temp = nums[i];\n            nums[i] = nums[minIdx];\n            nums[minIdx] = temp;\n        }\n    }\n    return nums;\n}`,
                python: `class Solution:\n    def selectionSort(self, nums: list) -> list:\n        n = len(nums)\n        for i in range(n - 1):\n            min_idx = i\n            for j in range(i + 1, n):\n                if nums[j] < nums[min_idx]:\n                    min_idx = j\n            if min_idx != i:\n                nums[i], nums[min_idx] = nums[min_idx], nums[i]\n        return nums`,
                cpp: `class Solution {\npublic:\n    vector<int> selectionSort(vector<int>& nums) {\n        int n = nums.size();\n        for (int i = 0; i < n - 1; i++) {\n            int minIdx = i;\n            for (int j = i + 1; j < n; j++) {\n                if (nums[j] < nums[minIdx]) minIdx = j;\n            }\n            swap(nums[i], nums[minIdx]);\n        }\n        return nums;\n    }\n};`
            }
        },

        // --- Section 2: Solve Problems on Arrays ---
        {
            id: 'dsa_second_largest',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 2,
            topicId: 'dsa_arrays',
            topic: 'Arrays (Easy)',
            difficulty: 'Easy',
            title: 'Second Largest Element',
            striverId: '43',
            description: `Given an array of integers <code>nums</code>, return the second largest distinct element. If no second largest distinct element exists, return <code>-1</code>.`,
            constraints: ['2 &le; nums.length &le; 10<sup>5</sup>', '1 &le; nums[i] &le; 10<sup>5</sup>'],
            functionName: 'secondLargest',
            starterCode: {
                javascript: `function secondLargest(nums) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def secondLargest(self, nums: list) -> int:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int secondLargest(vector<int>& nums) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'nums = [12, 35, 1, 10, 34, 1]', output: '34', explanation: 'Largest is 35, second largest is 34.', args: [[12, 35, 1, 10, 34, 1]], expected: 34 },
                { input: 'nums = [10, 10, 10]', output: '-1', explanation: 'All elements are equal, no second largest distinct element.', args: [[10, 10, 10]], expected: -1 }
            ],
            hiddenCases: [
                { args: [[1, 2]], expected: 1 },
                { args: [[5, 2, 7, 3, 6]], expected: 6 },
                { args: [[100, 200, 300, 400]], expected: 300 },
                { args: [[50, 40, 30, 20, 10]], expected: 40 }
            ],
            explanation: `Maintain two variables: <code>largest</code> and <code>second</code> in a single pass O(N) time without sorting. Whenever a number exceeds <code>largest</code>, shift <code>largest</code> into <code>second</code>. Time: O(N), Space: O(1).`,
            referenceSolution: {
                javascript: `function secondLargest(nums) {\n    let largest = -1, second = -1;\n    for (let x of nums) {\n        if (x > largest) {\n            second = largest;\n            largest = x;\n        } else if (x < largest && x > second) {\n            second = x;\n        }\n    }\n    return second;\n}`,
                python: `class Solution:\n    def secondLargest(self, nums: list) -> int:\n        largest = second = -1\n        for x in nums:\n            if x > largest:\n                second = largest\n                largest = x\n            elif second < x < largest:\n                second = x\n        return second`,
                cpp: `class Solution {\npublic:\n    int secondLargest(vector<int>& nums) {\n        int largest = -1, second = -1;\n        for (int x : nums) {\n            if (x > largest) {\n                second = largest;\n                largest = x;\n            } else if (x < largest && x > second) {\n                second = x;\n            }\n        }\n        return second;\n    }\n};`
            }
        },
        {
            id: 'dsa_two_sum',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 2,
            topicId: 'dsa_arrays',
            topic: 'Arrays (Easy/Medium)',
            difficulty: 'Easy',
            title: 'Two Sum',
            striverId: '37',
            description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.<br>You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
            constraints: ['2 &le; nums.length &le; 10<sup>4</sup>', '-10<sup>9</sup> &le; nums[i] &le; 10<sup>9</sup>', '-10<sup>9</sup> &le; target &le; 10<sup>9</sup>'],
            functionName: 'twoSum',
            starterCode: {
                javascript: `function twoSum(nums, target) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def twoSum(self, nums: list, target: int) -> list:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9, so return [0, 1].', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
                { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: 'nums[1] + nums[2] == 6, so return [1, 2].', args: [[3, 2, 4], 6], expected: [1, 2] }
            ],
            hiddenCases: [
                { args: [[3, 3], 6], expected: [0, 1] },
                { args: [[1, 5, 8, 3], 11], expected: [2, 3] },
                { args: [[-3, 4, 3, 90], 0], expected: [0, 2] },
                { args: [[100, 200, 300, 400], 700], expected: [2, 3] }
            ],
            explanation: `Use a Hash Map to store elements and their indices. For each element, look up if <code>target - nums[i]</code> already exists in the map. Time: O(N), Space: O(N).`,
            referenceSolution: {
                javascript: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) return [map.get(complement), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}`,
                python: `class Solution:\n    def twoSum(self, nums: list, target: int) -> list:\n        seen = {}\n        for i, num in enumerate(nums):\n            comp = target - num\n            if comp in seen:\n                return [seen[comp], i]\n            seen[num] = i\n        return []`,
                cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int comp = target - nums[i];\n            if (seen.count(comp)) return {seen[comp], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`
            }
        },
        {
            id: 'dsa_kadanes_algorithm',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 2,
            topicId: 'dsa_arrays',
            topic: 'Arrays (Medium)',
            difficulty: 'Medium',
            title: "Maximum Subarray Sum (Kadane's Algorithm)",
            striverId: '29',
            description: `Given an integer array <code>nums</code>, find the subarray with the largest sum, and return its sum.`,
            constraints: ['1 &le; nums.length &le; 10<sup>5</sup>', '-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup>'],
            functionName: 'maxSubArray',
            starterCode: {
                javascript: `function maxSubArray(nums) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def maxSubArray(self, nums: list) -> int:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', output: '6', explanation: 'Subarray [4, -1, 2, 1] has the largest sum = 6.', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
                { input: 'nums = [1]', output: '1', explanation: 'Single element array.', args: [[1]], expected: 1 }
            ],
            hiddenCases: [
                { args: [[5, 4, -1, 7, 8]], expected: 23 },
                { args: [[-1, -2, -3, -4]], expected: -1 },
                { args: [[-2, -1]], expected: -1 },
                { args: [[2, 3, -1, 4]], expected: 8 }
            ],
            explanation: `Kadane's algorithm keeps a running sum. If the running sum drops below 0, it resets to 0 because a negative prefix can never contribute to a maximum subarray sum. Time: O(N), Space: O(1).`,
            referenceSolution: {
                javascript: `function maxSubArray(nums) {\n    let maxSum = nums[0], currSum = 0;\n    for (let x of nums) {\n        currSum += x;\n        if (currSum > maxSum) maxSum = currSum;\n        if (currSum < 0) currSum = 0;\n    }\n    return maxSum;\n}`,
                python: `class Solution:\n    def maxSubArray(self, nums: list) -> int:\n        max_sum = nums[0]\n        curr_sum = 0\n        for x in nums:\n            curr_sum += x\n            if curr_sum > max_sum: max_sum = curr_sum\n            if curr_sum < 0: curr_sum = 0\n        return max_sum`,
                cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int maxSum = nums[0], curr = 0;\n        for (int x : nums) {\n            curr += x;\n            maxSum = max(maxSum, curr);\n            if (curr < 0) curr = 0;\n        }\n        return maxSum;\n    }\n};`
            }
        },

        // --- Section 3: Binary Search ---
        {
            id: 'dsa_binary_search',
            type: 'coding',
            subjectId: 'dsa',
            sectionIndex: 3,
            topicId: 'dsa_binary_search',
            topic: 'Binary Search (1D Arrays)',
            difficulty: 'Easy',
            title: 'Binary Search',
            striverId: '81',
            description: `Given an array of integers <code>nums</code> which is sorted in ascending order, and an integer <code>target</code>, write a function to search <code>target</code> in <code>nums</code>. If <code>target</code> exists, then return its index. Otherwise, return <code>-1</code>.<br>You must write an algorithm with <code>O(log n)</code> runtime complexity.`,
            constraints: ['1 &le; nums.length &le; 10<sup>4</sup>', '-10<sup>4</sup> < nums[i], target < 10<sup>4</sup>', 'All integers in nums are unique.'],
            functionName: 'search',
            starterCode: {
                javascript: `function search(nums, target) {\n    // Write your solution here\n}`,
                python: `class Solution:\n    def search(self, nums: list, target: int) -> int:\n        # Write your solution here\n        pass`,
                cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your solution here\n    }\n};`
            },
            sampleCases: [
                { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.', args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
                { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.', args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 }
            ],
            hiddenCases: [
                { args: [[5], 5], expected: 0 },
                { args: [[5], -5], expected: -1 },
                { args: [[1, 3, 5, 7, 9, 11], 1], expected: 0 },
                { args: [[1, 3, 5, 7, 9, 11], 11], expected: 5 },
                { args: [[2, 4, 6, 8, 10], 7], expected: -1 }
            ],
            explanation: `Compare target with the middle element. If equal, return index. If target is larger, search right half; otherwise search left half. Halves search space on every iteration. Time: O(log N), Space: O(1).`,
            referenceSolution: {
                javascript: `function search(nums, target) {\n    let left = 0, right = nums.length - 1;\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (nums[mid] === target) return mid;\n        else if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`,
                python: `class Solution:\n    def search(self, nums: list, target: int) -> int:\n        left, right = 0, len(nums) - 1\n        while left <= right:\n            mid = (left + right) // 2\n            if nums[mid] == target:\n                return mid\n            elif nums[mid] < target:\n                left = mid + 1\n            else:\n                right = mid - 1\n        return -1`,
                cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int l = 0, r = nums.size() - 1;\n        while (l <= r) {\n            int m = l + (r - l) / 2;\n            if (nums[m] == target) return m;\n            else if (nums[m] < target) l = m + 1;\n            else r = m - 1;\n        }\n        return -1;\n    }\n};`
            }
        }
    ],

    // ------------------------------------------------------------------------
    // CORE CS MCQS (DBMS, OS, CN, OOP, System Design)
    // ------------------------------------------------------------------------
    core_cs: [
        // --- DBMS ---
        {
            id: 'mcq_dbms_normalization_3nf',
            type: 'mcq',
            subjectId: 'dbms',
            topicId: 'dbms_normalization',
            topic: 'Normalization',
            difficulty: 'Medium',
            question: 'In relational database theory, which condition MUST hold for a relation R with functional dependencies to be in Third Normal Form (3NF)?',
            options: [
                'For every non-trivial FD X → Y, X must be a superkey OR Y must be a prime attribute.',
                'For every non-trivial FD X → Y, X must strictly be a superkey.',
                'There can be no composite primary keys in relation R.',
                'All non-prime attributes must have multi-valued dependencies.'
            ],
            correctAnswer: 0,
            explanation: 'In 3NF, for every non-trivial FD X → Y, either X is a superkey OR Y is a prime attribute (part of some candidate key). If X MUST strictly be a superkey without exception, that defines Boyce-Codd Normal Form (BCNF).'
        },
        {
            id: 'mcq_dbms_acid_isolation',
            type: 'mcq',
            subjectId: 'dbms',
            topicId: 'dbms_transactions',
            topic: 'Transactions & ACID',
            difficulty: 'Medium',
            question: 'Which of the following SQL transaction isolation levels prevents "Dirty Reads" and "Non-Repeatable Reads", but still allows "Phantom Reads"?',
            options: [
                'Read Uncommitted',
                'Read Committed',
                'Repeatable Read',
                'Serializable'
            ],
            correctAnswer: 2,
            explanation: 'Repeatable Read locks all rows that match a query, preventing Dirty Reads and Non-Repeatable Reads. However, it does not prevent new rows inserted by another concurrent transaction from appearing in a re-run query (Phantom Reads). Serializable prevents all three anomalies.'
        },
        {
            id: 'mcq_dbms_indexing_bplus',
            type: 'mcq',
            subjectId: 'dbms',
            topicId: 'dbms_indexing',
            topic: 'Indexing & B+ Trees',
            difficulty: 'Medium',
            question: 'Why are B+ Trees overwhelmingly preferred over standard B Trees for relational database indexing (such as MySQL InnoDB)?',
            options: [
                'B+ Trees store data pointers only in leaf nodes, allowing interior nodes to hold more keys and making range scans O(1) via linked leaves.',
                'B+ Trees have lower worst-case time complexity of O(1) for single key searches.',
                'B Trees do not support binary search inside node pages.',
                'B+ Trees require zero disk I/O operations for point queries.'
            ],
            correctAnswer: 0,
            explanation: 'In a B+ Tree, interior nodes only store routing keys (no data records), maximizing node fan-out and minimizing tree height. Additionally, all leaf nodes are sequentially linked via a doubly-linked list, making range queries and sequential scans extremely fast.'
        },

        // --- Operating Systems ---
        {
            id: 'mcq_os_deadlock_conditions',
            type: 'mcq',
            subjectId: 'os',
            topicId: 'os_deadlocks',
            topic: 'Deadlocks',
            difficulty: 'Easy',
            question: 'Which of the following is NOT one of the four Coffman conditions necessary for a deadlock to occur?',
            options: [
                'Mutual Exclusion',
                'Hold and Wait',
                'Preemptive Scheduling',
                'Circular Wait'
            ],
            correctAnswer: 2,
            explanation: 'The four necessary Coffman conditions for deadlock are: 1) Mutual Exclusion, 2) Hold and Wait, 3) No Preemption, and 4) Circular Wait. Preemption breaks deadlocks; "No Preemption" is the requirement for deadlocks to form.'
        },
        {
            id: 'mcq_os_virtual_memory_tlb',
            type: 'mcq',
            subjectId: 'os',
            topicId: 'os_memory',
            topic: 'Virtual Memory & Paging',
            difficulty: 'Medium',
            question: 'What happens when a Translation Lookaside Buffer (TLB) miss occurs during virtual memory address translation?',
            options: [
                'The CPU triggers an immediate page fault and halts the executing process.',
                'The Memory Management Unit (MMU) must traverse the page table in main memory to resolve the physical frame address.',
                'The operating system initiates disk swap I/O to read the page from secondary storage.',
                'The cache controller invalidates all L1 and L2 cache lines.'
            ],
            correctAnswer: 1,
            explanation: 'A TLB miss means the virtual page number is not cached in the hardware TLB. The MMU performs a page table walk in RAM. If the page table entry indicates the page is resident in RAM, it loads it into the TLB (no page fault). A page fault only occurs if the page is marked not present in RAM.'
        },
        {
            id: 'mcq_os_fork_exec',
            type: 'mcq',
            subjectId: 'os',
            topicId: 'os_processes',
            topic: 'Processes & System Calls',
            difficulty: 'Easy',
            question: 'In Unix/Linux systems, what is the exact return value of the fork() system call in the newly created child process upon success?',
            options: [
                'The Process ID (PID) of the parent process.',
                'A negative integer (-1).',
                '0',
                'The Process ID (PID) of the child process.'
            ],
            correctAnswer: 2,
            explanation: 'Upon successful execution of fork(), the call returns the child PID to the parent process, and returns 0 to the child process. A negative value (-1) is returned if fork fails.'
        },

        // --- Computer Networks ---
        {
            id: 'mcq_cn_tcp_handshake',
            type: 'mcq',
            subjectId: 'cn',
            topicId: 'cn_transport',
            topic: 'Transport Layer & TCP',
            difficulty: 'Easy',
            question: 'What is the correct sequence of TCP control flag packets exchanged between a client and server during the standard 3-Way Handshake?',
            options: [
                'Client: SYN → Server: SYN-ACK → Client: ACK',
                'Client: SYN → Server: ACK → Client: FIN',
                'Client: ACK → Server: SYN → Client: ACK',
                'Client: SYN-ACK → Server: SYN → Client: ACK'
            ],
            correctAnswer: 0,
            explanation: 'The TCP 3-Way Handshake begins with Client sending SYN (synchronize seq number), Server responding with SYN-ACK (acknowledge client seq and send its own SYN), and Client concluding with ACK (acknowledge server seq).'
        },
        {
            id: 'mcq_cn_cidr_subnetting',
            type: 'mcq',
            subjectId: 'cn',
            topicId: 'cn_network_layer',
            topic: 'Subnetting & CIDR',
            difficulty: 'Medium',
            question: 'Given an IPv4 subnet notation of 192.168.10.0/27, how many usable host IP addresses can be assigned to devices on this subnet?',
            options: [
                '32',
                '30',
                '27',
                '62'
            ],
            correctAnswer: 1,
            explanation: 'With a /27 prefix, the number of host bits is 32 - 27 = 5 bits. Total IP addresses = 2^5 = 32. Subtracting 2 reserved addresses (Network ID and Broadcast address) leaves 32 - 2 = 30 usable host IP addresses.'
        },

        // --- OOP ---
        {
            id: 'mcq_oop_diamond_problem',
            type: 'mcq',
            subjectId: 'oop',
            topicId: 'oop_inheritance',
            topic: 'Polymorphism & Inheritance',
            difficulty: 'Medium',
            question: 'In C++, how is the famous "Diamond Problem" of multiple inheritance resolved so that the derived class receives only one instance of the base class members?',
            options: [
                'Using virtual inheritance: inheriting with the `virtual` keyword.',
                'Declaring all base class methods as `friend` functions.',
                'Making all constructors `private` in the intermediate classes.',
                'Overriding the `this` pointer in the derived class.'
            ],
            correctAnswer: 0,
            explanation: 'The Diamond Problem occurs when class D inherits from B and C, both of which inherit from class A. Declaring `class B : virtual public A` and `class C : virtual public A` ensures that D inherits only a single shared instance of A.'
        },

        // --- System Design ---
        {
            id: 'mcq_sd_cap_theorem',
            type: 'mcq',
            subjectId: 'sysdesign',
            topicId: 'sd_fundamentals',
            topic: 'Distributed Systems & CAP Theorem',
            difficulty: 'Medium',
            question: 'According to Brewer’s CAP Theorem, in the inevitable presence of a Network Partition (P), what trade-off must a distributed system make?',
            options: [
                'It must choose between Consistency (C) and Availability (A).',
                'It must choose between Latency and Durability.',
                'It can achieve both Consistency and Availability by doubling replica counts.',
                'It must drop Partition Tolerance (P) to guarantee throughput.'
            ],
            correctAnswer: 0,
            explanation: 'In a real-world distributed network, network partitions (packet loss, split-brain) are inevitable. When a partition occurs, the system must either continue serving potentially stale data (choosing Availability over Consistency) or refuse requests until data synchronizes (choosing Consistency over Availability).'
        }
    ],

    // ------------------------------------------------------------------------
    // SQL QUESTIONS
    // ------------------------------------------------------------------------
    sql: [
        {
            id: 'sql_second_highest_salary',
            type: 'mcq',
            subjectId: 'sql',
            topicId: 'sql_subqueries',
            topic: 'Subqueries & Window Functions',
            difficulty: 'Easy',
            question: 'Given an `Employee(id INT, salary INT)` table, which SQL query correctly finds the second highest distinct salary without error if only one distinct salary exists?',
            options: [
                'SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);',
                'SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1;',
                'SELECT DISTINCT salary FROM Employee WHERE salary = (SELECT AVG(salary) FROM Employee);',
                'SELECT salary FROM Employee GROUP BY salary HAVING COUNT(*) = 2;'
            ],
            correctAnswer: 0,
            explanation: 'Using `SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee)` returns NULL if no second highest salary exists, conforming strictly to SQL standards and LeetCode Problem 176.'
        },
        {
            id: 'sql_left_join_nulls',
            type: 'mcq',
            subjectId: 'sql',
            topicId: 'sql_joins',
            topic: 'Joins & Aggregates',
            difficulty: 'Medium',
            question: 'Given tables `Customers(id, name)` and `Orders(id, customerId, amount)`, which query finds all customers who have NEVER placed an order?',
            options: [
                'SELECT c.name FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.customerId IS NULL;',
                'SELECT c.name FROM Customers c INNER JOIN Orders o ON c.id = o.customerId WHERE o.amount = 0;',
                'SELECT c.name FROM Customers c WHERE c.id IN (SELECT customerId FROM Orders);',
                'SELECT c.name FROM Customers c FULL OUTER JOIN Orders o ON c.id = o.customerId;'
            ],
            correctAnswer: 0,
            explanation: 'A LEFT JOIN includes all rows from Customers. For customers without orders, the matched Orders columns will be NULL. Adding `WHERE o.customerId IS NULL` filters specifically for customers with no orders.'
        },
        {
            id: 'sql_dense_rank_vs_rank',
            type: 'mcq',
            subjectId: 'sql',
            topicId: 'sql_window_functions',
            topic: 'Window Functions',
            difficulty: 'Medium',
            question: 'What is the key difference between RANK() and DENSE_RANK() in SQL window functions when duplicate values occur in the ORDER BY clause?',
            options: [
                'DENSE_RANK() assigns consecutive rank numbers without gaps after ties (e.g. 1, 2, 2, 3), whereas RANK() skips ranks (e.g. 1, 2, 2, 4).',
                'RANK() assigns consecutive numbers without gaps, whereas DENSE_RANK() skips numbers.',
                'RANK() requires an aggregation GROUP BY clause, whereas DENSE_RANK() does not.',
                'DENSE_RANK() works only on integer columns, whereas RANK() works on text.'
            ],
            correctAnswer: 0,
            explanation: 'DENSE_RANK() does not skip rank numbers after identical values (ties). If two rows tie for rank 2, the next rank assigned is 3. RANK() leaves a gap: if two rows tie for 2, the next rank is 4.'
        }
    ],

    // ------------------------------------------------------------------------
    // APTITUDE QUESTIONS
    // ------------------------------------------------------------------------
    aptitude: [
        {
            id: 'apt_time_work_1',
            type: 'mcq',
            subjectId: 'aptitude',
            topicId: 'apt_arithmetic',
            topic: 'Time and Work',
            difficulty: 'Easy',
            question: 'A can complete a piece of work in 10 days, and B can complete the same work in 15 days. How many days will they take to finish the work together?',
            options: [
                '6 days',
                '8 days',
                '5 days',
                '12.5 days'
            ],
            correctAnswer: 0,
            explanation: 'LCM(10, 15) = 30 units total work. Efficiency of A = 30/10 = 3 units/day. Efficiency of B = 30/15 = 2 units/day. Combined efficiency = 3 + 2 = 5 units/day. Time taken = 30 / 5 = 6 days.'
        },
        {
            id: 'apt_speed_distance_1',
            type: 'mcq',
            subjectId: 'aptitude',
            topicId: 'apt_arithmetic',
            topic: 'Speed, Time & Distance',
            difficulty: 'Easy',
            question: 'A train traveling at 72 km/h crosses a pole in 15 seconds. What is the length of the train in meters?',
            options: [
                '300 meters',
                '250 meters',
                '360 meters',
                '200 meters'
            ],
            correctAnswer: 0,
            explanation: 'Speed in m/s = 72 * (5 / 18) = 20 m/s. Distance (train length) = Speed * Time = 20 m/s * 15 s = 300 meters.'
        },
        {
            id: 'apt_profit_loss_1',
            type: 'mcq',
            subjectId: 'aptitude',
            topicId: 'apt_arithmetic',
            topic: 'Percentages & Profit/Loss',
            difficulty: 'Easy',
            question: 'An item is bought for Rs. 400 and sold for Rs. 500. What is the profit percentage?',
            options: [
                '25%',
                '20%',
                '30%',
                '15%'
            ],
            correctAnswer: 0,
            explanation: 'Profit = Selling Price - Cost Price = 500 - 400 = Rs. 100. Profit % = (Profit / CP) * 100 = (100 / 400) * 100 = 25%.'
        },
        {
            id: 'apt_blood_relations_1',
            type: 'mcq',
            subjectId: 'aptitude',
            topicId: 'apt_reasoning',
            topic: 'Blood Relations',
            difficulty: 'Easy',
            question: 'Pointing to a photograph, a man said: "His mother is the only daughter of my mother." How is the person in the photograph related to the man?',
            options: [
                'Nephew',
                'Son',
                'Brother',
                'Father'
            ],
            correctAnswer: 0,
            explanation: '"The only daughter of my mother" means the man\'s sister. Since the person in the photo is the son of the man\'s sister, the person is his Nephew.'
        },
        {
            id: 'apt_number_series_1',
            type: 'mcq',
            subjectId: 'aptitude',
            topicId: 'apt_reasoning',
            topic: 'Number Series',
            difficulty: 'Easy',
            question: 'Find the next number in the sequence: 2, 6, 12, 20, 30, ?',
            options: [
                '42',
                '40',
                '44',
                '36'
            ],
            correctAnswer: 0,
            explanation: 'Difference between consecutive terms: +4, +6, +8, +10. Next difference should be +12. 30 + 12 = 42. (Also follows n*(n+1): 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42).'
        }
    ],

    // ------------------------------------------------------------------------
    // CONCEPTUAL INTERVIEW QUESTIONS
    // ------------------------------------------------------------------------
    conceptual: [
        {
            id: 'int_cache_invalidation',
            type: 'conceptual',
            subjectId: 'sysdesign',
            topicId: 'sd_caching',
            topic: 'Distributed Systems & Caching',
            difficulty: 'Medium',
            question: 'Explain the Cache-Aside (Lazy Loading) pattern vs Write-Through caching. What are the key trade-offs regarding data freshness, read latency, and cache misses?',
            expectedConcepts: [
                'Cache-Aside: App reads from cache, on miss fetches from DB and writes to cache',
                'Write-Through: App writes data to cache and DB simultaneously',
                'Data staleness vs write latency overhead',
                'Cache eviction handling (TTL, LRU)'
            ],
            explanation: `In Cache-Aside, the application first queries the cache. On a cache miss, it reads from the database and populates the cache. Pros: Only requested data is cached. Cons: Cache miss penalty on first access; potential data staleness unless invalidated on updates.
In Write-Through, writes update the cache and database synchronously. Pros: High data consistency and zero cache misses on reads. Cons: Slower write latency because every write requires dual operations.`
        },
        {
            id: 'int_process_context_switch',
            type: 'conceptual',
            subjectId: 'os',
            topicId: 'os_processes',
            topic: 'Operating Systems & Concurrency',
            difficulty: 'Medium',
            question: 'Why is a Process context switch significantly more expensive in terms of CPU cycles than a Thread context switch?',
            expectedConcepts: [
                'Virtual address space switching (CR3 register in x86)',
                'TLB (Translation Lookaside Buffer) invalidation / flushing',
                'L1/L2 cache pollution',
                'Threads share address space, code, and heap'
            ],
            explanation: `A thread context switch only requires saving and restoring registers, program counter, and stack pointer within the same virtual address space.
A process context switch requires changing the virtual memory address space (reloading the page directory base register like CR3 on x86). This causes the hardware TLB (Translation Lookaside Buffer) to be flushed or tagged entries changed. Subsequent memory accesses incur TLB misses and cache misses until the cache warms up, which costs thousands of CPU cycles.`
        }
    ]
};

if (typeof window !== 'undefined') {
    window.TEST_QUESTION_BANK = TEST_QUESTION_BANK;
}
if (typeof module !== 'undefined') {
    module.exports = { TEST_QUESTION_BANK };
}
