import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  GraduationCap,
  Trophy,
  Music,
  Award,
  Plus,
  CalendarIcon,
  Loader2,
  X,
  Camera,
  Sparkles,
} from "lucide-react";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useAchievements, type AchievementType, type Achievement } from "@/hooks/useAchievements";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES: { id: AchievementType | "all"; label: string; icon: any; tone: string }[] = [
  { id: "all", label: "All", icon: Sparkles, tone: "bg-muted text-muted-foreground" },
  { id: "academics", label: "Academics", icon: GraduationCap, tone: "bg-primary/25 text-primary-deep" },
  { id: "sports", label: "Sports", icon: Trophy, tone: "bg-accent/40 text-accent-foreground" },
  { id: "cultural", label: "Cultural", icon: Music, tone: "bg-secondary/30 text-secondary" },
  { id: "certifications", label: "Certifications", icon: Award, tone: "bg-success/25 text-success" },
];

const Grow = () => {
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { data: achievements = [], isLoading } = useAchievements(child?.id);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<AchievementType | "all">("all");
  const [open, setOpen] = useState(false);

  // form
  const [type, setType] = useState<AchievementType>("academics");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? achievements : achievements.filter((a) => a.type === filter)),
    [achievements, filter],
  );

  const yearCount = useMemo(() => {
    const y = new Date().getFullYear();
    return achievements.filter((a) => new Date(a.achievement_date).getFullYear() === y).length;
  }, [achievements]);

  const handlePhoto = (file: File | null) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setType("academics");
    setSubject("");
    setDate(new Date());
    setGrade("");
    setNotes("");
    handlePhoto(null);
  };

  const handleSave = async () => {
    if (!user || !child) return;
    if (!subject.trim()) {
      toast.error("Add a subject or title for this achievement.");
      return;
    }
    setSaving(true);

    let photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("achievement-photos")
        .upload(path, photoFile, { contentType: photoFile.type });
      if (upErr) {
        setSaving(false);
        toast.error("Couldn't upload that photo.");
        return;
      }
      const { data: pub } = supabase.storage.from("achievement-photos").getPublicUrl(path);
      photo_url = pub.publicUrl;
    }

    const { error } = await supabase.from("achievements").insert({
      user_id: user.id,
      child_id: child.id,
      type,
      subject: subject.trim(),
      achievement_date: format(date, "yyyy-MM-dd"),
      grade: grade.trim() || null,
      notes: notes.trim() || null,
      photo_url,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["achievements"] });
    toast.success("Achievement saved! 🎉");
    resetForm();
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this achievement?")) return;
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["achievements"] });
    toast.success("Removed.");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Grow</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {yearCount > 0
                ? `${yearCount} achievement${yearCount === 1 ? "" : "s"} this year ✨`
                : "Celebrate every milestone, big or small."}
            </p>
          </div>
          <Button variant="warm" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </header>

        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={cn(
                  "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
                  active
                    ? "border-primary-deep bg-primary/25 text-primary-deep"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setOpen(true)} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((a) => (
              <AchievementCard key={a.id} a={a} onDelete={() => handleDelete(a.id)} />
            ))}
          </ul>
        )}
      </main>

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add achievement</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Photo / certificate (optional)</Label>
              <label
                htmlFor="ach-photo"
                className={cn(
                  "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-all hover:border-primary/40",
                  photoPreview ? "aspect-[4/3]" : "h-32",
                )}
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePhoto(null);
                      }}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
                      aria-label="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                    <Camera className="h-5 w-5" />
                    <span className="text-[13px] font-medium">Tap to upload</span>
                  </div>
                )}
                <input
                  id="ach-photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ach-type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AchievementType)}>
                  <SelectTrigger id="ach-type" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academics">Academics</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="certifications">Certifications</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full justify-start rounded-xl font-normal"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {format(date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ach-subject">Subject / title</Label>
              <Input
                id="ach-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Math Olympiad, Piano Recital..."
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ach-grade">Grade / score (optional)</Label>
              <Input
                id="ach-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="A+, 1st place, Level 3..."
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ach-notes">Notes (optional)</Label>
              <Textarea
                id="ach-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl"
                placeholder="A few words to remember it by..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="warm" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save & Celebrate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

const AchievementCard = ({ a, onDelete }: { a: Achievement; onDelete: () => void }) => {
  const meta = TYPES.find((t) => t.id === a.type);
  const Icon = meta?.icon ?? Sparkles;
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:shadow-lift animate-fade-in-up">
      {a.photo_url && (
        <img src={a.photo_url} alt={a.subject} className="h-36 w-full object-cover" loading="lazy" />
      )}
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              meta?.tone ?? "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {meta?.label ?? a.type}
          </span>
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{a.subject}</h3>
        {a.grade && <p className="text-[13px] font-medium text-primary-deep">{a.grade}</p>}
        <p className="text-[12px] text-muted-foreground">
          {format(new Date(a.achievement_date), "MMM d, yyyy")}
        </p>
        {a.notes && <p className="pt-1 text-[13px] text-foreground/80">{a.notes}</p>}
      </div>
    </li>
  );
};

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="mx-auto max-w-md py-16 text-center animate-fade-in">
    <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/40 text-accent-foreground">
      <Trophy className="h-8 w-8" strokeWidth={2} />
    </span>
    <h2 className="text-xl font-semibold text-foreground">No achievements yet</h2>
    <p className="mt-2 text-[15px] text-muted-foreground">
      Track first words, A+ report cards, swim ribbons — every win matters.
    </p>
    <Button variant="warm" size="lg" className="mt-5" onClick={onAdd}>
      <Plus className="h-4 w-4" /> Add achievement
    </Button>
  </div>
);

export default Grow;
