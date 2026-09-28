/**
 * BOSS Study OS — Mistake Bank & Weakness Map Engine
 * Manages mistake logging, categorization, spaced repetition revisions,
 * and authentic multi-signal weakness mapping across DSA, Dev & Core CS.
 */

const MistakeBank = {
    activeFilter: {
        subject: 'all',
        topic: 'all',
        mistakeType: 'all',
        status: 'all'
    },
    activeTab: 'mistakes', // 'mistakes' | 'weakness'

    init() {
        // Any setup event listeners
    },

    // -------------------------------------------------------------------------
    // View Rendering: Top-level view for "Mistake Bank & Weakness Map"
    // -------------------------------------------------------------------------
    render() {
        const container = document.getElementById('view-mistakes');
        if (!container) return;

        const stats = Store.getMistakeStats();

        container.innerHTML = `
            <div class="mistake-header-banner">
                <div class="mistake-header-content">
                    <span class="mistake-badge-pill">🛡️ FORGE ERROR DEFENSE & WEAKNESS MAP</span>
                    <h2 style="margin: 4px 0 6px 0; font-size: 22px; color: #fff;">Mistake Bank & Knowledge Weakness Map</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 13.5px; max-width: 720px;">
                        Convert wrong test answers, logic blunders, and edge cases into permanent mastery. Every weakness tracked here is backed by authentic performance data.
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <button class="btn-primary" onclick="MistakeBank.openAddModal()" style="display: flex; align-items: center; gap: 6px;">
                        <span>＋</span>
                        <span>Log Mistake Manually</span>
                    </button>
                </div>
            </div>

            <!-- Top Metric Cards -->
            <div class="mistake-stats-grid">
                <div class="mistake-stat-card">
                    <div class="m-stat-label">Total Mistakes</div>
                    <div class="m-stat-val" style="color: #fff;">${stats.total}</div>
                    <div class="m-stat-sub">Lifetime errors captured</div>
                </div>
                <div class="mistake-stat-card">
                    <div class="m-stat-label">Unresolved</div>
                    <div class="m-stat-val" style="color: var(--rose);">${stats.unresolved}</div>
                    <div class="m-stat-sub">Requires conceptual fix</div>
                </div>
                <div class="mistake-stat-card">
                    <div class="m-stat-label">Repeated Mistakes</div>
                    <div class="m-stat-val" style="color: var(--amber);">${stats.repeated}</div>
                    <div class="m-stat-sub">Failed more than once</div>
                </div>
                <div class="mistake-stat-card">
                    <div class="m-stat-label">Due for Revision</div>
                    <div class="m-stat-val" style="color: var(--gold);">${stats.dueForRevision}</div>
                    <div class="m-stat-sub">Scheduled revisit date reached</div>
                </div>
                <div class="mistake-stat-card">
                    <div class="m-stat-label">Recently Added (7d)</div>
                    <div class="m-stat-val" style="color: var(--sky);">${stats.recent}</div>
                    <div class="m-stat-sub">Past 7 days</div>
                </div>
            </div>

            <!-- Tab Switcher -->
            <div class="mistake-tabs-bar">
                <button class="mistake-tab-btn ${this.activeTab === 'mistakes' ? 'active' : ''}" onclick="MistakeBank.switchTab('mistakes')">
                    ❌ My Mistakes Bank (${stats.unresolved} Unresolved)
                </button>
                <button class="mistake-tab-btn ${this.activeTab === 'weakness' ? 'active' : ''}" onclick="MistakeBank.switchTab('weakness')">
                    🗺️ Knowledge & Weakness Map
                </button>
            </div>

            <div id="mistakeTabBody" style="margin-top: 20px;">
                ${this.activeTab === 'mistakes' ? this.renderMistakesListHtml() : this.renderWeaknessMapHtml()}
            </div>
        `;

        this.attachFiltersListener();
    },

    switchTab(tabName) {
        this.activeTab = tabName;
        this.render();
    },

    // -------------------------------------------------------------------------
    // Mistakes Bank Tab HTML & Filter Logic
    // -------------------------------------------------------------------------
    renderMistakesListHtml() {
        const mistakes = Store.getMistakes(this.activeFilter);

        // Collect available topics from current mistakes
        const allMistakes = Store.getMistakes();
        const availableTopics = [...new Set(allMistakes.map(m => m.topic).filter(Boolean))];

        const mistakeTypes = [
            'Conceptual mistake', 'Logic mistake', 'Syntax mistake',
            'Calculation mistake', 'Misread question', 'Time pressure',
            'Edge case', 'Careless mistake', 'Unknown'
        ];

        let listHtml = '';
        if (mistakes.length === 0) {
            listHtml = `
                <div class="mistake-empty-state">
                    <span style="font-size: 36px;">🎉</span>
                    <h4 style="margin: 8px 0 4px 0; color: #fff;">No Mistakes Found</h4>
                    <p style="color: var(--text-muted); font-size: 13px; max-width: 480px; margin: 0 auto 16px auto;">
                        ${allMistakes.length === 0 
                            ? 'Your mistake bank is completely clear. Whenever you get a question wrong in Sunday tests or practice, click "Add to Mistake Bank".'
                            : 'No mistakes match your currently applied filters.'}
                    </p>
                    <button class="btn-primary" onclick="MistakeBank.openAddModal()">＋ Add New Mistake</button>
                </div>
            `;
        } else {
            listHtml = mistakes.map(m => {
                const isRepeated = (m.repeatCount || 1) > 1;
                const statusBadge = m.resolved 
                    ? `<span class="m-status-badge fixed">Fixed ✓</span>`
                    : `<span class="m-status-badge unresolved">Unresolved</span>`;
                
                const repeatBadge = isRepeated 
                    ? `<span class="m-repeat-badge">⚠️ Repeated ${m.repeatCount}×</span>` 
                    : '';

                return `
                    <div class="mistake-card ${m.resolved ? 'is-fixed' : ''}" id="mcard_${m.id}">
                        <div class="m-card-header">
                            <div class="m-card-meta">
                                <span class="m-subj-tag">${m.subject}</span>
                                <span class="m-topic-tag">${m.topic}</span>
                                <span class="m-type-tag">${m.mistakeType}</span>
                                ${statusBadge}
                                ${repeatBadge}
                            </div>
                            <div class="m-date-tag">Added: ${m.date || 'Today'}</div>
                        </div>

                        <div class="m-question-title">${m.question}</div>

                        <div class="m-answers-grid">
                            <div class="m-ans-box user">
                                <span class="lbl">Your Answer:</span>
                                <b>${m.userAnswer || 'Not provided'}</b>
                            </div>
                            <div class="m-ans-box correct">
                                <span class="lbl">Correct Answer:</span>
                                <b>${m.correctAnswer || 'Not provided'}</b>
                            </div>
                        </div>

                        ${m.personalNote ? `
                            <div class="m-note-box">
                                <b>Personal Note / Blunder:</b> ${m.personalNote}
                            </div>
                        ` : ''}

                        <div class="m-card-footer">
                            <div class="m-footer-left">
                                <span>Revisit: <b>${m.revisitDate || 'Not set'}</b></span>
                                <span>Source: <b>${m.source || 'General'}</b></span>
                            </div>
                            <div class="m-actions-row">
                                <button class="action-btn-ghost" style="padding: 4px 8px; font-size: 11.5px;" onclick="MistakeBank.openReviewModal('${m.id}')">
                                    🔍 Review
                                </button>
                                <button class="action-btn-ghost" style="padding: 4px 8px; font-size: 11.5px;" onclick="MistakeBank.toggleResolved('${m.id}')">
                                    ${m.resolved ? '↩ Reopen' : '✓ Mark Fixed'}
                                </button>
                                <button class="action-btn-ghost" style="padding: 4px 8px; font-size: 11.5px;" onclick="MistakeBank.revisitMistake('${m.id}')">
                                    🔁 Revisit (+1)
                                </button>
                                <button class="action-btn-ghost" style="padding: 4px 8px; font-size: 11.5px;" onclick="MistakeBank.openEditModal('${m.id}')">
                                    ✏️ Edit
                                </button>
                                <button class="action-btn-ghost danger" style="padding: 4px 8px; font-size: 11.5px;" onclick="MistakeBank.deleteMistake('${m.id}')">
                                    🗑
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        return `
            <!-- Filters Bar -->
            <div class="mistake-filters-bar">
                <div class="filter-group">
                    <label>Subject</label>
                    <select id="filterMistakeSubject" class="filter-select">
                        <option value="all" ${this.activeFilter.subject === 'all' ? 'selected' : ''}>All Subjects</option>
                        <option value="DSA" ${this.activeFilter.subject === 'DSA' ? 'selected' : ''}>DSA</option>
                        <option value="Development" ${this.activeFilter.subject === 'Development' ? 'selected' : ''}>Development</option>
                        <option value="Core CS" ${this.activeFilter.subject === 'Core CS' ? 'selected' : ''}>Core CS</option>
                        <option value="College" ${this.activeFilter.subject === 'College' ? 'selected' : ''}>College Exams</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Topic</label>
                    <select id="filterMistakeTopic" class="filter-select">
                        <option value="all" ${this.activeFilter.topic === 'all' ? 'selected' : ''}>All Topics</option>
                        ${availableTopics.map(t => `<option value="${t}" ${this.activeFilter.topic === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label>Mistake Type</label>
                    <select id="filterMistakeType" class="filter-select">
                        <option value="all" ${this.activeFilter.mistakeType === 'all' ? 'selected' : ''}>All Types</option>
                        ${mistakeTypes.map(t => `<option value="${t}" ${this.activeFilter.mistakeType === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label>Status</label>
                    <select id="filterMistakeStatus" class="filter-select">
                        <option value="all" ${this.activeFilter.status === 'all' ? 'selected' : ''}>All Statuses</option>
                        <option value="unresolved" ${this.activeFilter.status === 'unresolved' ? 'selected' : ''}>Unresolved Only</option>
                        <option value="resolved" ${this.activeFilter.status === 'resolved' ? 'selected' : ''}>Fixed Only</option>
                        <option value="repeated" ${this.activeFilter.status === 'repeated' ? 'selected' : ''}>Repeated (2+ times)</option>
                        <option value="dueRevision" ${this.activeFilter.status === 'dueRevision' ? 'selected' : ''}>Due for Revision</option>
                    </select>
                </div>

                <button class="action-btn-ghost" style="margin-left: auto; align-self: flex-end; padding: 6px 12px; font-size: 12px;" onclick="MistakeBank.resetFilters()">
                    Reset Filters
                </button>
            </div>

            <!-- Mistakes List Container -->
            <div class="mistakes-cards-container">
                ${listHtml}
            </div>
        `;
    },

    attachFiltersListener() {
        const sub = document.getElementById('filterMistakeSubject');
        const top = document.getElementById('filterMistakeTopic');
        const typ = document.getElementById('filterMistakeType');
        const st = document.getElementById('filterMistakeStatus');

        if (sub) sub.onchange = (e) => { this.activeFilter.subject = e.target.value; this.render(); };
        if (top) top.onchange = (e) => { this.activeFilter.topic = e.target.value; this.render(); };
        if (typ) typ.onchange = (e) => { this.activeFilter.mistakeType = e.target.value; this.render(); };
        if (st) st.onchange = (e) => { this.activeFilter.status = e.target.value; this.render(); };
    },

    resetFilters() {
        this.activeFilter = { subject: 'all', topic: 'all', mistakeType: 'all', status: 'all' };
        this.render();
    },

    // -------------------------------------------------------------------------
    // Weakness Map Tab HTML
    // -------------------------------------------------------------------------
    renderWeaknessMapHtml() {
        const weaknessMap = Store.calculateWeaknessMap();

        let sectionsHtml = Object.keys(weaknessMap).map(key => {
            const group = weaknessMap[key];
            const topics = group.topics || [];

            const cardsHtml = topics.map(t => {
                let badgeClass = 'insufficient';
                let tierIcon = '⚪';

                if (t.hasData) {
                    if (t.tier === 'Strong') { badgeClass = 'strong'; tierIcon = '🟢'; }
                    else if (t.tier === 'Good') { badgeClass = 'good'; tierIcon = '🔵'; }
                    else if (t.tier === 'Needs Work') { badgeClass = 'needs-work'; tierIcon = '🟡'; }
                    else if (t.tier === 'Weak') { badgeClass = 'weak'; tierIcon = '🔴'; }
                }

                return `
                    <div class="weakness-topic-card ${badgeClass}" onclick="MistakeBank.openWeaknessDetails('${group.id}', '${encodeURIComponent(t.topic)}')">
                        <div class="w-card-top">
                            <span class="w-topic-name">${t.topic}</span>
                            <span class="w-tier-badge ${badgeClass}">${tierIcon} ${t.statusText}</span>
                        </div>
                        <div class="w-card-metrics">
                            <span>Accuracy: <b>${t.accuracy !== null ? `${t.accuracy}%` : 'N/A'}</b></span>
                            <span>Mistakes: <b>${t.mistakes}</b></span>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="weakness-group-block">
                    <div class="weakness-group-header">
                        <span style="font-size: 20px;">${group.icon}</span>
                        <h3 style="margin: 0; font-size: 16px; color: #fff;">${group.name}</h3>
                    </div>
                    <div class="weakness-grid">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="weakness-map-wrapper">
                <div class="weakness-legend-row">
                    <div class="w-leg-item"><span class="w-dot strong"></span> <b>Strong (80%+)</b></div>
                    <div class="w-leg-item"><span class="w-dot good"></span> <b>Good (65-79%)</b></div>
                    <div class="w-leg-item"><span class="w-dot needs-work"></span> <b>Needs Work (45-64%)</b></div>
                    <div class="w-leg-item"><span class="w-dot weak"></span> <b>Weak (&lt;45% or repeated mistakes)</b></div>
                    <div class="w-leg-item"><span class="w-dot insufficient"></span> <b>Insufficient Data (No attempts)</b></div>
                </div>

                <div class="weakness-groups-container">
                    ${sectionsHtml}
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // Weakness Details Drawer / Modal
    // -------------------------------------------------------------------------
    openWeaknessDetails(subjectId, encodedTopic) {
        const topicName = decodeURIComponent(encodedTopic);
        const weaknessMap = Store.calculateWeaknessMap();
        const group = weaknessMap[subjectId];
        if (!group) return;

        const topicData = (group.topics || []).find(t => t.topic.toLowerCase() === topicName.toLowerCase());
        if (!topicData) return;

        let modal = document.getElementById('weaknessDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'weaknessDetailsModal';
            document.body.appendChild(modal);
        }

        const tierBadge = topicData.hasData
            ? `<span class="w-tier-badge ${topicData.tier.toLowerCase().replace(/\s+/g, '-')}">${topicData.tier}</span>`
            : `<span class="w-tier-badge insufficient">Insufficient Data</span>`;

        modal.innerHTML = `
            <div class="modal-window weakness-modal-window">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">${group.icon}</span>
                        <div>
                            <span style="font-size: 11.5px; color: var(--text-secondary); text-transform: uppercase;">${group.name}</span>
                            <h3 style="margin: 0; color: #fff;">${topicData.topic}</h3>
                        </div>
                    </div>
                    <button class="btn-close-modal" onclick="MistakeBank.closeWeaknessDetails()">×</button>
                </div>

                <div class="modal-body">
                    <div class="weakness-detail-hero">
                        <div class="w-hero-left">
                            <span class="w-label">Current Mastery Status:</span>
                            <div style="margin-top: 4px;">${tierBadge}</div>
                        </div>
                        <div class="w-hero-right">
                            <span class="w-hero-num">${topicData.accuracy !== null ? `${topicData.accuracy}%` : 'N/A'}</span>
                            <span class="w-hero-sub">Evaluated Accuracy</span>
                        </div>
                    </div>

                    <!-- Signals Breakdown Table -->
                    <div class="weakness-metrics-table">
                        <div class="w-metric-row">
                            <span>Total Attempts & Tests:</span>
                            <b>${topicData.attempts} questions</b>
                        </div>
                        <div class="w-metric-row">
                            <span>Mistakes in Mistake Bank:</span>
                            <b style="color: var(--rose);">${topicData.mistakes} (${topicData.unresolvedMistakes} unresolved, ${topicData.repeatedMistakes} repeated)</b>
                        </div>
                        <div class="w-metric-row">
                            <span>Average Study/Problem Time:</span>
                            <b>${topicData.avgTimeMins > 0 ? `${topicData.avgTimeMins} mins` : 'Not recorded'}</b>
                        </div>
                        <div class="w-metric-row">
                            <span>Last Studied:</span>
                            <b>${topicData.lastStudied || 'Never'}</b>
                        </div>
                        <div class="w-metric-row">
                            <span>Last Scheduled Revision:</span>
                            <b>${topicData.lastRevision || 'None scheduled'}</b>
                        </div>
                        <div class="w-metric-row">
                            <span>Questions Remaining:</span>
                            <b>${topicData.questionsRemaining}</b>
                        </div>
                    </div>

                    <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" style="flex: 1; padding: 10px 16px;" onclick="MistakeBank.practiceWeakArea('${subjectId}', '${encodeURIComponent(topicData.topic)}')">
                            🚀 Practice Weak Area
                        </button>
                        <button class="action-btn-ghost" style="padding: 10px 16px;" onclick="MistakeBank.startTopicStudySession('${subjectId}', '${encodeURIComponent(topicData.topic)}')">
                            ⏱ Start Study Session
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeWeaknessDetails() {
        const modal = document.getElementById('weaknessDetailsModal');
        if (modal) modal.classList.remove('active');
    },

    practiceWeakArea(subjectId, encodedTopic) {
        const topic = decodeURIComponent(encodedTopic);
        this.closeWeaknessDetails();

        if (subjectId === 'dsa') {
            if (window.App) window.App.switchView('dsa');
            // Try to filter or focus DSA topic
            showToast(`Opened Striver DSA Sheet for: ${topic}`, 'info');
        } else if (subjectId === 'dev') {
            if (window.App) window.App.switchView('development');
            showToast(`Opened Development Module for: ${topic}`, 'info');
        } else {
            if (window.App) window.App.switchView('placement');
            showToast(`Opened Placement Hub for: ${topic}`, 'info');
        }
    },

    startTopicStudySession(subjectId, encodedTopic) {
        const topic = decodeURIComponent(encodedTopic);
        this.closeWeaknessDetails();
        const catMap = { dsa: 'DSA', dev: 'DEV', corecs: 'COLLEGE', sysdesign: 'OTHER' };
        if (typeof StudySessionEngine !== 'undefined') {
            StudySessionEngine.startDirectSession(catMap[subjectId] || 'DSA', topic, `Practice & Master Weakness: ${topic}`);
        }
    },

    // -------------------------------------------------------------------------
    // Modals: Add Mistake & Review Mistake
    // -------------------------------------------------------------------------
    openAddModal(prefill = {}) {
        let modal = document.getElementById('addMistakeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'addMistakeModal';
            document.body.appendChild(modal);
        }

        const subjects = ['DSA', 'Development', 'Core CS', 'College', 'Other'];
        const types = [
            'Conceptual mistake', 'Logic mistake', 'Syntax mistake',
            'Calculation mistake', 'Misread question', 'Time pressure',
            'Edge case', 'Careless mistake', 'Unknown'
        ];

        modal.innerHTML = `
            <div class="modal-window" style="width: min(640px, 95vw); max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div>
                        <span style="font-size: 11.5px; color: var(--rose); font-weight: 700; text-transform: uppercase;">Mistake Bank Entry</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff;">Log Question Mistake</h3>
                    </div>
                    <button class="btn-close-modal" onclick="MistakeBank.closeAddModal()">×</button>
                </div>

                <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label class="form-label">Question / Problem Title *</label>
                        <input type="text" id="mAddQuestion" class="form-input" placeholder="e.g. Find First and Last Position in Sorted Array" value="${(prefill.question || '').replace(/"/g, '&quot;')}">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label class="form-label">Subject *</label>
                            <select id="mAddSubject" class="form-input">
                                ${subjects.map(s => `<option value="${s}" ${(prefill.subject || 'DSA') === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Topic / Subtopic *</label>
                            <input type="text" id="mAddTopic" class="form-input" placeholder="e.g. Binary Search, React Hooks, SQL Join" value="${(prefill.topic || '').replace(/"/g, '&quot;')}">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label class="form-label">Mistake Type</label>
                            <select id="mAddType" class="form-input">
                                ${types.map(t => `<option value="${t}" ${(prefill.mistakeType || 'Conceptual mistake') === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Source</label>
                            <input type="text" id="mAddSource" class="form-input" placeholder="Sunday Test, Striver DSA, LeetCode, Contest" value="${(prefill.source || 'FORGE Question').replace(/"/g, '&quot;')}">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label class="form-label">Your Submitted Answer</label>
                            <textarea id="mAddUserAnswer" class="form-input" rows="3" placeholder="What did you answer?">${prefill.userAnswer || ''}</textarea>
                        </div>
                        <div>
                            <label class="form-label">Correct / Reference Answer</label>
                            <textarea id="mAddCorrectAnswer" class="form-input" rows="3" placeholder="What is the correct answer or code?">${prefill.correctAnswer || ''}</textarea>
                        </div>
                    </div>

                    <div>
                        <label class="form-label">Explanation / Solution Intuition</label>
                        <textarea id="mAddExplanation" class="form-input" rows="3" placeholder="Why is this correct? What is the edge case?">${prefill.explanation || ''}</textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label class="form-label">Personal Note / Why I Made This Mistake</label>
                            <input type="text" id="mAddNote" class="form-input" placeholder="Forgot <= in while loop, didn't check empty array" value="${(prefill.personalNote || '').replace(/"/g, '&quot;')}">
                        </div>
                        <div>
                            <label class="form-label">Scheduled Revisit Date</label>
                            <input type="date" id="mAddRevisitDate" class="form-input" value="${prefill.revisitDate || DateUtils.todayIST()}">
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="action-btn-ghost" onclick="MistakeBank.closeAddModal()">Cancel</button>
                    <button class="btn-primary" onclick="MistakeBank.saveNewMistake()">Save to Mistake Bank ✓</button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeAddModal() {
        const modal = document.getElementById('addMistakeModal');
        if (modal) modal.classList.remove('active');
    },

    saveNewMistake() {
        const question = document.getElementById('mAddQuestion')?.value.trim();
        const subject = document.getElementById('mAddSubject')?.value;
        const topic = document.getElementById('mAddTopic')?.value.trim();
        const mistakeType = document.getElementById('mAddType')?.value;
        const source = document.getElementById('mAddSource')?.value.trim();
        const userAnswer = document.getElementById('mAddUserAnswer')?.value.trim();
        const correctAnswer = document.getElementById('mAddCorrectAnswer')?.value.trim();
        const explanation = document.getElementById('mAddExplanation')?.value.trim();
        const personalNote = document.getElementById('mAddNote')?.value.trim();
        const revisitDate = document.getElementById('mAddRevisitDate')?.value;

        if (!question) {
            alert('Please enter a question or problem title.');
            return;
        }

        const entry = Store.addMistake({
            question,
            subject,
            topic: topic || 'General',
            mistakeType,
            source: source || 'FORGE Question',
            userAnswer,
            correctAnswer,
            explanation,
            personalNote,
            revisitDate: revisitDate || DateUtils.todayIST()
        });

        this.closeAddModal();
        this.render();
        showToast(`Logged to Mistake Bank: ${entry.topic}`, 'success');
    },

    openReviewModal(id) {
        const item = Store.getMistakeById(id);
        if (!item) return;

        let modal = document.getElementById('reviewMistakeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'reviewMistakeModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="width: min(680px, 95vw); max-height: 92vh; overflow-y: auto;">
                <div class="modal-header">
                    <div>
                        <span style="font-size: 11.5px; color: var(--rose); font-weight: 700; text-transform: uppercase;">Mistake Review & Diagnosis</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff;">${item.topic} (${item.subject})</h3>
                    </div>
                    <button class="btn-close-modal" onclick="document.getElementById('reviewMistakeModal').classList.remove('active')">×</button>
                </div>

                <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 14px; border-radius: 8px;">
                        <span style="font-size: 11.5px; color: var(--text-muted); display: block; margin-bottom: 4px;">QUESTION</span>
                        <div style="font-size: 15px; font-weight: 600; color: #fff; line-height: 1.4;">${item.question}</div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.3); padding: 12px; border-radius: 8px;">
                            <span style="font-size: 11px; color: var(--rose); font-weight: 700; text-transform: uppercase;">YOUR ANSWER</span>
                            <div style="margin-top: 4px; color: #f8fafc; font-size: 13.5px; white-space: pre-wrap;">${item.userAnswer || 'Not provided'}</div>
                        </div>
                        <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); padding: 12px; border-radius: 8px;">
                            <span style="font-size: 11px; color: var(--emerald); font-weight: 700; text-transform: uppercase;">CORRECT ANSWER</span>
                            <div style="margin-top: 4px; color: #f8fafc; font-size: 13.5px; white-space: pre-wrap;">${item.correctAnswer || 'Not provided'}</div>
                        </div>
                    </div>

                    ${item.explanation ? `
                        <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.25); padding: 12px; border-radius: 8px;">
                            <span style="font-size: 11px; color: var(--sky); font-weight: 700; text-transform: uppercase;">EXPLANATION & CONCEPT</span>
                            <p style="margin: 4px 0 0 0; font-size: 13px; color: #e2e8f0; line-height: 1.5; white-space: pre-wrap;">${item.explanation}</p>
                        </div>
                    ` : ''}

                    <div style="background: rgba(245,197,24,0.08); border: 1px solid rgba(245,197,24,0.25); padding: 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span style="font-size: 11px; color: var(--gold); font-weight: 700; text-transform: uppercase;">MISTAKE TYPE & PERSONAL NOTE</span>
                            <span class="m-type-tag">${item.mistakeType}</span>
                        </div>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #f1f5f9;">${item.personalNote || 'No personal note entered yet.'}</p>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); padding: 0 4px;">
                        <span>Repeated: <b>${item.repeatCount || 1} time(s)</b></span>
                        <span>Revisit Date: <b>${item.revisitDate || 'Today'}</b></span>
                        <span>Status: <b style="color: ${item.resolved ? 'var(--emerald)' : 'var(--rose)'};">${item.resolved ? 'Fixed ✓' : 'Unresolved'}</b></span>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <button class="action-btn-ghost danger" onclick="MistakeBank.deleteMistake('${item.id}'); document.getElementById('reviewMistakeModal').classList.remove('active');">
                        Delete
                    </button>
                    <div style="display: flex; gap: 10px;">
                        <button class="action-btn-ghost" onclick="MistakeBank.toggleResolved('${item.id}'); document.getElementById('reviewMistakeModal').classList.remove('active');">
                            ${item.resolved ? '↩ Reopen' : '✓ Mark Fixed'}
                        </button>
                        <button class="btn-primary" onclick="document.getElementById('reviewMistakeModal').classList.remove('active'); MistakeBank.openEditModal('${item.id}')">
                            Edit Mistake Type & Notes →
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    openEditModal(id) {
        const item = Store.getMistakeById(id);
        if (!item) return;

        const types = [
            'Conceptual mistake', 'Logic mistake', 'Syntax mistake',
            'Calculation mistake', 'Misread question', 'Time pressure',
            'Edge case', 'Careless mistake', 'Unknown'
        ];

        let modal = document.getElementById('editMistakeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'editMistakeModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="width: min(540px, 95vw);">
                <div class="modal-header">
                    <div>
                        <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Edit Mistake Classification</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff;">${item.topic}</h3>
                    </div>
                    <button class="btn-close-modal" onclick="document.getElementById('editMistakeModal').classList.remove('active')">×</button>
                </div>

                <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label class="form-label">Mistake Type</label>
                        <select id="mEditType" class="form-input">
                            ${types.map(t => `<option value="${t}" ${item.mistakeType === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>

                    <div>
                        <label class="form-label">Personal Note</label>
                        <textarea id="mEditNote" class="form-input" rows="3">${item.personalNote || ''}</textarea>
                    </div>

                    <div>
                        <label class="form-label">Next Revisit Date</label>
                        <input type="date" id="mEditRevisitDate" class="form-input" value="${item.revisitDate || DateUtils.todayIST()}">
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="action-btn-ghost" onclick="document.getElementById('editMistakeModal').classList.remove('active')">Cancel</button>
                    <button class="btn-primary" onclick="MistakeBank.saveEditMistake('${item.id}')">Save Changes ✓</button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    saveEditMistake(id) {
        const mistakeType = document.getElementById('mEditType')?.value;
        const personalNote = document.getElementById('mEditNote')?.value.trim();
        const revisitDate = document.getElementById('mEditRevisitDate')?.value;

        Store.updateMistake(id, {
            mistakeType,
            personalNote,
            revisitDate
        });

        const modal = document.getElementById('editMistakeModal');
        if (modal) modal.classList.remove('active');

        this.render();
        showToast('Mistake details updated!', 'success');
    },

    toggleResolved(id) {
        const item = Store.getMistakeById(id);
        if (!item) return;
        const newStatus = !item.resolved;
        Store.markMistakeResolved(id, newStatus);
        this.render();
        showToast(newStatus ? 'Mistake marked as fixed! Great work.' : 'Mistake reopened.', 'info');
    },

    revisitMistake(id) {
        const item = Store.getMistakeById(id);
        if (!item) return;

        // Schedule 3 days out and increment count
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 3);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        Store.updateMistake(id, {
            repeatCount: (item.repeatCount || 1) + 1,
            revisitDate: nextDateStr,
            resolved: false
        });

        this.render();
        showToast(`Incremented repeat count to ${item.repeatCount + 1}. Revisit scheduled for ${nextDateStr}.`, 'warning');
    },

    deleteMistake(id) {
        if (!confirm('Are you sure you want to delete this mistake record?')) return;
        Store.deleteMistake(id);
        this.render();
        showToast('Mistake deleted.', 'info');
    }
};

if (typeof window !== 'undefined') {
    window.MistakeBank = MistakeBank;
}
