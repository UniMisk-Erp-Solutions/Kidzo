import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Camera, Filter, Sparkles, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { useChildren } from "@/hooks/useChildren";
import { type Memory } from "@/hooks/useMemories";
import { useMemoryYears, useMemoriesInYears, useMonthFlashbackMemories, YEARS_PER_PAGE } from "@/hooks/useMemoryPages";
import { YearPager } from "@/components/childbook/YearPager";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { ViewToggle } from "@/components/childbook/ViewToggle";
import { BottomNav } from "@/components/childbook/BottomNav";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { MemoryTimeline } from "@/components/childbook/MemoryTimeline";
import { MemoryRoute } from "@/components/childbook/MemoryRoute";
import { Flashbacks } from "@/components/childbook/Flashbacks";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];
const RANGES = [
  { value: "all", label: "All time" },
  { value: "newest", label: "Newest to oldest" },
  { value: "oldest", label: "Oldest to newest" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "365", label: "Last year" },
];

/** Keep the menus attached under their trigger; the filter bar is sticky, so collision-flipping can push them off screen. */
const FILTER_MENU = {
  side: "bottom",
  align: "end",
  sideOffset: 6,
  avoidCollisions: false,
  className: "max-h-[min(18rem,var(--radix-select-content-available-height))]",
} as const;

/** The timeline shows 6 years a page, the grid 3. */
const yearsPerPage = (view: "grid" | "timeline") => (view === "timeline" ? 6 : YEARS_PER_PAGE);

const sortMemories = (list: Memory[], dir: "asc" | "desc") =>
  [...list].sort((a, b) => {
    const d = new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime();
    return dir === "asc" ? d : -d;
  });

const momentsSubtitle = (count: number) =>
  count > 0 ? `${count} ${count === 1 ? "memory" : "memories"} captured ✨` : "Capture the little moments that matter.";

const Moments = () => {
  const navigate = useNavigate();
  const { data: child } = useActiveChild();
  const { canEdit } = useCanEditChild(child?.id);
  const { data: allKids = [] } = useChildren();
  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of allKids) map[c.id] = c.name;
    return map;
  }, [allKids]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState<Memory | null>(null);
  const [view, setView] = useState<"grid" | "timeline">(
    () => (typeof window !== "undefined" && (localStorage.getItem("moments:view") as "grid" | "timeline")) || "grid",
  );
  const [yearFilter, setYearFilter] = useState("all");
  const [yearOpen, setYearOpen] = useState(false);

  // ── Server-side paging: the year index and every page of memories come from the server, filtered there. ──
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const since = useMemo(
    () => (/^\d+$/.test(range) ? new Date(Date.now() - parseInt(range) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null),
    [range],
  );
  const filters = useMemo(() => ({ since, query: debouncedSearch, category }), [since, debouncedSearch, category]);

  // Unfiltered index: banner count, the year picker, and the Flashbacks candidates.
  const { data: allIndex, isLoading: indexLoading } = useMemoryYears(child?.id);
  // Filtered index: which years have matches, newest first (oldest first for "Oldest to newest").
  const { data: filteredIndex, isLoading: filteredIndexLoading } = useMemoryYears(child?.id, filters);
  const allTotal = allIndex?.total ?? 0;
  const flashbackMemories = useMonthFlashbackMemories(child?.id, allIndex?.rows).data ?? [];

  const filteredYears = useMemo(() => {
    let ys = filteredIndex?.years ?? [];
    if (yearFilter !== "all") ys = ys.filter((y) => y === Number(yearFilter));
    return range === "oldest" ? [...ys].reverse() : ys;
  }, [filteredIndex, yearFilter, range]);
  const perPage = yearsPerPage(view);
  const pageCount = Math.max(1, Math.ceil(filteredYears.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const pageYears = filteredYears.slice(safePage * perPage, (safePage + 1) * perPage);
  useEffect(() => {
    setPage(0);
  }, [since, debouncedSearch, category, yearFilter, range, view]);
  const { data: pageMemories = [], isLoading: pageLoading } = useMemoriesInYears(
    child?.id,
    pageYears.length ? Math.min(...pageYears) : undefined,
    pageYears.length ? Math.max(...pageYears) : undefined,
    filters,
  );
  const isLoading = indexLoading || filteredIndexLoading || (pageLoading && pageYears.length > 0);

  const linkedLabelFor = (m: Memory) =>
    m.is_linked
      ? `${m.primary_child_id && nameById[m.primary_child_id] ? `From ${nameById[m.primary_child_id]}` : "Sibling's memory"}${m.relation_label ? ` · ${m.relation_label}` : ""}`
      : undefined;

  const years = allIndex?.years ?? [];

  useEffect(() => {
    localStorage.setItem("moments:view", view);
  }, [view]);

  // Timeline: the year cards page only offers Filter; once a year is open, categories appear. The year filter is never needed there.
  const onYearCards = view === "timeline" && !yearOpen;
  const showCategory = !onYearCards;
  const showYear = view !== "timeline";
  useEffect(() => {
    if (view !== "timeline") return;
    if (yearFilter !== "all") setYearFilter("all");
    if (onYearCards && category !== "All") setCategory("All");
    if (onYearCards && search) setSearch("");
  }, [view, onYearCards, yearFilter, category, search]);

  // Search is applied by the server (see applyFilters), so the page is shown as it arrives.
  const filtered = pageMemories;

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      {/* Header banner — same style as Grow */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <PageHero
          icon={Camera}
          title="Moments"
          subtitle={momentsSubtitle(allTotal)}
          actions={
            <>
              <ViewToggle view={view} onChange={setView} />
              {canEdit && (
                <Button variant="outline" size="sm" className="border-white/60 bg-white/85 text-plum hover:bg-white" onClick={() => navigate("/moments/new")}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[var(--topbar-h,72px)] z-30 mt-2 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl space-y-3 px-6 py-3">
          {!onYearCards && <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories, people, tags..."
              className="h-11 rounded-xl pl-9"
            />
          </div>}
          <div className="flex gap-2 sm:hidden [&>*]:flex-1">
            {showCategory && <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...FILTER_MENU} align="start">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === "All" ? "All categories" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>}
            {showYear && <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...FILTER_MENU} align="center">
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>}
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-10 rounded-full border-primary-deep bg-primary/25 px-3 text-[12px] font-medium text-primary-deep" aria-label="Filter">
                <span>Filter</span>
              </SelectTrigger>
              <SelectContent {...FILTER_MENU}>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="-mx-6 -my-1 hidden gap-2 overflow-x-auto px-6 py-2 scrollbar-hide sm:flex">
            {showCategory && CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
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
            <div className="ml-auto flex flex-shrink-0 gap-2">
              {showYear && <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-9 w-[130px] rounded-full border-border text-[13px]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent {...FILTER_MENU}>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>}
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="h-9 w-[110px] rounded-full border-primary-deep bg-primary/25 text-[13px] font-medium text-primary-deep">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </SelectTrigger>
                <SelectContent {...FILTER_MENU}>
                  {RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {allTotal > 0 && !(view === "timeline" && yearOpen) && <Flashbacks memories={flashbackMemories} variant="strip" />}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : view === "timeline" && allTotal > 0 ? (
          <MemoryRoute
            memories={sortMemories(filtered, range === "newest" ? "desc" : "asc")}
            onOpen={setOpen}
            linkedLabelFor={linkedLabelFor}
            onYearOpenChange={setYearOpen}
            category={category}
            onCreate={canEdit ? () => navigate("/moments/new") : undefined}
            fallback={<EmptyState hasAny onCreate={canEdit ? () => navigate("/moments/new") : undefined} />}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasAny={allTotal > 0}
            onCreate={canEdit ? () => navigate("/moments/new") : undefined}
          />
        ) : (
          // Grid: the same year-by-year rows as the timeline, newest year first.
          <MemoryTimeline
            memories={sortMemories(filtered, range === "oldest" ? "asc" : "desc")}
            onOpen={setOpen}
            linkedLabelFor={linkedLabelFor}
          />
        )}
        {!(view === "timeline" && yearOpen) && (
          <YearPager page={safePage} pageCount={pageCount} years={pageYears} loading={pageLoading} onPage={setPage} />
        )}
      </main>

      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
      <BottomNav />
    </div>
  );
};

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

export default Moments;
