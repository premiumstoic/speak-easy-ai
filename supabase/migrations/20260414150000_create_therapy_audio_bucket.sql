-- Storage bucket for raw push-to-talk turn audio used in multimodal tripwire analysis.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'therapy_audio',
  'therapy_audio',
  true,
  20971520,
  ARRAY['audio/webm', 'audio/wav', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read therapy audio" ON storage.objects;
CREATE POLICY "Public can read therapy audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'therapy_audio');

DROP POLICY IF EXISTS "Authenticated users can upload therapy audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload therapy audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'therapy_audio');

DROP POLICY IF EXISTS "Authenticated users can update therapy audio" ON storage.objects;
CREATE POLICY "Authenticated users can update therapy audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'therapy_audio')
WITH CHECK (bucket_id = 'therapy_audio');

DROP POLICY IF EXISTS "Authenticated users can delete therapy audio" ON storage.objects;
CREATE POLICY "Authenticated users can delete therapy audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'therapy_audio');
