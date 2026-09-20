// Auth / toast error mapping + form validation. Pure — no network.
import { C } from "./theme.js"

export function friendlyError(e) {
  const raw = (e?.message || String(e || "")).trim()
  if (!raw) return "Something went wrong."
  const cleaned = raw
    .replace(/^Error:\s*/i, "")
    .replace(/^AuthApiError:\s*/i, "")
    .replace(/^PostgrestError:\s*/i, "")
    .replace(/^new row violates row-level security policy[^.]*\.?$/i, "You don't have permission to do that.")
    .replace(/^duplicate key value[^.]*\.?$/i, "That entry already exists.")
    .replace(/Failed to fetch/i, "Connection problem. Check your network.")
    .replace(/JWT expired/i, "Session expired. Please sign in again.")
  return cleaned.length > 140 ? cleaned.slice(0, 137) + "…" : cleaned
}

export function friendlyAuthError(e) {
  const raw = (e?.message || String(e || "")).toLowerCase()
  if (raw.includes("invalid login credentials")) return "That email and password don't match."
  if (raw.includes("user already registered") || raw.includes("already exists")) return "An account with that email already exists. Sign in instead?"
  if (raw.includes("email not confirmed")) return "Check your inbox to confirm your email."
  if (raw.includes("rate limit")) return "Too many attempts. Try again in a few minutes."
  if (raw.includes("password should be") || raw.includes("password is too short")) return "Use at least 8 characters for your password."
  if (raw.includes("invalid email")) return "That doesn't look like a valid email."
  if (raw.includes("user not found")) return "No account with that email."
  if (raw.includes("network") || raw.includes("fetch")) return "Connection problem. Check your network and try again."
  return e?.message ? e.message.replace(/^AuthApiError:\s*/, "") : "Something went wrong. Try again."
}

export function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: C.muted }
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^\w\s]/.test(pw)) s++
  const tiers = [
    { label: "Too short", color: C.danger },
    { label: "Weak", color: C.danger },
    { label: "Fair", color: C.amber },
    { label: "Good", color: C.info },
    { label: "Strong", color: C.success },
    { label: "Excellent", color: C.success },
  ]
  return { score: s, ...tiers[Math.min(s, tiers.length - 1)] }
}

export function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || "").trim())
}

/** Matches AuthScreen submitDisabled rules in App.jsx */
export function authSubmitDisabled({ mode, email, pass = "", name = "", newPass = "", loading = false }) {
  if (loading) return true
  const emailOk = isValidEmail(email)
  if (mode === "signIn") return !emailOk || pass.length < 6
  if (mode === "signUp") return !emailOk || pass.length < 8 || !String(name).trim()
  if (mode === "magic" || mode === "forgot") return !emailOk
  if (mode === "reset") return newPass.length < 8
  return true
}
