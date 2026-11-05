interface Props {
  templateName?: string;
  target: number;
  selectedCount: number;
}

/** "Step 1 of 4" title block with the Selected x / target progress card. */
export const StepHeader = ({ templateName, target, selectedCount }: Props) => {
  const progressPct = Math.min(100, Math.round((selectedCount / target) * 100));
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1 of 4</div>
        <h1 className="font-display mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Choose your memories</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Template: <span className="font-medium text-foreground">{templateName ?? "—"}</span> · Target {target} pages
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Selected</div>
          <div className="text-[18px] font-bold">
            {selectedCount} <span className="text-[13px] font-normal text-muted-foreground">/ {target}</span>
          </div>
        </div>
        <div className="h-10 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
};
