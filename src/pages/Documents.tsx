import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Award,
  Download,
  Eye,
  FileText,
  FolderLock,
  GraduationCap,
  Loader2,
  Lock,
  School,
  ShieldCheck,
  Sparkles,
  Syringe,
  Trash2,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  ALLOWED_DOC_CATEGORIES,
  isAllowedCategory,
  useDocuments,
  type AllowedDocCategory,
  type ChildDocument,
} from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

const CATEGORIES: { id: AllowedDocCategory; label: string; hint: string; icon: LucideIcon; tone: string }[] = [
  { id: "birth_certificate", label: "Birth certificate", hint: "Included on every plan", icon: FileText, tone: "bg-primary/25 text-primary-deep" },
  { id: "vaccination", label: "Vaccination record", hint: "Immunisation card or log", icon: Syringe, tone: "bg-success/25 text-success" },
  { id: "marksheet", label: "Marksheet / report card", hint: "Term results and progress reports", icon: GraduationCap, tone: "bg-accent/40 text-accent-foreground" },
  { id: "school", label: "School certificate", hint: "Enrolment letter, bonafide, transfer", icon: School, tone: "bg-secondary/30 text-secondary" },
  { id: "achievement", label: "Achievement certificate", hint: "Awards, competitions, courses", icon: Award, tone: "bg-warning/25 text-warning-foreground" },
];

const LEGACY_LABEL: Record<string, string> = {
  ssn_id: "ID document",
  passport: "Passport",
  medical: "Medical",
  other: "Other",
};

const Documents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { canEdit } = useCanEditChild(child?.id);
  const { data: documents = [], isLoading } = useDocuments(child?.id);
  const { planSlug, documentLimit, loading: entLoading } = useEntitlements();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AllowedDocCategory>("birth_certificate");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const total = documents.length;
  const isPremium = planSlug === "premium";

  const grouped = useMemo(() => {
    const map = new Map<string, ChildDocument[]>();
    for (const d of documents) map.set(d.category, [...(map.get(d.category) ?? []), d]);
    return map;
  }, [documents]);
  const legacy = documents.filter((d) => !isAllowedCategory(d.category));

  // Per-folder limits come from the plan: null = unlimited, 0 = locked, n = max files.
  const countIn = (c: AllowedDocCategory) => grouped.get(c)?.length ?? 0;
  const maxIn = (c: AllowedDocCategory) => documentLimit(c);
  const isLocked = (c: AllowedDocCategory) => !entLoading && maxIn(c) === 0;
  const isFull = (c: AllowedDocCategory) => {
    const m = maxIn(c);
    return !entLoading && m !== null && m > 0 && countIn(c) >= m;
  };
  /** Which plan unlocks a locked folder. */
  const lockedBy = (c: AllowedDocCategory) => (c === "achievement" || planSlug === "family" ? "Premium" : "Family & Premium");

  const goUpgrade = () => navigate("/pricing-plans");

  const openUpload = (cat: AllowedDocCategory) => {
    const label = CATEGORIES.find((c) => c.id === cat)!.label;
    if (isLocked(cat)) {
      toast(`${label} is a ${lockedBy(cat)} feature`, {
        description:
          cat === "achievement"
            ? "Upgrade to Premium to store achievement certificates."
            : "The Free plan keeps one birth certificate. Upgrade to add more documents.",
        action: { label: "See plans", onClick: goUpgrade },
      });
      return;
    }
    if (isFull(cat)) {
      toast("This folder is full", {
        description: `Your plan holds up to ${maxIn(cat)} file${maxIn(cat) === 1 ? "" : "s"} here. Upgrade to add more${
          planSlug === "family" ? " — Premium is unlimited" : ""
        }.`,
        action: { label: "See plans", onClick: goUpgrade },
      });
      return;
    }
    setCategory(cat);
    setTitle("");
    setNotes("");
    setFile(null);
    setOpen(true);
  };

  const pickFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Please choose a photo (JPG, PNG, WebP, HEIC) or a PDF.");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`That file is over ${MAX_FILE_MB} MB.`);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!user || !child || !file) return toast.error("Please choose a file to upload.");
    if (!title.trim()) return toast.error("Give this document a title.");
    setSaving(true);
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    // Random name: the original file name (which often contains the child's name / ID number) is never stored.
    const path = `${user.id}/${child.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("child-documents").upload(path, file, { contentType: file.type });
    if (upErr) {
      setSaving(false);
      return toast.error("Couldn't upload that file.");
    }
    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      child_id: child.id,
      category,
      title: title.trim(),
      file_path: path,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      await supabase.storage.from("child-documents").remove([path]); // don't leave an orphan file behind
      if (error.message.includes("plan_feature_locked")) {
        toast.error("This folder is full or locked on your plan.", {
          action: { label: "See plans", onClick: goUpgrade },
        });
      } else {
        toast.error(error.message);
      }
      return;
    }
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Document stored safely ✓");
    setOpen(false);
  };

  // In-page preview. The file is fetched once through a short-lived signed link and shown from memory,
  // so nothing keeps pointing at the vault after the preview closes.
  const [preview, setPreview] = useState<{ doc: ChildDocument; url: string; isPdf: boolean } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPreviewFailed(false);
  };

  const handleView = async (doc: ChildDocument) => {
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.storage.from("child-documents").createSignedUrl(doc.file_path, 60);
      if (error || !data) throw error ?? new Error("no url");
      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const isPdf = doc.file_path.toLowerCase().endsWith(".pdf") || blob.type === "application/pdf";
      setPreviewFailed(false);
      setPreview({ doc, isPdf, url: URL.createObjectURL(isPdf ? new Blob([blob], { type: "application/pdf" }) : blob) });
    } catch {
      toast.error("Couldn't open that document.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (doc: ChildDocument) => {
    const { data, error } = await supabase.storage.from("child-documents").createSignedUrl(doc.file_path, 60, { download: true });
    if (error || !data) return toast.error("Couldn't download that document.");
    window.location.href = data.signedUrl;
  };

  const handleDelete = async (doc: ChildDocument) => {
    if (!confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    await supabase.storage.from("child-documents").remove([doc.file_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Removed.");
  };

  const DocRow = ({ doc }: { doc: ChildDocument }) => (
    <li className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{doc.title}</p>
        <p className="text-[11px] text-muted-foreground">Added {format(new Date(doc.created_at), "MMM d, yyyy")}</p>
      </div>
      <div className="flex items-center gap-0.5">
        <button onClick={() => handleView(doc)} disabled={previewLoading} aria-label="Preview" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
          {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        </button>
        <button onClick={() => handleDownload(doc)} aria-label="Download" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Download className="h-4 w-4" />
        </button>
        {canEdit && (
          <button onClick={() => handleDelete(doc)} aria-label="Delete" className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {/* Header */}
        <header className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
            <FolderLock className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">Documents</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              Private vault for {child?.name ?? "your child"} — only you can open these.
            </p>
          </div>
        </header>

        {/* Plan usage */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Your vault</p>
              <p className="mt-0.5 text-[22px] font-bold text-foreground">
                {total}
                <span className="text-[15px] font-medium text-muted-foreground"> document{total === 1 ? "" : "s"} stored</span>
              </p>
            </div>
            {!entLoading && !isPremium && (
              <Button variant="warm" size="sm" onClick={goUpgrade}>
                <Sparkles className="h-4 w-4" /> {planSlug === "family" ? "Go Premium" : "Upgrade for more"}
              </Button>
            )}
          </div>
          {!entLoading && (
            <p className="mt-3 text-[13px] text-muted-foreground">
              {isPremium
                ? "Premium: unlimited files in every folder, including achievement certificates."
                : planSlug === "family"
                  ? "Family: marksheets hold up to 20 files and school certificates up to 7. Upgrade to Premium for unlimited files and achievement certificates."
                  : "Free plan: keeps one birth certificate. Upgrade to Family or Premium for marksheet and school folders and more."}
            </p>
          )}
        </section>

        {/* Folders */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Folders</h2>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const items = grouped.get(cat.id) ?? [];
                const Icon = cat.icon;
                const locked = isLocked(cat.id);
                const full = isFull(cat.id);
                const max = maxIn(cat.id);
                const isFolder = cat.id === "marksheet" || cat.id === "school";
                const blocked = locked || full;
                return (
                  <li
                    key={cat.id}
                    className={cn(
                      "rounded-2xl border border-border bg-card p-4 shadow-soft",
                      locked && "bg-muted/30",
                      isFolder && "sm:col-span-2",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", locked ? "bg-muted text-muted-foreground" : cat.tone)}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-[15px] font-semibold text-foreground">
                            {cat.label}
                            {isFolder && !locked && (
                              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Folder
                              </span>
                            )}
                          </h3>
                          <p className="text-[12px] text-muted-foreground">
                            {locked
                              ? `${lockedBy(cat.id)} plan`
                              : max === null
                                ? items.length ? `${items.length} file${items.length === 1 ? "" : "s"} · unlimited` : cat.hint
                                : `${items.length} of ${max} file${max === 1 ? "" : "s"}`}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          variant={blocked ? "outline" : "soft"}
                          size="sm"
                          onClick={() => openUpload(cat.id)}
                          aria-label={blocked ? `Upgrade to add to ${cat.label}` : `Add to ${cat.label}`}
                        >
                          {blocked ? <Lock className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{blocked ? "Upgrade" : isFolder ? "Add file" : "Upload"}</span>
                        </Button>
                      )}
                    </div>

                    {!locked && max !== null && max > 1 && (
                      <Progress value={Math.min(100, (items.length / max) * 100)} className="mt-3 h-1.5" />
                    )}
                    {full && (
                      <p className="mt-2 text-[12px] font-medium text-warning-foreground">
                        Folder full — upgrade{planSlug === "family" ? " to Premium" : ""} to add more files.
                      </p>
                    )}

                    {items.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-border pt-3">
                        {items.map((d) => (
                          <DocRow key={d.id} doc={d} />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Older uploads of retired types */}
        {legacy.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Older uploads</h2>
            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
              <p className="flex items-start gap-2 text-[13px] text-foreground/85">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                These were uploaded before we limited the vault to safer document types. We recommend deleting any government ID
                you no longer need online.
              </p>
              <ul className="mt-3 space-y-1">
                {legacy.map((d) => (
                  <li key={d.id}>
                    <span className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground">{LEGACY_LABEL[d.category] ?? d.category}</span>
                    <ul>
                      <DocRow doc={d} />
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* How we protect it */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <Lock className="h-4 w-4" /> How your documents are protected
          </h2>
          <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
            <li>• Stored in a private vault — never public, never in share links, PDFs or books.</li>
            <li>• Opened only through short-lived (60 second) secure links.</li>
            <li>• Files are saved under a random name, so the original file name is not kept.</li>
            <li>• Not accepted: Aadhaar, PAN, passport, bank or card documents. Keep those offline.</li>
          </ul>
        </section>

      </main>

      {/* Preview dialog — stays on this page */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && closePreview()}>
        <DialogContent className="max-w-3xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.doc.title}</DialogTitle>
            <DialogDescription>
              Added {preview ? format(new Date(preview.doc.created_at), "MMM d, yyyy") : ""}
              {preview?.doc.notes ? ` · ${preview.doc.notes}` : ""}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="h-[65vh] overflow-auto rounded-xl border border-border bg-muted/40">
              {preview.isPdf ? (
                <iframe src={preview.url} title={preview.doc.title} className="h-full w-full" />
              ) : previewFailed ? (
                <div className="flex h-full items-center justify-center p-6 text-center text-[14px] text-muted-foreground">
                  This image format can't be shown here. Use Download to open it.
                </div>
              ) : (
                <img
                  src={preview.url}
                  alt={preview.doc.title}
                  onError={() => setPreviewFailed(true)}
                  className="mx-auto max-h-full max-w-full object-contain"
                />
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {preview && (
              <Button variant="outline" onClick={() => handleDownload(preview.doc)}>
                <Download className="h-4 w-4" /> Download
              </Button>
            )}
            <Button variant="warm" onClick={closePreview}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>Stored privately. Photos and PDFs up to {MAX_FILE_MB} MB.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpload();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="doc-cat">Folder</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AllowedDocCategory)}>
                <SelectTrigger id="doc-cat" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_DOC_CATEGORIES.map((id) => {
                    const c = CATEGORIES.find((x) => x.id === id)!;
                    return (
                      <SelectItem key={id} value={id} disabled={isLocked(id) || isFull(id)}>
                        {c.label}
                        {isLocked(id) ? ` (${lockedBy(id)})` : isFull(id) ? " (full)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Birth certificate (original)" className="h-11 rounded-xl" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-file">File</Label>
              <Input id="doc-file" type="file" accept="image/*,application/pdf" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="h-11 rounded-xl" required />
              {file && <p className="text-[12px] text-muted-foreground">{file.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-notes">Notes (optional)</Label>
              <Textarea id="doc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-xl" />
            </div>

            <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[12px] text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Please don't upload Aadhaar, PAN, passport, bank or card documents.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="warm" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Keep it safe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Documents;
