import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ConfirmProvider";
import { type Memory, useMemories } from "@/hooks/useMemories";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { deleteMemoryRow, saveMemoryEdit } from "@/hooks/useMemoryDetailApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MemoryEditForm } from "./MemoryEditForm";
import { MemoryImageViewer } from "./MemoryImageViewer";
import { MemoryViewBody } from "./MemoryViewBody";
import { photosOf, tallySuggestions } from "./memoryDetailUtils";
import { useMemoryEditState } from "./useMemoryEditState";

interface Props {
  memory: Memory | null;
  onClose: () => void;
}

export const MemoryDetail = ({ memory, onClose }: Props) => {
  const { canEdit } = useCanEditChild(memory?.child_id);
  const qc = useQueryClient();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // active image shown in the big preview (view mode only)
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const edit = useMemoryEditState(memory);

  useEffect(() => {
    if (!memory) return;
    setEditing(false);
    setActiveImgIdx(0);
  }, [memory]);

  const { data: pastMemories = [] } = useMemories(memory?.child_id);
  const whoSuggestions = useMemo(() => tallySuggestions(pastMemories, "who_was_there"), [pastMemories]);
  const tagSuggestions = useMemo(() => tallySuggestions(pastMemories, "tags"), [pastMemories]);

  const handleDelete = async () => {
    if (!memory) return;
    const sure = await confirm({ title: "Delete this memory?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true });
    if (!sure) return;
    setDeleting(true);
    const message = await deleteMemoryRow(memory.id);
    setDeleting(false);
    if (message) {
      toast.error(message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["memories"] });
    toast.success("Memory removed.");
    onClose();
  };

  const handleSave = async () => {
    if (!memory || !user) return;
    if (!edit.title.trim()) {
      toast.error("Memory title can't be empty.");
      return;
    }
    setSaving(true);
    const result = await saveMemoryEdit({
      userId: user.id,
      memoryId: memory.id,
      fields: {
        title: edit.title,
        story: edit.story,
        happenedAt: edit.happenedAt,
        category: edit.category,
        who: edit.who,
        tags: edit.tags,
      },
      keptUrls: edit.photos.keptUrls,
      newFiles: edit.photos.newPhotos.map((p) => p.file),
      highlightIdx: edit.photos.highlightIdx,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["memories"] });
    toast.success("Memory updated. ✓");
    // refresh local kept urls in case user keeps editing
    edit.photos.settle(result.photoUrls);
    setActiveImgIdx(0);
    setEditing(false);
  };

  return (
    <Dialog open={!!memory} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden rounded-3xl border-border bg-card p-0">
        {memory && (
          <div className="flex max-h-[92vh] flex-col">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>

            <MemoryImageViewer
              images={photosOf(memory)}
              title={memory.title}
              activeIdx={activeImgIdx}
              onChange={setActiveImgIdx}
              onSelect={setActiveImgIdx}
            />

            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              {editing ? (
                <MemoryEditForm
                  state={edit}
                  whoSuggestions={whoSuggestions}
                  tagSuggestions={tagSuggestions}
                  saving={saving}
                  onCancel={() => setEditing(false)}
                  onSave={handleSave}
                />
              ) : (
                <MemoryViewBody
                  memory={memory}
                  canEdit={canEdit}
                  deleting={deleting}
                  onDelete={handleDelete}
                  onEdit={() => setEditing(true)}
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
