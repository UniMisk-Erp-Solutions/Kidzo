-- "Memory Road" template: a winding-road scrapbook, four memories per page with map pins.
-- Free for everyone to create/preview (free plan sees 2 pages; the rest are locked). Idempotent.
INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order, cover_image_url)
SELECT
  'scrapbook-road-trail-memory-road',
  'Memory Road',
  'everyday',
  'A winding road through your favourite moments — four memories per page, each marked with a map pin, date and caption. Great for trips, school outings and milestones.',
  '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Road page","photos":4}]'::jsonb,
  '{"primary":"#F6F1E7","accent":"#E9B872","gold":"#D9A75B","coral":"#C8483E","mint":"#9CC0B0","ink":"#2F2F33","paper":"#FBF8F0"}'::jsonb,
  'All ages',
  24,
  false,
  (SELECT COALESCE(MIN(sort_order), 1) - 1 FROM public.book_templates),
  NULL
WHERE NOT EXISTS (SELECT 1 FROM public.book_templates WHERE slug = 'scrapbook-road-trail-memory-road');
