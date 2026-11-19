import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import type { Memory } from "@/lib/types/memory";
export type { Memory };

type LinkRow = { relation_label: string | null; memory: Memory | null };

/** Memories that belong directly to this child. */
async function fetchDirectMemories(childId: string): Promise<Memory[]> {
  const direct = await supabase
    .from("memories")
    .select("*")
    .eq("child_id", childId)
    .order("happened_at", { ascending: false });
  if (direct.error) throw direct.error;
  return (direct.data ?? []) as Memory[];
}

/** Memories linked to this child from a sibling (shared timeline). */
async function fetchLinkedMemories(childId: string): Promise<Memory[]> {
  const linked = await supabase
    .from("memory_child_links")
    .select("relation_label, memory:memories(*)")
    .eq("child_id", childId);
  if (linked.error) throw linked.error;
  return ((linked.data ?? []) as LinkRow[]).flatMap(({ memory, relation_label }) =>
    memory
      ? [{ ...memory, is_linked: true, relation_label: relation_label ?? null, primary_child_id: memory.child_id }]
      : [],
  );
}

/** Merges the two lists (direct wins on conflict), newest first. */
function mergeMemories(directList: Memory[], linkedList: Memory[]): Memory[] {
  const byId = new Map<string, Memory>();
  for (const m of directList) byId.set(m.id, m);
  for (const m of linkedList) if (!byId.has(m.id)) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime(),
  );
}

async function fetchMemories(childId: string): Promise<Memory[]> {
  const directList = await fetchDirectMemories(childId);
  const linkedList = await fetchLinkedMemories(childId);
  return mergeMemories(directList, linkedList);
}

export const useMemories = (childId?: string, opts?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memories", user?.id, childId],
    enabled: !!user && !!childId && (opts?.enabled ?? true),
    queryFn: (): Promise<Memory[]> => (childId ? fetchMemories(childId) : Promise.resolve([])),
  });
};
