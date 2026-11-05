import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Star } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  date: string;
  photos: string[];
  coverUrl?: string;
  selected: boolean;
  onToggle: () => void;
  onCover: (url: string) => void;
  onMove: (dir: -1 | 1) => void;
  canPrev: boolean;
  canNext: boolean;
}

const photoCountLabel = (n: number) => {
  if (n > 1) return `${n} photos · hover to browse`;
  return n === 1 ? "1 photo" : "No photos";
};

interface CoverBadgeProps {
  isCover: boolean;
  onUseAsCover: () => void;
}

/** "Cover" badge on the cover photo, or a "Use as cover" button on any other. */
const CoverBadge = ({ isCover, onUseAsCover }: CoverBadgeProps) =>
  isCover ? (
    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-soft">
      <Star className="h-3 w-3 fill-current" /> Cover
    </span>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onUseAsCover();
      }}
      className="absolute left-2 top-2 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-soft transition hover:bg-card"
    >
      Use as cover
    </button>
  );

/** Little dots showing which photo of the memory is on screen. */
const PhotoDots = ({ count, idx }: { count: number; idx: number }) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
    {Array.from({ length: count }, (_, k) => (
      <span key={k} className={cn("h-1.5 rounded-full bg-white/90 shadow transition-all", k === idx ? "w-4" : "w-1.5 opacity-60")} />
    ))}
  </div>
);

/** The photos, laid side by side and slid into view by `idx`; a placeholder when there are none. */
const PhotoStrip = ({ photos, idx }: { photos: string[]; idx: number }) => {
  if (photos.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  return (
    <>
      {photos.map((url, k) => (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${(k - idx) * 100}%)` }}
        />
      ))}
    </>
  );
};

/**
 * One memory in the Export & share picker: a large photo that slides through the memory's other photos on hover
 * (tap to advance on touch screens), with a clear "cover" badge / "Use as cover" action on the photo shown.
 */
export const ExportMemoryCard = ({ title, date, photos, coverUrl, selected, onToggle, onCover, onMove, canPrev, canNext }: Props) => {
  const coverIdx = Math.max(0, photos.indexOf(coverUrl ?? photos[0]));
  const [idx, setIdx] = useState(coverIdx);
  const [hover, setHover] = useState(false);
  const multi = photos.length > 1;

  // Slideshow while hovering
  useEffect(() => {
    if (!hover || !multi) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % photos.length), 1200);
    return () => window.clearInterval(t);
  }, [hover, multi, photos.length]);

  const shown = photos[idx] ?? photos[0];
  const isCover = shown === (coverUrl ?? photos[0]);

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-2xl border p-4 transition-all duration-200",
        selected ? "border-border bg-card shadow-soft hover:shadow-lift" : "border-dashed border-border bg-muted/30 opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-0.5" aria-label={`Include ${title}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground" title={title}>
            {title}
          </p>
          <span className="text-[11px] text-muted-foreground">{format(new Date(date), "MMM d, yyyy")}</span>
        </div>
      </div>

      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setIdx(coverIdx);
        }}
        onClick={() => multi && setIdx((i) => (i + 1) % photos.length)}
      >
        <PhotoStrip photos={photos} idx={idx} />
        {photos.length > 0 && <CoverBadge isCover={isCover} onUseAsCover={() => onCover(shown)} />}
        {multi && <PhotoDots count={photos.length} idx={idx} />}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {photoCountLabel(photos.length)}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove(-1)} disabled={!canPrev} aria-label="Move earlier in the book">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove(1)} disabled={!canNext} aria-label="Move later in the book">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
};
