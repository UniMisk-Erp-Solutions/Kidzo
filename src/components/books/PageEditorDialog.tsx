import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageEditor } from "./editor/PageEditor";
import { BookPageView, BOOK_PAGE_H, BOOK_PAGE_W } from "./BookPages";
import type { BookPage } from "./BookPages";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";
import type { EditorElement } from "./editor/types";

interface PageEditorDialogProps {
  open: boolean;
  page: BookPage | null;
  colors: BookTemplateColors;
  initialElements: EditorElement[];
  initialHideNative?: boolean;
  initialNativeEditable?: boolean;
  saving?: boolean;
  /** Stable id (book id) — scopes recents & saved swatches per book. */
  bookId?: string;
  onSave: (els: EditorElement[], hideNative: boolean, nativeEditable: boolean) => void;
  onClose: () => void;
}

/** Wraps the PageEditor in a fullscreen dialog with the BookPageView as background. */
export function PageEditorDialog({
  open,
  page,
  colors,
  initialElements,
  initialHideNative,
  initialNativeEditable,
  saving,
  bookId,
  onSave,
  onClose,
}: PageEditorDialogProps) {
  if (!page) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="flex h-[95vh] max-h-[95vh] max-w-[98vw] flex-col gap-3 p-3 sm:max-w-[98vw]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit page</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <PageEditor
            page={page}
            renderBackground={() => (
              <div style={{ width: BOOK_PAGE_W, height: BOOK_PAGE_H }}>
                <BookPageView page={page} colors={colors} />
              </div>
            )}
            initialElements={initialElements}
            initialHideNative={!!initialHideNative}
            initialNativeEditable={!!initialNativeEditable}
            colors={colors}
            bookId={bookId}
            onSave={onSave}
            onCancel={onClose}
            saving={saving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
