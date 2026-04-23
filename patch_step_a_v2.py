#!/usr/bin/env python3
"""
MineOps Step A (v2): Make CreateMineFlow actually save to Supabase.

v2 changes vs v1:
  - Drop the supabase import step — supabase is already created inline
    at the top of App.jsx via createClient(...).
  - Fix anchor quote style (was double-quote, actual file uses either).
"""
import pathlib
import shutil
import sys
import time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"

if not APP.exists():
    sys.exit(f"ERROR: {APP} not found")

src = APP.read_text()

# ── 1. Replace the step-3 "Enter MineOps" button in CreateMineFlow ───────────
OLD_BUTTON = (
    '    <button onClick={()=>onComplete({mineName,location,code,adminName,email})} '
    'style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,'
    'color:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,'
    'fontSize:20,cursor:"pointer"}}>\n'
    '      Enter MineOps →\n'
    '    </button>\n'
)

NEW_BUTTON = (
    '    {createErr&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,'
    'borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:C.danger,textAlign:"left"}}>'
    '{createErr}</div>}\n'
    '    <button disabled={creating} onClick={async()=>{\n'
    '      setCreating(true); setCreateErr("");\n'
    '      try {\n'
    '        const { data: auth, error: authErr } = await supabase.auth.signUp({\n'
    '          email, password: pass,\n'
    '          options: { data: { name: adminName } },\n'
    '        });\n'
    '        if (authErr) throw authErr;\n'
    '        if (!auth?.user) throw new Error("Sign-up returned no user");\n'
    '        const { data: mine, error: mineErr } = await supabase.from("mines").insert({\n'
    '          name: mineName, location, code, plan: "starter", owner_id: auth.user.id,\n'
    '        }).select().single();\n'
    '        if (mineErr) throw mineErr;\n'
    '        const { error: opErr } = await supabase.from("operators").insert({\n'
    '          auth_id: auth.user.id, mine_id: mine.id, name: adminName,\n'
    '          role: "admin", status: "active",\n'
    '        });\n'
    '        if (opErr) throw opErr;\n'
    '        onComplete({ ...mine, mineName: mine.name, adminName, email });\n'
    '      } catch (err) {\n'
    '        console.error("Create mine failed:", err);\n'
    '        setCreateErr(err.message || "Something went wrong. Try again.");\n'
    '        setCreating(false);\n'
    '      }\n'
    '    }} style={{width:"100%",background:creating?C.border:`linear-gradient(135deg,${C.accent},#d4881e)`,'
    'color:creating?C.muted:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,'
    'fontSize:20,cursor:creating?"default":"pointer"}}>\n'
    '      {creating ? "Creating mine…" : "Enter MineOps →"}\n'
    '    </button>\n'
)

if OLD_BUTTON not in src:
    sys.exit("ERROR: could not find the Enter MineOps button anchor in CreateMineFlow")

src = src.replace(OLD_BUTTON, NEW_BUTTON, 1)
print("✓ Replaced Enter MineOps button with real Supabase flow")

# ── 2. Add creating/createErr state at the top of CreateMineFlow ─────────────
STATE_ANCHOR = (
    '  const[code]=useState(()=>Math.random().toString(36).slice(2,8).toUpperCase());\n'
)
STATE_ADDITION = (
    '  const[code]=useState(()=>Math.random().toString(36).slice(2,8).toUpperCase());\n'
    '  const[creating,setCreating]=useState(false);\n'
    '  const[createErr,setCreateErr]=useState("");\n'
)

if STATE_ANCHOR not in src:
    sys.exit("ERROR: could not find CreateMineFlow state anchor")

src = src.replace(STATE_ANCHOR, STATE_ADDITION, 1)
print("✓ Added creating/createErr state to CreateMineFlow")

# ── 3. Backup + write ────────────────────────────────────────────────────────
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")

APP.write_text(src)
print(f"✓ Wrote {APP}")
print("\nNext: npm run build")
