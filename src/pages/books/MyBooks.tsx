import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Trash2, Eye, Truck, Loader2, Package, PackageCheck, Printer, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { BottomNav } from "@/components/childbook/BottomNav";
import { StatusBadge } from "@/components/books/StatusBadge";
import { useUserBooks, useDeleteUserBook, type UserBook, type UserBookStatus } from "@/hooks/useUserBooks";
import { useBookTemplates } from "@/hooks/useBookTemplates";
import { useActiveChild } from "@/hooks/useActiveChild";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FILTERS: { id: "all" | UserBookStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "ordered", label: "Ordered" },
  { id: "printing", label: "Printing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

/** Books with no order placed yet: still being built, or built and in preview. */
const isDraftLike = (status: UserBookStatus) => status === "draft" || status === "preview";

const MyBooks = () => {
  const navigate = useNavigate();
  const { data: books = [], isLoading } = useUserBooks();
  const { data: templates = [] } = useBookTemplates();
  const { data: child } = useActiveChild();
  const del = useDeleteUserBook();

  const [filter, setFilter] = useState<"all" | UserBookStatus>("all");

  const tplById = useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t])), [templates]);

  const visible = books.filter((b) =>
    filter === "all" ? true : filter === "draft" ? isDraftLike(b.status) : b.status === filter,
  );

  const stats = useMemo(() => {
    const drafts = books.filter((b) => isDraftLike(b.status)).length;
    const ordered = books.filter((b) => ["ordered", "printing"].includes(b.status)).length;
    const delivered = books.filter((b) => ["shipped", "delivered"].includes(b.status)).length;
    return { drafts, ordered, delivered };
  }, [books]);

  const handleDelete = async (book: UserBook) => {
    if (!confirm(`Delete "${book.title}"? This can't be undone.`)) return;
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

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="Drafts" value={stats.drafts} tone="muted" />
          <StatCard label="In progress" value={stats.ordered} tone="accent" />
          <StatCard label="Delivered" value={stats.delivered} tone="success" />
        </div>

        {/* Filters */}
        <div className="-mx-6 mb-5 overflow-x-auto px-6 scrollbar-hide">
          <div className="flex w-max gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "min-h-[36px] whitespace-nowrap rounded-full border px-4 text-[13px] font-medium transition-all",
                  filter === f.id
                    ? "border-primary-deep bg-primary-deep text-primary-foreground shadow-soft"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
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
              const colors = b.color_override?.primary ? b.color_override : tpl?.color_scheme;
              return (
                <article
                  key={b.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40"
                >
                  <div
                    className="relative flex aspect-[4/3] items-center justify-center bg-gradient-hero"
                  >
                    <div
                      className="flex h-3/4 w-3/5 flex-col items-center justify-center rounded-xl border-2 px-4 text-center shadow-lift"
                      style={{
                        backgroundColor: colors?.primary ?? "#A8C5BA",
                        borderColor: colors?.gold ?? "#D4B896",
                        color: colors?.text ?? "#3E3E42",
                      }}
                    >
                      <BookOpen className="mb-2 h-6 w-6" />
                      <div className="text-[12px] font-semibold leading-tight">{b.title}</div>
                    </div>
                    <div className="absolute right-3 top-3">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="text-[14px] font-semibold leading-tight">{b.title}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {tpl?.name ?? "—"} · {format(new Date(b.created_at), "MMM d, yyyy")}
                    </div>
                    {b.tracking_number && (
                      <div className="text-[12px] text-secondary-foreground">
                        <Truck className="mr-1 inline h-3 w-3" /> Tracking: {b.tracking_number}
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-2">
                      {b.status === "draft" ? (
                        <Button
                          size="sm"
                          variant="warm"
                          className="flex-1"
                          onClick={() => navigate(`/books/${b.id}/memories`)}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            navigate(
                              ["ordered", "printing", "shipped", "delivered"].includes(b.status)
                                ? `/books/${b.id}/confirmation`
                                : `/books/${b.id}/preview`,
                            )
                          }
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(b)}
                        aria-label="Delete book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "accent" | "success";
}) => (
  <div
    className={cn(
      "rounded-2xl border border-border bg-card p-4 text-center shadow-soft",
      tone === "accent" && "bg-accent/15",
      tone === "success" && "bg-success/10",
    )}
  >
    <div className="text-[24px] font-bold leading-none">{value}</div>
    <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

/** Order stages only list books that were already ordered, so they never offer to create one. */
const ORDER_EMPTY: Record<string, { icon: LucideIcon; title: string; body: string }> = {
  ordered: { icon: Package, title: "No orders yet", body: "Books you've ordered and that are waiting to be printed will show up here." },
  printing: { icon: Printer, title: "Nothing is printing right now", body: "Books move here while they're being printed and bound." },
  shipped: { icon: Truck, title: "Nothing is on its way", body: "Books show up here once they've shipped, along with their tracking details." },
  delivered: { icon: PackageCheck, title: "No delivered books yet", body: "Books you've received will be listed here." },
};

const EmptyState = ({
  filter,
  hasAny,
  onCreate,
  onShowAll,
}: {
  filter: "all" | UserBookStatus;
  hasAny: boolean;
  onCreate: () => void;
  onShowAll: () => void;
}) => {
  const order = ORDER_EMPTY[filter];
  const Icon = order?.icon ?? BookOpen;
  const title = order ? order.title : filter === "draft" ? "No drafts" : "No books yet";
  const body = order
    ? order.body
    : filter === "draft"
      ? "Books you're still working on will be saved here."
      : "Turn your favorite memories into a beautifully printed keepsake.";

  return (
    <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/30">
        <Icon className="h-8 w-8 text-primary-foreground" />
      </span>
      <h3 className="mt-4 text-[18px] font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted-foreground">{body}</p>
      {!order && (
        <Button variant="warm" size="lg" className="mt-5" onClick={onCreate}>
          <Plus className="h-4 w-4" /> {hasAny ? "Start a new book" : "Create your first book"}
        </Button>
      )}
      {order && hasAny && (
        <Button variant="outline" className="mt-5" onClick={onShowAll}>
          Show all books
        </Button>
      )}
    </div>
  );
};

export default MyBooks;
