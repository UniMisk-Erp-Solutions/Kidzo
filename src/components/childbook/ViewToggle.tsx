import { GitCommitVertical, LayoutGrid, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MomentsView = "grid" | "timeline";

const OPTIONS: { value: MomentsView; label: string; icon: LucideIcon }[] = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "timeline", label: "Timeline", icon: GitCommitVertical },
];

/** Grid / Timeline switch shown on the Moments banner. */
export const ViewToggle = ({ view, onChange }: { view: MomentsView; onChange: (v: MomentsView) => void }) => (
  <div className="flex items-center rounded-full border border-white/60 bg-white/85 p-0.5">
    {OPTIONS.map(({ value, label, icon: Icon }) => (
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        aria-pressed={view === value}
        aria-label={`${label} view`}
        className={cn(
          "flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors",
          view === value ? "bg-primary/25 text-primary-deep" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    ))}
  </div>
);
