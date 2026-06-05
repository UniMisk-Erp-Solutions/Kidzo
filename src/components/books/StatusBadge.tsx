import { cn } from "@/lib/utils";
import type { UserBookStatus } from "@/hooks/useUserBooks";

const STYLES: Record<UserBookStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  preview: "bg-primary/30 text-primary-foreground",
  ordered: "bg-accent/40 text-accent-foreground",
  printing: "bg-accent/40 text-accent-foreground",
  shipped: "bg-secondary/40 text-secondary-foreground",
  delivered: "bg-success/30 text-foreground",
};

const LABELS: Record<UserBookStatus, string> = {
  draft: "Draft",
  preview: "In preview",
  ordered: "Ordered",
  printing: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export const StatusBadge = ({ status }: { status: UserBookStatus }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
      STYLES[status],
    )}
  >
    {LABELS[status]}
  </span>
);
