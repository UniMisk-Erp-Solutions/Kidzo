import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  Link2,
  Loader2,
  Mail,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useMemories, type Memory } from "@/hooks/useMemories";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { exportShareBook, type LayoutStyle } from "@/lib/exportShareBook";
import { format } from "date-fns";

const LAYOUTS: { id: LayoutStyle; title: string; desc: string }[] = [
  { id: "classic", title: "Classic coffee-table", desc: "Bold hero photo with caption — warm and traditional." },
  { id: "minimal", title: "Minimal", desc: "Lots of whitespace, centered photo and title." },
  { id: "timeline", title: "Timeline-first", desc: "Dark date rail down the left with story alongside." },
];

const ExportShare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { data: memories = [] } = useMemories(child?.id);

  const [order, setOrder] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<LayoutStyle>("classic");
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [lastFilename, setLastFilename] = useState<string>("keepsake.pdf");

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

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
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
    if (includedMemories.length === 0) {
      toast.error("Pick at least one memory to include.");
      return;
    }
    setBusy(true);
    const t = toast.loading("Building your photo book…");
    try {
      const { blob, filename, report } = await exportShareBook({
        childName: child.name,
        childDob: new Date(child.dob),
        memories: includedMemories,
        coverOverrides,
        layout,
        download: mode === "download",
      });
      setLastBlob(blob);
      setLastFilename(filename);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      toast.success(
        mode === "download" ? "Saved 💛" : "Preview ready",
        {
          id: t,
          description: report.failedImages.length
            ? `${report.imagesLoaded}/${report.imagesAttempted} photos embedded.`
            : undefined,
        },
      );
    } catch (e) {
      toast.error("Couldn't generate PDF", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const downloadCurrent = () => {
    if (!lastBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(lastBlob);
    a.download = lastFilename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const createShareLink = async () => {
    if (!lastBlob || !user || !child) {
      toast.error("Generate the PDF first.");
      return;
    }
    setBusy(true);
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
    } catch (e) {
      toast.error("Couldn't create share link", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
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
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child.name} />
      <main className="mx-auto max-w-3xl px-4 py-6 md:max-w-5xl md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Export & share</h1>
            <p className="text-sm text-muted-foreground">
              Build a printable photo book of {child.name}'s memories and share it with family.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr,320px]">
          <div className="space-y-6">
            {/* Layout */}
            <Card className="rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                1. Choose a layout
              </h2>
              <RadioGroup value={layout} onValueChange={(v) => setLayout(v as LayoutStyle)} className="grid gap-2 md:grid-cols-3">
                {LAYOUTS.map((l) => (
                  <Label
                    key={l.id}
                    htmlFor={`layout-${l.id}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      layout === l.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={l.id} id={`layout-${l.id}`} className="mt-1" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{l.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{l.desc}</div>
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
                <ul className="space-y-2">
                  {ordered.map((m, idx) => {
                    const photos = m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : [];
                    const currentCover = coverOverrides[m.id] ?? photos[0];
                    const isSel = selected.has(m.id);
                    return (
                      <li
                        key={m.id}
                        className={`rounded-xl border p-3 transition-opacity ${
                          isSel ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleSelected(m.id)}
                            className="mt-1"
                            aria-label={`Include ${m.title}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {format(new Date(m.happened_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            {photos.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {photos.map((url) => {
                                  const isCover = url === currentCover;
                                  return (
                                    <button
                                      key={url}
                                      type="button"
                                      onClick={() => setCoverOverrides({ ...coverOverrides, [m.id]: url })}
                                      title={isCover ? "Hero cover" : "Use as hero cover"}
                                      className={`relative h-14 w-14 overflow-hidden rounded-md border-2 transition-all ${
                                        isCover ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-border"
                                      }`}
                                    >
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                      {isCover && (
                                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-primary/90 py-0.5 text-[9px] font-semibold text-primary-foreground">
                                          <Star className="h-2.5 w-2.5 fill-current" /> COVER
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => move(idx, -1)}
                              disabled={idx === 0}
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => move(idx, 1)}
                              disabled={idx === ordered.length - 1}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Right side: actions */}
          <aside className="space-y-4 md:sticky md:top-6 md:self-start">
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
                <Button variant="outline" onClick={() => generate("download")} disabled={busy}>
                  <Download className="h-4 w-4" /> Download
                </Button>
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

      <Dialog
        open={!!previewUrl}
        onOpenChange={(o) => {
          if (!o) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview — {lastFilename}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              title="PDF preview"
              className="h-[70vh] w-full rounded-md border border-border"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={downloadCurrent}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="warm" onClick={createShareLink} disabled={busy}>
              <Link2 className="h-4 w-4" /> Share link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ExportShare;
