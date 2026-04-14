
-- Upsert the therapy_audio bucket with size/mime constraints
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'therapy_audio',
  'therapy_audio',
  true,
  20971520,
  ARRAY['audio/webm','audio/wav','audio/mp4','audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Public read therapy audio" ON storage.objects;
CREATE POLICY "Public read therapy audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'therapy_audio');

DROP POLICY IF EXISTS "Auth insert therapy audio" ON storage.objects;
CREATE POLICY "Auth insert therapy audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'therapy_audio');

DROP POLICY IF EXISTS "Auth update therapy audio" ON storage.objects;
CREATE POLICY "Auth update therapy audio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'therapy_audio');

DROP POLICY IF EXISTS "Auth delete therapy audio" ON storage.objects;
CREATE POLICY "Auth delete therapy audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'therapy_audio');
