import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BookTemplate } from "@/hooks/useBookTemplates";

interface Props {
  template: BookTemplate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (t: BookTemplate) => void;
}

export const TemplatePreviewModal = ({ template, open, onOpenChange, onSelect }: Props) => {
  if (!template) return null;
  const c = template.color_scheme;
  const ink = c.ink ?? c.text ?? "#3E3E42";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {template.name}
            {template.is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                <Sparkles className="h-3 w-3" /> Premium
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Hero cover */}
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gradient-hero">
          <div
            className="flex h-3/4 w-3/5 flex-col items-center justify-center rounded-xl border-2 px-6 text-center shadow-lift"
            style={{ backgroundColor: c.primary, borderColor: c.gold, color: ink }}
          >
            <BookOpen className="mb-3 h-8 w-8" />
            <div className="text-[18px] font-semibold leading-tight">{template.name}</div>
            {template.suggested_age_range && (
              <div className="mt-1 text-[11px] uppercase tracking-wide opacity-70">
                {template.suggested_age_range}
              </div>
            )}
          </div>
        </div>

        <p className="text-[14px] leading-relaxed text-muted-foreground">{template.description}</p>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/40 p-4 text-center">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pages</div>
            <div className="mt-1 text-[18px] font-semibold">{template.pages_needed}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Layouts</div>
            <div className="mt-1 text-[18px] font-semibold">{template.page_layouts.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Age</div>
            <div className="mt-1 text-[13px] font-semibold">
              {template.suggested_age_range ?? "Any"}
            </div>
          </div>
        </div>

        {/* Color scheme */}
        <div>
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Color scheme
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Primary", c: c.primary },
              { label: "Accent", c: c.accent },
              { label: "Gold", c: c.gold },
              { label: "Coral", c: c.coral },
              { label: "Ink", c: ink },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-[12px]"
              >
                <span
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: s.c }}
                />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sample pages */}
        <div>
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sample pages
          </div>
          <div className="grid grid-cols-3 gap-3">
            {template.page_layouts.slice(0, 3).map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-3 text-center shadow-soft"
              >
                <div
                  className="mx-auto mb-2 flex h-16 w-full items-center justify-center rounded-lg"
                  style={{ backgroundColor: c.primary }}
                >
                  <BookOpen className="h-5 w-5" style={{ color: ink }} />
                </div>
                <div className="text-[11px] font-semibold">{p.title}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {p.type} · {p.photos} {p.photos === 1 ? "photo" : "photos"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="warm" size="lg" onClick={() => onSelect(template)}>
            Select this template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
