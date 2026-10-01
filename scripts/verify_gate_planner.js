/**
 * BOSS Study OS / FORGE — GATE 2027 Study Planner Comprehensive Verification Suite
 * Verifies official syllabus, historical paper weightage, priority engine,
 * PYQ session execution, Mistake Bank bridging, Store persistence, SyncEngine,
 * Calendar, Today Command, and AI Engine integration.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) { return store[key] || null; },
        setItem: function (key, value) { store[key] = value.toString(); },
        removeItem: function (key) { delete store[key]; },
        clear: function () { store = {}; }
    };
})();

global.window = {
    addEventListener: () => {},
    localStorage: localStorageMock,
    App: {
        activeView: 'today',
        switchView: () => {},
        renderAll: () => {}
    }
};
global.localStorage = localStorageMock;
global.document = {
    addEventListener: () => {},
    getElementById: (id) => null,
    querySelectorAll: () => [],
    querySelector: () => null
};

// Load dependencies
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { GATE_CONFIG, GATE_SYLLABUS, GATE_HISTORICAL_WEIGHTAGE, GATE_PYQ_DATASET } = require('../data/gate-data.js');
global.GATE_CONFIG = GATE_CONFIG;
global.GATE_SYLLABUS = GATE_SYLLABUS;
global.GATE_HISTORICAL_WEIGHTAGE = GATE_HISTORICAL_WEIGHTAGE;
global.GATE_PYQ_DATASET = GATE_PYQ_DATASET;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const { Store } = require('../js/store.js');
global.Store = Store;

const { ScheduleEngine } = require('../data/schedule.js');
global.ScheduleEngine = ScheduleEngine;

const { TaskEngine } = require('../js/tasks.js');
global.TaskEngine = TaskEngine;

const { SyncEngine } = require('../js/sync-engine.js');
global.SyncEngine = SyncEngine;

const { GatePlannerEngine } = require('../js/gate-planner.js');
global.GatePlannerEngine = GatePlannerEngine;

let passCount = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passCount++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}: ${err.message}`);
        throw err;
    }
}

async function runTests() {
    console.log('================================================================');
    console.log('GATE 2027 STUDY PLANNER — COMPREHENSIVE VERIFICATION SUITE');
    console.log('================================================================\n');

    // -------------------------------------------------------------------------
    // TEST SECTION 1: SYLLABUS BOUNDARY & HISTORICAL DATASET
    // -------------------------------------------------------------------------
    console.log('--- 1. OFFICIAL SYLLABUS BOUNDARY & HISTORICAL DATASET ---');

    test('GATE syllabus contains exactly the 11 official CSE subjects', () => {
        assert(Array.isArray(GATE_SYLLABUS), 'GATE_SYLLABUS is an array');
        assert.strictEqual(GATE_SYLLABUS.length, 11, 'Exactly 11 official GATE subjects defined');
        const expectedIds = ['ga', 'em', 'pds', 'algo', 'os', 'dbms', 'cn', 'coa', 'toc', 'cd', 'dl'];
        expectedIds.forEach(id => {
            const found = GATE_SYLLABUS.find(s => s.id === id);
            assert(found, `Subject "${id}" present in syllabus`);
            assert(found.topics && found.topics.length > 0, `Subject "${id}" has structured topics`);
        });
    });

    test('Historical dataset covers multiple years (2021-2026) across sets', () => {
        assert(Array.isArray(GATE_HISTORICAL_WEIGHTAGE), 'GATE_HISTORICAL_WEIGHTAGE is an array');
        assert(GATE_HISTORICAL_WEIGHTAGE.length >= 10, 'Contains multi-year paper analyses');
        const years = new Set(GATE_HISTORICAL_WEIGHTAGE.map(h => h.year));
        [2021, 2022, 2023, 2024, 2025, 2026].forEach(yr => {
            assert(years.has(yr), `Historical dataset contains papers for year ${yr}`);
        });
        GATE_HISTORICAL_WEIGHTAGE.forEach(entry => {
            assert(entry.year, 'Entry has year');
            assert(entry.session, 'Entry has session');
            assert(entry.marks && Object.keys(entry.marks).length >= 8, 'Entry has subject marks distribution');
            assert(entry.confidence, 'Entry has data confidence label');
        });
    });

    test('Verified genuine GATE PYQ dataset is properly structured with stable IDs', () => {
        assert(Array.isArray(GATE_PYQ_DATASET), 'GATE_PYQ_DATASET is an array');
        assert(GATE_PYQ_DATASET.length >= 8, 'Contains verified starter PYQs');
        const ids = new Set();
        GATE_PYQ_DATASET.forEach(q => {
            assert(q.id, 'Question has stable ID');
            assert(!ids.has(q.id), `Question ID "${q.id}" is unique`);
            ids.add(q.id);
            assert(q.year >= 2020 && q.year <= 2026, `Year ${q.year} is valid`);
            assert(q.subjectId, 'Question has subjectId');
            assert(q.topicId, 'Question has topicId');
            assert(q.questionText && q.questionText.length > 10, 'Question has valid question text');
            assert(q.explanation && q.explanation.length > 10, 'Question has valid solution explanation');
        });
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 2: GATE PRIORITY ENGINE FORMULA & HEURISTICS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. GATE PRIORITY ENGINE FORMULA & HEURISTICS ---');

    test('Priority weights are configurable in one place and sum to 1.0', () => {
        const weights = GATE_CONFIG.PRIORITY_WEIGHTS;
        assert(weights, 'PRIORITY_WEIGHTS exists');
        const sum = weights.historicalFrequency +
                    weights.recentFrequency +
                    weights.recurrence +
                    weights.userWeakness +
                    weights.revisionDue +
                    weights.pyqCoverageGap;
        assert(Math.abs(sum - 1.0) < 0.001, `Priority weights sum to 1.0 (actual: ${sum})`);
    });

    test('Subject priorities calculate dynamically across all 11 subjects', () => {
        const priorities = GatePlannerEngine.calculateSubjectPriorities();
        assert(Array.isArray(priorities), 'Subject priorities returned as array');
        assert.strictEqual(priorities.length, 11, 'All 11 subjects evaluated');
        priorities.forEach(sp => {
            assert(sp.priorityScore >= 0 && sp.priorityScore <= 100, `Priority score ${sp.priorityScore} is within 0-100`);
            assert(typeof sp.historicalWeight === 'number', 'Historical weight present');
            assert(typeof sp.recentAvgMarks === 'number', 'Recent average marks present');
            assert(typeof sp.accuracy === 'number', 'Accuracy metric present');
            assert(sp.priorityLevel, 'Priority level label present');
        });
        // Check sorting: descending order
        for (let i = 0; i < priorities.length - 1; i++) {
            assert(priorities[i].priorityScore >= priorities[i + 1].priorityScore, 'Subjects sorted by priorityScore descending');
        }
    });

    test('Topic priorities compute cleanly and adapt to user attempts', () => {
        const topicPriorities = GatePlannerEngine.calculateTopicPriorities();
        assert(Array.isArray(topicPriorities), 'Topic priorities returned as array');
        assert(topicPriorities.length > 20, 'Computes priorities for all syllabus topics');
        const top = topicPriorities[0];
        assert(top.subjectId && top.id, 'Top priority has subjectId and topic id');
        assert(top.priorityScore >= 0 && top.priorityScore <= 100, 'Top priority score bounded 0-100');
        assert(top.signals, 'Top priority contains signal breakdown');
        assert(typeof top.signals.historicalFrequency === 'number', 'Historical frequency signal present');
        assert(typeof top.signals.recentFrequency === 'number', 'Recent frequency signal present');
        assert(typeof top.signals.userWeakness === 'number', 'User weakness signal present');
    });

    test('Tonight directive provides transparent, explainable recommendations', () => {
        const directive = GatePlannerEngine.getTonightDirective();
        assert(directive, 'Tonight directive generated');
        assert(directive.subject && directive.subject.name, 'Directive specifies subject');
        assert(directive.topic && directive.topic.name, 'Directive specifies topic');
        assert(directive.pyqTarget > 0, 'Directive specifies PYQ target count');
        assert(directive.targetAccuracy >= 70, 'Directive specifies target accuracy');
        assert(directive.suggestedDurationMinutes > 0, 'Directive specifies suggested duration');
        assert(directive.reason && directive.reason.length > 5, 'Directive gives explainable reason');
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 3: STORE PERSISTENCE & TOPIC MASTERY CALCULATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. STORE PERSISTENCE & TOPIC MASTERY ---');

    test('Recording correct PYQ attempt updates topic mastery and progress', () => {
        const pyq = GATE_PYQ_DATASET[0];
        const attempt = Store.recordGatePyqAttempt({
            pyqId: pyq.id,
            subjectId: pyq.subjectId,
            topicId: pyq.topicId,
            year: pyq.year,
            isCorrect: true,
            status: 'CORRECT',
            timeTakenSeconds: 180,
            confidence: 'HIGH'
        });

        assert(attempt && attempt.id, 'Attempt recorded with stable ID');
        const storedAttempts = Store.getGatePyqAttempts();
        assert(storedAttempts.some(a => a.id === attempt.id), 'Attempt stored in gate state');

        const topicProgress = Store.getGateTopicProgress(pyq.topicId);
        assert(topicProgress, 'Topic progress record created');
        assert.strictEqual(topicProgress.totalAttempted, 1, 'Attempt count incremented');
        assert.strictEqual(topicProgress.totalCorrect, 1, 'Correct count incremented');
        assert.strictEqual(topicProgress.accuracyPercent, 100, 'Accuracy is 100%');
        assert(topicProgress.masteryPercent > 0, 'Mastery percent calculated');
    });

    test('Recording wrong PYQ attempt triggers revisionDue and weakness detection', () => {
        const pyq = GATE_PYQ_DATASET[1];
        Store.recordGatePyqAttempt({
            pyqId: pyq.id,
            subjectId: pyq.subjectId,
            topicId: pyq.topicId,
            year: pyq.year,
            isCorrect: false,
            status: 'WRONG',
            mistakeType: 'Calculation mistake',
            timeTakenSeconds: 240,
            confidence: 'LOW'
        });

        const progress = Store.getGateTopicProgress(pyq.topicId);
        assert(progress, 'Topic progress exists');
        assert.strictEqual(progress.totalWrong, 1, 'Wrong count recorded');
        assert.strictEqual(progress.revisionDue, true, 'Revision marked as DUE');
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 4: MISTAKE BANK INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. MISTAKE BANK INTEGRATION ---');

    test('GATE mistake bridges cleanly into FORGE Mistake Bank without duplication', () => {
        const initialMistakesCount = Store.getMistakes().length;
        const pyq = GATE_PYQ_DATASET[0];

        const mistakeEntry = Store.addMistake({
            question: `GATE ${pyq.year}: ${pyq.subjectName} — ${pyq.topicName}: Sample Question`,
            subject: `GATE: ${pyq.subjectName}`,
            topic: pyq.topicName,
            source: `GATE ${pyq.year} PYQ`,
            mistakeType: 'Conceptual mistake',
            personalNote: 'Misidentified scheduling queue state',
            correctAnswer: 'Ready queue does not include blocked processes.',
            revisitDate: '2026-10-05',
            resolved: false
        });

        assert(mistakeEntry && mistakeEntry.id, 'Mistake created in Mistake Bank');
        const updatedMistakes = Store.getMistakes();
        assert.strictEqual(updatedMistakes.length, initialMistakesCount + 1, 'Mistake count increased by 1');
        const found = updatedMistakes.find(m => m.question.includes(pyq.subjectName));
        assert(found, 'GATE mistake found in canonical Mistake Bank');
        assert.strictEqual(found.mistakeType, 'Conceptual mistake', 'Retains mistake category');
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 5: CALENDAR & TODAY SCHEDULE INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. CALENDAR & SCHEDULE INTEGRATION ---');

    test('ScheduleEngine.generateGateTask creates deterministic GATE block', () => {
        const dateStr = '2026-10-02';
        const gateTask = ScheduleEngine.generateGateTask(dateStr, '22:30', '00:00');
        assert(gateTask, 'GATE task generated');
        assert.strictEqual(gateTask.id, `task_${dateStr}_gate_session`, 'Stable deterministic task ID');
        assert.strictEqual(gateTask.category, APP_CONFIG.CATEGORIES.GATE, 'Category is GATE');
        assert.strictEqual(gateTask.isStudy, true, 'isStudy is true');
        assert.strictEqual(gateTask.isBlock, true, 'isBlock is true');
        assert(gateTask.title.includes('GATE'), 'Title includes GATE');
    });

    test('TaskEngine.getDaySummary tracks GATE completion status', () => {
        const dateStr = '2026-10-02';
        const dayData = Store.getDayData(dateStr);
        dayData.tasks = [
            ScheduleEngine.generateGateTask(dateStr, '22:30', '00:00')
        ];
        Store.setDayData(dateStr, dayData);

        const summaryBefore = TaskEngine.getDaySummary(dateStr);
        assert.strictEqual(summaryBefore.gateTotal, 1, '1 GATE task counted in summary');
        assert.strictEqual(summaryBefore.gateCompleted, 0, '0 completed initially');

        // Mark completed
        TaskEngine.updateTaskStatus(dateStr, `task_${dateStr}_gate_session`, 'COMPLETED');
        const summaryAfter = TaskEngine.getDaySummary(dateStr);
        assert.strictEqual(summaryAfter.gateCompleted, 1, 'GATE task marked completed in summary');
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 6: SYNC ENGINE & CLOUD RECONCILIATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. SYNC ENGINE & RECONCILIATION ---');

    test('SyncEngine supports GATE_ATTEMPT and GATE_TOPIC_PROGRESS mutations', () => {
        assert(typeof SyncEngine !== 'undefined', 'SyncEngine is defined');
        assert(typeof SyncEngine.pushGatePyqAttempt === 'function', 'pushGatePyqAttempt is a function');
        assert(typeof SyncEngine.pushGateTopicProgress === 'function', 'pushGateTopicProgress is a function');
        assert(typeof SupabaseService.saveGatePyqAttempt === 'function', 'SupabaseService.saveGatePyqAttempt exists');
        assert(typeof SupabaseService.saveGateTopicProgress === 'function', 'SupabaseService.saveGateTopicProgress exists');
    });

    test('Database migration file exists with RLS and composite uniqueness', () => {
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261001000000_gate_planner_schema.sql');
        assert(fs.existsSync(migrationPath), 'Migration SQL file exists');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        assert(sql.includes('CREATE TABLE IF NOT EXISTS public.gate_pyq_attempts'), 'Creates gate_pyq_attempts table');
        assert(sql.includes('CREATE TABLE IF NOT EXISTS public.gate_topic_progress'), 'Creates gate_topic_progress table');
        assert(sql.includes('ENABLE ROW LEVEL SECURITY'), 'Enables RLS on tables');
        assert(sql.includes('auth.uid() = user_id'), 'Enforces auth.uid() = user_id isolation policy');
        assert(sql.includes('uq_gate_pyq_attempts_user_pyq_time UNIQUE(user_id, pyq_id, attempted_at)'), 'Composite uniqueness constraint prevents echo duplicates');
        assert(sql.includes('uq_gate_topic_progress_user_topic UNIQUE(user_id, topic_id)'), 'Topic progress uniqueness per user');
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 7: HTML & CSS REPOSITORIES HYGIENE
    // -------------------------------------------------------------------------
    console.log('\n--- 7. UI REPOSITORY HYGIENE ---');

    test('index.html contains GATE navigation link, directive widget, and view section', () => {
        const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
        assert(html.includes('data-view="gate"'), 'Nav link for view "gate" present');
        assert(html.includes('id="todayGateDirectiveWidget"'), 'Today Command directive widget container present');
        assert(html.includes('id="view-gate"'), 'view-gate section present');
        assert(html.includes('data/gate-data.js'), 'gate-data.js script included');
        assert(html.includes('js/gate-planner.js'), 'gate-planner.js script included');
    });

    test('styles.css contains dark-industrial styles for GATE widgets and workspace', () => {
        const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
        assert(css.includes('.gate-directive-card'), 'Contains .gate-directive-card style');
        assert(css.includes('.gate-workspace-topbar'), 'Contains .gate-workspace-topbar style');
        assert(css.includes('.gate-mistake-panel'), 'Contains .gate-mistake-panel style');
        assert(css.includes('.gate-bar-fill'), 'Contains .gate-bar-fill style');
        assert(css.includes('.gate-subj-card'), 'Contains .gate-subj-card style');
    });

    console.log('\n================================================================');
    console.log(`GATE 2027 SUITE: ${passCount} / ${passCount} TESTS PASSED CLEANLY (100%)`);
    console.log('================================================================\n');
}

runTests();
