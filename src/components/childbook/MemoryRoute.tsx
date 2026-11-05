import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ImageIcon, Plus, Sparkles } from "lucide-react";
import type { Memory } from "@/hooks/useMemories";
import { Button } from "@/components/ui/button";
import { MemoryPolaroid } from "./MemoryPolaroid";

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

/** Year albums: one cover card per year; picking a card shows that year's memories below. */
export const MemoryRoute = ({ memories, onOpen, linkedLabelFor, onYearOpenChange, category = "All", onCreate, fallback }: Props) => {
  // Years in the order the memories arrive (the sort decides the direction).
  const albums = useMemo(() => {
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
  }, [memories]);

  const [selected, setSelected] = useState<number | null>(null);
  // An opened year stays open even if the active filters leave it with no memories.
  const current =
    albums.find((a) => a.year === selected) ??
    (selected !== null ? { year: selected, items: [] as Memory[], cover: null } : undefined);
  const yearOpen = !!current;
  useEffect(() => {
    onYearOpenChange?.(yearOpen);
  }, [yearOpen, onYearOpenChange]);
  useEffect(() => () => onYearOpenChange?.(false), [onYearOpenChange]);

  if (current) {
    return (
      <section key={current.year} className="animate-fade-in">
        <button
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All years
        </button>
        <div className="mb-6 flex items-center gap-4">
          <span className="-rotate-2 rounded-sm border-[3px] border-double border-primary-deep/50 bg-card px-4 py-0.5 font-display text-[24px] font-semibold tracking-wide text-primary-deep shadow-soft">
            {current.year}
          </span>
          <span className="h-0 flex-1 border-t-2 border-dashed border-primary/40" aria-hidden />
          <span className="text-[12px] text-muted-foreground">
            {current.items.length} {current.items.length === 1 ? "memory" : "memories"}
          </span>
        </div>
        {current.items.length === 0 ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/25 text-primary-deep">
              <Sparkles className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              {category !== "All" ? `No ${category.toLowerCase()} memories in ${current.year}` : `No memories in ${current.year}`}
            </h3>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {category !== "All" ? "Pick another category, or add one to this year." : "Add one to this year."}
            </p>
            {onCreate && (
              <Button variant="warm" className="mt-4" onClick={onCreate}>
                <Plus className="h-4 w-4" /> Add a memory
              </Button>
            )}
          </div>
        ) : (
        <ul className="flex flex-wrap gap-x-7 gap-y-9 px-1">
          {current.items.map((m, i) => (
            <li key={m.id} className="w-[calc(50%-14px)] min-w-[150px] sm:w-[220px]">
              <MemoryPolaroid memory={m} index={i} onOpen={onOpen} linkedLabel={linkedLabelFor?.(m)} />
            </li>
          ))}
        </ul>
        )}
      </section>
    );
  }

  if (albums.length === 0) return <>{fallback}</>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {albums.map((a) => {
          return (
            <button
              key={a.year}
              onClick={() => setSelected(a.year)}
              className="rounded-md border border-border bg-card p-2 pb-3 text-left shadow-soft transition-all odd:-rotate-1 even:rotate-1 hover:-translate-y-0.5 hover:rotate-0"
            >
              <div className="aspect-[4/3] overflow-hidden rounded bg-muted">
                {a.cover ? (
                  <img src={a.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="mt-2 px-1">
                <div className="font-display text-[20px] font-semibold leading-tight text-foreground">
                  {a.year}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  {a.items.length} {a.items.length === 1 ? "memory" : "memories"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
