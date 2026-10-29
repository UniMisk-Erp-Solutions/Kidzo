import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** The only types that can be uploaded. Government IDs (Aadhaar/PAN/passport/SSN) are deliberately not here. */
export const ALLOWED_DOC_CATEGORIES = ["birth_certificate", "vaccination", "marksheet", "school", "achievement"] as const;
export type AllowedDocCategory = (typeof ALLOWED_DOC_CATEGORIES)[number];

/** Older uploads may still carry a retired type; they stay viewable/deletable but can't be added to. */
export type DocCategory = AllowedDocCategory | "ssn_id" | "passport" | "medical" | "other";

export const isAllowedCategory = (c: string): c is AllowedDocCategory =>
  (ALLOWED_DOC_CATEGORIES as readonly string[]).includes(c);

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
