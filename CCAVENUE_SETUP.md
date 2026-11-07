# Kidzopedia — CCAvenue payments

Payments use CCAvenue **hosted checkout** (full-page redirect). CCAvenue replaced Razorpay. Plans are
**one-time payments** for a month/year (no auto-renew). Printed-book orders use the same flow.

## Flow
1. Plan: `/checkout?plan=<slug>&cycle=<monthly|yearly>` · Book: `/books/:id/checkout`.
2. Frontend calls edge fn **`ccavenue-create-order`**. The server computes the amount (plans table / book price list,
   coupon re-validated), inserts a pending `invoices` / `book_orders` row plus a `ccavenue_payments` ledger row with a
   unique order id (`KZ…`), and returns the encrypted request. The browser POSTs it to CCAvenue (`src/lib/ccavenue.ts`).
3. CCAvenue sends the customer back (success **and** cancel) to **`ccavenue-callback`** (`verify_jwt = false`), which
   decrypts `encResp`, then calls SQL `ccavenue_apply_result` — atomic and idempotent: it checks the paid amount/currency
   against the ledger, then activates the plan (`activate_paid_subscription`, coupon redeemed) or marks the book order
   paid. A replay/refresh cannot double-activate. The browser is redirected to **`/payment/result?order=…`**.
4. `/payment/result` reads the ledger row (RLS: own rows only) and shows success / failed / cancelled / pending, with
   "Try again" (new order id each time).

Mismatched amount or currency → status `amount_mismatch`, **not** activated (needs manual review).

## Files
| Area | Files |
|---|---|
| Protocol, crypto, config | `supabase/functions/_shared/ccavenue.ts` |
| Book price/address (mirrors `src/lib/bookPricing.ts`) | `supabase/functions/_shared/bookPricing.ts` |
| Edge functions | `ccavenue-create-order`, `ccavenue-callback` |
| DB | `supabase/migrations/20260808120000_ccavenue_payments.sql` |
| Frontend | `src/lib/ccavenue.ts`, `src/pages/MockCheckout.tsx`, `src/hooks/useBookPayment.ts`, `src/pages/PaymentResult.tsx` |
| Tests | `src/test/ccavenue/*` (`npm test`) |

## Secrets (edge-functions container env — NOT in git, never `VITE_*`)
| Var | What |
|---|---|
| `CCAVENUE_MERCHANT_ID` | Merchant ID |
| `CCAVENUE_ACCESS_CODE` | Access code |
| `CCAVENUE_WORKING_KEY` | Working key (**exactly 32 chars for AES-256**) |
| `CCAVENUE_AES_MODE` | `aes256` or `aes128` — **no default**, see below |
| `CCAVENUE_ENV` | `test` (default) or `production` |
| `CCAVENUE_CALLBACK_BASE_URL` | Public base of the edge functions, e.g. `https://kidzo-api.byteosaurus.com/functions/v1` |
| `SITE_URL` | `https://kidzopedia.byteosaurus.com` |
| `CCAVENUE_INITIATE_URL` | Optional endpoint override (`https://*.ccavenue.com` only). **Required for `aes256` + `test`.** |

Set these in Coolify like the old Razorpay vars, then redeploy the edge-functions container.

## AES-128 vs AES-256 (do not mix)
The kit has both; they differ in key, cipher **and** endpoint. Use whichever your CCAvenue dashboard issued:

| | `aes128` | `aes256` |
|---|---|---|
| Key | MD5(working key) | 32-char working key as-is |
| Cipher | AES-128-CBC, fixed IV | AES-256-GCM, random IV |
| Endpoint | `…/transaction/transaction.do?command=initiateTransaction` | `…/gTransaction.do?command=initiateTransaction` |

Wrong mode ⇒ CCAvenue shows an error page or the callback cannot decrypt (logged as "undecryptable payload").
Only the production AES-256 endpoint is in the kit; for AES-256 test mode set `CCAVENUE_INITIATE_URL`.

## Deploy
1. Apply the migration (see README → Migrations).
2. Set the env vars, redeploy the edge functions (`supabase/config.toml` already registers them; `ccavenue-callback` has `verify_jwt = false`).
3. Ask CCAvenue to allow your site domain, and check whether the callback host (`CCAVENUE_CALLBACK_BASE_URL`) must be approved too.
4. Test with a small amount, then set `CCAVENUE_ENV=production`.

## Limitations
- **No server-to-server status check.** Confirmation relies on the encrypted `encResp` from the browser redirect (AES-256-GCM is authenticated; AES-128-CBC is not). A customer who pays but never returns to the callback is **not** activated automatically — add CCAvenue's Order Status API + a reconcile job if needed (not in the kit).
- **No recurring billing** — one-time payments only. Existing Razorpay subscribers keep their plan until `current_period_end`; they are not renewed.
- Refunds are manual (CCAvenue dashboard); entitlements aren't revoked automatically.
- Web only: the redirect returns to `SITE_URL`, so the Capacitor Android app would lose its session after paying.
- Old Razorpay DB columns/functions (`razorpay_*`, `renew_subscription`, …) are left in place, unused.
