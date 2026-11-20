import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { useChildren } from "@/hooks/useChildren";
import { type Memory } from "@/hooks/useMemories";
import { useMomentsBrowser, useStoredView } from "@/hooks/useMomentsBrowser";
import { YearPager } from "@/components/childbook/YearPager";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { ViewToggle } from "@/components/childbook/ViewToggle";
import { BottomNav } from "@/components/childbook/BottomNav";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { Flashbacks } from "@/components/childbook/Flashbacks";
import { MomentsPhotoMargins } from "@/components/childbook/MomentsPhotoMargins";
import { MomentsFilterBar } from "@/components/childbook/MomentsFilterBar";
import { MomentsBody } from "@/components/childbook/MomentsBody";
import { momentsSubtitle } from "@/hooks/momentsFilter";

/** Label for a memory that belongs to a sibling ("From Mia · cousin"). */
const linkedLabel = (m: Memory, nameById: Record<string, string>) => {
  if (!m.is_linked) return undefined;
  const owner = m.primary_child_id ? nameById[m.primary_child_id] : undefined;
  const base = owner ? `From ${owner}` : "Sibling's memory";
  return m.relation_label ? `${base} · ${m.relation_label}` : base;
};

const Moments = () => {
  const navigate = useNavigate();
  const { data: child } = useActiveChild();
  const { canEdit } = useCanEditChild(child?.id);
  const { data: allKids = [] } = useChildren();
  const nameById = useMemo(() => Object.fromEntries(allKids.map((c) => [c.id, c.name])), [allKids]);

  const [open, setOpen] = useState<Memory | null>(null);
  const [view, setView] = useStoredView();
  const [yearOpen, setYearOpen] = useState(false);

  // Timeline: the year cards page only offers Filter; once a year is open, categories appear.
  const inYear = view === "timeline" && yearOpen;
  const onYearCards = view === "timeline" && !yearOpen;
  const m = useMomentsBrowser(child?.id, view, onYearCards);

  const onCreate = canEdit ? () => navigate("/moments/new") : undefined;
  const showFlashbacks = m.allTotal > 0 && m.category === "All" && !inYear;

  return (
    <div className="relative isolate min-h-screen bg-background pb-28">
      <MomentsPhotoMargins />
      <TopBar childName={child?.name ?? "Your child"} />

      {/* Header banner — same style as Grow */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <PageHero
          icon={Camera}
          title="Moments"
          subtitle={momentsSubtitle(m.allTotal)}
          actions={
            <>
              <ViewToggle view={view} onChange={setView} />
              {onCreate && (
                <Button variant="outline" size="sm" className="border-white/60 bg-white/85 text-plum hover:bg-white" onClick={onCreate}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              )}
            </>
          }
        />
      </div>

      <MomentsFilterBar
        search={m.search}
        onSearch={m.setSearch}
        category={m.category}
        onCategory={m.setCategory}
        yearFilter={m.yearFilter}
        onYear={m.setYearFilter}
        range={m.range}
        onRange={m.setRange}
        years={m.years}
        showSearch={!onYearCards}
        showCategory={!onYearCards}
        showYear={view !== "timeline"}
      />

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {showFlashbacks && <Flashbacks memories={m.flashbackMemories} variant="strip" />}
        <MomentsBody
          isLoading={m.isLoading}
          view={view}
          allTotal={m.allTotal}
          filtered={m.memories}
          range={m.range}
          category={m.category}
          onOpen={setOpen}
          linkedLabelFor={(mem) => linkedLabel(mem, nameById)}
          onYearOpenChange={setYearOpen}
          onCreate={onCreate}
          onSeeMore={(y) => navigate(`/moments/year/${y}`)}
        />
        {!inYear && <YearPager page={m.safePage} pageCount={m.pageCount} years={m.pageYears} loading={m.pageLoading} onPage={m.setPage} />}
      </main>

      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
      <BottomNav />
    </div>
  );
};

export default Moments;
