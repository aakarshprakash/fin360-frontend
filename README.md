# Fin360 Frontend

React 19 + Vite web app (installable PWA) for **Fin360 by SYSNAC** — complete financial control.

Pairs with [`fin360-backend`](../fin360-backend).

## Run locally

```bash
npm ci
cp .env.example .env.local     # VITE_API_BASE_URL=http://127.0.0.1:8000/api
npm run dev                    # http://localhost:5173
npm run build                  # production bundle in dist/
```

Without `VITE_API_BASE_URL` the app talks to the production API configured in `src/utils/api.js`.

## Deploy (Cloudflare Pages)

Cloudflare Pages builds this repo on every push to `main`.

| Setting | Value |
|---|---|
| Framework preset | Vite (or None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 22 (pinned by `.node-version`) |
| Environment variable | `VITE_API_BASE_URL` = your API, e.g. `https://leadcrm.peoplenex.online/api` |

`public/_redirects` sends every route to `index.html`, so deep links like `/invoices/28` work.
After changing `VITE_API_BASE_URL`, trigger a new deployment — Vite bakes it in at build time.

## Brand & theme

Everything follows the *Fin360 Complete Financial Control* brand board:

| Token | Value | Use |
|---|---|---|
| `--brand-purple` / `--primary-600` | `#5B21B6` | Primary actions, active nav, income series |
| `--brand-orange` / `--accent-500` | `#F97316` | Accent, FAB, expense series |
| `--brand-pink` | `#FEE2E2` | Highlights |
| `--bg-primary` | `#F8FAFC` | App background |
| `--text-primary` | `#1F2937` | Body text |
| `--font-sans` | Plus Jakarta Sans | All text |

Tokens live in `src/index.css`. Logos are the **PNG artwork from the brand board** in `public/brand/` (`fin360-logo.png`, `fin360-logo-dark.png`, `fin360-mark.png`); favicons and PWA icons in `public/` are cut from the same artwork.

Chart colours (`src/components/charts/chartColors.js`) use a fixed, colour-blind-validated order.

## Structure

```
src/
  App.jsx                    routes (top-level: /dashboard, /invoices, /bills, … ; /settings/*)
  components/
    Layout.jsx               app shell: sidebar + top bar + mobile tab bar
    shell/navConfig.js       single source for sidebar, settings menu and page search
    shell/AppSidebar.jsx     main navigation (PNG logo, permission-aware)
    shell/TopBar.jsx         page search (Ctrl K), notifications, account menu
    shell/SettingsFrame.jsx  grouped settings sub-navigation
    charts/                  SVG charts (bars, donut, sparkline)
    AuthLayout.jsx           sign-in / password pages
  pages/
    Dashboard.jsx            KPIs, income vs expenses, expense mix, recent, upcoming
    Settings.jsx             company profile, roles, departments, job titles, personal
    accounting/*             finance modules
```

### Settings

All master data and configuration lives under **Settings** (bottom of the sidebar):

- **Organization** — Company Profile, Business & Tax Details, Branches, Financial Years
- **Finance Masters** — Accounting Preferences, Tax Rates, Currencies, Payment Methods, Document Numbering, Invoice & Quotation Templates
- **Team & Access** — Users, Roles & Permissions, Departments, Job Titles
- **Personal** — My Profile, Security, Notifications

Old URLs (`/accounting/*`, `/taxes`, `/users`, `/settings?tab=…`) redirect to their new homes.

CRM-era docs are archived in `docs/legacy/`.
