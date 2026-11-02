import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { extractCapturedAt } from "@/lib/photoMeta";

export type PhotoItem = { id: string; file: File; preview: string };
export const MAX_PHOTOS = 10;

export type AutoDateInfo = { source: "exif" | "file" };

/** The date a photo was taken, and whether it came from the photo's metadata or only the file's timestamp. */
async function capturedDateOf(file: File): Promise<{ date: Date; source: AutoDateInfo["source"] } | null> {
  const captured = await extractCapturedAt(file);
  if (!captured || captured.getTime() > Date.now()) return null;
  const fromExif = file.type.startsWith("image/") && Math.abs(captured.getTime() - file.lastModified) > 60_000;
  return { date: captured, source: fromExif ? "exif" : "file" };
}

const dateToast = (date: Date, source: AutoDateInfo["source"]) => {
  const when = format(date, "PPP 'at' h:mm a");
  return source === "exif" ? `Date & time set from photo: ${when}` : `Date set from file: ${when}`;
};

const toPhotoItems = (files: File[]): PhotoItem[] =>
  files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));

/** The photos in upload order: the highlighted one first. */
export function orderPhotos(photos: PhotoItem[], highlightId: string | null): PhotoItem[] {
  const highlighted = photos.find((p) => p.id === highlightId);
  if (!highlighted) return photos;
  return [highlighted, ...photos.filter((p) => p.id !== highlightId)];
}

/** Picks which of the dropped files fit, telling the user when some (or all) are left out. */
function acceptFiles(incoming: File[], room: number): File[] {
  if (room <= 0) {
    toast.error(`You can add up to ${MAX_PHOTOS} photos per memory.`);
    return [];
  }
  if (incoming.length > room) toast.message(`Only the first ${room} photo(s) were added (max ${MAX_PHOTOS}).`);
  return incoming.slice(0, room);
}

/** The dropped files that fit, or none when nothing was dropped. */
const acceptIncoming = (fileList: FileList | File[] | null, room: number): File[] => {
  const incoming = fileList ? Array.from(fileList) : [];
  return incoming.length > 0 ? acceptFiles(incoming, room) : [];
};

/** Which photo is highlighted after adding: the existing choice, else the first photo overall. */
const highlightAfterAdd = (current: string | null, existing: PhotoItem[], added: PhotoItem[]) =>
  current ?? existing[0]?.id ?? added[0].id;

/** Which photo is highlighted after removing `removedId`: unchanged unless the highlight itself was removed. */
const highlightAfterRemove = (current: string | null, removedId: string, remaining: PhotoItem[]) =>
  current === removedId ? remaining[0]?.id ?? null : current;

const releasePreview = (photo?: PhotoItem) => photo && URL.revokeObjectURL(photo.preview);

/** The memory form's photos: the list, which one is the highlight, and the date read from the first photo. */
export function useMemoryPhotos(onCapturedDate: (date: Date) => void) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [autoDateInfo, setAutoDateInfo] = useState<AutoDateInfo | null>(null);

  // Auto-fill the date from the first newly-added photo if we don't have one yet.
  const fillDateFrom = async (file: File) => {
    const found = await capturedDateOf(file);
    if (!found) return;
    onCapturedDate(found.date);
    setAutoDateInfo({ source: found.source });
    toast.success(dateToast(found.date, found.source));
  };

  const addFiles = async (fileList: FileList | File[] | null) => {
    const accepted = acceptIncoming(fileList, MAX_PHOTOS - photos.length);
    if (accepted.length === 0) return;
    const added = toPhotoItems(accepted);
    setPhotos([...photos, ...added]);
    setHighlightId(highlightAfterAdd(highlightId, photos, added));
    if (!autoDateInfo) await fillDateFrom(accepted[0]);
  };

  const removePhoto = (id: string) => {
    releasePreview(photos.find((p) => p.id === id));
    const remaining = photos.filter((p) => p.id !== id);
    setPhotos(remaining);
    setHighlightId(highlightAfterRemove(highlightId, id, remaining));
    if (remaining.length === 0) setAutoDateInfo(null);
  };

  const clearPhotos = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setHighlightId(null);
    setAutoDateInfo(null);
  };

  return { photos, highlightId, setHighlightId, autoDateInfo, addFiles, removePhoto, clearPhotos };
}
