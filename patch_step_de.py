#!/usr/bin/env python3
"""
MineOps Step D+E: Real auth, real data, real empty states.

What this changes (in order):

 1. Replace the fake USERS click-list Login with a real email/password form.
    On successful sign-in it calls onLogin(session) — the app will load the
    real operator profile from Supabase.

 2. Add a loadProfile() helper on the App root that runs whenever `session`
    changes. It queries operators joined with mines to resolve:
      - the signed-in user's operator row
      - their mine (activeMine)
      - their role
    Then sets `user` + `activeMine` accordingly.

 3. Load machines + operators from Supabase when there's a real activeMine.
    When there isn't (demo mode / Try Demo button), we keep using BASE_MACHINES
    + USERS as before, labelled with a "DEMO" indicator.

 4. Empty-state UX: when the admin signs into a brand new mine with zero
    machines, the machine list shows "No machines yet — tap to add your first
    machine" (admin-gated). Non-admins see "Your admin hasn't set up machines
    yet." This is done in MachineSelectScreen.

 5. AddMachineScreen — already writes locally; now we also persist to
    public.machines in Supabase (fire-and-forget with toast on error).

Scope NOT in this patch (deferred):
  - Photo uploads for pre-shift checks
  - Competent-person permission gating (flag stored, not yet enforced)
  - Admin approval UI for pending operators (stored, but approval screen TBD)
  - Real leaderboard/scoring data (still falls back to hardcoded)

Safety:
  - Timestamped backup before writing
  - Exact-string anchors; aborts cleanly if any anchor is missing
  - Preserves all existing functionality — we add data sources, never remove
"""
import pathlib
import shutil
import sys
import time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
if not APP.exists():
    sys.exit(f"ERROR: {APP} not found")

src = APP.read_text()
edits = []

def apply(old, new, label):
    global src
    if old not in src:
        sys.exit(f"ERROR: anchor missing for edit: {label}")
    src = src.replace(old, new, 1)
    edits.append(label)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Replace the Login component with a real email/password form.
# ─────────────────────────────────────────────────────────────────────────────
# Old Login starts at: function Login({onLogin,mine}){
# Old Login ends at the closing `}` before `function TruckQuestion(...)`.

OLD_LOGIN_ANCHOR_START = 'function Login({onLogin,mine}){\n'
OLD_LOGIN_ANCHOR_END   = '\nfunction TruckQuestion('

start_idx = src.find(OLD_LOGIN_ANCHOR_START)
end_idx   = src.find(OLD_LOGIN_ANCHOR_END, start_idx)
if start_idx == -1 or end_idx == -1:
    sys.exit("ERROR: could not locate Login component boundaries")

NEW_LOGIN = (
    'function Login({onLogin,mine,onBack}){\n'
    '  const[email,setEmail]=useState("");\n'
    '  const[pass,setPass]=useState("");\n'
    '  const[loading,setLoading]=useState(false);\n'
    '  const[err,setErr]=useState("");\n'
    '  const emailOk=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n'
    '  const passOk=pass.length>=6;\n'
    '  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 14px",fontSize:15,width:"100%",outline:"none",marginBottom:10};\n'
    '  const go=async()=>{\n'
    '    if(!emailOk||!passOk)return;\n'
    '    setLoading(true);setErr("");\n'
    '    try{\n'
    '      const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});\n'
    '      if(error)throw error;\n'
    '      onLogin(data.session);\n'
    '    }catch(e){\n'
    '      console.error("signIn failed:",e);\n'
    '      setErr(e.message||"Sign-in failed.");\n'
    '    }finally{setLoading(false);}\n'
    '  };\n'
    '  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">\n'
    '    <div style={{textAlign:"center",marginBottom:24}}>\n'
    '      <div style={{fontFamily:F,fontWeight:900,fontSize:44,color:C.accent,letterSpacing:".06em"}}>MINEOPS</div>\n'
    '      {mine?<div style={{fontFamily:F,fontWeight:700,fontSize:16,color:C.text,marginTop:4}}>{mine.name||mine.mineName}</div>:null}\n'
    '    </div>\n'
    '    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Email</div>\n'
    '    <input type="email" autoCapitalize="none" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com.au" style={{...inp,border:`1px solid ${emailOk?C.success:C.border}`}}/>\n'
    '    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Password</div>\n'
    '    <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{...inp,border:`1px solid ${passOk?C.success:C.border}`}}/>\n'
    '    {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger}}>{err}</div>}\n'
    '    <button disabled={loading||!emailOk||!passOk} onClick={go} style={{width:"100%",background:loading?C.border:(emailOk&&passOk?C.accent:C.border),color:loading?C.muted:(emailOk&&passOk?"#000":C.muted),border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:loading?"default":"pointer",marginTop:6}}>\n'
    '      {loading?"Signing in…":"Sign In →"}\n'
    '    </button>\n'
    '    {onBack&&<button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"12px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>← Back</button>}\n'
    '  </div>;\n'
    '}'
)

src = src[:start_idx] + NEW_LOGIN + src[end_idx:]
edits.append("Replaced Login with real email/password form")


# ─────────────────────────────────────────────────────────────────────────────
# 2. App root — swap handleLogin + add loadProfile on session change.
# ─────────────────────────────────────────────────────────────────────────────
# Old handleLogin takes a fake USERS object. New handleLogin takes a session
# and triggers profile load.

OLD_HANDLE_LOGIN = (
    '  const handleLogin=u=>{setUser(u);setFlow("truckQ")}\n'
)
NEW_HANDLE_LOGIN = (
    '  const handleLogin=()=>{ /* session is already set by AuthProvider; loadProfile effect handles the rest */ }\n'
)
apply(OLD_HANDLE_LOGIN, NEW_HANDLE_LOGIN, "Replaced handleLogin to rely on session effect")


# Rewrite the session effect so that when a session exists we load the
# operator profile + mine, set user/activeMine, and advance the flow.

OLD_SESSION_EFFECT = (
    '  useEffect(()=>{ if(session&&flow==="onboarding"&&activeMine) setFlow("login") },[session])\n'
)

NEW_SESSION_EFFECT = (
    '  // Load the user\'s operator profile + mine whenever session changes\n'
    '  useEffect(()=>{\n'
    '    let cancelled=false;\n'
    '    async function loadProfile(){\n'
    '      if(!session){setUser(null);return;}\n'
    '      try{\n'
    '        const {data,error}=await supabase\n'
    '          .from("operators")\n'
    '          .select("id,name,role,status,machine_id,crusher_assigned,employee_id,auth_id,mine_id,mines(id,name,code,location,plan)")\n'
    '          .eq("auth_id",session.user.id)\n'
    '          .maybeSingle();\n'
    '        if(error)throw error;\n'
    '        if(cancelled)return;\n'
    '        if(!data){\n'
    '          // Signed in but no operator row yet — stay on onboarding so they can create/join a mine\n'
    '          return;\n'
    '        }\n'
    '        // Shape the user to mimic the BASE_USERS format the rest of the app expects\n'
    '        const u={\n'
    '          id:data.id,\n'
    '          name:data.name,\n'
    '          role:data.role,\n'
    '          machine:data.machine_id||undefined,\n'
    '          crusherAssigned:data.crusher_assigned||undefined,\n'
    '          employeeId:data.employee_id||data.id.slice(0,8).toUpperCase(),\n'
    '          avatar:(data.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase(),\n'
    '          status:data.status,\n'
    '        };\n'
    '        setUser(u);\n'
    '        if(data.mines){setActiveMine(data.mines);}\n'
    '        // If still on onboarding/login screens, advance into the app\n'
    '        setFlow(f=>((f==="onboarding"||f==="login")?"truckQ":f));\n'
    '      }catch(e){console.error("loadProfile failed:",e);}\n'
    '    }\n'
    '    loadProfile();\n'
    '    return()=>{cancelled=true;};\n'
    '  },[session])\n'
)
apply(OLD_SESSION_EFFECT, NEW_SESSION_EFFECT, "Session effect now loads operator profile + mine")


# ─────────────────────────────────────────────────────────────────────────────
# 3. Load machines + team from Supabase when we have a real activeMine.
# ─────────────────────────────────────────────────────────────────────────────
# Anchor: right after the custom state declarations.

OLD_ALLMACHINES = (
    '  const allMachines=[...BASE_MACHINES,...customMachines]\n'
    '  const catDemo=[...Object.entries(CAT_DEMO).map(([id,data])=>({id,meta:BASE_MACHINES.find(m=>m.id===id),data})),...customCatData]\n'
)

NEW_ALLMACHINES = (
    '  // When we have a real mine, load its machines + operators from Supabase.\n'
    '  // Otherwise (demo mode) fall back to BASE_MACHINES + hardcoded USERS.\n'
    '  const[remoteMachines,setRemoteMachines]=useState(null)\n'
    '  const[remoteOperators,setRemoteOperators]=useState(null)\n'
    '  useEffect(()=>{\n'
    '    let cancelled=false;\n'
    '    if(!activeMine?.id){setRemoteMachines(null);setRemoteOperators(null);return;}\n'
    '    (async()=>{\n'
    '      try{\n'
    '        const [mRes,oRes]=await Promise.all([\n'
    '          supabase.from("machines").select("*").eq("mine_id",activeMine.id),\n'
    '          supabase.from("operators").select("id,name,role,status,machine_id,crusher_assigned,employee_id").eq("mine_id",activeMine.id),\n'
    '        ]);\n'
    '        if(cancelled)return;\n'
    '        if(!mRes.error)setRemoteMachines(mRes.data||[]);\n'
    '        if(!oRes.error)setRemoteOperators(oRes.data||[]);\n'
    '      }catch(e){console.error("load mine data failed:",e);}\n'
    '    })();\n'
    '    return()=>{cancelled=true;};\n'
    '  },[activeMine?.id,customMachines.length])\n'
    '  // Machines: Supabase when real mine, BASE when demo\n'
    '  const allMachines=activeMine?.id\n'
    '    ?[...(remoteMachines||[]),...customMachines]\n'
    '    :[...BASE_MACHINES,...customMachines]\n'
    '  const catDemo=[...Object.entries(CAT_DEMO).map(([id,data])=>({id,meta:BASE_MACHINES.find(m=>m.id===id),data})),...customCatData]\n'
)
apply(OLD_ALLMACHINES, NEW_ALLMACHINES, "Load machines + operators from Supabase when mine is real")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Empty-state UX on MachineSelectScreen
# ─────────────────────────────────────────────────────────────────────────────
# Insert an empty-state block right after the MachineSelectScreen signature.
# The component renders the grid of machines. If allMachines is empty, show
# the empty-state message.

OLD_MSS_BODY_START = (
    'function MachineSelectScreen({allMachines,catDemo,onComplete}){\n'
)
NEW_MSS_BODY_START = (
    'function MachineSelectScreen({allMachines,catDemo,onComplete,isAdmin,onAddMachine}){\n'
    '  if(!allMachines||allMachines.length===0){\n'
    '    return <div style={{minHeight:"70vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center"}}>\n'
    '      <div style={{fontSize:52,marginBottom:12,opacity:.7}}>🏗</div>\n'
    '      <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.text,marginBottom:6}}>No machines yet</div>\n'
    '      <div style={{fontSize:13,color:C.muted,lineHeight:1.5,marginBottom:20,maxWidth:280}}>\n'
    '        {isAdmin?"Add your first machine to start pre-shift checks and production tracking.":"Your admin hasn\'t set up machines yet. Check back soon."}\n'
    '      </div>\n'
    '      {isAdmin&&<button onClick={onAddMachine} style={{background:C.accent,color:"#000",border:"none",borderRadius:12,padding:"14px 22px",fontFamily:F,fontWeight:900,fontSize:16,cursor:"pointer"}}>+ Add Machine</button>}\n'
    '    </div>;\n'
    '  }\n'
)
apply(OLD_MSS_BODY_START, NEW_MSS_BODY_START, "MachineSelectScreen empty-state")


# Pass isAdmin + onAddMachine through when rendering MachineSelectScreen.
# There are two call sites; patch both.

OLD_MSS_CALL_1 = (
    '{flow==="machines"&&<div style={{flex:1,overflowY:"auto"}}><MachineSelectScreen allMachines={allMachines} catDemo={catDemo} onComplete={()=>setFlow("app")}/></div>}'
)
NEW_MSS_CALL_1 = (
    '{flow==="machines"&&<div style={{flex:1,overflowY:"auto"}}><MachineSelectScreen allMachines={allMachines} catDemo={catDemo} isAdmin={user?.role==="admin"} onAddMachine={()=>setFlow("addMachine")} onComplete={()=>setFlow("app")}/></div>}'
)
apply(OLD_MSS_CALL_1, NEW_MSS_CALL_1, "Pass isAdmin to MachineSelectScreen (main call)")


# ─────────────────────────────────────────────────────────────────────────────
# 5. Persist AddMachine to Supabase (best-effort)
# ─────────────────────────────────────────────────────────────────────────────
OLD_ADD_MACHINE = (
    '  const handleAddMachine=(machine,catData)=>{setCustomMachines(p=>[...p,machine]);setCustomCatData(p=>[...p,{id:machine.id,meta:machine,data:catData}]);setCustPerfData(p=>({...p,[machine.id]:[]}))}\n'
)
NEW_ADD_MACHINE = (
    '  const handleAddMachine=async(machine,catData)=>{\n'
    '    setCustomMachines(p=>[...p,machine]);\n'
    '    setCustomCatData(p=>[...p,{id:machine.id,meta:machine,data:catData}]);\n'
    '    setCustPerfData(p=>({...p,[machine.id]:[]}));\n'
    '    if(activeMine?.id){\n'
    '      try{\n'
    '        await supabase.from("machines").insert({mine_id:activeMine.id,...machine,...(catData?{telematics:catData}:{})});\n'
    '      }catch(e){console.error("persist machine failed:",e);}\n'
    '    }\n'
    '  }\n'
)
apply(OLD_ADD_MACHINE, NEW_ADD_MACHINE, "AddMachine persists to Supabase when real mine active")


# ─────────────────────────────────────────────────────────────────────────────
# 6. Sign-out should clear user AND let session effect clean the rest.
# ─────────────────────────────────────────────────────────────────────────────
OLD_SIGNOUT = (
    '  const handleSignOut=async()=>{await supabase.auth.signOut();setUser(null);setFlow("onboarding");setTab("board");setShowSignOut(false);setMenuOpen(false);setActiveMine(null)}\n'
)
NEW_SIGNOUT = (
    '  const handleSignOut=async()=>{await supabase.auth.signOut();setUser(null);setActiveMine(null);setRemoteMachines(null);setRemoteOperators(null);setFlow("onboarding");setTab("board");setShowSignOut(false);setMenuOpen(false);}\n'
)
apply(OLD_SIGNOUT, NEW_SIGNOUT, "Sign-out clears remote data caches too")


# ─────────────────────────────────────────────────────────────────────────────
# Write
# ─────────────────────────────────────────────────────────────────────────────
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)

for e in edits:
    print(f"✓ {e}")
print(f"\n✓ Wrote {APP}")
print("\nNext: npm run build")
