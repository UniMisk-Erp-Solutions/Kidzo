-- Documents vault, by plan. Idempotent.
--   Free    : 1 document, birth certificate only
--   Family  : up to 5 documents per child, from a safe list of types
--   Premium : unlimited documents, same safe list of types
-- Highly sensitive IDs (Aadhaar / PAN / passport / SSN / bank) are NOT an allowed type on any plan.

-- 1) Plan features -----------------------------------------------------------------------------
INSERT INTO public.plan_features (plan_id, key, value_int, value_bool)
SELECT p.id, 'max_documents',
       CASE p.slug WHEN 'free' THEN 1 WHEN 'family' THEN 5 ELSE NULL END,  -- NULL = unlimited
       NULL
FROM public.plans p
WHERE p.slug IN ('free', 'family', 'premium')
  AND NOT EXISTS (SELECT 1 FROM public.plan_features f WHERE f.plan_id = p.id AND f.key = 'max_documents');

INSERT INTO public.plan_features (plan_id, key, value_int, value_bool)
SELECT p.id, 'documents_all_types', NULL, (p.slug <> 'free')
FROM public.plans p
WHERE p.slug IN ('free', 'family', 'premium')
  AND NOT EXISTS (SELECT 1 FROM public.plan_features f WHERE f.plan_id = p.id AND f.key = 'documents_all_types');

UPDATE public.plan_features f SET value_int = 1
FROM public.plans p WHERE f.plan_id = p.id AND p.slug = 'free'    AND f.key = 'max_documents';
UPDATE public.plan_features f SET value_int = 5
FROM public.plans p WHERE f.plan_id = p.id AND p.slug = 'family'  AND f.key = 'max_documents';
UPDATE public.plan_features f SET value_int = NULL
FROM public.plans p WHERE f.plan_id = p.id AND p.slug = 'premium' AND f.key = 'max_documents';

-- AI suggestions is no longer a plan feature.
DELETE FROM public.plan_features WHERE key = 'ai_suggestions';

UPDATE public.plans SET description = 'Start your journey — 1 child, core memories, birth certificate vault.' WHERE slug = 'free';
UPDATE public.plans SET description = 'For growing families — up to 2 children, PDF export, sharing, 5 documents per child.' WHERE slug = 'family';
UPDATE public.plans SET description = 'For bigger families — up to 5 children, unlimited documents, priority support.' WHERE slug = 'premium';

-- 2) Private bucket: images + PDF only, 10 MB max, never public ---------------------------------
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
WHERE id = 'child-documents';

-- 3) Server-side enforcement (cannot be bypassed from the client) -------------------------------
CREATE OR REPLACE FUNCTION public.enforce_document_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max      integer;
  v_has_max  boolean;
  v_all      boolean;
  v_count    integer;
  v_plan     uuid;
BEGIN
  -- Only check when a document is created, or its type / child changes.
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

  SELECT pf.value_bool INTO v_all
  FROM public.plan_features pf WHERE pf.plan_id = v_plan AND pf.key = 'documents_all_types';
  IF v_all IS FALSE AND NEW.category <> 'birth_certificate' THEN
    RAISE EXCEPTION 'plan_feature_locked: documents_all_types' USING ERRCODE = 'check_violation';
  END IF;

  SELECT pf.value_int, true INTO v_max, v_has_max
  FROM public.plan_features pf WHERE pf.plan_id = v_plan AND pf.key = 'max_documents';
  IF v_has_max AND v_max IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.documents d
    WHERE d.child_id = NEW.child_id AND d.id IS DISTINCT FROM NEW.id;
    IF v_count >= v_max THEN
      RAISE EXCEPTION 'plan_feature_locked: max_documents' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_document_rules ON public.documents;
CREATE TRIGGER enforce_document_rules
  BEFORE INSERT OR UPDATE OF category, child_id ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_rules();
