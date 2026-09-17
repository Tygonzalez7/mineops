import { useEffect, useState } from "react"
import { C, F } from "../../lib/theme.js"
import { EmptyState, Notice, PageHdr, Pill, Stat } from "../../ui/primitives.jsx"

function parseAsset(payload = {}) {
  const h = payload.equipmentHeader || payload.header || {}
  const hour = payload.hourMeter || payload.hours || {}
  const fuel = payload.fuelRemaining || payload.fuel || {}
  const status = payload.operatingStatus || payload.status || {}
  const faults = payload.faults || payload.faultCodes || payload.diagnostics || []
  return {
    serial: h.serialNumber || payload.serial_number || payload.serialNumber || null,
    model: h.model || h.makeModel || null,
    smh: hour.value != null ? Math.round(hour.value) : hour.hours != null ? Math.round(hour.hours) : null,
    fuelPct: fuel.percent != null ? Math.round(fuel.percent) : fuel.value != null ? Math.round(fuel.value) : null,
    status: status.value || status.code || status.name || (payload.vl_connected ? "operating" : null),
    engineTemp: payload.engineCoolantTemperature?.value ?? payload.engineTemp ?? null,
    util: payload.utilization?.value ?? payload.utilToday ?? null,
    faults: Array.isArray(faults)
      ? faults.map((f) => ({
          code: f.code || f.faultCode || f.id || "FAULT",
          sev: f.severity || f.sev || "medium",
          desc: f.desc || f.description || f.message || "VisionLink diagnostic",
        }))
      : [],
    rawKeys: Object.keys(payload || {}),
  }
}

export default function DiagnosticsScreen({ supabase, activeMine, allMachines, onSetupVisionLink }) {
  const [cache, setCache] = useState([])
  const [cred, setCred] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [sel, setSel] = useState(null)

  useEffect(() => {
    if (!activeMine?.id) {
      setLoading(false)
      setCache([])
      setCred(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr("")
      try {
        const [c, v] = await Promise.all([
          supabase.from("visionlink_credentials").select("last_poll_at,last_error,updated_at").eq("mine_id", activeMine.id).maybeSingle(),
          supabase.from("visionlink_cache").select("machine_id,serial_number,payload,fetched_at").eq("mine_id", activeMine.id),
        ])
        if (cancelled) return
        setCred(c.data || null)
        setCache(v.data || [])
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load VisionLink cache.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeMine?.id, supabase])

  const byId = Object.fromEntries((cache || []).map((r) => [r.machine_id, r]))
  const machines = allMachines || []

  if (sel) {
    const m = machines.find((x) => x.id === sel)
    const row = byId[sel]
    const parsed = parseAsset(row?.payload || {})
    return (
      <div style={{ paddingBottom: 80 }} className="up">
        <PageHdr title={m?.model || sel} sub={parsed.serial || row?.serial_number || "No serial in cache"} back onBack={() => setSel(null)} />
        <div style={{ padding: "12px 15px" }}>
          {!row ? (
            <EmptyState icon="⚙" title="No telemetry for this machine" body="Match the machine serial to VisionLink and run a sync from Setup." />
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <Stat label="SMH" value={parsed.smh != null ? parsed.smh.toLocaleString() : "—"} color={C.muted} />
                <Stat label="Fuel" value={parsed.fuelPct != null ? `${parsed.fuelPct}%` : "—"} color={parsed.fuelPct != null && parsed.fuelPct < 25 ? C.amber : C.success} />
                <Stat label="Util" value={parsed.util != null ? `${Math.round(parsed.util)}%` : "—"} color={C.info} />
              </div>
              {parsed.engineTemp != null && <Stat label="Engine temp" value={`${Math.round(parsed.engineTemp)}°`} color={parsed.engineTemp > 105 ? C.danger : C.success} />}
              <div style={{ margin: "10px 0" }}>
                <Pill label={(parsed.status || "CACHED").toString().toUpperCase()} color={C.info} />
                <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>Fetched {row.fetched_at ? new Date(row.fetched_at).toLocaleString() : "—"}</span>
              </div>
              {parsed.faults.length === 0 ? (
                <Notice tone="success">No fault codes in the latest asset summary.</Notice>
              ) : (
                parsed.faults.map((f, i) => (
                  <div key={i} style={{ background: C.card, borderLeft: `4px solid ${f.sev === "high" ? C.danger : C.amber}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <div style={{ fontFamily: F, fontWeight: 900, fontSize: 18, color: f.sev === "high" ? C.danger : C.amber }}>{f.code}</div>
                    <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>{f.desc}</div>
                  </div>
                ))
              )}
              <Notice>
                Extra telemetry (cycle, payload, fuel trend) will land in <b>visionlink_telemetry</b> as those CAT endpoints are enabled. Payload keys present: {parsed.rawKeys.slice(0, 8).join(", ") || "none"}.
              </Notice>
            </>
          )}
        </div>
      </div>
    )
  }

  const connected = !!cred && !cred.last_error

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Machine Diagnostics" sub="CAT VisionLink asset summary" />
      <div style={{ padding: "12px 15px" }}>
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && <div style={{ textAlign: "center", padding: 28, color: C.muted, fontSize: 13 }}>Checking VisionLink…</div>}
        {!loading && !activeMine?.id && (
          <EmptyState icon="⚙" title="Sign into a mine" body="Diagnostics read visionlink_cache for the active mine. Demo CAT figures have been removed." />
        )}
        {!loading && activeMine?.id && !cred && (
          <EmptyState
            icon="📡"
            title="VisionLink not connected"
            body="Add dealer credentials in Setup → CAT VisionLink. Asset summary will appear here after the first successful sync."
            cta={onSetupVisionLink ? "Open VisionLink setup →" : undefined}
            onCta={onSetupVisionLink}
          />
        )}
        {!loading && cred?.last_error && (
          <Notice tone="danger">Last sync failed: {cred.last_error}</Notice>
        )}
        {!loading && connected && cache.length === 0 && (
          <EmptyState icon="📡" title="Connected — no cached assets yet" body="Tap Sync in Setup. Machines must share a serial number with VisionLink to appear." />
        )}
        {!loading && machines.map((m) => {
          const row = byId[m.id]
          const parsed = parseAsset(row?.payload || {})
          return (
            <button
              key={m.id}
              onClick={() => setSel(m.id)}
              style={{ width: "100%", background: C.card, border: `1px solid ${row ? C.border : `${C.muted}33`}`, borderRadius: 14, padding: "13px 14px", marginBottom: 8, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16, color: C.text }}>{m.model}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{m.type} · {parsed.serial || row?.serial_number || m.serial_number || "No serial"}</div>
                </div>
                <Pill label={row ? "CACHED" : "NO DATA"} color={row ? C.success : C.muted} />
              </div>
              {row && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
                  <Stat small label="SMH" value={parsed.smh != null ? parsed.smh.toLocaleString() : "—"} color={C.muted} />
                  <Stat small label="Fuel" value={parsed.fuelPct != null ? `${parsed.fuelPct}%` : "—"} color={C.info} />
                  <Stat small label="Faults" value={String(parsed.faults.length)} color={parsed.faults.length ? C.amber : C.success} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
