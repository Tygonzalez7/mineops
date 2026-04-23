#!/usr/bin/env python3
"""
MineOps: Auto-approve mine joiners.

Change:
  - JoinMineFlow: insert operators with status='active' (was 'pending')
  - Welcome screen: replace "Awaiting admin approval" block with "You're in"
    and change "Enter Demo Mode →" to "Enter MineOps →"
"""
import pathlib, shutil, sys, time

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

# 1. operators insert: pending -> active
apply(
    'machine_id:role==="operator"?machine:null,status:"pending",',
    'machine_id:role==="operator"?machine:null,status:"active",',
    "JoinMineFlow inserts operators as 'active' (auto-approve)"
)

# 2. Replace "Awaiting admin approval" card with a simple "You're in" card
OLD_PENDING = (
    '    <div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:12,padding:"12px 14px",marginBottom:20}}>\n'
    '      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.amber,marginBottom:4}}>⏳ Awaiting admin approval</div>\n'
    '      <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Your Mine Admin will receive a notification and approve your access. You\'ll get an email when you\'re in. Usually happens within 24 hours.</div>\n'
    '    </div>\n'
)
NEW_PENDING = (
    '    <div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:12,padding:"12px 14px",marginBottom:20}}>\n'
    '      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:4}}>✓ You\'re in</div>\n'
    '      <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>You now have access to {foundMine?.name}. Tap below to get started.</div>\n'
    '    </div>\n'
)
apply(OLD_PENDING, NEW_PENDING, "Welcome screen: 'You're in' instead of approval pending")

# 3. Button label
apply(
    '      Enter Demo Mode →\n',
    '      Enter MineOps →\n',
    "Welcome button label"
)

# Save
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits:
    print(f"✓ {e}")
print("\nNext: npm run build")
