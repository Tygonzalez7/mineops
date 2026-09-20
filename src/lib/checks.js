// Vehicle / prestart check completeness. Pure — no network.

export function vehicleCheckCounts(items, itemKeys) {
  const keys = itemKeys || Object.keys(items || {})
  return {
    pass: keys.filter((k) => items[k]?.state === "pass").length,
    fail: keys.filter((k) => items[k]?.state === "fail").length,
    na: keys.filter((k) => items[k]?.state === "na").length,
    pending: keys.filter((k) => !items[k]?.state).length,
  }
}

export function failsHaveEvidence(items, itemKeys) {
  const keys = itemKeys || Object.keys(items || {})
  return keys
    .filter((k) => items[k]?.state === "fail")
    .every((k) => !!(items[k]?.note?.trim() || items[k]?.photo))
}

/** Matches TruckCheckScreen.canReview */
export function vehicleCheckReady({ items = {}, itemKeys, vehicleLabel } = {}) {
  const keys = itemKeys || Object.keys(items)
  const counts = vehicleCheckCounts(items, keys)
  return counts.pending === 0 && !!String(vehicleLabel || "").trim() && failsHaveEvidence(items, keys)
}
