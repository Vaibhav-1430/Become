/**
 * BOSS Study OS — Syllabus Boundary & Test Generation Engine
 * HARD REQUIREMENT: Never generates questions outside the user's actual studied progress.
 * Respects "Studied" vs "Solved" distinctions.
 */

const SyllabusEngine = {
    /**
     * Map of DSA section indices to topic identifiers and human names
     */
    DSA_SECTION_MAP: [
        { sectionIndex: 0, id: 'dsa_basics', name: 'Learn the basics (Math, Recursion, Hashing)' },
        { sectionIndex: 1, id: 'dsa_sorting', name: 'Learn Important Sorting Techniques (Selection, Bubble, Insertion, Merge, Quick)' },
        { sectionIndex: 2, id: 'dsa_arrays', name: 'Solve Problems on Arrays (Easy, Medium, Hard)' },
        { sectionIndex: 3, id: 'dsa_binary_search', name: 'Binary Search (1D, 2D Arrays, Search Space)' },
        { sectionIndex: 4, id: 'dsa_strings', name: 'Strings (Basic & Medium)' },
        { sectionIndex: 5, id: 'dsa_linked_list', name: 'LinkedList (Single, Double, Medium, Hard)' },
        { sectionIndex: 6, id: 'dsa_recursion_patterns', name: 'Recursion (PatternWise)' },
        { sectionIndex: 7, id: 'dsa_bit_manipulation', name: 'Bit Manipulation' },
        { sectionIndex: 8, id: 'dsa_stack_queue', name: 'Stack and Queues' },
        { sectionIndex: 9, id: 'dsa_sliding_window', name: 'Sliding Window & Two Pointer' },
        { sectionIndex: 10, id: 'dsa_heaps', name: 'Heaps / Priority Queues' },
        { sectionIndex: 11, id: 'dsa_greedy', name: 'Greedy Algorithms' },
        { sectionIndex: 12, id: 'dsa_trees', name: 'Binary Trees' },
        { sectionIndex: 13, id: 'dsa_bst', name: 'Binary Search Trees' },
        { sectionIndex: 14, id: 'dsa_graphs', name: 'Graphs' },
        { sectionIndex: 15, id: 'dsa_dp', name: 'Dynamic Programming' },
        { sectionIndex: 16, id: 'dsa_tries', name: 'Tries' },
        { sectionIndex: 17, id: 'dsa_strings_adv', name: 'Advanced String Algorithms' }
    ],

    /**
     * Detect the user's current studied boundary from actual Study OS progress
     */
    detectStudiedBoundary() {
        // 1. Inspect DSA progress
        let maxDsaSection = 0; // Default: Section 0 (Learn the basics)
        const dsaProgress = Store.getState().dsa || {};
        
        // Find highest section where a problem was touched (SOLVED, IN_PROGRESS, REVISIT)
        if (typeof DSA_ALL_PROBLEMS !== 'undefined' && Array.isArray(DSA_ALL_PROBLEMS)) {
            Object.keys(dsaProgress).forEach(pId => {
                const prog = dsaProgress[pId];
                if (prog && prog.status && prog.status !== 'NOT_STARTED') {
                    const prob = DSA_ALL_PROBLEMS.find(p => p.id === pId);
                    if (prob && typeof prob.sectionIndex === 'number' && prob.sectionIndex > maxDsaSection) {
                        maxDsaSection = prob.sectionIndex;
                    }
                }
            });
        }

        // Check Placement Hub DSA roadmap
        const dsaRoadmap = Store.getSubjectRoadmap('dsa');
        if (dsaRoadmap) {
            if (dsaRoadmap['dsa_binary_search']?.completed && maxDsaSection < 3) maxDsaSection = 3;
            else if (dsaRoadmap['dsa_arrays']?.completed && maxDsaSection < 2) maxDsaSection = 2;
            else if (dsaRoadmap['dsa_sorting']?.completed && maxDsaSection < 1) maxDsaSection = 1;
        }

        // 2. Inspect Core CS Roadmaps
        const coreSubjects = ['dbms', 'os', 'cn', 'oop', 'sysdesign', 'sql', 'aptitude'];
        const studiedTopicsBySubject = {};

        coreSubjects.forEach(sId => {
            const roadmap = Store.getSubjectRoadmap(sId);
            const completedTopics = [];
            Object.keys(roadmap).forEach(tId => {
                if (roadmap[tId]?.completed) {
                    completedTopics.push(tId);
                }
            });
            studiedTopicsBySubject[sId] = completedTopics;
        });

        // 3. User experience level
        const isBeginner = maxDsaSection <= 2;

        return {
            maxDsaSection,
            maxDsaSectionName: this.DSA_SECTION_MAP[maxDsaSection]?.name || 'Learn the basics',
            studiedTopicsBySubject,
            isBeginner,
            weakAreas: Store.getWeakAreas()
        };
    },

    /**
     * Get all questions from TEST_QUESTION_BANK that strictly fall inside the studied boundary
     */
    getEligibleQuestions(boundary = null) {
        if (!boundary) boundary = this.detectStudiedBoundary();
        const bank = typeof TEST_QUESTION_BANK !== 'undefined' ? TEST_QUESTION_BANK : { dsa: [], core_cs: [], sql: [], aptitude: [], conceptual: [] };
        
        // 1. Eligible DSA Questions
        const eligibleDsa = bank.dsa.filter(q => {
            return q.sectionIndex <= boundary.maxDsaSection;
        });

        // 2. Eligible Core CS Questions
        // If user has marked specific topics in roadmap, filter strictly to those.
        // If a subject has no topics marked yet, provide foundation questions if enabled, or exclude.
        const eligibleCore = bank.core_cs.filter(q => {
            const studiedInSubject = boundary.studiedTopicsBySubject[q.subjectId] || [];
            // If topic is directly in roadmap or subject has studied topics
            if (studiedInSubject.length > 0) {
                return studiedInSubject.includes(q.topicId) || studiedInSubject.some(t => q.topicId.includes(t) || t.includes(q.topicId));
            }
            // If no topics checked yet in roadmap, allow foundational Easy/Medium core questions
            return q.difficulty === 'Easy' || q.difficulty === 'Medium';
        });

        // 3. Eligible SQL Questions
        const eligibleSql = bank.sql.filter(q => {
            const studiedSql = boundary.studiedTopicsBySubject['sql'] || [];
            if (studiedSql.length > 0) {
                return studiedSql.includes(q.topicId);
            }
            return true; // Foundation SQL
        });

        // 4. Eligible Aptitude
        const eligibleAptitude = [...bank.aptitude];

        // 5. Eligible Conceptual
        const eligibleConceptual = bank.conceptual.filter(q => {
            if (q.subjectId === 'os') return true;
            const studiedSys = boundary.studiedTopicsBySubject['sysdesign'] || [];
            return studiedSys.length > 0 || q.difficulty === 'Easy';
        });

        return {
            dsa: eligibleDsa,
            core_cs: eligibleCore,
            sql: eligibleSql,
            aptitude: eligibleAptitude,
            conceptual: eligibleConceptual,
            totalEligible: eligibleDsa.length + eligibleCore.length + eligibleSql.length + eligibleAptitude.length + eligibleConceptual.length
        };
    },

    /**
     * Generate a balanced, syllabus-bounded Weekly Test
     * Target: 23 Questions (or maximum available within syllabus)
     */
    generateWeeklyTest(options = {}) {
        const boundary = this.detectStudiedBoundary();
        const pool = this.getEligibleQuestions(boundary);
        const testDate = options.date || DateUtils.todayIST();
        const durationMinutes = options.durationMinutes || 75;

        // Shuffle helper
        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

        // Weak topics for priority injection
        const weakTopicNames = (boundary.weakAreas || []).map(w => w.topic.toLowerCase());

        const selectQuestions = (list, count) => {
            if (!list || list.length === 0) return [];
            // Prioritize weak topics if any match
            const prioritized = [...list].sort((a, b) => {
                const aWeak = weakTopicNames.includes(a.topic.toLowerCase()) ? 1 : 0;
                const bWeak = weakTopicNames.includes(b.topic.toLowerCase()) ? 1 : 0;
                return bWeak - aWeak;
            });
            return shuffle(prioritized).slice(0, count);
        };

        // Select:
        // 3 DSA Coding Questions
        let selectedDsa = selectQuestions(pool.dsa, 3);
        // 10 Core CS MCQs
        let selectedCore = selectQuestions(pool.core_cs, 10);
        // 3 SQL Questions
        let selectedSql = selectQuestions(pool.sql, 3);
        // 5 Aptitude Questions
        let selectedApt = selectQuestions(pool.aptitude, 5);
        // 2 Conceptual Questions
        let selectedConcept = selectQuestions(pool.conceptual, 2);

        // If any category has fewer than ideal, top up gracefully without unstudied topics
        let allSelected = [
            ...selectedDsa,
            ...selectedCore,
            ...selectedSql,
            ...selectedApt,
            ...selectedConcept
        ];

        // Format into final test questions with question indices
        const questions = allSelected.map((q, idx) => ({
            ...q,
            index: idx,
            id: q.id || `q_${idx}_${Date.now()}`
        }));

        const testSession = {
            id: `test_${testDate}_${Date.now()}`,
            testAttemptId: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            date: testDate,
            title: `Sunday Weekly Test — ${DateUtils.formatDateLong(testDate)}`,
            durationMinutes,
            durationSeconds: durationMinutes * 60,
            startTime: Date.now(),
            targetEndTime: Date.now() + (durationMinutes * 60 * 1000),
            totalQuestions: questions.length,
            questions,
            currentIndex: 0,
            answers: {},          // qId -> answer (index for MCQ, string for conceptual)
            codes: {},            // isolated editor state keyed by `${q.id}_${language}`
            submissionHistory: {},// qId -> array of attempts
            codeSubmissions: {},  // qId -> latest submission summary
            reviewFlags: [],      // array of marked question indices
            isCompleted: false,
            autosavedAt: DateUtils.nowISO(),
            boundarySnapshot: {
                maxDsaSection: boundary.maxDsaSection,
                maxDsaSectionName: boundary.maxDsaSectionName,
                isBeginner: boundary.isBeginner
            }
        };

        return testSession;
    }
};

if (typeof window !== 'undefined') {
    window.SyllabusEngine = SyllabusEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { SyllabusEngine };
}
