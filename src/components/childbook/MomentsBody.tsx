import type { ReactNode } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/hooks/useMemories";
import { sortMemories } from "@/hooks/momentsFilter";
import { MemoryTimeline } from "@/components/childbook/MemoryTimeline";
import { MemoryRoute } from "@/components/childbook/MemoryRoute";

const EmptyState = ({ hasAny, onCreate }: { hasAny: boolean; onCreate?: () => void }) => (
  <div className="mx-auto max-w-md py-16 text-center animate-fade-in">
    <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/25 text-primary-deep">
      <Sparkles className="h-8 w-8" strokeWidth={2} />
    </span>
    <h2 className="text-xl font-semibold text-foreground">
      {hasAny ? "No memories match your filters" : "No memories yet"}
    </h2>
    <p className="mt-2 text-[15px] text-muted-foreground">
      {hasAny ? "Try clearing the filters above." : "Let's capture your first moment together."}
    </p>
    {onCreate && (
      <Button variant="warm" size="lg" className="mt-5" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Create a Memory
      </Button>
    )}
  </div>
);

const LoadingGrid = () => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
    ))}
  </div>
);

type Props = {
  isLoading: boolean;
  view: "grid" | "timeline";
  memories: Memory[];
  filtered: Memory[];
  range: string;
  category: string;
  onOpen: (m: Memory) => void;
  linkedLabelFor: (m: Memory) => string | undefined;
  onYearOpenChange: (open: boolean) => void;
  onCreate?: () => void;
};

/** Which of loading / timeline / empty / grid the Moments page shows. */
export const MomentsBody = (p: Props): ReactNode => {
  if (p.isLoading) return <LoadingGrid />;
  if (p.view === "timeline" && p.memories.length > 0) {
    return (
      <MemoryRoute
        memories={sortMemories(p.filtered, p.range === "newest" ? "desc" : "asc")}
        onOpen={p.onOpen}
        linkedLabelFor={p.linkedLabelFor}
        onYearOpenChange={p.onYearOpenChange}
        category={p.category}
        onCreate={p.onCreate}
        fallback={<EmptyState hasAny onCreate={p.onCreate} />}
      />
    );
  }
  if (p.filtered.length === 0) return <EmptyState hasAny={p.memories.length > 0} onCreate={p.onCreate} />;
  // Grid: the same year-by-year rows as the timeline, newest year first.
  return (
    <MemoryTimeline
      memories={sortMemories(p.filtered, p.range === "oldest" ? "asc" : "desc")}
      onOpen={p.onOpen}
      linkedLabelFor={p.linkedLabelFor}
    />
  );
};
