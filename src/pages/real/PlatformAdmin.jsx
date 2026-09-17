import { useEffect, useState } from "react"
import { C, F } from "../../lib/theme.js"
import { Btn, EmptyState, Field, inpStyle, Notice, PageHdr, Pill } from "../../ui/primitives.jsx"

export default function PlatformAdmin({ supabase, session, toast, onBack }) {
  const [tab, setTab] = useState("orgs")
  const [orgs, setOrgs] = useState([])
  const [mines, setMines] = useState([])
  const [ops, setOps] = useState([])
  const [flags, setFlags] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [flagKey, setFlagKey] = useState("visionlink")
  const [flagOn, setFlagOn] = useState(true)

  const load = async () => {
    setLoading(true)
    setErr("")
    try {
      const [o, m, p, f, a] = await Promise.all([
        supabase.from("organizations").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("mines").select("id,name,code,location,plan,org_id").limit(100),
        supabase.from("operators").select("id,name,role,status,mine_id,auth_id,is_active").order("created_at", { ascending: false }).limit(200),
        supabase.from("feature_flags").select("*").order("updated_at", { ascending: false }).limit(100),
        supabase.from("platform_admins").select("*"),
      ])
      if (o.error) throw o.error
      setOrgs(o.data || [])
      setMines(m.data || [])
      setOps(p.data || [])
      setFlags(f.data || [])
      setAdmins(a.data || [])
    } catch (e) {
      setErr(e.message || "Platform tables need the SaaS migration, and your user must be in platform_admins.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveFlag = async () => {
    try {
      const { error } = await supabase.from("feature_flags").insert({
        flag_key: flagKey.trim(),
        enabled: flagOn,
        payload: {},
        updated_by: session?.user?.id || null,
      })
      if (error) throw error
      toast?.success?.("Flag saved")
      load()
    } catch (e) { toast?.error?.(e) }
  }

  const toggleMinePlan = async (mine) => {
    const next = mine.plan === "starter" ? "pro" : "starter"
    try {
      const { error } = await supabase.from("mines").update({ plan: next }).eq("id", mine.id)
      if (error) throw error
      toast?.success?.(`${mine.name} → ${next}`)
      load()
    } catch (e) { toast?.error?.(e) }
  }

  const tabs = [
    ["orgs", "Companies"],
    ["mines", "Mines"],
    ["users", "Users"],
    ["flags", "Flags"],
  ]

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Platform" sub={`Ty · ${session?.user?.email || "super-admin"}`} back={!!onBack} onBack={onBack} />
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {tabs.map(([id, lb]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: `2px solid ${tab === id ? C.accent : "transparent"}`, color: tab === id ? C.accent : C.muted, fontFamily: F, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{lb}</button>
        ))}
      </div>
      <div style={{ padding: "14px 16px" }}>
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && <div style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>Loading platform…</div>}

        {tab === "orgs" && (
          <>
            {!orgs.length && !loading && <EmptyState icon="🏢" title="No companies yet" body="Org/mine signup writes organizations here." />}
            {orgs.map((o) => (
              <div key={o.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16 }}>{o.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{o.plan} · {mines.filter((m) => m.org_id === o.id).length} mine(s)</div>
              </div>
            ))}
          </>
        )}

        {tab === "mines" && mines.map((m) => (
          <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F, fontWeight: 900 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{m.code} · {m.location || "no location"}</div>
              </div>
              <button onClick={() => toggleMinePlan(m)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.accent, fontFamily: F, fontWeight: 700, fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
                {m.plan || "starter"}
              </button>
            </div>
          </div>
        ))}

        {tab === "users" && (
          <>
            <Notice>Soft-deactivate from the mine People screen. Hard auth deletion still needs a service-role function.</Notice>
            {ops.slice(0, 80).map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}22` }}>
                <div>
                  <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14 }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{o.role} · {o.status || "active"}</div>
                </div>
                <Pill label={o.is_active === false ? "INACTIVE" : "ACTIVE"} color={o.is_active === false ? C.muted : C.success} />
              </div>
            ))}
          </>
        )}

        {tab === "flags" && (
          <>
            <Field label="Flag key"><input value={flagKey} onChange={(e) => setFlagKey(e.target.value)} style={inpStyle} /></Field>
            <button onClick={() => setFlagOn((v) => !v)} style={{ marginBottom: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: flagOn ? C.success : C.muted, fontFamily: F, fontWeight: 700, cursor: "pointer" }}>
              {flagOn ? "enabled" : "disabled"}
            </button>
            <Btn onClick={saveFlag}>Save global flag</Btn>
            {flags.map((f) => (
              <div key={f.id} style={{ marginTop: 8, fontSize: 12, color: C.textSub }}>{f.flag_key} · {f.enabled ? "on" : "off"}</div>
            ))}
            <div style={{ marginTop: 16, fontSize: 11, color: C.muted }}>
              Super-admins in table: {admins.map((a) => a.email).join(", ") || "none yet — insert Ty's email into platform_admins after applying the migration."}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
