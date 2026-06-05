-- Profiles (per user)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Child profiles
CREATE TABLE public.child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  pronouns TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_child_profiles_user ON public.child_profiles(user_id);

CREATE POLICY "Parents view own children" ON public.child_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents insert own children" ON public.child_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents update own children" ON public.child_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents delete own children" ON public.child_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Memories
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story TEXT,
  happened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL DEFAULT 'Everyday',
  who_was_there TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  photo_url TEXT,
  reaction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_memories_user ON public.memories(user_id);
CREATE INDEX idx_memories_child ON public.memories(child_id);
CREATE INDEX idx_memories_happened_at ON public.memories(happened_at DESC);

CREATE POLICY "Parents view own memories" ON public.memories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents insert own memories" ON public.memories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parents update own memories" ON public.memories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Parents delete own memories" ON public.memories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_child_profiles_updated BEFORE UPDATE ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_memories_updated BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for memory photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-photos', 'memory-photos', true);

CREATE POLICY "Memory photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memory-photos');

CREATE POLICY "Users upload own memory photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memory-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own memory photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'memory-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own memory photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'memory-photos' AND auth.uid()::text = (storage.foldername(name))[1]);