/**
 * BOSS Study OS — Phase 3 Mobile Responsiveness & App Shell Verification Suite
 * Tests mobile drawer, responsive breakpoints, calendar usability, modal constraints,
 * touch targets, safe-area support, and regressions.
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

// Minimal DOM mocks for Phase 3 testing
class MockClassList {
    constructor() {
        this.classes = new Set();
    }
    add(...args) { for (const a of args) this.classes.add(a); }
    remove(...args) { for (const a of args) this.classes.delete(a); }
    toggle(cls, force) {
        if (force === true) { this.classes.add(cls); return true; }
        if (force === false) { this.classes.delete(cls); return false; }
        if (this.classes.has(cls)) { this.classes.delete(cls); return false; }
        this.classes.add(cls); return true;
    }
    contains(cls) { return this.classes.has(cls); }
    has(cls) { return this.classes.has(cls); }
}

class MockElement {
    constructor(tagName, id = '') {
        this.tagName = tagName ? tagName.toUpperCase() : 'DIV';
        this.id = id;
        this.classList = new MockClassList();
        this.children = [];
        this.parentElement = null;
        this.attributes = {};
        this.style = {};
        this.textContent = '';
        this.onclick = null;
        this._eventListeners = {};
    }

    setAttribute(key, val) {
        this.attributes[key] = String(val);
        if (key === 'id') this.id = String(val);
        if (key === 'class') {
            this.classList = new MockClassList();
            String(val).split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
        }
    }

    getAttribute(key) {
        return this.attributes[key] !== undefined ? this.attributes[key] : null;
    }

    removeAttribute(key) {
        delete this.attributes[key];
        if (key === 'class') this.classList.clear();
    }

    appendChild(child) {
        if (!child) return;
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    addEventListener(event, fn) {
        if (!this._eventListeners[event]) this._eventListeners[event] = [];
        this._eventListeners[event].push(fn);
    }

    dispatchEvent(event) {
        const fns = this._eventListeners[event.type] || [];
        for (const fn of fns) fn(event);
        if (event.type === 'click' && typeof this.onclick === 'function') {
            this.onclick(event);
        }
    }

    querySelector(selector) {
        const findFirst = (node) => {
            if (!node || !node.children) return null;
            for (const child of node.children) {
                if (child._matches(selector)) return child;
                const found = findFirst(child);
                if (found) return found;
            }
            return null;
        };
        return findFirst(this);
    }

    querySelectorAll(selector) {
        const results = [];
        const traverse = (node) => {
            if (!node || !node.children) return;
            for (const child of node.children) {
                if (child._matches(selector)) results.push(child);
                traverse(child);
            }
        };
        traverse(this);
        return results;
    }

    _matches(selector) {
        if (!selector) return false;
        if (selector.startsWith('#')) return this.id === selector.slice(1);
        if (selector.startsWith('.')) return this.classList.has(selector.slice(1));
        return this.tagName.toLowerCase() === selector.toLowerCase();
    }
}

class MockDocument {
    constructor() {
        this.elements = {};
        this.body = new MockElement('BODY');
        this._eventListeners = {};
    }

    createElement(tag) {
        return new MockElement(tag);
    }

    registerElement(id, el) {
        this.elements[id] = el;
    }

    getElementById(id) {
        return this.elements[id] || null;
    }

    querySelector(selector) {
        if (selector.startsWith('#')) return this.getElementById(selector.slice(1));
        for (const el of Object.values(this.elements)) {
            if (el.parentElement) continue;
            if (el._matches(selector)) return el;
            const found = el.querySelector(selector);
            if (found) return found;
        }
        return null;
    }

    querySelectorAll(selector) {
        const results = [];
        for (const el of Object.values(this.elements)) {
            if (el._matches(selector)) results.push(el);
            results.push(...el.querySelectorAll(selector));
        }
        return results;
    }

    addEventListener(event, fn) {
        if (!this._eventListeners[event]) this._eventListeners[event] = [];
        this._eventListeners[event].push(fn);
    }

    dispatchEvent(event) {
        const fns = this._eventListeners[event.type] || [];
        for (const fn of fns) fn(event);
    }
}

async function runPhase3Verification() {
    console.log('================================================================');
    console.log('🚀 STUDYOS PHASE 3: RESPONSIVE APP SHELL & MOBILE VERIFICATION');
    console.log('================================================================\n');

    // -------------------------------------------------------------------------
    // TEST 1: RESPONSIVE BREAKPOINT STRATEGY & CSS ANALYSIS
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: RESPONSIVE BREAKPOINT STRATEGY & CSS AUDIT ---');
    const cssPath = path.resolve(__dirname, '../styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert(cssContent.includes('@media (max-width: 1023') || cssContent.includes('@media (max-width: 1024'),
        'Tablet/Mobile app shell breakpoint (< 1024px) configured in styles.css');
    assert(cssContent.includes('@media (max-width: 767'),
        'Mobile phone breakpoint (<= 767px) configured in styles.css');
    assert(cssContent.includes('@media (max-width: 480px)'),
        'Small mobile phone breakpoint (<= 480px) configured in styles.css');
    assert(cssContent.includes('@media (max-width: 360px)'),
        'Ultra-small mobile phone breakpoint (<= 360px) configured in styles.css');
    assert(cssContent.includes('@media (hover: none)'),
        'Touch-device hover state suppression configured in styles.css');
    assert(cssContent.includes('safe-area-inset-top') && cssContent.includes('safe-area-inset-bottom'),
        'Modern smartphone safe-area inset support configured in styles.css');

    // -------------------------------------------------------------------------
    // TEST 2: MOBILE APP SHELL HTML STRUCTURE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: MOBILE APP SHELL HTML STRUCTURE ---');
    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert(htmlContent.includes('class="sidebar-drawer-backdrop"') && htmlContent.includes('id="sidebarDrawerBackdrop"'),
        'Sidebar drawer backdrop overlay element exists in index.html');
    assert(htmlContent.includes('class="mobile-header"') && htmlContent.includes('id="mobileHeader"'),
        'Mobile sticky application header element exists in index.html');
    assert(htmlContent.includes('id="btnMobileMenuToggle"'),
        'Mobile hamburger menu button exists in mobile header');
    assert(htmlContent.includes('id="btnSidebarDrawerClose"'),
        'Mobile drawer close button exists in sidebar header');
    assert(htmlContent.includes('id="mobileViewHeading"'),
        'Mobile view title indicator exists in mobile header');
    assert(htmlContent.includes('id="mobileStreakPill"'),
        'Mobile quick streak badge exists in mobile header');

    // -------------------------------------------------------------------------
    // TEST 3: MOBILE DRAWER CONTROLLER LOGIC
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: MOBILE DRAWER OPEN / CLOSE / TOGGLE LOGIC ---');
    const mockDoc = new MockDocument();
    global.document = mockDoc;
    global.window = {
        innerWidth: 390,
        addEventListener: () => {},
        removeEventListener: () => {}
    };

    const sidebar = new MockElement('ASIDE', 'appSidebar');
    sidebar.classList.add('sidebar');
    const backdrop = new MockElement('DIV', 'sidebarDrawerBackdrop');
    const toggleBtn = new MockElement('BUTTON', 'btnMobileMenuToggle');
    const closeBtn = new MockElement('BUTTON', 'btnSidebarDrawerClose');
    const mobileHeading = new MockElement('SPAN', 'mobileViewHeading');
    const mobileStreak = new MockElement('SPAN', 'mobileStreakValue');
    const viewHeading = new MockElement('H2', 'viewHeading');

    mockDoc.registerElement('appSidebar', sidebar);
    mockDoc.registerElement('sidebarDrawerBackdrop', backdrop);
    mockDoc.registerElement('btnMobileMenuToggle', toggleBtn);
    mockDoc.registerElement('btnSidebarDrawerClose', closeBtn);
    mockDoc.registerElement('mobileViewHeading', mobileHeading);
    mockDoc.registerElement('mobileStreakValue', mobileStreak);
    mockDoc.registerElement('viewHeading', viewHeading);

    // Load App
    global.Store = { _initPromise: Promise.resolve(), getState: () => ({}) };
    global.CalendarEngine = { init: () => {}, render: () => {} };
    global.NotificationManager = { init: () => {}, updateStatusBadge: () => {} };
    global.TaskEngine = { calculateStreak: () => 5 };
    global.DSAEngine = { getStats: () => ({ solved: 0, total: 455, percent: 0 }), render: () => {} };
    global.GymEngine = { render: () => {} };

    const { App } = require('../app.js');
    App.renderViewContent = () => {};

    assert(typeof App.initMobileDrawer === 'function', 'App.initMobileDrawer is defined');
    assert(typeof App.openMobileDrawer === 'function', 'App.openMobileDrawer is defined');
    assert(typeof App.closeMobileDrawer === 'function', 'App.closeMobileDrawer is defined');
    assert(typeof App.toggleMobileDrawer === 'function', 'App.toggleMobileDrawer is defined');
    assert(typeof App.isMobileDrawerOpen === 'function', 'App.isMobileDrawerOpen is defined');

    App.initMobileDrawer();

    assert(!App.isMobileDrawerOpen(), 'Drawer is initially closed');
    assert(!sidebar.classList.has('drawer-open'), 'Sidebar does NOT have .drawer-open initially');
    assert(!backdrop.classList.has('active'), 'Backdrop does NOT have .active initially');
    assert(!mockDoc.body.classList.has('drawer-open-lock'), 'Body does NOT have .drawer-open-lock initially');

    // Open drawer
    App.openMobileDrawer();
    assert(App.isMobileDrawerOpen(), 'App.isMobileDrawerOpen() returns true after open');
    assert(sidebar.classList.has('drawer-open'), 'Sidebar has .drawer-open class');
    assert(backdrop.classList.has('active'), 'Backdrop has .active class');
    assert(mockDoc.body.classList.has('drawer-open-lock'), 'Body has .drawer-open-lock (scroll prevented)');
    assert(toggleBtn.getAttribute('aria-expanded') === 'true', 'Hamburger button aria-expanded is "true"');

    // Close drawer
    App.closeMobileDrawer();
    assert(!App.isMobileDrawerOpen(), 'App.isMobileDrawerOpen() returns false after close');
    assert(!sidebar.classList.has('drawer-open'), 'Sidebar .drawer-open removed');
    assert(!backdrop.classList.has('active'), 'Backdrop .active removed');
    assert(!mockDoc.body.classList.has('drawer-open-lock'), 'Body .drawer-open-lock removed');
    assert(toggleBtn.getAttribute('aria-expanded') === 'false', 'Hamburger button aria-expanded is "false"');

    // Toggle drawer
    App.toggleMobileDrawer();
    assert(App.isMobileDrawerOpen(), 'Toggle opened drawer');
    App.toggleMobileDrawer();
    assert(!App.isMobileDrawerOpen(), 'Toggle closed drawer');

    // -------------------------------------------------------------------------
    // TEST 4: KEYBOARD NAVIGATION & ESCAPE KEY DRAWER DISMISSAL
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: KEYBOARD ACCESSIBILITY & ESCAPE KEY ---');
    App.openMobileDrawer();
    assert(App.isMobileDrawerOpen(), 'Drawer open before Escape key press');

    mockDoc.dispatchEvent({ type: 'keydown', key: 'Escape' });
    assert(!App.isMobileDrawerOpen(), 'Drawer automatically closed when Escape key is pressed');
    assert(!mockDoc.body.classList.has('drawer-open-lock'), 'Body scroll lock safely released on Escape');

    // -------------------------------------------------------------------------
    // TEST 5: VIEW NAVIGATION DRAWER AUTO-CLOSE & HEADING UPDATES
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: VIEW NAVIGATION DRAWER AUTO-CLOSE & HEADING UPDATES ---');
    App.openMobileDrawer();
    assert(App.isMobileDrawerOpen(), 'Drawer open before view switch');

    App.switchView('calendar');
    assert(!App.isMobileDrawerOpen(), 'Drawer automatically closed upon selecting a view');
    assert(mobileHeading.textContent === 'Command Calendar', 'Mobile heading updated to "Command Calendar"');

    App.switchView('dsa');
    assert(mobileHeading.textContent === 'Striver A2Z DSA', 'Mobile heading updated to "Striver A2Z DSA"');

    App.switchView('food');
    assert(mobileHeading.textContent === 'Gym & Lifestyle', 'Mobile heading updated to "Gym & Lifestyle"');

    // -------------------------------------------------------------------------
    // TEST 6: DESKTOP OFFSET ISOLATION & MOBILE OVERFLOW PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: DESKTOP OFFSET ISOLATION & OVERFLOW RULES ---');
    // Verify CSS contains the desktop isolation override
    const hasMainWrapperZeroMargin = /@media[^{]+\(max-width:[^}]+\.main-wrapper\s*\{[^}]*margin-left:\s*0/s.test(cssContent);
    assert(hasMainWrapperZeroMargin, '.main-wrapper margin-left is strictly 0 inside mobile media query');

    const hasDrawerTransform = /\.sidebar\s*\{[^}]*transform:\s*translateX\(-100%\)/s.test(cssContent);
    assert(hasDrawerTransform, '.sidebar uses transform: translateX(-100%) for mobile drawer off-screen positioning');

    const hasDrawerOpenTransform = /\.sidebar\.drawer-open\s*\{[^}]*transform:\s*translateX\(0\)/s.test(cssContent);
    assert(hasDrawerOpenTransform, '.sidebar.drawer-open uses transform: translateX(0) for performant GPU slide-in');

    const hasAppContainerOverflowProtection = /\.app-container\s*\{[^}]*overflow-x:\s*hidden/s.test(cssContent);
    assert(hasAppContainerOverflowProtection, '.app-container has overflow-x: hidden for shell-level horizontal protection');

    // -------------------------------------------------------------------------
    // TEST 7: CALENDAR RESPONSIVE PRESENTATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: CALENDAR RESPONSIVE PRESENTATION ---');
    const hasCalGridColumns = /grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/.test(cssContent);
    assert(hasCalGridColumns, 'Calendar grid uses repeat(7, minmax(0, 1fr)) preventing row blowouts');

    const hasCompactCellMobile = /\.cal-cell\s*\{[^}]*min-height:\s*(?:72px|64px|56px)/.test(cssContent);
    assert(hasCompactCellMobile, 'Calendar cells specify compact mobile heights for phone viewports');

    const hasTooltipTouchSuppression = /@media\s*\(hover:\s*none\)\s*\{[^}]*\.cal-tooltip\s*\{[^}]*display:\s*none/s.test(cssContent);
    assert(hasTooltipTouchSuppression, 'Calendar hover tooltips cleanly disabled on touch-only devices');

    // -------------------------------------------------------------------------
    // TEST 8: MODAL MOBILE CONSTRAINTS & INTERNAL SCROLLING
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: MODAL MOBILE CONSTRAINTS & INTERNAL SCROLLING ---');
    const hasModalMaxViewportWidth = /max-width:\s*(?:calc\(100vw\s*-\s*(?:24px|16px)\)|100%)/.test(cssContent);
    assert(hasModalMaxViewportWidth, 'Modal windows enforce max-width relative to viewport on mobile');

    const hasModalDynamicViewportHeight = /max-height:\s*calc\(100dvh\s*-\s*(?:32px|20px|18px|16px)\)/.test(cssContent);
    assert(hasModalDynamicViewportHeight, 'Modal windows enforce dynamic viewport height (100dvh) preventing screen cutoffs');

    const hasModalInternalScroll = /\.modal-body\s*\{[^}]*overflow-y:\s*auto/s.test(cssContent);
    assert(hasModalInternalScroll, 'Modal body guarantees internal vertical scrolling on small screens');

    // -------------------------------------------------------------------------
    // TEST 9: DATA-DENSE COMPONENT & TABLE SCROLL WRAPPERS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: DATA-DENSE COMPONENT & TABLE SCROLL WRAPPERS ---');
    const hasTableWrapperScroll = /\.table-wrapper[^{]*\{[^}]*overflow-x:\s*auto/s.test(cssContent);
    assert(hasTableWrapperScroll, '.table-wrapper specifies controlled internal horizontal scrolling');

    const hasLiveSetsScroll = /\.live-sets-table\s*\{[^}]*overflow-x:\s*auto/s.test(cssContent);
    assert(hasLiveSetsScroll, 'Live workout sets table has controlled horizontal scroll on narrow mobile screens');

    const hasSetRowMinWidth = /\.set-row\s*\{[^}]*min-width:\s*440px/s.test(cssContent);
    assert(hasSetRowMinWidth, 'Live workout .set-row maintains readable minimum width without truncating metrics');

    // -------------------------------------------------------------------------
    // TEST 10: TOUCH TARGETS & ACCESSIBILITY ATTRIBUTES
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: TOUCH TARGETS & ACCESSIBILITY STANDARDS ---');
    const hasNavTouchTarget = /\.sidebar\s+\.nav-link\s*\{[^}]*min-height:\s*(?:42px|44px)/.test(cssContent);
    assert(hasNavTouchTarget, 'Mobile drawer nav links satisfy comfortable touch target height (>= 42px)');

    const hasBtnMobileMenu = htmlContent.includes('aria-label="Open Navigation Menu"');
    assert(hasBtnMobileMenu, 'Hamburger menu toggle includes descriptive aria-label');

    const hasBtnDrawerClose = htmlContent.includes('aria-label="Close Navigation Drawer"');
    assert(hasBtnDrawerClose, 'Drawer close button includes descriptive aria-label');

    // -------------------------------------------------------------------------
    // TEST 11: PRESERVATION OF PERFORMANCE WORK
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: PERFORMANCE PRESERVATION (PHASE 2 & PHASE 1) ---');
    assert(cssContent.includes('contain: layout style'), 'CSS containment rules preserved in styles.css');
    assert(!cssContent.includes('@import url'), 'Styles.css maintains 0 blocking @import rules');
    assert(htmlContent.includes('monaco-loader.js'), 'Lazy Monaco loader script preserved in index.html');

    // -------------------------------------------------------------------------
    // TEST 12: EXECUTE ALL PREVIOUS TEST SUITES (REGRESSION SAFETY)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: PREVIOUS VERIFICATION SUITES REGRESSION ---');

    const suites = [
        { name: 'Phase 1-B (Cloud & Persistence)', cmd: 'node scripts/verify_phase1b.js' },
        { name: 'Phase 2B (Debounced Store & Targeted DSA)', cmd: 'node scripts/verify_phase2b.js' },
        { name: 'Phase 2C (Parallel Loading & Batched Calendar)', cmd: 'node scripts/verify_phase2c.js' },
        { name: 'Phase 2D (Resource Optimization & Containment)', cmd: 'node scripts/verify_phase2d.js' },
        { name: 'Cloud Migration Bug Fix', cmd: 'node scripts/test_migration_bugfix.js' },
        { name: 'Import Backup Persistence & Reconciliation Bug Fix', cmd: 'node scripts/test_import_persistence_bugfix.js' }
    ];

    for (const suite of suites) {
        try {
            execSync(suite.cmd, { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
            assert(true, `${suite.name} regression suite PASSED`);
        } catch (err) {
            console.error(`Suite ${suite.name} stdout:`, err.stdout ? err.stdout.toString() : '');
            console.error(`Suite ${suite.name} stderr:`, err.stderr ? err.stderr.toString() : '');
            assert(false, `${suite.name} regression suite FAILED`);
        }
    }

    console.log('\n================================================================');
    console.log(`PHASE 3 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runPhase3Verification().catch(err => {
    console.error('Unhandled Phase 3 verification error:', err);
    process.exit(1);
});
