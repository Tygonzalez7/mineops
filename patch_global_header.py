#!/usr/bin/env python3
"""
MineOps: Make the header (with ☰ menu) visible on every authenticated screen.

Problem:
  Currently the header only renders when flow is in
  (app, vehicleCheck, addMachine, photoManager, settings). Other authed
  flows like "machines" and "truckQ" have no header, so users can't
  access the menu to sign out or navigate.

Fix:
  Add a simplified header that renders whenever the user is signed in
  (`user` is truthy) and NOT on the public onboarding/createMine/joinMine
  screens. It includes the ☰ menu button.
"""
import pathlib, shutil, sys, time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
if not APP.exists(): sys.exit(f"ERROR: {APP} not found")

src = APP.read_text()
edits = []

def apply(old, new, label):
    global src
    if old not in src:
        sys.exit(f"ERROR: anchor missing: {label}")
    src = src.replace(old, new, 1)
    edits.append(label)

# Insert a small, persistent top bar BEFORE the main conditional block.
# The anchor is right after the SignOutConfirm / MenuOverlay portals open.
# We'll attach it right before the onboarding conditional.

OLD_ANCHOR = (
    '    {menuOpen&&<MenuOverlay user={user} allMachines={allMachines} onNav={t=>{setTab(t);setFlow("app")}} onAddMachine={()=>setFlow("addMachine")} onVehicleCheck={()=>setFlow("vehicleCheck")} onClose={()=>setMenuOpen(false)}/>}\n'
    '    {flow==="onboarding"&&<div style={{flex:1,overflowY:"auto"}}>'
)

NEW_ANCHOR = (
    '    {menuOpen&&<MenuOverlay user={user} allMachines={allMachines} onNav={t=>{setTab(t);setFlow("app")}} onAddMachine={()=>setFlow("addMachine")} onVehicleCheck={()=>setFlow("vehicleCheck")} onClose={()=>setMenuOpen(false)}/>}\n'
    '    {user&&!["onboarding","createMine","joinMine","subscription","vlSetup","login"].includes(flow)&&\n'
    '      <div style={{flexShrink:0,background:`${C.surface}f2`,backdropFilter:"blur(10px)",borderBottom:`1px solid ${C.border}`,padding:"9px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>\n'
    '        <div style={{display:"flex",alignItems:"center",gap:10}}>\n'
    '          <button onClick={()=>setMenuOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.muted,fontSize:16,cursor:"pointer",lineHeight:1}}>☰</button>\n'
    '          <div style={{fontFamily:F,fontWeight:900,fontSize:16,letterSpacing:".05em",color:C.accent}}>MINEOPS</div>\n'
    '        </div>\n'
    '        <button onClick={()=>setShowSignOut(true)} style={{background:"none",border:"none",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Sign out</button>\n'
    '      </div>}\n'
    '    {flow==="onboarding"&&<div style={{flex:1,overflowY:"auto"}}>'
)
apply(OLD_ANCHOR, NEW_ANCHOR, "Added persistent header for all authed flows")

# Save
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits:
    print(f"✓ {e}")
print("\nNext: npm run build")
