import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeChips } from "./memoryDetailUtils";

const TONES = {
  primary: {
    suggestion: "border-primary/40 text-primary-deep hover:bg-primary/15",
    chip: "bg-primary/25 text-primary-deep",
    remove: "hover:bg-primary/30",
  },
  accent: {
    suggestion: "border-accent-foreground/30 text-accent-foreground hover:bg-accent/30",
    chip: "bg-accent/40 text-accent-foreground",
    remove: "hover:bg-accent/50",
  },
};

interface Props {
  id: string;
  label: string;
  placeholder: string;
  addLabel: string;
  hint: React.ReactNode;
  tone: keyof typeof TONES;
  /** Shown before each suggestion and chip, e.g. "#" for tags. */
  prefix?: string;
  items: string[];
  onItemsChange: (items: string[]) => void;
  input: string;
  onInputChange: (value: string) => void;
  suggestions: string[];
}

const Suggestions = ({ list, prefix, tone, onPick }: { list: string[]; prefix: string; tone: keyof typeof TONES; onPick: (s: string) => void }) => {
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span className="text-[11px] text-muted-foreground">Suggestions:</span>
      {list.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className={`rounded-full border border-dashed px-2.5 py-0.5 text-[12px] transition ${TONES[tone].suggestion}`}
        >
          + {prefix}{s}
        </button>
      ))}
    </div>
  );
};

const ChipList = ({ items, prefix, tone, onRemove }: { items: string[]; prefix: string; tone: keyof typeof TONES; onRemove: (i: number) => void }) => {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2 pt-1">
      {items.map((p, i) => (
        <li
          key={`${p}-${i}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${TONES[tone].chip}`}
        >
          {prefix}{p}
          <button type="button" onClick={() => onRemove(i)} className={`rounded-full ${TONES[tone].remove}`} aria-label={`Remove ${p}`}>
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
};

/** A comma-separated chip input with suggestions (used for "who was there" and tags). */
export const MemoryChipField = (props: Props) => {
  const { id, items, input, onItemsChange, onInputChange, tone, prefix = "" } = props;
  const commit = (raw: string) => {
    onItemsChange(mergeChips(items, raw));
    onInputChange("");
  };
  const taken = new Set(items.map((x) => x.toLowerCase()));
  const visible = props.suggestions.filter((s) => !taken.has(s.toLowerCase())).slice(0, 3);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{props.label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={input}
          onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : onInputChange(e.target.value))}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            commit(input);
          }}
          onBlur={() => commit(input)}
          placeholder={props.placeholder}
          className="h-11 rounded-xl"
        />
        <Button type="button" variant="soft" size="icon" onClick={() => commit(input)} aria-label={props.addLabel}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">{props.hint}</p>
      <Suggestions list={visible} prefix={prefix} tone={tone} onPick={commit} />
      <ChipList items={items} prefix={prefix} tone={tone} onRemove={(i) => onItemsChange(items.filter((_, j) => j !== i))} />
    </div>
  );
};
