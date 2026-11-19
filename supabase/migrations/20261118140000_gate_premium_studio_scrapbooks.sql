-- Reserve 25 of the 50 studio designs for Family and Premium plans.
UPDATE public.book_templates
SET is_premium = true
WHERE slug IN (
  'studio-family-archive',
  'studio-the-long-view',
  'studio-day-by-day',
  'studio-our-growing-season',
  'studio-little-legends',
  'studio-golden-years',
  'studio-our-story-so-far',
  'studio-lemonade-birthday',
  'studio-make-a-wish',
  'studio-birthday-dispatch',
  'studio-the-party-wall',
  'studio-slice-of-joy',
  'studio-another-trip-around-the-sun',
  'studio-meet-me-at-the-coast',
  'studio-autumn-trail',
  'studio-snow-day-dispatch',
  'studio-holiday-film-strip',
  'studio-beach-club',
  'studio-summer-by-the-lake',
  'studio-slow-sunday',
  'studio-market-morning',
  'studio-the-daily-cut',
  'studio-weekend-in-frames',
  'studio-the-good-stuff',
  'studio-neighborhood-walks'
);

CREATE OR REPLACE FUNCTION public.enforce_premium_template()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.template_id IS NOT DISTINCT FROM NEW.template_id
      AND OLD.parent_id IS NOT DISTINCT FROM NEW.parent_id THEN
      RETURN NEW;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.book_templates
    WHERE id = NEW.template_id AND is_premium
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.user_subscriptions AS subscription
    JOIN public.plans AS plan ON plan.id = subscription.plan_id
    WHERE subscription.user_id = NEW.parent_id
      AND plan.slug IN ('family', 'premium')
  ) THEN
    RAISE EXCEPTION 'plan_feature_locked: premium_template' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_premium_template ON public.user_books;
CREATE TRIGGER enforce_premium_template
BEFORE INSERT OR UPDATE OF template_id, parent_id ON public.user_books
FOR EACH ROW EXECUTE FUNCTION public.enforce_premium_template();
