import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { exportShareBook, type LayoutStyle } from "@/lib/exportShareBook";
import type { Memory } from "@/hooks/useMemories";

/**
 * Lives outside React so a photo-book build keeps running (and its result is kept) when the user
 * leaves the Export page. The "Preview ready" toast takes them back and opens the preview.
 */
export type ExportJobState = {
  childId: string | null;
  busy: boolean;
  blob: Blob | null;
  filename: string;
  /** Set when a build finishes; the Export page opens the preview once (now or when revisited) and clears it. */
  openRequested: boolean;
};

let state: ExportJobState = { childId: null, busy: false, blob: null, filename: "keepsake.pdf", openRequested: false };
const listeners = new Set<() => void>();

const set = (patch: Partial<ExportJobState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const useExportJob = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );

export const clearOpenRequest = () => set({ openRequested: false });

export type StartExportArgs = {
  childId: string;
  childName: string;
  childDob: Date;
  memories: Memory[];
  coverOverrides: Record<string, string>;
  layout: LayoutStyle;
  mode: "preview" | "download";
  maxPages?: number;
  /** True while the Export page is on screen. */
  isOnPage: () => boolean;
  goToExport: () => void;
};

export async function startExport(a: StartExportArgs) {
  if (state.busy) return;
  set({ busy: true });
  const t = toast.loading("Building your photo book…", {
    description: "You can leave this page — we'll keep building.",
  });
  try {
    const { blob, filename, report } = await exportShareBook({
      childName: a.childName,
      childDob: a.childDob,
      memories: a.memories,
      coverOverrides: a.coverOverrides,
      layout: a.layout,
      download: a.mode === "download",
      maxPages: a.maxPages,
    });
    const away = !a.isOnPage();
    set({ childId: a.childId, blob, filename, openRequested: true });
    toast.success(a.mode === "download" ? "Saved 💛" : "Preview ready", {
      id: t,
      description: report.failedImages.length
        ? `${report.imagesLoaded}/${report.imagesAttempted} photos embedded.`
        : undefined,
      duration: away ? 15000 : undefined,
      action: away ? { label: "View preview", onClick: a.goToExport } : undefined,
    });
  } catch (e) {
    toast.error("Couldn't generate PDF", {
      id: t,
      description: e instanceof Error ? e.message : String(e),
    });
  } finally {
    set({ busy: false });
  }
}
