import { useEffect, useState } from "react"
import { C, F, todayYmd, daysAgo } from "../../lib/theme.js"
import { EmptyState, Notice, PageHdr, Pill, Stat } from "../../ui/primitives.jsx"

export default function IntelligenceHub({ supabase, activeMine, allMachines, remoteOperators }) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [prod, setProd] = useState([])
  const [downs, setDowns] = useState([])
  const [maints, setMaints] = useState([])
  const [vlRows, setVlRows] = useState([])
  const [vlCred, setVlCred] = useState(null)

  useEffect(() => {
    if (!activeMine?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr("")
      try {
        const from = daysAgo(6)
        const [p, d, m, v, c] = await Promise.all([
          supabase.from("daily_production").select("date,tonnage,operator_id,machine_id").eq("mine_id", activeMine.id).gte("date", from),
          supabase.from("downtime_logs").select("category,duration_min,logged_at,machine_id,note").eq("mine_id", activeMine.id).gte("logged_at", `${from}T00:00:00`).limit(200),
          supabase.from("maintenance_logs").select("task_id,machine_id,logged_at,notes").eq("mine_id", activeMine.id).order("logged_at", { ascending: false }).limit(40),
          supabase.from("visionlink_cache").select("machine_id,payload,fetched_at").eq("mine_id", activeMine.id),
          supabase.from("visionlink_credentials").select("last_poll_at,last_error").eq("mine_id", activeMine.id).maybeSingle(),
        ])
        if (cancelled) return
        if (p.error) throw p.error
        setProd(p.data || [])
        setDowns(d.data || [])
        setMaints(m.data || [])
        setVlRows(v.data || [])
        setVlCred(c.data || null)
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load intelligence.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeMine?.id, supabase])

  const today = todayYmd()
  const todayTons = prod.filter((r) => r.date === today).reduce((a, r) => a + Number(r.tonnage || 0), 0)
  const weekTons = prod.reduce((a, r) => a + Number(r.tonnage || 0), 0)
  const downMin = downs.reduce((a, r) => a + Number(r.duration_min || 0), 0)
  const downByCat = {}
  for (const r of downs) {
    const k = r.category || "other"
    downByCat[k] = (downByCat[k] || 0) + Number(r.duration_min || 0)
  }
  const topDown = Object.entries(downByCat).sort((a, b) => b[1] - a[1])[0]
  const faults = []
  for (const row of vlRows) {
    const p = row.payload || {}
    const list = p.faults || p.faultCodes || p.diagnostics || []
    if (Array.isArray(list)) {
      for (const f of list) {
        faults.push({
          machineId: row.machine_id,
          code: f.code || f.faultCode || f.id || "FAULT",
          desc: f.desc || f.description || f.message || "VisionLink fault",
        })
      }
    }
  }

  if (!activeMine?.id) {
    return (
      <div style={{ paddingBottom: 80 }} className="up">
        <PageHdr title="Intelligence" sub="Production · downtime · VisionLink" />
        <EmptyState icon="🧠" title="Sign into a mine" body="Intelligence uses live production, downtime, and VisionLink data for the active mine — no demo figures." />
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Intelligence" sub={`${activeMine.name} · last 7 days · live data only`} />
      <div style={{ padding: "12px 15px" }}>
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && <div style={{ textAlign: "center", padding: 28, color: C.muted, fontSize: 13 }}>Loading site intelligence…</div>}

        {!loading && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <Stat label="Today" value={`${Math.round(todayTons).toLocaleString()}t`} color={todayTons ? C.accent : C.muted} />
              <Stat label="7-day total" value={`${Math.round(weekTons).toLocaleString()}t`} color={weekTons ? C.success : C.muted} />
              <Stat label="Downtime" value={downMin ? `${Math.round(downMin)}m` : "0m"} color={downMin > 60 ? C.danger : C.info} />
            </div>

            {weekTons === 0 && downs.length === 0 && (
              <EmptyState
                icon="📡"
                title="No live intel yet"
                body="End-of-shift tonnage and downtime logs will appear here. Weather, ML predictions, and fatigue alerts stay empty until those sources are connected — we will not invent numbers."
              />
            )}

            {weekTons > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>7-day production</div>
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: 28, color: C.success, lineHeight: 1.1 }}>{Math.round(weekTons).toLocaleString()}<span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}> t</span></div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{prod.length} shift entries · {new Set(prod.map((r) => r.operator_id)).size} operators</div>
              </div>
            )}

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Downtime</div>
              {downs.length === 0 ? (
                <div style={{ fontSize: 13, color: C.muted }}>No downtime logged this week.</div>
              ) : (
                <>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 22, color: C.amber }}>{Math.round(downMin)} min</div>
                  {topDown && <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>Top cause: {topDown[0].replace(/_/g, " ")} · {Math.round(topDown[1])} min</div>}
                </>
              )}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>VisionLink</div>
                <Pill label={vlCred ? (vlCred.last_error ? "ERROR" : "CONNECTED") : "NOT CONNECTED"} color={vlCred && !vlCred.last_error ? C.success : C.muted} />
              </div>
              {!vlCred && (
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Connect CAT VisionLink in Setup to surface asset summary and faults here.</div>
              )}
              {vlCred?.last_error && <Notice tone="danger">{vlCred.last_error}</Notice>}
              {vlCred && !vlCred.last_error && (
                <div style={{ fontSize: 12, color: C.textSub }}>
                  Last sync {vlCred.last_poll_at ? new Date(vlCred.last_poll_at).toLocaleString() : "never"} · {vlRows.length} cached asset{(vlRows.length !== 1) ? "s" : ""}
                  {faults.length > 0 ? ` · ${faults.length} fault signal${faults.length !== 1 ? "s" : ""}` : " · no faults in cache"}
                </div>
              )}
              {faults.slice(0, 4).map((f, i) => {
                const m = (allMachines || []).find((x) => x.id === f.machineId)
                return (
                  <div key={i} style={{ marginTop: 8, padding: "8px 10px", background: `${C.danger}10`, border: `1px solid ${C.danger}33`, borderRadius: 8, fontSize: 12 }}>
                    <b style={{ color: C.danger }}>{f.code}</b> · {m?.model || f.machineId} — {f.desc}
                  </div>
                )
              })}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Recent maintenance</div>
              {maints.length === 0 ? (
                <div style={{ fontSize: 13, color: C.muted }}>No maintenance logs yet. Pre-start gate entries will show here.</div>
              ) : (
                maints.slice(0, 5).map((row, i) => {
                  const m = (allMachines || []).find((x) => x.id === row.machine_id)
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}22`, fontSize: 12 }}>
                      <span>{m?.model || row.machine_id} · {row.task_id || "task"}</span>
                      <span style={{ color: C.muted }}>{row.logged_at ? new Date(row.logged_at).toLocaleDateString() : ""}</span>
                    </div>
                  )
                })
              )}
            </div>

            <Notice>
              Weather, predictive ML, and fatigue notifications are not connected. Those tiles stay empty rather than showing sample data. Operator names are from the live crew list ({(remoteOperators || []).length} people).
            </Notice>
          </>
        )}
      </div>
    </div>
  )
}
