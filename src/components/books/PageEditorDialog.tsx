import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageEditor } from "./editor/PageEditor";
import { BookPageView, BOOK_PAGE_H, BOOK_PAGE_W } from "./BookPages";
import type { BookPage } from "./BookPages";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";
import type { EditorElement } from "./editor/types";
import type { TextOverrides } from "./editor/pageText";

interface PageEditorDialogProps {
  open: boolean;
  page: BookPage | null;
  colors: BookTemplateColors;
  initialElements: EditorElement[];
  initialHideNative?: boolean;
  initialNativeEditable?: boolean;
  initialTextOverrides?: TextOverrides;
  saving?: boolean;
  /** Stable id (book id) — scopes recents & saved swatches per book. */
  bookId?: string;
  onSave: (els: EditorElement[], hideNative: boolean, nativeEditable: boolean, textOverrides: TextOverrides) => void;
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
  initialTextOverrides,
  saving,
  bookId,
  onSave,
  onClose,
}: PageEditorDialogProps) {
  if (!page) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="flex h-[95dvh] max-h-[95dvh] max-w-[98vw] flex-col gap-2 overflow-hidden p-3 sm:max-w-[98vw]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit page</DialogTitle>
          <DialogDescription className="sr-only">Edit the text, photos and stickers on this page.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <PageEditor
            page={page}
            renderBackground={(p) => (
              <div style={{ width: BOOK_PAGE_W, height: BOOK_PAGE_H }}>
                <BookPageView page={p ?? page} colors={colors} />
              </div>
            )}
            initialTextOverrides={initialTextOverrides}
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
