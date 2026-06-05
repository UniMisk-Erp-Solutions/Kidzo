import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserBookStatus =
  | "draft"
  | "preview"
  | "ordered"
  | "printing"
  | "shipped"
  | "delivered";

export type UserBook = {
  id: string;
  child_id: string;
  parent_id: string;
  template_id: string;
  title: string;
  subtitle: string | null;
  memories_selected: string[];
  custom_pages: unknown[];
  layout_order: unknown[];
  color_override: Record<string, string>;
  book_size: string;
  paper_quality: string;
  binding_type: string;
  quantity: number;
  price_total: number;
  status: UserBookStatus;
  preview_url: string | null;
  order_date: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
};

export const useUserBooks = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-books", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserBook[]> => {
      const { data, error } = await supabase
        .from("user_books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserBook[];
    },
  });
};

export const useUserBook = (id?: string) =>
  useQuery({
    queryKey: ["user-book", id],
    enabled: !!id,
    queryFn: async (): Promise<UserBook | null> => {
      const { data, error } = await supabase
        .from("user_books")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as UserBook) ?? null;
    },
  });

export const useCreateUserBook = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      child_id: string;
      template_id: string;
      title: string;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("user_books")
        .insert({
          parent_id: user.id,
          child_id: payload.child_id,
          template_id: payload.template_id,
          title: payload.title,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as UserBook;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-books"] }),
  });
};

export type UpdateUserBookPayload = Partial<{
  title: string;
  subtitle: string | null;
  memories_selected: string[];
  custom_pages: unknown[];
  layout_order: unknown[];
  color_override: Record<string, string>;
  book_size: string;
  paper_quality: string;
  binding_type: string;
  quantity: number;
  status: UserBookStatus;
}>;

export const useUpdateUserBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateUserBookPayload }) => {
      const { data, error } = await supabase
        .from("user_books")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as UserBook;
    },
    onSuccess: (book) => {
      qc.invalidateQueries({ queryKey: ["user-books"] });
      qc.invalidateQueries({ queryKey: ["user-book", book.id] });
    },
  });
};

export const useDeleteUserBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-books"] }),
  });
};
