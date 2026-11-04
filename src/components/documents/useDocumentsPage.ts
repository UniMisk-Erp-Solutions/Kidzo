import { useConfirm } from "@/components/ConfirmProvider";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  useDocumentActions,
  type AllowedDocCategory,
  type ChildDocument,
  type UploadDocumentResult,
} from "@/hooks/useDocuments";
import { ACCEPTED, MAX_FILE_MB, categoryLabel } from "./documentCategories";

/* ───────────── per-folder plan rules ───────────── */

export type FolderRules = {
  planSlug: string | null;
  entLoading: boolean;
  grouped: Map<string, ChildDocument[]>;
  maxIn: (c: AllowedDocCategory) => number | null;
  isLocked: (c: AllowedDocCategory) => boolean;
  isFull: (c: AllowedDocCategory) => boolean;
  /** Which plan unlocks a locked folder. */
  lockedBy: (c: AllowedDocCategory) => string;
};

/** Per-folder limits come from the plan: null = unlimited, 0 = locked, n = max files. */
export function useFolderRules(documents: ChildDocument[]): FolderRules {
  const { planSlug, documentLimit, loading: entLoading } = useEntitlements();
  const grouped = useMemo(() => {
    const map = new Map<string, ChildDocument[]>();
    for (const d of documents) map.set(d.category, [...(map.get(d.category) ?? []), d]);
    return map;
  }, [documents]);

  const maxIn = (c: AllowedDocCategory) => documentLimit(c);
  const countIn = (c: AllowedDocCategory) => grouped.get(c)?.length ?? 0;
  const isLocked = (c: AllowedDocCategory) => !entLoading && maxIn(c) === 0;
  const isFull = (c: AllowedDocCategory) => {
    const m = maxIn(c);
    return !entLoading && m !== null && m > 0 && countIn(c) >= m;
  };
  const lockedBy = (c: AllowedDocCategory) => (c === "achievement" || planSlug === "family" ? "Premium" : "Family & Premium");
  return { planSlug, entLoading, grouped, maxIn, isLocked, isFull, lockedBy };
}

/* ───────────── upload dialog ───────────── */

/** Why a folder can't take another file right now, or null when it can. */
function blockedMessage(cat: AllowedDocCategory, rules: FolderRules) {
  if (rules.isLocked(cat)) {
    return {
      title: `${categoryLabel(cat)} is a ${rules.lockedBy(cat)} feature`,
      description:
        cat === "achievement"
          ? "Upgrade to Premium to store achievement certificates."
          : "The Free plan keeps one birth certificate. Upgrade to add more documents.",
    };
  }
  if (!rules.isFull(cat)) return null;
  const max = rules.maxIn(cat);
  const premiumNote = rules.planSlug === "family" ? " — Premium is unlimited" : "";
  return {
    title: "This folder is full",
    description: `Your plan holds up to ${max} file${max === 1 ? "" : "s"} here. Upgrade to add more${premiumNote}.`,
  };
}

/** A problem with the chosen file, or null when it is fine. */
function fileProblem(f: File): string | null {
  if (!ACCEPTED.includes(f.type)) return "Please choose a photo (JPG, PNG, WebP, HEIC) or a PDF.";
  if (f.size > MAX_FILE_MB * 1024 * 1024) return `That file is over ${MAX_FILE_MB} MB.`;
  return null;
}

function reportUploadFailure(result: UploadDocumentResult, goUpgrade: () => void) {
  if (result.ok !== false) return;
  switch (result.reason) {
    case "upload":
      toast.error("Couldn't upload that file.");
      break;
    case "locked":
      toast.error("This folder is full or locked on your plan.", { action: { label: "See plans", onClick: goUpgrade } });
      break;
    default:
      toast.error(result.message);
  }
}

export type UploadForm = ReturnType<typeof useUploadForm>;

export function useUploadForm(rules: FolderRules, child?: { id: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const docActions = useDocumentActions();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AllowedDocCategory>("birth_certificate");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const goUpgrade = () => navigate("/pricing-plans");

  const openUpload = (cat: AllowedDocCategory) => {
    const blocked = blockedMessage(cat, rules);
    if (blocked) {
      toast(blocked.title, { description: blocked.description, action: { label: "See plans", onClick: goUpgrade } });
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
    const problem = fileProblem(f);
    if (problem) {
      toast.error(problem);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!user || !child || !file) return toast.error("Please choose a file to upload.");
    if (!title.trim()) return toast.error("Give this document a title.");
    setSaving(true);
    const result = await docActions.upload({ userId: user.id, childId: child.id, category, title, notes, file });
    setSaving(false);
    if (result.ok === false) return reportUploadFailure(result, goUpgrade);
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Document stored safely ✓");
    setOpen(false);
  };

  return { open, setOpen, category, setCategory, title, setTitle, notes, setNotes, file, saving, pickFile, openUpload, handleUpload };
}

/* ───────────── preview / download / delete ───────────── */

export type PreviewState = { doc: ChildDocument; url: string; isPdf: boolean };

/**
 * In-page preview. The file is fetched once through a short-lived signed link and shown from memory,
 * so nothing keeps pointing at the vault after the preview closes.
 */
export function useDocumentPreview() {
  const docActions = useDocumentActions();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const close = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setFailed(false);
  };

  const view = async (doc: ChildDocument) => {
    setLoading(true);
    try {
      const blob = await docActions.fetchBlob(doc.file_path);
      const isPdf = doc.file_path.toLowerCase().endsWith(".pdf") || blob.type === "application/pdf";
      setFailed(false);
      setPreview({ doc, isPdf, url: URL.createObjectURL(isPdf ? new Blob([blob], { type: "application/pdf" }) : blob) });
    } catch {
      toast.error("Couldn't open that document.");
    } finally {
      setLoading(false);
    }
  };

  const download = async (doc: ChildDocument) => {
    const url = await docActions.downloadUrl(doc.file_path);
    if (!url) return toast.error("Couldn't download that document.");
    window.location.href = url;
  };

  return { preview, loading, failed, setFailed, close, view, download };
}

export function useDeleteDocument() {
  const docActions = useDocumentActions();
  const qc = useQueryClient();
  const confirm = useConfirm();
  return async (doc: ChildDocument) => {
    if (!(await confirm({ title: `Delete "${doc.title}"?`, description: "This can't be undone.", confirmLabel: "Delete", destructive: true }))) return;
    const failure = await docActions.remove(doc);
    if (failure) return toast.error(failure);
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Removed.");
  };
}
