import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useUserBook, useUpdateUserBook } from "@/hooks/useUserBooks";
import { useBookTemplates } from "@/hooks/useBookTemplates";
import { useMemories, type Memory } from "@/hooks/useMemories";
import { useChildren } from "@/hooks/useChildren";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useMemoryFilters } from "@/hooks/useMemoryFilters";
import { useHydrateSelection, useMemorySelection } from "@/hooks/useMemorySelection";
import { MemoryCalendar } from "@/components/books/MemoryCalendar";
import { MobileSelection, NextButton, SelectionPanel } from "@/components/books/SelectionPanel";
import { BulkActionBar } from "@/components/books/memory-selection/BulkActionBar";
import { BrowserHeader } from "@/components/books/memory-selection/BrowserHeader";
import { MemoryResults } from "@/components/books/memory-selection/MemoryResults";
import { StepHeader } from "@/components/books/memory-selection/StepHeader";

const indexById = (memories: Memory[]) => {
  const map: Record<string, Memory> = {};
  memories.forEach((m) => (map[m.id] = m));
  return map;
};

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

  const pick = useMemorySelection(memories, target);
  const { selected, setSelected } = pick;
  const filters = useMemoryFilters(memories);
  useHydrateSelection({ book, memories, target, childName: child?.name, setSelected });
  const memoriesById = useMemo(() => indexById(memories), [memories]);

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-44 md:pb-44">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/books")} className="-ml-3 mb-3">
          <ArrowLeft className="h-4 w-4" /> My books
        </Button>

        <StepHeader templateName={template?.name} target={target} selectedCount={selected.length} />

        <BulkActionBar
          target={target}
          memories={memories}
          selected={selected}
          yearGroups={filters.yearGroups}
          categories={filters.categories}
          yearFilter={filters.yearFilter}
          categoryFilter={filters.categoryFilter}
          onPickYear={filters.pickYear}
          onPickCategory={filters.pickCategory}
          onSmartPick={pick.smartPick}
          onBalancedPick={pick.balancedPick}
          onSelectAll={pick.selectAll}
          onClearAll={pick.clearAll}
        />

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8">
          {/* Left: calendar (in calendar mode) + selected list. Sticky, with its own scroll,
              so the selection stays in view while browsing memories on the right. */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-11rem)] lg:self-start">
            {filters.viewMode === "calendar" && (
              <MemoryCalendar
                memories={memories}
                month={filters.month}
                onMonthChange={filters.setMonth}
                selectedDate={filters.selectedDate}
                onSelectDate={filters.setSelectedDate}
              />
            )}
            {/* Desktop only: on mobile the selection opens from the footer button instead. */}
            <div className="hidden min-h-0 flex-1 flex-col lg:flex">
              <SelectionPanel selected={selected} memoriesById={memoriesById} onChange={setSelected} />
            </div>
          </div>

          {/* Right: memory browser */}
          <div className="space-y-4">
            <BrowserHeader
              viewMode={filters.viewMode}
              selectedDate={filters.selectedDate}
              month={filters.month}
              onViewMode={filters.setViewMode}
              yearFilter={filters.yearFilter}
              categoryFilter={filters.categoryFilter}
              visible={filters.visible}
              selected={selected}
              onClearYear={() => filters.setYearFilter(null)}
              onClearCategory={() => filters.setCategoryFilter(null)}
              onToggleVisible={pick.toggleMany}
            />
            <MemoryResults
              loading={memoriesLoading}
              visible={filters.visible}
              viewMode={filters.viewMode}
              selected={selected}
              onToggle={pick.toggle}
              onSelectGroup={pick.addMany}
              onDeselectGroup={pick.removeMany}
            />
          </div>
        </div>
      </main>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 md:px-6">
          <MobileSelection target={target} selected={selected} memoriesById={memoriesById} onChange={setSelected} />
          <div className="hidden text-[13px] text-muted-foreground lg:block">
            <span className="font-semibold text-foreground">{selected.length}</span> of {target} selected
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="md:h-10 md:px-4" onClick={() => navigate("/books")}>
              Back
            </Button>
            <NextButton
              pending={update.isPending}
              needsUpgrade={!entLoading && !canBuild}
              disabled={selected.length === 0 || update.isPending || entLoading}
              onClick={handleContinue}
            />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MemorySelection;
