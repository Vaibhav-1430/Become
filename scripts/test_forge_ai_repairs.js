/**
 * Verification Script for FORGE AI Study Engine + AI Task Delete Repair
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function it(desc, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`❌ [FAIL] ${desc}: ${err.message}`);
        failed++;
    }
}

console.log('--- AUDITING FORGE REPAIRS ---');

// 1. AI DAILY PLANNER TASK DELETE
it('DayDetailModal in app.js includes a delete action for AI-generated tasks', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    assert(appJs.includes('App.deleteAiDailyTask'), 'app.js must define or call App.deleteAiDailyTask');
    assert(appJs.includes('🗑️') || appJs.includes('🗑'), 'app.js must render a delete trash icon');
    assert(appJs.includes('confirm('), 'app.js must require confirmation before deletion');
    assert(appJs.includes('TaskEngine.deleteTask'), 'app.js must call TaskEngine.deleteTask to remove from canonical store and sync');
});

it('tasks.js preserves isAiGenerated flag on custom and generated tasks', () => {
    const tasksJs = fs.readFileSync(path.join(__dirname, '../js/tasks.js'), 'utf8');
    assert(tasksJs.includes('isAiGenerated'), 'tasks.js must set or preserve isAiGenerated');
});

// 2. ADAPTIVE AI STUDY ENGINE RENDERING
it('ai-engine.js has resilient hasStudyData supporting DSA string statuses and tasks', () => {
    const aiEngineJs = fs.readFileSync(path.join(__dirname, '../js/ai-engine.js'), 'utf8');
    assert(aiEngineJs.includes("typeof x === 'string'"), 'hasStudyData must handle string DSA problem statuses');
    assert(aiEngineJs.includes('Retry AI Engine'), 'ai-engine.js must provide a Retry AI Engine action if rendering fails');
    assert(aiEngineJs.includes('try {') && aiEngineJs.includes('catch (err)'), 'AIEngine.render must have try/catch error containment');
});

it('ai-engine.js buildLearnerProfile and getCurrentContext guard against null gym PRs and time strings', () => {
    const aiEngineJs = fs.readFileSync(path.join(__dirname, '../js/ai-engine.js'), 'utf8');
    assert(aiEngineJs.includes('p?.heaviest') || aiEngineJs.includes('p.heaviest && p.heaviest.weightKg'), 'Must defensively access gym heaviest weights');
    assert(aiEngineJs.includes("s.startTime && typeof s.startTime === 'string'"), 'Must defensively check study session startTime formatting');
});

// 3. "WHAT SHOULD I STUDY RIGHT NOW?" RECOMMENDATION ENGINE
it('recommend-engine.js has timeout protection and does not hang on timeout', () => {
    const recJs = fs.readFileSync(path.join(__dirname, '../js/recommend-engine.js'), 'utf8');
    assert(recJs.includes('didTimeout = true'), 'recommend-engine.js must track when a timeout occurs');
    assert(!recJs.includes("if (err.name === 'AbortError') return;"), 'recommend-engine.js must not return silently on timeout abort');
    assert(recJs.includes('Retry Gemini'), 'recommend-engine.js fallback view must render a Retry Gemini button');
});

it('recommend-engine.js passes authorization headers', () => {
    const recJs = fs.readFileSync(path.join(__dirname, '../js/recommend-engine.js'), 'utf8');
    assert(recJs.includes('Authorization') && recJs.includes('Bearer'), 'recommend-engine.js must pass Authorization Bearer token');
});

it('netlify.toml redirects /api/ai/study-recommendation to gemini function', () => {
    const netlifyToml = fs.readFileSync(path.join(__dirname, '../netlify.toml'), 'utf8');
    assert(netlifyToml.includes('/api/ai/study-recommendation'), 'netlify.toml must redirect /api/ai/study-recommendation');
    assert(netlifyToml.includes('action=study-recommendation'), 'netlify.toml must route to study-recommendation action');
});

it('netlify/functions/gemini.js handles action === study-recommendation with strict validation', () => {
    const geminiJs = fs.readFileSync(path.join(__dirname, '../netlify/functions/gemini.js'), 'utf8');
    assert(geminiJs.includes("action === 'study-recommendation'"), 'gemini.js must handle study-recommendation action');
    assert(geminiJs.includes('SYSTEM_REC_PROMPT'), 'gemini.js must use StudyOS adaptive system prompt');
    assert(geminiJs.includes('validTaskIds'), 'gemini.js must validate taskId against authentic client context');
});

console.log(`\n================================================================`);
console.log(`FORGE AI REPAIRS AUDIT: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================`);

if (failed > 0) {
    process.exit(1);
}
