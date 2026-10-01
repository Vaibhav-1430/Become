/**
 * BOSS Study OS — Persistence & Store Layer
 * Uses IndexedDB with LocalStorage synchronization & fallback.
 * Includes undo stack for interruptions, notification configs, and full data models.
 */

class StorageManager {
    constructor() {
        this.dbName = 'BossStudyOS_DB';
        this.dbVersion = 2;
        this.db = null;
        this.localKey = APP_CONFIG.STORAGE_KEY;
        this.memoryState = {
            days: {},           // dateStr -> { tasks: [], status: 'PLANNED' }
            dsa: {},            // problemId -> { status: 'NOT_STARTED'|'SOLVED'|'IN_PROGRESS'|'REVISIT', solvedDate: null, notes: '' }
            distractions: [],   // [ { id, date, time, reason, taskId, notes } ]
            internships: [],    // [ { id, company, role, dateApplied, status, link, notes } ]
            placement: {
                achieved: false,
                placedDate: null,
                company: '',
                role: '',
                packageVal: '',
                note: ''
            },
            settings: {
                dsaDailyTarget: 3,
                morningDsaEnabled: true,
                autoCarryForward: true,
                notificationsEnabled: false,
                notifyDsa: true,
                notifyDev: true,
                notifyAiPlan: true,
                notifyCreatine: true
            },
            aiProfile: {
                preferredStudyWindows: ['06:45-08:15', '23:00-01:30'],
                averageSessionDuration: 0,
                subjectPerformance: {},
                completionPatterns: {},
                weakTopics: [],
                strongTopics: [],
                postponedTasks: [],
                recentTestPerformance: {},
                studyConsistency: {},
                currentGoals: ['Striver A2Z DSA Mastery', 'Full-Stack Development', 'Top Tier PBC Placement']
            },
            aiChatHistory: [],
            aiActivityLog: [],
            aiDailyPlans: {},
            studySessions: [],
            activeStudySession: null,
            placementHub: {
                roadmaps: {},           // subjectId -> { [topicId]: { completed: boolean, completedAt: string } }
                resources: {},          // resourceId -> { status: 'NOT_STARTED'|'WATCHING'|'COMPLETED', lastWatched: string, notes: string }
                notes: {},              // subjectId -> [ { id, title, content, pinned: boolean, createdAt, updatedAt } ]
                bookmarks: [],          // [ { id, type: 'topic'|'question'|'video'|'note', subjectId, title, subtitle, link, createdAt } ]
                questionPerformance: {},// questionId -> { status: 'KNOW'|'PARTIAL'|'DONT_KNOW', myAnswer: string, attempts: number, lastAttempted: string }
                systemDesignInterviews: [], // [ { id, problemId, date, scores: { req, arch, scale, tradeOff, overall }, answers: {} } ]
                weeklyTests: [],        // [ { id, date, durationSeconds, score: { total, correct, wrong, skipped, pct, accuracy, categoryScores: {} }, answers: {}, weakTopics: [], strongTopics: [], timestamp } ]
                weakAreas: []           // [ { topic: string, subjectId: string, count: number, lastFailed: string } ]
            },
            development: {
                topics: {},             // topicId -> { status: 'NOT_STARTED'|'IN_PROGRESS'|'SOLVED'|'REVISIT', notes: '', solvedAt: null, revisitAt: null }
                videos: {},             // videoId -> { status: 'NOT_STARTED'|'IN_PROGRESS'|'SOLVED'|'REVISIT', notes: '', solvedAt: null, revisitAt: null }
                tasks: {},              // taskId -> { status: 'NOT_STARTED'|'IN_PROGRESS'|'SOLVED'|'REVISIT', notes: '', solvedAt: null }
                questions: {},          // questionId -> { status: 'KNOW'|'PARTIAL'|'DONT_KNOW'|'REVISION', notes: '', lastAttempted: null }
                notes: [],              // [ { id, techId, videoId, title, content, pinned: boolean, createdAt, updatedAt } ]
                projects: {},           // projectId -> { status: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETED', repoLink: '', liveLink: '', notes: '', completedAt: null }
                activeTech: 'html',
                activeTab: 'overview'
            },
            mistakes: [],       // [ { id, question, subject, topic, source, date, userAnswer, correctAnswer, explanation, mistakeType, personalNote, revisitDate, repeatCount, resolved, createdAt, updatedAt } ]
            gym: {
                isConfigured: false,
                settings: {
                    trackRPE: false,
                    trackRestTime: false,
                    trackWarmupSets: false,
                    trackCardio: false,
                    trackBodyMeasurements: false,
                    trackPRs: true
                },
                schedule: {},   // dayKey -> { dayName, routineName, isRestDay, exercises: [ { id, name, muscleGroup, equipment, defaultSets, targetReps, notes } ] }
                sessions: [],   // [ { id, date, routineName, dayKey, durationMinutes, totalVolumeKg, totalSets, totalReps, completedAt, exercises: [...] } ]
                activeSession: null,
                measurements: []
            },
            gate: {
                attempts: {},
                topicProgress: {},
                subjectMastery: {},
                customPyqs: [],
                settings: {
                    targetPyqsPerSession: 8,
                    sessionDurationMinutes: 90,
                    weights: {
                        historicalFrequency: 0.25,
                        recentFrequency: 0.20,
                        recurrence: 0.15,
                        userWeakness: 0.20,
                        revisionDue: 0.10,
                        pyqCoverageGap: 0.10
                    }
                }
            }
        };
        this.lastInterruptionSnapshot = null; // In-memory undo snapshot
        this.isReady = false;
        this._saveTimer = null;
        this._saveDebounceMs = 300;
        this._pendingDiskSave = false;

        // Auto-flush pending disk saves before page unload or visibility transition
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flushPendingSave();
            });
            window.addEventListener('pagehide', () => {
                this.flushPendingSave();
            });
        }

        this._initPromise = this.init();
    }

    get state() {
        if (!this.memoryState) this.memoryState = {};
        if (!this.memoryState.gate) this.getGateState();
        return this.memoryState;
    }

    async init() {
        try {
            if (!this.memoryState) {
                this.memoryState = typeof DEFAULT_STATE !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_STATE)) : {};
            }
            const raw = localStorage.getItem(this.localKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.memoryState = {
                    ...this.memoryState,
                    ...parsed,
                    placement: { ...this.memoryState.placement, ...(parsed.placement || {}) },
                    settings: { ...this.memoryState.settings, ...(parsed.settings || {}) },
                    placementHub: {
                        ...this.memoryState.placementHub,
                        ...(parsed.placementHub || {}),
                        roadmaps: { ...(this.memoryState.placementHub?.roadmaps || {}), ...(parsed.placementHub?.roadmaps || {}) },
                        resources: { ...(this.memoryState.placementHub?.resources || {}), ...(parsed.placementHub?.resources || {}) },
                        notes: { ...(this.memoryState.placementHub?.notes || {}), ...(parsed.placementHub?.notes || {}) },
                        bookmarks: parsed.placementHub?.bookmarks || [],
                        questionPerformance: { ...(this.memoryState.placementHub?.questionPerformance || {}), ...(parsed.placementHub?.questionPerformance || {}) },
                        systemDesignInterviews: parsed.placementHub?.systemDesignInterviews || [],
                        weeklyTests: parsed.placementHub?.weeklyTests || [],
                        weakAreas: parsed.placementHub?.weakAreas || []
                    },
                    development: {
                        ...this.memoryState.development,
                        ...(parsed.development || {}),
                        topics: { ...(this.memoryState.development?.topics || {}), ...(parsed.development?.topics || {}) },
                        videos: { ...(this.memoryState.development?.videos || {}), ...(parsed.development?.videos || {}) },
                        tasks: { ...(this.memoryState.development?.tasks || {}), ...(parsed.development?.tasks || {}) },
                        questions: { ...(this.memoryState.development?.questions || {}), ...(parsed.development?.questions || {}) },
                        notes: parsed.development?.notes || [],
                        projects: { ...(this.memoryState.development?.projects || {}), ...(parsed.development?.projects || {}) }
                    },
                    studySessions: parsed.studySessions || [],
                    activeStudySession: parsed.activeStudySession || null,
                    mistakes: parsed.mistakes || [],
                    gym: {
                        ...this.memoryState.gym,
                        ...(parsed.gym || {}),
                        settings: { ...(this.memoryState.gym?.settings || {}), ...(parsed.gym?.settings || {}) },
                        schedule: { ...(this.memoryState.gym?.schedule || {}), ...(parsed.gym?.schedule || {}) },
                        sessions: parsed.gym?.sessions || [],
                        activeSession: parsed.gym?.activeSession || null,
                        measurements: parsed.gym?.measurements || []
                    },
                    gate: {
                        ...this.memoryState.gate,
                        ...(parsed.gate || {}),
                        planItems: { ...(this.memoryState.gate?.planItems || {}), ...(parsed.gate?.planItems || {}) },
                        topicStatuses: { ...(this.memoryState.gate?.topicStatuses || {}), ...(parsed.gate?.topicStatuses || {}) },
                        attempts: { ...(this.memoryState.gate?.attempts || {}), ...(parsed.gate?.attempts || {}) },
                        topicProgress: { ...(this.memoryState.gate?.topicProgress || {}), ...(parsed.gate?.topicProgress || {}) },
                        subjectMastery: { ...(this.memoryState.gate?.subjectMastery || {}), ...(parsed.gate?.subjectMastery || {}) },
                        customPyqs: Array.isArray(parsed.gate?.customPyqs) ? parsed.gate.customPyqs : (this.memoryState.gate?.customPyqs || []),
                        settings: { ...(this.memoryState.gate?.settings || {}), ...(parsed.gate?.settings || {}) }
                    }
                };
            }
        } catch (e) {
            console.warn('LocalStorage load error:', e);
        }

        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                this.isReady = true;
                resolve();
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('appState')) {
                    db.createObjectStore('appState', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isReady = true;
                this.loadFromIDB().then(() => {
                    this.migrateData();
                    resolve();
                });
            };

            request.onerror = (event) => {
                console.warn('IndexedDB error, using LocalStorage:', event.target.error);
                this.isReady = true;
                this.migrateData();
                resolve();
            };
        });
    }

    migrateData() {
        let changed = false;

        // Clean and ensure settings
        if (this.memoryState.settings) {
            if (!('notifyDev' in this.memoryState.settings)) {
                this.memoryState.settings.notifyDev = true;
                changed = true;
            }
            if (!('notifyAiPlan' in this.memoryState.settings)) {
                this.memoryState.settings.notifyAiPlan = true;
                changed = true;
            }
        }

        // Ensure AI state fields exist
        if (!this.memoryState.aiProfile) {
            this.memoryState.aiProfile = {
                preferredStudyWindows: ['06:45-08:15', '23:00-01:30'],
                averageSessionDuration: 0,
                subjectPerformance: {},
                completionPatterns: {},
                weakTopics: [],
                strongTopics: [],
                postponedTasks: [],
                recentTestPerformance: {},
                studyConsistency: {},
                currentGoals: ['Striver A2Z DSA Mastery', 'Full-Stack Development', 'Top Tier PBC Placement']
            };
            changed = true;
        }
        if (!this.memoryState.aiChatHistory) {
            this.memoryState.aiChatHistory = [];
            changed = true;
        }
        if (!this.memoryState.aiActivityLog) {
            this.memoryState.aiActivityLog = [];
            changed = true;
        }
        if (!this.memoryState.aiDailyPlans) {
            this.memoryState.aiDailyPlans = {};
            changed = true;
        }
        if (!this.memoryState.mistakes) {
            this.memoryState.mistakes = [];
            changed = true;
        }
        if (!this.memoryState.gym) {
            this.memoryState.gym = {
                isConfigured: false,
                settings: {
                    trackRPE: false,
                    trackRestTime: false,
                    trackWarmupSets: false,
                    trackCardio: false,
                    trackBodyMeasurements: false,
                    trackPRs: true
                },
                schedule: {},
                sessions: [],
                activeSession: null,
                measurements: []
            };
            changed = true;
        }

        if (changed) {
            this.save();
        }
    }

    async loadFromIDB() {
        if (!this.db) return;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction('appState', 'readonly');
                const store = tx.objectStore('appState');
                const req = store.get('root_state');
                req.onsuccess = () => {
                    if (req.result && req.result.data) {
                        this.memoryState = {
                            ...this.memoryState,
                            ...req.result.data,
                            placement: { ...this.memoryState.placement, ...(req.result.data.placement || {}) },
                            settings: { ...this.memoryState.settings, ...(req.result.data.settings || {}) },
                            placementHub: {
                                ...this.memoryState.placementHub,
                                ...(req.result.data.placementHub || {}),
                                roadmaps: { ...(this.memoryState.placementHub?.roadmaps || {}), ...(req.result.data.placementHub?.roadmaps || {}) },
                                resources: { ...(this.memoryState.placementHub?.resources || {}), ...(req.result.data.placementHub?.resources || {}) },
                                notes: { ...(this.memoryState.placementHub?.notes || {}), ...(req.result.data.placementHub?.notes || {}) },
                                bookmarks: req.result.data.placementHub?.bookmarks || [],
                                questionPerformance: { ...(this.memoryState.placementHub?.questionPerformance || {}), ...(req.result.data.placementHub?.questionPerformance || {}) },
                                systemDesignInterviews: req.result.data.placementHub?.systemDesignInterviews || [],
                                weeklyTests: req.result.data.placementHub?.weeklyTests || [],
                                weakAreas: req.result.data.placementHub?.weakAreas || []
                            },
                            development: {
                                ...this.memoryState.development,
                                ...(req.result.data.development || {}),
                                topics: { ...(this.memoryState.development?.topics || {}), ...(req.result.data.development?.topics || {}) },
                                videos: { ...(this.memoryState.development?.videos || {}), ...(req.result.data.development?.videos || {}) },
                                tasks: { ...(this.memoryState.development?.tasks || {}), ...(req.result.data.development?.tasks || {}) },
                                questions: { ...(this.memoryState.development?.questions || {}), ...(req.result.data.development?.questions || {}) },
                                notes: req.result.data.development?.notes || [],
                                projects: { ...(this.memoryState.development?.projects || {}), ...(req.result.data.development?.projects || {}) }
                            },
                            studySessions: req.result.data.studySessions || [],
                            activeStudySession: req.result.data.activeStudySession || null,
                            mistakes: req.result.data.mistakes || [],
                            gym: {
                                ...this.memoryState.gym,
                                ...(req.result.data.gym || {}),
                                settings: { ...(this.memoryState.gym?.settings || {}), ...(req.result.data.gym?.settings || {}) },
                                schedule: { ...(this.memoryState.gym?.schedule || {}), ...(req.result.data.gym?.schedule || {}) },
                                sessions: req.result.data.gym?.sessions || [],
                                activeSession: req.result.data.gym?.activeSession || null,
                                measurements: req.result.data.gym?.measurements || []
                            }
                        };
                    }
                    resolve();
                };
                req.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }

    _performDiskSave() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        this._pendingDiskSave = false;

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.localKey, JSON.stringify(this.memoryState));
            }
        } catch (e) {
            console.error('LocalStorage save error:', e);
        }

        if (this.db) {
            try {
                const tx = this.db.transaction('appState', 'readwrite');
                const store = tx.objectStore('appState');
                store.put({ key: 'root_state', data: this.memoryState, updatedAt: DateUtils.nowISO() });
            } catch (e) {
                console.warn('IndexedDB save failed:', e);
            }
        }
    }

    scheduleSave() {
        this._pendingDiskSave = true;
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
        }
        this._saveTimer = setTimeout(() => {
            this._performDiskSave();
        }, this._saveDebounceMs);
    }

    flushPendingSave() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        this._performDiskSave();
    }

    async save(immediate = false) {
        if (immediate) {
            this.flushPendingSave();
        } else {
            this.scheduleSave();
        }
    }

    getState() {
        return this.memoryState;
    }

    getDayData(dateStr) {
        if (!this.memoryState.days[dateStr]) {
            this.memoryState.days[dateStr] = {
                tasks: [],
                status: 'PLANNED',
                generated: false,
                notes: ''
            };
        } else if (this.memoryState.days[dateStr].tasks && this.memoryState.days[dateStr].tasks.length > 0 && !this.memoryState.days[dateStr].generated) {
            this.memoryState.days[dateStr].generated = true;
        }
        return this.memoryState.days[dateStr];
    }

    setDayData(dateStr, data) {
        this.memoryState.days[dateStr] = data;
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine && Array.isArray(data?.tasks)) {
            // Write-through each task to cloud
            data.tasks.forEach(task => {
                window.SyncEngine.pushTask(dateStr, task);
            });
        }
    }

    setDaysBatch(daysMap) {
        if (!daysMap || typeof daysMap !== 'object') return;
        if (!this.memoryState.days) this.memoryState.days = {};
        Object.assign(this.memoryState.days, daysMap);
        this.save();
    }

    getDsaProgress(problemId) {
        return this.memoryState.dsa[problemId] || {
            status: APP_CONFIG.DSA_STATUS.NOT_STARTED,
            solvedDate: null,
            notes: ''
        };
    }

    setDsaProgress(problemId, progressData) {
        this.memoryState.dsa[problemId] = {
            ...this.getDsaProgress(problemId),
            ...progressData
        };
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            const current = this.memoryState.dsa[problemId];
            window.SyncEngine.pushDsaProgress(
                problemId,
                current.status,
                current.notes || '',
                current.solvedDate || null
            );
        }
    }

    logDistraction(reason, taskId = null, notes = '') {
        const entry = {
            id: 'dist_' + Date.now(),
            date: DateUtils.todayIST(),
            time: DateUtils.nowTimeIST(),
            reason,
            taskId,
            notes
        };
        this.memoryState.distractions.unshift(entry);
        this.save();
        return entry;
    }

    getDistractions(dateStr = null) {
        if (!dateStr) return this.memoryState.distractions;
        return this.memoryState.distractions.filter(d => d.date === dateStr);
    }

    getInternships() {
        return this.memoryState.internships;
    }

    addInternship(item) {
        const entry = {
            id: 'intern_' + Date.now(),
            company: item.company || 'Company',
            role: item.role || 'SDE Intern',
            dateApplied: item.dateApplied || DateUtils.todayIST(),
            status: item.status || APP_CONFIG.INTERN_STATUS.APPLIED,
            link: item.link || '',
            notes: item.notes || ''
        };
        this.memoryState.internships.unshift(entry);
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            window.SyncEngine.pushInternship(entry);
        }
        return entry;
    }

    updateInternship(id, updates) {
        const idx = this.memoryState.internships.findIndex(i => i.id === id);
        if (idx !== -1) {
            this.memoryState.internships[idx] = { ...this.memoryState.internships[idx], ...updates };
            this.save();
            if (typeof window !== 'undefined' && window.SyncEngine) {
                window.SyncEngine.pushInternship(this.memoryState.internships[idx]);
            }
        }
    }

    deleteInternship(id) {
        this.memoryState.internships = this.memoryState.internships.filter(i => i.id !== id);
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            window.SyncEngine.deleteInternship(id);
        }
    }

    getPlacement() {
        return this.memoryState.placement;
    }

    setPlacementAchieved(data) {
        this.memoryState.placement = {
            achieved: true,
            placedDate: data.placedDate || DateUtils.todayIST(),
            company: data.company || 'Top Tier Tech',
            role: data.role || 'Software Development Engineer',
            packageVal: data.packageVal || '',
            note: data.note || 'Mission Accomplished. Placement Achieved!'
        };
        this.save();
    }

    getSettings() {
        return this.memoryState.settings;
    }

    updateSettings(newSettings) {
        this.memoryState.settings = {
            ...this.memoryState.settings,
            ...newSettings
        };
        this.save();
    }

    exportBackup() {
        this.flushPendingSave();
        const payload = {
            app: APP_CONFIG.APP_NAME,
            version: APP_CONFIG.VERSION,
            exportedAt: DateUtils.nowISO(),
            data: this.memoryState
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BOSS_Study_OS_Backup_${DateUtils.todayIST()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importBackup(jsonString) {
        try {
            const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            const imported = parsed.data || parsed;

            // Determine authenticated user ID for user isolation (Requirement 9)
            let currentUserId = null;
            if (typeof SupabaseService !== 'undefined' && SupabaseService.currentUser) {
                currentUserId = SupabaseService.currentUser.id;
            } else if (typeof window !== 'undefined' && window.currentUser) {
                currentUserId = window.currentUser.id;
            }

            const importTimestamp = imported.exportedAt || (typeof DateUtils !== 'undefined' ? DateUtils.nowISO() : new Date().toISOString());

            // 1. Process and sanitize Days & Tasks
            const importedDays = imported.days || {};
            const cleanDays = {};
            Object.keys(importedDays).forEach(dateStr => {
                const day = importedDays[dateStr];
                if (!day) return;
                const tasks = Array.isArray(day.tasks) ? day.tasks.map(t => {
                    const cleanTask = {
                        id: t.id,
                        dateKey: t.dateKey || dateStr,
                        title: t.title || 'Task',
                        category: t.category || 'OTHER',
                        startTime: t.startTime || '00:00',
                        endTime: t.endTime || '00:00',
                        status: t.status || 'NOT_STARTED',
                        isStudy: !!t.isStudy,
                        isBlock: !!t.isBlock,
                        notes: t.notes || '',
                        crossesMidnight: !!t.crossesMidnight,
                        rescheduledTo: t.rescheduledTo || null,
                        interruptReason: t.interruptReason || null,
                        dsaProblemId: t.dsaProblemId || null,
                        history: Array.isArray(t.history) ? t.history : [],
                        updatedAt: t.updatedAt || importTimestamp,
                        metadata: t.metadata || {}
                    };
                    if (currentUserId) {
                        cleanTask.userId = currentUserId;
                    } else if (t.userId) {
                        delete cleanTask.userId;
                    }
                    return cleanTask;
                }) : [];

                cleanDays[dateStr] = {
                    status: day.status || 'PLANNED',
                    tasks: tasks,
                    generated: tasks.length > 0 ? true : !!day.generated,
                    notes: day.notes || ''
                };
            });

            // 2. Process DSA Progress
            const cleanDsa = {};
            const importedDsa = imported.dsa || {};
            Object.keys(importedDsa).forEach(pId => {
                const item = importedDsa[pId];
                if (item) {
                    cleanDsa[pId] = {
                        status: item.status,
                        notes: item.notes || '',
                        solvedDate: item.solvedDate || null,
                        updatedAt: item.updatedAt || importTimestamp
                    };
                }
            });

            // 3. Process Development Progress
            const cleanDevelopment = {
                topics: imported.development?.topics || {},
                videos: imported.development?.videos || {},
                tasks: imported.development?.tasks || {},
                questions: imported.development?.questions || {},
                notes: imported.development?.notes || [],
                projects: imported.development?.projects || {},
                activeTech: imported.development?.activeTech || 'html',
                activeTab: imported.development?.activeTab || 'overview'
            };
            ['topics', 'videos', 'tasks', 'questions', 'projects'].forEach(sub => {
                if (cleanDevelopment[sub] && typeof cleanDevelopment[sub] === 'object') {
                    Object.keys(cleanDevelopment[sub]).forEach(id => {
                        const item = cleanDevelopment[sub][id];
                        if (item && !item.updatedAt) item.updatedAt = importTimestamp;
                    });
                }
            });

            // 4. Process Mistakes
            const cleanMistakes = (imported.mistakes || []).map(m => ({
                id: m.id || 'mistake_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                question: m.question || '',
                subject: m.subject || '',
                topic: m.topic || '',
                source: m.source || '',
                date: m.date || (typeof DateUtils !== 'undefined' ? DateUtils.todayIST() : new Date().toISOString().split('T')[0]),
                userAnswer: m.userAnswer || '',
                correctAnswer: m.correctAnswer || '',
                explanation: m.explanation || '',
                mistakeType: m.mistakeType || '',
                personalNote: m.personalNote || '',
                revisitDate: m.revisitDate || null,
                repeatCount: m.repeatCount || 1,
                resolved: !!m.resolved,
                createdAt: m.createdAt || importTimestamp,
                updatedAt: m.updatedAt || importTimestamp
            }));

            // 5. Process Study Sessions
            const cleanStudySessions = (imported.studySessions || []).map(s => ({
                ...s,
                userId: currentUserId || s.userId,
                updatedAt: s.updatedAt || importTimestamp
            }));

            // 6. Process Gym
            const cleanGym = imported.gym || {
                isConfigured: false,
                settings: { trackRPE: false, trackRestTime: false, trackWarmupSets: false, trackCardio: false, trackBodyMeasurements: false, trackPRs: true },
                schedule: {},
                sessions: [],
                activeSession: null,
                measurements: []
            };
            if (Array.isArray(cleanGym.sessions)) {
                cleanGym.sessions = cleanGym.sessions.map(s => ({
                    ...s,
                    userId: currentUserId || s.userId,
                    updatedAt: s.updatedAt || importTimestamp
                }));
            }

            // 7. Process Internships
            const cleanInternships = (imported.internships || []).map(i => ({
                ...i,
                userId: currentUserId || i.userId,
                updatedAt: i.updatedAt || importTimestamp
            }));

            this.memoryState = {
                days: cleanDays,
                dsa: cleanDsa,
                distractions: imported.distractions || [],
                internships: cleanInternships,
                placement: imported.placement || { achieved: false },
                settings: imported.settings || { dsaDailyTarget: 3 },
                placementHub: {
                    roadmaps: imported.placementHub?.roadmaps || {},
                    resources: imported.placementHub?.resources || {},
                    notes: imported.placementHub?.notes || {},
                    bookmarks: imported.placementHub?.bookmarks || [],
                    questionPerformance: imported.placementHub?.questionPerformance || {},
                    systemDesignInterviews: imported.placementHub?.systemDesignInterviews || [],
                    weeklyTests: imported.placementHub?.weeklyTests || [],
                    weakAreas: imported.placementHub?.weakAreas || []
                },
                development: cleanDevelopment,
                studySessions: cleanStudySessions,
                activeStudySession: imported.activeStudySession || null,
                mistakes: cleanMistakes,
                gym: cleanGym
            };

            // Recalculate deterministic day statuses
            if (typeof TaskEngine !== 'undefined' && TaskEngine.recalculateDayStatus) {
                Object.keys(cleanDays).forEach(dateStr => {
                    TaskEngine.recalculateDayStatus(dateStr);
                });
            }
            if (typeof TaskEngine !== 'undefined' && TaskEngine.invalidateStatsCache) {
                TaskEngine.invalidateStatsCache();
            }

            // Immediately flush to disk (localStorage + IndexedDB)
            await this.save(true);
            return { success: true };
        } catch (e) {
            console.error('Import error:', e);
            return { success: false, error: e.message };
        }
    }

    async resetAllData() {
        this.memoryState = {
            days: {},
            dsa: {},
            distractions: [],
            internships: [],
            placement: {
                achieved: false,
                placedDate: null,
                company: '',
                role: '',
                packageVal: '',
                note: ''
            },
            settings: {
                dsaDailyTarget: 3,
                morningDsaEnabled: true,
                autoCarryForward: true,
                notificationsEnabled: false,
                notifyDsa: true,
                notifyDev: true,
                notifyAiPlan: true,
                notifyCreatine: true
            },
            placementHub: {
                roadmaps: {},
                resources: {},
                notes: {},
                bookmarks: [],
                questionPerformance: {},
                systemDesignInterviews: [],
                weeklyTests: [],
                weakAreas: []
            },
            development: {
                topics: {},
                videos: {},
                tasks: {},
                questions: {},
                notes: [],
                projects: {},
                activeTech: 'html',
                activeTab: 'overview'
            },
            studySessions: [],
            activeStudySession: null,
            mistakes: [],
            gym: {
                isConfigured: false,
                settings: {
                    trackRPE: false,
                    trackRestTime: false,
                    trackWarmupSets: false,
                    trackCardio: false,
                    trackBodyMeasurements: false,
                    trackPRs: true
                },
                schedule: {},
                sessions: [],
                activeSession: null,
                measurements: []
            }
        };
        await this.save();
    }

    // ----------------------------------------------------
    // Placement Hub Persistence Methods
    // ----------------------------------------------------
    getPlacementHub() {
        if (!this.memoryState.placementHub) {
            this.memoryState.placementHub = {
                roadmaps: {},
                resources: {},
                notes: {},
                bookmarks: [],
                questionPerformance: {},
                systemDesignInterviews: [],
                weeklyTests: [],
                weakAreas: []
            };
        }
        return this.memoryState.placementHub;
    }

    getSubjectRoadmap(subjectId) {
        const hub = this.getPlacementHub();
        return hub.roadmaps[subjectId] || {};
    }

    toggleTopicComplete(subjectId, topicId) {
        const hub = this.getPlacementHub();
        if (!hub.roadmaps[subjectId]) hub.roadmaps[subjectId] = {};
        const current = !!hub.roadmaps[subjectId][topicId]?.completed;
        hub.roadmaps[subjectId][topicId] = {
            completed: !current,
            completedAt: !current ? DateUtils.nowISO() : null
        };
        this.save();
        return !current;
    }

    getResourceTracking(resourceId) {
        const hub = this.getPlacementHub();
        return hub.resources[resourceId] || { status: 'NOT_STARTED', lastWatched: null, notes: '' };
    }

    setResourceTracking(resourceId, data) {
        const hub = this.getPlacementHub();
        hub.resources[resourceId] = {
            ...this.getResourceTracking(resourceId),
            ...data
        };
        this.save();
    }

    getSubjectNotes(subjectId) {
        const hub = this.getPlacementHub();
        return hub.notes[subjectId] || [];
    }

    saveSubjectNote(subjectId, noteData) {
        const hub = this.getPlacementHub();
        if (!hub.notes[subjectId]) hub.notes[subjectId] = [];
        const idx = noteData.id ? hub.notes[subjectId].findIndex(n => n.id === noteData.id) : -1;
        if (idx !== -1) {
            hub.notes[subjectId][idx] = {
                ...hub.notes[subjectId][idx],
                ...noteData,
                updatedAt: DateUtils.nowISO()
            };
        } else {
            const newNote = {
                id: noteData.id || ('note_' + Date.now()),
                title: noteData.title || 'Untitled Note',
                content: noteData.content || '',
                pinned: !!noteData.pinned,
                createdAt: noteData.createdAt || DateUtils.nowISO(),
                updatedAt: DateUtils.nowISO()
            };
            hub.notes[subjectId].unshift(newNote);
        }
        this.save();
    }

    deleteSubjectNote(subjectId, noteId) {
        const hub = this.getPlacementHub();
        if (!hub.notes[subjectId]) return;
        hub.notes[subjectId] = hub.notes[subjectId].filter(n => n.id !== noteId);
        this.save();
    }

    getBookmarks() {
        const hub = this.getPlacementHub();
        return hub.bookmarks || [];
    }

    addBookmark(item) {
        const hub = this.getPlacementHub();
        if (!hub.bookmarks) hub.bookmarks = [];
        const exists = hub.bookmarks.some(b => b.id === item.id);
        if (!exists) {
            hub.bookmarks.unshift({
                id: item.id,
                type: item.type || 'topic',
                subjectId: item.subjectId || '',
                title: item.title || '',
                subtitle: item.subtitle || '',
                link: item.link || '',
                targetData: item.targetData || null,
                createdAt: DateUtils.nowISO()
            });
            this.save();
        }
    }

    removeBookmark(id) {
        const hub = this.getPlacementHub();
        if (!hub.bookmarks) return;
        hub.bookmarks = hub.bookmarks.filter(b => b.id !== id);
        this.save();
    }

    isBookmarked(id) {
        const hub = this.getPlacementHub();
        return (hub.bookmarks || []).some(b => b.id === id);
    }

    getQuestionPerformance(questionId) {
        const hub = this.getPlacementHub();
        return hub.questionPerformance[questionId] || { status: null, myAnswer: '', attempts: 0, lastAttempted: null };
    }

    saveQuestionPerformance(questionId, data) {
        const hub = this.getPlacementHub();
        const prev = this.getQuestionPerformance(questionId);
        hub.questionPerformance[questionId] = {
            ...prev,
            ...data,
            attempts: (prev.attempts || 0) + 1,
            lastAttempted: DateUtils.nowISO()
        };
        this.save();
    }

    saveSystemDesignInterview(data) {
        const hub = this.getPlacementHub();
        if (!hub.systemDesignInterviews) hub.systemDesignInterviews = [];
        const entry = {
            id: 'sd_int_' + Date.now(),
            problemId: data.problemId,
            problemName: data.problemName,
            date: DateUtils.todayIST(),
            scores: data.scores,
            answers: data.answers,
            timestamp: DateUtils.nowISO()
        };
        hub.systemDesignInterviews.unshift(entry);
        this.save();
        return entry;
    }

    getSystemDesignInterviews() {
        const hub = this.getPlacementHub();
        return hub.systemDesignInterviews || [];
    }

    saveWeeklyTestResult(data) {
        const hub = this.getPlacementHub();
        if (!hub.weeklyTests) hub.weeklyTests = [];
        const entry = {
            id: 'test_' + Date.now(),
            date: data.date || DateUtils.todayIST(),
            durationSeconds: data.durationSeconds || 0,
            score: data.score,
            accuracy: data.accuracy,
            breakdown: data.breakdown,
            answers: data.answers,
            weakTopics: data.weakTopics || [],
            strongTopics: data.strongTopics || [],
            timestamp: DateUtils.nowISO()
        };
        hub.weeklyTests.unshift(entry);

        // Update weak areas
        (data.weakTopics || []).forEach(wt => {
            this.recordWeakTopic(wt.topic, wt.subject);
        });

        this.save();
        return entry;
    }

    getWeeklyTestHistory() {
        const hub = this.getPlacementHub();
        return hub.weeklyTests || [];
    }

    recordWeakTopic(topic, subjectId) {
        const hub = this.getPlacementHub();
        if (!hub.weakAreas) hub.weakAreas = [];
        const existing = hub.weakAreas.find(w => w.topic.toLowerCase() === topic.toLowerCase());
        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastFailed = DateUtils.todayIST();
        } else {
            hub.weakAreas.push({
                topic,
                subjectId: subjectId || 'general',
                count: 1,
                lastFailed: DateUtils.todayIST()
            });
        }
        this.save();
    }

    getWeakAreas() {
        const hub = this.getPlacementHub();
        return hub.weakAreas || [];
    }

    removeWeakTopic(topic) {
        const hub = this.getPlacementHub();
        if (!hub.weakAreas) return;
        hub.weakAreas = hub.weakAreas.filter(w => w.topic.toLowerCase() !== topic.toLowerCase());
        this.save();
    }

    saveActiveTestSession(session) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('boss-study-active-test-session', JSON.stringify(session));
            }
        } catch (e) {
            console.warn('Failed to save active test session:', e);
        }
    }

    getActiveTestSession() {
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem('boss-study-active-test-session');
                return raw ? JSON.parse(raw) : null;
            }
        } catch (e) {
            console.warn('Failed to load active test session:', e);
        }
        return null;
    }

    clearActiveTestSession() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('boss-study-active-test-session');
            }
        } catch (e) {
            console.warn('Failed to clear active test session:', e);
        }
    }

    addRevisionTask(dateStr, topic, subject) {
        const dayData = this.getDayData(dateStr);
        const taskId = `task_${dateStr}_rev_${Date.now()}`;
        const newRevTask = {
            id: taskId,
            dateKey: dateStr,
            title: `🔁 Revise ${topic} (${subject || 'Core CS / DSA'})`,
            category: subject === 'dsa' ? APP_CONFIG.CATEGORIES.DSA : APP_CONFIG.CATEGORIES.DEV,
            startTime: '21:00',
            endTime: '22:00',
            status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
            isStudy: true,
            isBlock: false,
            notes: `Auto-generated revision task flagged from Sunday Weekly Test for ${topic}.`,
            history: [
                { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: `Flagged as weak area from Weekly Test` }
            ]
        };
        dayData.tasks = dayData.tasks || [];
        dayData.tasks.push(newRevTask);
        this.setDayData(dateStr, dayData);
        return newRevTask;
    }

    // =========================================================================
    // DEVELOPMENT MODULE PERSISTENCE METHODS
    // =========================================================================
    getDevState() {
        if (!this.memoryState.development) {
            this.memoryState.development = {
                topics: {},
                videos: {},
                tasks: {},
                questions: {},
                notes: [],
                projects: {},
                activeTech: 'html',
                activeTab: 'overview'
            };
        }
        return this.memoryState.development;
    }

    getDevTopicProgress(topicId) {
        const dev = this.getDevState();
        dev.topics = dev.topics || {};
        return dev.topics[topicId] || {
            status: 'NOT_STARTED',
            notes: '',
            solvedAt: null,
            revisitAt: null
        };
    }

    setDevTopicProgress(topicId, updates) {
        const dev = this.getDevState();
        dev.topics = dev.topics || {};
        const current = this.getDevTopicProgress(topicId);
        dev.topics[topicId] = {
            ...current,
            ...updates
        };
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            const item = dev.topics[topicId];
            window.SyncEngine.pushDevelopmentProgress('topics', topicId, item.status, item.notes || '', item.solvedAt || null);
        }
    }

    getDevVideoProgress(videoId) {
        const dev = this.getDevState();
        return dev.videos[videoId] || {
            status: 'NOT_STARTED',
            notes: '',
            solvedAt: null,
            revisitAt: null
        };
    }

    setDevVideoProgress(videoId, updates) {
        const dev = this.getDevState();
        const current = this.getDevVideoProgress(videoId);
        dev.videos[videoId] = {
            ...current,
            ...updates
        };
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            const item = dev.videos[videoId];
            window.SyncEngine.pushDevelopmentProgress('videos', videoId, item.status, item.notes || '', item.solvedAt || null);
        }
    }

    getDevTaskProgress(taskId) {
        const dev = this.getDevState();
        return dev.tasks[taskId] || {
            status: 'NOT_STARTED',
            notes: '',
            solvedAt: null
        };
    }

    setDevTaskProgress(taskId, updates) {
        const dev = this.getDevState();
        const current = this.getDevTaskProgress(taskId);
        dev.tasks[taskId] = {
            ...current,
            ...updates
        };
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            const item = dev.tasks[taskId];
            window.SyncEngine.pushDevelopmentProgress('tasks', taskId, item.status, item.notes || '', item.solvedAt || null);
        }
    }

    getDevQuestionProgress(qId) {
        const dev = this.getDevState();
        return dev.questions[qId] || {
            status: 'DONT_KNOW',
            notes: '',
            lastAttempted: null
        };
    }

    setDevQuestionProgress(qId, updates) {
        const dev = this.getDevState();
        const current = this.getDevQuestionProgress(qId);
        dev.questions[qId] = {
            ...current,
            ...updates,
            lastAttempted: DateUtils.nowISO()
        };
        this.save();
    }

    getDevNotes(techId = null) {
        const dev = this.getDevState();
        if (!techId) return dev.notes || [];
        return (dev.notes || []).filter(n => n.techId === techId);
    }

    saveDevNote(noteData) {
        const dev = this.getDevState();
        dev.notes = dev.notes || [];
        if (noteData.id) {
            const idx = dev.notes.findIndex(n => n.id === noteData.id);
            if (idx !== -1) {
                dev.notes[idx] = {
                    ...dev.notes[idx],
                    ...noteData,
                    updatedAt: DateUtils.nowISO()
                };
                this.save();
                return dev.notes[idx];
            }
        }
        const newNote = {
            id: 'dev_note_' + Date.now(),
            techId: noteData.techId || 'javascript',
            videoId: noteData.videoId || null,
            title: noteData.title || 'Untitled Note',
            content: noteData.content || '',
            pinned: Boolean(noteData.pinned),
            createdAt: DateUtils.nowISO(),
            updatedAt: DateUtils.nowISO()
        };
        dev.notes.unshift(newNote);
        this.save();
        return newNote;
    }

    deleteDevNote(noteId) {
        const dev = this.getDevState();
        dev.notes = (dev.notes || []).filter(n => n.id !== noteId);
        this.save();
    }

    getDevProject(projectId) {
        const dev = this.getDevState();
        return (dev.projects && dev.projects[projectId]) || {
            status: 'NOT_STARTED',
            repoLink: '',
            liveLink: '',
            notes: '',
            completedAt: null
        };
    }

    setDevProject(projectId, updates) {
        const dev = this.getDevState();
        dev.projects = dev.projects || {};
        const current = this.getDevProject(projectId);
        dev.projects[projectId] = {
            ...current,
            ...updates
        };
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            const item = dev.projects[projectId];
            window.SyncEngine.pushDevelopmentProgress('projects', projectId, item.status, item.notes || '', item.completedAt || null, item.repoLink || null, item.liveLink || null);
        }
    }

    getDevRevisitItems() {
        const dev = this.getDevState();
        const revisitTopics = [];
        const revisitVideos = [];
        const revisitTasks = [];
        const revisitQuestions = [];

        // Check topics
        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                (tech.topics || []).forEach(top => {
                    const prog = dev.topics?.[top.id];
                    if (prog && prog.status === 'REVISIT') {
                        revisitTopics.push({
                            type: 'topic',
                            techId: tech.id,
                            techName: tech.name,
                            id: top.id,
                            title: top.name,
                            category: top.category,
                            notes: prog.notes,
                            dateMarked: prog.revisitAt || prog.solvedAt || 'Recently'
                        });
                    }
                });
            });
        }

        // Check videos
        if (typeof DEV_PLAYLISTS !== 'undefined') {
            Object.entries(DEV_PLAYLISTS).forEach(([pKey, vList]) => {
                vList.forEach(v => {
                    const prog = dev.videos[v.id];
                    if (prog && prog.status === 'REVISIT') {
                        revisitVideos.push({
                            type: 'video',
                            techId: pKey,
                            id: v.id,
                            title: v.title,
                            duration: v.duration,
                            url: v.url,
                            notes: prog.notes,
                            dateMarked: prog.revisitAt || prog.solvedAt || 'Recently'
                        });
                    }
                });
            });
        }

        // Check practical tasks
        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                (tech.practicalTasks || []).forEach(t => {
                    const prog = dev.tasks[t.id];
                    if (prog && prog.status === 'REVISIT') {
                        revisitTasks.push({
                            type: 'task',
                            techId: tech.id,
                            techName: tech.name,
                            id: t.id,
                            title: t.title,
                            difficulty: t.difficulty,
                            notes: prog.notes,
                            dateMarked: 'Recently'
                        });
                    }
                });
            });
        }

        // Check interview questions
        if (typeof DEV_INTERVIEW_QUESTIONS !== 'undefined') {
            DEV_INTERVIEW_QUESTIONS.forEach(q => {
                const prog = dev.questions[q.id];
                if (prog && (prog.status === 'REVISION' || prog.status === 'DONT_KNOW')) {
                    revisitQuestions.push({
                        type: 'question',
                        techId: q.techId,
                        techName: q.tech,
                        id: q.id,
                        question: q.question,
                        difficulty: q.difficulty,
                        notes: prog.notes,
                        dateMarked: prog.lastAttempted || 'Recently'
                    });
                }
            });
        }

        return {
            topics: revisitTopics,
            videos: revisitVideos,
            tasks: revisitTasks,
            questions: revisitQuestions,
            totalCount: revisitTopics.length + revisitVideos.length + revisitTasks.length + revisitQuestions.length
        };
    }

    getDevStats() {
        const dev = this.getDevState();
        let totalTopics = 0;
        let solvedTopics = 0;
        let inProgressTopics = 0;
        let revisitTopics = 0;

        let totalVideos = 0;
        let solvedVideos = 0;
        let inProgressVideos = 0;
        let revisitVideos = 0;

        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                (tech.topics || []).forEach(top => {
                    totalTopics++;
                    const prog = dev.topics?.[top.id];
                    if (prog) {
                        if (prog.status === 'SOLVED') solvedTopics++;
                        else if (prog.status === 'IN_PROGRESS') inProgressTopics++;
                        else if (prog.status === 'REVISIT') revisitTopics++;
                    }
                });
            });
        }

        if (typeof DEV_PLAYLISTS !== 'undefined') {
            Object.values(DEV_PLAYLISTS).forEach(vList => {
                totalVideos += vList.length;
                vList.forEach(v => {
                    const prog = dev.videos[v.id];
                    if (prog) {
                        if (prog.status === 'SOLVED') solvedVideos++;
                        else if (prog.status === 'IN_PROGRESS') inProgressVideos++;
                        else if (prog.status === 'REVISIT') revisitVideos++;
                    }
                });
            });
        }

        let totalTasks = 0;
        let solvedTasks = 0;
        let inProgressTasks = 0;

        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                (tech.practicalTasks || []).forEach(t => {
                    totalTasks++;
                    const prog = dev.tasks[t.id];
                    if (prog) {
                        if (prog.status === 'SOLVED') solvedTasks++;
                        else if (prog.status === 'IN_PROGRESS') inProgressTasks++;
                    }
                });
            });
        }

        const totalItems = totalTopics + totalVideos + totalTasks;
        const completedItems = solvedTopics + solvedVideos + solvedTasks;
        const overallPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        const topicPercent = totalTopics > 0 ? Math.round((solvedTopics / totalTopics) * 100) : 0;
        const videoPercent = totalVideos > 0 ? Math.round((solvedVideos / totalVideos) * 100) : 0;
        const taskPercent = totalTasks > 0 ? Math.round((solvedTasks / totalTasks) * 100) : 0;

        // Tech breakdown
        const techBreakdown = {};
        if (typeof DEV_TECHNOLOGIES !== 'undefined') {
            DEV_TECHNOLOGIES.forEach(tech => {
                const playlist = (typeof DEV_PLAYLISTS !== 'undefined' && DEV_PLAYLISTS[tech.sourcePlaylist]) || [];
                const techTopics = tech.topics || [];
                const techTasks = tech.practicalTasks || [];

                let tSolvedVideos = 0;
                let tSolvedTopics = 0;
                let tSolvedTasks = 0;

                playlist.forEach(v => {
                    if (dev.videos[v.id]?.status === 'SOLVED') tSolvedVideos++;
                });
                techTopics.forEach(top => {
                    if (dev.topics?.[top.id]?.status === 'SOLVED') tSolvedTopics++;
                });
                techTasks.forEach(t => {
                    if (dev.tasks[t.id]?.status === 'SOLVED') tSolvedTasks++;
                });

                const tTotal = playlist.length + techTopics.length + techTasks.length;
                const tDone = tSolvedVideos + tSolvedTopics + tSolvedTasks;
                const pct = playlist.length > 0
                    ? Math.round((tSolvedVideos / playlist.length) * 100)
                    : (tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0);

                techBreakdown[tech.id] = {
                    name: tech.name,
                    icon: tech.icon,
                    totalTopics: techTopics.length,
                    solvedTopics: tSolvedTopics,
                    totalVideos: playlist.length,
                    solvedVideos: tSolvedVideos,
                    totalTasks: techTasks.length,
                    solvedTasks: tSolvedTasks,
                    totalItems: tTotal,
                    completedItems: tDone,
                    percent: pct
                };
            });
        }

        return {
            totalTopics,
            solvedTopics,
            inProgressTopics,
            revisitTopics,
            topicPercent,
            totalVideos,
            solvedVideos,
            inProgressVideos,
            revisitVideos,
            videoPercent,
            totalTasks,
            solvedTasks,
            inProgressTasks,
            taskPercent,
            totalItems,
            completedItems,
            overallPercent,
            techBreakdown,
            revisitTotal: this.getDevRevisitItems().totalCount
        };
    }

    // ----------------------------------------------------
    // AI Engine Storage Helpers
    // ----------------------------------------------------
    getAiProfile() {
        return this.memoryState.aiProfile || {};
    }

    setAiProfile(profile) {
        this.memoryState.aiProfile = profile;
        this.save();
    }

    getAiChatHistory() {
        return this.memoryState.aiChatHistory || [];
    }

    addAiChatMessage(role, text, toolCall = null) {
        if (!this.memoryState.aiChatHistory) this.memoryState.aiChatHistory = [];
        this.memoryState.aiChatHistory.push({
            role,
            text,
            toolCall,
            timestamp: DateUtils.nowISO()
        });
        // Keep last 40 messages to prevent unbounded growth
        if (this.memoryState.aiChatHistory.length > 40) {
            this.memoryState.aiChatHistory = this.memoryState.aiChatHistory.slice(-40);
        }
        this.save();
    }

    clearAiChatHistory() {
        this.memoryState.aiChatHistory = [];
        this.save();
    }

    getAiActivityLog() {
        return this.memoryState.aiActivityLog || [];
    }

    logAiActivity(action, detail) {
        if (!this.memoryState.aiActivityLog) this.memoryState.aiActivityLog = [];
        this.memoryState.aiActivityLog.unshift({
            id: `ai_act_${Date.now()}`,
            timestamp: DateUtils.nowISO(),
            timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action,
            detail
        });
        if (this.memoryState.aiActivityLog.length > 50) {
            this.memoryState.aiActivityLog = this.memoryState.aiActivityLog.slice(0, 50);
        }
        this.save();
    }

    getAiDailyPlan(dateStr) {
        return this.memoryState.aiDailyPlans?.[dateStr] || null;
    }

    saveAiDailyPlan(dateStr, plan) {
        if (!this.memoryState.aiDailyPlans) this.memoryState.aiDailyPlans = {};
        this.memoryState.aiDailyPlans[dateStr] = plan;
        this.save();
    }

    // ----------------------------------------------------
    // Study Session Storage & Persistence
    // ----------------------------------------------------
    getStudySessions() {
        return this.memoryState.studySessions || [];
    }

    saveStudySession(session) {
        if (!this.memoryState.studySessions) this.memoryState.studySessions = [];
        this.memoryState.studySessions.unshift(session);
        this.memoryState.activeStudySession = null;
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            window.SyncEngine.pushStudySession(session);
        }
        return session;
    }

    getActiveStudySession() {
        return this.memoryState.activeStudySession || null;
    }

    setActiveStudySession(session) {
        this.memoryState.activeStudySession = session;
        this.save();
    }

    // =========================================================================
    // FEATURE 2: MISTAKE BANK PERSISTENCE METHODS
    // =========================================================================

    getMistakes(filter = {}) {
        let list = this.memoryState.mistakes || [];
        if (filter.subject && filter.subject !== 'all') {
            list = list.filter(m => (m.subject || '').toLowerCase() === filter.subject.toLowerCase());
        }
        if (filter.topic && filter.topic !== 'all') {
            list = list.filter(m => (m.topic || '').toLowerCase() === filter.topic.toLowerCase());
        }
        if (filter.mistakeType && filter.mistakeType !== 'all') {
            list = list.filter(m => (m.mistakeType || '') === filter.mistakeType);
        }
        if (filter.status) {
            const today = DateUtils.todayIST();
            if (filter.status === 'unresolved') {
                list = list.filter(m => !m.resolved);
            } else if (filter.status === 'resolved' || filter.status === 'fixed') {
                list = list.filter(m => m.resolved);
            } else if (filter.status === 'repeated') {
                list = list.filter(m => (m.repeatCount || 1) > 1);
            } else if (filter.status === 'dueRevision') {
                list = list.filter(m => !m.resolved && m.revisitDate && m.revisitDate <= today);
            }
        }
        return list;
    }

    getMistakeById(id) {
        return (this.memoryState.mistakes || []).find(m => m.id === id) || null;
    }

    addMistake(data) {
        if (!this.memoryState.mistakes) this.memoryState.mistakes = [];
        
        // Check if an identical question already exists to increment repeatCount
        const existing = this.memoryState.mistakes.find(m => 
            m.question && data.question && 
            m.question.trim().toLowerCase() === data.question.trim().toLowerCase()
        );

        if (existing) {
            existing.repeatCount = (existing.repeatCount || 1) + 1;
            if (data.userAnswer) existing.userAnswer = data.userAnswer;
            if (data.correctAnswer) existing.correctAnswer = data.correctAnswer;
            if (data.explanation) existing.explanation = data.explanation;
            if (data.mistakeType) existing.mistakeType = data.mistakeType;
            if (data.personalNote) existing.personalNote = data.personalNote;
            if (data.revisitDate) existing.revisitDate = data.revisitDate;
            existing.resolved = false; // Re-opened because repeated!
            existing.updatedAt = DateUtils.nowISO();
            this.save();
            if (typeof window !== 'undefined' && window.SyncEngine) {
                window.SyncEngine.pushMistake(existing);
            }
            return existing;
        }

        const entry = {
            id: 'mstk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            question: data.question || 'Unknown Question',
            subject: data.subject || 'DSA',
            topic: data.topic || 'General',
            source: data.source || 'StudyOS Question',
            date: data.date || DateUtils.todayIST(),
            userAnswer: data.userAnswer || 'Not provided',
            correctAnswer: data.correctAnswer || 'Not provided',
            explanation: data.explanation || '',
            mistakeType: data.mistakeType || 'Conceptual mistake',
            personalNote: data.personalNote || '',
            revisitDate: data.revisitDate || DateUtils.todayIST(),
            repeatCount: 1,
            resolved: false,
            createdAt: DateUtils.nowISO(),
            updatedAt: DateUtils.nowISO()
        };

        this.memoryState.mistakes.unshift(entry);
        
        // Also record to placement weak areas if applicable
        if (entry.topic) {
            this.recordWeakTopic(entry.topic, entry.subject);
        }

        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            window.SyncEngine.pushMistake(entry);
        }
        return entry;
    }

    updateMistake(id, updates) {
        const item = this.getMistakeById(id);
        if (!item) return null;
        Object.assign(item, updates, { updatedAt: DateUtils.nowISO() });
        this.save();
        if (typeof window !== 'undefined' && window.SyncEngine) {
            window.SyncEngine.pushMistake(item);
        }
        return item;
    }

    markMistakeResolved(id, resolved = true) {
        return this.updateMistake(id, { resolved: !!resolved });
    }

    deleteMistake(id) {
        if (!this.memoryState.mistakes) return false;
        const initialLen = this.memoryState.mistakes.length;
        this.memoryState.mistakes = this.memoryState.mistakes.filter(m => m.id !== id);
        if (this.memoryState.mistakes.length !== initialLen) {
            this.save();
            if (typeof window !== 'undefined' && window.SyncEngine) {
                window.SyncEngine.deleteMistake(id);
            }
            return true;
        }
        return false;
    }

    getMistakeStats() {
        const list = this.memoryState.mistakes || [];
        const today = DateUtils.todayIST();
        let total = list.length;
        let unresolved = 0;
        let repeated = 0;
        let dueForRevision = 0;
        let recent = 0;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        list.forEach(m => {
            if (!m.resolved) unresolved++;
            if ((m.repeatCount || 1) > 1) repeated++;
            if (!m.resolved && m.revisitDate && m.revisitDate <= today) dueForRevision++;
            if (m.date && m.date >= sevenDaysAgoStr) recent++;
        });

        return { total, unresolved, repeated, dueForRevision, recent };
    }

    // =========================================================================
    // FEATURE 2: WEAKNESS & MASTERY MAP CALCULATION FROM AUTHENTIC DATA
    // =========================================================================

    calculateWeaknessMap() {
        const mistakes = this.memoryState.mistakes || [];
        const testHistory = this.getWeeklyTestHistory();
        const placementHub = this.getPlacementHub();
        const dsaState = this.memoryState.dsa || {};
        const devState = this.memoryState.development || {};
        const studySessions = this.getStudySessions();

        const subjectGroups = {
            dsa: {
                id: 'dsa',
                name: 'Data Structures & Algorithms',
                icon: '🧠',
                topics: [
                    'Arrays', 'Binary Search', 'Strings', 'LinkedList', 'Recursion & Backtracking',
                    'Bit Manipulation', 'Stack & Queues', 'Sliding Window & Two Pointer', 'Heaps',
                    'Greedy Algorithms', 'Trees', 'Binary Search Trees', 'Graphs', 'Dynamic Programming', 'Tries'
                ]
            },
            dev: {
                id: 'dev',
                name: 'Full-Stack Development',
                icon: '💻',
                topics: [
                    'HTML & Semantic Web', 'CSS & Responsive Layouts', 'Modern JavaScript (ES6+)',
                    'TypeScript Foundations', 'React Fundamentals & Hooks', 'Next.js & SSR',
                    'Node.js & Express Architecture', 'Database & PostgreSQL', 'Caching & Redis',
                    'Authentication & Security', 'Docker & DevOps'
                ]
            },
            corecs: {
                id: 'corecs',
                name: 'Core Computer Science',
                icon: '🎓',
                topics: [
                    'Database Management Systems (DBMS)', 'Operating Systems (OS)',
                    'Computer Networks (CN)', 'Software Engineering & Agile', 'SQL & Indexing'
                ]
            },
            sysdesign: {
                id: 'sysdesign',
                name: 'System Design & Architecture',
                icon: '📐',
                topics: [
                    'High-Level Architecture (HLD)', 'Low-Level Design (LLD)', 'Scalability & Load Balancing',
                    'Database Sharding & Replication', 'Microservices & Message Queues'
                ]
            }
        };

        const result = {};

        Object.keys(subjectGroups).forEach(groupKey => {
            const group = subjectGroups[groupKey];
            result[groupKey] = {
                id: group.id,
                name: group.name,
                icon: group.icon,
                topics: group.topics.map(topicName => {
                    const topicLower = topicName.toLowerCase();

                    // 1. Weekly Test signals
                    let testAttempts = 0;
                    let testCorrect = 0;
                    testHistory.forEach(test => {
                        (test.answers || []).forEach(ans => {
                            if (ans && ans.topic && (ans.topic.toLowerCase().includes(topicLower) || topicLower.includes(ans.topic.toLowerCase()))) {
                                testAttempts++;
                                if (ans.isCorrect) testCorrect++;
                            }
                        });
                        if (test.breakdown) {
                            Object.keys(test.breakdown).forEach(bk => {
                                if (bk.toLowerCase().includes(topicLower) || topicLower.includes(bk.toLowerCase())) {
                                    testAttempts += test.breakdown[bk].total || 0;
                                    testCorrect += test.breakdown[bk].correct || 0;
                                }
                            });
                        }
                    });

                    // 2. Mistake Bank signals
                    const topicMistakes = mistakes.filter(m => 
                        m.topic && (m.topic.toLowerCase().includes(topicLower) || topicLower.includes(m.topic.toLowerCase()))
                    );
                    const mistakesCount = topicMistakes.length;
                    const unresolvedMistakes = topicMistakes.filter(m => !m.resolved).length;
                    const repeatedMistakes = topicMistakes.filter(m => (m.repeatCount || 1) > 1).length;

                    // 3. Question Performance (Placement Hub)
                    let placementAttempts = 0;
                    let placementCorrect = 0;
                    if (placementHub.questionPerformance) {
                        Object.keys(placementHub.questionPerformance).forEach(qid => {
                            const qp = placementHub.questionPerformance[qid];
                            if (qid.toLowerCase().includes(topicLower) || (qp.topic && qp.topic.toLowerCase().includes(topicLower))) {
                                placementAttempts += (qp.attempts || 1);
                                if (qp.status === 'KNOW') placementCorrect += 1;
                                else if (qp.status === 'PARTIAL') placementCorrect += 0.5;
                            }
                        });
                    }

                    // 4. Development Questions
                    let devAttempts = 0;
                    let devCorrect = 0;
                    if (devState.questions) {
                        Object.keys(devState.questions).forEach(qid => {
                            const dq = devState.questions[qid];
                            if (qid.toLowerCase().includes(topicLower)) {
                                devAttempts++;
                                if (dq.status === 'KNOW') devCorrect++;
                                else if (dq.status === 'PARTIAL') devCorrect += 0.5;
                            }
                        });
                    }

                    // 5. DSA problems if topic is DSA
                    let dsaSolved = 0;
                    let dsaAttempted = 0;
                    let dsaTotal = 0;
                    if (groupKey === 'dsa' && typeof DSA_TOPICS !== 'undefined') {
                        DSA_TOPICS.forEach(step => {
                            (step.subTopics || []).forEach(sub => {
                                if (sub.title.toLowerCase().includes(topicLower) || topicLower.includes(sub.title.toLowerCase())) {
                                    (sub.problems || []).forEach(p => {
                                        dsaTotal++;
                                        const prog = dsaState[p.id];
                                        if (prog) {
                                            if (prog.status === 'SOLVED') {
                                                dsaSolved++;
                                                dsaAttempted++;
                                            } else if (prog.status === 'IN_PROGRESS' || prog.status === 'REVISIT') {
                                                dsaAttempted++;
                                            }
                                        }
                                    });
                                }
                            });
                        });
                    }

                    // 6. Study Sessions for this topic
                    const topicSessions = studySessions.filter(s => 
                        (s.topic && s.topic.toLowerCase().includes(topicLower)) ||
                        (s.subject && s.subject.toLowerCase().includes(topicLower))
                    );
                    const sessionCount = topicSessions.length;
                    const totalStudyMs = topicSessions.reduce((acc, s) => acc + (s.accumulatedStudyMs || 0), 0);
                    const avgTimeMins = sessionCount > 0 ? Math.round((totalStudyMs / 60000) / sessionCount) : 0;
                    const lastStudied = topicSessions.length > 0 ? topicSessions[0].date || topicSessions[0].startTimeISO?.split('T')[0] : null;

                    // 7. Last revision date
                    const lastRevision = topicMistakes.length > 0 ? topicMistakes[0].revisitDate : null;

                    // Real signal aggregation
                    const totalAttempts = testAttempts + placementAttempts + devAttempts + dsaAttempted;
                    const totalCorrectScore = testCorrect + placementCorrect + devCorrect + dsaSolved;

                    // REAL DATA RULE: If no attempts, no mistakes, no sessions, no problems tracked: INSUFFICIENT DATA
                    if (totalAttempts === 0 && mistakesCount === 0 && sessionCount === 0 && dsaSolved === 0) {
                        return {
                            topic: topicName,
                            subjectId: groupKey,
                            hasData: false,
                            statusText: 'Insufficient data',
                            tier: 'INSUFFICIENT_DATA',
                            accuracy: null,
                            attempts: 0,
                            mistakes: 0,
                            unresolvedMistakes: 0,
                            repeatedMistakes: 0,
                            avgTimeMins: 0,
                            lastStudied: null,
                            lastRevision: null,
                            questionsRemaining: dsaTotal > 0 ? (dsaTotal - dsaSolved) : '—'
                        };
                    }

                    let rawPct = totalAttempts > 0 ? Math.round((totalCorrectScore / totalAttempts) * 100) : 50;
                    let penalizedPct = rawPct - (unresolvedMistakes * 10) - (repeatedMistakes * 15);
                    penalizedPct = Math.max(5, Math.min(100, penalizedPct));

                    let tier = 'Needs Work';
                    let statusText = 'Needs Work';

                    if (penalizedPct >= 80 && unresolvedMistakes === 0) {
                        tier = 'Strong';
                        statusText = 'Strong';
                    } else if (penalizedPct >= 65 && unresolvedMistakes <= 1) {
                        tier = 'Good';
                        statusText = 'Good';
                    } else if (penalizedPct < 45 || unresolvedMistakes >= 3 || repeatedMistakes >= 2) {
                        tier = 'Weak';
                        statusText = 'Weak';
                    } else {
                        tier = 'Needs Work';
                        statusText = 'Needs Work';
                    }

                    return {
                        topic: topicName,
                        subjectId: groupKey,
                        hasData: true,
                        statusText,
                        tier,
                        accuracy: Math.round(penalizedPct),
                        attempts: totalAttempts,
                        mistakes: mistakesCount,
                        unresolvedMistakes,
                        repeatedMistakes,
                        avgTimeMins,
                        lastStudied,
                        lastRevision,
                        questionsRemaining: dsaTotal > 0 ? (dsaTotal - dsaSolved) : '—'
                    };
                })
            };
        });

        return result;
    }

    // =========================================================================
    // FEATURE 4: ADVANCED GYM / WORKOUT TRACKING METHODS
    // =========================================================================

    get DEFAULT_EXERCISE_LIBRARY() {
        return [
        // BACK (22 exercises)
        { id: 'ex_back_1', name: 'Pull Ups', muscleGroup: 'Back', category: 'Lats', equipment: 'Bodyweight' },
        { id: 'ex_back_2', name: 'Chin Ups', muscleGroup: 'Back', category: 'Lats', equipment: 'Bodyweight' },
        { id: 'ex_back_3', name: 'Lat Pulldown', muscleGroup: 'Back', category: 'Lats', equipment: 'Cable' },
        { id: 'ex_back_4', name: 'Wide Grip Lat Pulldown', muscleGroup: 'Back', category: 'Lats', equipment: 'Cable' },
        { id: 'ex_back_5', name: 'Close Grip Lat Pulldown', muscleGroup: 'Back', category: 'Lats', equipment: 'Cable' },
        { id: 'ex_back_6', name: 'Neutral Grip Lat Pulldown', muscleGroup: 'Back', category: 'Lats', equipment: 'Cable' },
        { id: 'ex_back_7', name: 'Barbell Row', muscleGroup: 'Back', category: 'Upper Back', equipment: 'Barbell' },
        { id: 'ex_back_8', name: 'Pendlay Row', muscleGroup: 'Back', category: 'Upper Back', equipment: 'Barbell' },
        { id: 'ex_back_9', name: 'T-Bar Row', muscleGroup: 'Back', category: 'Upper Back', equipment: 'Machine / Barbell' },
        { id: 'ex_back_10', name: 'Chest Supported Row', muscleGroup: 'Back', category: 'Upper Back', equipment: 'Machine / Dumbbell' },
        { id: 'ex_back_11', name: 'Seated Cable Row', muscleGroup: 'Back', category: 'Mid Back', equipment: 'Cable' },
        { id: 'ex_back_12', name: 'Close Grip Cable Row', muscleGroup: 'Back', category: 'Mid Back', equipment: 'Cable' },
        { id: 'ex_back_13', name: 'One Arm Dumbbell Row', muscleGroup: 'Back', category: 'Lats', equipment: 'Dumbbell' },
        { id: 'ex_back_14', name: 'Machine Row', muscleGroup: 'Back', category: 'Upper Back', equipment: 'Machine' },
        { id: 'ex_back_15', name: 'Hammer Strength Row', muscleGroup: 'Back', category: 'Upper Back', equipment: 'Machine' },
        { id: 'ex_back_16', name: 'Straight Arm Pulldown', muscleGroup: 'Back', category: 'Lats', equipment: 'Cable' },
        { id: 'ex_back_17', name: 'Dumbbell Pullover', muscleGroup: 'Back', category: 'Lats', equipment: 'Dumbbell' },
        { id: 'ex_back_18', name: 'Barbell Deadlift', muscleGroup: 'Back', category: 'Lower Back / Posterior', equipment: 'Barbell' },
        { id: 'ex_back_19', name: 'Romanian Deadlift', muscleGroup: 'Back', category: 'Lower Back / Hamstrings', equipment: 'Barbell' },
        { id: 'ex_back_20', name: 'Rack Pull', muscleGroup: 'Back', category: 'Upper Back / Traps', equipment: 'Barbell' },
        { id: 'ex_back_21', name: 'Hyperextension', muscleGroup: 'Back', category: 'Lower Back', equipment: 'Bodyweight / Machine' },
        { id: 'ex_back_22', name: 'Back Extension', muscleGroup: 'Back', category: 'Lower Back', equipment: 'Machine' },

        // BICEPS (15 exercises)
        { id: 'ex_bic_1', name: 'Barbell Curl', muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Barbell' },
        { id: 'ex_bic_2', name: 'EZ Bar Curl', muscleGroup: 'Biceps', category: 'Biceps', equipment: 'EZ Bar' },
        { id: 'ex_bic_3', name: 'Dumbbell Curl', muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Dumbbell' },
        { id: 'ex_bic_4', name: 'Alternating Dumbbell Curl', muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Dumbbell' },
        { id: 'ex_bic_5', name: 'Hammer Curl', muscleGroup: 'Biceps', category: 'Brachialis', equipment: 'Dumbbell' },
        { id: 'ex_bic_6', name: 'Cross Body Hammer Curl', muscleGroup: 'Biceps', category: 'Brachialis', equipment: 'Dumbbell' },
        { id: 'ex_bic_7', name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', category: 'Long Head', equipment: 'Dumbbell' },
        { id: 'ex_bic_8', name: 'Preacher Curl', muscleGroup: 'Biceps', category: 'Short Head', equipment: 'EZ Bar / Bench' },
        { id: 'ex_bic_9', name: 'Machine Preacher Curl', muscleGroup: 'Biceps', category: 'Short Head', equipment: 'Machine' },
        { id: 'ex_bic_10', name: 'Cable Curl', muscleGroup: 'Biceps', category: 'Biceps', equipment: 'Cable' },
        { id: 'ex_bic_11', name: 'Bayesian Cable Curl', muscleGroup: 'Biceps', category: 'Long Head', equipment: 'Cable' },
        { id: 'ex_bic_12', name: 'Concentration Curl', muscleGroup: 'Biceps', category: 'Short Head', equipment: 'Dumbbell' },
        { id: 'ex_bic_13', name: 'Spider Curl', muscleGroup: 'Biceps', category: 'Short Head', equipment: 'Barbell / Dumbbell' },
        { id: 'ex_bic_14', name: 'Reverse Curl', muscleGroup: 'Biceps', category: 'Brachioradialis', equipment: 'Barbell / EZ Bar' },
        { id: 'ex_bic_15', name: 'Cable Hammer Curl', muscleGroup: 'Biceps', category: 'Brachialis', equipment: 'Cable Rope' },

        // CHEST (19 exercises)
        { id: 'ex_ch_1', name: 'Barbell Bench Press', muscleGroup: 'Chest', category: 'Mid Chest', equipment: 'Barbell' },
        { id: 'ex_ch_2', name: 'Incline Barbell Bench Press', muscleGroup: 'Chest', category: 'Upper Chest', equipment: 'Barbell' },
        { id: 'ex_ch_3', name: 'Decline Barbell Bench Press', muscleGroup: 'Chest', category: 'Lower Chest', equipment: 'Barbell' },
        { id: 'ex_ch_4', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', category: 'Mid Chest', equipment: 'Dumbbell' },
        { id: 'ex_ch_5', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', category: 'Upper Chest', equipment: 'Dumbbell' },
        { id: 'ex_ch_6', name: 'Decline Dumbbell Press', muscleGroup: 'Chest', category: 'Lower Chest', equipment: 'Dumbbell' },
        { id: 'ex_ch_7', name: 'Machine Chest Press', muscleGroup: 'Chest', category: 'Mid Chest', equipment: 'Machine' },
        { id: 'ex_ch_8', name: 'Incline Machine Press', muscleGroup: 'Chest', category: 'Upper Chest', equipment: 'Machine' },
        { id: 'ex_ch_9', name: 'Smith Machine Bench Press', muscleGroup: 'Chest', category: 'Mid Chest', equipment: 'Smith Machine' },
        { id: 'ex_ch_10', name: 'Smith Machine Incline Press', muscleGroup: 'Chest', category: 'Upper Chest', equipment: 'Smith Machine' },
        { id: 'ex_ch_11', name: 'Cable Chest Press', muscleGroup: 'Chest', category: 'Mid Chest', equipment: 'Cable' },
        { id: 'ex_ch_12', name: 'Cable Crossover', muscleGroup: 'Chest', category: 'Chest Fly', equipment: 'Cable' },
        { id: 'ex_ch_13', name: 'High Cable Crossover', muscleGroup: 'Chest', category: 'Lower Chest', equipment: 'Cable' },
        { id: 'ex_ch_14', name: 'Low Cable Crossover', muscleGroup: 'Chest', category: 'Upper Chest', equipment: 'Cable' },
        { id: 'ex_ch_15', name: 'Pec Deck', muscleGroup: 'Chest', category: 'Chest Fly', equipment: 'Machine' },
        { id: 'ex_ch_16', name: 'Dumbbell Fly', muscleGroup: 'Chest', category: 'Chest Fly', equipment: 'Dumbbell' },
        { id: 'ex_ch_17', name: 'Incline Dumbbell Fly', muscleGroup: 'Chest', category: 'Upper Chest', equipment: 'Dumbbell' },
        { id: 'ex_ch_18', name: 'Push Ups', muscleGroup: 'Chest', category: 'Mid Chest', equipment: 'Bodyweight' },
        { id: 'ex_ch_19', name: 'Chest Dips', muscleGroup: 'Chest', category: 'Lower Chest', equipment: 'Bodyweight / Parallel Bars' },

        // TRICEPS (16 exercises)
        { id: 'ex_tri_1', name: 'Triceps Pushdown', muscleGroup: 'Triceps', category: 'Lateral Head', equipment: 'Cable' },
        { id: 'ex_tri_2', name: 'Rope Pushdown', muscleGroup: 'Triceps', category: 'Lateral Head', equipment: 'Cable' },
        { id: 'ex_tri_3', name: 'Straight Bar Pushdown', muscleGroup: 'Triceps', category: 'Medial Head', equipment: 'Cable' },
        { id: 'ex_tri_4', name: 'V Bar Pushdown', muscleGroup: 'Triceps', category: 'Lateral Head', equipment: 'Cable' },
        { id: 'ex_tri_5', name: 'Overhead Cable Extension', muscleGroup: 'Triceps', category: 'Long Head', equipment: 'Cable' },
        { id: 'ex_tri_6', name: 'Dumbbell Overhead Extension', muscleGroup: 'Triceps', category: 'Long Head', equipment: 'Dumbbell' },
        { id: 'ex_tri_7', name: 'EZ Bar Skull Crushers', muscleGroup: 'Triceps', category: 'Long Head', equipment: 'EZ Bar' },
        { id: 'ex_tri_8', name: 'Barbell Skull Crushers', muscleGroup: 'Triceps', category: 'Long Head', equipment: 'Barbell' },
        { id: 'ex_tri_9', name: 'Dumbbell Skull Crushers', muscleGroup: 'Triceps', category: 'Long Head', equipment: 'Dumbbell' },
        { id: 'ex_tri_10', name: 'Close Grip Bench Press', muscleGroup: 'Triceps', category: 'Compound Triceps', equipment: 'Barbell' },
        { id: 'ex_tri_11', name: 'Bench Dips', muscleGroup: 'Triceps', category: 'Compound Triceps', equipment: 'Bodyweight / Bench' },
        { id: 'ex_tri_12', name: 'Assisted Dips', muscleGroup: 'Triceps', category: 'Compound Triceps', equipment: 'Machine' },
        { id: 'ex_tri_13', name: 'Triceps Machine', muscleGroup: 'Triceps', category: 'Triceps', equipment: 'Machine' },
        { id: 'ex_tri_14', name: 'Single Arm Cable Extension', muscleGroup: 'Triceps', category: 'Lateral Head', equipment: 'Cable' },
        { id: 'ex_tri_15', name: 'Reverse Grip Pushdown', muscleGroup: 'Triceps', category: 'Medial Head', equipment: 'Cable' },
        { id: 'ex_tri_16', name: 'Cable Kickback', muscleGroup: 'Triceps', category: 'Long Head', equipment: 'Cable' },

        // LEGS (25 exercises)
        // Quadriceps
        { id: 'ex_leg_1', name: 'Barbell Squat', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Barbell' },
        { id: 'ex_leg_2', name: 'Front Squat', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Barbell' },
        { id: 'ex_leg_3', name: 'Hack Squat', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Machine' },
        { id: 'ex_leg_4', name: 'Smith Machine Squat', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Smith Machine' },
        { id: 'ex_leg_5', name: 'Leg Press', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Machine' },
        { id: 'ex_leg_6', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', category: 'Quadriceps / Glutes', equipment: 'Dumbbell' },
        { id: 'ex_leg_7', name: 'Walking Lunges', muscleGroup: 'Legs', category: 'Quadriceps / Glutes', equipment: 'Dumbbell' },
        { id: 'ex_leg_8', name: 'Reverse Lunges', muscleGroup: 'Legs', category: 'Quadriceps / Glutes', equipment: 'Dumbbell' },
        { id: 'ex_leg_9', name: 'Leg Extension', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Machine' },
        { id: 'ex_leg_10', name: 'Goblet Squat', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Dumbbell / Kettlebell' },
        { id: 'ex_leg_11', name: 'Step Ups', muscleGroup: 'Legs', category: 'Quadriceps', equipment: 'Dumbbell / Bench' },
        // Hamstrings
        { id: 'ex_leg_12', name: 'Romanian Deadlift', muscleGroup: 'Legs', category: 'Hamstrings', equipment: 'Barbell / Dumbbell' },
        { id: 'ex_leg_13', name: 'Stiff Leg Deadlift', muscleGroup: 'Legs', category: 'Hamstrings', equipment: 'Barbell' },
        { id: 'ex_leg_14', name: 'Lying Leg Curl', muscleGroup: 'Legs', category: 'Hamstrings', equipment: 'Machine' },
        { id: 'ex_leg_15', name: 'Seated Leg Curl', muscleGroup: 'Legs', category: 'Hamstrings', equipment: 'Machine' },
        { id: 'ex_leg_16', name: 'Standing Leg Curl', muscleGroup: 'Legs', category: 'Hamstrings', equipment: 'Machine' },
        { id: 'ex_leg_17', name: 'Good Morning', muscleGroup: 'Legs', category: 'Hamstrings', equipment: 'Barbell' },
        // Glutes
        { id: 'ex_leg_18', name: 'Hip Thrust', muscleGroup: 'Legs', category: 'Glutes', equipment: 'Barbell / Bench' },
        { id: 'ex_leg_19', name: 'Barbell Hip Thrust', muscleGroup: 'Legs', category: 'Glutes', equipment: 'Barbell / Bench' },
        { id: 'ex_leg_20', name: 'Glute Bridge', muscleGroup: 'Legs', category: 'Glutes', equipment: 'Barbell / Mat' },
        { id: 'ex_leg_21', name: 'Cable Kickback', muscleGroup: 'Legs', category: 'Glutes', equipment: 'Cable' },
        // Calves
        { id: 'ex_leg_22', name: 'Standing Calf Raise', muscleGroup: 'Legs', category: 'Calves', equipment: 'Machine' },
        { id: 'ex_leg_23', name: 'Seated Calf Raise', muscleGroup: 'Legs', category: 'Calves', equipment: 'Machine' },
        { id: 'ex_leg_24', name: 'Leg Press Calf Raise', muscleGroup: 'Legs', category: 'Calves', equipment: 'Machine' },
        { id: 'ex_leg_25', name: 'Single Leg Calf Raise', muscleGroup: 'Legs', category: 'Calves', equipment: 'Dumbbell / Step' },

        // SHOULDERS (17 exercises)
        { id: 'ex_sh_1', name: 'Barbell Overhead Press', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Barbell' },
        { id: 'ex_sh_2', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Dumbbell' },
        { id: 'ex_sh_3', name: 'Arnold Press', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Dumbbell' },
        { id: 'ex_sh_4', name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Machine' },
        { id: 'ex_sh_5', name: 'Smith Machine Shoulder Press', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Smith Machine' },
        { id: 'ex_sh_6', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', category: 'Side Delt', equipment: 'Dumbbell' },
        { id: 'ex_sh_7', name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', category: 'Side Delt', equipment: 'Cable' },
        { id: 'ex_sh_8', name: 'Machine Lateral Raise', muscleGroup: 'Shoulders', category: 'Side Delt', equipment: 'Machine' },
        { id: 'ex_sh_9', name: 'Front Dumbbell Raise', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Dumbbell' },
        { id: 'ex_sh_10', name: 'Cable Front Raise', muscleGroup: 'Shoulders', category: 'Front Delt', equipment: 'Cable' },
        { id: 'ex_sh_11', name: 'Rear Delt Fly', muscleGroup: 'Shoulders', category: 'Rear Delt', equipment: 'Dumbbell' },
        { id: 'ex_sh_12', name: 'Reverse Pec Deck', muscleGroup: 'Shoulders', category: 'Rear Delt', equipment: 'Machine' },
        { id: 'ex_sh_13', name: 'Face Pull', muscleGroup: 'Shoulders', category: 'Rear Delt / Traps', equipment: 'Cable Rope' },
        { id: 'ex_sh_14', name: 'Cable Rear Delt Fly', muscleGroup: 'Shoulders', category: 'Rear Delt', equipment: 'Cable' },
        { id: 'ex_sh_15', name: 'Upright Row', muscleGroup: 'Shoulders', category: 'Side Delt / Traps', equipment: 'Barbell / Cable' },
        { id: 'ex_sh_16', name: 'Barbell Shrug', muscleGroup: 'Shoulders', category: 'Traps', equipment: 'Barbell' },
        { id: 'ex_sh_17', name: 'Dumbbell Shrug', muscleGroup: 'Shoulders', category: 'Traps', equipment: 'Dumbbell' }
        ];
    }

    getGymState() {
        if (!this.memoryState.gym) {
            this.memoryState.gym = {
                isConfigured: false,
                settings: {
                    trackRPE: false,
                    trackRestTime: true,
                    trackWarmupSets: false,
                    trackCardio: false,
                    trackBodyMeasurements: false,
                    trackPRs: true
                },
                schedule: {},
                sessions: [],
                customExercises: [],
                activeSession: null,
                measurements: []
            };
        }
        if (!this.memoryState.gym.customExercises) {
            this.memoryState.gym.customExercises = [];
        }
        // Initialize default recurring weekly split if unconfigured or missing schedule
        if (!this.memoryState.gym.isConfigured || !this.memoryState.gym.schedule || Object.keys(this.memoryState.gym.schedule).length === 0) {
            this.initDefaultGymSplit(true);
        } else {
            // Defensive repair: ensure all 7 days have stable dayKey, dayName, routineName, workoutType
            const schedule = this.memoryState.gym.schedule;
            const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            dayKeys.forEach(k => {
                const day = schedule[k];
                if (day) {
                    const dayCapital = k.charAt(0).toUpperCase() + k.slice(1);
                    if (!day.dayKey) day.dayKey = k;
                    if (!day.dayName || day.dayName === 'Chest + Triceps') day.dayName = dayCapital;
                    if (!day.routineName) {
                        day.routineName = day.workoutType || (k === 'wednesday' ? 'Chest + Triceps' : (day.isRestDay ? 'Rest' : `${dayCapital} Workout`));
                    }
                    if (!day.workoutType) {
                        day.workoutType = day.routineName;
                    }
                }
            });
        }
        return this.memoryState.gym;
    }

    initDefaultGymSplit(force = false) {
        const gym = this.memoryState.gym || this.getGymState();
        if (gym.isConfigured && !force && gym.schedule && Object.keys(gym.schedule).length >= 7) {
            return;
        }

        gym.isConfigured = true;
        gym.schedule = {
            monday: {
                dayKey: 'monday',
                dayName: 'Monday',
                routineName: 'Back + Biceps',
                workoutType: 'Back + Biceps',
                isRestDay: false,
                muscleGroups: ['Back', 'Biceps'],
                exercises: []
            },
            tuesday: {
                dayKey: 'tuesday',
                dayName: 'Tuesday',
                routineName: 'Legs + Shoulders',
                workoutType: 'Legs + Shoulders',
                isRestDay: false,
                muscleGroups: ['Legs', 'Shoulders'],
                exercises: []
            },
            wednesday: {
                dayKey: 'wednesday',
                dayName: 'Wednesday',
                routineName: 'Chest + Triceps',
                workoutType: 'Chest + Triceps',
                isRestDay: false,
                muscleGroups: ['Chest', 'Triceps'],
                exercises: []
            },
            thursday: {
                dayKey: 'thursday',
                dayName: 'Thursday',
                routineName: 'Back + Biceps',
                workoutType: 'Back + Biceps',
                isRestDay: false,
                muscleGroups: ['Back', 'Biceps'],
                exercises: []
            },
            friday: {
                dayKey: 'friday',
                dayName: 'Friday',
                routineName: 'Legs + Shoulders',
                workoutType: 'Legs + Shoulders',
                isRestDay: false,
                muscleGroups: ['Legs', 'Shoulders'],
                exercises: []
            },
            saturday: {
                dayKey: 'saturday',
                dayName: 'Saturday',
                routineName: 'Chest + Triceps',
                workoutType: 'Chest + Triceps',
                isRestDay: false,
                muscleGroups: ['Chest', 'Triceps'],
                exercises: []
            },
            sunday: {
                dayKey: 'sunday',
                dayName: 'Sunday',
                routineName: 'Rest',
                workoutType: 'Rest',
                isRestDay: true,
                muscleGroups: [],
                exercises: []
            }
        };
        this.save();
    }

    getExerciseLibrary(filter = {}) {
        const gym = this.getGymState();
        const custom = gym.customExercises || [];
        let list = this.DEFAULT_EXERCISE_LIBRARY.concat(custom);

        if (filter.muscleGroup && filter.muscleGroup !== 'all') {
            const mg = filter.muscleGroup.trim().toLowerCase();
            list = list.filter(e => (e.muscleGroup || '').toLowerCase() === mg);
        }
        if (filter.muscleGroups && Array.isArray(filter.muscleGroups) && filter.muscleGroups.length > 0) {
            const mgList = filter.muscleGroups.map(m => m.toLowerCase());
            list = list.filter(e => mgList.includes((e.muscleGroup || '').toLowerCase()));
        }
        if (filter.search) {
            const q = filter.search.trim().toLowerCase();
            list = list.filter(e =>
                (e.name || '').toLowerCase().includes(q) ||
                (e.muscleGroup || '').toLowerCase().includes(q) ||
                (e.category || '').toLowerCase().includes(q)
            );
        }
        return list;
    }

    addCustomExercise(exerciseData) {
        const gym = this.getGymState();
        if (!gym.customExercises) gym.customExercises = [];
        const newEx = {
            id: 'ex_cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: (exerciseData.name || '').trim(),
            muscleGroup: (exerciseData.muscleGroup || 'General').trim(),
            category: (exerciseData.category || exerciseData.muscleGroup || 'General').trim(),
            equipment: (exerciseData.equipment || 'Standard').trim(),
            notes: (exerciseData.notes || '').trim()
        };
        gym.customExercises.push(newEx);
        this.save();
        return newEx;
    }

    isGymConfigured() {
        return !!(this.getGymState().isConfigured);
    }

    saveGymPlan(planData) {
        const gym = this.getGymState();
        gym.isConfigured = true;
        if (planData.settings) {
            gym.settings = { ...gym.settings, ...planData.settings };
        }
        if (planData.schedule) {
            const cleanSchedule = {};
            const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            dayKeys.forEach(k => {
                const day = planData.schedule[k] || gym.schedule[k] || {};
                const dayCapital = k.charAt(0).toUpperCase() + k.slice(1);
                const rName = (day.routineName || day.workoutType || (day.isRestDay ? 'Rest' : `${dayCapital} Workout`)).trim();
                cleanSchedule[k] = {
                    dayKey: k,
                    dayName: dayCapital,
                    routineName: rName,
                    workoutType: rName,
                    isRestDay: !!day.isRestDay,
                    muscleGroups: Array.isArray(day.muscleGroups) && day.muscleGroups.length > 0 
                        ? day.muscleGroups 
                        : (rName && !day.isRestDay ? rName.split('+').map(s => s.trim()) : []),
                    exercises: Array.isArray(day.exercises) ? day.exercises : []
                };
            });
            gym.schedule = cleanSchedule;
        }
        this.save(true);
        if (typeof window !== 'undefined' && window.SyncEngine && typeof window.SyncEngine.pushWorkoutPlan === 'function') {
            window.SyncEngine.pushWorkoutPlan(gym.schedule, gym.settings);
        } else if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
            SupabaseService.saveWorkoutPlan(gym.schedule, gym.settings);
        }
        return gym;
    }

    updateGymSettings(settings) {
        const gym = this.getGymState();
        gym.settings = { ...gym.settings, ...settings };
        this.save();
        return gym.settings;
    }

    getWorkoutTemplateForDay(dayKey) {
        const gym = this.getGymState();
        const key = (dayKey || '').toLowerCase();
        const raw = gym.schedule[key];
        if (!raw) return null;
        const dayCapital = key.charAt(0).toUpperCase() + key.slice(1);
        const rName = (raw.routineName || raw.workoutType || (raw.isRestDay ? 'Rest' : `${dayCapital} Workout`)).trim();
        return {
            ...raw,
            dayKey: key,
            dayName: raw.dayName || dayCapital,
            routineName: rName,
            workoutType: rName,
            isRestDay: !!raw.isRestDay,
            muscleGroups: Array.isArray(raw.muscleGroups) ? raw.muscleGroups : [],
            exercises: Array.isArray(raw.exercises) ? raw.exercises : []
        };
    }

    getTodayWorkoutTemplate(dateStr = null) {
        const targetDate = dateStr || DateUtils.todayIST();
        const dayIndex = new Date(targetDate + 'T12:00:00').getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[dayIndex];
        const dayCapital = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
        const templ = this.getWorkoutTemplateForDay(dayKey) || {
            dayKey,
            dayName: dayCapital,
            routineName: 'Rest',
            workoutType: 'Rest',
            isRestDay: true,
            muscleGroups: [],
            exercises: []
        };
        return {
            dayKey,
            dayName: dayCapital,
            date: targetDate,
            template: templ
        };
    }

    _isValidUuid(id) {
        return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }

    _generateUuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    saveWorkoutSession(sessionData) {
        const gym = this.getGymState();
        if (!gym.sessions) gym.sessions = [];

        let calcVolume = 0;
        let calcSets = 0;
        let calcReps = 0;

        (sessionData.exercises || []).forEach(ex => {
            if (!ex.skipped) {
                (ex.sets || []).forEach(s => {
                    const wt = parseFloat(s.weightKg ?? s.weight_kg ?? 0) || 0;
                    const rp = parseInt(s.reps ?? 0, 10) || 0;
                    if (s.completed !== false && (rp > 0 || wt > 0 || s.completed === true)) {
                        calcSets++;
                        calcReps += rp;
                        calcVolume += (wt * rp);
                    }
                });
            }
        });

        const targetDate = sessionData.date || DateUtils.todayIST();
        const dObj = new Date(targetDate + 'T12:00:00');
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dObj.getDay()];

        const currentAuthId = (typeof SupabaseService !== 'undefined' && SupabaseService.getUserId()) || sessionData.userId || 'default_user';
        const finalSessionId = (sessionData.id && this._isValidUuid(sessionData.id)) ? sessionData.id : this._generateUuid();
        const routineName = (sessionData.routineName || sessionData.workoutType || sessionData.workout_type || 'Custom Workout').trim();
        const durationMin = Number(sessionData.durationMinutes ?? sessionData.duration ?? sessionData.duration_minutes ?? 0) || 0;
        const totalSets = (sessionData.totalSets ?? sessionData.total_sets) ? Number(sessionData.totalSets ?? sessionData.total_sets) : calcSets;
        const totalVolumeKg = (sessionData.totalVolumeKg ?? sessionData.total_volume_kg) ? Math.round(Number(sessionData.totalVolumeKg ?? sessionData.total_volume_kg)) : Math.round(calcVolume);
        const totalReps = (sessionData.totalReps ?? sessionData.total_reps) ? Number(sessionData.totalReps ?? sessionData.total_reps) : calcReps;

        const photoPath = sessionData.gym_photo_path || sessionData.gymPhoto?.storagePath || null;
        const photoUrl = sessionData.gymPhoto?.url || sessionData.gym_photo_url || (sessionData.gymPhoto?.base64 && sessionData.gymPhoto.base64.startsWith('data:') ? sessionData.gymPhoto.base64 : null);

        const entry = {
            id: finalSessionId,
            userId: currentAuthId,
            date: targetDate,
            dayOfWeek: sessionData.dayOfWeek || sessionData.day_of_week || dayName,
            dayKey: (sessionData.dayKey || sessionData.day_key || dayName).toLowerCase(),
            workoutType: routineName,
            routineName: routineName,
            durationMinutes: durationMin,
            duration: durationMin,
            startedAt: sessionData.startedAt || sessionData.started_at || null,
            endedAt: sessionData.endedAt || sessionData.ended_at || DateUtils.nowISO(),
            status: sessionData.status || 'completed',
            totalVolumeKg,
            totalSets,
            totalReps,
            completedAt: sessionData.completedAt || sessionData.created_at || DateUtils.nowISO(),
            updatedAt: DateUtils.nowISO(),
            // Mandatory gym check-in photo storage
            gymPhoto: sessionData.gymPhoto || (photoPath ? { id: finalSessionId + '_photo', storagePath: photoPath, url: photoUrl } : null),
            gym_photo_id: sessionData.gymPhoto?.id || sessionData.gym_photo_id || (photoPath ? finalSessionId + '_photo' : null),
            gym_photo_path: photoPath,
            gym_photo_url: photoUrl,
            gym_photo_created_at: sessionData.gymPhoto?.createdAt || sessionData.gym_photo_created_at || null,
            exercises: sessionData.exercises || [],
            notes: sessionData.notes || ''
        };

        this.calculateAndTagSessionPRs(entry);

        // Upsert locally: if existing record has same ID or same stable signature, update in-place
        const existingIdx = gym.sessions.findIndex(s => s.id === entry.id || (
            s.date === entry.date &&
            (s.workoutType || s.routineName) === entry.workoutType &&
            Math.abs((s.totalVolumeKg || 0) - entry.totalVolumeKg) < 0.1 &&
            (s.totalSets || 0) === entry.totalSets
        ));

        if (existingIdx >= 0) {
            gym.sessions[existingIdx] = { ...gym.sessions[existingIdx], ...entry };
        } else {
            gym.sessions.unshift(entry);
        }

        gym.activeSession = null;
        this.save(true);

        if (typeof window !== 'undefined' && window.SyncEngine && typeof window.SyncEngine.pushWorkoutSession === 'function') {
            window.SyncEngine.pushWorkoutSession(entry);
        }
        return entry;
    }

    deleteWorkoutSession(id) {
        const gym = this.getGymState();
        if (!gym.sessions) return false;
        const initial = gym.sessions.length;
        gym.sessions = gym.sessions.filter(s => s.id !== id);
        if (gym.sessions.length !== initial) {
            this.save(true);
            if (typeof window !== 'undefined' && window.SyncEngine && typeof window.SyncEngine.pushDeleteWorkoutSession === 'function') {
                window.SyncEngine.pushDeleteWorkoutSession(id);
            } else if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
                SupabaseService.deleteWorkoutSession(id).catch(e => console.warn('[Store] Remote delete error:', e));
            }
            return true;
        }
        return false;
    }

    toWorkoutSessionViewModel(s) {
        if (!s) return null;
        const exercises = Array.isArray(s.exercises) ? s.exercises : [];
        let calcSets = 0;
        let calcVolume = 0;
        let calcReps = 0;
        let calcExerciseCount = 0;
        exercises.forEach(ex => {
            if (!ex.skipped) {
                calcExerciseCount++;
                (ex.sets || []).forEach(st => {
                    const isCompleted = st.completed !== false;
                    const wt = Number(st.weightKg ?? st.weight_kg ?? 0) || 0;
                    const rp = Number(st.reps ?? 0) || 0;
                    if (isCompleted && (rp > 0 || wt > 0 || st.completed === true)) {
                        calcSets++;
                        calcReps += rp;
                        calcVolume += (wt * rp);
                    }
                });
            }
        });

        const routineName = (s.workoutType || s.workout_type || s.routineName || 'Custom Workout').trim();
        let durationMinutes = Number(s.durationMinutes ?? s.duration_minutes ?? s.duration ?? 0) || 0;
        const started = s.startedAt || s.started_at;
        const ended = s.endedAt || s.ended_at;
        if (durationMinutes <= 0 && started && ended) {
            try {
                const diffMs = new Date(ended).getTime() - new Date(started).getTime();
                if (diffMs > 0) {
                    durationMinutes = Math.round(diffMs / 60000);
                }
            } catch (e) {}
        }
        const rawSets = Number(s.totalSets ?? s.total_sets ?? 0) || 0;
        const totalSets = rawSets > 0 ? rawSets : calcSets;
        const rawVol = Number(s.totalVolumeKg ?? s.total_volume_kg ?? 0) || 0;
        const totalVolumeKg = rawVol > 0 ? Math.round(rawVol) : Math.round(calcVolume);
        const rawReps = Number(s.totalReps ?? s.total_reps ?? 0) || 0;
        const totalReps = rawReps > 0 ? rawReps : calcReps;
        const exerciseCount = exercises.length > 0 ? exercises.length : calcExerciseCount;

        const photoPath = s.gym_photo_path || s.gymPhoto?.storagePath || null;
        const photoUrl = s.gymPhoto?.url || s.gym_photo_url || (s.gymPhoto?.base64 && s.gymPhoto.base64.startsWith('data:') ? s.gymPhoto.base64 : null);

        const targetDate = s.date || DateUtils.todayIST();
        let dayOfWeek = s.dayOfWeek || s.day_of_week || '';
        let dayKey = (s.dayKey || s.day_key || '').toLowerCase();
        if (!dayOfWeek || !dayKey) {
            const dObj = new Date(targetDate + 'T12:00:00');
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dName = dayNames[dObj.getDay()];
            dayOfWeek = dayOfWeek || dName;
            dayKey = dayKey || dName.toLowerCase();
        }

        return {
            id: s.id,
            userId: s.userId || s.user_id || '',
            date: targetDate,
            dayOfWeek,
            dayKey,
            workoutType: routineName,
            routineName: routineName,
            duration: durationMinutes,
            durationMinutes: durationMinutes,
            exerciseCount,
            setCount: totalSets,
            totalSets,
            totalVolumeKg,
            totalReps,
            status: s.status || 'completed',
            gymPhoto: s.gymPhoto || (photoPath ? { id: s.id + '_photo', storagePath: photoPath, url: photoUrl, createdAt: s.completedAt || s.createdAt } : null),
            gym_photo_path: photoPath,
            gym_photo_url: photoUrl,
            startedAt: s.startedAt || s.started_at || null,
            endedAt: s.endedAt || s.ended_at || null,
            completedAt: s.completedAt || s.created_at || s.endedAt || null,
            updatedAt: s.updatedAt || s.updated_at || null,
            notes: s.notes || '',
            personalRecords: s.personalRecords || s.personal_records || [],
            exercises
        };
    }

    deduplicateWorkoutSessions(sessions) {
        if (!Array.isArray(sessions)) return [];
        const idMap = new Map();
        const signatureMap = new Map();
        const result = [];

        for (const raw of sessions) {
            const sess = this.toWorkoutSessionViewModel(raw);
            if (!sess || !sess.id) continue;

            // 1. Primary key deduplication
            if (idMap.has(sess.id)) {
                const existing = idMap.get(sess.id);
                // Keep the richer record
                if ((sess.exercises?.length || 0) > (existing.exercises?.length || 0) || (sess.totalVolumeKg > existing.totalVolumeKg)) {
                    idMap.set(sess.id, sess);
                    const idx = result.findIndex(r => r.id === sess.id);
                    if (idx >= 0) result[idx] = sess;
                }
                continue;
            }
            idMap.set(sess.id, sess);

            // 2. Conservative signature deduplication (only collapse demonstrably identical sessions)
            const started = sess.startedAt ? sess.startedAt.slice(0, 16) : '';
            const ended = sess.endedAt ? sess.endedAt.slice(0, 16) : '';
            const photoKey = sess.gym_photo_path || '';
            const signature = `${sess.date}|${sess.workoutType.toLowerCase()}|${started}|${ended}|${sess.durationMinutes}|${sess.totalSets}|${sess.totalVolumeKg}|${photoKey}`;

            if (signatureMap.has(signature)) {
                const existing = signatureMap.get(signature);
                if ((sess.exercises?.length || 0) > (existing.exercises?.length || 0)) {
                    signatureMap.set(signature, sess);
                    const idx = result.findIndex(r => r.id === existing.id);
                    if (idx >= 0) result[idx] = sess;
                }
                continue;
            }

            signatureMap.set(signature, sess);
            result.push(sess);
        }

        return result.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    getWorkoutSessions() {
        const rawSessions = this.getGymState().sessions || [];
        return this.deduplicateWorkoutSessions(rawSessions);
    }

    getWorkoutSessionById(id) {
        return this.getWorkoutSessions().find(s => s.id === id) || null;
    }

    getAvailableHistoryMonths() {
        const sessions = this.getWorkoutSessions();
        const monthSet = new Set();
        
        // Include current month
        const today = DateUtils.todayIST();
        monthSet.add(today.slice(0, 7)); // 'YYYY-MM'

        sessions.forEach(s => {
            if (s.date && s.date.length >= 7) {
                monthSet.add(s.date.slice(0, 7));
            }
        });

        const monthKeys = Array.from(monthSet).sort().reverse();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        return monthKeys.map(k => {
            const parts = k.split('-');
            const y = parts[0];
            const m = parseInt(parts[1], 10);
            const name = monthNames[m - 1] || parts[1];
            return {
                key: k,
                label: `${name} ${y}`
            };
        });
    }

    getMonthSummary(monthKey) {
        const allSessions = this.getWorkoutSessions();
        const targetMonth = monthKey || DateUtils.todayIST().slice(0, 7);
        const sessions = allSessions.filter(s => (s.date || '').startsWith(targetMonth));

        const uniqueDates = new Set(sessions.map(s => s.date));
        let totalSets = 0;
        let totalVolume = 0;
        let totalDuration = 0;
        const muscleGroupsSet = new Set();
        let prCount = 0;

        sessions.forEach(s => {
            totalSets += (s.totalSets || 0);
            totalVolume += (s.totalVolumeKg || 0);
            totalDuration += (s.durationMinutes || s.duration || 0);
            (s.exercises || []).forEach(e => {
                if (e.muscleGroup) muscleGroupsSet.add(e.muscleGroup);
                (e.sets || []).forEach(st => {
                    if (st.isWeightPr || st.isRepPr) prCount++;
                });
            });
        });

        const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;

        return {
            monthKey: targetMonth,
            sessions,
            workoutDays: uniqueDates.size,
            totalSets,
            totalVolumeKg: Math.round(totalVolume),
            avgDurationMinutes: avgDuration,
            muscleGroupsTrained: Array.from(muscleGroupsSet),
            prsAchieved: prCount
        };
    }

    calculateAndTagSessionPRs(session) {
        const gym = this.getGymState();
        const pastSessions = gym.sessions || [];

        (session.exercises || []).forEach(ex => {
            const exName = (ex.name || '').trim().toLowerCase();
            if (!exName || ex.skipped) return;

            let prevMaxWeight = 0;
            let prevMaxRepsAtWeight = {};

            pastSessions.forEach(ps => {
                (ps.exercises || []).forEach(pex => {
                    if ((pex.name || '').trim().toLowerCase() === exName && !pex.skipped) {
                        (pex.sets || []).forEach(psSet => {
                            const wt = parseFloat(psSet.weightKg) || 0;
                            const rp = parseInt(psSet.reps, 10) || 0;
                            if (wt > prevMaxWeight) prevMaxWeight = wt;
                            if (!prevMaxRepsAtWeight[wt] || rp > prevMaxRepsAtWeight[wt]) {
                                prevMaxRepsAtWeight[wt] = rp;
                            }
                        });
                    }
                });
            });

            (ex.sets || []).forEach(s => {
                const wt = parseFloat(s.weightKg) || 0;
                const rp = parseInt(s.reps, 10) || 0;
                if (wt > 0 && wt > prevMaxWeight && prevMaxWeight > 0) {
                    s.isWeightPr = true;
                }
                if (wt > 0 && prevMaxRepsAtWeight[wt] && rp > prevMaxRepsAtWeight[wt]) {
                    s.isRepPr = true;
                }
            });
        });
    }

    getActiveWorkoutSession() {
        return this.getGymState().activeSession || null;
    }

    saveActiveWorkoutSession(session) {
        const gym = this.getGymState();
        gym.activeSession = session;
        this.save();
    }

    clearActiveWorkoutSession() {
        const gym = this.getGymState();
        gym.activeSession = null;
        this.save();
    }

    getExerciseHistory(exerciseName) {
        const gym = this.getGymState();
        const nameQuery = (exerciseName || '').trim().toLowerCase();
        if (!nameQuery) return [];

        const history = [];
        (gym.sessions || []).forEach(sess => {
            const matchEx = (sess.exercises || []).find(e => (e.name || '').trim().toLowerCase() === nameQuery && !e.skipped);
            if (matchEx && matchEx.sets && matchEx.sets.length > 0) {
                let maxWt = 0;
                let maxRp = 0;
                let vol = 0;
                let best1RM = 0;

                matchEx.sets.forEach(s => {
                    const wt = parseFloat(s.weightKg) || 0;
                    const rp = parseInt(s.reps, 10) || 0;
                    if (wt > maxWt) maxWt = wt;
                    if (rp > maxRp) maxRp = rp;
                    vol += (wt * rp);
                    const est = wt * (1 + rp / 30);
                    if (est > best1RM) best1RM = est;
                });

                history.push({
                    date: sess.date,
                    sessionId: sess.id,
                    routineName: sess.routineName,
                    sets: matchEx.sets,
                    maxWeight: maxWt,
                    maxReps: maxRp,
                    volume: Math.round(vol),
                    est1RM: Math.round(best1RM * 10) / 10
                });
            }
        });

        return history.sort((a, b) => a.date.localeCompare(b.date));
    }

    getExercisePRs() {
        const gym = this.getGymState();
        const sessions = gym.sessions || [];

        const prMap = {};
        let bestSession = null;

        sessions.forEach(sess => {
            if (!bestSession || sess.totalVolumeKg > bestSession.totalVolumeKg) {
                bestSession = {
                    date: sess.date,
                    routineName: sess.routineName,
                    volume: sess.totalVolumeKg,
                    sets: sess.totalSets
                };
            }

            (sess.exercises || []).forEach(ex => {
                const exName = (ex.name || '').trim();
                if (!exName || ex.skipped) return;

                if (!prMap[exName]) {
                    prMap[exName] = {
                        name: exName,
                        muscleGroup: ex.muscleGroup || 'General',
                        heaviest: { weightKg: 0, reps: 0, date: null },
                        bestReps: { reps: 0, weightKg: 0, date: null },
                        bestVolume: { volumeKg: 0, date: null },
                        best1RM: { oneRM: 0, weightKg: 0, reps: 0, date: null }
                    };
                }

                let exVol = 0;
                (ex.sets || []).forEach(s => {
                    const wt = parseFloat(s.weightKg) || 0;
                    const rp = parseInt(s.reps, 10) || 0;
                    exVol += (wt * rp);

                    if (wt > prMap[exName].heaviest.weightKg) {
                        prMap[exName].heaviest = { weightKg: wt, reps: rp, date: sess.date };
                    }
                    if (rp > prMap[exName].bestReps.reps) {
                        prMap[exName].bestReps = { reps: rp, weightKg: wt, date: sess.date };
                    }
                    const est = wt * (1 + rp / 30);
                    if (est > prMap[exName].best1RM.oneRM) {
                        prMap[exName].best1RM = { oneRM: Math.round(est * 10) / 10, weightKg: wt, reps: rp, date: sess.date };
                    }
                });

                if (exVol > prMap[exName].bestVolume.volumeKg) {
                    prMap[exName].bestVolume = { volumeKg: Math.round(exVol), date: sess.date };
                }
            });
        });

        return {
            exercises: Object.values(prMap),
            bestSession
        };
    }

    getWeeklyGymSummary(targetDateStr = null) {
        const todayStr = targetDateStr || DateUtils.todayIST();
        const gym = this.getGymState();
        const sessions = gym.sessions || [];

        const d = new Date(todayStr + 'T12:00:00');
        const dayOfWeek = (d.getDay() + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - dayOfWeek);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mondayStr = monday.toISOString().split('T')[0];
        const sundayStr = sunday.toISOString().split('T')[0];

        const weekSessions = sessions.filter(s => s.date >= mondayStr && s.date <= sundayStr);

        let plannedDays = 0;
        Object.keys(gym.schedule || {}).forEach(k => {
            if (gym.schedule[k] && !gym.schedule[k].isRestDay) {
                plannedDays++;
            }
        });

        let totalSets = 0;
        let totalVolume = 0;
        let prCount = 0;
        const muscleCounts = {};

        weekSessions.forEach(s => {
            totalSets += (s.totalSets || 0);
            totalVolume += (s.totalVolumeKg || 0);
            (s.exercises || []).forEach(e => {
                const mg = e.muscleGroup || 'General';
                muscleCounts[mg] = (muscleCounts[mg] || 0) + (e.sets?.length || 1);
                (e.sets || []).forEach(set => {
                    if (set.isWeightPr || set.isRepPr) prCount++;
                });
            });
        });

        let mostTrained = '—';
        let maxCount = 0;
        Object.keys(muscleCounts).forEach(m => {
            if (muscleCounts[m] > maxCount) {
                maxCount = muscleCounts[m];
                mostTrained = m;
            }
        });

        let missedCount = 0;
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for (let i = 0; i <= dayOfWeek; i++) {
            const checkDay = new Date(monday);
            checkDay.setDate(monday.getDate() + i);
            const checkDateStr = checkDay.toISOString().split('T')[0];
            const checkDayKey = dayNames[i];
            const templ = gym.schedule[checkDayKey];
            if (templ && !templ.isRestDay && checkDateStr < todayStr) {
                const hadSession = sessions.some(s => s.date === checkDateStr);
                if (!hadSession) missedCount++;
            }
        }

        return {
            mondayStr,
            sundayStr,
            completedDays: weekSessions.length,
            plannedDays: plannedDays || 5,
            totalSets,
            totalVolumeKg: Math.round(totalVolume),
            mostTrained,
            prsAchieved: prCount,
            missedSessions: missedCount
        };
    }

    getGymDayStatus(dateStr) {
        const gym = this.getGymState();
        if (!gym.isConfigured) return null;

        const dayIndex = new Date(dateStr + 'T12:00:00').getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[dayIndex];
        const templ = gym.schedule[dayKey];

        if (!templ) return null;
        if (templ.isRestDay) return { status: 'REST', label: 'Rest Day' };

        const session = (gym.sessions || []).find(s => s.date === dateStr);
        if (session) return { status: 'COMPLETED', label: `Completed: ${session.routineName}`, session };

        const today = DateUtils.todayIST();
        if (dateStr < today) return { status: 'MISSED', label: `Missed: ${templ.routineName}`, template: templ };
        return { status: 'PLANNED', label: `Planned: ${templ.routineName}`, template: templ };
    }

    // =========================================================================
    // FEATURE 9: GATE 2027 PERSISTENCE METHODS
    // =========================================================================

    getGateState() {
        if (!this.memoryState) this.memoryState = {};
        if (!this.memoryState.gate) {
            this.memoryState.gate = {};
        }
        const gate = this.memoryState.gate;
        if (!gate.planItems) gate.planItems = {};
        if (!gate.topicStatuses) gate.topicStatuses = {};
        if (!gate.attempts) gate.attempts = {};
        if (!gate.topicProgress) gate.topicProgress = {};
        if (!gate.subjectMastery) gate.subjectMastery = {};
        if (!Array.isArray(gate.customPyqs)) gate.customPyqs = [];
        if (!gate.settings) {
            gate.settings = {
                targetPyqsPerSession: 8,
                sessionDurationMinutes: 90,
                weights: {
                    historicalFrequency: 0.25,
                    recentFrequency: 0.20,
                    recurrence: 0.15,
                    userWeakness: 0.20,
                    revisionDue: 0.10,
                    pyqCoverageGap: 0.10
                }
            };
        }
        return this.memoryState.gate;
    }

    getGatePyqAttempts() {
        const gate = this.getGateState();
        return Object.values(gate.attempts || {});
    }

    getGateAttemptByPyqId(pyqId) {
        const attempts = this.getGatePyqAttempts();
        return attempts.find(a => a.pyqId === pyqId) || null;
    }

    recordGatePyqAttempt(attemptData) {
        const gate = this.getGateState();
        if (!gate.attempts) gate.attempts = {};

        const id = attemptData.id || `gate_att_${attemptData.pyqId}_${Date.now()}`;
        const attempt = {
            id,
            userId: attemptData.userId || (typeof SupabaseService !== 'undefined' ? SupabaseService.getUserId() : 'local_user'),
            pyqId: attemptData.pyqId,
            subjectId: attemptData.subjectId,
            topicId: attemptData.topicId,
            year: attemptData.year,
            attemptedAt: attemptData.attemptedAt || new Date().toISOString(),
            status: attemptData.status || (attemptData.isCorrect ? 'CORRECT' : 'WRONG'),
            isCorrect: !!attemptData.isCorrect,
            timeTakenSeconds: Number(attemptData.timeTakenSeconds || 0),
            confidence: attemptData.confidence || 'MEDIUM',
            mistakeType: attemptData.mistakeType || null,
            notes: attemptData.notes || '',
            revisionDueAt: attemptData.revisionDueAt || null,
            createdAt: attemptData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        gate.attempts[id] = attempt;

        if (!gate.topicProgress) gate.topicProgress = {};
        const topId = attempt.topicId;
        const topicAttempts = Object.values(gate.attempts).filter(a => a.topicId === topId);
        const totalAttempted = topicAttempts.length;
        const totalCorrect = topicAttempts.filter(a => a.isCorrect).length;
        const totalWrong = topicAttempts.filter(a => !a.isCorrect && a.status !== 'SKIPPED').length;
        const totalSkipped = topicAttempts.filter(a => a.status === 'SKIPPED').length;
        const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
        const mastery = Math.round((accuracy * 0.7) + (Math.min(totalAttempted, 10) * 3));

        gate.topicProgress[topId] = {
            subjectId: attempt.subjectId,
            topicId: topId,
            totalAttempted,
            totalCorrect,
            totalWrong,
            totalSkipped,
            accuracyPercent: accuracy,
            masteryPercent: Math.min(100, mastery),
            lastPracticedAt: attempt.attemptedAt,
            revisionDue: !attempt.isCorrect || accuracy < 75
        };

        this.save();
        return attempt;
    }

    getGateTopicProgress(topicId) {
        const gate = this.getGateState();
        return gate.topicProgress?.[topicId] || null;
    }

    getGateCustomPyqs() {
        const gate = this.getGateState();
        return Array.isArray(gate.customPyqs) ? gate.customPyqs : [];
    }

    addGateCustomPyq(pyq) {
        const gate = this.getGateState();
        if (!gate.customPyqs) gate.customPyqs = [];
        const existingIdx = gate.customPyqs.findIndex(q => q.id === pyq.id);
        if (existingIdx >= 0) {
            gate.customPyqs[existingIdx] = pyq;
        } else {
            gate.customPyqs.push(pyq);
        }
        this.save();
        return pyq;
    }

    importGatePyqs(pyqList) {
        if (!Array.isArray(pyqList)) return 0;
        let count = 0;
        pyqList.forEach(q => {
            if (q && q.id) {
                this.addGateCustomPyq(q);
                count++;
            }
        });
        return count;
    }

    // =========================================================================
    // SYLLABUS-FIRST GATE 2027 STUDY PLANNER PERSISTENCE METHODS
    // =========================================================================

    getGateCalendarDefault() {
        const cal = (typeof window !== 'undefined' ? (window.GATE_DEDICATED_CALENDAR_DEFAULT || window.GATE_DATA_2027?.calendar) : null) ||
                    (typeof global !== 'undefined' ? (global.GATE_DEDICATED_CALENDAR_DEFAULT || global.GATE_DATA_2027?.calendar) : null);
        if (Array.isArray(cal) && cal.length > 0) {
            return cal;
        }
        try {
            const gateData = require('../data/gate-data.js');
            return gateData.GATE_DEDICATED_CALENDAR_DEFAULT || gateData.calendar || [];
        } catch (e) {
            return [];
        }
    }

    getGatePlanItems() {
        const defaults = this.getGateCalendarDefault();
        const gate = this.getGateState();
        const overrides = gate.planItems || {};
        const topicStatuses = gate.topicStatuses || {};

        return defaults.map(def => {
            const date = def.date;
            const ov = overrides[date] || {};
            const topicOv = topicStatuses[def.topicId] || {};

            let tasks = def.tasks ? def.tasks.map(t => ({ ...t })) : [];
            if (Array.isArray(ov.tasks) && ov.tasks.length === tasks.length) {
                tasks = ov.tasks.map((t, idx) => ({
                    ...tasks[idx],
                    ...t
                }));
            }

            const status = ov.status || topicOv.status || def.status || 'NOT_STARTED';
            const userNotes = ov.userNotes !== undefined ? ov.userNotes : (topicOv.notes || def.userNotes || '');
            const plannedDate = ov.plannedDate || def.plannedDate || date;

            return {
                ...def,
                ...ov,
                tasks,
                status,
                userNotes,
                plannedDate,
                originalDate: def.originalDate || date
            };
        });
    }

    getGatePlanItemByDate(dateStr) {
        const items = this.getGatePlanItems();
        return items.find(item => item.date === dateStr || item.plannedDate === dateStr) || null;
    }

    updateGatePlanItem(dateStr, patch) {
        if (!dateStr || !patch) return null;
        const gate = this.getGateState();
        if (!gate.planItems) gate.planItems = {};
        
        const existing = gate.planItems[dateStr] || {};
        gate.planItems[dateStr] = {
            ...existing,
            ...patch,
            updatedAt: new Date().toISOString()
        };

        const defaultItem = this.getGateCalendarDefault().find(i => i.date === dateStr);
        const topicId = patch.topicId || existing.topicId || (defaultItem ? defaultItem.topicId : null);
        if (topicId && patch.status) {
            if (!gate.topicStatuses) gate.topicStatuses = {};
            gate.topicStatuses[topicId] = {
                ...(gate.topicStatuses[topicId] || {}),
                status: patch.status,
                updatedAt: new Date().toISOString()
            };
        }

        this.save(true);
        return this.getGatePlanItemByDate(dateStr);
    }

    toggleGateTask(dateStr, taskIndex, completed) {
        const item = this.getGatePlanItemByDate(dateStr);
        if (!item || !item.tasks || !item.tasks[taskIndex]) return null;

        const tasks = item.tasks.map((t, idx) => {
            if (idx === taskIndex) {
                return { ...t, completed: typeof completed === 'boolean' ? completed : !t.completed };
            }
            return { ...t };
        });

        const completedCount = tasks.filter(t => t.completed).length;
        let newStatus = item.status;
        if (completedCount === tasks.length && tasks.length > 0) {
            newStatus = 'COMPLETED';
        } else if (completedCount > 0) {
            newStatus = 'IN_PROGRESS';
        } else if (newStatus === 'COMPLETED' || newStatus === 'IN_PROGRESS') {
            newStatus = 'NOT_STARTED';
        }

        return this.updateGatePlanItem(dateStr, {
            tasks,
            status: newStatus
        });
    }

    setGateTopicStatus(topicId, status, notes) {
        if (!topicId) return null;
        const gate = this.getGateState();
        if (!gate.topicStatuses) gate.topicStatuses = {};

        const existing = gate.topicStatuses[topicId] || {};
        const updated = {
            ...existing,
            status: status || existing.status || 'NOT_STARTED',
            notes: notes !== undefined ? notes : (existing.notes || ''),
            updatedAt: new Date().toISOString()
        };
        gate.topicStatuses[topicId] = updated;

        const defaults = this.getGateCalendarDefault();
        defaults.filter(d => d.topicId === topicId).forEach(d => {
            if (!gate.planItems) gate.planItems = {};
            gate.planItems[d.date] = {
                ...(gate.planItems[d.date] || {}),
                status: updated.status,
                userNotes: updated.notes
            };
        });

        this.save(true);
        return updated;
    }

    getGateTopicStatus(topicId) {
        const gate = this.getGateState();
        return gate.topicStatuses?.[topicId] || null;
    }

    getGateSyllabusProgress() {
        const planItems = this.getGatePlanItems();
        let totalTopics = 81;
        let subjectsList = [];

        const gd = (typeof window !== 'undefined' && window.GATE_DATA_2027)
            ? window.GATE_DATA_2027
            : (typeof global !== 'undefined' && global.GATE_DATA_2027
                ? global.GATE_DATA_2027
                : null);

        if (gd) {
            subjectsList = gd.subjects || gd.GATE_SYLLABUS || [];
            totalTopics = (gd.topics || []).length || subjectsList.flatMap(s => s.topics || []).length || 81;
        } else {
            try {
                const gateData = require('../data/gate-data.js');
                subjectsList = gateData.subjects || gateData.GATE_SYLLABUS || [];
                totalTopics = (gateData.topics || []).length || subjectsList.flatMap(s => s.topics || []).length || 81;
            } catch (e) {
                totalTopics = 81;
            }
        }

        const gate = this.getGateState();
        const topicStatuses = gate.topicStatuses || {};

        let completedTopics = 0;
        let inProgressTopics = 0;
        let pyqPendingTopics = 0;
        let revisionRequiredTopics = 0;
        let highPriorityTotal = 0;
        let highPriorityCompleted = 0;

        const allTopics = [];
        subjectsList.forEach(s => {
            (s.topics || []).forEach(t => {
                allTopics.push({ ...t, subjectId: s.id });
            });
        });

        allTopics.forEach(top => {
            const st = topicStatuses[top.id]?.status || 'NOT_STARTED';
            const isHigh = top.importance === 'HIGH' || top.importance === 'HIGH-MEDIUM';
            if (isHigh) highPriorityTotal++;

            if (st === 'COMPLETED') {
                completedTopics++;
                if (isHigh) highPriorityCompleted++;
            } else if (st === 'IN_PROGRESS' || st === 'STUDY_COMPLETE') {
                inProgressTopics++;
            } else if (st === 'PYQ_PENDING') {
                pyqPendingTopics++;
            } else if (st === 'REVISION_REQUIRED') {
                revisionRequiredTopics++;
            }
        });

        const totalCalendarDays = planItems.length || 123;
        const completedCalendarDays = planItems.filter(p => p.status === 'COMPLETED').length;

        let completedSubjects = 0;
        subjectsList.forEach(s => {
            const subjTopics = s.topics || [];
            if (subjTopics.length > 0 && subjTopics.every(t => (topicStatuses[t.id]?.status === 'COMPLETED'))) {
                completedSubjects++;
            }
        });

        const overallProgressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        return {
            totalTopics,
            completedTopics,
            inProgressTopics,
            pyqPendingTopics,
            revisionRequiredTopics,
            totalSubjects: subjectsList.length || 11,
            completedSubjects,
            totalCalendarDays,
            completedCalendarDays,
            highPriorityTotal,
            highPriorityCompleted,
            overallProgressPct
        };
    }

    resetToDefault() {
        this.memoryState = {
            days: {},
            dsa: {},
            distractions: [],
            internships: [],
            placement: { achieved: false, placedDate: null, company: '', role: '', packageVal: '', note: '' },
            settings: {
                dsaDailyTarget: 3,
                morningDsaEnabled: true,
                autoCarryForward: true,
                notificationsEnabled: false,
                notifyDsa: true,
                notifyDev: true,
                notifyAiPlan: true,
                notifyCreatine: true
            },
            aiProfile: {
                preferredStudyWindows: ['06:45-08:15', '23:00-01:30'],
                averageSessionDuration: 0,
                subjectPerformance: {},
                completionPatterns: {},
                weakTopics: [],
                strongTopics: [],
                postponedTasks: [],
                recentTestPerformance: {},
                studyConsistency: {},
                currentGoals: ['Striver A2Z DSA Mastery', 'Full-Stack Development', 'Top Tier PBC Placement']
            },
            aiChatHistory: [],
            aiActivityLog: [],
            aiDailyPlans: {},
            studySessions: [],
            activeStudySession: null,
            placementHub: {
                roadmaps: {},
                resources: {},
                notes: {},
                bookmarks: [],
                questionPerformance: {},
                systemDesignInterviews: [],
                weeklyTests: [],
                weakAreas: []
            },
            development: {
                topics: {},
                videos: {},
                tasks: {},
                questions: {},
                notes: [],
                projects: {},
                activeTech: 'html',
                activeTab: 'overview'
            },
            mistakes: [],
            gym: {
                isConfigured: false,
                settings: { trackRPE: true, trackRestTime: true, trackWarmupSets: false, trackCardio: false, trackBodyMeasurements: false, trackPRs: true },
                schedule: {},
                sessions: [],
                activeSession: null,
                measurements: [],
                customExercises: []
            },
            gate: {
                planItems: {},
                topicStatuses: {},
                attempts: {},
                topicProgress: {},
                subjectMastery: {},
                customPyqs: []
            }
        };
        this.initDefaultGymSplit(true);
        if (typeof TaskEngine !== 'undefined' && TaskEngine.syncScheduleToAllCalendarDays) {
            TaskEngine.syncScheduleToAllCalendarDays();
        }
        this.save(true);
    }

    loadFromCloud(cloudData) {
        if (!cloudData) return;

        // If SyncEngine is loaded, use its canonical LWW non-destructive reconciliation
        if (typeof SyncEngine !== 'undefined' && typeof SyncEngine.reconcile === 'function') {
            this.memoryState = SyncEngine.reconcile(cloudData, this.memoryState);
            if (typeof TaskEngine !== 'undefined' && TaskEngine.invalidateStatsCache) {
                TaskEngine.invalidateStatsCache();
            }
            this.save(true);
            return;
        }

        // 1. Striver DSA Progress
        if (Array.isArray(cloudData.dsa) && cloudData.dsa.length > 0) {
            this.memoryState.dsa = this.memoryState.dsa || {};
            cloudData.dsa.forEach(item => {
                this.memoryState.dsa[item.problem_id] = {
                    status: item.status,
                    notes: item.notes || '',
                    solvedDate: item.solved_at || null
                };
            });
        }

        // 2. Full-Stack Development Progress
        if (Array.isArray(cloudData.development)) {
            cloudData.development.forEach(item => {
                const cat = item.category;
                if (!this.memoryState.development[cat]) this.memoryState.development[cat] = {};
                this.memoryState.development[cat][item.item_id] = {
                    status: item.status,
                    notes: item.notes || '',
                    repoLink: item.repo_link || '',
                    liveLink: item.live_link || '',
                    solvedAt: item.solved_at || null
                };
            });
        }

        // 3. Mistakes
        if (Array.isArray(cloudData.mistakes) && cloudData.mistakes.length > 0) {
            this.memoryState.mistakes = this.memoryState.mistakes || [];
            cloudData.mistakes.forEach(m => {
                const idx = this.memoryState.mistakes.findIndex(lm => lm.id === m.id);
                const mObj = {
                    id: m.id,
                    question: m.question,
                    subject: m.subject,
                    topic: m.topic || '',
                    source: m.source || '',
                    date: m.date,
                    userAnswer: m.user_answer || '',
                    correctAnswer: m.correct_answer || '',
                    explanation: m.explanation || '',
                    mistakeType: m.mistake_type || '',
                    personalNote: m.personal_note || '',
                    revisitDate: m.revisit_date || null,
                    repeatCount: m.repeat_count || 1,
                    resolved: !!m.resolved,
                    createdAt: m.created_at,
                    updatedAt: m.updated_at
                };
                if (idx >= 0) {
                    this.memoryState.mistakes[idx] = mObj;
                } else {
                    this.memoryState.mistakes.push(mObj);
                }
            });
        }

        // 4. Study Tasks / Calendar Days
        if (Array.isArray(cloudData.tasks) && cloudData.tasks.length > 0) {
            const touchedDates = new Set();
            cloudData.tasks.forEach(t => {
                const dStr = t.date;
                touchedDates.add(dStr);
                if (!this.memoryState.days[dStr]) {
                    this.memoryState.days[dStr] = { tasks: [], status: 'PLANNED', generated: true };
                }
                const existingIdx = this.memoryState.days[dStr].tasks.findIndex(x => x.id === t.task_id);
                const taskObj = {
                    id: t.task_id,
                    title: t.title,
                    category: t.category,
                    startTime: t.start_time,
                    endTime: t.end_time,
                    status: t.status,
                    isStudy: !!t.is_study,
                    notes: t.notes || '',
                    crossesMidnight: !!t.crosses_midnight,
                    rescheduledTo: t.rescheduled_to || null,
                    history: t.history || [],
                    interruptReason: t.interrupt_reason || null,
                    isBlock: !!t.is_block,
                    dsaProblemId: t.dsa_problem_id || null,
                    metadata: t.metadata || {}
                };
                if (existingIdx >= 0) {
                    this.memoryState.days[dStr].tasks[existingIdx] = taskObj;
                } else {
                    this.memoryState.days[dStr].tasks.push(taskObj);
                }
                this.memoryState.days[dStr].generated = true;
            });

            // Reconstruct deterministic calendar day statuses
            if (typeof TaskEngine !== 'undefined' && TaskEngine.recalculateDayStatus) {
                touchedDates.forEach(dStr => TaskEngine.recalculateDayStatus(dStr));
            }
        }

        // 5. Study Sessions
        if (Array.isArray(cloudData.studySessions) && cloudData.studySessions.length > 0) {
            this.memoryState.studySessions = this.memoryState.studySessions || [];
            cloudData.studySessions.forEach(s => {
                const idx = this.memoryState.studySessions.findIndex(ls => ls.id === s.id);
                const sObj = {
                    id: s.id,
                    date: s.date,
                    subject: s.subject,
                    topic: s.topic || '',
                    activeSeconds: s.active_seconds || 0,
                    breakSeconds: s.break_seconds || 0,
                    cameraEnabled: !!s.camera_enabled,
                    presenceRate: s.presence_rate ?? 100,
                    aiInsight: s.ai_insight || '',
                    startTime: s.start_time || '',
                    endTime: s.end_time || '',
                    createdAt: s.created_at
                };
                if (idx >= 0) {
                    this.memoryState.studySessions[idx] = sObj;
                } else {
                    this.memoryState.studySessions.push(sObj);
                }
            });
        }

        // 6. Workout Plan
        if (cloudData.workoutPlan && cloudData.workoutPlan.schedule) {
            this.memoryState.gym.schedule = cloudData.workoutPlan.schedule;
            this.memoryState.gym.settings = { ...this.memoryState.gym.settings, ...(cloudData.workoutPlan.settings || {}) };
            this.memoryState.gym.isConfigured = true;
        }

        // 7. Workout Sessions
        if (Array.isArray(cloudData.workoutSessions) && cloudData.workoutSessions.length > 0) {
            this.memoryState.gym.sessions = this.memoryState.gym.sessions || [];
            cloudData.workoutSessions.forEach(ws => {
                const idx = this.memoryState.gym.sessions.findIndex(ls => ls.id === ws.id);
                const existing = idx >= 0 ? this.memoryState.gym.sessions[idx] : null;
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

                const rawSets = Number(ws.total_sets ?? ws.totalSets ?? 0) || 0;
                const totalSets = rawSets > 0 ? rawSets : calcSets;
                const rawVol = Number(ws.total_volume_kg ?? ws.totalVolumeKg ?? 0) || 0;
                const totalVolumeKg = rawVol > 0 ? Math.round(rawVol) : Math.round(calcVolume);
                const rawReps = Number(ws.total_reps ?? ws.totalReps ?? 0) || 0;
                const totalReps = rawReps > 0 ? rawReps : calcReps;
                const durMin = Number(ws.duration_minutes ?? ws.durationMinutes ?? ws.duration ?? 0) || 0;
                const routineName = (ws.workout_type || ws.workoutType || ws.routineName || 'Custom Workout').trim();

                const wsObj = {
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
                if (idx >= 0) {
                    this.memoryState.gym.sessions[idx] = wsObj;
                } else {
                    this.memoryState.gym.sessions.push(wsObj);
                }
            });
        }

        // 8. Placement Hub Data
        if (cloudData.placementHub) {
            this.memoryState.placementHub = {
                ...this.memoryState.placementHub,
                roadmaps: cloudData.placementHub.roadmaps || {},
                resources: cloudData.placementHub.resources || {},
                notes: cloudData.placementHub.notes || [],
                bookmarks: cloudData.placementHub.bookmarks || [],
                questionPerformance: cloudData.placementHub.question_performance || {},
                systemDesignInterviews: cloudData.placementHub.system_design_interviews || [],
                weeklyTests: cloudData.placementHub.weekly_tests || [],
                weakAreas: cloudData.placementHub.weak_areas || []
            };
        }

        // 9. Internships
        if (Array.isArray(cloudData.internships) && cloudData.internships.length > 0) {
            this.memoryState.internships = this.memoryState.internships || [];
            cloudData.internships.forEach(i => {
                const idx = this.memoryState.internships.findIndex(li => li.id === i.id);
                const iObj = {
                    id: i.id,
                    company: i.company,
                    role: i.role,
                    dateApplied: i.date_applied,
                    status: i.status,
                    link: i.link,
                    notes: i.notes
                };
                if (idx >= 0) {
                    this.memoryState.internships[idx] = iObj;
                } else {
                    this.memoryState.internships.push(iObj);
                }
            });
        }

        // 10. GATE 2027 Attempts & Topic Progress
        if (cloudData.gateAttempts && Array.isArray(cloudData.gateAttempts)) {
            const gate = this.getGateState();
            cloudData.gateAttempts.forEach(att => {
                const id = att.id || `gate_att_${att.pyq_id}_${att.attempted_at}`;
                gate.attempts[id] = {
                    id,
                    userId: att.user_id || att.userId,
                    pyqId: att.pyq_id || att.pyqId,
                    subjectId: att.subject_id || att.subjectId,
                    topicId: att.topic_id || att.topicId,
                    year: att.year,
                    attemptedAt: att.attempted_at || att.attemptedAt,
                    status: att.status,
                    isCorrect: !!(att.is_correct ?? att.isCorrect),
                    timeTakenSeconds: Number(att.time_taken_seconds ?? att.timeTakenSeconds ?? 0),
                    confidence: att.confidence || 'MEDIUM',
                    mistakeType: att.mistake_type || att.mistakeType,
                    notes: att.notes || '',
                    revisionDueAt: att.revision_due_at || att.revisionDueAt,
                    createdAt: att.created_at || att.createdAt,
                    updatedAt: att.updated_at || att.updatedAt
                };
            });
        }
        if (cloudData.gateTopicProgress && Array.isArray(cloudData.gateTopicProgress)) {
            const gate = this.getGateState();
            cloudData.gateTopicProgress.forEach(tp => {
                const topId = tp.topic_id || tp.topicId;
                if (topId) {
                    gate.topicProgress[topId] = {
                        subjectId: tp.subject_id || tp.subjectId,
                        topicId: topId,
                        totalAttempted: Number(tp.total_attempted ?? tp.totalAttempted ?? 0),
                        totalCorrect: Number(tp.total_correct ?? tp.totalCorrect ?? 0),
                        totalWrong: Number(tp.total_wrong ?? tp.totalWrong ?? 0),
                        totalSkipped: Number(tp.total_skipped ?? tp.totalSkipped ?? 0),
                        accuracyPercent: Number(tp.accuracy_percent ?? tp.accuracyPercent ?? 0),
                        masteryPercent: Number(tp.mastery_percent ?? tp.masteryPercent ?? 0),
                        lastPracticedAt: tp.last_practiced_at || tp.lastPracticedAt,
                        revisionDue: !!(tp.revision_due ?? tp.revisionDue)
                    };
                }
            });
        }

        if (typeof TaskEngine !== 'undefined' && TaskEngine.invalidateStatsCache) {
            TaskEngine.invalidateStatsCache();
        }
        this.save(true);
    }
}

// Global singleton instance
const Store = new StorageManager();

if (typeof window !== 'undefined') {
    window.Store = Store;
}
if (typeof module !== 'undefined') {
    module.exports = { Store };
}
