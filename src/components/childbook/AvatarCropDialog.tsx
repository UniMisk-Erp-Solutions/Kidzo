import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/**
 * WhatsApp / Instagram-style profile photo cropper.
 *
 *  • Square output frame (the avatar).
 *  • The user can pinch/scroll to zoom and drag the photo around inside the
 *    frame — exactly like setting a WhatsApp display picture.
 *  • A circular guide is rendered so the user sees the final shape.
 *  • Output is a high-quality JPEG Blob, scaled to OUTPUT_SIZE × OUTPUT_SIZE.
 */

interface Props {
  open: boolean;
  /** Local object URL or remote URL of the source image. */
  src: string | null;
  onClose: () => void;
  /** Called with a freshly-cropped JPEG blob. */
  onApply: (blob: Blob | null) => Promise<void> | void;
  saving?: boolean;
}

const FRAME = 320; // on-screen square frame size in CSS px
const OUTPUT_SIZE = 720; // output JPEG resolution

export function AvatarCropDialog({ open, src, onClose, onApply, saving }: Props) {
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1); // multiplier of the "cover" base size
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // in CSS px
  const dragRef = useRef<{ start: { x: number; y: number }; offset: { x: number; y: number } } | null>(null);

  /* Reset state on open / new image. */
  useEffect(() => {
    if (!open) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setImgDims(null);
  }, [open, src]);

  /* Load natural dimensions. */
  useEffect(() => {
    if (!open || !src) return;
    const im = new Image();
    im.onload = () => setImgDims({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = src;
  }, [src, open]);

  /* Base size = cover the frame at scale=1 (smallest dim fills FRAME). */
  const baseSize = (() => {
    if (!imgDims) return { w: FRAME, h: FRAME };
    const ratio = imgDims.w / imgDims.h;
    if (ratio >= 1) {
      // landscape: fit by height
      return { w: FRAME * ratio, h: FRAME };
    }
    return { w: FRAME, h: FRAME / ratio };
  })();

  const renderW = baseSize.w * scale;
  const renderH = baseSize.h * scale;

  /* Clamp the photo so it always fully covers the square frame. */
  const clampOffset = (o: { x: number; y: number }) => {
    const minX = FRAME - renderW;
    const minY = FRAME - renderH;
    return {
      x: Math.min(0, Math.max(minX, o.x)),
      y: Math.min(0, Math.max(minY, o.y)),
    };
  };

  /* Re-clamp when scale changes around the frame center. */
  useEffect(() => {
    setOffset((o) => {
      return clampOffset(o);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, baseSize.w, baseSize.h]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      start: { x: e.clientX, y: e.clientY },
      offset: { ...offset },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.start.x;
    const dy = e.clientY - d.start.y;
    setOffset(clampOffset({ x: d.offset.x + dx, y: d.offset.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(4, Math.max(1, s + delta)));
  };

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    if (!src || !imgDims) return;

    const scaleSrc = imgDims.w / renderW; // px-on-source per CSS px
    const sx = (-offset.x) * scaleSrc;
    const sy = (-offset.y) * scaleSrc;
    const sSize = FRAME * scaleSrc;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const im = await new Promise<HTMLImageElement>((resolve, reject) => {
      const x = new Image();
      x.crossOrigin = "anonymous";
      x.onload = () => resolve(x);
      x.onerror = reject;
      x.src = src;
    });
    ctx.drawImage(im, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
    );
    await onApply(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>
            Drag to reposition. Pinch, scroll, or use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="mx-auto" style={{ width: FRAME, height: FRAME }}>
            <div
              className="relative select-none touch-none overflow-hidden rounded-md bg-muted"
              style={{ width: FRAME, height: FRAME }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              {src && (
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  crossOrigin="anonymous"
                  style={{
                    position: "absolute",
                    left: offset.x,
                    top: offset.y,
                    width: renderW,
                    height: renderH,
                    maxWidth: "none",
                    cursor: "grab",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              )}
              <svg
                className="pointer-events-none absolute inset-0"
                width={FRAME}
                height={FRAME}
                viewBox={`0 0 ${FRAME} ${FRAME}`}
              >
                <defs>
                  <mask id="avatar-hole">
                    <rect width={FRAME} height={FRAME} fill="white" />
                    <circle cx={FRAME / 2} cy={FRAME / 2} r={FRAME / 2 - 2} fill="black" />
                  </mask>
                </defs>
                <rect
                  width={FRAME}
                  height={FRAME}
                  fill="rgba(0,0,0,0.55)"
                  mask="url(#avatar-hole)"
                />
                <circle
                  cx={FRAME / 2}
                  cy={FRAME / 2}
                  r={FRAME / 2 - 2}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full"
              onClick={() => setScale((s) => Math.max(1, s - 0.2))}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[scale]}
              min={1}
              max={4}
              step={0.01}
              onValueChange={(v) => setScale(v[0])}
              className="flex-1"
              aria-label="Zoom"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full"
              onClick={() => setScale((s) => Math.min(4, s + 0.2))}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={reset}
              aria-label="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="destructive" onClick={() => onApply(null)} disabled={saving}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={handleApply} disabled={saving || !imgDims}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Set photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
