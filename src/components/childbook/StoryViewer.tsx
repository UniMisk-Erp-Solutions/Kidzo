import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import type { Memory } from "@/hooks/useMemories";

/** How long each slide stays on screen before moving on by itself. */
const SLIDE_MS = 5000;
/** A press shorter than this (and barely moved) is a tap; anything longer is a hold-to-pause. */
const TAP_MS = 250;
const MAX_SLIDES = 40;
const MAX_PHOTOS_PER_MEMORY = 6;

type Slide = { key: string; src: string | null; title: string; date: string; story: string | null };

/** One slide per photo (text-only memories get a text slide), in the order given. */
function buildSlides(memories: Memory[]): Slide[] {
  const out: Slide[] = [];
  for (const m of memories) {
    const photos = (m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : []).slice(0, MAX_PHOTOS_PER_MEMORY);
    const base = { title: m.title, date: format(new Date(m.happened_at), "MMM d, yyyy"), story: m.story };
    if (photos.length === 0) out.push({ key: `${m.id}-t`, src: null, ...base });
    else photos.forEach((src, i) => out.push({ key: `${m.id}-${i}`, src, ...base }));
  }
  return out.slice(0, MAX_SLIDES);
}

interface Props {
  title: string;
  tag: string;
  memories: Memory[];
  onClose: () => void;
}

/**
 * Full-screen story player for a recap. Moves on by itself; press and hold to pause, tap the left side to go
 * back and the right side to skip, swipe down (or Esc) to close.
 */
export const StoryViewer = ({ title, tag, memories, onClose }: Props) => {
  const slides = useMemo(() => buildSlides(memories), [memories]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [held, setHeld] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [ready, setReady] = useState(() => !slides[0]?.src);
  const progressRef = useRef(0);
  const press = useRef<{ t: number; x: number; y: number } | null>(null);

  const slide = slides[index];
  const paused = held || userPaused;

  const goTo = useCallback(
    (i: number) => {
      if (i < 0) i = 0;
      if (i >= slides.length) return onClose();
      progressRef.current = 0;
      setProgress(0);
      setReady(!slides[i].src);
      setIndex(i);
    },
    [slides, onClose],
  );

  // Each slide waits for its image, then fills its bar over SLIDE_MS (resuming where a pause left off).
  useEffect(() => {
    if (paused || !ready || !slide) return;
    const startedAt = performance.now() - progressRef.current * SLIDE_MS;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / SLIDE_MS);
      progressRef.current = p;
      setProgress(p);
      if (p >= 1) goTo(index + 1);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, ready, index, slide, goTo]);

  // Warm the next photo so the hand-off is instant.
  useEffect(() => {
    const next = slides[index + 1]?.src;
    if (next) new Image().src = next;
  }, [slides, index]);

  // Page behind stays still; keys and tab switching behave like a player.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === " ") {
        e.preventDefault();
        setUserPaused((v) => !v);
      }
    };
    const onHide = () => document.hidden && setHeld(true);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [index, goTo, onClose]);

  if (!slide) return null;

  const isControl = (e: React.PointerEvent) => !!(e.target as HTMLElement).closest("[data-no-tap]");

  const onPointerDown = (e: React.PointerEvent) => {
    if (isControl(e)) return;
    press.current = { t: Date.now(), x: e.clientX, y: e.clientY };
    setHeld(true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    setHeld(false);
    if (!p || isControl(e)) return;
    const dx = Math.abs(e.clientX - p.x);
    const dy = e.clientY - p.y;
    if (dy > 110 && dy > dx) return onClose(); // swipe down
    if (Date.now() - p.t < TAP_MS && dx < 12 && Math.abs(dy) < 12) {
      const rect = e.currentTarget.getBoundingClientRect();
      goTo((e.clientX - rect.left) / rect.width < 0.35 ? index - 1 : index + 1);
    }
  };
  const onPointerCancel = () => {
    press.current = null;
    setHeld(false);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${tag}`}
      className="fixed inset-0 z-[100] flex select-none items-center justify-center bg-black/95"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* desktop: step buttons beside the story */}
      <button
        type="button"
        data-no-tap
        aria-label="Previous"
        onClick={() => goTo(index - 1)}
        className="absolute left-[max(1rem,calc(50%-290px))] hidden h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        data-no-tap
        aria-label="Next"
        onClick={() => goTo(index + 1)}
        className="absolute right-[max(1rem,calc(50%-290px))] hidden h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        className="relative h-full w-full max-w-[460px] touch-none overflow-hidden bg-black sm:h-[min(100%,860px)] sm:rounded-3xl"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
      >
        {slide.src ? (
          <>
            <img src={slide.src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
            <img
              key={slide.key}
              src={slide.src}
              alt={slide.title}
              draggable={false}
              onLoad={() => setReady(true)}
              onError={() => setReady(true)}
              className="relative h-full w-full animate-fade-in object-contain"
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-celebrate p-10 text-center text-[hsl(var(--on-celebrate))]">
            <h3 className="font-display text-3xl font-semibold leading-tight">{slide.title}</h3>
            {slide.story && <p className="line-clamp-8 text-[16px] leading-relaxed opacity-85">{slide.story}</p>}
          </div>
        )}

        {/* top: progress bars + who/what */}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-3">
          <div className="flex gap-1" aria-hidden>
            {slides.map((s, i) => (
              <span key={s.key} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                <span
                  className="block h-full bg-white"
                  style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }}
                />
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-white">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{title}</p>
              <p className="text-[11px] opacity-80">{tag}</p>
            </div>
            <div className="flex items-center gap-1" data-no-tap>
              <button
                type="button"
                data-no-tap
                onClick={() => setUserPaused((v) => !v)}
                aria-label={userPaused ? "Play" : "Pause"}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"
              >
                {userPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                type="button"
                data-no-tap
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* bottom: caption */}
        {slide.src && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-6 pt-16 text-white">
            <p className="font-caption text-[18px] leading-snug">{slide.title}</p>
            <p className="mt-0.5 text-[12px] opacity-80">{slide.date}</p>
            {slide.story && <p className="mt-2 line-clamp-3 text-[13.5px] leading-snug opacity-90">{slide.story}</p>}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
