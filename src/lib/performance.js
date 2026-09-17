// Operator performance — rate, consistency, utilization. Never raw hours.
// See docs/OPERATOR_PERFORMANCE.md.

export const SHIFT_HOURS_DEFAULT = 10

export function mean(nums) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function stddev(nums) {
  if (nums.length < 2) return 0
  const m = mean(nums)
  const v = nums.reduce((a, n) => a + (n - m) ** 2, 0) / (nums.length - 1)
  return Math.sqrt(v)
}

/** Cycle-time consistency 0–100. Higher = more repeatable cycles. */
export function cycleConsistency(cycleMins) {
  const clean = (cycleMins || []).map(Number).filter((n) => n > 0 && Number.isFinite(n))
  if (clean.length < 2) return null
  const m = mean(clean)
  if (m <= 0) return null
  const cv = stddev(clean) / m
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))
}

export function productiveHours({ shiftHours = SHIFT_HOURS_DEFAULT, downtimeMin = 0, loggedHours }) {
  const base = loggedHours != null && loggedHours > 0 ? loggedHours : shiftHours
  return Math.max(0.25, base - (Number(downtimeMin) || 0) / 60)
}

export function tonsPerHour(tonnage, hours) {
  if (!hours || hours <= 0) return 0
  return Number(tonnage || 0) / hours
}

export function loadsPerHour(loads, hours) {
  if (!hours || hours <= 0) return 0
  return Number(loads || 0) / hours
}

export function utilizationPct({ shiftHours = SHIFT_HOURS_DEFAULT, downtimeMin = 0, loggedHours }) {
  const denom = loggedHours != null && loggedHours > 0 ? loggedHours : shiftHours
  if (denom <= 0) return 0
  const downH = (Number(downtimeMin) || 0) / 60
  return Math.max(0, Math.min(100, Math.round(((denom - downH) / denom) * 100)))
}

export function rankKey(row, truck) {
  if (truck) {
    // Haul trucks: loads/hr primary, then cycle consistency, then util
    return (row.loadsPerHour || 0) * 100 + (row.consistency || 0) + (row.utilization || 0) / 100
  }
  return (row.tph || 0) * 100 + (row.consistency || 0) + (row.utilization || 0) / 100
}

export function avatarFromName(name) {
  return String(name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
