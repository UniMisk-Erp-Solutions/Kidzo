
INSERT INTO storage.buckets (id, name, public) VALUES ('child-avatars', 'child-avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "child-avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'child-avatars');

CREATE POLICY "child-avatars owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'child-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "child-avatars owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'child-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "child-avatars owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'child-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
