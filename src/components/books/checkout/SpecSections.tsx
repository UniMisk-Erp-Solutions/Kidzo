import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BINDING_TYPES,
  BOOK_SIZES,
  PAPER_QUALITIES,
  formatCurrency,
  type BindingType,
  type BookSize,
  type PaperQuality,
} from "@/lib/bookPricing";
import { cn } from "@/lib/utils";

type RadioOption<T extends string> = { id: T; label: string; price: number; subtitle: string };

const toOptions = <T extends string>(
  record: Record<T, { label: string; price: number; subtitle: string }>,
): RadioOption<T>[] =>
  (Object.entries(record) as [T, { label: string; price: number; subtitle: string }][]).map(([id, v]) => ({
    id,
    label: v.label,
    price: v.price,
    subtitle: v.subtitle,
  }));

function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition",
            opt.id === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
          )}
        >
          <div className="min-w-0">
            <div className="text-[14px] font-semibold">{opt.label}</div>
            <div className="text-[12px] text-muted-foreground">{opt.subtitle}</div>
          </div>
          <div className="shrink-0 text-[13px] font-semibold">
            {opt.price === 0 ? "Included" : `+${formatCurrency(opt.price)}`}
          </div>
        </button>
      ))}
    </div>
  );
}

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-2xl border bg-card p-4 md:p-5">
    <h2 className="text-[15px] font-semibold">{title}</h2>
    {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

const QuantityStepper = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="flex items-center gap-2">
    <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
      −
    </Button>
    <Input
      type="number"
      min={1}
      max={10}
      value={value}
      onChange={(e) => onChange(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
      className="h-10 w-20 text-center"
    />
    <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.min(10, value + 1))} disabled={value >= 10}>
      +
    </Button>
  </div>
);

interface Props {
  size: BookSize;
  paper: PaperQuality;
  binding: BindingType;
  quantity: number;
  onSize: (v: BookSize) => void;
  onPaper: (v: PaperQuality) => void;
  onBinding: (v: BindingType) => void;
  onQuantity: (n: number) => void;
}

/** Size, paper quality, binding and quantity pickers. */
export const SpecSections = (p: Props) => (
  <>
    <Section title="Size" hint="Pick the dimensions of your printed book.">
      <RadioGroup<BookSize> value={p.size} onChange={p.onSize} options={toOptions(BOOK_SIZES)} />
    </Section>
    <Section title="Paper quality">
      <RadioGroup<PaperQuality> value={p.paper} onChange={p.onPaper} options={toOptions(PAPER_QUALITIES)} />
    </Section>
    <Section title="Binding">
      <RadioGroup<BindingType> value={p.binding} onChange={p.onBinding} options={toOptions(BINDING_TYPES)} />
    </Section>
    <Section title="Quantity" hint="Order an extra for grandparents — they will love it.">
      <QuantityStepper value={p.quantity} onChange={p.onQuantity} />
    </Section>
  </>
);
