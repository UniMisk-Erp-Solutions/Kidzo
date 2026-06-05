import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BookTemplateLayout = {
  type: "hero" | "timeline" | "story" | "grid" | "highlight";
  title: string;
  photos: number;
};

export type BookTemplateColors = {
  primary: string;   // page background (paper tone)
  accent: string;    // tape / highlight strips
  gold: string;      // ticket-stub / stamp
  coral: string;     // playful accent dots, hearts
  mint?: string;     // secondary accent
  ink?: string;      // body text / handwritten ink
  paper?: string;    // alt paper for layered cards
  text?: string;     // legacy fallback for ink
};

export type BookTemplate = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  cover_image_url: string | null;
  page_layouts: BookTemplateLayout[];
  color_scheme: BookTemplateColors;
  suggested_age_range: string | null;
  pages_needed: number;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
};

export const useBookTemplates = () =>
  useQuery({
    queryKey: ["book-templates"],
    queryFn: async (): Promise<BookTemplate[]> => {
      const { data, error } = await supabase
        .from("book_templates")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BookTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });
