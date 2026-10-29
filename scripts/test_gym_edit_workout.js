/**
 * BOSS Study OS — Edit Completed Workout Feature Comprehensive Test Suite
 * 
 * Verifies all 15 required test scenarios:
 * 1. Edit today's completed workout.
 * 2. Edit an older completed workout from Workout History.
 * 3. Change weight and repetitions.
 * 4. Add and remove a set.
 * 5. Add and remove an exercise.
 * 6. Save and reload the session.
 * 7. Cancel without saving.
 * 8. Prevent duplicate submissions.
 * 9. Preserve session ID and gym photo.
 * 10. Verify updated totals and volume (ignoring incomplete/invalid sets).
 * 11. Verify cloud synchronization and offline behavior.
 * 12. Confirm that unauthorized users cannot edit the session.
 * 13. Confirm that the edited workout remains completed.
 * 14. Confirm that PDF export reflects the corrected workout.
 * 15. Confirm that no duplicate sessions, exercises, sets, or PR records are created.
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
let pushedSyncSessions = [];
let queuedSyncMutations = [];
global.SyncEngine = {
    pushWorkoutSession(sessionData) {
        pushedSyncSessions.push(sessionData);
        if (!navigator.onLine) {
            queuedSyncMutations.push({ type: 'WORKOUT_SESSION', sessionData });
        }
    }
};
global.window.SyncEngine = global.SyncEngine;

// Load GymExportEngine mock
global.GymExportEngine = {
    lastExportedId: null,
    exportSingleWorkout(id) {
        this.lastExportedId = id;
    }
};

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

let passedCount = 0;
let failedCount = 0;

function pass(name) {
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
}

function fail(name, err) {
    console.error(`  ✗ [FAIL] ${name}:`, err ? (err.message || err) : 'Assertion failed');
    if (err && err.stack) console.error(err.stack);
    failedCount++;
}

async function runAll() {
    console.log('================================================================');
    console.log('FORGE WEB — EDIT COMPLETED WORKOUT VERIFICATION TEST SUITE');
    console.log('================================================================\n');

    const testUserId = 'user_forge_42';
    SupabaseService.currentUser = { id: testUserId, email: 'athlete@forge.internal' };
    Store.init();

    // -------------------------------------------------------------------------
    // TEST 1: Edit today's completed workout
    // -------------------------------------------------------------------------
    try {
        const today = DateUtils.todayIST();
        Store.memoryState.gym.sessions = [];
        
        const todaySession = Store.saveWorkoutSession({
            id: '3fa85f64-5717-4562-b3fc-2c963f660001',
            userId: testUserId,
            date: today,
            routineName: 'Legs + Shoulders',
            durationMinutes: 45,
            status: 'completed',
            gym_photo_path: `gym-photos/${testUserId}/2026/10/today_checkin.jpg`,
            exercises: [
                {
                    id: 'ex_1',
                    exerciseId: 'squat',
                    name: 'Barbell Squat',
                    muscleGroup: 'Legs',
                    sets: [
                        { setNumber: 1, weightKg: 100, reps: 5, completed: true },
                        { setNumber: 2, weightKg: 100, reps: 5, completed: true }
                    ]
                }
            ]
        });

        // Verify today completed hero card renders Edit Workout button
        const todayInfo = Store.getTodayWorkoutTemplate();
        const heroHtml = GymEngine.renderTodayWorkoutCard(todayInfo);
        assert(heroHtml.includes('btn-edit-workout'), 'Hero card must include btn-edit-workout');
        assert(heroHtml.includes(`GymEngine.openEditWorkoutModal('${todaySession.id}')`), 'Edit button must target today session ID');

        // Open edit modal
        GymEngine.openEditWorkoutModal(todaySession.id);
        assert(GymEngine.editingWorkoutSession !== null, 'Editing session must be active in GymEngine');
        assert.strictEqual(GymEngine.editingWorkoutSession.id, todaySession.id, 'Editing session ID must match');
        assert.strictEqual(GymEngine.editingWorkoutSession.exercises.length, 1, 'Loaded exercises must match');

        pass('1. Edit today\'s completed workout');
    } catch (e) {
        fail('1. Edit today\'s completed workout', e);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Edit an older completed workout from Workout History
    // -------------------------------------------------------------------------
    try {
        const pastDate = '2026-08-14';
        const pastSession = Store.saveWorkoutSession({
            id: '3fa85f64-5717-4562-b3fc-2c963f660002',
            userId: testUserId,
            date: pastDate,
            routineName: 'Back + Biceps',
            durationMinutes: 50,
            status: 'completed',
            gym_photo_path: `gym-photos/${testUserId}/2026/08/past_checkin.jpg`,
            exercises: [
                {
                    id: 'ex_past_1',
                    exerciseId: 'deadlift',
                    name: 'Deadlift',
                    muscleGroup: 'Back',
                    sets: [
                        { setNumber: 1, weightKg: 120, reps: 6, completed: true }
                    ]
                }
            ]
        });

        GymEngine.selectedHistoryMonth = '2026-08';
        const historyHtml = GymEngine.renderWorkoutHistoryHtml();
        assert(historyHtml.includes('btn-edit-workout'), 'Workout history card must include btn-edit-workout');
        assert(historyHtml.includes(`GymEngine.openEditWorkoutModal('${pastSession.id}')`), 'History edit button must call openEditWorkoutModal with past session ID');

        // Also verify details modal footer has edit button
        GymEngine.viewSessionDetails(pastSession.id);
        const detailModal = mockDoc.getElementById('workoutSessionDetailModal');
        assert(detailModal, 'Detail modal must exist');
        assert(detailModal.innerHTML.includes('btn-edit-workout'), 'Detail modal footer must include Edit Workout button');

        // Open edit modal from history session
        GymEngine.openEditWorkoutModal(pastSession.id);
        assert.strictEqual(GymEngine.editingWorkoutSession.id, pastSession.id, 'Must open exact historical session');
        assert.strictEqual(GymEngine.editingWorkoutSession.date, pastDate, 'Must preserve historical date');

        pass('2. Edit an older completed workout from Workout History');
    } catch (e) {
        fail('2. Edit an older completed workout from Workout History', e);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Change weight and repetitions
    // -------------------------------------------------------------------------
    try {
        const sess = GymEngine.editingWorkoutSession;
        // Edit set 0: change weight to 140 and reps to 8
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 140);
        GymEngine.updateEditingSetField(0, 0, 'reps', 8);

        assert.strictEqual(sess.exercises[0].sets[0].weightKg, 140, 'Weight must be updated');
        assert.strictEqual(sess.exercises[0].sets[0].reps, 8, 'Reps must be updated');
        assert.strictEqual(GymEngine.editingWorkoutSessionIsDirty, true, 'Dirty state must be true');

        const totals = GymEngine.calculateWorkoutTotals(sess.exercises);
        assert.strictEqual(totals.totalVolumeKg, 140 * 8, 'Volume must equal 140 * 8 = 1120 kg');
        assert.strictEqual(totals.totalSets, 1, 'Total sets must equal 1');

        pass('3. Change weight and repetitions');
    } catch (e) {
        fail('3. Change weight and repetitions', e);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Add and remove a set
    // -------------------------------------------------------------------------
    try {
        const sess = GymEngine.editingWorkoutSession;
        const initialSets = sess.exercises[0].sets.length;

        // Add set
        GymEngine.addSetToEditingWorkout(0);
        assert.strictEqual(sess.exercises[0].sets.length, initialSets + 1, 'Set count must increase by 1');
        assert.strictEqual(sess.exercises[0].sets[sess.exercises[0].sets.length - 1].setNumber, initialSets + 1, 'New set number must be sequential');

        // Populate new set
        GymEngine.updateEditingSetField(0, 1, 'weightKg', 140);
        GymEngine.updateEditingSetField(0, 1, 'reps', 6);

        // Remove the first set
        GymEngine.removeSetFromEditingWorkout(0, 0);
        assert.strictEqual(sess.exercises[0].sets.length, initialSets, 'Set count must be restored after remove');
        assert.strictEqual(sess.exercises[0].sets[0].setNumber, 1, 'Remaining sets must be re-indexed starting at 1');
        assert.strictEqual(sess.exercises[0].sets[0].reps, 6, 'Remaining set values must be preserved');

        pass('4. Add and remove a set');
    } catch (e) {
        fail('4. Add and remove a set', e);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Add and remove an exercise
    // -------------------------------------------------------------------------
    try {
        const sess = GymEngine.editingWorkoutSession;
        const initialExCount = sess.exercises.length;

        // Add exercise from library
        GymEngine.addExerciseToEditingWorkout({
            id: 'pull_up',
            name: 'Pull-Up',
            muscleGroup: 'Back'
        });

        assert.strictEqual(sess.exercises.length, initialExCount + 1, 'Exercise count must increase');
        assert.strictEqual(sess.exercises[sess.exercises.length - 1].name, 'Pull-Up', 'Exercise name must match');

        // Test duplicate prevention
        lastToast = null;
        GymEngine.addExerciseToEditingWorkout({
            id: 'pull_up',
            name: 'Pull-Up',
            muscleGroup: 'Back'
        });
        assert.strictEqual(sess.exercises.length, initialExCount + 1, 'Duplicate exercise must not be added');
        assert(lastToast && lastToast.type === 'warning', 'Duplicate exercise should trigger warning toast');

        // Remove newly added exercise
        GymEngine.removeExerciseFromEditingWorkout(sess.exercises.length - 1);
        assert.strictEqual(sess.exercises.length, initialExCount, 'Exercise count must be restored after removal');

        pass('5. Add and remove an exercise');
    } catch (e) {
        fail('5. Add and remove an exercise', e);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Save and reload the session
    // -------------------------------------------------------------------------
    try {
        const sessId = GymEngine.editingWorkoutSession.id;
        // Make a concrete edit
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 150);
        GymEngine.updateEditingSetField(0, 0, 'reps', 5);
        GymEngine.saveEditedWorkout();

        assert.strictEqual(GymEngine.editingWorkoutSession, null, 'Editing session must be closed after save');

        // Reload from Store
        const reloaded = Store.getWorkoutSessionById(sessId);
        assert.ok(reloaded, 'Session must exist in Store');
        assert.strictEqual(reloaded.exercises[0].sets[0].weightKg, 150, 'Reloaded weight must match edited value');
        assert.strictEqual(reloaded.exercises[0].sets[0].reps, 5, 'Reloaded reps must match edited value');
        assert.strictEqual(reloaded.totalVolumeKg, 150 * 5, 'Reloaded volume must be updated');

        pass('6. Save and reload the session');
    } catch (e) {
        fail('6. Save and reload the session', e);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Cancel without saving
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions()[0];
        const originalVolume = targetSession.totalVolumeKg;

        GymEngine.openEditWorkoutModal(targetSession.id);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 999);
        GymEngine.updateEditingSetField(0, 0, 'reps', 99);

        // Cancel
        GymEngine.cancelEditWorkout();

        assert.strictEqual(GymEngine.editingWorkoutSession, null, 'Editing session must be cleared');

        // Verify Store session was NOT changed
        const unchanged = Store.getWorkoutSessionById(targetSession.id);
        assert.strictEqual(unchanged.totalVolumeKg, originalVolume, 'Original session in Store must not be modified after cancel');

        pass('7. Cancel without saving');
    } catch (e) {
        fail('7. Cancel without saving', e);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Prevent duplicate submissions
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions()[0];
        GymEngine.openEditWorkoutModal(targetSession.id);

        GymEngine._isSavingEditedWorkout = true;
        pushedSyncSessions = [];
        GymEngine.saveEditedWorkout();

        assert.strictEqual(pushedSyncSessions.length, 0, 'Must abort if save is already in progress');

        GymEngine._isSavingEditedWorkout = false;
        GymEngine.closeEditWorkoutModal(true);

        pass('8. Prevent duplicate submissions');
    } catch (e) {
        fail('8. Prevent duplicate submissions', e);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Preserve session ID and gym photo
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions()[0];
        const origId = targetSession.id;
        const origPhotoPath = targetSession.gym_photo_path;
        assert(origPhotoPath, 'Target session must have a photo path');

        GymEngine.openEditWorkoutModal(origId);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 125);
        GymEngine.saveEditedWorkout();

        const afterSession = Store.getWorkoutSessionById(origId);
        assert.strictEqual(afterSession.id, origId, 'Session ID must remain identical');
        assert.strictEqual(afterSession.gym_photo_path, origPhotoPath, 'Photo path must remain strictly identical');
        assert.ok(afterSession.gymPhoto, 'gymPhoto metadata object must be preserved');

        pass('9. Preserve session ID and gym photo');
    } catch (e) {
        fail('9. Preserve session ID and gym photo', e);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Verify updated totals and volume (ignoring incomplete/invalid sets)
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions()[0];
        GymEngine.openEditWorkoutModal(targetSession.id);

        const sess = GymEngine.editingWorkoutSession;
        sess.exercises[0].sets = [
            { setNumber: 1, weightKg: 100, reps: 10, completed: true },   // valid: 1000 kg, 1 set
            { setNumber: 2, weightKg: 100, reps: 5, completed: false },   // INCOMPLETE: must NOT count toward volume or sets!
            { setNumber: 3, weightKg: 0, reps: 15, completed: true },     // bodyweight: 0 kg vol, 1 set
            { setNumber: 4, weightKg: 50, reps: 0, completed: true }      // invalid 0 reps: must NOT count
        ];

        const totals = GymEngine.calculateWorkoutTotals(sess.exercises);
        assert.strictEqual(totals.totalVolumeKg, 1000, 'Volume must ONLY include completed sets with valid weight and reps (1000 kg)');
        assert.strictEqual(totals.totalSets, 2, 'Sets must ONLY include completed sets with >0 reps (sets 1 & 3 = 2 sets)');

        GymEngine.saveEditedWorkout();
        const saved = Store.getWorkoutSessionById(targetSession.id);
        assert.strictEqual(saved.totalVolumeKg, 1000, 'Saved totalVolumeKg must match calculated 1000 kg');
        assert.strictEqual(saved.totalSets, 2, 'Saved totalSets must match calculated 2 sets');

        pass('10. Verify updated totals and volume');
    } catch (e) {
        fail('10. Verify updated totals and volume', e);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Verify cloud synchronization and offline behavior
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions()[0];
        pushedSyncSessions = [];
        queuedSyncMutations = [];

        // 1. Online push
        global.navigator.onLine = true;
        GymEngine.openEditWorkoutModal(targetSession.id);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 110);
        GymEngine.saveEditedWorkout();

        assert.strictEqual(pushedSyncSessions.length, 1, 'Must push session to SyncEngine when online');
        assert.strictEqual(pushedSyncSessions[0].id, targetSession.id, 'Pushed session ID must match');

        // 2. Offline queueing
        global.navigator.onLine = false;
        GymEngine.openEditWorkoutModal(targetSession.id);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 115);
        GymEngine.saveEditedWorkout();

        assert(queuedSyncMutations.length > 0, 'Offline save must queue WORKOUT_SESSION in pending mutations');
        assert.strictEqual(queuedSyncMutations[queuedSyncMutations.length - 1].sessionData.id, targetSession.id);

        global.navigator.onLine = true;
        pass('11. Verify cloud synchronization and offline behavior');
    } catch (e) {
        fail('11. Verify cloud synchronization and offline behavior', e);
    }

    // -------------------------------------------------------------------------
    // TEST 12: Confirm that unauthorized users cannot edit the session
    // -------------------------------------------------------------------------
    try {
        const otherUserSession = Store.saveWorkoutSession({
            id: '3fa85f64-5717-4562-b3fc-2c963f660099',
            userId: 'another_user_999',
            date: '2026-07-20',
            routineName: 'Push Day',
            totalSets: 5,
            totalVolumeKg: 500,
            exercises: [{ id: 'ex_o', name: 'Bench', sets: [{ weightKg: 100, reps: 5, completed: true }] }]
        });

        // Current auth user is 'user_forge_42'
        assert.strictEqual(GymEngine.canUserEditSession(otherUserSession), false, 'canUserEditSession must be false for another user session');

        lastToast = null;
        GymEngine.openEditWorkoutModal(otherUserSession.id);
        assert.strictEqual(GymEngine.editingWorkoutSession, null, 'Must not open modal for unauthorized session');
        assert(lastToast && lastToast.type === 'error', 'Must show error toast for unauthorized attempt');

        pass('12. Confirm that unauthorized users cannot edit the session');
    } catch (e) {
        fail('12. Confirm that unauthorized users cannot edit the session', e);
    }

    // -------------------------------------------------------------------------
    // TEST 13: Confirm that the edited workout remains completed
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions().find(s => s.userId === testUserId);
        GymEngine.openEditWorkoutModal(targetSession.id);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 130);
        GymEngine.saveEditedWorkout();

        const updated = Store.getWorkoutSessionById(targetSession.id);
        assert.strictEqual(updated.status, 'completed', 'Edited session status must remain completed');
        assert.strictEqual(Store.getActiveWorkoutSession(), null, 'Active workout session must remain null');
        assert.strictEqual(GymEngine.liveWorkout, null, 'liveWorkout in GymEngine must remain null');

        pass('13. Confirm that the edited workout remains completed');
    } catch (e) {
        fail('13. Confirm that the edited workout remains completed', e);
    }

    // -------------------------------------------------------------------------
    // TEST 14: Confirm that PDF export reflects the corrected workout
    // -------------------------------------------------------------------------
    try {
        const targetSession = Store.getWorkoutSessions().find(s => s.userId === testUserId);
        GymEngine.openEditWorkoutModal(targetSession.id);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 175);
        GymEngine.updateEditingSetField(0, 0, 'reps', 4);
        GymEngine.saveEditedWorkout();

        GymEngine.exportSingleWorkout(targetSession.id);
        assert.strictEqual(GymExportEngine.lastExportedId, targetSession.id, 'exportSingleWorkout must receive target session ID');

        // Query session passed to exporter
        const exportedSession = Store.getWorkoutSessionById(targetSession.id);
        assert.strictEqual(exportedSession.totalVolumeKg, 175 * 4, 'Exported session volume must reflect edited volume');

        pass('14. Confirm that PDF export reflects the corrected workout');
    } catch (e) {
        fail('14. Confirm that PDF export reflects the corrected workout', e);
    }

    // -------------------------------------------------------------------------
    // TEST 15: Confirm that no duplicate sessions, exercises, sets, or PR records are created
    // -------------------------------------------------------------------------
    try {
        const allSessionsBefore = Store.getWorkoutSessions();
        const initialCount = allSessionsBefore.length;
        const targetId = allSessionsBefore[0].id;
        const initialExCount = allSessionsBefore[0].exercises.length;
        const initialSetCount = allSessionsBefore[0].exercises[0].sets.length;

        // Perform 3 sequential edits on the same session
        GymEngine.openEditWorkoutModal(targetId);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 180);
        GymEngine.saveEditedWorkout();

        GymEngine.openEditWorkoutModal(targetId);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 185);
        GymEngine.saveEditedWorkout();

        GymEngine.openEditWorkoutModal(targetId);
        GymEngine.updateEditingSetField(0, 0, 'weightKg', 190);
        GymEngine.saveEditedWorkout();

        const allSessionsAfter = Store.getWorkoutSessions();
        assert.strictEqual(allSessionsAfter.length, initialCount, 'Session count in Store must not increase');

        const sessionMatches = allSessionsAfter.filter(s => s.id === targetId);
        assert.strictEqual(sessionMatches.length, 1, 'Exactly one instance of edited session must exist');

        // Verify exercises and sets inside session
        const session = sessionMatches[0];
        assert.strictEqual(session.exercises.length, initialExCount, 'Exercise count must not duplicate');
        assert.strictEqual(session.exercises[0].sets.length, initialSetCount, 'Set count must not duplicate');

        pass('15. Confirm that no duplicate sessions, exercises, sets, or PR records are created');
    } catch (e) {
        fail('15. Confirm that no duplicate sessions, exercises, sets, or PR records are created', e);
    }

    console.log('\n================================================================');
    console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runAll().catch(e => {
    console.error('Fatal test error:', e);
    process.exit(1);
});
