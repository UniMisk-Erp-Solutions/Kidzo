import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Award, Plus } from "lucide-react";
import { TopBar } from "@/components/childbook/TopBar";
import { PageHero } from "@/components/childbook/PageHero";
import { BottomNav } from "@/components/childbook/BottomNav";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ConfirmProvider";
import { AchievementDetail } from "@/components/childbook/AchievementDetail";
import { AchievementCard, GrowEmptyState, TypeFilter, type GrowFilter } from "@/components/childbook/GrowParts";
import { AddAchievementDialog, type AchievementFormValues } from "@/components/childbook/AddAchievementDialog";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCanEditChild } from "@/hooks/useCanEditChild";
import { useAchievements, type Achievement } from "@/hooks/useAchievements";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const growSubtitle = (count: number) =>
  count > 0 ? `${count} achievement${count === 1 ? "" : "s"} this year ✨` : "Celebrate every milestone, big or small.";

const blankForm = (): AchievementFormValues => ({ type: "academics", subject: "", date: new Date(), grade: "", notes: "" });

/** Why a chosen attachment can't be used (photos and PDFs up to 10 MB), or null when it is fine. */
const attachmentProblem = (f: File) => {
  if (f.type !== "application/pdf" && !f.type.startsWith("image/")) return "Please choose a photo or a PDF.";
  return f.size > 10 * 1024 * 1024 ? "That file is over 10 MB." : null;
};

/** Uploads the optional photo; resolves to its public URL, null when there is none, or undefined on failure. */
async function uploadAchievementPhoto(userId: string, file: File | null): Promise<string | null | undefined> {
  if (!file) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("achievement-photos").upload(path, file, { contentType: file.type });
  if (error) return undefined;
  return supabase.storage.from("achievement-photos").getPublicUrl(path).data.publicUrl;
}

const Grow = () => {
  const { user } = useAuth();
  const { data: child } = useActiveChild();
  const { canEdit } = useCanEditChild(child?.id);
  const { data: achievements = [], isLoading } = useAchievements(child?.id);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<GrowFilter>("all");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Achievement | null>(null);

  // form
  const [values, setValues] = useState<AchievementFormValues>(blankForm);
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
    const problem = file && attachmentProblem(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setValues(blankForm());
    handlePhoto(null);
  };

  const handleSave = async () => {
    if (!user || !child) return;
    if (!values.subject.trim()) {
      toast.error("Add a subject or title for this achievement.");
      return;
    }
    setSaving(true);

    const photo_url = await uploadAchievementPhoto(user.id, photoFile);
    if (photo_url === undefined) {
      setSaving(false);
      toast.error("Couldn't upload that file.");
      return;
    }

    const { error } = await supabase.from("achievements").insert({
      user_id: user.id,
      child_id: child.id,
      type: values.type,
      subject: values.subject.trim(),
      achievement_date: format(values.date, "yyyy-MM-dd"),
      grade: values.grade.trim() || null,
      notes: values.notes.trim() || null,
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

  const confirm = useConfirm();
  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Remove this achievement?", confirmLabel: "Remove", destructive: true }))) return;
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["achievements"] });
    setViewing(null);
    toast.success("Removed.");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? "Your child"} />

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        <PageHero
          icon={Award}
          title="Grow"
          subtitle={growSubtitle(yearCount)}
          actions={
            canEdit && (
              <Button variant="outline" size="sm" className="border-white/60 bg-white/85 text-plum hover:bg-white" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            )
          }
        />

        <TypeFilter filter={filter} onChange={setFilter} />

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <GrowEmptyState onAdd={() => setOpen(true)} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AchievementCard
                key={a.id}
                a={a}
                onOpen={() => setViewing(a)}
                onDelete={canEdit ? () => handleDelete(a.id) : undefined}
              />
            ))}
          </ul>
        )}
      </main>

      <AchievementDetail
        achievement={viewing}
        onClose={() => setViewing(null)}
        onDelete={canEdit ? (a) => handleDelete(a.id) : undefined}
      />

      <AddAchievementDialog
        open={open}
        onOpenChange={setOpen}
        values={values}
        onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        photoFile={photoFile}
        photoPreview={photoPreview}
        onPhoto={handlePhoto}
        saving={saving}
        onSubmit={handleSave}
      />

      <BottomNav />
    </div>
  );
};

export default Grow;
