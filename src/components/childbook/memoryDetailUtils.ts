import type { Memory } from "@/hooks/useMemories";

export const MAX_PHOTOS = 10;

export const CATEGORIES = ["Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];

export const tagStyles: Record<string, string> = {
  Milestone: "bg-accent/40 text-accent-foreground",
  Celebration: "bg-secondary/30 text-secondary",
  Everyday: "bg-primary/30 text-primary-deep",
  Cozy: "bg-muted text-muted-foreground",
  Adventure: "bg-success/25 text-success",
  Family: "bg-warning/25 text-warning-foreground",
};

export type NewPhoto = { id: string; file: File; preview: string };

/** Adds comma-separated entries to the list, skipping case-insensitive duplicates. */
export const mergeChips = (list: string[], value: string): string[] => {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return list;
  const next = [...list];
  const seen = new Set(next.map((x) => x.toLowerCase()));
  for (const p of parts) {
    if (seen.has(p.toLowerCase())) continue;
    next.push(p);
    seen.add(p.toLowerCase());
  }
  return next;
};

/** Photos of a memory (prefer photo_urls, fall back to photo_url). */
export const photosOf = (memory: Memory | null): string[] => {
  if (memory?.photo_urls && memory.photo_urls.length > 0) return memory.photo_urls;
  return memory?.photo_url ? [memory.photo_url] : [];
};

/** Where the highlighted index points after the photo at `removed` is deleted. */
export const shiftHighlight = (current: number, removed: number): number => {
  if (current === removed) return 0;
  return current > removed ? current - 1 : current;
};
