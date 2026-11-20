-- Add the ten editable scrapbook designs to the existing catalog.
INSERT INTO public.book_templates
  (slug, name, category, description, page_layouts, color_scheme, suggested_age_range, pages_needed, is_premium, sort_order)
SELECT slug, name, 'everyday', description,
  '[{"type":"hero","title":"Cover","photos":3},{"type":"grid","title":"Scrapbook page","photos":3}]'::jsonb,
  jsonb_build_object('primary', paper, 'accent', mat, 'gold', detail, 'coral', detail, 'ink', ink),
  'All ages', 24, false,
  (SELECT COALESCE(MAX(sort_order), 0) FROM public.book_templates) + position
FROM (VALUES
  ('yearbook-wall', 'Yearbook Wall', 'Bold cutout lettering and a bulletin board of class photos.', '#173A43', '#F6E7C8', '#FFC24F', '#F47D91', 1),
  ('strawberry-diary', 'Strawberry Diary', 'Pink gingham, cream Polaroids and handwritten captions.', '#F9D5D7', '#FFF6C9', '#F38991', '#802A36', 2),
  ('spiral-weekender', 'Spiral Weekender', 'A spiral notebook with ruled paper and snapshots on facing pages.', '#FAF4E7', '#F2CF9B', '#CA7D64', '#44302D', 3),
  ('postmark-passport', 'Postmark Passport', 'Perforated postcard frames and a diagonal air-mail border.', '#DCEBEF', '#FFF4D9', '#CC5553', '#223E60', 4),
  ('coastal-fold', 'Coastal Fold', 'A wide coastal panorama with two photos tucked into folded paper.', '#E5EEEC', '#FAF6E9', '#A8C3C8', '#174250', 5),
  ('midnight-contact', 'Midnight Contact Sheet', 'Cinema-black paper and a vertical strip of numbered film frames.', '#18191D', '#34343B', '#F6B25E', '#FFF4DD', 6),
  ('pressed-meadow', 'Pressed Meadow', 'Leaf-shaped cutouts and soft green stationery for outdoor memories.', '#E4E8CB', '#FBF4D3', '#B2BE81', '#2E4D32', 7),
  ('sunday-edition', 'Sunday Edition', 'A newspaper masthead and rule-divided editorial columns.', '#F3EBDC', '#FFF9ED', '#BBA98B', '#30271E', 8),
  ('favorite-things', 'Favorite Things', 'Color-blocked paper pockets for little collections and keepsakes.', '#F1CFAC', '#E3F1FC', '#F8DD88', '#473055', 9),
  ('cloud-diary', 'Cloud Diary', 'A soft lavender page with round photo windows and floating captions.', '#E5DFFA', '#F9F2FD', '#B8A7EA', '#4B3867', 10)
) AS designs(slug, name, description, paper, mat, detail, ink, position)
WHERE NOT EXISTS (SELECT 1 FROM public.book_templates existing WHERE existing.slug = designs.slug);
