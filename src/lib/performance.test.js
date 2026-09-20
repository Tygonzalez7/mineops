import { describe, expect, it } from "vitest"
import {
  SHIFT_HOURS_DEFAULT,
  avatarFromName,
  cycleConsistency,
  loadsPerHour,
  mean,
  productiveHours,
  rankFleet,
  rankKey,
  rankMachineOperators,
  stddev,
  tonsPerHour,
  utilizationPct,
} from "./performance.js"

describe("mean / stddev", () => {
  it("returns 0 for empty mean and single-sample stddev", () => {
    expect(mean([])).toBe(0)
    expect(stddev([4])).toBe(0)
  })

  it("computes sample stddev", () => {
    expect(mean([2, 4, 6])).toBe(4)
    expect(stddev([2, 4, 6])).toBeCloseTo(2, 8)
  })
})

describe("cycleConsistency", () => {
  it("needs at least two positive finite samples", () => {
    expect(cycleConsistency([])).toBeNull()
    expect(cycleConsistency([3])).toBeNull()
    expect(cycleConsistency([0, 0])).toBeNull()
    expect(cycleConsistency(["x", -1])).toBeNull()
  })

  it("scores identical cycles at 100", () => {
    expect(cycleConsistency([4, 4, 4, 4])).toBe(100)
  })

  it("drops as coefficient of variation rises", () => {
    const tight = cycleConsistency([5, 5.1, 4.9, 5])
    const loose = cycleConsistency([2, 8, 3, 12])
    expect(tight).toBeGreaterThan(loose)
    expect(tight).toBeGreaterThan(90)
    expect(loose).toBeLessThan(20)
  })
})

describe("productiveHours / rates / utilization", () => {
  it("floors productive hours at 0.25 to avoid divide-by-zero", () => {
    expect(productiveHours({ shiftHours: 10, downtimeMin: 10_000 })).toBe(0.25)
  })

  it("uses loggedHours when provided", () => {
    expect(productiveHours({ loggedHours: 8, downtimeMin: 60 })).toBe(7)
  })

  it("defaults to a 10h shift", () => {
    expect(productiveHours({ downtimeMin: 0 })).toBe(SHIFT_HOURS_DEFAULT)
  })

  it("returns 0 tph/lph when hours are missing", () => {
    expect(tonsPerHour(400, 0)).toBe(0)
    expect(loadsPerHour(12, null)).toBe(0)
    expect(tonsPerHour(400, 2)).toBe(200)
    expect(loadsPerHour(15, 5)).toBe(3)
  })

  it("clamps utilization 0–100", () => {
    expect(utilizationPct({ shiftHours: 10, downtimeMin: 60 })).toBe(90)
    expect(utilizationPct({ shiftHours: 10, downtimeMin: 0 })).toBe(100)
    expect(utilizationPct({ shiftHours: 10, downtimeMin: 900 })).toBe(0)
    expect(utilizationPct({ shiftHours: 0, downtimeMin: 0 })).toBe(0)
  })
})

describe("rankKey / rankMachineOperators", () => {
  it("ranks trucks by loads/hr then consistency then util", () => {
    const a = { loadsPerHour: 3, consistency: 80, utilization: 90 }
    const b = { loadsPerHour: 2.9, consistency: 99, utilization: 99 }
    expect(rankKey(a, true)).toBeGreaterThan(rankKey(b, true))
  })

  it("ranks loaders by t/hr not hours", () => {
    const a = { tph: 160, consistency: 50, utilization: 50 }
    const b = { tph: 140, consistency: 99, utilization: 99 }
    expect(rankKey(a, false)).toBeGreaterThan(rankKey(b, false))
  })

  it("builds a loader board and drops empty operators", () => {
    const machine = { id: "L1", type: "Wheel Loader", model: "CAT 988K" }
    const ranked = rankMachineOperators({
      machine,
      operatorName: (id) => (id === "op-a" ? "Alex Miner" : "Bea Truck"),
      prod: [
        { machine_id: "L1", operator_id: "op-a", tonnage: 1600, shift_id: "s1" },
        { machine_id: "L1", operator_id: "op-b", tonnage: 800, shift_id: "s2" },
        { machine_id: "other", operator_id: "op-a", tonnage: 9999, shift_id: "s9" },
      ],
      scoops: [
        { machine_id: "L1", operator_id: "op-a", tonnes: 0, cycle_time_min: 3, shift_id: "s1" },
        { machine_id: "L1", operator_id: "op-a", tonnes: 0, cycle_time_min: 3.1, shift_id: "s1" },
      ],
      downs: [{ machine_id: "L1", duration_min: 60, shift_id: "s1" }],
    })
    expect(ranked.truck).toBe(false)
    expect(ranked.ops.map((o) => o.operatorId)).toEqual(["op-a", "op-b"])
    expect(ranked.ops[0].tph).toBeGreaterThan(ranked.ops[1].tph)
    expect(ranked.ops[0].consistency).not.toBeNull()
    expect(ranked.ops[0].utilization).toBe(90)
    expect(ranked.ops[0].avatar).toBe("AM")
  })

  it("ranks haul trucks by loads/hour", () => {
    const machine = { id: "T1", type: "Haul Truck" }
    const ranked = rankMachineOperators({
      machine,
      operatorName: () => "Hauler",
      prod: [],
      scoops: [
        { machine_id: "T1", operator_id: "fast", tonnes: 40, cycle_time_min: 8, shift_id: "s1" },
        { machine_id: "T1", operator_id: "fast", tonnes: 40, cycle_time_min: 8, shift_id: "s1" },
        { machine_id: "T1", operator_id: "fast", tonnes: 40, cycle_time_min: 8, shift_id: "s1" },
        { machine_id: "T1", operator_id: "slow", tonnes: 40, cycle_time_min: 12, shift_id: "s2" },
      ],
      downs: [],
    })
    expect(ranked.truck).toBe(true)
    expect(ranked.ops[0].operatorId).toBe("fast")
    expect(ranked.ops[0].loadsPerHour).toBeGreaterThan(ranked.ops[1].loadsPerHour)
  })

  it("returns empty ops when a machine has no rate data", () => {
    expect(rankMachineOperators({ machine: { id: "X", type: "Dozer" } }).ops).toEqual([])
    expect(rankFleet([]).length).toBe(0)
  })

  it("avatarFromName matches initials", () => {
    expect(avatarFromName("Jane Smith")).toBe("JS")
    expect(avatarFromName("")).toBe("?")
  })
})
