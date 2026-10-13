/**
 * FORGE WEB — Regression Test Suite for Last Exercise Performance History Lookup
 * Verifies that each exercise's Last Performance lookup correctly identifies the most recent
 * valid, previously recorded workout containing that exercise, excluding the current active workout,
 * matching canonical IDs and exact fallback names, formatting RPE, and enforcing user isolation.
 */

const assert = require('assert');

// 1. Mock Browser Environment
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, val) {
        this.store[key] = String(val);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.classList = {
            classes: new Set(),
            add: (c) => this.classList.classes.add(c),
            remove: (c) => this.classList.classes.delete(c),
            contains: (c) => this.classList.classes.has(c)
        };
        this.innerHTML = '';
        this.style = {};
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
global.showToast = () => {};
global.confirm = () => true;

// 2. Load dependencies
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { Store } = require('../js/store.js');
global.Store = Store;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

console.log('================================================================');
console.log('FORGE WEB — LAST EXERCISE PERFORMANCE REGRESSION TEST SUITE');
console.log('================================================================');

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

// -----------------------------------------------------------------------------
// Test 1: Exercise performed on 9 Oct and again on 13 Oct displays 9 Oct
// -----------------------------------------------------------------------------
runTest('1. Oct 9 & Oct 13: Exercise displays Oct 9 as previous performance with accurate sets & RPE', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                // Oct 13 workout (Legs + Shoulders)
                {
                    id: 'sess_oct_13',
                    date: '2026-10-13',
                    routineName: 'Legs + Shoulders',
                    status: 'completed',
                    exercises: [
                        {
                            id: 'we_oct13_sh_press',
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            muscleGroup: 'Shoulders',
                            sets: [
                                { setNumber: 1, weightKg: 60, reps: 10, rpe: 8, completed: true },
                                { setNumber: 2, weightKg: 65, reps: 8, rpe: 8.5, completed: true }
                            ]
                        }
                    ]
                },
                // Oct 9 workout (Legs + Shoulders)
                {
                    id: 'sess_oct_09',
                    date: '2026-10-09',
                    routineName: 'Legs + Shoulders',
                    status: 'completed',
                    exercises: [
                        {
                            id: 'we_oct09_sh_press',
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            muscleGroup: 'Shoulders',
                            sets: [
                                { setNumber: 1, weightKg: 50, reps: 12, rpe: 7.5, completed: true },
                                { setNumber: 2, weightKg: 55, reps: 10, rpe: 8, completed: true },
                                { setNumber: 3, weightKg: 60, reps: 8, rpe: 9, completed: true }
                            ]
                        }
                    ]
                },
                // Older Sep workout
                {
                    id: 'sess_sep_25',
                    date: '2026-09-25',
                    routineName: 'Legs + Shoulders',
                    status: 'completed',
                    exercises: [
                        {
                            id: 'we_sep25_sh_press',
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            muscleGroup: 'Shoulders',
                            sets: [
                                { setNumber: 1, weightKg: 40, reps: 12, rpe: 7, completed: true }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    // When inspecting Machine Shoulder Press with Oct 13 excluded (as the current active workout)
    GymEngine.liveWorkout = { id: 'sess_oct_13', date: '2026-10-13', routineName: 'Legs + Shoulders' };
    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(perf.hasHistory, true, 'Should find history');
    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'Last performed date must be Oct 9, not Sep 25 or Oct 13');
    assert.strictEqual(perf.lastSessionDate, '2026-10-09');
    assert.strictEqual(perf.sets.length, 3, 'Should have 3 sets from Oct 9');
    assert.strictEqual(perf.sets[0].weightKg, 50);
    assert.strictEqual(perf.sets[0].reps, 12);
    assert.strictEqual(perf.sets[0].rpe, 7.5);
    assert.strictEqual(perf.sets[2].weightKg, 60);
    assert.strictEqual(perf.sets[2].reps, 8);
    assert.strictEqual(perf.sets[2].rpe, 9);
    assert.strictEqual(perf.setLines[0], 'Set 1 — 50 kg × 12 reps @ RPE 7.5');
    assert.strictEqual(perf.setLines[2], 'Set 3 — 60 kg × 8 reps @ RPE 9');
});

// -----------------------------------------------------------------------------
// Test 2: Newer unrelated workout does not replace the actual last performance
// -----------------------------------------------------------------------------
runTest('2. Newer unrelated workout does not replace the exercise actual last performance', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                // Oct 11 workout: Chest + Triceps (Machine Shoulder Press was NOT performed)
                {
                    id: 'sess_oct_11',
                    date: '2026-10-11',
                    routineName: 'Chest + Triceps',
                    status: 'completed',
                    exercises: [
                        {
                            id: 'we_bench',
                            exerciseId: 'ex_ch_1',
                            name: 'Barbell Bench Press',
                            sets: [{ setNumber: 1, weightKg: 80, reps: 8, completed: true }]
                        }
                    ]
                },
                // Oct 9 workout: Legs + Shoulders (Machine Shoulder Press WAS performed)
                {
                    id: 'sess_oct_09',
                    date: '2026-10-09',
                    routineName: 'Legs + Shoulders',
                    status: 'completed',
                    exercises: [
                        {
                            id: 'we_oct09_sh_press',
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 55, reps: 10, rpe: 8, completed: true }]
                        }
                    ]
                }
            ]
        }
    };

    GymEngine.liveWorkout = null;
    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(perf.hasHistory, true);
    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'Should skip Oct 11 and select Oct 9');
    assert.strictEqual(perf.sets[0].weightKg, 55);
});

// -----------------------------------------------------------------------------
// Test 3: Multiple historical sessions select the newest matching session
// -----------------------------------------------------------------------------
runTest('3. Multiple historical sessions select the newest matching session regardless of array order', () => {
    const s1 = {
        id: 'sess_1',
        date: '2026-09-01',
        status: 'completed',
        exercises: [{ exerciseId: 'ex_sh_4', name: 'Machine Shoulder Press', sets: [{ setNumber: 1, weightKg: 30, reps: 10 }] }]
    };
    const s2 = {
        id: 'sess_2',
        date: '2026-09-15',
        status: 'completed',
        exercises: [{ exerciseId: 'ex_sh_4', name: 'Machine Shoulder Press', sets: [{ setNumber: 1, weightKg: 35, reps: 10 }] }]
    };
    const s3 = {
        id: 'sess_3',
        date: '2026-10-05',
        status: 'completed',
        exercises: [{ exerciseId: 'ex_sh_4', name: 'Machine Shoulder Press', sets: [{ setNumber: 1, weightKg: 45, reps: 10 }] }]
    };
    const s4 = {
        id: 'sess_4',
        date: '2026-10-09',
        status: 'completed',
        exercises: [{ exerciseId: 'ex_sh_4', name: 'Machine Shoulder Press', sets: [{ setNumber: 1, weightKg: 50, reps: 10 }] }]
    };

    // Array deliberately ordered oldest-first (ascending)
    Store.memoryState = { gym: { isConfigured: true, sessions: [s1, s2, s3, s4] } };
    let perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');
    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'Ascending input must select Oct 9');
    assert.strictEqual(perf.sets[0].weightKg, 50);

    // Array ordered newest-first (descending, as in Supabase/Store)
    Store.memoryState = { gym: { isConfigured: true, sessions: [s4, s3, s2, s1] } };
    perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');
    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'Descending input must select Oct 9');
    assert.strictEqual(perf.sets[0].weightKg, 50);

    // Array shuffled
    Store.memoryState = { gym: { isConfigured: true, sessions: [s2, s4, s1, s3] } };
    perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');
    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'Shuffled input must select Oct 9');
    assert.strictEqual(perf.sets[0].weightKg, 50);
});

// -----------------------------------------------------------------------------
// Test 4: Current active session is excluded
// -----------------------------------------------------------------------------
runTest('4. Current active session is excluded from last performance lookup', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                {
                    id: 'active_workout_13',
                    date: '2026-10-13',
                    status: 'in_progress',
                    exercises: [
                        {
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 70, reps: 5, completed: true }]
                        }
                    ]
                },
                {
                    id: 'prior_workout_09',
                    date: '2026-10-09',
                    status: 'completed',
                    exercises: [
                        {
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 50, reps: 10, completed: true }]
                        }
                    ]
                }
            ]
        }
    };

    GymEngine.liveWorkout = { id: 'active_workout_13', date: '2026-10-13' };
    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'Active session must be excluded');
    assert.strictEqual(perf.sets[0].weightKg, 50, 'Sets must come from Oct 9, not the active session');
});

// -----------------------------------------------------------------------------
// Test 5: Different exercises with similar names are not incorrectly matched
// -----------------------------------------------------------------------------
runTest('5. Different exercises with similar names are strictly isolated', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                {
                    id: 'sess_smith_sh',
                    date: '2026-10-10',
                    status: 'completed',
                    exercises: [
                        {
                            exerciseId: 'ex_sh_5',
                            name: 'Smith Machine Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 65, reps: 8, completed: true }]
                        }
                    ]
                },
                {
                    id: 'sess_db_sh',
                    date: '2026-10-08',
                    status: 'completed',
                    exercises: [
                        {
                            exerciseId: 'ex_sh_2',
                            name: 'Dumbbell Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 24, reps: 10, completed: true }]
                        }
                    ]
                },
                {
                    id: 'sess_mach_sh',
                    date: '2026-10-06',
                    status: 'completed',
                    exercises: [
                        {
                            exerciseId: 'ex_sh_4',
                            name: 'Machine Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 45, reps: 12, completed: true }]
                        }
                    ]
                }
            ]
        }
    };

    GymEngine.liveWorkout = null;
    // Look up "Machine Shoulder Press"
    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');
    assert.strictEqual(perf.lastPerformedDate, '2026-10-06', 'Machine Shoulder Press must not match Smith Machine or DB');
    assert.strictEqual(perf.sets[0].weightKg, 45);

    // Look up "Smith Machine Shoulder Press"
    const perfSmith = GymEngine.getExercisePerformanceDetails('Smith Machine Shoulder Press', 'ex_sh_5');
    assert.strictEqual(perfSmith.lastPerformedDate, '2026-10-10');
    assert.strictEqual(perfSmith.sets[0].weightKg, 65);
});

// -----------------------------------------------------------------------------
// Test 6: Legacy records without canonical exercise IDs are handled safely
// -----------------------------------------------------------------------------
runTest('6. Legacy records without canonical exercise IDs are matched safely by exact name', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                {
                    id: 'sess_legacy_oct_09',
                    date: '2026-10-09',
                    status: 'completed',
                    exercises: [
                        // Legacy record: missing exerciseId, only name
                        {
                            name: 'Machine Shoulder Press',
                            sets: [{ setNumber: 1, weightKg: 55, reps: 10, completed: true }]
                        }
                    ]
                }
            ]
        }
    };

    GymEngine.liveWorkout = null;
    // Querying with canonical ID should match legacy record by fallback exact name
    const perfWithId = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');
    assert.strictEqual(perfWithId.hasHistory, true, 'Legacy record should be found');
    assert.strictEqual(perfWithId.lastPerformedDate, '2026-10-09');
    assert.strictEqual(perfWithId.sets[0].weightKg, 55);

    // Similar name in legacy should NOT match
    Store.memoryState.gym.sessions[0].exercises[0].name = 'Smith Machine Shoulder Press';
    const perfMismatch = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');
    assert.strictEqual(perfMismatch.hasHistory, false, 'Smith Machine in legacy must not match Machine Shoulder Press');
});

// -----------------------------------------------------------------------------
// Test 7: Missing history produces the correct empty state
// -----------------------------------------------------------------------------
runTest('7. Missing history produces the exact required empty state without undefined or NaN', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: []
        }
    };

    GymEngine.liveWorkout = null;
    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(perf.hasHistory, false);
    assert.strictEqual(perf.lastPerformedFormatted, 'No previous performance recorded.');
    assert.strictEqual(perf.previousSetsText, 'No previous performance recorded.');
    assert.strictEqual(perf.previousBestSetFormatted, 'No previous set recorded.');
    assert.strictEqual(perf.lastSessionDate, null);
    assert.strictEqual(perf.lastPerformedDate, null);
    assert.deepStrictEqual(perf.sets, []);
    assert.ok(!JSON.stringify(perf).includes('undefined'), 'Must not contain undefined string');
    assert.ok(!JSON.stringify(perf).includes('NaN'), 'Must not contain NaN');
});

// -----------------------------------------------------------------------------
// Test 8: Date boundaries, session status, caching, and synchronization
// -----------------------------------------------------------------------------
runTest('8. Case-insensitive session status, invalid/deleted exclusions, and same-day timestamps', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                // Deleted workout
                {
                    id: 'sess_del',
                    date: '2026-10-12',
                    status: 'completed',
                    isDeleted: true,
                    exercises: [{ exerciseId: 'ex_sh_4', sets: [{ setNumber: 1, weightKg: 100, reps: 10 }] }]
                },
                // Abandoned workout
                {
                    id: 'sess_abandoned',
                    date: '2026-10-11',
                    status: 'abandoned',
                    exercises: [{ exerciseId: 'ex_sh_4', sets: [{ setNumber: 1, weightKg: 95, reps: 10 }] }]
                },
                // Uppercase status COMPLETED on Oct 10 (earlier in the day)
                {
                    id: 'sess_oct10_morning',
                    date: '2026-10-10',
                    startedAt: '2026-10-10T08:00:00.000Z',
                    status: 'COMPLETED',
                    exercises: [{ exerciseId: 'ex_sh_4', sets: [{ setNumber: 1, weightKg: 50, reps: 10 }] }]
                },
                // Uppercase status COMPLETED on Oct 10 (later in the day - evening workout)
                {
                    id: 'sess_oct10_evening',
                    date: '2026-10-10',
                    startedAt: '2026-10-10T18:00:00.000Z',
                    status: 'COMPLETED',
                    exercises: [{ exerciseId: 'ex_sh_4', sets: [{ setNumber: 1, weightKg: 55, reps: 10 }] }]
                }
            ]
        }
    };

    GymEngine.liveWorkout = null;
    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(perf.hasHistory, true);
    assert.strictEqual(perf.lastPerformedDate, '2026-10-10');
    assert.strictEqual(perf.sets[0].weightKg, 55, 'Must select the later session on the same day');
});

// -----------------------------------------------------------------------------
// Test 9: Users cannot see another account's exercise history
// -----------------------------------------------------------------------------
runTest('9. Multi-user isolation prevents seeing another account history', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                // User B performed shoulder press on Oct 12
                {
                    id: 'sess_user_b',
                    userId: 'user_b_uuid',
                    date: '2026-10-12',
                    status: 'completed',
                    exercises: [{ exerciseId: 'ex_sh_4', sets: [{ setNumber: 1, weightKg: 90, reps: 10 }] }]
                },
                // User A performed shoulder press on Oct 9
                {
                    id: 'sess_user_a',
                    userId: 'user_a_uuid',
                    date: '2026-10-09',
                    status: 'completed',
                    exercises: [{ exerciseId: 'ex_sh_4', sets: [{ setNumber: 1, weightKg: 50, reps: 10 }] }]
                }
            ]
        }
    };

    // Mock active user as User A
    SupabaseService.getUserId = () => 'user_a_uuid';
    GymEngine.liveWorkout = null;

    const perf = GymEngine.getExercisePerformanceDetails('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(perf.hasHistory, true);
    assert.strictEqual(perf.lastPerformedDate, '2026-10-09', 'User A must only see their own Oct 9 workout, NOT User B Oct 12 workout');
    assert.strictEqual(perf.sets[0].weightKg, 50);
});

// -----------------------------------------------------------------------------
// Test 10: Store.getExerciseHistory respects same isolation and canonical rules
// -----------------------------------------------------------------------------
runTest('10. Store.getExerciseHistory returns correct chronological progression', () => {
    Store.memoryState = {
        gym: {
            isConfigured: true,
            sessions: [
                {
                    id: 'sess_1',
                    date: '2026-10-01',
                    status: 'completed',
                    exercises: [{ exerciseId: 'ex_sh_4', name: 'Machine Shoulder Press', sets: [{ weightKg: 40, reps: 10 }] }]
                },
                {
                    id: 'sess_2',
                    date: '2026-10-09',
                    status: 'COMPLETED',
                    exercises: [{ exerciseId: 'ex_sh_4', name: 'Machine Shoulder Press', sets: [{ weightKg: 50, reps: 8 }] }]
                }
            ]
        }
    };

    SupabaseService.getUserId = () => null;
    const history = Store.getExerciseHistory('Machine Shoulder Press', 'ex_sh_4');

    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].date, '2026-10-01');
    assert.strictEqual(history[0].maxWeight, 40);
    assert.strictEqual(history[1].date, '2026-10-09');
    assert.strictEqual(history[1].maxWeight, 50);
});

console.log('================================================================');
console.log(`RESULTS: ${passedTests} / ${totalTests} tests passed`);
console.log('================================================================');

if (passedTests !== totalTests) {
    process.exit(1);
}
