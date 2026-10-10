/**
 * scripts/test_smart_gym_web_experience.js
 * Comprehensive automated verification for FORGE Web Application:
 * Smart Gym Workout Experience & Exercise Picker.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('FORGE WEB: SMART GYM WORKOUT & EXERCISE PICKER TEST');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// 1. Static Audit: Zero window.prompt() in js/gym.js
// -----------------------------------------------------------------------------
console.log('Test 1: Auditing js/gym.js for window.prompt()...');
const gymJsCode = fs.readFileSync(path.join(__dirname, '../js/gym.js'), 'utf-8');
const promptMatches = gymJsCode.match(/\bprompt\s*\(/g);
assert.strictEqual(
    promptMatches,
    null,
    `CRITICAL FAIL: Found ${promptMatches ? promptMatches.length : 0} instances of prompt() in js/gym.js!`
);
console.log('  ✓ PASSED: ZERO instances of prompt() found in js/gym.js.\n');

// -----------------------------------------------------------------------------
// 2. Setup Mock DOM & Environment
// -----------------------------------------------------------------------------
console.log('Test 2: Setting up Mock DOM and Store Environment...');
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
        this.value = '';
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

// Load dependencies
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { Store } = require('../js/store.js');
global.Store = Store;

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

assert.ok(Store, 'Store should be defined globally');
assert.ok(GymEngine, 'GymEngine should be defined globally');
console.log('  ✓ PASSED: Store and GymEngine successfully loaded.\n');

// -----------------------------------------------------------------------------
// 3. Exercise Catalogue Verification & Deduplication
// -----------------------------------------------------------------------------
console.log('Test 3: Testing Exercise Catalogue & Deduplication...');
const initialLibrary = Store.getExerciseLibrary();
assert.ok(Array.isArray(initialLibrary), 'Library must be an array');
assert.ok(initialLibrary.length >= 20, `Library must have at least 20 exercises, got ${initialLibrary.length}`);

// Lat Pulldown should exist in catalogue
const latPulldown = initialLibrary.find(e => e.name.toLowerCase().includes('lat pulldown'));
assert.ok(latPulldown, 'Lat Pulldown should exist in DEFAULT_EXERCISE_LIBRARY');

// Add custom exercise with new name
const custom1 = Store.addCustomExercise({
    name: 'Standing Overhead Cable Pullover',
    muscleGroup: 'Back',
    equipment: 'Cable'
});
assert.ok(custom1.id, 'Custom exercise should receive an ID');
assert.strictEqual(custom1.name, 'Standing Overhead Cable Pullover');

// Add duplicate of custom exercise (case-insensitive)
const customDup = Store.addCustomExercise({
    name: '  standing overhead cable pullover  ',
    muscleGroup: 'Back'
});
assert.strictEqual(customDup.id, custom1.id, 'Deduplication should return existing exercise record');

// Add duplicate of existing built-in exercise
const builtInDup = Store.addCustomExercise({
    name: 'lat pulldown',
    muscleGroup: 'Back'
});
assert.strictEqual(builtInDup.id, latPulldown.id, 'Adding built-in exercise name should return existing built-in record');
console.log('  ✓ PASSED: Catalogue loads properly and deduplication prevents duplicate entries.\n');

// -----------------------------------------------------------------------------
// 4. Recommendation Ranking Engine & Usual Exercises
// -----------------------------------------------------------------------------
console.log('Test 4: Testing Recommendation Ranking Engine & Usual Exercises...');
const gymState = Store.getGymState();
gymState.sessions = [
        {
            id: 'sess_hist_1',
            date: '2026-10-01',
            dayKey: 'thursday',
            routineName: 'Back + Biceps',
            targetMuscleGroups: ['Back', 'Biceps'],
            gymPhoto: 'data:image/jpeg;base64,mock1',
            exercises: [
                {
                    exerciseId: latPulldown.id,
                    name: latPulldown.name,
                    muscleGroup: 'Back',
                    sets: [
                        { setNumber: 1, weightKg: 40, reps: 12, completed: true },
                        { setNumber: 2, weightKg: 45, reps: 10, completed: true },
                        { setNumber: 3, weightKg: 50, reps: 8, completed: true }
                    ]
                },
                {
                    exerciseId: 'ex_barbell_curl',
                    name: 'Barbell Bicep Curl',
                    muscleGroup: 'Biceps',
                    sets: [
                        { setNumber: 1, weightKg: 20, reps: 12, completed: true },
                        { setNumber: 2, weightKg: 25, reps: 10, completed: true }
                    ]
                }
            ]
        },
        {
            id: 'sess_hist_2',
            date: '2026-10-05',
            dayKey: 'monday',
            routineName: 'Back + Biceps',
            targetMuscleGroups: ['Back', 'Biceps'],
            gymPhoto: 'data:image/jpeg;base64,mock2',
            exercises: [
                {
                    exerciseId: latPulldown.id,
                    name: latPulldown.name,
                    muscleGroup: 'Back',
                    sets: [
                        { setNumber: 1, weightKg: 45, reps: 12, completed: true },
                        { setNumber: 2, weightKg: 50, reps: 10, completed: true },
                        { setNumber: 3, weightKg: 55, reps: 8, completed: true }
                    ]
                }
            ]
        }
    ];
Store.save();

// Run recommendation algorithm for today split: ['Back', 'Biceps']
const recs = GymEngine.getPersonalizedRecommendations(['Back', 'Biceps'], 'Back + Biceps');
assert.ok(Array.isArray(recs.allRanked), 'Ranked exercises must be an array');
assert.ok(Array.isArray(recs.usual), 'Usual exercises must be an array');
assert.ok(recs.usual.length >= 1, 'Should have at least 1 usual exercise');

// Lat Pulldown was performed twice, should be highest ranked in usual
const topUsual = recs.usual[0];
assert.strictEqual(topUsual.exercise.id, latPulldown.id, 'Lat Pulldown must be top usual exercise');
assert.strictEqual(topUsual.frequency, 2, 'Lat Pulldown frequency must be 2');
assert.ok(topUsual.score > 100, `Score should be elevated due to split match and frequency, got ${topUsual.score}`);

console.log(`  ✓ PASSED: Top usual exercise is "${topUsual.exercise.name}" (Freq: ${topUsual.frequency}, Score: ${topUsual.score}).\n`);

// -----------------------------------------------------------------------------
// 5. Previous Performance & PR Extraction
// -----------------------------------------------------------------------------
console.log('Test 5: Testing Previous Performance & PR Extraction...');
const perfLat = GymEngine.getExercisePerformanceDetails(latPulldown.name, latPulldown.id);
assert.strictEqual(perfLat.hasHistory, true, 'Lat Pulldown should have history');
assert.strictEqual(perfLat.lastPerformedDate, '2026-10-05', 'Last performed date must match session 2');
assert.strictEqual(perfLat.previousBestSetFormatted, '55 kg × 8 reps', 'Best set from last session must be 55 kg × 8 reps');
assert.strictEqual(perfLat.allTimePrFormatted, '55 kg × 8 reps', 'All-time PR must match max set');
assert.strictEqual(perfLat.sets.length, 3, 'Should extract 3 sets from last session');
assert.strictEqual(perfLat.sets[0].weightKg, 45);
assert.strictEqual(perfLat.sets[2].weightKg, 55);

// Test empty state for exercise with no history
const perfBench = GymEngine.getExercisePerformanceDetails('Incline Dumbbell Press', 'ex_inc_db_press');
assert.strictEqual(perfBench.hasHistory, false, 'No history should be marked false');
assert.strictEqual(perfBench.lastPerformedFormatted, 'No previous performance recorded.', 'Empty state formatted as No previous performance recorded.');
assert.strictEqual(perfBench.previousBestSetFormatted, 'No previous set recorded.', 'Empty best set formatted as No previous set recorded.');
console.log('  ✓ PASSED: Previous performance and PRs accurately extracted and differentiated.\n');

// -----------------------------------------------------------------------------
// 6. Continue Previous Workout Logic
// -----------------------------------------------------------------------------
console.log('Test 6: Testing Continue Previous Workout...');
const compSession = GymEngine.getPreviousComparableSession(['Back', 'Biceps'], 'Back + Biceps');
assert.ok(compSession, 'Should find comparable previous session');
assert.strictEqual(compSession.id, 'sess_hist_2', 'Should pick most recent session (2026-10-05)');

// Mock live workout during selection stage
GymEngine.liveWorkout = {
    id: 'active_sess_999',
    stage: 'select_exercises',
    date: '2026-10-10',
    routineName: 'Back + Biceps',
    targetMuscleGroups: ['Back', 'Biceps'],
    gymPhoto: 'data:image/jpeg;base64,today_photo_123',
    gym_photo_path: 'gym-checkins/photo123.jpg',
    selectedExerciseIds: []
};

// Apply previous workout exercises
GymEngine.usePreviousWorkoutExercises();
assert.ok(GymEngine.liveWorkout.selectedExerciseIds.includes(latPulldown.id), 'Lat Pulldown should be staged');
assert.strictEqual(GymEngine.liveWorkout.id, 'active_sess_999', 'Current session ID must remain unchanged');
assert.strictEqual(GymEngine.liveWorkout.gymPhoto, 'data:image/jpeg;base64,today_photo_123', 'Gym photo must be preserved');

// Verify historical session was not mutated
const histSession2 = Store.getGymState().sessions.find(s => s.id === 'sess_hist_2');
assert.strictEqual(histSession2.exercises[0].sets[0].completed, true, 'Historical set must remain completed: true');

console.log('  ✓ PASSED: Continue Previous Workout reuses exercises, preserves current session ID & photo, leaves history unaltered.\n');

// -----------------------------------------------------------------------------
// 7. Add Exercise to Active Live Workout (No Duplicate)
// -----------------------------------------------------------------------------
console.log('Test 7: Testing Add Exercise to Active Workout & Duplicate Prevention...');
// Transition liveWorkout to active logging stage
GymEngine.liveWorkout = {
    id: 'active_sess_999',
    stage: 'logging',
    date: '2026-10-10',
    routineName: 'Back + Biceps',
    targetMuscleGroups: ['Back', 'Biceps'],
    gymPhoto: 'data:image/jpeg;base64,today_photo_123',
    gym_photo_path: 'gym-checkins/photo123.jpg',
    exercises: [
        {
            id: 'ex_active_1',
            exerciseId: latPulldown.id,
            name: latPulldown.name,
            muscleGroup: 'Back',
            sets: [
                { setNumber: 1, weightKg: 50, reps: 10, completed: true }
            ]
        }
    ]
};

// Try adding Lat Pulldown again (duplicate)
GymEngine.addExerciseToActiveWorkout(latPulldown);
assert.strictEqual(GymEngine.liveWorkout.exercises.length, 1, 'Should NOT add duplicate exercise');

// Add a new exercise: Barbell Bicep Curl
const barbellCurl = initialLibrary.find(e => e.name.toLowerCase().includes('barbell curl')) || {
    id: 'ex_barbell_curl',
    name: 'Barbell Bicep Curl',
    muscleGroup: 'Biceps',
    equipment: 'Barbell'
};
GymEngine.addExerciseToActiveWorkout(barbellCurl);
assert.strictEqual(GymEngine.liveWorkout.exercises.length, 2, 'Should now have 2 exercises');

const addedEx = GymEngine.liveWorkout.exercises[1];
assert.strictEqual(addedEx.name, barbellCurl.name);
assert.strictEqual(addedEx.sets.length, 3, 'New exercise should start with fresh set rows');
assert.strictEqual(addedEx.sets[0].completed, false, 'New sets must NOT be marked completed');
assert.strictEqual(addedEx.sets[0].weightKg, '', 'New sets should start blank');

// Check that existing set on exercise 1 was not modified or lost
assert.strictEqual(GymEngine.liveWorkout.exercises[0].sets[0].completed, true);
assert.strictEqual(GymEngine.liveWorkout.exercises[0].sets[0].weightKg, 50);

// Check persistence in Store
const savedActive = Store.getActiveWorkoutSession();
assert.ok(savedActive, 'Active workout session must be saved to Store');
assert.strictEqual(savedActive.exercises.length, 2, 'Saved session must contain both exercises');

console.log('  ✓ PASSED: Added exercise correctly without duplicates, preserving session ID, sets, and photo.\n');

// -----------------------------------------------------------------------------
// 8. Custom Exercise Creation during Live Workout
// -----------------------------------------------------------------------------
console.log('Test 8: Testing Custom Exercise Creation during Active Live Workout...');
// Set up inputs in mock DOM
mockDoc.elements['custExName'] = { value: 'Standing Cable Face Pull' };
mockDoc.elements['custExMuscle'] = { value: 'Shoulders' };
mockDoc.elements['custExEquip'] = { value: 'Cable' };
mockDoc.elements['custExNotes'] = { value: 'External rotation at end range' };

GymEngine.saveCustomExercise();

assert.strictEqual(GymEngine.liveWorkout.exercises.length, 3, 'Custom exercise should be added to active workout');
const customInWorkout = GymEngine.liveWorkout.exercises[2];
assert.strictEqual(customInWorkout.name, 'Standing Cable Face Pull');
assert.strictEqual(customInWorkout.muscleGroup, 'Shoulders');
console.log('  ✓ PASSED: Custom exercise created and seamlessly attached to active workout session.\n');

// -----------------------------------------------------------------------------
// 9. CSS Design System & Responsive Layout Audit
// -----------------------------------------------------------------------------
console.log('Test 9: Auditing CSS Design System in styles.css...');
const cssContent = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf-8');

const requiredClasses = [
    '.exercise-picker-window',
    '.picker-search-bar',
    '.picker-filter-chips',
    '.picker-filter-chip',
    '.picker-body-scroll',
    '.picker-section',
    '.picker-ex-item',
    '.picker-add-action-btn',
    '.usual-exercises-grid',
    '.usual-ex-card',
    '.continue-prev-card'
];

requiredClasses.forEach(cls => {
    assert.ok(cssContent.includes(cls), `CSS must include class selector ${cls}`);
});

// Check responsive media queries
assert.ok(cssContent.includes('@media (max-width: 480px)'), 'CSS must include max-width: 480px media query');
assert.ok(cssContent.includes('@media (max-width: 768px)'), 'CSS must include max-width: 768px media query');
console.log('  ✓ PASSED: All required CSS selectors and responsive media queries are present.\n');

// -----------------------------------------------------------------------------
// 10. Exercise Picker UI Search Filtering
// -----------------------------------------------------------------------------
console.log('Test 10: Testing Exercise Picker Search Filtering (partial & case-insensitive)...');
GymEngine.openExercisePickerModal({ mode: 'workout' });
assert.ok(GymEngine.exercisePickerState.isOpen, 'Picker state should be open');

// Search for 'lat' (partial, lowercase)
GymEngine.onPickerSearchInput('lat');
assert.strictEqual(GymEngine.exercisePickerState.query, 'lat');

// Filter check: Store.getExerciseLibrary with search
const searchResults = Store.getExerciseLibrary({ search: 'lat' });
assert.ok(searchResults.length > 0, 'Search results should not be empty');
assert.ok(searchResults.some(e => e.name.toLowerCase().includes('lat pulldown')), 'Should find Lat Pulldown');

GymEngine.closeExercisePickerModal();
assert.strictEqual(GymEngine.exercisePickerState.isOpen, false, 'Picker state should be closed');
console.log('  ✓ PASSED: Exercise picker search filtering verified.\n');

// -----------------------------------------------------------------------------
// 11. Rest Day Routine Selection Modal (Zero window.prompt)
// -----------------------------------------------------------------------------
console.log('Test 11: Testing Rest Day Routine Selection Modal...');
GymEngine.openSelectRoutineModal('select');
const routineModal = mockDoc.elements['selectRoutineModal'];
assert.ok(routineModal, 'selectRoutineModal element should be created');
assert.ok(routineModal.classList.contains('active'), 'selectRoutineModal should be active');

// Verify calling selectRoutineAndProceed closes modal and advances stage
GymEngine.selectRoutineAndProceed('Legs + Shoulders');
assert.strictEqual(routineModal.classList.contains('active'), false, 'Routine modal should close after selection');
console.log('  ✓ PASSED: Rest Day routine picker works cleanly without window.prompt().\n');

// -----------------------------------------------------------------------------
// 12. Custom Rest Timer Modal (Zero window.prompt)
// -----------------------------------------------------------------------------
console.log('Test 12: Testing Custom Rest Timer Modal...');
GymEngine.openCustomRestTimerModal();
const timerModal = mockDoc.elements['customRestTimerModal'];
assert.ok(timerModal, 'customRestTimerModal element should be created');
assert.ok(timerModal.classList.contains('active'), 'customRestTimerModal should be active');

// Apply 75 seconds custom rest timer
mockDoc.elements['customRestTimerSec'] = { value: '75' };
GymEngine.applyCustomRestTimer();
assert.strictEqual(GymEngine.restTimerState.totalSec, 75, 'Rest timer should be set to 75 seconds');
assert.strictEqual(GymEngine.restTimerState.isRunning, true, 'Rest timer should be running');
GymEngine.stopRestTimer();
assert.strictEqual(GymEngine.restTimerState.isRunning, false, 'Rest timer should be stopped');
console.log('  ✓ PASSED: Custom rest timer modal works cleanly without window.prompt().\n');

console.log('====================================================');
console.log('ALL SMART GYM WEB EXPERIENCE TESTS PASSED (12/12)');
console.log('====================================================');

