-- Achievements (Grow module)
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'academics', -- academics | sports | cultural | certifications
  subject text NOT NULL,
  achievement_date date NOT NULL DEFAULT CURRENT_DATE,
  grade text,
  notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own achievements" ON public.achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents insert own achievements" ON public.achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents update own achievements" ON public.achievements
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents delete own achievements" ON public.achievements
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_achievements_child ON public.achievements(child_id, achievement_date DESC);

-- Documents (Records vault)
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_id uuid NOT NULL,
  category text NOT NULL, -- birth_certificate | vaccination | ssn_id | school | medical | passport | other
  title text NOT NULL,
  file_path text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own documents" ON public.documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents insert own documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents update own documents" ON public.documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents delete own documents" ON public.documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_documents_child ON public.documents(child_id, category);

-- Guidance checklist progress
CREATE TABLE public.guidance_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_id uuid NOT NULL,
  guide_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, guide_key)
);

ALTER TABLE public.guidance_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own guidance" ON public.guidance_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents insert own guidance" ON public.guidance_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents delete own guidance" ON public.guidance_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('child-documents', 'child-documents', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('achievement-photos', 'achievement-photos', true)
  ON CONFLICT (id) DO NOTHING;

-- Private documents bucket: per-user folder access
CREATE POLICY "Parents read own documents file" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'child-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Parents upload own documents file" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'child-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Parents update own documents file" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'child-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Parents delete own documents file" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'child-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public achievement photos bucket
CREATE POLICY "Anyone read achievement photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'achievement-photos');
CREATE POLICY "Parents upload own achievement photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'achievement-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Parents update own achievement photo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'achievement-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Parents delete own achievement photo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'achievement-photos' AND auth.uid()::text = (storage.foldername(name))[1]);