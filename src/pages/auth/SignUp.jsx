import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { C, F } from '../../constants/index.js'

export default function SignUp() {
  const nav = useNavigate()
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [pass2,   setPass2]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passOk   = pass.length >= 8 && pass === pass2
  const canSubmit = name.trim() && emailOk && passOk && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name: name.trim() } },
      })
      if (err) throw err
      nav('/verify')
    } catch (err) {
      setError(err.message || 'Sign up failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    background: C.surface, color: C.text,
    border: `1px solid ${C.border}`, borderRadius: 9,
    padding: '13px 14px', fontSize: 15, width: '100%', outline: 'none',
    fontFamily: "'Barlow', sans-serif", marginBottom: 12,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 22px', background: C.bg }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 44, color: C.accent, letterSpacing: '.06em' }}>MINEOPS</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Create your account</div>
      </div>

      <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Your name</div>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Full name"
          style={{ ...inp, border: `1px solid ${name.trim() ? C.success : C.border}` }}
        />

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Work email</div>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          style={{ ...inp, border: `1px solid ${emailOk ? C.success : C.border}` }}
        />

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Password <span style={{ color: C.muted, fontWeight: 400 }}>(min 8 characters)</span></div>
        <input
          type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="••••••••"
          style={{ ...inp, border: `1px solid ${pass.length >= 8 ? C.success : C.border}` }}
        />

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Confirm password</div>
        <input
          type="password" value={pass2} onChange={e => setPass2(e.target.value)}
          placeholder="••••••••"
          style={{ ...inp, border: `1px solid ${pass2 && pass === pass2 ? C.success : pass2 ? C.danger : C.border}` }}
        />

        {error && (
          <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}44`, borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, color: C.danger }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', background: canSubmit ? C.success : C.border, color: canSubmit ? '#000' : C.muted,
            border: 'none', borderRadius: 12, padding: '15px', fontFamily: F, fontWeight: 900,
            fontSize: 18, cursor: canSubmit ? 'pointer' : 'default', transition: 'background .2s', marginBottom: 16,
          }}
        >
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
          Already have an account?{' '}
          <Link to="/signin" style={{ color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
