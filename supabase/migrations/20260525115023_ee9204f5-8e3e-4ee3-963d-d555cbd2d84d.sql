
INSERT INTO public.plan_features (plan_id, key, value_int)
SELECT p.id, 'max_storage_mb',
  CASE p.slug
    WHEN 'free' THEN 100
    WHEN 'family' THEN 2048
    ELSE NULL
  END
FROM public.plans p
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_features pf
  WHERE pf.plan_id = p.id AND pf.key = 'max_storage_mb'
);
