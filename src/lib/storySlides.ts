import { format } from "date-fns";
import type { Memory } from "@/lib/types/memory";

const MAX_SLIDES = 40;
const MAX_PHOTOS_PER_MEMORY = 6;

export type Slide = { key: string; src: string | null; title: string; date: string; story: string | null };

const photosOf = (m: Memory): string[] => {
  if (m.photo_urls?.length) return m.photo_urls.slice(0, MAX_PHOTOS_PER_MEMORY);
  return m.photo_url ? [m.photo_url] : [];
};

/** One slide per photo (text-only memories get a text slide), in the order given. */
export function buildSlides(memories: Memory[]): Slide[] {
  const out: Slide[] = [];
  for (const m of memories) {
    const base = { title: m.title, date: format(new Date(m.happened_at), "MMM d, yyyy"), story: m.story };
    const photos = photosOf(m);
    if (photos.length === 0) out.push({ key: `${m.id}-t`, src: null, ...base });
    else photos.forEach((src, i) => out.push({ key: `${m.id}-${i}`, src, ...base }));
  }
  return out.slice(0, MAX_SLIDES);
}
