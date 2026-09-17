import { useEffect, useState } from "react"
import { C, F } from "../../lib/theme.js"
import { getConfig } from "../../lib/config.js"
import { Btn, Field, inpStyle, Notice, PageHdr, Pill } from "../../ui/primitives.jsx"

export default function VisionLinkSetup({ supabase, activeMine, toast, onBack }) {
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [appKey, setAppKey] = useState("")
  const [existing, setExisting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!activeMine?.id) return
    supabase.from("visionlink_credentials").select("client_id,app_key,last_poll_at,last_error,updated_at").eq("mine_id", activeMine.id).maybeSingle()
      .then(({ data }) => {
        setExisting(data || null)
        if (data?.client_id) setClientId(data.client_id)
        if (data?.app_key) setAppKey(data.app_key)
      })
  }, [activeMine?.id, supabase])

  const save = async () => {
    if (!activeMine?.id || !clientId.trim() || !clientSecret.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from("visionlink_credentials").upsert({
        mine_id: activeMine.id,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        app_key: appKey.trim() || null,
        updated_at: new Date().toISOString(),
        last_error: null,
      }, { onConflict: "mine_id" })
      if (error) throw error
      toast?.success?.("VisionLink credentials saved")
      setExisting({ client_id: clientId.trim(), app_key: appKey.trim(), last_error: null })
      setClientSecret("")
    } catch (e) {
      toast?.error?.(e)
    } finally {
      setSaving(false)
    }
  }

  const sync = async () => {
    if (!activeMine?.id) return
    setSyncing(true)
    setMsg("")
    try {
      const cfg = getConfig()
      const url = `${cfg.supabaseUrl}/functions/v1/visionlink-sync`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          apikey: cfg.supabaseAnonKey,
        },
        body: JSON.stringify({ mine_id: activeMine.id }),
      })
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      if (!res.ok || body?.error) throw new Error(body?.error || `HTTP ${res.status}`)
      setMsg(`Synced ${body.updated || 0} of ${body.total_assets || 0} assets`)
      toast?.success?.("VisionLink sync complete")
    } catch (e) {
      setMsg(e.message || "Sync failed")
      toast?.error?.(e)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="CAT VisionLink" sub={activeMine?.name || "Credentials + asset summary sync"} back onBack={onBack} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Pill label={existing ? (existing.last_error ? "ERROR" : "SAVED") : "NOT SET"} color={existing && !existing.last_error ? C.success : C.muted} />
          {existing?.last_poll_at && <span style={{ fontSize: 11, color: C.muted }}>Last poll {new Date(existing.last_poll_at).toLocaleString()}</span>}
        </div>
        {existing?.last_error && <Notice tone="danger">{existing.last_error}</Notice>}
        <Notice>
          Dealer Client ID, secret, and optional App Key. Stored per mine. The edge function fetches <b>assetSummary</b> today; cycle / payload / fuel land in <code>visionlink_telemetry</code> when those scopes are enabled.
        </Notice>
        <Field label="Client ID" required>
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="from your CAT dealer" style={inpStyle} autoComplete="off" />
        </Field>
        <Field label="Client secret" required hint={existing ? "Leave blank only if you are not rotating the secret — a new save requires the secret." : "Never committed to git."}>
          <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="••••••••" style={inpStyle} autoComplete="new-password" />
        </Field>
        <Field label="Application key">
          <input value={appKey} onChange={(e) => setAppKey(e.target.value)} placeholder="X-Cat-API-Key (optional)" style={inpStyle} />
        </Field>
        <Btn disabled={saving || !clientId.trim() || !clientSecret.trim()} onClick={save}>{saving ? "Saving…" : "Save credentials"}</Btn>
        <div style={{ height: 10 }} />
        <Btn variant="secondary" disabled={syncing || !existing} onClick={sync}>{syncing ? "Syncing…" : "Sync asset summary now"}</Btn>
        {msg && <div style={{ marginTop: 10, fontSize: 12, color: msg.toLowerCase().includes("fail") ? C.danger : C.success, fontFamily: F, fontWeight: 700 }}>{msg}</div>}
      </div>
    </div>
  )
}
