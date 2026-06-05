import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";

interface Props {
  selectedIds: string[];
  memoriesById: Record<string, Memory>;
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
}

const Row = ({ memory, onRemove }: { memory: Memory; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: memory.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-xl border bg-card p-2">
      <button {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
        {memory.photo_url ? (
          <img src={memory.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{memory.title}</div>
        <div className="text-[11px] text-muted-foreground">{format(new Date(memory.happened_at), "PP")}</div>
      </div>
      <button onClick={onRemove} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const SelectedMemoriesList = ({ selectedIds, memoriesById, onReorder, onRemove }: Props) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedIds.indexOf(active.id as string);
    const newIndex = selectedIds.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(selectedIds, oldIndex, newIndex));
  };

  if (selectedIds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center text-[13px] text-muted-foreground">
        No memories selected yet. Tap the rows below to add some.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {selectedIds.map((id) => {
            const m = memoriesById[id];
            if (!m) return null;
            return <Row key={id} memory={m} onRemove={() => onRemove(id)} />;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
