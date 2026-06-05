
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

CREATE POLICY "Super admin views all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin updates any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
