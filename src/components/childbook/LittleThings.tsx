import { useState } from "react";
import { Apple, BookOpen, Gamepad2, Music2, Pencil, Star, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLittleThings, type LittleDraft, type LittleEntries, type LittleTopic } from "@/hooks/useLittleThings";

const topics: { id: LittleTopic; label: string; icon: LucideIcon }[] = [
  { id: "song", label: "Favorite song", icon: Music2 },
  { id: "snack", label: "Go-to snack", icon: Apple },
  { id: "interest", label: "Current obsession", icon: Gamepad2 },
  { id: "movie_book", label: "Favorite movie or book", icon: BookOpen },
];

const Heading = () => (
  <div className="flex items-start gap-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card/90 text-primary-deep">
      <Star className="size-5" aria-hidden="true" />
    </span>
    <div>
      <h2 className="text-base font-semibold">Little Things Right Now</h2>
      <p className="text-xs opacity-85 sm:text-sm">Small snapshots of their world today.</p>
    </div>
  </div>
);

interface TopicCardProps {
  id: LittleTopic;
  label: string;
  Icon: LucideIcon;
  saved: string | undefined;
  /** The text being edited, or undefined when not editing. */
  editing?: { value: string; disabled: boolean; onChange: (v: string) => void };
}

const TopicCard = ({ id, label, Icon, saved, editing }: TopicCardProps) => (
  <div className="relative min-w-0 rounded-xl border border-border bg-card p-3.5 text-foreground shadow-soft">
    <span aria-hidden="true" className="absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2 rotate-6 rounded-sm bg-[hsl(var(--sec-2)/0.85)]" />
    <label className="flex items-center gap-2 text-sm font-semibold" htmlFor={editing ? `little-thing-${id}` : undefined}>
      <Icon className="size-4 text-primary-deep" aria-hidden="true" /> {label}
    </label>
    {editing ? (
      <Textarea
        id={`little-thing-${id}`}
        className="mt-2 min-h-20"
        maxLength={180}
        disabled={editing.disabled}
        value={editing.value}
        onChange={(event) => editing.onChange(event.target.value)}
      />
    ) : (
      <p className="mt-2 min-h-8 whitespace-pre-wrap break-words text-sm text-muted-foreground">{saved || "Nothing added yet"}</p>
    )}
  </div>
);

const EditFooter = ({ failed, saving, onCancel }: { failed: boolean; saving: boolean; onCancel: () => void }) => (
  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
    {failed && <p className="mr-auto text-sm" role="alert">Couldn’t save your changes. Please try again.</p>}
    <Button type="button" variant="outline" size="sm" className="bg-card text-foreground" disabled={saving} onClick={onCancel}>Cancel</Button>
    <Button type="submit" variant="outline" size="sm" className="bg-card text-foreground" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
  </div>
);

const LoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="mt-4 flex items-center gap-3 text-sm">
    <p>Couldn’t load these details.</p>
    <Button type="button" size="sm" variant="outline" className="bg-card text-foreground" onClick={onRetry}>Retry</Button>
  </div>
);

export function LittleThings({ childId, canEdit }: { childId: string; canEdit: boolean }) {
  const [draft, setDraft] = useState<LittleDraft | null>(null);
  const { entries, save } = useLittleThings(childId, () => setDraft(null));
  const saved: LittleEntries = entries.data ?? {};
  const editingDraft = canEdit ? draft : null;

  const startEditing = () => {
    save.reset();
    setDraft({ original: saved, values: saved });
  };
  const editorFor = (id: LittleTopic): TopicCardProps["editing"] =>
    editingDraft
      ? {
          value: editingDraft.values[id] ?? "",
          disabled: save.isPending,
          onChange: (v) => setDraft({ ...editingDraft, values: { ...editingDraft.values, [id]: v } }),
        }
      : undefined;

  return (
    <section className="rounded-3xl border border-border bg-gradient-celebrate p-4 text-[hsl(var(--on-celebrate))] shadow-soft sm:p-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (editingDraft && !save.isPending) save.mutate(editingDraft);
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Heading />
          {canEdit && entries.isSuccess && !editingDraft && (
            <Button type="button" variant="outline" size="sm" className="rounded-full bg-card text-foreground" onClick={startEditing}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
        {entries.isError && <LoadError onRetry={() => entries.refetch()} />}
        {entries.isLoading && <p className="mt-4 text-sm" role="status">Loading details…</p>}
        {entries.isSuccess && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {topics.map(({ id, label, icon }) => (
              <TopicCard key={id} id={id} label={label} Icon={icon} saved={saved[id]} editing={editorFor(id)} />
            ))}
          </div>
        )}
        {editingDraft && <EditFooter failed={save.isError} saving={save.isPending} onCancel={() => setDraft(null)} />}
      </form>
    </section>
  );
}
