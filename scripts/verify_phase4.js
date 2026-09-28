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

    const ROOT = path.resolve(__dirname, '..');
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
    // TEST 8: PHASE 4B TODAY'S COMMAND & 2-YEAR CALENDAR PRESERVATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: PHASE 4B TODAY COMMAND & CALENDAR INTEGRITY ---');
    assert(htmlContent.includes('id="btnHeroStartStudying"'), 'Hero Start Studying CTA preserved');
    assert(htmlContent.includes('id="btnHeroWhatShouldIStudy"'), 'Hero What Should I Study CTA preserved');
    assert(htmlContent.includes('id="heroProgressPct"'), 'Hero Progress Percentage element preserved');
    assert(htmlContent.includes('id="metricTodayPct"'), 'Today Metric Percentage element preserved');
    assert(htmlContent.includes('id="metricDsaRatio"'), 'DSA Metric Ratio element preserved');
    assert(htmlContent.includes('id="metricDevRatio"'), 'Dev Metric Ratio element preserved');
    assert(htmlContent.includes('id="todayAiDashboardWidget"'), 'Today AI Dashboard Widget container preserved');
    assert(htmlContent.includes('id="todayTimelineContainer"'), 'Today Missions Timeline container preserved');
    assert(htmlContent.includes('id="calendarGrid"'), '2-Year Calendar Grid container preserved');
    assert(htmlContent.includes('id="calMonthLabel"'), 'Calendar Month Label element preserved');
    assert(htmlContent.includes('id="calPrevMonth"'), 'Calendar Prev Button preserved');
    assert(htmlContent.includes('id="calNextMonth"'), 'Calendar Next Button preserved');

    // -------------------------------------------------------------------------
    // TEST 9: PHASE 4C STRIVER DSA EXPERIENCE & DOM UPDATES PRESERVATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: PHASE 4C STRIVER DSA EXPERIENCE & TOKENS ---');
    assert(htmlContent.includes('id="dsaHeroSolvedLabel"'), 'DSA Hero Solved Count element preserved');
    assert(htmlContent.includes('id="dsaHeroPctLabel"'), 'DSA Hero Percentage element preserved');
    assert(htmlContent.includes('id="dsaHeroBarFill"'), 'DSA Hero Progress Bar Fill preserved');
    assert(htmlContent.includes('id="dsaTopicAccordion"'), 'DSA Topic Accordion container preserved');
    assert(cssContent.includes('.dsa-hero-stats {'), 'DSA Hero Stats styled in styles.css');
    assert(cssContent.includes('.topic-section-card {'), 'Topic Section Card styled in styles.css');
    assert(cssContent.includes('.status-select {'), 'Status Select styled in styles.css');

    // -------------------------------------------------------------------------
    // TEST 10: PHASE 4C DEVELOPMENT HUB & PLAYLIST PRESERVATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: PHASE 4C DEVELOPMENT HUB & PLAYLIST PRESERVATION ---');
    assert(htmlContent.includes('FORGE FULL-STACK DEVELOPMENT'), 'Development hero eyebrow reflects FORGE');
    assert(htmlContent.includes('id="devOverallPct"'), 'Dev Overall Percentage element preserved');
    assert(htmlContent.includes('id="devOverallFill"'), 'Dev Overall Fill element preserved');
    assert(htmlContent.includes('id="devVideoRatio"'), 'Dev Video Ratio element preserved');
    assert(htmlContent.includes('id="devTaskRatio"'), 'Dev Task Ratio element preserved');
    assert(htmlContent.includes('id="devRevisitCount"'), 'Dev Revisit Count element preserved');
    assert(htmlContent.includes('id="devStudyNowContainer"'), 'Dev Study Now container preserved');
    assert(htmlContent.includes('id="devRoadmapList"'), 'Dev Roadmap List container preserved');
    assert(htmlContent.includes('id="devTechCardsGrid"'), 'Dev Tech Cards Grid container preserved');
    assert(htmlContent.includes('id="devProjectsList"'), 'Dev Projects List container preserved');
    assert(htmlContent.includes('id="devInterviewList"'), 'Dev Interview List container preserved');
    assert(htmlContent.includes('id="devRevisionList"'), 'Dev Revision List container preserved');
    assert(htmlContent.includes('id="devAnalyticsBreakdown"'), 'Dev Analytics Breakdown container preserved');
    assert(htmlContent.includes('id="devTechSheetModal"'), 'Dev Technology Sheet Modal preserved');

    // Verify Dev Playlists exact URLs in data/dev-data.js are intact
    const devDataContent = fs.readFileSync(path.join(ROOT, 'data', 'dev-data.js'), 'utf8');
    assert(devDataContent.includes('https://youtu.be/iVCzmDwIQpA?si=lQ50wy7QyCCwrp9A'), 'Exact HTML course URL preserved');
    assert(devDataContent.includes('https://youtu.be/wRNinF7YQqQ?si=JkMmGwhk1F76FncB'), 'Exact CSS course URL preserved');
    assert(devDataContent.includes('https://www.youtube.com/watch?v=Hr5iLG7sUa0&list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37'), 'Exact JS course URL preserved');

    // -------------------------------------------------------------------------
    // TEST 11: PHASE 4C AI STUDY ENGINE & ACTIONABLE INTELLIGENCE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: PHASE 4C AI STUDY ENGINE & INTELLIGENCE LAYER ---');
    assert(htmlContent.includes('id="view-ai-engine"'), 'AI Study Engine view container preserved');
    const aiEngineContent = fs.readFileSync(path.join(ROOT, 'js', 'ai-engine.js'), 'utf8');
    assert(aiEngineContent.includes('FORGE ADAPTIVE AI'), 'AI Engine eyebrow reflects FORGE');
    assert(aiEngineContent.includes('Welcome to FORGE Adaptive AI Tutor'), 'AI Tutor welcome message reflects FORGE');
    assert(aiEngineContent.includes('🤖 FORGE AI'), 'AI chat assistant label reflects FORGE');
    assert(!aiEngineContent.includes('Welcome to BOSS AI Adaptive Tutor'), 'Legacy BOSS AI welcome message removed');
    assert(cssContent.includes('.ai-home-card {'), 'AI Home Card styled in styles.css');
    assert(cssContent.includes('.ai-rec-card {'), 'AI Recommendation Card styled in styles.css');
    assert(cssContent.includes('.ai-chat-layout {'), 'AI Chat Layout styled in styles.css');

    // -------------------------------------------------------------------------
    // TEST 12: PHASE 4D MISTAKE BANK & LEARNING INTELLIGENCE SYSTEM
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: PHASE 4D MISTAKE BANK & LEARNING INTELLIGENCE ---');
    assert(htmlContent.includes('id="view-mistakes"'), 'Mistake Bank view container preserved');
    const mistakesJsContent = fs.readFileSync(path.join(ROOT, 'js', 'mistakes.js'), 'utf8');
    assert(mistakesJsContent.includes('FORGE ERROR DEFENSE'), 'Mistake Bank badge reflects FORGE error defense');
    assert(!mistakesJsContent.includes("'StudyOS Question'"), 'Legacy StudyOS fallback question source removed');
    assert(cssContent.includes('.mistake-header-banner {'), 'Mistake header banner styled in styles.css');
    assert(cssContent.includes('.mistake-stats-grid {'), 'Mistake stats grid styled in styles.css');
    assert(cssContent.includes('.mistake-card {'), 'Mistake card styled in styles.css');
    assert(cssContent.includes('.weakness-card {'), 'Weakness map card styled in styles.css');

    // -------------------------------------------------------------------------
    // TEST 13: PHASE 4D GYM & LIFESTYLE ELITE LOGGING & PHOTO PIPELINE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 13: PHASE 4D GYM & LIFESTYLE ELITE LOGGING ---');
    assert(htmlContent.includes('id="view-food"'), 'Gym & Lifestyle view container preserved');
    const gymJsContent = fs.readFileSync(path.join(ROOT, 'js', 'gym.js'), 'utf8');
    assert(gymJsContent.includes('FORGE BODY & HEALTH COMMAND'), 'Lifestyle badge reflects FORGE');
    assert(cssContent.includes('.lifestyle-header-banner {'), 'Lifestyle header banner styled in styles.css');
    assert(cssContent.includes('.gym-subnav-row {'), 'Gym sub-navigation styled in styles.css');
    assert(cssContent.includes('.today-workout-hero-card {'), 'Today workout hero card styled in styles.css');
    assert(cssContent.includes('.gym-checkin-modal-window {'), 'Gym checkin modal window styled in styles.css');
    assert(cssContent.includes('.camera-viewport-card {'), 'Camera viewport card styled in styles.css');
    assert(cssContent.includes('.ex-picker-chip {'), 'Exercise picker chip styled in styles.css');
    assert(cssContent.includes('.btn-view-photo {'), 'View photo button styled in styles.css');

    // -------------------------------------------------------------------------
    // TEST 14: PHASE 4D ANALYTICS & STREAK AUTHENTIC DATA VISUALIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 14: PHASE 4D ANALYTICS & STREAK DATA VISUALIZATION ---');
    assert(htmlContent.includes('id="view-stats"'), 'Analytics & Streak view container preserved');
    assert(htmlContent.includes('id="statsBestStreak"'), 'Stats Best Streak element preserved');
    assert(htmlContent.includes('id="statsDsaSolved"'), 'Stats DSA Solved element preserved');
    assert(htmlContent.includes('id="statsDsaSub"'), 'Stats DSA Sub element preserved');
    assert(htmlContent.includes('id="statsStudyDays"'), 'Stats Study Days element preserved');
    assert(htmlContent.includes('id="statsAiSessions"'), 'Stats AI Sessions element preserved');
    assert(htmlContent.includes('id="statsStudySessionsTable"'), 'Stats Study Sessions Table preserved');
    assert(htmlContent.includes('id="statsHistoryBars"'), 'Stats History Bars container preserved');
    assert(cssContent.includes('#view-stats .calendar-wrapper {'), 'Stats calendar wrapper styled in styles.css');
    assert(cssContent.includes('#statsStudySessionsTable table {'), 'Stats study sessions table styled in styles.css');

    // -------------------------------------------------------------------------
    // TEST 15: PHASE 4E PLACEMENT HUB & READINESS ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 15: PHASE 4E PLACEMENT HUB & READINESS ENGINE ---');
    assert(htmlContent.includes('id="view-placement"'), 'Placement Hub view container preserved');
    assert(htmlContent.includes('FORGE CAREER COMMAND CENTER'), 'Placement hero eyebrow reflects FORGE');
    assert(htmlContent.includes('id="placementCelebrationBanner"'), 'Placement celebration banner preserved');
    assert(htmlContent.includes('id="sundayTestAlertBanner"'), 'Sunday test alert banner preserved');
    assert(htmlContent.includes('id="placementStartHereContainer"'), 'Start Here recommendation container preserved');
    assert(htmlContent.includes('id="placementReadinessContainer"'), 'Placement readiness container preserved');
    assert(htmlContent.includes('id="placementTopicsGrid"'), 'Placement topics 12-subject grid preserved');
    assert(cssContent.includes('.readiness-pillars-grid {'), 'Readiness pillars grid styled in styles.css');
    assert(cssContent.includes('.readiness-pillar-card {'), 'Readiness pillar card styled in styles.css');
    assert(cssContent.includes('.rex-score-banner {'), 'Rex score banner styled in styles.css');
    assert(cssContent.includes('.rex-formula-box {'), 'Rex formula box styled in styles.css');
    const placementJsContent = fs.readFileSync(path.resolve(__dirname, '../js/placement.js'), 'utf8');
    assert(placementJsContent.includes('FORGE Placement Readiness'), 'placement.js reflects FORGE Placement Readiness');
    assert(!placementJsContent.includes('BOSS Placement Readiness'), 'Legacy BOSS Placement Readiness removed');

    // -------------------------------------------------------------------------
    // TEST 16: PHASE 4E INTERNSHIP APPLICATION TRACKER
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 16: PHASE 4E INTERNSHIP APPLICATION TRACKER ---');
    assert(htmlContent.includes('id="view-internship"'), 'Internship Tracker view container preserved');
    assert(htmlContent.includes('id="internshipTableBody"'), 'Internship table body element preserved');
    assert(htmlContent.includes('id="btnAddInternship"'), 'Add Internship button preserved');
    assert(htmlContent.includes('id="internshipModal"'), 'Internship add/edit modal preserved');
    assert(htmlContent.includes('id="inputInternCompany"'), 'Internship Company input preserved');
    assert(htmlContent.includes('id="inputInternRole"'), 'Internship Role input preserved');
    assert(htmlContent.includes('id="inputInternDate"'), 'Internship Date input preserved');
    assert(htmlContent.includes('id="inputInternStatus"'), 'Internship Status select preserved');
    assert(cssContent.includes('.internship-controls {'), 'Internship controls styled in styles.css');
    assert(cssContent.includes('.internship-table-wrap {'), 'Internship table wrap styled in styles.css');
    assert(cssContent.includes('.intern-status-badge {'), 'Internship status badge styled in styles.css');
    assert(cssContent.includes('.intern-status-badge.SAVED {'), 'Internship SAVED badge styled in styles.css');
    assert(cssContent.includes('.intern-status-badge.SELECTED {'), 'Internship SELECTED badge styled in styles.css');
    assert(appJsContent.includes('FORGE Placement Achieved!'), 'app.js toast reflects FORGE placement achieved');

    // -------------------------------------------------------------------------
    // TEST 17: PHASE 4E DEDICATED FULL-SCREEN TEST ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 17: PHASE 4E DEDICATED FULL-SCREEN TEST ENGINE ---');
    assert(htmlContent.includes('id="weeklyTestFullScreen"'), 'Weekly Test Fullscreen overlay preserved');
    assert(htmlContent.includes('class="test-fullscreen-topbar"'), 'Test fullscreen topbar preserved');
    assert(htmlContent.includes('class="test-brand-badge">FORGE</div>'), 'Test brand badge reflects FORGE');
    assert(htmlContent.includes('id="testHeaderDate"'), 'Test Header Date element preserved');
    assert(htmlContent.includes('id="testQuestionCounter"'), 'Test Question Counter element preserved');
    assert(htmlContent.includes('id="testTimerText"'), 'Test Timer Text element preserved');
    assert(htmlContent.includes('id="testStatAnswered"'), 'Test Stat Answered element preserved');
    assert(htmlContent.includes('id="testStatUnanswered"'), 'Test Stat Unanswered element preserved');
    assert(htmlContent.includes('id="testStatMarked"'), 'Test Stat Marked element preserved');
    assert(htmlContent.includes('id="testPaletteSidebar"'), 'Test Palette Sidebar preserved');
    assert(htmlContent.includes('id="testPaletteGrid"'), 'Test Palette Grid preserved');
    assert(htmlContent.includes('id="preTestBoundaryModal"'), 'Pre-test syllabus boundary modal preserved');
    assert(htmlContent.includes('id="testSubmitConfirmModal"'), 'Anti-accident test submit confirmation modal preserved');
    assert(htmlContent.includes('id="testAnalysisModal"'), 'Weekly test analysis modal preserved');
    assert(htmlContent.includes('id="testHistoryModal"'), 'Test history modal preserved');
    assert(cssContent.includes('.weekly-test-fullscreen-overlay {'), 'Fullscreen test overlay styled in styles.css');
    assert(cssContent.includes('.test-timer-chip {'), 'Test timer chip styled in styles.css');
    assert(cssContent.includes('.test-palette-sidebar {'), 'Test palette sidebar styled in styles.css');
    assert(cssContent.includes('.palette-num-btn.current {'), 'Palette current button styled in styles.css');
    assert(cssContent.includes('.test-mcq-layout {'), 'MCQ test layout styled in styles.css');
    assert(cssContent.includes('.mcq-question-card {'), 'MCQ question card styled in styles.css');
    assert(cssContent.includes('.result-hero-box {'), 'Test result hero box styled in styles.css');

    // -------------------------------------------------------------------------
    // TEST 18: PHASE 4E SETTINGS & BYOK MODAL
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 18: PHASE 4E SETTINGS & BYOK MODAL ---');
    assert(htmlContent.includes('id="notifSettingsModal"'), 'Settings modal preserved');
    assert(htmlContent.includes('id="btnSettingsTabAi"'), 'Settings AI subtab button preserved');
    assert(htmlContent.includes('id="btnSettingsTabNotif"'), 'Settings Notifications subtab button preserved');
    assert(htmlContent.includes('id="btnSettingsTabPrivacy"'), 'Settings Privacy subtab button preserved');
    assert(htmlContent.includes('id="geminiConnectionPill"'), 'Gemini connection pill element preserved');
    assert(htmlContent.includes('id="inputGeminiKey"'), 'Gemini API key input element preserved');
    assert(htmlContent.includes('id="btnSaveAndTestKey"'), 'Save & Test Gemini key button preserved');
    assert(htmlContent.includes('id="geminiConfigBadge"'), 'Gemini config badge preserved');
    assert(htmlContent.includes('id="geminiConfiguredBox"'), 'Gemini configured box preserved');
    assert(htmlContent.includes('id="geminiTestResultBox"'), 'Gemini test result box container preserved');
    assert(cssContent.includes('.settings-modal-window {'), 'Settings modal window styled in styles.css');
    assert(cssContent.includes('.settings-subtabs-bar {'), 'Settings subtabs bar styled in styles.css');
    assert(cssContent.includes('.settings-subtab-btn {'), 'Settings subtab button styled in styles.css');
    assert(cssContent.includes('.btn-test-connection {'), 'Test connection button styled in styles.css');
    assert(cssContent.includes('.byok-status-badge {'), 'BYOK status badge styled in styles.css');
    const notifJsContent = fs.readFileSync(path.resolve(__dirname, '../js/notifications.js'), 'utf8');
    assert(notifJsContent.includes('FORGE will alert you for DSA'), 'notifications.js reflects FORGE study alerts');

    // -------------------------------------------------------------------------
    // TEST 19: PHASE 4F RESPONSIVE VIEWPORT AUDIT (8 TARGET VIEWPORTS)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 19: PHASE 4F RESPONSIVE VIEWPORT AUDIT (8 TARGET VIEWPORTS) ---');
    const targetViewports = [
        { name: 'Ultra-Compact Mobile', width: 320, query: '@media (max-width: 360px)' },
        { name: 'Standard Compact Android', width: 360, query: '@media (max-width: 360px)' },
        { name: 'Modern iPhone Base', width: 390, query: '@media (max-width: 480px)' },
        { name: 'Large iPhone Plus/Max', width: 414, query: '@media (max-width: 480px)' },
        { name: 'Tablet Portrait', width: 768, query: '@media (max-width: 768px)' },
        { name: 'Tablet Landscape / Small Laptop', width: 1024, query: '@media (max-width: 1024px)' },
        { name: 'Standard Desktop / Laptop 13"', width: 1280, query: ':root' },
        { name: 'High-Res Wide Display', width: 1440, query: ':root' }
    ];

    targetViewports.forEach(vp => {
        assert(cssContent.includes(vp.query), `Viewport ${vp.width}px (${vp.name}) covered by CSS rule ${vp.query}`);
    });

    assert(cssContent.includes('@media (hover: none)'), 'Touch interaction suppression for touch screens active');
    assert(cssContent.includes('safe-area-inset-bottom'), 'Safe-area support for gesture navigation bars active');
    assert(cssContent.includes('overflow-x: auto'), 'Responsive table/grid horizontal scrolling active');

    // -------------------------------------------------------------------------
    // TEST 20: RUN COMPLETE REGRESSION SUITES (363 TESTS)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 20: COMPLETE 363-TEST REGRESSION EXECUTION ---');
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
