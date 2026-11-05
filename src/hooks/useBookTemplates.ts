import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import type { BookTemplate, BookTemplateColors, BookTemplateLayout } from "@/lib/types/bookTemplate";
export type { BookTemplate, BookTemplateColors, BookTemplateLayout };


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
