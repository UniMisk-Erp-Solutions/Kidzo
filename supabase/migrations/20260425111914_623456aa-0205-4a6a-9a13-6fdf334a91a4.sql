-- Add three new dense, multi-memory scrapbook templates.
-- These pack 3–4 memories on each spread for a fuller scrapbook feel.

INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order, cover_image_url)
VALUES
  (
    'scrapbook-mosaic',
    'Mosaic Scrapbook',
    'everyday',
    'A dense scrapbook where 3–4 memories share each spread — overlapping polaroids, washi tape strips and ticket stubs packed across every page.',
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Mosaic spread","photos":4}]'::jsonb,
    '{"primary":"#FBF6EC","accent":"#D9A679","gold":"#E8C56C","coral":"#E08C7A","mint":"#9DC1A8","ink":"#2F2A24","paper":"#F8F1E1"}'::jsonb,
    'All ages',
    20,
    false,
    6,
    NULL
  ),
  (
    'scrapbook-collage-zine',
    'Collage Zine',
    'everyday',
    'A bold zine-style scrapbook — each spread is a tightly packed collage of three memories with bubble headlines, stickers and handwritten notes.',
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Collage spread","photos":3}]'::jsonb,
    '{"primary":"#FFF4F1","accent":"#F4A6A0","gold":"#F2C572","coral":"#E2675F","mint":"#9CCFC4","ink":"#2A2730","paper":"#FFFAF6"}'::jsonb,
    'All ages',
    20,
    true,
    7,
    NULL
  ),
  (
    'scrapbook-pocket-album',
    'Pocket Album',
    'everyday',
    'Inspired by paper photo albums — four polaroid pockets per page with handwritten captions, ticket stubs and date stamps.',
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Pocket page","photos":4}]'::jsonb,
    '{"primary":"#F2F6F2","accent":"#A8C5BA","gold":"#E2C46B","coral":"#E59A93","mint":"#7FB69A","ink":"#28332E","paper":"#F8FBF6"}'::jsonb,
    'All ages',
    20,
    false,
    8,
    NULL
  );
