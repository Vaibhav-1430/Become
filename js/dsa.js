/**
 * BOSS Study OS — DSA Progression Engine (Striver A2Z)
 * Deterministic, sequential problem progression starting from Question 1.
 * Ensures unfinished questions carry forward automatically and no questions are skipped.
 */

const DSAEngine = {
    /**
     * Get all problems
     */
    getAllProblems() {
        return DSA_ALL_PROBLEMS;
    },

    /**
     * Get problem by ID
     */
    getProblemById(id) {
        return DSA_ALL_PROBLEMS.find(p => p.id === id) || null;
    },

    /**
     * Get problem by global index
     */
    getProblemByIndex(idx) {
        return DSA_ALL_PROBLEMS[idx] || null;
    },

    /**
     * Get the next N problems to solve based on current progress.
     * Iterates through DSA_ALL_PROBLEMS starting from index 0.
     * Skips already SOLVED problems and returns the next N unfinished problems.
     * @param {number} count - number of questions needed (default 3)
     * @returns {Array} Array of problem objects
     */
    getNextUnsolvedProblems(count = 3) {
        const result = [];
        for (let i = 0; i < DSA_ALL_PROBLEMS.length; i++) {
            const prob = DSA_ALL_PROBLEMS[i];
            const prog = Store.getDsaProgress(prob.id);
            if (prog.status !== APP_CONFIG.DSA_STATUS.SOLVED) {
                result.push({
                    ...prob,
                    status: prog.status,
                    progress: prog
                });
                if (result.length >= count) break;
            }
        }
        return result;
    },

    /**
     * Get or assign DSA questions for a specific date.
     * If the date already has assigned DSA questions in tasks, returns those.
     * Otherwise, assigns the next 2-3 sequential unsolved questions.
     * @param {string} dateStr - YYYY-MM-DD
     * @param {number} count - Number of questions to assign (2 or 3)
     */
    getQuestionsForDate(dateStr, count = 3) {
        const dayData = Store.getDayData(dateStr);
        // If already generated with specific DSA tasks, return them
        const existingDsaTasks = (dayData.tasks || []).filter(t => t.dsaProblemId);
        if (existingDsaTasks.length > 0) {
            return existingDsaTasks.map(t => {
                const prob = this.getProblemById(t.dsaProblemId) || t.dsaProblemData;
                const prog = Store.getDsaProgress(t.dsaProblemId);
                return {
                    ...prob,
                    status: t.status === APP_CONFIG.TASK_STATUS.COMPLETED ? APP_CONFIG.DSA_STATUS.SOLVED : prog.status,
                    taskId: t.id,
                    taskStatus: t.status
                };
            });
        }

        // If today or past, check for carry-over from previous days
        // Otherwise grab next sequential unsolved
        return this.getNextUnsolvedProblems(count);
    },

    /**
     * Mark a problem's status (SOLVED, IN_PROGRESS, REVISIT, NOT_STARTED)
     */
    setProblemStatus(problemId, status, notes = '') {
        const solvedDate = status === APP_CONFIG.DSA_STATUS.SOLVED ? DateUtils.todayIST() : null;
        Store.setDsaProgress(problemId, {
            status,
            solvedDate,
            notes: notes || ''
        });

        // Also update any matching task for today
        const todayStr = DateUtils.todayIST();
        const todayData = Store.getDayData(todayStr);
        let changed = false;
        todayData.tasks = (todayData.tasks || []).map(t => {
            if (t.dsaProblemId === problemId) {
                changed = true;
                const newStatus = status === APP_CONFIG.DSA_STATUS.SOLVED
                    ? APP_CONFIG.TASK_STATUS.COMPLETED
                    : status === APP_CONFIG.DSA_STATUS.IN_PROGRESS
                        ? APP_CONFIG.TASK_STATUS.IN_PROGRESS
                        : APP_CONFIG.TASK_STATUS.NOT_STARTED;
                return {
                    ...t,
                    status: newStatus,
                    history: [
                        ...(t.history || []),
                        { timestamp: DateUtils.nowISO(), action: 'STATUS_CHANGE', detail: `Marked as ${status}` }
                    ]
                };
            }
            return t;
        });

        if (changed) {
            if (typeof TaskEngine !== 'undefined' && TaskEngine.recalculateDayStatus) {
                TaskEngine.recalculateDayStatus(todayStr);
            }
            Store.setDayData(todayStr, todayData);
        } else if (typeof TaskEngine !== 'undefined' && TaskEngine.invalidateStatsCache) {
            TaskEngine.invalidateStatsCache();
        }
    },

    /**
     * Get comprehensive statistics for DSA
     */
    getStats() {
        const total = DSA_ALL_PROBLEMS.length;
        let solved = 0;
        let inProgress = 0;
        let revisit = 0;
        let easySolved = 0;
        let mediumSolved = 0;
        let hardSolved = 0;

        const todayStr = DateUtils.todayIST();
        let solvedToday = 0;

        // Calculate this week's start (Monday)
        const now = DateUtils.parseDate(todayStr);
        const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
        const monday = new Date(now);
        monday.setDate(monday.getDate() - dayOfWeek);
        const mondayStr = DateUtils.toDateStr(monday);

        let solvedThisWeek = 0;

        DSA_ALL_PROBLEMS.forEach(prob => {
            const prog = Store.getDsaProgress(prob.id);
            if (prog.status === APP_CONFIG.DSA_STATUS.SOLVED) {
                solved++;
                const diff = (prob.difficulty || 'Medium').toLowerCase();
                if (diff.includes('easy')) easySolved++;
                else if (diff.includes('hard')) hardSolved++;
                else mediumSolved++;

                if (prog.solvedDate === todayStr) {
                    solvedToday++;
                }
                if (prog.solvedDate && prog.solvedDate >= mondayStr && prog.solvedDate <= todayStr) {
                    solvedThisWeek++;
                }
            } else if (prog.status === APP_CONFIG.DSA_STATUS.IN_PROGRESS) {
                inProgress++;
            } else if (prog.status === APP_CONFIG.DSA_STATUS.REVISIT) {
                revisit++;
            }
        });

        const percent = total > 0 ? Math.round((solved / total) * 100) : 0;

        return {
            total,
            solved,
            remaining: total - solved,
            inProgress,
            revisit,
            percent,
            easySolved,
            mediumSolved,
            hardSolved,
            solvedToday,
            solvedThisWeek
        };
    },

    /**
     * Get section-wise progress breakdown
     */
    getSectionProgress() {
        return DSA_A2Z_SHEET.map((section, sIdx) => {
            let sectionTotal = 0;
            let sectionSolved = 0;

            const subcategories = section.subcategories.map(sub => {
                let subTotal = sub.problems.length;
                let subSolved = 0;

                const problemsWithStatus = sub.problems.map(p => {
                    const prog = Store.getDsaProgress(p.id);
                    if (prog.status === APP_CONFIG.DSA_STATUS.SOLVED) {
                        subSolved++;
                    }
                    return {
                        ...p,
                        status: prog.status,
                        solvedDate: prog.solvedDate,
                        notes: prog.notes
                    };
                });

                sectionTotal += subTotal;
                sectionSolved += subSolved;

                return {
                    name: sub.name,
                    total: subTotal,
                    solved: subSolved,
                    percent: subTotal > 0 ? Math.round((subSolved / subTotal) * 100) : 0,
                    problems: problemsWithStatus
                };
            });

            return {
                sectionIndex: sIdx,
                name: section.name,
                total: sectionTotal,
                solved: sectionSolved,
                percent: sectionTotal > 0 ? Math.round((sectionSolved / sectionTotal) * 100) : 0,
                subcategories
            };
        });
    },

    /**
     * Get single section progress by index without scanning the entire sheet
     */
    getSectionProgressByIndex(sIdx) {
        const section = DSA_A2Z_SHEET[sIdx];
        if (!section) return null;
        let sectionTotal = 0;
        let sectionSolved = 0;

        const subcategories = section.subcategories.map(sub => {
            let subTotal = sub.problems.length;
            let subSolved = 0;

            const problemsWithStatus = sub.problems.map(p => {
                const prog = Store.getDsaProgress(p.id);
                if (prog.status === APP_CONFIG.DSA_STATUS.SOLVED) {
                    subSolved++;
                }
                return {
                    ...p,
                    status: prog.status,
                    solvedDate: prog.solvedDate,
                    notes: prog.notes
                };
            });

            sectionTotal += subTotal;
            sectionSolved += subSolved;

            return {
                name: sub.name,
                total: subTotal,
                solved: subSolved,
                percent: subTotal > 0 ? Math.round((subSolved / subTotal) * 100) : 0,
                problems: problemsWithStatus
            };
        });

        return {
            sectionIndex: sIdx,
            name: section.name,
            total: sectionTotal,
            solved: sectionSolved,
            percent: sectionTotal > 0 ? Math.round((sectionSolved / sectionTotal) * 100) : 0,
            subcategories
        };
    }
};

if (typeof window !== 'undefined') {
    window.DSAEngine = DSAEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { DSAEngine };
}

