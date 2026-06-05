import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DocCategory =
  | "birth_certificate"
  | "vaccination"
  | "ssn_id"
  | "school"
  | "medical"
  | "passport"
  | "other";

export type ChildDocument = {
  id: string;
  user_id: string;
  child_id: string;
  category: DocCategory;
  title: string;
  file_path: string;
  notes: string | null;
  created_at: string;
};

export const useDocuments = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["documents", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<ChildDocument[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("child_id", childId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChildDocument[];
    },
  });
};

export const useGuidanceProgress = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["guidance", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("guidance_progress")
        .select("guide_key")
        .eq("child_id", childId!);
      if (error) throw error;
      return (data ?? []).map((d) => d.guide_key);
    },
  });
};
