import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SiblingSelection = Record<string, { checked: boolean; label: string }>;

interface Props {
  siblings: { id: string; name: string }[];
  selection: SiblingSelection;
  onToggle: (id: string) => void;
  onLabel: (id: string, label: string) => void;
}

/** "Also a memory for…": tag this memory onto siblings' timelines, with an optional relation note. */
export const SiblingLinks = ({ siblings, selection, onToggle, onLabel }: Props) => {
  if (siblings.length === 0) return null;
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <Label>Also a memory for…</Label>
        <span className="text-[11px] text-muted-foreground">add to a sibling's timeline too</span>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Same moment, shared across siblings. Add an optional note for how it relates to them — e.g.{" "}
        <span className="font-medium">“Brother's 1st birthday”</span>.
      </p>
      <ul className="space-y-2 pt-1">
        {siblings.map((s) => {
          const sel = selection[s.id];
          return (
            <li key={s.id} className="rounded-xl border border-border bg-card p-3">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={!!sel?.checked}
                  onChange={() => onToggle(s.id)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span className="text-[14px] font-medium text-foreground">{s.name}</span>
              </label>
              {sel?.checked && (
                <Input
                  value={sel.label ?? ""}
                  onChange={(e) => onLabel(s.id, e.target.value)}
                  placeholder={`How does this relate to ${s.name}? (optional)`}
                  className="mt-2 h-10 rounded-lg"
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
