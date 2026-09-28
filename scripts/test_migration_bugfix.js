/**
 * BOSS Study OS — Cloud Migration Runtime Error & Idempotency Verification
 * Specifically tests that clicking "Start Cloud Migration" does NOT throw:
 * ReferenceError: updateStatus is not defined / ReferenceError: updatesStatus is not defined
 * Tests migration with and without progress callbacks, verifies report fields and idempotency.
 */

const fs = require('fs');
const path = require('path');

// Setup minimal mock environment
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
            contains: () => false
        };
    }
}

class MockDocument {
    constructor() {
        this.elements = {};
    }
    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = new MockElement(id);
        }
        return this.elements[id];
    }
}

const mockLS = new MockLocalStorage();
const mockDoc = new MockDocument();

global.window = {
    localStorage: mockLS,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { reload: () => {} }
};
global.localStorage = mockLS;
global.document = mockDoc;
let lastToast = null;
global.showToast = (msg, type) => {
    lastToast = { msg, type };
};

const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const { Store } = require('../js/store.js');
global.Store = Store;

const { AuthController } = require('../js/auth.js');
global.AuthController = AuthController;

// Mock SyncEngine
global.SyncEngine = {
    pullCloudState: async () => true,
    reconcile: () => {}
};

async function runMigrationBugfixTests() {
    console.log('================================================================');
    console.log('🚀 STUDYOS CLOUD MIGRATION BUG FIX VERIFICATION');
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

    // Configure mock Supabase client
    const upsertLog = [];
    const insertLog = [];
    const mockClient = {
        from(table) {
            return {
                select() {
                    return {
                        eq() {
                            const res = {
                                data: table === 'profiles' ? [{ id: 'test_user_id' }] : [],
                                error: null,
                                count: 5,
                                maybeSingle: async () => ({ data: table === 'profiles' ? { id: 'test_user_id' } : null, error: null }),
                                single: async () => ({ data: table === 'profiles' ? { id: 'test_user_id' } : null, error: null })
                            };
                            return res;
                        }
                    };
                },
                upsert(data, opts) {
                    upsertLog.push({ table, data, opts });
                    return Promise.resolve({ data, error: null });
                },
                insert(data) {
                    insertLog.push({ table, data });
                    return Promise.resolve({ data, error: null });
                }
            };
        },
        storage: {
            from() {
                return {
                    upload: async () => ({ data: { path: 'test_path.jpg' }, error: null })
                };
            }
        }
    };

    SupabaseService.client = mockClient;
    SupabaseService.isConfigured = true;
    SupabaseService.currentUser = { id: 'test_user_id', email: 'boss@studyos.com' };
    SupabaseService.currentSession = { access_token: 'test_token' };

    // Populate local mock data
    Store.memoryState = {
        days: {
            '2026-09-28': {
                tasks: [
                    { id: 'task_1', title: 'Array problem', isStudy: true, status: 'COMPLETED' },
                    { id: 'task_2', title: 'React component', isStudy: true, status: 'IN_PROGRESS' }
                ]
            }
        },
        dsa: {
            'prob_1': { status: 'SOLVED', solvedDate: '2026-09-28' },
            'prob_2': { status: 'IN_PROGRESS' }
        },
        development: {
            topics: { 'html_intro': { status: 'COMPLETED' } },
            videos: {},
            tasks: {},
            projects: {}
        },
        mistakes: [
            { question: 'Binary Search Edge Case', date: '2026-09-28', subject: 'DSA' }
        ],
        studySessions: [
            { date: '2026-09-28', subject: 'DSA', activeSeconds: 1800, startTime: '10:00' }
        ],
        gym: {
            schedule: { Monday: 'Push' },
            settings: { calorieTarget: 2500 },
            sessions: []
        },
        placementHub: { interviewQuestions: [] },
        internships: [
            { company: 'Google', role: 'SWE', dateApplied: '2026-09-28' }
        ]
    };

    // -------------------------------------------------------------------------
    // TEST 1: performMigration() does NOT throw ReferenceError (updatesStatus / updateStatus)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: performMigration() EXECUTION INTEGRITY ---');
    let migrationError = null;

    try {
        await AuthController.performMigration();
    } catch (err) {
        migrationError = err;
    }

    assert(migrationError === null, 'performMigration() executes without unhandled exception');

    const progressEl = mockDoc.getElementById('migrationProgressText');
    const hasStatusError = progressEl.textContent.includes('updatesStatus is not defined') ||
                           progressEl.textContent.includes('updateStatus is not defined');
    assert(!hasStatusError, 'UI progress text does not report updateStatus/updatesStatus ReferenceError');
    assert(!progressEl.textContent.includes('Migration failed:'), `Migration completed successfully (status: "${progressEl.textContent}")`);

    // -------------------------------------------------------------------------
    // TEST 2: Progress callback safety & alias checks
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: STATUS CALLBACK SAFETY & ALIAS RESOLUTION ---');
    assert(typeof AuthController.updateStatus === 'function', 'AuthController.updateStatus is defined as a method');
    assert(typeof AuthController.updatesStatus === 'function', 'AuthController.updatesStatus is defined as an alias method');

    let customCallbackCalled = false;
    let customStatusMsg = '';
    const report1 = await SupabaseService.migrateLocalDataToCloud(Store.memoryState, (msg) => {
        customCallbackCalled = true;
        customStatusMsg = msg;
    });

    assert(customCallbackCalled === true, 'Custom progress callback invoked during migrateLocalDataToCloud');
    assert(customStatusMsg.length > 0, `Progress callback received descriptive status: "${customStatusMsg}"`);

    // -------------------------------------------------------------------------
    // TEST 3: Migration without progress callback (null/undefined) does NOT throw
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: MIGRATION WITHOUT CALLBACK (NULL / UNDEFINED) ---');
    let noCallbackError = null;
    let reportWithoutCallback = null;
    try {
        reportWithoutCallback = await SupabaseService.migrateLocalDataToCloud(Store.memoryState, null);
    } catch (e) {
        noCallbackError = e;
    }
    assert(noCallbackError === null, 'migrateLocalDataToCloud(localState, null) completes without error');
    assert(reportWithoutCallback !== null, 'Report returned when onProgress is null');

    let undefinedCallbackError = null;
    try {
        await SupabaseService.migrateLocalDataToCloud(Store.memoryState);
    } catch (e) {
        undefinedCallbackError = e;
    }
    assert(undefinedCallbackError === null, 'migrateLocalDataToCloud(localState) (default undefined) completes without error');

    // -------------------------------------------------------------------------
    // TEST 4: Preservation of all 14 Migration Report Fields
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: PRESERVATION OF ALL 14 REPORT FIELDS ---');
    const requiredFields = [
        'tasksMigrated',
        'calendarRecordsMigrated',
        'dsaMigrated',
        'devMigrated',
        'mistakesMigrated',
        'studySessionsMigrated',
        'gymPlansMigrated',
        'gymSessionsMigrated',
        'gymExercisesMigrated',
        'gymSetsMigrated',
        'personalRecordsMigrated',
        'placementMigrated',
        'internshipsMigrated',
        'photosMigrated'
    ];

    let allFieldsPresent = true;
    for (const f of requiredFields) {
        if (typeof report1[f] !== 'number') {
            allFieldsPresent = false;
            console.error(`Missing or non-numeric report field: ${f}`);
        }
    }
    assert(allFieldsPresent, 'All 14 required migration report fields are present and numeric');
    assert(report1.tasksMigrated === 2, `tasksMigrated count is accurate (${report1.tasksMigrated})`);
    assert(report1.dsaMigrated === 2, `dsaMigrated count is accurate (${report1.dsaMigrated})`);
    assert(report1.devMigrated === 1, `devMigrated count is accurate (${report1.devMigrated})`);
    assert(report1.mistakesMigrated === 1, `mistakesMigrated count is accurate (${report1.mistakesMigrated})`);
    assert(report1.studySessionsMigrated === 1, `studySessionsMigrated count is accurate (${report1.studySessionsMigrated})`);
    assert(report1.internshipsMigrated === 1, `internshipsMigrated count is accurate (${report1.internshipsMigrated})`);

    // -------------------------------------------------------------------------
    // TEST 5: Idempotency Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: IDEMPOTENT UPSERT & ONCONFLICT VERIFICATION ---');
    const dsaUpsert = upsertLog.find(u => u.table === 'dsa_progress');
    assert(dsaUpsert && dsaUpsert.opts && dsaUpsert.opts.onConflict === 'user_id,problem_id', 'DSA uses idempotent onConflict: user_id,problem_id');

    const devUpsert = upsertLog.find(u => u.table === 'development_progress');
    assert(devUpsert && devUpsert.opts && devUpsert.opts.onConflict === 'user_id,category,item_id', 'Development uses idempotent onConflict: user_id,category,item_id');

    const taskUpsert = upsertLog.find(u => u.table === 'study_tasks');
    assert(taskUpsert && taskUpsert.opts && taskUpsert.opts.onConflict === 'user_id,date,task_id', 'Tasks use idempotent onConflict: user_id,date,task_id');

    // -------------------------------------------------------------------------
    // TEST 6: pullCloudDataToLocal Callback Safety
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: PULL CLOUD DATA CALLBACK SAFETY ---');
    let pullError = null;
    try {
        await AuthController.pullCloudData();
    } catch (e) {
        pullError = e;
    }
    assert(pullError === null, 'pullCloudData executes without updateStatus/updatesStatus exception');

    console.log('\n================================================================');
    console.log(`MIGRATION BUG FIX RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
}

runMigrationBugfixTests().catch(err => {
    console.error('Migration bug fix test exception:', err);
    process.exit(1);
});
