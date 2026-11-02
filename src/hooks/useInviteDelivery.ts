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

/** Asks the server to email an invite to the address stored on it. Returns whether it was sent. */
async function emailInvite(inviteId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("send-family-invite", { body: { invite_id: inviteId } });
  if (error || !data?.ok) {
    console.error("send-family-invite failed:", error ?? data);
    return false;
  }
  return true;
}

function announce({ email, fresh }: Delivery, emailed: boolean | null, copied: boolean) {
  const subject = fresh ? "Fresh invite" : "Invite";
  const copiedNote = copied ? " — the link is copied, share it yourself" : "";
  if (emailed === true) return toast.success(`${subject} emailed to ${email}${copied && !fresh ? " — link copied too" : ""}`);
  if (emailed === false) return toast.warning(`${subject} created, but the email couldn't be sent${copiedNote}`);
  return toast.success(copied ? `${fresh ? "Fresh link" : "Invite link"} copied to clipboard` : `${subject} created`);
}

/** Copies the invite link, emails it when there is an address, and tells the user what happened. */
async function deliverInvite(d: Delivery) {
  const link = `${window.location.origin}/share/${d.token}`;
  const copied = await navigator.clipboard.writeText(link).then(() => true, () => false);
  const emailed = d.email ? await emailInvite(d.inviteId) : null;
  announce(d, emailed, copied);
}

export const useInviteDelivery = () => deliverInvite;
