import { describe, expect, it } from "vitest"
import { failsHaveEvidence, vehicleCheckCounts, vehicleCheckReady } from "./checks.js"

const KEYS = ["lights", "brakes", "tires"]

describe("vehicleCheckReady", () => {
  it("blocks until every item is answered and the vehicle is named", () => {
    const items = { lights: { state: "pass" }, brakes: { state: "pass" } }
    expect(vehicleCheckCounts(items, KEYS).pending).toBe(1)
    expect(vehicleCheckReady({ items, itemKeys: KEYS, vehicleLabel: "Ute 4" })).toBe(false)
    expect(vehicleCheckReady({
      items: { ...items, tires: { state: "na" } },
      itemKeys: KEYS,
      vehicleLabel: "  ",
    })).toBe(false)
    expect(vehicleCheckReady({
      items: { ...items, tires: { state: "na" } },
      itemKeys: KEYS,
      vehicleLabel: "Ute 4",
    })).toBe(true)
  })

  it("requires a note or photo on every fail", () => {
    const items = {
      lights: { state: "pass" },
      brakes: { state: "fail" },
      tires: { state: "pass" },
    }
    expect(failsHaveEvidence(items, KEYS)).toBe(false)
    expect(vehicleCheckReady({ items, itemKeys: KEYS, vehicleLabel: "Ute 4" })).toBe(false)
    expect(vehicleCheckReady({
      items: { ...items, brakes: { state: "fail", note: "soft pedal" } },
      itemKeys: KEYS,
      vehicleLabel: "Ute 4",
    })).toBe(true)
    expect(vehicleCheckReady({
      items: { ...items, brakes: { state: "fail", photo: { name: "x.jpg" } } },
      itemKeys: KEYS,
      vehicleLabel: "Ute 4",
    })).toBe(true)
  })
})
