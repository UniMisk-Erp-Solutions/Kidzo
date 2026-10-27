-- 1) Everyone (any plan) can browse templates and CREATE / PREVIEW a book.
--    What differs by plan is how much of the preview is visible (free = 2 pages) and who can
--    order — ordering is enforced server-side in the razorpay-create-book-order function.
DROP TRIGGER IF EXISTS enforce_photo_books ON public.user_books;

-- 2) A new ready-to-use template, free for everyone. Idempotent: skipped if the slug already exists.
INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order, cover_image_url)
SELECT
  'scrapbook-mosaic-little-explorer',
  'Little Explorer',
  'everyday',
  'An adventure-journal scrapbook — four memories per spread with trail-map tape, ticket stubs and earthy polaroids. Perfect for outings, trips and everything they discover.',
  '[{"type":"hero","title":"Cover","photos":1},{"type":"grid","title":"Adventure spread","photos":4}]'::jsonb,
  '{"primary":"#F4EFE3","accent":"#8FA98B","gold":"#D9A75B","coral":"#C9704F","mint":"#A9C7B5","ink":"#2E3A2F","paper":"#FAF6EA"}'::jsonb,
  'All ages',
  24,
  false,
  (SELECT COALESCE(MIN(sort_order), 1) - 1 FROM public.book_templates), -- first in the list
  NULL
WHERE NOT EXISTS (SELECT 1 FROM public.book_templates WHERE slug = 'scrapbook-mosaic-little-explorer');

-- If it was already inserted earlier, move it to the front of the list.
UPDATE public.book_templates
SET sort_order = (SELECT MIN(sort_order) - 1 FROM public.book_templates WHERE slug <> 'scrapbook-mosaic-little-explorer')
WHERE slug = 'scrapbook-mosaic-little-explorer';
