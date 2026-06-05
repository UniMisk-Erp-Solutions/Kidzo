import { useCallback, useState } from "react";

const STORAGE_PREFIX = "kidsepedia:cal-month:";

/**
 * Remembers the last month/year the user navigated to in a Calendar
 * popover, scoped by a key (e.g. "onboarding-dob", "memory-when").
 *
 * Usage:
 *   const { month, setMonth } = useCalendarMemory("onboarding-dob", fallback);
 *   <Calendar month={month} onMonthChange={setMonth} ... />
 */
export function useCalendarMemory(key: string, fallback: Date) {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [month, setMonthState] = useState<Date>(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return fallback;
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return fallback;
      return parsed;
    } catch {
      return fallback;
    }
  });

  const setMonth = useCallback(
    (next: Date | undefined) => {
      if (!next) return;
      setMonthState(next);
      try {
        // Store first-of-month so day choice doesn't leak
        const firstOfMonth = new Date(next.getFullYear(), next.getMonth(), 1);
        localStorage.setItem(storageKey, firstOfMonth.toISOString());
      } catch {
        // ignore storage errors
      }
    },
    [storageKey],
  );

  return { month, setMonth };
}
