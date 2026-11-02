import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  Link2,
  Loader2,
  Lock,
  Mail,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useMemories, type Memory } from "@/hooks/useMemories";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useScreenGuard } from "@/lib/screenGuard";
import { FREE_PREVIEW_PAGES } from "@/lib/bookAccess";
import { ExportPreviewDialog } from "@/components/books/ExportPreviewDialog";
import { ExportYearGroup } from "@/components/books/ExportYearGroup";
import { ExportActionBar } from "@/components/books/ExportActionBar";
import { useYearGroups } from "@/hooks/useYearGroups";
import { shareOrEmail } from "@/lib/shareLink";
import { supabase } from "@/integrations/supabase/client";
import type { LayoutStyle } from "@/lib/exportShareBook";
import { clearOpenRequest, startExport, useExportJob } from "@/lib/exportJobStore";
import { format } from "date-fns";

const LAYOUTS: { id: LayoutStyle; title: string; desc: string; swatches?: string[] }[] = [
  { id: "scrapbook-kraft", title: "Burgundy Diary", desc: "Kraft paper, torn burgundy panels & a vintage camera — 4 photos a page.", swatches: ["#C8A57A", "#7A1F2B", "#E0B24A"] },
  { id: "scrapbook-film", title: "Film Roll", desc: "A big hero photo with a film roll across the page and marker scribbles.", swatches: ["#E4DCCB", "#16161a", "#F0C84A"] },
  { id: "scrapbook-news", title: "Newsprint Collage", desc: "Taped, tilted photos over vintage newspaper with cut-out headlines.", swatches: ["#E8E1D1", "#D4553F", "#F3C94C"] },
  { id: "classic", title: "Classic coffee-table", desc: "Bold hero photo with caption — warm and traditional." },
  { id: "minimal", title: "Minimal", desc: "Lots of whitespace, centered photo and title." },
  { id: "timeline", title: "Timeline-first", desc: "Dark date rail down the left with story alongside." },
];

/** The finished PDF, only if it was built for this child. */
const blobForChild = (job: { childId: string | null; blob: Blob | null }, childId?: string) =>
  childId && job.childId === childId ? job.blob : null;

const ExportShare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { data: memories = [] } = useMemories(child?.id);
  const { can, loading: entLoading } = useEntitlements();
  const canDownload = can("pdf_export");
  const goUpgrade = () => navigate("/pricing-plans");

  const [order, setOrder] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<LayoutStyle>("scrapbook-kraft");
  const job = useExportJob();
  const [sharing, setSharing] = useState(false);
  const busy = job.busy || sharing;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const lastBlob = blobForChild(job, child?.id);
  const lastFilename = job.filename;
  const previewUrl = previewOpen && lastBlob ? "open" : null;
  const onPageRef = useRef(true);
  useEffect(() => {
    onPageRef.current = true;
    return () => {
      onPageRef.current = false;
    };
  }, []);
  // A build finished (here or while the user was away): open its preview once.
  useEffect(() => {
    if (job.openRequested && lastBlob) {
      setPreviewOpen(true);
      clearOpenRequest();
    }
  }, [job.openRequested, lastBlob]);
  // No plan may capture the PDF preview: blocks screenshots/recording in the Android app.
  useScreenGuard(!!previewUrl);

  // Seed selection/order from memories on first load
  useEffect(() => {
    if (memories.length && order.length === 0) {
      setOrder(memories.map((m) => m.id));
      setSelected(new Set(memories.map((m) => m.id)));
    }
  }, [memories, order.length]);

  const byId = useMemo(() => {
    const map = new Map<string, Memory>();
    for (const m of memories) map.set(m.id, m);
    return map;
  }, [memories]);

  const ordered = useMemo(
    () => order.map((id) => byId.get(id)).filter((m): m is Memory => !!m),
    [order, byId],
  );
  const includedMemories = useMemo(
    () => ordered.filter((m) => selected.has(m.id)),
    [ordered, selected],
  );

  // Swap two memories' positions in the global order (used to reorder within a year).
  const swap = (a: number, b: number | undefined) => {
    if (b === undefined || b < 0 || b >= order.length) return;
    const next = [...order];
    [next[a], next[b]] = [next[b], next[a]];
    setOrder(next);
  };

  const { yearGroups, openYears, toggleYear } = useYearGroups(ordered);

  const setYearSelected = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    setSelected(next);
  };

  const toggleSelected = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(memories.map((m) => m.id)));
  const selectNone = () => setSelected(new Set());

  const generate = async (mode: "preview" | "download") => {
    if (!child) return;
    if (mode === "download" && !canDownload) {
      toast.error("Upgrade to download", { action: { label: "See plans", onClick: goUpgrade } });
      return;
    }
    if (includedMemories.length === 0) {
      toast.error("Pick at least one memory to include.");
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
      maxPages: canDownload ? undefined : FREE_PREVIEW_PAGES,
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

  const createShareLink = async (): Promise<string | null> => {
    if (!lastBlob || !user || !child) {
      toast.error("Generate the PDF first.");
      return null;
    }
    setSharing(true);
    const t = toast.loading("Uploading your photo book…");
    try {
      const path = `${user.id}/${child.id}-${Date.now()}-${lastFilename}`;
      const { error } = await supabase.storage
        .from("shared-keepsakes")
        .upload(path, lastBlob, { contentType: "application/pdf", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("shared-keepsakes").getPublicUrl(path);
      setShareUrl(data.publicUrl);
      await navigator.clipboard.writeText(data.publicUrl).catch(() => {});
      toast.success("Link ready & copied to clipboard 🔗", { id: t });
      return data.publicUrl;
    } catch (e) {
      toast.error("Couldn't create share link", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
      return null;
    } finally {
      setSharing(false);
    }
  };

  // Phone bottom bar: make the link if needed, then hand it to the OS share sheet (email fallback).
  const shareFromBar = async () => {
    const url = shareUrl ?? (await createShareLink());
    if (url) await shareOrEmail(`${child?.name ?? "Our"} keepsake photo book`, url);
  };

  const shareViaEmail = () => {
    if (!shareUrl) {
      toast.error("Create a share link first.");
      return;
    }
    const subject = encodeURIComponent(`${child?.name ?? "Our"} keepsake photo book`);
    const body = encodeURIComponent(
      `Here's our photo book of memories — enjoy!\n\n${shareUrl}\n\nWith love 💛`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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
            {/* Layout */}
            <Card className="rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                1. Choose a layout
              </h2>
              {/* Phones: a compact 2-up grid showing just the name + colours (descriptions are md and up). */}
              <RadioGroup value={layout} onValueChange={(v) => setLayout(v as LayoutStyle)} className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {LAYOUTS.map((l) => (
                  <Label
                    key={l.id}
                    htmlFor={`layout-${l.id}`}
                    className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors md:gap-3 md:p-4 ${
                      layout === l.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={l.id} id={`layout-${l.id}`} className="mt-0.5 shrink-0 md:mt-1" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold leading-tight text-foreground md:text-sm">
                        {l.title}
                        {l.swatches && (
                          <span className="flex -space-x-1" aria-hidden>
                            {l.swatches.map((s) => (
                              <span key={s} className="h-3.5 w-3.5 rounded-full border border-card" style={{ backgroundColor: s }} />
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 hidden text-xs text-muted-foreground md:block">{l.desc}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </Card>

            {/* Memory selection + reorder + cover picker */}
            <Card className="rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Select, reorder & pick covers
                </h2>
                <div className="flex gap-2 text-xs">
                  <button onClick={selectAll} className="text-primary-deep underline-offset-2 hover:underline">All</button>
                  <span className="text-muted-foreground">·</span>
                  <button onClick={selectNone} className="text-muted-foreground hover:underline">None</button>
                </div>
              </div>
              {ordered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No memories yet — add some first.</p>
              ) : (
                <div className="space-y-3">
                  {yearGroups.map(({ year, items }) => (
                    <ExportYearGroup
                      key={year}
                      year={year}
                      items={items}
                      open={openYears.has(year)}
                      selected={selected}
                      coverOverrides={coverOverrides}
                      onToggleOpen={() => toggleYear(year)}
                      onSetAll={setYearSelected}
                      onToggleSelected={toggleSelected}
                      onCover={(id, url) => setCoverOverrides({ ...coverOverrides, [id]: url })}
                      onSwap={swap}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right side: actions */}
          {/* Phones use the sticky bottom bar instead, so these don't sit at the end of a long page. */}
          <aside className="hidden space-y-4 md:sticky md:top-6 md:block md:self-start">
            <Card className="rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                3. Preview & generate
              </h2>
              <p className="mb-4 text-sm text-foreground">
                <span className="font-semibold">{includedMemories.length}</span> memor
                {includedMemories.length === 1 ? "y" : "ies"} included.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="warm" onClick={() => generate("preview")} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Preview PDF
                </Button>
                {!entLoading && !canDownload ? (
                  <Button variant="outline" onClick={goUpgrade}>
                    <Lock className="h-4 w-4" /> Upgrade to download
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => generate("download")} disabled={busy || entLoading}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                )}
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
                <Button variant="outline" onClick={createShareLink} disabled={busy || !lastBlob}>
                  <Link2 className="h-4 w-4" /> Create public link
                </Button>
                <Button variant="outline" onClick={shareViaEmail} disabled={!shareUrl}>
                  <Mail className="h-4 w-4" /> Share via email
                </Button>
              </div>
              {shareUrl && (
                <div className="mt-3 break-all rounded-md bg-muted/60 p-2 text-[11px] text-muted-foreground">
                  {shareUrl}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </main>

      <ExportActionBar
        count={includedMemories.length}
        busy={busy}
        planLoading={entLoading}
        canDownload={canDownload}
        canShare={!!lastBlob}
        onPreview={() => generate("preview")}
        onDownload={() => generate("download")}
        onUpgrade={goUpgrade}
        onShare={shareFromBar}
      />

      <ExportPreviewDialog
        open={!!previewUrl}
        filename={lastFilename}
        blob={lastBlob}
        canDownload={canDownload}
        locked={!entLoading && !canDownload}
        busy={busy}
        onClose={() => setPreviewOpen(false)}
        onDownload={downloadCurrent}
        onUpgrade={goUpgrade}
        onShare={createShareLink}
      />

      <BottomNav />
    </div>
  );
};

export default ExportShare;
