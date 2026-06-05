import { useState } from "react";
import { format } from "date-fns";
import { Sparkles, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlashbacks } from "@/hooks/useFlashbacks";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import type { Memory } from "@/hooks/useMemories";

interface Props {
  memories: Memory[];
  /** "card" = full home-style banner with horizontal scroll. "strip" = inline tab section. */
  variant?: "card" | "strip";
}

export const Flashbacks = ({ memories, variant = "card" }: Props) => {
  const groups = useFlashbacks(memories);
  const [open, setOpen] = useState<Memory | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  if (groups.length === 0) return null;

  const active = groups[Math.min(activeIdx, groups.length - 1)];

  return (
    <section
      aria-label="Memory flashbacks"
      className={cn(
        "animate-fade-in-up overflow-hidden rounded-3xl border border-border shadow-soft",
        variant === "card" ? "bg-gradient-celebrate" : "bg-card",
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-card/80 text-accent-foreground">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-foreground sm:text-base">
              Flashbacks · {format(new Date(), "MMMM")}
            </h2>
            <p className="truncate text-[12px] text-muted-foreground">{active.label} this month</p>
          </div>
        </div>

        {groups.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              aria-label="Previous year"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card/70 text-foreground transition hover:bg-card disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 px-1">
              {groups.map((g, i) => (
                <button
                  key={g.yearsAgo}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Jump to ${g.label}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === activeIdx ? "w-5 bg-foreground/80" : "w-1.5 bg-foreground/30",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => Math.min(groups.length - 1, i + 1))}
              disabled={activeIdx === groups.length - 1}
              aria-label="Next year"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card/70 text-foreground transition hover:bg-card disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      <ul className="-mx-6 mt-3 flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide px-6 pb-5">
        {active.memories.map((m) => {
          const cover = m.photo_url ?? m.photo_urls?.[0] ?? null;
          const extra = Math.max(0, (m.photo_urls?.length ?? (cover ? 1 : 0)) - 1);
          return (
            <li key={m.id} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpen(m)}
                className="group block w-44 overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift sm:w-48"
              >
                <div className="relative h-28 w-full overflow-hidden bg-gradient-warm sm:h-32">
                  {cover ? (
                    <img
                      src={cover}
                      alt={m.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  {extra > 0 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-soft">
                      +{extra}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 p-2.5">
                  <h3 className="line-clamp-1 text-[13px] font-semibold text-foreground">{m.title}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(m.happened_at), "MMM d, yyyy")}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
    </section>
  );
};
