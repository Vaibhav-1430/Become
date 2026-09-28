/**
 * BOSS Study OS — Calendar Engine
 * Strictly covers 18 August 2026 through 18 August 2028.
 * Supports month navigation, visual status indicators, rich hover tooltips,
 * and day modal integration with recipes, reminders & recovery tracking.
 */

const CalendarEngine = {
    currentYear: 2026,
    currentMonth: 7, // 0-indexed: 7 = August

    init() {
        const today = DateUtils.todayIST();
        if (DateUtils.isInRange(today)) {
            const d = DateUtils.parseDate(today);
            this.currentYear = d.getFullYear();
            this.currentMonth = d.getMonth();
        } else {
            this.currentYear = 2026;
            this.currentMonth = 7;
        }
    },

    prevMonth() {
        if (this.currentYear === 2026 && this.currentMonth <= 7) return;
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    },

    nextMonth() {
        if (this.currentYear === 2028 && this.currentMonth >= 7) return;
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    },

    goToToday() {
        const today = DateUtils.todayIST();
        if (DateUtils.isInRange(today)) {
            const d = DateUtils.parseDate(today);
            this.currentYear = d.getFullYear();
            this.currentMonth = d.getMonth();
        } else {
            this.currentYear = 2026;
            this.currentMonth = 7;
        }
        this.render();
    },

    render() {
        const monthLabel = document.getElementById('calMonthLabel');
        const grid = document.getElementById('calendarGrid');
        const prevBtn = document.getElementById('calPrevMonth');
        const nextBtn = document.getElementById('calNextMonth');

        if (!grid) return;

        if (typeof TaskEngine !== 'undefined' && TaskEngine.ensureMonthTasks) {
            TaskEngine.ensureMonthTasks(this.currentYear, this.currentMonth);
        }

        const dateObj = new Date(this.currentYear, this.currentMonth, 1);
        const monthName = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        if (monthLabel) monthLabel.textContent = monthName;

        if (prevBtn) {
            prevBtn.disabled = (this.currentYear === 2026 && this.currentMonth <= 7);
        }
        if (nextBtn) {
            nextBtn.disabled = (this.currentYear === 2028 && this.currentMonth >= 7);
        }

        const firstDayIndex = (new Date(this.currentYear, this.currentMonth, 1).getDay() + 6) % 7;
        const totalDaysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        let html = '';

        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="cal-cell empty"></div>`;
        }

        const todayStr = DateUtils.todayIST();
        const placementState = Store.getPlacement();

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const inRange = DateUtils.isInRange(dateStr);

            if (!inRange) {
                html += `
                    <div class="cal-cell out-of-range" title="Outside Command Center range">
                        <span class="day-num">${day}</span>
                    </div>
                `;
                continue;
            }

            const summary = TaskEngine.getDaySummary(dateStr);
            const isToday = (dateStr === todayStr);
            const isWeekend = DateUtils.isWeekend(dateStr);
            const recipe = DateUtils.getRecipeForDate(dateStr);

            let statusClass = 'status-planned';
            let statusLabel = 'Planned';
            let statusDot = '○';

            if (placementState.achieved) {
                statusClass = 'status-placed';
                statusLabel = 'Placement Achieved 🎉';
                statusDot = '★';
            } else if (summary.status === 'COMPLETED') {
                statusClass = 'status-completed';
                statusLabel = 'Completed';
                statusDot = '●';
            } else if (summary.status === 'INTERRUPTED') {
                statusClass = 'status-interrupted';
                statusLabel = 'Interrupted / Rescheduled';
                statusDot = '⚠️';
            } else if (summary.status === 'PARTIAL') {
                statusClass = 'status-partial';
                statusLabel = 'Partial';
                statusDot = '◐';
            } else if (summary.status === 'MISSED') {
                statusClass = 'status-missed';
                statusLabel = 'Missed';
                statusDot = '✕';
            }

            const dsaTasks = summary.tasks.filter(t => t.dsaProblemId);
            const dsaPreview = dsaTasks.length > 0
                ? dsaTasks.map((t, idx) => `${idx + 1}. ${t.title}`).join('<br>')
                : (isWeekend ? 'Weekend DSA slot (21:00)' : '2-3 Striver Questions');

            const devPreview = '11:00 PM – 01:30 AM: Full-Stack Dev / Core CS Hands-on';

            const gymStatus = typeof Store.getGymDayStatus === 'function' ? Store.getGymDayStatus(dateStr) : null;
            let gymTagHtml = '';
            let gymTooltipHtml = '';
            if (gymStatus) {
                const gClass = gymStatus.status.toLowerCase();
                const gLabel = gymStatus.status === 'COMPLETED' ? '🏋️ Gym ✓' : gymStatus.status === 'REST' ? '🧘 Rest' : '🏋️ Gym';
                gymTagHtml = `<span class="gym-tag ${gClass}">${gLabel}</span>`;
                gymTooltipHtml = `
                    <div class="tt-section">
                        <div class="tt-title">🏋️ Gym Workout</div>
                        <div class="tt-body">${gymStatus.label}</div>
                    </div>
                `;
            }

            html += `
                <div class="cal-cell in-range ${statusClass} ${isToday ? 'is-today' : ''} ${isWeekend ? 'is-weekend' : ''}"
                     data-date="${dateStr}"
                     tabindex="0"
                     role="button"
                     aria-label="${dateStr} - ${statusLabel}">
                    <div class="cal-cell-header">
                        <span class="day-num">${day}</span>
                        ${isToday ? '<span class="today-pill">TODAY</span>' : ''}
                        <span class="status-indicator" title="${statusLabel}">${statusDot}</span>
                    </div>

                    <div class="cal-cell-content">
                        <div class="cal-mini-metric">
                            <span class="dsa-tag">DSA ${summary.dsaCompleted}/${summary.dsaTotal || 3}</span>
                            <span class="dev-tag">DEV ${summary.devCompleted ? '✓' : '—'}</span>
                            ${gymTagHtml}
                        </div>
                        ${summary.pct > 0 ? `<div class="cal-mini-bar"><div class="fill" style="width: ${summary.pct}%"></div></div>` : ''}
                    </div>

                    <!-- Rich Hover Tooltip -->
                    <div class="cal-tooltip">
                        <div class="tt-header">
                            <b>${DateUtils.formatDateShort(dateStr)}</b>
                            <span class="tt-status ${statusClass}">${statusLabel} (${summary.pct}%)</span>
                        </div>
                        <div class="tt-section">
                            <div class="tt-title">🧠 DSA Plan</div>
                            <div class="tt-body">${dsaPreview}</div>
                        </div>
                        <div class="tt-section">
                            <div class="tt-title">💻 Development Block (11:00 PM – 01:30 AM)</div>
                            <div class="tt-body">${devPreview}</div>
                        </div>
                        ${gymTooltipHtml}
                        <div class="tt-section">
                            <div class="tt-title">🥣 Post-Workout Recipe</div>
                            <div class="tt-body" style="color: var(--text-gold); font-size: 10.5px;">${recipe ? recipe.name : 'Soya Chunks & Oats Bowl'}</div>
                        </div>
                        <div class="tt-footer">Click to view full schedule & manage tasks ↗</div>
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;

        grid.querySelectorAll('.cal-cell.in-range').forEach(cell => {
            cell.onclick = () => {
                const dateStr = cell.dataset.date;
                if (dateStr) {
                    DayModal.open(dateStr);
                }
            };
            cell.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    DayModal.open(cell.dataset.date);
                }
            };
        });
    }
};

if (typeof window !== 'undefined') {
    window.CalendarEngine = CalendarEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { CalendarEngine };
}
