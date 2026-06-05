-- 1) Insert new scrapbook templates first
INSERT INTO public.book_templates (slug, name, category, description, color_scheme, page_layouts, suggested_age_range, pages_needed, is_premium, sort_order)
VALUES
  (
    'scrapbook-timeline',
    'Timeline · Year in Review',
    'timeline',
    'A chronological scrapbook spread — every memory laid out as a journey with washi tape, polaroids and ticket-stub dates.',
    '{"primary":"#FFF8EC","accent":"#E8A087","gold":"#D4B896","coral":"#F4A6A0","mint":"#A8C5BA","ink":"#3E3E42","paper":"#FBF4E4"}'::jsonb,
    '[{"type":"hero","title":"Cover","photos":1},{"type":"timeline","title":"Spread","photos":3}]'::jsonb,
    'All ages',
    32,
    false,
    1
  ),
  (
    'scrapbook-first-year',
    'First Year · Baby Book',
    '0-12m',
    'Month-by-month milestones for baby''s first year — soft pastels, hand-drawn doodles and tiny footprint stamps.',
    '{"primary":"#FDF2F4","accent":"#F4C2C2","gold":"#F5D5AE","coral":"#F4A6A0","mint":"#C8E0D4","ink":"#4A3C3C","paper":"#FFF6F7"}'::jsonb,
    '[{"type":"hero","title":"Cover","photos":1},{"type":"month","title":"Month spread","photos":2}]'::jsonb,
    '0–12 months',
    28,
    false,
    2
  ),
  (
    'scrapbook-birthday',
    'Birthday Book · Year by Year',
    'birthday',
    'One spread per birthday year — confetti, party hats, ticket stubs and the year''s big firsts.',
    '{"primary":"#F0F7FF","accent":"#FFB84D","gold":"#FFD66B","coral":"#FF8A95","mint":"#85D8CE","ink":"#2A3D52","paper":"#FCFBFF"}'::jsonb,
    '[{"type":"hero","title":"Cover","photos":1},{"type":"birthday","title":"Year spread","photos":3}]'::jsonb,
    '1–18 years',
    36,
    true,
    3
  ),
  (
    'scrapbook-holiday',
    'Holiday Memories',
    'seasonal',
    'A festive scrapbook for holidays and seasons — cozy kraft paper, twinkly stickers and snapshot polaroids.',
    '{"primary":"#FFF5EB","accent":"#C77D5C","gold":"#E8B86D","coral":"#D9534F","mint":"#7FA88B","ink":"#3D2E22","paper":"#FAF0E1"}'::jsonb,
    '[{"type":"hero","title":"Cover","photos":1},{"type":"holiday","title":"Holiday spread","photos":3}]'::jsonb,
    'All ages',
    24,
    false,
    4
  ),
  (
    'scrapbook-everyday',
    'Everyday Adventures',
    'everyday',
    'The little daily moments — playful washi tape, doodles, sticky notes and handwritten captions.',
    '{"primary":"#F4F8F3","accent":"#A8C5BA","gold":"#E8C56C","coral":"#F4A6A0","mint":"#7FB69A","ink":"#2F3E36","paper":"#F8FBF6"}'::jsonb,
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Memory grid","photos":4}]'::jsonb,
    'All ages',
    24,
    false,
    5
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  color_scheme = EXCLUDED.color_scheme,
  page_layouts = EXCLUDED.page_layouts,
  suggested_age_range = EXCLUDED.suggested_age_range,
  pages_needed = EXCLUDED.pages_needed,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order;

-- 2) Repoint any user_books that reference soon-to-be-deleted templates to the new Timeline default
UPDATE public.user_books ub
SET template_id = (SELECT id FROM public.book_templates WHERE slug = 'scrapbook-timeline')
WHERE ub.template_id NOT IN (
  SELECT id FROM public.book_templates
  WHERE slug IN ('scrapbook-timeline','scrapbook-first-year','scrapbook-birthday','scrapbook-holiday','scrapbook-everyday')
);

-- 3) Now safely delete the old templates
DELETE FROM public.book_templates
WHERE slug NOT IN ('scrapbook-timeline','scrapbook-first-year','scrapbook-birthday','scrapbook-holiday','scrapbook-everyday');