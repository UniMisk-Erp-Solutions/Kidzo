# Master Admin Panel, Phone Sign-Up & Plan System (Mock Payments)

A big change with four connected pieces. Here's the proposed build, scoped so you can approve before I touch code.

## 1. Roles & access control

New `app_role` enum: `super_admin`, `admin`, `user`.
New `user_roles` table (separate from profiles, security-definer `has_role()` — prevents privilege escalation).

You become `super_admin` by claiming the first admin slot (or I seed your account once you tell me which email). Only `super_admin` can:
- View/manage every account
- Change any user's plan
- Edit plan definitions and feature limits
- Mark invoices paid/refunded (mock billing)
- Suspend / reactivate accounts
- Impersonate (optional, off by default)

## 2. Plans & feature gating

New tables:
- `plans` — `slug`, `name`, `price_monthly`, `price_yearly`, `currency`, `is_active`, `sort_order`
- `plan_features` — `plan_id`, `key`, `value_int`, `value_bool`, `value_text` (so you can edit limits live without code changes)
- `user_subscriptions` — `user_id`, `plan_id`, `status` (active/canceled/past_due/trialing), `current_period_end`, `cancel_at_period_end`
- `invoices` — `user_id`, `plan_id`, `amount`, `currency`, `status` (pending/paid/failed/refunded), `provider` ('mock' for now, ready for 'razorpay'), `provider_ref`, `paid_at`

Seeded plans:
- **Free** — 1 child, basic memories, no PDF export, no photo book ordering
- **Family** — 5 children, unlimited memories, PDF export, sharing
- **Premium** — unlimited children, all features, priority

Feature keys (all editable from admin): `max_children`, `max_memories_per_month`, `pdf_export`, `photo_book_orders`, `share_links`, `family_invites`, `ai_suggestions`.

A `useEntitlements()` hook reads the current user's plan + features and exposes `can('pdf_export')` / `limit('max_children')`. Existing flows (add child, export, share) gate against this.

## 3. Phone number sign-up

Adds phone (OTP) as a sign-in method on `/auth` alongside email + Google. Two-tab UI: Email | Phone. Uses Supabase phone OTP. Requires you to enable an SMS provider in Cloud → Auth (I'll surface a note if it's not configured; Twilio is the usual pick). Existing email and Google flows are untouched.

## 4. Master admin panel — `/admin`

Protected route (super_admin only). Sidebar layout with:

- **Dashboard** — totals (users, active subs, MRR mock, signups this week)
- **Users** — searchable table; row click → user detail (profile, children, current plan, change plan, suspend, reset password, view invoices)
- **Plans** — list + editor; add/remove plans, toggle active, edit price, edit each feature limit inline
- **Subscriptions** — all active subs with filters; change plan or cancel
- **Invoices (mock)** — create/mark paid/refund; later swap `provider='mock'` → `'razorpay'`
- **Settings** — global toggles (signups open, default plan, trial length)

## 5. Mock billing UX (user side)

- `/pricing` — public plan cards driven by the `plans` table
- `/billing` — current plan, change/cancel, invoice history
- "Upgrade" → mock checkout page that creates a `pending` invoice and shows "Awaiting admin confirmation" until you mark it paid in the admin panel. Razorpay swap-in later is a single function in `src/lib/billing.ts`.

## Technical notes
- Roles checked via `has_role(auth.uid(), 'super_admin')` in RLS — no client-side admin checks.
- All admin tables RLS-locked to super_admin only; user-facing tables (`user_subscriptions`, `invoices`) readable by the owning user.
- Feature gating is read-driven (table-backed) so changes from admin apply immediately on next fetch — no redeploy.
- Existing `child_profiles` insert path gets a server-side trigger that blocks insert if `count >= max_children` for the user's plan, so the limit can't be bypassed client-side.

## What I need from you before building
1. Which email should be seeded as `super_admin`?
2. OK to gate **photo book ordering** and **PDF export** behind paid plans (Free = view-only)?
3. For phone OTP — confirm you'll enable an SMS provider in Cloud Auth settings after I ship (I'll add a clear in-app banner if it's not set up yet).