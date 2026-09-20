# Test report

Run: 2026-09-20 on `cursor/test-suite-e2e-0171` (onto `cursor/mineops-appstore-ready-c712`).

Commands: `npm ci` (plus `vitest@3`) · `npm run lint` · `npm test` · `npm run build`.

Live login / write paths were **not** exercised. `hnspwfwdqxkedqnriohu.supabase.co` does not resolve. Do **not** claim production sign-in works.

## Automated results

| Check | Result | Notes |
|--------|--------|--------|
| `npm run lint` | **PASS** | ESLint 9 — 0 errors, 0 warnings |
| `npm test` (Vitest 3.2.7) | **PASS** | 5 files, **42 tests** |
| `npm run build` | **PASS** | Vite 8.0.8 · 78 modules · `dist/index.html` + JS |
| Playwright / Cypress | **SKIPPED** | No in-repo Supabase mock; a browser suite would flake on dead DNS |
| Live E2E (production) | **BLOCKED** | Supabase host DNS does not resolve |

Build note: existing chunk-size warning (`index-*.js` ~722 kB). Not a failure.

## Unit coverage (no database)

| Area | File | Tests | What is asserted |
|------|------|------:|------------------|
| Operator scoring | `src/lib/performance.test.js` | 16 | mean/stddev, cycle consistency, productive hours floor, t/hr & loads/hr, utilization clamp, loader vs truck `rankKey`, fleet ranking from prod/scoop/downtime |
| Auth mapping | `src/lib/auth.test.js` | 7 | `friendlyAuthError` / `friendlyError`, email + password rules, submit-disabled per mode |
| Route guards | `src/lib/routing.test.js` | 13 | post-auth flow (loading / signed-out / recovery / onboarding / picker / truckQ), tab snap by role, platform-admin email, compliance PIN gate |
| Compliance PIN | `src/lib/compliance.test.js` | 4 | 4-digit normalize, SHA-256 hash per mine, match / mismatch |
| Vehicle check | `src/lib/checks.test.js` | 2 | all items answered, vehicle name, fail evidence |

Helpers were extracted from `App.jsx` / `TeamRankings.jsx` so these tests execute the same functions the UI calls.

## BLOCKED — live E2E (pending Supabase)

Until DNS for `hnspwfwdqxkedqnriohu.supabase.co` is restored (or env points at a new project):

- Signup / sign-in / magic link / password reset
- Create mine / join mine
- Pre-start, tonnage, vehicle check writes
- Records list
- Compliance PIN save / exit
- VisionLink credential save + edge sync
- Billing org fetch
- Platform admin tables
- Team rankings query (`daily_production`, `scoop_logs`, `downtime_logs`)

Manual steps: `docs/E2E_CHECKLIST.md`.

## Playwright / Cypress

Not added. A green browser job would need either a mocked Auth + PostgREST surface or a skip-network static shell. Hitting production would fail on DNS and look like product regressions. Revisit when the backend is reachable; keep mocks out-of-band so CI stays deterministic.

## Static preview (no auth)

`npm run preview` served `dist/index.html` (HTTP 200, 1283 bytes) and the main JS chunk (HTTP 200, ~722 kB). That only proves the bundle is reachable. Session bootstrap still needs a live Supabase host.

## Not verified in a browser

No browser automation in this environment. UI behavior after the helper extract was not click-tested. Closest substitute: unit tests of the extracted functions + a production build that compiled `App.jsx` and `TeamRankings.jsx`.
