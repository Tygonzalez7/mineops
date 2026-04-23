#!/usr/bin/env python3
"""
MineOps Step A hotfix: force sign-in after sign-up.

Problem:
  supabase.auth.signUp() returns a user but doesn't always set the
  session on the client immediately (especially with anti-abuse checks,
  network jitter, or legacy project configs). Without a session,
  auth.uid() is NULL inside Postgres, so the RLS policy
  `with check (owner_id = auth.uid())` fails on the mines insert.

Fix:
  Immediately after signUp, call signInWithPassword with the same creds.
  Then proceed with the inserts.
"""
import pathlib
import shutil
import sys
import time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
if not APP.exists():
    sys.exit(f"ERROR: {APP} not found")

src = APP.read_text()

OLD = (
    '      try {\n'
    '        const { data: auth, error: authErr } = await supabase.auth.signUp({\n'
    '          email, password: pass,\n'
    '          options: { data: { name: adminName } },\n'
    '        });\n'
    '        if (authErr) throw authErr;\n'
    '        if (!auth?.user) throw new Error("Sign-up returned no user");\n'
)

NEW = (
    '      try {\n'
    '        const { data: auth, error: authErr } = await supabase.auth.signUp({\n'
    '          email, password: pass,\n'
    '          options: { data: { name: adminName } },\n'
    '        });\n'
    '        if (authErr) throw authErr;\n'
    '        if (!auth?.user) throw new Error("Sign-up returned no user");\n'
    '        // Force a session so auth.uid() is set for the inserts below\n'
    '        const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: pass });\n'
    '        if (siErr) throw siErr;\n'
)

if OLD not in src:
    sys.exit("ERROR: could not find the signUp try block to patch")

src = src.replace(OLD, NEW, 1)
print("✓ Inserted signInWithPassword after signUp")

backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
print(f"✓ Wrote {APP}")
print("\nNext: npm run build")
