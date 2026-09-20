import { describe, expect, it } from "vitest"
import { C } from "./theme.js"
import { authSubmitDisabled, friendlyAuthError, friendlyError, isValidEmail, passwordStrength } from "./auth.js"

describe("friendlyAuthError", () => {
  it("maps common Supabase auth messages", () => {
    expect(friendlyAuthError({ message: "Invalid login credentials" })).toBe("That email and password don't match.")
    expect(friendlyAuthError({ message: "User already registered" })).toBe("An account with that email already exists. Sign in instead?")
    expect(friendlyAuthError({ message: "Email not confirmed" })).toBe("Check your inbox to confirm your email.")
    expect(friendlyAuthError({ message: "rate limit exceeded" })).toBe("Too many attempts. Try again in a few minutes.")
    expect(friendlyAuthError({ message: "Password should be at least 6 characters" })).toBe("Use at least 8 characters for your password.")
    expect(friendlyAuthError({ message: "Unable to validate email address: invalid email" })).toBe("That doesn't look like a valid email.")
    expect(friendlyAuthError({ message: "User not found" })).toBe("No account with that email.")
    expect(friendlyAuthError({ message: "Failed to fetch" })).toBe("Connection problem. Check your network and try again.")
  })

  it("strips AuthApiError prefix on unknown errors", () => {
    expect(friendlyAuthError({ message: "AuthApiError: mysterious" })).toBe("mysterious")
    expect(friendlyAuthError(null)).toBe("Something went wrong. Try again.")
  })
})

describe("friendlyError", () => {
  it("maps RLS, duplicates, network, and JWT text", () => {
    expect(friendlyError({ message: "new row violates row-level security policy for table operators" })).toBe("You don't have permission to do that.")
    expect(friendlyError({ message: "duplicate key value violates unique constraint" })).toBe("That entry already exists.")
    expect(friendlyError({ message: "Failed to fetch" })).toBe("Connection problem. Check your network.")
    expect(friendlyError({ message: "JWT expired" })).toBe("Session expired. Please sign in again.")
    expect(friendlyError("")).toBe("Something went wrong.")
  })

  it("truncates very long messages", () => {
    const long = "x".repeat(200)
    const out = friendlyError({ message: long })
    expect(out.length).toBe(140)
    expect(out.endsWith("…")).toBe(true)
  })
})

describe("isValidEmail / passwordStrength / authSubmitDisabled", () => {
  it("validates emails", () => {
    expect(isValidEmail("you@company.com")).toBe(true)
    expect(isValidEmail("  you@company.com  ")).toBe(true)
    expect(isValidEmail("nope")).toBe(false)
    expect(isValidEmail("a@b")).toBe(false)
    expect(isValidEmail("")).toBe(false)
  })

  it("scores password strength", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "", color: C.muted })
    expect(passwordStrength("short").score).toBe(0)
    expect(passwordStrength("longenough").score).toBe(1)
    expect(passwordStrength("Longenough1!").score).toBeGreaterThanOrEqual(4)
    expect(passwordStrength("Aa1!Aa1!Aa1!").label).toBe("Excellent")
  })

  it("disables submit until each auth mode is complete", () => {
    expect(authSubmitDisabled({ mode: "signIn", email: "a@b.co", pass: "12345" })).toBe(true)
    expect(authSubmitDisabled({ mode: "signIn", email: "a@b.co", pass: "123456" })).toBe(false)
    expect(authSubmitDisabled({ mode: "signUp", email: "a@b.co", pass: "12345678", name: "" })).toBe(true)
    expect(authSubmitDisabled({ mode: "signUp", email: "a@b.co", pass: "12345678", name: "Ty" })).toBe(false)
    expect(authSubmitDisabled({ mode: "magic", email: "bad" })).toBe(true)
    expect(authSubmitDisabled({ mode: "forgot", email: "a@b.co" })).toBe(false)
    expect(authSubmitDisabled({ mode: "reset", email: "", newPass: "1234567" })).toBe(true)
    expect(authSubmitDisabled({ mode: "reset", newPass: "12345678" })).toBe(false)
    expect(authSubmitDisabled({ mode: "signIn", email: "a@b.co", pass: "123456", loading: true })).toBe(true)
    expect(authSubmitDisabled({ mode: "unknown", email: "a@b.co" })).toBe(true)
  })
})
