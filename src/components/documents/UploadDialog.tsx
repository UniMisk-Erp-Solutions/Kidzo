import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ALLOWED_DOC_CATEGORIES, type AllowedDocCategory } from "@/hooks/useDocuments";
import { MAX_FILE_MB, categoryLabel } from "./documentCategories";
import type { FolderRules, UploadForm } from "./useDocumentsPage";

const folderSuffix = (id: AllowedDocCategory, rules: FolderRules) => {
  if (rules.isLocked(id)) return ` (${rules.lockedBy(id)})`;
  return rules.isFull(id) ? " (full)" : "";
};

const FolderSelect = ({ form, rules }: { form: UploadForm; rules: FolderRules }) => (
  <div className="space-y-1.5">
    <Label htmlFor="doc-cat">Folder</Label>
    <Select value={form.category} onValueChange={(v) => form.setCategory(v as AllowedDocCategory)}>
      <SelectTrigger id="doc-cat" className="h-11 rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALLOWED_DOC_CATEGORIES.map((id) => (
          <SelectItem key={id} value={id} disabled={rules.isLocked(id) || rules.isFull(id)}>
            {categoryLabel(id)}
            {folderSuffix(id, rules)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const DetailFields = ({ form }: { form: UploadForm }) => (
  <>
    <div className="space-y-1.5">
      <Label htmlFor="doc-title">Title</Label>
      <Input id="doc-title" value={form.title} onChange={(e) => form.setTitle(e.target.value)} placeholder="Birth certificate (original)" className="h-11 rounded-xl" required />
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="doc-file">File</Label>
      <Input id="doc-file" type="file" accept="image/*,application/pdf" onChange={(e) => form.pickFile(e.target.files?.[0] ?? null)} className="h-11 rounded-xl" required />
      {form.file && <p className="text-[12px] text-muted-foreground">{form.file.name}</p>}
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="doc-notes">Notes (optional)</Label>
      <Textarea id="doc-notes" value={form.notes} onChange={(e) => form.setNotes(e.target.value)} rows={2} className="rounded-xl" />
    </div>
  </>
);

/** The "Upload document" dialog. */
export const UploadDialog = ({ form, rules }: { form: UploadForm; rules: FolderRules }) => (
  <Dialog open={form.open} onOpenChange={form.setOpen}>
    <DialogContent className="rounded-3xl">
      <DialogHeader>
        <DialogTitle>Upload document</DialogTitle>
        <DialogDescription>Stored privately. Photos and PDFs up to {MAX_FILE_MB} MB.</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleUpload();
        }}
        className="space-y-4"
      >
        <FolderSelect form={form} rules={rules} />
        <DetailFields form={form} />

        <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[12px] text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Please don't upload Aadhaar, PAN, passport, bank or card documents.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => form.setOpen(false)} disabled={form.saving}>
            Cancel
          </Button>
          <Button type="submit" variant="warm" disabled={form.saving}>
            {form.saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Keep it safe
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
