/**
 * BOSS Study OS — Notifications & Daily Study Reminder Engine
 * Handles Browser Notification API permissions, interval tickers,
 * in-app study modal alerts with [Start Study], and Creatine reminders.
 */

const NotificationManager = {
    checkInterval: null,
    lastFiredKeys: new Set(),

    init() {
        this.updateStatusBadge();
        this.startTicker();
    },

    /**
     * Check current browser permission status
     */
    getPermissionState() {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission; // 'default', 'granted', 'denied'
    },

    /**
     * Request browser notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            alert('Browser Notifications are not supported in this browser.');
            return false;
        }

        try {
            const perm = await Notification.requestPermission();
            const granted = (perm === 'granted');
            Store.updateSettings({ notificationsEnabled: granted });
            this.updateStatusBadge();
            if (granted) {
                this.sendNotification('🔔 Notifications Enabled', 'FORGE will alert you for DSA, Development & Health routines.');
                showToast('Browser notifications enabled successfully!', 'success');
            } else if (perm === 'denied') {
                showToast('Notification permission denied in browser settings.', 'warning');
            }
            return granted;
        } catch (e) {
            console.warn('Error requesting notification permission:', e);
            return false;
        }
    },

    updateStatusBadge() {
        const badge = document.getElementById('notifStatusBadge');
        if (!badge) return;

        const perm = this.getPermissionState();
        const settings = Store.getSettings();

        if (perm === 'granted' && settings.notificationsEnabled) {
            badge.innerHTML = `🔔 Notifications ON`;
            badge.className = 'notif-status-pill on';
        } else if (perm === 'denied') {
            badge.innerHTML = `🔕 Notifications Blocked`;
            badge.className = 'notif-status-pill blocked';
        } else {
            badge.innerHTML = `🔕 Notifications OFF`;
            badge.className = 'notif-status-pill off';
        }
    },

    /**
     * Send system desktop/browser notification
     */
    sendNotification(title, body, icon = '🧠') {
        if (this.getPermissionState() === 'granted' && Store.getSettings().notificationsEnabled) {
            try {
                new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'boss-study-os-reminder'
                });
            } catch (e) {
                console.warn('Browser notification error:', e);
            }
        }
    },

    /**
     * Start interval timer to check study time
     */
    startTicker() {
        if (this.checkInterval) clearInterval(this.checkInterval);

        // Check immediately and then every 30 seconds
        this.checkScheduleTriggers();
        this.checkInterval = setInterval(() => {
            this.checkScheduleTriggers();
        }, 30000);
    },

    /**
     * Evaluate current time and fire triggers
     */
    checkScheduleTriggers() {
        const timeIST = DateUtils.nowTimeIST(); // "06:45", "22:00", etc.
        const todayStr = DateUtils.todayIST();
        const isWeekend = DateUtils.isWeekend(todayStr);
        const settings = Store.getSettings();

        // 1. Morning DSA: 06:45 AM (Weekdays only)
        if (!isWeekend && timeIST === '06:45' && settings.notifyDsa) {
            const key = `${todayStr}_0645_dsa`;
            if (!this.lastFiredKeys.has(key)) {
                this.lastFiredKeys.add(key);
                const dayTasks = TaskEngine.getTasksForDate(todayStr);
                const dsaTasks = dayTasks.filter(t => t.dsaProblemData);
                const qList = dsaTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n');

                this.sendNotification("🧠 DSA Time — Start today's Striver A2Z", qList || 'Solve your 2-3 daily questions now.');
                this.showStudyAlertToast('🧠 DSA TIME (06:45 – 08:15)', `Today's mission:\n${qList}`, 'dsa');
            }
        }

        // 2. Weekend Dev Block: 14:00 (Weekends only)
        if (isWeekend && timeIST === '14:00' && settings.notifyDev) {
            const key = `${todayStr}_1400_dev`;
            if (!this.lastFiredKeys.has(key)) {
                this.lastFiredKeys.add(key);
                this.sendNotification("💻 Development Time", "Hands-on Full-Stack Development and Core CS session.");
                this.showStudyAlertToast('💻 DEV TIME (14:00 – 15:30)', "Build your full-stack projects or core CS tasks.", 'dev');
            }
        }

        // 3. Weekend DSA Block: 21:00 (Weekends only)
        if (isWeekend && timeIST === '21:00' && settings.notifyDsa) {
            const key = `${todayStr}_2100_weekend_dsa`;
            if (!this.lastFiredKeys.has(key)) {
                this.lastFiredKeys.add(key);
                this.sendNotification("🧠 Weekend DSA Time", "Solve your evening Striver A2Z questions.");
                this.showStudyAlertToast('🧠 DSA STUDY BLOCK (21:00 – 22:30)', "Weekend DSA session is starting now.", 'dsa');
            }
        }

        // 4. Daily Creatine Reminder: 22:00 (10:00 PM)
        if (timeIST === '22:00' && settings.notifyCreatine) {
            const key = `${todayStr}_2200_creatine`;
            if (!this.lastFiredKeys.has(key)) {
                this.lastFiredKeys.add(key);
                this.sendNotification("💊 Creatine Reminder", "Time to take your creatine (5g with water) 💊");
                showToast("💊 Time to take your creatine (5g with water)!", "warning");
            }
        }

        // 5. Night Development Study Block: 23:00 (11:00 PM)
        if (timeIST === '23:00' && settings.notifyDev) {
            const key = `${todayStr}_2300_dev`;
            if (!this.lastFiredKeys.has(key)) {
                this.lastFiredKeys.add(key);
                this.sendNotification("💻 Development Time — 11:00 PM", "Start your Full-Stack Development & project work session.");
                this.showStudyAlertToast('💻 DEV STUDY TIME (23:00 – 01:30)', "Tonight's mission: Complete today's Full-Stack module and practical tasks.", 'dev');
            }
        }

        // 6. Sunday Weekly Placement Test Alert (Requirement 24)
        const dayOfWeek = DateUtils.getDayOfWeek(todayStr);
        if (dayOfWeek === 0) {
            const key = `${todayStr}_sunday_weekly_test`;
            if (!this.lastFiredKeys.has(key)) {
                this.lastFiredKeys.add(key);
                this.sendNotification("📝 WEEKLY TEST READY", "Your weekly test is ready. Test your DSA, Core CS, SQL & Aptitude.");
                this.showSundayTestAlertToast();
            }
        }
    },

    showSundayTestAlertToast() {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast study-alert-toast sunday-alert-toast';
        toast.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 800; color: var(--gold); font-size: 14px;">📝 WEEKLY TEST READY</div>
                <div style="font-size: 12.5px; color: var(--text-secondary); margin: 4px 0;">Your Sunday weekly placement test is ready.</div>
            </div>
            <button class="btn-primary" style="padding: 6px 14px; font-size: 12px;" onclick="PlacementEngine.startWeeklyTest(); this.closest('.toast').remove();">
                START TEST 🚀
            </button>
        `;
        container.appendChild(toast);
    },

    /**
     * Show interactive study alert toast with [Start Study] button
     */
    showStudyAlertToast(title, details, targetView) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast study-alert-toast';
        toast.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 800; color: var(--gold); font-size: 14px;">${title}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin: 4px 0; white-space: pre-line;">${details}</div>
            </div>
            <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="App.switchView('${targetView}'); this.closest('.toast').remove();">
                Start Study 🚀
            </button>
        `;
        container.appendChild(toast);

        // Keep study alert on screen for 25 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 25000);
    }
};

if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
}
if (typeof module !== 'undefined') {
    module.exports = { NotificationManager };
}
