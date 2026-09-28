-- ==============================================================================
-- STUDYOS PRODUCTION DATABASE MIGRATION: PHASE 1B
-- Migration: 20260928000001_phase1b_sync_metadata.sql
-- Targets: Sync metadata, auto-updated timestamps, calendar fidelity & RLS
-- ==============================================================================

-- 1. Create reusable trigger function for automatic updated_at timestamp management
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Enhance study_tasks to ensure full calendar reconstruction fidelity
-- Ensure rescheduled_to is TEXT so it can store task IDs or dates without type errors
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'study_tasks' 
        AND column_name = 'rescheduled_to' 
        AND data_type = 'date'
    ) THEN
        ALTER TABLE public.study_tasks ALTER COLUMN rescheduled_to TYPE TEXT USING rescheduled_to::text;
    END IF;
END $$;

ALTER TABLE public.study_tasks
    ADD COLUMN IF NOT EXISTS interrupt_reason TEXT,
    ADD COLUMN IF NOT EXISTS is_block BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS dsa_problem_id TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Add updated_at TIMESTAMPTZ to all tables missing it
ALTER TABLE public.study_sessions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.workout_sessions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.workout_exercises
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.workout_sets
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.personal_records
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.internships
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.ai_settings
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Create Indexes on updated_at for efficient delta synchronization
CREATE INDEX IF NOT EXISTS idx_study_tasks_updated_at ON public.study_tasks(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_updated_at ON public.study_sessions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_updated_at ON public.dsa_progress(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_dev_progress_updated_at ON public.development_progress(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_mistakes_updated_at ON public.mistakes(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_updated_at ON public.workout_sessions(user_id, updated_at);

-- 5. Attach automatic updated_at triggers to all user-owned tables
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_study_tasks_updated_at ON public.study_tasks;
CREATE TRIGGER trg_study_tasks_updated_at
    BEFORE UPDATE ON public.study_tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_study_sessions_updated_at ON public.study_sessions;
CREATE TRIGGER trg_study_sessions_updated_at
    BEFORE UPDATE ON public.study_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dsa_progress_updated_at ON public.dsa_progress;
CREATE TRIGGER trg_dsa_progress_updated_at
    BEFORE UPDATE ON public.dsa_progress
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_development_progress_updated_at ON public.development_progress;
CREATE TRIGGER trg_development_progress_updated_at
    BEFORE UPDATE ON public.development_progress
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_mistakes_updated_at ON public.mistakes;
CREATE TRIGGER trg_mistakes_updated_at
    BEFORE UPDATE ON public.mistakes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workout_plans_updated_at ON public.workout_plans;
CREATE TRIGGER trg_workout_plans_updated_at
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER trg_workout_sessions_updated_at
    BEFORE UPDATE ON public.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workout_exercises_updated_at ON public.workout_exercises;
CREATE TRIGGER trg_workout_exercises_updated_at
    BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workout_sets_updated_at ON public.workout_sets;
CREATE TRIGGER trg_workout_sets_updated_at
    BEFORE UPDATE ON public.workout_sets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_personal_records_updated_at ON public.personal_records;
CREATE TRIGGER trg_personal_records_updated_at
    BEFORE UPDATE ON public.personal_records
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER trg_ai_settings_updated_at
    BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_placement_hub_updated_at ON public.placement_hub_data;
DROP TRIGGER IF EXISTS trg_placement_hub_data_updated_at ON public.placement_hub_data;
CREATE TRIGGER trg_placement_hub_data_updated_at
    BEFORE UPDATE ON public.placement_hub_data
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_internships_updated_at ON public.internships;
CREATE TRIGGER trg_internships_updated_at
    BEFORE UPDATE ON public.internships
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
