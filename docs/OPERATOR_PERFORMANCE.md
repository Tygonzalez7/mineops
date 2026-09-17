# Operator performance

MineOps ranks operators on **how they produce**, not how long they sit in a seat.

## Primary metrics

| Metric | What it is | Source |
|--------|------------|--------|
| **Tons / hour** | Tonnes ÷ productive hours | `daily_production` + shift/downtime |
| **Loads / hour** | Scoop or trip count ÷ productive hours | `scoop_logs` (VisionLink-populated) |
| **Cycle-time consistency** | `100 × (1 − σ/μ)` of cycle minutes. Higher = more repeatable | `scoop_logs.cycle_time_min` |
| **Utilization** | Productive time ÷ rostered shift time after downtime | `downtime_logs` vs assumed or logged shift length |

**Not ranked:** raw SMH, clock hours, “hours on machine.” Those remain diagnostic (VisionLink asset summary) but do not win a leaderboard.

## How rankings work

- Window: rolling **7 days** on the Team tab; **today** on the compact leaderboard.
- Loaders / excavators: sort by tons/hour, then consistency, then utilization.
- Haul trucks: sort by loads/hour, then consistency, then utilization.
- Productive hours = shift hours (default 10h × shifts logged) minus downtime minutes. A floor of 0.25h avoids divide-by-zero.
- Consistency needs **at least two** cycle samples; otherwise the tile shows “—”.
- Empty mines show an honest empty state — no `MACHINE_PERF` demo rows.

## Leaderboards

- **Today** — `daily_production` for today’s date (`TodayLeaderboard`).
- **Team / machine** — `src/pages/real/TeamRankings.jsx` + `src/lib/performance.js`.

## What we will not do

- Inflate scores with demo operators.
- Treat VisionLink hour-meter as a productivity trophy.
- Show “fatigue” or “predicted t/hr” unless those are computed from real logs (Intelligence stays empty for ML until a real model exists).
