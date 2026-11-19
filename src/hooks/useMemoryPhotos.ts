import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { extractCapturedAt } from "@/lib/photoMeta";
import { isMemoryVideo, MAX_MEMORY_MEDIA, memoryPhotoSource, prepareMemoryPhoto, prepareMemoryVideo, type MemoryMediaFile } from "@/lib/memoryMedia";

export type MediaItem = MemoryMediaFile & { id: string; preview: string };

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

const toMediaItems = (files: MemoryMediaFile[]): MediaItem[] =>
  files.map((entry) => ({ ...entry, id: crypto.randomUUID(), preview: URL.createObjectURL(entry.file) }));

/** The media in display order, with the highlighted item first. */
export function orderMedia(photos: MediaItem[], highlightId: string | null): MediaItem[] {
  const highlighted = photos.find((p) => p.id === highlightId);
  if (!highlighted) return photos;
  return [highlighted, ...photos.filter((p) => p.id !== highlightId)];
}

/** Picks which of the dropped files fit, telling the user when some (or all) are left out. */
function acceptFiles(incoming: File[], room: number): File[] {
  if (room <= 0) {
    toast.error(`You can add up to ${MAX_MEMORY_MEDIA} photos and videos per memory.`);
    return [];
  }
  if (incoming.length > room) toast.message(`Only the first ${room} items were added (max ${MAX_MEMORY_MEDIA}).`);
  return incoming.slice(0, room);
}

/** The dropped files that fit, or none when nothing was dropped. */
const acceptIncoming = (fileList: FileList | File[] | null, room: number): File[] => {
  const incoming = fileList ? Array.from(fileList) : [];
  return incoming.length > 0 ? acceptFiles(incoming, room) : [];
};

/** Which photo is highlighted after removing `removedId`: unchanged unless the highlight itself was removed. */
const highlightAfterRemove = (current: string | null, removedId: string, remaining: MediaItem[]) =>
  current === removedId ? remaining[0]?.id ?? null : current;

const releasePreview = (photo?: MediaItem) => photo && URL.revokeObjectURL(photo.preview);

/** Reads one dropped file into a photo or video ready to upload. */
async function convertFile(file: File): Promise<{ converted: MemoryMediaFile; source: File }> {
  const kind = isMemoryVideo(file) ? "video" : "photo";
  const source = kind === "video" ? prepareMemoryVideo(file) : memoryPhotoSource(file);
  return { converted: { kind, file: kind === "video" ? source : await prepareMemoryPhoto(source) }, source };
}

/** Converts each accepted file, toasting the ones that cannot be read; also returns the first readable source. */
async function convertAll(accepted: File[]): Promise<{ converted: MemoryMediaFile[]; firstSource?: File }> {
  const converted: MemoryMediaFile[] = [];
  let firstSource: File | undefined;
  for (const file of accepted) {
    try {
      const result = await convertFile(file);
      converted.push(result.converted);
      firstSource ??= result.source;
    } catch (error) {
      toast.error(error instanceof Error ? `${file.name}: ${error.message}` : `Could not read ${file.name}.`);
    }
  }
  return { converted, firstSource };
}

/** Tracks the object URLs handed out for previews so they are all released on unmount, and whether the form is still mounted. */
function usePreviewRegistry() {
  const live = useRef(true);
  const previews = useRef(new Set<string>());
  useEffect(() => {
    live.current = true;
    const urls = previews.current;
    return () => {
      live.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);
  return { live, previews };
}

/** Auto-fills the date from the first newly-added photo if we don't have one yet. */
function useAutoDate(onCapturedDate: (date: Date) => void) {
  const [autoDateInfo, setAutoDateInfo] = useState<AutoDateInfo | null>(null);
  const fillDateFrom = async (file: File) => {
    const found = await capturedDateOf(file);
    if (!found) return;
    onCapturedDate(found.date);
    setAutoDateInfo({ source: found.source });
    toast.success(dateToast(found.date, found.source));
  };
  return { autoDateInfo, setAutoDateInfo, fillDateFrom };
}

/** The memory form's photos: the list, which one is the highlight, and the date read from the first photo. */
export function useMemoryPhotos(onCapturedDate: (date: Date) => void) {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [preparing, setPreparing] = useState(false);
  const preparingRef = useRef(false);
  const { live, previews } = usePreviewRegistry();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { autoDateInfo, setAutoDateInfo, fillDateFrom } = useAutoDate(onCapturedDate);

  const addFiles = async (fileList: FileList | File[] | null) => {
    if (preparingRef.current) return;
    const accepted = acceptIncoming(fileList, MAX_MEMORY_MEDIA - photos.length);
    if (accepted.length === 0) return;
    preparingRef.current = true;
    setPreparing(true);
    try {
      const { converted, firstSource } = await convertAll(accepted);
      if (!firstSource || !live.current) return;
      const added = toMediaItems(converted);
      added.forEach(({ preview }) => previews.current.add(preview));
      setPhotos((current) => [...current, ...added]);
      setHighlightId((current) => current ?? added[0].id);
      if (!autoDateInfo) await fillDateFrom(firstSource);
    } finally {
      preparingRef.current = false;
      setPreparing(false);
    }
  };

  const removePhoto = (id: string) => {
    const removed = photos.find((photo) => photo.id === id);
    if (removed) {
      releasePreview(removed);
      previews.current.delete(removed.preview);
    }
    const remaining = photos.filter((p) => p.id !== id);
    setPhotos(remaining);
    setHighlightId(highlightAfterRemove(highlightId, id, remaining));
    if (remaining.length === 0) setAutoDateInfo(null);
  };

  const clearPhotos = () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
    previews.current.clear();
    setPhotos([]);
    setHighlightId(null);
    setAutoDateInfo(null);
  };

  return { photos, highlightId, setHighlightId, autoDateInfo, addFiles, removePhoto, clearPhotos, preparing };
}
