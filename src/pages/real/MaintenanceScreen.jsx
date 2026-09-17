import { useEffect, useState } from "react"
import { C, F } from "../../lib/theme.js"
import { EmptyState, Notice, PageHdr, Pill } from "../../ui/primitives.jsx"

export default function MaintenanceScreen({ supabase, activeMine, allMachines, toast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [sel, setSel] = useState(null)

  const load = async () => {
    if (!activeMine?.id) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErr("")
    try {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("mine_id", activeMine.id)
        .order("logged_at", { ascending: false })
        .limit(300)
      if (error) throw error
      setRows(data || [])
    } catch (e) {
      setErr(e.message || "Couldn't load maintenance logs.")
      toast?.error?.(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMine?.id])

  const machineLabel = (id) => (allMachines || []).find((m) => m.id === id)?.model || id || "Machine"
  const byMachine = {}
  for (const r of rows) {
    const k = r.machine_id || "_none"
    if (!byMachine[k]) byMachine[k] = []
    byMachine[k].push(r)
  }

  if (sel) {
    const list = byMachine[sel] || []
    return (
      <div style={{ paddingBottom: 80 }} className="up">
        <PageHdr title={machineLabel(sel)} sub={`${list.length} log${list.length !== 1 ? "s" : ""}`} back onBack={() => setSel(null)} />
        <div style={{ padding: "12px 15px" }}>
          {list.length === 0 && <EmptyState icon="🔧" title="No logs for this machine" body="Maintenance logged at the pre-start gate will appear here." />}
          {list.map((r) => (
            <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16 }}>{r.task_id || "Maintenance"}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {r.technician_name || "Technician"}
                    {r.supervisor_approved_by ? ` · Supervisor ${r.supervisor_approved_by}` : ""}
                  </div>
                </div>
                <Pill label={r.logged_at ? new Date(r.logged_at).toLocaleDateString() : "—"} color={C.info} />
              </div>
              {(r.smh_at_service != null || r.hours_at_service != null) && (
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 8 }}>SMH / hours: {r.smh_at_service ?? r.hours_at_service}</div>
              )}
              {r.notes && <div style={{ fontSize: 12, color: C.textSub, marginTop: 6, lineHeight: 1.45 }}>{r.notes}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Maintenance" sub="From pre-start gate · maintenance_logs" />
      <div style={{ padding: "12px 15px" }}>
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && <div style={{ textAlign: "center", padding: 28, color: C.muted, fontSize: 13 }}>Loading logs…</div>}
        {!loading && !activeMine?.id && (
          <EmptyState icon="🔧" title="Sign into a mine" body="Maintenance history is stored per mine. Demo SMH recommendations have been removed." />
        )}
        {!loading && activeMine?.id && rows.length === 0 && (
          <EmptyState icon="🔧" title="No maintenance logged yet" body="When an operator clears the pre-start maintenance gate, those tasks land here. Nothing is invented." />
        )}
        {!loading && Object.keys(byMachine).map((mid) => {
          const list = byMachine[mid]
          const latest = list[0]
          return (
            <button
              key={mid}
              onClick={() => setSel(mid)}
              style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 15px", marginBottom: 8, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16, color: C.text }}>{machineLabel(mid)}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {list.length} log{list.length !== 1 ? "s" : ""} · last {latest?.logged_at ? new Date(latest.logged_at).toLocaleString() : "—"}
                  </div>
                </div>
                <span style={{ color: C.muted }}>›</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
