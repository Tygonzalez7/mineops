import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { C, F, ROLES } from '../../constants/index.js'

const MACHINE_TYPES = ['Wheel Loader','Excavator','Haul Truck','Dozer','Grader','Water Truck','Crusher','Conveyor','Other']
const REG_FRAMEWORKS = [
  { id: 'MQSHA', label: 'Australian — Queensland MQSHA', flag: '🇦🇺', sub: 'Mining Safety & Health Act 1999 / QLD Regulation 2017' },
  { id: 'MSHA',  label: 'US Federal — MSHA',             flag: '🇺🇸', sub: '30 CFR Part 56 — Surface Metal & Nonmetal Mines' },
  { id: 'OTHER', label: 'Other / Custom',                 flag: '🌏', sub: 'You can configure compliance settings later' },
]

export default function CreateMine() {
  const { session, refreshOperator } = useAuth()
  const nav = useNavigate()

  const [step, setStep] = useState(1) // 1=account details 2=mine setup 3=machines 4=code
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Step 1 — already have account (user is signed in), just need their name as admin
  const [adminName, setAdminName] = useState('')

  // Step 2 — mine details
  const [mineName,  setMineName]  = useState('')
  const [location,  setLocation]  = useState('')
  const [framework, setFramework] = useState('MQSHA')
  const [crushers,  setCrushers]  = useState(1)

  // Step 3 — machines
  const [machines, setMachines] = useState([])
  const [newMach,  setNewMach]  = useState({ model: '', type: 'Wheel Loader', bucket: '', payload: '', serial: '' })
  const [vlMode,   setVlMode]   = useState(false) // VisionLink import mode

  // Step 4 — result
  const [mineCode,  setMineCode]  = useState('')
  const [mineId,    setMineId]    = useState('')

  const inp = {
    background: C.surface, color: C.text, border: `1px solid ${C.border}`,
    borderRadius: 9, padding: '12px 14px', fontSize: 14, width: '100%',
    outline: 'none', fontFamily: "'Barlow', sans-serif", marginBottom: 10,
  }

  // ── Step 1: Admin name ────────────────────────────────────────────────────
  const Step1 = () => (
    <div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 24, color: C.accent, marginBottom: 4 }}>Your Name</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>This becomes your Mine Admin display name</div>
      <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="e.g. Craig O'Brien"
        style={{ ...inp, border: `1px solid ${adminName.trim() ? C.success : C.border}` }} />
      <Btn disabled={!adminName.trim()} onClick={() => setStep(2)}>Continue →</Btn>
    </div>
  )

  // ── Step 2: Mine setup ────────────────────────────────────────────────────
  const Step2 = () => (
    <div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 24, color: C.accent, marginBottom: 4 }}>Mine Setup</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Your operation's details</div>

      <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: 'block' }}>Mine / quarry name <span style={{ color: C.danger }}>*</span></label>
      <input value={mineName} onChange={e => setMineName(e.target.value)} placeholder="e.g. Redrock Quarry"
        style={{ ...inp, border: `1px solid ${mineName.trim() ? C.success : C.border}` }} />

      <label style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: 'block' }}>Location <span style={{ color: C.danger }}>*</span></label>
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Queensland, Australia"
        style={{ ...inp, border: `1px solid ${location.trim() ? C.success : C.border}` }} />

      <label style={{ fontSize: 12, color: C.muted, marginBottom: 8, display: 'block' }}>Regulatory framework</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {REG_FRAMEWORKS.map(r => (
          <button key={r.id} onClick={() => setFramework(r.id)}
            style={{ background: framework === r.id ? `${C.accent}12` : C.card, border: `2px solid ${framework === r.id ? C.accent : C.border}`, borderRadius: 10, padding: '11px 13px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{r.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: framework === r.id ? C.accent : C.text }}>{r.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{r.sub}</div>
              </div>
              {framework === r.id && <span style={{ color: C.accent }}>✓</span>}
            </div>
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, color: C.muted, marginBottom: 8, display: 'block' }}>Number of crushers</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[1,2,3,4].map(n => (
          <button key={n} onClick={() => setCrushers(n)}
            style={{ background: crushers === n ? `${C.accent}18` : C.card, border: `2px solid ${crushers === n ? C.accent : C.border}`, borderRadius: 10, padding: '13px 8px', fontFamily: F, fontWeight: 900, fontSize: 22, color: crushers === n ? C.accent : C.muted, cursor: 'pointer' }}>
            {n}
          </button>
        ))}
      </div>

      <Btn disabled={!mineName.trim() || !location.trim()} onClick={() => setStep(3)}>Continue →</Btn>
      <BtnSecondary onClick={() => setStep(1)}>← Back</BtnSecondary>
    </div>
  )

  // ── Step 3: Machines ─────────────────────────────────────────────────────
  const addMachine = () => {
    if (!newMach.model.trim()) return
    setMachines(p => [...p, { ...newMach, id: `m_${Date.now()}` }])
    setNewMach({ model: '', type: 'Wheel Loader', bucket: '', payload: '', serial: '' })
  }

  const Step3 = () => (
    <div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 24, color: C.accent, marginBottom: 4 }}>Add Machines</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Add your fleet manually, or connect VisionLink to auto-import</div>

      {/* VisionLink import option */}
      <div style={{ background: `${C.info}08`, border: `1px solid ${C.info}22`, borderRadius: 12, padding: '13px 14px', marginBottom: 14 }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: C.info, marginBottom: 6 }}>📡 Have CAT VisionLink credentials?</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Connect your VisionLink account and your entire fleet imports automatically — serial numbers, models, SMH, and live telemetry.</div>
        <button onClick={() => setVlMode(!vlMode)}
          style={{ background: `${C.info}18`, border: `1px solid ${C.info}44`, borderRadius: 8, padding: '8px 14px', color: C.info, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {vlMode ? '▲ Hide VisionLink setup' : '📡 Import via VisionLink →'}
        </button>
        {vlMode && (
          <div style={{ marginTop: 12 }}>
            {[{ l: 'Client ID', ph: 'e.g. mineops-a1b2c3d4' }, { l: 'Client Secret', ph: '••••••••••', pw: true }, { l: 'Application Key', ph: 'APPKEY-XYZ' }].map(x => (
              <div key={x.l} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{x.l}</div>
                <input type={x.pw ? 'password' : 'text'} placeholder={x.ph}
                  style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Barlow', sans-serif" }} />
              </div>
            ))}
            <button style={{ width: '100%', background: `${C.success}18`, border: `1px solid ${C.success}44`, borderRadius: 9, padding: '10px', color: C.success, fontFamily: F, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 6 }}>
              Connect & Import Fleet →
            </button>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Credentials are stored server-side only. Your CAT dealer provides these.</div>
          </div>
        )}
      </div>

      {/* Manual machine list */}
      {machines.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Fleet ({machines.length})</div>
          {machines.map((m, i) => (
            <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14 }}>{m.model}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{m.type}{m.serial ? ` · ${m.serial}` : ''}</div>
              </div>
              <button onClick={() => setMachines(p => p.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: C.danger, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add machine form */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', marginBottom: 14 }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>+ Add Machine Manually</div>
        <input value={newMach.model} onChange={e => setNewMach(p => ({ ...p, model: e.target.value }))}
          placeholder="Model e.g. CAT 988K, Komatsu PC800" style={{ ...inp, marginBottom: 8 }} />
        <select value={newMach.type} onChange={e => setNewMach(p => ({ ...p, type: e.target.value }))}
          style={{ ...inp, marginBottom: 8 }}>
          {MACHINE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input value={newMach.bucket} onChange={e => setNewMach(p => ({ ...p, bucket: e.target.value }))}
            placeholder="Bucket size (t)" type="number"
            style={{ ...inp, marginBottom: 0 }} />
          <input value={newMach.serial} onChange={e => setNewMach(p => ({ ...p, serial: e.target.value }))}
            placeholder="Serial number"
            style={{ ...inp, marginBottom: 0 }} />
        </div>
        <button onClick={addMachine} disabled={!newMach.model.trim()}
          style={{ width: '100%', background: newMach.model.trim() ? C.accent : C.border, color: '#000', border: 'none', borderRadius: 9, padding: '11px', fontFamily: F, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Add to Fleet
        </button>
      </div>

      <Btn onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating mine…' : machines.length > 0 ? `Create Mine with ${machines.length} Machine${machines.length !== 1 ? 's' : ''} →` : 'Create Mine →'}
      </Btn>
      {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 8, textAlign: 'center' }}>{error}</div>}
      <BtnSecondary onClick={() => setStep(2)}>← Back</BtnSecondary>
    </div>
  )

  // ── Step 4: Success + Code ────────────────────────────────────────────────
  const Step4 = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>⛏</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 28, color: C.success, marginBottom: 4 }}>{mineName}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{location}</div>

      <div style={{ background: C.card, border: `2px solid ${C.accent}`, borderRadius: 16, padding: '22px', marginBottom: 20 }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          Your mine code — share with your team
        </div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 52, color: C.accent, letterSpacing: '.18em', marginBottom: 8 }}>
          {mineCode}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Staff enter this code to find and join {mineName}</div>
      </div>

      <div style={{ background: `${C.success}08`, border: `1px solid ${C.success}22`, borderRadius: 12, padding: '13px 14px', marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: C.success, marginBottom: 8 }}>What happens next</div>
        {[
          'Share the code above with your crew',
          'They download MineOps and tap Join a Mine',
          `They enter ${mineCode} to find ${mineName}`,
          'They create their profile and choose their role',
          'You approve them in the Admin panel',
          'Machines and crushers are ready to configure in Settings',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
            <span style={{ color: C.success }}>✓</span>
            <span style={{ fontSize: 12, color: C.muted }}>{s}</span>
          </div>
        ))}
      </div>

      <Btn onClick={() => nav('/app')}>Enter MineOps →</Btn>
    </div>
  )

  // ── Create mine API call ──────────────────────────────────────────────────
  const handleCreate = async () => {
    setLoading(true); setError('')
    try {
      // 1. Generate mine code
      const code = Math.random().toString(36).slice(2, 8).toUpperCase()

      // 2. Create mine record
      const { data: mine, error: mineErr } = await supabase
        .from('mines')
        .insert({ name: mineName.trim(), location: location.trim(), code, plan: 'starter', is_active: true })
        .select()
        .single()
      if (mineErr) throw mineErr

      // 3. Create admin operator record
      const { error: opErr } = await supabase
        .from('operators')
        .insert({
          auth_id: session.user.id,
          mine_id: mine.id,
          name: adminName.trim() || session.user.user_metadata?.name || 'Admin',
          role: 'admin',
          status: 'active',
        })
      if (opErr) throw opErr

      // 4. Add machines if any
      if (machines.length > 0) {
        const machRows = machines.map(m => ({
          id: `${mine.id}_${m.model.replace(/\s+/g,'_').toUpperCase()}`,
          mine_id: mine.id,
          model: m.model,
          type: m.type,
          bucket_size: m.bucket ? parseFloat(m.bucket) : null,
          serial_number: m.serial || null,
          status: 'standby',
        }))
        await supabase.from('machines').insert(machRows)
      }

      // 5. Create crushers
      const crusherRows = Array.from({ length: crushers }, (_, i) => ({
        id: `${mine.id}_C${i + 1}`,
        mine_id: mine.id,
        name: `Crusher ${i + 1}`,
        capacity_tph: 320,
      }))
      await supabase.from('crushers').insert(crusherRows)

      // 6. Update mine owner
      await supabase.from('mines').update({ owner_id: session.user.id }).eq('id', mine.id)

      setMineCode(code)
      setMineId(mine.id)
      await refreshOperator()
      setStep(4)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create mine. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const Btn = ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', background: disabled ? C.border : C.accent, color: '#000', border: 'none', borderRadius: 12, padding: '15px', fontFamily: F, fontWeight: 900, fontSize: 18, cursor: disabled ? 'default' : 'pointer', transition: 'background .2s', marginBottom: 10 }}>
      {children}
    </button>
  )
  const BtnSecondary = ({ children, onClick }) => (
    <button onClick={onClick}
      style={{ width: '100%', background: 'none', border: 'none', color: C.muted, padding: '10px', fontFamily: F, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
      {children}
    </button>
  )

  // ── Progress dots ─────────────────────────────────────────────────────────
  const steps = ['Name', 'Mine', 'Machines', 'Done']

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 20px' }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 20, color: C.accent, marginBottom: 10 }}>Create a Mine</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 3, background: i < step - 1 ? C.success : i === step - 1 ? C.accent : C.border, borderRadius: 99, marginBottom: 4, transition: 'background .3s' }} />
              <div style={{ fontSize: 9, color: i < step ? C.text : C.muted, fontFamily: F, fontWeight: 700 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
        </div>
      </div>
    </div>
  )
}
