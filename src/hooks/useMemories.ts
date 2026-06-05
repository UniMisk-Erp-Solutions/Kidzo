import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Memory = {
  id: string;
  user_id: string;
  child_id: string;
  title: string;
  story: string | null;
  happened_at: string;
  category: string;
  who_was_there: string[];
  tags: string[];
  photo_url: string | null;
  photo_urls: string[];
  reaction: string | null;
  created_at: string;
};

export const useMemories = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memories", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<Memory[]> => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("child_id", childId!)
        .order("happened_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Memory[];
    },
  });
};
