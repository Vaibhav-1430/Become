/**
 * BOSS Study OS — Authentication & Session Controller
 * Coordinates Sign In, Sign Up, Sign Out, Password Reset,
 * Auth Wall protection, and Profile Menu.
 */

const AuthController = {
    currentTab: 'login', // 'login' | 'signup' | 'forgot' | 'setup'

    init() {
        this.bindEvents();
        // Listen to Supabase auth transitions
        if (typeof SupabaseService !== 'undefined') {
            SupabaseService.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session && session.user) {
                        await this.handleUserSession(session.user);
                    }
                } else if (event === 'SIGNED_OUT') {
                    this.handleUserSignedOut();
                }
            });
        }
    },

    bindEvents() {
        // Toggle tabs
        document.querySelectorAll('[data-auth-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.authTab;
                this.switchTab(tab);
            });
        });

        // Form submissions
        const loginForm = document.getElementById('authLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const signupForm = document.getElementById('authSignupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }

        const forgotForm = document.getElementById('authForgotForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        const setupForm = document.getElementById('authSetupForm');
        if (setupForm) {
            setupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveSupabaseConfig();
            });
        }
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        this.clearMessages();

        const tabs = ['login', 'signup', 'forgot', 'setup'];
        tabs.forEach(t => {
            const formEl = document.getElementById(`authTab_${t}`);
            const navBtn = document.querySelector(`[data-auth-tab="${t}"]`);
            if (formEl) {
                if (t === tabName) {
                    formEl.style.display = 'block';
                } else {
                    formEl.style.display = 'none';
                }
            }
            if (navBtn) {
                if (t === tabName) navBtn.classList.add('active');
                else navBtn.classList.remove('active');
            }
        });
    },

    showMessage(text, type = 'error') {
        const banner = document.getElementById('authMessageBanner');
        if (!banner) return;
        banner.style.display = 'block';
        banner.className = `auth-message-banner ${type}`;
        banner.innerHTML = `
            <span>${type === 'success' ? '✅' : '⚠️'}</span>
            <div>${text}</div>
        `;
    },

    clearMessages() {
        const banner = document.getElementById('authMessageBanner');
        if (banner) {
            banner.style.display = 'none';
            banner.textContent = '';
        }
    },

    setLoading(btnId, isLoading, defaultText = 'Submit') {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.dataset.origText = btn.innerHTML;
            btn.innerHTML = `<span class="spinner-inline"></span> Processing...`;
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.origText || defaultText;
        }
    },

    async handleLogin() {
        this.clearMessages();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            this.showMessage('Please enter both email and password.');
            return;
        }

        this.setLoading('btnLoginSubmit', true);

        try {
            await SupabaseService.signIn(email, password);
            this.showMessage('Signed in successfully! Loading your FORGE workspace...', 'success');
            setTimeout(() => {
                this.hideAuthWall();
            }, 600);
        } catch (err) {
            this.showMessage(err.message || 'Invalid email or password. Please try again.');
        } finally {
            this.setLoading('btnLoginSubmit', false, 'Sign In →');
        }
    },

    async handleSignup() {
        this.clearMessages();
        const name = document.getElementById('signupName')?.value;
        const email = document.getElementById('signupEmail')?.value;
        const password = document.getElementById('signupPassword')?.value;
        const confirmPassword = document.getElementById('signupConfirmPassword')?.value;

        if (!name || !email || !password) {
            this.showMessage('Please complete all required fields.');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match. Please re-enter.');
            return;
        }

        this.setLoading('btnSignupSubmit', true);

        try {
            const res = await SupabaseService.signUp(name, email, password);
            if (res.user && !res.session) {
                // Email confirmation enabled on Supabase
                this.showMessage('Account created! Please check your email to confirm your account before logging in.', 'success');
                setTimeout(() => this.switchTab('login'), 3500);
            } else {
                this.showMessage('Account created successfully! Welcome to FORGE.', 'success');
                setTimeout(() => {
                    this.hideAuthWall();
                }, 800);
            }
        } catch (err) {
            this.showMessage(err.message || 'Could not create account. Please try again.');
        } finally {
            this.setLoading('btnSignupSubmit', false, 'Create Account →');
        }
    },

    async handleForgotPassword() {
        this.clearMessages();
        const email = document.getElementById('forgotEmail')?.value;
        if (!email) {
            this.showMessage('Please enter your account email address.');
            return;
        }

        this.setLoading('btnForgotSubmit', true);
        try {
            await SupabaseService.resetPassword(email);
            this.showMessage('Password reset instructions sent! Check your email inbox.', 'success');
        } catch (err) {
            this.showMessage(err.message || 'Could not send reset instructions.');
        } finally {
            this.setLoading('btnForgotSubmit', false, 'Send Reset Link');
        }
    },

    handleSaveSupabaseConfig() {
        const url = document.getElementById('setupUrl')?.value;
        const key = document.getElementById('setupAnonKey')?.value;

        if (!url || !key) {
            this.showMessage('Please enter both Supabase URL and Publishable Anon Key.');
            return;
        }

        SupabaseService.saveCustomConfig(url, key);
    },

    continueOfflineDemo() {
        // Allows local/offline testing if user desires without remote Supabase
        this.hideAuthWall();
        showToast('Running in local offline mode.', 'info');
    },

    showAuthWall(initialTab = 'login') {
        const wall = document.getElementById('authScreenModal');
        if (wall) {
            wall.classList.add('active');
            wall.style.display = 'flex';
        }
        document.body.classList.add('unauthenticated');
        this.switchTab(initialTab);
    },

    hideAuthWall() {
        const wall = document.getElementById('authScreenModal');
        if (wall) {
            wall.classList.remove('active');
            wall.style.display = 'none';
        }
        document.body.classList.remove('unauthenticated');
    },

    async handleUserSession(user) {
        this.hideAuthWall();
        this.renderProfileCard(user);

        if (typeof SyncEngine !== 'undefined') {
            SyncEngine.init();
        }

        // Determine Cases A - E
        await this.handleCloudReconciliation(user);
    },

    handleUserSignedOut() {
        this.renderProfileCard(null);
        if (typeof Store !== 'undefined' && Store.resetToDefault) {
            Store.resetToDefault();
        }
        this.showAuthWall('login');
        showToast('You have signed out of FORGE.', 'info');
    },

    renderProfileCard(user) {
        const container = document.getElementById('sidebarUserCard');
        if (!container) return;

        if (!user) {
            container.innerHTML = `
                <div class="user-card-content unauth" onclick="AuthController.showAuthWall('login')" title="Click to Sign In or Create Cloud Account">
                    <div class="user-avatar-placeholder">👤</div>
                    <div class="user-info-text">
                        <span class="user-name">Sign In / Register</span>
                        <span class="user-role">Cloud Sync Disabled</span>
                    </div>
                </div>
            `;
            const signOutBtn = document.getElementById('btnSidebarSignOut');
            if (signOutBtn) signOutBtn.style.display = 'none';
            this.updateSyncBadge('pending');
            return;
        }

        const name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Engineer';
        const email = user.email || '';
        const initials = name.slice(0, 2).toUpperCase();
        const isSynced = localStorage.getItem('studyos_cloud_synced') === 'true';

        container.innerHTML = `
            <div class="user-card-content" id="btnUserMenuToggle" onclick="AuthController.toggleUserDropdown(event)" title="Account Menu">
                <div class="user-avatar">${initials}</div>
                <div class="user-info-text">
                    <span class="user-name">${App.escapeHtml(name)}</span>
                    <span class="user-role">${App.escapeHtml(email)}</span>
                </div>
                <span class="user-menu-chevron">▾</span>
            </div>
            <div class="user-dropdown-menu" id="userDropdownMenu" style="display: none;">
                <div class="dropdown-header">
                    <b>${App.escapeHtml(name)}</b>
                    <small>${App.escapeHtml(email)}</small>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="App.openSettingsModal('ai')">
                    <span>⚙️</span> Settings & AI Key
                </button>
                <button class="dropdown-item" onclick="AuthController.triggerMigrationModal()">
                    <span>☁️</span> Cloud Sync & Migration
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item danger" onclick="AuthController.signOut()">
                    <span>🚪</span> Sign Out
                </button>
            </div>
        `;

        const signOutBtn = document.getElementById('btnSidebarSignOut');
        if (signOutBtn) signOutBtn.style.display = 'flex';

        this.updateSyncBadge(isSynced ? 'synced' : 'pending');
    },

    updateSyncBadge(status) {
        const badge = document.getElementById('sidebarCloudSyncBadge');
        if (!badge) return;
        badge.className = 'sync-status-badge';
        if (status === 'synced') {
            badge.classList.add('badge-synced');
            badge.textContent = 'Synced';
        } else if (status === 'error') {
            badge.classList.add('badge-error');
            badge.textContent = 'Error';
        } else {
            badge.classList.add('badge-pending');
            badge.textContent = 'Pending';
        }
    },

    toggleUserDropdown(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('userDropdownMenu');
        if (menu) {
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
        }
    },

    async signOut() {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.style.display = 'none';

        if (typeof Store !== 'undefined' && Store.flushPendingSave) {
            Store.flushPendingSave();
        }

        try {
            await SupabaseService.signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        }
        localStorage.removeItem('studyos_cloud_synced');
        this.handleUserSignedOut();
    },

    async handleCloudReconciliation(user) {
        if (!user || !user.id) return;
        const userId = user.id;

        const localCounts = this.getLocalCounts();
        const localHasData = localCounts.total > 0;
        const isAlreadySynced = localStorage.getItem(`studyos_migrated_${userId}`) === 'true';

        let cloudCounts = { total: 0 };
        try {
            cloudCounts = await SupabaseService.getCloudRecordCounts();
        } catch (e) {
            console.warn('[AuthController] Cloud count fetch warning:', e);
        }
        const cloudHasData = cloudCounts.total > 0;

        console.log(`[AuthController] Auth evaluation: localHasData=${localHasData}, cloudHasData=${cloudHasData}, isAlreadySynced=${isAlreadySynced}`);

        // Case E: Existing Synced User (Normal write-through session)
        if (isAlreadySynced && cloudHasData) {
            console.log('[AuthController] Case E: Existing synced user. Reconciling with cloud state...');
            if (typeof SyncEngine !== 'undefined') {
                await SyncEngine.pullCloudState();
                if (typeof App !== 'undefined' && App.onUserAuthenticated) {
                    await App.onUserAuthenticated(user);
                }
            }
            return;
        }

        // Case B: Existing Cloud User on Clean Device / Browser
        if (cloudHasData && !localHasData) {
            console.log('[AuthController] Case B: Cloud data detected on fresh device. Reconstructing from Supabase...');
            showToast('Loading your FORGE cloud workspace from Supabase...', 'info');
            if (typeof SyncEngine !== 'undefined') {
                await SyncEngine.pullCloudState();
                localStorage.setItem(`studyos_migrated_${userId}`, 'true');
                if (typeof App !== 'undefined' && App.onUserAuthenticated) {
                    await App.onUserAuthenticated(user);
                }
                showToast('Cloud workspace reconstructed successfully!', 'success');
            }
            return;
        }

        // Case A: New User with No Local Data
        if (!cloudHasData && !localHasData) {
            console.log('[AuthController] Case A: New user with empty state.');
            localStorage.setItem(`studyos_migrated_${userId}`, 'true');
            localStorage.setItem('studyos_cloud_synced', 'true');
            this.updateSyncBadge('synced');
            if (typeof App !== 'undefined' && App.onUserAuthenticated) {
                await App.onUserAuthenticated(user);
            }
            showToast('Welcome to FORGE! Cloud-first foundation active.', 'success');
            return;
        }

        // Case C: Local data exists, but Cloud is empty -> Offer Migration
        if (localHasData && !cloudHasData) {
            console.log('[AuthController] Case C: Local data detected with empty cloud. Prompting migration.');
            setTimeout(() => {
                this.showMigrationModal(false);
            }, 800);
            return;
        }

        // Case D: Local data exists AND Cloud data exists -> Show Reconciliation Preview
        if (localHasData && cloudHasData && !isAlreadySynced) {
            console.log('[AuthController] Case D: Local and cloud datasets coexist. Showing reconciliation preview.');
            setTimeout(() => {
                this.showMigrationModal(true);
            }, 800);
            return;
        }
    },

    checkMigrationPrompt(userId) {
        if (!userId) return;
        const alreadyMigrated = localStorage.getItem(`studyos_migrated_${userId}`);
        if (alreadyMigrated) return;

        const counts = this.getLocalCounts();
        if (counts.total > 0) {
            setTimeout(() => {
                this.showMigrationModal();
            }, 1000);
        }
    },

    getLocalCounts() {
        const s = (typeof Store !== 'undefined' && Store.memoryState) ? Store.memoryState : {};
        let dsaCount = 0;
        if (s.dsa) Object.values(s.dsa).forEach(v => { if (v && v.status && v.status !== 'NOT_STARTED') dsaCount++; });

        let devCount = 0;
        if (s.development) {
            ['topics', 'videos', 'tasks', 'projects'].forEach(k => {
                if (s.development[k]) {
                    Object.values(s.development[k]).forEach(v => {
                        if (v && v.status && v.status !== 'NOT_STARTED') devCount++;
                    });
                }
            });
        }

        let taskCount = 0;
        if (s.days) {
            Object.values(s.days).forEach(d => {
                if (d && Array.isArray(d.tasks)) {
                    taskCount += d.tasks.filter(t => t.status !== 'NOT_STARTED' || t.isStudy).length;
                }
            });
        }

        const sessionCount = Array.isArray(s.studySessions) ? s.studySessions.length : 0;
        const mistakeCount = Array.isArray(s.mistakes) ? s.mistakes.length : 0;
        const gymCount = (s.gym && Array.isArray(s.gym.sessions)) ? s.gym.sessions.length : 0;
        const placementCount = s.placementHub ? (
            Object.keys(s.placementHub.roadmaps || {}).length +
            (s.placementHub.weeklyTests || []).length +
            (s.placementHub.systemDesignInterviews || []).length
        ) : 0;
        const internshipCount = Array.isArray(s.internships) ? s.internships.length : 0;

        return {
            dsa: dsaCount,
            dev: devCount,
            tasks: taskCount,
            sessions: sessionCount,
            mistakes: mistakeCount,
            gym: gymCount,
            placement: placementCount,
            internships: internshipCount,
            total: dsaCount + devCount + taskCount + sessionCount + mistakeCount + gymCount + placementCount + internshipCount
        };
    },

    showMigrationModal(isReconciliation = false) {
        const modal = document.getElementById('cloudMigrationModal');
        if (modal) {
            modal.style.display = 'grid';
            modal.classList.add('active');

            const btn = document.getElementById('btnStartMigration');
            if (btn) {
                btn.textContent = isReconciliation ? 'Merge & Reconcile (Latest Wins)' : 'Start Cloud Migration';
            }

            this.refreshCloudStatus();
        }
    },

    closeMigrationModal() {
        const modal = document.getElementById('cloudMigrationModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    },

    triggerMigrationModal() {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.style.display = 'none';
        this.showMigrationModal();
    },

    async refreshCloudStatus() {
        const user = SupabaseService.currentUser;
        const isAuth = !!(user && user.id);
        const email = user ? user.email : null;

        // Connection dot & text
        const dot = document.getElementById('modalCloudStatusDot');
        const statusText = document.getElementById('modalCloudStatusText');
        const emailEl = document.getElementById('modalUserEmail');

        if (dot && statusText) {
            if (SupabaseService.isConfigured && isAuth) {
                dot.className = 'cloud-status-dot connected';
                statusText.textContent = '● Connected to Supabase';
                statusText.style.color = '#10b981';
            } else if (SupabaseService.isConfigured && !isAuth) {
                dot.className = 'cloud-status-dot disconnected';
                statusText.textContent = '○ Supabase Configured (Not Signed In)';
                statusText.style.color = '#f59e0b';
            } else {
                dot.className = 'cloud-status-dot disconnected';
                statusText.textContent = '○ Disconnected / Setup Required';
                statusText.style.color = '#f43f5e';
            }
        }

        if (emailEl) {
            emailEl.textContent = isAuth ? email : 'Not signed in — Click profile to sign in';
        }

        // Local data detection
        const counts = this.getLocalCounts();
        const localStatusEl = document.getElementById('modalLocalDataStatus');
        if (localStatusEl) {
            if (counts.total > 0) {
                localStatusEl.textContent = `Detected (${counts.total} items)`;
                localStatusEl.style.color = 'var(--gold)';
            } else {
                localStatusEl.textContent = 'Not detected (Empty)';
                localStatusEl.style.color = 'var(--text-muted)';
            }
        }

        // Update preview counts
        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        const setBadge = (id, text, type) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = text;
            el.className = `sync-status-badge badge-${type}`;
        };

        setText('prevCountDsa', `${counts.dsa} problems solved/attempted`);
        setText('prevCountDev', `${counts.dev} full-stack items`);
        setText('prevCountTasks', `${counts.tasks} scheduled tasks`);
        setText('prevCountSessions', `${counts.sessions} timed focus sessions`);
        setText('prevCountMistakes', `${counts.mistakes} logged mistakes`);
        setText('prevCountGym', `${counts.gym} workout sessions`);
        setText('prevCountPlacement', `${counts.placement} roadmaps & tests`);
        setText('prevCountInternships', `${counts.internships} job applications`);

        setBadge('prevBadgeDsa', counts.dsa > 0 ? 'Ready' : 'Empty', counts.dsa > 0 ? 'pending' : 'synced');
        setBadge('prevBadgeDev', counts.dev > 0 ? 'Ready' : 'Empty', counts.dev > 0 ? 'pending' : 'synced');
        setBadge('prevBadgeTasks', counts.tasks > 0 ? 'Ready' : 'Empty', counts.tasks > 0 ? 'pending' : 'synced');
        setBadge('prevBadgeSessions', counts.sessions > 0 ? 'Ready' : 'Empty', counts.sessions > 0 ? 'pending' : 'synced');
        setBadge('prevBadgeMistakes', counts.mistakes > 0 ? 'Ready' : 'Empty', counts.mistakes > 0 ? 'pending' : 'synced');
        setBadge('prevBadgeGym', counts.gym > 0 ? 'Ready' : 'Empty', counts.gym > 0 ? 'pending' : 'synced');
        setBadge('prevBadgePlacement', counts.placement > 0 ? 'Ready' : 'Empty', counts.placement > 0 ? 'pending' : 'synced');
        setBadge('prevBadgeInternships', counts.internships > 0 ? 'Ready' : 'Empty', counts.internships > 0 ? 'pending' : 'synced');

        // Check Cloud Data Status
        const cloudStatusEl = document.getElementById('modalCloudDataStatus');
        if (isAuth) {
            if (cloudStatusEl) cloudStatusEl.textContent = 'Checking cloud records...';
            try {
                const cloudCounts = await SupabaseService.getCloudRecordCounts();
                if (cloudStatusEl) {
                    if (cloudCounts.total > 0) {
                        cloudStatusEl.textContent = `Available (${cloudCounts.total} records)`;
                        cloudStatusEl.style.color = '#10b981';
                        this.updateSyncBadge('synced');
                    } else {
                        cloudStatusEl.textContent = 'Empty (0 records)';
                        cloudStatusEl.style.color = 'var(--text-muted)';
                    }
                }
            } catch (e) {
                if (cloudStatusEl) cloudStatusEl.textContent = 'Check failed';
            }
        } else {
            if (cloudStatusEl) cloudStatusEl.textContent = 'Sign in required';
        }
    },

    updateStatus(msg, pct = null) {
        const progressEl = document.getElementById('migrationProgressText');
        const progressFill = document.getElementById('migrationProgressBarFill');
        if (progressEl) progressEl.textContent = msg;
        if (pct !== null && progressFill) {
            progressFill.style.width = pct;
        }
    },

    updatesStatus(msg, pct = null) {
        this.updateStatus(msg, pct);
    },

    async performMigration() {
        if (!SupabaseService.isAuthenticated()) {
            showToast('Please sign in or create an account first.', 'warning');
            this.showAuthWall('login');
            return;
        }

        const counts = this.getLocalCounts();
        if (counts.total === 0) {
            showToast('No local FORGE data found to migrate.', 'info');
            return;
        }

        const progressWrap = document.getElementById('migrationProgressWrap');
        const progressEl = document.getElementById('migrationProgressText');
        const progressFill = document.getElementById('migrationProgressBarFill');
        const resultBox = document.getElementById('migrationResultBox');
        const resultDetails = document.getElementById('migrationResultDetails');
        const btn = document.getElementById('btnStartMigration');

        if (btn) btn.disabled = true;
        if (progressWrap) progressWrap.style.display = 'block';
        if (resultBox) resultBox.style.display = 'none';

        const updateStatus = (msg, pct = null) => {
            if (progressEl) progressEl.textContent = msg;
            if (pct !== null && progressFill) {
                progressFill.style.width = pct;
            }
        };
        const updatesStatus = updateStatus;

        try {
            updateStatus('Checking cloud database records...', '10%');

            // If both local and cloud exist, reconcile first
            const cloudCounts = await SupabaseService.getCloudRecordCounts();
            if (cloudCounts.total > 0 && typeof SyncEngine !== 'undefined') {
                updateStatus('Reconciling with existing cloud records...', '20%');
                await SyncEngine.pullCloudState();
            }

            updateStatus('Starting local data migration...', '30%');

            const report = await SupabaseService.migrateLocalDataToCloud(
                Store.memoryState,
                (msg) => {
                    updateStatus(msg, '60%');
                }
            );

            if (progressFill) progressFill.style.width = '100%';

            if (report.errors && report.errors.length > 0) {
                this.updateSyncBadge('error');
                showToast(`Migration finished with ${report.errors.length} warnings.`, 'warning');
                if (resultBox && resultDetails) {
                    resultBox.style.display = 'block';
                    resultBox.style.borderColor = 'var(--rose)';
                    resultBox.style.background = 'rgba(244, 63, 94, 0.08)';
                    document.getElementById('migrationResultTitle').textContent = '⚠️ Migration Completed with Warnings';
                    document.getElementById('migrationResultTitle').style.color = 'var(--rose)';
                    resultDetails.innerHTML = `
                        <div>${report.tasksMigrated} tasks / calendar records migrated</div>
                        <div>${report.dsaMigrated} DSA records migrated</div>
                        <div>${report.devMigrated} development records migrated</div>
                        <div>${report.mistakesMigrated} mistakes migrated</div>
                        <div>${report.gymSessionsMigrated} gym sessions (${report.gymExercisesMigrated} exercises, ${report.gymSetsMigrated} sets) migrated</div>
                        <div>${report.studySessionsMigrated} study sessions migrated</div>
                        <div>${report.internshipsMigrated} internships migrated</div>
                        <div>${report.photosMigrated} private gym photos migrated to Storage</div>
                        <div style="margin-top: 8px; color: var(--rose);">Warnings: ${report.errors.join(', ')}</div>
                    `;
                }
            } else {
                this.updateSyncBadge('synced');
                showToast('✅ Cloud Migration Complete! Your FORGE records are safely synchronized.', 'success');
                if (resultBox && resultDetails) {
                    resultBox.style.display = 'block';
                    resultBox.style.borderColor = '#10b981';
                    resultBox.style.background = 'rgba(16, 185, 129, 0.08)';
                    document.getElementById('migrationResultTitle').textContent = '✅ Migration Completed';
                    document.getElementById('migrationResultTitle').style.color = '#10b981';
                    resultDetails.innerHTML = `
                        <div><b>${report.tasksMigrated}</b> tasks / calendar records migrated</div>
                        <div><b>${report.dsaMigrated}</b> DSA records migrated</div>
                        <div><b>${report.devMigrated}</b> development records migrated</div>
                        <div><b>${report.mistakesMigrated}</b> mistakes migrated</div>
                        <div><b>${report.gymSessionsMigrated}</b> gym sessions (${report.gymExercisesMigrated} exercises, ${report.gymSetsMigrated} sets) migrated</div>
                        <div><b>${report.studySessionsMigrated}</b> study sessions migrated</div>
                        <div><b>${report.internshipsMigrated}</b> internship records migrated</div>
                        <div><b>${report.photosMigrated}</b> private gym photos securely stored</div>
                    `;
                }
            }

            // Refresh status & UI
            await this.refreshCloudStatus();
            if (btn) btn.disabled = false;
            if (typeof App !== 'undefined' && App.renderAll) App.renderAll();

        } catch (err) {
            this.updateSyncBadge('error');
            if (progressEl) progressEl.textContent = 'Migration failed: ' + err.message;
            if (btn) btn.disabled = false;
            showToast('Migration error: ' + err.message, 'error');
        }
    },

    async pullCloudData() {
        if (!SupabaseService.isAuthenticated()) {
            showToast('Please sign in to pull your cloud data.', 'warning');
            this.showAuthWall('login');
            return;
        }

        const btn = document.getElementById('btnPullCloudData');
        const progressWrap = document.getElementById('migrationProgressWrap');
        const progressEl = document.getElementById('migrationProgressText');

        if (btn) btn.disabled = true;
        if (progressWrap) progressWrap.style.display = 'block';

        const updateStatus = (msg) => {
            if (progressEl) progressEl.textContent = msg;
        };
        const updatesStatus = updateStatus;

        try {
            updateStatus('Connecting to Supabase Cloud...');
            const res = await SupabaseService.pullCloudDataToLocal((msg) => {
                updateStatus(msg);
            });

            this.updateSyncBadge('synced');
            showToast(`✅ Successfully pulled ${res.count} records from Supabase Cloud!`, 'success');
            await this.refreshCloudStatus();

            setTimeout(() => {
                if (progressWrap) progressWrap.style.display = 'none';
                if (btn) btn.disabled = false;
                if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
            }, 1000);
        } catch (err) {
            this.updateSyncBadge('error');
            if (progressEl) progressEl.textContent = 'Pull failed: ' + err.message;
            if (btn) btn.disabled = false;
            showToast('Error pulling cloud data: ' + err.message, 'error');
        }
    }
};

// Close dropdown on window click
window.addEventListener('click', (e) => {
    const menu = document.getElementById('userDropdownMenu');
    if (menu && menu.style.display === 'block') {
        const toggle = document.getElementById('btnUserMenuToggle');
        if (!toggle || !toggle.contains(e.target)) {
            menu.style.display = 'none';
        }
    }
});

if (typeof window !== 'undefined') {
    window.AuthController = AuthController;
    window.AuthSystem = AuthController;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthController, AuthSystem: AuthController };
}
