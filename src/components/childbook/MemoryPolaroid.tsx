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

const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];
const TAPES = ["bg-accent/50", "bg-primary/40", "bg-secondary/40", "bg-warning/40"];
const TAPE_TILTS = ["rotate-3", "-rotate-3"];

interface Props {
  memory: Memory;
  index: number;
  onOpen: (m: Memory) => void;
  /** Shown above the category when the memory belongs to a sibling. */
  linkedLabel?: string;
}

/** Scrapbook-style polaroid: taped, slightly tilted, handwritten title. */
export const MemoryPolaroid = ({ memory: m, index, onOpen, linkedLabel }: Props) => {
  const extraPhotos = (m.photo_urls?.length ?? 0) - 1;
  return (
    // The entrance animation lives on this wrapper: its fill-mode would otherwise pin the button's transform and cancel the tilt.
    <div className="animate-fade-in-up">
    <button
      onClick={() => onOpen(m)}
      className={cn(
        "group relative block w-full rounded-sm border border-border bg-card p-2.5 pb-3.5 text-left shadow-soft transition-all duration-200",
        "hover:-translate-y-1 hover:rotate-0 hover:shadow-lift",
        TILTS[index % TILTS.length],
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2",
          TAPES[index % TAPES.length],
          TAPE_TILTS[index % TAPE_TILTS.length],
        )}
      />
      {m.photo_url ? (
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img src={m.photo_url} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
          {extraPhotos > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-soft">
              +{extraPhotos}
            </span>
          )}
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-gradient-warm text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      <div className="space-y-1 px-0.5 pt-3">
        {linkedLabel && (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-medium text-secondary">
              ↳ {linkedLabel}
            </span>
          </div>
        )}
        <span
          className={cn(
            "inline-block rounded-sm border border-dashed border-foreground/25 px-1.5 text-[10px] font-medium uppercase tracking-wide",
            tagStyles[m.category] ?? "bg-muted text-muted-foreground",
          )}
        >
          {m.category}
        </span>
        <h3 className="font-handwritten line-clamp-2 text-[24px] font-bold leading-[1.05] text-foreground">
          {m.title}
        </h3>
        <p className="text-[12px] text-muted-foreground">{format(new Date(m.happened_at), "MMM d, yyyy")}</p>
      </div>
    </button>
    </div>
  );
};
