import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Memory } from "@/lib/types/memory";
import { buildSlides, type Slide } from "@/lib/storySlides";

/** How long each slide stays on screen before moving on by itself. */
const SLIDE_MS = 5000;
/** A press shorter than this (and barely moved) is a tap; anything longer is a hold-to-pause. */
const TAP_MS = 250;
const TAP_SLOP_PX = 12;
const SWIPE_DOWN_PX = 110;
/** A tap on the left third goes back; anywhere else skips ahead. */
const BACK_ZONE = 0.35;

type Press = { t: number; x: number; y: number };

/** Fills the progress bar over SLIDE_MS while the slide is ready and not paused, then calls `next`. */
function useSlideTimer(active: boolean, resetKey: unknown, next: () => void) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [resetKey]);

  useEffect(() => {
    if (!active) return;
    const startedAt = performance.now() - progressRef.current * SLIDE_MS;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / SLIDE_MS);
      progressRef.current = p;
      setProgress(p);
      if (p >= 1) next();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, next]);

  return progress;
}

/** Keyboard control, a still page behind the player, and pausing when the tab is hidden. */
function usePlayerEnvironment(opts: {
  onClose: () => void;
  onStep: (delta: number) => void;
  onTogglePause: () => void;
  onHidden: () => void;
}) {
  const { onClose, onStep, onTogglePause, onHidden } = opts;
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keys: Record<string, () => void> = {
      Escape: onClose,
      ArrowRight: () => onStep(1),
      ArrowLeft: () => onStep(-1),
      " ": onTogglePause,
    };
    const onKey = (e: KeyboardEvent) => {
      const action = keys[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    const onVisibility = () => document.hidden && onHidden();
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onClose, onStep, onTogglePause, onHidden]);
}

const isControl = (e: ReactPointerEvent) => !!(e.target as HTMLElement).closest("[data-no-tap]");

/** Press and hold pauses; a quick tap steps back (left) or forward; a long swipe down closes. */
function usePressGestures(opts: { onHold: (held: boolean) => void; onStep: (delta: number) => void; onClose: () => void }) {
  const { onHold, onStep, onClose } = opts;
  const press = useRef<Press | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (isControl(e)) return;
    press.current = { t: Date.now(), x: e.clientX, y: e.clientY };
    onHold(true);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current;
    press.current = null;
    onHold(false);
    if (!p || isControl(e)) return;
    const dx = Math.abs(e.clientX - p.x);
    const dy = e.clientY - p.y;
    if (dy > SWIPE_DOWN_PX && dy > dx) return onClose();
    const isTap = Date.now() - p.t < TAP_MS && dx < TAP_SLOP_PX && Math.abs(dy) < TAP_SLOP_PX;
    if (!isTap) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onStep((e.clientX - rect.left) / rect.width < BACK_ZONE ? -1 : 1);
  };

  const onPointerCancel = () => {
    press.current = null;
    onHold(false);
  };

  return { onPointerDown, onPointerUp, onPointerCancel, onPointerLeave: onPointerCancel };
}

/** Everything a story player needs: the slides, which one is showing, its progress, and the gesture handlers. */
export function useStoryPlayer(memories: Memory[], onClose: () => void) {
  const slides: Slide[] = useMemo(() => buildSlides(memories), [memories]);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [ready, setReady] = useState(() => !slides[0]?.src);

  const goTo = useCallback(
    (i: number) => {
      if (i >= slides.length) return onClose();
      const target = Math.max(0, i);
      setReady(!slides[target].src);
      setIndex(target);
    },
    [slides, onClose],
  );
  const step = useCallback((delta: number) => goTo(index + delta), [goTo, index]);
  const togglePause = useCallback(() => setUserPaused((v) => !v), []);
  const hold = useCallback(() => setHeld(true), []);

  const slide: Slide | undefined = slides[index];
  const advance = useCallback(() => goTo(index + 1), [goTo, index]);
  const progress = useSlideTimer(!!slide && ready && !held && !userPaused, index, advance);
  usePlayerEnvironment({ onClose, onStep: step, onTogglePause: togglePause, onHidden: hold });

  // Warm the next photo so the hand-off is instant.
  useEffect(() => {
    const next = slides[index + 1]?.src;
    if (next) new Image().src = next;
  }, [slides, index]);

  const gestures = usePressGestures({ onHold: setHeld, onStep: step, onClose });

  return { slides, slide, index, progress, userPaused, step, togglePause, markReady: () => setReady(true), gestures };
}
