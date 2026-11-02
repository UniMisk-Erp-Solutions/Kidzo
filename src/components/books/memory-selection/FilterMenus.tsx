import type { ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Memory } from "@/hooks/useMemories";

const pickedIn = (items: Memory[], selected: string[]) => items.filter((m) => selected.includes(m.id)).length;

const COUNT_PILL = "rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground";

interface RowProps {
  label: string;
  labelClass: string;
  picked: number;
  count: number;
  active: boolean;
  onSelect: () => void;
}

const MenuRow = ({ label, labelClass, picked, count, active, onSelect }: RowProps) => (
  <DropdownMenuItem onSelect={onSelect} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2">
    <span className={labelClass}>{label}</span>
    {picked > 0 && <span className="text-[11px] text-primary-deep">{picked} picked</span>}
    <span className={COUNT_PILL}>{count}</span>
    {active && <Check className="h-4 w-4 text-primary-deep" />}
  </DropdownMenuItem>
);

interface MenuProps {
  icon: ReactNode;
  label: string;
  heading: string;
  children: ReactNode;
}

const FilterMenu = ({ icon, label, heading, children }: MenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="sm" variant="outline" className="gap-1.5">
        {icon}
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2">
      <DropdownMenuLabel className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {heading}
      </DropdownMenuLabel>
      <div className="max-h-72 overflow-y-auto">{children}</div>
    </DropdownMenuContent>
  </DropdownMenu>
);

interface YearMenuProps {
  yearGroups: [number, Memory[]][];
  total: number;
  selected: string[];
  yearFilter: number | null;
  onPick: (year: number | null) => void;
}

export const YearMenu = ({ yearGroups, total, selected, yearFilter, onPick }: YearMenuProps) => (
  <FilterMenu
    icon={<CalendarDays className="h-3.5 w-3.5" />}
    label={yearFilter ? `Year: ${yearFilter}` : "Browse by year"}
    heading="Jump to a year"
  >
    <MenuRow
      label="All years"
      labelClass="flex-1 text-[14px] font-semibold text-foreground"
      picked={0}
      count={total}
      active={yearFilter === null}
      onSelect={() => onPick(null)}
    />
    {yearGroups.map(([year, items]) => (
      <MenuRow
        key={year}
        label={String(year)}
        labelClass="font-display flex-1 text-[15px] font-bold text-foreground"
        picked={pickedIn(items, selected)}
        count={items.length}
        active={yearFilter === year}
        onSelect={() => onPick(year)}
      />
    ))}
  </FilterMenu>
);

interface CategoryMenuProps {
  categories: string[];
  memories: Memory[];
  selected: string[];
  categoryFilter: string | null;
  onPick: (category: string | null) => void;
}

export const CategoryMenu = ({ categories, memories, selected, categoryFilter, onPick }: CategoryMenuProps) => (
  <FilterMenu
    icon={<Tag className="h-3.5 w-3.5" />}
    label={categoryFilter ? `Category: ${categoryFilter}` : "Browse by category"}
    heading="Jump to a category"
  >
    <MenuRow
      label="All categories"
      labelClass="flex-1 text-[14px] font-semibold text-foreground"
      picked={0}
      count={memories.length}
      active={categoryFilter === null}
      onSelect={() => onPick(null)}
    />
    {categories.map((cat) => {
      const items = memories.filter((m) => m.category === cat);
      return (
        <MenuRow
          key={cat}
          label={cat}
          labelClass="flex-1 text-[14px] font-semibold capitalize text-foreground"
          picked={pickedIn(items, selected)}
          count={items.length}
          active={categoryFilter === cat}
          onSelect={() => onPick(cat)}
        />
      );
    })}
  </FilterMenu>
);
