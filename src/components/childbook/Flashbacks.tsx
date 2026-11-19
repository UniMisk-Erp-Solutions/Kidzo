import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlashbacks, type FlashbackGroup } from "@/hooks/useFlashbacks";
import { StoryViewer } from "@/components/childbook/StoryViewer";
import type { Memory } from "@/hooks/useMemories";

interface Props {
  memories: Memory[];
  /** "card" = full home-style banner. "strip" = inline section. */
  variant?: "card" | "strip";
}

const photosIn = (g: FlashbackGroup) => g.memories.reduce((n, m) => n + (m.photo_urls?.length || (m.photo_url ? 1 : 0)), 0);
const coverOf = (g: FlashbackGroup) => {
  for (const m of g.memories) {
    const src = m.photo_url ?? m.photo_urls?.[0];
    if (src) return src;
  }
  return null;
};

/** One recap, shown like a story ring: cover photo, label, and a play badge. */
const RecapTile = ({ g, onPlay }: { g: FlashbackGroup; onPlay: () => void }) => {
  const cover = coverOf(g);
  const photos = photosIn(g);
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${g.title} — ${g.tag}`}
      className="group relative h-52 w-36 flex-shrink-0 overflow-hidden rounded-3xl border-2 border-card bg-gradient-warm text-left shadow-soft ring-2 ring-primary/60 transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-primary-deep sm:h-56 sm:w-40"
    >
      {cover && (
        <img src={cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
        {g.tag}
      </span>
      <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-foreground">
        <Play className="h-3.5 w-3.5 fill-current" />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3 text-white">
        <span className="block text-[15px] font-semibold leading-tight">{g.title}</span>
        <span className="mt-0.5 block text-[11px] opacity-85">
          {g.memories.length} {g.memories.length === 1 ? "memory" : "memories"}
          {photos > 0 ? ` · ${photos} ${photos === 1 ? "photo" : "photos"}` : ""}
        </span>
      </span>
    </button>
  );
};

/** Which way the row can still scroll, kept up to date as it scrolls or the window resizes. */
function useScrollArrows(rowRef: RefObject<HTMLUListElement>, watch: number) {
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScroll({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, [rowRef]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, watch]);

  const scrollBy = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: "smooth" });
  return { canScroll, measure, scrollBy };
}

const ScrollArrow = ({ side, onClick }: { side: "left" | "right"; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={side === "left" ? "Scroll recaps left" : "Scroll recaps right"}
    className={cn(
      "absolute top-[6.5rem] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-lift transition hover:bg-card sm:top-28",
      side === "left" ? "left-2" : "right-2",
    )}
  >
    {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
  </button>
);

const FlashbacksHeader = ({ onCard }: { onCard: boolean }) => (
  <header className="flex items-center gap-2.5 px-5 pt-4 sm:px-6">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-card/80 text-accent-foreground">
      <Sparkles className="h-4.5 w-4.5" />
    </span>
    <div className="min-w-0">
      <h2 className={cn("truncate text-[15px] font-semibold sm:text-base", onCard ? "text-[hsl(var(--on-celebrate))]" : "text-foreground")}>
        Flashbacks
      </h2>
      <p className={cn("truncate text-[12px]", onCard ? "text-[hsl(var(--on-celebrate)/0.75)]" : "text-muted-foreground")}>
        Tap a recap to replay it. Hold to pause.
      </p>
    </div>
  </header>
);

/** Replays: last month's recap and this month in earlier years, each opening as a story. */
export const Flashbacks = ({ memories, variant = "card" }: Props) => {
  const groups = useFlashbacks(memories);
  const [playing, setPlaying] = useState<string | null>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const { canScroll, measure, scrollBy } = useScrollArrows(rowRef, groups.length);

  if (groups.length === 0) return null;
  const current = groups.find((g) => g.key === playing) ?? null;

  return (
    <section
      aria-label="Memory flashbacks"
      className={cn(
        "animate-fade-in-up overflow-hidden rounded-3xl border border-border shadow-soft",
        variant === "card" ? "bg-gradient-celebrate" : "bg-card",
      )}
    >
      <FlashbacksHeader onCard={variant === "card"} />

      <div className="relative mt-4">
        <ul ref={rowRef} onScroll={measure} className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide px-5 pb-6 sm:gap-4 sm:px-6">
          {groups.map((g) => (
            <li key={g.key} className="flex-shrink-0">
              <RecapTile g={g} onPlay={() => setPlaying(g.key)} />
            </li>
          ))}
        </ul>
        {canScroll.left && <ScrollArrow side="left" onClick={() => scrollBy(-1)} />}
        {canScroll.right && <ScrollArrow side="right" onClick={() => scrollBy(1)} />}
      </div>

      {current && <StoryViewer title={current.title} tag={current.tag} memories={current.memories} onClose={() => setPlaying(null)} />}
    </section>
  );
};
