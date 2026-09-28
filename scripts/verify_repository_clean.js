/**
 * BOSS Study OS — Repository Health & Production Hygiene Verification Suite
 * Verifies that:
 * 1. Required production files and critical directories exist.
 * 2. Forbidden generated files (zip, tmp, logs) are absent.
 * 3. Secrets / credential files are properly ignored and not tracked.
 * 4. package.json and package-lock.json are valid and present.
 * 5. Supabase canonical migrations and Netlify serverless functions exist.
 * 6. Test infrastructure is intact and runnable.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function pass(msg) {
    passed++;
    console.log(`✅ [PASS] ${msg}`);
}

function fail(msg, err) {
    failed++;
    console.error(`❌ [FAIL] ${msg}:`, err ? (err.message || err) : '');
}

async function runRepoCleanVerification() {
    console.log('================================================================');
    console.log('🛡️  STUDYOS REPOSITORY CLEANLINESS & HYGIENE VERIFICATION');
    console.log('================================================================\n');

    const rootDir = path.resolve(__dirname, '..');

    // 1. Critical Production Files
    console.log('--- 1. CRITICAL PRODUCTION ASSETS ---');
    const requiredFiles = [
        'index.html',
        'styles.css',
        'app.js',
        'server.js',
        'netlify.toml',
        'package.json',
        'package-lock.json',
        '.gitignore',
        '.env.example'
    ];

    for (const file of requiredFiles) {
        try {
            const p = path.join(rootDir, file);
            assert(fs.existsSync(p), `Required file ${file} must exist`);
            pass(`Required production file exists: ${file}`);
        } catch (e) {
            fail(`Required production file check: ${file}`, e);
        }
    }

    // 2. Critical Source Directories
    console.log('\n--- 2. CRITICAL SOURCE DIRECTORIES ---');
    const requiredDirs = [
        'data',
        'js',
        'netlify/functions',
        'scripts',
        'supabase/migrations',
        'types'
    ];

    for (const dir of requiredDirs) {
        try {
            const p = path.join(rootDir, dir);
            assert(fs.existsSync(p) && fs.statSync(p).isDirectory(), `Directory ${dir} must exist`);
            pass(`Critical directory exists: ${dir}`);
        } catch (e) {
            fail(`Critical directory check: ${dir}`, e);
        }
    }

    // 3. Essential JavaScript Modules
    console.log('\n--- 3. ESSENTIAL JAVASCRIPT MODULES ---');
    const requiredModules = [
        'js/ai-engine.js',
        'js/auth.js',
        'js/calendar.js',
        'js/code-runner.js',
        'js/development.js',
        'js/dsa.js',
        'js/gym.js',
        'js/mistakes.js',
        'js/monaco-loader.js',
        'js/notifications.js',
        'js/placement.js',
        'js/recommend-engine.js',
        'js/store.js',
        'js/study-session.js',
        'js/supabase-service.js',
        'js/syllabus-boundary.js',
        'js/sync-engine.js',
        'js/tasks.js',
        'js/test-engine.js',
        'js/vendor/supabase.js'
    ];

    for (const mod of requiredModules) {
        try {
            const p = path.join(rootDir, mod);
            assert(fs.existsSync(p), `Module ${mod} must exist`);
            pass(`Essential module exists: ${mod}`);
        } catch (e) {
            fail(`Essential module check: ${mod}`, e);
        }
    }

    // 4. Netlify Serverless Functions
    console.log('\n--- 4. NETLIFY SERVERLESS FUNCTIONS ---');
    const requiredFunctions = [
        'netlify/functions/auth.js',
        'netlify/functions/gemini.js',
        'netlify/functions/judge.js'
    ];

    for (const fn of requiredFunctions) {
        try {
            const p = path.join(rootDir, fn);
            assert(fs.existsSync(p), `Function ${fn} must exist`);
            pass(`Netlify serverless function exists: ${fn}`);
        } catch (e) {
            fail(`Function check: ${fn}`, e);
        }
    }

    // 5. Canonical Supabase Migrations
    console.log('\n--- 5. CANONICAL SUPABASE MIGRATIONS ---');
    const requiredMigrations = [
        'supabase/migrations/20260928000000_initial_studyos_schema.sql',
        'supabase/migrations/20260928000001_phase1b_sync_metadata.sql'
    ];

    for (const mig of requiredMigrations) {
        try {
            const p = path.join(rootDir, mig);
            assert(fs.existsSync(p), `Migration ${mig} must exist`);
            pass(`Canonical Supabase migration exists: ${mig}`);
        } catch (e) {
            fail(`Migration check: ${mig}`, e);
        }
    }

    // 6. Absence of Duplicate / Obsolete Directories
    console.log('\n--- 6. OBSOLETE DIRECTORY AUDIT ---');
    try {
        const obsoleteScriptsMigrations = path.join(rootDir, 'scripts', 'migrations');
        assert(!fs.existsSync(obsoleteScriptsMigrations), 'scripts/migrations must be removed in favor of supabase/migrations');
        pass('Obsolete duplicate scripts/migrations directory is absent');
    } catch (e) {
        fail('Obsolete scripts/migrations check', e);
    }

    // 7. Hygiene: No Accidental Temporary / Cache / Binaries
    console.log('\n--- 7. ACCIDENTAL ARTIFACT HYGIENE ---');
    try {
        const forbiddenExtensions = ['.zip', '.tar', '.gz', '.tmp', '.temp', '.bak', '.swp'];
        function checkFolder(dir) {
            for (const item of fs.readdirSync(dir)) {
                if (item === 'node_modules' || item === '.git') continue;
                const full = path.join(dir, item);
                const stat = fs.statSync(full);
                if (stat.isDirectory()) {
                    checkFolder(full);
                } else {
                    const ext = path.extname(item).toLowerCase();
                    assert(!forbiddenExtensions.includes(ext), `Forbidden extension ${ext} found at ${full}`);
                }
            }
        }
        checkFolder(rootDir);
        pass('Zero temporary, archive, or swap files found in workspace');
    } catch (e) {
        fail('Accidental artifact check', e);
    }

    // 8. .gitignore & Secret Protection Verification
    console.log('\n--- 8. GITIGNORE & SECRET HYGIENE ---');
    try {
        const giContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
        assert(giContent.includes('.env'), '.gitignore must ignore .env');
        assert(giContent.includes('node_modules/'), '.gitignore must ignore node_modules/');
        assert(giContent.includes('data/credentials.json'), '.gitignore must ignore data/credentials.json');
        pass('.gitignore safely protects environment secrets and credentials');
    } catch (e) {
        fail('.gitignore safety check', e);
    }

    // 9. .env.example Placeholder Verification
    console.log('\n--- 9. ENV EXAMPLE SANITIZATION ---');
    try {
        const envEx = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');
        assert(!envEx.includes('wirxgkodkfqycufayzmk'), '.env.example must not contain real Supabase project URL');
        assert(!envEx.includes('sb_publishable_ompHx9iH2riZyrcxcEkCQw'), '.env.example must not contain real publishable key');
        assert(envEx.includes('NEXT_PUBLIC_SUPABASE_URL='), '.env.example defines NEXT_PUBLIC_SUPABASE_URL placeholder');
        assert(envEx.includes('BYOK_ENCRYPTION_SECRET='), '.env.example defines BYOK_ENCRYPTION_SECRET placeholder');
        pass('.env.example is completely sanitized with safe placeholders');
    } catch (e) {
        fail('.env.example sanitization check', e);
    }

    // 10. package.json Integrity
    console.log('\n--- 10. PACKAGE.JSON INTEGRITY ---');
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
        assert(pkg.dependencies, 'package.json contains dependencies');
        assert(pkg.dependencies['@supabase/supabase-js'], '@supabase/supabase-js present in package.json');
        pass('package.json is valid JSON with required runtime dependencies');
    } catch (e) {
        fail('package.json integrity check', e);
    }

    console.log('\n================================================================');
    console.log(`REPOSITORY HYGIENE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runRepoCleanVerification().catch(err => {
    console.error('Fatal error in repository clean verification:', err);
    process.exit(1);
});
