-- ==============================================================================
-- STUDYOS FITNESS & NUTRITION ENGINE DATABASE MIGRATION
-- Migration: 20261005000000_fitness_nutrition_engine.sql
-- Targets: Supabase PostgreSQL with Strict Row Level Security (RLS)
-- Multi-user isolated tracking for Fat Loss, 7-day hostel meals, weights,
-- waist measurements, cardio, water, steps, energy, and progress analysis.
-- ==============================================================================

-- 1. NUTRITION PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.nutrition_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    age INT NOT NULL DEFAULT 20 CHECK (age >= 10 AND age <= 100),
    height_cm NUMERIC NOT NULL DEFAULT 170.0 CHECK (height_cm > 50 AND height_cm < 260),
    starting_weight_kg NUMERIC NOT NULL DEFAULT 92.0 CHECK (starting_weight_kg > 20),
    current_weight_kg NUMERIC NOT NULL DEFAULT 92.0 CHECK (current_weight_kg > 20),
    goal_weight_kg NUMERIC NOT NULL DEFAULT 82.0 CHECK (goal_weight_kg > 20),
    current_milestone_kg NUMERIC NOT NULL DEFAULT 87.0 CHECK (current_milestone_kg > 20),
    daily_calorie_target INT NOT NULL DEFAULT 2250 CHECK (daily_calorie_target >= 1200),
    daily_protein_target_g INT NOT NULL DEFAULT 150 CHECK (daily_protein_target_g >= 40),
    daily_water_target_ml INT NOT NULL DEFAULT 3000 CHECK (daily_water_target_ml >= 1000),
    daily_step_target INT NOT NULL DEFAULT 9000 CHECK (daily_step_target >= 1000),
    cardio_sessions_per_week INT NOT NULL DEFAULT 3 CHECK (cardio_sessions_per_week >= 0),
    cardio_duration_minutes INT NOT NULL DEFAULT 25 CHECK (cardio_duration_minutes >= 0),
    cardio_phase TEXT NOT NULL DEFAULT 'WEEK_1_2',
    diet_constraints JSONB NOT NULL DEFAULT '["NO_CHICKEN"]'::jsonb,
    available_protein_sources JSONB NOT NULL DEFAULT '["eggs", "soy_chunks", "paneer", "tofu", "dal", "curd", "milk", "protein_oats", "whey_optional"]'::jsonb,
    macro_splits JSONB NOT NULL DEFAULT '{"carbs_g": 240, "fats_g": 65, "protein_g": 150}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.nutrition_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_profiles_isolation" ON public.nutrition_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. NUTRITION DAILY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.nutrition_daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories INT NOT NULL DEFAULT 0 CHECK (total_calories >= 0),
    total_protein_g NUMERIC NOT NULL DEFAULT 0 CHECK (total_protein_g >= 0),
    total_carbs_g NUMERIC NOT NULL DEFAULT 0 CHECK (total_carbs_g >= 0),
    total_fats_g NUMERIC NOT NULL DEFAULT 0 CHECK (total_fats_g >= 0),
    water_ml INT NOT NULL DEFAULT 0 CHECK (water_ml >= 0),
    steps INT NOT NULL DEFAULT 0 CHECK (steps >= 0),
    sleep_hours NUMERIC NOT NULL DEFAULT 0 CHECK (sleep_hours >= 0),
    energy_level TEXT NOT NULL DEFAULT 'NORMAL', -- 'HIGH', 'NORMAL', 'LOW', 'VERY_LOW'
    energy_notes TEXT,
    cardio_minutes INT NOT NULL DEFAULT 0 CHECK (cardio_minutes >= 0),
    cardio_type TEXT DEFAULT 'Incline Walking',
    cardio_completed BOOLEAN NOT NULL DEFAULT FALSE,
    gym_status TEXT NOT NULL DEFAULT 'PENDING', -- 'COMPLETED', 'REST', 'MISSED', 'PENDING'
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    coffee_cups INT NOT NULL DEFAULT 0 CHECK (coffee_cups >= 0),
    coffee_timing JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nutrition_daily_logs_user_date UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_daily_logs_user_date ON public.nutrition_daily_logs(user_id, date);

ALTER TABLE public.nutrition_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_daily_logs_isolation" ON public.nutrition_daily_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. NUTRITION MEAL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.nutrition_meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'pre_workout', 'post_workout', 'dinner', 'late_night'
    food_id TEXT NOT NULL,
    food_name TEXT NOT NULL,
    portion_description TEXT NOT NULL DEFAULT '1 serving',
    quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'portion',
    calories INT NOT NULL DEFAULT 0 CHECK (calories >= 0),
    protein_g NUMERIC NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
    carbs_g NUMERIC NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
    fats_g NUMERIC NOT NULL DEFAULT 0 CHECK (fats_g >= 0),
    is_eaten BOOLEAN NOT NULL DEFAULT FALSE,
    swapped_from TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_meal_logs_user_date ON public.nutrition_meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_nutrition_meal_logs_user_meal ON public.nutrition_meal_logs(user_id, meal_type);

ALTER TABLE public.nutrition_meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_meal_logs_isolation" ON public.nutrition_meal_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. NUTRITION WEIGHT LOGS TABLE (With 7-Day Rolling Average)
CREATE TABLE IF NOT EXISTS public.nutrition_weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 30 AND weight_kg <= 300),
    rolling_7d_avg NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nutrition_weight_logs_user_date UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_weight_logs_user_date ON public.nutrition_weight_logs(user_id, date);

ALTER TABLE public.nutrition_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_weight_logs_isolation" ON public.nutrition_weight_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. NUTRITION WAIST LOGS TABLE
CREATE TABLE IF NOT EXISTS public.nutrition_waist_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    waist_inches NUMERIC NOT NULL CHECK (waist_inches >= 15 AND waist_inches <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nutrition_waist_logs_user_date UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_waist_logs_user_date ON public.nutrition_waist_logs(user_id, date);

ALTER TABLE public.nutrition_waist_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_waist_logs_isolation" ON public.nutrition_waist_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. NUTRITION CUSTOM FOOD OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS public.nutrition_custom_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_key TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    portion_size NUMERIC NOT NULL DEFAULT 100,
    portion_unit TEXT NOT NULL DEFAULT 'g',
    calories INT NOT NULL CHECK (calories >= 0),
    protein_g NUMERIC NOT NULL CHECK (protein_g >= 0),
    carbs_g NUMERIC NOT NULL CHECK (carbs_g >= 0),
    fats_g NUMERIC NOT NULL CHECK (fats_g >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nutrition_custom_foods_user_key UNIQUE(user_id, food_key)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_custom_foods_user ON public.nutrition_custom_foods(user_id);

ALTER TABLE public.nutrition_custom_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_custom_foods_isolation" ON public.nutrition_custom_foods
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
