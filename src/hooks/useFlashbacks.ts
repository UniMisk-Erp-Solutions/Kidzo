import { useMemo } from "react";
import type { Memory } from "./useMemories";

export type FlashbackGroup = {
  /** e.g. "1 year ago" / "2 years ago" */
  label: string;
  yearsAgo: number;
  memories: Memory[];
};

/**
 * Group past memories by years-ago from the same calendar month as today.
 * Mirrors Google Photos' "On this day / month" surface.
 */
export function useFlashbacks(memories: Memory[]): FlashbackGroup[] {
  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const byYearsAgo = new Map<number, Memory[]>();

    for (const m of memories) {
      const d = new Date(m.happened_at);
      if (d.getMonth() !== currentMonth) continue;
      const yearsAgo = currentYear - d.getFullYear();
      if (yearsAgo <= 0) continue;
      const arr = byYearsAgo.get(yearsAgo) ?? [];
      arr.push(m);
      byYearsAgo.set(yearsAgo, arr);
    }

    return [...byYearsAgo.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([yearsAgo, mems]) => ({
        yearsAgo,
        label: yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`,
        memories: mems.sort(
          (a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime(),
        ),
      }));
  }, [memories]);
}
