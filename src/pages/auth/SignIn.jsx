import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { C, F } from '../../constants/index.js'

export default function SignIn() {
  const nav = useNavigate()
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const canSubmit = email && pass.length >= 8 && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (err) throw err
      // Auth context will redirect based on operator status
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Incorrect email or password.' : err.message)
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
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 44, color: C.accent, letterSpacing: '.06em' }}>MINEOPS</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Sign in to your operation</div>
      </div>

      <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Email</div>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="you@company.com"
          style={inp}
        />

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>Password</div>
        <input
          type="password" value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="••••••••"
          style={{ ...inp, marginBottom: 8 }}
        />

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link to="/forgot-password" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>Forgot password?</Link>
        </div>

        {error && (
          <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}44`, borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, color: C.danger }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', background: canSubmit ? C.accent : C.border, color: '#000',
            border: 'none', borderRadius: 12, padding: '15px', fontFamily: F, fontWeight: 900,
            fontSize: 18, cursor: canSubmit ? 'pointer' : 'default', transition: 'background .2s', marginBottom: 16,
          }}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginBottom: 12 }}>
          New to MineOps?{' '}
          <Link to="/signup" style={{ color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Create account</Link>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, textAlign: 'center' }}>
          <Link to="/onboarding" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>
            ← Back to start
          </Link>
        </div>
      </div>
    </div>
  )
}
