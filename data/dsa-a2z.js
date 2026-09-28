/**
 * BOSS Study OS — Striver A2Z DSA Sheet
 * Complete dataset of 443 problems from the official A2Z sheet.
 * Source: https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z
 * 
 * DSA journey begins from Question 1 (Learn the basics) and continues sequentially.
 * No pre-assumed knowledge. Every question is tracked.
 */

const DSA_A2Z_SHEET = [
    // ─── Section 1: Learn the basics ───
    {
        sectionIndex: 0,
        name: "Learn the basics",
        preCompleted: false,
        subcategories: [
            {
                name: "Things to Know in C++/Java/Python or any language",
                problems: [
                    { id: "425", name: "Input Output", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/c/c-basic-input-output/", youtube: "https://youtu.be/EAR7De6Goz4?t=250" },
                    { id: "1211", name: "Cpp Basics", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/what-are-arrays-strings", youtube: "https://youtu.be/EAR7De6Goz4?t=2415" },
                    { id: "424", name: "If ElseIf", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/if-else/if-else-statements/", youtube: "https://youtu.be/EAR7De6Goz4?t=1259" },
                    { id: "429", name: "Switch Case", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/switch-case/switch-case-statements/", youtube: "https://youtu.be/EAR7De6Goz4" },
                    { id: "2869", name: "What are arrays, strings?", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/what-are-arrays-strings", youtube: "https://youtu.be/EAR7De6Goz4?t=2415" },
                    { id: "2867", name: "For loops", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/for-loop/understanding-for-loop/", youtube: "https://youtu.be/EAR7De6Goz4?t=3096" },
                    { id: "2868", name: "While loops", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/while-loop/while-loops-in-programming/", youtube: "https://youtu.be/EAR7De6Goz4?t=3459" },
                    { id: "1219", name: "Theory with examples", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/time-complexity/time-and-space-complexity-strivers-a2z-dsa-course/", youtube: "https://youtu.be/FPu9Uld7W-E" }
                ]
            },
            {
                name: "Build-up Logical Thinking",
                problems: [
                    { id: "1216", name: "Easy and Medium", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "1205", name: "Hard", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" }
                ]
            },
            {
                name: "Patterns",
                problems: [
                    { id: "401", name: "Pattern 1", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "412", name: "Pattern 2", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "416", name: "Pattern 3", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "417", name: "Pattern 4", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "418", name: "Pattern 5", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "420", name: "Pattern 7", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "421", name: "Pattern 8", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "422", name: "Pattern 9", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "402", name: "Pattern 10", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "403", name: "Pattern 11", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "404", name: "Pattern 12", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "405", name: "Pattern 13", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "406", name: "Pattern 14", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "407", name: "Pattern 15", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "409", name: "Pattern 17", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "410", name: "Pattern 18", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "411", name: "Pattern 19", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "413", name: "Pattern 20", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "414", name: "Pattern 21", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" },
                    { id: "415", name: "Pattern 22", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/strivers-a2z-dsa-course/must-do-pattern-problems-before-starting-dsa/", youtube: "https://www.youtube.com/watch?v=tNm_NNSB3_w\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=3" }
                ]
            },
            {
                name: "Learn STL/Java-Collections or similar thing in your language",
                problems: [
                    { id: "1218", name: "STL", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/c/c-stl-tutorial-most-frequent-used-stl-containers/", youtube: "https://www.youtube.com/watch?v=RRVYpIET_RU" },
                    { id: "1217", name: "Java Collections", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/java-collections", youtube: null }
                ]
            },
            {
                name: "Know Basic Maths",
                problems: [
                    { id: "367", name: "Count all Digits of a Number", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/count-digits-in-a-number/", youtube: "https://youtu.be/1xNbjMdbjug" },
                    { id: "374", name: "Palindrome Number", difficulty: "Easy", leetcode: "https://leetcode.com/problems/palindrome-number/", article: "https://takeuforward.org/data-structure/check-if-a-number-is-palindrome-or-not/", youtube: "https://youtu.be/1xNbjMdbjug?t=1230" },
                    { id: "372", name: "GCD of Two Numbers", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/find-gcd-of-two-numbers/", youtube: "https://youtu.be/1xNbjMdbjug?t=2684" },
                    { id: "366", name: "Check if the Number is Armstrong", difficulty: "Easy", leetcode: "https://leetcode.com/problems/armstrong-number/", article: "https://takeuforward.org/maths/check-if-a-number-is-armstrong-number-or-not/", youtube: "https://youtu.be/1xNbjMdbjug?t=1418" },
                    { id: "2807", name: "Print all Divisors", difficulty: "easy", leetcode: null, article: "https://takeuforward.org/data-structure/print-all-divisors-of-a-given-number/", youtube: "https://youtu.be/1xNbjMdbjug?t=1580" },
                    { id: "365", name: "Check for Prime Number", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/check-if-a-number-is-prime-or-not/", youtube: "https://youtu.be/1xNbjMdbjug?t=2381" }
                ]
            },
            {
                name: "Learn Basic Recursion",
                problems: [
                    { id: "2401", name: "Understand recursion by print something N times", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/recursion/introduction-to-recursion-understand-recursion-by-printing-something-n-times/", youtube: "https://www.youtube.com/watch?v=yVdKa8dnKiE\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9" },
                    { id: "2405", name: "Print name N times using recursion", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/recursion/print-name-n-times-using-recursion/", youtube: "https://www.youtube.com/watch?v=un6PLygfXrA\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=2" },
                    { id: "850", name: "Print 1 to N using Recursion", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/recursion/print-1-to-n-using-recursion/", youtube: "https://www.youtube.com/watch?v=un6PLygfXrA\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=2" },
                    { id: "852", name: "Print N to 1 using Recursion", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/recursion/print-n-to-1-using-recursion/", youtube: "https://www.youtube.com/watch?v=un6PLygfXrA\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=2" },
                    { id: "371", name: "Factorial of a given number", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/factorial-of-a-number-iterative-and-recursive", youtube: "https://www.youtube.com/watch?v=69ZCDFy-OUo\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=3" },
                    { id: "342", name: "Reverse an array", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/reverse-a-given-array/", youtube: "https://www.youtube.com/watch?v=twuC1F6gLI8\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=4" },
                    { id: "378", name: "Check if String is Palindrome or Not", difficulty: "Easy", leetcode: "https://leetcode.com/problems/valid-palindrome/", article: "https://takeuforward.org/data-structure/check-if-the-given-string-is-palindrome-or-not/", youtube: "https://www.youtube.com/watch?v=twuC1F6gLI8\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=4" },
                    { id: "381", name: "Fibonacci Number", difficulty: "Easy", leetcode: "https://leetcode.com/problems/fibonacci-number/", article: "https://takeuforward.org/arrays/print-fibonacci-series-up-to-nth-term/", youtube: "https://www.youtube.com/watch?v=kvRjNm4rVBE\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=5" }
                ]
            },
            {
                name: "Learn Basic Hashing",
                problems: [
                    { id: "1203", name: "Basic Hashing", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/hashing/hashing-maps-time-complexity-collisions-division-rule-of-hashing-strivers-a2z-dsa-course/", youtube: "https://www.youtube.com/watch?v=KEs5UyBJ39g" },
                    { id: "252", name: "Counting Frequencies of Array Elements", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/count-frequency-of-each-element-in-the-array/", youtube: null },
                    { id: "344", name: "Highest Occurring Element in an Array", difficulty: "Easy", leetcode: "https://leetcode.com/problems/frequency-of-the-most-frequent-element/", article: "https://takeuforward.org/arrays/find-the-highest-lowest-frequency-element/", youtube: null }
                ]
            }
        ]
    },
    // ─── Section 2: Learn Important Sorting Techniques ───
    {
        sectionIndex: 1,
        name: "Learn Important Sorting Techniques",
        preCompleted: false,
        subcategories: [
            {
                name: "Sorting-I",
                problems: [
                    { id: "947", name: "Selection Sort", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/sorting/selection-sort-algorithm/", youtube: "https://youtu.be/HGk_ypEuS24?t=167" },
                    { id: "943", name: "Bubble Sort", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/bubble-sort-algorithm/", youtube: "https://youtu.be/HGk_ypEuS24?t=1061" },
                    { id: "944", name: "Insertion Sorting", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/insertion-sort-algorithm/", youtube: "https://youtu.be/HGk_ypEuS24?t=1900" }
                ]
            },
            {
                name: "Sorting-II",
                problems: [
                    { id: "945", name: "Merge Sorting", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/merge-sort-algorithm/", youtube: "https://youtu.be/ogjf7ORKfd8" },
                    { id: "881", name: "Recursive Bubble Sort", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/recursive-bubble-sort-algorithm/", youtube: null },
                    { id: "882", name: "Recursive Insertion Sort", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/recursive-insertion-sort-algorithm/", youtube: null },
                    { id: "946", name: "Quick Sorting", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/quick-sort-algorithm/", youtube: "https://youtu.be/WIrA4YexLRQ" }
                ]
            }
        ]
    },
    // ─── Section 3: Solve Problems on Arrays [Easy -> Medium -> Hard] ───
    {
        sectionIndex: 2,
        name: "Solve Problems on Arrays [Easy -> Medium -> Hard]",
        preCompleted: false,
        subcategories: [
            {
                name: "Easy",
                problems: [
                    { id: "38", name: "Largest Element", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/find-the-largest-element-in-an-array/", youtube: "https://youtu.be/37E9ckMDdTk?t=526" },
                    { id: "43", name: "Second Largest Element", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/find-second-smallest-and-second-largest-element-in-an-array/", youtube: "https://youtu.be/37E9ckMDdTk?t=810" },
                    { id: "379", name: "Check if the Array is Sorted II", difficulty: "Easy", leetcode: "https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/#:~:text=Input%3A%20nums%20%3D%20%5B2%2C,no%20rotation)%20to%20make%20nums.", article: "https://takeuforward.org/data-structure/check-if-an-array-is-sorted/", youtube: "https://youtu.be/37E9ckMDdTk?t=17224" },
                    { id: "2764", name: "Remove duplicates from Sorted array", difficulty: "Easy", leetcode: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/#:~:text=Input%3A%20nums%20%3D%20%5B0%2C,%2C%203%2C%20and%204%20respectively.", article: "https://takeuforward.org/data-structure/remove-duplicates-in-place-from-sorted-array/", youtube: "https://youtu.be/37E9ckMDdTk?t=1887" },
                    { id: "40", name: "Left Rotate Array by One", difficulty: "Easy", leetcode: "https://leetcode.com/problems/rotate-array/", article: "https://takeuforward.org/data-structure/left-rotate-the-array-by-one/", youtube: "https://youtu.be/wvcQg43_V8U?t=61" },
                    { id: "39", name: "Left Rotate Array by K Places", difficulty: "Easy", leetcode: "https://leetcode.com/problems/rotate-array/", article: "https://takeuforward.org/data-structure/rotate-array-by-k-elements/", youtube: "https://youtu.be/wvcQg43_V8U?t=485" },
                    { id: "46", name: "Move Zeros to End", difficulty: "Easy", leetcode: "https://leetcode.com/problems/move-zeroes/", article: "https://takeuforward.org/data-structure/move-all-zeros-to-the-end-of-the-array/", youtube: "https://youtu.be/wvcQg43_V8U?t=1633" },
                    { id: "41", name: "Linear Search", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/linear-search-in-c/", youtube: "https://youtu.be/wvcQg43_V8U?t=2465" },
                    { id: "48", name: "Union of two sorted arrays", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/union-of-two-sorted-arrays/", youtube: "https://youtu.be/wvcQg43_V8U?t=2584" },
                    { id: "44", name: "Find missing number", difficulty: "Easy", leetcode: null, article: "https://www.geeksforgeeks.org/find-the-missing-number/", youtube: null },
                    { id: "42", name: "Maximum Consecutive Ones", difficulty: "Easy", leetcode: "https://leetcode.com/problems/max-consecutive-ones/", article: "https://takeuforward.org/data-structure/count-maximum-consecutive-ones-in-the-array/", youtube: "https://youtu.be/bYWLJb3vCWY?t=1124" },
                    { id: "2793", name: "Find the number that appears once, and other numbers twice.", difficulty: "Medium", leetcode: "https://leetcode.com/problems/single-number/", article: "https://takeuforward.org/arrays/find-the-number-that-appears-once-and-the-other-numbers-twice/", youtube: "https://youtu.be/bYWLJb3vCWY?t=1369" },
                    { id: "2836", name: "Longest subarray with given sum K(positives)", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/longest-subarray-with-given-sum-k/", youtube: "https://www.youtube.com/watch?v=frf7qxiN2qU\\u0026feature=youtu.be" },
                    { id: "564", name: "Longest subarray with sum K", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/length-of-the-longest-subarray-with-zero-sum/", youtube: "https://youtu.be/frf7qxiN2qU" },
                    { id: "37", name: "Two Sum", difficulty: "Easy", leetcode: "https://leetcode.com/problems/two-sum/", article: "https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/", youtube: "https://youtu.be/UXDSeD9mN-k" },
                    { id: "2762", name: "Sort an array of 0's 1's and 2's", difficulty: "Medium", leetcode: "https://leetcode.com/problems/sort-colors/", article: "https://takeuforward.org/data-structure/sort-an-array-of-0s-1s-and-2s/", youtube: "https://youtu.be/tp8JIuCXBaU" },
                    { id: "22", name: "Majority Element-I", difficulty: "Easy", leetcode: "https://leetcode.com/problems/majority-element/", article: "https://takeuforward.org/data-structure/find-the-majority-element-that-occurs-more-than-n-2-times/", youtube: "https://youtu.be/nP_ns3uSh80" },
                    { id: "29", name: "Kadane's Algorithm", difficulty: "Medium", leetcode: "https://leetcode.com/problems/maximum-subarray/", article: "https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/", youtube: "https://youtu.be/AHZpyENo7k4?si=QJpof4R1hHokm1hw" },
                    { id: "2761", name: "Print subarray with maximum subarray sum (extended version of above problem)", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/", youtube: "https://youtu.be/AHZpyENo7k4" },
                    { id: "2798", name: "Stock Buy and Sell", difficulty: "Medium", leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", article: "https://takeuforward.org/data-structure/stock-buy-and-sell/", youtube: "https://youtu.be/excAOvwF_Wk" },
                    { id: "34", name: "Rearrange array elements by sign", difficulty: "Medium", leetcode: "https://leetcode.com/problems/rearrange-array-elements-by-sign/", article: "https://takeuforward.org/arrays/rearrange-array-elements-by-sign/", youtube: "https://youtu.be/h4aBagy4Uok" },
                    { id: "31", name: "Next Permutation", difficulty: "Medium", leetcode: "https://leetcode.com/problems/next-permutation/", article: "https://takeuforward.org/data-structure/next_permutation-find-next-lexicographically-greater-permutation/", youtube: "https://youtu.be/JDOXKqF60RQ" },
                    { id: "30", name: "Leaders in an Array", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/leaders-in-an-array/", youtube: "https://youtu.be/cHrH9CQ8pmY" },
                    { id: "2835", name: "Longest Consecutive Sequence in an Array", difficulty: "Medium", leetcode: "https://leetcode.com/problems/longest-consecutive-sequence/solution/", article: "https://takeuforward.org/data-structure/longest-consecutive-sequence-in-an-array/", youtube: "https://youtu.be/oO5uLE7EUlM" },
                    { id: "911", name: "Set Matrix Zeroes", difficulty: "Medium", leetcode: "https://leetcode.com/problems/set-matrix-zeroes/", article: "https://takeuforward.org/data-structure/set-matrix-zero/", youtube: "https://youtu.be/N0MgLvceX7M" },
                    { id: "35", name: "Rotate matrix by 90 degrees", difficulty: "Medium", leetcode: "https://leetcode.com/problems/rotate-image/", article: "https://takeuforward.org/data-structure/rotate-image-by-90-degree/", youtube: "https://youtu.be/Z0R2u6gd3GU" },
                    { id: "33", name: "Print the matrix in spiral manner", difficulty: "Medium", leetcode: "https://leetcode.com/problems/spiral-matrix/", article: "https://takeuforward.org/data-structure/spiral-traversal-of-matrix/", youtube: "https://youtu.be/3Zv-s9UUrFM" },
                    { id: "561", name: "Count subarrays with given sum", difficulty: "Medium", leetcode: "https://leetcode.com/problems/subarray-sum-equals-k/", article: "https://takeuforward.org/arrays/count-subarray-sum-equals-k/", youtube: "https://www.youtube.com/watch?v=xvNwoz-ufXA\\u0026list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz\\u0026index=32" }
                ]
            },
            {
                name: "Hard",
                problems: [
                    { id: "813", name: "Pascal's Triangle I", difficulty: "Easy", leetcode: "https://leetcode.com/problems/pascals-triangle/", article: "https://takeuforward.org/data-structure/program-to-generate-pascals-triangle", youtube: "https://youtu.be/bR7mQgwQ_o8" },
                    { id: "23", name: "Majority Element-II", difficulty: "Hard", leetcode: "https://leetcode.com/problems/majority-element-ii/", article: "https://takeuforward.org/data-structure/majority-elementsn-3-times-find-the-elements-that-appears-more-than-n-3-times-in-the-array/", youtube: "https://youtu.be/vwZj1K0e9U8" },
                    { id: "27", name: "3 Sum", difficulty: "Medium", leetcode: "https://leetcode.com/problems/3sum/", article: "https://takeuforward.org/data-structure/3-sum-find-triplets-that-add-up-to-a-zero/", youtube: "https://youtu.be/DhFh8Kw7ymk" },
                    { id: "28", name: "4 Sum", difficulty: "Medium", leetcode: "https://leetcode.com/problems/4sum/", article: "https://takeuforward.org/data-structure/4-sum-find-quads-that-add-up-to-a-target-value/", youtube: "https://youtu.be/eD95WRfh81c" },
                    { id: "605", name: "Largest Subarray with Sum 0", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/length-of-the-longest-subarray-with-zero-sum/", youtube: "https://www.youtube.com/watch?v=xmguZ6GbatA\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=23" },
                    { id: "715", name: "Merge Overlapping Subintervals", difficulty: "Medium", leetcode: "https://leetcode.com/problems/merge-intervals/", article: "https://takeuforward.org/data-structure/merge-overlapping-sub-intervals/", youtube: "https://youtu.be/IexN60k62jo" },
                    { id: "25", name: "Merge two sorted arrays without extra space", difficulty: "Medium", leetcode: "https://leetcode.com/problems/merge-sorted-array/", article: "https://takeuforward.org/data-structure/merge-two-sorted-arrays-without-extra-space/", youtube: "https://youtu.be/n7uwj04E0I4" },
                    { id: "21", name: "Find the repeating and missing number", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/find-the-repeating-and-missing-numbers/", youtube: "https://youtu.be/2D0D8HE6uak" },
                    { id: "20", name: "Count Inversions", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/count-inversions-in-an-array", youtube: "https://youtu.be/AseUmwVNaoY" },
                    { id: "26", name: "Reverse Pairs", difficulty: "Hard", leetcode: "https://leetcode.com/problems/reverse-pairs/", article: "https://takeuforward.org/data-structure/count-reverse-pairs/", youtube: "https://youtu.be/0e4bZaP3MDI" },
                    { id: "24", name: "Maximum Product Subarray in an Array", difficulty: "Hard", leetcode: "https://leetcode.com/problems/maximum-product-subarray/", article: "https://takeuforward.org/data-structure/maximum-product-subarray-in-an-array/", youtube: null }
                ]
            }
        ]
    },
    // ─── Section 4: Binary Search [1D, 2D Arrays, Search Space] ───
    {
        sectionIndex: 3,
        name: "Binary Search [1D, 2D Arrays, Search Space]",
        preCompleted: false,
        subcategories: [
            {
                name: "BS on 1D Arrays",
                problems: [
                    { id: "81", name: "Search X in sorted array", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-search/", article: "https://takeuforward.org/data-structure/binary-search-explained/", youtube: "https://youtu.be/MHf6awe89xw" },
                    { id: "80", name: "Lower Bound", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/implement-lower-bound-bs-2/", youtube: "https://youtu.be/6zhGS79oQ4k" },
                    { id: "82", name: "Upper Bound", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/implement-upper-bound/", youtube: "https://youtu.be/6zhGS79oQ4k" },
                    { id: "86", name: "Floor and Ceil in Sorted Array", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/floor-and-ceil-in-sorted-array/", youtube: "https://www.youtube.com/watch?v=6zhGS79oQ4k\\u0026list=PLgUwDviBIf0pMFMWuuvDNMAkoQFi-h0ZF\\u0026index=3" },
                    { id: "85", name: "First and last occurrence", difficulty: "Easy", leetcode: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", article: "https://takeuforward.org/data-structure/last-occurrence-in-a-sorted-array/", youtube: "https://youtu.be/hjR1IYVx9lY" },
                    { id: "229", name: "Count Occurrences in a Sorted Array", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/count-occurrences-in-sorted-array/", youtube: "https://youtu.be/hjR1IYVx9lY" },
                    { id: "87", name: "Search in rotated sorted array-I", difficulty: "Medium", leetcode: "https://leetcode.com/problems/search-in-rotated-sorted-array/", article: "https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/", youtube: "https://www.youtube.com/watch?v=r3pMQ8-Ad5s\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=64" },
                    { id: "88", name: "Search in rotated sorted array-II", difficulty: "Medium", leetcode: "https://leetcode.com/problems/search-in-rotated-sorted-array-ii/", article: "https://takeuforward.org/arrays/search-element-in-rotated-sorted-array-ii", youtube: "https://youtu.be/w2G2W8l__pc" },
                    { id: "83", name: "Find minimum in Rotated Sorted Array", difficulty: "Easy", leetcode: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", article: "https://takeuforward.org/data-structure/minimum-in-rotated-sorted-array/", youtube: "https://youtu.be/nhEMDKMB44g" },
                    { id: "84", name: "Find out how many times the array is rotated", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/find-out-how-many-times-the-array-has-been-rotated/", youtube: "https://youtu.be/jtSiWTPLwd0" },
                    { id: "2770", name: "Single element in a Sorted Array", difficulty: "Medium", leetcode: "https://leetcode.com/problems/single-element-in-a-sorted-array/", article: "https://takeuforward.org/data-structure/search-single-element-in-a-sorted-array/", youtube: "https://youtu.be/AZOmHuHadxQ" },
                    { id: "75", name: "Find peak element", difficulty: "Medium", leetcode: "https://leetcode.com/problems/find-peak-element/#:~:text=Find%20Peak%20Element%20%2D%20LeetCode\\u0026text=A%20peak%20element%20is%20an,to%20any%20of%20the%20peaks.", article: "https://takeuforward.org/data-structure/peak-element-in-array/", youtube: "https://youtu.be/cXxmbemS6XM" }
                ]
            },
            {
                name: "BS on Answers",
                problems: [
                    { id: "92", name: "Find square root of a number", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/binary-search/finding-sqrt-of-a-number-using-binary-search/", youtube: "https://youtu.be/Bsv3FPUX_BA" },
                    { id: "91", name: "Find Nth root of a number", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/nth-root-of-a-number-using-binary-search/", youtube: "https://www.youtube.com/watch?v=WjpswYrS2nY\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=62" },
                    { id: "94", name: "Koko eating bananas", difficulty: "Medium", leetcode: "https://leetcode.com/problems/koko-eating-bananas/", article: "https://takeuforward.org/binary-search/koko-eating-bananas/", youtube: "https://youtu.be/qyfekrNni90" },
                    { id: "95", name: "Minimum days to make M bouquets", difficulty: "Medium", leetcode: "https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/", article: "https://takeuforward.org/arrays/minimum-days-to-make-m-bouquets/", youtube: "https://youtu.be/TXAuxeYBTdg" },
                    { id: "93", name: "Find the smallest divisor", difficulty: "Medium", leetcode: "https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/", article: "https://takeuforward.org/arrays/find-the-smallest-divisor-given-a-threshold/", youtube: "https://youtu.be/UvBKTVaG6U8" },
                    { id: "161", name: "Capacity to Ship Packages Within D Days", difficulty: "Medium", leetcode: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/", article: "https://takeuforward.org/arrays/capacity-to-ship-packages-within-d-days/", youtube: "https://youtu.be/MG-Ac4TAvTY" },
                    { id: "600", name: "Kth Missing Positive Number", difficulty: "Medium", leetcode: "https://leetcode.com/problems/kth-missing-positive-number/#:~:text=Given%20an%20array%20arr%20of,13%2C...%5D.", article: "https://takeuforward.org/arrays/kth-missing-positive-number/", youtube: "https://youtu.be/uZ0N_hZpyps" },
                    { id: "73", name: "Aggressive Cows", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/aggressive-cows-detailed-solution/", youtube: "https://youtu.be/R_Mfw4ew-Vo" },
                    { id: "74", name: "Book Allocation Problem", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/allocate-minimum-number-of-pages/", youtube: "https://www.youtube.com/watch?v=gYmWHvRHu-s\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=69" },
                    { id: "79", name: "Split array - largest sum", difficulty: "Hard", leetcode: "https://leetcode.com/problems/split-array-largest-sum/", article: "https://takeuforward.org/arrays/split-array-largest-sum/", youtube: "https://www.youtube.com/watch?v=thUd_WJn6wk\\u0026list=PLgUwDviBIf0pMFMWuuvDNMAkoQFi-h0ZF\\u0026index=20" },
                    { id: "805", name: "Painter's Partition", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/arrays/painters-partition-problem/", youtube: "https://www.youtube.com/watch?v=thUd_WJn6wk\\u0026list=PLgUwDviBIf0pMFMWuuvDNMAkoQFi-h0ZF\\u0026index=20" },
                    { id: "78", name: "Minimize Max Distance to Gas Station", difficulty: "Hard", leetcode: "https://leetcode.com/problems/minimize-max-distance-to-gas-station/", article: "https://takeuforward.org/arrays/minimise-maximum-distance-between-gas-stations/", youtube: "https://www.youtube.com/watch?v=kMSBvlZ-_HA\\u0026list=PLgUwDviBIf0pMFMWuuvDNMAkoQFi-h0ZF\\u0026index=21" },
                    { id: "77", name: "Median of 2 sorted arrays", difficulty: "Hard", leetcode: "https://leetcode.com/problems/median-of-two-sorted-arrays/", article: null, youtube: "https://www.youtube.com/watch?v=NTop3VTjmxk\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=65" },
                    { id: "2767", name: "Kth element of 2 sorted arrays", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/k-th-element-of-two-sorted-arrays/", youtube: "https://youtu.be/D1oDwWCq50g" }
                ]
            },
            {
                name: "BS on 2D Arrays",
                problems: [
                    { id: "66", name: "Find row with maximum 1's", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/arrays/find-the-row-with-maximum-number-of-1s/", youtube: "https://youtu.be/SCz-1TtYxDI" },
                    { id: "69", name: "Search in a 2D matrix", difficulty: "Hard", leetcode: "https://leetcode.com/problems/search-a-2d-matrix/", article: "https://takeuforward.org/data-structure/search-in-a-sorted-2d-matrix/", youtube: "https://youtu.be/ZYpYur0znng" },
                    { id: "68", name: "Search in 2D matrix - II", difficulty: "Hard", leetcode: "https://leetcode.com/problems/search-a-2d-matrix-ii/", article: "https://takeuforward.org/arrays/search-in-a-row-and-column-wise-sorted-matrix/", youtube: "https://youtu.be/9ZbB397jU4k" },
                    { id: "67", name: "Matrix Median", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/median-of-row-wise-sorted-matrix/", youtube: "https://youtu.be/Q9wXgdxJq48?si=ScI_0uzJh7yg8nrX" }
                ]
            }
        ]
    },
    // ─── Section 5: Strings [Basic and Medium] ───
    {
        sectionIndex: 4,
        name: "Strings [Basic and Medium]",
        preCompleted: false,
        subcategories: [
            {
                name: "Basic and Easy String Problems",
                problems: [
                    { id: "892", name: "Remove Outermost Parentheses", difficulty: "Medium", leetcode: "https://leetcode.com/problems/remove-outermost-parentheses/", article: "https://takeuforward.org/data-structure/remove-outermost-parentheses", youtube: null },
                    { id: "2863", name: "Reverse words in a given string / Palindrome Check", difficulty: "Medium", leetcode: "https://leetcode.com/problems/reverse-words-in-a-string/", article: "https://takeuforward.org/data-structure/reverse-words-in-a-string/", youtube: null },
                    { id: "394", name: "Largest Odd Number in a String", difficulty: "Easy", leetcode: "https://leetcode.com/problems/largest-odd-number-in-string/", article: "https://takeuforward.org/data-structure/largest-odd-number-in-a-string", youtube: null },
                    { id: "395", name: "Longest Common Prefix", difficulty: "Easy", leetcode: "https://leetcode.com/problems/longest-common-prefix/", article: "https://takeuforward.org/data-structure/longest-common-prefix", youtube: null },
                    { id: "393", name: "Isomorphic String", difficulty: "Easy", leetcode: "https://leetcode.com/problems/isomorphic-strings/", article: "https://takeuforward.org/data-structure/isomorphic-string", youtube: null },
                    { id: "398", name: "Rotate String", difficulty: "Easy", leetcode: "https://leetcode.com/problems/rotate-string/", article: "https://takeuforward.org/data-structure/check-if-one-string-is-rotation-of-another", youtube: null },
                    { id: "2809", name: "Check if two strings are anagram of each other", difficulty: "Easy", leetcode: "https://leetcode.com/problems/valid-anagram/#:~:text=Given%20two%20strings%20s%20and,the%20original%20letters%20exactly%20once.\\u0026text=Constraints%3A,.length%20%3C%3D%205%20*%2010", article: "https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/", youtube: null }
                ]
            },
            {
                name: "Medium String Problems",
                problems: [
                    { id: "399", name: "Sort Characters by Frequency", difficulty: "Easy", leetcode: "https://leetcode.com/problems/sort-characters-by-frequency/", article: "https://takeuforward.org/data-structure/sort-characters-by-frequency", youtube: null },
                    { id: "674", name: "Maximum Nesting Depth of the Parentheses", difficulty: "Medium", leetcode: "https://leetcode.com/problems/maximum-nesting-depth-of-the-parentheses/", article: "https://takeuforward.org/data-structure/maximum-nesting-depth-of-parenthesis", youtube: null },
                    { id: "903", name: "Roman to Integer", difficulty: "Medium", leetcode: "https://leetcode.com/problems/roman-to-integer/", article: "https://takeuforward.org/data-structure/roman-numerals-to-integer", youtube: null },
                    { id: "974", name: "String to Integer (atoi)", difficulty: "Medium", leetcode: "https://leetcode.com/problems/string-to-integer-atoi/", article: "https://takeuforward.org/data-structure/recursive-implementation-of-atoi", youtube: null },
                    { id: "2394", name: "Count Number of Substrings", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/count-number-of-substrings", youtube: null },
                    { id: "638", name: "Longest Palindromic Substring", difficulty: "Medium", leetcode: "https://leetcode.com/problems/longest-palindromic-substring/", article: null, youtube: null },
                    { id: "993", name: "Sum of Beauty of All Substrings", difficulty: "Medium", leetcode: "https://leetcode.com/problems/sum-of-beauty-of-all-substrings/", article: "https://takeuforward.org/data-structure/sum-of-beauty-of-all-substring", youtube: null },
                    { id: "984", name: "Reverse every word in a string", difficulty: "Medium", leetcode: "https://leetcode.com/problems/reverse-words-in-a-string/", article: "https://takeuforward.org/data-structure/reverse-words-in-a-string/", youtube: null }
                ]
            }
        ]
    },
    // ─── Section 6: Learn LinkedList [Single LL, Double LL, Medium, Hard Problems] ───
    {
        sectionIndex: 5,
        name: "Learn LinkedList [Single LL, Double LL, Medium, Hard Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Learn 1D LinkedList",
                problems: [
                    { id: "1237", name: "Introduction to Singly LinkedList", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/linked-list/linked-list-introduction", youtube: "https://youtu.be/Nq7ok-OyEpg?si=9PR1o8OPRWil7fRA" },
                    { id: "356", name: "Insertion at the head of Linked List", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/linked-list/insert-at-the-head-of-a-linked-list", youtube: "https://youtu.be/VaECK03Dz-g?si=vHSwdf9jhE05adKM\\u0026t=1934" },
                    { id: "352", name: "Deletion of the head of LL", difficulty: "Easy", leetcode: "https://leetcode.com/problems/delete-node-in-a-linked-list/", article: "https://takeuforward.org/data-structure/delete-last-node-of-linked-list/", youtube: "https://youtu.be/VaECK03Dz-g?si=CRaBHbOo2bHFbOT5" },
                    { id: "470", name: "Find the length of the Linked List", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/linked-list/find-the-length-of-a-linked-list", youtube: "https://youtu.be/Nq7ok-OyEpg?si=xqQbukLfo2oZ6C6s\\u0026t=2240" },
                    { id: "905", name: "Search in Linked List", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/linked-list/search-an-element-in-a-linked-list", youtube: "https://youtu.be/Nq7ok-OyEpg?si=WNXcIaXZ_B6cNq0s\\u0026t=2524" }
                ]
            },
            {
                name: "Learn Doubly LinkedList",
                problems: [
                    { id: "1234", name: "Introduction to Doubly LL", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/linked-list/introduction-to-doubly-linked-list", youtube: "https://youtu.be/0eKMU10uEDI?si=uDnoj_C5ghEpNLvP" },
                    { id: "361", name: "Insert node before head in Doubly Linked List", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/insert-at-end-of-doubly-linked-list/", youtube: "https://youtu.be/0eKMU10uEDI?si=J5a0pQTosimcO_aA\\u0026t=2684" },
                    { id: "348", name: "Delete head of Doubly Linked List", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/delete-last-node-of-a-doubly-linked-list/", youtube: "https://youtu.be/0eKMU10uEDI?si=sE7jqrW46lfRHVLd\\u0026t=853" },
                    { id: "900", name: "Reverse a Doubly Linked List", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/reverse-a-doubly-linked-list/", youtube: "https://youtu.be/u3WUW2qe6ww?si=96Wwlju72IvmzkxE" }
                ]
            },
            {
                name: "Medium Problems of LL",
                problems: [
                    { id: "2810", name: "Middle of a LinkedList [TortoiseHare Method]", difficulty: "easy", leetcode: "https://leetcode.com/problems/middle-of-the-linked-list/", article: "https://takeuforward.org/data-structure/find-middle-element-in-a-linked-list/", youtube: "https://youtu.be/7LjQ57RqgEc?si=ir_rRDio38rhamU_" },
                    { id: "2850", name: "Reverse a LinkedList [Iterative]", difficulty: "Medium", leetcode: "https://leetcode.com/problems/reverse-linked-list/", article: "https://takeuforward.org/data-structure/reverse-a-linked-list/", youtube: "https://youtu.be/D2vI2DNJGd8?si=RCaLSx01qR21IBdh" },
                    { id: "627", name: "Reverse a LL", difficulty: "Medium", leetcode: "https://leetcode.com/problems/reverse-linked-list/", article: "https://takeuforward.org/data-structure/reverse-a-linked-list/", youtube: "https://youtu.be/D2vI2DNJGd8?si=RCaLSx01qR21IBdh" },
                    { id: "2847", name: "Find the starting point in LL", difficulty: "Medium", leetcode: "https://leetcode.com/problems/linked-list-cycle-ii/", article: "https://takeuforward.org/data-structure/starting-point-of-loop-in-a-linked-list/", youtube: "https://youtu.be/2Kd0KKmmHFc?si=7UreDPRjRvapeVB0" },
                    { id: "623", name: "Length of loop in LL", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/linked-list/length-of-loop-in-linked-list", youtube: "https://youtu.be/I4g1qbkTPus?si=ONktpqewvx57T8pF" },
                    { id: "2844", name: "Check if LL is palindrome or not", difficulty: "Medium", leetcode: "https://leetcode.com/problems/palindrome-linked-list/", article: "https://takeuforward.org/data-structure/check-if-given-linked-list-is-plaindrome/", youtube: "https://youtu.be/lRY_G-u_8jk?si=BpM8hRYvXSYyjl-G" },
                    { id: "628", name: "Segregate odd and even nodes in Linked List", difficulty: "Medium", leetcode: "https://leetcode.com/problems/odd-even-linked-list/", article: "https://takeuforward.org/data-structure/segregate-even-and-odd-nodes-in-linkedlist", youtube: "https://youtu.be/qf6qp7GzD5Q?si=JozAyXUdT8EJMSCQ" },
                    { id: "2849", name: "Remove Nth node from the back of the LL", difficulty: "Medium", leetcode: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", article: "https://takeuforward.org/data-structure/remove-n-th-node-from-the-end-of-a-linked-list/", youtube: "https://youtu.be/3kMKYQ2wNIU?si=DtFDnPU7z9HMz_GM" },
                    { id: "619", name: "Delete the middle node in LL", difficulty: "Medium", leetcode: "https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/#:~:text=You%20are%20given%20the%20head,than%20or%20equal%20to%20x%20.", article: "https://takeuforward.org/linked-list/delete-the-middle-node-of-the-linked-list", youtube: "https://youtu.be/ePpV-_pfOeI?si=Au9GsZkVO57j6SiN" },
                    { id: "616", name: "Sort LL", difficulty: "Hard", leetcode: "https://leetcode.com/problems/sort-list/", article: "https://takeuforward.org/linked-list/sort-a-linked-list", youtube: "https://youtu.be/8ocB7a_c-Cc?si=Gv-Y8q8-WyARoV35" },
                    { id: "629", name: "Sort a Linked List of 0's 1's and 2's", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/sort-a-linked-list-of-0s-1s-and-2s-by-changing-links", youtube: "https://youtu.be/gRII7LhdJWc?si=l3qRC7w3NhY7OAqw" },
                    { id: "617", name: "Add one to a number represented by LL", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/add-1-to-a-number-represented-by-ll", youtube: "https://youtu.be/aXQWhbvT3w0?si=uRgU9S4r5cVmnUy7" },
                    { id: "625", name: "Add two numbers in Linked List", difficulty: "Medium", leetcode: "https://leetcode.com/problems/add-two-numbers/", article: "https://takeuforward.org/data-structure/add-two-numbers-represented-as-linked-lists/", youtube: "https://www.youtube.com/watch?v=LBVsXSMOIk4\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=32" }
                ]
            },
            {
                name: "Medium Problems of DLL",
                problems: [
                    { id: "609", name: "Delete all occurrences of a key in DLL", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/delete-all-occurrences-of-a-key-in-dll", youtube: "https://youtu.be/Mh0NH_SD92k?si=tCYshBRi1upMqSVz" },
                    { id: "452", name: "Find Pairs with Given Sum in Doubly Linked List", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/find-pairs-with-given-sum-in-doubly-linked-list", youtube: "https://youtu.be/YitR4dQsddE?si=iZAC259hdngV_OxC" },
                    { id: "610", name: "Remove duplicates from sorted DLL", difficulty: "hard", leetcode: null, article: "https://takeuforward.org/data-structure/remove-duplicates-from-sorted-dll", youtube: "https://youtu.be/YJKVTnOJXSY?si=AsZoNUoewetsBjr0" }
                ]
            },
            {
                name: "Hard Problems of LL",
                problems: [
                    { id: "2842", name: "Reverse LL in group of given size K", difficulty: "Hard", leetcode: "https://leetcode.com/problems/reverse-nodes-in-k-group/", article: "https://takeuforward.org/data-structure/reverse-linked-list-in-groups-of-size-k/", youtube: "https://youtu.be/lIar1skcQYI?si=_jFghHKX4eaK36a1" },
                    { id: "2843", name: "Rotate a LL", difficulty: "Hard", leetcode: "https://leetcode.com/problems/rotate-list/description/", article: "https://takeuforward.org/data-structure/rotate-a-linked-list/", youtube: "https://youtu.be/uT7YI7XbTY8?si=ZaChW3a68c_v54Is" },
                    { id: "2841", name: "Flattening of LL", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/flattening-a-linked-list/", youtube: "https://youtu.be/ykelywHJWLg?si=InMg9MmTHzY22NSR" }
                ]
            }
        ]
    },
    // ─── Section 7: Recursion [PatternWise] ───
    {
        sectionIndex: 6,
        name: "Recursion [PatternWise]",
        preCompleted: false,
        subcategories: [
            {
                name: "Get a Strong Hold",
                problems: [
                    { id: "2862", name: "Recursive Implementation of atoi()", difficulty: "Medium", leetcode: "https://leetcode.com/problems/string-to-integer-atoi/", article: "https://takeuforward.org/data-structure/recursive-implementation-of-atoi", youtube: null },
                    { id: "2855", name: "Pow(x, n)", difficulty: "Easy", leetcode: "https://leetcode.com/problems/powx-n/", article: "https://takeuforward.org/data-structure/implement-powxn-x-raised-to-the-power-n/", youtube: "https://youtu.be/l0YC3876qxg" },
                    { id: "222", name: "Count Good Numbers", difficulty: "Medium", leetcode: "https://leetcode.com/problems/count-good-numbers/", article: "https://takeuforward.org/data-structure/count-good-numbers", youtube: null },
                    { id: "2858", name: "Sort a stack using recursion", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/sort-a-stack", youtube: null },
                    { id: "901", name: "Reverse a Stack", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/reverse-a-stack-using-recursion", youtube: null }
                ]
            },
            {
                name: "Subsequences Pattern",
                problems: [
                    { id: "493", name: "Generate Binary Strings Without Consecutive 1s", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/generate-all-binary-strings", youtube: null },
                    { id: "876", name: "Generate Parentheses", difficulty: "Medium", leetcode: "https://leetcode.com/problems/generate-parentheses/", article: "https://takeuforward.org/data-structure/generate-parenthesis", youtube: null },
                    { id: "878", name: "Power Set", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/power-set-print-all-the-possible-subsequences-of-the-string/", youtube: "https://www.youtube.com/watch?v=b7AYbpM5YrE\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=67" },
                    { id: "2400", name: "Learn All Patterns of Subsequences (Theory)", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/learn-all-patterns-of-subsequences-theory", youtube: "https://www.youtube.com/watch?v=eQCS_v3bw0Q\\u0026list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9\\u0026index=7" },
                    { id: "880", name: "Count all subsequences with sum K", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/count-all-subsequences-with-sum-k", youtube: null },
                    { id: "879", name: "Check if there exists a subsequence with sum K", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/check-if-there-exists-a-subsequence-with-sum-k", youtube: null },
                    { id: "864", name: "Combination Sum", difficulty: "Medium", leetcode: "https://leetcode.com/problems/combination-sum/", article: "https://takeuforward.org/data-structure/combination-sum-1/", youtube: "https://www.youtube.com/watch?v=OyZFFqQtu98\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=49" },
                    { id: "865", name: "Combination Sum II", difficulty: "Medium", leetcode: "https://leetcode.com/problems/combination-sum-ii/", article: "https://takeuforward.org/data-structure/combination-sum-ii-find-all-unique-combinations/", youtube: "https://www.youtube.com/watch?v=G1fRTGRxXU8\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=50" },
                    { id: "867", name: "Subsets I", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/subset-sum-sum-of-all-subsets/", youtube: "https://www.youtube.com/watch?v=rYkfBRtMJr8\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=52" },
                    { id: "868", name: "Subsets II", difficulty: "Medium", leetcode: "https://leetcode.com/problems/subsets-ii/", article: "https://takeuforward.org/data-structure/subset-ii-print-all-the-unique-subsets/", youtube: "https://www.youtube.com/watch?v=RIn3gOkbhQE\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=53" },
                    { id: "866", name: "Combination Sum III", difficulty: "Medium", leetcode: "https://leetcode.com/problems/combination-sum-iii/", article: "https://takeuforward.org/data-structure/combination-sum-iii", youtube: null },
                    { id: "875", name: "Letter Combinations of a Phone Number", difficulty: "Hard", leetcode: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/", article: "https://takeuforward.org/data-structure/letter-combinations-of-a-phone-number", youtube: null }
                ]
            },
            {
                name: "Trying out all Combos / Hard",
                problems: [
                    { id: "871", name: "Palindrome partitioning", difficulty: "Hard", leetcode: null, article: null, youtube: "https://youtu.be/_H8V5hJUGd0" },
                    { id: "874", name: "Word Search", difficulty: "Hard", leetcode: "https://leetcode.com/problems/word-search/", article: "https://takeuforward.org/data-structure/word-search-leetcode/", youtube: null },
                    { id: "872", name: "Rat in a Maze", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/rat-in-a-maze/", youtube: "https://www.youtube.com/watch?v=bLGZhJlt4y0\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=60" },
                    { id: "4", name: "Word Break", difficulty: "Medium", leetcode: null, article: null, youtube: null },
                    { id: "869", name: "M Coloring Problem", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/m-coloring-problem/", youtube: "https://www.youtube.com/watch?v=wuVwUK25Rfc\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=59" },
                    { id: "873", name: "Sudoku Solver", difficulty: "Hard", leetcode: "https://leetcode.com/problems/sudoku-solver/", article: "https://takeuforward.org/data-structure/sudoku-solver/", youtube: "https://www.youtube.com/watch?v=FWAIf_EVUKE\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=58" },
                    { id: "3", name: "Expression Add Operators", difficulty: "Hard", leetcode: "https://leetcode.com/problems/expression-add-operators/", article: "https://takeuforward.org/data-structure/expression-add-operators", youtube: null }
                ]
            }
        ]
    },
    // ─── Section 8: Bit Manipulation [Concepts & Problems] ───
    {
        sectionIndex: 7,
        name: "Bit Manipulation [Concepts & Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Learn Bit Manipulation",
                problems: [
                    { id: "1155", name: "Introduction to Bits and Tricks", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/introduction-to-bit-manipulation-theory", youtube: "https://youtu.be/qQd-ViW7bfk?si=QtdNaRhHmZb08Mr8" },
                    { id: "177", name: "Check if the i-th bit is Set or Not", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/check-if-the-i-th-bit-is-set-or-not", youtube: "https://youtu.be/nttpF8kwgd4?si=x9o8PsYaA2XVZ9rV" },
                    { id: "171", name: "Check if a Number is Odd or Not", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/check-if-a-number-is-odd-or-not", youtube: "https://youtu.be/nttpF8kwgd4?si=x9o8PsYaA2XVZ9rV" },
                    { id: "172", name: "Check if a Number is Power of 2 or Not", difficulty: "Easy", leetcode: "https://leetcode.com/problems/power-of-two/", article: "https://takeuforward.org/data-structure/check-if-a-number-is-power-of-2-or-not", youtube: "https://youtu.be/nttpF8kwgd4?si=x9o8PsYaA2XVZ9rV" },
                    { id: "2410", name: "Set/Unset the rightmost unset bit", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/set-the-rightmost-bit", youtube: "https://youtu.be/nttpF8kwgd4?si=x9o8PsYaA2XVZ9rV" },
                    { id: "1005", name: "Swap Two Numbers", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/swap-two-numbers", youtube: "https://youtu.be/nttpF8kwgd4?si=x9o8PsYaA2XVZ9rV" },
                    { id: "140", name: "Divide two numbers without multiplication and division", difficulty: "Medium", leetcode: "https://leetcode.com/problems/divide-two-integers/", article: "https://takeuforward.org/data-structure/divide-two-integers-without-using-multiplication-division-and-mod-operator", youtube: "https://youtu.be/pBD4B1tzgVc?si=G9c5pEE-RrzeU6sz" }
                ]
            },
            {
                name: "Interview Problems",
                problems: [
                    { id: "141", name: "Minimum Bit Flips to Convert Number", difficulty: "Medium", leetcode: "https://leetcode.com/problems/minimum-bit-flips-to-convert-number/", article: "https://takeuforward.org/data-structure/count-number-of-bits-to-be-flipped-to-convert-a-to-b", youtube: "https://youtu.be/OOdrmcfZXd8?si=rnkRVz1UiVBKWC69" },
                    { id: "143", name: "Single Number - I", difficulty: "Medium", leetcode: "https://leetcode.com/problems/single-number/", article: "https://takeuforward.org/arrays/find-the-number-that-appears-once-and-the-other-numbers-twice/", youtube: "https://youtu.be/bYWLJb3vCWY?t=1369" },
                    { id: "142", name: "Power Set Bit Manipulation", difficulty: "Medium", leetcode: "https://leetcode.com/problems/subsets/", article: "https://takeuforward.org/bit-manipulation/power-set-bit-manipulation", youtube: "https://youtu.be/LqKaUv1G3_I?si=UXU_T5OsHiokPRvP" },
                    { id: "146", name: "XOR of numbers in a given range", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/find-xor-of-numbers-from-l-to-r", youtube: "https://youtu.be/WqGb7159h7Q?si=uGUEbNUUaIN_6Vvr" },
                    { id: "145", name: "Single Number - III", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/find-the-two-numbers-appearing-odd-number-of-times", youtube: "https://youtu.be/UA5JnV1J2sI?si=VFBRJyb3boZvx_r1" }
                ]
            },
            {
                name: "Advanced Maths",
                problems: [
                    { id: "370", name: "Divisors of a Number", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/print-all-divisors-of-a-given-number/", youtube: "https://youtu.be/1xNbjMdbjug?t=1580" },
                    { id: "651", name: "Count primes in range L to R", difficulty: "Hard", leetcode: "https://leetcode.com/problems/count-primes/", article: "https://takeuforward.org/data-structure/sieve-of-eratosthenes", youtube: "https://youtu.be/g5Fuxn_AvSk?si=fv6Q-Po7wrMW0a5n" },
                    { id: "652", name: "Prime factorisation of a Number", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/find-the-two-numbers-appearing-odd-number-of-times", youtube: "https://youtu.be/LT7XhVdeRyg?si=6HkjQokJRPTFai21" },
                    { id: "877", name: "Pow(x,n)", difficulty: "Easy", leetcode: "https://leetcode.com/problems/powx-n/", article: "https://takeuforward.org/data-structure/implement-powxn-x-raised-to-the-power-n/", youtube: "https://youtu.be/l0YC3876qxg" }
                ]
            }
        ]
    },
    // ─── Section 9: Stack and Queues [Learning, Pre-In-Post-fix, Monotonic Stack, Implementation] ───
    {
        sectionIndex: 8,
        name: "Stack and Queues [Learning, Pre-In-Post-fix, Monotonic Stack, Implementation]",
        preCompleted: false,
        subcategories: [
            {
                name: "Learning",
                problems: [
                    { id: "390", name: "Implement Stack using Arrays", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/implement-stack-using-array/", youtube: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w" },
                    { id: "387", name: "Implement Queue using Arrays", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/implement-queue-using-array/", youtube: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w" },
                    { id: "392", name: "Implement Stack using Queue", difficulty: "Easy", leetcode: "https://leetcode.com/problems/implement-stack-using-queues/", article: "https://takeuforward.org/data-structure/implement-stack-using-single-queue", youtube: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w" },
                    { id: "389", name: "Implement Queue using Stack", difficulty: "Easy", leetcode: "https://leetcode.com/problems/implement-queue-using-stacks/", article: "https://takeuforward.org/data-structure/implement-queue-using-stack/", youtube: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w" },
                    { id: "391", name: "Implement stack using Linkedlist", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/implement-stack-using-linked-list/", youtube: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w" },
                    { id: "388", name: "Implement queue using Linkedlist", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/implement-queue-using-linked-list/", youtube: "https://youtu.be/tqQ5fTamIN4?si=ofLt8Zt1ZvhikZ6w" },
                    { id: "966", name: "Balanced Paranthesis", difficulty: "Easy", leetcode: "https://leetcode.com/problems/valid-parentheses/", article: "https://takeuforward.org/data-structure/check-for-balanced-parentheses/", youtube: "https://youtu.be/xwjS0iZhw4I?si=UoyKpFn4Q3nf5h2R" },
                    { id: "958", name: "Implement Min Stack", difficulty: "Hard", leetcode: "https://leetcode.com/problems/min-stack/", article: "https://takeuforward.org/data-structure/implement-min-stack-o2n-and-on-space-complexity/", youtube: "https://youtu.be/NdDIaH91P0g?si=4_Jbsq5trFvfSdUY" }
                ]
            },
            {
                name: "Prefix, Infix, PostFix Conversion Problems",
                problems: [
                    { id: "586", name: "Infix to Postfix Conversion", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/infix-to-postfix/", youtube: "https://youtu.be/4pIc9UBHJtk?si=ryeVvQWpCgwbTQrh" },
                    { id: "848", name: "Prefix to Infix Conversion", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/prefix-to-infix-conversion", youtube: "https://youtu.be/4pIc9UBHJtk?si=ryeVvQWpCgwbTQrh" },
                    { id: "849", name: "Prefix to Postfix Conversion", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/prefix-to-postfix-conversion", youtube: "https://youtu.be/4pIc9UBHJtk?si=0pWtyDC1GhbiYP3P" },
                    { id: "825", name: "Postfix to Prefix Conversion", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/postfix-to-prefix-conversion", youtube: "https://youtu.be/4pIc9UBHJtk?si=0pWtyDC1GhbiYP3P" },
                    { id: "824", name: "Postfix to Infix Conversion", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/postfix-to-infix", youtube: "https://youtu.be/4pIc9UBHJtk?si=0pWtyDC1GhbiYP3P" },
                    { id: "587", name: "Infix to Prefix Conversion", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/infix-to-prefix/", youtube: "https://youtu.be/4pIc9UBHJtk?si=0pWtyDC1GhbiYP3P" }
                ]
            },
            {
                name: "Monotonic Stack/Queue Problems [VVV. Imp]",
                problems: [
                    { id: "968", name: "Next Greater Element", difficulty: "Medium", leetcode: "https://leetcode.com/problems/next-greater-element-i/", article: "https://takeuforward.org/data-structure/next-greater-element-using-stack/", youtube: "https://youtu.be/e7XQLtOQM3I?si=QdcHpTtx6gAHsext" },
                    { id: "969", name: "Next Greater Element - 2", difficulty: "Medium", leetcode: "https://leetcode.com/problems/next-greater-element-ii/", article: "https://takeuforward.org/data-structure/next-greater-element-2", youtube: "https://youtu.be/7PrncD7v9YQ?si=UkBc7eVy9HGlBpeW" },
                    { id: "768", name: "Next Smaller Element", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/next-smaller-element", youtube: null },
                    { id: "285", name: "Number of Greater Elements to the Right", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/number-of-nges-to-the-right", youtube: null },
                    { id: "965", name: "Trapping Rainwater", difficulty: "Hard", leetcode: "https://leetcode.com/problems/trapping-rain-water/", article: "https://takeuforward.org/data-structure/trapping-rainwater/", youtube: "https://youtu.be/1_5VuquLbXg?si=NFG6df318_6OtGvg" },
                    { id: "971", name: "Sum of Subarray Minimums", difficulty: "Medium", leetcode: "https://leetcode.com/problems/sum-of-subarray-minimums/", article: "https://takeuforward.org/data-structure/sum-of-subarray-minimums", youtube: "https://youtu.be/v0e8p9JCgRc?si=XAU7ekECgS5nboRw" },
                    { id: "967", name: "Asteroid Collision", difficulty: "Medium", leetcode: "https://leetcode.com/problems/asteroid-collision/", article: "https://takeuforward.org/data-structure/asteroid-collision", youtube: "https://youtu.be/_eYGqw_VDR4?si=YyxibcHq800RqgIQ" },
                    { id: "972", name: "Sum of Subarray Ranges", difficulty: "Medium", leetcode: "https://leetcode.com/problems/sum-of-subarray-ranges/", article: "https://takeuforward.org/data-structure/sum-of-subarray-ranges", youtube: "https://youtu.be/gIrMptNPf5M?si=Q_GHuBvzZVs27X_U" },
                    { id: "970", name: "Remove K Digits", difficulty: "Medium", leetcode: "https://leetcode.com/problems/remove-k-digits/", article: "https://takeuforward.org/data-structure/remove-k-digits", youtube: "https://youtu.be/jmbuRzYPGrg?si=WN387gwQ7aXWkUao" },
                    { id: "959", name: "Largest rectangle in a histogram", difficulty: "Hard", leetcode: "https://leetcode.com/problems/largest-rectangle-in-histogram/", article: "https://takeuforward.org/data-structure/area-of-largest-rectangle-in-histogram/", youtube: "https://youtu.be/Bzat9vgD0fs?si=DiBlLejXcr6EJoyB" },
                    { id: "962", name: "Maximum Rectangles", difficulty: "Hard", leetcode: "https://leetcode.com/problems/maximal-rectangle/", article: "https://takeuforward.org/data-structure/maximum-rectangle-area-with-all-1s-dp-on-rectangles-dp-55/", youtube: "https://youtu.be/tOylVCugy9k" },
                    { id: "963", name: "Sliding Window Maximum", difficulty: "Hard", leetcode: "https://leetcode.com/problems/sliding-window-maximum/", article: "https://takeuforward.org/data-structure/sliding-window-maximum/", youtube: "https://youtu.be/NwBvene4Imo?si=eU1PY-bcQfk5wdog" },
                    { id: "964", name: "Stock span problem", difficulty: "Hard", leetcode: "https://leetcode.com/problems/online-stock-span/", article: "https://takeuforward.org/data-structure/stock-span-problem", youtube: "https://youtu.be/eay-zoSRkVc?si=deNNe5i38BOAntha" },
                    { id: "957", name: "Celebrity Problem", difficulty: "Hard", leetcode: "https://leetcode.com/accounts/login/?next=/problems/find-the-celebrity/", article: "https://takeuforward.org/data-structure/celebrity-problem", youtube: "https://youtu.be/cEadsbTeze4?si=olXYfOs7l-SEn2zl" },
                    { id: "961", name: "LRU Cache", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/program-for-least-recently-used-lru-page-replacement-algorithm", youtube: null },
                    { id: "960", name: "LFU Cache", difficulty: "Hard", leetcode: "https://leetcode.com/problems/lfu-cache/", article: "https://takeuforward.org/data-structure/lfu-cache", youtube: "https://www.youtube.com/watch?v=0PSB9y8ehbk\\u0026list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma\\u0026index=79" }
                ]
            }
        ]
    },
    // ─── Section 10: Sliding Window & Two Pointer Combined Problems ───
    {
        sectionIndex: 9,
        name: "Sliding Window & Two Pointer Combined Problems",
        preCompleted: false,
        subcategories: [
            {
                name: "Medium Problems",
                problems: [
                    { id: "2857", name: "Longest Substring Without Repeating Characters", difficulty: "Medium", leetcode: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", article: "https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-character/", youtube: "https://youtu.be/-zSxTJkcdAo?si=I2zfR-vlDMg0zU9z" },
                    { id: "930", name: "Max Consecutive Ones III", difficulty: "Medium", leetcode: "https://leetcode.com/problems/max-consecutive-ones-iii/", article: "https://takeuforward.org/data-structure/max-consecutive-ones-iii", youtube: "https://youtu.be/3E4JBHSLpYk?si=SoOW64pP6otEKxBw" },
                    { id: "926", name: "Fruit Into Baskets", difficulty: "Medium", leetcode: "https://leetcode.com/problems/fruit-into-baskets/description/", article: "https://takeuforward.org/data-structure/fruit-into-baskets", youtube: "https://youtu.be/e3bs0uA1NhQ?si=gR8pO62u-nJeFAXk" },
                    { id: "927", name: "Longest Repeating Character Replacement", difficulty: "Hard", leetcode: "https://leetcode.com/problems/longest-repeating-character-replacement/", article: "https://takeuforward.org/data-structure/longest-repeating-character-replacement", youtube: "https://youtu.be/_eNhaDCr6P0?si=pBWcEjozF5poom0p" },
                    { id: "923", name: "Binary Subarrays With Sum", difficulty: "Hard", leetcode: "https://leetcode.com/problems/binary-subarrays-with-sum/", article: "https://takeuforward.org/data-structure/binary-subarray-with-sum", youtube: "https://youtu.be/XnMdNUkX6VM?si=Nyt8EveeLUg8lmty" },
                    { id: "924", name: "Count number of Nice subarrays", difficulty: "Hard", leetcode: "https://leetcode.com/problems/count-number-of-nice-subarrays/", article: "https://takeuforward.org/data-structure/count-number-of-nice-subarrays", youtube: "https://youtu.be/j_QOv9OT9Og?si=Oq5-5hyFkzVSOZpP" },
                    { id: "925", name: "Number of Substrings Containing All Three Characters", difficulty: "Hard", leetcode: "https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/", article: "https://takeuforward.org/data-structure/number-of-substring-containing-all-three-characters", youtube: "https://youtu.be/xtqN4qlgr8s?si=kuaLHVOLXhh5Z2tW" },
                    { id: "922", name: "Maximum Points You Can Obtain from Cards", difficulty: "Medium", leetcode: "https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/", article: "https://takeuforward.org/data-structure/maximum-point-you-can-obtain-from-cards", youtube: "https://youtu.be/pBWCOCS636U?si=-X64rY67noxvOwrG" }
                ]
            },
            {
                name: "Hard Problems",
                problems: [
                    { id: "928", name: "Longest Substring With At Most K Distinct Characters", difficulty: "Hard", leetcode: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/", article: "https://takeuforward.org/data-structure/longest-substring-with-at-most-k-distinct-characters", youtube: "https://youtu.be/teM9ZsVRQyc?si=Kh0_u6aCkkBU3Q33" },
                    { id: "988", name: "Subarrays with K Different Integers", difficulty: "Medium", leetcode: "https://leetcode.com/problems/subarrays-with-k-different-integers/", article: "https://takeuforward.org/data-structure/subarray-with-k-different-integers", youtube: "https://youtu.be/7wYGbV_LsX4?si=KWa48RgLDCvdNqRb" },
                    { id: "931", name: "Minimum Window Substring", difficulty: "Hard", leetcode: "https://leetcode.com/problems/minimum-window-substring/", article: null, youtube: "https://youtu.be/WJaij9ffOIY?si=-xnsWIH84zWU0ICd" },
                    { id: "754", name: "Minimum Window Subsequence", difficulty: "Hard", leetcode: "https://leetcode.com/problems/minimum-window-subsequence/", article: null, youtube: null }
                ]
            }
        ]
    },
    // ─── Section 11: Heaps [Learning, Medium, Hard Problems] ───
    {
        sectionIndex: 10,
        name: "Heaps [Learning, Medium, Hard Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Learning",
                problems: [
                    { id: "576", name: "Implement Min Heap", difficulty: "Medium", leetcode: null, article: null, youtube: null },
                    { id: "571", name: "Check if an array represents a min heap", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/check-if-an-array-represents-a-min-heap", youtube: null },
                    { id: "572", name: "Convert Min Heap to Max Heap", difficulty: "Medium", leetcode: null, article: null, youtube: null }
                ]
            },
            {
                name: "Medium Problems",
                problems: [
                    { id: "578", name: "K-th Largest element in an array", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/kth-largest-smallest-element-in-an-array/", youtube: null },
                    { id: "2409", name: "Sort K sorted array", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/sort-k-sorted-array", youtube: null },
                    { id: "569", name: "Merge K sorted Lists", difficulty: "Hard", leetcode: "https://leetcode.com/problems/merge-k-sorted-lists/", article: "https://takeuforward.org/data-structure/merge-m-sorted-lists", youtube: null },
                    { id: "898", name: "Replace Elements by Their Rank", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/replace-elements-by-its-rank-in-the-array/", youtube: null },
                    { id: "1008", name: "Task Scheduler", difficulty: "Medium", leetcode: "https://leetcode.com/problems/task-scheduler/", article: "https://takeuforward.org/data-structure/task-scheduler", youtube: null },
                    { id: "556", name: "Hand of Straights", difficulty: "Medium", leetcode: "https://leetcode.com/problems/hand-of-straights/", article: "https://takeuforward.org/data-structure/hands-of-straights", youtube: null }
                ]
            },
            {
                name: "Hard Problems",
                problems: [
                    { id: "565", name: "Design Twitter", difficulty: "Medium", leetcode: "https://leetcode.com/problems/design-twitter/", article: "https://takeuforward.org/data-structure/design-twitter", youtube: null },
                    { id: "2838", name: "Kth largest element in a stream of running integers", difficulty: "Hard", leetcode: "https://leetcode.com/problems/kth-largest-element-in-a-stream/#:~:text=Implement%20KthLargest%20class%3A,largest%20element%20in%20the%20stream.", article: "https://takeuforward.org/data-structure/kth-largest-element-in-a-stream-of-running-integers", youtube: null },
                    { id: "568", name: "Maximum Sum Combination", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/maximum-sum-combination", youtube: null },
                    { id: "566", name: "Find Median from Data Stream", difficulty: "Hard", leetcode: "https://leetcode.com/problems/find-median-from-data-stream/", article: "https://takeuforward.org/data-structure/find-median-from-data-stream", youtube: null },
                    { id: "1018", name: "Top K Frequent Elements", difficulty: "Medium", leetcode: "https://leetcode.com/problems/top-k-frequent-elements/", article: "https://takeuforward.org/data-structure/top-k-frequent-elements", youtube: null }
                ]
            }
        ]
    },
    // ─── Section 12: Greedy Algorithms [Easy, Medium/Hard] ───
    {
        sectionIndex: 11,
        name: "Greedy Algorithms [Easy, Medium/Hard]",
        preCompleted: false,
        subcategories: [
            {
                name: "Easy Problems",
                problems: [
                    { id: "2834", name: "Assign Cookies", difficulty: "Easy", leetcode: "https://leetcode.com/problems/assign-cookies/", article: "https://takeuforward.org/data-structure/assign-cookies", youtube: "https://youtu.be/DIX2p7vb9co?si=GofAIDimue-Av0Fi" },
                    { id: "489", name: "Fractional Knapsack", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/fractional-knapsack-problem-greedy-approach/", youtube: "https://youtu.be/1ibsQrnuEEg?si=8R2By3wpHo0zZVHE" },
                    { id: "543", name: "Lemonade Change", difficulty: "Easy", leetcode: "https://leetcode.com/problems/lemonade-change/", article: "https://takeuforward.org/Greedy/lemonade-change", youtube: "https://youtu.be/n_tmibEhO6Q?si=q1NW8MfPy0QU6fIl" },
                    { id: "545", name: "Valid Paranthesis Checker", difficulty: "Hard", leetcode: "https://leetcode.com/problems/valid-parenthesis-string/", article: "https://takeuforward.org/data-structure/valid-paranthesis-checker", youtube: "https://youtu.be/cHT6sG_hUZI?si=XRHeyh7jOaLaTy3g" }
                ]
            },
            {
                name: "Medium/Hard",
                problems: [
                    { id: "549", name: "N meetings in one room", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/n-meetings-in-one-room/", youtube: "https://youtu.be/mKfhTotEguk?si=2RELeq18mpmIIN3Q" },
                    { id: "542", name: "Jump Game - I", difficulty: "Easy", leetcode: "https://leetcode.com/problems/jump-game/", article: "https://takeuforward.org/Greedy/jump-game-i", youtube: "https://youtu.be/tZAa_jJ3SwQ?si=voKd7n9VTLDRRNzJ" },
                    { id: "595", name: "Jump Game II", difficulty: "Medium", leetcode: "https://leetcode.com/problems/jump-game-ii/", article: "https://takeuforward.org/data-structure/jump-game-2", youtube: "https://youtu.be/7SBVnw7GSTk?si=9uUouBELh9K3m2jZ" },
                    { id: "548", name: "Minimum number of platforms required for a railway", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/minimum-number-of-platforms-required-for-a-railway/", youtube: "https://youtu.be/AsGzwR_FWok?si=165acXU_dtqOHuo9" },
                    { id: "547", name: "Job sequencing Problem", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/job-sequencing-problem/", youtube: "https://youtu.be/QbwltemZbRg?si=wvcemJ5BLPlTRmkG" },
                    { id: "544", name: "Candy", difficulty: "Hard", leetcode: "https://leetcode.com/problems/candy/", article: "https://takeuforward.org/data-structure/candy", youtube: "https://youtu.be/IIqVFvKE6RY?si=EjmuXZJNLQLUkEd7" },
                    { id: "551", name: "Shortest Job First", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/Greedy/shortest-job-first-or-sjf-cpu-scheduling", youtube: "https://youtu.be/3-QbX1iDbXs?si=IH8QZUblr01F7UoQ" },
                    { id: "2859", name: "Program for Least Recently Used (LRU) Page Replacement Algorithm", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/program-for-least-recently-used-lru-page-replacement-algorithm", youtube: null },
                    { id: "546", name: "Insert Interval", difficulty: "Medium", leetcode: "https://leetcode.com/problems/insert-interval/", article: "https://takeuforward.org/?s=Insert+Interval", youtube: "https://youtu.be/xxRE-46OCC8?si=a7aPuIw16zDx2lAa" },
                    { id: "712", name: "Merge Intervals", difficulty: "Medium", leetcode: "https://leetcode.com/problems/merge-intervals/", article: "https://takeuforward.org/data-structure/merge-overlapping-sub-intervals/", youtube: "https://www.youtube.com/watch?v=2JzRBPFYbKE\\u0026list=PLgUwDviBIf0rPG3Ictpu74YWBQ1CaBkm2\\u0026index=6" },
                    { id: "550", name: "Non-overlapping Intervals", difficulty: "Medium", leetcode: "https://leetcode.com/problems/non-overlapping-intervals/", article: "https://takeuforward.org/data-structure/non-overlapping-intervals", youtube: "https://youtu.be/HDHQ8lAWakY?si=JVtLqboGdpUTOVjf" }
                ]
            }
        ]
    },
    // ─── Section 13: Binary Trees [Traversals, Medium and Hard Problems] ───
    {
        sectionIndex: 12,
        name: "Binary Trees [Traversals, Medium and Hard Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Traversals",
                problems: [
                    { id: "2865", name: "Introduction to Trees", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/binary-tree/introduction-to-trees/", youtube: "https://youtu.be/_ANrF3FJm7I" },
                    { id: "2864", name: "Binary Tree Representation in Java", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/binary-tree/binary-tree-representation-in-java/", youtube: "https://youtu.be/hyLyW7rP24I" },
                    { id: "136", name: "Pre, Post, Inorder in one traversal", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/preorder-inorder-postorder-traversals-in-one-traversal/", youtube: "https://youtu.be/ySp2epYvgTE" },
                    { id: "137", name: "Preorder Traversal", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-preorder-traversal/", article: "https://takeuforward.org/data-structure/preorder-traversal-of-binary-tree/", youtube: "https://youtu.be/RlUu72JrOCQ" },
                    { id: "2785", name: "Inorder Traversal of Binary Tree", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-inorder-traversal/", article: "https://takeuforward.org/data-structure/inorder-traversal-of-binary-tree/", youtube: "https://youtu.be/Z_NEgBgbRVI" },
                    { id: "135", name: "Postorder Traversal", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-postorder-traversal/", article: "https://takeuforward.org/data-structure/iterative-postorder-traversal-of-binary-tree-using-2-stack", youtube: "https://youtu.be/2YBhNLodD8Q" },
                    { id: "134", name: "Level Order Traversal", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-level-order-traversal/", article: "https://takeuforward.org/data-structure/level-order-traversal-of-a-binary-tree/", youtube: "https://youtu.be/EoAsWbO7sqg" },
                    { id: "2872", name: "Iterative Preorder Traversal of Binary Tree", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-preorder-traversal/", article: "https://takeuforward.org/data-structure/iterative-preorder-traversal-of-binary-tree", youtube: "https://youtu.be/Bfqd8BsPVuw" },
                    { id: "2786", name: "Iterative Inorder Traversal of Binary Tree", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-inorder-traversal/", article: "https://takeuforward.org/data-structure/inorder-traversal-of-binary-tree/", youtube: "https://youtu.be/lxTGsVXjwvM" },
                    { id: "2788", name: "Post-order Traversal of Binary Tree using 2 stack", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-postorder-traversal/", article: "https://takeuforward.org/data-structure/iterative-postorder-traversal-of-binary-tree-using-2-stack", youtube: "https://youtu.be/2YBhNLodD8Q" },
                    { id: "2787", name: "Post-order Traversal of Binary Tree using 1 stack", difficulty: "Easy", leetcode: "https://leetcode.com/problems/binary-tree-postorder-traversal/", article: "https://takeuforward.org/data-structure/post-order-traversal-of-binary-tree/", youtube: "https://youtu.be/NzIGLLwZBS8" },
                    { id: "2789", name: "Preorder, Inorder, and Postorder Traversal in one Traversal", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/preorder-inorder-postorder-traversals-in-one-traversal/", youtube: "https://youtu.be/ySp2epYvgTE" }
                ]
            },
            {
                name: "Medium Problems",
                problems: [
                    { id: "131", name: "Maximum Depth in BT", difficulty: "Medium", leetcode: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", article: "https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/", youtube: "https://youtu.be/eD3tmO66aBA" },
                    { id: "127", name: "Check for balanced binary tree", difficulty: "Medium", leetcode: "https://leetcode.com/problems/balanced-binary-tree/", article: "https://takeuforward.org/data-structure/check-if-the-binary-tree-is-balanced-binary-tree/", youtube: "https://youtu.be/Yt50Jfbd8Po" },
                    { id: "130", name: "Diameter of Binary Tree", difficulty: "Easy", leetcode: "https://leetcode.com/problems/diameter-of-binary-tree/", article: "https://takeuforward.org/data-structure/calculate-the-diameter-of-a-binary-tree/", youtube: "https://youtu.be/Rezetez59Nk" },
                    { id: "132", name: "Maximum path sum", difficulty: "Medium", leetcode: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", article: "https://takeuforward.org/data-structure/maximum-sum-path-in-binary-tree/", youtube: "https://youtu.be/WszrfSwMz58" },
                    { id: "129", name: "Check if two trees are identical or not", difficulty: "Medium", leetcode: "https://leetcode.com/problems/same-tree/", article: "https://takeuforward.org/data-structure/check-if-two-trees-are-identical/", youtube: "https://youtu.be/BhuvF_-PWS0" },
                    { id: "126", name: "Zig Zag or Spiral Traversal", difficulty: "Medium", leetcode: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/", article: "https://takeuforward.org/data-structure/zig-zag-traversal-of-binary-tree/", youtube: "https://youtu.be/3OXWEdlIGl4" },
                    { id: "116", name: "Boundary Traversal", difficulty: "Medium", leetcode: "https://leetcode.com/problems/boundary-of-binary-tree/", article: "https://takeuforward.org/data-structure/boundary-traversal-of-a-binary-tree/", youtube: "https://youtu.be/0ca1nvR0be4" },
                    { id: "125", name: "Vertical Order Traversal", difficulty: "Medium", leetcode: "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/", article: "https://takeuforward.org/data-structure/vertical-order-traversal-of-binary-tree/", youtube: "https://youtu.be/q_a6lpbKJdw" },
                    { id: "124", name: "Top View of BT", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/top-view-of-a-binary-tree/", youtube: "https://youtu.be/Et9OCDNvJ78" },
                    { id: "115", name: "Bottom view of BT", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/bottom-view-of-a-binary-tree/", youtube: "https://youtu.be/0FtVY6I4pB8" },
                    { id: "2782", name: "Right/Left View of Binary Tree", difficulty: "Medium", leetcode: "https://leetcode.com/problems/binary-tree-right-side-view/", article: "https://takeuforward.org/data-structure/right-left-view-of-binary-tree/", youtube: "https://youtu.be/KV4mRzTjlAk" },
                    { id: "2784", name: "Symmetric Binary Tree", difficulty: "Medium", leetcode: "https://leetcode.com/problems/symmetric-tree/", article: "https://takeuforward.org/data-structure/check-for-symmetrical-binary-tree/", youtube: "https://www.youtube.com/watch?v=nKggNAiEpBE" }
                ]
            },
            {
                name: "Hard Problems",
                problems: [
                    { id: "122", name: "Print root to leaf path in BT", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/print-root-to-node-path-in-a-binary-tree/", youtube: "https://youtu.be/fmflMqVOC7k" },
                    { id: "118", name: "LCA in BT", difficulty: "Hard", leetcode: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", article: "https://takeuforward.org/data-structure/lowest-common-ancestor-for-two-given-nodes/", youtube: "https://youtu.be/_-QHfMDde90" },
                    { id: "119", name: "Maximum Width of BT", difficulty: "Medium", leetcode: "https://leetcode.com/problems/maximum-width-of-binary-tree/", article: "https://takeuforward.org/data-structure/maximum-width-of-a-binary-tree/", youtube: "https://youtu.be/ZbybYvcVLks" },
                    { id: "185", name: "Children Sum Property in Binary Tree", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/check-for-children-sum-property-in-a-binary-tree/", youtube: "https://youtu.be/fnmisPM6cVo" },
                    { id: "120", name: "Minimum time taken to burn the BT from a given Node", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/minimum-time-taken-to-burn-the-binary-tree-from-a-node", youtube: "https://youtu.be/2r5wLmQfD6g" },
                    { id: "117", name: "Count total nodes in a complete BT", difficulty: "Easy", leetcode: "https://leetcode.com/problems/count-complete-tree-nodes/", article: "https://takeuforward.org/binary-tree/count-number-of-nodes-in-a-binary-tree/", youtube: "https://youtu.be/u-yWemKGWO0" },
                    { id: "111", name: "Requirements needed to construct a unique BT", difficulty: "Medium", leetcode: null, article: null, youtube: "https://youtu.be/9GMECGQgWrQ" },
                    { id: "110", name: "Construct a BT from Preorder and Inorder", difficulty: "Hard", leetcode: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", article: "https://takeuforward.org/data-structure/construct-a-binary-tree-from-inorder-and-preorder-traversal/", youtube: "https://youtu.be/aZNaLrVebKQ" },
                    { id: "2781", name: "Construct the Binary Tree from Postorder and Inorder Traversal", difficulty: "Hard", leetcode: "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/", article: "https://takeuforward.org/data-structure/construct-binary-tree-from-inorder-and-postorder-traversal/", youtube: "https://youtu.be/LgLRTaEMRVc" },
                    { id: "112", name: "Serialize and De-serialize BT", difficulty: "Hard", leetcode: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", article: "https://takeuforward.org/data-structure/serialize-and-deserialize-a-binary-tree/", youtube: "https://youtu.be/-YbXySKJsX8" },
                    { id: "2791", name: "Morris Preorder Traversal of a Binary Tree", difficulty: "Hard", leetcode: "https://leetcode.com/problems/binary-tree-inorder-traversal/", article: "https://takeuforward.org/data-structure/morris-preorder-traversal-of-a-binary-tree/", youtube: "https://youtu.be/80Zug6D1_r4" },
                    { id: "2792", name: "Morris Inorder Traversal of a Binary Tree", difficulty: "Hard", leetcode: "https://leetcode.com/problems/binary-tree-inorder-traversal/", article: "https://takeuforward.org/data-structure/morris-inorder-traversal-of-a-binary-tree/", youtube: "https://youtu.be/80Zug6D1_r4" }
                ]
            }
        ]
    },
    // ─── Section 14: Binary Search Trees [Concept and Problems] ───
    {
        sectionIndex: 13,
        name: "Binary Search Trees [Concept and Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Concepts",
                problems: [
                    { id: "1153", name: "Introduction to BST", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/binary-search-tree/introduction-to-binary-search-trees/", youtube: "https://youtu.be/p7-9UvDQZ3w" },
                    { id: "2780", name: "Search in a Binary Search Tree", difficulty: "Easy", leetcode: "https://leetcode.com/problems/search-in-a-binary-search-tree/", article: "https://takeuforward.org/data-structure/search-in-a-binary-search-tree-2/", youtube: "https://youtu.be/KcNt6v_56cc" },
                    { id: "2398", name: "Find Min/Max in BST", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/find-minmax-in-a-bst", youtube: null }
                ]
            },
            {
                name: "Practice Problems",
                problems: [
                    { id: "107", name: "Floor and Ceil in a BST", difficulty: "Easy", leetcode: null, article: null, youtube: "https://www.youtube.com/watch?v=xm_W1ub-K-w\\u0026list=PLgUwDviBIf0q8Hkd7bK2Bpryj2xVJk8Vk\\u0026index=43" },
                    { id: "2778", name: "Floor in a Binary Search Tree", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/binary-search-tree/floor-in-a-binary-search-tree/", youtube: "https://youtu.be/xm_W1ub-K-w" },
                    { id: "104", name: "Insert a given node in BST", difficulty: "Medium", leetcode: "https://leetcode.com/problems/insert-into-a-binary-search-tree/", article: null, youtube: "https://youtu.be/FiFiNvM29ps" },
                    { id: "102", name: "Delete a node in BST", difficulty: "Medium", leetcode: "https://leetcode.com/problems/delete-node-in-a-bst/", article: null, youtube: "https://youtu.be/kouxiP_H5WE" },
                    { id: "105", name: "Kth Smallest and Largest element in BST", difficulty: "Medium", leetcode: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", article: "https://takeuforward.org/data-structure/kth-largest-smallest-element-in-binary-search-tree/", youtube: "https://youtu.be/9TJYWh0adfk" },
                    { id: "100", name: "Check if a tree is a BST or not", difficulty: "Medium", leetcode: "https://leetcode.com/problems/validate-binary-search-tree/", article: null, youtube: "https://youtu.be/f-sj7I5oXEI" },
                    { id: "101", name: "Construct a BST from a preorder traversal", difficulty: "Medium", leetcode: "https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/", article: null, youtube: "https://youtu.be/UmJT3j26t1I" },
                    { id: "2775", name: "Inorder Successor/Predecessor in BST", difficulty: "Medium", leetcode: "https://leetcode.com/problems/inorder-successor-in-bst/", article: "https://takeuforward.org/data-structure/inorder-successorpredecessor-in-bst", youtube: "https://youtu.be/SXKAD2svfmI" },
                    { id: "2772", name: "Merge 2 BST's", difficulty: "Hard", leetcode: "https://leetcode.com/problems/binary-search-tree-iterator/", article: "https://takeuforward.org/data-structure/bst-iterator", youtube: "https://youtu.be/D2jMcmxU4bs" },
                    { id: "2774", name: "Two Sum In BST | Check if there exists a pair with Sum K", difficulty: "Hard", leetcode: "https://leetcode.com/problems/two-sum-iv-input-is-a-bst/", article: "https://takeuforward.org/data-structure/two-sum-in-bst-check-if-there-exists-a-pair-with-sum-k", youtube: "https://youtu.be/ssL3sHwPeb4" },
                    { id: "97", name: "Correct BST with two nodes swapped", difficulty: "Hard", leetcode: "https://leetcode.com/problems/recover-binary-search-tree/", article: null, youtube: "https://youtu.be/ZWGW7FminDM" },
                    { id: "98", name: "Largest BST in Binary Tree", difficulty: "Hard", leetcode: "https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/", article: null, youtube: "https://youtu.be/X0oXMdtUDwo" }
                ]
            }
        ]
    },
    // ─── Section 15: Graphs [Concepts & Problems] ───
    {
        sectionIndex: 14,
        name: "Graphs [Concepts & Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Learning",
                problems: [
                    { id: "1222", name: "Introduction to Graph", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/graph-representation-in-java", youtube: "https://youtu.be/3oI-34aPMWM" },
                    { id: "2870", name: "Graph Representation | C++", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/graph/graph-representation-in-c/", youtube: "https://youtu.be/3oI-34aPMWM" },
                    { id: "2871", name: "Graph Representation | Java", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/graph-representation-in-java", youtube: "https://youtu.be/3oI-34aPMWM" },
                    { id: "529", name: "Traversal Techniques", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/depth-first-search-dfs/", youtube: "https://youtu.be/Qzf1a--rhp8" },
                    { id: "2831", name: "DFS", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/depth-first-search-dfs/", youtube: "https://youtu.be/Qzf1a--rhp8" }
                ]
            },
            {
                name: "Problems on BFS/DFS",
                problems: [
                    { id: "535", name: "Number of provinces", difficulty: "Medium", leetcode: "https://leetcode.com/problems/number-of-provinces/#:~:text=A%20province%20is%20a%20group,the%20total%20number%20of%20provinces.", article: "https://takeuforward.org/data-structure/number-of-provinces/", youtube: "https://youtu.be/ACzkVtewUYA" },
                    { id: "2830", name: "Connected Components Problem in Matrix", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/connected-components", youtube: null },
                    { id: "536", name: "Rotten Oranges", difficulty: "Medium", leetcode: "https://leetcode.com/problems/rotting-oranges/", article: "https://takeuforward.org/data-structure/rotten-oranges-min-time-to-rot-all-oranges-bfs/", youtube: "https://www.youtube.com/watch?v=yf3oUhkvqA0" },
                    { id: "531", name: "Flood fill algorithm", difficulty: "Medium", leetcode: "https://leetcode.com/problems/flood-fill/", article: null, youtube: null },
                    { id: "2817", name: "Cycle Detection in Undirected Graph (bfs)", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/detect-cycle-in-an-undirected-graph-using-bfs/", youtube: "https://youtu.be/BPlrALf1LDU" },
                    { id: "501", name: "Detect a cycle in an undirected graph", difficulty: "Hard", leetcode: "https://leetcode.com/problems/course-schedule/", article: "https://takeuforward.org/data-structure/detect-cycle-in-an-undirected-graph-using-dfs/", youtube: "https://youtu.be/zQ3zgFypzX4" },
                    { id: "530", name: "Distance of nearest cell having one", difficulty: "Medium", leetcode: "https://leetcode.com/problems/01-matrix/", article: "https://takeuforward.org/graph/distance-of-nearest-cell-having-1/", youtube: "https://youtu.be/edXdVwkYHF8" },
                    { id: "533", name: "Number of enclaves", difficulty: "Medium", leetcode: "https://leetcode.com/problems/number-of-enclaves/", article: "https://takeuforward.org/graph/number-of-enclaves/", youtube: "https://youtu.be/rxKcepXQgU4" },
                    { id: "509", name: "Word ladder I", difficulty: "Hard", leetcode: "https://leetcode.com/problems/word-ladder/", article: "https://takeuforward.org/graph/word-ladder-i-g-29/", youtube: "https://youtu.be/tRPda0rcf8E" },
                    { id: "510", name: "Word ladder II", difficulty: "Hard", leetcode: "https://leetcode.com/problems/word-ladder-ii/", article: "https://takeuforward.org/graph/g-30-word-ladder-ii/", youtube: "https://youtu.be/AD4SFl7tu7I?si=EpcJQTWm2YeURvEG" },
                    { id: "534", name: "Number of islands", difficulty: "Medium", leetcode: "https://leetcode.com/problems/number-of-islands/", article: "https://takeuforward.org/data-structure/number-of-distinct-islands/", youtube: "https://www.youtube.com/watch?v=muncqlKJrH0\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=8" },
                    { id: "2813", name: "Bipartite Graph (DFS)", difficulty: "Hard", leetcode: "https://leetcode.com/problems/is-graph-bipartite/", article: "https://takeuforward.org/graph/bipartite-graph-dfs-implementation/", youtube: "https://youtu.be/KG5YFfR0j8A" },
                    { id: "2814", name: "Cycle Detection in Directed Graph (DFS)", difficulty: "Hard", leetcode: "https://leetcode.com/problems/course-schedule-ii/discuss/293048/detecting-cycle-in-directed-graph-problem", article: "https://takeuforward.org/data-structure/detect-cycle-in-a-directed-graph-using-dfs-g-19/", youtube: "https://youtu.be/9twcmtQj4DU" }
                ]
            },
            {
                name: "Topo Sort and Problems",
                problems: [
                    { id: "2822", name: "Topo Sort", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/topological-sort-algorithm-dfs-g-21/", youtube: "https://youtu.be/5lZ0iJMrUMk" },
                    { id: "502", name: "Topological sort or Kahn's algorithm", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/topological-sort-algorithm-dfs-g-21/", youtube: "https://youtu.be/5lZ0iJMrUMk" },
                    { id: "500", name: "Detect a cycle in a directed graph", difficulty: "Hard", leetcode: "https://leetcode.com/problems/course-schedule/", article: "https://takeuforward.org/data-structure/detect-a-cycle-in-directed-graph-topological-sort-kahns-algorithm-g-23/", youtube: "https://www.youtube.com/watch?v=uzVUw90ZFIg\\u0026list=PLgUwDviBIf0rGEWe64KWas0Nryn7SCRWw\\u0026index=12" },
                    { id: "504", name: "Course Schedule I", difficulty: "Hard", leetcode: "https://leetcode.com/problems/course-schedule/", article: "https://takeuforward.org/data-structure/course-schedule-i-and-ii-pre-requisite-tasks-topological-sort-g-24/", youtube: "https://youtu.be/WAOfKpxYHR8" },
                    { id: "505", name: "Course Schedule II", difficulty: "Medium", leetcode: "https://leetcode.com/problems/course-schedule-ii/", article: "https://takeuforward.org/data-structure/course-schedule-i-and-ii-pre-requisite-tasks-topological-sort-g-24/", youtube: "https://youtu.be/WAOfKpxYHR8" },
                    { id: "506", name: "Find eventual safe states", difficulty: "Hard", leetcode: "https://leetcode.com/problems/find-eventual-safe-states/", article: "https://takeuforward.org/data-structure/find-eventual-safe-states-bfs-topological-sort-g-25/", youtube: "https://youtu.be/2gtg3VsDGyc" },
                    { id: "503", name: "Alien Dictionary", difficulty: "Hard", leetcode: "https://leetcode.com/problems/alien-dictionary/solution/", article: "https://takeuforward.org/data-structure/alien-dictionary-topological-sort-g-26/", youtube: "https://youtu.be/U3N_je7tWAs" }
                ]
            },
            {
                name: "Shortest Path Algorithms and Problems",
                problems: [
                    { id: "508", name: "Shortest path in undirected graph with unit weights", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/shortest-path-in-undirected-graph-with-unit-distance-g-28/", youtube: "https://www.youtube.com/watch?v=C4gxoTaI71U\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=28" },
                    { id: "507", name: "Shortest path in DAG", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/shortest-path-in-directed-acyclic-graph-topological-sort-g-27/", youtube: "https://www.youtube.com/watch?v=ZUFQfFaU-8U\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=27" },
                    { id: "2827", name: "Djisktra's Algorithm", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/dijkstras-algorithm-using-set-g-33/", youtube: "https://www.youtube.com/watch?v=rp1SMw7HSO8\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=35" },
                    { id: "2828", name: "Why priority Queue is used in Djisktra's Algorithm", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/dijkstras-algorithm-using-priority-queue-g-32/", youtube: "https://www.youtube.com/watch?v=rp1SMw7HSO8\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=35" },
                    { id: "525", name: "Path with minimum effort", difficulty: "Hard", leetcode: "https://leetcode.com/problems/path-with-minimum-effort/", article: "https://takeuforward.org/data-structure/g-37-path-with-minimum-effort/", youtube: "https://youtu.be/0ytpZyiZFhA" },
                    { id: "519", name: "Cheapest flight within K stops", difficulty: "Hard", leetcode: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", article: "https://takeuforward.org/data-structure/g-38-cheapest-flights-within-k-stops/", youtube: "https://youtu.be/9XybHVqTHcQ" },
                    { id: "764", name: "Network Delay Time", difficulty: "Medium", leetcode: "https://leetcode.com/problems/network-delay-time/", article: "https://takeuforward.org/data-structure/network-delay-time", youtube: null },
                    { id: "524", name: "Number of ways to arrive at destination", difficulty: "Hard", leetcode: "https://leetcode.com/problems/number-of-ways-to-arrive-at-destination/", article: "https://takeuforward.org/data-structure/g-40-number-of-ways-to-arrive-at-destination/", youtube: "https://youtu.be/_-0mx0SmYxA" },
                    { id: "523", name: "Minimum multiplications to reach end", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/graph/g-39-minimum-multiplications-to-reach-end/", youtube: "https://www.youtube.com/watch?v=_BvEJ3VIDWw\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=39" },
                    { id: "2826", name: "Bellman Ford Algorithm", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/bellman-ford-algorithm-g-41/", youtube: "https://youtu.be/0vVofAhAYjc" },
                    { id: "522", name: "Floyd warshall algorithm", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/floyd-warshall-algorithm-g-42/", youtube: "https://www.youtube.com/watch?v=YbY8cVwWAvw\\u0026list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn\\u0026index=42" },
                    { id: "521", name: "Find the city with the smallest number of neighbors", difficulty: "Hard", leetcode: "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/", article: "https://takeuforward.org/data-structure/find-the-city-with-the-smallest-number-of-neighbours-at-a-threshold-distance-g-43/", youtube: "https://youtu.be/9XybHVqTHcQ" }
                ]
            },
            {
                name: "MinimumSpanningTree/Disjoint Set and Problems",
                problems: [
                    { id: "2825", name: "Prim's Algorithm", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/prims-algorithm-minimum-spanning-tree-c-and-java-g-45/", youtube: "https://youtu.be/mJcZjjKzeqk" },
                    { id: "516", name: "Disjoint Set", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/disjoint-set-union-by-rank-union-by-size-path-compression-g-46/", youtube: "https://youtu.be/aBxjDBC4M1U" },
                    { id: "517", name: "Find the MST weight", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/prims-algorithm-minimum-spanning-tree-c-and-java-g-45/", youtube: "https://youtu.be/mJcZjjKzeqk" },
                    { id: "515", name: "Number of operations to make network connected", difficulty: "Hard", leetcode: "https://leetcode.com/problems/number-of-operations-to-make-network-connected/", article: "https://takeuforward.org/data-structure/number-of-operations-to-make-network-connected-dsu-g-49/", youtube: "https://youtu.be/FYrl7iz9_ZU" },
                    { id: "513", name: "Most stones removed with same row or column", difficulty: "Medium", leetcode: "https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/", article: "https://takeuforward.org/data-structure/most-stones-removed-with-same-row-or-column-dsu-g-53/", youtube: "https://youtu.be/OwMNX8SPavM" },
                    { id: "511", name: "Accounts merge", difficulty: "Hard", leetcode: "https://leetcode.com/problems/accounts-merge/", article: "https://takeuforward.org/data-structure/accounts-merge-dsu-g-50/", youtube: "https://youtu.be/FMwpt_aQOGw" },
                    { id: "514", name: "Number of islands II", difficulty: "Hard", leetcode: "https://leetcode.com/problems/number-of-islands-ii/", article: "https://takeuforward.org/graph/number-of-islands-ii-online-queries-dsu-g-51/", youtube: "https://youtu.be/Rn6B-Q4SNyA" },
                    { id: "512", name: "Making a large island", difficulty: "Hard", leetcode: "https://leetcode.com/problems/making-a-large-island/", article: "https://takeuforward.org/data-structure/making-a-large-island-dsu-g-52/", youtube: "https://youtu.be/lgiz0Oup6gM" },
                    { id: "1006", name: "Swim in Rising Water", difficulty: "Medium", leetcode: "https://leetcode.com/problems/swim-in-rising-water/", article: "https://takeuforward.org/data-structure/swim-in-rising-water", youtube: null }
                ]
            },
            {
                name: "Other Algorithms",
                problems: [
                    { id: "496", name: "Articulation point in graph", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/articulation-point-in-graph-g-56/", youtube: "https://youtu.be/j1QDfU21iZk" },
                    { id: "498", name: "Kosaraju's algorithm", difficulty: "Hard", leetcode: "https://leetcode.com/problems/maximum-number-of-non-overlapping-substrings/discuss/766485/kosaraju-algorithm-on", article: "https://takeuforward.org/graph/strongly-connected-components-kosarajus-algorithm-g-54/", youtube: "https://www.youtube.com/watch?v=V8qIqJxCioo\\u0026list=PLgUwDviBIf0rGEWe64KWas0Nryn7SCRWw\\u0026index=27" }
                ]
            }
        ]
    },
    // ─── Section 16: Dynamic Programming [Patterns and Problems] ───
    {
        sectionIndex: 15,
        name: "Dynamic Programming [Patterns and Problems]",
        preCompleted: false,
        subcategories: [
            {
                name: "Introduction to DP",
                problems: [
                    { id: "1195", name: "Introduction to DP", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/dynamic-programming-introduction/", youtube: "https://youtu.be/tyB0ztf0DNY" }
                ]
            },
            {
                name: "1D DP",
                problems: [
                    { id: "287", name: "Climbing stairs", difficulty: "Medium", leetcode: "https://leetcode.com/problems/climbing-stairs/", article: "https://takeuforward.org/data-structure/dynamic-programming-climbing-stairs/", youtube: "https://youtu.be/mLfjzJsN8us" },
                    { id: "288", name: "Frog Jump", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/dynamic-programming-frog-jump-dp-3/", youtube: "https://www.youtube.com/watch?v=EgG3jsGoPvQ" },
                    { id: "289", name: "Frog jump with K distances", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/dynamic-programming-frog-jump-with-k-distances-dp-4/", youtube: "https://www.youtube.com/watch?v=Kmh3rhyEtB8" },
                    { id: "291", name: "Maximum sum of non adjacent elements", difficulty: "Medium", leetcode: "https://leetcode.com/problems/house-robber/", article: "https://takeuforward.org/data-structure/maximum-sum-of-non-adjacent-elements-dp-5/", youtube: "https://www.youtube.com/watch?v=GrMBfJNk_NY" },
                    { id: "290", name: "House robber", difficulty: "Medium", leetcode: "https://leetcode.com/problems/house-robber-ii/", article: "https://takeuforward.org/data-structure/dynamic-programming-house-robber-dp-6/", youtube: "https://www.youtube.com/watch?v=3WaxQMELSkw" },
                    { id: "292", name: "Ninja's training", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/dynamic-programming-ninjas-training-dp-7/", youtube: "https://www.youtube.com/watch?v=AE39gJYuRog" },
                    { id: "2795", name: "Grid Unique Paths : DP on Grids (DP8)", difficulty: "Medium", leetcode: "https://leetcode.com/problems/unique-paths/", article: "https://takeuforward.org/data-structure/grid-unique-paths-dp-on-grids-dp8/", youtube: "https://www.youtube.com/watch?v=sdE0A2Oxofw" },
                    { id: "300", name: "Unique paths II", difficulty: "Medium", leetcode: "https://leetcode.com/problems/unique-paths-ii/", article: "https://takeuforward.org/data-structure/grid-unique-paths-2-dp-9/", youtube: "https://www.youtube.com/watch?v=TmhpgXScLyY" },
                    { id: "298", name: "Minimum Falling Path Sum", difficulty: "Medium", leetcode: "https://leetcode.com/problems/minimum-path-sum/", article: "https://takeuforward.org/data-structure/minimum-path-sum-in-a-grid-dp-10/", youtube: "https://youtu.be/_rgTlyky1uQ" },
                    { id: "299", name: "Triangle", difficulty: "Medium", leetcode: "https://leetcode.com/problems/triangle/", article: "https://takeuforward.org/data-structure/minimum-path-sum-in-triangular-grid-dp-11/", youtube: "https://www.youtube.com/watch?v=SrP-PiLSYC0" },
                    { id: "769", name: "Ninja and his Friends", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/3-d-dp-ninja-and-his-friends-dp-13/", youtube: "https://www.youtube.com/watch?v=QGfn7JeXK54" }
                ]
            },
            {
                name: "DP on Subsequences",
                problems: [
                    { id: "2804", name: "Subset sum equal to target (DP- 14)", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/subset-sum-equal-to-target-dp-14/", youtube: "https://www.youtube.com/watch?v=fWX9xDmIzRI" },
                    { id: "321", name: "Partition equal subset sum", difficulty: "Hard", leetcode: "https://leetcode.com/problems/partition-equal-subset-sum/", article: "https://takeuforward.org/data-structure/partition-equal-subset-sum-dp-15/", youtube: "https://www.youtube.com/watch?v=7win3dcgo3k" },
                    { id: "320", name: "Partition a set into two subsets with minimum absolute sum difference", difficulty: "Hard", leetcode: "https://leetcode.com/problems/partition-array-into-two-arrays-to-minimize-sum-difference/", article: "https://takeuforward.org/data-structure/partition-set-into-2-subsets-with-min-absolute-sum-diff-dp-16/", youtube: "https://www.youtube.com/watch?v=GS_OqZb2CWc" },
                    { id: "317", name: "Count partitions with given difference", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/count-partitions-with-given-difference-dp-18/", youtube: "https://www.youtube.com/watch?v=zoilQD1kYSg" },
                    { id: "541", name: "Assign Cookies", difficulty: "Easy", leetcode: "https://leetcode.com/problems/assign-cookies/", article: "https://takeuforward.org/data-structure/assign-cookies", youtube: "https://youtu.be/DIX2p7vb9co?si=GofAIDimue-Av0Fi" },
                    { id: "2802", name: "Minimum Coins (DP - 20)", difficulty: "Hard", leetcode: "https://leetcode.com/problems/coin-change/", article: "https://takeuforward.org/data-structure/minimum-coins-dp-20/", youtube: "https://www.youtube.com/watch?v=myPeWb3Y68A" },
                    { id: "324", name: "Target sum", difficulty: "Hard", leetcode: "https://leetcode.com/problems/target-sum/", article: "https://takeuforward.org/data-structure/target-sum-dp-21/", youtube: "https://www.youtube.com/watch?v=b3GD8263-PQ" },
                    { id: "2801", name: "Coin Change 2 (DP - 22)", difficulty: "Hard", leetcode: "https://leetcode.com/problems/coin-change-2/", article: "https://takeuforward.org/data-structure/coin-change-2-dp-22/", youtube: "https://www.youtube.com/watch?v=HgyouUi11zk" },
                    { id: "325", name: "Unbounded knapsack", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/unbounded-knapsack-dp-23/", youtube: "https://youtu.be/OgvOZ6OrJoY" },
                    { id: "2803", name: "Rod Cutting Problem | (DP - 24)", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/rod-cutting-problem-dp-24/", youtube: "https://youtu.be/mO8XpGoJwuo" }
                ]
            },
            {
                name: "DP on Strings",
                problems: [
                    { id: "308", name: "Longest common subsequence", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/print-longest-common-subsequence-dp-26/", youtube: "https://youtu.be/-zI4mrF2Pb4" },
                    { id: "2799", name: "Print Longest Common Subsequence | (DP - 26)", difficulty: "hard", leetcode: null, article: "https://takeuforward.org/data-structure/print-longest-common-subsequence-dp-26/", youtube: "https://youtu.be/-zI4mrF2Pb4" },
                    { id: "309", name: "Longest common substring", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/longest-common-substring-dp-27/", youtube: "https://youtu.be/_wP9mWNPL5w" },
                    { id: "310", name: "Longest palindromic subsequence", difficulty: "Hard", leetcode: "https://leetcode.com/problems/longest-palindromic-subsequence/", article: "https://takeuforward.org/data-structure/longest-palindromic-subsequence-dp-28/", youtube: "https://youtu.be/6i_T5kkfv4A" },
                    { id: "2800", name: "Minimum insertions to make string palindrome | DP-29", difficulty: "Hard", leetcode: "https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/", article: "https://takeuforward.org/data-structure/minimum-insertions-to-make-string-palindrome-dp-29/", youtube: "https://www.youtube.com/watch?v=xPBLEj41rFU" },
                    { id: "311", name: "Minimum insertions or deletions to convert string A to B", difficulty: "Hard", leetcode: "https://leetcode.com/problems/delete-operation-for-two-strings/", article: "https://takeuforward.org/data-structure/minimum-insertions-deletions-to-convert-string-dp-30/", youtube: "https://www.youtube.com/watch?v=yMnH0jrir0Q" },
                    { id: "313", name: "Shortest common supersequence", difficulty: "Hard", leetcode: "https://leetcode.com/problems/shortest-common-supersequence/", article: "https://takeuforward.org/data-structure/shortest-common-supersequence-dp-31/", youtube: "https://youtu.be/xElxAuBcvsU" },
                    { id: "306", name: "Distinct subsequences", difficulty: "Hard", leetcode: "https://leetcode.com/problems/distinct-subsequences/", article: "https://takeuforward.org/data-structure/distinct-subsequences-dp-32/", youtube: "https://youtu.be/nVG7eTiD2bY" },
                    { id: "307", name: "Edit distance", difficulty: "Hard", leetcode: "https://leetcode.com/problems/edit-distance/", article: "https://takeuforward.org/data-structure/edit-distance-dp-33/", youtube: "https://youtu.be/fJaKO8FbDdo" },
                    { id: "314", name: "Wildcard matching", difficulty: "Hard", leetcode: "https://leetcode.com/problems/wildcard-matching/", article: "https://takeuforward.org/data-structure/wildcard-matching-dp-34/", youtube: "https://youtu.be/ZmlQ3vgAOMo" }
                ]
            },
            {
                name: "DP on Stocks",
                problems: [
                    { id: "301", name: "Best time to buy and sell stock", difficulty: "Medium", leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", article: "https://takeuforward.org/data-structure/stock-buy-and-sell/", youtube: "https://youtu.be/excAOvwF_Wk" },
                    { id: "303", name: "Best time to buy and sell stock III", difficulty: "Medium", leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/description/", article: "https://takeuforward.org/data-structure/buy-and-sell-stock-iii-dp-37/", youtube: "https://youtu.be/-uQGzhYj8BQ" },
                    { id: "304", name: "Best time to buy and sell stock IV", difficulty: "Medium", leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/", article: "https://takeuforward.org/data-structure/buy-and-sell-stock-iv-dp-38/", youtube: "https://youtu.be/IV1dHbk5CDc" },
                    { id: "56", name: "Best Time to Buy and Sell Stock with Cooldown", difficulty: "Medium", leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/", article: "https://takeuforward.org/data-structure/buy-and-sell-stocks-with-cooldown-dp-39/", youtube: "https://youtu.be/IGIe46xw3YY" },
                    { id: "305", name: "Best time to buy and sell stock with transaction fees", difficulty: "Medium", leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/", article: "https://takeuforward.org/data-structure/buy-and-sell-stocks-with-transaction-fees-dp-40/", youtube: "https://youtu.be/k4eK-vEmnKg" }
                ]
            },
            {
                name: "DP on LIS",
                problems: [
                    { id: "636", name: "Longest Increasing Subsequence", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/longest-increasing-subsequence-binary-search-dp-43/", youtube: "https://youtu.be/on2hvxBXJH4" },
                    { id: "851", name: "Print Longest Increasing Subsequence", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/printing-longest-increasing-subsequence-dp-42/", youtube: "https://youtu.be/IFfYfonAFGc" },
                    { id: "2851", name: "Longest Increasing Subsequence |(DP-43)", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/longest-increasing-subsequence-binary-search-dp-43/", youtube: "https://youtu.be/on2hvxBXJH4" },
                    { id: "603", name: "Largest Divisible Subset", difficulty: "Medium", leetcode: "https://leetcode.com/problems/largest-divisible-subset/", article: "https://takeuforward.org/data-structure/longest-divisible-subset-dp-44/", youtube: "https://youtu.be/gDuZwBW9VvM" },
                    { id: "633", name: "Longest Bitonic Subsequence", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/longest-bitonic-subsequence-dp-46/", youtube: "https://youtu.be/y4vN0WNdrlg" },
                    { id: "780", name: "Number of Longest Increasing Subsequences", difficulty: "Medium", leetcode: "https://leetcode.com/problems/number-of-longest-increasing-subsequence/", article: "https://takeuforward.org/data-structure/number-of-longest-increasing-subsequences-dp-47/", youtube: "https://youtu.be/cKVl1TFdNXg" }
                ]
            },
            {
                name: "MCM DP | Partition DP",
                problems: [
                    { id: "327", name: "Matrix chain multiplication", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/dynamic-programming/matrix-chain-multiplication-dp-48/", youtube: "https://youtu.be/vRVfmbCFW7Y" },
                    { id: "2806", name: "Matrix Chain Multiplication | Bottom-Up|(DP-49)", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/matrix-chain-multiplication-tabulation-method-dp-49/", youtube: "https://youtu.be/pDCXsbAw5Cg" },
                    { id: "328", name: "Minimum cost to cut the stick", difficulty: "Hard", leetcode: "https://leetcode.com/problems/minimum-cost-to-cut-a-stick/", article: "https://takeuforward.org/data-structure/minimum-cost-to-cut-the-stick-dp-50/", youtube: "https://youtu.be/xwomavsC86c" },
                    { id: "326", name: "Burst balloons", difficulty: "Hard", leetcode: "https://leetcode.com/problems/burst-balloons/", article: "https://takeuforward.org/data-structure/burst-balloons-partition-dp-dp-51/", youtube: "https://youtu.be/Yz4LlDSlkns" },
                    { id: "276", name: "Different Ways to Evaluate a Boolean Expression", difficulty: "Medium", leetcode: "https://leetcode.com/problems/parsing-a-boolean-expression/", article: "https://takeuforward.org/data-structure/evaluate-boolean-expression-to-true-partition-dp-dp-52/", youtube: "https://youtu.be/MM7fXopgyjw" },
                    { id: "329", name: "Palindrome partitioning II", difficulty: "Hard", leetcode: "https://leetcode.com/problems/palindrome-partitioning-ii/", article: "https://takeuforward.org/data-structure/palindrome-partitioning-ii-front-partition-dp-53/", youtube: "https://youtu.be/_H8V5hJUGd0" }
                ]
            },
            {
                name: "DP on Squares",
                problems: [
                    { id: "2860", name: "Maximum Rectangle Area with all 1's|(DP-55)", difficulty: "Hard", leetcode: "https://leetcode.com/problems/maximal-rectangle/", article: "https://takeuforward.org/data-structure/maximum-rectangle-area-with-all-1s-dp-on-rectangles-dp-55/", youtube: "https://youtu.be/tOylVCugy9k" },
                    { id: "2395", name: "Count Square Submatrices with All Ones|(DP-56)", difficulty: "Easy", leetcode: "https://leetcode.com/problems/count-square-submatrices-with-all-ones/", article: "https://takeuforward.org/data-structure/count-square-submatrices-with-all-1s-dp-on-rectangles-dp-56/", youtube: "https://youtu.be/auS1fynpnjo" }
                ]
            }
        ]
    },
    // ─── Section 17: Tries ───
    {
        sectionIndex: 16,
        name: "Tries",
        preCompleted: false,
        subcategories: [
            {
                name: "Theory",
                problems: [
                    { id: "1028", name: "Trie Implementation and Operations", difficulty: "Hard", leetcode: "https://leetcode.com/problems/implement-trie-prefix-tree/", article: "https://takeuforward.org/data-structure/implement-trie-1/", youtube: "https://www.youtube.com/watch?v=dBGUmUQhjaM\\u0026list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp" }
                ]
            },
            {
                name: "Problems",
                problems: [
                    { id: "1027", name: "Trie Implementation and Advanced Operations", difficulty: "Hard", leetcode: null, article: "https://takeuforward.org/data-structure/implement-trie-ii/", youtube: null },
                    { id: "1023", name: "Longest Word with All Prefixes", difficulty: "Medium", leetcode: null, article: null, youtube: "https://www.youtube.com/watch?v=AWnBa91lThI\\u0026list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp\\u0026index=3" },
                    { id: "1026", name: "Number of distinct substrings in a string", difficulty: "Medium", leetcode: null, article: "https://takeuforward.org/data-structure/number-of-distinct-substrings-in-a-string-using-trie/", youtube: "https://www.youtube.com/watch?v=RV0QeTyHZxo\\u0026list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp\\u0026index=4" },
                    { id: "2390", name: "Bit PreRequisites for TRIE Problems", difficulty: "Easy", leetcode: null, article: null, youtube: "https://youtu.be/5iyuU4hQFrw" },
                    { id: "1024", name: "Maximum XOR of two numbers in an array", difficulty: "Hard", leetcode: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", article: "https://takeuforward.org/data-structure/maximum-xor-of-two-numbers-in-an-array/", youtube: "https://www.youtube.com/watch?v=EIhAwfHubE8\\u0026list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp\\u0026index=6" }
                ]
            }
        ]
    },
    // ─── Section 18: Strings ───
    {
        sectionIndex: 17,
        name: "Strings",
        preCompleted: false,
        subcategories: [
            {
                name: "Hard Problems",
                problems: [
                    { id: "983", name: "Minimum number of bracket reversals to make an expression balanced", difficulty: "Hard", leetcode: "https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/", article: "https://takeuforward.org/data-structure/minimum-number-of-bracket-reversals-needed-to-make-an-expression-balanced", youtube: null },
                    { id: "982", name: "Count and say", difficulty: "Hard", leetcode: "https://leetcode.com/problems/count-and-say/", article: "https://takeuforward.org/data-structure/count-and-say", youtube: null },
                    { id: "2399", name: "Hashing In Strings | Theory", difficulty: "Easy", leetcode: null, article: "https://takeuforward.org/data-structure/hashing-in-strings", youtube: null },
                    { id: "979", name: "Rabin Karp Algorithm", difficulty: "Hard", leetcode: "https://leetcode.com/problems/repeated-string-match/discuss/416144/Rabin-Karp-algorithm-C%2B%2B-implementation", article: null, youtube: null },
                    { id: "981", name: "Z function", difficulty: "Hard", leetcode: null, article: null, youtube: null },
                    { id: "977", name: "KMP Algorithm or LPS array", difficulty: "Hard", leetcode: "https://leetcode.com/problems/implement-strstr/", article: "https://takeuforward.org/data-structure/kmp-algorithm-or-lps-array", youtube: null },
                    { id: "980", name: "Shortest Palindrome", difficulty: "Hard", leetcode: null, article: null, youtube: null },
                    { id: "978", name: "Longest happy prefix", difficulty: "Hard", leetcode: "https://leetcode.com/problems/longest-happy-prefix/", article: "https://takeuforward.org/data-structure/longest-happy-prefix", youtube: null }
                ]
            }
        ]
    }
];

// Flatten all problems into a single ordered list for the daily queue
const DSA_ALL_PROBLEMS = [];
let _globalIdx = 0;
DSA_A2Z_SHEET.forEach((section, si) => {
    section.subcategories.forEach((sub, subi) => {
        sub.problems.forEach((prob, pi) => {
            DSA_ALL_PROBLEMS.push({
                ...prob,
                globalIndex: _globalIdx++,
                sectionIndex: si,
                sectionName: section.name,
                subcategoryName: sub.name,
                preCompleted: false
            });
        });
    });
});

// Starting from problem 0 (Beginning of Striver A2Z sheet)
const DSA_REMAINING_START_INDEX = 0;

if (typeof window !== 'undefined') {
    window.DSA_A2Z_SHEET = DSA_A2Z_SHEET;
    window.DSA_ALL_PROBLEMS = DSA_ALL_PROBLEMS;
    window.DSA_REMAINING_START_INDEX = DSA_REMAINING_START_INDEX;
}
if (typeof module !== 'undefined') {
    module.exports = { DSA_A2Z_SHEET, DSA_ALL_PROBLEMS, DSA_REMAINING_START_INDEX };
}