#!/usr/bin/env python3
"""
MineOps: Add "Sign in" button to onboarding screen.

Currently OnboardingScreen only offers Create a Mine / Join a Mine / Try Demo.
Existing users have no way back in. This patch adds a small "Already have an
account? Sign in" link that routes to the login flow.
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

# 1. Add onSignIn prop handler to OnboardingScreen via the existing call site
OLD_ONBOARDING = (
    '{flow==="onboarding"&&<div style={{flex:1,overflowY:"auto"}}><OnboardingScreen onEnterDemo={()=>setFlow("login")} onCreateMine={()=>setFlow("createMine")} onJoinMine={()=>setFlow("joinMine")}/></div>}'
)
NEW_ONBOARDING = (
    '{flow==="onboarding"&&<div style={{flex:1,overflowY:"auto"}}><OnboardingScreen onEnterDemo={()=>setFlow("login")} onCreateMine={()=>setFlow("createMine")} onJoinMine={()=>setFlow("joinMine")} onSignIn={()=>setFlow("login")}/></div>}'
)
apply(OLD_ONBOARDING, NEW_ONBOARDING, "Pass onSignIn to OnboardingScreen")

# 2. Patch OnboardingScreen function signature + add Sign In link
OLD_SIG = 'function OnboardingScreen({onEnterDemo,onCreateMine,onJoinMine}){\n'
NEW_SIG = 'function OnboardingScreen({onEnterDemo,onCreateMine,onJoinMine,onSignIn}){\n'
apply(OLD_SIG, NEW_SIG, "OnboardingScreen accepts onSignIn prop")

# 3. Replace the "Try Demo →" button with a richer block that also has Sign in
# Find the Try Demo button
OLD_TRYDEMO = (
    '      <button onClick={onEnterDemo} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 20px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:15,cursor:"pointer",width:"100%"}}>\n'
    '        Try Demo →\n'
    '      </button>\n'
)
NEW_TRYDEMO = (
    '      <button onClick={onEnterDemo} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 20px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:15,cursor:"pointer",width:"100%"}}>\n'
    '        Try Demo →\n'
    '      </button>\n'
    '      <div style={{textAlign:"center",marginTop:18,fontSize:13,color:C.muted}}>\n'
    '        Already have an account? <span onClick={onSignIn} style={{color:C.accent,fontFamily:F,fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>Sign in</span>\n'
    '      </div>\n'
)
apply(OLD_TRYDEMO, NEW_TRYDEMO, "Add 'Sign in' link under Try Demo button")

# 4. Make Login's onBack go back to onboarding (was already there, just wire it)
# The Login component already accepts onBack. The call site needs to pass it.
OLD_LOGIN_CALL = (
    '{flow==="login"&&<div style={{flex:1,overflowY:"auto"}}><Login onLogin={handleLogin} mine={activeMine}/></div>}'
)
NEW_LOGIN_CALL = (
    '{flow==="login"&&<div style={{flex:1,overflowY:"auto"}}><Login onLogin={handleLogin} mine={activeMine} onBack={()=>setFlow("onboarding")}/></div>}'
)
apply(OLD_LOGIN_CALL, NEW_LOGIN_CALL, "Wire Login onBack → onboarding")

# Save
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits:
    print(f"✓ {e}")
print("\nNext: npm run build")
