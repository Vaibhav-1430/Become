-- ==============================================================================
-- STUDYOS PRODUCTION DATABASE MIGRATION
-- Migration: 20260928000000_initial_studyos_schema.sql
-- Targets: Supabase PostgreSQL with Strict Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE
-- Conceptually links to auth.users (owned by Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'StudyOS Engineer',
    avatar_path TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Trigger to automatically create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, timezone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'Asia/Kolkata'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. STUDY TASKS TABLE (Daily Schedule & Calendar Tasks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    is_study BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    crosses_midnight BOOLEAN NOT NULL DEFAULT FALSE,
    rescheduled_to DATE,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_study_tasks_user_date_task UNIQUE(user_id, date, task_id)
);

CREATE INDEX IF NOT EXISTS idx_study_tasks_user_date ON public.study_tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_status ON public.study_tasks(status);

ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_tasks_isolation" ON public.study_tasks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 3. STUDY SESSIONS TABLE (Active Timer & Deep Focus Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    active_seconds INT NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
    break_seconds INT NOT NULL DEFAULT 0 CHECK (break_seconds >= 0),
    camera_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    presence_rate INT NOT NULL DEFAULT 100 CHECK (presence_rate >= 0 AND presence_rate <= 100),
    ai_insight TEXT,
    start_time TEXT,
    end_time TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, date);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_sessions_isolation" ON public.study_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. STRIVER DSA PROGRESS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dsa_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    notes TEXT,
    solved_at TIMESTAMPTZ,
    revisit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dsa_progress_user_problem UNIQUE(user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_dsa_progress_user_status ON public.dsa_progress(user_id, status);

ALTER TABLE public.dsa_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dsa_progress_isolation" ON public.dsa_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 5. FULL-STACK DEVELOPMENT PROGRESS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.development_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'topics', 'videos', 'tasks', 'projects', 'notes'
    item_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    notes TEXT,
    repo_link TEXT,
    live_link TEXT,
    content TEXT,
    solved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dev_progress_user_cat_item UNIQUE(user_id, category, item_id)
);

CREATE INDEX IF NOT EXISTS idx_dev_progress_user ON public.development_progress(user_id, category);

ALTER TABLE public.development_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "development_progress_isolation" ON public.development_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. MISTAKE BANK TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    source TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_answer TEXT,
    correct_answer TEXT,
    explanation TEXT,
    mistake_type TEXT,
    personal_note TEXT,
    revisit_date DATE,
    repeat_count INT NOT NULL DEFAULT 1 CHECK (repeat_count >= 1),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mistakes_user_subject ON public.mistakes(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_resolved ON public.mistakes(user_id, resolved);

ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mistakes_isolation" ON public.mistakes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. WORKOUT PLANS TABLE (Recurring Weekly Split)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_configured BOOLEAN NOT NULL DEFAULT TRUE,
    settings JSONB NOT NULL DEFAULT '{"trackRPE": true, "trackRestTime": true, "trackPRs": true}'::jsonb,
    schedule JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workout_plans_user UNIQUE(user_id)
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_plans_isolation" ON public.workout_plans
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 8. WORKOUT SESSIONS TABLE (Logged Gym Sessions with Mandatory Photo)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_of_week TEXT NOT NULL,
    day_key TEXT NOT NULL,
    workout_type TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    status TEXT NOT NULL DEFAULT 'completed',
    gym_photo_path TEXT NOT NULL, -- Storage relative path in gym-photos bucket
    total_volume_kg NUMERIC NOT NULL DEFAULT 0 CHECK (total_volume_kg >= 0),
    total_sets INT NOT NULL DEFAULT 0 CHECK (total_sets >= 0),
    total_reps INT NOT NULL DEFAULT 0 CHECK (total_reps >= 0),
    notes TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, date);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sessions_isolation" ON public.workout_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 9. WORKOUT EXERCISES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_name_snapshot TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT,
    order_index INT NOT NULL DEFAULT 0,
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON public.workout_exercises(session_id);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_exercises_isolation" ON public.workout_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_exercises.session_id
            AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_exercises.session_id
            AND s.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 10. WORKOUT SETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL CHECK (set_number >= 1),
    weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 0),
    reps INT NOT NULL CHECK (reps >= 0),
    rpe NUMERIC,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    is_weight_pr BOOLEAN NOT NULL DEFAULT FALSE,
    is_rep_pr BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON public.workout_sets(workout_exercise_id);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sets_isolation" ON public.workout_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises e
            JOIN public.workout_sessions s ON s.id = e.session_id
            WHERE e.id = workout_sets.workout_exercise_id
            AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_exercises e
            JOIN public.workout_sessions s ON s.id = e.session_id
            WHERE e.id = workout_sets.workout_exercise_id
            AND s.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 11. PERSONAL RECORDS (PRs) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    max_weight_kg NUMERIC NOT NULL DEFAULT 0 CHECK (max_weight_kg >= 0),
    max_reps INT NOT NULL DEFAULT 0 CHECK (max_reps >= 0),
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
    CONSTRAINT uq_personal_records_user_exercise UNIQUE(user_id, exercise_id)
);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_records_isolation" ON public.personal_records
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 12. AI SETTINGS & BYOK ENCRYPTION TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_key JSONB, -- { "iv": "...", "tag": "...", "ciphertext": "..." }
    masked_key TEXT,
    model TEXT NOT NULL DEFAULT 'gemini-flash-latest',
    preferred_study_windows JSONB NOT NULL DEFAULT '["06:45-08:15", "23:00-01:30"]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{"dsaDailyTarget": 3, "autoCarryForward": true, "notifyCreatine": true}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ai_settings_user UNIQUE(user_id)
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_settings_isolation" ON public.ai_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 13. PLACEMENT HUB DATA TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.placement_hub_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmaps JSONB NOT NULL DEFAULT '{}'::jsonb,
    resources JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    bookmarks JSONB NOT NULL DEFAULT '[]'::jsonb,
    question_performance JSONB NOT NULL DEFAULT '{}'::jsonb,
    system_design_interviews JSONB NOT NULL DEFAULT '[]'::jsonb,
    weekly_tests JSONB NOT NULL DEFAULT '[]'::jsonb,
    weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    placement_target JSONB NOT NULL DEFAULT '{"achieved": false}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_placement_hub_user UNIQUE(user_id)
);

ALTER TABLE public.placement_hub_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "placement_hub_data_isolation" ON public.placement_hub_data
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 14. INTERNSHIPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    date_applied DATE,
    status TEXT NOT NULL DEFAULT 'SAVED',
    link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internships_isolation" ON public.internships
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 15. STORAGE BUCKET: gym-photos (PRIVATE) & STORAGE RLS POLICIES
-- ==============================================================================
-- Insert the private bucket into storage.buckets if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gym-photos',
    'gym-photos',
    FALSE,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Object RLS Policies
-- Users can only upload, view, or delete photos inside their own folder: gym-photos/{user_id}/*

DROP POLICY IF EXISTS "gym_photos_insert_own" ON storage.objects;
CREATE POLICY "gym_photos_insert_own" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'gym-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "gym_photos_select_own" ON storage.objects;
CREATE POLICY "gym_photos_select_own" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gym-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "gym_photos_delete_own" ON storage.objects;
CREATE POLICY "gym_photos_delete_own" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'gym-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
