/**
 * BOSS Study OS — Supabase Service & Cloud Data Synchronization Layer
 * Manages Supabase Auth, PostgreSQL persistence with Row Level Security,
 * Private Gym Photo Storage, and LocalStorage-to-Cloud Data Migration.
 */

const SupabaseService = {
    client: null,
    isConfigured: false,
    currentUser: null,
    currentSession: null,
    authListeners: [],
    _initPromise: null,

    // -------------------------------------------------------------------------
    // Initialization & Configuration
    // -------------------------------------------------------------------------
    async init() {
        if (this._initPromise) return this._initPromise;
        this._initPromise = this._doInit();
        return this._initPromise;
    },

    async _doInit() {
        let config = null;

        // 1. Try fetching public configuration from server environment
        try {
            const res = await fetch('/api/auth/config');
            if (res.ok) {
                const data = await res.json();
                if (data && data.supabaseUrl && data.supabaseAnonKey) {
                    config = {
                        url: data.supabaseUrl.trim(),
                        key: data.supabaseAnonKey.trim()
                    };
                }
            }
        } catch (e) {
            console.warn('[SupabaseService] Could not reach /api/auth/config:', e.message);
        }

        // 2. Check window override or localStorage fallback for development/custom projects
        if (!config || !config.url || !config.key) {
            const localSaved = localStorage.getItem('studyos_supabase_custom_config');
            if (localSaved) {
                try {
                    const parsed = JSON.parse(localSaved);
                    if (parsed.url && parsed.key) config = parsed;
                } catch (e) {}
            }
        }

        // 3. Fallback to window globals if set
        if ((!config || !config.url) && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            config = {
                url: window.SUPABASE_URL,
                key: window.SUPABASE_ANON_KEY
            };
        }

        if (!config || !config.url || !config.key) {
            console.info('[SupabaseService] Supabase credentials not yet configured. Prompting for setup or running in local mode.');
            this.isConfigured = false;
            return false;
        }

        try {
            // Verify window.supabase constructor is available
            const createClientFn = window.supabase?.createClient;
            if (typeof createClientFn !== 'function') {
                console.error('[SupabaseService] Supabase client library not found on window. Ensure supabase.js is loaded.');
                return false;
            }

            this.client = createClientFn(config.url, config.key, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    storageKey: 'studyos-supabase-auth'
                }
            });

            this.isConfigured = true;

            // Fetch initial session
            const { data: { session }, error } = await this.client.auth.getSession();
            if (error) {
                console.warn('[SupabaseService] getSession error:', error.message);
            }

            if (session) {
                this.currentSession = session;
                this.currentUser = session.user;
                this._syncAuthCookie(session.access_token);
                if (typeof SyncEngine !== 'undefined' && SyncEngine.initRealtime) {
                    SyncEngine.initRealtime(this.client, session.user.id);
                }
            }

            // Listen for auth state transitions
            this.client.auth.onAuthStateChange(async (event, session) => {
                console.log('[SupabaseService] Auth state changed:', event);
                this.currentSession = session;
                this.currentUser = session ? session.user : null;

                if (session && session.access_token) {
                    this._syncAuthCookie(session.access_token);
                    if (typeof SyncEngine !== 'undefined' && SyncEngine.initRealtime) {
                        SyncEngine.initRealtime(this.client, session.user.id);
                    }
                } else {
                    this._clearAuthCookie();
                    if (typeof SyncEngine !== 'undefined' && SyncEngine.unsubscribeRealtime) {
                        SyncEngine.unsubscribeRealtime();
                    }
                }

                // Notify all registered listeners
                this.notifyAuthListeners(event, session);
            });

            return true;
        } catch (err) {
            console.error('[SupabaseService] Initialization failed:', err);
            this.isConfigured = false;
            return false;
        }
    },

    saveCustomConfig(url, key) {
        if (!url || !key) return false;
        localStorage.setItem('studyos_supabase_custom_config', JSON.stringify({ url: url.trim(), key: key.trim() }));
        window.location.reload();
        return true;
    },

    clearCustomConfig() {
        localStorage.removeItem('studyos_supabase_custom_config');
        window.location.reload();
    },

    onAuthStateChange(listener) {
        if (typeof listener === 'function') {
            this.authListeners.push(listener);
        }
    },

    isAuthenticated() {
        return !!(this.client && (this.currentUser || this.currentSession));
    },

    notifyAuthListeners(event, session) {
        this.authListeners.forEach(fn => {
            try {
                fn(event, session);
            } catch (err) {
                console.error('[SupabaseService] Listener error:', err);
            }
        });
    },

    _syncAuthCookie(accessToken) {
        if (!accessToken) return;
        try {
            document.cookie = `sb-access-token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
        } catch (e) {}
    },

    _clearAuthCookie() {
        try {
            document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax`;
        } catch (e) {}
    },

    getAccessToken() {
        return this.currentSession?.access_token || '';
    },

    getUserId() {
        return this.currentUser?.id || null;
    },

    isAuthenticated() {
        return !!(this.currentUser && this.currentUser.id);
    },

    // -------------------------------------------------------------------------
    // Authentication Operations (Email + Password)
    // -------------------------------------------------------------------------
    async signUp(name, email, password) {
        if (!this.isConfigured || !this.client) {
            throw new Error('Supabase is not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and key in .env or Settings.');
        }

        const trimmedEmail = email ? email.trim() : '';
        const trimmedName = name ? name.trim() : '';

        if (!trimmedEmail || !trimmedEmail.includes('@')) {
            throw new Error('Please enter a valid email address.');
        }
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        const { data, error } = await this.client.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
                data: {
                    display_name: trimmedName || trimmedEmail.split('@')[0]
                }
            }
        });

        if (error) throw error;

        // Auto-create or verify profile in public.profiles table
        if (data.user) {
            await this.ensureProfile(data.user.id, trimmedName || trimmedEmail.split('@')[0]);
        }

        return data;
    },

    async signIn(email, password) {
        if (!this.isConfigured || !this.client) {
            throw new Error('Supabase is not configured. Please enter your Supabase URL & Anon Key.');
        }

        const trimmedEmail = email ? email.trim() : '';
        if (!trimmedEmail) throw new Error('Please enter your email.');
        if (!password) throw new Error('Please enter your password.');

        const { data, error } = await this.client.auth.signInWithPassword({
            email: trimmedEmail,
            password
        });

        if (error) throw error;

        this.currentSession = data.session;
        this.currentUser = data.user;
        this._syncAuthCookie(data.session.access_token);

        return data;
    },

    async signOut() {
        if (this.client) {
            try {
                await this.client.auth.signOut();
            } catch (e) {
                console.warn('[SupabaseService] signOut error:', e);
            }
        }
        this.currentSession = null;
        this.currentUser = null;
        this._clearAuthCookie();
        this._signedUrlCache = new Map();
    },

    async resetPassword(email) {
        if (!this.isConfigured || !this.client) {
            throw new Error('Supabase is not configured.');
        }
        const trimmedEmail = email ? email.trim() : '';
        if (!trimmedEmail) throw new Error('Please enter your email address.');

        const { data, error } = await this.client.auth.resetPasswordForEmail(trimmedEmail, {
            redirectTo: window.location.origin
        });

        if (error) throw error;
        return data;
    },

    async updatePassword(newPassword) {
        if (!this.isConfigured || !this.client) {
            throw new Error('Supabase is not configured.');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters.');
        }

        const { data, error } = await this.client.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        return data;
    },

    // -------------------------------------------------------------------------
    // User Profile
    // -------------------------------------------------------------------------
    async ensureProfile(userId, displayName) {
        if (!this.client || !userId) return;
        try {
            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!data && !error) {
                await this.client.from('profiles').insert([{
                    id: userId,
                    display_name: displayName || 'StudyOS Engineer',
                    timezone: 'Asia/Kolkata',
                    updated_at: new Date().toISOString()
                }]);
            }
        } catch (e) {
            console.warn('[SupabaseService] ensureProfile error:', e.message);
        }
    },

    async getProfile() {
        const userId = this.getUserId();
        if (!this.client || !userId) return null;
        try {
            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) return null;
            return data;
        } catch (e) {
            return null;
        }
    },

    async updateProfile(updates) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const { data, error } = await this.client
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('[SupabaseService] updateProfile error:', e);
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // Full Cloud Data Fetch (For Authenticated User) — Parallelized (Phase 2C)
    // -------------------------------------------------------------------------
    async loadUserData() {
        const userId = this.getUserId();
        if (!this.client || !userId) return null;

        const results = {};

        try {
            // Parallelize all 12 independent root queries in a single network dispatch
            const [
                profileRes,
                tasksRes,
                sessionsRes,
                dsaRes,
                devRes,
                mistakesRes,
                planRes,
                workoutSessionsRes,
                prsRes,
                placementDataRes,
                internshipsRes,
                aiSettingsRes,
                gateAttemptsRes,
                gateTopicProgressRes
            ] = await Promise.all([
                this.client.from('profiles').select('*').eq('id', userId).maybeSingle(),
                this.client.from('study_tasks').select('*').eq('user_id', userId),
                this.client.from('study_sessions').select('*').eq('user_id', userId).order('date', { ascending: false }),
                this.client.from('dsa_progress').select('*').eq('user_id', userId),
                this.client.from('development_progress').select('*').eq('user_id', userId),
                this.client.from('mistakes').select('*').eq('user_id', userId).order('date', { ascending: false }),
                this.client.from('workout_plans').select('*').eq('user_id', userId).maybeSingle(),
                this.client.from('workout_sessions').select('*').eq('user_id', userId).order('date', { ascending: false }),
                this.client.from('personal_records').select('*').eq('user_id', userId),
                this.client.from('placement_hub_data').select('*').eq('user_id', userId).maybeSingle(),
                this.client.from('internships').select('*').eq('user_id', userId),
                this.client.from('ai_settings').select('*').eq('user_id', userId).maybeSingle(),
                this.client.from('gate_pyq_attempts').select('*').eq('user_id', userId).order('attempted_at', { ascending: false }),
                this.client.from('gate_topic_progress').select('*').eq('user_id', userId)
            ]);

            results.profile = profileRes?.data || null;
            results.tasks = tasksRes?.data || [];
            results.studySessions = sessionsRes?.data || [];
            results.dsa = dsaRes?.data || [];
            results.development = devRes?.data || [];
            results.mistakes = mistakesRes?.data || [];
            results.workoutPlan = planRes?.data || null;
            results.personalRecords = prsRes?.data || [];
            results.placementHub = placementDataRes?.data || null;
            results.internships = internshipsRes?.data || [];
            results.aiSettings = aiSettingsRes?.data || null;
            results.gateAttempts = gateAttemptsRes?.data || [];
            results.gateTopicProgress = gateTopicProgressRes?.data || [];

            // Relational queries for Workout Sessions (exercises & sets)
            const workoutSessions = workoutSessionsRes?.data || [];
            if (workoutSessions.length > 0) {
                const sessionIds = workoutSessions.map(s => s.id);
                const { data: exercises } = await this.client.from('workout_exercises').select('*').in('session_id', sessionIds);

                const exerciseMap = {};
                (exercises || []).forEach(ex => {
                    if (!exerciseMap[ex.session_id]) exerciseMap[ex.session_id] = [];
                    exerciseMap[ex.session_id].push(ex);
                });

                const exerciseIds = (exercises || []).map(e => e.id);
                let setsMap = {};
                if (exerciseIds.length > 0) {
                    const { data: sets } = await this.client.from('workout_sets').select('*').in('workout_exercise_id', exerciseIds);
                    (sets || []).forEach(st => {
                        if (!setsMap[st.workout_exercise_id]) setsMap[st.workout_exercise_id] = [];
                        setsMap[st.workout_exercise_id].push(st);
                    });
                }

                workoutSessions.forEach(s => {
                    const sessEx = exerciseMap[s.id] || [];
                    const exercises = sessEx.map(ex => ({
                        id: ex.id,
                        exerciseId: ex.exercise_id,
                        name: ex.exercise_name_snapshot,
                        exerciseName: ex.exercise_name_snapshot,
                        muscleGroup: ex.muscle_group,
                        equipment: ex.equipment,
                        skipped: ex.skipped,
                        notes: ex.notes,
                        sets: (setsMap[ex.id] || []).map(st => ({
                            setNumber: st.set_number,
                            weightKg: parseFloat(st.weight_kg) || 0,
                            reps: parseInt(st.reps, 10) || 0,
                            rpe: st.rpe,
                            completed: st.completed,
                            isWeightPr: st.is_weight_pr,
                            isRepPr: st.is_rep_pr,
                            completedAt: st.completed_at
                        }))
                    }));
                    s.exercises = exercises;

                    // Ensure both camelCase and snake_case properties are populated
                    const routineName = (s.workout_type || s.workoutType || 'Custom Workout').trim();
                    s.routineName = routineName;
                    s.workoutType = routineName;
                    s.workout_type = routineName;
                    s.duration = Number(s.duration_minutes ?? s.duration ?? 0) || 0;
                    s.durationMinutes = s.duration;

                    // Recalculate sets and volume from relational exercises & sets if denormalized fields are 0
                    let calcSets = 0;
                    let calcVolume = 0;
                    let calcReps = 0;
                    exercises.forEach(ex => {
                        if (!ex.skipped) {
                            (ex.sets || []).forEach(st => {
                                if (st.completed !== false && (st.reps > 0 || st.weightKg > 0 || st.completed === true)) {
                                    calcSets++;
                                    calcReps += st.reps;
                                    calcVolume += (st.weightKg * st.reps);
                                }
                            });
                        }
                    });

                    s.total_sets = (s.total_sets && s.total_sets > 0) ? s.total_sets : calcSets;
                    s.totalSets = s.total_sets;
                    s.total_volume_kg = (s.total_volume_kg && Number(s.total_volume_kg) > 0) ? Number(s.total_volume_kg) : Math.round(calcVolume);
                    s.totalVolumeKg = s.total_volume_kg;
                    s.total_reps = (s.total_reps && s.total_reps > 0) ? s.total_reps : calcReps;
                    s.totalReps = s.total_reps;
                });
            }
            results.workoutSessions = workoutSessions;

            return results;
        } catch (err) {
            console.error('[SupabaseService] loadUserData error:', err);
            return null;
        }
    },

    // -------------------------------------------------------------------------
    // Batched Sync Methods (Phase 2C Performance)
    // -------------------------------------------------------------------------
    async saveStudyTasksBatch(items) {
        const userId = this.getUserId();
        if (!this.client || !userId || !Array.isArray(items) || items.length === 0) return false;
        try {
            const now = new Date().toISOString();
            const rows = items.map(({ dateStr, task }) => {
                const meta = {
                    ...(task.metadata || {}),
                    priority: task.priority || 'NORMAL',
                    duration: task.duration || null,
                    custom: !!task.custom || (task.id && task.id.includes('custom'))
                };
                return {
                    user_id: userId,
                    date: dateStr,
                    task_id: task.id,
                    title: task.title,
                    category: task.category || 'DSA',
                    start_time: task.startTime || null,
                    end_time: task.endTime || null,
                    status: task.status || 'NOT_STARTED',
                    is_study: !!task.isStudy,
                    notes: task.notes || null,
                    crosses_midnight: !!task.crossesMidnight,
                    rescheduled_to: task.rescheduledTo || null,
                    history: task.history || [],
                    interrupt_reason: task.interruptReason || null,
                    is_block: !!task.isBlock,
                    dsa_problem_id: task.dsaProblemId ? String(task.dsaProblemId) : null,
                    metadata: meta,
                    updated_at: now
                };
            });

            const { error } = await this.client
                .from('study_tasks')
                .upsert(rows, { onConflict: 'user_id,date,task_id' });

            if (error) {
                if (error.message && (error.message.includes('column') || error.message.includes('schema'))) {
                    const fallbackRows = rows.map(r => ({
                        user_id: r.user_id,
                        date: r.date,
                        task_id: r.task_id,
                        title: r.title,
                        category: r.category,
                        start_time: r.start_time,
                        end_time: r.end_time,
                        status: r.status,
                        is_study: r.is_study,
                        notes: r.notes,
                        crosses_midnight: r.crosses_midnight,
                        rescheduled_to: r.rescheduled_to,
                        history: r.history,
                        updated_at: r.updated_at
                    }));
                    const { error: fErr } = await this.client
                        .from('study_tasks')
                        .upsert(fallbackRows, { onConflict: 'user_id,date,task_id' });
                    if (fErr) throw fErr;
                    return true;
                }
                throw error;
            }
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveStudyTasksBatch error:', e.message);
            return false;
        }
    },

    async saveDsaProgressBatch(items) {
        const userId = this.getUserId();
        if (!this.client || !userId || !Array.isArray(items) || items.length === 0) return false;
        try {
            const rows = items.map(p => ({
                user_id: userId,
                problem_id: String(p.problemId),
                status: p.status || 'NOT_STARTED',
                notes: p.notes || null,
                solved_date: p.solvedAt || (p.status === 'SOLVED' ? DateUtils.todayIST() : null),
                updated_at: new Date().toISOString()
            }));
            const { error } = await this.client
                .from('dsa_progress')
                .upsert(rows, { onConflict: 'user_id,problem_id' });
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveDsaProgressBatch error:', e.message);
            return false;
        }
    },

    async saveDevelopmentProgressBatch(items) {
        const userId = this.getUserId();
        if (!this.client || !userId || !Array.isArray(items) || items.length === 0) return false;
        try {
            const rows = items.map(p => ({
                user_id: userId,
                category: p.category,
                item_id: p.itemId,
                status: p.status || 'NOT_STARTED',
                notes: p.notes || null,
                repo_link: p.repoLink || null,
                live_link: p.liveLink || null,
                solved_date: p.solvedAt || (p.status === 'COMPLETED' ? DateUtils.todayIST() : null),
                updated_at: new Date().toISOString()
            }));
            const { error } = await this.client
                .from('development_progress')
                .upsert(rows, { onConflict: 'user_id,category,item_id' });
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveDevelopmentProgressBatch error:', e.message);
            return false;
        }
    },

    async saveMistakesBatch(items) {
        const userId = this.getUserId();
        if (!this.client || !userId || !Array.isArray(items) || items.length === 0) return false;
        try {
            const rows = items.map(m => ({
                id: m.id || undefined,
                user_id: userId,
                date: m.date || DateUtils.todayIST(),
                title: m.title,
                category: m.category || 'DSA',
                severity: m.severity || 'MEDIUM',
                problem_type: m.problemType || 'SYNTAX',
                root_cause: m.rootCause || null,
                fix_description: m.fixDescription || null,
                tags: m.tags || [],
                code_snippet: m.codeSnippet || null,
                learned_rule: m.learnedRule || null,
                revisited: !!m.revisited,
                updated_at: new Date().toISOString()
            }));
            const { error } = await this.client
                .from('mistakes')
                .upsert(rows);
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveMistakesBatch error:', e.message);
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // Individual Sync Methods (Cloud Persistence)
    // -------------------------------------------------------------------------
    async saveStudyTask(dateStr, task) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const meta = {
                ...(task.metadata || {}),
                priority: task.priority || 'NORMAL',
                duration: task.duration || null,
                custom: !!task.custom || (task.id && task.id.includes('custom'))
            };

            const row = {
                user_id: userId,
                date: dateStr,
                task_id: task.id,
                title: task.title,
                category: task.category || 'DSA',
                start_time: task.startTime || null,
                end_time: task.endTime || null,
                status: task.status || 'NOT_STARTED',
                is_study: !!task.isStudy,
                notes: task.notes || null,
                crosses_midnight: !!task.crossesMidnight,
                rescheduled_to: task.rescheduledTo || null,
                history: task.history || [],
                interrupt_reason: task.interruptReason || null,
                is_block: !!task.isBlock,
                dsa_problem_id: task.dsaProblemId ? String(task.dsaProblemId) : null,
                metadata: meta,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('study_tasks')
                .upsert(row, { onConflict: 'user_id,date,task_id' });

            if (error) {
                // Graceful fallback in case new columns are not yet applied on remote instance
                if (error.message && (error.message.includes('column') || error.message.includes('schema'))) {
                    const fallbackRow = {
                        user_id: userId,
                        date: dateStr,
                        task_id: task.id,
                        title: task.title,
                        category: task.category || 'DSA',
                        start_time: task.startTime || null,
                        end_time: task.endTime || null,
                        status: task.status || 'NOT_STARTED',
                        is_study: !!task.isStudy,
                        notes: task.notes || null,
                        crosses_midnight: !!task.crossesMidnight,
                        rescheduled_to: task.rescheduledTo || null,
                        history: task.history || [],
                        updated_at: new Date().toISOString()
                    };
                    const { error: fErr } = await this.client
                        .from('study_tasks')
                        .upsert(fallbackRow, { onConflict: 'user_id,date,task_id' });
                    if (fErr) throw fErr;
                    return true;
                }
                throw error;
            }
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveStudyTask error:', e.message);
            return false;
        }
    },

    async deleteStudyTask(dateStr, taskId) {
        const userId = this.getUserId();
        if (!this.client || !userId || !taskId) return false;
        try {
            const { error } = await this.client
                .from('study_tasks')
                .delete()
                .eq('user_id', userId)
                .eq('date', dateStr)
                .eq('task_id', taskId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] deleteStudyTask error:', e.message);
            return false;
        }
    },

    async savePlacementHubData(placementData) {
        const userId = this.getUserId();
        if (!this.client || !userId || !placementData) return false;
        try {
            const row = {
                user_id: userId,
                roadmaps: placementData.roadmaps || {},
                resources: placementData.resources || {},
                notes: placementData.notes || [],
                bookmarks: placementData.bookmarks || [],
                question_performance: placementData.questionPerformance || placementData.question_performance || {},
                system_design_interviews: placementData.systemDesignInterviews || placementData.system_design_interviews || [],
                weekly_tests: placementData.weeklyTests || placementData.weekly_tests || [],
                weak_areas: placementData.weakAreas || placementData.weak_areas || [],
                placement_target: placementData.placementTarget || placementData.placement_target || { achieved: false },
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('placement_hub_data')
                .upsert(row, { onConflict: 'user_id' });

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] savePlacementHubData error:', e.message);
            return false;
        }
    },

    async saveInternship(internship) {
        const userId = this.getUserId();
        if (!this.client || !userId || !internship) return false;
        try {
            const row = {
                user_id: userId,
                company: internship.company || 'Unknown',
                role: internship.role || 'SDE Intern',
                date_applied: internship.dateApplied || internship.date_applied || null,
                status: internship.status || 'SAVED',
                link: internship.link || null,
                notes: internship.notes || null,
                updated_at: new Date().toISOString()
            };

            if (internship.id && !String(internship.id).startsWith('temp_') && !String(internship.id).startsWith('intern_')) {
                row.id = internship.id;
            }

            const { data, error } = await this.client
                .from('internships')
                .upsert(row)
                .select()
                .single();

            if (error) throw error;
            return data || true;
        } catch (e) {
            console.warn('[SupabaseService] saveInternship error:', e.message);
            return false;
        }
    },

    async deleteInternship(id) {
        const userId = this.getUserId();
        if (!this.client || !userId || !id) return false;
        try {
            const { error } = await this.client
                .from('internships')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] deleteInternship error:', e.message);
            return false;
        }
    },

    async saveStudySession(session) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const row = {
                user_id: userId,
                date: session.date,
                subject: session.subject || 'DSA',
                topic: session.topic || null,
                active_seconds: session.activeSeconds || 0,
                break_seconds: session.breakSeconds || 0,
                camera_enabled: !!session.cameraEnabled,
                presence_rate: session.presenceRate ?? 100,
                ai_insight: session.aiInsight || null,
                start_time: session.startTime || null,
                end_time: session.endTime || null,
                created_at: session.createdAt || new Date().toISOString()
            };

            const { error } = await this.client.from('study_sessions').insert([row]);
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveStudySession error:', e.message);
            return false;
        }
    },

    async saveGatePyqAttempt(attempt) {
        const userId = this.getUserId();
        if (!this.client || !userId || !attempt) return false;
        try {
            const row = {
                user_id: userId,
                pyq_id: attempt.pyqId || attempt.pyq_id,
                subject_id: attempt.subjectId || attempt.subject_id,
                topic_id: attempt.topicId || attempt.topic_id,
                year: attempt.year || 2024,
                attempted_at: attempt.attemptedAt || attempt.attempted_at || new Date().toISOString(),
                status: attempt.status || 'ATTEMPTED',
                is_correct: !!attempt.isCorrect,
                time_taken_seconds: Number(attempt.timeTakenSeconds || 0),
                confidence: attempt.confidence || 'MEDIUM',
                mistake_type: attempt.mistakeType || null,
                notes: attempt.notes || '',
                revision_due_at: attempt.revisionDueAt || null,
                created_at: attempt.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client.from('gate_pyq_attempts').upsert([row], {
                onConflict: 'user_id, pyq_id, attempted_at'
            });
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveGatePyqAttempt error:', e.message);
            return false;
        }
    },

    async saveGateTopicProgress(progress) {
        const userId = this.getUserId();
        if (!this.client || !userId || !progress) return false;
        try {
            const row = {
                user_id: userId,
                subject_id: progress.subjectId || progress.subject_id,
                topic_id: progress.topicId || progress.topic_id,
                total_attempted: Number(progress.totalAttempted || 0),
                total_correct: Number(progress.totalCorrect || 0),
                total_wrong: Number(progress.totalWrong || 0),
                total_skipped: Number(progress.totalSkipped || 0),
                accuracy_percent: Number(progress.accuracyPercent || 0),
                mastery_percent: Number(progress.masteryPercent || 0),
                last_practiced_at: progress.lastPracticedAt || new Date().toISOString(),
                revision_due: !!progress.revisionDue,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client.from('gate_topic_progress').upsert([row], {
                onConflict: 'user_id, topic_id'
            });
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveGateTopicProgress error:', e.message);
            return false;
        }
    },

    async saveDsaProgress(problemId, status, notes = '', solvedAt = null) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const row = {
                user_id: userId,
                problem_id: String(problemId),
                status: status || 'NOT_STARTED',
                notes: notes || '',
                solved_at: solvedAt,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('dsa_progress')
                .upsert(row, { onConflict: 'user_id,problem_id' });

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveDsaProgress error:', e.message);
            return false;
        }
    },

    async saveDevelopmentProgress(category, itemId, status, notes = '', solvedAt = null) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const row = {
                user_id: userId,
                category,
                item_id: String(itemId),
                status: status || 'NOT_STARTED',
                notes: notes || '',
                solved_at: solvedAt,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('development_progress')
                .upsert(row, { onConflict: 'user_id,category,item_id' });

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveDevelopmentProgress error:', e.message);
            return false;
        }
    },

    async saveMistake(mistake) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const row = {
                user_id: userId,
                question: mistake.question,
                subject: mistake.subject || 'DSA',
                topic: mistake.topic || null,
                source: mistake.source || null,
                date: mistake.date || new Date().toISOString().slice(0, 10),
                user_answer: mistake.userAnswer || null,
                correct_answer: mistake.correctAnswer || null,
                explanation: mistake.explanation || null,
                mistake_type: mistake.mistakeType || null,
                personal_note: mistake.personalNote || null,
                revisit_date: mistake.revisitDate || null,
                repeat_count: mistake.repeatCount || 1,
                resolved: !!mistake.resolved,
                updated_at: new Date().toISOString()
            };

            if (mistake.id && !mistake.id.startsWith('mst_')) {
                row.id = mistake.id;
            }

            const { error } = await this.client
                .from('mistakes')
                .upsert(row);

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveMistake error:', e.message);
            return false;
        }
    },

    async deleteMistake(mistakeId) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const { error } = await this.client
                .from('mistakes')
                .delete()
                .eq('id', mistakeId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            return false;
        }
    },

    async saveWorkoutPlan(schedule, settings = {}) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            // Canonical schedule normalization
            const cleanSchedule = {};
            const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            dayKeys.forEach(k => {
                const day = (schedule && schedule[k]) ? schedule[k] : {};
                const dayCapital = k.charAt(0).toUpperCase() + k.slice(1);
                const rName = (day.routineName || day.workoutType || (day.isRestDay ? 'Rest' : `${dayCapital} Workout`)).trim();
                cleanSchedule[k] = {
                    dayKey: k,
                    dayName: dayCapital,
                    routineName: rName,
                    workoutType: rName,
                    isRestDay: !!day.isRestDay,
                    muscleGroups: Array.isArray(day.muscleGroups) ? day.muscleGroups : (rName && !day.isRestDay ? rName.split('+').map(s => s.trim()) : []),
                    exercises: Array.isArray(day.exercises) ? day.exercises : []
                };
            });

            const row = {
                user_id: userId,
                is_configured: true,
                settings: settings || {},
                schedule: cleanSchedule,
                updated_at: new Date().toISOString()
            };

            const { error } = await this.client
                .from('workout_plans')
                .upsert(row, { onConflict: 'user_id' });

            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[SupabaseService] saveWorkoutPlan error:', e.message);
            return false;
        }
    },

    _isValidUuid(id) {
        return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    },

    _generateUuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    async saveWorkoutSession(sessionData) {
        const userId = this.getUserId();
        if (!this.client || !userId) {
            throw new Error('User authentication required to save workout session.');
        }

        let photoPath = sessionData.gym_photo_path || sessionData.gymPhoto?.storagePath;
        const sessionId = (sessionData.id && this._isValidUuid(sessionData.id)) ? sessionData.id : this._generateUuid();

        // If an offline workout had a captured base64 photo, upload it to gym-photos now
        if (!photoPath && (sessionData.gymPhoto?.base64 || (sessionData.gymPhoto?.url && sessionData.gymPhoto.url.startsWith('data:')))) {
            const raw = sessionData.gymPhoto.base64 || sessionData.gymPhoto.url;
            const blob = this.base64ToBlob(raw);
            if (blob) {
                try {
                    const uploadRes = await this.uploadGymPhotoBlob(blob, sessionId);
                    if (uploadRes && uploadRes.path) {
                        photoPath = uploadRes.path;
                        sessionData.gym_photo_path = photoPath;
                        if (sessionData.gymPhoto) {
                            sessionData.gymPhoto.storagePath = photoPath;
                            delete sessionData.gymPhoto.base64;
                        }
                    }
                } catch (uErr) {
                    console.warn('[SupabaseService] Offline photo upload failed during saveWorkoutSession:', uErr);
                }
            }
        }

        if (!photoPath) {
            throw new Error('Mandatory gym photo path missing. Every session requires a verified gym photo.');
        }

        photoPath = this.normalizeGymPhotoPath(photoPath);

        try {
            // Compute real volume and sets from exercises if not already populated
            let calcSets = 0;
            let calcVolume = 0;
            let calcReps = 0;
            (sessionData.exercises || []).forEach(ex => {
                if (!ex.skipped) {
                    (ex.sets || []).forEach(st => {
                        const wt = Number(st.weightKg ?? st.weight_kg ?? 0) || 0;
                        const rp = Number(st.reps ?? 0) || 0;
                        if (st.completed !== false && (rp > 0 || wt > 0 || st.completed === true)) {
                            calcSets++;
                            calcReps += rp;
                            calcVolume += (wt * rp);
                        }
                    });
                }
            });

            const rawSets = Number(sessionData.totalSets ?? sessionData.total_sets ?? 0) || 0;
            const totalSets = rawSets > 0 ? rawSets : calcSets;
            const rawVol = Number(sessionData.totalVolumeKg ?? sessionData.total_volume_kg ?? 0) || 0;
            const totalVolumeKg = rawVol > 0 ? Math.round(rawVol) : Math.round(calcVolume);
            const rawReps = Number(sessionData.totalReps ?? sessionData.total_reps ?? 0) || 0;
            const totalReps = rawReps > 0 ? rawReps : calcReps;
            const routineName = (sessionData.workoutType || sessionData.routineName || 'Custom Workout').trim();
            const durationMin = Number(sessionData.durationMinutes ?? sessionData.duration ?? sessionData.duration_minutes ?? 0) || 0;

            // 1. Upsert workout_session with stable UUID
            const sessionRow = {
                id: sessionId,
                user_id: userId,
                date: sessionData.date,
                day_of_week: sessionData.dayOfWeek || sessionData.day_of_week || sessionData.dayKey || '',
                day_key: (sessionData.dayKey || sessionData.day_key || '').toLowerCase(),
                workout_type: routineName,
                duration_minutes: durationMin,
                status: sessionData.status || 'completed',
                gym_photo_path: photoPath,
                total_volume_kg: totalVolumeKg,
                total_sets: totalSets,
                total_reps: totalReps,
                notes: sessionData.notes || '',
                started_at: sessionData.startedAt || sessionData.started_at || null,
                ended_at: sessionData.endedAt || sessionData.ended_at || new Date().toISOString(),
                created_at: sessionData.completedAt || sessionData.createdAt || sessionData.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            let upsertedSession = null;
            const upsertQuery = this.client
                .from('workout_sessions')
                .upsert(sessionRow, { onConflict: 'id' });

            let sErr = null;
            if (upsertQuery && typeof upsertQuery.select === 'function') {
                const res = await upsertQuery.select().single();
                sErr = res ? res.error : null;
                upsertedSession = res?.data || sessionRow;
            } else {
                const res = await upsertQuery;
                sErr = res ? res.error : null;
                upsertedSession = sessionRow;
            }

            if (sErr) throw sErr;

            // 2. Clean previous exercises and sets if this was an update/retry to avoid duplicates
            const { data: existingEx } = await this.client
                .from('workout_exercises')
                .select('id')
                .eq('session_id', sessionId);

            if (existingEx && existingEx.length > 0) {
                const exIds = existingEx.map(e => e.id);
                await this.client.from('workout_sets').delete().in('workout_exercise_id', exIds);
                await this.client.from('workout_exercises').delete().eq('session_id', sessionId);
            }

            // 3. Insert exercises and sets
            for (let i = 0; i < (sessionData.exercises || []).length; i++) {
                const ex = sessionData.exercises[i];
                const exRow = {
                    session_id: sessionId,
                    exercise_id: ex.exerciseId || ex.id || 'ex_' + i,
                    exercise_name_snapshot: ex.exerciseName || ex.name || 'Exercise',
                    muscle_group: ex.muscleGroup || null,
                    equipment: ex.equipment || null,
                    order_index: i,
                    skipped: !!ex.skipped,
                    notes: ex.notes || ''
                };

                const { data: insertedEx, error: exErr } = await this.client
                    .from('workout_exercises')
                    .insert([exRow])
                    .select()
                    .single();

                if (exErr) {
                    console.warn('[SupabaseService] exercise insert warning:', exErr);
                    continue;
                }

                // Insert sets
                const sets = ex.sets || [];
                const setRows = sets.map((st, idx) => ({
                    workout_exercise_id: insertedEx.id,
                    set_number: st.setNumber || st.set_number || idx + 1,
                    weight_kg: parseFloat(st.weightKg ?? st.weight_kg ?? 0) || 0,
                    reps: parseInt(st.reps ?? 0, 10) || 0,
                    rpe: st.rpe ? parseFloat(st.rpe) : null,
                    completed: st.completed !== false,
                    is_weight_pr: !!(st.isWeightPr || st.is_weight_pr),
                    is_rep_pr: !!(st.isRepPr || st.is_rep_pr),
                    completed_at: st.completedAt || st.completed_at || new Date().toISOString()
                }));

                if (setRows.length > 0) {
                    const { error: setsErr } = await this.client.from('workout_sets').insert(setRows);
                    if (setsErr) console.warn('[SupabaseService] sets insert warning:', setsErr);
                }
            }

            return upsertedSession;
        } catch (err) {
            console.error('[SupabaseService] saveWorkoutSession error:', err);
            throw err;
        }
    },

    async deleteWorkoutSession(sessionId) {
        const userId = this.getUserId();
        if (!this.client || !userId) {
            throw new Error('Authentication required to delete workout session.');
        }
        if (!sessionId) {
            throw new Error('Valid sessionId required for deletion.');
        }

        try {
            // 1. Fetch session to get photo path and verify user ownership
            const { data: sessionRow, error: fetchErr } = await this.client
                .from('workout_sessions')
                .select('id, user_id, gym_photo_path')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchErr) throw fetchErr;
            if (!sessionRow) {
                console.warn('[SupabaseService] Session not found or already deleted:', sessionId);
                return true;
            }

            // 2. Fetch exercises to delete child sets explicitly
            const { data: exRows } = await this.client
                .from('workout_exercises')
                .select('id')
                .eq('session_id', sessionId);

            if (exRows && exRows.length > 0) {
                const exIds = exRows.map(e => e.id);
                await this.client
                    .from('workout_sets')
                    .delete()
                    .in('workout_exercise_id', exIds);
            }

            // 3. Delete exercises
            await this.client
                .from('workout_exercises')
                .delete()
                .eq('session_id', sessionId);

            // 4. Delete the session
            const { error: delErr } = await this.client
                .from('workout_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);

            if (delErr) throw delErr;

            // 5. Delete associated private photo if present
            if (sessionRow.gym_photo_path) {
                await this.deleteGymPhoto(sessionRow.gym_photo_path);
            }

            return true;
        } catch (err) {
            console.error('[SupabaseService] deleteWorkoutSession error:', err);
            throw err;
        }
    },

    async deleteGymPhoto(photoPath) {
        if (!this.client || !photoPath) return false;
        try {
            const cleanPath = this.normalizeGymPhotoPath(photoPath);
            if (!cleanPath) return false;
            const currentUserId = this.getUserId();
            if (currentUserId && !cleanPath.startsWith(currentUserId + '/')) {
                console.warn('[SupabaseService] Security check: cannot delete photo not owned by current user');
                return false;
            }
            await this.client.storage.from('gym-photos').remove([cleanPath]);
            if (this._signedUrlCache) {
                const cacheKey = `${currentUserId}:${cleanPath}`;
                this._signedUrlCache.delete(cacheKey);
            }
            return true;
        } catch (e) {
            console.warn('[SupabaseService] deleteGymPhoto warning:', e.message);
            return false;
        }
    },

    async cleanDuplicateWorkoutSessions() {
        const userId = this.getUserId();
        if (!this.client || !userId) return { cleanedCount: 0 };
        try {
            const { data: sessions, error } = await this.client
                .from('workout_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error || !sessions || sessions.length === 0) return { cleanedCount: 0 };

            const groups = new Map();
            for (const s of sessions) {
                const key = `${s.date}|${(s.workout_type || '').toLowerCase()}|${s.duration_minutes}|${s.total_sets}|${s.total_volume_kg}`;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(s);
            }

            let cleanedCount = 0;
            for (const [key, group] of groups.entries()) {
                if (group.length > 1) {
                    // Keep the earliest created session
                    const canonical = group[0];
                    const redundant = group.slice(1);
                    for (const r of redundant) {
                        await this.deleteWorkoutSession(r.id);
                        cleanedCount++;
                    }
                }
            }
            return { cleanedCount };
        } catch (e) {
            console.warn('[SupabaseService] cleanDuplicateWorkoutSessions error:', e.message);
            return { cleanedCount: 0 };
        }
    },

    async savePersonalRecord(exerciseId, exerciseName, maxWeight, maxReps, sessionId = null) {
        const userId = this.getUserId();
        if (!this.client || !userId) return false;
        try {
            const row = {
                user_id: userId,
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                max_weight_kg: maxWeight,
                max_reps: maxReps,
                achieved_at: new Date().toISOString(),
                session_id: sessionId
            };

            const { error } = await this.client
                .from('personal_records')
                .upsert(row, { onConflict: 'user_id,exercise_id' });

            if (error) throw error;
            return true;
        } catch (e) {
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // Supabase Storage: Private Gym Photos
    // -------------------------------------------------------------------------
    normalizeGymPhotoPath(rawPath) {
        if (!rawPath || typeof rawPath !== 'string') return '';
        let clean = rawPath.trim();
        // Remove leading / or gym-photos/ or /gym-photos/
        clean = clean.replace(/^\/?gym-photos\//i, '');
        clean = clean.replace(/^\/+/, '');
        return clean;
    },

    async uploadGymPhotoBlob(imageBlob, sessionId) {
        const userId = this.getUserId();
        if (!this.client || !userId) {
            throw new Error('Authentication required to upload gym photo.');
        }
        if (!imageBlob) {
            throw new Error('No gym photo provided. A newly captured gym check-in photo is mandatory.');
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sid = sessionId || 'sess_' + Date.now();
        // Canonical object path inside private gym-photos bucket: {user_id}/{year}/{month}/{session_id}.jpg
        const objectPath = `${userId}/${year}/${month}/${sid}.jpg`;

        try {
            const { data, error } = await this.client
                .storage
                .from('gym-photos')
                .upload(objectPath, imageBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('[SupabaseService] Gym photo upload error:', error);
                throw error;
            }

            return {
                path: objectPath,
                storageKey: data.path
            };
        } catch (err) {
            console.error('[SupabaseService] Photo upload network or permission failure:', err);
            throw new Error("Couldn't save gym photo to secure storage. Check your connection and try again.");
        }
    },

    async getSignedGymPhotoUrl(objectPath, expiresIn = 3600) {
        if (!this.client || !objectPath) return null;
        try {
            const cleanPath = this.normalizeGymPhotoPath(objectPath);
            if (!cleanPath) return null;

            // Security check: validate the authenticated Supabase user owns this path
            const currentUserId = this.getUserId();
            if (!currentUserId) return null;

            const pathOwnerId = cleanPath.split('/')[0];
            if (pathOwnerId !== currentUserId) {
                console.warn('[SupabaseService] Security warning: Attempt to request signed URL for another user photo denied.');
                return null;
            }

            const cacheKey = `${currentUserId}:${cleanPath}`;
            if (!this._signedUrlCache) this._signedUrlCache = new Map();
            const cached = this._signedUrlCache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now() + 60000) {
                return cached.signedUrl;
            }

            const { data, error } = await this.client
                .storage
                .from('gym-photos')
                .createSignedUrl(cleanPath, expiresIn);

            if (error) {
                console.warn('[SupabaseService] createSignedUrl error:', error.message);
                return null;
            }

            if (data && data.signedUrl) {
                this._signedUrlCache.set(cacheKey, {
                    signedUrl: data.signedUrl,
                    expiresAt: Date.now() + (expiresIn * 1000)
                });
                return data.signedUrl;
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    // -------------------------------------------------------------------------
    // Utilities & Binary Converters
    // -------------------------------------------------------------------------
    base64ToBlob(base64Data, defaultContentType = 'image/jpeg') {
        try {
            if (!base64Data || typeof base64Data !== 'string') return null;
            let mime = defaultContentType;
            let b64 = base64Data;
            if (base64Data.startsWith('data:')) {
                const parts = base64Data.split(',');
                const match = parts[0].match(/:(.*?);/);
                if (match) mime = match[1];
                b64 = parts[1] || '';
            }
            if (typeof window !== 'undefined' && typeof window.atob === 'function') {
                const byteCharacters = window.atob(b64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: mime });
            } else if (typeof Buffer !== 'undefined') {
                const buf = Buffer.from(b64, 'base64');
                return new Blob([buf], { type: mime });
            }
            return null;
        } catch (e) {
            console.error('[SupabaseService] base64ToBlob error:', e);
            return null;
        }
    },

    // -------------------------------------------------------------------------
    // Safe LocalStorage-to-Cloud Data Migration (Staged, Idempotent, RLS Protected)
    // -------------------------------------------------------------------------
    async migrateLocalDataToCloud(localState, onProgress = null) {
        const userId = this.getUserId();
        if (!this.client || !userId) {
            throw new Error('User authentication required before migration. Please sign in to your Supabase account.');
        }

        const report = {
            tasksMigrated: 0,
            calendarRecordsMigrated: 0,
            dsaMigrated: 0,
            devMigrated: 0,
            mistakesMigrated: 0,
            studySessionsMigrated: 0,
            gymPlansMigrated: 0,
            gymSessionsMigrated: 0,
            gymExercisesMigrated: 0,
            gymSetsMigrated: 0,
            personalRecordsMigrated: 0,
            placementMigrated: 0,
            internshipsMigrated: 0,
            photosMigrated: 0,
            errors: []
        };

        const updateStatus = (msg) => {
            if (typeof onProgress === 'function') {
                try { onProgress(msg); } catch (e) {}
            }
        };
        const updatesStatus = updateStatus;

        try {
            // PHASE A: Prepare & Validate
            updateStatus('Validating local datasets for cloud migration...');
            if (!localState || typeof localState !== 'object') {
                throw new Error('Invalid local state provided for migration.');
            }

            // PHASE B: Upload Required Storage Files (Gym Photos from Base64)
            updateStatus('Checking and uploading offline gym photos to secure storage...');
            if (localState.gym && Array.isArray(localState.gym.sessions)) {
                for (const sess of localState.gym.sessions) {
                    const rawPhoto = sess.gymPhoto?.url || sess.gym_photo_url || sess.gymPhoto?.base64 || sess.gym_photo_path;
                    const isBase64 = rawPhoto && typeof rawPhoto === 'string' && (rawPhoto.startsWith('data:image/') || rawPhoto.length > 500);

                    if (isBase64) {
                        try {
                            const blob = this.base64ToBlob(rawPhoto);
                            if (blob) {
                                const sid = sess.id || ('sess_' + (sess.date || Date.now()));
                                const uploadRes = await this.uploadGymPhotoBlob(blob, sid);
                                if (uploadRes && uploadRes.path) {
                                    sess.gym_photo_path = uploadRes.path;
                                    if (sess.gymPhoto) {
                                        sess.gymPhoto.storagePath = uploadRes.path;
                                        delete sess.gymPhoto.url; // Strip heavy base64
                                    }
                                    sess.gym_photo_url = null;
                                    report.photosMigrated++;
                                }
                            }
                        } catch (pErr) {
                            console.warn(`[SupabaseService] Gym photo migration failed for session ${sess.date}:`, pErr.message);
                            report.errors.push(`Gym Photo (${sess.date}): ${pErr.message}`);
                            // Preserve local base64 on error so user never loses photo
                        }
                    }
                }
            }

            // PHASE C: Commit Relational Records (Idempotent Upserts)

            // 1. Striver DSA Progress
            updateStatus('Migrating Striver DSA problem progress...');
            if (localState.dsa && typeof localState.dsa === 'object') {
                const dsaEntries = Object.entries(localState.dsa);
                const batch = [];
                for (const [probId, item] of dsaEntries) {
                    if (item && item.status && item.status !== 'NOT_STARTED') {
                        batch.push({
                            user_id: userId,
                            problem_id: String(probId),
                            status: item.status,
                            notes: item.notes || '',
                            solved_at: item.solvedDate || null,
                            updated_at: new Date().toISOString()
                        });
                    }
                }
                if (batch.length > 0) {
                    const { error } = await this.client.from('dsa_progress').upsert(batch, { onConflict: 'user_id,problem_id' });
                    if (!error) report.dsaMigrated = batch.length;
                    else report.errors.push(`DSA: ${error.message}`);
                }
            }

            // 2. Full-Stack Development Progress
            updateStatus('Migrating Full-Stack Development items...');
            if (localState.development && typeof localState.development === 'object') {
                const devBatch = [];
                const devCategories = ['topics', 'videos', 'tasks', 'projects'];
                for (const cat of devCategories) {
                    const catObj = localState.development[cat] || {};
                    for (const [itemId, item] of Object.entries(catObj)) {
                        if (item && item.status && item.status !== 'NOT_STARTED') {
                            devBatch.push({
                                user_id: userId,
                                category: cat,
                                item_id: String(itemId),
                                status: item.status,
                                notes: item.notes || '',
                                repo_link: item.repoLink || null,
                                live_link: item.liveLink || null,
                                solved_at: item.solvedAt || null,
                                updated_at: new Date().toISOString()
                            });
                        }
                    }
                }
                if (devBatch.length > 0) {
                    const { error } = await this.client.from('development_progress').upsert(devBatch, { onConflict: 'user_id,category,item_id' });
                    if (!error) report.devMigrated = devBatch.length;
                    else report.errors.push(`Dev: ${error.message}`);
                }
            }

            // 3. Mistake Bank (Deduplicate by question & date)
            updateStatus('Migrating Mistake Bank & Weakness records...');
            if (Array.isArray(localState.mistakes) && localState.mistakes.length > 0) {
                const { data: existingMistakes } = await this.client
                    .from('mistakes')
                    .select('question,date')
                    .eq('user_id', userId);

                const existingSet = new Set((existingMistakes || []).map(m => `${m.question}___${m.date}`));

                const newMistakes = localState.mistakes
                    .filter(m => !existingSet.has(`${m.question || 'Mistake'}___${m.date || ''}`))
                    .map(m => ({
                        user_id: userId,
                        question: m.question || 'Mistake record',
                        subject: m.subject || 'DSA',
                        topic: m.topic || '',
                        source: m.source || '',
                        date: m.date || new Date().toISOString().slice(0, 10),
                        user_answer: m.userAnswer || '',
                        correct_answer: m.correctAnswer || '',
                        explanation: m.explanation || '',
                        mistake_type: m.mistakeType || '',
                        personal_note: m.personalNote || '',
                        revisit_date: m.revisitDate || null,
                        repeat_count: m.repeatCount || 1,
                        resolved: !!m.resolved,
                        created_at: m.createdAt || new Date().toISOString(),
                        updated_at: m.updatedAt || new Date().toISOString()
                    }));

                if (newMistakes.length > 0) {
                    const { error } = await this.client.from('mistakes').insert(newMistakes);
                    if (!error) report.mistakesMigrated = newMistakes.length;
                    else report.errors.push(`Mistakes: ${error.message}`);
                } else {
                    report.mistakesMigrated = localState.mistakes.length;
                }
            }

            // 4. Calendar & Study Tasks (Preserves ID, Status, Notes, Interruption State)
            updateStatus('Migrating Calendar & Scheduled Tasks...');
            if (localState.days && typeof localState.days === 'object') {
                const taskBatch = [];
                for (const [dateStr, dayData] of Object.entries(localState.days)) {
                    if (dayData && Array.isArray(dayData.tasks)) {
                        for (const task of dayData.tasks) {
                            if (task.status !== 'NOT_STARTED' || task.isStudy || task.notes) {
                                taskBatch.push({
                                    user_id: userId,
                                    date: dateStr,
                                    task_id: task.id,
                                    title: task.title,
                                    category: task.category || 'DSA',
                                    start_time: task.startTime || null,
                                    end_time: task.endTime || null,
                                    status: task.status || 'NOT_STARTED',
                                    is_study: !!task.isStudy,
                                    notes: task.notes || null,
                                    crosses_midnight: !!task.crossesMidnight,
                                    rescheduled_to: task.rescheduledTo || null,
                                    history: task.history || [],
                                    interrupt_reason: task.interruptReason || null,
                                    is_block: !!task.isBlock,
                                    dsa_problem_id: task.dsaProblemId ? String(task.dsaProblemId) : null,
                                    metadata: {
                                        priority: task.priority || 'NORMAL',
                                        duration: task.duration || null,
                                        custom: !!task.custom || (task.id && task.id.includes('custom'))
                                    },
                                    updated_at: new Date().toISOString()
                                });
                            }
                        }
                    }
                }
                if (taskBatch.length > 0) {
                    const { error } = await this.client.from('study_tasks').upsert(taskBatch, { onConflict: 'user_id,date,task_id' });
                    if (!error) {
                        report.tasksMigrated = taskBatch.length;
                        report.calendarRecordsMigrated = taskBatch.length;
                    } else {
                        // Fallback retry with base columns if schema hasn't updated
                        const fallbackBatch = taskBatch.map(t => ({
                            user_id: t.user_id,
                            date: t.date,
                            task_id: t.task_id,
                            title: t.title,
                            category: t.category,
                            start_time: t.start_time,
                            end_time: t.end_time,
                            status: t.status,
                            is_study: t.is_study,
                            notes: t.notes,
                            crosses_midnight: t.crosses_midnight,
                            rescheduled_to: t.rescheduled_to,
                            history: t.history,
                            updated_at: t.updated_at
                        }));
                        const { error: fErr } = await this.client.from('study_tasks').upsert(fallbackBatch, { onConflict: 'user_id,date,task_id' });
                        if (!fErr) {
                            report.tasksMigrated = fallbackBatch.length;
                            report.calendarRecordsMigrated = fallbackBatch.length;
                        } else {
                            report.errors.push(`Tasks: ${fErr.message}`);
                        }
                    }
                }
            }

            // 5. Timed Study Sessions
            updateStatus('Migrating Timed Focus Study Sessions...');
            if (Array.isArray(localState.studySessions) && localState.studySessions.length > 0) {
                const { data: existingSessions } = await this.client
                    .from('study_sessions')
                    .select('date,subject,start_time')
                    .eq('user_id', userId);

                const sessSet = new Set((existingSessions || []).map(s => `${s.date}___${s.subject}___${s.start_time || ''}`));

                const newSessions = localState.studySessions
                    .filter(s => !sessSet.has(`${s.date}___${s.subject}___${s.startTime || ''}`))
                    .map(s => ({
                        user_id: userId,
                        date: s.date,
                        subject: s.subject || 'DSA',
                        topic: s.topic || null,
                        active_seconds: s.activeSeconds || 0,
                        break_seconds: s.breakSeconds || 0,
                        camera_enabled: !!s.cameraEnabled,
                        presence_rate: s.presenceRate ?? 100,
                        ai_insight: s.aiInsight || null,
                        start_time: s.startTime || null,
                        end_time: s.endTime || null,
                        created_at: s.createdAt || new Date().toISOString()
                    }));

                if (newSessions.length > 0) {
                    const { error } = await this.client.from('study_sessions').insert(newSessions);
                    if (!error) report.studySessionsMigrated = newSessions.length;
                    else report.errors.push(`Study Sessions: ${error.message}`);
                } else {
                    report.studySessionsMigrated = localState.studySessions.length;
                }
            }

            // 6. Workout Plan
            updateStatus('Migrating Workout Plan & Split...');
            if (localState.gym && localState.gym.schedule) {
                const okPlan = await this.saveWorkoutPlan(localState.gym.schedule, localState.gym.settings || {});
                if (okPlan) report.gymPlansMigrated = 1;
            }

            // 7. Workout Sessions
            updateStatus('Migrating Logged Workout Sessions...');
            if (localState.gym && Array.isArray(localState.gym.sessions) && localState.gym.sessions.length > 0) {
                const { data: existingGym } = await this.client
                    .from('workout_sessions')
                    .select('id,date')
                    .eq('user_id', userId);

                const existingGymDates = new Set((existingGym || []).map(g => g.date));

                for (const sess of localState.gym.sessions) {
                    if (existingGymDates.has(sess.date)) {
                        report.gymSessionsMigrated++;
                        continue;
                    }

                    const photoPath = sess.gym_photo_path || sess.gymPhoto?.storagePath;
                    if (!photoPath) {
                        report.errors.push(`Workout Session (${sess.date}): Photo storage path missing. Upload required before cloud sync.`);
                        continue;
                    }

                    try {
                        await this.saveWorkoutSession({
                            ...sess,
                            gym_photo_path: photoPath
                        });
                        report.gymSessionsMigrated++;
                        const exCount = (sess.exercises || []).length;
                        report.gymExercisesMigrated += exCount;
                        let sCount = 0;
                        (sess.exercises || []).forEach(e => { sCount += (e.sets || []).length; });
                        report.gymSetsMigrated += sCount;
                    } catch (wErr) {
                        report.errors.push(`Workout Session (${sess.date}): ${wErr.message}`);
                    }
                }
            }

            // 8. Placement Hub Data
            updateStatus('Migrating Placement Hub & Interview Data...');
            if (localState.placementHub) {
                const okPlacement = await this.savePlacementHubData(localState.placementHub);
                if (okPlacement) report.placementMigrated = 1;
            }

            // 9. Internships
            updateStatus('Migrating Internship Applications...');
            if (Array.isArray(localState.internships) && localState.internships.length > 0) {
                const { data: existingIntern } = await this.client
                    .from('internships')
                    .select('company,role')
                    .eq('user_id', userId);

                const internSet = new Set((existingIntern || []).map(i => `${i.company}___${i.role}`));

                const newInterns = localState.internships
                    .filter(i => !internSet.has(`${i.company}___${i.role}`))
                    .map(i => ({
                        user_id: userId,
                        company: i.company || 'Unknown',
                        role: i.role || 'SDE Intern',
                        date_applied: i.dateApplied || null,
                        status: i.status || 'SAVED',
                        link: i.link || null,
                        notes: i.notes || null,
                        created_at: new Date().toISOString()
                    }));

                if (newInterns.length > 0) {
                    const { error } = await this.client.from('internships').insert(newInterns);
                    if (!error) report.internshipsMigrated = newInterns.length;
                    else report.errors.push(`Internships: ${error.message}`);
                } else {
                    report.internshipsMigrated = localState.internships.length;
                }
            }

            // PHASE D: Finalize Migration State
            if (report.errors.length === 0) {
                localStorage.setItem(`studyos_migrated_${userId}`, 'true');
                localStorage.setItem('studyos_cloud_synced', 'true');
                updateStatus('Migration successfully completed with zero errors!');
            } else {
                updateStatus(`Migration finished with ${report.errors.length} warning(s).`);
            }
            return report;
        } catch (fatalErr) {
            console.error('[SupabaseService] Migration failed:', fatalErr);
            report.errors.push(fatalErr.message);
            return report;
        }
    },

    // -------------------------------------------------------------------------
    // Pull Cloud Data to Local Store
    // -------------------------------------------------------------------------
    async pullCloudDataToLocal(onProgress = null) {
        const userId = this.getUserId();
        if (!this.client || !userId) {
            throw new Error('User authentication required before pulling cloud data.');
        }

        const updateStatus = (msg) => {
            if (typeof onProgress === 'function') {
                try { onProgress(msg); } catch (e) {}
            }
        };
        const updatesStatus = updateStatus;

        updateStatus('Connecting to Supabase PostgreSQL...');
        const cloudData = await this.loadUserData();
        if (!cloudData) {
            throw new Error('Could not retrieve cloud records for your account.');
        }

        let pulledCount = 0;

        // 1. Tasks & Schedule
        updateStatus('Synchronizing Study Tasks...');
        if (Array.isArray(cloudData.tasks) && cloudData.tasks.length > 0) {
            if (!Store.memoryState.days) Store.memoryState.days = {};
            cloudData.tasks.forEach(t => {
                if (!Store.memoryState.days[t.date]) {
                    Store.memoryState.days[t.date] = { tasks: [], status: 'PLANNED' };
                }
                const existingIdx = Store.memoryState.days[t.date].tasks.findIndex(x => x.id === t.task_id);
                const taskObj = {
                    id: t.task_id,
                    title: t.title,
                    category: t.category,
                    startTime: t.start_time,
                    endTime: t.end_time,
                    status: t.status,
                    isStudy: t.is_study,
                    notes: t.notes,
                    crossesMidnight: t.crosses_midnight,
                    rescheduledTo: t.rescheduled_to,
                    history: t.history || []
                };
                if (existingIdx >= 0) {
                    Store.memoryState.days[t.date].tasks[existingIdx] = taskObj;
                } else {
                    Store.memoryState.days[t.date].tasks.push(taskObj);
                }
                pulledCount++;
            });
        }

        // 2. DSA Progress
        updateStatus('Synchronizing Striver DSA...');
        if (Array.isArray(cloudData.dsa) && cloudData.dsa.length > 0) {
            if (!Store.memoryState.dsa) Store.memoryState.dsa = {};
            cloudData.dsa.forEach(d => {
                Store.memoryState.dsa[d.problem_id] = {
                    status: d.status,
                    notes: d.notes || '',
                    solvedDate: d.solved_at
                };
                pulledCount++;
            });
        }

        // 3. Development Progress
        updateStatus('Synchronizing Development Items...');
        if (Array.isArray(cloudData.development) && cloudData.development.length > 0) {
            if (!Store.memoryState.development) Store.memoryState.development = { topics: {}, videos: {}, tasks: {}, projects: {} };
            cloudData.development.forEach(dev => {
                const cat = dev.category || 'tasks';
                if (!Store.memoryState.development[cat]) Store.memoryState.development[cat] = {};
                Store.memoryState.development[cat][dev.item_id] = {
                    status: dev.status,
                    notes: dev.notes || '',
                    repoLink: dev.repo_link,
                    liveLink: dev.live_link,
                    solvedAt: dev.solved_at
                };
                pulledCount++;
            });
        }

        // 4. Mistakes
        updateStatus('Synchronizing Mistake Bank...');
        if (Array.isArray(cloudData.mistakes) && cloudData.mistakes.length > 0) {
            if (!Store.memoryState.mistakes) Store.memoryState.mistakes = [];
            cloudData.mistakes.forEach(m => {
                const exists = Store.memoryState.mistakes.some(x => x.question === m.question && x.date === m.date);
                if (!exists) {
                    Store.memoryState.mistakes.push({
                        id: m.id,
                        question: m.question,
                        subject: m.subject,
                        topic: m.topic,
                        source: m.source,
                        date: m.date,
                        userAnswer: m.user_answer,
                        correctAnswer: m.correct_answer,
                        explanation: m.explanation,
                        mistakeType: m.mistake_type,
                        personalNote: m.personal_note,
                        revisitDate: m.revisit_date,
                        repeatCount: m.repeat_count,
                        resolved: m.resolved
                    });
                    pulledCount++;
                }
            });
        }

        // 5. Timed Study Sessions
        updateStatus('Synchronizing Study Sessions...');
        if (Array.isArray(cloudData.studySessions) && cloudData.studySessions.length > 0) {
            if (!Store.memoryState.studySessions) Store.memoryState.studySessions = [];
            cloudData.studySessions.forEach(s => {
                const exists = Store.memoryState.studySessions.some(x => x.id === s.id || (x.date === s.date && x.subject === s.subject && x.startTime === s.start_time));
                if (!exists) {
                    Store.memoryState.studySessions.push({
                        id: s.id,
                        date: s.date,
                        subject: s.subject,
                        topic: s.topic,
                        activeSeconds: s.active_seconds,
                        breakSeconds: s.break_seconds,
                        cameraEnabled: s.camera_enabled,
                        presenceRate: s.presence_rate,
                        aiInsight: s.ai_insight,
                        startTime: s.start_time,
                        endTime: s.end_time,
                        createdAt: s.created_at
                    });
                    pulledCount++;
                }
            });
        }

        // 6. Gym Sessions & Plan
        updateStatus('Synchronizing Gym & Lifestyle...');
        if (cloudData.workoutPlan) {
            if (!Store.memoryState.gym) Store.memoryState.gym = {};
            Store.memoryState.gym.isConfigured = cloudData.workoutPlan.is_configured;
            Store.memoryState.gym.schedule = cloudData.workoutPlan.schedule;
            Store.memoryState.gym.settings = cloudData.workoutPlan.settings;
        }
        if (Array.isArray(cloudData.workoutSessions) && cloudData.workoutSessions.length > 0) {
            if (!Store.memoryState.gym) Store.memoryState.gym = {};
            Store.memoryState.gym.sessions = cloudData.workoutSessions;
            pulledCount += cloudData.workoutSessions.length;
        }

        // 7. Placement Hub
        if (cloudData.placementHub) {
            Store.memoryState.placementHub = {
                roadmaps: cloudData.placementHub.roadmaps || {},
                resources: cloudData.placementHub.resources || {},
                notes: cloudData.placementHub.notes || [],
                bookmarks: cloudData.placementHub.bookmarks || [],
                questionPerformance: cloudData.placementHub.question_performance || {},
                systemDesignInterviews: cloudData.placementHub.system_design_interviews || [],
                weeklyTests: cloudData.placementHub.weekly_tests || [],
                weakAreas: cloudData.placementHub.weak_areas || [],
                placementTarget: cloudData.placementHub.placement_target || { achieved: false }
            };
            pulledCount++;
        }

        // 8. Internships
        if (Array.isArray(cloudData.internships) && cloudData.internships.length > 0) {
            Store.memoryState.internships = cloudData.internships.map(i => ({
                id: i.id,
                company: i.company,
                role: i.role,
                dateApplied: i.date_applied,
                status: i.status,
                link: i.link,
                notes: i.notes
            }));
            pulledCount += cloudData.internships.length;
        }

        Store.save();
        localStorage.setItem('studyos_cloud_synced', 'true');
        updateStatus('Cloud data successfully pulled!');
        return { success: true, count: pulledCount };
    },

    // -------------------------------------------------------------------------
    // Query Live Cloud Record Counts for Current User
    // -------------------------------------------------------------------------
    async getCloudRecordCounts() {
        const userId = this.getUserId();
        if (!this.client || !userId) {
            return { connected: false, dsa: 0, dev: 0, tasks: 0, sessions: 0, mistakes: 0, gym: 0, placement: 0, internships: 0, total: 0 };
        }

        try {
            const [dsa, dev, tasks, sessions, mistakes, gym, internships] = await Promise.all([
                this.client.from('dsa_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                this.client.from('development_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                this.client.from('study_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                this.client.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                this.client.from('mistakes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                this.client.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                this.client.from('internships').select('*', { count: 'exact', head: true }).eq('user_id', userId)
            ]);

            const counts = {
                connected: true,
                dsa: dsa.count || 0,
                dev: dev.count || 0,
                tasks: tasks.count || 0,
                sessions: sessions.count || 0,
                mistakes: mistakes.count || 0,
                gym: gym.count || 0,
                placement: 1, // boolean row
                internships: internships.count || 0
            };
            counts.total = counts.dsa + counts.dev + counts.tasks + counts.sessions + counts.mistakes + counts.gym + counts.internships;
            return counts;
        } catch (e) {
            console.warn('[SupabaseService] getCloudRecordCounts error:', e.message);
            return { connected: true, dsa: 0, dev: 0, tasks: 0, sessions: 0, mistakes: 0, gym: 0, placement: 0, internships: 0, total: 0 };
        }
    }
};

if (typeof window !== 'undefined') {
    window.SupabaseService = SupabaseService;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseService };
}

