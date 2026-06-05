import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Memory } from "@/hooks/useMemories";

interface Props {
  memories: Memory[];
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (d: Date | null) => void;
}

export const MemoryCalendar = ({ memories, month, onMonthChange, selectedDate, onSelectDate }: Props) => {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    memories.forEach((m) => {
      const key = format(new Date(m.happened_at), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [memories]);

  const max = Math.max(1, ...Array.from(counts.values()));

  const firstDow = startOfMonth(month).getDay();
  const blanks = Array.from({ length: firstDow });

  const heatClass = (count: number) => {
    if (count === 0) return "bg-muted/40 text-muted-foreground";
    const ratio = count / max;
    if (ratio > 0.66) return "bg-primary text-primary-foreground";
    if (ratio > 0.33) return "bg-primary/60 text-primary-foreground";
    return "bg-primary/30 text-foreground";
  };

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(subMonths(month, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">{format(month, "MMMM yyyy")}</div>
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const count = counts.get(key) ?? 0;
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : d)}
              className={cn(
                "relative aspect-square rounded-lg text-[12px] font-medium transition hover:scale-105",
                heatClass(count),
                isSelected && "ring-2 ring-ring ring-offset-1",
                !isSameMonth(d, month) && "opacity-40",
              )}
              title={count > 0 ? `${count} memor${count === 1 ? "y" : "ies"}` : "No memories"}
            >
              {format(d, "d")}
              {count > 0 && (
                <span className="absolute bottom-0.5 right-0.5 text-[8px] opacity-80">{count}</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-[12px]">
          <span>Showing {format(selectedDate, "PP")}</span>
          <button onClick={() => onSelectDate(null)} className="text-primary hover:underline">
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
