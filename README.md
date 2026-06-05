# Kidzopedia

Capture every moment, celebrate every milestone. Kidzopedia is a family memory &
child-milestone app — memories, achievements, documents, guidance, and shareable
child books.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Vite • React 18 • TypeScript • Tailwind • shadcn/ui • React Router • TanStack Query |
| Backend | Supabase (Postgres + Auth/GoTrue + Storage + Edge Functions) |
| Auth | Email + password with **6-digit email OTP** verification (via Resend SMTP), phone OTP |
| Hosting | Frontend → Vercel · Backend → self-hosted Supabase (Coolify) |

## Project structure

```
.
├── src/                      # Frontend application (deployed to Vercel)
│   ├── pages/                # Route pages (auth, home, admin, books, landing…)
│   ├── components/           # UI + feature components (ui/, books/, childbook/, landing/)
│   ├── contexts/             # React contexts (AuthContext)
│   ├── hooks/                # Reusable hooks
│   ├── integrations/supabase # Supabase client + generated types
│   └── lib/                  # Utilities
├── supabase/                 # Backend (Supabase project)
│   ├── migrations/           # SQL migrations (apply in filename order)
│   ├── functions/            # Edge functions (delete-account)
│   ├── templates/            # Auth email templates (e.g. 6-digit OTP confirmation)
│   └── config.toml           # Supabase project config
├── vercel.json               # Vercel build + SPA rewrite config
├── .env.example              # Frontend env var template
└── index.html                # Vite entry
```

## Local development

```bash
npm install
cp .env.example .env     # then fill in your Supabase URL + anon key
npm run dev              # http://localhost:8080 (falls back to 8081 if busy)
```

Other scripts: `npm run build` (production build → `dist/`), `npm run preview`,
`npm run lint`, `npm test`.

## Frontend deployment (Vercel)

This repo is Vercel-ready:

- `vercel.json` sets the Vite framework, build/install commands, `dist` output,
  and a SPA rewrite so client-side routes (React Router) resolve to `index.html`.
- Import the repo in Vercel — it auto-detects the config.
- Set **Environment Variables** in *Project Settings → Environment Variables*
  (Production + Preview). Vite inlines `VITE_*` at build time:

  | Key | Example |
  |-----|---------|
  | `VITE_SUPABASE_URL` | `https://<your-public-supabase-host>` |
  | `VITE_SUPABASE_PUBLISHABLE_KEY` | `<supabase anon key>` |
  | `VITE_SUPABASE_PROJECT_ID` | `kidzo` |

> ⚠️ **The Supabase URL must be reachable from the end-user's browser.** A public
> Vercel site cannot reach a LAN address (`http://192.168.x.x`). Point
> `VITE_SUPABASE_URL` at a public HTTPS endpoint for the Supabase API gateway
> (e.g. a domain/tunnel in front of Kong). Then add that origin to Supabase Auth's
> allowed redirect URLs.

## Backend (self-hosted Supabase)

The backend runs as a self-hosted Supabase stack (here, managed by Coolify).

### Migrations

Apply every file in `supabase/migrations/` in chronological (filename) order to the
Postgres `postgres` database, e.g.:

```bash
for f in $(ls -1 supabase/migrations/*.sql | sort); do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -q -f "$f"
done
```

### Email verification (6-digit OTP)

Auth is configured to require email confirmation and to deliver a **6-digit code**
(not a magic link) via SMTP:

- SMTP provider: **Resend** (`smtp.resend.com:465`, user `resend`, password = Resend API key).
- `From`: a sender on a Resend-**verified** domain.
- The confirmation email uses a custom template (`supabase/templates/confirm.html`)
  containing `{{ .Token }}` — the 6-digit code. Point GoTrue's
  `MAILER_TEMPLATES_CONFIRMATION` at a URL serving this template.
- Sign-up flow: `signUp` → enter 6-digit code → `verifyOtp({ type: 'signup' })`.

### Edge function

`supabase/functions/delete-account` deletes the calling user's account and owned
data (requires `SUPABASE_SERVICE_ROLE_KEY` in the function environment).

## License

Private — © UniMisk ERP Solutions.
