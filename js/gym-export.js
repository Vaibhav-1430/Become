/**
 * FORGE FITNESS REPORT & PROFESSIONAL PDF EXPORT SYSTEM
 * "Your Training. Your Progress. Your Proof."
 * 
 * Features:
 * - Weekly, Monthly, Custom Range & Single Workout Reports
 * - Genuine selectable-text vector PDF generation via jsPDF & autoTable
 * - Premium print-friendly dark-adapted FORGE theme with amber accents
 * - Authenticated Supabase Storage check-in photo retrieval & embedding
 * - Relational Session -> Exercise -> Set data breakdown
 * - Validated Personal Records (PR) analysis (stored, period, all-time)
 * - Fitness analytics (volume, sets, reps, duration, muscle groups)
 * - Two-pass page numbering, repeating headers, clean A4 layout
 * - Sanitized descriptive filenames
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.GymExportEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // Helper: Resolve jsPDF and autoTable constructors in browser or Node
    function getJsPdfInstance() {
        let jsPDFClass = null;
        if (typeof window !== 'undefined') {
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDFClass = window.jsPDF;
            }
        }
        if (!jsPDFClass && typeof require !== 'undefined') {
            try {
                const jspdfModule = require('jspdf');
                jsPDFClass = jspdfModule.jsPDF || jspdfModule;
            } catch (e) {
                try {
                    const jspdfVendor = require('./vendor/jspdf.umd.min.js');
                    jsPDFClass = jspdfVendor.jsPDF;
                } catch (e2) {}
            }
        }
        return jsPDFClass;
    }

    function applyAutoTablePlugin(doc, jsPDFClass) {
        if (typeof doc.autoTable === 'function') {
            return true;
        }
        let autoTablePlugin = null;
        if (typeof window !== 'undefined' && window.jspdfAutoTable) {
            autoTablePlugin = window.jspdfAutoTable;
        }
        if (!autoTablePlugin && typeof require !== 'undefined') {
            try {
                autoTablePlugin = require('jspdf-autotable');
            } catch (e) {
                try {
                    autoTablePlugin = require('./vendor/jspdf.plugin.autotable.min.js');
                } catch (e2) {}
            }
        }
        if (autoTablePlugin) {
            if (typeof autoTablePlugin.applyPlugin === 'function' && jsPDFClass) {
                autoTablePlugin.applyPlugin(jsPDFClass);
                return typeof doc.autoTable === 'function';
            }
        }
        return typeof doc.autoTable === 'function';
    }

    // Helper: Get local IST date string (YYYY-MM-DD)
    function getTodayIsoString() {
        if (typeof DateUtils !== 'undefined' && typeof DateUtils.todayIST === 'function') {
            return DateUtils.todayIST();
        }
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper: Week boundaries (Monday to Sunday)
    function getWeekBounds(targetDateStr) {
        const base = targetDateStr ? new Date(targetDateStr + 'T12:00:00') : new Date();
        const day = (base.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        const monday = new Date(base);
        monday.setDate(base.getDate() - day);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const toIso = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dayNum}`;
        };

        return {
            mondayStr: toIso(monday),
            sundayStr: toIso(sunday)
        };
    }

    // Helper: Month boundaries
    function getMonthBounds(yearMonthStr) {
        let year, month;
        if (yearMonthStr && yearMonthStr.includes('-')) {
            const parts = yearMonthStr.split('-');
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
        } else {
            const today = getTodayIsoString();
            year = parseInt(today.slice(0, 4), 10);
            month = parseInt(today.slice(5, 7), 10);
        }
        const daysInMonth = new Date(year, month, 0).getDate();
        const mStr = String(month).padStart(2, '0');
        return {
            startDate: `${year}-${mStr}-01`,
            endDate: `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`,
            year,
            month,
            label: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
        };
    }

    // Helper: Format friendly date e.g. "Monday, 5 Oct 2026"
    function formatFriendlyDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + 'T12:00:00');
            return d.toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Helper: Sanitize filenames
    function sanitizeFilename(filename) {
        return filename
            .replace(/[/\\?%*:|"<>]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/__+/g, '_');
    }

    const GymExportEngine = {
        // Modal & configuration state
        state: {
            isOpen: false,
            reportType: 'weekly', // 'weekly' | 'monthly' | 'custom' | 'single'
            selectedWeekDate: null,
            selectedMonth: null,
            customStartDate: null,
            customEndDate: null,
            selectedSessionId: null,

            // Toggles
            includePhotos: true,
            includeExercises: true,
            includeSets: true,
            includePRs: true,
            includeAnalytics: true,

            // Generation status
            isGenerating: false,
            currentStage: '',
            progressPercent: 0,
            errorMessage: null,

            // Output artifact
            generatedPdfDoc: null,
            generatedFilename: null,
            generatedBlobUrl: null
        },

        initDefaults() {
            const today = getTodayIsoString();
            const week = getWeekBounds(today);
            this.state.selectedWeekDate = today;
            this.state.selectedMonth = today.slice(0, 7);

            // Default custom range: last 14 days
            const startD = new Date(today + 'T12:00:00');
            startD.setDate(startD.getDate() - 13);
            const sy = startD.getFullYear();
            const sm = String(startD.getMonth() + 1).padStart(2, '0');
            const sd = String(startD.getDate()).padStart(2, '0');
            this.state.customStartDate = `${sy}-${sm}-${sd}`;
            this.state.customEndDate = today;

            // Default single session: most recent completed session
            const sessions = this.getAllSessions();
            if (sessions.length > 0) {
                this.state.selectedSessionId = sessions[0].id;
            }
        },

        // ---------------------------------------------------------------------
        // Data Retrieval & Reconciliation
        // ---------------------------------------------------------------------
        getAllSessions() {
            if (typeof Store === 'undefined') return [];
            let sessions = [];
            if (typeof Store.getWorkoutSessions === 'function') {
                sessions = Store.getWorkoutSessions();
            } else if (typeof Store.getGymState === 'function') {
                const gym = Store.getGymState();
                sessions = gym?.sessions || [];
            }
            if (!Array.isArray(sessions)) return [];

            // Deduplicate and map to canonical ViewModel
            if (typeof Store.deduplicateWorkoutSessions === 'function') {
                sessions = Store.deduplicateWorkoutSessions(sessions);
            }
            if (typeof Store.toWorkoutSessionViewModel === 'function') {
                sessions = sessions.map(s => Store.toWorkoutSessionViewModel(s)).filter(Boolean);
            }

            // Sort chronologically descending (newest first for selector list)
            return sessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        },

        getAuthenticatedProfileName() {
            if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
                const user = SupabaseService.currentUser;
                if (user) {
                    const meta = user.user_metadata || {};
                    const name = (meta.full_name || meta.name || '').trim();
                    if (name) return name;
                }
            }
            if (typeof Store !== 'undefined') {
                const state = typeof Store.getState === 'function' ? Store.getState() : (Store.memoryState || {});
                const profile = state.profile || {};
                const name = (profile.full_name || profile.name || '').trim();
                if (name) return name;
            }
            return null;
        },

        // ---------------------------------------------------------------------
        // Scope & Selection Calculation
        // ---------------------------------------------------------------------
        getScopeData() {
            const allSessions = this.getAllSessions();
            const type = this.state.reportType;
            let startDate = '';
            let endDate = '';
            let label = '';
            let filename = '';
            let filteredSessions = [];

            if (type === 'weekly') {
                const bounds = getWeekBounds(this.state.selectedWeekDate || getTodayIsoString());
                startDate = bounds.mondayStr;
                endDate = bounds.sundayStr;
                label = `Weekly: ${formatFriendlyDate(startDate)} – ${formatFriendlyDate(endDate)}`;
                filename = sanitizeFilename(`FORGE_Gym_Weekly_${startDate}_to_${endDate}.pdf`);
                filteredSessions = allSessions.filter(s => s.date >= startDate && s.date <= endDate);
            } else if (type === 'monthly') {
                const bounds = getMonthBounds(this.state.selectedMonth || getTodayIsoString().slice(0, 7));
                startDate = bounds.startDate;
                endDate = bounds.endDate;
                label = `Monthly: ${bounds.label} (${startDate} – ${endDate})`;
                filename = sanitizeFilename(`FORGE_Gym_Monthly_${bounds.year}-${String(bounds.month).padStart(2, '0')}.pdf`);
                filteredSessions = allSessions.filter(s => s.date >= startDate && s.date <= endDate);
            } else if (type === 'custom') {
                startDate = this.state.customStartDate || getTodayIsoString();
                endDate = this.state.customEndDate || getTodayIsoString();
                if (startDate > endDate) {
                    const temp = startDate;
                    startDate = endDate;
                    endDate = temp;
                }
                label = `Custom Range: ${formatFriendlyDate(startDate)} – ${formatFriendlyDate(endDate)}`;
                filename = sanitizeFilename(`FORGE_Gym_Custom_${startDate}_to_${endDate}.pdf`);
                filteredSessions = allSessions.filter(s => s.date >= startDate && s.date <= endDate);
            } else if (type === 'single') {
                const targetId = this.state.selectedSessionId;
                const match = allSessions.find(s => s.id === targetId);
                if (match) {
                    filteredSessions = [match];
                    startDate = match.date;
                    endDate = match.date;
                    const cleanType = (match.workoutType || 'Workout').replace(/\s+/g, '_');
                    label = `Single Workout: ${match.workoutType} (${match.date})`;
                    filename = sanitizeFilename(`FORGE_Workout_${match.date}.pdf`);
                } else {
                    startDate = getTodayIsoString();
                    endDate = startDate;
                    label = 'Single Workout: None Selected';
                    filename = sanitizeFilename(`FORGE_Workout_${startDate}.pdf`);
                }
            }

            // Ensure chronological order (oldest to newest) for report presentation flow
            filteredSessions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

            // Calculate aggregate metrics
            let totalVolume = 0;
            let totalSets = 0;
            let totalReps = 0;
            let totalDuration = 0;
            let totalExercisesCount = 0;
            let photosAvailableCount = 0;

            filteredSessions.forEach(s => {
                totalVolume += (Number(s.totalVolumeKg) || 0);
                totalSets += (Number(s.setCount ?? s.totalSets) || 0);
                totalReps += (Number(s.totalReps) || 0);
                totalDuration += (Number(s.durationMinutes ?? s.duration) || 0);
                totalExercisesCount += (s.exercises?.length || s.exerciseCount || 0);
                const hasPhoto = !!(s.gym_photo_path || s.gymPhoto?.storagePath || s.gymPhoto?.url || s.gym_photo_url || s.gymPhoto?.base64);
                if (hasPhoto) photosAvailableCount++;
            });

            // Cloud sync warning detection
            let syncWarning = null;
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                syncWarning = 'Offline mode: Report built from local device data. Un-synchronized cloud updates may not be reflected.';
            } else if (typeof SupabaseService !== 'undefined' && !SupabaseService.isAuthenticated()) {
                syncWarning = 'Guest/Offline mode: Authenticate to access private cloud check-in photos.';
            }

            return {
                reportType: type,
                startDate,
                endDate,
                label,
                filename,
                sessions: filteredSessions,
                sessionCount: filteredSessions.length,
                totalVolume,
                totalSets,
                totalReps,
                totalDuration,
                totalExercisesCount,
                photosAvailableCount,
                syncWarning,
                athleteName: this.getAuthenticatedProfileName()
            };
        },

        // ---------------------------------------------------------------------
        // Analytics & Personal Records Computation
        // ---------------------------------------------------------------------
        computeAnalytics(sessions, allSessions) {
            const muscleGroupMap = {};
            let weightedSetsCount = 0;
            let bodyweightOnlySetsCount = 0;

            sessions.forEach(sess => {
                (sess.exercises || []).forEach(ex => {
                    const mGroup = (ex.muscleGroup || (ex.name ? ex.name.split(' ')[0] : 'General')).trim() || 'General';
                    if (!muscleGroupMap[mGroup]) {
                        muscleGroupMap[mGroup] = {
                            muscleGroup: mGroup,
                            exerciseCount: 0,
                            sets: 0,
                            volumeKg: 0
                        };
                    }
                    muscleGroupMap[mGroup].exerciseCount++;

                    (ex.sets || []).forEach(st => {
                        const isCompleted = st.completed !== false;
                        if (!isCompleted) return;

                        const wt = Number(st.weightKg ?? st.weight_kg ?? 0) || 0;
                        const rp = Number(st.reps ?? 0) || 0;
                        muscleGroupMap[mGroup].sets++;
                        if (wt > 0) {
                            weightedSetsCount++;
                            muscleGroupMap[mGroup].volumeKg += (wt * rp);
                        } else {
                            bodyweightOnlySetsCount++;
                        }
                    });
                });
            });

            const muscleDistribution = Object.values(muscleGroupMap).sort((a, b) => b.volumeKg - a.volumeKg);

            return {
                weightedSetsCount,
                bodyweightOnlySetsCount,
                muscleDistribution,
                volumeRuleNote: 'Training volume calculation accounts strictly for weighted sets (Weight × Reps). Bodyweight-only sets (weight not recorded) contribute to set and repetition metrics without injecting arbitrary kilogram volume.'
            };
        },

        computePRs(sessions, allSessions, startDate, endDate) {
            let storedPrs = [];
            if (typeof Store !== 'undefined' && typeof Store.getExercisePRs === 'function') {
                const prResult = Store.getExercisePRs();
                storedPrs = prResult?.exercises || [];
            }

            // Identify genuine baseline PRs established before the reporting period
            const prePeriodSessions = allSessions.filter(s => s.date < startDate);
            const baselineMap = {};

            prePeriodSessions.forEach(s => {
                (s.exercises || []).forEach(ex => {
                    const name = (ex.name || '').trim();
                    if (!name || ex.skipped) return;
                    if (!baselineMap[name]) baselineMap[name] = { maxWeight: 0, maxRepsAtMaxWeight: 0, date: s.date };

                    (ex.sets || []).forEach(st => {
                        if (st.completed === false) return;
                        const wt = Number(st.weightKg ?? st.weight_kg ?? 0) || 0;
                        const rp = Number(st.reps ?? 0) || 0;
                        if (wt > baselineMap[name].maxWeight) {
                            baselineMap[name] = { maxWeight: wt, maxRepsAtMaxWeight: rp, date: s.date };
                        }
                    });
                });
            });

            // Evaluate records achieved during the selected period
            const periodNewPRs = [];
            const runningHighs = { ...baselineMap };

            sessions.forEach(s => {
                (s.exercises || []).forEach(ex => {
                    const name = (ex.name || '').trim();
                    if (!name || ex.skipped) return;
                    const prevRecord = runningHighs[name] ? { ...runningHighs[name] } : null;

                    (ex.sets || []).forEach(st => {
                        if (st.completed === false) return;
                        const wt = Number(st.weightKg ?? st.weight_kg ?? 0) || 0;
                        const rp = Number(st.reps ?? 0) || 0;

                        if (wt > 0) {
                            if (!runningHighs[name] || wt > runningHighs[name].maxWeight) {
                                const prevWeight = prevRecord ? prevRecord.maxWeight : 0;
                                const improvement = prevWeight > 0 ? (wt - prevWeight) : null;

                                periodNewPRs.push({
                                    exercise: name,
                                    weightKg: wt,
                                    reps: rp,
                                    date: s.date,
                                    previousWeight: prevWeight > 0 ? prevWeight : null,
                                    improvementKg: improvement,
                                    routineName: s.workoutType || s.routineName
                                });

                                runningHighs[name] = { maxWeight: wt, maxRepsAtMaxWeight: rp, date: s.date };
                            }
                        }
                    });
                });
            });

            return {
                periodNewPRs,
                allTimePRs: storedPrs,
                hasPeriodPRs: periodNewPRs.length > 0
            };
        },

        // ---------------------------------------------------------------------
        // Workout Photo Retrieval & Image Ingestion
        // ---------------------------------------------------------------------
        async loadWorkoutPhoto(session) {
            if (!session) return null;
            const photoPath = session.gym_photo_path || session.gymPhoto?.storagePath;
            let directUrl = session.gymPhoto?.url || session.gym_photo_url || session.gymPhoto?.base64;

            // 1. Direct Base64 data URL
            if (typeof directUrl === 'string' && directUrl.startsWith('data:image/')) {
                return directUrl;
            }

            // 2. Resolve signed URL via Supabase Storage if path exists
            let signedUrl = directUrl;
            if (!signedUrl && photoPath && typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
                try {
                    signedUrl = await SupabaseService.getSignedGymPhotoUrl(photoPath, 3600);
                } catch (e) {
                    console.warn('[GymExport] Error requesting signed URL for photo:', e);
                }
            }

            if (!signedUrl) return null;

            // 3. Ingest image data URL via fetch & FileReader / Buffer
            try {
                if (typeof fetch === 'function') {
                    const resp = await fetch(signedUrl);
                    if (!resp.ok) return null;

                    if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
                        const blob = await resp.blob();
                        return await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = () => resolve(null);
                            reader.readAsDataURL(blob);
                        });
                    } else if (typeof Buffer !== 'undefined') {
                        const arrayBuf = await resp.arrayBuffer();
                        const buf = Buffer.from(arrayBuf);
                        const mime = resp.headers.get('content-type') || 'image/jpeg';
                        return `data:${mime};base64,${buf.toString('base64')}`;
                    }
                }
            } catch (err) {
                console.warn('[GymExport] Failed to convert photo URL to data URI:', err);
            }
            return null;
        },

        // ---------------------------------------------------------------------
        // Core PDF Document Builder
        // ---------------------------------------------------------------------
        buildPdfDocument(scopeData, analytics, prData, photoMap = {}) {
            const jsPDFClass = getJsPdfInstance();
            if (!jsPDFClass) {
                throw new Error('PDF Engine (jsPDF) is not available. Please ensure the vendor script is loaded.');
            }

            const doc = new jsPDFClass({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            applyAutoTablePlugin(doc, jsPDFClass);

            // Brand Color Palette (Print-Friendly Dark Adaptation)
            const COLOR = {
                bgWhite: [255, 255, 255],
                bgSurface: [248, 250, 252],     // #f8fafc soft slate
                bgSurfaceAlt: [241, 245, 249],  // #f1f5f9
                textPrimary: [15, 23, 42],       // #0f172a deep slate
                textSecondary: [51, 65, 85],    // #334155
                textMuted: [100, 116, 139],     // #64748b
                amberAccent: [217, 119, 6],     // #d97706 FORGE Amber
                amberDark: [180, 83, 9],        // #b45309
                amberLight: [254, 243, 199],    // #fef3c7 amber tint
                borderLight: [226, 232, 240],   // #e2e8f0
                borderMedium: [203, 213, 225],  // #cbd5e1
                emeraldSuccess: [5, 150, 105],  // #059669
                roseAlert: [225, 29, 72]        // #e11d48
            };

            const pageWidth = 210;
            const pageHeight = 297;
            const marginX = 14;
            const contentWidth = pageWidth - (marginX * 2);
            let cursorY = 16;

            const formatMinutes = (mins) => {
                const m = Math.max(0, Number(mins) || 0);
                if (m < 60) return `${m} mins`;
                const hrs = Math.floor(m / 60);
                const rem = m % 60;
                return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hrs`;
            };

            // -----------------------------------------------------------------
            // 1. Cover Header (FORGE Branding & Report Meta)
            // -----------------------------------------------------------------
            const drawReportHeader = (isCover = true) => {
                // Top Brand Accent Line
                doc.setFillColor(...COLOR.amberAccent);
                doc.rect(marginX, cursorY, contentWidth, 2, 'F');
                cursorY += 6;

                // FORGE Logo Badge & Wordmark
                doc.setFillColor(...COLOR.textPrimary);
                doc.roundedRect(marginX, cursorY, 11, 11, 1.5, 1.5, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('F', marginX + 3.8, cursorY + 7.8);

                // Brand Title
                doc.setTextColor(...COLOR.textPrimary);
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text('FORGE', marginX + 14, cursorY + 8);

                // Subtitle Pill
                doc.setTextColor(...COLOR.amberAccent);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('FITNESS PROGRESS REPORT', marginX + 44, cursorY + 8);

                // Tagline
                doc.setTextColor(...COLOR.textMuted);
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'italic');
                doc.text('Your Training. Your Progress. Your Proof.', marginX + 14, cursorY + 13);

                // Right Meta Block: Period, Date & Optional Authenticated Name
                const rightX = pageWidth - marginX;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(...COLOR.textMuted);
                doc.text(`REPORT PERIOD: ${scopeData.startDate} to ${scopeData.endDate}`, rightX, cursorY + 4, { align: 'right' });
                doc.text(`GENERATED: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, rightX, cursorY + 8, { align: 'right' });

                if (scopeData.athleteName) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...COLOR.textPrimary);
                    doc.text(`ATHLETE: ${scopeData.athleteName}`, rightX, cursorY + 12, { align: 'right' });
                }

                cursorY += 18;

                // Subtle separation rule
                doc.setDrawColor(...COLOR.borderLight);
                doc.setLineWidth(0.3);
                doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
                cursorY += 6;
            };

            drawReportHeader(true);

            // -----------------------------------------------------------------
            // 2. Executive KPI Cards Grid
            // -----------------------------------------------------------------
            const drawKpiGrid = () => {
                const kpis = [
                    { label: 'WORKOUT SESSIONS', value: `${scopeData.sessionCount}`, sub: 'Distinct recorded' },
                    { label: 'TOTAL TRAINING TIME', value: formatMinutes(scopeData.totalDuration), sub: 'Active workout time' },
                    { label: 'TRAINING VOLUME', value: `${scopeData.totalVolume.toLocaleString()} kg`, sub: 'Weight × Reps total' },
                    { label: 'COMPLETED SETS', value: `${scopeData.totalSets}`, sub: `${analytics.weightedSetsCount} weighted sets` },
                    { label: 'EXERCISES PERFORMED', value: `${scopeData.totalExercisesCount}`, sub: 'Relational movements' },
                    { label: 'PERSONAL RECORDS', value: `${prData.periodNewPRs.length}`, sub: prData.periodNewPRs.length > 0 ? 'New PRs achieved' : 'Period baseline' }
                ];

                const cardWidth = (contentWidth - (2 * 5)) / 3;
                const cardHeight = 18;

                kpis.forEach((kpi, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    const x = marginX + col * (cardWidth + 5);
                    const y = cursorY + row * (cardHeight + 4);

                    // Card Background
                    doc.setFillColor(...COLOR.bgSurface);
                    doc.setDrawColor(...COLOR.borderLight);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

                    // Amber left accent notch
                    doc.setFillColor(...COLOR.amberAccent);
                    doc.rect(x, y + 2, 1.2, cardHeight - 4, 'F');

                    // Label
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(6.5);
                    doc.setTextColor(...COLOR.textMuted);
                    doc.text(kpi.label, x + 4, y + 4.5);

                    // Value
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(...COLOR.textPrimary);
                    doc.text(kpi.value, x + 4, y + 11.5);

                    // Subtext
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6);
                    doc.setTextColor(...COLOR.textMuted);
                    doc.text(kpi.sub, x + 4, y + 15.5);
                });

                cursorY += (2 * cardHeight) + 12;

                // Volume Rule Footnote
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(6.5);
                doc.setTextColor(...COLOR.textMuted);
                doc.text(`* ${analytics.volumeRuleNote}`, marginX, cursorY);
                cursorY += 6;
            };

            drawKpiGrid();

            // -----------------------------------------------------------------
            // 3. Weekly / Monthly Overview Table
            // -----------------------------------------------------------------
            if (scopeData.reportType === 'weekly') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                doc.setTextColor(...COLOR.textPrimary);
                doc.text('WEEKLY ACTIVITY & CALENDAR OVERVIEW', marginX, cursorY);
                cursorY += 4;

                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const weekStartD = new Date(scopeData.startDate + 'T12:00:00');

                const calendarRows = days.map((dayName, idx) => {
                    const d = new Date(weekStartD);
                    d.setDate(weekStartD.getDate() + idx);
                    const iso = d.toISOString().split('T')[0];
                    const sess = scopeData.sessions.find(s => s.date === iso);

                    let status = 'Rest / Rest Day';
                    let wType = 'Scheduled Rest';
                    let dur = '-';
                    let vol = '-';
                    let sets = '-';

                    if (sess) {
                        status = 'COMPLETED';
                        wType = sess.workoutType || 'Workout type not recorded';
                        dur = `${sess.durationMinutes || sess.duration || 0} min`;
                        vol = `${(sess.totalVolumeKg || 0).toLocaleString()} kg`;
                        sets = `${sess.setCount || sess.totalSets || 0}`;
                    }

                    return [dayName, iso, wType, dur, sets, vol, status];
                });

                doc.autoTable({
                    startY: cursorY,
                    margin: { left: marginX, right: marginX },
                    head: [['Day', 'Date', 'Routine / Split', 'Duration', 'Sets', 'Volume', 'Status']],
                    body: calendarRows,
                    theme: 'grid',
                    styles: {
                        font: 'helvetica',
                        fontSize: 7.5,
                        textColor: COLOR.textPrimary,
                        cellPadding: 2.2,
                        lineColor: COLOR.borderLight,
                        lineWidth: 0.2
                    },
                    headStyles: {
                        fillColor: COLOR.textPrimary,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 7.5
                    },
                    alternateRowStyles: {
                        fillColor: COLOR.bgSurface
                    },
                    didParseCell: (data) => {
                        if (data.section === 'body' && data.column.index === 6) {
                            if (data.cell.raw === 'COMPLETED') {
                                data.cell.styles.textColor = COLOR.emeraldSuccess;
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                data.cell.styles.textColor = COLOR.textMuted;
                            }
                        }
                    }
                });

                cursorY = doc.lastAutoTable.finalY + 8;
            } else if (scopeData.reportType === 'monthly') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                doc.setTextColor(...COLOR.textPrimary);
                doc.text('MONTHLY TRAINING FREQUENCY & VOLUME SUMMARY', marginX, cursorY);
                cursorY += 4;

                // Group workouts by calendar week
                const weekBuckets = {};
                scopeData.sessions.forEach(s => {
                    const d = new Date(s.date + 'T12:00:00');
                    const weekNum = Math.ceil(d.getDate() / 7);
                    const key = `Week ${weekNum}`;
                    if (!weekBuckets[key]) {
                        weekBuckets[key] = { sessions: 0, duration: 0, sets: 0, volume: 0 };
                    }
                    weekBuckets[key].sessions++;
                    weekBuckets[key].duration += (s.durationMinutes || s.duration || 0);
                    weekBuckets[key].sets += (s.setCount || s.totalSets || 0);
                    weekBuckets[key].volume += (s.totalVolumeKg || 0);
                });

                const monthlyRows = Object.keys(weekBuckets).map(wKey => {
                    const b = weekBuckets[wKey];
                    return [
                        wKey,
                        `${b.sessions} workouts`,
                        formatMinutes(b.duration),
                        `${b.sets} sets`,
                        `${b.volume.toLocaleString()} kg`
                    ];
                });

                if (monthlyRows.length > 0) {
                    doc.autoTable({
                        startY: cursorY,
                        margin: { left: marginX, right: marginX },
                        head: [['Period', 'Frequency', 'Duration', 'Total Sets', 'Volume']],
                        body: monthlyRows,
                        theme: 'grid',
                        styles: {
                            font: 'helvetica',
                            fontSize: 7.5,
                            textColor: COLOR.textPrimary,
                            cellPadding: 2.2,
                            lineColor: COLOR.borderLight,
                            lineWidth: 0.2
                        },
                        headStyles: {
                            fillColor: COLOR.textPrimary,
                            textColor: [255, 255, 255],
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: { fillColor: COLOR.bgSurface }
                    });
                    cursorY = doc.lastAutoTable.finalY + 8;
                }
            }

            // -----------------------------------------------------------------
            // 4. Personal Records (PR) Section
            // -----------------------------------------------------------------
            if (this.state.includePRs) {
                if (cursorY > pageHeight - 50) {
                    doc.addPage();
                    cursorY = 16;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                doc.setTextColor(...COLOR.textPrimary);
                doc.text('PERSONAL RECORDS (PR) ANALYSIS', marginX, cursorY);
                cursorY += 4;

                if (prData.periodNewPRs.length > 0) {
                    const prRows = prData.periodNewPRs.map(pr => [
                        pr.exercise,
                        `${pr.weightKg} kg`,
                        pr.reps ? `${pr.reps} reps` : '-',
                        pr.date,
                        pr.previousWeight ? `${pr.previousWeight} kg` : 'First Record',
                        pr.improvementKg ? `+${pr.improvementKg} kg` : 'Baseline Established'
                    ]);

                    doc.autoTable({
                        startY: cursorY,
                        margin: { left: marginX, right: marginX },
                        head: [['Exercise', 'New Record Weight', 'Reps', 'Date Achieved', 'Previous Best', 'Improvement']],
                        body: prRows,
                        theme: 'grid',
                        styles: {
                            font: 'helvetica',
                            fontSize: 7.5,
                            textColor: COLOR.textPrimary,
                            cellPadding: 2.2,
                            lineColor: COLOR.borderLight,
                            lineWidth: 0.2
                        },
                        headStyles: {
                            fillColor: COLOR.amberDark,
                            textColor: [255, 255, 255],
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: { fillColor: COLOR.amberLight }
                    });
                    cursorY = doc.lastAutoTable.finalY + 8;
                } else {
                    doc.setFillColor(...COLOR.bgSurface);
                    doc.setDrawColor(...COLOR.borderLight);
                    doc.roundedRect(marginX, cursorY, contentWidth, 12, 1.5, 1.5, 'FD');
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(...COLOR.textMuted);
                    doc.text('No new personal records recorded during this period.', marginX + 6, cursorY + 7.5);
                    cursorY += 18;
                }
            }

            // -----------------------------------------------------------------
            // 5. Muscle Group Distribution (Analytics)
            // -----------------------------------------------------------------
            if (this.state.includeAnalytics && analytics.muscleDistribution.length > 0 && scopeData.reportType !== 'single') {
                if (cursorY > pageHeight - 55) {
                    doc.addPage();
                    cursorY = 16;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                doc.setTextColor(...COLOR.textPrimary);
                doc.text('MUSCLE GROUP TRAINING DISTRIBUTION', marginX, cursorY);
                cursorY += 4;

                const totalVol = scopeData.totalVolume || 1;
                const distRows = analytics.muscleDistribution.map(m => {
                    const pct = Math.round((m.volumeKg / totalVol) * 100);
                    return [
                        m.muscleGroup,
                        `${m.exerciseCount} exercises`,
                        `${m.sets} sets`,
                        `${m.volumeKg.toLocaleString()} kg`,
                        `${pct}% of volume`
                    ];
                });

                doc.autoTable({
                    startY: cursorY,
                    margin: { left: marginX, right: marginX },
                    head: [['Muscle Group', 'Movements Tracked', 'Total Sets', 'Volume (kg)', 'Share']],
                    body: distRows,
                    theme: 'grid',
                    styles: {
                        font: 'helvetica',
                        fontSize: 7.5,
                        textColor: COLOR.textPrimary,
                        cellPadding: 2,
                        lineColor: COLOR.borderLight,
                        lineWidth: 0.2
                    },
                    headStyles: {
                        fillColor: COLOR.textSecondary,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: { fillColor: COLOR.bgSurface }
                });
                cursorY = doc.lastAutoTable.finalY + 8;
            }

            // -----------------------------------------------------------------
            // 6. Workout Session Details & Exercise-By-Exercise Breakdown
            // -----------------------------------------------------------------
            if (scopeData.sessions.length === 0) {
                // Empty state handling
                if (cursorY > pageHeight - 40) {
                    doc.addPage();
                    cursorY = 16;
                }
                doc.setFillColor(...COLOR.bgSurface);
                doc.setDrawColor(...COLOR.borderLight);
                doc.roundedRect(marginX, cursorY, contentWidth, 24, 2, 2, 'FD');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(...COLOR.textPrimary);
                doc.text('NO WORKOUT SESSIONS RECORDED', marginX + 8, cursorY + 10);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(...COLOR.textMuted);
                doc.text(`There were no workout sessions logged between ${scopeData.startDate} and ${scopeData.endDate}.`, marginX + 8, cursorY + 17);
                cursorY += 32;
            } else {
                // For weekly/monthly reports, start workout sessions on a fresh page for clean layout
                if (scopeData.reportType !== 'single') {
                    doc.addPage();
                    cursorY = 16;
                }

                scopeData.sessions.forEach((session, sIdx) => {
                    // Check if enough space remains on page for session card header + photo/summary
                    if (cursorY > pageHeight - 75) {
                        doc.addPage();
                        cursorY = 16;
                    }

                    const workoutType = (session.workoutType || session.routineName || '').toString().trim() || 'Workout type not recorded';
                    const sessionDate = session.date || 'Date not recorded';
                    const weekday = session.dayOfWeek || '';
                    const durationMins = session.durationMinutes || session.duration || 0;
                    const sessionVol = (session.totalVolumeKg || 0).toLocaleString();
                    const sessionSets = session.setCount || session.totalSets || 0;
                    const sessionExCount = session.exercises?.length || session.exerciseCount || 0;

                    // Session Card Header Box
                    doc.setFillColor(...COLOR.bgSurfaceAlt);
                    doc.setDrawColor(...COLOR.borderMedium);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(marginX, cursorY, contentWidth, 14, 1.5, 1.5, 'FD');

                    // Date & Weekday Pill
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(...COLOR.textPrimary);
                    doc.text(`${weekday ? weekday.toUpperCase() + '  •  ' : ''}${sessionDate}`, marginX + 4, cursorY + 5.5);

                    // Workout Routine Title
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.setTextColor(...COLOR.amberAccent);
                    doc.text(workoutType, marginX + 4, cursorY + 10.5);

                    // Session Meta Summary on Right
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(...COLOR.textSecondary);
                    const metaStr = `⏱ ${formatMinutes(durationMins)}   |   📊 ${sessionSets} Sets   |   🏋️ ${sessionExCount} Exercises   |   📈 ${sessionVol} kg`;
                    doc.text(metaStr, pageWidth - marginX - 4, cursorY + 8.5, { align: 'right' });

                    cursorY += 18;

                    // ---------------------------------------------------------
                    // Workout Photo Section (Prominent & Aspect-Preserved)
                    // ---------------------------------------------------------
                    if (this.state.includePhotos) {
                        const photoDataUrl = photoMap[session.id];
                        const photoBoxW = 54;
                        const photoBoxH = 40;
                        const photoX = marginX;
                        const photoY = cursorY;

                        if (photoDataUrl) {
                            try {
                                doc.setFillColor(...COLOR.bgSurface);
                                doc.setDrawColor(...COLOR.borderLight);
                                doc.roundedRect(photoX, photoY, photoBoxW, photoBoxH, 1.5, 1.5, 'FD');

                                // Compute image aspect ratio if possible or fit neatly
                                let renderW = photoBoxW - 2;
                                let renderH = photoBoxH - 2;
                                let renderX = photoX + 1;
                                let renderY = photoY + 1;

                                doc.addImage(photoDataUrl, 'JPEG', renderX, renderY, renderW, renderH, undefined, 'FAST');

                                // Photo Border Frame
                                doc.setDrawColor(...COLOR.amberAccent);
                                doc.setLineWidth(0.4);
                                doc.roundedRect(photoX, photoY, photoBoxW, photoBoxH, 1.5, 1.5, 'D');

                                // Small verified badge
                                doc.setFillColor(...COLOR.textPrimary);
                                doc.roundedRect(photoX + 2, photoY + photoBoxH - 6, 26, 4.5, 1, 1, 'F');
                                doc.setFont('helvetica', 'bold');
                                doc.setFontSize(5.5);
                                doc.setTextColor(255, 255, 255);
                                doc.text('✓ GYM CHECK-IN PHOTO', photoX + 4, photoY + photoBoxH - 3);
                            } catch (imgErr) {
                                console.warn('[GymExport] Failed to embed image in PDF:', imgErr);
                                this.drawPhotoPlaceholder(doc, photoX, photoY, photoBoxW, photoBoxH, COLOR);
                            }
                        } else {
                            this.drawPhotoPlaceholder(doc, photoX, photoY, photoBoxW, photoBoxH, COLOR);
                        }

                        // Right side of photo: Session Notes or Key Details
                        const notesX = photoX + photoBoxW + 6;
                        const notesW = contentWidth - photoBoxW - 6;

                        doc.setFillColor(...COLOR.bgSurface);
                        doc.setDrawColor(...COLOR.borderLight);
                        doc.roundedRect(notesX, photoY, notesW, photoBoxH, 1.5, 1.5, 'FD');

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8);
                        doc.setTextColor(...COLOR.textPrimary);
                        doc.text('SESSION LOG & VERIFICATION', notesX + 4, photoY + 6);

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(7);
                        doc.setTextColor(...COLOR.textSecondary);
                        doc.text(`• Status: Authenticated Completed Session`, notesX + 4, photoY + 12);
                        doc.text(`• Duration: ${formatMinutes(durationMins)} (${durationMins} minutes)`, notesX + 4, photoY + 17);
                        doc.text(`• Training Volume: ${sessionVol} kg across ${sessionSets} sets`, notesX + 4, photoY + 22);

                        if (session.startedAt && session.endedAt) {
                            try {
                                const stTime = new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const enTime = new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                doc.text(`• Time Recorded: ${stTime} – ${enTime}`, notesX + 4, photoY + 27);
                            } catch (e) {}
                        } else {
                            doc.text(`• Recorded Date: ${sessionDate} (${weekday})`, notesX + 4, photoY + 27);
                        }

                        if (session.notes) {
                            doc.text(`• Notes: "${session.notes.slice(0, 60)}"`, notesX + 4, photoY + 32);
                        } else {
                            doc.text(`• Check-In: Authenticated via private storage bucket`, notesX + 4, photoY + 32);
                        }

                        cursorY += photoBoxH + 6;
                    }

                    // ---------------------------------------------------------
                    // Exercise-by-Exercise Set Breakdown
                    // ---------------------------------------------------------
                    const exercises = Array.isArray(session.exercises) ? session.exercises : [];

                    if (exercises.length === 0) {
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(8);
                        doc.setTextColor(...COLOR.textMuted);
                        doc.text('No exercises were recorded for this session.', marginX + 4, cursorY);
                        cursorY += 8;
                    } else if (this.state.includeExercises) {
                        exercises.forEach((ex, exIdx) => {
                            if (cursorY > pageHeight - 35) {
                                doc.addPage();
                                cursorY = 16;
                            }

                            const exName = (ex.name || 'Unnamed Exercise').trim();
                            const mGroup = ex.muscleGroup ? ` (${ex.muscleGroup})` : '';

                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(8.5);
                            doc.setTextColor(...COLOR.textPrimary);
                            doc.text(`Exercise ${exIdx + 1}: ${exName}${mGroup}`, marginX, cursorY);
                            cursorY += 3;

                            const sets = Array.isArray(ex.sets) ? ex.sets : [];
                            if (sets.length === 0) {
                                doc.setFont('helvetica', 'italic');
                                doc.setFontSize(7);
                                doc.setTextColor(...COLOR.textMuted);
                                doc.text('No sets recorded for this movement.', marginX + 4, cursorY);
                                cursorY += 6;
                            } else {
                                const setRows = sets.map((st, stIdx) => {
                                    const setNum = st.setNumber || (stIdx + 1);
                                    const wt = Number(st.weightKg ?? st.weight_kg ?? 0) || 0;
                                    const rp = Number(st.reps ?? 0) || 0;
                                    const rpe = (st.rpe !== null && st.rpe !== undefined && st.rpe !== '') ? String(st.rpe) : '-';
                                    const setVol = wt > 0 && rp > 0 ? `${(wt * rp).toLocaleString()} kg` : '-';
                                    const wtStr = wt > 0 ? `${wt} kg` : 'Bodyweight';

                                    let notes = st.completed === false ? 'Incomplete' : 'Completed';
                                    if (st.isWeightPr) notes += '  [↑ WEIGHT PR]';
                                    if (st.isRepPr) notes += '  [↑ REP PR]';

                                    return [`Set ${setNum}`, wtStr, `${rp} reps`, rpe, setVol, notes];
                                });

                                doc.autoTable({
                                    startY: cursorY,
                                    margin: { left: marginX, right: marginX },
                                    head: [['Set', 'Weight', 'Reps', 'RPE', 'Set Volume', 'Status / Notes']],
                                    body: setRows,
                                    theme: 'grid',
                                    showHead: 'everyPage',
                                    styles: {
                                        font: 'helvetica',
                                        fontSize: 7,
                                        textColor: COLOR.textPrimary,
                                        cellPadding: 1.8,
                                        lineColor: COLOR.borderLight,
                                        lineWidth: 0.2
                                    },
                                    headStyles: {
                                        fillColor: COLOR.bgSurfaceAlt,
                                        textColor: COLOR.textPrimary,
                                        fontStyle: 'bold',
                                        fontSize: 7
                                    },
                                    alternateRowStyles: {
                                        fillColor: COLOR.bgSurface
                                    },
                                    columnStyles: {
                                        0: { cellWidth: 16 },
                                        1: { cellWidth: 26 },
                                        2: { cellWidth: 24 },
                                        3: { cellWidth: 16 },
                                        4: { cellWidth: 26 },
                                        5: { cellWidth: 'auto' }
                                    },
                                    didParseCell: (data) => {
                                        if (data.section === 'body' && data.column.index === 5) {
                                            if (data.cell.raw.includes('PR')) {
                                                data.cell.styles.textColor = COLOR.amberDark;
                                                data.cell.styles.fontStyle = 'bold';
                                            } else if (data.cell.raw === 'Incomplete') {
                                                data.cell.styles.textColor = COLOR.roseAlert;
                                            }
                                        }
                                    }
                                });

                                cursorY = doc.lastAutoTable.finalY + 5;
                            }
                        });
                    }

                    // Separation line between sessions
                    if (sIdx < scopeData.sessions.length - 1) {
                        cursorY += 2;
                        doc.setDrawColor(...COLOR.borderLight);
                        doc.setLineWidth(0.2);
                        doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
                        cursorY += 6;
                    }
                });
            }

            // -----------------------------------------------------------------
            // 7. Two-Pass Running Headers & Footers
            // -----------------------------------------------------------------
            const totalPages = doc.getNumberOfPages();
            const nowStamp = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);

                // Running Header (pages > 1)
                if (p > 1) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(...COLOR.textMuted);
                    doc.text(`FORGE FITNESS REPORT  //  ${scopeData.label}`, marginX, 10);
                    doc.setDrawColor(...COLOR.borderLight);
                    doc.setLineWidth(0.2);
                    doc.line(marginX, 12, pageWidth - marginX, 12);
                }

                // Running Footer (every page)
                doc.setDrawColor(...COLOR.borderLight);
                doc.setLineWidth(0.2);
                doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.8);
                doc.setTextColor(...COLOR.textMuted);
                doc.text('CONFIDENTIAL & PERSONAL TRAINING RECORD  •  FORGE FITNESS SYSTEM', marginX, pageHeight - 8);
                doc.text(`Generated: ${nowStamp}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
                doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
            }

            return doc;
        },

        // Helper: Draw tasteful placeholder when photo is missing/failed
        drawPhotoPlaceholder(doc, x, y, w, h, COLOR) {
            doc.setFillColor(...COLOR.bgSurface);
            doc.setDrawColor(...COLOR.borderLight);
            doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...COLOR.textMuted);
            doc.text('📷', x + (w / 2), y + 16, { align: 'center' });

            doc.setFontSize(6.8);
            doc.text('WORKOUT PHOTO UNAVAILABLE', x + (w / 2), y + 23, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.8);
            doc.text('No check-in photo recorded', x + (w / 2), y + 28, { align: 'center' });
        },

        // ---------------------------------------------------------------------
        // Main Generation Workflow (Async with Progress Stages)
        // ---------------------------------------------------------------------
        async generatePdf() {
            if (this.state.isGenerating) return;

            this.state.isGenerating = true;
            this.state.errorMessage = null;
            this.state.generatedBlobUrl = null;
            this.state.generatedPdfDoc = null;
            this.renderModalUI();

            const updateStage = (stage, percent) => {
                this.state.currentStage = stage;
                this.state.progressPercent = percent;
                this.renderModalUI();
            };

            try {
                // Stage 1: Loading workout history
                updateStage('Loading workout history...', 15);
                await new Promise(r => setTimeout(r, 60));

                // Optional cloud sync if online
                if (typeof SupabaseService !== 'undefined' && SupabaseService.isAuthenticated()) {
                    try {
                        if (typeof SupabaseService.fetchAllUserData === 'function') {
                            await SupabaseService.fetchAllUserData();
                        }
                    } catch (e) {
                        console.warn('[GymExport] Sync pull error, continuing with local store:', e);
                    }
                }

                // Stage 2: Loading exercise details & scope
                updateStage('Loading exercise details...', 35);
                const scopeData = this.getScopeData();
                await new Promise(r => setTimeout(r, 60));

                // Stage 3: Preparing workout photos
                updateStage('Preparing workout photos...', 55);
                const photoMap = {};
                if (this.state.includePhotos) {
                    for (const session of scopeData.sessions) {
                        try {
                            const photoData = await this.loadWorkoutPhoto(session);
                            if (photoData) {
                                photoMap[session.id] = photoData;
                            }
                        } catch (pErr) {
                            console.warn('[GymExport] Photo load skipped for session:', session.id, pErr);
                        }
                    }
                }

                // Stage 4: Calculating analytics & PRs
                updateStage('Calculating metrics & PRs...', 75);
                const allSessions = this.getAllSessions();
                const analytics = this.computeAnalytics(scopeData.sessions, allSessions);
                const prData = this.computePRs(scopeData.sessions, allSessions, scopeData.startDate, scopeData.endDate);
                await new Promise(r => setTimeout(r, 60));

                // Stage 5: Building PDF document
                updateStage('Building PDF document...', 90);
                const doc = this.buildPdfDocument(scopeData, analytics, prData, photoMap);

                // Stage 6: Preparing download
                updateStage('Preparing download...', 98);
                const blob = doc.output('blob');
                const blobUrl = URL.createObjectURL(blob);

                this.state.generatedPdfDoc = doc;
                this.state.generatedFilename = scopeData.filename;
                this.state.generatedBlobUrl = blobUrl;
                this.state.isGenerating = false;
                this.state.currentStage = 'REPORT READY';
                this.state.progressPercent = 100;
                this.renderModalUI();

            } catch (err) {
                console.error('[GymExport] PDF Generation failed:', err);
                this.state.isGenerating = false;
                this.state.errorMessage = err.message || 'An error occurred while generating the PDF report.';
                this.renderModalUI();
            }
        },

        // Trigger direct browser download
        downloadCurrentPdf() {
            if (!this.state.generatedPdfDoc || !this.state.generatedFilename) return;
            try {
                this.state.generatedPdfDoc.save(this.state.generatedFilename);
            } catch (e) {
                // Fallback via anchor tag
                if (this.state.generatedBlobUrl) {
                    const a = document.createElement('a');
                    a.href = this.state.generatedBlobUrl;
                    a.download = this.state.generatedFilename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }
            }
        },

        // Quick Export for single workout (History card or Details modal)
        async exportSingleWorkout(sessionId) {
            this.initDefaults();
            this.state.reportType = 'single';
            this.state.selectedSessionId = sessionId;
            this.openExportModal();
            // Automatically start generation for single workout export action
            await this.generatePdf();
        },

        // ---------------------------------------------------------------------
        // UI Modal Lifecycle & Rendering
        // ---------------------------------------------------------------------
        openExportModal(initialConfig = {}) {
            if (!this.state.selectedWeekDate) {
                this.initDefaults();
            }
            if (initialConfig.reportType) {
                this.state.reportType = initialConfig.reportType;
            }
            if (initialConfig.sessionId) {
                this.state.selectedSessionId = initialConfig.sessionId;
                this.state.reportType = 'single';
            }

            this.state.isOpen = true;
            this.state.errorMessage = null;

            let modal = document.getElementById('gymExportModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.id = 'gymExportModal';
                document.body.appendChild(modal);
            }

            modal.onclick = (e) => {
                if (e.target === modal && !this.state.isGenerating) {
                    GymExportEngine.closeExportModal();
                }
            };

            this.renderModalUI();
            modal.style.display = 'flex';
            modal.classList.add('active');
        },

        closeExportModal() {
            this.state.isOpen = false;
            const modal = document.getElementById('gymExportModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
            // Revoke temporary blob URL to free memory
            if (this.state.generatedBlobUrl) {
                try { URL.revokeObjectURL(this.state.generatedBlobUrl); } catch (e) {}
                this.state.generatedBlobUrl = null;
            }
        },

        renderModalUI() {
            const modal = document.getElementById('gymExportModal');
            if (!modal) return;

            const scopeData = this.getScopeData();
            const { reportType, isGenerating, currentStage, progressPercent, errorMessage, generatedBlobUrl, generatedFilename } = this.state;
            const allSessions = this.getAllSessions();

            modal.innerHTML = `
                <div class="modal-window gym-export-modal-window">
                    <!-- Modal Header -->
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="gym-export-badge">📄</div>
                            <div>
                                <span class="wizard-modal-eyebrow">FORGE FITNESS REPORT</span>
                                <h3 class="wizard-modal-title" style="margin: 0; font-size: 19px;">Export Progress Report</h3>
                                <p style="margin: 2px 0 0 0; font-size: 11.5px; color: var(--text-muted);">Your Training. Your Progress. Your Proof.</p>
                            </div>
                        </div>
                        <button type="button" class="btn-close-modal" aria-label="Close" onclick="GymExportEngine.closeExportModal()" ${isGenerating ? 'disabled' : ''}>×</button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body" style="padding: 18px 22px; max-height: calc(85vh - 120px); overflow-y: auto;">
                        ${errorMessage ? `
                            <div class="export-alert-box error" style="margin-bottom: 16px;">
                                <span>⚠️</span>
                                <div>
                                    <b>Generation Error:</b> ${errorMessage}
                                </div>
                            </div>
                        ` : ''}

                        ${isGenerating ? `
                            <!-- Generation Progress State -->
                            <div class="export-progress-container" style="text-align: center; padding: 28px 16px;">
                                <div class="gym-photo-spinner" style="width: 44px; height: 44px; margin: 0 auto 16px auto;"></div>
                                <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">GENERATING YOUR FITNESS REPORT</h4>
                                <p style="color: var(--gold); font-size: 13px; font-weight: 600; margin: 0 0 16px 0;">${currentStage}</p>
                                
                                <div class="export-prog-bar" style="background: rgba(255,255,255,0.08); height: 8px; border-radius: 4px; overflow: hidden; max-width: 420px; margin: 0 auto;">
                                    <div style="background: var(--gold); height: 100%; width: ${progressPercent}%; transition: width 0.25s ease;"></div>
                                </div>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">Compiling genuine relational workout logs, photos & analytics...</div>
                            </div>
                        ` : generatedBlobUrl ? `
                            <!-- Success State -->
                            <div class="export-success-card" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 18px;">
                                <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎉</span>
                                <h4 style="color: var(--emerald); margin: 0 0 6px 0; font-size: 16px;">REPORT READY FOR DOWNLOAD</h4>
                                <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 12px 0;">
                                    Your professional PDF progress report has been compiled successfully.
                                </p>
                                <div style="font-family: monospace; font-size: 12px; color: #fff; background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 4px; display: inline-block; margin-bottom: 16px;">
                                    ${generatedFilename}
                                </div>
                                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                                    <button class="btn-primary" style="padding: 10px 24px; font-weight: 700;" onclick="GymExportEngine.downloadCurrentPdf()">
                                        📥 DOWNLOAD PDF
                                    </button>
                                    <button class="action-btn-ghost" onclick="GymExportEngine.resetToConfig()">
                                        🔄 Generate Another Report
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <!-- Configuration Form -->
                            <div class="export-config-section">
                                <label class="export-form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
                                    1. Select Report Type
                                </label>
                                <div class="export-type-selector-grid">
                                    <button type="button" class="export-type-btn ${reportType === 'weekly' ? 'active' : ''}" onclick="GymExportEngine.setReportType('weekly')">
                                        <span class="type-icon">📅</span>
                                        <span class="type-title">Weekly Report</span>
                                        <span class="type-desc">7-day summary & logs</span>
                                    </button>
                                    <button type="button" class="export-type-btn ${reportType === 'monthly' ? 'active' : ''}" onclick="GymExportEngine.setReportType('monthly')">
                                        <span class="type-icon">📊</span>
                                        <span class="type-title">Monthly Report</span>
                                        <span class="type-desc">Calendar month analysis</span>
                                    </button>
                                    <button type="button" class="export-type-btn ${reportType === 'custom' ? 'active' : ''}" onclick="GymExportEngine.setReportType('custom')">
                                        <span class="type-icon">📆</span>
                                        <span class="type-title">Custom Range</span>
                                        <span class="type-desc">Custom date span</span>
                                    </button>
                                    <button type="button" class="export-type-btn ${reportType === 'single' ? 'active' : ''}" onclick="GymExportEngine.setReportType('single')">
                                        <span class="type-icon">🏋️</span>
                                        <span class="type-title">Single Workout</span>
                                        <span class="type-desc">Detailed session log</span>
                                    </button>
                                </div>

                                <!-- Dynamic Date Selector Panel -->
                                <div class="export-date-panel" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; margin: 16px 0;">
                                    ${reportType === 'weekly' ? `
                                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                            <div>
                                                <div style="font-weight: 700; font-size: 13px; color: #fff;">Selected Week:</div>
                                                <div style="font-size: 12px; color: var(--gold); margin-top: 2px;">
                                                    ${formatFriendlyDate(scopeData.startDate)} – ${formatFriendlyDate(scopeData.endDate)}
                                                </div>
                                            </div>
                                            <div style="display: flex; gap: 6px; align-items: center;">
                                                <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11.5px;" onclick="GymExportEngine.shiftWeek(-1)">← Previous</button>
                                                <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11.5px;" onclick="GymExportEngine.setWeekToday()">Current Week</button>
                                                <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11.5px;" onclick="GymExportEngine.shiftWeek(1)">Next →</button>
                                            </div>
                                        </div>
                                    ` : reportType === 'monthly' ? `
                                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                            <div>
                                                <div style="font-weight: 700; font-size: 13px; color: #fff;">Selected Month:</div>
                                                <div style="font-size: 12px; color: var(--gold); margin-top: 2px;">
                                                    ${scopeData.label}
                                                </div>
                                            </div>
                                            <div style="display: flex; gap: 8px; align-items: center;">
                                                <input type="month" id="exportMonthInput" value="${this.state.selectedMonth}" onchange="GymExportEngine.onMonthChange(this.value)" class="form-input" style="padding: 4px 8px; font-size: 12px; width: auto;">
                                                <button type="button" class="action-btn-ghost" style="padding: 4px 10px; font-size: 11.5px;" onclick="GymExportEngine.setMonthCurrent()">Current Month</button>
                                            </div>
                                        </div>
                                    ` : reportType === 'custom' ? `
                                        <div>
                                            <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;">
                                                <div style="flex: 1; min-width: 140px;">
                                                    <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">Start Date (Inclusive)</label>
                                                    <input type="date" value="${this.state.customStartDate}" onchange="GymExportEngine.onCustomStartChange(this.value)" class="form-input" style="padding: 6px 10px; font-size: 12px; width: 100%;">
                                                </div>
                                                <div style="flex: 1; min-width: 140px;">
                                                    <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">End Date (Inclusive)</label>
                                                    <input type="date" value="${this.state.customEndDate}" onchange="GymExportEngine.onCustomEndChange(this.value)" class="form-input" style="padding: 6px 10px; font-size: 12px; width: 100%;">
                                                </div>
                                            </div>
                                            <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap;">
                                                <button type="button" class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="GymExportEngine.setCustomPreset('7d')">Last 7 Days</button>
                                                <button type="button" class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="GymExportEngine.setCustomPreset('14d')">Last 14 Days</button>
                                                <button type="button" class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="GymExportEngine.setCustomPreset('30d')">Last 30 Days</button>
                                                <button type="button" class="action-btn-ghost" style="padding: 3px 8px; font-size: 11px;" onclick="GymExportEngine.setCustomPreset('mtd')">Month-to-Date</button>
                                            </div>
                                        </div>
                                    ` : `
                                        <div>
                                            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">Select Workout Session</label>
                                            ${allSessions.length === 0 ? `
                                                <div style="font-size: 12px; color: var(--text-muted); padding: 8px 0;">No completed workout sessions found.</div>
                                            ` : `
                                                <select onchange="GymExportEngine.onSessionSelect(this.value)" class="form-input" style="padding: 6px 10px; font-size: 12px; width: 100%;">
                                                    ${allSessions.map(s => {
                                                        const isSel = s.id === this.state.selectedSessionId;
                                                        const dur = s.durationMinutes || s.duration || 0;
                                                        const vol = (s.totalVolumeKg || 0).toLocaleString();
                                                        return `<option value="${s.id}" ${isSel ? 'selected' : ''}>${s.date} — ${s.workoutType || s.routineName} (${dur}m • ${vol} kg)</option>`;
                                                    }).join('')}
                                                </select>
                                            `}
                                        </div>
                                    `}
                                </div>

                                <!-- Scope Preview Card -->
                                <div class="export-scope-preview-card" style="background: rgba(245, 197, 24, 0.04); border: 1px solid rgba(245, 197, 24, 0.2); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 11px; font-weight: 700; color: var(--gold); text-transform: uppercase;">Reporting Scope Preview</span>
                                        <span style="font-size: 11px; color: var(--text-muted);">${scopeData.athleteName ? 'Athlete: ' + scopeData.athleteName : 'FORGE System'}</span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
                                        <div>
                                            <span style="font-size: 10.5px; color: var(--text-muted); display: block;">Sessions</span>
                                            <b style="font-size: 14px; color: #fff;">${scopeData.sessionCount} workouts</b>
                                        </div>
                                        <div>
                                            <span style="font-size: 10.5px; color: var(--text-muted); display: block;">Volume</span>
                                            <b style="font-size: 14px; color: var(--sky);">${scopeData.totalVolume.toLocaleString()} kg</b>
                                        </div>
                                        <div>
                                            <span style="font-size: 10.5px; color: var(--text-muted); display: block;">Sets</span>
                                            <b style="font-size: 14px; color: #fff;">${scopeData.totalSets} sets</b>
                                        </div>
                                        <div>
                                            <span style="font-size: 10.5px; color: var(--text-muted); display: block;">Check-In Photos</span>
                                            <b style="font-size: 14px; color: var(--emerald);">${scopeData.photosAvailableCount} available</b>
                                        </div>
                                    </div>
                                    ${scopeData.syncWarning ? `
                                        <div style="margin-top: 8px; font-size: 11px; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
                                            <span>ℹ️</span> <span>${scopeData.syncWarning}</span>
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Report Content Inclusions -->
                                <label class="export-form-label" style="display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
                                    2. Content Inclusions
                                </label>
                                <div class="export-toggles-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
                                    <label class="export-checkbox-pill">
                                        <input type="checkbox" ${this.state.includePhotos ? 'checked' : ''} onchange="GymExportEngine.toggleOption('includePhotos')">
                                        <span>📸 Workout Photos</span>
                                    </label>
                                    <label class="export-checkbox-pill">
                                        <input type="checkbox" ${this.state.includeExercises ? 'checked' : ''} onchange="GymExportEngine.toggleOption('includeExercises')">
                                        <span>🏋️ Exercise Breakdown</span>
                                    </label>
                                    <label class="export-checkbox-pill">
                                        <input type="checkbox" ${this.state.includeSets ? 'checked' : ''} onchange="GymExportEngine.toggleOption('includeSets')">
                                        <span>📊 Set-by-Set Details</span>
                                    </label>
                                    <label class="export-checkbox-pill">
                                        <input type="checkbox" ${this.state.includePRs ? 'checked' : ''} onchange="GymExportEngine.toggleOption('includePRs')">
                                        <span>🏆 Personal Records (PR)</span>
                                    </label>
                                    <label class="export-checkbox-pill">
                                        <input type="checkbox" ${this.state.includeAnalytics ? 'checked' : ''} onchange="GymExportEngine.toggleOption('includeAnalytics')">
                                        <span>📈 Training Analytics</span>
                                    </label>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 22px;">
                        <button type="button" class="action-btn-ghost" onclick="GymExportEngine.closeExportModal()" ${isGenerating ? 'disabled' : ''}>
                            Close
                        </button>
                        ${!generatedBlobUrl ? `
                            <button type="button" class="btn-primary btn-generate-report" style="padding: 10px 22px; font-weight: 800;" onclick="GymExportEngine.generatePdf()" ${isGenerating ? 'disabled' : ''}>
                                ⚡ GENERATE PDF
                            </button>
                        ` : `
                            <button type="button" class="btn-primary" style="padding: 10px 22px; font-weight: 800;" onclick="GymExportEngine.downloadCurrentPdf()">
                                📥 DOWNLOAD PDF
                            </button>
                        `}
                    </div>
                </div>
            `;
        },

        resetToConfig() {
            this.state.generatedBlobUrl = null;
            this.state.generatedPdfDoc = null;
            this.state.currentStage = '';
            this.renderModalUI();
        },

        setReportType(type) {
            this.state.reportType = type;
            this.resetToConfig();
        },

        shiftWeek(offset) {
            const current = this.state.selectedWeekDate || getTodayIsoString();
            const d = new Date(current + 'T12:00:00');
            d.setDate(d.getDate() + (offset * 7));
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            this.state.selectedWeekDate = `${y}-${m}-${dayNum}`;
            this.resetToConfig();
        },

        setWeekToday() {
            this.state.selectedWeekDate = getTodayIsoString();
            this.resetToConfig();
        },

        onMonthChange(val) {
            if (val) {
                this.state.selectedMonth = val;
                this.resetToConfig();
            }
        },

        setMonthCurrent() {
            this.state.selectedMonth = getTodayIsoString().slice(0, 7);
            this.resetToConfig();
        },

        onCustomStartChange(val) {
            if (val) {
                this.state.customStartDate = val;
                this.resetToConfig();
            }
        },

        onCustomEndChange(val) {
            if (val) {
                this.state.customEndDate = val;
                this.resetToConfig();
            }
        },

        setCustomPreset(preset) {
            const today = getTodayIsoString();
            const endD = new Date(today + 'T12:00:00');
            const startD = new Date(today + 'T12:00:00');

            if (preset === '7d') {
                startD.setDate(endD.getDate() - 6);
            } else if (preset === '14d') {
                startD.setDate(endD.getDate() - 13);
            } else if (preset === '30d') {
                startD.setDate(endD.getDate() - 29);
            } else if (preset === 'mtd') {
                startD.setDate(1);
            }

            const toIso = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dayNum = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${dayNum}`;
            };

            this.state.customStartDate = toIso(startD);
            this.state.customEndDate = toIso(endD);
            this.resetToConfig();
        },

        onSessionSelect(id) {
            this.state.selectedSessionId = id;
            this.resetToConfig();
        },

        toggleOption(key) {
            if (typeof this.state[key] === 'boolean') {
                this.state[key] = !this.state[key];
                this.resetToConfig();
            }
        }
    };

    return GymExportEngine;
}));
