/** Adds the comma-separated parts of `value` to `list`, skipping blanks and case-insensitive duplicates. */
export function mergeChips(value: string, list: string[]): string[] {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const next = [...list];
  const seen = new Set(next.map((x) => x.toLowerCase()));
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    next.push(p);
    seen.add(key);
  }
  return next;
}
