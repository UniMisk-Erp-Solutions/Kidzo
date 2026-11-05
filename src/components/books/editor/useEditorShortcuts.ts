import { useEffect, useRef } from "react";

export interface ShortcutContext {
  hasSelection: boolean;
  undo: () => void;
  redo: () => void;
  duplicate: () => void;
  remove: () => void;
  /** Move the selection by this many design pixels. */
  nudge: (dx: number, dy: number) => void;
  toggleHelp: () => void;
  clearSelection: () => void;
  /** Show (true) or stop showing (false) the original design while the peek key is held. */
  peek: (on: boolean) => void;
}

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
};

/** Ctrl/Cmd + key. */
const MOD_ACTIONS = new Map<string, (e: KeyboardEvent, c: ShortcutContext) => void>([
  ["z", (e, c) => (e.shiftKey ? c.redo() : c.undo())],
  ["y", (_e, c) => c.redo()],
  ["d", (_e, c) => c.duplicate()],
]);

const ARROWS = new Map<string, [number, number]>([
  ["ArrowLeft", [-1, 0]],
  ["ArrowRight", [1, 0]],
  ["ArrowUp", [0, -1]],
  ["ArrowDown", [0, 1]],
]);

/** Ctrl/Cmd shortcuts. Returns true when the key was handled. */
function handleModifierKey(e: KeyboardEvent, c: ShortcutContext): boolean {
  const action = e.metaKey || e.ctrlKey ? MOD_ACTIONS.get(e.key.toLowerCase()) : undefined;
  if (!action) return false;
  e.preventDefault();
  action(e, c);
  return true;
}

/** Delete and arrow-key nudging, which only apply while something is selected. Returns true when handled. */
function handleSelectionKey(e: KeyboardEvent, c: ShortcutContext): boolean {
  if (!c.hasSelection) return false;
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    c.remove();
    return true;
  }
  const arrow = ARROWS.get(e.key);
  if (!arrow) return false;
  e.preventDefault();
  const step = e.shiftKey ? 10 : 1;
  c.nudge(arrow[0] * step, arrow[1] * step);
  return true;
}

function handleKeyDown(e: KeyboardEvent, c: ShortcutContext) {
  if (isTypingTarget(e.target)) return;
  if (handleModifierKey(e, c) || handleSelectionKey(e, c)) return;
  if (e.key === "?" || (e.shiftKey && e.key === "/")) {
    e.preventDefault();
    c.toggleHelp();
    return;
  }
  if (e.key === "Escape") c.clearSelection();
  // Hold "\" to peek at the original design (release to return).
  if (e.key === "\\" && !e.repeat) {
    e.preventDefault();
    c.peek(true);
  }
}

/** Editor keyboard shortcuts: undo/redo, duplicate, delete, arrow-key nudging, "?" help, Esc, and "\" peek. */
export function useEditorShortcuts(ctx: ShortcutContext) {
  // Always use the latest editor state at key-press time, so the listeners are added only once.
  const latest = useRef(ctx);
  latest.current = ctx;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e, latest.current);
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "\\") latest.current.peek(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
