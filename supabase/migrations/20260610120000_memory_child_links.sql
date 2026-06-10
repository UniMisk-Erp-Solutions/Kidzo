-- ===========================================================================
-- Memory <-> sibling links
-- Lets ONE memory appear on multiple children's timelines. e.g. child A's
-- "First birthday" can also show on sibling B's timeline with a relation note
-- ("Brother's 1st birthday"). Purely ADDITIVE: memories.child_id stays the
-- primary/subject child, so existing features and the Flutter app are unaffected.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.memory_child_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id     uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  relation_label text,
  created_by    uuid NOT NULL DEFAULT auth.uid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (memory_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_links_child  ON public.memory_child_links(child_id);
CREATE INDEX IF NOT EXISTS idx_memory_links_memory ON public.memory_child_links(memory_id);

ALTER TABLE public.memory_child_links ENABLE ROW LEVEL SECURITY;

-- View a link if you can access the linked child OR the memory's primary child.
DROP POLICY IF EXISTS "view memory links" ON public.memory_child_links;
CREATE POLICY "view memory links" ON public.memory_child_links
  FOR SELECT TO authenticated
  USING (
    public.has_child_access(child_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_id AND public.has_child_access(m.child_id, auth.uid())
    )
  );

-- Create a link only if you can EDIT the linked child AND EDIT the memory's primary child.
DROP POLICY IF EXISTS "insert memory links" ON public.memory_child_links;
CREATE POLICY "insert memory links" ON public.memory_child_links
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.has_child_edit_access(child_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_id AND public.has_child_edit_access(m.child_id, auth.uid())
    )
  );

-- Update the relation note if you can edit either side.
DROP POLICY IF EXISTS "update memory links" ON public.memory_child_links;
CREATE POLICY "update memory links" ON public.memory_child_links
  FOR UPDATE TO authenticated
  USING (
    public.has_child_edit_access(child_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_id AND public.has_child_edit_access(m.child_id, auth.uid())
    )
  );

-- Remove a link if you can edit either side.
DROP POLICY IF EXISTS "delete memory links" ON public.memory_child_links;
CREATE POLICY "delete memory links" ON public.memory_child_links
  FOR DELETE TO authenticated
  USING (
    public.has_child_edit_access(child_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_id AND public.has_child_edit_access(m.child_id, auth.uid())
    )
  );

-- When a memory is linked to a sibling, notify that sibling's owner + accepted
-- shares (mirrors the existing notify_memory_added fan-out).
CREATE OR REPLACE FUNCTION public.notify_memory_linked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, child_id, actor_id, kind, payload)
  SELECT cp.user_id, NEW.child_id, NEW.created_by, 'memory_added',
         jsonb_build_object('memory_id', NEW.memory_id, 'linked', true, 'relation', NEW.relation_label)
  FROM public.child_profiles cp
  WHERE cp.id = NEW.child_id AND cp.user_id <> NEW.created_by;

  INSERT INTO public.notifications (user_id, child_id, actor_id, kind, payload)
  SELECT cs.shared_with_user_id, NEW.child_id, NEW.created_by, 'memory_added',
         jsonb_build_object('memory_id', NEW.memory_id, 'linked', true, 'relation', NEW.relation_label)
  FROM public.child_shares cs
  WHERE cs.child_id = NEW.child_id
    AND cs.status = 'accepted'
    AND cs.shared_with_user_id IS NOT NULL
    AND cs.shared_with_user_id <> NEW.created_by;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_memory_linked ON public.memory_child_links;
CREATE TRIGGER trg_memory_linked
  AFTER INSERT ON public.memory_child_links
  FOR EACH ROW EXECUTE FUNCTION public.notify_memory_linked();
