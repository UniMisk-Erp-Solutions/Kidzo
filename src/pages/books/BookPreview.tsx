import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { useUserBook, useUpdateUserBook } from "@/hooks/useUserBooks";
import { useBookTemplates, type BookTemplateColors } from "@/hooks/useBookTemplates";
import { useMemories } from "@/hooks/useMemories";
import { useChildren } from "@/hooks/useChildren";
import { BookPageFrame, buildPages } from "@/components/books/BookPages";
import { exportBookPdf, type PdfProgress } from "@/lib/exportBookPdf";
import { PdfExportDialog } from "@/components/books/PdfExportDialog";
import { PageEditorDialog } from "@/components/books/PageEditorDialog";
import { pageKeyFor, readPageData, type CustomPagesMap, type EditorElement } from "@/components/books/editor/types";
import { calculatePrice, formatCurrency, type BookSize, type PaperQuality, type BindingType } from "@/lib/bookPricing";

const BookPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: book, isLoading } = useUserBook(id);
  const { data: templates } = useBookTemplates();
  const { data: children } = useChildren();
  const { data: allMemories = [] } = useMemories(book?.child_id);
  const updateBook = useUpdateUserBook();

  const [pageIndex, setPageIndex] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pdfState, setPdfState] = useState<{ open: boolean; progress: PdfProgress | null; error: string | null }>({
    open: false,
    progress: null,
    error: null,
  });

  const child = children?.find((c) => c.id === book?.child_id);
  const template = templates?.find((t) => t.id === book?.template_id);

  const colors: BookTemplateColors | null = useMemo(() => {
    if (!template) return null;
    const override = (book?.color_override ?? {}) as Partial<BookTemplateColors>;
    return { ...(template.color_scheme as BookTemplateColors), ...override };
  }, [template, book?.color_override]);

  const memoriesById = useMemo(() => {
    const map: Record<string, typeof allMemories[number]> = {};
    allMemories.forEach((m) => (map[m.id] = m));
    return map;
  }, [allMemories]);

  const orderedMemories = useMemo(() => {
    const ids = (book?.memories_selected ?? []) as string[];
    return ids.map((mid) => memoriesById[mid]).filter(Boolean);
  }, [book?.memories_selected, memoriesById]);

  const pages = useMemo(() => {
    if (!book || !template || !child) return [];
    return buildPages({
      title: book.title,
      subtitle: book.subtitle,
      childName: child.name,
      childDob: child.dob,
      template,
      memories: orderedMemories,
    });
  }, [book, template, child, orderedMemories]);

  const customPages: CustomPagesMap = useMemo(() => {
    const cp = book?.custom_pages;
    if (cp && !Array.isArray(cp) && typeof cp === "object") return cp as CustomPagesMap;
    return {};
  }, [book?.custom_pages]);

  useEffect(() => {
    setPageIndex(0);
  }, [book?.id]);

  const handleSavePageEdits = async (els: EditorElement[], hideNative: boolean, nativeEditable: boolean) => {
    if (!book || !pages[pageIndex]) return;
    const key = pageKeyFor(pages[pageIndex] as { kind: string; memory?: { id: string }; number?: number; spreadKey?: string });
    const next: CustomPagesMap = { ...customPages, [key]: { elements: els, hideNative, nativeEditable } };
    try {
      await updateBook.mutateAsync({
        id: book.id,
        patch: { custom_pages: next as unknown as unknown[] },
      });
      toast.success("Page saved");
      setEditorOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not save page");
    }
  };

  const price = useMemo(
    () =>
      calculatePrice({
        size: (book?.book_size as BookSize) ?? "8x10",
        paper: (book?.paper_quality as PaperQuality) ?? "matte",
        binding: (book?.binding_type as BindingType) ?? "soft",
        quantity: book?.quantity ?? 1,
      }),
    [book?.book_size, book?.paper_quality, book?.binding_type, book?.quantity],
  );

  const handleDownload = async () => {
    if (!book || !template || !colors || !child) return;
    setPdfState({ open: true, progress: { phase: "preparing", current: 0, total: pages.length }, error: null });
    try {
      await exportBookPdf({
        title: book.title,
        subtitle: book.subtitle,
        childName: child.name,
        childDob: child.dob,
        template,
        colors,
        memories: orderedMemories,
        customPages,
        filename: `${child.name.replace(/\s+/g, "_")}_${template.slug}.pdf`,
        onProgress: (p) => setPdfState((s) => ({ ...s, progress: p })),
      });
      setPdfState((s) => ({ ...s, progress: { phase: "done", current: pages.length, total: pages.length } }));
      toast.success("PDF downloaded");
      // auto-close after a brief moment so user sees "done"
      setTimeout(() => setPdfState({ open: false, progress: null, error: null }), 1200);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not generate PDF";
      setPdfState((s) => ({ ...s, error: msg }));
      toast.error("Could not generate PDF");
    }
  };

  if (isLoading || !book || !template || !colors || !child) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = pages.length;
  const current = pages[pageIndex];
  const currentKey = current
    ? pageKeyFor(current as { kind: string; memory?: { id: string }; number?: number; spreadKey?: string })
    : "";
  const currentData = readPageData(currentKey ? customPages[currentKey] : undefined);
  const currentOverlay = currentData.elements;
  const currentHideNative = currentData.hideNative;
  const currentNativeEditable = currentData.nativeEditable;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <TopBar childName={child.name} />

      {/* Compact header — no extra vertical padding so the page fits */}
      <div className="border-b bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/books/${book.id}/customize`)}
              className="-ml-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
            </Button>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step 3 of 4
              </div>
              <h1 className="truncate text-[15px] font-bold leading-tight md:text-[17px]">
                Preview your book
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-right md:flex">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="text-[15px] font-bold leading-tight">{formatCurrency(price.total)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main viewer fills remaining height — uses CSS grid so the page area
          gets exactly the leftover space, no horizontal/vertical scroll. */}
      <main className="grid min-h-0 flex-1 grid-rows-[1fr_auto] overflow-hidden">
        {/* Page area — page is auto-sized to fit container while keeping 3:4 aspect */}
        <div className="relative min-h-0 overflow-hidden px-3 py-3">
          <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center">
            {/* The page itself — uses aspect-ratio + max-h so it never overflows */}
            <div
              className="relative max-h-full overflow-hidden rounded-2xl border shadow-lift"
              style={{
                aspectRatio: "3 / 4",
                height: "100%",
                maxWidth: "100%",
                backgroundColor: colors.primary,
              }}
            >
              {current && <BookPageFrame page={current} colors={colors} className="h-full w-full" overlay={currentOverlay} hideNative={currentHideNative} />}
            </div>

            {/* Prev / next overlay buttons */}
            <button
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={pageIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-card/95 p-2 shadow-soft backdrop-blur disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setPageIndex((i) => Math.min(total - 1, i + 1))}
              disabled={pageIndex >= total - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-card/95 p-2 shadow-soft backdrop-blur disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Page counter overlay */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur">
              {pageIndex + 1} / {total}
            </div>
          </div>
        </div>

        {/* Bottom strip — thumbnails + actions */}
        <div className="border-t bg-card">
          {/* Thumbnail strip */}
          <div className="overflow-x-auto px-4 py-2 scrollbar-hide">
            <div className="mx-auto flex w-max gap-1.5">
              {pages.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPageIndex(idx)}
                  className={`relative h-12 w-9 shrink-0 overflow-hidden rounded border-2 transition ${
                    idx === pageIndex ? "border-primary-deep" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: colors.primary }}
                  aria-label={`Go to page ${idx + 1}`}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                    style={{ color: colors.ink ?? colors.text ?? "#3E3E42" }}
                  >
                    {idx + 1}
                  </span>
                  {p.kind === "memory" && p.memory.photo_url && (
                    <img src={p.memory.photo_url} alt="" className="h-full w-full object-cover opacity-80" />
                  )}
                  {p.kind === "memory-spread" && p.memories[0]?.photo_url && (
                    <img src={p.memories[0].photo_url} alt="" className="h-full w-full object-cover opacity-80" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="border-t">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 md:px-6">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditorOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit page</span>
                </Button>
              </div>
              <Button size="sm" onClick={() => navigate(`/books/${book.id}/checkout`)}>
                Continue to order <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <PdfExportDialog
        open={pdfState.open}
        progress={pdfState.progress}
        error={pdfState.error}
        onClose={() => setPdfState({ open: false, progress: null, error: null })}
      />

      <PageEditorDialog
        open={editorOpen}
        page={current ?? null}
        colors={colors}
        initialElements={currentOverlay}
        initialHideNative={currentHideNative}
        initialNativeEditable={currentNativeEditable}
        bookId={book?.id}
        saving={updateBook.isPending}
        onSave={handleSavePageEdits}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
};

export default BookPreview;
