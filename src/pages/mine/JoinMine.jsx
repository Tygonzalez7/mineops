import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { C, F, ROLES, BASE_MACHINES } from '../../constants/index.js'

export default function JoinMine() {
  const { session, refreshOperator } = useAuth()
  const nav = useNavigate()

  const [step,    setStep]    = useState(1) // 1=find 2=role 3=pending
  const [code,    setCode]    = useState('')
  const [mine,    setMine]    = useState(null)
  const [machines,setMachines]= useState([])
  const [searching,setSearching] = useState(false)
  const [searchErr,setSearchErr] = useState('')
  const [role,    setRole]    = useState('')
  const [machineId,setMachineId] = useState('')
  const [name,    setName]    = useState(session?.user?.user_metadata?.name || '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const searchMine = async () => {
    if (!code.trim()) return
    setSearching(true); setSearchErr(''); setMine(null)
    try {
      const q = code.trim().toUpperCase()
      const { data, error: err } = await supabase
        .from('mines')
        .select('id, name, location, code, plan')
        .eq('code', q)
        .single()
      if (err || !data) {
        setSearchErr("No mine found with that code. Check with your admin and try again.")
      } else {
        setMine(data)
        // Fetch machines for this mine
        const { data: mdata } = await supabase
          .from('machines')
          .select('id, model, type')
          .eq('mine_id', data.id)
          .eq('status', 'operating')
        setMachines(mdata || [])
      }
    } catch {
      setSearchErr('Something went wrong. Check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleJoin = async () => {
    if (!role || !name.trim() || !mine) return
    setLoading(true); setError('')
    try {
      const { error: opErr } = await supabase.from('operators').insert({
        auth_id:    session.user.id,
        mine_id:    mine.id,
        name:       name.trim(),
        role,
        machine_id: machineId || null,
        status:     'pending', // admin approves
      })
      if (opErr) throw opErr
      await refreshOperator()
      setStep(3)
    } catch (err) {
      setError(err.message || 'Failed to join mine. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = Object.entries(ROLES).filter(([k]) => k !== 'admin').map(([id, r]) => ({ id, ...r }))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 20px 12px' }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: C.accent }}>Join a Mine</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Enter the code your admin gave you</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>

          {/* ── Step 1: Find mine ──────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Mine code (6 characters) <span style={{ color: C.danger }}>*</span></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                  value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setSearchErr(''); setMine(null) }}
                  onKeyDown={e => e.key === 'Enter' && searchMine()}
                  placeholder="e.g. REDROCK"
                  maxLength={8}
                  style={{ background: C.surface, color: C.text, border: `1px solid ${mine ? C.success : searchErr ? C.danger : C.border}`, borderRadius: 9, padding: '13px 14px', fontSize: 18, fontFamily: F, fontWeight: 700, flex: 1, outline: 'none', letterSpacing: '.12em', textTransform: 'uppercase' }}
                />
                <button onClick={searchMine} disabled={searching || !code.trim()}
                  style={{ background: C.accent, border: 'none', borderRadius: 9, padding: '0 18px', fontFamily: F, fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#000', flexShrink: 0 }}>
                  {searching ? '…' : 'Find'}
                </button>
              </div>

              {searchErr && (
                <div style={{ background: `${C.danger}12`, border: `1px solid ${C.danger}30`, borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, color: C.danger }}>
                  {searchErr}
                </div>
              )}

              {mine && (
                <div style={{ background: `${C.success}10`, border: `1.5px solid ${C.success}44`, borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: C.success }}>{mine.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{mine.location}</div>
                    </div>
                    <span style={{ background: `${C.success}20`, color: C.success, border: `1px solid ${C.success}44`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontFamily: F, fontWeight: 700 }}>FOUND ✓</span>
                  </div>
                  <button onClick={() => setStep(2)}
                    style={{ width: '100%', background: C.success, color: '#000', border: 'none', borderRadius: 10, padding: '13px', fontFamily: F, fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
                    Join {mine.name} →
                  </button>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <div style={{ fontSize: 12, color: C.muted }}>Don't have a code? Ask your Mine Admin.</div>
              </div>
            </div>
          )}

          {/* ── Step 2: Profile + role ─────────────────────────────────────── */}
          {step === 2 && mine && (
            <div>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 22, color: C.accent, marginBottom: 2 }}>Your Profile</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{mine.name}</div>

              <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Your name</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                style={{ background: C.surface, color: C.text, border: `1px solid ${name.trim() ? C.success : C.border}`, borderRadius: 9, padding: '12px 14px', fontSize: 14, width: '100%', outline: 'none', fontFamily: "'Barlow', sans-serif", marginBottom: 14 }} />

              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Your role</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {roleOptions.map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    style={{ background: role === r.id ? `${r.color}15` : C.card, border: `2px solid ${role === r.id ? r.color : C.border}`, borderRadius: 12, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${r.color}18`, border: `2px solid ${r.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 16, color: role === r.id ? r.color : C.text }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{r.id === 'operator' ? 'I operate mobile plant' : r.id === 'supervisor' ? 'I supervise the shift' : 'I manage the operation'}</div>
                    </div>
                    {role === r.id && <span style={{ color: r.color, fontSize: 18 }}>✓</span>}
                  </button>
                ))}
              </div>

              {role === 'operator' && machines.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Primary machine <span style={{ color: C.muted, fontWeight: 400 }}>(your admin can update this)</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {machines.map(m => (
                      <button key={m.id} onClick={() => setMachineId(m.id)}
                        style={{ background: machineId === m.id ? `${C.accent}15` : C.card, border: `1.5px solid ${machineId === m.id ? C.accent : C.border}`, borderRadius: 9, padding: '10px 11px', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: machineId === m.id ? C.accent : C.text }}>{m.model}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{m.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, textAlign: 'center' }}>{error}</div>}

              <button onClick={handleJoin} disabled={loading || !role || !name.trim()}
                style={{ width: '100%', background: role && name.trim() ? C.success : C.border, color: '#000', border: 'none', borderRadius: 12, padding: '15px', fontFamily: F, fontWeight: 900, fontSize: 18, cursor: 'pointer', marginBottom: 10 }}>
                {loading ? 'Submitting…' : 'Request Access →'}
              </button>
              <button onClick={() => setStep(1)}
                style={{ width: '100%', background: 'none', border: 'none', color: C.muted, padding: '10px', fontFamily: F, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ← Back
              </button>
            </div>
          )}

          {/* ── Step 3: Pending ────────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>⏳</div>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: 26, color: C.success, marginBottom: 8 }}>
                Welcome, {name.split(' ')[0]}!
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{mine?.name} · {ROLES[role]?.label}</div>

              <div style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: C.amber, marginBottom: 8 }}>⏳ Awaiting approval</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                  Your Mine Admin at {mine?.name} will receive a notification and approve your access.
                  You'll get an email confirmation once you're in. This usually happens within a few hours.
                </div>
              </div>

              <button onClick={() => nav('/pending')}
                style={{ width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 12, padding: '14px', fontFamily: F, fontWeight: 900, fontSize: 18, cursor: 'pointer' }}>
                OK — I'll check back soon
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
