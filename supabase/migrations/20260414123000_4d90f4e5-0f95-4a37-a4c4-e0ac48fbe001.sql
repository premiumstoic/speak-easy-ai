-- Allow anonymous observer reads for demo sessions only
GRANT SELECT ON TABLE public.therapy_logs TO anon;

DROP POLICY IF EXISTS "Anon can read demo therapy logs" ON public.therapy_logs;

CREATE POLICY "Anon can read demo therapy logs"
ON public.therapy_logs
FOR SELECT
TO anon
USING (session_id LIKE 'demo_%');

-- Improve observer performance for session-scoped playback and realtime backfill
CREATE INDEX IF NOT EXISTS idx_therapy_logs_session_created_at
ON public.therapy_logs (session_id, created_at);
