import type { LayoutStyle } from "@/lib/exportShareBook";

type Dated = { id: string; happened_at: string };

export const LAYOUTS: { id: LayoutStyle; title: string; desc: string; swatches?: string[] }[] = [
  { id: "scrapbook-kraft", title: "Burgundy Diary", desc: "Kraft paper, torn burgundy panels & a vintage camera — 4 photos a page.", swatches: ["#C8A57A", "#7A1F2B", "#E0B24A"] },
  { id: "scrapbook-film", title: "Film Roll", desc: "A big hero photo with a film roll across the page and marker scribbles.", swatches: ["#E4DCCB", "#16161a", "#F0C84A"] },
  { id: "scrapbook-news", title: "Newsprint Collage", desc: "Taped, tilted photos over vintage newspaper with cut-out headlines.", swatches: ["#E8E1D1", "#D4553F", "#F3C94C"] },
  { id: "classic", title: "Classic coffee-table", desc: "Bold hero photo with caption — warm and traditional." },
  { id: "minimal", title: "Minimal", desc: "Lots of whitespace, centered photo and title." },
  { id: "timeline", title: "Timeline-first", desc: "Dark date rail down the left with story alongside." },
];

/** The finished PDF, only if it was built for this child. */
export const blobForChild = (job: { childId: string | null; blob: Blob | null }, childId?: string) =>
  childId && job.childId === childId ? job.blob : null;

/** 128 random bits as URL-safe text: unguessable, and carries no ids, names or server details. */
export const newShareToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c] ?? "");
};

export const yearOf = (m: Dated) => new Date(m.happened_at).getFullYear();

/** Groups memories by the calendar year they happened in, keeping their incoming order. */
export const groupByYear = <M extends Dated>(memories: M[]): Map<number, M[]> => {
  const byYear = new Map<number, M[]>();
  for (const m of memories) {
    const y = yearOf(m);
    byYear.set(y, [...(byYear.get(y) ?? []), m]);
  }
  return byYear;
};

/** Applies the user's own ordering (a list of ids) to one year's memories; unknown ids go last. */
export const applyOrder = <M extends Dated>(list: M[], order?: string[]): M[] => {
  if (!order) return list;
  const idx = new Map(order.map((id, i) => [id, i]));
  return [...list].sort((a, b) => (idx.get(a.id) ?? 1e9) - (idx.get(b.id) ?? 1e9));
};

/** A page of memories, newest year first, each year in the user's own order. */
export const orderPageMemories = <M extends Dated>(pageMemories: M[], orderByYear: Record<number, string[]>): M[] => {
  const byYear = groupByYear(pageMemories);
  return [...byYear.keys()]
    .sort((a, b) => b - a)
    .flatMap((y) => applyOrder(byYear.get(y) ?? [], orderByYear[y]));
};

export const buildYearGroups = <M extends Dated>(ordered: M[]) => {
  const map = new Map<number, { m: M; idx: number }[]>();
  ordered.forEach((m, idx) => {
    const y = yearOf(m);
    map.set(y, [...(map.get(y) ?? []), { m, idx }]);
  });
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, items]) => ({ year, items }));
};

/** Every selected memory across all the given years, year by year in the user's order. */
export const pickIncluded = <M extends Dated>(
  all: M[],
  years: number[],
  orderByYear: Record<number, string[]>,
  isSelected: (id: string) => boolean,
): M[] => {
  const byYear = groupByYear(all);
  return years.flatMap((y) => applyOrder(byYear.get(y) ?? [], orderByYear[y]).filter((m) => isSelected(m.id)));
};

/** The year (or year range) label shown between the pager arrows. */
export const yearRangeLabel = (pageYears: number[]): string | number => {
  const first = pageYears[0];
  const last = pageYears[pageYears.length - 1];
  return first === last ? first : `${first} – ${last}`;
};
