import { Fragment } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import { MemoryPolaroid } from "./MemoryPolaroid";

interface Props {
  memories: Memory[];
  onOpen: (m: Memory) => void;
  showMonths?: boolean;
}

/** Memories grouped by year: a stamped year heading, then polaroids flowing left to right. */
export const MemoryTimeline = ({ memories, onOpen, showMonths = false }: Props) => {
  const byYear = new Map<number, Memory[]>();
  for (const m of memories) {
    const year = new Date(m.happened_at).getFullYear();
    byYear.set(year, [...(byYear.get(year) ?? []), m]);
  }

  let n = 0;
  return (
    <div className="space-y-10">
      {Array.from(byYear.entries()).map(([year, items]) => {
        let lastMonth: number | null = null;
        return (
          <section key={year}>
            <div className="mb-6 flex items-center gap-4">
              <span className="-rotate-2 rounded-sm border-[3px] border-double border-primary-deep/50 bg-card px-4 py-0.5 font-display text-[24px] font-semibold tracking-wide text-primary-deep shadow-soft">
                {year}
              </span>
              <span className="h-0 flex-1 border-t-2 border-dashed border-primary/40" aria-hidden />
              <span className="text-[12px] text-muted-foreground">
                {items.length} {items.length === 1 ? "memory" : "memories"}
              </span>
            </div>
            <ul className="flex flex-wrap gap-x-7 gap-y-9 px-1">
              {items.map((m) => {
                const month = new Date(m.happened_at).getMonth();
                const showMonth = showMonths && month !== lastMonth;
                lastMonth = month;
                const index = n++;
                return (
                  <Fragment key={m.id}>
                    {showMonth && (
                      <li className="basis-full">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {format(new Date(m.happened_at), "MMMM")}
                        </span>
                      </li>
                    )}
                    <li className="w-[calc(50%-14px)] min-w-[150px] sm:w-[220px]">
                      <MemoryPolaroid memory={m} index={index} onOpen={onOpen} />
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
