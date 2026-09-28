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

    // -------------------------------------------------------------------------
    // Top-Level Lifestyle View Renderer (Gym, Food, Water, Sleep, etc.)
    // -------------------------------------------------------------------------
    render() {
        const container = document.getElementById('view-food');
        if (!container) return;

        container.innerHTML = `
            <div class="lifestyle-header-banner">
                <div class="lifestyle-header-content">
                    <span class="lifestyle-badge-pill">⚡ Body & Health Command</span>
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
                            <h3 style="margin: 4px 0 2px 0; color: #fff; font-size: 22px;">${completedSession.routineName}</h3>
                            <span style="color: var(--text-secondary); font-size: 13px;">Finished in ${completedSession.durationMinutes || completedSession.duration || 0} mins • Total Volume: ${(completedSession.totalVolumeKg || 0).toLocaleString()} kg (${completedSession.totalSets || 0} sets)</span>
                            <div class="twh-muscle-pills" style="margin-top: 10px;">
                                ${muscleGroups.map(m => `<span class="twh-muscle-pill">${m}</span>`).join('')}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            ${(completedSession.gym_photo_path || completedSession.gymPhoto?.storagePath || completedSession.gymPhoto?.url || completedSession.gym_photo_url || completedSession.gymPhoto?.base64) ? `
                                <button class="btn-view-photo" onclick="GymEngine.viewSessionPhoto('${completedSession.id}')">
                                    📸 View Gym Photo
                                </button>
                            ` : ''}
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
                        <div style="font-size: 20px; font-weight: 800; color: var(--gold); margin-top: 2px;">${templ.routineName}</div>
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
            showToast('Today is a scheduled Rest Day. You can use + LOG WORKOUT to select a routine.', 'info');
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
            const choices = [
                { routineName: 'Back + Biceps', muscleGroups: ['Back', 'Biceps'] },
                { routineName: 'Legs + Shoulders', muscleGroups: ['Legs', 'Shoulders'] },
                { routineName: 'Chest + Triceps', muscleGroups: ['Chest', 'Triceps'] }
            ];
            const choice = prompt('Select workout routine to log:\n1. Back + Biceps\n2. Legs + Shoulders\n3. Chest + Triceps', '1');
            if (!choice) return;
            const idx = parseInt(choice.trim(), 10) - 1;
            const sel = choices[idx] || choices[0];
            this.openCheckInModal({
                dayKey: 'custom',
                routineName: sel.routineName,
                targetMuscleGroups: sel.muscleGroups
            });
        }
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
    // Stage 1: Exercise Selection UI
    // -------------------------------------------------------------------------
    renderExerciseSelectionHtml() {
        const sess = this.liveWorkout;
        const targetGroups = sess.targetMuscleGroups || [];
        const selectedIds = sess.selectedExerciseIds || [];
        const library = Store.getExerciseLibrary();

        // Selected exercise objects
        const selectedExercises = library.filter(e => selectedIds.includes(e.id));

        return `
            <div class="ex-selection-container">
                <div class="ex-selection-header">
                    <div>
                        <span class="twh-badge">TODAY'S WORKOUT</span>
                        <h2 style="margin: 4px 0 2px 0; color: #fff; font-size: 24px; font-weight: 800;">${sess.routineName}</h2>
                        <p style="color: var(--text-secondary); margin: 4px 0 0 0; font-size: 13px;">
                            Select the exercises you performed today. You can select, deselect, or create custom exercises.
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="action-btn-ghost" style="padding: 8px 14px; font-size: 12.5px;" onclick="GymEngine.openCreateExerciseModal()">
                            ＋ Create New Exercise
                        </button>
                    </div>
                </div>

                <!-- Exercise Search Bar -->
                <div style="margin-bottom: 20px;">
                    <input
                        type="text"
                        class="form-input"
                        placeholder="Search exercises by name, muscle group, or equipment..."
                        value="${this.exerciseSearchQuery}"
                        oninput="GymEngine.onExerciseSearch(this.value)"
                        style="width: 100%; max-width: 480px;"
                    >
                </div>

                <!-- Muscle Group Blocks -->
                ${targetGroups.map(mg => {
                    const groupExs = Store.getExerciseLibrary({
                        muscleGroup: mg,
                        search: this.exerciseSearchQuery
                    });

                    return `
                        <div class="ex-category-block">
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

                <!-- Additional exercises if search query matches outside primary groups -->
                ${this.exerciseSearchQuery ? `
                    <div class="ex-category-block">
                        <div class="ex-category-title">
                            <span>🔍</span>
                            <span>OTHER MATCHING EXERCISES</span>
                        </div>
                        <div class="ex-chips-grid">
                            ${Store.getExerciseLibrary({ search: this.exerciseSearchQuery })
                                .filter(e => !targetGroups.some(tg => tg.toLowerCase() === (e.muscleGroup || '').toLowerCase()))
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

                <!-- TODAY'S EXERCISES Shelf -->
                <div class="today-ex-shelf">
                    <div class="today-shelf-header">
                        <div>
                            <span style="font-size: 11px; color: var(--gold); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">CHECKLIST</span>
                            <h4 style="margin: 2px 0 0 0; color: #fff; font-size: 16px;">
                                TODAY'S EXERCISES (${selectedExercises.length} selected)
                            </h4>
                        </div>
                        <button
                            type="button"
                            class="btn-primary"
                            style="padding: 10px 22px; font-weight: 800; font-size: 13.5px;"
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
                            <span style="color: var(--text-muted); font-size: 12.5px;">Click any exercise chip above to add it to today's workout.</span>
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
            const def = library.find(e => e.id === id) || { name: 'Exercise', muscleGroup: 'General' };
            const history = Store.getExerciseHistory(def.name);
            const lastSession = history.length > 0 ? history[history.length - 1] : null;

            return {
                id: def.id || 'ex_' + Date.now(),
                name: def.name,
                muscleGroup: def.muscleGroup || 'General',
                notes: def.notes || '',
                previousSets: lastSession?.sets || [],
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

                        const prevSets = ex.previousSets || [];
                        const prevRefText = prevSets.length > 0
                            ? prevSets.map((ps, i) => `Set ${i+1}: <b>${ps.weightKg} kg × ${ps.reps}</b>`).join(' &nbsp;•&nbsp; ')
                            : 'No previous record';

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
                                    <span class="prev-title">⏮ LAST TIME:</span>
                                    <div class="prev-content">${prevRefText}</div>
                                </div>

                                <!-- Sets Table -->
                                <div class="live-sets-table">
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
        const library = Store.getExerciseLibrary();
        const search = prompt('Enter exercise name to add to current workout:');
        if (!search || !search.trim()) return;

        const match = library.find(e => e.name.toLowerCase() === search.trim().toLowerCase());
        const exName = match ? match.name : search.trim();
        const muscleGroup = match ? match.muscleGroup : 'General';

        const history = Store.getExerciseHistory(exName);
        const lastSession = history.length > 0 ? history[history.length - 1] : null;

        this.liveWorkout.exercises.push({
            id: 'ex_' + Date.now(),
            name: exName,
            muscleGroup,
            notes: '',
            previousSets: lastSession?.sets || [],
            sets: [
                { setNumber: 1, weightKg: '', reps: '', rpe: '', completed: false },
                { setNumber: 2, weightKg: '', reps: '', rpe: '', completed: false },
                { setNumber: 3, weightKg: '', reps: '', rpe: '', completed: false }
            ],
            skipped: false,
            completed: false
        });

        Store.saveActiveWorkoutSession(this.liveWorkout);
        showToast(`Added ${exName} to today's workout.`, 'success');
        this.render();
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

    promptCustomRestTimer() {
        const inp = prompt('Enter rest duration in seconds (e.g. 45, 75, 150):', '60');
        if (!inp) return;
        const s = parseInt(inp.trim(), 10);
        if (s > 0) this.startRestTimer(s);
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

        // Synchronize with Supabase cloud database if user is authenticated
        if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
            SupabaseService.saveWorkoutSession(savedSession).then(() => {
                console.log('[Gym] Workout session synchronized with Supabase cloud database.');
            }).catch(syncErr => {
                console.warn('[Gym] Cloud sync warning:', syncErr.message);
                showToast("Saved locally. Cloud sync pending: " + syncErr.message, "warning");
            });
        }

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
            this.liveWorkout.selectedExerciseIds.push(newEx.id);
            Store.saveActiveWorkoutSession(this.liveWorkout);
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
                            return `
                                <div class="history-session-card">
                                    <div class="h-sess-left">
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                                            <span style="color: var(--emerald);">🟢</span>
                                            <span class="h-sess-date">${s.date}</span>
                                            <span style="font-size: 11px; color: var(--text-muted);">(${s.dayOfWeek || s.dayKey || ''})</span>
                                        </div>
                                        <h4 class="h-sess-title" style="margin: 2px 0 6px 0;">${s.routineName}</h4>
                                        <div class="h-sess-meta">
                                            <span>⏱ ${s.durationMinutes || s.duration || 0} min</span>
                                            <span>🏋️ ${s.exercises?.length || 0} exercises / ${s.totalSets || 0} sets</span>
                                            <span>📈 Volume: ${(s.totalVolumeKg || 0).toLocaleString()} kg</span>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        ${hasPhoto ? `
                                            <button class="btn-view-photo" onclick="GymEngine.viewSessionPhoto('${s.id}')">
                                                📸 View Gym Photo
                                            </button>
                                        ` : ''}
                                        <button class="action-btn-ghost" onclick="GymEngine.viewSessionDetails('${s.id}')">
                                            View Workout Log ↗
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

    async viewSessionPhoto(id) {
        const s = Store.getWorkoutSessionById(id);
        if (!s) return;
        const photoPath = s.gym_photo_path || s.gymPhoto?.storagePath;
        let photoUrl = s.gymPhoto?.url || s.gym_photo_url || (s.gymPhoto?.base64 && s.gymPhoto.base64.startsWith('data:') ? s.gymPhoto.base64 : null);

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

        const hasAnyPhoto = !!(photoPath || photoUrl);
        const capturedTimeText = s.gymPhoto?.createdAt || s.gym_photo_created_at || s.completedAt || s.startedAt || s.date;
        const formattedCaptured = capturedTimeText ? new Date(capturedTimeText).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Verified';

        modal.innerHTML = `
            <div class="modal-window gym-checkin-modal-window" style="max-width: 600px;">
                <div class="modal-header">
                    <div>
                        <span class="wizard-modal-eyebrow">GYM CHECK-IN PHOTO</span>
                        <h3 class="wizard-modal-title">${s.routineName} — ${s.date}</h3>
                    </div>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('gymPhotoViewModal').classList.remove('active')">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div id="gymPhotoContainer" class="camera-viewport-card" style="min-height: 320px; border-style: solid; border-color: rgba(245,197,24,0.4); display: flex; align-items: center; justify-content: center; position: relative;">
                        ${!hasAnyPhoto ? `
                            <div style="text-align: center; padding: 24px;">
                                <span style="font-size: 32px; display: block; margin-bottom: 8px;">📷</span>
                                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO UNAVAILABLE</div>
                                <div style="color: var(--text-muted); font-size: 12px; max-width: 320px;">No gym check-in photo recorded for this workout session.</div>
                            </div>
                        ` : photoUrl ? `
                            <img src="${photoUrl}" alt="Gym Check-In Photo" class="camera-preview-img" onerror="GymEngine.handlePhotoLoadError(this, '${s.id}')">
                        ` : `
                            <div id="gymPhotoLoadingState" style="text-align: center; padding: 24px;">
                                <div class="gym-photo-spinner" style="width: 36px; height: 36px; border: 3px solid rgba(245,197,24,0.2); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px auto;"></div>
                                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO LOADING</div>
                                <div style="color: var(--text-muted); font-size: 12px; max-width: 320px;">Retrieving secure check-in photo from cloud storage...</div>
                            </div>
                        `}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 12px; margin-top: 10px;">
                        <span>Session ID: ${s.id}</span>
                        <span>Captured: ${formattedCaptured}</span>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; padding: 14px 20px;">
                    <button class="btn-primary" onclick="document.getElementById('gymPhotoViewModal').classList.remove('active')">Close</button>
                </div>
            </div>
        `;

        modal.classList.add('active');

        // If we need to fetch signed URL from Supabase Storage
        if (!photoUrl && photoPath) {
            if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
                SupabaseService.getSignedGymPhotoUrl(photoPath).then(signedUrl => {
                    const container = document.getElementById('gymPhotoContainer');
                    if (!container) return;
                    if (signedUrl) {
                        container.innerHTML = `<img src="${signedUrl}" alt="Gym Check-In Photo" class="camera-preview-img" onerror="GymEngine.handlePhotoLoadError(this, '${s.id}')">`;
                    } else {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 24px;">
                                <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚠️</span>
                                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO UNAVAILABLE</div>
                                <div style="color: var(--text-muted); font-size: 12px; max-width: 340px; margin-bottom: 12px;">Could not generate secure temporary URL. Access was denied or photo expired.</div>
                                <button class="action-btn-ghost" style="font-size: 12px; padding: 4px 12px;" onclick="GymEngine.viewSessionPhoto('${s.id}')">Retry 🔄</button>
                            </div>
                        `;
                    }
                }).catch(err => {
                    console.warn('[Gym] Error getting signed photo URL:', err);
                    const container = document.getElementById('gymPhotoContainer');
                    if (container) {
                        container.innerHTML = `
                            <div style="text-align: center; padding: 24px;">
                                <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚠️</span>
                                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO UNAVAILABLE</div>
                                <div style="color: var(--text-muted); font-size: 12px; max-width: 340px; margin-bottom: 12px;">Network error while fetching photo from cloud storage.</div>
                                <button class="action-btn-ghost" style="font-size: 12px; padding: 4px 12px;" onclick="GymEngine.viewSessionPhoto('${s.id}')">Retry 🔄</button>
                            </div>
                        `;
                    }
                });
            } else {
                const container = document.getElementById('gymPhotoContainer');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 24px;">
                            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔒</span>
                            <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO UNAVAILABLE</div>
                            <div style="color: var(--text-muted); font-size: 12px; max-width: 340px;">Authentication required to view private gym check-in photo.</div>
                        </div>
                    `;
                }
            }
        }
    },

    handlePhotoLoadError(imgEl, sessionId) {
        if (!imgEl) return;
        const parent = imgEl.parentElement;
        if (!parent) return;
        parent.innerHTML = `
            <div style="text-align: center; padding: 24px;">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">📷</span>
                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-bottom: 4px;">PHOTO UNAVAILABLE</div>
                <div style="color: var(--text-muted); font-size: 12px; max-width: 340px; margin-bottom: 12px;">The photo could not be rendered or the temporary signed URL has expired.</div>
                <button class="action-btn-ghost" style="font-size: 12px; padding: 4px 12px;" onclick="GymEngine.viewSessionPhoto('${sessionId}')">Refresh Photo 🔄</button>
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

                <div class="modal-footer" style="display: flex; justify-content: space-between; padding: 16px;">
                    <button class="action-btn-ghost danger" onclick="if(confirm('Delete this workout session permanently?')) { Store.deleteWorkoutSession('${s.id}'); document.getElementById('workoutSessionDetailModal').classList.remove('active'); GymEngine.render(); }">
                        Delete Session
                    </button>
                    <button class="btn-primary" onclick="document.getElementById('workoutSessionDetailModal').classList.remove('active')">Close</button>
                </div>
            </div>
        `;

        modal.classList.add('active');
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
                        ${['Back + Biceps', 'Legs + Shoulders', 'Chest + Triceps', 'Push', 'Pull', 'Legs', 'Upper Body'].map(chip => `
                            <button type="button" class="quick-split-chip" onclick="GymEngine.applyQuickSplitPreset('${chip}')">${chip}</button>
                        `).join('')}
                    </div>

                    <div class="wizard-routines-list">
                        ${this.wizardData.selectedDays.map(dayKey => {
                            const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                            const currentVal = this.wizardData.dayRoutines[dayKey]?.routineName || '';
                            return `
                                <div class="wizard-day-input-row">
                                    <div class="wizard-day-label">
                                        <span class="day-badge-tag">${dayName}</span>
                                    </div>
                                    <input
                                        type="text"
                                        class="form-input"
                                        placeholder="e.g. Back + Biceps, Legs + Shoulders, Chest + Triceps"
                                        value="${currentVal}"
                                        oninput="GymEngine.updateDayRoutineName('${dayKey}', this.value)"
                                    >
                                </div>
                            `;
                        }).join('')}
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
                const rName = userRoutine.routineName?.trim() || `${dayCapital} Workout`;
                const muscleGroups = userRoutine.muscleGroups || (rName ? rName.split('+').map(s => s.trim()) : []);
                schedule[dayKey] = {
                    dayKey,
                    dayName: dayCapital,
                    routineName: rName,
                    isRestDay: false,
                    muscleGroups,
                    exercises: userRoutine.exercises || []
                };
            } else {
                schedule[dayKey] = {
                    dayKey,
                    dayName: dayCapital,
                    routineName: 'Rest',
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
        showToast('Workout plan updated successfully!', 'success');
        this.render();
    },

    // -------------------------------------------------------------------------
    // Lightweight Lifestyle Elements: Food, Water, Supplements, Sleep, Activity
    // -------------------------------------------------------------------------
    renderFoodPreservedHtml() {
        return `
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
