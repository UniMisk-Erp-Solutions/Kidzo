import { useRef, useState } from "react";
import heroImg from "@/assets/hero-child.jpg";
import { Sparkles, Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateChild } from "@/hooks/useChildren";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AvatarCropDialog } from "./AvatarCropDialog";

interface AgeHeroProps {
  childId: string;
  childName: string;
  dob: Date;
  avatarUrl?: string | null;
  canEdit?: boolean;
}

const calcAge = (dob: Date) => {
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
  return { years, months, days, totalDays };
};

export const AgeHero = ({ childId, childName, dob, avatarUrl, canEdit = true }: AgeHeroProps) => {
  const { years, months, days, totalDays } = calcAge(dob);
  const { user } = useAuth();
  const updateChild = useUpdateChild();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const displaySrc = avatarUrl || heroImg;

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image is too large (max 12MB).");
      return;
    }
    // Preview the original in the crop dialog. We revoke the object URL when
    // the dialog closes.
    const url = URL.createObjectURL(file);
    setPendingSrc(url);
    setCropOpen(true);
  };

  const closeCrop = () => {
    setCropOpen(false);
    if (pendingSrc) {
      URL.revokeObjectURL(pendingSrc);
      setPendingSrc(null);
    }
  };

  const handleApplyCrop = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${childId}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("child-avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("child-avatars").getPublicUrl(path);
      // Bust cache by appending a token so the new image is fetched immediately.
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      await updateChild.mutateAsync({ id: childId, avatar_url: publicUrl });
      toast.success("Photo updated ✨");
      closeCrop();
    } catch (err) {
      console.error("Avatar upload failed", err);
      toast.error("Couldn't upload photo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await updateChild.mutateAsync({ id: childId, avatar_url: null });
      toast.success("Photo removed");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove photo");
    } finally {
      setUploading(false);
      setConfirmRemove(false);
    }
  };

  return (
    <section
      aria-label={`${childName}'s age`}
      className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 shadow-soft sm:p-8 animate-fade-in-up"
    >
      <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-accent/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-primary/30 blur-3xl" aria-hidden />

      <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1 text-[12px] font-medium text-foreground/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Today's keepsake
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {childName} is{" "}
            <span className="text-primary-deep">
              {years} {years === 1 ? "year" : "years"}, {months} {months === 1 ? "month" : "months"}, {days}{" "}
              {days === 1 ? "day" : "days"}
            </span>{" "}
            old.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-foreground/70">
            That's <strong className="font-semibold text-foreground">{totalDays.toLocaleString()} days</strong> of giggles,
            firsts, and stories worth saving.
          </p>
        </div>

        <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48">
          <div className="absolute inset-0 animate-soft-bounce">
            <img
              src={displaySrc}
              alt={avatarUrl ? `${childName}'s photo` : `Illustration celebrating ${childName}`}
              width={256}
              height={256}
              className="h-full w-full rounded-3xl object-cover shadow-lift"
            />
          </div>

          {canEdit && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChosen}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={uploading}
                    aria-label={avatarUrl ? "Photo options" : "Upload a photo"}
                    title={avatarUrl ? "Photo options" : "Upload a photo"}
                    className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-lift ring-2 ring-background transition hover:scale-105 disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                    <Camera className="h-4 w-4" /> {avatarUrl ? "Change photo" : "Upload photo"}
                  </DropdownMenuItem>
                  {avatarUrl && (
                    <DropdownMenuItem
                      onClick={() => setConfirmRemove(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Remove photo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <AvatarCropDialog
        open={cropOpen}
        src={pendingSrc}
        onClose={closeCrop}
        onApply={handleApplyCrop}
        saving={uploading}
      />

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {childName}'s photo?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll go back to the default illustration. You can upload a new photo any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
