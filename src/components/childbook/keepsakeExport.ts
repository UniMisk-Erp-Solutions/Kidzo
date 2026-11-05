import { toast } from "sonner";
import { exportKeepsakePdf } from "@/components/childbook/exportKeepsakePdf";
import type { Memory } from "@/hooks/useMemories";
import type { Achievement } from "@/hooks/useAchievements";

export interface KeepsakeRequest {
  childName: string;
  memories: Memory[];
  achievements: Achievement[];
  fromYear: number;
  toYear: number;
  includeAchievements: boolean;
  /** Earliest / latest year available, only used to word the "nothing to export" hint. */
  minYear: number;
  maxYear: number;
}

type ExportReport = Awaited<ReturnType<typeof exportKeepsakePdf>>;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const inYears = (date: string, from: number, to: number) => {
  const y = new Date(date).getFullYear();
  return y >= from && y <= to;
};

/** Memories and achievements that fall inside the chosen (order-insensitive) year range. */
export const selectInRange = (req: KeepsakeRequest) => {
  const from = Math.min(req.fromYear, req.toYear);
  const to = Math.max(req.fromYear, req.toYear);
  return {
    from,
    to,
    memories: req.memories.filter((m) => inYears(m.happened_at, from, to)),
    achievements: req.includeAchievements ? req.achievements.filter((a) => inYears(a.achievement_date, from, to)) : [],
  };
};

const reportSuccess = (toastId: string | number, report: ExportReport) => {
  if (report.failedImages.length > 0) {
    // Partial success — surface which photos couldn't be embedded.
    const failed = report.failedImages;
    const preview = failed.slice(0, 3).join("\n");
    const more = failed.length > 3 ? `\n…and ${failed.length - 3} more` : "";
    toast.warning(`Saved with ${failed.length} missing photo${plural(failed.length, "", "s")}`, {
      id: toastId,
      description: `${report.imagesLoaded}/${report.imagesAttempted} photos embedded.\n${preview}${more}`,
      duration: 9000,
    });
    return;
  }
  const photos = report.imagesLoaded ? ` · ${report.imagesLoaded} photo${plural(report.imagesLoaded, "", "s")}` : "";
  toast.success("Keepsake saved 💛", {
    id: toastId,
    description: `${report.totalItems} item${plural(report.totalItems, "", "s")} included${photos}.`,
  });
};

const reportFailure = (toastId: string | number, error: unknown, picked: ReturnType<typeof selectInRange>) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("[keepsake] export failed", {
    error,
    memoryCount: picked.memories.length,
    achievementCount: picked.achievements.length,
    photoUrls: [
      ...picked.memories.map((m) => m.photo_url).filter(Boolean),
      ...picked.achievements.map((a) => a.photo_url).filter(Boolean),
    ],
    fromYear: picked.from,
    toYear: picked.to,
  });
  const memCount = picked.memories.length;
  const achCount = picked.achievements.length;
  toast.error("Couldn't generate PDF", {
    id: toastId,
    description: `${msg}\n\nTried ${memCount} ${plural(memCount, "memory", "memories")} + ${achCount} ${plural(
      achCount,
      "achievement",
      "achievements",
    )}. Open the browser console for full details.`,
    duration: 12000,
  });
};

/** Runs the export with progress/result toasts. Returns true when a PDF was produced (so the dialog can close). */
export const runKeepsakeExport = async (req: KeepsakeRequest): Promise<boolean> => {
  if (req.memories.length === 0 && req.achievements.length === 0) {
    toast.error("Nothing to export yet — add a memory first.");
    return false;
  }
  const picked = selectInRange(req);
  if (picked.memories.length + picked.achievements.length === 0) {
    toast.error(`Nothing in ${picked.from}–${picked.to} to export`, {
      description: `Try widening the year range — your memories range from ${req.minYear} to ${req.maxYear}.`,
    });
    return false;
  }
  const toastId = toast.loading("Crafting your keepsake…");
  const startedAt = performance.now();
  try {
    const report = await exportKeepsakePdf({
      childName: req.childName,
      memories: req.memories,
      achievements: req.achievements,
      fromYear: picked.from,
      toYear: picked.to,
      includeAchievements: req.includeAchievements,
    });
    console.info("[keepsake] export complete", { ms: Math.round(performance.now() - startedAt), ...report });
    reportSuccess(toastId, report);
    return true;
  } catch (e) {
    reportFailure(toastId, e, picked);
    return false;
  }
};
