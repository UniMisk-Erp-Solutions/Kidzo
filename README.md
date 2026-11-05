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

## Design system — "digital scrapbook" & themes

Tokens live in `src/index.css` (HSL triplets consumed by `tailwind.config.ts`). Components use semantic tokens
(`bg-background`, `text-foreground`, `bg-primary`, `bg-card`, `border-border`, `bg-sec-hero`, `btn-gradient`, …) and the
palette "slot" colours (`lavender coral butter mint sky peach plum`), so a theme is just a different set of token values —
no page or component is duplicated per theme.

### Themes (Settings → Appearance & Themes)

| Id | Name | Character | Key colours |
|----|------|-----------|-------------|
| `daydream` | Colorful Daydream | playful, dreamy pastels | Lavender `#A78BFA`, Pink `#F472B6`, Coral `#FF8A95`, Butter `#FFD66B`, Sky `#93C5FD`, Warm White `#FFFAF5`, Deep Plum `#302447` |
| `explorer` | Little Explorer | monochrome blue adventure (pale sky to midnight): clouds, paper planes, stars | `#C0E6FD`, `#80AAD3`, `#5B86B6`, `#3F6593`, `#1B3554`, `#000F22` |
| `tales` (default) | Timeless Tales | warm cream storybook with brick/terracotta, gingham trim under the header, leaves and suns | Cream `#FBF4E6`, Brick `#B4533F`, Clay `#E9A590`, Mustard `#E3B563`, Sage `#A8C9A0`, Dusty Blue `#94B5CB`, Brown `#4A2B24` |

All three are available to every user. How it works:

- **Tokens:** `:root` holds the Colorful Daydream values; the default theme for new and signed-in users without a saved choice is Timeless Tales (`DEFAULT_THEME` in `useTheme.ts`, mirrored in the `index.html` script). `[data-palette="explorer"]` / `[data-palette="tales"]` blocks in `index.css` re-map the
  semantic tokens (`--background … --ring`), the slot colours (`--lavender` etc. become the theme's own hues), gradients
  (`--gradient-hero/-celebrate/-button/-warm`), `--btn-foreground`, `--on-celebrate` (text on promo gradients) and
  `--body-texture` (paper grain, Tales only). Section tints (`--sec-1/2/3/deep`) are re-declared per palette and per
  `[data-section]` so Home/Moments/Grow/Books/Docs/Family keep their own identity *inside* each theme.
- **Switching:** `src/hooks/useTheme.ts` (`useTheme`, `THEMES`, `applyTheme`) sets `<html data-palette>` and the browser
  `theme-color`; there is no reload. The Settings UI is `components/childbook/ThemePicker.tsx` (miniature previews, swatches,
  selected state, Preview iframe via `ThemePreview` and `?themePreview=<id>`, reset). `ThemeMenu` (palette button in the top bar of every signed-in page, including Home) lists the three themes with their swatches and switches instantly.
- **Persistence:** `localStorage` `kidzopedia:theme:<childId>` (each child profile remembers its look) plus `kidzopedia:theme` as the
  fallback for screens without a child (landing, auth). Old values `legacy`/`dream` and the removed intensity key are migrated to
  the default theme. There is no server-side preference (the app has no per-user settings table for this).
- **No flash:** an inline script in `index.html` reads the same keys and sets `data-palette` before first paint; `useTheme` re-applies it
  at module load.
- **Theme-specific decoration:** `components/AmbientDecor.tsx` (floating side-margin keepsakes per theme, >=1280px) and
  `ThemeAccent` in `childbook/Doodles.tsx` (heart / paper plane / leaf). Everything else restyles through tokens.
- **Fonts:** Fraunces serif for display (`font-display`, `<em>` for the italic highlight), Inter for UI, Caveat/Kalam handwriting accents.
- **Public marketing pages (`/`, features, how it works, families, pricing, about, contact, legal, get-app):** share one "Wash House"-inspired look, independent of the in-app theme: `<html data-landing="wash">` (set by `components/landing/LandingLayout.tsx`) re-maps tokens in `index.css` to peach cream, terracotta, olive ink, mustard and a lilac band, switches headings to a heavy soft Fraunces (`SOFT`/`WONK` axes) and body text to DM Sans, and adds the `--wash-*` colours used by the feature cards and the spinning badge. Animated translucent keepsakes drift behind the content of every such page (`components/landing/LandingBackdrop.tsx`, inside an `isolate` wrapper so it stays behind text). The sign-in, forgot-password and reset-password screens use the same look through `components/landing/WashShell.tsx`. There is no theme button on these pages; the in-app themes apply after sign-in.
- **Section identity:** `<html data-section>` is set from the route by `components/SectionTheme.tsx`.
- **Motion:** route fade (`PageTransition`), floats/twinkles, hover lifts; `prefers-reduced-motion` collapses all animation and transition durations.
- **Utilities (index.css):** `bg-sec-hero`, `bg-sec-wash`, `text-sec`, `text-sec-gradient`, `btn-gradient`, `card-paper`, `glass`, `washi`, `polaroid`, `blob`, `float-slow`, `float-med`, `sway`, `twinkle`, `page-in`.
- **Adding a theme:** add a `[data-palette="x"]` block (+ six `[data-palette="x"][data-section=…]` lines) to `index.css`, an entry in `THEMES`
  (incl. `preview`), the id in the `isTheme` guard and in the `index.html` script, and a decor set in `AmbientDecor.tsx`.
- **Not themed:** book templates and PDF exports carry their own palettes (`book_templates.color_scheme`) and are intentionally independent of the app theme.

Updated components: `AgeHero`, `QuickStats`, `BottomNav.tsx` (`PrimaryNav`, pinned in `TopBar`), `ui/button`, `Flashbacks`, `Index` book banner, `Landing`, `Settings`.

**Verifying:** `npm run dev`; in Settings pick each theme and visit `/home`, `/moments`, `/grow`, `/books`, `/documents`, `/family`, `/settings` at 375px, tablet and desktop widths;
reload to confirm the theme is restored without a flash; try the OS "reduce motion" setting. Automated: `npm test` (`src/test/theme.test.ts`),
`npm run build`, `npx tsc -p tsconfig.app.json --noEmit` (pre-existing `AdminPanel` `coupons` type errors are unrelated).

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
