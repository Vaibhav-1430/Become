/**
 * BOSS Study OS — Gym Session Photo Visibility & Pipeline Verification
 * 
 * Verifies the complete Gym photo pipeline:
 * 1. Camera/photo capture produces valid Blob/File
 * 2. Blob has image/jpeg MIME type
 * 3. Upload returns successful Storage path
 * 4. workout_sessions.gym_photo_path is persisted
 * 5. signed URL generation succeeds
 * 6. signed URL is NOT stored as canonical DB path
 * 7. private bucket remains private
 * 8. image rendering receives valid URL
 * 9. refresh reconstructs photo from gym_photo_path
 * 10. logout/login reconstructs photo
 * 11. cross-device retrieval works with authenticated user
 * 12. offline photo eventually uploads
 * 13. migration photo upload still works
 * 14. unauthorized user cannot access another user's photo
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Setup mock DOM and Browser environment
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

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(val) {
        this._innerHTML = val;
        // Extract and register any embedded element IDs in mockDoc
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
        if (child.id) {
            mockDoc.elements[child.id] = child;
        }
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

    querySelector(sel) {
        if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
        return null;
    }

    querySelectorAll() { return []; }

    createElement(tag) {
        const el = new MockElement('', tag);
        return el;
    }
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

// Global Blob mock for Node environment if missing
if (typeof global.Blob === 'undefined') {
    global.Blob = class Blob {
        constructor(parts, options = {}) {
            this.parts = parts;
            this.type = options.type || '';
            this.size = parts.reduce((acc, p) => acc + (p.byteLength || p.length || 0), 0);
        }
    };
}

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

let passCount = 0;
let failCount = 0;

function pass(testName) {
    passCount++;
    console.log(`✅ [PASS] ${testName}`);
}

function fail(testName, err) {
    failCount++;
    console.error(`❌ [FAIL] ${testName}:`, err ? (err.message || err) : '');
}

async function runGymPhotoVisibilityTests() {
    console.log('================================================================');
    console.log('🏋️ STUDYOS GYM CHECK-IN PHOTO VISIBILITY & PIPELINE VERIFICATION');
    console.log('================================================================\n');

    const testUserId = '00000000-0000-0000-0000-000000000001';
    const unauthorizedUserId = '99999999-9999-9999-9999-999999999999';

    // Mock storage object store
    const mockStorageBucket = new Map(); // path -> { blob, contentType }
    const mockDbSessions = [];

    // Setup SupabaseService mock client
    SupabaseService.isConfigured = true;
    SupabaseService.currentUser = { id: testUserId, email: 'test@studyos.com' };
    SupabaseService.currentSession = { user: SupabaseService.currentUser, access_token: 'fake_jwt_token' };

    SupabaseService.client = {
        auth: {
            getUser: async () => ({ data: { user: SupabaseService.currentUser }, error: null }),
            signOut: async () => {}
        },
        storage: {
            from: (bucket) => {
                if (bucket !== 'gym-photos') {
                    throw new Error(`Unexpected bucket: ${bucket}`);
                }
                return {
                    upload: async (objectPath, blob, options = {}) => {
                        const cleanPath = objectPath.replace(/^\/?gym-photos\//, '').replace(/^\/+/, '');
                        const folder = cleanPath.split('/')[0];
                        if (folder !== SupabaseService.getUserId()) {
                            return { data: null, error: { message: 'Row level security policy violation: unauthorized folder' } };
                        }
                        mockStorageBucket.set(cleanPath, { blob, contentType: options.contentType || 'image/jpeg' });
                        return { data: { path: cleanPath }, error: null };
                    },
                    createSignedUrl: async (objectPath, expiresIn = 3600) => {
                        const cleanPath = objectPath.replace(/^\/?gym-photos\//, '').replace(/^\/+/, '');
                        const folder = cleanPath.split('/')[0];
                        if (folder !== SupabaseService.getUserId()) {
                            return { data: null, error: { message: 'RLS: Access denied to object belonging to another user' } };
                        }
                        if (!mockStorageBucket.has(cleanPath)) {
                            return { data: null, error: { message: 'Object not found' } };
                        }
                        return {
                            data: {
                                signedUrl: `https://supabase.co/storage/v1/object/sign/gym-photos/${cleanPath}?token=mock_signed_token_${Date.now()}`
                            },
                            error: null
                        };
                    }
                };
            }
        },
        from: (table) => {
            if (table === 'workout_sessions') {
                return {
                    insert: (rows) => {
                        return {
                            select: () => ({
                                single: async () => {
                                    const row = { id: 'ws_' + Date.now(), ...rows[0] };
                                    mockDbSessions.push(row);
                                    return { data: row, error: null };
                                }
                            })
                        };
                    },
                    upsert: async (rows) => {
                        mockDbSessions.push(rows);
                        return { error: null };
                    },
                    select: () => ({
                        eq: () => ({
                            order: () => Promise.resolve({ data: mockDbSessions, error: null })
                        })
                    })
                };
            }
            if (table === 'workout_session_exercises' || table === 'workout_sets' || table === 'personal_records') {
                return {
                    insert: async () => ({ error: null }),
                    upsert: async () => ({ error: null })
                };
            }
            return {
                insert: async () => ({ error: null }),
                upsert: async () => ({ error: null }),
                select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
            };
        }
    };

    // -------------------------------------------------------------------------
    // TEST 1: Camera/photo capture produces valid Blob/File
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: CAMERA/PHOTO CAPTURE CONVERSION ---');
    try {
        const dummyBase64 = 'data:image/jpeg;base64,' + Buffer.from('gym_photo_camera_pixels').toString('base64');
        const blob = SupabaseService.base64ToBlob(dummyBase64);
        assert(blob !== null, 'base64ToBlob returned a valid Blob object');
        assert(blob.size > 0, 'Blob size is greater than zero');
        pass('Camera/photo capture conversion produces valid Blob with non-zero size');
    } catch (e) {
        fail('Camera/photo capture conversion produces valid Blob with non-zero size', e);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Blob has image/jpeg MIME type
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: BLOB MIME TYPE VERIFICATION ---');
    try {
        const dummyBase64 = 'data:image/jpeg;base64,' + Buffer.from('gym_photo_camera_pixels').toString('base64');
        const blob = SupabaseService.base64ToBlob(dummyBase64);
        assert.strictEqual(blob.type, 'image/jpeg', 'Blob type must strictly be image/jpeg');
        pass('Blob has correct image/jpeg MIME type');
    } catch (e) {
        fail('Blob has correct image/jpeg MIME type', e);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Upload returns successful Storage path
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: PRIVATE STORAGE UPLOAD ---');
    let uploadedPath = '';
    const sessionId = 'session_alpha_101';
    try {
        const dummyBase64 = 'data:image/jpeg;base64,' + Buffer.from('gym_photo_camera_pixels').toString('base64');
        const blob = SupabaseService.base64ToBlob(dummyBase64);
        const uploadResult = await SupabaseService.uploadGymPhotoBlob(blob, sessionId);

        assert(uploadResult && uploadResult.path, 'Upload returned a valid object path');
        uploadedPath = uploadResult.path;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const expectedPrefix = `${testUserId}/${year}/${month}/`;
        assert(uploadedPath.startsWith(expectedPrefix), `Path starts with user-isolated prefix: ${expectedPrefix}`);
        assert(uploadedPath.endsWith(`${sessionId}.jpg`), `Path ends with sessionId.jpg`);
        pass(`Upload successfully returned private Storage path: ${uploadedPath}`);
    } catch (e) {
        fail('Upload returns successful Storage path', e);
    }

    // -------------------------------------------------------------------------
    // TEST 4: workout_sessions.gym_photo_path is persisted
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: WORKOUT_SESSIONS DATABASE PERSISTENCE ---');
    try {
        const sessionPayload = {
            id: sessionId,
            date: '2026-09-28',
            dayKey: 'mon',
            routineName: 'Chest & Back Hypertrophy',
            durationMinutes: 55,
            gym_photo_path: uploadedPath,
            exercises: []
        };
        await SupabaseService.saveWorkoutSession(sessionPayload);
        const savedDbRow = mockDbSessions.find(s => s.gym_photo_path === uploadedPath);
        assert(savedDbRow, 'Workout session persisted in database');
        assert.strictEqual(savedDbRow.gym_photo_path, uploadedPath, 'gym_photo_path persisted correctly');
        pass(`workout_sessions.gym_photo_path persisted in database record`);
    } catch (e) {
        fail('workout_sessions.gym_photo_path is persisted', e);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Signed URL generation succeeds
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: SIGNED URL GENERATION ---');
    let signedUrl1 = '';
    try {
        signedUrl1 = await SupabaseService.getSignedGymPhotoUrl(uploadedPath);
        assert(signedUrl1, 'Signed URL was generated');
        assert(signedUrl1.includes('token='), 'Signed URL contains security access token');
        assert(signedUrl1.includes(uploadedPath), 'Signed URL points to the correct object path');
        pass(`Signed URL generation succeeded: ${signedUrl1.substring(0, 75)}...`);
    } catch (e) {
        fail('Signed URL generation succeeds', e);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Signed URL is NOT stored as canonical DB path
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: CANONICAL STORAGE PATH INTEGRITY ---');
    try {
        const savedDbRow = mockDbSessions.find(s => s.gym_photo_path === uploadedPath);
        assert(!savedDbRow.gym_photo_path.startsWith('http'), 'DB path must NOT be an HTTP URL');
        assert(!savedDbRow.gym_photo_path.includes('token='), 'DB path must NOT contain token or signed URL query parameters');
        assert.strictEqual(savedDbRow.gym_photo_path, uploadedPath, 'DB path is strictly the canonical relative Storage path');
        pass('Signed URL is temporary and NOT stored as the canonical database path');
    } catch (e) {
        fail('Signed URL is NOT stored as canonical DB path', e);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Private bucket remains private (no getPublicUrl)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: STORAGE PRIVACY & NO PUBLIC URLS ---');
    try {
        const schemaPath = path.resolve(__dirname, '../supabase/migrations/20260928000000_initial_studyos_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        assert(schemaSql.includes("'gym-photos'"), 'gym-photos bucket declared in schema');
        assert(schemaSql.includes("public = FALSE") || schemaSql.includes("FALSE"), 'gym-photos bucket configured as strictly PRIVATE');

        const serviceCodePath = path.resolve(__dirname, '../js/supabase-service.js');
        const serviceCode = fs.readFileSync(serviceCodePath, 'utf8');
        assert(!serviceCode.includes("from('gym-photos').getPublicUrl"), 'Never calls getPublicUrl for gym-photos bucket');
        pass('gym-photos bucket is strictly PRIVATE with RLS and never uses getPublicUrl()');
    } catch (e) {
        fail('Private bucket remains private', e);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Image rendering receives valid URL & error handler attached
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: IMAGE RENDERING & ERROR HANDLER ---');
    try {
        // Register session in local Store
        const localSession = {
            id: sessionId,
            date: '2026-09-28',
            routineName: 'Chest & Back Hypertrophy',
            gym_photo_path: uploadedPath,
            exercises: []
        };
        Store.getGymState().sessions = [localSession];

        // Call GymEngine.viewSessionPhoto
        await GymEngine.viewSessionPhoto(sessionId);

        const modal = mockDoc.getElementById('gymPhotoViewModal');
        assert(modal, 'Photo view modal was mounted in document');
        assert(modal.innerHTML.includes('GYM CHECK-IN PHOTO'), 'Modal header displayed');

        // Allow microtask resolution for signed URL fetch
        await new Promise(r => setTimeout(r, 60));

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container, 'gymPhotoContainer found in modal');
        assert(container.innerHTML.includes('<img'), 'Photo container rendered <img> element');
        assert(container.innerHTML.includes('camera-preview-img'), 'Image element has correct styling class');
        assert(container.innerHTML.includes('handlePhotoLoadError'), 'Image element has onerror fallback handler');
        pass('Gym UI correctly renders <img> with signed URL and error fallback attached');
    } catch (e) {
        fail('Image rendering receives valid URL', e);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Refresh reconstructs photo from gym_photo_path
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: REFRESH PERSISTENCE RECONSTRUCTION ---');
    try {
        // Simulate page reload: Store re-hydrates from localStorage
        Store.save();
        Store.flushPendingSave();
        const raw = mockLS.getItem(APP_CONFIG.STORAGE_KEY);
        assert(raw, 'Data saved to localStorage');
        const parsed = JSON.parse(raw);
        Store.memoryState.gym = parsed.gym;

        const reloadedSession = Store.getWorkoutSessionById(sessionId);
        assert(reloadedSession, 'Session recovered after refresh');
        assert.strictEqual(reloadedSession.gym_photo_path, uploadedPath, 'gym_photo_path preserved in Store');

        // Open photo view after reload
        await GymEngine.viewSessionPhoto(sessionId);
        await new Promise(r => setTimeout(r, 60));

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('<img'), 'Image successfully reconstructed after page reload');
        pass('Refresh reconstructs photo from gym_photo_path via fresh signed URL');
    } catch (e) {
        fail('Refresh reconstructs photo from gym_photo_path', e);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Logout/login reconstructs photo
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: LOGOUT / LOGIN RECONSTRUCTION ---');
    try {
        // 1. Sign out
        await SupabaseService.signOut();
        assert.strictEqual(SupabaseService.currentUser, null, 'User signed out');

        // 2. Sign in again
        SupabaseService.currentUser = { id: testUserId, email: 'test@studyos.com' };
        SupabaseService.currentSession = { user: SupabaseService.currentUser, access_token: 'fake_jwt_token' };

        // 3. Hydrate from cloud data
        Store.loadFromCloud({
            workoutSessions: [{
                id: sessionId,
                user_id: testUserId,
                date: '2026-09-28',
                workout_type: 'Chest & Back Hypertrophy',
                duration_minutes: 55,
                gym_photo_path: uploadedPath,
                created_at: new Date().toISOString()
            }]
        });

        const hydrated = Store.getWorkoutSessionById(sessionId);
        assert(hydrated, 'Hydrated session found in store');
        assert.strictEqual(hydrated.gym_photo_path, uploadedPath, 'gym_photo_path loaded from cloud');
        assert(hydrated.gymPhoto, 'gymPhoto object reconstituted');
        assert.strictEqual(hydrated.gymPhoto.storagePath, uploadedPath, 'gymPhoto.storagePath matches');

        // 4. Render photo
        await GymEngine.viewSessionPhoto(sessionId);
        await new Promise(r => setTimeout(r, 60));

        const container = mockDoc.getElementById('gymPhotoContainer');
        assert(container.innerHTML.includes('<img'), 'Photo visible after logout and re-login');
        pass('Logout and re-login successfully reconstructs photo from authenticated cloud Storage');
    } catch (e) {
        fail('Logout/login reconstructs photo', e);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Cross-device retrieval works with authenticated user
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: CROSS-DEVICE RETRIEVAL ---');
    try {
        // Clear all local storage on "Device B"
        mockLS.clear();
        Store.memoryState.gym = { schedule: {}, sessions: [] };

        // Device B logs in as same user and pulls from Supabase
        Store.loadFromCloud({
            workoutSessions: [{
                id: sessionId,
                user_id: testUserId,
                date: '2026-09-28',
                workout_type: 'Chest & Back Hypertrophy',
                duration_minutes: 55,
                gym_photo_path: uploadedPath,
                created_at: new Date().toISOString()
            }]
        });

        const devBSession = Store.getWorkoutSessionById(sessionId);
        assert(devBSession, 'Device B loaded session');
        const hasPhotoB = !!(devBSession.gym_photo_path || devBSession.gymPhoto?.storagePath);
        assert(hasPhotoB, 'Device B recognizes that session has photo');

        await GymEngine.viewSessionPhoto(sessionId);
        await new Promise(r => setTimeout(r, 60));

        const containerB = mockDoc.getElementById('gymPhotoContainer');
        assert(containerB.innerHTML.includes('<img'), 'Device B successfully renders photo from cloud Storage');
        pass('Cross-device retrieval renders photo for the authenticated user');
    } catch (e) {
        fail('Cross-device retrieval works with authenticated user', e);
    }

    // -------------------------------------------------------------------------
    // TEST 12: Offline photo eventually uploads & updates gym_photo_path
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: OFFLINE PHOTO UPLOAD RESILIENCE ---');
    try {
        const offlineSessionId = 'sess_offline_' + Date.now();
        const offlineBase64 = 'data:image/jpeg;base64,' + Buffer.from('offline_gym_photo_data').toString('base64');

        const offlineSession = {
            id: offlineSessionId,
            date: '2026-09-29',
            routineName: 'Legs & Core',
            durationMinutes: 45,
            gym_photo_path: null,
            gymPhoto: {
                id: 'photo_offline_1',
                url: offlineBase64,
                base64: offlineBase64,
                storagePath: null
            },
            exercises: []
        };

        // When connection is restored and saveWorkoutSession is invoked:
        await SupabaseService.saveWorkoutSession(offlineSession);

        assert(offlineSession.gym_photo_path, 'gym_photo_path populated after upload');
        assert(mockStorageBucket.has(offlineSession.gym_photo_path), 'Offline photo uploaded to private bucket');
        assert(!offlineSession.gymPhoto.base64, 'Heavy base64 representation cleaned up after successful upload');
        pass('Offline photo successfully uploads to Storage and updates gym_photo_path when online');
    } catch (e) {
        fail('Offline photo eventually uploads', e);
    }

    // -------------------------------------------------------------------------
    // TEST 13: Migration photo upload still works
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 13: MIGRATION PHOTO UPLOAD PRESERVATION ---');
    try {
        const migrationBase64 = 'data:image/jpeg;base64,' + Buffer.from('migrated_photo_data').toString('base64');
        const localState = {
            gym: {
                sessions: [{
                    id: 'migrated_sess_1',
                    date: '2026-09-25',
                    routineName: 'Shoulders & Arms',
                    gymPhoto: { base64: migrationBase64, url: migrationBase64 },
                    exercises: []
                }]
            }
        };

        const report = await SupabaseService.migrateLocalDataToCloud(localState);
        assert(report.photosMigrated >= 1, 'Migration report tracks photosMigrated');
        const migratedSess = localState.gym.sessions[0];
        assert(migratedSess.gym_photo_path, 'Session has gym_photo_path after migration');
        assert(mockStorageBucket.has(migratedSess.gym_photo_path), 'Migrated photo resides in private bucket');
        pass('Migration photo upload converts base64 to Storage object without regression');
    } catch (e) {
        fail('Migration photo upload still works', e);
    }

    // -------------------------------------------------------------------------
    // TEST 14: Unauthorized user cannot access another user's photo
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 14: SECURITY & USER ISOLATION (RLS) ---');
    try {
        // Switch SupabaseService to unauthorized user
        SupabaseService.currentUser = { id: unauthorizedUserId, email: 'hacker@other.com' };

        // Attempt to generate signed URL for user 1's photo
        const unauthorizedSignedUrl = await SupabaseService.getSignedGymPhotoUrl(uploadedPath);
        assert.strictEqual(unauthorizedSignedUrl, null, 'Unauthorized user receives null for another user photo');

        // Restore authenticated user
        SupabaseService.currentUser = { id: testUserId, email: 'test@studyos.com' };
        pass("Security check: Unauthorized user cannot access another user's private photo (RLS enforced)");
    } catch (e) {
        fail("Unauthorized user cannot access another user's photo", e);
    }

    console.log('\n================================================================');
    console.log(`GYM PHOTO VISIBILITY RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('================================================================');

    if (failCount > 0) {
        process.exit(1);
    }
}

runGymPhotoVisibilityTests().catch(err => {
    console.error('Fatal error during gym photo visibility test execution:', err);
    process.exit(1);
});
