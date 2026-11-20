import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ExportPreviewDialog } from "@/components/books/ExportPreviewDialog";
import { ExportActionBar } from "@/components/books/ExportActionBar";
import { ExportLayoutPicker } from "@/components/books/ExportLayoutPicker";
import { ExportSelectionCard } from "@/components/books/ExportSelectionCard";
import { ExportSidePanel } from "@/components/books/ExportSidePanel";
import { useExportPages } from "@/hooks/useExportPages";
import { useExportSelection } from "@/hooks/useExportSelection";
import { useExportBuild } from "@/hooks/useExportBuild";
import { useShareLink } from "@/hooks/useShareLink";
import type { LayoutStyle } from "@/lib/exportShareBook";

const ExportShare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { can, loading: entLoading } = useEntitlements();
  const canDownload = can("pdf_export");
  const goUpgrade = () => navigate("/pricing-plans");

  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<LayoutStyle>("scrapbook-kraft");

  const pages = useExportPages(child?.id);
  const selection = useExportSelection(pages.totalMemories);
  const { selectedAmong } = selection;
  const selectedOnPage = useMemo(() => selectedAmong(pages.orderedPage), [selectedAmong, pages.orderedPage]);

  const build = useExportBuild({
    child,
    navigate,
    canDownload,
    goUpgrade,
    years: pages.years,
    orderByYear: pages.orderByYear,
    isSel: selection.isSel,
    includedCount: selection.includedCount,
    coverOverrides,
    layout,
  });
  const share = useShareLink(child, user?.id, build.lastBlob);
  const busy = build.jobBusy || share.sharing;

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-deep" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-28">
      <TopBar childName={child.name} />
      <main className="mx-auto max-w-3xl px-4 py-6 md:max-w-6xl md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Export & share</h1>
            <p className="text-sm text-muted-foreground">
              Build a printable photo book of {child.name}'s memories and share it with family.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr),320px]">
          <div className="min-w-0 space-y-6">
            <ExportLayoutPicker layout={layout} onChange={setLayout} />
            <ExportSelectionCard
              years={pages.years}
              yearGroups={pages.yearGroups}
              openYears={pages.openYears}
              selected={selectedOnPage}
              coverOverrides={coverOverrides}
              pageLoading={pages.pageLoading}
              safePage={pages.safePage}
              pageCount={pages.pageCount}
              pageYears={pages.pageYears}
              onPage={pages.setPage}
              onToggleYear={pages.toggleYear}
              onSetAll={selection.setSel}
              onToggleSelected={(id) => selection.setSel([id], !selection.isSel(id))}
              onCover={(id, url) => setCoverOverrides({ ...coverOverrides, [id]: url })}
              onSwap={pages.swap}
              onSelectAll={selection.selectAll}
              onSelectNone={selection.selectNone}
            />
          </div>

          <ExportSidePanel
            includedCount={selection.includedCount}
            busy={busy}
            entLoading={entLoading}
            canDownload={canDownload}
            hasPdf={!!build.lastBlob}
            shareUrl={share.shareUrl}
            onGenerate={build.generate}
            onUpgrade={goUpgrade}
            onCreateLink={share.createShareLink}
            onShareEmail={share.shareViaEmail}
          />
        </div>
      </main>

      <ExportActionBar
        count={selection.includedCount}
        busy={busy}
        planLoading={entLoading}
        canDownload={canDownload}
        canShare={!!build.lastBlob}
        onPreview={() => build.generate("preview")}
        onDownload={() => build.generate("download")}
        onUpgrade={goUpgrade}
        onShare={share.shareFromBar}
      />

      <ExportPreviewDialog
        open={build.previewOpen}
        filename={build.lastFilename}
        blob={build.lastBlob}
        canDownload={canDownload}
        locked={!entLoading && !canDownload}
        onClose={build.closePreview}
        onDownload={build.downloadCurrent}
        onUpgrade={goUpgrade}
      />

      <BottomNav />
    </div>
  );
};

export default ExportShare;
