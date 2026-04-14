
-- Create therapy_logs table for Observer Dashboard realtime feed
CREATE TABLE public.therapy_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  speaker TEXT NOT NULL,
  raw_transcript TEXT NOT NULL,
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.therapy_logs ENABLE ROW LEVEL SECURITY;

-- Couple members can insert logs for their sessions
CREATE POLICY "Authenticated users can insert logs"
ON public.therapy_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Couple members can read logs
CREATE POLICY "Authenticated users can read logs"
ON public.therapy_logs
FOR SELECT
TO authenticated
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.therapy_logs;
