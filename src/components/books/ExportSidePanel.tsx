import { Download, Eye, Link2, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  includedCount: number;
  busy: boolean;
  entLoading: boolean;
  canDownload: boolean;
  hasPdf: boolean;
  shareUrl: string | null;
  onGenerate: (mode: "preview" | "download") => void;
  onUpgrade: () => void;
  onCreateLink: () => void;
  onShareEmail: () => void;
}

const DownloadButton = ({ busy, entLoading, canDownload, onGenerate, onUpgrade }: Pick<Props, "busy" | "entLoading" | "canDownload" | "onGenerate" | "onUpgrade">) =>
  !entLoading && !canDownload ? (
    <Button variant="outline" onClick={onUpgrade}>
      <Lock className="h-4 w-4" /> Upgrade to download
    </Button>
  ) : (
    <Button variant="outline" onClick={() => onGenerate("download")} disabled={busy || entLoading}>
      <Download className="h-4 w-4" /> Download
    </Button>
  );

/** Right side (desktop): step 3 preview & generate, step 4 share. Phones use the sticky bottom bar. */
export const ExportSidePanel = (p: Props) => (
  <aside className="hidden space-y-4 md:sticky md:top-6 md:block md:self-start">
    <Card className="rounded-2xl p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        3. Preview & generate
      </h2>
      <p className="mb-4 text-sm text-foreground">
        <span className="font-semibold">{p.includedCount}</span> memor
        {p.includedCount === 1 ? "y" : "ies"} included.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="warm" onClick={() => p.onGenerate("preview")} disabled={p.busy}>
          {p.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Preview PDF
        </Button>
        <DownloadButton
          busy={p.busy}
          entLoading={p.entLoading}
          canDownload={p.canDownload}
          onGenerate={p.onGenerate}
          onUpgrade={p.onUpgrade}
        />
      </div>
    </Card>

    <Card className="rounded-2xl p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        4. Share
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Available after you generate a preview or download.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={p.onCreateLink} disabled={p.busy || !p.hasPdf}>
          <Link2 className="h-4 w-4" /> Create public link
        </Button>
        <Button variant="outline" onClick={p.onShareEmail} disabled={!p.shareUrl}>
          <Mail className="h-4 w-4" /> Share via email
        </Button>
      </div>
      {p.shareUrl && (
        <div className="mt-3 break-all rounded-md bg-muted/60 p-2 text-[11px] text-muted-foreground">
          {p.shareUrl}
        </div>
      )}
    </Card>
  </aside>
);
