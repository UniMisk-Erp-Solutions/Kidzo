// GoTrue "Send SMS" auth hook -> delivers the login/signup OTP over WhatsApp (OpenWA).
//
// Supabase Auth still owns the whole flow (it generates the 6-digit OTP, stores it,
// verifies it and issues the session). This function ONLY delivers the message, so
// phone signup/login/phone-change all work natively and are saved in auth.users.
//
// Deployed with verify_jwt = false: GoTrue authenticates itself with the standard
// webhooks signature (webhook-id / webhook-timestamp / webhook-signature), which we verify.

const OPENWA_URL = Deno.env.get("OPENWA_URL") ?? "https://whatsapp-api.unimisk.com";
const OPENWA_API_KEY = Deno.env.get("OPENWA_API_KEY") ?? "";
const OPENWA_SESSION_ID = Deno.env.get("OPENWA_SESSION_ID") ?? "";
const HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET") ?? ""; // "whsec_<base64>"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

const b64ToBytes = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

/** standard-webhooks: HMAC-SHA256 over `${id}.${timestamp}.${body}` with the base64 secret. */
async function verifySignature(id: string, ts: string, raw: string, header: string): Promise<boolean> {
  if (!HOOK_SECRET || !id || !ts || !header) return false;
  const secret = HOOK_SECRET.startsWith("whsec_") ? HOOK_SECRET.slice(6) : HOOK_SECRET;
  const key = await crypto.subtle.importKey(
    "raw", b64ToBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  const expected = bytesToB64(sig);
  // header looks like: "v1,<sig> v1,<othersig>"
  return header.split(" ").some((part) => part.split(",")[1] === expected);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const raw = await req.text();

    const ok = await verifySignature(
      req.headers.get("webhook-id") ?? "",
      req.headers.get("webhook-timestamp") ?? "",
      raw,
      req.headers.get("webhook-signature") ?? "",
    );
    if (!ok) {
      console.error("send-sms-whatsapp: bad hook signature");
      return json({ error: { http_code: 401, message: "invalid signature" } }, 401);
    }

    const payload = JSON.parse(raw);
    const phone: string = (payload?.user?.phone ?? "").replace(/[^0-9]/g, ""); // E.164 digits, no '+'
    const otp: string = payload?.sms?.otp ?? "";
    if (!phone || !otp) {
      return json({ error: { http_code: 400, message: "missing phone or otp" } }, 400);
    }
    if (!OPENWA_API_KEY || !OPENWA_SESSION_ID) {
      return json({ error: { http_code: 500, message: "WhatsApp sender not configured" } }, 500);
    }

    const text =
      `*${otp}* is your Kidzopedia verification code.\n\n` +
      `Enter it in the app to continue. It expires in 10 minutes.\n\n` +
      `If you didn't request this, you can ignore this message. Never share this code with anyone.`;

    const res = await fetch(
      `${OPENWA_URL}/api/sessions/${OPENWA_SESSION_ID}/messages/send-text`,
      {
        method: "POST",
        headers: { "x-api-key": OPENWA_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ chatId: `${phone}@c.us`, text }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("send-sms-whatsapp: OpenWA send failed", res.status, body);
      // Tell GoTrue so the user sees a real error instead of "code sent" with no message.
      return json({ error: { http_code: 502, message: "Could not deliver the WhatsApp code. Please try again." } }, 502);
    }

    return json({}); // 200 + {} == delivered
  } catch (err) {
    console.error("send-sms-whatsapp error", err);
    return json({ error: { http_code: 500, message: (err as Error).message } }, 500);
  }
});
