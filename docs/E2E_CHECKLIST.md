# Manual E2E checklist

Use this after **Supabase DNS is restored**. Live Vercel currently cannot resolve `hnspwfwdqxkedqnriohu.supabase.co`. Until that host answers, **do not treat any live login or write path as verified**.

Automated coverage is unit-only (Vitest, no network). See `docs/TEST_REPORT.md`.

**Environment:** `https://mineops-ten.vercel.app` (production) or a preview URL with working `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

**Accounts:** one new email (signup), one existing operator, one supervisor/admin, optional platform-admin email.

Mark each row: **Pass / Fail / Blocked** and note the URL + timestamp.

---

## 0. Preflight (blocked until DNS works)

- [ ] `hnspwfwdqxkedqnriohu.supabase.co` resolves (`dig` / browser Network tab is not `ERR_NAME_NOT_RESOLVED`)
- [ ] App shell loads; auth form appears (not a blank error after submit)
- [ ] Browser console: no repeated `Failed to fetch` / DNS errors on `auth/v1/token`

If preflight fails, stop. Everything below is **BLOCKED**.

---

## 1. Signup

- [ ] Sign Up tab: empty / invalid email keeps the button disabled
- [ ] Password strength meter moves from Weak → Excellent
- [ ] New email + 8+ char password creates an account
- [ ] Confirm-email banner or inbox message appears if confirmation is on
- [ ] Duplicate email shows the friendly “already exists” copy (not a raw `AuthApiError`)
- [ ] After signup with no mine, **Welcome / Create or Join** onboarding is shown (not a blank Live board)

## 2. Sign-in / recovery

- [ ] Wrong password → “That email and password don't match.”
- [ ] Correct password signs in
- [ ] Magic link sends an email; link opens a session
- [ ] Forgot password sends a reset email
- [ ] Recovery URL opens **Set a new password**; submit returns to the app

## 3. Create mine

- [ ] Signed-in user with no memberships sees Create / Join
- [ ] Org name + mine name required; location optional
- [ ] Submit creates org + mine (or fallback insert if RPC missing)
- [ ] Share-code screen shows a 6-character code; copy / share works
- [ ] **Enter MineOps** continues to the truck question
- [ ] Mine appears in ☰ → Switch mine

## 4. Join mine

- [ ] 6-character code lookup finds the mine
- [ ] Invalid code shows a readable error
- [ ] Join creates a pending operator on that mine
- [ ] Admin can approve from Setup → People
- [ ] After join, truck question / app loads for that mine

## 5. Truck question + vehicle check

- [ ] “Did you drive a company vehicle?” Yes / No
- [ ] **No** (operator) → machine select; **No** (supervisor+) → app
- [ ] **Yes** → vehicle check: every item must be pass / fail / n/a
- [ ] Fail without note or photo blocks Review
- [ ] Named vehicle + complete items → Review & Submit writes `vehicle_checks`
- [ ] ☰ → Vehicle check can be run again mid-shift

## 6. Pre-start (Checks)

- [ ] Operator tab **Checks** lists assigned / selected machines
- [ ] Each HSMP item must be answered
- [ ] Failures require a note
- [ ] Maintenance gate appears when service is overdue
- [ ] Sign-off writes `prestart_logs` (and maintenance rows if gated)
- [ ] Setup → Pre-shift history lists today’s / prior rows

## 7. Tonnage / production

- [ ] **Prod** tab: start / continue a shift
- [ ] Log scoops or daily tonnage (loader / excavator)
- [ ] Haul truck path logs loads / trips
- [ ] Downtime add/remove updates productive time
- [ ] End shift writes `daily_production` / scoop / downtime rows
- [ ] Live board (supervisor) shows the operator without demo names

## 8. Records

- [ ] **Records** hub lists workplace, prestart, vehicle, handover
- [ ] New rows from this session appear after refresh
- [ ] Filters / category chips work
- [ ] Ticket create + detail (handover) persist
- [ ] Empty mine shows an honest empty state (no fake extinguisher / demo rows)

## 9. Compliance PIN

- [ ] ☰ → Compliance View with no PIN → admin prompt to set PIN
- [ ] Operator sees “ask admin”, not the setup form
- [ ] Setup → Compliance View PIN: 4 digits, confirm match, save
- [ ] Compliance View is read-only records (no bottom nav / setup)
- [ ] Exit asks for PIN; wrong PIN shakes / clears; correct PIN returns to app
- [ ] Remove PIN disables Compliance View again

## 10. VisionLink sync

- [ ] Setup → CAT VisionLink credentials form
- [ ] Save upserts `visionlink_credentials` (secret not re-shown)
- [ ] **Sync** calls `visionlink-sync` edge function
- [ ] Success: “Synced N of M assets” and cache/telemetry rows
- [ ] Bad credentials surface `last_error` (not a silent fail)
- [ ] **BLOCKED if edge function / CAT API keys are not provisioned** — note that separately from DNS

## 11. Billing page

- [ ] ☰ → Billing (supervisor+)
- [ ] Page loads with “payment-ready, not payment-live” notice unless Stripe keys exist
- [ ] Org / plan card or “No company on this mine yet”
- [ ] Checkout button does **not** charge a card
- [ ] Stripe webhook remains a stub until secrets are set

## 12. Platform admin

- [ ] Menu item only for `platform_admins` row and/or `VITE_PLATFORM_ADMIN_EMAILS`
- [ ] Regular users never see Platform
- [ ] Tabs: Companies, Mines, Users, Flags
- [ ] Toggle mine plan starter ↔ pro
- [ ] Insert a feature flag
- [ ] RLS: a non-admin querying these tables fails (check Network)

## 13. Team rankings

- [ ] Supervisor+ **Team** tab
- [ ] Empty mine: honest empty state (no `MACHINE_PERF` demo rows)
- [ ] After real tonnage / scoops: operators ranked by **t/hr** (loaders) or **loads/hr** (trucks)
- [ ] Cycle consistency shows “—” with fewer than 2 samples
- [ ] Utilization reflects downtime
- [ ] Raw SMH / clock hours are **not** the sort key
- [ ] Drill-in on a machine shows the 7-day board

## 14. Other smoke (do if time)

- [ ] Schedule tab + shift templates (Setup)
- [ ] People: role change + soft-remove
- [ ] Account: rename, sign out, soft-delete
- [ ] Intelligence / Maintenance / Diagnostics: live tables or empty, no invented ML
- [ ] iOS Capacitor shell (TestFlight): auth + one write path

---

## Sign-off

| Field | Value |
|--------|--------|
| Tester | |
| Date (UTC) | |
| URL | |
| Supabase project | `hnspwfwdqxkedqnriohu` (or replacement) |
| Result | **Not run — DNS BLOCKED** until host resolves |

**Known blocker (2026-09-20):** production Vercel cannot resolve the Supabase host. Full E2E against live login **will fail** until the project is restored or `VITE_SUPABASE_URL` points at a reachable instance.
