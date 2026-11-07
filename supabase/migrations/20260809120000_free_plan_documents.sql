-- Free plan can use every document folder the Family plan has (except Premium-only achievement certificates),
-- with smaller limits: birth certificate x1, vaccination x1, marksheet x5, school certificate x2.
UPDATE public.plan_features f
SET value_text = '{"birth_certificate":1,"vaccination":1,"marksheet":5,"school":2,"achievement":0}'
FROM public.plans p
WHERE f.plan_id = p.id AND f.key = 'document_limits' AND p.slug = 'free';
