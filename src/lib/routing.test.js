import { afterEach, describe, expect, it, vi } from "vitest"
import {
  canEnterComplianceView,
  canOpenPlatformAdmin,
  canSetupCompliancePin,
  homeTabForRole,
  navTabsForRole,
  postTruckFlow,
  resolvePostAuthFlow,
  shouldAdvanceFlow,
  snapTabForRole,
  validTabsForRole,
} from "./routing.js"

describe("resolvePostAuthFlow", () => {
  const session = { user: { id: "u1" } }
  const mineA = { id: "op1", mine_id: "m1" }
  const mineB = { id: "op2", mine_id: "m2" }

  it("waits while getSession is pending", () => {
    expect(resolvePostAuthFlow({ session: undefined }).kind).toBe("loading")
  })

  it("sends signed-out users to auth", () => {
    expect(resolvePostAuthFlow({ session: null })).toEqual({ kind: "signed_out", flow: "auth" })
  })

  it("holds password recovery on the reset screen", () => {
    expect(resolvePostAuthFlow({ session, authEvent: "PASSWORD_RECOVERY", operators: [mineA] })).toEqual({
      kind: "password_recovery",
      flow: "reset",
    })
  })

  it("onboards users with no mine membership", () => {
    expect(resolvePostAuthFlow({ session, operators: [] }).flow).toBe("onboarding")
    expect(resolvePostAuthFlow({ session, operators: null }).kind).toBe("no_mine")
  })

  it("opens the picker when several mines exist and none is remembered", () => {
    expect(resolvePostAuthFlow({ session, operators: [mineA, mineB] })).toEqual({
      kind: "pick_mine",
      flow: "minePicker",
    })
  })

  it("enters the remembered mine, or the only mine", () => {
    expect(resolvePostAuthFlow({ session, operators: [mineA, mineB], preferredMineId: "m2" })).toEqual({
      kind: "enter_mine",
      flow: "truckQ",
      operator: mineB,
    })
    expect(resolvePostAuthFlow({ session, operators: [mineA] }).operator).toBe(mineA)
  })
})

describe("shouldAdvanceFlow", () => {
  it("only advances from pre-app flows, matching App.jsx", () => {
    expect(shouldAdvanceFlow("auth", "onboarding")).toBe(true)
    expect(shouldAdvanceFlow("app", "onboarding")).toBe(false)
    expect(shouldAdvanceFlow("login", "minePicker")).toBe(true)
    expect(shouldAdvanceFlow("minePicker", "minePicker")).toBe(false)
    expect(shouldAdvanceFlow("minePicker", "truckQ")).toBe(true)
    expect(shouldAdvanceFlow("setup", "truckQ")).toBe(false)
    expect(shouldAdvanceFlow("auth", "billing")).toBe(false)
  })
})

describe("role tab guards", () => {
  it("gives operators Today/Checks/Prod/Schedule/Records", () => {
    expect(navTabsForRole("operator").map((t) => t.id)).toEqual(["today", "checks", "ops", "schedule", "records"])
    expect(homeTabForRole("operator")).toBe("today")
    expect(validTabsForRole("operator")).not.toContain("board")
    expect(validTabsForRole("operator")).not.toContain("perf")
  })

  it("gives supervisors Live/Prod/Team/Intel/Records", () => {
    expect(navTabsForRole("supervisor").map((t) => t.id)).toEqual(["board", "ops", "perf", "intel", "records"])
    expect(homeTabForRole("minemanager")).toBe("board")
    expect(validTabsForRole("admin")).toContain("billing")
  })

  it("snaps invalid tabs to the role home", () => {
    expect(snapTabForRole("operator", "board")).toBe("today")
    expect(snapTabForRole("operator", "checks")).toBe("checks")
    expect(snapTabForRole("supervisor", "today")).toBe("board")
    expect(snapTabForRole("unknown", "intel")).toBe("today")
  })

  it("routes the truck question by role", () => {
    expect(postTruckFlow("operator", true)).toBe("truckCheck")
    expect(postTruckFlow("operator", false)).toBe("machines")
    expect(postTruckFlow("supervisor", false)).toBe("app")
  })
})

describe("admin / compliance gates", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("opens platform admin via allow-list email or DB row", () => {
    vi.stubEnv("VITE_PLATFORM_ADMIN_EMAILS", "ty@mineops.app, other@x.com")
    expect(canOpenPlatformAdmin({ email: "ty@mineops.app" })).toBe(true)
    expect(canOpenPlatformAdmin({ email: "TY@mineops.app" })).toBe(true)
    expect(canOpenPlatformAdmin({ email: "crew@mineops.app" })).toBe(false)
    expect(canOpenPlatformAdmin({ email: "crew@mineops.app", dbAdmin: true })).toBe(true)
    expect(canOpenPlatformAdmin({ email: "" })).toBe(false)
  })

  it("requires a PIN hash to enter compliance view", () => {
    expect(canEnterComplianceView(null)).toBe(false)
    expect(canEnterComplianceView("abc")).toBe(true)
    expect(canSetupCompliancePin("admin")).toBe(true)
    expect(canSetupCompliancePin("minemanager")).toBe(true)
    expect(canSetupCompliancePin("operator")).toBe(false)
    expect(canSetupCompliancePin("supervisor")).toBe(false)
  })
})
