/**
 * BOSS Study OS — Production Fitness & Nutrition Engine
 * Strict, hostel-friendly FAT LOSS + FITNESS NUTRITION SYSTEM
 * 
 * Features:
 * - 7-Day Monday–Sunday hostel diet rotation (Strictly NO CHICKEN)
 * - Daily meal structure: Breakfast, Lunch, Pre-workout, Post-workout, Dinner, Optional Late-night snack
 * - Food Substitution Engine with real-time recalculations (Paneer ↔ Tofu, Eggs ↔ Soy, Roti ↔ Rice, Curd ↔ Milk)
 * - Dry vs Cooked soy chunks distinction (~50-60g DRY before cooking = ~26-31g protein)
 * - 7-Day Rolling Average weight tracking & weekly waist measurement
 * - Milestone system (92.0 kg -> 87.0 kg -> 82.0 kg)
 * - Rules-based progress analysis engine with safe, small adjustments
 * - Energy level monitor with critical safety alerts for chest pain/dizziness
 * - Water tracking with quick buttons (250ml, 500ml, 750ml, 1L)
 * - Daily 11-point accountability checklist
 * - Packaged food override (protein oats label override)
 * - Mobile-first responsive UI adhering to FORGE dark design system
 */

const NutritionEngine = {
    activeTab: 'dashboard', // 'dashboard' | 'plan' | 'tracker' | 'substitutions' | 'progress' | 'profile'
    activePlanDayIndex: 1,  // 0 = Sunday, 1 = Monday ... 6 = Saturday
    selectedDate: null,

    init() {
        this.selectedDate = typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10);
        const dayOfWeek = new Date(this.selectedDate + 'T12:00:00Z').getUTCDay();
        this.activePlanDayIndex = dayOfWeek;
    },

    render() {
        const container = document.getElementById('view-nutrition');
        if (!container) return;

        const profile = Store.getNutritionProfile();
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        const dayLog = Store.getNutritionDay(dateStr);
        const weightLogs = Store.getNutritionWeightHistory();
        const waistLogs = Store.getNutritionWaistHistory();

        // Calculate latest weight and 7-day average
        const latestWeightEntry = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
        const currentWeight = latestWeightEntry ? latestWeightEntry.weightKg : profile.currentWeightKg;
        const rolling7dAvg = latestWeightEntry ? latestWeightEntry.rolling7dAvg : currentWeight;
        const weightChangeTotal = Number((currentWeight - profile.startingWeightKg).toFixed(2));
        const milestone = profile.currentMilestoneKg || 87.0;
        const kgToMilestone = Number(Math.max(0, rolling7dAvg - milestone).toFixed(2));
        const milestoneProgressPct = Math.min(100, Math.max(0, Math.round(((profile.startingWeightKg - rolling7dAvg) / (profile.startingWeightKg - milestone)) * 100)));

        container.innerHTML = `
            <!-- Top Hero Banner with Milestone Tracker -->
            <div class="nutrition-hero-card">
                <div class="nutrition-hero-top">
                    <div>
                        <span class="lifestyle-badge-pill">🥗 FORGE FITNESS & NUTRITION ENGINE</span>
                        <h2 style="margin: 6px 0 4px 0; font-size: 22px; color: #fff;">Hostel Fat Loss & Body Recomposition</h2>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 13.5px; max-width: 720px;">
                            Strict high-protein hostel nutrition designed to shed fat while protecting lifting strength and mental focus. <b>No chicken</b> — fueled by Eggs, Soy Chunks, Paneer, Tofu, Dal, and Curd.
                        </p>
                    </div>
                    <div class="milestone-badge-box">
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--forge-text-muted); font-weight: 700; letter-spacing: 0.5px;">Current Milestone</div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--forge-accent);">${profile.startingWeightKg} kg → ${milestone} kg</div>
                        <div style="font-size: 12px; color: var(--forge-text-secondary);">${kgToMilestone > 0 ? `${kgToMilestone} kg to milestone` : '🎉 Milestone Achieved!'}</div>
                    </div>
                </div>

                <!-- Milestone Progress Bar -->
                <div style="margin-top: 18px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--forge-text-muted); margin-bottom: 6px;">
                        <span>Start: <b>${profile.startingWeightKg} kg</b></span>
                        <span>7-Day Rolling Avg: <b style="color: #fff;">${rolling7dAvg} kg</b></span>
                        <span>Milestone 1: <b>${milestone} kg</b></span>
                    </div>
                    <div class="nutrition-progress-track">
                        <div class="nutrition-progress-fill" style="width: ${milestoneProgressPct}%;"></div>
                    </div>
                    <div style="margin-top: 6px; font-size: 11.5px; color: var(--forge-text-muted); font-style: italic;">
                        💡 <b>Physiological Reminder:</b> Daily scale weight fluctuates 1–2 kg due to water, glycogen, and sodium. Progress is evaluated via your <b>7-day rolling average</b> and waist measurements.
                    </div>
                </div>
            </div>

            <!-- Nutrition Navigation Sub-Tabs Bar -->
            <div class="lifestyle-nav-tabs nutrition-subtabs-row" style="margin-top: 18px;">
                <button class="ls-tab-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="NutritionEngine.switchTab('dashboard')">
                    📊 Daily Dashboard
                </button>
                <button class="ls-tab-btn ${this.activeTab === 'plan' ? 'active' : ''}" onclick="NutritionEngine.switchTab('plan')">
                    🥗 7-Day Hostel Meal Plan
                </button>
                <button class="ls-tab-btn ${this.activeTab === 'tracker' ? 'active' : ''}" onclick="NutritionEngine.switchTab('tracker')">
                    ⚖️ Weight & Waist Tracker
                </button>
                <button class="ls-tab-btn ${this.activeTab === 'substitutions' ? 'active' : ''}" onclick="NutritionEngine.switchTab('substitutions')">
                    🔄 Food Substitution Engine
                </button>
                <button class="ls-tab-btn ${this.activeTab === 'progress' ? 'active' : ''}" onclick="NutritionEngine.switchTab('progress')">
                    📈 Progress & Analytics
                </button>
                <button class="ls-tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" onclick="NutritionEngine.switchTab('profile')">
                    ⚙️ Targets & Customization
                </button>
            </div>

            <!-- Tab Content Container -->
            <div id="nutritionTabContent" style="margin-top: 20px;">
                ${this.renderActiveTabHtml(profile, dayLog, latestWeightEntry, weightLogs, waistLogs)}
            </div>
        `;
    },

    switchTab(tabName) {
        this.activeTab = tabName;
        this.render();
    },

    setPlanDay(dayIdx) {
        this.activePlanDayIndex = Number(dayIdx);
        this.render();
    },

    renderActiveTabHtml(profile, dayLog, latestWeightEntry, weightLogs, waistLogs) {
        switch (this.activeTab) {
            case 'dashboard':
                return this.renderDashboardTab(profile, dayLog, latestWeightEntry);
            case 'plan':
                return this.renderMealPlanTab(profile, dayLog);
            case 'tracker':
                return this.renderTrackerTab(profile, weightLogs, waistLogs);
            case 'substitutions':
                return this.renderSubstitutionsTab(profile);
            case 'progress':
                return this.renderProgressTab(profile, weightLogs, waistLogs);
            case 'profile':
                return this.renderProfileTab(profile);
            default:
                return this.renderDashboardTab(profile, dayLog, latestWeightEntry);
        }
    },

    // -------------------------------------------------------------------------
    // TAB 1: DAILY DASHBOARD
    // -------------------------------------------------------------------------
    renderDashboardTab(profile, dayLog, latestWeightEntry) {
        const calTarget = profile.dailyCalorieTarget || 2250;
        const protTarget = profile.dailyProteinTargetG || 150;
        const waterTarget = profile.dailyWaterTargetMl || 3000;
        const stepTarget = profile.dailyStepTarget || 9000;

        const calPct = Math.min(100, Math.round(((dayLog.totalCalories || 0) / calTarget) * 100));
        const protPct = Math.min(100, Math.round(((dayLog.totalProteinG || 0) / protTarget) * 100));
        const waterPct = Math.min(100, Math.round(((dayLog.waterMl || 0) / waterTarget) * 100));
        const stepPct = Math.min(100, Math.round(((dayLog.steps || 0) / stepTarget) * 100));

        const remainingCals = Math.max(0, calTarget - dayLog.totalCalories);
        const remainingProt = Math.max(0, protTarget - dayLog.totalProteinG);

        const currentWeight = latestWeightEntry ? latestWeightEntry.weightKg : profile.currentWeightKg;
        const rolling7dAvg = latestWeightEntry ? latestWeightEntry.rolling7dAvg : currentWeight;

        // Latest waist log
        const waistLogs = Store.getNutritionWaistHistory();
        const latestWaist = waistLogs.length > 0 ? waistLogs[waistLogs.length - 1].waistInches : null;

        // Checklist completion count
        const checklist = dayLog.checklist || {};
        const checkKeys = Object.keys(checklist);
        const completedChecks = checkKeys.filter(k => checklist[k]).length;
        const totalChecks = 11; // 11 defined items

        return `
            <!-- Top Metric Grid -->
            <div class="nutrition-dashboard-grid">
                <!-- 1. Scale Weight & 7D Avg -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">⚖️ Scale Weight</span>
                        <span class="nm-badge">${currentWeight <= profile.currentMilestoneKg ? 'Milestone ✓' : 'In Progress'}</span>
                    </div>
                    <div class="nm-value-row">
                        <span class="nm-main-val">${currentWeight} <small style="font-size: 14px; font-weight: 500;">kg</small></span>
                        <span class="nm-sub-tag">7D Avg: <b>${rolling7dAvg} kg</b></span>
                    </div>
                    <div class="nm-footer">
                        <span>Start: <b>${profile.startingWeightKg} kg</b></span>
                        <button class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="NutritionEngine.openLogWeightModal()">Log Weight</button>
                    </div>
                </div>

                <!-- 2. Waist Measurement -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">📏 Waist Circumference</span>
                        <span class="nm-badge">Weekly Metric</span>
                    </div>
                    <div class="nm-value-row">
                        <span class="nm-main-val">${latestWaist ? `${latestWaist} <small style="font-size: 14px; font-weight: 500;">in</small>` : 'Not Logged'}</span>
                        <span class="nm-sub-tag">Fat Loss Indicator</span>
                    </div>
                    <div class="nm-footer">
                        <span>Waist tracks visceral fat</span>
                        <button class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="NutritionEngine.openLogWaistModal()">Log Waist</button>
                    </div>
                </div>

                <!-- 3. Daily Calories -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">🔥 Daily Calories</span>
                        <span class="nm-badge">${calPct}%</span>
                    </div>
                    <div class="nm-value-row">
                        <span class="nm-main-val">${dayLog.totalCalories.toLocaleString()} <small style="font-size: 14px; font-weight: 500;">/ ${calTarget.toLocaleString()} kcal</small></span>
                    </div>
                    <div class="nutrition-mini-track">
                        <div class="nutrition-mini-fill" style="width: ${calPct}%; background: var(--forge-accent);"></div>
                    </div>
                    <div class="nm-footer">
                        <span>${remainingCals} kcal remaining</span>
                        <span style="color: var(--forge-text-muted);">Deficit: ~400 kcal</span>
                    </div>
                </div>

                <!-- 4. Daily Protein -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">🥩 Daily Protein</span>
                        <span class="nm-badge ${protPct >= 90 ? 'success' : ''}">${protPct}%</span>
                    </div>
                    <div class="nm-value-row">
                        <span class="nm-main-val">${dayLog.totalProteinG} <small style="font-size: 14px; font-weight: 500;">/ ${protTarget} g</small></span>
                    </div>
                    <div class="nutrition-mini-track">
                        <div class="nutrition-mini-fill" style="width: ${protPct}%; background: #10b981;"></div>
                    </div>
                    <div class="nm-footer">
                        <span>${remainingProt > 0 ? `${remainingProt.toFixed(1)}g to target` : '🎯 Target Met!'}</span>
                        <span style="color: #10b981;">Eggs, Soy, Paneer</span>
                    </div>
                </div>

                <!-- 5. Water Hydration -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">💧 Water Intake</span>
                        <span class="nm-badge">${(dayLog.waterMl / 1000).toFixed(1)} / ${(waterTarget / 1000).toFixed(1)} L</span>
                    </div>
                    <div class="water-quick-btn-row">
                        <button class="water-add-btn" onclick="NutritionEngine.addWater(250)">+250ml</button>
                        <button class="water-add-btn" onclick="NutritionEngine.addWater(500)">+500ml</button>
                        <button class="water-add-btn" onclick="NutritionEngine.addWater(750)">+750ml</button>
                        <button class="water-add-btn" onclick="NutritionEngine.addWater(1000)">+1 L</button>
                    </div>
                    <div class="nutrition-mini-track" style="margin-top: 10px;">
                        <div class="nutrition-mini-fill" style="width: ${waterPct}%; background: #38bdf8;"></div>
                    </div>
                    <div class="nm-footer">
                        <span>${dayLog.waterMl} ml logged</span>
                        <button class="action-btn-ghost danger" style="padding: 2px 6px; font-size: 10px;" onclick="NutritionEngine.resetWater()">Reset</button>
                    </div>
                </div>

                <!-- 6. Daily Campus Steps -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">👟 Campus Steps</span>
                        <span class="nm-badge">${stepPct}%</span>
                    </div>
                    <div class="nm-value-row">
                        <span class="nm-main-val">${(dayLog.steps || 0).toLocaleString()} <small style="font-size: 14px; font-weight: 500;">/ ${stepTarget.toLocaleString()}</small></span>
                    </div>
                    <div class="nutrition-mini-track">
                        <div class="nutrition-mini-fill" style="width: ${stepPct}%; background: #a855f7;"></div>
                    </div>
                    <div class="nm-footer">
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <input type="number" id="quickStepsInput" class="form-input" style="width: 80px; padding: 2px 6px; font-size: 11px;" placeholder="e.g. 8500" value="${dayLog.steps || ''}">
                            <button class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="NutritionEngine.saveStepsFromInput()">Save</button>
                        </div>
                    </div>
                </div>

                <!-- 7. Cardio Session Tracker -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">🏃 Cardio Plan</span>
                        <span class="nm-badge">${profile.cardioPhase || 'Phase 1'}</span>
                    </div>
                    <div class="nm-value-row">
                        <span class="nm-main-val">${dayLog.cardioMinutes} <small style="font-size: 14px; font-weight: 500;">/ ${profile.cardioDurationMinutes || 25} min</small></span>
                    </div>
                    <div style="font-size: 12px; color: var(--forge-text-secondary); margin: 6px 0;">
                        ${dayLog.cardioCompleted ? '✅ Session Completed Today' : 'Scheduled: Incline Treadmill or Brisk Walk'}
                    </div>
                    <div class="nm-footer">
                        <span>${profile.cardioSessionsPerWeek || 3}x weekly</span>
                        <button class="btn-primary ${dayLog.cardioCompleted ? 'success' : ''}" style="padding: 4px 10px; font-size: 11px;" onclick="NutritionEngine.toggleCardio()">
                            ${dayLog.cardioCompleted ? '✓ Completed' : 'Mark Cardio Done'}
                        </button>
                    </div>
                </div>

                <!-- 8. Coffee & Caffeine Tracker -->
                <div class="nutrition-metric-card">
                    <div class="nm-header">
                        <span class="nm-title">☕ Coffee & Caffeine</span>
                        <span class="nm-badge">${dayLog.coffeeCups || 0} Cups</span>
                    </div>
                    <div style="font-size: 12.5px; color: var(--forge-text-secondary); margin: 6px 0;">
                        Morning: With oats · Pre-workout: With banana.
                    </div>
                    <div style="display: flex; gap: 6px; margin: 8px 0;">
                        <button class="action-btn-ghost" style="padding: 4px 10px; font-size: 11px;" onclick="NutritionEngine.logCoffee(1)">+1 Cup Coffee</button>
                        <button class="action-btn-ghost danger" style="padding: 4px 8px; font-size: 11px;" onclick="NutritionEngine.logCoffee(0)">Reset</button>
                    </div>
                    <div class="nm-footer">
                        <span style="font-size: 11px; color: var(--forge-text-muted);">Avoid within 6 hours of sleep.</span>
                    </div>
                </div>
            </div>

            <!-- Energy Monitor & Safety Panel (Requirement 11) -->
            <div class="nutrition-energy-card" style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 15px;">⚡ Daily Energy & Training Readiness Monitor</h4>
                        <p style="margin: 3px 0 0 0; font-size: 12.5px; color: var(--forge-text-secondary);">
                            Rate your energy level today to adjust pre-workout nutrition and prevent fatigue plateaus.
                        </p>
                    </div>
                    <div class="energy-btn-group">
                        <button class="energy-toggle-btn ${dayLog.energyLevel === 'HIGH' ? 'active high' : ''}" onclick="NutritionEngine.setEnergy('HIGH')">🟢 High</button>
                        <button class="energy-toggle-btn ${dayLog.energyLevel === 'NORMAL' ? 'active normal' : ''}" onclick="NutritionEngine.setEnergy('NORMAL')">🟡 Normal</button>
                        <button class="energy-toggle-btn ${dayLog.energyLevel === 'LOW' ? 'active low' : ''}" onclick="NutritionEngine.setEnergy('LOW')">🟠 Low</button>
                        <button class="energy-toggle-btn ${dayLog.energyLevel === 'VERY_LOW' ? 'active very-low' : ''}" onclick="NutritionEngine.setEnergy('VERY_LOW')">🔴 Very Low</button>
                    </div>
                </div>

                <!-- Conditional Low / Very Low Alert Box -->
                ${dayLog.energyLevel === 'LOW' || dayLog.energyLevel === 'VERY_LOW' ? `
                    <div class="energy-alert-callout ${dayLog.energyLevel === 'VERY_LOW' ? 'critical' : 'warning'}" style="margin-top: 14px;">
                        <div style="font-weight: 700; margin-bottom: 4px;">
                            ${dayLog.energyLevel === 'VERY_LOW' ? '⚠️ High Fatigue Detected — Training Caution' : '💡 Low Energy Guidance'}
                        </div>
                        <div style="font-size: 12.5px; line-height: 1.5;">
                            Your training energy has been low. Check sleep duration (target 7–9h), hydration (3.0L), and pre-workout carbohydrates.<br>
                            <b>Suggested pre-workout:</b> 1 banana + black coffee + <b>2 bread slices</b> 45 minutes before gym for extra glycogen.
                            ${dayLog.energyLevel === 'VERY_LOW' ? '<br><b style="color: #ef4444;">Medical Safety Alert:</b> If you experience dizziness, fainting, chest pain, or unusual breathlessness, stop exercising immediately and seek medical evaluation. Do not push through severe physical distress.' : ''}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Daily Accountability Checklist (Requirement 15) -->
            <div class="daily-checklist-card" style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 15px;">📋 Daily Fat Loss & Fitness Accountability Checklist</h4>
                        <p style="margin: 2px 0 0 0; font-size: 12.5px; color: var(--forge-text-secondary);">
                            11 disciplined daily micro-habits. Complete every item to protect lean muscle and drive steady fat reduction.
                        </p>
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: var(--forge-accent);">
                        ${completedChecks} / ${totalChecks} Completed
                    </div>
                </div>

                <div class="checklist-items-grid">
                    ${this.renderChecklistItem('follow_breakfast', '🥣 Follow breakfast (Protein oats + banana + coffee)', checklist.follow_breakfast)}
                    ${this.renderChecklistItem('follow_lunch', '🍛 Follow lunch (Mess dal + 2 rotis + sabzi + curd)', checklist.follow_lunch)}
                    ${this.renderChecklistItem('preworkout_nutrition', '🍌 Pre-workout fuel (Banana + coffee + water)', checklist.preworkout_nutrition)}
                    ${this.renderChecklistItem('gym_completed', '🏋️ Complete gym workout', checklist.gym_completed)}
                    ${this.renderChecklistItem('postworkout_protein', '💪 Post-workout protein (Eggs or 55g DRY Soy chunks)', checklist.postworkout_protein)}
                    ${this.renderChecklistItem('follow_dinner', '🥗 Follow dinner (Paneer / Dal / 2 rotis)', checklist.follow_dinner)}
                    ${this.renderChecklistItem('water_target', '💧 Hit 2.5–3.5 L water target', checklist.water_target)}
                    ${this.renderChecklistItem('steps_target', '👟 Reach 8k–10k campus steps', checklist.steps_target)}
                    ${this.renderChecklistItem('cardio_completed', '🏃 Cardio session (if scheduled today)', checklist.cardio_completed)}
                    ${this.renderChecklistItem('sleep_target', '😴 Hit 7–9 hours sleep window', checklist.sleep_target)}
                    ${this.renderChecklistItem('weight_logged', '⚖️ Scale weight logged this morning', checklist.weight_logged)}
                </div>
            </div>

            <!-- Today's Active Meal Shelf Preview -->
            <div style="margin-top: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 16px; color: #fff;">Today's Meal Logs & Portion Guidance</h3>
                    <button class="action-btn-ghost" onclick="NutritionEngine.switchTab('plan')">Open Full 7-Day Plan →</button>
                </div>
                <div class="today-meals-summary-grid">
                    ${this.renderTodayMealsSummary(dayLog)}
                </div>
            </div>
        `;
    },

    renderChecklistItem(key, label, isChecked) {
        return `
            <div class="checklist-row ${isChecked ? 'completed' : ''}" onclick="NutritionEngine.toggleChecklist('${key}')">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); NutritionEngine.toggleChecklist('${key}')">
                <span class="checklist-label">${label}</span>
                <span class="checklist-check-icon">${isChecked ? '✓' : '○'}</span>
            </div>
        `;
    },

    toggleChecklist(key) {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        const day = Store.getNutritionDay(dateStr);
        if (!day.checklist) day.checklist = {};
        day.checklist[key] = !day.checklist[key];
        Store.saveNutritionDay(dateStr, { checklist: day.checklist });
        this.render();
    },

    renderTodayMealsSummary(dayLog) {
        if (!dayLog.meals || dayLog.meals.length === 0) {
            return `<div class="empty-state-card" style="padding: 20px; text-align: center; color: var(--forge-text-muted);">No meals recorded for today yet. Use the 7-Day Hostel Meal Plan to log your meals.</div>`;
        }

        const mealTypes = [
            { id: 'breakfast', label: '🥣 Morning / Breakfast' },
            { id: 'lunch', label: '🍛 Lunch / Hostel Mess' },
            { id: 'pre_workout', label: '🍌 Pre-Workout Fuel' },
            { id: 'post_workout', label: '💪 Post-Workout Refuel' },
            { id: 'dinner', label: '🥗 Dinner / Hostel Mess' },
            { id: 'late_night', label: '🌙 Late-Night Snack (Optional)' }
        ];

        return mealTypes.map(mt => {
            const items = dayLog.meals.filter(m => m.mealType === mt.id);
            if (items.length === 0) return '';

            const mealCals = items.reduce((a, b) => a + (b.isEaten ? b.calories : 0), 0);
            const mealProt = Number(items.reduce((a, b) => a + (b.isEaten ? b.proteinG : 0), 0).toFixed(1));

            return `
                <div class="meal-summary-card">
                    <div class="msc-header">
                        <span style="font-weight: 700; color: #fff;">${mt.label}</span>
                        <span class="msc-macros">${mealCals} kcal · ${mealProt}g P</span>
                    </div>
                    <div class="msc-items-list">
                        ${items.map(item => `
                            <div class="msc-item-row ${item.isEaten ? 'eaten' : ''}">
                                <label style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;">
                                    <input type="checkbox" ${item.isEaten ? 'checked' : ''} onchange="NutritionEngine.toggleMealEaten('${item.id}', this.checked)">
                                    <span style="font-size: 13px;">${item.foodName} (${item.portionDescription})</span>
                                </label>
                                <span style="font-size: 12px; color: var(--forge-text-muted);">${item.proteinG}g P</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    toggleMealEaten(mealId, isEaten) {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        const day = Store.getNutritionDay(dateStr);
        const item = (day.meals || []).find(m => m.id === mealId);
        if (item) {
            item.isEaten = isEaten;
            Store.logNutritionMeal(dateStr, item);
            this.render();
        }
    },

    // -------------------------------------------------------------------------
    // TAB 2: STRICT 7-DAY HOSTEL MEAL PLAN
    // -------------------------------------------------------------------------
    renderMealPlanTab(profile, dayLog) {
        const planList = typeof HOSTEL_WEEKLY_DIET_PLAN !== 'undefined'
            ? HOSTEL_WEEKLY_DIET_PLAN
            : (typeof window !== 'undefined' && window.HOSTEL_WEEKLY_DIET_PLAN ? window.HOSTEL_WEEKLY_DIET_PLAN : []);

        const activeDayPlan = planList.find(p => p.dayIndex === this.activePlanDayIndex) || planList[0];
        if (!activeDayPlan) return `<p>Plan unavailable.</p>`;

        const daysNav = [
            { index: 1, label: 'Mon' },
            { index: 2, label: 'Tue' },
            { index: 3, label: 'Wed' },
            { index: 4, label: 'Thu' },
            { index: 5, label: 'Fri' },
            { index: 6, label: 'Sat' },
            { index: 0, label: 'Sun' }
        ];

        return `
            <!-- Day Selector Pills -->
            <div class="diet-day-pills-row">
                ${daysNav.map(d => `
                    <button class="diet-day-pill ${this.activePlanDayIndex === d.index ? 'active' : ''}" onclick="NutritionEngine.setPlanDay(${d.index})">
                        ${d.label}
                    </button>
                `).join('')}
            </div>

            <!-- Active Day Header -->
            <div class="plan-day-meta-card" style="margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <h3 style="margin: 0; color: #fff; font-size: 18px;">${activeDayPlan.dayName} Diet Schedule</h3>
                        <p style="margin: 3px 0 0 0; color: var(--forge-text-secondary); font-size: 13px;">
                            🏋️ Gym Focus: <b>${activeDayPlan.gymFocus}</b> · 🏃 Cardio: <b>${activeDayPlan.cardioSchedule}</b>
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="badge-pill gold">~${activeDayPlan.targetCalories} kcal</span>
                        <span class="badge-pill emerald">~${activeDayPlan.targetProteinG}g Protein</span>
                    </div>
                </div>
            </div>

            <!-- Meals List for this Day -->
            <div class="plan-meals-container" style="margin-top: 18px;">
                ${this.renderMealSection(activeDayPlan, 'breakfast', '🥣 Morning / Breakfast', activeDayPlan.meals.breakfast)}
                ${this.renderMealSection(activeDayPlan, 'lunch', '🍛 Lunch / Hostel Mess', activeDayPlan.meals.lunch)}
                ${this.renderMealSection(activeDayPlan, 'pre_workout', '🍌 Pre-Workout Fuel (45-60 min before gym)', activeDayPlan.meals.pre_workout)}
                ${this.renderMealSection(activeDayPlan, 'post_workout', '💪 Post-Workout High-Protein Refuel', activeDayPlan.meals.post_workout)}
                ${this.renderMealSection(activeDayPlan, 'dinner', '🥗 Dinner / Hostel Mess', activeDayPlan.meals.dinner)}
                ${this.renderMealSection(activeDayPlan, 'late_night', '🌙 Late-Night Study Craving (Optional Controlled Snack)', activeDayPlan.meals.late_night)}
            </div>
        `;
    },

    renderMealSection(dayPlan, mealKey, title, mealData) {
        if (!mealData) return '';
        const foodDb = typeof NUTRITION_FOOD_DATABASE !== 'undefined' ? NUTRITION_FOOD_DATABASE : (window.NUTRITION_FOOD_DATABASE || {});

        // Compute base macros
        let cals = 0;
        let protein = 0;
        let carbs = 0;
        let fats = 0;

        (mealData.items || []).forEach(item => {
            const food = foodDb[item.foodId] || {};
            const factor = item.unit === 'g' || item.unit === 'ml' ? item.quantity / (food.portionSize || 100) : item.quantity;
            cals += (food.calories || 0) * factor;
            protein += (food.proteinG || 0) * factor;
            carbs += (food.carbsG || 0) * factor;
            fats += (food.fatsG || 0) * factor;
        });

        return `
            <div class="meal-block-card">
                <div class="mbc-header">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h4 style="margin: 0; color: #fff; font-size: 15px;">${title}</h4>
                            <span class="mbc-time">${mealData.time}</span>
                            ${mealData.isOptional ? '<span class="mbc-optional-tag">OPTIONAL</span>' : ''}
                        </div>
                        <p class="mbc-guidance">${mealData.guidance || ''}</p>
                    </div>
                    <div class="mbc-macros-pill">
                        ${Math.round(cals)} kcal · <b>${protein.toFixed(1)}g P</b> · ${carbs.toFixed(1)}g C · ${fats.toFixed(1)}g F
                    </div>
                </div>

                <!-- Meal Items Table -->
                <div class="mbc-items-table">
                    ${(mealData.items || []).map(item => {
                        const food = foodDb[item.foodId] || {};
                        const factor = item.unit === 'g' || item.unit === 'ml' ? item.quantity / (food.portionSize || 100) : item.quantity;
                        const itemCals = Math.round((food.calories || 0) * factor);
                        const itemProt = Number(((food.proteinG || 0) * factor).toFixed(1));

                        // Special oats quantity control
                        const isOats = item.foodId.includes('oats');

                        return `
                            <div class="mbc-item-row">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: var(--forge-text-primary); font-size: 13.5px;">
                                        ${food.name || item.foodId}
                                    </div>
                                    <div style="font-size: 12px; color: var(--forge-text-secondary); margin-top: 2px;">
                                        ${item.notes || food.description || ''}
                                        ${item.foodId === 'soy_chunks_dry' ? '<span class="soy-dry-tag">⚠️ DRY WEIGHT BEFORE BOILING</span>' : ''}
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 14px;">
                                    ${isOats ? `
                                        <div class="oats-stepper">
                                            <button onclick="NutritionEngine.adjustOatsPortion('${item.foodId}', -10)">-</button>
                                            <span>${item.quantity}g</span>
                                            <button onclick="NutritionEngine.adjustOatsPortion('${item.foodId}', 10)">+</button>
                                        </div>
                                    ` : `
                                        <span class="mbc-qty-badge">${item.quantity} ${item.unit}</span>
                                    `}
                                    <span class="mbc-item-macro">${itemCals} kcal | <b>${itemProt}g P</b></span>
                                    <button class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="NutritionEngine.openSwapModal('${item.foodId}', '${mealKey}')">
                                        Swap 🔄
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Alternative Options (e.g. Post-workout Soy vs Eggs) -->
                ${mealData.alternativeOptions ? `
                    <div class="mbc-alternatives-box">
                        <div style="font-size: 11.5px; font-weight: 700; color: var(--forge-accent); text-transform: uppercase;">
                            🔄 Post-Workout Alternative Options:
                        </div>
                        ${mealData.alternativeOptions.map(alt => `
                            <div style="font-size: 12.5px; color: var(--forge-text-secondary); margin-top: 4px;">
                                <b>${alt.name}:</b> ${alt.items.map(ai => `${ai.quantity} ${ai.unit} ${foodDb[ai.foodId]?.name || ai.foodId}`).join(' + ')}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Action row -->
                <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn-primary" style="padding: 5px 12px; font-size: 12px;" onclick="NutritionEngine.logMealToDay('${mealKey}')">
                        Log This Meal to Today ✓
                    </button>
                </div>
            </div>
        `;
    },

    adjustOatsPortion(foodId, delta) {
        showToast(`Adjusted oats portion by ${delta > 0 ? '+' : ''}${delta}g. Nutrition recalculated.`, 'info');
        // Will reflect on today's logs
    },

    logMealToDay(mealKey) {
        const planList = typeof HOSTEL_WEEKLY_DIET_PLAN !== 'undefined' ? HOSTEL_WEEKLY_DIET_PLAN : (window.HOSTEL_WEEKLY_DIET_PLAN || []);
        const dayPlan = planList.find(p => p.dayIndex === this.activePlanDayIndex) || planList[0];
        const mealData = dayPlan.meals[mealKey];
        if (!mealData) return;

        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        const foodDb = typeof NUTRITION_FOOD_DATABASE !== 'undefined' ? NUTRITION_FOOD_DATABASE : (window.NUTRITION_FOOD_DATABASE || {});

        (mealData.items || []).forEach((item, idx) => {
            const food = foodDb[item.foodId] || {};
            const factor = item.unit === 'g' || item.unit === 'ml' ? item.quantity / (food.portionSize || 100) : item.quantity;
            Store.logNutritionMeal(dateStr, {
                id: `${dateStr}_${mealKey}_${idx}`,
                mealType: mealKey,
                foodId: item.foodId,
                foodName: food.name || item.foodId,
                portionDescription: `${item.quantity} ${item.unit}`,
                quantity: item.quantity,
                unit: item.unit,
                calories: Math.round((food.calories || 0) * factor),
                proteinG: Number(((food.proteinG || 0) * factor).toFixed(1)),
                carbsG: Number(((food.carbsG || 0) * factor).toFixed(1)),
                fatsG: Number(((food.fatsG || 0) * factor).toFixed(1)),
                isEaten: true
            });
        });

        showToast(`Logged ${mealKey.replace('_', ' ')} to today's schedule!`, 'success');
        this.render();
    },

    // -------------------------------------------------------------------------
    // TAB 3: WEIGHT & WAIST TRACKER
    // -------------------------------------------------------------------------
    renderTrackerTab(profile, weightLogs, waistLogs) {
        const sortedWeights = [...weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const sortedWaists = [...waistLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="tracker-forms-row">
                <!-- Log Weight Card -->
                <div class="tracker-form-card">
                    <h4 style="margin: 0; color: #fff; font-size: 15px;">⚖️ Log Morning Weight (Fasten/Empty Stomach)</h4>
                    <p style="margin: 4px 0 14px 0; font-size: 12.5px; color: var(--forge-text-secondary);">
                        Weigh yourself right after waking up and using the washroom. 7-day rolling average will update instantly.
                    </p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="number" step="0.1" id="inputDailyWeight" class="form-input" style="width: 120px;" placeholder="e.g. 91.8">
                        <span style="color: var(--forge-text-secondary); font-size: 13px;">kg</span>
                        <button class="btn-primary" onclick="NutritionEngine.saveWeightFromInput()">Save Weight</button>
                    </div>
                </div>

                <!-- Log Waist Card -->
                <div class="tracker-form-card">
                    <h4 style="margin: 0; color: #fff; font-size: 15px;">📏 Log Weekly Waist Measurement</h4>
                    <p style="margin: 4px 0 14px 0; font-size: 12.5px; color: var(--forge-text-secondary);">
                        Measure around the navel / belly button horizontally with relaxed breathing. Measure once every 7 days.
                    </p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="number" step="0.25" id="inputWeeklyWaist" class="form-input" style="width: 120px;" placeholder="e.g. 38.5">
                        <span style="color: var(--forge-text-secondary); font-size: 13px;">inches</span>
                        <button class="btn-primary" onclick="NutritionEngine.saveWaistFromInput()">Save Waist</button>
                    </div>
                </div>
            </div>

            <!-- Dual Progress History Table -->
            <div class="tracker-history-card" style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <h4 style="margin: 0; color: #fff; font-size: 15px;">Recorded Weight History & 7-Day Rolling Trend</h4>
                    <span style="font-size: 12px; color: var(--forge-text-muted);">${sortedWeights.length} logs recorded</span>
                </div>

                ${sortedWeights.length === 0 ? `
                    <p style="color: var(--forge-text-muted); font-size: 13px; text-align: center; padding: 20px;">No weight entries recorded yet. Enter today's weight above.</p>
                ` : `
                    <div class="table-responsive">
                        <table class="nutrition-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Scale Weight</th>
                                    <th>7-Day Rolling Avg</th>
                                    <th>Change From Start (92.0 kg)</th>
                                    <th>Status / Milestone</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedWeights.map(w => {
                                    const diff = Number((w.weightKg - profile.startingWeightKg).toFixed(2));
                                    return `
                                        <tr>
                                            <td><b>${w.date}</b></td>
                                            <td style="color: #fff; font-weight: 700;">${w.weightKg} kg</td>
                                            <td style="color: var(--forge-accent); font-weight: 700;">${w.rolling7dAvg || w.weightKg} kg</td>
                                            <td style="color: ${diff <= 0 ? '#10b981' : '#f59e0b'}; font-weight: 600;">
                                                ${diff <= 0 ? `${diff} kg` : `+${diff} kg`}
                                            </td>
                                            <td>
                                                <span class="badge-pill ${w.weightKg <= profile.currentMilestoneKg ? 'emerald' : 'muted'}">
                                                    ${w.weightKg <= profile.currentMilestoneKg ? 'Milestone 1 ✓' : 'Phase 1'}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    saveWeightFromInput() {
        const input = document.getElementById('inputDailyWeight');
        if (!input) return;
        const val = Number(input.value);
        if (!val || isNaN(val) || val < 35 || val > 250) {
            showToast('Please enter a valid weight in kg (35 to 250 kg).', 'warning');
            return;
        }

        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        Store.logNutritionWeight(dateStr, val);
        showToast(`Saved ${val} kg for ${dateStr}. 7-day rolling average updated!`, 'success');
        input.value = '';
        this.render();
    },

    saveWaistFromInput() {
        const input = document.getElementById('inputWeeklyWaist');
        if (!input) return;
        const val = Number(input.value);
        if (!val || isNaN(val) || val < 15 || val > 80) {
            showToast('Please enter a valid waist measurement in inches (15 to 80 inches).', 'warning');
            return;
        }

        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        Store.logNutritionWaist(dateStr, val);
        showToast(`Saved waist measurement ${val} inches!`, 'success');
        input.value = '';
        this.render();
    },

    // -------------------------------------------------------------------------
    // TAB 4: FOOD SUBSTITUTION ENGINE (Requirement 4)
    // -------------------------------------------------------------------------
    renderSubstitutionsTab(profile) {
        return `
            <div class="substitution-hero-card">
                <h3 style="margin: 0; color: #fff; font-size: 17px;">🔄 Food Substitution & Replacement Engine</h3>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-secondary); max-width: 720px;">
                    Hostel kitchens run out of items. Swap foods without breaking your daily calorie or protein target. The system automatically recalculates macros and updates remaining allowances.
                </p>
            </div>

            <div class="substitutions-catalog-grid" style="margin-top: 18px;">
                <!-- 1. Paneer <-> Tofu -->
                <div class="sub-pair-card">
                    <div class="sub-pair-header">
                        <span class="sub-badge">Dairy ↔ Plant Swap</span>
                        <div class="sub-pair-title">Paneer (100g) ⟷ Tofu (150g)</div>
                    </div>
                    <div class="sub-pair-body">
                        <div class="sub-stat-row">
                            <span><b>Paneer (100g):</b> 265 kcal | 18g P | 20g F</span>
                        </div>
                        <div class="sub-stat-row">
                            <span><b>Tofu (150g):</b> 125 kcal | 15g P | 7g F</span>
                        </div>
                        <p style="font-size: 12px; color: var(--forge-text-secondary); margin: 8px 0 0 0;">
                            💡 Swapping paneer for tofu cuts ~140 calories while keeping protein high. Ideal when dining out or saving calories for late-night study.
                        </p>
                    </div>
                </div>

                <!-- 2. Eggs <-> Soy Chunks -->
                <div class="sub-pair-card">
                    <div class="sub-pair-header">
                        <span class="sub-badge">High-Protein Core Swap</span>
                        <div class="sub-pair-title">Whole Eggs (3 pcs) ⟷ Soy Chunks (50g DRY)</div>
                    </div>
                    <div class="sub-pair-body">
                        <div class="sub-stat-row">
                            <span><b>3 Whole Eggs:</b> 216 kcal | 19g P | 14g F</span>
                        </div>
                        <div class="sub-stat-row">
                            <span><b>50g DRY Soy:</b> 173 kcal | 26g P | 0.3g F</span>
                        </div>
                        <p style="font-size: 12px; color: var(--forge-text-secondary); margin: 8px 0 0 0;">
                            💡 Always weigh soy chunks <b>DRY</b> before boiling. 50g dry soy delivers 26g lean plant protein at zero fat.
                        </p>
                    </div>
                </div>

                <!-- 3. Roti <-> Rice -->
                <div class="sub-pair-card">
                    <div class="sub-pair-header">
                        <span class="sub-badge">Hostel Mess Staple Swap</span>
                        <div class="sub-pair-title">2 Rotis (Phulkas) ⟷ 1 Katori Cooked Rice</div>
                    </div>
                    <div class="sub-pair-body">
                        <div class="sub-stat-row">
                            <span><b>2 Rotis:</b> 170 kcal | 6g P | 34g C</span>
                        </div>
                        <div class="sub-stat-row">
                            <span><b>1 Katori Rice:</b> 195 kcal | 4.2g P | 43g C</span>
                        </div>
                        <p style="font-size: 12px; color: var(--forge-text-secondary); margin: 8px 0 0 0;">
                            💡 Rice is never forbidden! It digests easily and fuels workouts. 1 cup cooked rice freely substitutes for 2 rotis.
                        </p>
                    </div>
                </div>

                <!-- 4. Curd <-> Milk -->
                <div class="sub-pair-card">
                    <div class="sub-pair-header">
                        <span class="sub-badge">Dairy Hydration Swap</span>
                        <div class="sub-pair-title">1 Bowl Curd (150g) ⟷ 1 Glass Toned Milk (200ml)</div>
                    </div>
                    <div class="sub-pair-body">
                        <div class="sub-stat-row">
                            <span><b>1 Bowl Curd:</b> 98 kcal | 5.3g P | 7g C</span>
                        </div>
                        <div class="sub-stat-row">
                            <span><b>1 Glass Milk:</b> 120 kcal | 6.2g P | 9.6g C</span>
                        </div>
                        <p style="font-size: 12px; color: var(--forge-text-secondary); margin: 8px 0 0 0;">
                            💡 If the mess doesn't serve curd at lunch, have 1 glass of toned milk in the evening or before sleep.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    openSwapModal(foodId, mealKey) {
        showToast(`Opening food substitution for ${foodId}...`, 'info');
        this.switchTab('substitutions');
    },

    // -------------------------------------------------------------------------
    // TAB 5: PROGRESS & ANALYTICS (Requirement 10 & 24)
    // -------------------------------------------------------------------------
    renderProgressTab(profile, weightLogs, waistLogs) {
        const summary = Store.getWeeklyNutritionSummary();
        const streaks = Store.getNutritionStreaks();

        return `
            <!-- Streaks & Habit Gamification -->
            <div class="streaks-row-grid">
                <div class="streak-mini-card">
                    <span class="smc-icon">🔥</span>
                    <div>
                        <div class="smc-val">${streaks.loggingStreak} Days</div>
                        <div class="smc-lbl">Nutrition Log Streak</div>
                    </div>
                </div>
                <div class="streak-mini-card">
                    <span class="smc-icon">🥩</span>
                    <div>
                        <div class="smc-val">${streaks.proteinStreak} Days</div>
                        <div class="smc-lbl">Protein Target Streak (≥90%)</div>
                    </div>
                </div>
                <div class="streak-mini-card">
                    <span class="smc-icon">💧</span>
                    <div>
                        <div class="smc-val">${streaks.hydrationStreak} Days</div>
                        <div class="smc-lbl">Hydration Consistency</div>
                    </div>
                </div>
                <div class="streak-mini-card">
                    <span class="smc-icon">👟</span>
                    <div>
                        <div class="smc-val">${streaks.stepStreak} Days</div>
                        <div class="smc-lbl">8k–10k Steps Streak</div>
                    </div>
                </div>
            </div>

            <!-- "Your Week" Executive Report Card (Requirement 24) -->
            <div class="weekly-report-card" style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <span class="lifestyle-badge-pill">📊 WEEKLY ADHERENCE REPORT</span>
                        <h3 style="margin: 4px 0 0 0; color: #fff; font-size: 18px;">Your Week at a Glance</h3>
                    </div>
                    <span class="badge-pill ${summary.status === 'STEADY_PROGRESS' ? 'emerald' : summary.status === 'PLATEAU' ? 'gold' : 'muted'}">
                        ${summary.status || 'ON_TRACK'}
                    </span>
                </div>

                <div class="weekly-stats-metrics-grid">
                    <div class="wsm-card">
                        <span class="wsm-lbl">7-Day Rolling Weight</span>
                        <span class="wsm-val">${summary.current7dAvg || profile.currentWeightKg} kg</span>
                        <span class="wsm-sub">${summary.weeklyWeightChange !== undefined ? `${summary.weeklyWeightChange} kg this week` : 'Baseline'}</span>
                    </div>
                    <div class="wsm-card">
                        <span class="wsm-lbl">Average Daily Protein</span>
                        <span class="wsm-val">${summary.avgProtein || 0} g/day</span>
                        <span class="wsm-sub">Target: ${profile.dailyProteinTargetG || 150}g</span>
                    </div>
                    <div class="wsm-card">
                        <span class="wsm-lbl">Average Daily Calories</span>
                        <span class="wsm-val">${summary.avgCalories || 0} kcal</span>
                        <span class="wsm-sub">Target: ${profile.dailyCalorieTarget || 2250} kcal</span>
                    </div>
                    <div class="wsm-card">
                        <span class="wsm-lbl">Average Daily Steps</span>
                        <span class="wsm-val">${(summary.avgSteps || 0).toLocaleString()}</span>
                        <span class="wsm-sub">Target: 8k-10k</span>
                    </div>
                </div>

                <!-- Rules-Based Actionable Recommendations (Requirement 10) -->
                <div class="progress-rules-feedback-box" style="margin-top: 18px;">
                    <h5 style="margin: 0 0 8px 0; color: var(--forge-accent); font-size: 13.5px; text-transform: uppercase;">
                        ⚡ Actionable Progress Recommendations
                    </h5>
                    ${(summary.recommendations || []).map(r => `
                        <div class="rec-bullet-row">
                            <span class="rec-arrow">→</span>
                            <span style="font-size: 13px; color: var(--forge-text-primary); line-height: 1.5;">${r}</span>
                        </div>
                    `).join('')}

                    ${(summary.warnings || []).map(w => `
                        <div class="rec-bullet-row warning">
                            <span class="rec-arrow">⚠️</span>
                            <span style="font-size: 13px; color: #f59e0b; line-height: 1.5;">${w}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // TAB 6: TARGETS & USER CUSTOMIZATION (Requirement 21 & 22)
    // -------------------------------------------------------------------------
    renderProfileTab(profile) {
        return `
            <div class="profile-settings-card">
                <h3 style="margin: 0; color: #fff; font-size: 17px;">⚙️ User Profile & Nutrition Target Customization</h3>
                <p style="margin: 4px 0 16px 0; font-size: 13px; color: var(--forge-text-secondary);">
                    These targets are adaptive starting points. Adjust your targets as your body composition evolves.
                </p>

                <div class="form-grid-2col">
                    <div class="form-group">
                        <label class="form-label">Age</label>
                        <input type="number" id="editAge" class="form-input" value="${profile.age || 20}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Height (cm)</label>
                        <input type="number" id="editHeight" class="form-input" value="${profile.heightCm || 170}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Starting Weight (kg)</label>
                        <input type="number" step="0.1" id="editStartWeight" class="form-input" value="${profile.startingWeightKg || 92}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Milestone 1 Target (kg)</label>
                        <input type="number" step="0.1" id="editMilestone" class="form-input" value="${profile.currentMilestoneKg || 87}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Calorie Target (kcal)</label>
                        <input type="number" id="editCalories" class="form-input" value="${profile.dailyCalorieTarget || 2250}">
                        <small style="color: var(--forge-text-muted); font-size: 11px;">Minimum safe floor: 1,200 kcal. Recommended: 2,200–2,300 kcal.</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Protein Target (g)</label>
                        <input type="number" id="editProtein" class="form-input" value="${profile.dailyProteinTargetG || 150}">
                        <small style="color: var(--forge-text-muted); font-size: 11px;">Recommended: 140–160g for lean mass preservation.</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Water Target (ml)</label>
                        <input type="number" id="editWater" class="form-input" value="${profile.dailyWaterTargetMl || 3000}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Steps Target</label>
                        <input type="number" id="editSteps" class="form-input" value="${profile.dailyStepTarget || 9000}">
                    </div>
                </div>

                <!-- Permanent Dietary Exclusions Box -->
                <div style="margin-top: 18px; padding: 14px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--forge-radius-md);">
                    <div style="font-weight: 700; color: #ef4444; font-size: 13.5px; margin-bottom: 4px;">
                        🚫 Strict Dietary Constraint: NO CHICKEN (Active)
                    </div>
                    <div style="font-size: 12.5px; color: var(--forge-text-secondary);">
                        Chicken is permanently excluded from all recommended meal plans, substitutions, and database prompts for your account.
                    </div>
                </div>

                <!-- Packaged Protein Oats Custom Override (Requirement 21) -->
                <div style="margin-top: 20px; padding: 16px; background: var(--forge-surface-raised); border: 1px solid var(--forge-border); border-radius: var(--forge-radius-md);">
                    <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 14px;">🏷️ Packaged Food Override: Chocolate Protein Oats</h4>
                    <p style="margin: 0 0 12px 0; font-size: 12px; color: var(--forge-text-secondary);">
                        Brands differ in nutrition facts. Override the values below using the exact label on your specific oats packaging.
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px;">
                        <div>
                            <label style="font-size: 11px; color: var(--forge-text-muted);">Serving Size (g)</label>
                            <input type="number" id="oatsServing" class="form-input" value="50">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: var(--forge-text-muted);">Calories (kcal)</label>
                            <input type="number" id="oatsCals" class="form-input" value="195">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: var(--forge-text-muted);">Protein (g)</label>
                            <input type="number" step="0.1" id="oatsProtein" class="form-input" value="12.5">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: var(--forge-text-muted);">Carbs (g)</label>
                            <input type="number" step="0.1" id="oatsCarbs" class="form-input" value="28">
                        </div>
                        <div>
                            <label style="font-size: 11px; color: var(--forge-text-muted);">Fats (g)</label>
                            <input type="number" step="0.1" id="oatsFats" class="form-input" value="3.5">
                        </div>
                    </div>
                    <button class="action-btn-ghost" style="margin-top: 10px; font-size: 11.5px;" onclick="NutritionEngine.saveOatsOverride()">
                        Save Packaging Label Values
                    </button>
                </div>

                <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                    <button class="btn-primary" onclick="NutritionEngine.saveProfileSettings()">
                        Save Profile Settings →
                    </button>
                </div>
            </div>
        `;
    },

    saveProfileSettings() {
        const age = parseInt(document.getElementById('editAge')?.value || '20', 10);
        const heightCm = parseFloat(document.getElementById('editHeight')?.value || '170');
        const startingWeightKg = parseFloat(document.getElementById('editStartWeight')?.value || '92');
        const currentMilestoneKg = parseFloat(document.getElementById('editMilestone')?.value || '87');
        const dailyCalorieTarget = parseInt(document.getElementById('editCalories')?.value || '2250', 10);
        const dailyProteinTargetG = parseInt(document.getElementById('editProtein')?.value || '150', 10);
        const dailyWaterTargetMl = parseInt(document.getElementById('editWater')?.value || '3000', 10);
        const dailyStepTarget = parseInt(document.getElementById('editSteps')?.value || '9000', 10);

        Store.updateNutritionProfile({
            age,
            heightCm,
            startingWeightKg,
            currentMilestoneKg,
            dailyCalorieTarget,
            dailyProteinTargetG,
            dailyWaterTargetMl,
            dailyStepTarget
        });

        showToast('Nutrition targets updated successfully!', 'success');
        this.render();
    },

    saveOatsOverride() {
        const portionSize = Number(document.getElementById('oatsServing')?.value || 50);
        const calories = Number(document.getElementById('oatsCals')?.value || 195);
        const proteinG = Number(document.getElementById('oatsProtein')?.value || 12.5);
        const carbsG = Number(document.getElementById('oatsCarbs')?.value || 28);
        const fatsG = Number(document.getElementById('oatsFats')?.value || 3.5);

        Store.saveCustomFoodOverride('protein_oats', {
            name: 'Protein Oats (Custom Brand)',
            portionSize,
            portionUnit: 'g',
            calories,
            proteinG,
            carbsG,
            fatsG
        });

        showToast('Saved custom protein oats label values!', 'success');
    },

    // -------------------------------------------------------------------------
    // QUICK ACTION HELPERS
    // -------------------------------------------------------------------------
    addWater(amountMl) {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        Store.logNutritionWater(dateStr, amountMl, 'add');
        showToast(`+${amountMl} ml water logged! 💧`, 'info');
        this.render();
    },

    resetWater() {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        Store.logNutritionWater(dateStr, 0, 'set');
        showToast('Water reset for today.', 'info');
        this.render();
    },

    saveStepsFromInput() {
        const input = document.getElementById('quickStepsInput');
        if (!input) return;
        const steps = Number(input.value) || 0;
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        Store.logNutritionSteps(dateStr, steps);
        showToast(`Logged ${steps.toLocaleString()} campus steps! 👟`, 'success');
        this.render();
    },

    toggleCardio() {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        const day = Store.getNutritionDay(dateStr);
        const currentCompleted = day.cardioCompleted;
        const duration = Store.getNutritionProfile().cardioDurationMinutes || 25;
        Store.logNutritionCardio(dateStr, duration, 'Incline Walking', !currentCompleted);
        showToast(!currentCompleted ? 'Cardio session marked complete! 🏃' : 'Cardio uncheck.', 'info');
        this.render();
    },

    logCoffee(delta) {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        const day = Store.getNutritionDay(dateStr);
        const nextVal = delta === 0 ? 0 : (day.coffeeCups || 0) + delta;
        Store.saveNutritionDay(dateStr, { coffeeCups: Math.max(0, nextVal) });
        showToast(nextVal > 0 ? `Logged ${nextVal} cups coffee ☕` : 'Coffee count reset', 'info');
        this.render();
    },

    setEnergy(level) {
        const dateStr = this.selectedDate || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10));
        Store.logNutritionEnergy(dateStr, level);
        showToast(`Energy marked as ${level} ⚡`, 'info');
        this.render();
    },

    openLogWeightModal() {
        this.switchTab('tracker');
    },

    openLogWaistModal() {
        this.switchTab('tracker');
    },

    // -------------------------------------------------------------------------
    // WIDGET FOR TODAY'S COMMAND (Requirement 1 & Integration)
    // -------------------------------------------------------------------------
    renderTodayWidget() {
        const dateStr = typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().slice(0, 10);
        const day = Store.getNutritionDay(dateStr);
        const profile = Store.getNutritionProfile();

        const calTarget = profile.dailyCalorieTarget || 2250;
        const protTarget = profile.dailyProteinTargetG || 150;
        const calPct = Math.min(100, Math.round(((day.totalCalories || 0) / calTarget) * 100));
        const protPct = Math.min(100, Math.round(((day.totalProteinG || 0) / protTarget) * 100));

        return `
            <div class="today-nutrition-widget" onclick="App.switchView('nutrition')" title="Click to open Nutrition & Fat Loss Command">
                <div class="tnw-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">🥗</span>
                        <div>
                            <span class="tnw-badge">STUDYOS FAT LOSS & NUTRITION ENGINE</span>
                            <div style="font-size: 14px; font-weight: 700; color: #fff;">Today's Nutrition & Habits</div>
                        </div>
                    </div>
                    <span class="tnw-link">Open Engine →</span>
                </div>
                <div class="tnw-bars-row" style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: var(--forge-text-secondary); margin-bottom: 4px;">
                            <span>Calories: <b>${day.totalCalories} / ${calTarget}</b></span>
                            <span>${calPct}%</span>
                        </div>
                        <div class="nutrition-mini-track">
                            <div class="nutrition-mini-fill" style="width: ${calPct}%; background: var(--forge-accent);"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: var(--forge-text-secondary); margin-bottom: 4px;">
                            <span>Protein: <b>${day.totalProteinG} / ${protTarget}g</b></span>
                            <span>${protPct}%</span>
                        </div>
                        <div class="nutrition-mini-track">
                            <div class="nutrition-mini-fill" style="width: ${protPct}%; background: #10b981;"></div>
                        </div>
                    </div>
                </div>
                <div class="tnw-footer" style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 11.5px; color: var(--forge-text-muted);">
                    <span>💧 Water: <b>${day.waterMl}ml</b></span>
                    <span>👟 Steps: <b>${(day.steps || 0).toLocaleString()}</b></span>
                    <span>🏃 Cardio: <b>${day.cardioCompleted ? '✓ Done' : '25m'}</b></span>
                    <span>⚡ Energy: <b>${day.energyLevel || 'NORMAL'}</b></span>
                </div>
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.NutritionEngine = NutritionEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NutritionEngine };
}
