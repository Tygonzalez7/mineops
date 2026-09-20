// Compliance PIN helpers. Hash uses Web Crypto (available in modern Node + browsers).

export function normalizePin(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 4)
}

export function isValidPin(pin, confirm) {
  const a = normalizePin(pin)
  const b = confirm == null ? a : normalizePin(confirm)
  return a.length === 4 && a === b
}

export async function hashCompliancePin(pin, mineId) {
  if (!pin || !mineId) return null
  const enc = new TextEncoder().encode(`${mineId}:${pin}`)
  const buf = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function pinsMatch(pin, mineId, pinHash) {
  if (!pinHash) return false
  const h = await hashCompliancePin(normalizePin(pin), mineId)
  return h === pinHash
}
