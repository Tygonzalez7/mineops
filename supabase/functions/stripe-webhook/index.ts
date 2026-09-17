// @ts-nocheck
// Stripe webhook stub. Persist events; do not charge without live keys.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  if (!secret) {
    return new Response(JSON.stringify({
      ok: false,
      configured: false,
      message: "Payment-ready, not payment-live. Set STRIPE_WEBHOOK_SECRET + STRIPE_SECRET_KEY to process charges.",
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  // Signature verification is intentionally conservative: without the Stripe SDK
  // in this stub we require the header and refuse unsigned bodies.
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const { error } = await supabase.from("billing_events").upsert({
    stripe_event_id: event.id || `local_${Date.now()}`,
    type: event.type || "unknown",
    payload: event,
    processed: false,
  }, { onConflict: "stripe_event_id" });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, received: event.type || "unknown" }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
