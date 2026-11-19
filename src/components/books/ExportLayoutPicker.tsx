import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { LayoutStyle } from "@/lib/exportShareBook";
import { LAYOUTS } from "@/lib/exportShareHelpers";

interface Props {
  layout: LayoutStyle;
  onChange: (layout: LayoutStyle) => void;
}

/** Step 1: choose the book layout. */
export const ExportLayoutPicker = ({ layout, onChange }: Props) => (
  <Card className="rounded-2xl p-5">
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      1. Choose a layout
    </h2>
    {/* Phones: a compact 2-up grid showing just the name + colours (descriptions are md and up). */}
    <RadioGroup value={layout} onValueChange={(v) => onChange(v as LayoutStyle)} className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {LAYOUTS.map((l) => (
        <Label
          key={l.id}
          htmlFor={`layout-${l.id}`}
          className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors md:gap-3 md:p-4 ${
            layout === l.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <RadioGroupItem value={l.id} id={`layout-${l.id}`} className="mt-0.5 shrink-0 md:mt-1" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold leading-tight text-foreground md:text-sm">
              {l.title}
              {l.swatches && (
                <span className="flex -space-x-1" aria-hidden>
                  {l.swatches.map((s) => (
                    <span key={s} className="h-3.5 w-3.5 rounded-full border border-card" style={{ backgroundColor: s }} />
                  ))}
                </span>
              )}
            </div>
            <div className="mt-1 hidden text-xs text-muted-foreground md:block">{l.desc}</div>
          </div>
        </Label>
      ))}
    </RadioGroup>
  </Card>
);
