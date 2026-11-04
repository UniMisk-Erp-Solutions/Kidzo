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
import { useMemories, type Memory } from "@/hooks/useMemories";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { ViewToggle } from "@/components/childbook/ViewToggle";
import { BottomNav } from "@/components/childbook/BottomNav";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { MemoryTimeline } from "@/components/childbook/MemoryTimeline";
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
  const { data: memories = [], isLoading } = useMemories(child?.id);
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
  const [showMonths, setShowMonths] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("moments:showMonths") === "1",
  );
  const [yearFilter, setYearFilter] = useState("all");

  const linkedLabelFor = (m: Memory) =>
    m.is_linked
      ? `${m.primary_child_id && nameById[m.primary_child_id] ? `From ${nameById[m.primary_child_id]}` : "Sibling's memory"}${m.relation_label ? ` · ${m.relation_label}` : ""}`
      : undefined;

  const years = useMemo(
    () => Array.from(new Set(memories.map((m) => new Date(m.happened_at).getFullYear()))).sort((a, b) => b - a),
    [memories],
  );

  useEffect(() => {
    localStorage.setItem("moments:view", view);
  }, [view]);
  useEffect(() => {
    localStorage.setItem("moments:showMonths", showMonths ? "1" : "0");
  }, [showMonths]);

  const filtered = useMemo(() => {
    const cutoff = !/^d+$/.test(range) ? null : Date.now() - parseInt(range) * 24 * 60 * 60 * 1000;
    const q = search.toLowerCase().trim();
    return memories.filter((m) => {
      if (category !== "All" && m.category !== category) return false;
      if (cutoff && new Date(m.happened_at).getTime() < cutoff) return false;
      if (yearFilter !== "all" && new Date(m.happened_at).getFullYear() !== Number(yearFilter)) return false;
      if (q) {
        const hay = `${m.title} ${m.story ?? ""} ${m.tags.join(" ")} ${m.who_was_there.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [memories, category, range, yearFilter, search]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      {/* Header banner — same style as Grow */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <PageHero
          icon={Camera}
          title="Moments"
          subtitle={momentsSubtitle(memories.length)}
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories, people, tags..."
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...FILTER_MENU} align="start">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === "All" ? "All categories" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...FILTER_MENU} align="center">
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-10 rounded-full border-border px-3 text-[12px]" aria-label="Time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...FILTER_MENU}>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="-mx-6 -my-1 hidden gap-2 overflow-x-auto px-6 py-2 scrollbar-hide sm:flex">
            {CATEGORIES.map((c) => (
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
              <Select value={yearFilter} onValueChange={setYearFilter}>
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
              </Select>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="h-9 w-[140px] rounded-full border-border text-[13px]">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
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
        {memories.length > 0 && <Flashbacks memories={memories} variant="strip" />}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasAny={memories.length > 0}
            onCreate={canEdit ? () => navigate("/moments/new") : undefined}
          />
        ) : view === "timeline" ? (
          <div className="space-y-4">
            <label className="ml-auto flex w-fit cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={showMonths}
                onChange={(e) => setShowMonths(e.target.checked)}
                className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
              />
              Month markers
            </label>
            <MemoryTimeline
              memories={sortMemories(filtered, range === "newest" ? "desc" : "asc")}
              onOpen={setOpen}
              showMonths={showMonths}
              linkedLabelFor={linkedLabelFor}
            />
          </div>
        ) : (
          // Grid: the same year-by-year rows as the timeline, newest year first.
          <MemoryTimeline
            memories={sortMemories(filtered, range === "oldest" ? "asc" : "desc")}
            onOpen={setOpen}
            linkedLabelFor={linkedLabelFor}
          />
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
