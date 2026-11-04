// Emails a family-sharing invite link via Resend.
// SECURITY: the client only sends an invite id. The recipient address and the link come from the
// stored invite row, and only the invite's owner may trigger the email — so this can't be used to
// mail arbitrary addresses or arbitrary links.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  – a Resend API key
//   RESEND_FROM     – sender on a Resend-verified domain, e.g. "Kidzopedia <invites@yourdomain.com>"
//   SITE_URL        – (optional) public app URL used in the link, e.g. https://app.kidzopedia.in
//                     (falls back to the request's Origin header)
// Self-hosted (Coolify): if RESEND_API_KEY / RESEND_FROM are unset, the function reuses the auth
// service's Resend SMTP settings (SMTP_PASS, SMTP_ADMIN_EMAIL, SMTP_SENDER_NAME).
import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** An error that maps straight to an HTTP response. */
class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Invite = {
  id: string;
  child_id: string;
  owner_id: string;
  token: string;
  role: string;
  email: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

type Config = { supabaseUrl: string; serviceKey: string; anonKey: string; resendKey: string; from: string };

function readConfig(): Config {
  // Self-hosted: the auth service already sends through Resend's SMTP relay, whose password is the API key.
  const resendKey = Deno.env.get("RESEND_API_KEY") || (Deno.env.get("SMTP_HOST") === "smtp.resend.com" ? Deno.env.get("SMTP_PASS") : undefined);
  const smtpAdmin = Deno.env.get("SMTP_ADMIN_EMAIL");
  const from = Deno.env.get("RESEND_FROM") || (smtpAdmin ? `${Deno.env.get("SMTP_SENDER_NAME") || "Kidzopedia"} <${smtpAdmin}>` : undefined);
  if (!resendKey || !from) throw new HttpError(500, "Email sending isn't configured yet");
  return {
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
    resendKey,
    from,
  };
}

async function authenticate(req: Request, cfg: Config): Promise<User> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new HttpError(401, "Missing authorization");
  const userClient = createClient(cfg.supabaseUrl, cfg.anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Not authenticated");
  return data.user;
}

/** The invite, if it belongs to this user and can still be used. */
async function loadActiveInvite(admin: SupabaseClient, inviteId: string, userId: string): Promise<Invite & { email: string }> {
  const { data } = await admin
    .from("child_invites")
    .select("id, child_id, owner_id, token, role, email, expires_at, accepted_at, revoked_at")
    .eq("id", inviteId)
    .maybeSingle();
  const invite = data as Invite | null;
  if (!invite || invite.owner_id !== userId) throw new HttpError(404, "Invite not found");
  if (!invite.email) throw new HttpError(400, "This invite has no email address");
  const expired = new Date(invite.expires_at) < new Date();
  if (invite.revoked_at || invite.accepted_at || expired) throw new HttpError(400, "This invite is no longer active");
  return { ...invite, email: invite.email };
}

function inviterName(user: User): string {
  const meta = user.user_metadata ?? {};
  return (meta.full_name as string | undefined) || (meta.name as string | undefined) || user.email || "A family member";
}

function inviteLink(req: Request, token: string): string {
  const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "").replace(/\/+$/, "");
  if (!siteUrl) throw new HttpError(500, "Site URL isn't configured");
  return `${siteUrl}/share/${token}`;
}

function buildEmail(p: { inviter: string; childName: string; role: string; link: string; expiresAt: string }) {
  const roleText = p.role === "editor" ? "view and add memories" : "view memories";
  const expires = new Date(p.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const subject = `${p.inviter} invited you to ${p.childName}'s Kidzopedia`;
  const text =
    `${p.inviter} invited you to ${p.childName}'s journey on Kidzopedia.\n\n` +
    `You'll be able to ${roleText}.\n\nOpen your invite: ${p.link}\n\n` +
    `This link expires on ${expires}. If you weren't expecting this, you can ignore this email.`;
  const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#302447">
  <h2 style="margin:0 0 12px;font-size:22px">You're invited 💛</h2>
  <p style="font-size:15px;line-height:1.5"><b>${esc(p.inviter)}</b> invited you to <b>${esc(p.childName)}</b>'s journey on Kidzopedia.
  You'll be able to ${esc(roleText)}.</p>
  <p style="margin:24px 0"><a href="${esc(p.link)}" style="background:#A78BFA;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;display:inline-block">Open your invite</a></p>
  <p style="font-size:13px;color:#6b6280;line-height:1.5">Or paste this link into your browser:<br>${esc(p.link)}</p>
  <p style="font-size:12px;color:#6b6280">This link expires on ${esc(expires)}. If you weren't expecting this, you can ignore this email.</p>
</div>`;
  return { subject, text, html };
}

async function sendWithResend(cfg: Config, to: string, email: { subject: string; text: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: cfg.from, to: [to], ...email }),
  });
  if (res.ok) return;
  const out = await res.json().catch(() => ({}));
  console.error("send-family-invite: Resend error", res.status, out);
  throw new HttpError(502, out?.message || "Couldn't send the email");
}

async function handle(req: Request): Promise<Response> {
  const cfg = readConfig();
  const user = await authenticate(req, cfg);

  const { invite_id } = await req.json().catch(() => ({}));
  if (!invite_id) throw new HttpError(400, "Missing invite");

  const admin = createClient(cfg.supabaseUrl, cfg.serviceKey);
  const invite = await loadActiveInvite(admin, invite_id, user.id);
  const { data: child } = await admin.from("child_profiles").select("name").eq("id", invite.child_id).maybeSingle();

  const email = buildEmail({
    inviter: inviterName(user),
    childName: child?.name ?? "their little one",
    role: invite.role,
    link: inviteLink(req, invite.token),
    expiresAt: invite.expires_at,
  });
  await sendWithResend(cfg, invite.email, email);
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    return await handle(req);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("send-family-invite error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
