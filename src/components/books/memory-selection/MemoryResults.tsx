import { Link } from "react-router-dom";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/hooks/useMemories";
import type { ViewMode } from "@/hooks/useMemoryFilters";
import { MemoryRow } from "./MemoryRow";
import { YearGroupedList } from "./YearGroupedList";

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
    <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
    <p className="mt-2 text-[14px] font-semibold">No memories here yet</p>
    <p className="mt-1 text-[13px] text-muted-foreground">Pick another month or add new moments to use in this book.</p>
    <Button asChild className="mt-4">
      <Link to="/moments/new">
        <Plus className="h-4 w-4" /> New memory
      </Link>
    </Button>
  </div>
);

interface Props {
  loading: boolean;
  visible: Memory[];
  viewMode: ViewMode;
  selected: string[];
  onToggle: (id: string) => void;
  onSelectGroup: (ids: string[]) => void;
  onDeselectGroup: (ids: string[]) => void;
}

/** The memory list: loading spinner, empty state, or the list / calendar results. */
export const MemoryResults = ({ loading, visible, viewMode, selected, onToggle, onSelectGroup, onDeselectGroup }: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-card py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (visible.length === 0) return <EmptyState />;
  if (viewMode === "list") {
    return (
      <YearGroupedList
        memories={visible}
        selected={selected}
        onToggle={onToggle}
        onSelectGroup={onSelectGroup}
        onDeselectGroup={onDeselectGroup}
      />
    );
  }
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((m) => (
        <MemoryRow key={m.id} memory={m} checked={selected.includes(m.id)} onToggle={() => onToggle(m.id)} />
      ))}
    </div>
  );
};
