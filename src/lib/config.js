// Runtime + build-time config.
// Production web (Vercel): VITE_* is baked at build.
// Native / late-bound: window.__MINEOPS_CONFIG__ (public/config.js) wins so
// a JS-bundle OTA does not require hardcoding secrets in the IPA.

function readRuntime() {
  if (typeof window === "undefined") return {}
  return window.__MINEOPS_CONFIG__ || {}
}

export function getConfig() {
  const runtime = readRuntime()
  const env = (typeof import.meta !== "undefined" && import.meta.env) || {}
  const pick = (key, fallback = "") =>
    runtime[key] || env[key] || fallback

  const adminEmails = String(pick("VITE_PLATFORM_ADMIN_EMAILS", ""))
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  return {
    supabaseUrl: pick("VITE_SUPABASE_URL"),
    supabaseAnonKey: pick("VITE_SUPABASE_ANON_KEY"),
    stripePublishableKey: pick("VITE_STRIPE_PUBLISHABLE_KEY"),
    platformAdminEmails: adminEmails,
    appVersion: pick("VITE_APP_VERSION", "1.0.0"),
    capgoKey: pick("VITE_CAPGO_KEY"),
    webOrigin: pick("VITE_WEB_ORIGIN", "https://mineops-ten.vercel.app"),
  }
}

export function isPlatformAdminEmail(email) {
  if (!email) return false
  return getConfig().platformAdminEmails.includes(String(email).toLowerCase())
}
