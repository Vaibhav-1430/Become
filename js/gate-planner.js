/**
 * FORGE — GATE 2027 PYQ-First Study Planner & Adaptive Priority Engine
 *
 * Fully integrated into FORGE architecture:
 * - Reuses canonical Store, SyncEngine, MistakeBank, StudySessionEngine, Calendar, Today Command.
 * - Multi-signal Priority Engine based on authentic historical GATE trends + user performance.
 * - PYQ-first execution layer with full attempt tracking, timers, and mistake categorization.
 */

const GatePlannerEngine = {
    activeSession: null,
    activeHistoricalYear: 'all', // 'all' | 2021 | 2022 | ... | 2026
    timerInterval: null,
    sessionSeconds: 0,
    questionSeconds: 0,

    init() {
        // Ensure state exists in Store
        if (typeof Store !== 'undefined' && Store.getGateState) {
            Store.getGateState();
        }
    },

    // =========================================================================
    // 1. PRIORITY ENGINE (Section 3 & Section 12)
    // =========================================================================

    /**
     * Get current configurable weights for priority calculation
     */
    getWeights() {
        if (typeof Store !== 'undefined' && Store.getState) {
            const savedWeights = Store.getState()?.gate?.settings?.weights;
            if (savedWeights) return savedWeights;
        }
        return (typeof GATE_CONFIG !== 'undefined' && GATE_CONFIG.PRIORITY_WEIGHTS)
            ? GATE_CONFIG.PRIORITY_WEIGHTS
            : {
                historicalFrequency: 0.25,
                recentFrequency: 0.20,
                recurrence: 0.15,
                userWeakness: 0.20,
                revisionDue: 0.10,
                pyqCoverageGap: 0.10
            };
    },

    /**
     * Calculate subject-level priority and performance metrics
     */
    calculateSubjectPriorities() {
        const syllabus = (typeof GATE_SYLLABUS !== 'undefined') ? GATE_SYLLABUS : [];
        const attempts = (typeof Store !== 'undefined' && Store.getGatePyqAttempts) ? Store.getGatePyqAttempts() : [];
        const pyqBank = this.getAllPyqs();
        const weights = this.getWeights();

        const subjects = syllabus.map(subj => {
            const subjPyqs = pyqBank.filter(q => q.subjectId === subj.id);
            const subjAttempts = attempts.filter(a => a.subjectId === subj.id);
            const attemptedCount = subjAttempts.length;
            const correctCount = subjAttempts.filter(a => a.isCorrect).length;
            const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
            const remainingPyqs = Math.max(0, subjPyqs.length - attemptedCount);

            // Historical frequency score (0-100): normalized against 15 max marks
            const historicalFrequency = Math.min(100, Math.round((subj.historicalWeight / 15.0) * 100));

            // Recent frequency score (2024-2026): average marks in last 3 years
            const recentPapers = (typeof GATE_HISTORICAL_WEIGHTAGE !== 'undefined')
                ? GATE_HISTORICAL_WEIGHTAGE.filter(p => p.year >= 2024)
                : [];
            let recentMarksSum = 0;
            recentPapers.forEach(p => {
                recentMarksSum += (p.marks?.[subj.id] || 0);
            });
            const recentAvgMarks = recentPapers.length > 0 ? (recentMarksSum / recentPapers.length) : subj.historicalWeight;
            const recentFrequency = Math.min(100, Math.round((recentAvgMarks / 15.0) * 100));

            // Recurrence score across all papers
            const allPapers = (typeof GATE_HISTORICAL_WEIGHTAGE !== 'undefined') ? GATE_HISTORICAL_WEIGHTAGE : [];
            let appearedSessions = 0;
            allPapers.forEach(p => {
                if ((p.marks?.[subj.id] || 0) > 0) appearedSessions++;
            });
            const recurrence = allPapers.length > 0 ? Math.round((appearedSessions / allPapers.length) * 100) : 80;

            // User weakness score
            let userWeakness = 50; // default baseline for untested subject
            if (attemptedCount > 0) {
                userWeakness = Math.max(0, Math.min(100, (100 - accuracy) + (subjAttempts.filter(a => !a.isCorrect).length * 4)));
            }

            // Revision due score
            let revisionDue = 0;
            let lastPracticedAt = null;
            if (subjAttempts.length > 0) {
                const sorted = [...subjAttempts].sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
                lastPracticedAt = sorted[0].attemptedAt;
                const daysSince = Math.floor((Date.now() - new Date(lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince >= 7) revisionDue = 100;
                else if (daysSince >= 3) revisionDue = 75;
                else if (daysSince >= 1) revisionDue = 40;
                else if (accuracy < 75) revisionDue = 60;
                else revisionDue = 10;
            } else {
                revisionDue = 60; // Needs initial practice
            }

            // PYQ Coverage gap
            const totalAvailable = Math.max(1, subjPyqs.length);
            const pyqCoverageGap = Math.round(((totalAvailable - correctCount) / totalAvailable) * 100);

            // Compute composite priorityScore (0-100)
            const priorityScore = Math.round(
                (weights.historicalFrequency * historicalFrequency) +
                (weights.recentFrequency * recentFrequency) +
                (weights.recurrence * recurrence) +
                (weights.userWeakness * userWeakness) +
                (weights.revisionDue * revisionDue) +
                (weights.pyqCoverageGap * pyqCoverageGap)
            );

            let priorityLevel = 'MEDIUM';
            if (priorityScore >= 70) priorityLevel = 'HIGH';
            else if (priorityScore < 45) priorityLevel = 'LOW';

            let revisionStatus = 'NEEDS_PRACTICE';
            if (attemptedCount > 0 && revisionDue >= 70) revisionStatus = 'DUE';
            else if (attemptedCount > 0 && accuracy >= 80) revisionStatus = 'MASTERY_GOOD';

            return {
                id: subj.id,
                name: subj.name,
                shortName: subj.shortName,
                icon: subj.icon,
                historicalWeight: subj.historicalWeight,
                recentAvgMarks: Math.round(recentAvgMarks * 10) / 10,
                topicsCount: (subj.topics || []).length,
                totalPyqs: subjPyqs.length,
                attemptedCount,
                correctCount,
                remainingPyqs,
                accuracy,
                lastPracticedAt,
                revisionDue,
                revisionStatus,
                priorityScore,
                priorityLevel
            };
        });

        return subjects.sort((a, b) => b.priorityScore - a.priorityScore);
    },

    /**
     * Calculate topic-level priority with full explainable signals
     */
    calculateTopicPriorities() {
        const syllabus = (typeof GATE_SYLLABUS !== 'undefined') ? GATE_SYLLABUS : [];
        const attempts = (typeof Store !== 'undefined' && Store.getGatePyqAttempts) ? Store.getGatePyqAttempts() : [];
        const pyqBank = this.getAllPyqs();
        const weights = this.getWeights();
        const mistakes = (typeof Store !== 'undefined' && Store.getMistakes) ? Store.getMistakes() : [];

        const topics = [];

        syllabus.forEach(subj => {
            (subj.topics || []).forEach(top => {
                const topicPyqs = pyqBank.filter(q => q.topicId === top.id || (q.subjectId === subj.id && q.topicName === top.name));
                const topicAttempts = attempts.filter(a => a.topicId === top.id);
                const attemptedCount = topicAttempts.length;
                const correctCount = topicAttempts.filter(a => a.isCorrect).length;
                const wrongCount = topicAttempts.filter(a => !a.isCorrect && a.status !== 'SKIPPED').length;
                const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
                const remainingPyqs = Math.max(0, topicPyqs.length - attemptedCount);

                // Unresolved mistakes in Mistake Bank for this topic
                const topicMistakes = mistakes.filter(m => 
                    !m.resolved && 
                    (m.subject?.toLowerCase().includes(subj.name.toLowerCase()) || m.subject?.toLowerCase().includes('gate')) &&
                    (m.topic?.toLowerCase().includes(top.name.toLowerCase()) || m.question?.toLowerCase().includes(top.name.toLowerCase()))
                );

                // 1. Historical frequency (0-100)
                const historicalFrequency = Math.min(100, Math.round((subj.historicalWeight / 15.0) * 100));

                // 2. Recent frequency (0-100)
                const recentPapers = (typeof GATE_HISTORICAL_WEIGHTAGE !== 'undefined')
                    ? GATE_HISTORICAL_WEIGHTAGE.filter(p => p.year >= 2024)
                    : [];
                let recentMarks = 0;
                recentPapers.forEach(p => { recentMarks += (p.marks?.[subj.id] || 0); });
                const recentFrequency = Math.min(100, Math.round(((recentMarks / Math.max(1, recentPapers.length)) / 15.0) * 100));

                // 3. Recurrence across years (0-100)
                const recurrence = Math.min(100, Math.max(50, Math.round((topicPyqs.length / 8.0) * 100)));

                // 4. User weakness (0-100)
                let userWeakness = 55; // baseline
                if (attemptedCount > 0) {
                    userWeakness = Math.max(0, Math.min(100, (100 - accuracy) + (topicMistakes.length * 8) + (wrongCount * 5)));
                }

                // 5. Revision due (0-100)
                let revisionDue = 0;
                let lastPracticedAt = null;
                if (topicAttempts.length > 0) {
                    const sorted = [...topicAttempts].sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
                    lastPracticedAt = sorted[0].attemptedAt;
                    const daysSince = Math.floor((Date.now() - new Date(lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSince >= 5) revisionDue = 100;
                    else if (daysSince >= 2) revisionDue = 75;
                    else if (accuracy < 75) revisionDue = 80;
                    else revisionDue = 15;
                } else {
                    revisionDue = 70; // Needs practice
                }

                // 6. PYQ Coverage gap (0-100)
                const totalAvail = Math.max(1, topicPyqs.length);
                const pyqCoverageGap = Math.round(((totalAvail - correctCount) / totalAvail) * 100);

                // Priority formula
                let priorityScore = Math.round(
                    (weights.historicalFrequency * historicalFrequency) +
                    (weights.recentFrequency * recentFrequency) +
                    (weights.recurrence * recurrence) +
                    (weights.userWeakness * userWeakness) +
                    (weights.revisionDue * revisionDue) +
                    (weights.pyqCoverageGap * pyqCoverageGap)
                );

                // Adaptive penalty if mastered recently (accuracy >= 85% and attempted >= 6 and practiced recently)
                const isMastered = (attemptedCount >= 4 && accuracy >= 85 && revisionDue < 30);
                if (isMastered) {
                    priorityScore = Math.max(20, priorityScore - 30);
                }

                // Build explainable reasons
                const reasons = [];
                if (historicalFrequency >= 60) reasons.push('High historical GATE paper weightage');
                if (recurrence >= 70) reasons.push('Recurring pattern in recent GATE papers');
                if (attemptedCount > 0 && accuracy < 75) reasons.push(`Your current accuracy (${accuracy}%) is below 80% target`);
                if (topicMistakes.length > 0) reasons.push(`${topicMistakes.length} unresolved mistake(s) logged in Mistake Bank`);
                if (revisionDue >= 70 && attemptedCount > 0) reasons.push('Scheduled revision interval reached');
                if (attemptedCount === 0) reasons.push('Unattempted high-yield GATE topic');
                if (pyqCoverageGap >= 60) reasons.push(`${remainingPyqs} PYQs unattempted in coverage map`);

                topics.push({
                    id: top.id,
                    name: top.name,
                    subjectId: subj.id,
                    subjectName: subj.name,
                    subtopics: top.subtopics || [],
                    totalPyqs: topicPyqs.length,
                    attemptedCount,
                    correctCount,
                    wrongCount,
                    remainingPyqs,
                    accuracy,
                    topicMistakesCount: topicMistakes.length,
                    lastPracticedAt,
                    revisionDue,
                    pyqCoverageGap,
                    priorityScore,
                    isMastered,
                    signals: {
                        historicalFrequency,
                        recentFrequency,
                        recurrence,
                        userWeakness,
                        revisionDue,
                        pyqCoverageGap
                    },
                    reasons
                });
            });
        });

        return topics.sort((a, b) => b.priorityScore - a.priorityScore);
    },

    /**
     * Get Tonight's GATE Directive (Section 6, 14, 15)
     */
    getTonightDirective() {
        const topicPriorities = this.calculateTopicPriorities();
        const topTopic = topicPriorities[0] || {
            subjectId: 'os',
            subjectName: 'Operating Systems',
            id: 'os_process_scheduling',
            name: 'Process Scheduling',
            reasons: ['High historical recurrence + your recent accuracy is below target.'],
            priorityScore: 84
        };

        const todayStr = (typeof DateUtils !== 'undefined') ? DateUtils.todayIST() : new Date().toISOString().split('T')[0];
        
        // Check if user already solved a GATE session today
        const attempts = (typeof Store !== 'undefined' && Store.getGatePyqAttempts) ? Store.getGatePyqAttempts() : [];
        const todayAttempts = attempts.filter(a => (a.attemptedAt || '').startsWith(todayStr));
        const isCompletedTonight = todayAttempts.length >= 4;

        let sessionStats = null;
        if (isCompletedTonight) {
            const correct = todayAttempts.filter(a => a.isCorrect).length;
            const wrong = todayAttempts.filter(a => !a.isCorrect && a.status !== 'SKIPPED').length;
            const acc = Math.round((correct / todayAttempts.length) * 100);
            sessionStats = {
                attempted: todayAttempts.length,
                correct,
                wrong,
                accuracy: acc,
                topic: topTopic.name
            };
        }

        const primaryReason = topTopic.reasons?.[0] || 'High historical recurrence + your recent accuracy is below target.';

        return {
            subjectId: topTopic.subjectId,
            subjectName: topTopic.subjectName,
            subject: {
                id: topTopic.subjectId,
                name: topTopic.subjectName,
                toString() { return topTopic.subjectName; }
            },
            topicId: topTopic.id,
            topicName: topTopic.name,
            topic: {
                id: topTopic.id,
                name: topTopic.name,
                toString() { return topTopic.name; }
            },
            pyqTarget: (typeof GATE_CONFIG !== 'undefined') ? GATE_CONFIG.DEFAULT_SESSION_TARGET : 8,
            targetPyqs: (typeof GATE_CONFIG !== 'undefined') ? GATE_CONFIG.DEFAULT_SESSION_TARGET : 8,
            targetAccuracy: (typeof GATE_CONFIG !== 'undefined') ? GATE_CONFIG.TARGET_ACCURACY_PERCENT : 80,
            durationMinutes: (typeof GATE_CONFIG !== 'undefined') ? GATE_CONFIG.SESSION_DURATION_MINUTES : 90,
            suggestedDurationMinutes: (typeof GATE_CONFIG !== 'undefined') ? GATE_CONFIG.SESSION_DURATION_MINUTES : 90,
            reason: primaryReason,
            reasonsList: topTopic.reasons,
            priorityScore: topTopic.priorityScore,
            isCompletedTonight,
            sessionStats
        };
    },

    /**
     * Get all available PYQs (Built-in + User custom imported)
     */
    getAllPyqs() {
        const builtin = (typeof GATE_PYQ_DATASET !== 'undefined') ? GATE_PYQ_DATASET : [];
        const custom = (typeof Store !== 'undefined' && Store.getGateCustomPyqs) ? Store.getGateCustomPyqs() : [];
        return [...builtin, ...custom];
    },

    // =========================================================================
    // 2. TODAY'S COMMAND DIRECTIVE CARD (Section 15)
    // =========================================================================

    renderTodayCard() {
        const container = document.getElementById('todayGateDirectiveWidget');
        if (!container) return;

        const directive = this.getTonightDirective();

        if (directive.isCompletedTonight && directive.sessionStats) {
            container.innerHTML = `
                <div class="gate-directive-card completed">
                    <div class="gate-directive-header">
                        <div class="gate-dir-eyebrow">
                            <span class="gate-pulse-dot done"></span>
                            <span>GATE 2027 // TONIGHT · COMPLETED</span>
                        </div>
                        <span class="gate-time-slot">10:30 PM – 12:00 AM</span>
                    </div>

                    <div class="gate-directive-body">
                        <div class="gate-dir-subj-row">
                            <span class="gate-dir-subj">${directive.subject.toUpperCase()}</span>
                            <span class="gate-dir-arrow">→</span>
                            <span class="gate-dir-topic">${directive.topic}</span>
                        </div>

                        <div class="gate-session-result-pill-row">
                            <span class="gate-res-pill correct">✓ ${directive.sessionStats.attempted} PYQs completed</span>
                            <span class="gate-res-pill correct">✓ ${directive.sessionStats.correct} correct</span>
                            ${directive.sessionStats.wrong > 0 ? `<span class="gate-res-pill warning">⚠ ${directive.sessionStats.wrong} mistake(s)</span>` : ''}
                            <span class="gate-res-pill info">${directive.sessionStats.accuracy}% accuracy</span>
                        </div>

                        <div class="gate-next-rec-box">
                            <b>Next Recommendation:</b> Revise ${directive.topic} weak concepts and solve targeted PYQs tomorrow.
                        </div>
                    </div>

                    <div class="gate-directive-actions">
                        <button class="btn-primary" onclick="GatePlannerEngine.startPyqSession('${directive.subjectId}', '${directive.topicId}', 5)">
                            <span>🔄</span>
                            <span>Practice 5 More PYQs</span>
                        </button>
                        <button class="action-btn-ghost" onclick="App.switchView('gate')">
                            <span>Open GATE Planner →</span>
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="gate-directive-card">
                <div class="gate-directive-header">
                    <div class="gate-dir-eyebrow">
                        <span class="gate-pulse-dot"></span>
                        <span>GATE 2027 // TONIGHT</span>
                    </div>
                    <span class="gate-time-slot">10:30 PM – 12:00 AM</span>
                </div>

                <div class="gate-directive-body">
                    <div class="gate-dir-subj-row">
                        <span class="gate-dir-subj">${directive.subject.toUpperCase()}</span>
                        <span class="gate-dir-arrow">→</span>
                        <span class="gate-dir-topic">${directive.topic}</span>
                    </div>

                    <div class="gate-dir-target-strip">
                        <div class="gate-target-item">
                            <span class="gt-label">Objective</span>
                            <span class="gt-val">Solve ${directive.targetPyqs} PYQs</span>
                        </div>
                        <div class="gate-target-item">
                            <span class="gt-label">Target Accuracy</span>
                            <span class="gt-val">≥ ${directive.targetAccuracy}%</span>
                        </div>
                        <div class="gate-target-item">
                            <span class="gt-label">Duration</span>
                            <span class="gt-val">${directive.durationMinutes} mins</span>
                        </div>
                        <div class="gate-target-item">
                            <span class="gt-label">Priority Score</span>
                            <span class="gt-val accent">${directive.priorityScore} / 100</span>
                        </div>
                    </div>

                    <div class="gate-dir-reason-box">
                        <span class="gate-reason-icon">💡</span>
                        <div class="gate-reason-content">
                            <b>Why this topic tonight?</b>
                            <p>${directive.reason}</p>
                        </div>
                    </div>
                </div>

                <div class="gate-directive-actions">
                    <button class="btn-primary gate-btn-start-hero" id="btnStartGateTonightSession" onclick="GatePlannerEngine.startPyqSession('${directive.subjectId}', '${directive.topicId}', ${directive.targetPyqs})">
                        <span>▶</span>
                        <span>START PYQ SESSION</span>
                    </button>
                    <button class="action-btn-ghost" onclick="App.switchView('gate')">
                        <span>View Full GATE Planner →</span>
                    </button>
                </div>
            </div>
        `;
    },

    // =========================================================================
    // 3. PYQ SESSION WORKSPACE ENGINE (Section 6 & 7)
    // =========================================================================

    /**
     * Start a focused PYQ workspace session
     */
    startPyqSession(subjectId, topicId, count = 8) {
        const allPyqs = this.getAllPyqs();
        
        // Select matching PYQs for this topic
        let selectedPyqs = allPyqs.filter(q => q.topicId === topicId);
        
        // Fallback: If fewer questions available for this specific topic, supplement with subject PYQs
        if (selectedPyqs.length < count && subjectId) {
            const extra = allPyqs.filter(q => q.subjectId === subjectId && q.topicId !== topicId);
            selectedPyqs = [...selectedPyqs, ...extra];
        }

        // Fallback: If still under count, add other real GATE PYQs
        if (selectedPyqs.length < count) {
            const rem = allPyqs.filter(q => !selectedPyqs.some(s => s.id === q.id));
            selectedPyqs = [...selectedPyqs, ...rem];
        }

        const sessionPyqs = selectedPyqs.slice(0, count);

        if (sessionPyqs.length === 0) {
            showToast('No PYQs available for this topic. Import real PYQs below.', 'warning');
            return;
        }

        this.activeSession = {
            id: 'gate_sess_' + Date.now(),
            subjectId,
            topicId,
            subjectName: sessionPyqs[0].subjectName || 'Operating Systems',
            topicName: sessionPyqs[0].topicName || 'Process Scheduling',
            pyqs: sessionPyqs,
            currentIndex: 0,
            startTime: Date.now(),
            questionStartTime: Date.now(),
            results: [],
            isFinished: false
        };

        this.sessionSeconds = 0;
        this.questionSeconds = 0;
        this.startTimers();

        // Also initiate linked study session in StudySessionEngine if available
        if (typeof StudySessionEngine !== 'undefined' && StudySessionEngine.startDirectSession) {
            StudySessionEngine.startDirectSession('GATE', this.activeSession.subjectName, this.activeSession.topicName, null);
        }

        this.openWorkspaceModal();
        this.renderCurrentQuestion();
    },

    startTimers() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.sessionSeconds++;
            this.questionSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    },

    stopTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateTimerDisplay() {
        const qEl = document.getElementById('gatePyqQuestionTimer');
        if (qEl) {
            const m = Math.floor(this.questionSeconds / 60);
            const s = this.questionSeconds % 60;
            qEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        const sEl = document.getElementById('gatePyqSessionTimer');
        if (sEl) {
            const sm = Math.floor(this.sessionSeconds / 60);
            const ss = this.sessionSeconds % 60;
            sEl.textContent = `${String(sm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        }
    },

    openWorkspaceModal() {
        let modal = document.getElementById('gatePyqWorkspaceModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'gatePyqWorkspaceModal';
            modal.className = 'modal-overlay gate-workspace-modal';
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeWorkspaceModal() {
        this.stopTimers();
        const modal = document.getElementById('gatePyqWorkspaceModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    renderCurrentQuestion() {
        const modal = document.getElementById('gatePyqWorkspaceModal');
        if (!modal || !this.activeSession) return;

        const { pyqs, currentIndex } = this.activeSession;
        const currentPyq = pyqs[currentIndex];
        this.questionSeconds = 0; // reset per-question timer

        const totalQ = pyqs.length;
        const qNum = currentIndex + 1;
        const typeBadge = currentPyq.type || 'MCQ';
        const marks = currentPyq.marks || 1;

        // Render MCQ options or NAT input
        let inputHtml = '';
        if (typeBadge === 'MCQ' || typeBadge === 'MSQ') {
            inputHtml = `
                <div class="gate-options-grid">
                    ${(currentPyq.options || []).map(opt => `
                        <label class="gate-option-pill" for="opt_${opt.key}">
                            <input type="${typeBadge === 'MSQ' ? 'checkbox' : 'radio'}" id="opt_${opt.key}" name="gatePyqOption" value="${opt.key}">
                            <span class="gate-opt-key">${opt.key}</span>
                            <span class="gate-opt-text">${opt.text}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else {
            inputHtml = `
                <div class="gate-nat-box">
                    <label class="form-label" for="natAnswerInput">Enter Numerical Answer:</label>
                    <input type="text" id="natAnswerInput" class="form-input gate-nat-input" placeholder="e.g. 106 or 5.33" autocomplete="off">
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-window gate-workspace-window">
                <!-- Workspace Topbar -->
                <div class="gate-workspace-topbar">
                    <div class="gate-ws-title-group">
                        <span class="gate-brand-pill">⚡ FORGE GATE WORKSPACE</span>
                        <div class="gate-ws-heading">
                            <span>${this.activeSession.subjectName}</span>
                            <span class="sep">/</span>
                            <span class="topic">${this.activeSession.topicName}</span>
                        </div>
                    </div>
                    <div class="gate-ws-meta-group">
                        <div class="gate-timer-box">
                            <span class="label">Question:</span>
                            <span class="timer" id="gatePyqQuestionTimer">00:00</span>
                        </div>
                        <div class="gate-timer-box">
                            <span class="label">Total:</span>
                            <span class="timer" id="gatePyqSessionTimer">00:00</span>
                        </div>
                        <button class="btn-close-modal" onclick="GatePlannerEngine.closeWorkspaceModal()" title="Exit Workspace">✕</button>
                    </div>
                </div>

                <!-- Progress Tracker Strip -->
                <div class="gate-ws-progress-strip">
                    <div class="gate-ws-qindex">PYQ ${qNum} of ${totalQ}</div>
                    <div class="gate-ws-bar-track">
                        <div class="gate-ws-bar-fill" style="width: ${((qNum - 1) / totalQ) * 100}%"></div>
                    </div>
                    <div class="gate-ws-badges">
                        <span class="gate-badge-year">GATE ${currentPyq.year || 2024} · ${currentPyq.session || 'Set 1'}</span>
                        <span class="gate-badge-qnum">Q${currentPyq.questionNumber || qNum}</span>
                        <span class="gate-badge-type">${typeBadge}</span>
                        <span class="gate-badge-marks">${marks} Mark${marks > 1 ? 's' : ''}</span>
                    </div>
                </div>

                <!-- Main Problem Workbench -->
                <div class="gate-ws-body">
                    <div class="gate-problem-card">
                        <div class="gate-problem-text">
                            ${this.escapeHtml(currentPyq.questionText).replace(/\n/g, '<br>')}
                        </div>

                        ${inputHtml}

                        <!-- Answer Reveal & Solution Concept Drawer -->
                        <div id="gateSolutionDrawer" style="display: none; margin-top: 18px;" class="gate-solution-box">
                            <div class="gate-sol-header">
                                <span class="gate-sol-badge">Verified Official Solution</span>
                                <span class="gate-sol-ans">Correct Key: <b>${currentPyq.correctAnswer}</b></span>
                            </div>
                            <div class="gate-sol-body">
                                ${this.escapeHtml(currentPyq.explanation || 'Step-by-step conceptual solution is being retrieved.').replace(/\n/g, '<br>')}
                            </div>
                        </div>

                        <!-- Mistake Reason Form (Shown when user clicks Wrong) -->
                        <div id="gateMistakeCapturePanel" style="display: none; margin-top: 18px;" class="gate-mistake-panel">
                            <div class="gate-mistake-panel-title">
                                <span>⚠️</span>
                                <b>What caused this mistake? (Helps FORGE defend your weaknesses)</b>
                            </div>
                            <div class="gate-mistake-cats-grid">
                                ${(typeof GATE_CONFIG !== 'undefined' ? GATE_CONFIG.MISTAKE_CATEGORIES : []).map((cat, idx) => `
                                    <label class="gate-mistake-cat-chip" for="mcat_${idx}">
                                        <input type="radio" name="gateMistakeCat" id="mcat_${idx}" value="${cat}" ${idx === 0 ? 'checked' : ''}>
                                        <span>${cat}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <div style="margin-top: 10px;">
                                <input type="text" id="gateMistakeNotes" class="form-input" placeholder="Personal note / what went wrong (e.g. forgot context switch overhead or wrong waiting time formula)...">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Evaluation Bar -->
                <div class="gate-ws-footer">
                    <div class="gate-ws-confidence-box">
                        <span class="conf-label">Confidence:</span>
                        <select id="gatePyqConfidence" class="status-select" style="width: auto;">
                            <option value="HIGH">High Confidence</option>
                            <option value="MEDIUM" selected>Medium Confidence</option>
                            <option value="LOW">Low / Guessing</option>
                        </select>
                        <button type="button" class="action-btn-ghost" id="btnRevealSolution" onclick="GatePlannerEngine.toggleSolutionDrawer()">
                            <span>💡 Reveal Answer</span>
                        </button>
                    </div>

                    <div class="gate-ws-eval-actions">
                        <button type="button" class="btn-eval-pill correct" onclick="GatePlannerEngine.recordQuestionResult('CORRECT')">
                            <span>✓ Correct</span>
                        </button>
                        <button type="button" class="btn-eval-pill wrong" onclick="GatePlannerEngine.handleWrongClicked()">
                            <span>✗ Wrong</span>
                        </button>
                        <button type="button" class="btn-eval-pill skip" onclick="GatePlannerEngine.recordQuestionResult('SKIPPED')">
                            <span>↷ Skip</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.updateTimerDisplay();
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    toggleSolutionDrawer() {
        const drawer = document.getElementById('gateSolutionDrawer');
        if (drawer) {
            drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
        }
    },

    handleWrongClicked() {
        const panel = document.getElementById('gateMistakeCapturePanel');
        const drawer = document.getElementById('gateSolutionDrawer');
        if (drawer) drawer.style.display = 'block';

        if (panel && panel.style.display === 'none') {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            showToast('Select mistake category and click Confirm Wrong', 'warning');
            
            // Swap action buttons to confirm
            const evalActions = document.querySelector('.gate-ws-eval-actions');
            if (evalActions) {
                evalActions.innerHTML = `
                    <button type="button" class="btn-primary" style="background: var(--rose);" onclick="GatePlannerEngine.confirmWrongResult()">
                        <span>Confirm & Log Wrong →</span>
                    </button>
                `;
            }
        } else {
            this.confirmWrongResult();
        }
    },

    confirmWrongResult() {
        const selectedCat = document.querySelector('input[name="gateMistakeCat"]:checked')?.value || 'Conceptual mistake';
        const notes = document.getElementById('gateMistakeNotes')?.value || '';
        this.recordQuestionResult('WRONG', selectedCat, notes);
    },

    recordQuestionResult(status, mistakeType = null, notes = '') {
        if (!this.activeSession) return;

        const { pyqs, currentIndex } = this.activeSession;
        const currentPyq = pyqs[currentIndex];
        const timeTaken = Math.max(1, this.questionSeconds);
        const confidence = document.getElementById('gatePyqConfidence')?.value || 'MEDIUM';

        const isCorrect = (status === 'CORRECT');

        const attemptRecord = {
            id: 'gate_att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            userId: (typeof SupabaseService !== 'undefined' && SupabaseService.getUserId) ? SupabaseService.getUserId() : 'local_user',
            pyqId: currentPyq.id,
            subjectId: currentPyq.subjectId,
            topicId: currentPyq.topicId,
            year: currentPyq.year,
            attemptedAt: new Date().toISOString(),
            status,
            isCorrect,
            timeTakenSeconds: timeTaken,
            confidence,
            mistakeType: isCorrect ? null : mistakeType,
            notes,
            revisionDueAt: isCorrect ? null : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            pyqSnapshot: currentPyq
        };

        // Persist attempt locally into Store
        if (typeof Store !== 'undefined' && Store.recordGatePyqAttempt) {
            Store.recordGatePyqAttempt(attemptRecord);
        }

        // Push to cloud sync engine if available
        if (typeof window !== 'undefined' && window.SyncEngine && window.SyncEngine.pushGatePyqAttempt) {
            window.SyncEngine.pushGatePyqAttempt(attemptRecord);
        }

        this.activeSession.results.push(attemptRecord);

        // Move to next question or complete
        if (currentIndex + 1 < pyqs.length) {
            this.activeSession.currentIndex++;
            this.renderCurrentQuestion();
        } else {
            this.completeSession();
        }
    },

    completeSession() {
        this.stopTimers();
        if (!this.activeSession) return;

        const results = this.activeSession.results || [];
        const total = results.length;
        const correct = results.filter(r => r.isCorrect).length;
        const wrong = results.filter(r => !r.isCorrect && r.status !== 'SKIPPED').length;
        const skipped = results.filter(r => r.status === 'SKIPPED').length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const avgTimeSec = total > 0 ? Math.round(this.sessionSeconds / total) : 0;

        const avgMins = Math.floor(avgTimeSec / 60);
        const avgRemSec = avgTimeSec % 60;
        const avgTimeFormatted = `${avgMins}m ${avgRemSec}s`;

        // Detect prominent weaknesses from mistakes
        const mistakeCounts = {};
        results.filter(r => r.mistakeType).forEach(r => {
            mistakeCounts[r.mistakeType] = (mistakeCounts[r.mistakeType] || 0) + 1;
        });
        const detectedWeakness = Object.keys(mistakeCounts).length > 0
            ? Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).map(e => `${e[0]} (${e[1]})`).join(', ')
            : 'None detected';

        // Auto-save session into Store.studySessions
        if (typeof Store !== 'undefined' && Store.saveStudySession) {
            const sessionRecord = {
                id: 'sess_' + Date.now(),
                date: (typeof DateUtils !== 'undefined') ? DateUtils.todayIST() : new Date().toISOString().split('T')[0],
                subject: `GATE: ${this.activeSession.subjectName}`,
                topic: this.activeSession.topicName,
                activeSeconds: this.sessionSeconds,
                breakSeconds: 0,
                cameraEnabled: false,
                presenceRate: 100,
                aiInsight: `Completed ${total} GATE PYQs on ${this.activeSession.topicName}. Accuracy: ${accuracy}%. Average solving speed: ${avgTimeFormatted}.`,
                startTime: new Date(this.activeSession.startTime).toTimeString().substring(0, 5),
                endTime: new Date().toTimeString().substring(0, 5)
            };
            Store.saveStudySession(sessionRecord);
        }

        // Render Summary Modal
        const modal = document.getElementById('gatePyqWorkspaceModal');
        if (!modal) return;

        const wrongAttempts = results.filter(r => !r.isCorrect && r.status !== 'SKIPPED');

        modal.innerHTML = `
            <div class="modal-window gate-summary-window">
                <div class="gate-summary-header">
                    <span class="gate-summary-eyebrow">⚡ FORGE GATE ENGINE</span>
                    <h2 class="gate-summary-title">GATE SESSION COMPLETE</h2>
                    <p class="gate-summary-sub">${this.activeSession.subjectName} → ${this.activeSession.topicName}</p>
                </div>

                <div class="gate-summary-metrics-grid">
                    <div class="gate-sm-card">
                        <span class="sm-label">Total Questions</span>
                        <span class="sm-val">${total}</span>
                    </div>
                    <div class="gate-sm-card">
                        <span class="sm-label">Correct</span>
                        <span class="sm-val success">${correct}</span>
                    </div>
                    <div class="gate-sm-card">
                        <span class="sm-label">Wrong</span>
                        <span class="sm-val danger">${wrong}</span>
                    </div>
                    <div class="gate-sm-card">
                        <span class="sm-label">Skipped</span>
                        <span class="sm-val muted">${skipped}</span>
                    </div>
                    <div class="gate-sm-card">
                        <span class="sm-label">Accuracy</span>
                        <span class="sm-val ${accuracy >= 80 ? 'success' : 'warning'}">${accuracy}%</span>
                    </div>
                    <div class="gate-sm-card">
                        <span class="sm-label">Average Time</span>
                        <span class="sm-val">${avgTimeFormatted}</span>
                    </div>
                </div>

                <div class="gate-summary-insights">
                    <div class="gate-insight-item">
                        <b>Weakness Detected:</b>
                        <span>${detectedWeakness}</span>
                    </div>
                    <div class="gate-insight-item">
                        <b>Next Action:</b>
                        <span>${accuracy < 80 ? `Revise ${this.activeSession.topicName} core formulas and re-solve 5 targeted PYQs.` : `Great mastery (${accuracy}%)! Move forward to next high-priority GATE topic.`}</span>
                    </div>
                </div>

                ${wrongAttempts.length > 0 ? `
                    <div class="gate-mistake-bank-callout">
                        <div>
                            <h4 style="margin: 0 0 4px 0; color: #fff;">🛡️ Add to Mistake Bank</h4>
                            <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                                Synchronize ${wrongAttempts.length} wrong answer(s) into your authentic FORGE Mistake Bank for spaced revision.
                            </p>
                        </div>
                        <button type="button" class="btn-primary" id="btnAddMistakesBankDirect" onclick="GatePlannerEngine.addSessionMistakesToBank()">
                            <span>＋ Add ${wrongAttempts.length} Mistakes to Mistake Bank</span>
                        </button>
                    </div>
                ` : ''}

                <div class="gate-summary-footer">
                    <button type="button" class="btn-primary" onclick="GatePlannerEngine.finishAndCloseWorkspace()">
                        <span>✓ Finish & Update Planner</span>
                    </button>
                </div>
            </div>
        `;
    },

    addSessionMistakesToBank() {
        if (!this.activeSession) return;
        const wrongAttempts = (this.activeSession.results || []).filter(r => !r.isCorrect && r.status !== 'SKIPPED');

        let addedCount = 0;
        wrongAttempts.forEach(att => {
            const pyq = att.pyqSnapshot || {};
            const entry = {
                question: pyq.questionText || 'GATE PYQ Question',
                subject: `GATE: ${pyq.subjectName || this.activeSession.subjectName}`,
                topic: pyq.topicName || this.activeSession.topicName,
                source: `GATE ${pyq.year || 2024} ${pyq.session || 'Set 1'} Q${pyq.questionNumber || ''}`,
                date: (typeof DateUtils !== 'undefined') ? DateUtils.todayIST() : new Date().toISOString().split('T')[0],
                userAnswer: 'Attempt marked wrong',
                correctAnswer: pyq.correctAnswer || 'See solution',
                explanation: pyq.explanation || '',
                mistakeType: att.mistakeType || 'Conceptual mistake',
                personalNote: att.notes || '',
                revisitDate: att.revisionDueAt || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : '')
            };

            if (typeof Store !== 'undefined' && Store.addMistake) {
                Store.addMistake(entry);
                addedCount++;
            }
        });

        showToast(`Added ${addedCount} mistake(s) to Mistake Bank!`, 'success');
        const calloutBtn = document.getElementById('btnAddMistakesBankDirect');
        if (calloutBtn) {
            calloutBtn.disabled = true;
            calloutBtn.textContent = '✓ Added to Mistake Bank';
        }
    },

    finishAndCloseWorkspace() {
        this.closeWorkspaceModal();
        this.activeSession = null;
        showToast('GATE Progress & Priority Scores updated successfully!', 'success');

        // Re-render Today Directive and GATE view if active
        this.renderTodayCard();
        if (typeof window.App !== 'undefined' && window.App.activeView === 'gate') {
            this.renderPlannerPage();
        }
    },

    // =========================================================================
    // 4. GATE PLANNER FULL VIEW (Section 16, 17, 18)
    // =========================================================================

    renderPlannerPage() {
        const container = document.getElementById('view-gate');
        if (!container) return;

        const subjectPriorities = this.calculateSubjectPriorities();
        const topicPriorities = this.calculateTopicPriorities();
        const attempts = (typeof Store !== 'undefined' && Store.getGatePyqAttempts) ? Store.getGatePyqAttempts() : [];
        const allPyqs = this.getAllPyqs();

        const totalPyqs = allPyqs.length;
        const totalAttempted = attempts.length;
        const totalCorrect = attempts.filter(a => a.isCorrect).length;
        const totalWrong = attempts.filter(a => !a.isCorrect && a.status !== 'SKIPPED').length;
        const totalAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
        const masteredTopics = topicPriorities.filter(t => t.isMastered).length;
        const weakTopics = topicPriorities.filter(t => t.attemptedCount > 0 && t.accuracy < 70).length;
        const revisionDueTopics = topicPriorities.filter(t => t.revisionDue >= 70).length;

        const directive = this.getTonightDirective();

        container.innerHTML = `
            <div class="gate-planner-header">
                <div>
                    <span class="gate-hero-pill">🎓 FORGE GATE 2027 · PYQ-FIRST STUDY ENGINE</span>
                    <h2 class="gate-view-title">GATE 2027 Study Planner & Command</h2>
                    <p class="gate-view-desc">
                        Official syllabus boundaries + multi-year historical paper analysis + your real PYQ performance.
                        Every study block executes directly into targeted PYQs.
                    </p>
                </div>
                <div class="gate-header-action-row">
                    <button class="action-btn-ghost" onclick="GatePlannerEngine.renderPlannerPage()">
                        <span>🔄 Refresh</span>
                    </button>
                    <button class="btn-primary" onclick="GatePlannerEngine.startPyqSession('${directive.subjectId}', '${directive.topicId}', 8)">
                        <span>▶ Start Tonight's Session</span>
                    </button>
                </div>
            </div>

            <!-- Top Metric Scoreboard -->
            <div class="gate-stats-grid">
                <div class="gate-stat-card">
                    <div class="gs-label">PYQ Solved</div>
                    <div class="gs-val accent">${totalAttempted} / ${totalPyqs}</div>
                    <div class="gs-sub">${Math.round((totalAttempted / Math.max(1, totalPyqs)) * 100)}% overall coverage</div>
                </div>
                <div class="gate-stat-card">
                    <div class="gs-label">Overall Accuracy</div>
                    <div class="gs-val ${totalAccuracy >= 80 ? 'success' : 'warning'}">${totalAccuracy}%</div>
                    <div class="gs-sub">${totalCorrect} correct · ${totalWrong} mistakes</div>
                </div>
                <div class="gate-stat-card">
                    <div class="gs-label">Mastered Topics</div>
                    <div class="gs-val success">${masteredTopics} / ${topicPriorities.length}</div>
                    <div class="gs-sub">≥85% accuracy achieved</div>
                </div>
                <div class="gate-stat-card">
                    <div class="gs-label">Weak Topics</div>
                    <div class="gs-val danger">${weakTopics}</div>
                    <div class="gs-sub">Accuracy &lt; 70% or errors</div>
                </div>
                <div class="gate-stat-card">
                    <div class="gs-label">Revision Due</div>
                    <div class="gs-val warning">${revisionDueTopics}</div>
                    <div class="gs-sub">Scheduled spaced review</div>
                </div>
            </div>

            <!-- Today's GATE Hero Directive Card -->
            <div style="margin-bottom: 24px;">
                <div class="section-title-wrap">
                    <h3>⚡ Today's Execution Directive</h3>
                    <small>Calculated from historical GATE trends + your actual accuracy</small>
                </div>
                <div id="gatePlannerHeroDirective">
                    <div class="gate-directive-card">
                        <div class="gate-directive-header">
                            <div class="gate-dir-eyebrow">
                                <span class="gate-pulse-dot"></span>
                                <span>RECOMMENDED TONIGHT · 10:30 PM – 12:00 AM</span>
                            </div>
                            <span class="gate-time-slot">90 Minutes Block</span>
                        </div>
                        <div class="gate-directive-body">
                            <div class="gate-dir-subj-row">
                                <span class="gate-dir-subj">${directive.subject.toUpperCase()}</span>
                                <span class="gate-dir-arrow">→</span>
                                <span class="gate-dir-topic">${directive.topic}</span>
                            </div>
                            <div class="gate-dir-target-strip">
                                <div class="gate-target-item">
                                    <span class="gt-label">Objective</span>
                                    <span class="gt-val">Solve 8 PYQs</span>
                                </div>
                                <div class="gate-target-item">
                                    <span class="gt-label">Target Accuracy</span>
                                    <span class="gt-val">≥ 80%</span>
                                </div>
                                <div class="gate-target-item">
                                    <span class="gt-label">Priority Score</span>
                                    <span class="gt-val accent">${directive.priorityScore} / 100</span>
                                </div>
                            </div>
                            <div class="gate-dir-reason-box">
                                <span class="gate-reason-icon">💡</span>
                                <div class="gate-reason-content">
                                    <b>Reason:</b> ${directive.reason}
                                </div>
                            </div>
                        </div>
                        <div class="gate-directive-actions">
                            <button class="btn-primary" onclick="GatePlannerEngine.startPyqSession('${directive.subjectId}', '${directive.topicId}', 8)">
                                <span>▶ START PYQ SESSION</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 1. Subject Priority Grid (Section 18) -->
            <div style="margin-bottom: 32px;">
                <div class="section-title-wrap">
                    <h3>📊 Subject Priority Matrix</h3>
                    <small>FORGE study-planning heuristic (not a prediction of GATE 2027 paper)</small>
                </div>
                <div class="gate-subjects-grid">
                    ${subjectPriorities.map(subj => `
                        <div class="gate-subj-card">
                            <div class="gsc-top">
                                <div class="gsc-icon-name">
                                    <span class="gsc-icon">${subj.icon}</span>
                                    <div>
                                        <div class="gsc-name">${subj.name}</div>
                                        <div class="gsc-sub">${subj.topicsCount} Topics · ${subj.totalPyqs} PYQs</div>
                                    </div>
                                </div>
                                <span class="gate-priority-badge ${subj.priorityLevel.toLowerCase()}">${subj.priorityLevel}</span>
                            </div>

                            <div class="gsc-metrics">
                                <div class="gsc-row">
                                    <span>Historical Weight:</span>
                                    <b>${subj.historicalWeight}%</b>
                                </div>
                                <div class="gsc-row">
                                    <span>Recent Trend:</span>
                                    <b>${subj.recentAvgMarks} Marks / Paper</b>
                                </div>
                                <div class="gsc-row">
                                    <span>Your Accuracy:</span>
                                    <b class="${subj.accuracy >= 80 ? 'success' : subj.attemptedCount === 0 ? 'muted' : 'warning'}">${subj.attemptedCount > 0 ? `${subj.accuracy}%` : 'Untested'}</b>
                                </div>
                                <div class="gsc-row">
                                    <span>PYQs Remaining:</span>
                                    <b>${subj.remainingPyqs}</b>
                                </div>
                                <div class="gsc-row">
                                    <span>Revision Status:</span>
                                    <b class="${subj.revisionStatus === 'DUE' ? 'danger' : 'success'}">${subj.revisionStatus}</b>
                                </div>
                                <div class="gsc-row" style="border-top: 1px solid var(--border-subtle); padding-top: 6px; margin-top: 4px;">
                                    <span>Priority Score:</span>
                                    <b class="accent">${subj.priorityScore} / 100</b>
                                </div>
                            </div>

                            <button class="btn-primary gsc-btn" onclick="GatePlannerEngine.startPyqSession('${subj.id}', null, 8)">
                                <span>▶ START PYQs</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 2. Historical Paper Analysis View (Section 17) -->
            <div style="margin-bottom: 32px;">
                <div class="section-title-wrap">
                    <h3>📜 Historical Paper Analysis</h3>
                    <small>Historical distribution — not a guarantee of GATE 2027</small>
                </div>
                <div class="gate-historical-box">
                    <div class="gate-hist-year-tabs">
                        <button class="gate-year-tab ${this.activeHistoricalYear === 'all' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('all')">All Years (2021–2026)</button>
                        <button class="gate-year-tab ${this.activeHistoricalYear === '2026' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('2026')">2026</button>
                        <button class="gate-year-tab ${this.activeHistoricalYear === '2025' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('2025')">2025</button>
                        <button class="gate-year-tab ${this.activeHistoricalYear === '2024' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('2024')">2024</button>
                        <button class="gate-year-tab ${this.activeHistoricalYear === '2023' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('2023')">2023</button>
                        <button class="gate-year-tab ${this.activeHistoricalYear === '2022' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('2022')">2022</button>
                        <button class="gate-year-tab ${this.activeHistoricalYear === '2021' ? 'active' : ''}" onclick="GatePlannerEngine.setHistoricalYear('2021')">2021</button>
                    </div>

                    <div class="gate-hist-bars-container" id="gateHistBarsContainer">
                        ${this.renderHistoricalBarsHtml()}
                    </div>
                </div>
            </div>

            <!-- 3. Topic Priority Ranking Table -->
            <div style="margin-bottom: 32px;">
                <div class="section-title-wrap">
                    <h3>🎯 Topic Priority Queue & Adaptive Ranking</h3>
                    <small>Top ranked topics are automatically scheduled into your daily time blocks</small>
                </div>
                <div class="gate-table-wrapper">
                    <table class="gate-priority-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Topic</th>
                                <th>Priority Score</th>
                                <th>Why Scheduled?</th>
                                <th>Your Accuracy</th>
                                <th>Coverage</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topicPriorities.slice(0, 15).map(top => `
                                <tr>
                                    <td><span class="gate-table-subj">${top.subjectName}</span></td>
                                    <td><b>${top.name}</b></td>
                                    <td><span class="gate-priority-score-pill">${top.priorityScore}</span></td>
                                    <td class="gate-reason-cell">${top.reasons[0] || 'Curriculum progression'}</td>
                                    <td>${top.attemptedCount > 0 ? `${top.accuracy}% (${top.attemptedCount} attempted)` : '<span style="color: var(--text-muted);">Untested</span>'}</td>
                                    <td>${top.correctCount} / ${top.totalPyqs} solved</td>
                                    <td>
                                        <button class="btn-table-start" onclick="GatePlannerEngine.startPyqSession('${top.subjectId}', '${top.id}', 8)">
                                            ▶ Start
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 4. PYQ Mistake Categories Breakdown (Section 10) -->
            <div style="margin-bottom: 32px;">
                <div class="section-title-wrap">
                    <h3>🛡️ Mistake Category Defense Breakdown</h3>
                    <small>Tracked across all your GATE PYQ attempts to eliminate recurring error patterns</small>
                </div>
                ${this.renderMistakeBreakdownHtml()}
            </div>
        `;
    },

    setHistoricalYear(year) {
        this.activeHistoricalYear = year;
        const container = document.getElementById('gateHistBarsContainer');
        if (container) {
            container.innerHTML = this.renderHistoricalBarsHtml();
        }
        document.querySelectorAll('.gate-year-tab').forEach(b => {
            b.classList.toggle('active', b.textContent.includes(year) || (year === 'all' && b.textContent.includes('All')));
        });
    },

    renderHistoricalBarsHtml() {
        const syllabus = (typeof GATE_SYLLABUS !== 'undefined') ? GATE_SYLLABUS : [];
        const allWeightage = (typeof GATE_HISTORICAL_WEIGHTAGE !== 'undefined') ? GATE_HISTORICAL_WEIGHTAGE : [];

        let papers = allWeightage;
        if (this.activeHistoricalYear !== 'all') {
            papers = allWeightage.filter(p => String(p.year) === String(this.activeHistoricalYear));
        }

        const subjectMarks = {};
        syllabus.forEach(s => { subjectMarks[s.id] = 0; });

        papers.forEach(p => {
            syllabus.forEach(s => {
                subjectMarks[s.id] += (p.marks?.[s.id] || 0);
            });
        });

        const numPapers = Math.max(1, papers.length);
        const avgList = syllabus.map(s => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
            avgMarks: Math.round((subjectMarks[s.id] / numPapers) * 10) / 10
        })).sort((a, b) => b.avgMarks - a.avgMarks);

        const maxMarks = Math.max(1, ...avgList.map(a => a.avgMarks));

        return `
            <div class="gate-bars-list">
                ${avgList.map(item => `
                    <div class="gate-bar-row">
                        <div class="gate-bar-label">
                            <span>${item.icon}</span>
                            <span>${item.name}</span>
                        </div>
                        <div class="gate-bar-track">
                            <div class="gate-bar-fill" style="width: ${(item.avgMarks / maxMarks) * 100}%"></div>
                        </div>
                        <div class="gate-bar-val">${item.avgMarks} marks</div>
                    </div>
                `).join('')}
            </div>
            <div class="gate-bar-disclaimer">
                ⚠️ ${GATE_CONFIG?.DISCLAIMER || 'Historical distribution — not a guarantee of GATE 2027'}
            </div>
        `;
    },

    renderMistakeBreakdownHtml() {
        const attempts = (typeof Store !== 'undefined' && Store.getGatePyqAttempts) ? Store.getGatePyqAttempts() : [];
        const cats = (typeof GATE_CONFIG !== 'undefined') ? GATE_CONFIG.MISTAKE_CATEGORIES : [];

        const catCounts = {};
        cats.forEach(c => { catCounts[c] = 0; });

        attempts.forEach(a => {
            if (a.mistakeType && catCounts[a.mistakeType] !== undefined) {
                catCounts[a.mistakeType]++;
            }
        });

        const totalMistakes = Object.values(catCounts).reduce((a, b) => a + b, 0);

        return `
            <div class="gate-mistake-breakdown-grid">
                ${cats.map(cat => {
                    const count = catCounts[cat] || 0;
                    const pct = totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0;
                    return `
                        <div class="gate-m-cat-card">
                            <div class="m-cat-header">
                                <span class="m-cat-name">${cat}</span>
                                <span class="m-cat-count">${count}</span>
                            </div>
                            <div class="m-cat-track">
                                <div class="m-cat-fill" style="width: ${pct}%"></div>
                            </div>
                            <div class="m-cat-footer">${pct}% of recorded errors</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.GatePlannerEngine = GatePlannerEngine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GatePlannerEngine };
}
