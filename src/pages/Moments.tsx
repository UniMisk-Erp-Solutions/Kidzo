import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { useChildren } from "@/hooks/useChildren";
import { useMemories, type Memory } from "@/hooks/useMemories";
import { filterMemories, momentsSubtitle } from "@/hooks/momentsFilter";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { ViewToggle } from "@/components/childbook/ViewToggle";
import { BottomNav } from "@/components/childbook/BottomNav";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { Flashbacks } from "@/components/childbook/Flashbacks";
import { MomentsFilterBar } from "@/components/childbook/MomentsFilterBar";
import { MomentsBody } from "@/components/childbook/MomentsBody";

type View = "grid" | "timeline";

const readStoredView = (): View =>
  (typeof window !== "undefined" && (localStorage.getItem("moments:view") as View)) || "grid";

/** "From Mia · Cousin" style label for a memory that belongs to a sibling. */
const buildLinkedLabel = (nameById: Record<string, string>) => (m: Memory) => {
  if (!m.is_linked) return undefined;
  const from = m.primary_child_id && nameById[m.primary_child_id] ? `From ${nameById[m.primary_child_id]}` : "Sibling's memory";
  return `${from}${m.relation_label ? ` · ${m.relation_label}` : ""}`;
};

const Moments = () => {
  const navigate = useNavigate();
  const { data: child } = useActiveChild();
  const { canEdit } = useCanEditChild(child?.id);
  const { data: memories = [], isLoading } = useMemories(child?.id);
  const { data: allKids = [] } = useChildren();
  const nameById = useMemo(() => Object.fromEntries(allKids.map((c) => [c.id, c.name])), [allKids]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState<Memory | null>(null);
  const [view, setView] = useState<View>(readStoredView);
  const [yearFilter, setYearFilter] = useState("all");
  const [yearOpen, setYearOpen] = useState(false);

  const years = useMemo(
    () => Array.from(new Set(memories.map((m) => new Date(m.happened_at).getFullYear()))).sort((a, b) => b - a),
    [memories],
  );

  useEffect(() => {
    localStorage.setItem("moments:view", view);
  }, [view]);

  // Timeline: the year cards page only offers Filter; once a year is open, categories appear. The year filter is never needed there.
  const onYearCards = view === "timeline" && !yearOpen;
  useEffect(() => {
    if (view !== "timeline") return;
    if (yearFilter !== "all") setYearFilter("all");
    if (onYearCards && category !== "All") setCategory("All");
    if (onYearCards && search) setSearch("");
  }, [view, onYearCards, yearFilter, category, search]);

  const filtered = useMemo(
    () => filterMemories(memories, { category, range, yearFilter, search }),
    [memories, category, range, yearFilter, search],
  );
  const goNew = canEdit ? () => navigate("/moments/new") : undefined;

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
              {goNew && (
                <Button variant="outline" size="sm" className="border-white/60 bg-white/85 text-plum hover:bg-white" onClick={goNew}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              )}
            </>
          }
        />
      </div>

      <MomentsFilterBar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        yearFilter={yearFilter}
        onYear={setYearFilter}
        range={range}
        onRange={setRange}
        years={years}
        showSearch={!onYearCards}
        showCategory={!onYearCards}
        showYear={view !== "timeline"}
      />

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {memories.length > 0 && !(view === "timeline" && yearOpen) && <Flashbacks memories={memories} variant="strip" />}
        <MomentsBody
          isLoading={isLoading}
          view={view}
          memories={memories}
          filtered={filtered}
          range={range}
          category={category}
          onOpen={setOpen}
          linkedLabelFor={buildLinkedLabel(nameById)}
          onYearOpenChange={setYearOpen}
          onCreate={goNew}
        />
      </main>

      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
      <BottomNav />
    </div>
  );
};

export default Moments;
