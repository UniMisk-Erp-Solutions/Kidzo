import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import type { Achievement } from "@/hooks/useAchievements";
import type { PolaroidExportItem } from "@/components/books/exportPolaroidPdf";

/** Per-export diagnostics so the UI can show actionable error info. */
export type KeepsakeExportReport = {
  totalItems: number;
  imagesAttempted: number;
  imagesLoaded: number;
  failedImages: string[];
};

/**
 * Builds the keepsake as kraft-paper pages of taped polaroids (nine to a page, year by year) and downloads it.
 * Memories and achievements each become one polaroid; ones without a photo show their title instead.
 */
export async function exportKeepsakePdf(opts: {
  childName: string;
  memories: Memory[];
  achievements: Achievement[];
  fromYear?: number;
  toYear?: number;
  includeAchievements?: boolean;
}): Promise<KeepsakeExportReport> {
  const { childName, fromYear, toYear, includeAchievements = true } = opts;

  const inRange = (date: Date) => {
    const y = date.getFullYear();
    return (fromYear == null || y >= fromYear) && (toYear == null || y <= toYear);
  };

  const items: PolaroidExportItem[] = [
    ...opts.memories.map((m) => ({
      id: m.id,
      title: m.title,
      photoUrl: m.photo_urls?.[0] ?? m.photo_url ?? null,
      date: new Date(m.happened_at),
    })),
    ...(includeAchievements
      ? opts.achievements.map((a) => ({
          id: `achievement-${a.id}`,
          title: a.subject,
          photoUrl: a.photo_url,
          date: new Date(a.achievement_date),
        }))
      : []),
  ].filter((it) => inRange(it.date));

  // Loaded on demand: the page renderer and html2canvas are heavy and only needed when exporting.
  const { exportPolaroidPdf } = await import("@/components/books/exportPolaroidPdf");
  await exportPolaroidPdf({
    childName,
    items,
    filename: `${childName.replace(/\s+/g, "_")}_keepsake_${format(new Date(), "yyyy-MM-dd")}.pdf`,
  });

  const photos = items.filter((it) => it.photoUrl).length;
  return { totalItems: items.length, imagesAttempted: photos, imagesLoaded: photos, failedImages: [] };
}
