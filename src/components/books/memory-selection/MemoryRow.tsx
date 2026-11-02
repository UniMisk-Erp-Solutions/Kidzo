import { format } from "date-fns";
import { ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Memory } from "@/hooks/useMemories";

const Thumb = ({ url }: { url: string | null }) => (
  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
    {url ? (
      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <ImageIcon className="h-5 w-5" />
      </div>
    )}
  </div>
);

export const MemoryRow = ({
  memory,
  checked,
  onToggle,
}: {
  memory: Memory;
  checked: boolean;
  onToggle: () => void;
}) => (
  // A div, not a <button>: the Checkbox inside renders its own <button>, and nesting them is invalid DOM.
  <div
    role="checkbox"
    aria-checked={checked}
    tabIndex={0}
    onClick={onToggle}
    onKeyDown={(e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onToggle();
      }
    }}
    className={cn(
      "group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border bg-card p-2.5 text-left transition hover:border-primary",
      checked && "border-primary bg-primary/5",
    )}
  >
    <Checkbox checked={checked} className="pointer-events-none shrink-0" />
    <Thumb url={memory.photo_url} />
    <div className="min-w-0 flex-1">
      <div className="truncate text-[14px] font-medium">{memory.title}</div>
      <div className="truncate text-[11px] capitalize text-muted-foreground">
        {format(new Date(memory.happened_at), "MMM d, yyyy")} · {memory.category}
      </div>
    </div>
  </div>
);
