import { useMemo } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import { MemoryRow } from "./MemoryRow";

const groupByYear = (memories: Memory[]) => {
  const map = new Map<string, Memory[]>();
  [...memories]
    .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime())
    .forEach((m) => {
      const key = format(new Date(m.happened_at), "yyyy");
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    });
  return Array.from(map.entries());
};

interface GroupProps {
  label: string;
  items: Memory[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectGroup: (ids: string[]) => void;
  onDeselectGroup: (ids: string[]) => void;
}

const YearGroup = ({ label, items, selected, onToggle, onSelectGroup, onDeselectGroup }: GroupProps) => {
  const ids = items.map((m) => m.id);
  const allChecked = ids.every((i) => selected.includes(i));
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold">{label}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => (allChecked ? onDeselectGroup(ids) : onSelectGroup(ids))}
          className="text-[12px] font-medium text-primary hover:underline"
        >
          {allChecked ? "Deselect all" : "Select all"}
        </button>
      </div>
      <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <MemoryRow key={m.id} memory={m} checked={selected.includes(m.id)} onToggle={() => onToggle(m.id)} />
        ))}
      </div>
    </div>
  );
};

interface Props {
  memories: Memory[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectGroup: (ids: string[]) => void;
  onDeselectGroup: (ids: string[]) => void;
}

/** Grouped checklist by year. */
export const YearGroupedList = ({ memories, ...rest }: Props) => {
  const grouped = useMemo(() => groupByYear(memories), [memories]);
  return (
    <div className="space-y-4">
      {grouped.map(([key, items]) => (
        <YearGroup key={key} label={key} items={items} {...rest} />
      ))}
    </div>
  );
};
