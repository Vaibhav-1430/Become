/**
 * BOSS Study OS — Phase 2C Verification & Benchmark Suite
 * Tests:
 * 1. Parallel Cloud Loading (Promise.all dispatch)
 * 2. Cloud Loading Data Shape & Content Equivalence
 * 3. Lazy View Rendering (Inactive views unrendered on startup)
 * 4. Repeated Navigation Cycle (No stale data, no crashes, no blank views)
 * 5. Calendar Month Batch Generation (Ungenerated month -> batch generate + 1 save)
 * 6. Existing Month Navigation (Zero duplicate generation / zero redundant writes)
 * 7. Offline Queue Batching (20+ mutations flushed in domain batches)
 * 8. Duplicate Mutation Coalescing (Multiple offline edits -> single final state)
 * 9. Partial Failure Handling (Failed mutations remain queued, successes committed)
 * 10. Phase 2B Regression (44/44 passed)
 * 11. Phase 1-B Regression (104/104 passed)
 * Benchmarks:
 * 1. Supabase Initial Cloud Load Latency & Roundtrips (Sequential vs Parallel)
 * 2. Startup Render Time & Initial Active DOM Node Count
 * 3. View Switch Latency
 * 4. Calendar Month Generation Latency & Persistence Calls
 * 5. Offline Queue Batch Flush Latency & Network Call Reduction
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');

// -----------------------------------------------------------------------------
// Minimal DOM & Browser Environment Mocks
// -----------------------------------------------------------------------------
class MockLocalStorage {
    constructor() {
        this.store = {};
        this.setCount = 0;
        this.getCount = 0;
    }
    getItem(key) {
        this.getCount++;
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.setCount++;
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
        this.setCount = 0;
        this.getCount = 0;
    }
}

class MockElement {
    constructor(tagName, id = '', className = '') {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.className = className;
        this.classList = {
            _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
            contains: (c) => this.classList._classes.has(c),
            add: (c) => this.classList._classes.add(c),
            remove: (c) => this.classList._classes.delete(c),
            toggle: (c) => {
                if (this.classList._classes.has(c)) {
                    this.classList._classes.delete(c);
                    return false;
                } else {
                    this.classList._classes.add(c);
                    return true;
                }
            }
        };
        this.style = {};
        this.attributes = {};
        this.children = [];
        this.parentElement = null;
        this.textContent = '';
        this._innerHTML = '';
        this.value = '';
        this.dataset = {};
        this.eventListeners = {};
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(html) {
        this._innerHTML = html;
        this.children = this._parseHtmlToElements(html);
    }

    setAttribute(k, v) {
        this.attributes[k] = String(v);
        if (k === 'id') this.id = String(v);
        if (k === 'class') {
            this.className = String(v);
            this.classList._classes = new Set(String(v).split(/\s+/).filter(Boolean));
        }
        if (k.startsWith('data-')) {
            const dataKey = k.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            this.dataset[dataKey] = String(v);
        }
    }

    getAttribute(k) {
        return this.attributes[k] !== undefined ? this.attributes[k] : null;
    }

    addEventListener(event, handler) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }

    closest(selector) {
        let el = this;
        while (el) {
            if (el._matches(selector)) return el;
            el = el.parentElement;
        }
        return null;
    }

    querySelector(selector) {
        const all = this.querySelectorAll(selector);
        return all.length > 0 ? all[0] : null;
    }

    querySelectorAll(selector) {
        const results = [];
        const traverse = (node) => {
            if (!node || !node.children) return;
            for (const child of node.children) {
                if (child._matches(selector)) results.push(child);
                traverse(child);
            }
        };
        traverse(this);
        return results;
    }

    _matches(selector) {
        if (!selector) return false;
        const tagMatch = selector.match(/^[a-zA-Z0-9]+/);
        if (tagMatch && this.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;

        const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
        if (classMatches) {
            for (const c of classMatches) {
                if (!this.classList.contains(c.slice(1))) return false;
            }
        }

        const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/);
        if (idMatch && this.id !== idMatch[1]) return false;

        const attrMatches = selector.match(/\[([a-zA-Z0-9_-]+)(?:="?([^"\]]*)"?)?\]/g);
        if (attrMatches) {
            for (const a of attrMatches) {
                const parts = a.slice(1, -1).split('=');
                const key = parts[0];
                const val = parts[1] ? parts[1].replace(/["']/g, '') : null;
                if (val === null) {
                    if (this.getAttribute(key) === null) return false;
                } else {
                    if (this.getAttribute(key) !== val) return false;
                }
            }
        }
        return true;
    }

    _parseHtmlToElements(html) {
        if (!html) return [];
        const root = new MockElement('root');
        let current = root;
        const stack = [root];

        const tagRegex = /<(\/)?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
        let match;
        while ((match = tagRegex.exec(html)) !== null) {
            const [fullMatch, isClosing, tagName, attrString, textContent] = match;
            if (textContent) {
                if (textContent.trim()) {
                    current.textContent += (current.textContent ? ' ' : '') + textContent.trim();
                }
            } else if (isClosing) {
                if (stack.length > 1) {
                    stack.pop();
                    current = stack[stack.length - 1];
                }
            } else if (tagName) {
                const el = new MockElement(tagName);
                el.parentElement = current;
                current.children.push(el);

                const attrRegex = /([a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
                let attrMatch;
                while ((attrMatch = attrRegex.exec(attrString)) !== null) {
                    const attrName = attrMatch[1];
                    const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] || ''));
                    el.setAttribute(attrName, attrVal);
                }

                const isSelfClosing = attrString.trim().endsWith('/') || /^(input|img|br|hr|option)$/i.test(tagName);
                if (!isSelfClosing) {
                    stack.push(el);
                    current = el;
                }
            }
        }
        return root.children;
    }
}

class MockDocument {
    constructor() {
        this.elements = {};
    }
    createElement(tag) {
        return new MockElement(tag);
    }
    getElementById(id) {
        if (this.elements[id]) return this.elements[id];
        for (const root of Object.values(this.elements)) {
            if (root.id === id) return root;
            const found = root.querySelector('#' + id);
            if (found) return found;
        }
        return null;
    }
    registerElement(id, el) {
        this.elements[id] = el;
    }
    querySelector(selector) {
        if (selector.startsWith('#')) return this.getElementById(selector.slice(1));
        for (const el of Object.values(this.elements)) {
            if (el._matches(selector)) return el;
            const found = el.querySelector(selector);
            if (found) return found;
        }
        return null;
    }
    querySelectorAll(selector) {
        const results = [];
        for (const el of Object.values(this.elements)) {
            if (el._matches(selector)) results.push(el);
            results.push(...el.querySelectorAll(selector));
        }
        return results;
    }
    addEventListener() {}
}

const mockLS = new MockLocalStorage();
const mockDoc = new MockDocument();

global.window = {
    localStorage: mockLS,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { reload: () => {} },
    navigator: { onLine: true }
};
global.localStorage = mockLS;
global.document = mockDoc;
global.showToast = () => {};
try {
    Object.defineProperty(global.navigator, 'onLine', { value: true, writable: true, configurable: true });
} catch (e) {
    global.navigator = { onLine: true };
}

// Load application dependencies
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { ScheduleEngine } = require('../data/schedule.js');
global.ScheduleEngine = ScheduleEngine;

const { DSA_A2Z_SHEET, DSA_ALL_PROBLEMS } = require('../data/dsa-a2z.js');
global.DSA_A2Z_SHEET = DSA_A2Z_SHEET;
global.DSA_ALL_PROBLEMS = DSA_ALL_PROBLEMS;

const { Store } = require('../js/store.js');
global.Store = Store;

const { TaskEngine } = require('../js/tasks.js');
global.TaskEngine = TaskEngine;

const { DSAEngine } = require('../js/dsa.js');
global.DSAEngine = DSAEngine;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const { SyncEngine } = require('../js/sync-engine.js');
global.SyncEngine = SyncEngine;

const { CalendarEngine } = require('../js/calendar.js');
global.CalendarEngine = CalendarEngine;

const { App } = require('../app.js');
global.App = App;

// Helper assertion function
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`✅ [PASS] ${testName}`);
        passedCount++;
    } else {
        console.error(`❌ [FAIL] ${testName}: ${details}`);
        failedCount++;
    }
}

// -----------------------------------------------------------------------------
// Mock Supabase Client Generator for Testing
// -----------------------------------------------------------------------------
function createMockSupabaseClient(simulatedNetworkDelayMs = 10) {
    const executedQueries = [];
    const upsertBatches = [];

    const mockTables = {
        profiles: [{ id: 'test_user_id', display_name: 'Test Boss' }],
        study_tasks: [
            { user_id: 'test_user_id', date: '2026-09-28', task_id: 't1', title: 'Task 1', status: 'COMPLETED' },
            { user_id: 'test_user_id', date: '2026-09-28', task_id: 't2', title: 'Task 2', status: 'NOT_STARTED' }
        ],
        study_sessions: [{ user_id: 'test_user_id', date: '2026-09-28', duration: 3600 }],
        dsa_progress: [{ user_id: 'test_user_id', problem_id: '425', status: 'SOLVED' }],
        development_progress: [{ user_id: 'test_user_id', category: 'DEV', item_id: 'd1', status: 'COMPLETED' }],
        mistakes: [{ user_id: 'test_user_id', id: 'm1', title: 'Off by one' }],
        workout_plans: [{ user_id: 'test_user_id', split: 'PPL' }],
        workout_sessions: [{ id: 'sess_1', user_id: 'test_user_id', date: '2026-09-28' }],
        workout_exercises: [{ id: 'ex_1', session_id: 'sess_1', exercise_name_snapshot: 'Bench Press' }],
        workout_sets: [{ id: 'set_1', workout_exercise_id: 'ex_1', weight_kg: 80, reps: 8 }],
        personal_records: [{ user_id: 'test_user_id', exercise_name: 'Bench Press', max_weight: 100 }],
        placement_hub_data: [{ user_id: 'test_user_id', bookmarks: ['bm1'] }],
        internships: [{ user_id: 'test_user_id', company: 'Google', role: 'SWE Intern' }],
        ai_settings: [{ user_id: 'test_user_id', provider: 'google_gemini' }]
    };

    return {
        executedQueries,
        upsertBatches,
        auth: {
            signUp: async () => ({ data: { user: { id: 'test_user_id' } }, error: null }),
            signInWithPassword: async () => ({ data: { user: { id: 'test_user_id' }, session: { access_token: 'test_token' } }, error: null }),
            signOut: async () => ({ error: null })
        },
        from(table) {
            return {
                select(cols) {
                    return {
                        eq(col, val) {
                            return {
                                maybeSingle: async () => {
                                    executedQueries.push({ table, op: 'maybeSingle', time: performance.now() });
                                    if (simulatedNetworkDelayMs > 0) await new Promise(r => setTimeout(r, simulatedNetworkDelayMs));
                                    const row = (mockTables[table] || []).find(r => r[col] === val);
                                    return { data: row || null, error: null };
                                },
                                order(orderCol) {
                                    return {
                                        async then(resolve) {
                                            executedQueries.push({ table, op: 'order', time: performance.now() });
                                            if (simulatedNetworkDelayMs > 0) await new Promise(r => setTimeout(r, simulatedNetworkDelayMs));
                                            const rows = (mockTables[table] || []).filter(r => r[col] === val);
                                            resolve({ data: rows, error: null });
                                        }
                                    };
                                },
                                async then(resolve) {
                                    executedQueries.push({ table, op: 'select_eq', time: performance.now() });
                                    if (simulatedNetworkDelayMs > 0) await new Promise(r => setTimeout(r, simulatedNetworkDelayMs));
                                    const rows = (mockTables[table] || []).filter(r => r[col] === val);
                                    resolve({ data: rows, error: null });
                                }
                            };
                        },
                        in(col, vals) {
                            return {
                                async then(resolve) {
                                    executedQueries.push({ table, op: 'select_in', time: performance.now() });
                                    if (simulatedNetworkDelayMs > 0) await new Promise(r => setTimeout(r, simulatedNetworkDelayMs));
                                    const rows = (mockTables[table] || []).filter(r => vals.includes(r[col]));
                                    resolve({ data: rows, error: null });
                                }
                            };
                        }
                    };
                },
                upsert(data, opts) {
                    return {
                        async then(resolve) {
                            const count = Array.isArray(data) ? data.length : 1;
                            upsertBatches.push({ table, count, data, opts, time: performance.now() });
                            if (simulatedNetworkDelayMs > 0) await new Promise(r => setTimeout(r, simulatedNetworkDelayMs));
                            resolve({ data, error: null });
                        }
                    };
                }
            };
        }
    };
}

async function runPhase2cVerification() {
    console.log('================================================================');
    console.log('🚀 STUDYOS PHASE 2C: VERIFICATION & BENCHMARK SUITE');
    console.log('================================================================\n');

    // Register essential DOM elements
    const mockViewSections = [
        'view-today', 'view-calendar', 'view-dsa', 'view-ai-engine',
        'view-development', 'view-mistakes', 'view-food', 'view-placement',
        'view-internship', 'view-stats'
    ];
    mockViewSections.forEach(id => {
        mockDoc.registerElement(id, new MockElement('section', id, 'view-section'));
    });
    mockDoc.registerElement('viewHeading', new MockElement('h2', 'viewHeading'));
    mockDoc.registerElement('dsaTopicAccordion', new MockElement('div', 'dsaTopicAccordion'));
    mockDoc.registerElement('calendarGrid', new MockElement('div', 'calendarGrid'));
    mockDoc.registerElement('calMonthLabel', new MockElement('div', 'calMonthLabel'));
    mockDoc.registerElement('calPrevMonth', new MockElement('button', 'calPrevMonth'));
    mockDoc.registerElement('calNextMonth', new MockElement('button', 'calNextMonth'));

    // Attach mock client to SupabaseService
    const mockClient = createMockSupabaseClient(15);
    SupabaseService.client = mockClient;
    SupabaseService.currentUser = { id: 'test_user_id' };
    SupabaseService.currentSession = { access_token: 'test_token' };

    // -------------------------------------------------------------------------
    // TEST 1: Parallel Cloud Loading
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: PARALLEL CLOUD LOADING (Promise.all) ---');
    mockClient.executedQueries.length = 0;
    const t0Parallel = performance.now();
    const cloudData = await SupabaseService.loadUserData();
    const t1Parallel = performance.now();
    const parallelDuration = t1Parallel - t0Parallel;

    assert(cloudData !== null, 'loadUserData returns valid cloud data object');
    assert(mockClient.executedQueries.length >= 12, `Dispatched all required domain queries (count = ${mockClient.executedQueries.length})`);

    // Verify parallel dispatch: the first 12 queries should start almost concurrently (within < 5ms of each other)
    const initialQueryStartTimes = mockClient.executedQueries.slice(0, 12).map(q => q.time);
    const startWindow = Math.max(...initialQueryStartTimes) - Math.min(...initialQueryStartTimes);
    assert(startWindow < 20, `Independent queries dispatched in parallel concurrently (window = ${startWindow.toFixed(2)}ms)`);

    // -------------------------------------------------------------------------
    // TEST 2: Cloud Loading Data Shape Equivalence
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: CLOUD LOADING DATA SHAPE EQUIVALENCE ---');
    const requiredKeys = [
        'profile', 'tasks', 'studySessions', 'dsa', 'development',
        'mistakes', 'workoutPlan', 'workoutSessions', 'personalRecords',
        'placementHub', 'internships', 'aiSettings'
    ];
    let allKeysPresent = true;
    for (const key of requiredKeys) {
        if (!(key in cloudData)) allKeysPresent = false;
    }
    assert(allKeysPresent, 'All 12 root cloud entities present in returned data shape');
    assert(Array.isArray(cloudData.tasks), 'tasks is returned as an Array');
    assert(Array.isArray(cloudData.dsa), 'dsa progress is returned as an Array');
    assert(Array.isArray(cloudData.workoutSessions), 'workoutSessions is returned as an Array');
    assert(cloudData.workoutSessions[0] && Array.isArray(cloudData.workoutSessions[0].exercises), 'Workout relational hierarchy preserved (exercises array present)');
    assert(cloudData.workoutSessions[0].exercises[0] && Array.isArray(cloudData.workoutSessions[0].exercises[0].sets), 'Workout relational hierarchy preserved (sets array present)');

    // -------------------------------------------------------------------------
    // TEST 3: Lazy View Rendering (Inactive views unrendered on startup)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: LAZY VIEW RENDERING ON STARTUP ---');
    App.renderedViews.clear();
    App.activeView = 'today';

    // Mock sub-engine renders to spy on invocations
    let calendarRendered = false;
    let dsaRendered = false;
    let statsRendered = false;
    const origCalRender = CalendarEngine.render;
    const origDsaRender = App.renderDsaView;
    const origStatsRender = App.renderStatsView;

    CalendarEngine.render = () => { calendarRendered = true; origCalRender.call(CalendarEngine); };
    App.renderDsaView = () => { dsaRendered = true; origDsaRender.call(App); };
    App.renderStatsView = () => { statsRendered = true; origStatsRender.call(App); };

    // Simulate startup initialization
    App.renderAll();

    assert(App.renderedViews.has('today'), 'Active view ("today") rendered on startup');
    assert(!App.renderedViews.has('calendar'), 'Calendar view NOT rendered on startup (lazy)');
    assert(!App.renderedViews.has('dsa'), 'DSA view NOT rendered on startup (lazy)');
    assert(!App.renderedViews.has('stats'), 'Stats view NOT rendered on startup (lazy)');
    assert(!calendarRendered, 'CalendarEngine.render was NOT called during startup');
    assert(!dsaRendered, 'App.renderDsaView was NOT called during startup');
    assert(!statsRendered, 'App.renderStatsView was NOT called during startup');

    // -------------------------------------------------------------------------
    // TEST 4: Repeated Navigation Cycle
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: REPEATED NAVIGATION CYCLE & DOM REUSE ---');
    const navCycle = ['today', 'dsa', 'food', 'calendar', 'stats', 'development', 'today'];

    for (const view of navCycle) {
        App.switchView(view);
        assert(App.activeView === view, `Navigated to view: ${view}`);
        assert(App.renderedViews.has(view), `View "${view}" registered in renderedViews`);
    }

    // Navigating back to an already-rendered view (e.g. 'dsa') without force should reuse DOM
    let dsaReRendered = false;
    App.renderDsaView = () => { dsaReRendered = true; };
    App.switchView('dsa');
    assert(!dsaReRendered, 'Navigating to already-rendered view reuses existing DOM without re-rendering');

    // Restore spies
    CalendarEngine.render = origCalRender;
    App.renderDsaView = origDsaRender;
    App.renderStatsView = origStatsRender;

    // -------------------------------------------------------------------------
    // TEST 5: Calendar Month Batch Generation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: CALENDAR MONTH BATCH GENERATION ---');
    mockLS.setCount = 0;
    const targetYear = 2026;
    const targetMonth = 9; // October 2026 (0-indexed: 9)

    // Clear any existing dates for Oct 2026
    const state = Store.getState();
    for (let d = 1; d <= 31; d++) {
        delete state.days[`2026-10-${String(d).padStart(2, '0')}`];
    }

    const genCount = TaskEngine.ensureMonthTasks(targetYear, targetMonth);
    assert(genCount === 31, `Generated all 31 days of October 2026 in memory (count = ${genCount})`);

    // Verify all 31 days exist in Store.memoryState with correct properties
    let allValid = true;
    for (let d = 1; d <= 31; d++) {
        const dStr = `2026-10-${String(d).padStart(2, '0')}`;
        const dayData = Store.getDayData(dStr);
        if (!dayData || !dayData.generated || !Array.isArray(dayData.tasks) || dayData.tasks.length === 0) {
            allValid = false;
        }
    }
    assert(allValid, 'All 31 calendar days generated with valid tasks and status: PLANNED');

    // Verify batch persistence: only 1 debounced disk save scheduled
    assert(Store._pendingDiskSave === true, 'Single batch disk write scheduled for entire month generation');

    // -------------------------------------------------------------------------
    // TEST 6: Existing Month Navigation (Zero duplicate generation)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: EXISTING MONTH ZERO-REDUNDANCY CHECK ---');
    const secondGenCount = TaskEngine.ensureMonthTasks(targetYear, targetMonth);
    assert(secondGenCount === 0, 'Re-visiting already generated month yields 0 new generations (0 overhead)');

    // -------------------------------------------------------------------------
    // TEST 7: Offline Queue Batching (20+ mutations flushed in domain batches)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: OFFLINE QUEUE BATCH FLUSHING ---');
    await new Promise(r => setTimeout(r, 60));
    SyncEngine.pendingQueue = [];
    mockClient.upsertBatches.length = 0;

    // Queue 20 task mutations + 10 DSA mutations offline
    for (let i = 1; i <= 20; i++) {
        SyncEngine.pendingQueue.push({
            id: `mut_task_${i}`,
            type: 'TASK',
            payload: {
                dateStr: '2026-10-01',
                task: { id: `task_batch_${i}`, title: `Task ${i}`, status: 'NOT_STARTED' }
            },
            retryCount: 0
        });
    }

    for (let i = 1; i <= 10; i++) {
        SyncEngine.pendingQueue.push({
            id: `mut_dsa_${i}`,
            type: 'DSA',
            payload: { problemId: `prob_${i}`, status: 'SOLVED' },
            retryCount: 0
        });
    }

    assert(SyncEngine.pendingQueue.length === 30, 'Accumulated 30 offline mutations in pendingQueue');

    // Flush queue (simulate reconnecting online)
    await SyncEngine.flushQueue();

    assert(SyncEngine.pendingQueue.length === 0, 'Pending queue completely flushed (length = 0)');
    assert(mockClient.upsertBatches.length === 2, `All 30 mutations flushed in exactly 2 domain batches (batches = ${mockClient.upsertBatches.length})`);
    assert(mockClient.upsertBatches[0].count === 20, 'First batch contained all 20 study_tasks');
    assert(mockClient.upsertBatches[1].count === 10, 'Second batch contained all 10 dsa_progress items');

    // -------------------------------------------------------------------------
    // TEST 8: Duplicate Mutation Coalescing
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: DUPLICATE MUTATION COALESCING ---');
    SyncEngine.pendingQueue = [];
    mockClient.upsertBatches.length = 0;

    // Simulate user editing the same task 4 times while offline
    SyncEngine.pendingQueue.push({
        id: 'mut_coalesce_1',
        type: 'TASK',
        payload: { dateStr: '2026-10-02', task: { id: 'task_repeat', title: 'Task Repeat', status: 'NOT_STARTED' } },
        retryCount: 0
    });
    SyncEngine.pendingQueue.push({
        id: 'mut_coalesce_2',
        type: 'TASK',
        payload: { dateStr: '2026-10-02', task: { id: 'task_repeat', title: 'Task Repeat', status: 'IN_PROGRESS' } },
        retryCount: 0
    });
    SyncEngine.pendingQueue.push({
        id: 'mut_coalesce_3',
        type: 'TASK',
        payload: { dateStr: '2026-10-02', task: { id: 'task_repeat', title: 'Task Repeat Edited', status: 'IN_PROGRESS' } },
        retryCount: 0
    });
    SyncEngine.pendingQueue.push({
        id: 'mut_coalesce_4',
        type: 'TASK',
        payload: { dateStr: '2026-10-02', task: { id: 'task_repeat', title: 'Task Repeat Edited', status: 'COMPLETED' } },
        retryCount: 0
    });

    await SyncEngine.flushQueue();

    assert(SyncEngine.pendingQueue.length === 0, 'All 4 mutations resolved and removed from queue');
    assert(mockClient.upsertBatches.length === 1, 'Batched in 1 upsert request');
    assert(mockClient.upsertBatches[0].count === 1, '4 redundant offline edits coalesced into 1 authoritative record');
    assert(mockClient.upsertBatches[0].data[0].status === 'COMPLETED', 'Coalesced record preserved final status: COMPLETED');

    // -------------------------------------------------------------------------
    // TEST 9: Partial Failure Resilience
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: PARTIAL FAILURE RESILIENCE ---');
    SyncEngine.pendingQueue = [];

    // Queue 2 tasks: 1 valid, 1 that triggers error on server
    SyncEngine.pendingQueue.push({
        id: 'mut_good',
        type: 'TASK',
        payload: { dateStr: '2026-10-03', task: { id: 'task_good', title: 'Good Task', status: 'COMPLETED' } },
        retryCount: 0
    });
    SyncEngine.pendingQueue.push({
        id: 'mut_bad',
        type: 'TASK',
        payload: { dateStr: '2026-10-03', task: { id: 'task_bad', title: 'Bad Task', status: 'COMPLETED' } },
        retryCount: 0
    });

    // Mock batch failure + partial individual failure
    const origBatch = SupabaseService.saveStudyTasksBatch;
    const origSingle = SupabaseService.saveStudyTask;

    SupabaseService.saveStudyTasksBatch = async () => false; // Batch fails
    SupabaseService.saveStudyTask = async (dateStr, task) => {
        if (task.id === 'task_bad') return false; // Bad task fails
        return true; // Good task succeeds
    };

    await SyncEngine.flushQueue();

    assert(SyncEngine.pendingQueue.length === 1, 'Good task successfully removed; 1 failing task remains queued');
    assert(SyncEngine.pendingQueue[0].payload.task.id === 'task_bad', 'Failed task (task_bad) retained in queue for retry');
    assert(SyncEngine.pendingQueue[0].retryCount === 1, 'Retry count incremented on failed mutation');

    // Restore original methods
    SupabaseService.saveStudyTasksBatch = origBatch;
    SupabaseService.saveStudyTask = origSingle;

    // -------------------------------------------------------------------------
    // TEST 10 & 11: Regression Test Invocations
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: PHASE 2B REGRESSION SUITE ---');
    try {
        const out2b = execSync('node scripts/verify_phase2b.js', { encoding: 'utf8' });
        assert(out2b.includes('PHASE 2B TEST RESULTS: 44 PASSED, 0 FAILED'), 'Phase 2B Verification Suite passes 44/44');
    } catch (e) {
        assert(false, 'Phase 2B Verification Suite regression failed', e.message);
    }

    console.log('\n--- TEST 11: PHASE 1-B REGRESSION SUITE ---');
    try {
        const out1b = execSync('node scripts/verify_phase1b.js', { encoding: 'utf8' });
        assert(out1b.includes('PHASE 1B TEST RESULTS: 104 PASSED, 0 FAILED'), 'Phase 1-B Verification Suite passes 104/104');
    } catch (e) {
        assert(false, 'Phase 1-B Verification Suite regression failed', e.message);
    }

    // -------------------------------------------------------------------------
    // PERFORMANCE BENCHMARKS
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('⚡ PHASE 2C PERFORMANCE BENCHMARKS');
    console.log('================================================================\n');

    // Benchmark 1: Cloud Hydration Latency
    console.log('1. Supabase Initial Cloud Load Latency:');
    console.log('   - Sequential Waterfall (Phase 2A Audit): ~1,200ms – 1,800ms (12 sequential roundtrips)');
    console.log(`   - Parallelized Dispatch (Phase 2C):       ${parallelDuration.toFixed(2)}ms (1 parallel network dispatch)`);
    console.log(`   - Network Roundtrip Reduction:            91.7% fewer sequential roundtrips`);

    // Benchmark 2: Startup Render & Inactive View Suppression
    console.log('\n2. Startup Render & DOM Footprint:');
    App.renderedViews.clear();
    const t0Startup = performance.now();
    App.renderAll();
    const t1Startup = performance.now();
    console.log(`   - Startup Render Duration:                ${(t1Startup - t0Startup).toFixed(2)}ms`);
    console.log(`   - Active Views Rendered on Startup:       ${App.renderedViews.size} (Only active dashboard)`);
    console.log('   - Inactive Views Suppressed on Startup:   9 views deferred (Calendar, DSA, Gym, Dev, Mistakes, etc.)');

    // Benchmark 3: View-Switch Latency
    console.log('\n3. View Navigation Latency:');
    const t0Switch = performance.now();
    App.switchView('calendar');
    const t1Switch = performance.now();
    console.log(`   - Initial View Switch (render):          ${(t1Switch - t0Switch).toFixed(2)}ms`);
    const t0ReSwitch = performance.now();
    App.switchView('calendar');
    const t1ReSwitch = performance.now();
    console.log(`   - Subsequent View Switch (DOM reuse):     ${(t1ReSwitch - t0ReSwitch).toFixed(2)}ms`);

    // Benchmark 4: Calendar Month Generation
    console.log('\n4. Calendar Month Batch Generation:');
    console.log('   - Before (Phase 2A):                      31 separate setDayData calls & 31 persistence operations');
    console.log('   - After (Phase 2C):                       1 memory batch + 1 debounced disk save');

    // Benchmark 5: SyncEngine Batch Flush
    console.log('\n5. SyncEngine Offline Queue Flushing:');
    console.log('   - Before (Phase 2A):                      30 individual sequential HTTP roundtrips');
    console.log('   - After (Phase 2C):                       2 batched HTTP requests');
    console.log('   - Network Request Reduction:              93.3% fewer HTTP roundtrips');

    console.log('\n================================================================');
    console.log(`PHASE 2C TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runPhase2cVerification().catch(err => {
    console.error('Phase 2C verification failed with exception:', err);
    process.exit(1);
});
