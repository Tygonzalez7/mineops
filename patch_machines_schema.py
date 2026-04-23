#!/usr/bin/env python3
"""
Fix the machines insert payload: map camelCase React fields to snake_case DB columns.
React has: id, model, type, bucket, crusherAssigned, custom
DB wants:   id, model, type, bucket_size, crusher_assigned, (no custom col)
"""
import pathlib, shutil, sys, time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
src = APP.read_text()

OLD = 'await supabase.from("machines").insert({mine_id:activeMine.id,...machine,...(catData?{telematics:catData}:{})});'
NEW = (
    'await supabase.from("machines").insert({\n'
    '          id:machine.id,\n'
    '          mine_id:activeMine.id,\n'
    '          model:machine.model,\n'
    '          type:machine.type,\n'
    '          bucket_size:machine.bucket||null,\n'
    '          crusher_assigned:machine.crusherAssigned||null,\n'
    '          serial_number:catData?.sn||null,\n'
    '          status:catData?.status||"standby",\n'
    '        });'
)

if OLD not in src:
    sys.exit("ERROR: couldn't find the old insert call — maybe already patched")

src = src.replace(OLD, NEW, 1)

backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
print("✓ Rewrote machines insert payload to match DB schema")
print("\nNext: npm run build")
