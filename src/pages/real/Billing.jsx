import { useEffect, useState } from "react"
import { C, F } from "../../lib/theme.js"
import { getConfig } from "../../lib/config.js"
import { Btn, EmptyState, Notice, PageHdr, Pill } from "../../ui/primitives.jsx"

export default function BillingScreen({ supabase, activeMine, toast, onBack }) {
  const [org, setOrg] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const cfg = getConfig()
  const liveReady = !!cfg.stripePublishableKey

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!activeMine?.org_id && !activeMine?.id) {
        setLoading(false)
        return
      }
      try {
        let orgId = activeMine.org_id
        if (!orgId && activeMine.id) {
          const { data } = await supabase.from("mines").select("org_id").eq("id", activeMine.id).maybeSingle()
          orgId = data?.org_id
        }
        if (!orgId) {
          setLoading(false)
          return
        }
        const [o, s] = await Promise.all([
          supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
          supabase.from("billing_subscriptions").select("*").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        ])
        if (cancelled) return
        setOrg(o.data || null)
        setSub(s.data || null)
      } catch (e) {
        toast?.error?.(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [activeMine?.id, activeMine?.org_id, supabase, toast])

  const startCheckout = () => {
    toast?.info?.(liveReady
      ? "Stripe keys are present, but checkout is not armed until Ty enables live mode."
      : "Payment-ready, not payment-live. Add VITE_STRIPE_PUBLISHABLE_KEY and Stripe secrets to take charges.")
  }

  return (
    <div style={{ paddingBottom: 80 }} className="up">
      <PageHdr title="Billing" sub="Company plan · Stripe scaffolding" back={!!onBack} onBack={onBack} />
      <div style={{ padding: "14px 16px" }}>
        <Notice tone={liveReady ? "amber" : "info"}>
          {liveReady
            ? "Publishable key detected. Charges stay off until the webhook + secret key are configured."
            : "No Stripe keys in this environment. The app is payment-ready (tables + this page + webhook stub) but will not charge cards."}
        </Notice>
        {loading && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Loading…</div>}
        {!loading && !org && (
          <EmptyState icon="🏢" title="No company on this mine yet" body="Create or link an organization (org/mine signup) to attach a Stripe customer." />
        )}
        {org && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 15px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20 }}>{org.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Plan: {org.plan || "starter"}</div>
              </div>
              <Pill label={(sub?.status || "not_configured").replace(/_/g, " ").toUpperCase()} color={sub?.status === "active" ? C.success : C.muted} />
            </div>
            {sub?.current_period_end && (
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 10 }}>Current period ends {new Date(sub.current_period_end).toLocaleDateString()}</div>
            )}
          </div>
        )}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 15px", marginBottom: 12 }}>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Starter</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>One mine, core checks, records, and VisionLink asset summary. Price TBD — checkout is stubbed.</div>
          <Btn onClick={startCheckout} disabled={!org}>Start checkout (disabled until keys)</Btn>
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          Webhook: <code style={{ color: C.textSub }}>/functions/v1/stripe-webhook</code>. Events persist to <code>billing_events</code>. Never commit live secret keys.
        </div>
      </div>
    </div>
  )
}
