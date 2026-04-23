#!/usr/bin/env python3
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

OLD_DEMO = '        <div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:10,padding:"11px 14px",marginBottom:16}}>\n          <div style={{fontSize:11,color:C.accent,fontFamily:F,fontWeight:700,marginBottom:2}}>DEMO MODE</div>\n          <div style={{fontSize:12,color:C.muted}}>Machine is added to local fleet only. Data is not persisted between sessions.</div>\n        </div>\n\n'
apply(OLD_DEMO, "", "Removed DEMO MODE warning")

OLD_TYPE = '        <select value={type} onChange={e=>setType(e.target.value)} style={{...sel,marginBottom:14}}>\n          {MACHINE_TYPES.map(t=><option key={t}>{t}</option>)}\n        </select>'
NEW_TYPE = '        <select value={type} onChange={e=>setType(e.target.value)} style={{...sel,marginBottom:14}}>\n          {["Wheel Loader","Excavator","Haul Truck","Dozer","Drill","Grader","Roller","Crusher","Screen","Water Cart","Service Truck","Light Vehicle"].map(t=><option key={t}>{t}</option>)}\n        </select>'
apply(OLD_TYPE, NEW_TYPE, "Expanded machine type dropdown")

OLD_BS = '        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>\n          <div><label style={lbl}>Bucket / blade size (t)</label><input type="number" value={bucket} onChange={e=>setBucket(e.target.value)} placeholder="e.g. 8.5" style={inp}/></div>\n          <div><label style={lbl}>Status</label><select value={status} onChange={e=>setStatus(e.target.value)} style={sel}><option value="operating">Operating</option><option value="standby">Standby</option><option value="maintenance">Maintenance</option></select></div>\n        </div>\n'
NEW_BS = '        <label style={lbl}>Bucket / blade size (yd³)</label>\n        <input type="number" value={bucket} onChange={e=>setBucket(e.target.value)} placeholder="e.g. 8.5" style={{...inp,marginBottom:14}}/>\n'
apply(OLD_BS, NEW_BS, "Replaced bucket/status → bucket-only in yd³")

apply('status,faults:[],utilToday:0', 'status:"standby",faults:[],utilToday:0', "Hardcoded status in payload")
apply('  const[status,setStatus]=useState("standby");\n', "", "Removed status useState")

# Double header fix — try variants
variants = [
    ('flow==="app"||flow==="vehicleCheck"||flow==="addMachine"||flow==="photoManager"||flow==="settings"',
     'flow==="app"||flow==="vehicleCheck"||flow==="photoManager"||flow==="settings"'),
    ('||flow==="addMachine"', ''),
]
for old, new in variants:
    if old in src:
        src = src.replace(old, new, 1)
        edits.append("Removed addMachine from old header conditional")
        break
else:
    print("⚠ could not find old header conditional")

backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits: print(f"✓ {e}")
print("Next: npm run build")
