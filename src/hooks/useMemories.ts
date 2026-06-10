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
  // Present when this memory appears on a child's timeline via a SIBLING link
  // (i.e. it primarily belongs to another child). Undefined for direct memories.
  is_linked?: boolean;
  relation_label?: string | null;
  // The child this memory primarily belongs to (= child_id of the source memory).
  primary_child_id?: string;
};

export const useMemories = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memories", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<Memory[]> => {
      // 1) Memories that belong directly to this child.
      const direct = await supabase
        .from("memories")
        .select("*")
        .eq("child_id", childId!)
        .order("happened_at", { ascending: false });
      if (direct.error) throw direct.error;

      // 2) Memories linked to this child from a sibling (shared timeline).
      const linked = await supabase
        .from("memory_child_links")
        .select("relation_label, memory:memories(*)")
        .eq("child_id", childId!);
      if (linked.error) throw linked.error;

      const directList = (direct.data ?? []) as Memory[];

      const linkedList: Memory[] = ((linked.data ?? []) as Array<{
        relation_label: string | null;
        memory: Memory | null;
      }>)
        .filter((row) => row.memory)
        .map((row) => ({
          ...(row.memory as Memory),
          is_linked: true,
          relation_label: row.relation_label ?? null,
          primary_child_id: (row.memory as Memory).child_id,
        }));

      // Merge (direct wins on conflict), then sort newest-first.
      const byId = new Map<string, Memory>();
      for (const m of directList) byId.set(m.id, m);
      for (const m of linkedList) if (!byId.has(m.id)) byId.set(m.id, m);

      return [...byId.values()].sort(
        (a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime(),
      );
    },
  });
};
