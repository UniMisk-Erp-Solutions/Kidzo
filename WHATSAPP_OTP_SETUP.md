# WhatsApp OTP (mobile number linking / phone login)

Supabase Auth owns the whole OTP flow (it generates, stores and verifies the 6-digit code).
Our only job is to **deliver** the code over WhatsApp.

## How it is wired (self-hosted Supabase on Coolify, stack `kidzo`)

```
App / website  --PUT /auth/v1/user {phone}-->  GoTrue (supabase-auth)
GoTrue  --Send SMS hook-->  public.send_sms_whatsapp(event jsonb)   (Postgres function)
  GOTRUE_HOOK_SEND_SMS_URI = pg-functions://postgres/public/send_sms_whatsapp
Postgres function  --pg_net HTTP POST-->  OpenWA  /api/sessions/<session>/messages/send-text
OpenWA  -->  WhatsApp message to the user
```

- The hook is the **Postgres function**, not the edge function. `supabase/functions/send-sms-whatsapp`
  is an older/alternative implementation and is **not** what the stack calls.
- OpenWA URL, API key and session id are read from `public.integration_secrets` where `key = 'openwa'`
  (`{"url": "...", "api_key": "...", "session_id": "..."}`). They are never in git.
- The function is owned by `supabase_admin`; changing it needs `psql -U supabase_admin`.
- Migration that holds the current definition:
  `supabase/migrations/20261117120000_send_sms_hook_new_phone.sql`.

## Bug fixed on 2026-11-17: "Missing phone or OTP" (HTTP 400)

When a user links a number for the first time, or changes it, GoTrue puts the number being verified
in `user.new_phone` and leaves `user.phone` empty (or the OLD number). The hook only read `user.phone`,
so linking failed with `Missing phone or OTP` (and a change would have gone to the old number).

Fix: the function now uses `coalesce(nullif(user.new_phone,''), user.phone)`. Login/signup OTPs
(which only have `phone`) still work. The previous definition was saved on the server at
`/home/webadmin/send_sms_whatsapp.backup.sql`.

## Troubleshooting: "code sent" but nothing arrives

Supabase says "sent" as soon as the hook returns `{}`; the WhatsApp request is fire-and-forget.
Look at what OpenWA answered:

```sql
select id, status_code, left(content, 200), created
from net._http_response order by created desc limit 5;
```

| status / message | Meaning | Fix |
|---|---|---|
| `400 Session '...' is not active` | The WhatsApp session is **disconnected / logged out** | Re-link it (below) |
| `401/403` | Wrong OpenWA API key | Update `integration_secrets` key `openwa` |
| `404` | Wrong `session_id` or `url` | Update `integration_secrets` |
| `200`, still no message | Number is not on WhatsApp, or WhatsApp blocked the sender | Use a WhatsApp number; check OpenWA logs |
| Auth log `over_sms_send_rate_limit` (429) | Tapped "Send code" again within ~60 s | Wait a minute |

Auth log: `docker logs supabase-auth-<stack-id>` and look for `run_hook` (`Hook ran successfully`).

## Re-linking the WhatsApp sender session (`kidzopedia`)

1. `POST {OPENWA_URL}/api/sessions/<session_id>/start` (header `x-api-key`) - status goes to `initializing`.
2. Open the OpenWA dashboard, open the session, show the QR code.
3. On the sender phone: WhatsApp -> Settings -> Linked devices -> Link a device, scan the QR.
4. Wait for status `connected`, then tap "Send code" again.

WhatsApp logs linked devices out if the phone is offline for a long time or the device is removed,
so this can happen again. Other OpenWA sessions on the same server belong to other apps - do not touch them.

## Client side

- Website: `src/pages/Settings.tsx` (`startPhoneChange` / `confirmPhoneChange`).
- Flutter app: `lib/screens/account_screen.dart` (`_sendCode` -> `auth.updateUser(phone)`,
  `_confirmCode` -> `auth.verifyOTP(type: OtpType.phoneChange)`).
