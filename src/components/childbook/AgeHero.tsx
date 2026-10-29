import { useRef, useState } from "react";
import heroImg from "@/assets/hero-child.jpg";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Sparkle, Squiggle, ThemeAccent, Washi } from "./Doodles";
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
      className="relative overflow-hidden rounded-[2rem] bg-sec-hero p-6 shadow-lift sm:p-9 animate-fade-in-up"
    >
      {/* ambient glows + floating doodles */}
      <div className="blob -right-10 -top-12 h-52 w-52 bg-butter/60" aria-hidden />
      <div className="blob -bottom-16 -left-10 h-56 w-56 bg-sky/60" aria-hidden />
      <div className="blob right-1/3 top-1/2 h-40 w-40 bg-coral/30" aria-hidden />
      <Sparkle className="twinkle absolute left-[46%] top-5 h-6 w-6 text-white/90" />
      <Sparkle className="twinkle absolute bottom-6 left-[38%] h-4 w-4 text-butter" />
      <ThemeAccent className="float-med absolute right-[44%] top-1/2 hidden h-6 w-6 text-coral/80 sm:block" />

      <div className="relative grid items-center gap-8 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-foreground/80">
            <Sparkle className="h-3 w-3 text-sec" />
            Today's keepsake
          </div>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] text-plum sm:text-5xl md:text-6xl">
            {childName} is{" "}
            <em className="text-sec-gradient pr-1">
              {years} {years === 1 ? "year" : "years"}
            </em>
            , {months} {months === 1 ? "month" : "months"} &amp; {days} {days === 1 ? "day" : "days"} old.
          </h1>
          <Squiggle className="mt-4 text-white/80" />
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-plum/75">
            That's <strong className="font-bold text-plum">{totalDays.toLocaleString()} days</strong> of giggles,
            firsts, and stories worth saving.
          </p>
        </div>

        {/* Polaroid portrait */}
        <div className="relative mx-auto w-40 sm:w-48 md:w-56">
          <Washi className="-top-3 left-1/2 z-10 -translate-x-1/2 rotate-[-4deg]" tone="coral" />
          <div className="float-slow polaroid rotate-3" style={{ ["--r" as string]: "3deg" }}>
            <img
              src={displaySrc}
              alt={avatarUrl ? `${childName}'s photo` : `Illustration celebrating ${childName}`}
              width={256}
              height={256}
              className="aspect-square w-full object-cover"
            />
            <p className="font-handwritten absolute inset-x-0 bottom-1 text-center text-lg text-plum/80">{childName} ♡</p>
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
                    className="btn-gradient absolute -bottom-3 -right-3 inline-flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-white/80 transition hover:scale-105 disabled:opacity-60"
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
