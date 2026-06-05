import { format } from "date-fns";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Memory } from "@/hooks/useMemories";

const tagStyles: Record<string, string> = {
  Milestone: "bg-accent/40 text-accent-foreground",
  Celebration: "bg-secondary/30 text-secondary",
  Everyday: "bg-primary/30 text-primary-deep",
  Cozy: "bg-muted text-muted-foreground",
  Adventure: "bg-success/25 text-success",
  Family: "bg-warning/25 text-warning-foreground",
};

const dotStyles: Record<string, string> = {
  Milestone: "bg-accent",
  Celebration: "bg-secondary",
  Everyday: "bg-primary",
  Cozy: "bg-muted-foreground/60",
  Adventure: "bg-success",
  Family: "bg-warning",
};

interface Props {
  memories: Memory[];
  onOpen: (m: Memory) => void;
  showMonths?: boolean;
  yearRefs?: React.MutableRefObject<Record<number, HTMLElement | null>>;
}

export const MemoryTimeline = ({ memories, onOpen, showMonths = false, yearRefs }: Props) => {
  let lastYear: number | null = null;
  let lastMonth: number | null = null;

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Center axis — left rail on mobile, centered on desktop */}
      <div className="pointer-events-none absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/30 to-transparent md:left-1/2 md:-translate-x-1/2" />

      <ol className="space-y-5 md:space-y-6">
        {memories.map((m, i) => {
          const date = new Date(m.happened_at);
          const year = date.getFullYear();
          const month = date.getMonth();
          const showYear = year !== lastYear;
          const showMonth = showMonths && (showYear || month !== lastMonth);
          lastYear = year;
          lastMonth = month;
          const isLeft = i % 2 === 0;

          return (
            <li key={m.id}>
              {showYear && (
                <div
                  ref={(el) => {
                    if (yearRefs) yearRefs.current[year] = el;
                  }}
                  className="relative z-10 mb-3 flex scroll-mt-44 items-center justify-start pl-12 md:justify-center md:pl-0"
                >
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-bold tracking-wide text-foreground shadow-soft">
                    {year}
                  </span>
                </div>
              )}

              {showMonth && (
                <div className="relative z-10 mb-2 flex items-center justify-start pl-12 md:justify-center md:pl-0">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {format(date, "MMMM")}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "relative grid items-start gap-3 md:grid-cols-2 md:gap-8",
                  !isLeft && "md:[&>.tl-card]:order-2",
                )}
              >
                {/* Card */}
                <div
                  className={cn(
                    "tl-card pl-12 md:pl-0",
                    isLeft ? "md:pr-6 md:text-right" : "md:pl-6",
                  )}
                >
                  <button
                    onClick={() => onOpen(m)}
                    className="group block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift animate-fade-in-up"
                  >
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.title}
                        loading="lazy"
                        className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-36"
                      />
                    ) : (
                      <div className="flex h-20 items-center justify-center bg-gradient-warm text-muted-foreground sm:h-24">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                    )}
                    <div className="space-y-1 p-3 text-left">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          tagStyles[m.category] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {m.category}
                      </span>
                      <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">
                        {m.title}
                      </h3>
                      <p className="text-[12px] text-muted-foreground">
                        {format(date, "MMM d, yyyy")}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Dot on the axis — aligned with rail */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-5 top-4 z-10 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-background md:left-1/2 md:top-6",
                    dotStyles[m.category] ?? "bg-primary",
                  )}
                />

                {/* Spacer for alternating side on desktop */}
                <div className="hidden md:block" />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
