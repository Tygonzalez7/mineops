import { C, F } from "../lib/theme.js"

export function PageHdr({ title, sub, back, onBack }) {
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 15px", position: "sticky", top: 0, zIndex: 10 }}>
      {back && (
        <button onClick={onBack} style={ghostBtn}>
          ← Back
        </button>
      )}
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 21, color: C.accent, letterSpacing: ".04em" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const ghostBtn = {
  background: "none",
  border: `1px solid ${C.border}`,
  borderRadius: 7,
  padding: "6px 12px",
  color: C.muted,
  fontSize: 11,
  marginBottom: 9,
  fontFamily: F,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: 36,
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        marginBottom: 8,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Pill({ label, color }) {
  return (
    <span style={{ background: `${color}20`, color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontFamily: F, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  )
}

export function Stat({ label, value, color = C.accent, small, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: small ? "9px 10px" : "12px 13px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 8, color: C.muted, fontFamily: F, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: small ? 16 : 21, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon = "📭", title, body, cta, onCta }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 22px" }} className="up">
      <div style={{ fontSize: 46, marginBottom: 10, opacity: 0.65 }}>{icon}</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: C.text, marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>{body}</div>}
      {cta && (
        <Btn onClick={onCta} style={{ marginTop: 16, maxWidth: 260, marginLeft: "auto", marginRight: "auto" }}>
          {cta}
        </Btn>
      )}
    </div>
  )
}

export function Btn({ children, onClick, disabled, variant = "primary", type = "button", style = {} }) {
  const pal = {
    primary: { bg: disabled ? C.border : `linear-gradient(135deg,${C.accent},#d4881e)`, fg: disabled ? C.muted : "#000" },
    success: { bg: disabled ? C.border : C.success, fg: disabled ? C.muted : "#000" },
    danger: { bg: disabled ? C.border : C.danger, fg: disabled ? C.muted : "#fff" },
    secondary: { bg: C.card, fg: C.text },
    ghost: { bg: "transparent", fg: C.muted },
  }[variant] || { bg: C.accent, fg: "#000" }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: pal.bg,
        color: pal.fg,
        border: variant === "secondary" || variant === "ghost" ? `1px solid ${C.border}` : "none",
        borderRadius: 12,
        padding: "14px 16px",
        fontFamily: F,
        fontWeight: 900,
        fontSize: 16,
        cursor: disabled ? "default" : "pointer",
        minHeight: 48,
        letterSpacing: ".02em",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontFamily: F, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
          {label}
          {required && <span style={{ color: C.danger }}> *</span>}
        </div>
      )}
      {children}
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  )
}

export const inpStyle = {
  background: C.surface,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "13px 14px",
  fontSize: 15,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
}

export function Notice({ children, tone = "info" }) {
  const col = tone === "danger" ? C.danger : tone === "amber" ? C.amber : tone === "success" ? C.success : C.info
  return (
    <div style={{ background: `${col}10`, border: `1px solid ${col}33`, borderRadius: 10, padding: "10px 13px", fontSize: 12, color: C.textSub, lineHeight: 1.5, marginBottom: 12 }}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: C.muted, fontFamily: F, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "14px 4px 6px" }}>
      {children}
    </div>
  )
}
