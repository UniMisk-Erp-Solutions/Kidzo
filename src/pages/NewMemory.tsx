import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Camera, Loader2, X, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCalendarMemory } from "@/hooks/useCalendarMemory";
import { useMemories } from "@/hooks/useMemories";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BottomNav } from "@/components/childbook/BottomNav";
import { extractCapturedAt } from "@/lib/photoMeta";

const CATEGORIES = ["Milestone", "Celebration", "Everyday", "Cozy", "Adventure", "Family"];

const NewMemory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [happenedAt, setHappenedAt] = useState<Date>(new Date());
  const { month: whenMonth, setMonth: setWhenMonth } = useCalendarMemory(
    "memory-when",
    new Date(),
  );
  const [category, setCategory] = useState("Everyday");
  const [reaction, setReaction] = useState("");

  const [whoInput, setWhoInput] = useState("");
  const [who, setWho] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  type PhotoItem = { id: string; file: File; preview: string };
  const MAX_PHOTOS = 10;
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [autoDateInfo, setAutoDateInfo] = useState<{ source: "exif" | "file" } | null>(null);

  const addPhotoFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos per memory.`);
      return;
    }
    const accepted = incoming.slice(0, room);
    if (incoming.length > room) {
      toast.message(`Only the first ${room} photo(s) were added (max ${MAX_PHOTOS}).`);
    }

    const newItems: PhotoItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => {
      const next = [...prev, ...newItems];
      // First photo overall becomes highlight by default
      if (!highlightId && next.length > 0) setHighlightId(next[0].id);
      return next;
    });

    // Auto-fill date from the first newly-added photo if we don't have one yet
    if (!autoDateInfo) {
      const first = accepted[0];
      const captured = await extractCapturedAt(first);
      if (captured && captured.getTime() <= Date.now()) {
        const fromExif =
          first.type.startsWith("image/") &&
          Math.abs(captured.getTime() - first.lastModified) > 60_000;
        setHappenedAt(captured);
        setWhenMonth(captured);
        setAutoDateInfo({ source: fromExif ? "exif" : "file" });
        toast.success(
          fromExif
            ? `Date & time set from photo: ${format(captured, "PPP 'at' h:mm a")}`
            : `Date set from file: ${format(captured, "PPP 'at' h:mm a")}`,
        );
      }
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      const next = prev.filter((p) => p.id !== id);
      if (highlightId === id) {
        setHighlightId(next[0]?.id ?? null);
      }
      if (next.length === 0) setAutoDateInfo(null);
      return next;
    });
  };

  const clearPhotos = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setHighlightId(null);
    setAutoDateInfo(null);
  };

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

  const { data: pastMemories = [] } = useMemories(child?.id);
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

  const handleSave = async (saveAndAddAnother = false) => {
    if (!user || !child) {
      toast.error("Please set up a child profile first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Give this memory a title to remember it by.");
      return;
    }
    setSaving(true);

    // Upload all photos, preserving order. Highlighted one is moved to index 0.
    const ordered: PhotoItem[] = (() => {
      if (!highlightId) return photos;
      const hi = photos.find((p) => p.id === highlightId);
      if (!hi) return photos;
      return [hi, ...photos.filter((p) => p.id !== highlightId)];
    })();

    const uploadedUrls: string[] = [];
    for (const item of ordered) {
      const ext = item.file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("memory-photos")
        .upload(path, item.file, { contentType: item.file.type });
      if (upErr) {
        setSaving(false);
        toast.error("Couldn't upload one of your photos. Please try again.");
        return;
      }
      const { data: pub } = supabase.storage.from("memory-photos").getPublicUrl(path);
      uploadedUrls.push(pub.publicUrl);
    }

    const photo_url: string | null = uploadedUrls[0] ?? null;

    const { error } = await supabase.from("memories").insert({
      user_id: user.id,
      child_id: child.id,
      title: title.trim(),
      story: story.trim() || null,
      happened_at: happenedAt.toISOString(),
      category,
      who_was_there: who,
      tags,
      photo_url,
      photo_urls: uploadedUrls,
      reaction: reaction.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["memories"] });
    toast.success("Memory saved! You're doing an amazing job. ✓");

    if (saveAndAddAnother) {
      setTitle("");
      setStory("");
      setReaction("");
      setWho([]);
      setTags([]);
      clearPhotos();
    } else {
      navigate("/moments");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">New memory</h1>
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
          {/* Photos uploader (multi) */}
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <Label>Photos</Label>
              <span className="text-[11px] text-muted-foreground">
                {photos.length}/{MAX_PHOTOS} · tap a photo to set as highlight
              </span>
            </div>

            {photos.length === 0 ? (
              <label
                htmlFor="photo"
                className="relative flex aspect-[16/9] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-all hover:border-primary/40 hover:bg-muted/60"
              >
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
                    <Camera className="h-6 w-6" />
                  </span>
                  <div className="text-[15px] font-semibold text-foreground">Add photos</div>
                  <div className="text-[13px] text-muted-foreground">
                    Pick up to {MAX_PHOTOS} from your device
                  </div>
                </div>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addPhotoFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((p) => {
                    const isHighlight = p.id === highlightId;
                    return (
                      <li key={p.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setHighlightId(p.id)}
                          className={cn(
                            "group relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition-all",
                            isHighlight
                              ? "border-primary-deep ring-2 ring-primary/40"
                              : "border-border hover:border-primary/40",
                          )}
                          aria-label={isHighlight ? "Current highlight" : "Set as highlight"}
                        >
                          <img src={p.preview} alt="" className="h-full w-full object-cover" />
                          {isHighlight && (
                            <span className="absolute bottom-1 left-1 rounded-full bg-primary-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
                              ★ Highlight
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
                          aria-label="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}

                  {photos.length < MAX_PHOTOS && (
                    <li>
                      <label
                        htmlFor="photo"
                        className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/60"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-[11px] font-medium">Add more</span>
                        <input
                          id="photo"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            addPhotoFiles(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </li>
                  )}
                </ul>
              </div>
            )}
            <p className="px-1 text-[12px] text-muted-foreground">
              The highlight image shows up first in timelines and books.
            </p>
          </div>

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
            <div className="space-y-1.5">
              <Label>When</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl font-normal">
                    <CalendarIcon className="h-4 w-4" />
                    {format(happenedAt, "PPP 'at' h:mm a")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={happenedAt}
                    onSelect={(d) => {
                      if (!d) return;
                      // Preserve the time-of-day from the previous selection
                      // so EXIF-derived precise time isn't wiped by a date pick.
                      const next = new Date(d);
                      next.setHours(
                        happenedAt.getHours(),
                        happenedAt.getMinutes(),
                        happenedAt.getSeconds(),
                        0,
                      );
                      setHappenedAt(next);
                      setWhenMonth(next);
                    }}
                    month={whenMonth}
                    onMonthChange={setWhenMonth}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {autoDateInfo && (
                <p className="px-1 text-[12px] text-muted-foreground">
                  {autoDateInfo.source === "exif"
                    ? "Auto-filled from photo metadata (date & time) — adjust any time."
                    : "Auto-filled from file's last-modified — adjust any time."}
                </p>
              )}
            </div>

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

          {/* Who was there */}
          <div className="space-y-1.5">
            <Label htmlFor="who">Who was there?</Label>
            <div className="flex gap-2">
              <Input
                id="who"
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
            <Label htmlFor="reaction">How did {child?.name ?? "they"} react? (optional)</Label>
            <Input
              id="reaction"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Pure joy, big giggles..."
              className="h-11 rounded-xl"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
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

          <div className="sticky bottom-4 flex flex-col gap-2 rounded-2xl border border-border bg-card/90 p-3 shadow-lift backdrop-blur-xl sm:flex-row">
            <Button type="submit" variant="warm" size="lg" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save & Celebrate"}
            </Button>
            <Button
              type="button"
              variant="soft"
              size="lg"
              className="w-full"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              Save & Add Another
            </Button>
          </div>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default NewMemory;
