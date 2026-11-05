import type { Memory } from "@/hooks/useMemories";

export const CATEGORIES = ["All", "Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];
export const RANGES = [
  { value: "all", label: "All time" },
  { value: "newest", label: "Newest to oldest" },
  { value: "oldest", label: "Oldest to newest" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "365", label: "Last year" },
];

export type MomentsFilter = { category: string; range: string; yearFilter: string; search: string };

/** A search term matches a whole word, allowing a plural ("mom" finds "moms", never "moment"); longer terms may match a word prefix so typing still narrows live. */
const matchesWord = (word: string, term: string) =>
  word === term || (term.length >= 4 ? word.startsWith(term) : word === term + "s");

export const sortMemories = (list: Memory[], dir: "asc" | "desc") =>
  [...list].sort((a, b) => {
    const d = new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime();
    return dir === "asc" ? d : -d;
  });

const searchWords = (m: Memory) =>
  `${m.title} ${m.story ?? ""} ${m.tags.join(" ")} ${m.who_was_there.join(" ")}`
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const matchesTerms = (m: Memory, terms: string[]) => {
  if (!terms.length) return true;
  const words = searchWords(m);
  return terms.every((t) => words.some((w) => matchesWord(w, t)));
};

const matchesDate = (m: Memory, cutoff: number | null, yearFilter: string) => {
  const when = new Date(m.happened_at);
  if (cutoff && when.getTime() < cutoff) return false;
  return yearFilter === "all" || when.getFullYear() === Number(yearFilter);
};

export const filterMemories = (memories: Memory[], { category, range, yearFilter, search }: MomentsFilter) => {
  const cutoff = /^\d+$/.test(range) ? Date.now() - parseInt(range) * 24 * 60 * 60 * 1000 : null;
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  return memories.filter(
    (m) => (category === "All" || m.category === category) && matchesDate(m, cutoff, yearFilter) && matchesTerms(m, terms),
  );
};

export const momentsSubtitle = (count: number) =>
  count > 0 ? `${count} ${count === 1 ? "memory" : "memories"} captured ✨` : "Capture the little moments that matter.";
