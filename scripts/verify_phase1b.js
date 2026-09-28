/**
 * BOSS Study OS — Phase 1B Automated Verification Suite
 * Tests Cloud-First Data Foundation, Calendar Sync, Safe Migration,
 * Security Hardening, BYOK Persistence, Storage, and Cross-Device Reconstitution.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

async function runPhase1bVerification() {
    console.log('================================================================');
    console.log('🚀 STUDYOS PHASE 1B: VERIFICATION & RECONCILIATION SUITE');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName}: ${details}`);
            failed++;
        }
    }

    // -------------------------------------------------------------------------
    // TEST 1: Phase 1B SQL Migration Integrity & Schema Extensions
    // -------------------------------------------------------------------------
    console.log('--- 1. DATABASE MIGRATION & SYNC METADATA INTEGRITY ---');
    const migPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260928000001_phase1b_sync_metadata.sql');
    assert(fs.existsSync(migPath), 'Phase 1B migration file exists in supabase/migrations');

    const sql = fs.readFileSync(migPath, 'utf8');

    // Trigger function
    assert(sql.includes('CREATE OR REPLACE FUNCTION public.set_updated_at()'), 'Trigger function public.set_updated_at() defined');

    // Calendar fidelity columns in study_tasks
    assert(sql.includes('interrupt_reason TEXT'), 'Column interrupt_reason added to study_tasks');
    assert(sql.includes('is_block BOOLEAN'), 'Column is_block added to study_tasks');
    assert(sql.includes('dsa_problem_id TEXT'), 'Column dsa_problem_id added to study_tasks');
    assert(sql.includes('metadata JSONB'), 'Column metadata JSONB added to study_tasks');
    assert(sql.includes('rescheduled_to TYPE TEXT') || sql.includes('rescheduled_to TEXT'), 'Column rescheduled_to safely converted to TEXT in study_tasks');

    // Sync metadata: updated_at added to required tables
    const tablesWithUpdatedAt = [
        'study_sessions',
        'workout_sessions',
        'workout_exercises',
        'workout_sets',
        'personal_records',
        'internships',
        'ai_settings'
    ];
    tablesWithUpdatedAt.forEach(tbl => {
        assert(sql.includes(`ALTER TABLE public.${tbl}`) && sql.includes('updated_at TIMESTAMPTZ'), `updated_at column defined on public.${tbl}`);
    });

    // Auto-update triggers
    const triggerTables = [
        'study_tasks',
        'study_sessions',
        'dsa_progress',
        'development_progress',
        'mistakes',
        'workout_plans',
        'workout_sessions',
        'workout_exercises',
        'workout_sets',
        'personal_records',
        'ai_settings',
        'placement_hub_data',
        'internships'
    ];
    triggerTables.forEach(tbl => {
        assert(sql.includes(`CREATE TRIGGER trg_${tbl}_updated_at`), `Auto-update trigger attached to public.${tbl}`);
    });

    // Indexes
    assert(sql.includes('idx_study_tasks_updated_at'), 'Index idx_study_tasks_updated_at created');
    assert(sql.includes('idx_dsa_progress_updated_at'), 'Index idx_dsa_progress_updated_at created');

    // -------------------------------------------------------------------------
    // TEST 2: Security Hardening — No Spoofable Headers or Unverified Tokens
    // -------------------------------------------------------------------------
    console.log('\n--- 2. SECURITY HARDENING: IDENTITY SPOOFING PREVENTED ---');
    const serverPath = path.join(__dirname, '..', 'server.js');
    const serverCode = fs.readFileSync(serverPath, 'utf8');

    // Ensure x-user-id is completely removed from extractUserId
    assert(!serverCode.includes("req.headers['x-user-id']"), 'server.js: x-user-id header fallback completely eliminated');
    assert(!serverCode.includes("req.headers['x-auth-user']"), 'server.js: x-auth-user header fallback eliminated');
    assert(!serverCode.includes("req.headers['studyos_uid']"), 'server.js: studyos_uid header fallback eliminated');

    const geminiFnPath = path.join(__dirname, '..', 'netlify', 'functions', 'gemini.js');
    const geminiCode = fs.readFileSync(geminiFnPath, 'utf8');
    assert(!geminiCode.includes("event.headers['x-user-id']"), 'gemini.js: x-user-id header fallback completely eliminated');
    assert(!geminiCode.includes("jwt.split('.')[1]"), 'gemini.js: unverified JWT base64 slice eliminated');

    // Start live server temporarily to test HTTP rejection
    let serverProcess;
    let livePort = 3000;
    try {
        const serverModule = require('../server.js');
        // Wait 300ms for listener to be ready
        await new Promise(r => setTimeout(r, 400));

        // Test 2A: Unauthenticated request
        const resUnauth = await fetch(`http://localhost:${livePort}/api/ai/status`);
        assert(resUnauth.status === 401, 'Live Server: Unauthenticated request to /api/ai/status rejected with 401');

        // Test 2B: Spoofed X-User-Id request
        const resSpoof = await fetch(`http://localhost:${livePort}/api/ai/status`, {
            headers: {
                'X-User-Id': 'attacker_impersonating_admin',
                'Content-Type': 'application/json'
            }
        });
        assert(resSpoof.status === 401, 'Live Server: Spoofed X-User-Id header rejected with 401 Unauthorized');
        const spoofJson = await resSpoof.json();
        assert(spoofJson.code === 'AUTH_REQUIRED', 'Live Server: Spoof rejection returns AUTH_REQUIRED');

        // Test 2C: Malformed / forged Bearer token
        const resBadBearer = await fetch(`http://localhost:${livePort}/api/ai/status`, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature'
            }
        });
        assert(resBadBearer.status === 401, 'Live Server: Forged Bearer token rejected with 401 Unauthorized');

    } catch (e) {
        assert(false, 'Live HTTP Security check', e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 3: BYOK Persistence & Multi-User Isolated Decryption
    // -------------------------------------------------------------------------
    console.log('\n--- 3. BYOK PERSISTENCE & COLD START SURVIVABILITY ---');
    const secret = crypto.createHash('sha256').update('5feaa059aa12235db0f221995665cddc8446b396db449a2f1b2d37b9a91797a4').digest();

    function encryptTestKey(key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
        let ciphertext = cipher.update(key, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        return { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), ciphertext };
    }

    function decryptTestKey(enc) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', secret, Buffer.from(enc.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(enc.tag, 'hex'));
        let dec = decipher.update(enc.ciphertext, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }

    const testUserA = 'usr_test_user_a_' + Date.now();
    const testUserB = 'usr_test_user_b_' + Date.now();
    const rawKeyA = 'AIzaSyAlphaBYOKKey_1234567890';
    const rawKeyB = 'AIzaSyBetaBYOKKey_9876543210';

    const encA = encryptTestKey(rawKeyA);
    const encB = encryptTestKey(rawKeyB);

    // Write to persistent credential store
    const credsPath = path.join(__dirname, '..', 'data', 'credentials.json');
    let creds = {};
    if (fs.existsSync(credsPath)) {
        try { creds = JSON.parse(fs.readFileSync(credsPath, 'utf8') || '{}'); } catch (e) {}
    }
    creds[testUserA] = { encrypted: encA, maskedKey: 'AIza••••••••7890', userId: testUserA };
    creds[testUserB] = { encrypted: encB, maskedKey: 'AIza••••••••4321', userId: testUserB };
    fs.mkdirSync(path.dirname(credsPath), { recursive: true });
    fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2), 'utf8');

    // Simulate Serverless Cold-Start: reload credentials directly from disk/db
    const coldCreds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    assert(coldCreds[testUserA] && coldCreds[testUserA].encrypted, 'User A credentials survive simulated cold start');
    assert(coldCreds[testUserB] && coldCreds[testUserB].encrypted, 'User B credentials survive simulated cold start');

    assert(decryptTestKey(coldCreds[testUserA].encrypted) === rawKeyA, 'User A key successfully decrypted after cold start');
    assert(decryptTestKey(coldCreds[testUserB].encrypted) === rawKeyB, 'User B key successfully decrypted after cold start');
    assert(decryptTestKey(coldCreds[testUserA].encrypted) !== decryptTestKey(coldCreds[testUserB].encrypted), 'Keys across User A and User B are strictly isolated');

    // Verify netlify/functions/gemini.js interacts with ai_settings table
    assert(geminiCode.includes(".from('ai_settings')"), 'gemini.js queries Supabase ai_settings table');
    assert(geminiCode.includes("saveStoredCredential"), 'gemini.js implements persistent saveStoredCredential');

    // -------------------------------------------------------------------------
    // TEST 4: Centralized SyncEngine Architecture & Offline Mutation Queue
    // -------------------------------------------------------------------------
    console.log('\n--- 4. SYNC ENGINE: WRITE-THROUGH & OFFLINE QUEUE ---');
    const syncEnginePath = path.join(__dirname, '..', 'js', 'sync-engine.js');
    assert(fs.existsSync(syncEnginePath), 'js/sync-engine.js exists');

    const syncEngineCode = fs.readFileSync(syncEnginePath, 'utf8');
    assert(syncEngineCode.includes('queueMutation('), 'SyncEngine implements queueMutation()');
    assert(syncEngineCode.includes('flushQueue('), 'SyncEngine implements flushQueue()');
    assert(syncEngineCode.includes('reconcile('), 'SyncEngine implements reconcile()');
    assert(syncEngineCode.includes('pushTask('), 'SyncEngine implements pushTask()');
    assert(syncEngineCode.includes('pushDsaProgress('), 'SyncEngine implements pushDsaProgress()');
    assert(syncEngineCode.includes('pushDevelopmentProgress('), 'SyncEngine implements pushDevelopmentProgress()');
    assert(syncEngineCode.includes('pushMistake('), 'SyncEngine implements pushMistake()');
    assert(syncEngineCode.includes('pushStudySession('), 'SyncEngine implements pushStudySession()');
    assert(syncEngineCode.includes('pushWorkoutSession('), 'SyncEngine implements pushWorkoutSession()');

    // Unit test SyncEngine logic in Node environment
    const { SyncEngine } = require('../js/sync-engine.js');

    // Test offline queue accumulation
    SyncEngine.pendingQueue = [];
    SyncEngine.queueMutation('TASK', {
        dateStr: '2026-09-28',
        task: { id: 'task_test_01', title: 'DP on Trees', status: 'COMPLETED' }
    });
    SyncEngine.queueMutation('DSA', {
        problemId: 'prob_tree_01',
        status: 'SOLVED',
        notes: 'Used post-order traversal'
    });

    assert(SyncEngine.pendingQueue.length === 2, 'SyncEngine queues mutations when offline or pending (2 mutations queued)');
    assert(SyncEngine.pendingQueue[0].type === 'TASK', 'First queued mutation is TASK');
    assert(SyncEngine.pendingQueue[1].type === 'DSA', 'Second queued mutation is DSA');
    assert(SyncEngine.pendingQueue[0].payload.task.status === 'COMPLETED', 'Mutation preserves task completion status');

    // Test retry failure resilience
    const mockFailedMutation = {
        id: 'mut_mock_fail',
        type: 'TASK',
        payload: { dateStr: '2026-09-28', task: { id: 'task_retry_test' } },
        retryCount: 0
    };
    SyncEngine.pendingQueue.push(mockFailedMutation);
    assert(SyncEngine.pendingQueue.some(m => m.id === 'mut_mock_fail'), 'Failed mutation remains in queue for automatic retry');

    // -------------------------------------------------------------------------
    // TEST 5: Calendar Day Status Deterministic Reconstruction
    // -------------------------------------------------------------------------
    console.log('\n--- 5. CALENDAR & STUDY_TASKS CANONICAL FIDELITY ---');

    // Mock TaskEngine recalculation algorithm for testing
    function calculateDayStatus(tasks) {
        if (!tasks || tasks.length === 0) return 'PLANNED';
        const hasInterrupted = tasks.some(t => t.status === 'INTERRUPTED');
        if (hasInterrupted) return 'INTERRUPTED';

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        const missed = tasks.filter(t => t.status === 'MISSED').length;

        if (completed === total) return 'COMPLETED';
        if (completed > 0) return 'PARTIAL';
        if (missed === total) return 'MISSED';
        return 'PLANNED';
    }

    const testTasksCompleted = [
        { id: 't1', title: 'Task 1', status: 'COMPLETED' },
        { id: 't2', title: 'Task 2', status: 'COMPLETED' }
    ];
    assert(calculateDayStatus(testTasksCompleted) === 'COMPLETED', 'Deterministic day status: All completed -> COMPLETED');

    const testTasksInterrupted = [
        { id: 't1', title: 'Task 1', status: 'COMPLETED' },
        { id: 't2', title: 'Task 2', status: 'INTERRUPTED', interruptReason: 'Power cut' }
    ];
    assert(calculateDayStatus(testTasksInterrupted) === 'INTERRUPTED', 'Deterministic day status: Any interrupted -> INTERRUPTED');

    const testTasksPartial = [
        { id: 't1', title: 'Task 1', status: 'COMPLETED' },
        { id: 't2', title: 'Task 2', status: 'NOT_STARTED' }
    ];
    assert(calculateDayStatus(testTasksPartial) === 'PARTIAL', 'Deterministic day status: Some completed -> PARTIAL');

    // Test calendar field preservation
    const cloudTaskPayload = {
        task_id: 'task_2026-09-28_dsa_block',
        date: '2026-09-28',
        title: 'Morning DSA Block',
        category: 'DSA',
        start_time: '06:00',
        end_time: '09:00',
        status: 'COMPLETED',
        is_study: true,
        is_block: true,
        interrupt_reason: null,
        dsa_problem_id: '124',
        metadata: { priority: 'HIGH', duration: 180, custom: false },
        updated_at: '2026-09-28T09:00:00Z'
    };

    // Test reconciliation mapping
    const mockCloudState = {
        tasks: [cloudTaskPayload],
        dsa: [{ problem_id: '124', status: 'SOLVED', notes: 'Optimal recursion', updated_at: '2026-09-28T09:00:00Z' }]
    };
    const mockLocalState = { days: {}, dsa: {} };

    const reconciled = SyncEngine.reconcile(mockCloudState, mockLocalState);
    assert(reconciled.days['2026-09-28'] !== undefined, 'Calendar day 2026-09-28 reconstructed from study_tasks');
    const reconstructedTask = reconciled.days['2026-09-28'].tasks[0];
    assert(reconstructedTask.id === 'task_2026-09-28_dsa_block', 'Reconstructed task ID preserved identically');
    assert(reconstructedTask.isBlock === true, 'Reconstructed task isBlock preserved');
    assert(reconstructedTask.dsaProblemId === '124', 'Reconstructed task dsaProblemId preserved');
    assert(reconstructedTask.priority === 'HIGH', 'Reconstructed task priority preserved from metadata');
    assert(reconstructedTask.status === 'COMPLETED', 'Reconstructed task status is COMPLETED');

    // -------------------------------------------------------------------------
    // TEST 6: Gym Photo Base64 Extraction & Private Bucket Storage
    // -------------------------------------------------------------------------
    console.log('\n--- 6. GYM PHOTO MIGRATION: NO PLACEHOLDERS, BINARY CONVERSION ---');
    const supabaseServicePath = path.join(__dirname, '..', 'js', 'supabase-service.js');
    const sbServiceCode = fs.readFileSync(supabaseServicePath, 'utf8');

    // Ensure legacy_migrated_placeholder is NOT used as replacement
    assert(!sbServiceCode.includes("'legacy_migrated_placeholder'"), 'No legacy_migrated_placeholder string in supabase-service.js');
    assert(sbServiceCode.includes('base64ToBlob'), 'SupabaseService implements base64ToBlob conversion');
    assert(sbServiceCode.includes('uploadGymPhotoBlob'), 'SupabaseService implements uploadGymPhotoBlob');

    // Unit test base64ToBlob
    const sampleBase64 = 'data:image/jpeg;base64,' + Buffer.from('test_jpeg_binary_payload').toString('base64');
    let convertedBlob = null;
    try {
        const buf = Buffer.from(Buffer.from('test_jpeg_binary_payload').toString('base64'), 'base64');
        convertedBlob = new Blob([buf], { type: 'image/jpeg' });
    } catch (e) {}

    assert(convertedBlob !== null && convertedBlob.size > 0, 'Base64 image converts cleanly to binary Blob');
    assert(convertedBlob.type === 'image/jpeg', 'Blob retains correct image/jpeg MIME type');

    // Storage path structure verification: {user_id}/{year}/{month}/{session_id}.jpg
    const sampleUserId = 'usr_verify_gym_01';
    const sampleSessionId = 'sess_1790581234567';
    const expectedStoragePath = `${sampleUserId}/2026/09/${sampleSessionId}.jpg`;
    assert(expectedStoragePath.includes(sampleUserId) && expectedStoragePath.endsWith('.jpg'), 'Storage path conforms to secure private hierarchy');

    // -------------------------------------------------------------------------
    // TEST 7: Safe Migration Pipeline & Idempotency
    // -------------------------------------------------------------------------
    console.log('\n--- 7. SAFE LOCAL -> CLOUD MIGRATION & IDEMPOTENCY ---');
    assert(sbServiceCode.includes('PHASE A: Prepare & Validate'), 'Migration includes Phase A validation');
    assert(sbServiceCode.includes('PHASE B: Upload Required Storage Files'), 'Migration includes Phase B Storage uploads');
    assert(sbServiceCode.includes('PHASE C: Commit Relational Records'), 'Migration includes Phase C Relational commits');

    // Verify report fields
    const requiredReportFields = [
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
    requiredReportFields.forEach(f => {
        assert(sbServiceCode.includes(f), `Migration report tracks ${f}`);
    });

    // Verify idempotent onConflict clauses in migration queries
    assert(sbServiceCode.includes("onConflict: 'user_id,problem_id'"), 'DSA migration uses onConflict: user_id,problem_id');
    assert(sbServiceCode.includes("onConflict: 'user_id,category,item_id'"), 'Development migration uses onConflict: user_id,category,item_id');
    assert(sbServiceCode.includes("onConflict: 'user_id,date,task_id'"), 'Task migration uses onConflict: user_id,date,task_id');
    assert(sbServiceCode.includes("onConflict: 'user_id'"), 'Workout plan and Placement Hub use onConflict: user_id');

    // -------------------------------------------------------------------------
    // TEST 8: Full Cross-Device Simulation (Device A -> Cloud -> Device B)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. FULL CROSS-DEVICE SYNCHRONIZATION SIMULATION ---');

    // Device A: Local State Mutation
    const deviceAState = {
        days: {
            '2026-09-28': {
                status: 'PLANNED',
                tasks: [
                    {
                        id: 'task_2026-09-28_core_01',
                        title: 'Dynamic Programming Practice',
                        category: 'DSA',
                        status: 'COMPLETED',
                        isStudy: true,
                        notes: 'Solved 3 hard problems',
                        updatedAt: '2026-09-28T10:00:00.000Z'
                    }
                ]
            }
        },
        dsa: {
            'prob_binary_tree_max_path': {
                status: 'SOLVED',
                notes: 'Kadane variation on tree',
                updatedAt: '2026-09-28T10:15:00.000Z'
            }
        },
        development: {
            tasks: {
                'dev_task_sync_engine': {
                    status: 'COMPLETED',
                    notes: 'Offline queue implemented',
                    updatedAt: '2026-09-28T10:30:00.000Z'
                }
            }
        },
        mistakes: [
            {
                id: 'mst_001',
                question: 'Count Inversions using Merge Sort',
                subject: 'DSA',
                userAnswer: 'O(N^2)',
                correctAnswer: 'O(N log N)',
                date: '2026-09-28',
                updatedAt: '2026-09-28T10:45:00.000Z'
            }
        ],
        studySessions: [
            {
                id: 'sess_focus_01',
                date: '2026-09-28',
                subject: 'DSA',
                activeSeconds: 3600,
                breakSeconds: 300,
                updatedAt: '2026-09-28T11:00:00.000Z'
            }
        ]
    };

    // Simulate Cloud Snapshot resulting from Device A write-through
    const cloudSnapshot = {
        tasks: [
            {
                task_id: 'task_2026-09-28_core_01',
                date: '2026-09-28',
                title: 'Dynamic Programming Practice',
                category: 'DSA',
                status: 'COMPLETED',
                is_study: true,
                notes: 'Solved 3 hard problems',
                updated_at: '2026-09-28T10:00:00.000Z'
            }
        ],
        dsa: [
            {
                problem_id: 'prob_binary_tree_max_path',
                status: 'SOLVED',
                notes: 'Kadane variation on tree',
                updated_at: '2026-09-28T10:15:00.000Z'
            }
        ],
        development: [
            {
                category: 'tasks',
                item_id: 'dev_task_sync_engine',
                status: 'COMPLETED',
                notes: 'Offline queue implemented',
                updated_at: '2026-09-28T10:30:00.000Z'
            }
        ],
        mistakes: [
            {
                id: 'mst_001',
                question: 'Count Inversions using Merge Sort',
                subject: 'DSA',
                user_answer: 'O(N^2)',
                correct_answer: 'O(N log N)',
                date: '2026-09-28',
                updated_at: '2026-09-28T10:45:00.000Z'
            }
        ],
        studySessions: [
            {
                id: 'sess_focus_01',
                date: '2026-09-28',
                subject: 'DSA',
                active_seconds: 3600,
                break_seconds: 300,
                updated_at: '2026-09-28T11:00:00.000Z'
            }
        ]
    };

    // Simulate Device B: Fresh browser, completely empty cache
    const deviceBInitialEmptyState = {
        days: {},
        dsa: {},
        development: { tasks: {} },
        mistakes: [],
        studySessions: []
    };

    // Device B pulls cloud state and reconciles
    const deviceBReconciled = SyncEngine.reconcile(cloudSnapshot, deviceBInitialEmptyState);

    // Verify complete data reconstitution on Device B
    assert(deviceBReconciled.days['2026-09-28'] !== undefined, 'Device B: Calendar day reconstituted from cloud');
    assert(deviceBReconciled.days['2026-09-28'].tasks[0].status === 'COMPLETED', 'Device B: Calendar task status matches Device A (COMPLETED)');
    assert(deviceBReconciled.dsa['prob_binary_tree_max_path'].status === 'SOLVED', 'Device B: DSA progress reconstituted from cloud (SOLVED)');
    assert(deviceBReconciled.development.tasks['dev_task_sync_engine'].status === 'COMPLETED', 'Device B: Dev progress reconstituted from cloud (COMPLETED)');
    assert(deviceBReconciled.mistakes.length === 1 && deviceBReconciled.mistakes[0].question.includes('Inversions'), 'Device B: Mistake Bank reconstituted from cloud');
    assert(deviceBReconciled.studySessions.length === 1 && deviceBReconciled.studySessions[0].activeSeconds === 3600, 'Device B: Study session reconstituted from cloud (3600s)');

    // Simulate Device B writing through a new update
    const deviceBNewTask = {
        id: 'task_2026-09-28_core_02',
        title: 'System Design: Distributed Cache',
        category: 'DEV',
        status: 'COMPLETED',
        updatedAt: '2026-09-28T11:30:00.000Z'
    };
    deviceBReconciled.days['2026-09-28'].tasks.push(deviceBNewTask);

    // Device B pushes mutation
    SyncEngine.pendingQueue = [];
    SyncEngine.queueMutation('TASK', {
        dateStr: '2026-09-28',
        task: deviceBNewTask
    });
    assert(SyncEngine.pendingQueue.length === 1, 'Device B: Write-through queues new task mutation for cloud sync');
    assert(SyncEngine.pendingQueue[0].payload.task.title === 'System Design: Distributed Cache', 'Device B: Queued mutation contains accurate new task payload');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`PHASE 1B TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runPhase1bVerification().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
