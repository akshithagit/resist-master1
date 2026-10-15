-- ====================================================================
-- ResistAI Database Schema for Supabase PostgreSQL
-- PRD Section 41 (Database Schema) & Privacy Architecture
-- ====================================================================

-- 1. Analyses Table
CREATE TABLE IF NOT EXISTS public.analyses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CALCULATED',
    is_demo BOOLEAN DEFAULT FALSE,
    culture_findings JSONB DEFAULT '{}'::jsonb,
    patient_input JSONB DEFAULT '{}'::jsonb,
    susceptibility_results JSONB DEFAULT '[]'::jsonb,
    extracted_entities JSONB DEFAULT '[]'::jsonb,
    risk_result JSONB DEFAULT '{}'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on created_at for fast chronological queries
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- 2. Audit Events Table (Privacy-Safe: Excludes PHI & Document Text)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    analysis_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON public.audit_events(timestamp DESC);

-- 3. Feature Weights Configuration Table
CREATE TABLE IF NOT EXISTS public.feature_weights (
    id TEXT PRIMARY KEY DEFAULT 'default',
    model_version TEXT NOT NULL DEFAULT 'risk-model-0.1.0',
    weights JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_weights ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated access for app operations
CREATE POLICY "Allow public read analyses" ON public.analyses FOR SELECT USING (true);
CREATE POLICY "Allow public insert analyses" ON public.analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update analyses" ON public.analyses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete analyses" ON public.analyses FOR DELETE USING (true);

CREATE POLICY "Allow public insert audit" ON public.audit_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read audit" ON public.audit_events FOR SELECT USING (true);

CREATE POLICY "Allow public read weights" ON public.feature_weights FOR SELECT USING (true);
CREATE POLICY "Allow public upsert weights" ON public.feature_weights FOR ALL USING (true);
