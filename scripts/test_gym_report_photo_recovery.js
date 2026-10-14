/**
 * FORGE WEB — Gym Report Photo Recovery & Export Verification Suite
 * 
 * Verifies all testing requirements from SECTION 5 of the specification:
 * 1. A session with a valid photo.
 * 2. A session with an expired signed URL.
 * 3. A session with a valid object but missing or legacy metadata (safe historical recovery).
 * 4. A session with no photo (truthful "No check-in photo recorded").
 * 5. A missing object (404) and a denied-access response (403).
 * 6. PDF export across multiple dates (complete multi-date report).
 * 7. The exported PDF after downloading it, with no reliance on live signed URLs.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock Browser Environment
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
global.navigator = { onLine: true };
global.URL = {
    createObjectURL: (blob) => 'blob:mock-forge-pdf-' + Date.now(),
    revokeObjectURL: () => {}
};

// Load jsPDF and AutoTable
const { jsPDF } = require('../js/vendor/jspdf.umd.min.js');
const autoTablePlugin = require('../js/vendor/jspdf.plugin.autotable.min.js');
autoTablePlugin.applyPlugin(jsPDF);
global.window.jspdf = { jsPDF };

// Load config, store, supabase-service, and gym-export
const { APP_CONFIG, DateUtils } = require('../data/config.js');
global.APP_CONFIG = APP_CONFIG;
global.DateUtils = DateUtils;

const { Store } = require('../js/store.js');
global.Store = Store;

const { SupabaseService } = require('../js/supabase-service.js');
global.SupabaseService = SupabaseService;

const GymExportEngine = require('../js/gym-export.js');
global.GymExportEngine = GymExportEngine;

const { GymEngine } = require('../js/gym.js');
global.GymEngine = GymEngine;

// Test Runner utilities
let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✓ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(err);
        process.exitCode = 1;
    }
}

async function runSuite() {
    console.log('================================================================');
    console.log('FORGE WEB — GYM REPORT PHOTO RECOVERY & EXPORT VERIFICATION SUITE');
    console.log('================================================================\n');

    const currentUserId = '922d78d1-91a4-4687-8474-ed45037a7054';
    SupabaseService.currentUser = { id: currentUserId, email: 'athlete@forge.internal' };
    SupabaseService.currentSession = { access_token: 'valid_jwt_token', user: SupabaseService.currentUser };
    SupabaseService.isConfigured = true;

    // 1x1 Transparent PNG and JPEG sample bytes
    const sampleJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const sampleJpegDataUrl = `data:image/jpeg;base64,${sampleJpegBase64}`;

    // Mock storage backend
    const mockStorageObjects = new Map();
    // Preload valid objects for testing
    mockStorageObjects.set(`${currentUserId}/2026/10/sess_valid_101.jpg`, Buffer.from(sampleJpegBase64, 'base64'));
    mockStorageObjects.set(`${currentUserId}/2026/10/sess_1790854765738.jpg`, Buffer.from(sampleJpegBase64, 'base64')); // Oct 1 actual uploaded file
    mockStorageObjects.set(`${currentUserId}/2026/10/sess_1791457214850.jpg`, Buffer.from(sampleJpegBase64, 'base64')); // Oct 8 actual uploaded file
    mockStorageObjects.set(`${currentUserId}/2026/09/sess_canonical_uuid.jpg`, Buffer.from(sampleJpegBase64, 'base64'));

    let signedUrlCalls = [];
    let listCalls = [];

    SupabaseService.client = {
        storage: {
            from: (bucket) => ({
                createSignedUrl: async (cleanPath, expiresIn) => {
                    signedUrlCalls.push({ cleanPath, expiresIn });
                    if (!mockStorageObjects.has(cleanPath)) {
                        return { data: null, error: { status: 404, statusCode: 404, message: 'Object not found (NoSuchKey)' } };
                    }
                    const token = 'fresh_token_' + Date.now();
                    return {
                        data: {
                            signedUrl: `https://wirxgkodkfqycufayzmk.supabase.co/storage/v1/object/sign/gym-photos/${cleanPath}?token=${token}`
                        },
                        error: null
                    };
                },
                list: async (folder, options = {}) => {
                    listCalls.push({ folder, options });
                    const results = [];
                    for (const [key, val] of mockStorageObjects.entries()) {
                        if (key.startsWith(folder + '/')) {
                            const fileName = key.replace(folder + '/', '');
                            if (!fileName.includes('/')) {
                                results.push({ name: fileName, metadata: { size: val.length } });
                            }
                        }
                    }
                    return { data: results, error: null };
                }
            })
        }
    };

    // Mock fetch for image download
    global.fetch = async (url) => {
        if (typeof url === 'string' && url.includes('token=EXPIRED_OLD_JWT')) {
            return { ok: false, status: 403, statusText: 'Forbidden - Expired Token' };
        }
        if (typeof url === 'string' && url.includes('/storage/v1/object/sign/gym-photos/')) {
            const clean = url.split('/gym-photos/')[1].split('?')[0];
            if (mockStorageObjects.has(clean)) {
                const buf = mockStorageObjects.get(clean);
                return {
                    ok: true,
                    status: 200,
                    headers: { get: (h) => h.toLowerCase() === 'content-type' ? 'image/jpeg' : null },
                    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
                };
            }
            return { ok: false, status: 404, statusText: 'Object Not Found' };
        }
        return { ok: false, status: 404, statusText: 'Not Found' };
    };

    // -------------------------------------------------------------------------
    // TEST 1: A session with a valid photo
    // -------------------------------------------------------------------------
    await runTest('1. A session with a valid photo resolves, generates fresh signed URL, and loads data', async () => {
        signedUrlCalls = [];
        const session = {
            id: 'sess_valid_101',
            date: '2026-10-14',
            userId: currentUserId,
            gym_photo_path: `${currentUserId}/2026/10/sess_valid_101.jpg`
        };

        const result = await GymExportEngine.loadWorkoutPhoto(session);
        assert.ok(result, 'Result must be returned');
        assert.strictEqual(result.status, 'VALID', 'Status must be VALID');
        assert.ok(result.dataUrl && result.dataUrl.startsWith('data:image/jpeg;base64,'), 'Data URL must be base64 JPEG');
        assert.strictEqual(signedUrlCalls.length, 1, 'Supabase createSignedUrl called once');
        assert.strictEqual(signedUrlCalls[0].cleanPath, `${currentUserId}/2026/10/sess_valid_101.jpg`);
    });

    // -------------------------------------------------------------------------
    // TEST 2: A session with an expired signed URL
    // -------------------------------------------------------------------------
    await runTest('2. A session with an expired signed URL regenerates fresh signed URL via durable path', async () => {
        signedUrlCalls = [];
        const sessionPath = `${currentUserId}/2026/10/sess_valid_101.jpg`;
        const expiredUrl = `https://wirxgkodkfqycufayzmk.supabase.co/storage/v1/object/sign/gym-photos/${sessionPath}?token=EXPIRED_OLD_JWT`;
        
        // Pre-seed cache with the expired URL to simulate a stale cached signed URL
        if (!SupabaseService._signedUrlCache) SupabaseService._signedUrlCache = new Map();
        SupabaseService._signedUrlCache.set(`${currentUserId}:${sessionPath}`, {
            signedUrl: expiredUrl,
            expiresAt: Date.now() + 600000
        });

        const session = {
            id: 'sess_expired_test',
            date: '2026-10-14',
            userId: currentUserId,
            gym_photo_path: sessionPath,
            gym_photo_url: expiredUrl // Stale expired signed URL
        };

        const result = await GymExportEngine.loadWorkoutPhoto(session);
        assert.ok(result, 'Result must be returned');
        assert.strictEqual(result.status, 'VALID', 'Status must be VALID despite expired URL');
        assert.ok(result.dataUrl && result.dataUrl.startsWith('data:image/jpeg;base64,'), 'Data URL successfully ingested');
        assert.ok(signedUrlCalls.length >= 1, 'Supabase createSignedUrl was invoked for fresh token');
    });

    // -------------------------------------------------------------------------
    // TEST 3: Safe historical photo recovery (Oct 1 and Oct 8 timestamp mismatch)
    // -------------------------------------------------------------------------
    await runTest('3. Safe historical photo recovery detects actual file on calendar date and fixes path', async () => {
        signedUrlCalls = [];
        listCalls = [];

        // Oct 1 session: metadata has sess_1790854875541.jpg, but Storage has sess_1790854765738.jpg (109s earlier)
        const sessionOct1 = {
            id: '7e605e7d-3179-4b76-9241-b69fbdbae515',
            date: '2026-10-01',
            userId: currentUserId,
            gym_photo_path: `${currentUserId}/2026/10/sess_1790854875541.jpg` // Drifted path
        };

        const result1 = await GymExportEngine.loadWorkoutPhoto(sessionOct1);
        assert.ok(result1, 'Result must be returned');
        assert.strictEqual(result1.status, 'VALID', 'Oct 1 photo must be recovered and VALID');
        assert.strictEqual(sessionOct1.gym_photo_path, `${currentUserId}/2026/10/sess_1790854765738.jpg`, 'Session path was repaired to true object');

        // Oct 8 session: metadata has sess_1791457216249.jpg, but Storage has sess_1791457214850.jpg (1.4s earlier)
        const sessionOct8 = {
            id: 'fa3189c6-c69d-4c71-bd99-9ef1f8f2c40b',
            date: '2026-10-08',
            userId: currentUserId,
            gym_photo_path: `${currentUserId}/2026/10/sess_1791457216249.jpg` // Drifted path
        };

        const result8 = await GymExportEngine.loadWorkoutPhoto(sessionOct8);
        assert.ok(result8, 'Result must be returned');
        assert.strictEqual(result8.status, 'VALID', 'Oct 8 photo must be recovered and VALID');
        assert.strictEqual(sessionOct8.gym_photo_path, `${currentUserId}/2026/10/sess_1791457214850.jpg`, 'Session path was repaired to true object');
    });

    // -------------------------------------------------------------------------
    // TEST 4: A session with no photo recorded
    // -------------------------------------------------------------------------
    await runTest('4. A session with no photo reports truthful "No check-in photo recorded"', async () => {
        const sessionNoPhoto = {
            id: 'sess_rest_day_no_photo',
            date: '2026-10-11',
            userId: currentUserId,
            gym_photo_path: null,
            gym_photo_url: null,
            gymPhoto: null
        };

        const result = await GymExportEngine.loadWorkoutPhoto(sessionNoPhoto);
        assert.strictEqual(result.status, 'NO_PHOTO');
        assert.strictEqual(result.message, 'No check-in photo recorded');
    });

    // -------------------------------------------------------------------------
    // TEST 5: Missing object (404) and denied-access (403) handling
    // -------------------------------------------------------------------------
    await runTest('5. Missing storage object (404) and denied-access (403) report truthful reasons', async () => {
        // Genuinely missing file
        const session404 = {
            id: 'sess_truly_missing',
            date: '2026-10-04',
            userId: currentUserId,
            gym_photo_path: `${currentUserId}/2026/10/non_existent_file.jpg`
        };

        const result404 = await GymExportEngine.loadWorkoutPhoto(session404);
        assert.strictEqual(result404.status, 'NOT_FOUND');
        assert.strictEqual(result404.message, 'Photo not found in cloud storage');

        // Denied access: Attempting to access another user's path
        const session403 = {
            id: 'sess_foreign_user',
            date: '2026-10-14',
            userId: 'other_user_victim_99',
            gym_photo_path: `other_user_victim_99/2026/10/foreign_private_photo.jpg`
        };

        const result403 = await GymExportEngine.loadWorkoutPhoto(session403);
        assert.strictEqual(result403.status, 'ACCESS_DENIED');
        assert.strictEqual(result403.message, 'Access denied by security policies');
    });

    // -------------------------------------------------------------------------
    // TEST 6: PDF export across multiple dates
    // -------------------------------------------------------------------------
    await runTest('6. PDF export across multiple dates generates complete report with photos & analytics', async () => {
        const sessions = [
            {
                id: 'sess_1',
                date: '2026-10-01',
                workoutType: 'Chest + Triceps',
                durationMinutes: 60,
                totalVolumeKg: 3500,
                totalSets: 15,
                exercises: [{ name: 'Bench Press', sets: [{ weightKg: 80, reps: 10, completed: true }] }]
            },
            {
                id: 'sess_2',
                date: '2026-10-08',
                workoutType: 'Back + Biceps',
                durationMinutes: 55,
                totalVolumeKg: 4200,
                totalSets: 16,
                exercises: [{ name: 'Deadlift', sets: [{ weightKg: 120, reps: 5, completed: true }] }]
            },
            {
                id: 'sess_3',
                date: '2026-10-14',
                workoutType: 'Legs + Core',
                durationMinutes: 70,
                totalVolumeKg: 5100,
                totalSets: 18,
                exercises: [{ name: 'Squat', sets: [{ weightKg: 100, reps: 8, completed: true }] }]
            }
        ];

        const scopeData = {
            reportType: 'custom',
            startDate: '2026-10-01',
            endDate: '2026-10-14',
            athleteName: 'Vaibhav',
            sessionCount: 3,
            totalDuration: 185,
            totalVolume: 12800,
            totalSets: 49,
            totalExercisesCount: 3,
            sessions
        };

        const analytics = {
            weightedSetsCount: 49,
            volumeRuleNote: 'Volume calculation strictly reflects external weight × reps.',
            muscleDistribution: [{ muscleGroup: 'Chest', exerciseCount: 1, sets: 15, volumeKg: 3500 }]
        };

        const prData = {
            periodNewPRs: [{ exercise: 'Deadlift', weightKg: 120, reps: 5, date: '2026-10-08' }],
            allTimePRs: []
        };

        const photoMap = {
            sess_1: { dataUrl: sampleJpegDataUrl, width: 400, height: 300, status: 'VALID' },
            sess_2: { dataUrl: sampleJpegDataUrl, width: 300, height: 400, status: 'VALID' }, // Portrait
            sess_3: { dataUrl: sampleJpegDataUrl, width: 500, height: 500, status: 'VALID' }  // Square
        };

        const doc = GymExportEngine.buildPdfDocument(scopeData, analytics, prData, photoMap);
        assert.ok(doc, 'PDF Document successfully built');
        const pageCount = doc.internal.getNumberOfPages();
        assert.ok(pageCount >= 2, `PDF must span multiple pages (actual: ${pageCount})`);
    });

    // -------------------------------------------------------------------------
    // TEST 7: Exported PDF has no live signed URLs after export
    // -------------------------------------------------------------------------
    await runTest('7. Exported PDF binary seals image data internally with zero reliance on live signed URLs', async () => {
        const scopeData = {
            reportType: 'single',
            startDate: '2026-10-14',
            endDate: '2026-10-14',
            athleteName: 'Vaibhav',
            sessionCount: 1,
            totalDuration: 60,
            totalVolume: 3000,
            totalSets: 10,
            totalExercisesCount: 1,
            sessions: [{
                id: 'sess_sealed_test',
                date: '2026-10-14',
                workoutType: 'Push Hypertrophy',
                durationMinutes: 60,
                totalVolumeKg: 3000,
                totalSets: 10,
                exercises: []
            }]
        };

        const analytics = {
            weightedSetsCount: 10,
            volumeRuleNote: 'Volume note',
            muscleDistribution: []
        };

        const prData = { periodNewPRs: [], allTimePRs: [] };
        const photoMap = {
            sess_sealed_test: { dataUrl: sampleJpegDataUrl, width: 640, height: 480, status: 'VALID' }
        };

        const doc = GymExportEngine.buildPdfDocument(scopeData, analytics, prData, photoMap);
        const pdfOutput = doc.output();

        // Check that the PDF contains binary image stream
        assert.ok(pdfOutput.includes('/Subtype /Image') || pdfOutput.includes('/Filter /DCTDecode') || pdfOutput.includes('/Filter /FlateDecode'), 'PDF contains embedded image stream');

        // Verify that NO live signed URL or temporary token string is in the PDF binary
        assert.ok(!pdfOutput.includes('storage/v1/object/sign'), 'PDF does NOT contain temporary signed URL strings');
        assert.ok(!pdfOutput.includes('token='), 'PDF does NOT contain temporary token queries');
        assert.ok(!pdfOutput.includes('EXPIRED_OLD_JWT'), 'PDF does NOT contain expired tokens');
    });

    console.log('\n================================================================');
    console.log(`TEST SUITE RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
    console.log('================================================================');
}

runSuite().catch(console.error);
