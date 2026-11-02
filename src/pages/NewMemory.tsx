import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { useChildren } from "@/hooks/useChildren";
import { useCalendarMemory } from "@/hooks/useCalendarMemory";
import { useCreateMemory } from "@/hooks/useCreateMemory";
import { useMemoryPhotos, orderPhotos } from "@/hooks/useMemoryPhotos";
import { useMemorySuggestions } from "@/hooks/useMemorySuggestions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BottomNav } from "@/components/childbook/BottomNav";
import { ChipField } from "@/components/memory/ChipField";
import { PhotoUploader } from "@/components/memory/PhotoUploader";
import { SiblingLinks, type SiblingSelection } from "@/components/memory/SiblingLinks";
import { WhenPicker } from "@/components/memory/WhenPicker";
import { mergeChips } from "@/lib/chips";

const CATEGORIES = ["Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];

/** Footer buttons: save and go to Moments, or save and start another. */
const SaveBar = ({ saving, onSaveAnother }: { saving: boolean; onSaveAnother: () => void }) => (
  <div className="sticky bottom-4 flex flex-col gap-2 rounded-2xl border border-border bg-card/90 p-3 shadow-lift backdrop-blur-xl sm:flex-row">
    <Button type="submit" variant="warm" size="lg" className="w-full" disabled={saving}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {saving ? "Saving..." : "Save & Celebrate"}
    </Button>
    <Button type="button" variant="soft" size="lg" className="w-full" onClick={onSaveAnother} disabled={saving}>
      Save & Add Another
    </Button>
  </div>
);

const NewMemory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { data: allChildren = [] } = useChildren();
  const qc = useQueryClient();
  const createMemory = useCreateMemory();

  // Read-only (viewer) shares must not reach this page, even by typing the URL.
  const { isViewer, loading: roleLoading } = useCanEditChild(child?.id);
  useEffect(() => {
    if (!roleLoading && child && isViewer) {
      toast.error("You have view-only access to this child — you can't add memories.");
      navigate("/moments", { replace: true });
    }
  }, [roleLoading, child, isViewer, navigate]);

  // Other children you own — candidates to also tag this memory onto (siblings).
  const siblings = useMemo(
    () => allChildren.filter((c) => c.id !== child?.id && c.user_id === user?.id),
    [allChildren, child?.id, user?.id],
  );
  // { [childId]: { checked, label } } — which siblings to link + an optional relation note.
  const [linkSel, setLinkSel] = useState<SiblingSelection>({});
  const toggleSibling = (id: string) =>
    setLinkSel((p) => ({ ...p, [id]: { checked: !p[id]?.checked, label: p[id]?.label ?? "" } }));
  const setSiblingLabel = (id: string, label: string) =>
    setLinkSel((p) => ({ ...p, [id]: { checked: p[id]?.checked ?? true, label } }));

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [happenedAt, setHappenedAt] = useState<Date>(new Date());
  const { month: whenMonth, setMonth: setWhenMonth } = useCalendarMemory("memory-when", new Date());
  const [category, setCategory] = useState("Everyday");
  const [reaction, setReaction] = useState("");
  const [saving, setSaving] = useState(false);

  const [whoInput, setWhoInput] = useState("");
  const [who, setWho] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { whoSuggestions, tagSuggestions } = useMemorySuggestions(child?.id);

  const pickDate = (d: Date) => {
    setHappenedAt(d);
    setWhenMonth(d);
  };
  const { photos, highlightId, setHighlightId, autoDateInfo, addFiles, removePhoto, clearPhotos } =
    useMemoryPhotos(pickDate);

  const resetForm = () => {
    setTitle("");
    setStory("");
    setReaction("");
    setWho([]);
    setTags([]);
    setLinkSel({});
    clearPhotos();
  };

  const handleSave = async (saveAndAddAnother = false) => {
    if (!user || !child) return void toast.error("Please set up a child profile first.");
    if (!title.trim()) return void toast.error("Give this memory a title to remember it by.");
    setSaving(true);
    const result = await createMemory({
      userId: user.id,
      childId: child.id,
      title,
      story,
      happenedAt,
      category,
      who,
      tags,
      reaction,
      photos: orderPhotos(photos, highlightId).map((p) => p.file),
      links: siblings.filter((s) => linkSel[s.id]?.checked).map((s) => ({ childId: s.id, label: linkSel[s.id]?.label ?? "" })),
    });
    setSaving(false);
    if (result.ok === false) return void toast.error(result.message);
    if (result.linkError) toast.error(`Memory saved, but linking to siblings failed: ${result.linkError}`);

    qc.invalidateQueries({ queryKey: ["memories"] });
    const n = result.linkCount;
    toast.success(
      n > 0 ? `Memory saved & shared with ${n} sibling${n > 1 ? "s" : ""}! ✓` : "Memory saved! You're doing an amazing job. ✓",
    );
    if (saveAndAddAnother) resetForm();
    else navigate("/moments");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-semibold text-foreground">New memory</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6 animate-fade-in">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
          className="space-y-5"
        >
          <PhotoUploader
            photos={photos}
            highlightId={highlightId}
            onFiles={addFiles}
            onHighlight={setHighlightId}
            onRemove={removePhoto}
          />

          <div className="space-y-1.5">
            <Label htmlFor="title">Memory title</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="First steps in the garden"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="story">What happened?</Label>
            <Textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell us the story..."
              rows={5}
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <WhenPicker
              happenedAt={happenedAt}
              month={whenMonth}
              autoDate={autoDateInfo}
              onPickDate={pickDate}
              onTimeChange={setHappenedAt}
              onMonthChange={setWhenMonth}
            />
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SiblingLinks siblings={siblings} selection={linkSel} onToggle={toggleSibling} onLabel={setSiblingLabel} />

          <ChipField
            id="who"
            label="Who was there?"
            placeholder="Mom, Grandma..."
            addLabel="Add person"
            tone="who"
            hint={<>Separate with commas — e.g. <span className="font-medium">Mom, Dad, Grandma</span></>}
            value={whoInput}
            onValueChange={setWhoInput}
            onCommit={(v) => {
              setWho(mergeChips(v, who));
              setWhoInput("");
            }}
            items={who}
            suggestions={whoSuggestions}
            onRemove={(i) => setWho(who.filter((_, idx) => idx !== i))}
          />

          <div className="space-y-1.5">
            <Label htmlFor="reaction">How did {child?.name ?? "they"} react? (optional)</Label>
            <Input
              id="reaction"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Pure joy, big giggles..."
              className="h-11 rounded-xl"
            />
          </div>

          <ChipField
            id="tags"
            label="Tags (optional)"
            placeholder="firsts, summer..."
            addLabel="Add tag"
            tone="tag"
            hint={<>Separate with commas — e.g. <span className="font-medium">firsts, summer, park</span></>}
            value={tagInput}
            onValueChange={setTagInput}
            onCommit={(v) => {
              setTags(mergeChips(v, tags));
              setTagInput("");
            }}
            items={tags}
            suggestions={tagSuggestions}
            onRemove={(i) => setTags(tags.filter((_, idx) => idx !== i))}
          />

          <SaveBar saving={saving} onSaveAnother={() => handleSave(true)} />
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default NewMemory;
