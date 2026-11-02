import { useMemo, useState } from "react";

export type YearItem<T> = { m: T; idx: number };

/**
 * Groups items by the year of `happened_at` (newest year first). Each item keeps its position (`idx`) in the
 * original list. Only the newest year starts open, so a long timeline isn't one endless scroll on a phone.
 */
export function useYearGroups<T extends { happened_at: string }>(items: T[]) {
  const yearGroups = useMemo(() => {
    const map = new Map<number, YearItem<T>[]>();
    items.forEach((m, idx) => {
      const y = new Date(m.happened_at).getFullYear();
      map.set(y, [...(map.get(y) ?? []), { m, idx }]);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, group]) => ({ year, items: group }));
  }, [items]);

  const [openState, setOpenState] = useState<Set<number> | null>(null);
  const openYears = openState ?? new Set(yearGroups.length ? [yearGroups[0].year] : []);

  const toggleYear = (year: number) => {
    const next = new Set(openYears);
    if (!next.delete(year)) next.add(year);
    setOpenState(next);
  };

  return { yearGroups, openYears, toggleYear };
}
