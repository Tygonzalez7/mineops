// src/pages/mine/Onboarding.jsx
import { useNavigate } from 'react-router-dom'
import { C, F } from '../../constants/index.js'

export default function Onboarding() {
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '44px 22px 36px', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 54, color: C.accent, letterSpacing: '.06em', marginBottom: 8 }}>MINEOPS</div>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 20 }}>Production Intelligence Platform</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['CAT VisionLink','Powerscreen Pulse','MQSHA / MSHA','Multi-site'].map(t => (
            <div key={t} style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}22`, borderRadius: 6, padding: '3px 10px', fontSize: 10, color: C.accent, fontFamily: F, fontWeight: 700 }}>{t}</div>
          ))}
        </div>
      </div>
      <div>
        <button onClick={() => nav('/signup')}
          style={{ width: '100%', background: `linear-gradient(135deg,${C.accent},#d4881e)`, color: '#000', border: 'none', borderRadius: 14, padding: '18px', fontFamily: F, fontWeight: 900, fontSize: 20, cursor: 'pointer', marginBottom: 12 }}>
          ⛏ Create a Mine
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: .75 }}>Free — no credit card required</div>
        </button>
        <button onClick={() => nav('/signup?next=join')}
          style={{ width: '100%', background: C.card, border: `2px solid ${C.border}`, borderRadius: 14, padding: '16px', fontFamily: F, fontWeight: 900, fontSize: 18, color: C.text, cursor: 'pointer', marginBottom: 12 }}>
          👷 Join a Mine
          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, color: C.muted }}>Have a mine code? Sign up and join your team</div>
        </button>
        <button onClick={() => nav('/signin')}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', fontFamily: F, fontWeight: 700, fontSize: 14, color: C.muted, cursor: 'pointer' }}>
          Already have an account — Sign in →
        </button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, color: C.muted, lineHeight: 1.7 }}>
        MineOps · Secure multi-tenant<br />MQSHA 1999 / QLD Reg 2017 · MSHA 30 CFR Part 56<br />CAT VisionLink AEMP 2.0 · Powerscreen Pulse
      </div>
    </div>
  )
}
