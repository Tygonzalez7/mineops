#!/usr/bin/env python3
"""
MineOps pre-shift inspections: Supabase persistence + history view.

Edits:
 1. App state: add activeShiftId. After truck question, insert a shifts row
    (auto-detect day/night from current time) and store its id.
 2. ChecksHub onComplete callback: persist to prestart_logs.
 3. Add PreshiftHistoryScreen component: lists prior inspections per mine.
 4. Add a new flow "inspHistory" in the app.
 5. MenuOverlay: add "Inspection History" menu item.
 6. Sign-out clears activeShiftId.
"""
import pathlib, shutil, sys, time, re

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

# ── 1. Add activeShiftId state + ensureShift helper ──────────────────────────
OLD_STATE = '  const [customMachines,setCustomMachines]=useState([])\n'
NEW_STATE = (
    '  const [customMachines,setCustomMachines]=useState([])\n'
    '  const [activeShiftId,setActiveShiftId]=useState(null)\n'
)
apply(OLD_STATE, NEW_STATE, "Added activeShiftId state")

# Add ensureShift function inside App component
OLD_HANDLETRUCK = '  const handleTruck=drove=>{if(drove)setFlow("truckCheck");else setFlow(lv===1?"machines":"app")}\n'
NEW_HANDLETRUCK = (
    '  const ensureShift=async(truckDriven)=>{\n'
    '    if(!user?.id||!activeMine?.id||activeShiftId)return activeShiftId;\n'
    '    const hr=new Date().getHours();\n'
    '    const shiftType=(hr>=6&&hr<18)?"day":"night";\n'
    '    try{\n'
    '      const {data,error}=await supabase.from("shifts").insert({\n'
    '        operator_id:user.id,mine_id:activeMine.id,\n'
    '        shift_start:new Date().toISOString(),status:"active",\n'
    '        truck_driven:!!truckDriven,shift_type:shiftType,\n'
    '      }).select().single();\n'
    '      if(error)throw error;\n'
    '      setActiveShiftId(data.id);\n'
    '      return data.id;\n'
    '    }catch(e){console.error("ensureShift failed:",e);return null;}\n'
    '  }\n'
    '  const handleTruck=async drove=>{await ensureShift(drove);if(drove)setFlow("truckCheck");else setFlow(lv===1?"machines":"app")}\n'
)
apply(OLD_HANDLETRUCK, NEW_HANDLETRUCK, "Added ensureShift + wired into handleTruck")

# ── 2. Sign-out clears activeShiftId ──────────────────────────────────────────
OLD_SIGNOUT = 'setRemoteMachines(null);setRemoteOperators(null);setFlow("onboarding")'
NEW_SIGNOUT = 'setRemoteMachines(null);setRemoteOperators(null);setActiveShiftId(null);setFlow("onboarding")'
apply(OLD_SIGNOUT, NEW_SIGNOUT, "Sign-out clears activeShiftId")

# ── 3. Add PreshiftHistoryScreen component right before `function Login` ─────
HIST_COMPONENT = '''
function PreshiftHistoryScreen({mineId,onBack}){
  const[logs,setLogs]=useState(null);
  const[err,setErr]=useState("");
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const {data,error}=await supabase
          .from("prestart_logs")
          .select("id,machine_id,operator_id,checks_passed,signed_off_at,fuel_level,operators(name),shifts(shift_type,shift_start)")
          .eq("mine_id",mineId)
          .order("signed_off_at",{ascending:false})
          .limit(200);
        if(error)throw error;
        if(!cancelled)setLogs(data||[]);
      }catch(e){console.error("history load:",e);if(!cancelled)setErr(e.message||"Load failed");}
    })();
    return()=>{cancelled=true;};
  },[mineId]);
  // Group by date
  const grouped={};
  (logs||[]).forEach(l=>{
    const d=l.signed_off_at?new Date(l.signed_off_at).toLocaleDateString():"Unknown";
    if(!grouped[d])grouped[d]=[];
    grouped[d].push(l);
  });
  return <div style={{padding:"0 0 30px"}}>
    <PageHdr title="Inspection History" sub="Pre-shift logs · last 200" back onBack={onBack}/>
    <div style={{padding:"4px 16px"}}>
      {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:C.danger}}>{err}</div>}
      {logs===null&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:13}}>Loading…</div>}
      {logs!==null&&logs.length===0&&<div style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:44,marginBottom:10,opacity:.6}}>📋</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text,marginBottom:4}}>No inspections yet</div>
        <div style={{fontSize:12,color:C.muted}}>Completed pre-shifts will appear here</div>
      </div>}
      {Object.keys(grouped).map(d=><div key={d} style={{marginBottom:16}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>{d}</div>
        {grouped[d].map(l=>{
          const passed=Object.values(l.checks_passed||{}).filter(Boolean).length;
          const total=Object.keys(l.checks_passed||{}).length;
          const ok=passed===total&&total>0;
          const t=l.signed_off_at?new Date(l.signed_off_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
          return <div key={l.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.text}}>{l.machine_id}</div>
              <div style={{fontSize:10,fontFamily:F,fontWeight:700,color:ok?C.success:C.amber,background:ok?`${C.success}15`:`${C.amber}15`,border:`1px solid ${ok?C.success:C.amber}44`,borderRadius:6,padding:"2px 7px"}}>{passed}/{total||"?"} {ok?"✓":"!"}</div>
            </div>
            <div style={{fontSize:11,color:C.muted}}>{l.operators?.name||"—"} · {l.shifts?.shift_type||"—"} shift · {t}</div>
          </div>;
        })}
      </div>)}
    </div>
  </div>;
}

'''

# Insert just before `function Login(`
login_idx = src.find("function Login(")
if login_idx == -1: sys.exit("ERROR: couldn't find function Login to anchor history component")
src = src[:login_idx] + HIST_COMPONENT + src[login_idx:]
edits.append("Added PreshiftHistoryScreen component")

# ── 4. Wire flow === "inspHistory" into render list ──────────────────────────
OLD_PHOTOMGR = '    if(flow==="photoManager")return <PhotoManagerScreen/>\n'
NEW_PHOTOMGR = (
    '    if(flow==="photoManager")return <PhotoManagerScreen/>\n'
    '    if(flow==="inspHistory")return <PreshiftHistoryScreen mineId={activeMine?.id} onBack={()=>setFlow("app")}/>\n'
)
apply(OLD_PHOTOMGR, NEW_PHOTOMGR, "Added inspHistory route in screen()")

# Also add inspHistory to the old header conditional so the screen renders
OLD_HDR_COND = 'flow==="app"||flow==="vehicleCheck"||flow==="addMachine"||flow==="photoManager"||flow==="settings"'
NEW_HDR_COND = 'flow==="app"||flow==="vehicleCheck"||flow==="addMachine"||flow==="photoManager"||flow==="settings"||flow==="inspHistory"'
apply(OLD_HDR_COND, NEW_HDR_COND, "Added inspHistory to header conditional")

# And exclude inspHistory from persistent header
OLD_EXCLUDE = '["onboarding","createMine","joinMine","subscription","vlSetup","login","app","vehicleCheck","addMachine","photoManager","settings"]'
NEW_EXCLUDE = '["onboarding","createMine","joinMine","subscription","vlSetup","login","app","vehicleCheck","addMachine","photoManager","settings","inspHistory"]'
apply(OLD_EXCLUDE, NEW_EXCLUDE, "Excluded inspHistory from persistent header")

# ── 5. Wire a navigation from the LiveBoard or MenuOverlay — add prop ────────
OLD_MENU_CALL = '{menuOpen&&<MenuOverlay user={user} allMachines={allMachines} onNav={t=>{setTab(t);setFlow("app")}} onAddMachine={()=>setFlow("addMachine")} onVehicleCheck={()=>setFlow("vehicleCheck")} onClose={()=>setMenuOpen(false)}/>}'
NEW_MENU_CALL = '{menuOpen&&<MenuOverlay user={user} allMachines={allMachines} onNav={t=>{setTab(t);setFlow("app")}} onAddMachine={()=>setFlow("addMachine")} onVehicleCheck={()=>setFlow("vehicleCheck")} onInspHistory={()=>{setFlow("inspHistory");setMenuOpen(false)}} onClose={()=>setMenuOpen(false)}/>}'
apply(OLD_MENU_CALL, NEW_MENU_CALL, "Pass onInspHistory to MenuOverlay")

# Save
backup = APP.with_suffix(f".jsx.bak.{int(time.time())}")
shutil.copy(APP, backup)
print(f"✓ Backup: {backup.name}")
APP.write_text(src)
for e in edits: print(f"✓ {e}")
print("\nNext: npm run build\n\nNote: pre-shift INSERT to prestart_logs happens in ChecksHub — we'll wire that after this builds clean.")
