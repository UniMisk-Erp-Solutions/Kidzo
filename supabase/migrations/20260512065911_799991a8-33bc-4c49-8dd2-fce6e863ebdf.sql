ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: existing photo_url becomes the first entry in photo_urls
UPDATE public.memories
SET photo_urls = ARRAY[photo_url]
WHERE photo_url IS NOT NULL
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL);