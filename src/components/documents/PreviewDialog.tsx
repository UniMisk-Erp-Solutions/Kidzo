import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ChildDocument } from "@/hooks/useDocuments";
import type { PreviewState } from "./useDocumentsPage";

interface BodyProps {
  preview: PreviewState;
  failed: boolean;
  onImageError: () => void;
}

const PreviewBody = ({ preview, failed, onImageError }: BodyProps) => {
  if (preview.isPdf) return <iframe src={preview.url} title={preview.doc.title} className="h-full w-full" />;
  if (failed) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[14px] text-muted-foreground">
        This image format can't be shown here. Use Download to open it.
      </div>
    );
  }
  return <img src={preview.url} alt={preview.doc.title} onError={onImageError} className="mx-auto max-h-full max-w-full object-contain" />;
};

const describe = (preview: PreviewState | null) => {
  if (!preview) return "Added ";
  const notes = preview.doc.notes ? ` · ${preview.doc.notes}` : "";
  return `Added ${format(new Date(preview.doc.created_at), "MMM d, yyyy")}${notes}`;
};

interface Props {
  preview: PreviewState | null;
  failed: boolean;
  onImageError: () => void;
  onClose: () => void;
  onDownload: (doc: ChildDocument) => void;
}

/** In-page document preview — stays on the Documents page. */
export const PreviewDialog = ({ preview, failed, onImageError, onClose, onDownload }: Props) => (
  <Dialog open={!!preview} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-3xl rounded-3xl">
      <DialogHeader>
        <DialogTitle className="truncate pr-6">{preview?.doc.title}</DialogTitle>
        <DialogDescription>{describe(preview)}</DialogDescription>
      </DialogHeader>
      {preview && (
        <div className="h-[65vh] overflow-auto rounded-xl border border-border bg-muted/40">
          <PreviewBody preview={preview} failed={failed} onImageError={onImageError} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        {preview && (
          <Button variant="outline" onClick={() => onDownload(preview.doc)}>
            <Download className="h-4 w-4" /> Download
          </Button>
        )}
        <Button variant="warm" onClick={onClose}>
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
