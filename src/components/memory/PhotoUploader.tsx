import { Camera, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MAX_PHOTOS, type PhotoItem } from "@/hooks/useMemoryPhotos";

type OnFiles = (files: FileList | null) => void;

const PhotoFileInput = ({ onFiles }: { onFiles: OnFiles }) => (
  <input
    id="photo"
    type="file"
    accept="image/*"
    multiple
    className="sr-only"
    onChange={(e) => {
      onFiles(e.target.files);
      e.target.value = "";
    }}
  />
);

const EmptyPicker = ({ onFiles }: { onFiles: OnFiles }) => (
  <label
    htmlFor="photo"
    className="relative flex aspect-[16/9] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-all hover:border-primary/40 hover:bg-muted/60"
  >
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
        <Camera className="h-6 w-6" />
      </span>
      <div className="text-[15px] font-semibold text-foreground">Add photos</div>
      <div className="text-[13px] text-muted-foreground">Pick up to {MAX_PHOTOS} from your device</div>
    </div>
    <PhotoFileInput onFiles={onFiles} />
  </label>
);

interface TileProps {
  photo: PhotoItem;
  isHighlight: boolean;
  onHighlight: () => void;
  onRemove: () => void;
}

const PhotoTile = ({ photo, isHighlight, onHighlight, onRemove }: TileProps) => (
  <li className="relative">
    <button
      type="button"
      onClick={onHighlight}
      className={cn(
        "group relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition-all",
        isHighlight ? "border-primary-deep ring-2 ring-primary/40" : "border-border hover:border-primary/40",
      )}
      aria-label={isHighlight ? "Current highlight" : "Set as highlight"}
    >
      <img src={photo.preview} alt="" className="h-full w-full object-cover" />
      {isHighlight && (
        <span className="absolute bottom-1 left-1 rounded-full bg-primary-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
          ★ Highlight
        </span>
      )}
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

const AddMoreTile = ({ onFiles }: { onFiles: OnFiles }) => (
  <li>
    <label
      htmlFor="photo"
      className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60"
    >
      <Plus className="h-5 w-5" />
      <span className="text-[11px] font-medium">Add more</span>
      <PhotoFileInput onFiles={onFiles} />
    </label>
  </li>
);

interface Props {
  photos: PhotoItem[];
  highlightId: string | null;
  onFiles: OnFiles;
  onHighlight: (id: string) => void;
  onRemove: (id: string) => void;
}

/** The memory form's photo picker: an empty drop area, then a grid with a highlight and "Add more". */
export const PhotoUploader = ({ photos, highlightId, onFiles, onHighlight, onRemove }: Props) => (
  <div className="space-y-2">
    <div className="flex items-end justify-between gap-2">
      <Label>Photos</Label>
      <span className="text-[11px] text-muted-foreground">
        {photos.length}/{MAX_PHOTOS} · tap a photo to set as highlight
      </span>
    </div>

    {photos.length === 0 ? (
      <EmptyPicker onFiles={onFiles} />
    ) : (
      <div className="space-y-3">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <PhotoTile
              key={p.id}
              photo={p}
              isHighlight={p.id === highlightId}
              onHighlight={() => onHighlight(p.id)}
              onRemove={() => onRemove(p.id)}
            />
          ))}
          {photos.length < MAX_PHOTOS && <AddMoreTile onFiles={onFiles} />}
        </ul>
      </div>
    )}
    <p className="px-1 text-[12px] text-muted-foreground">The highlight image shows up first in timelines and books.</p>
  </div>
);
