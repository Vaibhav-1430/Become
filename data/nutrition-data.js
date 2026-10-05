/**
-- ==============================================================================
-- STUDYOS FITNESS & NUTRITION ENGINE — CANONICAL NUTRITION & FOOD DATABASE
-- ==============================================================================
 * Tailored specifically for a 20yo, 5'7", 92kg college hostel student.
 * Primary Goal: Fat loss while preserving muscle and gym performance.
 * Dietary Constraint: NO CHICKEN (Strictly excluded).
 * Core Protein Sources: Eggs, Soy Chunks (DRY weight clearly labelled),
 * Paneer, Tofu, Dal, Curd, Milk, Protein Oats, Whey (optional backup).
 */

const NUTRITION_FOOD_DATABASE = {
    // -------------------------------------------------------------------------
    // PROTEIN SOURCES & DAIRY (HOSTEL ACCESSIBLE)
    // -------------------------------------------------------------------------
    'egg_whole': {
        id: 'egg_whole',
        name: 'Whole Egg (Boiled/Cooked)',
        category: 'protein',
        portionSize: 1,
        portionUnit: 'large egg (~50g)',
        calories: 72,
        proteinG: 6.3,
        carbsG: 0.4,
        fatsG: 4.8,
        description: 'Complete high-bioavailability protein with essential choline & healthy fats.'
    },
    'egg_white': {
        id: 'egg_white',
        name: 'Egg White (Boiled)',
        category: 'protein',
        portionSize: 1,
        portionUnit: 'egg white (~33g)',
        calories: 17,
        proteinG: 3.6,
        carbsG: 0.2,
        fatsG: 0.1,
        description: 'Pure lean protein isolate with near zero fats or carbs.'
    },
    'soy_chunks_dry': {
        id: 'soy_chunks_dry',
        name: 'Soy Chunks (DRY WEIGHT)',
        category: 'protein',
        portionSize: 50,
        portionUnit: 'g (Dry Weight before cooking)',
        calories: 173,
        proteinG: 26.0,
        carbsG: 16.5,
        fatsG: 0.3,
        notes: 'IMPORTANT: Measure DRY before boiling. Absorbs 2.5x water (~125-150g cooked). 52% pure plant protein.',
        description: '50g DRY soy chunks yields ~26g protein. Cost-effective hostel staple.'
    },
    'paneer': {
        id: 'paneer',
        name: 'Paneer (Cottage Cheese)',
        category: 'protein',
        portionSize: 100,
        portionUnit: 'g',
        calories: 265,
        proteinG: 18.3,
        carbsG: 3.2,
        fatsG: 20.8,
        description: 'Rich slow-digesting casein protein and dietary fats.'
    },
    'tofu': {
        id: 'tofu',
        name: 'Tofu (Soy Paneer)',
        category: 'protein',
        portionSize: 100,
        portionUnit: 'g',
        calories: 83,
        proteinG: 10.0,
        carbsG: 1.9,
        fatsG: 4.8,
        description: 'Lean plant protein alternative to paneer with significantly lower calories and fats.'
    },
    'dal_mess': {
        id: 'dal_mess',
        name: 'Hostel Mess Dal (Yellow/Moong/Toor)',
        category: 'protein_carb',
        portionSize: 1,
        portionUnit: 'medium bowl (katori ~150g cooked)',
        calories: 145,
        proteinG: 9.0,
        carbsG: 20.0,
        fatsG: 3.5,
        description: 'Standard hostel mess dal providing plant protein and complex carbohydrates.'
    },
    'curd_plain': {
        id: 'curd_plain',
        name: 'Plain Curd / Dahi',
        category: 'dairy',
        portionSize: 1,
        portionUnit: 'medium bowl (katori ~150g)',
        calories: 98,
        proteinG: 5.3,
        carbsG: 7.0,
        fatsG: 5.5,
        description: 'Probiotic-rich gut support, calcium, and dairy protein.'
    },
    'milk_toned': {
        id: 'milk_toned',
        name: 'Toned Milk',
        category: 'dairy',
        portionSize: 200,
        portionUnit: 'ml (1 glass)',
        calories: 120,
        proteinG: 6.2,
        carbsG: 9.6,
        fatsG: 6.0,
        description: 'Hydrating protein and calcium source.'
    },
    'protein_oats': {
        id: 'protein_oats',
        name: 'Chocolate Protein Oats',
        category: 'breakfast',
        portionSize: 50,
        portionUnit: 'g dry',
        calories: 195,
        proteinG: 12.5,
        carbsG: 28.0,
        fatsG: 3.5,
        isCustomizableBrand: true,
        description: 'Hostel breakfast staple. User can override values from specific brand packaging label.'
    },
    'oats_plain': {
        id: 'oats_plain',
        name: 'Rolled / Instant Oats',
        category: 'carb',
        portionSize: 40,
        portionUnit: 'g dry',
        calories: 155,
        proteinG: 5.5,
        carbsG: 26.0,
        fatsG: 3.0,
        description: 'Slow-digesting beta-glucan carbs for sustained mental focus and training energy.'
    },
    'whey_protein_optional': {
        id: 'whey_protein_optional',
        name: 'Whey Protein (Optional Backup)',
        category: 'supplement',
        portionSize: 1,
        portionUnit: 'scoop (~32g)',
        calories: 120,
        proteinG: 24.0,
        carbsG: 2.0,
        fatsG: 1.5,
        isOptionalBackup: true,
        description: 'Optional backup only when whole food eggs/soy are unavailable. Never mandatory.'
    },

    // -------------------------------------------------------------------------
    // CARBOHYDRATES & HOSTEL STAPLES
    // -------------------------------------------------------------------------
    'roti_phulka': {
        id: 'roti_phulka',
        name: 'Whole Wheat Roti / Phulka',
        category: 'carb',
        portionSize: 1,
        portionUnit: 'medium roti (~35g dough)',
        calories: 85,
        proteinG: 3.0,
        carbsG: 17.0,
        fatsG: 0.5,
        description: 'Standard hostel mess roti without excess ghee. 2 rotis default, 3rd if genuinely hungry.'
    },
    'rice_cooked': {
        id: 'rice_cooked',
        name: 'Cooked White / Brown Rice',
        category: 'carb',
        portionSize: 1,
        portionUnit: 'katori / cup (~150g cooked)',
        calories: 195,
        proteinG: 4.2,
        carbsG: 43.0,
        fatsG: 0.5,
        description: 'Easy-to-digest carbohydrate alternative to roti. Never forbidden.'
    },
    'bread_slice': {
        id: 'bread_slice',
        name: 'Bread Slice (White/Brown)',
        category: 'carb',
        portionSize: 1,
        portionUnit: 'slice (~28g)',
        calories: 75,
        proteinG: 2.5,
        carbsG: 14.0,
        fatsG: 1.0,
        description: 'Quick pre-workout glycogen booster if energy is lagging.'
    },
    'banana': {
        id: 'banana',
        name: 'Fresh Banana',
        category: 'fruit',
        portionSize: 1,
        portionUnit: 'medium banana (~118g)',
        calories: 105,
        proteinG: 1.3,
        carbsG: 27.0,
        fatsG: 0.3,
        description: 'Potassium and easily absorbable pre-workout carbs.'
    },
    'apple': {
        id: 'apple',
        name: 'Fresh Apple',
        category: 'fruit',
        portionSize: 1,
        portionUnit: 'medium apple (~180g)',
        calories: 95,
        proteinG: 0.5,
        carbsG: 25.0,
        fatsG: 0.3,
        description: 'Crunchy fiber snack for late-night satiety.'
    },
    'sabzi_mess': {
        id: 'sabzi_mess',
        name: 'Hostel Mess Seasonal Sabzi',
        category: 'veggie',
        portionSize: 1,
        portionUnit: 'katori / cup (~150g)',
        calories: 110,
        proteinG: 2.5,
        carbsG: 12.0,
        fatsG: 6.0,
        description: 'Seasonal vegetables (gourd, bhindi, beans, aloo-gobhi) with moderate mess oil.'
    },
    'black_coffee': {
        id: 'black_coffee',
        name: 'Black Coffee (No Sugar)',
        category: 'beverage',
        portionSize: 1,
        portionUnit: 'cup (200ml)',
        calories: 2,
        proteinG: 0.2,
        carbsG: 0.0,
        fatsG: 0.0,
        caffeineMg: 80,
        description: 'Alertness booster. Morning and pre-workout only. Avoid within 6 hours of sleep.'
    },
    'water': {
        id: 'water',
        name: 'Drinking Water',
        category: 'hydration',
        portionSize: 250,
        portionUnit: 'ml (1 glass)',
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatsG: 0,
        description: 'Essential for cellular hydration, creatine transport, and metabolic rate.'
    },
    'whey_optional': {
        id: 'whey_optional',
        name: 'Whey Protein (Optional Backup Only)',
        category: 'protein',
        portionSize: 1,
        portionUnit: 'scoop (~32g)',
        calories: 125,
        proteinG: 24.0,
        carbsG: 2.5,
        fatsG: 1.5,
        notes: 'OPTIONAL backup only. Whole foods (eggs/soy chunks/paneer) remain the primary hostel protein.',
        description: 'Convenient emergency backup if hostel mess runs out of eggs or curd.'
    }
};

// -----------------------------------------------------------------------------
// STRICT FOOD SUBSTITUTION RULES ENGINE
// -----------------------------------------------------------------------------
const FOOD_SUBSTITUTIONS = {
    // 1. Paneer ↔ Tofu
    'paneer': [
        {
            targetFoodId: 'tofu',
            label: 'Swap for Tofu (150g)',
            ratioMultiplier: 1.5, // 100g paneer ~ 150g tofu for similar protein with less fat
            reason: 'Reduces fats by ~13g while maintaining ~15g protein. Great for extra calorie room.'
        }
    ],
    'tofu': [
        {
            targetFoodId: 'paneer',
            label: 'Swap for Paneer (100g)',
            ratioMultiplier: 0.67,
            reason: 'Provides richer satiety and calcium if daily calories allow.'
        }
    ],
    // 2. Eggs ↔ Soy Chunks
    'egg_whole': [
        {
            targetFoodId: 'soy_chunks_dry',
            label: 'Swap for Soy Chunks (Dry)',
            ratioMultiplier: 15, // 1 whole egg (6.3g P) ~ 12-15g dry soy chunks (~6.5-7.8g P)
            reason: 'High protein plant substitute. Measure dry before boiling.'
        }
    ],
    'soy_chunks_dry': [
        {
            targetFoodId: 'egg_whole',
            label: 'Swap for Whole Boiled Eggs',
            ratioMultiplier: 0.06, // 50g dry soy (26g P) ~ 4 whole eggs or 3 eggs + 2 whites
            reason: 'Animal protein alternative with optimal amino acid absorption.'
        }
    ],
    // 3. Roti ↔ Rice
    'roti_phulka': [
        {
            targetFoodId: 'rice_cooked',
            label: 'Swap 2 Rotis for 1 Katori Rice',
            ratioMultiplier: 0.5, // 2 rotis (170 kcal, 34g C) ~ 1 cup cooked rice (195 kcal, 43g C)
            reason: 'Rice is easy to digest and 100% allowed based on hostel availability.'
        }
    ],
    'rice_cooked': [
        {
            targetFoodId: 'roti_phulka',
            label: 'Swap 1 Katori Rice for 2 Rotis',
            ratioMultiplier: 2.0,
            reason: 'Provides higher fiber and slightly more protein per calorie.'
        }
    ],
    // 4. Curd ↔ Milk
    'curd_plain': [
        {
            targetFoodId: 'milk_toned',
            label: 'Swap for 1 Glass Toned Milk (200ml)',
            ratioMultiplier: 1.33,
            reason: 'Equivalent dairy protein when mess curd is unavailable.'
        }
    ],
    'milk_toned': [
        {
            targetFoodId: 'curd_plain',
            label: 'Swap for 1 Bowl Curd (150g)',
            ratioMultiplier: 0.75,
            reason: 'Adds probiotics and slower gastric emptying.'
        }
    ],
    // 5. Optional Whey ↔ Whole Food (Eggs / Soy)
    'whey_optional': [
        {
            targetFoodId: 'egg_white',
            label: 'Swap 1 scoop Whey for 5 Egg Whites + 1 Whole Egg',
            ratioMultiplier: 6.0,
            reason: 'Whole food protein equivalent without requiring protein powder.'
        },
        {
            targetFoodId: 'soy_chunks_dry',
            label: 'Swap 1 scoop Whey for 50g DRY Soy Chunks',
            ratioMultiplier: 50.0,
            reason: 'Budget-friendly hostel staple with 26g protein.'
        }
    ],
    'whey_protein_optional': [
        {
            targetFoodId: 'egg_white',
            label: 'Swap 1 scoop Whey for 5 Egg Whites + 1 Whole Egg',
            ratioMultiplier: 6.0,
            reason: 'Whole food protein equivalent without requiring protein powder.'
        },
        {
            targetFoodId: 'soy_chunks_dry',
            label: 'Swap 1 scoop Whey for 50g DRY Soy Chunks',
            ratioMultiplier: 50.0,
            reason: 'Budget-friendly hostel staple with 26g protein.'
        }
    ]
};

// -----------------------------------------------------------------------------
// STRICT 7-DAY HOSTEL FAT LOSS ROTATION (NO CHICKEN)
// Targets: ~2,200–2,300 kcal/day | 140–160g protein | 2.5–3.5L water
// -----------------------------------------------------------------------------
const HOSTEL_WEEKLY_DIET_PLAN = [
    // -------------------------------------------------------------------------
    // 1. MONDAY (Back + Biceps Gym Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 1,
        dayName: 'Monday',
        gymFocus: 'Back + Biceps',
        cardioSchedule: '25 min Incline Walking',
        targetCalories: 2260,
        targetProteinG: 154,
        meals: {
            breakfast: {
                name: 'Morning Protein Oats & Eggs',
                time: '08:30 AM',
                items: [
                    { foodId: 'protein_oats', quantity: 50, unit: 'g', notes: 'Adjust quantity if needed' },
                    { foodId: 'egg_whole', quantity: 2, unit: 'eggs', notes: 'Boiled' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Carbs for mental focus' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Black coffee, no sugar' }
                ],
                guidance: 'Solid start with 50g protein oats and 2 whole eggs. Black coffee sharpens morning study.'
            },
            lunch: {
                name: 'Hostel Mess Lunch',
                time: '01:15 PM',
                items: [
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Default 2 rotis. 3rd allowed if hungry' },
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Ask for thicker dal portion' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Mess vegetable' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: '150g for gut health & protein' }
                ],
                guidance: 'Default 2 rotis. If rice is served today, 1 katori rice can replace 2 rotis without guilt.'
            },
            pre_workout: {
                name: 'Pre-Workout Fuel (45-60 min prior)',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Electrolytes & fast carbs' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Pre-gym alertness' },
                    { foodId: 'water', quantity: 600, unit: 'ml', notes: 'Hydrate well before training' }
                ],
                optionalItems: [
                    { foodId: 'bread_slice', quantity: 2, unit: 'slices', notes: 'Add if energy has been low previously' }
                ],
                guidance: 'Hydrate with 600ml water. If workout energy is low, add 2 slices of bread for carb boost.'
            },
            post_workout: {
                name: 'Post-Workout High-Protein Refuel',
                time: '07:30 PM',
                items: [
                    { foodId: 'egg_whole', quantity: 3, unit: 'eggs', notes: 'Whole eggs (boiled or scrambled)' },
                    { foodId: 'egg_white', quantity: 2, unit: 'whites', notes: 'Egg whites for pure protein' }
                ],
                alternativeOptions: [
                    {
                        name: 'Option B: 55g DRY Soy Chunks',
                        items: [{ foodId: 'soy_chunks_dry', quantity: 55, unit: 'g', notes: 'Weigh 55g DRY before boiling' }]
                    },
                    {
                        name: 'Option C: 2 Eggs + 35g DRY Soy Chunks',
                        items: [
                            { foodId: 'egg_whole', quantity: 2, unit: 'eggs' },
                            { foodId: 'soy_chunks_dry', quantity: 35, unit: 'g', notes: 'Dry weight' }
                        ]
                    }
                ],
                guidance: 'Option A: 3 whole eggs + 2 egg whites (~26g P). Option B: 55g DRY soy chunks (~28g P).'
            },
            dinner: {
                name: 'Hostel Mess High-Protein Dinner',
                time: '09:00 PM',
                items: [
                    { foodId: 'paneer', quantity: 100, unit: 'g', notes: 'Mess paneer sabzi or raw cubes' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Warm mess dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Whole wheat roti' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Salad or mixed vegetables' }
                ],
                guidance: 'Prioritize paneer and dal. Do not eliminate carbs; 2 rotis provides sustained overnight energy.'
            },
            late_night: {
                name: 'Optional Late-Night Study Snack',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'oats_plain', quantity: 35, unit: 'g', notes: 'Cooked with hot water/pinch of cinnamon' }
                ],
                alternativeItems: [
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: '150g curd' },
                    { foodId: 'apple', quantity: 1, unit: 'medium', notes: 'Crisp apple' }
                ],
                guidance: 'OPTIONAL controlled snack only if studying late and genuinely hungry. Skip if satisfied.'
            }
        }
    },

    // -------------------------------------------------------------------------
    // 2. TUESDAY (Legs + Shoulders Gym Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 2,
        dayName: 'Tuesday',
        gymFocus: 'Legs + Shoulders',
        cardioSchedule: 'Rest from cardio (Heavy leg recovery)',
        targetCalories: 2280,
        targetProteinG: 156,
        meals: {
            breakfast: {
                name: 'Power Protein Oats & Egg Whites',
                time: '08:30 AM',
                items: [
                    { foodId: 'protein_oats', quantity: 60, unit: 'g', notes: 'Slightly higher carb for leg day' },
                    { foodId: 'egg_white', quantity: 3, unit: 'whites', notes: 'Boiled egg whites' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Glycogen loading' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Alertness' }
                ],
                guidance: '60g oats and banana load muscle glycogen for afternoon squat and leg training.'
            },
            lunch: {
                name: 'Hostel Rice & Dal Feast',
                time: '01:15 PM',
                items: [
                    { foodId: 'rice_cooked', quantity: 1, unit: 'katori', notes: 'Hostel mess rice' },
                    { foodId: 'roti_phulka', quantity: 1, unit: 'roti', notes: '1 roti alongside rice' },
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Thick yellow dal' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Mess vegetable' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: '150g dahi' }
                ],
                guidance: 'Rice is allowed and welcomed on heavy leg training days. Digestible fuel.'
            },
            pre_workout: {
                name: 'Pre-Legs Fuel',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Fast energy' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Caffeine spark' },
                    { foodId: 'bread_slice', quantity: 2, unit: 'slices', notes: 'Recommended for leg day intensity' },
                    { foodId: 'water', quantity: 700, unit: 'ml', notes: 'Thorough hydration' }
                ],
                guidance: 'Leg day demands higher glycogen. 2 bread slices + banana + coffee is ideal.'
            },
            post_workout: {
                name: 'Soy Chunks Power Refuel',
                time: '07:30 PM',
                items: [
                    { foodId: 'soy_chunks_dry', quantity: 55, unit: 'g', notes: '55g DRY weight (~28.6g protein)' }
                ],
                alternativeOptions: [
                    {
                        name: 'Option A: 3 Whole Eggs + 2 Whites',
                        items: [
                            { foodId: 'egg_whole', quantity: 3, unit: 'eggs' },
                            { foodId: 'egg_white', quantity: 2, unit: 'whites' }
                        ]
                    }
                ],
                guidance: 'Boil 55g DRY soy chunks for 6-8 mins. Squeeze water, toss with chaat masala or black pepper.'
            },
            dinner: {
                name: 'Tofu / Paneer & Dal Dinner',
                time: '09:00 PM',
                items: [
                    { foodId: 'tofu', quantity: 150, unit: 'g', notes: 'Tofu bhurji or mess paneer' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Warm mess dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Roti' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Green vegetables' }
                ],
                guidance: '150g Tofu provides ~15g lean protein with lower fats, balancing total daily calories.'
            },
            late_night: {
                name: 'Optional Recovery Curd / Fruit',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Cooling plain dahi' }
                ],
                guidance: 'Light and soothing. Skip if dinner was completely filling.'
            }
        }
    },

    // -------------------------------------------------------------------------
    // 3. WEDNESDAY (Chest + Triceps Gym Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 3,
        dayName: 'Wednesday',
        gymFocus: 'Chest + Triceps',
        cardioSchedule: '25 min Incline Walking',
        targetCalories: 2240,
        targetProteinG: 152,
        meals: {
            breakfast: {
                name: 'Egg Scramble & Toast Breakfast',
                time: '08:30 AM',
                items: [
                    { foodId: 'egg_whole', quantity: 2, unit: 'eggs', notes: 'Whole eggs' },
                    { foodId: 'egg_white', quantity: 2, unit: 'whites', notes: 'Egg whites' },
                    { foodId: 'bread_slice', quantity: 2, unit: 'slices', notes: 'Toasted bread' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Fresh banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Morning black coffee' }
                ],
                guidance: 'Variation day: Eggs on toast replaces oats this morning. Crisp and high in choline.'
            },
            lunch: {
                name: 'Hostel Mess Dal & Roti',
                time: '01:15 PM',
                items: [
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: '2 rotis' },
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Generous dal' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Vegetable curry' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Curd' }
                ],
                guidance: 'Eat vegetables first, then dal and rotis for optimal satiety and glucose response.'
            },
            pre_workout: {
                name: 'Pre-Chest Session Fuel',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Fast potassium' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Pre-workout coffee' },
                    { foodId: 'water', quantity: 600, unit: 'ml', notes: 'Hydration' }
                ],
                guidance: 'Drink 600ml water across 30 minutes before stepping into gym.'
            },
            post_workout: {
                name: 'Egg & Soy Combo Refuel',
                time: '07:30 PM',
                items: [
                    { foodId: 'egg_whole', quantity: 2, unit: 'eggs', notes: '2 whole eggs' },
                    { foodId: 'soy_chunks_dry', quantity: 35, unit: 'g', notes: '35g DRY soy chunks (~18g P)' }
                ],
                guidance: 'Synergistic combination: Whole eggs provide essential fats and leucine, soy chunks provide high protein density.'
            },
            dinner: {
                name: 'Paneer Bhurji & Roti Dinner',
                time: '09:00 PM',
                items: [
                    { foodId: 'paneer', quantity: 100, unit: 'g', notes: '100g paneer' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Mess dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Whole wheat roti' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Veggies' }
                ],
                guidance: 'Paneer casein protein sustains muscle protein synthesis through the night.'
            },
            late_night: {
                name: 'Optional Oats or Apple',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'oats_plain', quantity: 30, unit: 'g', notes: 'Light oats with hot water' }
                ],
                guidance: 'Optional study snack if working on late night coding projects.'
            }
        }
    },

    // -------------------------------------------------------------------------
    // 4. THURSDAY (Back + Biceps Gym Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 4,
        dayName: 'Thursday',
        gymFocus: 'Back + Biceps',
        cardioSchedule: '25 min Incline Walking',
        targetCalories: 2250,
        targetProteinG: 155,
        meals: {
            breakfast: {
                name: 'Milk & Protein Oats Bowl',
                time: '08:30 AM',
                items: [
                    { foodId: 'protein_oats', quantity: 50, unit: 'g', notes: 'Protein oats' },
                    { foodId: 'milk_toned', quantity: 200, unit: 'ml', notes: 'Warm toned milk' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Sliced banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Black coffee' }
                ],
                guidance: 'Protein oats made with warm toned milk adds extra calcium and 6.2g dairy protein.'
            },
            lunch: {
                name: 'Hostel Mess Lunch',
                time: '01:15 PM',
                items: [
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis' },
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Dal' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Sabzi' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Curd' }
                ],
                guidance: 'Standard mess meal. Portion control: stick to 2 rotis; have extra dal if hungry.'
            },
            pre_workout: {
                name: 'Pre-Back Workout',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Coffee' },
                    { foodId: 'water', quantity: 600, unit: 'ml', notes: 'Water' }
                ],
                guidance: 'If energy is low from morning classes, grab 1 extra slice of bread.'
            },
            post_workout: {
                name: 'Egg Feast Post-Back',
                time: '07:30 PM',
                items: [
                    { foodId: 'egg_whole', quantity: 3, unit: 'eggs', notes: '3 whole eggs' },
                    { foodId: 'egg_white', quantity: 2, unit: 'whites', notes: '2 egg whites' }
                ],
                alternativeOptions: [
                    {
                        name: 'Option B: 55g DRY Soy Chunks',
                        items: [{ foodId: 'soy_chunks_dry', quantity: 55, unit: 'g', notes: 'Dry weight' }]
                    }
                ],
                guidance: '3 whole eggs + 2 egg whites provides ~26g protein and healthy fats.'
            },
            dinner: {
                name: 'Soya Chunk Sabzi & Roti Dinner',
                time: '09:00 PM',
                items: [
                    { foodId: 'soy_chunks_dry', quantity: 50, unit: 'g', notes: 'Prepared as hostel soya curry' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Dal' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Veggies' }
                ],
                guidance: 'Soya chunk curry for dinner gives 26g protein with virtually no fat.'
            },
            late_night: {
                name: 'Optional Night Fruit / Warm Milk',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'apple', quantity: 1, unit: 'medium', notes: 'Apple' }
                ],
                guidance: 'Optional. Crisp apple provides natural pectin fiber.'
            }
        }
    },

    // -------------------------------------------------------------------------
    // 5. FRIDAY (Legs + Shoulders Gym Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 5,
        dayName: 'Friday',
        gymFocus: 'Legs + Shoulders',
        cardioSchedule: 'Rest from cardio (Heavy leg recovery)',
        targetCalories: 2270,
        targetProteinG: 155,
        meals: {
            breakfast: {
                name: 'Protein Oats & Boiled Eggs',
                time: '08:30 AM',
                items: [
                    { foodId: 'protein_oats', quantity: 50, unit: 'g', notes: 'Protein oats' },
                    { foodId: 'egg_whole', quantity: 2, unit: 'eggs', notes: 'Boiled eggs' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Black coffee' }
                ],
                guidance: 'Steady fuel for Friday classes and evening leg session.'
            },
            lunch: {
                name: 'Hostel Rice & Dal Plate',
                time: '01:15 PM',
                items: [
                    { foodId: 'rice_cooked', quantity: 1, unit: 'katori', notes: 'Mess rice' },
                    { foodId: 'roti_phulka', quantity: 1, unit: 'roti', notes: '1 roti' },
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Dal' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Curd' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Sabzi' }
                ],
                guidance: 'Good blend of rice and roti provides fast and slow carbohydrates.'
            },
            pre_workout: {
                name: 'Pre-Workout Leg Fuel',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Banana' },
                    { foodId: 'bread_slice', quantity: 2, unit: 'slices', notes: 'Carb boost' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Coffee' },
                    { foodId: 'water', quantity: 700, unit: 'ml', notes: 'Hydration' }
                ],
                guidance: '2 slices of bread + banana provides ~41g clean carbs for heavy squats.'
            },
            post_workout: {
                name: 'Soy Chunks Refuel',
                time: '07:30 PM',
                items: [
                    { foodId: 'soy_chunks_dry', quantity: 55, unit: 'g', notes: '55g DRY weight' }
                ],
                alternativeOptions: [
                    {
                        name: 'Option A: 3 Eggs + 2 Whites',
                        items: [
                            { foodId: 'egg_whole', quantity: 3, unit: 'eggs' },
                            { foodId: 'egg_white', quantity: 2, unit: 'whites' }
                        ]
                    }
                ],
                guidance: 'High plant protein refuel. Pair with plenty of water.'
            },
            dinner: {
                name: 'Tofu / Paneer & Roti Dinner',
                time: '09:00 PM',
                items: [
                    { foodId: 'tofu', quantity: 140, unit: 'g', notes: 'Tofu or mess paneer' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Veggies' }
                ],
                guidance: 'Clean protein finish to end the college week.'
            },
            late_night: {
                name: 'Optional Curd Snack',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Dahi' }
                ],
                guidance: 'Optional dahi before sleep.'
            }
        }
    },

    // -------------------------------------------------------------------------
    // 6. SATURDAY (Chest + Triceps Gym Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 6,
        dayName: 'Saturday',
        gymFocus: 'Chest + Triceps',
        cardioSchedule: '25 min Incline Walking or Cycling',
        targetCalories: 2260,
        targetProteinG: 154,
        meals: {
            breakfast: {
                name: 'Hostel Weekend Egg Toast',
                time: '09:00 AM',
                items: [
                    { foodId: 'egg_whole', quantity: 3, unit: 'eggs', notes: '3 whole eggs scrambled' },
                    { foodId: 'bread_slice', quantity: 2, unit: 'slices', notes: 'Toasted bread' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Coffee' }
                ],
                guidance: 'Weekend breakfast: 3 whole eggs with toast gives 24g protein and sustained energy.'
            },
            lunch: {
                name: 'Saturday Mess Lunch',
                time: '01:30 PM',
                items: [
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis' },
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Dal' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Sabzi' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Curd' }
                ],
                guidance: 'Relaxed mess meal. Maintain hydration with water.'
            },
            pre_workout: {
                name: 'Pre-Chest Session',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Coffee' },
                    { foodId: 'water', quantity: 600, unit: 'ml', notes: 'Water' }
                ],
                guidance: 'Ensure at least 500-600ml water.'
            },
            post_workout: {
                name: 'Eggs / Soy Protein Recovery',
                time: '07:30 PM',
                items: [
                    { foodId: 'egg_whole', quantity: 3, unit: 'eggs', notes: '3 whole eggs' },
                    { foodId: 'egg_white', quantity: 2, unit: 'whites', notes: '2 whites' }
                ],
                alternativeOptions: [
                    {
                        name: 'Option B: 55g DRY Soy Chunks',
                        items: [{ foodId: 'soy_chunks_dry', quantity: 55, unit: 'g', notes: 'Dry weight' }]
                    }
                ],
                guidance: 'Post-bench press protein refuel.'
            },
            dinner: {
                name: 'Hostel Paneer Feast',
                time: '09:00 PM',
                items: [
                    { foodId: 'paneer', quantity: 100, unit: 'g', notes: '100g Paneer' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Salad' }
                ],
                guidance: 'Casein protein and healthy fats.'
            },
            late_night: {
                name: 'Optional Weekend Study Snack',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'oats_plain', quantity: 35, unit: 'g', notes: 'Warm oats' }
                ],
                guidance: 'Optional oats if tackling night coding projects.'
            }
        }
    },

    // -------------------------------------------------------------------------
    // 7. SUNDAY (Rest & Active Recovery Day)
    // -------------------------------------------------------------------------
    {
        dayIndex: 0,
        dayName: 'Sunday',
        gymFocus: 'Active Recovery & Campus Walk',
        cardioSchedule: 'Brisk Campus Walking (8,000–10,000 steps)',
        targetCalories: 2200,
        targetProteinG: 150,
        meals: {
            breakfast: {
                name: 'Sunday Morning Protein Oats',
                time: '09:30 AM',
                items: [
                    { foodId: 'protein_oats', quantity: 60, unit: 'g', notes: 'Protein oats' },
                    { foodId: 'egg_white', quantity: 2, unit: 'whites', notes: 'Egg whites' },
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Banana' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Coffee' }
                ],
                guidance: 'Relaxed Sunday morning routine. Ample micronutrients and fiber.'
            },
            lunch: {
                name: 'Sunday Hostel Special Lunch',
                time: '01:30 PM',
                items: [
                    { foodId: 'dal_mess', quantity: 1.5, unit: 'katoris', notes: 'Dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis or 1 cup Rice' },
                    { foodId: 'curd_plain', quantity: 1, unit: 'katori', notes: 'Curd' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Special sabzi' }
                ],
                guidance: 'Enjoy the mess meal mindfully. Do not overeat heavy oily snacks.'
            },
            pre_workout: {
                name: 'Pre-Walk Hydration & Coffee',
                time: '05:30 PM',
                items: [
                    { foodId: 'banana', quantity: 1, unit: 'medium', notes: 'Fruit' },
                    { foodId: 'black_coffee', quantity: 1, unit: 'cup', notes: 'Coffee' },
                    { foodId: 'water', quantity: 600, unit: 'ml', notes: 'Water' }
                ],
                guidance: 'Coffee and hydration before evening outdoor steps or campus walk.'
            },
            post_workout: {
                name: 'High-Protein Soy & Egg Snack',
                time: '07:30 PM',
                items: [
                    { foodId: 'soy_chunks_dry', quantity: 40, unit: 'g', notes: 'Dry weight (~21g P)' },
                    { foodId: 'egg_whole', quantity: 2, unit: 'eggs', notes: '2 eggs (~12.6g P)' }
                ],
                guidance: 'Maintains muscle recovery even on rest days. Muscles repair when resting.'
            },
            dinner: {
                name: 'Sunday Evening Mess Dinner',
                time: '09:00 PM',
                items: [
                    { foodId: 'paneer', quantity: 100, unit: 'g', notes: '100g Paneer' },
                    { foodId: 'dal_mess', quantity: 1, unit: 'katori', notes: 'Dal' },
                    { foodId: 'roti_phulka', quantity: 2, unit: 'rotis', notes: 'Rotis' },
                    { foodId: 'sabzi_mess', quantity: 1, unit: 'katori', notes: 'Sabzi' }
                ],
                guidance: 'Clean dinner to prepare for the upcoming academic and training week.'
            },
            late_night: {
                name: 'Optional Milk or Curd',
                time: '11:45 PM',
                isOptional: true,
                items: [
                    { foodId: 'milk_toned', quantity: 200, unit: 'ml', notes: 'Warm milk' }
                ],
                guidance: 'Optional warm milk promotes restful sleep.'
            }
        }
    }
];

// -----------------------------------------------------------------------------
// CARDIO PROGRAM SPECIFICATION
// -----------------------------------------------------------------------------
const CARDIO_PROGRAM = {
    phases: {
        'WEEK_1_2': {
            name: 'Phase 1: Foundation (Weeks 1–2)',
            sessionsPerWeek: 3,
            durationMinutes: 25,
            intensity: 'Moderate Aerobic (Heart Rate Zone 2 / RPE 5–6)',
            recommendedTypes: [
                'Incline Treadmill Walking (10-12% incline @ 4.0-4.5 km/h)',
                'Brisk Outdoor Campus Walking',
                'Stationary Cycling (Moderate resistance)',
                'Elliptical Cross-Trainer'
            ],
            notes: 'Low impact, joint-friendly, preserves knee and lower back recovery for heavy squats.'
        },
        'WEEK_3_4': {
            name: 'Phase 2: Progression (Weeks 3–4)',
            sessionsPerWeek: 3,
            durationMinutes: 30,
            intensity: 'Zone 2 Fat Oxidation',
            recommendedTypes: [
                'Incline Treadmill Walking (12% incline @ 4.5 km/h)',
                'Brisk Campus Walking',
                'Cycling'
            ],
            notes: 'Adds +5 minutes per session. Increases daily energy expenditure smoothly.'
        },
        'AFTER_WEEK_4': {
            name: 'Phase 3: Plateau Buster (Week 5+)',
            sessionsPerWeek: 3,
            durationMinutes: 35,
            intensity: 'Controlled Aerobic',
            condition: 'ONLY if recovery, sleep, and gym lifting strength remain high.',
            recommendedTypes: [
                'Incline Treadmill Walking',
                'Brisk Walking'
            ],
            notes: 'Do NOT increase cardio if fatigue or lifting performance drops.'
        }
    }
};

// -----------------------------------------------------------------------------
// RULES-BASED PROGRESS & ADJUSTMENT ENGINE
// -----------------------------------------------------------------------------
const NutritionProgressRules = {
    /**
     * Evaluates weekly trends and generates concise, science-backed guidance.
     * @param {Object} profile - User profile with current milestones and targets
     * @param {Array} recentWeightLogs - Array of recent weight objects { date, weightKg, rolling7dAvg }
     * @param {Array} recentWaistLogs - Array of waist logs { date, waistInches }
     * @param {Array} recentDailyLogs - Array of daily logs { totalCalories, totalProteinG, steps, cardioMinutes, energyLevel, sleepHours }
     */
    evaluateProgress(profile, recentWeightLogs = [], recentWaistLogs = [], recentDailyLogs = []) {
        const warnings = [];
        const recommendations = [];
        let status = 'ON_TRACK';
        let actionType = 'CONTINUE_PLAN';

        // 1. Calculate 7-day Rolling Averages
        const sortedWeights = [...recentWeightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestWeight = sortedWeights.length > 0 ? sortedWeights[sortedWeights.length - 1].weightKg : profile.currentWeightKg;
        
        let current7dAvg = profile.currentWeightKg;
        let prev7dAvg = profile.currentWeightKg;
        
        if (sortedWeights.length >= 7) {
            const last7 = sortedWeights.slice(-7);
            current7dAvg = Number((last7.reduce((acc, curr) => acc + curr.weightKg, 0) / 7).toFixed(2));
            if (sortedWeights.length >= 14) {
                const prev7 = sortedWeights.slice(-14, -7);
                prev7dAvg = Number((prev7.reduce((acc, curr) => acc + curr.weightKg, 0) / 7).toFixed(2));
            } else {
                prev7dAvg = profile.startingWeightKg;
            }
        } else if (sortedWeights.length > 0) {
            current7dAvg = Number((sortedWeights.reduce((acc, curr) => acc + curr.weightKg, 0) / sortedWeights.length).toFixed(2));
            prev7dAvg = profile.startingWeightKg;
        }

        const weeklyWeightChange = Number((current7dAvg - prev7dAvg).toFixed(2));
        const totalWeightLost = Number((profile.startingWeightKg - current7dAvg).toFixed(2));

        // 2. Waist Trend
        const sortedWaists = [...recentWaistLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestWaist = sortedWaists.length > 0 ? sortedWaists[sortedWaists.length - 1].waistInches : null;
        let waistChange = 0;
        if (sortedWaists.length >= 2) {
            waistChange = Number((sortedWaists[sortedWaists.length - 1].waistInches - sortedWaists[0].waistInches).toFixed(2));
        }

        // 3. Adherence Metrics
        const daysCount = Math.max(1, recentDailyLogs.length);
        const avgCalories = Math.round(recentDailyLogs.reduce((acc, l) => acc + (l.totalCalories || 0), 0) / daysCount);
        const avgProtein = Math.round(recentDailyLogs.reduce((acc, l) => acc + (l.totalProteinG || 0), 0) / daysCount);
        const avgSteps = Math.round(recentDailyLogs.reduce((acc, l) => acc + (l.steps || 0), 0) / daysCount);
        const avgSleep = Number((recentDailyLogs.reduce((acc, l) => acc + (l.sleepHours || 0), 0) / daysCount).toFixed(1));
        const lowEnergyDays = recentDailyLogs.filter(l => l.energyLevel === 'LOW' || l.energyLevel === 'VERY_LOW').length;

        // 4. Milestone Evaluation
        const currentMilestone = profile.currentMilestoneKg || 87.0;
        const reachedMilestone = current7dAvg <= currentMilestone;

        if (reachedMilestone) {
            status = 'MILESTONE_REACHED';
            actionType = 'REASSESS_MILESTONE';
            recommendations.push(`🎉 Congratulations! You reached your ${currentMilestone} kg milestone! Take 1-2 weeks to reassess physique, waist circumference, gym strength, and energy levels before setting the next milestone (87 kg → 82 kg).`);
        } else if (weeklyWeightChange < -1.2) {
            // Dropping unusually fast
            status = 'RAPID_LOSS_WARNING';
            actionType = 'CHECK_INTAKE';
            warnings.push('Weight is dropping faster than 1.2 kg/week. While exciting, this risks lean muscle loss and metabolic slowdown.');
            recommendations.push('Verify that you are eating your full hostel meals and hitting your 150g protein target daily. Avoid skipping lunch or dinner.');
        } else if (weeklyWeightChange >= -0.8 && weeklyWeightChange <= -0.3) {
            // Steady fat loss
            status = 'STEADY_PROGRESS';
            actionType = 'CONTINUE_PLAN';
            recommendations.push('Optimal fat loss rate (0.3–0.8 kg/week). Your calorie deficit is dialed in and lean muscle mass is preserved. Continue your current plan.');
        } else if (weeklyWeightChange > -0.1 && sortedWeights.length >= 14) {
            // Weight plateau for 2+ weeks
            if (waistChange < -0.2) {
                // Scale flat but waist dropping = body recomposition!
                status = 'BODY_RECOMP';
                actionType = 'CONTINUE_PLAN';
                recommendations.push('Scale weight is flat, but waist is decreasing! This indicates body recomposition (muscle gain + fat loss). Do not cut calories.');
            } else {
                status = 'PLATEAU';
                actionType = 'SMALL_ADJUSTMENT';
                recommendations.push('Weight and waist have been stable for ~2–3 weeks. You can make a small, controlled adjustment:');
                recommendations.push('• Option 1: Reduce daily calories by 100 kcal (e.g., from 2,250 to 2,150 kcal/day).');
                recommendations.push('• Option 2: Increase daily campus steps from 8,000 to 10,000.');
                recommendations.push('• Option 3: Add +5 minutes to your 3 weekly cardio sessions (25m → 30m).');
                recommendations.push('Do NOT implement crash diets or severe calorie drops.');
            }
        }

        // 6. Energy and Gym Recovery Evaluation
        if (lowEnergyDays >= 3) {
            warnings.push('Your training energy has been low on multiple days recently.');
            recommendations.push('Energy Check: Check sleep duration (target 7–9h), water intake (target 3.0L), and pre-workout carbohydrates.');
            recommendations.push('Suggested pre-workout: 1 banana + black coffee + 2 bread slices 45 minutes before gym. Do NOT increase cardio while energy is low.');
        }

        // 7. Protein Adherence Evaluation
        if (avgProtein > 0 && avgProtein < (profile.dailyProteinTargetG * 0.85)) {
            warnings.push(`Average protein (${avgProtein}g) is below your ${profile.dailyProteinTargetG}g target.`);
            recommendations.push('Make sure to include your post-workout eggs/soy chunks and mess dal/curd every single day to protect muscle tissue.');
        }

        return {
            status,
            actionType,
            current7dAvg,
            prev7dAvg,
            weeklyWeightChange,
            totalWeightLost,
            latestWeight,
            latestWaist,
            waistChange,
            avgCalories,
            avgProtein,
            avgSteps,
            avgSleep,
            lowEnergyDays,
            warnings,
            recommendations,
            educationalNote: 'Remember: Daily scale weight naturally fluctuates by 1–2 kg due to hydration, glycogen, sodium, and food volume. Trust your 7-day rolling average and waist measurements.'
        };
    },

    /**
     * Safety evaluation for workout energy and physical symptoms
     */
    checkEnergySafety(data = {}) {
        const level = data.level || data.energyLevel || 'NORMAL';
        const symptoms = data.symptoms || [];
        const dangerousList = ['dizziness', 'fainting', 'chest_pain', 'shortness_of_breath', 'nausea'];
        const hasDangerous = symptoms.some(s => dangerousList.includes(s.toLowerCase()));

        if (level === 'VERY_LOW' && hasDangerous) {
            return {
                isEmergency: true,
                message: '🚨 SAFETY ALERT: Dizziness, fainting, chest tightness, or severe weakness reported. Immediately STOP exercise, sit down, drink fluids, and seek qualified professional medical evaluation.'
            };
        } else if (level === 'LOW' || level === 'VERY_LOW') {
            return {
                isEmergency: false,
                message: 'Low training energy detected. Prioritize 7–9h sleep, 3.0L water, and 1 banana + coffee + 2 bread slices 45m before gym.'
            };
        }
        return { isEmergency: false, message: 'Normal energy levels.' };
    }
};

// Export for Node.js (tests and server) and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NUTRITION_FOOD_DATABASE,
        FOOD_SUBSTITUTIONS,
        HOSTEL_WEEKLY_DIET_PLAN,
        CARDIO_PROGRAM,
        NutritionProgressRules
    };
}

if (typeof window !== 'undefined') {
    window.NUTRITION_FOOD_DATABASE = NUTRITION_FOOD_DATABASE;
    window.FOOD_SUBSTITUTIONS = FOOD_SUBSTITUTIONS;
    window.HOSTEL_WEEKLY_DIET_PLAN = HOSTEL_WEEKLY_DIET_PLAN;
    window.CARDIO_PROGRAM = CARDIO_PROGRAM;
    window.NutritionProgressRules = NutritionProgressRules;
}
