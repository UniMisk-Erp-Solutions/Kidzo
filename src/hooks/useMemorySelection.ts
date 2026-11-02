import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Memory } from "@/hooks/useMemories";
import { smartPickMemories, balancedPickMemories } from "@/lib/smartPickMemories";

/** The chosen memory ids (in book order) and every way the step changes them. */
export function useMemorySelection(memories: Memory[], target: number) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addMany = (ids: string[]) => setSelected((prev) => Array.from(new Set([...prev, ...ids])));

  const removeMany = (ids: string[]) => {
    const drop = new Set(ids);
    setSelected((prev) => prev.filter((x) => !drop.has(x)));
  };

  /** "Select these N" / "Deselect these N": if every id is already picked remove them, otherwise add them. */
  const toggleMany = (ids: string[]) => {
    const allIn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((prev) => (allIn ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))));
  };

  const selectAll = () => setSelected(memories.map((m) => m.id));
  const clearAll = () => setSelected([]);

  const smartPick = () => {
    const picked = smartPickMemories(memories, target);
    setSelected(picked);
    toast.success(`Auto-picked ${picked.length} memories`);
  };

  const balancedPick = () => {
    const picked = balancedPickMemories(memories, target);
    setSelected(picked);
    toast.success(`Balanced ${picked.length} memories across years & categories`);
  };

  return { selected, setSelected, toggle, addMany, removeMany, toggleMany, selectAll, clearAll, smartPick, balancedPick };
}

interface HydrateArgs {
  book: { memories_selected?: string[] | null } | null | undefined;
  memories: Memory[];
  target: number;
  childName?: string;
  setSelected: (ids: string[]) => void;
}

/** Fills the selection from the saved book — and smart-picks on first entry if nothing was saved. */
export function useHydrateSelection({ book, memories, target, childName, setSelected }: HydrateArgs) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (!book || hasHydrated || memories.length === 0) return;
    const existing = book.memories_selected ?? [];
    if (existing.length > 0) {
      setSelected(existing);
    } else {
      const picked = smartPickMemories(memories, target);
      setSelected(picked);
      if (picked.length > 0) {
        toast.success(`Auto-picked ${picked.length} memories spread across ${childName ?? "your child"}'s journey`);
      }
    }
    setHasHydrated(true);
  }, [book, memories, target, hasHydrated, childName, setSelected]);
}
