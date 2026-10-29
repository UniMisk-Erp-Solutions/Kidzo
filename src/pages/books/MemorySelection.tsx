import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, isSameDay, isSameMonth } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  Tag,
  ImageIcon,
  List,
  Loader2,
  Lock,
  Plus,
  Scale,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useUserBook, useUpdateUserBook } from "@/hooks/useUserBooks";
import { useBookTemplates } from "@/hooks/useBookTemplates";
import { useMemories, type Memory } from "@/hooks/useMemories";
import { useChildren } from "@/hooks/useChildren";
import { useEntitlements } from "@/hooks/useEntitlements";
import { MemoryCalendar } from "@/components/books/MemoryCalendar";
import { SelectedMemoriesList } from "@/components/books/SelectedMemoriesList";
import { smartPickMemories, balancedPickMemories } from "@/lib/smartPickMemories";
import { cn } from "@/lib/utils";

type ViewMode = "calendar" | "list";

const MemorySelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: book, isLoading: bookLoading } = useUserBook(id);
  const { data: templates } = useBookTemplates();
  const { data: children } = useChildren();
  const { data: memories = [], isLoading: memoriesLoading } = useMemories(book?.child_id);
  const update = useUpdateUserBook();
  const { can, loading: entLoading } = useEntitlements();
  const canBuild = can("photo_book_orders");

  const child = children?.find((c) => c.id === book?.child_id);
  const template = templates?.find((t) => t.id === book?.template_id);
  const target = template?.pages_needed ?? 24;

  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate from book — and smart-pick on first entry if nothing is selected.
  useEffect(() => {
    if (!book || hasHydrated || memories.length === 0) return;
    const existing = (book.memories_selected ?? []) as string[];
    if (existing.length > 0) {
      setSelected(existing);
    } else {
      const picked = smartPickMemories(memories, target);
      setSelected(picked);
      if (picked.length > 0) {
        toast.success(`Auto-picked ${picked.length} memories spread across ${child?.name ?? "your child"}'s journey`);
      }
    }
    setHasHydrated(true);
  }, [book, memories, target, hasHydrated, child?.name]);

  const memoriesById = useMemo(() => {
    const map: Record<string, Memory> = {};
    memories.forEach((m) => (map[m.id] = m));
    return map;
  }, [memories]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => m.category && set.add(m.category));
    return Array.from(set).sort();
  }, [memories]);

  const yearGroups = useMemo(() => {
    const map = new Map<number, Memory[]>();
    memories.forEach((m) => {
      const y = new Date(m.happened_at).getFullYear();
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [memories]);

  // Memories shown in the right pane (depends on viewMode + filters).
  const visible = useMemo(() => {
    return memories.filter((m) => {
      if (categoryFilter && m.category !== categoryFilter) return false;
      if (yearFilter && new Date(m.happened_at).getFullYear() !== yearFilter) return false;
      if (viewMode === "calendar") {
        const d = new Date(m.happened_at);
        if (selectedDate && !isSameDay(d, selectedDate)) return false;
        if (!selectedDate && !isSameMonth(d, month)) return false;
      }
      return true;
    });
  }, [memories, categoryFilter, yearFilter, viewMode, month, selectedDate]);

  const toggle = (mid: string) => {
    setSelected((prev) => (prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid]));
  };

  const selectAll = () => setSelected(memories.map((m) => m.id));
  const clearAll = () => setSelected([]);

  const smartPick = () => {
    const picked = smartPickMemories(memories, target);
    setSelected(picked);
    toast.success(`Auto-picked ${picked.length} memories`);
  };

  const balancedPick = () => {
    const picked = balancedPickMemories(memories, target);
    setSelected(picked);
    toast.success(`Balanced ${picked.length} memories across years & categories`);
  };

  const handleContinue = async () => {
    if (!book) return;
    if (!canBuild) {
      toast.error("Upgrade to move ahead", {
        description: "Building, previewing and ordering a book is available on the Family and Premium plans.",
        action: { label: "See plans", onClick: () => navigate("/pricing-plans") },
      });
      return;
    }
    try {
      await update.mutateAsync({ id: book.id, patch: { memories_selected: selected } });
      navigate(`/books/${book.id}/customize`);
    } catch {
      toast.error("Could not save your selection");
    }
  };

  if (bookLoading || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressPct = Math.min(100, Math.round((selected.length / target) * 100));
  const allSelected = selected.length === memories.length && memories.length > 0;

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-44">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/books")} className="-ml-3 mb-3">
          <ArrowLeft className="h-4 w-4" /> My books
        </Button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step 1 of 4
            </div>
            <h1 className="font-display mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Choose your memories</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Template: <span className="font-medium text-foreground">{template?.name ?? "—"}</span> · Target {target} pages
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Selected</div>
              <div className="text-[18px] font-bold">
                {selected.length}{" "}
                <span className="text-[13px] font-normal text-muted-foreground">/ {target}</span>
              </div>
            </div>
            <div className="h-10 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bulk action bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
          <Button size="sm" variant="default" onClick={smartPick} className="gap-1.5" title="Spread evenly across the timeline">
            <Wand2 className="h-3.5 w-3.5" /> Smart pick {target}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={balancedPick}
            className="gap-1.5"
            title="Balance evenly across years AND categories"
          >
            <Scale className="h-3.5 w-3.5" /> Balanced {target}
          </Button>
          <div className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Button size="sm" variant="outline" onClick={allSelected ? clearAll : selectAll} className="gap-1.5">
            {allSelected ? <Square className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
            {allSelected ? "Deselect all" : `Select all (${memories.length})`}
          </Button>

          {yearGroups.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {yearFilter ? `Year: ${yearFilter}` : "Browse by year"}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2">
                <DropdownMenuLabel className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Jump to a year
                </DropdownMenuLabel>
                <div className="max-h-72 overflow-y-auto">
                  <DropdownMenuItem
                    onSelect={() => setYearFilter(null)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2"
                  >
                    <span className="flex-1 text-[14px] font-semibold text-foreground">All years</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{memories.length}</span>
                    {yearFilter === null && <Check className="h-4 w-4 text-primary-deep" />}
                  </DropdownMenuItem>
                  {yearGroups.map(([year, items]) => {
                    const picked = items.filter((m) => selected.includes(m.id)).length;
                    return (
                      <DropdownMenuItem
                        key={year}
                        onSelect={() => {
                          setYearFilter(year);
                          setViewMode("list");
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2"
                      >
                        <span className="font-display flex-1 text-[15px] font-bold text-foreground">{year}</span>
                        {picked > 0 && (
                          <span className="text-[11px] text-primary-deep">{picked} picked</span>
                        )}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{items.length}</span>
                        {yearFilter === year && <Check className="h-4 w-4 text-primary-deep" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {categoryFilter ? `Category: ${categoryFilter}` : "Browse by category"}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2">
                <DropdownMenuLabel className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Jump to a category
                </DropdownMenuLabel>
                <div className="max-h-72 overflow-y-auto">
                  <DropdownMenuItem
                    onSelect={() => setCategoryFilter(null)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2"
                  >
                    <span className="flex-1 text-[14px] font-semibold text-foreground">All categories</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{memories.length}</span>
                    {categoryFilter === null && <Check className="h-4 w-4 text-primary-deep" />}
                  </DropdownMenuItem>
                  {categories.map((cat) => {
                    const items = memories.filter((m) => m.category === cat);
                    const picked = items.filter((m) => selected.includes(m.id)).length;
                    return (
                      <DropdownMenuItem
                        key={cat}
                        onSelect={() => {
                          setCategoryFilter(cat);
                          setViewMode("list");
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2"
                      >
                        <span className="flex-1 text-[14px] font-semibold capitalize text-foreground">{cat}</span>
                        {picked > 0 && <span className="text-[11px] text-primary-deep">{picked} picked</span>}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{items.length}</span>
                        {categoryFilter === cat && <Check className="h-4 w-4 text-primary-deep" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-10">
          {/* Left: calendar (in calendar mode) + selected list */}
          <div className="space-y-6">
            {viewMode === "calendar" && (
              <MemoryCalendar
                memories={memories}
                month={month}
                onMonthChange={setMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold">Your selection</h2>
                {selected.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[12px] text-muted-foreground hover:text-destructive"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <SelectedMemoriesList
                selectedIds={selected}
                memoriesById={memoriesById}
                onReorder={setSelected}
                onRemove={(rid) => setSelected((prev) => prev.filter((x) => x !== rid))}
              />
            </div>
          </div>

          {/* Right: memory browser */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4">
              <div className="flex items-center gap-3">
                {/* View toggle */}
                <div className="flex rounded-lg border bg-muted/30 p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                      viewMode === "list"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <List className="h-3.5 w-3.5" /> List
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                      viewMode === "calendar"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CalendarDays className="h-3.5 w-3.5" /> Calendar
                  </button>
                </div>

                {/* Year filter chip: jump to a year, then pick or drop individual memories */}
                {yearFilter && (
                  <>
                    <button
                      onClick={() => setYearFilter(null)}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-deep hover:bg-primary/20"
                    >
                      {yearFilter} ×
                    </button>
                  </>
                )}

                {/* Category filter chip */}
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
                  >
                    {categoryFilter} ×
                  </button>
                )}

                {(yearFilter || categoryFilter) && (
                <button
                  onClick={() => {
                    const ids = visible.map((m) => m.id);
                    const allIn = ids.length > 0 && ids.every((id) => selected.includes(id));
                    setSelected((prev) =>
                      allIn ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])),
                    );
                  }}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  {visible.length > 0 && visible.every((m) => selected.includes(m.id))
                    ? `Deselect these ${visible.length}`
                    : `Select these ${visible.length}`}
                </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold">{visible.length}</span>
                <span className="text-muted-foreground">
                  {viewMode === "calendar"
                    ? selectedDate
                      ? `on ${format(selectedDate, "PP")}`
                      : `in ${format(month, "MMMM yyyy")}`
                    : "memories"}
                </span>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/moments/new">
                    <Plus className="h-4 w-4" /> Add photo
                  </Link>
                </Button>
              </div>
            </div>

            {memoriesLoading ? (
              <div className="flex items-center justify-center rounded-2xl border bg-card py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-[14px] font-semibold">No memories here yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Pick another month or add new moments to use in this book.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/moments/new">
                    <Plus className="h-4 w-4" /> New memory
                  </Link>
                </Button>
              </div>
            ) : viewMode === "list" ? (
              // Grouped checklist by year → month
              <YearGroupedList
                memories={visible}
                selected={selected}
                onToggle={toggle}
                onSelectGroup={(ids) =>
                  setSelected((prev) => Array.from(new Set([...prev, ...ids])))
                }
                onDeselectGroup={(ids) => {
                  const idSet = new Set(ids);
                  setSelected((prev) => prev.filter((x) => !idSet.has(x)));
                }}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visible.map((m) => (
                  <MemoryRow
                    key={m.id}
                    memory={m}
                    checked={selected.includes(m.id)}
                    onToggle={() => toggle(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{selected.length}</span> of {target} selected
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/books")}>
              Back
            </Button>
            <Button
              onClick={handleContinue}
              variant={!entLoading && !canBuild ? "warm" : "default"}
              disabled={selected.length === 0 || update.isPending || entLoading}
            >
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !entLoading && !canBuild ? (
                <>
                  <Lock className="h-4 w-4" /> Upgrade to continue
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

const MemoryRow = ({
  memory,
  checked,
  onToggle,
}: {
  memory: Memory;
  checked: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={cn(
      "group flex items-center gap-4 rounded-2xl border bg-card p-4 text-left transition hover:border-primary",
      checked && "border-primary bg-primary/5",
    )}
  >
    <Checkbox checked={checked} className="pointer-events-none" />
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
      {memory.photo_url ? (
        <img
          src={memory.photo_url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-[14px] font-medium">{memory.title}</div>
      <div className="text-[11px] text-muted-foreground">
        {format(new Date(memory.happened_at), "PP")} · {memory.category}
      </div>
    </div>
  </button>
);

const YearGroupedList = ({
  memories,
  selected,
  onToggle,
  onSelectGroup,
  onDeselectGroup,
}: {
  memories: Memory[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectGroup: (ids: string[]) => void;
  onDeselectGroup: (ids: string[]) => void;
}) => {
  const grouped = useMemo(() => {
    const map = new Map<string, Memory[]>();
    [...memories]
      .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime())
      .forEach((m) => {
        const key = format(new Date(m.happened_at), "yyyy-MM");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(m);
      });
    return Array.from(map.entries());
  }, [memories]);

  return (
    <div className="space-y-8">
      {grouped.map(([key, items]) => {
        const ids = items.map((m) => m.id);
        const allChecked = ids.every((i) => selected.includes(i));
        const label = format(new Date(key + "-01"), "MMMM yyyy");
        return (
          <div key={key} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold">{label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <button
                onClick={() => (allChecked ? onDeselectGroup(ids) : onSelectGroup(ids))}
                className="text-[12px] font-medium text-primary hover:underline"
              >
                {allChecked ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {items.map((m) => (
                <MemoryRow
                  key={m.id}
                  memory={m}
                  checked={selected.includes(m.id)}
                  onToggle={() => onToggle(m.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemorySelection;
