// @ts-nocheck
// Supabase Edge Function: visionlink-sync
// Fetches CAT VisionLink /assetSummary for a mine and updates machines + visionlink_cache.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CAT_TOKEN_URL = "https://services.cat.com/catDigital/oauth2/v1/token";
const CAT_ASSET_SUMMARY_URL = "https://services.cat.com/catDigital/assetSummary/v1/assets";

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { mine_id } = await req.json();
    if (!mine_id) return new Response(JSON.stringify({ error: "mine_id required" }), { status: 400, headers: cors });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    // 1. Load credentials for this mine
    const { data: cred, error: credErr } = await supabase
      .from("visionlink_credentials")
      .select("client_id,client_secret,app_key")
      .eq("mine_id", mine_id)
      .maybeSingle();
    if (credErr || !cred) throw new Error("No VisionLink credentials for this mine");

    // 2. Get OAuth token
    const tokenBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: cred.client_id,
      client_secret: cred.client_secret,
      scope: "assetSummary",
    });
    const tokenRes = await fetch(CAT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Token fetch failed (${tokenRes.status}): ${text}`);
    }
    const { access_token } = await tokenRes.json();

    // 3. Fetch asset summary
    const assetRes = await fetch(CAT_ASSET_SUMMARY_URL, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json",
        "X-Cat-API-Key": cred.app_key || "",
      },
    });
    if (!assetRes.ok) {
      const text = await assetRes.text();
      throw new Error(`Asset summary failed (${assetRes.status}): ${text}`);
    }
    const summary = await assetRes.json();
    const assets = summary.assetSummaries || [];

    // 4. Write to visionlink_cache + update machines
    let updated = 0;
    for (const a of assets) {
      const sn = a?.equipmentHeader?.serialNumber;
      if (!sn) continue;
      const smh = a?.hourMeter?.value ? Math.round(a.hourMeter.value) : null;

      // Find the matching machine in this mine by serial number
      const { data: machine } = await supabase
        .from("machines")
        .select("id")
        .eq("mine_id", mine_id)
        .eq("serial_number", sn)
        .maybeSingle();

      if (machine) {
        await supabase.from("machines")
          .update({ vl_connected: true })
          .eq("id", machine.id);

        await supabase.from("visionlink_cache").upsert({
          mine_id,
          machine_id: machine.id,
          serial_number: sn,
          payload: a,
          fetched_at: new Date().toISOString(),
        }, { onConflict: "machine_id" });

        updated++;
      }
    }

    // 5. Mark successful poll
    await supabase.from("visionlink_credentials")
      .update({ last_poll_at: new Date().toISOString(), last_error: null })
      .eq("mine_id", mine_id);

    return new Response(JSON.stringify({ ok: true, updated, total_assets: assets.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    // Mark failure
    try {
      const { mine_id } = await req.clone().json();
      if (mine_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL"),
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        );
        await supabase.from("visionlink_credentials")
          .update({ last_error: String(e.message || e) })
          .eq("mine_id", mine_id);
      }
    } catch {}
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }
});
