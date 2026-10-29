/**
 * BOSS Study OS — Advanced Gym & Personal Workout Tracking Engine
 * Complete Real Workout Logging System:
 * - Exact Weekly Split: Mon/Thu: Back+Biceps, Tue/Fri: Legs+Shoulders, Wed/Sat: Chest+Triceps, Sun: Rest
 * - Focus Hero: Today's Workout & [ START WORKOUT ] / Rest Day
 * - Mandatory Gym Photo Check-In with live camera API, canvas snapshot, retake/use photo
 * - Exercise Selection UI with Target Muscle Groups (BACK, BICEPS, etc.) and Today's Shelf
 * - Set Logging (Weight kg, Reps, RPE 6-10, Complete [✓ Complete], Rest Timer)
 * - Previous Performance Reference (⏮ LAST TIME)
 * - Long-Term Monthly History with Month Selector & [ 📸 View Gym Photo ]
 * - Personal Records & Real Progression Charts (Zero Fake Data)
 */

const GymEngine = {
    activeLifestyleTab: 'gym', // 'gym' | 'food' | 'water' | 'sleep' | 'supplements' | 'activity'
    activeGymSubTab: 'today',  // 'today' | 'history' | 'prs' | 'exercises'

    // Active live workout session
    liveWorkout: null,

    // Edit Completed Workout Session State
    editingWorkoutSession: null,
    editingWorkoutSessionIsDirty: false,
    _isSavingEditedWorkout: false,

    // Mandatory Camera Check-In State
    checkInState: {
        isOpen: false,
        stream: null,
        capturedDataUrl: null,
        error: null,
        routineName: '',
        targetMuscleGroups: [],
        dayKey: ''
    },

    // Rest Timer State
    restTimerState: {
        timerId: null,
        remainingSec: 60,
        totalSec: 60,
        isRunning: false
    },

    // History Month Selector ('YYYY-MM')
    selectedHistoryMonth: null,

    // Exercise Selection search query
    exerciseSearchQuery: '',

    // Selected exercise in progression view
    activeSelectedExercise: null,

    // Temporary state during setup wizard
    wizardData: {
        step: 1,
        selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        dayRoutines: {},
        activeExerciseDayIndex: 0,
        error: null,
        isSaving: false,
        settings: {
            trackRPE: true,
            trackRestTime: true,
            trackWarmupSets: false,
            trackCardio: false,
            trackBodyMeasurements: false,
            trackPRs: true
        }
    },

    init() {
        // Load active workout from Store if one was in progress
        const savedActive = Store.getActiveWorkoutSession();
        if (savedActive) {
            this.liveWorkout = savedActive;
        }

        // Initialize default month filter to current month
        if (!this.selectedHistoryMonth) {
            this.selectedHistoryMonth = DateUtils.todayIST().slice(0, 7);
        }
    },

    exportProgressReport() {
        if (typeof GymExportEngine !== 'undefined' && typeof GymExportEngine.openExportModal === 'function') {
            GymExportEngine.openExportModal();
        }
    },

    exportSingleWorkout(id) {
        if (typeof GymExportEngine !== 'undefined' && typeof GymExportEngine.exportSingleWorkout === 'function') {
            GymExportEngine.exportSingleWorkout(id);
        }
    },

    canUserEditSession(session) {
        if (!session) return false;
        const currentUserId = (typeof SupabaseService !== 'undefined' && SupabaseService.getUserId && SupabaseService.getUserId()) ||
                              (typeof Store !== 'undefined' && Store.getUserId && Store.getUserId()) || null;
        const sessionOwnerId = session.userId || session.user_id;
        if (currentUserId && sessionOwnerId && currentUserId !== sessionOwnerId) {
            return false;
        }
        return true;
    },

    // -------------------------------------------------------------------------
    // Top-Level Lifestyle View Renderer (Gym, Food, Water, Sleep, etc.)
    // -------------------------------------------------------------------------
    render() {
        const container = document.getElementById('view-food');
        if (!container) return;

        container.innerHTML = `
            <div class="lifestyle-header-banner">
                <div class="lifestyle-header-content">
                    <span class="lifestyle-badge-pill">⚡ FORGE BODY & HEALTH COMMAND</span>
                    <h2 style="margin: 4px 0 6px 0; font-size: 22px; color: #fff;">Lifestyle & Physical Performance</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 13.5px; max-width: 720px;">
                        Disciplined training and high-protein nutrition fuel peak mental endurance for intense coding and placement preparation.
                    </p>
                </div>
            </div>

            <!-- Lifestyle Sub-Tabs Bar -->
            <div class="lifestyle-nav-tabs">
                <button class="ls-tab-btn ${this.activeLifestyleTab === 'gym' ? 'active' : ''}" onclick="GymEngine.switchLifestyleTab('gym')">
                    🏋️ Gym & Workouts
                </button>
                <button class="ls-tab-btn" onclick="App.switchView('nutrition')" style="border: 1px solid rgba(16,185,129,0.35); background: rgba(16,185,129,0.1); color: #34d399; font-weight: 600;">
                    🥗 Strict Diet & Fat Loss
                </button>
                <button class="ls-tab-btn ${this.activeLifestyleTab === 'food' ? 'active' : ''}" onclick="GymEngine.switchLifestyleTab('food')">
                    🥣 Post-Workout Food
                </button>
                <button class="ls-tab-btn ${this.activeLifestyleTab === 'water' ? 'active' : ''}" onclick="GymEngine.switchLifestyleTab('water')">
                    💧 Water
                </button>
                <button class="ls-tab-btn ${this.activeLifestyleTab === 'supplements' ? 'active' : ''}" onclick="GymEngine.switchLifestyleTab('supplements')">
                    💊 Creatine & Supplements
                </button>
                <button class="ls-tab-btn ${this.activeLifestyleTab === 'sleep' ? 'active' : ''}" onclick="GymEngine.switchLifestyleTab('sleep')">
                    😴 Sleep & Recovery
                </button>
                <button class="ls-tab-btn ${this.activeLifestyleTab === 'activity' ? 'active' : ''}" onclick="GymEngine.switchLifestyleTab('activity')">
                    🚶 Steps & Walk
                </button>
            </div>

            <div id="lifestyleContentBody" style="margin-top: 20px;">
                ${this.renderActiveLifestyleTabHtml()}
            </div>
        `;

        if (this.activeLifestyleTab === 'food' && window.App && window.App.renderFoodViewContent) {
            window.App.renderFoodViewContent();
        }
    },

    switchLifestyleTab(tabName) {
        this.activeLifestyleTab = tabName;
        this.render();
    },

    renderActiveLifestyleTabHtml() {
        if (this.activeLifestyleTab === 'gym') {
            return this.renderGymSectionHtml();
        } else if (this.activeLifestyleTab === 'food') {
            return this.renderFoodPreservedHtml();
        } else if (this.activeLifestyleTab === 'water') {
            return this.renderWaterTrackerHtml();
        } else if (this.activeLifestyleTab === 'supplements') {
            return this.renderSupplementsHtml();
        } else if (this.activeLifestyleTab === 'sleep') {
            return this.renderSleepTrackerHtml();
        } else if (this.activeLifestyleTab === 'activity') {
            return this.renderActivityTrackerHtml();
        }
        return '';
    },

    // -------------------------------------------------------------------------
    // Gym Section
    // -------------------------------------------------------------------------
    renderGymSectionHtml() {
        const isConfigured = Store.isGymConfigured();
        if (!isConfigured) {
            return this.renderWizardHtml();
        }

        // If a live workout is currently in progress, show it directly
        if (this.liveWorkout) {
            return this.renderLiveWorkoutHtml();
        }

        const weeklySummary = Store.getWeeklyGymSummary();
        const todayInfo = Store.getTodayWorkoutTemplate();

        return `
            <!-- Gym Sub-Navigation Bar with Permanent Quick Log Button -->
            <div class="gym-subnav-row">
                <div class="gym-subnav-buttons">
                    <button class="gym-sub-btn ${this.activeGymSubTab === 'today' ? 'active' : ''}" onclick="GymEngine.switchGymSubTab('today')">
                        📅 Today's Workout
                    </button>
                    <button class="gym-sub-btn ${this.activeGymSubTab === 'history' ? 'active' : ''}" onclick="GymEngine.switchGymSubTab('history')">
                        📜 Workout History
                    </button>
                    <button class="gym-sub-btn ${this.activeGymSubTab === 'prs' ? 'active' : ''}" onclick="GymEngine.switchGymSubTab('prs')">
                        🏆 Personal Records (PRs)
                    </button>
                    <button class="gym-sub-btn ${this.activeGymSubTab === 'exercises' ? 'active' : ''}" onclick="GymEngine.switchGymSubTab('exercises')">
                        📈 Exercise Progression
                    </button>
                </div>
                <div class="gym-subnav-actions">
                    <button id="btnGymExportReport" class="btn-gym-export-report" onclick="GymEngine.exportProgressReport()" title="Download professional gym progress report PDF">
                        📄 DOWNLOAD PROGRESS REPORT
                    </button>
                    <button id="btnGymRefresh" class="action-btn-ghost btn-gym-refresh" style="padding: 6px 12px; font-size: 12px;" onclick="GymEngine.refreshGymData()" title="Fetch latest workouts and plans from cloud">
                        ↻ REFRESH
                    </button>
                    <button class="btn-gym-quick-record" onclick="GymEngine.triggerQuickLogWorkout()">
                        ⚡ + LOG WORKOUT
                    </button>
                    <button class="action-btn-ghost" style="padding: 6px 12px; font-size: 12px;" onclick="GymEngine.openEditPlanModal()">
                        ⚙️ Edit Workout Plan
                    </button>
                </div>
            </div>

            <!-- Weekly Workout Summary Card -->
            <div class="gym-week-summary-card">
                <div class="g-week-header">
                    <span class="g-week-title">📊 THIS WEEK (${weeklySummary.mondayStr.slice(5)} – ${weeklySummary.sundayStr.slice(5)})</span>
                    <span style="font-size: 11.5px; color: var(--text-muted);">Real logged session metrics</span>
                </div>
                <div class="g-week-stats-row">
                    <div class="g-stat-item">
                        <span class="lbl">Workout Days</span>
                        <b class="val" style="color: var(--gold);">${weeklySummary.completedDays} / ${weeklySummary.plannedDays}</b>
                    </div>
                    <div class="g-stat-item">
                        <span class="lbl">Total Sets</span>
                        <b class="val" style="color: #fff;">${weeklySummary.totalSets}</b>
                    </div>
                    <div class="g-stat-item">
                        <span class="lbl">Total Volume</span>
                        <b class="val" style="color: var(--sky);">${weeklySummary.totalVolumeKg.toLocaleString()} kg</b>
                    </div>
                    <div class="g-stat-item">
                        <span class="lbl">Most Trained</span>
                        <b class="val" style="color: var(--emerald);">${weeklySummary.mostTrained}</b>
                    </div>
                    <div class="g-stat-item">
                        <span class="lbl">Personal Records</span>
                        <b class="val" style="color: var(--purple);">${weeklySummary.prsAchieved} PRs</b>
                    </div>
                    <div class="g-stat-item">
                        <span class="lbl">Missed Sessions</span>
                        <b class="val" style="color: ${weeklySummary.missedSessions > 0 ? 'var(--rose)' : 'var(--text-muted)'};">${weeklySummary.missedSessions}</b>
                    </div>
                </div>
            </div>

            <div id="gymSubTabBody" style="margin-top: 18px;">
                ${this.renderGymSubTabContent(todayInfo)}
            </div>
        `;
    },

    switchGymSubTab(tab) {
        this.activeGymSubTab = tab;
        this.render();
    },

    renderGymSubTabContent(todayInfo) {
        if (this.activeGymSubTab === 'today') {
            return this.renderTodayWorkoutCard(todayInfo);
        } else if (this.activeGymSubTab === 'history') {
            return this.renderWorkoutHistoryHtml();
        } else if (this.activeGymSubTab === 'prs') {
            return this.renderPRsDashboardHtml();
        } else if (this.activeGymSubTab === 'exercises') {
            return this.renderExerciseProgressionSelectorHtml();
        }
        return '';
    },

    // -------------------------------------------------------------------------
    // Today's Workout Card — Main Hero Focus
    // -------------------------------------------------------------------------
    renderTodayWorkoutCard(todayInfo) {
        const templ = todayInfo.template;
        const isRest = !templ || templ.isRestDay;
        const muscleGroups = templ?.muscleGroups || (templ?.routineName ? templ.routineName.split('+').map(s => s.trim()) : []);

        // Check if today was already completed
        const todayDate = DateUtils.todayIST();
        const completedSession = Store.getWorkoutSessions().find(s => s.date === todayDate);

        if (completedSession) {
            return `
                <div class="today-workout-hero-card completed">
                    <div class="twh-top">
                        <div>
                            <span class="twh-badge completed">✓ WORKOUT COMPLETED TODAY</span>
                            <h3 style="margin: 4px 0 2px 0; color: #fff; font-size: 22px;">${completedSession.workoutType || completedSession.routineName}</h3>
                            <span style="color: var(--text-secondary); font-size: 13px;">Finished in ${completedSession.durationMinutes || completedSession.duration || 0} mins • Total Volume: ${(completedSession.totalVolumeKg || 0).toLocaleString()} kg (${completedSession.setCount || completedSession.totalSets || 0} sets)</span>
                            <div class="twh-muscle-pills" style="margin-top: 10px;">
                                ${muscleGroups.map(m => `<span class="twh-muscle-pill">${m}</span>`).join('')}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${(completedSession.gym_photo_path || completedSession.gymPhoto?.storagePath || completedSession.gymPhoto?.url || completedSession.gym_photo_url || completedSession.gymPhoto?.base64) ? `
                                <button class="btn-view-photo" onclick="GymEngine.viewSessionPhoto('${completedSession.id}')">
                                    📸 View Gym Photo
                                </button>
                            ` : ''}
                            ${this.canUserEditSession(completedSession) ? `
                                <button type="button" class="action-btn-ghost btn-edit-workout" onclick="GymEngine.openEditWorkoutModal('${completedSession.id}')" title="Edit this completed workout session">
                                    ✏️ Edit Workout
                                </button>
                            ` : ''}
                            <button class="action-btn-ghost btn-export-single-workout" onclick="GymEngine.exportSingleWorkout('${completedSession.id}')" title="Export this workout as PDF">
                                📄 EXPORT WORKOUT PDF
                            </button>
                            <button class="action-btn-ghost" onclick="GymEngine.viewSessionDetails('${completedSession.id}')">
                                View Session Log ↗
                            </button>
                        </div>
                    </div>
                    <div class="completed-summary-grid" style="margin-top: 16px;">
                        ${(completedSession.exercises || []).map(ex => `
                            <div class="completed-ex-pill">
                                <b>${ex.name}</b>
                                <span>${ex.sets?.filter(s => s.completed)?.length || ex.sets?.length || 0} sets</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (isRest) {
            return `
                <div class="today-workout-hero-card rest">
                    <div class="twh-top">
                        <div>
                            <span class="twh-badge rest">REST DAY</span>
                            <h2 style="margin: 4px 0 2px 0; color: #fff; font-size: 26px; font-weight: 800;">${todayInfo.dayName}</h2>
                            <div style="font-size: 18px; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">Recovery / Rest</div>
                            <p style="color: var(--text-muted); margin: 8px 0 0 0; font-size: 13.5px; max-width: 600px;">
                                Muscles recover and grow during rest. Rest days are an essential component of progressive overload and are NOT marked as missed workouts.
                            </p>
                        </div>
                    </div>
                    <!-- Note: Do NOT show Start Workout button on Rest Day -->
                </div>
            `;
        }

        return `
            <div class="today-workout-hero-card">
                <div class="twh-top">
                    <div>
                        <span class="twh-badge">TODAY'S WORKOUT</span>
                        <h2 style="margin: 4px 0 2px 0; color: #fff; font-size: 26px; font-weight: 800;">${todayInfo.dayName.toUpperCase()}</h2>
                        <div style="font-size: 20px; font-weight: 800; color: var(--gold); margin-top: 2px;">${templ.workoutType || templ.routineName || 'REST / NO WORKOUT PLANNED'}</div>
                        <div class="twh-muscle-pills">
                            ${muscleGroups.map(m => `<span class="twh-muscle-pill">${m}</span>`).join('')}
                            <span style="color: var(--text-muted); font-size: 12px; margin-left: 6px; align-self: center;">${muscleGroups.length} muscle groups</span>
                        </div>
                    </div>
                    <button class="btn-primary" style="padding: 14px 28px; font-size: 15px; font-weight: 800; border-radius: var(--radius-sm); box-shadow: 0 4px 20px rgba(245, 197, 24, 0.4); display: flex; align-items: center; gap: 8px;" onclick="GymEngine.startWorkoutToday()">
                        <span>⚡</span>
                        <span>START WORKOUT</span>
                    </button>
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // Start Workout Flow & Mandatory Check-In
    // -------------------------------------------------------------------------
    startWorkoutToday() {
        const todayInfo = Store.getTodayWorkoutTemplate();
        const templ = todayInfo.template;
        if (!templ || templ.isRestDay) {
            this.openSelectRoutineModal({
                title: "TODAY IS A REST DAY",
                subtitle: "You have a scheduled Rest Day. Select an optional workout routine to train today:"
            });
            return;
        }

        const muscleGroups = templ.muscleGroups || (templ.routineName ? templ.routineName.split('+').map(s => s.trim()) : []);
        this.openCheckInModal({
            dayKey: todayInfo.dayKey,
            routineName: templ.routineName,
            targetMuscleGroups: muscleGroups
        });
    },

    triggerQuickLogWorkout() {
        if (this.liveWorkout) {
            this.activeGymSubTab = 'today';
            this.render();
            return;
        }

        const todayInfo = Store.getTodayWorkoutTemplate();
        const templ = todayInfo.template;

        if (templ && !templ.isRestDay) {
            this.startWorkoutToday();
        } else {
            this.openSelectRoutineModal({
                title: "SELECT WORKOUT ROUTINE",
                subtitle: "Select a workout routine to begin today's training:"
            });
        }
    },

    openSelectRoutineModal(options = {}) {
        let modal = document.getElementById('selectRoutineModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'selectRoutineModal';
            document.body.appendChild(modal);
        }

        const title = options.title || "SELECT WORKOUT ROUTINE";
        const subtitle = options.subtitle || "Select a workout routine to begin today's training:";

        const routines = [
            { routineName: 'Back + Biceps', muscleGroups: ['Back', 'Biceps'], icon: '⚡', desc: 'Pull-focused hypertrophy routine' },
            { routineName: 'Legs + Shoulders', muscleGroups: ['Legs', 'Shoulders'], icon: '🦵', desc: 'Lower body foundation & deltoids' },
            { routineName: 'Chest + Triceps', muscleGroups: ['Chest', 'Triceps'], icon: '🔥', desc: 'Push-focused hypertrophy routine' },
            { routineName: 'Full Body', muscleGroups: ['Back', 'Chest', 'Legs', 'Shoulders', 'Biceps', 'Triceps'], icon: '🎯', desc: 'Compound whole-body session' }
        ];

        modal.innerHTML = `
            <div class="modal-window" style="width: min(520px, 94vw);">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">WORKOUT SPLIT</span>
                        <h3 class="wizard-modal-title">${title}</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('selectRoutineModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;">
                    <p style="color: var(--text-secondary); margin: 0 0 6px 0; font-size: 13px;">${subtitle}</p>
                    ${routines.map((r) => `
                        <button
                            type="button"
                            class="picker-ex-item"
                            style="text-align: left; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 16px; background: rgba(255, 255, 255, 0.03); display: flex; justify-content: space-between; align-items: center;"
                            onclick="GymEngine.selectRoutineAndProceed('${r.routineName}', '${r.muscleGroups.join(',')}')"
                        >
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 22px;">${r.icon}</span>
                                <div>
                                    <h4 style="margin: 0; color: #fff; font-size: 15px; font-weight: 700;">${r.routineName}</h4>
                                    <span style="font-size: 11.5px; color: var(--text-muted);">${r.desc}</span>
                                </div>
                            </div>
                            <span style="color: var(--gold); font-size: 13px; font-weight: 800;">START →</span>
                        </button>
                    `).join('')}
                </div>
                <div class="modal-footer" style="padding: 12px 20px; display: flex; justify-content: flex-end;">
                    <button class="action-btn-ghost" onclick="document.getElementById('selectRoutineModal').classList.remove('active')">Cancel</button>
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };

        modal.classList.add('active');
    },

    selectRoutineAndProceed(routineName, muscleGroupsStr) {
        const modal = document.getElementById('selectRoutineModal');
        if (modal) modal.classList.remove('active');

        const muscleGroups = (muscleGroupsStr || '').split(',').map(s => s.trim()).filter(Boolean);
        this.openCheckInModal({
            dayKey: 'optional',
            routineName,
            targetMuscleGroups: muscleGroups
        });
    },

    // -------------------------------------------------------------------------
    // Mandatory Camera Check-In Modal
    // -------------------------------------------------------------------------
    openCheckInModal(config) {
        this.checkInState = {
            isOpen: true,
            stream: null,
            capturedDataUrl: null,
            error: null,
            dayKey: config.dayKey || '',
            routineName: config.routineName || 'Gym Workout',
            targetMuscleGroups: config.targetMuscleGroups || []
        };

        let modal = document.getElementById('gymCheckInModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'gymCheckInModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) {
                GymEngine.closeCheckInModal(true);
            }
        };

        this.renderCheckInModalUI();
        modal.classList.add('active');
    },

    renderCheckInModalUI() {
        const modal = document.getElementById('gymCheckInModal');
        if (!modal) return;

        const { routineName, capturedDataUrl, stream, error } = this.checkInState;

        modal.innerHTML = `
            <div class="modal-window gym-checkin-modal-window">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">STEP 1: MANDATORY CHECK-IN</span>
                        <h3 class="wizard-modal-title">🏋️ Gym Session Check-In</h3>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Close" onclick="GymEngine.closeCheckInModal(true)">×</button>
                </div>

                <div class="checkin-hero-banner">
                    <span style="font-size: 11.5px; color: var(--gold); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Today's Workout</span>
                    <h3 style="margin: 4px 0 2px 0; color: #fff;">${routineName}</h3>
                    <p style="color: var(--text-secondary); margin: 4px 0 0 0; font-size: 13px;">
                        Before starting your workout, take a photo inside the gym.
                    </p>
                    <div class="checkin-mandatory-badge">
                        <span>📸</span>
                        <span>Gym photo is mandatory</span>
                    </div>
                </div>

                <div class="modal-body" style="padding: 20px;">
                    ${error ? `
                        <div class="camera-error-banner">
                            <span>⚠️ ${error}</span>
                        </div>
                    ` : ''}

                    <div class="camera-viewport-card ${stream ? 'active-stream' : ''}">
                        ${capturedDataUrl ? `
                            <img class="camera-preview-img" id="gymCheckInPreviewImg" src="${capturedDataUrl}" alt="Captured Gym Photo">
                        ` : stream ? `
                            <div class="camera-live-badge">LIVE CAMERA</div>
                            <video id="gymCheckInVideo" class="camera-viewport-video" autoplay playsinline muted></video>
                        ` : `
                            <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                                <div style="font-size: 48px; margin-bottom: 10px;">📸</div>
                                <b style="color: #fff; font-size: 15px; display: block;">Device Camera Check-In</b>
                                <p style="font-size: 12.5px; color: var(--text-muted); margin: 6px auto 0 auto; max-width: 320px;">
                                    Verify your gym presence. Real gym photos are required before each session starts.
                                </p>
                            </div>
                        `}
                    </div>

                    <!-- Hidden device photo picker for maximum cross-platform reliability -->
                    <input type="file" id="gymCheckInFileInput" accept="image/*" capture="environment" style="display: none;" onchange="GymEngine.handleCheckInFileInput(event)">

                    <div class="camera-controls-bar">
                        ${capturedDataUrl ? `
                            <button type="button" class="action-btn-ghost" style="padding: 10px 20px;" onclick="GymEngine.retakeCheckInPhoto()">
                                🔄 Retake Photo
                            </button>
                            <button type="button" class="btn-capture-photo" onclick="GymEngine.confirmCheckInPhoto()">
                                ✓ Use This Photo & Start Workout
                            </button>
                        ` : stream ? `
                            <button type="button" class="btn-capture-photo" onclick="GymEngine.captureCheckInPhoto()">
                                🔘 Capture Photo
                            </button>
                            <button type="button" class="action-btn-ghost" style="padding: 8px 16px;" onclick="GymEngine.stopCameraStream()">
                                Stop Camera
                            </button>
                        ` : `
                            <button type="button" class="btn-capture-photo" onclick="GymEngine.openCameraStream()">
                                📸 Open Camera
                            </button>
                            <button type="button" class="action-btn-ghost" style="padding: 10px 18px;" onclick="document.getElementById('gymCheckInFileInput').click()">
                                📁 Camera / Photo from Device
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;

        if (stream && !capturedDataUrl) {
            const vid = document.getElementById('gymCheckInVideo');
            if (vid) {
                vid.srcObject = stream;
                vid.play().catch(e => console.warn('Video play error:', e));
            }
        }
    },

    async openCameraStream() {
        this.checkInState.error = null;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.checkInState.error = "Camera API is not supported in this browser. Please use 'Camera / Photo from Device'.";
            this.renderCheckInModalUI();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            this.checkInState.stream = stream;
            this.checkInState.capturedDataUrl = null;
            this.renderCheckInModalUI();
        } catch (err) {
            console.error('Camera access error:', err);
            this.checkInState.error = "Camera access is required to start a gym session. Please allow camera access and try again.";
            this.renderCheckInModalUI();
        }
    },

    captureCheckInPhoto() {
        const vid = document.getElementById('gymCheckInVideo');
        if (!vid || !this.checkInState.stream) {
            this.checkInState.error = "No camera stream active to capture photo.";
            this.renderCheckInModalUI();
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = vid.videoWidth || 800;
            canvas.height = vid.videoHeight || 600;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            this.stopCameraStream();
            this.checkInState.capturedDataUrl = dataUrl;
            this.renderCheckInModalUI();
        } catch (e) {
            console.error('Photo capture error:', e);
            this.checkInState.error = "Failed to capture photo frame. Please try again.";
            this.renderCheckInModalUI();
        }
    },

    retakeCheckInPhoto() {
        this.checkInState.capturedDataUrl = null;
        this.openCameraStream();
    },

    handleCheckInFileInput(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.stopCameraStream();
            this.checkInState.capturedDataUrl = e.target.result;
            this.renderCheckInModalUI();
        };
        reader.readAsDataURL(file);
    },

    stopCameraStream() {
        if (this.checkInState.stream) {
            this.checkInState.stream.getTracks().forEach(track => track.stop());
            this.checkInState.stream = null;
        }
    },

    async confirmCheckInPhoto() {
        if (!this.checkInState.capturedDataUrl) {
            this.checkInState.error = "Gym photo required to start today's workout.";
            this.renderCheckInModalUI();
            return;
        }

        const sid = 'sess_' + Date.now();
        let photoPath = null;
        let photoDisplayUrl = this.checkInState.capturedDataUrl;

        // If authenticated with Supabase, upload to private gym-photos bucket
        if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
            this.checkInState.isUploading = true;
            this.renderCheckInModalUI();

            try {
                // Convert DataURL to Blob
                const res = await fetch(this.checkInState.capturedDataUrl);
                const blob = await res.blob();

                const uploadRes = await SupabaseService.uploadGymPhotoBlob(blob, sid);
                photoPath = uploadRes.path;

                // Obtain signed URL for display
                const signedUrl = await SupabaseService.getSignedGymPhotoUrl(photoPath);
                if (signedUrl) photoDisplayUrl = signedUrl;
            } catch (uploadErr) {
                console.warn('[Gym] Gym photo upload failed, saving offline:', uploadErr);
                // When offline or upload network fails, preserve photo locally so user can work out!
                if (typeof showToast === 'function') {
                    showToast("Gym photo saved locally. Will sync to secure storage once online.", "info");
                }
            } finally {
                this.checkInState.isUploading = false;
            }
        }

        const gymPhoto = {
            id: 'photo_' + Date.now(),
            url: photoDisplayUrl,
            base64: photoPath ? null : this.checkInState.capturedDataUrl,
            storagePath: photoPath,
            createdAt: DateUtils.nowISO()
        };

        const config = { ...this.checkInState, sessionId: sid, gym_photo_path: photoPath };
        this.closeCheckInModal(false);
        this.initLiveSessionWithPhoto(config, gymPhoto);
    },

    closeCheckInModal(isManualClose = true) {
        this.stopCameraStream();
        const modal = document.getElementById('gymCheckInModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.checkInState.isOpen = false;

        if (isManualClose) {
            showToast("Gym photo required to start today's workout.", "warning");
        }
    },

    // -------------------------------------------------------------------------
    // Workout Session Lifecycle
    // -------------------------------------------------------------------------
    initLiveSessionWithPhoto(config, gymPhoto) {
        this.liveWorkout = {
            id: config.sessionId || ('gym_sess_' + Date.now()),
            date: DateUtils.todayIST(),
            dayKey: config.dayKey || '',
            routineName: config.routineName || 'Gym Workout',
            targetMuscleGroups: config.targetMuscleGroups || [],
            gymPhoto,
            gym_photo_id: gymPhoto.id,
            gym_photo_path: config.gym_photo_path || gymPhoto.storagePath || null,
            gym_photo_url: gymPhoto.url,
            gym_photo_created_at: gymPhoto.createdAt,
            stage: 'select_exercises', // 1st stage: Select exercises
            selectedExerciseIds: [],
            exercises: [],
            startTimestamp: Date.now()
        };

        Store.saveActiveWorkoutSession(this.liveWorkout);
        showToast(`Gym check-in verified! Select exercises for ${this.liveWorkout.routineName}.`, 'success');
        this.activeGymSubTab = 'today';
        this.render();
    },

    renderLiveWorkoutHtml() {
        if (!this.liveWorkout) return '';

        if (this.liveWorkout.stage === 'select_exercises') {
            return this.renderExerciseSelectionHtml();
        }

        return this.renderSetLoggingHtml();
    },

    // -------------------------------------------------------------------------
    // Recommendation Engine & Previous Performance Tracking
    // -------------------------------------------------------------------------
    getPersonalizedRecommendations(targetMuscleGroups = [], routineName = '') {
        const library = Store.getExerciseLibrary();
        const gym = Store.getGymState();
        const currentActiveId = this.liveWorkout?.id || ((typeof Store !== 'undefined' && Store.getActiveWorkoutSession) ? Store.getActiveWorkoutSession()?.id : null);
        const currentUserId = (typeof SupabaseService !== 'undefined' && SupabaseService.getUserId && SupabaseService.getUserId()) ||
                              (typeof Store !== 'undefined' && Store.getUserId && Store.getUserId()) || null;

        const sessions = (gym.sessions || []).filter(s => {
            if (!s || !s.date || typeof s.date !== 'string') return false;
            if (currentActiveId && s.id === currentActiveId) return false;
            if (this.liveWorkout && s === this.liveWorkout) return false;
            if (s.isDeleted === true || s.deleted === true) return false;
            const status = (s.status || 'completed').toString().trim().toLowerCase();
            if (status === 'in_progress' || status === 'abandoned' || status === 'deleted') return false;
            if (status !== 'completed' && status !== 'done' && status !== 'finished') return false;
            if (currentUserId) {
                const sessUser = s.userId || s.user_id || null;
                if (sessUser && sessUser !== currentUserId && sessUser !== 'default_user') return false;
            }
            return true;
        });

        const normGroups = (targetMuscleGroups || []).map(g => (g || '').trim().toLowerCase());
        const normRoutine = (routineName || '').trim().toLowerCase();
        const now = Date.now();

        const recs = [];

        library.forEach(ex => {
            const normExName = (ex.name || '').trim().toLowerCase();
            const normExGroup = (ex.muscleGroup || '').trim().toLowerCase();

            let frequency = 0;
            let lastPerformedMs = 0;
            let lastPerformedDate = null;
            let inComparableWorkout = false;
            let previousSets = [];
            let previousBestSet = null;

            sessions.forEach(sess => {
                const sessDateMs = new Date(sess.date + 'T12:00:00').getTime();
                const isComparable = normRoutine && (sess.routineName || sess.workoutType || '').trim().toLowerCase() === normRoutine;

                const matchEx = (sess.exercises || []).find(e => {
                    if (!e || e.skipped) return false;
                    const eCanonicalId = e.exerciseId || e.exercise_id || null;
                    const eInstanceId = e.id || null;
                    const eName = (e.name || e.exerciseNameSnapshot || e.exerciseName || '').trim().toLowerCase();

                    if (ex.id) {
                        if (eCanonicalId && eCanonicalId === ex.id) return true;
                        if (eInstanceId && eInstanceId === ex.id) return true;
                    }
                    if (!eCanonicalId && normExName && eName === normExName) return true;
                    return false;
                });

                if (matchEx) {
                    frequency++;
                    if (isComparable) {
                        inComparableWorkout = true;
                    }
                    if (sessDateMs > lastPerformedMs) {
                        lastPerformedMs = sessDateMs;
                        lastPerformedDate = sess.date;
                        previousSets = matchEx.sets || [];
                        let bestWt = 0;
                        let bestReps = 0;
                        (matchEx.sets || []).forEach(s => {
                            const wt = parseFloat(s.weightKg ?? s.weight_kg ?? 0) || 0;
                            const rp = parseInt(s.reps ?? 0, 10) || 0;
                            if (wt > bestWt || (wt === bestWt && rp > bestReps)) {
                                bestWt = wt;
                                bestReps = rp;
                                previousBestSet = { weightKg: wt, reps: rp };
                            }
                        });
                    }
                }
            });

            const isSplitMatch = normGroups.includes(normExGroup);
            const daysAgo = lastPerformedMs > 0 ? (now - lastPerformedMs) / (1000 * 60 * 60 * 24) : 999;
            const recencyBonus = lastPerformedMs > 0 ? Math.max(0, 30 - daysAgo) : 0;

            // Score: Split (+100), Comparable (+50), Frequency (+15), Recency (+0-30)
            let score = 0;
            if (isSplitMatch) score += 100;
            if (inComparableWorkout) score += 50;
            score += (frequency * 15);
            score += recencyBonus;

            recs.push({
                exercise: ex,
                score,
                frequency,
                lastPerformedDate,
                lastPerformedMs,
                inComparableWorkout,
                isSplitMatch,
                previousSets,
                previousBestSet
            });
        });

        const usual = recs
            .filter(r => r.frequency >= 1)
            .sort((a, b) => b.score - a.score || b.lastPerformedMs - a.lastPerformedMs);

        const recommendedForSplit = recs
            .filter(r => r.isSplitMatch)
            .sort((a, b) => b.score - a.score);

        return {
            all: recs,
            allRanked: recs,
            usual,
            recommendedForSplit
        };
    },

    getExercisePerformanceDetails(exerciseName, exerciseId = null, excludeSessionId = null) {
        const gym = Store.getGymState();
        const library = (typeof Store !== 'undefined' && Store.getExerciseLibrary) ? Store.getExerciseLibrary() : [];

        let canonicalDef = null;
        if (exerciseId) {
            canonicalDef = library.find(item => item.id === exerciseId);
        }
        if (!canonicalDef && exerciseName) {
            const norm = (exerciseName || '').trim().toLowerCase();
            canonicalDef = library.find(item => (item.name || '').trim().toLowerCase() === norm);
        }

        const canonicalId = canonicalDef ? canonicalDef.id : (exerciseId || null);
        const canonicalName = canonicalDef ? canonicalDef.name : (exerciseName || '');
        const targetNormName = (canonicalName || exerciseName || '').trim().toLowerCase();

        const currentActiveId = excludeSessionId || this.liveWorkout?.id || ((typeof Store !== 'undefined' && Store.getActiveWorkoutSession) ? Store.getActiveWorkoutSession()?.id : null);
        const currentUserId = (typeof SupabaseService !== 'undefined' && SupabaseService.getUserId && SupabaseService.getUserId()) ||
                              (typeof Store !== 'undefined' && Store.getUserId && Store.getUserId()) || null;

        // Filter valid, previously recorded historical sessions
        const eligibleSessions = (gym.sessions || []).filter(s => {
            if (!s || !s.date || typeof s.date !== 'string') return false;

            // Exclude current active workout session
            if (currentActiveId && s.id === currentActiveId) return false;
            if (this.liveWorkout && s === this.liveWorkout) return false;

            // Filter out invalid/deleted records
            if (s.isDeleted === true || s.deleted === true) return false;
            const status = (s.status || 'completed').toString().trim().toLowerCase();
            if (status === 'in_progress' || status === 'abandoned' || status === 'deleted') return false;
            if (status !== 'completed' && status !== 'done' && status !== 'finished') return false;

            // User isolation
            if (currentUserId) {
                const sessUser = s.userId || s.user_id || null;
                if (sessUser && sessUser !== currentUserId && sessUser !== 'default_user') {
                    return false;
                }
            }

            return true;
        });

        // Sort sessions strictly by actual workout date (descending), then session timestamp (descending)
        eligibleSessions.sort((a, b) => {
            const dateA = (a.date || '').slice(0, 10);
            const dateB = (b.date || '').slice(0, 10);
            const dateCmp = dateB.localeCompare(dateA);
            if (dateCmp !== 0) return dateCmp;

            const timeA = a.completedAt || a.endedAt || a.startedAt || a.createdAt || a.created_at || a.updatedAt || a.updated_at || '';
            const timeB = b.completedAt || b.endedAt || b.startedAt || b.createdAt || b.created_at || b.updatedAt || b.updated_at || '';
            if (timeA && timeB) {
                const msA = new Date(timeA).getTime();
                const msB = new Date(timeB).getTime();
                if (!isNaN(msA) && !isNaN(msB) && msA !== msB) {
                    return msB - msA;
                }
                return timeB.localeCompare(timeA);
            }
            if (timeB && !timeA) return 1;
            if (timeA && !timeB) return -1;
            return 0;
        });

        let lastSession = null;
        let lastEx = null;

        for (let i = 0; i < eligibleSessions.length; i++) {
            const sess = eligibleSessions[i];
            const matchEx = (sess.exercises || []).find(e => {
                if (!e || e.skipped) return false;

                const eCanonicalId = e.exerciseId || e.exercise_id || null;
                const eInstanceId = e.id || null;
                const eName = (e.name || e.exerciseNameSnapshot || e.exerciseName || '').trim().toLowerCase();

                // 1. Match using canonical IDs wherever available
                if (canonicalId) {
                    if (eCanonicalId && eCanonicalId === canonicalId) return true;
                    if (eInstanceId && eInstanceId === canonicalId) return true;
                }

                // 2. Reliable fallback matching for legacy records without canonical IDs
                if (!eCanonicalId) {
                    if (targetNormName && eName === targetNormName) return true;
                } else if (!canonicalId) {
                    if (targetNormName && eName === targetNormName) return true;
                }

                return false;
            });

            if (matchEx && Array.isArray(matchEx.sets) && matchEx.sets.length > 0) {
                const hasRecordedSet = matchEx.sets.some(s => {
                    const wt = parseFloat(s.weightKg ?? s.weight_kg ?? 0) || 0;
                    const rp = parseInt(s.reps ?? 0, 10) || 0;
                    return s.completed === true || rp > 0 || wt > 0 || s.completed !== false;
                });

                if (hasRecordedSet) {
                    lastSession = sess;
                    lastEx = matchEx;
                    break;
                }
            }
        }

        const prs = (typeof Store !== 'undefined' && Store.getExercisePRs) ? Store.getExercisePRs() : { exercises: [] };
        const pr = (prs.exercises || []).find(p => (p.name || '').trim().toLowerCase() === targetNormName || (canonicalId && p.exerciseId === canonicalId));

        if (!lastSession || !lastEx) {
            return {
                hasHistory: false,
                lastSessionDate: null,
                lastPerformedDate: null,
                lastPerformedFormatted: 'No previous performance recorded.',
                previousSetsText: 'No previous performance recorded.',
                setLines: [],
                previousBestSetFormatted: 'No previous set recorded.',
                previousBestSet: null,
                allTimePrFormatted: pr && pr.heaviest && pr.heaviest.weightKg > 0 
                    ? `${pr.heaviest.weightKg} kg × ${pr.heaviest.reps} reps` 
                    : 'No PR recorded.',
                sets: []
            };
        }

        let bestSet = null;
        let bestWt = 0;
        let bestReps = 0;

        const mappedSets = (lastEx.sets || []).map((s, idx) => {
            const wt = parseFloat(s.weightKg ?? s.weight_kg ?? 0) || 0;
            const rp = parseInt(s.reps ?? 0, 10) || 0;
            const rpeRaw = s.rpe ?? s.rpe_value ?? null;
            const rpe = (rpeRaw !== null && rpeRaw !== undefined && rpeRaw !== '' && !isNaN(Number(rpeRaw))) 
                ? Number(rpeRaw) 
                : null;
            return {
                id: s.id || ('set_' + (idx + 1)),
                setNumber: Number(s.setNumber ?? s.set_number ?? (idx + 1)),
                weightKg: wt,
                reps: rp,
                rpe: rpe,
                completed: s.completed !== false,
                isWeightPr: !!s.isWeightPr,
                isRepPr: !!s.isRepPr
            };
        });

        const setStrings = mappedSets.map((s, idx) => {
            const wt = s.weightKg;
            const rp = s.reps;
            if (wt > bestWt || (wt === bestWt && rp > bestReps)) {
                bestWt = wt;
                bestReps = rp;
                bestSet = s;
            }
            const rpePart = s.rpe !== null ? ` @ RPE ${s.rpe}` : '';
            return `Set ${s.setNumber || idx + 1} — ${wt > 0 ? wt + ' kg' : 'Bodyweight'} × ${rp} reps${rpePart}`;
        });

        const bestSetFormatted = bestSet 
            ? `${parseFloat(bestSet.weightKg) || 0} kg × ${parseInt(bestSet.reps, 10) || 0} reps`
            : 'No previous set recorded.';

        let allTimePrFormatted = 'No PR recorded.';
        if (pr && pr.heaviest && pr.heaviest.weightKg > 0) {
            allTimePrFormatted = `${pr.heaviest.weightKg} kg × ${pr.heaviest.reps} reps`;
        }

        return {
            hasHistory: true,
            lastSessionDate: lastSession.date,
            lastPerformedDate: lastSession.date,
            lastPerformedFormatted: lastSession.date,
            previousSetsText: setStrings.join(' • '),
            setLines: setStrings,
            previousBestSetFormatted: bestSetFormatted,
            previousBestSet: bestSet ? { weightKg: bestSet.weightKg, reps: bestSet.reps, rpe: bestSet.rpe } : null,
            allTimePrFormatted,
            sets: mappedSets
        };
    },

    getPreviousComparableSession(targetMuscleGroups = null, routineName = null) {
        const currentRoutine = (routineName || this.liveWorkout?.routineName || '').trim().toLowerCase();
        const currentGroups = (targetMuscleGroups || this.liveWorkout?.targetMuscleGroups || []).map(g => (g || '').trim().toLowerCase());
        const currentId = this.liveWorkout?.id || ((typeof Store !== 'undefined' && Store.getActiveWorkoutSession) ? Store.getActiveWorkoutSession()?.id : null);
        
        const currentUserId = (typeof SupabaseService !== 'undefined' && SupabaseService.getUserId && SupabaseService.getUserId()) ||
                              (typeof Store !== 'undefined' && Store.getUserId && Store.getUserId()) || null;

        const sessions = (Store.getGymState().sessions || []).filter(s => {
            if (!s || !s.date || typeof s.date !== 'string') return false;
            if (currentId && s.id === currentId) return false;
            if (this.liveWorkout && s === this.liveWorkout) return false;
            if (s.isDeleted === true || s.deleted === true) return false;
            const status = (s.status || 'completed').toString().trim().toLowerCase();
            if (status === 'in_progress' || status === 'abandoned' || status === 'deleted') return false;
            if (status !== 'completed' && status !== 'done' && status !== 'finished') return false;
            if (currentUserId) {
                const sessUser = s.userId || s.user_id || null;
                if (sessUser && sessUser !== currentUserId && sessUser !== 'default_user') return false;
            }
            return true;
        });

        if (sessions.length === 0) return null;

        // Sort descending: newest to oldest
        sessions.sort((a, b) => {
            const dateA = (a.date || '').slice(0, 10);
            const dateB = (b.date || '').slice(0, 10);
            const dateCmp = dateB.localeCompare(dateA);
            if (dateCmp !== 0) return dateCmp;

            const timeA = a.completedAt || a.endedAt || a.startedAt || a.createdAt || a.created_at || '';
            const timeB = b.completedAt || b.endedAt || b.startedAt || b.createdAt || b.created_at || '';
            if (timeA && timeB) {
                const msA = new Date(timeA).getTime();
                const msB = new Date(timeB).getTime();
                if (!isNaN(msA) && !isNaN(msB) && msA !== msB) {
                    return msB - msA;
                }
                return timeB.localeCompare(timeA);
            }
            if (timeB && !timeA) return 1;
            if (timeA && !timeB) return -1;
            return 0;
        });

        for (let i = 0; i < sessions.length; i++) {
            const sess = sessions[i];
            const sessRoutine = (sess.routineName || sess.workoutType || '').trim().toLowerCase();
            const hasExercises = (sess.exercises || []).some(e => e && !e.skipped);
            if (!hasExercises) continue;

            if (currentRoutine && sessRoutine === currentRoutine) {
                return sess;
            }

            const sessGroups = (sess.targetMuscleGroups || []).map(g => (g || '').trim().toLowerCase());
            if (currentGroups.length > 0 && currentGroups.some(g => sessGroups.includes(g))) {
                return sess;
            }
        }

        for (let i = 0; i < sessions.length; i++) {
            const sess = sessions[i];
            if ((sess.exercises || []).some(e => e && !e.skipped)) {
                return sess;
            }
        }

        return null;
    },

    openViewPreviousExercisesModal() {
        const prevSess = this.getPreviousComparableSession();
        if (!prevSess) return;

        let modal = document.getElementById('viewPreviousExercisesModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'viewPreviousExercisesModal';
            document.body.appendChild(modal);
        }

        const validExercises = (prevSess.exercises || []).filter(e => !e.skipped);

        modal.innerHTML = `
            <div class="modal-window" style="width: min(540px, 94vw);">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">PREVIOUS WORKOUT PREVIEW</span>
                        <h3 class="wizard-modal-title">Exercises from ${prevSess.date}</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('viewPreviousExercisesModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 16px 20px; max-height: 60vh; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
                        Routine: <b style="color: #fff;">${prevSess.routineName || prevSess.workoutType}</b> · Total Volume: <b style="color: var(--gold);">${Math.round(prevSess.totalVolumeKg || 0)} kg</b>
                    </div>
                    ${validExercises.map((ex, idx) => {
                        const setSummary = (ex.sets || []).map(s => `${s.weightKg || 0}kg × ${s.reps || 0}`).join(', ');
                        return `
                            <div class="picker-ex-item" style="padding: 10px 14px;">
                                <div>
                                    <h5 style="margin: 0; color: #fff; font-size: 13.5px; font-weight: 700;">${idx + 1}. ${ex.name}</h5>
                                    <span style="font-size: 11px; color: var(--text-muted);">${ex.muscleGroup || 'General'} · ${setSummary || 'Completed'}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="modal-footer" style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <button class="action-btn-ghost" onclick="document.getElementById('viewPreviousExercisesModal').classList.remove('active')">Close</button>
                    <button class="btn-primary" onclick="document.getElementById('viewPreviousExercisesModal').classList.remove('active'); GymEngine.usePreviousWorkoutExercises();">
                        USE THESE EXERCISES ✓
                    </button>
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };

        modal.classList.add('active');
    },

    usePreviousWorkoutExercises() {
        const prevSess = this.getPreviousComparableSession();
        if (!prevSess || !this.liveWorkout) return;

        const library = Store.getExerciseLibrary();
        const validExercises = (prevSess.exercises || []).filter(e => !e.skipped);
        if (validExercises.length === 0) {
            showToast('No exercises found in previous workout.', 'warning');
            return;
        }

        if (this.liveWorkout.stage === 'select_exercises') {
            if (!this.liveWorkout.selectedExerciseIds) {
                this.liveWorkout.selectedExerciseIds = [];
            }
            validExercises.forEach(we => {
                const weName = (we.name || we.exerciseNameSnapshot || '').trim().toLowerCase();
                const matched = library.find(libEx => libEx.id === we.exerciseId || (libEx.name || '').trim().toLowerCase() === weName);
                const idToAdd = matched ? matched.id : (we.exerciseId || we.id);
                if (idToAdd && !this.liveWorkout.selectedExerciseIds.includes(idToAdd)) {
                    this.liveWorkout.selectedExerciseIds.push(idToAdd);
                }
            });
            Store.saveActiveWorkoutSession(this.liveWorkout);
            showToast(`Loaded ${validExercises.length} exercises from previous workout on ${prevSess.date}.`, 'success');
            this.render();
        } else {
            let addedCount = 0;
            validExercises.forEach(we => {
                const weName = (we.name || we.exerciseNameSnapshot || '').trim().toLowerCase();
                const matched = library.find(libEx => libEx.id === we.exerciseId || (libEx.name || '').trim().toLowerCase() === weName) || {
                    id: we.exerciseId || ('ex_' + Date.now()),
                    name: we.name || we.exerciseNameSnapshot || 'Exercise',
                    muscleGroup: we.muscleGroup || 'General',
                    equipment: we.equipment || 'Standard'
                };
                const alreadyExists = this.liveWorkout.exercises.some(e => 
                    (e.exerciseId && e.exerciseId === matched.id) ||
                    (e.name || '').trim().toLowerCase() === matched.name.toLowerCase()
                );
                if (!alreadyExists) {
                    const perf = this.getExercisePerformanceDetails(matched.name, matched.id);
                    this.liveWorkout.exercises.push({
                        id: 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        exerciseId: matched.id,
                        name: matched.name,
                        muscleGroup: matched.muscleGroup || 'General',
                        category: matched.category || matched.muscleGroup || 'General',
                        equipment: matched.equipment || 'Standard',
                        notes: matched.notes || '',
                        previousSets: perf.sets || [],
                        sets: [
                            { setNumber: 1, weightKg: '', reps: '', rpe: '', completed: false },
                            { setNumber: 2, weightKg: '', reps: '', rpe: '', completed: false },
                            { setNumber: 3, weightKg: '', reps: '', rpe: '', completed: false }
                        ],
                        skipped: false,
                        completed: false
                    });
                    addedCount++;
                }
            });
            Store.saveActiveWorkoutSession(this.liveWorkout);
            showToast(`Added ${addedCount} exercises from previous session.`, 'success');
            this.render();
        }
    },

    addAllUsualExercises() {
        if (!this.liveWorkout) return;
        const targetGroups = this.liveWorkout.targetMuscleGroups || [];
        const recs = this.getPersonalizedRecommendations(targetGroups, this.liveWorkout.routineName);
        const usual = recs.usual || [];
        if (usual.length === 0) {
            showToast('No usual exercises found to add.', 'info');
            return;
        }

        if (!this.liveWorkout.selectedExerciseIds) {
            this.liveWorkout.selectedExerciseIds = [];
        }

        usual.forEach(r => {
            if (!this.liveWorkout.selectedExerciseIds.includes(r.exercise.id)) {
                this.liveWorkout.selectedExerciseIds.push(r.exercise.id);
            }
        });

        Store.saveActiveWorkoutSession(this.liveWorkout);
        showToast(`Added ${usual.length} usual exercises to checklist.`, 'success');
        this.render();
    },

    // -------------------------------------------------------------------------
    // Stage 1: Exercise Selection UI
    // -------------------------------------------------------------------------
    renderExerciseSelectionHtml() {
        const sess = this.liveWorkout;
        const targetGroups = sess.targetMuscleGroups || [];
        const selectedIds = sess.selectedExerciseIds || [];
        const library = Store.getExerciseLibrary();

        // Selected exercise objects
        const selectedExercises = library.filter(e => selectedIds.includes(e.id));

        // 1. Personalized Recommendations & Usual Exercises
        const recs = this.getPersonalizedRecommendations(targetGroups, sess.routineName);
        const usual = recs.usual || [];

        // 2. Previous Comparable Workout
        const prevComparableSession = this.getPreviousComparableSession();

        return `
            <div class="ex-selection-container">
                <div class="ex-selection-header" style="margin-bottom: 20px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span class="twh-badge" style="background: rgba(245, 197, 24, 0.15); border: 1px solid rgba(245, 197, 24, 0.4); color: var(--gold); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                                TODAY'S WORKOUT
                            </span>
                            <span style="font-size: 11px; color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                <span>📸</span> CHECK-IN VERIFIED
                            </span>
                        </div>
                        <h2 style="margin: 2px 0; color: #fff; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">${sess.routineName}</h2>
                        <p style="color: var(--text-secondary); margin: 4px 0 0 0; font-size: 13px;">
                            ${targetGroups.join(' + ').toUpperCase()} · Select your exercises or continue from a previous workout.
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <button class="action-btn-ghost" style="padding: 8px 14px; font-size: 12.5px;" onclick="GymEngine.openCreateExerciseModal()">
                            ＋ Create Custom Exercise
                        </button>
                    </div>
                </div>

                <!-- 1. CONTINUE PREVIOUS WORKOUT (if comparable workout exists) -->
                ${prevComparableSession ? `
                    <div class="continue-prev-card">
                        <div class="continue-prev-info">
                            <span class="continue-prev-eyebrow">
                                <span>🔁</span> CONTINUE PREVIOUS WORKOUT
                            </span>
                            <h4 class="continue-prev-title">LAST COMPARABLE SESSION: ${prevComparableSession.date}</h4>
                            <span class="continue-prev-meta">
                                ${(prevComparableSession.exercises || []).filter(e => !e.skipped).length} exercises logged · ${Math.round(prevComparableSession.totalVolumeKg || 0)} kg total volume
                            </span>
                        </div>
                        <div class="continue-prev-actions">
                            <button type="button" class="action-btn-ghost" style="padding: 9px 16px; font-size: 12.5px;" onclick="GymEngine.openViewPreviousExercisesModal()">
                                VIEW EXERCISES
                            </button>
                            <button type="button" class="btn-primary" style="padding: 9px 20px; font-weight: 800; font-size: 13px;" onclick="GymEngine.usePreviousWorkoutExercises()">
                                USE THESE EXERCISES
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- 2. YOUR USUAL EXERCISES Section -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
                        <div>
                            <span style="font-size: 11px; color: var(--gold); font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">PERSONALIZED FOR YOU</span>
                            <h3 style="margin: 2px 0 0 0; color: #fff; font-size: 18px; font-weight: 800;">YOUR USUAL EXERCISES</h3>
                            <span style="font-size: 11.5px; color: var(--text-muted);">Based on your real workout history & today's split</span>
                        </div>
                        ${usual.length > 0 ? `
                            <button class="action-btn-ghost" style="font-size: 11.5px; padding: 4px 10px;" onclick="GymEngine.addAllUsualExercises()">
                                ＋ ADD ALL USUAL
                            </button>
                        ` : ''}
                    </div>

                    ${usual.length === 0 ? `
                        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px; color: var(--text-muted);">📋</span>
                            <div>
                                <h5 style="margin: 0; color: #fff; font-size: 13.5px; font-weight: 700;">No previous performance recorded.</h5>
                                <p style="margin: 2px 0 0 0; color: var(--text-muted); font-size: 11.5px;">Usual exercises will dynamically rank as you log authentic workouts. Choose exercises below to begin.</p>
                            </div>
                        </div>
                    ` : `
                        <div class="usual-exercises-grid">
                            ${usual.slice(0, 6).map(r => {
                                const ex = r.exercise;
                                const isSel = selectedIds.includes(ex.id);
                                const bestSetStr = r.previousBestSet ? `${r.previousBestSet.weightKg} kg × ${r.previousBestSet.reps} reps` : 'Recorded';
                                return `
                                    <div class="usual-ex-card ${isSel ? 'selected' : ''}">
                                        <div class="usual-ex-top">
                                            <div>
                                                <div class="usual-ex-name">${ex.name}</div>
                                                <span class="usual-ex-pill">${ex.muscleGroup} • ${ex.equipment || 'Standard'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                class="picker-add-action-btn ${isSel ? 'added' : ''}"
                                                onclick="GymEngine.toggleExerciseSelection('${ex.id}')"
                                            >
                                                ${isSel ? 'ADDED ✓' : '＋ ADD'}
                                            </button>
                                        </div>
                                        <div class="usual-ex-history">
                                            <div>Last performed: <span class="highlight-stat">${r.lastPerformedDate || 'Recent'}</span></div>
                                            <div>Previous best set: <span class="highlight-stat">${bestSetStr}</span></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- 3. TODAY'S WORKOUT SPLIT -->
                <div style="margin-bottom: 24px;">
                    <div style="margin-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
                        <span style="font-size: 11px; color: var(--gold); font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">TODAY'S SPLIT</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff; font-size: 18px; font-weight: 800;">RECOMMENDED FOR TODAY</h3>
                        <span style="font-size: 11.5px; color: var(--text-muted);">${targetGroups.join(' + ')} exercises</span>
                    </div>

                    ${targetGroups.map(mg => {
                        const groupExs = Store.getExerciseLibrary({
                            muscleGroup: mg,
                            search: this.exerciseSearchQuery
                        });

                        return `
                            <div class="ex-category-block" style="margin-bottom: 14px;">
                                <div class="ex-category-title">
                                    <span>💪</span>
                                    <span>${mg.toUpperCase()} EXERCISES</span>
                                    <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">(${groupExs.length} available)</span>
                                </div>
                                <div class="ex-chips-grid">
                                    ${groupExs.map(ex => {
                                        const isSel = selectedIds.includes(ex.id);
                                        return `
                                            <button
                                                type="button"
                                                class="ex-picker-chip ${isSel ? 'selected' : ''}"
                                                onclick="GymEngine.toggleExerciseSelection('${ex.id}')"
                                            >
                                                <span class="chip-icon">${isSel ? '✓' : '＋'}</span>
                                                <span>${ex.name}</span>
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- 4. ALL EXERCISES / SEARCH BAR & CATALOGUE ENTRY -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
                        <div>
                            <span style="font-size: 11px; color: var(--gold); font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">COMPLETE LIBRARY</span>
                            <h3 style="margin: 2px 0 0 0; color: #fff; font-size: 18px; font-weight: 800;">ALL EXERCISES</h3>
                        </div>
                        <button class="btn-primary" style="padding: 7px 14px; font-size: 12px; font-weight: 700;" onclick="GymEngine.openExercisePickerModal({ mode: 'selection' })">
                            ＋ BROWSE COMPLETE CATALOGUE
                        </button>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <input
                            type="text"
                            class="form-input"
                            placeholder="Quick search exercises by name, muscle group, or equipment..."
                            value="${this.exerciseSearchQuery}"
                            oninput="GymEngine.onExerciseSearch(this.value)"
                            style="width: 100%; max-width: 520px;"
                        >
                    </div>

                    ${this.exerciseSearchQuery ? `
                        <div class="ex-category-block">
                            <div class="ex-category-title">
                                <span>🔍</span>
                                <span>MATCHING EXERCISES</span>
                            </div>
                            <div class="ex-chips-grid">
                                ${Store.getExerciseLibrary({ search: this.exerciseSearchQuery })
                                    .map(ex => {
                                        const isSel = selectedIds.includes(ex.id);
                                        return `
                                            <button
                                                type="button"
                                                class="ex-picker-chip ${isSel ? 'selected' : ''}"
                                                onclick="GymEngine.toggleExerciseSelection('${ex.id}')"
                                            >
                                                <span class="chip-icon">${isSel ? '✓' : '＋'}</span>
                                                <span>${ex.name} (${ex.muscleGroup})</span>
                                            </button>
                                        `;
                                    }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- 5. TODAY'S EXERCISES Shelf -->
                <div class="today-ex-shelf">
                    <div class="today-shelf-header">
                        <div>
                            <span style="font-size: 11px; color: var(--gold); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">STAGED FOR TODAY</span>
                            <h4 style="margin: 2px 0 0 0; color: #fff; font-size: 16px;">
                                TODAY'S EXERCISES (${selectedExercises.length} selected)
                            </h4>
                        </div>
                        <button
                            type="button"
                            class="btn-primary"
                            style="padding: 10px 24px; font-weight: 800; font-size: 13.5px;"
                            ${selectedExercises.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                            onclick="GymEngine.startLoggingSelectedExercises()"
                        >
                            START LOGGING (${selectedExercises.length}) →
                        </button>
                    </div>

                    <div class="today-shelf-list">
                        ${selectedExercises.length > 0 ? selectedExercises.map(ex => `
                            <div class="today-shelf-item">
                                <span>✓ ${ex.name}</span>
                                <button type="button" class="btn-remove-chip" aria-label="Remove ${ex.name}" onclick="GymEngine.toggleExerciseSelection('${ex.id}')">×</button>
                            </div>
                        `).join('') : `
                            <span style="color: var(--text-muted); font-size: 12.5px;">Click any exercise card or chip above to stage it for today's workout.</span>
                        `}
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                    <button class="action-btn-ghost danger" onclick="GymEngine.cancelLiveWorkout()">
                        Discard Session
                    </button>
                </div>
            </div>
        `;
    },

    onExerciseSearch(query) {
        this.exerciseSearchQuery = query;
        this.render();
    },

    toggleExerciseSelection(exId) {
        if (!this.liveWorkout) return;
        if (!this.liveWorkout.selectedExerciseIds) {
            this.liveWorkout.selectedExerciseIds = [];
        }

        const idx = this.liveWorkout.selectedExerciseIds.indexOf(exId);
        if (idx >= 0) {
            this.liveWorkout.selectedExerciseIds.splice(idx, 1);
        } else {
            this.liveWorkout.selectedExerciseIds.push(exId);
        }

        Store.saveActiveWorkoutSession(this.liveWorkout);
        this.render();
    },

    startLoggingSelectedExercises() {
        if (!this.liveWorkout) return;
        const selectedIds = this.liveWorkout.selectedExerciseIds || [];
        if (selectedIds.length === 0) {
            showToast('Please select at least 1 exercise to begin logging.', 'warning');
            return;
        }

        const library = Store.getExerciseLibrary();
        const liveExercises = selectedIds.map(id => {
            const def = library.find(e => e.id === id || (e.name || '').toLowerCase() === String(id).toLowerCase()) || { name: 'Exercise', muscleGroup: 'General' };
            const perf = this.getExercisePerformanceDetails(def.name, def.id);

            return {
                id: def.id || 'ex_' + Date.now(),
                exerciseId: def.id,
                name: def.name,
                muscleGroup: def.muscleGroup || 'General',
                category: def.category || def.muscleGroup || 'General',
                equipment: def.equipment || 'Standard',
                notes: def.notes || '',
                previousSets: perf.sets || [],
                sets: [
                    { setNumber: 1, weightKg: '', reps: '', rpe: '', completed: false },
                    { setNumber: 2, weightKg: '', reps: '', rpe: '', completed: false },
                    { setNumber: 3, weightKg: '', reps: '', rpe: '', completed: false }
                ],
                skipped: false,
                completed: false
            };
        });

        this.liveWorkout.exercises = liveExercises;
        this.liveWorkout.stage = 'logging';
        Store.saveActiveWorkoutSession(this.liveWorkout);
        this.render();
    },

    // -------------------------------------------------------------------------
    // Stage 2: Set Logging UI (Weight kg, Reps, RPE, Rest Timer, PRs)
    // -------------------------------------------------------------------------
    renderSetLoggingHtml() {
        const sess = this.liveWorkout;
        if (!sess) return '';

        let totalVolume = 0;
        let totalCompletedSets = 0;

        sess.exercises.forEach(ex => {
            if (!ex.skipped) {
                (ex.sets || []).forEach(s => {
                    if (s.completed && s.weightKg && s.reps) {
                        totalCompletedSets++;
                        totalVolume += ((parseFloat(s.weightKg) || 0) * (parseInt(s.reps, 10) || 0));
                    }
                });
            }
        });

        return `
            <div class="live-workout-container">
                <!-- Live Workout Header -->
                <div class="live-workout-header">
                    <div class="lwh-left">
                        <span class="live-pulse-dot"></span>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 11px; color: var(--gold); text-transform: uppercase; font-weight: 800;">LIVE LOGGING</span>
                                <span class="twh-badge completed" style="margin: 0; padding: 2px 8px; font-size: 10px;">📸 Check-In Verified</span>
                            </div>
                            <h3 style="margin: 3px 0 0 0; color: #fff; font-size: 20px;">${sess.routineName}</h3>
                        </div>
                    </div>
                    <div class="lwh-right">
                        <div class="lwh-metric">
                            <span>Completed Volume:</span>
                            <b style="color: var(--sky);">${Math.round(totalVolume)} kg</b>
                        </div>
                        <div class="lwh-metric">
                            <span>Completed Sets:</span>
                            <b>${totalCompletedSets}</b>
                        </div>
                        <button class="btn-primary" style="padding: 9px 18px; font-weight: 800;" onclick="GymEngine.finishLiveWorkout()">
                            Finish Workout ✓
                        </button>
                        <button class="action-btn-ghost danger" style="padding: 9px 12px;" onclick="GymEngine.cancelLiveWorkout()">
                            Discard
                        </button>
                    </div>
                </div>

                <!-- Rest Timer Floating/Inline Bar -->
                <div class="rest-timer-bar" style="margin-top: 14px;">
                    <div class="rest-timer-display">
                        <span style="font-size: 18px;">⏱</span>
                        <div>
                            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Rest Timer</span>
                            <div class="rest-timer-clock" id="restTimerDisplay">${this.formatTimerSeconds(this.restTimerState.remainingSec)}</div>
                        </div>
                    </div>
                    <div class="rest-preset-btns">
                        <button class="btn-rest-preset" onclick="GymEngine.startRestTimer(30)">30s</button>
                        <button class="btn-rest-preset" onclick="GymEngine.startRestTimer(60)">60s</button>
                        <button class="btn-rest-preset" onclick="GymEngine.startRestTimer(90)">90s</button>
                        <button class="btn-rest-preset" onclick="GymEngine.startRestTimer(120)">120s</button>
                        <button class="btn-rest-preset" onclick="GymEngine.startRestTimer(180)">180s</button>
                        <button class="action-btn-ghost" style="padding: 5px 10px; font-size: 11.5px;" onclick="GymEngine.promptCustomRestTimer()">Custom</button>
                        ${this.restTimerState.isRunning ? `
                            <button class="action-btn-ghost danger" style="padding: 5px 10px; font-size: 11.5px;" onclick="GymEngine.stopRestTimer()">Stop</button>
                        ` : ''}
                    </div>
                </div>

                <!-- Exercise List -->
                <div class="live-exercises-stack" style="margin-top: 18px;">
                    ${sess.exercises.map((ex, exIdx) => {
                        if (ex.skipped) {
                            return `
                                <div class="live-ex-card skipped">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: var(--text-muted); text-decoration: line-through;">${ex.name} (Skipped)</span>
                                        <button class="action-btn-ghost" style="font-size: 11px; padding: 4px 8px;" onclick="GymEngine.unskipExercise(${exIdx})">
                                            Restore Exercise
                                        </button>
                                    </div>
                                </div>
                            `;
                        }

                        const perf = this.getExercisePerformanceDetails(ex.name, ex.exerciseId);
                        const prevSets = (perf.hasHistory && perf.sets && perf.sets.length > 0) ? perf.sets : (ex.previousSets && ex.previousSets.length > 0 ? ex.previousSets : []);
                        if (perf.hasHistory && perf.sets && perf.sets.length > 0) {
                            ex.previousSets = perf.sets;
                        }
                        const prevRefText = perf.hasHistory
                            ? perf.previousSetsText
                            : 'No previous performance recorded.';

                        return `
                            <div class="live-ex-card ${ex.completed ? 'completed' : ''}">
                                <div class="live-ex-header">
                                    <div class="lex-title-box">
                                        <span class="lex-name">${ex.name}</span>
                                        <span class="lex-muscle">${ex.muscleGroup || 'General'}</span>
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="action-btn-ghost" style="font-size: 11px; padding: 4px 8px;" onclick="GymEngine.skipExercise(${exIdx})">
                                            Skip
                                        </button>
                                    </div>
                                </div>

                                <!-- Previous Performance as Reference -->
                                <div class="live-ex-prev-box">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                        <span class="prev-title">⏮ Previous session ${perf.hasHistory ? `(${perf.lastSessionDate})` : ''}:</span>
                                        ${perf.allTimePrFormatted !== 'No PR recorded.' ? `
                                            <span class="pr-badge-pill" style="font-size: 11px; background: rgba(96, 165, 250, 0.15); border: 1px solid rgba(96, 165, 250, 0.35); color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                                                🏆 ALL-TIME PR: ${perf.allTimePrFormatted}
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="prev-content" style="margin-top: 6px;">
                                        ${perf.hasHistory && perf.setLines && perf.setLines.length > 0 ? `
                                            <div style="display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: #cbd5e1;">
                                                ${perf.setLines.map(line => `<span>${line}</span>`).join('')}
                                            </div>
                                        ` : `<span style="font-size: 12px; color: var(--text-muted);">${prevRefText}</span>`}
                                    </div>
                                </div>

                                <!-- Sets Table -->
                                <div class="live-sets-table">
                                    <div style="padding: 6px 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; color: var(--gold); text-transform: uppercase; background: rgba(245, 197, 24, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                        TODAY'S PERFORMANCE (SETS)
                                    </div>
                                    <div class="set-row header">
                                        <span class="col-num">Set</span>
                                        <span class="col-prev">Previous</span>
                                        <span class="col-wt">Weight (kg)</span>
                                        <span class="col-rp">Reps</span>
                                        <span class="col-rpe">RPE</span>
                                        <span class="col-prog">Progression</span>
                                        <span class="col-act">Complete</span>
                                    </div>

                                    ${ex.sets.map((s, sIdx) => {
                                        const prevS = prevSets[sIdx];
                                        const prevStr = prevS ? `${prevS.weightKg} × ${prevS.reps}` : '—';

                                        let progIndicator = '';
                                        if (prevS && s.weightKg && s.reps) {
                                            const curWt = parseFloat(s.weightKg) || 0;
                                            const curRp = parseInt(s.reps, 10) || 0;
                                            const pWt = parseFloat(prevS.weightKg) || 0;
                                            const pRp = parseInt(prevS.reps, 10) || 0;

                                            if (curWt > pWt) {
                                                progIndicator = '<span class="pr-badge weight">↑ Weight PR</span>';
                                            } else if (curWt === pWt && curRp > pRp) {
                                                progIndicator = '<span class="pr-badge reps">↑ Rep PR</span>';
                                            }
                                        }

                                        return `
                                            <div class="set-row ${s.completed ? 'is-done' : ''}">
                                                <span class="col-num">Set ${s.setNumber}</span>
                                                <span class="col-prev">${prevStr}</span>
                                                <div class="col-wt">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        class="set-input"
                                                        placeholder="kg"
                                                        value="${s.weightKg}"
                                                        oninput="GymEngine.updateSetField(${exIdx}, ${sIdx}, 'weightKg', this.value)"
                                                    >
                                                </div>
                                                <div class="col-rp">
                                                    <input
                                                        type="number"
                                                        class="set-input"
                                                        placeholder="reps"
                                                        value="${s.reps}"
                                                        oninput="GymEngine.updateSetField(${exIdx}, ${sIdx}, 'reps', this.value)"
                                                    >
                                                </div>
                                                <div class="col-rpe">
                                                    <div class="set-rpe-selector">
                                                        ${[6, 7, 8, 9, 10].map(r => `
                                                            <button
                                                                type="button"
                                                                class="btn-rpe-chip ${s.rpe == r ? 'active' : ''}"
                                                                onclick="GymEngine.toggleSetRpe(${exIdx}, ${sIdx}, ${r})"
                                                            >${r}</button>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                                <div class="col-prog">${progIndicator}</div>
                                                <div class="col-act">
                                                    <button
                                                        type="button"
                                                        class="btn-check-set ${s.completed ? 'checked' : ''}"
                                                        onclick="GymEngine.toggleSetDone(${exIdx}, ${sIdx})"
                                                    >
                                                        ${s.completed ? '✓' : '○'}
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>

                                <div class="live-ex-actions-row">
                                    <button class="action-btn-ghost" style="padding: 5px 12px; font-size: 12px;" onclick="GymEngine.addLiveSet(${exIdx})">
                                        ＋ Add Set
                                    </button>
                                    <button class="action-btn-ghost" style="padding: 5px 12px; font-size: 12px; margin-left: auto;" onclick="GymEngine.completeExercise(${exIdx})">
                                        ${ex.completed ? '✓ Exercise Completed' : 'Mark Exercise Complete'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Footer Action Bar -->
                <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <button class="action-btn-ghost" style="font-weight: 700; padding: 10px 18px;" onclick="GymEngine.openAddExerciseDuringWorkoutModal()">
                        ＋ Add Exercise to Workout
                    </button>
                    <button class="btn-primary" style="padding: 12px 28px; font-weight: 800; font-size: 14px;" onclick="GymEngine.finishLiveWorkout()">
                        Finish Workout & Save Permanently ✓
                    </button>
                </div>
            </div>
        `;
    },

    updateSetField(exIdx, sIdx, field, val) {
        if (this.liveWorkout?.exercises[exIdx]?.sets[sIdx]) {
            this.liveWorkout.exercises[exIdx].sets[sIdx][field] = val;
            Store.saveActiveWorkoutSession(this.liveWorkout);
        }
    },

    toggleSetRpe(exIdx, sIdx, rpeVal) {
        const set = this.liveWorkout?.exercises[exIdx]?.sets[sIdx];
        if (set) {
            set.rpe = set.rpe == rpeVal ? '' : rpeVal;
            Store.saveActiveWorkoutSession(this.liveWorkout);
            this.render();
        }
    },

    toggleSetDone(exIdx, sIdx) {
        const set = this.liveWorkout?.exercises[exIdx]?.sets[sIdx];
        if (set) {
            set.completed = !set.completed;
            Store.saveActiveWorkoutSession(this.liveWorkout);

            // Automatically offer rest timer if completed with valid reps
            if (set.completed && set.reps && !this.restTimerState.isRunning) {
                this.startRestTimer(60);
            }

            this.render();
        }
    },

    addLiveSet(exIdx) {
        const sets = this.liveWorkout?.exercises[exIdx]?.sets;
        if (sets) {
            const nextNum = sets.length + 1;
            sets.push({
                setNumber: nextNum,
                weightKg: '',
                reps: '',
                rpe: '',
                completed: false
            });
            Store.saveActiveWorkoutSession(this.liveWorkout);
            this.render();
        }
    },

    completeExercise(exIdx) {
        const ex = this.liveWorkout?.exercises[exIdx];
        if (ex) {
            ex.completed = true;
            ex.sets.forEach(s => {
                if (s.weightKg && s.reps) s.completed = true;
            });
            Store.saveActiveWorkoutSession(this.liveWorkout);
            this.render();
        }
    },

    skipExercise(exIdx) {
        const ex = this.liveWorkout?.exercises[exIdx];
        if (ex) {
            ex.skipped = true;
            Store.saveActiveWorkoutSession(this.liveWorkout);
            this.render();
        }
    },

    unskipExercise(exIdx) {
        const ex = this.liveWorkout?.exercises[exIdx];
        if (ex) {
            ex.skipped = false;
            Store.saveActiveWorkoutSession(this.liveWorkout);
            this.render();
        }
    },

    openAddExerciseDuringWorkoutModal() {
        this.openExercisePickerModal({ mode: 'workout' });
    },

    openExercisePickerModal(options = {}) {
        this.exercisePickerState = {
            isOpen: true,
            mode: options.mode || 'workout',
            query: '',
            filter: 'all'
        };

        let modal = document.getElementById('exercisePickerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'exercisePickerModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) {
                GymEngine.closeExercisePickerModal();
            }
        };

        if (typeof document !== 'undefined' && document.body) {
            document.body.style.overflow = 'hidden';
        }
        this.renderExercisePickerModalUI();
        modal.classList.add('active');

        setTimeout(() => {
            const inp = document.getElementById('exercisePickerSearchInput');
            if (inp && typeof inp.focus === 'function') inp.focus();
        }, 80);
    },

    closeExercisePickerModal() {
        const modal = document.getElementById('exercisePickerModal');
        if (modal) {
            modal.classList.remove('active');
        }
        if (typeof document !== 'undefined' && document.body) {
            document.body.style.overflow = '';
        }
        if (this.exercisePickerState) {
            this.exercisePickerState.isOpen = false;
        }
    },

    onPickerSearchInput(val) {
        if (!this.exercisePickerState) return;
        this.exercisePickerState.query = val;
        this.renderExercisePickerModalUI();
    },

    setPickerFilter(filterKey) {
        if (!this.exercisePickerState) return;
        this.exercisePickerState.filter = filterKey;
        this.renderExercisePickerModalUI();
    },

    selectPickerExercise(exId) {
        const library = Store.getExerciseLibrary();
        const ex = library.find(e => e.id === exId);
        if (!ex) return;

        if (this.exercisePickerState?.mode === 'selection') {
            this.toggleExerciseSelection(ex.id);
            this.renderExercisePickerModalUI();
        } else if (this.exercisePickerState?.mode === 'edit_workout') {
            this.addExerciseToEditingWorkout(ex);
        } else {
            this.addExerciseToActiveWorkout(ex);
        }
    },

    addExerciseToActiveWorkout(exerciseOrId) {
        if (!this.liveWorkout) return;
        if (!this.liveWorkout.exercises) this.liveWorkout.exercises = [];

        const library = Store.getExerciseLibrary();
        let targetEx = null;
        if (typeof exerciseOrId === 'object' && exerciseOrId !== null) {
            targetEx = exerciseOrId;
        } else {
            targetEx = library.find(e => e.id === exerciseOrId || (e.name || '').trim().toLowerCase() === String(exerciseOrId).trim().toLowerCase());
        }

        if (!targetEx) {
            showToast('Exercise not found in library.', 'error');
            return;
        }

        const normName = (targetEx.name || '').trim().toLowerCase();

        // Prevent accidental duplicates in active session
        const alreadyExists = this.liveWorkout.exercises.some(e => 
            (e.exerciseId && e.exerciseId === targetEx.id) || 
            (e.name || '').trim().toLowerCase() === normName
        );

        if (alreadyExists) {
            showToast(`${targetEx.name} is already in today's workout.`, 'warning');
            return;
        }

        const perf = this.getExercisePerformanceDetails(targetEx.name, targetEx.id);

        const newWorkoutExercise = {
            id: 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            exerciseId: targetEx.id,
            name: targetEx.name,
            muscleGroup: targetEx.muscleGroup || 'General',
            category: targetEx.category || targetEx.muscleGroup || 'General',
            equipment: targetEx.equipment || 'Standard',
            notes: targetEx.notes || '',
            previousSets: perf.sets || [],
            sets: [
                { setNumber: 1, weightKg: '', reps: '', rpe: '', completed: false },
                { setNumber: 2, weightKg: '', reps: '', rpe: '', completed: false },
                { setNumber: 3, weightKg: '', reps: '', rpe: '', completed: false }
            ],
            skipped: false,
            completed: false
        };

        this.liveWorkout.exercises.push(newWorkoutExercise);
        Store.saveActiveWorkoutSession(this.liveWorkout);

        showToast('Exercise added to workout.', 'success');
        this.closeExercisePickerModal();
        this.render();
    },

    renderExercisePickerModalUI() {
        const modal = document.getElementById('exercisePickerModal');
        if (!modal) return;

        const state = this.exercisePickerState || { query: '', filter: 'all', mode: 'workout' };
        const query = (state.query || '').trim().toLowerCase();
        const activeFilter = state.filter || 'all';
        const mode = state.mode || 'workout';

        const library = Store.getExerciseLibrary();
        const sess = this.liveWorkout;
        const targetGroups = sess ? (sess.targetMuscleGroups || []) : [];
        const routineName = sess ? (sess.routineName || '') : '';

        const existingInWorkoutNames = new Set();
        const existingInWorkoutIds = new Set();
        if (sess) {
            if (mode === 'workout') {
                (sess.exercises || []).forEach(e => {
                    if (e.name) existingInWorkoutNames.add(e.name.trim().toLowerCase());
                    if (e.exerciseId) existingInWorkoutIds.add(e.exerciseId);
                    if (e.id) existingInWorkoutIds.add(e.id);
                });
            } else {
                (sess.selectedExerciseIds || []).forEach(id => existingInWorkoutIds.add(id));
            }
        }

        const recs = this.getPersonalizedRecommendations(targetGroups, routineName);
        const usual = recs.usual || [];
        const recommendedForSplit = recs.recommendedForSplit || [];

        const filterChips = [
            { id: 'all', label: 'ALL EXERCISES' },
            { id: 'usual', label: `YOUR USUAL (${usual.length})` },
            { id: 'recommended', label: `RECOMMENDED (${recommendedForSplit.length})` },
            { id: 'back', label: 'Back' },
            { id: 'biceps', label: 'Biceps' },
            { id: 'chest', label: 'Chest' },
            { id: 'triceps', label: 'Triceps' },
            { id: 'legs', label: 'Legs' },
            { id: 'shoulders', label: 'Shoulders' },
            { id: 'core', label: 'Core' }
        ];

        let displayList = [];
        let isGroupedView = false;

        if (query) {
            displayList = library.filter(e => {
                const name = (e.name || '').toLowerCase();
                const mg = (e.muscleGroup || '').toLowerCase();
                const cat = (e.category || '').toLowerCase();
                const eq = (e.equipment || '').toLowerCase();
                return name.includes(query) || mg.includes(query) || cat.includes(query) || eq.includes(query);
            });
        } else if (activeFilter === 'usual') {
            displayList = usual.map(u => u.exercise);
        } else if (activeFilter === 'recommended') {
            displayList = recommendedForSplit.map(r => r.exercise);
        } else if (activeFilter !== 'all') {
            displayList = library.filter(e => (e.muscleGroup || '').toLowerCase() === activeFilter.toLowerCase());
        } else {
            isGroupedView = true;
        }

        const renderPickerItem = (ex) => {
            const normName = (ex.name || '').trim().toLowerCase();
            const isAlreadyAdded = mode === 'workout'
                ? (existingInWorkoutIds.has(ex.id) || existingInWorkoutNames.has(normName))
                : existingInWorkoutIds.has(ex.id);

            const perf = this.getExercisePerformanceDetails(ex.name, ex.id);

            return `
                <div class="picker-ex-item ${isAlreadyAdded ? 'already-added' : ''}">
                    <div class="picker-ex-details">
                        <div class="picker-ex-header-row">
                            <span class="picker-ex-name-text">${ex.name}</span>
                            <span class="picker-ex-badge">${ex.muscleGroup || 'General'}</span>
                            <span class="picker-ex-badge">${ex.equipment || 'Standard'}</span>
                            ${isAlreadyAdded ? `
                                <span style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                                    ✓ IN WORKOUT
                                </span>
                            ` : ''}
                        </div>
                        <div class="picker-ex-perf-row">
                            ${perf.hasHistory ? `
                                <span>Last performed: <b style="color: var(--gold);">${perf.lastPerformedFormatted}</b></span>
                                <span>•</span>
                                <span>Best set: <b style="color: var(--gold);">${perf.previousBestSetFormatted}</b></span>
                                ${perf.allTimePrFormatted !== 'No PR recorded.' ? `
                                    <span>•</span>
                                    <span style="color: #93c5fd; font-weight: 700;">PR: ${perf.allTimePrFormatted}</span>
                                ` : ''}
                            ` : `
                                <span>No previous performance recorded.</span>
                            `}
                        </div>
                    </div>
                    <button
                        type="button"
                        class="picker-add-action-btn ${isAlreadyAdded ? 'added' : ''}"
                        ${isAlreadyAdded ? 'disabled' : ''}
                        onclick="GymEngine.selectPickerExercise('${ex.id}')"
                    >
                        ${isAlreadyAdded ? '✓ IN WORKOUT' : '＋ ADD EXERCISE'}
                    </button>
                </div>
            `;
        };

        modal.innerHTML = `
            <div class="exercise-picker-window modal-window">
                <!-- Modal Header -->
                <div class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <div>
                        <h3 class="wizard-modal-title" style="margin: 0; color: #fff; font-size: 19px; font-weight: 800; letter-spacing: 0.5px;">
                            ADD EXERCISE
                        </h3>
                        <p style="margin: 3px 0 0 0; font-size: 12.5px; color: var(--text-muted);">
                            Choose an exercise for your current workout.
                        </p>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Close" onclick="GymEngine.closeExercisePickerModal()">×</button>
                </div>

                <!-- Search Bar & Filters -->
                <div class="picker-search-bar">
                    <input
                        type="text"
                        id="exercisePickerSearchInput"
                        class="form-input"
                        placeholder="Search exercises..."
                        value="${state.query || ''}"
                        oninput="GymEngine.onPickerSearchInput(this.value)"
                        style="width: 100%; font-size: 13.5px; padding: 10px 14px;"
                    >
                    <div class="picker-filter-chips">
                        ${filterChips.map(c => `
                            <button
                                type="button"
                                class="picker-filter-chip ${activeFilter === c.id ? 'active' : ''}"
                                onclick="GymEngine.setPickerFilter('${c.id}')"
                            >
                                ${c.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Picker Body (Scrollable) -->
                <div class="picker-body-scroll">
                    ${isGroupedView ? `
                        <!-- A. YOUR USUAL EXERCISES -->
                        <div class="picker-section">
                            <div class="picker-section-header">
                                <span>⭐ YOUR USUAL EXERCISES</span>
                                <span>${usual.length} available</span>
                            </div>
                            ${usual.length === 0 ? `
                                <div style="font-size: 12px; color: var(--text-muted); padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border-radius: 6px;">
                                    No previous performance recorded. Usual exercises will rank as you log workouts.
                                </div>
                            ` : usual.map(u => renderPickerItem(u.exercise)).join('')}
                        </div>

                        <!-- B. RECOMMENDED FOR TODAY -->
                        <div class="picker-section">
                            <div class="picker-section-header">
                                <span>🎯 RECOMMENDED FOR TODAY (${targetGroups.join(' + ')})</span>
                                <span>${recommendedForSplit.length} exercises</span>
                            </div>
                            ${recommendedForSplit.map(r => renderPickerItem(r.exercise)).join('')}
                        </div>

                        <!-- C. ALL EXERCISES -->
                        <div class="picker-section">
                            <div class="picker-section-header">
                                <span>📚 ALL EXERCISES</span>
                                <span>${library.length} total</span>
                            </div>
                            ${library.map(ex => renderPickerItem(ex)).join('')}
                        </div>
                    ` : `
                        <!-- Filtered List / Search Results -->
                        ${displayList.length === 0 ? `
                            <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
                                <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔍</span>
                                <h4 style="color: #fff; margin: 0 0 6px 0; font-size: 16px;">No exercises matching "${state.query}"</h4>
                                <p style="font-size: 12.5px; margin: 0 0 16px 0;">Try searching another keyword or create a custom exercise.</p>
                                <button class="btn-primary" style="padding: 8px 18px; font-size: 12.5px;" onclick="GymEngine.openCreateExerciseModal()">
                                    ＋ Create Custom Exercise
                                </button>
                            </div>
                        ` : `
                            <div class="picker-section">
                                <div class="picker-section-header">
                                    <span>${query ? `SEARCH RESULTS FOR "${query}"` : activeFilter.toUpperCase()}</span>
                                    <span>${displayList.length} exercises</span>
                                </div>
                                ${displayList.map(ex => renderPickerItem(ex)).join('')}
                            </div>
                        `}
                    `}
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer" style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); background: #0c1018;">
                    <button class="action-btn-ghost" style="font-size: 12.5px; padding: 8px 14px;" onclick="GymEngine.openCreateExerciseModal()">
                        ＋ Create Custom Exercise
                    </button>
                    <button class="action-btn-ghost" style="font-size: 12.5px; padding: 8px 18px;" onclick="GymEngine.closeExercisePickerModal()">
                        Close
                    </button>
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // Rest Timer System
    // -------------------------------------------------------------------------
    formatTimerSeconds(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    },

    startRestTimer(seconds) {
        this.stopRestTimer();
        this.restTimerState.totalSec = seconds;
        this.restTimerState.remainingSec = seconds;
        this.restTimerState.isRunning = true;

        this.updateRestTimerDisplay();

        this.restTimerState.timerId = setInterval(() => {
            this.restTimerState.remainingSec--;
            this.updateRestTimerDisplay();

            if (this.restTimerState.remainingSec <= 0) {
                this.stopRestTimer();
                showToast('⏱ Rest period complete! Get ready for your next set.', 'info');
            }
        }, 1000);
    },

    stopRestTimer() {
        if (this.restTimerState.timerId) {
            clearInterval(this.restTimerState.timerId);
            this.restTimerState.timerId = null;
        }
        this.restTimerState.isRunning = false;
        this.updateRestTimerDisplay();
    },

    openCustomRestTimerModal() {
        let modal = document.getElementById('customRestTimerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'customRestTimerModal';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
            <div class="modal-window" style="width: min(380px, 92vw);">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">REST TIMER</span>
                        <h3 class="wizard-modal-title">Custom Rest Duration</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('customRestTimerModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 18px 20px;">
                    <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">Duration in seconds:</label>
                    <input type="number" id="customRestTimerSec" class="form-input" value="75" min="5" max="600" style="width: 100%; font-size: 16px; font-weight: 700;">
                    <div style="display: flex; gap: 6px; margin-top: 10px;">
                        <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11px;" onclick="document.getElementById('customRestTimerSec').value = 45">45s</button>
                        <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11px;" onclick="document.getElementById('customRestTimerSec').value = 75">75s</button>
                        <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11px;" onclick="document.getElementById('customRestTimerSec').value = 150">150s</button>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="action-btn-ghost" onclick="document.getElementById('customRestTimerModal').classList.remove('active')">Cancel</button>
                    <button class="btn-primary" onclick="GymEngine.applyCustomRestTimer()">Start Timer</button>
                </div>
            </div>
        `;
        modal.classList.add('active');
        const inp = document.getElementById('customRestTimerSec');
        if (inp) {
            if (typeof inp.focus === 'function') inp.focus();
            if (typeof inp.select === 'function') inp.select();
        }
    },

    applyCustomRestTimer() {
        const inp = document.getElementById('customRestTimerSec');
        const val = parseInt(inp?.value, 10);
        if (val && val > 0) {
            this.startRestTimer(val);
        }
        const modal = document.getElementById('customRestTimerModal');
        if (modal) modal.classList.remove('active');
    },

    promptCustomRestTimer() {
        this.openCustomRestTimerModal();
    },

    updateRestTimerDisplay() {
        const el = document.getElementById('restTimerDisplay');
        if (el) {
            el.textContent = this.formatTimerSeconds(this.restTimerState.remainingSec);
        }
    },

    // -------------------------------------------------------------------------
    // Finish Workout & Cancellation
    // -------------------------------------------------------------------------
    finishLiveWorkout() {
        if (!this.liveWorkout) return;

        // Auto-complete filled sets before saving
        let hasAnyCompleted = false;
        this.liveWorkout.exercises.forEach(ex => {
            if (!ex.skipped) {
                (ex.sets || []).forEach(s => {
                    if (s.weightKg && s.reps) {
                        s.completed = true;
                        hasAnyCompleted = true;
                    }
                });
            }
        });

        if (!hasAnyCompleted) {
            if (!confirm('No completed sets with weight and reps logged. Finish and save anyway?')) {
                return;
            }
        }

        const durationMinutes = Math.max(1, Math.round((Date.now() - (this.liveWorkout.startTimestamp || Date.now())) / 60000));

        const savedSession = Store.saveWorkoutSession({
            ...this.liveWorkout,
            durationMinutes,
            endedAt: DateUtils.nowISO()
        });

        this.stopRestTimer();
        this.liveWorkout = null;
        Store.clearActiveWorkoutSession();

        showToast(`Workout finished! Saved ${savedSession.totalSets} sets (${savedSession.totalVolumeKg.toLocaleString()} kg total volume).`, 'success');
        this.activeGymSubTab = 'today';
        this.render();
    },

    cancelLiveWorkout() {
        if (!confirm('Are you sure you want to discard this in-progress workout session?')) return;
        this.stopRestTimer();
        this.liveWorkout = null;
        Store.clearActiveWorkoutSession();
        this.render();
        showToast('Workout session discarded.', 'info');
    },

    // -------------------------------------------------------------------------
    // Create Custom Exercise Modal
    // -------------------------------------------------------------------------
    openCreateExerciseModal() {
        let modal = document.getElementById('createExerciseModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'createExerciseModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-window" style="width: min(500px, 95vw);">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">Exercise Library</span>
                        <h3 class="wizard-modal-title">＋ Create New Exercise</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('createExerciseModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">Exercise Name *</label>
                        <input type="text" id="custExName" class="form-input" placeholder="e.g. Incline Cable Fly">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">Muscle Group *</label>
                        <select id="custExMuscle" class="form-input">
                            <option value="Back">Back</option>
                            <option value="Biceps">Biceps</option>
                            <option value="Chest">Chest</option>
                            <option value="Triceps">Triceps</option>
                            <option value="Legs">Legs</option>
                            <option value="Shoulders">Shoulders</option>
                            <option value="Core">Core</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">Equipment (Optional)</label>
                        <input type="text" id="custExEquip" class="form-input" placeholder="e.g. Cable, Dumbbell, Barbell">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">Notes (Optional)</label>
                        <input type="text" id="custExNotes" class="form-input" placeholder="e.g. High anchor, emphasize stretch">
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px;">
                    <button class="action-btn-ghost" onclick="document.getElementById('createExerciseModal').classList.remove('active')">Cancel</button>
                    <button class="btn-primary" onclick="GymEngine.saveCustomExercise()">Create & Select</button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    saveCustomExercise() {
        const nameInput = document.getElementById('custExName');
        const muscleInput = document.getElementById('custExMuscle');
        const equipInput = document.getElementById('custExEquip');
        const notesInput = document.getElementById('custExNotes');

        const name = (nameInput?.value || '').trim();
        const muscleGroup = (muscleInput?.value || 'General').trim();
        const equipment = (equipInput?.value || 'Standard').trim();
        const notes = (notesInput?.value || '').trim();

        if (!name) {
            showToast('Please enter an exercise name.', 'warning');
            return;
        }

        const newEx = Store.addCustomExercise({ name, muscleGroup, equipment, notes });

        // If in exercise selection stage, select it immediately
        if (this.liveWorkout?.stage === 'select_exercises') {
            if (!this.liveWorkout.selectedExerciseIds) this.liveWorkout.selectedExerciseIds = [];
            if (!this.liveWorkout.selectedExerciseIds.includes(newEx.id)) {
                this.liveWorkout.selectedExerciseIds.push(newEx.id);
            }
            Store.saveActiveWorkoutSession(this.liveWorkout);
            this.closeExercisePickerModal();
        } else if (this.exercisePickerState?.mode === 'edit_workout' && this.editingWorkoutSession) {
            this.addExerciseToEditingWorkout(newEx);
        } else if (this.liveWorkout?.stage === 'logging' || (this.liveWorkout && Array.isArray(this.liveWorkout.exercises))) {
            this.addExerciseToActiveWorkout(newEx);
        } else {
            this.closeExercisePickerModal();
        }

        const modal = document.getElementById('createExerciseModal');
        if (modal) modal.classList.remove('active');

        showToast(`Created exercise: ${name}`, 'success');
        this.render();
    },

    // -------------------------------------------------------------------------
    // Workout History Tab with Month Selector & View Gym Photo
    // -------------------------------------------------------------------------
    renderWorkoutHistoryHtml() {
        const months = Store.getAvailableHistoryMonths();
        const currentMonthKey = this.selectedHistoryMonth || months[0]?.key || DateUtils.todayIST().slice(0, 7);
        const summary = Store.getMonthSummary(currentMonthKey);
        const sessions = summary.sessions || [];

        return `
            <div class="workout-history-container">
                <!-- Month Selector Bar -->
                <div class="history-month-selector-bar">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="color: var(--text-secondary); font-size: 13px; font-weight: 700;">MONTH:</label>
                        <select class="month-dropdown-select" onchange="GymEngine.selectHistoryMonth(this.value)">
                            ${months.map(m => `
                                <option value="${m.key}" ${m.key === currentMonthKey ? 'selected' : ''}>${m.label} ▼</option>
                            `).join('')}
                        </select>
                    </div>
                    <button class="btn-gym-quick-record" style="font-size: 12px; padding: 6px 14px;" onclick="GymEngine.triggerQuickLogWorkout()">
                        + ADD RECORD
                    </button>
                </div>

                <!-- Monthly Summary Card -->
                <div class="monthly-summary-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 10px;">
                        <span style="font-size: 12px; color: var(--gold); text-transform: uppercase; font-weight: 800;">Monthly Summary</span>
                        <span style="font-size: 12px; color: var(--text-muted);">${summary.sessions.length} Sessions Logged</span>
                    </div>
                    <div class="monthly-stats-grid">
                        <div class="m-stat-box">
                            <span class="m-stat-lbl">Workout Days</span>
                            <span class="m-stat-val" style="color: var(--gold);">${summary.workoutDays}</span>
                        </div>
                        <div class="m-stat-box">
                            <span class="m-stat-lbl">Total Sets</span>
                            <span class="m-stat-val">${summary.totalSets}</span>
                        </div>
                        <div class="m-stat-box">
                            <span class="m-stat-lbl">Total Volume</span>
                            <span class="m-stat-val" style="color: var(--sky);">${summary.totalVolumeKg.toLocaleString()} kg</span>
                        </div>
                        <div class="m-stat-box">
                            <span class="m-stat-lbl">Avg Duration</span>
                            <span class="m-stat-val">${summary.avgDurationMinutes} min</span>
                        </div>
                        <div class="m-stat-box">
                            <span class="m-stat-lbl">Muscle Groups</span>
                            <span class="m-stat-val" style="font-size: 13px; color: var(--emerald);">${summary.muscleGroupsTrained.length > 0 ? summary.muscleGroupsTrained.join(', ') : '—'}</span>
                        </div>
                        <div class="m-stat-box">
                            <span class="m-stat-lbl">PRs Achieved</span>
                            <span class="m-stat-val" style="color: var(--purple);">${summary.prsAchieved} PRs</span>
                        </div>
                    </div>
                </div>

                <!-- Sessions List -->
                ${sessions.length === 0 ? `
                    <div class="mistake-empty-state">
                        <span style="font-size: 36px;">🏋️</span>
                        <h4 style="margin: 8px 0 4px 0; color: #fff;">No workout sessions recorded yet.</h4>
                        <p style="color: var(--text-muted); font-size: 13px;">Complete your first workout to start tracking historical volume and progression.</p>
                    </div>
                ` : `
                    <div class="history-list">
                        ${sessions.map(s => {
                            const hasPhoto = !!(s.gym_photo_path || s.gymPhoto?.storagePath || s.gymPhoto?.url || s.gym_photo_url || s.gymPhoto?.base64);
                            const rawWType = (s.workoutType || s.routineName || '').toString().trim();
                            const wType = (rawWType && rawWType !== 'undefined' && rawWType !== 'null') ? rawWType : 'Workout type not recorded';
                            const dur = s.durationMinutes || s.duration || 0;
                            const exCount = s.exerciseCount || (s.exercises && s.exercises.length) || 0;
                            const setCount = s.setCount || s.totalSets || 0;
                            const hasVolume = typeof s.totalVolumeKg === 'number' && s.totalVolumeKg > 0;
                            const volText = hasVolume ? `${s.totalVolumeKg.toLocaleString()} kg` : null;
                            const status = (s.status || 'COMPLETED').toUpperCase();
                            const statusLower = (s.status || 'completed').toLowerCase();
                            const dayName = s.dayOfWeek || (s.dayKey ? (s.dayKey.charAt(0).toUpperCase() + s.dayKey.slice(1)) : '') || '';

                            const musclesList = (s.targetMuscleGroups && Array.isArray(s.targetMuscleGroups) && s.targetMuscleGroups.length > 0)
                                ? s.targetMuscleGroups
                                : (s.exercises && Array.isArray(s.exercises) && s.exercises.length > 0)
                                    ? Array.from(new Set(s.exercises.map(e => e.muscleGroup).filter(Boolean)))
                                    : [];
                            const muscleGroupsText = musclesList.length > 0 ? musclesList.join(', ') : '';
                            const showMuscleTag = muscleGroupsText && muscleGroupsText.toLowerCase() !== wType.toLowerCase();

                            return `
                                <div class="history-session-card" id="history-card-${s.id}">
                                    <div class="h-sess-left">
                                        <div class="h-sess-header-row">
                                            <span class="h-sess-status-dot ${statusLower}"></span>
                                            <span class="h-sess-date">${s.date}</span>
                                            <span class="h-sess-badge-status ${statusLower}">${status}</span>
                                            ${dayName ? `<span class="h-sess-day">(${dayName})</span>` : ''}
                                        </div>
                                        <div class="h-sess-title-row">
                                            <h4 class="h-sess-title">${wType}</h4>
                                            ${showMuscleTag ? `<span class="h-sess-muscles">${muscleGroupsText}</span>` : ''}
                                        </div>
                                        <div class="h-sess-meta">
                                            <span class="h-sess-meta-item">⏱ <b>${dur} min</b></span>
                                            <span class="h-sess-meta-item">🏋️ <b>${exCount} exercises</b></span>
                                            <span class="h-sess-meta-item">📊 <b>${setCount} sets</b></span>
                                            ${volText ? `<span class="h-sess-meta-item">📈 Volume: <b>${volText}</b></span>` : ''}
                                        </div>
                                    </div>
                                    <div class="h-sess-actions">
                                        ${hasPhoto ? `
                                            <button type="button" class="btn-view-photo" onclick="GymEngine.viewSessionPhoto('${s.id}')" title="View gym check-in photo">
                                                📸 VIEW PHOTO
                                            </button>
                                        ` : ''}
                                        <button type="button" class="action-btn-ghost btn-export-single-workout" onclick="GymEngine.exportSingleWorkout('${s.id}')" title="Export this workout session as PDF">
                                            📄 EXPORT PDF
                                        </button>
                                        ${this.canUserEditSession(s) ? `
                                            <button type="button" class="action-btn-ghost btn-edit-workout" onclick="GymEngine.openEditWorkoutModal('${s.id}')" title="Edit this workout session">
                                                ✏️ EDIT WORKOUT
                                            </button>
                                        ` : ''}
                                        <button type="button" class="action-btn-ghost btn-view-workout" onclick="GymEngine.viewSessionDetails('${s.id}')" title="View workout exercises and sets">
                                            VIEW WORKOUT ↗
                                        </button>
                                        <button type="button" class="action-btn-ghost danger btn-delete-workout" onclick="GymEngine.confirmDeleteWorkout('${s.id}')" title="Delete this workout session">
                                            🗑️ DELETE
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    },

    selectHistoryMonth(monthKey) {
        this.selectedHistoryMonth = monthKey;
        this.render();
    },

    async viewSessionPhoto(id, forceRefresh = false, retryCount = 0) {
        const s = Store.getWorkoutSessionById(id);
        if (!s) return;

        // Reset retry map on manual user request
        if (!this._photoRetryMap) this._photoRetryMap = {};
        if (forceRefresh) {
            this._photoRetryMap[id] = 0;
        }

        // 1. Get or create modal overlay
        let modal = document.getElementById('gymPhotoViewModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'gymPhotoViewModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };

        // 2. Identify photo artifacts
        const base64Data = (s.gymPhoto?.base64 && s.gymPhoto.base64.startsWith('data:')) ? s.gymPhoto.base64 : null;
        let photoPath = s.gym_photo_path || s.gymPhoto?.storagePath || null;
        const existingUrl = s.gymPhoto?.url || s.gym_photo_url || null;

        // Compatibility fallback: recover storage path if only url or session metadata exists
        if (!photoPath && existingUrl && typeof SupabaseService !== 'undefined') {
            photoPath = SupabaseService.normalizeGymPhotoPath(existingUrl) || null;
        }
        if ((!photoPath || !photoPath.includes('/')) && (existingUrl || s.gymPhoto || s.gym_photo_id)) {
            const userId = (typeof SupabaseService !== 'undefined' ? SupabaseService.getUserId() : null) || s.userId || s.user_id;
            if (userId && s.id && s.date) {
                const parts = s.date.split('-');
                if (parts.length >= 2) {
                    photoPath = `${userId}/${parts[0]}/${parts[1]}/${s.id}.jpg`;
                }
            }
        }

        const hasAnyPhoto = !!(base64Data || photoPath || existingUrl);
        const capturedTimeText = s.gymPhoto?.createdAt || s.gym_photo_created_at || s.completedAt || s.startedAt || s.date;
        const formattedCaptured = capturedTimeText ? new Date(capturedTimeText).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Verified';
        const workoutTitle = (s.routineName || s.workoutType || 'Gym Workout');

        // 3. Render modal shell
        modal.innerHTML = `
            <div class="modal-window gym-checkin-modal-window" style="max-width: 600px;">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">GYM CHECK-IN PHOTO</span>
                        <h3 class="wizard-modal-title">${workoutTitle} — ${s.date}</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('gymPhotoViewModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div id="gymPhotoContainer" class="camera-viewport-card" style="min-height: 320px; border-style: solid; border-color: rgba(245,197,24,0.4); display: flex; align-items: center; justify-content: center; position: relative;">
                        ${!hasAnyPhoto ? `
                            <div style="text-align: center; padding: 24px;">
                                <span style="font-size: 32px; display: block; margin-bottom: 8px;">📷</span>
                                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">NO PHOTO RECORDED</div>
                                <div style="color: var(--text-muted); font-size: 12px; max-width: 320px;">No gym check-in photo recorded for this workout session.</div>
                            </div>
                        ` : `
                            <div id="gymPhotoLoadingState" style="text-align: center; padding: 24px;">
                                <div class="gym-photo-spinner" style="width: 36px; height: 36px; border: 3px solid rgba(245,197,24,0.2); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px auto;"></div>
                                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO LOADING</div>
                                <div style="color: var(--text-muted); font-size: 12px; max-width: 320px;">Retrieving secure check-in photo from cloud storage...</div>
                            </div>
                        `}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 12px; margin-top: 10px; flex-wrap: wrap; gap: 8px;">
                        <span>Session ID: <code style="font-size: 11px; color: var(--forge-text-muted);">${s.id}</code></span>
                        <span>Captured: ${formattedCaptured}</span>
                    </div>
                </div>
                <div class="modal-footer" id="gymPhotoModalFooter" style="display: flex; justify-content: ${hasAnyPhoto ? 'space-between' : 'flex-end'}; align-items: center; padding: 14px 20px; gap: 10px;">
                    ${hasAnyPhoto ? `
                        <button type="button" class="action-btn-ghost btn-gym-photo-refresh" style="font-size: 12px; padding: 6px 14px; width: auto; display: inline-flex; align-items: center; gap: 6px;" onclick="GymEngine.viewSessionPhoto('${s.id}', true, 1)">
                            🔄 Refresh Photo
                        </button>
                    ` : ''}
                    <button type="button" class="btn-primary" onclick="document.getElementById('gymPhotoViewModal').classList.remove('active')">Close</button>
                </div>
            </div>
        `;

        modal.classList.add('active');

        const container = document.getElementById('gymPhotoContainer');
        if (!container) return;

        if (!hasAnyPhoto) {
            container.innerHTML = `
                <div style="text-align: center; padding: 24px;">
                    <span style="font-size: 32px; display: block; margin-bottom: 8px;">📷</span>
                    <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">NO PHOTO RECORDED</div>
                    <div style="color: var(--text-muted); font-size: 12px; max-width: 320px;">No gym check-in photo recorded for this workout session.</div>
                </div>
            `;
            return;
        }

        // Case 1: Local base64 image (offline captured, does not expire)
        if (base64Data) {
            container.innerHTML = `<img src="${base64Data}" alt="Gym Check-In Photo" class="camera-preview-img" style="max-height: 420px; object-fit: contain;">`;
            return;
        }

        // Case 2: Offline status check
        const isOffline = (typeof navigator !== 'undefined' && navigator.onLine === false) ||
                          (typeof window !== 'undefined' && window.navigator && window.navigator.onLine === false);
        if (isOffline) {
            this.renderPhotoErrorUI(container, s.id, 'OFFLINE', 'You are currently offline. Connect to the internet to load private cloud photos.', true);
            return;
        }

        // Case 3: Supabase authentication check
        if (typeof SupabaseService === 'undefined' || !SupabaseService.isAuthenticated()) {
            this.renderPhotoErrorUI(container, s.id, 'AUTH_REQUIRED', 'Authentication required to view private gym check-in photo.', false);
            return;
        }

        if (!photoPath) {
            this.renderPhotoErrorUI(container, s.id, 'NOT_FOUND', 'The photo could not be rendered or the temporary signed URL has expired.', true);
            return;
        }

        try {
            // If forceRefresh, explicitly invalidate cache first
            if (forceRefresh && typeof SupabaseService.invalidateSignedGymPhotoUrl === 'function') {
                SupabaseService.invalidateSignedGymPhotoUrl(photoPath);
            }

            let signedUrl = null;
            if (typeof SupabaseService.getSignedGymPhotoUrlForSession === 'function') {
                signedUrl = await SupabaseService.getSignedGymPhotoUrlForSession(s, 3600, forceRefresh);
            } else {
                signedUrl = await SupabaseService.getSignedGymPhotoUrl(photoPath, 3600, forceRefresh, s);
            }
            if (s.gym_photo_path) photoPath = s.gym_photo_path;
            
            if (!signedUrl) {
                const lastErr = typeof SupabaseService.getLastStorageError === 'function' ? SupabaseService.getLastStorageError() : null;
                const isNotFound = lastErr && (lastErr.code === 404 || lastErr.message?.toLowerCase().includes('not found'));
                const isDenied = lastErr && (lastErr.code === 403 || lastErr.message?.toLowerCase().includes('unauthorized') || lastErr.message?.toLowerCase().includes('policy') || lastErr.message?.toLowerCase().includes('security warning'));
                
                let msg = 'The photo could not be rendered or the temporary signed URL has expired.';
                let errType = 'EXPIRED';
                if (isNotFound) {
                    msg = 'Photo object was not found in secure storage.';
                    errType = 'NOT_FOUND';
                } else if (isDenied) {
                    msg = 'Access to this private photo was denied by storage security policies.';
                    errType = 'ACCESS_DENIED';
                }
                this.renderPhotoErrorUI(container, s.id, errType, msg, true);
                return;
            }

            // Persist the durable storage path and fresh signed URL locally
            if (typeof Store.updateWorkoutSessionPhoto === 'function') {
                Store.updateWorkoutSessionPhoto(s.id, { photoPath, photoUrl: signedUrl });
            } else {
                s.gym_photo_url = signedUrl;
                s.gym_photo_path = photoPath;
                if (s.gymPhoto) {
                    s.gymPhoto.url = signedUrl;
                    s.gymPhoto.storagePath = photoPath;
                }
            }

            // Render <img> with verified fresh signed URL and error fallback
            container.innerHTML = `<img src="${signedUrl}" alt="Gym Check-In Photo" class="camera-preview-img" onerror="GymEngine.handlePhotoLoadError(this, '${s.id}', '${photoPath.replace(/'/g, "\\'")}')">`;
        } catch (err) {
            console.warn('[Gym] Error getting signed photo URL:', err);
            this.renderPhotoErrorUI(container, s.id, 'ERROR', 'The photo could not be rendered or the temporary signed URL has expired.', true);
        }
    },

    handlePhotoLoadError(imgEl, sessionId, photoPath) {
        if (!imgEl) return;
        const parent = imgEl.parentElement || document.getElementById('gymPhotoContainer');
        if (!parent) return;

        if (!this._photoRetryMap) this._photoRetryMap = {};
        const retries = this._photoRetryMap[sessionId] || 0;

        // Limited automatic retry: if image fails on initial render, try ONCE with forceRefresh
        if (retries < 1) {
            this._photoRetryMap[sessionId] = retries + 1;
            console.warn(`[Gym] Photo URL failed to load for session ${sessionId}. Attempting fresh signed URL regeneration...`);
            if (photoPath && typeof SupabaseService !== 'undefined' && typeof SupabaseService.invalidateSignedGymPhotoUrl === 'function') {
                SupabaseService.invalidateSignedGymPhotoUrl(photoPath);
            }
            this.viewSessionPhoto(sessionId, true, retries + 1);
            return;
        }

        // If retry has already occurred, display clean error with manual refresh option
        this.renderPhotoErrorUI(parent, sessionId, 'EXPIRED', 'The photo could not be rendered or the temporary signed URL has expired.', true);
    },

    renderPhotoErrorUI(container, sessionId, errorType, message, canRefresh = true) {
        if (!container) return;
        let icon = '📷';
        let title = 'PHOTO UNAVAILABLE';
        if (errorType === 'OFFLINE') { icon = '📡'; title = 'OFFLINE'; }
        else if (errorType === 'AUTH_REQUIRED') { icon = '🔒'; title = 'PHOTO UNAVAILABLE'; }
        else if (errorType === 'NOT_FOUND') { icon = '🔍'; title = 'PHOTO NOT FOUND'; }
        else if (errorType === 'ACCESS_DENIED') { icon = '🛡️'; title = 'ACCESS DENIED'; }

        container.innerHTML = `
            <div style="text-align: center; padding: 24px;">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">${icon}</span>
                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">${title}</div>
                <div style="color: var(--text-muted); font-size: 12px; max-width: 340px; margin-bottom: 12px;">${message}</div>
                ${canRefresh ? `
                    <button type="button" class="action-btn-ghost btn-gym-photo-refresh" style="font-size: 12px; padding: 6px 14px; width: auto; display: inline-flex; align-items: center; gap: 6px;" onclick="GymEngine.viewSessionPhoto('${sessionId}', true, 1)">
                        Refresh Photo 🔄
                    </button>
                ` : ''}
            </div>
        `;
    },

    viewSessionDetails(id) {
        const s = Store.getWorkoutSessionById(id);
        if (!s) return;

        let modal = document.getElementById('workoutSessionDetailModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'workoutSessionDetailModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };

        const hasPhoto = !!(s.gym_photo_path || s.gymPhoto?.storagePath || s.gym_photo_url || s.gymPhoto?.url || s.gymPhoto?.base64);

        modal.innerHTML = `
            <div class="modal-window" style="width: min(640px, 95vw); max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div>
                        <span style="font-size: 11px; color: var(--gold); text-transform: uppercase; font-weight: 700;">Workout Log</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff;">${s.routineName} — ${s.date}</h3>
                    </div>
                    <button class="btn-close-modal" onclick="document.getElementById('workoutSessionDetailModal').classList.remove('active')">×</button>
                </div>

                <div class="modal-body">
                    <div style="display: flex; gap: 16px; margin-bottom: 16px; background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 8px; flex-wrap: wrap;">
                        <div>Duration: <b>${s.durationMinutes || s.duration || 0}m</b></div>
                        <div>Total Volume: <b>${(s.totalVolumeKg || 0).toLocaleString()} kg</b></div>
                        <div>Sets: <b>${s.totalSets || 0}</b></div>
                        ${hasPhoto ? `
                            <button class="btn-view-photo" style="margin-left: auto; padding: 3px 10px; font-size: 11.5px;" onclick="GymEngine.viewSessionPhoto('${s.id}')">
                                📸 View Check-In Photo
                            </button>
                        ` : ''}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${(s.exercises || []).map(ex => `
                            <div style="background: rgba(16,22,32,0.6); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <b>${ex.name}</b>
                                    <span style="color: var(--text-muted); font-size: 12px;">${ex.muscleGroup || 'General'}</span>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
                                    ${(ex.sets || []).map(st => `
                                        <div style="display: flex; justify-content: space-between; color: var(--text-secondary); align-items: center;">
                                            <span>Set ${st.setNumber}:</span>
                                            <b>${st.weightKg} kg × ${st.reps} reps ${st.rpe ? `(RPE ${st.rpe})` : ''}</b>
                                            ${st.isWeightPr ? '<span class="pr-badge weight">↑ Weight PR</span>' : ''}
                                            ${st.isRepPr ? '<span class="pr-badge reps">↑ Rep PR</span>' : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; flex-wrap: wrap; gap: 8px;">
                    <button class="action-btn-ghost danger btn-delete-workout" onclick="GymEngine.confirmDeleteWorkout('${s.id}')">
                        🗑️ Delete Workout
                    </button>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${this.canUserEditSession(s) ? `
                            <button class="action-btn-ghost btn-edit-workout" onclick="GymEngine.openEditWorkoutModal('${s.id}')" title="Edit this workout session">
                                ✏️ Edit Workout
                            </button>
                        ` : ''}
                        <button class="action-btn-ghost btn-export-single-workout" onclick="GymEngine.exportSingleWorkout('${s.id}')">
                            📄 EXPORT WORKOUT PDF
                        </button>
                        <button class="btn-primary" onclick="document.getElementById('workoutSessionDetailModal').classList.remove('active')">Close</button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    // -------------------------------------------------------------------------
    // Delete Workout Confirmation Modal & Execution
    // -------------------------------------------------------------------------
    confirmDeleteWorkout(sessionId) {
        const s = Store.getWorkoutSessionById(sessionId);
        if (!s) return;

        let modal = document.getElementById('deleteWorkoutModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'deleteWorkoutModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };

        const rawWType = (s.workoutType || s.routineName || '').toString().trim();
        const wType = (rawWType && rawWType !== 'undefined' && rawWType !== 'null') ? rawWType : 'Workout type not recorded';
        const dur = s.durationMinutes || s.duration || 0;
        const sets = s.setCount || s.totalSets || 0;
        const vol = (s.totalVolumeKg || 0).toLocaleString();

        modal.innerHTML = `
            <div class="modal-window" style="width: min(480px, 92vw);">
                <div class="modal-header">
                    <div>
                        <span style="font-size: 11px; color: var(--rose, #f43f5e); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Permanent Removal</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff;">DELETE WORKOUT?</h3>
                    </div>
                    <button class="btn-close-modal" onclick="document.getElementById('deleteWorkoutModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 18px 20px;">
                    <p style="color: var(--text-primary); margin: 0 0 14px 0; font-size: 14px;">
                        Are you sure you want to permanently delete this workout session?
                    </p>
                    <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                        <div style="font-weight: 700; color: #fff; font-size: 15px; margin-bottom: 4px;">${s.date} — ${wType}</div>
                        <div style="font-size: 12.5px; color: var(--text-secondary);">
                            ⏱ ${dur} min • 📊 ${sets} sets • 📈 ${vol} kg
                        </div>
                    </div>
                    <p style="color: var(--text-muted); font-size: 12px; margin: 0; line-height: 1.5;">
                        This will permanently remove the workout session, its child exercises, sets, and associated check-in photo from local storage and Supabase cloud.
                    </p>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.08);">
                    <button class="action-btn-ghost" onclick="document.getElementById('deleteWorkoutModal').classList.remove('active')">
                        Cancel
                    </button>
                    <button class="btn-primary danger" style="background: var(--rose, #f43f5e); border-color: var(--rose, #f43f5e);" onclick="GymEngine.deleteWorkout('${s.id}')">
                        🗑️ Delete Permanently
                    </button>
                </div>
            </div>
        `;
        modal.classList.add('active');
    },

    deleteWorkout(sessionId) {
        const modal = document.getElementById('deleteWorkoutModal');
        if (modal) modal.classList.remove('active');
        const detailModal = document.getElementById('workoutSessionDetailModal');
        if (detailModal) detailModal.classList.remove('active');

        // Optimistic delete with rollback safety
        const backupSession = Store.getWorkoutSessionById(sessionId);
        try {
            Store.deleteWorkoutSession(sessionId);
            this.render();
            showToast('Workout deleted successfully.', 'info');
        } catch (err) {
            console.error('[Gym] Deletion failed:', err);
            if (backupSession) {
                Store.saveWorkoutSession(backupSession);
                this.render();
            }
            showToast('Failed to delete workout: ' + (err.message || 'Unknown error'), 'error');
        }
    },

    // -------------------------------------------------------------------------
    // Edit Completed Workout Flow (Safe Reopen, Set/Exercise Editing, Sync)
    // -------------------------------------------------------------------------
    openEditWorkoutModal(sessionId) {
        const rawSession = Store.getWorkoutSessionById(sessionId);
        if (!rawSession) {
            showToast('Workout session not found.', 'error');
            return;
        }

        if (!this.canUserEditSession(rawSession)) {
            showToast('You do not have permission to edit this workout session.', 'error');
            return;
        }

        const detailModal = document.getElementById('workoutSessionDetailModal');
        if (detailModal) detailModal.classList.remove('active');

        // Deep clone session to protect original until explicit user save
        const session = JSON.parse(JSON.stringify(rawSession));
        const rawRoutine = (session.workoutType || session.routineName || 'Custom Workout').trim();
        const routineName = (rawRoutine && rawRoutine !== 'undefined' && rawRoutine !== 'null') ? rawRoutine : 'Custom Workout';

        session.routineName = routineName;
        session.workoutType = routineName;
        session.durationMinutes = Number(session.durationMinutes ?? session.duration ?? 0) || 0;

        // Normalize exercises and sets
        session.exercises = (session.exercises || []).map((ex, exIdx) => ({
            id: ex.id || ('ex_' + Date.now() + '_' + exIdx),
            exerciseId: ex.exerciseId || ex.id || ('ex_id_' + exIdx),
            name: ex.name || ex.exerciseName || ex.exercise_name_snapshot || 'Exercise',
            muscleGroup: ex.muscleGroup || ex.muscle_group || 'General',
            category: ex.category || ex.muscleGroup || 'General',
            equipment: ex.equipment || 'Standard',
            notes: ex.notes || '',
            skipped: !!ex.skipped,
            completed: ex.completed !== false,
            sets: (ex.sets || []).map((st, sIdx) => ({
                id: st.id || ('set_' + sIdx),
                setNumber: st.setNumber ?? st.set_number ?? (sIdx + 1),
                weightKg: st.weightKg !== undefined && st.weightKg !== null ? st.weightKg : (st.weight_kg ?? ''),
                reps: st.reps !== undefined && st.reps !== null ? st.reps : '',
                rpe: st.rpe !== undefined && st.rpe !== null ? st.rpe : '',
                completed: st.completed !== false && st.completed !== 'false',
                isWeightPr: !!(st.isWeightPr || st.is_weight_pr),
                isRepPr: !!(st.isRepPr || st.is_rep_pr)
            }))
        }));

        this.editingWorkoutSession = session;
        this.editingWorkoutSessionIsDirty = false;
        this._isSavingEditedWorkout = false;

        let modal = document.getElementById('editWorkoutModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'editWorkoutModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) {
                GymEngine.cancelEditWorkout();
            }
        };

        this.renderEditWorkoutModalUI();
        modal.classList.add('active');
    },

    closeEditWorkoutModal(force = false) {
        if (!force && this.editingWorkoutSessionIsDirty) {
            if (!confirm('You have unsaved changes. Discard them and close?')) {
                return;
            }
        }
        this.editingWorkoutSession = null;
        this.editingWorkoutSessionIsDirty = false;
        this._isSavingEditedWorkout = false;
        const modal = document.getElementById('editWorkoutModal');
        if (modal) modal.classList.remove('active');
    },

    cancelEditWorkout() {
        const wasDirty = this.editingWorkoutSessionIsDirty;
        this.closeEditWorkoutModal(false);
        if (!this.editingWorkoutSession && wasDirty) {
            showToast('Workout edits discarded.', 'info');
        }
    },

    calculateWorkoutTotals(exercises = []) {
        let totalVolumeKg = 0;
        let totalSets = 0;
        let totalReps = 0;
        let exerciseCount = 0;

        (exercises || []).forEach(ex => {
            if (!ex.skipped) {
                let hasValidSet = false;
                (ex.sets || []).forEach(st => {
                    const isCompleted = st.completed === true || (st.completed !== false && st.completed !== 'false' && Boolean(st.completed));
                    const wt = parseFloat(st.weightKg ?? st.weight_kg ?? 0) || 0;
                    const rp = parseInt(st.reps ?? 0, 10) || 0;
                    if (isCompleted && rp > 0) {
                        totalSets++;
                        totalReps += rp;
                        if (wt > 0) {
                            totalVolumeKg += (wt * rp);
                        }
                        hasValidSet = true;
                    }
                });
                if (hasValidSet || (ex.sets && ex.sets.length > 0)) {
                    exerciseCount++;
                }
            }
        });

        return {
            totalVolumeKg: Math.round(totalVolumeKg),
            totalSets,
            totalReps,
            exerciseCount
        };
    },

    updateEditWorkoutSummaryMetrics() {
        if (!this.editingWorkoutSession) return;
        const totals = this.calculateWorkoutTotals(this.editingWorkoutSession.exercises);
        const volEl = document.getElementById('editWorkoutMetricVolume');
        if (volEl) volEl.textContent = `${totals.totalVolumeKg.toLocaleString()} kg`;
        const setsEl = document.getElementById('editWorkoutMetricSets');
        if (setsEl) setsEl.textContent = `${totals.totalSets}`;
        const repsEl = document.getElementById('editWorkoutMetricReps');
        if (repsEl) repsEl.textContent = `${totals.totalReps}`;
        const exEl = document.getElementById('editWorkoutMetricExercises');
        if (exEl) exEl.textContent = `${totals.exerciseCount}`;
    },

    renderEditWorkoutModalUI() {
        const modal = document.getElementById('editWorkoutModal');
        if (!modal || !this.editingWorkoutSession) return;

        const sess = this.editingWorkoutSession;
        const totals = this.calculateWorkoutTotals(sess.exercises);
        const hasPhoto = !!(sess.gym_photo_path || sess.gymPhoto?.storagePath || sess.gym_photo_url || sess.gymPhoto?.url || sess.gymPhoto?.base64);

        modal.innerHTML = `
            <div class="modal-window edit-workout-modal-window" style="width: min(780px, calc(100vw - 28px)); max-height: calc(90vh - 20px);">
                <div class="modal-header">
                    <div>
                        <span style="font-size: 11px; color: var(--gold); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">COMPLETED SESSION</span>
                        <h3 style="margin: 2px 0 0 0; color: #fff; font-size: 20px; display: flex; align-items: center; gap: 8px;">
                            <span>✏️ Edit Workout</span>
                        </h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="GymEngine.cancelEditWorkout()">×</button>
                </div>

                <div class="modal-body edit-workout-modal-body">
                    <!-- Metadata Editor -->
                    <div class="edit-workout-meta-grid">
                        <div class="edit-meta-item">
                            <label>Workout Routine</label>
                            <input
                                type="text"
                                class="edit-workout-input"
                                id="editWorkoutRoutineName"
                                value="${sess.routineName || sess.workoutType || ''}"
                                placeholder="e.g. Legs + Shoulders"
                                oninput="GymEngine.updateEditingWorkoutMetadata('routineName', this.value)"
                            >
                        </div>
                        <div class="edit-meta-item">
                            <label>Workout Date</label>
                            <input
                                type="date"
                                class="edit-workout-input"
                                id="editWorkoutDate"
                                value="${sess.date || ''}"
                                onchange="GymEngine.updateEditingWorkoutMetadata('date', this.value)"
                            >
                        </div>
                        <div class="edit-meta-item">
                            <label>Duration (mins)</label>
                            <input
                                type="number"
                                min="1"
                                max="600"
                                class="edit-workout-input"
                                id="editWorkoutDuration"
                                value="${sess.durationMinutes || 0}"
                                oninput="GymEngine.updateEditingWorkoutMetadata('durationMinutes', this.value)"
                            >
                        </div>
                    </div>

                    <!-- Photo Attachment Bar -->
                    <div class="edit-workout-photo-bar">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 15px;">📸</span>
                            <span style="font-size: 12.5px; color: var(--text-secondary);">
                                ${hasPhoto ? 'Gym check-in photo securely preserved with session.' : 'No gym check-in photo recorded for this session.'}
                            </span>
                        </div>
                        ${hasPhoto ? `
                            <button type="button" class="action-btn-ghost btn-view-photo" style="font-size: 11.5px; padding: 4px 10px;" onclick="GymEngine.viewSessionPhoto('${sess.id}')">
                                📸 View Photo ↗
                            </button>
                        ` : ''}
                    </div>

                    <!-- Live Summary Stats -->
                    <div class="edit-workout-stats-grid">
                        <div class="edit-stat-box">
                            <span class="edit-stat-lbl">Total Volume</span>
                            <span class="edit-stat-val" style="color: var(--sky);" id="editWorkoutMetricVolume">${totals.totalVolumeKg.toLocaleString()} kg</span>
                        </div>
                        <div class="edit-stat-box">
                            <span class="edit-stat-lbl">Completed Sets</span>
                            <span class="edit-stat-val" id="editWorkoutMetricSets">${totals.totalSets}</span>
                        </div>
                        <div class="edit-stat-box">
                            <span class="edit-stat-lbl">Total Reps</span>
                            <span class="edit-stat-val" id="editWorkoutMetricReps">${totals.totalReps}</span>
                        </div>
                        <div class="edit-stat-box">
                            <span class="edit-stat-lbl">Exercises</span>
                            <span class="edit-stat-val" style="color: var(--gold);" id="editWorkoutMetricExercises">${totals.exerciseCount}</span>
                        </div>
                    </div>

                    <!-- Exercises List -->
                    <div class="edit-exercises-stack">
                        ${(sess.exercises || []).length === 0 ? `
                            <div style="text-align: center; padding: 28px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
                                <span style="font-size: 28px; display: block; margin-bottom: 6px;">🏋️</span>
                                <div style="color: #fff; font-weight: 700; font-size: 14px;">No exercises in this workout session.</div>
                                <div style="color: var(--text-muted); font-size: 12.5px; margin-top: 4px;">Click the button below to add an exercise from your library.</div>
                            </div>
                        ` : sess.exercises.map((ex, exIdx) => {
                            const isFirst = exIdx === 0;
                            const isLast = exIdx === sess.exercises.length - 1;
                            const perf = this.getExercisePerformanceDetails(ex.name, ex.exerciseId);
                            const prevSets = (perf.hasHistory && perf.sets && perf.sets.length > 0) ? perf.sets : (ex.previousSets || []);

                            return `
                                <div class="edit-ex-card" id="edit-ex-card-${exIdx}">
                                    <div class="edit-ex-header">
                                        <div class="edit-ex-title-box">
                                            <span class="edit-ex-name">${ex.name}</span>
                                            <span class="edit-ex-muscle">${ex.muscleGroup || 'General'}</span>
                                        </div>
                                        <div class="edit-ex-actions-top">
                                            <button
                                                type="button"
                                                class="btn-reorder-ex"
                                                title="Move exercise up"
                                                ${isFirst ? 'disabled' : ''}
                                                onclick="GymEngine.moveExerciseInEditingWorkout(${exIdx}, ${exIdx - 1})"
                                            >▲</button>
                                            <button
                                                type="button"
                                                class="btn-reorder-ex"
                                                title="Move exercise down"
                                                ${isLast ? 'disabled' : ''}
                                                onclick="GymEngine.moveExerciseInEditingWorkout(${exIdx}, ${exIdx + 1})"
                                            >▼</button>
                                            <button
                                                type="button"
                                                class="btn-remove-ex"
                                                title="Remove exercise from session"
                                                onclick="GymEngine.removeExerciseFromEditingWorkout(${exIdx})"
                                            >🗑️ Remove</button>
                                        </div>
                                    </div>

                                    <!-- Sets Table -->
                                    <div class="edit-sets-table">
                                        <div class="edit-set-row header">
                                            <span>Set</span>
                                            <span>Weight (kg)</span>
                                            <span>Reps</span>
                                            <span class="col-edit-rpe">RPE</span>
                                            <span>Done</span>
                                            <span></span>
                                        </div>

                                        ${(ex.sets || []).map((s, sIdx) => {
                                            const prevS = prevSets[sIdx];
                                            return `
                                                <div class="edit-set-row ${s.completed ? 'is-done' : ''}">
                                                    <span style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary);">Set ${s.setNumber}</span>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            class="set-input"
                                                            placeholder="${prevS?.weightKg || 'kg'}"
                                                            value="${s.weightKg !== '' && s.weightKg !== null && s.weightKg !== undefined ? s.weightKg : ''}"
                                                            oninput="GymEngine.updateEditingSetField(${exIdx}, ${sIdx}, 'weightKg', this.value)"
                                                        >
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            class="set-input"
                                                            placeholder="${prevS?.reps || 'reps'}"
                                                            value="${s.reps !== '' && s.reps !== null && s.reps !== undefined ? s.reps : ''}"
                                                            oninput="GymEngine.updateEditingSetField(${exIdx}, ${sIdx}, 'reps', this.value)"
                                                        >
                                                    </div>
                                                    <div class="col-edit-rpe">
                                                        <div class="set-rpe-selector">
                                                            ${[6, 7, 8, 9, 10].map(r => `
                                                                <button
                                                                    type="button"
                                                                    class="btn-rpe-chip ${s.rpe == r ? 'active' : ''}"
                                                                    onclick="GymEngine.toggleEditingSetRpe(${exIdx}, ${sIdx}, ${r})"
                                                                >${r}</button>
                                                            `).join('')}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            class="btn-check-set ${s.completed ? 'checked' : ''}"
                                                            title="${s.completed ? 'Mark incomplete' : 'Mark completed'}"
                                                            onclick="GymEngine.toggleEditingSetDone(${exIdx}, ${sIdx})"
                                                        >${s.completed ? '✓' : '○'}</button>
                                                    </div>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            class="btn-delete-set"
                                                            title="Delete set"
                                                            onclick="GymEngine.removeSetFromEditingWorkout(${exIdx}, ${sIdx})"
                                                        >🗑️</button>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>

                                    <div style="display: flex; justify-content: flex-start; margin-top: 4px;">
                                        <button
                                            type="button"
                                            class="action-btn-ghost"
                                            style="font-size: 11.5px; padding: 4px 12px;"
                                            onclick="GymEngine.addSetToEditingWorkout(${exIdx})"
                                        >＋ Add Set</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Add Exercise Button -->
                    <div style="margin-top: 10px;">
                        <button
                            type="button"
                            class="btn-gym-quick-record"
                            style="width: 100%; padding: 12px; font-weight: 700; font-size: 13.5px; justify-content: center; display: flex; align-items: center; gap: 8px;"
                            onclick="GymEngine.openAddExerciseToEditingWorkoutModal()"
                        >
                            <span>＋</span>
                            <span>Add Exercise to Workout</span>
                        </button>
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 10px;">
                    <button type="button" class="action-btn-ghost" onclick="GymEngine.cancelEditWorkout()">
                        Discard / Cancel
                    </button>
                    <button
                        type="button"
                        class="btn-primary"
                        id="btnSaveEditedWorkout"
                        style="padding: 10px 24px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px;"
                        onclick="GymEngine.saveEditedWorkout()"
                    >
                        <span>💾</span>
                        <span>Save Changes ✓</span>
                    </button>
                </div>
            </div>
        `;
    },

    updateEditingWorkoutMetadata(field, val) {
        if (!this.editingWorkoutSession) return;
        this.editingWorkoutSession[field] = val;
        if (field === 'routineName') {
            this.editingWorkoutSession.workoutType = val;
        }
        if (field === 'date' && val) {
            const dObj = new Date(val + 'T12:00:00');
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            if (!isNaN(dObj.getTime())) {
                const dayName = dayNames[dObj.getDay()];
                this.editingWorkoutSession.dayOfWeek = dayName;
                this.editingWorkoutSession.dayKey = dayName.toLowerCase();
            }
        }
        this.editingWorkoutSessionIsDirty = true;
    },

    updateEditingSetField(exIdx, sIdx, field, val) {
        if (!this.editingWorkoutSession?.exercises[exIdx]?.sets[sIdx]) return;
        const set = this.editingWorkoutSession.exercises[exIdx].sets[sIdx];
        set[field] = val;
        this.editingWorkoutSessionIsDirty = true;
        this.updateEditWorkoutSummaryMetrics();
    },

    toggleEditingSetDone(exIdx, sIdx) {
        if (!this.editingWorkoutSession?.exercises[exIdx]?.sets[sIdx]) return;
        const set = this.editingWorkoutSession.exercises[exIdx].sets[sIdx];
        set.completed = !set.completed;
        this.editingWorkoutSessionIsDirty = true;
        this.renderEditWorkoutModalUI();
    },

    toggleEditingSetRpe(exIdx, sIdx, rpeVal) {
        if (!this.editingWorkoutSession?.exercises[exIdx]?.sets[sIdx]) return;
        const set = this.editingWorkoutSession.exercises[exIdx].sets[sIdx];
        set.rpe = set.rpe == rpeVal ? '' : rpeVal;
        this.editingWorkoutSessionIsDirty = true;
        this.renderEditWorkoutModalUI();
    },

    addSetToEditingWorkout(exIdx) {
        if (!this.editingWorkoutSession?.exercises[exIdx]) return;
        const ex = this.editingWorkoutSession.exercises[exIdx];
        if (!ex.sets) ex.sets = [];
        const prevSet = ex.sets[ex.sets.length - 1];
        const nextNum = ex.sets.length + 1;
        ex.sets.push({
            id: 'set_' + Date.now() + '_' + nextNum,
            setNumber: nextNum,
            weightKg: prevSet ? prevSet.weightKg : '',
            reps: prevSet ? prevSet.reps : '',
            rpe: '',
            completed: true
        });
        this.editingWorkoutSessionIsDirty = true;
        this.renderEditWorkoutModalUI();
    },

    removeSetFromEditingWorkout(exIdx, sIdx) {
        if (!this.editingWorkoutSession?.exercises[exIdx]?.sets) return;
        const sets = this.editingWorkoutSession.exercises[exIdx].sets;
        sets.splice(sIdx, 1);
        sets.forEach((s, idx) => {
            s.setNumber = idx + 1;
        });
        this.editingWorkoutSessionIsDirty = true;
        this.renderEditWorkoutModalUI();
    },

    openAddExerciseToEditingWorkoutModal() {
        this.openExercisePickerModal({ mode: 'edit_workout' });
    },

    addExerciseToEditingWorkout(targetEx) {
        if (!this.editingWorkoutSession) return;
        if (!this.editingWorkoutSession.exercises) this.editingWorkoutSession.exercises = [];

        const library = Store.getExerciseLibrary();
        let target = null;
        if (typeof targetEx === 'object' && targetEx !== null) {
            target = targetEx;
        } else {
            target = library.find(e => e.id === targetEx || (e.name || '').trim().toLowerCase() === String(targetEx).trim().toLowerCase());
        }

        if (!target) {
            showToast('Exercise not found in library.', 'error');
            return;
        }

        const normName = (target.name || '').trim().toLowerCase();
        const alreadyExists = this.editingWorkoutSession.exercises.some(e =>
            (e.exerciseId && e.exerciseId === target.id) ||
            (e.name || '').trim().toLowerCase() === normName
        );

        if (alreadyExists) {
            showToast(`${target.name} is already in this workout.`, 'warning');
            return;
        }

        const perf = this.getExercisePerformanceDetails(target.name, target.id);
        const defaultWeight = perf.sets?.[0]?.weightKg ?? '';
        const defaultReps = perf.sets?.[0]?.reps ?? '';

        const newEx = {
            id: 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            exerciseId: target.id,
            name: target.name,
            muscleGroup: target.muscleGroup || 'General',
            category: target.category || target.muscleGroup || 'General',
            equipment: target.equipment || 'Standard',
            notes: target.notes || '',
            previousSets: perf.sets || [],
            sets: [
                { id: 'set_' + Date.now() + '_1', setNumber: 1, weightKg: defaultWeight, reps: defaultReps, rpe: '', completed: true },
                { id: 'set_' + Date.now() + '_2', setNumber: 2, weightKg: defaultWeight, reps: defaultReps, rpe: '', completed: true },
                { id: 'set_' + Date.now() + '_3', setNumber: 3, weightKg: defaultWeight, reps: defaultReps, rpe: '', completed: true }
            ],
            skipped: false,
            completed: true
        };

        this.editingWorkoutSession.exercises.push(newEx);
        this.editingWorkoutSessionIsDirty = true;
        this.closeExercisePickerModal();
        this.renderEditWorkoutModalUI();
        showToast(`Added ${target.name} to workout.`, 'success');
    },

    removeExerciseFromEditingWorkout(exIdx) {
        if (!this.editingWorkoutSession?.exercises) return;
        const ex = this.editingWorkoutSession.exercises[exIdx];
        const name = ex?.name || 'Exercise';
        if (!confirm(`Remove "${name}" from this workout?`)) return;

        this.editingWorkoutSession.exercises.splice(exIdx, 1);
        this.editingWorkoutSessionIsDirty = true;
        this.renderEditWorkoutModalUI();
        showToast(`Removed ${name}`, 'info');
    },

    moveExerciseInEditingWorkout(fromIdx, toIdx) {
        if (!this.editingWorkoutSession?.exercises) return;
        const exercises = this.editingWorkoutSession.exercises;
        if (toIdx < 0 || toIdx >= exercises.length) return;

        const [moved] = exercises.splice(fromIdx, 1);
        exercises.splice(toIdx, 0, moved);
        this.editingWorkoutSessionIsDirty = true;
        this.renderEditWorkoutModalUI();
    },

    saveEditedWorkout() {
        if (this._isSavingEditedWorkout) return;
        this._isSavingEditedWorkout = true;

        const saveBtn = document.getElementById('btnSaveEditedWorkout');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span>⏳</span><span>Saving...</span>';
        }

        try {
            if (!this.editingWorkoutSession) {
                throw new Error('No active workout edit session.');
            }

            const sess = this.editingWorkoutSession;

            // Authorization check
            if (!this.canUserEditSession(sess)) {
                throw new Error('You do not have permission to modify this workout session.');
            }

            // Validation: Workout date
            const targetDate = (sess.date || '').trim();
            if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
                throw new Error('Please enter a valid workout date (YYYY-MM-DD).');
            }

            // Validation: At least one exercise
            const validExercises = (sess.exercises || []).filter(e => !e.skipped);
            if (validExercises.length === 0) {
                throw new Error('Workout must contain at least one exercise.');
            }

            // Auto-complete filled sets before final totals calculation
            validExercises.forEach(ex => {
                (ex.sets || []).forEach(st => {
                    const wt = parseFloat(st.weightKg);
                    const rp = parseInt(st.reps, 10);
                    if (st.completed === undefined) {
                        st.completed = (!isNaN(wt) && !isNaN(rp) && rp > 0);
                    }
                });
            });

            // Recalculate totals
            const totals = this.calculateWorkoutTotals(validExercises);
            const routineName = (sess.routineName || sess.workoutType || 'Custom Workout').trim();
            const durationMin = Number(sess.durationMinutes ?? sess.duration ?? 0) || 0;

            const updatedSessionPayload = {
                ...sess,
                workoutType: routineName,
                routineName: routineName,
                durationMinutes: durationMin,
                duration: durationMin,
                totalVolumeKg: totals.totalVolumeKg,
                totalSets: totals.totalSets,
                totalReps: totals.totalReps,
                exerciseCount: totals.exerciseCount,
                exercises: sess.exercises,
                status: sess.status || 'completed',
                updatedAt: DateUtils.nowISO()
            };

            const saved = Store.saveWorkoutSession(updatedSessionPayload);
            if (!saved) {
                throw new Error('Failed to update workout session in local storage.');
            }

            this.editingWorkoutSessionIsDirty = false;
            this.closeEditWorkoutModal(true);

            showToast(`Workout saved! Updated to ${totals.totalSets} sets (${totals.totalVolumeKg.toLocaleString()} kg total volume).`, 'success');
            this.render();
        } catch (err) {
            console.error('[Gym] saveEditedWorkout error:', err);
            showToast('Save failed: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            this._isSavingEditedWorkout = false;
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<span>💾</span><span>Save Changes ✓</span>';
            }
        }
    },

    // -------------------------------------------------------------------------
    // Refresh Gym Data (Cloud Plan, Sessions, Exercises, Sets, PRs)
    // -------------------------------------------------------------------------
    isRefreshing: false,
    async refreshGymData() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        const btn = document.getElementById('btnGymRefresh');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '↻ REFRESHING...';
        }
        showToast('Refreshing Gym data...', 'info');

        try {
            if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
                const cloudData = await SupabaseService.fetchAllUserData();
                if (typeof SyncEngine !== 'undefined') {
                    SyncEngine.reconcile(cloudData);
                } else {
                    Store.loadFromCloud(cloudData);
                }
            } else {
                Store.init();
            }
            showToast('UPDATED', 'success');
            if (btn) {
                btn.innerHTML = '✓ UPDATED';
                setTimeout(() => {
                    const b = document.getElementById('btnGymRefresh');
                    if (b) b.innerHTML = '↻ REFRESH';
                }, 2000);
            }
        } catch (err) {
            console.error('[Gym] Refresh failed:', err);
            showToast('Refresh failed: ' + (err.message || 'Network error'), 'error');
            if (btn) btn.innerHTML = '↻ REFRESH';
        } finally {
            this.isRefreshing = false;
            const b = document.getElementById('btnGymRefresh');
            if (b) b.disabled = false;
            this.render();
        }
    },

    // -------------------------------------------------------------------------
    // Personal Records (PRs) Tab
    // -------------------------------------------------------------------------
    renderPRsDashboardHtml() {
        const prData = Store.getExercisePRs();
        const exercises = prData.exercises || [];

        if (exercises.length === 0) {
            return `
                <div class="mistake-empty-state">
                    <span style="font-size: 36px;">🏆</span>
                    <h4 style="margin: 8px 0 4px 0; color: #fff;">No Personal Records Tracked Yet</h4>
                    <p style="color: var(--text-muted); font-size: 13px;">PRs are automatically calculated from your authentic workout sessions as you log them.</p>
                </div>
            `;
        }

        return `
            <div class="prs-container">
                ${prData.bestSession ? `
                    <div class="best-session-card">
                        <span class="bs-lbl">⭐ HIGHEST VOLUME WORKOUT SESSION</span>
                        <div class="bs-val">${prData.bestSession.routineName} — ${prData.bestSession.volume.toLocaleString()} kg</div>
                        <span class="bs-sub">${prData.bestSession.date} • ${prData.bestSession.sets} Total Sets</span>
                    </div>
                ` : ''}

                <div class="prs-grid" style="margin-top: 18px;">
                    ${exercises.map(ex => `
                        <div class="pr-card">
                            <div class="pr-card-header">
                                <span class="pr-ex-name">${ex.name}</span>
                                <span class="pr-ex-muscle">${ex.muscleGroup}</span>
                            </div>
                            <div class="pr-metrics-rows">
                                <div class="pr-m-row">
                                    <span>🏋️ Heaviest Weight:</span>
                                    <b>${ex.heaviest.weightKg} kg × ${ex.heaviest.reps} (${ex.heaviest.date || '—'})</b>
                                </div>
                                <div class="pr-m-row">
                                    <span>🔁 Best Reps:</span>
                                    <b>${ex.bestReps.reps} reps @ ${ex.bestReps.weightKg} kg</b>
                                </div>
                                <div class="pr-m-row">
                                    <span>📈 Best Volume:</span>
                                    <b>${ex.bestVolume.volumeKg.toLocaleString()} kg</b>
                                </div>
                                <div class="pr-m-row">
                                    <span>⚡ Estimated 1RM:</span>
                                    <b style="color: var(--gold);">${ex.best1RM.oneRM} kg</b>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // Exercise Progression Tab
    // -------------------------------------------------------------------------
    renderExerciseProgressionSelectorHtml() {
        const gym = Store.getGymState();
        const recordedExercises = new Set();
        (gym.sessions || []).forEach(s => {
            (s.exercises || []).forEach(e => {
                if (e.name) recordedExercises.add(e.name.trim());
            });
        });
        const exList = Array.from(recordedExercises);

        if (exList.length === 0) {
            return `
                <div class="mistake-empty-state">
                    <span style="font-size: 36px;">📈</span>
                    <h4 style="margin: 8px 0 4px 0; color: #fff;">No Historical Data Yet</h4>
                    <p style="color: var(--text-muted); font-size: 13px;">Progress charts will populate as you log repeat sessions for your exercises.</p>
                </div>
            `;
        }

        const selectedEx = this.activeSelectedExercise || exList[0];
        const history = Store.getExerciseHistory(selectedEx);

        return `
            <div class="exercise-progression-wrapper">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <label style="color: var(--text-secondary); font-size: 13px;">Select Exercise to View History:</label>
                    <select class="form-input" style="width: auto; min-width: 200px;" onchange="GymEngine.selectExerciseForChart(this.value)">
                        ${exList.map(name => `<option value="${name}" ${name === selectedEx ? 'selected' : ''}>${name}</option>`).join('')}
                    </select>
                </div>

                <div class="ex-progression-details">
                    <h4 style="margin: 0 0 12px 0; color: #fff;">${selectedEx} — Progression Over Time</h4>

                    <!-- SVG Chart -->
                    ${this.renderProgressionSvgChart(history)}

                    <!-- Table -->
                    <div class="ex-history-table-wrap" style="margin-top: 20px;">
                        <table class="ex-history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Max Weight</th>
                                    <th>Max Reps</th>
                                    <th>Total Volume</th>
                                    <th>Est. 1RM</th>
                                    <th>Sets Breakdown</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(h => `
                                    <tr>
                                        <td>${h.date}</td>
                                        <td><b>${h.maxWeight} kg</b></td>
                                        <td>${h.maxReps}</td>
                                        <td>${h.volume.toLocaleString()} kg</td>
                                        <td><b style="color: var(--gold);">${h.est1RM} kg</b></td>
                                        <td style="font-size: 12px; color: var(--text-secondary);">
                                            ${h.sets.map(s => `${s.weightKg}×${s.reps}`).join(', ')}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    selectExerciseForChart(name) {
        this.activeSelectedExercise = name;
        this.render();
    },

    renderProgressionSvgChart(history) {
        if (!history || history.length === 0) {
            return '<div style="color: var(--text-muted); padding: 20px;">No historical data yet.</div>';
        }

        if (history.length === 1) {
            return `
                <div style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 13px;">
                    1 session logged so far: <b>${history[0].maxWeight} kg</b> on ${history[0].date}. Log more sessions to generate progressive overload trajectory.
                </div>
            `;
        }

        const width = 600;
        const height = 180;
        const padding = 30;

        const maxWeight = Math.max(...history.map(h => h.maxWeight), 10);
        const minWeight = Math.min(...history.map(h => h.maxWeight), 0);
        const range = (maxWeight - minWeight) || 10;

        const points = history.map((h, idx) => {
            const x = padding + (idx / (history.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((h.maxWeight - minWeight) / range) * (height - 2 * padding);
            return { x, y, weight: h.maxWeight, date: h.date };
        });

        const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

        return `
            <div class="progression-svg-wrap">
                <svg viewBox="0 0 ${width} ${height}" class="prog-svg">
                    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
                    <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4" />
                    <path d="${pathD}" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linecap="round" />
                    ${points.map(p => `
                        <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--gold)" />
                        <text x="${p.x}" y="${p.y - 10}" fill="#fff" font-size="10" text-anchor="middle">${p.weight}kg</text>
                        <text x="${p.x}" y="${height - 12}" fill="var(--text-muted)" font-size="9" text-anchor="middle">${p.date.slice(5)}</text>
                    `).join('')}
                </svg>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // Workout Plan Editor & Setup Wizard
    // -------------------------------------------------------------------------
    openEditPlanModal() {
        const gym = Store.getGymState();
        this.wizardData.selectedDays = Object.keys(gym.schedule || {}).filter(k => !gym.schedule[k].isRestDay);
        this.wizardData.dayRoutines = JSON.parse(JSON.stringify(gym.schedule || {}));
        this.wizardData.step = 1;
        this.wizardData.error = null;
        this.wizardData.isSaving = false;
        this.wizardData.activeExerciseDayIndex = 0;
        this.wizardData.settings = { ...(gym.settings || {}) };

        let modal = document.getElementById('editGymPlanModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'editGymPlanModal';
            document.body.appendChild(modal);
        }

        modal.onclick = (e) => {
            if (e.target === modal) {
                GymEngine.closeEditPlanModal();
            }
        };

        modal.innerHTML = `
            <div class="modal-window edit-gym-modal-window">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">Routine Management</span>
                        <h3 class="wizard-modal-title">Edit Workout Plan</h3>
                    </div>
                    <button type="button" class="btn-close-modal" aria-label="Close workout plan editor" onclick="GymEngine.closeEditPlanModal()">×</button>
                </div>

                <div class="modal-body" id="editGymPlanModalBody">
                    ${this.renderWizardHtml()}
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeEditPlanModal() {
        const modal = document.getElementById('editGymPlanModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    updateWizardView() {
        const modal = document.getElementById('editGymPlanModal');
        const modalBody = document.getElementById('editGymPlanModalBody');
        if (modal && modal.classList.contains('active') && modalBody) {
            modalBody.innerHTML = this.renderWizardHtml();
        } else {
            this.render();
        }
    },

    renderWizardHtml() {
        const step = this.wizardData.step;
        const days = [
            { key: 'monday', abbr: 'MON', label: 'Monday' },
            { key: 'tuesday', abbr: 'TUE', label: 'Tuesday' },
            { key: 'wednesday', abbr: 'WED', label: 'Wednesday' },
            { key: 'thursday', abbr: 'THU', label: 'Thursday' },
            { key: 'friday', abbr: 'FRI', label: 'Friday' },
            { key: 'saturday', abbr: 'SAT', label: 'Saturday' },
            { key: 'sunday', abbr: 'SUN', label: 'Sunday' }
        ];

        let contentHtml = '';

        if (step === 1) {
            const trainCount = this.wizardData.selectedDays.length;
            const restCount = 7 - trainCount;

            contentHtml = `
                <div class="wizard-step-box">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="wizard-step-tag">Step 1 of 3</span>
                        <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">Days Selection</span>
                    </div>

                    <div>
                        <h3 class="wizard-step-title">Which days do you go to the gym?</h3>
                        <p class="wizard-step-desc">
                            Select the days of the week you train. Days not selected will automatically be designated as Rest days.
                        </p>
                    </div>

                    <div class="wizard-days-grid" role="group" aria-label="Select training days">
                        ${days.map(d => {
                            const isSelected = this.wizardData.selectedDays.includes(d.key);
                            return `
                                <button
                                    type="button"
                                    class="wizard-day-card ${isSelected ? 'selected' : ''}"
                                    aria-pressed="${isSelected}"
                                    aria-label="${d.label} - ${isSelected ? 'Selected Training Day' : 'Rest Day'}"
                                    onclick="GymEngine.toggleWizardDay('${d.key}')"
                                >
                                    <span class="day-card-abbr">${d.abbr}</span>
                                    <span class="day-card-label">${d.label}</span>
                                    <span class="day-card-status ${isSelected ? 'train' : 'rest'}">
                                        ${isSelected ? '✓ Train' : '○ Rest'}
                                    </span>
                                </button>
                            `;
                        }).join('')}
                    </div>

                    <div class="wizard-days-summary">
                        <span>
                            <b>${trainCount}</b> ${trainCount === 1 ? 'training day' : 'training days'} selected
                            •
                            <b>${restCount}</b> ${restCount === 1 ? 'rest day' : 'rest days'}
                        </span>
                        <span style="font-size: 11.5px; color: var(--text-muted);">Click day card to toggle</span>
                    </div>

                    ${this.wizardData.error ? `
                        <div class="wizard-inline-error" role="alert">
                            <span>⚠️</span>
                            <span>${this.wizardData.error}</span>
                        </div>
                    ` : ''}

                    <div class="wizard-footer" style="justify-content: flex-end;">
                        <button type="button" class="btn-primary" onclick="GymEngine.wizardNext()">
                            Next: Define Split →
                        </button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            contentHtml = `
                <div class="wizard-step-box">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="wizard-step-tag">Step 2 of 3</span>
                        <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">${this.wizardData.selectedDays.length} Training Days</span>
                    </div>

                    <div>
                        <h3 class="wizard-step-title">What do you do on each training day?</h3>
                        <p class="wizard-step-desc">
                            Your routine for each training day. Define target split names.
                        </p>
                    </div>

                    <div class="wizard-quick-splits">
                        <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Quick Preset:</span>
                        ${['Back + Biceps', 'Legs + Shoulders', 'Chest + Triceps', 'Chest + Biceps', 'Push', 'Pull', 'Legs', 'Upper Body'].map(chip => `
                            <button type="button" class="quick-split-chip" onclick="GymEngine.applyQuickSplitPreset('${chip}')">${chip}</button>
                        `).join('')}
                    </div>

                    <datalist id="canonicalSplitPresets">
                        <option value="Back + Biceps">
                        <option value="Legs + Shoulders">
                        <option value="Chest + Triceps">
                        <option value="Chest + Biceps">
                        <option value="Back + Triceps">
                        <option value="Push">
                        <option value="Pull">
                        <option value="Legs">
                        <option value="Upper Body">
                        <option value="Lower Body">
                        <option value="Full Body">
                        <option value="Core + Cardio">
                    </datalist>

                    <div class="wizard-routines-list">
                        ${(() => {
                            const CANONICAL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                            const sortedDays = CANONICAL_DAYS.filter(k => this.wizardData.selectedDays.includes(k));
                            return sortedDays.map(dayKey => {
                                const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                                const currentVal = this.wizardData.dayRoutines[dayKey]?.routineName || this.wizardData.dayRoutines[dayKey]?.workoutType || '';
                                return `
                                    <div class="wizard-day-input-row">
                                        <div class="wizard-day-label">
                                            <span class="day-badge-tag">${dayName}</span>
                                        </div>
                                        <input
                                            type="text"
                                            list="canonicalSplitPresets"
                                            class="form-input"
                                            placeholder="e.g. Chest + Biceps, Back + Biceps, Legs + Shoulders"
                                            value="${currentVal}"
                                            oninput="GymEngine.updateDayRoutineName('${dayKey}', this.value)"
                                        >
                                    </div>
                                `;
                            }).join('');
                        })()}
                    </div>

                    ${this.wizardData.error ? `
                        <div class="wizard-inline-error" role="alert">
                            <span>⚠️</span>
                            <span>${this.wizardData.error}</span>
                        </div>
                    ` : ''}

                    <div class="wizard-footer">
                        <button type="button" class="action-btn-ghost" onclick="GymEngine.wizardBack()">← Back</button>
                        <button type="button" class="btn-primary" onclick="GymEngine.wizardNext()">Next: Review Plan →</button>
                    </div>
                </div>
            `;
        } else if (step === 3 || step === 4) {
            contentHtml = `
                <div class="wizard-step-box">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="wizard-step-tag">Step 3 of 3</span>
                        <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">Plan Confirmation</span>
                    </div>

                    <div>
                        <h3 class="wizard-step-title">Confirm Your Weekly Workout Split</h3>
                        <p class="wizard-step-desc">
                            Your recurring weekly schedule. Workouts repeat automatically every week.
                        </p>
                    </div>

                    <div class="wizard-plan-summary">
                        <div class="wizard-plan-summary-header">
                            <span>📅 Weekly Split Overview</span>
                            <span style="color: var(--gold); font-size: 12px;">${this.wizardData.selectedDays.length} Training Days</span>
                        </div>
                        <div class="wizard-schedule-chips-row">
                            ${days.map(d => {
                                const isTrain = this.wizardData.selectedDays.includes(d.key);
                                const routine = this.wizardData.dayRoutines[d.key];
                                const routineName = routine?.routineName || `${d.label} Workout`;
                                return `
                                    <div class="wizard-schedule-chip ${isTrain ? 'train' : 'rest'}">
                                        <b>${d.abbr}:</b> ${isTrain ? routineName : 'Rest'}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="wizard-footer" style="margin-top: 24px;">
                        <button type="button" class="action-btn-ghost" onclick="GymEngine.wizardBack()">← Back</button>
                        <button type="button" class="btn-primary" onclick="GymEngine.finishWizard()">Save Workout Plan ✓</button>
                    </div>
                </div>
            `;
        }

        return contentHtml;
    },

    toggleWizardDay(dayKey) {
        const idx = this.wizardData.selectedDays.indexOf(dayKey);
        if (idx >= 0) {
            this.wizardData.selectedDays.splice(idx, 1);
        } else {
            this.wizardData.selectedDays.push(dayKey);
        }
        this.wizardData.error = null;
        this.updateWizardView();
    },

    updateDayRoutineName(dayKey, val) {
        if (!this.wizardData.dayRoutines[dayKey]) {
            this.wizardData.dayRoutines[dayKey] = { routineName: '', exercises: [] };
        }
        this.wizardData.dayRoutines[dayKey].routineName = val;
    },

    applyQuickSplitPreset(preset) {
        this.wizardData.selectedDays.forEach(dk => {
            if (!this.wizardData.dayRoutines[dk]) {
                this.wizardData.dayRoutines[dk] = { routineName: '', exercises: [] };
            }
            if (!this.wizardData.dayRoutines[dk].routineName) {
                this.wizardData.dayRoutines[dk].routineName = preset;
            }
        });
        this.updateWizardView();
    },

    wizardNext() {
        if (this.wizardData.step === 1) {
            if (this.wizardData.selectedDays.length === 0) {
                this.wizardData.error = 'Please select at least 1 training day.';
                this.updateWizardView();
                return;
            }
            this.wizardData.step = 2;
        } else if (this.wizardData.step === 2) {
            for (const dk of this.wizardData.selectedDays) {
                const r = this.wizardData.dayRoutines[dk];
                if (!r || !r.routineName || !r.routineName.trim()) {
                    const dayCapital = dk.charAt(0).toUpperCase() + dk.slice(1);
                    this.wizardData.error = `Please name your routine for ${dayCapital}.`;
                    this.updateWizardView();
                    return;
                }
            }
            this.wizardData.step = 3;
        }
        this.wizardData.error = null;
        this.updateWizardView();
    },

    wizardBack() {
        if (this.wizardData.step > 1) {
            this.wizardData.step--;
            this.wizardData.error = null;
            this.updateWizardView();
        }
    },

    finishWizard() {
        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const schedule = {};

        allDays.forEach(dayKey => {
            const isTrainDay = this.wizardData.selectedDays.includes(dayKey);
            const dayCapital = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);

            if (isTrainDay) {
                const userRoutine = this.wizardData.dayRoutines[dayKey] || {};
                const rName = (userRoutine.routineName || userRoutine.workoutType || '').trim() || `${dayCapital} Workout`;
                const muscleGroups = userRoutine.muscleGroups || (rName ? rName.split('+').map(s => s.trim()) : []);
                schedule[dayKey] = {
                    dayKey,
                    dayName: dayCapital,
                    routineName: rName,
                    workoutType: rName,
                    isRestDay: false,
                    muscleGroups,
                    exercises: userRoutine.exercises || []
                };
            } else {
                schedule[dayKey] = {
                    dayKey,
                    dayName: dayCapital,
                    routineName: 'Rest',
                    workoutType: 'Rest',
                    isRestDay: true,
                    muscleGroups: [],
                    exercises: []
                };
            }
        });

        Store.saveGymPlan({
            settings: this.wizardData.settings,
            schedule
        });

        this.closeEditPlanModal();
        showToast('PLAN SAVED', 'success');
        // Re-read persisted plan from Store
        Store.getGymState();
        this.render();
    },

    // -------------------------------------------------------------------------
    // Lightweight Lifestyle Elements: Food, Water, Supplements, Sleep, Activity
    // -------------------------------------------------------------------------
    renderFoodPreservedHtml() {
        return `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.2)); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 28px;">🥗</span>
                    <div>
                        <div style="font-size: 14.5px; font-weight: 700; color: #34d399;">Strict 7-Day Hostel Fat Loss & Nutrition System</div>
                        <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">92 kg → 87 kg Milestone · 2,250 kcal · 150g Protein · Eggs/Soy/Paneer/Oats · Weekly Trend Analysis</div>
                    </div>
                </div>
                <button class="btn-primary" onclick="App.switchView('nutrition')" style="padding: 8px 18px; font-size: 12.5px; background: #059669; border-color: #10b981;">
                    Open Full Nutrition Engine ➔
                </button>
            </div>

            <div class="hero-banner">
                <div class="hero-content">
                    <h3>🥣 Hostel Post-Workout Kitchen</h3>
                    <p>Nutritious, high-protein recipes crafted around your primary hostel ingredients: <b>Soya Chunks</b> and <b>Chocolate Protein Oats</b>. Rotating automatically every day.</p>
                </div>
                <button class="btn-primary" id="btnFoodNewRecipe" onclick="App.rollRandomRecipe()">
                    🎲 Roll Another Recipe
                </button>
            </div>

            <div class="postworkout-recipe-card" style="margin-top: 20px;">
                <div class="recipe-header-row">
                    <div>
                        <span class="recipe-badge">Featured Recipe</span>
                        <div class="recipe-name" id="foodViewRecipeName">Masala Soya Oats Power Bowl</div>
                        <div class="recipe-meta-tags">
                            <span>⏱ Cook Time: <b id="foodViewRecipeTime">12-15 mins</b></span>
                            <span>⚡ Difficulty: <b id="foodViewRecipeDiff">Easy</b></span>
                            <span>💪 High Protein Soya + Oats Combo</span>
                        </div>
                    </div>
                </div>

                <div class="recipe-body-grid">
                    <div class="recipe-ingredients">
                        <h5>Required Ingredients</h5>
                        <ul id="foodViewRecipeIngredients"></ul>
                    </div>
                    <div class="recipe-steps">
                        <h5>Preparation & Cooking Method</h5>
                        <ol id="foodViewRecipeSteps"></ol>
                    </div>
                </div>
            </div>

            <div class="section-title-bar" style="margin-top: 24px;">
                <div>
                    <h3>All Soya & Protein Oats Recipe Variations</h3>
                    <p>Quick reference catalog for hostel cooking.</p>
                </div>
            </div>
            <div class="placement-topics-grid" id="allRecipesCatalogGrid"></div>
        `;
    },

    renderWaterTrackerHtml() {
        const todayStr = DateUtils.todayIST();
        const key = `studyos_water_${todayStr}`;
        const currentGlasses = parseInt(localStorage.getItem(key) || '0', 10);

        return `
            <div class="lifestyle-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; color: #fff;">💧 Daily Hydration Tracker</h3>
                        <p style="color: var(--text-secondary); margin: 4px 0 0 0; font-size: 13px;">Target: 3.5 Liters (14 glasses of 250ml) for focus and creatine synergy.</p>
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--sky);">${currentGlasses * 250} ml / 3500 ml</div>
                </div>

                <div class="water-glasses-row" style="margin-top: 20px; display: flex; gap: 8px; flex-wrap: wrap;">
                    ${Array.from({ length: 14 }).map((_, i) => `
                        <button class="water-glass-btn ${i < currentGlasses ? 'drank' : ''}" onclick="GymEngine.setWaterGlasses(${i + 1})">
                            ${i < currentGlasses ? '💧' : '○'}
                        </button>
                    `).join('')}
                </div>

                <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
                    <button class="action-btn-ghost danger" onclick="GymEngine.setWaterGlasses(0)">Reset Today</button>
                </div>
            </div>
        `;
    },

    setWaterGlasses(num) {
        const todayStr = DateUtils.todayIST();
        localStorage.setItem(`studyos_water_${todayStr}`, num);
        this.render();
    },

    renderSupplementsHtml() {
        const todayStr = DateUtils.todayIST();
        const key = `studyos_creatine_${todayStr}`;
        const taken = localStorage.getItem(key) === 'true';

        return `
            <div class="lifestyle-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; color: #fff;">💊 Daily Creatine Monohydrate</h3>
                        <p style="color: var(--text-secondary); margin: 4px 0 0 0; font-size: 13px;">5g daily with water post-workout or after dinner. Saturates muscle phosphocreatine and sharpens cognition.</p>
                    </div>
                    <button class="btn-primary ${taken ? 'success' : ''}" style="padding: 10px 20px;" onclick="GymEngine.toggleCreatine()">
                        ${taken ? '✓ Taken Today (5g)' : 'Mark 5g Taken'}
                    </button>
                </div>
            </div>
        `;
    },

    toggleCreatine() {
        const todayStr = DateUtils.todayIST();
        const key = `studyos_creatine_${todayStr}`;
        const current = localStorage.getItem(key) === 'true';
        localStorage.setItem(key, (!current).toString());
        showToast(!current ? 'Creatine 5g logged for today!' : 'Creatine uncheck.', 'info');
        this.render();
    },

    renderSleepTrackerHtml() {
        return `
            <div class="lifestyle-card">
                <h3 style="margin: 0; color: #fff;">😴 Sleep & Night Recovery</h3>
                <p style="color: var(--text-secondary); margin: 4px 0 16px 0; font-size: 13px;">Standard window: 02:00 AM – 06:30 AM (4.5h core) + afternoon college power nap.</p>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <label>Hours slept last night:</label>
                    <input type="number" step="0.5" class="form-input" style="width: 100px;" value="6.5">
                    <button class="btn-primary" style="padding: 6px 14px;" onclick="showToast('Sleep logged!', 'success')">Save</button>
                </div>
            </div>
        `;
    },

    renderActivityTrackerHtml() {
        return `
            <div class="lifestyle-card">
                <h3 style="margin: 0; color: #fff;">🚶 Daily Walking & Campus Steps</h3>
                <p style="color: var(--text-secondary); margin: 4px 0 16px 0; font-size: 13px;">Target: 8,000 steps across hostel, college campus, and gym walk.</p>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <label>Steps today:</label>
                    <input type="number" class="form-input" style="width: 140px;" placeholder="e.g. 7450" value="6200">
                    <button class="btn-primary" style="padding: 6px 14px;" onclick="showToast('Steps logged!', 'success')">Save</button>
                </div>
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.GymEngine = GymEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GymEngine };
}
