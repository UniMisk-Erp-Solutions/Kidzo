import { ImagePlus, Move, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props {
  onText: () => void;
  onBadge: () => void;
  onImage: () => void;
  /** True for pages saved earlier with the original design hidden: offers a switch to bring it back. */
  canShowOriginal: boolean;
  onShowOriginal: () => void;
  /** The page's own photos/text haven't been made movable yet. */
  canMakeMovable: boolean;
  onMakeMovable: () => void;
}

/** The three things people most want to do on a page: add text, a badge or an image. */
export const QuickAddSection = ({ onText, onBadge, onImage, canShowOriginal, onShowOriginal, canMakeMovable, onMakeMovable }: Props) => (
  <section className="rounded-md border bg-muted/30 p-2">
    <div className="mb-2 text-xs font-bold uppercase tracking-wide">Add to this page</div>
    <div className="grid grid-cols-3 gap-2">
      <Button size="sm" variant="default" className="px-2" onClick={onText}>
        <Type className="h-3.5 w-3.5 shrink-0" /> Text
      </Button>
      <Button size="sm" variant="default" className="px-2" onClick={onBadge}>
        <Tag className="h-3.5 w-3.5 shrink-0" /> Badge
      </Button>
      <Button size="sm" variant="default" className="px-2" onClick={onImage}>
        <ImagePlus className="h-3.5 w-3.5 shrink-0" /> Image
      </Button>
    </div>
    {canMakeMovable && (
      <div className="mt-2 rounded-md bg-background/50 p-2">
        <Button size="sm" variant="warm" className="w-full" onClick={onMakeMovable}>
          <Move className="h-3.5 w-3.5 shrink-0" /> Make photos &amp; text movable
        </Button>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          Lets you drag, resize and rewrite this page's own photos and text. The decorations (tape, frames, stickers) stay in place.
        </p>
      </div>
    )}
    {canShowOriginal && (
      <div className="mt-2 flex items-center justify-between rounded-md bg-background/50 px-2 py-1.5">
        <span className="text-[11px] text-muted-foreground">Show original design behind</span>
        <Switch checked={false} onCheckedChange={onShowOriginal} />
      </div>
    )}
  </section>
);
