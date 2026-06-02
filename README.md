# MineOps

Mobile-first mining operations SaaS. React + Vite + Supabase, deployed to Vercel.

**Live:** [mineops-ten.vercel.app](https://mineops-ten.vercel.app) (auto-deploys from `main`)

---

## Architecture

- **Frontend:** React 18 + Vite (single `src/App.jsx`, ~6,200 lines, all components in one file by design — easy grep, easy splice)
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Auth:** Supabase email/password + magic-link, with `compliance_pin_hash` for Compliance View
- **Storage buckets:** `handover`, `fire-extinguishers`, `check-photos`, `reference-photos`

## Environment

`.env`:

```
VITE_SUPABASE_URL=https://hnspwfwdqxkedqnriohu.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Edge Function `visionlink-sync` reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from its own env.

## Local development

```bash
npm install
npm run dev      # vite dev server
npm run build    # production bundle to dist/
```

## Schema migrations

Migrations live in `supabase/migrations/` with `YYYYMMDDHHMMSS_<name>.sql` filenames.
Apply via Supabase SQL editor (CLI not yet installed). Apply in filename order.

Current migrations:
- `20260521040000_create_daily_production.sql` — daily tonnage table
- `20260521050000_fire_extinguishers.sql` — locations + extinguishers + inspections + storage
- `20260522010000_check_photos.sql` — per-item photo evidence + config + bucket
- `20260522020000_reference_photos.sql` — reference photo library + bucket
- `20260526010000_auth_polish.sql` — operators.is_active + last_active_at + indexes
- `20260527010000_vehicle_checks.sql` — vehicle inspection table; extends check_photos log_type
- `20260527020000_compliance_pin.sql` — mines.compliance_pin_hash

Tables touched by the app (all in Supabase):
mines · operators · machines · shifts ·
prestart_logs · scoop_logs · downtime_logs · maintenance_logs ·
handover_tickets · handover_photos ·
workplace_areas · workplace_exams · plants · plant_equipment ·
extinguisher_locations · fire_extinguishers · fire_extinguisher_inspections ·
daily_production · vehicle_checks ·
check_item_config · check_photos · reference_photos ·
visionlink_cache · visionlink_credentials

## App structure

Bottom nav adapts to role:

- **Operator** (4 tabs): 🏠 Today · ✅ Checks · 📈 Production · 📁 Records
- **Supervisor / Mine Manager / Admin** (5 tabs): 📡 Live · 📈 Production · 👷 Team · 📁 Records · 🧠 Intel

Menu (☰) surfaces: Handover Tickets · Report Issue · Vehicle Check · Switch Mine · Compliance View · Account · (admin) Setup.

Setup hub contains: People · Mine Code · Workplace Areas · Extinguisher Locations · Plants · Check Item Configuration · Compliance View PIN · Add Machine · Pre-shift History · VisionLink sync.

## Code conventions

- React imports at top: `{ createContext, useContext, useEffect, useMemo, useState, useRef }`
- Colors live in `const C` (bg / surface / card / border / accent / success / danger / amber / info / purple / muted / text / textSub)
- Font in `const F` (Barlow Condensed / Oswald)
- Routing: `setFlow(name)` for full-screen flows; `setTab(name)` for bottom nav. Full-screen flows render in standalone `{flow==="x"&&<div>...</div>}` blocks; tab routing happens inside `screen()` when `flow==="app"`.
- The outer chrome (MINEOPS header + Sign Out) only renders for `flow==="app"` or `flow==="vehicleCheck"`. Other flows are responsible for their own `PageHdr`.
- Toasts: `const toast = useToast()` then `toast.success(msg)` / `toast.error(e)` / `toast.info(msg)`. `friendlyError(e)` rewrites Postgres / Supabase errors into plain English.

## Documentation

- `docs/BUTTON_AUDIT.md` — Phase 1 audit (2026-06-01) listing every screen / button / Supabase call with WORKS / BROKEN / DEAD / PLACEHOLDER / PARTIAL status.
- `docs/KNOWN_ISSUES.md` — open items that aren't crash-level but are worth tracking.

## Demo data

Several screens still render hardcoded demo data while their backing tables are scoped for future work — each is now banner-flagged in-app:

- IntelligenceHub (weather, predictive maintenance, fatigue) — Demo preview banner
- ComplianceHub (training records, competent persons, SDS library) — Demo preview banner; the induction form is interactive but doesn't yet persist
- ChecksHub → Maintenance — Demo preview banner; real maintenance logs from the pre-start gate will surface here once the viewer is wired
- ChecksHub → Diagnostics — Demo preview banner; pulls real telemetry once VisionLink credentials are connected
- Team tab machine rankings (the `MACHINE_PERF` constant) — only the today operator leaderboard is real

## Known follow-ups (not blockers)

See `docs/KNOWN_ISSUES.md` for the full list. Short version:
- Shift scheduling module — full feature pending, see brief.
- Capacitor iOS wrap — pending; bundle ID `com.mineops.app`.
- Polish pass — visual consistency sweep across screens (deferred to its own session).
