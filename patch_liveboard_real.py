#!/usr/bin/env python3
"""
LiveBoard refactor:
 - Remove crusher cards entirely
 - Accept remoteOperators, remoteMachines, activeMine as props
 - Group operators by machine (type + model + bucket_size)
 - Fall back to hardcoded USERS only when activeMine is null (demo mode)
 - Graceful empty states when no shift data
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

# 1. Find current LiveBoard function and replace entirely
start = src.find("function LiveBoard(){")
if start == -1: sys.exit("ERROR: LiveBoard not found")
# Find the closing brace. LiveBoard goes until next `function ` at same indentation
end_marker = "\n// ── "  # LiveBoard is followed by a comment divider
end = src.find(end_marker, start)
if end == -1:
    # fallback: look for next `function ` at column 0
    import re
    m = re.search(r'\n(function [A-Z])', src[start+10:])
    if not m: sys.exit("ERROR: couldn't find end of LiveBoard")
    end = start + 10 + m.start() + 1

NEW_LIVEBOARD = '''function LiveBoard({remoteOperators,remoteMachines,activeMine}){
  // Real mine: use Supabase operators/machines. Demo: use hardcoded USERS/BASE_MACHINES.
  const isReal = !!activeMine?.id;
  const rawOps = isReal ? (remoteOperators||[]) : USERS.filter(u=>u.role==="operator");
  const rawMachines = isReal ? (remoteMachines||[]) : BASE_MACHINES;
  // Only show operators on production-affecting machines
  const PROD_TYPES = new Set(["Wheel Loader","Excavator","Haul Truck","Dozer","Drill","Grader","Loader"]);
  const getMachineFor = op => rawMachines.find(m=>m.id===(op.machine_id||op.machine));
  const productionOps = rawOps.filter(op => {
    const m = getMachineFor(op);
    return m && PROD_TYPES.has(m.type);
  });
  // Group by machine signature: type + model + bucket (rounded)
  const groups = {};
  productionOps.forEach(op => {
    const m = getMachineFor(op);
    if(!m) return;
    const bucket = m.bucket_size ?? m.bucket ?? null;
    const key = `${m.type}|${m.model}|${bucket||"—"}`;
    if(!groups[key]) groups[key] = {type:m.type, model:m.model, bucket, ops:[]};
    groups[key].ops.push({op, machine:m});
  });
  const groupKeys = Object.keys(groups).sort();
  return <div style={{paddingBottom:80}} className="up">
    <div style={{background:`linear-gradient(160deg,#0d1a08,${C.bg} 70%)`,borderBottom:`1px solid ${C.border}`,padding:"14px 15px 12px"}}>
      <div style={{fontSize:9,color:C.muted,letterSpacing:".14em",textTransform:"uppercase"}}>LIVE OPERATIONS BOARD</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.text,marginTop:1,marginBottom:4}}>Shift Performance</div>
      <div style={{fontSize:11,color:C.muted}}>{activeMine?.name || "Demo mode"} · {productionOps.length} production operator{productionOps.length!==1?"s":""}</div>
    </div>
    <div style={{padding:"14px 15px"}}>
      {groupKeys.length===0 && <div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{fontSize:52,marginBottom:10,opacity:.5}}>👷</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:19,color:C.text,marginBottom:6}}>No production operators yet</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>
          {isReal ? "Operators assigned to loaders, excavators, haul trucks or dozers will appear here." : "Sign in to a real mine to see your operators."}
        </div>
      </div>}
      {groupKeys.map(k => {
        const g = groups[k];
        return <div key={k} style={{marginBottom:18}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8,padding:"0 2px"}}>
            <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.text}}>{g.model}</div>
            <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>
              {g.type}{g.bucket?` · ${g.bucket} yd³`:""}
            </div>
            <div style={{marginLeft:"auto",fontSize:10,color:C.muted}}>{g.ops.length} op{g.ops.length!==1?"s":""}</div>
          </div>
          {g.ops.map(({op,machine})=>{
            const avatar = op.avatar || (op.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase();
            const status = op.status || "active";
            const pillColor = status==="active"?C.success:status==="pending"?C.amber:C.muted;
            return <div key={op.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 13px",marginBottom:6,display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`${pillColor}22`,border:`1.5px solid ${pillColor}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:12,color:pillColor,flexShrink:0}}>{avatar}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:14,color:C.text}}>{op.name}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:1}}>{machine.model}{machine.serial_number?` · SN ${machine.serial_number.slice(-4)}`:""}</div>
              </div>
              <Pill label={status.toUpperCase()} color={pillColor}/>
            </div>;
          })}
        </div>;
      })}
    </div>
  </div>;
}

'''

src = src[:start] + NEW_LIVEBOARD + src[end:]
edits.append("Rewrote LiveBoard with real-data grouping")

# 2. Pass props to LiveBoard in App.screen()
apply(
    'return <LiveBoard/>',
    'return <LiveBoard remoteOperators={remoteOperators} remoteMachines={remoteMachines} activeMine={activeMine}/>',
    "Pass remoteOperators/machines/activeMine to LiveBoard"
)

# Save
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits: print(f"✓ {e}")
print("\nNext: npm run build")
