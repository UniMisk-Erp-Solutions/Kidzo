import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Remembers that this user has seen the welcome tour: in this browser (localStorage, keyed by `storageKey`)
 * and on the account (best effort).
 */
export const useMarkFeatureTourSeen = (storageKey: string) =>
  useCallback(
    (userId: string) => {
      localStorage.setItem(`${storageKey}:${userId}`, "1");
      supabase.auth.updateUser({ data: { feature_tour_seen: true } }).catch(() => {});
    },
    [storageKey],
  );
