import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Remembers on the account that the welcome tour has been seen (best effort; the tour also uses localStorage). */
export const useMarkFeatureTourSeen = () =>
  useCallback(() => {
    supabase.auth.updateUser({ data: { feature_tour_seen: true } }).catch(() => {});
  }, []);
