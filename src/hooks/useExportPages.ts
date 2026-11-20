import { useMemo, useState } from "react";
import { useMemoryYears, useMemoriesInYears, YEARS_PER_PAGE } from "@/hooks/useMemoryPages";
import { buildYearGroups, orderPageMemories, yearOf } from "@/lib/exportShareHelpers";

/** Paged years (6 per page), the memories of the current page, their order and which years are open. */
export const useExportPages = (childId?: string) => {
  const { data: yearIndex } = useMemoryYears(childId);
  const [page, setPage] = useState(0);
  const [orderByYear, setOrderByYear] = useState<Record<number, string[]>>({});
  const [openYearsState, setOpenYearsState] = useState<{ page: number; years: Set<number> } | null>(null);

  const years = useMemo(() => yearIndex?.years ?? [], [yearIndex]);
  const totalMemories = yearIndex?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(years.length / YEARS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageYears = years.slice(safePage * YEARS_PER_PAGE, (safePage + 1) * YEARS_PER_PAGE);
  const { data: pageMemories = [], isFetching: pageLoading } = useMemoriesInYears(
    childId,
    pageYears[pageYears.length - 1],
    pageYears[0],
  );

  const orderedPage = useMemo(() => orderPageMemories(pageMemories, orderByYear), [pageMemories, orderByYear]);
  const yearGroups = useMemo(() => buildYearGroups(orderedPage), [orderedPage]);

  const openYears =
    openYearsState && openYearsState.page === safePage
      ? openYearsState.years
      : new Set(yearGroups.length ? [yearGroups[0].year] : []);
  const toggleYear = (year: number) => {
    const next = new Set(openYears);
    if (!next.delete(year)) next.add(year);
    setOpenYearsState({ page: safePage, years: next });
  };

  // Swap two neighbours (same year) of this page; idx refers to `orderedPage`.
  const swap = (a: number, b: number | undefined) => {
    if (b === undefined || b < 0 || b >= orderedPage.length) return;
    const ma = orderedPage[a];
    const mb = orderedPage[b];
    const y = yearOf(ma);
    if (y !== yearOf(mb)) return;
    const ids = orderedPage.filter((m) => yearOf(m) === y).map((m) => m.id);
    const ia = ids.indexOf(ma.id);
    const ib = ids.indexOf(mb.id);
    [ids[ia], ids[ib]] = [ids[ib], ids[ia]];
    setOrderByYear({ ...orderByYear, [y]: ids });
  };

  return {
    years,
    totalMemories,
    pageCount,
    safePage,
    pageYears,
    pageLoading,
    setPage,
    orderByYear,
    orderedPage,
    yearGroups,
    openYears,
    toggleYear,
    swap,
  };
};
