-- ==============================================================================
-- STUDYOS PRODUCTION DATABASE MIGRATION: PHASE 6
-- Migration: 20260929000000_phase6_realtime_publication.sql
-- Targets: Supabase Realtime Publication & REPLICA IDENTITY FULL for Cross-Platform Sync
-- ==============================================================================

-- 1. Configure REPLICA IDENTITY FULL on all realtime synchronized tables.
-- This ensures UPDATE and DELETE WAL records contain the entire row, including user_id
-- for RLS evaluation and client-side conflict resolution.

ALTER TABLE public.study_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.study_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.dsa_progress REPLICA IDENTITY FULL;
ALTER TABLE public.development_progress REPLICA IDENTITY FULL;
ALTER TABLE public.mistakes REPLICA IDENTITY FULL;
ALTER TABLE public.workout_plans REPLICA IDENTITY FULL;
ALTER TABLE public.workout_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.workout_sets REPLICA IDENTITY FULL;
ALTER TABLE public.personal_records REPLICA IDENTITY FULL;
ALTER TABLE public.internships REPLICA IDENTITY FULL;
ALTER TABLE public.placement_hub_data REPLICA IDENTITY FULL;

-- 2. Add domain tables to supabase_realtime publication.
-- Wrap in a DO block to ensure idempotent execution on existing publications.

DO $$
BEGIN
    -- Check if supabase_realtime publication exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add each table if not already a member of the publication
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'study_tasks') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.study_tasks;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'study_sessions') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'dsa_progress') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.dsa_progress;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'development_progress') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.development_progress;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mistakes') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.mistakes;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workout_plans') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_plans;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workout_sessions') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workout_sets') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sets;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'personal_records') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_records;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'internships') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.internships;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'placement_hub_data') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_hub_data;
        END IF;
    END IF;
END $$;
