import { useMemo } from "react";
import { useMemories, type Memory } from "@/hooks/useMemories";

type Counts = Map<string, { label: string; count: number }>;

function bump(counts: Counts, raw: string | null) {
  const v = (raw ?? "").trim();
  if (!v) return;
  const key = v.toLowerCase();
  const cur = counts.get(key);
  if (cur) cur.count += 1;
  else counts.set(key, { label: v, count: 1 });
}

/** Values used on past memories for `field`, most used first. */
function tally(memories: Memory[], field: "who_was_there" | "tags"): string[] {
  const counts: Counts = new Map();
  for (const m of memories) {
    const values = (m as unknown as Record<string, string[] | null>)[field] ?? [];
    values.forEach((raw) => bump(counts, raw));
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).map((x) => x.label);
}

/** "Who was there" and tag suggestions drawn from this child's past memories. */
export function useMemorySuggestions(childId?: string) {
  const { data: pastMemories = [] } = useMemories(childId);
  return useMemo(
    () => ({ whoSuggestions: tally(pastMemories, "who_was_there"), tagSuggestions: tally(pastMemories, "tags") }),
    [pastMemories],
  );
}
