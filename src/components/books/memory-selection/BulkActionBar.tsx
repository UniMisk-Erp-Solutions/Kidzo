import { CheckSquare, Scale, Square, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/hooks/useMemories";
import { CategoryMenu, YearMenu } from "./FilterMenus";

interface Props {
  target: number;
  memories: Memory[];
  selected: string[];
  yearGroups: [number, Memory[]][];
  categories: string[];
  yearFilter: number | null;
  categoryFilter: string | null;
  onPickYear: (year: number | null) => void;
  onPickCategory: (category: string | null) => void;
  onSmartPick: () => void;
  onBalancedPick: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

/** Smart pick / Balanced / Select all, plus the year and category browsers. */
export const BulkActionBar = (p: Props) => {
  const allSelected = p.selected.length === p.memories.length && p.memories.length > 0;
  const AllIcon = allSelected ? Square : CheckSquare;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
      <Button size="sm" variant="default" onClick={p.onSmartPick} className="gap-1.5" title="Spread evenly across the timeline">
        <Wand2 className="h-3.5 w-3.5" /> Smart pick {p.target}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={p.onBalancedPick}
        className="gap-1.5"
        title="Balance evenly across years AND categories"
      >
        <Scale className="h-3.5 w-3.5" /> Balanced {p.target}
      </Button>
      <div className="mx-1 h-5 w-px bg-border" aria-hidden />
      <Button size="sm" variant="outline" onClick={allSelected ? p.onClearAll : p.onSelectAll} className="gap-1.5">
        <AllIcon className="h-3.5 w-3.5" />
        {allSelected ? "Deselect all" : `Select all (${p.memories.length})`}
      </Button>
      {p.yearGroups.length > 0 && (
        <YearMenu
          yearGroups={p.yearGroups}
          total={p.memories.length}
          selected={p.selected}
          yearFilter={p.yearFilter}
          onPick={p.onPickYear}
        />
      )}
      {p.categories.length > 0 && (
        <CategoryMenu
          categories={p.categories}
          memories={p.memories}
          selected={p.selected}
          categoryFilter={p.categoryFilter}
          onPick={p.onPickCategory}
        />
      )}
    </div>
  );
};
