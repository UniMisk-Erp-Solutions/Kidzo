import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Memory } from "@/lib/types/memory";

/** How many years one page of the Export picker / Moments shows. */
export const YEARS_PER_PAGE = 3;

type LinkedLite = { id: string; happened_at: string; category: string; title: string; story: string | null };

const yearOf = (iso: string) => new Date(iso).getFullYear();

/** Server-side narrowing for the memory queries below. */
export type MemoryFilters = {
  /** Only memories on or after this date (yyyy-MM-dd). */
  since?: string | null;
  /** Free text: every word must appear in the title, story, tags or people. */
  query?: string;
  /** Exact category; "All" / undefined = any. */
  category?: string;
};

const words = (q?: string) => (q ?? "").match(/[\p{L}\p{N}]+/gu) ?? [];

/** Whole-word match, allowing a plural for short terms ("mom" finds "moms", never "moment"); terms of 4+ letters match a word prefix. */
const wordMatches = (text: string, term: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .some((w) => w === term || (term.length >= 4 ? w.startsWith(term) : w === term + "s"));

/** One `or(...)` clause per search word: each word must hit a whole word of the title/story (database regex word
 *  boundaries) or exactly match a tag / person. */
const textClauses = (query?: string) =>
  words(query).map((w) => {
    const lower = w.toLowerCase();
    const re = lower.length >= 4 ? `[[:<:]]${lower}` : `[[:<:]]${lower}[s]?[[:>:]]`;
    return `title.imatch."${re}",story.imatch."${re}",tags.cs.{${lower}},who_was_there.cs.{${w}}`;
  });

const exactCategory = (f?: MemoryFilters) => (f?.category && f.category !== "All" ? f.category : null);

/** Does a sibling-linked memory pass the same since / category / text filters the server applied to the child's own? */
const linkedPasses = (
  m: { happened_at: string; category: string; title: string; story: string | null },
  f?: MemoryFilters,
) => {
  if (f?.since && m.happened_at < f.since) return false;
  if (f?.category && f.category !== "All" && m.category !== f.category) return false;
  const hay = `${m.title} ${m.story ?? ""}`;
  return words(f?.query)
    .map((w) => w.toLowerCase())
    .every((t) => wordMatches(hay, t));
};

const filterKey = (f?: MemoryFilters) => [f?.since ?? "", f?.category ?? "All", (f?.query ?? "").trim()];

/**
 * Year index for server-side pagination: how many memories each year has. Only ids + dates are fetched (a few
 * bytes per memory), never the memories themselves, so it stays cheap however large the timeline grows.
 * `rows` is the same list (id + date) for callers that need to pick a few memories to fetch in full.
 */
export const useMemoryYears = (childId?: string, filters?: MemoryFilters) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memory-years", user?.id, childId, ...filterKey(filters)],
    enabled: !!user && !!childId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("memories").select("id, happened_at").eq("child_id", childId!);
      if (filters?.since) q = q.gte("happened_at", filters.since);
      const category = exactCategory(filters);
      if (category) q = q.eq("category", category);
      for (const clause of textClauses(filters?.query)) q = q.or(clause);
      const direct = await q;
      if (direct.error) throw direct.error;
      // Memories linked from a sibling (only shown when no text/category filter is active, as before they were
      // matched client-side; the date filter still applies).
      const linked = await supabase
        .from("memory_child_links")
        .select("memory:memories(id, happened_at, category, title, story)")
        .eq("child_id", childId!)
        .returns<Array<{ memory: LinkedLite | null }>>();
      if (linked.error) throw linked.error;

      const seen = new Set<string>();
      const counts = new Map<number, number>();
      const rows: { id: string; happened_at: string }[] = [];
      const add = (m: { id: string; happened_at: string }) => {
        if (seen.has(m.id)) return;
        seen.add(m.id);
        rows.push({ id: m.id, happened_at: m.happened_at });
        const y = yearOf(m.happened_at);
        counts.set(y, (counts.get(y) ?? 0) + 1);
      };
      (direct.data ?? []).forEach(add);
      (linked.data ?? []).forEach((r) => r.memory && linkedPasses(r.memory, filters) && add(r.memory));

      const years = [...counts.keys()].sort((a, b) => b - a); // newest first
      const total = [...counts.values()].reduce((a, b) => a + b, 0);
      return { years, counts, total, rows };
    },
  });
};

/** One page of memories: only the years from..to, filtered on the server (plus sibling-linked ones in range). */
export const useMemoriesInYears = (
  childId: string | undefined,
  fromYear?: number,
  toYear?: number,
  filters?: MemoryFilters,
) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memories-range", user?.id, childId, fromYear, toYear, ...filterKey(filters)],
    enabled: !!user && !!childId && fromYear !== undefined && toYear !== undefined,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<Memory[]> => {
      const from = `${fromYear}-01-01`;
      const start = filters?.since && filters.since > from ? filters.since : from;
      let q = supabase
        .from("memories")
        .select("*")
        .eq("child_id", childId!)
        .gte("happened_at", start)
        .lt("happened_at", `${toYear! + 1}-01-01`);
      const category = exactCategory(filters);
      if (category) q = q.eq("category", category);
      for (const clause of textClauses(filters?.query)) q = q.or(clause);
      const direct = await q.order("happened_at", { ascending: false });
      if (direct.error) throw direct.error;

      const linked = await supabase
        .from("memory_child_links")
        .select("relation_label, memory:memories(*)")
        .eq("child_id", childId!)
        .returns<Array<{ relation_label: string | null; memory: Memory | null }>>();
      if (linked.error) throw linked.error;

      const byId = new Map<string, Memory>();
      for (const m of (direct.data ?? []) as Memory[]) byId.set(m.id, m);
      for (const row of linked.data ?? []) {
        const m = row.memory;
        const inRange = m && yearOf(m.happened_at) >= fromYear! && yearOf(m.happened_at) <= toYear!;
        if (!m || !inRange || byId.has(m.id) || !linkedPasses(m, filters)) continue;
        byId.set(m.id, { ...m, is_linked: true, relation_label: row.relation_label ?? null, primary_child_id: m.child_id });
      }
      return [...byId.values()].sort(
        (a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime(),
      );
    },
  });
};

/**
 * Memories from earlier years that fall in the current month (for the Flashbacks strip), fetched by id. The
 * candidates come from the year index, so the whole timeline never has to be downloaded.
 */
export const useMonthFlashbackMemories = (childId: string | undefined, rows: { id: string; happened_at: string }[] | undefined) => {
  const { user } = useAuth();
  const now = new Date();
  const ids = (rows ?? [])
    .filter((r) => {
      const d = new Date(r.happened_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() < now.getFullYear();
    })
    .map((r) => r.id)
    .sort();
  return useQuery({
    queryKey: ["memory-flashbacks", user?.id, childId, now.getMonth(), ids.join(",")],
    enabled: !!user && !!childId && ids.length > 0,
    queryFn: async (): Promise<Memory[]> => {
      const res = await supabase.from("memories").select("*").in("id", ids);
      if (res.error) throw res.error;
      return (res.data ?? []) as Memory[];
    },
  });
};
