/**
 * FORGE — GATE 2027 SYLLABUS-FIRST STUDY PLANNER & CALENDAR ENGINE
 *
 * Core Principles:
 * 1. SYLLABUS-FIRST: Source of truth is official GATE 2027 CSE syllabus (11 Subjects, 81 Topics).
 * 2. TOPIC-FIRST: Focus on concept mastery, structured notes, and handbook PYQ problem-solving.
 * 3. CALENDAR-FIRST: Dedicated 123-day schedule (01 Oct 2026 – 31 Jan 2027) with ZERO empty dates.
 * 4. COMPLETION GUARANTEE: Every syllabus topic is planned; PYQs are an action checklist item.
 */

const GatePlannerEngine = {
    activeMonth: '2026-10', // '2026-10' | '2026-11' | '2026-12' | '2027-01'
    expandedSubjects: new Set(['algo']), // Algorithms expanded by default
    activeModalDate: null,
    activeModalTopicId: null,

    init() {
        if (typeof Store !== 'undefined' && Store.getGateState) {
            Store.getGateState();
        }
    },

    // =========================================================================
    // 1. DATA ACCESS & SYLLABUS RESOLUTION
    // =========================================================================

    getSyllabusData() {
        if (typeof window !== 'undefined' && window.GATE_DATA_2027) {
            return window.GATE_DATA_2027;
        }
        if (typeof global !== 'undefined' && global.GATE_DATA_2027) {
            return global.GATE_DATA_2027;
        }
        try {
            return require('../data/gate-data.js');
        } catch (e) {
            return { subjects: [], topics: [], calendar: [] };
        }
    },

    getAllSubjects() {
        const data = this.getSyllabusData();
        return Array.isArray(data.subjects) ? data.subjects : (data.GATE_SYLLABUS || []);
    },

    getAllTopics() {
        const data = this.getSyllabusData();
        if (Array.isArray(data.topics) && data.topics.length > 0) return data.topics;
        const subjects = this.getAllSubjects();
        const list = [];
        subjects.forEach(s => {
            (s.topics || []).forEach(t => {
                list.push({ ...t, subjectId: s.id, subjectName: s.name });
            });
        });
        return list;
    },

    getTopicById(topicId) {
        if (!topicId) return null;
        const all = this.getAllTopics();
        return all.find(t => t.id === topicId || t.topicId === topicId) || null;
    },

    getSubjectById(subjectId) {
        if (!subjectId) return null;
        const subjects = this.getAllSubjects();
        return subjects.find(s => s.id === subjectId) || null;
    },

    // =========================================================================
    // 2. SUBJECTS LIST & TOPIC PRIORITIES
    // =========================================================================

    /**
     * Calculates subject progress and sorts subjects strictly HIGH -> LOW by historical weightage
     */
    calculateSubjectPriorities() {
        const subjects = this.getAllSubjects();
        const gate = (typeof Store !== 'undefined' && Store.getGateState) ? Store.getGateState() : {};
        const topicStatuses = gate.topicStatuses || {};

        const results = subjects.map(subj => {
            const topics = subj.topics || [];
            const topicsCount = topics.length;
            let completedCount = 0;
            let inProgressCount = 0;

            topics.forEach(t => {
                const st = topicStatuses[t.id]?.status || 'NOT_STARTED';
                if (st === 'COMPLETED') completedCount++;
                else if (st === 'IN_PROGRESS' || st === 'STUDY_COMPLETE' || st === 'PYQ_PENDING') inProgressCount++;
            });

            const progressPct = topicsCount > 0 ? Math.round((completedCount / topicsCount) * 100) : 0;

            return {
                id: subj.id,
                name: subj.name,
                shortName: subj.shortName || subj.name,
                icon: subj.icon || '📚',
                historicalWeight: subj.historicalWeight || 0,
                importance: subj.importance || 'MEDIUM',
                officialSection: subj.officialSection || '',
                plannedDateRange: subj.plannedDateRange || 'Oct 2026 – Jan 2027',
                topicsCount,
                completedCount,
                inProgressCount,
                progressPct,
                topics
            };
        });

        // Sort HIGH -> LOW by historicalWeight
        return results.sort((a, b) => b.historicalWeight - a.historicalWeight);
    },

    /**
     * Returns topics of a subject sorted by importance:
     * HIGH -> HIGH-MEDIUM -> MEDIUM -> LOW
     */
    getSubjectTopicsSorted(subjectId) {
        const subj = this.getSubjectById(subjectId);
        if (!subj) return [];
        const topics = [...(subj.topics || [])];

        const importanceRank = {
            'HIGH': 4,
            'HIGH-MEDIUM': 3,
            'MEDIUM': 2,
            'LOW': 1
        };

        const gate = (typeof Store !== 'undefined' && Store.getGateState) ? Store.getGateState() : {};
        const topicStatuses = gate.topicStatuses || {};

        return topics.map(t => {
            const stObj = topicStatuses[t.id] || {};
            return {
                ...t,
                subjectId: subj.id,
                subjectName: subj.name,
                status: stObj.status || 'NOT_STARTED',
                notes: stObj.notes || ''
            };
        }).sort((a, b) => {
            const rankDiff = (importanceRank[b.importance] || 2) - (importanceRank[a.importance] || 2);
            if (rankDiff !== 0) return rankDiff;
            return (b.historicalFrequency || 50) - (a.historicalFrequency || 50);
        });
    },

    // =========================================================================
    // 3. CALENDAR DATA & VALIDATION
    // =========================================================================

    getCalendarDays() {
        if (typeof Store !== 'undefined' && Store.getGatePlanItems) {
            return Store.getGatePlanItems();
        }
        const data = this.getSyllabusData();
        return data.calendar || data.GATE_DEDICATED_CALENDAR_DEFAULT || [];
    },

    getTodayPlanItem() {
        const days = this.getCalendarDays();
        if (!days || days.length === 0) return null;

        // Current simulated / real date
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        // 1. Exact match if within calendar range
        const exactMatch = days.find(d => d.date === todayStr || d.plannedDate === todayStr);
        if (exactMatch) return exactMatch;

        // 2. If before calendar start (before 2026-10-01), default to Day 1 (2026-10-01)
        if (todayStr < '2026-10-01') {
            return days[0];
        }

        // 3. First non-completed day
        const firstPending = days.find(d => d.status !== 'COMPLETED');
        if (firstPending) return firstPending;

        // 4. Default to final day
        return days[days.length - 1];
    },

    getUpcomingDays(limit = 5) {
        const days = this.getCalendarDays();
        const today = this.getTodayPlanItem();
        if (!today || !days.length) return [];

        const todayIdx = days.findIndex(d => d.date === today.date);
        const startIdx = todayIdx >= 0 ? todayIdx + 1 : 0;
        return days.slice(startIdx, startIdx + limit);
    },

    validateCoverage() {
        const data = this.getSyllabusData();
        if (typeof data.validateGateCalendarCoverage === 'function') {
            return data.validateGateCalendarCoverage();
        }
        if (typeof window !== 'undefined' && typeof window.validateGateCalendarCoverage === 'function') {
            return window.validateGateCalendarCoverage();
        }

        const totalTopics = this.getAllTopics().length;
        const days = this.getCalendarDays();
        const coveredTopicIds = new Set(days.map(d => d.topicId));

        return {
            isValid: coveredTopicIds.size === totalTopics && days.length === 123,
            totalSyllabusTopics: totalTopics,
            plannedTopics: coveredTopicIds.size,
            unplannedTopics: Math.max(0, totalTopics - coveredTopicIds.size),
            totalCalendarDays: 123,
            filledCalendarDays: days.length,
            missingTopics: [],
            duplicateTopics: []
        };
    },

    // =========================================================================
    // 4. BACKWARD COMPATIBILITY DIRECTIVES & METRICS (For ai-engine & schedule)
    // =========================================================================

    getTonightDirective() {
        const todayItem = this.getTodayPlanItem();
        const subjName = todayItem ? (todayItem.subjectName || todayItem.subjectId) : 'Algorithms';
        const topName = todayItem ? todayItem.topicName : 'Asymptotic Analysis & Recurrences';
        const subjId = todayItem ? todayItem.subjectId : 'algo';
        const topId = todayItem ? todayItem.topicId : 'algo_asymptotic_complexity';

        return {
            date: todayItem ? todayItem.date : '2026-10-01',
            subjectId: subjId,
            subjectName: subjName,
            subject: { id: subjId, name: subjName },
            topicId: topId,
            topicName: topName,
            topic: { id: topId, name: topName },
            importance: todayItem ? (todayItem.importance || 'HIGH') : 'HIGH',
            objective: todayItem ? (todayItem.objective || 'Complete syllabus reading, short notes & topic-wise handbook PYQs') : 'Master asymptotic complexity definitions and solve handbook PYQs',
            targetPyqs: 8,
            pyqTarget: 8,
            targetAccuracy: 85,
            suggestedDurationMinutes: 90,
            priorityScore: todayItem ? (todayItem.historicalFrequency || 90) : 95,
            tasks: todayItem ? (todayItem.tasks || []) : [],
            reason: todayItem ? (todayItem.isPractice
                ? 'Deep-dive problem practice and handbook PYQ problem-solving block'
                : (todayItem.isRevision ? 'Scheduled revision checkpoint for long-term retention' : 'Primary syllabus curriculum coverage block'))
                : 'Official syllabus-first schedule for GATE 2027 kickoff'
        };
    },

    getGateSummaryMetrics() {
        if (typeof Store !== 'undefined' && Store.getGateSyllabusProgress) {
            return Store.getGateSyllabusProgress();
        }
        return {
            totalTopics: 81,
            completedTopics: 0,
            inProgressTopics: 0,
            totalSubjects: 11,
            completedSubjects: 0,
            totalCalendarDays: 123,
            completedCalendarDays: 0,
            highPriorityTotal: 71,
            highPriorityCompleted: 0,
            overallProgressPct: 0
        };
    },

    // =========================================================================
    // 5. MAIN PAGE RENDERER (Section 2, 3, 7, 16, 17, 18, 19)
    // =========================================================================

    renderPlannerPage() {
        const container = document.getElementById('view-gate');
        if (!container) return;

        try {
            const progress = this.getGateSummaryMetrics();
            const todayItem = this.getTodayPlanItem();
            const subjects = this.calculateSubjectPriorities();
            const upcoming = this.getUpcomingDays(4);
            const validation = this.validateCoverage();

            container.innerHTML = `
                <!-- GATE 2027 MAIN HEADER -->
                <div class="gate-planner-header">
                    <div>
                        <div class="gate-hero-pill-row">
                            <span class="gate-hero-pill">🎓 GATE 2027 · SYLLABUS-FIRST STUDY PLANNER</span>
                            <span class="gate-coverage-pill ${validation.isValid ? 'valid' : 'invalid'}">
                                ${validation.isValid ? '🛡️ 100% Syllabus Coverage' : '⚠️ Syllabus Coverage Alert'}
                            </span>
                        </div>
                        <h2 class="gate-view-title">GATE 2027 Study Planner</h2>
                        <p class="gate-view-desc">
                            Syllabus-first, topic-first, calendar-first preparation. Every official CSE 2027 topic is mapped to an actionable date with concrete checklists.
                        </p>
                    </div>
                    <div class="gate-header-action-row">
                        <button type="button" class="action-btn-ghost" onclick="GatePlannerEngine.validateAndReportCoverage()">
                            <span>🔍 Audit Coverage</span>
                        </button>
                        <button type="button" class="btn-primary" onclick="GatePlannerEngine.openTopicDetailModal('${todayItem ? todayItem.date : '2026-10-01'}')">
                            <span>⚡ Today's Topic Details</span>
                        </button>
                    </div>
                </div>

                <!-- VALIDATION ALERT (Section 20) -->
                ${!validation.isValid ? `
                    <div class="gate-validation-failure-banner">
                        <h4>⚠️ GATE PLAN VALIDATION FAILED</h4>
                        <p>Missing topics: <b>${validation.unplannedTopics}</b> · Empty dates: <b>${Math.max(0, 123 - validation.filledCalendarDays)}</b></p>
                    </div>
                ` : ''}

                <!-- A. OVERALL SYLLABUS PROGRESS SCOREBOARD (Section 19) -->
                <div class="gate-stats-grid">
                    <div class="gate-stat-card">
                        <div class="gs-label">Overall Progress</div>
                        <div class="gs-val accent">${progress.overallProgressPct}%</div>
                        <div class="gs-sub">Weighted syllabus completion</div>
                    </div>
                    <div class="gate-stat-card">
                        <div class="gs-label">Topics Completed</div>
                        <div class="gs-val ${progress.completedTopics > 0 ? 'success' : 'muted'}">
                            ${progress.completedTopics} / ${progress.totalTopics}
                        </div>
                        <div class="gs-sub">${progress.inProgressTopics} in progress · 81 total topics</div>
                    </div>
                    <div class="gate-stat-card">
                        <div class="gs-label">Subjects Mastered</div>
                        <div class="gs-val ${progress.completedSubjects > 0 ? 'success' : 'muted'}">
                            ${progress.completedSubjects} / ${progress.totalSubjects}
                        </div>
                        <div class="gs-sub">11 Official GATE Sections</div>
                    </div>
                    <div class="gate-stat-card">
                        <div class="gs-label">Dedicated Calendar</div>
                        <div class="gs-val accent">
                            ${progress.completedCalendarDays} / ${progress.totalCalendarDays}
                        </div>
                        <div class="gs-sub">01 Oct 2026 → 31 Jan 2027</div>
                    </div>
                    <div class="gate-stat-card">
                        <div class="gs-label">High Priority Coverage</div>
                        <div class="gs-val ${progress.highPriorityCompleted > 0 ? 'success' : 'warning'}">
                            ${progress.highPriorityCompleted} / ${progress.highPriorityTotal}
                        </div>
                        <div class="gs-sub">High & High-Medium Weight</div>
                    </div>
                    <div class="gate-stat-card">
                        <div class="gs-label">Revision Required</div>
                        <div class="gs-val ${progress.revisionRequiredTopics > 0 ? 'warning' : 'muted'}">
                            ${progress.revisionRequiredTopics}
                        </div>
                        <div class="gs-sub">Scheduled spaced review</div>
                    </div>
                </div>

                <!-- B. TODAY'S GATE PLAN & UP NEXT DUAL STRIP (Section 14, 17, 18) -->
                <div class="gate-today-upnext-grid">
                    <!-- Today Card -->
                    <div class="gate-today-card-box">
                        <div class="gate-section-label">⚡ TODAY'S GATE PLAN</div>
                        <div id="gateTodayCardContainer">
                            ${this.renderTodayCardHtml(todayItem)}
                        </div>
                    </div>

                    <!-- Up Next Queue -->
                    <div class="gate-upnext-card-box">
                        <div class="gate-section-label">⏭️ UP NEXT IN CALENDAR</div>
                        <div class="gate-upnext-list">
                            ${upcoming.length > 0 ? upcoming.map(u => `
                                <div class="gate-upnext-item" onclick="GatePlannerEngine.openTopicDetailModal('${u.date}')">
                                    <div class="gate-upnext-date-badge">${this.formatShortDate(u.date)}</div>
                                    <div class="gate-upnext-info">
                                        <div class="gate-upnext-subj">${this.escapeHtml(u.subjectName)}</div>
                                        <div class="gate-upnext-topic">${this.escapeHtml(u.topicName)}</div>
                                    </div>
                                    <span class="gate-importance-tag ${u.importance ? u.importance.toLowerCase().replace('-', '_') : 'medium'}">
                                        ${u.importance || 'MED'}
                                    </span>
                                </div>
                            `).join('') : '<div class="gate-empty-hint">End of calendar reached.</div>'}
                        </div>
                    </div>
                </div>

                <!-- C. DEDICATED GATE 2027 STUDY CALENDAR (Section 7, 8, 9, 10, 16) -->
                <div class="gate-calendar-section-wrap">
                    <div class="gate-calendar-header-bar">
                        <div>
                            <div class="gate-cal-eyebrow">📅 DEDICATED GATE CALENDAR · ZERO EMPTY DATES</div>
                            <h3 class="gate-cal-title">GATE 2027 Study Calendar</h3>
                            <p class="gate-cal-subtitle">Exact 123-Day Schedule: 01 October 2026 through 31 January 2027</p>
                        </div>
                        <div class="gate-cal-month-nav">
                            <button type="button" class="gate-cal-nav-btn ${this.activeMonth === '2026-10' ? 'active' : ''}" onclick="GatePlannerEngine.setCalendarMonth('2026-10')">
                                Oct 2026
                            </button>
                            <button type="button" class="gate-cal-nav-btn ${this.activeMonth === '2026-11' ? 'active' : ''}" onclick="GatePlannerEngine.setCalendarMonth('2026-11')">
                                Nov 2026
                            </button>
                            <button type="button" class="gate-cal-nav-btn ${this.activeMonth === '2026-12' ? 'active' : ''}" onclick="GatePlannerEngine.setCalendarMonth('2026-12')">
                                Dec 2026
                            </button>
                            <button type="button" class="gate-cal-nav-btn ${this.activeMonth === '2027-01' ? 'active' : ''}" onclick="GatePlannerEngine.setCalendarMonth('2027-01')">
                                Jan 2027
                            </button>
                        </div>
                    </div>

                    <div class="gate-calendar-grid" id="gateCalendarGrid">
                        ${this.renderCalendarMonthHtml(this.activeMonth)}
                    </div>
                </div>

                <!-- D. SUBJECT LIST & TOPIC PRIORITIES (Section 3, 4, 5, 6) -->
                <div class="gate-subjects-section-wrap">
                    <div class="gate-subjects-header-bar">
                        <div>
                            <div class="gate-cal-eyebrow">📚 OFFICIAL SYLLABUS DIRECTORY · 11 CANONICAL SUBJECTS</div>
                            <h3 class="gate-cal-title">GATE CSE 2027 Subjects & Topics</h3>
                            <p class="gate-cal-subtitle">
                                Sorted by historical weightage (High → Low). Expand any subject to inspect topics, checklists, and completion status.
                            </p>
                        </div>
                        <div class="gate-disclaimer-pill" title="Planning evidence disclaimer">
                            ⚖️ Historical weightage is planning evidence only. Not guaranteed marks.
                        </div>
                    </div>

                    <div class="gate-subjects-list" id="gateSubjectsList">
                        ${subjects.map(s => this.renderSubjectCardHtml(s)).join('')}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('[GatePlannerEngine] renderPlannerPage error:', err);
            container.innerHTML = `
                <div class="gate-error-banner" style="padding: 24px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px;">
                    <h3 style="color: #ef4444; margin-top: 0;">GATE 2027 Planner Initialization Error</h3>
                    <p style="color: #cbd5e1;">${this.escapeHtml(err.message || 'Unknown error occurred while rendering GATE Planner.')}</p>
                    <button class="btn-primary" onclick="GatePlannerEngine.renderPlannerPage()">Retry Initialization</button>
                </div>
            `;
        }
    },

    // =========================================================================
    // 6. TODAY'S GATE PLAN CARD RENDERER (Section 12, 13, 17)
    // =========================================================================

    renderTodayCardHtml(todayItem) {
        if (!todayItem) {
            return `<div class="gate-empty-hint">No planned topic detected for today.</div>`;
        }

        const tasks = todayItem.tasks || [];
        const completedTasks = tasks.filter(t => t.completed || t.done).length;

        return `
            <div class="gate-today-card ${todayItem.status === 'COMPLETED' ? 'completed' : ''}">
                <div class="gate-today-header">
                    <div>
                        <div class="gate-today-date-str">
                            <span>📅 ${this.formatFullDate(todayItem.date)}</span>
                            <span class="gate-time-badge">10:30 PM – 12:00 AM (90m)</span>
                        </div>
                        <div class="gate-today-subj-row">
                            <span class="gt-subj-name">${this.escapeHtml(todayItem.subjectName || todayItem.subjectId)}</span>
                            <span class="gt-arrow">→</span>
                            <span class="gt-topic-name">${this.escapeHtml(todayItem.topicName)}</span>
                        </div>
                    </div>
                    <div class="gate-today-badges">
                        <span class="gate-importance-tag ${todayItem.importance ? todayItem.importance.toLowerCase().replace('-', '_') : 'high'}">
                            ${todayItem.importance || 'HIGH'} PRIORITY
                        </span>
                        <span class="gate-status-pill ${todayItem.status ? todayItem.status.toLowerCase() : 'not_started'}">
                            ${this.formatStatusLabel(todayItem.status)}
                        </span>
                    </div>
                </div>

                <div class="gate-today-objective">
                    <b>🎯 Objective:</b> ${this.escapeHtml(todayItem.objective || 'Master topic syllabus concepts, formulate notes, and solve topic PYQs from your handbook.')}
                </div>

                <div class="gate-today-checklist-wrap">
                    <div class="gate-checklist-header">
                        <span>WHAT TO DO (${completedTasks}/${tasks.length} done):</span>
                        <small>Check items as you study. PYQ solving is an action item.</small>
                    </div>
                    <div class="gate-checklist-tasks">
                        ${tasks.map((task, idx) => `
                            <label class="gate-check-item ${task.completed || task.done ? 'checked' : ''}">
                                <input type="checkbox"
                                    ${task.completed || task.done ? 'checked' : ''}
                                    onchange="GatePlannerEngine.toggleTaskFromUI('${todayItem.date}', ${idx})">
                                <span>${this.escapeHtml(task.text)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="gate-today-actions">
                    <button type="button" class="btn-primary" onclick="GatePlannerEngine.openTopicDetailModal('${todayItem.date}')">
                        <span>📖 View Full Topic Details & Notes →</span>
                    </button>
                    ${todayItem.status !== 'COMPLETED' ? `
                        <button type="button" class="action-btn-ghost" onclick="GatePlannerEngine.setTopicStatusFromUI('${todayItem.topicId}', 'COMPLETED')">
                            <span>✓ Mark Topic Complete</span>
                        </button>
                    ` : `
                        <button type="button" class="action-btn-ghost" onclick="GatePlannerEngine.setTopicStatusFromUI('${todayItem.topicId}', 'IN_PROGRESS')">
                            <span>Reopen Topic</span>
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    renderTodayCard() {
        const container = document.getElementById('gateTodayCardContainer');
        if (!container) return;
        const todayItem = this.getTodayPlanItem();
        container.innerHTML = this.renderTodayCardHtml(todayItem);
    },

    // =========================================================================
    // 7. CALENDAR MONTH GRID RENDERER (Section 7, 8, 9, 16)
    // =========================================================================

    renderCalendarMonthHtml(monthKey) {
        const allDays = this.getCalendarDays();
        const monthDays = allDays.filter(d => (d.date || d.plannedDate || '').startsWith(monthKey));

        if (!monthDays || monthDays.length === 0) {
            return `<div class="gate-empty-hint">No calendar items for ${monthKey}.</div>`;
        }

        return monthDays.map(day => {
            const shortDate = this.formatShortDate(day.date);
            const statusClass = (day.status || 'NOT_STARTED').toLowerCase();
            const impClass = (day.importance || 'MEDIUM').toLowerCase().replace('-', '_');

            return `
                <div class="gate-cal-card ${statusClass}" onclick="GatePlannerEngine.openTopicDetailModal('${day.date}')" title="Click to open topic checklist and notes">
                    <div class="gcc-top">
                        <span class="gcc-date">${shortDate}</span>
                        <span class="gate-importance-tag sm ${impClass}">${day.importance || 'MED'}</span>
                    </div>
                    <div class="gcc-subj">${this.escapeHtml(day.subjectName || day.subjectId)}</div>
                    <div class="gcc-topic">${this.escapeHtml(day.topicName)}</div>
                    <div class="gcc-obj">${this.escapeHtml(day.objective || 'Study + Notes + Topic PYQs')}</div>
                    <div class="gcc-bottom">
                        <span class="gcc-status-dot ${statusClass}"></span>
                        <span class="gcc-status-text">${this.formatStatusLabel(day.status)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    setCalendarMonth(monthKey) {
        this.activeMonth = monthKey;
        const grid = document.getElementById('gateCalendarGrid');
        if (grid) {
            grid.innerHTML = this.renderCalendarMonthHtml(monthKey);
        }
        document.querySelectorAll('.gate-cal-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase().includes(monthKey === '2026-10' ? 'oct' : (monthKey === '2026-11' ? 'nov' : (monthKey === '2026-12' ? 'dec' : 'jan'))));
        });
    },

    // =========================================================================
    // 8. SUBJECT CARD & ACCORDION RENDERER (Section 3, 5, 6)
    // =========================================================================

    renderSubjectCardHtml(subject) {
        const isExpanded = this.expandedSubjects.has(subject.id);
        const topics = this.getSubjectTopicsSorted(subject.id);

        return `
            <div class="gate-subject-card ${isExpanded ? 'expanded' : ''}" id="gateSubjCard_${subject.id}">
                <div class="gate-subject-card-header" onclick="GatePlannerEngine.toggleSubjectAccordion('${subject.id}')">
                    <div class="gsc-left">
                        <span class="gsc-icon">${subject.icon}</span>
                        <div>
                            <div class="gsc-title-row">
                                <h4 class="gsc-name">${this.escapeHtml(subject.name.toUpperCase())}</h4>
                                <span class="gate-importance-tag ${subject.importance ? subject.importance.toLowerCase().replace('-', '_') : 'high'}">
                                    ${subject.importance}
                                </span>
                            </div>
                            <div class="gsc-section-name">${this.escapeHtml(subject.officialSection)} · Planned: ${this.escapeHtml(subject.plannedDateRange)}</div>
                        </div>
                    </div>
                    <div class="gsc-right">
                        <div class="gsc-meta-group">
                            <div class="gsc-meta-item">
                                <small>Historical Weight</small>
                                <b>~${subject.historicalWeight}%</b>
                            </div>
                            <div class="gsc-meta-item">
                                <small>Topics</small>
                                <b>${subject.completedCount} / ${subject.topicsCount}</b>
                            </div>
                            <div class="gsc-meta-item">
                                <small>Progress</small>
                                <b class="${subject.progressPct === 100 ? 'success' : ''}">${subject.progressPct}%</b>
                            </div>
                        </div>
                        <button type="button" class="btn-accordion-toggle">
                            ${isExpanded ? '▲ HIDE TOPICS' : '▼ VIEW TOPICS'}
                        </button>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="gsc-prog-track">
                    <div class="gsc-prog-fill" style="width: ${subject.progressPct}%;"></div>
                </div>

                <!-- Expandable Topics Table (Section 5, 6) -->
                ${isExpanded ? `
                    <div class="gate-subject-topics-accordion">
                        <div class="gate-topics-table-header">
                            <span>Topic & Subtopics</span>
                            <span>Historical Frequency</span>
                            <span>Importance</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>
                        <div class="gate-topics-table-body">
                            ${topics.map(t => {
                                const impClass = (t.importance || 'MEDIUM').toLowerCase().replace('-', '_');
                                const statusClass = (t.status || 'NOT_STARTED').toLowerCase();

                                return `
                                    <div class="gate-topic-row">
                                        <div class="gtr-info">
                                            <div class="gtr-name">${this.escapeHtml(t.name)}</div>
                                            <div class="gtr-subtopics">
                                                ${(t.subtopics || []).slice(0, 3).map(st => `<span>• ${this.escapeHtml(st)}</span>`).join(' ')}
                                            </div>
                                        </div>
                                        <div class="gtr-freq">
                                            <div class="freq-track">
                                                <div class="freq-fill" style="width: ${t.historicalFrequency || 70}%;"></div>
                                            </div>
                                            <small>${t.historicalFrequency || 70}% recurrence</small>
                                        </div>
                                        <div class="gtr-imp">
                                            <span class="gate-importance-tag sm ${impClass}">${t.importance}</span>
                                        </div>
                                        <div class="gtr-status">
                                            <span class="gate-status-pill sm ${statusClass}">${this.formatStatusLabel(t.status)}</span>
                                        </div>
                                        <div class="gtr-action">
                                            <button type="button" class="btn-table-action" onclick="GatePlannerEngine.openTopicDetailModal(null, '${t.id}')">
                                                What to Do →
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    toggleSubjectAccordion(subjectId) {
        if (this.expandedSubjects.has(subjectId)) {
            this.expandedSubjects.delete(subjectId);
        } else {
            this.expandedSubjects.add(subjectId);
        }
        const card = document.getElementById(`gateSubjCard_${subjectId}`);
        if (card) {
            const subj = this.calculateSubjectPriorities().find(s => s.id === subjectId);
            if (subj) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.renderSubjectCardHtml(subj);
                card.replaceWith(tempDiv.firstElementChild);
            }
        }
    },

    // =========================================================================
    // 9. TOPIC DETAIL & WHAT TO DO MODAL (Section 8, 12, 13, 24)
    // =========================================================================

    openTopicDetailModal(dateStr, topicId) {
        const modal = document.getElementById('gateTopicDetailModal');
        if (!modal) return;

        let planItem = null;
        let baseTopic = null;

        if (dateStr) {
            planItem = (typeof Store !== 'undefined' && Store.getGatePlanItemByDate)
                ? Store.getGatePlanItemByDate(dateStr)
                : this.getCalendarDays().find(d => d.date === dateStr);
        }

        if (planItem) {
            baseTopic = this.getTopicById(planItem.topicId);
        } else if (topicId) {
            baseTopic = this.getTopicById(topicId);
            // Find first planned day for this topic
            planItem = this.getCalendarDays().find(d => d.topicId === topicId);
        }

        if (!baseTopic && planItem) {
            baseTopic = {
                id: planItem.topicId,
                name: planItem.topicName,
                subjectId: planItem.subjectId,
                subjectName: planItem.subjectName,
                importance: planItem.importance || 'HIGH',
                historicalFrequency: planItem.historicalFrequency || 80,
                defaultChecklist: []
            };
        }

        if (!baseTopic) return;

        const effectiveDate = planItem ? (planItem.plannedDate || planItem.date) : '2026-10-01';
        const tasks = (planItem && Array.isArray(planItem.tasks) && planItem.tasks.length > 0)
            ? planItem.tasks
            : (baseTopic.defaultChecklist || []).map((txt, idx) => ({ id: `task_${idx}`, text: txt, completed: false }));

        const gate = (typeof Store !== 'undefined' && Store.getGateState) ? Store.getGateState() : {};
        const topicStatus = (gate.topicStatuses && gate.topicStatuses[baseTopic.id]?.status) || (planItem ? planItem.status : 'NOT_STARTED');
        const userNotes = (gate.topicStatuses && gate.topicStatuses[baseTopic.id]?.notes) || (planItem ? planItem.userNotes : '');

        this.activeModalDate = planItem ? planItem.date : effectiveDate;
        this.activeModalTopicId = baseTopic.id;

        modal.innerHTML = `
            <div class="modal-window gate-detail-modal-window">
                <div class="modal-header">
                    <div>
                        <div class="gate-modal-eyebrow">
                            <span>${this.escapeHtml(baseTopic.subjectName || baseTopic.subjectId)}</span>
                            <span>• Planned Date: ${effectiveDate}</span>
                        </div>
                        <h3 class="gate-modal-title">${this.escapeHtml(baseTopic.name || baseTopic.topicName)}</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="GatePlannerEngine.closeTopicDetailModal()">×</button>
                </div>

                <div class="modal-body gate-modal-body">
                    <!-- Topic Attributes Strip -->
                    <div class="gate-modal-attr-strip">
                        <div class="gma-item">
                            <small>Importance</small>
                            <span class="gate-importance-tag sm ${baseTopic.importance ? baseTopic.importance.toLowerCase().replace('-', '_') : 'high'}">
                                ${baseTopic.importance || 'HIGH'}
                            </span>
                        </div>
                        <div class="gma-item">
                            <small>Recurrence</small>
                            <b>${baseTopic.historicalFrequency || 80}% in past papers</b>
                        </div>
                        <div class="gma-item">
                            <small>Topic Status</small>
                            <select class="form-select sm" id="gateModalStatusSelect" onchange="GatePlannerEngine.onModalStatusChanged(this.value)">
                                <option value="NOT_STARTED" ${topicStatus === 'NOT_STARTED' ? 'selected' : ''}>○ NOT STARTED</option>
                                <option value="IN_PROGRESS" ${topicStatus === 'IN_PROGRESS' ? 'selected' : ''}>◐ IN PROGRESS</option>
                                <option value="STUDY_COMPLETE" ${topicStatus === 'STUDY_COMPLETE' ? 'selected' : ''}>◑ STUDY COMPLETE</option>
                                <option value="PYQ_PENDING" ${topicStatus === 'PYQ_PENDING' ? 'selected' : ''}>⏳ PYQ PENDING</option>
                                <option value="COMPLETED" ${topicStatus === 'COMPLETED' ? 'selected' : ''}>● COMPLETED</option>
                                <option value="REVISION_REQUIRED" ${topicStatus === 'REVISION_REQUIRED' ? 'selected' : ''}>🔁 REVISION REQUIRED</option>
                            </select>
                        </div>
                        <div class="gma-item">
                            <small>Reschedule Date (Sec 24)</small>
                            <input type="date" class="form-input sm" id="gateModalRescheduleDate" value="${effectiveDate}" min="2026-10-01" max="2027-01-31">
                        </div>
                    </div>

                    <!-- Subtopics breakdown -->
                    ${Array.isArray(baseTopic.subtopics) && baseTopic.subtopics.length > 0 ? `
                        <div class="gate-modal-subtopics-box">
                            <div class="subtopics-title">Official Syllabus Breakdown:</div>
                            <ul class="subtopics-list">
                                ${baseTopic.subtopics.map(st => `<li>${this.escapeHtml(st)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <!-- WHAT TO DO Concrete Checklist (Section 12, 13) -->
                    <div class="gate-modal-checklist-box">
                        <div class="gm-checklist-heading">
                            <span>WHAT TO DO CHECKLIST</span>
                            <small>PYQs are solved from your handbook/resource as an action item.</small>
                        </div>
                        <div class="gm-tasks-list" id="gateModalTasksList">
                            ${tasks.map((task, idx) => `
                                <label class="gate-check-item ${task.completed || task.done ? 'checked' : ''}">
                                    <input type="checkbox"
                                        ${task.completed || task.done ? 'checked' : ''}
                                        onchange="GatePlannerEngine.toggleTaskFromUI('${effectiveDate}', ${idx})">
                                    <span>${this.escapeHtml(task.text)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Personal Study Notes (Section 24) -->
                    <div class="gate-modal-notes-box">
                        <label for="gateModalUserNotes" class="notes-lbl">Personal Study Notes & Formulas:</label>
                        <textarea id="gateModalUserNotes" class="form-textarea" rows="3" placeholder="Key insights, tricky formulas, or handbook problem references...">${this.escapeHtml(userNotes)}</textarea>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <button type="button" class="btn-ghost-sm" onclick="GatePlannerEngine.closeTopicDetailModal()">
                        Close
                    </button>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn-primary" onclick="GatePlannerEngine.saveModalChanges()">
                            Save Changes ✓
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        modal.classList.add('active');
    },

    closeTopicDetailModal() {
        const modal = document.getElementById('gateTopicDetailModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        this.activeModalDate = null;
        this.activeModalTopicId = null;
    },

    onModalStatusChanged(newStatus) {
        if (this.activeModalTopicId && typeof Store !== 'undefined' && Store.setGateTopicStatus) {
            Store.setGateTopicStatus(this.activeModalTopicId, newStatus);
            this.renderPlannerPage();
        }
    },

    saveModalChanges() {
        const notesEl = document.getElementById('gateModalUserNotes');
        const statusEl = document.getElementById('gateModalStatusSelect');
        const dateEl = document.getElementById('gateModalRescheduleDate');

        const newNotes = notesEl ? notesEl.value : '';
        const newStatus = statusEl ? statusEl.value : 'NOT_STARTED';
        const newPlannedDate = dateEl ? dateEl.value : null;

        if (this.activeModalTopicId && typeof Store !== 'undefined' && Store.setGateTopicStatus) {
            Store.setGateTopicStatus(this.activeModalTopicId, newStatus, newNotes);
        }

        if (this.activeModalDate && typeof Store !== 'undefined' && Store.updateGatePlanItem) {
            Store.updateGatePlanItem(this.activeModalDate, {
                status: newStatus,
                userNotes: newNotes,
                plannedDate: newPlannedDate || this.activeModalDate
            });
        }

        this.closeTopicDetailModal();
        this.renderPlannerPage();
    },

    // =========================================================================
    // 10. INTERACTIVE CHECKLIST & STATUS CONTROLS (Section 15, 24)
    // =========================================================================

    toggleTaskFromUI(dateStr, taskIndex) {
        if (typeof Store !== 'undefined' && Store.toggleGateTask) {
            Store.toggleGateTask(dateStr, taskIndex);
        }
        this.renderTodayCard();
        // Update calendar grid card if visible
        const grid = document.getElementById('gateCalendarGrid');
        if (grid) {
            grid.innerHTML = this.renderCalendarMonthHtml(this.activeMonth);
        }
        // Update scoreboard
        this.renderScoreboardInPlace();
    },

    setTopicStatusFromUI(topicId, newStatus) {
        if (typeof Store !== 'undefined' && Store.setGateTopicStatus) {
            Store.setGateTopicStatus(topicId, newStatus);
        }
        this.renderPlannerPage();
    },

    renderScoreboardInPlace() {
        // Re-renders whole page to guarantee synchrony
        this.renderPlannerPage();
    },

    validateAndReportCoverage() {
        const result = this.validateCoverage();
        if (result.isValid) {
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast('🛡️ GATE Plan Verified: 100% of topics and 123/123 calendar days covered!', 'success');
            } else {
                alert(`🛡️ GATE Plan Verified!\nTotal Topics: ${result.totalSyllabusTopics}\nPlanned Topics: ${result.plannedTopics}\nCalendar Days: ${result.filledCalendarDays}/123\nZero Missing Topics.`);
            }
        } else {
            alert(`⚠️ Validation Alert:\nMissing topics: ${result.unplannedTopics}\nEmpty dates: ${Math.max(0, 123 - result.filledCalendarDays)}`);
        }
    },

    refreshGate() {
        this.renderPlannerPage();
    },

    // =========================================================================
    // 11. HELPERS & FORMATTING
    // =========================================================================

    formatShortDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const day = parts[2];
        const monthNames = { '10': 'OCT', '11': 'NOV', '12': 'DEC', '01': 'JAN' };
        return `${day} ${monthNames[parts[1]] || parts[1]}`;
    },

    formatFullDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },

    formatStatusLabel(status) {
        switch (status) {
            case 'COMPLETED': return '● COMPLETED';
            case 'IN_PROGRESS': return '◐ IN PROGRESS';
            case 'STUDY_COMPLETE': return '◑ STUDY DONE';
            case 'PYQ_PENDING': return '⏳ PYQ PENDING';
            case 'REVISION_REQUIRED': return '🔁 REVISION';
            case 'NOT_STARTED':
            default: return '○ NOT STARTED';
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// Global exports
if (typeof window !== 'undefined') {
    window.GatePlannerEngine = GatePlannerEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GatePlannerEngine };
}
