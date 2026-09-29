/**
 * BOSS Study OS — Centralized Synchronization Engine (SyncEngine)
 * Single authoritative pipeline connecting UI & Store with Supabase Cloud.
 * Manages optimistic mutations, offline queuing, conflict reconciliation,
 * automatic retry, and real-time sync status reporting.
 */

const SyncEngine = {
    QUEUE_KEY: 'studyos_pending_mutations',
    status: 'SYNCED', // 'SYNCED' | 'SYNCING' | 'PENDING' | 'ERROR' | 'OFFLINE'
    pendingQueue: [],
    listeners: [],
    _isFlushing: false,
    _flushTimer: null,

    init() {
        this.loadQueue();

        // Listen for browser online / offline transitions
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('[SyncEngine] Network re-established (online). Flushing queue...');
                this.updateStatus(this.pendingQueue.length > 0 ? 'PENDING' : 'SYNCED');
                this.flushQueue();
            });

            window.addEventListener('offline', () => {
                console.warn('[SyncEngine] Network connection lost (offline).');
                this.updateStatus('OFFLINE');
            });

            // Initial status check
            if (!navigator.onLine) {
                this.updateStatus('OFFLINE');
            } else if (this.pendingQueue.length > 0) {
                this.updateStatus('PENDING');
                this.flushQueue();
            }
        }
    },

    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    },

    updateStatus(newStatus) {
        this.status = newStatus;
        this.notifyListeners(newStatus);
        this.renderBadgeUI(newStatus);
    },

    notifyListeners(newStatus) {
        this.listeners.forEach(fn => {
            try { fn(newStatus); } catch (e) { console.error('[SyncEngine] Listener error:', e); }
        });
    },

    renderBadgeUI(status) {
        if (typeof document === 'undefined') return;
        const badge = document.getElementById('sidebarCloudSyncBadge');
        if (!badge) return;

        badge.className = 'sync-status-badge';
        if (status === 'SYNCED') {
            badge.classList.add('badge-synced');
            badge.textContent = 'Synced';
        } else if (status === 'SYNCING') {
            badge.classList.add('badge-pending');
            badge.textContent = 'Syncing...';
        } else if (status === 'PENDING') {
            badge.classList.add('badge-pending');
            badge.textContent = `Pending (${this.pendingQueue.length})`;
        } else if (status === 'OFFLINE') {
            badge.classList.add('badge-error');
            badge.textContent = 'Offline';
        } else if (status === 'ERROR') {
            badge.classList.add('badge-error');
            badge.textContent = 'Sync Error';
        }
    },

    getSyncStatus() {
        return {
            status: this.status,
            pendingCount: this.pendingQueue.length,
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            isAuthenticated: typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()
        };
    },

    // -------------------------------------------------------------------------
    // Offline Mutation Queue Persistence
    // -------------------------------------------------------------------------
    loadQueue() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(this.QUEUE_KEY);
            if (raw) {
                this.pendingQueue = JSON.parse(raw) || [];
            }
        } catch (e) {
            console.warn('[SyncEngine] Could not load pending queue:', e);
            this.pendingQueue = [];
        }
    },

    saveQueue() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.pendingQueue));
        } catch (e) {
            console.error('[SyncEngine] Could not persist pending queue:', e);
        }
    },

    queueMutation(type, payload) {
        const mutation = {
            id: 'mut_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type,
            payload,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };

        this.pendingQueue.push(mutation);
        this.saveQueue();

        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        this.updateStatus(!isOnline ? 'OFFLINE' : 'PENDING');

        // Trigger immediate flush attempt if online
        if (isOnline) {
            this.scheduleFlush(200);
        }
    },

    scheduleFlush(delayMs = 500) {
        if (this._flushTimer) clearTimeout(this._flushTimer);
        this._flushTimer = setTimeout(() => this.flushQueue(), delayMs);
    },

    _coalesceMutations(mutations) {
        const taskMap = new Map();
        const dsaMap = new Map();
        const devMap = new Map();
        const mistakeMap = new Map();
        const otherMuts = [];

        for (const mut of mutations) {
            if (mut.type === 'TASK' && mut.payload?.dateStr && mut.payload?.task?.id) {
                const key = `${mut.payload.dateStr}__${mut.payload.task.id}`;
                if (!taskMap.has(key)) {
                    taskMap.set(key, { latestMut: mut, allMuts: [] });
                }
                const entry = taskMap.get(key);
                entry.latestMut = mut;
                entry.allMuts.push(mut);
            } else if (mut.type === 'DSA' && mut.payload?.problemId) {
                const key = String(mut.payload.problemId);
                if (!dsaMap.has(key)) {
                    dsaMap.set(key, { latestMut: mut, allMuts: [] });
                }
                const entry = dsaMap.get(key);
                entry.latestMut = mut;
                entry.allMuts.push(mut);
            } else if (mut.type === 'DEV' && mut.payload?.category && mut.payload?.itemId) {
                const key = `${mut.payload.category}__${mut.payload.itemId}`;
                if (!devMap.has(key)) {
                    devMap.set(key, { latestMut: mut, allMuts: [] });
                }
                const entry = devMap.get(key);
                entry.latestMut = mut;
                entry.allMuts.push(mut);
            } else if (mut.type === 'MISTAKE_UPSERT' && mut.payload?.mistake?.id) {
                const key = String(mut.payload.mistake.id);
                if (!mistakeMap.has(key)) {
                    mistakeMap.set(key, { latestMut: mut, allMuts: [] });
                }
                const entry = mistakeMap.get(key);
                entry.latestMut = mut;
                entry.allMuts.push(mut);
            } else {
                otherMuts.push(mut);
            }
        }

        return { taskMap, dsaMap, devMap, mistakeMap, otherMuts };
    },

    async flushQueue() {
        if (this._isFlushing) return;
        if (this.pendingQueue.length === 0) {
            this.updateStatus('SYNCED');
            return;
        }

        const isOnline = (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') ? navigator.onLine : true;
        if (!isOnline) {
            this.updateStatus('OFFLINE');
            return;
        }

        if (typeof SupabaseService === 'undefined' || !SupabaseService.isAuthenticated()) {
            // Unauthenticated: Keep queue safe until user signs in
            return;
        }

        this._isFlushing = true;
        this.updateStatus('SYNCING');

        const { taskMap, dsaMap, devMap, mistakeMap, otherMuts } = this._coalesceMutations(this.pendingQueue);
        const remainingQueue = [];
        let hasErrors = false;

        // 1. Process TASK batch
        if (taskMap.size > 0) {
            const taskEntries = Array.from(taskMap.values());
            const taskBatchPayload = taskEntries.map(e => ({
                dateStr: e.latestMut.payload.dateStr,
                task: e.latestMut.payload.task
            }));

            let batchSuccess = false;
            if (typeof SupabaseService.saveStudyTasksBatch === 'function') {
                try {
                    batchSuccess = await SupabaseService.saveStudyTasksBatch(taskBatchPayload);
                } catch (e) {
                    batchSuccess = false;
                }
            }

            if (!batchSuccess) {
                // Fallback to per-item execution for safe partial success handling
                for (const entry of taskEntries) {
                    try {
                        const ok = await SupabaseService.saveStudyTask(entry.latestMut.payload.dateStr, entry.latestMut.payload.task);
                        if (!ok) {
                            entry.latestMut.retryCount++;
                            remainingQueue.push(entry.latestMut);
                            hasErrors = true;
                        }
                    } catch (err) {
                        entry.latestMut.retryCount++;
                        remainingQueue.push(entry.latestMut);
                        hasErrors = true;
                    }
                }
            }
        }

        // 2. Process DSA batch
        if (dsaMap.size > 0) {
            const dsaEntries = Array.from(dsaMap.values());
            const dsaBatchPayload = dsaEntries.map(e => e.latestMut.payload);

            let batchSuccess = false;
            if (typeof SupabaseService.saveDsaProgressBatch === 'function') {
                try {
                    batchSuccess = await SupabaseService.saveDsaProgressBatch(dsaBatchPayload);
                } catch (e) {
                    batchSuccess = false;
                }
            }

            if (!batchSuccess) {
                for (const entry of dsaEntries) {
                    try {
                        const p = entry.latestMut.payload;
                        const ok = await SupabaseService.saveDsaProgress(p.problemId, p.status, p.notes, p.solvedAt);
                        if (!ok) {
                            entry.latestMut.retryCount++;
                            remainingQueue.push(entry.latestMut);
                            hasErrors = true;
                        }
                    } catch (err) {
                        entry.latestMut.retryCount++;
                        remainingQueue.push(entry.latestMut);
                        hasErrors = true;
                    }
                }
            }
        }

        // 3. Process DEV batch
        if (devMap.size > 0) {
            const devEntries = Array.from(devMap.values());
            const devBatchPayload = devEntries.map(e => e.latestMut.payload);

            let batchSuccess = false;
            if (typeof SupabaseService.saveDevelopmentProgressBatch === 'function') {
                try {
                    batchSuccess = await SupabaseService.saveDevelopmentProgressBatch(devBatchPayload);
                } catch (e) {
                    batchSuccess = false;
                }
            }

            if (!batchSuccess) {
                for (const entry of devEntries) {
                    try {
                        const p = entry.latestMut.payload;
                        const ok = await SupabaseService.saveDevelopmentProgress(p.category, p.itemId, p.status, p.notes, p.solvedAt, p.repoLink, p.liveLink);
                        if (!ok) {
                            entry.latestMut.retryCount++;
                            remainingQueue.push(entry.latestMut);
                            hasErrors = true;
                        }
                    } catch (err) {
                        entry.latestMut.retryCount++;
                        remainingQueue.push(entry.latestMut);
                        hasErrors = true;
                    }
                }
            }
        }

        // 4. Process MISTAKE batch
        if (mistakeMap.size > 0) {
            const mistakeEntries = Array.from(mistakeMap.values());
            const mistakeBatchPayload = mistakeEntries.map(e => e.latestMut.payload.mistake);

            let batchSuccess = false;
            if (typeof SupabaseService.saveMistakesBatch === 'function') {
                try {
                    batchSuccess = await SupabaseService.saveMistakesBatch(mistakeBatchPayload);
                } catch (e) {
                    batchSuccess = false;
                }
            }

            if (!batchSuccess) {
                for (const entry of mistakeEntries) {
                    try {
                        const ok = await SupabaseService.saveMistake(entry.latestMut.payload.mistake);
                        if (!ok) {
                            entry.latestMut.retryCount++;
                            remainingQueue.push(entry.latestMut);
                            hasErrors = true;
                        }
                    } catch (err) {
                        entry.latestMut.retryCount++;
                        remainingQueue.push(entry.latestMut);
                        hasErrors = true;
                    }
                }
            }
        }

        // 5. Process remaining non-batchable / sequential mutations
        for (const mut of otherMuts) {
            try {
                const success = await this.executeMutation(mut);
                if (!success) {
                    mut.retryCount++;
                    remainingQueue.push(mut);
                    hasErrors = true;
                }
            } catch (err) {
                console.warn(`[SyncEngine] Mutation ${mut.type} failed:`, err.message);
                mut.retryCount++;
                remainingQueue.push(mut);
                hasErrors = true;
            }
        }

        this.pendingQueue = remainingQueue;
        this.saveQueue();
        this._isFlushing = false;

        if (this.pendingQueue.length === 0) {
            this.updateStatus('SYNCED');
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('studyos_cloud_synced', 'true');
            }
        } else {
            this.updateStatus(hasErrors ? 'ERROR' : 'PENDING');
            this.scheduleFlush(5000);
        }
    },

    async executeMutation(mut) {
        const { type, payload } = mut;
        if (!SupabaseService.client) return false;

        switch (type) {
            case 'TASK':
                return await SupabaseService.saveStudyTask(payload.dateStr, payload.task);

            case 'TASK_DELETE':
                return await SupabaseService.deleteStudyTask(payload.dateStr, payload.taskId);

            case 'TASK_BATCH':
                if (Array.isArray(payload.tasks)) {
                    let allOk = true;
                    for (const t of payload.tasks) {
                        const ok = await SupabaseService.saveStudyTask(payload.dateStr, t);
                        if (!ok) allOk = false;
                    }
                    return allOk;
                }
                return true;

            case 'DSA':
                return await SupabaseService.saveDsaProgress(payload.problemId, payload.status, payload.notes, payload.solvedAt);

            case 'DEV':
                return await SupabaseService.saveDevelopmentProgress(
                    payload.category,
                    payload.itemId,
                    payload.status,
                    payload.notes,
                    payload.solvedAt,
                    payload.repoLink,
                    payload.liveLink
                );

            case 'MISTAKE_UPSERT':
                return await SupabaseService.saveMistake(payload.mistake);

            case 'MISTAKE_DELETE':
                return await SupabaseService.deleteMistake(payload.mistakeId);

            case 'STUDY_SESSION':
                return await SupabaseService.saveStudySession(payload.session);

            case 'WORKOUT_SESSION':
                return await SupabaseService.saveWorkoutSession(payload.sessionData);

            case 'WORKOUT_SESSION_DELETE':
                return await SupabaseService.deleteWorkoutSession(payload.sessionId);

            case 'WORKOUT_PLAN':
                return await SupabaseService.saveWorkoutPlan(payload.schedule, payload.settings);

            case 'PERSONAL_RECORD':
                return await SupabaseService.savePersonalRecord(
                    payload.exerciseId,
                    payload.exerciseName,
                    payload.maxWeight,
                    payload.maxReps,
                    payload.sessionId
                );

            case 'PLACEMENT_HUB':
                return await SupabaseService.savePlacementHubData(payload.placementData);

            case 'INTERNSHIP':
                return await SupabaseService.saveInternship(payload.internship);

            case 'INTERNSHIP_DELETE':
                return await SupabaseService.deleteInternship(payload.internshipId);

            default:
                console.warn(`[SyncEngine] Unknown mutation type: ${type}`);
                return true; // Discard invalid mutation
        }
    },

    // -------------------------------------------------------------------------
    // Cloud Write-Through Methods (Called by Store & Engines)
    // -------------------------------------------------------------------------
    pushTask(dateStr, task) {
        if (!task || !dateStr) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveStudyTask(dateStr, task).then(ok => {
                if (ok) {
                    this.updateStatus('SYNCED');
                } else {
                    this.queueMutation('TASK', { dateStr, task });
                }
            }).catch(() => {
                this.queueMutation('TASK', { dateStr, task });
            });
        } else {
            this.queueMutation('TASK', { dateStr, task });
        }
    },

    pushDayTasks(dateStr, tasks) {
        if (!Array.isArray(tasks) || tasks.length === 0) return;
        tasks.forEach(t => this.pushTask(dateStr, t));
    },

    pushMonthTasksBatch(monthTasks) {
        if (!Array.isArray(monthTasks) || monthTasks.length === 0) return;
        const isOnline = (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            if (typeof SupabaseService.saveStudyTasksBatch === 'function') {
                SupabaseService.saveStudyTasksBatch(monthTasks).then(ok => {
                    if (ok) {
                        this.updateStatus('SYNCED');
                    } else {
                        monthTasks.forEach(item => this.queueMutation('TASK', { dateStr: item.dateStr, task: item.task }));
                    }
                }).catch(() => {
                    monthTasks.forEach(item => this.queueMutation('TASK', { dateStr: item.dateStr, task: item.task }));
                });
            } else {
                monthTasks.forEach(item => this.pushTask(item.dateStr, item.task));
            }
        } else {
            monthTasks.forEach(item => this.queueMutation('TASK', { dateStr: item.dateStr, task: item.task }));
        }
    },

    deleteTask(dateStr, taskId) {
        if (!taskId || !dateStr) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.deleteStudyTask(dateStr, taskId).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('TASK_DELETE', { dateStr, taskId });
            }).catch(() => {
                this.queueMutation('TASK_DELETE', { dateStr, taskId });
            });
        } else {
            this.queueMutation('TASK_DELETE', { dateStr, taskId });
        }
    },

    pushDsaProgress(problemId, status, notes = '', solvedAt = null) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveDsaProgress(problemId, status, notes, solvedAt).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('DSA', { problemId, status, notes, solvedAt });
            }).catch(() => {
                this.queueMutation('DSA', { problemId, status, notes, solvedAt });
            });
        } else {
            this.queueMutation('DSA', { problemId, status, notes, solvedAt });
        }
    },

    pushDevelopmentProgress(category, itemId, status, notes = '', solvedAt = null, repoLink = null, liveLink = null) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveDevelopmentProgress(category, itemId, status, notes, solvedAt, repoLink, liveLink).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('DEV', { category, itemId, status, notes, solvedAt, repoLink, liveLink });
            }).catch(() => {
                this.queueMutation('DEV', { category, itemId, status, notes, solvedAt, repoLink, liveLink });
            });
        } else {
            this.queueMutation('DEV', { category, itemId, status, notes, solvedAt, repoLink, liveLink });
        }
    },

    pushMistake(mistake) {
        if (!mistake) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveMistake(mistake).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('MISTAKE_UPSERT', { mistake });
            }).catch(() => {
                this.queueMutation('MISTAKE_UPSERT', { mistake });
            });
        } else {
            this.queueMutation('MISTAKE_UPSERT', { mistake });
        }
    },

    deleteMistake(mistakeId) {
        if (!mistakeId) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.deleteMistake(mistakeId).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('MISTAKE_DELETE', { mistakeId });
            }).catch(() => {
                this.queueMutation('MISTAKE_DELETE', { mistakeId });
            });
        } else {
            this.queueMutation('MISTAKE_DELETE', { mistakeId });
        }
    },

    pushStudySession(session) {
        if (!session) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveStudySession(session).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('STUDY_SESSION', { session });
            }).catch(() => {
                this.queueMutation('STUDY_SESSION', { session });
            });
        } else {
            this.queueMutation('STUDY_SESSION', { session });
        }
    },

    pushWorkoutSession(sessionData) {
        if (!sessionData) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveWorkoutSession(sessionData).then(() => {
                this.updateStatus('SYNCED');
            }).catch(() => {
                this.queueMutation('WORKOUT_SESSION', { sessionData });
            });
        } else {
            this.queueMutation('WORKOUT_SESSION', { sessionData });
        }
    },

    pushDeleteWorkoutSession(sessionId) {
        if (!sessionId) return;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.deleteWorkoutSession(sessionId).then(() => {
                this.updateStatus('SYNCED');
            }).catch(() => {
                this.queueMutation('WORKOUT_SESSION_DELETE', { sessionId });
            });
        } else {
            this.queueMutation('WORKOUT_SESSION_DELETE', { sessionId });
        }
    },

    pushWorkoutPlan(schedule, settings) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveWorkoutPlan(schedule, settings).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('WORKOUT_PLAN', { schedule, settings });
            }).catch(() => {
                this.queueMutation('WORKOUT_PLAN', { schedule, settings });
            });
        } else {
            this.queueMutation('WORKOUT_PLAN', { schedule, settings });
        }
    },

    pushPlacementHub(placementData) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.savePlacementHubData(placementData).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('PLACEMENT_HUB', { placementData });
            }).catch(() => {
                this.queueMutation('PLACEMENT_HUB', { placementData });
            });
        } else {
            this.queueMutation('PLACEMENT_HUB', { placementData });
        }
    },

    pushInternship(internship) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.saveInternship(internship).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('INTERNSHIP', { internship });
            }).catch(() => {
                this.queueMutation('INTERNSHIP', { internship });
            });
        } else {
            this.queueMutation('INTERNSHIP', { internship });
        }
    },

    deleteInternship(internshipId) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isAuth = typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated();

        if (isOnline && isAuth && this.pendingQueue.length === 0) {
            this.updateStatus('SYNCING');
            SupabaseService.deleteInternship(internshipId).then(ok => {
                if (ok) this.updateStatus('SYNCED');
                else this.queueMutation('INTERNSHIP_DELETE', { internshipId });
            }).catch(() => {
                this.queueMutation('INTERNSHIP_DELETE', { internshipId });
            });
        } else {
            this.queueMutation('INTERNSHIP_DELETE', { internshipId });
        }
    },

    // -------------------------------------------------------------------------
    // Pull Cloud State & Deterministic Timestamp-Based Reconciliation
    // -------------------------------------------------------------------------
    async pullCloudState(onProgress = null) {
        const report = (msg) => { if (typeof onProgress === 'function') onProgress(msg); };

        report('Connecting to Supabase Cloud...');
        const cloudData = await SupabaseService.loadUserData();
        if (!cloudData) {
            throw new Error('Failed to retrieve cloud data from Supabase.');
        }

        report('Reconciling cloud data with local cache...');
        const localState = Store.getState();
        const reconciled = this.reconcile(cloudData, localState);

        // Update in-memory and local cache
        Store.memoryState = reconciled;
        Store.save();

        localStorage.setItem('studyos_cloud_synced', 'true');
        this.updateStatus('SYNCED');
        report('Synchronization complete.');

        return { success: true, reconciled };
    },

    /**
     * Deterministic Conflict Resolution:
     * Last-write-wins based on updated_at timestamps for mutable items.
     * Reconstructs full calendar days map from study_tasks for cross-device parity.
     */
    reconcile(cloud, local) {
        const result = { ...local };

        // 1. Reconstruct Calendar Days & Tasks
        if (Array.isArray(cloud.tasks)) {
            result.days = result.days || {};
            cloud.tasks.forEach(t => {
                const dStr = t.date;
                if (!result.days[dStr]) {
                    result.days[dStr] = { tasks: [], status: 'PLANNED', generated: true, notes: '' };
                }

                const existingTaskIdx = (result.days[dStr].tasks || []).findIndex(x => x.id === t.task_id);
                const taskObj = {
                    id: t.task_id,
                    dateKey: t.date,
                    title: t.title,
                    category: t.category,
                    startTime: t.start_time,
                    endTime: t.end_time,
                    status: t.status,
                    isStudy: !!t.is_study,
                    isBlock: !!t.is_block,
                    notes: t.notes || '',
                    crossesMidnight: !!t.crosses_midnight,
                    rescheduledTo: t.rescheduled_to || null,
                    interruptReason: t.interrupt_reason || null,
                    dsaProblemId: t.dsa_problem_id || null,
                    history: t.history || [],
                    updatedAt: t.updated_at
                };

                // Merge metadata JSON
                if (t.metadata && typeof t.metadata === 'object') {
                    Object.assign(taskObj, t.metadata);
                }

                if (existingTaskIdx >= 0) {
                    const localTask = result.days[dStr].tasks[existingTaskIdx];
                    // Compare updated_at
                    const localTime = localTask.updatedAt ? new Date(localTask.updatedAt).getTime() : 0;
                    const cloudTime = t.updated_at ? new Date(t.updated_at).getTime() : 0;
                    if (cloudTime >= localTime) {
                        result.days[dStr].tasks[existingTaskIdx] = taskObj;
                    }
                } else {
                    result.days[dStr].tasks.push(taskObj);
                }
            });

            // Recalculate each day status deterministically and ensure generated flag
            Object.keys(result.days).forEach(dateStr => {
                if (result.days[dateStr].tasks && result.days[dateStr].tasks.length > 0) {
                    result.days[dateStr].generated = true;
                }
                if (typeof TaskEngine !== 'undefined' && TaskEngine.recalculateDayStatus) {
                    // Pre-populate so TaskEngine can evaluate
                    Store.memoryState.days = result.days;
                    result.days[dateStr].status = TaskEngine.recalculateDayStatus(dateStr);
                }
            });
        }

        // 2. DSA Progress
        if (Array.isArray(cloud.dsa)) {
            result.dsa = result.dsa || {};
            cloud.dsa.forEach(item => {
                const localItem = result.dsa[item.problem_id];
                const localTime = localItem && localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
                const cloudTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;

                if (!localItem || cloudTime >= localTime) {
                    result.dsa[item.problem_id] = {
                        status: item.status,
                        notes: item.notes || '',
                        solvedDate: item.solved_at || null,
                        updatedAt: item.updated_at
                    };
                }
            });
        }

        // 3. Development Progress
        if (Array.isArray(cloud.development)) {
            result.development = result.development || { topics: {}, videos: {}, tasks: {}, projects: {} };
            cloud.development.forEach(item => {
                const cat = item.category || 'tasks';
                if (!result.development[cat]) result.development[cat] = {};
                const localItem = result.development[cat][item.item_id];
                const localTime = localItem && localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
                const cloudTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;

                if (!localItem || cloudTime >= localTime) {
                    result.development[cat][item.item_id] = {
                        status: item.status,
                        notes: item.notes || '',
                        repoLink: item.repo_link || '',
                        liveLink: item.live_link || '',
                        solvedAt: item.solved_at || null,
                        updatedAt: item.updated_at
                    };
                }
            });
        }

        // 4. Mistakes Bank
        if (Array.isArray(cloud.mistakes)) {
            result.mistakes = result.mistakes || [];
            cloud.mistakes.forEach(cm => {
                const localIdx = result.mistakes.findIndex(m => m.id === cm.id || (m.question === cm.question && m.date === cm.date));
                const mistakeObj = {
                    id: cm.id,
                    question: cm.question,
                    subject: cm.subject,
                    topic: cm.topic || '',
                    source: cm.source || '',
                    date: cm.date,
                    userAnswer: cm.user_answer || '',
                    correctAnswer: cm.correct_answer || '',
                    explanation: cm.explanation || '',
                    mistakeType: cm.mistake_type || '',
                    personalNote: cm.personal_note || '',
                    revisitDate: cm.revisit_date || null,
                    repeatCount: cm.repeat_count || 1,
                    resolved: !!cm.resolved,
                    createdAt: cm.created_at,
                    updatedAt: cm.updated_at
                };

                if (localIdx >= 0) {
                    const localTime = result.mistakes[localIdx].updatedAt ? new Date(result.mistakes[localIdx].updatedAt).getTime() : 0;
                    const cloudTime = cm.updated_at ? new Date(cm.updated_at).getTime() : 0;
                    if (cloudTime >= localTime) {
                        result.mistakes[localIdx] = mistakeObj;
                    }
                } else {
                    result.mistakes.unshift(mistakeObj);
                }
            });
        }

        // 5. Timed Focus Sessions
        if (Array.isArray(cloud.studySessions)) {
            result.studySessions = result.studySessions || [];
            cloud.studySessions.forEach(cs => {
                const exists = result.studySessions.some(ls => ls.id === cs.id || (ls.date === cs.date && ls.subject === cs.subject && ls.startTime === cs.start_time));
                if (!exists) {
                    result.studySessions.push({
                        id: cs.id,
                        date: cs.date,
                        subject: cs.subject,
                        topic: cs.topic || '',
                        activeSeconds: cs.active_seconds || 0,
                        breakSeconds: cs.break_seconds || 0,
                        cameraEnabled: !!cs.camera_enabled,
                        presenceRate: cs.presence_rate ?? 100,
                        aiInsight: cs.ai_insight || '',
                        startTime: cs.start_time || '',
                        endTime: cs.end_time || '',
                        createdAt: cs.created_at,
                        updatedAt: cs.updated_at
                    });
                }
            });
        }

        // 6. Workout Plan & Sessions
        if (cloud.workoutPlan) {
            result.gym = result.gym || {};
            result.gym.isConfigured = cloud.workoutPlan.is_configured;
            result.gym.schedule = cloud.workoutPlan.schedule || result.gym.schedule;
            result.gym.settings = { ...(result.gym.settings || {}), ...(cloud.workoutPlan.settings || {}) };
        }

        if (Array.isArray(cloud.workoutSessions)) {
            result.gym = result.gym || {};
            result.gym.sessions = result.gym.sessions || [];
            cloud.workoutSessions.forEach(ws => {
                const localIdx = result.gym.sessions.findIndex(ls => 
                    ls.id === ws.id || (
                        ls.date === ws.date && 
                        (ls.workoutType || ls.routineName) === (ws.workout_type || ws.workoutType) &&
                        Math.abs((ls.totalVolumeKg || 0) - (Number(ws.total_volume_kg || ws.totalVolumeKg) || 0)) < 0.1
                    )
                );
                const existing = localIdx >= 0 ? result.gym.sessions[localIdx] : null;
                const exercises = (Array.isArray(ws.exercises) && ws.exercises.length > 0)
                    ? ws.exercises
                    : (existing && Array.isArray(existing.exercises) ? existing.exercises : []);

                let calcSets = 0;
                let calcVolume = 0;
                let calcReps = 0;
                exercises.forEach(ex => {
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

                const routineName = (ws.workout_type || ws.workoutType || ws.routineName || 'Custom Workout').trim();
                const rawSets = Number(ws.total_sets ?? ws.totalSets ?? 0) || 0;
                const totalSets = rawSets > 0 ? rawSets : calcSets;
                const rawVol = Number(ws.total_volume_kg ?? ws.totalVolumeKg ?? 0) || 0;
                const totalVolumeKg = rawVol > 0 ? Math.round(rawVol) : Math.round(calcVolume);
                const rawReps = Number(ws.total_reps ?? ws.totalReps ?? 0) || 0;
                const totalReps = rawReps > 0 ? rawReps : calcReps;
                const durMin = Number(ws.duration_minutes ?? ws.durationMinutes ?? ws.duration ?? 0) || 0;

                const sessObj = {
                    id: ws.id,
                    userId: ws.user_id || ws.userId,
                    date: ws.date,
                    dayOfWeek: ws.day_of_week || ws.dayOfWeek,
                    dayKey: (ws.day_key || ws.dayKey || '').toLowerCase(),
                    routineName,
                    workoutType: routineName,
                    durationMinutes: durMin,
                    duration: durMin,
                    status: ws.status || 'completed',
                    gym_photo_path: ws.gym_photo_path || (existing ? existing.gym_photo_path : null),
                    gymPhoto: (ws.gym_photo_path || (existing && existing.gym_photo_path)) ? {
                        id: ws.id + '_photo',
                        storagePath: ws.gym_photo_path || existing.gym_photo_path,
                        url: existing ? (existing.gymPhoto?.url || existing.gym_photo_url) : null,
                        createdAt: ws.created_at || ws.completedAt
                    } : null,
                    gym_photo_id: ws.gym_photo_path ? (ws.id + '_photo') : null,
                    gym_photo_url: existing ? (existing.gymPhoto?.url || existing.gym_photo_url) : null,
                    gym_photo_created_at: ws.created_at || null,
                    totalVolumeKg,
                    totalSets,
                    totalReps,
                    notes: ws.notes || '',
                    startedAt: ws.started_at || ws.startedAt,
                    endedAt: ws.ended_at || ws.endedAt,
                    completedAt: ws.created_at || ws.completedAt,
                    updatedAt: ws.updated_at || ws.updatedAt,
                    exercises
                };
                if (localIdx >= 0) {
                    const localTime = result.gym.sessions[localIdx].updatedAt ? new Date(result.gym.sessions[localIdx].updatedAt).getTime() : 0;
                    const cloudTime = ws.updated_at ? new Date(ws.updated_at).getTime() : 0;
                    if (cloudTime >= localTime) {
                        result.gym.sessions[localIdx] = sessObj;
                    }
                } else {
                    result.gym.sessions.push(sessObj);
                }
            });
            if (typeof Store !== 'undefined' && typeof Store.deduplicateWorkoutSessions === 'function') {
                result.gym.sessions = Store.deduplicateWorkoutSessions(result.gym.sessions);
            }
        }

        // 7. Placement Hub Data
        if (cloud.placementHub) {
            result.placementHub = {
                roadmaps: cloud.placementHub.roadmaps || result.placementHub?.roadmaps || {},
                resources: cloud.placementHub.resources || result.placementHub?.resources || {},
                notes: cloud.placementHub.notes || result.placementHub?.notes || [],
                bookmarks: cloud.placementHub.bookmarks || result.placementHub?.bookmarks || [],
                questionPerformance: cloud.placementHub.question_performance || result.placementHub?.questionPerformance || {},
                systemDesignInterviews: cloud.placementHub.system_design_interviews || result.placementHub?.systemDesignInterviews || [],
                weeklyTests: cloud.placementHub.weekly_tests || result.placementHub?.weeklyTests || [],
                weakAreas: cloud.placementHub.weak_areas || result.placementHub?.weakAreas || [],
                placementTarget: cloud.placementHub.placement_target || result.placementHub?.placementTarget || { achieved: false }
            };
        }

        // 8. Internships
        if (Array.isArray(cloud.internships)) {
            result.internships = result.internships || [];
            cloud.internships.forEach(ci => {
                const localIdx = result.internships.findIndex(li => li.id === ci.id);
                const internObj = {
                    id: ci.id,
                    company: ci.company,
                    role: ci.role,
                    dateApplied: ci.date_applied,
                    status: ci.status,
                    link: ci.link,
                    notes: ci.notes,
                    updatedAt: ci.updated_at
                };
                if (localIdx >= 0) {
                    const localTime = result.internships[localIdx].updatedAt ? new Date(result.internships[localIdx].updatedAt).getTime() : 0;
                    const cloudTime = ci.updated_at ? new Date(ci.updated_at).getTime() : 0;
                    if (cloudTime >= localTime) {
                        result.internships[localIdx] = internObj;
                    }
                } else {
                    result.internships.push(internObj);
                }
            });
        }

        return result;
    },

    // -------------------------------------------------------------------------
    // Realtime Cross-Platform Synchronization (Phase 6)
    // -------------------------------------------------------------------------
    _realtimeChannel: null,
    _recentWebWrites: new Map(),

    markLocalWrite(entityType, entityId) {
        if (!entityType || !entityId) return;
        this._recentWebWrites.set(`${entityType}:${entityId}`, Date.now());
        const now = Date.now();
        for (const [k, v] of this._recentWebWrites.entries()) {
            if (now - v > 20000) this._recentWebWrites.delete(k);
        }
    },

    isEcho(entityType, entityId) {
        if (!entityType || !entityId) return false;
        const writeTime = this._recentWebWrites.get(`${entityType}:${entityId}`);
        if (!writeTime) return false;
        return (Date.now() - writeTime) <= 20000;
    },

    initRealtime(supabaseClient, userId) {
        if (!supabaseClient || !userId) return;
        this.unsubscribeRealtime();

        const channelName = 'studyos_realtime_' + userId;
        console.log('[SyncEngine] Initializing Realtime channel:', channelName);

        const channel = supabaseClient.channel(channelName);
        const tables = [
            'study_tasks',
            'study_sessions',
            'dsa_progress',
            'development_progress',
            'mistakes',
            'workout_sessions',
            'personal_records',
            'internships',
            'placement_hub_data'
        ];

        tables.forEach(table => {
            channel.on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: table,
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                this.handleRemoteRealtimeChange(table, payload);
            });
        });

        channel.subscribe((status) => {
            console.log(`[SyncEngine] Realtime channel status: ${status}`);
            if (status === 'SUBSCRIBED') {
                this.renderBadgeUI(this.status);
            }
        });

        this._realtimeChannel = channel;
    },

    unsubscribeRealtime() {
        if (this._realtimeChannel) {
            try {
                this._realtimeChannel.unsubscribe();
            } catch (e) {}
            this._realtimeChannel = null;
        }
    },

    handleRemoteRealtimeChange(table, payload) {
        if (!payload) return;
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const rec = newRecord || oldRecord || {};

        let entityId = rec.id || '';
        let entityType = table;

        if (table === 'study_tasks') {
            entityId = rec.task_id || rec.id;
            entityType = 'study_task';
        } else if (table === 'dsa_progress') {
            entityId = rec.problem_id || rec.id;
            entityType = 'dsa_progress';
        } else if (table === 'development_progress') {
            entityId = `${rec.category || ''}__${rec.item_id || ''}`;
            entityType = 'development_progress';
        } else if (table === 'personal_records') {
            entityId = rec.exercise_id || rec.id;
            entityType = 'personal_record';
        }

        // Echo suppression: If this write originated from this Web browser within 20s, skip
        if (this.isEcho(entityType, entityId)) {
            console.log(`[SyncEngine] Echo suppressed for ${entityType}:${entityId}`);
            return;
        }

        console.log(`[SyncEngine] Inbound remote Realtime event: ${eventType} ${table}:${entityId}`);

        if (typeof Store === 'undefined') return;
        const state = Store.getState();

        if (table === 'study_tasks') {
            const dateStr = rec.date;
            if (dateStr && state.days && state.days[dateStr]) {
                const tasks = state.days[dateStr].tasks || [];
                const idx = tasks.findIndex(t => t.id === (rec.task_id || rec.id));
                if (eventType === 'DELETE') {
                    if (idx >= 0) tasks.splice(idx, 1);
                } else {
                    const taskObj = {
                        id: rec.task_id || rec.id,
                        dateKey: rec.date,
                        title: rec.title,
                        category: rec.category,
                        startTime: rec.start_time,
                        endTime: rec.end_time,
                        status: rec.status,
                        isStudy: !!rec.is_study,
                        isBlock: !!rec.is_block,
                        notes: rec.notes || '',
                        updatedAt: rec.updated_at
                    };
                    if (idx >= 0) tasks[idx] = taskObj;
                    else tasks.push(taskObj);
                }
                Store.memoryState.days[dateStr].tasks = tasks;
                Store.save();
                if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
            }
        } else if (table === 'dsa_progress') {
            const pid = rec.problem_id;
            if (pid) {
                state.dsa = state.dsa || {};
                if (eventType === 'DELETE') {
                    delete state.dsa[pid];
                } else {
                    state.dsa[pid] = {
                        status: rec.status,
                        notes: rec.notes || '',
                        solvedDate: rec.solved_at || null,
                        updatedAt: rec.updated_at
                    };
                }
                Store.memoryState.dsa = state.dsa;
                Store.save();
                if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
            }
        } else if (table === 'development_progress') {
            const cat = rec.category || 'tasks';
            const itemId = rec.item_id;
            if (itemId) {
                state.development = state.development || {};
                state.development[cat] = state.development[cat] || {};
                if (eventType === 'DELETE') {
                    delete state.development[cat][itemId];
                } else {
                    state.development[cat][itemId] = {
                        status: rec.status,
                        notes: rec.notes || '',
                        repoLink: rec.repo_link || '',
                        liveLink: rec.live_link || '',
                        solvedAt: rec.solved_at || null,
                        updatedAt: rec.updated_at
                    };
                }
                Store.memoryState.development = state.development;
                Store.save();
                if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
            }
        } else if (table === 'mistakes') {
            state.mistakes = state.mistakes || [];
            const idx = state.mistakes.findIndex(m => m.id === rec.id);
            if (eventType === 'DELETE') {
                if (idx >= 0) state.mistakes.splice(idx, 1);
            } else {
                const mistakeObj = {
                    id: rec.id,
                    question: rec.question,
                    subject: rec.subject,
                    topic: rec.topic || '',
                    source: rec.source || '',
                    date: rec.date,
                    userAnswer: rec.user_answer || '',
                    correctAnswer: rec.correct_answer || '',
                    explanation: rec.explanation || '',
                    mistakeType: rec.mistake_type || '',
                    personalNote: rec.personal_note || '',
                    revisitDate: rec.revisit_date || null,
                    repeatCount: rec.repeat_count || 1,
                    resolved: !!rec.resolved,
                    createdAt: rec.created_at,
                    updatedAt: rec.updated_at
                };
                if (idx >= 0) state.mistakes[idx] = mistakeObj;
                else state.mistakes.unshift(mistakeObj);
            }
            Store.memoryState.mistakes = state.mistakes;
            Store.save();
            if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
        } else if (table === 'workout_plans') {
            state.gym = state.gym || {};
            if (eventType !== 'DELETE' && rec && rec.schedule) {
                state.gym.isConfigured = rec.is_configured ?? true;
                state.gym.schedule = rec.schedule;
                state.gym.settings = { ...(state.gym.settings || {}), ...(rec.settings || {}) };
                Store.memoryState.gym = state.gym;
                Store.save(true);
                if (typeof GymEngine !== 'undefined' && typeof GymEngine.render === 'function') {
                    GymEngine.render();
                }
            }
        } else if (table === 'workout_sessions') {
            state.gym = state.gym || {};
            state.gym.sessions = state.gym.sessions || [];
            const idx = state.gym.sessions.findIndex(s => s.id === rec.id);
            if (eventType === 'DELETE') {
                if (idx >= 0) state.gym.sessions.splice(idx, 1);
            } else {
                const existing = idx >= 0 ? state.gym.sessions[idx] : null;
                const routineName = (rec.workout_type || (existing ? existing.workoutType : 'Custom Workout')).trim();
                const exercises = (existing && Array.isArray(existing.exercises) && existing.exercises.length > 0) ? existing.exercises : [];

                let calcSets = 0;
                let calcVolume = 0;
                let calcReps = 0;
                exercises.forEach(ex => {
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

                const rawSets = Number(rec.total_sets ?? 0);
                const totalSets = rawSets > 0 ? rawSets : (existing ? (existing.totalSets || calcSets) : calcSets);
                const rawVol = Number(rec.total_volume_kg ?? 0);
                const totalVolumeKg = rawVol > 0 ? Math.round(rawVol) : (existing ? (existing.totalVolumeKg || Math.round(calcVolume)) : Math.round(calcVolume));
                const rawReps = Number(rec.total_reps ?? 0);
                const totalReps = rawReps > 0 ? rawReps : (existing ? (existing.totalReps || calcReps) : calcReps);
                const durMin = Number(rec.duration_minutes ?? 0) || (existing ? existing.durationMinutes : 0);

                const photoPath = rec.gym_photo_path || (existing ? existing.gym_photo_path : null);

                const sessObj = {
                    id: rec.id,
                    userId: rec.user_id || (existing ? existing.userId : ''),
                    date: rec.date,
                    dayOfWeek: rec.day_of_week || (existing ? existing.dayOfWeek : ''),
                    dayKey: (rec.day_key || (existing ? existing.dayKey : '')).toLowerCase(),
                    routineName,
                    workoutType: routineName,
                    durationMinutes: durMin,
                    duration: durMin,
                    status: rec.status || 'completed',
                    gym_photo_path: photoPath,
                    gymPhoto: photoPath ? {
                        id: rec.id + '_photo',
                        storagePath: photoPath,
                        url: existing ? (existing.gymPhoto?.url || existing.gym_photo_url) : null,
                        createdAt: rec.created_at
                    } : null,
                    gym_photo_id: photoPath ? (rec.id + '_photo') : null,
                    gym_photo_url: existing ? (existing.gymPhoto?.url || existing.gym_photo_url) : null,
                    totalVolumeKg,
                    totalSets,
                    totalReps,
                    notes: rec.notes || (existing ? existing.notes : ''),
                    startedAt: rec.started_at || (existing ? existing.startedAt : null),
                    endedAt: rec.ended_at || (existing ? existing.endedAt : null),
                    completedAt: rec.created_at || (existing ? existing.completedAt : null),
                    updatedAt: rec.updated_at || DateUtils.nowISO(),
                    exercises
                };

                // Check signature match to prevent creating duplicates for local unsynced record
                const sigIdx = state.gym.sessions.findIndex(s => 
                    s.id === rec.id || (
                        s.date === rec.date && 
                        (s.workoutType || s.routineName) === routineName &&
                        Math.abs((s.totalVolumeKg || 0) - totalVolumeKg) < 0.1 &&
                        (s.totalSets || 0) === totalSets
                    )
                );

                if (sigIdx >= 0) {
                    state.gym.sessions[sigIdx] = { ...state.gym.sessions[sigIdx], ...sessObj };
                } else {
                    state.gym.sessions.push(sessObj);
                }
            }
            if (typeof Store !== 'undefined' && typeof Store.deduplicateWorkoutSessions === 'function') {
                state.gym.sessions = Store.deduplicateWorkoutSessions(state.gym.sessions);
            }
            Store.memoryState.gym = state.gym;
            Store.save();
            if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
        } else if (table === 'internships') {
            state.internships = state.internships || [];
            const idx = state.internships.findIndex(i => i.id === rec.id);
            if (eventType === 'DELETE') {
                if (idx >= 0) state.internships.splice(idx, 1);
            } else {
                const internObj = {
                    id: rec.id,
                    company: rec.company,
                    role: rec.role,
                    dateApplied: rec.date_applied,
                    status: rec.status,
                    link: rec.link,
                    notes: rec.notes,
                    updatedAt: rec.updated_at
                };
                if (idx >= 0) state.internships[idx] = internObj;
                else state.internships.push(internObj);
            }
            Store.memoryState.internships = state.internships;
            Store.save();
            if (typeof App !== 'undefined' && App.renderAll) App.renderAll();
        }
    }
};

if (typeof window !== 'undefined') {
    window.SyncEngine = SyncEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { SyncEngine };
}
