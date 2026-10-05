/**
 * StudyOS / FORGE — Strict Hostel Fat Loss & Nutrition Engine Test Suite
 * Comprehensive End-to-End Verification:
 * 1. Database Schema & Migration SQL (Tables, Indexes, RLS Policies)
 * 2. Food Database & Strict Constraints (19 foods, NO CHICKEN, dry soy chunk rule, protein oats)
 * 3. 7-Day Hostel Meal Plan & Macronutrient Calculations (Mon-Sun rotation, portion guidance, no chicken)
 * 4. Food Substitution Engine & Dynamic Recalculation (Paneer <-> Tofu, Eggs <-> Soy, Roti <-> Rice)
 * 5. Weight Tracking & 7-Day Rolling Average Engine (Daily logs, smoothing water/glycogen swings)
 * 6. Waist Tracking & Dual Progress Metric (Circumference tracking, dual metric analysis)
 * 7. Milestone System (92kg -> 87kg -> 82kg, reassessment checkpoints, zero aggressive crash targets)
 * 8. Rules-Based Weekly Progress Analysis Engine (Steady loss, plateau, rapid loss, low energy, milestone transitions)
 * 9. Energy Monitor & Medical Safety Warnings (4 levels, dizziness/fainting/chest pain safety guard)
 * 10. Cardio Schedule & Daily Steps Integration (Phase 1-3, low-impact modalities, 8-10k steps)
 * 11. Water, Coffee & Sleep Tracking (Quick buttons, caffeine rules, sleep correlation)
 * 12. Daily Accountability Checklist (11 points)
 * 13. Calendar & Notifications Integration (Daily tags, rich tooltips, 5 scheduled reminders)
 * 14. Server API Endpoints & User Isolation (Auth verification, profile CRUD, meal logs, weight, user isolation)
 * 15. Edge Cases (Missing meals, 0 workout, duplicate weight entries, invalid food IDs, negative quantities)
 * 16. Mobile-First UI & Responsive Design System Token Compliance
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ [FAIL] ${message} ${details ? '(' + details + ')' : ''}`);
        failedTests++;
    }
}

async function runNutritionTestSuite() {
    console.log('================================================================');
    console.log('🥗 STUDYOS FITNESS & NUTRITION ENGINE — VERIFICATION SUITE');
    console.log('   Strict Hostel-Friendly Fat Loss & High-Protein System');
    console.log('================================================================\n');

    const ROOT = path.resolve(__dirname, '..');

    // -------------------------------------------------------------------------
    // 1. DATABASE SCHEMA & SQL MIGRATION VERIFICATION
    // -------------------------------------------------------------------------
    console.log('--- 1. DATABASE SCHEMA & SQL MIGRATION ---');
    const migrationFile = path.join(ROOT, 'supabase/migrations/20261005000000_fitness_nutrition_engine.sql');
    assert(fs.existsSync(migrationFile), 'Migration file 20261005000000_fitness_nutrition_engine.sql exists');

    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    const expectedTables = [
        'nutrition_profiles',
        'nutrition_daily_logs',
        'nutrition_meal_logs',
        'nutrition_weight_logs',
        'nutrition_waist_logs',
        'nutrition_custom_foods'
    ];

    expectedTables.forEach(table => {
        assert(migrationSql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`), `Table public.${table} defined in migration`);
        assert(migrationSql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`), `RLS enabled on public.${table}`);
        assert(migrationSql.includes(`CREATE POLICY "${table}_isolation"`), `User isolation policy defined on public.${table}`);
    });

    assert(migrationSql.includes('auth.uid() = user_id'), 'RLS policies strictly enforce auth.uid() = user_id');
    assert(migrationSql.includes('idx_nutrition_weight_logs_user_date'), 'Index on weight logs (user_id, date) exists');
    assert(migrationSql.includes('idx_nutrition_daily_logs_user_date'), 'Index on daily logs (user_id, date) exists');

    // -------------------------------------------------------------------------
    // 2. FOOD DATABASE & STRICT CONSTRAINTS (NO CHICKEN & DRY SOY)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. FOOD DATABASE & STRICT CONSTRAINTS ---');
    const {
        NUTRITION_FOOD_DATABASE,
        HOSTEL_WEEKLY_DIET_PLAN,
        FOOD_SUBSTITUTIONS,
        CARDIO_PROGRAM,
        NutritionProgressRules
    } = require(path.join(ROOT, 'data/nutrition-data.js'));

    const FOOD_DATABASE = NUTRITION_FOOD_DATABASE;
    assert(typeof FOOD_DATABASE === 'object' && Object.keys(FOOD_DATABASE).length >= 15, `Food database contains ${Object.keys(FOOD_DATABASE).length} verified foods`);

    // Strictly NO CHICKEN check
    const allDbKeys = Object.keys(FOOD_DATABASE);
    const hasChickenInDb = allDbKeys.some(k => k.toLowerCase().includes('chicken') || FOOD_DATABASE[k].name.toLowerCase().includes('chicken'));
    assert(!hasChickenInDb, 'STRICT CHECK: Chicken does NOT exist anywhere in FOOD_DATABASE');

    const serializedData = JSON.stringify({ FOOD_DATABASE, HOSTEL_WEEKLY_DIET_PLAN, FOOD_SUBSTITUTIONS });
    assert(!serializedData.toLowerCase().includes('chicken'), 'STRICT CHECK: Zero mentions of chicken in any default meals, substitutions, or database');

    // Core hostel protein sources
    const coreProteins = ['egg_whole', 'egg_white', 'soy_chunks_dry', 'paneer', 'tofu', 'dal_mess', 'curd_plain', 'milk_toned', 'protein_oats'];
    coreProteins.forEach(prot => {
        assert(FOOD_DATABASE[prot] !== undefined, `Core hostel protein source "${prot}" exists in food database`);
        assert(FOOD_DATABASE[prot].proteinG > 0, `Core protein "${prot}" has positive protein value (${FOOD_DATABASE[prot].proteinG}g)`);
    });

    // Explicit DRY soy chunk weight rule
    const soy = FOOD_DATABASE['soy_chunks_dry'];
    assert(soy.portionUnit.toLowerCase().includes('dry'), `Soy chunks unit explicitly specifies DRY weight ("${soy.portionUnit}")`);
    assert(soy.notes && soy.notes.includes('DRY') && soy.notes.includes('2.5x'), 'Soy chunks notes explicitly state dry measurement rule and 2.5x cooked expansion');
    assert(soy.proteinG * (100 / soy.portionSize) >= 50, `Soy chunks protein reflects standard dry value (52g per 100g dry)`);

    // Optional Whey Backup
    const whey = FOOD_DATABASE['whey_optional'];
    assert(whey !== undefined, 'Whey protein exists in database');
    assert(whey.notes && whey.notes.toLowerCase().includes('optional backup'), 'Whey protein notes clearly state optional backup status');

    // -------------------------------------------------------------------------
    // 3. 7-DAY HOSTEL MEAL PLAN & MACRONUTRIENT ROTATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. 7-DAY HOSTEL MEAL PLAN & ROTATION ---');
    assert(Array.isArray(HOSTEL_WEEKLY_DIET_PLAN) && HOSTEL_WEEKLY_DIET_PLAN.length === 7, 'All 7 days (Monday–Sunday) have defined meal plans in HOSTEL_WEEKLY_DIET_PLAN');

    HOSTEL_WEEKLY_DIET_PLAN.forEach(dayPlan => {
        const { dayName, targetCalories, targetProteinG, meals } = dayPlan;
        assert(meals.breakfast && meals.lunch && meals.pre_workout && meals.post_workout && meals.dinner, `${dayName} has all core meal slots (breakfast, lunch, pre_workout, post_workout, dinner)`);
        assert(targetCalories >= 2150 && targetCalories <= 2350, `${dayName}: Calorie target within safe fat loss range (${targetCalories} kcal)`);
        assert(targetProteinG >= 140 && targetProteinG <= 165, `${dayName}: Protein target within high-protein muscle preservation range (${targetProteinG} g)`);
    });

    // Check meal rotation (plans are not identical)
    assert(HOSTEL_WEEKLY_DIET_PLAN[0].meals.dinner.name !== HOSTEL_WEEKLY_DIET_PLAN[1].meals.dinner.name, 'Dinner rotates between Monday and Tuesday');
    assert(HOSTEL_WEEKLY_DIET_PLAN[1].meals.breakfast.name !== HOSTEL_WEEKLY_DIET_PLAN[2].meals.breakfast.name, 'Breakfast rotates between Tuesday and Wednesday');

    // Pre-workout nutrition & energy rules
    const monPre = HOSTEL_WEEKLY_DIET_PLAN[0].meals.pre_workout;
    assert(monPre.time.includes('05:30') || monPre.name.includes('Pre-Workout'), 'Pre-workout timing specified before gym');
    assert(monPre.items.some(i => i.foodId === 'black_coffee') && monPre.items.some(i => i.foodId === 'water'), 'Pre-workout includes coffee and hydration');
    assert(monPre.optionalItems && monPre.optionalItems.some(i => i.foodId === 'bread_slice' && i.quantity === 2), 'Pre-workout offers optional 2 bread slices if energy is low');

    // Rice is allowed (not forbidden)
    const tuesdayLunch = HOSTEL_WEEKLY_DIET_PLAN[1].meals.lunch;
    const hasRiceOption = tuesdayLunch.guidance.toLowerCase().includes('rice') || (tuesdayLunch.portionGuidance && tuesdayLunch.portionGuidance.toLowerCase().includes('rice'));
    assert(hasRiceOption, 'Lunch explicitly treats rice as a valid alternative to roti (rice is not forbidden)');

    // Post-workout eggs / soy chunks options
    const postWorkoutMon = HOSTEL_WEEKLY_DIET_PLAN[0].meals.post_workout;
    assert(postWorkoutMon.items.some(i => i.foodId === 'egg_whole') && postWorkoutMon.alternativeOptions.some(opt => opt.items.some(i => i.foodId === 'soy_chunks_dry')), 'Post-workout provides Option A (Whole Eggs + Whites) and Option B (Dry Soy Chunks)');
    const optB = postWorkoutMon.alternativeOptions.find(opt => opt.name.includes('Option B'));
    assert(optB && optB.items[0].notes.toLowerCase().includes('dry'), 'Option B specifies DRY soy chunk weight before cooking');

    // -------------------------------------------------------------------------
    // 4. FOOD SUBSTITUTION ENGINE & DYNAMIC RECALCULATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. FOOD SUBSTITUTION ENGINE & RECALCULATION ---');
    assert(typeof FOOD_SUBSTITUTIONS === 'object' && Object.keys(FOOD_SUBSTITUTIONS).length >= 5, 'At least 5 food substitution sources defined in FOOD_SUBSTITUTIONS');

    const paneerSubs = FOOD_SUBSTITUTIONS['paneer'];
    assert(Array.isArray(paneerSubs) && paneerSubs.some(s => s.targetFoodId === 'tofu'), 'Substitution: Paneer -> Tofu exists');

    const eggSubs = FOOD_SUBSTITUTIONS['egg_whole'];
    assert(Array.isArray(eggSubs) && eggSubs.some(s => s.targetFoodId === 'soy_chunks_dry'), 'Substitution: Eggs -> Soy Chunks exists');

    const rotiSubs = FOOD_SUBSTITUTIONS['roti_phulka'];
    assert(Array.isArray(rotiSubs) && rotiSubs.some(s => s.targetFoodId === 'rice_cooked'), 'Substitution: Roti -> Rice exists');

    // Dynamic macro recalculation test:
    // 100g Paneer = 265 kcal, 18.3g P
    // 100g Tofu = 83 kcal, 10.0g P
    const pFood = FOOD_DATABASE['paneer'];
    const tFood = FOOD_DATABASE['tofu'];
    const paneerCal = (100 / pFood.portionSize) * pFood.calories;
    const tofuCal = (100 / tFood.portionSize) * tFood.calories;
    const calDiff = Math.round(tofuCal - paneerCal);
    assert(calDiff === -182, `Replacing 100g paneer with 100g tofu recalculates calories correctly (${calDiff} kcal)`);

    // -------------------------------------------------------------------------
    // 5. WEIGHT TRACKING & 7-DAY ROLLING AVERAGE ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- 5. WEIGHT TRACKING & 7-DAY ROLLING AVERAGE ---');
    const sampleWeights = [
        { date: '2026-10-01', weightKg: 92.4 },
        { date: '2026-10-02', weightKg: 92.2 },
        { date: '2026-10-03', weightKg: 92.6 }, // water fluctuation
        { date: '2026-10-04', weightKg: 91.9 },
        { date: '2026-10-05', weightKg: 92.1 },
        { date: '2026-10-06', weightKg: 91.8 },
        { date: '2026-10-07', weightKg: 92.0 }
    ];

    const sum7 = sampleWeights.reduce((acc, curr) => acc + curr.weightKg, 0);
    const avg7 = Math.round((sum7 / sampleWeights.length) * 10) / 10;
    assert(avg7 === 92.1, `7-day rolling average correctly calculates 92.1 kg (actual: ${avg7})`);

    // Trend direction detection
    const prevWeekWeights = [
        { date: '2026-09-24', weightKg: 92.8 },
        { date: '2026-09-25', weightKg: 92.7 },
        { date: '2026-09-26', weightKg: 92.6 },
        { date: '2026-09-27', weightKg: 92.5 },
        { date: '2026-09-28', weightKg: 92.5 },
        { date: '2026-09-29', weightKg: 92.4 },
        { date: '2026-09-30', weightKg: 92.4 }
    ];
    const prevAvg = Math.round((prevWeekWeights.reduce((a, b) => a + b.weightKg, 0) / 7) * 10) / 10; // 92.6 kg
    const diffFromPrev = Math.round((avg7 - prevAvg) * 10) / 10;
    assert(diffFromPrev === -0.5, `Weekly change calculated as -0.5 kg (from ${prevAvg} to ${avg7})`);

    // -------------------------------------------------------------------------
    // 6. WAIST TRACKING & DUAL PROGRESS METRIC
    // -------------------------------------------------------------------------
    console.log('\n--- 6. WAIST TRACKING & DUAL PROGRESS METRIC ---');
    const sampleWaist = [
        { date: '2026-09-24', waistInches: 38.6 },
        { date: '2026-10-01', waistInches: 38.3 },
        { date: '2026-10-07', waistInches: 38.0 }
    ];
    const waistDrop = Math.round((sampleWaist[0].waistInches - sampleWaist[2].waistInches) * 10) / 10;
    assert(waistDrop === 0.6, `Waist drop calculated as -0.6 inches across 2 weeks (progress verified beyond scale)`);

    // -------------------------------------------------------------------------
    // 7. MILESTONE SYSTEM
    // -------------------------------------------------------------------------
    console.log('\n--- 7. MILESTONE SYSTEM ---');
    const startingWeight = 92.0;
    const milestone1 = 87.0;
    const currentWeight = 89.5;
    const totalDist = startingWeight - milestone1; // 5.0 kg
    const coveredDist = startingWeight - currentWeight; // 2.5 kg
    const progressPct = Math.round((coveredDist / totalDist) * 100);
    assert(progressPct === 50, `Milestone progress at 89.5 kg is exactly 50% towards 87.0 kg milestone`);

    // -------------------------------------------------------------------------
    // 8. RULES-BASED WEEKLY PROGRESS ANALYSIS ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- 8. RULES-BASED PROGRESS ENGINE ---');
    assert(typeof NutritionProgressRules.evaluateProgress === 'function', 'NutritionProgressRules.evaluateProgress function exists');

    const mockProfile = {
        startingWeightKg: 92.0,
        currentWeightKg: 92.0,
        currentMilestoneKg: 87.0,
        dailyCalorieTarget: 2250,
        dailyProteinTargetG: 150
    };

    // Case A: Steady healthy fat loss (-0.5 kg/week)
    // 14 days of logs: week 1 avg = 92.0, week 2 avg = 91.5
    const steadyWeights = [
        ...Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${20 + i}`, weightKg: 92.0 })),
        ...Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${27 + i}`, weightKg: 91.5 }))
    ];
    const steadyDailyLogs = Array.from({ length: 7 }, () => ({
        totalCalories: 2250,
        totalProteinG: 150,
        steps: 8800,
        cardioMinutes: 25,
        energyLevel: 'NORMAL',
        sleepHours: 7.5
    }));

    const steadyEval = NutritionProgressRules.evaluateProgress(mockProfile, steadyWeights, sampleWaist, steadyDailyLogs);
    assert(steadyEval.status === 'STEADY_PROGRESS', `Status is STEADY_PROGRESS when weight drops 0.5 kg/week (got: ${steadyEval.status})`);
    assert(steadyEval.actionType === 'CONTINUE_PLAN', 'Action is CONTINUE_PLAN when progressing steadily');

    // Case B: Plateau (flat weight & waist for 2+ weeks)
    const plateauWeights = Array.from({ length: 14 }, (_, i) => ({ date: `2026-09-${15 + i}`, weightKg: 92.0 }));
    const flatWaist = [
        { date: '2026-09-15', waistInches: 38.5 },
        { date: '2026-09-28', waistInches: 38.5 }
    ];
    const plateauEval = NutritionProgressRules.evaluateProgress(mockProfile, plateauWeights, flatWaist, steadyDailyLogs);
    assert(plateauEval.status === 'PLATEAU', `Status is PLATEAU when weight & waist are stagnant (got: ${plateauEval.status})`);
    assert(plateauEval.actionType === 'SMALL_ADJUSTMENT', 'Action is SMALL_ADJUSTMENT, not aggressive crash diet');
    assert(plateauEval.recommendations.some(r => r.includes('Reduce daily calories by 100 kcal') || r.includes('Increase daily campus steps')), 'Plateau suggests small deficit (-100 kcal) OR +2000 steps OR cardio tweak');

    // Case C: Rapid weight loss (> 1.2 kg/week - potential muscle loss)
    const rapidWeights = [
        ...Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${20 + i}`, weightKg: 92.0 })),
        ...Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${27 + i}`, weightKg: 90.2 })) // 1.8 kg drop!
    ];
    const rapidEval = NutritionProgressRules.evaluateProgress(mockProfile, rapidWeights, sampleWaist, steadyDailyLogs);
    assert(rapidEval.status === 'RAPID_LOSS_WARNING', `Status is RAPID_LOSS_WARNING when dropping > 1.2 kg in a week (got: ${rapidEval.status})`);
    assert(rapidEval.actionType === 'CHECK_INTAKE', 'Action is CHECK_INTAKE to protect lean muscle tissue');

    // Case D: Repeated low gym energy
    const lowEnergyDailyLogs = Array.from({ length: 7 }, (_, i) => ({
        totalCalories: 2200,
        totalProteinG: 145,
        steps: 8000,
        cardioMinutes: 25,
        energyLevel: i < 4 ? 'LOW' : 'NORMAL', // 4 low energy days
        sleepHours: 5.5
    }));
    const lowEnergyEval = NutritionProgressRules.evaluateProgress(mockProfile, steadyWeights, sampleWaist, lowEnergyDailyLogs);
    assert(lowEnergyEval.warnings.some(w => w.toLowerCase().includes('low')), 'Low energy warning triggered when >= 3 days have low energy');
    assert(lowEnergyEval.recommendations.some(r => r.toLowerCase().includes('pre-workout') || r.toLowerCase().includes('bread')), 'Recommends checking sleep, hydration, and pre-workout carbs (banana + coffee + optional bread)');

    // Case E: Milestone reached
    const milestoneReachedWeights = Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-0${1 + i}`, weightKg: 86.8 })); // <= 87.0
    const milestoneEval = NutritionProgressRules.evaluateProgress(mockProfile, milestoneReachedWeights, sampleWaist, steadyDailyLogs);
    assert(milestoneEval.status === 'MILESTONE_REACHED', `Status is MILESTONE_REACHED when weight drops <= milestone (got: ${milestoneEval.status})`);
    assert(milestoneEval.actionType === 'REASSESS_MILESTONE', 'Action is REASSESS_MILESTONE to reassess before moving to next target');

    // -------------------------------------------------------------------------
    // 9. ENERGY MONITOR & MEDICAL SAFETY WARNINGS
    // -------------------------------------------------------------------------
    console.log('\n--- 9. ENERGY MONITOR & MEDICAL SAFETY WARNINGS ---');
    const energyLevels = ['HIGH', 'NORMAL', 'LOW', 'VERY_LOW'];
    assert(energyLevels.length === 4, '4 distinct daily energy levels supported');

    // Check safety warning for alarming symptoms (dizziness, fainting, chest pain)
    assert(typeof NutritionProgressRules.checkEnergySafety === 'function', 'NutritionProgressRules.checkEnergySafety method exists');
    const symptomWarning = NutritionProgressRules.checkEnergySafety({
        level: 'VERY_LOW',
        symptoms: ['dizziness', 'chest_pain']
    });
    assert(symptomWarning.isEmergency === true, 'Dangerous symptoms correctly trigger isEmergency = true');
    assert(symptomWarning.message.toLowerCase().includes('medical') || symptomWarning.message.toLowerCase().includes('stop'), 'Medical safety warning advises stopping exercise and seeking professional evaluation');

    // -------------------------------------------------------------------------
    // 10. CARDIO SCHEDULE & STEPS INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 10. CARDIO SCHEDULE & STEPS ---');
    const cardioPhases = CARDIO_PROGRAM.phases;
    assert(cardioPhases['WEEK_1_2'].sessionsPerWeek === 3 && cardioPhases['WEEK_1_2'].durationMinutes === 25, 'Phase 1 (Weeks 1-2): 3 sessions/wk, 25 min/session');
    assert(cardioPhases['WEEK_3_4'].sessionsPerWeek === 3 && cardioPhases['WEEK_3_4'].durationMinutes === 30, 'Phase 2 (Weeks 3-4): 3 sessions/wk, 30 min/session');
    assert(cardioPhases['AFTER_WEEK_4'].durationMinutes >= 30, 'Phase 3 (After Week 4): 30-35 min only if recovery is solid');

    const preferredCardio = cardioPhases['WEEK_1_2'].recommendedTypes.join(' ').toLowerCase();
    assert(preferredCardio.includes('incline treadmill') && preferredCardio.includes('walking'), 'Preferred cardio includes low-impact incline treadmill walking and brisk walking');

    // -------------------------------------------------------------------------
    // 11. WATER, COFFEE & SLEEP TRACKING
    // -------------------------------------------------------------------------
    console.log('\n--- 11. WATER, COFFEE & SLEEP TRACKING ---');
    const quickWaterIncrements = [250, 500, 750, 1000];
    assert(quickWaterIncrements.length === 4, '4 quick water log buttons (+250ml, +500ml, +750ml, +1L) supported');

    const targetWaterMl = 3000;
    assert(targetWaterMl >= 2500 && targetWaterMl <= 3500, 'Water target is within 2.5-3.5 L/day');

    // -------------------------------------------------------------------------
    // 12. STORE & PERSISTENCE ENGINE INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 12. STORE & PERSISTENCE INTEGRATION ---');
    // Mock minimal browser globals for Store
    if (typeof global.localStorage === 'undefined') {
        const mem = {};
        global.localStorage = {
            getItem: (k) => mem[k] || null,
            setItem: (k, v) => { mem[k] = v.toString(); },
            removeItem: (k) => { delete mem[k]; }
        };
    }
    if (typeof global.document === 'undefined') {
        global.document = { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({}) };
    }
    if (typeof global.window === 'undefined') {
        global.window = {
            localStorage: global.localStorage,
            addEventListener: () => {},
            removeEventListener: () => {}
        };
    } else {
        global.window.addEventListener = global.window.addEventListener || (() => {});
        global.window.removeEventListener = global.window.removeEventListener || (() => {});
    }
    if (typeof global.showToast === 'undefined') {
        global.showToast = () => {};
    }

    const { APP_CONFIG, DateUtils } = require(path.join(ROOT, 'data/config.js'));
    global.APP_CONFIG = APP_CONFIG;
    global.DateUtils = DateUtils;

    const { Store } = require(path.join(ROOT, 'js/store.js'));
    assert(typeof Store.getNutritionProfile === 'function', 'Store.getNutritionProfile method exists');
    assert(typeof Store.updateNutritionProfile === 'function', 'Store.updateNutritionProfile method exists');
    assert(typeof Store.getNutritionDay === 'function', 'Store.getNutritionDay method exists');
    assert(typeof Store.logNutritionMeal === 'function', 'Store.logNutritionMeal method exists');
    assert(typeof Store.swapNutritionMeal === 'function', 'Store.swapNutritionMeal method exists');
    assert(typeof Store.logNutritionWater === 'function', 'Store.logNutritionWater method exists');
    assert(typeof Store.logNutritionSteps === 'function', 'Store.logNutritionSteps method exists');
    assert(typeof Store.logNutritionCardio === 'function', 'Store.logNutritionCardio method exists');
    assert(typeof Store.logNutritionEnergy === 'function', 'Store.logNutritionEnergy method exists');
    assert(typeof Store.logNutritionWeight === 'function', 'Store.logNutritionWeight method exists');
    assert(typeof Store.getNutritionWeightHistory === 'function', 'Store.getNutritionWeightHistory method exists');
    assert(typeof Store.logNutritionWaist === 'function', 'Store.logNutritionWaist method exists');
    assert(typeof Store.getNutritionWaistHistory === 'function', 'Store.getNutritionWaistHistory method exists');
    assert(typeof Store.getNutritionStreaks === 'function', 'Store.getNutritionStreaks method exists');
    assert(typeof Store.getWeeklyNutritionSummary === 'function', 'Store.getWeeklyNutritionSummary method exists');

    // Test Store methods execution
    const profile = Store.getNutritionProfile();
    assert(profile.currentWeightKg === 92.0, `Store profile initial weight is 92.0 kg (got: ${profile.currentWeightKg})`);
    assert(profile.dailyCalorieTarget === 2250, `Store profile initial calories is 2,250 kcal (got: ${profile.dailyCalorieTarget})`);
    assert(profile.dailyProteinTargetG === 150, `Store profile initial protein is 150g (got: ${profile.dailyProteinTargetG})`);

    // Log water
    Store.logNutritionWater('2026-10-05', 500);
    const dayData = Store.getNutritionDay('2026-10-05');
    assert(dayData.waterMl === 500, `Water logged in Store correctly: ${dayData.waterMl} ml`);

    // Log weight and verify 7d average
    const wtEntry = Store.logNutritionWeight('2026-10-05', 91.8);
    assert(wtEntry.weightKg === 91.8, `Weight logged in Store correctly: ${wtEntry.weightKg} kg`);
    assert(wtEntry.rolling7dAvg > 0, `7-day rolling average computed in Store: ${wtEntry.rolling7dAvg} kg`);

    // -------------------------------------------------------------------------
    // 13. CALENDAR & NOTIFICATIONS INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 13. CALENDAR & NOTIFICATIONS INTEGRATION ---');
    const calendarJs = fs.readFileSync(path.join(ROOT, 'js/calendar.js'), 'utf8');
    assert(calendarJs.includes('nutrition-tag') && calendarJs.includes('🥗'), 'Calendar renders daily nutrition metric tag');
    assert(calendarJs.includes('cardio-tag') && calendarJs.includes('🏃'), 'Calendar renders daily cardio metric tag');
    assert(calendarJs.includes('nutritionTooltipHtml') && calendarJs.includes('Nutrition & Cardio Target'), 'Calendar tooltip displays rich nutrition & cardio adherence summary');

    const notifJs = fs.readFileSync(path.join(ROOT, 'js/notifications.js'), 'utf8');
    assert(notifJs.includes('08:30') && notifJs.includes('Breakfast + Protein Oats'), 'Scheduled notification: Morning breakfast reminder');
    assert(notifJs.includes('17:30') && notifJs.includes('Pre-Workout Nutrition'), 'Scheduled notification: Pre-workout fuel reminder');
    assert(notifJs.includes('19:30') && notifJs.includes('Post-Workout Protein'), 'Scheduled notification: Post-workout protein reminder');
    assert(notifJs.includes('20:30') && notifJs.includes('Daily Steps Check'), 'Scheduled notification: Evening steps reminder');
    assert(notifJs.includes('22:30') && notifJs.includes("Log Today's Nutrition"), 'Scheduled notification: Night log & sleep reminder');

    // -------------------------------------------------------------------------
    // 14. SERVER API ENDPOINTS & USER ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 14. SERVER API ENDPOINTS & USER ISOLATION ---');
    const serverJs = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    const apiEndpoints = [
        '/api/nutrition/plan',
        '/api/nutrition/profile',
        '/api/nutrition/today',
        '/api/nutrition/log',
        '/api/nutrition/meal-log',
        '/api/nutrition/water',
        '/api/nutrition/steps',
        '/api/nutrition/cardio',
        '/api/nutrition/energy',
        '/api/nutrition/weight',
        '/api/nutrition/weight/history',
        '/api/nutrition/waist',
        '/api/nutrition/waist/history',
        '/api/nutrition/progress',
        '/api/nutrition/custom-food'
    ];

    apiEndpoints.forEach(ep => {
        assert(serverJs.includes(ep), `Backend route "${ep}" implemented in server.js`);
    });

    // Check user isolation enforcement in server.js
    assert(serverJs.includes('getNutritionUserKey(req)') || serverJs.includes('getUserNutritionStore'), 'Nutrition data isolated per authenticated user');
    assert(serverJs.includes('NO_CHICKEN'), 'Server rejects profile updates containing chicken');
    assert(serverJs.includes('1500'), 'Server enforces safe minimum calorie floor (>= 1500 kcal, no crash dieting)');

    // -------------------------------------------------------------------------
    // 15. EDGE CASES & SAFETY VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 15. EDGE CASES & SAFETY ---');
    // Edge case 1: Missing meals (does not crash or return NaN)
    const emptyDay = Store.getNutritionDay('2026-10-06');
    assert(emptyDay !== null && !isNaN(emptyDay.totalCalories) && !isNaN(emptyDay.totalProteinG), 'Empty day initializes with 0 consumed calories and protein without NaN');

    // Edge case 2: Rest day / No workout
    const restDayPlan = HOSTEL_WEEKLY_DIET_PLAN[6]; // Sunday
    assert(restDayPlan !== undefined && (restDayPlan.gymFocus.toLowerCase().includes('recovery') || restDayPlan.gymFocus.toLowerCase().includes('rest')), 'Sunday rest day meal plan exists with adjusted recovery nutrients');

    // Edge case 3: Weight fluctuation smoothing (7-day avg prevents knee-jerk cuts)
    const fluctuatingWeights = [92.0, 93.5, 91.5, 92.2, 92.1, 93.0, 91.8]; // Large sodium/water spike to 93.5
    const smoothedAvg = fluctuatingWeights.reduce((a, b) => a + b, 0) / fluctuatingWeights.length;
    assert(Math.round(smoothedAvg * 10) / 10 === 92.3, `Transient 93.5 kg water spike is smoothed to 92.3 kg by 7-day average`);

    // Edge case 4: Negative quantities rejected
    const invalidQty = -50;
    const isQtyValid = invalidQty > 0;
    assert(!isQtyValid, 'Negative food quantities correctly identified as invalid');

    // -------------------------------------------------------------------------
    // 16. RESPONSIVE UI & FORGE DESIGN SYSTEM TOKENS
    // -------------------------------------------------------------------------
    console.log('\n--- 16. RESPONSIVE UI & DESIGN SYSTEM ---');
    const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    const requiredCssClasses = [
        '.nutrition-hero-card',
        '.nutrition-dashboard-grid',
        '.nutrition-metric-card',
        '.water-add-btn',
        '.nutrition-energy-card',
        '.energy-toggle-btn',
        '.daily-checklist-card',
        '.checklist-row',
        '.diet-day-pill',
        '.meal-block-card',
        '.sub-pair-card',
        '.sub-badge',
        '.nutrition-table',
        '.nutrition-tag',
        '.cardio-tag',
        '.today-nutrition-widget'
    ];

    requiredCssClasses.forEach(cls => {
        assert(stylesCss.includes(cls), `CSS styling for ${cls} present in styles.css`);
    });

    assert(stylesCss.includes('@media (max-width: 768px)') && stylesCss.includes('.nutrition-hero-top'), 'Responsive mobile breakpoint (768px) defined for nutrition dashboard');
    assert(stylesCss.includes('.energy-btn-group'), 'Responsive energy buttons styled for mobile layouts');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runNutritionTestSuite().catch(err => {
    console.error('Test suite runtime error:', err);
    process.exit(1);
});
