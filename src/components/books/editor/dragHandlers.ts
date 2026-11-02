/** What happens on each pointer move / release while dragging on the editor canvas. One small function per kind of drag. */
import type { Dispatch, SetStateAction } from "react";
import { EDITOR_CANVAS_H, EDITOR_CANVAS_W, clamp, type EditorElement } from "./types";
import type { DesignBox, Drag, GuideLine, Point } from "./dragSession";

export const HISTORY_LIMIT = 50;

type Kind<K extends Drag["kind"]> = Extract<Drag, { kind: K }>;

/** Everything a drag needs from the editor. Kept in a ref by the hook so handlers always see the latest values. */
export interface DragContext {
  zoom: number;
  elements: EditorElement[];
  screenToDesign: (clientX: number, clientY: number) => Point;
  /** Snap a moving box to guides; `bypass` (Ctrl/Cmd held) turns snapping off. */
  snapBox: (box: DesignBox, dx: number, dy: number, bypass: boolean) => { dx: number; dy: number; guides: GuideLine[] };
  setPan: (p: Point) => void;
  setMarquee: (box: DesignBox | null) => void;
  setSelectedIds: (ids: string[]) => void;
  setGuides: (g: GuideLine[]) => void;
  setElements: Dispatch<SetStateAction<EditorElement[]>>;
  /** Undo history and the counter that re-renders the toolbar when it changes. */
  history: { current: { past: EditorElement[][]; future: EditorElement[][] } };
  bumpHistory: () => void;
}

const patchWhere = (list: EditorElement[], id: string, patch: Partial<EditorElement>) =>
  list.map((el) => (el.id === id ? ({ ...el, ...patch } as EditorElement) : el));

function movePan(d: Kind<"pan">, e: PointerEvent, ctx: DragContext) {
  ctx.setPan({ x: d.startPan.x + (e.clientX - d.startClient.x), y: d.startPan.y + (e.clientY - d.startClient.y) });
}

/** Ids of the elements whose centre lies inside the box. */
const idsInside = (els: EditorElement[], b: DesignBox) =>
  els
    .filter((el) => !el.locked && !el.hidden && el.x >= b.x && el.x <= b.x + b.w && el.y >= b.y && el.y <= b.y + b.h)
    .map((el) => el.id);

function moveMarquee(d: Kind<"marquee">, e: PointerEvent, ctx: DragContext) {
  const cur = ctx.screenToDesign(e.clientX, e.clientY);
  const box = {
    x: Math.min(d.startDesign.x, cur.x),
    y: Math.min(d.startDesign.y, cur.y),
    w: Math.abs(cur.x - d.startDesign.x),
    h: Math.abs(cur.y - d.startDesign.y),
  };
  ctx.setMarquee(box);
  const hit = idsInside(ctx.elements, box);
  ctx.setSelectedIds(d.additive ? Array.from(new Set([...d.previousIds, ...hit])) : hit);
}

function moveElements(d: Kind<"move">, e: PointerEvent, ctx: DragContext) {
  const dx = (e.clientX - d.startClient.x) / ctx.zoom;
  const dy = (e.clientY - d.startClient.y) / ctx.zoom;
  const snapped = ctx.snapBox(d.startBox, dx, dy, e.ctrlKey || e.metaKey);
  ctx.setGuides(snapped.guides);
  ctx.setElements((cur) =>
    cur.map((el) => {
      const start = d.startEls[el.id];
      if (!start) return el;
      return {
        ...el,
        x: clamp(start.x + snapped.dx, 0, EDITOR_CANVAS_W),
        y: clamp(start.y + snapped.dy, 0, EDITOR_CANVAS_H),
      };
    }),
  );
}

/** New size for a resize drag: the pointer's distance from the element's centre, in the element's own (rotated) axes. */
function resizedSize(start: EditorElement, cur: Point, keepRatio: boolean) {
  const rad = (-start.rotation * Math.PI) / 180;
  const lx = (cur.x - start.x) * Math.cos(rad) - (cur.y - start.y) * Math.sin(rad);
  const ly = (cur.x - start.x) * Math.sin(rad) + (cur.y - start.y) * Math.cos(rad);
  let w = Math.max(20, Math.abs(lx) * 2);
  let h = Math.max(16, Math.abs(ly) * 2);
  if (!keepRatio) return { w, h };
  const ratio = start.w / Math.max(1, start.h);
  if (w / start.w >= h / start.h) h = Math.max(16, w / ratio);
  else w = Math.max(20, h * ratio);
  return { w, h };
}

function resizeElement(d: Kind<"resize">, e: PointerEvent, ctx: DragContext) {
  const size = resizedSize(d.startEl, ctx.screenToDesign(e.clientX, e.clientY), e.shiftKey);
  ctx.setElements((cur) => patchWhere(cur, d.id, size));
}

function rotateElement(d: Kind<"rotate">, e: PointerEvent, ctx: DragContext) {
  const cur = ctx.screenToDesign(e.clientX, e.clientY);
  const angle = (Math.atan2(cur.y - d.startEl.y, cur.x - d.startEl.x) * 180) / Math.PI;
  let rotation = Math.round(angle + 90);
  if (e.shiftKey) rotation = Math.round(rotation / 15) * 15;
  ctx.setElements((list) => patchWhere(list, d.id, { rotation }));
}

function groupResize(d: Kind<"group-resize">, e: PointerEvent, ctx: DragContext) {
  const cur = ctx.screenToDesign(e.clientX, e.clientY);
  const sx = Math.max(20, cur.x - d.anchor.x) / d.startW;
  const sy = Math.max(20, cur.y - d.anchor.y) / d.startH;
  const s = Math.min(sx, sy);
  const fx = e.shiftKey ? s : sx;
  const fy = e.shiftKey ? s : sy;
  ctx.setElements((list) =>
    list.map((el) => {
      const start = d.startEls[el.id];
      if (!start) return el;
      return {
        ...el,
        x: d.anchor.x + (start.x - d.anchor.x) * fx,
        y: d.anchor.y + (start.y - d.anchor.y) * fy,
        w: Math.max(10, start.w * fx),
        h: Math.max(10, start.h * fy),
      };
    }),
  );
}

function groupRotate(d: Kind<"group-rotate">, e: PointerEvent, ctx: DragContext) {
  const cur = ctx.screenToDesign(e.clientX, e.clientY);
  const angle = Math.atan2(cur.y - d.center.y, cur.x - d.center.x);
  let delta = ((angle - d.startAngle) * 180) / Math.PI;
  if (e.shiftKey) delta = Math.round(delta / 15) * 15;
  const cos = Math.cos((delta * Math.PI) / 180);
  const sin = Math.sin((delta * Math.PI) / 180);
  ctx.setElements((list) =>
    list.map((el) => {
      const start = d.startEls[el.id];
      if (!start) return el;
      const offX = start.x - d.center.x;
      const offY = start.y - d.center.y;
      return {
        ...el,
        x: d.center.x + offX * cos - offY * sin,
        y: d.center.y + offX * sin + offY * cos,
        rotation: start.rotation + delta,
      };
    }),
  );
}

/** Route a pointer move to the handler for the current kind of drag. */
export function handlePointerMove(d: Drag, e: PointerEvent, ctx: DragContext) {
  switch (d.kind) {
    case "pan":
      return movePan(d, e, ctx);
    case "marquee":
      return moveMarquee(d, e, ctx);
    case "move":
      return moveElements(d, e, ctx);
    case "resize":
      return resizeElement(d, e, ctx);
    case "rotate":
      return rotateElement(d, e, ctx);
    case "group-resize":
      return groupResize(d, e, ctx);
    case "group-rotate":
      return groupRotate(d, e, ctx);
  }
}

/** The elements as they were before an edit-type drag began, or null for drags that don't change the page. */
function stateBeforeDrag(d: Drag, cur: EditorElement[]): EditorElement[] | null {
  switch (d.kind) {
    case "move":
    case "group-resize":
    case "group-rotate":
      return cur.map((el) => d.startEls[el.id] ?? el);
    case "resize":
    case "rotate":
      return cur.map((el) => (el.id === d.id ? d.startEl : el));
    default:
      return null;
  }
}

/** When a drag that changed the page ends, remember the state from before it so Undo can restore it. */
export function recordDragInHistory(d: Drag, ctx: DragContext) {
  if (d.kind === "pan" || d.kind === "marquee") return;
  ctx.setElements((cur) => {
    const before = stateBeforeDrag(d, cur);
    if (before) {
      const h = ctx.history.current;
      h.past.push(before);
      if (h.past.length > HISTORY_LIMIT) h.past.shift();
      h.future = [];
      ctx.bumpHistory();
    }
    return cur;
  });
}
