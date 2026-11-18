/**
 * BOSS Study OS — Edit Today's Planned Workout Feature Test Suite
 * 
 * Verifies all requirements:
 * 1. Change Today's Workout button added to Today's Workout card (active and rest day).
 * 2. Clean modal with the 7 selectable muscle groups:
 *    Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs.
 *    Supports multiple selection and preselects currently assigned muscle groups.
 * 3. Save Today's Workout updates:
 *    - Today's planned muscle groups
 *    - Today's Workout card immediately
 *    - Workout title and muscle group labels
 *    - Preparation interface (check-in and exercise selection)
 *    - Preserves existing weekly plan
 * 4. Two change options:
 *    A. CHANGE TODAY ONLY (Default) — modifies only today, recurring split preserved
 *    B. UPDATE WEEKLY WORKOUT PLAN — modifies recurring split with explicit confirmation
 * 5. Start Workout integration:
 *    - Uses currently selected muscle groups
 *    - Does not revert to original split
 *    - Preserves photo check-in and session logging
 *    - No duplicate sessions
 * 6. Persistence:
 *    - Persists across page refresh / reload
 *    - Synchronizes with Supabase / SyncEngine
 *    - Local calendar date association
 *    - Historical sessions untouched
 */

const assert = require('assert');

// Global mock DOM environment
class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.textContent = '';
        this._innerHTML = '';
        this.style = {};
        this.disabled = false;
        this.parentElement = null;
        this.children = [];
        this.classList = {
            _classes: new Set(),
            add: (c) => this.classList._classes.add(c),
            remove: (c) => this.classList._classes.delete(c),
            contains: (c) => this.classList._classes.has(c),
            toggle: (c) => {
                if (this.classList._classes.has(c)) this.classList._classes.delete(c);
                else this.classList._classes.add(c);
            }
        };
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
        this._innerHTML = val;
        if (typeof val === 'string') {
            const matches = val.matchAll(/id=["']([^"']+)["']/g);
            for (const m of matches) {
                const childId = m[1];
                if (!mockDoc.elements[childId]) {
                    const child = new MockElement(childId);
                    child.parentElement = this;
                    mockDoc.elements[childId] = child;
                }
            }
        }
    }

    appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        if (child.id) mockDoc.elements[child.id] = child;
        return child;
    }
}

class MockDocument {
    constructor() {
        this.elements = {};
        this.body = new MockElement('body', 'body');
    }

    getElementById(id) {
        return this.elements[id] || null;
    }

    createElement(tag) {
        const el = new MockElement('', tag);
        return el;
    }

    querySelector(sel) {
        if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
        return null;
    }
}

const mockDoc = new MockDocument();
global.document = mockDoc;
global.window = {
    document: mockDoc,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: 'http://localhost' },
    navigator: { onLine: true }
};
global.navigator = global.window.navigator;
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

let lastToast = null;
global.showToast = (msg, type) => {
    lastToast = { msg, type };
};

// Window alert & confirm mocks
let confirmResponse = true;
global.confirm = () => confirmResponse;

// Load config, store, and services
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { Store } = require('../js/store.js');
global.Store = Store;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

// Load SyncEngine mock
let pushedSyncPlans = [];
global.SyncEngine = {
    pushWorkoutPlan(schedule, settings) {
        pushedSyncPlans.push({ schedule, settings });
    },
    pushWorkoutSession(sessionData) {}
};
global.window.SyncEngine = global.SyncEngine;

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

let passedCount = 0;
let failedCount = 0;

function pass(name) {
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
}

function fail(name, err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message || err);
    failedCount++;
}

async function runTests() {
    console.log('================================================================');
    console.log('FORGE WEB — EDIT TODAY\'S PLANNED WORKOUT VERIFICATION TEST SUITE');
    console.log('================================================================\n');

    // Setup base state
    localStorage.clear();
    Store.init();
    Store.initDefaultGymSplit(true);
    GymEngine.init();

    // -------------------------------------------------------------------------
    // TEST 1: Change Today's Workout button present in Today's card
    // -------------------------------------------------------------------------
    try {
        // Test normal active workout day card
        const testDateWed = '2026-11-18'; // Wednesday
        const wedInfo = Store.getTodayWorkoutTemplate(testDateWed);
        assert.strictEqual(wedInfo.dayKey, 'wednesday');
        assert.strictEqual(wedInfo.template.routineName, 'Chest + Triceps');

        const cardHtml = GymEngine.renderTodayWorkoutCard(wedInfo);
        assert(cardHtml.includes('btn-change-today-workout'), 'Must contain .btn-change-today-workout button');
        assert(cardHtml.includes('GymEngine.openChangeTodayWorkoutModal()'), 'Must call openChangeTodayWorkoutModal');
        assert(cardHtml.includes('START WORKOUT'), 'Must contain Start Workout button');

        // Test Rest Day card
        const testDateSun = '2026-11-22'; // Sunday
        const sunInfo = Store.getTodayWorkoutTemplate(testDateSun);
        assert.strictEqual(sunInfo.template.isRestDay, true);
        const restCardHtml = GymEngine.renderTodayWorkoutCard(sunInfo);
        assert(restCardHtml.includes('btn-change-today-workout'), 'Rest Day card must also contain Change Workout button');

        pass('1. Change Workout button is present on both active and rest day cards');
    } catch (e) {
        fail('1. Change Workout button is present on both active and rest day cards', e);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Muscle Group Selector Modal with 7 groups & preselection
    // -------------------------------------------------------------------------
    try {
        DateUtils.todayIST = () => '2026-11-18'; // Set today as Wednesday
        GymEngine.openChangeTodayWorkoutModal();

        assert(GymEngine.changeWorkoutState, 'changeWorkoutState must be initialized');
        assert.strictEqual(GymEngine.changeWorkoutState.dayKey, 'wednesday');
        assert.strictEqual(GymEngine.changeWorkoutState.dayName, 'Wednesday');

        // Verify preselection: Wednesday has Chest and Triceps
        assert(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Chest'), 'Chest should be preselected');
        assert(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Triceps'), 'Triceps should be preselected');
        assert.strictEqual(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Legs'), false, 'Legs should not be preselected');

        // Verify 7 available muscle groups
        const expectedGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs'];
        assert.strictEqual(GymEngine.AVAILABLE_MUSCLE_GROUPS.length, 7);
        expectedGroups.forEach(g => {
            assert(GymEngine.AVAILABLE_MUSCLE_GROUPS.some(item => item.id === g), `Group ${g} must be present`);
        });

        const modalEl = document.getElementById('changeTodayWorkoutModal');
        assert(modalEl, 'Modal element must exist in document');
        assert(modalEl.classList.contains('active'), 'Modal must be active');
        assert(modalEl.innerHTML.includes('Chest'), 'Modal must render Chest chip');
        assert(modalEl.innerHTML.includes('Legs'), 'Modal must render Legs chip');

        GymEngine.closeChangeTodayWorkoutModal();
        assert.strictEqual(GymEngine.changeWorkoutState, null, 'Modal state must be cleared on close');
        pass('2. Clean modal displays 7 muscle groups and preselects current Wednesday split');
    } catch (e) {
        fail('2. Clean modal displays 7 muscle groups and preselects current Wednesday split', e);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Wednesday Chest + Triceps changed to Legs + Shoulders (Option A)
    // -------------------------------------------------------------------------
    try {
        DateUtils.todayIST = () => '2026-11-18'; // Wednesday
        GymEngine.openChangeTodayWorkoutModal();

        // Deselect Chest and Triceps, select Legs and Shoulders
        GymEngine.toggleTodayMuscleGroup('Chest'); // Deselect
        GymEngine.toggleTodayMuscleGroup('Triceps'); // Deselect
        GymEngine.toggleTodayMuscleGroup('Legs'); // Select
        GymEngine.toggleTodayMuscleGroup('Shoulders'); // Select

        assert.strictEqual(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Chest'), false);
        assert.strictEqual(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Triceps'), false);
        assert.strictEqual(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Legs'), true);
        assert.strictEqual(GymEngine.changeWorkoutState.selectedMuscleGroups.has('Shoulders'), true);
        assert.strictEqual(GymEngine.changeWorkoutState.scope, 'today'); // Default option A

        // Save
        GymEngine.saveTodayWorkoutChange();

        // Verify today's workout template
        const todayWed = Store.getTodayWorkoutTemplate('2026-11-18');
        assert.strictEqual(todayWed.template.routineName, 'Legs + Shoulders');
        assert.strictEqual(todayWed.template.workoutType, 'Legs + Shoulders');
        assert.deepStrictEqual(todayWed.template.muscleGroups, ['Legs', 'Shoulders']);
        assert.strictEqual(todayWed.template.isRestDay, false);
        assert.strictEqual(todayWed.template.isOverride, true);

        // Verify UI rendering immediately
        const heroHtml = GymEngine.renderTodayWorkoutCard(todayWed);
        assert(heroHtml.includes('Legs + Shoulders'), 'Hero card must show Legs + Shoulders');
        assert(heroHtml.includes('twh-muscle-pill'), 'Hero card must render muscle pills');
        assert(heroHtml.includes('TODAY\'S OVERRIDE'), 'Hero card must show override indicator badge');

        pass('3. Wednesday Chest + Triceps successfully changed to Legs + Shoulders (Option A)');
    } catch (e) {
        fail('3. Wednesday Chest + Triceps successfully changed to Legs + Shoulders (Option A)', e);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Original weekly plan remains completely unchanged
    // -------------------------------------------------------------------------
    try {
        // Weekly recurring split for Wednesday must still be Chest + Triceps
        const wedSplit = Store.getWorkoutTemplateForDay('wednesday');
        assert.strictEqual(wedSplit.routineName, 'Chest + Triceps', 'Recurring split must remain Chest + Triceps');
        assert.deepStrictEqual(wedSplit.muscleGroups, ['Chest', 'Triceps']);

        // Next Wednesday (2026-11-25) must still be Chest + Triceps
        const nextWed = Store.getTodayWorkoutTemplate('2026-11-25');
        assert.strictEqual(nextWed.template.routineName, 'Chest + Triceps');
        assert.strictEqual(nextWed.template.isOverride, undefined);

        pass('4. Original weekly plan remains unchanged for other dates and recurring schedule');
    } catch (e) {
        fail('4. Original weekly plan remains unchanged for other dates and recurring schedule', e);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Refresh page / reload and verify change persists
    // -------------------------------------------------------------------------
    try {
        // Save current memoryState to localStorage
        Store.save(true);

        // Simulate page reload: re-instantiate Store state from localStorage
        const reloadedStore = new Store.constructor();
        reloadedStore.init();

        const persistedWed = reloadedStore.getTodayWorkoutTemplate('2026-11-18');
        assert.strictEqual(persistedWed.template.routineName, 'Legs + Shoulders');
        assert.deepStrictEqual(persistedWed.template.muscleGroups, ['Legs', 'Shoulders']);
        assert.strictEqual(persistedWed.template.isOverride, true);

        // Ensure next Wednesday on reloaded store remains Chest + Triceps
        const persistedNextWed = reloadedStore.getTodayWorkoutTemplate('2026-11-25');
        assert.strictEqual(persistedNextWed.template.routineName, 'Chest + Triceps');

        pass('5. Refresh page / browser reload persists today\'s override accurately');
    } catch (e) {
        fail('5. Refresh page / browser reload persists today\'s override accurately', e);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Start Workout integration uses overridden muscle groups & photo
    // -------------------------------------------------------------------------
    try {
        DateUtils.todayIST = () => '2026-11-18';
        GymEngine.liveWorkout = null;

        // Click Start Workout
        GymEngine.startWorkoutToday();

        // Verify Check-in Modal received overridden routine & muscle groups
        assert.strictEqual(GymEngine.checkInState.isOpen, true);
        assert.strictEqual(GymEngine.checkInState.routineName, 'Legs + Shoulders');
        assert.deepStrictEqual(GymEngine.checkInState.targetMuscleGroups, ['Legs', 'Shoulders']);

        // Simulate taking mandatory photo check-in
        GymEngine.checkInState.capturedDataUrl = 'data:image/jpeg;base64,/9j/fakeMockPhotoBytes==';
        await GymEngine.confirmCheckInPhoto();

        // Verify live session is initialized with overridden routine
        assert(GymEngine.liveWorkout, 'Live workout must be active');
        assert.strictEqual(GymEngine.liveWorkout.routineName, 'Legs + Shoulders');
        assert.deepStrictEqual(GymEngine.liveWorkout.targetMuscleGroups, ['Legs', 'Shoulders']);
        assert(GymEngine.liveWorkout.gymPhoto, 'Gym photo must be attached');

        // Verify exercise selection stage reflects overridden routine
        const exSelectHtml = GymEngine.renderExerciseSelectionHtml();
        assert(exSelectHtml.includes('Legs + Shoulders'), 'Exercise selection title must show Legs + Shoulders');
        assert(exSelectHtml.includes('LEGS + SHOULDERS'), 'Target muscle group tags must show LEGS + SHOULDERS');

        pass('6. Start Workout integration uses overridden muscle groups, photo check-in, and prep UI');
    } catch (e) {
        fail('6. Start Workout integration uses overridden muscle groups, photo check-in, and prep UI', e);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Complete workout, verify totals, and confirm no duplicate sessions
    // -------------------------------------------------------------------------
    try {
        const live = GymEngine.liveWorkout;
        live.exercises = [
            {
                id: 'ex_squat',
                name: 'Barbell Back Squat',
                muscleGroup: 'Legs',
                sets: [
                    { setNumber: 1, weightKg: 100, reps: 8, completed: true },
                    { setNumber: 2, weightKg: 100, reps: 8, completed: true }
                ]
            },
            {
                id: 'ex_ohp',
                name: 'Overhead Press',
                muscleGroup: 'Shoulders',
                sets: [
                    { setNumber: 1, weightKg: 50, reps: 10, completed: true }
                ]
            }
        ];

        const initialCount = (Store.getWorkoutSessions() || []).length;

        // Finish workout
        const savedSession = Store.saveWorkoutSession(live);
        assert(savedSession, 'Session must save successfully');
        assert.strictEqual(savedSession.workoutType, 'Legs + Shoulders');
        assert.strictEqual(savedSession.date, '2026-11-18');
        assert.strictEqual(savedSession.totalVolumeKg, (100 * 8) + (100 * 8) + (50 * 10)); // 2100 kg
        assert.strictEqual(savedSession.totalSets, 3);

        const newCount = (Store.getWorkoutSessions() || []).length;
        assert.strictEqual(newCount, initialCount + 1, 'Exactly one session should be added');

        // Re-saving same session must not create duplicate
        Store.saveWorkoutSession(savedSession);
        const dedupeCount = (Store.getWorkoutSessions() || []).length;
        assert.strictEqual(dedupeCount, newCount, 'Re-saving must update in-place without duplicating');

        GymEngine.liveWorkout = null;
        pass('7. Completed session saved with correct metrics and zero duplicate sessions created');
    } catch (e) {
        fail('7. Completed session saved with correct metrics and zero duplicate sessions created', e);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Historical workout sessions remain completely untouched
    // -------------------------------------------------------------------------
    try {
        // Insert a mock historical session from last week
        const histId = 'a1111111-2222-3333-4444-555555555555';
        const histSession = {
            id: histId,
            date: '2026-11-11',
            workoutType: 'Chest + Triceps',
            durationMinutes: 45,
            totalSets: 12,
            totalVolumeKg: 8500,
            exercises: [{ name: 'Bench Press', sets: [{ weightKg: 80, reps: 10, completed: true }] }]
        };
        Store.saveWorkoutSession(histSession);

        // Verify historical session is preserved
        const found = Store.getWorkoutSessions().find(s => s.id === histId);
        assert(found, 'Historical session must exist');
        assert.strictEqual(found.workoutType, 'Chest + Triceps');
        assert.strictEqual(found.totalVolumeKg, 8500);

        pass('8. Historical workouts remain untouched when modifying planned workouts');
    } catch (e) {
        fail('8. Historical workouts remain untouched when modifying planned workouts', e);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Option B: Update Weekly Workout Plan requires explicit confirmation
    // -------------------------------------------------------------------------
    try {
        DateUtils.todayIST = () => '2026-11-18'; // Wednesday
        GymEngine.openChangeTodayWorkoutModal();

        // Select weekly option without confirmation
        GymEngine.setChangeWorkoutScope('weekly');
        assert.strictEqual(GymEngine.changeWorkoutState.weeklyConfirmed, false);

        // Attempting to save without confirmation should be blocked
        GymEngine.saveTodayWorkoutChange();
        assert.strictEqual(GymEngine.changeWorkoutState.isSaving, false, 'Save must be blocked');
        assert(lastToast && lastToast.type === 'warning', 'Must alert user to check confirmation');

        // Confirm
        GymEngine.toggleWeeklyPlanConfirm(true);
        assert.strictEqual(GymEngine.changeWorkoutState.weeklyConfirmed, true);

        // Set to Back + Biceps
        GymEngine.changeWorkoutState.selectedMuscleGroups.clear();
        GymEngine.toggleTodayMuscleGroup('Back');
        GymEngine.toggleTodayMuscleGroup('Biceps');

        // Save with confirmation
        GymEngine.saveTodayWorkoutChange();

        // Verify recurring weekly schedule is now permanently updated
        const updatedWedSplit = Store.getWorkoutTemplateForDay('wednesday');
        assert.strictEqual(updatedWedSplit.routineName, 'Back + Biceps');
        assert.deepStrictEqual(updatedWedSplit.muscleGroups, ['Back', 'Biceps']);

        // Verify next week also reflects the new recurring split
        const nextWedSplit = Store.getTodayWorkoutTemplate('2026-11-25');
        assert.strictEqual(nextWedSplit.template.routineName, 'Back + Biceps');

        pass('9. Option B (Update Weekly Workout Plan) requires explicit confirmation & updates recurring split');
    } catch (e) {
        fail('9. Option B (Update Weekly Workout Plan) requires explicit confirmation & updates recurring split', e);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Reset to Weekly Split restores original recurring split
    // -------------------------------------------------------------------------
    try {
        DateUtils.todayIST = () => '2026-11-19'; // Thursday (Back + Biceps)
        // Set an override for today
        Store.saveTodayWorkoutOverride({
            routineName: 'Chest + Shoulders',
            muscleGroups: ['Chest', 'Shoulders']
        }, '2026-11-19');

        assert.strictEqual(Store.getTodayWorkoutTemplate('2026-11-19').template.routineName, 'Chest + Shoulders');

        // Open modal and reset
        GymEngine.openChangeTodayWorkoutModal();
        assert.strictEqual(GymEngine.changeWorkoutState.isCurrentOverride, true);

        GymEngine.resetTodayWorkoutToSplit();

        // Verify override removed and Thursday restored to weekly split
        const restored = Store.getTodayWorkoutTemplate('2026-11-19');
        assert.strictEqual(restored.template.routineName, 'Back + Biceps');
        assert.strictEqual(restored.template.isOverride, undefined);

        pass('10. Reset to Weekly Split removes override and restores recurring split immediately');
    } catch (e) {
        fail('10. Reset to Weekly Split removes override and restores recurring split immediately', e);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Rest Day converted to Workout and vice versa
    // -------------------------------------------------------------------------
    try {
        DateUtils.todayIST = () => '2026-11-22'; // Sunday (scheduled Rest)
        assert.strictEqual(Store.getTodayWorkoutTemplate('2026-11-22').template.isRestDay, true);

        // Convert Sunday Rest to Chest + Triceps workout
        GymEngine.openChangeTodayWorkoutModal();
        GymEngine.toggleTodayMuscleGroup('Chest');
        GymEngine.toggleTodayMuscleGroup('Triceps');
        GymEngine.saveTodayWorkoutChange();

        const sunTrained = Store.getTodayWorkoutTemplate('2026-11-22');
        assert.strictEqual(sunTrained.template.isRestDay, false);
        assert.strictEqual(sunTrained.template.routineName, 'Chest + Triceps');

        // Convert back to Rest Day by clearing muscle groups
        GymEngine.openChangeTodayWorkoutModal();
        GymEngine.markTodayAsRest();
        assert.strictEqual(GymEngine.changeWorkoutState.selectedMuscleGroups.size, 0);
        GymEngine.saveTodayWorkoutChange();

        const sunRestAgain = Store.getTodayWorkoutTemplate('2026-11-22');
        assert.strictEqual(sunRestAgain.template.isRestDay, true);
        assert.strictEqual(sunRestAgain.template.routineName, 'Rest');

        pass('11. Rest Day seamlessly converts to Workout and vice versa');
    } catch (e) {
        fail('11. Rest Day seamlessly converts to Workout and vice versa', e);
    }

    // -------------------------------------------------------------------------
    // TEST 12: Cloud synchronization pushes dailyOverrides in workout plan settings
    // -------------------------------------------------------------------------
    try {
        pushedSyncPlans = [];
        Store.saveTodayWorkoutOverride({
            routineName: 'Legs + Abs',
            muscleGroups: ['Legs', 'Abs']
        }, '2026-11-20');

        assert(pushedSyncPlans.length > 0, 'Must push to SyncEngine');
        const lastPush = pushedSyncPlans[pushedSyncPlans.length - 1];
        assert(lastPush.settings.dailyOverrides, 'settings.dailyOverrides must be synchronized');
        assert(lastPush.settings.dailyOverrides['2026-11-20'], 'Specific date override must be present');
        assert.strictEqual(lastPush.settings.dailyOverrides['2026-11-20'].routineName, 'Legs + Abs');

        pass('12. Cloud synchronization accurately serializes dailyOverrides inside settings');
    } catch (e) {
        fail('12. Cloud synchronization accurately serializes dailyOverrides inside settings', e);
    }

    console.log('\n================================================================');
    console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
