import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AchievementType = "academics" | "sports" | "cultural" | "certifications";

export type Achievement = {
  id: string;
  user_id: string;
  child_id: string;
  type: AchievementType;
  subject: string;
  achievement_date: string;
  grade: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
};

export const useAchievements = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["achievements", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("child_id", childId!)
        .order("achievement_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
  });
};
