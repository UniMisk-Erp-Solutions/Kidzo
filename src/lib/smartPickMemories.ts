import type { Memory } from "@/hooks/useMemories";

/**
 * Pick `target` memories evenly spread across the chronological range,
 * lightly preferring those with photos. Returns memory IDs in the original
 * (date-ascending) order.
 */
export function smartPickMemories(memories: Memory[], target: number): string[] {
  if (memories.length === 0 || target <= 0) return [];

  const sorted = [...memories].sort(
    (a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime(),
  );

  if (sorted.length <= target) return sorted.map((m) => m.id);

  // Build buckets by evenly slicing the range, then pick the best from each.
  const buckets: Memory[][] = Array.from({ length: target }, () => []);
  const span = sorted.length;
  sorted.forEach((m, i) => {
    const idx = Math.min(target - 1, Math.floor((i / span) * target));
    buckets[idx].push(m);
  });

  const picked: Memory[] = [];
  buckets.forEach((bucket) => {
    if (bucket.length === 0) return;
    // Prefer memories with a photo; fall back to the middle of the bucket.
    const withPhoto = bucket.filter((m) => !!m.photo_url);
    const pool = withPhoto.length > 0 ? withPhoto : bucket;
    picked.push(pool[Math.floor(pool.length / 2)]);
  });

  // Dedupe in case two buckets nominated the same memory.
  const seen = new Set<string>();
  const unique = picked.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Top up if dedupe shrank us under target.
  if (unique.length < target) {
    for (const m of sorted) {
      if (unique.length >= target) break;
      if (!seen.has(m.id)) {
        unique.push(m);
        seen.add(m.id);
      }
    }
  }

  return unique
    .sort((a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime())
    .map((m) => m.id);
}

/**
 * Pick `target` memories that are balanced across BOTH year and category
 * using a round-robin draft, so the selection doesn't over-focus on any
 * one period or theme.
 */
export function balancedPickMemories(memories: Memory[], target: number): string[] {
  if (memories.length === 0 || target <= 0) return [];
  if (memories.length <= target) {
    return [...memories]
      .sort((a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime())
      .map((m) => m.id);
  }

  const byYear = new Map<number, Map<string, Memory[]>>();
  memories.forEach((m) => {
    const y = new Date(m.happened_at).getFullYear();
    const c = m.category || "Everyday";
    if (!byYear.has(y)) byYear.set(y, new Map());
    const cats = byYear.get(y)!;
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(m);
  });

  // Within each leaf bucket: prefer photos, then by date.
  byYear.forEach((cats) =>
    cats.forEach((arr) =>
      arr.sort((a, b) => {
        const ap = a.photo_url ? 0 : 1;
        const bp = b.photo_url ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime();
      }),
    ),
  );

  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  const picked: Memory[] = [];
  const seen = new Set<string>();

  let pass = 0;
  let progressed = true;
  while (picked.length < target && progressed) {
    progressed = false;
    for (const year of years) {
      if (picked.length >= target) break;
      const cats = byYear.get(year)!;
      const catKeys = Array.from(cats.keys());
      for (let i = 0; i < catKeys.length; i++) {
        const key = catKeys[(i + pass) % catKeys.length];
        const bucket = cats.get(key)!;
        const next = bucket.find((m) => !seen.has(m.id));
        if (next) {
          picked.push(next);
          seen.add(next.id);
          progressed = true;
          break;
        }
      }
    }
    pass += 1;
  }

  return picked
    .sort((a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime())
    .map((m) => m.id);
}
