import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Memory } from "@/hooks/useMemories";
import { MAX_PHOTOS, photosOf, shiftHighlight, type NewPhoto } from "./memoryDetailUtils";

const toNewPhotos = (files: File[]): NewPhoto[] =>
  files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));

/** Photo state of the memory editor: kept URLs, queued uploads and the highlighted photo. */
export const useMemoryEditPhotos = (memory: Memory | null) => {
  // existing image URLs that are kept
  const [keptUrls, setKeptUrls] = useState<string[]>([]);
  // new local image uploads queued up for save
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  // 0..keptUrls.length-1 maps to kept URL; keptUrls.length+i maps to newPhotos[i]
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    if (!memory) return;
    setKeptUrls(photosOf(memory));
    setNewPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
    setHighlightIdx(0);
  }, [memory]);

  const addFiles = (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const room = MAX_PHOTOS - (keptUrls.length + newPhotos.length);
    if (room <= 0) {
      toast.error(`You can keep up to ${MAX_PHOTOS} photos per memory.`);
      return;
    }
    if (incoming.length > room) toast.message(`Only the first ${room} photo(s) were added (max ${MAX_PHOTOS}).`);
    setNewPhotos((prev) => [...prev, ...toNewPhotos(incoming.slice(0, room))]);
  };

  const removeKept = (idx: number) => {
    setKeptUrls((prev) => prev.filter((_, i) => i !== idx));
    setHighlightIdx((cur) => shiftHighlight(cur, idx));
  };

  const removeNew = (id: string) => {
    const idx = newPhotos.findIndex((p) => p.id === id);
    if (idx < 0) return;
    URL.revokeObjectURL(newPhotos[idx].preview);
    setNewPhotos(newPhotos.filter((p) => p.id !== id));
    setHighlightIdx((cur) => shiftHighlight(cur, keptUrls.length + idx));
  };

  /** After a successful save: the saved list becomes the kept list. */
  const settle = (savedUrls: string[]) => {
    setKeptUrls(savedUrls);
    newPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setNewPhotos([]);
    setHighlightIdx(0);
  };

  return { keptUrls, newPhotos, highlightIdx, setHighlightIdx, addFiles, removeKept, removeNew, settle };
};
