import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

const collageRows = [
  { category: "timeline", label: "Timeline collages" },
  { category: "0-12m", label: "First Year collages" },
  { category: "birthday", label: "Birthday collages" },
  { category: "seasonal", label: "Holiday collages" },
  { category: "everyday", label: "Everyday collages" },
];

function CollageRow({ label, templates, isLocked, onSelect, onPreview }: Omit<GridProps, "loading"> & { label: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const updateEdges = () => {
      setEdges({
        start: element.scrollLeft < 2,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });
    };
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    element.addEventListener("scroll", updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", updateEdges);
    };
  }, [templates.length]);

  const scroll = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className="flex gap-2">
          <button type="button" aria-label={`Previous ${label.toLowerCase()}`} disabled={edges.start} onClick={() => scroll(-1)} className="grid size-9 place-items-center rounded-full border bg-card disabled:opacity-35">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label={`Next ${label.toLowerCase()}`} disabled={edges.end} onClick={() => scroll(1)} className="grid size-9 place-items-center rounded-full border bg-card disabled:opacity-35">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div ref={rail} className="flex snap-x snap-proximity gap-4 overflow-x-auto pb-3" tabIndex={0} role="region" aria-label={label}>
        {templates.map((template, index) => (
          <div key={template.id} className={cn("flex shrink-0 snap-start [&>article]:w-full", index % 3 === 1 ? "w-64 sm:w-72" : "w-52")}>
            <TemplateCard template={template} inCarousel locked={isLocked(template)} onSelect={onSelect} onPreview={onPreview} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CollageCarousels(props: GridProps) {
  if (props.loading || props.templates.length === 0) return <TemplateGrid {...props} />;

  return (
    <div className="space-y-7">
      {collageRows.map(({ category, label }) => {
        const templates = props.templates.filter((template) => template.category === category);
        return templates.length > 0 && <CollageRow key={category} {...props} label={label} templates={templates} />;
      })}
    </div>
  );
}
