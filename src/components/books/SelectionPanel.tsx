import { useState } from "react";
import { ArrowRight, List, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SelectedMemoriesList } from "@/components/books/SelectedMemoriesList";
import type { Memory } from "@/hooks/useMemories";

interface PanelProps {
  selected: string[];
  memoriesById: Record<string, Memory>;
  onChange: (ids: string[]) => void;
}

/** "Your selection": the chosen memories, reorderable, with a Clear all link. */
export const SelectionPanel = ({ selected, memoriesById, onChange }: PanelProps) => (
  <>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[14px] font-semibold">Your selection</h2>
      {selected.length > 0 && (
        <button onClick={() => onChange([])} className="text-[12px] text-muted-foreground hover:text-destructive">
          Clear all
        </button>
      )}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <SelectedMemoriesList
        selectedIds={selected}
        memoriesById={memoriesById}
        onReorder={onChange}
        onRemove={(id) => onChange(selected.filter((x) => x !== id))}
      />
    </div>
  </>
);

/** Phones: a "Selection 12/24" button that opens the selection in a bottom sheet. */
export const MobileSelection = ({ target, ...panel }: PanelProps & { target: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="min-w-0 shrink gap-1.5 lg:hidden" onClick={() => setOpen(true)}>
        <List className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Selection <span className="font-bold">{panel.selected.length}</span>/{target}
        </span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex max-h-[80vh] flex-col rounded-t-2xl px-4 pb-6 lg:hidden">
          <SheetTitle className="sr-only">Your selection</SheetTitle>
          <div className="flex min-h-0 flex-1 flex-col pt-4">
            <SelectionPanel {...panel} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

interface NextProps {
  pending: boolean;
  /** The plan can't build books: the button asks to upgrade instead. */
  needsUpgrade: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** The footer's Next / Upgrade-to-continue button. */
export const NextButton = ({ pending, needsUpgrade, disabled, onClick }: NextProps) => (
  <Button
    size="sm"
    className="md:h-10 md:px-4"
    onClick={onClick}
    variant={needsUpgrade ? "warm" : "default"}
    disabled={disabled}
  >
    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
    {!pending && needsUpgrade && (
      <>
        <Lock className="h-4 w-4" /> Upgrade to continue
      </>
    )}
    {!pending && !needsUpgrade && (
      <>
        Next <ArrowRight className="h-4 w-4" />
      </>
    )}
  </Button>
);
