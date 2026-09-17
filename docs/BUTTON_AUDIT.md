# Button & Flow Audit — update 2026-09-17

Original 2026-06-01 audit plus the App Store / SaaS pass.

Legend unchanged: **WORKS** · **BROKEN** · **DEAD** · **PLACEHOLDER** · **PARTIAL** · **NOTE**

---

## Removed

Fire extinguishers are gone from menu, setup, records categories, and flows (`fireInspect`, `extinguisherLocations`). Tables may still exist in the database; the app does not read or write them.

---

## Bottom nav

### Operator
| Tab | Target | Status |
|-----|--------|--------|
| Today | `TodayScreen` | WORKS |
| Checks | `ChecksHub` | WORKS — maintenance + diagnostics now real/empty |
| Prod | `ProductionScreen` | WORKS |
| Schedule | `ScheduleTabHub` | WORKS (schema + UI) |
| Records | `RecordsHub` | WORKS — no fire-ext category |

### Supervisor / manager
| Tab | Target | Status |
|-----|--------|--------|
| Live | `LiveBoard` | WORKS |
| Prod | `ProductionScreen` | WORKS |
| Team | `TeamRankings` | WORKS — `daily_production` + scoops + downtime; no `MACHINE_PERF` |
| Intel | `IntelligenceHub` | WORKS — live aggregates or honest empty (no demo weather/ML) |
| Records | `RecordsHub` | WORKS |

Schedule / Compliance / Billing / VisionLink / Platform are in ☰.

---

## Checks hub

| Sub | Status |
|-----|--------|
| Daily Machine Check | WORKS |
| Maintenance | WORKS — read `maintenance_logs` |
| Diagnostics | WORKS — `visionlink_cache` or “connect VisionLink” empty |

---

## Compliance / Intel / Team (was PLACEHOLDER)

| Screen | Status |
|--------|--------|
| ComplianceHub | WORKS — `inductions`, `training_records`, `competent_persons`, `sds_library` persist |
| IntelligenceHub | WORKS — production, downtime, VL; no fake live intel |
| Team rankings | WORKS — rate / consistency / utilization |

---

## New admin / SaaS

| Screen | Status |
|--------|--------|
| Create mine | WORKS — company + mine; RPC `create_org_and_mine` with insert fallback |
| VisionLink setup | WORKS — creds upsert + sync |
| Billing | WORKS — scaffolding, no live charge without keys |
| Platform super-admin | WORKS — if `platform_admins` / `VITE_PLATFORM_ADMIN_EMAILS` |

---

## Remaining PARTIAL (unchanged quality)

Silent-ish fetch errors on some older hooks (`console` + toast on writes). Hard delete of auth users still deferred.
