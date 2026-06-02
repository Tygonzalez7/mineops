# Known Issues — 2026-06-02

Open items that aren't crash-level but are worth tracking. None of these block
production use; they're either deferred features, demo-data placeholders, or
low-priority polish.

---

## Demo data (flagged in-app with amber banners)

| Screen | What's demo | What it'll take to wire |
|--------|------------|-------------------------|
| IntelligenceHub | Weather, predictive maintenance, fatigue patterns, shift timeline | Weather API integration; ML pipeline for predictions; aggregation queries over `scoop_logs` / `downtime_logs` |
| ComplianceHub | Training records, competent persons, SDS library lists | New tables `inductions`, `training_records`, `competent_persons`, `sds_library` + CRUD UI |
| ComplianceHub induction form | Form is interactive but doesn't persist | Insert into `inductions` table once it exists |
| ChecksHub → Maintenance | Hardcoded SMH-based recommendations | Build a list view over `maintenance_logs` (table exists) |
| ChecksHub → Diagnostics | `CAT_DEMO` constant + `DIAG_EXT` | Read `visionlink_cache` once VL credentials connected |
| Team tab machine rankings | `MACHINE_PERF` constant | Aggregate from `daily_production` / `scoop_logs` over rolling 7-day window. Today operator leaderboard is already real |

## Deferred features

- **Shift scheduling module** — schema + 5 screens + auto-schedule algorithm
  (separate brief covers it).
- **Capacitor iOS wrap** — bundle ID `com.mineops.app`; pending Apple
  Developer enrollment.
- **VisionLink production endpoints** — Edge Function currently fetches
  `assetSummary` only. Adding cycle-time / scoop counts is one new fetch in
  `supabase/functions/visionlink-sync/index.ts`.
- **Hard account deletion** — requires service-role Edge Function. Today the
  Account → Delete path soft-deletes (marks every membership inactive +
  signs out); the auth user record remains.

## Polish pass items

(Not blocking but should land in a focused visual sweep session.)

- Spacing audit — confirm every screen uses the 14/16/20 px rhythm
  consistently. Several older screens still have ad-hoc paddings.
- Extract a shared primary/secondary/danger/ghost button pattern; today
  each screen repeats its own button styles inline.
- Touch-target audit — most buttons are ≥44 px but a few inline icon
  buttons (camera 📷 on CkRow, ✕ remove on PrestartItemRow thumbnails) are
  smaller and could be padded.
- Transition consistency — most screens fade in; some Setup sub-screens
  cut in. Standardise on a shared `className="up"` animation.

## Minor warnings (cosmetic, not user-facing)

These show as TypeScript "declared but never read" warnings during build —
all benign:

- `getCheckPhotoUrl` — slot for rendering check photos in Records detail
  (planned). Harmless dead reference until then.
- `tphCol`, `cycCol` inside IntelligenceHub — local helpers that fell out of
  use during the IA reorg. Will clear when IntelligenceHub is wired to real
  data.
- A few `machineType` unused params inside the legacy `DemoPhoto` / `CkRow`
  primitives.

## Tested paths (manual walk, 2026-06-02)

- Sign up new user → onboarding → create mine → share code displayed,
  copyable, navigator.share works ✓
- Join with code → operator role assigned → routed into Today ✓
- Today screen quick actions all route correctly ✓
- Pre-start check with required photos → photos upload, log saved, toast
  success ✓
- End-of-shift tonnage → `daily_production` row created, Records reflects it ✓
- Vehicle Check → `vehicle_checks` row + photos saved, appears in Records ✓
- Compliance View → enters read-only, PIN gate prompts on exit ✓
- Switch Mine → multi-mine picker, last_active updates ✓
- Account → name edit, change password (email sent), delete account
  (soft-deletes + signs out) ✓
- Menu hamburger across roles → opens without crashing (regression fix in
  commit 59bf4a0 holding) ✓
- Records Hub category tiles → drill into per-type list, day filters work,
  detail renderers correct per type ✓

## Open questions for Ty

None blocking. The next decisions (when ready):
- Shift scheduling priority vs other features.
- Apple Developer enrollment timing → triggers Capacitor wrap.
- When real VisionLink creds arrive → enables Diagnostics + sync schedule.
