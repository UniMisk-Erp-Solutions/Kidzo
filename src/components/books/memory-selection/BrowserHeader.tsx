import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Memory } from "@/hooks/useMemories";
import type { ViewMode } from "@/hooks/useMemoryFilters";

const VIEW_OPTIONS = [
  { mode: "list" as const, label: "List", Icon: List },
  { mode: "calendar" as const, label: "Calendar", Icon: CalendarDays },
];

const ViewToggle = ({ viewMode, onChange }: { viewMode: ViewMode; onChange: (m: ViewMode) => void }) => (
  <div className="flex rounded-lg border bg-muted/30 p-0.5">
    {VIEW_OPTIONS.map(({ mode, label, Icon }) => (
      <button
        key={mode}
        onClick={() => onChange(mode)}
        className={cn(
          "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition",
          viewMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" /> {label}
      </button>
    ))}
  </div>
);

const CHIP = "rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium hover:bg-primary/20";

interface ChipsProps {
  yearFilter: number | null;
  categoryFilter: string | null;
  visible: Memory[];
  selected: string[];
  onClearYear: () => void;
  onClearCategory: () => void;
  onToggleVisible: (ids: string[]) => void;
}

/** Active filter chips + a "Select these N" shortcut for what the filters show. */
const FilterChips = (p: ChipsProps) => {
  const allVisibleSelected = p.visible.length > 0 && p.visible.every((m) => p.selected.includes(m.id));
  return (
    <>
      {p.yearFilter && (
        <button onClick={p.onClearYear} className={`${CHIP} text-primary-deep`}>
          {p.yearFilter} ×
        </button>
      )}
      {p.categoryFilter && (
        <button onClick={p.onClearCategory} className={`${CHIP} text-primary`}>
          {p.categoryFilter} ×
        </button>
      )}
      {(p.yearFilter || p.categoryFilter) && (
        <button
          onClick={() => p.onToggleVisible(p.visible.map((m) => m.id))}
          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
        >
          {allVisibleSelected ? `Deselect these ${p.visible.length}` : `Select these ${p.visible.length}`}
        </button>
      )}
    </>
  );
};

const countLabel = (viewMode: ViewMode, selectedDate: Date | null, month: Date) => {
  if (viewMode !== "calendar") return "memories";
  return selectedDate ? `on ${format(selectedDate, "PP")}` : `in ${format(month, "MMMM yyyy")}`;
};

interface Props extends ChipsProps {
  viewMode: ViewMode;
  selectedDate: Date | null;
  month: Date;
  onViewMode: (m: ViewMode) => void;
}

/** The bar above the memory list: List/Calendar switch, filter chips, result count and Add photo. */
export const BrowserHeader = ({ viewMode, selectedDate, month, onViewMode, ...chips }: Props) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
    <div className="flex items-center gap-3">
      <ViewToggle viewMode={viewMode} onChange={onViewMode} />
      <FilterChips {...chips} />
    </div>
    <div className="flex items-center gap-2 text-[13px]">
      <span className="font-semibold">{chips.visible.length}</span>
      <span className="text-muted-foreground">{countLabel(viewMode, selectedDate, month)}</span>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/moments/new">
          <Plus className="h-4 w-4" /> Add photo
        </Link>
      </Button>
    </div>
  </div>
);
