#!/usr/bin/env python3
"""
MineOps hotfix: split loadProfile into two queries.

Problem:
  loadProfile's single query uses an embedded `mines(...)` relation.
  Supabase returns 500 because the FK relationship isn't being
  auto-resolved the way we expected.

Fix:
  Do two sequential queries — first fetch the operator row by auth_id,
  then fetch the mine by mine_id.
"""
import pathlib, shutil, sys, time

APP = pathlib.Path.home() / "Downloads" / "mineops-app" / "src" / "App.jsx"
if not APP.exists(): sys.exit(f"ERROR: {APP} not found")

src = APP.read_text()

OLD = (
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
)

NEW = (
    '        // Two separate queries — avoids the embedded join 500 error\n'
    '        const {data:op,error:opErr}=await supabase\n'
    '          .from("operators")\n'
    '          .select("id,name,role,status,machine_id,crusher_assigned,employee_id,auth_id,mine_id")\n'
    '          .eq("auth_id",session.user.id)\n'
    '          .maybeSingle();\n'
    '        if(opErr)throw opErr;\n'
    '        if(cancelled)return;\n'
    '        if(!op){\n'
    '          // Signed in but no operator row yet — stay on onboarding so they can create/join a mine\n'
    '          return;\n'
    '        }\n'
    '        let mineRow=null;\n'
    '        if(op.mine_id){\n'
    '          const {data:m,error:mErr}=await supabase\n'
    '            .from("mines")\n'
    '            .select("id,name,code,location,plan")\n'
    '            .eq("id",op.mine_id)\n'
    '            .maybeSingle();\n'
    '          if(!mErr)mineRow=m;\n'
    '        }\n'
    '        // Shape the user to mimic the BASE_USERS format the rest of the app expects\n'
    '        const u={\n'
    '          id:op.id,\n'
    '          name:op.name,\n'
    '          role:op.role,\n'
    '          machine:op.machine_id||undefined,\n'
    '          crusherAssigned:op.crusher_assigned||undefined,\n'
    '          employeeId:op.employee_id||op.id.slice(0,8).toUpperCase(),\n'
    '          avatar:(op.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase(),\n'
    '          status:op.status,\n'
    '        };\n'
    '        setUser(u);\n'
    '        if(mineRow){setActiveMine(mineRow);}\n'
)

if OLD not in src:
    sys.exit("ERROR: could not find loadProfile join query")
src = src.replace(OLD, NEW, 1)

backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
print("✓ Split loadProfile into two queries")
print("\nNext: npm run build")
