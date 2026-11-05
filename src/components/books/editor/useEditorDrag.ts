import { useEffect, useRef, type MutableRefObject } from "react";
import { handlePointerMove, recordDragInHistory, type DragContext } from "./dragHandlers";
import type { DesignBox, DragSession, GuideLine, Point } from "./dragSession";

interface Params {
  ctx: DragContext;
  dragRef: MutableRefObject<DragSession>;
  lastClientRef: MutableRefObject<Point>;
  setMarquee: (box: DesignBox | null) => void;
  setGuides: (g: GuideLine[]) => void;
}

/** Listens for pointer moves / releases anywhere on the page and runs the current drag (move, resize, rotate…). */
export function useEditorDrag({ ctx, dragRef, lastClientRef, setMarquee, setGuides }: Params) {
  // Always read the latest editor state at event time, so the listeners are added only once.
  const latest = useRef(ctx);
  latest.current = ctx;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      lastClientRef.current = { x: e.clientX, y: e.clientY };
      const d = dragRef.current;
      if (d) handlePointerMove(d, e, latest.current);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d) recordDragInHistory(d, latest.current);
      dragRef.current = null;
      setMarquee(null);
      setGuides([]);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragRef, lastClientRef, setMarquee, setGuides]);
}
