import { useNavigate } from "react-router-dom";
import { FolderLock, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { isAllowedCategory, useDocuments } from "@/hooks/useDocuments";
import { CATEGORIES } from "@/components/documents/documentCategories";
import {
  useBulkDownload,
  useDeleteDocument,
  useDocumentPreview,
  useFolderRules,
  useUploadForm,
} from "@/components/documents/useDocumentsPage";
import { FolderCard } from "@/components/documents/FolderCard";
import { LegacyUploads } from "@/components/documents/LegacyUploads";
import { PreviewDialog } from "@/components/documents/PreviewDialog";
import { ProtectionNote } from "@/components/documents/ProtectionNote";
import { UploadDialog } from "@/components/documents/UploadDialog";
import { VaultSummary } from "@/components/documents/VaultSummary";

const FolderSkeletons = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
    ))}
  </div>
);

const Documents = () => {
  const navigate = useNavigate();
  const { data: child } = useActiveChild();
  const { canEdit } = useCanEditChild(child?.id);
  const { data: documents = [], isLoading } = useDocuments(child?.id);
  const rules = useFolderRules(documents);
  const upload = useUploadForm(rules, child);
  const viewer = useDocumentPreview();
  const deleteDoc = useDeleteDocument();
  const bulk = useBulkDownload(documents, child?.name);

  const actions = { canEdit, busy: viewer.loading, onView: viewer.view, onDownload: viewer.download, onDelete: deleteDoc };
  const legacy = documents.filter((d) => !isAllowedCategory(d.category));

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        <PageHero
          icon={FolderLock}
          title="Documents"
          subtitle={`Private vault for ${child?.name ?? "your child"} — only you can open these.`}
        />

        <VaultSummary
          total={documents.length}
          planSlug={rules.planSlug}
          planLoading={rules.entLoading}
          onUpgrade={() => navigate("/pricing-plans")}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Folders</h2>
            {documents.length > 0 && (
              <Button variant="soft" size="sm" onClick={bulk.run} disabled={bulk.busy}>
                {bulk.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download all
              </Button>
            )}
          </div>
          {isLoading ? (
            <FolderSkeletons />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <FolderCard
                  key={cat.id}
                  cat={cat}
                  items={rules.grouped.get(cat.id) ?? []}
                  rules={rules}
                  canEdit={canEdit}
                  actions={actions}
                  onUpload={upload.openUpload}
                />
              ))}
            </ul>
          )}
        </section>

        {legacy.length > 0 && <LegacyUploads docs={legacy} actions={actions} />}
        <ProtectionNote />
      </main>

      <PreviewDialog
        preview={viewer.preview}
        failed={viewer.failed}
        onImageError={() => viewer.setFailed(true)}
        onClose={viewer.close}
        onDownload={viewer.download}
      />
      <UploadDialog form={upload} rules={rules} />

      <BottomNav />
    </div>
  );
};

export default Documents;
