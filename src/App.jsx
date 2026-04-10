import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
const AuthContext = createContext(null)
function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  return <AuthContext.Provider value={{ session, loading, supabase }}>{children}</AuthContext.Provider>
}
function useAuth() { return useContext(AuthContext) }

function Onboarding() {
  const F = "Barlow Condensed, sans-serif"
  return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'44px 22px 36px',background:'#07090d'}}>
    <div style={{textAlign:'center'}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:54,color:'#f5a623',letterSpacing:'.06em',marginBottom:8}}>MINEOPS</div>
      <div style={{fontSize:11,color:'#6b7a99',letterSpacing:'.18em',textTransform:'uppercase'}}>Production Intelligence Platform</div>
    </div>
    <div>
      <a href="/signup" style={{display:'block',width:'100%',background:'linear-gradient(135deg,#f5a623,#d4881e)',color:'#000',border:'none',borderRadius:14,padding:'18px',fontFamily:F,fontWeight:900,fontSize:20,cursor:'pointer',marginBottom:12,textAlign:'center',textDecoration:'none'}}>⛏ Create a Mine — Free</a>
      <a href="/join" style={{display:'block',width:'100%',background:'#121820',border:'2px solid #1c2738',borderRadius:14,padding:'16px',fontFamily:F,fontWeight:900,fontSize:18,color:'#e8ecf3',cursor:'pointer',marginBottom:12,textAlign:'center',textDecoration:'none'}}>👷 Join a Mine</a>
      <a href="/signin" style={{display:'block',width:'100%',background:'transparent',border:'1px solid #1c2738',borderRadius:12,padding:'12px',fontFamily:F,fontWeight:700,fontSize:14,color:'#6b7a99',cursor:'pointer',textAlign:'center',textDecoration:'none'}}>Already have an account — Sign in →</a>
    </div>
    <div style={{textAlign:'center',fontSize:10,color:'#6b7a99'}}>MineOps · MQSHA 1999 / MSHA 30 CFR Part 56</div>
  </div>
}

function SignUp() {
  const { supabase } = useAuth()
  const F = "Barlow Condensed, sans-serif"
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [pass2,setPass2]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [done,setDone]=useState(false)
  const ok=name.trim()&&email&&pass.length>=8&&pass===pass2&&!loading
  const inp={background:'#0d1118',color:'#e8ecf3',border:'1px solid #1c2738',borderRadius:9,padding:'13px 14px',fontSize:15,width:'100%',outline:'none',marginBottom:12,display:'block',fontFamily:'Barlow, sans-serif'}
  const submit=async()=>{
    if(!ok)return; setLoading(true); setError('')
    try {
      const {error:e}=await supabase.auth.signUp({email,password:pass,options:{data:{name:name.trim()}}})
      if(e)throw e; setDone(true)
    } catch(e){setError(e.message)} finally{setLoading(false)}
  }
  if(done)return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#07090d',padding:28}}>
    <div style={{fontSize:56,marginBottom:16}}>✅</div>
    <div style={{fontFamily:F,fontWeight:900,fontSize:28,color:'#3ecf8e',marginBottom:8}}>Account Created!</div>
    <div style={{fontSize:13,color:'#6b7a99',marginBottom:24,textAlign:'center'}}>Check your email to confirm your account, then come back to sign in.</div>
    <a href="/signin" style={{background:'#f5a623',color:'#000',borderRadius:12,padding:'14px 28px',fontFamily:F,fontWeight:900,fontSize:18,textDecoration:'none'}}>Sign In →</a>
  </div>
  return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'28px 22px',background:'#07090d'}}>
    <div style={{textAlign:'center',marginBottom:28}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:44,color:'#f5a623',letterSpacing:'.06em'}}>MINEOPS</div>
      <div style={{fontSize:12,color:'#6b7a99',marginTop:4}}>Create your account</div>
    </div>
    <div style={{maxWidth:380,width:'100%',margin:'0 auto'}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp}/>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={inp}/>
      <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password (min 8 chars)" style={inp}/>
      <input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Confirm password" style={inp}/>
      {error&&<div style={{color:'#e05252',fontSize:13,marginBottom:12}}>{error}</div>}
      <button onClick={submit} disabled={!ok} style={{width:'100%',background:ok?'#3ecf8e':'#1c2738',color:ok?'#000':'#6b7a99',border:'none',borderRadius:12,padding:'15px',fontFamily:F,fontWeight:900,fontSize:18,cursor:ok?'pointer':'default',marginBottom:16,display:'block'}}>
        {loading?'Creating…':'Create Account →'}
      </button>
      <div style={{textAlign:'center',fontSize:13,color:'#6b7a99'}}>Have an account? <a href="/signin" style={{color:'#f5a623',fontWeight:700}}>Sign in</a></div>
    </div>
  </div>
}

function SignIn() {
  const { supabase } = useAuth()
  const F = "Barlow Condensed, sans-serif"
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const ok=email&&pass.length>=8&&!loading
  const inp={background:'#0d1118',color:'#e8ecf3',border:'1px solid #1c2738',borderRadius:9,padding:'13px 14px',fontSize:15,width:'100%',outline:'none',marginBottom:12,display:'block',fontFamily:'Barlow, sans-serif'}
  const submit=async()=>{
    if(!ok)return; setLoading(true); setError('')
    try {
      const {error:e}=await supabase.auth.signInWithPassword({email,password:pass})
      if(e)throw e; window.location.href='/app'
    } catch(e){setError('Incorrect email or password.')} finally{setLoading(false)}
  }
  return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'28px 22px',background:'#07090d'}}>
    <div style={{textAlign:'center',marginBottom:32}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:44,color:'#f5a623',letterSpacing:'.06em'}}>MINEOPS</div>
      <div style={{fontSize:12,color:'#6b7a99',marginTop:4}}>Sign in to your operation</div>
    </div>
    <div style={{maxWidth:380,width:'100%',margin:'0 auto'}}>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Email" style={inp}/>
      <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Password" style={{...inp,marginBottom:16}}/>
      {error&&<div style={{color:'#e05252',fontSize:13,marginBottom:12}}>{error}</div>}
      <button onClick={submit} disabled={!ok} style={{width:'100%',background:ok?'#f5a623':'#1c2738',color:'#000',border:'none',borderRadius:12,padding:'15px',fontFamily:F,fontWeight:900,fontSize:18,cursor:ok?'pointer':'default',marginBottom:16,display:'block'}}>
        {loading?'Signing in…':'Sign In →'}
      </button>
      <div style={{textAlign:'center'}}><a href="/" style={{fontSize:12,color:'#6b7a99'}}>← Back</a></div>
    </div>
  </div>
}

function AppShell() {
  const { session, loading } = useAuth()
  const F = "Barlow Condensed, sans-serif"
  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#07090d'}}><div style={{fontFamily:F,fontWeight:900,fontSize:36,color:'#f5a623'}}>MINEOPS</div></div>
  if(!session) return <Navigate to="/" replace/>
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#07090d',color:'#f5a623',fontFamily:F,fontWeight:900,fontSize:24,flexDirection:'column',gap:16}}>
    ✅ Signed in — App loading
    <div style={{fontSize:13,color:'#6b7a99'}}>{session.user.email}</div>
    <button onClick={()=>supabase.auth.signOut().then(()=>window.location.href='/')} style={{fontSize:13,color:'#6b7a99',background:'none',border:'1px solid #1c2738',borderRadius:8,padding:'8px 16px',cursor:'pointer'}}>Sign out</button>
  </div>
}

export default function App() {
  return <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding/>}/>
        <Route path="/signup" element={<SignUp/>}/>
        <Route path="/signin" element={<SignIn/>}/>
        <Route path="/app" element={<AppShell/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
}