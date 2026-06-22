# Kidzopedia — Razorpay payments

Real Razorpay checkout with **instant plan activation**. The price is always computed
on the server from the `plans` table — the client only sends the plan slug + cycle.

## Flow
1. Pricing → `/checkout?plan=<slug>&cycle=<monthly|yearly>`
2. Frontend calls edge fn **`razorpay-create-order`** → creates a Razorpay order + a pending `invoices` row, returns the order + the **public** key id.
3. Razorpay Checkout opens; on success the frontend calls **`razorpay-verify-payment`** → verifies the HMAC signature → activates the subscription instantly (full reload so entitlements refresh).
4. **`razorpay-webhook`** is a server-to-server backstop (payment.captured / order.paid) that activates even if the user closes the tab. Idempotent.

DB: `activate_paid_subscription()` marks the invoice paid + upserts `user_subscriptions` (period end = now + 1 month/year). See migration `supabase/migrations/20260620120000_razorpay_payments.sql`.

## Secrets (NOT in git)
Set as env vars on the self-hosted edge-functions container
(`supabase-edge-functions-<uuid>`), loaded from the stack `.env`:

| Var | What |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_…` (test) or `rzp_live_…` (production) |
| `RAZORPAY_KEY_SECRET` | matching secret |
| `RAZORPAY_WEBHOOK_SECRET` | the secret you set on the Razorpay webhook |

The frontend needs **no** Razorpay env var — the key id is returned by `create-order`.

## Switch test ⇄ live
Edit the 3 vars on the edge-functions container env, then recreate it. On Coolify:
**kidzo service → Environment Variables → edit the 3 → Redeploy** (or update the stack
`.env` and `docker compose up -d --no-deps --force-recreate supabase-edge-functions`).
No code change and no frontend redeploy is needed to switch modes.

> Persistence: if you do a **full Coolify redeploy** that regenerates `.env`, re-add the
> 3 vars (Coolify UI is the durable place).

## Webhook
Register in the Razorpay dashboard (**test and live each have their own webhook + secret**):
- URL: `https://kidzo-api.byteosaurus.com/functions/v1/razorpay-webhook`
- Events: `payment.captured`, `order.paid`
- Secret: must match `RAZORPAY_WEBHOOK_SECRET`

## Testing in test mode
Use Razorpay test instruments (no real money):
- Card: `4111 1111 1111 1111`, any future expiry, any CVV, any name
- UPI success: `success@razorpay` · UPI failure: `failure@razorpay`

Verify: pick a paid plan → pay → plan activates immediately → premium features unlock.
