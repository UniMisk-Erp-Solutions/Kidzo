import { useMemo } from "react";
import { useMemories, type Memory } from "@/hooks/useMemories";

const DEFAULT_TAGS = ["little-wins", "weekend-adventures", "everyday-joy", "first-time", "family-outing", "funny-moment"];

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
    const values = m[field] ?? [];
    values.forEach((raw) => bump(counts, raw));
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).map((x) => x.label);
}

function suggestTags(memories: Memory[]) {
  const tags = new Map(DEFAULT_TAGS.map((tag) => [tag, tag]));
  for (const raw of tally(memories, "tags")) {
    const tag = raw.replace(/^#+/, "").trim();
    const key = tag.toLowerCase();
    if (tag && key !== "dummy-seed-admin" && !tags.has(key)) tags.set(key, tag);
  }
  return [...tags.values()];
}

/** Suggestions from this child's past memories, with fresh starter tags. */
export function useMemorySuggestions(childId?: string) {
  const { data: pastMemories = [] } = useMemories(childId);
  return useMemo(
    () => ({ whoSuggestions: tally(pastMemories, "who_was_there"), tagSuggestions: suggestTags(pastMemories) }),
    [pastMemories],
  );
}
