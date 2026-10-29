-- Document folders, per-plan limits. Replaces the single "max_documents" cap. Idempotent.
--   Free    : birth certificate x1; every other folder locked
--   Family  : birth certificate x1, vaccination x3, marksheet folder x20, school-certificate folder x7;
--             achievement certificates locked (Premium only)
--   Premium : unlimited files in every folder
-- Stored as JSON in plan_features.value_text under key 'document_limits'
-- (admin-editable): { "<category>": <max files> }.  0 = locked, missing/null = unlimited.

INSERT INTO public.plan_features (plan_id, key, value_int, value_bool, value_text)
SELECT p.id, 'document_limits', NULL, NULL,
  CASE p.slug
    WHEN 'free'   THEN '{"birth_certificate":1,"vaccination":0,"marksheet":0,"school":0,"achievement":0}'
    WHEN 'family' THEN '{"birth_certificate":1,"vaccination":3,"marksheet":20,"school":7,"achievement":0}'
    ELSE '{}'
  END
FROM public.plans p
WHERE p.slug IN ('free', 'family', 'premium')
  AND NOT EXISTS (SELECT 1 FROM public.plan_features f WHERE f.plan_id = p.id AND f.key = 'document_limits');

UPDATE public.plan_features f
SET value_text = CASE p.slug
    WHEN 'free'   THEN '{"birth_certificate":1,"vaccination":0,"marksheet":0,"school":0,"achievement":0}'
    WHEN 'family' THEN '{"birth_certificate":1,"vaccination":3,"marksheet":20,"school":7,"achievement":0}'
    ELSE '{}' END
FROM public.plans p
WHERE f.plan_id = p.id AND f.key = 'document_limits' AND p.slug IN ('free', 'family', 'premium');

-- Superseded by document_limits.
DELETE FROM public.plan_features WHERE key IN ('max_documents', 'documents_all_types');

UPDATE public.plans SET description = 'For growing families — up to 2 children, PDF export, sharing, marksheet & school folders.' WHERE slug = 'family';
UPDATE public.plans SET description = 'For bigger families — up to 5 children, unlimited documents, achievement certificates, priority support.' WHERE slug = 'premium';

CREATE OR REPLACE FUNCTION public.enforce_document_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan   uuid;
  v_json   jsonb;
  v_limit  integer;
  v_count  integer;
BEGIN
  -- Only check when a document is created, or its folder / child changes.
  IF TG_OP = 'UPDATE'
     AND NEW.category IS NOT DISTINCT FROM OLD.category
     AND NEW.child_id IS NOT DISTINCT FROM OLD.child_id THEN
    RETURN NEW;
  END IF;

  IF NEW.category NOT IN ('birth_certificate', 'vaccination', 'marksheet', 'school', 'achievement') THEN
    RAISE EXCEPTION 'document_type_not_allowed: %', NEW.category USING ERRCODE = 'check_violation';
  END IF;

  SELECT us.plan_id INTO v_plan FROM public.user_subscriptions us WHERE us.user_id = NEW.user_id;
  IF v_plan IS NULL THEN RETURN NEW; END IF;  -- unknown plan: fail open, like the other plan triggers

  SELECT NULLIF(pf.value_text, '')::jsonb INTO v_json
  FROM public.plan_features pf WHERE pf.plan_id = v_plan AND pf.key = 'document_limits';
  IF v_json IS NULL OR (v_json -> NEW.category) IS NULL OR jsonb_typeof(v_json -> NEW.category) = 'null' THEN
    RETURN NEW;  -- no limit for this folder on this plan
  END IF;

  v_limit := (v_json ->> NEW.category)::integer;
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'plan_feature_locked: document_folder_locked' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.documents d
  WHERE d.child_id = NEW.child_id AND d.category = NEW.category AND d.id IS DISTINCT FROM NEW.id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_feature_locked: document_folder_full' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_document_rules ON public.documents;
CREATE TRIGGER enforce_document_rules
  BEFORE INSERT OR UPDATE OF category, child_id ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_rules();
