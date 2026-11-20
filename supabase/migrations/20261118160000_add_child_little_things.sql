CREATE TABLE public.child_little_things (
  child_id uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  topic text NOT NULL CHECK (topic IN ('song', 'snack', 'interest', 'quote')),
  detail text NOT NULL CHECK (char_length(detail) <= 180),
  PRIMARY KEY (child_id, topic)
);

ALTER TABLE public.child_little_things ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.child_little_things TO authenticated;

CREATE POLICY "Family can read little things"
ON public.child_little_things FOR SELECT TO authenticated
USING (public.has_child_access(child_id, (SELECT auth.uid())));

CREATE POLICY "Child editors can add little things"
ON public.child_little_things FOR INSERT TO authenticated
WITH CHECK (public.has_child_edit_access(child_id, (SELECT auth.uid())));

CREATE POLICY "Child editors can update little things"
ON public.child_little_things FOR UPDATE TO authenticated
USING (public.has_child_edit_access(child_id, (SELECT auth.uid())))
WITH CHECK (public.has_child_edit_access(child_id, (SELECT auth.uid())));
