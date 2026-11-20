import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemoryMedia } from "@/lib/memoryMedia";
import { MemoryMediaThumbnail } from "./MemoryMediaThumbnail";

interface Props {
  items: MemoryMedia[];
  title: string;
  activeIdx: number;
  onChange: (updater: (i: number) => number) => void;
  onSelect: (i: number) => void;
}

const ARROW = "absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft transition hover:bg-background sm:flex";

/** Previous/next stepping for a photo strip: buttons, arrow keys and horizontal swipes. */
const useStepping = (n: number, onChange: (updater: (i: number) => number) => void) => {
  const touchX = useRef<number | null>(null);
  const step = (dir: 1 | -1) => {
    if (n > 1) onChange((i) => (i + dir + n) % n);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLVideoElement) return;
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };
  return { step, onKey, onTouchStart, onTouchEnd };
};

const Thumbs = ({ items, activeIdx, onSelect }: { items: MemoryMedia[]; activeIdx: number; onSelect: (i: number) => void }) => (
  <div className="flex gap-1.5 overflow-x-auto bg-card/95 px-3 py-2 scrollbar-hide">
    {items.map((item, i) => (
      <button
        key={item.url + i}
        type="button"
        onClick={() => onSelect(i)}
        aria-label={`View ${item.kind} ${i + 1}`}
        className={cn(
          "h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
          i === activeIdx ? "border-primary-deep" : "border-transparent opacity-70 hover:opacity-100",
        )}
      >
        <MemoryMediaThumbnail item={item} alt="" className="h-full w-full object-cover" />
      </button>
    ))}
  </div>
);

/** Photo and video gallery with swipe, arrow keys, and selectable thumbnails. */
export const MemoryImageViewer = ({ items, title, activeIdx, onChange, onSelect }: Props) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const n = items.length;
  const active = items[Math.min(activeIdx, Math.max(0, n - 1))] ?? null;
  const { onKey, onTouchStart, onTouchEnd, step } = useStepping(n, onChange);
  if (!active) return null;

  return (
    <div className="bg-muted" onKeyDown={onKey}>
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {active.kind === "video" ? (
          <div className="space-y-1">
            <video
              key={active.url}
              src={active.url}
              poster={active.posterUrl ?? undefined}
              aria-label={`Video for ${title}`}
              controls
              playsInline
              preload="metadata"
              className="max-h-[45dvh] w-full bg-black"
            />
            <a href={active.url} target="_blank" rel="noopener noreferrer" className="inline-block px-3 pb-2 text-xs text-primary-deep underline">
              Open video file
            </a>
          </div>
        ) : (
          <>
            <img
              src={active.url}
              alt={title}
              className={cn(
                "w-full select-none",
                showFullImage ? "max-h-[65dvh] object-contain" : "max-h-[45vh] object-cover",
              )}
              draggable={false}
            />
            <button
              type="button"
              aria-pressed={showFullImage}
              aria-label="View full image"
              onClick={() => setShowFullImage((current) => !current)}
              className="absolute bottom-2 left-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-background/95 px-3 text-xs font-medium text-foreground shadow-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showFullImage ? <Minimize2 className="size-3.5" aria-hidden="true" /> : <Maximize2 className="size-3.5" aria-hidden="true" />}
              <span aria-hidden="true">{showFullImage ? "Show cropped preview" : "View full image"}</span>
            </button>
          </>
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous attachment" className={cn(ARROW, "left-3")}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next attachment" className={cn(ARROW, "right-3")}>
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-3 rounded-full bg-foreground/60 px-2 py-0.5 text-[11px] font-medium text-background">
              {Math.min(activeIdx, n - 1) + 1} / {n}
            </span>
          </>
        )}
      </div>
      {n > 1 && <Thumbs items={items} activeIdx={activeIdx} onSelect={onSelect} />}
    </div>
  );
};
