import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Memory } from "@/hooks/useMemories";
import { OpenYear, YearCard } from "./MemoryRouteParts";
import type { YearAlbum } from "./MemoryRouteParts";

interface Props {
  memories: Memory[];
  onOpen: (m: Memory) => void;
  linkedLabelFor?: (m: Memory) => string | undefined;
  /** Fires when a year is opened or closed, so the page can hide things like Flashbacks. */
  onYearOpenChange?: (open: boolean) => void;
  /** Active category filter, used to word the empty message for an opened year. */
  category?: string;
  /** Adds a memory; when given, an empty year offers an add button. */
  onCreate?: () => void;
  /** Shown when there are no years to show at all. */
  fallback?: ReactNode;
}

/** Years in the order the memories arrive (the sort decides the direction). */
const groupByYear = (memories: Memory[]): YearAlbum[] => {
  const byYear = new Map<number, Memory[]>();
  for (const m of memories) {
    const y = new Date(m.happened_at).getFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), m]);
  }
  return Array.from(byYear.entries()).map(([year, items]) => ({
    year,
    items,
    cover: items.find((m) => m.photo_url)?.photo_url ?? null,
  }));
};

/** An opened year stays open even if the active filters leave it with no memories. */
const findOpenYear = (albums: YearAlbum[], selected: number | null): YearAlbum | undefined => {
  const found = albums.find((a) => a.year === selected);
  if (found || selected === null) return found;
  return { year: selected, items: [], cover: null };
};

/** Year albums: one cover card per year; picking a card shows that year's memories below. */
export const MemoryRoute = ({ memories, onOpen, linkedLabelFor, onYearOpenChange, category = "All", onCreate, fallback }: Props) => {
  const albums = useMemo(() => groupByYear(memories), [memories]);
  const [selected, setSelected] = useState<number | null>(null);
  const current = findOpenYear(albums, selected);
  const yearOpen = !!current;
  useEffect(() => {
    onYearOpenChange?.(yearOpen);
  }, [yearOpen, onYearOpenChange]);
  useEffect(() => () => onYearOpenChange?.(false), [onYearOpenChange]);

  if (current) {
    return (
      <OpenYear
        album={current}
        category={category}
        onBack={() => setSelected(null)}
        onOpen={onOpen}
        linkedLabelFor={linkedLabelFor}
        onCreate={onCreate}
      />
    );
  }

  if (albums.length === 0) return <>{fallback}</>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {albums.map((a) => (
          <YearCard key={a.year} album={a} onSelect={setSelected} />
        ))}
      </div>
    </div>
  );
};
