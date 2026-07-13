import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveChild } from "./useActiveChild";

/**
 * Mirrors the DB rule `has_child_edit_access()`:
 *   owner  OR  accepted share with role = 'editor'  -> can edit
 *   accepted share with role = 'viewer'             -> read-only (explore only)
 *
 * The database already blocks viewer writes via RLS; this hook exists so the UI
 * hides the edit controls instead of letting a viewer click and hit an error.
 */
export const useCanEditChild = (childIdArg?: string) => {
  const { user } = useAuth();
  const { data: activeChild } = useActiveChild();
  const childId = childIdArg ?? activeChild?.id;

  const isOwner =
    !!user && !!activeChild && activeChild.id === childId && activeChild.user_id === user.id;

  const { data: myShare, isLoading } = useQuery({
    queryKey: ["my-child-role", user?.id, childId],
    enabled: !!user && !!childId && !isOwner,
    queryFn: async () => {
      const { data } = await supabase
        .from("child_shares")
        .select("role")
        .eq("child_id", childId!)
        .eq("shared_with_user_id", user!.id)
        .eq("status", "accepted")
        .maybeSingle();
      return (data ?? null) as { role: "viewer" | "editor" } | null;
    },
  });

  const canEdit = isOwner || myShare?.role === "editor";
  const isViewer = !isOwner && myShare?.role === "viewer";

  return { canEdit, isViewer, isOwner, loading: !isOwner && isLoading };
};
