import { useEffect, useMemo, useState } from "react"
import { C, F, daysAgo, initials, isMachTruck } from "../../lib/theme.js"
import { cycleConsistency, loadsPerHour, productiveHours, rankKey, tonsPerHour, utilizationPct } from "../../lib/performance.js"
import { EmptyState, Notice, PageHdr, Pill, Stat } from "../../ui/primitives.jsx"

export default function TeamRankings({ supabase, activeMine, allMachines, remoteOperators, TodayLeaderboard }) {
  const [sel, setSel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [prod, setProd] = useState([])
  const [scoops, setScoops] = useState([])
  const [downs, setDowns] = useState([])
  const [_shifts, setShifts] = useState([])

  useEffect(() => {
    if (!activeMine?.id) {
      setLoading(false)
      setProd([])
      setScoops([])
      setDowns([])
      setShifts([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr("")
      try {
        const from = daysAgo(6)
        const [p, s, d, sh] = await Promise.all([
          supabase.from("daily_production").select("operator_id,machine_id,tonnage,date,shift_id").eq("mine_id", activeMine.id).gte("date", from),
          supabase.from("scoop_logs").select("operator_id,machine_id,shift_id,tonnes,cycle_time_min,logged_at").eq("mine_id", activeMine.id).gte("logged_at", `${from}T00:00:00`).limit(2000),
          supabase.from("downtime_logs").select("machine_id,duration_min,logged_at,shift_id").eq("mine_id", activeMine.id).gte("logged_at", `${from}T00:00:00`).limit(500),
          supabase.from("shifts").select("id,operator_id,shift_start,shift_end,status").eq("mine_id", activeMine.id).gte("shift_start", `${from}T00:00:00`).limit(400),
        ])
        if (cancelled) return
        if (p.error) throw p.error
        setProd(p.data || [])
        setScoops(s.error ? [] : s.data || [])
        setDowns(d.error ? [] : d.data || [])
        setShifts(sh.error ? [] : sh.data || [])
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load rankings.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeMine?.id, supabase])

  const opName = (id) => (remoteOperators || []).find((o) => o.id === id)?.name || "Operator"

  const ranked = useMemo(() => {
    const machines = allMachines || []
    return machines.map((m) => {
      const truck = isMachTruck(m.type)
      const pRows = prod.filter((r) => r.machine_id === m.id)
      const sRows = scoops.filter((r) => r.machine_id === m.id)
      const dRows = downs.filter((r) => r.machine_id === m.id)
      const byOp = new Map()
      const touch = (opid) => {
        if (!byOp.has(opid)) {
          byOp.set(opid, { operatorId: opid, name: opName(opid), tons: 0, loads: 0, cycles: [], downMin: 0, shifts: new Set() })
        }
        return byOp.get(opid)
      }
      for (const r of pRows) {
        const o = touch(r.operator_id)
        o.tons += Number(r.tonnage || 0)
        if (r.shift_id) o.shifts.add(r.shift_id)
      }
      for (const r of sRows) {
        const oid = r.operator_id || pRows.find((p) => p.shift_id === r.shift_id)?.operator_id
        if (!oid) continue
        const o = touch(oid)
        o.loads += 1
        o.tons += Number(r.tonnes || 0)
        if (r.cycle_time_min) o.cycles.push(Number(r.cycle_time_min))
        if (r.shift_id) o.shifts.add(r.shift_id)
      }
      for (const r of dRows) {
        const oid = pRows.find((p) => p.shift_id === r.shift_id)?.operator_id
        if (!oid) continue
        touch(oid).downMin += Number(r.duration_min || 0)
      }
      const ops = [...byOp.values()].map((o) => {
        const shiftCount = Math.max(o.shifts.size, o.tons > 0 || o.loads > 0 ? 1 : 0)
        const hours = productiveHours({ shiftHours: 10 * Math.max(1, shiftCount), downtimeMin: o.downMin })
        const tph = tonsPerHour(o.tons, hours)
        const lph = loadsPerHour(o.loads, hours)
        const consistency = cycleConsistency(o.cycles)
        const utilization = utilizationPct({ shiftHours: 10 * Math.max(1, shiftCount), downtimeMin: o.downMin })
        return {
          ...o,
          avatar: initials(o.name),
          shifts: shiftCount,
          tph: Math.round(tph * 10) / 10,
          loadsPerHour: Math.round(lph * 10) / 10,
          consistency,
          utilization,
          weeklyTons: Math.round(o.tons),
        }
      }).filter((o) => o.weeklyTons > 0 || o.loads > 0)
        .sort((a, b) => rankKey(b, truck) - rankKey(a, truck))
      return { m, truck, ops }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- opName from remoteOperators
  }, [allMachines, prod, scoops, downs, remoteOperators])

  const withData = ranked.filter((r) => r.ops.length > 0)
  const withoutData = ranked.filter((r) => r.ops.length === 0)

  if (sel) {
    const row = ranked.find((r) => r.m.id === sel)
    const truck = row?.truck
    return (
      <div style={{ paddingBottom: 20 }} className="sr">
        <PageHdr title={row?.m.model || sel} sub={`${row?.m.type} · 7-day rate & consistency`} back onBack={() => setSel(null)} />
        <div style={{ padding: "12px 15px" }}>
          {!row?.ops.length ? (
            <EmptyState icon="📊" title="No data this week" body="Rankings appear after operators log tonnage or VisionLink writes cycle scoops." />
          ) : (
            row.ops.map((op, i) => {
              const primary = truck ? op.loadsPerHour : op.tph
              const unit = truck ? "loads/hr" : "t/hr"
              const pc = primary >= (truck ? 2.5 : 150) ? C.success : primary > 0 ? C.accent : C.muted
              return (
                <div key={op.operatorId} style={{ background: i === 0 ? `${C.accent}08` : C.card, border: `1.5px solid ${i === 0 ? C.accent + "55" : C.border}`, borderRadius: 14, padding: "14px 15px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                    <div style={{ fontFamily: F, fontWeight: 900, fontSize: 22, width: 28, textAlign: "center", color: i === 0 ? C.accent : C.muted }}>#{i + 1}</div>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${pc}22`, border: `2px solid ${pc}55`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, fontSize: 14, color: pc }}>{op.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 17 }}>{op.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{op.shifts} shift{op.shifts !== 1 ? "s" : ""} · {op.weeklyTons.toLocaleString()} t</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 28, color: pc, lineHeight: 1 }}>{primary || "—"}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{unit}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                    <Stat small label="Cycle consistency" value={op.consistency != null ? `${op.consistency}` : "—"} color={op.consistency >= 80 ? C.success : C.amber} sub={op.consistency != null ? "0–100" : "need ≥2 cycles"} />
                    <Stat small label="Utilization" value={`${op.utilization}%`} color={op.utilization >= 80 ? C.success : C.amber} sub="vs downtime" />
                    <Stat small label={truck ? "t/hr" : "loads/hr"} value={truck ? op.tph : op.loadsPerHour || "—"} color={C.info} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Team" sub="Rate · cycle consistency · utilization — not raw hours" />
      <div style={{ padding: "12px 15px" }}>
        {TodayLeaderboard}
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && <div style={{ textAlign: "center", padding: 20, color: C.muted, fontSize: 13 }}>Loading weekly rankings…</div>}
        <div style={{ fontSize: 10, color: C.muted, fontFamily: F, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 4px 6px", marginTop: 6 }}>Machines · last 7 days</div>
        {!loading && (allMachines || []).length === 0 && (
          <EmptyState icon="⛏️" title="No machines yet" body="Add a machine from Setup. Operators appear here after they log tonnage." />
        )}
        {!loading && (allMachines || []).length > 0 && withData.length === 0 && (
          <EmptyState icon="📊" title="No rate data yet" body="Weekly rankings use tons or loads per productive hour, cycle-time consistency, and utilization. Raw hours are not ranked." />
        )}
        {withData.map(({ m, truck, ops }) => {
          const top = ops[0]
          const primary = truck ? top.loadsPerHour : top.tph
          const unit = truck ? "loads/hr" : "t/hr"
          const topC = primary >= (truck ? 2.5 : 150) ? C.success : C.accent
          return (
            <div key={m.id} onClick={() => setSel(m.id)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
                <div>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 17 }}>{m.model}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{m.type}</div>
                </div>
                <Pill label={`${ops.length} RANKED`} color={C.info} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface, borderRadius: 10, padding: "8px 11px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${topC}22`, border: `2px solid ${topC}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, fontSize: 10, color: topC }}>{top.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 13 }}>{top.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>#{1} · util {top.utilization}%{top.consistency != null ? ` · cycle ${top.consistency}` : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: topC, lineHeight: 1 }}>{primary}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{unit}</div>
                </div>
              </div>
            </div>
          )
        })}
        {withData.length > 0 && withoutData.length > 0 && (
          <div style={{ marginTop: 14, padding: "8px 12px", background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 9, fontSize: 11, color: C.muted, textAlign: "center" }}>
            {withoutData.length} other machine{withoutData.length !== 1 ? "s" : ""} · no rate data this week
          </div>
        )}
      </div>
    </div>
  )
}
