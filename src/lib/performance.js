// Operator performance — rate, consistency, utilization. Never raw hours.
// See docs/OPERATOR_PERFORMANCE.md.
import { initials, isMachTruck } from "./theme.js"

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
  return initials(name)
}

/**
 * Rank operators on one machine for the 7-day window.
 * Loaders/excavators: t/hr → consistency → util. Trucks: loads/hr → consistency → util.
 */
export function rankMachineOperators({
  machine,
  prod = [],
  scoops = [],
  downs = [],
  operatorName = () => "Operator",
} = {}) {
  const truck = isMachTruck(machine?.type)
  const pRows = prod.filter((r) => r.machine_id === machine?.id)
  const sRows = scoops.filter((r) => r.machine_id === machine?.id)
  const dRows = downs.filter((r) => r.machine_id === machine?.id)
  const byOp = new Map()
  const touch = (opid) => {
    if (!byOp.has(opid)) {
      byOp.set(opid, { operatorId: opid, name: operatorName(opid), tons: 0, loads: 0, cycles: [], downMin: 0, shifts: new Set() })
    }
    return byOp.get(opid)
  }
  for (const r of pRows) {
    const o = touch(r.operator_id)
    o.tons += Number(r.tonnage || 0)
    if (r.shift_id) o.shifts.add(r.shift_id)
  }
  for (const r of sRows) {
    const oid = r.operator_id || pRows.find((p) => p.shift_id === r.shift_id)?.operator_id
    if (!oid) continue
    const o = touch(oid)
    o.loads += 1
    o.tons += Number(r.tonnes || 0)
    if (r.cycle_time_min) o.cycles.push(Number(r.cycle_time_min))
    if (r.shift_id) o.shifts.add(r.shift_id)
  }
  for (const r of dRows) {
    const oid = pRows.find((p) => p.shift_id === r.shift_id)?.operator_id
    if (!oid) continue
    touch(oid).downMin += Number(r.duration_min || 0)
  }
  const ops = [...byOp.values()].map((o) => {
    const shiftCount = Math.max(o.shifts.size, o.tons > 0 || o.loads > 0 ? 1 : 0)
    const hours = productiveHours({ shiftHours: 10 * Math.max(1, shiftCount), downtimeMin: o.downMin })
    const tph = tonsPerHour(o.tons, hours)
    const lph = loadsPerHour(o.loads, hours)
    const consistency = cycleConsistency(o.cycles)
    const utilization = utilizationPct({ shiftHours: 10 * Math.max(1, shiftCount), downtimeMin: o.downMin })
    return {
      ...o,
      avatar: initials(o.name),
      shifts: shiftCount,
      tph: Math.round(tph * 10) / 10,
      loadsPerHour: Math.round(lph * 10) / 10,
      consistency,
      utilization,
      weeklyTons: Math.round(o.tons),
    }
  }).filter((o) => o.weeklyTons > 0 || o.loads > 0)
    .sort((a, b) => rankKey(b, truck) - rankKey(a, truck))
  return { m: machine, truck, ops }
}

export function rankFleet(machines, ctx = {}) {
  return (machines || []).map((machine) => rankMachineOperators({ machine, ...ctx }))
}
