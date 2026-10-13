/**
 * BOSS Study OS — Workout History UI & Photo Regeneration Comprehensive Test Suite
 * 
 * Tests:
 * 1. WORKOUT HISTORY UI
 *    - Card rendering and metrics display (Date, Status, Day, Type, Muscles, Duration, Exercises, Sets, Volume)
 *    - Volume only displayed when available (>0)
 *    - Scoped button CSS: EXPORT PDF, DELETE, VIEW WORKOUT, VIEW PHOTO do not stretch to 100% width
 *    - Responsive media queries and mobile wrapping rules
 *    - Preservation of monthly/weekly summaries and export single workout PDF integration
 * 
 * 2. VIEW PHOTO & SIGNED URL REGENERATION
 *    - Valid photo loading
 *    - Expired signed URL regeneration via durable Storage path
 *    - Refresh Photo button forces cache bypass and fresh signed URL
 *    - Recovery of storage path from historical signed URLs
 *    - Recovery of canonical convention path: gym-photos/{user_id}/{year}/{month}/{session_id}.jpg
 *    - Workout without photo produces clean empty state
 *    - Genuinely missing Storage object (404) produces clear message
 *    - Denied Storage access (403/RLS) produces clear message
 *    - Offline/network error handling
 *    - Cross-user security: cannot access another user's photos
 *    - No duplicate sessions created upon photo refresh
 *    - Duplicate in-flight requests deduplicated
 */

const fs = require('fs');
const path = require('path');
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
        return new MockElement('', tag);
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
global.showToast = (msg, type) => {};

// Load dependencies
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { Store } = require('../js/store.js');
global.Store = Store;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

// Load GymExportEngine mock
global.GymExportEngine = {
    lastExportedId: null,
    exportSingleWorkout(id) { this.lastExportedId = id; }
};

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

// Test Runner utilities
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

async function runAllTests() {
    console.log('================================================================');
    console.log('FORGE WEB — WORKOUT HISTORY UI & PHOTO REGENERATION TEST SUITE');
    console.log('================================================================\n');

    // Setup initial store state
    Store.init();
    const currentUserId = 'user_forge_42';
    SupabaseService.currentUser = { id: currentUserId, email: 'athlete@forge.internal' };

    // -------------------------------------------------------------------------
    // PART 1: WORKOUT HISTORY UI TESTS
    // -------------------------------------------------------------------------
    console.log('--- PART 1: WORKOUT HISTORY UI & LAYOUT VERIFICATION ---');

    // Test 1: Multiple workout entries render consistently with accurate metrics
    try {
        const gymState = Store.getGymState();
        gymState.sessions = [
            {
                id: 'sess_oct13',
                userId: currentUserId,
                date: '2026-10-13',
                dayOfWeek: 'Tuesday',
                dayKey: 'tuesday',
                workoutType: 'Legs + Shoulders',
                status: 'completed',
                durationMinutes: 72,
                exerciseCount: 5,
                totalSets: 18,
                totalVolumeKg: 4650,
                targetMuscleGroups: ['Quadriceps', 'Shoulders'],
                gym_photo_path: `${currentUserId}/2026/10/sess_oct13.jpg`,
                exercises: [
                    { name: 'Barbell Squat', muscleGroup: 'Quadriceps', sets: [{ setNumber: 1, weightKg: 100, reps: 8 }] },
                    { name: 'Overhead Press', muscleGroup: 'Shoulders', sets: [{ setNumber: 1, weightKg: 50, reps: 8 }] }
                ]
            },
            {
                id: 'sess_oct11',
                userId: currentUserId,
                date: '2026-10-11',
                dayOfWeek: 'Sunday',
                dayKey: 'sunday',
                workoutType: 'Calisthenics & Core',
                status: 'completed',
                durationMinutes: 45,
                exerciseCount: 4,
                totalSets: 12,
                totalVolumeKg: 0, // Bodyweight: 0 volume
                targetMuscleGroups: ['Core', 'Full Body'],
                exercises: [
                    { name: 'Pull-Ups', muscleGroup: 'Back', sets: [{ setNumber: 1, weightKg: 0, reps: 12 }] }
                ]
            }
        ];

        GymEngine.selectedHistoryMonth = '2026-10';
        const html = GymEngine.renderWorkoutHistoryHtml();

        assert(html.includes('id="history-card-sess_oct13"'), 'Session 1 card rendered');
        assert(html.includes('id="history-card-sess_oct11"'), 'Session 2 card rendered');
        assert(html.includes('Legs + Shoulders'), 'Session 1 workout type rendered');
        assert(html.includes('Calisthenics & Core'), 'Session 2 workout type rendered');
        assert(html.includes('2026-10-13'), 'Session 1 date rendered');
        assert(html.includes('Tuesday'), 'Session 1 day rendered');
        assert(html.includes('72 min'), 'Session 1 duration rendered');
        assert(html.includes('18 sets'), 'Session 1 sets rendered');
        assert(html.includes('4,650 kg'), 'Session 1 volume rendered');
        assert(html.includes('btn-view-photo'), 'Session 1 includes VIEW PHOTO button');
        assert(!html.includes('id="history-card-sess_oct11"') || !html.split('id="history-card-sess_oct11"')[1].split('</div>')[0].includes('btn-view-photo'), 'Session 2 without photo does not render VIEW PHOTO button');

        pass('1. Multiple workout entries render consistently with complete metadata');
    } catch (e) {
        fail('1. Multiple workout entries render consistently', e);
    }

    // Test 2: Volume only displayed when available (>0)
    try {
        const html = GymEngine.renderWorkoutHistoryHtml();
        const card1Html = html.split('id="history-card-sess_oct13"')[1].split('id="history-card-sess_oct11"')[0];
        const card2Html = html.split('id="history-card-sess_oct11"')[1];

        assert(card1Html.includes('Volume: <b>4,650 kg</b>'), 'Card 1 with volume displays volume');
        assert(!card2Html.includes('Volume: <b>0 kg</b>'), 'Card 2 with 0 volume omits volume metric');

        pass('2. Volume metric displayed conditionally when available (>0 kg)');
    } catch (e) {
        fail('2. Volume metric displayed conditionally', e);
    }

    // Test 3: Action buttons CSS rules: EXPORT PDF and DELETE must not stretch 100%
    try {
        const cssPath = path.resolve(__dirname, '../styles.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Check that scoped rules override width: 100%
        assert(cssContent.includes('.h-sess-actions .action-btn-ghost') || cssContent.includes('.history-session-card .action-btn-ghost'), 'Scoped selector for history ghost buttons present');
        assert(cssContent.includes('.h-sess-actions .btn-export-single-workout'), 'Scoped selector for export pdf button present');
        assert(cssContent.includes('.h-sess-actions .btn-delete-workout'), 'Scoped selector for delete button present');
        assert(cssContent.includes('width: auto !important'), 'Scoped buttons override width to auto');
        assert(cssContent.includes('max-width: fit-content'), 'Scoped buttons use fit-content');
        assert(cssContent.includes('height: 32px'), 'Consistent 32px button height specified');

        // Check that the global .action-btn-ghost remains intact for other sidebar elements
        assert(cssContent.includes('.action-btn-ghost {') && cssContent.includes('width: 100%;'), 'Global .action-btn-ghost width: 100% preserved for sidebars');

        pass('3. Scoped CSS rules prevent EXPORT PDF and DELETE from stretching across full card width');
    } catch (e) {
        fail('3. Scoped CSS rules prevent stretching', e);
    }

    // Test 4: VIEW PHOTO and VIEW WORKOUT have consistent sizing & layout
    try {
        const cssPath = path.resolve(__dirname, '../styles.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert(cssContent.includes('.h-sess-actions .btn-view-photo') && cssContent.includes('.h-sess-actions .btn-view-workout'), 'Both VIEW PHOTO and VIEW WORKOUT scoped');
        assert(cssContent.includes('.h-sess-actions'), 'h-sess-actions flex container defined');
        assert(cssContent.includes('gap: 8px'), 'Appropriate button gap specified');

        pass('4. VIEW PHOTO and VIEW WORKOUT have consistent sizing, height, and alignment');
    } catch (e) {
        fail('4. VIEW PHOTO and VIEW WORKOUT have consistent sizing', e);
    }

    // Test 5: Mobile responsiveness and overflow safety
    try {
        const cssPath = path.resolve(__dirname, '../styles.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert(cssContent.includes('@media (max-width: 860px)'), 'Mobile media query breakpoint present');
        assert(cssContent.includes('.history-session-card {\n        flex-direction: column'), 'Mobile layout changes card to vertical column');
        assert(cssContent.includes('.h-sess-actions {\n        justify-content: flex-start'), 'Mobile actions align cleanly to left');

        pass('5. Mobile responsive rules allow natural button wrapping without overflow');
    } catch (e) {
        fail('5. Mobile responsive rules allow wrapping', e);
    }

    // Test 6: PDF export and detail view button functionality
    try {
        GymEngine.exportSingleWorkout('sess_oct13');
        assert.strictEqual(GymExportEngine.lastExportedId, 'sess_oct13', 'Single workout PDF export function invoked successfully');

        pass('6. Existing PDF export integration functions correctly');
    } catch (e) {
        fail('6. Existing PDF export integration', e);
    }

    // -------------------------------------------------------------------------
    // PART 2: VIEW PHOTO & SIGNED URL REGENERATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- PART 2: VIEW PHOTO & SIGNED URL REGENERATION ---');

    // Mock Supabase client for storage
    let mockSignedUrlCalls = [];
    let mockStorageFailMode = null; // 'expired', '404', '403', 'network'

    SupabaseService.client = {
        storage: {
            from: (bucket) => ({
                createSignedUrl: async (cleanPath, expiresIn) => {
                    mockSignedUrlCalls.push({ cleanPath, expiresIn });
                    if (mockStorageFailMode === '404') {
                        return { data: null, error: { status: 404, message: 'Object not found' } };
                    }
                    if (mockStorageFailMode === '403') {
                        return { data: null, error: { status: 403, message: 'Row level security policy violation' } };
                    }
                    if (mockStorageFailMode === 'network') {
                        throw new Error('Network timeout connecting to Supabase Storage');
                    }
                    // Success
                    const freshToken = 'fresh_jwt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                    return {
                        data: {
                            signedUrl: `https://proj.supabase.co/storage/v1/object/sign/gym-photos/${cleanPath}?token=${freshToken}`
                        },
                        error: null
                    };
                }
            })
        }
    };
    SupabaseService.isAuthenticated = () => true;
    SupabaseService.getUserId = () => currentUserId;

    // Test 7: Open workout with valid photo
    try {
        mockSignedUrlCalls = [];
        mockStorageFailMode = null;
        const sessionId = 'sess_valid_photo';
        const sessionPath = `${currentUserId}/2026/10/${sessionId}.jpg`;

        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-13',
            routineName: 'Push Hypertrophy',
            gym_photo_path: sessionPath,
            gym_photo_url: null
        });

        await GymEngine.viewSessionPhoto(sessionId);

        const modal = mockDoc.getElementById('gymPhotoViewModal');
        assert(modal, 'Photo modal mounted');
        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('<img'), 'Container rendered <img> tag');
        assert(container.innerHTML.includes(sessionPath), 'Rendered URL contains session storage path');
        assert(mockSignedUrlCalls.length === 1, 'Supabase createSignedUrl called exactly once');

        pass('7. Open workout with valid photo requests signed URL and displays image');
    } catch (e) {
        fail('7. Open workout with valid photo', e);
    }

    // Test 8: Open workout with an EXPIRED signed URL regenerates fresh signed URL
    try {
        mockSignedUrlCalls = [];
        mockStorageFailMode = null;
        const sessionId = 'sess_expired_url';
        const sessionPath = `${currentUserId}/2026/10/${sessionId}.jpg`;
        const expiredUrl = `https://proj.supabase.co/storage/v1/object/sign/gym-photos/${sessionPath}?token=EXPIRED_OLD_TOKEN_999`;

        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-13',
            routineName: 'Back & Biceps',
            gym_photo_path: sessionPath,
            gym_photo_url: expiredUrl // Expired URL from days ago
        });

        // Open modal
        await GymEngine.viewSessionPhoto(sessionId);

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('<img'), 'Image rendered with regenerated fresh URL');
        assert(!container.innerHTML.includes('EXPIRED_OLD_TOKEN_999'), 'Expired token is NOT rendered');
        assert(container.innerHTML.includes('fresh_jwt_'), 'Fresh signed URL token is rendered');
        assert(mockSignedUrlCalls.length >= 1, 'Fresh signed URL was requested from Supabase');

        pass('8. Workout with expired signed URL automatically regenerates and renders fresh signed URL');
    } catch (e) {
        fail('8. Expired signed URL regeneration', e);
    }

    // Test 9: Refresh Photo button forces cache bypass and generates fresh URL
    try {
        mockSignedUrlCalls = [];
        const sessionId = 'sess_refresh_test';
        const sessionPath = `${currentUserId}/2026/10/${sessionId}.jpg`;

        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-13',
            routineName: 'Chest Focus',
            gym_photo_path: sessionPath
        });

        // 1st load
        await GymEngine.viewSessionPhoto(sessionId);
        const firstCallCount = mockSignedUrlCalls.length;
        assert.strictEqual(firstCallCount, 1, 'First call performed');

        // 2nd load without forceRefresh (served from cache)
        await GymEngine.viewSessionPhoto(sessionId);
        assert.strictEqual(mockSignedUrlCalls.length, 1, 'Second call served from cache without extra network request');

        // 3rd call with forceRefresh = true (simulating clicking "Refresh Photo 🔄")
        await GymEngine.viewSessionPhoto(sessionId, true);
        assert.strictEqual(mockSignedUrlCalls.length, 2, 'Force refresh bypassed cache and requested new signed URL from Supabase');

        pass('9. Refresh Photo explicitly invalidates cache and generates fresh signed URL');
    } catch (e) {
        fail('9. Refresh Photo forces cache bypass', e);
    }

    // Test 10: Historical workout containing only old signed URL recovers Storage path safely
    try {
        mockSignedUrlCalls = [];
        const sessionId = 'sess_legacy_only_url';
        const canonicalRelative = `${currentUserId}/2026/09/${sessionId}.jpg`;
        const legacyFullUrl = `https://myproj.supabase.co/storage/v1/object/sign/gym-photos/${canonicalRelative}?token=ancient_token_from_september`;

        // Historical record had NO gym_photo_path, only old signed URL in gym_photo_url
        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-09-20',
            routineName: 'Delts & Arms',
            gym_photo_path: null,
            gym_photo_url: legacyFullUrl
        });

        await GymEngine.viewSessionPhoto(sessionId);

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('<img'), 'Image rendered');
        assert(mockSignedUrlCalls.length === 1, 'createSignedUrl called with extracted path');
        assert.strictEqual(mockSignedUrlCalls[0].cleanPath, canonicalRelative, 'Path was correctly parsed and recovered from legacy signed URL');

        // Check that Store was updated with durable storage path
        const updatedSession = Store.getWorkoutSessionById(sessionId);
        assert.strictEqual(updatedSession.gym_photo_path, canonicalRelative, 'Durable storage path persisted back into session in Store');

        pass('10. Historical workout with only old signed URL safely recovers and persists durable Storage path');
    } catch (e) {
        fail('10. Historical photo URL recovery', e);
    }

    // Test 11: Canonical convention fallback: gym-photos/{user_id}/{year}/{month}/{session_id}.jpg
    try {
        mockSignedUrlCalls = [];
        const sessionId = 'sess_canonical_convention';
        const expectedCanonical = `${currentUserId}/2026/08/${sessionId}.jpg`;

        // Record with hasPhoto flag/id but lost path and broken relative url
        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-08-15',
            routineName: 'Leg Day Volume',
            gym_photo_path: null,
            gym_photo_url: 'broken-local-photo.jpg',
            gym_photo_id: 'photo_canonical_1'
        });

        await GymEngine.viewSessionPhoto(sessionId);

        assert(mockSignedUrlCalls.length === 1, 'Supabase request made');
        assert.strictEqual(mockSignedUrlCalls[0].cleanPath, expectedCanonical, 'Canonical convention path constructed and validated');

        pass('11. Canonical convention fallback constructs accurate durable Storage path');
    } catch (e) {
        fail('11. Canonical convention fallback', e);
    }

    // Test 12: Workout without any photo shows clean NO PHOTO RECORDED modal state
    try {
        const sessionId = 'sess_no_photo_at_all';
        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-12',
            routineName: 'Mobility & Stretch',
            gym_photo_path: null,
            gym_photo_url: null,
            gymPhoto: null
        });

        await GymEngine.viewSessionPhoto(sessionId);

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('NO PHOTO RECORDED') || container.innerHTML.includes('No gym check-in photo recorded'), 'Container shows no photo recorded');
        assert(!container.innerHTML.includes('<img'), 'No image tag rendered');

        pass('12. Workout without photo displays clear non-crashing empty state');
    } catch (e) {
        fail('12. Workout without photo empty state', e);
    }

    // Test 13: Genuinely missing Storage object (404) displays clear error message
    try {
        mockStorageFailMode = '404';
        const sessionId = 'sess_missing_404';
        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-10',
            routineName: 'Chest & Arms',
            gym_photo_path: `${currentUserId}/2026/10/${sessionId}.jpg`
        });

        await GymEngine.viewSessionPhoto(sessionId);

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('PHOTO NOT FOUND') || container.innerHTML.includes('Photo object was not found in secure storage'), 'Shows 404 missing photo error');
        assert(!container.innerHTML.includes('<img'), 'Does not render fake image');

        pass('13. Genuinely missing Storage object (404) displays clear error message');
    } catch (e) {
        fail('13. Genuinely missing Storage object (404)', e);
    }

    // Test 14: Storage access denied (403 / RLS policy violation) displays clear error message
    try {
        mockStorageFailMode = '403';
        const sessionId = 'sess_denied_403';
        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-09',
            routineName: 'Heavy Deadlifts',
            gym_photo_path: `${currentUserId}/2026/10/${sessionId}.jpg`
        });

        await GymEngine.viewSessionPhoto(sessionId);

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('ACCESS DENIED') || container.innerHTML.includes('denied by storage security policies'), 'Shows 403 access denied error');

        pass('14. Denied Storage access (403) displays clear security error message');
    } catch (e) {
        fail('14. Denied Storage access (403)', e);
    }

    // Test 15: Offline / network connectivity error handling
    try {
        mockStorageFailMode = null;
        global.window.navigator.onLine = false;
        const sessionId = 'sess_offline_test';
        Store.getGymState().sessions.unshift({
            id: sessionId,
            userId: currentUserId,
            date: '2026-10-08',
            routineName: 'Full Body',
            gym_photo_path: `${currentUserId}/2026/10/${sessionId}.jpg`
        });

        await GymEngine.viewSessionPhoto(sessionId);

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('OFFLINE') || container.innerHTML.includes('currently offline'), 'Shows offline error message');

        global.window.navigator.onLine = true;
        pass('15. Offline status displays helpful connection warning without crash');
    } catch (e) {
        global.window.navigator.onLine = true;
        fail('15. Offline status handling', e);
    }

    // Test 16: Cross-user isolation — user cannot request signed URL for another user's photo
    try {
        const otherUserId = 'other_stranger_user_99';
        const otherUserPhotoPath = `${otherUserId}/2026/10/sess_other.jpg`;

        const res = await SupabaseService.getSignedGymPhotoUrl(otherUserPhotoPath);
        assert.strictEqual(res, null, 'Signed URL request for other user is strictly rejected');

        pass('16. Multi-user security: cannot request signed URL for another user (isolated by userId)');
    } catch (e) {
        fail('16. Multi-user security isolation', e);
    }

    // Test 17: Refreshing photo does not create duplicate workout sessions
    try {
        const beforeCount = Store.getGymState().sessions.length;
        const testSession = Store.getGymState().sessions[0];
        const originalId = testSession.id;

        await GymEngine.viewSessionPhoto(originalId, true);

        const afterCount = Store.getGymState().sessions.length;
        assert.strictEqual(afterCount, beforeCount, 'Total session count remains unchanged');
        assert.strictEqual(Store.getGymState().sessions[0].id, originalId, 'Session ID unchanged');

        pass('17. Refreshing photo does not create duplicate sessions in LocalStore');
    } catch (e) {
        fail('17. No duplicate sessions on photo refresh', e);
    }

    // Test 18: In-flight request deduplication prevents duplicate simultaneous calls
    try {
        mockSignedUrlCalls = [];
        mockStorageFailMode = null;
        const targetPath = `${currentUserId}/2026/10/sess_concurrent.jpg`;

        // Launch 3 simultaneous requests for the same path concurrently
        const p1 = SupabaseService.getSignedGymPhotoUrl(targetPath, 3600, true);
        const p2 = SupabaseService.getSignedGymPhotoUrl(targetPath, 3600, false);
        const p3 = SupabaseService.getSignedGymPhotoUrl(targetPath, 3600, false);

        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

        assert(r1 && r2 && r3, 'All concurrent requests resolved with valid URL');
        assert.strictEqual(r1, r2, 'URLs match across concurrent calls');
        assert.strictEqual(mockSignedUrlCalls.length, 1, 'Supabase createSignedUrl was called exactly ONCE');

        pass('18. Duplicate simultaneous requests for the same photo are cleanly deduplicated in-flight');
    } catch (e) {
        fail('18. Duplicate simultaneous requests deduplication', e);
    }

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runAllTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
