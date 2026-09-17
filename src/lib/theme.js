// Shared design tokens. Keep in sync with App.jsx / Schedule.jsx.
export const C = {
  bg: "#07090d",
  surface: "#0d1118",
  card: "#121820",
  border: "#1c2738",
  accent: "#f5a623",
  success: "#3ecf8e",
  danger: "#e05252",
  amber: "#e0a847",
  info: "#4fa3e0",
  purple: "#a78bfa",
  muted: "#6b7a99",
  text: "#e8ecf3",
  textSub: "#b0b8cc",
}

export const F = "'Barlow Condensed','Oswald',sans-serif"

export const ROLES = {
  operator: { label: "Operator", color: "#4fa3e0", icon: "👷", level: 1 },
  supervisor: { label: "Supervisor", color: "#f5a623", icon: "🔶", level: 2 },
  minemanager: { label: "Mine Manager", color: "#a78bfa", icon: "⛏", level: 3 },
  admin: { label: "Admin", color: "#e05252", icon: "⚙", level: 4 },
  maintenance: { label: "Maintenance", color: "#3ecf8e", icon: "🔧", level: 2 },
}

export const isMachTruck = (type) => type === "Haul Truck"

export function initials(name = "?") {
  return String(name)
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function ymd(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, "0")
  const day = String(dt.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function todayYmd() {
  return ymd(new Date())
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function daysAgo(n) {
  return ymd(addDays(new Date(), -n))
}
