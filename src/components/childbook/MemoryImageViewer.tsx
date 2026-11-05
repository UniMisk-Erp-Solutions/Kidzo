import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
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

const Thumbs = ({ images, activeIdx, onSelect }: { images: string[]; activeIdx: number; onSelect: (i: number) => void }) => (
  <div className="flex gap-1.5 overflow-x-auto bg-card/95 px-3 py-2 scrollbar-hide">
    {images.map((u, i) => (
      <button
        key={u + i}
        type="button"
        onClick={() => onSelect(i)}
        aria-label={`View photo ${i + 1}`}
        className={cn(
          "h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
          i === activeIdx ? "border-primary-deep" : "border-transparent opacity-70 hover:opacity-100",
        )}
      >
        <img src={u} alt="" className="h-full w-full object-cover" />
      </button>
    ))}
  </div>
);

/** Big photo with swipe / arrow-key / button browsing and a thumbnail strip. */
export const MemoryImageViewer = ({ images, title, activeIdx, onChange, onSelect }: Props) => {
  const n = images.length;
  const active = images[Math.min(activeIdx, Math.max(0, n - 1))] ?? null;
  const { onKey, onTouchStart, onTouchEnd, step } = useStepping(n, onChange);
  if (!active) return null;

  return (
    <div className="bg-muted" onKeyDown={onKey}>
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img src={active} alt={title} className="max-h-[45vh] w-full select-none object-cover" draggable={false} />
        {n > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={cn(ARROW, "left-3")}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className={cn(ARROW, "right-3")}>
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-3 rounded-full bg-foreground/60 px-2 py-0.5 text-[11px] font-medium text-background">
              {Math.min(activeIdx, n - 1) + 1} / {n}
            </span>
          </>
        )}
      </div>
      {n > 1 && <Thumbs images={images} activeIdx={activeIdx} onSelect={onSelect} />}
    </div>
  );
};
