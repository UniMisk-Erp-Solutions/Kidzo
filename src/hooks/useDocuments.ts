import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** The only types that can be uploaded. Government IDs (Aadhaar/PAN/passport/SSN) are deliberately not here. */
export const ALLOWED_DOC_CATEGORIES = ["birth_certificate", "vaccination", "marksheet", "school", "achievement"] as const;
export type AllowedDocCategory = (typeof ALLOWED_DOC_CATEGORIES)[number];

/** Older uploads may still carry a retired type; they stay viewable/deletable but can't be added to. */
export type DocCategory = AllowedDocCategory | "ssn_id" | "passport" | "medical" | "other";

export const isAllowedCategory = (c: string): c is AllowedDocCategory =>
  (ALLOWED_DOC_CATEGORIES as readonly string[]).includes(c);

export type ChildDocument = {
  id: string;
  user_id: string;
  child_id: string;
  category: DocCategory;
  title: string;
  file_path: string;
  notes: string | null;
  created_at: string;
};

export const useDocuments = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["documents", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<ChildDocument[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("child_id", childId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChildDocument[];
    },
  });
};

const DOCS_BUCKET = "child-documents";

export type UploadDocumentInput = {
  userId: string;
  childId: string;
  category: string;
  title: string;
  notes: string;
  file: File;
};

export type UploadDocumentResult =
  | { ok: true }
  | { ok: false; reason: "upload" }
  | { ok: false; reason: "locked" }
  | { ok: false; reason: "error"; message: string };

const docExtension = (file: File) =>
  (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");

const uploadDocument = async ({ userId, childId, category, title, notes, file }: UploadDocumentInput): Promise<UploadDocumentResult> => {
  // Random name: the original file name (which often contains the child's name / ID number) is never stored.
  const path = `${userId}/${childId}/${crypto.randomUUID()}.${docExtension(file)}`;
  const { error: upErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type });
  if (upErr) return { ok: false, reason: "upload" };
  const { error } = await supabase.from("documents").insert({
    user_id: userId,
    child_id: childId,
    category,
    title: title.trim(),
    file_path: path,
    notes: notes.trim() || null,
  });
  if (!error) return { ok: true };
  await supabase.storage.from(DOCS_BUCKET).remove([path]); // don't leave an orphan file behind
  if (error.message.includes("plan_feature_locked")) return { ok: false, reason: "locked" };
  return { ok: false, reason: "error", message: error.message };
};

/** Fetches the file once through a short-lived signed link. Throws if it can't be opened. */
const fetchDocumentBlob = async (filePath: string): Promise<Blob> => {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(filePath, 60);
  if (error || !data) throw error ?? new Error("no url");
  const res = await fetch(data.signedUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
};

/** A short-lived link that downloads the file, or null if it can't be made. */
const documentDownloadUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(filePath, 60, { download: true });
  return error || !data ? null : data.signedUrl;
};

/** Removes the file and its record. Returns an error message, or null on success. */
const removeDocument = async (doc: { id: string; file_path: string }): Promise<string | null> => {
  await supabase.storage.from(DOCS_BUCKET).remove([doc.file_path]);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  return error ? error.message : null;
};

const DOCUMENT_ACTIONS = {
  upload: uploadDocument,
  fetchBlob: fetchDocumentBlob,
  downloadUrl: documentDownloadUrl,
  remove: removeDocument,
};

/** Vault operations (upload / open / download / delete), so pages never talk to the database directly. */
export const useDocumentActions = () => DOCUMENT_ACTIONS;

export const useGuidanceProgress = (childId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["guidance", user?.id, childId],
    enabled: !!user && !!childId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("guidance_progress")
        .select("guide_key")
        .eq("child_id", childId!);
      if (error) throw error;
      return (data ?? []).map((d) => d.guide_key);
    },
  });
};
