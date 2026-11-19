import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, CreditCard, Loader2, Lock, LogOut, Plus, ShieldAlert, Smartphone, Sparkles, UserRound, Users } from "lucide-react";
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
import { PronounsSelect } from "@/components/childbook/PronounsSelect";
import { PhoneField, toE164 } from "@/components/childbook/PhoneField";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAddChildGuard } from "@/hooks/useAddChildGuard";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useActiveChildId, useLeaveSharedChild, useUpdateChild } from "@/hooks/useChildren";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme, THEMES, DEFAULT_THEME, type AppTheme } from "@/hooks/useTheme";
import { ThemePicker } from "@/components/childbook/ThemePicker";
import { Palette } from "lucide-react";
import { ThemePreview } from "@/components/childbook/ThemePreview";

const settingsSections = [
  { id: "plan-billing", label: "Plan & billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "children", label: "Your children", icon: Users },
  { id: "family-sharing", label: "Family sharing", icon: Users, ownerOnly: true },
  { id: "child-profile", label: "Child profile", icon: UserRound },
  { id: "change-password", label: "Password", icon: Lock },
  { id: "mobile-number", label: "Mobile number", icon: Smartphone },
  { id: "reset-password", label: "Reset password", icon: Lock },
  { id: "account-deletion", label: "Account deletion", icon: ShieldAlert },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { planName, planSlug, loading: planLoading } = useEntitlements();
  const canAddChild = useAddChildGuard();
  const { data: child, isLoading } = useActiveChild();
  const { activeId, children } = useActiveChildId();
  const activeChild = children.find((c) => c.id === activeId) ?? child;
  const isOwner = !!activeChild && !!user && activeChild.user_id === user.id;
  const updateChild = useUpdateChild();
  const { theme, setTheme, startPreview, stopPreview, reset } = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewThemeLocal] = useState<AppTheme>("explorer");

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [pronouns, setPronouns] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  // Reset link always goes to user.email (locked) — no editable email state.
  const [sendingReset, setSendingReset] = useState(false);

  // Mobile number change (WhatsApp OTP)
  const [newDial, setNewDial] = useState("91");
  const [newPhoneLocal, setNewPhoneLocal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
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
    if (!user?.email) return;
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from your current password");
      return;
    }
    setChangingPwd(true);

    // 1) Verify the CURRENT password against the backend (Supabase auth re-authenticates
    //    the same user). Only if this succeeds are we allowed to set a new password.
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      setChangingPwd(false);
      toast.error("Current password is incorrect");
      return;
    }

    // 2) Current password confirmed -> set the new one.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPwd(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated ✨");
  };

  // ---- Mobile number change (verified over WhatsApp) ----------------------
  // Supabase sends a 6-digit code to the NEW number (delivered by our WhatsApp hook).
  // Verifying it with type "phone_change" updates auth.users.phone on the SAME user id,
  // so every child, memory and document stays mapped to the account exactly as before.
  const startPhoneChange = async () => {
    const next = toE164(newDial, newPhoneLocal);
    if (newPhoneLocal.replace(/[^0-9]/g, "").length < 6) {
      toast.error("Enter a valid WhatsApp number");
      return;
    }
    if (next === user?.phone) {
      toast.error("That's already your current number");
      return;
    }
    setPhoneSaving(true);
    const { error } = await supabase.auth.updateUser({ phone: next });
    setPhoneSaving(false);
    if (error) return toast.error(error.message);
    setPhoneOtpSent(true);
    toast.success("Code sent on WhatsApp 💬", { description: `Check WhatsApp on ${next}` });
  };

  const confirmPhoneChange = async () => {
    const next = toE164(newDial, newPhoneLocal);
    setPhoneSaving(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: next,
      token: phoneOtp,
      type: "phone_change",
    });
    setPhoneSaving(false);
    if (error) return toast.error(error.message);
    setPhoneOtpSent(false);
    setPhoneOtp("");
    setNewPhoneLocal("");
    toast.success("Mobile number updated ✨", { description: "All your data stays exactly where it was." });
  };

  // The reset link ALWAYS goes to the email this account signed up / logs in with.
  // It is never taken from an editable field, so it can't be pointed elsewhere.
  const handleSendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
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

      <main className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 md:py-10 xl:grid xl:grid-cols-[12rem_minmax(0,1fr)] xl:items-start xl:gap-x-8 xl:px-10">
        <header className="mb-6 xl:col-start-2 xl:row-start-1">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your family, scrapbook themes, billing, and account.</p>
        </header>

        <nav aria-label="Settings sections" className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-soft xl:sticky xl:top-[calc(var(--topbar-h,72px)+1.5rem)] xl:col-start-1 xl:row-start-2 xl:mb-0 xl:flex-col xl:overflow-visible">
          {settingsSections.filter((item) => !item.ownerOnly || isOwner).map(({ id, label, icon: Icon }) => (
            <a key={id} href={"#" + id} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-primary/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Icon className="size-4 shrink-0 text-primary-deep" aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start xl:col-start-2 xl:row-start-2">

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start">
            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
              {/* Plan & billing */}
              <section id="plan-billing" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">Plan &amp; billing</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      You're on the{" "}
                      <span className="font-semibold text-foreground">
                        {planLoading ? "…" : planName ?? "Free"}
                      </span>{" "}
                      plan.
                      {planSlug !== "premium" && " Upgrade to unlock more children, PDF export, sharing and more."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="warm" className="flex-1" onClick={() => navigate("/pricing-plans")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {planSlug === "premium" ? "View plans" : "Upgrade plan"}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/billing")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing &amp; invoices
                  </Button>
                </div>
              </section>
            {/* Your children */}
            <section id="children" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
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
                  onClick={() => canAddChild() && navigate("/onboarding?addChild=1")}
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
              <section id="family-sharing" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
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
              {/* Change password */}
              <section id="change-password" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="mb-1 text-lg font-semibold text-foreground">Change password</h2>
                <p className="mb-4 text-sm text-muted-foreground">Use a strong password you don't reuse elsewhere.</p>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="curp">Current password</Label>
                    <Input
                      id="curp"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="h-11 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      We verify this before allowing a new password.
                    </p>
                  </div>
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
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={changingPwd || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {changingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Update password
                  </Button>
                </form>
              </section>
            </div>
            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
              {/* Appearance & Themes */}
              <section id="appearance" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
                    <Palette className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-semibold text-foreground">Appearance &amp; Themes</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Choose the look for{" "}
                      <span className="font-medium text-foreground">{activeChild.name}</span>&apos;s scrapbook. Every theme is
                      available to everyone, and each child profile remembers its own.
                    </p>
                  </div>
                </div>
                <ThemePicker
                  theme={theme}
                  onSelect={(t) => {
                    setTheme(t);
                    toast.success(`Theme: ${THEMES.find((x) => x.id === t)?.name}`);
                  }}
                  onPreview={(t) => {
                    setPreviewThemeLocal(t);
                    setPreviewOpen(true);
                    startPreview(t);
                  }}
                  onReset={() => {
                    reset();
                    toast.success(`Restored ${THEMES.find((x) => x.id === DEFAULT_THEME)?.name}`);
                  }}
                />
              </section>
              <section id="child-profile" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
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
                    <div className={!isOwner ? "pointer-events-none opacity-60" : undefined}>
                      <PronounsSelect id="c-pronouns" value={pronouns} onChange={setPronouns} />
                    </div>
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
            </div>
          </div>

          {/* Sign out — phones only; larger screens have it in the top bar */}
          <section id="sign-out" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 sm:hidden">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Sign out</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              You'll need to sign in again to see {activeChild.name}'s memories.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll need to sign in again to see {activeChild.name}'s memories.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay signed in</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await signOut();
                      toast.success("Signed out — see you soon!");
                      navigate("/auth", { replace: true });
                    }}
                  >
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>

          {/* Forgot password */}
          <section id="reset-password" className="lg:flex lg:flex-col lg:self-stretch min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Forgot password</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              We'll email a secure reset link to your account email. For your security this address is locked and
              can't be changed.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-1 lg:items-center lg:pb-4">
              <div className="relative flex-1">
                <Input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                  aria-label="Account email (locked)"
                  className="h-11 w-full cursor-not-allowed rounded-xl bg-muted pr-10 text-muted-foreground"
                />
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button variant="outline" onClick={handleSendReset} disabled={sendingReset || !user?.email}>
                {sendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send reset link
              </Button>
            </div>
          </section>

          {/* Mobile number */}
          <section id="mobile-number" className="lg:self-stretch min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Mobile number</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {user?.phone
                    ? <>Current: <span className="font-medium text-foreground">+{String(user.phone).replace(/^\+/, "")}</span></>
                    : "No mobile number linked yet."}
                </p>
              </div>
            </div>

            {!phoneOtpSent ? (
              <div className="space-y-3">
                <Label htmlFor="newphone">{user?.phone ? "New WhatsApp number" : "Add a WhatsApp number"}</Label>
                <PhoneField
                  id="newphone"
                  dial={newDial}
                  local={newPhoneLocal}
                  onDialChange={setNewDial}
                  onLocalChange={setNewPhoneLocal}
                  disabled={phoneSaving}
                />
                <Button variant="outline" onClick={startPhoneChange} disabled={phoneSaving || !newPhoneLocal}>
                  {phoneSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Send code on WhatsApp
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="phoneotp">Enter the 6-digit code</Label>
                <Input
                  id="phoneotp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••••"
                  className="h-14 rounded-xl text-center font-mono text-2xl tracking-[0.5em]"
                />
                <p className="text-xs text-muted-foreground">
                  Sent on WhatsApp to{" "}
                  <span className="font-medium text-foreground">{toE164(newDial, newPhoneLocal)}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="warm" onClick={confirmPhoneChange} disabled={phoneSaving || phoneOtp.length !== 6}>
                    {phoneSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirm new number
                  </Button>
                  <Button variant="ghost" onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); }} disabled={phoneSaving}>
                    Cancel
                  </Button>
                  <Button variant="ghost" onClick={startPhoneChange} disabled={phoneSaving}>
                    Resend code
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Danger zone */}
          <section id="account-deletion" className="min-w-0 scroll-mt-[calc(var(--topbar-h,72px)+1rem)] rounded-3xl border border-destructive/40 bg-destructive/5 p-6 lg:col-span-2">
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
        </div>
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
