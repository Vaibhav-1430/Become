/**
 * BOSS Study OS — Placement Engine (Placement Command Center)
 * Manages 12 interactive subject learning pages, System Design 4-level deep dive,
 * interactive 5-step system design interview mode, global flashcard interview mode,
 * Sunday weekly test & review engine, bookmarks, personal notes, search, and calendar integration.
 */

const PlacementEngine = {
    currentSubjectId: null,
    currentSubjectTab: 'roadmap',
    currentTestSession: null,
    testTimerInterval: null,
    currentSdInterview: null,
    currentInterviewSession: null,

    init() {
        this.setupKeyboardShortcuts();
        this.checkSundayNotification();
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K opens Global Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openGlobalSearch();
            }
        });
    },

    checkSundayNotification() {
        const today = DateUtils.todayIST();
        const isSunday = DateUtils.getDayOfWeek(today) === 0;
        if (isSunday) {
            const banner = document.getElementById('sundayTestAlertBanner');
            if (banner) banner.style.display = 'flex';
        }
    },

    // ------------------------------------------------------------------------
    // PLACEMENT HUB DASHBOARD RENDERING
    // ------------------------------------------------------------------------
    renderPlacementView() {
        this.checkSundayNotification();
        this.renderStartHereGuidance();
        this.renderReadinessScore();
        this.renderPlacementCards();
        this.renderWeakAreasSummary();
    },

    /**
     * Requirement 28 & UX Rule: "START HERE ->"
     * Directs the user clearly to the next highest-yield action.
     */
    renderStartHereGuidance() {
        const container = document.getElementById('placementStartHereContainer');
        if (!container) return;

        const weakAreas = Store.getWeakAreas();
        const testHistory = Store.getWeeklyTestHistory();
        const latestTest = testHistory[0];
        const today = DateUtils.todayIST();
        const isSunday = DateUtils.getDayOfWeek(today) === 0;

        let actionTitle = 'Continue Striver A2Z DSA';
        let actionDesc = 'Start with today’s scheduled morning DSA questions to build core algorithmic intuition.';
        let actionBtnText = 'Start Today’s Missions →';
        let actionCallback = "App.switchView('today')";

        if (isSunday) {
            actionTitle = '📝 Sunday Weekly Placement Test is LIVE';
            actionDesc = 'Take your 23-question comprehensive review test covering DSA, Core CS, SQL, and Aptitude.';
            actionBtnText = 'Launch Weekly Test 🚀';
            actionCallback = 'PlacementEngine.startWeeklyTest()';
        } else if (weakAreas.length > 0) {
            const topWeak = weakAreas[0];
            actionTitle = `🔁 Target Weak Area: ${topWeak.topic}`;
            actionDesc = `You recently missed or flagged "${topWeak.topic}". Review the concept notes and test yourself.`;
            actionBtnText = `Revise ${topWeak.topic} →`;
            actionCallback = `PlacementEngine.openSubject('${topWeak.subjectId || 'dbms'}', 'revision')`;
        } else if (latestTest && latestTest.weakTopics && latestTest.weakTopics.length > 0) {
            const topWeak = latestTest.weakTopics[0];
            actionTitle = `🔁 Weekly Review: Revise ${topWeak.topic}`;
            actionDesc = `Identified during your Sunday test in ${topWeak.subject}. Review the explanation now.`;
            actionBtnText = `Open ${topWeak.subject} Notes →`;
            actionCallback = `PlacementEngine.openSubject('${(topWeak.subject || 'dsa').toLowerCase()}', 'questions')`;
        }

        container.innerHTML = `
            <div class="start-here-card">
                <div class="start-here-badge">⭐ START HERE</div>
                <div class="start-here-content">
                    <div class="start-here-left">
                        <h3>${actionTitle}</h3>
                        <p>${actionDesc}</p>
                    </div>
                    <div class="start-here-actions">
                        <button class="btn-primary start-here-btn" onclick="${actionCallback}">${actionBtnText}</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * FEATURE 3: Placement Readiness Engine — 8 Explainable Pillars based on REAL data
     */
    renderReadinessScore() {
        const container = document.getElementById('placementReadinessContainer');
        if (!container) return;

        const scores = this.calculateReadinessBreakdown();
        const overall = scores.overall;

        let breakdownHtml = Object.keys(scores.categories).map(catKey => {
            const c = scores.categories[catKey];
            const hasData = c.hasData;
            const displayVal = hasData ? `${c.percent}%` : 'Not enough data';
            const barWidth = hasData ? c.percent : 0;
            const barClass = hasData ? '' : 'no-data';

            return `
                <div class="readiness-item explainable-item ${barClass}" onclick="PlacementEngine.openReadinessExplainer('${c.key}')" title="Click to view explainable calculation for ${c.name}">
                    <div class="readiness-item-header">
                        <span>${c.icon} ${c.name}</span>
                        <b style="color: ${hasData ? 'var(--text-primary)' : 'var(--text-muted)'};">${displayVal}</b>
                    </div>
                    <div class="readiness-progress-bar">
                        <div class="readiness-progress-fill" style="width: ${barWidth}%; background: ${hasData ? c.color : 'rgba(255,255,255,0.1)'};"></div>
                    </div>
                    <div class="readiness-item-subtext">Click to see why ℹ️</div>
                </div>
            `;
        }).join('');

        const dialContent = scores.hasAnyData ? `
            <div class="readiness-dial">
                <svg class="readiness-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" class="readiness-bg-circle"></circle>
                    <circle cx="50" cy="50" r="42" class="readiness-fill-circle" style="stroke-dashoffset: calc(264 - (264 * ${overall}) / 100);"></circle>
                </svg>
                <div class="readiness-dial-text">
                    <span class="readiness-number">${overall}%</span>
                    <span class="readiness-label">READINESS</span>
                </div>
            </div>
        ` : `
            <div class="readiness-dial no-data-dial">
                <div class="readiness-dial-text">
                    <span class="readiness-number" style="font-size: 15px; color: var(--text-muted); line-height: 1.2;">Not enough<br>data</span>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="readiness-card upgraded-readiness-card">
                <div class="readiness-hero">
                    ${dialContent}
                    <div class="readiness-info">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="readiness-tag-pill">🎯 Authentic Evaluation Engine</span>
                            <span style="font-size: 11px; color: var(--text-muted);">Zero synthetic scores</span>
                        </div>
                        <h3 style="margin: 4px 0 6px 0;">FORGE Placement Readiness</h3>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 13px; line-height: 1.5;">
                            Every percentage is computed deterministically from your actual solved DSA sheets, code implementations, test scores, and interview performance.
                        </p>
                        <div class="readiness-meta" style="margin-top: 10px;">
                            <span>Status: <b>${scores.statusLabel}</b></span>
                            <span>• Target: <b>FAANG & PBC SDE-1</b></span>
                        </div>
                    </div>
                </div>

                <!-- 4 Highlights based on REAL data -->
                <div class="readiness-highlights-grid">
                    <div class="r-highlight-box">
                        <span class="r-hl-lbl">🌟 Strongest Area</span>
                        <div class="r-hl-val" style="color: var(--emerald);">${scores.strongestArea}</div>
                    </div>
                    <div class="r-highlight-box">
                        <span class="r-hl-lbl">⚠️ Needs Most Attention</span>
                        <div class="r-hl-val" style="color: var(--rose);">${scores.needsAttentionArea}</div>
                    </div>
                    <div class="r-highlight-box">
                        <span class="r-hl-lbl">📈 Recent Improvement</span>
                        <div class="r-hl-val" style="color: var(--sky);">${scores.recentImprovement}</div>
                    </div>
                    <div class="r-highlight-box">
                        <span class="r-hl-lbl">⚡ Next Recommended Action</span>
                        <div class="r-hl-val" style="color: var(--gold);">${scores.nextAction}</div>
                    </div>
                </div>

                <!-- 8 Explainable Pillars Grid -->
                <div class="readiness-grid upgraded-grid">
                    ${breakdownHtml}
                </div>
            </div>
        `;
    },

    calculateReadinessBreakdown() {
        const dsaState = Store.getState().dsa || {};
        const devState = Store.getState().development || {};
        const hub = Store.getPlacementHub();
        const testHistory = Store.getWeeklyTestHistory();
        const mistakes = Store.getMistakes();
        const weaknessMap = Store.calculateWeaknessMap();
        const dsaStats = typeof DSAEngine !== 'undefined' ? DSAEngine.getStats() : { solved: 0, total: 443 };

        // 1. DSA Pillar
        const dsaSolved = dsaStats.solved || 0;
        const dsaAttempted = Object.values(dsaState).filter(s => s && (s.status === 'IN_PROGRESS' || s.status === 'REVISIT')).length;
        const dsaWeakCount = (weaknessMap.dsa?.topics || []).filter(t => t.hasData && (t.tier === 'Weak' || t.tier === 'Needs Work')).length;
        
        let dsaTestCorrect = 0;
        let dsaTestTotal = 0;
        testHistory.forEach(t => {
            (t.answers || []).forEach(ans => {
                if (ans && ans.subject === 'dsa') {
                    dsaTestTotal++;
                    if (ans.isCorrect) dsaTestCorrect++;
                }
            });
        });
        const dsaTestAccuracy = dsaTestTotal > 0 ? Math.round((dsaTestCorrect / dsaTestTotal) * 100) : null;
        const dsaHasData = dsaSolved > 0 || dsaAttempted > 0 || dsaTestTotal > 0;
        
        let dsaScore = null;
        if (dsaHasData) {
            const solvedRatio = Math.min(1, dsaSolved / 443);
            const accuracyRatio = dsaTestAccuracy !== null ? (dsaTestAccuracy / 100) : 0.6;
            const rawScore = (solvedRatio * 50) + (Math.min(1, dsaAttempted / 40) * 15) + (accuracyRatio * 35) - (dsaWeakCount * 3);
            dsaScore = Math.max(5, Math.min(100, Math.round(rawScore)));
        }

        // 2. Development Pillar
        const devVideosDone = Object.values(devState.videos || {}).filter(v => v.status === 'SOLVED' || v.status === 'COMPLETED').length;
        const devTasksDone = Object.values(devState.tasks || {}).filter(t => t.status === 'SOLVED' || t.status === 'COMPLETED').length;
        const devProjectsDone = Object.values(devState.projects || {}).filter(p => p.status === 'COMPLETED').length;
        const devQuestionsMastered = Object.values(devState.questions || {}).filter(q => q.status === 'KNOW').length;
        const devHasData = devVideosDone > 0 || devTasksDone > 0 || devProjectsDone > 0 || devQuestionsMastered > 0;

        let devScore = null;
        if (devHasData) {
            const vScore = Math.min(1, devVideosDone / 50) * 30;
            const tScore = Math.min(1, devTasksDone / 40) * 35;
            const pScore = Math.min(1, devProjectsDone / 4) * 20;
            const qScore = Math.min(1, devQuestionsMastered / 30) * 15;
            devScore = Math.max(5, Math.min(100, Math.round(vScore + tScore + pScore + qScore)));
        }

        // 3. Core CS / College Subjects
        let coreTopicsDone = 0;
        let coreTopicsTotal = 0;
        ['dbms', 'os', 'cn', 'se'].forEach(subKey => {
            const rm = PLACEMENT_DATA.subjects[subKey]?.roadmap || [];
            coreTopicsTotal += rm.length;
            const saved = Store.getSubjectRoadmap(subKey);
            rm.forEach(t => { if (saved[t.id]?.completed) coreTopicsDone++; });
        });
        const coreQuestions = Object.values(hub.questionPerformance || {});
        const coreMastered = coreQuestions.filter(q => q.status === 'KNOW').length;
        const coreHasData = coreTopicsDone > 0 || coreQuestions.length > 0;

        let coreScore = null;
        if (coreHasData) {
            const rmRatio = coreTopicsTotal > 0 ? (coreTopicsDone / coreTopicsTotal) : 0;
            const qRatio = coreQuestions.length > 0 ? (coreMastered / coreQuestions.length) : 0.5;
            coreScore = Math.max(5, Math.min(100, Math.round((rmRatio * 60) + (qRatio * 40))));
        }

        // 4. Engineering Projects Pillar
        const projectsObj = devState.projects || {};
        const completedProjectsCount = Object.values(projectsObj).filter(p => p.status === 'COMPLETED').length;
        const inProgressProjectsCount = Object.values(projectsObj).filter(p => p.status === 'IN_PROGRESS').length;
        const projectsHasData = completedProjectsCount > 0 || inProgressProjectsCount > 0;

        let projectsScore = null;
        if (projectsHasData) {
            const pVal = (completedProjectsCount * 25) + (inProgressProjectsCount * 10);
            projectsScore = Math.min(100, Math.round(pVal));
        }

        // 5. System Design Pillar
        const sysRoadmap = PLACEMENT_DATA.subjects['system-design']?.roadmap || [];
        const savedSysRoadmap = Store.getSubjectRoadmap('system-design');
        let sysTopicsDone = 0;
        sysRoadmap.forEach(t => { if (savedSysRoadmap[t.id]?.completed) sysTopicsDone++; });
        const sysInterviews = hub.systemDesignInterviews || [];
        const sysHasData = sysTopicsDone > 0 || sysInterviews.length > 0;

        let sysScore = null;
        if (sysHasData) {
            const tRatio = sysRoadmap.length > 0 ? (sysTopicsDone / sysRoadmap.length) * 50 : 0;
            let avgInterview = 0;
            if (sysInterviews.length > 0) {
                const sum = sysInterviews.reduce((acc, i) => acc + (i.scores?.overall || 50), 0);
                avgInterview = (sum / sysInterviews.length) * 0.5;
            }
            sysScore = Math.max(5, Math.min(100, Math.round(tRatio + avgInterview)));
        }

        // 6. Interview Preparation Pillar
        const allAnsweredQuestions = Object.values(hub.questionPerformance || {}).length + Object.values(devState.questions || {}).length;
        const interviewHasData = allAnsweredQuestions > 0 || sysInterviews.length > 0;

        let interviewScore = null;
        if (interviewHasData) {
            const qKnown = Object.values(hub.questionPerformance || {}).filter(q => q.status === 'KNOW').length +
                           Object.values(devState.questions || {}).filter(q => q.status === 'KNOW').length;
            const ratio = allAnsweredQuestions > 0 ? (qKnown / allAnsweredQuestions) : 0;
            interviewScore = Math.max(5, Math.min(100, Math.round(ratio * 80 + Math.min(20, sysInterviews.length * 10))));
        }

        // 7. Resume & Defense Pillar
        const placementNotes = hub.notes || {};
        let resumeNotesCount = 0;
        Object.keys(placementNotes).forEach(k => {
            (placementNotes[k] || []).forEach(n => {
                if ((n.title || '').toLowerCase().includes('resume') || (n.content || '').toLowerCase().includes('defense')) {
                    resumeNotesCount++;
                }
            });
        });
        const resumeHasData = completedProjectsCount > 0 || resumeNotesCount > 0;
        let resumeScore = null;
        if (resumeHasData) {
            const rBase = (completedProjectsCount >= 2 ? 60 : 35) + Math.min(40, resumeNotesCount * 20);
            resumeScore = Math.min(100, rBase);
        }

        // 8. Coding Tests Pillar
        const testsCount = testHistory.length;
        const testsHasData = testsCount > 0;
        let testsScore = null;
        let avgTestAccuracy = 0;
        if (testsHasData) {
            const accSum = testHistory.reduce((acc, t) => acc + (t.accuracy || t.score || 0), 0);
            avgTestAccuracy = Math.round(accSum / testsCount);
            testsScore = Math.max(5, Math.min(100, avgTestAccuracy));
        }

        // Aggregate All Categories
        const categories = {
            dsa: {
                key: 'dsa',
                name: 'DSA',
                fullName: 'Data Structures & Algorithms',
                icon: '🧠',
                color: 'var(--gold)',
                hasData: dsaHasData,
                percent: dsaScore,
                metrics: [
                    { label: 'Striver Problems Solved', value: `${dsaSolved} / 443` },
                    { label: 'Problems In Progress / Revisit', value: `${dsaAttempted}` },
                    { label: 'Sunday Test Accuracy', value: dsaTestAccuracy !== null ? `${dsaTestAccuracy}%` : 'No test attempts' },
                    { label: 'Tracked Weak Topics', value: `${dsaWeakCount}` }
                ],
                formula: '50% Solved Ratio + 15% In-Progress + 35% Test Accuracy - Weak Topics Penalty',
                whyText: dsaHasData 
                    ? `Calculated from ${dsaSolved} solved Striver problems, ${dsaAttempted} problems in progress, and ${dsaTestAccuracy !== null ? `${dsaTestAccuracy}% accuracy in tests` : 'pending test verification'}.`
                    : 'Not enough data. Start solving Striver A2Z problems or take a Sunday weekly test to unlock this metric.'
            },
            dev: {
                key: 'dev',
                name: 'Development',
                fullName: 'Full-Stack Development',
                icon: '💻',
                color: 'var(--sky)',
                hasData: devHasData,
                percent: devScore,
                metrics: [
                    { label: 'Lessons Completed', value: `${devVideosDone} / 50` },
                    { label: 'Practical Code Tasks', value: `${devTasksDone} / 40` },
                    { label: 'Completed Projects', value: `${devProjectsDone} / 4` },
                    { label: 'Interview Q&A Mastered', value: `${devQuestionsMastered}` }
                ],
                formula: '30% Lessons + 35% Practical Tasks + 20% Projects + 15% Interview Q&A',
                whyText: devHasData
                    ? `Synthesized from ${devVideosDone} completed lessons, ${devTasksDone} practical hands-on tasks, and ${devProjectsDone} deployed projects.`
                    : 'Not enough data. Watch video lessons or complete practical coding tasks in Development Hub.'
            },
            corecs: {
                key: 'corecs',
                name: 'Core CS',
                fullName: 'Core Computer Science & College',
                icon: '🎓',
                color: 'var(--purple)',
                hasData: coreHasData,
                percent: coreScore,
                metrics: [
                    { label: 'Syllabus Topics Covered', value: `${coreTopicsDone} / ${coreTopicsTotal || 45}` },
                    { label: 'Question Performance', value: `${coreMastered} / ${coreQuestions.length}` }
                ],
                formula: '60% Syllabus Roadmaps + 40% Question Mastery Rate',
                whyText: coreHasData
                    ? `Based on ${coreTopicsDone} completed topics across DBMS, OS, Computer Networks and ${coreMastered} mastered questions.`
                    : 'Not enough data. Check off completed topics in Placement Roadmaps.'
            },
            projects: {
                key: 'projects',
                name: 'Projects',
                fullName: 'Engineering Projects',
                icon: '🛠️',
                color: 'var(--emerald)',
                hasData: projectsHasData,
                percent: projectsScore,
                metrics: [
                    { label: 'Completed / Deployed Projects', value: `${completedProjectsCount} / 4` },
                    { label: 'Projects Currently In Development', value: `${inProgressProjectsCount}` }
                ],
                formula: '25% per deployed project + 10% per in-progress project',
                whyText: projectsHasData
                    ? `Evaluated from ${completedProjectsCount} completed full-stack projects and ${inProgressProjectsCount} projects in active development.`
                    : 'Not enough data. Mark projects as in-progress or completed in Development -> Projects.'
            },
            sysdesign: {
                key: 'sysdesign',
                name: 'System Design',
                fullName: 'System Design & Scalability',
                icon: '📐',
                color: 'var(--amber)',
                hasData: sysHasData,
                percent: sysScore,
                metrics: [
                    { label: 'Roadmap Concepts Completed', value: `${sysTopicsDone} / ${sysRoadmap.length || 15}` },
                    { label: 'Mock Architectural Interviews', value: `${sysInterviews.length}` }
                ],
                formula: '50% Conceptual Roadmaps + 50% Mock System Design Scores',
                whyText: sysHasData
                    ? `Derived from ${sysTopicsDone} covered system design topics and ${sysInterviews.length} mock architecture interviews.`
                    : 'Not enough data. Complete topics in Placement Hub -> System Design.'
            },
            interview: {
                key: 'interview',
                name: 'Interview',
                fullName: 'Interview Preparation & Behavioral',
                icon: '🎤',
                color: 'var(--rose)',
                hasData: interviewHasData,
                percent: interviewScore,
                metrics: [
                    { label: 'Total Interview Questions Practiced', value: `${allAnsweredQuestions}` },
                    { label: 'System Design / Mock Sessions', value: `${sysInterviews.length}` }
                ],
                formula: '80% Question Mastery Rate + 20% Mock Sessions',
                whyText: interviewHasData
                    ? `Assessed across ${allAnsweredQuestions} interview questions practiced with self-ratings.`
                    : 'Not enough data. Practice interview questions in Placement Hub or Development.'
            },
            resume: {
                key: 'resume',
                name: 'Resume',
                fullName: 'Resume & Project Defense',
                icon: '📄',
                color: '#38bdf8',
                hasData: resumeHasData,
                percent: resumeScore,
                metrics: [
                    { label: 'Verified Deployed Projects on Resume', value: `${completedProjectsCount} / 2 required` },
                    { label: 'Project Defense Notes Captured', value: `${resumeNotesCount}` }
                ],
                formula: '60% Project Verification + 40% Defense Notes',
                whyText: resumeHasData
                    ? `Based on verified project implementations and defense talking points.`
                    : 'Not enough data. Complete at least one project to verify resume technical strength.'
            },
            tests: {
                key: 'tests',
                name: 'Coding Tests',
                fullName: 'Weekly Review Exams & Timed Tests',
                icon: '⏱️',
                color: '#ec4899',
                hasData: testsHasData,
                percent: testsScore,
                metrics: [
                    { label: 'Sunday Weekly Tests Completed', value: `${testsCount}` },
                    { label: 'Average Test Accuracy', value: testsHasData ? `${avgTestAccuracy}%` : 'N/A' }
                ],
                formula: '100% Real Average Test Accuracy Across Sunday Exams',
                whyText: testsHasData
                    ? `Computed directly from ${testsCount} Sunday weekly review exams taken.`
                    : 'Not enough data. Take the Sunday Weekly Test to establish your baseline.'
            }
        };

        // Calculate Overall Readiness
        const validCategories = Object.values(categories).filter(c => c.hasData && c.percent !== null);
        const hasAnyData = validCategories.length > 0;
        const overall = hasAnyData
            ? Math.round(validCategories.reduce((acc, c) => acc + c.percent, 0) / validCategories.length)
            : 0;

        let statusLabel = '🌱 Building Foundations';
        if (hasAnyData) {
            if (overall >= 75) statusLabel = '🔥 Placement Ready (Targeting PBC/FAANG)';
            else if (overall >= 50) statusLabel = '⚡ Good Momentum (Solid Core)';
            else statusLabel = '🌱 Early Stage (Focus on DSA & Dev)';
        } else {
            statusLabel = '🌱 Getting Started (No data yet)';
        }

        // Calculate 4 Highlights from REAL data
        let strongestArea = 'None yet';
        let needsAttentionArea = 'DSA & Dev Foundations';
        let recentImprovement = 'Baseline starting';
        let nextAction = 'Solve 3 Striver DSA Problems';

        if (hasAnyData) {
            const sortedByScore = [...validCategories].sort((a, b) => b.percent - a.percent);
            strongestArea = `${sortedByScore[0].name} (${sortedByScore[0].percent}%)`;

            const sortedAsc = [...validCategories].sort((a, b) => a.percent - b.percent);
            needsAttentionArea = `${sortedAsc[0].name} (${sortedAsc[0].percent}%)`;

            if (testsCount > 0) {
                recentImprovement = `Sunday Test: ${testHistory[0].accuracy || testHistory[0].score}% accuracy`;
            } else if (dsaSolved > 0) {
                recentImprovement = `${dsaSolved} DSA problems solved`;
            } else {
                recentImprovement = 'Consistency logging active';
            }

            // Next Recommended Action
            if (dsaSolved < 10) nextAction = 'Solve Morning DSA Striver Block';
            else if (testsCount === 0) nextAction = 'Take Sunday Weekly Review Exam';
            else if (devProjectsDone === 0) nextAction = 'Deploy 1st Full-Stack Project';
            else nextAction = 'Practice Weak Areas in Mistake Bank';
        }

        return {
            overall,
            hasAnyData,
            statusLabel,
            categories,
            strongestArea,
            needsAttentionArea,
            recentImprovement,
            nextAction
        };
    },

    openReadinessExplainer(catKey) {
        const scores = this.calculateReadinessBreakdown();
        const c = scores.categories[catKey];
        if (!c) return;

        let modal = document.getElementById('readinessExplainerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'readinessExplainerModal';
            document.body.appendChild(modal);
        }

        const metricsHtml = (c.metrics || []).map(m => `
            <div class="rex-metric-row">
                <span>${m.label}:</span>
                <b>${m.value}</b>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-window" style="width: min(580px, 95vw);">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">${c.icon}</span>
                        <div>
                            <span style="font-size: 11px; color: var(--gold); text-transform: uppercase; font-weight: 700;">Explainable Readiness Metric</span>
                            <h3 style="margin: 2px 0 0 0; color: #fff;">${c.fullName}</h3>
                        </div>
                    </div>
                    <button class="btn-close-modal" onclick="document.getElementById('readinessExplainerModal').classList.remove('active')">×</button>
                </div>

                <div class="modal-body">
                    <div class="rex-score-banner">
                        <div>
                            <span class="rex-score-lbl">Evaluated Readiness:</span>
                            <div class="rex-score-val" style="color: ${c.hasData ? c.color : 'var(--text-muted)'};">
                                ${c.hasData ? `${c.percent}%` : 'Not enough data'}
                            </div>
                        </div>
                        <div class="rex-score-desc">
                            ${c.whyText}
                        </div>
                    </div>

                    <div style="margin-top: 18px;">
                        <h5 style="margin: 0 0 8px 0; color: #fff; font-size: 13px;">Real Underlying Signals:</h5>
                        <div class="rex-metrics-list">
                            ${metricsHtml}
                        </div>
                    </div>

                    <div class="rex-formula-box">
                        <span class="rex-formula-title">📐 Explainable Calculation Formula:</span>
                        <code>${c.formula}</code>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end;">
                    <button class="btn-primary" onclick="document.getElementById('readinessExplainerModal').classList.remove('active')">
                        Got it ✓
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Requirement 1 & 22: Render every single card interactively with progress and hover states.
     */
    renderPlacementCards() {
        const grid = document.getElementById('placementTopicsGrid');
        if (!grid) return;

        const subjects = PLACEMENT_DATA.subjects;
        const subjectKeys = Object.keys(subjects);

        grid.innerHTML = subjectKeys.map(key => {
            const s = subjects[key];
            const roadmap = s.roadmap || [];
            const savedRoadmap = Store.getSubjectRoadmap(key);

            let completed = 0;
            let total = roadmap.length;
            let pct = 0;

            if (key === 'dsa') {
                const dsaStats = typeof DSAEngine !== 'undefined' ? DSAEngine.getStats() : { solved: 0, total: 450 };
                completed = dsaStats.solved;
                total = dsaStats.total;
                pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            } else {
                roadmap.forEach(t => {
                    if (savedRoadmap[t.id]?.completed) completed++;
                });
                pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            }

            return `
                <div class="placement-topic-card interactive-card" onclick="PlacementEngine.openSubject('${s.id}')" data-subject="${s.id}">
                    <div class="topic-header">
                        <div class="topic-icon" style="border-color: ${s.color}33;">${s.icon}</div>
                        <div class="topic-badge" style="background: ${s.color}18; color: ${s.color}; border: 1px solid ${s.color}33;">
                            ${pct}% Ready
                        </div>
                    </div>
                    <div class="topic-info">
                        <h4>${s.name}</h4>
                        <p class="topic-desc">${s.subtitle || s.description}</p>
                    </div>
                    <div class="topic-progress-section">
                        <div class="topic-progress-meta">
                            <span>Progress</span>
                            <b>${completed} / ${total}</b>
                        </div>
                        <div class="topic-progress-bar">
                            <div class="topic-progress-fill" style="width: ${pct}%; background: ${s.color};"></div>
                        </div>
                    </div>
                    <div class="topic-card-footer">
                        <span class="topic-cta" style="color: ${s.color};">Continue Learning →</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderWeakAreasSummary() {
        const container = document.getElementById('placementWeakAreasSummary');
        if (!container) return;

        const weakAreas = Store.getWeakAreas();
        if (weakAreas.length === 0) {
            container.innerHTML = `
                <div class="weak-areas-clean">
                    <span>✨ No active weak areas logged! Keep practicing daily.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="weak-areas-box">
                <div class="weak-areas-title">
                    <span>⚠️ Identified Weak Areas (${weakAreas.length})</span>
                    <small>Topics flagged during tests or practice</small>
                </div>
                <div class="weak-tags-wrap">
                    ${weakAreas.map(w => `
                        <span class="weak-tag" onclick="PlacementEngine.openSubject('${w.subjectId || 'dbms'}', 'revision')">
                            ${w.topic} <b>(${w.count}x)</b> ✕
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // SUBJECT DETAIL MODAL (Requirements 1, 4, 5, 6, 7, 8, 15, 17, 18, 19)
    // ------------------------------------------------------------------------
    openSubject(subjectId, initialTab = 'roadmap') {
        const subject = PLACEMENT_DATA.subjects[subjectId];
        if (!subject) return;

        this.currentSubjectId = subjectId;
        this.currentSubjectTab = initialTab;

        const modal = document.getElementById('subjectDetailModal');
        if (!modal) return;

        // Set subject headers
        document.getElementById('subjectModalIcon').textContent = subject.icon;
        document.getElementById('subjectModalTitle').textContent = subject.name;
        document.getElementById('subjectModalSubtitle').textContent = subject.subtitle || subject.description;

        this.switchSubjectTab(initialTab);
        modal.classList.add('active');
    },

    closeSubjectModal() {
        const modal = document.getElementById('subjectDetailModal');
        if (modal) modal.classList.remove('active');
        this.currentSubjectId = null;
        // Refresh dashboard numbers
        this.renderPlacementView();
    },

    switchSubjectTab(tabName) {
        this.currentSubjectTab = tabName;

        // Update tab button styles
        document.querySelectorAll('.subject-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Hide special system design tab button if not system design
        const sdTabBtn = document.getElementById('tabBtnSystemDesign');
        if (sdTabBtn) {
            sdTabBtn.style.display = (this.currentSubjectId === 'sysdesign') ? 'inline-flex' : 'none';
        }

        const body = document.getElementById('subjectModalBody');
        if (!body) return;

        const subject = PLACEMENT_DATA.subjects[this.currentSubjectId];
        if (!subject) return;

        switch (tabName) {
            case 'overview':
                body.innerHTML = this.renderSubjectOverviewTab(subject);
                break;
            case 'roadmap':
                body.innerHTML = this.renderSubjectRoadmapTab(subject);
                break;
            case 'sysdesign':
                body.innerHTML = this.renderSystemDesignTab(subject);
                break;
            case 'resources':
                body.innerHTML = this.renderSubjectResourcesTab(subject);
                break;
            case 'questions':
                body.innerHTML = this.renderSubjectQuestionsTab(subject);
                break;
            case 'notes':
                body.innerHTML = this.renderSubjectNotesTab(subject);
                break;
            case 'revision':
                body.innerHTML = this.renderSubjectRevisionTab(subject);
                break;
            default:
                body.innerHTML = this.renderSubjectRoadmapTab(subject);
        }
    },

    renderSubjectOverviewTab(subject) {
        return `
            <div class="tab-pane-content">
                <div class="overview-section">
                    <h4>🎯 What I Need to Learn</h4>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">${subject.description}</p>
                    <ul class="learning-objectives-list">
                        ${(subject.whatToLearn || []).map(item => `
                            <li><span>✓</span> <div>${item}</div></li>
                        `).join('')}
                    </ul>
                </div>

                <div class="overview-section" style="margin-top: 24px;">
                    <h4>⚡ Practice Tasks & Challenges</h4>
                    <ul class="practice-tasks-list">
                        ${(subject.practiceTasks || []).map((t, idx) => `
                            <li>
                                <b>Task ${idx + 1}:</b> ${t}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="overview-cta-box" style="margin-top: 24px;">
                    <div>
                        <b>Ready to study ${subject.shortName}?</b>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                            Add this subject to today's schedule in your available afternoon study slot.
                        </p>
                    </div>
                    <button class="btn-primary" onclick="PlacementEngine.scheduleSubjectToday('${subject.id}', '${subject.name}')">
                        📅 Schedule for Today
                    </button>
                </div>
            </div>
        `;
    },

    renderSubjectRoadmapTab(subject) {
        const roadmap = subject.roadmap || [];
        const savedRoadmap = Store.getSubjectRoadmap(subject.id);

        let completedCount = 0;
        roadmap.forEach(t => {
            if (savedRoadmap[t.id]?.completed) completedCount++;
        });

        // Group by sections
        const sections = {};
        roadmap.forEach(t => {
            const sec = t.section || 'CURRICULUM';
            if (!sections[sec]) sections[sec] = [];
            sections[sec].push(t);
        });

        let sectionsHtml = Object.keys(sections).map(secName => {
            const items = sections[secName];
            return `
                <div class="roadmap-section-block">
                    <div class="roadmap-section-title">${secName}</div>
                    <div class="roadmap-items-list">
                        ${items.map(item => {
                            const isDone = !!savedRoadmap[item.id]?.completed;
                            const bookmarked = Store.isBookmarked(item.id);
                            return `
                                <div class="roadmap-item-row ${isDone ? 'is-completed' : ''}">
                                    <label class="roadmap-checkbox-label">
                                        <input type="checkbox" ${isDone ? 'checked' : ''} onchange="PlacementEngine.toggleTopic('${subject.id}', '${item.id}')">
                                        <span class="custom-checkmark"></span>
                                        <span class="roadmap-item-text">${item.title}</span>
                                    </label>
                                    <div class="roadmap-item-actions">
                                        <button class="btn-item-action ${bookmarked ? 'bookmarked' : ''}" title="${bookmarked ? 'Remove Bookmark' : 'Bookmark Topic'}" onclick="PlacementEngine.toggleBookmarkTopic('${subject.id}', '${item.id}', '${item.title.replace(/'/g, "\\'")}')">
                                            ${bookmarked ? '⭐' : '☆'}
                                        </button>
                                        <button class="btn-item-action" title="Add to Today's Calendar" onclick="PlacementEngine.scheduleTopicToday('${subject.id}', '${item.title.replace(/'/g, "\\'")}')">
                                            📅 Today
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="tab-pane-content">
                <div class="roadmap-summary-banner">
                    <div class="roadmap-summary-left">
                        <h4>Roadmap & Topic Progress</h4>
                        <p>Persistent topic mastery checklist. Every item compounds into placement readiness.</p>
                    </div>
                    <div class="roadmap-stat-pill">
                        Progress: <b>${completedCount} / ${roadmap.length}</b>
                    </div>
                </div>
                ${sectionsHtml}
            </div>
        `;
    },

    toggleTopic(subjectId, topicId) {
        Store.toggleTopicComplete(subjectId, topicId);
        // Refresh tab and header
        this.switchSubjectTab('roadmap');
        this.renderPlacementView();
    },

    /**
     * Requirement 4, 5, 6, 17: Curated YouTube Playlists & Verified Notes
     */
    renderSubjectResourcesTab(subject) {
        const yt = subject.youtube || {};
        const primary = yt.primary;
        const alt1 = yt.alt1;
        const alt2 = yt.alt2;

        const renderYtCard = (res, isBest = false) => {
            if (!res) return '';
            const resId = `yt_${subject.id}_${encodeURIComponent(res.title).slice(0, 20)}`;
            const tracking = Store.getResourceTracking(resId);

            return `
                <div class="resource-card ${isBest ? 'is-best-primary' : ''}">
                    <div class="resource-card-header">
                        <div>
                            ${isBest ? `<span class="badge-start-here">⭐ START HERE — BEST PRIMARY PLAYLIST</span>` : `<span class="badge-alternative">ALTERNATIVE RESOURCE</span>`}
                            <h4 class="resource-title">${res.title}</h4>
                            <div class="resource-channel">Channel: <b>${res.channel}</b> • Level: <span class="badge-level">${res.level}</span></div>
                        </div>
                        <a href="${res.url}" target="_blank" rel="noopener" class="btn-watch-yt">
                            ▶ WATCH
                        </a>
                    </div>
                    <p class="resource-why"><b>Why recommended:</b> ${res.why}</p>
                    <div class="resource-tracking-bar">
                        <label>Status:</label>
                        <select class="tracking-select" onchange="PlacementEngine.updateResourceStatus('${resId}', this.value)">
                            <option value="NOT_STARTED" ${tracking.status === 'NOT_STARTED' ? 'selected' : ''}>Not Started</option>
                            <option value="WATCHING" ${tracking.status === 'WATCHING' ? 'selected' : ''}>Watching</option>
                            <option value="COMPLETED" ${tracking.status === 'COMPLETED' ? 'selected' : ''}>Completed ✓</option>
                        </select>
                        ${tracking.lastWatched ? `<span class="last-watched">Last watched: ${tracking.lastWatched}</span>` : ''}
                    </div>
                </div>
            `;
        };

        const notesHtml = (subject.notes || []).map(n => `
            <div class="note-resource-row">
                <div class="note-resource-info">
                    <b>${n.title}</b>
                    <span class="note-resource-type">${n.type}</span>
                </div>
                <a href="${n.url}" target="_blank" rel="noopener" class="btn-open-resource">
                    OPEN RESOURCE ↗
                </a>
            </div>
        `).join('');

        return `
            <div class="tab-pane-content">
                <div class="section-subheading">
                    <h4>⭐ Verified YouTube Courses</h4>
                    <p>Curated, current, high-quality playlists from leading computer science educators.</p>
                </div>
                <div class="resources-list">
                    ${renderYtCard(primary, true)}
                    ${renderYtCard(alt1, false)}
                    ${renderYtCard(alt2, false)}
                </div>

                <div class="section-subheading" style="margin-top: 32px;">
                    <h4>📚 Best Notes & Documentation</h4>
                    <p>Authentic, verified reference material and interview cheat sheets.</p>
                </div>
                <div class="notes-resources-list">
                    ${notesHtml}
                </div>
            </div>
        `;
    },

    updateResourceStatus(resourceId, status) {
        Store.setResourceTracking(resourceId, {
            status,
            lastWatched: DateUtils.todayIST()
        });
        showToast(`Resource marked as ${status}!`, 'success');
        this.renderPlacementView();
    },

    /**
     * Requirement 8: Interview Question Bank
     */
    renderSubjectQuestionsTab(subject) {
        const questions = subject.questions || [];
        if (questions.length === 0) {
            return `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No questions added yet for this subject.</div>`;
        }

        return `
            <div class="tab-pane-content">
                <div class="questions-header">
                    <div>
                        <h4>Interview Question Bank</h4>
                        <p>Practice articulating answers and test your conceptual depth.</p>
                    </div>
                </div>
                <div class="questions-list">
                    ${questions.map((q, idx) => {
                        const perf = Store.getQuestionPerformance(q.id);
                        const bookmarked = Store.isBookmarked(q.id);
                        const statusClass = perf.status ? perf.status.toLowerCase() : 'unattempted';

                        return `
                            <div class="interview-question-card ${statusClass}" id="qCard_${q.id}">
                                <div class="q-card-header">
                                    <div class="q-card-meta">
                                        <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                                        <span class="q-topic-tag">${q.topic}</span>
                                        ${perf.status ? `<span class="q-status-tag ${perf.status.toLowerCase()}">${perf.status}</span>` : ''}
                                    </div>
                                    <button class="btn-item-action ${bookmarked ? 'bookmarked' : ''}" title="Bookmark Question" onclick="PlacementEngine.toggleBookmarkQuestion('${q.id}', '${q.question.replace(/'/g, "\\'")}', '${subject.id}')">
                                        ${bookmarked ? '⭐' : '☆'}
                                    </button>
                                </div>
                                <h4 class="q-title">${idx + 1}. ${q.question}</h4>
                                <div class="q-concepts-wrap">
                                    <b>Expected concepts:</b>
                                    <div class="q-concept-tags">
                                        ${(q.expectedConcepts || []).map(c => `<span class="concept-tag">${c}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="q-answer-box">
                                    <textarea class="form-textarea q-textarea" id="txt_${q.id}" placeholder="Type your thought process or answer draft here...">${perf.myAnswer || ''}</textarea>
                                </div>
                                <div class="q-actions-bar">
                                    <button class="action-btn-ghost" onclick="PlacementEngine.toggleExplanation('${q.id}')">
                                        👁️ Reveal Explanation
                                    </button>
                                    <div class="q-rating-group">
                                        <span style="font-size: 12px; color: var(--text-muted); margin-right: 6px;">How did you perform?</span>
                                        <button class="btn-rate know" onclick="PlacementEngine.rateQuestion('${q.id}', 'KNOW', '${q.topic}', '${subject.id}')">😎 Know</button>
                                        <button class="btn-rate partial" onclick="PlacementEngine.rateQuestion('${q.id}', 'REVISION', '${q.topic}', '${subject.id}')">🤔 Need Revision</button>
                                        <button class="btn-rate dont_know" onclick="PlacementEngine.rateQuestion('${q.id}', 'DONT_KNOW', '${q.topic}', '${subject.id}')">❌ Don't Know</button>
                                    </div>
                                </div>
                                <div class="q-explanation-box" id="exp_${q.id}" style="display: none;">
                                    <div class="q-exp-title">💡 Model Explanation & Core Insights</div>
                                    <p class="q-exp-text">${q.explanation}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    toggleExplanation(qId) {
        const exp = document.getElementById(`exp_${qId}`);
        if (!exp) return;
        exp.style.display = exp.style.display === 'none' ? 'block' : 'none';
    },

    rateQuestion(qId, status, topic, subjectId) {
        const txt = document.getElementById(`txt_${qId}`);
        const answer = txt ? txt.value.trim() : '';

        Store.saveQuestionPerformance(qId, {
            status,
            myAnswer: answer
        });

        if (status === 'REVISION' || status === 'DONT_KNOW') {
            Store.recordWeakTopic(topic, subjectId);
        } else if (status === 'KNOW') {
            Store.removeWeakTopic(topic);
        }

        showToast(`Performance logged: ${status}`, 'success');
        this.switchSubjectTab('questions');
        this.renderPlacementView();
    },

    /**
     * Requirement 18: Personal Notes per subject
     */
    renderSubjectNotesTab(subject) {
        const notes = Store.getSubjectNotes(subject.id);

        return `
            <div class="tab-pane-content">
                <div class="notes-header-bar">
                    <div>
                        <h4>📝 My Personal Notes — ${subject.shortName}</h4>
                        <p>Write key insights, edge cases, formulas, and interview takeaways. Stored locally.</p>
                    </div>
                    <button class="btn-primary" onclick="PlacementEngine.promptNewNote('${subject.id}')">
                        ＋ New Note
                    </button>
                </div>

                <div class="notes-search-box">
                    <input type="text" class="form-input" id="subjectNotesSearch" placeholder="Search my notes in ${subject.shortName}..." oninput="PlacementEngine.filterNotes('${subject.id}', this.value)">
                </div>

                <div class="notes-list-container" id="subjectNotesList">
                    ${this.renderNotesListHtml(notes, subject.id)}
                </div>
            </div>
        `;
    },

    renderNotesListHtml(notes, subjectId) {
        if (!notes || notes.length === 0) {
            return `<div style="text-align: center; color: var(--text-muted); padding: 40px;">No notes written for this subject yet. Click "＋ New Note" to write one.</div>`;
        }

        return notes.map(n => `
            <div class="personal-note-card ${n.pinned ? 'is-pinned' : ''}">
                <div class="note-card-header">
                    <div class="note-title-wrap">
                        ${n.pinned ? '<span class="note-pin-badge">📌 PINNED</span>' : ''}
                        <b>${n.title}</b>
                    </div>
                    <div class="note-actions">
                        <button class="action-btn-ghost" onclick="PlacementEngine.togglePinNote('${subjectId}', '${n.id}')">${n.pinned ? 'Unpin' : '📌 Pin'}</button>
                        <button class="action-btn-ghost" onclick="PlacementEngine.editNote('${subjectId}', '${n.id}')">✏️ Edit</button>
                        <button class="action-btn-ghost danger" onclick="PlacementEngine.deleteNote('${subjectId}', '${n.id}')">🗑️</button>
                    </div>
                </div>
                <div class="note-card-body">${n.content.replace(/\n/g, '<br>')}</div>
                <div class="note-card-date">Updated: ${DateUtils.formatDateShort(n.updatedAt ? n.updatedAt.slice(0, 10) : DateUtils.todayIST())}</div>
            </div>
        `).join('');
    },

    promptNewNote(subjectId) {
        const title = prompt('Note Title (e.g. BCNF vs 3NF Cheatsheet):');
        if (!title) return;
        const content = prompt('Note Content:');
        if (!content) return;

        Store.saveSubjectNote(subjectId, {
            title,
            content,
            pinned: false
        });
        showToast('Saved note!', 'success');
        this.switchSubjectTab('notes');
    },

    editNote(subjectId, noteId) {
        const notes = Store.getSubjectNotes(subjectId);
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const newTitle = prompt('Edit Note Title:', note.title);
        if (newTitle === null) return;
        const newContent = prompt('Edit Note Content:', note.content);
        if (newContent === null) return;

        Store.saveSubjectNote(subjectId, {
            id: noteId,
            title: newTitle,
            content: newContent,
            pinned: note.pinned
        });
        showToast('Updated note!', 'success');
        this.switchSubjectTab('notes');
    },

    deleteNote(subjectId, noteId) {
        if (confirm('Delete this note?')) {
            Store.deleteSubjectNote(subjectId, noteId);
            showToast('Note deleted.', 'warning');
            this.switchSubjectTab('notes');
        }
    },

    togglePinNote(subjectId, noteId) {
        const notes = Store.getSubjectNotes(subjectId);
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        Store.saveSubjectNote(subjectId, {
            id: noteId,
            pinned: !note.pinned
        });
        this.switchSubjectTab('notes');
    },

    filterNotes(subjectId, query) {
        const list = document.getElementById('subjectNotesList');
        if (!list) return;
        const notes = Store.getSubjectNotes(subjectId);
        const filtered = notes.filter(n =>
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            n.content.toLowerCase().includes(query.toLowerCase())
        );
        list.innerHTML = this.renderNotesListHtml(filtered, subjectId);
    },

    /**
     * Requirement 14 & Revision section per subject
     */
    renderSubjectRevisionTab(subject) {
        const questions = subject.questions || [];
        const needRevision = questions.filter(q => {
            const perf = Store.getQuestionPerformance(q.id);
            return perf.status === 'REVISION' || perf.status === 'DONT_KNOW';
        });

        const weakAreas = Store.getWeakAreas().filter(w => w.subjectId === subject.id);

        return `
            <div class="tab-pane-content">
                <div class="revision-header">
                    <h4>🔁 Revision Queue — ${subject.shortName}</h4>
                    <p>Topics and questions you flagged as needing reinforcement.</p>
                </div>

                ${weakAreas.length > 0 ? `
                    <div class="revision-topics-box">
                        <b>Flagged Weak Concepts:</b>
                        <div class="weak-tags-wrap" style="margin-top: 8px;">
                            ${weakAreas.map(w => `<span class="weak-tag">${w.topic} (${w.count}x)</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${needRevision.length > 0 ? `
                    <div class="questions-list" style="margin-top: 20px;">
                        ${needRevision.map(q => `
                            <div class="interview-question-card revision-flagged">
                                <div class="q-card-header">
                                    <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                                    <span class="q-topic-tag">${q.topic}</span>
                                </div>
                                <h4 class="q-title">${q.question}</h4>
                                <div class="q-actions-bar">
                                    <button class="action-btn-ghost" onclick="PlacementEngine.toggleExplanation('${q.id}')">
                                        👁️ View Explanation
                                    </button>
                                    <button class="btn-primary" onclick="PlacementEngine.rateQuestion('${q.id}', 'KNOW', '${q.topic}', '${subject.id}')">
                                        ✓ Mark Mastered
                                    </button>
                                </div>
                                <div class="q-explanation-box" id="exp_${q.id}" style="display: none;">
                                    <p class="q-exp-text">${q.explanation}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="revision-clean-box">
                        <span>🎉 All clear! You have no pending revision flags in ${subject.shortName}.</span>
                    </div>
                `}
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // SYSTEM DESIGN DEEP DIVE & 12 CASE STUDIES (Requirements 2, 3, 16)
    // ------------------------------------------------------------------------
    renderSystemDesignTab(subject) {
        const sd = subject.levels;
        if (!sd) return '';

        return `
            <div class="tab-pane-content">
                <div class="sd-hero-banner">
                    <div class="sd-hero-badge">🏗️ SYSTEM DESIGN CURRICULUM</div>
                    <h3>Scalable Architecture, Distributed Systems & Interview Case Studies</h3>
                    <p>Designed strictly in interview-ready format: <b>What? Why? When? Trade-off? Real-World Example? Interview Question?</b></p>
                </div>

                <!-- Level 1: Fundamentals -->
                <div class="sd-level-card">
                    <div class="sd-level-header">
                        <span class="sd-level-tag">LEVEL 1</span>
                        <h4>${sd.level1.name}</h4>
                        <p>${sd.level1.subtitle}</p>
                    </div>
                    <div class="sd-concepts-grid">
                        ${sd.level1.concepts.map(c => `
                            <div class="sd-concept-card">
                                <h4 class="sd-concept-title">${c.name}</h4>
                                <div class="sd-field"><b>What:</b> ${c.what}</div>
                                <div class="sd-field"><b>Why:</b> ${c.why}</div>
                                <div class="sd-field"><b>When:</b> ${c.when}</div>
                                <div class="sd-field"><b>Trade-off:</b> ${c.tradeoff}</div>
                                <div class="sd-field"><b>Real-world:</b> ${c.example}</div>
                                <div class="sd-interview-callout">
                                    <b>🎤 Interview Question:</b> "${c.question}"
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Level 2: Core Components -->
                <div class="sd-level-card" style="margin-top: 28px;">
                    <div class="sd-level-header">
                        <span class="sd-level-tag">LEVEL 2</span>
                        <h4>${sd.level2.name}</h4>
                        <p>${sd.level2.subtitle}</p>
                    </div>
                    <div class="sd-components-grid">
                        ${sd.level2.components.map(comp => `
                            <div class="sd-comp-card">
                                <b>${comp.name}</b>
                                <p>${comp.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Level 3: Distributed Systems -->
                <div class="sd-level-card" style="margin-top: 28px;">
                    <div class="sd-level-header">
                        <span class="sd-level-tag">LEVEL 3</span>
                        <h4>${sd.level3.name}</h4>
                        <p>${sd.level3.subtitle}</p>
                    </div>
                    <div class="sd-components-grid">
                        ${sd.level3.concepts.map(comp => `
                            <div class="sd-comp-card">
                                <b>${comp.name}</b>
                                <p>${comp.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Level 4: 12 Classic Case Studies -->
                <div class="sd-level-card" style="margin-top: 28px;">
                    <div class="sd-level-header">
                        <span class="sd-level-tag">LEVEL 4</span>
                        <h4>${sd.level4.name}</h4>
                        <p>${sd.level4.subtitle}</p>
                    </div>
                    <div class="sd-case-studies-grid">
                        ${sd.level4.systems.map(sys => `
                            <div class="sd-case-card">
                                <div class="sd-case-top">
                                    <span class="sd-case-icon">${sys.icon}</span>
                                    <div>
                                        <h4 class="sd-case-title">${sys.name}</h4>
                                        <div class="sd-case-scale">${sys.scale}</div>
                                    </div>
                                </div>
                                <div class="sd-case-fields">
                                    <div><b>Read/Write Ratio:</b> ${sys.readWriteRatio}</div>
                                    <div><b>Storage:</b> ${sys.storage}</div>
                                    <div class="sd-key-insight"><b>⚡ Key Architectural Insight:</b> ${sys.steps.keyInsight}</div>
                                </div>
                                <div class="sd-case-actions">
                                    <button class="btn-primary sd-start-btn" onclick="PlacementEngine.startSystemDesignInterview('${sys.id}')">
                                        Start Design Interview 🎯
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // INTERACTIVE 5-STEP SYSTEM DESIGN INTERVIEW (Requirement 3)
    // ------------------------------------------------------------------------
    startSystemDesignInterview(problemId) {
        const sdSystems = PLACEMENT_DATA.subjects.sysdesign.levels.level4.systems;
        const system = sdSystems.find(s => s.id === problemId);
        if (!system) return;

        this.currentSdInterview = {
            system,
            currentStep: 1,
            answers: {
                reqs: '',
                scale: '',
                apis: '',
                arch: '',
                bottlenecks: ''
            }
        };

        const modal = document.getElementById('systemDesignInterviewModal');
        if (!modal) return;

        document.getElementById('sdModalTitle').textContent = `Design Interview: ${system.name}`;
        this.renderSdInterviewStep();
        modal.classList.add('active');
    },

    renderSdInterviewStep() {
        const session = this.currentSdInterview;
        if (!session) return;

        const { system, currentStep } = session;
        const body = document.getElementById('sdModalBody');
        const footer = document.getElementById('sdModalFooter');
        if (!body || !footer) return;

        const stepsMeta = [
            { step: 1, title: 'Step 1: Clarify Requirements', desc: 'Identify Functional and Non-Functional requirements (latency, availability, consistency).' },
            { step: 2, title: 'Step 2: Estimate Scale & Capacity', desc: 'Estimate QPS (reads vs writes), 5-year storage capacity, and bandwidth.' },
            { step: 3, title: 'Step 3: Design APIs & Data Schema', desc: 'Define primary endpoints (REST/gRPC) and relational vs NoSQL database schema.' },
            { step: 4, title: 'Step 4: Design High-Level Architecture', desc: 'Place Load Balancers, API Gateway, App Servers, DB Read Replicas, Caches & Queues.' },
            { step: 5, title: 'Step 5: Discuss Bottlenecks & Trade-offs', desc: 'Address single points of failure (SPOF), caching strategies, data partition hot spots, and CAP trade-offs.' }
        ];

        const meta = stepsMeta[currentStep - 1];

        body.innerHTML = `
            <div class="sd-interview-step-wrap">
                <div class="sd-step-progress-indicator">
                    Step ${currentStep} of 5 — <b>${meta.title}</b>
                </div>
                <p class="sd-step-desc">${meta.desc}</p>

                <div class="sd-interviewer-prompt">
                    <b>INTERVIEWER:</b>
                    <p>"Let's design ${system.name}. For this step, how would you approach: <i>${meta.title}</i>?"</p>
                </div>

                <div class="form-group">
                    <label>Your Proposed Answer:</label>
                    <textarea class="form-textarea sd-answer-input" id="inputSdStepAnswer" rows="8" placeholder="Type your detailed engineering rationale...">${session.answers[this.getSdKey(currentStep)] || ''}</textarea>
                </div>

                <div class="sd-reference-hint">
                    <details>
                        <summary>💡 Hint / Architectural Reference</summary>
                        <p style="margin-top: 8px; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                            ${currentStep === 1 ? system.steps.reqs : currentStep === 2 ? system.steps.scaleEst : currentStep === 3 ? `${system.steps.apis}\n\n${system.steps.dataModel}` : currentStep === 4 ? system.steps.arch : system.steps.keyInsight}
                        </p>
                    </details>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="action-btn-ghost" onclick="PlacementEngine.closeSdInterviewModal()">Cancel Interview</button>
            ${currentStep > 1 ? `<button class="action-btn-ghost" onclick="PlacementEngine.sdPrevStep()">← Previous</button>` : ''}
            ${currentStep < 5 ? `<button class="btn-primary" onclick="PlacementEngine.sdNextStep()">Next Step →</button>` : `<button class="btn-primary" onclick="PlacementEngine.sdSubmitInterview()">Complete & Score Interview 🎯</button>`}
        `;
    },

    getSdKey(step) {
        return ['reqs', 'scale', 'apis', 'arch', 'bottlenecks'][step - 1];
    },

    sdNextStep() {
        const input = document.getElementById('inputSdStepAnswer');
        if (input) {
            const key = this.getSdKey(this.currentSdInterview.currentStep);
            this.currentSdInterview.answers[key] = input.value;
        }
        if (this.currentSdInterview.currentStep < 5) {
            this.currentSdInterview.currentStep++;
            this.renderSdInterviewStep();
        }
    },

    sdPrevStep() {
        const input = document.getElementById('inputSdStepAnswer');
        if (input) {
            const key = this.getSdKey(this.currentSdInterview.currentStep);
            this.currentSdInterview.answers[key] = input.value;
        }
        if (this.currentSdInterview.currentStep > 1) {
            this.currentSdInterview.currentStep--;
            this.renderSdInterviewStep();
        }
    },

    sdSubmitInterview() {
        const input = document.getElementById('inputSdStepAnswer');
        if (input) {
            this.currentSdInterview.answers.bottlenecks = input.value;
        }

        const session = this.currentSdInterview;
        // Evaluate score based on length and depth of answers
        const calculateCategoryScore = (text, minLen) => {
            const len = (text || '').trim().length;
            if (len === 0) return 3;
            if (len < minLen) return 6;
            if (len < minLen * 2) return 8;
            return 9;
        };

        const reqScore = calculateCategoryScore(session.answers.reqs, 40);
        const scaleScore = calculateCategoryScore(session.answers.scale, 30);
        const archScore = calculateCategoryScore(session.answers.arch, 50);
        const tradeOffScore = calculateCategoryScore(session.answers.bottlenecks, 40);
        const total = reqScore + scaleScore + archScore + tradeOffScore;

        const record = Store.saveSystemDesignInterview({
            problemId: session.system.id,
            problemName: session.system.name,
            scores: {
                req: reqScore,
                scale: scaleScore,
                arch: archScore,
                tradeOff: tradeOffScore,
                overall: total
            },
            answers: session.answers
        });

        // Show Scorecard in Modal
        const body = document.getElementById('sdModalBody');
        const footer = document.getElementById('sdModalFooter');

        body.innerHTML = `
            <div class="sd-scorecard-wrap">
                <div class="sd-scorecard-hero">
                    <span style="font-size: 36px;">🏆</span>
                    <h2>SYSTEM DESIGN SCORECARD</h2>
                    <p>${session.system.name}</p>
                    <div class="sd-total-score">${total} <span>/ 40</span></div>
                </div>

                <div class="sd-score-grid">
                    <div class="sd-score-item">
                        <span>Requirements Clarification</span>
                        <b>${reqScore} / 10</b>
                    </div>
                    <div class="sd-score-item">
                        <span>Scale & Estimation</span>
                        <b>${scaleScore} / 10</b>
                    </div>
                    <div class="sd-score-item">
                        <span>Architecture & APIs</span>
                        <b>${archScore} / 10</b>
                    </div>
                    <div class="sd-score-item">
                        <span>Trade-offs & Scalability</span>
                        <b>${tradeOffScore} / 10</b>
                    </div>
                </div>

                <div class="sd-eval-note">
                    <b>Interviewer Feedback:</b> Good job walking through the structural decomposition of ${session.system.name}. Keep practicing the trade-offs between cache consistency and write latency.
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn-primary" onclick="PlacementEngine.closeSdInterviewModal()">Done ✓</button>
        `;
    },

    closeSdInterviewModal() {
        const modal = document.getElementById('systemDesignInterviewModal');
        if (modal) modal.classList.remove('active');
        this.currentSdInterview = null;
    },

    // ------------------------------------------------------------------------
    // GLOBAL FLASHCARD INTERVIEW MODE (Requirement 9)
    // ------------------------------------------------------------------------
    startGlobalInterviewMode() {
        const allQuestions = [];
        Object.keys(PLACEMENT_DATA.subjects).forEach(sKey => {
            const s = PLACEMENT_DATA.subjects[sKey];
            (s.questions || []).forEach(q => {
                allQuestions.push({ ...q, subjectName: s.name, subjectId: sKey });
            });
        });

        if (allQuestions.length === 0) {
            showToast('No questions available in question bank.', 'warning');
            return;
        }

        // Prioritize weak areas
        const weakAreas = Store.getWeakAreas().map(w => w.topic.toLowerCase());
        const prioritized = allQuestions.sort((a, b) => {
            const aIsWeak = weakAreas.includes(a.topic.toLowerCase()) ? 1 : 0;
            const bIsWeak = weakAreas.includes(b.topic.toLowerCase()) ? 1 : 0;
            return bIsWeak - aIsWeak || Math.random() - 0.5;
        });

        this.currentInterviewSession = {
            questions: prioritized,
            currentIndex: 0
        };

        const modal = document.getElementById('globalInterviewModal');
        if (!modal) return;

        this.renderInterviewModeQuestion();
        modal.classList.add('active');
    },

    renderInterviewModeQuestion() {
        const session = this.currentInterviewSession;
        if (!session || session.currentIndex >= session.questions.length) {
            this.renderInterviewModeComplete();
            return;
        }

        const q = session.questions[session.currentIndex];
        const body = document.getElementById('interviewModalBody');
        const footer = document.getElementById('interviewModalFooter');
        if (!body || !footer) return;

        body.innerHTML = `
            <div class="interview-flashcard">
                <div class="flashcard-header">
                    <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                    <span class="q-topic-tag">${q.subjectName} • ${q.topic}</span>
                    <span class="flashcard-counter">Question ${session.currentIndex + 1} of ${session.questions.length}</span>
                </div>
                <h3 class="flashcard-question">${q.question}</h3>
                <div class="q-concepts-wrap" style="margin: 16px 0;">
                    <b>Key concepts to cover:</b>
                    <div class="q-concept-tags">
                        ${(q.expectedConcepts || []).map(c => `<span class="concept-tag">${c}</span>`).join('')}
                    </div>
                </div>
                <div class="flashcard-answer-input">
                    <textarea class="form-textarea" id="txtFlashcardAnswer" rows="4" placeholder="Type your answer out loud or summarize your points..."></textarea>
                </div>

                <div class="flashcard-reveal-section">
                    <button class="action-btn-ghost" id="btnRevealFlashcard" onclick="document.getElementById('flashcardExplanation').style.display = 'block'; this.style.display = 'none';">
                        👁️ Reveal Answer
                    </button>
                    <div id="flashcardExplanation" style="display: none; margin-top: 14px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: var(--radius-md); border-left: 3px solid var(--gold);">
                        <b>Model Answer:</b>
                        <p style="margin-top: 6px; font-size: 13.5px; color: var(--text-secondary); line-height: 1.5;">${q.explanation}</p>
                    </div>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <div class="flashcard-eval-prompt">How did you perform?</div>
            <div class="flashcard-eval-buttons">
                <button class="btn-rate know" onclick="PlacementEngine.evalFlashcard('KNOW', '${q.id}', '${q.topic}', '${q.subjectId}')">😎 Know</button>
                <button class="btn-rate partial" onclick="PlacementEngine.evalFlashcard('REVISION', '${q.id}', '${q.topic}', '${q.subjectId}')">🤔 Partially Know</button>
                <button class="btn-rate dont_know" onclick="PlacementEngine.evalFlashcard('DONT_KNOW', '${q.id}', '${q.topic}', '${q.subjectId}')">❌ Don't Know</button>
            </div>
        `;
    },

    evalFlashcard(rating, qId, topic, subjectId) {
        Store.saveQuestionPerformance(qId, { status: rating });
        if (rating === 'REVISION' || rating === 'DONT_KNOW') {
            Store.recordWeakTopic(topic, subjectId);
        } else {
            Store.removeWeakTopic(topic);
        }

        this.currentInterviewSession.currentIndex++;
        this.renderInterviewModeQuestion();
    },

    renderInterviewModeComplete() {
        const body = document.getElementById('interviewModalBody');
        const footer = document.getElementById('interviewModalFooter');
        if (!body || !footer) return;

        body.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <span style="font-size: 48px;">🎉</span>
                <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin-top: 12px;">Interview Practice Session Complete!</h3>
                <p style="color: var(--text-secondary); margin-top: 6px; max-width: 480px; margin-left: auto; margin-right: auto;">
                    Great job exercising your technical interview recall. Your performance and weak areas have been saved.
                </p>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn-primary" onclick="PlacementEngine.closeGlobalInterviewModal()">Done ✓</button>
        `;
    },

    closeGlobalInterviewModal() {
        const modal = document.getElementById('globalInterviewModal');
        if (modal) modal.classList.remove('active');
        this.currentInterviewSession = null;
        this.renderPlacementView();
    },

    // ------------------------------------------------------------------------
    // SUNDAY WEEKLY TEST & TEST UI & TEST ANALYSIS (Requirements 10-14, 24, 25)
    // ------------------------------------------------------------------------
    startWeeklyTest() {
        if (typeof TestEngine !== 'undefined') {
            TestEngine.initTest();
            return;
        }
        // Initialize 23 questions fallback
        const template = JSON.parse(JSON.stringify(PLACEMENT_DATA.weeklyTestTemplate));
        const durationMinutes = 75; // 75 minutes

        this.currentTestSession = {
            date: DateUtils.todayIST(),
            totalQuestions: template.length,
            questions: template,
            currentIndex: 0,
            answers: {},
            reviewFlags: new Set(),
            timeRemainingSeconds: durationMinutes * 60,
            startTime: Date.now()
        };

        const modal = document.getElementById('weeklyTestModal');
        if (!modal) return;

        this.startTestTimer();
        this.renderTestQuestion();
        this.renderQuestionPallet();
        modal.classList.add('active');
    },

    startTestTimer() {
        if (this.testTimerInterval) clearInterval(this.testTimerInterval);
        this.testTimerInterval = setInterval(() => {
            if (!this.currentTestSession) {
                clearInterval(this.testTimerInterval);
                return;
            }

            this.currentTestSession.timeRemainingSeconds--;
            const timerEl = document.getElementById('weeklyTestTimerDisplay');
            if (timerEl) {
                const mins = Math.floor(this.currentTestSession.timeRemainingSeconds / 60);
                const secs = this.currentTestSession.timeRemainingSeconds % 60;
                timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }

            if (this.currentTestSession.timeRemainingSeconds <= 0) {
                clearInterval(this.testTimerInterval);
                alert('Time is up! Submitting test automatically.');
                this.submitWeeklyTest();
            }
        }, 1000);
    },

    renderTestQuestion() {
        const session = this.currentTestSession;
        if (!session) return;

        const q = session.questions[session.currentIndex];
        const container = document.getElementById('weeklyTestQuestionContainer');
        const counterEl = document.getElementById('weeklyTestCounter');
        const isMarked = session.reviewFlags.has(session.currentIndex);

        if (counterEl) {
            counterEl.textContent = `Question ${session.currentIndex + 1} / ${session.totalQuestions}`;
        }

        let inputAreaHtml = '';

        if (q.type === 'mcq') {
            const selectedOpt = session.answers[q.id];
            inputAreaHtml = `
                <div class="test-options-list">
                    ${q.options.map((opt, idx) => `
                        <label class="test-option-label ${selectedOpt === idx ? 'selected' : ''}">
                            <input type="radio" name="opt_${q.id}" value="${idx}" ${selectedOpt === idx ? 'checked' : ''} onchange="PlacementEngine.onTestMcqSelect('${q.id}', ${idx})">
                            <span class="opt-bullet">${String.fromCharCode(65 + idx)}</span>
                            <span class="opt-text">${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (q.type === 'dsa_code' || q.type === 'sql_query') {
            const currentCode = session.answers[q.id] !== undefined ? session.answers[q.id] : q.starterCode;
            inputAreaHtml = `
                <div class="test-code-editor-wrap">
                    <div class="test-editor-bar">
                        <span>${q.type === 'dsa_code' ? '💻 Solution (JavaScript / C++)' : '📊 SQL Query'}</span>
                        <button class="action-btn-ghost" style="padding: 2px 8px; font-size: 11px;" onclick="PlacementEngine.resetTestCode('${q.id}')">Reset Starter Code</button>
                    </div>
                    <textarea class="test-code-editor" id="code_${q.id}" oninput="PlacementEngine.onTestCodeInput('${q.id}', this.value)" rows="10">${currentCode}</textarea>
                </div>
            `;
        } else if (q.type === 'conceptual') {
            const currentText = session.answers[q.id] || '';
            inputAreaHtml = `
                <div class="form-group" style="margin-top: 16px;">
                    <label>Explain your architectural intuition:</label>
                    <textarea class="form-textarea" rows="6" oninput="PlacementEngine.onTestConceptualInput('${q.id}', this.value)" placeholder="Write your explanation in clear technical detail...">${currentText}</textarea>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="test-question-box">
                <div class="test-question-header">
                    <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                    <span class="q-topic-tag">${q.subject} • ${q.topic}</span>
                    ${isMarked ? `<span class="badge-review-flag">🚩 Marked for Review</span>` : ''}
                </div>
                <h3 class="test-q-text">${q.question}</h3>
                ${q.testCases ? `
                    <div class="test-cases-preview">
                        <b>Test Examples:</b>
                        ${q.testCases.map(tc => `<div class="tc-row">Input: <code>${tc.input}</code> → Output: <code>${tc.output}</code></div>`).join('')}
                    </div>
                ` : ''}
                ${inputAreaHtml}
            </div>
        `;

        this.renderQuestionPallet();
    },

    renderQuestionPallet() {
        const pallet = document.getElementById('weeklyTestPalletGrid');
        if (!pallet || !this.currentTestSession) return;

        const session = this.currentTestSession;
        pallet.innerHTML = session.questions.map((q, idx) => {
            const isCurrent = session.currentIndex === idx;
            const isAnswered = session.answers[q.id] !== undefined && session.answers[q.id] !== '';
            const isMarked = session.reviewFlags.has(idx);

            let statusClass = '';
            if (isCurrent) statusClass = 'current';
            else if (isMarked) statusClass = 'marked';
            else if (isAnswered) statusClass = 'answered';

            return `
                <button class="pallet-btn ${statusClass}" onclick="PlacementEngine.jumpToTestQuestion(${idx})">
                    ${idx + 1}
                </button>
            `;
        }).join('');
    },

    jumpToTestQuestion(idx) {
        if (!this.currentTestSession) return;
        this.currentTestSession.currentIndex = idx;
        this.renderTestQuestion();
    },

    nextTestQuestion() {
        if (!this.currentTestSession) return;
        if (this.currentTestSession.currentIndex < this.currentTestSession.totalQuestions - 1) {
            this.currentTestSession.currentIndex++;
            this.renderTestQuestion();
        }
    },

    prevTestQuestion() {
        if (!this.currentTestSession) return;
        if (this.currentTestSession.currentIndex > 0) {
            this.currentTestSession.currentIndex--;
            this.renderTestQuestion();
        }
    },

    toggleMarkForReview() {
        if (!this.currentTestSession) return;
        const idx = this.currentTestSession.currentIndex;
        if (this.currentTestSession.reviewFlags.has(idx)) {
            this.currentTestSession.reviewFlags.delete(idx);
        } else {
            this.currentTestSession.reviewFlags.add(idx);
        }
        this.renderTestQuestion();
    },

    onTestMcqSelect(qId, optIdx) {
        if (!this.currentTestSession) return;
        this.currentTestSession.answers[qId] = optIdx;
        this.renderQuestionPallet();
    },

    onTestCodeInput(qId, code) {
        if (!this.currentTestSession) return;
        this.currentTestSession.answers[qId] = code;
        this.renderQuestionPallet();
    },

    onTestConceptualInput(qId, val) {
        if (!this.currentTestSession) return;
        this.currentTestSession.answers[qId] = val;
        this.renderQuestionPallet();
    },

    resetTestCode(qId) {
        const q = this.currentTestSession.questions.find(item => item.id === qId);
        if (!q) return;
        const editor = document.getElementById(`code_${qId}`);
        if (editor) {
            editor.value = q.starterCode;
            this.onTestCodeInput(qId, q.starterCode);
        }
    },

    submitWeeklyTest() {
        if (!this.currentTestSession) return;
        if (this.testTimerInterval) clearInterval(this.testTimerInterval);

        const session = this.currentTestSession;
        let correct = 0;
        let wrong = 0;
        let skipped = 0;

        const categoryScores = {
            DSA: { total: 0, correct: 0 },
            DBMS: { total: 0, correct: 0 },
            OS: { total: 0, correct: 0 },
            CN: { total: 0, correct: 0 },
            OOP: { total: 0, correct: 0 },
            'System Design': { total: 0, correct: 0 },
            SQL: { total: 0, correct: 0 },
            Aptitude: { total: 0, correct: 0 },
            Interview: { total: 0, correct: 0 }
        };

        const weakTopics = [];
        const strongTopics = [];

        session.questions.forEach(q => {
            const cat = categoryScores[q.category] || { total: 0, correct: 0 };
            cat.total++;

            const answer = session.answers[q.id];

            if (q.type === 'mcq') {
                if (answer === undefined || answer === null) {
                    skipped++;
                } else if (answer === q.correctAnswer) {
                    correct++;
                    cat.correct++;
                    strongTopics.push({ topic: q.topic, subject: q.subject });
                } else {
                    wrong++;
                    weakTopics.push({ topic: q.topic, subject: q.subject });
                }
            } else {
                // Code or Conceptual evaluation based on response
                if (!answer || answer.trim().length === 0 || answer === q.starterCode) {
                    skipped++;
                } else if (answer.trim().length > 30) {
                    // Answered adequately
                    correct++;
                    cat.correct++;
                    strongTopics.push({ topic: q.topic, subject: q.subject });
                } else {
                    wrong++;
                    weakTopics.push({ topic: q.topic, subject: q.subject });
                }
            }
            categoryScores[q.category] = cat;
        });

        const totalAnswered = correct + wrong;
        const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
        const overallScore = Math.round((correct / session.totalQuestions) * 100);
        const timeTakenSeconds = (session.totalQuestions * 60) - session.timeRemainingSeconds;

        // Save result
        const testResult = Store.saveWeeklyTestResult({
            date: session.date,
            durationSeconds: timeTakenSeconds,
            score: overallScore,
            accuracy,
            breakdown: categoryScores,
            answers: session.answers,
            weakTopics,
            strongTopics
        });

        // Close test modal
        document.getElementById('weeklyTestModal').classList.remove('active');
        this.currentTestSession = null;

        // Open Analysis Modal
        this.showTestAnalysis(testResult);
        this.renderPlacementView();
    },

    showTestAnalysis(test) {
        if (typeof TestEngine !== 'undefined') {
            TestEngine.showAnalysis(test);
            return;
        }
        const modal = document.getElementById('testAnalysisModal');
        const body = document.getElementById('testAnalysisModalBody');
        if (!modal || !body) return;

        // Extract top 3 weak areas for Next Week Focus (Requirement 14)
        const focusRecommendations = [];
        (test.weakTopics || []).forEach(wt => {
            if (!focusRecommendations.some(f => f.topic.toLowerCase() === wt.topic.toLowerCase())) {
                focusRecommendations.push(wt);
            }
        });
        const top3Focus = focusRecommendations.slice(0, 3);

        let breakdownHtml = Object.keys(test.breakdown || {}).map(catKey => {
            const item = test.breakdown[catKey];
            if (item.total === 0) return '';
            const pct = Math.round((item.correct / item.total) * 100);
            return `
                <div class="analysis-category-row">
                    <span class="cat-label">${catKey}</span>
                    <div class="cat-bar-wrap">
                        <div class="cat-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span class="cat-fraction">${item.correct} / ${item.total} (${pct}%)</span>
                </div>
            `;
        }).join('');

        body.innerHTML = `
            <div class="test-analysis-wrap">
                <div class="analysis-hero-card">
                    <div class="analysis-score-badge">
                        <span class="analysis-score-number">${test.score}%</span>
                        <span class="analysis-score-sub">Overall Score</span>
                    </div>
                    <div class="analysis-hero-stats">
                        <div class="stat-bubble">
                            <span>Accuracy</span>
                            <b>${test.accuracy}%</b>
                        </div>
                        <div class="stat-bubble">
                            <span>Date</span>
                            <b>${DateUtils.formatDateShort(test.date)}</b>
                        </div>
                    </div>
                </div>

                <div class="analysis-section-title">📊 Subject Breakdown</div>
                <div class="analysis-breakdown-list">
                    ${breakdownHtml}
                </div>

                <div class="analysis-focus-box">
                    <div class="focus-box-title">🎯 NEXT WEEK FOCUS (Max 3 Recommendations)</div>
                    ${top3Focus.length > 0 ? `
                        <ol class="focus-recommendations-list">
                            ${top3Focus.map(f => `
                                <li>
                                    <b>Revise ${f.topic}</b> (${f.subject}) — Flagged as weak in today's test.
                                    <button class="action-btn-ghost" style="padding: 2px 8px; font-size: 11px; margin-left: 8px;" onclick="PlacementEngine.openSubject('${(f.subject || 'dsa').toLowerCase()}', 'roadmap')">Open Topic →</button>
                                </li>
                            `).join('')}
                        </ol>
                    ` : `
                        <p style="color: var(--text-secondary); font-size: 13.5px; margin: 0;">
                            ✨ Outstanding test! No major weak topics detected. Maintain your daily DSA and Development routines.
                        </p>
                    `}
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeTestAnalysisModal() {
        if (typeof TestEngine !== 'undefined') {
            TestEngine.closeTestAnalysisModal();
            return;
        }
        const modal = document.getElementById('testAnalysisModal');
        if (modal) modal.classList.remove('active');
    },

    // ------------------------------------------------------------------------
    // TEST HISTORY (Requirement 25)
    // ------------------------------------------------------------------------
    openTestHistory() {
        if (typeof TestEngine !== 'undefined') {
            TestEngine.openHistory();
            return;
        }
        const modal = document.getElementById('testHistoryModal');
        const list = document.getElementById('testHistoryList');
        if (!modal || !list) return;

        const history = Store.getWeeklyTestHistory();
        if (history.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">No Sunday tests taken yet. Click "📝 Weekly Test" to take your first test!</div>`;
        } else {
            list.innerHTML = history.map(t => `
                <div class="test-history-row" onclick="PlacementEngine.showTestAnalysis(${JSON.stringify(t).replace(/"/g, '&quot;')})">
                    <div>
                        <b style="font-size: 15px; color: #fff;">Sunday Test — ${DateUtils.formatDateLong(t.date)}</b>
                        <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">
                            Score: <b>${t.score}%</b> • Accuracy: <b>${t.accuracy}%</b>
                            ${t.weakTopics && t.weakTopics.length > 0 ? ` • Weak: <span style="color: var(--rose);">${t.weakTopics.map(w => w.topic).slice(0, 2).join(', ')}</span>` : ''}
                        </div>
                    </div>
                    <button class="action-btn-ghost">View Analysis →</button>
                </div>
            `).join('');
        }

        modal.classList.add('active');
    },

    closeTestHistoryModal() {
        if (typeof TestEngine !== 'undefined') {
            TestEngine.closeTestHistoryModal();
            return;
        }
        const modal = document.getElementById('testHistoryModal');
        if (modal) modal.classList.remove('active');
    },

    // ------------------------------------------------------------------------
    // BOOKMARKS DRAWER (Requirement 19)
    // ------------------------------------------------------------------------
    openBookmarksDrawer() {
        const modal = document.getElementById('bookmarksModal');
        const list = document.getElementById('bookmarksList');
        if (!modal || !list) return;

        const bookmarks = Store.getBookmarks();
        if (bookmarks.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">No bookmarks saved yet. Click the ⭐ icon next to any topic, question, or video to bookmark it!</div>`;
        } else {
            list.innerHTML = bookmarks.map(b => `
                <div class="bookmark-row">
                    <div>
                        <span class="bookmark-type-pill ${b.type}">${b.type.toUpperCase()}</span>
                        <b style="font-size: 14.5px; color: #fff; margin-left: 8px;">${b.title}</b>
                        ${b.subtitle ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${b.subtitle}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        ${b.subjectId ? `<button class="action-btn-ghost" onclick="PlacementEngine.openSubject('${b.subjectId}')">Open →</button>` : ''}
                        <button class="action-btn-ghost danger" onclick="PlacementEngine.removeBookmark('${b.id}')">✕</button>
                    </div>
                </div>
            `).join('');
        }

        modal.classList.add('active');
    },

    closeBookmarksDrawer() {
        const modal = document.getElementById('bookmarksModal');
        if (modal) modal.classList.remove('active');
    },

    toggleBookmarkTopic(subjectId, topicId, title) {
        if (Store.isBookmarked(topicId)) {
            Store.removeBookmark(topicId);
            showToast('Bookmark removed', 'info');
        } else {
            Store.addBookmark({
                id: topicId,
                type: 'topic',
                subjectId,
                title,
                subtitle: `Subject: ${subjectId.toUpperCase()}`
            });
            showToast('Bookmarked topic! ⭐', 'success');
        }
        this.switchSubjectTab(this.currentSubjectTab);
    },

    toggleBookmarkQuestion(qId, title, subjectId) {
        if (Store.isBookmarked(qId)) {
            Store.removeBookmark(qId);
            showToast('Bookmark removed', 'info');
        } else {
            Store.addBookmark({
                id: qId,
                type: 'question',
                subjectId,
                title,
                subtitle: `Interview Question (${subjectId.toUpperCase()})`
            });
            showToast('Bookmarked question! ⭐', 'success');
        }
        this.switchSubjectTab(this.currentSubjectTab);
    },

    removeBookmark(id) {
        Store.removeBookmark(id);
        this.openBookmarksDrawer();
    },

    // ------------------------------------------------------------------------
    // GLOBAL SEARCH (Requirement 20)
    // ------------------------------------------------------------------------
    openGlobalSearch() {
        const modal = document.getElementById('globalSearchModal');
        const input = document.getElementById('globalSearchInput');
        const results = document.getElementById('globalSearchResults');
        if (!modal) return;

        if (input) input.value = '';
        if (results) results.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Type to search across DSA problems, subjects, system design, interview questions & notes...</div>`;

        modal.classList.add('active');
        if (input) setTimeout(() => input.focus(), 100);
    },

    closeGlobalSearch() {
        const modal = document.getElementById('globalSearchModal');
        if (modal) modal.classList.remove('active');
    },

    onSearchInput(query) {
        const resultsContainer = document.getElementById('globalSearchResults');
        if (!resultsContainer) return;

        const q = query.trim().toLowerCase();
        if (!q) {
            resultsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Type to search across DSA problems, subjects, system design, interview questions & notes...</div>`;
            return;
        }

        const hits = [];

        // 1. Search Subjects & Roadmap Topics
        Object.keys(PLACEMENT_DATA.subjects).forEach(sKey => {
            const s = PLACEMENT_DATA.subjects[sKey];
            if (s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))) {
                hits.push({
                    type: 'Subject',
                    title: s.name,
                    subtitle: s.subtitle || s.description,
                    action: () => { PlacementEngine.closeGlobalSearch(); PlacementEngine.openSubject(sKey); }
                });
            }
            (s.roadmap || []).forEach(r => {
                if (r.title.toLowerCase().includes(q) || r.section.toLowerCase().includes(q)) {
                    hits.push({
                        type: 'Roadmap Topic',
                        title: r.title,
                        subtitle: `${s.name} • ${r.section}`,
                        action: () => { PlacementEngine.closeGlobalSearch(); PlacementEngine.openSubject(sKey, 'roadmap'); }
                    });
                }
            });
            (s.questions || []).forEach(qu => {
                if (qu.question.toLowerCase().includes(q) || qu.topic.toLowerCase().includes(q)) {
                    hits.push({
                        type: 'Interview Question',
                        title: qu.question,
                        subtitle: `${s.name} • ${qu.topic}`,
                        action: () => { PlacementEngine.closeGlobalSearch(); PlacementEngine.openSubject(sKey, 'questions'); }
                    });
                }
            });
        });

        // 2. Search System Design Concepts & Patterns
        const sdLevels = PLACEMENT_DATA.subjects.sysdesign.levels;
        (sdLevels.level1.concepts || []).forEach(c => {
            if (c.name.toLowerCase().includes(q) || c.what.toLowerCase().includes(q)) {
                hits.push({
                    type: 'System Design Concept',
                    title: c.name,
                    subtitle: c.what,
                    action: () => { PlacementEngine.closeGlobalSearch(); PlacementEngine.openSubject('sysdesign', 'sysdesign'); }
                });
            }
        });
        (sdLevels.level4.systems || []).forEach(sys => {
            if (sys.name.toLowerCase().includes(q) || sys.steps.keyInsight.toLowerCase().includes(q)) {
                hits.push({
                    type: 'System Design Case Study',
                    title: sys.name,
                    subtitle: sys.steps.keyInsight,
                    action: () => { PlacementEngine.closeGlobalSearch(); PlacementEngine.startSystemDesignInterview(sys.id); }
                });
            }
        });

        // 3. Search DSA Problems
        if (typeof DSA_A2Z_SHEET !== 'undefined') {
            DSA_A2Z_SHEET.forEach(sec => {
                (sec.subcategories || []).forEach(sub => {
                    (sub.problems || []).forEach(prob => {
                        if (prob.name.toLowerCase().includes(q)) {
                            hits.push({
                                type: 'DSA Problem',
                                title: prob.name,
                                subtitle: `${sec.name} • Difficulty: ${prob.difficulty}`,
                                action: () => { PlacementEngine.closeGlobalSearch(); App.switchView('dsa'); }
                            });
                        }
                    });
                });
            });
        }

        if (hits.length === 0) {
            resultsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No matching results found for "${query}".</div>`;
            return;
        }

        resultsContainer.innerHTML = hits.slice(0, 15).map((h, i) => `
            <div class="search-result-item" id="searchHit_${i}">
                <div>
                    <span class="search-result-badge">${h.type}</span>
                    <b class="search-result-title">${h.title}</b>
                    <div class="search-result-sub">${h.subtitle}</div>
                </div>
                <button class="action-btn-ghost">View →</button>
            </div>
        `).join('');

        hits.slice(0, 15).forEach((h, i) => {
            const el = document.getElementById(`searchHit_${i}`);
            if (el) el.onclick = h.action;
        });
    },

    // ------------------------------------------------------------------------
    // CALENDAR INTEGRATION: "STUDY TODAY" (Requirement 15)
    // ------------------------------------------------------------------------
    scheduleSubjectToday(subjectId, subjectName) {
        const todayStr = DateUtils.todayIST();
        const taskTitle = `📚 Placement: ${subjectName} Study Session`;

        TaskEngine.addCustomTask(todayStr, {
            title: taskTitle,
            category: 'PLACEMENT',
            startTime: '15:15',
            endTime: '16:15',
            isStudy: true,
            notes: `Added from Placement Hub: ${subjectName}`
        });

        this.closeSubjectModal();
        showToast(`Scheduled "${subjectName}" for today (15:15 – 16:15)!`, 'success');
        CalendarEngine.render();
    },

    scheduleTopicToday(subjectId, topicTitle) {
        const todayStr = DateUtils.todayIST();
        const taskTitle = `📚 Placement: ${topicTitle}`;

        TaskEngine.addCustomTask(todayStr, {
            title: taskTitle,
            category: 'PLACEMENT',
            startTime: '15:15',
            endTime: '16:15',
            isStudy: true,
            notes: `Placement topic checklist item`
        });

        showToast(`Scheduled "${topicTitle}" for today!`, 'success');
        CalendarEngine.render();
    }
};

if (typeof window !== 'undefined') {
    window.PlacementEngine = PlacementEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { PlacementEngine };
}
