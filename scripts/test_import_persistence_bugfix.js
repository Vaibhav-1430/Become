/**
 * BOSS Study OS — Import Backup Persistence & Reconciliation Verification
 * Tests the complete Import -> Persist -> Refresh -> Auth/Reconciliation pipeline.
 *
 * Verifies:
 * 1. Import Backup -> refresh/re-hydrate -> calendar tasks preserved
 * 2. Import Backup -> logout -> login -> imported data remains
 * 3. Import Backup -> cloud is empty -> refresh -> local data preserved
 * 4. Import Backup -> cloud has older records -> refresh -> newer imported records win (LWW)
 * 5. Import Backup -> cloud has newer records -> refresh -> newer cloud records win (LWW)
 * 6. User isolation: untrusted foreign user_id in backup rewritten to current authenticated user
 */

const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

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
        this.innerHTML = '';
        this.style = {};
        this.disabled = false;
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false,
            toggle: () => {}
        };
    }
}

class MockDocument {
    constructor() { this.elements = {}; }
    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = new MockElement(id);
        }
        return this.elements[id];
    }
    querySelector() { return new MockElement(); }
    querySelectorAll() { return []; }
    createElement(tag) { return new MockElement('', tag); }
}

const mockLS = new MockLocalStorage();
const mockDoc = new MockDocument();

global.localStorage = mockLS;
global.document = mockDoc;
global.window = {
    localStorage: mockLS,
    document: mockDoc,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { reload: () => {} }
};
global.showToast = () => {};

const { DSA_A2Z_SHEET, DSA_ALL_PROBLEMS } = require('../data/dsa-a2z.js');
global.DSA_A2Z_SHEET = DSA_A2Z_SHEET;
global.DSA_ALL_PROBLEMS = DSA_ALL_PROBLEMS;

const { ScheduleEngine } = require('../data/schedule.js');
global.ScheduleEngine = ScheduleEngine;

const { Store } = require('../js/store.js');
global.Store = Store;

const { DSAEngine } = require('../js/dsa.js');
global.DSAEngine = DSAEngine;

const { TaskEngine } = require('../js/tasks.js');
global.TaskEngine = TaskEngine;

const { CalendarEngine } = require('../js/calendar.js');
global.CalendarEngine = CalendarEngine;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const { SyncEngine } = require('../js/sync-engine.js');
global.SyncEngine = SyncEngine;

const { App } = require('../app.js');
global.App = App;

async function runImportPersistenceTests() {
    console.log('================================================================');
    console.log('🚀 STUDYOS IMPORT BACKUP PERSISTENCE & RECONCILIATION VERIFICATION');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(cond, name, details = '') {
        if (cond) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${name}: ${details}`);
            failed++;
        }
    }

    const testUserId = 'auth_user_uuid_1234';
    SupabaseService.currentUser = { id: testUserId, email: 'boss@studyos.local' };
    window.currentUser = SupabaseService.currentUser;

    // -------------------------------------------------------------------------
    // TEST 1: Import Backup -> Immediate Disk Persistence -> Refresh Simulation
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: IMPORT BACKUP & REFRESH RE-HYDRATION ---');
    mockLS.clear();

    const backupData = {
        app: APP_CONFIG.APP_NAME,
        version: APP_CONFIG.VERSION,
        exportedAt: '2026-09-28T08:00:00+05:30',
        data: {
            days: {
                '2026-08-18': {
                    status: 'COMPLETED',
                    tasks: [
                        {
                            id: 'task_2026-08-18_dsa_morning',
                            title: 'DSA: Learn Basics',
                            category: 'DSA',
                            startTime: '06:45',
                            endTime: '08:15',
                            status: 'COMPLETED',
                            isStudy: true,
                            notes: 'Solved flawlessly'
                        }
                    ]
                },
                '2026-09-28': {
                    status: 'COMPLETED',
                    tasks: [
                        {
                            id: 'task_2026-09-28_dsa_morning',
                            title: 'DSA: Binary Search',
                            category: 'DSA',
                            startTime: '06:45',
                            endTime: '08:15',
                            status: 'COMPLETED',
                            isStudy: true,
                            notes: 'Upper & lower bound mastered'
                        }
                    ]
                }
            },
            dsa: {
                '1': { status: 'SOLVED', notes: 'First Problem', solvedDate: '2026-08-18' },
                '2': { status: 'SOLVED', notes: 'Second Problem', solvedDate: '2026-08-19' }
            },
            mistakes: [
                { id: 'mistake_001', question: 'Two Sum edge case', subject: 'DSA', date: '2026-09-20', resolved: false }
            ],
            internships: [
                { id: 'intern_001', company: 'Google', role: 'SWE Intern', status: 'APPLIED', dateApplied: '2026-09-25' }
            ]
        }
    };

    const importRes = await Store.importBackup(JSON.stringify(backupData));
    assert(importRes.success === true, 'Store.importBackup returned success');
    assert(Store._pendingDiskSave === false, 'Store save flushed synchronously (not deferred)');

    // Verify localStorage has valid payload immediately after import
    const rawPersisted = mockLS.getItem(APP_CONFIG.STORAGE_KEY);
    assert(rawPersisted !== null, 'Imported state written immediately to localStorage');
    const parsedPersisted = JSON.parse(rawPersisted);
    assert(parsedPersisted.days['2026-08-18'] !== undefined, 'Day 2026-08-18 persisted in localStorage');
    assert(parsedPersisted.days['2026-09-28'] !== undefined, 'Day 2026-09-28 persisted in localStorage');

    // Simulate browser refresh: re-hydrate Store from raw persisted localStorage
    Store.memoryState = {
        days: parsedPersisted.days,
        dsa: parsedPersisted.dsa,
        distractions: parsedPersisted.distractions || [],
        internships: parsedPersisted.internships || [],
        placement: parsedPersisted.placement || { achieved: false },
        settings: parsedPersisted.settings || {},
        placementHub: parsedPersisted.placementHub || {},
        development: parsedPersisted.development || { topics: {}, videos: {}, tasks: {}, projects: {} },
        studySessions: parsedPersisted.studySessions || [],
        activeStudySession: null,
        mistakes: parsedPersisted.mistakes || [],
        gym: parsedPersisted.gym || { schedule: {}, sessions: [] }
    };

    // Simulate Calendar initialization & rendering on refreshed page
    CalendarEngine.init();
    TaskEngine.ensureMonthTasks(2026, 7); // August 2026
    const augustDay = Store.getDayData('2026-08-18');
    assert(augustDay.status === 'COMPLETED', 'August 18 status preserved as COMPLETED after calendar render');
    assert(augustDay.tasks.length === 1, 'August 18 tasks count preserved as 1 (not overwritten)');
    assert(augustDay.tasks[0].status === 'COMPLETED', 'August 18 task status preserved as COMPLETED');
    assert(augustDay.tasks[0].notes === 'Solved flawlessly', 'August 18 task notes preserved');

    // Simulate Day inspection on today's date
    const todayTasks = TaskEngine.ensureDayTasks('2026-09-28');
    assert(todayTasks.length === 1, 'September 28 tasks preserved as 1');
    assert(todayTasks[0].status === 'COMPLETED', 'September 28 task status preserved as COMPLETED');
    assert(todayTasks[0].notes === 'Upper & lower bound mastered', 'September 28 task notes preserved');

    // -------------------------------------------------------------------------
    // TEST 2: Import Backup -> Cloud is Empty -> Refresh -> Local Data Preserved
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: EMPTY CLOUD DATA RECONCILIATION ---');
    const emptyCloudData = {
        profile: { id: testUserId },
        tasks: [],
        studySessions: [],
        dsa: [],
        development: [],
        mistakes: [],
        workoutPlan: null,
        personalRecords: [],
        placementHub: null,
        internships: [],
        aiSettings: null,
        workoutSessions: []
    };

    // Run reconciliation on empty cloud data
    Store.loadFromCloud(emptyCloudData);

    assert(Store.memoryState.days['2026-08-18'] !== undefined, 'Local calendar days NOT wiped when cloud has 0 tasks');
    assert(Store.memoryState.days['2026-08-18'].status === 'COMPLETED', 'Day status remains COMPLETED');
    assert(Object.keys(Store.memoryState.dsa).length === 2, 'Local DSA items (2) NOT wiped when cloud has 0 dsa');
    assert(Store.memoryState.dsa['1'].status === 'SOLVED', 'DSA problem 1 remains SOLVED');
    assert(Store.memoryState.mistakes.length === 1, 'Local mistakes (1) NOT wiped when cloud has 0 mistakes');
    assert(Store.memoryState.internships.length === 1, 'Local internships (1) NOT wiped when cloud has 0 internships');

    // -------------------------------------------------------------------------
    // TEST 3: Cloud has Older Records -> Reconcile -> Imported Newer Records Win (LWW)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: LAST-WRITE-WINS (LOCAL IMPORT IS NEWER) ---');
    const olderCloudData = {
        profile: { id: testUserId },
        tasks: [
            {
                task_id: 'task_2026-08-18_dsa_morning',
                date: '2026-08-18',
                title: 'DSA: Learn Basics',
                category: 'DSA',
                start_time: '06:45',
                end_time: '08:15',
                status: 'NOT_STARTED', // Stale cloud status
                is_study: true,
                updated_at: '2026-08-18T10:00:00Z' // Older than importTimestamp (2026-09-28)
            }
        ],
        dsa: [
            {
                problem_id: '1',
                status: 'NOT_STARTED', // Stale cloud status
                updated_at: '2026-08-18T10:00:00Z'
            }
        ],
        mistakes: [],
        internships: []
    };

    Store.loadFromCloud(olderCloudData);
    assert(Store.memoryState.days['2026-08-18'].tasks[0].status === 'COMPLETED', 'Newer imported task status (COMPLETED) beats older cloud status (NOT_STARTED)');
    assert(Store.memoryState.dsa['1'].status === 'SOLVED', 'Newer imported DSA status (SOLVED) beats older cloud status (NOT_STARTED)');

    // -------------------------------------------------------------------------
    // TEST 4: Cloud has Newer Records -> Reconcile -> Newer Cloud Records Win (LWW)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: LAST-WRITE-WINS (CLOUD IS NEWER) ---');
    const newerCloudData = {
        profile: { id: testUserId },
        tasks: [
            {
                task_id: 'task_2026-08-18_dsa_morning',
                date: '2026-08-18',
                title: 'DSA: Learn Basics (Cloud Updated)',
                category: 'DSA',
                start_time: '06:45',
                end_time: '08:15',
                status: 'REVISIT',
                is_study: true,
                updated_at: '2026-10-01T12:00:00Z' // Newer than import
            }
        ],
        dsa: [
            {
                problem_id: '1',
                status: 'REVISIT',
                updated_at: '2026-10-01T12:00:00Z'
            }
        ],
        mistakes: [],
        internships: []
    };

    Store.loadFromCloud(newerCloudData);
    assert(Store.memoryState.days['2026-08-18'].tasks[0].status === 'REVISIT', 'Newer cloud task status (REVISIT) beats older local status');
    assert(Store.memoryState.dsa['1'].status === 'REVISIT', 'Newer cloud DSA status (REVISIT) beats older local status');

    // -------------------------------------------------------------------------
    // TEST 5: User Isolation & Foreign User ID Sanitization
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: USER ISOLATION & FOREIGN ID SANITIZATION ---');
    const untrustedBackup = {
        app: APP_CONFIG.APP_NAME,
        version: APP_CONFIG.VERSION,
        exportedAt: '2026-09-28T09:00:00+05:30',
        data: {
            days: {
                '2026-09-28': {
                    status: 'COMPLETED',
                    tasks: [
                        {
                            id: 'task_spoofed_01',
                            userId: 'attacker_foreign_id_9999',
                            title: 'Foreign Task',
                            category: 'DSA',
                            status: 'COMPLETED'
                        }
                    ]
                }
            },
            gym: {
                sessions: [
                    {
                        id: 'gym_sess_01',
                        userId: 'attacker_foreign_id_9999',
                        date: '2026-09-28',
                        workoutType: 'Push'
                    }
                ]
            },
            internships: [
                {
                    id: 'intern_spoofed_01',
                    userId: 'attacker_foreign_id_9999',
                    company: 'Meta',
                    role: 'Intern'
                }
            ]
        }
    };

    // Authenticated user is testUserId ('auth_user_uuid_1234')
    await Store.importBackup(JSON.stringify(untrustedBackup));
    const importedTask = Store.memoryState.days['2026-09-28'].tasks[0];
    assert(importedTask.userId === testUserId, `Foreign task userId sanitized to current authenticated user (${importedTask.userId})`);
    const importedGymSess = Store.memoryState.gym.sessions[0];
    assert(importedGymSess.userId === testUserId, `Foreign gym session userId sanitized to current authenticated user (${importedGymSess.userId})`);
    const importedIntern = Store.memoryState.internships[0];
    assert(importedIntern.userId === testUserId, `Foreign internship userId sanitized to current authenticated user (${importedIntern.userId})`);

    // -------------------------------------------------------------------------
    // TEST 6: Logout and Re-Login Simulation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: LOGOUT AND RE-LOGIN PERSISTENCE ---');
    // Simulate logout: Supabase currentUser becomes null
    SupabaseService.currentUser = null;
    window.currentUser = null;
    // Local data should still be present in Store
    assert(Store.memoryState.days['2026-09-28'] !== undefined, 'Local calendar days remain intact after logout');
    // Simulate re-login as the user
    SupabaseService.currentUser = { id: testUserId };
    window.currentUser = SupabaseService.currentUser;
    // Simulate App.onUserAuthenticated
    Store.loadFromCloud(emptyCloudData);
    assert(Store.memoryState.days['2026-09-28'] !== undefined, 'Imported calendar days survive logout -> login -> empty cloud sync cycle');

    console.log('\n================================================================');
    console.log(`IMPORT PERSISTENCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runImportPersistenceTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
