/**
 * BOSS Study OS — Daily Schedule Template Engine
 * Generates tasks, handles weekday/weekend logic, recovery slots & rescheduling.
 */

const ScheduleEngine = {
    /**
     * Generate all tasks for a given date
     * @param {string} dateStr - YYYY-MM-DD
     * @param {Array} dsaQuestions - Assigned DSA problems
     */
    generateDayTasks(dateStr, dsaQuestions = []) {
        const isWeekend = DateUtils.isWeekend(dateStr);
        const blocks = isWeekend ? APP_CONFIG.WEEKEND_BLOCKS : APP_CONFIG.WEEKDAY_BLOCKS;
        const tasks = [];

        blocks.forEach((block) => {
            if (block.category === 'DSA') {
                // Parent DSA block
                tasks.push({
                    id: `task_${dateStr}_dsa_block`,
                    dateKey: dateStr,
                    title: block.label,
                    category: APP_CONFIG.CATEGORIES.DSA,
                    startTime: block.start,
                    endTime: block.end,
                    status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
                    isStudy: true,
                    isBlock: true,
                    dsaProblems: dsaQuestions.map(q => q.id),
                    notes: '',
                    history: [
                        { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated routine' }
                    ],
                    rescheduledFrom: null,
                    rescheduledTo: null,
                    interruptReason: null
                });

                // Sub-tasks for individual DSA questions
                dsaQuestions.forEach((q, qi) => {
                    tasks.push({
                        id: `task_${dateStr}_dsa_${qi}`,
                        dateKey: dateStr,
                        title: q.name,
                        category: APP_CONFIG.CATEGORIES.DSA,
                        startTime: block.start,
                        endTime: block.end,
                        status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
                        isStudy: true,
                        isBlock: false,
                        dsaProblemId: q.id,
                        dsaProblemData: q,
                        notes: '',
                        history: [
                            { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated problem mission' }
                        ],
                        rescheduledFrom: null,
                        rescheduledTo: null,
                        interruptReason: null
                    });
                });
            } else if (block.category === APP_CONFIG.CATEGORIES.DEV) {
                const devRec = (typeof DevelopmentModule !== 'undefined' && DevelopmentModule.getNextUnfinishedItem)
                    ? DevelopmentModule.getNextUnfinishedItem()
                    : null;
                const devTitle = devRec
                    ? `💻 Development — ${devRec.techName}: ${devRec.title}`
                    : (block.id === 'dev_weekend' ? '💻 Full-Stack Dev & Core CS Hands-on' : '💻 Full-Stack Development & Projects Block');

                const dateTimes = DateUtils.getTaskDateTimes(dateStr, block.start, block.end);
                tasks.push({
                    id: `task_${dateStr}_${block.id}`,
                    dateKey: dateStr,
                    title: devTitle,
                    category: APP_CONFIG.CATEGORIES.DEV,
                    startTime: block.start,
                    endTime: block.end,
                    startISO: dateTimes.startISO,
                    endISO: dateTimes.endISO,
                    crossesMidnight: dateTimes.crossesMidnight,
                    status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
                    isStudy: true,
                    isBlock: true,
                    devTech: devRec?.techId || 'javascript',
                    devItem: devRec,
                    notes: devRec ? `Continue: ${devRec.techName} — ${devRec.title}` : 'Full-Stack Development & Projects',
                    history: [
                        { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated development routine' }
                    ],
                    rescheduledFrom: null,
                    rescheduledTo: null,
                    interruptReason: null
                });
            } else if (block.category === 'CREATINE') {
                const dateTimes = DateUtils.getTaskDateTimes(dateStr, block.start, block.end);
                tasks.push({
                    id: `task_${dateStr}_creatine`,
                    dateKey: dateStr,
                    title: '💊 Take Creatine (5g with water)',
                    category: APP_CONFIG.CATEGORIES.CREATINE,
                    startTime: block.start,
                    endTime: block.end,
                    startISO: dateTimes.startISO,
                    endISO: dateTimes.endISO,
                    crossesMidnight: false,
                    status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
                    isStudy: false,
                    isBlock: false,
                    notes: 'Daily post-dinner creatine reminder',
                    history: [
                        { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated reminder' }
                    ],
                    rescheduledFrom: null,
                    rescheduledTo: null,
                    interruptReason: null
                });
            } else if (block.category === 'GATE' || block.category === (APP_CONFIG.CATEGORIES && APP_CONFIG.CATEGORIES.GATE)) {
                const dateTimes = DateUtils.getTaskDateTimes(dateStr, block.start, block.end);
                let directive = null;
                if (typeof GatePlannerEngine !== 'undefined' && GatePlannerEngine.getTonightDirective) {
                    directive = GatePlannerEngine.getTonightDirective();
                }
                const subject = directive?.subject?.name || 'Operating Systems';
                const topic = directive?.topic?.name || 'Process Scheduling';
                const pyqCount = directive?.pyqTarget || 8;
                const gateTitle = `🎓 GATE — ${subject} — ${topic} (${pyqCount} PYQs)`;

                tasks.push({
                    id: `task_${dateStr}_gate_session`,
                    dateKey: dateStr,
                    title: gateTitle,
                    category: (APP_CONFIG.CATEGORIES && APP_CONFIG.CATEGORIES.GATE) || 'GATE',
                    startTime: block.start,
                    endTime: block.end,
                    startISO: dateTimes.startISO,
                    endISO: dateTimes.endISO,
                    crossesMidnight: dateTimes.crossesMidnight,
                    status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
                    isStudy: true,
                    isBlock: true,
                    gateDirective: directive,
                    notes: directive ? `${directive.topic.name} • Target ${pyqCount} PYQs (≥${directive.targetAccuracy}%) • ${directive.reason}` : 'GATE 2027 PYQ Study Session',
                    history: [
                        { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated GATE PYQ mission' }
                    ],
                    rescheduledFrom: null,
                    rescheduledTo: null,
                    interruptReason: null
                });
            } else {
                const dateTimes = DateUtils.getTaskDateTimes(dateStr, block.start, block.end);
                tasks.push({
                    id: `task_${dateStr}_${block.id}`,
                    dateKey: dateStr,
                    title: block.label,
                    category: APP_CONFIG.CATEGORIES[block.category] || block.category,
                    startTime: block.start,
                    endTime: block.end,
                    startISO: dateTimes.startISO,
                    endISO: dateTimes.endISO,
                    crossesMidnight: dateTimes.crossesMidnight,
                    status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
                    isStudy: !!block.isStudy,
                    isBlock: true,
                    notes: '',
                    history: [
                        { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated routine' }
                    ],
                    rescheduledFrom: null,
                    rescheduledTo: null,
                    interruptReason: null
                });
            }
        });

        return tasks;
    },

    /**
     * Find available recovery slots inside the college window (09:00 - 16:00) without overlaps
     */
    findAvailableRecoverySlots(existingTasks) {
        const recoveryTasks = existingTasks.filter(t =>
            t.category === APP_CONFIG.CATEGORIES.RECOVERY ||
            (t.rescheduledFrom && t.startTime >= '09:00' && t.endTime <= '16:00')
        );

        const usedSlots = recoveryTasks.map(t => ({ start: t.startTime, end: t.endTime }));

        return APP_CONFIG.COLLEGE_RECOVERY_SLOTS.filter(slot => {
            return !usedSlots.some(used =>
                (slot.start >= used.start && slot.start < used.end) ||
                (slot.end > used.start && slot.end <= used.end)
            );
        });
    },

    /**
     * Create rescheduled recovery task
     */
    createRescheduledTask(originalTask, newSlot, dateStr, reason = '') {
        const reasonText = reason || originalTask.interruptReason || 'Interrupted';
        return {
            id: `task_${dateStr}_recovery_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            dateKey: dateStr,
            title: `↪ ${originalTask.title}`,
            category: APP_CONFIG.CATEGORIES.RECOVERY,
            startTime: newSlot.start,
            endTime: newSlot.end,
            status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
            isStudy: true,
            isBlock: false,
            dsaProblemId: originalTask.dsaProblemId || null,
            dsaProblemData: originalTask.dsaProblemData || null,
            dsaProblems: originalTask.dsaProblems || null,
            notes: `⚠️ Rescheduled from ${DateUtils.formatTime12(originalTask.startTime)} (Reason: ${reasonText})`,
            history: [
                {
                    timestamp: DateUtils.nowISO(),
                    action: 'RESCHEDULED',
                    detail: `Rescheduled from ${originalTask.startTime} to ${newSlot.start} in College Window. Reason: ${reasonText}`
                }
            ],
            rescheduledFrom: originalTask.id,
            rescheduledTo: null,
            interruptReason: reasonText
        };
    },

    /**
     * Deterministically generate a GATE PYQ session task
     */
    generateGateTask(dateStr, startTime = '22:30', endTime = '00:00') {
        const dateTimes = DateUtils.getTaskDateTimes(dateStr, startTime, endTime);
        let directive = null;
        if (typeof GatePlannerEngine !== 'undefined' && GatePlannerEngine.getTonightDirective) {
            directive = GatePlannerEngine.getTonightDirective();
        }
        const subject = directive?.subject?.name || 'Operating Systems';
        const topic = directive?.topic?.name || 'Process Scheduling';
        const pyqCount = directive?.pyqTarget || 8;
        const gateTitle = `🎓 GATE — ${subject} — ${topic} (${pyqCount} PYQs)`;

        return {
            id: `task_${dateStr}_gate_session`,
            dateKey: dateStr,
            title: gateTitle,
            category: (APP_CONFIG.CATEGORIES && APP_CONFIG.CATEGORIES.GATE) || 'GATE',
            startTime: startTime,
            endTime: endTime,
            startISO: dateTimes.startISO,
            endISO: dateTimes.endISO,
            crossesMidnight: dateTimes.crossesMidnight,
            status: APP_CONFIG.TASK_STATUS.NOT_STARTED,
            isStudy: true,
            isBlock: true,
            gateDirective: directive,
            notes: directive ? `${directive.topic.name} • Target ${pyqCount} PYQs (≥${directive.targetAccuracy}%) • ${directive.reason}` : 'GATE 2027 PYQ Study Session',
            history: [
                { timestamp: DateUtils.nowISO(), action: 'CREATED', detail: 'Auto-generated GATE PYQ mission' }
            ],
            rescheduledFrom: null,
            rescheduledTo: null,
            interruptReason: null
        };
    }
};

if (typeof window !== 'undefined') {
    window.ScheduleEngine = ScheduleEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { ScheduleEngine };
}
