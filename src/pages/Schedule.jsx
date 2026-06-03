// Shift scheduling module.
//
// Single-file feature: templates, schedule builder, my-schedule, marketplace,
// trade inbox, plus constraint-solver helpers. Imported from App.jsx via
// thin flow/tab wrappers — keeps App.jsx from ballooning further.
//
// Conventions: design tokens (C, F) and ROLES re-declared locally so the
// module is self-contained. supabase + useToast are passed in as props from
// App.jsx so we share the active auth session.

import {useEffect, useMemo, useState} from "react"

// ── Design tokens ─────────────────────────────────────────────────────────
const C={bg:"#07090d",surface:"#0d1118",card:"#121820",border:"#1c2738",
  accent:"#f5a623",success:"#3ecf8e",danger:"#e05252",amber:"#e0a847",
  info:"#4fa3e0",purple:"#a78bfa",muted:"#6b7a99",text:"#e8ecf3",textSub:"#b0b8cc"}
const F="'Barlow Condensed','Oswald',sans-serif"

export const ROLE_OPTIONS=[
  {id:"operator",    label:"Operator",     color:"#4fa3e0",icon:"👷"},
  {id:"supervisor",  label:"Supervisor",   color:"#f5a623",icon:"🔶"},
  {id:"minemanager", label:"Mine Manager", color:"#a78bfa",icon:"⛏"},
  {id:"maintenance", label:"Maintenance",  color:"#3ecf8e",icon:"🔧"},
  {id:"admin",       label:"Admin",        color:"#e05252",icon:"⚙"},
]
const ROLE_META=Object.fromEntries(ROLE_OPTIONS.map(r=>[r.id,r]))

// ── Date / time helpers ───────────────────────────────────────────────────
export const isoDate=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x.toISOString().slice(0,10)}
export const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x}
export const dateRange=(start,n)=>Array.from({length:n},(_,i)=>isoDate(addDays(start,i)))
export const startOfWeek=d=>{const x=new Date(d);const dow=x.getDay();x.setDate(x.getDate()-dow);x.setHours(0,0,0,0);return x}
export const fmtTime=t=>{ // "06:00:00" → "6:00 AM"
  if(!t)return""
  const [h,m]=t.split(":").map(Number)
  const am=h<12;const h12=h%12||12
  return `${h12}:${String(m).padStart(2,"0")} ${am?"AM":"PM"}`
}
export const fmtDate=iso=>{ // "2026-06-15" → "Mon Jun 15"
  if(!iso)return""
  const d=new Date(iso+"T00:00:00")
  return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})
}
export const fmtDay=iso=>{const d=new Date(iso+"T00:00:00");return d.toLocaleDateString(undefined,{weekday:"short"})}
export const daysUntil=iso=>{const d=new Date(iso+"T00:00:00");const t=new Date();t.setHours(0,0,0,0);return Math.round((d-t)/86400000)}

// Compute end of a shift as an absolute Date given a slot date + template.
export function shiftEndDate(slotDate,template){
  const [sh,sm]=String(template.start_time).split(":").map(Number)
  const [eh,em]=String(template.end_time).split(":").map(Number)
  const start=new Date(slotDate+"T00:00:00");start.setHours(sh,sm,0,0)
  const end=new Date(start)
  end.setHours(eh,em,0,0)
  if(template.is_overnight||end<=start)end.setDate(end.getDate()+1)
  return {start,end}
}
export function shiftHours(template){
  const {start,end}=shiftEndDate("2024-01-01",template)
  return (end-start)/3600000
}
export function dayOrNight(template){
  const [sh]=String(template.start_time).split(":").map(Number)
  return (sh>=18||sh<5)?"night":"day"
}

// ── Constraint solver ─────────────────────────────────────────────────────
// Greedy: for each (date, slot) needing N operators, rank eligible
// operators by (a) day/night persistence, (b) rest hours, (c) fairness,
// (d) availability. Pick top N. Doesn't crash on impossible — flags it.
export function autoSchedule({slots,templates,operators,existingAssignments,preferences,minRestHours=10,fairnessWindowDays=28}){
  const tplById=Object.fromEntries(templates.map(t=>[t.id,t]))
  const prefByOp=Object.fromEntries((preferences||[]).map(p=>[p.operator_id,p]))
  // Mutable working set: copy + sort by date.
  const work=[...slots].sort((a,b)=>(a.date<b.date?-1:1))
  const assignments=[...(existingAssignments||[])]
  const conflicts=[]
  // Track per-operator: most recent shift end (Date), shift count in fairness window, day/night history.
  const state={}
  for(const op of operators)state[op.id]={lastEnd:null,count:0,recent:[]}
  for(const a of assignments){
    const tpl=tplById[(slots.find(s=>s.id===a.slot_id)||{}).template_id]
    if(!tpl)continue
    const sl=slots.find(s=>s.id===a.slot_id)
    if(!sl)continue
    const {end}=shiftEndDate(sl.date,tpl)
    const s=state[a.operator_id];if(!s)continue
    if(!s.lastEnd||end>s.lastEnd)s.lastEnd=end
    s.count++
    s.recent.push({date:sl.date,dn:dayOrNight(tpl)})
  }
  for(const slot of work){
    const tpl=tplById[slot.template_id];if(!tpl)continue
    const {start,end}=shiftEndDate(slot.date,tpl)
    const need=slot.required_count-assignments.filter(a=>a.slot_id===slot.id&&a.status!=="cancelled").length
    if(need<=0)continue
    const dn=dayOrNight(tpl)
    const eligible=operators
      .filter(op=>op.role===slot.role)
      .filter(op=>!assignments.some(a=>a.slot_id===slot.id&&a.operator_id===op.id&&a.status!=="cancelled"))
      .map(op=>{
        const pref=prefByOp[op.id]||{}
        const s=state[op.id]
        const unavailable=(pref.unavailable_dates||[]).includes(slot.date)
        const restHrs=s.lastEnd?(start-s.lastEnd)/3600000:Infinity
        const restOK=restHrs>=minRestHours
        // Persistence: how many of their last 7 days match this dn.
        const recent7=s.recent.filter(r=>r.date>=isoDate(addDays(new Date(slot.date),-7)))
        const persistMatch=recent7.filter(r=>r.dn===dn).length
        const persistMiss=recent7.filter(r=>r.dn!==dn).length
        const prefBonus=(dn==="day"&&pref.prefers_day)||(dn==="night"&&pref.prefers_night)?2:0
        // Score (higher = better): persistence + pref bonus − count (fairness) − miss penalty.
        const score=persistMatch*2+prefBonus-(s.count*0.5)-persistMiss*1.5
        return {op,unavailable,restOK,restHrs,score,dn}
      })
      .filter(e=>!e.unavailable&&e.restOK)
      .sort((a,b)=>b.score-a.score)
    const picks=eligible.slice(0,need)
    for(const p of picks){
      const a={
        id:`tmp-${slot.id}-${p.op.id}`,
        slot_id:slot.id,
        mine_id:slot.mine_id,
        operator_id:p.op.id,
        status:"assigned",
        day_or_night:p.dn,
        _proposed:true,
      }
      assignments.push(a)
      const s=state[p.op.id]
      s.lastEnd=end;s.count++;s.recent.push({date:slot.date,dn:p.dn})
    }
    if(picks.length<need){
      conflicts.push({slot_id:slot.id,date:slot.date,role:slot.role,missing:need-picks.length,template:tpl.name})
    }
  }
  return {assignments,conflicts}
}

// ── Shared UI primitives ──────────────────────────────────────────────────
function Hdr({title,sub,onBack}){return <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 15px",position:"sticky",top:0,zIndex:10}}>
  {onBack&&<button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 11px",color:C.muted,fontSize:11,marginBottom:9,fontFamily:F,fontWeight:700,cursor:"pointer"}}>← Back</button>}
  <div style={{fontFamily:F,fontWeight:900,fontSize:21,color:C.accent,letterSpacing:".04em"}}>{title}</div>
  {sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}
</div>}

function Btn({onClick,children,variant="primary",disabled,style={}}){
  const styles={
    primary:{background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none"},
    secondary:{background:C.surface,color:C.text,border:`1px solid ${C.border}`},
    danger:{background:"none",color:C.danger,border:`1px solid ${C.danger}66`},
    ghost:{background:"none",color:C.muted,border:`1px solid ${C.border}`},
  }
  return <button disabled={disabled} onClick={onClick} style={{padding:"10px 14px",borderRadius:9,fontFamily:F,fontWeight:700,fontSize:13,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,letterSpacing:".02em",...styles[variant],...style}}>{children}</button>
}

function Field({label,children}){return <label style={{display:"block",marginBottom:11}}>
  <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
  {children}
</label>}

const inputStyle={width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontFamily:F,fontSize:14,boxSizing:"border-box"}

function RolePill({role}){
  const r=ROLE_META[role]||{label:role,color:C.muted,icon:"·"}
  return <span style={{background:`${r.color}22`,color:r.color,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>{r.icon} {r.label}</span>
}

function EmptyState({icon,title,sub}){return <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
  <div style={{fontSize:38,marginBottom:10}}>{icon}</div>
  <div style={{fontFamily:F,fontWeight:700,fontSize:15,color:C.textSub,marginBottom:6}}>{title}</div>
  {sub&&<div style={{fontSize:12,lineHeight:1.55,maxWidth:280,margin:"0 auto"}}>{sub}</div>}
</div>}

// ── Templates screen (admin / manager / supervisor) ───────────────────────
export function SchedTemplatesScreen({supabase,toast,activeMine,user,onBack}){
  const mineId=activeMine?.id
  const canEdit=["admin","minemanager","supervisor"].includes(user?.role)
  const [tpls,setTpls]=useState([])
  const [config,setConfig]=useState({min_rest_hours:10,rotation_period_days:14,fairness_window_days:28})
  const [loading,setLoading]=useState(true)
  const [editing,setEditing]=useState(null) // template object or {} for new
  const [showConfig,setShowConfig]=useState(false)

  const load=async()=>{
    if(!mineId){setLoading(false);return}
    setLoading(true)
    const [tRes,cRes]=await Promise.all([
      supabase.from("shift_templates").select("*").eq("mine_id",mineId).order("role").order("start_time"),
      supabase.from("shift_schedule_config").select("*").eq("mine_id",mineId).maybeSingle(),
    ])
    if(tRes.error)toast?.error?.(tRes.error)
    else setTpls(tRes.data||[])
    if(cRes.data)setConfig(cRes.data)
    setLoading(false)
  }
  useEffect(()=>{load()},[mineId])

  const saveTemplate=async(t)=>{
    if(!mineId)return
    const isOvernight=(()=>{
      const [sh]=String(t.start_time).split(":").map(Number)
      const [eh]=String(t.end_time).split(":").map(Number)
      return eh<sh
    })()
    const row={
      mine_id:mineId, name:t.name.trim(), role:t.role,
      start_time:t.start_time, end_time:t.end_time,
      is_overnight:isOvernight, color:t.color||null, is_active:true,
    }
    let res
    if(t.id)res=await supabase.from("shift_templates").update(row).eq("id",t.id)
    else    res=await supabase.from("shift_templates").insert(row)
    if(res.error)return toast?.error?.(res.error)
    toast?.success?.(t.id?"Template updated":"Template added")
    setEditing(null);load()
  }
  const archiveTemplate=async(id)=>{
    const r=await supabase.from("shift_templates").update({is_active:false}).eq("id",id)
    if(r.error)return toast?.error?.(r.error)
    toast?.success?.("Template archived");load()
  }
  const saveConfig=async()=>{
    const row={...config,mine_id:mineId,updated_at:new Date().toISOString()}
    const {error}=await supabase.from("shift_schedule_config").upsert(row,{onConflict:"mine_id"})
    if(error)return toast?.error?.(error)
    toast?.success?.("Schedule rules saved")
    setShowConfig(false)
  }

  const grouped=useMemo(()=>{
    const g={}
    for(const t of tpls){
      if(!t.is_active)continue
      g[t.role]=g[t.role]||[]
      g[t.role].push(t)
    }
    return g
  },[tpls])

  return<div style={{paddingBottom:80}}>
    <Hdr title="Shift Templates" sub={`${activeMine?.name||"demo"} · ${tpls.filter(t=>t.is_active).length} active`} onBack={onBack}/>
    <div style={{padding:"14px 15px"}}>
      <button onClick={()=>setShowConfig(true)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",marginBottom:14,cursor:"pointer",display:"flex",alignItems:"center",gap:11,textAlign:"left"}}>
        <span style={{fontSize:20}}>⚙</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.text}}>Schedule rules</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Min rest {config.min_rest_hours}h · Rotation {config.rotation_period_days}d · Fairness {config.fairness_window_days}d</div>
        </div>
        <span style={{color:C.muted,fontSize:14}}>›</span>
      </button>
      {canEdit&&<Btn onClick={()=>setEditing({name:"",role:"operator",start_time:"06:00",end_time:"18:00",color:C.info})} style={{width:"100%",marginBottom:14}}>+ Add shift template</Btn>}
      {loading?<EmptyState icon="⏳" title="Loading…"/>:tpls.filter(t=>t.is_active).length===0?<EmptyState icon="📅" title="No templates yet" sub="Add Day, Night, and Maintenance shifts so the schedule builder has shapes to work with."/>:
        ROLE_OPTIONS.filter(r=>grouped[r.id]).map(role=>(<div key={role.id} style={{marginBottom:18}}>
          <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",padding:"4px 4px 8px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12}}>{role.icon}</span> {role.label}</div>
          {grouped[role.id].map(t=>{const hrs=shiftHours(t).toFixed(1);return<div key={t.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:5,alignSelf:"stretch",borderRadius:3,background:t.color||C.accent}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:14,color:C.text,marginBottom:3}}>{t.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{fmtTime(t.start_time)} – {fmtTime(t.end_time)} · {hrs}h {t.is_overnight?"· overnight":""}</div>
            </div>
            {canEdit&&<>
              <button onClick={()=>setEditing(t)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Edit</button>
              <button onClick={()=>{if(confirm(`Archive "${t.name}"?`))archiveTemplate(t.id)}} style={{background:"none",border:"none",color:C.danger,fontSize:16,cursor:"pointer",padding:"4px 6px"}}>×</button>
            </>}
          </div>})}
        </div>))}
    </div>
    {editing&&<TemplateEditor template={editing} onSave={saveTemplate} onCancel={()=>setEditing(null)}/>}
    {showConfig&&<ConfigEditor config={config} setConfig={setConfig} onSave={saveConfig} onCancel={()=>setShowConfig(false)}/>}
  </div>
}

function TemplateEditor({template,onSave,onCancel}){
  const [t,setT]=useState(template)
  const valid=t.name?.trim()&&t.role&&t.start_time&&t.end_time
  return <Modal onClose={onCancel} title={t.id?"Edit template":"New template"}>
    <Field label="Name"><input value={t.name||""} onChange={e=>setT({...t,name:e.target.value})} placeholder="Day shift" style={inputStyle}/></Field>
    <Field label="Role">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{ROLE_OPTIONS.map(r=><button key={r.id} onClick={()=>setT({...t,role:r.id})} style={{background:t.role===r.id?`${r.color}22`:C.surface,border:`2px solid ${t.role===r.id?r.color:C.border}`,borderRadius:8,padding:"9px 7px",color:t.role===r.id?r.color:C.muted,fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>{r.icon} {r.label}</button>)}</div>
    </Field>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      <Field label="Start"><input type="time" value={t.start_time||""} onChange={e=>setT({...t,start_time:e.target.value})} style={inputStyle}/></Field>
      <Field label="End"><input type="time" value={t.end_time||""} onChange={e=>setT({...t,end_time:e.target.value})} style={inputStyle}/></Field>
    </div>
    <Field label="Colour">
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[C.info,C.accent,C.purple,C.success,C.danger,C.amber].map(c=><button key={c} onClick={()=>setT({...t,color:c})} style={{width:34,height:34,borderRadius:8,background:c,border:t.color===c?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer"}}/>)}</div>
    </Field>
    <div style={{display:"flex",gap:8,marginTop:14}}>
      <Btn variant="ghost" onClick={onCancel} style={{flex:1}}>Cancel</Btn>
      <Btn disabled={!valid} onClick={()=>onSave(t)} style={{flex:2}}>{t.id?"Save":"Add template"}</Btn>
    </div>
  </Modal>
}

function ConfigEditor({config,setConfig,onSave,onCancel}){
  return <Modal onClose={onCancel} title="Schedule rules">
    <Field label="Minimum rest between shifts (hours)"><input type="number" min="0" max="48" value={config.min_rest_hours} onChange={e=>setConfig({...config,min_rest_hours:+e.target.value||0})} style={inputStyle}/></Field>
    <Field label="Rotation period (days)"><input type="number" min="1" max="60" value={config.rotation_period_days} onChange={e=>setConfig({...config,rotation_period_days:+e.target.value||1})} style={inputStyle}/></Field>
    <Field label="Fairness window (days)"><input type="number" min="7" max="90" value={config.fairness_window_days} onChange={e=>setConfig({...config,fairness_window_days:+e.target.value||7})} style={inputStyle}/></Field>
    <div style={{fontSize:11,color:C.muted,lineHeight:1.55,padding:"4px 0 14px"}}>Auto-scheduler ranks operators by day/night persistence in this rotation, then by fewest shifts in the fairness window.</div>
    <div style={{display:"flex",gap:8}}>
      <Btn variant="ghost" onClick={onCancel} style={{flex:1}}>Cancel</Btn>
      <Btn onClick={onSave} style={{flex:2}}>Save rules</Btn>
    </div>
  </Modal>
}

function Modal({title,onClose,children}){return <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000a",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
  <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"16px 16px 0 0",border:`1px solid ${C.border}`,borderBottom:"none",padding:"18px 18px 24px",width:"100%",maxWidth:420,maxHeight:"85vh",overflowY:"auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.accent,letterSpacing:".03em"}}>{title}</div>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
    </div>
    {children}
  </div>
</div>}

// ── Stubs for next commits ────────────────────────────────────────────────
// Filled in commits 3-6: SchedBuilderScreen, MyScheduleScreen,
// MarketplaceScreen, TradeInboxScreen.

export function SchedBuilderScreen({onBack}){return <div><Hdr title="Schedule Builder" sub="Coming next" onBack={onBack}/><EmptyState icon="🛠" title="Schedule Builder" sub="Calendar + auto-schedule lands in the next commit."/></div>}
export function MyScheduleScreen(){return <EmptyState icon="📅" title="My Schedule" sub="Operator week view lands in commit 4."/>}
export function MarketplaceScreen(){return <EmptyState icon="🛒" title="Marketplace" sub="Open trade requests land in commit 5."/>}
export function TradeInboxScreen(){return <EmptyState icon="📨" title="Trade Inbox" sub="Direct trade requests land in commit 6."/>}

// Hub combining the operator views for a single Schedule tab.
export function ScheduleTabHub({supabase,toast,activeMine,user}){
  const [sub,setSub]=useState("mine")
  const tabs=[
    {id:"mine",label:"Mine",icon:"📅"},
    {id:"market",label:"Marketplace",icon:"🛒"},
    {id:"inbox",label:"Inbox",icon:"📨"},
  ]
  return<div style={{paddingBottom:80}}>
    <Hdr title="Schedule" sub={activeMine?.name||"Your shifts"}/>
    <div style={{display:"flex",gap:6,padding:"10px 12px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:62,background:C.bg,zIndex:5}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setSub(t.id)} style={{flex:1,padding:"8px 0",background:sub===t.id?`${C.accent}18`:"none",border:`1px solid ${sub===t.id?C.accent:C.border}`,borderRadius:8,color:sub===t.id?C.accent:C.muted,fontFamily:F,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:".04em"}}>{t.icon} {t.label}</button>)}
    </div>
    {sub==="mine"&&<MyScheduleScreen supabase={supabase} toast={toast} activeMine={activeMine} user={user}/>}
    {sub==="market"&&<MarketplaceScreen supabase={supabase} toast={toast} activeMine={activeMine} user={user}/>}
    {sub==="inbox"&&<TradeInboxScreen supabase={supabase} toast={toast} activeMine={activeMine} user={user}/>}
  </div>
}
