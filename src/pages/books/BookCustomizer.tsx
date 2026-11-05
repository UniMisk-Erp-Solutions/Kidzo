import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useUserBook, useUpdateUserBook } from "@/hooks/useUserBooks";
import { useBookTemplates, type BookTemplateColors } from "@/hooks/useBookTemplates";
import { ColorsPanel, CoverPreview, PageThumbnails, SummaryPanel, TitlePanel } from "@/components/books/customizer/CustomizerPanels";
import { useMemories } from "@/hooks/useMemories";
import { useChildren } from "@/hooks/useChildren";

const BookCustomizer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: book, isLoading } = useUserBook(id);
  const { data: templates } = useBookTemplates();
  const { data: children } = useChildren();
  const { data: memories = [] } = useMemories(book?.child_id);
  const update = useUpdateUserBook();

  const child = children?.find((c) => c.id === book?.child_id);
  const template = templates?.find((t) => t.id === book?.template_id);

  const defaultColors = template?.color_scheme;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [colors, setColors] = useState<BookTemplateColors | null>(null);
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Title / subtitle / colors hydrate from the book record.
  useEffect(() => {
    if (!book || !defaultColors) return;
    setTitle(book.title || `${child?.name ?? "My"}'s memory book`);
    setSubtitle(book.subtitle ?? "");
    const override = book.color_override as Partial<BookTemplateColors>;
    setColors({ ...(defaultColors as BookTemplateColors), ...override });
  }, [book?.id, defaultColors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page order hydrates ONCE — wait for both the book and the memories list.
  // Smart-pick only as a fallback if nothing was saved.
  useEffect(() => {
    if (!book || hydrated) return;
    const existing = (book.memories_selected ?? []) as string[];
    if (existing.length > 0) {
      setPageOrder(existing);
      setHydrated(true);
      return;
    }
    if (memories.length > 0 && template) {
      import("@/lib/smartPickMemories").then(({ smartPickMemories }) => {
        setPageOrder(smartPickMemories(memories, template.pages_needed ?? 24));
        setHydrated(true);
      });
    }
  }, [book, memories, template, hydrated]);

  const memoriesById = useMemo(() => {
    const map: Record<string, typeof memories[number]> = {};
    memories.forEach((m) => (map[m.id] = m));
    return map;
  }, [memories]);

  const movePage = (idx: number, delta: number) => {
    setPageOrder((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removePage = (idx: number) => {
    setPageOrder((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetColors = () => {
    if (defaultColors) setColors({ ...defaultColors });
  };

  const handlePreview = async () => {
    if (!book || !colors) return;
    try {
      await update.mutateAsync({
        id: book.id,
        patch: {
          title,
          subtitle: subtitle || null,
          color_override: colors as unknown as Record<string, string>,
          memories_selected: pageOrder,
          status: "preview",
        },
      });
      toast.success("Customizations saved");
      navigate(`/books/${book.id}/preview`);
    } catch {
      toast.error("Could not save changes");
    }
  };

  if (isLoading || !book || !colors) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-44">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/books/${book.id}/memories`)} className="-ml-3 mb-3">
          <ArrowLeft className="h-4 w-4" /> Memories
        </Button>

        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2 of 4</div>
          <h1 className="font-display mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Customize your book</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Make it yours — change the title, colors, and reorder pages.
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <CoverPreview colors={colors} templateName={template?.name} title={title} subtitle={subtitle} childName={child?.name ?? "Your child"} />
            <PageThumbnails pageOrder={pageOrder} memoriesById={memoriesById} onMove={movePage} onRemove={removePage} />
          </div>

          <div className="space-y-5">
            <TitlePanel title={title} subtitle={subtitle} onTitle={setTitle} onSubtitle={setSubtitle} />
            <ColorsPanel colors={colors} onChange={setColors} onReset={resetColors} />
            <SummaryPanel templateName={template?.name} pages={pageOrder.length} target={template?.pages_needed ?? 24} />
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 md:px-6">
          <div className="hidden text-[13px] text-muted-foreground sm:block">Step 2 of 4</div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
            <Button variant="outline" size="sm" className="shrink-0 md:h-10 md:px-4" onClick={() => navigate(`/books/${book.id}/memories`)}>
              Back
            </Button>
            <Button size="sm" className="min-w-0 flex-1 md:h-10 md:flex-none md:px-4" onClick={handlePreview} disabled={update.isPending || pageOrder.length === 0}>
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Preview book <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BookCustomizer;
