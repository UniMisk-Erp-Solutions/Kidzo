import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Crown, Link2, Loader2, LogOut, MailPlus, RotateCw, ShieldCheck, Trash2, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaveSharedChild } from "@/hooks/useChildren";
import { useInvites, useShares } from "@/hooks/useShares";
import { useFeatureGuard, isPlanLockedError } from "@/hooks/useFeatureGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const generateToken = () => {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
};

const Family = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: child } = useActiveChild();
  const qc = useQueryClient();
  const { data: shares = [] } = useShares(child?.id);
  const { data: invites = [] } = useInvites(child?.id);
  const leaveShare = useLeaveSharedChild();
  const guard = useFeatureGuard();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [creating, setCreating] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const childName = child?.name ?? "Your child";
  const isOwner = !!child && !!user && child.user_id === user.id;

  const createInvite = async () => {
    if (!child || !user) return;
    if (!guard("family_invites", "Family invites")) return;
    setCreating(true);
    const token = generateToken();
    const { error } = await supabase.from("child_invites").insert({
      child_id: child.id,
      owner_id: user.id,
      token,
      role,
      email: email.trim() || null,
    });
    setCreating(false);
    if (error) {
      toast.error(isPlanLockedError(error.message) ? "Family invites are a paid feature — upgrade to invite family." : "Couldn't create invite");
      return;
    }
    setEmail("");
    qc.invalidateQueries({ queryKey: ["invites"] });
    const link = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.success("Invite created");
    }
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast(link);
    }
  };

  const revokeInvite = async (id: string) => {
    const { error } = await supabase
      .from("child_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error("Couldn't revoke");
    toast.success("Invite revoked");
    qc.invalidateQueries({ queryKey: ["invites"] });
  };

  const resendInvite = async (invite: typeof invites[number]) => {
    if (!child || !user) return;
    setResendingId(invite.id);
    // Revoke the old token then create a fresh one with same role/email.
    const newToken = generateToken();
    const [{ error: revokeError }, { error: insertError }] = await Promise.all([
      supabase
        .from("child_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", invite.id),
      supabase.from("child_invites").insert({
        child_id: child.id,
        owner_id: user.id,
        token: newToken,
        role: invite.role,
        email: invite.email,
      }),
    ]);
    setResendingId(null);
    if (revokeError || insertError) {
      toast.error("Couldn't resend invite");
      return;
    }
    qc.invalidateQueries({ queryKey: ["invites"] });
    const link = `${window.location.origin}/share/${newToken}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Fresh link copied to clipboard");
    } catch {
      toast.success("Fresh invite created");
    }
  };

  const removeShare = async (id: string) => {
    const { error } = await supabase.from("child_shares").delete().eq("id", id);
    if (error) return toast.error("Couldn't remove access");
    toast.success("Access removed");
    qc.invalidateQueries({ queryKey: ["shares"] });
  };

  const updateRole = async (id: string, newRole: "viewer" | "editor") => {
    const { error } = await supabase.from("child_shares").update({ role: newRole }).eq("id", id);
    if (error) return toast.error("Couldn't update role");
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["shares"] });
  };

  const handleLeave = async () => {
    if (!child) return;
    if (!confirm(`Leave ${childName}'s shared book? You won't see new memories until you're invited again.`)) return;
    try {
      await leaveShare.mutateAsync(child.id);
      toast.success(`You left ${childName}'s book`);
      navigate("/home", { replace: true });
    } catch {
      toast.error("Couldn't leave");
    }
  };

  // Find this user's own share row (for shared-with-me display)
  const myShare = !isOwner ? shares.find((s) => s.shared_with_user_id === user?.id) : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={childName} />

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-6 md:max-w-4xl md:py-10">
        <header className="animate-fade-in-up">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
            <Users className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Family sharing</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {isOwner
              ? `Invite a co-parent or grandparent to ${childName}'s journey.`
              : `You're a guest in ${childName}'s journey.`}
          </p>
        </header>

        {/* Shared-with-me view */}
        {!isOwner && myShare && (
          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 animate-fade-in-up">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/20 text-success">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your access</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    You're a{" "}
                    <span className="font-semibold text-foreground">
                      {myShare.role === "editor" ? "co-editor" : "viewer"}
                    </span>{" "}
                    on {childName}'s book.
                    {myShare.accepted_at && (
                      <> Joined {format(new Date(myShare.accepted_at), "MMM d, yyyy")}.</>
                    )}
                  </p>
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {myShare.role === "editor"
                      ? "You can add and edit memories, achievements, and records."
                      : "You can view everything but only the owner can make changes."}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveShare.isPending}>
                {leaveShare.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Leave shared book
              </Button>
            </div>
          </section>
        )}

        {/* Owner-only: create invite */}
        {isOwner && (
          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-foreground">Send a new invite</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Generates a private link you can share by message or email. Expires in 14 days.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <Input
                type="email"
                placeholder="their@email.com (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />
              <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">View only</SelectItem>
                  <SelectItem value="editor">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="warm" onClick={createInvite} disabled={creating || !child}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                Create invite
              </Button>
            </div>
          </section>
        )}

        {/* Owner-only: pending invites */}
        {isOwner && (
          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-foreground">Pending invites</h2>
            {invites.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted-foreground">No pending invites.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {invites.map((i) => {
                  const expired = new Date(i.expires_at).getTime() < Date.now();
                  const resending = resendingId === i.id;
                  return (
                    <li
                      key={i.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/30 text-accent-foreground">
                        <Link2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium text-foreground">
                          {i.email ?? "Shareable link"}
                          <span
                            className={cn(
                              "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              i.role === "editor"
                                ? "bg-secondary/30 text-secondary"
                                : "bg-primary/25 text-primary-deep",
                            )}
                          >
                            {i.role === "editor" ? "Editor" : "Viewer"}
                          </span>
                        </div>
                        <div className="text-[12px] text-muted-foreground">
                          {expired
                            ? `Expired ${formatDistanceToNow(new Date(i.expires_at), { addSuffix: true })}`
                            : `Expires ${format(new Date(i.expires_at), "MMM d, yyyy")}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(i.token)}
                          disabled={expired}
                        >
                          <Copy className="h-4 w-4" /> Copy link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInvite(i)}
                          disabled={resending}
                          title="Generate a fresh link & expire this one"
                        >
                          {resending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCw className="h-4 w-4" />
                          )}
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revokeInvite(i.id)}
                          aria-label="Revoke"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* People with access — visible to owner; for shared users we show owner badge */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-foreground">People with access</h2>

          {/* Owner row (always show) */}
          <ul className="mt-3 space-y-2">
            <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 text-primary-deep">
                <Crown className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-foreground">
                  {isOwner ? "You" : "The owner"}
                  <span className="ml-2 rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-deep">
                    Owner
                  </span>
                </div>
                <div className="text-[12px] text-muted-foreground">Full control of this book</div>
              </div>
            </li>

            {shares.length === 0 && isOwner ? (
              <li className="rounded-2xl border border-dashed border-border bg-background/40 p-4 text-center text-[13px] text-muted-foreground">
                No one else has access yet. You're the sole keeper of these memories.
              </li>
            ) : (
              shares.map((s) => {
                const isMe = s.shared_with_user_id === user?.id;
                return (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/20 text-success">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-foreground">
                        {isMe ? "You" : s.invite_email ?? "Family member"}
                        <span
                          className={cn(
                            "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            s.role === "editor"
                              ? "bg-secondary/30 text-secondary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {s.role === "editor" ? "Editor" : "Viewer"}
                        </span>
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        Joined {s.accepted_at ? format(new Date(s.accepted_at), "MMM d, yyyy") : "—"}
                      </div>
                    </div>

                    {isOwner ? (
                      <>
                        <Select
                          value={s.role}
                          onValueChange={(v) => updateRole(s.id, v as "viewer" | "editor")}
                        >
                          <SelectTrigger className="h-9 w-[130px] rounded-xl text-[13px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">View only</SelectItem>
                            <SelectItem value="editor">Can edit</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeShare(s.id)}
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : isMe ? (
                      <Button variant="ghost" size="sm" onClick={handleLeave}>
                        <LogOut className="h-4 w-4" /> Leave
                      </Button>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Family;
