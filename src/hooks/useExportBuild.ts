import { useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { useMemories } from "@/hooks/useMemories";
import { useScreenGuard } from "@/lib/screenGuard";
import type { LayoutStyle } from "@/lib/exportShareBook";
import { clearOpenRequest, startExport, useExportJob } from "@/lib/exportJobStore";
import { blobForChild, pickIncluded } from "@/lib/exportShareHelpers";

interface BuildChild {
  id: string;
  name: string;
  dob: string;
}

interface BuildOptions {
  child: BuildChild | null | undefined;
  navigate: NavigateFunction;
  canDownload: boolean;
  goUpgrade: () => void;
  years: number[];
  orderByYear: Record<number, string[]>;
  isSel: (id: string) => boolean;
  includedCount: number;
  coverOverrides: Record<string, string>;
  layout: LayoutStyle;
}

const PICK_ONE = "Pick at least one memory to include.";

/** Preview dialog state: opens once when a build finishes, and tracks whether the user is still on the page. */
const useExportPreview = (openRequested: boolean, lastBlob: Blob | null) => {
  const [open, setPreviewOpen] = useState(false);
  const previewOpen = open && !!lastBlob;
  const onPageRef = useRef(true);
  useEffect(() => {
    onPageRef.current = true;
    return () => {
      onPageRef.current = false;
    };
  }, []);
  // A build finished (here or while the user was away): open its preview once.
  useEffect(() => {
    if (openRequested && lastBlob) {
      setPreviewOpen(true);
      clearOpenRequest();
    }
  }, [openRequested, lastBlob]);
  // No plan may capture the PDF preview: blocks screenshots/recording in the Android app.
  useScreenGuard(previewOpen);
  return { previewOpen, setPreviewOpen, onPageRef };
};

/** Builds the PDF (preview or download) in the background job store and tracks the preview dialog. */
export const useExportBuild = (opts: BuildOptions) => {
  const { child, navigate, canDownload, goUpgrade, years, orderByYear, isSel, includedCount, coverOverrides, layout } = opts;
  const allMemories = useMemories(child?.id, { enabled: false }); // only fetched when building the book
  const job = useExportJob();
  const lastBlob = blobForChild(job, child?.id);
  const lastFilename = job.filename;
  const { previewOpen, setPreviewOpen, onPageRef } = useExportPreview(job.openRequested, lastBlob);

  /** Every selected memory across ALL pages (fetched from the server), year by year in the user's order. */
  const collectIncluded = async () => {
    const all = (await allMemories.refetch()).data ?? [];
    return pickIncluded(all, years, orderByYear, isSel);
  };

  const generate = async (mode: "preview" | "download") => {
    if (!child) return;
    if (mode === "download" && !canDownload) {
      toast.error("Upgrade to download", { action: { label: "See plans", onClick: goUpgrade } });
      return;
    }
    if (includedCount <= 0) {
      toast.error(PICK_ONE);
      return;
    }
    const includedMemories = await collectIncluded();
    if (includedMemories.length === 0) {
      toast.error(PICK_ONE);
      return;
    }
    void startExport({
      childId: child.id,
      childName: child.name,
      childDob: new Date(child.dob),
      memories: includedMemories,
      coverOverrides,
      layout,
      mode,
      watermark: !canDownload,
      isOnPage: () => onPageRef.current,
      goToExport: () => navigate("/export"),
    });
  };

  const downloadCurrent = () => {
    if (!lastBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(lastBlob);
    a.download = lastFilename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return {
    jobBusy: job.busy,
    lastBlob,
    lastFilename,
    previewOpen,
    closePreview: () => setPreviewOpen(false),
    generate,
    downloadCurrent,
  };
};
