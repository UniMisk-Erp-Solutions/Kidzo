-- Notifications: alert family members when a memory is added
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,             -- recipient
  child_id uuid NOT NULL,
  actor_id uuid,                     -- who did the thing
  kind text NOT NULL,                -- 'memory_added' | 'achievement_added' | 'document_added'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to fan out notifications to everyone with access to a child (except actor)
CREATE OR REPLACE FUNCTION public.notify_memory_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the child profile owner (if not the actor)
  INSERT INTO public.notifications (user_id, child_id, actor_id, kind, payload)
  SELECT cp.user_id, NEW.child_id, NEW.user_id, 'memory_added',
         jsonb_build_object('memory_id', NEW.id, 'title', NEW.title, 'photo_url', NEW.photo_url)
  FROM public.child_profiles cp
  WHERE cp.id = NEW.child_id AND cp.user_id <> NEW.user_id;

  -- Notify accepted shared members (excluding actor)
  INSERT INTO public.notifications (user_id, child_id, actor_id, kind, payload)
  SELECT cs.shared_with_user_id, NEW.child_id, NEW.user_id, 'memory_added',
         jsonb_build_object('memory_id', NEW.id, 'title', NEW.title, 'photo_url', NEW.photo_url)
  FROM public.child_shares cs
  WHERE cs.child_id = NEW.child_id
    AND cs.status = 'accepted'
    AND cs.shared_with_user_id IS NOT NULL
    AND cs.shared_with_user_id <> NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memory_notify ON public.memories;
CREATE TRIGGER trg_memory_notify
AFTER INSERT ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.notify_memory_added();