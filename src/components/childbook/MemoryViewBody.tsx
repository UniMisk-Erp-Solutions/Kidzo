import { format } from "date-fns";
import { Heart, Pencil, Tag, Trash2, Users } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/hooks/useMemories";
import { cn } from "@/lib/utils";
import { tagStyles } from "./memoryDetailUtils";

const Row = ({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
    {children}
  </div>
);

const Details = ({ memory }: { memory: Memory }) => (
  <dl className="mt-5 space-y-3 border-t border-border pt-5">
    {memory.who_was_there.length > 0 && (
      <Row icon={Users}>
        <dd className="text-[14px] text-foreground">{memory.who_was_there.join(", ")}</dd>
      </Row>
    )}
    {memory.reaction && (
      <Row icon={Heart}>
        <dd className="text-[14px] text-foreground">{memory.reaction}</dd>
      </Row>
    )}
    {memory.tags.length > 0 && (
      <Row icon={Tag}>
        <dd className="flex flex-wrap gap-1.5">
          {memory.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
              #{t}
            </span>
          ))}
        </dd>
      </Row>
    )}
  </dl>
);

interface Props {
  memory: Memory;
  canEdit: boolean;
  deleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

/** Read-only view of a memory, with delete / edit buttons for people who can edit. */
export const MemoryViewBody = ({ memory, canEdit, deleting, onDelete, onEdit }: Props) => (
  <>
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tagStyles[memory.category] ?? "bg-muted text-muted-foreground",
      )}
    >
      {memory.category}
    </span>
    <DialogTitle className="mt-3 text-2xl font-bold leading-tight tracking-normal text-foreground">{memory.title}</DialogTitle>
    <p className="mt-1 text-[13px] text-muted-foreground">{format(new Date(memory.happened_at), "EEEE, MMMM d, yyyy")}</p>

    {memory.story && (
      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85">{memory.story}</p>
    )}

    <Details memory={memory} />

    {canEdit && (
      <div className="mt-6 flex justify-between gap-2">
        <Button
          variant="ghost"
          onClick={onDelete}
          disabled={deleting}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <Button variant="warm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit memory
        </Button>
      </div>
    )}
  </>
);
