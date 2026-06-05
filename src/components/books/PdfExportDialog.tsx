import { CheckCircle2, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { PdfProgress } from "@/lib/exportBookPdf";

interface Props {
  open: boolean;
  progress: PdfProgress | null;
  error: string | null;
  onClose: () => void;
}

const PHASE_LABEL: Record<PdfProgress["phase"], string> = {
  preparing: "Preparing your book…",
  fonts: "Loading fonts…",
  rendering: "Rendering page",
  snapshot: "Capturing page",
  writing: "Saving PDF…",
  done: "Done!",
};

export const PdfExportDialog = ({ open, progress, error, onClose }: Props) => {
  const total = progress?.total ?? 0;
  const current = progress?.current ?? 0;
  const phase = progress?.phase ?? "preparing";
  // Each page contributes ~50% render + 50% snapshot to the bar.
  const phaseWeight = phase === "snapshot" || phase === "writing" || phase === "done" ? 1 : 0.5;
  const completed = phase === "done"
    ? total
    : Math.max(0, current - 1) + (current > 0 ? phaseWeight : 0);
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : (phase === "preparing" ? 5 : 0);

  const isError = !!error;
  const isDone = phase === "done" && !isError;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Don't allow closing while in progress
        if (!v && (isDone || isError)) onClose();
      }}
    >
      <DialogContent
        className="max-w-md rounded-2xl"
        onPointerDownOutside={(e) => {
          if (!isDone && !isError) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!isDone && !isError) e.preventDefault();
        }}
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          {/* Icon */}
          <div className="relative">
            {isError ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <X className="h-7 w-7 text-destructive" />
              </div>
            ) : isDone ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                {phase === "snapshot" || phase === "rendering" ? (
                  <ImageIcon className="h-7 w-7 text-primary-deep" />
                ) : (
                  <FileText className="h-7 w-7 text-primary-deep" />
                )}
                <Loader2 className="absolute h-14 w-14 animate-spin text-primary-deep/40" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-[18px] font-bold leading-tight">
              {isError ? "Export failed" : isDone ? "PDF ready!" : "Generating your scrapbook…"}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isError
                ? error
                : isDone
                ? "Your download should start automatically."
                : phase === "rendering" || phase === "snapshot"
                ? `${PHASE_LABEL[phase]} ${current} of ${total}`
                : PHASE_LABEL[phase]}
            </p>
          </div>

          {/* Progress bar */}
          {!isError && (
            <div className="w-full">
              <Progress value={pct} className="h-2" />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{pct}%</span>
                {total > 0 && (
                  <span>
                    {Math.min(current, total)} / {total} pages
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tip */}
          {!isError && !isDone && (
            <p className="text-[11px] italic text-muted-foreground">
              Keep this tab open — bigger books with lots of photos take a moment.
            </p>
          )}

          {/* Close button when done or errored */}
          {(isDone || isError) && (
            <Button variant={isError ? "outline" : "default"} onClick={onClose} className="mt-1 w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
