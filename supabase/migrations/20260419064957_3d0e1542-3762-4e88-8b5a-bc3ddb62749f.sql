-- Fix function search_path warning
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Remove listing policy; public bucket still serves files by URL
DROP POLICY IF EXISTS "Memory photos are publicly readable" ON storage.objects;