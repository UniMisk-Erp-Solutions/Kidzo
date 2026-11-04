import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Delivery = {
  inviteId: string;
  token: string;
  /** The address stored on the invite; when present the invite is also emailed. */
  email: string | null;
  /** True when this replaces an earlier invite (Resend). */
  fresh: boolean;
};

type EmailResult = { ok: true } | { ok: false; reason: string | null };

/** The message the function put in its error response, if there was one. */
async function serverReason(error: unknown): Promise<string | null> {
  const res = (error as { context?: unknown } | null)?.context;
  if (!(res instanceof Response)) return null;
  try {
    const body = await res.clone().json();
    // The function answers { error }; the edge runtime itself (e.g. a function that isn't deployed) answers { msg }.
    const reason = body?.error ?? body?.msg ?? body?.message;
    return typeof reason === "string" ? reason : null;
  } catch {
    return null;
  }
}

/** Asks the server to email an invite to the address stored on it. */
async function emailInvite(inviteId: string): Promise<EmailResult> {
  const { data, error } = await supabase.functions.invoke("send-family-invite", { body: { invite_id: inviteId } });
  if (!error && data?.ok) return { ok: true };
  const reason = await serverReason(error);
  console.error("send-family-invite failed:", reason ?? error ?? data);
  return { ok: false, reason };
}

function announce({ email, fresh }: Delivery, emailed: EmailResult | null, copied: boolean) {
  const subject = fresh ? "Fresh invite" : "Invite";
  const copiedNote = copied ? " — the link is copied, share it yourself" : "";
  if (emailed === null) {
    return toast.success(copied ? `${fresh ? "Fresh link" : "Invite link"} copied to clipboard` : `${subject} created`);
  }
  if (emailed.ok === true) return toast.success(`${subject} emailed to ${email}${copied && !fresh ? " — link copied too" : ""}`);
  const why = emailed.reason ? ` (${emailed.reason})` : "";
  return toast.warning(`${subject} created, but the email couldn't be sent${why}${copiedNote}`);
}

/** Copies the invite link, emails it when there is an address, and tells the user what happened. */
async function deliverInvite(d: Delivery) {
  const link = `${window.location.origin}/share/${d.token}`;
  const copied = await navigator.clipboard.writeText(link).then(() => true, () => false);
  const emailed = d.email ? await emailInvite(d.inviteId) : null;
  announce(d, emailed, copied);
}

export const useInviteDelivery = () => deliverInvite;
