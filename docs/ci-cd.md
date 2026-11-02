# Kidzo CI (UniMisk quality and security pipeline)

Every push to `main` or to a developer branch (`<github-user>/...`) is built and checked automatically on the UniMisk CI server. The result appears on the commit as **`unimisk/verified`** (Details opens the pipeline). CI only checks: it never merges, pushes or deploys. Merging stays with an admin.

## What runs (all must pass)

| Stage | What it checks |
|---|---|
| ESLint (no new errors) | `ci/pipeline/run-lint.mjs`: the project's own ESLint rules; existing errors are in `ci/verify/quality/lint-baseline.json` and may not grow |
| Production build | `npm run build` with inert settings |
| Unit tests | `npm run test` (Vitest) |
| Repository policy | lockfile, no new lint/type suppressions, no removed or skipped tests, protected config |
| Code standards | `any`, unsafe casts, `console.log`, `debugger`, HTML injection, `eval` |
| Maintainability | function size, complexity, nesting, file size, duplication |
| Architecture | the layer rules below |
| Database migrations | row-level security on every table, destructive SQL, open policies, `SECURITY DEFINER` |
| Secrets, dependencies | Trivy + pattern scan; known-vulnerable packages |

Old problems are recorded in the baselines (`ci/verify/quality/baseline.json`, `lint-baseline.json`) and may not grow; only a new or worse problem fails a build. Baselines change only through a reviewed pull request.

## Architecture rules (`ci/verify/quality/policy.json`)

Layers (read from the real import graph): `pages` use `components`, `hooks`, `contexts`, `lib`, `integrations`; `hooks` use `contexts` and `integrations`; `components/ui` is the bottom layer.

- ARCH-201 `components/ui` imports only `lib` and `hooks`.
- ARCH-202 a component does not import a page.
- ARCH-203 `lib/` does not import components, pages, contexts or hooks.
- ARCH-204 hooks do not import components or pages.
- ARCH-205 contexts and the Supabase integration import no components, pages or hooks.
- ARCH-206 components and pages do not import the Supabase client: data access goes through hooks.
- ARCH-207/208 the browser app and the edge functions never import each other.
- ARCH-002 no new circular dependency; ARCH-011 no import that points at nothing.

## Project rules

- KDZ-001 the browser does not write billing, plan, coupon, role or audit tables (`user_subscriptions`, `book_orders`, `invoices`, `plans`, `plan_features`, `coupons`, `user_roles`, `admin_audit_log`): money and permissions are decided on the server.
- KDZ-002 the service-role key never appears in browser code.
- KDZ-003 no live Razorpay key id in code.
- KDZ-004 no payment-secret names in browser code.
- KDZ-005 no tokens, secrets or passwords in `localStorage`.

## Run it locally

```bash
npm ci
node ci/verify/quality/run.mjs all        # quality stages
node ci/pipeline/run-lint.mjs             # lint against its baseline
```

## Revision log

| Date | Change |
|---|---|
| 2026-11-02 | CI onboarded: stages, architecture and project rules, baselines. |
