// Post-auth flow + role tab guards. Pure — no network.
import { ROLES } from "./theme.js"
import { isPlatformAdminEmail } from "./config.js"

export const OPERATOR_TABS = [
  { id: "today", icon: "🏠", label: "Today" },
  { id: "checks", icon: "✅", label: "Checks" },
  { id: "ops", icon: "📈", label: "Prod" },
  { id: "schedule", icon: "📅", label: "Schedule" },
  { id: "records", icon: "📁", label: "Records" },
]

export const SUPERVISOR_TABS = [
  { id: "board", icon: "📡", label: "Live" },
  { id: "ops", icon: "📈", label: "Prod" },
  { id: "perf", icon: "👷", label: "Team" },
  { id: "intel", icon: "🧠", label: "Intel" },
  { id: "records", icon: "📁", label: "Records" },
]

export const OPERATOR_VALID_TABS = ["today", "checks", "ops", "schedule", "records"]
export const SUPERVISOR_VALID_TABS = ["board", "ops", "schedule", "perf", "records", "intel", "comply", "billing"]

/** Header-hidden / pre-app flows (see MineOpsApp). */
export const PRE_APP_FLOWS = ["auth", "onboarding", "createMine", "joinMine", "minePicker", "login"]

/**
 * Decide the next post-auth destination from session + memberships.
 * Does not fetch — callers pass already-loaded operator rows.
 */
export function resolvePostAuthFlow({ session, authEvent, operators, preferredMineId } = {}) {
  if (session === undefined) return { kind: "loading", flow: null }
  if (!session) return { kind: "signed_out", flow: "auth" }
  if (authEvent === "PASSWORD_RECOVERY") return { kind: "password_recovery", flow: "reset" }
  if (!operators?.length) return { kind: "no_mine", flow: "onboarding" }
  const preferred = preferredMineId
    ? operators.find((o) => o.mine_id === preferredMineId)
    : null
  if (!preferred && operators.length > 1) {
    return { kind: "pick_mine", flow: "minePicker" }
  }
  return { kind: "enter_mine", flow: "truckQ", operator: preferred || operators[0] }
}

/** Only advance when the user is still in a pre-app flow (matches App.jsx setFlow). */
export function shouldAdvanceFlow(currentFlow, nextFlow) {
  if (nextFlow === "onboarding") return ["auth", "onboarding"].includes(currentFlow)
  if (nextFlow === "minePicker") return ["auth", "onboarding", "login"].includes(currentFlow)
  if (nextFlow === "truckQ") return ["auth", "onboarding", "login", "minePicker"].includes(currentFlow)
  return false
}

export function roleLevel(role) {
  return ROLES[role]?.level || 1
}

export function navTabsForRole(role) {
  return roleLevel(role) === 1 ? OPERATOR_TABS : SUPERVISOR_TABS
}

export function validTabsForRole(role) {
  return roleLevel(role) === 1 ? OPERATOR_VALID_TABS : SUPERVISOR_VALID_TABS
}

export function homeTabForRole(role) {
  return roleLevel(role) === 1 ? "today" : "board"
}

export function snapTabForRole(role, tab) {
  const valid = validTabsForRole(role)
  return valid.includes(tab) ? tab : homeTabForRole(role)
}

export function postTruckFlow(role, drove) {
  if (drove) return "truckCheck"
  return roleLevel(role) === 1 ? "machines" : "app"
}

export function canOpenPlatformAdmin({ email, dbAdmin = false } = {}) {
  return !!dbAdmin || isPlatformAdminEmail(email)
}

export function canEnterComplianceView(pinHash) {
  return !!pinHash
}

export function canSetupCompliancePin(role) {
  return role === "admin" || role === "minemanager"
}
