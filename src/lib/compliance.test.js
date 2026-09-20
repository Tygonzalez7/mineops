import { describe, expect, it } from "vitest"
import { hashCompliancePin, isValidPin, normalizePin, pinsMatch } from "./compliance.js"

describe("PIN normalize / validate", () => {
  it("keeps only four digits", () => {
    expect(normalizePin("12ab34")).toBe("1234")
    expect(normalizePin("99999")).toBe("9999")
    expect(normalizePin("")).toBe("")
  })

  it("requires a matching 4-digit pair", () => {
    expect(isValidPin("12", "12")).toBe(false)
    expect(isValidPin("1234", "1235")).toBe(false)
    expect(isValidPin("1234", "1234")).toBe(true)
    expect(isValidPin("12-34", "1234")).toBe(true)
  })
})

describe("hashCompliancePin", () => {
  it("returns null without pin or mine", async () => {
    expect(await hashCompliancePin("", "m1")).toBeNull()
    expect(await hashCompliancePin("1234", "")).toBeNull()
  })

  it("is deterministic per mine and differs across mines/pins", async () => {
    const a = await hashCompliancePin("1234", "mine-a")
    const b = await hashCompliancePin("1234", "mine-a")
    const c = await hashCompliancePin("1234", "mine-b")
    const d = await hashCompliancePin("0000", "mine-a")
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
    expect(a).not.toBe(c)
    expect(a).not.toBe(d)
    expect(await pinsMatch("1234", "mine-a", a)).toBe(true)
    expect(await pinsMatch("0000", "mine-a", a)).toBe(false)
    expect(await pinsMatch("1234", "mine-a", null)).toBe(false)
  })
})
