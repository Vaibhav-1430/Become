/**
 * BOSS Study OS — Verified Placement Curriculum, Roadmaps & Question Bank
 * Contains real, verified YouTube playlists, authentic study materials,
 * structured roadmaps with persistent checklist topics, interview question banks,
 * System Design 4-level curriculum & 12 classic interview case studies.
 */

const PLACEMENT_DATA = {
    // ------------------------------------------------------------------------
    // SUBJECT DETAILS & ROADMAPS
    // ------------------------------------------------------------------------
    subjects: {
        dsa: {
            id: 'dsa',
            name: 'Data Structures & Algorithms',
            shortName: 'DSA',
            icon: '🧠',
            subtitle: 'Striver A2Z DSA Sheet, Patterns & Complexity',
            color: '#3b82f6',
            description: 'Master core data structures, algorithmic patterns, LeetCode patterns, and complexity analysis from basics to advanced graphs and dynamic programming.',
            whatToLearn: [
                'Time and Space Complexity Analysis (Big-O notation, master theorem)',
                'Fundamental Data Structures (Arrays, Strings, Linked Lists, Stacks, Queues)',
                'Tree & Graph Traversals (DFS, BFS, Dijkstra, Disjoint Set Union, Prim/Kruskal)',
                'Algorithmic Paradigms (Two Pointers, Sliding Window, Binary Search, Backtracking, Dynamic Programming)',
                'Heap, Trie, Segment Tree & Bit Manipulation',
                'Pattern Recognition for Coding OA & Technical Interviews'
            ],
            youtube: {
                primary: {
                    channel: 'take U forward (Striver)',
                    title: "Strivers A2Z-DSA Course | DSA Playlist | Placements",
                    url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_st8',
                    level: 'Beginner to Advanced',
                    why: 'The gold standard for software engineering placement preparation in India. 450+ structured problems with step-by-step video intuition, code implementation, and complexity breakdown.'
                },
                alt1: {
                    channel: 'Abdul Bari',
                    title: 'Algorithms - Complete Theoretical Foundations',
                    url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O',
                    level: 'Intermediate to Advanced',
                    why: 'World-renowned visual explanations of recursion, divide and conquer, dynamic programming, and greedy algorithms. Unbeatable conceptual clarity.'
                },
                alt2: {
                    channel: 'CodeHelp - by Babbar',
                    title: 'Complete C++ Placement DSA Course',
                    url: 'https://www.youtube.com/playlist?list=PLDze6lLZB88SSD9r0LqWJbW63Q4795C62',
                    level: 'Beginner to Intermediate',
                    why: 'Comprehensive 140+ lecture course covering C++ STL, arrays, linked lists, trees, graphs, DP, and interview problem-solving with friendly pacing.'
                }
            },
            notes: [
                { title: 'Striver A2Z DSA Sheet & Editorial Track', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', type: 'Official Roadmap & Code' },
                { title: 'NeetCode Interactive Visual Roadmap', url: 'https://neetcode.io/roadmap', type: 'Visual Pattern Tree' },
                { title: 'GeeksforGeeks DSA Complete Tutorial', url: 'https://www.geeksforgeeks.org/learn-data-structures-and-algorithms-dsa-tutorial/', type: 'Comprehensive Reference' }
            ],
            roadmap: [
                { id: 'dsa_basics', section: 'FOUNDATIONS', title: 'Language Basics, Time & Space Complexity, Basic Math' },
                { id: 'dsa_arrays', section: 'FOUNDATIONS', title: 'Arrays (Kadane’s, Dutch National Flag, Merge Intervals, Pascal Triangle)' },
                { id: 'dsa_bs', section: 'SEARCHING & SORTING', title: 'Binary Search (BS on 1D/2D arrays, BS on Answer/Search Space)' },
                { id: 'dsa_strings', section: 'STRINGS', title: 'Strings (Palindrome, Anagrams, KMP algorithm, Rabin Karp)' },
                { id: 'dsa_ll', section: 'LINKED LISTS', title: 'Linked Lists (Reverse, Detect cycle, Flattening, LRU Cache)' },
                { id: 'dsa_recursion', section: 'RECURSION & BACKTRACKING', title: 'Recursion & Backtracking (Subsets, Permutations, N-Queens, Sudoku)' },
                { id: 'dsa_stack_queue', section: 'STACK & QUEUE', title: 'Stacks & Queues (Next Greater Element, Monotonic Stack, Largest Histogram, Sliding Window Max)' },
                { id: 'dsa_trees', section: 'TREES & BST', title: 'Binary Trees & BST (Traversals, LCA, Diameter, Max Path Sum, Serialize/Deserialize)' },
                { id: 'dsa_graphs', section: 'GRAPHS', title: 'Graphs (BFS/DFS, Topological Sort, Dijkstra, Bellman-Ford, Floyd Warshall, Disjoint Set Union)' },
                { id: 'dsa_dp', section: 'DYNAMIC PROGRAMMING', title: 'Dynamic Programming (1D, 2D Grid, Subsets/Knapsack, Stocks, LIS, MCM, Partition)' },
                { id: 'dsa_trie_heap', section: 'ADVANCED DATA STRUCTURES', title: 'Heaps / Priority Queues & Tries (Prefix tree, Bitwise XOR Trie)' }
            ],
            practiceTasks: [
                'Solve 3 Striver A2Z problems every single morning (06:45 – 08:15)',
                'Practice implementing Next Greater Element and LRU Cache from scratch',
                'Write Dijkstra algorithm and Disjoint Set Union with path compression without looking at references'
            ],
            questions: [
                {
                    id: 'dsa_q1',
                    question: 'Find the contiguous subarray within an array (containing at least one number) which has the largest sum (Kadane’s Algorithm).',
                    difficulty: 'Medium',
                    topic: 'Arrays & Dynamic Programming',
                    expectedConcepts: ['Kadane’s Algorithm', 'Time Complexity O(N)', 'Space Complexity O(1)', 'Negative numbers handling'],
                    explanation: 'Kadane’s algorithm maintains `currentSum` and `maxSum`. At each element, decide whether to append it to `currentSum` or start a new subarray (`currentSum = max(arr[i], currentSum + arr[i])`). If all numbers are negative, the maximum single negative number is returned.'
                },
                {
                    id: 'dsa_q2',
                    question: 'How do you detect and find the starting node of a cycle in a Linked List?',
                    difficulty: 'Medium',
                    topic: 'Linked Lists',
                    expectedConcepts: ["Floyd's Cycle-Finding Algorithm (Tortoise and Hare)", 'O(N) Time', 'O(1) Space', 'Mathematical proof of meeting point'],
                    explanation: 'Initialize slow and fast pointers at head. Move slow by 1 step, fast by 2 steps. If fast reaches null, no cycle exists. If slow == fast, reset slow to head. Now move both slow and fast 1 step at a time; the node where they meet is the start of the cycle.'
                },
                {
                    id: 'dsa_q3',
                    question: 'Explain the 0/1 Knapsack Problem and state its time and space complexity.',
                    difficulty: 'Medium',
                    topic: 'Dynamic Programming',
                    expectedConcepts: ['2D DP table', '1D space optimization', 'Time O(N * W)', 'Space O(W)'],
                    explanation: 'Given weights and values of N items, put these items in a knapsack of capacity W to get maximum total value. Recurrence: `dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w - wt[i-1]])`. Space can be optimized to a 1D array of size W+1 by iterating backwards.'
                },
                {
                    id: 'dsa_q4',
                    question: 'What is the difference between BFS and Dijkstra algorithm on weighted vs unweighted graphs?',
                    difficulty: 'Hard',
                    topic: 'Graphs',
                    expectedConcepts: ['Queue vs Min-Heap / Priority Queue', 'Edge weights', 'Time complexities: O(V+E) vs O((V+E)log V)', 'Negative edge limitations'],
                    explanation: 'BFS uses a FIFO queue and finds the shortest path only in unweighted graphs (or graphs with uniform edge weights) in O(V+E) time. Dijkstra uses a min-priority queue to greedily expand the node with the minimum distance, working for non-negative weighted graphs in O((V+E) log V). For negative weights, Bellman-Ford must be used.'
                }
            ]
        },

        oop: {
            id: 'oop',
            name: 'Object-Oriented Programming',
            shortName: 'OOP',
            icon: '🔷',
            subtitle: 'Encapsulation, Abstraction, Inheritance & Polymorphism',
            color: '#6366f1',
            description: 'Master core object-oriented software principles, design patterns (SOLID), class design, memory layout, and runtime vs compile-time polymorphism in C++/Java.',
            whatToLearn: [
                '4 Pillars of OOP: Encapsulation, Abstraction, Inheritance, Polymorphism',
                'Constructors (Default, Parameterized, Copy Constructor, Deep vs Shallow Copy)',
                'Virtual Functions, VTABLE, VPTR, and Pure Virtual Functions (Abstract classes)',
                'Access Modifiers (public, private, protected, default)',
                'Multiple Inheritance & The Diamond Problem (virtual base classes)',
                'SOLID Design Principles & Common Design Patterns (Singleton, Factory, Observer)'
            ],
            youtube: {
                primary: {
                    channel: 'Kunal Kushwaha',
                    title: 'Object Oriented Programming (OOP) in Java & Industry Patterns',
                    url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcno1G3XjUbwzXHL8_EttOuKk',
                    level: 'Beginner to Intermediate',
                    why: 'Crystal-clear, hands-on deep dive into classes, objects, packages, interfaces, inheritance, polymorphism, abstract classes, and generics.'
                },
                alt1: {
                    channel: 'freeCodeCamp (CodeBeauty)',
                    title: 'Object Oriented Programming (OOP) in C++ - Full Course',
                    url: 'https://www.youtube.com/watch?v=wN0x9eZLix4',
                    level: 'Beginner',
                    why: 'High-yield 1.5 hour crash course covering constructors, encapsulation, abstraction, inheritance, and polymorphism in modern C++.'
                },
                alt2: {
                    channel: 'Gate Smashers',
                    title: 'C++ Programming & OOP Concepts for Placements',
                    url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj',
                    level: 'Beginner to Exam Prep',
                    why: 'Direct, exam- and placement-tested lectures detailing virtual functions, destructors, operator overloading, and friend functions.'
                }
            },
            notes: [
                { title: 'GeeksforGeeks OOPs in C++ Complete Guide', url: 'https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/', type: 'Syntax & Deep Dive' },
                { title: 'InterviewBit OOPs Interview Questions & Answers', url: 'https://www.interviewbit.com/oops-interview-questions/', type: 'Top 50 Interview Q&A' },
                { title: 'W3Schools C++ OOP Tutorial', url: 'https://www.w3schools.com/cpp/cpp_oop.asp', type: 'Quick Syntax Reference' }
            ],
            roadmap: [
                { id: 'oop_pillars', section: 'CORE PILLARS', title: 'Encapsulation & Data Hiding vs Abstraction' },
                { id: 'oop_constructors', section: 'OBJECT LIFECYCLE', title: 'Constructors, Destructors, Copy Constructors & Shallow vs Deep Copy' },
                { id: 'oop_inheritance', section: 'INHERITANCE', title: 'Types of Inheritance (Single, Multilevel, Multiple, Hierarchical, Hybrid)' },
                { id: 'oop_diamond', section: 'INHERITANCE', title: 'Diamond Problem & Virtual Base Classes' },
                { id: 'oop_polymorphism', section: 'POLYMORPHISM', title: 'Compile-Time Polymorphism (Method Overloading & Operator Overloading)' },
                { id: 'oop_vtable', section: 'RUNTIME MECHANICS', title: 'Runtime Polymorphism, Virtual Functions, VTABLE & VPTR internals' },
                { id: 'oop_interfaces', section: 'ABSTRACTION', title: 'Pure Virtual Functions, Abstract Classes vs Interfaces' },
                { id: 'oop_solid', section: 'DESIGN PRINCIPLES', title: 'SOLID Principles (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion)' },
                { id: 'oop_patterns', section: 'DESIGN PATTERNS', title: 'Creational & Behavioral Patterns: Singleton, Factory, Strategy, Observer' }
            ],
            practiceTasks: [
                'Implement a thread-safe Singleton pattern in C++ or Java',
                'Demonstrate the Diamond problem in C++ and resolve it using `virtual` inheritance',
                'Build a mini Parking Lot or Library Management System using OOP principles and interfaces'
            ],
            questions: [
                {
                    id: 'oop_q1',
                    question: 'What is Polymorphism and what is the difference between Compile-time and Run-time Polymorphism?',
                    difficulty: 'Easy',
                    topic: 'Polymorphism',
                    expectedConcepts: ['Method Overloading', 'Method Overriding', 'VTABLE / VPTR', 'Early vs Late Binding'],
                    explanation: 'Polymorphism means "many forms". Compile-time polymorphism (Static / Early Binding) is achieved via Function Overloading or Operator Overloading, resolved by the compiler based on method signature. Runtime polymorphism (Dynamic / Late Binding) is achieved via Method Overriding using virtual functions, resolved at runtime using the object’s VTABLE.'
                },
                {
                    id: 'oop_q2',
                    question: 'Explain Shallow Copy vs Deep Copy and when you should write your own Copy Constructor.',
                    difficulty: 'Medium',
                    topic: 'Constructors & Memory Management',
                    expectedConcepts: ['Pointer copying vs memory duplication', 'Dangling pointers', 'Double free errors', 'Rule of Three / Five'],
                    explanation: 'A shallow copy copies all field values directly. If a field is a pointer to heap memory, both the original and the copy will point to the same memory location, causing double-free crashes upon destruction. A deep copy allocates a new chunk of memory and duplicates the contents. You MUST write your own copy constructor whenever your class manages raw pointers or system resources.'
                },
                {
                    id: 'oop_q3',
                    question: 'What is the Diamond Problem in C++ and how is it resolved?',
                    difficulty: 'Medium',
                    topic: 'Inheritance',
                    expectedConcepts: ['Multiple inheritance ambiguity', 'Virtual inheritance (`virtual public Base`)', 'Single base subobject'],
                    explanation: 'The Diamond Problem occurs when class D inherits from both B and C, which both inherit from base class A. D receives two duplicate copies of A’s members, leading to compiler ambiguity. It is resolved using virtual inheritance: `class B : virtual public A` and `class C : virtual public A`, ensuring only one instance of A exists in D.'
                },
                {
                    id: 'oop_q4',
                    question: 'Explain the SOLID design principles with one real-world analogy each.',
                    difficulty: 'Hard',
                    topic: 'Software Architecture',
                    expectedConcepts: ['Single Responsibility', 'Open-Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
                    explanation: 'S: Single Responsibility (A class has one reason to change). O: Open/Closed (Open for extension, closed for modification via inheritance/interfaces). L: Liskov Substitution (Subclasses must be substitutable for base classes without breaking behavior). I: Interface Segregation (Clients shouldn’t be forced to depend on methods they don’t use). D: Dependency Inversion (High-level modules should depend on abstractions, not concrete classes).'
                }
            ]
        },

        dbms: {
            id: 'dbms',
            name: 'Database Management Systems',
            shortName: 'DBMS',
            icon: '🗄️',
            subtitle: 'Relational Model, Normalization, ACID & Indexing',
            color: '#10b981',
            description: 'Understand database internals, ER modeling, relational algebra, normal forms (1NF to BCNF), transaction concurrency control, lock protocols, and B+ Tree indexing.',
            whatToLearn: [
                'File System vs DBMS, 3-tier architecture, Schema vs Instance',
                'Relational Model, Primary Key, Foreign Key, Candidate Key, Super Key',
                'Normalization: Functional Dependencies, 1NF, 2NF, 3NF, BCNF, Lossless Join Decomposition',
                'ACID Properties (Atomicity, Consistency, Isolation, Durability) & Write-Ahead Logging',
                'Transaction Schedules: Serializability (Conflict vs View), Recoverability, Cascading Aborts',
                'Concurrency Control: 2-Phase Locking (Strict/Rigorous 2PL), Deadlock Detection & Prevention',
                'Storage & Indexing: Dense vs Sparse Indexing, Clustered vs Non-Clustered, B-Trees & B+ Trees'
            ],
            youtube: {
                primary: {
                    channel: 'Gate Smashers',
                    title: 'DBMS (Database Management System) Complete Playlist',
                    url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y',
                    level: 'Beginner to Advanced (Placement & Core CS)',
                    why: 'The highest-rated DBMS video series in the tech community. Covers every theoretical concept, numerical example, normalization breakdown, and ACID transaction mechanics with unmatched clarity.'
                },
                alt1: {
                    channel: 'Knowledge Gate',
                    title: 'DBMS Complete Course by Sanchit Jain',
                    url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesR1rSES7oLdJaNFgmuj0SYV',
                    level: 'Intermediate',
                    why: 'Extremely rigorous treatment of functional dependencies, closure sets, canonical covers, serializability graphs, and multi-granularity locking.'
                },
                alt2: {
                    channel: 'freeCodeCamp',
                    title: 'Database Design Course - Learn how to design and plan a database for beginners',
                    url: 'https://www.youtube.com/watch?v=ztHopE5Wnpc',
                    level: 'Beginner to Intermediate',
                    why: 'Practical industry-oriented course on database architecture, normalization in practice, entity relationships, and relational constraints.'
                }
            },
            notes: [
                { title: 'GeeksforGeeks DBMS Complete Notes', url: 'https://www.geeksforgeeks.org/dbms/', type: 'Complete Chapter Notes' },
                { title: 'InterviewBit DBMS Interview Questions', url: 'https://www.interviewbit.com/dbms-interview-questions/', type: 'Top 60 Placement Questions' },
                { title: 'W3Schools SQL & Relational Database Basics', url: 'https://www.w3schools.com/sql/', type: 'Interactive Queries & Concepts' }
            ],
            roadmap: [
                { id: 'dbms_foundations', section: 'FOUNDATION', title: 'DBMS vs File System, 3-Schema Architecture & Data Independence' },
                { id: 'dbms_keys', section: 'FOUNDATION', title: 'Candidate Keys, Super Keys, Primary Keys & Foreign Key Constraints' },
                { id: 'dbms_er', section: 'RELATIONAL MODEL', title: 'ER Diagrams, Weak Entities, Cardinality & Relational Schema Mapping' },
                { id: 'dbms_fd', section: 'NORMALIZATION', title: 'Functional Dependencies, Attribute Closure & Minimal Canonical Cover' },
                { id: 'dbms_norm', section: 'NORMALIZATION', title: '1NF, 2NF (Full FD), 3NF (Transitive FD) & BCNF (Determinant must be Super Key)' },
                { id: 'dbms_lossless', section: 'NORMALIZATION', title: 'Lossless Decomposition & Dependency Preservation Properties' },
                { id: 'dbms_acid', section: 'TRANSACTIONS', title: 'ACID Properties & Transaction State Transition Diagram' },
                { id: 'dbms_schedules', section: 'CONCURRENCY', title: 'Conflict Serializability (Precedence Graph) & View Serializability' },
                { id: 'dbms_locks', section: 'CONCURRENCY', title: 'Two-Phase Locking (2PL), Strict 2PL, Rigorous 2PL & Deadlock Prevention (Wait-Die / Wound-Wait)' },
                { id: 'dbms_indexing', section: 'INDEXING & STORAGE', title: 'B-Tree vs B+ Tree internals, Clustered vs Secondary Indexing & Query Cost' }
            ],
            practiceTasks: [
                'Calculate the Candidate Keys of relation R(A,B,C,D,E) with given functional dependencies',
                'Check whether a 4-transaction schedule is conflict serializable using a directed precedence graph',
                'Explain why database indexes use B+ Trees instead of Binary Search Trees or Hash Tables'
            ],
            questions: [
                {
                    id: 'dbms_q1',
                    question: 'What is Normalization? Explain the difference between 3NF and BCNF.',
                    difficulty: 'Medium',
                    topic: 'Normalization',
                    expectedConcepts: ['Functional Dependencies', 'Transitive Dependency', 'Super Key condition', 'Lossless decomposition vs Dependency preservation'],
                    explanation: 'Normalization reduces data redundancy and eliminates insertion, update, and deletion anomalies. In 3NF, for every non-trivial functional dependency X -> Y, either X is a super key OR Y is a prime attribute. In BCNF (Boyce-Codd Normal Form), X MUST strictly be a super key. All BCNF relations are in 3NF, but not all 3NF relations are in BCNF. BCNF may not always preserve all functional dependencies.'
                },
                {
                    id: 'dbms_q2',
                    question: 'What are ACID properties in a DBMS? How are they enforced?',
                    difficulty: 'Easy',
                    topic: 'Transactions',
                    expectedConcepts: ['Atomicity (Recovery/Undo log)', 'Consistency (Integrity constraints)', 'Isolation (Concurrency control/Locking)', 'Durability (Write-Ahead Logging / Redo log)'],
                    explanation: 'Atomicity: All operations in a transaction succeed or all fail (enforced by WAL / undo logs). Consistency: Database moves from one valid state to another satisfying all schema constraints. Isolation: Concurrent transactions execute without interfering with one another (enforced by 2PL / MVCC / isolation levels). Durability: Once committed, data persists even after crashes (enforced by redo log / non-volatile storage).'
                },
                {
                    id: 'dbms_q3',
                    question: 'Explain Conflict Serializability and how to test for it using a Precedence Graph.',
                    difficulty: 'Medium',
                    topic: 'Concurrency Control',
                    expectedConcepts: ['Conflicting operations (R-W, W-R, W-W on same item by different transactions)', 'Directed Precedence Graph', 'Cycle detection'],
                    explanation: 'Two operations conflict if they belong to different transactions, access the same data item, and at least one is a write operation. A schedule is conflict serializable if it is conflict equivalent to a serial schedule. Construct a directed graph where nodes are transactions; add edge Ti -> Tj if an operation of Ti conflicts with and occurs before an operation of Tj. If the precedence graph has NO cycles, the schedule is conflict serializable.'
                },
                {
                    id: 'dbms_q4',
                    question: 'Why are B+ Trees preferred over Binary Search Trees or Hash Tables for database indexing?',
                    difficulty: 'Hard',
                    topic: 'Indexing & Storage',
                    expectedConcepts: ['Disk block I/O minimization', 'High fan-out', 'Range queries via leaf node linked list', 'Predictable balanced depth'],
                    explanation: 'Databases store data on disk, where disk I/O (block reads) is the primary bottleneck. 1) High Fan-out: B+ Trees have thousands of keys per node, keeping tree height extremely small (3-4 levels for billions of records). 2) Sequential Range Scans: All actual data pointers reside in leaf nodes connected by a doubly-linked list, making range queries (`BETWEEN a AND b`) O(log N + K). Hash indexes cannot handle range queries, and BSTs have large heights leading to excessive disk seeks.'
                }
            ]
        },

        os: {
            id: 'os',
            name: 'Operating Systems',
            shortName: 'OS',
            icon: '💻',
            subtitle: 'Processes, Threads, Virtual Memory, Sync & Deadlocks',
            color: '#0ea5e9',
            description: 'Master operating system architecture, process scheduling algorithms, inter-process communication, thread synchronization, mutexes, semaphores, paging, and page replacement.',
            whatToLearn: [
                'OS Architecture, Kernel vs User Mode, System Calls & Context Switching',
                'Process Management: PCB, Process States, Fork, Exec, Zombie vs Orphan Processes',
                'Threads: User-level vs Kernel-level, Multi-threading Models',
                'CPU Scheduling: FCFS, SJF, SRTF, Round Robin, Priority Scheduling, Convoy Effect',
                'Process Synchronization: Critical Section, Peterson’s Algorithm, Mutex vs Semaphore (Binary/Counting)',
                'Classical Problems: Producer-Consumer, Readers-Writers, Dining Philosophers',
                'Deadlocks: Necessary Conditions (Coffman), Bankers Algorithm, Detection & Recovery',
                'Memory Management: Paging, Segmentation, TLB, Page Faults, FIFO, LRU, Optimal Page Replacement'
            ],
            youtube: {
                primary: {
                    channel: 'Gate Smashers',
                    title: 'Operating System (OS) Complete Placement & Core CS Playlist',
                    url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p',
                    level: 'Beginner to Advanced',
                    why: 'Top choice for engineering placements. Master CPU scheduling, Banker’s algorithm, semaphore code walkthroughs, and virtual memory paging with crystal-clear handwritten diagrams.'
                },
                alt1: {
                    channel: 'Neso Academy',
                    title: 'Operating Systems Full Course',
                    url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRitWSE_AyyyHKEl42U6QkPC',
                    level: 'Beginner to Intermediate',
                    why: 'Rigorous visual explanations of process lifecycle, context switching overhead, virtual memory translation, and page tables.'
                },
                alt2: {
                    channel: 'Knowledge Gate',
                    title: 'Operating System by Sanchit Jain',
                    url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesT4A0_FwtgUtvEr_7p-N2bS',
                    level: 'Intermediate to Advanced',
                    why: 'Deep numerical problem solving for CPU scheduling turn-around times, Peterson algorithm correctness proofs, and disk arm scheduling algorithms.'
                }
            },
            notes: [
                { title: 'GeeksforGeeks Operating Systems Complete Notes', url: 'https://www.geeksforgeeks.org/operating-systems/', type: 'Chapter-wise Notes' },
                { title: 'InterviewBit Operating System Interview Questions', url: 'https://www.interviewbit.com/operating-system-interview-questions/', type: 'Top 50 Interview Q&A' },
                { title: 'Operating Systems: Three Easy Pieces (OSTEP Free Online Book)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'The Definitive Textbook' }
            ],
            roadmap: [
                { id: 'os_intro', section: 'KERNEL & ARCHITECTURE', title: 'Dual Mode Operation (User vs Kernel), System Calls & Context Switch' },
                { id: 'os_process', section: 'PROCESS LIFECYCLE', title: 'Process States, PCB, fork(), exec(), Zombie vs Orphan Processes' },
                { id: 'os_threads', section: 'CONCURRENCY', title: 'Process vs Thread, User vs Kernel Threads & Context Switch Cost' },
                { id: 'os_scheduling', section: 'CPU SCHEDULING', title: 'FCFS, SJF, SRTF, Round Robin, Multilevel Queue & Gantt Chart Calculations' },
                { id: 'os_sync', section: 'SYNCHRONIZATION', title: 'Critical Section, Race Conditions, Mutual Exclusion, Progress & Bounded Waiting' },
                { id: 'os_primitives', section: 'SYNCHRONIZATION', title: 'Mutex vs Semaphore (Binary & Counting) & Test-and-Set Lock' },
                { id: 'os_classical', section: 'SYNCHRONIZATION', title: 'Producer-Consumer Problem, Readers-Writers & Dining Philosophers' },
                { id: 'os_deadlocks', section: 'DEADLOCKS', title: 'Coffman Conditions, Resource Allocation Graph & Banker’s Safety Algorithm' },
                { id: 'os_memory', section: 'MEMORY MANAGEMENT', title: 'Paging, Page Tables, TLB Hit/Miss Ratio & Inverted Page Tables' },
                { id: 'os_virtual', section: 'VIRTUAL MEMORY', title: 'Page Faults, Demand Paging, Belady’s Anomaly & LRU Page Replacement' }
            ],
            practiceTasks: [
                'Solve a Banker’s algorithm numerical given Allocation, Max, and Available matrices',
                'Calculate Turnaround Time and Waiting Time for Round Robin scheduling with time quantum Q=2',
                'Simulate LRU and FIFO page replacement on a reference string and demonstrate Belady’s anomaly'
            ],
            questions: [
                {
                    id: 'os_q1',
                    question: 'What is the fundamental difference between a Process and a Thread?',
                    difficulty: 'Easy',
                    topic: 'Processes & Threads',
                    expectedConcepts: ['Address space sharing', 'Memory overhead', 'Context switch speed', 'Crash isolation'],
                    explanation: 'A process is an executing program with its own independent virtual address space, heap, data, and PCB. A thread is a lightweight unit of execution within a process; threads in the same process share code, data, open files, and heap, but each maintains its own stack, registers, and program counter. Thread context switching is substantially faster than process switching because it does not require changing virtual memory page tables or flushing the TLB.'
                },
                {
                    id: 'os_q2',
                    question: 'What are the four necessary conditions for a Deadlock (Coffman Conditions)?',
                    difficulty: 'Easy',
                    topic: 'Deadlocks',
                    expectedConcepts: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'],
                    explanation: 'A deadlock can occur if and only if all 4 conditions hold simultaneously: 1) Mutual Exclusion: At least one resource must be held in a non-shareable mode. 2) Hold and Wait: A process holds at least one resource and waits for additional resources held by others. 3) No Preemption: Resources cannot be forcibly taken away from a process. 4) Circular Wait: A closed chain of processes exists such that each holds resources needed by the next.'
                },
                {
                    id: 'os_q3',
                    question: 'What is Belady’s Anomaly? Which page replacement algorithms suffer from it?',
                    difficulty: 'Medium',
                    topic: 'Virtual Memory',
                    expectedConcepts: ['FIFO page replacement', 'Increasing frame count increasing page faults', 'Stack algorithms (LRU/Optimal do not suffer)'],
                    explanation: 'Belady’s Anomaly is the counter-intuitive phenomenon where increasing the number of physical page frames results in an INCREASE in the number of page faults for certain access patterns. FIFO (First-In-First-Out) suffers from Belady’s anomaly. Stack-based algorithms like LRU (Least Recently Used) and Optimal Replacement are mathematically guaranteed never to suffer from it.'
                },
                {
                    id: 'os_q4',
                    question: 'Explain how Virtual Memory translation works with Paging and the TLB.',
                    difficulty: 'Hard',
                    topic: 'Memory Management',
                    expectedConcepts: ['Virtual address = Page Number + Offset', 'TLB cache hit vs miss', 'Page Table entry', 'Physical frame translation', 'Effective Memory Access Time formula'],
                    explanation: 'CPU generates a logical address split into Page Number (p) and Offset (d). First, the hardware checks the TLB (Translation Lookaside Buffer). If TLB hit, the Frame Number (f) is retrieved immediately in 1 clock cycle. If TLB miss, the CPU accesses the Page Table in main memory, retrieves f, and updates the TLB. If the valid-invalid bit is 0, a Page Fault interrupt occurs, bringing the page from disk into RAM. Final physical address = (f * Frame Size) + d.'
                }
            ]
        },

        cn: {
            id: 'cn',
            name: 'Computer Networks',
            shortName: 'CN',
            icon: '🌐',
            subtitle: 'OSI 7 Layers, TCP/IP, Routing & Web Protocols',
            color: '#06b6d4',
            description: 'Master network models (OSI / TCP/IP), framing, subnetting, CIDR, distance vector/link state routing, TCP 3-way handshake, congestion control, HTTP/HTTPS, DNS, and TLS.',
            whatToLearn: [
                'OSI 7-Layer Model vs TCP/IP Protocol Suite & Protocol Data Units (PDU)',
                'Data Link Layer: Framing, Bit Stuffing, CRC Error Detection, CSMA/CD, ARP & MAC Addressing',
                'Network Layer: IPv4 vs IPv6, Subnetting, Classless Addressing (CIDR), NAT, ICMP',
                'Routing Algorithms: Distance Vector (Bellman-Ford / Count to Infinity), Link State (Dijkstra / OSPF), BGP',
                'Transport Layer: UDP vs TCP, 3-Way Handshake, 4-Way Connection Termination, Flow Control (Sliding Window)',
                'TCP Congestion Control: Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery',
                'Application Layer: DNS resolution hierarchy, HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC), HTTPS & TLS Handshake'
            ],
            youtube: {
                primary: {
                    channel: 'Gate Smashers',
                    title: 'Computer Networks (CN) Complete Placement & Core CS Playlist',
                    url: 'https://youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_',
                    level: 'Beginner to Advanced',
                    why: 'The benchmark playlist for Computer Networks. Outstanding breakdown of IP subnetting mathematics, CRC polynomials, TCP sequence numbering, and sliding window flow control.'
                },
                alt1: {
                    channel: 'Neso Academy',
                    title: 'Computer Networks Course by Neso Academy',
                    url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx',
                    level: 'Beginner to Intermediate',
                    why: 'Extremely well-animated lectures showing packet encapsulation, OSI layer responsibilities, framing headers, and socket communication.'
                },
                alt2: {
                    channel: 'Hussein Nasser',
                    title: 'Networking Fundamentals for Software Engineers',
                    url: 'https://www.youtube.com/playlist?list=PLQnljOFTspQXjDKhJ45842bpWLcx3-A4z',
                    level: 'Intermediate to Industry',
                    why: 'Real-world software engineering angle: TCP half-open connections, TLS 1.3 handshakes, connection pooling, and HTTP/3 internals.'
                }
            },
            notes: [
                { title: 'GeeksforGeeks Computer Networks Tutorials', url: 'https://www.geeksforgeeks.org/computer-network-tutorials/', type: 'Chapter-by-Chapter' },
                { title: 'InterviewBit Networking Interview Questions', url: 'https://www.interviewbit.com/networking-interview-questions/', type: 'Top 50 Questions' },
                { title: 'Cloudflare Learning Center: How Does the Internet Work?', url: 'https://www.cloudflare.com/learning/', type: 'Industry Guides on DNS & TLS' }
            ],
            roadmap: [
                { id: 'cn_osi', section: 'MODELS', title: 'OSI 7 Layers vs TCP/IP Suite, Encapsulation & PDU Formats' },
                { id: 'cn_dll', section: 'DATA LINK', title: 'Framing, CRC Error Checking, CSMA/CD, MAC Addresses & ARP Protocol' },
                { id: 'cn_ip', section: 'NETWORK LAYER', title: 'IPv4 Header, Subnet Masks, Subnetting & CIDR Calculations' },
                { id: 'cn_routing', section: 'ROUTING', title: 'NAT, ICMP, Distance Vector (Count-to-Infinity) & Link State Routing' },
                { id: 'cn_transport', section: 'TRANSPORT LAYER', title: 'UDP Datagram vs TCP Header & Ports' },
                { id: 'cn_tcp_handshake', section: 'TCP INTERNALS', title: 'TCP 3-Way Handshake (SYN, SYN-ACK, ACK) & 4-Way Connection Teardown' },
                { id: 'cn_tcp_flow', section: 'TCP INTERNALS', title: 'Sliding Window Flow Control & Silly Window Syndrome' },
                { id: 'cn_tcp_congestion', section: 'CONGESTION CONTROL', title: 'Slow Start, Congestion Avoidance, Fast Retransmit & Fast Recovery' },
                { id: 'cn_dns', section: 'APPLICATION LAYER', title: 'DNS Resolution: Root, TLD, Authoritative Nameservers & Recursive Lookup' },
                { id: 'cn_http', section: 'WEB PROTOCOLS', title: 'HTTP/1.1 vs HTTP/2 (Multiplexing) vs HTTP/3 (QUIC) & HTTPS / TLS Handshake' }
            ],
            practiceTasks: [
                'Perform CIDR subnet allocation for 4 subnets of size 50, 25, 12, and 12 hosts from a /24 block',
                'Trace the exact packet flow of typing "google.com" into a browser up to socket connection',
                'Calculate maximum throughput for Stop-and-Wait ARQ vs Go-Back-N protocol given bandwidth and RTT'
            ],
            questions: [
                {
                    id: 'cn_q1',
                    question: 'What happens when you type "https://google.com" in a web browser and hit Enter?',
                    difficulty: 'Medium',
                    topic: 'Full Network Stack',
                    expectedConcepts: ['Browser cache & OS DNS lookup', 'ARP resolution for default gateway', 'TCP 3-Way Handshake', 'TLS 1.3 cryptographic handshake', 'HTTP GET request & server response', 'DOM rendering'],
                    explanation: '1) URL Parsing: Browser extracts protocol (HTTPS), host (google.com), port (443). 2) DNS Lookup: Browser cache -> OS cache -> router -> ISP recursive resolver -> Root -> TLD (.com) -> Authoritative server to obtain Google’s IP. 3) ARP Resolution: Find MAC address of next-hop gateway. 4) TCP Handshake: Client sends SYN, server responds SYN-ACK, client sends ACK. 5) TLS Handshake: ClientHello, ServerHello, certificate validation, session key negotiation. 6) HTTP Request: Browser sends `GET / HTTP/2`. 7) Server processes request and returns HTML response. 8) Browser parses HTML, fetches CSS/JS, and renders DOM.'
                },
                {
                    id: 'cn_q2',
                    question: 'What is the difference between TCP and UDP? When would you choose UDP over TCP?',
                    difficulty: 'Easy',
                    topic: 'Transport Layer',
                    expectedConcepts: ['Connection-oriented vs Connectionless', 'Reliability (ACK, retransmission)', 'Ordered vs Unordered', 'Header size (20B vs 8B)', 'Use cases (VoIP, Gaming, DNS)'],
                    explanation: 'TCP is connection-oriented, reliable (guarantees delivery via ACKs and retransmissions), ordered, provides congestion and flow control, with a minimum 20-byte header. UDP is connectionless, unreliable (fire-and-forget), unordered, has no flow control, with an 8-byte header and low latency. UDP is chosen for real-time video streaming, multiplayer games, voice calls (where lost packets are preferable to latency delays), and simple request-response queries like DNS.'
                },
                {
                    id: 'cn_q3',
                    question: 'Explain TCP 3-Way Handshake and why a 2-way handshake is not sufficient.',
                    difficulty: 'Medium',
                    topic: 'TCP Internals',
                    expectedConcepts: ['SYN with random ISN', 'SYN-ACK', 'ACK', 'Old delayed duplicate packets issue', 'Bi-directional sequence agreement'],
                    explanation: 'Step 1: Client sends SYN with initial sequence number `seq = X`. Step 2: Server receives SYN and responds with SYN-ACK (`seq = Y`, `ack = X + 1`). Step 3: Client sends ACK (`ack = Y + 1`). A 2-way handshake is insufficient because it cannot reliably confirm that both sides can transmit AND receive, and it cannot prevent old duplicate connection requests from incorrectly opening phantom connections on the server.'
                },
                {
                    id: 'cn_q4',
                    question: 'Explain how TCP Congestion Control works (Slow Start, Congestion Avoidance, Fast Retransmit).',
                    difficulty: 'Hard',
                    topic: 'Congestion Control',
                    expectedConcepts: ['Congestion Window (cwnd)', 'ssthresh', 'Exponential vs Linear growth', 'Triple duplicate ACKs vs Timeout'],
                    explanation: '1) Slow Start: cwnd starts at 1 MSS and doubles every RTT (exponential growth) until it reaches `ssthresh`. 2) Congestion Avoidance: Once cwnd >= ssthresh, cwnd increases by only 1 MSS per RTT (linear growth / additive increase). 3) Fast Retransmit: If 3 duplicate ACKs arrive, TCP infers one packet was lost without waiting for a retransmission timeout, immediately retransmits the missing segment, halves ssthresh, and sets cwnd = ssthresh (Fast Recovery / multiplicative decrease).'
                }
            ]
        },

        sql: {
            id: 'sql',
            name: 'SQL & Query Optimization',
            shortName: 'SQL',
            icon: '📊',
            subtitle: 'Joins, Aggregation, Subqueries, CTEs & Window Functions',
            color: '#f59e0b',
            description: 'Master relational data querying, inner/outer/cross joins, GROUP BY, HAVING, subqueries, Correlated Subqueries, Common Table Expressions (CTEs), and analytical Window Functions.',
            whatToLearn: [
                'DDL, DML, DQL, DCL, TCL Commands',
                'All Join Types: INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER, CROSS, SELF JOIN',
                'Grouping & Aggregation: GROUP BY, HAVING vs WHERE, Aggregate Functions (COUNT, SUM, AVG, MAX, MIN)',
                'Subqueries: Nested Subqueries, Correlated Subqueries, EXISTS vs IN',
                'Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE(), LEAD(), LAG(), Over(PARTITION BY ... ORDER BY ...)',
                'Common Table Expressions (CTEs) & Recursive CTEs',
                'Indexing & Performance: EXPLAIN ANALYZE, Index scans vs Sequential scans'
            ],
            youtube: {
                primary: {
                    channel: 'Alex The Analyst',
                    title: 'SQL Playlist for Data & Software Placements',
                    url: 'https://youtube.com/playlist?list=PLUaB-1hjhk8FE_XZ87vPPSfHqb6OcM0cF',
                    level: 'Beginner to Advanced',
                    why: 'Top-tier hands-on SQL tutorial series. Clear walkthroughs of real business datasets, complex joins, subqueries, and window functions used in tech interviews.'
                },
                alt1: {
                    channel: 'freeCodeCamp (Mike Dane)',
                    title: 'SQL Tutorial - Full Database Course for Beginners',
                    url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
                    level: 'Beginner',
                    why: 'Comprehensive 4.5-hour walkthrough covering schema design, CRUD queries, primary/foreign keys, joins, and nested queries.'
                },
                alt2: {
                    channel: 'Kudvenkat',
                    title: 'SQL Server Tutorial for Beginners',
                    url: 'https://www.youtube.com/playlist?list=PL08903FB7ACA1C2FB',
                    level: 'Intermediate to Advanced',
                    why: 'Classic comprehensive playlist explaining stored procedures, triggers, indexing strategies, CTEs, and transaction locks.'
                }
            },
            notes: [
                { title: 'LeetCode Top SQL 50 Study Plan', url: 'https://leetcode.com/studyplan/top-sql-50/', type: 'Must-Solve Interview Questions' },
                { title: 'SQLZoo Interactive Query Platform', url: 'https://sqlzoo.net/', type: 'Interactive In-Browser Exercises' },
                { title: 'W3Schools SQL Complete Reference', url: 'https://www.w3schools.com/sql/', type: 'Query Syntax & Examples' }
            ],
            roadmap: [
                { id: 'sql_basic', section: 'BASIC QUERIES', title: 'SELECT, DISTINCT, WHERE, ORDER BY, LIMIT, OFFSET & LIKE Operators' },
                { id: 'sql_agg', section: 'AGGREGATION', title: 'COUNT, SUM, AVG, MIN, MAX, GROUP BY & WHERE vs HAVING' },
                { id: 'sql_joins', section: 'JOINS', title: 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN & SELF JOIN' },
                { id: 'sql_subqueries', section: 'SUBQUERIES', title: 'Scalar Subqueries, Multi-row Subqueries, Correlated Subqueries & EXISTS' },
                { id: 'sql_window_rank', section: 'WINDOW FUNCTIONS', title: 'ROW_NUMBER(), RANK() vs DENSE_RANK() with PARTITION BY' },
                { id: 'sql_window_lag', section: 'WINDOW FUNCTIONS', title: 'LEAD(), LAG() for Time-Series & Running Sums' },
                { id: 'sql_cte', section: 'ADVANCED SQL', title: 'Common Table Expressions (WITH clause) & Recursive CTEs' },
                { id: 'sql_performance', section: 'OPTIMIZATION', title: 'EXPLAIN / Execution Plans, Composite Indexes & Avoiding SARGable issues' }
            ],
            practiceTasks: [
                'Write a query to find the N-th highest salary from an Employee table without using LIMIT/OFFSET',
                'Find consecutive 3 days of logins using LAG() and LEAD() window functions',
                'Write a query to delete duplicate rows from a table while keeping only the row with the lowest ID'
            ],
            questions: [
                {
                    id: 'sql_q1',
                    question: 'How do you find the second highest salary from an Employee table?',
                    difficulty: 'Easy',
                    topic: 'Subqueries & Window Functions',
                    expectedConcepts: ['`MAX(salary) WHERE salary < (SELECT MAX ...)`', '`DENSE_RANK() OVER (ORDER BY salary DESC)`', 'Handling ties and NULL values'],
                    explanation: 'Approach 1 (Subquery): `SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);` Approach 2 (Window function): `WITH Ranked AS (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk FROM Employee) SELECT salary FROM Ranked WHERE rnk = 2 LIMIT 1;`. DENSE_RANK handles ties gracefully without skipping ranks.'
                },
                {
                    id: 'sql_q2',
                    question: 'What is the difference between WHERE and HAVING clauses?',
                    difficulty: 'Easy',
                    topic: 'Aggregation',
                    expectedConcepts: ['Row filtering before grouping vs Group filtering after aggregation', 'Can use aggregate functions in HAVING, but not in WHERE'],
                    explanation: 'WHERE filters individual records BEFORE aggregation (cannot contain aggregate functions like SUM/COUNT). HAVING filters grouped rows AFTER the GROUP BY clause has executed and evaluated aggregate values.'
                },
                {
                    id: 'sql_q3',
                    question: 'Explain the difference between RANK(), DENSE_RANK(), and ROW_NUMBER().',
                    difficulty: 'Medium',
                    topic: 'Window Functions',
                    expectedConcepts: ['Handling identical values', 'Gap creation in rank sequence', 'Continuous numbering'],
                    explanation: 'For values [100, 100, 80]: 1) `ROW_NUMBER()` assigns unique sequential numbers: 1, 2, 3. 2) `RANK()` gives same rank to ties but creates gaps: 1, 1, 3. 3) `DENSE_RANK()` gives same rank to ties without creating gaps: 1, 1, 2.'
                },
                {
                    id: 'sql_q4',
                    question: 'What is a Correlated Subquery and why can it be inefficient?',
                    difficulty: 'Hard',
                    topic: 'Query Optimization',
                    expectedConcepts: ['Inner query references outer query row', 'Evaluates once per outer row O(M * N)', 'Rewriting into JOIN or CTE'],
                    explanation: 'A correlated subquery is an inner query that references a column from the outer query for each evaluation. Unlike a non-correlated subquery which runs once, a correlated subquery executes once for EVERY row in the outer table, resulting in O(N * M) performance. In production, correlated subqueries are typically refactored into JOINs or CTEs with window functions for O(N log N) execution.'
                }
            ]
        },

        sysdesign: {
            id: 'sysdesign',
            name: 'System Design',
            shortName: 'System Design',
            icon: '🏗️',
            subtitle: 'Scalable Systems, Architecture & Distributed Design',
            color: '#ec4899',
            description: 'Learn to architect production-grade, highly available, low-latency distributed systems from first principles. Complete coverage of fundamentals, core building blocks, distributed consensus, and 12 classic interview case studies.',
            whatToLearn: [
                'System Design Interview 12-Step Framework (Requirements -> Scale -> APIs -> Data Model -> Architecture -> Scaling -> Trade-offs)',
                'Core Fundamentals: Latency vs Throughput, Availability (99.99%), Reliability, CAP Theorem, PACELC',
                'Scaling Strategies: Vertical vs Horizontal, Stateless Architecture, Load Balancing algorithms',
                'Caching In-Depth: Redis, Memcached, Cache-Aside, Write-Through, Write-Back, Eviction (LRU/LFU), Cache Stampede',
                'Database Scaling: SQL vs NoSQL, Master-Slave Replication, Sharding (Consistent Hashing), Read Replicas',
                'Asynchronous Messaging: Message Queues, Pub/Sub, Kafka vs RabbitMQ, Idempotency, Dead Letter Queues',
                'CDN, Object Storage (S3), Reverse Proxy (Nginx), API Gateways, Rate Limiting (Token Bucket)',
                '12 Classic System Design Interview Case Studies (URL Shortener, Chat, YouTube, Uber, etc.)'
            ],
            youtube: {
                primary: {
                    channel: 'Gaurav Sen (gkcs)',
                    title: 'System Design Interview Preparation Complete Playlist',
                    url: 'https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX',
                    level: 'Beginner to Advanced',
                    why: 'Pioneered system design video tutorials. Incomparable intuition on Consistent Hashing, Message Queues, Microservices, Caching, and distributed trade-offs.'
                },
                alt1: {
                    channel: 'ByteByteGo (Alex Xu)',
                    title: 'ByteByteGo System Design Video Series',
                    url: 'https://www.youtube.com/playlist?list=PLCRMIe5FDPsd0gVs500xeOewfySTsmEjf',
                    level: 'Intermediate to Advanced',
                    why: 'Visually stunning architectural breakdowns from the author of the bestselling System Design Interview books. Covers rate limiters, payment systems, and distributed caches.'
                },
                alt2: {
                    channel: 'Aced / Exponent',
                    title: 'System Design Mock Interviews with FAANG Engineers',
                    url: 'https://www.youtube.com/playlist?list=PL55symSEWBbP_3fG_r6AU1XAG9UzokIdE',
                    level: 'Interview Practice',
                    why: 'Watch real mock interviews conducted by senior software engineers from Google, Meta, and Amazon, demonstrating how to communicate trade-offs.'
                }
            },
            notes: [
                { title: 'Donne Martin: The System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', type: 'The Industry Bible (250k+ Stars)' },
                { title: 'ByteByteGo System Design Newsletter & Blog', url: 'https://blog.bytebytego.com/', type: 'Visual Architectural Breakdowns' },
                { title: 'Roadmap.sh System Design Roadmap', url: 'https://roadmap.sh/system-design', type: 'Interactive Skills Tree' }
            ],
            levels: {
                level1: {
                    name: 'LEVEL 1 — FUNDAMENTALS',
                    subtitle: 'Core concepts, scaling strategies & trade-offs',
                    concepts: [
                        {
                            name: 'What is System Design?',
                            what: 'The process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements.',
                            why: 'Modern applications serve millions of concurrent users and petabytes of data; monolithic systems collapse under such load.',
                            when: 'Designing any software system expected to scale beyond a single machine.',
                            tradeoff: 'Increased operational complexity and distributed failure modes vs high scalability and uptime.',
                            example: 'Migrating an e-commerce monolithic app into modular microservices with caching and message queues.',
                            question: 'How do you approach scaling a monolithic application that is experiencing database connection exhaustion?'
                        },
                        {
                            name: 'Functional vs Non-Functional Requirements',
                            what: 'Functional requirements define WHAT the system does (features). Non-functional requirements define HOW WELL it performs (availability, latency, consistency).',
                            why: 'Clarifies scope and prevents engineering the wrong system.',
                            when: 'The very first 5 minutes of any system design interview.',
                            tradeoff: 'Strict consistency degrades latency; high availability may return stale data.',
                            example: 'Twitter: Functional = Post a tweet, follow user. Non-functional = High read availability, p99 latency < 200ms.',
                            question: 'Can you list the functional and non-functional requirements for an Instagram Story feature?'
                        },
                        {
                            name: 'Scalability (Horizontal vs Vertical)',
                            what: 'Vertical scaling (Scaling Up) adds more CPU/RAM to a single server. Horizontal scaling (Scaling Out) adds more machines to the pool.',
                            why: 'Vertical scaling hits hard hardware limits and has a single point of failure (SPOF). Horizontal scaling allows virtually infinite capacity.',
                            when: 'Scale vertically for quick MVPs; scale horizontally when traffic outgrows top-tier hardware.',
                            tradeoff: 'Horizontal scaling requires stateless servers, load balancers, and distributed data partitioning.',
                            example: 'Upgrading an AWS EC2 instance from t3.medium to c5.9xlarge (Vertical) vs spinning up an Auto Scaling Group behind an ALB (Horizontal).',
                            question: 'When would you deliberately choose vertical scaling over horizontal scaling?'
                        },
                        {
                            name: 'Availability vs Reliability',
                            what: 'Availability is the percentage of time the system is operational (e.g. 99.99% "Four Nines"). Reliability is the probability that the system performs its function without failure over a given period.',
                            why: 'A system can be available (returning HTTP 200) but unreliable (returning wrong data).',
                            when: 'Defining SLAs, SLOs, and multi-region failover setups.',
                            tradeoff: 'High availability requires redundant active-active servers, driving up infrastructure cost.',
                            example: 'Payment gateway must guarantee zero lost transactions (high reliability) and 99.999% uptime.',
                            question: 'What is the difference between an SLA, SLO, and SLI?'
                        },
                        {
                            name: 'Latency vs Throughput',
                            what: 'Latency is the time taken to process a single request (measured in milliseconds). Throughput is the number of requests processed per unit time (QPS / RPS).',
                            why: 'Optimizing for throughput (batching) can hurt individual request latency.',
                            when: 'Benchmarking APIs, queuing systems, and database queries.',
                            tradeoff: 'Batching 1000 records increases throughput 10x but adds 50ms buffering latency to individual events.',
                            example: 'Video streaming: High throughput needed for chunk downloads; low latency needed for live comments.',
                            question: 'How do you optimize an API that has high throughput but suffers from p99 latency spikes?'
                        },
                        {
                            name: 'CAP Theorem & PACELC',
                            what: 'In a distributed data store, you can only guarantee at most TWO out of Consistency, Availability, and Partition Tolerance. In reality, partitions WILL happen, so you must choose CP or AP. PACELC extends this: If Partition (P), choose Availability (A) or Consistency (C); Else (E), choose Latency (L) or Consistency (C).',
                            why: 'Fundamental law governing all distributed databases.',
                            when: 'Selecting a database (e.g. Cassandra vs PostgreSQL vs MongoDB).',
                            tradeoff: 'CP systems reject writes during network splits to preserve truth; AP systems accept writes but risk divergence.',
                            example: 'Banking ledger = CP (RDBMS/Spanner). Social media likes counter = AP (DynamoDB/Cassandra).',
                            question: 'Under CAP theorem, why is a CA system impossible in a distributed environment across networks?'
                        },
                        {
                            name: 'Load Balancing',
                            what: 'Distributes incoming network traffic across a group of backend servers.',
                            why: 'Prevents any single server from becoming a bottleneck and routes traffic around crashed instances.',
                            when: 'Any architecture with more than 1 application server.',
                            tradeoff: 'Layer 4 (Transport/IP) is fast with low CPU; Layer 7 (Application/HTTP) enables smart routing but adds CPU overhead.',
                            example: 'Nginx, HAProxy, AWS Application Load Balancer using Round Robin, Least Connections, or IP Hash.',
                            question: 'How does consistent hashing differ from simple modulo load balancing when servers scale up or down?'
                        },
                        {
                            name: 'Caching & Eviction Policies',
                            what: 'Stores expensive query or computation results in fast in-memory storage (RAM).',
                            why: 'Dramatically reduces read latency from 50ms (disk DB) to <2ms (in-memory).',
                            when: 'Read-heavy systems (read:write ratio > 10:1).',
                            tradeoff: 'Cache invalidation is notoriously difficult; risk of serving stale data.',
                            example: 'Redis / Memcached holding user profiles, with LRU (Least Recently Used) eviction policy.',
                            question: 'What are Cache-Aside, Write-Through, and Write-Back patterns and their trade-offs?'
                        },
                        {
                            name: 'SQL vs NoSQL',
                            what: 'SQL databases are relational, structured with ACID compliance (PostgreSQL, MySQL). NoSQL databases are non-relational, schema-flexible (Document, Key-Value, Columnar, Graph).',
                            why: 'Different access patterns require different storage engines.',
                            when: 'SQL for complex joins and transactional integrity. NoSQL for unstructured data, high write throughput, and horizontal sharding.',
                            tradeoff: 'SQL scale-out requires complex sharding; NoSQL sacrifices ACID and complex multi-table joins.',
                            example: 'PostgreSQL for e-commerce orders; Cassandra for IoT sensor time-series telemetry.',
                            question: 'When should you choose MongoDB over PostgreSQL?'
                        },
                        {
                            name: 'Database Replication & Sharding',
                            what: 'Replication copies data to multiple nodes (Primary-Replica). Sharding splits data horizontally across multiple databases based on a shard key.',
                            why: 'Replication scales reads and provides failover; sharding scales writes and total storage capacity.',
                            when: 'Replicate when read traffic is high. Shard when data size exceeds a single disk or write QPS exceeds single primary capacity.',
                            tradeoff: 'Cross-shard joins and distributed transactions (2PC) are notoriously slow and complex.',
                            example: 'Sharding users by `user_id % 16` across 16 database nodes with Consistent Hashing.',
                            question: 'What is the "Hot Shard" problem and how do you mitigate it?'
                        },
                        {
                            name: 'Message Queues & Pub/Sub',
                            what: 'Asynchronous communication buffers where producers push messages and consumers pull/process them.',
                            why: 'Decouples services, absorbs traffic spikes (rate smoothing/backpressure), and guarantees eventual processing.',
                            when: 'Email notifications, video transcoding, payment webhooks, async jobs.',
                            tradeoff: 'Adds infrastructure complexity, eventual consistency, and requires idempotent consumer handling.',
                            example: 'Kafka, RabbitMQ, AWS SQS decoupling order placement from payment receipt generation.',
                            question: 'How do you guarantee exactly-once processing when using a message queue?'
                        },
                        {
                            name: 'Content Delivery Network (CDN)',
                            what: 'A geographically distributed network of proxy servers that cache static assets (images, videos, JS/CSS) close to end users.',
                            why: 'Reduces latency by shortening physical distance packets travel, offloading 80%+ traffic from origin servers.',
                            when: 'Any global application serving media, static assets, or edge API responses.',
                            tradeoff: 'Asset invalidation latency and bandwidth egress costs.',
                            example: 'Cloudflare, CloudFront caching profile pictures and YouTube video chunks at edge points of presence (PoPs).',
                            question: 'How does CDN cache invalidation work using versioned URLs (cache busting)?'
                        },
                        {
                            name: 'API Design & REST vs gRPC vs GraphQL',
                            what: 'Protocols and specifications for client-server communication.',
                            why: 'Dictates contract clarity, payload efficiency, and developer velocity.',
                            when: 'Designing public vs internal service-to-service communication.',
                            tradeoff: 'REST is standard and easy to cache; gRPC is ultra-fast via HTTP/2 and Protobuf but binary; GraphQL solves over-fetching but complicates caching.',
                            example: 'Public web app uses REST/GraphQL; internal microservices communicate via gRPC.',
                            question: 'Design an idempotent REST API for debiting a customer wallet.'
                        }
                    ]
                },
                level2: {
                    name: 'LEVEL 2 — CORE COMPONENTS',
                    subtitle: 'Architectural building blocks of modern cloud platforms',
                    components: [
                        { name: 'Load Balancer (L4 vs L7)', desc: 'Directs traffic based on IP/Port (L4) or HTTP headers/paths (L7). Health checks remove unhealthy instances.' },
                        { name: 'Reverse Proxy (Nginx / HAProxy)', desc: 'Sits in front of servers to handle SSL termination, compression (Gzip/Brotli), security filtering, and caching.' },
                        { name: 'API Gateway (Kong / Envoy)', desc: 'Single entry point for microservices managing authentication, rate limiting, logging, routing, and telemetry.' },
                        { name: 'Distributed Cache (Redis Cluster)', desc: 'In-memory key-value store with clustering, master-replica replication, and Sentinel auto-failover.' },
                        { name: 'Database Read Replicas', desc: 'Asynchronous or semi-synchronous replicas that absorb read queries while the primary processes writes.' },
                        { name: 'Message Broker (Kafka vs RabbitMQ)', desc: 'Kafka is a distributed append-only commit log built for high-throughput streaming. RabbitMQ is a smart-broker queue for discrete task routing.' },
                        { name: 'Object Storage (AWS S3 / MinIO)', desc: 'Flat storage for unstructured files (images, video blobs, backups) with 99.999999999% (11 9s) durability.' },
                        { name: 'Rate Limiter (Token Bucket / Sliding Window)', desc: 'Protects APIs from denial of service and abuse. Redis Lua scripts ensure atomic rate-limit checks.' },
                        { name: 'Authentication & Session Service', desc: 'Stateless JWT validation at API Gateway or stateful distributed Redis session storage.' }
                    ]
                },
                level3: {
                    name: 'LEVEL 3 — DISTRIBUTED SYSTEMS',
                    subtitle: 'Advanced mechanics, consensus & resilience patterns',
                    concepts: [
                        { name: 'Consistency Models', desc: 'Strong Consistency, Eventual Consistency, Causal Consistency, Read-Your-Writes Consistency.' },
                        { name: 'Idempotency Keys', desc: 'Ensures that making the exact same API call multiple times produces the exact same outcome without side effects (crucial for payments).' },
                        { name: 'Circuit Breaker Pattern', desc: 'Prevents cascading system failure by failing fast when a downstream dependency is unresponsive (Closed -> Open -> Half-Open).' },
                        { name: 'Backpressure & Rate Smoothing', desc: 'When downstream consumers cannot keep up with upstream producers, queuing buffers and drop policies prevent out-of-memory crashes.' },
                        { name: 'Distributed Locking (Redlock / ZooKeeper)', desc: 'Coordinates exclusive access to shared resources across multiple distributed application nodes using lease timers.' },
                        { name: 'Consensus Algorithms (Raft / Paxos Basics)', desc: 'How distributed nodes agree on a single data value or state transition even in the presence of node crashes or network partitions.' },
                        { name: 'Two-Phase Commit (2PC) vs Saga Pattern', desc: '2PC provides distributed ACID transactions but blocks during coordinator failure. Saga breaks transactions into local steps with compensating rollback transactions.' }
                    ]
                },
                level4: {
                    name: 'LEVEL 4 — 12 INTERVIEW DESIGN PATTERNS',
                    subtitle: 'Classic FAANG/PBC interview systems with the 12-Step Framework',
                    systems: [
                        {
                            id: 'sys_url_shortener',
                            name: 'URL Shortener (TinyURL)',
                            icon: '🔗',
                            readWriteRatio: '100:1 (Read-heavy)',
                            scale: '100M URLs created/month, 10B clicks/month (~3800 QPS read)',
                            storage: '7-character Base62 string (`[a-zA-Z0-9]`), 3.5TB over 5 years',
                            steps: {
                                reqs: 'Functional: Given long URL, generate short unique alias. Accessing short URL redirects to long URL with 301/302. Custom alias optional. Non-functional: 99.99% availability, redirect latency < 20ms, URLs expire after TTL.',
                                scaleEst: 'Writes: 100M / (30 * 86400) = ~40 URLs/sec. Reads: 10B / (30 * 86400) = ~3850 reads/sec. Storage: 100M * 500 bytes = 50GB/month.',
                                apis: 'POST /api/v1/shorten { longUrl, customAlias?, expireAt? } -> { shortUrl }\nGET /{shortCode} -> HTTP 301 Redirect to longUrl',
                                dataModel: 'SQL or NoSQL Key-Value: `url_mapping (short_code PK, long_url, user_id, created_at, expires_at)`',
                                arch: 'Client -> Route53 -> ALB -> API Servers -> Redis Cache -> MongoDB / DynamoDB / PostgreSQL Shards.',
                                keyInsight: 'Base62 Encoding vs Key Generation Service (KGS). KGS pre-generates 7-character strings in advance and stores them in DB to avoid collision overhead during runtime writes.'
                            }
                        },
                        {
                            id: 'sys_pastebin',
                            name: 'Pastebin / Code Sharing Service',
                            icon: '📋',
                            readWriteRatio: '20:1 (Read-heavy)',
                            scale: '10M pastes/month, paste size up to 2MB',
                            storage: 'Metadata in NoSQL, paste text blobs in S3 Object Storage',
                            steps: {
                                reqs: 'Functional: Users paste text and get unique link. Configurable expiration. Non-functional: High availability, low latency reads, high durability.',
                                scaleEst: 'Writes: ~4/sec, Reads: ~80/sec. Ingest storage: 10M * 100KB = 1TB/month.',
                                apis: 'POST /api/v1/pastes { content, title, expireAfter } -> { pasteId }\nGET /api/v1/pastes/{pasteId} -> { content, metadata }',
                                dataModel: 'Metadata DB: `paste_id, user_id, s3_key, created_at, expires_at`. Content Store: S3 Bucket keyed by paste_id.',
                                arch: 'Load Balancer -> App Servers -> Metadata DB + S3 Object Storage + Redis Cache + CDN for popular pastes.',
                                keyInsight: 'Do not store large paste blobs directly inside relational database tables. Store text objects in S3 and cache hot pastes in Redis.'
                            }
                        },
                        {
                            id: 'sys_rate_limiter',
                            name: 'API Rate Limiter',
                            icon: '⏱️',
                            readWriteRatio: 'Write/Read on every single incoming API call',
                            scale: '1M QPS aggregate across all APIs, response overhead < 1ms',
                            storage: 'In-memory Redis Cluster with Lua scripts',
                            steps: {
                                reqs: 'Functional: Limit requests per user/IP/token (e.g. 100 req/min). Return HTTP 429 Too Many Requests when exceeded. Non-functional: Low latency, low memory footprint, distributed accuracy.',
                                scaleEst: '100M daily active users * 50 requests/day = 5B req/day = ~60k average QPS, peak 200k QPS.',
                                apis: 'Integrated as Middleware / API Gateway filter inspecting headers (`X-Forwarded-For`, `Authorization`).',
                                dataModel: 'Redis Key: `rate:{user_id}:{minute}` with TTL, or Redis Sorted Set for Sliding Window Log.',
                                arch: 'Client -> API Gateway (Envoy/Kong) -> Rate Limiter Filter -> Redis Cluster (Lua script) -> Backend Services.',
                                keyInsight: 'Token Bucket and Sliding Window Counter are the industry choices. Token bucket is memory-efficient; Redis Lua scripts prevent race conditions in distributed environments.'
                            }
                        },
                        {
                            id: 'sys_chat',
                            name: 'Real-Time Chat App (WhatsApp / Slack)',
                            icon: '💬',
                            readWriteRatio: '1:1 (Message sent = Message delivered)',
                            scale: '500M DAU, 50B messages/day (~600k messages/sec)',
                            storage: 'Cassandra / HBase for message history, Redis for presence',
                            steps: {
                                reqs: 'Functional: 1-on-1 chat, group chat, delivery receipts (sent, delivered, read), online presence. Non-functional: Ultra-low latency (<100ms), 99.999% availability, zero message loss.',
                                scaleEst: '50B msgs / 86400 = ~580k msgs/sec. Peak = 1.5M msgs/sec. Daily storage = 50B * 100 bytes = 5TB/day.',
                                apis: 'Persistent WebSocket connection for bi-directional real-time messaging; REST for media upload and authentication.',
                                dataModel: 'Cassandra: `messages (chat_id, message_id TIMEUUID, sender_id, content, created_at, status)` partitioned by chat_id.',
                                arch: 'Client -> WebSocket Gateway -> Session Service (Redis) -> Message Service -> Kafka -> Message Persistence Workers -> Cassandra.',
                                keyInsight: 'HTTP polling is inefficient; WebSockets maintain long-lived TCP connections. Message sequence numbers generated using Snowflake IDs ensure chronological ordering.'
                            }
                        },
                        {
                            id: 'sys_notification',
                            name: 'Distributed Notification System',
                            icon: '🔔',
                            readWriteRatio: 'High write throughput, bursts during marketing campaigns',
                            scale: '10M notifications/minute across Push, SMS, and Email',
                            storage: 'Kafka for task buffering, PostgreSQL for user notification preferences',
                            steps: {
                                reqs: 'Functional: Send Push (APNS/FCM), SMS (Twilio), Email (SendGrid). Support user opt-out preferences and templating. Non-functional: Soft real-time delivery, retry mechanism with exponential backoff.',
                                scaleEst: 'Peak throughput: 200k notifications/sec during global flash sales.',
                                apis: 'POST /api/v1/notifications/send { recipient_id, template_id, channels: ["push","sms"], data: {} }',
                                dataModel: '`notification_jobs (id, user_id, channel, status, retries, created_at)`',
                                arch: 'Microservices -> Notification API -> User Preference Service -> Kafka Topics (split by channel: push, sms, email) -> Worker Pools -> Third-party Gateways.',
                                keyInsight: 'Decouple channels using dedicated Kafka topics so a slow SMS gateway never delays real-time push notifications. Implement Dead Letter Queues (DLQ) for failed dispatches.'
                            }
                        },
                        {
                            id: 'sys_file_storage',
                            name: 'Cloud File Storage (Google Drive / Dropbox)',
                            icon: '📁',
                            readWriteRatio: '1:1 Read/Write for sync files',
                            scale: '50M DAU, average file 1MB, 100M files synced daily',
                            storage: 'Chunking service (4MB chunks), S3 for chunk blobs, MySQL/NoSQL for metadata',
                            steps: {
                                reqs: 'Functional: Upload, download, sync across devices, file versioning. Non-functional: High durability (11 9s), bandwidth optimization via chunking and deduplication.',
                                scaleEst: '100M files * 1MB = 100TB new data per day. Bandwidth: 100TB / 86400 = ~1.2 GB/sec.',
                                apis: 'POST /api/v1/files/upload_chunk { chunk_hash, chunk_data }\nGET /api/v1/files/{file_id}/versions',
                                dataModel: '`file (id, user_id, name, total_size)`, `file_chunk (file_id, chunk_index, chunk_hash, size)`',
                                arch: 'Desktop Client (Block splitter + hasher) -> API Gateway -> Chunk Storage Service (S3) + Metadata DB + Notification Service (WebSocket sync).',
                                keyInsight: 'Content-addressable chunking (4MB blocks with SHA-256 hash). Only upload modified chunks to save bandwidth. Identical chunks across files are deduplicated.'
                            }
                        },
                        {
                            id: 'sys_youtube',
                            name: 'Video Streaming Platform (YouTube / Netflix)',
                            icon: '▶️',
                            readWriteRatio: '1000:1 (Read-heavy video streaming)',
                            scale: '2B users, 500 hours uploaded/min, 1B hours watched/day',
                            storage: 'Blob Storage (S3), Transcoding Workers, Global CDN PoPs',
                            steps: {
                                reqs: 'Functional: Upload video, adaptive bitrate streaming (DASH / HLS: 1080p, 720p, 480p), search, view counter. Non-functional: Zero buffering, high availability, fast uploads.',
                                scaleEst: 'Uploads: 500 hours/min * 60 = 30k hours/hour. Streaming: 1B hours/day requires massive CDN bandwidth (Petabits/sec).',
                                apis: 'POST /api/v1/videos/upload -> Returns S3 presigned URL for direct multipart upload.\nGET /api/v1/videos/{video_id}/manifest.m3u8',
                                dataModel: 'Video metadata in MongoDB/PostgreSQL: `id, user_id, title, status, resolutions, s3_manifest_url`. View counts in Redis/Cassandra.',
                                arch: 'Client -> Direct S3 Upload -> SQS -> Transcoder Farm (FFmpeg chunking into HLS/DASH) -> CDN Edge PoPs -> Client Video Player.',
                                keyInsight: 'Never upload video through API servers; use presigned S3 URLs directly from client. Split video into 5-second chunks at multiple resolutions for adaptive streaming.'
                            }
                        },
                        {
                            id: 'sys_instagram',
                            name: 'Social Media Feed (Instagram / Twitter)',
                            icon: '📸',
                            readWriteRatio: '100:1 (Read-heavy timeline)',
                            scale: '500M DAU, each user follows 200 accounts, 100M posts/day',
                            storage: 'Redis Feed In-Memory Cache, Cassandra for Post Storage, S3 for Photos',
                            steps: {
                                reqs: 'Functional: Post photo, follow users, view home feed composed of posts from followed users. Non-functional: News feed generation latency < 200ms, high availability.',
                                scaleEst: 'Reads: 500M users * 20 feed refreshes = 10B feed views/day = ~115k QPS. Writes: 100M posts/day = ~1150 posts/sec.',
                                apis: 'POST /api/v1/posts { caption, media_id }\nGET /api/v1/feed?page=1&limit=20',
                                dataModel: '`posts (id, user_id, media_url, caption, created_at)`. Feed cache: Redis Sorted Set `feed:{user_id}` (key = post_id, score = timestamp).',
                                arch: 'Client -> CDN -> ALB -> Feed Service -> Redis Sorted Sets (Timeline) + Graph/Follow Service + S3 CDN for media.',
                                keyInsight: 'Hybrid Fan-out Strategy: For regular users, fan-out on WRITE (push new post ID to all followers’ Redis feeds). For celebrities (millions of followers), fan-out on READ to prevent write amplification.'
                            }
                        },
                        {
                            id: 'sys_uber',
                            name: 'Ride Sharing Service (Uber / Lyft)',
                            icon: '🚗',
                            readWriteRatio: 'High write throughput (Driver GPS pinged every 4 seconds)',
                            scale: '10M active drivers, 100M active riders, 1M ride requests/hour',
                            storage: 'Geospatial Index (QuadTree / Google S2 / Redis GeoHash)',
                            steps: {
                                reqs: 'Functional: Driver location tracking, Rider requests ride, Match rider with nearest available drivers, Trip tracking & billing. Non-functional: Real-time driver location updates, match latency < 2 seconds.',
                                scaleEst: '10M drivers updating GPS every 4 sec = 2.5M location updates/sec! In-memory geospatial indexing is required.',
                                apis: 'WebSocket / UDP for Driver location pings: `{ driver_id, lat, lng }`\nPOST /api/v1/rides/request { pickup_lat, pickup_lng, destination }',
                                dataModel: 'Redis Geo / QuadTree for current driver locations. PostgreSQL for trip history and payment ledgers.',
                                arch: 'Driver App -> WebSocket Gateway -> Location Ingestion Service -> Redis Cluster (GEOADD / GEORADIUS) -> Match Engine -> Rider App.',
                                keyInsight: 'Divide the world map into cells using Google S2 Geometry or Uber H3 hexagonal hierarchical spatial index to perform rapid nearby driver radius queries.'
                            }
                        },
                        {
                            id: 'sys_ecommerce',
                            name: 'E-Commerce Flash Sale System (Amazon / Flipkart)',
                            icon: '🛒',
                            readWriteRatio: 'Extreme read & write spike at sale start (e.g. 100k requests/sec for 1000 items)',
                            scale: '10M users hitting checkout within 10 seconds of flash sale launch',
                            storage: 'Redis with Lua script for atomic stock decrement, MySQL with Row-level locking',
                            steps: {
                                reqs: 'Functional: Flash sale countdown, stock decrement, cart checkout, order confirmation. Non-functional: Strictly prevent overselling (inventory must never drop below 0), high availability.',
                                scaleEst: 'Peak traffic: 100k checkout attempts/sec competing for limited stock.',
                                apis: 'POST /api/v1/flash-sale/order { item_id, user_id, idempotency_key }',
                                dataModel: '`inventory (item_id PK, total_stock, available_stock, version)`',
                                arch: 'CDN for static landing page -> Rate Limiter -> Queue (Kafka) -> In-memory Redis Inventory check (atomic DECR) -> Order Service -> DB Transaction.',
                                keyInsight: 'Never query relational database for stock availability during flash sales. Pre-warm stock count in Redis cache. Use an atomic Lua script `if redis.call("get", key) > 0 then redis.call("decr", key) return 1 else return 0 end` to eliminate race conditions.'
                            }
                        },
                        {
                            id: 'sys_ticket_booking',
                            name: 'Ticket Booking System (BookMyShow / Ticketmaster)',
                            icon: '🎟️',
                            readWriteRatio: '100:1 read to seat reservation ratio, high concurrency on popular seats',
                            scale: 'Popular concert with 50,000 seats selling out in 3 minutes',
                            storage: 'PostgreSQL for seat transactions, Redis Distributed Lock for 10-minute temporary seat holds',
                            steps: {
                                reqs: 'Functional: View theater seat layout, temporarily hold seats for 10 minutes during payment, finalize booking upon payment success, release seats if payment fails. Non-functional: Zero double-booking.',
                                scaleEst: '50k concurrent users trying to select the same front-row seats.',
                                apis: 'POST /api/v1/shows/{show_id}/hold-seats { seat_ids: [A1, A2], user_id }\nPOST /api/v1/bookings/confirm { booking_id, payment_token }',
                                dataModel: '`seats (show_id, seat_id, status: AVAILABLE | HELD | BOOKED, held_until, user_id)`',
                                arch: 'Client -> Seat Selection API -> Redis Distributed Lock (Redlock with 10-minute TTL) -> Payment Gateway -> Async Job Queue to release expired holds.',
                                keyInsight: 'Temporary seat holding mechanism using Redis TTL and distributed lock. If payment is not completed in 10 minutes, key expires and seat returns to AVAILABLE pool.'
                            }
                        },
                        {
                            id: 'sys_food_delivery',
                            name: 'Food Delivery Platform (Swiggy / DoorDash)',
                            icon: '🍔',
                            readWriteRatio: 'High read menu browsing, real-time tracking during delivery',
                            scale: '5M orders/day, 500k active delivery partners, real-time live map tracking',
                            storage: 'PostgreSQL for restaurant menus/orders, Redis for driver locations, Kafka for order lifecycle state machine',
                            steps: {
                                reqs: 'Functional: Search restaurants, place order, restaurant accepts order, dispatch to delivery driver, live GPS tracking. Non-functional: Sub-second order broadcast, 99.99% availability.',
                                scaleEst: 'Peak dinner rush: 20k orders/minute.',
                                apis: 'POST /api/v1/orders/create { restaurant_id, items, delivery_address }\nGET /api/v1/orders/{order_id}/track',
                                dataModel: '`orders (id, customer_id, restaurant_id, driver_id, status: PLACED|ACCEPTED|PREPARING|PICKED_UP|DELIVERED, amount)`',
                                arch: 'Client -> Order Service -> Kafka Order Event Pipeline -> Restaurant Dashboard App -> Driver Dispatch Service (S2 spatial match) -> Live Tracking WebSockets.',
                                keyInsight: 'Order lifecycle is a strict Finite State Machine (FSM). Use Kafka event-driven choreography so each actor (Customer, Restaurant, Delivery Partner) transitions state reliably.'
                            }
                        }
                    ]
                }
            },
            roadmap: [
                { id: 'sd_fund_reqs', section: 'LEVEL 1: FUNDAMENTALS', title: 'Functional vs Non-Functional Requirements & Back-of-the-envelope Estimation' },
                { id: 'sd_scaling', section: 'LEVEL 1: FUNDAMENTALS', title: 'Horizontal vs Vertical Scaling, Stateless Servers & Load Balancing' },
                { id: 'sd_cap', section: 'LEVEL 1: FUNDAMENTALS', title: 'CAP Theorem, PACELC, High Availability & Reliability Calculations' },
                { id: 'sd_caching', section: 'LEVEL 1: FUNDAMENTALS', title: 'Caching Strategies (Cache-Aside, Write-Through, Write-Back) & Eviction (LRU)' },
                { id: 'sd_databases', section: 'LEVEL 1: FUNDAMENTALS', title: 'SQL vs NoSQL, Master-Slave Replication, Sharding & Consistent Hashing' },
                { id: 'sd_queues', section: 'LEVEL 1: FUNDAMENTALS', title: 'Message Queues, Pub/Sub, Kafka vs RabbitMQ, Asynchronous Processing' },
                { id: 'sd_cdn_api', section: 'LEVEL 1: FUNDAMENTALS', title: 'CDN Edge Caching, Object Storage (S3), Reverse Proxies & Rate Limiting' },
                { id: 'sd_core_comps', section: 'LEVEL 2: CORE COMPONENTS', title: 'API Gateway, Reverse Proxy, Distributed Cache & Identity Service' },
                { id: 'sd_dist_sys', section: 'LEVEL 3: DISTRIBUTED SYSTEMS', title: 'Consistency Models, Idempotency, Circuit Breaker & Distributed Locking' },
                { id: 'sd_pat_url', section: 'LEVEL 4: INTERVIEW PATTERNS', title: 'Design a URL Shortener (TinyURL / Base62 / KGS)' },
                { id: 'sd_pat_chat', section: 'LEVEL 4: INTERVIEW PATTERNS', title: 'Design a Real-Time Chat System (WebSockets / Cassandra / Presence)' },
                { id: 'sd_pat_youtube', section: 'LEVEL 4: INTERVIEW PATTERNS', title: 'Design a Video Streaming Platform (YouTube / HLS / Transcoder)' },
                { id: 'sd_pat_feed', section: 'LEVEL 4: INTERVIEW PATTERNS', title: 'Design a Social Media Feed (Instagram / Fan-out on Write vs Read)' },
                { id: 'sd_pat_uber', section: 'LEVEL 4: INTERVIEW PATTERNS', title: 'Design a Ride-Hailing Platform (Uber / QuadTree / GeoHash)' },
                { id: 'sd_pat_flash', section: 'LEVEL 4: INTERVIEW PATTERNS', title: 'Design an E-Commerce Flash Sale System (Redis Lua / Inventory Lock)' }
            ],
            practiceTasks: [
                'Perform back-of-the-envelope scale calculation for 10M DAU photo sharing service',
                'Design a distributed rate limiter using Redis and sliding window logs',
                'Complete a 5-step interactive design interview for TinyURL and Instagram Feed'
            ],
            questions: [
                {
                    id: 'sd_q1',
                    question: 'How does Consistent Hashing work and why is it preferred over `hash(key) % N`?',
                    difficulty: 'Medium',
                    topic: 'Distributed Caching & Sharding',
                    expectedConcepts: ['Hash ring (0 to 2^32 - 1)', 'Server mapping on ring', 'Key assignment to next clockwise server', 'Virtual nodes for uniform distribution'],
                    explanation: 'In simple modulo hashing `hash(key) % N`, adding or removing a single server changes N, causing almost 100% of keys to re-hash to different servers (triggering catastrophic cache stampedes). Consistent Hashing maps both servers and keys onto a circular ring (0 to 2^32 - 1). A key belongs to the first server encountered moving clockwise. When a server is added or removed, only `k/N` keys need to be remapped on average. Virtual nodes (multiple points per physical server) ensure uniform distribution and prevent hot spots.'
                },
                {
                    id: 'sd_q2',
                    question: 'Explain the Fan-out on Write vs Fan-out on Read approaches in designing a Social Media Feed.',
                    difficulty: 'Medium',
                    topic: 'Feed Architecture',
                    expectedConcepts: ['Push model (Write) vs Pull model (Read)', 'Pre-computed feed in Redis', 'Celebrity / Hot account problem', 'Hybrid approach'],
                    explanation: 'Fan-out on Write (Push): When user A posts, the system pushes the post ID into the timeline cache of all followers immediately. Read latency is ultra-fast O(1), but posting is slow for users with millions of followers. Fan-out on Read (Pull): When a user opens their feed, the system queries posts of all followed users on the fly and merges them. Post latency is O(1), but reading is slow and heavy on DB. The modern industry standard is Hybrid: Use Push for standard users, and use Pull on-the-fly for celebrity accounts.'
                },
                {
                    id: 'sd_q3',
                    question: 'How do you prevent the Cache Stampede (Thundering Herd) problem?',
                    difficulty: 'Hard',
                    topic: 'Caching',
                    expectedConcepts: ['Simultaneous cache expiration', 'Distributed Mutex / Lock', 'Probabilistic early expiration (XFetch)', 'Background pre-computation'],
                    explanation: 'A Cache Stampede occurs when a popular cache key expires and thousands of concurrent requests miss the cache simultaneously, bombarding the underlying database and causing downtime. Solutions: 1) Mutex / Distributed Lock: Only the first thread that misses the cache acquires a lock to recompute and populate the cache; others wait or return a slightly stale value. 2) Probabilistic Early Expiration (XFetch algorithm): Proactively recomputes the cache item before it expires based on read frequency and computation cost. 3) Background Cron pre-warming.'
                },
                {
                    id: 'sd_q4',
                    question: 'Design an Idempotent Payment API to ensure customers are never double-charged during network retries.',
                    difficulty: 'Hard',
                    topic: 'Distributed Systems & Transactions',
                    expectedConcepts: ['Client-generated UUID idempotency key', 'Unique constraint in database', 'Redis distributed lock / state tracking', 'Atomic payment status state machine'],
                    explanation: '1) Client generates a unique `idempotency_key` (UUIDv4) and sends it in the HTTP header `Idempotency-Key`. 2) API Gateway / Payment service attempts an atomic insert into an idempotency table `(idempotency_key, status, response)` or sets a Redis key with NX flag. 3) If key already exists with status `COMPLETED`, immediately return the cached response without charging again. 4) If status is `IN_PROGRESS`, return HTTP 409 or wait. 5) If new, process payment, update status to `COMPLETED`, and return response.'
                }
            ]
        },

        projects: {
            id: 'projects',
            name: 'Projects & Portfolio',
            shortName: 'Projects',
            icon: '🚀',
            subtitle: 'Full Stack, Microservices & Distributed Projects',
            color: '#8b5cf6',
            description: 'Stand out from thousands of applicants with production-grade engineering projects featuring caching, authentication, message queues, Docker, and CI/CD pipelines.',
            whatToLearn: [
                'What tech recruiters look for: Real architectural complexity, not generic tutorial clones',
                'Essential production pillars: Database indexing, Redis caching, async queues, Docker containerization',
                'API Documentation (Swagger / Postman) & Clean Architecture',
                'Live Deployment: AWS / Vercel / Render / Supabase with custom domain and SSL',
                'How to describe projects on your resume using the STAR / Google XYZ formula',
                'Top 3 Recommended Project Architectures: E-Commerce Microservices, Collaborative Real-Time App, Distributed Task Scheduler'
            ],
            youtube: {
                primary: {
                    channel: 'Kunal Kushwaha',
                    title: 'Open Source, Git, GitHub & High-Impact Tech Projects',
                    url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ',
                    level: 'Beginner to Advanced',
                    why: 'Industry guidance on writing clean open-source code, Git workflows, collaborating on enterprise repositories, and presenting technical work.'
                },
                alt1: {
                    channel: 'freeCodeCamp',
                    title: 'Projects Every Software Developer Should Build',
                    url: 'https://www.youtube.com/watch?v=1F_4bWq1B_g',
                    level: 'Intermediate',
                    why: 'Inspiring breakdowns of production-ready web apps, backend microservices, and portfolio projects that win engineering interviews.'
                },
                alt2: {
                    channel: 'Hussein Nasser',
                    title: 'Backend Engineering Project Architecture Deep Dives',
                    url: 'https://www.youtube.com/playlist?list=PLQnljOFTspQXjDKhJ45842bpWLcx3-A4z',
                    level: 'Advanced',
                    why: 'Master database connection pools, reverse proxies, and scaling production backends with Node.js, Go, or Python.'
                }
            },
            notes: [
                { title: 'Roadmap.sh Backend Developer Project Ideas', url: 'https://roadmap.sh/backend/project-ideas', type: 'Production Architecture Specs' },
                { title: 'FreeCodeCamp High-Impact Project Ideas for Placements', url: 'https://www.freecodecamp.org/news/projects-every-developer-should-build/', type: 'Project Blueprints' },
                { title: 'GitHub: Awesome Project Ideas with System Architecture', url: 'https://github.com/florinpop17/app-ideas', type: 'Repository Collection' }
            ],
            roadmap: [
                { id: 'proj_git', section: 'DEVELOPMENT WORKFLOW', title: 'Git Mastery: Feature branching, rebasing, clean commits & GitHub Actions CI/CD' },
                { id: 'proj_auth', section: 'BACKEND PILLARS', title: 'Production Authentication: JWT, Refresh Tokens, HTTP-Only Cookies & OAuth2' },
                { id: 'proj_db_cache', section: 'DATABASE & CACHE', title: 'Relational Database Schema, Foreign Keys, Indexing & Redis Caching' },
                { id: 'proj_async', section: 'ASYNC PROCESSING', title: 'Background Jobs & Queues (BullMQ / Celery / RabbitMQ / Kafka)' },
                { id: 'proj_docker', section: 'DEVOPS & CONTAINERIZATION', title: 'Dockerizing frontend and backend with multi-stage Dockerfiles & Docker Compose' },
                { id: 'proj_deploy', section: 'PRODUCTION DEPLOYMENT', title: 'Production Cloud Deployment (AWS / Render / DigitalOcean) with HTTPS' },
                { id: 'proj_readme', section: 'SHOWCASE', title: 'Writing an elite README: Architecture diagrams, live link, API specs & benchmark numbers' }
            ],
            practiceTasks: [
                'Add Redis caching with TTL to your existing backend project and benchmark response time improvements',
                'Create a Docker Compose file that spins up your frontend, backend API, PostgreSQL, and Redis with one command',
                'Rewrite your project bullet points on your resume using the Google XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]"'
            ],
            questions: [
                {
                    id: 'proj_q1',
                    question: 'Walk me through the architecture of your proudest project. What was the hardest bug you solved?',
                    difficulty: 'Medium',
                    topic: 'Project Deep Dive',
                    expectedConcepts: ['Component breakdown', 'Data flow from client to DB', 'Specific technical bottleneck', 'How you diagnosed and fixed it'],
                    explanation: 'Structure answer using STAR: 1) System overview: Tech stack choices, client-server communication, database design. 2) Hardest challenge: e.g. Race condition in inventory booking, memory leak in WebSocket connections, or N+1 query problem. 3) Diagnosis: How you used logs, APM, or profiling. 4) Resolution: Implemented Redis distributed lock or batch queries, reducing latency by 70%.'
                },
                {
                    id: 'proj_q2',
                    question: 'How did you handle user authentication and session security in your web application?',
                    difficulty: 'Medium',
                    topic: 'Security & Auth',
                    expectedConcepts: ['Access token vs Refresh token', 'XSS & CSRF protection', 'HTTP-Only SameSite cookies', 'Password hashing with bcrypt'],
                    explanation: 'Store short-lived JWT access tokens (15m) in memory, and long-lived refresh tokens (7d) in HTTP-Only, Secure, SameSite=Strict cookies to protect against XSS and CSRF. Passwords hashed using bcrypt with salt rounds >= 10. Refresh token rotation implemented in database to invalidate compromised sessions.'
                }
            ]
        },

        aptitude: {
            id: 'aptitude',
            name: 'Quantitative & Logical Aptitude',
            shortName: 'Aptitude',
            icon: '🧮',
            subtitle: 'Quant, Logical Reasoning & Speed Shortcuts',
            color: '#14b8a6',
            description: 'Clear the first round of campus placements (Online Assessments / OA) across TCS, Infosys, Wipro, Cognizant, Accenture, Deloitte, and PBC screening tests.',
            whatToLearn: [
                'Quantitative Aptitude: Speed Math, Percentages, Profit & Loss, Ratio & Proportion',
                'Time, Speed & Distance, Trains, Boats & Streams, Races',
                'Time & Work, Pipes & Cisterns, Work & Wages',
                'Permutation & Combination, Probability, Data Interpretation (Bar/Pie charts)',
                'Logical Reasoning: Coding-Decoding, Blood Relations, Direction Sense, Syllogisms',
                'Seating Arrangement (Linear & Circular), Puzzles, Number & Letter Series'
            ],
            youtube: {
                primary: {
                    channel: 'CareerRide',
                    title: 'Quantitative Aptitude Tutorials (Complete Placement Prep)',
                    url: 'https://www.youtube.com/playlist?list=PLpyc33gOcbVA4qXMoQ5vmhefTruk5t9lt',
                    level: 'Beginner to Advanced',
                    why: 'The most trusted aptitude playlist for Indian campus placements. Clear shortcut tricks and formula derivations for time and work, percentages, and train problems.'
                },
                alt1: {
                    channel: 'Feel Free to Learn',
                    title: 'Quantitative Aptitude Shortcuts & Topic-wise Lessons',
                    url: 'https://www.youtube.com/@FeelFreetoLearn',
                    level: 'Beginner to Intermediate',
                    why: 'Outstanding step-by-step shortcuts for blood relations, circular seating arrangement, and time-saving calculations.'
                },
                alt2: {
                    channel: 'Dear Sir',
                    title: 'Fast Math Tricks & Quantitative Aptitude Playlist',
                    url: 'https://www.youtube.com/@DearSir',
                    level: 'Beginner',
                    why: 'High-energy, visual speed tricks for mental calculations, square roots, percentages, and ratios.'
                }
            },
            notes: [
                { title: 'IndiaBIX Quantitative Aptitude Questions & Answers', url: 'https://www.indiabix.com/aptitude/questions-and-answers/', type: 'Largest Practice Bank' },
                { title: 'GeeksforGeeks Engineering Aptitude Practice Questions', url: 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/', type: 'Placement Tests' },
                { title: 'PrepInsta Placement Aptitude Formulas & Shortcuts', url: 'https://prepinsta.com/aptitude/', type: 'Company-Wise Patterns' }
            ],
            roadmap: [
                { id: 'apt_quant1', section: 'QUANTITATIVE ARITHMETIC', title: 'Percentages, Profit & Loss, Discounts & Successive Discounts' },
                { id: 'apt_quant2', section: 'QUANTITATIVE ARITHMETIC', title: 'Ratio & Proportion, Partnerships, Averages & Mixtures/Alligations' },
                { id: 'apt_time_work', section: 'TIME & RATE', title: 'Time and Work, Efficiency, Pipes and Cisterns' },
                { id: 'apt_tsd', section: 'TIME & SPEED', title: 'Time, Speed, Distance, Relative Speed, Trains, Boats and Streams' },
                { id: 'apt_pnc', section: 'ALGEBRA & PROBABILITY', title: 'Permutations, Combinations, Probability & Playing Cards' },
                { id: 'apt_logic1', section: 'LOGICAL REASONING', title: 'Blood Relations, Direction Sense Test, Coding-Decoding' },
                { id: 'apt_logic2', section: 'LOGICAL REASONING', title: 'Linear & Circular Seating Arrangement, Complex Puzzles' },
                { id: 'apt_di', section: 'DATA INTERPRETATION', title: 'Data Interpretation: Tables, Bar Graphs, Pie Charts & Line Graphs' }
            ],
            practiceTasks: [
                'Solve 10 IndiaBIX Time and Work problems in under 15 minutes using LCM method',
                'Practice solving a circular seating arrangement puzzle with 8 people facing center and outward in under 4 minutes',
                'Master mental calculation of 1/2 through 1/16 percentage fractions for instant calculation'
            ],
            questions: [
                {
                    id: 'apt_q1',
                    question: 'A can complete a piece of work in 12 days and B in 18 days. If they work on alternate days starting with A, in how many days will the work be finished?',
                    difficulty: 'Medium',
                    topic: 'Time and Work',
                    expectedConcepts: ['LCM Total Work method', '2-day work cycle', 'Remaining work calculation'],
                    explanation: 'LCM(12, 18) = 36 units total work. Efficiency of A = 36/12 = 3 units/day. Efficiency of B = 36/18 = 2 units/day. In 2 days (A + B), they complete 3 + 2 = 5 units. For 7 cycles (14 days), work completed = 7 * 5 = 35 units. Remaining work = 36 - 35 = 1 unit. On Day 15, A works: time taken = 1/3 day. Total time = 14 and 1/3 days (14.33 days).'
                },
                {
                    id: 'apt_q2',
                    question: 'A train 150 meters long passes a telegraph post in 10 seconds. In how many seconds will it pass a bridge 300 meters long?',
                    difficulty: 'Easy',
                    topic: 'Time, Speed and Distance',
                    expectedConcepts: ['Speed = Distance / Time', 'Train length as distance when passing post', 'Total distance = Train length + Bridge length'],
                    explanation: 'Speed of the train = Length of train / Time to cross post = 150 m / 10 s = 15 m/s. To cross a 300 m bridge, total distance = 150 + 300 = 450 m. Time = Distance / Speed = 450 / 15 = 30 seconds.'
                }
            ]
        },

        resume: {
            id: 'resume',
            name: 'ATS Resume & Portfolio Polish',
            shortName: 'Resume',
            icon: '📄',
            subtitle: 'ATS Parsing, Impact Bullets & Tech Screening',
            color: '#a855f7',
            description: 'Craft a single-page software engineering resume that beats Applicant Tracking Systems (ATS) and gets callbacks from Google, Amazon, Microsoft, and top tier startups.',
            whatToLearn: [
                'Single-Page Rule: Why 2-page resumes get rejected for entry-level candidates',
                'ATS Formatting: Standard single-column layout, plain text headings, no tables/graphics/canva templates',
                'The Google XYZ Resume Bullet Formula: "Accomplished [X], as measured by [Y], by doing [Z]"',
                'Categorized Skills Section: Languages, Frameworks, Developer Tools, Databases, Core Fundamentals',
                'Education, CGPA placement, GitHub & LeetCode profile links, competitive coding ratings',
                'Common Red Flags: Spelling errors, vague bullets like "responsible for", buzzword stuffing'
            ],
            youtube: {
                primary: {
                    channel: 'Jeff Su',
                    title: 'Write an Incredible Resume: 5 Golden Rules & Real Examples',
                    url: 'https://www.youtube.com/watch?v=Tt08KmFfIYQ',
                    level: 'All Levels',
                    why: 'The highest-yield resume guide online. Explains how recruiters scan resumes in 6 seconds and how to structure bullet points that command attention.'
                },
                alt1: {
                    channel: 'Love Babbar',
                    title: 'How to make a Software Engineer Resume for Placements',
                    url: 'https://www.youtube.com/watch?v=BYUy1yvjHxE',
                    level: 'College / Placement Focused',
                    why: 'Specific advice for Indian engineering college placements, formatting projects, and passing ATS screening for PBCs.'
                },
                alt2: {
                    channel: 'Kunal Kushwaha',
                    title: 'Reviewing Resumes of Developers & Common Mistakes',
                    url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ',
                    level: 'Practical Feedback',
                    why: 'Live review sessions breaking down actual student resumes and demonstrating before-and-after improvements.'
                }
            },
            notes: [
                { title: 'Jake’s Resume Overleaf LaTeX Template (Industry Gold Standard)', url: 'https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzpstnn', type: 'Free LaTeX Template' },
                { title: 'Harvard University Office of Career Services Resume Guide', url: 'https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/', type: 'Action Verbs & Formatting' },
                { title: 'Tech Interview Handbook: Engineering Resume Checklist', url: 'https://www.techinterviewhandbook.org/resume/', type: 'Software Engineer Specific' }
            ],
            roadmap: [
                { id: 'res_template', section: 'TEMPLATE & STRUCTURE', title: 'Select single-column ATS-compliant LaTeX template (e.g. Jake’s Resume on Overleaf)' },
                { id: 'res_header', section: 'CONTACT & LINKS', title: 'Header: Name, Professional Email, Phone, LinkedIn, GitHub & LeetCode/Codeforces profile' },
                { id: 'res_skills', section: 'SKILLS SECTION', title: 'Technical Skills: Languages (C++, Java, Python, JS), Databases, Tools (Git, Docker, Linux)' },
                { id: 'res_projects', section: 'PROJECTS', title: '3 Major Projects: 3-4 bullets each formatted with the Google XYZ formula and live GitHub links' },
                { id: 'res_edu', section: 'EDUCATION', title: 'B.Tech Degree, College Name, CGPA/Percentage, Graduation Year' },
                { id: 'res_achieve', section: 'ACHIEVEMENTS', title: 'Competitive Programming peak rating, hackathon wins, top academic ranks' }
            ],
            practiceTasks: [
                'Import Jake’s Resume template into Overleaf and fill out your information in standard LaTeX',
                'Rewrite your top project description into 3 quantitative bullet points using metrics like "reduced latency by 45%" or "processed 10k requests/min"',
                'Run your exported PDF through an online ATS text extractor to verify clean plain-text parsing'
            ],
            questions: [
                {
                    id: 'res_q1',
                    question: 'How do you format resume bullets using the Google XYZ formula?',
                    difficulty: 'Easy',
                    topic: 'Resume Writing',
                    expectedConcepts: ['Action Verb', 'Accomplished [X]', 'Measured by [Y] (metric)', 'By doing [Z] (technology/technique)'],
                    explanation: 'Example Bad: "Built a chat application using WebSockets." Example Good (Google XYZ): "Engineered a real-time chat service supporting 10,000 concurrent connections, reducing message delivery latency by 65% by implementing WebSocket connection pooling and Redis pub/sub messaging in Go."'
                }
            ]
        },

        interview: {
            id: 'interview',
            name: 'HR & Behavioral Interview Prep',
            shortName: 'Interview Prep',
            icon: '🎤',
            subtitle: 'STAR Method, Behavioral Rounds & Leadership Principles',
            color: '#f43f5e',
            description: 'Ace technical behavioral interviews, HR rounds, managerial screening, and Amazon Leadership Principles using structured frameworks and persuasive storytelling.',
            whatToLearn: [
                'The STAR Method: Situation, Task, Action, Result (60% of answer focused on ACTION)',
                '"Tell Me About Yourself" (The Present-Past-Future 90-second formula)',
                '"Why should we hire you?" and "What is your biggest weakness?" (Genuine weakness + proactive remediation)',
                'Conflict resolution: "Tell me about a time you disagreed with a teammate or senior"',
                'Handling failure: "Tell me about a project that failed or a mistake you made"',
                'Amazon 16 Leadership Principles & Behavioral Matrix'
            ],
            youtube: {
                primary: {
                    channel: 'Jeff Su',
                    title: 'Common Interview Questions and Answers (The Definitive Playbook)',
                    url: 'https://www.youtube.com/playlist?list=PLo-kPya_Ww2wLc0USlqpuN_OAtJjc6qoP',
                    level: 'All Levels',
                    why: 'Clear scripts and frameworks for answering "Tell me about yourself", salary expectations, weaknesses, and questions to ask the interviewer at the end.'
                },
                alt1: {
                    channel: 'Dan Croitor',
                    title: 'Behavioral Interviews & Amazon Leadership Principles',
                    url: 'https://www.youtube.com/@DanCroitor',
                    level: 'Intermediate to Advanced',
                    why: 'The definitive channel for FAANG behavioral and leadership principle interviews with real answer scripts.'
                },
                alt2: {
                    channel: 'CareerVidz',
                    title: 'Top 10 Job Interview Questions & Answers',
                    url: 'https://www.youtube.com/@CareerVidz',
                    level: 'Beginner',
                    why: 'Classic HR interview preparation covering professional body language, confidence, and behavioral expectations.'
                }
            },
            notes: [
                { title: 'Tech Interview Handbook: Behavioral Interview Guide', url: 'https://www.techinterviewhandbook.org/behavioral-round/', type: 'FAANG Behavioral Frameworks' },
                { title: 'InterviewBit HR Interview Questions and Answers', url: 'https://www.interviewbit.com/hr-interview-questions/', type: 'Top 40 HR Questions' },
                { title: 'The STAR Method Complete Guide by The Muse', url: 'https://www.themuse.com/advice/star-interview-method', type: 'Framework & Templates' }
            ],
            roadmap: [
                { id: 'int_intro', section: 'SELF-INTRODUCTION', title: 'Prepare & time 90-second "Tell Me About Yourself" (Present, Past, Future)' },
                { id: 'int_star', section: 'BEHAVIORAL STORIES', title: 'Prepare 5 versatile STAR stories (Leadership, Failure, Conflict, Technical Hurdle, Deadline)' },
                { id: 'int_weakness', section: 'TRICKY QUESTIONS', title: 'Prepare genuine "Greatest Weakness" with concrete remediation steps' },
                { id: 'int_company', section: 'COMPANY RESEARCH', title: 'Research company core products, recent engineering blogs & mission statement' },
                { id: 'int_questions', section: 'REVERSE QUESTIONS', title: 'Prepare 3 thoughtful questions to ask the interviewer at the end of the round' }
            ],
            practiceTasks: [
                'Record yourself on video delivering your 90-second "Tell Me About Yourself" pitch and review your pacing and tone',
                'Write out a complete STAR story detailing a time you debugged a critical project issue under time pressure',
                'Prepare 3 insightful engineering questions to ask interviewers about team culture and technical debt'
            ],
            questions: [
                {
                    id: 'int_q1',
                    question: 'Tell me about yourself.',
                    difficulty: 'Easy',
                    topic: 'Introduction',
                    expectedConcepts: ['90 seconds max', 'Present role/status', 'Past accomplishments & core skills', 'Future why this company'],
                    explanation: 'Follow the Present-Past-Future model: 1) Present: "I am currently pursuing my B.Tech in Computer Science, focusing on Data Structures, Algorithms, and distributed systems." 2) Past: "Over the past 2 years, I solved 400+ DSA problems on LeetCode/Striver, and built [Project X] which handles [feature] using [tech]." 3) Future: "I am passionate about building scalable, resilient software, which is why I am excited about the SDE opportunity at your company."'
                },
                {
                    id: 'int_q2',
                    question: 'Tell me about a time you had a disagreement with a team member. How did you resolve it?',
                    difficulty: 'Medium',
                    topic: 'Conflict Resolution',
                    expectedConcepts: ['STAR method', 'Professional disagreement based on data/tech', 'Active listening', 'Positive outcome'],
                    explanation: 'Never make it personal. Situation: Building a college capstone project, teammate wanted SQL while I favored MongoDB. Action: Instead of arguing, we documented our query access patterns. I created a benchmark script testing join performance against document lookups. Result: Data showed relational joins fit our relational schema better. We mutually chose PostgreSQL and completed the project on time.'
                }
            ]
        },

        mock: {
            id: 'mock',
            name: 'Mock Technical Interviews',
            shortName: 'Mock Interviews',
            icon: '🎯',
            subtitle: 'Peer & Senior Mock Practice & Live Coding',
            color: '#f97316',
            description: 'Simulate high-pressure live coding and system design interviews under real time constraints with instant feedback and scorecards.',
            whatToLearn: [
                'Thinking out loud while solving algorithmic problems under observation',
                'Clarifying constraints: Time/space targets, input range, null/empty values, duplicates',
                'Writing clean, modular code with descriptive variable names instead of cryptic shortcuts',
                'Dry-running with example test cases before hitting submit or claiming you are done',
                'Handling hints gracefully when the interviewer prompts you towards optimal paths'
            ],
            youtube: {
                primary: {
                    channel: 'Clément Mihailescu',
                    title: 'Mock Coding Interviews with FAANG Software Engineers',
                    url: 'https://www.youtube.com/@clem',
                    level: 'Intermediate to Advanced',
                    why: 'Watch real software engineers from Google and Meta solve algorithmic problems in real time on a whiteboard and code editor, showing ideal communication styles.'
                },
                alt1: {
                    channel: 'NeetCode',
                    title: 'Mock Google Coding Interview Demonstration',
                    url: 'https://youtu.be/j4KwhBziOpg',
                    level: 'Intermediate',
                    why: 'Realistic coding interview walkthrough illustrating how to articulate edge cases, time complexity, and code refactoring.'
                },
                alt2: {
                    channel: 'Aced / Exponent',
                    title: 'Full Mock Technical Interview Series',
                    url: 'https://www.youtube.com/@tryexponent',
                    level: 'All Levels',
                    why: 'Excellent peer mock interviews across coding, system design, and behavioral rounds with expert commentary.'
                }
            },
            notes: [
                { title: 'Pramp Free Peer-to-Peer Mock Interviews', url: 'https://www.pramp.com/', type: 'Free Live Mock Platform' },
                { title: 'Interviewing.io Technical Interview Practice Guides', url: 'https://interviewing.io/', type: 'Senior FAANG Interview Insights' },
                { title: 'Tech Interview Handbook Coding Interview Rubric', url: 'https://www.techinterviewhandbook.org/coding-round-evaluations/', type: 'Evaluation Criteria' }
            ],
            roadmap: [
                { id: 'mock_peer1', section: 'MOCK SESSIONS', title: 'Schedule 1 peer coding interview on Pramp covering Arrays/HashMaps' },
                { id: 'mock_peer2', section: 'MOCK SESSIONS', title: 'Schedule 1 peer coding interview covering Trees/Graphs' },
                { id: 'mock_sd', section: 'SYSTEM DESIGN MOCKS', title: 'Conduct 1 peer mock interview for System Design (URL Shortener or Rate Limiter)' },
                { id: 'mock_review', section: 'RETROSPECTIVE', title: 'Review recording or interviewer notes, identify communication flaws and weak patterns' }
            ],
            practiceTasks: [
                'Set a 45-minute timer, open an unsolved LeetCode Medium problem, and speak your thoughts aloud continuously while coding',
                'Practice writing code on a plain text editor or Google Docs without syntax highlighting or autocomplete',
                'Practice dry-running an array rotation algorithm by tracing variables line-by-line on paper'
            ],
            questions: [
                {
                    id: 'mock_q1',
                    question: 'What is the recommended 5-step strategy when given a coding problem in an interview?',
                    difficulty: 'Easy',
                    topic: 'Interview Strategy',
                    expectedConcepts: ['1. Clarify & Confirm Constraints', '2. Propose Brute Force & Discuss Complexity', '3. Optimize with appropriate Data Structure', '4. Code cleanly', '5. Dry Run with test cases'],
                    explanation: 'Step 1: Never jump straight to coding. Clarify input constraints, edge cases (empty array, negative values, duplicates). Step 2: State the brute force solution out loud and analyze its O(N^2) complexity. Step 3: Propose an optimized approach (e.g. HashMap, Two Pointers) and verify the interviewer agrees with the strategy. Step 4: Write clean, modular code with meaningful variable names. Step 5: Walk through your code with an example test case step-by-step to catch off-by-one errors before telling the interviewer you are finished.'
                }
            ]
        }
    },

    // ------------------------------------------------------------------------
    // SUNDAY WEEKLY TEST QUESTION BANK (23 Questions Template)
    // 3 DSA (Code), 10 Core CS MCQs, 3 SQL Queries, 5 Aptitude, 2 Conceptual Interview
    // ------------------------------------------------------------------------
    weeklyTestTemplate: [
        // --- 3 DSA Questions ---
        {
            id: 'wt_dsa_1',
            type: 'dsa_code',
            category: 'DSA',
            subject: 'DSA',
            topic: 'Two Pointers & Arrays',
            difficulty: 'Easy',
            question: 'Two Sum: Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Assume exactly one solution exists. (Aim for O(N) time).',
            starterCode: `function twoSum(nums, target) {\n    // Write your O(N) solution using a Hash Map\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}`,
            expectedSolution: 'Use a hash map to store each number and its index. For each number, check if `target - nums[i]` exists in the map.',
            testCases: [
                { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]' },
                { input: 'nums = [3,2,4], target = 6', output: '[1, 2]' }
            ]
        },
        {
            id: 'wt_dsa_2',
            type: 'dsa_code',
            category: 'DSA',
            subject: 'DSA',
            topic: 'Binary Search',
            difficulty: 'Medium',
            question: 'Search in Rotated Sorted Array: Given an integer array `nums` sorted in ascending order (with distinct values) that is rotated at an unknown pivot, and an integer `target`, return the index of `target` in O(log N) time, or -1 if not found.',
            starterCode: `function searchRotated(nums, target) {\n    let left = 0, right = nums.length - 1;\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (nums[mid] === target) return mid;\n        \n        // Check which half is sorted\n        if (nums[left] <= nums[mid]) {\n            if (nums[left] <= target && target < nums[mid]) {\n                right = mid - 1;\n            } else {\n                left = mid + 1;\n            }\n        } else {\n            if (nums[mid] < target && target <= nums[right]) {\n                left = mid + 1;\n            } else {\n                right = mid - 1;\n            }\n        }\n    }\n    return -1;\n}`,
            expectedSolution: 'Identify which half (left or right) is sorted, check if target falls inside that range, and adjust pointers accordingly.',
            testCases: [
                { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' },
                { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1' }
            ]
        },
        {
            id: 'wt_dsa_3',
            type: 'dsa_code',
            category: 'DSA',
            subject: 'DSA',
            topic: 'Dynamic Programming',
            difficulty: 'Hard',
            question: 'Longest Increasing Subsequence (LIS): Given an integer array `nums`, return the length of the longest strictly increasing subsequence. Optimize to O(N log N) using patience sorting / binary search if possible.',
            starterCode: `function lengthOfLIS(nums) {\n    if (!nums.length) return 0;\n    const tails = [];\n    for (let x of nums) {\n        let left = 0, right = tails.length;\n        while (left < right) {\n            let mid = Math.floor((left + right) / 2);\n            if (tails[mid] < x) left = mid + 1;\n            else right = mid;\n        }\n        tails[left] = x;\n    }\n    return tails.length;\n}`,
            expectedSolution: 'Patience sorting with binary search maintains an array `tails` where `tails[i]` stores the smallest tail of all increasing subsequences of length `i+1`.',
            testCases: [
                { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4 (Subsequence: [2,3,7,101])' },
                { input: 'nums = [0,1,0,3,2,3]', output: '4 (Subsequence: [0,1,2,3])' }
            ]
        },

        // --- 10 Core CS Questions (MCQs) ---
        {
            id: 'wt_cs_1',
            type: 'mcq',
            category: 'DBMS',
            subject: 'DBMS',
            topic: 'Normalization',
            difficulty: 'Easy',
            question: 'A relational schema R is in 2NF if and only if it is in 1NF and:',
            options: [
                'It contains no transitive dependencies',
                'Every non-prime attribute is fully functionally dependent on every candidate key',
                'Every determinant is a candidate key',
                'It contains only atomic multivalued attributes'
            ],
            correctAnswer: 1,
            explanation: 'Second Normal Form (2NF) requires that no non-prime attribute depends on a proper subset of any candidate key (i.e. no partial dependency).'
        },
        {
            id: 'wt_cs_2',
            type: 'mcq',
            category: 'DBMS',
            subject: 'DBMS',
            topic: 'Transactions & ACID',
            difficulty: 'Medium',
            question: 'Which component of a DBMS ensures the "Durability" property of ACID transactions?',
            options: [
                'Concurrency Control Manager (2PL)',
                'Write-Ahead Logging (WAL) and Recovery Manager',
                'Query Optimization Engine',
                'Integrity Constraint Checker'
            ],
            correctAnswer: 1,
            explanation: 'Durability guarantees that once a transaction commits, its changes survive system crashes. This is achieved via Write-Ahead Logging (WAL) and Redo logs.'
        },
        {
            id: 'wt_cs_3',
            type: 'mcq',
            category: 'OS',
            subject: 'OS',
            topic: 'Deadlocks',
            difficulty: 'Easy',
            question: 'Which of the following is NOT one of the 4 Coffman conditions required for a Deadlock to occur?',
            options: [
                'Mutual Exclusion',
                'Hold and Wait',
                'Preemption Allowed',
                'Circular Wait'
            ],
            correctAnswer: 2,
            explanation: 'The condition is NO Preemption. If resources can be preempted, deadlocks cannot occur.'
        },
        {
            id: 'wt_cs_4',
            type: 'mcq',
            category: 'OS',
            subject: 'OS',
            topic: 'Virtual Memory',
            difficulty: 'Medium',
            question: 'Belady’s Anomaly is observed in which page replacement algorithm?',
            options: [
                'Least Recently Used (LRU)',
                'Optimal Page Replacement (OPT)',
                'First In First Out (FIFO)',
                'Least Frequently Used (LFU)'
            ],
            correctAnswer: 2,
            explanation: 'FIFO can suffer from Belady’s anomaly, where allocating more physical frames causes an increased number of page faults. LRU and OPT are stack algorithms and are immune.'
        },
        {
            id: 'wt_cs_5',
            type: 'mcq',
            category: 'CN',
            subject: 'CN',
            topic: 'TCP/IP Model',
            difficulty: 'Easy',
            question: 'Which layer of the OSI model is responsible for end-to-end process-to-process communication and flow control?',
            options: [
                'Network Layer',
                'Data Link Layer',
                'Transport Layer',
                'Session Layer'
            ],
            correctAnswer: 2,
            explanation: 'The Transport Layer (TCP/UDP) handles port numbers, process-to-process delivery, segmentation, flow control, and error recovery.'
        },
        {
            id: 'wt_cs_6',
            type: 'mcq',
            category: 'CN',
            subject: 'CN',
            topic: 'Subnetting & CIDR',
            difficulty: 'Medium',
            question: 'How many usable host IP addresses are available in a `/27` IPv4 subnet?',
            options: [
                '32',
                '30',
                '62',
                '28'
            ],
            correctAnswer: 1,
            explanation: 'A /27 subnet leaves 32 - 27 = 5 host bits. Total IPs = 2^5 = 32. Usable IPs = 32 - 2 (subtracting network ID and broadcast address) = 30.'
        },
        {
            id: 'wt_cs_7',
            type: 'mcq',
            category: 'OOP',
            subject: 'OOP',
            topic: 'Polymorphism',
            difficulty: 'Easy',
            question: 'In C++, how is runtime polymorphism achieved?',
            options: [
                'Operator Overloading',
                'Template Functions',
                'Virtual Functions and VTABLE',
                'Friend Classes'
            ],
            correctAnswer: 2,
            explanation: 'Runtime polymorphism (late binding) in C++ is achieved through virtual functions and base class pointers resolving method addresses at runtime via the VTABLE.'
        },
        {
            id: 'wt_cs_8',
            type: 'mcq',
            category: 'OOP',
            subject: 'OOP',
            topic: 'SOLID Principles',
            difficulty: 'Medium',
            question: 'Which SOLID principle states: "Subtypes must be substitutable for their base types without altering the correctness of the program"?',
            options: [
                'Single Responsibility Principle',
                'Open-Closed Principle',
                'Liskov Substitution Principle',
                'Interface Segregation Principle'
            ],
            correctAnswer: 2,
            explanation: 'The Liskov Substitution Principle (LSP) ensures that subclasses behave in a manner consistent with the expectations established by the base class.'
        },
        {
            id: 'wt_cs_9',
            type: 'mcq',
            category: 'System Design',
            subject: 'System Design',
            topic: 'CAP Theorem',
            difficulty: 'Medium',
            question: 'In a distributed database system experiencing a network partition, an "AP" system chooses to:',
            options: [
                'Reject writes to prevent data inconsistency',
                'Remain available to accept reads and writes, returning potentially stale data',
                'Shut down the whole cluster until the network heals',
                'Switch automatically from NoSQL to SQL'
            ],
            correctAnswer: 1,
            explanation: 'An AP system prioritizes Availability over Consistency during network partitions, returning data immediately even if replicas have not yet synchronized.'
        },
        {
            id: 'wt_cs_10',
            type: 'mcq',
            category: 'System Design',
            subject: 'System Design',
            topic: 'Consistent Hashing',
            difficulty: 'Hard',
            question: 'What problem does "Consistent Hashing with Virtual Nodes" solve in distributed caching?',
            options: [
                'It completely eliminates the need for RAM',
                'It prevents non-uniform key distribution (hot spots) across physical servers',
                'It automatically encrypts network packets',
                'It converts NoSQL queries to relational SQL'
            ],
            correctAnswer: 1,
            explanation: 'Without virtual nodes, physical servers can end up unevenly spaced on the hash ring. Virtual nodes (mapping each machine to multiple positions) ensure an even distribution of keys.'
        },

        // --- 3 SQL Questions ---
        {
            id: 'wt_sql_1',
            type: 'sql_query',
            category: 'SQL',
            subject: 'SQL',
            topic: 'Window Functions',
            difficulty: 'Medium',
            question: 'Given an `Employee` table with columns `(id, name, salary, department_id)`, write an SQL query to find the employee with the highest salary in EACH department.',
            starterCode: `-- Write your SQL query below:\nSELECT department_id, name, salary\nFROM (\n    SELECT department_id, name, salary,\n           DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rnk\n    FROM Employee\n) sub\nWHERE rnk = 1;`,
            expectedSolution: 'Use DENSE_RANK() or RANK() partitioned by department_id and ordered by salary descending, then filter where rank = 1.'
        },
        {
            id: 'wt_sql_2',
            type: 'sql_query',
            category: 'SQL',
            subject: 'SQL',
            topic: 'Joins & Aggregates',
            difficulty: 'Easy',
            question: 'Given `Customers (id, name)` and `Orders (id, customer_id, amount)`, write a query to find the total amount spent by each customer. Include customers who have placed 0 orders (displaying 0 or NULL).',
            starterCode: `SELECT c.name, COALESCE(SUM(o.amount), 0) as total_spent\nFROM Customers c\nLEFT JOIN Orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name;`,
            expectedSolution: 'LEFT JOIN Customers with Orders, GROUP BY customer, and aggregate SUM(amount) using COALESCE for nulls.'
        },
        {
            id: 'wt_sql_3',
            type: 'sql_query',
            category: 'SQL',
            subject: 'SQL',
            topic: 'Consecutive Records',
            difficulty: 'Hard',
            question: 'Given a `UserLogins (user_id, login_date)` table, write an SQL query to find all users who logged in for at least 3 consecutive days.',
            starterCode: `SELECT DISTINCT user_id\nFROM (\n    SELECT user_id, login_date,\n           LEAD(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) as next_1,\n           LEAD(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) as next_2\n    FROM UserLogins\n) sub\nWHERE DATEDIFF(next_1, login_date) = 1 AND DATEDIFF(next_2, next_1) = 1;`,
            expectedSolution: 'Use LEAD() or LAG() with PARTITION BY user_id ORDER BY login_date to check date differences of 1 and 2 days.'
        },

        // --- 5 Aptitude Questions ---
        {
            id: 'wt_apt_1',
            type: 'mcq',
            category: 'Aptitude',
            subject: 'Aptitude',
            topic: 'Percentages & Profit/Loss',
            difficulty: 'Easy',
            question: 'A shopkeeper marks an article 40% above the cost price and allows a discount of 25% on the marked price. What is his net gain or loss percentage?',
            options: [
                '5% Gain',
                '10% Gain',
                '5% Loss',
                '15% Gain'
            ],
            correctAnswer: 0,
            explanation: 'Let CP = 100. MP = 140. Discount = 25% of 140 = 35. SP = 140 - 35 = 105. Profit = 105 - 100 = 5% Gain.'
        },
        {
            id: 'wt_apt_2',
            type: 'mcq',
            category: 'Aptitude',
            subject: 'Aptitude',
            topic: 'Time and Work',
            difficulty: 'Medium',
            question: 'Pipe A can fill a tank in 6 hours and Pipe B in 8 hours. Pipe C can empty the full tank in 12 hours. If all three pipes are opened together, how long will it take to fill the tank?',
            options: [
                '4 hours 48 minutes',
                '5 hours 12 minutes',
                '4 hours 15 minutes',
                '5 hours'
            ],
            correctAnswer: 0,
            explanation: 'LCM(6, 8, 12) = 24 units. Rate of A = +4, Rate of B = +3, Rate of C = -2. Net rate = 4 + 3 - 2 = 5 units/hr. Time = 24 / 5 hours = 4.8 hours = 4 hours and 48 minutes.'
        },
        {
            id: 'wt_apt_3',
            type: 'mcq',
            category: 'Aptitude',
            subject: 'Aptitude',
            topic: 'Permutation and Combination',
            difficulty: 'Medium',
            question: 'In how many different ways can the letters of the word "LEADING" be arranged such that vowels always come together?',
            options: [
                '360',
                '720',
                '480',
                '5040'
            ],
            correctAnswer: 1,
            explanation: 'Vowels in LEADING: E, A, I (3 vowels). Consonants: L, D, N, G (4 consonants). Treat (E,A,I) as 1 group. Total groups = 4 + 1 = 5. Arrangements of groups = 5! = 120. Internal arrangements of 3 vowels = 3! = 6. Total = 120 * 6 = 720 ways.'
        },
        {
            id: 'wt_apt_4',
            type: 'mcq',
            category: 'Aptitude',
            subject: 'Aptitude',
            topic: 'Time, Speed and Distance',
            difficulty: 'Medium',
            question: 'Two cars start at the same time from two cities 300 km apart and travel towards each other. One travels at 60 km/h and the other at 40 km/h. How many hours will it take for them to meet?',
            options: [
                '2.5 hours',
                '3 hours',
                '3.5 hours',
                '4 hours'
            ],
            correctAnswer: 1,
            explanation: 'Relative speed = 60 + 40 = 100 km/h. Time to meet = Distance / Relative Speed = 300 / 100 = 3 hours.'
        },
        {
            id: 'wt_apt_5',
            type: 'mcq',
            category: 'Aptitude',
            subject: 'Aptitude',
            topic: 'Blood Relations',
            difficulty: 'Easy',
            question: 'Pointing to a photograph of a boy, Suresh said, "He is the only son of my mother." How is Suresh related to that boy?',
            options: [
                'Brother',
                'Uncle',
                'Father',
                'Self'
            ],
            correctAnswer: 3,
            explanation: '"Only son of my mother" refers to Suresh himself (assuming Suresh is male). Thus, the boy in the photo is Suresh himself (Self).'
        },

        // --- 2 Conceptual Interview Questions ---
        {
            id: 'wt_int_1',
            type: 'conceptual',
            category: 'Interview',
            subject: 'System Design',
            topic: 'Distributed Systems',
            difficulty: 'Medium',
            question: 'Explain the difference between Optimistic Concurrency Control (OCC) and Pessimistic Concurrency Control (PCC). When would you choose one over the other?',
            expectedSolution: 'Pessimistic locking locks the resource before reading/modifying (good for high contention, e.g. bank withdrawals). Optimistic locking lets transactions read without locks and checks version numbers upon write (good for read-heavy low contention, e.g. editing wiki pages).'
        },
        {
            id: 'wt_int_2',
            type: 'conceptual',
            category: 'Interview',
            subject: 'Core CS',
            topic: 'Operating Systems & Networking',
            difficulty: 'Hard',
            question: 'What is the C10K problem, and how did modern asynchronous I/O architectures (like epoll, kqueue, Nginx, and Node.js event loops) solve it compared to traditional multi-threaded models (Apache)?',
            expectedSolution: 'Traditional servers allocated 1 thread/process per connection (Apache). As concurrent connections scaled to 10,000+, thread stack memory (8MB each) and CPU context switching overhead crashed the machine. Event-driven architectures use a single thread with non-blocking I/O multiplexing (Linux epoll), handling tens of thousands of connections on a single OS thread with minimal memory.'
        }
    ]
};

if (typeof window !== 'undefined') {
    window.PLACEMENT_DATA = PLACEMENT_DATA;
}
if (typeof module !== 'undefined') {
    module.exports = { PLACEMENT_DATA };
}
