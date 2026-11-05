import { Camera, Star, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MAX_PHOTOS, type NewPhoto } from "./memoryDetailUtils";

interface TileProps {
  src: string;
  isHighlight: boolean;
  isNew?: boolean;
  ariaLabel?: string;
  onSelect: () => void;
  onRemove: () => void;
}

const HighlightBadge = () => (
  <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-primary-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
    <Star className="h-2.5 w-2.5" /> Highlight
  </span>
);

const PhotoTile = ({ src, isHighlight, isNew, ariaLabel, onSelect, onRemove }: TileProps) => (
  <li className="relative">
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "block aspect-square w-full overflow-hidden rounded-xl border-2 transition-all",
        isHighlight ? "border-primary-deep ring-2 ring-primary/40" : "border-border hover:border-primary/40",
      )}
      aria-label={ariaLabel}
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
      {isNew && (
        <span className="absolute right-1 bottom-1 rounded-full bg-accent/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
          New
        </span>
      )}
      {isHighlight && <HighlightBadge />}
    </button>
    <button
      type="button"
      onClick={onRemove}
      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
      aria-label="Remove photo"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </li>
);

const AddPhotoTile = ({ onAdd }: { onAdd: (files: FileList | null) => void }) => (
  <li>
    <label
      htmlFor="edit-photo-add"
      className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60"
    >
      <Camera className="h-5 w-5" />
      <span className="text-[11px] font-medium">Add photo</span>
      <input
        id="edit-photo-add"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  </li>
);

interface Props {
  keptUrls: string[];
  newPhotos: NewPhoto[];
  highlightIdx: number;
  onHighlight: (idx: number) => void;
  onRemoveKept: (idx: number) => void;
  onRemoveNew: (id: string) => void;
  onAdd: (files: FileList | null) => void;
}

/** Photo grid of the memory editor: pick the highlight, remove photos, add more. */
export const MemoryPhotoManager = (p: Props) => {
  const total = p.keptUrls.length + p.newPhotos.length;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <Label>Photos</Label>
        <span className="text-[11px] text-muted-foreground">
          {total}/{MAX_PHOTOS} · tap to set highlight
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {p.keptUrls.map((url, i) => (
          <PhotoTile
            key={`kept-${url}-${i}`}
            src={url}
            isHighlight={i === p.highlightIdx}
            ariaLabel={i === p.highlightIdx ? "Current highlight" : "Set as highlight"}
            onSelect={() => p.onHighlight(i)}
            onRemove={() => p.onRemoveKept(i)}
          />
        ))}
        {p.newPhotos.map((photo, i) => (
          <PhotoTile
            key={photo.id}
            src={photo.preview}
            isNew
            isHighlight={p.keptUrls.length + i === p.highlightIdx}
            onSelect={() => p.onHighlight(p.keptUrls.length + i)}
            onRemove={() => p.onRemoveNew(photo.id)}
          />
        ))}
        {total < MAX_PHOTOS && <AddPhotoTile onAdd={p.onAdd} />}
      </ul>
    </div>
  );
};
