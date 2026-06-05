-- =========================
-- Sharing tables
-- =========================
CREATE TABLE IF NOT EXISTS public.child_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  shared_with_user_id uuid,
  invite_email text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor')),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted','revoked')),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_child_shares_child ON public.child_shares(child_id);
CREATE INDEX IF NOT EXISTS idx_child_shares_user ON public.child_shares(shared_with_user_id);

CREATE TABLE IF NOT EXISTS public.child_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor')),
  email text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_by uuid,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_invites_child ON public.child_invites(child_id);
CREATE INDEX IF NOT EXISTS idx_child_invites_token ON public.child_invites(token);

ALTER TABLE public.child_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_invites ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER child_shares_set_updated_at
BEFORE UPDATE ON public.child_shares
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- =========================
CREATE OR REPLACE FUNCTION public.has_child_access(_child_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.child_profiles cp
    WHERE cp.id = _child_id AND cp.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.child_shares cs
    WHERE cs.child_id = _child_id
      AND cs.shared_with_user_id = _user_id
      AND cs.status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_child_edit_access(_child_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.child_profiles cp
    WHERE cp.id = _child_id AND cp.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.child_shares cs
    WHERE cs.child_id = _child_id
      AND cs.shared_with_user_id = _user_id
      AND cs.status = 'accepted'
      AND cs.role = 'editor'
  );
$$;

-- =========================
-- child_shares RLS
-- =========================
CREATE POLICY "Owner manages shares select"
ON public.child_shares FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Owner manages shares insert"
ON public.child_shares FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner manages shares update"
ON public.child_shares FOR UPDATE TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owner manages shares delete"
ON public.child_shares FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- =========================
-- child_invites RLS
-- =========================
CREATE POLICY "Owner views invites"
ON public.child_invites FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = accepted_by);

CREATE POLICY "Owner creates invites"
ON public.child_invites FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner updates invites"
ON public.child_invites FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = accepted_by);

CREATE POLICY "Owner deletes invites"
ON public.child_invites FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Allow any authenticated user to look up an invite by its token (token = bearer)
-- We expose this via a SECURITY DEFINER function instead of broad RLS:
CREATE OR REPLACE FUNCTION public.lookup_invite(_token text)
RETURNS TABLE (
  id uuid,
  child_id uuid,
  child_name text,
  owner_id uuid,
  role text,
  email text,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.child_id, cp.name, i.owner_id, i.role, i.email,
         i.expires_at, i.accepted_at, i.revoked_at
  FROM public.child_invites i
  JOIN public.child_profiles cp ON cp.id = i.child_id
  WHERE i.token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accept_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.child_invites%ROWTYPE;
  v_share_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  SELECT * INTO v_invite FROM public.child_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite not found'; END IF;
  IF v_invite.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invite revoked'; END IF;
  IF v_invite.expires_at < now() THEN RAISE EXCEPTION 'invite expired'; END IF;
  IF v_invite.owner_id = auth.uid() THEN RAISE EXCEPTION 'cannot accept your own invite'; END IF;

  INSERT INTO public.child_shares (child_id, owner_id, shared_with_user_id, role, status, accepted_at)
  VALUES (v_invite.child_id, v_invite.owner_id, auth.uid(), v_invite.role, 'accepted', now())
  ON CONFLICT (child_id, shared_with_user_id)
  DO UPDATE SET role = EXCLUDED.role, status = 'accepted', accepted_at = now()
  RETURNING id INTO v_share_id;

  UPDATE public.child_invites
  SET accepted_by = auth.uid(), accepted_at = now()
  WHERE id = v_invite.id;

  RETURN v_share_id;
END;
$$;

-- =========================
-- Update existing tables' RLS to honour shares
-- =========================

-- child_profiles: viewable by owner OR any accepted share
DROP POLICY IF EXISTS "Parents view own children" ON public.child_profiles;
CREATE POLICY "View accessible children"
ON public.child_profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.child_shares cs
    WHERE cs.child_id = child_profiles.id
      AND cs.shared_with_user_id = auth.uid()
      AND cs.status = 'accepted'
  )
);

-- memories
DROP POLICY IF EXISTS "Parents view own memories" ON public.memories;
DROP POLICY IF EXISTS "Parents insert own memories" ON public.memories;
DROP POLICY IF EXISTS "Parents update own memories" ON public.memories;
DROP POLICY IF EXISTS "Parents delete own memories" ON public.memories;

CREATE POLICY "View accessible memories"
ON public.memories FOR SELECT TO authenticated
USING (public.has_child_access(child_id, auth.uid()));

CREATE POLICY "Insert memories with edit access"
ON public.memories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Update memories with edit access"
ON public.memories FOR UPDATE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Delete memories with edit access"
ON public.memories FOR DELETE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));

-- achievements
DROP POLICY IF EXISTS "Parents view own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Parents insert own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Parents update own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Parents delete own achievements" ON public.achievements;

CREATE POLICY "View accessible achievements"
ON public.achievements FOR SELECT TO authenticated
USING (public.has_child_access(child_id, auth.uid()));

CREATE POLICY "Insert achievements with edit access"
ON public.achievements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Update achievements with edit access"
ON public.achievements FOR UPDATE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Delete achievements with edit access"
ON public.achievements FOR DELETE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));

-- documents
DROP POLICY IF EXISTS "Parents view own documents" ON public.documents;
DROP POLICY IF EXISTS "Parents insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Parents update own documents" ON public.documents;
DROP POLICY IF EXISTS "Parents delete own documents" ON public.documents;

CREATE POLICY "View accessible documents"
ON public.documents FOR SELECT TO authenticated
USING (public.has_child_access(child_id, auth.uid()));

CREATE POLICY "Insert documents with edit access"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Update documents with edit access"
ON public.documents FOR UPDATE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Delete documents with edit access"
ON public.documents FOR DELETE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));

-- guidance_progress
DROP POLICY IF EXISTS "Parents view own guidance" ON public.guidance_progress;
DROP POLICY IF EXISTS "Parents insert own guidance" ON public.guidance_progress;
DROP POLICY IF EXISTS "Parents delete own guidance" ON public.guidance_progress;

CREATE POLICY "View accessible guidance"
ON public.guidance_progress FOR SELECT TO authenticated
USING (public.has_child_access(child_id, auth.uid()));

CREATE POLICY "Insert guidance with edit access"
ON public.guidance_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Delete guidance with edit access"
ON public.guidance_progress FOR DELETE TO authenticated
USING (public.has_child_edit_access(child_id, auth.uid()));
