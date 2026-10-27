import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { TemplateCard } from "@/components/books/TemplateCard";
import { TemplatePreviewModal } from "@/components/books/TemplatePreviewModal";
import { useBookTemplates, type BookTemplate } from "@/hooks/useBookTemplates";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCreateUserBook } from "@/hooks/useUserBooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FILTERS: { id: string; label: string; match: (t: BookTemplate) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "timeline", label: "Timeline", match: (t) => t.category === "timeline" },
  { id: "0-12m", label: "First Year", match: (t) => t.category === "0-12m" },
  { id: "birthday", label: "Birthday", match: (t) => t.category === "birthday" },
  { id: "seasonal", label: "Holiday", match: (t) => t.category === "seasonal" },
  { id: "everyday", label: "Everyday", match: (t) => t.category === "everyday" },
  { id: "premium", label: "Premium ✨", match: (t) => t.is_premium },
];

const TemplateSelector = () => {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useBookTemplates();
  const { data: child } = useActiveChild();
  const createBook = useCreateUserBook();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewing, setPreviewing] = useState<BookTemplate | null>(null);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = search.trim().toLowerCase();
    return templates
      .filter(f.match)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.suggested_age_range ?? "").toLowerCase().includes(q),
      );
  }, [templates, filter, search]);

  const handleSelect = async (t: BookTemplate) => {
    if (!child) {
      toast.error("Please add a child profile first");
      return;
    }
    try {
      const book = await createBook.mutateAsync({
        child_id: child.id,
        template_id: t.id,
        title: `${child.name}'s ${t.name}`,
      });
      toast.success("Book created — let's pick memories");
      navigate(`/books/${book.id}/memories`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't create book");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <TopBar childName={child?.name ?? ""} />

      <main className="mx-auto max-w-2xl px-6 py-6 md:max-w-6xl md:py-10">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/books")} className="-ml-3 mb-3">
            <ArrowLeft className="h-4 w-4" /> My books
          </Button>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/30 text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight md:text-3xl">
                Create your memory book
              </h1>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                Choose from {templates.length}+ beautifully designed templates, then we'll print and ship it to you.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name or age…"
            className="h-12 rounded-2xl pl-11"
          />
        </div>

        {/* Filter pills */}
        <div className="-mx-6 mb-6 overflow-x-auto px-6 scrollbar-hide">
          <div className="flex w-max gap-2">
            {FILTERS.map((f) => {
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "min-h-[36px] whitespace-nowrap rounded-full border px-4 text-[13px] font-medium transition-all",
                    isActive
                      ? "border-primary-deep bg-primary-deep text-primary-foreground shadow-soft"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading templates…
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-muted-foreground">No templates match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={handleSelect}
                onPreview={setPreviewing}
              />
            ))}
          </div>
        )}
      </main>

      <TemplatePreviewModal
        template={previewing}
        open={!!previewing}
        onOpenChange={(v) => !v && setPreviewing(null)}
        onSelect={(t) => {
          setPreviewing(null);
          handleSelect(t);
        }}
      />

      <BottomNav />
    </div>
  );
};

export default TemplateSelector;
