import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slide } from "@/lib/storySlides";

const ICON_BTN = "flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15";

/** Desktop only: a round arrow beside the story. */
export const StepButton = ({ side, onClick }: { side: "left" | "right"; onClick: () => void }) => (
  <button
    type="button"
    data-no-tap
    aria-label={side === "left" ? "Previous" : "Next"}
    onClick={onClick}
    className={cn(
      "absolute hidden h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:flex",
      side === "left" ? "left-[max(1rem,calc(50%-290px))]" : "right-[max(1rem,calc(50%-290px))]",
    )}
  >
    {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
  </button>
);

/** The photo (over a blurred copy of itself), or a text card for a memory with no photo. */
export const SlideMedia = ({ slide, onLoaded }: { slide: Slide; onLoaded: () => void }) => {
  if (!slide.src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-celebrate p-10 text-center text-[hsl(var(--on-celebrate))]">
        <h3 className="font-display text-3xl font-semibold leading-tight">{slide.title}</h3>
        {slide.story && <p className="line-clamp-8 text-[16px] leading-relaxed opacity-85">{slide.story}</p>}
      </div>
    );
  }
  return (
    <>
      <img src={slide.src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
      <img
        key={slide.key}
        src={slide.src}
        alt={slide.title}
        draggable={false}
        onLoad={onLoaded}
        onError={onLoaded}
        className="relative h-full w-full animate-fade-in object-contain"
      />
    </>
  );
};

const barWidth = (i: number, index: number, progress: number) => {
  if (i < index) return "100%";
  return i === index ? `${progress * 100}%` : "0%";
};

/** One thin bar per slide; finished ones are full, the current one fills as it plays. */
const ProgressBars = ({ slides, index, progress }: { slides: Slide[]; index: number; progress: number }) => (
  <div className="flex gap-1" aria-hidden>
    {slides.map((s, i) => (
      <span key={s.key} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
        <span className="block h-full bg-white" style={{ width: barWidth(i, index, progress) }} />
      </span>
    ))}
  </div>
);

interface TopProps {
  slides: Slide[];
  index: number;
  progress: number;
  title: string;
  tag: string;
  paused: boolean;
  onTogglePause: () => void;
  onClose: () => void;
}

/** Progress bars, what is playing, and the pause and close buttons. */
export const StoryTop = ({ slides, index, progress, title, tag, paused, onTogglePause, onClose }: TopProps) => (
  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-3">
    <ProgressBars slides={slides} index={index} progress={progress} />
    <div className="mt-3 flex items-center justify-between gap-2 text-white">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold">{title}</p>
        <p className="text-[11px] opacity-80">{tag}</p>
      </div>
      <div className="flex items-center gap-1" data-no-tap>
        <button type="button" data-no-tap onClick={onTogglePause} aria-label={paused ? "Play" : "Pause"} className={ICON_BTN}>
          {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        <button type="button" data-no-tap onClick={onClose} aria-label="Close" className={ICON_BTN}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
);

/** Title, date and story over the bottom of a photo slide. */
export const StoryCaption = ({ slide }: { slide: Slide }) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-6 pt-16 text-white">
    <p className="font-caption text-[18px] leading-snug">{slide.title}</p>
    <p className="mt-0.5 text-[12px] opacity-80">{slide.date}</p>
    {slide.story && <p className="mt-2 line-clamp-3 text-[13.5px] leading-snug opacity-90">{slide.story}</p>}
  </div>
);
