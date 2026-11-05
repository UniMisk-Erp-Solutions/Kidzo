import { Loader2 } from "lucide-react";
import { TemplateCard } from "@/components/books/TemplateCard";
import type { BookTemplate } from "@/hooks/useBookTemplates";
import { cn } from "@/lib/utils";

interface PillsProps {
  filters: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

/** The horizontally scrolling filter pills (All, Timeline, First Year…). */
export const FilterPills = ({ filters, active, onChange }: PillsProps) => (
  <div className="-mx-6 mb-6 overflow-x-auto px-6 scrollbar-hide">
    <div className="flex w-max gap-2">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            "min-h-[36px] whitespace-nowrap rounded-full border px-4 text-[13px] font-medium transition-all",
            active === f.id
              ? "border-primary-deep bg-primary-deep text-primary-foreground shadow-soft"
              : "border-border bg-card text-foreground hover:border-primary/40",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  </div>
);

interface GridProps {
  loading: boolean;
  templates: BookTemplate[];
  isLocked: (t: BookTemplate) => boolean;
  onSelect: (t: BookTemplate) => void;
  onPreview: (t: BookTemplate) => void;
}

/** The template cards, or a loading / "nothing matches" state. */
export const TemplateGrid = ({ loading, templates, isLocked, onSelect, onPreview }: GridProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading templates…
      </div>
    );
  }
  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
        <p className="text-muted-foreground">No templates match your search.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} locked={isLocked(t)} onSelect={onSelect} onPreview={onPreview} />
      ))}
    </div>
  );
};
