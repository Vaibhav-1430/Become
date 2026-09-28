/**
 * BOSS Study OS — Main Application Controller & View Router
 * Orchestrates Store, DSA Engine, Task Engine, Calendar Engine, Notifications & Recipes.
 */

// Toast notification helper with optional Undo action
function showToast(message, type = 'info', undoCallback = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${undoCallback ? 'undo-toast' : ''}`;
    
    let icon = 'ℹ️';
    if (type === 'warning') icon = '⚠️';
    if (type === 'success') icon = '✅';

    let contentHtml = `
        <span style="font-size: 16px;">${icon}</span>
        <div style="flex: 1; font-size: 13.5px;">${message}</div>
    `;

    if (undoCallback) {
        contentHtml += `
            <button class="btn-toast-undo" id="btnToastUndoAction">UNDO</button>
        `;
    }

    toast.innerHTML = contentHtml;
    container.appendChild(toast);

    if (undoCallback) {
        const undoBtn = toast.querySelector('#btnToastUndoAction');
        if (undoBtn) {
            undoBtn.onclick = () => {
                undoCallback();
                toast.remove();
            };
        }
    }

    // Auto dismiss after 10 seconds for undo toasts, 4 seconds for normal
    const timeoutDuration = undoCallback ? 10000 : 4000;
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }
    }, timeoutDuration);
}

// Day Detail Modal Controller
const DayModal = {
    currentDate: null,

    open(dateStr) {
        this.currentDate = dateStr;
        const modal = document.getElementById('dayDetailModal');
        const title = document.getElementById('modalDateTitle');
        const subtitle = document.getElementById('modalDateSubtitle');
        const recipeName = document.getElementById('modalRecipeName');

        if (!modal) return;

        title.textContent = DateUtils.formatDateLong(dateStr);
        const isWeekend = DateUtils.isWeekend(dateStr);
        subtitle.textContent = `${DateUtils.getWeekdayName(dateStr)} ${isWeekend ? '(Weekend Schedule)' : '(Standard Routine)'}`;

        // Set date recipe
        const recipe = DateUtils.getRecipeForDate(dateStr);
        if (recipeName) recipeName.textContent = recipe.name;

        this.renderTasks();
        modal.classList.add('active');
    },

    close() {
        const modal = document.getElementById('dayDetailModal');
        if (modal) modal.classList.remove('active');
        this.currentDate = null;
    },

    renderTasks() {
        if (!this.currentDate) return;
        const list = document.getElementById('dayModalTasksList');
        const tasks = TaskEngine.getTasksForDate(this.currentDate);

        if (!tasks || tasks.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No tasks generated for this date.</div>`;
            return;
        }

        let html = '';
        tasks.forEach(task => {
            const isCompleted = task.status === APP_CONFIG.TASK_STATUS.COMPLETED;
            const isInterrupted = task.status === APP_CONFIG.TASK_STATUS.INTERRUPTED;
            const isRecovery = task.category === APP_CONFIG.CATEGORIES.RECOVERY;

            let historyHtml = '';
            if (task.history && task.history.length > 0) {
                historyHtml = `
                    <div class="day-task-history">
                        <b style="color: var(--text-secondary); display: block; margin-bottom: 4px;">Task History & Audit:</b>
                        ${task.history.map(h => `
                            <div class="history-entry">• <span style="color: var(--text-muted);">${h.timestamp.slice(11, 16)}</span> — ${h.detail}</div>
                        `).join('')}
                    </div>
                `;
            }

            let removeInterruptionBtn = '';
            if (isInterrupted && task.rescheduledTo) {
                removeInterruptionBtn = `
                    <button class="action-btn-ghost danger" style="font-size: 11px; padding: 4px 8px; margin-top: 4px;" onclick="App.removeInterruptionFromTask('${this.currentDate}', '${task.id}')">
                        ✕ Remove Interruption
                    </button>
                `;
            }

            const midnightBadge = task.crossesMidnight ? `<span style="display: inline-block; background: rgba(168, 85, 247, 0.15); color: #c084fc; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">🌙 Crosses Midnight</span>` : '';

            html += `
                <div class="day-task-item ${isCompleted ? 'is-completed' : ''} ${isRecovery ? 'is-recovery' : ''} ${isInterrupted ? 'is-interrupted' : ''}">
                    <div class="day-task-header">
                        <div>
                            <span class="day-task-time">${task.startTime} – ${task.endTime} ${midnightBadge}</span>
                            <div style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                                ${task.title}
                            </div>
                            ${task.notes ? `<div style="font-size: 12px; color: var(--amber); margin-top: 2px;">${task.notes}</div>` : ''}
                            ${removeInterruptionBtn}
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <select class="status-select ${task.status.toLowerCase()}" onchange="App.onModalTaskStatusChange('${this.currentDate}', '${task.id}', this.value)">
                                <option value="NOT_STARTED" ${task.status === 'NOT_STARTED' ? 'selected' : ''}>Not Started</option>
                                <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                                <option value="COMPLETED" ${task.status === 'COMPLETED' ? 'selected' : ''}>Completed ✓</option>
                                <option value="INTERRUPTED" ${task.status === 'INTERRUPTED' ? 'selected' : ''}>Interrupted ⏸</option>
                                <option value="REVISIT" ${task.status === 'REVISIT' ? 'selected' : ''}>Revisit 🔄</option>
                            </select>
                        </div>
                    </div>
                    ${historyHtml}
                </div>
            `;
        });

        list.innerHTML = html;
    }
};

// Main App Controller
const App = {
    activeView: 'today',
    currentRecipeOverride: null,
    renderedViews: new Set(),

    invalidateView(viewName) {
        if (viewName) {
            this.renderedViews.delete(viewName);
        } else {
            this.renderedViews.clear();
        }
    },

    async init() {
        await Store._initPromise;

        // Initialize Supabase & Auth
        if (typeof SupabaseService !== 'undefined') {
            await SupabaseService.init();
        }
        if (typeof AuthController !== 'undefined') {
            AuthController.init();
        }

        CalendarEngine.init();
        NotificationManager.init();
        if (typeof PlacementEngine !== 'undefined') {
            PlacementEngine.init();
        }
        if (typeof DevelopmentEngine !== 'undefined') {
            DevelopmentEngine.init();
        }
        if (typeof StudySessionEngine !== 'undefined') {
            StudySessionEngine.init();
        }
        if (typeof MistakeBank !== 'undefined') {
            MistakeBank.init();
        }
        if (typeof GymEngine !== 'undefined') {
            GymEngine.init();
        }
        if (typeof TaskEngine !== 'undefined' && TaskEngine.syncScheduleToAllCalendarDays) {
            TaskEngine.syncScheduleToAllCalendarDays();
        }

        this.setupNavigation();
        this.initMobileDrawer();
        this.setupActionListeners();
        this.checkPlacementState();

        // Enforce Authentication Wall & Session Check
        if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
            if (typeof AuthController !== 'undefined') {
                AuthController.hideAuthWall();
            }
            await this.onUserAuthenticated(SupabaseService.currentUser);
        } else {
            if (typeof AuthController !== 'undefined') {
                AuthController.showAuthWall('login');
                AuthController.renderProfileCard(null);
            }
        }

        this.renderAll();
    },

    initMobileDrawer() {
        const toggleBtn = document.getElementById('btnMobileMenuToggle');
        const closeBtn = document.getElementById('btnSidebarDrawerClose');
        const backdrop = document.getElementById('sidebarDrawerBackdrop');

        if (toggleBtn) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleMobileDrawer();
            };
        }

        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.closeMobileDrawer();
            };
        }

        if (backdrop) {
            backdrop.onclick = () => {
                this.closeMobileDrawer();
            };
        }

        // Close drawer on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileDrawerOpen()) {
                this.closeMobileDrawer();
            }
        });

        // Close drawer on utility action buttons clicked on mobile
        const sidebar = document.getElementById('appSidebar') || document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.querySelectorAll('.action-btn-ghost, .user-card-content').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (window.innerWidth < 1024 && this.isMobileDrawerOpen()) {
                        this.closeMobileDrawer();
                    }
                });
            });
        }

        this.updateMobileHeaderState();
    },

    openMobileDrawer() {
        const sidebar = document.getElementById('appSidebar') || document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebarDrawerBackdrop');
        const toggleBtn = document.getElementById('btnMobileMenuToggle');

        if (sidebar) sidebar.classList.add('drawer-open');
        if (backdrop) backdrop.classList.add('active');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.classList.add('active');
        }
        document.body.classList.add('drawer-open-lock');
    },

    closeMobileDrawer() {
        const sidebar = document.getElementById('appSidebar') || document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebarDrawerBackdrop');
        const toggleBtn = document.getElementById('btnMobileMenuToggle');

        if (sidebar) sidebar.classList.remove('drawer-open');
        if (backdrop) backdrop.classList.remove('active');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.classList.remove('active');
        }
        document.body.classList.remove('drawer-open-lock');
    },

    toggleMobileDrawer() {
        if (this.isMobileDrawerOpen()) {
            this.closeMobileDrawer();
        } else {
            this.openMobileDrawer();
        }
    },

    isMobileDrawerOpen() {
        const sidebar = document.getElementById('appSidebar') || document.querySelector('.sidebar');
        return sidebar ? sidebar.classList.contains('drawer-open') : false;
    },

    updateMobileHeaderState(viewName = this.activeView) {
        const mobileViewHeading = document.getElementById('mobileViewHeading');
        const headings = {
            today: "Today's Missions",
            calendar: "Command Calendar",
            dsa: "Striver A2Z DSA",
            "ai-engine": "AI Study Engine",
            development: "Development Hub",
            mistakes: "Mistake Bank",
            food: "Gym & Lifestyle",
            placement: "Placement Hub",
            internship: "Internships",
            stats: "Analytics & Streak"
        };
        if (mobileViewHeading) {
            mobileViewHeading.textContent = headings[viewName] || "StudyOS";
        }

        const streakVal = document.getElementById('mobileStreakValue');
        if (streakVal && typeof TaskEngine !== 'undefined' && TaskEngine.calculateStreak) {
            streakVal.textContent = TaskEngine.calculateStreak();
        }
    },

    async onUserAuthenticated(user) {
        window.currentUser = user;
        if (typeof AuthController !== 'undefined') {
            AuthController.renderProfileCard(user);
        }

        // Fetch user records from Supabase
        if (typeof SupabaseService !== 'undefined') {
            const cloudData = await SupabaseService.loadUserData();
            if (cloudData) {
                Store.loadFromCloud(cloudData);
            }
        }

        // Invalidate rendered views on cloud hydration and render ONLY active view
        this.invalidateView();
        this.renderAll();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const targetView = link.dataset.view;
                this.switchView(targetView);
            });
        });

        const goalCard = document.getElementById('sidebarGoalCard');
        if (goalCard) {
            goalCard.addEventListener('click', () => this.switchView('placement'));
        }

        // Independent Sidebar Scroll: scrolling wheel anywhere over sidebar scrolls navigation
        const sidebar = document.querySelector('.sidebar');
        const scrollArea = document.getElementById('sidebarScrollArea') || document.querySelector('.sidebar-scroll-area, .sidebar-content');
        if (sidebar && scrollArea) {
            sidebar.addEventListener('wheel', (e) => {
                if (!scrollArea.contains(e.target) || e.target === scrollArea) {
                    scrollArea.scrollTop += e.deltaY;
                }
            }, { passive: true });
        }
    },

    switchView(viewName, force = false) {
        this.activeView = viewName;

        if (this.isMobileDrawerOpen()) {
            this.closeMobileDrawer();
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('active-view');
        });
        const targetSection = document.getElementById(`view-${viewName}`);
        if (targetSection) {
            targetSection.classList.add('active-view');
        }

        const headings = {
            today: "Today's Missions",
            calendar: "2-Year Command Calendar",
            dsa: "Striver A2Z DSA Progression",
            "ai-engine": "Adaptive AI Study Engine & Tutor",
            development: "Full-Stack Development Command Center",
            mistakes: "Mistake Bank & Knowledge Weakness Map",
            food: "Gym, Workouts & Lifestyle Command",
            placement: "Placement Preparation Command",
            internship: "Internship Application Tracker",
            stats: "Progress Analytics & Streaks"
        };
        const viewHeading = document.getElementById('viewHeading');
        if (viewHeading) viewHeading.textContent = headings[viewName] || "Study OS";
        this.updateMobileHeaderState(viewName);

        const needsRender = force || !this.renderedViews.has(viewName);
        if (needsRender) {
            this.renderViewContent(viewName);
            this.renderedViews.add(viewName);
        }
    },

    renderViewContent(viewName) {
        if (viewName === 'today') this.renderDashboard();
        else if (viewName === 'calendar') CalendarEngine.render();
        else if (viewName === 'dsa') this.renderDsaView();
        else if (viewName === 'ai-engine') {
            if (typeof AIEngine !== 'undefined') AIEngine.render();
        }
        else if (viewName === 'development') {
            if (typeof DevelopmentEngine !== 'undefined') DevelopmentEngine.render();
            if (typeof window !== 'undefined' && typeof window.loadMonaco === 'function') {
                window.loadMonaco().catch(() => {});
            }
        }
        else if (viewName === 'mistakes') {
            if (typeof MistakeBank !== 'undefined') MistakeBank.render();
        }
        else if (viewName === 'food') {
            if (typeof GymEngine !== 'undefined') GymEngine.render();
            else this.renderFoodView();
        }
        else if (viewName === 'placement') this.renderPlacementView();
        else if (viewName === 'internship') this.renderInternshipView();
        else if (viewName === 'stats') this.renderStatsView();
    },

    setupActionListeners() {
        // Interruption buttons (3 Options)
        const btnCards = document.getElementById('btnInterruptCards');
        if (btnCards) {
            btnCards.addEventListener('click', () => this.handleInterruption(APP_CONFIG.INTERRUPTIONS.CARDS));
        }

        const btnGF = document.getElementById('btnInterruptGF');
        if (btnGF) {
            btnGF.addEventListener('click', () => this.handleInterruption(APP_CONFIG.INTERRUPTIONS.GF));
        }

        const btnOverslept = document.getElementById('btnInterruptOverslept');
        if (btnOverslept) {
            btnOverslept.addEventListener('click', () => this.handleInterruption(APP_CONFIG.INTERRUPTIONS.OVERSLEPT));
        }

        // Calendar controls
        const calPrev = document.getElementById('calPrevMonth');
        const calNext = document.getElementById('calNextMonth');
        const calToday = document.getElementById('calTodayBtn');
        if (calPrev) calPrev.addEventListener('click', () => CalendarEngine.prevMonth());
        if (calNext) calNext.addEventListener('click', () => CalendarEngine.nextMonth());
        if (calToday) calToday.addEventListener('click', () => CalendarEngine.goToToday());

        // Day modal close
        const btnCloseDay = document.getElementById('btnCloseDayModal');
        if (btnCloseDay) btnCloseDay.addEventListener('click', () => DayModal.close());

        // Recipe randomizer buttons
        const btnWidgetRecipe = document.getElementById('btnWidgetNewRecipe');
        if (btnWidgetRecipe) {
            btnWidgetRecipe.addEventListener('click', () => this.rollRandomRecipe());
        }
        const btnFoodRecipe = document.getElementById('btnFoodNewRecipe');
        if (btnFoodRecipe) {
            btnFoodRecipe.addEventListener('click', () => this.rollRandomRecipe());
        }

        // StudyOS Settings & Notifications Modal
        const badge = document.getElementById('notifStatusBadge');
        if (badge) badge.addEventListener('click', () => this.openSettingsModal('notif'));

        const btnTopSettings = document.getElementById('btnTopBarSettings');
        if (btnTopSettings) btnTopSettings.addEventListener('click', () => this.openSettingsModal('ai'));

        const btnSidebarSettings = document.getElementById('btnSidebarSettings');
        if (btnSidebarSettings) btnSidebarSettings.addEventListener('click', () => this.openSettingsModal('ai'));

        const btnOpenNotif = document.getElementById('btnOpenNotifSettings');
        if (btnOpenNotif) btnOpenNotif.addEventListener('click', () => this.openSettingsModal('notif'));

        const notifModal = document.getElementById('notifSettingsModal');
        const btnCloseNotif = document.getElementById('btnCloseNotifSettings');
        if (btnCloseNotif && notifModal) {
            btnCloseNotif.addEventListener('click', () => notifModal.classList.remove('active'));
        }

        const btnReqPerm = document.getElementById('btnRequestNotifPerm');
        if (btnReqPerm) {
            btnReqPerm.addEventListener('click', async () => {
                await NotificationManager.requestPermission();
                NotificationManager.updateStatusBadge();
            });
        }

        const btnSaveNotif = document.getElementById('btnSaveNotifSettings');
        if (btnSaveNotif) {
            btnSaveNotif.addEventListener('click', () => {
                Store.updateSettings({
                    notifyDsa: document.getElementById('checkNotifyDsa')?.checked ?? true,
                    notifyDev: document.getElementById('checkNotifyDev')?.checked ?? true,
                    notifyAiPlan: document.getElementById('checkNotifyAiPlan')?.checked ?? true,
                    notifyCreatine: document.getElementById('checkNotifyCreatine')?.checked ?? true
                });
                if (notifModal) notifModal.classList.remove('active');
                showToast('Notification preferences saved!', 'success');
            });
        }

        // Fetch initial Gemini status on startup
        this.fetchGeminiStatus();

        // Add custom task buttons
        const btnOpenAddTask = document.getElementById('btnOpenAddTask');
        const btnModalAddCustom = document.getElementById('btnModalAddCustomTask');
        const customModal = document.getElementById('customTaskModal');
        const btnCloseTask = document.getElementById('btnCloseTaskModal');
        const btnSaveTask = document.getElementById('btnSaveCustomTask');

        if (btnOpenAddTask) {
            btnOpenAddTask.addEventListener('click', () => customModal.classList.add('active'));
        }
        if (btnModalAddCustom) {
            btnModalAddCustom.addEventListener('click', () => customModal.classList.add('active'));
        }
        if (btnCloseTask) {
            btnCloseTask.addEventListener('click', () => customModal.classList.remove('active'));
        }
        if (btnSaveTask) {
            btnSaveTask.addEventListener('click', () => this.saveCustomTask());
        }

        // Internship modal
        const btnAddIntern = document.getElementById('btnAddInternship');
        const internModal = document.getElementById('internshipModal');
        const btnCloseIntern = document.getElementById('btnCloseInternModal');
        const btnSaveIntern = document.getElementById('btnSaveInternship');

        if (btnAddIntern) {
            btnAddIntern.addEventListener('click', () => {
                document.getElementById('inputInternDate').value = DateUtils.todayIST();
                internModal.classList.add('active');
            });
        }
        if (btnCloseIntern) {
            btnCloseIntern.addEventListener('click', () => internModal.classList.remove('active'));
        }
        if (btnSaveIntern) {
            btnSaveIntern.addEventListener('click', () => this.saveInternship());
        }

        // Placement celebration
        const btnTriggerPlaced = document.getElementById('btnTriggerPlaced');
        const placementModal = document.getElementById('placementConfirmModal');
        const btnClosePlaced = document.getElementById('btnClosePlacementModal');
        const btnCancelPlaced = document.getElementById('btnCancelPlacement');
        const btnConfirmPlaced = document.getElementById('btnConfirmPlacement');

        if (btnTriggerPlaced) {
            btnTriggerPlaced.addEventListener('click', () => placementModal.classList.add('active'));
        }
        if (btnClosePlaced) btnClosePlaced.addEventListener('click', () => placementModal.classList.remove('active'));
        if (btnCancelPlaced) btnCancelPlaced.addEventListener('click', () => placementModal.classList.remove('active'));
        if (btnConfirmPlaced) {
            btnConfirmPlaced.addEventListener('click', () => this.confirmPlacementAchieved());
        }



        // Backup Export / Import / Reset
        const exportBtn = document.getElementById('exportBackupBtn');
        const importFile = document.getElementById('importBackupFile');
        const resetBtn = document.getElementById('resetAppBtn');

        if (exportBtn) exportBtn.addEventListener('click', () => Store.exportBackup());
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                    const res = await Store.importBackup(reader.result);
                    if (res.success) {
                        this.invalidateView();
                        this.renderAll();
                        showToast('Backup restored successfully!', 'success');
                    } else {
                        alert('Error importing backup: ' + res.error);
                    }
                };
                reader.readAsText(file);
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                if (confirm('⚠️ Are you sure you want to RESET ALL LOCAL DATA? This cannot be undone.')) {
                    await Store.resetAllData();
                    this.renderAll();
                    showToast('All data reset to initial state.', 'warning');
                }
            });
        }
    },

    // ----------------------------------------------------
    // Rendering Engines
    // ----------------------------------------------------

    renderAll() {
        this.renderTopBar();
        if (typeof NotificationManager !== 'undefined' && NotificationManager.updateStatusBadge) {
            NotificationManager.updateStatusBadge();
        }
        const active = this.activeView || 'today';
        this.renderViewContent(active);
        this.renderedViews.add(active);
    },

    renderTopBar() {
        const todayStr = DateUtils.todayIST();
        const greeting = DateUtils.getGreeting();
        const greetingEl = document.getElementById('greetingEyebrow');
        const dateEl = document.getElementById('currentDateDisplay');
        const streakEl = document.getElementById('currentStreakDisplay');

        if (greetingEl) greetingEl.textContent = `${greeting}, BOSS 👋`;
        if (dateEl) dateEl.textContent = DateUtils.formatDateLong(todayStr);

        const streak = TaskEngine.calculateStreak();
        if (streakEl) streakEl.textContent = `🔥 ${streak} Day Streak`;

        const mobileStreakEl = document.getElementById('mobileStreakValue');
        if (mobileStreakEl) mobileStreakEl.textContent = streak;
    },

    renderDashboard() {
        const todayStr = DateUtils.todayIST();
        const summary = TaskEngine.getDaySummary(todayStr);
        const streak = TaskEngine.calculateStreak();
        const dsaStats = DSAEngine.getStats();

        // 1. Progress Ring
        const ring = document.getElementById('heroProgressCircle');
        const ringText = document.getElementById('heroProgressPct');
        const circumference = 226.19;
        if (ring) {
            const offset = circumference - (summary.pct / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }
        if (ringText) ringText.textContent = `${summary.pct}%`;

        // 2. Metrics Grid
        const metricTodayPct = document.getElementById('metricTodayPct');
        const metricTodaySub = document.getElementById('metricTodaySub');
        const metricDsaRatio = document.getElementById('metricDsaRatio');
        const metricDsaTotal = document.getElementById('metricDsaTotal');
        const metricDevRatio = document.getElementById('metricDevRatio');
        const metricStreakVal = document.getElementById('metricStreakVal');

        if (metricTodayPct) metricTodayPct.textContent = `${summary.pct}%`;
        if (metricTodaySub) metricTodaySub.textContent = `${summary.completedStudy} of ${summary.totalStudy} study tasks`;
        if (metricDsaRatio) metricDsaRatio.textContent = `${summary.dsaCompleted}/${summary.dsaTotal || 3}`;
        if (metricDsaTotal) metricDsaTotal.textContent = `${dsaStats.solved} of ${dsaStats.total} total A2Z`;
        if (metricDevRatio) metricDevRatio.textContent = `${summary.devCompleted}/${summary.devTotal || 1}`;
        if (metricStreakVal) metricStreakVal.textContent = `${streak} Days`;

        // 3. Render Today's AI Dashboard Card (Part 11)
        if (typeof AIEngine !== 'undefined') {
            AIEngine.renderTodayAiCard();
        }

        // 3. Render Post-Workout Recipe Widget
        this.renderRecipeWidget();

        // 4. Render Today's Development Mission Widget
        this.renderTodayDevMissionWidget();

        // 5. Update Recovery Breadcrumb
        this.updateRecoveryBreadcrumb();

        // 6. Missions Timeline
        this.renderTodayTimeline();
    },

    renderTodayDevMissionWidget() {
        const titleEl = document.getElementById('todayDevMissionTitle');
        const watchEl = document.getElementById('todayDevWatchText');
        const practiceEl = document.getElementById('todayDevPracticeText');
        const revEl = document.getElementById('todayDevRevisionText');

        if (!titleEl || typeof Store === 'undefined' || typeof DEV_TECHNOLOGIES === 'undefined') return;

        const devState = Store.getDevState();
        const revisit = Store.getDevRevisitItems();

        // Find next uncompleted topic or video
        let nextItem = null;
        let nextTech = null;

        for (const tech of DEV_TECHNOLOGIES) {
            // 1. Check topics if tech has topics
            if (tech.topics && tech.topics.length > 0) {
                const uncompletedTopic = tech.topics.find(top => devState.topics?.[top.id]?.status !== 'SOLVED');
                if (uncompletedTopic) {
                    nextItem = { type: 'topic', data: uncompletedTopic };
                    nextTech = tech;
                    break;
                }
            }

            // 2. Check videos
            const pList = (typeof DEV_PLAYLISTS !== 'undefined' && DEV_PLAYLISTS[tech.sourcePlaylist]) || [];
            const uncompletedVideo = pList.find(v => devState.videos[v.id]?.status !== 'SOLVED');
            if (uncompletedVideo) {
                nextItem = { type: 'video', data: uncompletedVideo };
                nextTech = tech;
                break;
            }
        }

        if (nextItem && nextTech) {
            if (nextItem.type === 'topic') {
                titleEl.textContent = `${nextTech.name} — ${nextItem.data.name}`;
                if (watchEl) {
                    watchEl.innerHTML = `<a href="javascript:void(0)" onclick="App.switchView('development'); DevelopmentEngine.openTechSheet('${nextTech.id}', 'playlist')" style="color: var(--gold); text-decoration: underline;">${nextItem.data.name} (${nextItem.data.category}) →</a>`;
                }
            } else {
                titleEl.textContent = `${nextTech.name} — #${nextItem.data.position}: ${nextItem.data.title}`;
                if (watchEl) {
                    watchEl.innerHTML = `<a href="javascript:void(0)" onclick="App.switchView('development'); DevelopmentEngine.openTechSheet('${nextTech.id}', 'playlist', '${nextItem.data.id}')" style="color: var(--gold); text-decoration: underline;">#${nextItem.data.position} ${nextItem.data.title} (${nextItem.data.duration || 'Lesson'}) →</a>`;
                }
            }

            // Find next practical task
            const pendingTask = (nextTech.practicalTasks || []).find(t => devState.tasks[t.id]?.status !== 'SOLVED');
            if (practiceEl) {
                if (pendingTask) {
                    practiceEl.innerHTML = `<a href="javascript:void(0)" onclick="App.switchView('development'); DevelopmentEngine.openTechSheet('${nextTech.id}', 'tasks')" style="color: var(--text-sky); text-decoration: underline;">${pendingTask.title} (${pendingTask.difficulty}) →</a>`;
                } else {
                    practiceEl.textContent = 'Core practice tasks completed for current stage ✓';
                }
            }
        } else {
            titleEl.textContent = 'All Development Playlists & Foundations Completed! 🏆';
            if (watchEl) watchEl.textContent = 'All foundations and video modules mastered.';
            if (practiceEl) practiceEl.textContent = 'Ready for Full-Stack SaaS Capstone Project.';
        }

        // Revisit item
        if (revEl) {
            if (revisit.topics && revisit.topics.length > 0) {
                const r = revisit.topics[0];
                revEl.innerHTML = `<a href="javascript:void(0)" onclick="App.switchView('development'); DevelopmentEngine.openTechSheet('${r.techId}', 'playlist')" style="color: var(--amber); text-decoration: underline;">${r.techName}: ${r.title} →</a>`;
            } else if (revisit.videos.length > 0) {
                const r = revisit.videos[0];
                revEl.innerHTML = `<a href="javascript:void(0)" onclick="App.switchView('development'); DevelopmentEngine.openTechSheet('${r.techId}', 'playlist', '${r.id}')" style="color: var(--amber); text-decoration: underline;">${r.title} →</a>`;
            } else if (revisit.tasks.length > 0) {
                const t = revisit.tasks[0];
                revEl.innerHTML = `<a href="javascript:void(0)" onclick="App.switchView('development'); DevelopmentEngine.openTechSheet('${t.techId}', 'tasks')" style="color: var(--amber); text-decoration: underline;">${t.title} →</a>`;
            } else {
                revEl.textContent = 'Zero pending revisions (All clear ✓)';
            }
        }
    },

    renderRecipeWidget() {
        const todayStr = DateUtils.todayIST();
        const recipe = this.currentRecipeOverride || DateUtils.getRecipeForDate(todayStr);

        const nameEl = document.getElementById('widgetRecipeName');
        const timeEl = document.getElementById('widgetRecipeTime');
        const diffEl = document.getElementById('widgetRecipeDiff');
        const ingEl = document.getElementById('widgetRecipeIngredients');
        const stepsEl = document.getElementById('widgetRecipeSteps');

        if (nameEl) nameEl.textContent = recipe.name;
        if (timeEl) timeEl.textContent = recipe.cookTime;
        if (diffEl) diffEl.textContent = recipe.difficulty;

        if (ingEl) {
            ingEl.innerHTML = recipe.ingredients.map(i => `<li>${i}</li>`).join('');
        }
        if (stepsEl) {
            stepsEl.innerHTML = recipe.steps.map(s => `<li>${s}</li>`).join('');
        }
    },

    rollRandomRecipe() {
        const recipes = APP_CONFIG.POST_WORKOUT_RECIPES;
        const randomIdx = Math.floor(Math.random() * recipes.length);
        this.currentRecipeOverride = recipes[randomIdx];
        this.renderRecipeWidget();
        if (this.activeView === 'food') {
            if (typeof GymEngine !== 'undefined') {
                GymEngine.activeLifestyleTab = 'food';
                GymEngine.render();
            } else {
                this.renderFoodView();
            }
        }
        showToast(`Rolled recipe: ${this.currentRecipeOverride.name}`, 'info');
    },

    updateRecoveryBreadcrumb() {
        const todayStr = DateUtils.todayIST();
        const tasks = TaskEngine.getTasksForDate(todayStr);
        const interruptedTask = tasks.find(t => t.status === APP_CONFIG.TASK_STATUS.INTERRUPTED);
        const recoveryTask = tasks.find(t => t.category === APP_CONFIG.CATEGORIES.RECOVERY);
        const statusEl = document.getElementById('breadcrumbRecoveryStatus');
        const undoActionEl = document.getElementById('breadcrumbUndoAction');

        if (interruptedTask && recoveryTask) {
            const isDone = recoveryTask.status === APP_CONFIG.TASK_STATUS.COMPLETED;
            if (statusEl) {
                statusEl.innerHTML = `
                    <span style="color: var(--rose);">⚡ Interrupted (${interruptedTask.interruptReason})</span>
                    <span class="arrow">→</span>
                    <span class="highlight">College Recovery ${recoveryTask.startTime}</span>
                    <span class="arrow">→</span>
                    <span style="color: ${isDone ? 'var(--emerald)' : 'var(--amber)'}; font-weight: 700;">${isDone ? '✓ Completed' : 'Pending'}</span>
                `;
            }
            if (undoActionEl) undoActionEl.style.display = Store.lastInterruptionSnapshot ? 'inline-block' : 'none';
        } else {
            if (statusEl) statusEl.innerHTML = `<span style="color: var(--text-secondary);">Ready for study (06:45 AM)</span>`;
            if (undoActionEl) undoActionEl.style.display = 'none';
        }
    },

    renderTodayTimeline() {
        const container = document.getElementById('todayTimelineContainer');
        if (!container) return;
        const todayStr = DateUtils.todayIST();
        const tasks = TaskEngine.getTasksForDate(todayStr);

        if (tasks.length === 0) {
            container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 30px;">Generating routine...</div>`;
            return;
        }

        let html = '';
        tasks.forEach(task => {
            if (task.isBlock && task.category === APP_CONFIG.CATEGORIES.DSA) {
                return;
            }

            const isDone = task.status === APP_CONFIG.TASK_STATUS.COMPLETED;
            const isInterrupted = task.status === APP_CONFIG.TASK_STATUS.INTERRUPTED;
            const isRecovery = task.category === APP_CONFIG.CATEGORIES.RECOVERY;
            const isStudy = task.isStudy;

            let diffTag = '';
            let actionLinks = '';

            if (task.dsaProblemData) {
                const prob = task.dsaProblemData;
                const diff = (prob.difficulty || 'Medium').toLowerCase();
                diffTag = `<span class="difficulty-tag ${diff}">${prob.difficulty || 'Medium'}</span>`;

                if (prob.leetcode) {
                    actionLinks += `<a href="${prob.leetcode}" target="_blank" rel="noopener" class="btn-icon" title="Open on LeetCode">💻</a>`;
                }
                if (prob.article) {
                    actionLinks += `<a href="${prob.article}" target="_blank" rel="noopener" class="btn-icon" title="Open TakeUForward Article">📖</a>`;
                }
                if (prob.youtube) {
                    actionLinks += `<a href="${prob.youtube}" target="_blank" rel="noopener" class="btn-icon" title="Watch YouTube Solution">▶️</a>`;
                }
            }

            html += `
                <div class="task-card ${isStudy ? 'is-study' : ''} ${isRecovery ? 'is-recovery' : ''} ${isInterrupted ? 'is-interrupted' : ''} ${isDone ? 'is-completed' : ''}">
                    <div class="task-left">
                        <div class="task-time-box">${task.startTime} – ${task.endTime}</div>
                        <div class="task-main-info">
                            <div class="task-title-row">
                                <span class="task-title">${task.title}</span>
                                ${diffTag}
                                ${isRecovery ? `<span class="task-rescheduled-badge">⚠️ Rescheduled Recovery Slot</span>` : ''}
                                ${isInterrupted ? `<span class="task-rescheduled-badge" style="color: var(--rose); background: rgba(244, 63, 94, 0.12); border-color: rgba(244, 63, 94, 0.3);">⚡ Interrupted (${task.interruptReason})</span>` : ''}
                            </div>
                            <div class="task-meta">
                                <span>Category: <b>${task.category}</b></span>
                                ${task.notes ? `<span>· ${task.notes}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="task-right">
                        <div class="task-actions">
                            ${actionLinks}
                            <button class="btn-check ${isDone ? 'done' : ''}"
                                    onclick="App.toggleTaskDone('${todayStr}', '${task.id}')"
                                    title="${isDone ? 'Mark Incomplete' : 'Mark Completed'}">
                                ${isDone ? '✓' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    toggleTaskDone(dateStr, taskId) {
        const dayData = Store.getDayData(dateStr);
        const task = (dayData.tasks || []).find(t => t.id === taskId);
        if (!task) return;

        const newStatus = task.status === APP_CONFIG.TASK_STATUS.COMPLETED
            ? APP_CONFIG.TASK_STATUS.NOT_STARTED
            : APP_CONFIG.TASK_STATUS.COMPLETED;

        TaskEngine.updateTaskStatus(dateStr, taskId, newStatus);
        this.renderDashboard();
        if (DayModal.currentDate === dateStr) {
            DayModal.renderTasks();
        }
        showToast(`Task "${task.title}" marked as ${newStatus}!`, 'success');
    },

    onModalTaskStatusChange(dateStr, taskId, newStatus) {
        TaskEngine.updateTaskStatus(dateStr, taskId, newStatus);
        DayModal.renderTasks();
        this.renderDashboard();
        CalendarEngine.render();
        this.invalidateView('stats');
    },

    async handleInterruption(reason) {
        const result = TaskEngine.handleInterruption(reason);
        this.renderDashboard();
        CalendarEngine.render();
        this.invalidateView('stats');

        // Connect with AI Adaptive Rescheduling (Part 6)
        if (typeof AIEngine !== 'undefined' && result.interruptedTask) {
            AIEngine.requestAdaptiveReschedule(reason, result.interruptedTask).then(aiAdvice => {
                if (aiAdvice && aiAdvice.recommendation) {
                    showToast(`🤖 AI Advice: ${aiAdvice.recommendation}`, 'info');
                }
            });
        }

        if (result.canUndo) {
            showToast(result.message, 'warning', () => this.undoInterruption());
        } else {
            showToast(result.message, 'info');
        }
    },

    undoInterruption() {
        const res = TaskEngine.undoLastInterruption();
        this.renderDashboard();
        CalendarEngine.render();
        if (DayModal.currentDate) DayModal.renderTasks();
        showToast(res.message, res.success ? 'success' : 'warning');
    },

    removeInterruptionFromTask(dateStr, taskId) {
        if (confirm('Remove interruption and reset this task to original morning schedule?')) {
            TaskEngine.removeInterruptionForTask(dateStr, taskId);
            this.renderDashboard();
            CalendarEngine.render();
            if (DayModal.currentDate) DayModal.renderTasks();
            showToast('Interruption removed. Original schedule restored!', 'success');
        }
    },

    saveCustomTask() {
        const title = document.getElementById('inputTaskTitle').value.trim();
        if (!title) {
            alert('Please enter a task title');
            return;
        }

        const category = document.getElementById('inputTaskCategory').value;
        const startTime = document.getElementById('inputTaskStart').value || '15:00';
        const endTime = document.getElementById('inputTaskEnd').value || '16:00';
        const notes = document.getElementById('inputTaskNotes').value.trim();
        const targetDate = DayModal.currentDate || DateUtils.todayIST();

        TaskEngine.addCustomTask(targetDate, {
            title,
            category,
            startTime,
            endTime,
            isStudy: true,
            notes
        });

        document.getElementById('customTaskModal').classList.remove('active');
        document.getElementById('inputTaskTitle').value = '';
        document.getElementById('inputTaskNotes').value = '';

        this.renderDashboard();
        if (DayModal.currentDate) DayModal.renderTasks();
        showToast(`Custom task added to ${DateUtils.formatDateShort(targetDate)}!`, 'success');
    },

    // ----------------------------------------------------
    // DSA A2Z View
    // ----------------------------------------------------
    renderDsaView() {
        const stats = DSAEngine.getStats();
        const sections = DSAEngine.getSectionProgress();

        const heroSolved = document.getElementById('dsaHeroSolvedLabel');
        const heroPct = document.getElementById('dsaHeroPctLabel');
        const heroFill = document.getElementById('dsaHeroBarFill');

        if (heroSolved) heroSolved.textContent = `${stats.solved} / ${stats.total} Solved`;
        if (heroPct) heroPct.textContent = `${stats.percent}%`;
        if (heroFill) heroFill.style.width = `${stats.percent}%`;

        const accordion = document.getElementById('dsaTopicAccordion');
        if (!accordion) return;

        let html = '';
        sections.forEach((section, sIdx) => {
            const isOpen = sIdx === 0;
            html += `
                <div class="topic-section-card ${isOpen ? 'open' : ''}" id="section-card-${sIdx}" data-section-idx="${sIdx}">
                    <div class="topic-section-head" onclick="App.toggleDsaSection(${sIdx})">
                        <div class="topic-head-left">
                            <div class="topic-num-badge">${sIdx + 1}</div>
                            <div class="topic-name">${section.name}</div>
                        </div>
                        <div class="topic-head-right">
                            <span class="topic-count" id="section-count-${sIdx}">${section.solved} / ${section.total} (${section.percent}%)</span>
                            <span style="font-size: 11px; color: var(--text-muted);">▾</span>
                        </div>
                    </div>
                    <div class="topic-section-body" id="section-body-${sIdx}" data-loaded="${isOpen ? 'true' : 'false'}">
                        ${isOpen ? this.renderDsaSectionBodyHtml(section) : ''}
                    </div>
                </div>
            `;
        });

        accordion.innerHTML = html;

        // Attach event delegation once
        if (!accordion._delegationAttached) {
            accordion.addEventListener('change', (e) => {
                const select = e.target.closest('.status-select[data-problem-id]');
                if (select) {
                    const problemId = select.getAttribute('data-problem-id');
                    const newStatus = select.value;
                    this.onDsaProblemStatusChange(problemId, newStatus, select);
                }
            });
            accordion._delegationAttached = true;
        }
    },

    renderDsaSectionBodyHtml(section) {
        if (!section || !Array.isArray(section.subcategories)) return '';
        return section.subcategories.map(sub => `
            <div class="subcategory-group">
                <div class="subcategory-title">${sub.name} (${sub.solved}/${sub.total})</div>
                <table class="problem-table">
                    <tbody>
                        ${sub.problems.map(prob => {
                            const diff = (prob.difficulty || 'Medium').toLowerCase();
                            return `
                                <tr class="problem-row" data-problem-id="${prob.id}">
                                    <td style="width: 50%;">
                                        <div class="prob-name">${prob.name}</div>
                                    </td>
                                    <td style="width: 15%;">
                                        <span class="difficulty-tag ${diff}">${prob.difficulty || 'Medium'}</span>
                                    </td>
                                    <td style="width: 20%;">
                                        <div class="prob-links">
                                            ${prob.leetcode ? `<a href="${prob.leetcode}" target="_blank" rel="noopener" class="prob-link-btn">LeetCode ↗</a>` : ''}
                                            ${prob.article ? `<a href="${prob.article}" target="_blank" rel="noopener" class="prob-link-btn">Article ↗</a>` : ''}
                                            ${prob.youtube ? `<a href="${prob.youtube}" target="_blank" rel="noopener" class="prob-link-btn">Video ↗</a>` : ''}
                                        </div>
                                    </td>
                                    <td style="width: 15%; text-align: right;">
                                        <select class="status-select ${prob.status.toLowerCase()}" data-problem-id="${prob.id}">
                                            <option value="NOT_STARTED" ${prob.status === 'NOT_STARTED' ? 'selected' : ''}>Not Started</option>
                                            <option value="IN_PROGRESS" ${prob.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                                            <option value="SOLVED" ${prob.status === 'SOLVED' ? 'selected' : ''}>Solved ✓</option>
                                            <option value="REVISIT" ${prob.status === 'REVISIT' ? 'selected' : ''}>Revisit 🔄</option>
                                        </select>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');
    },

    toggleDsaSection(sIdx) {
        const card = document.getElementById(`section-card-${sIdx}`);
        const body = document.getElementById(`section-body-${sIdx}`);
        if (!card || !body) return;

        const isCurrentlyOpen = card.classList.contains('open');
        if (isCurrentlyOpen) {
            card.classList.remove('open');
            body.innerHTML = '';
            body.setAttribute('data-loaded', 'false');
        } else {
            card.classList.add('open');
            if (body.getAttribute('data-loaded') !== 'true') {
                const secData = DSAEngine.getSectionProgressByIndex(sIdx);
                if (secData) {
                    body.innerHTML = this.renderDsaSectionBodyHtml(secData);
                    body.setAttribute('data-loaded', 'true');
                }
            }
        }
    },

    onDsaProblemStatusChange(problemId, newStatus, selectElement = null) {
        DSAEngine.setProblemStatus(problemId, newStatus);

        let select = selectElement;
        let row = select ? select.closest('.problem-row') : null;
        if (!row) {
            row = document.querySelector(`.problem-row[data-problem-id="${problemId}"]`);
            if (row && !select) {
                select = row.querySelector('.status-select');
            }
        }

        if (select) {
            select.value = newStatus;
            select.className = `status-select ${newStatus.toLowerCase()}`;
        }

        // Update affected section header count & subcategory title
        let card = row ? row.closest('.topic-section-card') : null;
        let sIdx = card ? parseInt(card.getAttribute('data-section-idx'), 10) : null;
        if (sIdx !== null && !isNaN(sIdx)) {
            const secData = DSAEngine.getSectionProgressByIndex(sIdx);
            if (secData) {
                const countEl = document.getElementById(`section-count-${sIdx}`);
                if (countEl) {
                    countEl.textContent = `${secData.solved} / ${secData.total} (${secData.percent}%)`;
                }
                const subGroup = row ? row.closest('.subcategory-group') : null;
                if (subGroup) {
                    const subTitle = subGroup.querySelector('.subcategory-title');
                    const subData = secData.subcategories.find(s => subTitle && subTitle.textContent.startsWith(s.name));
                    if (subTitle && subData) {
                        subTitle.textContent = `${subData.name} (${subData.solved}/${subData.total})`;
                    }
                }
            }
        }

        // Update hero counters
        const stats = DSAEngine.getStats();
        const heroSolved = document.getElementById('dsaHeroSolvedLabel');
        const heroPct = document.getElementById('dsaHeroPctLabel');
        const heroFill = document.getElementById('dsaHeroBarFill');

        if (heroSolved) heroSolved.textContent = `${stats.solved} / ${stats.total} Solved`;
        if (heroPct) heroPct.textContent = `${stats.percent}%`;
        if (heroFill) heroFill.style.width = `${stats.percent}%`;

        // Update dashboard only if active view is dashboard
        if (this.activeView === 'today') {
            this.renderDashboard();
        } else {
            const metricDsaRatio = document.getElementById('metricDsaRatio');
            if (metricDsaRatio) metricDsaRatio.textContent = `${stats.solved} / ${stats.total}`;
        }

        this.invalidateView('stats');
        this.invalidateView('calendar');

        if (typeof showToast === 'function') {
            showToast('Problem progress updated!', 'success');
        }
    },

    // ----------------------------------------------------
    // Food / Kitchen View
    // ----------------------------------------------------
    renderFoodView() {
        const todayStr = DateUtils.todayIST();
        const recipe = this.currentRecipeOverride || DateUtils.getRecipeForDate(todayStr);

        const nameEl = document.getElementById('foodViewRecipeName');
        const timeEl = document.getElementById('foodViewRecipeTime');
        const diffEl = document.getElementById('foodViewRecipeDiff');
        const ingEl = document.getElementById('foodViewRecipeIngredients');
        const stepsEl = document.getElementById('foodViewRecipeSteps');

        if (nameEl) nameEl.textContent = recipe.name;
        if (timeEl) timeEl.textContent = recipe.cookTime;
        if (diffEl) diffEl.textContent = recipe.difficulty;

        if (ingEl) {
            ingEl.innerHTML = recipe.ingredients.map(i => `<li>${i}</li>`).join('');
        }
        if (stepsEl) {
            stepsEl.innerHTML = recipe.steps.map(s => `<li>${s}</li>`).join('');
        }

        // Render catalog grid of all recipes
        const catalogGrid = document.getElementById('allRecipesCatalogGrid');
        if (catalogGrid) {
            catalogGrid.innerHTML = APP_CONFIG.POST_WORKOUT_RECIPES.map(r => `
                <div class="placement-topic-card" style="cursor: pointer;" onclick="App.currentRecipeOverride = APP_CONFIG.POST_WORKOUT_RECIPES.find(x => x.id === '${r.id}'); App.renderFoodView(); App.renderRecipeWidget(); showToast('Selected ${r.name}!', 'info');">
                    <div class="topic-icon">🥣</div>
                    <div class="topic-info">
                        <h4>${r.name}</h4>
                        <p>⏱ ${r.cookTime} · ${r.difficulty}</p>
                    </div>
                </div>
            `).join('');
        }
    },

    // ----------------------------------------------------
    // Settings Modal & Gemini API Testing
    // ----------------------------------------------------
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    maskSecrets(str) {
        if (!str) return '';
        return String(str)
            .replace(/key=[^&\s"']+/gi, 'key=[REDACTED]')
            .replace(/(AIza[0-9A-Za-z-_]{4})[0-9A-Za-z-_]{27}([0-9A-Za-z-_]{4})/g, '$1••••••••$2')
            .replace(/(AQ\.[0-9A-Za-z-_]{4})[0-9A-Za-z-_]{30,}([0-9A-Za-z-_]{4})/g, '$1••••••••$2');
    },

    getAuthToken() {
        if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
            const jwt = SupabaseService.getAccessToken();
            if (jwt) return jwt;
        }
        let token = localStorage.getItem('studyos_auth_token');
        if (!token || token.length < 16) {
            token = 'usr_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : (Math.random().toString(36).slice(2) + Date.now().toString(36)));
            localStorage.setItem('studyos_auth_token', token);
        }
        return token;
    },

    async safeFetchJson(url, options = {}) {
        const token = this.getAuthToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': token,
            ...(options.headers || {})
        };
        options.headers = headers;

        let response;
        try {
            response = await fetch(url, options);
        } catch (netErr) {
            return {
                ok: false,
                status: 0,
                data: {
                    success: false,
                    connected: false,
                    errorType: 'NETWORK_ERROR',
                    errorCategory: 'Network failure',
                    message: 'Unable to reach StudyOS AI backend',
                    details: netErr.message || 'Network connection failed',
                    status: 0
                }
            };
        }

        let rawText = '';
        try {
            rawText = await response.text();
        } catch (readErr) {
            return {
                ok: false,
                status: response.status,
                data: {
                    success: false,
                    connected: false,
                    errorType: 'READ_ERROR',
                    errorCategory: 'Network/server error',
                    message: 'Gemini connection service returned an invalid response.',
                    details: readErr.message,
                    status: response.status
                }
            };
        }

        if (!rawText || !rawText.trim()) {
            return {
                ok: false,
                status: response.status,
                data: {
                    success: false,
                    connected: false,
                    errorType: 'EMPTY_RESPONSE',
                    errorCategory: 'Network/server error',
                    message: 'Gemini connection service returned an invalid response.',
                    details: `HTTP ${response.status} returned empty body`,
                    status: response.status
                }
            };
        }

        try {
            const parsed = JSON.parse(rawText);
            return {
                ok: response.ok,
                status: response.status,
                data: parsed
            };
        } catch (parseErr) {
            return {
                ok: false,
                status: response.status,
                data: {
                    success: false,
                    connected: false,
                    errorType: 'INVALID_RESPONSE',
                    errorCategory: 'Invalid server response',
                    message: 'Gemini connection service returned an invalid response.',
                    details: rawText.length > 250 ? rawText.slice(0, 250) + '...' : rawText,
                    status: response.status
                }
            };
        }
    },

    openSettingsModal(tab = 'ai') {
        const notifModal = document.getElementById('notifSettingsModal');
        if (!notifModal) return;

        this.switchSettingsTab(tab);

        // Populate notification settings
        const settings = (typeof Store !== 'undefined' && Store.getSettings) ? Store.getSettings() : {};
        if (document.getElementById('checkNotifyDsa')) document.getElementById('checkNotifyDsa').checked = settings.notifyDsa ?? true;
        if (document.getElementById('checkNotifyDev')) document.getElementById('checkNotifyDev').checked = settings.notifyDev ?? true;
        if (document.getElementById('checkNotifyAiPlan')) document.getElementById('checkNotifyAiPlan').checked = settings.notifyAiPlan ?? true;
        if (document.getElementById('checkNotifyCreatine')) document.getElementById('checkNotifyCreatine').checked = settings.notifyCreatine ?? true;

        this.fetchGeminiStatus();
        notifModal.classList.add('active');
    },

    switchSettingsTab(tab = 'ai') {
        const tabs = ['ai', 'notif', 'privacy'];
        tabs.forEach(t => {
            const btn = document.getElementById(`btnSettingsTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const sec = document.getElementById(`settingsSection${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (btn) btn.classList.toggle('active', t === tab);
            if (sec) {
                if (t === tab) {
                    sec.style.display = 'block';
                    sec.classList.add('active');
                } else {
                    sec.style.display = 'none';
                    sec.classList.remove('active');
                }
            }
        });
    },

    toggleGeminiKeyVis() {
        const input = document.getElementById('inputGeminiKey');
        const btn = document.getElementById('btnToggleKeyVis');
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            if (btn) btn.textContent = '🔒';
        } else {
            input.type = 'password';
            if (btn) btn.textContent = '👁️';
        }
    },

    toggleReplaceKeyMode(show) {
        const inputForm = document.getElementById('geminiInputForm');
        const cancelBtn = document.getElementById('btnCancelReplaceKey');
        const inputPrompt = document.getElementById('geminiInputPrompt');
        const inputKey = document.getElementById('inputGeminiKey');
        if (!inputForm) return;

        if (show) {
            inputForm.style.display = 'block';
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (inputPrompt) inputPrompt.textContent = 'Enter replacement Gemini API key (existing key stays safe until new key passes verification):';
            if (inputKey) {
                inputKey.value = '';
                inputKey.focus();
            }
        } else {
            inputForm.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    },

    async fetchGeminiStatus() {
        const pill = document.getElementById('geminiConnectionPill');
        const pillText = document.getElementById('geminiStatusBadgeText');
        const configBadge = document.getElementById('geminiConfigBadge');
        const configBadgeText = document.getElementById('geminiConfigBadgeText');
        const configuredBox = document.getElementById('geminiConfiguredBox');
        const inputForm = document.getElementById('geminiInputForm');
        const maskedCode = document.getElementById('geminiMaskedKeyDisplay');

        const metaModel = document.getElementById('metaModel');
        const metaLatency = document.getElementById('metaLatency');
        const metaLastChecked = document.getElementById('metaLastChecked');
        const metaLastError = document.getElementById('metaLastError');

        let res = await this.safeFetchJson('/api/ai/credentials');
        if (!res.ok && res.status === 404) {
            res = await this.safeFetchJson('/.netlify/functions/gemini?action=credentials');
        }

        const d = res.data;

        if (d && d.success && d.configured) {
            if (configBadge) configBadge.className = 'byok-status-badge configured';
            if (configBadgeText) configBadgeText.textContent = 'Configured';
            if (configuredBox) configuredBox.style.display = 'block';
            if (inputForm) inputForm.style.display = 'none';
            if (maskedCode) maskedCode.textContent = d.maskedKey || '••••••••••••••••';

            if (pill && pillText) {
                if (d.connected) {
                    pill.className = 'gemini-connection-pill connected';
                    pillText.textContent = 'Connected';
                } else {
                    pill.className = 'gemini-connection-pill not-connected';
                    pillText.textContent = 'Not Connected';
                }
            }

            if (metaModel) metaModel.textContent = d.model || 'gemini-flash-latest';
            if (metaLatency) metaLatency.textContent = d.latencyMs ? `${d.latencyMs} ms` : '--';
            if (metaLastChecked) metaLastChecked.textContent = d.lastChecked ? new Date(d.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' }) : 'Never';
            if (metaLastError) metaLastError.textContent = d.lastError || 'None';
        } else {
            if (configBadge) configBadge.className = 'byok-status-badge not-configured';
            if (configBadgeText) configBadgeText.textContent = 'Not Configured';
            if (configuredBox) configuredBox.style.display = 'none';
            if (inputForm) inputForm.style.display = 'block';
            if (maskedCode) maskedCode.textContent = 'None configured';

            if (pill && pillText) {
                pill.className = 'gemini-connection-pill not-connected';
                pillText.textContent = 'Not Connected';
            }

            if (metaModel) metaModel.textContent = '--';
            if (metaLatency) metaLatency.textContent = '--';
            if (metaLastChecked) metaLastChecked.textContent = 'Never';
            if (metaLastError) metaLastError.textContent = 'None';
        }
    },

    async saveAndTestGeminiKey() {
        const input = document.getElementById('inputGeminiKey');
        const btn = document.getElementById('btnSaveAndTestKey');
        const label = document.getElementById('btnSaveTestLabel');
        const icon = document.getElementById('btnSaveTestIcon');

        if (!input || !input.value.trim()) {
            if (typeof showToast === 'function') {
                showToast('Please enter your Gemini API key before testing.', 'warning');
            } else {
                alert('Please enter your Gemini API key.');
            }
            return;
        }

        const candidateKey = input.value.trim();

        if (btn) btn.disabled = true;
        if (label) label.textContent = 'Testing & Saving...';
        if (icon) icon.textContent = '⏳';

        try {
            let res = await this.safeFetchJson('/api/ai/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'gemini', apiKey: candidateKey })
            });

            if (!res.ok && res.status === 404) {
                res = await this.safeFetchJson('/.netlify/functions/gemini?action=credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider: 'gemini', apiKey: candidateKey })
                });
            }

            const d = res.data;

            if (d && d.success && d.configured) {
                input.value = '';
                this.toggleReplaceKeyMode(false);
                if (typeof showToast === 'function') {
                    showToast('✅ API key configuration saved', 'success');
                }
                this.renderGeminiTestResult(d, res.status);
                await this.fetchGeminiStatus();
                if (typeof AIEngine !== 'undefined' && AIEngine.checkStatus) {
                    AIEngine.checkStatus();
                }
            } else {
                const failMsg = d?.message || 'Gemini API key verification failed.';
                if (typeof showToast === 'function') {
                    showToast(`❌ Could not save server configuration: ${failMsg}`, 'error');
                }
                this.renderGeminiTestResult(d, res.status);
            }
        } catch (err) {
            this.renderGeminiTestResult({
                success: false,
                connected: false,
                errorType: 'CLIENT_ERROR',
                errorCategory: 'Client failure',
                message: 'Gemini connection service returned an invalid response.',
                details: err.message,
                status: 0,
                timestamp: new Date().toISOString()
            }, 0);
        } finally {
            if (btn) btn.disabled = false;
            if (label) label.textContent = 'Save & Test Connection';
            if (icon) icon.textContent = '⚡';
        }
    },

    async testGeminiConnection() {
        const btnTest = document.getElementById('btnTestConfiguredKey') || document.getElementById('btnSaveAndTestKey');
        const resultBox = document.getElementById('geminiTestResultBox');
        const inputKey = document.getElementById('inputGeminiKey');

        const candidateKey = inputKey ? inputKey.value.trim() : '';

        if (btnTest) {
            btnTest.disabled = true;
            btnTest.dataset.oldText = btnTest.innerHTML;
            btnTest.innerHTML = '⏳ Testing Gemini...';
        }

        if (resultBox) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div class="gemini-result-card loading">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">⏳</span>
                        <span style="font-size: 13px; font-weight: 600; color: #fff;">Testing Gemini connection with Google Generative AI servers...</span>
                    </div>
                </div>
            `;
        }

        try {
            const body = {};
            if (candidateKey) {
                body.apiKey = candidateKey;
            }

            let res = await this.safeFetchJson('/api/ai/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok && res.status === 404) {
                res = await this.safeFetchJson('/.netlify/functions/gemini?action=test-connection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }

            this.renderGeminiTestResult(res.data, res.status);
            await this.fetchGeminiStatus();
        } catch (err) {
            this.renderGeminiTestResult({
                success: false,
                connected: false,
                errorType: 'CLIENT_ERROR',
                errorCategory: 'Client failure',
                message: 'Gemini connection service returned an invalid response.',
                details: err.message,
                status: 0,
                timestamp: new Date().toISOString()
            }, 0);
        } finally {
            if (btnTest) {
                btnTest.disabled = false;
                btnTest.innerHTML = btnTest.dataset.oldText || '⚡ Test Connection';
            }
        }
    },

    async removeGeminiKey() {
        if (!confirm('Are you sure you want to remove your Gemini API key from StudyOS? AI features will be disabled until a key is added.')) {
            return;
        }

        try {
            let res = await this.safeFetchJson('/api/ai/credentials', {
                method: 'DELETE'
            });

            if (!res.ok && res.status === 404) {
                res = await this.safeFetchJson('/.netlify/functions/gemini?action=credentials', {
                    method: 'DELETE'
                });
            }

            if (typeof showToast === 'function') {
                showToast('🔴 Gemini Key Removed. AI Disconnected.', 'info');
            }

            const resultBox = document.getElementById('geminiTestResultBox');
            if (resultBox) resultBox.style.display = 'none';

            await this.fetchGeminiStatus();
            if (typeof AIEngine !== 'undefined' && AIEngine.checkStatus) {
                AIEngine.checkStatus();
            }
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast('Failed to remove key: ' + err.message, 'error');
            } else {
                alert('Failed to remove key: ' + err.message);
            }
        }
    },

    renderGeminiTestResult(data, httpStatus = null) {
        const resultBox = document.getElementById('geminiTestResultBox');
        const pill = document.getElementById('geminiConnectionPill');
        const pillText = document.getElementById('geminiStatusBadgeText');
        const maskedCode = document.getElementById('geminiMaskedKeyDisplay');

        if (!resultBox) return;
        resultBox.style.display = 'block';

        const timestampStr = data.timestamp || new Date().toISOString();
        const formattedTime = new Date(timestampStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' });
        const isSuccess = !!(data.success || data.connected);
        const latency = data.latencyMs ?? data.responseTimeMs ?? '--';
        const modelName = data.model || 'gemini-flash-latest';
        const statusDisplay = httpStatus || data.status || (isSuccess ? 200 : 400);

        if (isSuccess) {
            if (pill) pill.className = 'gemini-connection-pill connected';
            if (pillText) pillText.textContent = 'Connected';
            if (data.maskedKey && maskedCode) maskedCode.textContent = data.maskedKey;

            resultBox.innerHTML = `
                <div class="gemini-result-card success">
                    <div class="gemini-result-title">
                        <span>🟢</span>
                        <span>Gemini Connected</span>
                    </div>
                    <div class="gemini-result-details">
                        <div class="gemini-detail-row">
                            <span class="detail-label">Model:</span>
                            <span class="detail-val mono">${this.escapeHtml(modelName)}</span>
                        </div>
                        <div class="gemini-detail-row">
                            <span class="detail-label">Response time:</span>
                            <span class="detail-val highlight">${latency} ms</span>
                        </div>
                        <div class="gemini-detail-row">
                            <span class="detail-label">Last checked:</span>
                            <span class="detail-val">${formattedTime}</span>
                        </div>
                    </div>

                    <!-- Collapsible Technical Details -->
                    <details class="gemini-tech-details" style="margin-top: 12px; border-top: 1px solid rgba(16, 185, 129, 0.25); padding-top: 8px;">
                        <summary style="font-size: 11.5px; color: var(--text-muted); cursor: pointer; user-select: none; font-weight: 600;">
                            🔍 Technical Details
                        </summary>
                        <div style="margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(0,0,0,0.45); padding: 10px 12px; border-radius: var(--radius-sm); line-height: 1.6; color: var(--text-secondary); word-break: break-all;">
                            <div><b>HTTP Status:</b> ${statusDisplay}</div>
                            <div><b>Endpoint:</b> /api/ai/test-connection</div>
                            <div><b>Provider:</b> Google Gemini</div>
                            <div><b>Model:</b> ${this.escapeHtml(modelName)}</div>
                            <div><b>Latency:</b> ${latency} ms</div>
                            <div><b>Security:</b> AES-256-GCM Encrypted</div>
                            <div><b>Timestamp:</b> ${timestampStr}</div>
                        </div>
                    </details>
                </div>
            `;
            if (typeof showToast === 'function') {
                showToast('🟢 Gemini Connected & Verified!', 'success');
            }
        } else {
            if (pill) pill.className = 'gemini-connection-pill not-connected';
            if (pillText) pillText.textContent = 'Not Connected';

            const errCategory = data.errorCategory || 'Connection failed';
            const safeMsg = data.message || 'Gemini connection failed';
            const errorType = data.errorType || 'UNKNOWN_ERROR';
            const technicalDetails = this.maskSecrets(data.details || safeMsg);

            resultBox.innerHTML = `
                <div class="gemini-result-card failure">
                    <div class="gemini-result-title">
                        <span>🔴</span>
                        <span>Gemini Connection Failed</span>
                    </div>
                    <div class="gemini-result-details">
                        <div class="gemini-error-category-pill">${this.escapeHtml(errCategory)}</div>
                        <p class="gemini-error-description">${this.escapeHtml(safeMsg)}</p>
                        <div class="gemini-detail-row" style="margin-top: 8px;">
                            <span class="detail-label">Status:</span>
                            <span class="detail-val" style="color: var(--rose);">HTTP ${statusDisplay}</span>
                        </div>
                        <div class="gemini-detail-row">
                            <span class="detail-label">Last checked:</span>
                            <span class="detail-val">${formattedTime}</span>
                        </div>
                    </div>

                    <!-- Collapsible Technical Details -->
                    <details class="gemini-tech-details" style="margin-top: 12px; border-top: 1px solid rgba(244, 63, 94, 0.25); padding-top: 8px;">
                        <summary style="font-size: 11.5px; color: var(--text-muted); cursor: pointer; user-select: none; font-weight: 600;">
                            🔍 Technical Details
                        </summary>
                        <div style="margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(0,0,0,0.45); padding: 10px 12px; border-radius: var(--radius-sm); line-height: 1.6; color: var(--text-secondary); word-break: break-all;">
                            <div><b>HTTP Status:</b> ${statusDisplay}</div>
                            <div><b>Endpoint:</b> /api/ai/test-connection</div>
                            <div><b>Provider:</b> Google Gemini</div>
                            <div><b>Error Type:</b> ${this.escapeHtml(errorType)}</div>
                            <div><b>Category:</b> ${this.escapeHtml(errCategory)}</div>
                            <div><b>Diagnostics:</b> ${this.escapeHtml(technicalDetails)}</div>
                            <div><b>Timestamp:</b> ${timestampStr}</div>
                        </div>
                    </details>
                </div>
            `;
            if (typeof showToast === 'function') {
                showToast(`🔴 Gemini Connection Failed: ${safeMsg}`, 'error');
            }
        }
    },

    // ----------------------------------------------------
    // Placement View
    // ----------------------------------------------------
    renderPlacementView() {
        this.checkPlacementState();

        if (typeof PlacementEngine !== 'undefined') {
            PlacementEngine.renderPlacementView();
            return;
        }

        const grid = document.getElementById('placementTopicsGrid');
        if (!grid) return;

        grid.innerHTML = APP_CONFIG.PLACEMENT_TOPICS.map(t => `
            <div class="placement-topic-card">
                <div class="topic-icon">${t.icon}</div>
                <div class="topic-info">
                    <h4>${t.name}</h4>
                    <p>${t.description}</p>
                </div>
            </div>
        `).join('');
    },

    checkPlacementState() {
        const placement = Store.getPlacement();
        const celebrationBanner = document.getElementById('placementCelebrationBanner');
        const normalHero = document.getElementById('placementNormalHero');
        const placedDetails = document.getElementById('placedDetailsContainer');
        const sidebarSub = document.getElementById('sidebarGoalSub');

        if (placement.achieved) {
            if (celebrationBanner) celebrationBanner.style.display = 'block';
            if (normalHero) normalHero.style.display = 'none';
            if (placedDetails) {
                placedDetails.innerHTML = `
                    <span>Company: <b>${placement.company}</b></span>
                    <span>Role: <b>${placement.role}</b></span>
                    ${placement.packageVal ? `<span>Package: <b>${placement.packageVal}</b></span>` : ''}
                    <span>Placed Date: <b>${DateUtils.formatDateLong(placement.placedDate)}</b></span>
                `;
            }
            if (sidebarSub) sidebarSub.textContent = `ACHIEVED: ${placement.company} 🎉`;
        } else {
            if (celebrationBanner) celebrationBanner.style.display = 'none';
            if (normalHero) normalHero.style.display = 'flex';
            if (sidebarSub) sidebarSub.textContent = 'DSA + Full-Stack + FAANG/PBC';
        }
    },

    confirmPlacementAchieved() {
        const company = document.getElementById('inputPlacedCompany').value.trim() || 'Top Tier Tech';
        const role = document.getElementById('inputPlacedRole').value.trim() || 'Software Development Engineer';
        const packageVal = document.getElementById('inputPlacedPackage').value.trim();
        const note = document.getElementById('inputPlacedNote').value.trim();

        Store.setPlacementAchieved({
            company,
            role,
            packageVal,
            note,
            placedDate: DateUtils.todayIST()
        });

        document.getElementById('placementConfirmModal').classList.remove('active');
        this.renderPlacementView();
        CalendarEngine.render();
        showToast('🎉 CONGRATULATIONS BOSS! Placement Achieved!', 'success');
    },

    // ----------------------------------------------------
    // Internship Tracker View
    // ----------------------------------------------------
    renderInternshipView() {
        const tbody = document.getElementById('internshipTableBody');
        if (!tbody) return;
        const apps = Store.getInternships();

        if (apps.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No internship applications tracked yet. Click "＋ Add Application" to start.</td></tr>`;
            return;
        }

        tbody.innerHTML = apps.map(app => `
            <tr>
                <td><b>${app.company}</b></td>
                <td>${app.role}</td>
                <td>${DateUtils.formatDateShort(app.dateApplied)}</td>
                <td>
                    <span class="intern-status-badge ${app.status}">${app.status}</span>
                </td>
                <td>
                    ${app.link ? `<a href="${app.link}" target="_blank" rel="noopener" class="prob-link-btn">Link ↗</a>` : '—'}
                </td>
                <td style="color: var(--text-secondary);">${app.notes || '—'}</td>
                <td>
                    <button class="action-btn-ghost danger" style="padding: 4px 8px; font-size: 11px;" onclick="App.deleteInternship('${app.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    saveInternship() {
        const company = document.getElementById('inputInternCompany').value.trim();
        if (!company) {
            alert('Please enter company name');
            return;
        }
        const role = document.getElementById('inputInternRole').value.trim();
        const dateApplied = document.getElementById('inputInternDate').value;
        const status = document.getElementById('inputInternStatus').value;
        const link = document.getElementById('inputInternLink').value.trim();
        const notes = document.getElementById('inputInternNotes').value.trim();

        Store.addInternship({ company, role, dateApplied, status, link, notes });

        document.getElementById('internshipModal').classList.remove('active');
        document.getElementById('inputInternCompany').value = '';
        document.getElementById('inputInternNotes').value = '';
        this.renderInternshipView();
        showToast(`Added ${company} application!`, 'success');
    },

    deleteInternship(id) {
        if (confirm('Delete this application?')) {
            Store.deleteInternship(id);
            this.renderInternshipView();
        }
    },

    // ----------------------------------------------------
    // Stats View
    // ----------------------------------------------------
    renderStatsView() {
        const streak = TaskEngine.calculateStreak();
        const dsaStats = DSAEngine.getStats();

        const { studyDaysCount, devCount } = TaskEngine.getOverallStudyAndDevDays();

        const statsBestStreak = document.getElementById('statsBestStreak');
        const statsDsaSolved = document.getElementById('statsDsaSolved');
        const statsDsaSub = document.getElementById('statsDsaSub');
        const statsStudyDays = document.getElementById('statsStudyDays');
        const statsAiSessions = document.getElementById('statsAiSessions');

        if (statsBestStreak) statsBestStreak.textContent = streak;
        if (statsDsaSolved) statsDsaSolved.textContent = `${dsaStats.solved} / ${dsaStats.total}`;
        if (statsDsaSub) statsDsaSub.textContent = `${dsaStats.easySolved} Easy · ${dsaStats.mediumSolved} Med · ${dsaStats.hardSolved} Hard`;
        if (statsStudyDays) statsStudyDays.textContent = studyDaysCount;
        if (statsAiSessions) statsAiSessions.textContent = devCount;

        // ----------------------------------------------------
        // Authentic Study Session Metrics & History (Part 13)
        // ----------------------------------------------------
        const studySessions = Store.getStudySessions();
        const statsTotalStudy = document.getElementById('statsTotalStudyTime');
        const statsTotalCount = document.getElementById('statsTotalSessionsCount');
        const statsAvgSession = document.getElementById('statsAvgSessionTime');
        const statsLongestSession = document.getElementById('statsLongestSessionTime');
        const statsBreakRatio = document.getElementById('statsBreakRatio');
        const statsTotalBreak = document.getElementById('statsTotalBreakTime');
        const statsTopCat = document.getElementById('statsTopCategory');
        const statsCatSpread = document.getElementById('statsCategorySpread');
        const sessionsTable = document.getElementById('statsStudySessionsTable');

        let totalFocusSec = 0;
        let totalBreakSec = 0;
        let maxFocusSec = 0;
        let catCounts = {};

        studySessions.forEach(s => {
            const fSec = s.activeSeconds || 0;
            const bSec = s.breakSeconds || 0;
            totalFocusSec += fSec;
            totalBreakSec += bSec;
            if (fSec > maxFocusSec) maxFocusSec = fSec;

            const c = s.category || 'OTHER';
            catCounts[c] = (catCounts[c] || 0) + 1;
        });

        const totalHours = Math.floor(totalFocusSec / 3600);
        const totalMins = Math.floor((totalFocusSec % 3600) / 60);
        const avgMins = studySessions.length > 0 ? Math.round((totalFocusSec / studySessions.length) / 60) : 0;
        const maxMins = Math.round(maxFocusSec / 60);
        const breakMins = Math.round(totalBreakSec / 60);
        const totalSessionSec = totalFocusSec + totalBreakSec;
        const breakPct = totalSessionSec > 0 ? Math.round((totalBreakSec / totalSessionSec) * 100) : 0;

        let topCategory = 'None';
        let topCount = 0;
        Object.entries(catCounts).forEach(([cat, count]) => {
            if (count > topCount) {
                topCount = count;
                topCategory = cat;
            }
        });

        if (statsTotalStudy) statsTotalStudy.textContent = `${totalHours}h ${totalMins}m`;
        if (statsTotalCount) statsTotalCount.textContent = `${studySessions.length} total sessions completed`;
        if (statsAvgSession) statsAvgSession.textContent = `${avgMins}m`;
        if (statsLongestSession) statsLongestSession.textContent = `Longest: ${maxMins}m`;
        if (statsBreakRatio) statsBreakRatio.textContent = `${breakPct}%`;
        if (statsTotalBreak) statsTotalBreak.textContent = `${breakMins}m total break recovery`;
        if (statsTopCat) statsTopCat.textContent = topCategory;
        if (statsCatSpread) {
            const spread = Object.entries(catCounts).map(([k, v]) => `${k}: ${v}`).join(' · ');
            statsCatSpread.textContent = spread || 'No sessions logged';
        }

        if (sessionsTable) {
            if (studySessions.length === 0) {
                sessionsTable.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No study sessions recorded yet. Click "Start Studying" on the dashboard to log your first session!</div>`;
            } else {
                let rows = studySessions.slice(0, 10).map(s => {
                    const activeM = Math.round((s.activeSeconds || 0) / 60);
                    const breakM = Math.round((s.breakSeconds || 0) / 60);
                    const cameraStr = s.cameraEnabled ? `📷 ON (${s.presenceRate || 100}%)` : `OFF`;
                    return `
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12.5px;">
                            <td style="padding: 10px 8px; color: var(--text-muted);">${s.date} <small style="display: block; color: var(--gold);">${s.startTime || ''} – ${s.endTime || ''}</small></td>
                            <td style="padding: 10px 8px; font-weight: 700; color: #fff;">${s.subject} <span style="display: block; font-weight: 400; font-size: 11.5px; color: var(--text-secondary);">${s.topic}</span></td>
                            <td style="padding: 10px 8px; color: var(--emerald); font-weight: 700;">${activeM}m</td>
                            <td style="padding: 10px 8px; color: var(--amber);">${breakM}m</td>
                            <td style="padding: 10px 8px; font-size: 11.5px; color: var(--cyan);">${cameraStr}</td>
                            <td style="padding: 10px 8px; color: var(--text-secondary); font-style: italic; max-width: 280px;">"${s.aiInsight || 'Focused session'}"</td>
                        </tr>
                    `;
                }).join('');

                sessionsTable.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                                <th style="padding: 8px;">Date & Time</th>
                                <th style="padding: 8px;">Subject & Topic</th>
                                <th style="padding: 8px;">Focus</th>
                                <th style="padding: 8px;">Break</th>
                                <th style="padding: 8px;">Camera</th>
                                <th style="padding: 8px;">AI Reflection</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            }
        }

        const chart = document.getElementById('statsHistoryBars');
        if (!chart) return;

        let barHtml = '';
        const today = DateUtils.todayIST();
        for (let i = 13; i >= 0; i--) {
            const d = DateUtils.parseDate(today);
            d.setDate(d.getDate() - i);
            const dateStr = DateUtils.toDateStr(d);
            const summary = TaskEngine.getDaySummary(dateStr);
            const height = Math.max(8, summary.completedStudy * 35);
            const isGood = summary.completedStudy >= 2;

            barHtml += `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <div style="width: 100%; height: ${height}px; background: ${isGood ? 'var(--gold)' : summary.completedStudy > 0 ? 'var(--amber)' : 'var(--panel-active)'}; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>
                    <span style="font-size: 10px; color: var(--text-muted);">${d.getDate()}</span>
                </div>
            `;
        }
        chart.innerHTML = barHtml;

        // ----------------------------------------------------
        // Lifestyle & Gym Analytics Integration
        // ----------------------------------------------------
        const gymStatsContainer = document.getElementById('lifestyleStatsContainer');
        if (gymStatsContainer && typeof Store !== 'undefined' && Store.getWeeklyGymSummary) {
            const gymSummary = Store.getWeeklyGymSummary();
            const gymSessions = Store.getWorkoutSessions();
            const prData = Store.getExercisePRs();

            let totalLifetimeVolume = 0;
            let totalLifetimeSets = 0;
            gymSessions.forEach(s => {
                totalLifetimeVolume += (s.totalVolumeKg || 0);
                totalLifetimeSets += (s.totalSets || 0);
            });

            gymStatsContainer.innerHTML = `
                <div class="stats-section-title" style="margin-top: 32px; margin-bottom: 16px;">
                    <h3>🏋️ Lifestyle & Workout Analytics</h3>
                    <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0 0 0;">Physical training performance tracked distinctly from study metrics.</p>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-header">
                            <span>Workout Consistency</span>
                            <span>🏋️</span>
                        </div>
                        <div class="metric-value">${gymSummary.completedDays} / ${gymSummary.plannedDays}</div>
                        <div class="metric-footer">This week's sessions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-header">
                            <span>Total Volume Lifted</span>
                            <span>📈</span>
                        </div>
                        <div class="metric-value">${totalLifetimeVolume.toLocaleString()} kg</div>
                        <div class="metric-footer">${totalLifetimeSets} sets recorded</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-header">
                            <span>Personal Records</span>
                            <span>🏆</span>
                        </div>
                        <div class="metric-value">${(prData.exercises || []).length} PRs</div>
                        <div class="metric-footer">${prData.bestSession ? `Best: ${prData.bestSession.volume.toLocaleString()} kg` : 'Tracking active'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-header">
                            <span>Most Trained Muscle</span>
                            <span>💪</span>
                        </div>
                        <div class="metric-value" style="font-size: 20px;">${gymSummary.mostTrained}</div>
                        <div class="metric-footer">Volume focus</div>
                    </div>
                </div>
            `;
        }
    }
};

if (typeof window !== 'undefined') {
    window.App = App;
}
if (typeof module !== 'undefined') {
    module.exports = { App };
}

if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
}
