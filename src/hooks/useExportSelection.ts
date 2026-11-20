import { useCallback, useState } from "react";

/**
 * Selection survives page changes. Default: everything selected (`off` lists exceptions); after "None":
 * nothing selected (`on` lists exceptions).
 */
export const useExportSelection = (totalMemories: number) => {
  const [allDefault, setAllDefault] = useState(true);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [on, setOn] = useState<Set<string>>(new Set());

  const isSel = (id: string) => (allDefault ? !off.has(id) : on.has(id));

  const setSel = (ids: string[], value: boolean) => {
    const target = allDefault ? off : on;
    const next = new Set(target);
    // `off` holds the deselected ids, `on` the selected ones: adding to the set means "deselect" for `off`.
    const addsToSet = allDefault ? !value : value;
    ids.forEach((id) => (addsToSet ? next.add(id) : next.delete(id)));
    (allDefault ? setOff : setOn)(next);
  };

  const includedCount = allDefault ? totalMemories - off.size : on.size;

  const selectedAmong = useCallback(
    (memories: { id: string }[]) =>
      new Set(memories.filter((m) => (allDefault ? !off.has(m.id) : on.has(m.id))).map((m) => m.id)),
    [allDefault, off, on],
  );

  const reset = (selectEverything: boolean) => {
    setAllDefault(selectEverything);
    setOff(new Set());
    setOn(new Set());
  };

  return {
    isSel,
    setSel,
    includedCount,
    selectedAmong,
    selectAll: () => reset(true),
    selectNone: () => reset(false),
  };
};
