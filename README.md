# MineOps

Mobile-first mining operations SaaS. React + Vite + Supabase, deployed to Vercel. Capacitor iOS wrapper for the App Store (`com.mineops.app`).

**Live web:** [mineops-ten.vercel.app](https://mineops-ten.vercel.app) (auto-deploys from `main`)

---

## Architecture

- **Frontend:** React 18 + Vite (`src/App.jsx` plus feature modules under `src/pages/real/`)
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Auth:** Email/password + magic-link; `compliance_pin_hash` for Compliance View
- **Multi-tenant:** `organizations` → mines → operators, with RLS helpers (`is_mine_member`, `is_org_member`, `is_platform_admin`)
- **Native:** Capacitor iOS. JS OTA via Capgo when configured — see `docs/APP_STORE.md`
- **Storage buckets:** `handover`, `check-photos`, `reference-photos` (legacy `fire-extinguishers` unused)

## Environment

Copy `.env.example` → `.env` (gitignored). Production uses the same `VITE_*` keys on Vercel. Native can override at runtime via `public/config.js` (`window.__MINEOPS_CONFIG__`) so OTA updates do not hardcode secrets.

Edge Function `visionlink-sync` uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Stripe webhook (`stripe-webhook`) is a stub until `STRIPE_WEBHOOK_SECRET` is set.

## Local development

```bash
npm install
npm run dev      # vite
npm run lint
npm run build    # production bundle → dist/
npm run cap:sync # build + Capacitor iOS sync
```

## Schema migrations

`supabase/migrations/` — apply in filename order in the SQL editor.

Includes org/mine RPC `create_org_and_mine`, compliance tables, billing scaffolding, VisionLink credentials/cache/telemetry, and platform admin.

## App structure

Bottom nav:

- **Operator:** Today · Checks · Prod · Schedule · Records
- **Supervisor+:** Live · Prod · Team · Intel · Records  
  Schedule, Compliance, Billing, VisionLink, and (for Ty) Platform live in the ☰ menu.

Setup: People · Mine Code · Workplace Areas · Plants · Check items · Compliance PIN · Shift templates · Add Machine · Pre-shift history · **CAT VisionLink credentials + sync**.

Fire extinguishers have been **removed** from UI, nav, and setup.

## Operator performance

Primary: **tons or loads per hour**, **cycle-time consistency**, **utilization**. Not raw hours. See `docs/OPERATOR_PERFORMANCE.md`.

## Billing + platform

- Billing page + `billing_*` tables + webhook stub — **payment-ready, not payment-live**
- Platform super-admin: add Ty’s email to `platform_admins` and/or `VITE_PLATFORM_ADMIN_EMAILS`

## Documentation

- `docs/APP_STORE.md` — TestFlight, App Store Connect, web vs native vs OTA
- `docs/OPERATOR_PERFORMANCE.md` — ranking rules
- `docs/BUTTON_AUDIT.md` / `docs/KNOWN_ISSUES.md`

## Out of band (Ty)

- Apple Developer enrollment + store submission
- Live Stripe keys
- Insert platform admin row after applying SaaS migrations
