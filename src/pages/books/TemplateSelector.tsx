import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopBar } from "@/components/childbook/TopBar";
import { FilterPills, TemplateGrid } from "@/components/books/TemplateBrowser";
import { PageHero } from "@/components/childbook/PageHero";
import { BottomNav } from "@/components/childbook/BottomNav";
import { TemplatePreviewModal } from "@/components/books/TemplatePreviewModal";
import { useBookTemplates, type BookTemplate } from "@/hooks/useBookTemplates";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useCreateUserBook } from "@/hooks/useUserBooks";
import { toast } from "sonner";

const FILTERS: { id: string; label: string; match: (t: BookTemplate) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "timeline", label: "Timeline", match: (t) => t.category === "timeline" },
  { id: "0-12m", label: "First Year", match: (t) => t.category === "0-12m" },
  { id: "birthday", label: "Birthday", match: (t) => t.category === "birthday" },
  { id: "seasonal", label: "Holiday", match: (t) => t.category === "seasonal" },
  { id: "everyday", label: "Everyday", match: (t) => t.category === "everyday" },
  { id: "collage", label: "Collage", match: (t) => /scrapbook-(kraft|filmroll|newsprint)/.test(t.slug) },
  { id: "premium", label: "Premium ✨", match: (t) => t.is_premium },
];

const matchesQuery = (t: BookTemplate, q: string) =>
  !q ||
  t.name.toLowerCase().includes(q) ||
  t.description.toLowerCase().includes(q) ||
  (t.suggested_age_range ?? "").toLowerCase().includes(q);

const TemplateSelector = () => {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useBookTemplates();
  const { data: child } = useActiveChild();
  const createBook = useCreateUserBook();
  const { can, loading: entLoading } = useEntitlements();
  // Premium templates are for plans that include photo books (Family / Premium).
  const isLocked = (t: BookTemplate) => t.is_premium && !entLoading && !can("photo_book_orders");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewing, setPreviewing] = useState<BookTemplate | null>(null);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = search.trim().toLowerCase();
    return templates.filter(f.match).filter((t) => matchesQuery(t, q));
  }, [templates, filter, search]);

  const handleSelect = async (t: BookTemplate) => {
    if (isLocked(t)) {
      toast("Premium template ✨", {
        description: "Upgrade to the Family or Premium plan to use this template.",
        action: { label: "See plans", onClick: () => navigate("/pricing-plans") },
      });
      return;
    }
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
      const msg = (e as { message?: string })?.message;
      toast.error("Couldn't create book", msg ? { description: msg } : undefined);
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
          <PageHero
            icon={BookOpen}
            title="Create your memory book"
            subtitle={`Choose from ${templates.length}+ beautifully designed templates, then we'll print and ship it to you.`}
          />
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

        <FilterPills filters={FILTERS} active={filter} onChange={setFilter} />

        <TemplateGrid
          loading={isLoading}
          templates={visible}
          isLocked={isLocked}
          onSelect={handleSelect}
          onPreview={setPreviewing}
        />
      </main>

      <TemplatePreviewModal
        template={previewing}
        locked={!!previewing && isLocked(previewing)}
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
