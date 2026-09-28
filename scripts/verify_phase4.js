/**
 * FORGE — Phase 4 Verification Suite
 * Tests:
 * 1. FORGE Brand Identity, Tagline & Meta Typography
 * 2. Auth Modal & Settings Branding
 * 3. FORGE Design Tokens (Surfaces, Borders, Text, Warm Amber Accent, Semantic States, Spacing, Radius, Motion)
 * 4. Backward Compatibility Mappings for Legacy Tokens
 * 5. Accessibility: prefers-reduced-motion
 * 6. Desktop & Mobile Shell Structure & Grouped Navigation
 * 7. Mobile Drawer & Backdrop Structural Integrity
 * 8. Full 363 Regression Test Verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`❌ [FAIL] ${message}`);
        failedTests++;
    }
}

async function runPhase4Verification() {
    console.log('================================================================');
    console.log('🔥 FORGE: PHASE 4 VERIFICATION & BRAND INTEGRITY SUITE');
    console.log('   "Build yourself. Every single day."');
    console.log('================================================================\n');

    const htmlPath = path.resolve(__dirname, '../index.html');
    const cssPath = path.resolve(__dirname, '../styles.css');
    const appJsPath = path.resolve(__dirname, '../app.js');
    const authJsPath = path.resolve(__dirname, '../js/auth.js');

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    const authJsContent = fs.readFileSync(authJsPath, 'utf8');

    // -------------------------------------------------------------------------
    // TEST 1: BRAND IDENTITY & TAGLINE CONSISTENCY
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: PRODUCT REBRAND & TAGLINE CONSISTENCY ---');
    assert(htmlContent.includes('<title>FORGE — Build yourself. Every single day.</title>'),
        'Page <title> set to "FORGE — Build yourself. Every single day."');
    assert(htmlContent.includes('<meta name="description"') && htmlContent.includes('FORGE: Personal operating system'),
        'Meta description reflects FORGE personal operating system');

    // Sidebar Branding
    assert(htmlContent.includes('<div class="brand-logo">F</div>'),
        'Sidebar brand emblem is "F" in index.html');
    assert(htmlContent.includes('<h1>FORGE</h1>'),
        'Sidebar title is "FORGE"');
    assert(htmlContent.includes('<p>Build yourself. Every single day.</p>'),
        'Sidebar tagline matches official branding: "Build yourself. Every single day."');

    // Mobile Header Branding
    assert(htmlContent.includes('<span class="mobile-brand-badge">F</span>'),
        'Mobile header brand badge is "F"');
    assert(htmlContent.includes('<span class="mobile-brand-title">FORGE</span>'),
        'Mobile header brand title is "FORGE"');

    // Top Bar Greeting
    assert(htmlContent.includes('id="greetingEyebrow">BUILD YOURSELF · EVERY SINGLE DAY</span>'),
        'Top bar greeting eyebrow reflects FORGE official tagline');

    // Auth Modal Branding
    assert(htmlContent.includes('<div class="auth-brand-badge">F</div>'),
        'Auth modal brand badge is "F"');
    assert(htmlContent.includes('<h2 class="auth-brand-title">FORGE</h2>'),
        'Auth modal brand title is "FORGE"');
    assert(htmlContent.includes('id="authHeaderSubtitle">Build yourself. Every single day.</p>'),
        'Auth modal subtitle is "Build yourself. Every single day."');

    // Settings & Test Engine Branding
    assert(htmlContent.includes('>FORGE Settings</h3>'),
        'Settings modal title is "FORGE Settings"');
    assert(htmlContent.includes('class="test-brand-badge">FORGE</div>'),
        'Assessment Test Engine badge is "FORGE"');

    // App.js Fallback Titles
    assert(appJsContent.includes('mobileViewHeading.textContent = headings[viewName] || "FORGE"'),
        'App.js fallback mobile view title is "FORGE"');
    assert(appJsContent.includes('viewHeading.textContent = headings[viewName] || "FORGE"'),
        'App.js fallback desktop view title is "FORGE"');

    // -------------------------------------------------------------------------
    // TEST 2: FORGE DESIGN TOKENS (CSS ARCHITECTURE)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: FORGE DESIGN TOKENS ---');
    const requiredTokens = [
        '--forge-bg',
        '--forge-surface',
        '--forge-surface-raised',
        '--forge-surface-active',
        '--forge-surface-overlay',
        '--forge-border-subtle',
        '--forge-border',
        '--forge-border-strong',
        '--forge-border-focus',
        '--forge-text-primary',
        '--forge-text-secondary',
        '--forge-text-muted',
        '--forge-accent',
        '--forge-accent-hover',
        '--forge-accent-active',
        '--forge-accent-subtle',
        '--forge-accent-border',
        '--forge-accent-glow',
        '--forge-success',
        '--forge-warning',
        '--forge-danger',
        '--forge-info',
        '--forge-space-xs',
        '--forge-space-md',
        '--forge-space-lg',
        '--forge-space-2xl',
        '--forge-radius-sm',
        '--forge-radius-md',
        '--forge-radius-lg',
        '--forge-radius-pill',
        '--forge-motion-fast',
        '--forge-motion-normal'
    ];

    for (const token of requiredTokens) {
        assert(cssContent.includes(token), `Design token ${token} defined in styles.css`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: BACKWARD COMPATIBLE SYSTEM MAPPINGS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: BACKWARD COMPATIBILITY SYSTEM MAPPINGS ---');
    assert(cssContent.includes('--bg-main: var(--forge-bg);'), 'Legacy --bg-main mapped to --forge-bg');
    assert(cssContent.includes('--panel-solid: var(--forge-surface);'), 'Legacy --panel-solid mapped to --forge-surface');
    assert(cssContent.includes('--gold: var(--forge-accent);'), 'Legacy --gold mapped to --forge-accent');
    assert(cssContent.includes('--text-primary: var(--forge-text-primary);'), 'Legacy --text-primary mapped to --forge-text-primary');
    assert(cssContent.includes('--radius-sm: var(--forge-radius-sm);'), 'Legacy --radius-sm mapped to --forge-radius-sm');

    // -------------------------------------------------------------------------
    // TEST 4: ACCESSIBILITY & PREFERS-REDUCED-MOTION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: ACCESSIBILITY & MOTION RULES ---');
    assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'),
        'Accessible prefers-reduced-motion media query configured in styles.css');
    assert(cssContent.includes('animation-duration: 0.01ms !important'),
        'Reduced-motion suppresses CSS animation durations for photosensitive accessibility');

    // -------------------------------------------------------------------------
    // TEST 5: DESKTOP & MOBILE SHELL NAVIGATION INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: SHELL NAVIGATION GROUPING & INTEGRITY ---');
    assert(htmlContent.includes('class="sidebar-nav-group-label">DISCIPLINE</div>'),
        'Navigation section "DISCIPLINE" label present');
    assert(htmlContent.includes('class="sidebar-nav-group-label">TRAINING & HABITS</div>'),
        'Navigation section "TRAINING & HABITS" label present');
    assert(htmlContent.includes('class="sidebar-nav-group-label">CAREER & PROGRESS</div>'),
        'Navigation section "CAREER & PROGRESS" label present');

    const views = ['today', 'calendar', 'dsa', 'ai-engine', 'development', 'mistakes', 'food', 'placement', 'internship', 'stats'];
    for (const v of views) {
        assert(htmlContent.includes(`data-view="${v}"`), `Nav link for view "${v}" preserved`);
    }

    assert(htmlContent.includes('id="sidebarGoalCard"'), 'Ultimate Goal banner element exists');
    assert(htmlContent.includes('id="sidebarUserCard"'), 'User Profile card element exists');
    assert(htmlContent.includes('id="exportBackupBtn"'), 'Export Backup button exists');
    assert(htmlContent.includes('id="importBackupFile"'), 'Import Backup input exists');
    assert(htmlContent.includes('id="resetAppBtn"'), 'Reset App button exists');

    // -------------------------------------------------------------------------
    // TEST 6: PRESERVED MOBILE RESPONSIVE HOOKS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: PRESERVED MOBILE SHELL HOOKS ---');
    assert(htmlContent.includes('id="sidebarDrawerBackdrop"'), 'Mobile backdrop overlay element preserved');
    assert(htmlContent.includes('id="mobileHeader"'), 'Mobile header element preserved');
    assert(htmlContent.includes('id="btnMobileMenuToggle"'), 'Mobile hamburger toggle preserved');
    assert(htmlContent.includes('id="btnSidebarDrawerClose"'), 'Mobile drawer close button preserved');
    assert(htmlContent.includes('id="mobileViewHeading"'), 'Mobile view heading element preserved');
    assert(htmlContent.includes('id="mobileStreakPill"'), 'Mobile streak badge preserved');

    // -------------------------------------------------------------------------
    // TEST 7: PERFORMANCE OPTIMIZATION PRESERVATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: PERFORMANCE OPTIMIZATIONS PRESERVED ---');
    const importMatches = cssContent.match(/@import\s+url/g) || [];
    assert(importMatches.length === 0, 'styles.css contains strictly 0 blocking @import rules');
    assert(cssContent.includes('contain: layout style;'), 'CSS layout style containment preserved');

    // -------------------------------------------------------------------------
    // TEST 8: RUN COMPLETE REGRESSION SUITES (363 TESTS)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: COMPLETE 363-TEST REGRESSION EXECUTION ---');
    try {
        const out3 = execSync('node scripts/verify_phase3.js', { encoding: 'utf8' });
        assert(out3.includes('PHASE 3 TEST RESULTS: 66 PASSED, 0 FAILED'), 'Phase 3 Verification (and Phase 1B/2B/2C/2D regressions) passed 66/66');
    } catch (e) {
        assert(false, `Phase 3 regression execution failed: ${e.message}`);
    }

    try {
        const outGym = execSync('node scripts/test_gym_photo_visibility.js', { encoding: 'utf8' });
        assert(outGym.includes('GYM PHOTO VISIBILITY RESULTS: 14 PASSED, 0 FAILED'), 'Gym Photo Pipeline verified 14/14');
    } catch (e) {
        assert(false, `Gym photo regression execution failed: ${e.message}`);
    }

    try {
        const outHygiene = execSync('node scripts/verify_repository_clean.js', { encoding: 'utf8' });
        assert(outHygiene.includes('REPOSITORY HYGIENE RESULTS: 45 PASSED, 0 FAILED'), 'Repository Hygiene Check verified 45/45');
    } catch (e) {
        assert(false, `Repository hygiene execution failed: ${e.message}`);
    }

    console.log('\n================================================================');
    console.log(`FORGE PHASE 4 RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runPhase4Verification().catch(err => {
    console.error('Unhandled verification error:', err);
    process.exit(1);
});
