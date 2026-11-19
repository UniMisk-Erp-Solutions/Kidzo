import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Apple, BookOpen, Gamepad2, Music2, Pencil, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const topics = [
  { id: "song", label: "Favorite song", icon: Music2 },
  { id: "snack", label: "Go-to snack", icon: Apple },
  { id: "interest", label: "Current obsession", icon: Gamepad2 },
  { id: "movie_book", label: "Favorite movie or book", icon: BookOpen },
] as const;

type Topic = typeof topics[number]["id"];
type Entries = Partial<Record<Topic, string>>;
type Draft = { original: Entries; values: Entries };

export function LittleThings({ childId, canEdit }: { childId: string; canEdit: boolean }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["child-little-things", user?.id, childId];
  const [draft, setDraft] = useState<Draft | null>(null);
  const entries = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("child_little_things").select("topic, detail").eq("child_id", childId).in("topic", topics.map(({ id }) => id));
      if (error) throw error;
      return Object.fromEntries(data.map((row) => [row.topic, row.detail])) as Entries;
    },
  });
  const save = useMutation({
    mutationFn: async ({ original, values }: Draft) => {
      const changes = topics.flatMap(({ id }) => {
        const detail = (values[id] ?? "").trim();
        return detail === (original[id] ?? "") ? [] : [{ child_id: childId, topic: id, detail }];
      });
      if (!changes.length) return;
      const { error } = await supabase.from("child_little_things").upsert(changes, { onConflict: "child_id,topic" });
      if (error) throw error;
      client.setQueryData<Entries>(key, (previous) => {
        const next = { ...previous };
        for (const change of changes) next[change.topic] = change.detail;
        return next;
      });
      await client.invalidateQueries({ queryKey: key });
    },
    onSuccess: () => setDraft(null),
  });
  const editing = canEdit && draft !== null;

  return (
    <section className="rounded-3xl border border-border bg-gradient-celebrate p-4 text-[hsl(var(--on-celebrate))] shadow-soft sm:p-6">
      <form onSubmit={(event) => {
        event.preventDefault();
        if (canEdit && draft && !save.isPending) save.mutate(draft);
      }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card/90 text-primary-deep">
              <Star className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Little Things Right Now</h2>
              <p className="text-xs opacity-85 sm:text-sm">Small snapshots of their world today.</p>
            </div>
          </div>
          {canEdit && entries.isSuccess && !editing && (
            <Button type="button" variant="outline" size="sm" className="rounded-full bg-card text-foreground" onClick={() => {
              save.reset();
              setDraft({ original: entries.data, values: entries.data });
            }}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
        {entries.isError && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <p>Couldn’t load these details.</p>
            <Button type="button" size="sm" variant="outline" className="bg-card text-foreground" onClick={() => entries.refetch()}>Retry</Button>
          </div>
        )}
        {entries.isLoading && <p className="mt-4 text-sm" role="status">Loading details…</p>}
        {entries.isSuccess && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {topics.map(({ id, label, icon: Icon }) => (
              <div key={id} className="relative min-w-0 rounded-xl border border-border bg-card p-3.5 text-foreground shadow-soft">
                <span aria-hidden="true" className="absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2 rotate-6 rounded-sm bg-[hsl(var(--sec-2)/0.85)]" />
                <label className="flex items-center gap-2 text-sm font-semibold" htmlFor={editing ? `little-thing-${id}` : undefined}>
                  <Icon className="size-4 text-primary-deep" aria-hidden="true" /> {label}
                </label>
                {editing && draft ? (
                  <Textarea id={`little-thing-${id}`} className="mt-2 min-h-20" maxLength={180} disabled={save.isPending} value={draft.values[id] ?? ""} onChange={(event) => {
                    const detail = event.target.value;
                    setDraft({ ...draft, values: { ...draft.values, [id]: detail } });
                  }} />
                ) : (
                  <p className="mt-2 min-h-8 whitespace-pre-wrap break-words text-sm text-muted-foreground">{entries.data[id] || "Nothing added yet"}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {editing && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {save.isError && <p className="mr-auto text-sm" role="alert">Couldn’t save your changes. Please try again.</p>}
            <Button type="button" variant="outline" size="sm" className="bg-card text-foreground" disabled={save.isPending} onClick={() => setDraft(null)}>Cancel</Button>
            <Button type="submit" variant="outline" size="sm" className="bg-card text-foreground" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
          </div>
        )}
      </form>
    </section>
  );
}
