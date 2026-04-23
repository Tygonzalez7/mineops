#!/usr/bin/env python3
"""
MineOps pre-shift part 2: wire Sign Off to persist prestart_logs.

Changes:
 1. App.screen(): pass activeMine, activeShiftId, user into ChecksHub
 2. ChecksHub: accept those props, pass into MachineCheckScreen
 3. MachineCheckScreen: accept props, on Sign Off also INSERT into
    supabase.prestart_logs with mine_id, shift_id, machine_id, operator_id,
    checks_passed (jsonb), fuel_level, signed_off_at.
"""
import pathlib, shutil, sys, time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
src = APP.read_text()
edits = []

def apply(old, new, label):
    global src
    if old not in src:
        sys.exit(f"ERROR: anchor missing: {label}")
    src = src.replace(old, new, 1)
    edits.append(label)

# 1. App screen() passes new props to ChecksHub
apply(
    'if(tab==="checks")return <ChecksHub allMachines={allMachines} catDemo={catDemo}/>',
    'if(tab==="checks")return <ChecksHub allMachines={allMachines} catDemo={catDemo} activeMine={activeMine} activeShiftId={activeShiftId} user={user}/>',
    "App passes activeMine/shift/user to ChecksHub"
)

# 2. ChecksHub signature + pass-through
apply(
    'function ChecksHub({allMachines,catDemo}){',
    'function ChecksHub({allMachines,catDemo,activeMine,activeShiftId,user}){',
    "ChecksHub accepts activeMine/shift/user"
)

apply(
    'if(active==="machine")    return <div><Bk/><MachineCheckScreen allMachines={allMachines} catDemo={catDemo}/></div>;',
    'if(active==="machine")    return <div><Bk/><MachineCheckScreen allMachines={allMachines} catDemo={catDemo} activeMine={activeMine} activeShiftId={activeShiftId} user={user}/></div>;',
    "ChecksHub passes props to MachineCheckScreen"
)

# 3. MachineCheckScreen: accept props, persist on Sign Off
apply(
    'function MachineCheckScreen({allMachines,catDemo}){',
    'function MachineCheckScreen({allMachines,catDemo,activeMine,activeShiftId,user}){',
    "MachineCheckScreen accepts new props"
)

# Replace the Sign Off button onClick with a persistence-enabled version
OLD_SIGNOFF = 'onClick={()=>{if(can)setDone(p=>({...p,[sel]:true}));}}'
NEW_SIGNOFF = (
    'onClick={async()=>{\n'
    '          if(!can)return;\n'
    '          setDone(p=>({...p,[sel]:true}));\n'
    '          if(activeMine?.id&&activeShiftId&&user?.id){\n'
    '            try{\n'
    '              await supabase.from("prestart_logs").insert({\n'
    '                mine_id:activeMine.id,\n'
    '                shift_id:activeShiftId,\n'
    '                machine_id:sel,\n'
    '                operator_id:user.id,\n'
    '                checks_passed:checks[sel]||{},\n'
    '                fuel_level:parseInt(fuel)||null,\n'
    '                signed_off_at:new Date().toISOString(),\n'
    '              });\n'
    '            }catch(e){console.error("prestart_log insert:",e);}\n'
    '          }\n'
    '        }}'
)
apply(OLD_SIGNOFF, NEW_SIGNOFF, "Sign Off persists prestart_logs")

# Save
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits: print(f"✓ {e}")
print("\nNext: npm run build")
