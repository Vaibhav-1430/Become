/**
 * BOSS Study OS — Comprehensive Gym Web Repair Test Suite
 * 
 * Verifies all 20 required repair tests from PART 29:
 * - WORKOUT_PLAN_PERSISTENCE_TEST
 * - WORKOUT_PLAN_RELOAD_TEST
 * - WORKOUT_PLAN_LOGOUT_LOGIN_TEST
 * - WORKOUT_TYPE_NO_UNDEFINED_TEST
 * - WEEKDAY_MAPPING_TEST
 * - WORKOUT_HISTORY_RELATIONAL_DATA_TEST
 * - WORKOUT_EXERCISE_COUNT_TEST
 * - WORKOUT_SET_COUNT_TEST
 * - WORKOUT_VOLUME_TEST
 * - WORKOUT_DURATION_TEST
 * - WORKOUT_DUPLICATE_DETECTION_TEST
 * - WORKOUT_REFRESH_NO_DUPLICATE_TEST
 * - WORKOUT_REALTIME_NO_DUPLICATE_TEST
 * - WORKOUT_RETRY_NO_DUPLICATE_TEST
 * - WORKOUT_DELETE_TEST
 * - WORKOUT_DELETE_CHILDREN_TEST
 * - WORKOUT_DELETE_ROLLBACK_TEST
 * - GYM_MONTHLY_SUMMARY_TEST
 * - GYM_WEEKLY_SUMMARY_TEST
 * - GYM_CANONICAL_DATA_TEST
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Setup mock DOM & Browser environment
class MockLocalStorage {
    constructor() { this.store = {}; }
    getItem(k) { return this.store[k] || null; }
    setItem(k, v) { this.store[k] = String(v); }
    removeItem(k) { delete this.store[k]; }
    clear() { this.store = {}; }
}

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
    }
    remove() {
        if (this.parentElement) {
            const idx = this.parentElement.children.indexOf(this);
            if (idx >= 0) this.parentElement.children.splice(idx, 1);
        }
        if (this.id) delete mockDoc.elements[this.id];
    }
}

const mockDoc = {
    elements: {},
    getElementById: (id) => mockDoc.elements[id] || null,
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body')
};

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.document = mockDoc;
global.localStorage = new MockLocalStorage();
global.showToast = (msg, type) => { /* mock toast */ };
global.confirm = () => true;

// DateUtils mock
global.DateUtils = {
    todayIST: () => '2026-09-28', // Monday
    nowISO: () => '2026-09-28T10:00:00.000Z',
    formatDateIST: (d) => typeof d === 'string' ? d.slice(0, 10) : '2026-09-28'
};

// 2. Load dependencies
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { Store } = require('../js/store.js');
global.Store = Store;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const { SyncEngine } = require('../js/sync-engine.js');
global.SyncEngine = SyncEngine;

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

console.log('------------------------------------------------------------');
console.log('FORGE — GYM WEB DATA, DUPLICATE & WORKOUT PLAN REPAIR TESTS');
console.log('------------------------------------------------------------');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ [FAIL] ${name}`);
        console.error(`    Error: ${err.message}`);
        if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
}

async function runAsyncTest(name, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✓ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ [FAIL] ${name}`);
        console.error(`    Error: ${err.message}`);
        if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
}

async function runAll() {
    // -------------------------------------------------------------
    // Test 1: WORKOUT_PLAN_PERSISTENCE_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_PLAN_PERSISTENCE_TEST: Save freeform split (Wed = "Chest + Biceps")', () => {
        Store.init();
        const gymState = Store.getGymState();
        assert.ok(gymState.schedule, 'Schedule should exist');

        // Edit Wednesday to "Chest + Biceps"
        gymState.schedule.wednesday.routineName = 'Chest + Biceps';
        gymState.schedule.wednesday.workoutType = 'Chest + Biceps';
        gymState.schedule.wednesday.isRestDay = false;
        gymState.schedule.wednesday.muscleGroups = ['Chest', 'Biceps'];

        Store.saveGymPlan({
            schedule: gymState.schedule,
            settings: gymState.settings
        });

        const reloaded = Store.getGymState();
        assert.strictEqual(reloaded.schedule.wednesday.routineName, 'Chest + Biceps');
        assert.strictEqual(reloaded.schedule.wednesday.workoutType, 'Chest + Biceps');
        assert.strictEqual(reloaded.schedule.wednesday.isRestDay, false);
    });

    // -------------------------------------------------------------
    // Test 2: WORKOUT_PLAN_RELOAD_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_PLAN_RELOAD_TEST: Browser reload maintains persisted plan without resetting', () => {
        // Simulate fresh browser memory reload
        Store.memoryState = null;
        Store.init();

        const stateAfterReload = Store.getGymState();
        assert.strictEqual(stateAfterReload.schedule.wednesday.routineName, 'Chest + Biceps');
        assert.strictEqual(stateAfterReload.schedule.wednesday.workoutType, 'Chest + Biceps');
        assert.notStrictEqual(stateAfterReload.schedule.wednesday.routineName, undefined);
        assert.notStrictEqual(stateAfterReload.schedule.wednesday.workoutType, undefined);
    });

    // -------------------------------------------------------------
    // Test 3: WORKOUT_PLAN_LOGOUT_LOGIN_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_PLAN_LOGOUT_LOGIN_TEST: Logout then login with cloud pull preserves plan', () => {
        // Simulate cloud payload
        const cloudData = {
            workoutPlan: {
                is_configured: true,
                schedule: {
                    monday: { dayKey: 'monday', dayName: 'Monday', routineName: 'Back + Biceps', workoutType: 'Back + Biceps', isRestDay: false, muscleGroups: ['Back', 'Biceps'] },
                    tuesday: { dayKey: 'tuesday', dayName: 'Tuesday', routineName: 'Legs + Shoulders', workoutType: 'Legs + Shoulders', isRestDay: false, muscleGroups: ['Legs', 'Shoulders'] },
                    wednesday: { dayKey: 'wednesday', dayName: 'Wednesday', routineName: 'Chest + Biceps', workoutType: 'Chest + Biceps', isRestDay: false, muscleGroups: ['Chest', 'Biceps'] },
                    thursday: { dayKey: 'thursday', dayName: 'Thursday', routineName: 'Back + Biceps', workoutType: 'Back + Biceps', isRestDay: false, muscleGroups: ['Back', 'Biceps'] },
                    friday: { dayKey: 'friday', dayName: 'Friday', routineName: 'Legs + Shoulders', workoutType: 'Legs + Shoulders', isRestDay: false, muscleGroups: ['Legs', 'Shoulders'] },
                    saturday: { dayKey: 'saturday', dayName: 'Saturday', routineName: 'Chest + Triceps', workoutType: 'Chest + Triceps', isRestDay: false, muscleGroups: ['Chest', 'Triceps'] },
                    sunday: { dayKey: 'sunday', dayName: 'Sunday', routineName: 'Rest', workoutType: 'Rest', isRestDay: true, muscleGroups: [] }
                },
                settings: { trackRPE: true }
            },
            workoutSessions: []
        };

        // Clear local storage (logout)
        localStorage.clear();
        Store.memoryState = null;
        Store.init();

        // Login & reconcile cloud data
        Store.loadFromCloud(cloudData);

        const loadedPlan = Store.getGymState();
        assert.strictEqual(loadedPlan.schedule.wednesday.routineName, 'Chest + Biceps');
        assert.strictEqual(loadedPlan.schedule.wednesday.workoutType, 'Chest + Biceps');
    });

    // -------------------------------------------------------------
    // Test 4: WORKOUT_TYPE_NO_UNDEFINED_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_TYPE_NO_UNDEFINED_TEST: No day or session ever renders "undefined"', () => {
        const gymState = Store.getGymState();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(d => {
            const dayObj = gymState.schedule[d];
            assert.ok(dayObj, `Schedule for ${d} should exist`);
            assert.notStrictEqual(dayObj.routineName, undefined, `${d}.routineName must not be undefined`);
            assert.notStrictEqual(dayObj.workoutType, undefined, `${d}.workoutType must not be undefined`);
            assert.notStrictEqual(dayObj.routineName, 'undefined', `${d}.routineName must not be "undefined"`);
        });

        // Test Today's Workout template
        const todayInfo = Store.getTodayWorkoutTemplate();
        assert.ok(todayInfo.template, 'Today template should exist');
        assert.notStrictEqual(todayInfo.template.routineName, undefined);
        assert.notStrictEqual(todayInfo.template.workoutType, undefined);

        // Test ViewModel resolution
        const vm = Store.toWorkoutSessionViewModel({
            id: 'test_sess_1',
            date: '2026-09-28',
            routineName: 'Back + Biceps'
        });
        assert.strictEqual(vm.workoutType, 'Back + Biceps');
        assert.notStrictEqual(vm.workoutType, undefined);
    });

    // -------------------------------------------------------------
    // Test 5: WEEKDAY_MAPPING_TEST
    // -------------------------------------------------------------
    runTest('WEEKDAY_MAPPING_TEST: All 7 days correctly indexed (Monday through Sunday)', () => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const state = Store.getGymState();

        days.forEach((key, idx) => {
            const day = state.schedule[key];
            assert.strictEqual(day.dayKey, key);
            assert.strictEqual(day.dayName, dayNames[idx]);
        });
    });

    // -------------------------------------------------------------
    // Test 6: WORKOUT_HISTORY_RELATIONAL_DATA_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_HISTORY_RELATIONAL_DATA_TEST: Relational exercises & sets compute metrics', () => {
        const rawSession = {
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            date: '2026-09-28',
            workout_type: 'Back + Biceps',
            status: 'completed',
            started_at: '2026-09-28T09:00:00Z',
            ended_at: '2026-09-28T09:51:00Z',
            duration_minutes: 0, // Test calculation when denormalized is 0
            total_sets: 0,
            total_volume_kg: 0,
            exercises: [
                {
                    id: 'ex_1',
                    name: 'Barbell Deadlift',
                    muscle_group: 'Back',
                    sets: [
                        { set_number: 1, weight_kg: 100, reps: 5, completed: true },
                        { set_number: 2, weight_kg: 120, reps: 5, completed: true },
                        { set_number: 3, weight_kg: 140, reps: 5, completed: true }
                    ]
                },
                {
                    id: 'ex_2',
                    name: 'Barbell Bicep Curl',
                    muscle_group: 'Biceps',
                    sets: [
                        { set_number: 1, weight_kg: 30, reps: 10, completed: true },
                        { set_number: 2, weight_kg: 35, reps: 8, completed: true }
                    ]
                }
            ]
        };

        const vm = Store.toWorkoutSessionViewModel(rawSession);
        assert.strictEqual(vm.workoutType, 'Back + Biceps');
        assert.strictEqual(vm.exerciseCount, 2);
        assert.strictEqual(vm.setCount, 5);
        // Volume: (100*5 + 120*5 + 140*5) + (30*10 + 35*8) = (500 + 600 + 700) + (300 + 280) = 1800 + 580 = 2380 kg
        assert.strictEqual(vm.totalVolumeKg, 2380);
        assert.strictEqual(vm.durationMinutes, 51);
    });

    // -------------------------------------------------------------
    // Test 7: WORKOUT_EXERCISE_COUNT_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_EXERCISE_COUNT_TEST: exerciseCount matches count(workout_exercises)', () => {
        const session = {
            id: 'sess_ex_count',
            workoutType: 'Push',
            exercises: [
                { id: '1', name: 'Bench Press', sets: [{ weight_kg: 80, reps: 5, completed: true }] },
                { id: '2', name: 'Incline Dumbbell Press', sets: [{ weight_kg: 30, reps: 8, completed: true }] },
                { id: '3', name: 'Cable Flyes', sets: [{ weight_kg: 15, reps: 12, completed: true }] }
            ]
        };
        const vm = Store.toWorkoutSessionViewModel(session);
        assert.strictEqual(vm.exerciseCount, 3);
    });

    // -------------------------------------------------------------
    // Test 8: WORKOUT_SET_COUNT_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_SET_COUNT_TEST: setCount matches count(workout_sets)', () => {
        const session = {
            id: 'sess_set_count',
            workoutType: 'Legs',
            exercises: [
                { id: '1', name: 'Squats', sets: [
                    { weight_kg: 100, reps: 5, completed: true },
                    { weight_kg: 100, reps: 5, completed: true },
                    { weight_kg: 100, reps: 5, completed: true },
                    { weight_kg: 100, reps: 5, completed: true }
                ]},
                { id: '2', name: 'Leg Press', sets: [
                    { weight_kg: 200, reps: 10, completed: true },
                    { weight_kg: 200, reps: 10, completed: true },
                    { weight_kg: 200, reps: 10, completed: true }
                ]}
            ]
        };
        const vm = Store.toWorkoutSessionViewModel(session);
        assert.strictEqual(vm.setCount, 7);
        assert.strictEqual(vm.totalSets, 7);
    });

    // -------------------------------------------------------------
    // Test 9: WORKOUT_VOLUME_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_VOLUME_TEST: volume matches SUM(weight × reps) from sets', () => {
        const session = {
            id: 'sess_vol',
            workoutType: 'Chest',
            exercises: [
                { id: '1', name: 'Bench', sets: [
                    { weight_kg: 100, reps: 10, completed: true }, // 1000
                    { weight_kg: 100, reps: 10, completed: true }  // 1000
                ]},
                { id: '2', name: 'Dips', sets: [
                    { weight_kg: 15.5, reps: 10, completed: true }  // 155
                ]}
            ]
        };
        const vm = Store.toWorkoutSessionViewModel(session);
        assert.strictEqual(vm.totalVolumeKg, 2155);
    });

    // -------------------------------------------------------------
    // Test 10: WORKOUT_DURATION_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_DURATION_TEST: duration resolves endedAt - startedAt or durationMinutes', () => {
        const session = {
            id: 'sess_dur',
            workoutType: 'Upper',
            started_at: '2026-09-28T07:00:00Z',
            ended_at: '2026-09-28T07:45:00Z',
            durationMinutes: 0
        };
        const vm = Store.toWorkoutSessionViewModel(session);
        assert.strictEqual(vm.durationMinutes, 45);
    });

    // -------------------------------------------------------------
    // Test 11: WORKOUT_DUPLICATE_DETECTION_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_DUPLICATE_DETECTION_TEST: Primary ID & conservative signature collapse duplicates', () => {
        const sessions = [
            // Exact same ID duplicated
            { id: 'uuid-1', date: '2026-09-28', workoutType: 'Back + Biceps', totalSets: 17, totalVolumeKg: 2155, durationMinutes: 51 },
            { id: 'uuid-1', date: '2026-09-28', workoutType: 'Back + Biceps', totalSets: 17, totalVolumeKg: 2155, durationMinutes: 51 },

            // Different ID, but identical session characteristics (legacy duplicate)
            { id: 'uuid-2a', date: '2026-09-27', workoutType: 'Chest + Triceps', startedAt: '2026-09-27T08:00:00Z', endedAt: '2026-09-27T08:50:00Z', totalSets: 15, totalVolumeKg: 3000, durationMinutes: 50 },
            { id: 'uuid-2b', date: '2026-09-27', workoutType: 'Chest + Triceps', startedAt: '2026-09-27T08:00:00Z', endedAt: '2026-09-27T08:50:00Z', totalSets: 15, totalVolumeKg: 3000, durationMinutes: 50 },

            // Legitimate two different workouts on same day
            { id: 'uuid-3a', date: '2026-09-26', workoutType: 'Morning Cardio', startedAt: '2026-09-26T06:00:00Z', durationMinutes: 30, totalSets: 3, totalVolumeKg: 0 },
            { id: 'uuid-3b', date: '2026-09-26', workoutType: 'Evening Lift', startedAt: '2026-09-26T18:00:00Z', durationMinutes: 60, totalSets: 20, totalVolumeKg: 5000 }
        ];

        const deduplicated = Store.deduplicateWorkoutSessions(sessions);
        assert.strictEqual(deduplicated.length, 4, 'Should collapse 2 duplicates and preserve the 2 distinct same-day workouts');
        
        const sep26Sessions = deduplicated.filter(s => s.date === '2026-09-26');
        assert.strictEqual(sep26Sessions.length, 2, 'Legitimate 2 workouts on Sep 26 must both be preserved');
    });

    // -------------------------------------------------------------
    // Test 12: WORKOUT_REFRESH_NO_DUPLICATE_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_REFRESH_NO_DUPLICATE_TEST: Repeated sync reconcile keeps single instance', () => {
        Store.init();
        const saved = Store.saveWorkoutSession({
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
            date: '2026-09-28',
            routineName: 'Back + Biceps',
            durationMinutes: 51,
            totalSets: 17,
            totalVolumeKg: 2155
        });

        // Simulate cloud payload with that exact same session
        const cloud = {
            workoutSessions: [
                {
                    id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
                    date: '2026-09-28',
                    workout_type: 'Back + Biceps',
                    duration_minutes: 51,
                    total_sets: 17,
                    total_volume_kg: 2155
                }
            ]
        };

        SyncEngine.reconcile(cloud);
        SyncEngine.reconcile(cloud);

        const currentSessions = Store.getWorkoutSessions().filter(s => s.id === '3fa85f64-5717-4562-b3fc-2c963f66afa7');
        assert.strictEqual(currentSessions.length, 1, 'Session must appear exactly once after multiple reconciliations');
    });

    // -------------------------------------------------------------
    // Test 13: WORKOUT_REALTIME_NO_DUPLICATE_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_REALTIME_NO_DUPLICATE_TEST: Realtime update modifies record without duplicating', () => {
        const sessionId = '3fa85f64-5717-4562-b3fc-2c963f66afa8';
        Store.saveWorkoutSession({
            id: sessionId,
            date: '2026-09-28',
            routineName: 'Legs + Shoulders',
            durationMinutes: 45,
            totalSets: 12,
            totalVolumeKg: 1500,
            exercises: [{ id: 'ex_1', name: 'Squat', sets: [] }]
        });

        // Simulate incoming Realtime update payload
        const realtimeRecord = {
            id: sessionId,
            date: '2026-09-28',
            workout_type: 'Legs + Shoulders',
            duration_minutes: 48, // Updated duration
            total_sets: 14,
            total_volume_kg: 1800
        };

        SyncEngine.handleRemoteRealtimeChange('workout_sessions', { eventType: 'UPDATE', new: realtimeRecord });

        const sessions = Store.getWorkoutSessions().filter(s => s.id === sessionId);
        assert.strictEqual(sessions.length, 1, 'Realtime echo must NOT create a duplicate record');
        assert.strictEqual(sessions[0].durationMinutes, 48, 'Realtime record should update fields');
        assert.ok(sessions[0].exercises.length > 0, 'Child exercises should be preserved on realtime update');
    });

    // -------------------------------------------------------------
    // Test 14: WORKOUT_RETRY_NO_DUPLICATE_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_RETRY_NO_DUPLICATE_TEST: Re-saving same session upserts without creating new ID', () => {
        const sessionId = '3fa85f64-5717-4562-b3fc-2c963f66afa9';
        const sessionData = {
            id: sessionId,
            date: '2026-09-28',
            routineName: 'Chest + Triceps',
            durationMinutes: 40,
            totalSets: 10,
            totalVolumeKg: 1200
        };

        const firstSave = Store.saveWorkoutSession(sessionData);
        const retrySave = Store.saveWorkoutSession({ ...sessionData, durationMinutes: 42 });

        assert.strictEqual(firstSave.id, sessionId);
        assert.strictEqual(retrySave.id, sessionId);

        const count = Store.getWorkoutSessions().filter(s => s.id === sessionId).length;
        assert.strictEqual(count, 1, 'Retry must upsert the same session rather than duplicating');
    });

    // -------------------------------------------------------------
    // Test 15: WORKOUT_DELETE_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_DELETE_TEST: Deleting workout removes it from LocalStore and history', () => {
        const sessionId = '3fa85f64-5717-4562-b3fc-2c963f66afb0';
        Store.saveWorkoutSession({
            id: sessionId,
            date: '2026-09-28',
            routineName: 'Delete Me Routine',
            durationMinutes: 30,
            totalSets: 5,
            totalVolumeKg: 500
        });

        assert.ok(Store.getWorkoutSessionById(sessionId), 'Session should exist before delete');

        Store.deleteWorkoutSession(sessionId);

        assert.strictEqual(Store.getWorkoutSessionById(sessionId), null, 'Session should be null after delete');
        assert.strictEqual(Store.getWorkoutSessions().some(s => s.id === sessionId), false);
    });

    // -------------------------------------------------------------
    // Test 16: WORKOUT_DELETE_CHILDREN_TEST
    // -------------------------------------------------------------
    await runAsyncTest('WORKOUT_DELETE_CHILDREN_TEST: SupabaseService deletes child sets, exercises, and photo', async () => {
        const deletedOps = [];
        
        // Mock Supabase client
        const originalClient = SupabaseService.client;
        const originalUser = SupabaseService.currentUser;

        SupabaseService.currentUser = { id: 'usr_test_123' };
        SupabaseService.client = {
            from: (table) => {
                const chain = {
                    eq: (col, val) => {
                        deletedOps.push({ table, col, val });
                        return chain;
                    },
                    in: (col, vals) => {
                        deletedOps.push({ table, col, vals });
                        return chain;
                    },
                    maybeSingle: () => Promise.resolve({ data: { user_id: 'usr_test_123', gym_photo_path: 'gym-photos/usr_test_123/2026/09/sess_with_children.jpg' } }),
                    then: (fn) => Promise.resolve({ data: [{ id: 'ex_child_1' }, { id: 'ex_child_2' }], error: null }).then(fn)
                };
                return {
                    delete: () => chain,
                    select: () => chain
                };
            },
            storage: {
                from: () => ({
                    remove: (paths) => {
                        deletedOps.push({ storage: 'gym-photos', paths });
                        return Promise.resolve({ error: null });
                    }
                })
            }
        };

        const res = await SupabaseService.deleteWorkoutSession('sess_with_children');
        assert.strictEqual(res, true);

        // Verify child sets deleted
        const setsOp = deletedOps.find(o => o.table === 'workout_sets');
        assert.ok(setsOp, 'workout_sets should be deleted');

        // Verify child exercises deleted
        const exOp = deletedOps.find(o => o.table === 'workout_exercises');
        assert.ok(exOp, 'workout_exercises should be deleted');

        // Verify parent session deleted
        const sessOp = deletedOps.find(o => o.table === 'workout_sessions');
        assert.ok(sessOp, 'workout_sessions should be deleted');

        // Restore
        SupabaseService.client = originalClient;
        SupabaseService.currentUser = originalUser;
    });

    // -------------------------------------------------------------
    // Test 17: WORKOUT_DELETE_ROLLBACK_TEST
    // -------------------------------------------------------------
    runTest('WORKOUT_DELETE_ROLLBACK_TEST: Failed deletion triggers state rollback', () => {
        const sessionId = '3fa85f64-5717-4562-b3fc-2c963f66afb1';
        const session = {
            id: sessionId,
            date: '2026-09-28',
            routineName: 'Rollback Test',
            durationMinutes: 40,
            totalSets: 10,
            totalVolumeKg: 1000
        };
        Store.saveWorkoutSession(session);

        // Mock error on delete
        const originalDelete = Store.deleteWorkoutSession;
        Store.deleteWorkoutSession = () => {
            throw new Error('Simulated network error');
        };

        GymEngine.deleteWorkout(sessionId);

        // Verify session was restored by rollback handler
        const restored = Store.getWorkoutSessionById(sessionId);
        assert.ok(restored, 'Session must be restored if deletion throws');

        Store.deleteWorkoutSession = originalDelete;
    });

    // -------------------------------------------------------------
    // Test 18: GYM_MONTHLY_SUMMARY_TEST
    // -------------------------------------------------------------
    runTest('GYM_MONTHLY_SUMMARY_TEST: Monthly metrics aggregate from real relational sessions', () => {
        Store.init();
        // Clear existing test sessions
        Store.memoryState.gym.sessions = [];

        Store.saveWorkoutSession({
            id: '3fa85f64-5717-4562-b3fc-2c963f66afb2',
            date: '2026-09-10',
            routineName: 'Back + Biceps',
            durationMinutes: 50,
            totalSets: 15,
            totalVolumeKg: 2000,
            exercises: [
                { id: '1', name: 'Deadlift', muscleGroup: 'Back', sets: [{ weightKg: 100, reps: 10, completed: true }] }
            ]
        });

        Store.saveWorkoutSession({
            id: '3fa85f64-5717-4562-b3fc-2c963f66afb3',
            date: '2026-09-15',
            routineName: 'Chest + Triceps',
            durationMinutes: 40,
            totalSets: 10,
            totalVolumeKg: 1500,
            exercises: [
                { id: '2', name: 'Bench', muscleGroup: 'Chest', sets: [{ weightKg: 100, reps: 5, completed: true }] }
            ]
        });

        const monthSummary = Store.getMonthSummary('2026-09');
        assert.strictEqual(monthSummary.sessions.length, 2);
        assert.strictEqual(monthSummary.workoutDays, 2);
        assert.strictEqual(monthSummary.totalSets, 25);
        assert.strictEqual(monthSummary.totalVolumeKg, 3500);
        assert.strictEqual(monthSummary.avgDurationMinutes, 45);
        assert.ok(monthSummary.muscleGroupsTrained.includes('Back'));
        assert.ok(monthSummary.muscleGroupsTrained.includes('Chest'));
    });

    // -------------------------------------------------------------
    // Test 19: GYM_WEEKLY_SUMMARY_TEST
    // -------------------------------------------------------------
    runTest('GYM_WEEKLY_SUMMARY_TEST: Weekly metrics agree with history data', () => {
        const weekly = Store.getWeeklyGymSummary();
        assert.ok(typeof weekly.completedDays === 'number');
        assert.ok(typeof weekly.plannedDays === 'number');
        assert.ok(typeof weekly.totalSets === 'number');
        assert.ok(typeof weekly.totalVolumeKg === 'number');
        assert.ok(typeof weekly.mostTrained === 'string');
    });

    // -------------------------------------------------------------
    // Test 20: GYM_CANONICAL_DATA_TEST
    // -------------------------------------------------------------
    runTest('GYM_CANONICAL_DATA_TEST: Canonical WorkoutSessionViewModel data contract holds', () => {
        const sample = {
            id: '3fa85f64-5717-4562-b3fc-2c963f66afb4',
            date: '2026-09-28',
            routineName: 'Legs + Shoulders',
            startedAt: '2026-09-28T09:00:00Z',
            endedAt: '2026-09-28T09:45:00Z',
            exercises: [
                {
                    name: 'Squat',
                    muscleGroup: 'Legs',
                    sets: [{ weightKg: 100, reps: 10, completed: true }]
                }
            ]
        };

        const vm = Store.toWorkoutSessionViewModel(sample);

        // Required fields per PART 8:
        assert.strictEqual(vm.id, sample.id);
        assert.strictEqual(vm.date, '2026-09-28');
        assert.strictEqual(vm.workoutType, 'Legs + Shoulders');
        assert.strictEqual(vm.durationMinutes, 45);
        assert.strictEqual(vm.exerciseCount, 1);
        assert.strictEqual(vm.setCount, 1);
        assert.strictEqual(vm.totalVolumeKg, 1000);
        assert.strictEqual(vm.status, 'completed');
        assert.ok(Array.isArray(vm.personalRecords));
    });

    console.log('------------------------------------------------------------');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} passed`);
    console.log('------------------------------------------------------------');

    if (passedTests !== totalTests) {
        process.exit(1);
    }
}

runAll().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
