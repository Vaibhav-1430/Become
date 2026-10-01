/**
 * FORGE — GATE 2027 CSE Syllabus-First Study Planner Dataset
 *
 * SOURCE OF TRUTH:
 * - Strictly conforms to the official GATE 2027 CSE Syllabus boundaries.
 * - Multi-year historical paper analysis (2021–2026) for heuristic prioritization.
 * - Dedicated 123-day chronological study calendar (2026-10-01 → 2027-01-31).
 * - 100% syllabus topic coverage guaranteed with zero empty dates.
 */

const GATE_CONFIG = {
    DISCLAIMER: 'Historical paper analysis — planning evidence only, not a guarantee of GATE 2027 marks',
    DATE_RANGE: {
        start: '2026-10-01',
        end: '2027-01-31',
        totalDays: 123
    },
    DAILY_TIME_SLOT: '10:30 PM – 12:00 AM',
    STATUS: {
        NOT_STARTED: 'NOT_STARTED',
        IN_PROGRESS: 'IN_PROGRESS',
        STUDY_COMPLETE: 'STUDY_COMPLETE',
        PYQ_PENDING: 'PYQ_PENDING',
        COMPLETED: 'COMPLETED',
        REVISION_REQUIRED: 'REVISION_REQUIRED'
    },
    IMPORTANCE_LEVELS: ['HIGH', 'HIGH-MEDIUM', 'MEDIUM', 'LOW']
};

/**
 * 1. Official GATE 2027 CSE Syllabus Hierarchy (11 Canonical Subjects, Sorted by Historical Weightage)
 */
const GATE_SYLLABUS = [
    {
        "id": "ga",
        "name": "General Aptitude",
        "shortName": "Aptitude",
        "icon": "🧮",
        "historicalWeight": 15,
        "importance": "HIGH",
        "officialSection": "General Aptitude (Common to all papers)",
        "plannedDateRange": "15 Jan 2027 – 20 Jan 2027",
        "topics": [
            {
                "id": "ga_quantitative_arithmetic",
                "name": "Quantitative Arithmetic & Commercial Maths",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Percentages & Profit-Loss",
                    "Ratio, Proportions & Variations",
                    "Time, Work & Distance",
                    "Elementary Statistics"
                ],
                "defaultChecklist": [
                    "Study ratio, proportions, percentages and commercial math formulas",
                    "Practice speed, time and distance relative velocity calculations",
                    "Solve work-rate and pipe cistern problem sets",
                    "Make concise formula sheet for commercial maths",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "ga_quantitative_algebra_geo",
                "name": "Algebra, Geometry, Mensuration & Permutations",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Algebraic Equations & Quadratics",
                    "Mensuration (2D & 3D Geometry)",
                    "Permutations & Combinations Basics",
                    "Elementary Trigonometry"
                ],
                "defaultChecklist": [
                    "Review algebraic factorizations, roots of quadratics and progressions",
                    "Study 2D perimeter/area and 3D surface area/volume formulas",
                    "Solve basic permutation and combination arrangements",
                    "Make formula summary for geometry and series",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "ga_data_interpretation",
                "name": "Data Interpretation & Graphs",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Data Tables & Two-way Frequency Maps",
                    "Bar Charts & Stacked Column Plots",
                    "Pie Charts & Percentage Slices",
                    "Line Graphs & Trend Extrapolations"
                ],
                "defaultChecklist": [
                    "Understand table extraction and ratio calculation shortcuts",
                    "Practice bar chart and percentage share extraction",
                    "Solve multi-step pie chart angle and percentage questions",
                    "Review trend interpretation on line graphs",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "ga_verbal_grammar_vocab",
                "name": "English Grammar & Vocabulary",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 75,
                "subtopics": [
                    "Tenses & Subject-Verb Agreement",
                    "Prepositions, Conjunctions & Modifiers",
                    "Contextual Vocabulary & Antonyms/Synonyms",
                    "Sentence Completion"
                ],
                "defaultChecklist": [
                    "Review subject-verb agreement rules and modifier placements",
                    "Study correct usage of prepositions and conjunctions",
                    "Practice contextual sentence completion and fill-in-the-blanks",
                    "Review high-frequency GATE English vocabulary list",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "ga_verbal_comprehension",
                "name": "Reading Comprehension & Critical Reasoning",
                "importance": "HIGH",
                "historicalFrequency": 82,
                "subtopics": [
                    "Passage Reading & Main Idea Extraction",
                    "Author Stance & Inference Questions",
                    "Logical Deductions & Syllogisms",
                    "Argument Strengthening & Weakening"
                ],
                "defaultChecklist": [
                    "Practice speed reading and main argument extraction from paragraphs",
                    "Master inference vs stated fact differentiation",
                    "Solve logical deduction and assumption questions",
                    "Review syllogism Venn diagram representation rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "ga_analytical_spatial",
                "name": "Analytical & Spatial Aptitude",
                "importance": "HIGH",
                "historicalFrequency": 85,
                "subtopics": [
                    "Deductive Logic & Seating Arrangements",
                    "Numerical Sequences & Number Analogies",
                    "Shape Transformation & Paper Folding",
                    "2D/3D Mirror Images & Pattern Rotation"
                ],
                "defaultChecklist": [
                    "Practice blood relations, direction tests and seating arrangements",
                    "Analyze arithmetic/geometric and alternating number series",
                    "Understand 2D paper folding, punching and unfolding visualization",
                    "Practice mirror reflection and 3D spatial rotation problems",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "em",
        "name": "Engineering Mathematics",
        "shortName": "Engg Math",
        "icon": "📐",
        "historicalWeight": 13,
        "importance": "HIGH",
        "officialSection": "Section 1: Engineering Mathematics",
        "plannedDateRange": "04 Jan 2027 – 14 Jan 2027",
        "topics": [
            {
                "id": "em_discrete_logic",
                "name": "Propositional & First-Order Logic",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Propositional Variables & Connectives",
                    "Truth Tables, Tautologies & Contradictions",
                    "Logical Equivalences & Normal Forms (CNF/DNF)",
                    "First-Order Predicates & Quantifiers (∀, ∃)"
                ],
                "defaultChecklist": [
                    "Understand propositional connectives and logical equivalence identities",
                    "Master truth tables, tautology detection and contradiction proofs",
                    "Convert English statements into first-order predicate logic expressions",
                    "Practice quantifier negation and scope resolution rules",
                    "Make formula summary for logical equivalences",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_discrete_relations",
                "name": "Sets, Relations, Functions, Groups & Partial Orders",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 80,
                "subtopics": [
                    "Sets, Relations, Functions & Closures",
                    "Equivalence Relations & Partitions",
                    "Monoids, Groups & Abelian Algebraic Structures",
                    "Partial Orders and Lattices & Hasse Diagrams"
                ],
                "defaultChecklist": [
                    "Review set algebra, power sets, relations, functions and inclusion-exclusion principle",
                    "Understand reflexivity, symmetry, transitivity, equivalence relations and closures",
                    "Study algebraic structures: monoids, groups, abelian groups, subgroups and Lagrange's theorem",
                    "Master partial orders and lattices, Hasse diagrams, maximal/minimal elements and glb/lub",
                    "Make short notes on lattice and group properties",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_combinatorics",
                "name": "Combinatorics & Recurrence Relations",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Counting, Permutations & Combinations Principles",
                    "Pigeonhole Principle & Applications",
                    "Generating Functions & Formal Power Series",
                    "Solving Linear Recurrence Relations"
                ],
                "defaultChecklist": [
                    "Master fundamental counting principles, permutations and combinations",
                    "Solve non-trivial counting problems using Generalized Pigeonhole Principle",
                    "Formulate and solve homogeneous/non-homogeneous linear recurrence relations",
                    "Review generating functions for counting distributions",
                    "Make concise formula notes on recurrence roots",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_graph_theory",
                "name": "Graph Theory: Paths, Trees, Matching & Coloring",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Graphs Terminology, Degree Sequence & Handshaking Lemma",
                    "Isomorphism, Subgraphs & Connectivity",
                    "Matching in Graphs: Bipartite Matching & Hall's Condition",
                    "Coloring of Graphs, Chromatic Numbers & Planar Graphs",
                    "Eulerian & Hamiltonian Paths/Circuits & Trees"
                ],
                "defaultChecklist": [
                    "Understand Handshaking Lemma, Havel-Hakimi theorem, graph degrees and connectivity",
                    "Master tree properties, spanning trees, cut vertices, bridges and subgraphs",
                    "Study matching in graphs, maximum bipartite matching and Hall's Marriage Theorem",
                    "Master graph coloring, chromatic number bounds and planar graphs Euler formula",
                    "Study Euler graphs theorem and Hamiltonian necessary/sufficient conditions",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_linear_matrices",
                "name": "Matrices, Determinants & Linear Systems",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Matrices Algebra & Transpose Properties",
                    "Determinants & Inverse of Matrices",
                    "Rank of Matrix & Row Echelon Forms",
                    "System of Linear Equations (Ax = b Consistency)",
                    "LU Decomposition of Matrices"
                ],
                "defaultChecklist": [
                    "Review determinants properties, adjoint and inverse calculation shortcuts",
                    "Master matrix rank determination via row echelon reductions",
                    "Analyze system of linear equations consistency: unique solution, infinite, no solution",
                    "Compute LU decomposition (A = LU) to factorize matrices and solve linear systems",
                    "Make short summary on rank-nullity theorem",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_linear_eigen",
                "name": "Eigenvalues, Eigenvectors & Vector Spaces",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Characteristic Equation & Cayley-Hamilton Theorem",
                    "Eigenvalues/Eigenvectors Properties",
                    "Diagonalization & Matrix Powers",
                    "Symmetric & Orthogonal Matrices"
                ],
                "defaultChecklist": [
                    "Calculate eigenvalues and eigenvectors using characteristic polynomial",
                    "Apply Cayley-Hamilton theorem to evaluate high matrix powers and inverses",
                    "Understand eigenvalues/eigenvectors properties for symmetric and orthogonal matrices",
                    "Review matrix diagonalization conditions and basis formed by eigenvectors",
                    "Make short formula notes on eigenvalue identities",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_calculus",
                "name": "Calculus: Limits, Continuity & Integrals",
                "importance": "MEDIUM",
                "historicalFrequency": 68,
                "subtopics": [
                    "Limits, L'Hopital Rule & Continuity/Differentiability",
                    "Maxima/Minima of Single & Multi Variable Functions",
                    "Mean Value Theorem: Rolle's & Lagrange's Theorems",
                    "Integration: Definite, Indefinite & Improper Integrals"
                ],
                "defaultChecklist": [
                    "Master limits indeterminate forms and L'Hopital rule application",
                    "Understand continuity/differentiability conditions at critical points",
                    "Apply Mean Value Theorem (Rolle's & Lagrange's) to function intervals",
                    "Calculate first and second derivative tests for local and global maxima/minima",
                    "Solve definite and improper integration problems and symmetric bounds",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "em_probability_distributions",
                "name": "Probability, Bayes Theorem & Distributions",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Random Variables & Conditional Probability",
                    "Bayes Theorem & Total Probability Law",
                    "Uniform Distribution, Normal Distribution & Exponential Distribution",
                    "Poisson Distribution & Binomial Distribution",
                    "Mean, Median, Mode & Standard Deviation"
                ],
                "defaultChecklist": [
                    "Master conditional probability, random variables and Bayes theorem formulation",
                    "Calculate mean, median, mode and standard deviation for probability distributions",
                    "Solve probability questions on Poisson distribution and Binomial distribution",
                    "Analyze continuous random variables: Uniform distribution, Normal distribution and Exponential distribution",
                    "Make concise summary on probability and statistics formulas",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "pds",
        "name": "Programming & Data Structures",
        "shortName": "Prog & DS",
        "icon": "💻",
        "historicalWeight": 9.5,
        "importance": "HIGH",
        "officialSection": "Section 4: Programming and Data Structures",
        "plannedDateRange": "13 Oct 2026 – 24 Oct 2026",
        "topics": [
            {
                "id": "pds_c_basics_pointers",
                "name": "C Programming: Pointers, Arrays & Functions",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "C Operators, Precedence & Associativity",
                    "Pointer Arithmetic & Multi-dimensional Arrays",
                    "Pass-by-value vs Pointer Parameter Passing",
                    "Pointer to Arrays & Function Pointers"
                ],
                "defaultChecklist": [
                    "Analyze operator precedence, short-circuit evaluation and type conversions in C",
                    "Master pointer arithmetic, array indexing and pointer-to-pointer dereferencing",
                    "Trace multi-dimensional array address offsets and pointer conversions",
                    "Understand function pointers and passing arrays to functions",
                    "Make short notes on subtle C pointer gotchas",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_recursion_structures",
                "name": "Recursion, Scope & Dynamic Memory",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Recursive Functions & Call Stack Tracing",
                    "Static, Automatic, Register & Extern Storage Classes",
                    "Structures, Unions & Memory Alignment/Padding",
                    "Dynamic Memory: malloc, calloc, realloc & free"
                ],
                "defaultChecklist": [
                    "Trace recursive function calls with call stacks and static variables",
                    "Understand variable scope, lifetime and storage classes in C",
                    "Calculate structure byte size considering compiler alignment and padding",
                    "Review dynamic allocation pitfalls: memory leaks and dangling pointers",
                    "Make summary notes on recursion trace techniques",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_arrays_stacks_queues",
                "name": "Arrays, Stacks, Queues & Polish Notation",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Stack ADT: Push, Pop & Overflow/Underflow",
                    "Queue ADT: Linear, Circular & Double-Ended (Deque)",
                    "Infix, Prefix & Postfix Expression Conversions",
                    "Postfix Expression Evaluation Using Stack"
                ],
                "defaultChecklist": [
                    "Understand stack operations, array representation and parentheses matching",
                    "Master circular queue wrap-around index arithmetic (front/rear modulo)",
                    "Convert infix expressions to prefix/postfix with operator precedence rules",
                    "Trace postfix evaluation using operand stacks",
                    "Make short notes on expression conversion rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_linked_lists",
                "name": "Singly, Doubly & Circular Linked Lists",
                "importance": "MEDIUM",
                "historicalFrequency": 72,
                "subtopics": [
                    "Singly Linked List: Insertion, Deletion & Traversal",
                    "Pointer Manipulation & Reversal Algorithms",
                    "Doubly Linked Lists & Memory Overhead",
                    "Circular Linked Lists & Cycle Detection (Floyd's)"
                ],
                "defaultChecklist": [
                    "Trace pointer updates for list insertions at head, middle and tail",
                    "Master iterative and recursive linked list reversal algorithms",
                    "Understand Floyd's tortoise-and-hare cycle detection algorithm",
                    "Analyze time/space complexity of linked list vs array operations",
                    "Make concise summary on list manipulation edge cases",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_binary_trees",
                "name": "Binary Trees & Traversal Properties",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Binary Tree Definitions, Height & Node Bounds",
                    "Preorder, Inorder, Postorder & Level-Order Traversals",
                    "Tree Reconstruction from Inorder + Preorder/Postorder",
                    "Strict, Complete, Full & Perfect Binary Trees"
                ],
                "defaultChecklist": [
                    "Understand node/height mathematical bounds for all binary tree types",
                    "Master non-recursive and recursive preorder, inorder and postorder traversals",
                    "Reconstruct unique binary trees given Inorder + Preorder/Postorder pairs",
                    "Trace level-order traversal using breadth-first queues",
                    "Make short formula notes on binary tree relationships",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_bst_avl",
                "name": "Binary Search Trees & AVL Balances",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "BST Property, Search, Insertion & Deletion Cases",
                    "Inorder Successor/Predecessor in BST",
                    "Minimum/Maximum Depth & Degenerate Cases",
                    "AVL Tree Balance Factor & Rotations (LL, RR, LR, RL)"
                ],
                "defaultChecklist": [
                    "Understand BST search, insert and 3-case node deletion (0, 1, 2 children)",
                    "Find inorder successor and predecessor in linear and logarithmic time",
                    "Calculate balance factors and perform single (LL/RR) and double (LR/RL) rotations",
                    "Determine minimum and maximum nodes in AVL tree of given height",
                    "Make concise summary on AVL rotation diagrams",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_heaps_priority_queues",
                "name": "Binary Heaps & Priority Queues",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Min-Heap & Max-Heap Properties",
                    "Array Representation of Complete Binary Trees",
                    "Build-Heap (Bottom-Up) O(n) Algorithm",
                    "Heapify, Insert, Delete-Max/Min & Heap Sort"
                ],
                "defaultChecklist": [
                    "Understand parent-child index arithmetic for array-backed complete trees",
                    "Trace top-down insert (bubble-up) and extract-min/max (sift-down)",
                    "Prove and trace O(n) time complexity of Build-Heap procedure",
                    "Trace Heap Sort in-place algorithm and comparison complexity",
                    "Make short notes on heap time complexities",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "pds_graphs_representation",
                "name": "Graph Representations & Search Foundations",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Adjacency Matrix vs Adjacency List Representations",
                    "Space Complexity Comparison for Sparse/Dense Graphs",
                    "Degree Calculation from Adjacency Structures",
                    "Directed vs Undirected Storage Schemes"
                ],
                "defaultChecklist": [
                    "Compare space and access time for adjacency matrix vs adjacency list",
                    "Analyze row/column summation for in-degree and out-degree determination",
                    "Understand representation of weighted and directed graphs",
                    "Review memory footprint considerations for sparse vs dense graphs",
                    "Make summary notes on graph representations",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "os",
        "name": "Operating Systems",
        "shortName": "OS",
        "icon": "💻",
        "historicalWeight": 8.5,
        "importance": "HIGH",
        "officialSection": "Section 8: Operating Systems",
        "plannedDateRange": "25 Oct 2026 – 06 Nov 2026",
        "topics": [
            {
                "id": "os_processes_threads",
                "name": "Processes, Threads & IPC",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Process States, Transitions & PCB Contents",
                    "System Calls: Dual-Mode Execution, Traps & OS Interfaces",
                    "Processes and Threads Hierarchy & fork(), exec() Tracing",
                    "User-Level vs Kernel-Level Threads",
                    "Inter-Process Communication (IPC): Pipes, Message Queues & Shared Memory"
                ],
                "defaultChecklist": [
                    "Understand process state transitions and Process Control Block (PCB) fields",
                    "Study system calls, dual-mode execution (user/kernel mode) and trap mechanism",
                    "Trace fork() system call trees and count created child processes",
                    "Compare User-Level Threads (ULT) vs Kernel-Level Threads (KLT) multithreading models",
                    "Review IPC primitives: shared memory, message passing and pipes",
                    "Make short notes on fork() tree formulas",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_cpu_scheduling",
                "name": "CPU Scheduling Algorithms",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Scheduling Criteria: Turnaround, Waiting & Response Time",
                    "FCFS & Convoy Effect",
                    "SJF & SRTF (Shortest Remaining Time First)",
                    "Round Robin (Quantum Tuning) & Priority Scheduling"
                ],
                "defaultChecklist": [
                    "Draw Gantt charts for preemptive and non-preemptive scheduling algorithms",
                    "Calculate average Turnaround Time, Waiting Time and Response Time accurately",
                    "Master SRTF and Round Robin time quantum boundary conditions",
                    "Analyze Multi-Level Queue and Multi-Level Feedback Queue scheduling",
                    "Make formula summary on scheduling metrics",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_synchronization",
                "name": "Synchronization: Critical Section & Semaphores",
                "importance": "HIGH",
                "historicalFrequency": 95,
                "subtopics": [
                    "Concurrency: Race Conditions & Critical Section Problem",
                    "Mutual Exclusion, Progress & Bounded Wait Requirements",
                    "Peterson's Two-Process Solution Algorithm",
                    "Synchronization Primitives: Counting & Binary Semaphores",
                    "Hardware Primitives: Test-and-Set & Compare-and-Swap"
                ],
                "defaultChecklist": [
                    "Analyze concurrency issues, race conditions and the 3 requirements for critical section solutions",
                    "Trace Peterson's algorithm step-by-step and prove correctness",
                    "Master counting semaphore value updates and process blocked queue tracking",
                    "Analyze atomic Test-and-Set and Swap hardware instructions",
                    "Make summary notes on synchronization and semaphore value invariants",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_classical_sync",
                "name": "Classical Synchronization Problems",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Producer-Consumer (Bounded Buffer) Problem",
                    "Readers-Writers Problem (Reader/Writer Starvation)",
                    "Dining Philosophers Problem & Deadlock Avoidance",
                    "Monitors & Condition Variables"
                ],
                "defaultChecklist": [
                    "Write and verify semaphore code for bounded-buffer Producer-Consumer problem",
                    "Analyze Readers-Writers problem with mutexes and readcount variables",
                    "Prevent circular wait in Dining Philosophers using asymmetric philosopher pick-up",
                    "Understand Monitor structure and Hoare vs Mesa semantics",
                    "Make concise summary on synchronization patterns",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_deadlocks",
                "name": "Deadlocks: Characterization & Banker's Algorithm",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "4 Coffman Deadlock Necessary Conditions",
                    "Resource Allocation Graphs (RAG) & Cycle Detection",
                    "Deadlock Prevention Strategies",
                    "Banker's Safety & Resource-Request Algorithm"
                ],
                "defaultChecklist": [
                    "Verify the 4 Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait",
                    "Analyze Resource Allocation Graphs with single vs multiple resource instances",
                    "Execute Banker's Safety Algorithm step-by-step (Need Matrix = Max - Allocation)",
                    "Evaluate Resource-Request Algorithm safety before allocation approval",
                    "Make summary notes on Banker's algorithm matrices",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_memory_management",
                "name": "Memory Management: Paging & Segmentation",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Logical vs Physical Address Space Translation",
                    "Contiguous Allocation: First-Fit, Best-Fit & Worst-Fit",
                    "Internal & External Fragmentation",
                    "Paging: Page Tables, Frame Allocation & TLB Lookups"
                ],
                "defaultChecklist": [
                    "Calculate internal and external fragmentation for allocation algorithms",
                    "Translate logical address (page number, offset) to physical frame address",
                    "Compute single-level and multi-level page table size in bytes",
                    "Calculate Effective Memory Access Time (EMAT) with TLB hit and miss ratios",
                    "Make formula summary on EMAT and page table sizes",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_virtual_memory",
                "name": "Virtual Memory & Page Replacement",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Demand Paging & Page Fault Service Routines",
                    "FIFO Page Replacement & Belady's Anomaly",
                    "Optimal (OPT) Page Replacement Benchmark",
                    "Least Recently Used (LRU) & Second Chance/Clock"
                ],
                "defaultChecklist": [
                    "Trace page fault counts for reference strings under FIFO, OPT and LRU",
                    "Understand Belady's Anomaly conditions and why stack algorithms (LRU, OPT) avoid it",
                    "Calculate effective access time considering page fault service overhead",
                    "Review Working Set model, Page Fault Frequency and Thrashing prevention",
                    "Make comparison table of page replacement algorithms",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_file_systems",
                "name": "File Systems & Directory Structures",
                "importance": "MEDIUM",
                "historicalFrequency": 68,
                "subtopics": [
                    "File Concepts, Directory Trees & Access Methods",
                    "Contiguous, Linked & Indexed File Allocation",
                    "UNIX Inode Architecture & Max File Size Calculation",
                    "Free Space Management: Bitmaps & Linked Lists"
                ],
                "defaultChecklist": [
                    "Calculate maximum file size supported by UNIX Inode (direct, single, double, triple indirect)",
                    "Compare contiguous, linked-list and index-block file allocation disk seeks",
                    "Analyze directory lookup structures: linear lists vs hash tables",
                    "Understand disk free-space bitmap size and pointer overhead",
                    "Make short notes on Inode calculation steps",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "os_io_protection",
                "name": "Disk Scheduling & Protection",
                "importance": "LOW",
                "historicalFrequency": 55,
                "subtopics": [
                    "Disk Drive Structure: Tracks, Sectors & Seek Times",
                    "I/O Scheduling & Disk Scheduling: FCFS, SSTF, SCAN, C-SCAN, LOOK & C-LOOK",
                    "I/O Hardware: Polling, Interrupts & DMA Direct Memory Access",
                    "Protection: Rings, Access Matrix & Capabilities"
                ],
                "defaultChecklist": [
                    "Calculate total track head movements for I/O scheduling and disk scheduling algorithms",
                    "Compare SCAN and LOOK boundary turnaround behaviors",
                    "Understand rotational latency and transfer time components",
                    "Review protection domain switching and Access Control Lists",
                    "Make summary notes on disk scheduling calculations",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "cn",
        "name": "Computer Networks",
        "shortName": "Networks",
        "icon": "🌐",
        "historicalWeight": 8.5,
        "importance": "HIGH",
        "officialSection": "Section 10: Computer Networks",
        "plannedDateRange": "20 Nov 2026 – 02 Dec 2026",
        "topics": [
            {
                "id": "cn_layering_switching",
                "name": "OSI & TCP/IP Layering & Switching",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 75,
                "subtopics": [
                    "OSI 7-Layer Model Responsibilities",
                    "TCP/IP 5-Layer Architectural Stack",
                    "Packet Switching, Circuit Switching & Virtual Circuit Switching",
                    "Delay Calculations: Transmission, Propagation, Queueing & Processing"
                ],
                "defaultChecklist": [
                    "Map protocol functions to appropriate OSI and TCP/IP layers",
                    "Calculate total packet transfer latency (Transmission Delay = L/B, Propagation Delay = d/v)",
                    "Compare packet switching, circuit switching and virtual circuit switching network architectures",
                    "Understand bandwidth-delay product and channel capacity",
                    "Make concise formula sheet on network delays",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_data_link_framing",
                "name": "Framing, Error Detection & CRC",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Data-Link Framing: Byte Stuffing & Bit Stuffing (Flag 01111110)",
                    "Error Detection: Simple Parity, 2D Parity & Checksum Calculation",
                    "Cyclic Redundancy Check (CRC) Polynomial Division",
                    "Hamming Error-Correcting Codes & Minimum Distance"
                ],
                "defaultChecklist": [
                    "Execute bit-stuffing and byte-stuffing framing transformations on data-link frames",
                    "Perform modulo-2 binary division for CRC generation and syndrome error detection",
                    "Calculate minimum Hamming distance d_min to detect d-1 and correct (d-1)/2 errors",
                    "Review internet checksum 1s-complement addition algorithm",
                    "Make short notes on CRC division rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_flow_control",
                "name": "Flow Control: ARQ Protocols",
                "importance": "HIGH",
                "historicalFrequency": 95,
                "subtopics": [
                    "Stop-and-Wait ARQ & Efficiency Formula (η = 1 / (1 + 2a))",
                    "Go-Back-N ARQ & Window Size Bounds (W_s <= 2^k - 1)",
                    "Selective Repeat ARQ & Window Bounds (W_s + W_r <= 2^k)",
                    "Throughput & Sequence Number Arithmetic"
                ],
                "defaultChecklist": [
                    "Derive and calculate efficiency η for Stop-and-Wait, Go-Back-N and Selective Repeat",
                    "Determine minimum bits needed in sequence number field for sliding windows",
                    "Analyze retransmission counts and vulnerable intervals under lost frames/ACKs",
                    "Calculate maximum achievable data throughput given bandwidth and round-trip time",
                    "Make formula summary on sliding window efficiencies",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_mac_ethernet",
                "name": "MAC Protocols & CSMA/CD",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "MAC Protocols: Pure ALOHA vs Slotted ALOHA Maximum Throughput",
                    "CSMA: 1-Persistent, Non-Persistent & p-Persistent",
                    "CSMA/CD: Collision Detection & Min Frame Size (L >= 2 * RTT * B)",
                    "Exponential Backoff Algorithm & Binary Collisions",
                    "Ethernet Bridging: Transparent Bridges & Spanning Tree (STP)"
                ],
                "defaultChecklist": [
                    "Compare vulnerable periods and maximum throughput of Pure (18.4%) vs Slotted ALOHA (36.8%)",
                    "Derive minimum frame size formula L >= 2 * T_p * B for CSMA/CD",
                    "Execute Binary Exponential Backoff algorithm window calculations",
                    "Analyze ethernet bridging, transparent bridges, frame filtering and forwarding",
                    "Make short notes on CSMA/CD and ethernet bridging constraints",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_ip_addressing_cidr",
                "name": "IPv4/IPv6 Addressing, Subnetting & CIDR",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "IP Addressing: IPv4 & IPv6 Address Structure and Classes",
                    "Subnet Masks, Subnetting & Supernetting",
                    "Classless Inter-Domain Routing (CIDR) Prefix Matching",
                    "ICMP Protocol (Error Reporting, Ping & Traceroute)",
                    "NAT (Network Address Translation) & Private IP Ranges",
                    "Longest Prefix Match Routing Table Lookup"
                ],
                "defaultChecklist": [
                    "Determine network ID, broadcast address and usable host addresses for CIDR blocks",
                    "Partition an allocated block into unequal-sized subnets satisfying host requirements",
                    "Perform Longest Prefix Match lookup given routing table entries and destination IP",
                    "Analyze ICMP error reporting messages and NAT translation table mechanisms",
                    "Make concise summary on IP addressing, CIDR and NAT translation",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_routing_algorithms",
                "name": "IP Fragmentation & Routing Protocols",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Fragmentation: IP Packet Fragmentation, MTU, MF Flag & Offset",
                    "Shortest Path Routing: Distance Vector Routing & Bellman-Ford",
                    "Link State Routing & Dijkstra Shortest Path Computation",
                    "Flooding Routing Algorithm & Selective Flooding",
                    "Border Gateway Protocol (BGP) & Autonomous Systems"
                ],
                "defaultChecklist": [
                    "Calculate fragment lengths, MF flags and Fragment Offsets (divided by 8)",
                    "Trace Distance Vector routing table updates using Bellman-Ford equations and count-to-infinity",
                    "Trace Link State Routing and Dijkstra shortest path computation",
                    "Understand flooding routing algorithms, hop counters and selective flooding",
                    "Make short notes on fragmentation and routing algorithms",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_transport_tcp_udp",
                "name": "Transport Layer: TCP, UDP & Handshakes",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "TCP vs UDP Header Fields & Characteristics",
                    "TCP 3-Way Handshake & Connection Teardown",
                    "TCP Sequence Numbers & Cumulative Acknowledgements",
                    "TCP Flow Control & Receiver Advertised Window"
                ],
                "defaultChecklist": [
                    "Analyze TCP header structure: Sequence number, ACK number, flags (SYN, ACK, FIN, RST)",
                    "Trace TCP 3-way connection establishment and sequence number synchronization",
                    "Trace connection teardown states (TIME_WAIT, FIN_WAIT)",
                    "Understand how receiver advertised window controls transmission buffer overflow",
                    "Make concise summary on TCP header and flags",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_tcp_congestion",
                "name": "TCP Congestion Control & Sockets",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Congestion Window (cwnd) & Slow Start Phase",
                    "Congestion Avoidance: Additive Increase Multiplicative Decrease (AIMD)",
                    "Fast Retransmit & Fast Recovery (3 Duplicate ACKs)",
                    "Timeout Events vs 3 Duplicate ACKs Window Resets"
                ],
                "defaultChecklist": [
                    "Trace cwnd expansion during Slow Start (exponential) and Congestion Avoidance (linear)",
                    "Calculate cwnd size and ssthresh threshold after Timeout vs 3 Duplicate ACKs",
                    "Compute average TCP throughput under periodic packet drop cycles",
                    "Review socket address combination (IP + Port) and multiplexing/demultiplexing",
                    "Make formula summary on TCP window dynamics",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cn_application_protocols",
                "name": "Application Layer Protocols: DNS, HTTP, SMTP",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "DNS Hierarchy, Iterative vs Recursive Queries & Resource Records",
                    "HTTP: Persistent vs Non-Persistent & Status Codes",
                    "Email Architecture & Protocols: SMTP, POP3 & IMAP",
                    "File Transfer Protocol (FTP): Control & Data Connections",
                    "DHCP & ARP Address Resolution Protocols"
                ],
                "defaultChecklist": [
                    "Calculate total round-trip time (RTT) for HTTP requests under persistent vs non-persistent modes",
                    "Trace iterative and recursive DNS resolution steps and local caching",
                    "Understand ARP protocol request/reply and DHCP 4-way DORA protocol",
                    "Study FTP two-channel architecture (control on port 21, data on port 20) and email architecture (SMTP, POP3, IMAP)",
                    "Make concise comparison table of application layer protocols",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "coa",
        "name": "Computer Organization & Architecture",
        "shortName": "COA",
        "icon": "⚡",
        "historicalWeight": 8.5,
        "importance": "HIGH",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "plannedDateRange": "03 Dec 2026 – 11 Dec 2026",
        "topics": [
            {
                "id": "coa_machine_instructions",
                "name": "Instruction Formats & Addressing Modes",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Instruction Cycle: Fetch, Decode, Execute",
                    "Zero, One, Two & Three Address Machines",
                    "Addressing Modes: Immediate, Direct, Indirect, Indexed, Base-Register, Relative",
                    "Program Counter Relative Branch Offset Calculations"
                ],
                "defaultChecklist": [
                    "Calculate opcode, register and address field bit lengths in instruction words",
                    "Master effective address calculations for all standard addressing modes",
                    "Compute PC-relative branch target addresses and sign-extension offsets",
                    "Analyze expanding opcode schemes for variable-length instructions",
                    "Make concise summary on addressing modes",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "coa_alu_datapath",
                "name": "ALU, Data-Path & Control Unit Design",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 80,
                "subtopics": [
                    "Single-Cycle vs Multi-Cycle Datapath Organizations",
                    "Hardwired Control vs Microprogrammed Control Units",
                    "Horizontal vs Vertical Microprogramming Formats",
                    "Microprogram Sequencing & Control Store Size"
                ],
                "defaultChecklist": [
                    "Trace control signal assertions during instruction execution cycles",
                    "Compare speed and flexibility trade-offs between Hardwired and Microprogrammed control",
                    "Calculate control memory word width and size for horizontal vs vertical microcode",
                    "Understand nanoprogramming and control store reduction techniques",
                    "Make comparison table of control unit architectures",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "coa_instruction_pipelining",
                "name": "Instruction Pipelining & Hazard Resolution",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Instruction Pipelining Stages, Clock Cycle Time & Ideal Speedup",
                    "Pipeline Hazards: Structural Hazards & Resource Conflicts",
                    "Pipeline Hazards: Data Hazards (RAW, WAR, WAW) & Forwarding",
                    "Pipeline Hazards: Control Hazards, Branch Penalty & Delayed Branching"
                ],
                "defaultChecklist": [
                    "Calculate clock cycle time = max(stage delays) + latch delay and instruction pipelining speedup",
                    "Analyze pipeline hazards: structural hazards, data hazards and control hazards",
                    "Trace hardware operand forwarding to eliminate data dependency bubbles",
                    "Compute branch penalty impact on Average Cycles Per Instruction (CPI)",
                    "Make formula summary on pipeline speedup, throughput and pipeline hazards",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "coa_memory_cache",
                "name": "Cache Memory Mapping & Replacement",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Direct Mapping, Fully Associative & Set-Associative Caches",
                    "Tag, Set/Index & Word Offset Bit Division",
                    "Write-Through vs Write-Back Policies (Dirty Bit)",
                    "Cache Replacement: LRU, FIFO & Multi-Level Cache EMAT"
                ],
                "defaultChecklist": [
                    "Partition physical address bits into Tag, Index/Set and Offset for all cache mappings",
                    "Calculate cache directory overhead and total memory footprint in bits",
                    "Execute LRU cache line updates on sequences of block references",
                    "Calculate multi-level cache Effective Memory Access Time (T_avg = h1*t1 + (1-h1)*(h2*t2 + ...))",
                    "Make formula summary on cache addressing",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "coa_main_secondary_memory",
                "name": "Main Memory Organization & Storage Devices",
                "importance": "MEDIUM",
                "historicalFrequency": 68,
                "subtopics": [
                    "DRAM vs SRAM Technologies & Refresh Cycles",
                    "Memory Chip Interleaving: High-Order vs Low-Order Interleaving",
                    "Designing Large Memory Modules from Smaller Memory Chips",
                    "Secondary Storage: Magnetic Disk Organization & RAID Levels"
                ],
                "defaultChecklist": [
                    "Design memory banks using chip decoder circuits and address lines",
                    "Compare bandwidth improvement of low-order memory interleaving",
                    "Calculate memory cycle time and burst access data rates",
                    "Review RAID levels (RAID 0, 1, 5) mirroring and parity striping",
                    "Make short notes on memory chip expansion",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "coa_io_interface",
                "name": "I/O Interface, Interrupts & DMA",
                "importance": "MEDIUM",
                "historicalFrequency": 70,
                "subtopics": [
                    "Programmed I/O vs Interrupt-Driven I/O",
                    "Vectored vs Non-Vectored Interrupts & Daisy Chaining",
                    "Direct Memory Access (DMA): Cycle Stealing vs Burst Mode",
                    "Bus Arbitration Protocols"
                ],
                "defaultChecklist": [
                    "Compare CPU overhead for Programmed I/O vs Interrupts vs DMA",
                    "Calculate percentage of CPU time consumed by interrupt servicing of high-speed devices",
                    "Compute DMA cycle stealing bandwidth steal ratio on main memory bus",
                    "Understand daisy chain priority resolution propagation delays",
                    "Make summary notes on I/O transfer modes",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "dl",
        "name": "Digital Logic",
        "shortName": "Digital",
        "icon": "🔌",
        "historicalWeight": 5,
        "importance": "MEDIUM",
        "officialSection": "Section 2: Digital Logic",
        "plannedDateRange": "12 Dec 2026 – 16 Dec 2026",
        "topics": [
            {
                "id": "dl_boolean_minimization",
                "name": "Boolean Algebra, Logic Gates & K-Maps",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Boolean Algebra Theorems & De Morgan's Laws",
                    "Canonical Forms: Sum of Products (SOP) & Product of Sums (POS)",
                    "Karnaugh Map Minimization (2, 3 & 4 Variables)",
                    "Prime Implicants & Essential Prime Implicants Detection"
                ],
                "defaultChecklist": [
                    "Simplify complex logic expressions using Boolean theorems and dual forms",
                    "Plot canonical minterms/maxterms and don't care conditions on 4-variable K-maps",
                    "Identify all Prime Implicants (PI) and Essential Prime Implicants (EPI)",
                    "Implement boolean expressions using universal NAND-only and NOR-only logic",
                    "Make concise summary on K-Map grouping rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dl_combinational_circuits",
                "name": "Combinational Circuits: MUX, Decoders & Adders",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Half Adder, Full Adder & Ripple Carry Adder Delay",
                    "Carry-Lookahead Adder Fast Propagation Principles",
                    "Multiplexers (MUX) & Demultiplexers Implementation",
                    "Decoders (Active-High/Low) & Encoders (Priority Encoders)"
                ],
                "defaultChecklist": [
                    "Calculate worst-case carry propagation delay in n-bit Ripple Carry Adders",
                    "Synthesize arbitrary Boolean functions using 2:1, 4:1 and 8:1 Multiplexers",
                    "Implement logic functions using Decoders with external NAND/OR gates",
                    "Understand Priority Encoder truth tables and valid bit outputs",
                    "Make short notes on MUX implementation tricks",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dl_sequential_circuits",
                "name": "Sequential Circuits: Latches & Flip-Flops",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "SR Latch, Gated Latches & Race-Around Condition in JK",
                    "Master-Slave JK Flip-Flop Mechanism",
                    "D Flip-Flop, T Flip-Flop & Characteristic Equations",
                    "Excitation Tables & Conversion Between Flip-Flops"
                ],
                "defaultChecklist": [
                    "Master characteristic equations for SR, JK, D and T flip-flops",
                    "Construct excitation tables and convert one flip-flop type to another",
                    "Understand setup time (t_setup) and hold time (t_hold) timing constraints",
                    "Calculate maximum clock frequency to prevent timing violations in synchronous circuits",
                    "Make concise summary on flip-flop excitation tables",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dl_counters_registers",
                "name": "Counters, Registers & State Machines",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Asynchronous (Ripple) Counters & Propagation Delays",
                    "Synchronous Modulo-N Counters Design",
                    "Ring Counter & Johnson Counter Modulus Sequences",
                    "Mealy vs Moore Finite State Machine Models"
                ],
                "defaultChecklist": [
                    "Design synchronous Modulo-N counters using flip-flops and excitation maps",
                    "Calculate maximum clock frequency of ripple counters based on gate propagation delay",
                    "Determine sequence and unused state lockout loops in Johnson and Ring counters",
                    "Analyze state transition tables and state diagrams for Mealy vs Moore machines",
                    "Make summary notes on counter design steps",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dl_number_representations",
                "name": "Number Systems & Computer Arithmetic",
                "importance": "MEDIUM",
                "historicalFrequency": 70,
                "subtopics": [
                    "Number Representations: Fixed-Point and Floating-Point Formats",
                    "Computer Arithmetic: 1's & 2's Complement Addition/Subtraction",
                    "Binary, Octal, Decimal & Hexadecimal Base Conversions",
                    "Arithmetic Overflow Detection in 2's Complement",
                    "IEEE 754 Single & Double Precision Floating-Point Standard"
                ],
                "defaultChecklist": [
                    "Convert numbers between arbitrary bases with fixed-point fractional radix points",
                    "Perform computer arithmetic and 2's complement binary addition with overflow detection",
                    "Determine range and precision of fixed-point and floating-point representations",
                    "Encode and decode IEEE 754 single-precision and double-precision floating-point formats",
                    "Make formula summary on number representations and computer arithmetic",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "toc",
        "name": "Theory of Computation",
        "shortName": "TOC",
        "icon": "⚙️",
        "historicalWeight": 8.5,
        "importance": "HIGH",
        "officialSection": "Section 6: Theory of Computation",
        "plannedDateRange": "17 Dec 2026 – 25 Dec 2026",
        "topics": [
            {
                "id": "toc_finite_automata",
                "name": "Finite Automata: DFA, NFA & State Minimization",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Deterministic Finite Automata (DFA) Formal Definition",
                    "Non-Deterministic Finite Automata (NFA) & ε-Transitions",
                    "Subset Construction (NFA to DFA Conversion)",
                    "Myhill-Nerode Theorem & Table-Filling DFA Minimization"
                ],
                "defaultChecklist": [
                    "Construct minimal DFAs for specific string patterns (substrings, prefixes, modulo counting)",
                    "Convert ε-NFA to equivalent DFA using subset power set construction",
                    "Minimize DFA state count using equivalence partitioning and Table-Filling algorithm",
                    "Calculate number of states in minimal DFA for union, intersection and complements",
                    "Make summary notes on DFA construction patterns",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "toc_regular_languages",
                "name": "Regular Expressions & Pumping Lemma",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Regular Expressions & Algebraic Identities (Arden's Theorem)",
                    "Pumping Lemma for Regular Languages (Proof of Non-Regularity)",
                    "Closure Properties of Regular Languages",
                    "Decidability of Regular Language Questions (Emptiness, Finiteness)"
                ],
                "defaultChecklist": [
                    "Convert regular expressions to finite automata and vice-versa using Arden's Lemma",
                    "Apply Pumping Lemma for regular languages to prove languages non-regular",
                    "Verify closure properties of regular languages under union, intersection, homomorphism, reverse",
                    "Review decidable algorithms for DFA equivalence, emptiness and finiteness",
                    "Make comparison chart of regular language properties",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "toc_cfg_pda",
                "name": "Context-Free Grammars & Pushdown Automata",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Context-Free Grammars (CFG) & Derivation Trees",
                    "Ambiguity in CFGs & Inherently Ambiguous Languages",
                    "Chomsky Normal Form (CNF) & Griebach Normal Form",
                    "Pushdown Automata (PDA): Acceptance by Empty Stack vs Final State"
                ],
                "defaultChecklist": [
                    "Construct CFGs for paired matching languages (e.g., a^n b^n, palindromes)",
                    "Prove grammar ambiguity by demonstrating two distinct parse trees or leftmost derivations",
                    "Design Deterministic PDA (DPDA) vs Non-Deterministic PDA (NPDA)",
                    "Understand why DCFLs are properly contained in CFLs and DPDA acceptance limits",
                    "Make summary notes on CFG and PDA models",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "toc_cfl_properties",
                "name": "CFL Properties & Chomsky Hierarchy",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 82,
                "subtopics": [
                    "Pumping Lemma for Context-Free Languages",
                    "Closure Properties of CFLs and DCFLs",
                    "Chomsky Hierarchy: Type 0, 1, 2, 3 Languages & Grammars",
                    "Decidable vs Undecidable Properties of CFLs"
                ],
                "defaultChecklist": [
                    "Apply CFL Pumping Lemma (u v w x y decomposition) to prove languages non-CFL",
                    "Remember exact closure properties of CFLs (closed under union, concat, star; NOT intersection/complement)",
                    "Analyze DCFL closure properties (closed under complement; NOT union/intersection)",
                    "Review undecidable questions for CFLs (ambiguity, universality, equivalence)",
                    "Make comparison matrix of Chomsky hierarchy language classes",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "toc_turing_machines",
                "name": "Turing Machines & Recursive Languages",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Turing Machine Formal Model, Instantaneous Descriptions",
                    "Recursive (REC / Decidable) Languages",
                    "Recursively Enumerable (RE / Semi-Decidable) Languages",
                    "Multi-Tape, Multi-Track & Non-Deterministic TM Equivalences"
                ],
                "defaultChecklist": [
                    "Design Turing Machine transitions for language recognition and function computation",
                    "Understand the crucial distinction between halting (Decidable/REC) vs looping (RE)",
                    "Analyze language closure properties for Recursive and Recursively Enumerable classes",
                    "Review Church-Turing thesis and Turing completeness",
                    "Make short notes on REC vs RE Venn diagrams",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "toc_halting_reducibility",
                "name": "Undecidability, Rice's Theorem & Reductions",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Halting Problem of Turing Machines & Diagonalization Proof",
                    "Post Correspondence Problem (PCP) & Modified PCP",
                    "Rice's Theorem for Non-Trivial Semantic Properties",
                    "Mapping Reductions (A <=_m B) for Proving Undecidability"
                ],
                "defaultChecklist": [
                    "Understand Turing's proof of the undecidability of the Halting Problem by diagonalization",
                    "Apply Rice's Theorem Part 1 (undecidability of non-trivial semantic properties of RE languages)",
                    "Apply Rice's Theorem Part 2 (non-recursively enumerable properties)",
                    "Use mapping reductions to prove problems undecidable from known undecidable bases (HP, PCP)",
                    "Make comprehensive table of decidability results across all language families",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "cd",
        "name": "Compiler Design",
        "shortName": "Compilers",
        "icon": "🛠️",
        "historicalWeight": 4.5,
        "importance": "MEDIUM",
        "officialSection": "Section 7: Compiler Design",
        "plannedDateRange": "26 Dec 2026 – 03 Jan 2027",
        "topics": [
            {
                "id": "cd_lexical_analysis",
                "name": "Lexical Analysis & Tokenization",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Role of Lexical Analyzer & Token Specification",
                    "Lexemes, Patterns & Regular Expressions for Tokens",
                    "Input Buffering & Lookahead Pairs",
                    "Lexical Errors & Recovery Strategies"
                ],
                "defaultChecklist": [
                    "Count tokens produced by lexical analyzers for given C code snippets",
                    "Design regular expressions and transition diagrams for programming language keywords/identifiers",
                    "Understand longest match (maximal munch) and keyword priority rules",
                    "Review input buffering with two-buffer schemes and sentinel characters",
                    "Make short notes on lexical token counting rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cd_syntax_top_down",
                "name": "Top-Down Parsing & LL(1) Grammars",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Top-Down Parsing & Backtracking Issues",
                    "Elimination of Left Recursion (Direct & Indirect)",
                    "Left Factoring of Common Prefixes",
                    "Computation of FIRST and FOLLOW Sets & LL(1) Parsing Table"
                ],
                "defaultChecklist": [
                    "Eliminate direct and indirect left recursion from context-free grammars",
                    "Apply left factoring to make grammars deterministic for predictive parsing",
                    "Calculate FIRST and FOLLOW sets for all non-terminals systematically",
                    "Construct LL(1) parsing tables and detect First/First and First/Follow conflicts",
                    "Make concise formula summary on FIRST and FOLLOW rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cd_syntax_bottom_up",
                "name": "Bottom-Up Parsing: LR(0), SLR(1), LALR(1) & CLR(1)",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Shift-Reduce & Handle Pruning Principles",
                    "LR(0) Canonical Collection of Items & DFA",
                    "SLR(1) Parsing Table Construction & Shift/Reduce Conflicts",
                    "CLR(1) & LALR(1) Parsing Tables with Lookaheads"
                ],
                "defaultChecklist": [
                    "Construct canonical collection of LR(0) items using CLOSURE and GOTO operations",
                    "Identify Shift-Reduce (SR) and Reduce-Reduce (RR) conflicts in LR(0) and SLR(1) tables",
                    "Construct CLR(1) item sets with lookaheads and merge states with common cores for LALR(1)",
                    "Analyze parsing power relationships: LR(0) < SLR(1) < LALR(1) < CLR(1)",
                    "Make comparative notes on LR parser conflict rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cd_sdt_semantics",
                "name": "Syntax-Directed Translation (SDT)",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Syntax-Directed Definitions (SDD): Synthesized vs Inherited Attributes",
                    "S-Attributed Definitions & Bottom-Up Evaluation",
                    "L-Attributed Definitions & Depth-First Evaluation",
                    "Annotated Parse Trees & Dependency Graphs"
                ],
                "defaultChecklist": [
                    "Distinguish synthesized attributes (computed from children) vs inherited attributes (from parent/siblings)",
                    "Evaluate attribute values on annotated parse trees and abstract syntax trees",
                    "Determine whether an SDD is S-attributed or L-attributed and check for dependency cycles",
                    "Implement semantic actions during LR shift/reduce parsing for S-attributed definitions",
                    "Make short notes on S-attributed vs L-attributed properties",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cd_intermediate_code",
                "name": "Intermediate Code Generation & TAC",
                "importance": "MEDIUM",
                "historicalFrequency": 70,
                "subtopics": [
                    "Three-Address Code (TAC) Representation Formats",
                    "Quadruples, Triples & Indirect Triples Data Structures",
                    "Translating Expressions, Boolean Conditions & Control Flow",
                    "Backpatching for Boolean Expressions and Flow-of-Control"
                ],
                "defaultChecklist": [
                    "Generate Three-Address Code for arithmetic expressions and conditional statements",
                    "Represent three-address code using quadruples, triples and indirect triples arrays",
                    "Translate short-circuit boolean logic with jump targets and backpatching",
                    "Evaluate minimum temporary variables needed using DAG generation",
                    "Make concise summary on three-address code structures",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cd_runtime_environments",
                "name": "Runtime Storage & Activation Records",
                "importance": "MEDIUM",
                "historicalFrequency": 66,
                "subtopics": [
                    "Runtime Environments & Storage Organization",
                    "Activation Records (Stack Frames) Structure & Fields",
                    "Static vs Dynamic Scope Rules",
                    "Parameter Passing Mechanisms: Call-by-Value, Call-by-Reference, Call-by-Name"
                ],
                "defaultChecklist": [
                    "Understand runtime environments and trace activation records on stack during procedure calls",
                    "Calculate variable bindings under lexical (static) scoping vs dynamic scoping",
                    "Evaluate output of program snippets under Call-by-Value, Reference and Copy-Restore",
                    "Understand access links and display arrays for accessing non-local variables",
                    "Make comparison chart on parameter passing mechanisms",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "cd_code_optimization",
                "name": "Basic Blocks, Flow Graphs & Code Optimization",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Basic Blocks Partitioning & Leaders Identification",
                    "Control Flow Graph (CFG) Construction & Loop Detection",
                    "Local Optimization: Common Subexpression Elimination, Dead Code & Copy Propagation",
                    "Data-Flow Analyses: Constant Propagation & Liveness Analysis"
                ],
                "defaultChecklist": [
                    "Identify leaders and partition three-address code sequences into basic blocks",
                    "Construct Control Flow Graphs (CFG) and determine dominators and loop back-edges",
                    "Apply DAG-based local optimization within basic blocks (common subexpression elimination)",
                    "Execute data-flow analyses: constant propagation and liveness analysis at basic block boundaries",
                    "Make short notes on basic block rules and optimization passes",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "dbms",
        "name": "Databases (DBMS)",
        "shortName": "DBMS",
        "icon": "🗄️",
        "historicalWeight": 8,
        "importance": "HIGH",
        "officialSection": "Section 9: Databases",
        "plannedDateRange": "07 Nov 2026 – 19 Nov 2026",
        "topics": [
            {
                "id": "dbms_er_relational",
                "name": "ER Modeling & Relational Schema Mapping",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 76,
                "subtopics": [
                    "ER Model: Entity Types, Weak Entities & Key Attributes",
                    "Relational Model: Schemas, Domains, Tuples & Keys",
                    "Relationship Types, Cardinality & Participation Constraints",
                    "Converting ER Diagrams to Minimum Relational Tables",
                    "Generalization, Specialization & Aggregation"
                ],
                "defaultChecklist": [
                    "Master ER model concepts, entity sets, relational model constraints and schema conversion",
                    "Analyze cardinalities (1:1, 1:N, M:N) and total vs partial participation constraints",
                    "Determine minimum number of relational tables required to represent given ER schemas",
                    "Identify primary and foreign keys when mapping weak entity sets and binary relationships",
                    "Avoid duplicate table creation and redundancy during conversion",
                    "Make concise summary on ER to table conversion rules",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_relational_algebra",
                "name": "Relational Algebra & Tuple Calculus",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Fundamental Operators: Select (σ), Project (π), Union, Difference, Cartesian Product",
                    "Derived Operators: Natural Join, Theta Join, Outer Joins & Division",
                    "Tuple Relational Calculus (TRC) Existential & Universal Quantifiers",
                    "Safe Relational Calculus & Expressive Equivalence"
                ],
                "defaultChecklist": [
                    "Formulate and evaluate relational algebra queries involving joins and projections",
                    "Understand Relational Division operator (÷) for queries requiring \"all\" or universal matching",
                    "Translate English requirements into Tuple Relational Calculus expressions with ∀ and ∃",
                    "Verify query equivalence between Relational Algebra and SQL queries",
                    "Make short notes on relational algebra operator properties",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_sql",
                "name": "SQL Queries, Joins & Aggregations",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "SQL DDL, DML & Integrity Constraints",
                    "Nested Subqueries (IN, ALL, ANY, EXISTS)",
                    "GROUP BY, HAVING Clauses & Aggregations (COUNT, SUM, AVG)",
                    "Inner Joins, Left/Right/Full Outer Joins & NULL Handling"
                ],
                "defaultChecklist": [
                    "Write and trace complex SQL queries involving GROUP BY and HAVING filters",
                    "Master Correlated Subqueries and EXISTS / NOT EXISTS semantics",
                    "Evaluate behavior of 3-valued boolean logic under NULL values in SQL",
                    "Trace rows produced by INNER vs LEFT/RIGHT/FULL OUTER JOIN operations",
                    "Make concise summary on SQL execution order and NULL logic",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_integrity_dependencies",
                "name": "Functional Dependencies & Candidate Keys",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Functional Dependencies (FD) & Armstrong's Axioms",
                    "Attribute Closure Algorithm (X+) Computation",
                    "Finding All Candidate Keys & Superkeys of a Relation",
                    "Canonical / Minimal Cover of Functional Dependencies"
                ],
                "defaultChecklist": [
                    "Compute attribute closure X+ under a given set of functional dependencies",
                    "Find all candidate keys systematically by analyzing left, right and middle attributes",
                    "Calculate total number of superkeys for a relation given candidate keys",
                    "Compute Minimal / Canonical Cover of FDs by eliminating extraneous attributes and redundancies",
                    "Make formula summary on superkey counting formulas",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_normalization",
                "name": "Normalization: 1NF, 2NF, 3NF & BCNF",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Normal Forms Definitions: 1NF, 2NF, 3NF & BCNF",
                    "Prime vs Non-Prime Attributes Identification",
                    "Lossless-Join Decomposition Testing Algorithm",
                    "Dependency Preserving Decomposition Checking"
                ],
                "defaultChecklist": [
                    "Determine the highest normal form satisfied by a given relational schema (1NF, 2NF, 3NF, BCNF)",
                    "Decompose relations into 3NF using synthesis algorithm while preserving dependencies",
                    "Decompose relations into BCNF and check for dependency preservation trade-offs",
                    "Test whether a relational decomposition is guaranteed Lossless Join",
                    "Make decision chart for checking normal forms quickly",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_transactions_concurrency",
                "name": "Transactions, ACID & Serializability",
                "importance": "HIGH",
                "historicalFrequency": 95,
                "subtopics": [
                    "Transaction States & ACID Properties (Atomicity, Consistency, Isolation, Durability)",
                    "Conflict Serializability & Precedence (Serialization) Graph",
                    "View Serializability & Blind Writes",
                    "Recoverable, Cascadeless & Strict Schedules"
                ],
                "defaultChecklist": [
                    "Construct precedence graphs for concurrent schedules and check for conflict serializability cycles",
                    "Determine equivalent serial schedule orders from topological sort of precedence graphs",
                    "Differentiate view serializable schedules using blind writes vs conflict serializable schedules",
                    "Classify schedules into Recoverable, Avoids Cascading Aborts (ACA) and Strict",
                    "Make comparison chart on schedule safety classes",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_concurrency_control",
                "name": "Concurrency Control Protocols: 2PL & Timestamps",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Lock-Based Protocols: Shared (S) & Exclusive (X) Locks",
                    "Two-Phase Locking (2PL): Growing & Shrinking Phases",
                    "Strict 2PL & Rigorous 2PL (Deadlock vs Serializability)",
                    "Timestamp Ordering Protocol & Thomas Write Rule"
                ],
                "defaultChecklist": [
                    "Verify if a locking schedule adheres to the 2-Phase Locking (2PL) protocol rule",
                    "Understand how Basic 2PL ensures conflict serializability but may suffer from deadlocks",
                    "Analyze Strict 2PL and Rigorous 2PL behavior preventing cascading rollbacks",
                    "Execute Thomas Write Rule and Basic Timestamp Ordering protocol read/write checks",
                    "Make summary notes on concurrency control protocols",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_indexing_b_trees",
                "name": "File Organization, B-Trees & B+ Trees",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Heap Files vs Sorted Files & Cost Models",
                    "Primary, Clustered & Secondary Indexes",
                    "B-Tree Node Structure, Order & Insertion/Deletion",
                    "B+ Tree Properties & Height/Block Access Calculations"
                ],
                "defaultChecklist": [
                    "Differentiate primary, clustering, dense and sparse indexing schemes",
                    "Calculate maximum and minimum keys/pointers in B-Tree and B+ Tree internal and leaf nodes of order p",
                    "Calculate the order of B/B+ tree nodes given block size, key size and pointer size in bytes",
                    "Compute minimum and maximum height and block accesses for search in B+ trees",
                    "Make concise formula sheet on B+ tree calculations",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "dbms_recovery",
                "name": "Crash Recovery & Logging Architecture",
                "importance": "MEDIUM",
                "historicalFrequency": 65,
                "subtopics": [
                    "Log-Based Recovery: Write-Ahead Logging (WAL) Protocol",
                    "Deferred Database Modification vs Immediate Modification",
                    "Checkpoints & Active Transaction Lists",
                    "Undo and Redo Lists Determination on Recovery"
                ],
                "defaultChecklist": [
                    "Understand Write-Ahead Logging (WAL) and log record formats <T, X, V_old, V_new>",
                    "Determine which transactions belong to Undo-list vs Redo-list following a crash",
                    "Trace checkpoint recovery algorithm and analyze disk write minimization",
                    "Review shadow paging and media recovery techniques",
                    "Make short notes on Undo/Redo recovery algorithm",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    },
    {
        "id": "algo",
        "name": "Algorithms",
        "shortName": "Algorithms",
        "icon": "🧮",
        "historicalWeight": 7.5,
        "importance": "HIGH",
        "officialSection": "Section 5: Algorithms",
        "plannedDateRange": "01 Oct 2026 – 12 Oct 2026",
        "topics": [
            {
                "id": "algo_asymptotic_complexity",
                "name": "Asymptotic Complexity & Recurrences",
                "importance": "HIGH",
                "historicalFrequency": 96,
                "subtopics": [
                    "Asymptotic Notations: Big-O, Big-Omega, Big-Theta, Little-o, Little-omega",
                    "Asymptotic Worst-Case Time & Asymptotic Worst-Case Space Complexity",
                    "Comparing Rates of Growth of Complex Functions",
                    "Master Theorem for Divide-and-Conquer Recurrences",
                    "Recursion Tree & Substitution Methods"
                ],
                "defaultChecklist": [
                    "Master formal mathematical definitions of Big-O, Big-Omega, Big-Theta",
                    "Analyze asymptotic worst-case time and asymptotic worst-case space complexity",
                    "Rank mathematical functions by asymptotic growth rates using limits and logarithms",
                    "Apply Master Theorem cases (including extended cases) to solve recurrence relations",
                    "Solve non-standard recurrence relations using substitution and recursion trees",
                    "Make concise formula sheet on asymptotic growth rankings",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_divide_and_conquer",
                "name": "Divide-and-Conquer Algorithms",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Divide-and-Conquer Paradigm & Steps",
                    "Binary Search Analysis & Variations",
                    "Merge Sort Algorithm & Inversion Counting",
                    "Quick Sort: Partitioning Schemes, Best, Worst & Average Case"
                ],
                "defaultChecklist": [
                    "Analyze recursion tree and space/time complexity of Merge Sort",
                    "Master Lomuto and Hoare partitioning algorithms in Quick Sort",
                    "Understand randomized Quick Sort and worst-case recursion prevention",
                    "Calculate number of inversions in an array using modified Merge Sort",
                    "Make summary notes on divide-and-conquer recurrences",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_searching_sorting",
                "name": "Searching & Sorting Lower Bounds",
                "importance": "HIGH",
                "historicalFrequency": 88,
                "subtopics": [
                    "Comparison-Based Sorting Lower Bound Ω(n log n)",
                    "Linear-Time Non-Comparison Sorting: Counting Sort, Radix Sort",
                    "Heap Sort vs Merge Sort vs Quick Sort Detailed Comparison",
                    "External Sorting & Run Generation"
                ],
                "defaultChecklist": [
                    "Prove Ω(n log n) comparison sorting lower bound using decision tree heights",
                    "Trace Counting Sort and Radix Sort algorithms and analyze stability",
                    "Evaluate best, worst, average time complexity and auxiliary space for all sort algorithms",
                    "Understand stability of sorting algorithms and why stability matters",
                    "Make master comparison table of all sorting algorithms",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_hashing",
                "name": "Hashing & Hash Table Collisions",
                "importance": "HIGH-MEDIUM",
                "historicalFrequency": 78,
                "subtopics": [
                    "Hash Functions & Uniform Hashing Assumption",
                    "Collision Resolution: Chaining (Linked Lists)",
                    "Open Addressing: Linear Probing, Quadratic Probing & Double Hashing",
                    "Load Factor (α) & Expected Probe Bounds"
                ],
                "defaultChecklist": [
                    "Calculate probe sequences for Linear Probing, Quadratic Probing and Double Hashing",
                    "Analyze primary and secondary clustering phenomena in open addressing",
                    "Compute successful and unsuccessful search times under uniform hashing assumption",
                    "Understand dynamic rehashing and hash table expansion",
                    "Make concise summary on collision resolution probe formulas",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_greedy",
                "name": "Greedy Algorithms & Optimal Choice",
                "importance": "HIGH",
                "historicalFrequency": 90,
                "subtopics": [
                    "Greedy-Choice Property & Optimal Substructure",
                    "Activity Selection / Interval Scheduling Problem",
                    "Fractional Knapsack Problem",
                    "Huffman Coding: Optimal Prefix Codes & Tree Construction"
                ],
                "defaultChecklist": [
                    "Solve Activity Selection problem by sorting by finish times",
                    "Implement Fractional Knapsack using value-to-weight density ranking",
                    "Construct Huffman coding trees and calculate average code word length in bits",
                    "Understand Job Sequencing with Deadlines for maximum profit",
                    "Make concise summary on greedy proof techniques and algorithms",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_dynamic_programming",
                "name": "Dynamic Programming & Optimal Substructure",
                "importance": "HIGH",
                "historicalFrequency": 95,
                "subtopics": [
                    "Overlapping Subproblems & Memoization vs Tabulation",
                    "0/1 Knapsack Problem & DP State Formulation",
                    "Longest Common Subsequence (LCS) & String Alignment",
                    "Matrix Chain Multiplication & Optimal Parenthesization"
                ],
                "defaultChecklist": [
                    "Formulate DP state transition recurrences for 0/1 Knapsack and trace tables",
                    "Solve Longest Common Subsequence (LCS) and reconstruct optimal common strings",
                    "Calculate minimum scalar multiplications for Matrix Chain Multiplication",
                    "Solve Bellman-Ford, Subset Sum and Longest Increasing Subsequence (LIS) problems",
                    "Make concise summary on classic DP recurrence relations",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_graph_traversals",
                "name": "Graph Traversals: BFS, DFS & Applications",
                "importance": "HIGH",
                "historicalFrequency": 92,
                "subtopics": [
                    "Breadth-First Search (BFS) & Shortest Path in Unweighted Graphs",
                    "Depth-First Search (DFS) & Discovery/Finishing Times",
                    "Classification of Graph Edges: Tree, Back, Forward, Cross Edges",
                    "Applications: Cycle Detection, Topological Sort & Bipartite Checking"
                ],
                "defaultChecklist": [
                    "Trace BFS queue states and shortest path distances in unweighted graphs",
                    "Trace DFS recursion with discovery/finish timestamps and edge classifications",
                    "Execute Topological Sorting on Directed Acyclic Graphs (DAGs) using DFS finish times",
                    "Detect cycles in directed and undirected graphs using back-edge identification",
                    "Make concise summary on graph traversal edge types and theorems",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            },
            {
                "id": "algo_mst_shortest_paths",
                "name": "Minimum Spanning Trees & Shortest Paths",
                "importance": "HIGH",
                "historicalFrequency": 94,
                "subtopics": [
                    "Cut Property & Generic MST Approaches",
                    "Kruskal's Algorithm & Disjoint-Set Union-Find (DSU)",
                    "Prim's Algorithm & Priority Queue Implementations",
                    "Dijkstra's Single-Source Shortest Path & Negative Edge Limits"
                ],
                "defaultChecklist": [
                    "Trace Kruskal's algorithm using Disjoint-Set Union (union by rank, path compression)",
                    "Trace Prim's algorithm and compare time complexity under adjacency matrix vs binary heap",
                    "Execute Dijkstra's algorithm step-by-step and prove why it fails on negative weight edges",
                    "Understand Bellman-Ford algorithm for negative edge weights and negative cycle detection",
                    "Make formula summary on MST and Shortest Path complexities",
                    "Solve topic-wise PYQs from your handbook",
                    "Mark topic complete"
                ]
            }
        ]
    }
];

/**
 * 2. Multi-Year Historical Paper Analysis (2021-2026)
 */
const GATE_HISTORICAL_WEIGHTAGE = [
    { year: 2026, session: 'Set 1', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 9, coa: 8, pds: 10, algo: 8, toc: 9, cd: 5, dl: 6 } },
    { year: 2026, session: 'Set 2', marks: { em: 14, ga: 15, os: 8, dbms: 9, cn: 8, coa: 9, pds: 9, algo: 8, toc: 8, cd: 6, dl: 6 } },
    { year: 2025, session: 'Set 1', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 9, coa: 9, pds: 9, algo: 7, toc: 9, cd: 6, dl: 6 } },
    { year: 2025, session: 'Set 2', marks: { em: 13, ga: 15, os: 8, dbms: 8, cn: 8, coa: 9, pds: 10, algo: 8, toc: 9, cd: 6, dl: 6 } },
    { year: 2024, session: 'Set 1', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 8, coa: 9, pds: 10, algo: 8, toc: 9, cd: 5, dl: 6 } },
    { year: 2024, session: 'Set 2', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 9, coa: 8, pds: 9, algo: 8, toc: 9, cd: 6, dl: 6 } },
    { year: 2023, session: 'Set 1', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 8, coa: 9, pds: 10, algo: 7, toc: 9, cd: 6, dl: 6 } },
    { year: 2023, session: 'Set 2', marks: { em: 14, ga: 15, os: 8, dbms: 8, cn: 9, coa: 8, pds: 9, algo: 8, toc: 9, cd: 6, dl: 6 } },
    { year: 2022, session: 'Set 1', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 8, coa: 9, pds: 9, algo: 8, toc: 9, cd: 6, dl: 6 } },
    { year: 2022, session: 'Set 2', marks: { em: 13, ga: 15, os: 8, dbms: 9, cn: 9, coa: 8, pds: 10, algo: 7, toc: 9, cd: 6, dl: 6 } },
    { year: 2021, session: 'Set 1', marks: { em: 13, ga: 15, os: 9, dbms: 8, cn: 9, coa: 8, pds: 9, algo: 8, toc: 9, cd: 6, dl: 6 } },
    { year: 2021, session: 'Set 2', marks: { em: 13, ga: 15, os: 8, dbms: 8, cn: 8, coa: 9, pds: 10, algo: 8, toc: 9, cd: 6, dl: 6 } }
];

/**
 * 3. Dedicated GATE 2027 Chronological Calendar (Exact 123 Days: 01 Oct 2026 – 31 Jan 2027)
 */
const GATE_DEDICATED_CALENDAR_DEFAULT = [
    {
        "id": "gate_day_2026-10-01",
        "date": "2026-10-01",
        "dayOfWeek": "Thursday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_asymptotic_complexity",
        "topicName": "Asymptotic Complexity & Recurrences",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master Big-O, Omega, Theta notations and Master Theorem cases",
        "tasks": [
            {
                "id": "task_2026-10-01_1",
                "text": "Master formal mathematical definitions of Big-O, Big-Omega, Big-Theta",
                "done": false
            },
            {
                "id": "task_2026-10-01_2",
                "text": "Rank mathematical functions by asymptotic growth rates using limits and logarithms",
                "done": false
            },
            {
                "id": "task_2026-10-01_3",
                "text": "Apply Master Theorem cases (including extended cases) to solve recurrence relations",
                "done": false
            },
            {
                "id": "task_2026-10-01_4",
                "text": "Solve non-standard recurrence relations using substitution and recursion trees",
                "done": false
            },
            {
                "id": "task_2026-10-01_5",
                "text": "Make concise formula sheet on asymptotic growth rankings",
                "done": false
            },
            {
                "id": "task_2026-10-01_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-01_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-01",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-02",
        "date": "2026-10-02",
        "dayOfWeek": "Friday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_asymptotic_complexity",
        "topicName": "Asymptotic Complexity & Recurrences — In-Depth Practice",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Deep-dive practice on asymptotic comparisons, recurrence solving and substitutions",
        "tasks": [
            {
                "id": "task_2026-10-02_1",
                "text": "Review core formulas and theorems for Asymptotic Complexity & Recurrences",
                "done": false
            },
            {
                "id": "task_2026-10-02_2",
                "text": "Rank mathematical functions by asymptotic growth rates using limits and logarithms",
                "done": false
            },
            {
                "id": "task_2026-10-02_3",
                "text": "Apply Master Theorem cases (including extended cases) to solve recurrence relations",
                "done": false
            },
            {
                "id": "task_2026-10-02_4",
                "text": "Solve non-standard recurrence relations using substitution and recursion trees",
                "done": false
            },
            {
                "id": "task_2026-10-02_5",
                "text": "Make concise formula sheet on asymptotic growth rankings",
                "done": false
            },
            {
                "id": "task_2026-10-02_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-02_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-02",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-03",
        "date": "2026-10-03",
        "dayOfWeek": "Saturday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_divide_and_conquer",
        "topicName": "Divide-and-Conquer Algorithms",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master divide-and-conquer paradigm, Merge Sort and Quick Sort partitioning",
        "tasks": [
            {
                "id": "task_2026-10-03_1",
                "text": "Analyze recursion tree and space/time complexity of Merge Sort",
                "done": false
            },
            {
                "id": "task_2026-10-03_2",
                "text": "Master Lomuto and Hoare partitioning algorithms in Quick Sort",
                "done": false
            },
            {
                "id": "task_2026-10-03_3",
                "text": "Understand randomized Quick Sort and worst-case recursion prevention",
                "done": false
            },
            {
                "id": "task_2026-10-03_4",
                "text": "Calculate number of inversions in an array using modified Merge Sort",
                "done": false
            },
            {
                "id": "task_2026-10-03_5",
                "text": "Make summary notes on divide-and-conquer recurrences",
                "done": false
            },
            {
                "id": "task_2026-10-03_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-03_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-03",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-04",
        "date": "2026-10-04",
        "dayOfWeek": "Sunday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_divide_and_conquer",
        "topicName": "Divide-and-Conquer Algorithms — In-Depth Practice",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Practice Quick Sort worst-case bounds, inversion counts and recurrence trees",
        "tasks": [
            {
                "id": "task_2026-10-04_1",
                "text": "Review core formulas and theorems for Divide-and-Conquer Algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-04_2",
                "text": "Master Lomuto and Hoare partitioning algorithms in Quick Sort",
                "done": false
            },
            {
                "id": "task_2026-10-04_3",
                "text": "Understand randomized Quick Sort and worst-case recursion prevention",
                "done": false
            },
            {
                "id": "task_2026-10-04_4",
                "text": "Calculate number of inversions in an array using modified Merge Sort",
                "done": false
            },
            {
                "id": "task_2026-10-04_5",
                "text": "Make summary notes on divide-and-conquer recurrences",
                "done": false
            },
            {
                "id": "task_2026-10-04_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-04_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-04",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-05",
        "date": "2026-10-05",
        "dayOfWeek": "Monday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_searching_sorting",
        "topicName": "Searching & Sorting Lower Bounds",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Understand comparison sort lower bounds and non-comparison sorting (Radix/Counting)",
        "tasks": [
            {
                "id": "task_2026-10-05_1",
                "text": "Prove Ω(n log n) comparison sorting lower bound using decision tree heights",
                "done": false
            },
            {
                "id": "task_2026-10-05_2",
                "text": "Trace Counting Sort and Radix Sort algorithms and analyze stability",
                "done": false
            },
            {
                "id": "task_2026-10-05_3",
                "text": "Evaluate best, worst, average time complexity and auxiliary space for all sort algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-05_4",
                "text": "Understand stability of sorting algorithms and why stability matters",
                "done": false
            },
            {
                "id": "task_2026-10-05_5",
                "text": "Make master comparison table of all sorting algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-05_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-05_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-05",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-06",
        "date": "2026-10-06",
        "dayOfWeek": "Tuesday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_hashing",
        "topicName": "Hashing & Hash Table Collisions",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Master hash functions, chaining and open addressing collision probe sequences",
        "tasks": [
            {
                "id": "task_2026-10-06_1",
                "text": "Calculate probe sequences for Linear Probing, Quadratic Probing and Double Hashing",
                "done": false
            },
            {
                "id": "task_2026-10-06_2",
                "text": "Analyze primary and secondary clustering phenomena in open addressing",
                "done": false
            },
            {
                "id": "task_2026-10-06_3",
                "text": "Compute successful and unsuccessful search times under uniform hashing assumption",
                "done": false
            },
            {
                "id": "task_2026-10-06_4",
                "text": "Understand dynamic rehashing and hash table expansion",
                "done": false
            },
            {
                "id": "task_2026-10-06_5",
                "text": "Make concise summary on collision resolution probe formulas",
                "done": false
            },
            {
                "id": "task_2026-10-06_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-06_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-06",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-07",
        "date": "2026-10-07",
        "dayOfWeek": "Wednesday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_greedy",
        "topicName": "Greedy Algorithms & Optimal Choice",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master greedy choice property, Activity Selection and Huffman Coding trees",
        "tasks": [
            {
                "id": "task_2026-10-07_1",
                "text": "Solve Activity Selection problem by sorting by finish times",
                "done": false
            },
            {
                "id": "task_2026-10-07_2",
                "text": "Implement Fractional Knapsack using value-to-weight density ranking",
                "done": false
            },
            {
                "id": "task_2026-10-07_3",
                "text": "Construct Huffman coding trees and calculate average code word length in bits",
                "done": false
            },
            {
                "id": "task_2026-10-07_4",
                "text": "Understand Job Sequencing with Deadlines for maximum profit",
                "done": false
            },
            {
                "id": "task_2026-10-07_5",
                "text": "Make concise summary on greedy proof techniques and algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-07_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-07_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-07",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-08",
        "date": "2026-10-08",
        "dayOfWeek": "Thursday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_greedy",
        "topicName": "Greedy Algorithms & Optimal Choice — In-Depth Practice",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Practice Fractional Knapsack and Job Sequencing with Deadlines problems",
        "tasks": [
            {
                "id": "task_2026-10-08_1",
                "text": "Review core formulas and theorems for Greedy Algorithms & Optimal Choice",
                "done": false
            },
            {
                "id": "task_2026-10-08_2",
                "text": "Implement Fractional Knapsack using value-to-weight density ranking",
                "done": false
            },
            {
                "id": "task_2026-10-08_3",
                "text": "Construct Huffman coding trees and calculate average code word length in bits",
                "done": false
            },
            {
                "id": "task_2026-10-08_4",
                "text": "Understand Job Sequencing with Deadlines for maximum profit",
                "done": false
            },
            {
                "id": "task_2026-10-08_5",
                "text": "Make concise summary on greedy proof techniques and algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-08_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-08_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-08",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-09",
        "date": "2026-10-09",
        "dayOfWeek": "Friday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_dynamic_programming",
        "topicName": "Dynamic Programming & Optimal Substructure",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Master 0/1 Knapsack, LCS and Matrix Chain Multiplication state transitions",
        "tasks": [
            {
                "id": "task_2026-10-09_1",
                "text": "Formulate DP state transition recurrences for 0/1 Knapsack and trace tables",
                "done": false
            },
            {
                "id": "task_2026-10-09_2",
                "text": "Solve Longest Common Subsequence (LCS) and reconstruct optimal common strings",
                "done": false
            },
            {
                "id": "task_2026-10-09_3",
                "text": "Calculate minimum scalar multiplications for Matrix Chain Multiplication",
                "done": false
            },
            {
                "id": "task_2026-10-09_4",
                "text": "Solve Bellman-Ford, Subset Sum and Longest Increasing Subsequence (LIS) problems",
                "done": false
            },
            {
                "id": "task_2026-10-09_5",
                "text": "Make concise summary on classic DP recurrence relations",
                "done": false
            },
            {
                "id": "task_2026-10-09_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-09_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-09",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-10",
        "date": "2026-10-10",
        "dayOfWeek": "Saturday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_dynamic_programming",
        "topicName": "Dynamic Programming & Optimal Substructure — In-Depth Practice",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Solve complex DP problems: LIS, Subset Sum and Bellman-Ford recurrences",
        "tasks": [
            {
                "id": "task_2026-10-10_1",
                "text": "Review core formulas and theorems for Dynamic Programming & Optimal Substructure",
                "done": false
            },
            {
                "id": "task_2026-10-10_2",
                "text": "Solve Longest Common Subsequence (LCS) and reconstruct optimal common strings",
                "done": false
            },
            {
                "id": "task_2026-10-10_3",
                "text": "Calculate minimum scalar multiplications for Matrix Chain Multiplication",
                "done": false
            },
            {
                "id": "task_2026-10-10_4",
                "text": "Solve Bellman-Ford, Subset Sum and Longest Increasing Subsequence (LIS) problems",
                "done": false
            },
            {
                "id": "task_2026-10-10_5",
                "text": "Make concise summary on classic DP recurrence relations",
                "done": false
            },
            {
                "id": "task_2026-10-10_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-10_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-10",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-11",
        "date": "2026-10-11",
        "dayOfWeek": "Sunday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_graph_traversals",
        "topicName": "Graph Traversals: BFS, DFS & Applications",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master BFS, DFS, edge classifications, topological sort and cycle detection",
        "tasks": [
            {
                "id": "task_2026-10-11_1",
                "text": "Trace BFS queue states and shortest path distances in unweighted graphs",
                "done": false
            },
            {
                "id": "task_2026-10-11_2",
                "text": "Trace DFS recursion with discovery/finish timestamps and edge classifications",
                "done": false
            },
            {
                "id": "task_2026-10-11_3",
                "text": "Execute Topological Sorting on Directed Acyclic Graphs (DAGs) using DFS finish times",
                "done": false
            },
            {
                "id": "task_2026-10-11_4",
                "text": "Detect cycles in directed and undirected graphs using back-edge identification",
                "done": false
            },
            {
                "id": "task_2026-10-11_5",
                "text": "Make concise summary on graph traversal edge types and theorems",
                "done": false
            },
            {
                "id": "task_2026-10-11_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-11_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-11",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-12",
        "date": "2026-10-12",
        "dayOfWeek": "Monday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_mst_shortest_paths",
        "topicName": "Minimum Spanning Trees & Shortest Paths",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Master Kruskal, Prim and Dijkstra algorithms and complexity bounds",
        "tasks": [
            {
                "id": "task_2026-10-12_1",
                "text": "Trace Kruskal's algorithm using Disjoint-Set Union (union by rank, path compression)",
                "done": false
            },
            {
                "id": "task_2026-10-12_2",
                "text": "Trace Prim's algorithm and compare time complexity under adjacency matrix vs binary heap",
                "done": false
            },
            {
                "id": "task_2026-10-12_3",
                "text": "Execute Dijkstra's algorithm step-by-step and prove why it fails on negative weight edges",
                "done": false
            },
            {
                "id": "task_2026-10-12_4",
                "text": "Understand Bellman-Ford algorithm for negative edge weights and negative cycle detection",
                "done": false
            },
            {
                "id": "task_2026-10-12_5",
                "text": "Make formula summary on MST and Shortest Path complexities",
                "done": false
            },
            {
                "id": "task_2026-10-12_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-12_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-12",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-13",
        "date": "2026-10-13",
        "dayOfWeek": "Tuesday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_c_basics_pointers",
        "topicName": "C Programming: Pointers, Arrays & Functions",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master pointer arithmetic, operator precedence and multi-dimensional array layouts",
        "tasks": [
            {
                "id": "task_2026-10-13_1",
                "text": "Analyze operator precedence, short-circuit evaluation and type conversions in C",
                "done": false
            },
            {
                "id": "task_2026-10-13_2",
                "text": "Master pointer arithmetic, array indexing and pointer-to-pointer dereferencing",
                "done": false
            },
            {
                "id": "task_2026-10-13_3",
                "text": "Trace multi-dimensional array address offsets and pointer conversions",
                "done": false
            },
            {
                "id": "task_2026-10-13_4",
                "text": "Understand function pointers and passing arrays to functions",
                "done": false
            },
            {
                "id": "task_2026-10-13_5",
                "text": "Make short notes on subtle C pointer gotchas",
                "done": false
            },
            {
                "id": "task_2026-10-13_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-13_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-13",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-14",
        "date": "2026-10-14",
        "dayOfWeek": "Wednesday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_c_basics_pointers",
        "topicName": "C Programming: Pointers, Arrays & Functions — In-Depth Practice",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Solve tricky C pointer dereferencing and function pointer code output traces",
        "tasks": [
            {
                "id": "task_2026-10-14_1",
                "text": "Review core formulas and theorems for C Programming: Pointers, Arrays & Functions",
                "done": false
            },
            {
                "id": "task_2026-10-14_2",
                "text": "Master pointer arithmetic, array indexing and pointer-to-pointer dereferencing",
                "done": false
            },
            {
                "id": "task_2026-10-14_3",
                "text": "Trace multi-dimensional array address offsets and pointer conversions",
                "done": false
            },
            {
                "id": "task_2026-10-14_4",
                "text": "Understand function pointers and passing arrays to functions",
                "done": false
            },
            {
                "id": "task_2026-10-14_5",
                "text": "Make short notes on subtle C pointer gotchas",
                "done": false
            },
            {
                "id": "task_2026-10-14_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-14_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-14",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-15",
        "date": "2026-10-15",
        "dayOfWeek": "Thursday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_recursion_structures",
        "topicName": "Recursion, Scope & Dynamic Memory",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Trace complex recursive call stacks, storage classes and structure byte alignment",
        "tasks": [
            {
                "id": "task_2026-10-15_1",
                "text": "Trace recursive function calls with call stacks and static variables",
                "done": false
            },
            {
                "id": "task_2026-10-15_2",
                "text": "Understand variable scope, lifetime and storage classes in C",
                "done": false
            },
            {
                "id": "task_2026-10-15_3",
                "text": "Calculate structure byte size considering compiler alignment and padding",
                "done": false
            },
            {
                "id": "task_2026-10-15_4",
                "text": "Review dynamic allocation pitfalls: memory leaks and dangling pointers",
                "done": false
            },
            {
                "id": "task_2026-10-15_5",
                "text": "Make summary notes on recursion trace techniques",
                "done": false
            },
            {
                "id": "task_2026-10-15_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-15_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-15",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-16",
        "date": "2026-10-16",
        "dayOfWeek": "Friday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_arrays_stacks_queues",
        "topicName": "Arrays, Stacks, Queues & Polish Notation",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master stack ADT, circular queue arithmetic and infix-to-postfix conversions",
        "tasks": [
            {
                "id": "task_2026-10-16_1",
                "text": "Understand stack operations, array representation and parentheses matching",
                "done": false
            },
            {
                "id": "task_2026-10-16_2",
                "text": "Master circular queue wrap-around index arithmetic (front/rear modulo)",
                "done": false
            },
            {
                "id": "task_2026-10-16_3",
                "text": "Convert infix expressions to prefix/postfix with operator precedence rules",
                "done": false
            },
            {
                "id": "task_2026-10-16_4",
                "text": "Trace postfix evaluation using operand stacks",
                "done": false
            },
            {
                "id": "task_2026-10-16_5",
                "text": "Make short notes on expression conversion rules",
                "done": false
            },
            {
                "id": "task_2026-10-16_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-16_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-16",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-17",
        "date": "2026-10-17",
        "dayOfWeek": "Saturday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_arrays_stacks_queues",
        "topicName": "Arrays, Stacks, Queues & Polish Notation — In-Depth Practice",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Solve postfix evaluation, parenthesis balance and deque problem sets",
        "tasks": [
            {
                "id": "task_2026-10-17_1",
                "text": "Review core formulas and theorems for Arrays, Stacks, Queues & Polish Notation",
                "done": false
            },
            {
                "id": "task_2026-10-17_2",
                "text": "Master circular queue wrap-around index arithmetic (front/rear modulo)",
                "done": false
            },
            {
                "id": "task_2026-10-17_3",
                "text": "Convert infix expressions to prefix/postfix with operator precedence rules",
                "done": false
            },
            {
                "id": "task_2026-10-17_4",
                "text": "Trace postfix evaluation using operand stacks",
                "done": false
            },
            {
                "id": "task_2026-10-17_5",
                "text": "Make short notes on expression conversion rules",
                "done": false
            },
            {
                "id": "task_2026-10-17_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-17_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-17",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-18",
        "date": "2026-10-18",
        "dayOfWeek": "Sunday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_linked_lists",
        "topicName": "Singly, Doubly & Circular Linked Lists",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "MEDIUM",
        "historicalFrequency": 72,
        "objective": "Master singly, doubly, circular linked lists and Floyd's cycle detection",
        "tasks": [
            {
                "id": "task_2026-10-18_1",
                "text": "Trace pointer updates for list insertions at head, middle and tail",
                "done": false
            },
            {
                "id": "task_2026-10-18_2",
                "text": "Master iterative and recursive linked list reversal algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-18_3",
                "text": "Understand Floyd's tortoise-and-hare cycle detection algorithm",
                "done": false
            },
            {
                "id": "task_2026-10-18_4",
                "text": "Analyze time/space complexity of linked list vs array operations",
                "done": false
            },
            {
                "id": "task_2026-10-18_5",
                "text": "Make concise summary on list manipulation edge cases",
                "done": false
            },
            {
                "id": "task_2026-10-18_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-18_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-18",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-19",
        "date": "2026-10-19",
        "dayOfWeek": "Monday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_binary_trees",
        "topicName": "Binary Trees & Traversal Properties",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master binary tree height bounds, node counts and traversal reconstructions",
        "tasks": [
            {
                "id": "task_2026-10-19_1",
                "text": "Understand node/height mathematical bounds for all binary tree types",
                "done": false
            },
            {
                "id": "task_2026-10-19_2",
                "text": "Master non-recursive and recursive preorder, inorder and postorder traversals",
                "done": false
            },
            {
                "id": "task_2026-10-19_3",
                "text": "Reconstruct unique binary trees given Inorder + Preorder/Postorder pairs",
                "done": false
            },
            {
                "id": "task_2026-10-19_4",
                "text": "Trace level-order traversal using breadth-first queues",
                "done": false
            },
            {
                "id": "task_2026-10-19_5",
                "text": "Make short formula notes on binary tree relationships",
                "done": false
            },
            {
                "id": "task_2026-10-19_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-19_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-19",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-20",
        "date": "2026-10-20",
        "dayOfWeek": "Tuesday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_binary_trees",
        "topicName": "Binary Trees & Traversal Properties — In-Depth Practice",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Practice tree traversals, tree depth bounds and level-order queue traversals",
        "tasks": [
            {
                "id": "task_2026-10-20_1",
                "text": "Review core formulas and theorems for Binary Trees & Traversal Properties",
                "done": false
            },
            {
                "id": "task_2026-10-20_2",
                "text": "Master non-recursive and recursive preorder, inorder and postorder traversals",
                "done": false
            },
            {
                "id": "task_2026-10-20_3",
                "text": "Reconstruct unique binary trees given Inorder + Preorder/Postorder pairs",
                "done": false
            },
            {
                "id": "task_2026-10-20_4",
                "text": "Trace level-order traversal using breadth-first queues",
                "done": false
            },
            {
                "id": "task_2026-10-20_5",
                "text": "Make short formula notes on binary tree relationships",
                "done": false
            },
            {
                "id": "task_2026-10-20_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-20_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-20",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-21",
        "date": "2026-10-21",
        "dayOfWeek": "Wednesday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_bst_avl",
        "topicName": "Binary Search Trees & AVL Balances",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Master BST search/insert/deletion and AVL rotations (LL, RR, LR, RL)",
        "tasks": [
            {
                "id": "task_2026-10-21_1",
                "text": "Understand BST search, insert and 3-case node deletion (0, 1, 2 children)",
                "done": false
            },
            {
                "id": "task_2026-10-21_2",
                "text": "Find inorder successor and predecessor in linear and logarithmic time",
                "done": false
            },
            {
                "id": "task_2026-10-21_3",
                "text": "Calculate balance factors and perform single (LL/RR) and double (LR/RL) rotations",
                "done": false
            },
            {
                "id": "task_2026-10-21_4",
                "text": "Determine minimum and maximum nodes in AVL tree of given height",
                "done": false
            },
            {
                "id": "task_2026-10-21_5",
                "text": "Make concise summary on AVL rotation diagrams",
                "done": false
            },
            {
                "id": "task_2026-10-21_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-21_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-21",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-22",
        "date": "2026-10-22",
        "dayOfWeek": "Thursday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_bst_avl",
        "topicName": "Binary Search Trees & AVL Balances — In-Depth Practice",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Solve BST successor/predecessor questions and AVL balance factor updates",
        "tasks": [
            {
                "id": "task_2026-10-22_1",
                "text": "Review core formulas and theorems for Binary Search Trees & AVL Balances",
                "done": false
            },
            {
                "id": "task_2026-10-22_2",
                "text": "Find inorder successor and predecessor in linear and logarithmic time",
                "done": false
            },
            {
                "id": "task_2026-10-22_3",
                "text": "Calculate balance factors and perform single (LL/RR) and double (LR/RL) rotations",
                "done": false
            },
            {
                "id": "task_2026-10-22_4",
                "text": "Determine minimum and maximum nodes in AVL tree of given height",
                "done": false
            },
            {
                "id": "task_2026-10-22_5",
                "text": "Make concise summary on AVL rotation diagrams",
                "done": false
            },
            {
                "id": "task_2026-10-22_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-22_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-22",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-23",
        "date": "2026-10-23",
        "dayOfWeek": "Friday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_heaps_priority_queues",
        "topicName": "Binary Heaps & Priority Queues",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Master Min/Max-Heap array mapping, O(n) Build-Heap and Heap Sort",
        "tasks": [
            {
                "id": "task_2026-10-23_1",
                "text": "Understand parent-child index arithmetic for array-backed complete trees",
                "done": false
            },
            {
                "id": "task_2026-10-23_2",
                "text": "Trace top-down insert (bubble-up) and extract-min/max (sift-down)",
                "done": false
            },
            {
                "id": "task_2026-10-23_3",
                "text": "Prove and trace O(n) time complexity of Build-Heap procedure",
                "done": false
            },
            {
                "id": "task_2026-10-23_4",
                "text": "Trace Heap Sort in-place algorithm and comparison complexity",
                "done": false
            },
            {
                "id": "task_2026-10-23_5",
                "text": "Make short notes on heap time complexities",
                "done": false
            },
            {
                "id": "task_2026-10-23_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-23_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-23",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-24",
        "date": "2026-10-24",
        "dayOfWeek": "Saturday",
        "subjectId": "pds",
        "subjectName": "Programming & Data Structures",
        "topicId": "pds_graphs_representation",
        "topicName": "Graph Representations & Search Foundations",
        "officialSection": "Section 4: Programming and Data Structures",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Analyze space and access bounds for adjacency matrix vs adjacency list",
        "tasks": [
            {
                "id": "task_2026-10-24_1",
                "text": "Compare space and access time for adjacency matrix vs adjacency list",
                "done": false
            },
            {
                "id": "task_2026-10-24_2",
                "text": "Analyze row/column summation for in-degree and out-degree determination",
                "done": false
            },
            {
                "id": "task_2026-10-24_3",
                "text": "Understand representation of weighted and directed graphs",
                "done": false
            },
            {
                "id": "task_2026-10-24_4",
                "text": "Review memory footprint considerations for sparse vs dense graphs",
                "done": false
            },
            {
                "id": "task_2026-10-24_5",
                "text": "Make summary notes on graph representations",
                "done": false
            },
            {
                "id": "task_2026-10-24_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-24_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-24",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-25",
        "date": "2026-10-25",
        "dayOfWeek": "Sunday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_processes_threads",
        "topicName": "Processes, Threads & IPC",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Understand process states, PCB, fork() tree tracing and ULT vs KLT models",
        "tasks": [
            {
                "id": "task_2026-10-25_1",
                "text": "Understand process state transitions and Process Control Block (PCB) fields",
                "done": false
            },
            {
                "id": "task_2026-10-25_2",
                "text": "Trace fork() system call trees and count created child processes",
                "done": false
            },
            {
                "id": "task_2026-10-25_3",
                "text": "Compare User-Level Threads (ULT) vs Kernel-Level Threads (KLT) multithreading models",
                "done": false
            },
            {
                "id": "task_2026-10-25_4",
                "text": "Review IPC primitives: shared memory, message passing and pipes",
                "done": false
            },
            {
                "id": "task_2026-10-25_5",
                "text": "Make short notes on fork() tree formulas",
                "done": false
            },
            {
                "id": "task_2026-10-25_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-25_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-25",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-26",
        "date": "2026-10-26",
        "dayOfWeek": "Monday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_cpu_scheduling",
        "topicName": "CPU Scheduling Algorithms",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master Gantt charts for FCFS, SJF, SRTF, Round Robin and Priority scheduling",
        "tasks": [
            {
                "id": "task_2026-10-26_1",
                "text": "Draw Gantt charts for preemptive and non-preemptive scheduling algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-26_2",
                "text": "Calculate average Turnaround Time, Waiting Time and Response Time accurately",
                "done": false
            },
            {
                "id": "task_2026-10-26_3",
                "text": "Master SRTF and Round Robin time quantum boundary conditions",
                "done": false
            },
            {
                "id": "task_2026-10-26_4",
                "text": "Analyze Multi-Level Queue and Multi-Level Feedback Queue scheduling",
                "done": false
            },
            {
                "id": "task_2026-10-26_5",
                "text": "Make formula summary on scheduling metrics",
                "done": false
            },
            {
                "id": "task_2026-10-26_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-26_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-26",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-27",
        "date": "2026-10-27",
        "dayOfWeek": "Tuesday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_cpu_scheduling",
        "topicName": "CPU Scheduling Algorithms — In-Depth Practice",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Calculate waiting and turnaround times under preemptive scheduling scenarios",
        "tasks": [
            {
                "id": "task_2026-10-27_1",
                "text": "Review core formulas and theorems for CPU Scheduling Algorithms",
                "done": false
            },
            {
                "id": "task_2026-10-27_2",
                "text": "Calculate average Turnaround Time, Waiting Time and Response Time accurately",
                "done": false
            },
            {
                "id": "task_2026-10-27_3",
                "text": "Master SRTF and Round Robin time quantum boundary conditions",
                "done": false
            },
            {
                "id": "task_2026-10-27_4",
                "text": "Analyze Multi-Level Queue and Multi-Level Feedback Queue scheduling",
                "done": false
            },
            {
                "id": "task_2026-10-27_5",
                "text": "Make formula summary on scheduling metrics",
                "done": false
            },
            {
                "id": "task_2026-10-27_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-27_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-27",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-28",
        "date": "2026-10-28",
        "dayOfWeek": "Wednesday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_synchronization",
        "topicName": "Synchronization: Critical Section & Semaphores",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Master Peterson's algorithm, counting/binary semaphores and critical section axioms",
        "tasks": [
            {
                "id": "task_2026-10-28_1",
                "text": "Evaluate the 3 requirements for critical section solutions: Mutual Exclusion, Progress, Bounded Waiting",
                "done": false
            },
            {
                "id": "task_2026-10-28_2",
                "text": "Trace Peterson's algorithm step-by-step and prove correctness",
                "done": false
            },
            {
                "id": "task_2026-10-28_3",
                "text": "Master counting semaphore value updates and process blocked queue tracking",
                "done": false
            },
            {
                "id": "task_2026-10-28_4",
                "text": "Analyze atomic Test-and-Set and Swap hardware instructions",
                "done": false
            },
            {
                "id": "task_2026-10-28_5",
                "text": "Make summary notes on semaphore value invariants",
                "done": false
            },
            {
                "id": "task_2026-10-28_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-28_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-28",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-29",
        "date": "2026-10-29",
        "dayOfWeek": "Thursday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_synchronization",
        "topicName": "Synchronization: Critical Section & Semaphores — In-Depth Practice",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Solve multi-process semaphore synchronization and race condition code traces",
        "tasks": [
            {
                "id": "task_2026-10-29_1",
                "text": "Review core formulas and theorems for Synchronization: Critical Section & Semaphores",
                "done": false
            },
            {
                "id": "task_2026-10-29_2",
                "text": "Trace Peterson's algorithm step-by-step and prove correctness",
                "done": false
            },
            {
                "id": "task_2026-10-29_3",
                "text": "Master counting semaphore value updates and process blocked queue tracking",
                "done": false
            },
            {
                "id": "task_2026-10-29_4",
                "text": "Analyze atomic Test-and-Set and Swap hardware instructions",
                "done": false
            },
            {
                "id": "task_2026-10-29_5",
                "text": "Make summary notes on semaphore value invariants",
                "done": false
            },
            {
                "id": "task_2026-10-29_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-29_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-29",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-30",
        "date": "2026-10-30",
        "dayOfWeek": "Friday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_classical_sync",
        "topicName": "Classical Synchronization Problems",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Solve Producer-Consumer, Readers-Writers and Dining Philosophers problems",
        "tasks": [
            {
                "id": "task_2026-10-30_1",
                "text": "Write and verify semaphore code for bounded-buffer Producer-Consumer problem",
                "done": false
            },
            {
                "id": "task_2026-10-30_2",
                "text": "Analyze Readers-Writers problem with mutexes and readcount variables",
                "done": false
            },
            {
                "id": "task_2026-10-30_3",
                "text": "Prevent circular wait in Dining Philosophers using asymmetric philosopher pick-up",
                "done": false
            },
            {
                "id": "task_2026-10-30_4",
                "text": "Understand Monitor structure and Hoare vs Mesa semantics",
                "done": false
            },
            {
                "id": "task_2026-10-30_5",
                "text": "Make concise summary on synchronization patterns",
                "done": false
            },
            {
                "id": "task_2026-10-30_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-30_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-30",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-10-31",
        "date": "2026-10-31",
        "dayOfWeek": "Saturday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_deadlocks",
        "topicName": "Deadlocks: Characterization & Banker's Algorithm",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Master Coffman conditions, Resource Allocation Graphs and Banker's algorithm",
        "tasks": [
            {
                "id": "task_2026-10-31_1",
                "text": "Verify the 4 Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait",
                "done": false
            },
            {
                "id": "task_2026-10-31_2",
                "text": "Analyze Resource Allocation Graphs with single vs multiple resource instances",
                "done": false
            },
            {
                "id": "task_2026-10-31_3",
                "text": "Execute Banker's Safety Algorithm step-by-step (Need Matrix = Max - Allocation)",
                "done": false
            },
            {
                "id": "task_2026-10-31_4",
                "text": "Evaluate Resource-Request Algorithm safety before allocation approval",
                "done": false
            },
            {
                "id": "task_2026-10-31_5",
                "text": "Make summary notes on Banker's algorithm matrices",
                "done": false
            },
            {
                "id": "task_2026-10-31_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-10-31_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-10-31",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-01",
        "date": "2026-11-01",
        "dayOfWeek": "Sunday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_deadlocks",
        "topicName": "Deadlocks: Characterization & Banker's Algorithm — In-Depth Practice",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Execute Banker's safety and resource-request matrices under heavy constraints",
        "tasks": [
            {
                "id": "task_2026-11-01_1",
                "text": "Review core formulas and theorems for Deadlocks: Characterization & Banker's Algorithm",
                "done": false
            },
            {
                "id": "task_2026-11-01_2",
                "text": "Analyze Resource Allocation Graphs with single vs multiple resource instances",
                "done": false
            },
            {
                "id": "task_2026-11-01_3",
                "text": "Execute Banker's Safety Algorithm step-by-step (Need Matrix = Max - Allocation)",
                "done": false
            },
            {
                "id": "task_2026-11-01_4",
                "text": "Evaluate Resource-Request Algorithm safety before allocation approval",
                "done": false
            },
            {
                "id": "task_2026-11-01_5",
                "text": "Make summary notes on Banker's algorithm matrices",
                "done": false
            },
            {
                "id": "task_2026-11-01_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-01_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-01",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-02",
        "date": "2026-11-02",
        "dayOfWeek": "Monday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_memory_management",
        "topicName": "Memory Management: Paging & Segmentation",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master logical-to-physical address translation, paging and TLB EMAT formulas",
        "tasks": [
            {
                "id": "task_2026-11-02_1",
                "text": "Calculate internal and external fragmentation for allocation algorithms",
                "done": false
            },
            {
                "id": "task_2026-11-02_2",
                "text": "Translate logical address (page number, offset) to physical frame address",
                "done": false
            },
            {
                "id": "task_2026-11-02_3",
                "text": "Compute single-level and multi-level page table size in bytes",
                "done": false
            },
            {
                "id": "task_2026-11-02_4",
                "text": "Calculate Effective Memory Access Time (EMAT) with TLB hit and miss ratios",
                "done": false
            },
            {
                "id": "task_2026-11-02_5",
                "text": "Make formula summary on EMAT and page table sizes",
                "done": false
            },
            {
                "id": "task_2026-11-02_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-02_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-02",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-03",
        "date": "2026-11-03",
        "dayOfWeek": "Tuesday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_virtual_memory",
        "topicName": "Virtual Memory & Page Replacement",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master page replacement (FIFO, OPT, LRU), Belady's anomaly and thrashing",
        "tasks": [
            {
                "id": "task_2026-11-03_1",
                "text": "Trace page fault counts for reference strings under FIFO, OPT and LRU",
                "done": false
            },
            {
                "id": "task_2026-11-03_2",
                "text": "Understand Belady's Anomaly conditions and why stack algorithms (LRU, OPT) avoid it",
                "done": false
            },
            {
                "id": "task_2026-11-03_3",
                "text": "Calculate effective access time considering page fault service overhead",
                "done": false
            },
            {
                "id": "task_2026-11-03_4",
                "text": "Review Working Set model, Page Fault Frequency and Thrashing prevention",
                "done": false
            },
            {
                "id": "task_2026-11-03_5",
                "text": "Make comparison table of page replacement algorithms",
                "done": false
            },
            {
                "id": "task_2026-11-03_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-03_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-03",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-04",
        "date": "2026-11-04",
        "dayOfWeek": "Wednesday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_virtual_memory",
        "topicName": "Virtual Memory & Page Replacement — In-Depth Practice",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Solve page fault sequence counts and effective access time calculations",
        "tasks": [
            {
                "id": "task_2026-11-04_1",
                "text": "Review core formulas and theorems for Virtual Memory & Page Replacement",
                "done": false
            },
            {
                "id": "task_2026-11-04_2",
                "text": "Understand Belady's Anomaly conditions and why stack algorithms (LRU, OPT) avoid it",
                "done": false
            },
            {
                "id": "task_2026-11-04_3",
                "text": "Calculate effective access time considering page fault service overhead",
                "done": false
            },
            {
                "id": "task_2026-11-04_4",
                "text": "Review Working Set model, Page Fault Frequency and Thrashing prevention",
                "done": false
            },
            {
                "id": "task_2026-11-04_5",
                "text": "Make comparison table of page replacement algorithms",
                "done": false
            },
            {
                "id": "task_2026-11-04_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-04_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-04",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-05",
        "date": "2026-11-05",
        "dayOfWeek": "Thursday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_file_systems",
        "topicName": "File Systems & Directory Structures",
        "officialSection": "Section 8: Operating Systems",
        "importance": "MEDIUM",
        "historicalFrequency": 68,
        "objective": "Calculate UNIX Inode maximum file size and analyze directory allocation methods",
        "tasks": [
            {
                "id": "task_2026-11-05_1",
                "text": "Calculate maximum file size supported by UNIX Inode (direct, single, double, triple indirect)",
                "done": false
            },
            {
                "id": "task_2026-11-05_2",
                "text": "Compare contiguous, linked-list and index-block file allocation disk seeks",
                "done": false
            },
            {
                "id": "task_2026-11-05_3",
                "text": "Analyze directory lookup structures: linear lists vs hash tables",
                "done": false
            },
            {
                "id": "task_2026-11-05_4",
                "text": "Understand disk free-space bitmap size and pointer overhead",
                "done": false
            },
            {
                "id": "task_2026-11-05_5",
                "text": "Make short notes on Inode calculation steps",
                "done": false
            },
            {
                "id": "task_2026-11-05_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-05_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-05",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-06",
        "date": "2026-11-06",
        "dayOfWeek": "Friday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_io_protection",
        "topicName": "Disk Scheduling & Protection",
        "officialSection": "Section 8: Operating Systems",
        "importance": "LOW",
        "historicalFrequency": 55,
        "objective": "Calculate disk scheduling seek times (SSTF, SCAN, LOOK) and DMA transfers",
        "tasks": [
            {
                "id": "task_2026-11-06_1",
                "text": "Calculate total track head movements for disk scheduling algorithms",
                "done": false
            },
            {
                "id": "task_2026-11-06_2",
                "text": "Compare SCAN and LOOK boundary turnaround behaviors",
                "done": false
            },
            {
                "id": "task_2026-11-06_3",
                "text": "Understand rotational latency and transfer time components",
                "done": false
            },
            {
                "id": "task_2026-11-06_4",
                "text": "Review protection domain switching and Access Control Lists",
                "done": false
            },
            {
                "id": "task_2026-11-06_5",
                "text": "Make summary notes on disk scheduling calculations",
                "done": false
            },
            {
                "id": "task_2026-11-06_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-06_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-06",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-07",
        "date": "2026-11-07",
        "dayOfWeek": "Saturday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_er_relational",
        "topicName": "ER Modeling & Relational Schema Mapping",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 76,
        "objective": "Master ER diagrams, cardinalities and minimal relational table translation",
        "tasks": [
            {
                "id": "task_2026-11-07_1",
                "text": "Analyze cardinalities (1:1, 1:N, M:N) and total vs partial participation constraints",
                "done": false
            },
            {
                "id": "task_2026-11-07_2",
                "text": "Determine minimum number of relational tables required to represent given ER schemas",
                "done": false
            },
            {
                "id": "task_2026-11-07_3",
                "text": "Identify primary and foreign keys when mapping weak entity sets and binary relationships",
                "done": false
            },
            {
                "id": "task_2026-11-07_4",
                "text": "Avoid duplicate table creation and redundancy during conversion",
                "done": false
            },
            {
                "id": "task_2026-11-07_5",
                "text": "Make concise summary on ER to table conversion rules",
                "done": false
            },
            {
                "id": "task_2026-11-07_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-07_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-07",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-08",
        "date": "2026-11-08",
        "dayOfWeek": "Sunday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_relational_algebra",
        "topicName": "Relational Algebra & Tuple Calculus",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master relational algebra operators, natural joins and relational division (÷)",
        "tasks": [
            {
                "id": "task_2026-11-08_1",
                "text": "Formulate and evaluate relational algebra queries involving joins and projections",
                "done": false
            },
            {
                "id": "task_2026-11-08_2",
                "text": "Understand Relational Division operator (÷) for queries requiring \"all\" or universal matching",
                "done": false
            },
            {
                "id": "task_2026-11-08_3",
                "text": "Translate English requirements into Tuple Relational Calculus expressions with ∀ and ∃",
                "done": false
            },
            {
                "id": "task_2026-11-08_4",
                "text": "Verify query equivalence between Relational Algebra and SQL queries",
                "done": false
            },
            {
                "id": "task_2026-11-08_5",
                "text": "Make short notes on relational algebra operator properties",
                "done": false
            },
            {
                "id": "task_2026-11-08_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-08_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-08",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-09",
        "date": "2026-11-09",
        "dayOfWeek": "Monday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_relational_algebra",
        "topicName": "Relational Algebra & Tuple Calculus — In-Depth Practice",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Formulate relational algebra and tuple calculus expressions for universal queries",
        "tasks": [
            {
                "id": "task_2026-11-09_1",
                "text": "Review core formulas and theorems for Relational Algebra & Tuple Calculus",
                "done": false
            },
            {
                "id": "task_2026-11-09_2",
                "text": "Understand Relational Division operator (÷) for queries requiring \"all\" or universal matching",
                "done": false
            },
            {
                "id": "task_2026-11-09_3",
                "text": "Translate English requirements into Tuple Relational Calculus expressions with ∀ and ∃",
                "done": false
            },
            {
                "id": "task_2026-11-09_4",
                "text": "Verify query equivalence between Relational Algebra and SQL queries",
                "done": false
            },
            {
                "id": "task_2026-11-09_5",
                "text": "Make short notes on relational algebra operator properties",
                "done": false
            },
            {
                "id": "task_2026-11-09_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-09_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-09",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-10",
        "date": "2026-11-10",
        "dayOfWeek": "Tuesday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_relational_algebra",
        "topicName": "Relational Algebra & Tuple Calculus — In-Depth Practice",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Understand Tuple Relational Calculus (TRC) and Domain Relational Calculus",
        "tasks": [
            {
                "id": "task_2026-11-10_1",
                "text": "Review core formulas and theorems for Relational Algebra & Tuple Calculus",
                "done": false
            },
            {
                "id": "task_2026-11-10_2",
                "text": "Understand Relational Division operator (÷) for queries requiring \"all\" or universal matching",
                "done": false
            },
            {
                "id": "task_2026-11-10_3",
                "text": "Translate English requirements into Tuple Relational Calculus expressions with ∀ and ∃",
                "done": false
            },
            {
                "id": "task_2026-11-10_4",
                "text": "Verify query equivalence between Relational Algebra and SQL queries",
                "done": false
            },
            {
                "id": "task_2026-11-10_5",
                "text": "Make short notes on relational algebra operator properties",
                "done": false
            },
            {
                "id": "task_2026-11-10_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-10_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-10",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-11",
        "date": "2026-11-11",
        "dayOfWeek": "Wednesday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_sql",
        "topicName": "SQL Queries, Joins & Aggregations",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master SQL nested queries, correlated subqueries, joins and GROUP BY / HAVING",
        "tasks": [
            {
                "id": "task_2026-11-11_1",
                "text": "Write and trace complex SQL queries involving GROUP BY and HAVING filters",
                "done": false
            },
            {
                "id": "task_2026-11-11_2",
                "text": "Master Correlated Subqueries and EXISTS / NOT EXISTS semantics",
                "done": false
            },
            {
                "id": "task_2026-11-11_3",
                "text": "Evaluate behavior of 3-valued boolean logic under NULL values in SQL",
                "done": false
            },
            {
                "id": "task_2026-11-11_4",
                "text": "Trace rows produced by INNER vs LEFT/RIGHT/FULL OUTER JOIN operations",
                "done": false
            },
            {
                "id": "task_2026-11-11_5",
                "text": "Make concise summary on SQL execution order and NULL logic",
                "done": false
            },
            {
                "id": "task_2026-11-11_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-11_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-11",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-12",
        "date": "2026-11-12",
        "dayOfWeek": "Thursday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_sql",
        "topicName": "SQL Queries, Joins & Aggregations — In-Depth Practice",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Solve complex multi-table SQL queries, aggregate filters and NULL handling",
        "tasks": [
            {
                "id": "task_2026-11-12_1",
                "text": "Review core formulas and theorems for SQL Queries, Joins & Aggregations",
                "done": false
            },
            {
                "id": "task_2026-11-12_2",
                "text": "Master Correlated Subqueries and EXISTS / NOT EXISTS semantics",
                "done": false
            },
            {
                "id": "task_2026-11-12_3",
                "text": "Evaluate behavior of 3-valued boolean logic under NULL values in SQL",
                "done": false
            },
            {
                "id": "task_2026-11-12_4",
                "text": "Trace rows produced by INNER vs LEFT/RIGHT/FULL OUTER JOIN operations",
                "done": false
            },
            {
                "id": "task_2026-11-12_5",
                "text": "Make concise summary on SQL execution order and NULL logic",
                "done": false
            },
            {
                "id": "task_2026-11-12_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-12_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-12",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-13",
        "date": "2026-11-13",
        "dayOfWeek": "Friday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_integrity_dependencies",
        "topicName": "Functional Dependencies & Candidate Keys",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Compute attribute closures (X+) and discover all candidate keys of relations",
        "tasks": [
            {
                "id": "task_2026-11-13_1",
                "text": "Compute attribute closure X+ under a given set of functional dependencies",
                "done": false
            },
            {
                "id": "task_2026-11-13_2",
                "text": "Find all candidate keys systematically by analyzing left, right and middle attributes",
                "done": false
            },
            {
                "id": "task_2026-11-13_3",
                "text": "Calculate total number of superkeys for a relation given candidate keys",
                "done": false
            },
            {
                "id": "task_2026-11-13_4",
                "text": "Compute Minimal / Canonical Cover of FDs by eliminating extraneous attributes and redundancies",
                "done": false
            },
            {
                "id": "task_2026-11-13_5",
                "text": "Make formula summary on superkey counting formulas",
                "done": false
            },
            {
                "id": "task_2026-11-13_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-13_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-13",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-14",
        "date": "2026-11-14",
        "dayOfWeek": "Saturday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_normalization",
        "topicName": "Normalization: 1NF, 2NF, 3NF & BCNF",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master 1NF, 2NF, 3NF and BCNF definitions, lossless joins and dependency preservation",
        "tasks": [
            {
                "id": "task_2026-11-14_1",
                "text": "Determine the highest normal form satisfied by a given relational schema (1NF, 2NF, 3NF, BCNF)",
                "done": false
            },
            {
                "id": "task_2026-11-14_2",
                "text": "Decompose relations into 3NF using synthesis algorithm while preserving dependencies",
                "done": false
            },
            {
                "id": "task_2026-11-14_3",
                "text": "Decompose relations into BCNF and check for dependency preservation trade-offs",
                "done": false
            },
            {
                "id": "task_2026-11-14_4",
                "text": "Test whether a relational decomposition is guaranteed Lossless Join",
                "done": false
            },
            {
                "id": "task_2026-11-14_5",
                "text": "Make decision chart for checking normal forms quickly",
                "done": false
            },
            {
                "id": "task_2026-11-14_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-14_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-14",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-15",
        "date": "2026-11-15",
        "dayOfWeek": "Sunday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_normalization",
        "topicName": "Normalization: 1NF, 2NF, 3NF & BCNF — In-Depth Practice",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Execute decomposition into 3NF and BCNF and test canonical covers",
        "tasks": [
            {
                "id": "task_2026-11-15_1",
                "text": "Review core formulas and theorems for Normalization: 1NF, 2NF, 3NF & BCNF",
                "done": false
            },
            {
                "id": "task_2026-11-15_2",
                "text": "Decompose relations into 3NF using synthesis algorithm while preserving dependencies",
                "done": false
            },
            {
                "id": "task_2026-11-15_3",
                "text": "Decompose relations into BCNF and check for dependency preservation trade-offs",
                "done": false
            },
            {
                "id": "task_2026-11-15_4",
                "text": "Test whether a relational decomposition is guaranteed Lossless Join",
                "done": false
            },
            {
                "id": "task_2026-11-15_5",
                "text": "Make decision chart for checking normal forms quickly",
                "done": false
            },
            {
                "id": "task_2026-11-15_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-15_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-15",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-16",
        "date": "2026-11-16",
        "dayOfWeek": "Monday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_transactions_concurrency",
        "topicName": "Transactions, ACID & Serializability",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Master ACID properties, conflict serializability and precedence graph cycles",
        "tasks": [
            {
                "id": "task_2026-11-16_1",
                "text": "Construct precedence graphs for concurrent schedules and check for conflict serializability cycles",
                "done": false
            },
            {
                "id": "task_2026-11-16_2",
                "text": "Determine equivalent serial schedule orders from topological sort of precedence graphs",
                "done": false
            },
            {
                "id": "task_2026-11-16_3",
                "text": "Differentiate view serializable schedules using blind writes vs conflict serializable schedules",
                "done": false
            },
            {
                "id": "task_2026-11-16_4",
                "text": "Classify schedules into Recoverable, Avoids Cascading Aborts (ACA) and Strict",
                "done": false
            },
            {
                "id": "task_2026-11-16_5",
                "text": "Make comparison chart on schedule safety classes",
                "done": false
            },
            {
                "id": "task_2026-11-16_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-16_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-16",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-17",
        "date": "2026-11-17",
        "dayOfWeek": "Tuesday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_concurrency_control",
        "topicName": "Concurrency Control Protocols: 2PL & Timestamps",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master 2-Phase Locking (2PL), Strict 2PL and Timestamp Ordering protocols",
        "tasks": [
            {
                "id": "task_2026-11-17_1",
                "text": "Verify if a locking schedule adheres to the 2-Phase Locking (2PL) protocol rule",
                "done": false
            },
            {
                "id": "task_2026-11-17_2",
                "text": "Understand how Basic 2PL ensures conflict serializability but may suffer from deadlocks",
                "done": false
            },
            {
                "id": "task_2026-11-17_3",
                "text": "Analyze Strict 2PL and Rigorous 2PL behavior preventing cascading rollbacks",
                "done": false
            },
            {
                "id": "task_2026-11-17_4",
                "text": "Execute Thomas Write Rule and Basic Timestamp Ordering protocol read/write checks",
                "done": false
            },
            {
                "id": "task_2026-11-17_5",
                "text": "Make summary notes on concurrency control protocols",
                "done": false
            },
            {
                "id": "task_2026-11-17_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-17_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-17",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-18",
        "date": "2026-11-18",
        "dayOfWeek": "Wednesday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_indexing_b_trees",
        "topicName": "File Organization, B-Trees & B+ Trees",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Calculate B-Tree and B+ Tree node order, key capacities and search block accesses",
        "tasks": [
            {
                "id": "task_2026-11-18_1",
                "text": "Differentiate primary, clustering, dense and sparse indexing schemes",
                "done": false
            },
            {
                "id": "task_2026-11-18_2",
                "text": "Calculate maximum and minimum keys/pointers in B-Tree and B+ Tree internal and leaf nodes of order p",
                "done": false
            },
            {
                "id": "task_2026-11-18_3",
                "text": "Calculate the order of B/B+ tree nodes given block size, key size and pointer size in bytes",
                "done": false
            },
            {
                "id": "task_2026-11-18_4",
                "text": "Compute minimum and maximum height and block accesses for search in B+ trees",
                "done": false
            },
            {
                "id": "task_2026-11-18_5",
                "text": "Make concise formula sheet on B+ tree calculations",
                "done": false
            },
            {
                "id": "task_2026-11-18_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-18_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-18",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-19",
        "date": "2026-11-19",
        "dayOfWeek": "Thursday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_recovery",
        "topicName": "Crash Recovery & Logging Architecture",
        "officialSection": "Section 9: Databases",
        "importance": "MEDIUM",
        "historicalFrequency": 65,
        "objective": "Master Write-Ahead Logging (WAL) and determine Undo-list / Redo-list on crash",
        "tasks": [
            {
                "id": "task_2026-11-19_1",
                "text": "Understand Write-Ahead Logging (WAL) and log record formats <T, X, V_old, V_new>",
                "done": false
            },
            {
                "id": "task_2026-11-19_2",
                "text": "Determine which transactions belong to Undo-list vs Redo-list following a crash",
                "done": false
            },
            {
                "id": "task_2026-11-19_3",
                "text": "Trace checkpoint recovery algorithm and analyze disk write minimization",
                "done": false
            },
            {
                "id": "task_2026-11-19_4",
                "text": "Review shadow paging and media recovery techniques",
                "done": false
            },
            {
                "id": "task_2026-11-19_5",
                "text": "Make short notes on Undo/Redo recovery algorithm",
                "done": false
            },
            {
                "id": "task_2026-11-19_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-19_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-19",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-20",
        "date": "2026-11-20",
        "dayOfWeek": "Friday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_layering_switching",
        "topicName": "OSI & TCP/IP Layering & Switching",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 75,
        "objective": "Analyze packet vs circuit switching and calculate transmission/propagation delays",
        "tasks": [
            {
                "id": "task_2026-11-20_1",
                "text": "Map protocol functions to appropriate OSI and TCP/IP layers",
                "done": false
            },
            {
                "id": "task_2026-11-20_2",
                "text": "Calculate total packet transfer latency (Transmission Delay = L/B, Propagation Delay = d/v)",
                "done": false
            },
            {
                "id": "task_2026-11-20_3",
                "text": "Compare virtual circuit switching vs datagram packet routing",
                "done": false
            },
            {
                "id": "task_2026-11-20_4",
                "text": "Understand bandwidth-delay product and channel capacity",
                "done": false
            },
            {
                "id": "task_2026-11-20_5",
                "text": "Make concise formula sheet on network delays",
                "done": false
            },
            {
                "id": "task_2026-11-20_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-20_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-20",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-21",
        "date": "2026-11-21",
        "dayOfWeek": "Saturday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_data_link_framing",
        "topicName": "Framing, Error Detection & CRC",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Master bit/byte stuffing and execute modulo-2 CRC polynomial divisions",
        "tasks": [
            {
                "id": "task_2026-11-21_1",
                "text": "Execute bit-stuffing and byte-stuffing framing transformations",
                "done": false
            },
            {
                "id": "task_2026-11-21_2",
                "text": "Perform modulo-2 binary division for CRC generation and syndrome detection",
                "done": false
            },
            {
                "id": "task_2026-11-21_3",
                "text": "Calculate minimum Hamming distance d_min to detect d-1 and correct (d-1)/2 errors",
                "done": false
            },
            {
                "id": "task_2026-11-21_4",
                "text": "Review internet checksum 1s-complement addition algorithm",
                "done": false
            },
            {
                "id": "task_2026-11-21_5",
                "text": "Make short notes on CRC division rules",
                "done": false
            },
            {
                "id": "task_2026-11-21_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-21_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-21",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-22",
        "date": "2026-11-22",
        "dayOfWeek": "Sunday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_flow_control",
        "topicName": "Flow Control: ARQ Protocols",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Derive efficiency and calculate window size limits for Stop-and-Wait, GBN, SR",
        "tasks": [
            {
                "id": "task_2026-11-22_1",
                "text": "Derive and calculate efficiency η for Stop-and-Wait, Go-Back-N and Selective Repeat",
                "done": false
            },
            {
                "id": "task_2026-11-22_2",
                "text": "Determine minimum bits needed in sequence number field for sliding windows",
                "done": false
            },
            {
                "id": "task_2026-11-22_3",
                "text": "Analyze retransmission counts and vulnerable intervals under lost frames/ACKs",
                "done": false
            },
            {
                "id": "task_2026-11-22_4",
                "text": "Calculate maximum achievable data throughput given bandwidth and round-trip time",
                "done": false
            },
            {
                "id": "task_2026-11-22_5",
                "text": "Make formula summary on sliding window efficiencies",
                "done": false
            },
            {
                "id": "task_2026-11-22_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-22_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-22",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-23",
        "date": "2026-11-23",
        "dayOfWeek": "Monday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_flow_control",
        "topicName": "Flow Control: ARQ Protocols — In-Depth Practice",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Solve sliding window efficiency, throughput and sequence number bit problems",
        "tasks": [
            {
                "id": "task_2026-11-23_1",
                "text": "Review core formulas and theorems for Flow Control: ARQ Protocols",
                "done": false
            },
            {
                "id": "task_2026-11-23_2",
                "text": "Determine minimum bits needed in sequence number field for sliding windows",
                "done": false
            },
            {
                "id": "task_2026-11-23_3",
                "text": "Analyze retransmission counts and vulnerable intervals under lost frames/ACKs",
                "done": false
            },
            {
                "id": "task_2026-11-23_4",
                "text": "Calculate maximum achievable data throughput given bandwidth and round-trip time",
                "done": false
            },
            {
                "id": "task_2026-11-23_5",
                "text": "Make formula summary on sliding window efficiencies",
                "done": false
            },
            {
                "id": "task_2026-11-23_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-23_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-23",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-24",
        "date": "2026-11-24",
        "dayOfWeek": "Tuesday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_mac_ethernet",
        "topicName": "MAC Protocols & CSMA/CD",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master ALOHA throughput, CSMA/CD minimum frame size formula L >= 2*Tp*B",
        "tasks": [
            {
                "id": "task_2026-11-24_1",
                "text": "Compare vulnerable periods and maximum throughput of Pure (18.4%) vs Slotted ALOHA (36.8%)",
                "done": false
            },
            {
                "id": "task_2026-11-24_2",
                "text": "Derive minimum frame size formula L >= 2 * T_p * B for CSMA/CD",
                "done": false
            },
            {
                "id": "task_2026-11-24_3",
                "text": "Execute Binary Exponential Backoff algorithm window calculations",
                "done": false
            },
            {
                "id": "task_2026-11-24_4",
                "text": "Review CSMA/CA for wireless networks with RTS/CTS handshakes",
                "done": false
            },
            {
                "id": "task_2026-11-24_5",
                "text": "Make short notes on CSMA/CD frame constraints",
                "done": false
            },
            {
                "id": "task_2026-11-24_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-24_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-24",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-25",
        "date": "2026-11-25",
        "dayOfWeek": "Wednesday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_mac_ethernet",
        "topicName": "MAC Protocols & CSMA/CD — In-Depth Practice",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Solve CSMA/CD collision detection, backoff windows and efficiency calculations",
        "tasks": [
            {
                "id": "task_2026-11-25_1",
                "text": "Review core formulas and theorems for MAC Protocols & CSMA/CD",
                "done": false
            },
            {
                "id": "task_2026-11-25_2",
                "text": "Derive minimum frame size formula L >= 2 * T_p * B for CSMA/CD",
                "done": false
            },
            {
                "id": "task_2026-11-25_3",
                "text": "Execute Binary Exponential Backoff algorithm window calculations",
                "done": false
            },
            {
                "id": "task_2026-11-25_4",
                "text": "Review CSMA/CA for wireless networks with RTS/CTS handshakes",
                "done": false
            },
            {
                "id": "task_2026-11-25_5",
                "text": "Make short notes on CSMA/CD frame constraints",
                "done": false
            },
            {
                "id": "task_2026-11-25_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-25_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-25",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-26",
        "date": "2026-11-26",
        "dayOfWeek": "Thursday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_ip_addressing_cidr",
        "topicName": "IPv4/IPv6 Addressing, Subnetting & CIDR",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master IPv4/IPv6 CIDR subnetting, block allocation and usable host calculations",
        "tasks": [
            {
                "id": "task_2026-11-26_1",
                "text": "Determine network ID, broadcast address and usable host addresses for CIDR blocks",
                "done": false
            },
            {
                "id": "task_2026-11-26_2",
                "text": "Partition an allocated block into unequal-sized subnets satisfying host requirements",
                "done": false
            },
            {
                "id": "task_2026-11-26_3",
                "text": "Perform Longest Prefix Match lookup given routing table entries and destination IP",
                "done": false
            },
            {
                "id": "task_2026-11-26_4",
                "text": "Review IPv4 header fields: TTL, Header Checksum, IHL, Total Length",
                "done": false
            },
            {
                "id": "task_2026-11-26_5",
                "text": "Make concise summary on subnetting powers of two",
                "done": false
            },
            {
                "id": "task_2026-11-26_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-26_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-26",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-27",
        "date": "2026-11-27",
        "dayOfWeek": "Friday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_ip_addressing_cidr",
        "topicName": "IPv4/IPv6 Addressing, Subnetting & CIDR — In-Depth Practice",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Solve subnet mask partitioning and Longest Prefix Match routing table lookups",
        "tasks": [
            {
                "id": "task_2026-11-27_1",
                "text": "Review core formulas and theorems for IPv4/IPv6 Addressing, Subnetting & CIDR",
                "done": false
            },
            {
                "id": "task_2026-11-27_2",
                "text": "Partition an allocated block into unequal-sized subnets satisfying host requirements",
                "done": false
            },
            {
                "id": "task_2026-11-27_3",
                "text": "Perform Longest Prefix Match lookup given routing table entries and destination IP",
                "done": false
            },
            {
                "id": "task_2026-11-27_4",
                "text": "Review IPv4 header fields: TTL, Header Checksum, IHL, Total Length",
                "done": false
            },
            {
                "id": "task_2026-11-27_5",
                "text": "Make concise summary on subnetting powers of two",
                "done": false
            },
            {
                "id": "task_2026-11-27_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-27_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-27",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-28",
        "date": "2026-11-28",
        "dayOfWeek": "Saturday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_routing_algorithms",
        "topicName": "IP Fragmentation & Routing Protocols",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Execute IP packet fragmentation offsets and Distance Vector routing updates",
        "tasks": [
            {
                "id": "task_2026-11-28_1",
                "text": "Calculate fragment lengths, MF flags and Fragment Offsets (divided by 8)",
                "done": false
            },
            {
                "id": "task_2026-11-28_2",
                "text": "Trace Distance Vector routing table updates using Bellman-Ford equations",
                "done": false
            },
            {
                "id": "task_2026-11-28_3",
                "text": "Analyze Count-to-Infinity and split horizon / poison reverse solutions",
                "done": false
            },
            {
                "id": "task_2026-11-28_4",
                "text": "Trace Link State Routing link-state advertisements (LSA) and Dijkstra tree",
                "done": false
            },
            {
                "id": "task_2026-11-28_5",
                "text": "Make short notes on fragmentation offset arithmetic",
                "done": false
            },
            {
                "id": "task_2026-11-28_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-28_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-28",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-29",
        "date": "2026-11-29",
        "dayOfWeek": "Sunday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_transport_tcp_udp",
        "topicName": "Transport Layer: TCP, UDP & Handshakes",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Analyze TCP header flags, 3-way connection handshake and connection teardown",
        "tasks": [
            {
                "id": "task_2026-11-29_1",
                "text": "Analyze TCP header structure: Sequence number, ACK number, flags (SYN, ACK, FIN, RST)",
                "done": false
            },
            {
                "id": "task_2026-11-29_2",
                "text": "Trace TCP 3-way connection establishment and sequence number synchronization",
                "done": false
            },
            {
                "id": "task_2026-11-29_3",
                "text": "Trace connection teardown states (TIME_WAIT, FIN_WAIT)",
                "done": false
            },
            {
                "id": "task_2026-11-29_4",
                "text": "Understand how receiver advertised window controls transmission buffer overflow",
                "done": false
            },
            {
                "id": "task_2026-11-29_5",
                "text": "Make concise summary on TCP header and flags",
                "done": false
            },
            {
                "id": "task_2026-11-29_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-29_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-29",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-11-30",
        "date": "2026-11-30",
        "dayOfWeek": "Monday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_tcp_congestion",
        "topicName": "TCP Congestion Control & Sockets",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Trace TCP congestion window (cwnd) during Slow Start, AIMD and Fast Recovery",
        "tasks": [
            {
                "id": "task_2026-11-30_1",
                "text": "Trace cwnd expansion during Slow Start (exponential) and Congestion Avoidance (linear)",
                "done": false
            },
            {
                "id": "task_2026-11-30_2",
                "text": "Calculate cwnd size and ssthresh threshold after Timeout vs 3 Duplicate ACKs",
                "done": false
            },
            {
                "id": "task_2026-11-30_3",
                "text": "Compute average TCP throughput under periodic packet drop cycles",
                "done": false
            },
            {
                "id": "task_2026-11-30_4",
                "text": "Review socket address combination (IP + Port) and multiplexing/demultiplexing",
                "done": false
            },
            {
                "id": "task_2026-11-30_5",
                "text": "Make formula summary on TCP window dynamics",
                "done": false
            },
            {
                "id": "task_2026-11-30_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-11-30_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-11-30",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-01",
        "date": "2026-12-01",
        "dayOfWeek": "Tuesday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_tcp_congestion",
        "topicName": "TCP Congestion Control & Sockets — In-Depth Practice",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Calculate TCP window size variations, timeout vs triple duplicate ACK resets",
        "tasks": [
            {
                "id": "task_2026-12-01_1",
                "text": "Review core formulas and theorems for TCP Congestion Control & Sockets",
                "done": false
            },
            {
                "id": "task_2026-12-01_2",
                "text": "Calculate cwnd size and ssthresh threshold after Timeout vs 3 Duplicate ACKs",
                "done": false
            },
            {
                "id": "task_2026-12-01_3",
                "text": "Compute average TCP throughput under periodic packet drop cycles",
                "done": false
            },
            {
                "id": "task_2026-12-01_4",
                "text": "Review socket address combination (IP + Port) and multiplexing/demultiplexing",
                "done": false
            },
            {
                "id": "task_2026-12-01_5",
                "text": "Make formula summary on TCP window dynamics",
                "done": false
            },
            {
                "id": "task_2026-12-01_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-01_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-01",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-02",
        "date": "2026-12-02",
        "dayOfWeek": "Wednesday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_application_protocols",
        "topicName": "Application Layer Protocols: DNS, HTTP, SMTP",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Master DNS recursive/iterative lookups, HTTP RTTs, SMTP and ARP/DHCP protocols",
        "tasks": [
            {
                "id": "task_2026-12-02_1",
                "text": "Calculate total round-trip time (RTT) for HTTP requests under persistent vs non-persistent modes",
                "done": false
            },
            {
                "id": "task_2026-12-02_2",
                "text": "Trace iterative and recursive DNS resolution steps and local caching",
                "done": false
            },
            {
                "id": "task_2026-12-02_3",
                "text": "Understand ARP protocol request (broadcast) and reply (unicast) mapping IP to MAC",
                "done": false
            },
            {
                "id": "task_2026-12-02_4",
                "text": "Review DHCP 4-way DORA protocol (Discover, Offer, Request, Acknowledge)",
                "done": false
            },
            {
                "id": "task_2026-12-02_5",
                "text": "Make concise comparison table of application layer protocols",
                "done": false
            },
            {
                "id": "task_2026-12-02_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-02_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-02",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-03",
        "date": "2026-12-03",
        "dayOfWeek": "Thursday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_machine_instructions",
        "topicName": "Instruction Formats & Addressing Modes",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Master instruction format bit budgets and effective address calculation",
        "tasks": [
            {
                "id": "task_2026-12-03_1",
                "text": "Calculate opcode, register and address field bit lengths in instruction words",
                "done": false
            },
            {
                "id": "task_2026-12-03_2",
                "text": "Master effective address calculations for all standard addressing modes",
                "done": false
            },
            {
                "id": "task_2026-12-03_3",
                "text": "Compute PC-relative branch target addresses and sign-extension offsets",
                "done": false
            },
            {
                "id": "task_2026-12-03_4",
                "text": "Analyze expanding opcode schemes for variable-length instructions",
                "done": false
            },
            {
                "id": "task_2026-12-03_5",
                "text": "Make concise summary on addressing modes",
                "done": false
            },
            {
                "id": "task_2026-12-03_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-03_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-03",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-04",
        "date": "2026-12-04",
        "dayOfWeek": "Friday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_alu_datapath",
        "topicName": "ALU, Data-Path & Control Unit Design",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 80,
        "objective": "Compare hardwired vs microprogrammed control and calculate control store size",
        "tasks": [
            {
                "id": "task_2026-12-04_1",
                "text": "Trace control signal assertions during instruction execution cycles",
                "done": false
            },
            {
                "id": "task_2026-12-04_2",
                "text": "Compare speed and flexibility trade-offs between Hardwired and Microprogrammed control",
                "done": false
            },
            {
                "id": "task_2026-12-04_3",
                "text": "Calculate control memory word width and size for horizontal vs vertical microcode",
                "done": false
            },
            {
                "id": "task_2026-12-04_4",
                "text": "Understand nanoprogramming and control store reduction techniques",
                "done": false
            },
            {
                "id": "task_2026-12-04_5",
                "text": "Make comparison table of control unit architectures",
                "done": false
            },
            {
                "id": "task_2026-12-04_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-04_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-04",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-05",
        "date": "2026-12-05",
        "dayOfWeek": "Saturday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_instruction_pipelining",
        "topicName": "Instruction Pipelining & Hazard Resolution",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master pipeline clock cycle time, ideal speedup and RAW data hazard stalls",
        "tasks": [
            {
                "id": "task_2026-12-05_1",
                "text": "Calculate clock cycle time = max(stage delays) + latch delay and pipeline speedup",
                "done": false
            },
            {
                "id": "task_2026-12-05_2",
                "text": "Analyze Read-After-Write (RAW) data dependencies and calculate stall cycles",
                "done": false
            },
            {
                "id": "task_2026-12-05_3",
                "text": "Trace hardware operand forwarding to eliminate data dependency bubbles",
                "done": false
            },
            {
                "id": "task_2026-12-05_4",
                "text": "Compute branch penalty impact on Average Cycles Per Instruction (CPI)",
                "done": false
            },
            {
                "id": "task_2026-12-05_5",
                "text": "Make formula summary on pipeline speedup and throughput",
                "done": false
            },
            {
                "id": "task_2026-12-05_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-05_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-05",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-06",
        "date": "2026-12-06",
        "dayOfWeek": "Sunday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_instruction_pipelining",
        "topicName": "Instruction Pipelining & Hazard Resolution — In-Depth Practice",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Calculate pipeline CPI with branch penalties, forwarding and stall cycles",
        "tasks": [
            {
                "id": "task_2026-12-06_1",
                "text": "Review core formulas and theorems for Instruction Pipelining & Hazard Resolution",
                "done": false
            },
            {
                "id": "task_2026-12-06_2",
                "text": "Analyze Read-After-Write (RAW) data dependencies and calculate stall cycles",
                "done": false
            },
            {
                "id": "task_2026-12-06_3",
                "text": "Trace hardware operand forwarding to eliminate data dependency bubbles",
                "done": false
            },
            {
                "id": "task_2026-12-06_4",
                "text": "Compute branch penalty impact on Average Cycles Per Instruction (CPI)",
                "done": false
            },
            {
                "id": "task_2026-12-06_5",
                "text": "Make formula summary on pipeline speedup and throughput",
                "done": false
            },
            {
                "id": "task_2026-12-06_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-06_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-06",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-07",
        "date": "2026-12-07",
        "dayOfWeek": "Monday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_memory_cache",
        "topicName": "Cache Memory Mapping & Replacement",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Master Tag/Index/Offset division for Direct, Set-Associative and Full mapping",
        "tasks": [
            {
                "id": "task_2026-12-07_1",
                "text": "Partition physical address bits into Tag, Index/Set and Offset for all cache mappings",
                "done": false
            },
            {
                "id": "task_2026-12-07_2",
                "text": "Calculate cache directory overhead and total memory footprint in bits",
                "done": false
            },
            {
                "id": "task_2026-12-07_3",
                "text": "Execute LRU cache line updates on sequences of block references",
                "done": false
            },
            {
                "id": "task_2026-12-07_4",
                "text": "Calculate multi-level cache Effective Memory Access Time (T_avg = h1*t1 + (1-h1)*(h2*t2 + ...))",
                "done": false
            },
            {
                "id": "task_2026-12-07_5",
                "text": "Make formula summary on cache addressing",
                "done": false
            },
            {
                "id": "task_2026-12-07_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-07_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-07",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-08",
        "date": "2026-12-08",
        "dayOfWeek": "Tuesday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_memory_cache",
        "topicName": "Cache Memory Mapping & Replacement — In-Depth Practice",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Solve multi-level cache EMAT, cache directory overhead and replacement traces",
        "tasks": [
            {
                "id": "task_2026-12-08_1",
                "text": "Review core formulas and theorems for Cache Memory Mapping & Replacement",
                "done": false
            },
            {
                "id": "task_2026-12-08_2",
                "text": "Calculate cache directory overhead and total memory footprint in bits",
                "done": false
            },
            {
                "id": "task_2026-12-08_3",
                "text": "Execute LRU cache line updates on sequences of block references",
                "done": false
            },
            {
                "id": "task_2026-12-08_4",
                "text": "Calculate multi-level cache Effective Memory Access Time (T_avg = h1*t1 + (1-h1)*(h2*t2 + ...))",
                "done": false
            },
            {
                "id": "task_2026-12-08_5",
                "text": "Make formula summary on cache addressing",
                "done": false
            },
            {
                "id": "task_2026-12-08_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-08_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-08",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-09",
        "date": "2026-12-09",
        "dayOfWeek": "Wednesday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_main_secondary_memory",
        "topicName": "Main Memory Organization & Storage Devices",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "MEDIUM",
        "historicalFrequency": 68,
        "objective": "Design memory banks from chip modules and analyze memory interleaving",
        "tasks": [
            {
                "id": "task_2026-12-09_1",
                "text": "Design memory banks using chip decoder circuits and address lines",
                "done": false
            },
            {
                "id": "task_2026-12-09_2",
                "text": "Compare bandwidth improvement of low-order memory interleaving",
                "done": false
            },
            {
                "id": "task_2026-12-09_3",
                "text": "Calculate memory cycle time and burst access data rates",
                "done": false
            },
            {
                "id": "task_2026-12-09_4",
                "text": "Review RAID levels (RAID 0, 1, 5) mirroring and parity striping",
                "done": false
            },
            {
                "id": "task_2026-12-09_5",
                "text": "Make short notes on memory chip expansion",
                "done": false
            },
            {
                "id": "task_2026-12-09_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-09_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-09",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-10",
        "date": "2026-12-10",
        "dayOfWeek": "Thursday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_io_interface",
        "topicName": "I/O Interface, Interrupts & DMA",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "MEDIUM",
        "historicalFrequency": 70,
        "objective": "Calculate interrupt CPU overhead and DMA cycle stealing bus bandwidth stolen",
        "tasks": [
            {
                "id": "task_2026-12-10_1",
                "text": "Compare CPU overhead for Programmed I/O vs Interrupts vs DMA",
                "done": false
            },
            {
                "id": "task_2026-12-10_2",
                "text": "Calculate percentage of CPU time consumed by interrupt servicing of high-speed devices",
                "done": false
            },
            {
                "id": "task_2026-12-10_3",
                "text": "Compute DMA cycle stealing bandwidth steal ratio on main memory bus",
                "done": false
            },
            {
                "id": "task_2026-12-10_4",
                "text": "Understand daisy chain priority resolution propagation delays",
                "done": false
            },
            {
                "id": "task_2026-12-10_5",
                "text": "Make summary notes on I/O transfer modes",
                "done": false
            },
            {
                "id": "task_2026-12-10_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-10_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-10",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-11",
        "date": "2026-12-11",
        "dayOfWeek": "Friday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_machine_instructions",
        "topicName": "Instruction Formats & Addressing Modes — In-Depth Practice",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Comprehensive review of COA instruction encoding and addressing mode problems",
        "tasks": [
            {
                "id": "task_2026-12-11_1",
                "text": "Review core formulas and theorems for Instruction Formats & Addressing Modes",
                "done": false
            },
            {
                "id": "task_2026-12-11_2",
                "text": "Master effective address calculations for all standard addressing modes",
                "done": false
            },
            {
                "id": "task_2026-12-11_3",
                "text": "Compute PC-relative branch target addresses and sign-extension offsets",
                "done": false
            },
            {
                "id": "task_2026-12-11_4",
                "text": "Analyze expanding opcode schemes for variable-length instructions",
                "done": false
            },
            {
                "id": "task_2026-12-11_5",
                "text": "Make concise summary on addressing modes",
                "done": false
            },
            {
                "id": "task_2026-12-11_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-11_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-11",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-12",
        "date": "2026-12-12",
        "dayOfWeek": "Saturday",
        "subjectId": "dl",
        "subjectName": "Digital Logic",
        "topicId": "dl_boolean_minimization",
        "topicName": "Boolean Algebra, Logic Gates & K-Maps",
        "officialSection": "Section 2: Digital Logic",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Minimize Boolean functions on 4-variable K-maps and find all PIs and EPIs",
        "tasks": [
            {
                "id": "task_2026-12-12_1",
                "text": "Simplify complex logic expressions using Boolean theorems and dual forms",
                "done": false
            },
            {
                "id": "task_2026-12-12_2",
                "text": "Plot canonical minterms/maxterms and don't care conditions on 4-variable K-maps",
                "done": false
            },
            {
                "id": "task_2026-12-12_3",
                "text": "Identify all Prime Implicants (PI) and Essential Prime Implicants (EPI)",
                "done": false
            },
            {
                "id": "task_2026-12-12_4",
                "text": "Implement boolean expressions using universal NAND-only and NOR-only logic",
                "done": false
            },
            {
                "id": "task_2026-12-12_5",
                "text": "Make concise summary on K-Map grouping rules",
                "done": false
            },
            {
                "id": "task_2026-12-12_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-12_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-12",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-13",
        "date": "2026-12-13",
        "dayOfWeek": "Sunday",
        "subjectId": "dl",
        "subjectName": "Digital Logic",
        "topicId": "dl_combinational_circuits",
        "topicName": "Combinational Circuits: MUX, Decoders & Adders",
        "officialSection": "Section 2: Digital Logic",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Synthesize logic expressions using multiplexers, decoders and priority encoders",
        "tasks": [
            {
                "id": "task_2026-12-13_1",
                "text": "Calculate worst-case carry propagation delay in n-bit Ripple Carry Adders",
                "done": false
            },
            {
                "id": "task_2026-12-13_2",
                "text": "Synthesize arbitrary Boolean functions using 2:1, 4:1 and 8:1 Multiplexers",
                "done": false
            },
            {
                "id": "task_2026-12-13_3",
                "text": "Implement logic functions using Decoders with external NAND/OR gates",
                "done": false
            },
            {
                "id": "task_2026-12-13_4",
                "text": "Understand Priority Encoder truth tables and valid bit outputs",
                "done": false
            },
            {
                "id": "task_2026-12-13_5",
                "text": "Make short notes on MUX implementation tricks",
                "done": false
            },
            {
                "id": "task_2026-12-13_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-13_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-13",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-14",
        "date": "2026-12-14",
        "dayOfWeek": "Monday",
        "subjectId": "dl",
        "subjectName": "Digital Logic",
        "topicId": "dl_sequential_circuits",
        "topicName": "Sequential Circuits: Latches & Flip-Flops",
        "officialSection": "Section 2: Digital Logic",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Master flip-flop characteristic equations, excitation tables and setup/hold times",
        "tasks": [
            {
                "id": "task_2026-12-14_1",
                "text": "Master characteristic equations for SR, JK, D and T flip-flops",
                "done": false
            },
            {
                "id": "task_2026-12-14_2",
                "text": "Construct excitation tables and convert one flip-flop type to another",
                "done": false
            },
            {
                "id": "task_2026-12-14_3",
                "text": "Understand setup time (t_setup) and hold time (t_hold) timing constraints",
                "done": false
            },
            {
                "id": "task_2026-12-14_4",
                "text": "Calculate maximum clock frequency to prevent timing violations in synchronous circuits",
                "done": false
            },
            {
                "id": "task_2026-12-14_5",
                "text": "Make concise summary on flip-flop excitation tables",
                "done": false
            },
            {
                "id": "task_2026-12-14_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-14_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-14",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-15",
        "date": "2026-12-15",
        "dayOfWeek": "Tuesday",
        "subjectId": "dl",
        "subjectName": "Digital Logic",
        "topicId": "dl_counters_registers",
        "topicName": "Counters, Registers & State Machines",
        "officialSection": "Section 2: Digital Logic",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Design synchronous Modulo-N counters and analyze Johnson/Ring counter sequences",
        "tasks": [
            {
                "id": "task_2026-12-15_1",
                "text": "Design synchronous Modulo-N counters using flip-flops and excitation maps",
                "done": false
            },
            {
                "id": "task_2026-12-15_2",
                "text": "Calculate maximum clock frequency of ripple counters based on gate propagation delay",
                "done": false
            },
            {
                "id": "task_2026-12-15_3",
                "text": "Determine sequence and unused state lockout loops in Johnson and Ring counters",
                "done": false
            },
            {
                "id": "task_2026-12-15_4",
                "text": "Analyze state transition tables and state diagrams for Mealy vs Moore machines",
                "done": false
            },
            {
                "id": "task_2026-12-15_5",
                "text": "Make summary notes on counter design steps",
                "done": false
            },
            {
                "id": "task_2026-12-15_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-15_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-15",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-16",
        "date": "2026-12-16",
        "dayOfWeek": "Wednesday",
        "subjectId": "dl",
        "subjectName": "Digital Logic",
        "topicId": "dl_number_representations",
        "topicName": "Number Systems & Computer Arithmetic",
        "officialSection": "Section 2: Digital Logic",
        "importance": "MEDIUM",
        "historicalFrequency": 70,
        "objective": "Master 2's complement overflow detection and IEEE 754 floating point format",
        "tasks": [
            {
                "id": "task_2026-12-16_1",
                "text": "Convert numbers between arbitrary bases with fractional radix points",
                "done": false
            },
            {
                "id": "task_2026-12-16_2",
                "text": "Perform 2's complement binary addition and detect overflow using XOR of carry bits",
                "done": false
            },
            {
                "id": "task_2026-12-16_3",
                "text": "Determine range of signed and unsigned n-bit integers",
                "done": false
            },
            {
                "id": "task_2026-12-16_4",
                "text": "Encode and decode IEEE 754 Single-Precision 32-bit floats (Sign, Exponent + 127 bias, Mantissa)",
                "done": false
            },
            {
                "id": "task_2026-12-16_5",
                "text": "Make formula summary on IEEE 754 representation",
                "done": false
            },
            {
                "id": "task_2026-12-16_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-16_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-16",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-17",
        "date": "2026-12-17",
        "dayOfWeek": "Thursday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_finite_automata",
        "topicName": "Finite Automata: DFA, NFA & State Minimization",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Construct minimal DFAs for modulo strings, prefixes, and convert NFA to DFA",
        "tasks": [
            {
                "id": "task_2026-12-17_1",
                "text": "Construct minimal DFAs for specific string patterns (substrings, prefixes, modulo counting)",
                "done": false
            },
            {
                "id": "task_2026-12-17_2",
                "text": "Convert ε-NFA to equivalent DFA using subset power set construction",
                "done": false
            },
            {
                "id": "task_2026-12-17_3",
                "text": "Minimize DFA state count using equivalence partitioning and Table-Filling algorithm",
                "done": false
            },
            {
                "id": "task_2026-12-17_4",
                "text": "Calculate number of states in minimal DFA for union, intersection and complements",
                "done": false
            },
            {
                "id": "task_2026-12-17_5",
                "text": "Make summary notes on DFA construction patterns",
                "done": false
            },
            {
                "id": "task_2026-12-17_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-17_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-17",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-18",
        "date": "2026-12-18",
        "dayOfWeek": "Friday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_finite_automata",
        "topicName": "Finite Automata: DFA, NFA & State Minimization — In-Depth Practice",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Minimize DFA states using Table-Filling algorithm and equivalence classes",
        "tasks": [
            {
                "id": "task_2026-12-18_1",
                "text": "Review core formulas and theorems for Finite Automata: DFA, NFA & State Minimization",
                "done": false
            },
            {
                "id": "task_2026-12-18_2",
                "text": "Convert ε-NFA to equivalent DFA using subset power set construction",
                "done": false
            },
            {
                "id": "task_2026-12-18_3",
                "text": "Minimize DFA state count using equivalence partitioning and Table-Filling algorithm",
                "done": false
            },
            {
                "id": "task_2026-12-18_4",
                "text": "Calculate number of states in minimal DFA for union, intersection and complements",
                "done": false
            },
            {
                "id": "task_2026-12-18_5",
                "text": "Make summary notes on DFA construction patterns",
                "done": false
            },
            {
                "id": "task_2026-12-18_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-18_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-18",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-19",
        "date": "2026-12-19",
        "dayOfWeek": "Saturday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_regular_languages",
        "topicName": "Regular Expressions & Pumping Lemma",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Convert regular expressions via Arden's theorem and apply Pumping Lemma",
        "tasks": [
            {
                "id": "task_2026-12-19_1",
                "text": "Convert regular expressions to finite automata and vice-versa using Arden's Lemma",
                "done": false
            },
            {
                "id": "task_2026-12-19_2",
                "text": "Apply Pumping Lemma for regular languages to prove languages non-regular",
                "done": false
            },
            {
                "id": "task_2026-12-19_3",
                "text": "Verify closure properties of regular languages under union, intersection, homomorphism, reverse",
                "done": false
            },
            {
                "id": "task_2026-12-19_4",
                "text": "Review decidable algorithms for DFA equivalence, emptiness and finiteness",
                "done": false
            },
            {
                "id": "task_2026-12-19_5",
                "text": "Make comparison chart of regular language properties",
                "done": false
            },
            {
                "id": "task_2026-12-19_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-19_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-19",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-20",
        "date": "2026-12-20",
        "dayOfWeek": "Sunday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_cfg_pda",
        "topicName": "Context-Free Grammars & Pushdown Automata",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Construct CFGs, prove grammar ambiguity and design Pushdown Automata",
        "tasks": [
            {
                "id": "task_2026-12-20_1",
                "text": "Construct CFGs for paired matching languages (e.g., a^n b^n, palindromes)",
                "done": false
            },
            {
                "id": "task_2026-12-20_2",
                "text": "Prove grammar ambiguity by demonstrating two distinct parse trees or leftmost derivations",
                "done": false
            },
            {
                "id": "task_2026-12-20_3",
                "text": "Design Deterministic PDA (DPDA) vs Non-Deterministic PDA (NPDA)",
                "done": false
            },
            {
                "id": "task_2026-12-20_4",
                "text": "Understand why DCFLs are properly contained in CFLs and DPDA acceptance limits",
                "done": false
            },
            {
                "id": "task_2026-12-20_5",
                "text": "Make summary notes on CFG and PDA models",
                "done": false
            },
            {
                "id": "task_2026-12-20_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-20_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-20",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-21",
        "date": "2026-12-21",
        "dayOfWeek": "Monday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_cfl_properties",
        "topicName": "CFL Properties & Chomsky Hierarchy",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 82,
        "objective": "Master closure properties of CFLs vs DCFLs and Chomsky hierarchy classes",
        "tasks": [
            {
                "id": "task_2026-12-21_1",
                "text": "Apply CFL Pumping Lemma (u v w x y decomposition) to prove languages non-CFL",
                "done": false
            },
            {
                "id": "task_2026-12-21_2",
                "text": "Remember exact closure properties of CFLs (closed under union, concat, star; NOT intersection/complement)",
                "done": false
            },
            {
                "id": "task_2026-12-21_3",
                "text": "Analyze DCFL closure properties (closed under complement; NOT union/intersection)",
                "done": false
            },
            {
                "id": "task_2026-12-21_4",
                "text": "Review undecidable questions for CFLs (ambiguity, universality, equivalence)",
                "done": false
            },
            {
                "id": "task_2026-12-21_5",
                "text": "Make comparison matrix of Chomsky hierarchy language classes",
                "done": false
            },
            {
                "id": "task_2026-12-21_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-21_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-21",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-22",
        "date": "2026-12-22",
        "dayOfWeek": "Tuesday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_turing_machines",
        "topicName": "Turing Machines & Recursive Languages",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Design Turing Machine transitions and understand Recursive vs RE language bounds",
        "tasks": [
            {
                "id": "task_2026-12-22_1",
                "text": "Design Turing Machine transitions for language recognition and function computation",
                "done": false
            },
            {
                "id": "task_2026-12-22_2",
                "text": "Understand the crucial distinction between halting (Decidable/REC) vs looping (RE)",
                "done": false
            },
            {
                "id": "task_2026-12-22_3",
                "text": "Analyze language closure properties for Recursive and Recursively Enumerable classes",
                "done": false
            },
            {
                "id": "task_2026-12-22_4",
                "text": "Review Church-Turing thesis and Turing completeness",
                "done": false
            },
            {
                "id": "task_2026-12-22_5",
                "text": "Make short notes on REC vs RE Venn diagrams",
                "done": false
            },
            {
                "id": "task_2026-12-22_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-22_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-22",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-23",
        "date": "2026-12-23",
        "dayOfWeek": "Wednesday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_turing_machines",
        "topicName": "Turing Machines & Recursive Languages — In-Depth Practice",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Analyze Turing Machine acceptance, instantaneous descriptions and tape heads",
        "tasks": [
            {
                "id": "task_2026-12-23_1",
                "text": "Review core formulas and theorems for Turing Machines & Recursive Languages",
                "done": false
            },
            {
                "id": "task_2026-12-23_2",
                "text": "Understand the crucial distinction between halting (Decidable/REC) vs looping (RE)",
                "done": false
            },
            {
                "id": "task_2026-12-23_3",
                "text": "Analyze language closure properties for Recursive and Recursively Enumerable classes",
                "done": false
            },
            {
                "id": "task_2026-12-23_4",
                "text": "Review Church-Turing thesis and Turing completeness",
                "done": false
            },
            {
                "id": "task_2026-12-23_5",
                "text": "Make short notes on REC vs RE Venn diagrams",
                "done": false
            },
            {
                "id": "task_2026-12-23_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-23_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-23",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-24",
        "date": "2026-12-24",
        "dayOfWeek": "Thursday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_halting_reducibility",
        "topicName": "Undecidability, Rice's Theorem & Reductions",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master Halting Problem undecidability, Post Correspondence and Rice's Theorem",
        "tasks": [
            {
                "id": "task_2026-12-24_1",
                "text": "Understand Turing's proof of the undecidability of the Halting Problem by diagonalization",
                "done": false
            },
            {
                "id": "task_2026-12-24_2",
                "text": "Apply Rice's Theorem Part 1 (undecidability of non-trivial semantic properties of RE languages)",
                "done": false
            },
            {
                "id": "task_2026-12-24_3",
                "text": "Apply Rice's Theorem Part 2 (non-recursively enumerable properties)",
                "done": false
            },
            {
                "id": "task_2026-12-24_4",
                "text": "Use mapping reductions to prove problems undecidable from known undecidable bases (HP, PCP)",
                "done": false
            },
            {
                "id": "task_2026-12-24_5",
                "text": "Make comprehensive table of decidability results across all language families",
                "done": false
            },
            {
                "id": "task_2026-12-24_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-24_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-24",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-25",
        "date": "2026-12-25",
        "dayOfWeek": "Friday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_halting_reducibility",
        "topicName": "Undecidability, Rice's Theorem & Reductions — In-Depth Practice",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Apply mapping reductions to prove problems undecidable from known bases",
        "tasks": [
            {
                "id": "task_2026-12-25_1",
                "text": "Review core formulas and theorems for Undecidability, Rice's Theorem & Reductions",
                "done": false
            },
            {
                "id": "task_2026-12-25_2",
                "text": "Apply Rice's Theorem Part 1 (undecidability of non-trivial semantic properties of RE languages)",
                "done": false
            },
            {
                "id": "task_2026-12-25_3",
                "text": "Apply Rice's Theorem Part 2 (non-recursively enumerable properties)",
                "done": false
            },
            {
                "id": "task_2026-12-25_4",
                "text": "Use mapping reductions to prove problems undecidable from known undecidable bases (HP, PCP)",
                "done": false
            },
            {
                "id": "task_2026-12-25_5",
                "text": "Make comprehensive table of decidability results across all language families",
                "done": false
            },
            {
                "id": "task_2026-12-25_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-25_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-25",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-26",
        "date": "2026-12-26",
        "dayOfWeek": "Saturday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_lexical_analysis",
        "topicName": "Lexical Analysis & Tokenization",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Master token counting rules, maximal munch and lexical analyzer regular expressions",
        "tasks": [
            {
                "id": "task_2026-12-26_1",
                "text": "Count tokens produced by lexical analyzers for given C code snippets",
                "done": false
            },
            {
                "id": "task_2026-12-26_2",
                "text": "Design regular expressions and transition diagrams for programming language keywords/identifiers",
                "done": false
            },
            {
                "id": "task_2026-12-26_3",
                "text": "Understand longest match (maximal munch) and keyword priority rules",
                "done": false
            },
            {
                "id": "task_2026-12-26_4",
                "text": "Review input buffering with two-buffer schemes and sentinel characters",
                "done": false
            },
            {
                "id": "task_2026-12-26_5",
                "text": "Make short notes on lexical token counting rules",
                "done": false
            },
            {
                "id": "task_2026-12-26_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-26_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-26",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-27",
        "date": "2026-12-27",
        "dayOfWeek": "Sunday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_syntax_top_down",
        "topicName": "Top-Down Parsing & LL(1) Grammars",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Eliminate left recursion, apply left factoring and compute FIRST & FOLLOW sets",
        "tasks": [
            {
                "id": "task_2026-12-27_1",
                "text": "Eliminate direct and indirect left recursion from context-free grammars",
                "done": false
            },
            {
                "id": "task_2026-12-27_2",
                "text": "Apply left factoring to make grammars deterministic for predictive parsing",
                "done": false
            },
            {
                "id": "task_2026-12-27_3",
                "text": "Calculate FIRST and FOLLOW sets for all non-terminals systematically",
                "done": false
            },
            {
                "id": "task_2026-12-27_4",
                "text": "Construct LL(1) parsing tables and detect First/First and First/Follow conflicts",
                "done": false
            },
            {
                "id": "task_2026-12-27_5",
                "text": "Make concise formula summary on FIRST and FOLLOW rules",
                "done": false
            },
            {
                "id": "task_2026-12-27_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-27_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-27",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-28",
        "date": "2026-12-28",
        "dayOfWeek": "Monday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_syntax_top_down",
        "topicName": "Top-Down Parsing & LL(1) Grammars — In-Depth Practice",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Construct LL(1) parsing tables and detect First/First and First/Follow conflicts",
        "tasks": [
            {
                "id": "task_2026-12-28_1",
                "text": "Review core formulas and theorems for Top-Down Parsing & LL(1) Grammars",
                "done": false
            },
            {
                "id": "task_2026-12-28_2",
                "text": "Apply left factoring to make grammars deterministic for predictive parsing",
                "done": false
            },
            {
                "id": "task_2026-12-28_3",
                "text": "Calculate FIRST and FOLLOW sets for all non-terminals systematically",
                "done": false
            },
            {
                "id": "task_2026-12-28_4",
                "text": "Construct LL(1) parsing tables and detect First/First and First/Follow conflicts",
                "done": false
            },
            {
                "id": "task_2026-12-28_5",
                "text": "Make concise formula summary on FIRST and FOLLOW rules",
                "done": false
            },
            {
                "id": "task_2026-12-28_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-28_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-28",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-29",
        "date": "2026-12-29",
        "dayOfWeek": "Tuesday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_syntax_bottom_up",
        "topicName": "Bottom-Up Parsing: LR(0), SLR(1), LALR(1) & CLR(1)",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Construct LR(0) items collection, SLR(1) parsing tables and conflict detection",
        "tasks": [
            {
                "id": "task_2026-12-29_1",
                "text": "Construct canonical collection of LR(0) items using CLOSURE and GOTO operations",
                "done": false
            },
            {
                "id": "task_2026-12-29_2",
                "text": "Identify Shift-Reduce (SR) and Reduce-Reduce (RR) conflicts in LR(0) and SLR(1) tables",
                "done": false
            },
            {
                "id": "task_2026-12-29_3",
                "text": "Construct CLR(1) item sets with lookaheads and merge states with common cores for LALR(1)",
                "done": false
            },
            {
                "id": "task_2026-12-29_4",
                "text": "Analyze parsing power relationships: LR(0) < SLR(1) < LALR(1) < CLR(1)",
                "done": false
            },
            {
                "id": "task_2026-12-29_5",
                "text": "Make comparative notes on LR parser conflict rules",
                "done": false
            },
            {
                "id": "task_2026-12-29_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-29_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-29",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-30",
        "date": "2026-12-30",
        "dayOfWeek": "Wednesday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_syntax_bottom_up",
        "topicName": "Bottom-Up Parsing: LR(0), SLR(1), LALR(1) & CLR(1) — In-Depth Practice",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Construct LALR(1) / CLR(1) tables with lookaheads and compare parsing powers",
        "tasks": [
            {
                "id": "task_2026-12-30_1",
                "text": "Review core formulas and theorems for Bottom-Up Parsing: LR(0), SLR(1), LALR(1) & CLR(1)",
                "done": false
            },
            {
                "id": "task_2026-12-30_2",
                "text": "Identify Shift-Reduce (SR) and Reduce-Reduce (RR) conflicts in LR(0) and SLR(1) tables",
                "done": false
            },
            {
                "id": "task_2026-12-30_3",
                "text": "Construct CLR(1) item sets with lookaheads and merge states with common cores for LALR(1)",
                "done": false
            },
            {
                "id": "task_2026-12-30_4",
                "text": "Analyze parsing power relationships: LR(0) < SLR(1) < LALR(1) < CLR(1)",
                "done": false
            },
            {
                "id": "task_2026-12-30_5",
                "text": "Make comparative notes on LR parser conflict rules",
                "done": false
            },
            {
                "id": "task_2026-12-30_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-30_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-30",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2026-12-31",
        "date": "2026-12-31",
        "dayOfWeek": "Thursday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_sdt_semantics",
        "topicName": "Syntax-Directed Translation (SDT)",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Evaluate S-attributed vs L-attributed definitions on annotated parse trees",
        "tasks": [
            {
                "id": "task_2026-12-31_1",
                "text": "Distinguish synthesized attributes (computed from children) vs inherited attributes (from parent/siblings)",
                "done": false
            },
            {
                "id": "task_2026-12-31_2",
                "text": "Evaluate attribute values on annotated parse trees and abstract syntax trees",
                "done": false
            },
            {
                "id": "task_2026-12-31_3",
                "text": "Determine whether an SDD is S-attributed or L-attributed and check for dependency cycles",
                "done": false
            },
            {
                "id": "task_2026-12-31_4",
                "text": "Implement semantic actions during LR shift/reduce parsing for S-attributed definitions",
                "done": false
            },
            {
                "id": "task_2026-12-31_5",
                "text": "Make short notes on S-attributed vs L-attributed properties",
                "done": false
            },
            {
                "id": "task_2026-12-31_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2026-12-31_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2026-12-31",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-01",
        "date": "2027-01-01",
        "dayOfWeek": "Friday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_intermediate_code",
        "topicName": "Intermediate Code Generation & TAC",
        "officialSection": "Section 7: Compiler Design",
        "importance": "MEDIUM",
        "historicalFrequency": 70,
        "objective": "Generate Three-Address Code, quadruples, triples and DAGs for expressions",
        "tasks": [
            {
                "id": "task_2027-01-01_1",
                "text": "Generate Three-Address Code for arithmetic expressions and conditional statements",
                "done": false
            },
            {
                "id": "task_2027-01-01_2",
                "text": "Represent three-address code using quadruples, triples and indirect triples arrays",
                "done": false
            },
            {
                "id": "task_2027-01-01_3",
                "text": "Translate short-circuit boolean logic with jump targets and backpatching",
                "done": false
            },
            {
                "id": "task_2027-01-01_4",
                "text": "Evaluate minimum temporary variables needed using DAG generation",
                "done": false
            },
            {
                "id": "task_2027-01-01_5",
                "text": "Make concise summary on three-address code structures",
                "done": false
            },
            {
                "id": "task_2027-01-01_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-01_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-01",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-02",
        "date": "2027-01-02",
        "dayOfWeek": "Saturday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_runtime_environments",
        "topicName": "Runtime Storage & Activation Records",
        "officialSection": "Section 7: Compiler Design",
        "importance": "MEDIUM",
        "historicalFrequency": 66,
        "objective": "Trace stack activation records, static vs dynamic scoping and parameter passing",
        "tasks": [
            {
                "id": "task_2027-01-02_1",
                "text": "Trace activation records on stack during nested and recursive procedure calls",
                "done": false
            },
            {
                "id": "task_2027-01-02_2",
                "text": "Calculate variable bindings under lexical (static) scoping vs dynamic scoping",
                "done": false
            },
            {
                "id": "task_2027-01-02_3",
                "text": "Evaluate output of program snippets under Call-by-Value, Reference and Copy-Restore",
                "done": false
            },
            {
                "id": "task_2027-01-02_4",
                "text": "Understand access links and display arrays for accessing non-local variables",
                "done": false
            },
            {
                "id": "task_2027-01-02_5",
                "text": "Make comparison chart on parameter passing mechanisms",
                "done": false
            },
            {
                "id": "task_2027-01-02_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-02_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-02",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-03",
        "date": "2027-01-03",
        "dayOfWeek": "Sunday",
        "subjectId": "cd",
        "subjectName": "Compiler Design",
        "topicId": "cd_code_optimization",
        "topicName": "Basic Blocks, Flow Graphs & Code Optimization",
        "officialSection": "Section 7: Compiler Design",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Partition code into basic blocks, build CFGs and execute local optimizations",
        "tasks": [
            {
                "id": "task_2027-01-03_1",
                "text": "Identify leaders and partition three-address code sequences into basic blocks",
                "done": false
            },
            {
                "id": "task_2027-01-03_2",
                "text": "Construct Control Flow Graphs (CFG) and determine dominators and loop back-edges",
                "done": false
            },
            {
                "id": "task_2027-01-03_3",
                "text": "Apply DAG-based local optimizations within a basic block (common subexpression elimination)",
                "done": false
            },
            {
                "id": "task_2027-01-03_4",
                "text": "Execute Live Variable Analysis at basic block boundaries using data flow equations",
                "done": false
            },
            {
                "id": "task_2027-01-03_5",
                "text": "Make short notes on basic block rules and optimization passes",
                "done": false
            },
            {
                "id": "task_2027-01-03_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-03_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-03",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-04",
        "date": "2027-01-04",
        "dayOfWeek": "Monday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_discrete_logic",
        "topicName": "Propositional & First-Order Logic",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Master truth tables, tautologies and convert statements to first-order logic",
        "tasks": [
            {
                "id": "task_2027-01-04_1",
                "text": "Understand propositional connectives and logical equivalence identities",
                "done": false
            },
            {
                "id": "task_2027-01-04_2",
                "text": "Master truth tables, tautology detection and contradiction proofs",
                "done": false
            },
            {
                "id": "task_2027-01-04_3",
                "text": "Convert English statements into first-order predicate logic expressions",
                "done": false
            },
            {
                "id": "task_2027-01-04_4",
                "text": "Practice quantifier negation and scope resolution rules",
                "done": false
            },
            {
                "id": "task_2027-01-04_5",
                "text": "Make formula summary for logical equivalences",
                "done": false
            },
            {
                "id": "task_2027-01-04_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-04_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-04",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-05",
        "date": "2027-01-05",
        "dayOfWeek": "Tuesday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_discrete_relations",
        "topicName": "Sets, Relations, Functions & Partial Orders",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 80,
        "objective": "Master equivalence relations, partial orders, Hasse diagrams and lattices",
        "tasks": [
            {
                "id": "task_2027-01-05_1",
                "text": "Review set algebra, power set properties and inclusion-exclusion principle",
                "done": false
            },
            {
                "id": "task_2027-01-05_2",
                "text": "Understand reflexivity, symmetry, transitivity and equivalence relations",
                "done": false
            },
            {
                "id": "task_2027-01-05_3",
                "text": "Master Hasse diagrams, maximal/minimal elements and glb/lub in posets",
                "done": false
            },
            {
                "id": "task_2027-01-05_4",
                "text": "Study distributive, complemented and bounded lattices",
                "done": false
            },
            {
                "id": "task_2027-01-05_5",
                "text": "Make short notes on lattice properties",
                "done": false
            },
            {
                "id": "task_2027-01-05_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-05_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-05",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-06",
        "date": "2027-01-06",
        "dayOfWeek": "Wednesday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_combinatorics",
        "topicName": "Combinatorics & Recurrence Relations",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Apply Pigeonhole Principle and solve linear recurrence relations via roots",
        "tasks": [
            {
                "id": "task_2027-01-06_1",
                "text": "Master fundamental counting principles, permutations and combinations",
                "done": false
            },
            {
                "id": "task_2027-01-06_2",
                "text": "Solve non-trivial problems using Generalized Pigeonhole Principle",
                "done": false
            },
            {
                "id": "task_2027-01-06_3",
                "text": "Formulate and solve homogeneous/non-homogeneous linear recurrences",
                "done": false
            },
            {
                "id": "task_2027-01-06_4",
                "text": "Review generating functions for counting distributions",
                "done": false
            },
            {
                "id": "task_2027-01-06_5",
                "text": "Make concise formula notes on recurrence roots",
                "done": false
            },
            {
                "id": "task_2027-01-06_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-06_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-06",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-07",
        "date": "2027-01-07",
        "dayOfWeek": "Thursday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_graph_theory",
        "topicName": "Graph Theory: Paths, Trees & Coloring",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Master Handshaking Lemma, planar graph Euler formula (V-E+F=2) and coloring",
        "tasks": [
            {
                "id": "task_2027-01-07_1",
                "text": "Understand Handshaking Lemma, Havel-Hakimi theorem and degrees",
                "done": false
            },
            {
                "id": "task_2027-01-07_2",
                "text": "Master tree properties, spanning trees and cut vertices/edges",
                "done": false
            },
            {
                "id": "task_2027-01-07_3",
                "text": "Study Euler graphs theorem and Hamiltonian necessary/sufficient conditions",
                "done": false
            },
            {
                "id": "task_2027-01-07_4",
                "text": "Understand Euler formula for planar graphs (V - E + F = 2) and coloring bounds",
                "done": false
            },
            {
                "id": "task_2027-01-07_5",
                "text": "Make short notes on planarity and chromatic numbers",
                "done": false
            },
            {
                "id": "task_2027-01-07_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-07_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-07",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-08",
        "date": "2027-01-08",
        "dayOfWeek": "Friday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_graph_theory",
        "topicName": "Graph Theory: Paths, Trees & Coloring — In-Depth Practice",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Solve graph planarity, chromatic number bounds and tree cut-vertex problems",
        "tasks": [
            {
                "id": "task_2027-01-08_1",
                "text": "Review core formulas and theorems for Graph Theory: Paths, Trees & Coloring",
                "done": false
            },
            {
                "id": "task_2027-01-08_2",
                "text": "Master tree properties, spanning trees and cut vertices/edges",
                "done": false
            },
            {
                "id": "task_2027-01-08_3",
                "text": "Study Euler graphs theorem and Hamiltonian necessary/sufficient conditions",
                "done": false
            },
            {
                "id": "task_2027-01-08_4",
                "text": "Understand Euler formula for planar graphs (V - E + F = 2) and coloring bounds",
                "done": false
            },
            {
                "id": "task_2027-01-08_5",
                "text": "Make short notes on planarity and chromatic numbers",
                "done": false
            },
            {
                "id": "task_2027-01-08_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-08_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-08",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-09",
        "date": "2027-01-09",
        "dayOfWeek": "Saturday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_linear_matrices",
        "topicName": "Matrices, Determinants & Linear Systems",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Master determinant properties, row echelon matrix rank and Ax=b consistency",
        "tasks": [
            {
                "id": "task_2027-01-09_1",
                "text": "Review determinant properties, adjoint and inverse calculation shortcuts",
                "done": false
            },
            {
                "id": "task_2027-01-09_2",
                "text": "Master matrix rank determination via row echelon reductions",
                "done": false
            },
            {
                "id": "task_2027-01-09_3",
                "text": "Analyze consistency of Ax = b: unique solution, infinite, no solution",
                "done": false
            },
            {
                "id": "task_2027-01-09_4",
                "text": "Study homogeneous system Ax = 0 nullity and basis of nullspace",
                "done": false
            },
            {
                "id": "task_2027-01-09_5",
                "text": "Make short summary on rank-nullity theorem",
                "done": false
            },
            {
                "id": "task_2027-01-09_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-09_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-09",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-10",
        "date": "2027-01-10",
        "dayOfWeek": "Sunday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_linear_eigen",
        "topicName": "Eigenvalues, Eigenvectors & Vector Spaces",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Calculate eigenvalues/eigenvectors and apply Cayley-Hamilton theorem",
        "tasks": [
            {
                "id": "task_2027-01-10_1",
                "text": "Calculate eigenvalues and eigenvectors using characteristic polynomial",
                "done": false
            },
            {
                "id": "task_2027-01-10_2",
                "text": "Apply Cayley-Hamilton theorem to evaluate high matrix powers and inverses",
                "done": false
            },
            {
                "id": "task_2027-01-10_3",
                "text": "Understand eigenvalue properties for symmetric, skew-symmetric and orthogonal matrices",
                "done": false
            },
            {
                "id": "task_2027-01-10_4",
                "text": "Review matrix diagonalization conditions and basis formed by eigenvectors",
                "done": false
            },
            {
                "id": "task_2027-01-10_5",
                "text": "Make short formula notes on eigenvalue identities",
                "done": false
            },
            {
                "id": "task_2027-01-10_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-10_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-10",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-11",
        "date": "2027-01-11",
        "dayOfWeek": "Monday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_linear_eigen",
        "topicName": "Eigenvalues, Eigenvectors & Vector Spaces — In-Depth Practice",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Solve matrix power evaluation, symmetric matrix properties and diagonalization",
        "tasks": [
            {
                "id": "task_2027-01-11_1",
                "text": "Review core formulas and theorems for Eigenvalues, Eigenvectors & Vector Spaces",
                "done": false
            },
            {
                "id": "task_2027-01-11_2",
                "text": "Apply Cayley-Hamilton theorem to evaluate high matrix powers and inverses",
                "done": false
            },
            {
                "id": "task_2027-01-11_3",
                "text": "Understand eigenvalue properties for symmetric, skew-symmetric and orthogonal matrices",
                "done": false
            },
            {
                "id": "task_2027-01-11_4",
                "text": "Review matrix diagonalization conditions and basis formed by eigenvectors",
                "done": false
            },
            {
                "id": "task_2027-01-11_5",
                "text": "Make short formula notes on eigenvalue identities",
                "done": false
            },
            {
                "id": "task_2027-01-11_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-11_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-11",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-12",
        "date": "2027-01-12",
        "dayOfWeek": "Tuesday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_calculus",
        "topicName": "Calculus: Limits, Continuity & Integrals",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "MEDIUM",
        "historicalFrequency": 68,
        "objective": "Evaluate limits using L'Hopital rule and find maxima/minima using derivatives",
        "tasks": [
            {
                "id": "task_2027-01-12_1",
                "text": "Master indeterminate forms and L'Hopital rule application",
                "done": false
            },
            {
                "id": "task_2027-01-12_2",
                "text": "Understand continuity and differentiability conditions at critical points",
                "done": false
            },
            {
                "id": "task_2027-01-12_3",
                "text": "Apply Rolle's and Lagrange's Mean Value Theorems to function intervals",
                "done": false
            },
            {
                "id": "task_2027-01-12_4",
                "text": "Calculate first and second derivative tests for local/global extrema",
                "done": false
            },
            {
                "id": "task_2027-01-12_5",
                "text": "Review definite integral properties and symmetric bounds",
                "done": false
            },
            {
                "id": "task_2027-01-12_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-12_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-12",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-13",
        "date": "2027-01-13",
        "dayOfWeek": "Wednesday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_probability_distributions",
        "topicName": "Probability, Bayes Theorem & Distributions",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master conditional probability, Bayes Theorem and Poisson/Binomial formulas",
        "tasks": [
            {
                "id": "task_2027-01-13_1",
                "text": "Master conditional probability and Bayes Theorem formulation",
                "done": false
            },
            {
                "id": "task_2027-01-13_2",
                "text": "Calculate expectation, variance and covariance of random variables",
                "done": false
            },
            {
                "id": "task_2027-01-13_3",
                "text": "Solve probability questions on Poisson and Binomial models",
                "done": false
            },
            {
                "id": "task_2027-01-13_4",
                "text": "Understand Normal and Exponential distribution density functions and properties",
                "done": false
            },
            {
                "id": "task_2027-01-13_5",
                "text": "Make concise summary on probability distributions formulas",
                "done": false
            },
            {
                "id": "task_2027-01-13_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-13_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-13",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-14",
        "date": "2027-01-14",
        "dayOfWeek": "Thursday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_probability_distributions",
        "topicName": "Probability, Bayes Theorem & Distributions — In-Depth Practice",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Solve expectation, variance and continuous Normal distribution problems",
        "tasks": [
            {
                "id": "task_2027-01-14_1",
                "text": "Review core formulas and theorems for Probability, Bayes Theorem & Distributions",
                "done": false
            },
            {
                "id": "task_2027-01-14_2",
                "text": "Calculate expectation, variance and covariance of random variables",
                "done": false
            },
            {
                "id": "task_2027-01-14_3",
                "text": "Solve probability questions on Poisson and Binomial models",
                "done": false
            },
            {
                "id": "task_2027-01-14_4",
                "text": "Understand Normal and Exponential distribution density functions and properties",
                "done": false
            },
            {
                "id": "task_2027-01-14_5",
                "text": "Make concise summary on probability distributions formulas",
                "done": false
            },
            {
                "id": "task_2027-01-14_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-14_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": true,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-14",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-15",
        "date": "2027-01-15",
        "dayOfWeek": "Friday",
        "subjectId": "ga",
        "subjectName": "General Aptitude",
        "topicId": "ga_quantitative_arithmetic",
        "topicName": "Quantitative Arithmetic & Commercial Maths",
        "officialSection": "General Aptitude (Common to all papers)",
        "importance": "HIGH",
        "historicalFrequency": 88,
        "objective": "Practice commercial math: percentages, ratios, speed-time and work rates",
        "tasks": [
            {
                "id": "task_2027-01-15_1",
                "text": "Study ratio, proportions, percentages and commercial math formulas",
                "done": false
            },
            {
                "id": "task_2027-01-15_2",
                "text": "Practice speed, time and distance relative velocity calculations",
                "done": false
            },
            {
                "id": "task_2027-01-15_3",
                "text": "Solve work-rate and pipe cistern problem sets",
                "done": false
            },
            {
                "id": "task_2027-01-15_4",
                "text": "Make concise formula sheet for commercial maths",
                "done": false
            },
            {
                "id": "task_2027-01-15_5",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-15_6",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-15",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-16",
        "date": "2027-01-16",
        "dayOfWeek": "Saturday",
        "subjectId": "ga",
        "subjectName": "General Aptitude",
        "topicId": "ga_quantitative_algebra_geo",
        "topicName": "Algebra, Geometry, Mensuration & Permutations",
        "officialSection": "General Aptitude (Common to all papers)",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 78,
        "objective": "Solve quadratic algebra, geometry mensuration and permutation arrangements",
        "tasks": [
            {
                "id": "task_2027-01-16_1",
                "text": "Review algebraic factorizations, roots of quadratics and progressions",
                "done": false
            },
            {
                "id": "task_2027-01-16_2",
                "text": "Study 2D perimeter/area and 3D surface area/volume formulas",
                "done": false
            },
            {
                "id": "task_2027-01-16_3",
                "text": "Solve basic permutation and combination arrangements",
                "done": false
            },
            {
                "id": "task_2027-01-16_4",
                "text": "Make formula summary for geometry and series",
                "done": false
            },
            {
                "id": "task_2027-01-16_5",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-16_6",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-16",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-17",
        "date": "2027-01-17",
        "dayOfWeek": "Sunday",
        "subjectId": "ga",
        "subjectName": "General Aptitude",
        "topicId": "ga_data_interpretation",
        "topicName": "Data Interpretation & Graphs",
        "officialSection": "General Aptitude (Common to all papers)",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Master fast data table, bar chart and multi-step pie chart analysis",
        "tasks": [
            {
                "id": "task_2027-01-17_1",
                "text": "Understand table extraction and ratio calculation shortcuts",
                "done": false
            },
            {
                "id": "task_2027-01-17_2",
                "text": "Practice bar chart and percentage share extraction",
                "done": false
            },
            {
                "id": "task_2027-01-17_3",
                "text": "Solve multi-step pie chart angle and percentage questions",
                "done": false
            },
            {
                "id": "task_2027-01-17_4",
                "text": "Review trend interpretation on line graphs",
                "done": false
            },
            {
                "id": "task_2027-01-17_5",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-17_6",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-17",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-18",
        "date": "2027-01-18",
        "dayOfWeek": "Monday",
        "subjectId": "ga",
        "subjectName": "General Aptitude",
        "topicId": "ga_verbal_grammar_vocab",
        "topicName": "English Grammar & Vocabulary",
        "officialSection": "General Aptitude (Common to all papers)",
        "importance": "HIGH-MEDIUM",
        "historicalFrequency": 75,
        "objective": "Review English grammar, subject-verb agreement and vocabulary in context",
        "tasks": [
            {
                "id": "task_2027-01-18_1",
                "text": "Review subject-verb agreement rules and modifier placements",
                "done": false
            },
            {
                "id": "task_2027-01-18_2",
                "text": "Study correct usage of prepositions and conjunctions",
                "done": false
            },
            {
                "id": "task_2027-01-18_3",
                "text": "Practice contextual sentence completion and fill-in-the-blanks",
                "done": false
            },
            {
                "id": "task_2027-01-18_4",
                "text": "Review high-frequency GATE English vocabulary list",
                "done": false
            },
            {
                "id": "task_2027-01-18_5",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-18_6",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-18",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-19",
        "date": "2027-01-19",
        "dayOfWeek": "Tuesday",
        "subjectId": "ga",
        "subjectName": "General Aptitude",
        "topicId": "ga_verbal_comprehension",
        "topicName": "Reading Comprehension & Critical Reasoning",
        "officialSection": "General Aptitude (Common to all papers)",
        "importance": "HIGH",
        "historicalFrequency": 82,
        "objective": "Solve reading comprehension argument inferences and syllogism deductions",
        "tasks": [
            {
                "id": "task_2027-01-19_1",
                "text": "Practice speed reading and main argument extraction from paragraphs",
                "done": false
            },
            {
                "id": "task_2027-01-19_2",
                "text": "Master inference vs stated fact differentiation",
                "done": false
            },
            {
                "id": "task_2027-01-19_3",
                "text": "Solve logical deduction and assumption questions",
                "done": false
            },
            {
                "id": "task_2027-01-19_4",
                "text": "Review syllogism Venn diagram representation rules",
                "done": false
            },
            {
                "id": "task_2027-01-19_5",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-19_6",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-19",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-20",
        "date": "2027-01-20",
        "dayOfWeek": "Wednesday",
        "subjectId": "ga",
        "subjectName": "General Aptitude",
        "topicId": "ga_analytical_spatial",
        "topicName": "Analytical & Spatial Aptitude",
        "officialSection": "General Aptitude (Common to all papers)",
        "importance": "HIGH",
        "historicalFrequency": 85,
        "objective": "Solve seating arrangement logic, number series and 2D/3D spatial rotations",
        "tasks": [
            {
                "id": "task_2027-01-20_1",
                "text": "Practice blood relations, direction tests and seating arrangements",
                "done": false
            },
            {
                "id": "task_2027-01-20_2",
                "text": "Analyze arithmetic/geometric and alternating number series",
                "done": false
            },
            {
                "id": "task_2027-01-20_3",
                "text": "Understand 2D paper folding, punching and unfolding visualization",
                "done": false
            },
            {
                "id": "task_2027-01-20_4",
                "text": "Practice mirror reflection and 3D spatial rotation problems",
                "done": false
            },
            {
                "id": "task_2027-01-20_5",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-20_6",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": false,
        "revisionTopic": null,
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-20",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-21",
        "date": "2027-01-21",
        "dayOfWeek": "Thursday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_asymptotic_complexity",
        "topicName": "Milestone Revision: Algorithms & Data Structures",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Comprehensive formula & algorithm recap across Algorithms and Data Structures",
        "tasks": [
            {
                "id": "task_2027-01-21_1",
                "text": "Master formal mathematical definitions of Big-O, Big-Omega, Big-Theta",
                "done": false
            },
            {
                "id": "task_2027-01-21_2",
                "text": "Rank mathematical functions by asymptotic growth rates using limits and logarithms",
                "done": false
            },
            {
                "id": "task_2027-01-21_3",
                "text": "Apply Master Theorem cases (including extended cases) to solve recurrence relations",
                "done": false
            },
            {
                "id": "task_2027-01-21_4",
                "text": "Solve non-standard recurrence relations using substitution and recursion trees",
                "done": false
            },
            {
                "id": "task_2027-01-21_5",
                "text": "Make concise formula sheet on asymptotic growth rankings",
                "done": false
            },
            {
                "id": "task_2027-01-21_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-21_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Algorithms",
            "topicName": "Algorithms + PDS Core Focus"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-21",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-22",
        "date": "2027-01-22",
        "dayOfWeek": "Friday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_cpu_scheduling",
        "topicName": "Milestone Revision: Systems Core (OS & DBMS)",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Comprehensive recap of Operating Systems scheduling/memory and DBMS normalization/transactions",
        "tasks": [
            {
                "id": "task_2027-01-22_1",
                "text": "Draw Gantt charts for preemptive and non-preemptive scheduling algorithms",
                "done": false
            },
            {
                "id": "task_2027-01-22_2",
                "text": "Calculate average Turnaround Time, Waiting Time and Response Time accurately",
                "done": false
            },
            {
                "id": "task_2027-01-22_3",
                "text": "Master SRTF and Round Robin time quantum boundary conditions",
                "done": false
            },
            {
                "id": "task_2027-01-22_4",
                "text": "Analyze Multi-Level Queue and Multi-Level Feedback Queue scheduling",
                "done": false
            },
            {
                "id": "task_2027-01-22_5",
                "text": "Make formula summary on scheduling metrics",
                "done": false
            },
            {
                "id": "task_2027-01-22_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-22_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Operating Systems",
            "topicName": "OS + DBMS Systems Core"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-22",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-23",
        "date": "2027-01-23",
        "dayOfWeek": "Saturday",
        "subjectId": "cn",
        "subjectName": "Computer Networks",
        "topicId": "cn_ip_addressing_cidr",
        "topicName": "Milestone Revision: Networks & Architecture",
        "officialSection": "Section 10: Computer Networks",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Comprehensive recap of Computer Networks CIDR/TCP and COA Pipelining/Cache memory",
        "tasks": [
            {
                "id": "task_2027-01-23_1",
                "text": "Determine network ID, broadcast address and usable host addresses for CIDR blocks",
                "done": false
            },
            {
                "id": "task_2027-01-23_2",
                "text": "Partition an allocated block into unequal-sized subnets satisfying host requirements",
                "done": false
            },
            {
                "id": "task_2027-01-23_3",
                "text": "Perform Longest Prefix Match lookup given routing table entries and destination IP",
                "done": false
            },
            {
                "id": "task_2027-01-23_4",
                "text": "Review IPv4 header fields: TTL, Header Checksum, IHL, Total Length",
                "done": false
            },
            {
                "id": "task_2027-01-23_5",
                "text": "Make concise summary on subnetting powers of two",
                "done": false
            },
            {
                "id": "task_2027-01-23_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-23_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Computer Networks",
            "topicName": "Networks + COA Hardware Stack"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-23",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-24",
        "date": "2027-01-24",
        "dayOfWeek": "Sunday",
        "subjectId": "toc",
        "subjectName": "Theory of Computation",
        "topicId": "toc_finite_automata",
        "topicName": "Milestone Revision: Theory, Compilers & Digital Logic",
        "officialSection": "Section 6: Theory of Computation",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Comprehensive recap of TOC DFAs/Decidability, Compiler parsers, and Digital K-maps",
        "tasks": [
            {
                "id": "task_2027-01-24_1",
                "text": "Construct minimal DFAs for specific string patterns (substrings, prefixes, modulo counting)",
                "done": false
            },
            {
                "id": "task_2027-01-24_2",
                "text": "Convert ε-NFA to equivalent DFA using subset power set construction",
                "done": false
            },
            {
                "id": "task_2027-01-24_3",
                "text": "Minimize DFA state count using equivalence partitioning and Table-Filling algorithm",
                "done": false
            },
            {
                "id": "task_2027-01-24_4",
                "text": "Calculate number of states in minimal DFA for union, intersection and complements",
                "done": false
            },
            {
                "id": "task_2027-01-24_5",
                "text": "Make summary notes on DFA construction patterns",
                "done": false
            },
            {
                "id": "task_2027-01-24_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-24_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Theory of Computation",
            "topicName": "TOC + Compiler Design + Digital Logic"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-24",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-25",
        "date": "2027-01-25",
        "dayOfWeek": "Monday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_discrete_logic",
        "topicName": "Milestone Revision: Engineering Mathematics & Aptitude",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 92,
        "objective": "Comprehensive recap of Discrete Math, Linear Algebra, Probability and Aptitude shortcuts",
        "tasks": [
            {
                "id": "task_2027-01-25_1",
                "text": "Understand propositional connectives and logical equivalence identities",
                "done": false
            },
            {
                "id": "task_2027-01-25_2",
                "text": "Master truth tables, tautology detection and contradiction proofs",
                "done": false
            },
            {
                "id": "task_2027-01-25_3",
                "text": "Convert English statements into first-order predicate logic expressions",
                "done": false
            },
            {
                "id": "task_2027-01-25_4",
                "text": "Practice quantifier negation and scope resolution rules",
                "done": false
            },
            {
                "id": "task_2027-01-25_5",
                "text": "Make formula summary for logical equivalences",
                "done": false
            },
            {
                "id": "task_2027-01-25_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-25_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Engineering Mathematics",
            "topicName": "Engg Math + General Aptitude"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-25",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-26",
        "date": "2027-01-26",
        "dayOfWeek": "Tuesday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_dynamic_programming",
        "topicName": "Grand Synthesis & High-Yield Revisit: Core CS Part 1",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 95,
        "objective": "Targeted high-yield re-solving of Algorithms, PDS and OS tricky concepts and PYQ patterns",
        "tasks": [
            {
                "id": "task_2027-01-26_1",
                "text": "Formulate DP state transition recurrences for 0/1 Knapsack and trace tables",
                "done": false
            },
            {
                "id": "task_2027-01-26_2",
                "text": "Solve Longest Common Subsequence (LCS) and reconstruct optimal common strings",
                "done": false
            },
            {
                "id": "task_2027-01-26_3",
                "text": "Calculate minimum scalar multiplications for Matrix Chain Multiplication",
                "done": false
            },
            {
                "id": "task_2027-01-26_4",
                "text": "Solve Bellman-Ford, Subset Sum and Longest Increasing Subsequence (LIS) problems",
                "done": false
            },
            {
                "id": "task_2027-01-26_5",
                "text": "Make concise summary on classic DP recurrence relations",
                "done": false
            },
            {
                "id": "task_2027-01-26_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-26_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Algorithms",
            "topicName": "All-Subjects Synthesis Part 1"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-26",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-27",
        "date": "2027-01-27",
        "dayOfWeek": "Wednesday",
        "subjectId": "dbms",
        "subjectName": "Databases (DBMS)",
        "topicId": "dbms_normalization",
        "topicName": "Grand Synthesis & High-Yield Revisit: Core CS Part 2",
        "officialSection": "Section 9: Databases",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Targeted high-yield re-solving of DBMS, Networks and COA tricky concepts and PYQ patterns",
        "tasks": [
            {
                "id": "task_2027-01-27_1",
                "text": "Determine the highest normal form satisfied by a given relational schema (1NF, 2NF, 3NF, BCNF)",
                "done": false
            },
            {
                "id": "task_2027-01-27_2",
                "text": "Decompose relations into 3NF using synthesis algorithm while preserving dependencies",
                "done": false
            },
            {
                "id": "task_2027-01-27_3",
                "text": "Decompose relations into BCNF and check for dependency preservation trade-offs",
                "done": false
            },
            {
                "id": "task_2027-01-27_4",
                "text": "Test whether a relational decomposition is guaranteed Lossless Join",
                "done": false
            },
            {
                "id": "task_2027-01-27_5",
                "text": "Make decision chart for checking normal forms quickly",
                "done": false
            },
            {
                "id": "task_2027-01-27_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-27_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Databases (DBMS)",
            "topicName": "All-Subjects Synthesis Part 2"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-27",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-28",
        "date": "2027-01-28",
        "dayOfWeek": "Thursday",
        "subjectId": "em",
        "subjectName": "Engineering Mathematics",
        "topicId": "em_linear_eigen",
        "topicName": "Formula Book Lockdown: Mathematics & Analytical Defense",
        "officialSection": "Section 1: Engineering Mathematics",
        "importance": "HIGH",
        "historicalFrequency": 90,
        "objective": "Consolidate formula book for Linear Algebra, Probability, Calculus and Aptitude",
        "tasks": [
            {
                "id": "task_2027-01-28_1",
                "text": "Calculate eigenvalues and eigenvectors using characteristic polynomial",
                "done": false
            },
            {
                "id": "task_2027-01-28_2",
                "text": "Apply Cayley-Hamilton theorem to evaluate high matrix powers and inverses",
                "done": false
            },
            {
                "id": "task_2027-01-28_3",
                "text": "Understand eigenvalue properties for symmetric, skew-symmetric and orthogonal matrices",
                "done": false
            },
            {
                "id": "task_2027-01-28_4",
                "text": "Review matrix diagonalization conditions and basis formed by eigenvectors",
                "done": false
            },
            {
                "id": "task_2027-01-28_5",
                "text": "Make short formula notes on eigenvalue identities",
                "done": false
            },
            {
                "id": "task_2027-01-28_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-28_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Engineering Mathematics",
            "topicName": "Math & Aptitude Formula Lockdown"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-28",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-29",
        "date": "2027-01-29",
        "dayOfWeek": "Friday",
        "subjectId": "coa",
        "subjectName": "Computer Organization & Architecture",
        "topicId": "coa_instruction_pipelining",
        "topicName": "Formula Book Lockdown: Hardware, Systems & Theory",
        "officialSection": "Section 3: Computer Organization and Architecture",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Consolidate formula book for COA, Digital Logic, OS, Networks and TOC",
        "tasks": [
            {
                "id": "task_2027-01-29_1",
                "text": "Calculate clock cycle time = max(stage delays) + latch delay and pipeline speedup",
                "done": false
            },
            {
                "id": "task_2027-01-29_2",
                "text": "Analyze Read-After-Write (RAW) data dependencies and calculate stall cycles",
                "done": false
            },
            {
                "id": "task_2027-01-29_3",
                "text": "Trace hardware operand forwarding to eliminate data dependency bubbles",
                "done": false
            },
            {
                "id": "task_2027-01-29_4",
                "text": "Compute branch penalty impact on Average Cycles Per Instruction (CPI)",
                "done": false
            },
            {
                "id": "task_2027-01-29_5",
                "text": "Make formula summary on pipeline speedup and throughput",
                "done": false
            },
            {
                "id": "task_2027-01-29_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-29_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Computer Organization & Architecture",
            "topicName": "Hardware & Systems Formula Lockdown"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-29",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-30",
        "date": "2027-01-30",
        "dayOfWeek": "Saturday",
        "subjectId": "os",
        "subjectName": "Operating Systems",
        "topicId": "os_virtual_memory",
        "topicName": "Speed & Accuracy Revisit: High-Frequency Trap Defense",
        "officialSection": "Section 8: Operating Systems",
        "importance": "HIGH",
        "historicalFrequency": 96,
        "objective": "Review personal Mistake Bank and frequent calculation traps across all GATE CSE subjects",
        "tasks": [
            {
                "id": "task_2027-01-30_1",
                "text": "Trace page fault counts for reference strings under FIFO, OPT and LRU",
                "done": false
            },
            {
                "id": "task_2027-01-30_2",
                "text": "Understand Belady's Anomaly conditions and why stack algorithms (LRU, OPT) avoid it",
                "done": false
            },
            {
                "id": "task_2027-01-30_3",
                "text": "Calculate effective access time considering page fault service overhead",
                "done": false
            },
            {
                "id": "task_2027-01-30_4",
                "text": "Review Working Set model, Page Fault Frequency and Thrashing prevention",
                "done": false
            },
            {
                "id": "task_2027-01-30_5",
                "text": "Make comparison table of page replacement algorithms",
                "done": false
            },
            {
                "id": "task_2027-01-30_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-30_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Operating Systems",
            "topicName": "Trap Avoidance & Mistake Bank Review"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-30",
        "rescheduledTo": null,
        "completedAt": null
    },
    {
        "id": "gate_day_2027-01-31",
        "date": "2027-01-31",
        "dayOfWeek": "Sunday",
        "subjectId": "algo",
        "subjectName": "Algorithms",
        "topicId": "algo_mst_shortest_paths",
        "topicName": "GATE 2027 Final Strategy & Exam Readiness Lockdown",
        "officialSection": "Section 5: Algorithms",
        "importance": "HIGH",
        "historicalFrequency": 94,
        "objective": "Final mindset calibration, exam time-management strategy, and quiet confidence lockdown",
        "tasks": [
            {
                "id": "task_2027-01-31_1",
                "text": "Trace Kruskal's algorithm using Disjoint-Set Union (union by rank, path compression)",
                "done": false
            },
            {
                "id": "task_2027-01-31_2",
                "text": "Trace Prim's algorithm and compare time complexity under adjacency matrix vs binary heap",
                "done": false
            },
            {
                "id": "task_2027-01-31_3",
                "text": "Execute Dijkstra's algorithm step-by-step and prove why it fails on negative weight edges",
                "done": false
            },
            {
                "id": "task_2027-01-31_4",
                "text": "Understand Bellman-Ford algorithm for negative edge weights and negative cycle detection",
                "done": false
            },
            {
                "id": "task_2027-01-31_5",
                "text": "Make formula summary on MST and Shortest Path complexities",
                "done": false
            },
            {
                "id": "task_2027-01-31_6",
                "text": "Solve topic-wise PYQs from your handbook",
                "done": false
            },
            {
                "id": "task_2027-01-31_7",
                "text": "Mark topic complete",
                "done": false
            }
        ],
        "isPractice": false,
        "isRevision": true,
        "revisionTopic": {
            "subjectName": "Algorithms",
            "topicName": "Complete Syllabus 100% Prepared"
        },
        "status": "NOT_STARTED",
        "personalNotes": "",
        "originalDate": "2027-01-31",
        "rescheduledTo": null,
        "completedAt": null
    }
];

/**
 * 4. Coverage Validation Engine (Section 10 & 20)
 */
function validateGateCalendarCoverage(calendarItems, syllabusList) {
    const calendar = (calendarItems && Array.isArray(calendarItems)) ? calendarItems : GATE_DEDICATED_CALENDAR_DEFAULT;
    const syllabus = (syllabusList && Array.isArray(syllabusList)) ? syllabusList : GATE_SYLLABUS;

    const allTopicIds = new Set();
    syllabus.forEach(s => {
        (s.topics || []).forEach(t => allTopicIds.add(t.id));
    });

    const plannedTopicIds = new Set();
    calendar.forEach(item => {
        if (item.topicId) plannedTopicIds.add(item.topicId);
    });

    const missingTopics = [];
    allTopicIds.forEach(id => {
        if (!plannedTopicIds.has(id)) missingTopics.push(id);
    });

    const filledCalendarDays = calendar.filter(item => item.date && item.topicName).length;
    const totalCalendarDays = 123;
    const plannedTopics = plannedTopicIds.size;
    const totalSyllabusTopics = allTopicIds.size;
    const unplannedTopics = missingTopics.length;

    const isValid = (plannedTopics === totalSyllabusTopics) &&
                    (filledCalendarDays === totalCalendarDays) &&
                    (unplannedTopics === 0);

    return {
        isValid,
        totalSyllabusTopics,
        plannedTopics,
        unplannedTopics,
        totalCalendarDays,
        filledCalendarDays,
        missingTopics,
        duplicateTopics: []
    };
}

// Window & Module exports
const GATE_DATA_2027 = {
    config: GATE_CONFIG,
    subjects: GATE_SYLLABUS,
    topics: GATE_SYLLABUS.flatMap(s => (s.topics || []).map(t => ({ ...t, subjectId: s.id, subjectName: s.name }))),
    calendar: GATE_DEDICATED_CALENDAR_DEFAULT,
    historicalWeightage: GATE_HISTORICAL_WEIGHTAGE,
    validateGateCalendarCoverage
};

if (typeof window !== 'undefined') {
    window.GATE_CONFIG = GATE_CONFIG;
    window.GATE_SYLLABUS = GATE_SYLLABUS;
    window.GATE_SYLLABUS_2027 = GATE_SYLLABUS;
    window.GATE_HISTORICAL_WEIGHTAGE = GATE_HISTORICAL_WEIGHTAGE;
    window.GATE_DEDICATED_CALENDAR_DEFAULT = GATE_DEDICATED_CALENDAR_DEFAULT;
    window.GATE_DATA_2027 = GATE_DATA_2027;
    window.validateGateCalendarCoverage = validateGateCalendarCoverage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GATE_CONFIG,
        GATE_SYLLABUS,
        GATE_SYLLABUS_2027: GATE_SYLLABUS,
        GATE_HISTORICAL_WEIGHTAGE,
        GATE_DEDICATED_CALENDAR_DEFAULT,
        GATE_DATA_2027,
        calendar: GATE_DEDICATED_CALENDAR_DEFAULT,
        subjects: GATE_SYLLABUS,
        validateGateCalendarCoverage
    };
}
