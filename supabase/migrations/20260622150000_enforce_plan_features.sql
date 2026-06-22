-- ============================================================================
-- Enforce tier features server-side (cannot be bypassed by the client).
-- Blocks a paid action only when the user's plan explicitly has the feature
-- OFF (value_bool = false). Unknown/null/unlimited => allowed (fail-open),
-- same philosophy as enforce_max_children. Idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_plan_feature()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_key  text := TG_ARGV[0];      -- plan_features.key to check
  v_col  text := TG_ARGV[1];      -- column on NEW holding the owning user id
  v_uid  uuid;
  v_bool boolean;
BEGIN
  v_uid := (to_jsonb(NEW) ->> v_col)::uuid;
  IF v_uid IS NULL THEN RETURN NEW; END IF;

  SELECT pf.value_bool INTO v_bool
  FROM public.user_subscriptions us
  JOIN public.plan_features pf ON pf.plan_id = us.plan_id AND pf.key = v_key
  WHERE us.user_id = v_uid;

  IF v_bool IS FALSE THEN
    RAISE EXCEPTION 'plan_feature_locked: %', v_key USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

-- share links (public child shares)
DROP TRIGGER IF EXISTS enforce_share_links ON public.child_shares;
CREATE TRIGGER enforce_share_links BEFORE INSERT ON public.child_shares
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_feature('share_links', 'owner_id');

-- family invites
DROP TRIGGER IF EXISTS enforce_family_invites ON public.child_invites;
CREATE TRIGGER enforce_family_invites BEFORE INSERT ON public.child_invites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_feature('family_invites', 'owner_id');

-- photo book orders (book creation; user_books owner column is parent_id)
DROP TRIGGER IF EXISTS enforce_photo_books ON public.user_books;
CREATE TRIGGER enforce_photo_books BEFORE INSERT ON public.user_books
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_feature('photo_book_orders', 'parent_id');
