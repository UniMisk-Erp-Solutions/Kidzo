import { Search, Filter, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, RANGES } from "@/hooks/momentsFilter";
import { cn } from "@/lib/utils";

/** Keep the menus attached under their trigger; the filter bar is sticky, so collision-flipping can push them off screen. */
const FILTER_MENU = {
  side: "bottom",
  align: "end",
  sideOffset: 6,
  avoidCollisions: false,
  className: "max-h-[min(18rem,var(--radix-select-content-available-height))]",
} as const;

type Props = {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  yearFilter: string;
  onYear: (v: string) => void;
  range: string;
  onRange: (v: string) => void;
  years: number[];
  showSearch: boolean;
  showCategory: boolean;
  showYear: boolean;
};

const YearItems = ({ years }: { years: number[] }) => (
  <>
    <SelectItem value="all">All years</SelectItem>
    {years.map((y) => (
      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
    ))}
  </>
);

const RangeItems = () => (
  <>
    {RANGES.map((r) => (
      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
    ))}
  </>
);

const SearchBox = ({ search, onSearch }: Pick<Props, "search" | "onSearch">) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      value={search}
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search memories, people, tags..."
      className="h-11 rounded-xl pl-9"
    />
  </div>
);

const MobileSelects = (p: Props) => (
  <div className="flex gap-2 sm:hidden [&>*]:flex-1">
    {p.showCategory && (
      <Select value={p.category} onValueChange={p.onCategory}>
        <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent {...FILTER_MENU} align="start">
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c === "All" ? "All categories" : c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    {p.showYear && (
      <Select value={p.yearFilter} onValueChange={p.onYear}>
        <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent {...FILTER_MENU} align="center">
          <YearItems years={p.years} />
        </SelectContent>
      </Select>
    )}
    <Select value={p.range} onValueChange={p.onRange}>
      <SelectTrigger className="h-10 rounded-full border-primary-deep bg-primary/25 px-3 text-[12px] font-medium text-primary-deep" aria-label="Filter">
        <span>Filter</span>
      </SelectTrigger>
      <SelectContent {...FILTER_MENU}>
        <RangeItems />
      </SelectContent>
    </Select>
  </div>
);

const CategoryChips = ({ category, onCategory }: Pick<Props, "category" | "onCategory">) => (
  <>
    {CATEGORIES.map((c) => (
      <button
        key={c}
        onClick={() => onCategory(c)}
        className={cn(
          "flex-shrink-0 rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-all odd:-rotate-1 even:rotate-1 hover:rotate-0",
          category === c
            ? "border-solid border-primary-deep bg-primary/25 text-primary-deep"
            : "border-dashed border-foreground/30 bg-card text-muted-foreground hover:bg-muted",
        )}
      >
        {c}
      </button>
    ))}
  </>
);

const DesktopRow = (p: Props) => (
  <div className="-mx-6 -my-1 hidden gap-2 overflow-x-auto px-6 py-2 scrollbar-hide sm:flex">
    {p.showCategory && <CategoryChips category={p.category} onCategory={p.onCategory} />}
    <div className="ml-auto flex flex-shrink-0 gap-2">
      {p.showYear && (
        <Select value={p.yearFilter} onValueChange={p.onYear}>
          <SelectTrigger className="h-9 w-[130px] rounded-full border-border text-[13px]">
            <CalendarDays className="h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...FILTER_MENU}>
            <YearItems years={p.years} />
          </SelectContent>
        </Select>
      )}
      <Select value={p.range} onValueChange={p.onRange}>
        <SelectTrigger className="h-9 w-[110px] rounded-full border-primary-deep bg-primary/25 text-[13px] font-medium text-primary-deep">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
        </SelectTrigger>
        <SelectContent {...FILTER_MENU}>
          <RangeItems />
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const MomentsFilterBar = (p: Props) => (
  <div className="sticky top-[var(--topbar-h,72px)] z-30 mt-2 border-b border-border/60 bg-background/85 backdrop-blur-xl">
    <div className="mx-auto max-w-6xl space-y-3 px-6 py-3">
      {p.showSearch && <SearchBox search={p.search} onSearch={p.onSearch} />}
      <MobileSelects {...p} />
      <DesktopRow {...p} />
    </div>
  </div>
);
