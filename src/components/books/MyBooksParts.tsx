import { BookOpen, Plus, Trash2, Eye, Truck, Package, PackageCheck, Printer, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/books/StatusBadge";
import type { UserBook, UserBookStatus } from "@/hooks/useUserBooks";
import { cn } from "@/lib/utils";

export type BookFilter = "all" | UserBookStatus;

export const FILTERS: { id: BookFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "ordered", label: "Ordered" },
  { id: "printing", label: "Printing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

/** Books with no order placed yet: still being built, or built and in preview. */
export const isDraftLike = (status: UserBookStatus) => status === "draft" || status === "preview";

export const matchesFilter = (book: UserBook, filter: BookFilter) => {
  if (filter === "all") return true;
  if (filter === "draft") return isDraftLike(book.status);
  return book.status === filter;
};

export const computeBookStats = (books: UserBook[]) => ({
  drafts: books.filter((b) => isDraftLike(b.status)).length,
  ordered: books.filter((b) => ["ordered", "printing"].includes(b.status)).length,
  delivered: books.filter((b) => ["shipped", "delivered"].includes(b.status)).length,
});

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: "muted" | "accent" | "success" }) => (
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

export const BookStats = ({ stats }: { stats: ReturnType<typeof computeBookStats> }) => (
  <div className="mb-6 grid grid-cols-3 gap-3">
    <StatCard label="Drafts" value={stats.drafts} tone="muted" />
    <StatCard label="In progress" value={stats.ordered} tone="accent" />
    <StatCard label="Delivered" value={stats.delivered} tone="success" />
  </div>
);

export const FilterBar = ({ filter, onChange }: { filter: BookFilter; onChange: (f: BookFilter) => void }) => (
  <div className="-mx-6 mb-5 overflow-x-auto px-6 scrollbar-hide">
    <div className="flex w-max gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
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
);

interface CoverColors { primary?: string; gold?: string; text?: string }

const BookCover = ({ title, status, colors }: { title: string; status: UserBookStatus; colors?: CoverColors }) => (
  <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-hero">
    <div
      className="flex h-3/4 w-3/5 flex-col items-center justify-center rounded-xl border-2 px-4 text-center shadow-lift"
      style={{
        backgroundColor: colors?.primary ?? "#A8C5BA",
        borderColor: colors?.gold ?? "#D4B896",
        color: colors?.text ?? "#3E3E42",
      }}
    >
      <BookOpen className="mb-2 h-6 w-6" />
      <div className="text-[12px] font-semibold leading-tight">{title}</div>
    </div>
    <div className="absolute right-3 top-3">
      <StatusBadge status={status} />
    </div>
  </div>
);

const ORDERED_STATES = ["ordered", "printing", "shipped", "delivered"];

const BookActions = ({ book, onNavigate, onDelete }: {
  book: UserBook; onNavigate: (path: string) => void; onDelete: () => void;
}) => (
  <div className="mt-auto flex items-center gap-2 pt-2">
    {book.status === "draft" ? (
      <Button size="sm" variant="warm" className="flex-1" onClick={() => onNavigate(`/books/${book.id}/memories`)}>
        Continue
      </Button>
    ) : (
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={() => onNavigate(ORDERED_STATES.includes(book.status) ? `/books/${book.id}/confirmation` : `/books/${book.id}/preview`)}
      >
        <Eye className="h-4 w-4" /> View
      </Button>
    )}
    <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete book">
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

export const BookCard = ({ book, templateName, colors, onNavigate, onDelete }: {
  book: UserBook;
  templateName?: string;
  colors?: CoverColors;
  onNavigate: (path: string) => void;
  onDelete: () => void;
}) => (
  <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40">
    <BookCover title={book.title} status={book.status} colors={colors} />
    <div className="flex flex-1 flex-col gap-2 p-4">
      <div className="text-[14px] font-semibold leading-tight">{book.title}</div>
      <div className="text-[12px] text-muted-foreground">
        {templateName ?? "—"} · {format(new Date(book.created_at), "MMM d, yyyy")}
      </div>
      {book.tracking_number && (
        <div className="text-[12px] text-secondary-foreground">
          <Truck className="mr-1 inline h-3 w-3" /> Tracking: {book.tracking_number}
        </div>
      )}
      <BookActions book={book} onNavigate={onNavigate} onDelete={onDelete} />
    </div>
  </article>
);

/** Order stages only list books that were already ordered, so they never offer to create one. */
const ORDER_EMPTY: Record<string, { icon: LucideIcon; title: string; body: string }> = {
  ordered: { icon: Package, title: "No orders yet", body: "Books you've ordered and that are waiting to be printed will show up here." },
  printing: { icon: Printer, title: "Nothing is printing right now", body: "Books move here while they're being printed and bound." },
  shipped: { icon: Truck, title: "Nothing is on its way", body: "Books show up here once they've shipped, along with their tracking details." },
  delivered: { icon: PackageCheck, title: "No delivered books yet", body: "Books you've received will be listed here." },
};

const emptyCopy = (filter: BookFilter) => {
  const order = ORDER_EMPTY[filter];
  if (order) return { Icon: order.icon, title: order.title, body: order.body, isOrder: true };
  if (filter === "draft") return { Icon: BookOpen, title: "No drafts", body: "Books you're still working on will be saved here.", isOrder: false };
  return { Icon: BookOpen, title: "No books yet", body: "Turn your favorite memories into a beautifully printed keepsake.", isOrder: false };
};

export const EmptyState = ({ filter, hasAny, onCreate, onShowAll }: {
  filter: BookFilter; hasAny: boolean; onCreate: () => void; onShowAll: () => void;
}) => {
  const { Icon, title, body, isOrder } = emptyCopy(filter);
  return (
    <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/30">
        <Icon className="h-8 w-8 text-primary-foreground" />
      </span>
      <h3 className="mt-4 text-[18px] font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted-foreground">{body}</p>
      {!isOrder && (
        <Button variant="warm" size="lg" className="mt-5" onClick={onCreate}>
          <Plus className="h-4 w-4" /> {hasAny ? "Start a new book" : "Create your first book"}
        </Button>
      )}
      {isOrder && hasAny && (
        <Button variant="outline" className="mt-5" onClick={onShowAll}>
          Show all books
        </Button>
      )}
    </div>
  );
};
