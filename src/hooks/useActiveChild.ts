import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChildProfile = {
  id: string;
  user_id: string;
  name: string;
  dob: string;
  pronouns: string | null;
  avatar_url: string | null;
};

const ACTIVE_KEY = "childbook:activeChildId";

export const useActiveChild = () => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));

  // Keep state in sync with other tabs / the switcher
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_KEY) setActiveId(e.newValue);
    };
    const onCustom = () => setActiveId(localStorage.getItem(ACTIVE_KEY));
    window.addEventListener("storage", onStorage);
    window.addEventListener("childbook:active-child-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("childbook:active-child-changed", onCustom);
    };
  }, []);

  return useQuery({
    queryKey: ["active-child", user?.id, activeId],
    enabled: !!user,
    queryFn: async (): Promise<ChildProfile | null> => {
      const { data, error } = await supabase
        .from("child_profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const list = (data ?? []) as ChildProfile[];
      if (activeId) {
        const match = list.find((c) => c.id === activeId);
        if (match) return match;
      }
      const own = list.find((c) => c.user_id === user!.id);
      return own ?? list[0] ?? null;
    },
  });
};
