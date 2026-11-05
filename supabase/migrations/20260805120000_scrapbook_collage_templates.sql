-- Aesthetic collage scrapbook templates (kraft paper + torn panels, film roll, newsprint).
-- 3 are PREMIUM (Family / Premium plans only), 2 are free for everyone. Idempotent.
INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order, cover_image_url)
SELECT
  v.slug, v.name, 'everyday', v.description,
  '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Collage page","photos":4},{"type":"grid","title":"Film / newsprint page","photos":4}]'::jsonb,
  v.colors::jsonb, 'All ages', 24, v.is_premium,
  (SELECT COALESCE(MIN(sort_order), 1) FROM public.book_templates) - v.ord,
  NULL
FROM (VALUES
  ('scrapbook-kraft-burgundy-diary', 'Burgundy Diary',
   'Kraft paper, torn burgundy panels, a vintage camera and ransom-note titles — four memories per page in a moody, aesthetic collage.',
   '{"primary":"#C8A57A","accent":"#E3C9A0","gold":"#E0B24A","coral":"#7A1F2B","mint":"#A9B79A","ink":"#3A1F1A","paper":"#CDAA7E"}',
   true, 5),
  ('scrapbook-filmroll-city-trip', 'Film Roll · City Trip',
   'A big hero photo with a 35mm film roll running across the page, newsprint backdrop and marker scribbles. Made for trips and days out.',
   '{"primary":"#E4DCCB","accent":"#8FB3C4","gold":"#F0C84A","coral":"#C8483E","mint":"#9CC0B0","ink":"#1F2430","paper":"#E4DCCB"}',
   true, 4),
  ('scrapbook-newsprint-wanderlust', 'Newsprint Wanderlust',
   'Taped, tilted photos over vintage newspaper with chunky cut-out headlines — a travel-journal collage for every adventure.',
   '{"primary":"#E8E1D1","accent":"#B7C7A3","gold":"#F3C94C","coral":"#D4553F","mint":"#9DB8A8","ink":"#26282E","paper":"#E8E1D1"}',
   true, 3),
  ('scrapbook-kraft-sunny-days', 'Sunny Days Scrapbook',
   'Warm kraft paper with sunny torn panels, taped polaroid-style photos and little stars. A cheerful everyday scrapbook.',
   '{"primary":"#E8CFA0","accent":"#F4C95D","gold":"#F2A93B","coral":"#D9644A","mint":"#9CC9B0","ink":"#3A2E22","paper":"#EBD3A6"}',
   false, 2),
  ('scrapbook-newsprint-pastel-pages', 'Pastel Pages',
   'Soft pastel newsprint with taped photos and cut-out lettering — a gentle, sweet collage for first moments and little milestones.',
   '{"primary":"#F0E6E1","accent":"#F4B6C2","gold":"#F7D488","coral":"#E58CA0","mint":"#B9DCCB","ink":"#4A3B45","paper":"#F0E6E1"}',
   false, 1)
) AS v(slug, name, description, colors, is_premium, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.book_templates t WHERE t.slug = v.slug);

-- Keep the premium flag correct if the rows already existed.
UPDATE public.book_templates SET is_premium = true
WHERE slug IN ('scrapbook-kraft-burgundy-diary', 'scrapbook-filmroll-city-trip', 'scrapbook-newsprint-wanderlust');
UPDATE public.book_templates SET is_premium = false
WHERE slug IN ('scrapbook-kraft-sunny-days', 'scrapbook-newsprint-pastel-pages');

-- Premium templates can only be used on plans that include photo books (Family / Premium).
-- Same fail-open philosophy as enforce_plan_feature(): blocked only when the plan explicitly has it OFF.
CREATE OR REPLACE FUNCTION public.enforce_premium_template()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_premium boolean;
  v_bool    boolean;
BEGIN
  SELECT is_premium INTO v_premium FROM public.book_templates WHERE id = NEW.template_id;
  IF v_premium IS NOT TRUE THEN RETURN NEW; END IF;

  SELECT pf.value_bool INTO v_bool
  FROM public.user_subscriptions us
  JOIN public.plan_features pf ON pf.plan_id = us.plan_id AND pf.key = 'photo_book_orders'
  WHERE us.user_id = NEW.parent_id;

  IF v_bool IS FALSE THEN
    RAISE EXCEPTION 'plan_feature_locked: premium_template' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_premium_template ON public.user_books;
CREATE TRIGGER enforce_premium_template BEFORE INSERT ON public.user_books
  FOR EACH ROW EXECUTE FUNCTION public.enforce_premium_template();
