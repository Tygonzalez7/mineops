# Button & Flow Audit — 2026-06-01

`src/App.jsx` is 6,323 lines / 87 top-level functions / 211 `onClick` handlers
/ 78 `supabase.from(...)` references / 32 `setFlow` callsites / 10 `setTab`
callsites. This audit covers the interactive surface and the data layer.

Legend: **WORKS** (verified live), **BROKEN** (wired but doesn't function),
**DEAD** (defined but unreachable), **PLACEHOLDER** (visible but no-op or demo
only), **PARTIAL** (works but missing save/error/empty states), **NOTE**
(observation, not necessarily a bug).

---

## 1 — Routing surface

### Bottom Nav (operator)
| Tab | Target | Status |
|-----|--------|--------|
| 🏠 Today | `<TodayScreen>` | WORKS |
| ✅ Checks | `<ChecksHub>` | PARTIAL — sub-screens vary; see §3 |
| 📈 Production | `<ProductionScreen>` | WORKS |
| 📁 Records | `<RecordsHub>` | WORKS |

### Bottom Nav (supervisor / manager)
| Tab | Target | Status |
|-----|--------|--------|
| 📡 Live | `<LiveBoard>` | WORKS |
| 📈 Production | `<ProductionScreen>` | WORKS |
| 👷 Team | `<MachinePerformanceScreen>` | PARTIAL — demo data only, no Supabase write |
| 📁 Records | `<RecordsHub>` | WORKS |
| 🧠 Intel | `<IntelligenceHub>` | PLACEHOLDER — entirely demo data |

### Flow names referenced via `setFlow(...)`
All have matching `{flow==="X"&&...}` render blocks. No dead flow setters.

### Flow names rendered (some only reachable via `onNav`)
| Flow | Reachable from | Status |
|------|---------------|--------|
| `auth` | initial state, sign-out | WORKS |
| `onboarding` | post-sign-in if no mine | WORKS |
| `createMine` / `joinMine` / `shareCode` | Onboarding / Add Mine | WORKS |
| `minePicker` | menu, multi-mine load | WORKS |
| `account` | menu | WORKS |
| `setup` | menu (admin) | WORKS |
| `people` / `shareCode` / `compliancePin` / `plants` / `workplaceAreas` / `extinguisherLocations` / `checkItemConfig` / `addMachine` / `inspHistory` | Setup hub | WORKS |
| `compliance` | menu | WORKS |
| `tickets` / `ticketDetail` / `reportIssue` | menu, screen CTAs | WORKS |
| `workplaceExam` | menu (operator), Today CTA | WORKS |
| `fireInspect` | menu | WORKS |
| `vehicleCheck` | menu, Today | WORKS |
| `truckQ` / `truckCheck` / `machines` | post-sign-in legacy chain | NOTE — only `truckQ` then `machines` for operators; works |

---

## 2 — Menu overlay (☰)

### Issues section (all roles)
| Item | onClick | Status |
|------|---------|--------|
| 🎟 Handover Tickets | `onNav("tickets")` | WORKS |
| 🚨 Report Issue | `onNav("reportIssue")` | WORKS |

### Quick start (operator only — `lv===1`)
| Item | Status |
|------|--------|
| 🗺 Workplace Exam | WORKS |
| 🧯 Fire Extinguishers | WORKS |

### Other (all + manager extras)
| Item | Status |
|------|--------|
| 🚗 Vehicle Check | WORKS |
| ✅ Checks Hub (manager+) | WORKS |
| 🧯 Fire Extinguishers (manager+) | WORKS — duplicate of operator entry but acceptable |
| 📋 Compliance (manager+) | PARTIAL — routes to `<ComplianceHub>` which is mostly demo |

### Mine (all roles)
| Item | Status |
|------|--------|
| 🔀 Switch Mine | WORKS |
| 🔒 Compliance View | WORKS |
| 👤 Account | WORKS |

### Admin (admin / minemanager)
| Item | Status |
|------|--------|
| ⚙ Setup | WORKS |

---

## 3 — Per-screen audit

### TodayScreen — WORKS
All quick-action buttons route correctly. Required-today checklist
correctly polls `workplace_exams`, `prestart_logs`, `daily_production`.
Empty-state copy + machine-status card both fall back gracefully when
demo/no real data.

### ProductionScreen — WORKS
- End Shift CTA + EndShiftModal upserts into `daily_production` correctly.
- Sub-tabs (Production / Downtime / Blast) work.
- Idle simulation button only writes to `downtime_logs` when an active
  shift exists; silently no-ops in demo. **PARTIAL** — should show a
  hint in demo mode.

### RecordsHub — WORKS
Category-first view + per-type detail renderers all wired. Lazy-loads
handover photos + fire-ext serial photos. Lightbox renders. The vehicle
check renderer correctly hydrates item labels from `VEHICLE_CHECK_SECTIONS`.

### MachineCheckScreen — WORKS
Photo-required items block sign-off; photos upload after insert; row goes
to `prestart_logs`. Empty state when no machines in fleet. Bug fix from
prior commit (`viewingPhoto` undeclared) confirmed gone.

### ChecksHub — DEAD (sub-screens mostly demo)
The hub itself works as a router. But three of its four sub-screens have
serious issues:
| Sub | Status | Notes |
|-----|--------|-------|
| Maintenance | PLACEHOLDER | `<MaintenanceScreen>` is entirely demo data with hardcoded `MAINT_TASKS` + `FIXED_PLANT`. No `supabase.from(...)` write. Tap-to-log a maintenance task does nothing persistent. |
| Daily Machine Check | WORKS | (See above) |
| Site Area Check | PLACEHOLDER | `<SiteCheckScreen>` only updates local state. **No Supabase write at all.** The "submit" button just flips `done[sel]=true` in component state — data never persists. Records Hub will never see these. |
| Machine Diagnostics | PLACEHOLDER | `<DiagnosticsScreen>` is entirely demo data from `CAT_DEMO`. No reads from real machines / VL cache. |

### TruckCheckScreen (Vehicle) — WORKS
Pass/Fail/NA, photo capture via check-photos, summary + submit to
`vehicle_checks`. Record appears in Records Hub.

### WorkplaceExamScreen — WORKS
Insert + acknowledge-prior both work. Records hub renders.

### FireExtinguisherInspectScreen — WORKS
Three-stage flow. Photo capture, dedupe by serial, RLS-correct insert.

### LiveBoard — WORKS
Demo mode uses `USERS` constant; real mode pulls from `remoteOperators`.
Empty state when no production operators.

### MachinePerformanceScreen (Team tab) — PARTIAL
- `TodayLeaderboard` reads `daily_production` correctly.
- The per-machine rankings below use hardcoded `MACHINE_PERF` demo
  data + `custPerfData` for added machines. For real mines this list
  shows zero machines with data. Empty state already exists, just
  flagging that the data is demo until aggregates are wired.

### IntelligenceHub — PLACEHOLDER
Entirely demo content (`WEATHER_NOW`, `PREDICTIVE_ALERTS`,
`FATIGUE_PATTERNS`, `SHIFT_TIMELINE`). No Supabase reads. Looks rich
but populated with constants. Not gated for real mines.

### ComplianceHub — PARTIAL
- Training records, competent persons, SDS library lists all render
  from hardcoded `DEMO_TRAINING` / `DEMO_COMPETENT` / `DEMO_SDS`.
- Induction form is the only interactive piece; it sets local state but
  doesn't persist anywhere. No `inductions` table.
- Dead `onClick`-less buttons were cleaned up in a prior commit, but
  the underlying screen is mostly demo.

### SetupHub — WORKS
Every row routes to its target. PlantsAdmin / WorkplaceAreas /
ExtinguisherLocations / CheckItemConfig / People / ShareCode /
CompliancePin / AddMachine / PreshiftHistory all wired.

### Auth + Onboarding + MinePicker + ShareCode + Account + People — WORKS
Full sweep of these screens in commits `0b1875b…e695c69` is solid.

---

## 4 — Supabase reads / writes

Tables referenced and confirmed against Ty's table list:
```
mines, operators, machines, shifts,
prestart_logs, scoop_logs, downtime_logs, maintenance_logs,
handover_tickets, handover_photos,
workplace_areas, workplace_exams,
plants, extinguisher_locations, fire_extinguishers,
fire_extinguisher_inspections,
daily_production, vehicle_checks,
check_item_config, check_photos, reference_photos
```
All exist. Not used in `App.jsx` (used elsewhere or unused):
`plant_equipment`, `visionlink_cache`, `visionlink_credentials`
(the last two live in the Edge Function).

### Save reliability — gaps
| Write | Loading state | Friendly error | Refetch | Verdict |
|-------|--------------|----------------|---------|---------|
| `prestart_logs.insert` (MachineCheckScreen) | yes | `alert()` (raw) | yes (setDone) | PARTIAL — alert is harsh, no toast |
| `vehicle_checks.insert` (TruckCheckScreen) | yes | inline err | done screen | WORKS |
| `daily_production.upsert` (EndShiftModal) | yes | inline err | refresh tick | WORKS |
| `workplace_exams.insert` | yes | inline err | yes | WORKS |
| `downtime_logs.insert` (idle modal) | no | `console.error` only | none | BROKEN — no UI feedback at all on success/fail |
| `maintenance_logs.insert` (MaintenanceGate clear) | no | `console.error` | yes | PARTIAL |
| `fire_extinguisher_inspections.insert` | yes | inline err | yes | WORKS |
| `handover_tickets.insert` (CreateTicketScreen) | yes | inline err | yes | WORKS |
| `handover_tickets.update` (TicketDetailScreen close) | yes | none | no | PARTIAL — silent on error |
| `extinguisher_locations.insert/update` | yes | err state | yes | WORKS |
| `workplace_areas.insert/update` | yes | err state | yes | WORKS |
| `plants.insert/update` | yes | err state | yes | WORKS |
| `mines.insert` (CreateMineFlow) | yes | friendly | yes | WORKS |
| `mines.update` (regenerate code, save PIN) | yes | inline err | yes | WORKS |
| `operators.insert` (JoinMineFlow) | yes | friendly | yes | WORKS |
| `operators.update` (PeopleScreen role/active) | yes | `alert()` | refetch | PARTIAL |
| `check_item_config.upsert` | yes | `alert()` | refetch | PARTIAL |
| `check_photos.insert` (background after log save) | n/a | `console.error` | n/a | NOTE — failures swallowed |
| `daily_production.upsert` admin manual entry | n/a | n/a | n/a | NOTE — no admin manual entry exists |

### Read reliability — gaps
| Read | Loading | Empty state | Error | Verdict |
|------|---------|------------|-------|---------|
| MinePickerScreen | yes | yes | yes | WORKS |
| PeopleScreen | yes | yes | yes (`alert` on save) | WORKS |
| RecordsHub | yes | yes | console only | PARTIAL — silent on table fetch error |
| TodayScreen | yes | implicit | swallowed | PARTIAL |
| TodayLeaderboard | yes | yes | console only | PARTIAL |
| useShiftProduction / useDailyProduction / useCycleTelemetry | yes | yes | console only | PARTIAL |
| PreshiftHistoryScreen | yes | yes | error state | WORKS |

---

## 5 — Dead code (unused but defined)

| Identifier | Line | Action |
|-----------|------|--------|
| `MiniLine` (component) | 285 | DELETE — orphaned since charts moved to LineChart/BarChart |
| `PlantPicker` (component) | 2557 | DELETE — wired nowhere |
| `fmt$` (helper) | 79 | DELETE — only used by deleted screens |
| `scGrade` (helper) | 80 | DELETE |
| `getCrusherFeed` (helper) | 156 | DELETE |
| `C1_FEED`, `C2_FEED` (constants) | 162-163 | DELETE |
| `SIZES` (constant — old scoop logger sizes) | 179 | DELETE |
| `FUEL_RATES` (constant) | 3369 | DELETE — only IntelligenceHub demo referenced it |
| `DEMO_MINES` (constant) | 5107 | DELETE — pre-Supabase mock |
| `faultPts` (local var inside Diagnostics) | 2106 | DELETE — unused |
| `pendingApproval` (state) | unknown | INVESTIGATE — flagged in diagnostics |
| `getCheckPhotoUrl` (helper) | 2677 | KEEP for now — will be used when check photos render in Records detail; harmless dead reference |
| `setCode` (state — JoinMineFlow legacy) | 5395 | DELETE — leftover destructure from rewritten flow |
| `searchLoading` (state — JoinMineFlow legacy) | 5399 | DELETE — same |

---

## 6 — Crash / robustness hotspots

| Location | Risk |
|----------|------|
| `loadProfile` — `chosen.id.slice(0,8)` | `chosen.id` always uuid; safe |
| Hamburger crash | RESOLVED in commit `59bf4a0` (added `activeMine` to MenuOverlay destructure) |
| `URL.createObjectURL` cleanup | Audited — every site uses an effect cleanup |
| `Object.entries(rec.raw)` in old Records dump | Replaced with per-type renderers — safe |
| `JSON.parse` on user input | None present — all jsonb is read raw |
| RecordsHub `mineMap` lookup with no remoteOperators | Safe — falls through to "Operator" default |
| ComplianceView `activeMine.id` | Renders only when set; safe |

No active crash risks identified beyond the resolved menu bug.

---

## 7 — Action items for Phase 2

Grouped for incremental commits:

### A. Dead-code purge (one commit)
Drop the 12 unused identifiers in §5.

### B. Sub-screens of ChecksHub
- **SiteCheckScreen**: either wire it to `workplace_exams` (re-using the existing table) OR remove the entry from ChecksHub. The data overlaps with Workplace Exam entirely. **Decision: remove from ChecksHub; redirect to `workplaceExam` flow.** Site area inspection is what Workplace Exam already covers.
- **MaintenanceScreen**: currently only displays demo SMH-based recommendations. Real maintenance is logged via `<MaintenanceGate>` during pre-start. **Decision: convert MaintenanceScreen to a read-only viewer over `maintenance_logs`.**
- **DiagnosticsScreen**: works as a VL telemetry viewer once `visionlink_cache` is populated. **Decision: gate it behind "VisionLink connected" check; show "Connect VisionLink in Setup" empty state otherwise.**

### C. IntelligenceHub
Entirely demo. Two options:
1. Replace with real reads (weather API + predictive ML are both follow-up features).
2. Keep visible but with a "Preview · uses demo data" banner.
**Decision: ship option 2 banner now; remove demo data + wire real sources in a separate feature pass.**

### D. ComplianceHub
Two options:
1. Build the missing tables (`inductions`, `training_records`, `competent_persons`, `sds_library`).
2. Add a "Preview · demo data" banner.
**Decision: option 2 banner; full compliance management is a separate substantial feature.**

### E. Save-reliability uplift (Phase 3)
Replace every `alert()` with an in-app toast. Wrap every silent
`console.error` insert into a try/catch that surfaces a friendly error
inline. Add success toasts for downtime log, ticket close, role change,
check-item-config toggle.

### F. Clean up legacy destructure leftovers
`setCode`, `searchLoading` in JoinMineFlow are unused after the
single-screen rewrite. Drop.

---

Audit complete. Phase 2 begins with the dead-code purge.
