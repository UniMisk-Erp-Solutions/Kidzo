import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Loader2, LogOut, Plus, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useActiveChildId, useLeaveSharedChild, useUpdateChild } from "@/hooks/useChildren";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { Check, Eye, Palette, RotateCcw } from "lucide-react";
import { ThemePreview } from "@/components/childbook/ThemePreview";
import { Slider } from "@/components/ui/slider";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: child, isLoading } = useActiveChild();
  const { activeId, children } = useActiveChildId();
  const activeChild = children.find((c) => c.id === activeId) ?? child;
  const isOwner = !!activeChild && !!user && activeChild.user_id === user.id;
  const updateChild = useUpdateChild();
  const { theme, setTheme, intensity, setIntensity, startPreview, stopPreview, reset, childId } = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewThemeLocal] = useState<AppTheme>("dream");

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [pronouns, setPronouns] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const [resetEmail, setResetEmail] = useState(user?.email ?? "");
  const [sendingReset, setSendingReset] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leaveShared = useLeaveSharedChild();

  useEffect(() => {
    if (activeChild) {
      setName(activeChild.name);
      setDob(new Date(activeChild.dob));
      setPronouns(activeChild.pronouns ?? "");
    }
  }, [activeChild]);

  useEffect(() => {
    if (user?.email && !resetEmail) setResetEmail(user.email);
  }, [user, resetEmail]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !dob) return;
    setSavingProfile(true);
    try {
      let avatar_url: string | null | undefined = undefined;
      if (avatarFile && user) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${activeChild.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("memory-photos").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("memory-photos").getPublicUrl(path);
        avatar_url = data.publicUrl;
      }
      await updateChild.mutateAsync({
        id: activeChild.id,
        name,
        dob: format(dob, "yyyy-MM-dd"),
        pronouns: pronouns || null,
        ...(avatar_url !== undefined ? { avatar_url } : {}),
      });
      toast.success("Profile updated 🌱");
      setAvatarFile(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPwd(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated ✨");
  };

  const handleSendReset = async () => {
    if (!resetEmail) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email for a reset link 💌");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Your account has been deleted");
      await signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't delete account");
    } finally {
      setDeleting(false);
    }
  };


  if (isLoading || !activeChild) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary-deep" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <TopBar childName={activeChild.name} />

      <main className="mx-auto max-w-2xl px-6 py-6 md:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

        {/* Appearance / Theme */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
              <Palette className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pick a design theme for{" "}
                <span className="font-medium text-foreground">{activeChild.name}</span>. Each child
                profile remembers its own look.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewThemeLocal("dream");
                setPreviewOpen(true);
                startPreview("dream");
              }}
            >
              <Eye className="h-4 w-4" /> Preview Dream theme
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                toast.success("Restored Legacy theme");
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset to Legacy
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {([
              {
                id: "legacy" as AppTheme,
                name: "Legacy",
                tagline: "Warm cream & teal — the original look.",
                swatches: ["#FEFBF3", "#A8C5BA", "#E8A087", "#D4B896", "#3E3E42"],
              },
              {
                id: "dream" as AppTheme,
                name: "Soft Pastel Dream",
                tagline: "Powdered lilac, whisper pink & butter cloud.",
                swatches: ["#FFFCFF", "#D4C5F0", "#FCE4EC", "#FFF0D4", "#5D4E7C"],
              },
            ]).map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    toast.success(`Theme: ${t.name}`);
                  }}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-primary-deep bg-primary/10 shadow-soft"
                      : "border-border bg-background/40 hover:border-primary/60 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    {active && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-deep text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {t.swatches.map((c) => (
                      <span
                        key={c}
                        className="h-6 w-6 rounded-full border border-border"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.tagline}</div>
                </button>
              );
            })}
          </div>

          {theme === "dream" && (
            <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Dream intensity</div>
                  <div className="text-xs text-muted-foreground">
                    Slide to darken the pastel palette to your taste.
                  </div>
                </div>
                <span className="text-xs font-medium text-primary-deep">
                  {Math.round(intensity * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round(intensity * 100)]}
                min={0}
                max={100}
                step={1}
                aria-label="Dream theme intensity"
                onValueChange={(v) => setIntensity((v[0] ?? 0) / 100)}
                onKeyDown={(e) => {
                  // Radix handles ArrowLeft/Right/Up/Down/Home/End/PageUp/PageDown.
                  // Add Enter to cycle through soft → mid → deep → soft.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const pct = Math.round(intensity * 100);
                    const next = pct < 50 ? 0.5 : pct < 100 ? 1 : 0;
                    setIntensity(next);
                  }
                }}
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>Soft</span>
                <span className="text-muted-foreground/80">
                  ← / → to adjust · Enter to cycle
                </span>
                <span>Deep</span>
              </div>
            </div>
          )}
        </section>

        {/* Your children */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your children</h2>
              <p className="text-sm text-muted-foreground">
                Manage all the little ones in your Kidzopedia.
              </p>
            </div>
            <Button
              type="button"
              variant="warm"
              size="sm"
              onClick={() => navigate("/onboarding?addChild=1")}
            >
              <Plus className="h-4 w-4" /> Add child
            </Button>
          </div>
          <ul className="divide-y divide-border rounded-2xl border border-border/60 bg-background/40">
            {children.map((c) => {
              const owned = c.user_id === user?.id;
              const isActive = c.id === activeId;
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="h-9 w-9 rounded-full border border-border object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 text-sm font-semibold text-primary-deep">
                        {c.name.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {c.name}
                        {isActive && <span className="ml-2 text-[11px] font-medium text-primary-deep">• active</span>}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {owned ? "Your child" : "Shared with you"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          localStorage.setItem("childbook:activeChildId", c.id);
                          window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
                          toast.success(`Switched to ${c.name}`);
                        }}
                      >
                        Switch
                      </Button>
                    )}
                    {!owned && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={leaving}
                          >
                            <LogOut className="h-3.5 w-3.5" /> Leave
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leave {c.name}'s book?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You'll lose access to {c.name}'s memories, milestones and records. The
                              owner can re-invite you any time.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                setLeaving(true);
                                try {
                                  await leaveShared.mutateAsync(c.id);
                                  toast.success(`You've left ${c.name}'s book`);
                                  if (isActive) {
                                    const remaining = children.filter((x) => x.id !== c.id);
                                    if (remaining.length) {
                                      const next = remaining.find((x) => x.user_id === user?.id) ?? remaining[0];
                                      localStorage.setItem("childbook:activeChildId", next.id);
                                    } else {
                                      localStorage.removeItem("childbook:activeChildId");
                                    }
                                    window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
                                  }
                                } catch (err: any) {
                                  toast.error(err?.message ?? "Couldn't leave");
                                } finally {
                                  setLeaving(false);
                                }
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, leave
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Family sharing */}
        {isOwner && (
          <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Family sharing</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Invite a co-parent or grandparent. Choose whether they can view only or also
                    add memories &amp; milestones.
                  </p>
                </div>
              </div>
              <Button type="button" variant="warm" size="sm" onClick={() => navigate("/family")}>
                Manage
              </Button>
            </div>
          </section>
        )}

        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Child profile</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {isOwner ? "Update your child's details." : "View only — this child is shared with you."}
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isOwner}
                    className={cn("h-11 w-full justify-start rounded-xl text-left font-normal", !dob && "text-muted-foreground")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {dob ? format(dob, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={setDob}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    defaultMonth={dob ?? new Date()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-pronouns">Pronouns</Label>
              <Input
                id="c-pronouns"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                disabled={!isOwner}
                placeholder="she/her, he/him, they/them"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-avatar">Avatar</Label>
              <div className="flex items-center gap-3">
                {activeChild.avatar_url && (
                  <img src={activeChild.avatar_url} alt="" className="h-14 w-14 rounded-full border border-border object-cover" />
                )}
                <Input
                  id="c-avatar"
                  type="file"
                  accept="image/*"
                  disabled={!isOwner}
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {isOwner && (
              <Button type="submit" variant="warm" className="w-full" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            )}
          </form>
        </section>

        {/* Change password */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Change password</h2>
          <p className="mb-4 text-sm text-muted-foreground">Use a strong password you don't reuse elsewhere.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="np">New password</Label>
              <Input
                id="np"
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp">Confirm new password</Label>
              <Input
                id="cp"
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" variant="default" className="w-full" disabled={changingPwd}>
              {changingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </section>

        {/* Forgot password */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Forgot password</h2>
          <p className="mb-4 text-sm text-muted-foreground">We'll email you a secure reset link.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="h-11 flex-1 rounded-xl"
            />
            <Button variant="outline" onClick={handleSendReset} disabled={sendingReset || !resetEmail}>
              {sendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send reset link
            </Button>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="mb-1 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Danger zone</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Deleting your account permanently removes your profile, your owned children, and all their memories,
            achievements, and documents. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all data you own. People you've shared children with
                  will lose access. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>

      <BottomNav />

      <ThemePreview
        open={previewOpen}
        theme={previewTheme}
        onClose={() => {
          setPreviewOpen(false);
          stopPreview();
        }}
        onApply={() => {
          setTheme(previewTheme);
          setPreviewOpen(false);
          stopPreview();
          toast.success(`Theme applied for ${activeChild.name}`);
        }}
      />
    </div>
  );
};

export default Settings;
