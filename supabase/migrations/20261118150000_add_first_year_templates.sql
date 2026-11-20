-- Add ten First Year scrapbook designs, five for Family and Premium plans.
INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order)
SELECT slug, name, '0-12m', description,
  '[{"type":"hero","title":"Cover","photos":3},{"type":"grid","title":"Milestones","photos":3}]'::jsonb,
  jsonb_build_object('primary', paper, 'accent', mat, 'gold', detail, 'coral', detail, 'ink', ink),
  '0–12 months', 24, is_premium,
  (SELECT COALESCE(MAX(sort_order), 0) FROM public.book_templates) + position
FROM (VALUES
  ('studio-baby-coming-home', 'Coming Home', 'A warm nursery palette with three matted photos for the first days at home.', '#F0E6D6', '#FFF9EB', '#CBAB8C', '#423329', false, 1),
  ('studio-baby-tiny-traces', 'Tiny Traces', 'A keepsake postcard layout for tiny hands, feet and first cuddles.', '#E6DFEF', '#FFF5E9', '#A58DBD', '#46344F', true, 2),
  ('studio-baby-milestone-album', 'Milestone Album', 'A clean gallery for monthly portraits and first-year milestones.', '#DEE9E2', '#FFFFF4', '#709785', '#29463B', false, 3),
  ('studio-baby-first-smiles', 'First Smiles', 'Peach paper hearts and tilted snapshots for the first smiles and giggles.', '#F4D9D1', '#FFF3E7', '#C07273', '#62383D', true, 4),
  ('studio-baby-little-dreamer', 'Little Dreamer', 'A midnight contact sheet for sleepy moments and early bedtime rituals.', '#29293C', '#393B54', '#E6C38A', '#FFF7E4', false, 5),
  ('studio-baby-nursery-quilt', 'Nursery Quilt', 'A gingham scrapbook with taped photographs for quiet nursery days.', '#D9E8ED', '#FFF7E5', '#7EADBC', '#274754', true, 6),
  ('studio-baby-first-bloom', 'First Bloom', 'Soft leaf shapes and arched photos for a year of growing together.', '#E4E9CA', '#FAF6DD', '#96A76B', '#3D5237', false, 7),
  ('studio-baby-on-the-move', 'On the Move', 'Bright cut-paper shapes for rolling over, crawling and first steps.', '#F3DAB1', '#FFF3D9', '#C47B54', '#563229', true, 8),
  ('studio-baby-from-one-to-twelve', 'From One to Twelve', 'A newspaper-style year in review with a portrait and two snapshot columns.', '#E9E1D7', '#FFF9EA', '#B69C83', '#45372D', false, 9),
  ('studio-baby-one-small-candle', 'One Small Candle', 'Confetti and layered party portraits to end the first year with a birthday.', '#E8D6EF', '#FFF4EC', '#AF6D98', '#573B61', true, 10)
) AS designs(slug, name, description, paper, mat, detail, ink, is_premium, position)
ON CONFLICT (slug) DO UPDATE SET is_premium = EXCLUDED.is_premium;
