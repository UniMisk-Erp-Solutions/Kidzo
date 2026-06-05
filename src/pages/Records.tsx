import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Syringe,
  IdCard,
  School,
  Stethoscope,
  Plane,
  FolderOpen,
  Upload,
  Eye,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  ChevronDown,
  Lock,
} from "lucide-react";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useAuth } from "@/contexts/AuthContext";
import { useDocuments, useGuidanceProgress, type DocCategory, type ChildDocument } from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: DocCategory; label: string; icon: any; tone: string }[] = [
  { id: "birth_certificate", label: "Birth Certificate", icon: FileText, tone: "bg-primary/25 text-primary-deep" },
  { id: "vaccination", label: "Vaccination Records", icon: Syringe, tone: "bg-success/25 text-success" },
  { id: "ssn_id", label: "SSN / ID", icon: IdCard, tone: "bg-accent/40 text-accent-foreground" },
  { id: "school", label: "School Enrollment", icon: School, tone: "bg-secondary/30 text-secondary" },
  { id: "medical", label: "Medical", icon: Stethoscope, tone: "bg-warning/25 text-warning-foreground" },
  { id: "passport", label: "Passport", icon: Plane, tone: "bg-primary/25 text-primary-deep" },
  { id: "other", label: "Other", icon: FolderOpen, tone: "bg-muted text-muted-foreground" },
];

const GUIDES = [
  {
    key: "birth_certificate",
    title: "Apply for a Birth Certificate",
    need: "Hospital discharge papers, parent IDs, marriage certificate (if applicable)",
    steps: [
      "Visit your local vital records office or apply online",
      "Submit required documents and identification",
      "Pay the issuance fee (varies by state/country)",
      "Receive certificate by mail or in person within 2–4 weeks",
    ],
    mistakes: ["Misspelling the child's legal name", "Submitting expired parent IDs"],
    contact: "Local Department of Vital Records",
  },
  {
    key: "vaccination",
    title: "Keep Vaccination Records up to date",
    need: "Pediatrician's immunization log, school enrollment forms",
    steps: [
      "Request a printed immunization record from your pediatrician",
      "Keep digital copies after each scheduled visit",
      "Verify entries match the recommended schedule (CDC/WHO)",
    ],
    mistakes: ["Missing booster doses", "Losing the original yellow card while traveling"],
    contact: "Your pediatrician or local public health office",
  },
  {
    key: "school",
    title: "School Enrollment",
    need: "Birth certificate, proof of address, immunization record, photo ID",
    steps: [
      "Confirm enrollment window for your school district",
      "Complete the enrollment application online or in person",
      "Submit required documents",
      "Schedule any placement assessments",
    ],
    mistakes: ["Missing the enrollment window", "Outdated proof of address"],
    contact: "Your local school district office",
  },
  {
    key: "passport",
    title: "Apply for a Passport",
    need: "Birth certificate, parent IDs, passport photo, signed application",
    steps: [
      "Both parents (or legal guardians) typically must appear in person",
      "Bring originals + photocopies of all documents",
      "Submit application at an accepting facility",
      "Pay fees; expect 6–12 weeks for processing (faster for expedited)",
    ],
    mistakes: ["Photos not meeting size/background rules", "Only one parent attending without consent form"],
    contact: "U.S. Department of State (or your country's passport authority)",
  },
  {
    key: "ssn_id",
    title: "Government ID / SSN",
    need: "Birth certificate, parent IDs, completed application form",
    steps: [
      "Complete the application form (e.g., Form SS-5 in the US)",
      "Submit in person at a local SSA office or by mail",
      "Card arrives by mail in 7–14 business days",
    ],
    mistakes: ["Sending originals without making copies first", "Incomplete signatures"],
    contact: "Local SSA office or equivalent agency",
  },
];

const Records = () => {
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { data: documents = [], isLoading } = useDocuments(child?.id);
  const { data: completedGuides = [] } = useGuidanceProgress(child?.id);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<DocCategory>("birth_certificate");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<DocCategory, ChildDocument[]>();
    for (const c of CATEGORIES) map.set(c.id, []);
    for (const d of documents) {
      const arr = map.get(d.category as DocCategory) ?? [];
      arr.push(d);
      map.set(d.category as DocCategory, arr);
    }
    return map;
  }, [documents]);

  const openUpload = (cat: DocCategory) => {
    setCategory(cat);
    setTitle("");
    setNotes("");
    setFile(null);
    setOpen(true);
  };

  const handleUpload = async () => {
    if (!user || !child || !file) {
      toast.error("Please choose a file to upload.");
      return;
    }
    if (!title.trim()) {
      toast.error("Give this document a title.");
      return;
    }
    setSaving(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${child.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("child-documents")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      setSaving(false);
      toast.error("Couldn't upload that file.");
      return;
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
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Document safely stored. ✓");
    setOpen(false);
  };

  const handleView = async (doc: ChildDocument) => {
    const { data, error } = await supabase.storage
      .from("child-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data) return toast.error("Couldn't open that document.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (doc: ChildDocument) => {
    const { data, error } = await supabase.storage
      .from("child-documents")
      .createSignedUrl(doc.file_path, 60, { download: true });
    if (error || !data) return toast.error("Couldn't download that document.");
    window.location.href = data.signedUrl;
  };

  const handleDelete = async (doc: ChildDocument) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    await supabase.storage.from("child-documents").remove([doc.file_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Removed.");
  };

  const toggleGuide = async (key: string) => {
    if (!user || !child) return;
    const isComplete = completedGuides.includes(key);
    if (isComplete) {
      await supabase
        .from("guidance_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("child_id", child.id)
        .eq("guide_key", key);
    } else {
      await supabase.from("guidance_progress").insert({
        user_id: user.id,
        child_id: child.id,
        guide_key: key,
      });
    }
    qc.invalidateQueries({ queryKey: ["guidance"] });
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <TopBar childName={child?.name ?? "Your child"} />

      <main className="mx-auto max-w-4xl px-6 py-6 space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Records</h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Private vault — only you can see these documents.
          </p>
        </header>

        {/* Section 1: Document vault */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Legal documents
          </h2>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const items = grouped.get(cat.id) ?? [];
                const Icon = cat.icon;
                return (
                  <li
                    key={cat.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft animate-fade-in-up"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            cat.tone,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-[15px] font-semibold text-foreground">{cat.label}</h3>
                          <p className="text-[12px] text-muted-foreground">
                            {items.length === 0
                              ? "No documents yet"
                              : `${items.length} document${items.length === 1 ? "" : "s"}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => openUpload(cat.id)}
                        aria-label={`Upload ${cat.label}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {items.length > 0 && (
                      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                        {items.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-foreground">
                                {doc.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(new Date(doc.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleView(doc)}
                                aria-label="View"
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                aria-label="Download"
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                aria-label="Delete"
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Section 2: Guidance */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Guidance & checklists
          </h2>
          <Accordion type="multiple" className="space-y-2">
            {GUIDES.map((g) => {
              const done = completedGuides.includes(g.key);
              return (
                <AccordionItem
                  key={g.key}
                  value={g.key}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft data-[state=open]:shadow-lift"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex flex-1 items-center gap-3 text-left">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          "text-[15px] font-semibold text-foreground",
                          done && "text-muted-foreground line-through decoration-1",
                        )}
                      >
                        {g.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 text-[14px]">
                      <Block label="What you need" body={g.need} />
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Steps to apply
                        </p>
                        <ol className="mt-1 list-decimal space-y-1 pl-5 text-foreground/85">
                          {g.steps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Common mistakes
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-foreground/85">
                          {g.mistakes.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </div>
                      <Block label="Contact" body={g.contact} />

                      <div className="flex justify-end pt-1">
                        <Button
                          variant={done ? "ghost" : "warm"}
                          size="sm"
                          onClick={() => toggleGuide(g.key)}
                        >
                          {done ? "Mark as not done" : "Mark as complete"}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      </main>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpload();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="doc-cat">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as DocCategory)}>
                <SelectTrigger id="doc-cat" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Birth certificate (original)"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-file">File</Label>
              <Input
                id="doc-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="h-11 rounded-xl"
                required
              />
              {file && (
                <p className="text-[12px] text-muted-foreground">{file.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-notes">Notes (optional)</Label>
              <Textarea
                id="doc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="warm" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Keep Documents Safe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

const Block = ({ label, body }: { label: string; body: string }) => (
  <div>
    <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 text-foreground/85">{body}</p>
  </div>
);

export default Records;
