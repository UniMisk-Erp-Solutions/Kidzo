import { format } from "date-fns";
import { Trash2, Users, Heart, Tag, X, Pencil, CalendarIcon, Plus, Loader2, Check, Star, Camera } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type Memory, useMemories } from "@/hooks/useMemories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const tagStyles: Record<string, string> = {
  Milestone: "bg-accent/40 text-accent-foreground",
  Celebration: "bg-secondary/30 text-secondary",
  Everyday: "bg-primary/30 text-primary-deep",
  Cozy: "bg-muted text-muted-foreground",
  Adventure: "bg-success/25 text-success",
  Family: "bg-warning/25 text-warning-foreground",
};

const CATEGORIES = ["Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];

interface Props {
  memory: Memory | null;
  onClose: () => void;
}

export const MemoryDetail = ({ memory, onClose }: Props) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [happenedAt, setHappenedAt] = useState<Date>(new Date());
  const [category, setCategory] = useState("Everyday");
  const [who, setWho] = useState<string[]>([]);
  const [whoInput, setWhoInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Multi-photo state
  const MAX_PHOTOS = 10;
  // existing image URLs that are kept
  const [keptUrls, setKeptUrls] = useState<string[]>([]);
  // new local image uploads queued up for save
  type NewPhoto = { id: string; file: File; preview: string };
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  // 0..keptUrls.length-1 maps to kept URL; keptUrls.length+i maps to newPhotos[i]
  const [highlightIdx, setHighlightIdx] = useState(0);
  // active image shown in the big preview (view mode only)
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  useEffect(() => {
    if (memory) {
      setEditing(false);
      setTitle(memory.title);
      setStory(memory.story ?? "");
      setHappenedAt(new Date(memory.happened_at));
      setCategory(memory.category);
      setWho(memory.who_was_there ?? []);
      setTags(memory.tags ?? []);
      setWhoInput("");
      setTagInput("");
      const initialUrls = (memory.photo_urls && memory.photo_urls.length > 0)
        ? memory.photo_urls
        : memory.photo_url ? [memory.photo_url] : [];
      setKeptUrls(initialUrls);
      setNewPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview));
        return [];
      });
      setHighlightIdx(0);
      setActiveImgIdx(0);
    }
  }, [memory]);

  const addChip = (
    value: string,
    setValue: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    const parts = value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      setValue("");
      return;
    }
    const next = [...list];
    const lower = new Set(next.map((x) => x.toLowerCase()));
    for (const p of parts) {
      const key = p.toLowerCase();
      if (!lower.has(key)) {
        next.push(p);
        lower.add(key);
      }
    }
    setList(next);
    setValue("");
  };

  const removeChip = (idx: number, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const { data: pastMemories = [] } = useMemories(memory?.child_id);
  const { whoSuggestions, tagSuggestions } = useMemo(() => {
    const tally = (field: "who_was_there" | "tags") => {
      const counts = new Map<string, { label: string; count: number }>();
      for (const m of pastMemories) {
        const arr = (m as unknown as Record<string, string[] | null>)[field] ?? [];
        for (const raw of arr) {
          const v = (raw ?? "").trim();
          if (!v) continue;
          const k = v.toLowerCase();
          const cur = counts.get(k);
          if (cur) cur.count += 1;
          else counts.set(k, { label: v, count: 1 });
        }
      }
      return [...counts.values()].sort((a, b) => b.count - a.count).map((x) => x.label);
    };
    return { whoSuggestions: tally("who_was_there"), tagSuggestions: tally("tags") };
  }, [pastMemories]);

  const handleDelete = async () => {
    if (!memory) return;
    if (!confirm("Delete this memory? This can't be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("memories").delete().eq("id", memory.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["memories"] });
    toast.success("Memory removed.");
    onClose();
  };

  const addNewPhotos = (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const room = MAX_PHOTOS - (keptUrls.length + newPhotos.length);
    if (room <= 0) {
      toast.error(`You can keep up to ${MAX_PHOTOS} photos per memory.`);
      return;
    }
    const accepted = incoming.slice(0, room);
    if (incoming.length > room) {
      toast.message(`Only the first ${room} photo(s) were added (max ${MAX_PHOTOS}).`);
    }
    const items: NewPhoto[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewPhotos((prev) => [...prev, ...items]);
  };

  const removeKept = (idx: number) => {
    setKeptUrls((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next;
    });
    setHighlightIdx((cur) => {
      if (cur === idx) return 0;
      if (cur > idx) return cur - 1;
      return cur;
    });
  };

  const removeNewPhoto = (id: string) => {
    setNewPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      const idx = prev.findIndex((p) => p.id === id);
      const absoluteIdx = keptUrls.length + idx;
      setHighlightIdx((cur) => {
        if (cur === absoluteIdx) return 0;
        if (cur > absoluteIdx) return cur - 1;
        return cur;
      });
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSave = async () => {
    if (!memory || !user) return;
    if (!title.trim()) {
      toast.error("Memory title can't be empty.");
      return;
    }
    setSaving(true);

    // Upload any newly added photos
    const uploadedUrls: string[] = [];
    for (const item of newPhotos) {
      const ext = item.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("memory-photos")
        .upload(path, item.file, { contentType: item.file.type });
      if (upErr) {
        setSaving(false);
        toast.error("Couldn't upload a photo. Please try again.");
        return;
      }
      const { data: pub } = supabase.storage.from("memory-photos").getPublicUrl(path);
      uploadedUrls.push(pub.publicUrl);
    }

    // Combined list (kept first, then new), then highlighted moves to index 0
    const combined = [...keptUrls, ...uploadedUrls];
    const safeHighlight = Math.min(Math.max(0, highlightIdx), Math.max(0, combined.length - 1));
    const ordered =
      combined.length > 0
        ? [combined[safeHighlight], ...combined.filter((_, i) => i !== safeHighlight)]
        : [];
    const photo_url = ordered[0] ?? null;

    const { error } = await supabase
      .from("memories")
      .update({
        title: title.trim(),
        story: story.trim() || null,
        happened_at: happenedAt.toISOString(),
        category,
        who_was_there: who,
        tags,
        photo_url,
        photo_urls: ordered,
      })
      .eq("id", memory.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["memories"] });
    toast.success("Memory updated. ✓");
    // refresh local kept urls in case user keeps editing
    setKeptUrls(ordered);
    newPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setNewPhotos([]);
    setHighlightIdx(0);
    setActiveImgIdx(0);
    setEditing(false);
  };

  // Images shown in the read-only view (prefer photo_urls, fall back to photo_url)
  const viewImages: string[] =
    (memory?.photo_urls && memory.photo_urls.length > 0)
      ? memory.photo_urls
      : memory?.photo_url
        ? [memory.photo_url]
        : [];
  const activeViewImg = viewImages[Math.min(activeImgIdx, Math.max(0, viewImages.length - 1))] ?? null;

  return (
    <Dialog open={!!memory} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden rounded-3xl border-border bg-card p-0">
        {memory && (
          <div className="flex max-h-[92vh] flex-col">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>

            {activeViewImg && (
              <div className="bg-muted">
                <img src={activeViewImg} alt={memory.title} className="max-h-[45vh] w-full object-cover" />
                {viewImages.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto bg-card/95 px-3 py-2 scrollbar-hide">
                    {viewImages.map((u, i) => (
                      <button
                        key={u + i}
                        type="button"
                        onClick={() => setActiveImgIdx(i)}
                        aria-label={`View photo ${i + 1}`}
                        className={cn(
                          "h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                          i === activeImgIdx
                            ? "border-primary-deep"
                            : "border-transparent opacity-70 hover:opacity-100",
                        )}
                      >
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 sm:p-7">
              {!editing ? (
                <>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      tagStyles[memory.category] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {memory.category}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-foreground">{memory.title}</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {format(new Date(memory.happened_at), "EEEE, MMMM d, yyyy")}
                  </p>

                  {memory.story && (
                    <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85">
                      {memory.story}
                    </p>
                  )}

                  <dl className="mt-5 space-y-3 border-t border-border pt-5">
                    {memory.who_was_there.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <dd className="text-[14px] text-foreground">{memory.who_was_there.join(", ")}</dd>
                      </div>
                    )}
                    {memory.reaction && (
                      <div className="flex items-start gap-3">
                        <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <dd className="text-[14px] text-foreground">{memory.reaction}</dd>
                      </div>
                    )}
                    {memory.tags.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <dd className="flex flex-wrap gap-1.5">
                          {memory.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-6 flex justify-between gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                    <Button variant="warm" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4" />
                      Edit memory
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Edit memory</h2>

                  {/* Photo manager */}
                  <div className="space-y-2">
                    <div className="flex items-end justify-between gap-2">
                      <Label>Photos</Label>
                      <span className="text-[11px] text-muted-foreground">
                        {keptUrls.length + newPhotos.length}/{MAX_PHOTOS} · tap to set highlight
                      </span>
                    </div>
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {keptUrls.map((url, i) => {
                        const isHighlight = i === highlightIdx;
                        return (
                          <li key={`kept-${url}-${i}`} className="relative">
                            <button
                              type="button"
                              onClick={() => setHighlightIdx(i)}
                              className={cn(
                                "block aspect-square w-full overflow-hidden rounded-xl border-2 transition-all",
                                isHighlight
                                  ? "border-primary-deep ring-2 ring-primary/40"
                                  : "border-border hover:border-primary/40",
                              )}
                              aria-label={isHighlight ? "Current highlight" : "Set as highlight"}
                            >
                              <img src={url} alt="" className="h-full w-full object-cover" />
                              {isHighlight && (
                                <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-primary-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
                                  <Star className="h-2.5 w-2.5" /> Highlight
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeKept(i)}
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
                              aria-label="Remove photo"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                      {newPhotos.map((p, i) => {
                        const absoluteIdx = keptUrls.length + i;
                        const isHighlight = absoluteIdx === highlightIdx;
                        return (
                          <li key={p.id} className="relative">
                            <button
                              type="button"
                              onClick={() => setHighlightIdx(absoluteIdx)}
                              className={cn(
                                "block aspect-square w-full overflow-hidden rounded-xl border-2 transition-all",
                                isHighlight
                                  ? "border-primary-deep ring-2 ring-primary/40"
                                  : "border-border hover:border-primary/40",
                              )}
                            >
                              <img src={p.preview} alt="" className="h-full w-full object-cover" />
                              <span className="absolute right-1 bottom-1 rounded-full bg-accent/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
                                New
                              </span>
                              {isHighlight && (
                                <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-primary-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
                                  <Star className="h-2.5 w-2.5" /> Highlight
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeNewPhoto(p.id)}
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
                              aria-label="Remove photo"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                      {keptUrls.length + newPhotos.length < MAX_PHOTOS && (
                        <li>
                          <label
                            htmlFor="edit-photo-add"
                            className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60"
                          >
                            <Camera className="h-5 w-5" />
                            <span className="text-[11px] font-medium">Add photo</span>
                            <input
                              id="edit-photo-add"
                              type="file"
                              accept="image/*"
                              multiple
                              className="sr-only"
                              onChange={(e) => {
                                addNewPhotos(e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-story">Story</Label>
                    <Textarea
                      id="edit-story"
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      rows={5}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>When</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 w-full justify-start rounded-xl font-normal"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {format(happenedAt, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={happenedAt}
                            onSelect={(d) => d && setHappenedAt(d)}
                            disabled={(d) => d > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="edit-category" className="h-11 rounded-xl">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-who">Who was there?</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-who"
                        value={whoInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v.includes(",")) {
                            addChip(v, setWhoInput, who, setWho);
                          } else {
                            setWhoInput(v);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addChip(whoInput, setWhoInput, who, setWho);
                          }
                        }}
                        onBlur={() => addChip(whoInput, setWhoInput, who, setWho)}
                        placeholder="Mom, Grandma..."
                        className="h-11 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="soft"
                        size="icon"
                        onClick={() => addChip(whoInput, setWhoInput, who, setWho)}
                        aria-label="Add person"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Separate with commas — e.g. <span className="font-medium">Mom, Dad, Grandma</span>
                    </p>
                    {(() => {
                      const visible = whoSuggestions
                        .filter((s) => !who.some((x) => x.toLowerCase() === s.toLowerCase()))
                        .slice(0, 3);
                      if (visible.length === 0) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] text-muted-foreground">Suggestions:</span>
                          {visible.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => addChip(s, setWhoInput, who, setWho)}
                              className="rounded-full border border-dashed border-primary/40 px-2.5 py-0.5 text-[12px] text-primary-deep transition hover:bg-primary/15"
                            >
                              + {s}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    {who.length > 0 && (
                      <ul className="flex flex-wrap gap-2 pt-1">
                        {who.map((p, i) => (
                          <li
                            key={`${p}-${i}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/25 px-3 py-1 text-[13px] font-medium text-primary-deep"
                          >
                            {p}
                            <button
                              type="button"
                              onClick={() => removeChip(i, who, setWho)}
                              className="rounded-full hover:bg-primary/30"
                              aria-label={`Remove ${p}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-tags"
                        value={tagInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v.includes(",")) {
                            addChip(v, setTagInput, tags, setTags);
                          } else {
                            setTagInput(v);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addChip(tagInput, setTagInput, tags, setTags);
                          }
                        }}
                        onBlur={() => addChip(tagInput, setTagInput, tags, setTags)}
                        placeholder="firsts, summer..."
                        className="h-11 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="soft"
                        size="icon"
                        onClick={() => addChip(tagInput, setTagInput, tags, setTags)}
                        aria-label="Add tag"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Separate with commas — e.g. <span className="font-medium">firsts, summer, park</span>
                    </p>
                    {(() => {
                      const visible = tagSuggestions
                        .filter((s) => !tags.some((x) => x.toLowerCase() === s.toLowerCase()))
                        .slice(0, 3);
                      if (visible.length === 0) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] text-muted-foreground">Suggestions:</span>
                          {visible.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => addChip(s, setTagInput, tags, setTags)}
                              className="rounded-full border border-dashed border-accent-foreground/30 px-2.5 py-0.5 text-[12px] text-accent-foreground transition hover:bg-accent/30"
                            >
                              + #{s}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    {tags.length > 0 && (
                      <ul className="flex flex-wrap gap-2 pt-1">
                        {tags.map((t, i) => (
                          <li
                            key={`${t}-${i}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-accent/40 px-3 py-1 text-[13px] font-medium text-accent-foreground"
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => removeChip(i, tags, setTags)}
                              className="rounded-full hover:bg-accent/50"
                              aria-label={`Remove ${t}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button variant="warm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
