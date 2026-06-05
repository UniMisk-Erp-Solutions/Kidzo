import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ChildProfile } from "./useActiveChild";

const ACTIVE_KEY = "childbook:activeChildId";

export const useChildren = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["children", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ChildProfile[]> => {
      const { data, error } = await supabase
        .from("child_profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChildProfile[];
    },
  });
};

export const useActiveChildId = () => {
  const { user } = useAuth();
  const { data: children = [] } = useChildren();
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));

  // Re-read from localStorage when something else changes the active child
  useEffect(() => {
    const onCustom = () => setActiveId(localStorage.getItem(ACTIVE_KEY));
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_KEY) setActiveId(e.newValue);
    };
    window.addEventListener("childbook:active-child-changed", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("childbook:active-child-changed", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!children.length) return;
    if (activeId && children.some((c) => c.id === activeId)) return;
    const own = children.find((c) => c.user_id === user?.id);
    const next = (own ?? children[0]).id;
    setActiveId(next);
    localStorage.setItem(ACTIVE_KEY, next);
    window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
  }, [children, user, activeId]);

  const setActive = (id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
  };

  return { activeId, setActive, children };
};

export const useUpdateChild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; name?: string; dob?: string; pronouns?: string | null; avatar_url?: string | null }) => {
      const { id, ...patch } = payload;
      const { error } = await supabase.from("child_profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["active-child"] });
    },
  });
};

/**
 * Lets a shared user remove their own access to a child shared with them.
 * Owners should use revoke flows instead — this only deletes share rows
 * where shared_with_user_id = auth.uid().
 */
export const useLeaveSharedChild = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (childId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("child_shares")
        .delete()
        .eq("child_id", childId)
        .eq("shared_with_user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["active-child"] });
    },
  });
};
