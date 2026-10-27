-- Revise plan tiers: Free = 1 child, Family = 2 children, Premium = 5 children.
-- No plan is unlimited: Premium storage gets a fixed cap. Idempotent.

UPDATE public.plan_features pf
SET value_int = CASE p.slug WHEN 'free' THEN 1 WHEN 'family' THEN 2 WHEN 'premium' THEN 5 END
FROM public.plans p
WHERE pf.plan_id = p.id AND p.slug IN ('free', 'family', 'premium') AND pf.key = 'max_children';

-- Premium storage: 10 GB (was NULL = unlimited)
UPDATE public.plan_features pf
SET value_int = 10240
FROM public.plans p
WHERE pf.plan_id = p.id AND p.slug = 'premium' AND pf.key = 'max_storage_mb';

UPDATE public.plans
SET description = 'Start your journey — 1 child, core memories.'
WHERE slug = 'free';

UPDATE public.plans
SET description = 'For growing families — up to 2 children, PDF export, sharing.'
WHERE slug = 'family';

UPDATE public.plans
SET description = 'For bigger families — up to 5 children, AI suggestions, priority support.'
WHERE slug = 'premium';
