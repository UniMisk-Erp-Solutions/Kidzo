-- Short, anonymous share links for keepsake PDFs.
-- The public link carries only a random token (/k/<token>). The storage path (which starts with the
-- owner's user id) and the backend host stay out of anything a user copies or sends.
CREATE TABLE IF NOT EXISTS public.shared_keepsakes (
  token        text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id     uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz
);

ALTER TABLE public.shared_keepsakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can create their share links" ON public.shared_keepsakes;
CREATE POLICY "Owners can create their share links"
ON public.shared_keepsakes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can see their share links" ON public.shared_keepsakes;
CREATE POLICY "Owners can see their share links"
ON public.shared_keepsakes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can revoke their share links" ON public.shared_keepsakes;
CREATE POLICY "Owners can revoke their share links"
ON public.shared_keepsakes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their share links" ON public.shared_keepsakes;
CREATE POLICY "Owners can delete their share links"
ON public.shared_keepsakes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Public lookup: a valid, unrevoked token returns the storage path, anything else returns nothing.
-- The table itself is never readable by anonymous users.
CREATE OR REPLACE FUNCTION public.resolve_shared_keepsake(_token text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT storage_path
  FROM public.shared_keepsakes
  WHERE token = _token AND revoked_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_shared_keepsake(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_shared_keepsake(text) TO anon, authenticated;

-- Make PostgREST pick up the new table and function without a restart.
NOTIFY pgrst, 'reload schema';
