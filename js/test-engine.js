/**
 * BOSS Study OS — Production Weekly Test Platform & Engine
 * Full-screen assessment experience inspired by LeetCode, HackerRank & GFG.
 * Features:
 * - Full-screen responsive workbench
 * - Real countdown timer with refresh recovery
 * - Monaco Editor integration with dark theme
 * - Sandboxed execution via CodeRunner
 * - Dynamic syllabus boundary enforcement via SyllabusEngine
 * - 5-state Question Palette
 * - Anti-accident submission confirmation
 * - Deep performance analytics & one-click revision task injection
 * - SVG trend graph & exportable test reports
 */

const TestEngine = {
    currentSession: null,
    timerInterval: null,
    autosaveInterval: null,
    monacoEditor: null,
    activeLanguage: 'cpp', // Default to C++17 (GCC 14.1.0)
    isPaletteCollapsed: false,

    /**
     * Entry point: Triggered from Weekly Test button
     */
    initTest() {
        // Check for active test session in storage
        const active = Store.getActiveTestSession();
        if (active && !active.isCompleted) {
            const resume = confirm(`An active weekly test from ${active.date} is in progress (${Math.round((active.targetEndTime - Date.now()) / 60000)} mins remaining).\n\nClick OK to Resume this test, or Cancel to start a new test.`);
            if (resume) {
                this.currentSession = active;
                this.launchFullScreen();
                return;
            } else {
                Store.clearActiveTestSession();
            }
        }

        // Show Pre-Test Syllabus Boundary Review Modal
        this.showPreTestModal();
    },

    /**
     * Display the pre-test boundary and configuration modal
     */
    showPreTestModal() {
        const modal = document.getElementById('preTestBoundaryModal');
        const content = document.getElementById('preTestBoundaryContent');
        if (!modal || !content) return;

        const boundary = SyllabusEngine.detectStudiedBoundary();
        const pool = SyllabusEngine.getEligibleQuestions(boundary);

        const dsaSectionsList = SyllabusEngine.DSA_SECTION_MAP
            .filter(s => s.sectionIndex <= boundary.maxDsaSection)
            .map(s => `<li><b>${s.name}</b></li>`)
            .join('');

        content.innerHTML = `
            <div class="boundary-review-wrap">
                <div class="boundary-hero-notice">
                    <div class="boundary-icon">🛡️</div>
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 16px;">Syllabus Boundary Protection Active</h4>
                        <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 13px;">
                            The test generator has verified your actual Study OS progress. Only topics you have studied will appear on today's test.
                        </p>
                    </div>
                </div>

                <div class="boundary-grid">
                    <div class="boundary-card">
                        <div class="boundary-card-title">🧠 DSA Eligible Boundary (Striver A2Z)</div>
                        <div class="boundary-status-badge">Reached: ${boundary.maxDsaSectionName}</div>
                        <ul class="boundary-list">
                            ${dsaSectionsList}
                        </ul>
                        <div class="boundary-locked-note">
                            🔒 Sections ${boundary.maxDsaSection + 1} to 17 (Trees, Graphs, DP, etc.) are strictly locked until studied.
                        </div>
                    </div>

                    <div class="boundary-card">
                        <div class="boundary-card-title">📚 Core CS, SQL & Aptitude Boundary</div>
                        <div class="boundary-subject-tags">
                            <span class="sub-tag">DBMS (Foundations, Keys, Normalization)</span>
                            <span class="sub-tag">OS (Processes, Deadlocks, Paging)</span>
                            <span class="sub-tag">CN (OSI, TCP/IP, CIDR)</span>
                            <span class="sub-tag">SQL (Queries, Joins, Window Functions)</span>
                            <span class="sub-tag">Aptitude (Arithmetic & Logic)</span>
                        </div>
                        ${boundary.weakAreas && boundary.weakAreas.length > 0 ? `
                            <div style="margin-top: 12px; font-size: 12px; color: var(--gold);">
                                <b>🔥 Priority Revision Topics:</b> ${boundary.weakAreas.map(w => w.topic).slice(0, 3).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="test-config-row">
                    <div class="config-item">
                        <label>Exam Duration:</label>
                        <select id="selectTestDuration" class="form-select">
                            <option value="75" selected>75 Minutes (Standard Placement / Comprehensive format)</option>
                            <option value="60">60 Minutes (Express format)</option>
                            <option value="90">90 Minutes (Deep focus format)</option>
                        </select>
                    </div>
                    <div class="config-summary">
                        <span>Total Questions: <b>${Math.min(23, pool.totalEligible)} Questions</b></span>
                        <span>Coding Problems: <b>3 (Live Sandbox)</b></span>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closePreTestModal() {
        const modal = document.getElementById('preTestBoundaryModal');
        if (modal) modal.classList.remove('active');
    },

    startGeneratedTest() {
        this.closePreTestModal();
        const durationSelect = document.getElementById('selectTestDuration');
        const durationMinutes = durationSelect ? parseInt(durationSelect.value, 10) : 75;

        // Generate syllabus-bounded test session
        this.currentSession = SyllabusEngine.generateWeeklyTest({ durationMinutes });
        Store.saveActiveTestSession(this.currentSession);
        this.launchFullScreen();
    },

    /**
     * Launch the full-screen test assessment environment
     */
    launchFullScreen() {
        const container = document.getElementById('weeklyTestFullScreen');
        if (!container) return;

        container.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Setup timer, autosave, keyboard shortcuts
        this.startTimer();
        this.startAutosave();
        this.setupKeyboardShortcuts();

        // Render top bar & question
        this.renderTopBar();
        this.renderCurrentQuestion();
        this.renderPalette();
    },

    /**
     * Real countdown timer that survives browser reloads
     */
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const updateTimerDisplay = () => {
            if (!this.currentSession || this.currentSession.isCompleted) {
                clearInterval(this.timerInterval);
                return;
            }

            const now = Date.now();
            const remainingMs = this.currentSession.targetEndTime - now;
            const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
            this.currentSession.durationSeconds = remainingSeconds;

            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            const displayEl = document.getElementById('testTimerText');
            if (displayEl) {
                displayEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                if (remainingSeconds <= 300) { // Last 5 mins
                    displayEl.parentElement.classList.add('timer-warning');
                } else {
                    displayEl.parentElement.classList.remove('timer-warning');
                }
            }

            if (remainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                if (this.autosaveInterval) clearInterval(this.autosaveInterval);
                this.saveCurrentCodeDraft();
                Store.saveActiveTestSession(this.currentSession);
                document.querySelectorAll('.btn-run-code, .btn-submit-code, #btnSaveAndNext, #btnNextQuestion').forEach(b => {
                    b.disabled = true;
                    b.style.pointerEvents = 'none';
                });
                alert('⏰ Exam Time Expired! Your test is being automatically saved and submitted.');
                this.finalizeSubmission(true); // Auto-submit on time expiration
            }
        };

        updateTimerDisplay();
        this.timerInterval = setInterval(updateTimerDisplay, 1000);
    },

    /**
     * Periodic autosave
     */
    startAutosave() {
        if (this.autosaveInterval) clearInterval(this.autosaveInterval);
        this.autosaveInterval = setInterval(() => {
            if (this.currentSession && !this.currentSession.isCompleted) {
                this.saveCurrentCodeDraft();
                Store.saveActiveTestSession(this.currentSession);
                this.showAutosaveBadge();
            }
        }, 5000);
    },

    showAutosaveBadge() {
        const el = document.getElementById('testAutosaveBadge');
        if (el) {
            el.textContent = 'Saved ✓';
            el.style.opacity = '1';
            setTimeout(() => { if (el) el.style.opacity = '0.5'; }, 1500);
        }
    },

    /**
     * Set up global and in-editor keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        if (this._shortcutsBound) return;
        this._shortcutsBound = true;

        window.addEventListener('keydown', (e) => {
            const container = document.getElementById('weeklyTestFullScreen');
            if (!container || container.style.display === 'none' || !this.currentSession || this.currentSession.isCompleted) {
                return;
            }

            // Ctrl/Cmd + Enter: Run / Submit Code in coding questions
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const q = this.currentSession.questions[this.currentSession.currentIndex];
                if (q && q.type === 'coding') {
                    if (e.shiftKey) {
                        this.runCode(true); // Submit code
                    } else {
                        this.runCode(false); // Run sample code
                    }
                }
            }

            // Alt + ArrowRight: Next question
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextQuestion();
            }

            // Alt + ArrowLeft: Previous question
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevQuestion();
            }

            // Alt + M: Mark / Unmark for Review
            if (e.altKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                this.toggleMarkReview();
            }
        });
    },

    /**
     * Top Bar Updates
     */
    renderTopBar() {
        const session = this.currentSession;
        if (!session) return;

        const dateEl = document.getElementById('testHeaderDate');
        const counterEl = document.getElementById('testQuestionCounter');
        const answeredCountEl = document.getElementById('testStatAnswered');
        const unansweredCountEl = document.getElementById('testStatUnanswered');
        const markedCountEl = document.getElementById('testStatMarked');

        if (dateEl) dateEl.textContent = DateUtils.formatDateLong(session.date);
        if (counterEl) counterEl.textContent = `Question ${session.currentIndex + 1} / ${session.totalQuestions}`;

        let answered = 0;
        session.questions.forEach(q => {
            const a = session.answers[q.id];
            if (q.type === 'coding') {
                if (session.codeSubmissions[q.id] && session.codeSubmissions[q.id].status === 'ACCEPTED') answered++;
                else if (a && a.trim() && a !== q.starterCode?.javascript && a !== q.starterCode?.cpp && a !== q.starterCode?.python) answered++;
            } else if (a !== undefined && a !== null && a !== '') {
                answered++;
            }
        });

        const marked = session.reviewFlags.length;
        const unanswered = session.totalQuestions - answered;

        if (answeredCountEl) answeredCountEl.textContent = answered;
        if (unansweredCountEl) unansweredCountEl.textContent = unanswered;
        if (markedCountEl) markedCountEl.textContent = marked;
    },

    /**
     * Render the active question
     */
    renderCurrentQuestion() {
        const session = this.currentSession;
        if (!session) return;

        this.saveCurrentCodeDraft();

        const q = session.questions[session.currentIndex];
        const container = document.getElementById('testQuestionWorkbench');
        if (!container) return;

        this.renderTopBar();

        const isMarked = session.reviewFlags.includes(session.currentIndex);

        if (q.type === 'coding') {
            container.innerHTML = `
                <div class="test-coding-split">
                    <!-- Left: Problem Statement & Test Cases -->
                    <div class="problem-desc-pane">
                        <div class="problem-meta-bar">
                            <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                            <span class="q-topic-tag">${q.subjectId.toUpperCase()} • ${q.topic}</span>
                            ${isMarked ? `<span class="badge-review-flag">🟣 Marked for Review</span>` : ''}
                        </div>
                        <h2 class="problem-title">${q.title || q.question}</h2>
                        <div class="problem-desc-text">${q.description || q.question}</div>
                        
                        ${q.constraints && q.constraints.length > 0 ? `
                            <div class="problem-section-heading">Constraints:</div>
                            <ul class="problem-constraints-list">
                                ${q.constraints.map(c => `<li>${c}</li>`).join('')}
                            </ul>
                        ` : ''}

                        ${q.sampleCases && q.sampleCases.length > 0 ? `
                            <div class="problem-section-heading">Example Cases:</div>
                            ${q.sampleCases.map((sc, i) => `
                                <div class="example-case-box">
                                    <b>Example ${i + 1}:</b>
                                    <div class="ex-io"><span>Input:</span> <code>${sc.input}</code></div>
                                    <div class="ex-io"><span>Output:</span> <code>${sc.output}</code></div>
                                    ${sc.explanation ? `<div class="ex-expl"><b>Explanation:</b> ${sc.explanation}</div>` : ''}
                                </div>
                            `).join('')}
                        ` : ''}
                    </div>

                    <!-- Right: Editor Workbench -->
                    <div class="editor-workbench-pane">
                        <div class="editor-top-toolbar">
                            <div class="lang-selector-wrap">
                                <label>Language:</label>
                                <select id="testLangSelect" class="form-select-sm" onchange="TestEngine.onLanguageChange(this.value)">
                                    <option value="cpp" ${this.activeLanguage === 'cpp' ? 'selected' : ''}>C++17 (g++ GCC 14.1.0)</option>
                                    <option value="python" ${this.activeLanguage === 'python' ? 'selected' : ''}>Python 3 (Pyodide CPython)</option>
                                    <option value="javascript" ${this.activeLanguage === 'javascript' ? 'selected' : ''}>JavaScript (Node/ES6)</option>
                                </select>
                            </div>
                            <div class="editor-tool-actions">
                                <button class="action-btn-ghost-sm" onclick="TestEngine.resetStarterCode()">↺ Reset Code</button>
                            </div>
                        </div>

                        <!-- Monaco Container / Textarea Fallback -->
                        <div id="monacoEditorContainer" class="monaco-code-container"></div>

                        <!-- Custom Input, Output Console & Submission History Drawer -->
                        <div class="console-drawer-wrap">
                            <div class="console-tab-header">
                                <button class="console-tab-btn active" id="tabBtnCustomInput" onclick="TestEngine.switchConsoleTab('input')">Custom Input</button>
                                <button class="console-tab-btn" id="tabBtnOutput" onclick="TestEngine.switchConsoleTab('output')">Test Output / Verdict</button>
                                <button class="console-tab-btn" id="tabBtnHistory" onclick="TestEngine.switchConsoleTab('history')">Submission History</button>
                            </div>
                            <div id="consoleTabContentInput" class="console-tab-panel active">
                                <textarea id="customInputText" class="custom-input-textarea" placeholder="Enter comma-separated arguments e.g.: [2, 7, 11, 15], 9">${(q.sampleCases && q.sampleCases[0] ? q.sampleCases[0].args.map(a => JSON.stringify(a)).join(', ') : '')}</textarea>
                            </div>
                            <div id="consoleTabContentOutput" class="console-tab-panel">
                                <div id="consoleOutputView" class="console-output-view">Click "▶ Run Code" or "Submit Code" to view execution results.</div>
                            </div>
                            <div id="consoleTabContentHistory" class="console-tab-panel">
                                <div id="consoleHistoryView" class="console-history-view">${this.renderSubmissionHistoryList(q.id)}</div>
                            </div>
                        </div>

                        <!-- Editor Action Bar -->
                        <div class="editor-action-footer">
                            <div id="codingStatusBadge" class="coding-status-badge">
                                ${this.renderCodingQuestionStatus(q.id)}
                            </div>
                            <div class="editor-action-buttons">
                                <button class="btn-run-code" onclick="TestEngine.runCode(false)" title="Shortcut: Ctrl/Cmd + Enter">
                                    ▶ Run Code
                                </button>
                                <button class="btn-submit-code" onclick="TestEngine.runCode(true)">
                                    Submit Code ✓
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize code in editor from isolated draft state
            const draftKey = `${q.id}_${this.activeLanguage}`;
            session.codes = session.codes || {};
            let initialCode = session.codes[draftKey];

            if (initialCode === undefined) {
                initialCode = (q.starterCode && q.starterCode[this.activeLanguage])
                    ? q.starterCode[this.activeLanguage]
                    : (q.starterCode?.cpp || q.starterCode?.javascript || '');
                session.codes[draftKey] = initialCode;
            }

            this.initMonacoEditor(initialCode, this.activeLanguage);

        } else if (q.type === 'mcq') {
            const selectedOpt = session.answers[q.id];
            container.innerHTML = `
                <div class="test-mcq-layout">
                    <div class="mcq-question-card">
                        <div class="problem-meta-bar">
                            <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                            <span class="q-topic-tag">${q.subjectId.toUpperCase()} • ${q.topic}</span>
                            ${isMarked ? `<span class="badge-review-flag">🟣 Marked for Review</span>` : ''}
                        </div>
                        <h2 class="mcq-question-title">${q.question}</h2>

                        <div class="mcq-options-container">
                            ${(q.options || []).map((opt, optIdx) => `
                                <label class="mcq-option-card ${selectedOpt === optIdx ? 'selected' : ''}" onclick="TestEngine.selectMcqOption('${q.id}', ${optIdx})">
                                    <input type="radio" name="mcq_${q.id}" value="${optIdx}" ${selectedOpt === optIdx ? 'checked' : ''}>
                                    <span class="mcq-bullet">${String.fromCharCode(65 + optIdx)}</span>
                                    <span class="mcq-text">${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else if (q.type === 'conceptual') {
            const currentVal = session.answers[q.id] || '';
            container.innerHTML = `
                <div class="test-mcq-layout">
                    <div class="mcq-question-card">
                        <div class="problem-meta-bar">
                            <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                            <span class="q-topic-tag">${q.subjectId.toUpperCase()} • ${q.topic}</span>
                            ${isMarked ? `<span class="badge-review-flag">🟣 Marked for Review</span>` : ''}
                        </div>
                        <h2 class="mcq-question-title">${q.question}</h2>
                        <div style="margin-top: 16px;">
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 13.5px;">Architectural Explanation & Trade-off Analysis:</label>
                            <textarea id="conceptualInput_${q.id}" class="form-textarea" rows="8" placeholder="Detail your architectural approach, tradeoffs, and complexity intuition..." oninput="TestEngine.onConceptualInput('${q.id}', this.value)">${currentVal}</textarea>
                        </div>
                    </div>
                </div>
            `;
        }

        this.renderPalette();
        this.updateFooterButtons();
    },

    /**
     * Initialize Monaco Editor or fallback
     */
    disposeMonacoEditor() {
        if (this.monacoEditor) {
            try { this.monacoEditor.dispose(); } catch (e) {}
            this.monacoEditor = null;
        }
        if (typeof MonacoLoader !== 'undefined' && MonacoLoader.setEditor) {
            MonacoLoader.setEditor(null);
        }
    },

    initMonacoEditor(code, language) {
        const container = document.getElementById('monacoEditorContainer');
        if (!container) return;

        // Map language identifier
        const monacoLang = language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : 'javascript';

        if (window.monaco && window.monaco.editor) {
            this._setupMonacoInstance(container, code, monacoLang);
        } else if (typeof window.loadMonaco === 'function') {
            this._renderFallbackEditor(container, code);
            window.loadMonaco().then(() => {
                const currentContainer = document.getElementById('monacoEditorContainer');
                if (currentContainer && window.monaco && window.monaco.editor) {
                    const currentCode = this.getCurrentEditorCode() || code;
                    this._setupMonacoInstance(currentContainer, currentCode, monacoLang);
                }
            }).catch(err => {
                console.warn('[TestEngine] Monaco load failed, continuing with fallback:', err);
            });
        } else {
            this._renderFallbackEditor(container, code);
        }
    },

    _setupMonacoInstance(container, code, monacoLang) {
        if (this.monacoEditor) {
            try { this.monacoEditor.dispose(); } catch (e) {}
            this.monacoEditor = null;
        }
        container.innerHTML = '';
        this.monacoEditor = window.monaco.editor.create(container, {
            value: code,
            language: monacoLang,
            theme: 'vs-dark',
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4
        });
        if (typeof MonacoLoader !== 'undefined') {
            MonacoLoader.setEditor(this.monacoEditor);
        }

        // Keyboard shortcut inside Monaco: Ctrl/Cmd + Enter -> Run Code
        this.monacoEditor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, () => {
            TestEngine.runCode(false);
        });

        this.monacoEditor.onDidChangeModelContent(() => {
            const updatedCode = this.monacoEditor.getValue();
            const session = this.currentSession;
            if (session) {
                const q = session.questions[session.currentIndex];
                if (q) {
                    const draftKey = `${q.id}_${this.activeLanguage}`;
                    session.codes = session.codes || {};
                    session.codes[draftKey] = updatedCode;
                    session.answers[q.id] = updatedCode;
                    this.renderTopBar();
                    this.renderPalette();
                }
            }
        });
    },

    _renderFallbackEditor(container, code) {
        container.innerHTML = `
            <textarea id="fallbackEditor" class="fallback-code-editor" spellcheck="false">${code}</textarea>
        `;
        const editorEl = document.getElementById('fallbackEditor');
        if (editorEl) {
            editorEl.addEventListener('input', (e) => {
                const session = this.currentSession;
                if (session) {
                    const q = session.questions[session.currentIndex];
                    if (q) {
                        const draftKey = `${q.id}_${this.activeLanguage}`;
                        session.codes = session.codes || {};
                        session.codes[draftKey] = e.target.value;
                        session.answers[q.id] = e.target.value;
                        this.renderTopBar();
                        this.renderPalette();
                    }
                }
            });
            // Handle tab key & Ctrl+Enter in fallback
            editorEl.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    TestEngine.runCode(false);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = editorEl.selectionStart;
                    const end = editorEl.selectionEnd;
                    editorEl.value = editorEl.value.substring(0, start) + '    ' + editorEl.value.substring(end);
                    editorEl.selectionStart = editorEl.selectionEnd = start + 4;
                }
            });
        }
    },

    saveCurrentCodeDraft() {
        if (!this.currentSession) return;
        const q = this.currentSession.questions[this.currentSession.currentIndex];
        if (!q || q.type !== 'coding') return;

        let code = '';
        if (this.monacoEditor) {
            code = this.monacoEditor.getValue();
        } else {
            const el = document.getElementById('fallbackEditor');
            if (el) code = el.value;
        }

        if (code !== undefined) {
            const draftKey = `${q.id}_${this.activeLanguage}`;
            this.currentSession.codes = this.currentSession.codes || {};
            this.currentSession.codes[draftKey] = code;
            this.currentSession.answers[q.id] = code;
        }
    },

    getCurrentEditorCode() {
        if (this.monacoEditor) return this.monacoEditor.getValue();
        const el = document.getElementById('fallbackEditor');
        return el ? el.value : '';
    },

    onLanguageChange(newLang) {
        if (newLang === this.activeLanguage) return;
        const prevLang = this.activeLanguage;
        const selectEl = document.getElementById('testLangSelect');

        const confirmSwitch = confirm('Switch language and replace current code with the new starter template?\n\nClick OK to switch, or Cancel to keep your current code.');
        if (!confirmSwitch) {
            if (selectEl) selectEl.value = prevLang;
            return;
        }

        // Save current language draft before switching
        this.saveCurrentCodeDraft();

        this.activeLanguage = newLang;
        const session = this.currentSession;
        if (!session) return;
        const q = session.questions[session.currentIndex];
        if (!q || q.type !== 'coding') return;

        const draftKey = `${q.id}_${newLang}`;
        session.codes = session.codes || {};
        let code = session.codes[draftKey];
        if (code === undefined) {
            code = (q.starterCode && q.starterCode[newLang]) ? q.starterCode[newLang] : '';
            session.codes[draftKey] = code;
        }
        this.initMonacoEditor(code, newLang);
    },

    resetStarterCode() {
        const session = this.currentSession;
        if (!session) return;
        const q = session.questions[session.currentIndex];
        if (!q || q.type !== 'coding') return;

        const confirmReset = confirm('Reset your code to the original starter template?\n\nAll current edits for this question will be reverted to the clean starter template.');
        if (!confirmReset) return;

        const starterCode = (q.starterCode && q.starterCode[this.activeLanguage])
            ? q.starterCode[this.activeLanguage]
            : (q.starterCode?.javascript || '');

        const draftKey = `${q.id}_${this.activeLanguage}`;
        session.codes = session.codes || {};
        session.codes[draftKey] = starterCode;
        session.answers[q.id] = starterCode;
        Store.saveActiveTestSession(session);
        this.initMonacoEditor(starterCode, this.activeLanguage);
        this.renderTopBar();
        this.renderPalette();
    },

    selectMcqOption(qId, optIdx) {
        if (!this.currentSession) return;
        this.currentSession.answers[qId] = optIdx;
        Store.saveActiveTestSession(this.currentSession);
        this.renderCurrentQuestion();
    },

    onConceptualInput(qId, val) {
        if (!this.currentSession) return;
        this.currentSession.answers[qId] = val;
        Store.saveActiveTestSession(this.currentSession);
        this.renderTopBar();
        this.renderPalette();
    },

    switchConsoleTab(tab) {
        const inputBtn = document.getElementById('tabBtnCustomInput');
        const outputBtn = document.getElementById('tabBtnOutput');
        const historyBtn = document.getElementById('tabBtnHistory');
        const inputPanel = document.getElementById('consoleTabContentInput');
        const outputPanel = document.getElementById('consoleTabContentOutput');
        const historyPanel = document.getElementById('consoleTabContentHistory');

        [inputBtn, outputBtn, historyBtn].forEach(b => b && b.classList.remove('active'));
        [inputPanel, outputPanel, historyPanel].forEach(p => p && p.classList.remove('active'));

        if (tab === 'input') {
            if (inputBtn) inputBtn.classList.add('active');
            if (inputPanel) inputPanel.classList.add('active');
        } else if (tab === 'history') {
            if (historyBtn) historyBtn.classList.add('active');
            if (historyPanel) {
                historyPanel.classList.add('active');
                const session = this.currentSession;
                if (session) {
                    const q = session.questions[session.currentIndex];
                    const histView = document.getElementById('consoleHistoryView');
                    if (histView && q) histView.innerHTML = this.renderSubmissionHistoryList(q.id);
                }
            }
        } else {
            if (outputBtn) outputBtn.classList.add('active');
            if (outputPanel) outputPanel.classList.add('active');
        }
    },

    renderSubmissionHistoryList(qId) {
        const session = this.currentSession;
        if (!session) return '<div class="empty-history-text">No submissions yet.</div>';

        const history = session.submissionHistory?.[qId] || [];
        if (history.length === 0) {
            return `<div class="empty-history-text">No submissions yet for this question. Click "Submit Code" to evaluate your solution.</div>`;
        }

        return `
            <div class="submission-history-table-wrap">
                <table class="submission-history-table">
                    <thead>
                        <tr>
                            <th>Attempt</th>
                            <th>Verdict</th>
                            <th>Passed</th>
                            <th>Runtime</th>
                            <th>Language</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td><b>Attempt ${h.attempt}</b></td>
                                <td>
                                    ${h.status === 'ACCEPTED' ? '<span class="hist-badge-accepted">✅ Accepted</span>' :
                                      h.status === 'WRONG_ANSWER' ? '<span class="hist-badge-wrong">❌ Wrong Answer</span>' :
                                      h.status === 'TLE' ? '<span class="hist-badge-tle">⏱️ Time Limit Exceeded</span>' :
                                      h.status === 'COMPILE_ERROR' ? '<span class="hist-badge-compile">⚠️ Compilation Error</span>' :
                                      '<span class="hist-badge-err">💥 Runtime Error</span>'}
                                </td>
                                <td><b>${h.passedCount} / ${h.totalCount}</b></td>
                                <td>${h.timeMs} ms</td>
                                <td><span class="lang-pill">${(h.language || 'CPP').toUpperCase()}</span></td>
                                <td>${h.timestamp}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Run Code (Custom/Sample) or Submit Code (Full Hidden Test Suite)
     */
    async runCode(isSubmit = false) {
        const session = this.currentSession;
        if (!session) return;
        const q = session.questions[session.currentIndex];
        if (!q || q.type !== 'coding') return;

        const code = this.getCurrentEditorCode();
        if (!code || !code.trim()) {
            alert('Please write code before running.');
            return;
        }

        this.switchConsoleTab('output');
        const outputView = document.getElementById('consoleOutputView');
        const compilerName = this.activeLanguage === 'cpp' ? 'g++ C++17 (GCC 14.1.0)' : this.activeLanguage === 'python' ? 'Python 3 (CPython)' : 'JavaScript V8';
        if (outputView) {
            outputView.innerHTML = `
                <div class="running-spinner">
                    <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px;">⚙ Compiling with ${compilerName}...</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${isSubmit ? 'Running evaluation against hidden test cases...' : 'Executing against sample / custom input...'}</div>
                </div>
            `;
        }

        const customInput = document.getElementById('customInputText')?.value || '';

        // Combine sample and hidden cases for full submission
        const allTestCases = isSubmit
            ? [...(q.sampleCases || []), ...(q.hiddenCases || [])]
            : (q.sampleCases || []);

        const result = await CodeRunner.executeCode({
            language: this.activeLanguage,
            code,
            functionName: q.functionName,
            questionId: q.id,
            testCases: allTestCases,
            isCustom: !isSubmit,
            customInput
        });

        // Record submission state & history
        if (isSubmit) {
            session.submissionHistory = session.submissionHistory || {};
            session.submissionHistory[q.id] = session.submissionHistory[q.id] || [];
            const attemptNo = session.submissionHistory[q.id].length + 1;
            session.submissionHistory[q.id].push({
                attempt: attemptNo,
                status: result.status,
                passedCount: result.passedCount || 0,
                totalCount: result.totalCount || allTestCases.length,
                timeMs: result.timeMs || 0,
                language: this.activeLanguage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });

            session.codeSubmissions[q.id] = {
                status: result.status,
                passedCount: result.passedCount,
                totalCount: result.totalCount,
                timeMs: result.timeMs,
                code,
                language: this.activeLanguage,
                submittedAt: DateUtils.nowISO()
            };
            Store.saveActiveTestSession(this.currentSession);
            this.renderTopBar();
            this.renderPalette();
            this.updateFooterButtons();
            const badgeEl = document.getElementById('codingStatusBadge');
            if (badgeEl) badgeEl.innerHTML = this.renderCodingQuestionStatus(q.id);
        }

        // Render formatted terminal output
        if (outputView) {
            let statusBadge = '';
            let compilationBadge = '';

            if (result.status === 'COMPILE_ERROR') {
                compilationBadge = `<div class="compilation-status-badge compilation-err">❌ Compilation Error (${result.compiler || compilerName})</div>`;
                statusBadge = `<span class="verdict-compile">❌ Compilation / Syntax Error</span>`;
            } else {
                compilationBadge = `<div class="compilation-status-badge compilation-ok">✓ Compilation successful (${result.compiler || compilerName})</div>`;
                if (result.status === 'ACCEPTED') statusBadge = `<span class="verdict-accepted">✅ Accepted</span>`;
                else if (result.status === 'WRONG_ANSWER') statusBadge = `<span class="verdict-wrong">❌ Wrong Answer</span>`;
                else if (result.status === 'TLE') statusBadge = `<span class="verdict-tle">⏱️ Time Limit Exceeded</span>`;
                else if (result.status === 'MLE') statusBadge = `<span class="verdict-mle">💥 Memory Limit Exceeded</span>`;
                else if (result.status === 'RUNTIME_ERROR') statusBadge = `<span class="verdict-runtime">💥 Runtime Error</span>`;
                else if (result.status === 'CUSTOM_SUCCESS') statusBadge = `<span class="verdict-custom">▶ Output Received</span>`;
            }

            let customCardHtml = '';
            if (result.status === 'CUSTOM_SUCCESS') {
                const sampleExpected = (q.sampleCases && q.sampleCases[0]) ? q.sampleCases[0].expected : undefined;
                customCardHtml = `
                    <div class="custom-run-io-card">
                        <div class="io-label">Input:</div>
                        <pre>${result.input || customInput || (q.sampleCases && q.sampleCases[0] ? JSON.stringify(q.sampleCases[0].args) : 'Custom Test')}</pre>
                        <div class="io-label">Output:</div>
                        <pre style="color: #38bdf8; font-weight: 700;">${result.result !== undefined ? (typeof result.result === 'object' ? JSON.stringify(result.result) : result.result) : 'void'}</pre>
                        ${sampleExpected !== undefined ? `<div class="io-label">Expected (Sample #1):</div><pre style="color: #94a3b8;">${typeof sampleExpected === 'object' ? JSON.stringify(sampleExpected) : sampleExpected}</pre>` : ''}
                    </div>
                `;
            }

            let detailsHtml = '';
            if (result.failedCase) {
                const isSampleCase = result.failedCase.index <= (q.sampleCases ? q.sampleCases.length : 0);
                if (isSampleCase || !isSubmit) {
                    detailsHtml = `
                        <div class="failed-test-case-card">
                            <div><b>Failed Test Case #${result.failedCase.index}:</b></div>
                            <div>Input: <code>${result.failedCase.input}</code></div>
                            <div>Expected: <code>${result.failedCase.expected}</code></div>
                            ${result.failedCase.actual !== undefined ? `<div>Your Output: <code class="diff-output">${result.failedCase.actual}</code></div>` : ''}
                            ${result.failedCase.reason ? `<div style="color: #f87171; font-size: 12px; margin-top: 5px;">Diagnostic: ${result.failedCase.reason}</div>` : ''}
                        </div>
                    `;
                } else {
                    // Do NOT reveal hidden test inputs
                    detailsHtml = `
                        <div class="failed-test-case-card">
                            <div><b>❌ Failed on Hidden Test Case #${result.failedCase.index}</b></div>
                            <div style="color: #fca5a5; font-size: 12px; margin-top: 4px;">
                                Verdict: <b>${result.status === 'WRONG_ANSWER' ? 'Wrong Answer (Output did not satisfy test criteria)' : result.status}</b>
                            </div>
                            <div style="color: var(--text-secondary); font-size: 11.5px; margin-top: 4px;">
                                Hidden test case inputs and expected outputs are protected to uphold assessment integrity.
                            </div>
                        </div>
                    `;
                }
            }

            let logsHtml = '';
            if (result.logs && result.logs.length > 0) {
                logsHtml = `
                    <div class="stdout-console">
                        <b>Standard Output (stdout):</b>
                        <pre>${result.logs.join('\n')}</pre>
                    </div>
                `;
            }

            let errorHtml = '';
            if (result.error) {
                errorHtml = `
                    <div class="error-traceback">
                        <pre style="margin: 0; white-space: pre-wrap; font-family: Consolas, monospace; font-size: 12px; color: #fca5a5;">${result.error}</pre>
                    </div>
                `;
            }

            outputView.innerHTML = `
                ${compilationBadge}
                <div class="terminal-result-header">
                    ${statusBadge}
                    ${result.totalCount ? `<span class="pass-count">Test Cases Passed: <b>${result.passedCount} / ${result.totalCount}</b></span>` : ''}
                    <span class="runtime-ms">⏱️ Runtime: <b>${result.timeMs || 0} ms</b></span>
                    ${result.memoryMb ? `<span class="memory-mb" style="color: #94a3b8; font-size: 11.5px;">💾 Memory: <b>${result.memoryMb} MB</b></span>` : ''}
                </div>
                ${customCardHtml}
                ${errorHtml}
                ${detailsHtml}
                ${logsHtml}
            `;
        }
    },

    renderCodingQuestionStatus(qId) {
        const sub = this.currentSession?.codeSubmissions?.[qId];
        const attempts = this.currentSession?.submissionHistory?.[qId]?.length || 0;
        const attemptsText = attempts > 0 ? `(${attempts} ${attempts === 1 ? 'attempt' : 'attempts'})` : '';

        if (!sub) return `<span class="badge-not-attempted">⚪ Not Attempted</span>`;
        if (sub.status === 'ACCEPTED') return `<span class="badge-sub-accepted">✅ Accepted (${sub.passedCount}/${sub.totalCount}) ${attemptsText}</span>`;
        if (sub.status === 'WRONG_ANSWER') return `<span class="badge-sub-wrong">❌ Wrong Answer (${sub.passedCount}/${sub.totalCount}) ${attemptsText}</span>`;
        if (sub.status === 'TLE') return `<span class="badge-sub-tle">⏱️ TLE ${attemptsText}</span>`;
        return `<span class="badge-sub-err">⚠️ Submission Error ${attemptsText}</span>`;
    },

    /**
     * 5-State Question Palette
     */
    renderPalette() {
        const palletGrid = document.getElementById('testPaletteGrid');
        if (!palletGrid || !this.currentSession) return;

        const session = this.currentSession;
        palletGrid.innerHTML = session.questions.map((q, idx) => {
            const isCurrent = session.currentIndex === idx;
            const isMarked = session.reviewFlags.includes(idx);
            
            let isAnswered = false;
            const ans = session.answers[q.id];
            if (q.type === 'coding') {
                isAnswered = !!(session.codeSubmissions[q.id] && session.codeSubmissions[q.id].status === 'ACCEPTED');
                if (!isAnswered && ans && ans.trim() && ans !== q.starterCode?.javascript && ans !== q.starterCode?.cpp && ans !== q.starterCode?.python) isAnswered = true;
            } else if (ans !== undefined && ans !== null && ans !== '') {
                isAnswered = true;
            }

            let statusClass = 'unanswered';
            if (isCurrent) statusClass = 'current';
            else if (isAnswered && isMarked) statusClass = 'answered-marked';
            else if (isMarked) statusClass = 'marked';
            else if (isAnswered) statusClass = 'answered';

            return `
                <button class="palette-num-btn ${statusClass}" onclick="TestEngine.jumpToQuestion(${idx})" title="Question ${idx + 1} (${q.subjectId.toUpperCase()})">
                    ${idx + 1}
                </button>
            `;
        }).join('');
    },

    /**
     * Navigate to Previous Question
     */
    prevQuestion() {
        if (!this.currentSession || this.currentSession.isCompleted) return;
        this.saveCurrentCodeDraft();
        if (this.currentSession.currentIndex > 0) {
            this.currentSession.currentIndex--;
            Store.saveActiveTestSession(this.currentSession);
            this.renderTopBar();
            this.renderCurrentQuestion();
            this.renderPalette();
            this.updateFooterButtons();
        }
    },

    /**
     * Navigate to Next Question
     */
    nextQuestion() {
        if (!this.currentSession || this.currentSession.isCompleted) return;
        this.saveCurrentCodeDraft();
        if (this.currentSession.currentIndex < this.currentSession.questions.length - 1) {
            this.currentSession.currentIndex++;
            Store.saveActiveTestSession(this.currentSession);
            this.renderTopBar();
            this.renderCurrentQuestion();
            this.renderPalette();
            this.updateFooterButtons();
        }
    },

    /**
     * Save Current Answer/Code and advance to next question
     * If already on the last question, show Submit Test / Finish Test instead of doing nothing.
     */
    saveAndNext() {
        if (!this.currentSession || this.currentSession.isCompleted) return;
        this.saveCurrentCodeDraft();

        const session = this.currentSession;
        const q = session.questions[session.currentIndex];
        if (q && q.type === 'coding') {
            const draftKey = `${q.id}_${this.activeLanguage}`;
            const code = session.codes?.[draftKey] || this.getCurrentEditorCode();
            if (code && code.trim()) {
                session.codes = session.codes || {};
                session.codes[draftKey] = code;
                session.answers[q.id] = code;
            }
        }

        Store.saveActiveTestSession(session);
        this.showAutosaveBadge();

        if (session.currentIndex >= session.questions.length - 1) {
            // Already on last question -> prompt to finalize & submit
            this.confirmSubmitTest();
        } else {
            session.currentIndex++;
            Store.saveActiveTestSession(session);
            this.renderTopBar();
            this.renderCurrentQuestion();
            this.renderPalette();
            this.updateFooterButtons();
        }
    },

    /**
     * Jump directly to any question via Question Palette (1–N)
     */
    jumpToQuestion(index) {
        if (!this.currentSession || this.currentSession.isCompleted) return;
        if (index < 0 || index >= this.currentSession.questions.length) return;
        this.saveCurrentCodeDraft();
        this.currentSession.currentIndex = index;
        Store.saveActiveTestSession(this.currentSession);
        this.renderTopBar();
        this.renderCurrentQuestion();
        this.renderPalette();
        this.updateFooterButtons();
    },

    /**
     * Toggle Mark for Review for active question
     */
    toggleMarkReview() {
        if (!this.currentSession || this.currentSession.isCompleted) return;
        const idx = this.currentSession.currentIndex;
        this.currentSession.reviewFlags = this.currentSession.reviewFlags || [];
        const pos = this.currentSession.reviewFlags.indexOf(idx);
        if (pos > -1) {
            this.currentSession.reviewFlags.splice(pos, 1);
        } else {
            this.currentSession.reviewFlags.push(idx);
        }
        Store.saveActiveTestSession(this.currentSession);
        this.renderTopBar();
        this.renderPalette();
        this.updateFooterButtons();

        // Also update workbench header badge if present
        const metaBar = document.querySelector('.problem-meta-bar');
        if (metaBar) {
            let flagBadge = metaBar.querySelector('.badge-review-flag');
            const isMarked = this.currentSession.reviewFlags.includes(idx);
            if (isMarked && !flagBadge) {
                const badge = document.createElement('span');
                badge.className = 'badge-review-flag';
                badge.textContent = '🟣 Marked for Review';
                metaBar.appendChild(badge);
            } else if (!isMarked && flagBadge) {
                flagBadge.remove();
            }
        }
    },

    /**
     * Exit Test with confirmation, preserving all progress safely
     */
    exitTest() {
        if (!this.currentSession || this.currentSession.isCompleted) {
            this.disposeMonacoEditor();
            const container = document.getElementById('weeklyTestFullScreen');
            if (container) container.style.display = 'none';
            document.body.style.overflow = 'auto';
            return;
        }

        const confirmLeave = confirm('Are you sure you want to leave? Your progress has been saved.');
        if (!confirmLeave) return;

        this.saveCurrentCodeDraft();
        this.currentSession.activeLanguage = this.activeLanguage;
        Store.saveActiveTestSession(this.currentSession);

        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.autosaveInterval) clearInterval(this.autosaveInterval);
        this.disposeMonacoEditor();

        const container = document.getElementById('weeklyTestFullScreen');
        if (container) container.style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    /**
     * Update state & labels of footer buttons (Previous, Next, Save & Next, Mark for Review)
     */
    updateFooterButtons() {
        if (!this.currentSession) return;
        const session = this.currentSession;
        const isLast = session.currentIndex >= session.questions.length - 1;
        const isFirst = session.currentIndex === 0;
        const isMarked = (session.reviewFlags || []).includes(session.currentIndex);

        const btnSaveNext = document.getElementById('btnSaveAndNext');
        if (btnSaveNext) {
            if (isLast) {
                btnSaveNext.textContent = 'Submit Test ✓';
                btnSaveNext.classList.add('last-question-submit');
            } else {
                btnSaveNext.textContent = 'Save & Next →';
                btnSaveNext.classList.remove('last-question-submit');
            }
        }

        const btnPrev = document.getElementById('btnPrevQuestion');
        if (btnPrev) {
            btnPrev.disabled = isFirst;
            btnPrev.style.opacity = isFirst ? '0.4' : '1';
            btnPrev.style.cursor = isFirst ? 'not-allowed' : 'pointer';
        }

        const btnNext = document.getElementById('btnNextQuestion');
        if (btnNext) {
            btnNext.disabled = isLast;
            btnNext.style.opacity = isLast ? '0.4' : '1';
            btnNext.style.cursor = isLast ? 'not-allowed' : 'pointer';
        }

        const btnReview = document.getElementById('btnMarkReview');
        if (btnReview) {
            if (isMarked) {
                btnReview.innerHTML = '🟣 Marked (Click to Unmark)';
                btnReview.classList.add('marked-active');
            } else {
                btnReview.innerHTML = '🟣 Mark for Review';
                btnReview.classList.remove('marked-active');
            }
        }
    },

    /**
     * Confirmation Modal before Submission
     */
    confirmSubmitTest() {
        const modal = document.getElementById('testSubmitConfirmModal');
        if (!modal || !this.currentSession) return;

        let answered = 0;
        this.currentSession.questions.forEach(q => {
            const a = this.currentSession.answers[q.id];
            if (q.type === 'coding') {
                if (this.currentSession.codeSubmissions[q.id]?.status === 'ACCEPTED') answered++;
            } else if (a !== undefined && a !== null && a !== '') answered++;
        });

        const marked = this.currentSession.reviewFlags.length;
        const unanswered = this.currentSession.totalQuestions - answered;

        document.getElementById('confirmAnsCount').textContent = answered;
        document.getElementById('confirmUnansCount').textContent = unanswered;
        document.getElementById('confirmMarkedCount').textContent = marked;

        modal.classList.add('active');
    },

    closeConfirmModal() {
        const modal = document.getElementById('testSubmitConfirmModal');
        if (modal) modal.classList.remove('active');
    },

    /**
     * Finalize submission and score calculation
     */
    finalizeSubmission(autoSubmit = false) {
        this.closeConfirmModal();
        if (!this.currentSession) return;

        clearInterval(this.timerInterval);
        clearInterval(this.autosaveInterval);
        this.saveCurrentCodeDraft();

        const session = this.currentSession;
        session.isCompleted = true;

        let correct = 0;
        let wrong = 0;
        let skipped = 0;

        const categoryScores = {};
        const weakTopics = [];
        const strongTopics = [];
        const questionAnalysisList = [];

        session.questions.forEach((q, i) => {
            const cat = q.subjectId.toUpperCase();
            if (!categoryScores[cat]) categoryScores[cat] = { total: 0, correct: 0 };
            categoryScores[cat].total++;

            const ans = session.answers[q.id];
            let isCorrect = false;
            let isSkipped = false;
            let userDisplayAnswer = '';

            if (q.type === 'mcq') {
                if (ans === undefined || ans === null || ans === '') {
                    isSkipped = true;
                    userDisplayAnswer = 'Not Attempted';
                } else {
                    userDisplayAnswer = q.options ? q.options[ans] : String(ans);
                    isCorrect = (ans === q.correctAnswer);
                }
            } else if (q.type === 'coding') {
                const sub = session.codeSubmissions[q.id];
                userDisplayAnswer = ans ? 'Code Submitted' : 'No Code Written';
                if (!sub || !ans || ans.trim() === q.starterCode?.javascript) {
                    isSkipped = true;
                } else if (sub.status === 'ACCEPTED') {
                    isCorrect = true;
                } else {
                    isCorrect = false;
                }
            } else if (q.type === 'conceptual') {
                if (!ans || ans.trim().length < 10) {
                    isSkipped = true;
                    userDisplayAnswer = 'Not Attempted';
                } else if (ans.trim().length >= 30) {
                    isCorrect = true;
                    userDisplayAnswer = ans;
                } else {
                    isCorrect = false;
                    userDisplayAnswer = ans;
                }
            }

            if (isSkipped) {
                skipped++;
            } else if (isCorrect) {
                correct++;
                categoryScores[cat].correct++;
                strongTopics.push({ topic: q.topic, subject: q.subjectId });
            } else {
                wrong++;
                weakTopics.push({ topic: q.topic, subject: q.subjectId });
            }

            questionAnalysisList.push({
                index: i + 1,
                id: q.id,
                title: q.title || q.question,
                subject: q.subjectId,
                topic: q.topic,
                difficulty: q.difficulty,
                type: q.type,
                userAnswer: userDisplayAnswer,
                correctAnswer: q.type === 'mcq' && q.options ? q.options[q.correctAnswer] : (q.explanation || 'See reference solution'),
                isCorrect,
                isSkipped,
                explanation: q.explanation,
                codeSubmission: session.codeSubmissions[q.id] || null,
                referenceSolution: q.referenceSolution || null
            });
        });

        const totalAttempted = correct + wrong;
        const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
        const overallScore = Math.round((correct / session.totalQuestions) * 100);
        const timeTakenSeconds = (session.durationMinutes * 60) - session.durationSeconds;

        const resultRecord = {
            id: session.id,
            date: session.date,
            durationSeconds: Math.max(0, timeTakenSeconds),
            score: overallScore,
            correctCount: correct,
            wrongCount: wrong,
            skippedCount: skipped,
            totalCount: session.totalQuestions,
            accuracy,
            breakdown: categoryScores,
            weakTopics,
            strongTopics,
            questionAnalysis: questionAnalysisList,
            boundarySnapshot: session.boundarySnapshot
        };

        // Save to persistent storage
        Store.saveWeeklyTestResult(resultRecord);
        Store.clearActiveTestSession();

        // Close full-screen test container and dispose editor
        this.disposeMonacoEditor();
        const container = document.getElementById('weeklyTestFullScreen');
        if (container) container.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Display results
        this.showAnalysis(resultRecord);
    },

    /**
     * Show Result & Performance Analysis Dashboard
     */
    showAnalysis(test) {
        this.lastAnalyzedTest = test;
        const modal = document.getElementById('testAnalysisModal');
        const body = document.getElementById('testAnalysisModalBody');
        if (!modal || !body) return;

        // Dedup weak topics
        const uniqueWeak = [];
        (test.weakTopics || []).forEach(w => {
            if (!uniqueWeak.some(u => u.topic.toLowerCase() === w.topic.toLowerCase())) {
                uniqueWeak.push(w);
            }
        });

        // Dedup strong topics
        const uniqueStrong = [];
        (test.strongTopics || []).forEach(s => {
            if (!uniqueStrong.some(u => u.topic.toLowerCase() === s.topic.toLowerCase())) {
                uniqueStrong.push(s);
            }
        });

        // Subject breakdown HTML
        const breakdownHtml = Object.keys(test.breakdown || {}).map(k => {
            const b = test.breakdown[k];
            const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
            return `
                <div class="analysis-breakdown-card">
                    <div class="breakdown-head">
                        <b>${k}</b>
                        <span>${b.correct} / ${b.total} (${pct}%)</span>
                    </div>
                    <div class="cat-bar-wrap">
                        <div class="cat-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Detailed question review items
        const questionReviewHtml = (test.questionAnalysis || []).map(q => {
            const verdictClass = q.isCorrect ? 'correct' : q.isSkipped ? 'skipped' : 'wrong';
            const verdictIcon = q.isCorrect ? '✅' : q.isSkipped ? '⚪' : '❌';

            return `
                <div class="review-question-card ${verdictClass}">
                    <div class="review-q-header">
                        <span class="review-q-num">${verdictIcon} Question ${q.index} • ${q.subject.toUpperCase()} (${q.topic})</span>
                        <span class="q-diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                    </div>
                    <h4 class="review-q-title">${q.title}</h4>

                    <div class="review-answer-grid">
                        <div class="review-ans-box user-ans">
                            <span>Your Submission:</span>
                            <b>${q.userAnswer}</b>
                        </div>
                        <div class="review-ans-box correct-ans">
                            <span>Correct / Reference:</span>
                            <b>${q.correctAnswer}</b>
                        </div>
                    </div>

                    ${q.codeSubmission ? `
                        <div class="review-code-details">
                            <div>Passed Cases: <b>${q.codeSubmission.passedCount} / ${q.codeSubmission.totalCount}</b> | Runtime: <b>${q.codeSubmission.timeMs}ms</b></div>
                            <pre class="review-code-snippet">${q.codeSubmission.code}</pre>
                        </div>
                    ` : ''}

                    ${q.referenceSolution ? `
                        <details class="review-ref-solution-details">
                            <summary><b>💻 View Reference Solution & Editorial</b></summary>
                            <div class="ref-code-tabs">
                                ${q.referenceSolution.cpp ? `<div><span class="lang-tag">C++ (GCC):</span><pre class="review-code-snippet">${q.referenceSolution.cpp}</pre></div>` : ''}
                                ${q.referenceSolution.python ? `<div><span class="lang-tag">Python 3:</span><pre class="review-code-snippet">${q.referenceSolution.python}</pre></div>` : ''}
                                ${q.referenceSolution.javascript ? `<div><span class="lang-tag">JavaScript:</span><pre class="review-code-snippet">${q.referenceSolution.javascript}</pre></div>` : ''}
                            </div>
                        </details>
                    ` : ''}

                    ${q.explanation ? `
                        <div class="review-explanation-box">
                            <b>💡 Technical Concept & Solution Intuition:</b>
                            <p>${q.explanation}</p>
                        </div>
                    ` : ''}

                    ${!q.isCorrect ? `
                        <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                            <button class="action-btn-ghost" style="color: var(--rose); border-color: rgba(244,63,94,0.4); font-size: 11.5px; padding: 5px 10px; font-weight: 600;" onclick="MistakeBank.openAddModal({ question: '${(q.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}', subject: '${q.subject}', topic: '${q.topic}', source: 'Sunday Weekly Test', userAnswer: '${(q.userAnswer || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}', correctAnswer: '${(q.correctAnswer || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}', explanation: '${(q.explanation || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}' })">
                                ⚠️ Add to Mistake Bank
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        const timeTakenMins = Math.floor((test.durationSeconds || 0) / 60);
        const timeTakenSecs = (test.durationSeconds || 0) % 60;

        body.innerHTML = `
            <div class="test-result-dashboard">
                <!-- Hero Score -->
                <div class="result-hero-box">
                    <div class="hero-score-circle">
                        <span class="hero-score-val">${test.score}%</span>
                        <span class="hero-score-sub">Overall Score</span>
                    </div>
                    <div class="hero-stats-grid">
                        <div class="stat-pill">
                            <span>Accuracy</span>
                            <b>${test.accuracy}%</b>
                        </div>
                        <div class="stat-pill">
                            <span>Time Taken</span>
                            <b>${timeTakenMins}m ${timeTakenSecs}s</b>
                        </div>
                        <div class="stat-pill green">
                            <span>Correct</span>
                            <b>${test.correctCount || 0}</b>
                        </div>
                        <div class="stat-pill red">
                            <span>Wrong</span>
                            <b>${test.wrongCount || 0}</b>
                        </div>
                        <div class="stat-pill gray">
                            <span>Skipped</span>
                            <b>${test.skippedCount || 0}</b>
                        </div>
                    </div>
                </div>

                <!-- Subject Breakdown -->
                <div class="analysis-section-title">📊 Subject & Category Performance</div>
                <div class="analysis-breakdown-grid">
                    ${breakdownHtml}
                </div>

                <!-- AI Test Analysis Card (Part 8) -->
                <div class="ai-test-analysis-card" id="aiTestAnalysisBox" style="background: rgba(16, 22, 32, 0.85); border: 1px solid var(--border-gold); border-radius: var(--radius-md); padding: 16px; margin: 18px 0;">
                    <div class="ai-test-head" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 22px;">🤖</span>
                            <div>
                                <h4 style="margin: 0; color: #fff; font-size: 14px; font-weight: 700;">Gemini AI Test Deep-Dive</h4>
                                <span style="font-size: 11px; color: var(--text-muted);">Adaptive 5-point performance diagnosis & recovery guidance</span>
                            </div>
                        </div>
                        <button class="btn-primary" id="btnRunAiTestAnalysis" style="padding: 7px 14px; font-size: 12px;" onclick="TestEngine.runAiTestAnalysis()">
                            ✨ Generate AI Analysis
                        </button>
                    </div>
                    <div id="aiTestAnalysisResult" style="margin-top: 14px; display: none;"></div>
                </div>

                <!-- Analysis Engine: Strong vs Weak Areas -->
                <div class="analysis-insights-grid">
                    <div class="insights-card strong">
                        <h4>🔥 Strong Areas</h4>
                        ${uniqueStrong.length > 0 ? `
                            <ul class="topic-chip-list">
                                ${uniqueStrong.map(s => `<li>${s.topic} (${s.subject.toUpperCase()})</li>`).join('')}
                            </ul>
                        ` : '<p style="color: var(--text-muted);">None detected.</p>'}
                    </div>

                    <div class="insights-card weak">
                        <h4>⚠️ Weak Areas & Next Week Revision Focus</h4>
                        ${uniqueWeak.length > 0 ? `
                            <div class="weak-topics-actions">
                                ${uniqueWeak.map(w => `
                                    <div class="weak-topic-row">
                                        <span><b>${w.topic}</b> (${w.subject.toUpperCase()})</span>
                                        <button class="btn-add-revision" onclick="TestEngine.addRevisionToSchedule('${w.topic.replace(/'/g, "\\'")}', '${w.subject}')">
                                            🔁 Add Revision Task
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="color: var(--emerald);">✨ Flawless performance! No weak topics detected.</p>'}
                    </div>
                </div>

                <!-- Export Bar -->
                <div class="result-export-bar">
                    <button class="action-btn-ghost" onclick="TestEngine.exportReportJson(${JSON.stringify(test).replace(/"/g, '&quot;')})">
                        📥 Export JSON Report
                    </button>
                    <button class="action-btn-ghost" onclick="window.print()">
                        🖨️ Print / Save PDF
                    </button>
                </div>

                <!-- Detailed Question Review -->
                <div class="analysis-section-title" style="margin-top: 24px;">📝 Comprehensive Question-by-Question Review</div>
                <div class="review-questions-list">
                    ${questionReviewHtml}
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closeTestAnalysisModal() {
        const modal = document.getElementById('testAnalysisModal');
        if (modal) modal.classList.remove('active');
    },

    async runAiTestAnalysis() {
        const test = this.lastAnalyzedTest;
        const resultEl = document.getElementById('aiTestAnalysisResult');
        const btn = document.getElementById('btnRunAiTestAnalysis');
        if (!test || !resultEl) return;

        resultEl.style.display = 'block';
        resultEl.innerHTML = `
            <div style="padding: 14px; text-align: center; color: var(--text-secondary);">
                <span class="ai-spin" style="display: inline-block; font-size: 18px; animation: spin 1s linear infinite;">⚙️</span>
                <span style="margin-left: 8px;">Gemini is analyzing score, mistakes, accuracy & weak topics...</span>
            </div>
        `;
        if (btn) btn.disabled = true;

        try {
            const report = typeof AIEngine !== 'undefined'
                ? await AIEngine.analyzeTest(test)
                : null;

            if (!report) throw new Error('AI engine not available');

            resultEl.innerHTML = `
                <div class="ai-test-report-grid" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                    <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--emerald); padding: 10px 14px; border-radius: 4px;">
                        <b style="color: var(--emerald); font-size: 12.5px;">1. What Went Well:</b>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-primary);">${report.whatWentWell || 'Strong conceptual baseline demonstrated.'}</p>
                    </div>

                    <div style="background: rgba(244, 63, 94, 0.08); border-left: 3px solid var(--rose); padding: 10px 14px; border-radius: 4px;">
                        <b style="color: var(--rose); font-size: 12.5px;">2. Weak Areas Identified:</b>
                        <ul style="margin: 4px 0 0 18px; font-size: 13px; color: var(--text-primary);">
                            ${(report.weakAreas || []).map(w => `<li>${w}</li>`).join('') || '<li>None</li>'}
                        </ul>
                    </div>

                    <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid var(--amber); padding: 10px 14px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                            <b style="color: var(--amber); font-size: 12.5px;">3. Topics to Revise:</b>
                            <button class="action-btn-ghost" style="font-size: 11px; padding: 2px 8px; color: var(--gold);" onclick="TestEngine.scheduleAllAiRevisions(${JSON.stringify(report.topicsToRevise || []).replace(/"/g, '&quot;')})">
                                🔁 Auto-Schedule All to Calendar
                            </button>
                        </div>
                        <ul style="margin: 6px 0 0 18px; font-size: 13px; color: var(--text-primary);">
                            ${(report.topicsToRevise || []).map(t => `<li>${t}</li>`).join('') || '<li>All target topics on track</li>'}
                        </ul>
                    </div>

                    <div style="background: rgba(59, 130, 246, 0.08); border-left: 3px solid var(--blue); padding: 10px 14px; border-radius: 4px;">
                        <b style="color: var(--blue); font-size: 12.5px;">4. Recommended Practice:</b>
                        <ul style="margin: 4px 0 0 18px; font-size: 13px; color: var(--text-primary);">
                            ${(report.recommendedPractice || []).map(p => `<li>${p}</li>`).join('') || '<li>Standard problem sets</li>'}
                        </ul>
                    </div>

                    <div style="background: rgba(168, 85, 247, 0.08); border-left: 3px solid var(--purple); padding: 10px 14px; border-radius: 4px;">
                        <b style="color: var(--purple); font-size: 12.5px;">5. Suggested Next Study Session:</b>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-primary); font-weight: 500;">${report.suggestedNextSession || 'Continue with scheduled morning DSA and evening core development.'}</p>
                    </div>

                    <div style="font-size: 11px; color: var(--text-muted); text-align: right; margin-top: 4px;">
                        🔒 Test Engine Official Score (${test.score}%) verified. AI recommendations are diagnostic only.
                    </div>
                </div>
            `;
        } catch (e) {
            resultEl.innerHTML = `
                <div style="padding: 12px; border-radius: 6px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--amber); color: var(--text-primary); font-size: 12.5px;">
                    ⚠️ <b>AI temporarily unavailable. Your normal StudyOS features are still working.</b><br>
                    <span style="color: var(--text-secondary); margin-top: 4px; display: block;">
                        Deterministic evaluation: Test score ${test.score}%, accuracy ${test.accuracy}%.
                        ${(test.weakTopics || []).length > 0 ? `Focus on revising: ${test.weakTopics.map(w => w.topic).join(', ')}.` : 'Great job! Maintain daily DSA and Development consistency.'}
                    </span>
                </div>
            `;
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    scheduleAllAiRevisions(topics) {
        if (!Array.isArray(topics) || topics.length === 0) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        topics.forEach((top, idx) => {
            Store.addRevisionTask(dateStr, top, 'core_cs');
        });

        alert(`✅ Scheduled ${topics.length} revision tasks for tomorrow (${dateStr}) in your Daily Missions!`);
    },

    /**
     * Integrate with Study Plan: Add Revision Task directly into Store
     */
    addRevisionToSchedule(topic, subject) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        Store.addRevisionTask(dateStr, topic, subject);
        alert(`✅ Revision Task Scheduled!\n\n"Revise ${topic}" added to your study schedule for tomorrow (${dateStr}).`);
    },

    /**
     * Export Report as JSON
     */
    exportReportJson(testData) {
        const blob = new Blob([JSON.stringify(testData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weekly_Test_Report_${testData.date || 'Assessment'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Test History & Trend Graph Modal
     */
    openHistory() {
        const modal = document.getElementById('testHistoryModal');
        const list = document.getElementById('testHistoryList');
        if (!modal || !list) return;

        const history = Store.getWeeklyTestHistory();
        if (history.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">No weekly tests taken yet. Launch your first Sunday Test!</div>`;
        } else {
            // Render SVG trend chart
            const chartSvg = this.generateTrendChartSvg(history);

            list.innerHTML = `
                <div class="history-dashboard-wrap">
                    <div class="history-chart-card">
                        <div style="font-weight: 700; color: #fff; margin-bottom: 8px;">📈 Performance Trend Over Time</div>
                        ${chartSvg}
                    </div>

                    <div class="history-list-cards">
                        ${history.map(t => `
                            <div class="test-history-card" onclick="TestEngine.showAnalysis(${JSON.stringify(t).replace(/"/g, '&quot;')})">
                                <div class="hist-card-left">
                                    <div class="hist-date">Sunday Test — ${DateUtils.formatDateLong(t.date)}</div>
                                    <div class="hist-metrics">
                                        Score: <b>${t.score}%</b> • Accuracy: <b>${t.accuracy}%</b>
                                        ${t.weakTopics && t.weakTopics.length > 0 ? ` • Weak: <span style="color: var(--rose);">${t.weakTopics.map(w => w.topic).slice(0, 2).join(', ')}</span>` : ''}
                                    </div>
                                </div>
                                <button class="action-btn-ghost-sm">View Analysis →</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        modal.classList.add('active');
    },

    closeTestHistoryModal() {
        const modal = document.getElementById('testHistoryModal');
        if (modal) modal.classList.remove('active');
    },

    /**
     * Generate responsive SVG Performance Graph
     */
    generateTrendChartSvg(history) {
        if (!history || history.length === 0) return '';

        const points = [...history].reverse(); // Oldest to newest
        const width = 580;
        const height = 180;
        const padX = 40;
        const padY = 30;

        const chartW = width - (padX * 2);
        const chartH = height - (padY * 2);

        const scoreCoords = points.map((p, i) => {
            const x = padX + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2);
            const y = height - padY - ((p.score || 0) / 100) * chartH;
            return { x, y, score: p.score, date: p.date };
        });

        const scorePolyline = scoreCoords.map(c => `${c.x},${c.y}`).join(' ');

        return `
            <svg viewBox="0 0 ${width} ${height}" class="trend-chart-svg">
                <!-- Grid Lines -->
                <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="rgba(255,255,255,0.08)" />
                <text x="${padX - 8}" y="${padY + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">100%</text>
                
                <line x1="${padX}" y1="${padY + chartH / 2}" x2="${width - padX}" y2="${padY + chartH / 2}" stroke="rgba(255,255,255,0.08)" />
                <text x="${padX - 8}" y="${padY + chartH / 2 + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">50%</text>

                <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="rgba(255,255,255,0.15)" />
                <text x="${padX - 8}" y="${height - padY + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">0%</text>

                <!-- Score Line -->
                <polyline points="${scorePolyline}" fill="none" stroke="var(--accent-gold, #f59e0b)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                <!-- Data Dots -->
                ${scoreCoords.map(c => `
                    <circle cx="${c.x}" cy="${c.y}" r="5" fill="#0f1117" stroke="var(--accent-gold, #f59e0b)" stroke-width="2.5" />
                    <text x="${c.x}" y="${c.y - 10}" fill="#fff" font-size="11" font-weight="700" text-anchor="middle">${c.score}%</text>
                `).join('')}
            </svg>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.TestEngine = TestEngine;

    // Automatic recovery after page refresh
    window.addEventListener('DOMContentLoaded', () => {
        try {
            if (typeof Store !== 'undefined' && Store.getActiveTestSession) {
                const active = Store.getActiveTestSession();
                if (active && !active.isCompleted && active.targetEndTime > Date.now()) {
                    console.log('Restoring active weekly test session after browser refresh...');
                    TestEngine.currentSession = active;
                    TestEngine.activeLanguage = active.activeLanguage || 'cpp';
                    TestEngine.launchFullScreen();
                }
            }
        } catch (e) {
            console.warn('Could not restore test session on load:', e);
        }
    });

    // Save state before window closes / reloads
    window.addEventListener('beforeunload', () => {
        try {
            if (TestEngine.currentSession && !TestEngine.currentSession.isCompleted) {
                TestEngine.saveCurrentCodeDraft();
                TestEngine.currentSession.activeLanguage = TestEngine.activeLanguage;
                if (typeof Store !== 'undefined' && Store.saveActiveTestSession) {
                    Store.saveActiveTestSession(TestEngine.currentSession);
                }
            }
        } catch (e) {
            console.warn('Could not save draft before unload:', e);
        }
    });
}
if (typeof module !== 'undefined') {
    module.exports = { TestEngine };
}

