#!/usr/bin/env python3
"""
MineOps Step C: Make JoinMineFlow actually find + join a real mine.

What this changes:
  1. searchMine() — queries public.mines WHERE code = X via supabase client
     (falls back to error on not found). Replaces DEMO_MINES lookup.
  2. "Request Access →" button on step 3 — now async:
       a. supabase.auth.signUp(email, password)
       b. supabase.auth.signInWithPassword(...)  (guarantee session)
       c. insert into public.operators with status='pending', role, mine_id
       d. advances to step 4 (pending screen) on success
     Plus loading state + error display.
  3. Adds `joining` / `joinErr` / `searchLoading` state at top of component.

Safety:
  - Uses exact-string anchors; refuses to write if any anchor missing.
  - Writes a timestamped backup before editing.
"""
import pathlib
import shutil
import sys
import time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
if not APP.exists():
    sys.exit(f"ERROR: {APP} not found")

src = APP.read_text()

# ── 1. Replace the synchronous DEMO_MINES searchMine with a real one ─────────
OLD_SEARCH = (
    '  const searchMine=()=>{\n'
    '    const q=(search||code).toUpperCase().trim();\n'
    '    const found=DEMO_MINES.find(m=>m.code===q||m.name.toUpperCase().includes(q));\n'
    '    if(found){setFoundMine(found);setSearchErr("");}\n'
    '    else setSearchErr("No mine found. Check the code or name and try again.");\n'
    '  };\n'
)

NEW_SEARCH = (
    '  const searchMine=async()=>{\n'
    '    const q=(search||code).toUpperCase().trim();\n'
    '    if(!q){setSearchErr("Enter a mine code first.");return;}\n'
    '    setSearchLoading(true);setSearchErr("");setFoundMine(null);\n'
    '    try{\n'
    '      const {data,error}=await supabase.from("mines").select("id,name,location,code,plan").eq("code",q).maybeSingle();\n'
    '      if(error)throw error;\n'
    '      if(!data){setSearchErr("No mine found. Check the code and try again.");return;}\n'
    '      setFoundMine({...data,operators:0,machines:0});\n'
    '    }catch(err){\n'
    '      console.error("searchMine failed:",err);\n'
    '      setSearchErr(err.message||"Lookup failed. Try again.");\n'
    '    }finally{setSearchLoading(false);}\n'
    '  };\n'
)

if OLD_SEARCH not in src:
    sys.exit("ERROR: could not find DEMO_MINES searchMine anchor")

src = src.replace(OLD_SEARCH, NEW_SEARCH, 1)
print("✓ Replaced searchMine with Supabase lookup")

# ── 2. Add joining/searchLoading/joinErr state ───────────────────────────────
STATE_ANCHOR = (
    '  const[role,setRole]=useState(null);const[machine,setMachine]=useState(null);\n'
)
STATE_ADDITION = (
    '  const[role,setRole]=useState(null);const[machine,setMachine]=useState(null);\n'
    '  const[searchLoading,setSearchLoading]=useState(false);\n'
    '  const[joining,setJoining]=useState(false);\n'
    '  const[joinErr,setJoinErr]=useState("");\n'
)

if STATE_ANCHOR not in src:
    sys.exit("ERROR: could not find JoinMineFlow state anchor")

src = src.replace(STATE_ANCHOR, STATE_ADDITION, 1)
print("✓ Added joining/searchLoading/joinErr state")

# ── 3. Rewrite the "Request Access →" button on step 3 ────────────────────────
# Old: setStep(4) immediately on click
OLD_REQUEST = (
    '    <button onClick={()=>{if(role&&(role!=="operator"||machine))setStep(4);}} '
    'style={{width:"100%",background:role&&(role!=="operator"||machine)?C.success:C.border,'
    'color:role&&(role!=="operator"||machine)?"#000":C.muted,border:"none",borderRadius:12,'
    'padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",transition:"background .2s"}}>\n'
    '      Request Access →\n'
    '    </button>\n'
)

NEW_REQUEST = (
    '    {joinErr&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,'
    'borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger,textAlign:"left"}}>'
    '{joinErr}</div>}\n'
    '    <button disabled={joining||!role||(role==="operator"&&!machine)} onClick={async()=>{\n'
    '      if(!role||(role==="operator"&&!machine))return;\n'
    '      setJoining(true);setJoinErr("");\n'
    '      try{\n'
    '        const {data:auth,error:authErr}=await supabase.auth.signUp({email,password:pass,options:{data:{name}}});\n'
    '        if(authErr)throw authErr;\n'
    '        if(!auth?.user)throw new Error("Sign-up returned no user");\n'
    '        const {error:siErr}=await supabase.auth.signInWithPassword({email,password:pass});\n'
    '        if(siErr)throw siErr;\n'
    '        const {error:opErr}=await supabase.from("operators").insert({\n'
    '          auth_id:auth.user.id,mine_id:foundMine.id,name,role,\n'
    '          machine_id:role==="operator"?machine:null,status:"pending",\n'
    '        });\n'
    '        if(opErr)throw opErr;\n'
    '        setStep(4);\n'
    '      }catch(err){\n'
    '        console.error("Join mine failed:",err);\n'
    '        setJoinErr(err.message||"Could not join. Try again.");\n'
    '      }finally{setJoining(false);}\n'
    '    }} style={{width:"100%",background:joining?C.border:(role&&(role!=="operator"||machine)?C.success:C.border),'
    'color:joining?C.muted:(role&&(role!=="operator"||machine)?"#000":C.muted),border:"none",borderRadius:12,'
    'padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:joining?"default":"pointer",transition:"background .2s"}}>\n'
    '      {joining?"Requesting…":"Request Access →"}\n'
    '    </button>\n'
)

if OLD_REQUEST not in src:
    sys.exit("ERROR: could not find 'Request Access →' button anchor")

src = src.replace(OLD_REQUEST, NEW_REQUEST, 1)
print("✓ Replaced Request Access button with real Supabase join flow")

# ── 4. Backup + write ────────────────────────────────────────────────────────
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")

APP.write_text(src)
print(f"✓ Wrote {APP}")
print("\nNext: npm run build")
