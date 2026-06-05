-- Public bucket to host generated keepsake PDFs for shareable links
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-keepsakes', 'shared-keepsakes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read shared keepsakes"
ON storage.objects FOR SELECT
USING (bucket_id = 'shared-keepsakes');

CREATE POLICY "Users can upload own shared keepsakes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shared-keepsakes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own shared keepsakes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shared-keepsakes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own shared keepsakes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared-keepsakes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);