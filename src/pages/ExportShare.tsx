import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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
import { ExportPreviewDialog } from "@/components/books/ExportPreviewDialog";
import { ExportYearGroup } from "@/components/books/ExportYearGroup";
import { ExportActionBar } from "@/components/books/ExportActionBar";
import type { YearItem } from "@/hooks/useYearGroups";
import { useMemoryYears, useMemoriesInYears, YEARS_PER_PAGE } from "@/hooks/useMemoryPages";
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

/** 128 random bits as URL-safe text: unguessable, and carries no ids, names or server details. */
const newShareToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c] ?? "");
};

const ExportShare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  // Years are paged (6 per page) and each page of memories is fetched from the server on demand.
  const { data: yearIndex } = useMemoryYears(child?.id);
  const allMemories = useMemories(child?.id, { enabled: false }); // only fetched when building the book
  const qc = useQueryClient();
  const { can, loading: entLoading } = useEntitlements();
  const canDownload = can("pdf_export");
  const goUpgrade = () => navigate("/pricing-plans");

  const [page, setPage] = useState(0);
  // Selection survives page changes. Default: everything selected (`off` lists exceptions); after "None":
  // nothing selected (`on` lists exceptions).
  const [allDefault, setAllDefault] = useState(true);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [on, setOn] = useState<Set<string>>(new Set());
  const [orderByYear, setOrderByYear] = useState<Record<number, string[]>>({});
  const [openYearsState, setOpenYearsState] = useState<{ page: number; years: Set<number> } | null>(null);
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

  const years = yearIndex?.years ?? [];
  const totalMemories = yearIndex?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(years.length / YEARS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageYears = years.slice(safePage * YEARS_PER_PAGE, (safePage + 1) * YEARS_PER_PAGE);
  const { data: pageMemories = [], isFetching: pageLoading } = useMemoriesInYears(
    child?.id,
    pageYears[pageYears.length - 1],
    pageYears[0],
  );

  const isSel = (id: string) => (allDefault ? !off.has(id) : on.has(id));
  const setSel = (ids: string[], value: boolean) => {
    const target = allDefault ? off : on;
    const next = new Set(target);
    // `off` holds the deselected ids, `on` the selected ones
    ids.forEach((id) => (allDefault ? (value ? next.delete(id) : next.add(id)) : value ? next.add(id) : next.delete(id)));
    (allDefault ? setOff : setOn)(next);
  };
  const includedCount = allDefault ? totalMemories - off.size : on.size;

  // This page's memories, newest year first, each year in the user's own order.
  const orderedPage = useMemo(() => {
    const byYear = new Map<number, Memory[]>();
    for (const m of pageMemories) {
      const y = new Date(m.happened_at).getFullYear();
      byYear.set(y, [...(byYear.get(y) ?? []), m]);
    }
    const out: Memory[] = [];
    for (const y of [...byYear.keys()].sort((a, b) => b - a)) {
      let list = byYear.get(y)!;
      const ord = orderByYear[y];
      if (ord) {
        const idx = new Map(ord.map((id, i) => [id, i]));
        list = [...list].sort((a, b) => (idx.get(a.id) ?? 1e9) - (idx.get(b.id) ?? 1e9));
      }
      out.push(...list);
    }
    return out;
  }, [pageMemories, orderByYear]);

  const yearGroups = useMemo(() => {
    const map = new Map<number, YearItem<Memory>[]>();
    orderedPage.forEach((m, idx) => {
      const y = new Date(m.happened_at).getFullYear();
      map.set(y, [...(map.get(y) ?? []), { m, idx }]);
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, items]) => ({ year, items }));
  }, [orderedPage]);

  const openYears =
    openYearsState && openYearsState.page === safePage
      ? openYearsState.years
      : new Set(yearGroups.length ? [yearGroups[0].year] : []);
  const toggleYear = (year: number) => {
    const next = new Set(openYears);
    if (!next.delete(year)) next.add(year);
    setOpenYearsState({ page: safePage, years: next });
  };

  const selectedOnPage = useMemo(
    () => new Set(orderedPage.filter((m) => (allDefault ? !off.has(m.id) : on.has(m.id))).map((m) => m.id)),
    [orderedPage, allDefault, off, on],
  );

  // Swap two neighbours (same year) of this page; idx refers to `orderedPage`.
  const swap = (a: number, b: number | undefined) => {
    if (b === undefined || b < 0 || b >= orderedPage.length) return;
    const ma = orderedPage[a];
    const mb = orderedPage[b];
    const y = new Date(ma.happened_at).getFullYear();
    if (y !== new Date(mb.happened_at).getFullYear()) return;
    const ids = orderedPage.filter((m) => new Date(m.happened_at).getFullYear() === y).map((m) => m.id);
    const ia = ids.indexOf(ma.id);
    const ib = ids.indexOf(mb.id);
    [ids[ia], ids[ib]] = [ids[ib], ids[ia]];
    setOrderByYear({ ...orderByYear, [y]: ids });
  };

  const setYearSelected = (ids: string[], value: boolean) => setSel(ids, value);
  const toggleSelected = (id: string) => setSel([id], !isSel(id));

  const selectAll = () => {
    setAllDefault(true);
    setOff(new Set());
    setOn(new Set());
  };
  const selectNone = () => {
    setAllDefault(false);
    setOff(new Set());
    setOn(new Set());
  };

  /** Every selected memory across ALL pages (fetched from the server), year by year in the user's order. */
  const collectIncluded = async (): Promise<Memory[]> => {
    const all = (await allMemories.refetch()).data ?? [];
    const byYear = new Map<number, Memory[]>();
    for (const m of all) {
      const y = new Date(m.happened_at).getFullYear();
      byYear.set(y, [...(byYear.get(y) ?? []), m]);
    }
    const out: Memory[] = [];
    for (const y of years) {
      let list = byYear.get(y) ?? [];
      const ord = orderByYear[y];
      if (ord) {
        const idx = new Map(ord.map((id, i) => [id, i]));
        list = [...list].sort((a, b) => (idx.get(a.id) ?? 1e9) - (idx.get(b.id) ?? 1e9));
      }
      out.push(...list.filter((m) => isSel(m.id)));
    }
    return out;
  };

  const generate = async (mode: "preview" | "download") => {
    if (!child) return;
    if (mode === "download" && !canDownload) {
      toast.error("Upgrade to download", { action: { label: "See plans", onClick: goUpgrade } });
      return;
    }
    if (includedCount <= 0) {
      toast.error("Pick at least one memory to include.");
      return;
    }
    const includedMemories = await collectIncluded();
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

  const createShareLink = async (): Promise<string | null> => {
    if (!lastBlob || !user || !child) {
      toast.error("Generate the PDF first.");
      return null;
    }
    setSharing(true);
    const t = toast.loading("Uploading your photo book…");
    try {
      // The file name is random (no child name or ids). The folder must stay the user id for the storage
      // policy, but that path is never put in the link: the link is just a random token on our own domain.
      const path = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage
        .from("shared-keepsakes")
        .upload(path, lastBlob, { contentType: "application/pdf", upsert: false });
      if (error) throw error;
      const token = newShareToken();
      const { error: linkError } = await supabase
        .from("shared_keepsakes")
        .insert({ token, user_id: user.id, child_id: child.id, storage_path: path });
      if (linkError) {
        await supabase.storage.from("shared-keepsakes").remove([path]);
        throw linkError;
      }
      const url = `${window.location.origin}/k/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Link ready & copied to clipboard 🔗", { id: t });
      return url;
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
              {years.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No memories yet — add some first.</p>
              ) : (
                <div className="space-y-3">
                  {yearGroups.map(({ year, items }) => (
                    <ExportYearGroup
                      key={year}
                      year={year}
                      items={items}
                      open={openYears.has(year)}
                      selected={selectedOnPage}
                      coverOverrides={coverOverrides}
                      onToggleOpen={() => toggleYear(year)}
                      onSetAll={setYearSelected}
                      onToggleSelected={toggleSelected}
                      onCover={(id, url) => setCoverOverrides({ ...coverOverrides, [id]: url })}
                      onSwap={swap}
                    />
                  ))}
                  {pageLoading && yearGroups.length === 0 && (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-primary-deep" />
                    </div>
                  )}
                  {years.length > YEARS_PER_PAGE && (
                    <nav aria-label="Year pages" className="flex items-center justify-between gap-3 pt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        aria-label="Previous years"
                        disabled={safePage === 0 || pageLoading}
                        onClick={() => setPage(safePage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-foreground">
                          Page {safePage + 1} of {pageCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pageYears[0] === pageYears[pageYears.length - 1]
                            ? pageYears[0]
                            : `${pageYears[0]} – ${pageYears[pageYears.length - 1]}`}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        aria-label="Next years"
                        disabled={safePage >= pageCount - 1 || pageLoading}
                        onClick={() => setPage(safePage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </nav>
                  )}
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
                <span className="font-semibold">{includedCount}</span> memor
                {includedCount === 1 ? "y" : "ies"} included.
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
        count={includedCount}
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
        onClose={() => setPreviewOpen(false)}
        onDownload={downloadCurrent}
        onUpgrade={goUpgrade}
      />

      <BottomNav />
    </div>
  );
};

export default ExportShare;
