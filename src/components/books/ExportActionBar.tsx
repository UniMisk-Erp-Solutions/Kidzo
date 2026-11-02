import { Download, Eye, Link2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  count: number;
  busy: boolean;
  /** Plan still loading. */
  planLoading: boolean;
  canDownload: boolean;
  /** A preview/download has been generated, so it can be shared. */
  canShare: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onUpgrade: () => void;
  onShare: () => void;
}

/** Phones: Preview / Download / Share are always one tap away. */
export const ExportActionBar = (p: Props) => {
  const showUpgrade = !p.planLoading && !p.canDownload;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="px-3 pb-2.5 pt-2">
        <div className="mb-1.5 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{p.count}</span> {p.count === 1 ? "memory" : "memories"} included
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="warm" className="min-w-0 flex-1" onClick={p.onPreview} disabled={p.busy}>
            {p.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-w-0 flex-1"
            onClick={showUpgrade ? p.onUpgrade : p.onDownload}
            disabled={!showUpgrade && (p.busy || p.planLoading)}
          >
            {showUpgrade ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {showUpgrade ? "Upgrade" : "Download"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={p.onShare}
            disabled={p.busy || !p.canShare}
            aria-label="Share"
            title={p.canShare ? "Share" : "Generate a preview or download first to share"}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
