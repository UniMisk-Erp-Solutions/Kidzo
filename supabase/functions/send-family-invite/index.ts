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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM = Deno.env.get("RESEND_FROM");
    if (!RESEND_API_KEY || !RESEND_FROM) return json({ error: "Email sending isn't configured yet" }, 500);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const user = userData.user;

    const { invite_id } = await req.json().catch(() => ({}));
    if (!invite_id) return json({ error: "Missing invite" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: invite } = await admin
      .from("child_invites")
      .select("id, child_id, owner_id, token, role, email, expires_at, accepted_at, revoked_at")
      .eq("id", invite_id)
      .maybeSingle();
    if (!invite || invite.owner_id !== user.id) return json({ error: "Invite not found" }, 404);
    if (!invite.email) return json({ error: "This invite has no email address" }, 400);
    if (invite.revoked_at || invite.accepted_at || new Date(invite.expires_at) < new Date()) {
      return json({ error: "This invite is no longer active" }, 400);
    }

    const { data: child } = await admin.from("child_profiles").select("name").eq("id", invite.child_id).maybeSingle();
    const childName = child?.name ?? "their little one";
    const inviter =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      "A family member";

    const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "").replace(/\/+$/, "");
    if (!siteUrl) return json({ error: "Site URL isn't configured" }, 500);
    const link = `${siteUrl}/share/${invite.token}`;
    const roleText = invite.role === "editor" ? "view and add memories" : "view memories";
    const expires = new Date(invite.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const subject = `${inviter} invited you to ${childName}'s Kidzopedia`;
    const text =
      `${inviter} invited you to ${childName}'s journey on Kidzopedia.\n\n` +
      `You'll be able to ${roleText}.\n\nOpen your invite: ${link}\n\n` +
      `This link expires on ${expires}. If you weren't expecting this, you can ignore this email.`;
    const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#302447">
  <h2 style="margin:0 0 12px;font-size:22px">You're invited 💛</h2>
  <p style="font-size:15px;line-height:1.5"><b>${esc(inviter)}</b> invited you to <b>${esc(childName)}</b>'s journey on Kidzopedia.
  You'll be able to ${esc(roleText)}.</p>
  <p style="margin:24px 0"><a href="${esc(link)}" style="background:#A78BFA;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;display:inline-block">Open your invite</a></p>
  <p style="font-size:13px;color:#6b6280;line-height:1.5">Or paste this link into your browser:<br>${esc(link)}</p>
  <p style="font-size:12px;color:#6b6280">This link expires on ${esc(expires)}. If you weren't expecting this, you can ignore this email.</p>
</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: [invite.email], subject, html, text }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("send-family-invite: Resend error", res.status, out);
      return json({ error: out?.message || "Couldn't send the email" }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error("send-family-invite error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
