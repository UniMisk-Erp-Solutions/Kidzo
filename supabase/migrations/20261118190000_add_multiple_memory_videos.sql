ALTER TABLE public.memories
  ADD COLUMN video_items jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE FUNCTION public.enforce_memory_attachment_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  video_count integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.photo_url IS NOT DISTINCT FROM NEW.photo_url
      AND OLD.photo_urls IS NOT DISTINCT FROM NEW.photo_urls
      AND OLD.video_url IS NOT DISTINCT FROM NEW.video_url
      AND OLD.video_items IS NOT DISTINCT FROM NEW.video_items THEN
      RETURN NEW;
    END IF;
  END IF;

  IF jsonb_typeof(NEW.video_items) <> 'array' THEN
    RAISE EXCEPTION 'Video attachments must be an array.' USING ERRCODE = 'check_violation';
  END IF;

  video_count := jsonb_array_length(NEW.video_items);
  IF video_count = 0 AND NEW.video_url IS NOT NULL THEN
    video_count := 1;
  END IF;

  IF GREATEST(COALESCE(cardinality(NEW.photo_urls), 0), CASE WHEN NEW.photo_url IS NULL THEN 0 ELSE 1 END)
    + video_count > 10 THEN
    RAISE EXCEPTION 'A memory can have up to 10 photos and videos combined.' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_memory_attachment_limit
BEFORE INSERT OR UPDATE OF photo_url, photo_urls, video_url, video_items
ON public.memories FOR EACH ROW EXECUTE FUNCTION public.enforce_memory_attachment_limit();
