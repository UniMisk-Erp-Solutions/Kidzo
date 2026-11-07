import { Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScreenshotShield } from "@/components/books/ScreenshotShield";
import { PdfPagesView } from "@/components/books/PdfPagesView";

interface Props {
  open: boolean;
  filename: string;
  blob: Blob | null;
  /** The plan is known and may download the full PDF. */
  canDownload: boolean;
  /** The plan is known and can't download: the preview ends with a locked page. */
  locked: boolean;
  onClose: () => void;
  onDownload: () => void;
  onUpgrade: () => void;
}

/** The PDF preview (pages drawn to canvases, with a watermark) and its Download action. */
export const ExportPreviewDialog = (p: Props) => (
  <Dialog open={p.open} onOpenChange={(o) => !o && p.onClose()}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Preview — {p.filename}</DialogTitle>
      </DialogHeader>
      {p.blob && (
        <div className="h-[70vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
          <ScreenshotShield>
            <PdfPagesView blob={p.blob} />
          </ScreenshotShield>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={p.canDownload ? p.onDownload : p.onUpgrade}>
          {p.canDownload ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {p.canDownload ? "Download" : "Upgrade to download"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
