import { useEffect, useRef, useState } from "react";
import { Crop as CropIcon, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PhotoElement } from "./types";

/**
 * Canva-style image cropping.
 *
 * Behavior parity with Canva:
 *  • Drag a CORNER  → resize crop frame from that corner, anchoring the
 *    opposite corner. If an aspect ratio is locked, the frame stays in that
 *    ratio while resizing.
 *  • Drag an EDGE   → resize from that edge. With a locked aspect, the
 *    perpendicular edges expand symmetrically to keep the ratio.
 *  • Drag INSIDE    → translate the crop frame, clamped to the image bounds.
 *  • Aspect presets → snap the current crop to the preset ratio, centered on
 *    the current crop's center.
 *
 * The crop region is stored as normalized (0..1) coordinates relative to the
 * source image, so it survives image-element resizing.
 */
const ASPECTS: { label: string; value: number | null }[] = [
  { label: "Free", value: null },
  { label: "Original", value: -1 }, // sentinel: image's natural ratio
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "21:9", value: 21 / 9 },
];

interface Props {
  open: boolean;
  photo: PhotoElement | null;
  onClose: () => void;
  onApply: (
    crop: { cropX: number; cropY: number; cropW: number; cropH: number },
    newAspect: number,
  ) => void;
}

type Rect = { x: number; y: number; w: number; h: number };

type DragKind =
  | "move"
  | "n" | "s" | "e" | "w"
  | "ne" | "nw" | "se" | "sw"
  | null;

const MIN = 0.05; // 5 % minimum crop size

export function PhotoCropDialog({ open, photo, onClose, onApply }: Props) {
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 1, h: 1 });
  const [aspectIdx, setAspectIdx] = useState(0); // Free
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind: DragKind;
    startMouse: { x: number; y: number };
    startRect: Rect;
    /** Cached display-image size at drag start. */
    box: { w: number; h: number };
  } | null>(null);

  /* Reset crop & ratio whenever a new photo is opened. */
  useEffect(() => {
    if (!photo) return;
    setCrop({
      x: photo.cropX ?? 0,
      y: photo.cropY ?? 0,
      w: photo.cropW ?? 1,
      h: photo.cropH ?? 1,
    });
    setAspectIdx(0);
    setImgDims(null);
  }, [photo?.id, open]);

  /* Load natural image dimensions. */
  useEffect(() => {
    if (!photo || !open) return;
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => setImgDims({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = photo.src;
  }, [photo?.src, open]);

  const aspectRaw = ASPECTS[aspectIdx]?.value ?? null;
  const effectiveAspect: number | null =
    aspectRaw === -1 ? (imgDims ? imgDims.w / imgDims.h : null) : aspectRaw;

  /* Snap to ratio whenever aspect / image changes. */
  useEffect(() => {
    if (effectiveAspect == null || !imgDims) return;
    setCrop((c) => fitToAspect(c, effectiveAspect, imgDims));
  }, [aspectIdx, imgDims?.w, imgDims?.h, effectiveAspect]);

  /* Compute the displayed image rect inside the container (object-contain). */
  const displaySize = (): { w: number; h: number; offX: number; offY: number } => {
    const el = containerRef.current;
    if (!el || !imgDims) return { w: 1, h: 1, offX: 0, offY: 0 };
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const ratio = imgDims.w / imgDims.h;
    let dw = cw;
    let dh = cw / ratio;
    if (dh > ch) {
      dh = ch;
      dw = ch * ratio;
    }
    return { w: dw, h: dh, offX: (cw - dw) / 2, offY: (ch - dh) / 2 };
  };

  const beginDrag = (kind: DragKind, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const sz = displaySize();
    dragRef.current = {
      kind,
      startMouse: { x: e.clientX, y: e.clientY },
      startRect: { ...crop },
      box: { w: sz.w, h: sz.h },
    };
  };

  /* Pointer move & up — single global handler for all drag kinds. */
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d || !d.kind) return;
      const dx = (e.clientX - d.startMouse.x) / d.box.w;
      const dy = (e.clientY - d.startMouse.y) / d.box.h;

      const next = computeNextRect(d.kind, d.startRect, dx, dy, effectiveAspect);
      setCrop(next);
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [effectiveAspect]);

  if (!photo) return null;

  const reset = () => setCrop({ x: 0, y: 0, w: 1, h: 1 });

  const apply = () => {
    if (!imgDims) return;
    const cropAspect = (crop.w * imgDims.w) / (crop.h * imgDims.h);
    onApply(
      { cropX: crop.x, cropY: crop.y, cropW: crop.w, cropH: crop.h },
      cropAspect,
    );
    onClose();
  };

  const sz = displaySize();

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-4 w-4" /> Crop image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Aspect presets */}
          <div className="flex flex-wrap gap-1.5">
            {ASPECTS.map((a, i) => (
              <Button
                key={a.label}
                size="sm"
                variant={aspectIdx === i ? "default" : "outline"}
                onClick={() => setAspectIdx(i)}
              >
                {a.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={reset} className="ml-auto">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>

          {/* Image preview + crop overlay */}
          <div
            ref={containerRef}
            className="relative mx-auto flex h-[55vh] items-center justify-center overflow-hidden rounded-md border bg-[repeating-conic-gradient(#e5e7eb_0_25%,_white_0_50%)] bg-[length:16px_16px]"
          >
            <img
              src={photo.src}
              crossOrigin="anonymous"
              alt=""
              className="max-h-full max-w-full select-none"
              draggable={false}
            />
            {imgDims && <CropOverlay rect={crop} box={sz} onBeginDrag={beginDrag} />}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {imgDims
                ? `${Math.round(crop.w * imgDims.w)} × ${Math.round(crop.h * imgDims.h)} px${
                    effectiveAspect ? ` · ${ratioLabel(effectiveAspect)}` : ""
                  }`
                : "Loading…"}
            </span>
            <span>Drag inside to move • Drag handles to resize</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── overlay rendering ─────────────────────────── */

function CropOverlay({
  rect,
  box,
  onBeginDrag,
}: {
  rect: Rect;
  box: { w: number; h: number; offX: number; offY: number };
  onBeginDrag: (kind: DragKind, e: React.PointerEvent) => void;
}) {
  const x = box.offX + rect.x * box.w;
  const y = box.offY + rect.y * box.h;
  const w = rect.w * box.w;
  const h = rect.h * box.h;
  return (
    <>
      {/* Dimmed mask outside the crop using 4 rectangles */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: y, background: "rgba(0,0,0,0.55)" }} />
        <div style={{ position: "absolute", left: 0, top: y + h, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)" }} />
        <div style={{ position: "absolute", left: 0, top: y, width: x, height: h, background: "rgba(0,0,0,0.55)" }} />
        <div style={{ position: "absolute", left: x + w, top: y, right: 0, height: h, background: "rgba(0,0,0,0.55)" }} />
      </div>
      {/* Crop rectangle */}
      <div
        onPointerDown={(e) => onBeginDrag("move", e)}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          cursor: "move",
          outline: "2px solid white",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
          touchAction: "none",
        }}
      >
        {/* Rule-of-thirds grid */}
        <div className="pointer-events-none absolute inset-0">
          {[1, 2].map((i) => (
            <div
              key={`v${i}`}
              style={{
                position: "absolute",
                left: `${(i * 100) / 3}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: "rgba(255,255,255,0.5)",
              }}
            />
          ))}
          {[1, 2].map((i) => (
            <div
              key={`h${i}`}
              style={{
                position: "absolute",
                top: `${(i * 100) / 3}%`,
                left: 0,
                right: 0,
                height: 1,
                background: "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
        {/* Edge & corner handles */}
        <Handle pos="n" onPointerDown={(e) => onBeginDrag("n", e)} />
        <Handle pos="s" onPointerDown={(e) => onBeginDrag("s", e)} />
        <Handle pos="e" onPointerDown={(e) => onBeginDrag("e", e)} />
        <Handle pos="w" onPointerDown={(e) => onBeginDrag("w", e)} />
        <Handle pos="ne" onPointerDown={(e) => onBeginDrag("ne", e)} />
        <Handle pos="nw" onPointerDown={(e) => onBeginDrag("nw", e)} />
        <Handle pos="se" onPointerDown={(e) => onBeginDrag("se", e)} />
        <Handle pos="sw" onPointerDown={(e) => onBeginDrag("sw", e)} />
      </div>
    </>
  );
}

function Handle({
  pos,
  onPointerDown,
}: {
  pos: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const isCorner = pos.length === 2;
  const map: Record<string, React.CSSProperties> = {
    n: { left: "50%", top: -5, transform: "translateX(-50%)", cursor: "ns-resize" },
    s: { left: "50%", bottom: -5, transform: "translateX(-50%)", cursor: "ns-resize" },
    e: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "ew-resize" },
    w: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "ew-resize" },
    ne: { top: -5, right: -5, cursor: "nesw-resize" },
    nw: { top: -5, left: -5, cursor: "nwse-resize" },
    se: { bottom: -5, right: -5, cursor: "nwse-resize" },
    sw: { bottom: -5, left: -5, cursor: "nesw-resize" },
  };
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        width: isCorner ? 14 : 12,
        height: isCorner ? 14 : 12,
        background: "white",
        border: "2px solid hsl(var(--primary))",
        borderRadius: 3,
        touchAction: "none",
        ...map[pos],
      }}
    />
  );
}

/* ───────────────────────────────── helpers ─────────────────────────────── */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Compute the new normalized crop rect for a given drag delta. */
function computeNextRect(
  kind: DragKind,
  start: Rect,
  dx: number,
  dy: number,
  aspect: number | null,
): Rect {
  if (!kind) return start;

  // ── Translate the whole frame ──────────────────────────────────────────
  if (kind === "move") {
    return {
      x: clamp(start.x + dx, 0, 1 - start.w),
      y: clamp(start.y + dy, 0, 1 - start.h),
      w: start.w,
      h: start.h,
    };
  }

  // ── Resize from edge / corner — anchor the OPPOSITE side(s) ────────────
  // Compute the four edges of the start rect, then move only the dragged edges.
  let left = start.x;
  let right = start.x + start.w;
  let top = start.y;
  let bottom = start.y + start.h;

  if (kind.includes("e")) right = clamp(right + dx, left + MIN, 1);
  if (kind.includes("w")) left = clamp(left + dx, 0, right - MIN);
  if (kind.includes("s")) bottom = clamp(bottom + dy, top + MIN, 1);
  if (kind.includes("n")) top = clamp(top + dy, 0, bottom - MIN);

  let w = right - left;
  let h = bottom - top;

  // ── Aspect lock: re-derive the appropriate edge so the ratio is exact ──
  if (aspect != null) {
    // For corner drags, the dragged corner moves freely; re-derive the
    // perpendicular dimension so the locked corner stays anchored.
    const isCorner = kind.length === 2;
    const isEdgeHorizontal = kind === "e" || kind === "w";
    const isEdgeVertical = kind === "n" || kind === "s";

    if (isCorner) {
      // Use whichever dimension changed more (in ratio terms) as authoritative.
      const wantH = w / aspect;
      const wantW = h * aspect;
      const dW = Math.abs(w - start.w);
      const dH = Math.abs(h - start.h);
      if (dW > dH) {
        // Width is authoritative → derive height
        if (kind.includes("n")) top = bottom - wantH;
        else bottom = top + wantH;
      } else {
        // Height is authoritative → derive width
        if (kind.includes("w")) left = right - wantW;
        else right = left + wantW;
      }
    } else if (isEdgeHorizontal) {
      // Width changed → derive height symmetrically about the start center.
      const cy = (start.y + start.y + start.h) / 2;
      const newH = w / aspect;
      top = cy - newH / 2;
      bottom = cy + newH / 2;
    } else if (isEdgeVertical) {
      const cx = (start.x + start.x + start.w) / 2;
      const newW = h * aspect;
      left = cx - newW / 2;
      right = cx + newW / 2;
    }

    // Clamp inside [0..1]; if we overflow, scale the rect back toward the
    // anchor corner so it fits without changing the aspect.
    if (left < 0 || top < 0 || right > 1 || bottom > 1) {
      const scaleX = left < 0 ? (right) / (right - left) : right > 1 ? (1 - left) / (right - left) : 1;
      const scaleY = top < 0 ? (bottom) / (bottom - top) : bottom > 1 ? (1 - top) / (bottom - top) : 1;
      const s = Math.min(scaleX, scaleY);
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      const halfW = ((right - left) * s) / 2;
      const halfH = ((bottom - top) * s) / 2;
      left = cx - halfW;
      right = cx + halfW;
      top = cy - halfH;
      bottom = cy + halfH;
      // Final hard-clamp (covers floating-point edge cases)
      const sw = right - left;
      const sh = bottom - top;
      left = clamp(left, 0, 1 - sw);
      top = clamp(top, 0, 1 - sh);
      right = left + sw;
      bottom = top + sh;
    }

    w = right - left;
    h = bottom - top;
  }

  return {
    x: clamp(left, 0, 1 - MIN),
    y: clamp(top, 0, 1 - MIN),
    w: clamp(w, MIN, 1),
    h: clamp(h, MIN, 1),
  };
}

/** Snap a crop rect to a target aspect ratio, centered on its current center. */
function fitToAspect(c: Rect, ratio: number, imgDims: { w: number; h: number }): Rect {
  // Convert to image-pixel space, snap centered, return normalized.
  const cxPx = (c.x + c.w / 2) * imgDims.w;
  const cyPx = (c.y + c.h / 2) * imgDims.h;
  let wPx = c.w * imgDims.w;
  let hPx = c.h * imgDims.h;
  if (wPx / hPx > ratio) wPx = hPx * ratio;
  else hPx = wPx / ratio;
  if (wPx > imgDims.w) {
    wPx = imgDims.w;
    hPx = wPx / ratio;
  }
  if (hPx > imgDims.h) {
    hPx = imgDims.h;
    wPx = hPx * ratio;
  }
  let x = (cxPx - wPx / 2) / imgDims.w;
  let y = (cyPx - hPx / 2) / imgDims.h;
  const w = wPx / imgDims.w;
  const h = hPx / imgDims.h;
  x = Math.max(0, Math.min(1 - w, x));
  y = Math.max(0, Math.min(1 - h, y));
  return { x, y, w, h };
}

function ratioLabel(r: number): string {
  // Pretty-print common ratios
  const presets: [number, string][] = [
    [1, "1:1"],
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
    [16 / 9, "16:9"],
    [9 / 16, "9:16"],
    [21 / 9, "21:9"],
  ];
  for (const [v, lbl] of presets) {
    if (Math.abs(r - v) < 0.01) return lbl;
  }
  return r.toFixed(2);
}
