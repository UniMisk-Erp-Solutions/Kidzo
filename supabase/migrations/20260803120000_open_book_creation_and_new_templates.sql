-- 1) Everyone (any plan) can browse templates and CREATE / PREVIEW a book.
--    What differs by plan is how much of the preview is visible (free = 2 pages) and who can
--    order — ordering is enforced server-side in the razorpay-create-book-order function.
DROP TRIGGER IF EXISTS enforce_photo_books ON public.user_books;

-- 2) Three new templates (free for everyone). Idempotent: skipped if the slug already exists.
INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order, cover_image_url)
SELECT v.slug, v.name, v.category, v.description, v.page_layouts::jsonb, v.color_scheme::jsonb,
       v.age, v.pages, false,
       (SELECT COALESCE(MAX(sort_order), 0) FROM public.book_templates) + v.ord, NULL
FROM (VALUES
  (
    'scrapbook-mosaic-little-explorer',
    'Little Explorer',
    'everyday',
    'An adventure-journal scrapbook — four memories per spread with trail-map tape, ticket stubs and earthy polaroids. Perfect for outings, trips and everything they discover.',
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Adventure spread","photos":4}]',
    '{"primary":"#F4EFE3","accent":"#8FA98B","gold":"#D9A75B","coral":"#C9704F","mint":"#A9C7B5","ink":"#2E3A2F","paper":"#FAF6EA"}',
    'All ages', 24, 1
  ),
  (
    'scrapbook-pocket-album-sweet-dreams',
    'Sweet Dreams Pocket Album',
    '0-12m',
    'A soft lavender-and-blush pocket album for baby''s first years — polaroids tucked into pockets with tiny handwritten notes and lullaby-soft colours.',
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Pocket spread","photos":4}]',
    '{"primary":"#F7F1F8","accent":"#C9B6E4","gold":"#EBCB8B","coral":"#F2A7B8","mint":"#B7DCCB","ink":"#3A3345","paper":"#FCF8FD"}',
    '0–2 years', 20, 2
  ),
  (
    'scrapbook-collage-zine-family-fun',
    'Family Fun Zine',
    'everyday',
    'A bold, cut-and-paste family zine — sunshine yellow and teal collage pages with magazine-style headlines for game nights, holidays and big family days.',
    '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Zine spread","photos":3}]',
    '{"primary":"#FFF8E1","accent":"#4FB0A8","gold":"#F5C443","coral":"#EF6F5E","mint":"#8BD3C7","ink":"#22313A","paper":"#FFFDF3"}',
    'All ages', 20, 3
  )
) AS v(slug, name, category, description, page_layouts, color_scheme, age, pages, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.book_templates t WHERE t.slug = v.slug);
