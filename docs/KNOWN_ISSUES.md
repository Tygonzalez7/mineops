# Known Issues — 2026-09-17 (App Store readiness pass)

Open items that are not crash-level. Demo intel / compliance / maintenance / diagnostics / team rankings are **wired to real tables or honest empty states**. Fire extinguishers are **removed from the product UI**.

---

## Blocked: live E2E / production auth

- **Supabase DNS** — `hnspwfwdqxkedqnriohu.supabase.co` does not resolve from Vercel or this agent environment (2026-09-20). Signup, login, and every write path against production are **unverified**. Automated tests are unit-only (`npm test`). Manual steps: `docs/E2E_CHECKLIST.md`.

## Out of band (not this repo)

- **Apple Developer enrollment + App Store submission** — Ty’s Apple account. Repo has Capacitor iOS + `docs/APP_STORE.md`.
- **Live Stripe keys** — scaffolding only (`billing_*`, Billing page, `stripe-webhook` stub).
- **Platform admin seed** — insert Ty into `platform_admins` after applying `20260918010000_saas_orgs_rls.sql`, and/or set `VITE_PLATFORM_ADMIN_EMAILS`.

## Deferred / follow-up

- **VisionLink beyond assetSummary** — `visionlink_telemetry.kind` is ready for `cycle` / `payload` / `fuel` / `faults`; edge function still fetches asset summary only.
- **Hard account deletion** — still soft-delete + sign-out; needs service-role function.
- **Weather / ML / fatigue** — Intelligence shows live production + downtime + VL faults only. No invented forecasts.
- **SDS file upload** — records persist; storage object attach can come later.
- **CI-signed IPA** — workflow documents the step; signing needs a Mac + Apple secrets.

## Polish (non-blocking)

- Shared `Btn` / `PageHdr` / `EmptyState` used on new screens; older App.jsx screens still use inline buttons.
- A few icon buttons remain under 44px (camera on check rows).
- Legacy unused routes under `src/pages/auth` and `src/pages/mine` are not mounted by `main.jsx`.

## Tested paths (historical 2026-06-02 + this pass)

- Create/join mine, Today, pre-start, tonnage, vehicle check, records, compliance PIN, account — previously walked.
- This pass: lint + production build; extinguisher nav/setup/records removed; real hubs compile against new modules.
