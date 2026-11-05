import { useConfirm } from "@/components/ConfirmProvider";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { BottomNav } from "@/components/childbook/BottomNav";
import {
  BookCard, BookStats, EmptyState, FilterBar, computeBookStats, matchesFilter, type BookFilter,
} from "@/components/books/MyBooksParts";
import { useUserBooks, useDeleteUserBook, type UserBook } from "@/hooks/useUserBooks";
import { useBookTemplates } from "@/hooks/useBookTemplates";
import { useActiveChild } from "@/hooks/useActiveChild";
import { toast } from "sonner";

const MyBooks = () => {
  const navigate = useNavigate();
  const { data: books = [], isLoading } = useUserBooks();
  const { data: templates = [] } = useBookTemplates();
  const { data: child } = useActiveChild();
  const del = useDeleteUserBook();

  const [filter, setFilter] = useState<BookFilter>("all");

  const tplById = useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t])), [templates]);
  const visible = books.filter((b) => matchesFilter(b, filter));
  const stats = useMemo(() => computeBookStats(books), [books]);

  const confirm = useConfirm();
  const handleDelete = async (book: UserBook) => {
    if (!(await confirm({ title: `Delete "${book.title}"?`, description: "This can't be undone.", confirmLabel: "Delete", destructive: true }))) return;
    try {
      await del.mutateAsync(book.id);
      toast.success("Book deleted");
    } catch {
      toast.error("Couldn't delete book");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? ""} />

      <main className="mx-auto max-w-2xl px-6 py-6 md:max-w-6xl md:py-10">
        <PageHero
          className="mb-6"
          icon={BookOpen}
          title="My memory books"
          subtitle="Drafts, orders and printed keepsakes — all in one place."
          actions={
            <Button variant="outline" className="border-white/60 bg-white/85 text-plum hover:bg-white" onClick={() => navigate("/books/new")}>
              <Plus className="h-4 w-4" /> Create book
            </Button>
          }
        />

        <BookStats stats={stats} />
        <FilterBar filter={filter} onChange={setFilter} />

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filter={filter} hasAny={books.length > 0} onCreate={() => navigate("/books/new")} onShowAll={() => setFilter("all")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((b) => {
              const tpl = tplById[b.template_id];
              return (
                <BookCard
                  key={b.id}
                  book={b}
                  templateName={tpl?.name}
                  colors={b.color_override?.primary ? b.color_override : tpl?.color_scheme}
                  onNavigate={navigate}
                  onDelete={() => handleDelete(b)}
                />
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MyBooks;
