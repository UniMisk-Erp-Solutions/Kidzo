import { Download, Link2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FREE_PREVIEW_PAGES } from "@/lib/bookAccess";
import { ScreenshotShield } from "@/components/books/ScreenshotShield";
import { PdfPagesView } from "@/components/books/PdfPagesView";
import { LockedBookPage } from "@/components/books/LockedBookPage";

const LOCKED_COLORS = { primary: "#fcfaf7", accent: "#a8c5ba", gold: "#e8c98a", coral: "#e9b4a0", mint: "#a8c5ba" };

interface Props {
  open: boolean;
  filename: string;
  blob: Blob | null;
  /** The plan is known and may download the full PDF. */
  canDownload: boolean;
  /** The plan is known and can't download: the preview ends with a locked page. */
  locked: boolean;
  busy: boolean;
  onClose: () => void;
  onDownload: () => void;
  onUpgrade: () => void;
  onShare: () => void;
}

/** The PDF preview (pages drawn to canvases, with a watermark) and its Download / Share actions. */
export const ExportPreviewDialog = (p: Props) => (
  <Dialog open={p.open} onOpenChange={(o) => !o && p.onClose()}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Preview — {p.filename}</DialogTitle>
      </DialogHeader>
      {p.blob && (
        <div className="h-[70vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
          <ScreenshotShield>
            <PdfPagesView blob={p.blob}>
              {p.locked && (
                <div className="mx-auto aspect-[3/4] w-full max-w-[560px] overflow-hidden rounded-md border border-border">
                  <LockedBookPage colors={LOCKED_COLORS} pageNumber={FREE_PREVIEW_PAGES + 1} />
                </div>
              )}
            </PdfPagesView>
          </ScreenshotShield>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={p.canDownload ? p.onDownload : p.onUpgrade}>
          {p.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {p.canDownload ? "Download" : "Upgrade to download"}
        </Button>
        <Button variant="warm" onClick={p.onShare} disabled={p.busy}>
          <Link2 className="h-4 w-4" /> Share link
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
