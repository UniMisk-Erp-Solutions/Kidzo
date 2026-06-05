import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Bold,
  Italic,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer2,
  Magnet,
  CopyPlus,
  Keyboard,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Crop as CropIcon,
  SplitSquareHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { renderElement, ALL_STICKER_SHAPES } from "./EditorElements";
import {
  EDITOR_CANVAS_H,
  EDITOR_CANVAS_W,
  clamp,
  uid,
  type EditorElement,
  type StickerElement,
  type StickerShape,
  type TapeElement,
  type TextElement,
  type BadgeElement,
  type PhotoElement,
  type EmojiElement,
} from "./types";
import { seedElementsFromPage } from "./seedFromPage";
import { parseClipboardHtml, fetchImageAsDataUrl, loadImageDims } from "./clipboardParser";
import { PhotoCropDialog } from "./PhotoCropDialog";
import { ColorPicker } from "./ColorPicker";
import type { BookPage } from "../BookPages";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";

/* ─────────────────── constants ─────────────────── */

const TAPE_PATTERNS: TapeElement["pattern"][] = ["stripes", "dots", "checks", "solid"];

const EMOJI_LIBRARY: { group: string; items: string[] }[] = [
  { group: "Smileys", items: ["😀","😃","😄","😁","😆","😊","🥰","😍","🤩","😎","🤗","🥳","😴","🤤","😇","🤓","🥹","😋","😝","🤪"] },
  { group: "Hearts", items: ["❤️","🧡","💛","💚","💙","💜","🤍","🖤","🤎","💖","💗","💓","💕","💞","💘","💝","💟","♥️","💌"] },
  { group: "Celebration", items: ["🎉","🎊","🎈","🎁","🎂","🍰","🧁","🍭","🍬","🍫","🎀","🎗️","🏆","🥇","🥈","🥉","🎖️","👑","💎"] },
  { group: "Family", items: ["👶","🧒","👦","👧","👩","👨","👵","👴","🤱","👨‍👩‍👧","👨‍👩‍👦","👩‍👧","👨‍👧","👨‍👦","🧑‍🍼"] },
  { group: "Nature", items: ["🌸","🌺","🌻","🌼","🌷","🌹","🌱","🌿","🍀","🌳","🌴","🌵","🌾","🌊","☀️","🌙","⭐","✨","🌈","☁️","❄️","🔥","💧"] },
  { group: "Animals", items: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🦄","🐝","🦋","🐳"] },
  { group: "Food", items: ["🍎","🍌","🍓","🍒","🍑","🥭","🍍","🥥","🥑","🍅","🥕","🌽","🥨","🍞","🧀","🥞","🍔","🍕","🌭","🌮","🍿","🍪"] },
  { group: "Travel", items: ["✈️","🚗","🚕","🚙","🚌","🚲","⛵","🚀","🗺️","🧳","🎒","🏖️","⛰️","🏕️","🎡","🎢","🏰","🗽","🌍","🌎","🌏"] },
  { group: "Activities", items: ["⚽","🏀","🏈","⚾","🎾","🏐","🥎","🎱","🏓","🎯","🎳","🎮","🎲","🎨","🎭","🎤","🎵","🎶","📚","✏️","🖍️"] },
  { group: "Symbols", items: ["✅","❌","⭕","❗","❓","💯","🔔","🔕","💤","💢","💬","💭","🗯️","♨️","🆗","🆕","🆒","🔆","🔅","➕","➖"] },
];

const SNAP_TOLERANCE = 6; // design pixels at 100% zoom
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const HISTORY_LIMIT = 50;

type Tool = "select" | "pan";

function rotatedBounds(el: Pick<EditorElement, "x" | "y" | "w" | "h" | "rotation">): DesignBox {
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = el.w * cos + el.h * sin;
  const h = el.w * sin + el.h * cos;
  return { x: el.x - w / 2, y: el.y - h / 2, w, h };
}

function boxLines(box: DesignBox) {
  return {
    x: [box.x, box.x + box.w / 2, box.x + box.w],
    y: [box.y, box.y + box.h / 2, box.y + box.h],
  };
}

function boundsForElements(els: EditorElement[]): DesignBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  els.forEach((el) => {
    const b = rotatedBounds(el);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  });
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

interface PageEditorProps {
  page: BookPage;
  renderBackground: () => React.ReactNode;
  initialElements: EditorElement[];
  initialHideNative: boolean;
  initialNativeEditable: boolean;
  colors: BookTemplateColors;
  /** Stable id used to scope recents & saved swatches. */
  bookId?: string;
  onSave: (els: EditorElement[], hideNative: boolean, nativeEditable: boolean) => void;
  onCancel: () => void;
  saving?: boolean;
}

type GuideLine = { axis: "v" | "h"; pos: number };

type DesignBox = { x: number; y: number; w: number; h: number };

type DragSession =
  | null
  | {
      kind: "move";
      ids: string[];
      startClient: { x: number; y: number };
      startEls: Record<string, EditorElement>;
      startBox: DesignBox;
    }
  | {
      kind: "resize";
      id: string;
      startClient: { x: number; y: number };
      startEl: EditorElement;
    }
  | {
      kind: "rotate";
      id: string;
      startEl: EditorElement;
    }
  | {
      kind: "group-resize";
      ids: string[];
      startEls: Record<string, EditorElement>;
      startW: number;
      startH: number;
      anchor: { x: number; y: number };
      startBox: DesignBox;
    }
  | {
      kind: "group-rotate";
      ids: string[];
      startEls: Record<string, EditorElement>;
      center: { x: number; y: number };
      startAngle: number;
    }
  | {
      kind: "marquee";
      startClient: { x: number; y: number };
      startDesign: { x: number; y: number };
      additive: boolean;
      previousIds: string[];
    }
  | {
      kind: "pan";
      startClient: { x: number; y: number };
      startPan: { x: number; y: number };
    };

/* ─────────────────── component ─────────────────── */

export function PageEditor({
  page,
  renderBackground,
  initialElements,
  initialHideNative,
  initialNativeEditable,
  colors,
  bookId,
  onSave,
  onCancel,
  saving,
}: PageEditorProps) {
  /* state */
  const [elements, setElements] = useState<EditorElement[]>(initialElements);
  // Keep the native design visible by default — every editable element is
  // layered on top in the same position, so the page LOOKS identical to the
  // original (preserving tapes, torn-paper edges, doodles, sticky-note shapes
  // and other decorations) while everything is fully editable. Toggle
  // "Show original design behind" to hide it for a blank canvas.
  const [hideNative, setHideNative] = useState(initialHideNative ?? false);
  const [nativeEditable, setNativeEditable] = useState(initialNativeEditable);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>("select");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"add" | "props" | "layers">("add");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [cropPhotoId, setCropPhotoId] = useState<string | null>(null);
  /** While true, editable layers fade and the original native design is
   *  spotlighted so the user can compare what's missing or misaligned.
   *  Toggle with the toolbar button or hold the backslash key. */
  const [compareMode, setCompareMode] = useState(false);

  /* refs */
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession>(null);
  const lastClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  /* history */
  const historyRef = useRef<{ past: EditorElement[][]; future: EditorElement[][] }>({
    past: [],
    future: [],
  });
  const [historyTick, setHistoryTick] = useState(0);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  /** Commit a change to history & update state. */
  const commit = useCallback(
    (next: EditorElement[] | ((prev: EditorElement[]) => EditorElement[])) => {
      setElements((prev) => {
        const newEls = typeof next === "function" ? (next as (p: EditorElement[]) => EditorElement[])(prev) : next;
        if (newEls === prev) return prev;
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > HISTORY_LIMIT) historyRef.current.past.shift();
        historyRef.current.future = [];
        setHistoryTick((t) => t + 1);
        return newEls;
      });
    },
    [],
  );

  const undo = useCallback(() => {
    const h = historyRef.current;
    const prev = h.past.pop();
    if (!prev) return;
    setElements((cur) => {
      h.future.push(cur);
      return prev;
    });
    setHistoryTick((t) => t + 1);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const next = h.future.pop();
    if (!next) return;
    setElements((cur) => {
      h.past.push(cur);
      return next;
    });
    setHistoryTick((t) => t + 1);
  }, []);

  /* selection helpers */
  const selectedEls = useMemo(
    () => elements.filter((e) => selectedIds.includes(e.id)),
    [elements, selectedIds],
  );
  const singleSelected = selectedEls.length === 1 ? selectedEls[0] : null;

  /* Auto-switch to props tab when something is selected. */
  useEffect(() => {
    if (selectedIds.length > 0 && activeTab === "add") setActiveTab("props");
    if (selectedIds.length === 0 && activeTab === "props") setActiveTab("add");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.length]);

  /* coords conversion: screen <-> design */
  const screenToDesign = useCallback(
    (clientX: number, clientY: number) => {
      const rect = stageRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / zoom,
        y: (clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  /* viewport sizing & initial fit */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const fit = () => {
      const w = vp.clientWidth - 32;
      const h = vp.clientHeight - 32;
      if (w <= 0 || h <= 0) return;
      const z = Math.min(w / EDITOR_CANVAS_W, h / EDITOR_CANVAS_H, 1);
      setZoom(z);
      const ow = EDITOR_CANVAS_W * z;
      const oh = EDITOR_CANVAS_H * z;
      setPan({ x: (vp.clientWidth - ow) / 2, y: (vp.clientHeight - oh) / 2 });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(vp);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recenterToZoom = useCallback((newZoom: number, anchorClient?: { x: number; y: number }) => {
    const vp = viewportRef.current;
    if (!vp) return;
    if (!anchorClient) {
      const ow = EDITOR_CANVAS_W * newZoom;
      const oh = EDITOR_CANVAS_H * newZoom;
      setPan({ x: (vp.clientWidth - ow) / 2, y: (vp.clientHeight - oh) / 2 });
      return;
    }
    const rect = stageRef.current!.getBoundingClientRect();
    const dx = anchorClient.x - rect.left;
    const dy = anchorClient.y - rect.top;
    const ratio = newZoom / zoom;
    setPan((p) => ({
      x: p.x - dx * (ratio - 1),
      y: p.y - dy * (ratio - 1),
    }));
  }, [zoom]);

  const zoomIn = () => {
    const next = clamp(zoom * 1.25, MIN_ZOOM, MAX_ZOOM);
    recenterToZoom(next, lastClientRef.current);
    setZoom(next);
  };
  const zoomOut = () => {
    const next = clamp(zoom / 1.25, MIN_ZOOM, MAX_ZOOM);
    recenterToZoom(next, lastClientRef.current);
    setZoom(next);
  };
  const zoomFit = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    const w = vp.clientWidth - 32;
    const h = vp.clientHeight - 32;
    const z = Math.min(w / EDITOR_CANVAS_W, h / EDITOR_CANVAS_H, 1);
    setZoom(z);
    recenterToZoom(z);
  };

  /* ─────────────────── snapping ─────────────────── */

  const snapTargetsX = useMemo(() => {
    const xs = new Set<number>([0, EDITOR_CANVAS_W / 2, EDITOR_CANVAS_W]);
    elements.forEach((e) => {
      if (selectedIds.includes(e.id) || e.hidden) return;
      const lines = boxLines(rotatedBounds(e));
      lines.x.forEach((x) => xs.add(x));
    });
    for (let x = 25; x < EDITOR_CANVAS_W; x += 25) xs.add(x);
    return Array.from(xs);
  }, [elements, selectedIds]);

  const snapTargetsY = useMemo(() => {
    const ys = new Set<number>([0, EDITOR_CANVAS_H / 2, EDITOR_CANVAS_H]);
    elements.forEach((e) => {
      if (selectedIds.includes(e.id) || e.hidden) return;
      const lines = boxLines(rotatedBounds(e));
      lines.y.forEach((y) => ys.add(y));
    });
    for (let y = 25; y < EDITOR_CANVAS_H; y += 25) ys.add(y);
    return Array.from(ys);
  }, [elements, selectedIds]);

  function applySnapToBox(box: DesignBox, dx: number, dy: number, disabled = false): { dx: number; dy: number; guides: GuideLine[] } {
    if (!snapEnabled || disabled) return { dx, dy, guides: [] };
    const tol = SNAP_TOLERANCE / zoom;
    const moved = { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h };
    const candidates = boxLines(moved);

    let snapDx = 0;
    let snapDy = 0;
    const activeGuides: GuideLine[] = [];

    let bestX = tol;
    for (const c of candidates.x) {
      for (const t of snapTargetsX) {
        const d = t - c;
        if (Math.abs(d) < bestX) {
          bestX = Math.abs(d);
          snapDx = d;
        }
      }
    }
    if (bestX < tol) {
      const lines = boxLines({ ...moved, x: moved.x + snapDx }).x;
      for (const t of snapTargetsX) {
        if (lines.some((l) => Math.abs(l - t) < 0.5)) {
          activeGuides.push({ axis: "v", pos: t });
        }
      }
    }

    let bestY = tol;
    for (const c of candidates.y) {
      for (const t of snapTargetsY) {
        const d = t - c;
        if (Math.abs(d) < bestY) {
          bestY = Math.abs(d);
          snapDy = d;
        }
      }
    }
    if (bestY < tol) {
      const lines = boxLines({ ...moved, y: moved.y + snapDy }).y;
      for (const t of snapTargetsY) {
        if (lines.some((l) => Math.abs(l - t) < 0.5)) {
          activeGuides.push({ axis: "h", pos: t });
        }
      }
    }

    return { dx: dx + snapDx, dy: dy + snapDy, guides: activeGuides };
  }

  function applySnap(el: EditorElement, dx: number, dy: number, disabled = false): { dx: number; dy: number; guides: GuideLine[] } {
    return applySnapToBox(rotatedBounds(el), dx, dy, disabled);
  }

  /* ─────────────────── pointer flow ─────────────────── */

  const onViewportPointerDown = (e: React.PointerEvent) => {
    lastClientRef.current = { x: e.clientX, y: e.clientY };

    if (tool === "pan" || e.button === 1) {
      e.preventDefault();
      dragRef.current = {
        kind: "pan",
        startClient: { x: e.clientX, y: e.clientY },
        startPan: { ...pan },
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    const additive = e.shiftKey;
    const start = screenToDesign(e.clientX, e.clientY);
    dragRef.current = {
      kind: "marquee",
      startClient: { x: e.clientX, y: e.clientY },
      startDesign: start,
      additive,
      previousIds: additive ? [...selectedIds] : [],
    };
    if (!additive) setSelectedIds([]);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const beginElementDrag = (e: React.PointerEvent, el: EditorElement) => {
    if (el.locked) return;
    e.stopPropagation();
    lastClientRef.current = { x: e.clientX, y: e.clientY };

    let nextIds: string[];
    if (e.shiftKey) {
      nextIds = selectedIds.includes(el.id)
        ? selectedIds.filter((id) => id !== el.id)
        : [...selectedIds, el.id];
      setSelectedIds(nextIds);
    } else if (selectedIds.includes(el.id)) {
      nextIds = selectedIds;
    } else {
      nextIds = [el.id];
      setSelectedIds(nextIds);
    }

    if (nextIds.length === 0) return;

    const startEls: Record<string, EditorElement> = {};
    elements.forEach((x) => {
      if (nextIds.includes(x.id)) startEls[x.id] = { ...x };
    });
    dragRef.current = {
      kind: "move",
      ids: nextIds,
      startClient: { x: e.clientX, y: e.clientY },
      startEls,
      startBox: boundsForElements(Object.values(startEls)),
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const beginResize = (e: React.PointerEvent, el: EditorElement) => {
    e.stopPropagation();
    dragRef.current = {
      kind: "resize",
      id: el.id,
      startClient: { x: e.clientX, y: e.clientY },
      startEl: { ...el },
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const beginRotate = (e: React.PointerEvent, el: EditorElement) => {
    e.stopPropagation();
    dragRef.current = {
      kind: "rotate",
      id: el.id,
      startEl: { ...el },
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  /** Group resize: anchor opposite corner; scale all selected elements proportionally
   *  about the anchor, including their w/h and offset from anchor. */
  const beginGroupResize = (e: React.PointerEvent, bbox: { x: number; y: number; w: number; h: number }) => {
    e.stopPropagation();
    const startEls: Record<string, EditorElement> = {};
    elements.forEach((x) => {
      if (selectedIds.includes(x.id)) startEls[x.id] = { ...x };
    });
    dragRef.current = {
      kind: "group-resize",
      ids: selectedIds,
      startEls,
      startW: bbox.w,
      startH: bbox.h,
      anchor: { x: bbox.x, y: bbox.y }, // top-left fixed
      startBox: bbox,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const beginGroupRotate = (e: React.PointerEvent, bbox: { x: number; y: number; w: number; h: number }) => {
    e.stopPropagation();
    const center = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
    const cur = screenToDesign(e.clientX, e.clientY);
    const startAngle = Math.atan2(cur.y - center.y, cur.x - center.x);
    const startEls: Record<string, EditorElement> = {};
    elements.forEach((x) => {
      if (selectedIds.includes(x.id)) startEls[x.id] = { ...x };
    });
    dragRef.current = {
      kind: "group-rotate",
      ids: selectedIds,
      startEls,
      center,
      startAngle,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  /* global pointer move/up */
  useEffect(() => {
    function onMove(e: PointerEvent) {
      lastClientRef.current = { x: e.clientX, y: e.clientY };
      const d = dragRef.current;
      if (!d) return;

      if (d.kind === "pan") {
        const dx = e.clientX - d.startClient.x;
        const dy = e.clientY - d.startClient.y;
        setPan({ x: d.startPan.x + dx, y: d.startPan.y + dy });
        return;
      }

      if (d.kind === "marquee") {
        const cur = screenToDesign(e.clientX, e.clientY);
        const x = Math.min(d.startDesign.x, cur.x);
        const y = Math.min(d.startDesign.y, cur.y);
        const w = Math.abs(cur.x - d.startDesign.x);
        const h = Math.abs(cur.y - d.startDesign.y);
        setMarquee({ x, y, w, h });
        const hit = elements
          .filter((el) => !el.locked && !el.hidden && el.x >= x && el.x <= x + w && el.y >= y && el.y <= y + h)
          .map((el) => el.id);
        const next = d.additive ? Array.from(new Set([...d.previousIds, ...hit])) : hit;
        setSelectedIds(next);
        return;
      }

      if (d.kind === "move") {
        const dx = (e.clientX - d.startClient.x) / zoom;
        const dy = (e.clientY - d.startClient.y) / zoom;
        const snapped = applySnapToBox(d.startBox, dx, dy, e.ctrlKey || e.metaKey);
        setGuides(snapped.guides);
        setElements((cur) =>
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
        return;
      }

      if (d.kind === "resize") {
        const cur = screenToDesign(e.clientX, e.clientY);
        const start = d.startEl;
        const rad = (-start.rotation * Math.PI) / 180;
        const lx = (cur.x - start.x) * Math.cos(rad) - (cur.y - start.y) * Math.sin(rad);
        const ly = (cur.x - start.x) * Math.sin(rad) + (cur.y - start.y) * Math.cos(rad);
        let newW = Math.max(20, Math.abs(lx) * 2);
        let newH = Math.max(16, Math.abs(ly) * 2);
        if (e.shiftKey) {
          const ratio = start.w / Math.max(1, start.h);
          if (newW / start.w >= newH / start.h) newH = Math.max(16, newW / ratio);
          else newW = Math.max(20, newH * ratio);
        }
        setElements((cur2) => cur2.map((el) => (el.id === d.id ? { ...el, w: newW, h: newH } : el)));
        return;
      }

      if (d.kind === "rotate") {
        const cur = screenToDesign(e.clientX, e.clientY);
        const start = d.startEl;
        const angle = (Math.atan2(cur.y - start.y, cur.x - start.x) * 180) / Math.PI;
        let rot = Math.round(angle + 90);
        if (e.shiftKey) rot = Math.round(rot / 15) * 15;
        setElements((cur2) => cur2.map((el) => (el.id === d.id ? { ...el, rotation: rot } : el)));
        return;
      }

      if (d.kind === "group-resize") {
        const cur = screenToDesign(e.clientX, e.clientY);
        const newW = Math.max(20, cur.x - d.anchor.x);
        const newH = Math.max(20, cur.y - d.anchor.y);
        const sx = newW / d.startW;
        const sy = newH / d.startH;
        const s = Math.min(sx, sy);
        setElements((cur2) =>
          cur2.map((el) => {
            const start = d.startEls[el.id];
            if (!start) return el;
            const offX = start.x - d.anchor.x;
            const offY = start.y - d.anchor.y;
            return {
              ...el,
              x: d.anchor.x + offX * (e.shiftKey ? s : sx),
              y: d.anchor.y + offY * (e.shiftKey ? s : sy),
              w: Math.max(10, start.w * (e.shiftKey ? s : sx)),
              h: Math.max(10, start.h * (e.shiftKey ? s : sy)),
            };
          }),
        );
        return;
      }

      if (d.kind === "group-rotate") {
        const cur = screenToDesign(e.clientX, e.clientY);
        const angle = Math.atan2(cur.y - d.center.y, cur.x - d.center.x);
        let delta = ((angle - d.startAngle) * 180) / Math.PI;
        if (e.shiftKey) delta = Math.round(delta / 15) * 15;
        const cos = Math.cos((delta * Math.PI) / 180);
        const sin = Math.sin((delta * Math.PI) / 180);
        setElements((cur2) =>
          cur2.map((el) => {
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
        return;
      }
    }

    function onUp() {
      const d = dragRef.current;
      if (
        d &&
        (d.kind === "move" ||
          d.kind === "resize" ||
          d.kind === "rotate" ||
          d.kind === "group-resize" ||
          d.kind === "group-rotate")
      ) {
        // Push pre-drag state to history
        setElements((cur) => {
          let snapshot: EditorElement[];
          if (d.kind === "move" || d.kind === "group-resize" || d.kind === "group-rotate") {
            snapshot = cur.map((el) => d.startEls[el.id] ?? el);
          } else {
            snapshot = cur.map((el) => (el.id === d.id ? d.startEl : el));
          }
          historyRef.current.past.push(snapshot);
          if (historyRef.current.past.length > HISTORY_LIMIT) historyRef.current.past.shift();
          historyRef.current.future = [];
          setHistoryTick((t) => t + 1);
          return cur;
        });
      }
      dragRef.current = null;
      setMarquee(null);
      setGuides([]);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [zoom, elements, screenToDesign, snapEnabled, snapTargetsX, snapTargetsY]);

  /* ─────────────────── element factories ─────────────────── */

  const nextZ = useMemo(
    () => (elements.length ? Math.max(...elements.map((e) => e.z)) + 1 : 1),
    [elements],
  );

  const addElement = (el: EditorElement) => {
    commit((prev) => [...prev, el]);
    setSelectedIds([el.id]);
    setActiveTab("props");
  };

  const addText = () =>
    addElement({
      id: uid(),
      type: "text",
      x: EDITOR_CANVAS_W / 2,
      y: EDITOR_CANVAS_H / 2,
      w: 240,
      h: 60,
      rotation: 0,
      z: nextZ,
      text: "Your text",
      font: "handwritten",
      size: 32,
      color: colors.ink ?? colors.text ?? "#3E3E42",
      align: "center",
    });

  const addSticker = (shape: StickerShape) =>
    addElement({
      id: uid(),
      type: "sticker",
      x: EDITOR_CANVAS_W / 2,
      y: EDITOR_CANVAS_H / 2,
      w: 80,
      h: 80,
      rotation: 0,
      z: nextZ,
      shape,
      color: colors.coral ?? "#E36363",
      filled: true,
    });

  const addEmoji = (emoji: string) =>
    addElement({
      id: uid(),
      type: "emoji",
      x: EDITOR_CANVAS_W / 2,
      y: EDITOR_CANVAS_H / 2,
      w: 80,
      h: 80,
      rotation: 0,
      z: nextZ,
      emoji,
    });

  const addTape = (pattern: TapeElement["pattern"]) =>
    addElement({
      id: uid(),
      type: "tape",
      x: EDITOR_CANVAS_W / 2,
      y: EDITOR_CANVAS_H / 2,
      w: 180,
      h: 28,
      rotation: -6,
      z: nextZ,
      color: colors.accent ?? "#E8C9A4",
      pattern,
    });

  const addBadge = () =>
    addElement({
      id: uid(),
      type: "badge",
      x: EDITOR_CANVAS_W / 2,
      y: EDITOR_CANVAS_H / 2,
      w: 140,
      h: 40,
      rotation: -3,
      z: nextZ,
      text: "New!",
      bg: colors.gold ?? "#F2C94C",
      ring: "#fff",
      color: colors.ink ?? "#333",
    });

  const addPhotoFromDataUrl = useCallback((dataUrl: string) => {
    addElement({
      id: uid(),
      type: "photo",
      x: EDITOR_CANVAS_W / 2,
      y: EDITOR_CANVAS_H / 2,
      w: 220,
      h: 220,
      rotation: -2,
      z: nextZ,
      src: dataUrl,
      borderColor: "#fff",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextZ]);

  const onPhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => addPhotoFromDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  /* ─────────────────── selection ops ─────────────────── */

  const removeSelected = () => {
    if (selectedIds.length === 0) return;
    commit((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
    setSelectedIds([]);
  };

  const duplicateSelected = (offset = 24) => {
    if (selectedEls.length === 0) return;
    const copies = selectedEls.map((el, i) => ({
      ...el,
      id: uid(),
      x: clamp(el.x + offset, 0, EDITOR_CANVAS_W),
      y: clamp(el.y + offset, 0, EDITOR_CANVAS_H),
      z: nextZ + i,
    }));
    commit((prev) => [...prev, ...copies]);
    setSelectedIds(copies.map((c) => c.id));
  };

  const updateSelected = (patch: Partial<EditorElement>) => {
    if (selectedIds.length === 0) return;
    commit((prev) =>
      prev.map((e) =>
        selectedIds.includes(e.id) ? ({ ...e, ...patch } as EditorElement) : e,
      ),
    );
  };

  const updateOne = (id: string, patch: Partial<EditorElement>) => {
    commit((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...patch } as EditorElement) : e)));
  };

  const layerUp = () => updateSelected({ z: nextZ });
  const layerDown = () => {
    const minZ = elements.length ? Math.min(...elements.map((e) => e.z)) - 1 : 0;
    updateSelected({ z: minZ });
  };

  const sortedEls = [...elements].sort((a, b) => a.z - b.z);

  /* selection bounding box (axis-aligned, accounts for each element's rotation) */
  const selectionBBox = useMemo(() => {
    if (selectedEls.length === 0) return null;
    return boundsForElements(selectedEls);
  }, [selectedEls]);

  /* ─────────────────── keyboard shortcuts ─────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        removeSelected();
        return;
      }
      if (selectedIds.length > 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        commit((cur) =>
          cur.map((el) =>
            selectedIds.includes(el.id)
              ? { ...el, x: clamp(el.x + dx, 0, EDITOR_CANVAS_W), y: clamp(el.y + dy, 0, EDITOR_CANVAS_H) }
              : el,
          ),
        );
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
      }
      // Hold "\" to peek at the original design (release to return).
      if (e.key === "\\" && !e.repeat) {
        e.preventDefault();
        setCompareMode(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "\\") setCompareMode(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, undo, redo, commit]);

  /* ─────────────────── smart paste (images + text from Canva, browsers, etc.) ─────────────────── */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (!e.clipboardData) return;

      // 1. Direct image file in clipboard (e.g. screenshot, copied image)
      for (const item of Array.from(e.clipboardData.items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const r = new FileReader();
            r.onload = () => addPhotoFromDataUrl(String(r.result));
            r.readAsDataURL(file);
            return;
          }
        }
      }

      // 2. Smart paste: parse HTML clipboard (Canva, Google Docs, web pages)
      const html = e.clipboardData.getData("text/html");
      if (html && html.trim().length > 0) {
        const parsed = parseClipboardHtml(html, {
          z: nextZ,
          defaultColor: colors.ink ?? colors.text ?? "#3E3E42",
          centerX: EDITOR_CANVAS_W / 2,
          centerY: EDITOR_CANVAS_H / 2,
        });
        if (parsed.length > 0) {
          e.preventDefault();
          // Load images asynchronously so we can size them properly
          (async () => {
            const finalEls: EditorElement[] = [];
            for (const el of parsed) {
              if (el.type === "photo") {
                try {
                  const dataUrl = await fetchImageAsDataUrl(el.src);
                  const dims = await loadImageDims(dataUrl);
                  const scale = Math.min(280 / dims.w, 280 / dims.h, 1);
                  finalEls.push({
                    ...el,
                    src: dataUrl,
                    w: Math.max(60, dims.w * scale),
                    h: Math.max(60, dims.h * scale),
                  });
                } catch {
                  // skip broken image
                }
              } else {
                finalEls.push(el);
              }
            }
            if (finalEls.length > 0) {
              commit((prev) => [...prev, ...finalEls]);
              setSelectedIds(finalEls.map((el) => el.id));
              setActiveTab("props");
            }
          })();
          return;
        }
      }

      // 3. Plain text fallback — single text element
      const text = e.clipboardData.getData("text/plain");
      if (text && text.length > 0) {
        e.preventDefault();
        addElement({
          id: uid(),
          type: "text",
          x: EDITOR_CANVAS_W / 2,
          y: EDITOR_CANVAS_H / 2,
          w: Math.min(480, Math.max(120, text.length * 12)),
          h: 60,
          rotation: 0,
          z: nextZ,
          text: text.slice(0, 500),
          font: "handwritten",
          size: 28,
          color: colors.ink ?? colors.text ?? "#3E3E42",
          align: "center",
        });
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextZ, addPhotoFromDataUrl, colors.ink, colors.text]);

  /* wheel zoom */
  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const next = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
    recenterToZoom(next, { x: e.clientX, y: e.clientY });
    setZoom(next);
  };

  /* import native — adds editable copies of the page's title/photo/story/etc.
   * positioned to match the original layout. We do NOT hide the native design;
   * the editable elements simply layer on top, so the page still looks the
   * same. The user can toggle "Hide original page" from the switch above if
   * they want a blank canvas. */
  const importNative = useCallback(() => {
    const seeds = seedElementsFromPage(page, colors).map((el, i) => ({
      ...el,
      z: nextZ + i,
    }));
    commit((prev) => [...prev.filter((el) => el.source !== "native"), ...seeds]);
    setSelectedIds(seeds.map((s) => s.id));
    setNativeEditable(true);
    // Hide the original so we don't render the title / photos / badges twice.
    // The user can re-enable "Show original design behind" if they want it back.
    setHideNative(true);
    setActiveTab("props");
  }, [page, colors, nextZ, commit]);

  /* No auto-seed: the native design (washi tapes, torn-paper edges, doodles,
   * sticky-note shapes, decorative stickers, paper texture and ALL the page
   * art) stays fully visible underneath the editor. The user adds editable
   * elements on top via the Add tab, or clicks "Convert original to editable
   * layers" to seed editable copies of the title / photos / story / badges
   * (which then hides the originals so they don't visually duplicate). */
  const autoSeededRef = useRef(false);
  useEffect(() => {
    autoSeededRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, colors]);

  /* ─────────────────── render ─────────────────── */

  return (
    <div className="flex h-full w-full flex-col gap-3 md:flex-row md:gap-4">
      {/* ─── Left: stage ─── */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-muted/40">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b bg-card px-2 py-1.5">
          <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Toggle size="sm" pressed={tool === "select"} onPressedChange={() => setTool("select")} title="Select (V)">
            <MousePointer2 className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={tool === "pan"} onPressedChange={() => setTool("pan")} title="Pan (H)">
            <Hand className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={snapEnabled} onPressedChange={setSnapEnabled} title="Snap to guides">
            <Magnet className="h-4 w-4" />
          </Toggle>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={zoomOut} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="sm" variant="ghost" onClick={zoomIn} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={zoomFit} title="Fit to screen">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => duplicateSelected(24)}
            disabled={selectedIds.length === 0}
            title="Duplicate (Ctrl/Cmd+D)"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => duplicateSelected(48)}
            disabled={selectedIds.length === 0}
            title="Duplicate with offset"
          >
            <CopyPlus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={removeSelected}
            disabled={selectedIds.length === 0}
            title="Delete (Del)"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Toggle
            size="sm"
            pressed={compareMode}
            onPressedChange={setCompareMode}
            title="Compare with original (hold \\ to peek)"
            aria-label="Compare with original"
          >
            <SplitSquareHorizontal className="h-4 w-4" />
          </Toggle>
          <Button size="sm" variant="ghost" onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)">
            <Keyboard className="h-4 w-4" />
          </Button>
          {selectedIds.length > 1 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        {/* Viewport */}
        <div
          ref={viewportRef}
          className="relative min-h-0 flex-1 overflow-hidden"
          onWheel={onWheel}
          style={{ cursor: tool === "pan" ? "grab" : "default", touchAction: "none" }}
          onPointerDown={onViewportPointerDown}
        >
          {/* One-click "make everything editable" CTA — only shown while no
           *  native fields have been converted yet (so the user discovers it
           *  without it cluttering the canvas later). */}
          {elements.filter((e) => e.source === "native").length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  importNative();
                }}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-lift ring-2 ring-background transition hover:scale-[1.03]"
                title="Convert title, photos, story & badges into editable layers"
              >
                <Sparkles className="h-4 w-4" />
                Make everything editable
              </button>
            </div>
          )}
          <div
            ref={stageRef}
            style={{
              position: "absolute",
              left: pan.x,
              top: pan.y,
              width: EDITOR_CANVAS_W,
              height: EDITOR_CANVAS_H,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              background: colors.paper ?? colors.primary,
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Background — locked, non-interactive. While Compare mode is on
             *  we always show the original underneath so the user can see what
             *  the editable layers look like vs the source design. */}
            {(!hideNative || compareMode) && (
              <div className="pointer-events-none absolute inset-0">{renderBackground()}</div>
            )}

            {/* Compare-mode banner */}
            {compareMode && (
              <div className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-full bg-foreground/85 px-3 py-1 text-[11px] font-semibold text-background shadow-lift">
                Comparing with original
              </div>
            )}

            {/* Editable elements */}
            {sortedEls.map((el) => {
              if (el.hidden) return null;
              const isSelected = selectedIds.includes(el.id);
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => beginElementDrag(e, el)}
                  style={{
                    position: "absolute",
                    left: el.x - el.w / 2,
                    top: el.y - el.h / 2,
                    width: el.w,
                    height: el.h,
                    transform: `rotate(${el.rotation}deg)`,
                    transformOrigin: "center center",
                    cursor: el.locked ? "not-allowed" : "move",
                    outline: compareMode
                      ? "2px dashed hsl(var(--primary) / 0.85)"
                      : isSelected
                        ? "2px solid hsl(var(--primary))"
                        : "none",
                    outlineOffset: 2,
                    touchAction: "none",
                    opacity: compareMode ? 0.35 : el.locked ? 0.95 : 1,
                    transition: "opacity 120ms ease",
                  }}
                >
                  <div className="pointer-events-none h-full w-full" style={{ position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      {renderElement({ ...el, x: el.w / 2, y: el.h / 2, rotation: 0 } as EditorElement)}
                    </div>
                  </div>

                  {isSelected && selectedIds.length === 1 && !el.locked && (
                    <>
                      <div
                        onPointerDown={(e) => beginResize(e, el)}
                        style={{
                          position: "absolute",
                          right: -8,
                          bottom: -8,
                          width: 16,
                          height: 16,
                          background: "hsl(var(--primary))",
                          borderRadius: 4,
                          cursor: "nwse-resize",
                          border: "2px solid white",
                          touchAction: "none",
                        }}
                      />
                      <div
                        onPointerDown={(e) => beginRotate(e, el)}
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: -32,
                          transform: "translateX(-50%)",
                          width: 18,
                          height: 18,
                          background: "hsl(var(--primary))",
                          borderRadius: "50%",
                          cursor: "grab",
                          border: "2px solid white",
                          touchAction: "none",
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}

            {/* Multi-select bbox + group handles */}
            {selectionBBox && selectedIds.length > 1 && (
              <>
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: selectionBBox.x,
                    top: selectionBBox.y,
                    width: selectionBBox.w,
                    height: selectionBBox.h,
                    outline: "2px dashed hsl(var(--primary))",
                    outlineOffset: 4,
                  }}
                />
                {/* group resize (BR) */}
                <div
                  onPointerDown={(e) => beginGroupResize(e, selectionBBox)}
                  style={{
                    position: "absolute",
                    left: selectionBBox.x + selectionBBox.w + 4 - 8,
                    top: selectionBBox.y + selectionBBox.h + 4 - 8,
                    width: 16,
                    height: 16,
                    background: "hsl(var(--primary))",
                    borderRadius: 4,
                    cursor: "nwse-resize",
                    border: "2px solid white",
                    touchAction: "none",
                  }}
                  title="Resize group (uniform)"
                />
                {/* group rotate (top center) */}
                <div
                  onPointerDown={(e) => beginGroupRotate(e, selectionBBox)}
                  style={{
                    position: "absolute",
                    left: selectionBBox.x + selectionBBox.w / 2 - 9,
                    top: selectionBBox.y - 36,
                    width: 18,
                    height: 18,
                    background: "hsl(var(--primary))",
                    borderRadius: "50%",
                    cursor: "grab",
                    border: "2px solid white",
                    touchAction: "none",
                  }}
                  title="Rotate group"
                />
              </>
            )}

            {/* Snap guides */}
            {guides.map((g, i) =>
              g.axis === "v" ? (
                <div
                  key={`g-${i}`}
                  className="pointer-events-none absolute"
                  style={{
                    left: g.pos - 0.5,
                    top: 0,
                    width: 1,
                    height: EDITOR_CANVAS_H,
                    background: "hsl(var(--primary))",
                    opacity: 0.85,
                  }}
                />
              ) : (
                <div
                  key={`g-${i}`}
                  className="pointer-events-none absolute"
                  style={{
                    left: 0,
                    top: g.pos - 0.5,
                    width: EDITOR_CANVAS_W,
                    height: 1,
                    background: "hsl(var(--primary))",
                    opacity: 0.85,
                  }}
                />
              ),
            )}

            {/* Marquee rectangle */}
            {marquee && (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: marquee.x,
                  top: marquee.y,
                  width: marquee.w,
                  height: marquee.h,
                  background: "hsl(var(--primary) / 0.1)",
                  outline: "1px dashed hsl(var(--primary))",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Right: side panel ─── */}
      <div className="flex w-full shrink-0 flex-col gap-3 rounded-xl border bg-card p-3 md:w-96">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add</TabsTrigger>
            <TabsTrigger value="props">Properties</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
          </TabsList>

          {/* ── ADD TAB ── */}
          <TabsContent value="add" className="mt-3 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-4">
                {/* Native page */}
                <section className="rounded-md border bg-muted/30 p-2">
                  <div className="mb-2">
                    <div className="text-xs font-bold uppercase tracking-wide">Original page</div>
                    <p className="text-[11px] text-muted-foreground">
                      The full page design — washi tapes, torn-paper edges, doodles, stickers &amp; texture — is shown behind. Add new layers from below, or convert the title / photos / story into editable layers.
                    </p>
                  </div>
                  <Button size="sm" variant="default" className="w-full" onClick={importNative}>
                    <Sparkles className="h-3.5 w-3.5" /> Make everything editable
                  </Button>
                  <div className="mt-2 flex items-center justify-between rounded-md bg-background/50 px-2 py-1.5">
                    <span className="text-[11px] text-muted-foreground">Show original design behind</span>
                    <Switch checked={!hideNative} onCheckedChange={(v) => setHideNative(!v)} />
                  </div>
                </section>

                {/* Theme presets */}
                <ThemePresetsSection
                  onApply={(theme) => {
                    commit((prev) =>
                      prev.map((el) => {
                        switch (el.type) {
                          case "text":
                            return { ...el, color: theme.text, bg: el.bg ? theme.background : el.bg };
                          case "sticker":
                            return { ...el, color: theme.primary };
                          case "tape":
                            return { ...el, color: theme.secondary };
                          case "badge":
                            return { ...el, bg: theme.primary, ring: theme.secondary, color: theme.text };
                          case "photo":
                            return { ...el, borderColor: theme.background };
                          default:
                            return el;
                        }
                      }),
                    );
                  }}
                  scope={bookId}
                />

                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Text</h4>
                  <Button size="sm" variant="outline" className="w-full" onClick={addText}>
                    + Add text
                  </Button>
                  <Button size="sm" variant="outline" className="mt-2 w-full" onClick={addBadge}>
                    + Add badge
                  </Button>
                </section>

                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Stickers ({ALL_STICKER_SHAPES.length})
                  </h4>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ALL_STICKER_SHAPES.map((s) => (
                      <button
                        key={s}
                        onClick={() => addSticker(s)}
                        className="flex aspect-square items-center justify-center rounded-md border bg-background p-1.5 hover:bg-accent"
                        title={s}
                      >
                        <StickerThumb shape={s} />
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Emoji</h4>
                  <div className="space-y-2">
                    {EMOJI_LIBRARY.map((g) => (
                      <div key={g.group}>
                        <div className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">{g.group}</div>
                        <div className="grid grid-cols-8 gap-1">
                          {g.items.map((em) => (
                            <button
                              key={em}
                              onClick={() => addEmoji(em)}
                              className="flex aspect-square items-center justify-center rounded text-lg hover:bg-accent"
                              title={em}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Washi tape</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {TAPE_PATTERNS.map((p) => (
                      <Button key={p} size="sm" variant="outline" onClick={() => addTape(p)}>
                        {p}
                      </Button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Photo</h4>
                  <label className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed py-3 text-xs hover:bg-accent">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPhotoUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Tip: copy from Canva (or any web page) and paste with Ctrl/Cmd+V — text & images convert into editable elements automatically.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── PROPS TAB ── */}
          <TabsContent value="props" className="mt-3 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              {!singleSelected && selectedIds.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Select an element to edit its properties.
                </div>
              )}
              {!singleSelected && selectedIds.length > 1 && (
                <div className="space-y-3">
                  <p className="font-medium">{selectedIds.length} elements selected</p>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => duplicateSelected(24)}>
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </Button>
                    <Button size="sm" variant="outline" onClick={layerUp}>
                      <MoveUp className="h-3.5 w-3.5" /> Front
                    </Button>
                    <Button size="sm" variant="outline" onClick={layerDown}>
                      <MoveDown className="h-3.5 w-3.5" /> Back
                    </Button>
                    <Button size="sm" variant="destructive" onClick={removeSelected}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drag the corner handle on the selection box to resize the whole group; the top handle to rotate it.
                  </p>
                </div>
              )}
              {singleSelected && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => duplicateSelected(24)} title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={layerUp} title="Bring to front">
                      <MoveUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={layerDown} title="Send to back">
                      <MoveDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOne(singleSelected.id, { locked: !singleSelected.locked })}
                      title={singleSelected.locked ? "Unlock" : "Lock"}
                    >
                      {singleSelected.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={removeSelected}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Rotation: {Math.round(singleSelected.rotation)}°</Label>
                    <Slider
                      value={[singleSelected.rotation]}
                      min={-180}
                      max={180}
                      step={1}
                      onValueChange={(v) => updateOne(singleSelected.id, { rotation: v[0] })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Width</Label>
                      <Input
                        type="number"
                        value={Math.round(singleSelected.w)}
                        onChange={(e) => updateOne(singleSelected.id, { w: Math.max(10, Number(e.target.value) || 10) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Height</Label>
                      <Input
                        type="number"
                        value={Math.round(singleSelected.h)}
                        onChange={(e) => updateOne(singleSelected.id, { h: Math.max(10, Number(e.target.value) || 10) })}
                      />
                    </div>
                  </div>

                  {(singleSelected.type === "text" || singleSelected.type === "photo" || singleSelected.type === "tape" || singleSelected.type === "badge") && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Corner radius: {Math.round(singleSelected.radius ?? (singleSelected.type === "badge" ? 999 : 0))}px</Label>
                      <Slider
                        value={[singleSelected.radius ?? (singleSelected.type === "badge" ? 999 : 0)]}
                        min={0}
                        max={singleSelected.type === "badge" ? 999 : 80}
                        step={1}
                        onValueChange={(v) => updateOne(singleSelected.id, { radius: v[0] })}
                      />
                    </div>
                  )}

                  {singleSelected.type === "text" && (
                    <TextProps el={singleSelected} update={(p) => updateOne(singleSelected.id, p)} scope={bookId} />
                  )}
                  {singleSelected.type === "sticker" && (
                    <StickerProps el={singleSelected} update={(p) => updateOne(singleSelected.id, p)} scope={bookId} />
                  )}
                  {singleSelected.type === "tape" && (
                    <TapeProps el={singleSelected} update={(p) => updateOne(singleSelected.id, p)} scope={bookId} />
                  )}
                  {singleSelected.type === "badge" && (
                    <BadgeProps el={singleSelected} update={(p) => updateOne(singleSelected.id, p)} scope={bookId} />
                  )}
                  {singleSelected.type === "photo" && (
                    <PhotoProps
                      el={singleSelected}
                      update={(p) => updateOne(singleSelected.id, p)}
                      onCrop={() => setCropPhotoId(singleSelected.id)}
                      scope={bookId}
                    />
                  )}
                  {singleSelected.type === "emoji" && (
                    <EmojiProps el={singleSelected} update={(p) => updateOne(singleSelected.id, p)} />
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ── LAYERS TAB ── */}
          <TabsContent value="layers" className="mt-3 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-1">
                {sortedEls.length === 0 && (
                  <p className="text-sm text-muted-foreground">No elements yet.</p>
                )}
                {[...sortedEls].reverse().map((el) => {
                  const isSel = selectedIds.includes(el.id);
                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedIds([el.id])}
                      className={`flex items-center gap-1 rounded border px-2 py-1.5 text-xs ${
                        isSel ? "border-primary bg-primary/5" : "bg-background hover:bg-accent"
                      } cursor-pointer`}
                    >
                      <span className="flex-1 truncate">{layerLabel(el)}</span>
                      <button
                        title="Move up"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOne(el.id, { z: nextZ });
                        }}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Move down"
                        onClick={(e) => {
                          e.stopPropagation();
                          const minZ = Math.min(...elements.map((x) => x.z)) - 1;
                          updateOne(el.id, { z: minZ });
                        }}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title={el.hidden ? "Show" : "Hide"}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOne(el.id, { hidden: !el.hidden });
                        }}
                        className="rounded p-1 hover:bg-muted"
                      >
                        {el.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        title={el.locked ? "Unlock" : "Lock"}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOne(el.id, { locked: !el.locked });
                        }}
                        className="rounded p-1 hover:bg-muted"
                      >
                        {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          commit((prev) => prev.filter((x) => x.id !== el.id));
                          setSelectedIds((s) => s.filter((id) => id !== el.id));
                        }}
                        className="rounded p-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 border-t pt-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => onSave(elements, hideNative, nativeEditable)} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Shortcuts dialog */}
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Photo crop dialog */}
      <PhotoCropDialog
        open={!!cropPhotoId}
        photo={(elements.find((e) => e.id === cropPhotoId) as PhotoElement | undefined) ?? null}
        onClose={() => setCropPhotoId(null)}
        onApply={(crop, newAspect) => {
          if (!cropPhotoId) return;
          // Adjust the element's display height to match the new crop's aspect so the
          // visible image isn't squashed/stretched.
          commit((prev) =>
            prev.map((e) => {
              if (e.id !== cropPhotoId || e.type !== "photo") return e;
              const newH = Math.max(20, e.w / newAspect);
              return { ...e, ...crop, h: newH } as PhotoElement;
            }),
          );
        }}
      />

      <span className="hidden">{historyTick}</span>
    </div>
  );
}

/* ─────────────────── small helpers ─────────────────── */

function StickerThumb({ shape }: { shape: StickerShape }) {
  return (
    <div className="pointer-events-none relative h-full w-full">
      {renderElement({
        id: "thumb",
        type: "sticker",
        x: 12,
        y: 12,
        w: 24,
        h: 24,
        rotation: 0,
        z: 0,
        shape,
        color: "currentColor",
        filled: false,
      })}
    </div>
  );
}

function layerLabel(el: EditorElement): string {
  switch (el.type) {
    case "text":
      return `T · ${(el.text || "").slice(0, 22) || "Text"}`;
    case "sticker":
      return `★ · ${el.shape}`;
    case "tape":
      return `〰 · tape (${el.pattern})`;
    case "photo":
      return "🖼 · photo";
    case "badge":
      return `● · ${(el.text || "").slice(0, 18)}`;
    case "emoji":
      return `${el.emoji} · emoji`;
  }
}

/* ────────── Property panels ────────── */

function ColorRow({
  label,
  value,
  onChange,
  scope,
  contrastAgainst,
  allowGradient,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  scope?: string;
  contrastAgainst?: string;
  allowGradient?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <ColorPicker
          value={value}
          onChange={onChange}
          scope={scope}
          contrastAgainst={contrastAgainst}
          allowGradient={allowGradient}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-32 truncate text-xs"
        />
      </div>
    </label>
  );
}

function TextProps({ el, update, scope }: { el: TextElement; update: (p: Partial<TextElement>) => void; scope?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Text</Label>
      <textarea
        value={el.text}
        onChange={(e) => update({ text: e.target.value })}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        rows={3}
      />
      <div>
        <Label className="text-xs text-muted-foreground">Size: {el.size}px</Label>
        <Slider value={[el.size]} min={10} max={120} step={1} onValueChange={(v) => update({ size: v[0] })} />
      </div>
      <Label className="text-xs text-muted-foreground">Font</Label>
      <select
        value={el.font}
        onChange={(e) => update({ font: e.target.value as TextElement["font"] })}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      >
        <option value="handwritten">Handwritten</option>
        <option value="marker">Marker</option>
        <option value="printed">Typewriter</option>
        <option value="serif">Serif</option>
      </select>
      <ColorRow label="Color" value={el.color} onChange={(v) => update({ color: v })} scope={scope} contrastAgainst={el.bg} />
      <ColorRow label="Background" value={el.bg ?? "#ffffff"} onChange={(v) => update({ bg: v })} scope={scope} contrastAgainst={el.color} allowGradient />
      <div className="flex items-center gap-2">
        <Button size="sm" variant={el.bold ? "default" : "outline"} onClick={() => update({ bold: !el.bold })}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant={el.italic ? "default" : "outline"} onClick={() => update({ italic: !el.italic })}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant={el.align === "left" ? "default" : "outline"} onClick={() => update({ align: "left" })}>
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant={el.align === "center" || !el.align ? "default" : "outline"} onClick={() => update({ align: "center" })}>
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant={el.align === "right" ? "default" : "outline"} onClick={() => update({ align: "right" })}>
          <AlignRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-xs"
        onClick={() => update({ bg: undefined })}
      >
        Remove background
      </Button>
    </div>
  );
}

function StickerProps({ el, update, scope }: { el: StickerElement; update: (p: Partial<StickerElement>) => void; scope?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Shape</Label>
      <select
        value={el.shape}
        onChange={(e) => update({ shape: e.target.value as StickerShape })}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      >
        {ALL_STICKER_SHAPES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <ColorRow label="Color" value={el.color} onChange={(v) => update({ color: v })} scope={scope} />
      <Button size="sm" variant={el.filled ? "default" : "outline"} onClick={() => update({ filled: !el.filled })}>
        {el.filled ? "Filled" : "Outline"}
      </Button>
    </div>
  );
}

function TapeProps({ el, update, scope }: { el: TapeElement; update: (p: Partial<TapeElement>) => void; scope?: string }) {
  return (
    <div className="space-y-2">
      <ColorRow label="Color" value={el.color} onChange={(v) => update({ color: v })} scope={scope} />
      <Label className="text-xs text-muted-foreground">Pattern</Label>
      <select
        value={el.pattern}
        onChange={(e) => update({ pattern: e.target.value as TapeElement["pattern"] })}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      >
        {TAPE_PATTERNS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}

function BadgeProps({ el, update, scope }: { el: BadgeElement; update: (p: Partial<BadgeElement>) => void; scope?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Text</Label>
      <Input value={el.text} onChange={(e) => update({ text: e.target.value })} />
      <ColorRow label="Background" value={el.bg} onChange={(v) => update({ bg: v })} scope={scope} contrastAgainst={el.color} allowGradient />
      <ColorRow label="Text" value={el.color} onChange={(v) => update({ color: v })} scope={scope} contrastAgainst={el.bg} />
      <ColorRow label="Ring" value={el.ring} onChange={(v) => update({ ring: v })} scope={scope} />
    </div>
  );
}

function PhotoProps({ el, update, onCrop, scope }: { el: PhotoElement; update: (p: Partial<PhotoElement>) => void; onCrop: () => void; scope?: string }) {
  const isCropped = (el.cropX ?? 0) !== 0 || (el.cropY ?? 0) !== 0 || (el.cropW ?? 1) !== 1 || (el.cropH ?? 1) !== 1;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" onClick={onCrop} className="flex-1">
          <CropIcon className="h-3.5 w-3.5" /> Crop image
        </Button>
        {isCropped && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update({ cropX: 0, cropY: 0, cropW: 1, cropH: 1 })}
            title="Reset crop"
          >
            Reset
          </Button>
        )}
      </div>
      {isCropped && (
        <p className="text-[11px] text-muted-foreground">
          Cropped to {Math.round((el.cropW ?? 1) * 100)}% × {Math.round((el.cropH ?? 1) * 100)}%
        </p>
      )}
      <ColorRow label="Border" value={el.borderColor ?? "#ffffff"} onChange={(v) => update({ borderColor: v })} scope={scope} />
      <Label className="text-xs text-muted-foreground">Replace image</Label>
      <input
        type="file"
        accept="image/*"
        className="text-xs"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => update({ src: String(r.result), cropX: 0, cropY: 0, cropW: 1, cropH: 1 });
          r.readAsDataURL(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function EmojiProps({ el, update }: { el: EmojiElement; update: (p: Partial<EmojiElement>) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Emoji</Label>
      <Input value={el.emoji} onChange={(e) => update({ emoji: e.target.value })} maxLength={4} />
    </div>
  );
}

/* ────────── Theme presets ────────── */

type ThemeColors = { primary: string; secondary: string; background: string; text: string };

const BUILTIN_THEMES: { name: string; theme: ThemeColors }[] = [
  { name: "Sunny picnic", theme: { primary: "#E8A087", secondary: "#D4B896", background: "#FFFACD", text: "#3E2C23" } },
  { name: "Forest fresh", theme: { primary: "#7BA892", secondary: "#A8C5BA", background: "#F3F4F6", text: "#1F2937" } },
  { name: "Ocean calm", theme: { primary: "#7FA8B5", secondary: "#CDE7F0", background: "#FFFFFF", text: "#1F2937" } },
  { name: "Berry sweet", theme: { primary: "#EC4899", secondary: "#E4C1F9", background: "#FDE2E4", text: "#3E2C23" } },
  { name: "Dusk", theme: { primary: "#8B5CF6", secondary: "#3B82F6", background: "#1F2937", text: "#F3F4F6" } },
  { name: "Cocoa", theme: { primary: "#8B5E3C", secondary: "#C9A06C", background: "#FFE5B4", text: "#3E2C23" } },
];

function ThemePresetsSection({
  onApply,
  scope,
}: {
  onApply: (t: ThemeColors) => void;
  scope?: string;
}) {
  const [custom, setCustom] = useState<ThemeColors>(BUILTIN_THEMES[0].theme);
  return (
    <section className="rounded-md border bg-muted/30 p-2">
      <div className="mb-2">
        <div className="text-xs font-bold uppercase tracking-wide">Theme presets</div>
        <p className="text-[11px] text-muted-foreground">
          One-click recolor: maps your colors to text, backgrounds, stickers &amp; badges.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {BUILTIN_THEMES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => onApply(t.theme)}
            className="group flex flex-col gap-1 rounded-md border bg-background p-1.5 text-left transition hover:border-primary"
            title={`Apply ${t.name}`}
          >
            <div className="flex h-6 overflow-hidden rounded">
              <span className="flex-1" style={{ background: t.theme.primary }} />
              <span className="flex-1" style={{ background: t.theme.secondary }} />
              <span className="flex-1" style={{ background: t.theme.background }} />
              <span className="flex-1" style={{ background: t.theme.text }} />
            </div>
            <span className="text-[10px] font-medium">{t.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-1.5 rounded-md border border-dashed bg-background/40 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Custom theme</div>
        <ThemeRoleRow label="Primary" value={custom.primary} onChange={(v) => setCustom({ ...custom, primary: v })} scope={scope} />
        <ThemeRoleRow label="Secondary" value={custom.secondary} onChange={(v) => setCustom({ ...custom, secondary: v })} scope={scope} />
        <ThemeRoleRow label="Background" value={custom.background} onChange={(v) => setCustom({ ...custom, background: v })} scope={scope} contrastAgainst={custom.text} />
        <ThemeRoleRow label="Text" value={custom.text} onChange={(v) => setCustom({ ...custom, text: v })} scope={scope} contrastAgainst={custom.background} />
        <Button size="sm" className="mt-1 w-full" onClick={() => onApply(custom)}>
          Apply custom theme
        </Button>
      </div>
    </section>
  );
}

function ThemeRoleRow({
  label,
  value,
  onChange,
  scope,
  contrastAgainst,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  scope?: string;
  contrastAgainst?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <ColorPicker value={value} onChange={onChange} scope={scope} contrastAgainst={contrastAgainst} allowGradient={false} />
    </div>
  );
}

/* ────────── Shortcuts overlay ────────── */

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const rows: { keys: string; label: string }[] = [
    { keys: "Ctrl/Cmd + Z", label: "Undo" },
    { keys: "Ctrl/Cmd + Shift + Z  /  Ctrl + Y", label: "Redo" },
    { keys: "Ctrl/Cmd + D", label: "Duplicate selection" },
    { keys: "Delete / Backspace", label: "Delete selection" },
    { keys: "Arrow keys", label: "Nudge 1px (Shift = 10px)" },
    { keys: "Shift + click", label: "Add to selection" },
    { keys: "Click + drag empty", label: "Marquee select" },
    { keys: "Hold Shift while rotating", label: "Snap to 15°" },
    { keys: "Ctrl/Cmd + Wheel", label: "Zoom in / out" },
    { keys: "Middle-click drag / Pan tool", label: "Pan canvas" },
    { keys: "Ctrl/Cmd + V", label: "Paste image or text from clipboard" },
    { keys: "Esc", label: "Clear selection" },
    { keys: "?", label: "Toggle this dialog" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="divide-y text-sm">
          {rows.map((r) => (
            <div key={r.keys} className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{r.label}</span>
              <kbd className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono">{r.keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
