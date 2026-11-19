import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ExportYearGroup } from "@/components/books/ExportYearGroup";
import { ExportYearPager } from "@/components/books/ExportYearPager";
import type { Memory } from "@/hooks/useMemories";
import type { YearItem } from "@/hooks/useYearGroups";
import { YEARS_PER_PAGE } from "@/hooks/useMemoryPages";

interface Props {
  years: number[];
  yearGroups: { year: number; items: YearItem<Memory>[] }[];
  openYears: Set<number>;
  selected: Set<string>;
  coverOverrides: Record<string, string>;
  pageLoading: boolean;
  safePage: number;
  pageCount: number;
  pageYears: number[];
  onPage: (page: number) => void;
  onToggleYear: (year: number) => void;
  onSetAll: (ids: string[], value: boolean) => void;
  onToggleSelected: (id: string) => void;
  onCover: (id: string, url: string) => void;
  onSwap: (a: number, b: number | undefined) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

/** Step 2: memory selection + reorder + cover picker, one page of years at a time. */
export const ExportSelectionCard = (p: Props) => (
  <Card className="rounded-2xl p-5">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        2. Select, reorder & pick covers
      </h2>
      <div className="flex gap-2 text-xs">
        <button onClick={p.onSelectAll} className="text-primary-deep underline-offset-2 hover:underline">All</button>
        <span className="text-muted-foreground">·</span>
        <button onClick={p.onSelectNone} className="text-muted-foreground hover:underline">None</button>
      </div>
    </div>
    {p.years.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">No memories yet — add some first.</p>
    ) : (
      <div className="space-y-3">
        {p.yearGroups.map(({ year, items }) => (
          <ExportYearGroup
            key={year}
            year={year}
            items={items}
            open={p.openYears.has(year)}
            selected={p.selected}
            coverOverrides={p.coverOverrides}
            onToggleOpen={() => p.onToggleYear(year)}
            onSetAll={p.onSetAll}
            onToggleSelected={p.onToggleSelected}
            onCover={p.onCover}
            onSwap={p.onSwap}
          />
        ))}
        {p.pageLoading && p.yearGroups.length === 0 && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary-deep" />
          </div>
        )}
        {p.years.length > YEARS_PER_PAGE && (
          <ExportYearPager
            safePage={p.safePage}
            pageCount={p.pageCount}
            pageYears={p.pageYears}
            pageLoading={p.pageLoading}
            onPage={p.onPage}
          />
        )}
      </div>
    )}
  </Card>
);
