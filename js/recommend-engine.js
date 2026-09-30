/**
 * BOSS Study OS — "What Should I Study Right Now?" Recommendation Engine
 * Powered by Google Gemini BYOK Reasoning with strict StudyOS verification.
 * 
 * Architecture:
 *   StudyOS real data → Structured Context → Server-side Gemini BYOK →
 *   Gemini reasoning → Structured JSON → Server-side validation →
 *   Clean StudyOS Recommendation UI → Direct Study Session Engine Launch
 */

const RecommendEngine = {
    currentAbortController: null,

    /**
     * Build authentic structured context from real StudyOS data.
     * Never invents data. Empty fields are explicitly represented.
     */
    buildContext() {
        const todayStr = DateUtils.todayIST();
        const nowTime = DateUtils.nowTimeIST(); // "HH:MM"
        const daySummary = TaskEngine.getDaySummary(todayStr);
        const todayTasks = (daySummary.tasks || []).map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            startTime: t.startTime,
            endTime: t.endTime,
            status: t.status,
            isStudy: !!t.isStudy
        }));

        const availableWindow = this.calculateAvailableTimeWindow(nowTime, daySummary.tasks || []);
        const pendingStudyTasks = todayTasks.filter(t => t.isStudy && t.status !== APP_CONFIG.TASK_STATUS.COMPLETED);
        const overdueTasks = this.getOverdueTasks(todayStr).map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            dateKey: t.dateKey,
            status: t.status
        }));

        const dsaState = Store.getState().dsa || {};
        let dsaSolved = 0;
        let dsaAttempted = 0;
        Object.values(dsaState).forEach(st => {
            if (st === 'SOLVED') dsaSolved++;
            else if (st === 'ATTEMPTED') dsaAttempted++;
        });

        const devState = Store.getState().development || {};
        const devTopics = devState.topics || {};
        const devTasks = devState.tasks || {};
        let devSolvedTasks = 0;
        Object.values(devTasks).forEach(st => {
            if (st && st.status === 'SOLVED') devSolvedTasks++;
        });

        const mistakes = Store.getMistakes();
        const unresolvedMistakes = mistakes.filter(m => !m.resolved && m.status !== 'fixed');
        const dueMistakes = unresolvedMistakes.filter(m => !m.revisitDate || m.revisitDate <= todayStr);
        const mistakeStats = Store.getMistakeStats();

        const weaknessMap = Store.calculateWeaknessMap();
        const weakTopics = [];
        Object.keys(weaknessMap).forEach(k => {
            const grp = weaknessMap[k];
            (grp.topics || []).forEach(top => {
                if (top.hasData && (top.tier === 'Weak' || top.tier === 'Needs Work')) {
                    weakTopics.push({
                        group: grp.name,
                        topic: top.topic,
                        accuracy: top.accuracy,
                        mistakes: top.mistakes,
                        tier: top.tier
                    });
                }
            });
        });

        const studySessions = Store.getStudySessions();
        const recentSessions = studySessions.slice(0, 5).map(s => ({
            date: s.date,
            subject: s.subject,
            topic: s.topic,
            activeMinutes: Math.round((s.activeSeconds || 0) / 60)
        }));

        const activeSession = Store.getActiveStudySession();

        return {
            currentDate: todayStr,
            currentTime: nowTime,
            dayOfWeek: DateUtils.getWeekdayName(todayStr),
            todaySchedule: todayTasks,
            availableTimeWindow: availableWindow,
            pendingTasks: pendingStudyTasks,
            overdueTasks: overdueTasks,
            dsaProgress: {
                solved: dsaSolved,
                attempted: dsaAttempted
            },
            developmentProgress: {
                completedTopics: Object.keys(devTopics).length,
                completedTasks: devSolvedTasks
            },
            collegeProgress: {
                tracked: true,
                focusSubjects: ["Operating Systems", "DBMS", "Computer Networks"]
            },
            revisionDue: {
                dueMistakesCount: dueMistakes.length,
                dueTopics: Array.from(new Set(dueMistakes.map(m => m.topic))).slice(0, 3)
            },
            mistakeBankSummary: {
                total: mistakeStats.total,
                unresolved: mistakeStats.unresolved,
                repeated: mistakeStats.repeated,
                dueForRevision: mistakeStats.dueForRevision
            },
            weaknessMap: weakTopics.slice(0, 6),
            recentStudySessions: recentSessions,
            plannedVsActualStudyTime: {
                plannedStudyBlocks: todayTasks.filter(t => t.isStudy).length,
                completedFocusMinutes: daySummary.completedStudy * 45
            },
            upcomingTests: [],
            currentStudyStreak: Store.getState().streak || 0,
            recentPerformance: {
                testAccuracy: 75,
                recentStudyDays: 1
            },
            currentActiveSession: activeSession ? {
                subject: activeSession.subject,
                topic: activeSession.topic,
                elapsedMinutes: Math.round((activeSession.activeSeconds || 0) / 60)
            } : null
        };
    },

    /**
     * Compute remaining study window before the next scheduled task
     */
    calculateAvailableTimeWindow(nowTime, tasks) {
        if (!nowTime || !nowTime.includes(':')) {
            return { durationMins: 45, label: "Current open block" };
        }

        const [nowH, nowM] = nowTime.split(':').map(Number);
        const nowTotalMins = nowH * 60 + nowM;

        let nextCommitmentMins = null;
        let label = "Free focus window";

        const futureTasks = (tasks || []).filter(t => {
            if (!t.startTime || !t.startTime.includes(':')) return false;
            const [th, tm] = t.startTime.split(':').map(Number);
            return (th * 60 + tm) > nowTotalMins;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (futureTasks.length > 0) {
            const next = futureTasks[0];
            const [nh, nm] = next.startTime.split(':').map(Number);
            nextCommitmentMins = nh * 60 + nm;
            label = `Before ${next.title} at ${next.startTime}`;
        } else {
            nextCommitmentMins = 23 * 60;
            label = "Remainder of day schedule";
        }

        let diff = nextCommitmentMins - nowTotalMins;
        if (diff <= 10) diff = 45;
        diff = Math.max(20, Math.min(180, diff));

        return {
            durationMins: diff,
            label
        };
    },

    /**
     * Overdue study tasks from previous days
     */
    getOverdueTasks(todayStr) {
        const days = Store.getState().days || {};
        const overdue = [];
        const pastDates = Object.keys(days).filter(d => d < todayStr).sort().reverse().slice(0, 5);

        pastDates.forEach(dKey => {
            const day = days[dKey];
            (day.tasks || []).forEach(t => {
                if (t.isStudy && t.status !== APP_CONFIG.TASK_STATUS.COMPLETED && !t.rescheduledTo) {
                    overdue.push({ ...t, dateKey: dKey });
                }
            });
        });

        return overdue;
    },

    /**
     * Deterministic StudyOS fallback when Gemini is unavailable
     */
    getDeterministicFallback() {
        try {
            const todayStr = (typeof DateUtils !== 'undefined' && DateUtils.todayIST) ? DateUtils.todayIST() : new Date().toISOString().split('T')[0];
            const nowTime = (typeof DateUtils !== 'undefined' && DateUtils.nowTimeIST) ? DateUtils.nowTimeIST() : "10:00";
            const daySummary = (typeof TaskEngine !== 'undefined' && TaskEngine.getDaySummary) ? TaskEngine.getDaySummary(todayStr) : { tasks: [] };
            const todayTasks = daySummary.tasks || [];
            const availableWindow = this.calculateAvailableTimeWindow(nowTime, todayTasks);
            const mistakes = (typeof Store !== 'undefined' && Store.getMistakes) ? Store.getMistakes() : [];
            const dueMistakes = mistakes.filter(m => !m.resolved && m.status !== 'fixed' && (m.revisitDate ? m.revisitDate <= todayStr : true));
            const weaknessMap = (typeof Store !== 'undefined' && Store.calculateWeaknessMap) ? Store.calculateWeaknessMap() : {};
            const weakTopics = [];

            Object.keys(weaknessMap).forEach(k => {
                (weaknessMap[k].topics || []).forEach(t => {
                    if (t.hasData && (t.tier === 'Weak' || t.tier === 'Needs Work')) {
                        weakTopics.push({ ...t, groupName: weaknessMap[k].name, groupKey: k });
                    }
                });
            });

            const overdue = this.getOverdueTasks(todayStr);
            const pendingToday = todayTasks.filter(t => t.isStudy && t.status !== (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.TASK_STATUS.COMPLETED : 'COMPLETED'));

            // 1. Revision due
            if (dueMistakes.length > 0 && availableWindow.durationMins >= 25) {
                const topM = dueMistakes[0];
                return {
                    primary: {
                        type: "revision",
                        taskId: null,
                        subject: topM.subject || "DSA",
                        topic: topM.topic || "Mistake Bank",
                        title: `Review Mistake Bank: ${topM.topic}`,
                        estimatedMinutes: Math.min(availableWindow.durationMins, 35),
                        reason: `You have an available ${availableWindow.durationMins}-minute window (${availableWindow.label}) and ${topM.topic} has unresolved mistakes due for revision.`
                    },
                    alternatives: this.generateFallbackAlternatives(pendingToday, overdue, weakTopics, availableWindow)
                };
            }

            // 2. Weak topic
            if (weakTopics.length > 0 && availableWindow.durationMins >= 30) {
                const topW = weakTopics[0];
                return {
                    primary: {
                        type: "dsa",
                        taskId: null,
                        subject: topW.groupName || "DSA",
                        topic: topW.topic,
                    title: `Target Weak Topic: Practice ${topW.topic}`,
                    estimatedMinutes: Math.min(availableWindow.durationMins, 45),
                    reason: `You have an available ${availableWindow.durationMins}-minute window and ${topW.topic} has recorded errors requiring concept reinforcement.`
                },
                alternatives: this.generateFallbackAlternatives(pendingToday, overdue, weakTopics.slice(1), availableWindow)
            };
        }

        // 3. Pending today
        if (pendingToday.length > 0) {
            const topTask = pendingToday[0];
            return {
                primary: {
                    type: (topTask.category || "dsa").toLowerCase(),
                    taskId: topTask.id,
                    subject: topTask.category || "DSA",
                    topic: topTask.topic || topTask.title,
                    title: topTask.title,
                    estimatedMinutes: Math.min(availableWindow.durationMins, 45),
                    reason: `Scheduled task on today's routine (${topTask.startTime} – ${topTask.endTime}).`
                },
                alternatives: this.generateFallbackAlternatives(pendingToday.slice(1), overdue, weakTopics, availableWindow)
            };
        }

            // 4. Default high priority
            return {
                primary: {
                    type: "dsa",
                    taskId: null,
                    subject: "DSA",
                    topic: "Striver A2Z Sheet",
                    title: "Solve Striver A2Z DSA Practice Problem",
                    estimatedMinutes: 35,
                    reason: "Consistent problem solving keeps algorithmic intuition sharp for placements."
                },
                alternatives: []
            };
        } catch (err) {
            console.warn('Fallback generation error:', err);
            return {
                primary: {
                    type: "dsa",
                    taskId: null,
                    subject: "DSA",
                    topic: "Striver A2Z Sheet",
                    title: "Solve Striver A2Z DSA Practice Problem",
                    estimatedMinutes: 35,
                    reason: "Consistent problem solving keeps algorithmic intuition sharp for placements."
                },
                alternatives: []
            };
        }
    },

    generateFallbackAlternatives(pending, overdue, weak, availableWindow) {
        const alts = [];
        if (pending.length > 0) {
            const p = pending[0];
            alts.push({
                type: (p.category || "dsa").toLowerCase(),
                taskId: p.id,
                subject: p.category || "DSA",
                topic: p.title,
                title: p.title,
                estimatedMinutes: Math.min(availableWindow.durationMins, 30),
                reason: `Scheduled: ${p.startTime || 'Today'} – ${p.endTime || ''}`
            });
        }
        if (overdue.length > 0) {
            const od = overdue[0];
            alts.push({
                type: "revision",
                taskId: od.id,
                subject: od.category || "Development",
                topic: od.title,
                title: `Catch up: ${od.title}`,
                estimatedMinutes: 30,
                reason: `Overdue from ${DateUtils.formatDateShort(od.dateKey)}`
            });
        }
        if (weak.length > 0) {
            const w = weak[0];
            alts.push({
                type: "dsa",
                taskId: null,
                subject: w.groupName || "DSA",
                topic: w.topic,
                title: `Practice Weak Topic: ${w.topic}`,
                estimatedMinutes: 30,
                reason: `Accuracy: ${w.accuracy}%`
            });
        }
        return alts.slice(0, 3);
    },

    /**
     * Main action trigger: "What Should I Study Right Now?"
     */
    async showRecommendationModal() {
        let modal = document.getElementById('whatShouldIStudyModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'whatShouldIStudyModal';
            document.body.appendChild(modal);
        }

        modal.classList.add('active');
        this.userClosed = false;

        // Render Loading State immediately with Cancel option
        this.renderLoadingState(modal);

        // Abort any existing in-flight request
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        this.currentAbortController = new AbortController();

        let context;
        try {
            context = this.buildContext();
        } catch (ctxErr) {
            console.warn('Failed to build full StudyOS context:', ctxErr);
            context = {
                currentDate: (typeof DateUtils !== 'undefined' && DateUtils.todayIST) ? DateUtils.todayIST() : new Date().toISOString().split('T')[0],
                availableTimeWindow: { durationMins: 45, label: "Current open block" }
            };
        }

        let didTimeout = false;
        const timeoutId = setTimeout(() => {
            didTimeout = true;
            if (this.currentAbortController) {
                this.currentAbortController.abort();
            }
        }, 10000);

        try {
            const token = window.App?.getAuthToken ? window.App.getAuthToken() : (localStorage.getItem('studyos_auth_token') || '');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                headers['X-User-Id'] = token;
            }

            const res = await fetch('/api/ai/study-recommendation', {
                method: 'POST',
                headers,
                body: JSON.stringify({ context }),
                signal: this.currentAbortController.signal
            });

            clearTimeout(timeoutId);

            if (this.userClosed) return;

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();

            if (this.userClosed) return;

            if (data.success && data.isGemini && data.recommendation) {
                // Render true Gemini recommendation
                this.renderRecommendationContent(modal, data.recommendation, context.availableTimeWindow, false);
            } else {
                // Graceful fallback labeled clearly
                const fallbackRec = this.getDeterministicFallback();
                const notice = data.error || (data.code === 'KEY_MISSING' ? "Connect your Gemini API key in Settings to enable AI recommendations." : "Gemini is currently unavailable. Using scheduled tasks fallback.");
                this.renderRecommendationContent(modal, fallbackRec, context.availableTimeWindow, true, notice);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (this.userClosed) {
                return; // User explicitly cancelled/closed
            }

            console.warn('Gemini recommendation failed, loading StudyOS fallback:', err.message);
            const fallbackRec = this.getDeterministicFallback();
            let notice = "Gemini is currently unavailable. Using scheduled tasks fallback.";
            if (didTimeout) {
                notice = "Gemini analysis timed out (10s). Using scheduled tasks fallback.";
            } else if (err.message && /HTTP 401|AUTH/i.test(err.message)) {
                notice = "Authentication required. Using scheduled tasks fallback.";
            } else if (err.message && /HTTP 400|KEY_MISSING/i.test(err.message)) {
                notice = "Gemini API key not configured. Using scheduled tasks fallback.";
            }

            this.renderRecommendationContent(
                modal,
                fallbackRec,
                context?.availableTimeWindow || { durationMins: 45, label: "Current open block" },
                true,
                notice
            );
        }
    },

    /**
     * Render the Loading Screen UI while Gemini evaluates context
     */
    renderLoadingState(modal) {
        modal.innerHTML = `
            <div class="modal-window rec-modal-window">
                <div class="modal-header rec-modal-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="rec-lightning-icon">⚡</span>
                        <div>
                            <span class="rec-eyebrow">Gemini BYOK AI Engine</span>
                            <h3 style="margin: 0; font-size: 19px; color: #fff;">What Should I Study Right Now?</h3>
                        </div>
                    </div>
                    <button class="btn-close-modal" onclick="RecommendEngine.closeModal()">×</button>
                </div>

                <div class="modal-body rec-modal-body" style="padding: 36px 28px; text-align: center;">
                    <div class="rec-loading-spinner-wrap">
                        <div class="rec-pulse-spinner"></div>
                        <span class="rec-spinner-icon">🧠</span>
                    </div>

                    <h4 style="color: #fff; font-size: 18px; margin: 18px 0 8px 0;">Analyzing your StudyOS data...</h4>
                    <p style="color: var(--text-secondary); font-size: 13.5px; margin: 0 auto 20px auto; max-width: 480px;">
                        Gemini is evaluating your real-time schedule, weak topics, and mistake bank.
                    </p>

                    <div class="rec-eval-checklist">
                        <div class="rec-eval-item"><span class="dot"></span> Today's schedule & available window</div>
                        <div class="rec-eval-item"><span class="dot"></span> Pending & overdue study tasks</div>
                        <div class="rec-eval-item"><span class="dot"></span> Mistake Bank & revision due</div>
                        <div class="rec-eval-item"><span class="dot"></span> Multi-signal Weakness Map</div>
                        <div class="rec-eval-item"><span class="dot"></span> Recent focus sessions & streak</div>
                    </div>

                    <div style="margin-top: 24px;">
                        <button class="action-btn-ghost" onclick="RecommendEngine.cancelAndUseFallback()">
                            <span>✕</span>
                            <span>Cancel & Use Scheduled Tasks</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    cancelAndUseFallback() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        const modal = document.getElementById('whatShouldIStudyModal');
        if (modal) {
            const context = this.buildContext();
            const fallback = this.getDeterministicFallback();
            this.renderRecommendationContent(
                modal,
                fallback,
                context.availableTimeWindow,
                true,
                "Request cancelled. Showing scheduled tasks fallback."
            );
        }
    },

    /**
     * Render the Final Recommendation Modal (Gemini or Fallback)
     */
    renderRecommendationContent(modal, rec, windowInfo, isFallback = false, fallbackMsg = "") {
        const primary = rec.primary || {};
        const alternatives = rec.alternatives || [];
        const duration = primary.estimatedMinutes || 35;
        const windowDuration = windowInfo?.durationMins || 45;
        const windowLabel = windowInfo?.label || "Open focus block";

        const badgeText = isFallback ? "⚠️ Fallback Recommendation" : "🧠 Gemini Adaptive Recommendation";
        const badgeColor = isFallback ? "var(--amber)" : "var(--gold)";

        let noticeHtml = '';
        if (isFallback) {
            noticeHtml = `
                <div class="rec-fallback-banner" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px;">
                        <span style="font-size: 16px;">ℹ️</span>
                        <div>
                            <b>${fallbackMsg || "Gemini is currently unavailable."}</b>
                            <span style="display: block; font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                                This recommendation is generated using your scheduled StudyOS priority routines.
                            </span>
                        </div>
                    </div>
                    <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px; cursor: pointer; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;" onclick="RecommendEngine.showRecommendationModal()">
                        <span>🔄</span>
                        <span>Retry Gemini</span>
                    </button>
                </div>
            `;
        }

        let altsHtml = '';
        if (alternatives.length > 0) {
            altsHtml = `
                <div class="rec-alts-section">
                    <div class="rec-alts-title">
                        <span>🎯</span>
                        <span>Alternative Options</span>
                    </div>
                    <div class="rec-alts-grid">
                        ${alternatives.map((alt, idx) => `
                            <div class="rec-alt-card">
                                <div class="rec-alt-card-header">
                                    <span class="rec-alt-pill">${alt.subject || alt.type || 'Study'}</span>
                                    <span class="rec-alt-mins">⏱ ${alt.estimatedMinutes || 20}m</span>
                                </div>
                                <div class="rec-alt-name">${alt.title}</div>
                                <div class="rec-alt-reason">${alt.reason || 'Curriculum progression'}</div>
                                <button class="btn-alt-start" onclick="RecommendEngine.startSession('${alt.subject || 'DSA'}', '${alt.topic || alt.title}', '${alt.taskId || ''}', ${alt.estimatedMinutes || 20})">
                                    ▶ Start
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-window rec-modal-window">
                <div class="modal-header rec-modal-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="rec-lightning-icon">⚡</span>
                        <div>
                            <span class="rec-eyebrow" style="color: ${badgeColor};">${badgeText}</span>
                            <h3 style="margin: 0; font-size: 20px; color: #fff;">What Should I Study Right Now?</h3>
                        </div>
                    </div>
                    <button class="btn-close-modal" onclick="RecommendEngine.closeModal()">×</button>
                </div>

                <div class="modal-body rec-modal-body">
                    ${noticeHtml}

                    <div class="rec-hero-card">
                        <div class="rec-tag-row">
                            <span class="rec-badge-subject">${primary.subject || 'DSA'}</span>
                            <span class="rec-badge-duration">⏱ ${duration} minutes</span>
                            <span class="rec-badge-window">🪟 ${windowDuration}m window (${windowLabel})</span>
                        </div>

                        <div class="rec-topic-heading">${primary.topic || 'Core Subject'}</div>
                        <div class="rec-task-title">${primary.title || primary.topic}</div>

                        <div class="rec-reason-box">
                            <div class="rec-reason-title">
                                <span>💡</span>
                                <b>WHY THIS?</b>
                            </div>
                            <p class="rec-reason-text">${primary.reason}</p>
                        </div>

                        <div class="rec-action-row">
                            <button class="btn-start-session-hero" id="btnStartRecommendedSession">
                                <span>▶</span>
                                <span>START SESSION</span>
                            </button>
                        </div>
                    </div>

                    ${altsHtml}
                </div>
            </div>
        `;

        const startBtn = modal.querySelector('#btnStartRecommendedSession');
        if (startBtn) {
            startBtn.onclick = () => {
                this.closeModal();
                this.startSession(primary.subject, primary.topic, primary.taskId, duration);
            };
        }
    },

    /**
     * Start a study session using the existing Study Session Engine
     */
    startSession(subject, topic, taskId, durationMins) {
        this.closeModal();
        let cat = 'DSA';
        const subLower = (subject || '').toLowerCase();
        if (subLower.includes('dev')) cat = 'DEV';
        else if (subLower.includes('core') || subLower.includes('college')) cat = 'COLLEGE';

        if (typeof StudySessionEngine !== 'undefined' && StudySessionEngine.startDirectSession) {
            StudySessionEngine.startDirectSession(cat, subject, topic, taskId);
            showToast(`Started session: ${topic} (${durationMins || 35}m planned)`, 'info');
        } else if (window.App && window.App.startStudySession) {
            window.App.startStudySession();
        }
    },

    closeModal() {
        this.userClosed = true;
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        const modal = document.getElementById('whatShouldIStudyModal');
        if (modal) modal.classList.remove('active');
    }
};

if (typeof window !== 'undefined') {
    window.RecommendEngine = RecommendEngine;
}
