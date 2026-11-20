import { createPortal } from "react-dom";
import type { Memory } from "@/hooks/useMemories";
import { useStoryPlayer } from "@/hooks/useStoryPlayer";
import { SlideMedia, StepButton, StoryCaption, StoryTop } from "@/components/childbook/StoryViewerParts";

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
  const player = useStoryPlayer(memories, onClose);
  const { slide } = player;
  if (!slide) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${tag}`}
      className="fixed inset-0 z-[100] flex select-none items-center justify-center bg-black/95"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <StepButton side="left" onClick={() => player.step(-1)} />
      <StepButton side="right" onClick={() => player.step(1)} />

      <div
        className="relative h-full w-full max-w-[460px] touch-none overflow-hidden bg-black sm:h-[min(100%,860px)] sm:rounded-3xl"
        {...player.gestures}
      >
        <SlideMedia slide={slide} onLoaded={player.markReady} />
        <StoryTop
          slides={player.slides}
          index={player.index}
          progress={player.progress}
          title={title}
          tag={tag}
          paused={player.userPaused}
          onTogglePause={player.togglePause}
          onClose={onClose}
        />
        {slide.src && <StoryCaption slide={slide} />}
      </div>
    </div>,
    document.body,
  );
};
