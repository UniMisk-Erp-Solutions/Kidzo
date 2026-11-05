import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tone = "who" | "tag";

const TONES: Record<Tone, { chip: string; remove: string; suggestion: string; prefix: string }> = {
  who: {
    chip: "bg-primary/25 text-primary-deep",
    remove: "hover:bg-primary/30",
    suggestion: "border-primary/40 text-primary-deep hover:bg-primary/15",
    prefix: "",
  },
  tag: {
    chip: "bg-accent/40 text-accent-foreground",
    remove: "hover:bg-accent/50",
    suggestion: "border-accent-foreground/30 text-accent-foreground hover:bg-accent/30",
    prefix: "#",
  },
};

interface ListProps {
  items: string[];
  tone: Tone;
  onRemove: (index: number) => void;
}

const ChipList = ({ items, tone, onRemove }: ListProps) => {
  if (items.length === 0) return null;
  const t = TONES[tone];
  return (
    <ul className="flex flex-wrap gap-2 pt-1">
      {items.map((item, i) => (
        <li
          key={`${item}-${i}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${t.chip}`}
        >
          {t.prefix}
          {item}
          <button type="button" onClick={() => onRemove(i)} className={`rounded-full ${t.remove}`} aria-label={`Remove ${item}`}>
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
};

interface SuggestionsProps {
  suggestions: string[];
  items: string[];
  tone: Tone;
  onPick: (value: string) => void;
}

/** Up to three past values that aren't on the list yet. */
const Suggestions = ({ suggestions, items, tone, onPick }: SuggestionsProps) => {
  const visible = suggestions.filter((s) => !items.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 3);
  if (visible.length === 0) return null;
  const t = TONES[tone];
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span className="text-[11px] text-muted-foreground">Suggestions:</span>
      {visible.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className={`rounded-full border border-dashed px-2.5 py-0.5 text-[12px] transition ${t.suggestion}`}
        >
          + {t.prefix}
          {s}
        </button>
      ))}
    </div>
  );
};

interface Props {
  id: string;
  label: string;
  placeholder: string;
  addLabel: string;
  /** The explanatory line under the input (e.g. "Separate with commas — …"). */
  hint: ReactNode;
  tone: Tone;
  /** What is typed so far. */
  value: string;
  onValueChange: (value: string) => void;
  /** Turn `value` (comma-separated) into chips. */
  onCommit: (value: string) => void;
  items: string[];
  suggestions: string[];
  onRemove: (index: number) => void;
}

/** A comma-separated chip input ("Who was there?", "Tags") with suggestions from past memories. */
export const ChipField = ({
  id,
  label,
  placeholder,
  addLabel,
  hint,
  tone,
  value,
  onValueChange,
  onCommit,
  items,
  suggestions,
  onRemove,
}: Props) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        onChange={(e) => (e.target.value.includes(",") ? onCommit(e.target.value) : onValueChange(e.target.value))}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          onCommit(value);
        }}
        onBlur={() => onCommit(value)}
        placeholder={placeholder}
        className="h-11 rounded-xl"
      />
      <Button type="button" variant="soft" size="icon" onClick={() => onCommit(value)} aria-label={addLabel}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    <p className="text-[11px] text-muted-foreground">{hint}</p>
    <Suggestions suggestions={suggestions} items={items} tone={tone} onPick={onCommit} />
    <ChipList items={items} tone={tone} onRemove={onRemove} />
  </div>
);
