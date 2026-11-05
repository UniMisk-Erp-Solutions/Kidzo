import { useMemo, useState } from "react";
import { isSameDay, isSameMonth } from "date-fns";
import type { Memory } from "@/hooks/useMemories";

export type ViewMode = "calendar" | "list";

const yearOf = (m: Memory) => new Date(m.happened_at).getFullYear();

const matchesFacets = (m: Memory, category: string | null, year: number | null) => {
  if (category && m.category !== category) return false;
  if (year && yearOf(m) !== year) return false;
  return true;
};

/** Calendar view shows the picked day, or else the whole month being browsed. */
const inCalendarWindow = (m: Memory, day: Date | null, month: Date) => {
  const d = new Date(m.happened_at);
  return day ? isSameDay(d, day) : isSameMonth(d, month);
};

const groupByYear = (memories: Memory[]): [number, Memory[]][] => {
  const map = new Map<number, Memory[]>();
  memories.forEach((m) => {
    const list = map.get(yearOf(m)) ?? [];
    list.push(m);
    map.set(yearOf(m), list);
  });
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
};

const uniqueCategories = (memories: Memory[]) => {
  const set = new Set<string>();
  memories.forEach((m) => m.category && set.add(m.category));
  return Array.from(set).sort();
};

/** Filter + view state for the "Choose your memories" step, and the memories that pass the filters. */
export function useMemoryFilters(memories: Memory[]) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const categories = useMemo(() => uniqueCategories(memories), [memories]);
  const yearGroups = useMemo(() => groupByYear(memories), [memories]);

  // Memories shown in the right pane (depends on viewMode + filters).
  const visible = useMemo(
    () =>
      memories.filter(
        (m) =>
          matchesFacets(m, categoryFilter, yearFilter) &&
          (viewMode !== "calendar" || inCalendarWindow(m, selectedDate, month)),
      ),
    [memories, categoryFilter, yearFilter, viewMode, month, selectedDate],
  );

  // Picking a specific year/category jumps to the list; "All" just clears the filter.
  const pickYear = (year: number | null) => {
    setYearFilter(year);
    if (year !== null) setViewMode("list");
  };
  const pickCategory = (category: string | null) => {
    setCategoryFilter(category);
    if (category !== null) setViewMode("list");
  };

  return {
    viewMode,
    setViewMode,
    month,
    setMonth,
    selectedDate,
    setSelectedDate,
    categoryFilter,
    setCategoryFilter,
    yearFilter,
    setYearFilter,
    categories,
    yearGroups,
    visible,
    pickYear,
    pickCategory,
  };
}
