-- ==============================================================================
-- FORGE GATE 2027 PRODUCTION DATABASE MIGRATION
-- Migration: 20261001000000_gate_planner_schema.sql
-- Targets: Supabase PostgreSQL with Strict Row Level Security (RLS)
-- ==============================================================================

-- ==============================================================================
-- 1. GATE PYQ ATTEMPTS TABLE (Persistent PYQ Performance Records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gate_pyq_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pyq_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    year INT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ATTEMPTED',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    time_taken_seconds INT NOT NULL DEFAULT 0 CHECK (time_taken_seconds >= 0),
    confidence TEXT DEFAULT 'MEDIUM',
    mistake_type TEXT,
    notes TEXT,
    revision_due_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gate_pyq_attempts_user_pyq_time UNIQUE(user_id, pyq_id, attempted_at)
);

CREATE INDEX IF NOT EXISTS idx_gate_pyq_attempts_user_topic ON public.gate_pyq_attempts(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_gate_pyq_attempts_user_subject ON public.gate_pyq_attempts(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_gate_pyq_attempts_user_correct ON public.gate_pyq_attempts(user_id, is_correct);

ALTER TABLE public.gate_pyq_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate_pyq_attempts_isolation" ON public.gate_pyq_attempts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 2. GATE TOPIC PROGRESS TABLE (Mastery & Aggregates per Topic)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gate_topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    total_attempted INT NOT NULL DEFAULT 0 CHECK (total_attempted >= 0),
    total_correct INT NOT NULL DEFAULT 0 CHECK (total_correct >= 0),
    total_wrong INT NOT NULL DEFAULT 0 CHECK (total_wrong >= 0),
    total_skipped INT NOT NULL DEFAULT 0 CHECK (total_skipped >= 0),
    accuracy_percent NUMERIC NOT NULL DEFAULT 0,
    mastery_percent NUMERIC NOT NULL DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    revision_due BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gate_topic_progress_user_topic UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_gate_topic_progress_user ON public.gate_topic_progress(user_id, subject_id);

ALTER TABLE public.gate_topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate_topic_progress_isolation" ON public.gate_topic_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
