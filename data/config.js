/**
 * BOSS Study OS — Application Configuration
 * Central config for all app constants, timezone, statuses, and time blocks.
 */

const APP_CONFIG = {
    APP_NAME: 'BOSS Study OS',
    VERSION: '2.5.0',
    STORAGE_KEY: 'boss-study-os-v2',

    // Calendar range (inclusive)
    START_DATE: '2026-08-18',
    END_DATE: '2028-08-18',

    // Timezone
    TIMEZONE: 'Asia/Kolkata',

    // DSA daily quota
    DSA_DAILY_MIN: 2,
    DSA_DAILY_MAX: 3,

    // Starting from Section 1 Question 1 (Learn the basics)
    DSA_COMPLETED_SECTIONS_BEFORE: 0,

    // Task statuses
    TASK_STATUS: {
        NOT_STARTED: 'NOT_STARTED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        SKIPPED: 'SKIPPED',
        INTERRUPTED: 'INTERRUPTED',
        RESCHEDULED: 'RESCHEDULED',
        REVISIT: 'REVISIT'
    },

    // DSA problem statuses
    DSA_STATUS: {
        NOT_STARTED: 'NOT_STARTED',
        IN_PROGRESS: 'IN_PROGRESS',
        SOLVED: 'SOLVED',
        REVISIT: 'REVISIT'
    },

    // Internship statuses
    INTERN_STATUS: {
        SAVED: 'SAVED',
        APPLIED: 'APPLIED',
        OA: 'OA',
        INTERVIEW: 'INTERVIEW',
        REJECTED: 'REJECTED',
        SELECTED: 'SELECTED'
    },

    // Interruption reasons
    INTERRUPTIONS: {
        CARDS: 'Playing Cards',
        GF: 'Talking to GF',
        OVERSLEPT: "Didn't Wake Up"
    },

    // Task categories
    CATEGORIES: {
        DSA: 'DSA',
        COLLEGE: 'COLLEGE',
        REST: 'REST',
        GYM: 'GYM',
        HOSTEL: 'HOSTEL',
        PERSONAL: 'PERSONAL',
        RECOVERY: 'RECOVERY',
        CREATINE: 'CREATINE',
        DEV: 'DEV',
        AI_STUDY: 'AI_STUDY'
    },

    // Weekday routine
    WEEKDAY_BLOCKS: [
        { id: 'dsa_morning', category: 'DSA', label: '🧠 DSA Study Block', start: '06:45', end: '08:15', isStudy: true },
        { id: 'college', category: 'COLLEGE', label: '🏫 College', start: '09:00', end: '16:00', isStudy: false },
        { id: 'rest', category: 'REST', label: '😴 Rest', start: '16:00', end: '17:00', isStudy: false },
        { id: 'gym', category: 'GYM', label: '💪 Gym', start: '17:00', end: '18:15', isStudy: false },
        { id: 'hostel', category: 'HOSTEL', label: '🏠 Hostel / Post-workout Soya Chunks & Oats', start: '18:40', end: '19:30', isStudy: false },
        { id: 'personal', category: 'PERSONAL', label: '❤️ Personal / GF Time', start: '19:30', end: '21:00', isStudy: false },
        { id: 'creatine', category: 'CREATINE', label: '💊 Take Creatine (5g)', start: '22:00', end: '22:15', isStudy: false },
        { id: 'dev_night', category: 'DEV', label: '💻 Full-Stack Dev & Projects Block', start: '23:00', end: '01:30', isStudy: true }
    ],

    // Weekend routine (No 06:45 AM DSA block, flexible study later)
    WEEKEND_BLOCKS: [
        { id: 'college', category: 'COLLEGE', label: '🏫 Flexible Study / College Work', start: '09:00', end: '14:00', isStudy: false },
        { id: 'dev_weekend', category: 'DEV', label: '💻 Full-Stack Dev / Core CS Hands-on', start: '14:00', end: '15:30', isStudy: true },
        { id: 'rest', category: 'REST', label: '😴 Rest', start: '16:00', end: '17:00', isStudy: false },
        { id: 'gym', category: 'GYM', label: '💪 Gym', start: '17:00', end: '18:15', isStudy: false },
        { id: 'hostel', category: 'HOSTEL', label: '🏠 Hostel / Post-workout Soya Chunks & Oats', start: '18:40', end: '19:30', isStudy: false },
        { id: 'personal', category: 'PERSONAL', label: '❤️ Personal / GF Time', start: '19:30', end: '21:00', isStudy: false },
        { id: 'dsa_weekend', category: 'DSA', label: '🧠 DSA Study Block (Weekend Slot)', start: '21:00', end: '22:30', isStudy: true },
        { id: 'creatine', category: 'CREATINE', label: '💊 Take Creatine (5g)', start: '22:00', end: '22:15', isStudy: false },
        { id: 'dev_night', category: 'DEV', label: '💻 Full-Stack Dev & Projects Block', start: '23:00', end: '01:30', isStudy: true }
    ],

    // College recovery slots for rescheduling (09:00 - 16:00)
    COLLEGE_RECOVERY_SLOTS: [
        { start: '09:30', end: '10:45', label: 'College Morning Recovery Slot 1' },
        { start: '11:00', end: '12:15', label: 'College Midday Recovery Slot 2' },
        { start: '12:30', end: '13:45', label: 'College Lunch Recovery Slot 3' },
        { start: '14:00', end: '15:15', label: 'College Afternoon Recovery Slot 4' }
    ],

    // Placement topics
    PLACEMENT_TOPICS: [
        { id: 'dsa', name: 'DSA', icon: '🧠', description: 'Data Structures & Algorithms (Striver A2Z)' },
        { id: 'oop', name: 'OOP', icon: '🔷', description: 'Object-Oriented Programming (C++/Java)' },
        { id: 'dbms', name: 'DBMS', icon: '🗄️', description: 'Database Management & Normalization' },
        { id: 'os', name: 'OS', icon: '💻', description: 'Operating Systems & Concurrency' },
        { id: 'cn', name: 'CN', icon: '🌐', description: 'Computer Networks & Protocols' },
        { id: 'sql', name: 'SQL', icon: '📊', description: 'SQL Queries, Joins & Indexing' },
        { id: 'sysdesign', name: 'System Design', icon: '🏗️', description: 'Scalable Systems, Architecture & Distributed Design' },
        { id: 'projects', name: 'Projects', icon: '🚀', description: 'Full Stack & Distributed Projects' },
        { id: 'aptitude', name: 'Aptitude', icon: '🧮', description: 'Quantitative & Logical Reasoning' },
        { id: 'resume', name: 'Resume', icon: '📄', description: 'ATS Resume Review & Polish' },
        { id: 'interview', name: 'Interview Prep', icon: '🎤', description: 'HR & Tech Behavioral Rounds' },
        { id: 'mock', name: 'Mock Interviews', icon: '🎯', description: 'Peer & Senior Mock Practice' }
    ],

    // Post-workout recipes tailored specifically to: Soya chunks + Chocolate protein oats
    POST_WORKOUT_RECIPES: [
        {
            id: 'soya_masala_oats',
            name: 'Masala Soya Oats Power Bowl',
            cookTime: '12-15 mins',
            difficulty: 'Easy',
            ingredients: [
                '50g Soya Chunks (boiled & squeezed)',
                '40g Oats (cooked separately or stirred in)',
                '1 medium Onion (chopped)',
                '1/2 tsp Turmeric (Haldi)',
                '1/2 tsp Garam Masala & Red Chilli',
                'Salt to taste & water'
            ],
            steps: [
                'Boil soya chunks in water for 5 mins with a pinch of salt. Rinse with cold water and squeeze out excess water completely.',
                'In a pan, lightly sauté chopped onions with haldi, salt, and garam masala until fragrant.',
                'Add the squeezed soya chunks and sauté for 3 minutes until lightly browned.',
                'Pour in 1 cup of water, add the oats, stir well, and simmer for 3-4 minutes until thick and savory.'
            ]
        },
        {
            id: 'chocolate_oats_soya_side',
            name: 'Chocolate Protein Oats Bowl with Spiced Soya Chunks',
            cookTime: '10 mins',
            difficulty: 'Quick & Easy',
            ingredients: [
                '45g Chocolate Protein Oats',
                '50g Soya Chunks (boiled)',
                'Warm Water or Milk (180ml)',
                'Onion & Chaat Masala / Black Salt'
            ],
            steps: [
                'Sweet side: Add warm water/milk to chocolate protein oats, stir thoroughly, and let rest for 3 minutes until rich and thick.',
                'Savory protein side: Boil soya chunks, squeeze well, and toss in a warm pan with sliced onion, pinch of salt, and chaat masala for 3 mins.',
                'Enjoy the sweet chocolate oats alongside the high-protein spiced soya chunks.'
            ]
        },
        {
            id: 'soya_oats_chilla',
            name: 'High-Protein Soya Oats Chilla',
            cookTime: '15 mins',
            difficulty: 'Moderate',
            ingredients: [
                '40g Soya Chunks (soaked & minced/crushed)',
                '40g Oats (ground or quick oats)',
                '1 finely chopped Onion',
                'Haldi, Salt, Jeera, Green Chilli / Red Chilli',
                'Water to form batter'
            ],
            steps: [
                'Soak soya chunks in boiling water for 5 mins, squeeze dry, and finely chop or pulse in a small mixer/grater.',
                'In a bowl, combine minced soya, oats, chopped onion, haldi, jeera, and salt.',
                'Add water gradually to form a medium-thick spreadable batter.',
                'Heat a tawa/pan with a drop of oil, spread the batter into medium chillas, and cook on both sides until golden brown.'
            ]
        },
        {
            id: 'spicy_soya_bhurji_oats',
            name: 'Hostel Spicy Soya Bhurji with Warm Oats',
            cookTime: '12 mins',
            difficulty: 'Easy',
            ingredients: [
                '50g Soya Chunks (minced/scrambled)',
                '40g Chocolate Protein Oats (as sweet finish) OR Plain Oats',
                '1 Onion (diced)',
                '1/2 tsp Haldi, Garam Masala, Salt, Chilli',
                '1 tsp Oil / Ghee'
            ],
            steps: [
                'Boil soya chunks, squeeze tightly, and shred with fork/hands into minced bhurji texture.',
                'Sauté diced onions in a pan with haldi, red chilli, and garam masala until translucent.',
                'Add shredded soya and roast on medium flame for 5-6 minutes until crisp and spicy.',
                'Prepare chocolate protein oats in a cup as your warm dessert shake/bowl to complete the macro balance.'
            ]
        },
        {
            id: 'soya_oats_tikki',
            name: 'Crispy Pan-Seared Soya Oats Tikkis',
            cookTime: '15 mins',
            difficulty: 'Easy',
            ingredients: [
                '50g Soya Chunks (boiled & mashed)',
                '30g Oats (for binding)',
                '1 finely chopped Onion',
                'Haldi, Salt, Chaat Masala, Chilli',
                'Water as needed'
            ],
            steps: [
                'Boil and squeeze soya chunks, then mash them thoroughly in a bowl.',
                'Add oats, chopped onions, haldi, salt, and chaat masala. Knead together into firm patties/tikkis.',
                'Heat a flat pan with minimal oil and pan-sear the tikkis on medium heat for 4-5 minutes per side until golden and crispy.'
            ]
        },
        {
            id: 'soya_upma_style',
            name: 'Desi Soya Oats Upma Bowl',
            cookTime: '10 mins',
            difficulty: 'Very Easy',
            ingredients: [
                '45g Soya Chunks (cut into bite-sized bits)',
                '40g Oats',
                '1 Onion (sliced)',
                'Mustard seeds / Jeera, Haldi, Salt',
                '1.5 cups Water'
            ],
            steps: [
                'Boil and squeeze soya chunks, cut each chunk into halves or quarters.',
                'Temper jeera/mustard seeds and sliced onion in a pan with haldi and salt.',
                'Add soya pieces and stir-fry for 2 mins.',
                'Add oats and 1.5 cups boiling water, cook uncovered for 3 mins until water is absorbed and upma is fluffy.'
            ]
        }
    ]
};

// Date utility functions using India timezone
const DateUtils = {
    todayIST() {
        return new Date().toLocaleDateString('en-CA', { timeZone: APP_CONFIG.TIMEZONE });
    },

    nowTimeIST() {
        return new Date().toLocaleTimeString('en-GB', {
            timeZone: APP_CONFIG.TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    currentHourIST() {
        return parseInt(new Date().toLocaleTimeString('en-GB', {
            timeZone: APP_CONFIG.TIMEZONE,
            hour: '2-digit',
            hour12: false
        }));
    },

    currentMinuteIST() {
        return parseInt(new Date().toLocaleTimeString('en-GB', {
            timeZone: APP_CONFIG.TIMEZONE,
            minute: '2-digit'
        }));
    },

    parseDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    },

    formatDateLong(dateStr) {
        const d = this.parseDate(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    formatDateShort(dateStr) {
        const d = this.parseDate(dateStr);
        return d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    },

    getDayOfWeek(dateStr) {
        return this.parseDate(dateStr).getDay();
    },

    isWeekend(dateStr) {
        const day = this.getDayOfWeek(dateStr);
        return day === 0 || day === 6;
    },

    isInRange(dateStr) {
        return dateStr >= APP_CONFIG.START_DATE && dateStr <= APP_CONFIG.END_DATE;
    },

    nextDate(dateStr) {
        const d = this.parseDate(dateStr);
        d.setDate(d.getDate() + 1);
        return this.toDateStr(d);
    },

    prevDate(dateStr) {
        const d = this.parseDate(dateStr);
        d.setDate(d.getDate() - 1);
        return this.toDateStr(d);
    },

    toDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    getGreeting() {
        const h = this.currentHourIST();
        if (h < 12) return 'GOOD MORNING';
        if (h < 17) return 'GOOD AFTERNOON';
        if (h < 21) return 'GOOD EVENING';
        return 'GOOD NIGHT';
    },

    getWeekdayName(dateStr) {
        return this.parseDate(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
    },

    formatTime12(time24) {
        if (!time24) return '';
        const [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    },

    daysBetween(dateStr1, dateStr2) {
        const d1 = this.parseDate(dateStr1);
        const d2 = this.parseDate(dateStr2);
        return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    },

    nowISO() {
        return new Date().toLocaleString('sv-SE', { timeZone: APP_CONFIG.TIMEZONE }).replace(' ', 'T') + '+05:30';
    },

    /**
     * Compute real start and end ISO strings with accurate midnight crossing handling
     * e.g. 22:30 -> 00:30 on 2026-09-27 gives:
     * startISO: 2026-09-27T22:30:00+05:30
     * endISO:   2026-09-28T00:30:00+05:30
     */
    getTaskDateTimes(dateStr, startTime, endTime) {
        if (!dateStr || !startTime || !endTime) {
            return { startISO: '', endISO: '', crossesMidnight: false, startDateStr: dateStr, endDateStr: dateStr };
        }
        const [sh] = startTime.split(':').map(Number);
        const [eh] = endTime.split(':').map(Number);

        let startDateStr = dateStr;
        let endDateStr = dateStr;
        let crossesMidnight = false;

        // Night session started before midnight (e.g. 22:30) and ends after midnight (e.g. 00:30)
        if (sh >= 20 && eh < 8) {
            crossesMidnight = true;
            endDateStr = this.nextDate(dateStr);
        } else if (sh < 5 && eh <= 5) {
            // Task is in post-midnight routine of dateStr (e.g. 00:30 break or 00:40 dev block)
            // Real calendar day is the next morning
            startDateStr = this.nextDate(dateStr);
            endDateStr = this.nextDate(dateStr);
        }

        const startISO = `${startDateStr}T${startTime}:00+05:30`;
        const endISO = `${endDateStr}T${endTime}:00+05:30`;
        return { startISO, endISO, crossesMidnight, startDateStr, endDateStr };
    },

    /**
     * Deterministically get the recipe index for a given date string
     */
    getRecipeForDate(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
        }
        const idx = hash % APP_CONFIG.POST_WORKOUT_RECIPES.length;
        return APP_CONFIG.POST_WORKOUT_RECIPES[idx];
    }
};

if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
    window.DateUtils = DateUtils;
}
if (typeof module !== 'undefined') {
    module.exports = { APP_CONFIG, DateUtils };
}
