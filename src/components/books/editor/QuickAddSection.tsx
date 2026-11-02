import { ImagePlus, Tag, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props {
  onText: () => void;
  onBadge: () => void;
  onImage: () => void;
  /** True for pages saved earlier with the original design hidden: offers a switch to bring it back. */
  canShowOriginal: boolean;
  onShowOriginal: () => void;
}

/** The three things people most want to do on a page: add text, a badge or an image. */
export const QuickAddSection = ({ onText, onBadge, onImage, canShowOriginal, onShowOriginal }: Props) => (
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
    {canShowOriginal && (
      <div className="mt-2 flex items-center justify-between rounded-md bg-background/50 px-2 py-1.5">
        <span className="text-[11px] text-muted-foreground">Show original design behind</span>
        <Switch checked={false} onCheckedChange={onShowOriginal} />
      </div>
    )}
  </section>
);
