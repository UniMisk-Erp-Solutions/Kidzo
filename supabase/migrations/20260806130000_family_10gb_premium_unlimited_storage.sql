-- Storage tiers: Free = 100 MB (unchanged), Family = 10 GB, Premium = unlimited (NULL). Idempotent.

UPDATE public.plan_features pf
SET value_int = 10240
FROM public.plans p
WHERE pf.plan_id = p.id AND p.slug = 'family' AND pf.key = 'max_storage_mb';

UPDATE public.plan_features pf
SET value_int = NULL
FROM public.plans p
WHERE pf.plan_id = p.id AND p.slug = 'premium' AND pf.key = 'max_storage_mb';
