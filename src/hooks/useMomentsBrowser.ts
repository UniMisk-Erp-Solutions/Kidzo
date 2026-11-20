import { useEffect, useMemo, useState } from "react";
import { useMemoryYears, useMemoriesInYears, useMonthFlashbackMemories, YEARS_PER_PAGE } from "@/hooks/useMemoryPages";

export type MomentsView = "grid" | "timeline";

const VIEW_KEY = "moments:view";

/** Grid or timeline, remembered between visits. */
export function useStoredView() {
  const [view, setView] = useState<MomentsView>(() => (localStorage.getItem(VIEW_KEY) === "timeline" ? "timeline" : "grid"));
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);
  return [view, setView] as const;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "30" / "90" / "365" mean "the last N days"; the other range values are sort orders and have no cut-off date. */
const sinceFor = (range: string): string | null =>
  /^\d+$/.test(range) ? new Date(Date.now() - parseInt(range, 10) * DAY_MS).toISOString().slice(0, 10) : null;

/** The timeline shows 6 years a page, the grid 3. */
const yearsPerPage = (view: MomentsView) => (view === "timeline" ? 6 : YEARS_PER_PAGE);

type PagingInput = {
  years: number[] | undefined;
  yearFilter: string;
  range: string;
  view: MomentsView;
  page: number;
  onReset: () => void;
  resetKey: string;
};

/** Which years are on the current page: the matching years, narrowed by the year filter and cut into pages. */
function useYearPaging({ years, yearFilter, range, view, page, onReset, resetKey }: PagingInput) {
  const filteredYears = useMemo(() => {
    const matching = (years ?? []).filter((y) => yearFilter === "all" || y === Number(yearFilter));
    return range === "oldest" ? [...matching].reverse() : matching;
  }, [years, yearFilter, range]);

  const perPage = yearsPerPage(view);
  const pageCount = Math.max(1, Math.ceil(filteredYears.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const pageYears = filteredYears.slice(safePage * perPage, (safePage + 1) * perPage);

  useEffect(() => {
    onReset();
  }, [resetKey, onReset]);

  return { pageYears, pageCount, safePage };
}

type ResetInput = {
  view: MomentsView;
  onYearCards: boolean;
  yearFilter: string;
  category: string;
  search: string;
  setYearFilter: (v: string) => void;
  setCategory: (v: string) => void;
  setSearch: (v: string) => void;
};

/** Timeline: no year filter at all, and on the year cards page no category or search either. */
function useTimelineFilterReset(r: ResetInput) {
  const { view, onYearCards, yearFilter, category, search, setYearFilter, setCategory, setSearch } = r;
  useEffect(() => {
    if (view !== "timeline") return;
    if (yearFilter !== "all") setYearFilter("all");
    if (!onYearCards) return;
    if (category !== "All") setCategory("All");
    if (search) setSearch("");
  }, [view, onYearCards, yearFilter, category, search, setYearFilter, setCategory, setSearch]);
}

/**
 * Everything the Moments page needs from the server: the filters, the year index, one page of memories and the
 * flashback candidates. Filtering and paging happen on the server; this only holds the choices.
 */
export function useMomentsBrowser(childId: string | undefined, view: MomentsView, onYearCards: boolean) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [range, setRange] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounced(search, 350);
  const since = useMemo(() => sinceFor(range), [range]);
  const filters = useMemo(() => ({ since, query: debouncedSearch, category }), [since, debouncedSearch, category]);

  // Unfiltered index: banner count, the year picker, and the Flashbacks candidates.
  const all = useMemoryYears(childId);
  // Filtered index: which years have matches.
  const matches = useMemoryYears(childId, filters);
  const flashbackMemories = useMonthFlashbackMemories(childId, all.data?.rows).data ?? [];

  const { pageYears, pageCount, safePage } = useYearPaging({
    years: matches.data?.years,
    yearFilter,
    range,
    view,
    page,
    onReset: () => setPage(0),
    resetKey: [since, debouncedSearch, category, yearFilter, range, view].join("|"),
  });
  useTimelineFilterReset({ view, onYearCards, yearFilter, category, search, setYearFilter, setCategory, setSearch });

  const hasYears = pageYears.length > 0;
  const pageQuery = useMemoriesInYears(childId, hasYears ? Math.min(...pageYears) : undefined, hasYears ? Math.max(...pageYears) : undefined, filters);

  return {
    search, setSearch, category, setCategory, range, setRange, yearFilter, setYearFilter,
    allTotal: all.data?.total ?? 0,
    years: all.data?.years ?? [],
    flashbackMemories,
    memories: pageQuery.data ?? [],
    isLoading: all.isLoading || matches.isLoading || (pageQuery.isLoading && hasYears),
    pageLoading: pageQuery.isLoading,
    pageYears, pageCount, safePage, setPage,
  };
}
