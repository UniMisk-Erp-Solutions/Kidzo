import { describe, expect, it } from "vitest";
import { isFlashbackDate, previousMonth } from "@/hooks/useFlashbacks";

describe("flashback window", () => {
  const now = new Date(2026, 10, 18); // 18 Nov 2026

  it("previous month wraps over the new year", () => {
    expect(previousMonth(now)).toEqual({ month: 9, year: 2026 });
    expect(previousMonth(new Date(2027, 0, 5))).toEqual({ month: 11, year: 2026 });
  });

  it("includes last month and this month in earlier years", () => {
    expect(isFlashbackDate("2026-10-12", now)).toBe(true); // last month
    expect(isFlashbackDate("2025-11-03", now)).toBe(true); // 1 year ago, same month
    expect(isFlashbackDate("2022-11-30", now)).toBe(true);
  });

  it("excludes everything else", () => {
    expect(isFlashbackDate("2026-11-02", now)).toBe(false); // this month, this year
    expect(isFlashbackDate("2025-10-12", now)).toBe(false); // last month, but last year's
    expect(isFlashbackDate("2026-09-30", now)).toBe(false);
    expect(isFlashbackDate("2025-03-01", now)).toBe(false);
  });
});
