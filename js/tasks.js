/**
 * BOSS Study OS — Task Engine & Interruption Rescheduler
 * Handles full task lifecycle, status transitions, interruption handling,
 * "Didn't Wake Up" handling, intelligent college recovery rescheduling,
 * carry forward, and full undo mechanisms.
 */

const TaskEngine = {
    _cachedStreak: null,
    _cachedStreakDate: null,

    invalidateStatsCache() {
        this._cachedStreak = null;
        this._cachedStreakDate = null;
    },

    /**
     * Ensure tasks are generated and up-to-date for a given date
     */
    ensureDayTasks(dateStr) {
        const dayData = Store.getDayData(dateStr);

        if (!dayData.tasks || !Array.isArray(dayData.tasks) || dayData.tasks.length === 0) {
            const isWeekend = DateUtils.isWeekend(dateStr);
            const questionCount = isWeekend ? 2 : 3;
            const dsaQuestions = DSAEngine.getQuestionsForDate(dateStr, questionCount);

            dayData.tasks = ScheduleEngine.generateDayTasks(dateStr, dsaQuestions);
            dayData.generated = true;
            dayData.status = 'PLANNED';
            Store.setDayData(dateStr, dayData);
        } else if (!dayData.generated) {
            dayData.generated = true;
        }

        return dayData.tasks;
    },

    /**
     * Batch-generate all ungenerated dates for a month in memory first.
     * Performs a single batch store update and schedules a single disk write.
     */
    ensureMonthTasks(year, month) {
        const totalDays = new Date(year, month + 1, 0).getDate();
        const ungeneratedDates = [];
        const state = Store.getState();

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (!DateUtils.isInRange(dateStr)) continue;

            const dayData = (state.days && state.days[dateStr]) || null;
            if (!dayData || !Array.isArray(dayData.tasks) || dayData.tasks.length === 0) {
                ungeneratedDates.push(dateStr);
            } else if (!dayData.generated) {
                dayData.generated = true;
            }
        }

        if (ungeneratedDates.length === 0) {
            return 0;
        }

        const daysBatch = {};
        const allNewTasks = [];
        for (let i = 0; i < ungeneratedDates.length; i++) {
            const dateStr = ungeneratedDates[i];
            const isWeekend = DateUtils.isWeekend(dateStr);
            const questionCount = isWeekend ? 2 : 3;
            const dsaQuestions = DSAEngine.getQuestionsForDate(dateStr, questionCount);

            const tasks = ScheduleEngine.generateDayTasks(dateStr, dsaQuestions);
            daysBatch[dateStr] = {
                status: 'PLANNED',
                tasks: tasks,
                generated: true
            };
            allNewTasks.push({ dateStr, tasks });
        }

        Store.setDaysBatch(daysBatch);

        if (typeof window !== 'undefined' && window.SyncEngine) {
            const flattened = [];
            for (let i = 0; i < allNewTasks.length; i++) {
                const item = allNewTasks[i];
                for (let j = 0; j < item.tasks.length; j++) {
                    flattened.push({ dateStr: item.dateStr, task: item.tasks[j] });
                }
            }
            if (typeof window.SyncEngine.pushMonthTasksBatch === 'function') {
                window.SyncEngine.pushMonthTasksBatch(flattened);
            } else if (typeof window.SyncEngine.pushTask === 'function') {
                for (let k = 0; k < flattened.length; k++) {
                    window.SyncEngine.pushTask(flattened[k].dateStr, flattened[k].task);
                }
            }
        }

        return ungeneratedDates.length;
    },

    getTasksForDate(dateStr) {
        return this.ensureDayTasks(dateStr);
    },

    updateTaskStatus(dateStr, taskId, newStatus, actionNote = '') {
        const dayData = Store.getDayData(dateStr);
        const taskIndex = (dayData.tasks || []).findIndex(t => t.id === taskId);
        if (taskIndex === -1) return null;

        const task = dayData.tasks[taskIndex];
        const oldStatus = task.status;
        task.status = newStatus;

        task.history = task.history || [];
        task.history.push({
            timestamp: DateUtils.nowISO(),
            action: 'STATUS_CHANGE',
            detail: actionNote || `Status changed from ${oldStatus} to ${newStatus}`
        });

        if (task.dsaProblemId) {
            const dsaStatus = newStatus === APP_CONFIG.TASK_STATUS.COMPLETED
                ? APP_CONFIG.DSA_STATUS.SOLVED
                : newStatus === APP_CONFIG.TASK_STATUS.IN_PROGRESS
                    ? APP_CONFIG.DSA_STATUS.IN_PROGRESS
                    : newStatus === APP_CONFIG.TASK_STATUS.REVISIT
                        ? APP_CONFIG.DSA_STATUS.REVISIT
                        : APP_CONFIG.DSA_STATUS.NOT_STARTED;
            Store.setDsaProgress(task.dsaProblemId, {
                status: dsaStatus,
                solvedDate: newStatus === APP_CONFIG.TASK_STATUS.COMPLETED ? dateStr : null
            });
        }

        if (task.category === APP_CONFIG.CATEGORIES.DSA && !task.isBlock) {
            const dsaSubTasks = dayData.tasks.filter(t => t.category === APP_CONFIG.CATEGORIES.DSA && !t.isBlock);
            const allDsaDone = dsaSubTasks.length > 0 && dsaSubTasks.every(t => t.status === APP_CONFIG.TASK_STATUS.COMPLETED);
            const parentBlock = dayData.tasks.find(t => t.category === APP_CONFIG.CATEGORIES.DSA && t.isBlock);
            if (parentBlock) {
                parentBlock.status = allDsaDone ? APP_CONFIG.TASK_STATUS.COMPLETED : APP_CONFIG.TASK_STATUS.IN_PROGRESS;
            }
        }

        this.recalculateDayStatus(dateStr);
        Store.setDayData(dateStr, dayData);
        return task;
    },

    /**
     * Handle interruption (Playing Cards / Talking to GF / Didn't Wake Up)
     */
    handleInterruption(reason, targetDateStr = null) {
        const dateStr = targetDateStr || DateUtils.todayIST();
        const dayData = Store.getDayData(dateStr);
        this.ensureDayTasks(dateStr);

        // Snapshot before modification for 10-second undo
        const dayDataSnapshot = JSON.parse(JSON.stringify(dayData));

        // Find the target study task to interrupt
        let targetTask = dayData.tasks.find(t => t.isStudy && t.status === APP_CONFIG.TASK_STATUS.IN_PROGRESS);
        if (!targetTask) {
            targetTask = dayData.tasks.find(t => t.category === APP_CONFIG.CATEGORIES.DSA && t.status !== APP_CONFIG.TASK_STATUS.COMPLETED && !t.rescheduledTo);
        }
        if (!targetTask) {
            targetTask = dayData.tasks.find(t => t.isStudy && t.status !== APP_CONFIG.TASK_STATUS.COMPLETED && !t.rescheduledTo);
        }

        if (!targetTask) {
            const dist = Store.logDistraction(reason, null, 'Logged outside active study task (all study tasks done)');
            return {
                interrupted: false,
                message: `Logged "${reason}". All study blocks for today are already complete!`,
                canUndo: false
            };
        }

        const oldTaskStatus = targetTask.status;

        // Mark task as INTERRUPTED
        targetTask.status = APP_CONFIG.TASK_STATUS.INTERRUPTED;
        targetTask.interruptReason = reason;
        targetTask.history = targetTask.history || [];
        targetTask.history.push({
            timestamp: DateUtils.nowISO(),
            action: 'INTERRUPTED',
            detail: `⚡ Interrupted: ${reason}`
        });

        // If parent DSA block, mark sub tasks too
        if (targetTask.isBlock && targetTask.category === APP_CONFIG.CATEGORIES.DSA) {
            dayData.tasks.filter(t => t.category === APP_CONFIG.CATEGORIES.DSA && !t.isBlock).forEach(sub => {
                if (sub.status !== APP_CONFIG.TASK_STATUS.COMPLETED) {
                    sub.status = APP_CONFIG.TASK_STATUS.INTERRUPTED;
                    sub.interruptReason = reason;
                    sub.history = sub.history || [];
                    sub.history.push({
                        timestamp: DateUtils.nowISO(),
                        action: 'INTERRUPTED',
                        detail: `⚡ Morning session missed: ${reason}`
                    });
                }
            });
        }

        // Find available recovery slot in College Window (09:00 - 16:00)
        const availableSlots = ScheduleEngine.findAvailableRecoverySlots(dayData.tasks);
        let assignedSlot = null;
        let rescheduledDate = dateStr;
        let isCarriedForward = false;

        if (availableSlots.length > 0) {
            assignedSlot = availableSlots[0];
        } else {
            // College window full for today: Carry forward to next available day
            isCarriedForward = true;
            rescheduledDate = DateUtils.nextDate(dateStr);
            const nextDayTasks = this.ensureDayTasks(rescheduledDate);
            const nextDaySlots = ScheduleEngine.findAvailableRecoverySlots(nextDayTasks);
            assignedSlot = nextDaySlots.length > 0 ? nextDaySlots[0] : { start: '11:00', end: '12:15', label: 'Carried Forward Recovery Slot' };
        }

        // Create recovery task
        const rescheduledTask = ScheduleEngine.createRescheduledTask(targetTask, assignedSlot, rescheduledDate, reason);
        if (isCarriedForward) {
            rescheduledTask.notes = `⚠️ Carried Forward to ${DateUtils.formatDateShort(rescheduledDate)} ${DateUtils.formatTime12(assignedSlot.start)} (Reason: ${reason})`;
        }
        targetTask.rescheduledTo = rescheduledTask.id;

        if (rescheduledDate === dateStr) {
            dayData.tasks.push(rescheduledTask);
        } else {
            const nextDayData = Store.getDayData(rescheduledDate);
            nextDayData.tasks.push(rescheduledTask);
            Store.setDayData(rescheduledDate, nextDayData);
        }

        // Log distraction
        const distLog = Store.logDistraction(reason, targetTask.id, `Rescheduled to ${DateUtils.formatTime12(assignedSlot.start)}`);

        // Recalculate
        this.recalculateDayStatus(dateStr);
        Store.setDayData(dateStr, dayData);

        // Store snapshot in Store for Undo
        Store.lastInterruptionSnapshot = {
            dateStr,
            rescheduledDate,
            originalTaskId: targetTask.id,
            rescheduledTaskId: rescheduledTask.id,
            distLogId: distLog.id,
            previousDayData: dayDataSnapshot,
            timestamp: Date.now()
        };

        const displayTime = DateUtils.formatTime12(assignedSlot.start);
        const destinationText = isCarriedForward
            ? `Carried Forward to Tomorrow ${displayTime}`
            : `Rescheduled to ${displayTime} in College Window`;

        return {
            interrupted: true,
            originalTask: targetTask,
            rescheduledTask,
            assignedSlot,
            rescheduledDate,
            canUndo: true,
            message: `⚠️ Interrupted (${reason}) → ${destinationText}`
        };
    },

    /**
     * Undo the last interruption (within 10+ seconds)
     */
    undoLastInterruption() {
        const snap = Store.lastInterruptionSnapshot;
        if (!snap) return { success: false, message: 'No interruption to undo.' };

        const { dateStr, rescheduledDate, originalTaskId, rescheduledTaskId, distLogId, previousDayData } = snap;

        // Restore target date's data
        const dayData = Store.getDayData(dateStr);

        // Remove created recovery task
        if (rescheduledDate === dateStr) {
            dayData.tasks = (dayData.tasks || []).filter(t => t.id !== rescheduledTaskId);
        } else {
            const nextDayData = Store.getDayData(rescheduledDate);
            nextDayData.tasks = (nextDayData.tasks || []).filter(t => t.id !== rescheduledTaskId);
            Store.setDayData(rescheduledDate, nextDayData);
        }

        // Restore original task
        const origTask = dayData.tasks.find(t => t.id === originalTaskId);
        if (origTask) {
            origTask.status = APP_CONFIG.TASK_STATUS.NOT_STARTED;
            origTask.rescheduledTo = null;
            origTask.interruptReason = null;
            origTask.history = (origTask.history || []).filter(h => !h.detail.includes('⚡'));
            origTask.history.push({
                timestamp: DateUtils.nowISO(),
                action: 'UNDO_INTERRUPTION',
                detail: 'Interruption was undone by user.'
            });

            // Also restore subtasks if parent block
            if (origTask.isBlock && origTask.category === APP_CONFIG.CATEGORIES.DSA) {
                dayData.tasks.filter(t => t.category === APP_CONFIG.CATEGORIES.DSA && !t.isBlock).forEach(sub => {
                    sub.status = APP_CONFIG.TASK_STATUS.NOT_STARTED;
                    sub.interruptReason = null;
                    sub.history = (sub.history || []).filter(h => !h.detail.includes('⚡'));
                });
            }
        }

        // Remove distraction log
        Store.memoryState.distractions = Store.memoryState.distractions.filter(d => d.id !== distLogId);

        this.recalculateDayStatus(dateStr);
        Store.setDayData(dateStr, dayData);
        Store.lastInterruptionSnapshot = null;

        return {
            success: true,
            message: '✓ Interruption undone. Original task and schedule restored!'
        };
    },

    /**
     * Permanently remove an interruption & reschedule from a specific task (via modal)
     */
    removeInterruptionForTask(dateStr, taskId) {
        const dayData = Store.getDayData(dateStr);
        const task = (dayData.tasks || []).find(t => t.id === taskId);
        if (!task) return false;

        const rescheduledId = task.rescheduledTo;
        task.status = APP_CONFIG.TASK_STATUS.NOT_STARTED;
        task.rescheduledTo = null;
        task.interruptReason = null;
        task.history = (task.history || []).filter(h => !h.detail.includes('⚡'));
        task.history.push({
            timestamp: DateUtils.nowISO(),
            action: 'REMOVED_INTERRUPTION',
            detail: 'Interruption reset by user.'
        });

        // Also clean up recovery task
        if (rescheduledId) {
            dayData.tasks = dayData.tasks.filter(t => t.id !== rescheduledId);
        }

        this.recalculateDayStatus(dateStr);
        Store.setDayData(dateStr, dayData);
        return true;
    },

    addCustomTask(dateStr, taskData) {
        const dayData = Store.getDayData(dateStr);
        this.ensureDayTasks(dateStr);

        const customTask = {
            id: `task_${dateStr}_custom_${Date.now()}`,
            dateKey: dateStr,
            title: taskData.title || 'Custom Task',
            category: taskData.category || 'CUSTOM',
            startTime: taskData.startTime || '15:00',
            endTime: taskData.endTime || '16:00',
            status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
            isStudy: taskData.isStudy || false,
            isBlock: false,
            notes: taskData.notes || '',
            isAiGenerated: !!(taskData.isAiGenerated || (taskData.notes && /ai daily planner|generated by ai|created via ai/i.test(taskData.notes))),
            history: [
                { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'User created custom task' }
            ],
            rescheduledFrom: null,
            rescheduledTo: null,
            interruptReason: null
        };

        this.invalidateStatsCache();
        dayData.tasks.push(customTask);
        Store.setDayData(dateStr, dayData);
        return customTask;
    },

    deleteTask(dateStr, taskId) {
        const dayData = Store.getDayData(dateStr);
        if (!dayData || !Array.isArray(dayData.tasks)) return false;
        dayData.tasks = dayData.tasks.filter(t => t.id !== taskId);
        this.recalculateDayStatus(dateStr);
        Store.setDayData(dateStr, dayData);
        if (typeof window !== 'undefined' && window.SyncEngine) {
            window.SyncEngine.deleteTask(dateStr, taskId);
        }
        return true;
    },

    recalculateDayStatus(dateStr) {
        this.invalidateStatsCache();
        const dayData = Store.getDayData(dateStr);
        const tasks = dayData.tasks || [];
        const studyTasks = tasks.filter(t => (t.isStudy && !t.isBlock) || (t.category === APP_CONFIG.CATEGORIES.DEV && t.isStudy));
        const todayStr = DateUtils.todayIST();

        if (studyTasks.length === 0) {
            dayData.status = 'PLANNED';
            return 'PLANNED';
        }

        const completedCount = studyTasks.filter(t => t.status === APP_CONFIG.TASK_STATUS.COMPLETED).length;
        const interruptedCount = studyTasks.filter(t => t.status === APP_CONFIG.TASK_STATUS.INTERRUPTED).length;

        if (completedCount === studyTasks.length) {
            dayData.status = 'COMPLETED';
        } else if (interruptedCount > 0) {
            dayData.status = 'INTERRUPTED';
        } else if (completedCount > 0) {
            dayData.status = 'PARTIAL';
        } else if (dateStr < todayStr) {
            dayData.status = 'MISSED';
        } else {
            dayData.status = 'PLANNED';
        }

        return dayData.status;
    },

    getDaySummary(dateStr) {
        const tasks = this.getTasksForDate(dateStr);
        const studyTasks = tasks.filter(t => (t.isStudy && !t.isBlock) || (t.category === APP_CONFIG.CATEGORIES.DEV && t.isStudy));
        const completedStudy = studyTasks.filter(t => t.status === APP_CONFIG.TASK_STATUS.COMPLETED).length;
        const totalStudy = studyTasks.length;
        const pct = totalStudy > 0 ? Math.round((completedStudy / totalStudy) * 100) : 0;

        const dsaTasks = tasks.filter(t => t.category === APP_CONFIG.CATEGORIES.DSA && !t.isBlock);
        const dsaCompleted = dsaTasks.filter(t => t.status === APP_CONFIG.TASK_STATUS.COMPLETED).length;

        const devTask = tasks.find(t => t.category === APP_CONFIG.CATEGORIES.DEV && (t.id.includes('dev_night') || t.id.includes('dev_weekend')));
        const devCompleted = devTask ? (devTask.status === APP_CONFIG.TASK_STATUS.COMPLETED ? 1 : 0) : 0;

        const creatineTask = tasks.find(t => t.category === APP_CONFIG.CATEGORIES.CREATINE);
        const creatineCompleted = creatineTask ? (creatineTask.status === APP_CONFIG.TASK_STATUS.COMPLETED ? 1 : 0) : 0;

        const gateTasks = tasks.filter(t => t.category === (APP_CONFIG.CATEGORIES && APP_CONFIG.CATEGORIES.GATE) || t.category === 'GATE' || (t.id && t.id.includes('gate')));
        const gateCompleted = gateTasks.filter(t => t.status === APP_CONFIG.TASK_STATUS.COMPLETED).length;

        return {
            dateStr,
            tasks,
            studyTasks,
            totalStudy,
            completedStudy,
            pct,
            dsaTotal: dsaTasks.length,
            dsaCompleted,
            devTotal: devTask ? 1 : 0,
            devCompleted,
            creatineCompleted,
            gateTotal: gateTasks.length,
            gateCompleted,
            status: Store.getDayData(dateStr).status || 'PLANNED'
        };
    },

    calculateStreak() {
        const cur = DateUtils.todayIST();
        if (this._cachedStreak !== null && this._cachedStreakDate === cur) {
            return this._cachedStreak;
        }

        let streak = 0;

        const todaySummary = this.getDaySummary(cur);
        if (todaySummary.completedStudy > 0) {
            streak++;
        }

        let checkDate = DateUtils.prevDate(cur);
        while (checkDate >= APP_CONFIG.START_DATE) {
            const dayData = Store.getDayData(checkDate);
            if (!dayData.generated || !Array.isArray(dayData.tasks)) break;

            const hasStudyDone = dayData.tasks.some(t =>
                ((t.isStudy && !t.isBlock) || (t.category === APP_CONFIG.CATEGORIES.DEV && t.isStudy)) &&
                t.status === APP_CONFIG.TASK_STATUS.COMPLETED
            );

            if (hasStudyDone) {
                streak++;
                checkDate = DateUtils.prevDate(checkDate);
            } else {
                break;
            }
        }

        this._cachedStreak = streak;
        this._cachedStreakDate = cur;
        return streak;
    },

    /**
     * Single-pass computation for overall study and development completion days
     * Eliminates redundant getDaySummary iterations over 730 historical dates
     */
    getOverallStudyAndDevDays() {
        const state = Store.getState();
        let studyDaysCount = 0;
        let devCount = 0;

        const dayEntries = Object.entries(state.days || {});
        for (let i = 0; i < dayEntries.length; i++) {
            const dayData = dayEntries[i][1];
            if (!dayData || !Array.isArray(dayData.tasks)) continue;
            let hasStudy = false;
            let hasDev = false;
            const tasks = dayData.tasks;
            for (let j = 0; j < tasks.length; j++) {
                const t = tasks[j];
                if (!hasStudy && ((t.isStudy && !t.isBlock) || (t.category === APP_CONFIG.CATEGORIES.DEV && t.isStudy))) {
                    if (t.status === APP_CONFIG.TASK_STATUS.COMPLETED) {
                        hasStudy = true;
                    }
                }
                if (!hasDev && t.category === APP_CONFIG.CATEGORIES.DEV && (t.id.includes('dev_night') || t.id.includes('dev_weekend'))) {
                    if (t.status === APP_CONFIG.TASK_STATUS.COMPLETED) {
                        hasDev = true;
                    }
                }
                if (hasStudy && hasDev) break;
            }
            if (hasStudy) studyDaysCount++;
            if (hasDev) devCount++;
        }

        return { studyDaysCount, devCount };
    },

    /**
     * Synchronizes schedule across calendar days, removing any legacy GATE blocks and restoring Dev night block (23:00 - 01:30).
     */
    syncScheduleToAllCalendarDays() {
        const state = Store.getState();
        const days = state.days || {};
        let updatedCount = 0;

        Object.keys(days).forEach(dateStr => {
            const dayData = days[dateStr];
            if (!dayData || !Array.isArray(dayData.tasks) || dayData.tasks.length === 0) return;

            const initialLen = dayData.tasks.length;
            // 1. Remove any GATE tasks or break_night tasks
            dayData.tasks = dayData.tasks.filter(t => t.category !== 'GATE' && !t.id.includes('gate_night') && !t.id.includes('break_night'));
            let dayChanged = dayData.tasks.length !== initialLen;

            // 2. Restore dev_night to 23:00 - 01:30
            const devNight = dayData.tasks.find(t => t.category === APP_CONFIG.CATEGORIES.DEV && t.id.includes('dev_night'));
            if (devNight && (devNight.startTime !== '23:00' || devNight.endTime !== '01:30')) {
                devNight.startTime = '23:00';
                devNight.endTime = '01:30';
                dayChanged = true;
            }

            if (dayChanged) {
                this.recalculateDayStatus(dateStr);
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            Store.save();
        }
        return updatedCount;
    }
};

if (typeof window !== 'undefined') {
    window.TaskEngine = TaskEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { TaskEngine };
}
