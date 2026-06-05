import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useUserBook, useUpdateUserBook } from "@/hooks/useUserBooks";
import { useBookTemplates, type BookTemplateColors } from "@/hooks/useBookTemplates";
import { useMemories } from "@/hooks/useMemories";
import { useChildren } from "@/hooks/useChildren";
import { cn } from "@/lib/utils";

const PRESETS: { name: string; colors: BookTemplateColors }[] = [
  { name: "Warm", colors: { primary: "#E8A087", accent: "#D4B896", gold: "#D4B896", coral: "#E8A087", text: "#3E3E42" } },
  { name: "Cool", colors: { primary: "#A8C5BA", accent: "#7FA8B5", gold: "#C9D8E0", coral: "#9DB7C9", text: "#2E3A3F" } },
  { name: "Elegant", colors: { primary: "#3E3E42", accent: "#D4B896", gold: "#C9A06C", coral: "#9B7B6B", text: "#1F1F22" } },
  { name: "Soft", colors: { primary: "#F5E6D3", accent: "#E8C5B4", gold: "#F0D9B5", coral: "#F2B8A2", text: "#5E4D45" } },
];

const COLOR_KEYS: (keyof BookTemplateColors)[] = ["primary", "accent", "gold", "coral", "text"];

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
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/books/${book.id}/memories`)} className="-ml-3 mb-3">
          <ArrowLeft className="h-4 w-4" /> Memories
        </Button>

        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2 of 4</div>
          <h1 className="mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Customize your book</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Make it yours — change the title, colors, and reorder pages.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Live preview */}
          <div>
            <div
              className="overflow-hidden rounded-3xl border shadow-soft"
              style={{ backgroundColor: colors.primary }}
            >
              {/* Cover */}
              <div className="relative aspect-[4/5] flex flex-col items-center justify-center p-8 text-center">
                <div
                  className="absolute inset-4 rounded-2xl border-2"
                  style={{ borderColor: colors.accent }}
                />
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: colors.accent }}>
                  {template?.name}
                </div>
                <h2
                  className="mt-3 max-w-md text-balance text-[28px] font-bold leading-tight md:text-[36px]"
                  style={{ color: colors.text }}
                >
                  {title || "Untitled book"}
                </h2>
                {subtitle && (
                  <p className="mt-3 max-w-sm text-[14px]" style={{ color: colors.text, opacity: 0.75 }}>
                    {subtitle}
                  </p>
                )}
                <div
                  className="mt-6 inline-block rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: colors.gold, color: colors.text }}
                >
                  {child?.name ?? "Your child"}
                </div>
              </div>
            </div>

            {/* Page thumbnails */}
            <div className="mt-6">
              <h3 className="mb-3 text-[14px] font-semibold">Pages ({pageOrder.length})</h3>
              {pageOrder.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-[13px] text-muted-foreground">
                  No memories selected. Go back to add some.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {pageOrder.map((mid, idx) => {
                    const m = memoriesById[mid];
                    if (!m) return null;
                    return (
                      <div key={mid} className="group relative overflow-hidden rounded-xl border bg-card">
                        <div className="aspect-[3/4] bg-muted">
                          {m.photo_url && (
                            <img src={m.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="absolute left-1 top-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => movePage(idx, -1)}
                            disabled={idx === 0}
                            className="rounded bg-background px-1.5 text-[10px] font-bold disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => removePage(idx)}
                            className="rounded bg-background px-1.5 text-[10px] font-bold text-destructive"
                          >
                            ×
                          </button>
                          <button
                            onClick={() => movePage(idx, 1)}
                            disabled={idx === pageOrder.length - 1}
                            className="rounded bg-background px-1.5 text-[10px] font-bold disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Customization panel */}
          <div className="space-y-5">
            <section className="rounded-2xl border bg-card p-4">
              <h3 className="text-[14px] font-semibold">Title & subtitle</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="title" className="text-[12px]">Book title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clara's first year" />
                </div>
                <div>
                  <Label htmlFor="subtitle" className="text-[12px]">Subtitle (optional)</Label>
                  <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A year of growth & joy" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold">Colors</h3>
                <button onClick={resetColors} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {COLOR_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="w-16 text-[12px] capitalize text-muted-foreground">{key}</label>
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border bg-transparent"
                    />
                    <Input
                      value={colors[key]}
                      onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                      className="h-9 font-mono text-[12px]"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[12px] font-medium text-muted-foreground">Presets</div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setColors(p.colors)}
                      className={cn(
                        "group flex items-center gap-2 rounded-xl border p-2 text-left text-[12px] transition hover:border-primary",
                      )}
                    >
                      <div className="flex -space-x-1">
                        {COLOR_KEYS.slice(0, 4).map((k) => (
                          <span
                            key={k}
                            className="h-4 w-4 rounded-full border border-card"
                            style={{ backgroundColor: p.colors[k] }}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4">
              <h3 className="text-[14px] font-semibold">Summary</h3>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium">{template?.name}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Pages</span>
                  <span className="font-medium">{pageOrder.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">{template?.pages_needed ?? 24}</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card/95 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-[13px] text-muted-foreground">Step 2 of 4</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/books/${book.id}/memories`)}>
              Back
            </Button>
            <Button onClick={handlePreview} disabled={update.isPending || pageOrder.length === 0}>
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
