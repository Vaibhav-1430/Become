/**
 * BOSS Study OS — Study Session Engine
 * Orchestrates:
 *  - Distraction-Free Study Mode & Modal Setup
 *  - High-Precision Wall-Clock Study & Break Timers
 *  - Browser Camera Engine & Non-Invasive Workspace Presence Detector
 *  - Session Persistence & Refresh/Crash Recovery
 *  - Post-Session AI Study Insight & Learner Profile Feedback
 */

// ---------------------------------------------------------------------------
// 1. Camera Engine (Strictly Non-Invasive, No Recording, Workspace Presence Only)
// ---------------------------------------------------------------------------
const CameraEngine = {
    stream: null,
    isEnabled: false,
    permissionStatus: 'prompt', // 'prompt' | 'granted' | 'denied'
    videoElement: null,

    async requestCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported on this device/browser');
            }
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false
            });
            this.isEnabled = true;
            this.permissionStatus = 'granted';
            this.attachToVideoElement();
            return { success: true };
        } catch (err) {
            this.isEnabled = false;
            this.permissionStatus = 'denied';
            return { success: false, error: err.message };
        }
    },

    attachToVideoElement() {
        if (!this.videoElement) {
            this.videoElement = document.getElementById('studyCameraVideo');
        }
        if (this.videoElement && this.stream) {
            this.videoElement.srcObject = this.stream;
            this.videoElement.play().catch(() => {});
        }
    },

    toggleCamera() {
        if (this.isEnabled) {
            this.disable();
            return false;
        } else {
            this.requestCamera().then(() => {
                if (this.isEnabled) PresenceDetector.start();
                StudySessionEngine.updateCameraUI();
            });
            return true;
        }
    },

    disable() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        this.isEnabled = false;
        PresenceDetector.stop();
        StudySessionEngine.updateCameraUI();
    },

    stop() {
        this.disable();
        this.permissionStatus = 'prompt';
    }
};

// ---------------------------------------------------------------------------
// 2. Presence Detector (Local Frame Differencing — Workspace Presence Only)
// ---------------------------------------------------------------------------
const PresenceDetector = {
    intervalId: null,
    canvas: null,
    ctx: null,
    lastFrameData: null,
    presenceHistory: [],
    consecutiveAbsentTicks: 0,
    isPresenceDetected: true,
    sampleRateMs: 3000,
    absenceGraceThresholdTicks: 40, // ~120s of sustained absence

    init() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 96;
            this.canvas.height = 72;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
    },

    start() {
        this.init();
        this.stop();
        this.consecutiveAbsentTicks = 0;
        this.isPresenceDetected = true;
        this.intervalId = setInterval(() => this.checkPresence(), this.sampleRateMs);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.lastFrameData = null;
    },

    checkPresence() {
        if (!CameraEngine.isEnabled || !CameraEngine.videoElement) {
            this.isPresenceDetected = true;
            this.updatePresenceBadge('camera_off');
            return;
        }

        const video = CameraEngine.videoElement;
        if (video.readyState < 2 || video.paused || video.ended) return;

        try {
            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            const frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = frame.data;

            let diffScore = 0;
            let totalLuminance = 0;
            const len = data.length;

            if (this.lastFrameData) {
                const prev = this.lastFrameData;
                // Sample every 4th pixel for high efficiency
                for (let i = 0; i < len; i += 16) {
                    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    const prevLum = 0.299 * prev[i] + 0.587 * prev[i + 1] + 0.114 * prev[i + 2];
                    diffScore += Math.abs(lum - prevLum);
                    totalLuminance += lum;
                }
            }

            this.lastFrameData = data;

            // Workspace presence is confirmed if luminance variation or subtle posture motion is observed
            const sampleCount = len / 16;
            const avgDiff = this.lastFrameData ? (diffScore / sampleCount) : 10;
            const avgLum = totalLuminance / sampleCount;

            // Presence heuristic: normal ambient light + subtle natural motion/presence
            const present = avgLum > 10 && (avgDiff > 0.8 || this.consecutiveAbsentTicks < 4);

            this.isPresenceDetected = present;
            this.presenceHistory.push(present);

            if (!present) {
                this.consecutiveAbsentTicks++;
                this.updatePresenceBadge('absent');

                if (this.consecutiveAbsentTicks >= this.absenceGraceThresholdTicks) {
                    StudySessionEngine.triggerAbsencePrompt();
                }
            } else {
                this.consecutiveAbsentTicks = 0;
                this.updatePresenceBadge('present');
            }
        } catch (e) {
            // Ignore canvas sampling errors
        }
    },

    getPresenceRate() {
        if (this.presenceHistory.length === 0) return 100;
        const presentCount = this.presenceHistory.filter(Boolean).length;
        return Math.round((presentCount / this.presenceHistory.length) * 100);
    },

    updatePresenceBadge(state) {
        const badge = document.getElementById('studyPresenceBadge');
        if (!badge) return;

        if (state === 'present') {
            badge.className = 'study-presence-pill active';
            badge.innerHTML = `<span class="presence-dot"></span> Camera detected presence`;
        } else if (state === 'absent') {
            badge.className = 'study-presence-pill warning';
            badge.innerHTML = `<span class="presence-dot warning"></span> Workspace presence check`;
        } else {
            badge.className = 'study-presence-pill off';
            badge.innerHTML = `<span class="presence-dot off"></span> Monitoring OFF`;
        }
    }
};

// ---------------------------------------------------------------------------
// 3. Main Study Session Controller & Precision Wall-Clock Engine
// ---------------------------------------------------------------------------
const StudySessionEngine = {
    // Current Active State
    state: {
        id: null,
        status: 'IDLE', // 'IDLE' | 'SETUP' | 'STUDYING' | 'BREAK' | 'SUMMARY'
        category: 'DSA',
        subject: '',
        topic: '',
        taskId: null,
        customTopic: '',
        startTimeISO: null,
        startTimestamp: 0,
        lastStudyTickTimestamp: 0,
        accumulatedStudyMs: 0,
        lastBreakTickTimestamp: 0,
        accumulatedBreakMs: 0,
        breaks: [],
        cameraEnabled: false,
        tasksCompleted: 0
    },

    timerInterval: null,
    isAbsencePromptOpen: false,

    init() {
        this.checkForActiveSession();
        this.setupEventListeners();
    },

    // ----------------------------------------------------
    // Category & Topic Data Definitions
    // ----------------------------------------------------
    categoryData: {
        DSA: {
            name: '🧠 DSA',
            subjects: [
                {
                    name: 'Striver A2Z Sheet',
                    topics: [
                        'Step 1: Learn the Basics',
                        'Step 2: Sorting Techniques',
                        'Step 3: Solve Problems on Arrays',
                        'Step 4: Binary Search [1D, 2D Arrays, Search Space]',
                        'Step 5: Strings [Basic and Medium]',
                        'Step 6: Learn LinkedList [Single, Double, Medium, Hard]',
                        'Step 7: Recursion & Backtracking',
                        'Step 8: Bit Manipulation',
                        'Step 9: Stack and Queues',
                        'Step 10: Sliding Window & Two Pointer',
                        'Step 11: Heaps [Learning, Medium, Hard]',
                        'Step 12: Greedy Algorithms',
                        'Step 13: Binary Trees [Traversals, Medium, Hard]',
                        'Step 14: Binary Search Trees',
                        'Step 15: Graphs [BFS, DFS, Shortest Path, MST]',
                        'Step 16: Dynamic Programming [Grids, Subsequences, MCM, Stocks]',
                        'Step 17: Tries',
                        'Step 18: Advanced Strings & Hard Problems'
                    ]
                },
                {
                    name: 'Company Interview DSA',
                    topics: ['Amazon Top 50', 'Google Tagged DSA', 'Microsoft Top Coding Questions', 'System Coding Rounds']
                }
            ]
        },
        DEV: {
            name: '💻 Development',
            subjects: [
                {
                    name: 'Frontend Engineering',
                    topics: ['HTML5 Semantic & SEO', 'CSS3 Modern Layouts & Flexbox/Grid', 'Modern JavaScript (ES6+)', 'TypeScript Foundations', 'React Fundamentals & Hooks', 'React State Management & Zustand', 'Next.js App Router & SSR', 'Tailwind CSS & Component Systems']
                },
                {
                    name: 'Backend & APIs',
                    topics: ['Node.js Event Loop & Internals', 'Express.js REST Architecture', 'PostgreSQL & Relational Schema Design', 'Prisma / Drizzle ORM', 'Redis In-Memory Caching & Queues', 'JWT Authentication & Security Best Practices', 'WebSockets & Real-Time Sync', 'Microservices & Message Brokers']
                },
                {
                    name: 'DevOps & Cloud',
                    topics: ['Git Version Control & Workflows', 'Docker Containerization', 'CI/CD GitHub Actions', 'AWS / Cloud Deployment', 'Nginx Reverse Proxy & SSL']
                },
                {
                    name: 'Full-Stack Projects',
                    topics: ['SaaS Dashboard Architecture', 'E-Commerce Marketplace', 'Collaborative Workspace Project', 'AI Integration & Streaming']
                }
            ]
        },
        AIML: {
            name: '🤖 AI & ML',
            subjects: [
                {
                    name: 'Machine Learning Foundations',
                    topics: ['Linear & Logistic Regression', 'Decision Trees & Random Forests', 'Feature Engineering & Data Preprocessing', 'Model Evaluation & Hyperparameter Tuning']
                },
                {
                    name: 'Deep Learning & GenAI',
                    topics: ['Neural Networks & Backpropagation', 'PyTorch Foundations', 'Convolutional Networks (CNNs)', 'Transformers & Self-Attention', 'Large Language Models & Prompt Engineering', 'RAG & Vector Databases (LangChain/LlamaIndex)']
                }
            ]
        },
        COLLEGE: {
            name: '🎓 College Exams',
            subjects: [
                {
                    name: 'Core Semester Subjects',
                    topics: ['Database Management Systems (DBMS)', 'Operating Systems (Processes, Threads, Deadlocks)', 'Computer Networks (OSI, TCP/IP, Routing)', 'Software Engineering & Agile', 'Theory of Computation (Automata, Turing Machines)', 'Compiler Design & Parsing']
                },
                {
                    name: 'Internal Assessment Prep',
                    topics: ['Mid-Term Exam Practice', 'Lab Assignment Preparation', 'End-Term Comprehensive Revision']
                }
            ]
        },
        OTHER: {
            name: '📚 Other',
            subjects: [
                {
                    name: 'Placement & Career Foundations',
                    topics: ['High-Level System Design (HLD)', 'Low-Level Object-Oriented Design (LLD)', 'Quantitative Aptitude & Logical Reasoning', 'Behavioral HR & Leadership Principles', 'Resume Review & Project Defense']
                }
            ]
        }
    },

    // ----------------------------------------------------
    // Setup Modal Flow (Part 1, 2, 3)
    // ----------------------------------------------------
    startDirectSession(category, subject, topic, taskId = null) {
        if (this.state.status === 'STUDYING' || this.state.status === 'BREAK') {
            this.openStudyModeOverlay();
            return;
        }
        this.state.category = category || 'DSA';
        this.state.subject = subject || 'General';
        this.state.topic = topic || 'General Study';
        this.state.taskId = taskId || null;
        this.state.cameraEnabled = false;
        this.closeSetupModal();
        this.launchSession(false);
    },

    openSetupModal() {
        // Prevent opening if a session is already running
        if (this.state.status === 'STUDYING' || this.state.status === 'BREAK') {
            this.openStudyModeOverlay();
            return;
        }

        const modal = document.getElementById('studySessionSetupModal');
        if (!modal) return;

        // Reset setup step
        this.setSetupStep(1);
        this.renderSetupCategories();
        this.renderSubjectAndTopicOptions('DSA');
        this.populatePendingTasks('DSA');

        modal.classList.add('active');
    },

    closeSetupModal() {
        const modal = document.getElementById('studySessionSetupModal');
        if (modal) modal.classList.remove('active');
    },

    setSetupStep(stepNum) {
        const step1 = document.getElementById('studySetupStep1');
        const step2 = document.getElementById('studySetupStep2');
        const step3 = document.getElementById('studySetupStep3');

        if (step1) step1.style.display = stepNum === 1 ? 'block' : 'none';
        if (step2) step2.style.display = stepNum === 2 ? 'block' : 'none';
        if (step3) step3.style.display = stepNum === 3 ? 'block' : 'none';
    },

    renderSetupCategories() {
        const container = document.getElementById('studyCategoryPills');
        if (!container) return;

        const categories = [
            { key: 'DSA', label: '🧠 DSA', desc: 'Striver A2Z & Coding' },
            { key: 'DEV', label: '💻 Development', desc: 'Full-Stack & Projects' },
            { key: 'AIML', label: '🤖 AI & ML', desc: 'ML, DL & GenAI' },
            { key: 'COLLEGE', label: '🎓 College Exams', desc: 'Core CS & Academics' },
            { key: 'OTHER', label: '📚 Other', desc: 'System Design & Custom' }
        ];

        container.innerHTML = categories.map(cat => `
            <button type="button" class="study-cat-card ${this.state.category === cat.key ? 'active' : ''}" data-cat="${cat.key}" onclick="StudySessionEngine.selectCategory('${cat.key}')">
                <div class="cat-label">${cat.label}</div>
                <div class="cat-desc">${cat.desc}</div>
            </button>
        `).join('');
    },

    selectCategory(catKey) {
        this.state.category = catKey;
        this.renderSetupCategories();
        this.renderSubjectAndTopicOptions(catKey);
        this.populatePendingTasks(catKey);
    },

    renderSubjectAndTopicOptions(catKey) {
        const subjectSelect = document.getElementById('studySubjectSelect');
        const topicSelect = document.getElementById('studyTopicSelect');
        if (!subjectSelect || !topicSelect) return;

        const cat = this.categoryData[catKey] || this.categoryData.OTHER;
        subjectSelect.innerHTML = cat.subjects.map((s, idx) => `
            <option value="${s.name}" ${idx === 0 ? 'selected' : ''}>${s.name}</option>
        `).join('') + `<option value="__CUSTOM__">+ Custom Subject</option>`;

        this.updateTopicsForSelectedSubject();
    },

    updateTopicsForSelectedSubject() {
        const subjectSelect = document.getElementById('studySubjectSelect');
        const topicSelect = document.getElementById('studyTopicSelect');
        const customSubjectInput = document.getElementById('studyCustomSubjectInput');
        const customTopicInput = document.getElementById('studyCustomTopicInput');

        if (!subjectSelect || !topicSelect) return;

        const cat = this.categoryData[this.state.category] || this.categoryData.OTHER;
        const selectedSubject = subjectSelect.value;

        if (selectedSubject === '__CUSTOM__') {
            if (customSubjectInput) customSubjectInput.style.display = 'block';
            topicSelect.innerHTML = `<option value="__CUSTOM__">+ Custom Topic</option>`;
            if (customTopicInput) customTopicInput.style.display = 'block';
            return;
        } else {
            if (customSubjectInput) customSubjectInput.style.display = 'none';
        }

        const found = cat.subjects.find(s => s.name === selectedSubject) || cat.subjects[0];
        if (found) {
            topicSelect.innerHTML = found.topics.map((t, idx) => `
                <option value="${t}" ${idx === 0 ? 'selected' : ''}>${t}</option>
            `).join('') + `<option value="__CUSTOM__">+ Custom Topic</option>`;
        }

        this.onTopicChange();
    },

    onTopicChange() {
        const topicSelect = document.getElementById('studyTopicSelect');
        const customTopicInput = document.getElementById('studyCustomTopicInput');
        if (topicSelect && customTopicInput) {
            if (topicSelect.value === '__CUSTOM__') {
                customTopicInput.style.display = 'block';
            } else {
                customTopicInput.style.display = 'none';
            }
        }
    },

    populatePendingTasks(catKey) {
        const taskSelect = document.getElementById('studyTaskSelect');
        if (!taskSelect) return;

        const todayStr = DateUtils.todayIST();
        const tasks = TaskEngine.getTasksForDate(todayStr);

        let filtered = tasks.filter(t => t.status !== APP_CONFIG.TASK_STATUS.COMPLETED);
        if (catKey === 'DSA') filtered = filtered.filter(t => t.category === 'DSA');
        else if (catKey === 'DEV') filtered = filtered.filter(t => t.category === 'DEV');

        if (filtered.length > 0) {
            taskSelect.innerHTML = `<option value="">-- Optional: Link to Scheduled Task --</option>` +
                filtered.map(t => `<option value="${t.id}">[${t.startTime}] ${t.title}</option>`).join('');
            taskSelect.parentElement.style.display = 'block';
        } else {
            taskSelect.innerHTML = `<option value="">No pending scheduled tasks for ${catKey}</option>`;
        }
    },

    // Move to Step 3: Camera Permission & Explanation
    goToCameraPermissionStep() {
        const subjectSelect = document.getElementById('studySubjectSelect');
        const topicSelect = document.getElementById('studyTopicSelect');
        const customSubject = document.getElementById('studyCustomSubjectInput');
        const customTopic = document.getElementById('studyCustomTopicInput');
        const taskSelect = document.getElementById('studyTaskSelect');

        let sub = subjectSelect ? subjectSelect.value : 'General';
        if (sub === '__CUSTOM__' && customSubject && customSubject.value.trim()) {
            sub = customSubject.value.trim();
        }

        let top = topicSelect ? topicSelect.value : 'General Study';
        if (top === '__CUSTOM__' && customTopic && customTopic.value.trim()) {
            top = customTopic.value.trim();
        }

        this.state.subject = sub;
        this.state.topic = top;
        this.state.taskId = taskSelect ? taskSelect.value : null;

        // Transition to Step 3: Camera Permission
        this.setSetupStep(3);
    },

    // User chooses to enable camera
    async startWithCamera() {
        const res = await CameraEngine.requestCamera();
        if (!res.success) {
            alert(`Camera access notice: ${res.error || 'Could not open camera'}. Continuing in distraction-free study mode without camera.`);
            this.state.cameraEnabled = false;
        } else {
            this.state.cameraEnabled = true;
            PresenceDetector.start();
        }
        this.closeSetupModal();
        this.launchSession();
    },

    // User continues without camera
    startWithoutCamera() {
        this.state.cameraEnabled = false;
        CameraEngine.disable();
        this.closeSetupModal();
        this.launchSession();
    },

    // ----------------------------------------------------
    // Launch & Resume Session (Part 4, 5)
    // ----------------------------------------------------
    launchSession(resuming = false) {
        const now = Date.now();
        if (!resuming) {
            this.state.id = `sess_${now}`;
            this.state.status = 'STUDYING';
            this.state.startTimeISO = new Date().toISOString();
            this.state.startTimestamp = now;
            this.state.lastStudyTickTimestamp = now;
            this.state.accumulatedStudyMs = 0;
            this.state.lastBreakTickTimestamp = 0;
            this.state.accumulatedBreakMs = 0;
            this.state.breaks = [];
            this.state.tasksCompleted = 0;
            this.persistActiveSession();
        }

        this.openStudyModeOverlay();
        this.startTimerTicker();
        this.updateStudyModeUI();
        this.updateCameraUI();
        this.updateTopBarIndicator();

        if (!resuming) {
            showToast(`Study Session Started: ${this.state.subject} → ${this.state.topic}`, 'success');
        }
    },

    openStudyModeOverlay() {
        const overlay = document.getElementById('studySessionOverlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Distraction-free lock
        }
    },

    closeStudyModeOverlay() {
        const overlay = document.getElementById('studySessionOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // ----------------------------------------------------
    // Accurate Wall-Clock Timer Ticker (Part 5)
    // ----------------------------------------------------
    startTimerTicker() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            const now = Date.now();

            if (this.state.status === 'STUDYING') {
                const delta = now - this.state.lastStudyTickTimestamp;
                this.state.accumulatedStudyMs += Math.max(0, delta);
                this.state.lastStudyTickTimestamp = now;
            } else if (this.state.status === 'BREAK') {
                const delta = now - this.state.lastBreakTickTimestamp;
                this.state.accumulatedBreakMs += Math.max(0, delta);
                this.state.lastBreakTickTimestamp = now;
            }

            this.updateTimerDisplay();

            // Persist to storage every 10 ticks (10s) to survive reload without disk churn
            if (Math.floor(this.state.accumulatedStudyMs / 1000) % 10 === 0) {
                this.persistActiveSession();
            }
        }, 1000);

        this.updateTimerDisplay();
    },

    stopTimerTicker() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    getStudySeconds() {
        return Math.floor(this.state.accumulatedStudyMs / 1000);
    },

    getBreakSeconds() {
        return Math.floor(this.state.accumulatedBreakMs / 1000);
    },

    getTotalElapsedSeconds() {
        return this.getStudySeconds() + this.getBreakSeconds();
    },

    formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = n => String(n).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    },

    formatDurationHuman(sec) {
        const m = Math.floor(sec / 60);
        const h = Math.floor(m / 60);
        const remM = m % 60;
        if (h === 0) return `${remM}m`;
        return `${h}h ${remM}m`;
    },

    updateTimerDisplay() {
        const studySec = this.getStudySeconds();
        const breakSec = this.getBreakSeconds();

        // Overlay primary timer display
        const mainTimerEl = document.getElementById('studyTimerBig');
        if (mainTimerEl) {
            mainTimerEl.textContent = this.formatTime(this.state.status === 'BREAK' ? breakSec : studySec);
        }

        const studyTimeEl = document.getElementById('studyTimeDisplay');
        if (studyTimeEl) studyTimeEl.textContent = this.formatDurationHuman(studySec);

        const breakTimeEl = document.getElementById('studyBreakTimeDisplay');
        if (breakTimeEl) breakTimeEl.textContent = this.formatDurationHuman(breakSec);

        // Update persistent top-bar indicator
        const topBarTimer = document.getElementById('topBarSessionTimer');
        if (topBarTimer) topBarTimer.textContent = this.formatTime(studySec);
    },

    // ----------------------------------------------------
    // Break System (Part 6)
    // ----------------------------------------------------
    takeBreak() {
        if (this.state.status !== 'STUDYING') return;

        const now = Date.now();
        // Flush study time
        this.state.accumulatedStudyMs += Math.max(0, now - this.state.lastStudyTickTimestamp);
        this.state.lastStudyTickTimestamp = now;

        this.state.status = 'BREAK';
        this.state.lastBreakTickTimestamp = now;

        // Record break entry
        this.state.breaks.push({ startTimestamp: now, endTimestamp: null, durationSec: 0 });

        this.updateStudyModeUI();
        this.persistActiveSession();
        showToast('You are on a break. Focus time paused.', 'info');
    },

    resumeStudy() {
        if (this.state.status !== 'BREAK') return;

        const now = Date.now();
        // Flush break time
        this.state.accumulatedBreakMs += Math.max(0, now - this.state.lastBreakTickTimestamp);
        this.state.lastBreakTickTimestamp = now;

        // Close current break entry
        if (this.state.breaks.length > 0) {
            const currentBreak = this.state.breaks[this.state.breaks.length - 1];
            currentBreak.endTimestamp = now;
            currentBreak.durationSec = Math.floor((now - currentBreak.startTimestamp) / 1000);
        }

        this.state.status = 'STUDYING';
        this.state.lastStudyTickTimestamp = now;

        this.updateStudyModeUI();
        this.persistActiveSession();
        showToast('Study session resumed. Let’s focus!', 'success');
    },

    // ----------------------------------------------------
    // Camera & UI Controls (Part 7, 9)
    // ----------------------------------------------------
    toggleCameraMonitoring() {
        const enabled = CameraEngine.toggleCamera();
        this.state.cameraEnabled = enabled;
        this.updateCameraUI();
        this.persistActiveSession();
    },

    updateCameraUI() {
        const previewContainer = document.getElementById('studyCameraPreviewContainer');
        const cameraToggleBtn = document.getElementById('studyCameraToggleBtn');
        const cameraStatusText = document.getElementById('studyCameraStatusText');

        if (CameraEngine.isEnabled) {
            if (previewContainer) previewContainer.classList.add('camera-active');
            if (cameraToggleBtn) {
                cameraToggleBtn.innerHTML = '<span>📷 Turn Camera Off</span>';
                cameraToggleBtn.classList.remove('btn-camera-off');
            }
            if (cameraStatusText) {
                cameraStatusText.textContent = '📷 Camera Monitoring ON';
                cameraStatusText.className = 'camera-status-text on';
            }
            CameraEngine.attachToVideoElement();
        } else {
            if (previewContainer) previewContainer.classList.remove('camera-active');
            if (cameraToggleBtn) {
                cameraToggleBtn.innerHTML = '<span>📷 Turn Camera On</span>';
                cameraToggleBtn.classList.add('btn-camera-off');
            }
            if (cameraStatusText) {
                cameraStatusText.textContent = '📷 Camera Monitoring OFF';
                cameraStatusText.className = 'camera-status-text off';
            }
            PresenceDetector.updatePresenceBadge('camera_off');
        }
    },

    updateStudyModeUI() {
        const overlayTitle = document.getElementById('studyModeTopicHeader');
        const modeBadge = document.getElementById('studyModeStatusBadge');
        const btnBreak = document.getElementById('studyBtnBreak');
        const btnResume = document.getElementById('studyBtnResume');
        const timerLabel = document.getElementById('studyTimerLabel');

        if (overlayTitle) {
            overlayTitle.innerHTML = `
                <span style="color: var(--text-muted); font-size: 13px;">${this.state.category} → ${this.state.subject}</span>
                <div style="font-size: 18px; font-weight: 700; color: #fff; margin-top: 2px;">${this.state.topic}</div>
            `;
        }

        if (this.state.status === 'BREAK') {
            if (modeBadge) {
                modeBadge.className = 'session-status-pill on-break';
                modeBadge.innerHTML = '☕ You are on a Break';
            }
            if (timerLabel) timerLabel.textContent = '⏱️ Break Time';
            if (btnBreak) btnBreak.style.display = 'none';
            if (btnResume) btnResume.style.display = 'inline-flex';
        } else {
            if (modeBadge) {
                modeBadge.className = 'session-status-pill active';
                modeBadge.innerHTML = '🟢 Session Active & Focused';
            }
            if (timerLabel) timerLabel.textContent = '⏱️ Active Focus Time';
            if (btnBreak) btnBreak.style.display = 'inline-flex';
            if (btnResume) btnResume.style.display = 'none';
        }

        this.updateTopBarIndicator();
    },

    // ----------------------------------------------------
    // Absence / Inactivity Grace Prompt (Part 10)
    // ----------------------------------------------------
    triggerAbsencePrompt() {
        if (this.isAbsencePromptOpen || this.state.status !== 'STUDYING') return;
        this.isAbsencePromptOpen = true;

        const modal = document.getElementById('studyAbsenceModal');
        if (modal) modal.classList.add('active');
    },

    resolveAbsence(action) {
        this.isAbsencePromptOpen = false;
        const modal = document.getElementById('studyAbsenceModal');
        if (modal) modal.classList.remove('active');

        PresenceDetector.consecutiveAbsentTicks = 0;

        if (action === 'here') {
            showToast('Welcome back! Continuing session.', 'info');
        } else if (action === 'break') {
            this.takeBreak();
        } else if (action === 'end') {
            this.confirmEndSession();
        }
    },

    // ----------------------------------------------------
    // End Session & Summary (Part 11, 12, 13)
    // ----------------------------------------------------
    confirmEndSession() {
        const modal = document.getElementById('studyEndConfirmModal');
        if (!modal) {
            this.endSession();
            return;
        }

        const studySec = this.getStudySeconds();
        const breakSec = this.getBreakSeconds();
        const totalSec = this.getTotalElapsedSeconds();

        const confStudy = document.getElementById('confirmEndStudyTime');
        const confBreak = document.getElementById('confirmEndBreakTime');
        const confTotal = document.getElementById('confirmEndTotalTime');

        if (confStudy) confStudy.textContent = this.formatDurationHuman(studySec);
        if (confBreak) confBreak.textContent = this.formatDurationHuman(breakSec);
        if (confTotal) confTotal.textContent = this.formatDurationHuman(totalSec);

        modal.classList.add('active');
    },

    cancelEndConfirm() {
        const modal = document.getElementById('studyEndConfirmModal');
        if (modal) modal.classList.remove('active');
    },

    async endSession() {
        this.cancelEndConfirm();
        this.stopTimerTicker();
        CameraEngine.disable();
        PresenceDetector.stop();

        const now = Date.now();
        const studySec = this.getStudySeconds();
        const breakSec = this.getBreakSeconds();
        const totalSec = this.getTotalElapsedSeconds();
        const activeMin = Math.round(studySec / 60);
        const breakMin = Math.round(breakSec / 60);
        const presenceRate = PresenceDetector.getPresenceRate();

        // If linked to a scheduled task, mark it completed
        let linkedTaskTitle = null;
        if (this.state.taskId && activeMin >= 20) {
            const todayStr = DateUtils.todayIST();
            const tasks = TaskEngine.getTasksForDate(todayStr);
            const foundTask = tasks.find(t => t.id === this.state.taskId);
            if (foundTask && foundTask.status !== APP_CONFIG.TASK_STATUS.COMPLETED) {
                TaskEngine.toggleTask(todayStr, this.state.taskId);
                this.state.tasksCompleted = 1;
                linkedTaskTitle = foundTask.title;
            }
        }

        // Generate AI Insight
        let aiInsightText = `You completed ${activeMin} minutes of active study on ${this.state.subject || this.state.category}. Your focus was preserved with ${breakMin}m of recovery.`;
        try {
            const token = window.App?.getAuthToken ? window.App.getAuthToken() : (localStorage.getItem('studyos_auth_token') || '');
            const res = await fetch('/api/gemini/session-insight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-User-Id': token
                },
                body: JSON.stringify({
                    category: this.state.category,
                    subject: this.state.subject,
                    topic: this.state.topic,
                    activeMinutes: activeMin,
                    breakMinutes: breakMin,
                    totalMinutes: Math.round(totalSec / 60),
                    presenceRate,
                    cameraEnabled: this.state.cameraEnabled,
                    tasksCompleted: this.state.tasksCompleted
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.analysis?.insight) {
                    aiInsightText = data.analysis.insight;
                }
            }
        } catch (e) {
            // Keep grounded fallback
        }

        // Build completed session record
        const sessionRecord = {
            id: this.state.id || `sess_${now}`,
            date: DateUtils.todayIST(),
            startTime: new Date(this.state.startTimestamp || now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: this.state.category,
            subject: this.state.subject,
            topic: this.state.topic,
            activeSeconds: studySec,
            breakSeconds: breakSec,
            totalSeconds: totalSec,
            activeMinutes: activeMin,
            breakMinutes: breakMin,
            breaksCount: this.state.breaks.length,
            cameraEnabled: this.state.cameraEnabled,
            presenceRate: this.state.cameraEnabled ? presenceRate : null,
            tasksCompleted: this.state.tasksCompleted,
            linkedTaskTitle,
            aiInsight: aiInsightText,
            timestamp: new Date().toISOString()
        };

        // Save session in store and clear active session
        Store.saveStudySession(sessionRecord);
        Store.clearActiveStudySession();

        // Reset local state
        this.state.status = 'IDLE';
        this.closeStudyModeOverlay();
        this.updateTopBarIndicator();

        // Update dashboard metrics and analytics view
        if (window.App) {
            App.renderDashboard();
            App.renderStatsView();
        }

        // Show Session Summary Modal
        this.showSessionSummaryModal(sessionRecord);
    },

    showSessionSummaryModal(session) {
        const modal = document.getElementById('studySessionSummaryModal');
        if (!modal) return;

        const sumTopic = document.getElementById('summarySessionTopic');
        const sumActive = document.getElementById('summaryActiveStudy');
        const sumBreak = document.getElementById('summaryBreakTime');
        const sumTotal = document.getElementById('summaryTotalSession');
        const sumCamera = document.getElementById('summaryCameraStatus');
        const sumTasks = document.getElementById('summaryTasksCompleted');
        const sumAiInsight = document.getElementById('summaryAiInsight');

        if (sumTopic) sumTopic.textContent = `${session.subject} → ${session.topic}`;
        if (sumActive) sumActive.textContent = this.formatDurationHuman(session.activeSeconds);
        if (sumBreak) sumBreak.textContent = this.formatDurationHuman(session.breakSeconds);
        if (sumTotal) sumTotal.textContent = this.formatDurationHuman(session.totalSeconds);
        if (sumCamera) {
            sumCamera.textContent = session.cameraEnabled ? `ON (${session.presenceRate}% presence)` : 'OFF';
        }
        if (sumTasks) sumTasks.textContent = session.tasksCompleted;
        if (sumAiInsight) sumAiInsight.textContent = `"${session.aiInsight}"`;

        modal.classList.add('active');
    },

    closeSummaryModal() {
        const modal = document.getElementById('studySessionSummaryModal');
        if (modal) modal.classList.remove('active');
    },

    // ----------------------------------------------------
    // Top Bar Indicator (Part 15)
    // ----------------------------------------------------
    updateTopBarIndicator() {
        const pill = document.getElementById('topBarActiveSessionPill');
        const timerSpan = document.getElementById('topBarSessionTimer');
        if (!pill) return;

        if (this.state.status === 'STUDYING' || this.state.status === 'BREAK') {
            pill.style.display = 'inline-flex';
            pill.className = `active-session-pill ${this.state.status === 'BREAK' ? 'on-break' : 'active'}`;
            if (timerSpan) timerSpan.textContent = this.formatTime(this.getStudySeconds());
        } else {
            pill.style.display = 'none';
        }
    },

    // ----------------------------------------------------
    // Session Persistence & Crash Recovery (Part 16)
    // ----------------------------------------------------
    persistActiveSession() {
        if (this.state.status === 'STUDYING' || this.state.status === 'BREAK') {
            Store.setActiveStudySession({
                ...this.state,
                savedAt: Date.now()
            });
        }
    },

    checkForActiveSession() {
        const saved = Store.getActiveStudySession();
        if (!saved || !saved.startTimestamp) return;

        const now = Date.now();
        const elapsedSinceSave = Math.max(0, now - (saved.savedAt || saved.startTimestamp));

        // Rehydrate state
        this.state = {
            ...this.state,
            ...saved
        };

        // Reconcile time if page was closed/reloaded
        if (saved.status === 'STUDYING') {
            this.state.accumulatedStudyMs += elapsedSinceSave;
            this.state.lastStudyTickTimestamp = now;
        } else if (saved.status === 'BREAK') {
            this.state.accumulatedBreakMs += elapsedSinceSave;
            this.state.lastBreakTickTimestamp = now;
        }

        // Resume timer and show top bar indicator
        this.launchSession(true);
    },

    // ----------------------------------------------------
    // Event Listeners Setup
    // ----------------------------------------------------
    setupEventListeners() {
        const startBtn = document.getElementById('btnHeroStartStudying');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.openSetupModal());
        }

        const topBarPill = document.getElementById('topBarActiveSessionPill');
        if (topBarPill) {
            topBarPill.addEventListener('click', () => this.openStudyModeOverlay());
        }

        // Prevent Esc key from accidentally closing active study session
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && (this.state.status === 'STUDYING' || this.state.status === 'BREAK')) {
                // If study mode overlay is open, minimize to background rather than ending
                const overlay = document.getElementById('studySessionOverlay');
                if (overlay && overlay.classList.contains('active')) {
                    this.closeStudyModeOverlay();
                    showToast('Study session is running in background. Click top bar indicator to return.', 'info');
                }
            }
        });
    }
};

// Global export
if (typeof window !== 'undefined') {
    window.StudySessionEngine = StudySessionEngine;
    window.CameraEngine = CameraEngine;
    window.PresenceDetector = PresenceDetector;
}
