import { useMemo } from "react";
import { format } from "date-fns";
import type { Memory } from "./useMemories";

export type FlashbackGroup = {
  /** Stable key for lists. */
  key: string;
  /** "last-month" = recap of the month just gone; "years-ago" = this calendar month in an earlier year. */
  kind: "last-month" | "years-ago";
  /** Big label on the card, e.g. "October recap" / "November 2025". */
  title: string;
  /** Small chip, e.g. "Last month" / "1 year ago". */
  tag: string;
  /** Oldest first, so a replay tells the month in order. */
  memories: Memory[];
};

/** The month before `now` as { month, year } (January wraps to last December). */
export const previousMonth = (now = new Date()) => {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: prev.getMonth(), year: prev.getFullYear() };
};

/** Does a memory date fall in the recap window: last month, or this month in an earlier year? */
export const isFlashbackDate = (iso: string, now = new Date()) => {
  const d = new Date(iso);
  const prev = previousMonth(now);
  if (d.getMonth() === prev.month && d.getFullYear() === prev.year) return true;
  return d.getMonth() === now.getMonth() && d.getFullYear() < now.getFullYear();
};

const oldestFirst = (a: Memory, b: Memory) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime();

/**
 * Recaps to replay like stories: first the past month, then this same month in earlier years
 * (1 year ago, 2 years ago, …). Groups with no memories are left out.
 */
export function useFlashbacks(memories: Memory[]): FlashbackGroup[] {
  return useMemo(() => {
    const now = new Date();
    const prev = previousMonth(now);
    const groups: FlashbackGroup[] = [];

    const lastMonth = memories.filter((m) => {
      const d = new Date(m.happened_at);
      return d.getMonth() === prev.month && d.getFullYear() === prev.year;
    });
    if (lastMonth.length > 0) {
      groups.push({
        key: "last-month",
        kind: "last-month",
        title: `${format(new Date(prev.year, prev.month, 1), "MMMM")} recap`,
        tag: "Last month",
        memories: lastMonth.sort(oldestFirst),
      });
    }

    const byYearsAgo = new Map<number, Memory[]>();
    for (const m of memories) {
      const d = new Date(m.happened_at);
      if (d.getMonth() !== now.getMonth()) continue;
      const yearsAgo = now.getFullYear() - d.getFullYear();
      if (yearsAgo <= 0) continue;
      byYearsAgo.set(yearsAgo, [...(byYearsAgo.get(yearsAgo) ?? []), m]);
    }
    [...byYearsAgo.entries()]
      .sort((a, b) => a[0] - b[0])
      .forEach(([yearsAgo, mems]) => {
        groups.push({
          key: `years-ago-${yearsAgo}`,
          kind: "years-ago",
          title: `${format(now, "MMMM")} ${now.getFullYear() - yearsAgo}`,
          tag: yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`,
          memories: mems.sort(oldestFirst),
        });
      });

    return groups;
  }, [memories]);
}
