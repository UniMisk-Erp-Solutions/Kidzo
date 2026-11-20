import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const LITTLE_TOPIC_IDS = ["song", "snack", "interest", "movie_book"] as const;

export type LittleTopic = (typeof LITTLE_TOPIC_IDS)[number];
export type LittleEntries = Partial<Record<LittleTopic, string>>;
export type LittleDraft = { original: LittleEntries; values: LittleEntries };

type Change = { child_id: string; topic: LittleTopic; detail: string };

/** The topics whose text differs from what was loaded. */
function changesFor(childId: string, { original, values }: LittleDraft): Change[] {
  return LITTLE_TOPIC_IDS.flatMap((topic) => {
    const detail = (values[topic] ?? "").trim();
    return detail === (original[topic] ?? "") ? [] : [{ child_id: childId, topic, detail }];
  });
}

async function loadEntries(childId: string): Promise<LittleEntries> {
  const { data, error } = await supabase
    .from("child_little_things")
    .select("topic, detail")
    .eq("child_id", childId)
    .in("topic", [...LITTLE_TOPIC_IDS]);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.topic, row.detail])) as LittleEntries;
}

/** A child's "little things right now" (favourite song, snack, …): the saved entries and a save action. */
export function useLittleThings(childId: string, onSaved: () => void) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["child-little-things", user?.id, childId];

  const entries = useQuery({ queryKey: key, enabled: !!user, queryFn: () => loadEntries(childId) });

  const save = useMutation({
    mutationFn: async (draft: LittleDraft) => {
      const changes = changesFor(childId, draft);
      if (!changes.length) return;
      const { error } = await supabase.from("child_little_things").upsert(changes, { onConflict: "child_id,topic" });
      if (error) throw error;
      client.setQueryData<LittleEntries>(key, (previous) => ({
        ...previous,
        ...Object.fromEntries(changes.map((c) => [c.topic, c.detail])),
      }));
      await client.invalidateQueries({ queryKey: key });
    },
    onSuccess: onSaved,
  });

  return { entries, save };
}
