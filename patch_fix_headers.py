#!/usr/bin/env python3
import pathlib, shutil, sys, time
APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
src = APP.read_text()
edits = []

# 1. Restore addMachine in old conditional
old1 = 'flow==="app"||flow==="vehicleCheck"||flow==="photoManager"||flow==="settings"'
new1 = 'flow==="app"||flow==="vehicleCheck"||flow==="addMachine"||flow==="photoManager"||flow==="settings"'
if old1 in src:
    src = src.replace(old1, new1, 1)
    edits.append("Restored addMachine in old header conditional")
else:
    sys.exit("ERROR: could not find old conditional to restore")

# 2. Extend the new persistent header's exclude list
old2 = '{user&&!["onboarding","createMine","joinMine","subscription","vlSetup","login"].includes(flow)&&'
new2 = '{user&&!["onboarding","createMine","joinMine","subscription","vlSetup","login","app","vehicleCheck","addMachine","photoManager","settings"].includes(flow)&&'
if old2 in src:
    src = src.replace(old2, new2, 1)
    edits.append("Excluded flows with their own header from persistent header")
else:
    sys.exit("ERROR: could not find persistent header conditional")

backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits: print(f"✓ {e}")
