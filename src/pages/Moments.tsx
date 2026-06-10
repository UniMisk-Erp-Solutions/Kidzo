import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ImageIcon, Filter, Sparkles, LayoutGrid, GitCommitVertical } from "lucide-react";
import { format } from "date-fns";
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
import { useChildren } from "@/hooks/useChildren";
import { useMemories, type Memory } from "@/hooks/useMemories";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { MemoryTimeline } from "@/components/childbook/MemoryTimeline";
import { Flashbacks } from "@/components/childbook/Flashbacks";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];
const RANGES = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "365", label: "Last year" },
];

const tagStyles: Record<string, string> = {
  Milestone: "bg-accent/40 text-accent-foreground",
  Celebration: "bg-secondary/30 text-secondary",
  Everyday: "bg-primary/30 text-primary-deep",
  Cozy: "bg-muted text-muted-foreground",
  Adventure: "bg-success/25 text-success",
  Family: "bg-warning/25 text-warning-foreground",
};

const Moments = () => {
  const navigate = useNavigate();
  const { data: child } = useActiveChild();
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
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const yearRefs = useRef<Record<number, HTMLElement | null>>({});

  useEffect(() => {
    localStorage.setItem("moments:view", view);
  }, [view]);
  useEffect(() => {
    localStorage.setItem("moments:showMonths", showMonths ? "1" : "0");
  }, [showMonths]);

  const filtered = useMemo(() => {
    const cutoff = range === "all" ? null : Date.now() - parseInt(range) * 24 * 60 * 60 * 1000;
    const q = search.toLowerCase().trim();
    return memories.filter((m) => {
      if (category !== "All" && m.category !== category) return false;
      if (cutoff && new Date(m.happened_at).getTime() < cutoff) return false;
      if (q) {
        const hay = `${m.title} ${m.story ?? ""} ${m.tags.join(" ")} ${m.who_was_there.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [memories, category, range, search]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      {/* Sticky filter bar */}
      <div className="sticky top-[57px] z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl space-y-3 px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Moments</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  aria-label="Grid view"
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors",
                    view === "grid"
                      ? "bg-primary/25 text-primary-deep"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("timeline")}
                  aria-pressed={view === "timeline"}
                  aria-label="Timeline view"
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors",
                    view === "timeline"
                      ? "bg-primary/25 text-primary-deep"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <GitCommitVertical className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Timeline</span>
                </button>
              </div>
              <Button variant="warm" size="sm" onClick={() => navigate("/moments/new")}>
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories, people, tags..."
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "flex-shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
                  category === c
                    ? "border-primary-deep bg-primary/25 text-primary-deep"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {c}
              </button>
            ))}
            <div className="ml-auto flex-shrink-0">
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="h-9 w-[140px] rounded-full border-border text-[13px]">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        {memories.length > 0 && <Flashbacks memories={memories} variant="strip" />}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={memories.length > 0} onCreate={() => navigate("/moments/new")} />
        ) : view === "timeline" ? (
          (() => {
            const sorted = [...filtered].sort(
              (a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime(),
            );
            const years = Array.from(
              new Set(sorted.map((m) => new Date(m.happened_at).getFullYear())),
            );
            const visible =
              yearFilter === "all"
                ? sorted
                : sorted.filter((m) => new Date(m.happened_at).getFullYear() === yearFilter);
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setYearFilter("all")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                        yearFilter === "all"
                          ? "border-primary-deep bg-primary/25 text-primary-deep"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      All years
                    </button>
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setYearFilter(y);
                          requestAnimationFrame(() => {
                            yearRefs.current[y]?.scrollIntoView({ behavior: "smooth", block: "start" });
                          });
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                          yearFilter === y
                            ? "border-primary-deep bg-primary/25 text-primary-deep"
                            : "border-border bg-card text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                  <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[12px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={showMonths}
                      onChange={(e) => setShowMonths(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                    />
                    Month markers
                  </label>
                </div>
                <MemoryTimeline
                  memories={visible}
                  onOpen={setOpen}
                  showMonths={showMonths}
                  yearRefs={yearRefs}
                />
              </div>
            );
          })()
        ) : (
          <ul
            className="gap-3 sm:gap-4"
            style={{ columnCount: 2, columnGap: "1rem" }}
          >
            {filtered.map((m, i) => (
              <li
                key={m.id}
                className="mb-3 break-inside-avoid sm:mb-4"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <button
                  onClick={() => setOpen(m)}
                  className="group block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up"
                >
                  {m.photo_url ? (
                    <div className="relative">
                      <img
                        src={m.photo_url}
                        alt={m.title}
                        loading="lazy"
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {(m.photo_urls?.length ?? 0) > 1 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-soft">
                          +{(m.photo_urls?.length ?? 1) - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gradient-warm text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="space-y-1.5 p-3">
                    {m.is_linked && (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-medium text-secondary">
                          ↳ {m.primary_child_id && nameById[m.primary_child_id]
                            ? `From ${nameById[m.primary_child_id]}`
                            : "Sibling's memory"}
                          {m.relation_label ? ` · ${m.relation_label}` : ""}
                        </span>
                      </div>
                    )}
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        tagStyles[m.category] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.category}
                    </span>
                    <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">
                      {m.title}
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
                      {format(new Date(m.happened_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
      <BottomNav />
    </div>
  );
};

const EmptyState = ({ hasAny, onCreate }: { hasAny: boolean; onCreate: () => void }) => (
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
    <Button variant="warm" size="lg" className="mt-5" onClick={onCreate}>
      <Plus className="h-4 w-4" /> Create a Memory
    </Button>
  </div>
);

export default Moments;
