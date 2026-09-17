import { useEffect, useState } from "react"
import { C, F, ROLES, initials } from "../../lib/theme.js"
import { Btn, EmptyState, Field, inpStyle, Notice, PageHdr, Pill } from "../../ui/primitives.jsx"

const INDUCTION_SECTIONS = [
  { id: "site", title: "Site Induction", items: ["Emergency evacuation procedures reviewed", "Muster point locations confirmed", "Site rules and no-go zones explained", "Communication procedures understood", "First aid locations identified"] },
  { id: "plant", title: "Plant & Equipment", items: ["Exclusion zones around operating plant", "Spotters required for reversing heavy vehicles", "No passengers on equipment without authorisation", "Pre-start check requirements explained", "Defect reporting procedure understood"] },
  { id: "hazard", title: "Hazard Identification", items: ["Pit edge and berm requirements", "Blast exclusion zones and signal codes", "Dust and noise hazards understood", "Chemical handling (SDS access location)", "Slip/trip/fall hazards on site"] },
  { id: "env", title: "Environmental", items: ["Fuel and chemical spill response", "Waste disposal procedures", "Native vegetation protection areas", "Water management (sumps, diversions)"] },
  { id: "admin", title: "Administration", items: ["Sign-in / sign-out procedure", "FIFO / roster procedures (if applicable)", "Fatigue management policy understood", "Drug and alcohol policy understood", "Workers compensation reporting"] },
]

function expiryStatus(date) {
  if (!date) return { s: "current", label: "NO DATE" }
  const t = new Date(date + "T00:00").getTime()
  const soon = Date.now() + 60 * 86400000
  if (t < Date.now()) return { s: "expired", label: "EXPIRED" }
  if (t < soon) return { s: "expires-soon", label: "EXPIRING" }
  return { s: "current", label: "CURRENT" }
}

export default function ComplianceHub({ supabase, activeMine, user, toast }) {
  const [view, setView] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [inductions, setInductions] = useState([])
  const [training, setTraining] = useState([])
  const [competent, setCompetent] = useState([])
  const [sds, setSds] = useState([])
  const [showInduction, setShowInduction] = useState(false)

  const load = async () => {
    if (!activeMine?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setErr("")
    try {
      const [i, t, c, s] = await Promise.all([
        supabase.from("inductions").select("*").eq("mine_id", activeMine.id).order("created_at", { ascending: false }),
        supabase.from("training_records").select("*").eq("mine_id", activeMine.id).order("name"),
        supabase.from("competent_persons").select("*").eq("mine_id", activeMine.id).order("name"),
        supabase.from("sds_library").select("*").eq("mine_id", activeMine.id).order("name"),
      ])
      if (i.error) throw i.error
      setInductions(i.data || [])
      setTraining(t.data || [])
      setCompetent(c.data || [])
      setSds(s.data || [])
    } catch (e) {
      setErr(e.message || "Couldn't load compliance records.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMine?.id])

  if (!activeMine?.id) {
    return (
      <div style={{ paddingBottom: 80 }} className="up">
        <PageHdr title="Compliance" sub="Training · competency · SDS" />
        <EmptyState icon="📋" title="Sign into a mine" body="Compliance records persist per mine. Demo lists have been removed." />
      </div>
    )
  }

  if (showInduction) {
    return (
      <InductionForm
        supabase={supabase}
        activeMine={activeMine}
        user={user}
        toast={toast}
        onDone={() => {
          setShowInduction(false)
          load()
        }}
        onBack={() => setShowInduction(false)}
      />
    )
  }

  if (view === "training") {
    return (
      <ListScreen title="Training & inductions" onBack={() => setView("overview")}>
        <Btn onClick={() => setShowInduction(true)} variant="success" style={{ marginBottom: 12 }}>+ New miner induction</Btn>
        {inductions.length === 0 && training.length === 0 && (
          <EmptyState icon="📋" title="No training records yet" body="Submit an induction form — it saves to this mine." />
        )}
        {inductions.map((r) => (
          <Row key={r.id} title={r.inductee_name} sub={`${r.role} · inducted ${new Date(r.created_at).toLocaleDateString()}`} right={<Pill label="INDUCTED" color={C.success} />} />
        ))}
        {training.map((r) => {
          const ex = expiryStatus(r.expires_on)
          const col = ex.s === "expired" ? C.danger : ex.s === "expires-soon" ? C.amber : C.success
          return <Row key={r.id} title={`${r.name} · ${r.cert_name}`} sub={r.role || ""} right={<Pill label={ex.label} color={col} />} />
        })}
        <AddTraining supabase={supabase} mineId={activeMine.id} toast={toast} onSaved={load} />
      </ListScreen>
    )
  }

  if (view === "competent") {
    return (
      <ListScreen title="Competent persons" onBack={() => setView("overview")}>
        {competent.length === 0 && <EmptyState icon="🏅" title="No nominated persons" body="Add statutory roles so they persist for inspection." />}
        {competent.map((c) => {
          const ex = expiryStatus(c.expires_on)
          const col = ex.s === "expired" ? C.danger : ex.s === "expires-soon" ? C.amber : C.success
          return <Row key={c.id} title={c.name} sub={`${c.role_title}${c.cert_name ? ` · ${c.cert_name}` : ""}`} right={<Pill label={ex.label} color={col} />} />
        })}
        <AddCompetent supabase={supabase} mineId={activeMine.id} toast={toast} onSaved={load} />
      </ListScreen>
    )
  }

  if (view === "sds") {
    return (
      <ListScreen title="SDS library" onBack={() => setView("overview")}>
        {sds.length === 0 && <EmptyState icon="⚗" title="No substances yet" body="Add each chemical used on site. File upload can come later — the record persists now." />}
        {sds.map((s) => (
          <Row key={s.id} title={s.name} sub={`${s.supplier || "Supplier TBD"} · ${s.hazard || "hazard n/a"}`} right={<Pill label={s.uploaded ? "ON FILE" : "RECORD"} color={s.uploaded ? C.success : C.info} />} />
        ))}
        <AddSds supabase={supabase} mineId={activeMine.id} toast={toast} onSaved={load} />
      </ListScreen>
    )
  }

  const expiring = competent.filter((c) => expiryStatus(c.expires_on).s !== "current").length
  const TILES = [
    { id: "training", icon: "📋", title: "Training & inductions", sub: `${inductions.length} induction${inductions.length !== 1 ? "s" : ""} · ${training.length} certs`, color: C.success },
    { id: "competent", icon: "🏅", title: "Competent persons", sub: `${competent.length} role${competent.length !== 1 ? "s" : ""}${expiring ? ` · ${expiring} need review` : ""}`, color: expiring ? C.amber : C.success },
    { id: "sds", icon: "⚗", title: "SDS library", sub: `${sds.length} substance${sds.length !== 1 ? "s" : ""}`, color: C.info },
  ]

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Compliance" sub={`${activeMine.name} · persisted per mine`} />
      <div style={{ padding: "14px 16px" }}>
        {err && <Notice tone="danger">{err}</Notice>}
        {loading && <div style={{ textAlign: "center", padding: 24, color: C.muted, fontSize: 13 }}>Loading records…</div>}
        {!loading && TILES.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)} style={{ width: "100%", background: C.card, border: `1px solid ${t.color}33`, borderRadius: 14, padding: "16px 15px", marginBottom: 10, display: "flex", alignItems: "center", gap: 13, textAlign: "left", cursor: "pointer" }}>
            <div style={{ width: 50, height: 50, borderRadius: 13, background: `${t.color}18`, border: `2px solid ${t.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 17 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.sub}</div>
            </div>
            <span style={{ color: C.muted }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ListScreen({ title, onBack, children }) {
  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title={title} back onBack={onBack} />
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  )
}

function Row({ title, sub, right }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.info}22`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, color: C.info, fontSize: 12 }}>{initials(title)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 15 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

function InductionForm({ supabase, activeMine, user, toast, onDone, onBack }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("operator")
  const [checks, setChecks] = useState({})
  const [sig, setSig] = useState("")
  const [saving, setSaving] = useState(false)
  const total = INDUCTION_SECTIONS.reduce((a, s) => a + s.items.length, 0)
  const done = Object.values(checks).filter(Boolean).length
  const can = name.trim() && sig.trim() && done === total && !saving

  const submit = async () => {
    if (!can) return
    setSaving(true)
    try {
      const { error } = await supabase.from("inductions").insert({
        mine_id: activeMine.id,
        inductee_name: name.trim(),
        role,
        checks,
        supervisor_name: sig.trim(),
        created_by: user?.id || null,
      })
      if (error) throw error
      toast?.success?.("Induction saved")
      onDone()
    } catch (e) {
      toast?.error?.(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ paddingBottom: 100 }} className="up">
      <PageHdr title="New miner induction" sub={`${done}/${total} items`} back onBack={onBack} />
      <div style={{ padding: "12px 16px" }}>
        <Field label="Inductee name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inpStyle} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {Object.entries(ROLES).filter(([k]) => k !== "admin").map(([k, v]) => (
            <button key={k} onClick={() => setRole(k)} style={{ background: role === k ? `${v.color}18` : C.surface, border: `2px solid ${role === k ? v.color : C.border}`, borderRadius: 9, padding: "10px 8px", color: role === k ? v.color : C.muted, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        {INDUCTION_SECTIONS.map((sec) => (
          <div key={sec.id} style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: F, fontWeight: 900, fontSize: 15, marginBottom: 6 }}>{sec.title}</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "2px 12px" }}>
              {sec.items.map((item, i) => {
                const key = `${sec.id}_${i}`
                const on = !!checks[key]
                return (
                  <div key={key} onClick={() => setChecks((p) => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.border}22`, cursor: "pointer" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: on ? C.success : "transparent", border: `2px solid ${on ? C.success : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{on ? "✓" : ""}</div>
                    <span style={{ fontSize: 13, color: on ? C.text : C.textSub }}>{item}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <Field label="Supervisor signature" required>
          <input value={sig} onChange={(e) => setSig(e.target.value)} placeholder="Type name to confirm" style={inpStyle} />
        </Field>
        <Btn disabled={!can} variant="success" onClick={submit}>{saving ? "Saving…" : "Submit induction"}</Btn>
      </div>
    </div>
  )
}

function AddTraining({ supabase, mineId, toast, onSaved }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [cert, setCert] = useState("")
  const [exp, setExp] = useState("")
  const save = async () => {
    try {
      const { error } = await supabase.from("training_records").insert({ mine_id: mineId, name: name.trim(), cert_name: cert.trim(), expires_on: exp || null })
      if (error) throw error
      toast?.success?.("Training record saved")
      setName(""); setCert(""); setExp(""); setOpen(false)
      onSaved()
    } catch (e) { toast?.error?.(e) }
  }
  if (!open) return <Btn variant="secondary" onClick={() => setOpen(true)}>+ Add certificate</Btn>
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 10 }}>
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={inpStyle} /></Field>
      <Field label="Certificate"><input value={cert} onChange={(e) => setCert(e.target.value)} style={inpStyle} /></Field>
      <Field label="Expires"><input type="date" value={exp} onChange={(e) => setExp(e.target.value)} style={inpStyle} /></Field>
      <Btn disabled={!name.trim() || !cert.trim()} onClick={save}>Save</Btn>
    </div>
  )
}

function AddCompetent({ supabase, mineId, toast, onSaved }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [cert, setCert] = useState("")
  const [exp, setExp] = useState("")
  const save = async () => {
    try {
      const { error } = await supabase.from("competent_persons").insert({ mine_id: mineId, name: name.trim(), role_title: role.trim(), cert_name: cert.trim() || null, expires_on: exp || null })
      if (error) throw error
      toast?.success?.("Competent person saved")
      setOpen(false); setName(""); setRole(""); setCert(""); setExp("")
      onSaved()
    } catch (e) { toast?.error?.(e) }
  }
  if (!open) return <Btn variant="secondary" onClick={() => setOpen(true)}>+ Add competent person</Btn>
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 10 }}>
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={inpStyle} /></Field>
      <Field label="Role"><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Site Senior Executive" style={inpStyle} /></Field>
      <Field label="Certificate"><input value={cert} onChange={(e) => setCert(e.target.value)} style={inpStyle} /></Field>
      <Field label="Expires"><input type="date" value={exp} onChange={(e) => setExp(e.target.value)} style={inpStyle} /></Field>
      <Btn disabled={!name.trim() || !role.trim()} onClick={save}>Save</Btn>
    </div>
  )
}

function AddSds({ supabase, mineId, toast, onSaved }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [supplier, setSupplier] = useState("")
  const [hazard, setHazard] = useState("")
  const save = async () => {
    try {
      const { error } = await supabase.from("sds_library").insert({ mine_id: mineId, name: name.trim(), supplier: supplier.trim() || null, hazard: hazard.trim() || null })
      if (error) throw error
      toast?.success?.("SDS record saved")
      setOpen(false); setName(""); setSupplier(""); setHazard("")
      onSaved()
    } catch (e) { toast?.error?.(e) }
  }
  if (!open) return <Btn variant="secondary" onClick={() => setOpen(true)}>+ Add substance</Btn>
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 10 }}>
      <Field label="Substance"><input value={name} onChange={(e) => setName(e.target.value)} style={inpStyle} /></Field>
      <Field label="Supplier"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} style={inpStyle} /></Field>
      <Field label="Hazard"><input value={hazard} onChange={(e) => setHazard(e.target.value)} placeholder="Flammable / Irritant / …" style={inpStyle} /></Field>
      <Btn disabled={!name.trim()} onClick={save}>Save</Btn>
    </div>
  )
}
