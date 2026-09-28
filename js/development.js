/**
 * BOSS Study OS — Full-Stack Development Engine (Development Command Center)
 * Manages 15 Technology Sheets (HTML, CSS, JS, Git, React, TS, Next.js, Node, REST, CRUD, Postgres, Auth, Redis, Docker, Deploy),
 * Immutable Source Video Playlists, Practical Tasks, Topic Roadmaps,
 * Visual Roadmaps (Zero Locks), Project Hub, Interview Questions, Revision, Analytics,
 * Global Search & Non-Destructive Calendar Scheduling.
 */

const DevelopmentEngine = {
    currentTechId: 'html',
    currentTab: 'playlist',
    activeFilterDifficulty: 'all',
    activeFilterTech: 'all',
    activeSearchQuery: '',
    editingNoteId: null,

    init() {
        this.setupKeyboardShortcuts();
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape closes modals
            if (e.key === 'Escape') {
                this.closeTechSheet();
                this.closeNotesModal();
                this.closeSearchModal();
            }
        });
    },

    // =========================================================================
    // MAIN DASHBOARD RENDERING
    // =========================================================================
    render() {
        const container = document.getElementById('view-development');
        if (!container) return;

        const stats = Store.getDevStats();

        // 1. Render Header & Overall Metrics
        this.renderHeaderMetrics(stats);

        // 2. Render "🎯 STUDY NOW" Guidance
        this.renderStudyNow();

        // 3. Render Visual Interactive Roadmap (Zero Locks)
        this.renderRoadmap(stats);

        // 4. Render 15 Technology Cards Grid
        this.renderTechCards(stats);

        // 5. Render Projects Hub
        this.renderProjects();

        // 6. Render Interview Questions Bank
        this.renderInterviewHub();

        // 7. Render Revision Hub
        this.renderRevisionHub();

        // 8. Render Analytics Section
        this.renderAnalytics(stats);
    },

    renderHeaderMetrics(stats) {
        const pctEl = document.getElementById('devOverallPct');
        const fillEl = document.getElementById('devOverallFill');
        const ratioEl = document.getElementById('devOverallRatio');
        const videoRatioEl = document.getElementById('devVideoRatio');
        const taskRatioEl = document.getElementById('devTaskRatio');
        const revisitBadgeEl = document.getElementById('devRevisitCount');

        if (pctEl) pctEl.textContent = `${stats.overallPercent}%`;
        if (fillEl) fillEl.style.width = `${stats.overallPercent}%`;
        if (ratioEl) ratioEl.textContent = `${stats.completedItems} of ${stats.totalItems} completed`;
        if (videoRatioEl) videoRatioEl.textContent = `${stats.solvedVideos}/${stats.totalVideos} (${stats.videoPercent}%)`;
        if (taskRatioEl) taskRatioEl.textContent = `${stats.solvedTasks}/${stats.totalTasks} (${stats.taskPercent}%)`;
        if (revisitBadgeEl) revisitBadgeEl.textContent = `${stats.revisitTotal} to Revise`;
    },

    /**
     * "🎯 STUDY NOW" Engine
     * Selects the highest-priority, non-locking study action based on current progress.
     */
    renderStudyNow() {
        const container = document.getElementById('devStudyNowContainer');
        if (!container) return;

        const devState = Store.getDevState();
        const revisitItems = Store.getDevRevisitItems();

        let targetAction = null;

        // 1. Priority: In-Progress Video
        if (typeof DEV_PLAYLISTS !== 'undefined') {
            for (const [techKey, vList] of Object.entries(DEV_PLAYLISTS)) {
                const inProg = vList.find(v => devState.videos[v.id]?.status === 'IN_PROGRESS');
                if (inProg) {
                    const tech = DEV_TECHNOLOGIES.find(t => t.sourcePlaylist === techKey) || { name: techKey, id: techKey };
                    targetAction = {
                        badge: '▶ CONTINUE STUDYING',
                        title: `${tech.name} — #${inProg.position}: ${inProg.title}`,
                        subtitle: `Currently in progress (${inProg.duration || 'Video'}). Watch and complete notes.`,
                        btnText: 'Resume Video ▶',
                        btnAction: `DevelopmentEngine.openTechSheet('${tech.id || techKey}', 'playlist', '${inProg.id}')`,
                        video: inProg,
                        techId: tech.id || techKey
                    };
                    break;
                }
            }
        }

        // 2. Priority: In-Progress Topic (HTML, CSS, etc.)
        if (!targetAction && typeof DEV_TECHNOLOGIES !== 'undefined') {
            for (const tech of DEV_TECHNOLOGIES) {
                if (tech.topics && tech.topics.length > 0) {
                    const inProgTopic = tech.topics.find(top => devState.topics?.[top.id]?.status === 'IN_PROGRESS');
                    if (inProgTopic) {
                        targetAction = {
                            badge: '▶ CONTINUE STUDYING',
                            title: `${tech.name} — ${inProgTopic.name}`,
                            subtitle: `Currently in progress (${inProgTopic.category}). Review concepts and complete practice.`,
                            btnText: 'Open Topic Roadmap →',
                            btnAction: `DevelopmentEngine.openTechSheet('${tech.id}', 'playlist')`,
                            video: null,
                            techId: tech.id
                        };
                        break;
                    }
                }
            }
        }

        // 3. Priority: Revisit item if pending
        if (!targetAction && revisitItems.topics && revisitItems.topics.length > 0) {
            const revTopic = revisitItems.topics[0];
            targetAction = {
                badge: '🔁 REVISION READY',
                title: `Revise: ${revTopic.techName} — ${revTopic.title}`,
                subtitle: `Flagged for revisit in ${revTopic.category || revTopic.techName}. Review core mechanics.`,
                btnText: 'Revisit Topic 🔄',
                btnAction: `DevelopmentEngine.openTechSheet('${revTopic.techId}', 'playlist')`,
                video: null,
                techId: revTopic.techId
            };
        } else if (!targetAction && revisitItems.videos.length > 0) {
            const revVideo = revisitItems.videos[0];
            targetAction = {
                badge: '🔁 REVISION READY',
                title: `Revise: ${revVideo.title}`,
                subtitle: `Flagged for revisit. Review core concepts and notes to consolidate retention.`,
                btnText: 'Revisit Video 🔄',
                btnAction: `DevelopmentEngine.openTechSheet('${revVideo.techId}', 'playlist', '${revVideo.id}')`,
                video: revVideo,
                techId: revVideo.techId
            };
        }

        // 4. Priority: Next sequential unsolved item in first incomplete technology
        if (!targetAction && typeof DEV_TECHNOLOGIES !== 'undefined') {
            for (const tech of DEV_TECHNOLOGIES) {
                // Check topics first
                if (tech.topics && tech.topics.length > 0) {
                    const nextUnsolvedTopic = tech.topics.find(top => devState.topics?.[top.id]?.status !== 'SOLVED');
                    if (nextUnsolvedTopic) {
                        targetAction = {
                            badge: '⭐ RECOMMENDED NEXT',
                            title: `${tech.name} — ${nextUnsolvedTopic.name}`,
                            subtitle: `Foundational topic in ${tech.name} (${nextUnsolvedTopic.category}): ${nextUnsolvedTopic.detail}`,
                            btnText: 'Start Learning →',
                            btnAction: `DevelopmentEngine.openTechSheet('${tech.id}', 'playlist')`,
                            video: null,
                            techId: tech.id
                        };
                        break;
                    }
                }

                // Check videos
                const pList = (typeof DEV_PLAYLISTS !== 'undefined' && DEV_PLAYLISTS[tech.sourcePlaylist]) || [];
                const nextUnsolvedVideo = pList.find(v => devState.videos[v.id]?.status !== 'SOLVED');
                if (nextUnsolvedVideo) {
                    targetAction = {
                        badge: '⭐ RECOMMENDED NEXT',
                        title: `${tech.name} — #${nextUnsolvedVideo.position}: ${nextUnsolvedVideo.title}`,
                        subtitle: `Next sequential lesson in the authentic ${tech.name} course (${nextUnsolvedVideo.duration || 'Session'}).`,
                        btnText: 'Start Lesson ▶',
                        btnAction: `DevelopmentEngine.openTechSheet('${tech.id}', 'playlist', '${nextUnsolvedVideo.id}')`,
                        video: nextUnsolvedVideo,
                        techId: tech.id
                    };
                    break;
                }
            }
        }

        // Fallback if everything is completed or empty
        if (!targetAction) {
            targetAction = {
                badge: '🏆 MASTERY ACHIEVED',
                title: 'All Foundations & Playlists Mastered!',
                subtitle: 'Continue building the Full-Stack Production SaaS Capstone Project.',
                btnText: 'Open Projects Hub 🚀',
                btnAction: "DevelopmentEngine.scrollToSection('devProjectsSection')",
                video: null,
                techId: 'html'
            };
        }

        let scheduleBtn = '';
        if (targetAction.video) {
            scheduleBtn = `
                <button class="action-btn-ghost" style="font-size: 12px; padding: 7px 12px;" onclick="DevelopmentEngine.scheduleVideoToCalendar('${targetAction.video.id}', '${targetAction.video.title.replace(/'/g, "\\'")}', '${targetAction.techId}')">
                    📅 Add to Today's Schedule
                </button>
            `;
        }

        container.innerHTML = `
            <div class="dev-study-now-card">
                <div class="dev-study-now-badge">${targetAction.badge}</div>
                <div class="dev-study-now-content">
                    <div class="dev-study-now-info">
                        <h3>${targetAction.title}</h3>
                        <p>${targetAction.subtitle}</p>
                    </div>
                    <div class="dev-study-now-actions">
                        <button class="btn-primary" onclick="${targetAction.btnAction}">${targetAction.btnText}</button>
                        ${scheduleBtn}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Visual Interactive Roadmap Flow (Zero Locks)
     */
    renderRoadmap(stats) {
        const container = document.getElementById('devRoadmapList');
        if (!container) return;

        let html = '';
        DEV_ROADMAP_STAGES.forEach((stage, idx) => {
            const isLast = idx === DEV_ROADMAP_STAGES.length - 1;

            // Calculate stage completion
            let stageTotal = 0;
            let stageDone = 0;

            stage.technologies.forEach(tId => {
                if (tId === 'projects') {
                    stageTotal += DEV_PROJECTS.length;
                    const devState = Store.getDevState();
                    DEV_PROJECTS.forEach(p => {
                        if (devState.projects?.[p.id]?.status === 'COMPLETED') stageDone++;
                    });
                } else {
                    const b = stats.techBreakdown[tId];
                    if (b) {
                        stageTotal += b.totalItems;
                        stageDone += b.completedItems;
                    }
                }
            });

            const stagePct = stageTotal > 0 ? Math.round((stageDone / stageTotal) * 100) : 0;
            const isCompleted = stageTotal > 0 && stageDone === stageTotal;

            html += `
                <div class="dev-roadmap-step">
                    <div class="dev-roadmap-node ${isCompleted ? 'is-complete' : ''}">
                        <div class="dev-roadmap-step-num">${stage.stage}</div>
                        <div class="dev-roadmap-step-body">
                            <div class="dev-roadmap-step-header">
                                <div class="dev-roadmap-title-row">
                                    <span style="font-size: 18px;">${stage.icon}</span>
                                    <h4>${stage.title}</h4>
                                    ${isCompleted ? '<span class="dev-status-pill solved">Complete ✓</span>' : `<span class="dev-status-pill">${stagePct}%</span>`}
                                </div>
                                <span class="dev-unlock-badge">🔓 Always Accessible</span>
                            </div>
                            <p class="dev-roadmap-sub">${stage.subtitle}</p>

                            <div class="dev-roadmap-techs">
                                ${stage.technologies.map(tId => {
                                    if (tId === 'projects') {
                                        return `
                                            <button class="dev-tech-pill-btn accent" onclick="DevelopmentEngine.scrollToSection('devProjectsSection')">
                                                <span>🚀</span>
                                                <span>8 Production Projects</span>
                                            </button>
                                        `;
                                    }
                                    const tech = DEV_TECHNOLOGIES.find(t => t.id === tId);
                                    if (!tech) return '';
                                    const b = stats.techBreakdown[tId] || { percent: 0 };
                                    return `
                                        <button class="dev-tech-pill-btn" onclick="DevelopmentEngine.openTechSheet('${tech.id}')">
                                            <span>${tech.icon}</span>
                                            <span>${tech.name}</span>
                                            <span class="pill-pct">${b.percent}%</span>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    ${!isLast ? '<div class="dev-roadmap-connector">↓</div>' : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * 15 Technology Cards Grid
     */
    renderTechCards(stats) {
        const container = document.getElementById('devTechCardsGrid');
        if (!container) return;

        let html = '';
        DEV_TECHNOLOGIES.forEach(tech => {
            const b = stats.techBreakdown[tech.id] || { totalTopics: 0, solvedTopics: 0, totalVideos: 0, solvedVideos: 0, totalTasks: 0, solvedTasks: 0, percent: 0 };

            let statPills = '';
            if (b.totalTopics > 0) {
                statPills = `
                    <span>📖 ${b.solvedTopics}/${b.totalTopics} Topics</span>
                    <span>🛠 ${b.solvedTasks}/${b.totalTasks} Tasks</span>
                `;
            } else if (b.totalVideos > 0) {
                statPills = `
                    <span>🎥 ${b.solvedVideos}/${b.totalVideos} Videos</span>
                    <span>🛠 ${b.solvedTasks}/${b.totalTasks} Tasks</span>
                `;
            } else {
                statPills = `
                    <span>🛠 ${b.solvedTasks}/${b.totalTasks} Tasks</span>
                `;
            }

            html += `
                <div class="dev-tech-card" onclick="DevelopmentEngine.openTechSheet('${tech.id}')">
                    <div class="dev-tech-card-header">
                        <div class="dev-tech-card-icon">${tech.icon}</div>
                        <div class="dev-tech-card-badge">${b.percent}% Done</div>
                    </div>
                    <h4 class="dev-tech-card-title">${tech.name}</h4>
                    <p class="dev-tech-card-tagline">${tech.tagline}</p>
                    <div class="dev-tech-card-stats">
                        ${statPills}
                    </div>
                    <div class="dev-tech-prog-bar">
                        <div class="dev-tech-prog-fill" style="width: ${b.percent}%;"></div>
                    </div>
                    <div class="dev-tech-card-footer">
                        <span class="open-sheet-link">Open Technology Sheet →</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * DEDICATED TECHNOLOGY SHEET MODAL / VIEW
     */
    openTechSheet(techId, tab = 'playlist', targetVideoId = null) {
        this.currentTechId = techId;
        this.currentTab = tab;

        const tech = DEV_TECHNOLOGIES.find(t => t.id === techId);
        if (!tech) return;

        const modal = document.getElementById('devTechSheetModal');
        if (!modal) return;

        // Populate Tech Header
        document.getElementById('techSheetIcon').textContent = tech.icon;
        document.getElementById('techSheetTitle').textContent = tech.name;
        document.getElementById('techSheetTagline').textContent = tech.tagline;

        // Render Active Tab
        this.switchTechTab(tab);

        modal.classList.add('active');

        // If target video specified, scroll to it smoothly
        if (targetVideoId) {
            setTimeout(() => {
                const el = document.getElementById(`dev-video-row-${targetVideoId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('highlight-row');
                    setTimeout(() => el.classList.remove('highlight-row'), 2000);
                }
            }, 150);
        }
    },

    closeTechSheet() {
        const modal = document.getElementById('devTechSheetModal');
        if (modal) modal.classList.remove('active');
        this.render(); // Re-render main dashboard metrics on close
    },

    switchTechTab(tabName) {
        this.currentTab = tabName;

        // Toggle buttons
        document.querySelectorAll('.dev-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        const tech = DEV_TECHNOLOGIES.find(t => t.id === this.currentTechId);
        if (!tech) return;

        const contentContainer = document.getElementById('techSheetContentBody');
        if (!contentContainer) return;

        if (tabName === 'overview') {
            this.renderTechOverview(tech, contentContainer);
        } else if (tabName === 'playlist') {
            this.renderTechPlaylist(tech, contentContainer);
        } else if (tabName === 'tasks') {
            this.renderTechTasks(tech, contentContainer);
        } else if (tabName === 'interview') {
            this.renderTechInterview(tech, contentContainer);
        } else if (tabName === 'notes') {
            this.renderTechNotes(tech, contentContainer);
        }
    },

    /**
     * 1. Overview Tab
     */
    renderTechOverview(tech, container) {
        let syllabusHtml = '';
        if (tech.topics && tech.topics.length > 0) {
            // Group topics by category
            const categories = {};
            tech.topics.forEach(t => {
                categories[t.category] = categories[t.category] || [];
                categories[t.category].push(t);
            });

            syllabusHtml = Object.entries(categories).map(([catName, tList]) => `
                <div style="margin-bottom: 20px;">
                    <h5 style="color: var(--gold); font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">${catName}</h5>
                    <div class="tech-concept-grid">
                        ${tList.map((c, i) => `
                            <div class="tech-concept-item">
                                <div class="concept-header">
                                    <span class="concept-num">${i + 1}</span>
                                    <strong>${c.name}</strong>
                                </div>
                                <p class="concept-detail">${c.detail}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } else if (tech.concepts && tech.concepts.length > 0) {
            syllabusHtml = `
                <div class="tech-concept-grid">
                    ${tech.concepts.map((c, i) => `
                        <div class="tech-concept-item">
                            <div class="concept-header">
                                <span class="concept-num">${i + 1}</span>
                                <strong>${c.name}</strong>
                            </div>
                            <p class="concept-detail">${c.detail}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let sourceBanner = '';
        if (tech.sourceUrl) {
            sourceBanner = `
                <div class="tech-playlist-source-banner" style="margin-top: 20px;">
                    <div>
                        <b style="color: var(--gold);">🎥 Immutable Video Course Source:</b>
                        <p style="color: var(--text-secondary); margin: 2px 0 0 0; font-size: 13px;">${tech.sourceName}</p>
                    </div>
                    <a href="${tech.sourceUrl}" target="_blank" rel="noopener" class="action-btn-ghost" style="font-size: 12px; padding: 6px 12px; text-decoration: none;">
                        Official YouTube Playlist ↗
                    </a>
                </div>
            `;
        } else {
            sourceBanner = `
                <div class="tech-playlist-source-banner" style="margin-top: 20px;">
                    <div>
                        <b style="color: var(--gold);">📚 Learning Resources:</b>
                        <p style="color: var(--text-secondary); margin: 2px 0 0 0; font-size: 13px;">${tech.sourceName || 'No custom playlist configured yet.'}</p>
                    </div>
                    <span class="dev-unlock-badge">Roadmap & Practice Tasks Active</span>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="tech-tab-section">
                <div class="tech-overview-box">
                    <h4>💡 Why It Matters in Modern Engineering</h4>
                    <p style="color: var(--text-primary); font-size: 14.5px; line-height: 1.6; margin-top: 6px;">
                        ${tech.whyItMatters}
                    </p>
                </div>

                <div class="tech-syllabus-box" style="margin-top: 20px;">
                    <h4>📋 Core Concepts & Learning Checkpoints</h4>
                    ${syllabusHtml}
                </div>

                ${sourceBanner}
            </div>
        `;
    },

    /**
     * 2. Video Playlist Tab (or Topic Roadmap Checklist for HTML/CSS)
     */
    renderTechPlaylist(tech, container) {
        const pList = (typeof DEV_PLAYLISTS !== 'undefined' && DEV_PLAYLISTS[tech.sourcePlaylist]) || [];
        const devState = Store.getDevState();

        // If no video playlist configured yet (e.g. HTML / CSS)
        if (pList.length === 0) {
            const topics = tech.topics || [];
            let solvedTopics = 0;
            topics.forEach(t => {
                if (devState.topics?.[t.id]?.status === 'SOLVED') solvedTopics++;
            });
            const topicPct = topics.length > 0 ? Math.round((solvedTopics / topics.length) * 100) : 0;

            // Group topics by category
            const categories = {};
            topics.forEach(t => {
                categories[t.category] = categories[t.category] || [];
                categories[t.category].push(t);
            });

            let topicsHtml = Object.entries(categories).map(([catName, tList]) => `
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 14px; font-weight: 800; color: var(--gold); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <span>📌</span>
                        <span>${catName}</span>
                    </div>
                    <div class="dev-table-wrapper">
                        <table class="problem-table dev-video-table">
                            <thead>
                                <tr>
                                    <th style="width: 8%;">#</th>
                                    <th style="width: 50%;">Topic Name & Concept</th>
                                    <th style="width: 24%;">Category</th>
                                    <th style="width: 18%; text-align: right;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tList.map((t, idx) => {
                                    const prog = Store.getDevTopicProgress(t.id);
                                    const status = prog.status || 'NOT_STARTED';
                                    const hasNotes = Boolean(prog.notes);

                                    return `
                                        <tr class="problem-row ${status === 'SOLVED' ? 'is-solved' : ''}" id="dev-topic-row-${t.id}">
                                            <td style="width: 8%; font-weight: 700; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">
                                                #${String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td style="width: 50%;">
                                                <div class="dev-video-title-cell">
                                                    <span class="prob-name" style="font-size: 13.5px; font-weight: 600;">${t.name}</span>
                                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${t.detail}</div>
                                                    ${hasNotes ? '<span class="dev-notes-indicator" title="Personal notes added">📝 Notes</span>' : ''}
                                                </div>
                                            </td>
                                            <td style="width: 24%; color: var(--text-secondary); font-size: 12px;">
                                                <span class="dev-tech-tag" style="margin: 0;">${t.category}</span>
                                            </td>
                                            <td style="width: 18%; text-align: right;">
                                                <div class="dev-action-group">
                                                    <select class="status-select ${status.toLowerCase()}" onchange="DevelopmentEngine.onTopicStatusChange('${t.id}', this.value)">
                                                        <option value="NOT_STARTED" ${status === 'NOT_STARTED' ? 'selected' : ''}>Not Yet</option>
                                                        <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                                                        <option value="SOLVED" ${status === 'SOLVED' ? 'selected' : ''}>Solved ✓</option>
                                                        <option value="REVISIT" ${status === 'REVISIT' ? 'selected' : ''}>Revisit 🔄</option>
                                                    </select>
                                                    <button class="action-btn-ghost icon-only" title="Edit topic notes" onclick="DevelopmentEngine.openNotesModal('topic', '${t.id}', '${t.name.replace(/'/g, "\\'")}', '${tech.id}')">
                                                        📝
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="tech-tab-section">
                    <div class="tech-no-playlist-card" style="background: rgba(245, 197, 24, 0.05); border: 1px solid rgba(245, 197, 24, 0.25); border-radius: var(--radius-md); padding: 18px 22px; margin-bottom: 20px;">
                        <div style="font-size: 15px; font-weight: 800; color: var(--gold); display: flex; align-items: center; gap: 8px;">
                            <span>📚</span>
                            <span>Learning Resources & Roadmap</span>
                        </div>
                        <p style="color: var(--text-primary); font-size: 13.5px; margin: 6px 0 4px 0; font-weight: 600;">
                            No custom playlist configured yet.
                        </p>
                        <p style="color: var(--text-secondary); font-size: 12.5px; margin: 0; line-height: 1.5;">
                            Follow the comprehensive topic roadmap below. Track every topic with <b>Not Yet</b>, <b>In Progress</b>, <b>Solved</b>, and <b>Revisit</b>. When a custom playlist is configured, it will appear here in its exact original sequence.
                        </p>
                    </div>

                    <div class="dev-playlist-toolbar" style="margin-bottom: 16px;">
                        <div class="dev-playlist-stats">
                            <span class="gold-text" style="font-weight: 700;">${solvedTopics} / ${topics.length} Topics Mastered</span>
                            <span style="color: var(--text-muted);">(${topicPct}%)</span>
                        </div>
                        <div class="dev-playlist-source-pill">
                            Track: <span>${tech.name} Structured Roadmap</span>
                        </div>
                    </div>

                    ${topicsHtml || '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No topics loaded.</div>'}
                </div>
            `;
            return;
        }

        let solvedCount = 0;
        pList.forEach(v => {
            if (devState.videos[v.id]?.status === 'SOLVED') solvedCount++;
        });
        const pct = Math.round((solvedCount / pList.length) * 100);

        let tableRows = pList.map(v => {
            const prog = Store.getDevVideoProgress(v.id);
            const status = prog.status || 'NOT_STARTED';
            const hasNotes = Boolean(prog.notes);

            return `
                <tr class="problem-row ${status === 'SOLVED' ? 'is-solved' : ''}" id="dev-video-row-${v.id}">
                    <td style="width: 8%; font-weight: 700; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">
                        #${String(v.position).padStart(2, '0')}
                    </td>
                    <td style="width: 50%;">
                        <div class="dev-video-title-cell">
                            <span class="prob-name" style="font-size: 13.5px; font-weight: 600;">${v.title}</span>
                            ${hasNotes ? '<span class="dev-notes-indicator" title="Personal notes added">📝 Notes</span>' : ''}
                        </div>
                    </td>
                    <td style="width: 14%; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 12px;">
                        ⏱ ${v.duration || 'Video'}
                    </td>
                    <td style="width: 13%;">
                        <div class="prob-links">
                            <a href="${v.url}" target="_blank" rel="noopener" class="prob-link-btn" title="Open original video on YouTube">
                                ▶ Watch ↗
                            </a>
                        </div>
                    </td>
                    <td style="width: 15%; text-align: right;">
                        <div class="dev-action-group">
                            <select class="status-select ${status.toLowerCase()}" onchange="DevelopmentEngine.onVideoStatusChange('${v.id}', this.value)">
                                <option value="NOT_STARTED" ${status === 'NOT_STARTED' ? 'selected' : ''}>Not Yet</option>
                                <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                                <option value="SOLVED" ${status === 'SOLVED' ? 'selected' : ''}>Solved ✓</option>
                                <option value="REVISIT" ${status === 'REVISIT' ? 'selected' : ''}>Revisit 🔄</option>
                            </select>
                            <button class="action-btn-ghost icon-only" title="Edit video notes" onclick="DevelopmentEngine.openNotesModal('video', '${v.id}', '${v.title.replace(/'/g, "\\'")}', '${tech.id}')">
                                📝
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="tech-tab-section">
                <div class="dev-playlist-toolbar">
                    <div class="dev-playlist-stats">
                        <span class="gold-text" style="font-weight: 700;">${solvedCount} / ${pList.length} Videos Completed</span>
                        <span style="color: var(--text-muted);">(${pct}%)</span>
                    </div>
                    <div class="dev-playlist-source-pill">
                        Source: <span>${tech.sourceName}</span>
                    </div>
                </div>

                <div class="dev-table-wrapper" style="margin-top: 14px;">
                    <table class="problem-table dev-video-table">
                        <thead>
                            <tr>
                                <th style="width: 8%;">#</th>
                                <th style="width: 50%;">Video Title (Exact Course Sequence)</th>
                                <th style="width: 14%;">Duration</th>
                                <th style="width: 13%;">Watch</th>
                                <th style="width: 15%; text-align: right;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * 3. Practical Tasks Tab
     */
    renderTechTasks(tech, container) {
        const tasks = tech.practicalTasks || [];
        if (tasks.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">No practical tasks defined for this section.</div>`;
            return;
        }

        let html = '';
        tasks.forEach(t => {
            const prog = Store.getDevTaskProgress(t.id);
            const status = prog.status || 'NOT_STARTED';
            const diffClass = (t.difficulty || 'Medium').toLowerCase();

            html += `
                <div class="dev-task-card ${status === 'SOLVED' ? 'is-completed' : ''}">
                    <div class="dev-task-header">
                        <div class="dev-task-title-group">
                            <span class="difficulty-tag ${diffClass}">${t.difficulty}</span>
                            <span class="dev-task-title">${t.title}</span>
                        </div>
                        <select class="status-select ${status.toLowerCase()}" onchange="DevelopmentEngine.onTaskStatusChange('${t.id}', this.value)">
                            <option value="NOT_STARTED" ${status === 'NOT_STARTED' ? 'selected' : ''}>Not Yet</option>
                            <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                            <option value="SOLVED" ${status === 'SOLVED' ? 'selected' : ''}>Solved ✓</option>
                            <option value="REVISIT" ${status === 'REVISIT' ? 'selected' : ''}>Revisit 🔄</option>
                        </select>
                    </div>
                    <p class="dev-task-desc">${t.desc}</p>
                    <div class="dev-task-footer">
                        <button class="action-btn-ghost" style="font-size: 11px; padding: 4px 8px;" onclick="DevelopmentEngine.scheduleTaskToCalendar('${t.id}', '${t.title.replace(/'/g, "\\'")}', '${tech.id}')">
                            📅 Schedule Task into Calendar
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="tech-tab-section">
                <div class="dev-task-intro">
                    <h4>🛠 Hands-On Engineering Tasks & Practice</h4>
                    <p style="color: var(--text-secondary); margin-top: 4px;">True engineering competence comes from writing real software. Complete each task, test it locally, and mark it Solved.</p>
                </div>
                <div class="dev-tasks-list" style="margin-top: 16px;">
                    ${html}
                </div>
            </div>
        `;
    },

    /**
     * 4. Interview Relevance Tab
     */
    renderTechInterview(tech, container) {
        const rel = tech.interviewRelevance || {};
        const questions = (typeof DEV_INTERVIEW_QUESTIONS !== 'undefined' ? DEV_INTERVIEW_QUESTIONS : []).filter(q => q.techId === tech.id);

        let qHtml = questions.map(q => {
            const prog = Store.getDevQuestionProgress(q.id);
            const status = prog.status || 'DONT_KNOW';
            const diffClass = (q.difficulty || 'Medium').toLowerCase();

            return `
                <div class="dev-interview-item" id="iq-item-${q.id}">
                    <div class="dev-iq-header">
                        <div style="display:flex; align-items:center; gap: 8px;">
                            <span class="difficulty-tag ${diffClass}">${q.difficulty}</span>
                            <span class="dev-iq-title">${q.question}</span>
                        </div>
                        <select class="status-select ${status.toLowerCase()}" onchange="DevelopmentEngine.onQuestionStatusChange('${q.id}', this.value)">
                            <option value="KNOW" ${status === 'KNOW' ? 'selected' : ''}>Know ✓</option>
                            <option value="PARTIAL" ${status === 'PARTIAL' ? 'selected' : ''}>Partially Know ⚠️</option>
                            <option value="DONT_KNOW" ${status === 'DONT_KNOW' ? 'selected' : ''}>Don't Know ❌</option>
                            <option value="REVISION" ${status === 'REVISION' ? 'selected' : ''}>Need Revision 🔄</option>
                        </select>
                    </div>
                    <div class="dev-iq-body">
                        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <button class="btn-toggle-answer" onclick="document.getElementById('iq-answer-${q.id}').classList.toggle('open')">
                                💡 Show Technical Answer & Defense
                            </button>
                            <button class="action-btn-ghost" style="padding: 4px 8px; font-size: 11px; color: var(--rose); border-color: rgba(244,63,94,0.3);" onclick="MistakeBank.openAddModal({ question: '${(q.question || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}', subject: 'Development', topic: '${(tech.name || 'Full-Stack').replace(/'/g, "\\'")}', source: 'Dev Interview Prep', correctAnswer: '${(q.answer || '').slice(0, 300).replace(/'/g, "\\'").replace(/"/g, '&quot;')}' })">
                                ⚠️ Add to Mistake Bank
                            </button>
                        </div>
                        <div class="dev-iq-answer" id="iq-answer-${q.id}">
                            <div class="answer-content">${q.answer}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="tech-tab-section">
                <div class="tech-interview-meta-card">
                    <div class="meta-row">
                        <span>Interview Weight:</span>
                        <b style="color: var(--gold);">${rel.weight || 'High'}</b>
                    </div>
                    <div class="meta-row">
                        <span>Key Focus Areas:</span>
                        <span style="color: var(--text-primary);">${rel.keyFocus || 'Core Fundamentals & Architecture'}</span>
                    </div>
                </div>

                <div class="dev-interview-list" style="margin-top: 20px;">
                    <h4 style="margin-bottom: 12px;">🎯 High-Yield Interview Questions</h4>
                    ${qHtml || '<p style="color:var(--text-muted);">No questions added yet.</p>'}
                </div>
            </div>
        `;
    },

    /**
     * 5. Personal Notes Tab
     */
    renderTechNotes(tech, container) {
        const notes = Store.getDevNotes(tech.id);

        let notesHtml = notes.map(n => `
            <div class="dev-note-item ${n.pinned ? 'is-pinned' : ''}">
                <div class="dev-note-header">
                    <div>
                        <span class="dev-note-title">${n.title}</span>
                        <span class="dev-note-time">${n.updatedAt ? n.updatedAt.slice(0, 10) : ''}</span>
                    </div>
                    <div style="display:flex; gap: 8px;">
                        <button class="action-btn-ghost icon-only" title="Delete note" onclick="DevelopmentEngine.deleteNote('${n.id}')">🗑</button>
                    </div>
                </div>
                <div class="dev-note-body">${n.content.replace(/\n/g, '<br>')}</div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="tech-tab-section">
                <div class="dev-notes-composer">
                    <h4>📝 Add Engineering Note for ${tech.name}</h4>
                    <input type="text" id="devNoteTitleInput" class="form-input" placeholder="Note Title (e.g. Prototype Chain Gotchas, Box Model Differences)" style="margin-top: 8px;">
                    <textarea id="devNoteContentInput" class="form-input" rows="4" placeholder="Write key insights, code snippets, gotchas, or interview notes..." style="margin-top: 8px;"></textarea>
                    <div style="display:flex; justify-content:flex-end; margin-top: 10px;">
                        <button class="btn-primary" onclick="DevelopmentEngine.saveNewNote('${tech.id}')">Save Note ✓</button>
                    </div>
                </div>

                <div class="dev-notes-list" style="margin-top: 24px;">
                    <h4 style="margin-bottom: 12px;">Saved Notes (${notes.length})</h4>
                    ${notesHtml || '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No notes saved yet. Add your first note above!</div>'}
                </div>
            </div>
        `;
    },

    // =========================================================================
    // STATUS TRANSITIONS & PERSISTENCE
    // =========================================================================
    onTopicStatusChange(topicId, newStatus) {
        const solvedAt = newStatus === 'SOLVED' ? DateUtils.nowISO() : null;
        const revisitAt = newStatus === 'REVISIT' ? DateUtils.nowISO() : null;

        Store.setDevTopicProgress(topicId, {
            status: newStatus,
            solvedAt,
            revisitAt
        });

        const tech = DEV_TECHNOLOGIES.find(t => t.id === this.currentTechId);
        if (tech) {
            this.renderTechPlaylist(tech, document.getElementById('techSheetContentBody'));
        }
        this.renderHeaderMetrics(Store.getDevStats());
        this.renderStudyNow();
        showToast('Topic status updated and saved!', 'success');
    },

    onVideoStatusChange(videoId, newStatus) {
        const solvedAt = newStatus === 'SOLVED' ? DateUtils.nowISO() : null;
        const revisitAt = newStatus === 'REVISIT' ? DateUtils.nowISO() : null;

        Store.setDevVideoProgress(videoId, {
            status: newStatus,
            solvedAt,
            revisitAt
        });

        const tech = DEV_TECHNOLOGIES.find(t => t.id === this.currentTechId);
        if (tech) {
            this.renderTechPlaylist(tech, document.getElementById('techSheetContentBody'));
        }
        this.renderHeaderMetrics(Store.getDevStats());
        this.renderStudyNow();
        showToast('Video status updated and saved!', 'success');
    },

    onTaskStatusChange(taskId, newStatus) {
        const solvedAt = newStatus === 'SOLVED' ? DateUtils.nowISO() : null;
        Store.setDevTaskProgress(taskId, {
            status: newStatus,
            solvedAt
        });

        const tech = DEV_TECHNOLOGIES.find(t => t.id === this.currentTechId);
        if (tech) {
            this.renderTechTasks(tech, document.getElementById('techSheetContentBody'));
        }
        this.renderHeaderMetrics(Store.getDevStats());
        this.renderStudyNow();
        showToast('Practical task progress updated!', 'success');
    },

    onQuestionStatusChange(qId, newStatus) {
        Store.setDevQuestionProgress(qId, {
            status: newStatus
        });
        showToast('Interview question review saved!', 'success');
    },

    saveNewNote(techId) {
        const titleEl = document.getElementById('devNoteTitleInput');
        const contentEl = document.getElementById('devNoteContentInput');
        if (!titleEl || !contentEl) return;

        const title = titleEl.value.trim();
        const content = contentEl.value.trim();
        if (!title || !content) {
            showToast('Please provide both note title and content.', 'warning');
            return;
        }

        Store.saveDevNote({
            techId,
            title,
            content,
            pinned: false
        });

        titleEl.value = '';
        contentEl.value = '';

        const tech = DEV_TECHNOLOGIES.find(t => t.id === techId);
        if (tech) {
            this.renderTechNotes(tech, document.getElementById('techSheetContentBody'));
        }
        showToast('Engineering note saved!', 'success');
    },

    deleteNote(noteId) {
        Store.deleteDevNote(noteId);
        const tech = DEV_TECHNOLOGIES.find(t => t.id === this.currentTechId);
        if (tech) {
            this.renderTechNotes(tech, document.getElementById('techSheetContentBody'));
        }
        showToast('Note deleted.', 'info');
    },

    // =========================================================================
    // NOTES MODAL (FOR VIDEOS & TOPICS)
    // =========================================================================
    openNotesModal(itemType, itemId, itemTitle, techId) {
        const modal = document.getElementById('devVideoNotesModal');
        const titleEl = document.getElementById('devVideoNotesModalTitle');
        const textarea = document.getElementById('devVideoNotesTextarea');
        const saveBtn = document.getElementById('btnSaveVideoNotes');

        if (!modal) return;

        titleEl.textContent = `Notes: ${itemTitle}`;
        let currentNotes = '';
        if (itemType === 'topic') {
            const prog = Store.getDevTopicProgress(itemId);
            currentNotes = prog.notes || '';
        } else {
            const prog = Store.getDevVideoProgress(itemId);
            currentNotes = prog.notes || '';
        }
        textarea.value = currentNotes;

        saveBtn.onclick = () => {
            const noteText = textarea.value.trim();
            if (itemType === 'topic') {
                Store.setDevTopicProgress(itemId, { notes: noteText });
            } else {
                Store.setDevVideoProgress(itemId, { notes: noteText });
            }
            modal.classList.remove('active');
            const tech = DEV_TECHNOLOGIES.find(t => t.id === (techId || this.currentTechId));
            if (tech && this.currentTab === 'playlist') {
                this.renderTechPlaylist(tech, document.getElementById('techSheetContentBody'));
            }
            showToast('Personal notes saved!', 'success');
        };

        modal.classList.add('active');
    },

    closeNotesModal() {
        const modal = document.getElementById('devVideoNotesModal');
        if (modal) modal.classList.remove('active');
    },

    // =========================================================================
    // CALENDAR INTEGRATION (NON-DESTRUCTIVE)
    // =========================================================================
    scheduleVideoToCalendar(videoId, videoTitle, techId) {
        const todayStr = DateUtils.todayIST();
        const dayData = Store.getDayData(todayStr);

        const newDevTask = {
            id: `task_dev_${Date.now()}`,
            dateKey: todayStr,
            title: `💻 Dev: ${videoTitle}`,
            category: APP_CONFIG.CATEGORIES.DEV || 'DEV',
            startTime: '19:30',
            endTime: '20:30',
            status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
            isStudy: true,
            isBlock: false,
            devVideoId: videoId,
            devTechId: techId,
            notes: `Scheduled Full-Stack Development study task.`,
            history: [
                { timestamp: DateUtils.nowISO(), action: 'SCHEDULED', detail: 'Scheduled from Development Module' }
            ]
        };

        dayData.tasks = dayData.tasks || [];
        dayData.tasks.push(newDevTask);
        Store.setDayData(todayStr, dayData);

        showToast(`Scheduled "${videoTitle.slice(0, 30)}..." into Today's Calendar!`, 'success');
    },

    scheduleTaskToCalendar(taskId, taskTitle, techId) {
        const todayStr = DateUtils.todayIST();
        const dayData = Store.getDayData(todayStr);

        const newDevTask = {
            id: `task_dev_p_${Date.now()}`,
            dateKey: todayStr,
            title: `🛠 Dev Practice: ${taskTitle}`,
            category: APP_CONFIG.CATEGORIES.DEV || 'DEV',
            startTime: '20:30',
            endTime: '21:30',
            status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
            isStudy: true,
            isBlock: false,
            devTaskId: taskId,
            devTechId: techId,
            notes: `Scheduled practical coding exercise.`,
            history: [
                { timestamp: DateUtils.nowISO(), action: 'SCHEDULED', detail: 'Scheduled from Development Module' }
            ]
        };

        dayData.tasks = dayData.tasks || [];
        dayData.tasks.push(newDevTask);
        Store.setDayData(todayStr, dayData);

        showToast(`Scheduled "${taskTitle.slice(0, 30)}..." into Today's Calendar!`, 'success');
    },

    // =========================================================================
    // FULL-STACK PROJECTS HUB
    // =========================================================================
    renderProjects() {
        const container = document.getElementById('devProjectsList');
        if (!container) return;

        let html = '';
        DEV_PROJECTS.forEach((proj, idx) => {
            const devProj = Store.getDevProject(proj.id);
            const status = devProj.status || 'NOT_STARTED';

            const badge = proj.tagline || proj.badge || '';
            const problem = proj.summary || proj.problem || '';
            const deliverables = proj.features || proj.deliverables || [];
            const stack = proj.stack || proj.techStack || [];
            let defenseText = '';
            if (typeof proj.interviewDefense === 'string') {
                defenseText = proj.interviewDefense;
            } else if (Array.isArray(proj.defense)) {
                defenseText = proj.defense.map(d => `• <b>${d.topic}:</b> ${d.point}`).join('<br>');
            } else if (typeof proj.defense === 'string') {
                defenseText = proj.defense;
            }

            html += `
                <div class="dev-project-card ${status === 'COMPLETED' ? 'is-completed' : ''}" id="proj-card-${proj.id}">
                    <div class="dev-project-header">
                        <div>
                            <div class="dev-project-tier-badge">${proj.tier} • ${badge}</div>
                            <h4 class="dev-project-title">#${idx + 1}. ${proj.title}</h4>
                        </div>
                        <select class="status-select ${status.toLowerCase()}" onchange="DevelopmentEngine.onProjectStatusChange('${proj.id}', this.value)">
                            <option value="NOT_STARTED" ${status === 'NOT_STARTED' ? 'selected' : ''}>Not Started</option>
                            <option value="IN_PROGRESS" ${status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress 🔨</option>
                            <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>Completed ✓</option>
                        </select>
                    </div>

                    <p class="dev-project-problem"><b>Summary:</b> ${problem}</p>

                    <div class="dev-project-features">
                        <b>Core Deliverables:</b>
                        <ul>
                            ${deliverables.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="dev-project-tech-tags">
                        ${stack.map(ts => `<span class="dev-tech-tag">${ts}</span>`).join('')}
                    </div>

                    <div class="dev-project-interview-box">
                        <b>🎤 Technical Interview Defense:</b>
                        <p style="color: var(--text-primary); font-size: 13px; line-height: 1.5; margin: 6px 0 0 0;">
                            ${defenseText}
                        </p>
                    </div>

                    <div class="dev-project-links-row">
                        <input type="url" class="form-input" placeholder="GitHub Repository URL..." value="${devProj.repoLink || ''}" onchange="DevelopmentEngine.updateProjectLink('${proj.id}', 'repoLink', this.value)" style="font-size: 12px; height: 32px;">
                        <input type="url" class="form-input" placeholder="Live Deployed URL..." value="${devProj.liveLink || ''}" onchange="DevelopmentEngine.updateProjectLink('${proj.id}', 'liveLink', this.value)" style="font-size: 12px; height: 32px;">
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    onProjectStatusChange(projId, newStatus) {
        Store.setDevProject(projId, {
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? DateUtils.nowISO() : null
        });
        this.renderRoadmap(Store.getDevStats());
        showToast('Project status updated!', 'success');
    },

    updateProjectLink(projId, field, value) {
        const updates = {};
        updates[field] = value.trim();
        Store.setDevProject(projId, updates);
        showToast('Project link saved!', 'success');
    },

    // =========================================================================
    // INTERVIEW QUESTIONS BANK HUB
    // =========================================================================
    renderInterviewHub() {
        const container = document.getElementById('devInterviewList');
        if (!container) return;

        let list = DEV_INTERVIEW_QUESTIONS || [];

        // Apply filters
        if (this.activeFilterDifficulty !== 'all') {
            list = list.filter(q => q.difficulty.toLowerCase() === this.activeFilterDifficulty.toLowerCase());
        }
        if (this.activeFilterTech !== 'all') {
            list = list.filter(q => q.techId === this.activeFilterTech);
        }

        let html = list.map(q => {
            const prog = Store.getDevQuestionProgress(q.id);
            const status = prog.status || 'DONT_KNOW';
            const diffClass = (q.difficulty || 'Medium').toLowerCase();

            return `
                <div class="dev-interview-item">
                    <div class="dev-iq-header">
                        <div style="display:flex; align-items:center; gap: 8px;">
                            <span class="difficulty-tag ${diffClass}">${q.difficulty}</span>
                            <span class="dev-tech-tag" style="margin: 0;">${q.tech}</span>
                            <span class="dev-iq-title">${q.question}</span>
                        </div>
                        <select class="status-select ${status.toLowerCase()}" onchange="DevelopmentEngine.onQuestionStatusChange('${q.id}', this.value)">
                            <option value="KNOW" ${status === 'KNOW' ? 'selected' : ''}>Know ✓</option>
                            <option value="PARTIAL" ${status === 'PARTIAL' ? 'selected' : ''}>Partially Know ⚠️</option>
                            <option value="DONT_KNOW" ${status === 'DONT_KNOW' ? 'selected' : ''}>Don't Know ❌</option>
                            <option value="REVISION" ${status === 'REVISION' ? 'selected' : ''}>Need Revision 🔄</option>
                        </select>
                    </div>
                    <div class="dev-iq-body">
                        <button class="btn-toggle-answer" onclick="document.getElementById('iq-global-${q.id}').classList.toggle('open')">
                            💡 View Technical Answer
                        </button>
                        <div class="dev-iq-answer" id="iq-global-${q.id}">
                            <div class="answer-content">${q.answer}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html || '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No questions match filter criteria.</div>';
    },

    setInterviewFilter(filterType, value) {
        if (filterType === 'difficulty') {
            this.activeFilterDifficulty = value;
            document.querySelectorAll('.iq-diff-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.diff === value);
            });
        } else if (filterType === 'tech') {
            this.activeFilterTech = value;
        }
        this.renderInterviewHub();
    },

    // =========================================================================
    // REVISION HUB
    // =========================================================================
    renderRevisionHub() {
        const container = document.getElementById('devRevisionList');
        if (!container) return;

        const rev = Store.getDevRevisitItems();

        if (rev.totalCount === 0) {
            container.innerHTML = `
                <div class="dev-empty-revision">
                    <span style="font-size: 32px;">🎉</span>
                    <h4>Revision Queue is Empty!</h4>
                    <p>Mark any topic, video, practical task, or interview question as "Revisit 🔄" to review it here.</p>
                </div>
            `;
            return;
        }

        let topRows = (rev.topics || []).map(t => `
            <tr class="problem-row">
                <td style="width: 15%;"><span class="dev-tech-tag">${t.techName}</span></td>
                <td style="width: 45%;"><span class="prob-name">${t.title}</span> <small style="color:var(--text-muted);">(${t.category})</small></td>
                <td style="width: 20%; color: var(--text-muted); font-size: 12px;">Topic</td>
                <td style="width: 20%; text-align: right;">
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="DevelopmentEngine.openTechSheet('${t.techId}', 'playlist')">
                        Open Topic →
                    </button>
                </td>
            </tr>
        `).join('');

        let vRows = rev.videos.map(v => `
            <tr class="problem-row">
                <td style="width: 15%;"><span class="dev-tech-tag">${v.techId.toUpperCase()}</span></td>
                <td style="width: 45%;"><span class="prob-name">${v.title}</span></td>
                <td style="width: 20%; color: var(--text-muted); font-size: 12px;">${v.dateMarked}</td>
                <td style="width: 20%; text-align: right;">
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="DevelopmentEngine.openTechSheet('${v.techId}', 'playlist', '${v.id}')">
                        Open & Revise →
                    </button>
                </td>
            </tr>
        `).join('');

        let tRows = rev.tasks.map(t => `
            <tr class="problem-row">
                <td style="width: 15%;"><span class="dev-tech-tag">${t.techName}</span></td>
                <td style="width: 45%;"><span class="prob-name">${t.title}</span></td>
                <td style="width: 20%; color: var(--text-muted); font-size: 12px;">Task</td>
                <td style="width: 20%; text-align: right;">
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="DevelopmentEngine.openTechSheet('${t.techId}', 'tasks')">
                        Open Task →
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="dev-table-wrapper">
                <table class="problem-table">
                    <thead>
                        <tr>
                            <th style="width: 15%;">Technology</th>
                            <th style="width: 45%;">Item Description</th>
                            <th style="width: 20%;">Type</th>
                            <th style="width: 20%; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topRows}
                        ${vRows}
                        ${tRows}
                    </tbody>
                </table>
            </div>
        `;
    },

    // =========================================================================
    // ANALYTICS SECTION
    // =========================================================================
    renderAnalytics(stats) {
        const container = document.getElementById('devAnalyticsBreakdown');
        if (!container) return;

        let html = '';
        Object.entries(stats.techBreakdown).forEach(([id, b]) => {
            let labelStats = '';
            if (b.totalTopics > 0) {
                labelStats = `${b.solvedTopics}/${b.totalTopics} topics • ${b.solvedTasks}/${b.totalTasks} tasks (${b.percent}%)`;
            } else if (b.totalVideos > 0) {
                labelStats = `${b.solvedVideos}/${b.totalVideos} videos • ${b.solvedTasks}/${b.totalTasks} tasks (${b.percent}%)`;
            } else {
                labelStats = `${b.solvedTasks}/${b.totalTasks} tasks (${b.percent}%)`;
            }

            html += `
                <div class="dev-analytics-row">
                    <div class="analytics-label">
                        <span>${b.icon} ${b.name}</span>
                        <span>${labelStats}</span>
                    </div>
                    <div class="dev-tech-prog-bar">
                        <div class="dev-tech-prog-fill" style="width: ${b.percent}%;"></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // =========================================================================
    // SEARCH ENGINE
    // =========================================================================
    openGlobalSearch() {
        const modal = document.getElementById('devSearchModal');
        const input = document.getElementById('devSearchInput');
        if (modal) {
            modal.classList.add('active');
            if (input) {
                input.focus();
                this.onSearchInput(input.value);
            }
        }
    },

    closeSearchModal() {
        const modal = document.getElementById('devSearchModal');
        if (modal) modal.classList.remove('active');
    },

    onSearchInput(query) {
        const q = (query || '').toLowerCase().trim();
        const resultsEl = document.getElementById('devSearchResults');
        if (!resultsEl) return;

        if (!q) {
            resultsEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">Type to search topics, videos, concepts, tasks, projects, or interview questions...</div>';
            return;
        }

        const results = [];

        // 1. Search Topics
        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                (tech.topics || []).forEach(top => {
                    if (top.name.toLowerCase().includes(q) || top.detail.toLowerCase().includes(q) || top.category.toLowerCase().includes(q)) {
                        results.push({
                            type: 'Topic',
                            title: `${tech.icon} ${top.name}`,
                            subtitle: `${tech.name} • ${top.category} — ${top.detail}`,
                            action: `DevelopmentEngine.closeSearchModal(); DevelopmentEngine.openTechSheet('${tech.id}', 'playlist');`
                        });
                    }
                });
            });
        }

        // 2. Search Videos
        if (typeof DEV_PLAYLISTS !== 'undefined') {
            Object.entries(DEV_PLAYLISTS).forEach(([pKey, vList]) => {
                const tech = DEV_TECHNOLOGIES.find(t => t.sourcePlaylist === pKey) || { name: pKey, id: pKey };
                vList.forEach(v => {
                    if (v.title.toLowerCase().includes(q)) {
                        results.push({
                            type: 'Video',
                            title: v.title,
                            subtitle: `${tech.name} • #${v.position} • ${v.duration}`,
                            action: `DevelopmentEngine.closeSearchModal(); DevelopmentEngine.openTechSheet('${tech.id}', 'playlist', '${v.id}');`
                        });
                    }
                });
            });
        }

        // 3. Search Technologies & Concepts
        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                const tName = (tech.name || '').toLowerCase();
                const why = (tech.whyItMatters || '').toLowerCase();
                if (tName.includes(q) || why.includes(q)) {
                    results.push({
                        type: 'Technology',
                        title: `${tech.icon || ''} ${tech.name}`,
                        subtitle: tech.tagline || '',
                        action: `DevelopmentEngine.closeSearchModal(); DevelopmentEngine.openTechSheet('${tech.id}');`
                    });
                }
                (tech.concepts || []).forEach(c => {
                    const cName = (c.name || '').toLowerCase();
                    const cDetail = (c.detail || '').toLowerCase();
                    if (cName.includes(q) || cDetail.includes(q)) {
                        results.push({
                            type: 'Concept',
                            title: c.name,
                            subtitle: `${tech.name} — ${c.detail || ''}`,
                            action: `DevelopmentEngine.closeSearchModal(); DevelopmentEngine.openTechSheet('${tech.id}', 'overview');`
                        });
                    }
                });
            });
        }

        // 4. Search Projects
        if (typeof DEV_PROJECTS !== 'undefined') {
            DEV_PROJECTS.forEach(p => {
                const title = (p.title || '').toLowerCase();
                const summary = (p.summary || '').toLowerCase();
                const tagline = (p.tagline || '').toLowerCase();
                const stack = (p.stack || p.techStack || []).join(' ').toLowerCase();
                if (title.includes(q) || summary.includes(q) || tagline.includes(q) || stack.includes(q)) {
                    results.push({
                        type: 'Project',
                        title: `🚀 ${p.title}`,
                        subtitle: `${p.tier || ''} • ${p.tagline || ''}`,
                        action: `DevelopmentEngine.closeSearchModal(); DevelopmentEngine.scrollToSection('proj-card-${p.id}');`
                    });
                }
            });
        }

        // 5. Search Interview Questions
        if (typeof DEV_INTERVIEW_QUESTIONS !== 'undefined') {
            DEV_INTERVIEW_QUESTIONS.forEach(iq => {
                const question = (iq.question || '').toLowerCase();
                const answer = (iq.answer || '').toLowerCase();
                if (question.includes(q) || answer.includes(q)) {
                    results.push({
                        type: 'Interview Q&A',
                        title: `🎤 ${iq.question}`,
                        subtitle: `${iq.tech || ''} • ${iq.difficulty || ''}`,
                        action: `DevelopmentEngine.closeSearchModal(); DevelopmentEngine.openTechSheet('${iq.techId}', 'interview');`
                    });
                }
            });
        }

        if (results.length === 0) {
            resultsEl.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 20px;">No development items found for "${query}".</div>`;
            return;
        }

        resultsEl.innerHTML = results.slice(0, 30).map(r => `
            <div class="dev-search-result-item" onclick="${r.action}">
                <div class="search-res-type">${r.type}</div>
                <div class="search-res-title">${r.title}</div>
                <div class="search-res-sub">${r.subtitle}</div>
            </div>
        `).join('');
    },

    scrollToSection(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Dynamically determines the next unfinished Development item
     * used for the daily 12:40 AM – 2:00 AM development study block.
     */
    getNextUnfinishedItem() {
        const devState = (typeof Store !== 'undefined' && Store.getDevState) ? Store.getDevState() : {};
        const vProg = devState.videos || {};
        const topProg = devState.topics || {};
        const taskProg = devState.tasks || {};

        // 1. In-progress video
        if (typeof DEV_PLAYLISTS !== 'undefined') {
            for (const [techKey, vList] of Object.entries(DEV_PLAYLISTS)) {
                const inProg = vList.find(v => vProg[v.id]?.status === 'IN_PROGRESS');
                if (inProg) {
                    const tech = (typeof DEV_TECHNOLOGIES !== 'undefined') ? (DEV_TECHNOLOGIES.find(t => t.sourcePlaylist === techKey) || { name: techKey, id: techKey }) : { name: techKey, id: techKey };
                    return {
                        type: 'video',
                        techId: tech.id,
                        techName: tech.name,
                        title: inProg.title,
                        videoId: inProg.id,
                        url: inProg.url,
                        notes: `Continue Video: #${inProg.position} ${inProg.title}`
                    };
                }
            }
        }

        // 2. Next unstarted video in technology sequence
        if (typeof DEV_TECHNOLOGIES !== 'undefined' && typeof DEV_PLAYLISTS !== 'undefined') {
            for (const tech of DEV_TECHNOLOGIES) {
                const playlist = DEV_PLAYLISTS[tech.sourcePlaylist] || [];
                const nextVid = playlist.find(v => !vProg[v.id] || vProg[v.id].status === 'NOT_STARTED');
                if (nextVid) {
                    return {
                        type: 'video',
                        techId: tech.id,
                        techName: tech.name,
                        title: nextVid.title,
                        videoId: nextVid.id,
                        url: nextVid.url,
                        notes: `Continue Playlist: #${nextVid.position} ${nextVid.title}`
                    };
                }
            }
        }

        // 3. Next uncompleted practical task
        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            for (const tech of DEV_TECHNOLOGIES) {
                const tasks = tech.practicalTasks || [];
                const nextTask = tasks.find(t => !taskProg[t.id] || taskProg[t.id].status !== 'SOLVED');
                if (nextTask) {
                    return {
                        type: 'task',
                        techId: tech.id,
                        techName: tech.name,
                        title: nextTask.title,
                        taskId: nextTask.id,
                        notes: `Practical Task: ${nextTask.title}`
                    };
                }
            }
        }

        return {
            type: 'video',
            techId: 'javascript',
            techName: 'JavaScript',
            title: 'Full-Stack Practical Project Track',
            notes: 'Continue development roadmap'
        };
    }
};

// Global export
if (typeof window !== 'undefined') {
    window.DevelopmentEngine = DevelopmentEngine;
    window.DevelopmentModule = DevelopmentEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { DevelopmentEngine, DevelopmentModule: DevelopmentEngine };
}
