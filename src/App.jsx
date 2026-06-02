import { createClient } from '@supabase/supabase-js'
import {createContext, useContext, useEffect, useMemo, useState, useRef} from "react"
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
const AuthCtx = createContext(null)
function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [authEvent, setAuthEvent] = useState(null) // 'PASSWORD_RECOVERY' | 'SIGNED_IN' | ...
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setAuthEvent(event)
    })
    return () => subscription.unsubscribe()
  }, [])
  const clearAuthEvent = () => setAuthEvent(null)
  return <AuthCtx.Provider value={{ session, supabase, authEvent, clearAuthEvent }}>{children}</AuthCtx.Provider>
}
function useSupabase() { return useContext(AuthCtx) }



// ── Design tokens ─────────────────────────────────────────────────────────
const C={bg:"#07090d",surface:"#0d1118",card:"#121820",border:"#1c2738",
  accent:"#f5a623",success:"#3ecf8e",danger:"#e05252",amber:"#e0a847",
  info:"#4fa3e0",purple:"#a78bfa",muted:"#6b7a99",text:"#e8ecf3",textSub:"#b0b8cc"};
const F="'Barlow Condensed','Oswald',sans-serif";

// ── Static data ────────────────────────────────────────────────────────────
const BASE_MACHINES=[
  {id:"CAT988K",  model:"CAT 988K",   type:"Wheel Loader",bucket:6.7,  crusherAssigned:"C1"},
  {id:"CAT992K",  model:"CAT 992K",   type:"Wheel Loader",bucket:10.7, crusherAssigned:"C1"},
  {id:"CAT6060",  model:"CAT 6060",   type:"Excavator",   bucket:22.0, crusherAssigned:"C1"},
  {id:"CAT390F",  model:"CAT 390F",   type:"Excavator",   bucket:7.5,  crusherAssigned:"C2"},
  {id:"CAT745_1", model:"CAT 745 #1", type:"Haul Truck",  payload:45.4,crusherAssigned:"C1"},
  {id:"CAT745_2", model:"CAT 745 #2", type:"Haul Truck",  payload:45.4,crusherAssigned:"C1"},
  {id:"CATD11T",  model:"CAT D11T",   type:"Dozer",       bucket:null, crusherAssigned:null},
];
const isMachTruck=type=>type==="Haul Truck";
const USERS=[
  {id:"u1",name:"James Smith",  avatar:"JS",role:"operator",   machine:"CAT988K",  crusherAssigned:"C1",employeeId:"OP-001"},
  {id:"u2",name:"Bec Jones",    avatar:"BJ",role:"operator",   machine:"CAT992K",  crusherAssigned:"C1",employeeId:"OP-002"},
  {id:"u3",name:"Marcus Lee",   avatar:"ML",role:"operator",   machine:"CAT6060",  crusherAssigned:"C1",employeeId:"OP-003"},
  {id:"u4",name:"Pete Nguyen",  avatar:"PN",role:"operator",   machine:"CAT390F",  crusherAssigned:"C2",employeeId:"OP-004"},
  {id:"u7",name:"Tony Marsh",   avatar:"TM",role:"operator",   machine:"CAT745_1", crusherAssigned:"C1",employeeId:"OP-005"},
  {id:"u8",name:"Kim Barnes",   avatar:"KB",role:"operator",   machine:"CAT745_2", crusherAssigned:"C1",employeeId:"OP-006"},
  {id:"u5",name:"Sarah Tran",   avatar:"ST",role:"supervisor", machine:null,       crusherAssigned:null, employeeId:"SUP-001"},
  {id:"u6",name:"Craig O'Brien",avatar:"CO",role:"minemanager",machine:null,      crusherAssigned:null, employeeId:"MGR-001"},
];
const ROLES={
  operator:    {label:"Operator",    color:"#4fa3e0",icon:"👷",level:1},
  supervisor:  {label:"Supervisor",  color:"#f5a623",icon:"🔶",level:2},
  minemanager: {label:"Mine Manager",color:"#a78bfa",icon:"⛏", level:3},
};
const OP={revenuePerTonne:10,shiftHours:10,targetFillPct:95,idleAlertMins:45,
  crushers:[{id:"C1",name:"Crusher 1",capacityTph:320},{id:"C2",name:"Crusher 2",capacityTph:60}]};

// MQSHA minimum — do NOT add items not in the HSMP
const PRESTART=[
  {id:"oil",    label:"Engine oil level — OK"},
  {id:"coolant",label:"Coolant level — OK"},
  {id:"hyd",    label:"Hydraulic fluid level — OK"},
  {id:"fuel",   label:"Fuel level checked & recorded"},
  {id:"brakes", label:"Brakes operational"},
  {id:"tyres",  label:"Tyres / tracks — no visible damage"},
  {id:"lights", label:"Lights & signals operational"},
  {id:"horn",   label:"Horn & reverse alarm functional"},
  {id:"rops",   label:"Seatbelt & ROPS in good condition"},
  {id:"fire",   label:"Fire suppression system — OK"},
];
const STATUS_COL={operating:C.success,standby:C.amber,maintenance:C.danger};
const CAT_DEMO={
  CAT988K:{sn:"KAT00988K0001",smh:14832,fuel:68,engineTemp:88,status:"operating",  faults:[],utilToday:87},
  CAT992K:{sn:"KAT00992K0002",smh:9211, fuel:45,engineTemp:91,status:"operating",  faults:[{code:"E360",sev:"medium",desc:"Payload overload — check tyre pressure"}],utilToday:79},
  CAT6060: {sn:"KAT006060F003",smh:6430, fuel:72,engineTemp:96,status:"operating",  faults:[{code:"SVC",sev:"medium",desc:"PM overdue 250 hrs — supervisor approved"}],utilToday:52},
  CAT390F: {sn:"KAT00390F0004",smh:11204,fuel:55,engineTemp:0, status:"standby",   faults:[{code:"HYD",sev:"low",   desc:"Minor hydraulic seep — check before operating"}],utilToday:0},
  CAT745_1:{sn:"KAT00745A0001",smh:7840, fuel:71,engineTemp:89,status:"operating",  faults:[],utilToday:91},
  CAT745_2:{sn:"KAT00745A0002",smh:6220, fuel:62,engineTemp:87,status:"operating",  faults:[{code:"TYR",sev:"low",desc:"LF tyre wear — monitor"}],utilToday:84},
  CATD11T: {sn:"KAT00D11T0005",smh:8870, fuel:0, engineTemp:0, status:"maintenance",faults:[{code:"ENG",sev:"high",  desc:"Engine teardown in progress — DO NOT operate"}],utilToday:0},
};
const DIAG_EXT={
  CAT988K:{fluids:{oil:"OK",coolant:"OK",hydraulic:"OK"},svc:{next:"250 hrs",left:76, lastSMH:"14,556"},tyres:[{p:"LF",psi:105,t:110},{p:"RF",psi:108,t:110},{p:"LR",psi:102,t:110},{p:"RR",psi:110,t:110}]},
  CAT992K:{fluids:{oil:"OK",coolant:"OK",hydraulic:"Low"},svc:{next:"500 hrs",left:289,lastSMH:"8,722"}, tyres:[{p:"LF",psi:112,t:110},{p:"RF",psi:114,t:110},{p:"LR",psi:108,t:110},{p:"RR",psi:106,t:110}]},
  CAT6060: {fluids:{oil:"OK",coolant:"OK",hydraulic:"OK"},svc:{next:"OVERDUE",left:-250,lastSMH:"6,180"},tracks:{left:"OK",right:"OK"}},
  CAT390F: {fluids:{oil:"OK",coolant:"OK",hydraulic:"Low"},svc:{next:"250 hrs",left:46, lastSMH:"10,958"},tracks:{left:"OK",right:"Low tension"}},
  CAT745_1:{fluids:{oil:"OK",coolant:"OK",hydraulic:"OK",brake:"OK"},svc:{next:"500 hrs",left:160,lastSMH:"7,680"},tyres:[{p:"LF",psi:620,t:650},{p:"RF",psi:635,t:650},{p:"LR-O",psi:610,t:650},{p:"LR-I",psi:618,t:650},{p:"RR-O",psi:622,t:650},{p:"RR-I",psi:630,t:650}]},
  CAT745_2:{fluids:{oil:"OK",coolant:"OK",hydraulic:"OK",brake:"OK"},svc:{next:"250 hrs",left:30, lastSMH:"6,190"}, tyres:[{p:"LF",psi:570,t:650},{p:"RF",psi:635,t:650},{p:"LR-O",psi:605,t:650},{p:"LR-I",psi:612,t:650},{p:"RR-O",psi:618,t:650},{p:"RR-I",psi:625,t:650}]},
  CATD11T: {fluids:{oil:"N/A",coolant:"N/A",hydraulic:"N/A"},svc:{next:"Post-repair",left:0,lastSMH:"8,870"},tracks:{left:"Removed",right:"Removed"}},
};

// Weekly machine performance — each row = operator's weekly average on that machine
// Loaders/Excavators: ranked by avg t/hr (higher = better)
// Haul Trucks: ranked by avg cycle time (lower = better)
const MACHINE_PERF={
  CAT988K:[
    {name:"James Smith",avatar:"JS",shifts:5,tph:287,cycleMin:1.9,avgBucketT:6.2, weeklyTons:13060,weeklyHrs:45.5,fault:false},
    {name:"Dan Murphy", avatar:"DM",shifts:4,tph:271,cycleMin:2.1,avgBucketT:5.9, weeklyTons:10300,weeklyHrs:38.0,fault:false},
    {name:"Brad Cole",  avatar:"BC",shifts:5,tph:261,cycleMin:2.2,avgBucketT:5.7, weeklyTons:13050,weeklyHrs:50.0,fault:false},
    {name:"Liam Scott", avatar:"LS",shifts:3,tph:249,cycleMin:2.3,avgBucketT:5.5, weeklyTons:7470, weeklyHrs:30.0,fault:false},
    {name:"Rosa Chen",  avatar:"RC",shifts:4,tph:238,cycleMin:2.4,avgBucketT:5.3, weeklyTons:9044, weeklyHrs:38.0,fault:true},
  ],
  CAT992K:[
    {name:"Bec Jones",  avatar:"BJ",shifts:5,tph:311,cycleMin:2.1,avgBucketT:10.3,weeklyTons:14605,weeklyHrs:47.0,fault:false},
    {name:"Tyler Ward", avatar:"TW",shifts:5,tph:298,cycleMin:2.3,avgBucketT:9.8, weeklyTons:14900,weeklyHrs:50.0,fault:false},
    {name:"Mia Torres", avatar:"MT",shifts:4,tph:289,cycleMin:2.4,avgBucketT:9.5, weeklyTons:11324,weeklyHrs:39.2,fault:false},
    {name:"Aaron Diaz", avatar:"AD",shifts:3,tph:274,cycleMin:2.5,avgBucketT:9.1, weeklyTons:8220, weeklyHrs:30.0,fault:false},
    {name:"Fiona Hart", avatar:"FH",shifts:4,tph:263,cycleMin:2.6,avgBucketT:8.8, weeklyTons:10256,weeklyHrs:39.2,fault:false},
  ],
  CAT6060:[
    {name:"Ken Baker",  avatar:"KB",shifts:5,tph:256,cycleMin:3.9,avgBucketT:20.4,weeklyTons:11776,weeklyHrs:46.0,fault:false},
    {name:"Marcus Lee", avatar:"ML",shifts:5,tph:241,cycleMin:4.1,avgBucketT:19.8,weeklyTons:9640, weeklyHrs:40.0,fault:false},
    {name:"Raj Patel",  avatar:"RP",shifts:4,tph:231,cycleMin:4.4,avgBucketT:18.9,weeklyTons:8316, weeklyHrs:36.0,fault:true},
    {name:"Wei Zhang",  avatar:"WZ",shifts:3,tph:219,cycleMin:4.6,avgBucketT:18.2,weeklyTons:5913, weeklyHrs:27.0,fault:false},
  ],
  CAT390F:[
    {name:"Sam Cross",  avatar:"SC",shifts:5,tph:58, cycleMin:6.2,avgBucketT:7.0, weeklyTons:2610, weeklyHrs:45.0,fault:false},
    {name:"Ali Hassan", avatar:"AH",shifts:4,tph:51, cycleMin:7.1,avgBucketT:6.4, weeklyTons:1940, weeklyHrs:38.0,fault:false},
    {name:"Pete Nguyen",avatar:"PN",shifts:3,tph:48, cycleMin:7.4,avgBucketT:6.0, weeklyTons:1296, weeklyHrs:27.0,fault:true},
  ],
  CAT745_1:[
    {name:"Tony Marsh", avatar:"TM",shifts:5,cycleMin:18.5,tripsHr:3.2,payloadT:43.8,tph:140,weeklyTons:6300,weeklyHrs:45.0,fault:false},
    {name:"Dean Walsh", avatar:"DW",shifts:5,cycleMin:19.8,tripsHr:3.0,payloadT:43.1,tph:129,weeklyTons:6175,weeklyHrs:47.5,fault:false},
    {name:"Carl Briggs",avatar:"CB",shifts:4,cycleMin:21.2,tripsHr:2.8,payloadT:42.3,tph:118,weeklyTons:4380,weeklyHrs:36.8,fault:false},
    {name:"Nate Ford",  avatar:"NF",shifts:3,cycleMin:22.9,tripsHr:2.6,payloadT:41.5,tph:108,weeklyTons:2916,weeklyHrs:27.0,fault:true},
  ],
  CAT745_2:[
    {name:"Chris Foy",  avatar:"CF",shifts:5,cycleMin:20.1,tripsHr:3.0,payloadT:44.1,tph:132,weeklyTons:6008,weeklyHrs:45.0,fault:false},
    {name:"Kim Barnes", avatar:"KB",shifts:5,cycleMin:21.2,tripsHr:2.8,payloadT:43.5,tph:122,weeklyTons:5208,weeklyHrs:42.5,fault:false},
    {name:"Jade Wu",    avatar:"JW",shifts:3,cycleMin:23.4,tripsHr:2.6,payloadT:41.8,tph:109,weeklyTons:2943,weeklyHrs:27.0,fault:false},
  ],
  CATD11T:[],
};

const LIVE_OPS={
  u1:{tph:287,cycleMin:1.9, fillPct:93,utilPct:87,active:true},
  u2:{tph:311,cycleMin:2.1, fillPct:96,utilPct:79,active:true},
  u3:{tph:241,cycleMin:4.1, fillPct:90,utilPct:52,active:true},
  u4:{tph:54, cycleMin:6.7, fillPct:90,utilPct:88,active:true},
  u7:{tph:140,cycleMin:18.5,tripsHr:3.2,payloadT:43.8,utilPct:91,active:true},
  u8:{tph:122,cycleMin:21.2,tripsHr:2.8,payloadT:43.5,utilPct:84,active:true},
};
// Dynamic crusher feed — sums each active machine's tph contribution



const DT_CATS={
  rock_jam:    {label:"Rock Stuck",        icon:"🪨",short:"Rock Jam",   fault:false},
  mechanical:  {label:"Mechanical Issue",  icon:"🔧",short:"Mechanical", fault:false},
  crusher_wait:{label:"Crusher Backed Up", icon:"⏳",short:"Crusher Full",fault:false},
  blast:       {label:"Blast / Safety Hold",icon:"💥",short:"Blast Hold",fault:false},
  fuel_stop:   {label:"Fuel Stop",         icon:"⛽",short:"Fuelling",   fault:false},
  operator:    {label:"Operator Break",    icon:"🕒",short:"Op Break",   fault:true},
  other:       {label:"Other",             icon:"❓",short:"Other",      fault:false},
};
const BLASTS=[
  {id:"B1",label:"Pit 1 – Bench 4 North",time:"06:30",dur:45,status:"completed"},
  {id:"B2",label:"Pit 2 – Bench 2 South",time:"10:00",dur:30,status:"completed"},
  {id:"B3",label:"Pit 1 – Bench 3 East", time:"14:00",dur:45,status:"upcoming"},
];
const MACHINE_TYPES=["Wheel Loader","Excavator","Haul Truck","Dozer","Grader","Water Truck","Other"];

// ── Shared primitives ──────────────────────────────────────────────────────
function Card({children,style={},onClick}){return <div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:8,overflow:"hidden",cursor:onClick?"pointer":"default",...style}}>{children}</div>}
function Pill({label,color}){return <span style={{background:`${color}20`,color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>}
function Stat({label,value,color=C.accent,small,sub}){return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:small?"9px 10px":"12px 13px",flex:1,minWidth:0}}><div style={{fontSize:8,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:2}}>{label}</div><div style={{fontFamily:F,fontWeight:900,fontSize:small?16:21,color,lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:9,color:C.muted,marginTop:3}}>{sub}</div>}</div>}
function Bar({value,max=100,color=C.accent,thin}){return <div style={{background:C.border,borderRadius:99,height:thin?4:6,overflow:"hidden"}}><div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .4s"}}/></div>}
function PageHdr({title,sub,back,onBack}){return <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 15px",position:"sticky",top:0,zIndex:10}}>{back&&<button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 11px",color:C.muted,fontSize:11,marginBottom:9,fontFamily:F,fontWeight:700,cursor:"pointer"}}>← Back</button>}<div style={{fontFamily:F,fontWeight:900,fontSize:21,color:C.accent,letterSpacing:".04em"}}>{title}</div>{sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}</div>}
// ── Photo Guide System ─────────────────────────────────────────────────────
// Managers upload reference photos for each pre-start check item.
// Operators see a camera icon on items that have photos — tap to view.
// In production: photos stored in Supabase Storage keyed by mine_id/machine_type/check_id
// In demo: SVG placeholder "photos" that show machine diagram callouts

// Demo photo guides — in production these come from Supabase Storage URLs
// Each entry: {title, caption, svgColor, svgLabel, hasPhoto}
const PHOTO_GUIDES={
  loader:{
    oil:    {title:"Engine Oil Dipstick",   caption:"Driver's side of engine bay — yellow handle. Pull out, wipe, reinsert, check level.",svgColor:"#f5a623",region:[35,55,30,20]},
    coolant:{title:"Coolant Overflow Tank",  caption:"Passenger side — white translucent bottle. MIN/MAX marks. Check cold only.",          svgColor:"#4fa3e0",region:[55,40,25,22]},
    hyd:    {title:"Hydraulic Fluid Tank",   caption:"Behind cab — red cap on reservoir. Check sight glass on tank side.",                 svgColor:"#e05252",region:[60,60,25,18]},
    fuel:   {title:"Fuel Level Gauge",       caption:"Check dash gauge. Confirm filler cap is tight before moving.",                       svgColor:"#3ecf8e",region:[20,25,28,16]},
    brakes: {title:"Brake Test",             caption:"Hold pedal — should feel firm within 3 pumps at startup.",                           svgColor:"#a78bfa",region:[15,65,28,16]},
    tyres:  {title:"Tyre Inspection",        caption:"Walk all 4 corners. Look for cuts, embedded rocks, bulges, flat spots.",             svgColor:"#e0a847",region:[10,75,80,12]},
    lights: {title:"Lights & Signals",       caption:"Front floods, reverse lights, indicators — test before moving.",                     svgColor:"#f5a623",region:[5,20,90,10]},
    horn:   {title:"Horn & Reverse Alarm",   caption:"Sound horn. Walk behind and confirm reverse alarm is audible.",                      svgColor:"#4fa3e0",region:[38,30,24,14]},
    rops:   {title:"Seatbelt & ROPS",        caption:"Click seatbelt, pull hard to test. Inspect ROPS for cracks or deformation.",        svgColor:"#3ecf8e",region:[30,20,40,25]},
    fire:   {title:"Fire Suppression",       caption:"Red indicator on dash = armed. Green = discharged — do NOT operate.",               svgColor:"#e05252",region:[70,22,20,14]},
  },
  truck:{
    oil:    {title:"Engine Oil (behind cab)",caption:"Via service steps, engine bay — yellow cap. Check on dipstick.",                     svgColor:"#f5a623",region:[40,50,25,20]},
    coolant:{title:"Coolant Tank",           caption:"Engine bay — white bottle. Do NOT open hot. Check MIN/MAX sight glass.",             svgColor:"#4fa3e0",region:[55,45,25,20]},
    hyd:    {title:"Hydraulic/Brake Fluid",  caption:"Combined reservoir — check level through sight glass.",                              svgColor:"#e05252",region:[60,60,22,18]},
    fuel:   {title:"Fuel Gauge & Cap",       caption:"Check dash gauge and confirm filler cap is secure.",                                 svgColor:"#3ecf8e",region:[15,55,25,18]},
    brakes: {title:"Brake Test",             caption:"Engine running: pedal should hold firm. Test retarder on incline.",                 svgColor:"#a78bfa",region:[20,68,28,15]},
    tyres:  {title:"All 6 Tyres",           caption:"Walk all 6. Target 550–650 kPa. Look for embedded material or damage.",              svgColor:"#e0a847",region:[5,72,90,14]},
    lights: {title:"Lights & Signals",       caption:"Position lights, headlights, reverse lights, hazards — before leaving yard.",       svgColor:"#f5a623",region:[5,15,90,12]},
    horn:   {title:"Horn & Reverse Alarm",   caption:"Audible from 10m behind the truck.",                                                svgColor:"#4fa3e0",region:[40,28,20,12]},
    rops:   {title:"Seatbelt & Cab",         caption:"Click and tension-test seatbelt. Check cab for structural damage.",                 svgColor:"#3ecf8e",region:[30,18,40,22]},
    fire:   {title:"Fire Suppression",       caption:"Both dash indicators must be green. Check nozzles at engine bay.",                  svgColor:"#e05252",region:[62,18,22,14]},
  },
};
// SVG "photo" generator — makes a realistic-looking machine diagram callout
// In production this is replaced by real uploaded photos
function DemoPhoto({guide,machineType}){
  const[x,y,w,h]=guide.region;
  return <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",display:"block"}}>
    <defs>
      <radialGradient id={`bg${x}`} cx="50%" cy="50%"><stop offset="0%" stopColor="#1c2738"/><stop offset="100%" stopColor="#07090d"/></radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    {/* Dark machine body background */}
    <rect width="100" height="100" fill={`url(#bg${x})`}/>
    {/* Machine silhouette lines */}
    <rect x="5" y="35" width="90" height="55" rx="4" fill="#0d1118" stroke="#1c2738" strokeWidth=".5"/>
    <rect x="15" y="20" width="70" height="25" rx="3" fill="#0d1118" stroke="#1c2738" strokeWidth=".5"/>
    <ellipse cx="20" cy="92" rx="10" ry="6" fill="#0d1118" stroke="#1c2738" strokeWidth=".5"/>
    <ellipse cx="80" cy="92" rx="10" ry="6" fill="#0d1118" stroke="#1c2738" strokeWidth=".5"/>
    {/* Grid lines for detail */}
    {[40,50,60,70].map(ly=><line key={ly} x1="5" y1={ly} x2="95" y2={ly} stroke="#1c2738" strokeWidth=".3"/>)}
    {[20,40,60,80].map(lx=><line key={lx} x1={lx} y1="35" x2={lx} y2="90" stroke="#1c2738" strokeWidth=".3"/>)}
    {/* Highlighted region */}
    <rect x={x} y={y} width={w} height={h} rx="2" fill={guide.svgColor} fillOpacity=".18" stroke={guide.svgColor} strokeWidth="1.5" filter="url(#glow)"/>
    {/* Animated pulse */}
    <rect x={x+w/2-3} y={y+h/2-3} width="6" height="6" rx="3" fill={guide.svgColor} opacity=".9"/>
    {/* Callout line */}
    <line x1={x+w/2} y1={y} x2={50} y2={12} stroke={guide.svgColor} strokeWidth=".8" strokeDasharray="2,1"/>
    <rect x="28" y="5" width="44" height="10" rx="2" fill={guide.svgColor} fillOpacity=".2"/>
    <text x="50" y="12" textAnchor="middle" style={{fontSize:4.5,fill:guide.svgColor,fontFamily:"monospace",fontWeight:"bold"}}>{guide.svgLabel||guide.title.split(" ")[0].toUpperCase()}</text>
    {/* Corner watermark */}
    <text x="95" y="98" textAnchor="end" style={{fontSize:3,fill:"#1c2738",fontFamily:"monospace"}}>MINEOPS REF PHOTO</text>
  </svg>;
}

// Full-screen photo viewer overlay
function PhotoViewer({guide,machineType,onClose}){
  const typeKey=machineType==="Haul Truck"?"truck":"loader";
  const g=PHOTO_GUIDES[typeKey]?.[guide]||{title:guide,caption:"No photo guide set up yet.",svgColor:C.muted,region:[30,30,40,40]};
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.94)",zIndex:500,display:"flex",flexDirection:"column"}} onClick={onClose}>
    <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}} onClick={e=>e.stopPropagation()}>
      <div><div style={{fontFamily:F,fontWeight:900,fontSize:18,color:"#fff"}}>{g.title}</div><div style={{fontSize:11,color:"#6b7a99",marginTop:2}}>{machineType} · Reference Photo</div></div>
      <button onClick={onClose} style={{background:`${g.svgColor}22`,border:`1px solid ${g.svgColor}44`,borderRadius:8,padding:"6px 14px",color:g.svgColor,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕ Close</button>
    </div>
    {/* Photo area */}
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:"100%",maxWidth:340,aspectRatio:"4/3",borderRadius:14,overflow:"hidden",border:`2px solid ${g.svgColor}44`}}>
        <DemoPhoto guide={g} machineType={machineType}/>
      </div>
    </div>
    {/* Caption */}
    <div style={{padding:"16px 22px 32px",flexShrink:0}} onClick={e=>e.stopPropagation()}>
      <div style={{background:`${g.svgColor}15`,border:`1px solid ${g.svgColor}33`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:g.svgColor,marginBottom:4}}>📍 What to look for</div>
        <div style={{fontSize:13,color:"#b0b8cc",lineHeight:1.6}}>{g.caption}</div>
      </div>
    </div>
  </div>;
}

function CkRow({label,checked,onChange,checkId,machineType,onPhoto}){return <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",borderBottom:`1px solid ${C.border}22`}}><div onClick={()=>onChange(!checked)} style={{width:26,height:26,borderRadius:7,background:checked?C.success:"transparent",border:`2px solid ${checked?C.success:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,transition:"all .15s",cursor:"pointer"}}>{checked?"✓":""}</div><span onClick={()=>onChange(!checked)} style={{fontSize:14,color:checked?C.text:C.textSub,flex:1,lineHeight:1.3,cursor:"pointer"}}>{label}</span>{onPhoto&&<button onClick={e=>{e.stopPropagation();onPhoto(checkId);}} style={{background:`${C.info}18`,border:`1px solid ${C.info}33`,borderRadius:7,padding:"5px 8px",color:C.info,fontSize:14,cursor:"pointer",flexShrink:0,lineHeight:1}} title="View reference photo">📷</button>}</div>}
// ── Truck Check (shared by all roles) ────────────────────────────────────
// ── Vehicle Check Definitions ─────────────────────────────────────────────
// Sectioned pre-operational inspection. photoEncouraged → big camera CTA
// on the row. requirePhotoOnFail → when state==='fail', must capture a
// photo before sign-off (in addition to a written defect note).
const VEHICLE_CHECK_SECTIONS=[
  {title:"Exterior",icon:"🚗",items:[
    {key:"tyres",     label:"Tyres",                hint:"Tread depth · cuts · bulges · pressure",   photoEncouraged:true},
    {key:"lights",    label:"Lights & indicators",  hint:"Head · tail · brake · indicators · hazards",photoEncouraged:true},
    {key:"mirrors",   label:"Mirrors",              hint:"All present, adjusted, intact"},
    {key:"windscreen",label:"Windscreen & wipers",  hint:"No cracks · wipers + washers working"},
    {key:"body",      label:"Body damage",          hint:"New dents · scrapes · loose panels"},
  ]},
  {title:"Engine bay",icon:"⚙",items:[
    {key:"oil",       label:"Engine oil level",     hint:"Between MIN and MAX on dipstick"},
    {key:"coolant",   label:"Coolant level",        hint:"Cold check only · between marks"},
    {key:"brake_fl",  label:"Brake fluid level",    hint:"Reservoir between marks"},
    {key:"leaks",     label:"No fluid leaks under vehicle",hint:"Walk around · check ground", photoEncouraged:true},
  ]},
  {title:"Cabin",icon:"🪑",items:[
    {key:"seatbelt",  label:"Seatbelt operates correctly", hint:"Clicks in · retracts · no fraying"},
    {key:"horn",      label:"Horn works"},
    {key:"dash",      label:"No dash warning lights"},
    {key:"brakes",    label:"Brake test — pedal firm",    hint:"With engine running, pedal stays firm"},
    {key:"handbrake", label:"Handbrake holds"},
    {key:"steering",  label:"Steering — no excessive play"},
  ]},
  {title:"Load & towing",icon:"🪢",items:[
    {key:"load_sec",  label:"Load secured",                hint:"Straps / cargo barrier intact (N/A if empty)"},
    {key:"tow",       label:"Tow equipment intact",        hint:"Hitch · chains · electrics (N/A if not towing)"},
  ]},
  {title:"Emergency gear",icon:"🚨",items:[
    {key:"fire_ext",  label:"Fire extinguisher present + in date"},
    {key:"first_aid", label:"First aid kit present + sealed"},
    {key:"hi_vis",    label:"Hi-vis vest in cab"},
    {key:"triangle",  label:"Warning triangle / cones"},
  ]},
];
const ALL_VEHICLE_ITEMS=VEHICLE_CHECK_SECTIONS.flatMap(s=>s.items);

// ── Vehicle Check Row ─────────────────────────────────────────────────────
function VehicleCheckRow({item,value,onChange}){
  const fileRef=useRef(null);
  const[thumbUrl,setThumbUrl]=useState(null);
  useEffect(()=>{
    if(!value?.photo){setThumbUrl(null);return;}
    const u=URL.createObjectURL(value.photo);setThumbUrl(u);
    return()=>URL.revokeObjectURL(u);
  },[value?.photo]);
  const set=patch=>onChange({...(value||{}),...patch});
  const state=value?.state;
  const fail=state==="fail";
  const failNeedsEvidence=fail&&!(value?.note?.trim()||value?.photo);
  const Btn=({val,lb,col})=>{
    const sel=state===val;
    return<button type="button" onClick={()=>set({state:val})}
      style={{flex:1,background:sel?col:"transparent",color:sel?"#000":col,border:`2px solid ${col}`,borderRadius:9,padding:"8px 0",fontFamily:F,fontWeight:900,fontSize:12,letterSpacing:".04em",cursor:"pointer",transition:"all .15s"}}>{lb}</button>;
  };
  return<div style={{padding:"12px 0",borderBottom:`1px solid ${C.border}22`}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:14,color:C.text}}>{item.label}</div>
        {item.hint&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{item.hint}</div>}
      </div>
      {(item.photoEncouraged||fail||value?.photo)&&<button type="button" onClick={()=>fileRef.current?.click()}
        style={{background:value?.photo?`${C.success}15`:`${C.info}15`,border:`1px solid ${value?.photo?C.success:C.info}55`,borderRadius:8,padding:"5px 9px",color:value?.photo?C.success:C.info,fontSize:13,cursor:"pointer",lineHeight:1,flexShrink:0}}
        title={value?.photo?"Retake photo":"Attach photo"}>📷</button>}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:value?.photo||fail?8:0}}>
      <Btn val="pass" lb="✓ Pass" col={C.success}/>
      <Btn val="fail" lb="✕ Fail" col={C.danger}/>
      <Btn val="na"   lb="N/A"   col={C.muted}/>
    </div>
    {value?.photo&&thumbUrl&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
      <img src={thumbUrl} alt="" style={{width:46,height:46,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border}`}}/>
      <button type="button" onClick={()=>fileRef.current?.click()}
        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 9px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Retake</button>
      <button type="button" onClick={()=>set({photo:null})}
        style={{background:"none",border:`1px solid ${C.danger}33`,borderRadius:7,padding:"4px 9px",color:C.danger,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕</button>
    </div>}
    {fail&&<div style={{marginTop:8}}>
      <input value={value?.note||""} onChange={e=>set({note:e.target.value})}
        placeholder="What's wrong? (required for fail)"
        style={{background:C.surface,color:C.text,border:`1px solid ${value?.note?.trim()?C.success:C.danger}55`,borderRadius:8,padding:"9px 12px",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
      {failNeedsEvidence&&<div style={{fontSize:10,color:C.danger,marginTop:4,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>⚠ Note or photo required for fail</div>}
    </div>}
    <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}}
      onChange={e=>{const f=e.target.files?.[0];if(f)set({photo:f});e.target.value="";}}/>
  </div>;
}

// ── Vehicle Check Screen ──────────────────────────────────────────────────
// Polished pre-operational inspection. Save writes a vehicle_checks row +
// uploads any attached photos to check-photos with log_type='vehicle_check'.
function TruckCheckScreen({onComplete,activeMine,activeShiftId,user}){
  const[phase,setPhase]=useState("form"); // form | summary | done
  const[vehicleLabel,setVehicleLabel]=useState("");
  const[odo,setOdo]=useState("");
  const[items,setItems]=useState({});      // {key: {state, note, photo}}
  const[defectNotes,setDefectNotes]=useState("");
  const[submitting,setSubmitting]=useState(false);
  const[err,setErr]=useState("");

  const counts={
    pass:ALL_VEHICLE_ITEMS.filter(i=>items[i.key]?.state==="pass").length,
    fail:ALL_VEHICLE_ITEMS.filter(i=>items[i.key]?.state==="fail").length,
    na:  ALL_VEHICLE_ITEMS.filter(i=>items[i.key]?.state==="na").length,
  };
  const pending=ALL_VEHICLE_ITEMS.length-counts.pass-counts.fail-counts.na;
  const failItems=ALL_VEHICLE_ITEMS.filter(i=>items[i.key]?.state==="fail");
  const failsHaveEvidence=failItems.every(i=>(items[i.key]?.note?.trim()||items[i.key]?.photo));
  const canReview=pending===0&&vehicleLabel.trim()&&failsHaveEvidence;

  const submit=async()=>{
    if(submitting)return;
    setSubmitting(true);setErr("");
    try{
      let row=null;
      if(activeMine?.id){
        const odNum=odo.trim()?parseInt(odo,10):null;
        const{data,error}=await supabase.from("vehicle_checks").insert({
          mine_id:activeMine.id,
          shift_id:activeShiftId||null,
          operator_id:user?.id||null,
          operator_name:user?.name||"Operator",
          vehicle_label:vehicleLabel.trim(),
          odometer_km:Number.isFinite(odNum)?odNum:null,
          results:Object.fromEntries(Object.entries(items).map(([k,v])=>[k,{state:v?.state||null,note:v?.note?.trim()||null}])),
          defect_notes:defectNotes.trim()||null,
          pass_count:counts.pass,fail_count:counts.fail,na_count:counts.na,
        }).select().single();
        if(error)throw error;
        row=data;
        const tasks=Object.entries(items).filter(([,v])=>v?.photo).map(([k,v])=>uploadCheckPhoto({
          file:v.photo,mineId:activeMine.id,logType:"vehicle_check",logId:row.id,itemKey:k,uploadedBy:user?.id,
        }));
        await Promise.all(tasks);
      }
      setPhase("done");
    }catch(e){console.error("vehicle check submit:",e);setErr(e.message||"Could not submit. Try again.");}
    finally{setSubmitting(false);}
  };

  if(phase==="done")return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"36px 22px",textAlign:"center"}} className="up">
    <div style={{fontSize:62,marginBottom:14}}>{counts.fail>0?"⚠️":"✅"}</div>
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:counts.fail>0?C.amber:C.success,marginBottom:8}}>{counts.fail>0?"Submitted with defects":"All clear"}</div>
    <div style={{fontSize:13,color:C.muted,marginBottom:22,maxWidth:300,lineHeight:1.5}}>
      {vehicleLabel} · {counts.pass} pass · {counts.fail} fail · {counts.na} N/A
      {counts.fail>0&&<><br/><br/><span style={{color:C.amber}}>Notify your supervisor before driving.</span></>}
    </div>
    <button onClick={onComplete} style={{width:"100%",maxWidth:300,background:C.success,color:"#000",border:"none",borderRadius:14,padding:"16px",fontFamily:F,fontWeight:900,fontSize:17,letterSpacing:".04em",cursor:"pointer"}}>Continue →</button>
  </div>;

  if(phase==="summary")return<div style={{paddingBottom:90}}>
    <PageHdr title="Review & submit" sub={`${vehicleLabel} · ${counts.pass+counts.fail+counts.na} items checked`} back onBack={()=>setPhase("form")}/>
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <div style={{flex:1,background:`${C.success}10`,border:`1px solid ${C.success}44`,borderRadius:12,padding:"12px",textAlign:"center"}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.success}}>{counts.pass}</div>
          <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginTop:2}}>Pass</div>
        </div>
        <div style={{flex:1,background:`${C.danger}10`,border:`1px solid ${C.danger}44`,borderRadius:12,padding:"12px",textAlign:"center"}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.danger}}>{counts.fail}</div>
          <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginTop:2}}>Fail</div>
        </div>
        <div style={{flex:1,background:`${C.muted}10`,border:`1px solid ${C.muted}44`,borderRadius:12,padding:"12px",textAlign:"center"}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.muted}}>{counts.na}</div>
          <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginTop:2}}>N/A</div>
        </div>
      </div>

      {failItems.length>0?<div style={{background:`${C.danger}08`,border:`1px solid ${C.danger}33`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:12,color:C.danger,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>⚠ Defects logged</div>
        {failItems.map(i=>{
          const v=items[i.key];
          return<div key={i.key} style={{padding:"6px 0",borderBottom:`1px solid ${C.danger}22`,fontSize:12}}>
            <div style={{fontFamily:F,fontWeight:700,color:C.text}}>{i.label}</div>
            {v.note&&<div style={{color:C.textSub,marginTop:2}}>{v.note}</div>}
            {v.photo&&<div style={{fontSize:10,color:C.success,marginTop:2,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>📷 PHOTO ATTACHED</div>}
          </div>;
        })}
      </div>:<div style={{background:`${C.success}08`,border:`1px solid ${C.success}33`,borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:12,color:C.success,fontFamily:F,fontWeight:700}}>✓ No defects — vehicle ready for use</div>}

      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Additional notes <span style={{color:C.muted,fontWeight:400}}>· optional</span></div>
      <textarea value={defectNotes} onChange={e=>setDefectNotes(e.target.value)} rows={3}
        placeholder="Anything else the next driver / mechanic should know?"
        style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit",resize:"vertical",marginBottom:14}}/>

      {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger}}>{err}</div>}

      <button onClick={submit} disabled={submitting}
        style={{width:"100%",background:submitting?C.border:`linear-gradient(135deg,${C.accent},#d4881e)`,color:submitting?C.muted:"#000",border:"none",borderRadius:14,padding:"16px",fontFamily:F,fontWeight:900,fontSize:18,letterSpacing:".04em",cursor:submitting?"default":"pointer"}}>
        {submitting?"Saving…":"✅ Sign Off Inspection"}
      </button>
    </div>
  </div>;

  // form
  return<div style={{paddingBottom:130}}>
    <PageHdr title="Vehicle Pre-Op Check" sub="Pre-operational inspection · MSHA / MQSHA"/>
    <div style={{padding:"14px 16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Vehicle <span style={{color:C.danger}}>*</span></div>
        <input value={vehicleLabel} onChange={e=>setVehicleLabel(e.target.value)}
          placeholder="e.g. Toyota Hilux · Rego ABC 123"
          style={{background:C.surface,color:C.text,border:`1px solid ${vehicleLabel.trim()?C.success:C.border}`,borderRadius:8,padding:"10px 12px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Odometer <span style={{color:C.muted,fontWeight:400}}>· optional · km</span></div>
        <input value={odo} onChange={e=>setOdo(e.target.value.replace(/[^\d]/g,""))} inputMode="numeric" placeholder="e.g. 84203"
          style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box"}}/>
      </div>

      {VEHICLE_CHECK_SECTIONS.map(sec=>(
        <div key={sec.title} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 4px 8px"}}>
            <span style={{fontSize:16}}>{sec.icon}</span>
            <span style={{fontFamily:F,fontWeight:900,fontSize:11,color:C.muted,letterSpacing:".1em",textTransform:"uppercase"}}>{sec.title}</span>
            <span style={{flex:1,height:1,background:`${C.border}66`,marginLeft:8}}/>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 14px"}}>
            {sec.items.map(item=><VehicleCheckRow key={item.key} item={item}
              value={items[item.key]}
              onChange={v=>setItems(p=>({...p,[item.key]:v}))}/>)}
          </div>
        </div>
      ))}
    </div>

    {/* Sticky footer with counts + Review CTA */}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`${C.bg}f5`,backdropFilter:"blur(10px)",borderTop:`1px solid ${C.border}`,padding:"12px 16px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,fontSize:11}}>
        <span style={{color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>{pending===0?"All items checked":`${pending} item${pending!==1?"s":""} left`}</span>
        <span style={{fontFamily:F,fontWeight:700}}>
          <span style={{color:C.success}}>✓ {counts.pass}</span>
          {" · "}<span style={{color:C.danger}}>✕ {counts.fail}</span>
          {" · "}<span style={{color:C.muted}}>— {counts.na}</span>
        </span>
      </div>
      <button onClick={()=>setPhase("summary")} disabled={!canReview}
        style={{width:"100%",background:canReview?C.success:C.border,color:canReview?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:17,letterSpacing:".04em",cursor:canReview?"pointer":"default"}}>
        {pending>0?`Answer remaining ${pending} item${pending!==1?"s":""}`:
         !vehicleLabel.trim()?"Enter vehicle name":
         !failsHaveEvidence?"Add note/photo for failed items":
         "Review & Submit →"}
      </button>
    </div>
  </div>;
}

// ── Maintenance Gate ──────────────────────────────────────────────────────
// Fires after pre-start sign-off, before machine is cleared to operate.
// Checks grease (10 SMH), filter (100 SMH), and scheduled service (SMH-based).
// Each item must be acknowledged before the operator can start the shift.

function MaintenanceGate({machineId,allMachines,onClear,onBack,activeMine,user}){
  const m=allMachines.find(x=>x.id===machineId);
  const cat=CAT_DEMO[machineId];
  const currentSMH=cat?.smh||0;
  const truck=isMachTruck(m?.type);

  // Pull last known maintenance from the global MAINT_TASKS intervals
  // In production: fetched from DB. Here: seeded demo data.
  const SEED_LOG={
    CAT988K: {grease:14830,filter:14800,service:14556},
    CAT992K: {grease:9208, filter:9100, service:8722},
    CAT6060:  {grease:6428, filter:6350, service:6180},
    CAT390F:  {grease:11200,filter:11150,service:10958},
    CAT745_1: {grease:7838, filter:7750, service:7680},
    CAT745_2: {grease:6218, filter:6150, service:6190},
    CATD11T:  {grease:8860, filter:8800, service:8870},
  };
  const seed=SEED_LOG[machineId]||{grease:currentSMH-5,filter:currentSMH-80,service:currentSMH-400};

  // Calculate status for each item
  const greaseSMH=currentSMH-seed.grease;     // hours since last grease
  const filterSMH=currentSMH-seed.filter;     // hours since last filter blow
  const serviceSMH=currentSMH-seed.service;   // hours since last service
  const svcInterval=DIAG_EXT[machineId]?.svc?.next?.includes("500")?500:250;

  const items=[];
  // Grease: required at 10 SMH
  if(greaseSMH>=8){
    items.push({
      id:"grease",icon:"🪣",color:"#f5a623",
      title:"Greasing",
      due:`Last greased ${greaseSMH.toFixed(1)} SMH ago`,
      severity:greaseSMH>=10?"required":"recommended",
      body:greaseSMH>=10
        ?"This machine is due for greasing. All pins, pivots and bucket linkage must be greased before operating."
        :`Greasing is due in ${(10-greaseSMH).toFixed(1)} SMH. Recommended to grease now.`,
      opts:[
        {id:"done_me",  label:"✅ I greased it before this shift",        style:"success"},
        {id:"done_other",label:"✅ Greased by previous shift / maint team",style:"success"},
        {id:"log_now",  label:"📋 Logging — will grease before startup",  style:"amber"},
        {id:"skip",     label:"⬜ Not done — flag for supervisor",         style:"danger"},
      ],
      requiresName:["done_other"],
      requiresSupervisor:[],
      hardStop:false,
    });
  }
  // Filter: required at 100 SMH
  if(filterSMH>=80){
    items.push({
      id:"filter",icon:"💨",color:"#4fa3e0",
      title:"Air Filter Blow-Out",
      due:`Last blown out ${filterSMH.toFixed(0)} SMH ago`,
      severity:filterSMH>=100?"required":"recommended",
      body:filterSMH>=100
        ?"Filter blow-out is overdue. Running with a clogged filter risks engine damage. Must be blown out before operating."
        :`Filter blow-out due in ${(100-filterSMH).toFixed(0)} SMH. Strongly recommended now.`,
      opts:[
        {id:"done_me",   label:"✅ Blown out before this shift",           style:"success"},
        {id:"done_other",label:"✅ Done by maintenance team / last shift",  style:"success"},
        {id:"scheduled", label:"📅 Scheduled — being done before startup",  style:"amber"},
        {id:"supervisor",label:"🔶 Supervisor approved to run",             style:"danger"},
      ],
      requiresName:["done_other"],
      requiresSupervisor:["supervisor"],
      hardStop:filterSMH>=120,
    });
  }
  // Scheduled service (250 or 500 SMH)
  const svcDue=svcInterval-(serviceSMH%svcInterval);
  if(svcDue<=50||serviceSMH%svcInterval===0){
    const overdue=svcDue<=0||serviceSMH%svcInterval===0;
    items.push({
      id:"service",icon:"🔧",color:overdue?"#e05252":"#e0a847",
      title:`${svcInterval}-Hour Service`,
      due:overdue?`SERVICE OVERDUE — ${svcInterval}hr service past due`:`Service due in ${svcDue} SMH`,
      severity:overdue?"overdue":"due-soon",
      body:overdue
        ?`This machine is overdue for its ${svcInterval}-hour scheduled service. Do NOT operate without supervisor approval and a service booking confirmed.`
        :`${svcInterval}-hour service coming up in ${svcDue} SMH. Has it been booked?`,
      opts:[
        {id:"completed",  label:"✅ Service was completed",                  style:"success"},
        {id:"booked",     label:"📅 Booked — enter service date",            style:"amber"},
        {id:"supervisor", label:"🔶 Running under supervisor approval",       style:"danger"},
      ],
      requiresName:[],
      requiresSupervisor:["supervisor"],
      hardStop:overdue,
    });
  }

  // If nothing needs attention, clear immediately
  useEffect(()=>{if(items.length===0)onClear([]);},[]);
  if(items.length===0)return null;

  // State: one card at a time
  const[idx,setIdx]=useState(0);
  const[sel,setSel]=useState(null);
  const[name,setName]=useState("");
  const[supName,setSupName]=useState("");
  const[date,setDate]=useState("");
  const[cleared,setCleared]=useState([]);

  const item=items[idx];
  if(!item){onClear(cleared);return null;}

  const needsName=sel&&item.requiresName?.includes(sel);
  const needsSup=sel&&item.requiresSupervisor?.includes(sel);
  const needsDate=sel==="booked";
  const canProceed=sel&&(!needsName||name.trim())&&(!needsSup||supName.trim())&&(!needsDate||date.trim());

  const advance=()=>{
    const entry={item:item.id,choice:sel,name:name.trim()||null,supervisor:supName.trim()||null,date:date.trim()||null,smh:currentSMH};
    const next=[...cleared,entry];
    setCleared(next);
    if(idx+1>=items.length){onClear(next);}
    else{setIdx(i=>i+1);setSel(null);setName("");setSupName("");setDate("");}
  };

  const optCol=style=>style==="success"?C.success:style==="amber"?C.amber:C.danger;

  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}} className="up">
    {/* Header */}
    <div style={{background:item.hardStop?`${C.danger}18`:C.surface,borderBottom:`1px solid ${item.hardStop?C.danger:C.border}`,padding:"14px 16px",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:11,color:C.muted,letterSpacing:".1em",textTransform:"uppercase"}}>{m?.model} · Pre-Start Gate</div>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted}}>{idx+1} of {items.length}</div>
      </div>
      {/* Progress dots */}
      <div style={{display:"flex",gap:6}}>
        {items.map((_,i)=><div key={i} style={{height:4,flex:1,borderRadius:99,background:i<idx?C.success:i===idx?item.color:C.border,transition:"background .3s"}}/>)}
      </div>
    </div>

    {/* Body */}
    <div style={{flex:1,overflowY:"auto",padding:"18px 16px 100px"}}>
      {/* Item header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
        <div style={{width:56,height:56,borderRadius:16,background:`${item.color}20`,border:`2px solid ${item.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{item.icon}</div>
        <div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:item.severity==="overdue"||item.hardStop?item.color:C.text}}>{item.title}</div>
          <div style={{fontSize:11,color:item.severity==="required"||item.severity==="overdue"?item.color:C.muted,fontFamily:F,fontWeight:700,marginTop:2}}>{item.due}</div>
        </div>
      </div>

      {/* Description */}
      <div style={{background:`${item.color}10`,border:`1px solid ${item.color}33`,borderRadius:12,padding:"12px 14px",marginBottom:18}}>
        {item.hardStop&&<div style={{fontFamily:F,fontWeight:900,fontSize:13,color:item.color,marginBottom:6}}>⛔ DO NOT OPERATE WITHOUT APPROVAL</div>}
        <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{item.body}</div>
      </div>

      {/* Options */}
      <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>What's the status?</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {item.opts.map(opt=>{
          const active=sel===opt.id;const oc=optCol(opt.style);
          return <button key={opt.id} onClick={()=>{setSel(opt.id);setName("");setSupName("");setDate("");}}
            style={{background:active?`${oc}18`:C.card,border:`2px solid ${active?oc:C.border}`,borderRadius:12,padding:"14px 15px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
            <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${active?oc:C.border}`,background:active?oc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#000",flexShrink:0,transition:"all .15s"}}>{active?"✓":""}</div>
            <span style={{fontFamily:F,fontWeight:700,fontSize:14,color:active?oc:C.textSub}}>{opt.label}</span>
          </button>;
        })}
      </div>

      {/* Conditional inputs */}
      {needsName&&<div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Who did it? <span style={{color:C.danger}}>*</span></div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name of technician / operator" style={{background:C.surface,color:C.text,border:`1px solid ${name?C.success:C.border}`,borderRadius:9,padding:"12px 14px",fontSize:14,width:"100%",outline:"none"}}/>
      </div>}
      {needsSup&&<div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:C.danger,fontFamily:F,fontWeight:700,marginBottom:6}}>🔶 Supervisor name required <span style={{color:C.danger}}>*</span></div>
        <input value={supName} onChange={e=>setSupName(e.target.value)} placeholder="Supervising name — accepts responsibility" style={{background:C.surface,color:C.text,border:`1px solid ${supName?C.success:C.danger}`,borderRadius:9,padding:"12px 14px",fontSize:14,width:"100%",outline:"none"}}/>
      </div>}
      {needsDate&&<div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Service date booked <span style={{color:C.danger}}>*</span></div>
        <input value={date} onChange={e=>setDate(e.target.value)} placeholder="e.g. 15 April 2026" style={{background:C.surface,color:C.text,border:`1px solid ${date?C.success:C.border}`,borderRadius:9,padding:"12px 14px",fontSize:14,width:"100%",outline:"none"}}/>
      </div>}
    </div>

    {/* Footer */}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`${C.bg}f8`,backdropFilter:"blur(10px)",padding:"12px 16px 24px",borderTop:`1px solid ${C.border}`}}>
      <button onClick={()=>{if(canProceed)advance();}} style={{width:"100%",background:canProceed?item.hardStop?C.danger:C.success:C.border,color:canProceed?"#000":C.muted,border:"none",borderRadius:12,padding:"16px",fontFamily:F,fontWeight:900,fontSize:18,cursor:canProceed?"pointer":"default",transition:"background .2s"}}>
        {!sel?"Select an option above":!canProceed?"Fill in required field":idx+1<items.length?`Confirm & Next →`:"Confirm & Start Shift ✅"}
      </button>
      {idx===0&&<button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>← Back to pre-start</button>}
    </div>
  </div>;
}

// ── Machine Select ────────────────────────────────────────────────────────
function SinglePreStart({machineId,catDemo,allMachines,onDone,activeMine,activeShiftId,user}){
  const m=catDemo.find(x=>x.id===machineId)?.meta,cat=catDemo.find(x=>x.id===machineId)?.data;
  const[checks,setChecks]=useState({});const[fuel,setFuel]=useState("");const[fuelErr,setFuelErr]=useState("");
  const[photoViewing,setPhotoViewing]=useState(null);
  const[showGate,setShowGate]=useState(false);
  const machineType=m?.type||"Wheel Loader";
  const cnt=Object.values(checks).filter(Boolean).length;const allDone=PRESTART.every(c=>checks[c.id]);
  const fuelNum=parseInt(fuel)||0;const fuelOk=fuelNum>=1&&fuelNum<=100&&!fuelErr;const can=allDone&&fuelOk;
  const handleFuel=v=>{setFuel(v);if(v==="")return setFuelErr("");const n=parseInt(v);if(isNaN(n)||n<1||n>100)return setFuelErr("Must be 1–100%");setFuelErr("");};
  return <div style={{paddingBottom:20}}>
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",position:"sticky",top:0,zIndex:10}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.accent}}>Pre-Start: {m?.model}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>HSMP minimum · {PRESTART.length} items</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:9}}><div style={{background:C.border,borderRadius:99,height:6,flex:1,overflow:"hidden"}}><div style={{width:`${Math.round((cnt/PRESTART.length)*100)}%`,height:"100%",background:allDone?C.success:C.accent,borderRadius:99,transition:"width .3s"}}/></div><span style={{fontSize:11,color:allDone?C.success:C.muted,flexShrink:0,fontFamily:F,fontWeight:700}}>{cnt}/{PRESTART.length}</span></div>
    </div>
    <div style={{padding:"12px 16px"}}>
      {cat?.faults?.map((f,i)=><div key={i} style={{display:"flex",gap:8,background:`${f.sev==="high"?C.danger:C.amber}12`,border:`1px solid ${f.sev==="high"?C.danger:C.amber}30`,borderRadius:8,padding:"9px 12px",marginBottom:9}}><span style={{fontFamily:F,fontWeight:900,fontSize:13,color:f.sev==="high"?C.danger:C.amber,flexShrink:0}}>{f.code}</span><span style={{fontSize:12,color:C.textSub}}>{f.desc}</span></div>)}
      {showGate&&<MaintenanceGate machineId={machineId} allMachines={allMachines} activeMine={activeMine} user={user} onClear={async maintLog=>{if(activeMine?.id&&user?.id&&maintLog?.length){try{const rows=maintLog.map(e=>({mine_id:activeMine.id,machine_id:machineId,task_id:e.item,smh_at_service:e.smh||null,hours_at_service:e.smh||null,technician_name:e.name||user.name||null,supervisor_approved_by:e.supervisor||null,notes:e.choice+(e.date?` booked ${e.date}`:""),logged_at:new Date().toISOString()}));const{error}=await supabase.from("maintenance_logs").insert(rows);if(error)console.error("maint insert:",error);}catch(e){console.error("maint exception:",e);}}onDone({machineId,fuel:parseInt(fuel),maintLog});}} onBack={()=>setShowGate(false)}/>}
      {photoViewing&&<PhotoViewer guide={photoViewing} machineType={machineType} onClose={()=>setPhotoViewing(null)}/>}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 14px",marginBottom:14}}>{PRESTART.map(c=>{const tk=machineType==="Haul Truck"?"truck":"loader";const hp=!!(PHOTO_GUIDES[tk]?.[c.id]);return <CkRow key={c.id} label={c.label} checked={!!checks[c.id]} onChange={()=>setChecks(p=>({...p,[c.id]:!p[c.id]}))} checkId={c.id} machineType={machineType} onPhoto={hp?id=>setPhotoViewing(id):null}/>;})}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Fuel level at start (%)<span style={{color:C.danger}}> *</span></div>
        <input type="number" placeholder="e.g. 78" value={fuel} onChange={e=>handleFuel(e.target.value)} style={{background:C.surface,color:C.text,border:`1px solid ${fuelErr?C.danger:fuelOk&&fuel?C.success:C.border}`,borderRadius:9,padding:"13px 14px",fontSize:16,width:"100%",outline:"none"}}/>
        {fuelErr&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>{fuelErr}</div>}
      </div>
      <button onClick={async()=>{if(!can)return;if(activeMine?.id&&activeShiftId&&user?.id){try{const{error}=await supabase.from("prestart_logs").insert({mine_id:activeMine.id,shift_id:activeShiftId,machine_id:machineId,operator_id:user.id,checks_passed:checks,fuel_level:parseInt(fuel)||null,signed_off_at:new Date().toISOString()});if(error)console.error("prestart insert error:",error);else console.log("prestart saved");}catch(e){console.error("prestart exception:",e);}}setShowGate(true);}} style={{width:"100%",background:can?C.success:C.border,color:can?"#000":C.muted,border:"none",borderRadius:12,padding:"16px",fontFamily:F,fontWeight:900,fontSize:18,cursor:can?"pointer":"default",transition:"background .2s"}}>
        {can?`✅  ${m?.model} SIGNED OFF`:"Complete all items + fuel level"}
      </button>
    </div>
  </div>;
}

function MachineSelectScreen({allMachines,catDemo,onComplete,isAdmin,onAddMachine,activeMine,activeShiftId,user}){
  if(!allMachines||allMachines.length===0){
    return <div style={{minHeight:"70vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:12,opacity:.7}}>🏗</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.text,marginBottom:6}}>No machines yet</div>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.5,marginBottom:20,maxWidth:280}}>
        {isAdmin?"Add your first machine to start pre-shift checks and production tracking.":"Your admin hasn't set up machines yet. Check back soon."}
      </div>
      {isAdmin&&<button onClick={onAddMachine} style={{background:C.accent,color:"#000",border:"none",borderRadius:12,padding:"14px 22px",fontFamily:F,fontWeight:900,fontSize:16,cursor:"pointer"}}>+ Add Machine</button>}
    </div>;
  }
  const[selected,setSelected]=useState([]);const[checking,setChecking]=useState(null);const[completed,setCompleted]=useState({});const[confirmed,setConfirmed]=useState(false);
  const allChecked=selected.length>0&&selected.every(id=>completed[id]);
  if(checking)return <SinglePreStart machineId={checking} catDemo={catDemo} allMachines={allMachines} activeMine={activeMine} activeShiftId={activeShiftId} user={user} onDone={d=>{setCompleted(p=>({...p,[d.machineId]:d}));setChecking(null);}}/>;
  return <div style={{minHeight:"100vh",background:C.bg,paddingBottom:20}} className="up">
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"16px 16px 14px"}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent}}>{confirmed?"PRE-START CHECKS":"MACHINES TODAY"}</div>
      <div style={{fontSize:12,color:C.muted,marginTop:3}}>{confirmed?`Tap each machine · ${Object.keys(completed).length}/${selected.length} done`:"Select all machines you'll operate this shift"}</div>
    </div>
    <div style={{padding:"14px 16px"}}>
      {allMachines.map(m=>{
        const cat=catDemo.find(x=>x.id===m.id)?.data,isSel=selected.includes(m.id),isDone=!!completed[m.id],sc=STATUS_COL[cat?.status]||C.muted,inMaint=cat?.status==="maintenance";
        if(confirmed&&!isSel)return null;
        return <div key={m.id} onClick={()=>{if(!confirmed&&!inMaint)setSelected(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id]);else if(confirmed&&isSel&&!isDone)setChecking(m.id);}}
          style={{background:isDone?`${C.success}10`:isSel?`${C.accent}08`:inMaint?`${C.danger}05`:C.card,border:`2px solid ${isDone?C.success:isSel?C.accent:inMaint?C.danger+"33":C.border}`,borderRadius:14,padding:"15px 16px",marginBottom:10,opacity:inMaint&&!confirmed?.6:1,cursor:(confirmed&&isDone)||inMaint?"default":"pointer",transition:"all .15s"}}>
          <div style={{display:"flex",alignItems:"center",gap:13}}>
            {!confirmed&&<div style={{width:26,height:26,borderRadius:7,background:inMaint?`${C.danger}20`:isSel?C.accent:"transparent",border:`2px solid ${inMaint?C.danger:isSel?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{inMaint?"🚫":isSel?"✓":""}</div>}
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{fontFamily:F,fontWeight:900,fontSize:19,textDecoration:inMaint?"line-through":"none",color:inMaint?C.muted:C.text}}>{m.model}</span><Pill label={cat?.status?.toUpperCase()||"NEW"} color={sc}/></div>
              <div style={{fontSize:11,color:C.muted}}>{m.type}{m.bucket?` · ${m.bucket}t bucket`:""}</div>
              {cat?.faults?.length>0&&<div style={{fontSize:11,color:inMaint?C.danger:C.amber,marginTop:3,fontFamily:F,fontWeight:700}}>{inMaint?"🚫 ":"⚠ "}{cat.faults[0].desc}</div>}
            </div>
            {confirmed&&isDone&&<span style={{fontSize:24,color:C.success}}>✅</span>}
            {confirmed&&!isDone&&<div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.accent}}>TAP →</div>}
          </div>
        </div>;
      })}
      {!confirmed&&<button onClick={()=>{if(selected.length>0)setConfirmed(true);}} style={{width:"100%",background:selected.length>0?C.accent:C.border,color:selected.length>0?"#000":C.muted,border:"none",borderRadius:12,padding:"17px",fontFamily:F,fontWeight:900,fontSize:20,cursor:selected.length>0?"pointer":"default",marginTop:8,transition:"background .2s"}}>{selected.length===0?"Select at least one machine":`CONFIRM ${selected.length} MACHINE${selected.length>1?"S":""} →`}</button>}
      {confirmed&&allChecked&&<button onClick={()=>onComplete({machineIds:selected,machineChecks:completed})} style={{width:"100%",background:C.success,color:"#000",border:"none",borderRadius:12,padding:"17px",fontFamily:F,fontWeight:900,fontSize:20,cursor:"pointer",marginTop:8}}>✅  START SHIFT →</button>}
      {confirmed&&!allChecked&&<div style={{background:`${C.amber}15`,border:`1px solid ${C.amber}44`,borderRadius:10,padding:"12px 14px",marginTop:8,textAlign:"center"}}><div style={{fontFamily:F,fontWeight:700,fontSize:14,color:C.amber}}>Complete pre-start on all machines to continue</div></div>}
    </div>
  </div>;
}

// ── Add Machine ───────────────────────────────────────────────────────────
function AddMachineScreen({onAdd,onBack}){
  const[model,setModel]=useState("");
  const[type,setType]=useState(MACHINE_TYPES[0]);
  const[bucket,setBucket]=useState("");
  const[serial,setSerial]=useState("");
  const[crusher,setCrusher]=useState("C1");
  const[done,setDone]=useState(false);
  const[addedMachine,setAddedMachine]=useState(null);
  const can=model.trim()&&serial.trim();
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  const sel={...inp,color:C.text};
  const lbl={fontSize:12,color:C.muted,marginBottom:6,display:"block"};

  const submit=()=>{
    if(!can)return;
    const id=`CUSTOM_${Date.now()}`;
    const newM={id,model:model.trim(),type,bucket:bucket?parseFloat(bucket):null,crusherAssigned:crusher==="None"?null:crusher,custom:true};
    const newCat={sn:serial.trim()||`CUSTOM-${Date.now()}`,smh:0,fuel:100,engineTemp:0,status:"standby",faults:[],utilToday:0};
    onAdd(newM,newCat);
    setAddedMachine(newM);
    setDone(true);
  };

  if(done)return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px",textAlign:"center"}} className="up">
      <div style={{fontSize:52,marginBottom:12}}>✅</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.success,marginBottom:8}}>{addedMachine?.model} Added</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24,lineHeight:1.6}}>Machine is now available in the fleet.<br/>Operators can select it at pre-start.</div>
      <button onClick={onBack} style={{background:C.accent,color:"#000",border:"none",borderRadius:12,padding:"14px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer"}}>← Back to Menu</button>
    </div>
  );

  return(
    <div style={{paddingBottom:30}}>
      <PageHdr title="Add Machine" sub="Add to fleet — available at next pre-start" back onBack={onBack}/>
      <div style={{padding:"16px 16px"}}>
        <label style={lbl}>Machine model <span style={{color:C.danger}}>*</span></label>
        <input value={model} onChange={e=>setModel(e.target.value)} placeholder="e.g. CAT 777F, Komatsu PC1250, Liebherr T 264" style={{...inp,marginBottom:14,border:`1px solid ${model?C.success:C.border}`}}/>

        <label style={lbl}>Machine type <span style={{color:C.danger}}>*</span></label>
        <select value={type} onChange={e=>setType(e.target.value)} style={{...sel,marginBottom:14}}>
          {["Wheel Loader","Excavator","Haul Truck","Dozer","Drill","Grader","Roller","Crusher","Screen","Water Cart","Service Truck","Light Vehicle"].map(t=><option key={t}>{t}</option>)}
        </select>

        <label style={lbl}>Bucket / blade size (yd³)</label>
        <input type="number" value={bucket} onChange={e=>setBucket(e.target.value)} placeholder="e.g. 8.5" style={{...inp,marginBottom:14}}/>

        <label style={lbl}>Serial number <span style={{color:C.danger}}>*</span></label>
        <input value={serial} onChange={e=>setSerial(e.target.value)} placeholder="e.g. KAT00777F0006" style={{...inp,marginBottom:14,border:`1px solid ${serial?C.success:C.border}`}}/>

        <label style={lbl}>Crusher assignment</label>
        <select value={crusher} onChange={e=>setCrusher(e.target.value)} style={{...sel,marginBottom:20}}>
          {OP.crushers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.capacityTph} t/hr</option>)}
          <option value="None">None — not feeding crusher</option>
        </select>

        <button onClick={submit} disabled={!can} style={{width:"100%",background:can?C.success:C.border,color:can?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:can?"pointer":"default",transition:"background .2s"}}>
          {can?"✅  ADD TO FLEET":"Enter model and serial number"}
        </button>
      </div>
    </div>
  );
}

// ── Live Board ─────────────────────────────────────────────────────────────
// Crusher cards: show each contributing machine + its t/hr and % of total
// Operator cards: t/hr for loaders/excavators | cycle time for trucks
function LiveBoard({remoteOperators,remoteMachines,activeMine}){
  // Real mine: use Supabase operators/machines. Demo: use hardcoded USERS/BASE_MACHINES.
  const isReal = !!activeMine?.id;
  const rawOps = isReal ? (remoteOperators||[]) : USERS.filter(u=>u.role==="operator");
  const rawMachines = isReal ? (remoteMachines||[]) : BASE_MACHINES;
  // Only show operators on production-affecting machines
  const PROD_TYPES = new Set(["Wheel Loader","Excavator","Haul Truck","Dozer","Drill","Grader","Loader"]);
  const getMachineFor = op => (rawMachines||[]).find(m=>m.id===(op.machine_id||op.machine));
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


// ── Machine Performance — weekly, machine-first, relative % ranking ─────────
function MachinePerformanceScreen({allMachines,custPerfData,activeMine,remoteOperators}){
  const[sel,setSel]=useState(null);
  const cycCol=v=>v<=19?C.success:v<=22?C.accent:C.danger;
  const tphCol=v=>v>=250?C.success:v>=150?C.accent:C.danger;
  if(sel){
    const m=allMachines.find(x=>x.id===sel),truck=isMachTruck(m?.type),crusher=OP.crushers.find(c=>c.id===m?.crusherAssigned);
    const raw=[...(MACHINE_PERF[sel]||[]),...(custPerfData[sel]||[])];
    const operators=raw.sort((a,b)=>truck?(a.cycleMin||99)-(b.cycleMin||99):b.tph-a.tph);
    return <div style={{paddingBottom:20}} className="sr">
      <PageHdr title={m?.model||sel} sub={`${m?.type}${m?.bucket?` · ${m.bucket}t bucket`:m?.payload?` · ${m.payload}t payload`:""}${crusher?` · ${crusher.name} ${crusher.capacityTph} t/hr cap`:""} · This week`} back onBack={()=>setSel(null)}/>
      <div style={{padding:"12px 15px"}}>
        {operators.length===0?<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:44,marginBottom:10}}>📊</div><div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.muted}}>No data this week</div></div>
        :operators.map((op,i)=>{
          const next=operators[i+1],pv=truck?op.cycleMin:op.tph,nv=next?(truck?next.cycleMin:next.tph):null;
          const diff=nv!=null?(truck?Math.round(((nv-pv)/nv)*100):Math.round(((pv-nv)/nv)*100)):null;
          const pc=truck?cycCol(op.cycleMin):tphCol(op.tph),isTop=i===0;
          return <div key={i} style={{background:isTop?`${C.accent}08`:C.card,border:`1.5px solid ${isTop?C.accent+"55":C.border}`,borderRadius:14,padding:"14px 15px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:22,width:28,textAlign:"center",color:isTop?C.accent:C.muted}}>#{i+1}</div>
              <div style={{width:40,height:40,borderRadius:"50%",background:`${pc}22`,border:`2px solid ${pc}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:14,color:pc,flexShrink:0}}>{op.avatar}</div>
              <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:17}}>{op.name}</div><div style={{fontSize:11,color:C.muted}}>{op.shifts} shift{op.shifts!==1?"s":""} this week{op.fault?" · ⚠ fault":""}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:F,fontWeight:900,fontSize:28,color:pc,lineHeight:1}}>{pv}</div><div style={{fontSize:10,color:C.muted}}>{truck?"min/cycle":"t/hr avg"}</div></div>
            </div>
            {diff!=null&&<div style={{background:`${diff>=5?C.success:diff>=0?C.accent:C.danger}15`,border:`1px solid ${diff>=5?C.success:diff>=0?C.accent:C.danger}30`,borderRadius:8,padding:"7px 12px",marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:F,fontWeight:700,fontSize:13,color:diff>=5?C.success:diff>=0?C.accent:C.danger}}>{diff>0?(truck?`${diff}% faster cycle than #${i+2}`:`+${diff}% more t/hr than #${i+2}`):`Same as #${i+2}`}</span>
              <span style={{fontSize:11,color:C.muted}}>{truck?`#${i+2}: ${nv} min`:`#${i+2}: ${nv} t/hr`}</span>
            </div>}
            {diff===null&&<div style={{background:`${C.muted}10`,borderRadius:8,padding:"7px 12px",marginBottom:9}}><span style={{fontSize:12,color:C.muted}}>{operators.length===1?"Only operator this week":"Last ranked this week"}</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
              {(truck?[{l:"Trips/hr",v:op.tripsHr,c:op.tripsHr>=3?C.success:C.amber},{l:"Payload",v:`${op.payloadT}t`,c:C.info},{l:"Weekly t",v:op.weeklyTons>=1000?`${(op.weeklyTons/1000).toFixed(1)}kt`:`${op.weeklyTons}t`,c:C.success},{l:"Hrs",v:`${op.weeklyHrs}h`,c:C.muted}]:[{l:"Cycle",v:`${op.cycleMin}min`,c:op.cycleMin<=2.5?C.success:op.cycleMin<=5?C.amber:C.danger},{l:"t/Bucket",v:`${op.avgBucketT}t`,c:C.info},{l:"Weekly t",v:op.weeklyTons>=1000?`${(op.weeklyTons/1000).toFixed(1)}kt`:`${op.weeklyTons}t`,c:C.success},{l:"Hrs",v:`${op.weeklyHrs}h`,c:C.muted}]).map(x=><div key={x.l} style={{background:C.surface,borderRadius:8,padding:"8px 7px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{x.l}</div><div style={{fontFamily:F,fontWeight:900,fontSize:14,color:x.c,lineHeight:1.2}}>{x.v}</div></div>)}
            </div>
          </div>;
        })}
      </div>
    </div>;
  }
  const machineRows=allMachines.map(m=>{
    const truck=isMachTruck(m.type);
    const raw=[...(MACHINE_PERF[m.id]||[]),...(custPerfData[m.id]||[])];
    const ops=raw.sort((a,b)=>truck?(a.cycleMin||99)-(b.cycleMin||99):b.tph-a.tph);
    return{m,truck,ops};
  });
  const withData=machineRows.filter(r=>r.ops.length>0);
  const withoutData=machineRows.filter(r=>r.ops.length===0);

  return <div style={{paddingBottom:80}} className="up">
    <PageHdr title="Team" sub="Today's operator rankings · weekly machine averages"/>
    <div style={{padding:"12px 15px"}}>
      <TodayLeaderboard activeMine={activeMine} remoteOperators={remoteOperators}/>
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 6px",marginTop:6}}>Machines · this week</div>
      {/* Empty: no machines on this mine yet */}
      {allMachines.length===0&&<div style={{textAlign:"center",padding:"56px 22px"}}>
        <div style={{fontSize:46,marginBottom:10,opacity:.6}}>⛏️</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>No machines yet</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Add a machine from the menu (☰ → Add Machine) and operators will appear here after their first shift.</div>
      </div>}

      {/* Empty: machines exist but nobody has logged a shift */}
      {allMachines.length>0&&withData.length===0&&<div style={{textAlign:"center",padding:"56px 22px"}}>
        <div style={{fontSize:46,marginBottom:10,opacity:.6}}>📊</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>No shifts logged yet</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Performance rankings appear once operators end their first shift and record tonnage.</div>
        <div style={{fontSize:11,color:C.muted,marginTop:14,opacity:.7}}>{allMachines.length} machine{allMachines.length!==1?"s":""} ready</div>
      </div>}

      {/* Machines with data — full ranking cards */}
      {withData.map(({m,truck,ops})=>{
        const crusher=OP.crushers.find(c=>c.id===m.crusherAssigned);
        const cat=CAT_DEMO[m.id],sc=STATUS_COL[cat?.status]||C.info;
        const topOp=ops[0],secOp=ops[1];
        const topVal=truck?topOp.cycleMin:topOp.tph;
        const secVal=secOp?(truck?secOp.cycleMin:secOp.tph):null;
        const gap=secVal!=null?(truck?Math.round(((secVal-topVal)/secVal)*100):Math.round(((topVal-secVal)/secVal)*100)):null;
        const topC=truck?(topOp.cycleMin<=19?C.success:topOp.cycleMin<=22?C.accent:C.danger):(topOp.tph>=250?C.success:topOp.tph>=150?C.accent:C.danger);
        return <div key={m.id} onClick={()=>setSel(m.id)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",marginBottom:8,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:17,marginBottom:1}}>{m.model}</div>
              <div style={{fontSize:10,color:C.muted}}>{m.type}{m.bucket?` · ${m.bucket}t`:m.payload?` · ${m.payload}t payload`:""}{crusher?` · ${crusher.name}`:""}</div>
            </div>
            {cat?.status&&<Pill label={cat.status.toUpperCase()} color={sc}/>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:9,background:C.surface,borderRadius:10,padding:"8px 11px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`${topC}22`,border:`2px solid ${topC}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:10,color:topC,flexShrink:0}}>{topOp.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{topOp.name}</div>
              <div style={{fontSize:10,color:C.muted}}>#1 · {ops.length} op{ops.length!==1?"s":""} ranked{gap!=null&&gap>0?` · ${truck?`${gap}% faster`:`+${gap}%`} vs #2`:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:topC,lineHeight:1}}>{topVal}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:1}}>{truck?"min/cycle":"t/hr"}</div>
            </div>
          </div>
        </div>;
      })}

      {/* Quiet footer for machines without data when SOME data exists */}
      {withData.length>0&&withoutData.length>0&&<div style={{marginTop:14,padding:"8px 12px",background:C.surface,border:`1px dashed ${C.border}`,borderRadius:9,fontSize:11,color:C.muted,textAlign:"center"}}>
        {withoutData.length} other machine{withoutData.length!==1?"s":""} · no shifts this week ({withoutData.map(r=>r.m.model).slice(0,3).join(", ")}{withoutData.length>3?"…":""})
      </div>}
    </div>
  </div>;
}

// ── Production Monitoring ─────────────────────────────────────────────────
// End-of-shift tonnage model. Operators enter (or confirm VL-prefilled)
// daily tonnage once per shift; daily bars come from daily_production.
// Cycle-time line chart still draws from scoop_logs but only when VisionLink
// populates it — humans never write scoop_logs.

const SERIES_COLORS=[C.accent,C.success,C.info,C.purple,C.amber,"#ec4899","#22d3ee","#f97316"];

// Local YYYY-MM-DD (don't use toISOString — that's UTC and rolls the day).
function _ymd(d){
  const dt=d instanceof Date?d:new Date(d);
  const y=dt.getFullYear(),m=String(dt.getMonth()+1).padStart(2,"0"),day=String(dt.getDate()).padStart(2,"0");
  return`${y}-${m}-${day}`;
}
function _today(){return _ymd(new Date());}
function _addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function _rangeDates(days){
  const today=new Date();today.setHours(0,0,0,0);
  const out=[];
  for(let i=days-1;i>=0;i--)out.push(_ymd(_addDays(today,-i)));
  return out;
}
function _hmToToday(hm){
  const[h,m]=hm.split(":").map(Number);
  const d=new Date();d.setHours(h,m,0,0);
  return d.getTime();
}

// Stock-chart style line chart. series: [{id,name,color,points:[{t,v}]}]
function LineChart({series,height=150,yLabel,title,yMin=0,yMax}){
  const wrapRef=useRef(null);
  const[w,setW]=useState(360);
  const[hover,setHover]=useState(null);
  useEffect(()=>{
    if(!wrapRef.current)return;
    const ro=new ResizeObserver(entries=>{
      const cr=entries[0]?.contentRect;
      if(cr)setW(Math.max(220,Math.floor(cr.width)));
    });
    ro.observe(wrapRef.current);
    return()=>ro.disconnect();
  },[]);
  const PAD={l:34,r:10,t:8,b:22};
  const innerW=w-PAD.l-PAD.r;
  const innerH=height-PAD.t-PAD.b;
  const all=series.flatMap(s=>s.points||[]);
  if(all.length===0){
    return<div ref={wrapRef} style={{width:"100%",height,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",textAlign:"center",padding:"0 18px",lineHeight:1.5}}>{title||yLabel} · no data yet</div>
    </div>;
  }
  const tMin=Math.min(...all.map(p=>p.t));
  const tMax=Math.max(...all.map(p=>p.t));
  const tSpan=Math.max(tMax-tMin,60000);
  const vMaxRaw=yMax??Math.max(...all.map(p=>p.v));
  const vMin=yMin;
  const vMax=Math.max(vMaxRaw*1.1,vMin+0.1);
  const sx=t=>PAD.l+((t-tMin)/tSpan)*innerW;
  const sy=v=>PAD.t+(1-(v-vMin)/(vMax-vMin))*innerH;
  const fmtTime=t=>{const d=new Date(t);return`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;};
  const fmtVal=v=>v>=100?Math.round(v).toString():v.toFixed(1);
  const xTicks=tSpan>120000?[tMin,tMin+tSpan/2,tMax]:[tMin,tMax];
  const yTicks=[vMin,(vMin+vMax)/2,vMax];
  return<div ref={wrapRef} style={{position:"relative",width:"100%",marginBottom:8}}>
    {title&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"0 4px 4px"}}>
      <div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>{title}</div>
      {yLabel&&<div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em"}}>{yLabel}</div>}
    </div>}
    <svg width={w} height={height} style={{display:"block",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10}}>
      {yTicks.map((v,i)=><g key={`y${i}`}>
        <line x1={PAD.l} x2={w-PAD.r} y1={sy(v)} y2={sy(v)} stroke={C.border} strokeWidth={0.5} opacity={0.6}/>
        <text x={PAD.l-4} y={sy(v)+3} textAnchor="end" style={{fontSize:9,fill:C.muted,fontFamily:F}}>{fmtVal(v)}</text>
      </g>)}
      {xTicks.map((t,i)=><text key={`x${i}`} x={sx(t)} y={height-6} textAnchor={i===0?"start":i===xTicks.length-1?"end":"middle"} style={{fontSize:9,fill:C.muted,fontFamily:F}}>{fmtTime(t)}</text>)}
      {series.map(s=>{
        const pts=(s.points||[]).filter(p=>p.v!=null).sort((a,b)=>a.t-b.t);
        if(pts.length===0)return null;
        const d=pts.map((p,i)=>`${i===0?"M":"L"} ${sx(p.t)} ${sy(p.v)}`).join(" ");
        const last=pts[pts.length-1];
        return<g key={s.id}>
          <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.95}/>
          {pts.map((p,i)=><circle key={i} cx={sx(p.t)} cy={sy(p.v)} r={2.5} fill={s.color}
            onMouseEnter={()=>setHover({x:sx(p.t),y:sy(p.v),v:p.v,name:s.name,t:p.t,color:s.color,kind:"line"})}
            onMouseLeave={()=>setHover(null)}
            onTouchStart={()=>setHover({x:sx(p.t),y:sy(p.v),v:p.v,name:s.name,t:p.t,color:s.color,kind:"line"})}
            style={{cursor:"pointer"}}
          />)}
          <circle cx={sx(last.t)} cy={sy(last.v)} r={4.5} fill={s.color} opacity={0.35}/>
          <circle cx={sx(last.t)} cy={sy(last.v)} r={3} fill={s.color}/>
        </g>;
      })}
    </svg>
    {hover&&<div style={{position:"absolute",left:Math.min(hover.x+10,w-140),top:Math.max(hover.y-30,0),background:C.bg,border:`1px solid ${hover.color}66`,borderRadius:7,padding:"5px 9px",fontSize:10,fontFamily:F,fontWeight:700,color:C.text,pointerEvents:"none",whiteSpace:"nowrap",zIndex:5,boxShadow:"0 4px 16px rgba(0,0,0,.4)"}}>
      <div style={{color:hover.color,marginBottom:1}}>{hover.name}</div>
      <div>{fmtVal(hover.v)}{yLabel?` ${yLabel}`:""} · {fmtTime(hover.t)}</div>
    </div>}
  </div>;
}

// Stacked vertical bar chart.
// days: ["YYYY-MM-DD", ...] sorted ascending
// series: [{id, name, color, data: {date → number}}]
function BarChart({days,series,height=170,yLabel,title,emptyMessage="No data yet"}){
  const wrapRef=useRef(null);
  const[w,setW]=useState(360);
  const[hover,setHover]=useState(null);
  useEffect(()=>{
    if(!wrapRef.current)return;
    const ro=new ResizeObserver(entries=>{
      const cr=entries[0]?.contentRect;
      if(cr)setW(Math.max(220,Math.floor(cr.width)));
    });
    ro.observe(wrapRef.current);
    return()=>ro.disconnect();
  },[]);
  const PAD={l:34,r:10,t:8,b:24};
  const innerW=w-PAD.l-PAD.r;
  const innerH=height-PAD.t-PAD.b;
  const dayTotals=days.map(d=>series.reduce((a,s)=>a+(s.data?.[d]||0),0));
  const anyData=dayTotals.some(v=>v>0);
  if(!anyData){
    return<div ref={wrapRef} style={{width:"100%",height,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",textAlign:"center",padding:"0 18px",lineHeight:1.5}}>{title||yLabel} · {emptyMessage}</div>
    </div>;
  }
  const vMax=Math.max(...dayTotals)*1.15||1;
  const barGap=days.length<=14?3:days.length<=21?2:1;
  const bandW=innerW/days.length;
  const barW=Math.max(2,bandW-barGap);
  const sy=v=>PAD.t+(1-v/vMax)*innerH;
  const fmtVal=v=>v>=1000?`${(v/1000).toFixed(1)}k`:v>=100?Math.round(v).toString():v.toFixed(1);
  const fmtDay=d=>{const dt=new Date(d+"T00:00");return`${dt.getMonth()+1}/${dt.getDate()}`;};
  const labelStep=Math.max(1,Math.ceil(days.length/5));
  const yTicks=[0,vMax/2,vMax];
  return<div ref={wrapRef} style={{position:"relative",width:"100%",marginBottom:8}}>
    {title&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"0 4px 4px"}}>
      <div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>{title}</div>
      {yLabel&&<div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em"}}>{yLabel}</div>}
    </div>}
    <svg width={w} height={height} style={{display:"block",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10}}>
      {yTicks.map((v,i)=><g key={`y${i}`}>
        <line x1={PAD.l} x2={w-PAD.r} y1={sy(v)} y2={sy(v)} stroke={C.border} strokeWidth={0.5} opacity={0.6}/>
        <text x={PAD.l-4} y={sy(v)+3} textAnchor="end" style={{fontSize:9,fill:C.muted,fontFamily:F}}>{fmtVal(v)}</text>
      </g>)}
      {days.map((d,i)=>{
        const x=PAD.l+i*bandW+(bandW-barW)/2;
        let yCursor=sy(0);
        const segs=series.map(s=>{
          const v=s.data?.[d]||0;
          if(v<=0)return null;
          const h=sy(0)-sy(v);
          yCursor-=h;
          return{color:s.color,name:s.name,v,y:yCursor,h};
        }).filter(Boolean);
        const total=dayTotals[i];
        return<g key={d}>
          {segs.map((seg,si)=><rect key={si} x={x} y={seg.y} width={barW} height={seg.h} fill={seg.color} opacity={0.92}
            onMouseEnter={()=>setHover({x:x+barW/2,y:sy(total),d,total,segs,color:seg.color})}
            onMouseLeave={()=>setHover(null)}
            onTouchStart={()=>setHover({x:x+barW/2,y:sy(total),d,total,segs,color:seg.color})}
            style={{cursor:"pointer"}}
          />)}
          {(i%labelStep===0||i===days.length-1)&&<text x={x+barW/2} y={height-8} textAnchor="middle" style={{fontSize:9,fill:C.muted,fontFamily:F}}>{fmtDay(d)}</text>}
        </g>;
      })}
    </svg>
    {hover&&<div style={{position:"absolute",left:Math.min(Math.max(hover.x-80,4),w-170),top:Math.max(hover.y-Math.min(38+hover.segs.length*12,80),0),background:C.bg,border:`1px solid ${hover.color}66`,borderRadius:7,padding:"6px 10px",fontSize:11,fontFamily:F,fontWeight:700,color:C.text,pointerEvents:"none",whiteSpace:"nowrap",zIndex:5,boxShadow:"0 4px 16px rgba(0,0,0,.4)",minWidth:140}}>
      <div style={{color:C.muted,fontSize:9,letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>{fmtDay(hover.d)}</div>
      <div style={{color:C.text,fontSize:14,marginBottom:hover.segs.length>1?4:0}}>{fmtVal(hover.total)}{yLabel?` ${yLabel}`:""}</div>
      {hover.segs.length>1&&hover.segs.slice().reverse().map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,marginTop:2}}>
        <span style={{width:8,height:8,borderRadius:2,background:s.color}}/><span style={{color:C.textSub}}>{s.name}</span><span style={{marginLeft:"auto",color:C.text}}>{fmtVal(s.v)}</span>
      </div>)}
    </div>}
  </div>;
}

// Hook: load daily_production over a date range.
//   Operator scope (lv===1): own rows
//   Supervisor / manager scope: all rows for the mine
// Demo mode (no real mine) synthesises plausible daily history per operator.
function useDailyProduction({activeMine,role,userId,rangeDays,remoteOperators,refreshTick}){
  const[byOperator,setByOperator]=useState(()=>new Map());
  const[lastSync,setLastSync]=useState(null);
  const lv=ROLES[role]?.level||1;
  const opsLen=(remoteOperators||[]).length;

  useEffect(()=>{
    if(!activeMine?.id){
      const m=new Map();
      const targetUsers=lv===1
        ?USERS.filter(u=>u.id===userId&&u.role==="operator")
        :USERS.filter(u=>u.role==="operator"&&LIVE_OPS[u.id]);
      for(const u of targetUsers){
        const liveTph=LIVE_OPS[u.id]?.tph||120;
        const baseDaily=Math.round(liveTph*8.5);
        const days={};
        for(const d of _rangeDates(rangeDays)){
          const variance=0.78+Math.random()*0.32;
          days[d]=Math.round(baseDaily*variance);
        }
        m.set(u.id,{operatorId:u.id,name:u.name,machineId:u.machine,days});
      }
      setByOperator(m);setLastSync(Date.now());
      return;
    }
    let cancelled=false;
    (async()=>{
      try{
        const fromDate=_addDays(new Date(),-(rangeDays-1));fromDate.setHours(0,0,0,0);
        let q=supabase.from("daily_production")
          .select("operator_id,machine_id,date,tonnage,source")
          .eq("mine_id",activeMine.id)
          .gte("date",_ymd(fromDate))
          .order("date",{ascending:true});
        if(lv===1&&userId)q=q.eq("operator_id",userId);
        const{data,error}=await q;
        if(error)throw error;
        const opNameById=new Map((remoteOperators||[]).map(o=>[o.id,o.name]));
        const result=new Map();
        for(const row of data||[]){
          const opId=row.operator_id;
          if(!result.has(opId))result.set(opId,{operatorId:opId,name:opNameById.get(opId)||"Operator",machineId:row.machine_id,days:{}});
          const slot=result.get(opId);
          slot.days[row.date]=(slot.days[row.date]||0)+Number(row.tonnage);
          if(!slot.machineId)slot.machineId=row.machine_id;
        }
        if(!cancelled){setByOperator(result);setLastSync(Date.now());}
      }catch(e){console.error("useDailyProduction:",e);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,role,userId,lv,rangeDays,opsLen,refreshTick]);

  return{byOperator,lastSync,demoMode:!activeMine?.id};
}

// Hook: cycle-time telemetry from scoop_logs (VL-populated only).
function useCycleTelemetry({activeMine,role,userId,remoteOperators}){
  const[byOperator,setByOperator]=useState(()=>new Map());
  const[lastSync,setLastSync]=useState(null);
  const lv=ROLES[role]?.level||1;
  const opsLen=(remoteOperators||[]).length;

  useEffect(()=>{
    if(!activeMine?.id){
      const m=new Map();
      const targetUsers=lv===1
        ?USERS.filter(u=>u.id===userId&&u.role==="operator")
        :USERS.filter(u=>u.role==="operator"&&LIVE_OPS[u.id]);
      for(const u of targetUsers){
        const cyc=LIVE_OPS[u.id]?.cycleMin||3;
        const pts=[];
        for(const row of SHIFT_TIMELINE){
          if(row.idle||!row[u.id])continue;
          pts.push({t:_hmToToday(row.t),cycle:+(cyc+(Math.random()-0.5)*0.3).toFixed(2)});
        }
        m.set(u.id,{operatorId:u.id,name:u.name,points:pts});
      }
      setByOperator(m);setLastSync(Date.now());
      return;
    }
    let cancelled=false;
    const fetchCycles=async()=>{
      try{
        const startOfToday=new Date();startOfToday.setHours(0,0,0,0);
        let sQuery=supabase.from("shifts")
          .select("id,operator_id")
          .eq("mine_id",activeMine.id)
          .gte("shift_start",startOfToday.toISOString());
        if(lv===1&&userId)sQuery=sQuery.eq("operator_id",userId);
        const{data:shifts,error:sErr}=await sQuery;
        if(sErr)throw sErr;
        const shiftIds=(shifts||[]).map(s=>s.id);
        const shiftToOp=new Map((shifts||[]).map(s=>[s.id,s.operator_id]));
        if(shiftIds.length===0){if(!cancelled){setByOperator(new Map());setLastSync(Date.now());}return;}
        const{data:logs,error:lErr}=await supabase.from("scoop_logs")
          .select("shift_id,cycle_time_min,logged_at")
          .in("shift_id",shiftIds)
          .not("cycle_time_min","is",null)
          .order("logged_at",{ascending:true});
        if(lErr)throw lErr;
        const opNameById=new Map((remoteOperators||[]).map(o=>[o.id,o.name]));
        const result=new Map();
        for(const log of logs||[]){
          const opId=shiftToOp.get(log.shift_id);if(!opId)continue;
          if(!result.has(opId))result.set(opId,{operatorId:opId,name:opNameById.get(opId)||"Operator",points:[]});
          result.get(opId).points.push({t:new Date(log.logged_at).getTime(),cycle:Number(log.cycle_time_min)});
        }
        if(!cancelled){setByOperator(result);setLastSync(Date.now());}
      }catch(e){console.error("useCycleTelemetry:",e);}
    };
    fetchCycles();
    const iv=setInterval(fetchCycles,30000);
    return()=>{cancelled=true;clearInterval(iv);};
  },[activeMine?.id,role,userId,lv,opsLen]);

  return{byOperator,lastSync};
}

// ── End Shift Modal ───────────────────────────────────────────────────────
function EndShiftModal({user,activeMine,activeShiftId,machine,bucketT,onClose,onEnded}){
  const vlConnected=!!machine?.vl_connected;
  const[tonnage,setTonnage]=useState("");
  const[notes,setNotes]=useState("");
  const[prefilled,setPrefilled]=useState(null);
  const[submitting,setSubmitting]=useState(false);
  const[err,setErr]=useState("");
  const[done,setDone]=useState(false);

  useEffect(()=>{
    if(!vlConnected||!activeMine?.id||!activeShiftId)return;
    let cancelled=false;
    (async()=>{
      try{
        const{data,error}=await supabase.from("scoop_logs").select("tonnes").eq("shift_id",activeShiftId);
        if(error)throw error;
        const sum=(data||[]).reduce((a,r)=>a+Number(r.tonnes||0),0);
        if(cancelled)return;
        if(sum>0){const rounded=Math.round(sum);setPrefilled(rounded);setTonnage(String(rounded));}
      }catch(e){console.error("VL prefill:",e);}
    })();
    return()=>{cancelled=true;};
  },[vlConnected,activeMine?.id,activeShiftId]);

  const tonNum=parseFloat(tonnage);
  const valid=!Number.isNaN(tonNum)&&tonNum>=0&&tonNum<=100000;

  const submit=async()=>{
    if(!valid||submitting)return;
    setSubmitting(true);setErr("");
    const mid=machine?.id||user?.machine;
    try{
      if(!activeMine?.id||!user?.id||!mid){
        setDone(true);setSubmitting(false);
        setTimeout(()=>{onEnded&&onEnded();onClose&&onClose();},900);
        return;
      }
      const source=prefilled!=null&&tonNum===prefilled?"visionlink":"manual";
      const{error:dpErr}=await supabase.from("daily_production").upsert({
        mine_id:activeMine.id,
        machine_id:mid,
        operator_id:user.id,
        shift_id:activeShiftId||null,
        date:_today(),
        tonnage:tonNum,
        source,
        notes:notes.trim()||null,
      },{onConflict:"shift_id"});
      if(dpErr)throw dpErr;
      if(activeShiftId){
        const{error:sErr}=await supabase.from("shifts").update({status:"completed",shift_end:new Date().toISOString()}).eq("id",activeShiftId);
        if(sErr)console.warn("shift complete:",sErr);
      }
      setDone(true);setSubmitting(false);
      setTimeout(()=>{onEnded&&onEnded();onClose&&onClose();},900);
    }catch(e){console.error("end shift:",e);setErr(e.message||"Could not save");setSubmitting(false);}
  };

  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:400,display:"flex",alignItems:"flex-end"}}>
    <div style={{background:C.surface,borderTop:`3px solid ${C.accent}`,borderRadius:"18px 18px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:420,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.accent}}>END SHIFT</div>
        <div style={{fontSize:12,color:C.muted,marginTop:3}}>{machine?.model||"—"} · {bucketT}t bucket</div>
      </div>

      {done?<div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{fontSize:46,marginBottom:8}}>✅</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.success}}>Shift signed off</div>
        <div style={{fontSize:12,color:C.muted,marginTop:4}}>{tonNum.toLocaleString()} t recorded for today</div>
      </div>:<>
        {vlConnected&&prefilled!=null&&<div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
          <div style={{fontSize:10,color:C.success,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>● VisionLink prefill</div>
          <div style={{fontSize:12,color:C.textSub,lineHeight:1.5}}>VisionLink reported <b style={{color:C.text}}>{prefilled.toLocaleString()} t</b> today. Confirm or override below.</div>
        </div>}
        {vlConnected&&prefilled===null&&<div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
          <div style={{fontSize:11,color:C.amber,fontFamily:F,fontWeight:700}}>VisionLink had no production data for this shift — enter manually</div>
        </div>}

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>Tonnage today <span style={{color:C.danger}}>*</span></div>
          <div style={{position:"relative"}}>
            <input type="number" inputMode="decimal" min="0" step="1" value={tonnage} onChange={e=>setTonnage(e.target.value)}
              placeholder="e.g. 1450"
              style={{background:C.card,color:C.text,border:`2px solid ${valid?C.success:tonnage?C.danger:C.border}`,borderRadius:10,padding:"14px 50px 14px 16px",fontSize:22,fontFamily:F,fontWeight:900,width:"100%",outline:"none",boxSizing:"border-box"}}/>
            <div style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted,fontFamily:F,fontWeight:700,pointerEvents:"none"}}>t</div>
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>Notes <span style={{color:C.muted,fontWeight:400}}>· optional</span></div>
          <textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="e.g. lost 30 min to rock jam, fuel topped at 11:00"
            style={{background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>

        {err&&<div style={{fontSize:12,color:C.danger,marginBottom:10}}>{err}</div>}

        <button onClick={submit} disabled={!valid||submitting}
          style={{width:"100%",background:valid&&!submitting?`linear-gradient(135deg,${C.accent},#e09520)`:C.border,color:valid&&!submitting?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,letterSpacing:".04em",cursor:valid&&!submitting?"pointer":"default",marginBottom:6}}>
          {submitting?"Saving…":valid?"✅ SIGN OFF SHIFT":"Enter tonnage to continue"}
        </button>
        <button onClick={onClose} disabled={submitting} style={{width:"100%",background:"transparent",border:"none",color:C.muted,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,cursor:submitting?"default":"pointer"}}>Cancel</button>
      </>}
    </div>
  </div>;
}

// ── Production Screen ─────────────────────────────────────────────────────
function ProductionScreen({user,activeMine,activeShiftId,machineId,role,allMachines,remoteOperators,onShiftEnded}){
  const lv=ROLES[role]?.level||1;
  const isOperator=lv===1;
  const remoteMachine=(allMachines||[]).find(m=>m.id===machineId);
  const demoMachine=BASE_MACHINES.find(m=>m.id===(machineId||user?.machine));
  const machine=remoteMachine||demoMachine;
  const crusher=OP.crushers.find(c=>c.id===(machine?.crusher_assigned||machine?.crusherAssigned||user?.crusherAssigned));
  const bucketT=machine?.bucket_size??machine?.bucket??machine?.payload??7.5;
  const vlConnected=!!machine?.vl_connected;

  const[tab,setTab]=useState("prod");
  const[rangeDays,setRangeDays]=useState(14);
  const[filterOp,setFilterOp]=useState(null);
  const[endModalOpen,setEndModalOpen]=useState(false);
  const[refreshTick,setRefreshTick]=useState(0);
  const[events,setEvents]=useState([]);
  const[idleVis,setIdleVis]=useState(false);
  const[idleMins,setIdleMins]=useState(0);
  const[simOn,setSimOn]=useState(false);
  const[idleNote,setIdleNote]=useState("");
  const idleRef=useRef(null);
  useEffect(()=>()=>clearInterval(idleRef.current),[]);

  const{byOperator,lastSync,demoMode}=useDailyProduction({
    activeMine,role,userId:user?.id,rangeDays,remoteOperators,refreshTick,
  });
  const{byOperator:cycleByOp}=useCycleTelemetry({
    activeMine,role,userId:user?.id,remoteOperators,
  });

  const opsArr=[...byOperator.values()];
  const days=useMemo(()=>_rangeDates(rangeDays),[rangeDays]);
  const visibleOps=isOperator
    ?opsArr.filter(o=>o.operatorId===user?.id)
    :(filterOp?opsArr.filter(o=>o.operatorId===filterOp):opsArr);
  const tonnageSeries=visibleOps.map(o=>({
    id:o.operatorId,
    name:o.name,
    color:isOperator?C.accent:SERIES_COLORS[opsArr.indexOf(o)%SERIES_COLORS.length],
    data:o.days||{},
  }));

  const cycleOps=isOperator
    ?[...cycleByOp.values()].filter(o=>o.operatorId===user?.id)
    :[...cycleByOp.values()].filter(o=>!filterOp||o.operatorId===filterOp);
  const cycleSeries=cycleOps.map(o=>{
    const matched=opsArr.find(x=>x.operatorId===o.operatorId);
    const idx=matched?opsArr.indexOf(matched):0;
    return{
      id:`${o.operatorId}-c`,
      name:o.name,
      color:isOperator?C.info:SERIES_COLORS[idx%SERIES_COLORS.length],
      points:(o.points||[]).map(p=>({t:p.t,v:p.cycle})),
    };
  });

  const today=_today();
  const myToday=byOperator.get(user?.id)?.days?.[today]||0;
  const myDays=byOperator.get(user?.id)?.days||{};
  const myRangeTotal=Object.values(myDays).reduce((a,v)=>a+v,0);
  const myDaysWithData=Object.values(myDays).filter(v=>v>0).length;
  const myAvg=myDaysWithData?Math.round(myRangeTotal/myDaysWithData):0;

  const mineToday=opsArr.reduce((a,o)=>a+(o.days?.[today]||0),0);
  const mineRangeTotal=opsArr.reduce((a,o)=>a+Object.values(o.days||{}).reduce((b,v)=>b+v,0),0);
  const todayOps=opsArr.filter(o=>(o.days?.[today]||0)>0).length;
  const hasOwnEntryToday=!!byOperator.get(user?.id)?.days?.[today];

  const subtabs=isOperator
    ?[["prod","📈","Production"],["log","📋","Downtime"],["blast","💥","Blast"]]
    :[["prod","📈","Production"],["blast","💥","Blast"]];
  const tb=([t,ic,lb])=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",background:"none",border:"none",color:tab===t?C.accent:C.muted,fontFamily:F,fontWeight:700,fontSize:9,borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,cursor:"pointer"}}><span style={{fontSize:13}}>{ic}</span>{" "}{lb}</button>;
  const lastSyncLabel=lastSync?new Date(lastSync).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false}):"—";

  const startIdle=()=>{if(simOn)return;setSimOn(true);let m=0;idleRef.current=setInterval(()=>{m++;setIdleMins(m);if(m>=OP.idleAlertMins){setIdleVis(true);clearInterval(idleRef.current);}},400);};
  const logReason=async cat=>{const now=new Date();const durMin=+idleMins;const dc=DT_CATS[cat];setEvents(p=>[...p,{cat,hrs:+(idleMins/60).toFixed(2),time:`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,note:idleNote}]);const mid=machineId||user?.machine;if(activeMine?.id&&activeShiftId&&mid){try{const{error}=await supabase.from("downtime_logs").insert({mine_id:activeMine.id,shift_id:activeShiftId,machine_id:mid,category:cat,duration_min:durMin,note:idleNote||null,is_operator_fault:!!(dc&&dc.fault),flagged_for_supervisor:false,logged_at:new Date().toISOString()});if(error)console.error("downtime insert:",error);}catch(e){console.error("downtime exception:",e);}}setIdleVis(false);setSimOn(false);setIdleMins(0);setIdleNote("");clearInterval(idleRef.current);};
  const flagLater=async()=>{const now=new Date();const durMin=+idleMins;setEvents(p=>[...p,{cat:"other",hrs:+(idleMins/60).toFixed(2),time:`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,note:"⚠ Reason not recorded — flagged for supervisor",flagged:true}]);const mid=machineId||user?.machine;if(activeMine?.id&&activeShiftId&&mid){try{const{error}=await supabase.from("downtime_logs").insert({mine_id:activeMine.id,shift_id:activeShiftId,machine_id:mid,category:"other",duration_min:durMin,note:"Reason not recorded — flagged for supervisor",is_operator_fault:false,flagged_for_supervisor:true,logged_at:new Date().toISOString()});if(error)console.error("downtime flag insert:",error);}catch(e){console.error("downtime flag exception:",e);}}setIdleVis(false);setSimOn(false);setIdleMins(0);clearInterval(idleRef.current);};

  return<div style={{paddingBottom:80}} className="up">
    {endModalOpen&&<EndShiftModal user={user} activeMine={activeMine} activeShiftId={activeShiftId} machine={machine} bucketT={bucketT}
      onClose={()=>setEndModalOpen(false)}
      onEnded={()=>{setRefreshTick(t=>t+1);onShiftEnded&&onShiftEnded();}}
    />}

    {isOperator&&idleVis&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:C.surface,borderTop:`3px solid ${C.danger}`,borderRadius:"18px 18px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:420,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:16}}><div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.danger}}>🕒 IDLE {idleMins} MIN</div><div style={{fontSize:13,color:C.textSub,marginTop:4}}>Log the reason to continue.</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>{Object.entries(DT_CATS).map(([k,v])=><button key={k} onClick={()=>logReason(k)} style={{background:v.fault?`${C.danger}22`:C.card,border:`2px solid ${v.fault?C.danger:C.border}`,borderRadius:13,padding:"16px 10px",color:v.fault?C.danger:C.text,textAlign:"center",cursor:"pointer"}}><div style={{fontSize:28,marginBottom:6}}>{v.icon}</div><div style={{fontFamily:F,fontWeight:700,fontSize:14}}>{v.short}</div></button>)}</div>
        <textarea value={idleNote} onChange={e=>setIdleNote(e.target.value)} placeholder="Optional note…" rows={2} style={{background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",resize:"none",marginBottom:10}}/>
        <button onClick={flagLater} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",color:C.muted,fontSize:12,fontFamily:F,fontWeight:600,cursor:"pointer"}}>Flag for later — supervisor will be notified</button>
      </div>
    </div>}

    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 15px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:19,marginBottom:2}}>
            {isOperator?<>{machine?.model||"—"} <span style={{color:C.accent}}>· {crusher?.name||"—"}</span></>:"Mine Production"}
          </div>
          <div style={{fontSize:10,color:C.muted}}>
            {isOperator?<>{user?.employeeId||""} · {bucketT}t bucket{crusher?` · target ${crusher.capacityTph} t/hr`:""}</>:<>{activeMine?.name||"Demo mode"} · {opsArr.length} operator{opsArr.length!==1?"s":""} · last {rangeDays}d</>}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>{vlConnected?"VisionLink":"Manual"}</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:13,color:vlConnected?C.success:C.amber,marginTop:2}}>{vlConnected?`● ${lastSyncLabel}`:demoMode?"Demo":`Sync ${lastSyncLabel}`}</div>
        </div>
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${C.border}`,paddingTop:5,marginTop:9}}>{subtabs.map(tb)}</div>
    </div>

    <div style={{padding:"12px 15px"}}>
      {tab==="prod"&&<div>
        {isOperator&&activeShiftId&&!hasOwnEntryToday&&<button onClick={()=>setEndModalOpen(true)}
          style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#e09520)`,color:"#000",border:"none",borderRadius:14,padding:"16px",fontFamily:F,fontWeight:900,fontSize:20,letterSpacing:".04em",boxShadow:`0 4px 24px ${C.accent}44`,marginBottom:12,cursor:"pointer"}}>
          ✅ END SHIFT · LOG TODAY'S TONNES
          <div style={{fontSize:11,fontWeight:600,marginTop:3,opacity:.8}}>{vlConnected?"VisionLink prefill ready":"Enter your day total"}</div>
        </button>}
        {isOperator&&hasOwnEntryToday&&<div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.success,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>✓ Today logged</div>
          <div style={{fontSize:12,color:C.textSub}}>{myToday.toLocaleString()} t recorded for today. Next shift opens at sign-in.</div>
        </div>}

        <div style={{background:C.card,border:`1.5px solid ${C.accent}33`,borderRadius:14,padding:"13px 15px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:3}}>{isOperator?"My tonnes today":"Mine total today"}</div>
              <div style={{fontFamily:F,fontWeight:900,fontSize:42,color:C.accent,lineHeight:1}}>{(isOperator?myToday:mineToday).toLocaleString()}<span style={{fontSize:18,color:C.muted,fontWeight:400}}> t</span></div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>{isOperator?(myDaysWithData?`${rangeDays}d avg ${myAvg.toLocaleString()} t/day`:"No prior history yet"):`${todayOps} operator${todayOps!==1?"s":""} logged`}</div>
            </div>
            <div style={{textAlign:"right",paddingTop:4}}>
              <div style={{background:`${C.info}10`,border:`1px solid ${C.info}30`,borderRadius:9,padding:"8px 12px"}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>{rangeDays}d total</div>
                <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.info,marginTop:2}}>{(isOperator?myRangeTotal:mineRangeTotal).toLocaleString()}<span style={{fontSize:11,color:C.muted,fontWeight:400}}> t</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[7,14,30].map(n=>{const active=rangeDays===n;return<button key={n} onClick={()=>setRangeDays(n)}
            style={{flex:1,background:active?`${C.accent}22`:C.card,border:`1px solid ${active?C.accent:C.border}`,borderRadius:9,padding:"7px 0",color:active?C.accent:C.muted,fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer"}}>{n}d</button>;})}
        </div>

        {!isOperator&&opsArr.length>1&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <button onClick={()=>setFilterOp(null)} style={{background:filterOp===null?`${C.accent}22`:C.card,border:`1px solid ${filterOp===null?C.accent:C.border}`,borderRadius:99,padding:"5px 11px",color:filterOp===null?C.accent:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>All ({opsArr.length})</button>
          {opsArr.map((o,i)=>{
            const col=SERIES_COLORS[i%SERIES_COLORS.length];
            const active=filterOp===o.operatorId;
            return<button key={o.operatorId} onClick={()=>setFilterOp(active?null:o.operatorId)}
              style={{background:active?`${col}22`:C.card,border:`1px solid ${active?col:C.border}`,borderRadius:99,padding:"5px 11px",color:active?col:C.textSub,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:col,display:"inline-block"}}/>{o.name.split(" ")[0]}
            </button>;
          })}
        </div>}

        <BarChart days={days} series={tonnageSeries} title="Daily Tonnage" yLabel="t" height={180} emptyMessage={isOperator?"sign off a shift to start your history":"no operators have logged shifts yet"}/>

        <LineChart title={vlConnected||demoMode?"Cycle Time (today)":"Cycle Time"} yLabel="min" series={cycleSeries} height={140}/>
        {!vlConnected&&!demoMode&&cycleSeries.length===0&&<div style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:-2,marginBottom:8,padding:"0 12px",lineHeight:1.5}}>Cycle time auto-populates from VisionLink-connected machines.</div>}
      </div>}

      {tab==="log"&&isOperator&&<div>
        <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:10}}>Downtime Log</div>
        {events.length===0?<Card><div style={{fontSize:13,color:C.success,textAlign:"center",padding:16}}>✓ No downtime events this shift</div></Card>:events.map((e,i)=>{const dc=DT_CATS[e.cat];return<div key={i} style={{background:C.card,border:`1px solid ${e.flagged?C.amber:dc?.fault?C.danger:C.border}33`,borderLeft:`4px solid ${e.flagged?C.amber:dc?.fault?C.danger:C.muted}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:20,flexShrink:0}}>{dc?.icon}</span><div style={{flex:1}}><div style={{fontFamily:F,fontWeight:700,fontSize:14}}>{dc?.label}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{e.time} · {(e.hrs*60).toFixed(0)}min{e.note?` · "${e.note}"`:""}</div></div>{(dc?.fault||e.flagged)&&<Pill label={e.flagged?"FLAGGED":"OP FAULT"} color={e.flagged?C.amber:C.danger}/>}</div></div>;})}
        <div style={{marginTop:14,background:`${C.danger}08`,border:`1px solid ${C.danger}22`,borderRadius:10,padding:"12px 14px"}}>
          <div style={{fontSize:10,color:C.danger,fontFamily:F,fontWeight:700,marginBottom:6}}>⚡ IDLE DETECTION · {OP.idleAlertMins}min · DEMO: 1 sec ≈ 1 min</div>
          <button onClick={startIdle} disabled={simOn} style={{background:simOn?C.border:C.danger,color:simOn?C.muted:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontFamily:F,fontWeight:700,cursor:simOn?"default":"pointer"}}>{simOn?`⏱ Running… ${idleMins}/${OP.idleAlertMins}min`:"Simulate Idle Alert"}</button>
        </div>
      </div>}

      {tab==="blast"&&<div>
        {BLASTS.filter(b=>b.status==="upcoming").map(b=><div key={b.id} style={{background:`${C.amber}10`,border:`1px solid ${C.amber}44`,borderRadius:12,padding:"14px 15px",marginBottom:10}}><div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.amber,marginBottom:3}}>⚠ NEXT BLAST</div><div style={{fontFamily:F,fontWeight:900,fontSize:18,marginBottom:2}}>{b.label}</div><div style={{fontSize:12,color:C.muted}}>Today at {b.time} · {b.dur}min hold</div></div>)}
        {BLASTS.map(b=>{const sc={upcoming:C.amber,completed:C.muted,scheduled:C.info};return<Card key={b.id} style={{padding:"11px 13px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:F,fontWeight:700,fontSize:13}}>{b.label}</div><div style={{fontSize:11,color:C.muted}}>Today · {b.time} · {b.dur}min hold</div></div><Pill label={b.status.toUpperCase()} color={sc[b.status]}/></div></Card>;})}
      </div>}
    </div>
  </div>;
}

// ── Machine Check ──────────────────────────────────────────────────────────
// ── Pre-start Item Row ────────────────────────────────────────────────────
// One row per PRESTART item. Photo-required items render a "📷 REQ" badge
// and block the checkbox until a photo is captured. Photo-optional items
// get a small inline camera button.
// ── Reference Photo Modal ─────────────────────────────────────────────────
// Wiki-style cheat sheet for a (machine_model, item_key) pairing. Anyone in
// the mine can read or contribute. Used as the "?" help button on
// photo-required check items.
function ReferencePhotoModal({mineId,machineModel,itemKey,itemLabel,user,onClose}){
  const[photos,setPhotos]=useState([]);
  const[loading,setLoading]=useState(true);
  const[urls,setUrls]=useState({});         // path → signed URL
  const[lightbox,setLightbox]=useState(null);
  const[addMode,setAddMode]=useState(false);
  const[pickedFile,setPickedFile]=useState(null);
  const[caption,setCaption]=useState("");
  const[uploading,setUploading]=useState(false);
  const[err,setErr]=useState("");
  const fileRef=useRef(null);
  const[pickedUrl,setPickedUrl]=useState(null);
  useEffect(()=>{
    if(!pickedFile){setPickedUrl(null);return;}
    const u=URL.createObjectURL(pickedFile);
    setPickedUrl(u);
    return()=>URL.revokeObjectURL(u);
  },[pickedFile]);

  const load=async()=>{
    if(!mineId||!machineModel||!itemKey){setLoading(false);return;}
    setLoading(true);
    try{
      const{data}=await supabase.from("reference_photos")
        .select("*")
        .eq("mine_id",mineId).eq("machine_model",machineModel).eq("item_key",itemKey)
        .order("created_at",{ascending:false});
      setPhotos(data||[]);
      // Pre-fetch signed URLs in parallel.
      const out={};
      await Promise.all((data||[]).map(async p=>{
        const u=await getReferencePhotoUrl(p.storage_path);
        if(u)out[p.storage_path]=u;
      }));
      setUrls(out);
    }catch(e){console.error("ref photos load:",e);}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[mineId,machineModel,itemKey]);

  const startAdd=()=>{
    setAddMode(true);setPickedFile(null);setCaption("");setErr("");
    setTimeout(()=>fileRef.current?.click(),50);
  };
  const onPick=e=>{
    const f=e.target.files?.[0];
    if(f)setPickedFile(f);
    e.target.value="";
  };
  const submit=async()=>{
    if(!pickedFile||uploading)return;
    setUploading(true);setErr("");
    try{
      await uploadReferencePhoto({
        file:pickedFile,mineId,machineModel,itemKey,
        caption:caption.trim()||null,
        uploadedBy:user?.id||null,
        uploadedByName:user?.name||null,
      });
      setAddMode(false);setPickedFile(null);setCaption("");
      await load();
    }catch(e){console.error("upload ref photo:",e);setErr(e.message||"Could not upload");}
    finally{setUploading(false);}
  };

  return<div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,display:"flex",flexDirection:"column"}}>
    {lightbox&&<div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <img src={lightbox} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>
      <button onClick={e=>{e.stopPropagation();setLightbox(null);}} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,.7)",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕ Close</button>
    </div>}

    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.accent}}>📷 Reference Photos</div>
        <div style={{fontSize:11,color:C.muted,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{itemLabel||itemKey} · {machineModel}</div>
      </div>
      <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer",flexShrink:0}}>✕ Done</button>
    </div>

    <div style={{flex:1,overflowY:"auto"}}>
      {addMode?<div style={{background:C.card,border:`1px solid ${C.accent}55`,padding:"14px 16px",margin:14,borderRadius:12}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.accent,marginBottom:10}}>Add a reference photo</div>
        {pickedFile?<div style={{marginBottom:10}}>
          {pickedUrl&&<img src={pickedUrl} alt="" style={{width:"100%",maxHeight:240,objectFit:"contain",borderRadius:8,border:`1px solid ${C.border}`}}/>}
          <button onClick={()=>fileRef.current?.click()} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",marginTop:6}}>Retake</button>
        </div>:<button onClick={()=>fileRef.current?.click()} style={{width:"100%",background:`${C.accent}15`,border:`2px dashed ${C.accent}55`,borderRadius:10,padding:"22px",color:C.accent,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:10}}>📷 Take photo</button>}
        <div style={{fontSize:11,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:5}}>Caption <span style={{color:C.muted,fontWeight:400}}>· helps teammates find it</span></div>
        <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="e.g. yellow dipstick handle, driver side"
          style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
        {err&&<div style={{fontSize:12,color:C.danger,marginBottom:8}}>⚠ {err}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setAddMode(false);setPickedFile(null);setCaption("");setErr("");}} disabled={uploading}
            style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:13,cursor:uploading?"default":"pointer"}}>Cancel</button>
          <button onClick={submit} disabled={!pickedFile||uploading}
            style={{flex:1,background:pickedFile&&!uploading?C.success:C.border,color:pickedFile&&!uploading?"#000":C.muted,border:"none",borderRadius:9,padding:"11px",fontFamily:F,fontWeight:900,fontSize:13,cursor:pickedFile&&!uploading?"pointer":"default"}}>{uploading?"Uploading…":"Upload"}</button>
        </div>
      </div>:<button onClick={startAdd}
        style={{width:"calc(100% - 28px)",margin:"14px 14px 6px",background:`linear-gradient(135deg,${C.accent},#d4881e)`,border:"none",borderRadius:12,padding:"14px",color:"#000",fontFamily:F,fontWeight:900,fontSize:14,cursor:"pointer",boxShadow:`0 4px 16px ${C.accent}33`}}>+ Add a photo</button>}

      {loading?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>Loading reference photos…</div>:
       photos.length===0?<div style={{textAlign:"center",padding:"50px 22px"}}>
        <div style={{fontSize:46,marginBottom:10,opacity:.6}}>📷</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:17,color:C.text,marginBottom:6}}>No reference photos yet</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Be the first to add one — it'll help your team find this on the next machine they touch.</div>
      </div>:
       <div style={{padding:"6px 14px 20px"}}>
        {photos.map(p=>{
          const url=urls[p.storage_path];
          return<div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:10,marginBottom:10}}>
            <button onClick={()=>url&&setLightbox(url)} disabled={!url}
              style={{width:"100%",background:"none",border:"none",padding:0,cursor:url?"pointer":"default",display:"block",borderRadius:8,overflow:"hidden",aspectRatio:"4/3"}}>
              {url?<img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  :<div style={{width:"100%",height:"100%",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:12}}>Loading…</div>}
            </button>
            {p.caption&&<div style={{fontSize:13,color:C.text,marginTop:8,lineHeight:1.4}}>{p.caption}</div>}
            <div style={{fontSize:10,color:C.muted,marginTop:6,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>
              {p.uploaded_by_name||"Unknown"} · {new Date(p.created_at).toLocaleString()}
            </div>
          </div>;
        })}
      </div>}
    </div>
    <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onPick}/>
  </div>;
}

function PrestartItemRow({item,last,checked,canCheck,required,photo,onToggle,onPhotoCaptured,onPhotoCleared,onRefHelp}){
  const fileRef=useRef(null);
  const[thumbUrl,setThumbUrl]=useState(null);
  useEffect(()=>{
    if(!photo){setThumbUrl(null);return;}
    const u=URL.createObjectURL(photo);
    setThumbUrl(u);
    return()=>URL.revokeObjectURL(u);
  },[photo]);
  const onPick=e=>{
    const f=e.target.files?.[0];
    if(f)onPhotoCaptured(f);
    e.target.value="";
  };
  const badgeOK=photo;
  const badgeCol=badgeOK?C.success:C.danger;
  return<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 0",borderBottom:last?"none":`1px solid ${C.border}22`}}>
    <div onClick={onToggle} title={canCheck?"":"Capture photo first"}
      style={{width:26,height:26,borderRadius:7,background:checked?C.success:"transparent",border:`2px solid ${checked?C.success:(canCheck?C.border:C.danger)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,cursor:canCheck?"pointer":"not-allowed",transition:"all .15s",marginTop:1,opacity:canCheck?1:0.6}}>{checked?"✓":""}</div>
    <div style={{flex:1,minWidth:0}}>
      <div onClick={canCheck?onToggle:undefined} style={{display:"flex",alignItems:"center",gap:8,cursor:canCheck?"pointer":"default",flexWrap:"wrap"}}>
        <span style={{fontSize:14,color:checked?C.text:C.textSub,flex:1,lineHeight:1.3,minWidth:120}}>{item.label}</span>
        {required&&onRefHelp&&<button onClick={e=>{e.stopPropagation();onRefHelp();}}
          style={{background:"none",border:`1px solid ${C.info}55`,borderRadius:"50%",width:22,height:22,padding:0,color:C.info,fontSize:13,fontFamily:F,fontWeight:900,cursor:"pointer",lineHeight:1,flexShrink:0}}
          title="View reference photos for this item">?</button>}
        {required&&<span style={{background:`${badgeCol}22`,color:badgeCol,border:`1px solid ${badgeCol}55`,borderRadius:6,padding:"2px 7px",fontSize:9,fontFamily:F,fontWeight:700,letterSpacing:".04em",whiteSpace:"nowrap"}}>📷 {badgeOK?"OK":"REQ"}</span>}
        {!required&&!photo&&<button onClick={e=>{e.stopPropagation();fileRef.current?.click();}}
          style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 7px",color:C.muted,fontSize:11,cursor:"pointer",lineHeight:1}} title="Attach photo (optional)">📷+</button>}
      </div>
      {(required||photo)&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
        {photo?<>
          {thumbUrl&&<img src={thumbUrl} alt="" style={{width:48,height:48,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border}`,flexShrink:0}}/>}
          <button onClick={()=>fileRef.current?.click()} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 9px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Retake</button>
          <button onClick={onPhotoCleared} style={{background:"none",border:`1px solid ${C.danger}33`,borderRadius:7,padding:"5px 9px",color:C.danger,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕</button>
        </>:<button onClick={()=>fileRef.current?.click()}
          style={{background:`${C.accent}15`,border:`1px dashed ${C.accent}55`,borderRadius:8,padding:"7px 12px",color:C.accent,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>📷 Capture photo</button>}
      </div>}
    </div>
    <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onPick}/>
  </div>;
}

// ── Daily Machine Check ───────────────────────────────────────────────────
function MachineCheckScreen({allMachines,catDemo,activeMine,activeShiftId,user}){
  const[sel,setSel]=useState(null);
  const[checks,setChecks]=useState({});      // {machineId: {itemKey: bool}}
  const[photos,setPhotos]=useState({});      // {machineId: {itemKey: File}}
  const[done,setDone]=useState({});          // {machineId: bool}
  const[fuel,setFuel]=useState("");
  const[fuelErr,setFuelErr]=useState("");
  const[submitting,setSubmitting]=useState(false);
  const[refHelp,setRefHelp]=useState(null); // {key, label} for the reference-photo modal
  const overrides=useCheckItemConfig(activeMine);

  const setPhoto=(mid,key,file)=>setPhotos(p=>({...p,[mid]:{...(p[mid]||{}),[key]:file}}));
  const itemCheckable=(mid,key)=>{
    if(!isPhotoRequired("prestart",key,overrides))return true;
    return !!photos[mid]?.[key];
  };
  const count=id=>Object.values(checks[id]||{}).filter(Boolean).length;
  const allItemsDone=id=>PRESTART.every(c=>(checks[id]||{})[c.id]);
  const requiredMissingCount=id=>PRESTART.filter(c=>isPhotoRequired("prestart",c.id,overrides)&&!photos[id]?.[c.id]).length;
  const handleFuel=v=>{
    setFuel(v);
    const n=parseInt(v);
    if(v==="")return setFuelErr("");
    if(isNaN(n)||n<1||n>100)return setFuelErr("Enter 1–100%");
    setFuelErr("");
  };

  if(sel){
    const m=allMachines.find(x=>x.id===sel);
    const cat=catDemo.find(x=>x.id===sel)?.data;
    const isDone=done[sel];
    const cnt=count(sel);
    const fuelOk=parseInt(fuel)>=1&&parseInt(fuel)<=100&&!fuelErr;
    const reqMissing=requiredMissingCount(sel);
    const can=allItemsDone(sel)&&fuelOk&&reqMissing===0;
    return <div style={{paddingBottom:20}}>
      {refHelp&&<ReferencePhotoModal mineId={activeMine?.id} machineModel={m?.model||sel} itemKey={refHelp.key} itemLabel={refHelp.label} user={user} onClose={()=>setRefHelp(null)}/>}
      <PageHdr title="Pre-Start Inspection" sub={`${m?.model} · HSMP minimum`} back onBack={()=>setSel(null)}/>
      {isDone?<div style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:52,marginBottom:10}}>✅</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.success}}>Signed Off</div>
        <div style={{fontSize:12,color:C.muted,marginTop:5}}>{m?.model} · {new Date().toLocaleTimeString()}</div>
        <div style={{background:`${C.success}12`,border:`1px solid ${C.success}33`,borderRadius:10,padding:"12px 16px",marginTop:20,textAlign:"left"}}>
          <div style={{fontSize:12,color:C.success,fontFamily:F,fontWeight:700}}>Pre-start logged. Machine cleared for operation.</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>Contact supervisor if issues arise during shift.</div>
        </div>
      </div>:
      <div style={{padding:"13px 15px"}}>
        {cat?.faults?.map((f,i)=><div key={i} style={{display:"flex",gap:8,background:`${f.sev==="high"?C.danger:C.amber}12`,border:`1px solid ${f.sev==="high"?C.danger:C.amber}30`,borderRadius:8,padding:"8px 11px",marginBottom:9}}>
          <span style={{fontFamily:F,fontWeight:900,fontSize:13,color:f.sev==="high"?C.danger:C.amber,flexShrink:0}}>{f.code}</span>
          <span style={{fontSize:12,color:C.textSub}}>{f.desc}</span>
        </div>)}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:5}}>
          <span>{cnt} of {PRESTART.length} items{reqMissing>0?` · ${reqMissing} photo${reqMissing!==1?"s":""} needed`:""}</span>
          <span>{Math.round((cnt/PRESTART.length)*100)}%</span>
        </div>
        <Bar value={cnt} max={PRESTART.length} color={cnt===PRESTART.length?C.success:C.accent}/>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 14px",marginTop:13,marginBottom:14}}>
          {PRESTART.map((c,i)=>{
            const required=isPhotoRequired("prestart",c.id,overrides);
            const photo=photos[sel]?.[c.id]||null;
            const checked=!!(checks[sel]||{})[c.id];
            const canCheck=itemCheckable(sel,c.id);
            return<PrestartItemRow key={c.id} item={c} last={i===PRESTART.length-1}
              checked={checked} canCheck={canCheck} required={required} photo={photo}
              onToggle={()=>{if(canCheck)setChecks(p=>({...p,[sel]:{...(p[sel]||{}),[c.id]:!checked}}));}}
              onPhotoCaptured={file=>setPhoto(sel,c.id,file)}
              onPhotoCleared={()=>setPhoto(sel,c.id,null)}
              onRefHelp={()=>setRefHelp({key:c.id,label:c.label})}
            />;
          })}
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Fuel level (%)<span style={{color:C.danger}}> *</span></div>
          <input type="number" placeholder="e.g. 78" value={fuel} onChange={e=>handleFuel(e.target.value)}
            style={{background:C.surface,color:C.text,border:`1px solid ${fuelErr?C.danger:parseInt(fuel)>=1&&parseInt(fuel)<=100?C.success:C.border}`,borderRadius:9,padding:"13px 14px",fontSize:16,width:"100%",outline:"none",boxSizing:"border-box"}}/>
          {fuelErr&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>{fuelErr}</div>}
        </div>
        <button onClick={async()=>{
          if(!can||submitting)return;
          setSubmitting(true);
          const machineId=sel;
          const photoMap=photos[machineId]||{};
          try{
            if(activeMine?.id&&activeShiftId&&user?.id){
              const{data,error}=await supabase.from("prestart_logs").insert({
                mine_id:activeMine.id,shift_id:activeShiftId,machine_id:machineId,operator_id:user.id,
                checks_passed:checks[machineId]||{},fuel_level:parseInt(fuel)||null,signed_off_at:new Date().toISOString(),
              }).select().single();
              if(error)throw error;
              const logId=data?.id;
              if(logId){
                const tasks=Object.entries(photoMap)
                  .filter(([,f])=>!!f)
                  .map(([itemKey,file])=>uploadCheckPhoto({file,mineId:activeMine.id,logType:"prestart",logId,itemKey,uploadedBy:user.id}));
                await Promise.all(tasks);
              }
            }
            setDone(p=>({...p,[machineId]:true}));
          }catch(e){
            console.error("prestart sign-off:",e);
            alert("Could not sign off: "+(e.message||e));
          }finally{setSubmitting(false);}
        }} disabled={!can||submitting}
          style={{width:"100%",background:can&&!submitting?C.success:C.border,color:can&&!submitting?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:can&&!submitting?"pointer":"default",transition:"background .2s"}}>
          {submitting?"Saving…":can?"✅ SIGN OFF":reqMissing>0?`${reqMissing} photo${reqMissing!==1?"s":""} required`:"Complete all items + valid fuel level"}
        </button>
      </div>}
    </div>;
  }

  return <div style={{paddingBottom:20}}>
    <PageHdr title="Daily Machine Check" sub="MQSHA Reg 2017 minimum — select machine"/>
    <div style={{padding:"13px 15px"}}>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        <Stat label="Signed Off" value={Object.values(done).filter(Boolean).length} color={C.success}/>
        <Stat label="Pending" value={Math.max(0,allMachines.length-Object.values(done).filter(Boolean).length)} color={C.amber}/>
      </div>
      {allMachines.length===0?<div style={{textAlign:"center",padding:"50px 22px"}}>
        <div style={{fontSize:46,marginBottom:10,opacity:.6}}>🚛</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text,marginBottom:6}}>No machines in fleet</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Ask your mine manager to add a machine from Setup before starting pre-start checks.</div>
      </div>:allMachines.map(m=>{
        const cat=catDemo.find(x=>x.id===m.id)?.data;
        const isDone=done[m.id];
        const cnt=count(m.id);
        const sc=STATUS_COL[cat?.status]||C.info;
        return <Card key={m.id} onClick={()=>setSel(m.id)} style={{padding:"13px 14px",border:`1px solid ${isDone?C.success:C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
            <div>
              <div style={{fontFamily:F,fontWeight:900,fontSize:17,color:C.text}}>{m.model}</div>
              <div style={{fontSize:11,color:C.muted}}>{m.type} · {cat?.sn||m.serial_number||"Custom"}</div>
            </div>
            <Pill label={isDone?"✓ SIGNED OFF":cat?.status?.toUpperCase()||"NEW"} color={isDone?C.success:sc}/>
          </div>
          {!isDone&&cnt>0&&<div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{cnt}/{PRESTART.length} items</div>
            <Bar value={cnt} max={PRESTART.length} color={C.accent} thin/>
          </div>}
          {isDone?<div style={{fontSize:11,color:C.success}}>✓ Pre-start complete</div>:cnt===0?<div style={{fontSize:11,color:C.muted}}>Tap to begin →</div>:null}
        </Card>;
      })}
    </div>
  </div>;
}

// ── Machine Limits data ───────────────────────────────────────────────────
const MACHINE_LIMITS={
  CAT745_2:{
    incidents:[
      {id:"inc1",code:"AXL-OVH",sev:"high",
       desc:"Axle overtemperature — right rear axle",
       time:"2 days ago · 14:35",fluidsOk:true,
       ops:{cycleMin:18.2,payloadT:44.9,tripsHr:3.3,engTemp:91,hydTemp:74,ambientC:36},
       verdict:"LIMIT FOUND",
       analysis:"All fluids confirmed OK before and after. Axle overheated at sustained 18.2 min cycles carrying 44.9t in 36°C ambient. The machine, not the operator, hit its limit at this combination."},
    ],
    safeEnvelope:{max:{cycleMin:20,payloadT:43},caution:{cycleMin:19,payloadT:44},
      label:"Safe zone: ≥20 min cycle · ≤43t payload (ambient >30°C)",
      detail:"In ambient temps above 30°C back off to ≤43t payload and keep cycles at or above 20 min. Below 30°C ambient the 45.4t rated payload is sustainable."},
    history:[
      {cycleMin:21.2,payloadT:43.5,engTemp:87, hydTemp:68,fault:false},
      {cycleMin:20.8,payloadT:43.8,engTemp:88, hydTemp:69,fault:false},
      {cycleMin:20.1,payloadT:44.1,engTemp:89, hydTemp:71,fault:false},
      {cycleMin:19.6,payloadT:44.3,engTemp:90, hydTemp:72,fault:false},
      {cycleMin:19.1,payloadT:44.6,engTemp:91, hydTemp:73,fault:false},
      {cycleMin:18.8,payloadT:44.7,engTemp:91, hydTemp:74,fault:false},
      {cycleMin:18.2,payloadT:44.9,engTemp:91, hydTemp:74,fault:true, faultCode:"AXL-OVH"},
    ],
  },
  CAT745_1:{incidents:[],safeEnvelope:null,
    history:[
      {cycleMin:20.1,payloadT:43.1,engTemp:86,hydTemp:66,fault:false},
      {cycleMin:19.5,payloadT:43.4,engTemp:87,hydTemp:67,fault:false},
      {cycleMin:18.9,payloadT:43.7,engTemp:88,hydTemp:68,fault:false},
      {cycleMin:18.5,payloadT:43.8,engTemp:88,hydTemp:68,fault:false},
    ],
  },
  CAT988K:{incidents:[],safeEnvelope:null,
    history:[
      {tph:261,cycleMin:2.2,engTemp:86,hydTemp:63,fault:false},
      {tph:271,cycleMin:2.1,engTemp:87,hydTemp:64,fault:false},
      {tph:287,cycleMin:1.9,engTemp:88,hydTemp:65,fault:false},
      {tph:298,cycleMin:1.8,engTemp:90,hydTemp:67,fault:false},
    ],
  },
  CAT992K:{incidents:[{id:"inc1",code:"E360",sev:"medium",
      desc:"Payload overload — check tyre pressure",
      time:"Today",fluidsOk:true,
      ops:{tph:311,cycleMin:2.1,engTemp:91,hydTemp:69},
      verdict:"MONITOR",
      analysis:"Payload consistently at or above rated limit. Tyres absorbing the overload — monitor tyre pressure daily and consider reducing average bucket fill by 5% to protect tyres long term."}],
    safeEnvelope:null,
    history:[
      {tph:289,cycleMin:2.4,engTemp:88,hydTemp:64,fault:false},
      {tph:298,cycleMin:2.3,engTemp:89,hydTemp:66,fault:false},
      {tph:311,cycleMin:2.1,engTemp:91,hydTemp:69,fault:true,faultCode:"E360"},
    ],
  },
  CAT6060:{incidents:[{id:"inc1",code:"SVC",sev:"medium",
      desc:"PM overdue 250 hrs — supervisor approved to continue",
      time:"Ongoing",fluidsOk:true,
      ops:{tph:241,cycleMin:4.1,engTemp:96,hydTemp:72},
      verdict:"WATCH",
      analysis:"Engine temp running slightly high (96°C) with PM overdue. Not a fault caused by production rate — schedule service immediately. Reduce to 85% production until serviced."}],
    safeEnvelope:null,
    history:[
      {tph:219,cycleMin:4.6,engTemp:88,hydTemp:66,fault:false},
      {tph:231,cycleMin:4.4,engTemp:90,hydTemp:68,fault:false},
      {tph:241,cycleMin:4.1,engTemp:96,hydTemp:72,fault:true,faultCode:"SVC"},
    ],
  },
};

// ── Diagnostics ────────────────────────────────────────────────────────────
function DiagnosticsScreen({allMachines,catDemo}){
  const[sel,setSel]=useState(null);const[tab,setTab]=useState("overview");
  if(sel){
    const cd=catDemo.find(x=>x.id===sel),cat=cd?.data,m=allMachines.find(x=>x.id===sel),ext=DIAG_EXT[sel];
    const sc=STATUS_COL[cat?.status]||C.info,fc=cat?.fuel>50?C.success:cat?.fuel>20?C.amber:C.danger,ov=ext?.svc?.left<0;
    const lim=MACHINE_LIMITS[sel];
    const hasLimits=lim&&(lim.incidents?.length>0||lim.history?.length>0);
    const Tb=(id,ic,lb)=><button onClick={()=>setTab(id)} style={{flex:1,padding:"8px 0",background:"none",border:"none",color:tab===id?C.accent:C.muted,fontFamily:F,fontWeight:700,fontSize:9,borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`,cursor:"pointer"}}><span style={{fontSize:12}}>{ic}</span><br/>{lb}</button>;
    return <div style={{paddingBottom:20}}>
      <PageHdr title={m?.model||sel} sub={`${m?.type} · ${cat?.sn||"—"}`} back onBack={()=>{setSel(null);setTab("overview");}}/>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 15px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <Pill label={cat?.status?.toUpperCase()||"NEW"} color={sc}/>
          <div style={{fontSize:11,color:C.muted}}>{cat?.smh?.toLocaleString()||"—"} SMH</div>
        </div>
        {cat?.faults?.length>0&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:7,padding:"7px 11px",marginBottom:7}}><div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.danger}}>⚠ {cat.faults.length} ACTIVE FAULT{cat.faults.length>1?"S":""}</div></div>}
        <div style={{display:"flex",borderTop:`1px solid ${C.border}`,paddingTop:7}}>
          <Tb id="overview"  ic="📊" lb="Overview"/>
          <Tb id="limits"    ic="🌡" lb="Limits"/>
          <Tb id="faults"    ic="⚠"  lb="Faults"/>
          <Tb id="fluids"    ic="🔧" lb="Fluids"/>
          <Tb id="service"   ic="🗓" lb="Service"/>
        </div>
      </div>
      <div style={{padding:"12px 15px"}}>

        {tab==="overview"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:8}}>
            <Stat label="Fuel"      value={`${cat?.fuel||0}%`}       color={fc}/>
            <Stat label="Util Today" value={`${cat?.utilToday||0}%`} color={C.info}/>
            <Stat label="Next Svc"  value={ext?.svc?.next||"—"}      color={ov?C.danger:ext?.svc?.left<100?C.amber:C.success}/>
          </div>
          {cat?.engineTemp>0&&<div style={{display:"flex",gap:5,marginBottom:8}}>
            <Stat label="Engine Temp" value={`${cat.engineTemp}°C`} color={cat.engineTemp>105?C.danger:cat.engineTemp>95?C.amber:C.success}/>
            <Stat label="Battery"     value="24.2V"                 color={C.success}/>
          </div>}
          <Card style={{padding:"11px 13px",background:`${fc}08`,border:`1px solid ${fc}33`}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:10,color:C.muted,marginBottom:5}}>FUEL LEVEL</div>
            <Bar value={cat?.fuel||0} max={100} color={fc}/>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>{cat?.fuel||0}%</div>
          </Card>
          {lim?.safeEnvelope&&<div style={{background:`${C.danger}10`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 13px",marginTop:10}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.danger,marginBottom:3}}>⚠ Operating Limit on Record</div>
            <div style={{fontSize:11,color:C.textSub}}>{lim.safeEnvelope.label}</div>
            <button onClick={()=>setTab("limits")} style={{marginTop:7,background:"none",border:`1px solid ${C.danger}44`,borderRadius:7,padding:"5px 11px",color:C.danger,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>View Limits →</button>
          </div>}
        </div>}

        {tab==="limits"&&function(){
          if(!hasLimits)return <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:44,marginBottom:10}}>✅</div>
            <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.success,marginBottom:8}}>No limits recorded yet</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:260,margin:"0 auto"}}>No fault events have been correlated with production data for this machine. As the machine runs, patterns will appear here.</div>
          </div>;
          const isTruck=isMachTruck(m?.type);
          const hist=lim?.history||[];
          const safePts=hist.filter(h=>!h.fault);
          const xKey=isTruck?"cycleMin":"tph";
          const xLabel=isTruck?"Cycle Time (min)":"t/hr";
          // Chart: x = production metric, y = engine temp
          const allX=hist.map(h=>h[xKey]);
          const allY=hist.map(h=>h.engTemp);
          const minX=Math.min(...allX)-2,maxX=Math.max(...allX)+2;
          const minY=Math.min(...allY)-3,maxY=Math.max(...allY)+5;
          const CW=320,CH=140,PL=32,PR=12,PT=10,PB=24;
          const IW=CW-PL-PR,IH=CH-PT-PB;
          const px=v=>PL+((v-minX)/(maxX-minX))*IW;
          const py=v=>PT+IH-((v-minY)/(maxY-minY))*IH;
          const dangerY=105,warnY=95;
          return <div>
            {lim?.incidents?.length>0&&lim.incidents.map((inc,i)=>{
              const verdictCol=inc.verdict==="LIMIT FOUND"?C.danger:inc.verdict==="MONITOR"?C.amber:C.amber;
              return <div key={i} style={{background:`${verdictCol}10`,border:`2px solid ${verdictCol}44`,borderRadius:14,padding:"14px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div><div style={{fontFamily:F,fontWeight:900,fontSize:20,color:verdictCol}}>{inc.code}</div><div style={{fontSize:12,color:C.textSub,marginTop:2}}>{inc.desc}</div></div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{background:`${verdictCol}20`,color:verdictCol,border:`1px solid ${verdictCol}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{inc.verdict}</span>
                    <span style={{background:inc.fluidsOk?`${C.success}20`:`${C.danger}20`,color:inc.fluidsOk?C.success:C.danger,border:`1px solid ${inc.fluidsOk?C.success:C.danger}44`,borderRadius:6,padding:"2px 8px",fontSize:9,fontFamily:F,fontWeight:700}}>Fluids: {inc.fluidsOk?"CONFIRMED OK":"CHECK FLUIDS"}</span>
                  </div>
                </div>
                <div style={{fontSize:11,color:C.textSub,lineHeight:1.6,marginBottom:10}}>{inc.analysis}</div>
                <div style={{fontSize:10,color:C.muted,marginBottom:8}}>{inc.time}</div>
                {inc.ops&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                  {Object.entries(inc.ops).map(([k,v])=>{
                    const labels={cycleMin:"Cycle",payloadT:"Payload",tph:"t/hr",tripsHr:"Trips/hr",engTemp:"Eng °C",hydTemp:"Hyd °C",ambientC:"Ambient"};
                    const col=k==="engTemp"&&v>95?C.danger:k==="engTemp"&&v>85?C.amber:C.muted;
                    return <div key={k} style={{background:C.card,borderRadius:8,padding:"7px 8px",border:`1px solid ${k==="engTemp"&&v>95?C.danger+"33":C.border}`}}>
                      <div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{labels[k]||k}</div>
                      <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:col}}>{v}{k==="engTemp"||k==="hydTemp"||k==="ambientC"?"°C":k==="payloadT"?"t":k==="tph"?" t/hr":""}</div>
                    </div>;
                  })}
                </div>}
              </div>;
            })}

            {hist.length>1&&<div style={{marginBottom:14}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Production vs Engine Temp</div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 4px 4px",overflow:"hidden"}}>
                <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" style={{display:"block"}}>
                  {/* Danger zone */}
                  {dangerY>=minY&&dangerY<=maxY&&<rect x={PL} y={PT} width={IW} height={py(dangerY)-PT} fill={C.danger} fillOpacity=".06"/>}
                  {/* Caution zone */}
                  {warnY>=minY&&warnY<=maxY&&<rect x={PL} y={py(dangerY)} width={IW} height={py(warnY)-py(dangerY)} fill={C.amber} fillOpacity=".06"/>}
                  {/* Grid lines */}
                  {[dangerY,warnY].filter(v=>v>=minY&&v<=maxY).map(v=><g key={v}>
                    <line x1={PL} x2={CW-PR} y1={py(v)} y2={py(v)} stroke={v===dangerY?C.danger:C.amber} strokeWidth=".8" strokeDasharray="4,3"/>
                    <text x={PL-2} y={py(v)+3} textAnchor="end" style={{fontSize:7,fill:v===dangerY?C.danger:C.amber,fontFamily:F}}>{v}°</text>
                  </g>)}
                  {/* Y axis label */}
                  <text x={PL-2} y={py(minY)+3} textAnchor="end" style={{fontSize:7,fill:C.muted,fontFamily:F}}>{minY}°</text>
                  {/* Trend line through safe points */}
                  {safePts.length>1&&<polyline
                    points={[...safePts].sort((a,b)=>a[xKey]-b[xKey]).map(p=>`${px(p[xKey])},${py(p.engTemp)}`).join(" ")}
                    fill="none" stroke={C.success} strokeWidth="1.5" strokeDasharray="4,2" opacity=".6"/>}
                  {/* All data points */}
                  {hist.map((h,i)=><g key={i}>
                    {h.fault
                      ?<><circle cx={px(h[xKey])} cy={py(h.engTemp)} r="6" fill={C.danger} opacity=".25"/>
                        <circle cx={px(h[xKey])} cy={py(h.engTemp)} r="5" fill={C.danger} stroke="#07090d" strokeWidth="1.5"/>
                        <text x={px(h[xKey])+7} y={py(h.engTemp)+4} style={{fontSize:7,fill:C.danger,fontFamily:F,fontWeight:700}}>{h.faultCode}</text></>
                      :<circle cx={px(h[xKey])} cy={py(h.engTemp)} r="3.5" fill={C.success} stroke="#07090d" strokeWidth="1"/>}
                  </g>)}
                  {/* X axis labels */}
                  {[...new Set(hist.map(h=>h[xKey]))].map(v=><text key={v} x={px(v)} y={CH-6} textAnchor="middle" style={{fontSize:7,fill:C.muted,fontFamily:F}}>{v}</text>)}
                  {/* Zone labels */}
                  <text x={CW-PR-2} y={PT+8}   textAnchor="end" style={{fontSize:7,fill:`${C.danger}99`,fontFamily:F}}>DANGER &gt;105°C</text>
                  <text x={CW-PR-2} y={py(dangerY)+10} textAnchor="end" style={{fontSize:7,fill:`${C.amber}99`,fontFamily:F}}>CAUTION &gt;95°C</text>
                </svg>
                <div style={{textAlign:"center",fontSize:9,color:C.muted,paddingBottom:5}}>
                  {xLabel} → · 🔴 fault event · 🟢 clean run
                </div>
              </div>
            </div>}

            {lim?.safeEnvelope&&<div style={{background:`${C.success}08`,border:`1px solid ${C.success}33`,borderRadius:12,padding:"13px 14px",marginBottom:14}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:6}}>✅ Safe Operating Envelope</div>
              <div style={{fontSize:12,color:C.text,marginBottom:6,fontFamily:F,fontWeight:700}}>{lim.safeEnvelope.label}</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>{lim.safeEnvelope.detail}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:10}}>
                {Object.entries(lim.safeEnvelope.max).map(([k,v])=>{
                  const labels={cycleMin:"Max cycle",payloadT:"Max payload",tph:"Max t/hr"};
                  return <div key={k} style={{background:C.card,borderRadius:8,padding:"8px 9px",border:`1px solid ${C.success}33`}}>
                    <div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{labels[k]||k}</div>
                    <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.success}}>{v}{k==="payloadT"?"t":k==="cycleMin"?" min":""}</div>
                  </div>;
                })}
                <div style={{background:C.card,borderRadius:8,padding:"8px 9px",border:`1px solid ${C.amber}33`}}>
                  <div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Caution at</div>
                  <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.amber,lineHeight:1.3}}>
                    {Object.entries(lim.safeEnvelope.caution).map(([k,v])=>`${v}${k==="payloadT"?"t":k==="cycleMin"?"min":""}`).join(" / ")}
                  </div>
                </div>
              </div>
            </div>}

            <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"10px 13px"}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.info,marginBottom:4}}>📡 In production</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>This chart is built from VisionLink fault timestamps cross-referenced with scoop logs and VisionLink telemetry at the same moment. As more data accumulates the safe envelope automatically tightens.</div>
            </div>
          </div>;
        }()}

        {tab==="faults"&&(!cat?.faults?.length
          ?<div style={{textAlign:"center",padding:"36px 0"}}><div style={{fontSize:44,marginBottom:8}}>✅</div><div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.success}}>No Active Faults</div></div>
          :cat.faults.map((f,i)=><Card key={i} style={{padding:"14px",borderLeft:`4px solid ${f.sev==="high"?C.danger:C.amber}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:f.sev==="high"?C.danger:C.amber}}>{f.code}</div>
              <Pill label={f.sev.toUpperCase()} color={f.sev==="high"?C.danger:C.amber}/>
            </div>
            <div style={{fontSize:13,color:C.text,lineHeight:1.4}}>{f.desc}</div>
          </Card>)
        )}

        {tab==="fluids"&&(ext?.fluids
          ?Object.entries(ext.fluids).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${C.border}22`}}><span style={{fontSize:14,color:C.text,textTransform:"capitalize"}}>{k} fluid</span><Pill label={v} color={v==="OK"?C.success:v==="Low"?C.amber:C.muted}/></div>)
          :<div style={{fontSize:13,color:C.muted,padding:"20px 0",textAlign:"center"}}>No fluid data</div>
        )}

        {tab==="service"&&<div>{ext?.svc
          ?<Card style={{padding:"14px",background:ov?`${C.danger}10`:`${C.success}08`,border:`1px solid ${ov?C.danger:C.success}33`}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:ov?C.danger:C.success,marginBottom:4}}>{ov?"⚠ SERVICE OVERDUE":"NEXT SERVICE"}</div>
            <div style={{fontFamily:F,fontWeight:900,fontSize:30,color:ov?C.danger:C.success}}>{ext.svc.next}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:5}}>{ov?`${Math.abs(ext.svc.left)} hrs overdue`:`${ext.svc.left} hrs remaining`}</div>
          </Card>
          :<div style={{fontSize:13,color:C.muted,padding:"20px 0",textAlign:"center"}}>No service data yet</div>
        }</div>}

      </div>
    </div>;
  }

  return <div style={{paddingBottom:20}}>
    <PageHdr title="Machine Diagnostics" sub="Faults · fluids · limits · CAT VisionLink"/>
    <div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}44`,borderRadius:10,padding:"10px 13px",margin:"12px 15px 0",fontSize:11,color:C.amber,fontFamily:F,fontWeight:700,letterSpacing:".02em",lineHeight:1.5}}>⚠ Demo preview — pulls real telemetry once VisionLink is connected in Setup → Integrations.</div>
    <div style={{padding:"13px 15px"}}>
      {allMachines.map(m=>{
        const cd=catDemo.find(x=>x.id===m.id),cat=cd?.data,ext=DIAG_EXT[m.id];
        const sc=STATUS_COL[cat?.status]||C.info,svcCol=ext?.svc?.left<0?C.danger:ext?.svc?.left<100?C.amber:C.success;
        const lim=MACHINE_LIMITS[m.id],hasLimit=lim?.incidents?.length>0;
        return <Card key={m.id} onClick={()=>{setSel(m.id);setTab("overview");}}
          style={{padding:"13px 14px",border:`1px solid ${hasLimit?C.danger+"44":cat?.faults?.length>0?C.amber+"44":C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:17,color:C.text}}>{m.model}</div><div style={{fontSize:11,color:C.muted}}>{m.type} · {cat?.sn||"Custom"}</div></div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <Pill label={cat?.status?.toUpperCase()||"NEW"} color={sc}/>
              {hasLimit&&<Pill label="⚠ LIMIT" color={C.danger}/>}
              {!hasLimit&&cat?.faults?.length>0&&<Pill label={`${cat.faults.length} FAULT${cat.faults.length>1?"S":""}`} color={C.amber}/>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:cat?.faults?.length?8:0}}>
            <Stat label="SMH"  value={(cat?.smh||0).toLocaleString()}  color={C.muted} small/>
            <Stat label="Fuel" value={`${cat?.fuel||0}%`}             color={(cat?.fuel||0)>50?C.success:C.amber} small/>
            <Stat label="Svc"  value={ext?.svc?.next||"—"}            color={svcCol} small/>
          </div>
          {cat?.faults?.map((f,i)=><div key={i} style={{display:"flex",gap:8,background:`${C.danger}12`,border:`1px solid ${C.danger}30`,borderRadius:7,padding:"7px 10px",marginBottom:4}}>
            <span style={{fontFamily:F,fontWeight:900,fontSize:12,color:C.danger,flexShrink:0}}>{f.code}</span>
            <span style={{fontSize:11,color:C.textSub}}>{f.desc}</span>
          </div>)}
        </Card>;
      })}
    </div>
  </div>;
}

// ── Maintenance Screen ────────────────────────────────────────────────────
const MAINT_TASKS={
  grease:{id:"grease",label:"Greasing",        icon:"🪣",interval:10, unit:"SMH",color:"#f5a623",desc:"All grease points — pins, pivots, bucket linkage"},
  filter:{id:"filter",label:"Blow Out Filters", icon:"💨",interval:100,unit:"SMH",color:"#4fa3e0",desc:"Air filter, cabin filter, hydraulic breather"},
  coolant:{id:"coolant",label:"Coolant Top-Up", icon:"🌡",interval:250,unit:"SMH",color:"#3ecf8e",desc:"Check level, top up if needed"},
  hyd:   {id:"hyd",   label:"Hydraulic Oil",    icon:"🔧",interval:500,unit:"SMH",color:"#a78bfa",desc:"Check level and condition"},
};
const FIXED_PLANT=[
  {id:"FX_C1", name:"Crusher 1",          type:"Jaw Crusher",  hours:1840,tasks:["filter","lube"]},
  {id:"FX_C2", name:"Crusher 2",          type:"Cone Crusher", hours:920, tasks:["filter","lube"]},
  {id:"FX_CV1",name:"Main Feed Conveyor", type:"Belt Conveyor",hours:2100,tasks:["filter","belt","lube"]},
  {id:"FX_CV2",name:"Transfer Conveyor",  type:"Belt Conveyor",hours:1650,tasks:["filter","belt","lube"]},
  {id:"FX_CV3",name:"Stockpile Conveyor", type:"Belt Conveyor",hours:980, tasks:["filter","belt","lube"]},
];
const FIXED_TASKS={
  filter:{label:"Blow Out Filters",icon:"💨",interval:50, unit:"hrs",color:"#4fa3e0"},
  lube:  {label:"Lubrication",    icon:"🪣",interval:50, unit:"hrs",color:"#f5a623"},
  belt:  {label:"Belt Inspection",icon:"⚙", interval:100,unit:"hrs",color:"#3ecf8e"},
};

function MaintenanceScreen({allMachines}){
  const[view,setView]=useState("overview");
  const[sel,setSel]=useState(null);
  const[log,setLog]=useState([
    {machineId:"CAT988K", taskId:"grease",smh:14830,date:"Today 06:15",tech:"James S"},
    {machineId:"CAT988K", taskId:"filter",smh:14800,date:"3 days ago", tech:"Dan M"},
    {machineId:"CAT992K", taskId:"grease",smh:9208, date:"Today 06:20",tech:"Bec J"},
    {machineId:"CAT992K", taskId:"filter",smh:9100, date:"5 days ago", tech:"Tyler W"},
    {machineId:"CAT6060",  taskId:"grease",smh:6428, date:"Today 06:30",tech:"Marcus L"},
    {machineId:"CAT6060",  taskId:"filter",smh:6350, date:"8 days ago", tech:"Ken B"},
    {machineId:"CAT390F",  taskId:"grease",smh:11200,date:"Yesterday",  tech:"Pete N"},
    {machineId:"CAT745_1",taskId:"grease",smh:7838, date:"Today 06:10",tech:"Tony M"},
    {machineId:"CAT745_1",taskId:"filter",smh:7750, date:"6 days ago", tech:"Dean W"},
    {machineId:"CAT745_2",taskId:"grease",smh:6218, date:"Today 06:20",tech:"Kim B"},
    {machineId:"CAT745_2",taskId:"filter",smh:6150, date:"7 days ago", tech:"Chris F"},
  ]);
  const[modal,setModal]=useState(null);
  const[tech,setTech]=useState("");

  const lastDone=(mid,tid)=>[...log].filter(l=>l.machineId===mid&&l.taskId===tid).sort((a,b)=>b.smh-a.smh)[0];
  const mStatus=(mid,tid,smh)=>{const t=MAINT_TASKS[tid],l=lastDone(mid,tid);if(!t)return"ok";if(!l)return"overdue";const r=l.smh+t.interval-smh;return r<=0?"overdue":r<=t.interval*.2?"due-soon":"ok";};
  const sCol=s=>s==="overdue"?C.danger:s==="due-soon"?C.amber:C.success;
  const sLbl=s=>s==="overdue"?"OVERDUE":s==="due-soon"?"DUE SOON":"OK";

  const submitLog=()=>{
    if(!tech.trim()||!modal)return;
    const smh=CAT_DEMO[modal.machineId]?.smh||0;
    setLog(p=>[...p,{machineId:modal.machineId,taskId:modal.taskId,smh,date:"Just now",tech:tech.trim()}]);
    setModal(null);setTech("");
  };

  if(modal){const task=MAINT_TASKS[modal.taskId],m=allMachines.find(x=>x.id===modal.machineId);
    return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
      <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:48}}>{task?.icon}</div><div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.accent,margin:"8px 0 4px"}}>Log {task?.label}</div><div style={{fontSize:13,color:C.muted}}>{m?.model}</div></div>
      <input value={tech} onChange={e=>setTech(e.target.value)} placeholder="Technician name" style={{background:C.surface,color:C.text,border:`1px solid ${tech?C.success:C.border}`,borderRadius:9,padding:"13px 14px",fontSize:15,width:"100%",outline:"none",marginBottom:12}}/>
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:8,padding:"10px 12px",marginBottom:16,fontSize:11,color:C.muted}}>Logs at current SMH. Next due = {task?.interval} {task?.unit} from now.</div>
      <button onClick={submitLog} disabled={!tech.trim()} style={{width:"100%",background:tech.trim()?C.success:C.border,color:tech.trim()?"#000":C.muted,border:"none",borderRadius:12,padding:"16px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",marginBottom:10}}>✅ LOG COMPLETE</button>
      <button onClick={()=>{setModal(null);setTech("");}} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancel</button>
    </div>;}

  if(view==="machine"&&sel){
    const m=allMachines.find(x=>x.id===sel),smh=CAT_DEMO[sel]?.smh||0,fuel=CAT_DEMO[sel]?.fuel||0;
    return <div style={{paddingBottom:20}} className="up">
      <PageHdr title={m?.model||sel} sub={`${smh.toLocaleString()} SMH · Fuel ${fuel}%`} back onBack={()=>{setView("overview");setSel(null);}}/>
      <div style={{padding:"12px 15px"}}>
        {Object.values(MAINT_TASKS).map(task=>{
          const last=lastDone(sel,task.id),status=mStatus(sel,task.id,smh);
          const nextDue=last?last.smh+task.interval:null,rem=nextDue?nextDue-smh:null,sc=sCol(status);
          return <div key={task.id} style={{background:C.card,border:`1.5px solid ${sc}33`,borderRadius:12,padding:"13px 14px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:11,marginBottom:10}}>
              <div style={{fontSize:24}}>{task.icon}</div>
              <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{task.label}</div><span style={{background:`${sc}20`,color:sc,border:`1px solid ${sc}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{sLbl(status)}</span></div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{task.desc} · every {task.interval} {task.unit}</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:9}}>
              {[{l:"Last done",v:last?`${last.smh.toLocaleString()} SMH`:"Never",c:C.muted},{l:"Next due",v:nextDue?`${nextDue.toLocaleString()} SMH`:"—",c:sc},{l:"Remaining",v:rem!=null?(rem>0?`${rem} SMH`:"OVERDUE"):"—",c:sc}].map(x=><div key={x.l} style={{background:C.surface,borderRadius:8,padding:"7px 9px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontFamily:F,fontWeight:700,fontSize:13,color:x.c,marginTop:2}}>{x.v}</div></div>)}
            </div>
            {last&&<div style={{fontSize:10,color:C.muted,marginBottom:8}}>Last by: <strong style={{color:C.textSub}}>{last.tech}</strong> · {last.date}</div>}
            <button onClick={()=>setModal({machineId:sel,taskId:task.id})} style={{width:"100%",background:`${task.color}18`,border:`1px solid ${task.color}44`,borderRadius:9,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,color:task.color,cursor:"pointer"}}>{task.icon} Log {task.label} Done →</button>
          </div>;
        })}
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",margin:"16px 0 8px"}}>📡 VisionLink Live</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[{l:"Fuel",v:`${fuel}%`,c:fuel>50?C.success:C.amber},{l:"Eng Temp",v:CAT_DEMO[sel]?.engineTemp>0?`${CAT_DEMO[sel].engineTemp}°C`:"—",c:CAT_DEMO[sel]?.engineTemp>105?C.danger:C.success},{l:"DEF",v:["CAT745_1","CAT745_2"].includes(sel)?"82%":"N/A",c:C.success}].map(x=><div key={x.l} style={{background:C.card,borderRadius:8,padding:"8px 9px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontFamily:F,fontWeight:900,fontSize:18,color:x.c,marginTop:2}}>{x.v}</div></div>)}
        </div>
      </div>
    </div>;}

  const mobileAlerts=allMachines.filter(m=>CAT_DEMO[m.id]).map(m=>{const smh=CAT_DEMO[m.id]?.smh||0;const ov=Object.keys(MAINT_TASKS).filter(t=>mStatus(m.id,t,smh)==="overdue");const ds=Object.keys(MAINT_TASKS).filter(t=>mStatus(m.id,t,smh)==="due-soon");return{...m,smh,ov,ds,alerts:ov.length+ds.length};});
  const totalAlerts=mobileAlerts.reduce((a,m)=>a+m.alerts,0);

  return <div style={{paddingBottom:80}} className="up">
    <PageHdr title="Maintenance" sub="SMH-based · VisionLink fluids · log tasks"/>
    <div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}44`,borderRadius:10,padding:"10px 13px",margin:"12px 15px 0",fontSize:11,color:C.amber,fontFamily:F,fontWeight:700,letterSpacing:".02em",lineHeight:1.5}}>⚠ Demo preview — real maintenance tasks logged via the pre-start gate will show here in a future release.</div>
    <div style={{padding:"12px 15px"}}>
      {totalAlerts>0&&<div style={{background:`${C.danger}12`,border:`1px solid ${C.danger}33`,borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:28}}>⚠️</div><div><div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.danger}}>{totalAlerts} item{totalAlerts!==1?"s":""} need attention</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Tap a machine to view and log</div></div></div>}
      <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>🚛 Mobile Fleet</div>
      {mobileAlerts.map(m=>{
        const sc=m.ov.length>0?C.danger:m.ds.length>0?C.amber:C.border;
        return <div key={m.id} onClick={()=>{setSel(m.id);setView("machine");}} style={{background:C.card,border:`1.5px solid ${m.alerts>0?sc+"55":C.border}`,borderRadius:14,padding:"13px 15px",marginBottom:10,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:17,color:C.text}}>{m.model}</div><div style={{fontSize:11,color:C.muted}}>{m.type} · {m.smh.toLocaleString()} SMH</div></div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              {m.ov.length>0&&<span style={{background:`${C.danger}20`,color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{m.ov.length} OVERDUE</span>}
              {m.ds.length>0&&<span style={{background:`${C.amber}20`,color:C.amber,border:`1px solid ${C.amber}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{m.ds.length} DUE SOON</span>}
              {m.alerts===0&&<span style={{background:`${C.success}20`,color:C.success,border:`1px solid ${C.success}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>✓ OK</span>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {Object.entries(MAINT_TASKS).slice(0,2).map(([tid,task])=>{const s=mStatus(m.id,tid,m.smh),sc2=sCol(s),l=lastDone(m.id,tid),nd=l?l.smh+task.interval:null,r=nd?nd-m.smh:null;return <div key={tid} style={{background:C.surface,borderRadius:8,padding:"7px 9px",border:`1px solid ${sc2}33`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{task.label.split(" ")[0]}</div><div style={{fontFamily:F,fontWeight:900,fontSize:13,color:sc2,marginTop:2}}>{r!=null?(r>0?`${r} SMH`:"OVERDUE"):"—"}</div></div>;})}
          </div>
        </div>;
      })}
      <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",margin:"16px 0 8px"}}>🏭 Fixed Plant</div>
      <div style={{background:`${C.muted}08`,border:`1px solid ${C.muted}22`,borderRadius:8,padding:"8px 11px",marginBottom:10,fontSize:11,color:C.muted}}>Filter blow & lube every 50 hrs · Belt inspection every 100 hrs · Manual hour tracking</div>
      {FIXED_PLANT.map(p=>{
        const od=p.tasks.filter(t=>{const l=fixedLog.filter(fl=>fl.plantId===p.id&&fl.taskId===t).sort((a,b)=>b.hrs-a.hrs)[0];const tk=FIXED_TASKS[t];if(!tk||!l)return true;return l.hrs+tk.interval-p.hours<=0;});
        const hasAlert=od.length>0;
        return <div key={p.id} style={{background:C.card,border:`1.5px solid ${hasAlert?C.danger+"44":C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:15}}>{p.name}</div><div style={{fontSize:11,color:C.muted}}>{p.type} · {p.hours.toLocaleString()} hrs</div></div>
            {hasAlert?<span style={{background:`${C.danger}20`,color:C.danger,border:`1px solid ${C.danger}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{od.length} OVERDUE</span>:<span style={{background:`${C.success}20`,color:C.success,border:`1px solid ${C.success}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>✓ OK</span>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

// ── Checks hub ─────────────────────────────────────────────────────────────
function ChecksHub({allMachines,catDemo,activeMine,activeShiftId,user}){
  const[active,setActive]=useState(null);
  const Bk=()=><button onClick={()=>setActive(null)} style={{margin:"10px 16px 0",background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 13px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",display:"block"}}>← Back</button>;
  if(active==="machine")    return <div><Bk/><MachineCheckScreen allMachines={allMachines} catDemo={catDemo} activeMine={activeMine} activeShiftId={activeShiftId} user={user}/></div>;
  if(active==="diag")       return <div><Bk/><DiagnosticsScreen allMachines={allMachines} catDemo={catDemo}/></div>;
  if(active==="maintenance")return <MaintenanceScreen allMachines={allMachines} catDemo={catDemo}/>;
  // Note: Site Area Check was removed — its data overlaps entirely with
  // Workplace Exam (which IS persisted to workplace_exams). Use the
  // Workplace Exam entry in the menu / Today screen instead.
  const MENU=[
    {id:"machine",    icon:"✅",title:"Daily Machine Check",sub:"HSMP pre-start · MQSHA Reg 2017 minimum",                  color:C.success},
    {id:"maintenance",icon:"🔧",title:"Maintenance Log",    sub:"Demo preview · logs from the pre-start gate when wired",  color:C.accent},
    {id:"diag",       icon:"⚙", title:"Machine Diagnostics",sub:"Demo preview · CAT VisionLink telemetry once connected",   color:C.amber},
  ];
  return <div style={{paddingBottom:80}}><PageHdr title="Checks & Maintenance"/>
    <div style={{padding:"14px 16px"}}>{MENU.map(m=><button key={m.id} onClick={()=>setActive(m.id)} style={{width:"100%",background:C.card,border:`1px solid ${m.color}33`,borderRadius:14,padding:"17px 15px",marginBottom:10,display:"flex",alignItems:"center",gap:13,textAlign:"left",cursor:"pointer"}}><div style={{width:50,height:50,borderRadius:13,background:`${m.color}18`,border:`2px solid ${m.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div><div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:17,color:C.text}}>{m.title}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.sub}</div></div><span style={{color:C.muted,fontSize:16}}>→</span></button>)}
    </div>
  </div>;
}

// ── Full Menu Overlay ──────────────────────────────────────────────────────



function MenuOverlay({user,onNav,onVehicleCheck,onClose,allMachines,activeMine}){
  const lv=ROLES[user?.role]?.level||1;
  const isAdmin=user?.role==="admin"||user?.role==="minemanager";
  const Section=({title,children})=><div style={{marginBottom:6}}>
    <div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",padding:"0 20px",marginBottom:8}}>{title}</div>
    {children}
  </div>;
  const Item=({icon,label,sub,color=C.text,onClick})=><button onClick={onClick} style={{width:"100%",background:"none",border:"none",borderBottom:`1px solid ${C.border}22`,padding:"14px 20px",display:"flex",alignItems:"center",gap:14,textAlign:"left",cursor:"pointer"}}>
    <span style={{fontSize:22,width:32,textAlign:"center"}}>{icon}</span>
    <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:700,fontSize:15,color}}>{label}</div>{sub&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{sub}</div>}</div>
    <span style={{color:C.muted,fontSize:14}}>›</span>
  </button>;

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",animation:"fadeIn .15s ease"}}>
    <div style={{background:C.surface,width:"88%",maxWidth:340,height:"100%",overflowY:"auto",animation:"slideRight .2s ease"}}>
      {/* Header */}
      <div style={{background:C.bg,padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.accent}}>MINEOPS</div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕ Close</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${ROLES[user?.role]?.color}22`,border:`2px solid ${ROLES[user?.role]?.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:14,color:ROLES[user?.role]?.color}}>{user?.avatar}</div>
          <div><div style={{fontFamily:F,fontWeight:700,fontSize:14}}>{user?.name}</div><div style={{fontSize:11,color:C.muted}}>{user?.employeeId} · {ROLES[user?.role]?.label}</div></div>
        </div>
      </div>

      <div style={{padding:"12px 0"}}>
        <Section title="Issues">
          <Item icon="🎟" label="Handover Tickets" sub="Open issues · machines needing attention" color={C.danger} onClick={()=>{onNav("tickets");onClose();}}/>
          <Item icon="🚨" label="Report Issue" sub="Create a new handover ticket" color={C.amber} onClick={()=>{onNav("reportIssue");onClose();}}/>
        </Section>

        {lv===1&&<Section title="Quick start">
          <Item icon="🗺" label="Workplace Exam" sub="MSHA · required before shift work" color={C.danger} onClick={()=>{onNav("workplaceExam");onClose();}}/>
          <Item icon="🧯" label="Fire Extinguishers" sub="MSHA monthly · per location" color="#ec4899" onClick={()=>{onNav("fireInspect");onClose();}}/>
        </Section>}

        <Section title="Other">
          <Item icon="🚗" label="Vehicle Check" sub="Company truck / ute inspection" color={C.accent} onClick={()=>{onVehicleCheck();onClose();}}/>
          {lv>=2&&<Item icon="✅" label="Checks Hub" sub="Pre-start · site area · diagnostics" color={C.success} onClick={()=>{onNav("checks");onClose();}}/>}
          {lv>=2&&<Item icon="🧯" label="Fire Extinguishers" sub="MSHA monthly inspection" color="#ec4899" onClick={()=>{onNav("fireInspect");onClose();}}/>}
          {lv>=2&&<Item icon="📋" label="Compliance" sub="Training · competent persons · SDS" color={C.info} onClick={()=>{onNav("comply");onClose();}}/>}
        </Section>

        <Section title="Mine">
          <Item icon="🔀" label="Switch Mine" sub={activeMine?.name?`Currently: ${activeMine.name}`:"Pick a different mine or add a new one"} color={C.info} onClick={()=>{onNav("minePicker");onClose();}}/>
          <Item icon="🔒" label="Compliance View" sub="Read-only records · for inspector handover" color={C.accent} onClick={()=>{onNav("compliance");onClose();}}/>
          <Item icon="👤" label="Account" sub="Profile · password · memberships · delete" onClick={()=>{onNav("account");onClose();}}/>
        </Section>

        {isAdmin&&<Section title="Admin">
          <Item icon="⚙" label="Setup" sub="Plants · areas · locations · fleet · integrations" onClick={()=>{onNav("setup");onClose();}}/>
        </Section>}

        <div style={{padding:"16px 20px",marginTop:4}}>
          <div style={{fontSize:11,color:C.muted,textAlign:"center",lineHeight:1.5}}>MineOps · {allMachines?.length||0} machine{(allMachines?.length||0)!==1?"s":""}<br/>MSHA 30 CFR Part 56 · CAT VisionLink AEMP 2.0</div>
        </div>
      </div>
    </div>
  </div>;
}

// ── Plants Admin Screen ───────────────────────────────────────────────────
function PlantsAdminScreen({activeMine,onBack}){
  const[plants,setPlants]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showCreate,setShowCreate]=useState(false);
  const[newName,setNewName]=useState("");const[newDesc,setNewDesc]=useState("");
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");
  const load=async()=>{
    if(!activeMine?.id){setLoading(false);return;}
    setLoading(true);
    const{data,error}=await supabase.from("plants").select("*").eq("mine_id",activeMine.id).order("created_at",{ascending:true});
    if(!error)setPlants(data||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[activeMine?.id]);
  const create=async()=>{
    if(!newName.trim()||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      const{error}=await supabase.from("plants").insert({mine_id:activeMine.id,name:newName.trim(),description:newDesc.trim()||null});
      if(error)throw error;
      setNewName("");setNewDesc("");setShowCreate(false);await load();
    }catch(e){setErr(e.message||"Could not create plant");}finally{setSaving(false);}
  };
  const archive=async(id)=>{
    if(!confirm("Archive this plant? Equipment assignments stay but the plant will be hidden from operators."))return;
    await supabase.from("plants").update({is_active:false}).eq("id",id);
    await load();
  };
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  return <div style={{paddingBottom:80}}>
    <PageHdr title="Plants" sub="Processing lines · crusher + screens + conveyors" back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      {loading?<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>:plants.length===0&&!showCreate?
        <div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"22px 16px",textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:42,marginBottom:8}}>🏭</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.accent,marginBottom:4}}>No plants yet</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:14}}>Plants group your processing equipment so operators know which line they're feeding.</div>
        </div>:null}
      {plants.map(p=>(
        <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px",marginBottom:8,opacity:p.is_active?1:0.5}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.text}}>{p.name}{!p.is_active&&<span style={{fontSize:10,color:C.muted,marginLeft:8}}>· archived</span>}</div>
              {p.description&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{p.description}</div>}
            </div>
            {p.is_active&&<button onClick={()=>archive(p.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Archive</button>}
          </div>
        </div>
      ))}
      {showCreate?
        <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:12,padding:"14px",marginTop:10}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:13,color:C.accent,marginBottom:10}}>New plant</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Name *</div>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Plant 1 — Primary Crushing" style={{...inp,marginBottom:10}}/>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Description (optional)</div>
          <input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="e.g. C1 + 2 screens + main conveyor" style={{...inp,marginBottom:10}}/>
          {err&&<div style={{fontSize:12,color:C.danger,marginBottom:8}}>⚠ {err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowCreate(false);setNewName("");setNewDesc("");setErr("");}} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancel</button>
            <button onClick={create} disabled={!newName.trim()||saving} style={{flex:1,background:newName.trim()?C.success:C.border,color:newName.trim()?"#000":C.muted,border:"none",borderRadius:9,padding:"11px",fontFamily:F,fontWeight:900,fontSize:13,cursor:newName.trim()?"pointer":"default"}}>{saving?"Saving…":"Create"}</button>
          </div>
        </div>:
        <button onClick={()=>setShowCreate(true)} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:16,cursor:"pointer",marginTop:10}}>+ Add Plant</button>
      }
    </div>
  </div>;
}
// ── Plant Picker (smart default, tap to change) ───────────────────────────
// ── Photo Upload Helper ───────────────────────────────────────────────────
async function uploadHandoverPhoto(file,mineId,ticketId,stage,userName){
  if(!file||!mineId||!ticketId)return null;
  const ext=(file.name||"photo.jpg").split(".").pop().toLowerCase();
  const path=`${mineId}/${ticketId}/${stage}-${Date.now()}.${ext}`;
  const{error:upErr}=await supabase.storage.from("handover").upload(path,file,{contentType:file.type||"image/jpeg",upsert:false});
  if(upErr){console.error("upload err:",upErr);return null;}
  const{data:auth}=await supabase.auth.getUser();
  const{error:insErr}=await supabase.from("handover_photos").insert({ticket_id:ticketId,storage_path:path,stage,uploaded_by:auth?.user?.id||null,uploaded_by_name:userName||null});
  if(insErr){console.error("photo row err:",insErr);return null;}
  return path;
}
async function getPhotoUrl(storagePath){
  if(!storagePath)return null;
  const{data}=await supabase.storage.from("handover").createSignedUrl(storagePath,3600);
  return data?.signedUrl||null;
}
// ── Check-photo Helpers ───────────────────────────────────────────────────
// Shared by Feature A (inline per-item evidence on checks) and Feature B
// (reference photo library). All photos client-side compressed to ≤1200px
// before upload to save storage and bandwidth.

async function compressImage(file,maxDim=1200,quality=0.85){
  if(!file)return null;
  // Skip compression for tiny files (already small).
  if(file.size<300_000&&!/heic|heif/i.test(file.type||""))return file;
  return await new Promise((resolve,reject)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const{width,height}=img;
      const scale=Math.min(1,maxDim/Math.max(width,height));
      const w=Math.max(1,Math.round(width*scale));
      const h=Math.max(1,Math.round(height*scale));
      const canvas=document.createElement("canvas");
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d");
      if(!ctx){reject(new Error("canvas 2d unavailable"));return;}
      ctx.drawImage(img,0,0,w,h);
      canvas.toBlob(blob=>{
        if(!blob){reject(new Error("toBlob failed"));return;}
        // Wrap as a File so callers can read .name / .type uniformly.
        const out=new File([blob],(file.name||"photo").replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"});
        resolve(out);
      },"image/jpeg",quality);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("image load failed"));};
    img.src=url;
  });
}

async function uploadCheckPhoto({file,mineId,logType,logId,itemKey,uploadedBy}){
  if(!file||!mineId||!logType||!logId||!itemKey)return null;
  let blob=file;
  try{blob=await compressImage(file);}catch(e){console.warn("compress failed, using original:",e);}
  const path=`${mineId}/${logType}/${logId}/${itemKey}_${Date.now()}.jpg`;
  const{error:upErr}=await supabase.storage.from("check-photos").upload(path,blob,{contentType:"image/jpeg",upsert:false});
  if(upErr){console.error("check-photo upload:",upErr);return null;}
  const{error:insErr}=await supabase.from("check_photos").insert({
    mine_id:mineId,log_id:logId,log_type:logType,item_key:itemKey,storage_path:path,uploaded_by:uploadedBy||null,
  });
  if(insErr){console.error("check_photos insert:",insErr);}
  return path;
}
async function getCheckPhotoUrl(storagePath){
  if(!storagePath)return null;
  const{data}=await supabase.storage.from("check-photos").createSignedUrl(storagePath,3600);
  return data?.signedUrl||null;
}

async function uploadReferencePhoto({file,mineId,machineModel,itemKey,caption,uploadedBy,uploadedByName}){
  if(!file||!mineId||!machineModel||!itemKey)return null;
  let blob=file;
  try{blob=await compressImage(file);}catch(e){console.warn("compress failed, using original:",e);}
  // Sanitise machine_model so it's path-safe.
  const safeModel=(machineModel||"unknown").replace(/[^a-zA-Z0-9._-]+/g,"_");
  const path=`${mineId}/${safeModel}/${itemKey}/${Date.now()}.jpg`;
  const{error:upErr}=await supabase.storage.from("reference-photos").upload(path,blob,{contentType:"image/jpeg",upsert:false});
  if(upErr){console.error("ref-photo upload:",upErr);return null;}
  const{error:insErr}=await supabase.from("reference_photos").insert({
    mine_id:mineId,machine_model:machineModel,item_key:itemKey,storage_path:path,caption:caption||null,
    uploaded_by:uploadedBy||null,uploaded_by_name:uploadedByName||null,
  });
  if(insErr){console.error("reference_photos insert:",insErr);}
  return path;
}
async function getReferencePhotoUrl(storagePath){
  if(!storagePath)return null;
  const{data}=await supabase.storage.from("reference-photos").createSignedUrl(storagePath,3600);
  return data?.signedUrl||null;
}

// ── Photo-required defaults ───────────────────────────────────────────────
// First-deployment defaults — per-mine overrides live in check_item_config.
// Operators see a "📷 Required" badge on these and can't sign off without
// a captured photo.
const PHOTO_REQUIRED_DEFAULTS={
  prestart:{
    oil:true, coolant:true, hyd:true, fuel:true, fire:true,
    brakes:false, tyres:false, lights:false, horn:false, rops:false,
  },
  maintenance:{grease:false, filter:true, service:false},
  workplace_exam:{},
  fire_ext:{},
};

function isPhotoRequired(logType,itemKey,overrides){
  const key=`${logType}:${itemKey}`;
  if(overrides&&overrides.has(key))return !!overrides.get(key);
  return !!(PHOTO_REQUIRED_DEFAULTS[logType]?.[itemKey]);
}

// Hook: load per-mine overrides into a Map keyed by `${logType}:${itemKey}`.
function useCheckItemConfig(activeMine,refreshTick){
  const[overrides,setOverrides]=useState(()=>new Map());
  useEffect(()=>{
    if(!activeMine?.id){setOverrides(new Map());return;}
    let cancelled=false;
    (async()=>{
      try{
        const{data}=await supabase.from("check_item_config").select("log_type,item_key,photo_required").eq("mine_id",activeMine.id);
        if(cancelled)return;
        const m=new Map();
        for(const r of data||[])m.set(`${r.log_type}:${r.item_key}`,!!r.photo_required);
        setOverrides(m);
      }catch(e){console.error("check_item_config:",e);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,refreshTick]);
  return overrides;
}

// ── Check Item Config Screen (admin) ──────────────────────────────────────
// Lists every known check item across prestart + maintenance, with a toggle
// to flip photo_required. Writes upserts to check_item_config; falls back to
// PHOTO_REQUIRED_DEFAULTS when no override exists.
const CHECK_ITEM_GROUPS=[
  {logType:"prestart",     label:"Pre-Start Inspection",        items:PRESTART.map(p=>({key:p.id,label:p.label}))},
  {logType:"maintenance",  label:"Maintenance Gate",            items:[{key:"grease",label:"Greasing"},{key:"filter",label:"Air Filter Blow-Out"},{key:"service",label:"Scheduled Service"}]},
];

function CheckItemConfigScreen({activeMine,onBack}){
  const[refresh,setRefresh]=useState(0);
  const overrides=useCheckItemConfig(activeMine,refresh);
  const[saving,setSaving]=useState(null); // key currently saving
  const setRequired=async(logType,itemKey,nextVal)=>{
    if(!activeMine?.id)return;
    const k=`${logType}:${itemKey}`;
    setSaving(k);
    try{
      const{error}=await supabase.from("check_item_config").upsert({
        mine_id:activeMine.id,log_type:logType,item_key:itemKey,
        photo_required:nextVal,updated_at:new Date().toISOString(),
      },{onConflict:"mine_id,log_type,item_key"});
      if(error)throw error;
      setRefresh(t=>t+1);
    }catch(e){console.error("config update:",e);alert("Could not save: "+(e.message||e));}
    finally{setSaving(null);}
  };
  return<div style={{paddingBottom:80}}>
    <PageHdr title="Check Item Configuration" sub="Toggle photo-required per check item · admin only" back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"10px 12px",marginBottom:14,fontSize:12,color:C.textSub,lineHeight:1.5}}>
        Items marked <b style={{color:C.danger}}>Required</b> block the operator from signing off the check until a photo is captured. Use this for items where evidence matters (fluids, filters, etc.).
      </div>
      {CHECK_ITEM_GROUPS.map(g=><div key={g.logType} style={{marginBottom:16}}>
        <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 8px"}}>{g.label}</div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
          {g.items.map((it,i)=>{
            const k=`${g.logType}:${it.key}`;
            const required=isPhotoRequired(g.logType,it.key,overrides);
            const isSaving=saving===k;
            return<div key={it.key} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<g.items.length-1?`1px solid ${C.border}22`:"none"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.label}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{it.key} · default {PHOTO_REQUIRED_DEFAULTS[g.logType]?.[it.key]?"required":"optional"}</div>
              </div>
              <button onClick={()=>setRequired(g.logType,it.key,!required)} disabled={isSaving}
                style={{background:required?C.danger:C.border,color:required?"#000":C.muted,border:"none",borderRadius:99,padding:"4px 12px",fontFamily:F,fontWeight:700,fontSize:11,cursor:isSaving?"default":"pointer",minWidth:90,letterSpacing:".04em",opacity:isSaving?0.5:1}}>
                {isSaving?"…":required?"📷 REQUIRED":"OPTIONAL"}
              </button>
            </div>;
          })}
        </div>
      </div>)}
    </div>
  </div>;
}

// ── Severity Picker (1-5) ─────────────────────────────────────────────────
function SeverityPicker({value,onChange}){
  const colors=[C.info,C.success,C.amber,"#e07c2e",C.danger];
  const labels=["Info","Minor","Notable","Major","Critical"];
  return <div style={{display:"flex",gap:6,marginBottom:10}}>
    {[1,2,3,4,5].map(n=>{
      const sel=value===n;
      return <button key={n} onClick={()=>onChange(n)} style={{flex:1,background:sel?colors[n-1]:"transparent",border:`2px solid ${colors[n-1]}`,borderRadius:10,padding:"10px 4px",cursor:"pointer",transition:"all .15s"}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:sel?"#000":colors[n-1]}}>{n}</div>
        <div style={{fontSize:9,color:sel?"#000":C.muted,fontFamily:F,fontWeight:700,marginTop:2}}>{labels[n-1]}</div>
      </button>;
    })}
  </div>;
}
// ── Create Ticket Screen ──────────────────────────────────────────────────
function CreateTicketScreen({activeMine,activeShiftId,user,allMachines,defaultMachineId,onDone,onBack}){
  const[machineId,setMachineId]=useState(defaultMachineId||"");
  const[severity,setSeverity]=useState(2);
  const[description,setDescription]=useState("");
  const[photos,setPhotos]=useState([]);
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const fileRef=useRef(null);const camRef=useRef(null);
  const onPickFiles=e=>{
    const list=Array.from(e.target.files||[]);
    setPhotos(p=>[...p,...list].slice(0,8));
    e.target.value="";
  };
  const removePhoto=i=>setPhotos(p=>p.filter((_,idx)=>idx!==i));
  const valid=machineId&&description.trim().length>=10;
  const save=async()=>{
    if(!valid||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      // Detect maintenance presence
      const{data:maint}=await supabase.from("operators").select("id").eq("mine_id",activeMine.id).eq("role","maintenance").eq("status","active").limit(1);
      const assigned=(maint&&maint.length>0)?"maintenance":"next_operator";
      const{data:auth}=await supabase.auth.getUser();
      const{data:tk,error:tkErr}=await supabase.from("handover_tickets").insert({
        mine_id:activeMine.id,
        machine_id:machineId,
        shift_id:activeShiftId||null,
        created_by:auth?.user?.id||null,
        created_by_name:user?.name||null,
        description:description.trim(),
        severity,
        status:"open",
        assigned_to:assigned,
      }).select().single();
      if(tkErr)throw tkErr;
      // Upload photos
      for(const f of photos){
        await uploadHandoverPhoto(f,activeMine.id,tk.id,"original",user?.name);
      }
      onDone&&onDone(tk);
    }catch(e){console.error("create ticket:",e);setErr(e.message||"Could not create ticket");}finally{setSaving(false);}
  };
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  return <div style={{paddingBottom:80}}>
    <PageHdr title="Report Issue" sub="Create handover ticket — photos + severity" back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Machine *</div>
      <select value={machineId} onChange={e=>setMachineId(e.target.value)} style={{...inp,marginBottom:14}}>
        <option value="">— Select machine —</option>
        {(allMachines||[]).map(m=><option key={m.id} value={m.id}>{m.model} {m.id?`(${m.id})`:""}</option>)}
      </select>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Severity *</div>
      <SeverityPicker value={severity} onChange={setSeverity}/>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Description *</div>
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What's the issue? Be specific — location, symptom, when it started…" rows={4} style={{...inp,marginBottom:14,resize:"vertical",fontFamily:"inherit"}}/>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Photos ({photos.length}/8)</div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>camRef.current?.click()} style={{flex:1,background:C.card,border:`1px solid ${C.accent}55`,borderRadius:10,padding:"12px",color:C.accent,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>📷 Camera</button>
        <button onClick={()=>fileRef.current?.click()} style={{flex:1,background:C.card,border:`1px solid ${C.info}55`,borderRadius:10,padding:"12px",color:C.info,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>⬆ Upload</button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" multiple style={{display:"none"}} onChange={onPickFiles}/>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={onPickFiles}/>
      </div>
      {photos.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
        {photos.map((f,i)=>(
          <div key={i} style={{position:"relative",aspectRatio:"1/1",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
            <img src={URL.createObjectURL(f)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <button onClick={()=>removePhoto(i)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:22,height:22,color:"#fff",fontSize:12,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
        ))}
      </div>}
      {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}33`,borderRadius:9,padding:"10px 13px",marginBottom:10,color:C.danger,fontSize:13,fontFamily:F,fontWeight:700}}>⚠ {err}</div>}
      <button onClick={save} disabled={!valid||saving} style={{width:"100%",background:valid?`linear-gradient(135deg,${C.accent},#d4881e)`:C.border,color:valid?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:16,cursor:valid?"pointer":"default"}}>
        {saving?"Saving…":valid?"Submit Ticket →":"Pick machine + description (10+ chars)"}
      </button>
    </div>
  </div>;
}
// ── Ticket List Screen ────────────────────────────────────────────────────
function HandoverTicketsScreen({activeMine,user,allMachines,onCreate,onSelect,onBack}){
  const[tickets,setTickets]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState("open"); // open | all | closed
  const isMaint=user?.role==="maintenance"||user?.role==="supervisor"||user?.role==="minemanager"||user?.role==="admin";
  const load=async()=>{
    if(!activeMine?.id){setLoading(false);return;}
    setLoading(true);
    let q=supabase.from("handover_tickets").select("*").eq("mine_id",activeMine.id).order("created_at",{ascending:false});
    if(!isMaint&&user?.machine)q=q.eq("machine_id",user.machine);
    if(filter==="open")q=q.in("status",["open","in_progress","awaiting_verification"]);
    else if(filter==="closed")q=q.eq("status","closed");
    const{data,error}=await q;
    if(!error)setTickets(data||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[activeMine?.id,filter,user?.machine]);
  const sevColor=n=>[C.info,C.success,C.amber,"#e07c2e",C.danger][n-1]||C.muted;
  const statusColor=s=>({open:C.danger,in_progress:C.amber,awaiting_verification:C.info,closed:C.success}[s]||C.muted);
  const statusLabel=s=>({open:"OPEN",in_progress:"IN PROGRESS",awaiting_verification:"NEEDS VERIFY",closed:"CLOSED"}[s]||s.toUpperCase());
  const machineModel=id=>allMachines?.find(m=>m.id===id)?.model||id;
  return <div style={{paddingBottom:80}}>
    <PageHdr title="Handover Tickets" sub={isMaint?"All machines · mine-wide":"Your machine · open issues"} back onBack={onBack}/>
    <div style={{padding:"12px 16px 0",display:"flex",gap:6}}>
      {[["open","Open"],["all","All"],["closed","Closed"]].map(([k,l])=>(
        <button key={k} onClick={()=>setFilter(k)} style={{flex:1,background:filter===k?C.accent:C.card,color:filter===k?"#000":C.muted,border:`1px solid ${filter===k?C.accent:C.border}`,borderRadius:8,padding:"7px",fontFamily:F,fontWeight:700,fontSize:11,cursor:"pointer"}}>{l}</button>
      ))}
    </div>
    <div style={{padding:"12px 16px"}}>
      <button onClick={onCreate} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:12,padding:"13px",fontFamily:F,fontWeight:900,fontSize:14,cursor:"pointer",marginBottom:12}}>+ Report Issue</button>
      {loading?<div style={{textAlign:"center",padding:30,color:C.muted}}>Loading…</div>:
       tickets.length===0?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>No tickets {filter==="open"?"open":filter==="closed"?"closed":""}.</div>:
       tickets.map(t=>(
         <div key={t.id} onClick={()=>onSelect(t)} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${sevColor(t.severity)}`,borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer"}}>
           <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
             <div style={{flex:1}}>
               <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.text}}>{machineModel(t.machine_id)} <span style={{color:sevColor(t.severity),fontSize:12,marginLeft:6}}>Sev {t.severity}</span></div>
               <div style={{fontSize:11,color:C.muted,marginTop:2}}>{new Date(t.created_at).toLocaleString()} · {t.created_by_name||"Unknown"}</div>
             </div>
             <Pill label={statusLabel(t.status)} color={statusColor(t.status)}/>
           </div>
           <div style={{fontSize:13,color:C.textSub,lineHeight:1.4}}>{t.description.length>120?t.description.slice(0,120)+"…":t.description}</div>
         </div>
       ))}
    </div>
  </div>;
}
// ── Ticket Detail Screen ──────────────────────────────────────────────────
function TicketDetailScreen({ticketId,activeMine,user,allMachines,onBack}){
  const[ticket,setTicket]=useState(null);
  const[photos,setPhotos]=useState([]);
  const[photoUrls,setPhotoUrls]=useState({});
  const[loading,setLoading]=useState(true);
  const[newPhotos,setNewPhotos]=useState([]);
  const[newStage,setNewStage]=useState("in_progress");
  const[resolutionNotes,setResolutionNotes]=useState("");
  const[saving,setSaving]=useState(false);
  const fileRef=useRef(null);const camRef=useRef(null);
  const load=async()=>{
    setLoading(true);
    const{data:tk}=await supabase.from("handover_tickets").select("*").eq("id",ticketId).maybeSingle();
    const{data:ph}=await supabase.from("handover_photos").select("*").eq("ticket_id",ticketId).order("created_at");
    setTicket(tk);setPhotos(ph||[]);
    // Generate signed URLs
    const urls={};
    for(const p of (ph||[])){
      urls[p.id]=await getPhotoUrl(p.storage_path);
    }
    setPhotoUrls(urls);
    setLoading(false);
  };
  useEffect(()=>{load();},[ticketId]);
  if(loading||!ticket)return <div style={{padding:40,textAlign:"center",color:C.muted}}>Loading…</div>;
  const sevColor=[C.info,C.success,C.amber,"#e07c2e",C.danger][ticket.severity-1];
  const statusColor=({open:C.danger,in_progress:C.amber,awaiting_verification:C.info,closed:C.success})[ticket.status]||C.muted;
  const machineModel=allMachines?.find(m=>m.id===ticket.machine_id)?.model||ticket.machine_id;
  const canClose=ticket.status!=="closed";
  const addUpdate=async()=>{
    if(newPhotos.length===0&&!resolutionNotes.trim())return;
    setSaving(true);
    try{
      for(const f of newPhotos){
        await uploadHandoverPhoto(f,activeMine.id,ticket.id,newStage,user?.name);
      }
      const updates={updated_at:new Date().toISOString()};
      if(newStage==="in_progress"&&ticket.status==="open")updates.status="in_progress";
      if(newStage==="fix"&&ticket.status!=="closed")updates.status="awaiting_verification";
      await supabase.from("handover_tickets").update(updates).eq("id",ticket.id);
      setNewPhotos([]);setResolutionNotes("");
      await load();
    }catch(e){console.error(e);}finally{setSaving(false);}
  };
  const closeTicket=async(verified)=>{
    if(!confirm(verified?"Mark as fixed and close? You're verifying the issue is resolved.":"Close ticket without verification?"))return;
    setSaving(true);
    try{
      // Upload verification photos if any
      for(const f of newPhotos){
        await uploadHandoverPhoto(f,activeMine.id,ticket.id,"verification",user?.name);
      }
      const{data:auth}=await supabase.auth.getUser();
      await supabase.from("handover_tickets").update({
        status:"closed",
        closed_by:auth?.user?.id||null,
        closed_by_name:user?.name||null,
        closed_at:new Date().toISOString(),
        resolution_notes:resolutionNotes.trim()||null,
      }).eq("id",ticket.id);
      onBack&&onBack();
    }catch(e){console.error(e);}finally{setSaving(false);}
  };
  const stageLabel={original:"Original Issue",in_progress:"In Progress",fix:"Fix Applied",verification:"Verified"};
  const stageColor={original:C.danger,in_progress:C.amber,fix:C.info,verification:C.success};
  const grouped=photos.reduce((acc,p)=>{(acc[p.stage]=acc[p.stage]||[]).push(p);return acc;},{});
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  return <div style={{paddingBottom:80}}>
    <PageHdr title={`Sev ${ticket.severity} · ${machineModel}`} sub={`Created ${new Date(ticket.created_at).toLocaleString()}`} back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <Pill label={({open:"OPEN",in_progress:"IN PROGRESS",awaiting_verification:"NEEDS VERIFY",closed:"CLOSED"})[ticket.status]} color={statusColor}/>
        <Pill label={`SEV ${ticket.severity}`} color={sevColor}/>
        <Pill label={ticket.assigned_to==="maintenance"?"MAINTENANCE":"NEXT OPERATOR"} color={C.info}/>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:C.muted,fontFamily:F,fontWeight:700,marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Reported by {ticket.created_by_name||"Unknown"}</div>
        <div style={{fontSize:14,color:C.text,lineHeight:1.5}}>{ticket.description}</div>
      </div>
      {ticket.resolution_notes&&<div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:C.success,fontFamily:F,fontWeight:700,marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Resolution · {ticket.closed_by_name||""}</div>
        <div style={{fontSize:13,color:C.textSub,lineHeight:1.5}}>{ticket.resolution_notes}</div>
      </div>}
      {["original","in_progress","fix","verification"].map(stage=>grouped[stage]&&grouped[stage].length>0&&(
        <div key={stage} style={{marginBottom:14}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:stageColor[stage],letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>{stageLabel[stage]}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {grouped[stage].map(p=>photoUrls[p.id]?
              <a key={p.id} href={photoUrls[p.id]} target="_blank" rel="noopener" style={{display:"block",aspectRatio:"1/1",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
                <img src={photoUrls[p.id]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              </a>:
              <div key={p.id} style={{aspectRatio:"1/1",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.muted}}>Loading…</div>
            )}
          </div>
        </div>
      ))}
      {canClose&&<>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,marginTop:8}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.accent,marginBottom:10}}>Add Update</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Stage</div>
          <select value={newStage} onChange={e=>setNewStage(e.target.value)} style={{...inp,marginBottom:10}}>
            <option value="in_progress">Working on it</option>
            <option value="fix">Fix applied</option>
          </select>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button onClick={()=>camRef.current?.click()} style={{flex:1,background:C.card,border:`1px solid ${C.accent}55`,borderRadius:10,padding:"11px",color:C.accent,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>📷 Camera</button>
            <button onClick={()=>fileRef.current?.click()} style={{flex:1,background:C.card,border:`1px solid ${C.info}55`,borderRadius:10,padding:"11px",color:C.info,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>⬆ Upload</button>
            <input ref={camRef} type="file" accept="image/*" capture="environment" multiple style={{display:"none"}} onChange={e=>{setNewPhotos(p=>[...p,...Array.from(e.target.files||[])]);e.target.value="";}}/>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{setNewPhotos(p=>[...p,...Array.from(e.target.files||[])]);e.target.value="";}}/>
          </div>
          {newPhotos.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
            {newPhotos.map((f,i)=>(
              <div key={i} style={{position:"relative",aspectRatio:"1/1",background:C.surface,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
                <img src={URL.createObjectURL(f)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <button onClick={()=>setNewPhotos(p=>p.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:22,height:22,color:"#fff",fontSize:12,cursor:"pointer"}}>×</button>
              </div>
            ))}
          </div>}
          <button onClick={addUpdate} disabled={saving||(newPhotos.length===0)} style={{width:"100%",background:newPhotos.length>0?C.info:C.border,color:newPhotos.length>0?"#000":C.muted,border:"none",borderRadius:10,padding:"12px",fontFamily:F,fontWeight:900,fontSize:14,cursor:newPhotos.length>0?"pointer":"default",marginBottom:14}}>
            {saving?"Saving…":"Add Update"}
          </button>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Resolution notes (optional)</div>
            <textarea value={resolutionNotes} onChange={e=>setResolutionNotes(e.target.value)} placeholder="What was the fix?" rows={2} style={{...inp,marginBottom:10,resize:"vertical",fontFamily:"inherit"}}/>
            <button onClick={()=>closeTicket(true)} disabled={saving} style={{width:"100%",background:C.success,color:"#000",border:"none",borderRadius:12,padding:"13px",fontFamily:F,fontWeight:900,fontSize:15,cursor:"pointer"}}>
              {saving?"Closing…":"✓ Verify & Close Ticket"}
            </button>
          </div>
        </div>
      </>}
    </div>
  </div>;
}
// ── Workplace Areas Admin (settings) ──────────────────────────────────────
function WorkplaceAreasAdminScreen({activeMine,onBack}){
  const[areas,setAreas]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showCreate,setShowCreate]=useState(false);
  const[newName,setNewName]=useState("");const[newDesc,setNewDesc]=useState("");
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");
  const load=async()=>{
    if(!activeMine?.id){setLoading(false);return;}
    setLoading(true);
    const{data,error}=await supabase.from("workplace_areas").select("*").eq("mine_id",activeMine.id).order("created_at",{ascending:true});
    if(!error)setAreas(data||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[activeMine?.id]);
  const create=async()=>{
    if(!newName.trim()||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      const{error}=await supabase.from("workplace_areas").insert({mine_id:activeMine.id,name:newName.trim(),description:newDesc.trim()||null});
      if(error)throw error;
      setNewName("");setNewDesc("");setShowCreate(false);await load();
    }catch(e){setErr(e.message||"Could not create area");}finally{setSaving(false);}
  };
  const archive=async(id)=>{
    if(!confirm("Archive this area? Operators won't see it in the picker anymore."))return;
    await supabase.from("workplace_areas").update({is_active:false}).eq("id",id);
    await load();
  };
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  return <div style={{paddingBottom:80}}>
    <PageHdr title="Workplace Areas" sub="Pit benches · crusher stations · haul roads · plant areas" back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      {loading?<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>:areas.length===0&&!showCreate?
        <div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"22px 16px",textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:42,marginBottom:8}}>��</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.accent,marginBottom:4}}>No areas defined yet</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:14}}>Define the working areas operators inspect each shift. Examples: "Pit 1 Bench 3", "Crusher Station", "Main Haul Road".</div>
        </div>:null}
      {areas.map(a=>(
        <div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px",marginBottom:8,opacity:a.is_active?1:0.5}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.text}}>{a.name}{!a.is_active&&<span style={{fontSize:10,color:C.muted,marginLeft:8}}>· archived</span>}</div>
              {a.description&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{a.description}</div>}
            </div>
            {a.is_active&&<button onClick={()=>archive(a.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Archive</button>}
          </div>
        </div>
      ))}
      {showCreate?
        <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:12,padding:"14px",marginTop:10}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:13,color:C.accent,marginBottom:10}}>New area</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Name *</div>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Pit 1 Bench 3" style={{...inp,marginBottom:10}}/>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Description (optional)</div>
          <input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="e.g. North wall · active mining" style={{...inp,marginBottom:10}}/>
          {err&&<div style={{fontSize:12,color:C.danger,marginBottom:8}}>⚠ {err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowCreate(false);setNewName("");setNewDesc("");setErr("");}} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancel</button>
            <button onClick={create} disabled={!newName.trim()||saving} style={{flex:1,background:newName.trim()?C.success:C.border,color:newName.trim()?"#000":C.muted,border:"none",borderRadius:9,padding:"11px",fontFamily:F,fontWeight:900,fontSize:13,cursor:newName.trim()?"pointer":"default"}}>{saving?"Saving…":"Create"}</button>
          </div>
        </div>:
        <button onClick={()=>setShowCreate(true)} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:16,cursor:"pointer",marginTop:10}}>+ Add Area</button>
      }
    </div>
  </div>;
}
// ── Workplace Exam Screen (MSHA daily inspection) ─────────────────────────
function WorkplaceExamScreen({activeMine,activeShiftId,user,onComplete,onBack}){
  const[areas,setAreas]=useState([]);
  const[loading,setLoading]=useState(true);
  const[areaId,setAreaId]=useState("");
  const[customArea,setCustomArea]=useState("");
  const[useCustom,setUseCustom]=useState(false);
  const[existingExam,setExistingExam]=useState(null); // exam from earlier today by someone else
  const[checks,setChecks]=useState({ground:null,walls:null,equipment:null,access:null,housekeeping:null});
  const[taskKnown,setTaskKnown]=useState(null);
  const[areaSafe,setAreaSafe]=useState(null);
  const[findings,setFindings]=useState("none");
  const[findingsDetail,setFindingsDetail]=useState("");
  const[corrective,setCorrective]=useState("");
  const[reportedTo,setReportedTo]=useState("");
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  // Load areas list
  useEffect(()=>{
    if(!activeMine?.id){setLoading(false);return;}
    (async()=>{
      const{data}=await supabase.from("workplace_areas").select("*").eq("mine_id",activeMine.id).eq("is_active",true).order("name");
      setAreas(data||[]);
      setLoading(false);
    })();
  },[activeMine?.id]);
  // When area changes, check for an existing exam today
  useEffect(()=>{
    if(!activeMine?.id)return;
    const areaName=useCustom?customArea.trim():(areas.find(a=>a.id===areaId)?.name||"");
    if(!areaName){setExistingExam(null);return;}
    (async()=>{
      const since=new Date();since.setHours(0,0,0,0);
      const{data}=await supabase.from("workplace_exams")
        .select("*").eq("mine_id",activeMine.id)
        .eq("area",areaName)
        .gte("examined_at",since.toISOString())
        .order("examined_at",{ascending:false})
        .limit(1);
      setExistingExam((data&&data.length>0)?data[0]:null);
    })();
  },[areaId,customArea,useCustom,activeMine?.id]);
  const checkItems=[
    {key:"ground",label:"Ground conditions",sub:"Floor stability · slip/trip hazards · drainage"},
    {key:"walls",label:"Walls / highwall / face",sub:"Loose material · cracks · proper angles"},
    {key:"equipment",label:"Equipment & guarding",sub:"Guards in place · emergency stops · barricades"},
    {key:"access",label:"Access & egress",sub:"Clear escape routes · safe travel paths"},
    {key:"housekeeping",label:"Housekeeping",sub:"Spills · debris · tools · stored materials"},
  ];
  const acknowledgePrior=async()=>{
    if(!existingExam||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      const areaName=useCustom?customArea.trim():(areas.find(a=>a.id===areaId)?.name||"");
      const{data:auth}=await supabase.auth.getUser();
      const{error}=await supabase.from("workplace_exams").insert({
        mine_id:activeMine.id,
        shift_id:activeShiftId||null,
        operator_id:auth?.user?.id||null,
        operator_name:user?.name||null,
        area:areaName,
        area_id:useCustom?null:(areaId||null),
        acknowledged_exam_id:existingExam.id,
        task_known:true,
        area_safe:true,
        findings:"none",
        regulator:"msha",
      });
      if(error)throw error;
      onComplete&&onComplete();
    }catch(e){setErr(e.message||"Could not acknowledge");}finally{setSaving(false);}
  };
  const areaName=useCustom?customArea.trim():(areas.find(a=>a.id===areaId)?.name||"");
  const allChecksDone=Object.values(checks).every(v=>v!==null);
  const findingsOk=findings==="none"||(findingsDetail.trim()&&corrective.trim());
  const valid=areaName&&allChecksDone&&taskKnown!==null&&areaSafe!==null&&findingsOk;
  const submit=async()=>{
    if(!valid||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      const{data:auth}=await supabase.auth.getUser();
      const{error}=await supabase.from("workplace_exams").insert({
        mine_id:activeMine.id,
        shift_id:activeShiftId||null,
        operator_id:auth?.user?.id||null,
        operator_name:user?.name||null,
        area:areaName,
        area_id:useCustom?null:(areaId||null),
        task_known:taskKnown,
        area_safe:areaSafe,
        conditions_checked:checks,
        findings,
        findings_detail:findings==="adverse"?findingsDetail.trim():null,
        corrective_action:findings==="adverse"?corrective.trim():null,
        reported_to:findings==="adverse"?reportedTo.trim()||null:null,
        regulator:"msha",
      });
      if(error)throw error;
      onComplete&&onComplete();
    }catch(e){setErr(e.message||"Could not save exam");}finally{setSaving(false);}
  };
  const YesNo=({value,onChange,danger})=>(<div style={{display:"flex",gap:8,marginBottom:10}}>
    <button onClick={()=>onChange(true)} style={{flex:1,background:value===true?C.success:"transparent",color:value===true?"#000":C.success,border:`2px solid ${C.success}`,borderRadius:10,padding:"10px",fontFamily:F,fontWeight:900,fontSize:14,cursor:"pointer"}}>✓ Yes</button>
    <button onClick={()=>onChange(false)} style={{flex:1,background:value===false?(danger?C.danger:C.amber):"transparent",color:value===false?"#000":(danger?C.danger:C.amber),border:`2px solid ${danger?C.danger:C.amber}`,borderRadius:10,padding:"10px",fontFamily:F,fontWeight:900,fontSize:14,cursor:"pointer"}}>✗ No</button>
  </div>);
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  if(loading)return <div style={{padding:40,textAlign:"center",color:C.muted}}>Loading…</div>;
  return <div style={{paddingBottom:80}}>
    <PageHdr title="Workplace Exam" sub="MSHA 30 CFR § 56.18002 daily inspection" back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Working Area *</div>
      {areas.length>0&&!useCustom&&<select value={areaId} onChange={e=>setAreaId(e.target.value)} style={{...inp,marginBottom:8}}>
        <option value="">— Select area —</option>
        {areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </select>}
      {useCustom&&<input value={customArea} onChange={e=>setCustomArea(e.target.value)} placeholder="Describe the area" style={{...inp,marginBottom:8}}/>}
      <button onClick={()=>{setUseCustom(c=>!c);setAreaId("");setCustomArea("");}} style={{background:"none",border:"none",color:C.info,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer",marginBottom:14}}>{useCustom?"← Pick from list instead":"Or enter a custom area →"}</button>
      {existingExam&&areaName&&<div style={{background:`${C.success}10`,border:`1px solid ${C.success}44`,borderRadius:12,padding:"14px",marginBottom:16}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:13,color:C.success,marginBottom:6}}>✓ Already examined today</div>
        <div style={{fontSize:12,color:C.textSub,lineHeight:1.5,marginBottom:10}}>
          <strong>{existingExam.operator_name||"Someone"}</strong> signed off this area at {new Date(existingExam.examined_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}.
          {existingExam.findings==="adverse"&&<div style={{color:C.amber,marginTop:6}}>⚠ They flagged adverse conditions: {existingExam.findings_detail}</div>}
        </div>
        <button onClick={acknowledgePrior} disabled={saving} style={{width:"100%",background:C.success,color:"#000",border:"none",borderRadius:10,padding:"12px",fontFamily:F,fontWeight:900,fontSize:14,cursor:"pointer"}}>{saving?"Saving…":"✓ Acknowledge — Conditions Still Safe"}</button>
        <div style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:6}}>Or complete a full exam below if conditions changed</div>
      </div>}
      {areaName&&<>
        <div style={{fontSize:11,color:C.muted,marginBottom:8,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Conditions Check *</div>
        {checkItems.map(item=>{
          const v=checks[item.key];
          return <div key={item.key} style={{background:C.card,border:`1px solid ${v===false?C.danger+"55":v===true?C.success+"55":C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:14,color:C.text,marginBottom:2}}>{item.label}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{item.sub}</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setChecks(p=>({...p,[item.key]:true}))} style={{flex:1,background:v===true?C.success:"transparent",color:v===true?"#000":C.success,border:`1.5px solid ${C.success}`,borderRadius:8,padding:"7px",fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer"}}>OK</button>
              <button onClick={()=>setChecks(p=>({...p,[item.key]:false}))} style={{flex:1,background:v===false?C.danger:"transparent",color:v===false?"#000":C.danger,border:`1.5px solid ${C.danger}`,borderRadius:8,padding:"7px",fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer"}}>Adverse</button>
            </div>
          </div>;
        })}
        <div style={{fontSize:11,color:C.muted,marginTop:14,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Do you know the task you're about to perform? *</div>
        <YesNo value={taskKnown} onChange={setTaskKnown}/>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Is the area safe to perform the task? *</div>
        <YesNo value={areaSafe} onChange={setAreaSafe} danger/>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Overall Findings</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <button onClick={()=>setFindings("none")} style={{flex:1,background:findings==="none"?C.success:"transparent",color:findings==="none"?"#000":C.success,border:`2px solid ${C.success}`,borderRadius:10,padding:"10px",fontFamily:F,fontWeight:900,fontSize:13,cursor:"pointer"}}>No issues</button>
          <button onClick={()=>setFindings("adverse")} style={{flex:1,background:findings==="adverse"?C.danger:"transparent",color:findings==="adverse"?"#000":C.danger,border:`2px solid ${C.danger}`,borderRadius:10,padding:"10px",fontFamily:F,fontWeight:900,fontSize:13,cursor:"pointer"}}>Adverse condition found</button>
        </div>
        {findings==="adverse"&&<>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Describe the adverse condition *</div>
          <textarea value={findingsDetail} onChange={e=>setFindingsDetail(e.target.value)} placeholder="What's wrong? Be specific about location and hazard." rows={2} style={{...inp,marginBottom:10,resize:"vertical",fontFamily:"inherit"}}/>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Corrective action taken *</div>
          <textarea value={corrective} onChange={e=>setCorrective(e.target.value)} placeholder="What did you do about it? (Barricaded · reported · removed · etc.)" rows={2} style={{...inp,marginBottom:10,resize:"vertical",fontFamily:"inherit"}}/>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Reported to (optional)</div>
          <input value={reportedTo} onChange={e=>setReportedTo(e.target.value)} placeholder="Supervisor or competent person name" style={{...inp,marginBottom:14}}/>
        </>}
        {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}33`,borderRadius:9,padding:"10px 13px",marginBottom:10,color:C.danger,fontSize:13,fontFamily:F,fontWeight:700}}>⚠ {err}</div>}
        <button onClick={submit} disabled={!valid||saving} style={{width:"100%",background:valid?(areaSafe===false?C.danger:C.success):C.border,color:valid?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:16,cursor:valid?"pointer":"default"}}>
          {saving?"Saving…":valid?(areaSafe===false?"⛔ Submit — DO NOT WORK":"✓ Submit Exam"):"Complete all required items"}
        </button>
      </>}
    </div>
  </div>;
}
// ── Nav ────────────────────────────────────────────────────────────────────
// ── Intelligence Hub data ─────────────────────────────────────────────────
// Weather, forecast, fatigue, fuel efficiency, predictive maintenance,
// Powerscreen crusher tracking

// Powerscreen crushers — manual hour tracking until Pulse API credentials obtained
const POWERSCREEN_CRUSHERS=[
  {id:"PS_550",name:"Trakpactor 550",type:"Horizontal Impact",capacity:250,hours:3840,
   fuel:67,css:75,urea:88,status:"operating",sn:"PS550-2021-0042",
   pulse:"connected", // "connected" | "manual" | "pending"
   tasks:[{id:"blowbar",label:"Blow Bar Check",interval:200,unit:"hrs"},{id:"filter",label:"Filter Blow",interval:50,unit:"hrs"},{id:"belt",label:"Belt Tensioning",interval:100,unit:"hrs"},{id:"lube",label:"Lubrication",interval:50,unit:"hrs"}]},
  {id:"PS_320",name:"Trakpactor 320",type:"Horizontal Impact",capacity:180,hours:2210,
   fuel:54,css:65,urea:72,status:"operating",sn:"PS320-2019-0118",
   pulse:"manual",
   tasks:[{id:"blowbar",label:"Blow Bar Check",interval:200,unit:"hrs"},{id:"filter",label:"Filter Blow",interval:50,unit:"hrs"},{id:"belt",label:"Belt Tensioning",interval:100,unit:"hrs"},{id:"lube",label:"Lubrication",interval:50,unit:"hrs"}]},
];

// Simulated weather — in production: OpenWeatherMap API, refreshed hourly
// GET https://api.openweathermap.org/data/2.5/weather?q=YourSite&appid=KEY&units=metric
const WEATHER_NOW={
  tempC:34,feelsLikeC:38,humidity:28,windKph:18,condition:"Sunny",icon:"☀️",
  uvIndex:11,dustHaze:false,
  forecast:[
    {time:"Now",   tempC:34,icon:"☀️"},
    {time:"12:00", tempC:36,icon:"☀️"},
    {time:"14:00", tempC:37,icon:"🌤"},
    {time:"16:00", tempC:35,icon:"🌤"},
    {time:"18:00", tempC:31,icon:"🌤"},
  ],
  // Dynamic limit adjustments based on temp
  machineAdjustments:[
    {machineId:"CAT745_1",metric:"payload",  safeMax:43,   reason:"Ambient >33°C — reduce payload to protect axle"},
    {machineId:"CAT745_2",metric:"payload",  safeMax:43,   reason:"Ambient >33°C — limit active (prev. axle OVH)"},
    {machineId:"CAT745_1",metric:"cycleMin", safeMin:20,   reason:"Allow more cooling time between cycles"},
    {machineId:"CAT745_2",metric:"cycleMin", safeMin:20,   reason:"Allow more cooling time between cycles"},
  ],
};

// Shift production data — built from scoop_logs in production, simulated here
// 10-min buckets from 06:00 to now (09:30)
const SHIFT_TIMELINE=[
  {t:"06:00",u1:0,  u2:0,  u3:0,  u4:0,  u7:0,  u8:0,  idle:true},
  {t:"06:10",u1:0,  u2:0,  u3:0,  u4:0,  u7:0,  u8:0,  idle:true},
  {t:"06:20",u1:0,  u2:0,  u3:0,  u4:0,  u7:0,  u8:0,  idle:true},
  {t:"06:30",u1:0,  u2:0,  u3:0,  u4:0,  u7:0,  u8:0,  idle:true},
  {t:"06:40",u1:142,u2:158,u3:120,u4:42, u7:130,u8:118,idle:false},
  {t:"06:50",u1:218,u2:241,u3:188,u4:51, u7:138,u8:122,idle:false},
  {t:"07:00",u1:256,u2:274,u3:220,u4:54, u7:142,u8:126,idle:false},
  {t:"07:10",u1:271,u2:288,u3:228,u4:55, u7:140,u8:124,idle:false},
  {t:"07:20",u1:279,u2:296,u3:234,u4:56, u7:141,u8:122,idle:false},
  {t:"07:30",u1:285,u2:306,u3:238,u4:57, u7:139,u8:120,idle:false},
  {t:"07:40",u1:291,u2:311,u3:241,u4:58, u7:142,u8:122,idle:false},
  {t:"07:50",u1:287,u2:308,u3:239,u4:57, u7:140,u8:121,idle:false},
  {t:"08:00",u1:289,u2:311,u3:241,u4:58, u7:141,u8:122,idle:false},
  {t:"08:10",u1:292,u2:313,u3:243,u4:58, u7:142,u8:123,idle:false},
  {t:"08:20",u1:278,u2:299,u3:231,u4:55, u7:136,u8:118,idle:false},
  {t:"08:30",u1:287,u2:308,u3:239,u4:57, u7:140,u8:121,idle:false},
  {t:"08:40",u1:290,u2:311,u3:241,u4:58, u7:141,u8:122,idle:false},
  {t:"08:50",u1:286,u2:307,u3:238,u4:57, u7:139,u8:120,idle:false},
  // Crusher event
  {t:"09:00",u1:82, u2:84, u3:65, u4:18, u7:40, u8:38, idle:true, event:"Rock jam — Crusher 1"},
  {t:"09:10",u1:0,  u2:0,  u3:0,  u4:0,  u7:0,  u8:0,  idle:true},
  {t:"09:20",u1:0,  u2:0,  u3:0,  u4:0,  u7:0,  u8:0,  idle:true},
  {t:"09:30",u1:261,u2:280,u3:215,u4:54, u7:138,u8:119,idle:false},
];

// Fuel consumption rates (L/hr) per machine at different production levels
// Predictive maintenance patterns — in production: ML model over accumulated fault+SMH data
const PREDICTIVE_ALERTS=[
  {machineId:"CAT988K", confidence:78, type:"Hydraulic hose fatigue",
   prediction:"Hydraulic leak likely in next 200–400 SMH based on pressure patterns at SMH 14,400–14,800",
   action:"Inspect hydraulic hoses at all bucket cylinder attachment points at next scheduled service",
   basis:"3 similar 988K units showed E-HYD codes at 15,100–15,400 SMH after similar usage pattern"},
  {machineId:"CAT992K", confidence:91, type:"Tyre overload stress",
   prediction:"LF/RF tyre failure risk elevated — current payload consistently 3–5% over rated",
   action:"Check tyre pressure daily. Consider reducing avg bucket fill by 5% until tyres are replaced",
   basis:"E360 code active · 7 days of payload overload data"},
  {machineId:"CAT6060",  confidence:85, type:"Engine thermal stress",
   prediction:"Elevated engine temp (96°C) with PM overdue — risk of thermostat or coolant pump failure within 150 SMH",
   action:"Schedule PM immediately. Until then, limit to 85% production and monitor temp every 2 hrs",
   basis:"Engine temp 6°C above average for 8 consecutive operating sessions"},
  {machineId:"CAT745_2", confidence:95, type:"Axle thermal limit confirmed",
   prediction:"Right rear axle overtemperature will recur at cycles below 19 min + payload above 44t in ambient >33°C",
   action:"Enforce safe envelope: ≥20 min cycle, ≤43t payload when ambient >30°C. No exceptions.",
   basis:"Fault event confirmed with all fluids OK — machine limit, not maintenance issue"},
];

// Fatigue windows — detect when each operator's performance typically drops
const FATIGUE_PATTERNS={
  u1:{dropStartMin:480, avgTphDrop:14, note:"Performance drops ~14 t/hr in last 90min"},
  u2:{dropStartMin:480, avgTphDrop:18, note:"Significant drop after 8hrs"},
  u3:{dropStartMin:420, avgTphDrop:22, note:"Earlier fade — drops after 7hrs"},
  u4:{dropStartMin:450, avgTphDrop:8,  note:"Minor fade, consistent performer"},
  u7:{dropStartMin:480, avgTphDrop:null,note:"Haul truck — cycle drift +1.8min in last 90min"},
  u8:{dropStartMin:480, avgTphDrop:null,note:"Haul truck — cycle drift +2.1min in last 90min"},
};

// ── Intelligence Hub (compact — detail views link to pages/) ──────────────
function IntelligenceHub(){
  const w=WEATHER_NOW,hot=w.tempC>=33;
  const predHigh=PREDICTIVE_ALERTS.filter(a=>a.confidence>=85).length;
  const shiftTons=Math.round(SHIFT_TIMELINE.filter(p=>!p.idle).reduce((a,p)=>a+(p.u1+p.u2+p.u3+p.u4+p.u7+p.u8)*10/60,0));
  const forecastTotal=shiftTons+Math.round((320+60)*6);
  const[psHours,setPsHours]=useState({PS_550:3840,PS_320:2210});
  const[editPs,setEditPs]=useState(null);const[psHrEdit,setPsHrEdit]=useState("");
  const tphCol=v=>v>=250?C.success:v>=150?C.accent:C.danger;
  const cycCol=v=>v<=19?C.success:v<=22?C.accent:C.danger;

  return <div style={{paddingBottom:80}} className="up">
    <PageHdr title="Intelligence" sub="Forecasting · efficiency · predictive maintenance"/>
    <div style={{padding:"12px 15px"}}>

      {/* Weather */}
      <div style={{background:hot?`${C.amber}10`:`${C.success}08`,border:`1.5px solid ${hot?C.amber:C.success}44`,borderRadius:14,padding:"14px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:hot?10:0}}>
          <div style={{fontSize:44}}>{w.icon}</div>
          <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:30,color:hot?C.amber:C.success,lineHeight:1}}>{w.tempC}°C</div><div style={{fontSize:11,color:C.muted}}>{w.condition} · feels {w.feelsLikeC}°C · UV {w.uvIndex}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>Wind</div><div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.muted}}>{w.windKph}km/h</div></div>
        </div>
        {hot&&<div style={{background:`${C.amber}15`,borderRadius:10,padding:"9px 12px"}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.amber,marginBottom:4}}>⚠ Machine limits adjusted for {w.tempC}°C ambient</div>
          {w.machineAdjustments.slice(0,2).map((a,i)=>{const m=BASE_MACHINES.find(x=>x.id===a.machineId);return <div key={i} style={{fontSize:11,color:C.textSub}}>· {m?.model}: {a.metric==="payload"?`max ${a.safeMax}t payload`:`min ${a.safeMin}min cycle`}</div>;})}
        </div>}
      </div>

      {/* Daily forecast */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase"}}>📊 Daily Forecast</div><div style={{fontFamily:F,fontWeight:900,fontSize:28,color:forecastTotal>=8000?C.success:C.amber,lineHeight:1.1,marginTop:3}}>{forecastTotal.toLocaleString()}<span style={{fontSize:14,fontWeight:400,color:C.muted}}>t</span></div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.muted}}>So far today</div><div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.info}}>{shiftTons.toLocaleString()}t</div></div>
        </div>
        <div style={{background:C.border,borderRadius:99,height:6,overflow:"hidden"}}><div style={{width:`${Math.min(100,(forecastTotal/10000)*100)}%`,height:"100%",background:forecastTotal>=8000?C.success:C.amber,borderRadius:99}}/></div>
        <div style={{fontSize:10,color:C.muted,marginTop:4}}>Target: 8,000t · Blast hold at 14:00 (B3 — 30 min)</div>
      </div>

      {/* Predictive maintenance */}
      {predHigh>0&&<div style={{background:`${C.danger}10`,border:`1.5px solid ${C.danger}44`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.danger,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>🔮 Predictive Maintenance — {predHigh} High-Confidence Alert{predHigh!==1?"s":""}</div>
        {PREDICTIVE_ALERTS.filter(a=>a.confidence>=85).map((a,i)=>{
          const m=BASE_MACHINES.find(x=>x.id===a.machineId);
          const col=a.confidence>=90?C.danger:C.amber;
          return <div key={i} style={{background:C.card,borderRadius:10,padding:"10px 12px",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:700,fontSize:13}}>{m?.model}</div><div style={{fontSize:11,color:col,fontFamily:F,fontWeight:700}}>{a.type}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:F,fontWeight:900,fontSize:22,color:col,lineHeight:1}}>{a.confidence}%</div><div style={{fontSize:9,color:C.muted}}>confidence</div></div>
            </div>
            <div style={{background:C.border,borderRadius:99,height:4,overflow:"hidden",marginBottom:6}}><div style={{width:`${a.confidence}%`,height:"100%",background:col,borderRadius:99}}/></div>
            <div style={{fontSize:11,color:C.textSub,lineHeight:1.4}}>{a.action}</div>
          </div>;
        })}
      </div>}

      {/* Fuel efficiency summary */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:10}}>⛽ Fuel Efficiency — Live</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[{id:"CAT988K",tph:287,lhr:27.5},{id:"CAT992K",tph:311,lhr:36.5},{id:"CAT6060",tph:241,lhr:52},{id:"CAT390F",tph:54,lhr:21}].map(x=>{
            const m=BASE_MACHINES.find(b=>b.id===x.id);
            const cpt=(x.lhr*8*1.85/(x.tph*8)).toFixed(2);
            return <div key={x.id} style={{background:C.surface,borderRadius:8,padding:"8px 10px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,marginBottom:2}}>{m?.model}</div>
              <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.success}}>${cpt}<span style={{fontSize:10,color:C.muted,fontWeight:400}}>/t</span></div>
              <div style={{fontSize:9,color:C.muted}}>{x.lhr}L/hr · {x.tph}t/hr</div>
            </div>;
          })}
        </div>
      </div>

      {/* Truck queue */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase"}}>⏳ Truck Queue Time</div><div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.danger,lineHeight:1.1,marginTop:3}}>25<span style={{fontSize:14,fontWeight:400,color:C.muted}}> min wasted</span></div><div style={{fontSize:11,color:C.muted,marginTop:3}}>Top cause: Rock jam at crusher · 11.2 min</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.muted}}>4 events</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>GPS-detected</div></div>
        </div>
      </div>

      {/* Fatigue */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>⏰ Fatigue Pattern — Auto-Notifications</div>
        {USERS.filter(u=>u.role==="operator"&&FATIGUE_PATTERNS[u.id]).slice(0,3).map(u=>{
          const fp=FATIGUE_PATTERNS[u.id];const m=BASE_MACHINES.find(x=>x.id===u.machine);
          const truck=isMachTruck(m?.type);const notifHr=6+fp.dropStartMin/60;
          const notifTime=`${Math.floor(notifHr)}:${String(Math.round((notifHr%1)*60)).padStart(2,"0")}`;
          return <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}22`}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`${C.amber}22`,border:`1px solid ${C.amber}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:12,color:C.amber,flexShrink:0}}>{u.avatar}</div>
            <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:700,fontSize:13}}>{u.name}</div><div style={{fontSize:10,color:C.muted}}>{m?.model} · auto-notified at {notifTime}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.danger,fontFamily:F,fontWeight:700}}>{truck?"↑1.5min":fp.avgTphDrop?`-${fp.avgTphDrop}t/hr`:""}</div><div style={{fontSize:9,color:C.muted}}>typical drift</div></div>
          </div>;
        })}
      </div>

      {/* Powerscreen crushers */}
      <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",margin:"16px 0 8px"}}>🏭 Powerscreen Crushers</div>
      <div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}22`,borderRadius:10,padding:"9px 12px",marginBottom:10}}>
        <div style={{fontSize:11,color:C.amber,fontFamily:F,fontWeight:700}}>Pulse API: awaiting dealer connection · hours tracked manually</div>
      </div>
      {POWERSCREEN_CRUSHERS.map(ps=>{
        const hrs=psHours[ps.id]||ps.hours;
        const fuelCol=ps.fuel>50?C.success:C.amber;
        return <div key={ps.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{ps.name}</div><div style={{fontSize:11,color:C.muted}}>{ps.type} · {ps.capacity} t/hr</div></div>
            <span style={{background:`${C.success}20`,color:C.success,border:`1px solid ${C.success}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>OPERATING</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:8}}>
            {[{l:"Hours",v:`${hrs.toLocaleString()} hrs`,c:C.muted},{l:"Fuel",v:`${ps.fuel}%`,c:fuelCol},{l:"Urea",v:`${ps.urea}%`,c:ps.urea>50?C.success:C.amber},{l:"CSS Gap",v:`${ps.css}mm`,c:C.info}].map(x=>
              <div key={x.l} style={{background:C.surface,borderRadius:8,padding:"6px 7px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontFamily:F,fontWeight:900,fontSize:13,color:x.c,lineHeight:1.2,marginTop:2}}>{x.v}</div></div>
            )}
          </div>
          {editPs===ps.id
            ?<div style={{display:"flex",gap:8}}><input type="number" value={psHrEdit} onChange={e=>setPsHrEdit(e.target.value)} placeholder={`Current: ${hrs}`} style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:14,flex:1,outline:"none"}}/><button onClick={()=>{if(parseInt(psHrEdit)>0){setPsHours(p=>({...p,[ps.id]:parseInt(psHrEdit)}));setEditPs(null);setPsHrEdit("");}}} style={{background:C.success,color:"#000",border:"none",borderRadius:8,padding:"8px 12px",fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer"}}>Save</button><button onClick={()=>{setEditPs(null);setPsHrEdit("");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.muted,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:12}}>✕</button></div>
            :<button onClick={()=>setEditPs(ps.id)} style={{width:"100%",background:`${C.muted}10`,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>📝 Update Hour Meter</button>}
        </div>;
      })}

      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"10px 13px",marginTop:4}}>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Intelligence data refreshes every 10 min via CAT VisionLink AEMP 2.0. Predictive maintenance confidence improves as fault and production data accumulates over time.</div>
      </div>
    </div>
  </div>;
}

// ── Subscription Screen ────────────────────────────────────────────────────
// ─── VisionLink Sync Button (manual re-sync) ─────────────────────
function VisionLinkSyncButton({activeMine}){
  const[syncing,setSyncing]=useState(false);const[msg,setMsg]=useState("");const[err,setErr]=useState("");
  const sync=async()=>{setSyncing(true);setErr("");setMsg("");try{if(!activeMine?.id)throw new Error("No active mine");const anon=import.meta.env.VITE_SUPABASE_ANON_KEY;const url=`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visionlink-sync`;const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${anon}`,"apikey":anon},body:JSON.stringify({mine_id:activeMine.id})});const body=await res.json().catch(()=>({error:`HTTP ${res.status}`}));if(!res.ok||body?.error)throw new Error(body?.error||`HTTP ${res.status}`);setMsg(`✓ Synced ${body?.updated||0} of ${body?.total_assets||0} machines`);setTimeout(()=>setMsg(""),4000);}catch(e){setErr(e.message||"Sync failed");setTimeout(()=>setErr(""),6000);}finally{setSyncing(false);}};
  return <div style={{marginTop:10}}>
    <button onClick={sync} disabled={syncing} style={{width:"100%",background:syncing?C.border:C.card,color:syncing?C.muted:C.accent,border:`1px solid ${C.accent}44`,borderRadius:10,padding:"12px",fontFamily:F,fontWeight:700,fontSize:13,cursor:syncing?"default":"pointer"}}>
      {syncing?"⏳ Syncing VisionLink…":"🔄 Sync VisionLink Now"}
    </button>
    {msg&&<div style={{marginTop:6,fontSize:11,color:C.success,textAlign:"center",fontFamily:F,fontWeight:700}}>{msg}</div>}
    {err&&<div style={{marginTop:6,fontSize:11,color:C.danger,textAlign:"center",fontFamily:F,fontWeight:700}}>⚠ {err}</div>}
  </div>;
}

// ── VisionLink Setup Wizard ────────────────────────────────────────────────
// ── Photo Manager (admin/supervisor uploads reference photos) ─────────────
// ── Compliance Hub ────────────────────────────────────────────────────────────
// Training records, competent persons list, SDS library, induction forms.
// In production: files stored in Supabase Storage, records in DB.

// Demo data ───────────────────────────────────────────────────────────────────
const DEMO_TRAINING=[
  {id:"t1",name:"James Smith",  role:"Operator",   machine:"CAT 988K",  status:"complete",date:"2024-03-15",certs:["High Risk Work Licence","LF - Forklift","MR Driver","First Aid"],photo:true},
  {id:"t2",name:"Bec Jones",    role:"Operator",   machine:"CAT 992K",  status:"complete",date:"2024-02-20",certs:["High Risk Work Licence","LF - Forklift","HR Driver","First Aid"],photo:true},
  {id:"t3",name:"Marcus Lee",   role:"Operator",   machine:"CAT 6060",  status:"complete",date:"2024-01-10",certs:["High Risk Work Licence","EWP","HR Driver"],photo:true},
  {id:"t4",name:"Pete Nguyen",  role:"Operator",   machine:"CAT 390F",  status:"complete",date:"2024-04-01",certs:["High Risk Work Licence","LF - Forklift"],photo:false},
  {id:"t5",name:"Tony Marsh",   role:"Operator",   machine:"CAT 745 #1",status:"complete",date:"2024-02-28",certs:["HR Driver","HC Driver","First Aid","Fire Warden"],photo:true},
  {id:"t6",name:"Kim Barnes",   role:"Operator",   machine:"CAT 745 #2",status:"complete",date:"2024-03-22",certs:["HR Driver","HC Driver","First Aid"],photo:true},
  {id:"t7",name:"Sarah Tran",   role:"Supervisor", machine:"—",         status:"complete",date:"2024-01-05",certs:["Supervisor Cert","First Aid","Fire Warden","RIIMPO320F"],photo:true},
  {id:"t8",name:"Craig O'Brien",role:"Mine Manager",machine:"—",        status:"complete",date:"2023-12-01",certs:["Site Senior Executive","First Aid","RIIMPO320F","RIIWMM202F"],photo:true},
];
const DEMO_COMPETENT=[
  {id:"c1",name:"Craig O'Brien",role:"Site Senior Executive",cert:"SSE Certificate of Competency",expiry:"2026-12-01",status:"current"},
  {id:"c2",name:"Sarah Tran",   role:"Statutory Supervisor",cert:"Supervisor — Open Cut",          expiry:"2026-06-15",status:"current"},
  {id:"c3",name:"James Smith",  role:"Competent Operator — Loader",cert:"LF Licence + Site Cert",  expiry:"2025-09-01",status:"current"},
  {id:"c4",name:"Tony Marsh",   role:"Competent Operator — Haul Truck",cert:"HC + Site Cert",      expiry:"2025-11-15",status:"current"},
  {id:"c5",name:"Marcus Lee",   role:"Competent Operator — Excavator",cert:"EWP + Site Cert",      expiry:"2025-08-20",status:"expires-soon"},
];
const DEMO_SDS=[
  {id:"s1",name:"Diesel Fuel",          supplier:"BP Australia",     hazard:"Flammable",  revised:"2024-01-01",uploaded:true},
  {id:"s2",name:"Hydraulic Oil HVI 46", supplier:"Shell Lubricants", hazard:"Irritant",   revised:"2023-09-15",uploaded:true},
  {id:"s3",name:"Grease (EP2)",         supplier:"Castrol",          hazard:"Low hazard", revised:"2023-11-20",uploaded:true},
  {id:"s4",name:"Engine Coolant",       supplier:"Nulon",            hazard:"Irritant",   revised:"2024-02-10",uploaded:true},
  {id:"s5",name:"Blast Explosives (ANFO)",supplier:"Dyno Nobel",     hazard:"Explosive",  revised:"2024-03-01",uploaded:true},
  {id:"s6",name:"DEF / AdBlue",         supplier:"PEAK",             hazard:"Low hazard", revised:"2023-08-01",uploaded:false},
];
const INDUCTION_SECTIONS=[
  {id:"site",   title:"Site Induction",       items:["Emergency evacuation procedures reviewed","Muster point locations confirmed","Site rules and no-go zones explained","Communication procedures understood","First aid locations identified"]},
  {id:"plant",  title:"Plant & Equipment",    items:["Exclusion zones around operating plant","Spotters required for reversing heavy vehicles","No passengers on equipment without authorisation","Pre-start check requirements explained","Defect reporting procedure understood"]},
  {id:"hazard", title:"Hazard Identification",items:["Pit edge and berm requirements","Blast exclusion zones and signal codes","Dust and noise hazards understood","Chemical handling (SDS access location)","Slip/trip/fall hazards on site"]},
  {id:"env",    title:"Environmental",        items:["Fuel and chemical spill response","Waste disposal procedures","Native vegetation protection areas","Water management (sumps, diversions)"]},
  {id:"admin",  title:"Administration",       items:["Sign-in / sign-out procedure","FIFO / roster procedures (if applicable)","Fatigue management policy understood","Drug and alcohol policy understood","Workers compensation reporting"]},
];




function ComplianceHub(){
  const[view,setView]=useState("overview");
  const[selTraining,setSelTraining]=useState(null);
  const[showInductionForm,setShowInductionForm]=useState(false);
  const[inductName,setInductName]=useState("");
  const[inductRole,setInductRole]=useState("operator");
  const[inductChecks,setInductChecks]=useState({});
  const[inductSig,setInductSig]=useState("");
  const[inductSubmitted,setInductSubmitted]=useState(false);
  const[sdsSearch,setSdsSearch]=useState("");
  const[trainingSearch,setTrainingSearch]=useState("");

  const expiryCol=s=>s==="expires-soon"?C.amber:s==="expired"?C.danger:C.success;
  const expiryLabel=s=>s==="expires-soon"?"EXPIRING":s==="expired"?"EXPIRED":"CURRENT";

  // ── Induction form ──────────────────────────────────────────────────────────
  if(showInductionForm){
    const totalItems=INDUCTION_SECTIONS.reduce((a,s)=>a+s.items.length,0);
    const checkedItems=Object.values(inductChecks).filter(Boolean).length;
    const allChecked=checkedItems===totalItems;
    const canSubmit=inductName.trim()&&inductRole&&allChecked&&inductSig.trim();
    if(inductSubmitted)return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px",textAlign:"center"}} className="up">
      <div style={{fontSize:56,marginBottom:12}}>✅</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.success,marginBottom:8}}>Induction Complete</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20}}>{inductName} · {ROLES[inductRole]?.label}</div>
      <div style={{background:C.card,border:`1px solid ${C.success}33`,borderRadius:12,padding:"14px",marginBottom:20,textAlign:"left"}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:8}}>Record saved</div>
        {[`Name: ${inductName}`,`Role: ${ROLES[inductRole]?.label}`,`Date: ${new Date().toLocaleDateString('en-AU')}`,`Items completed: ${checkedItems}/${totalItems}`,`Signed by: ${inductSig}`].map((s,i)=><div key={i} style={{fontSize:12,color:C.muted,marginBottom:3}}>· {s}</div>)}
      </div>
      <button onClick={()=>{setShowInductionForm(false);setInductName("");setInductChecks({});setInductSig("");setInductSubmitted(false);}} style={{width:"100%",background:C.accent,color:"#000",border:"none",borderRadius:12,padding:"14px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer"}}>← Back to Compliance</button>
    </div>;
    return <div style={{paddingBottom:100}} className="up">
      <PageHdr title="New Miner Induction" sub={`${checkedItems}/${totalItems} items · ${ROLES[inductRole]?.label}`} back onBack={()=>setShowInductionForm(false)}/>
      <div style={{padding:"12px 16px"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Inductee name <span style={{color:C.danger}}>*</span></div>
          <input value={inductName} onChange={e=>setInductName(e.target.value)} placeholder="Full name" style={{background:C.surface,color:C.text,border:`1px solid ${inductName?C.success:C.border}`,borderRadius:8,padding:"11px 13px",fontSize:14,width:"100%",outline:"none",marginBottom:10}}/>
          <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Role</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {Object.entries(ROLES).filter(([k])=>k!=="admin").map(([k,v])=><button key={k} onClick={()=>setInductRole(k)} style={{background:inductRole===k?`${v.color}18`:C.surface,border:`2px solid ${inductRole===k?v.color:C.border}`,borderRadius:9,padding:"10px 8px",color:inductRole===k?v.color:C.muted,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>{v.icon} {v.label}</button>)}
          </div>
        </div>
        <div style={{marginBottom:4}}>{INDUCTION_SECTIONS.map(sec=>{const sectionDone=sec.items.every((_,i)=>inductChecks[`${sec.id}_${i}`]);return <div key={sec.id} style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:sectionDone?C.success:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>{sectionDone?"✓":""}</div>
            <div style={{fontFamily:F,fontWeight:900,fontSize:15,color:sectionDone?C.success:C.text}}>{sec.title}</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"2px 12px"}}>
            {sec.items.map((item,i)=>{const key=`${sec.id}_${i}`;const done=!!inductChecks[key];return <div key={key} onClick={()=>setInductChecks(p=>({...p,[key]:!p[key]}))} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"11px 0",borderBottom:i<sec.items.length-1?`1px solid ${C.border}22`:"none",cursor:"pointer"}}>
              <div style={{width:22,height:22,borderRadius:6,background:done?C.success:"transparent",border:`2px solid ${done?C.success:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,marginTop:1}}>{done?"✓":""}</div>
              <span style={{fontSize:13,color:done?C.text:C.textSub,lineHeight:1.4}}>{item}</span>
            </div>;})}
          </div>
        </div>;})}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Supervisor / trainer signature (type name to confirm) <span style={{color:C.danger}}>*</span></div>
          <input value={inductSig} onChange={e=>setInductSig(e.target.value)} placeholder="Supervising name" style={{background:C.surface,color:C.text,border:`1px solid ${inductSig?C.success:C.border}`,borderRadius:8,padding:"11px 13px",fontSize:14,width:"100%",outline:"none"}}/>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`${C.bg}f8`,backdropFilter:"blur(10px)",padding:"12px 16px 24px",borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>{if(canSubmit)setInductSubmitted(true);}} style={{width:"100%",background:canSubmit?C.success:C.border,color:canSubmit?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:canSubmit?"pointer":"default",transition:"background .2s"}}>
          {!inductName.trim()?"Enter inductee name":!allChecked?`${totalItems-checkedItems} items remaining`:!inductSig.trim()?"Enter supervisor signature":"✅ Submit Induction Record"}
        </button>
      </div>
    </div>;}

  // ── Training detail ──────────────────────────────────────────────────────────
  if(selTraining){const t=DEMO_TRAINING.find(x=>x.id===selTraining);
    return <div style={{paddingBottom:20}} className="up">
      <PageHdr title={t.name} sub={`${t.role} · Inducted ${t.date}`} back onBack={()=>setSelTraining(null)}/>
      <div style={{padding:"12px 16px"}}>
        <div style={{background:C.card,border:`1px solid ${C.success}33`,borderRadius:14,padding:"14px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`${ROLES[t.role.toLowerCase().replace(" ","")]?.color||C.accent}22`,border:`2px solid ${ROLES[t.role.toLowerCase().replace(" ","")]?.color||C.accent}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:900,fontSize:20,color:ROLES[t.role.toLowerCase().replace(" ","")]?.color||C.accent}}>{t.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:20}}>{t.name}</div><div style={{fontSize:12,color:C.muted}}>{t.role}{t.machine!=="—"?` · ${t.machine}`:""}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[{l:"Induction Date",v:t.date},{l:"Status",v:"Complete"},{l:"Certificates",v:t.certs.length},{l:"Photo on file",v:t.photo?"Yes":"No"}].map(x=><div key={x.l} style={{background:C.surface,borderRadius:8,padding:"8px 10px",border:`1px solid ${C.border}`}}><div style={{fontSize:8,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontFamily:F,fontWeight:700,fontSize:15,marginTop:2}}>{x.v}</div></div>)}
          </div>
        </div>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Licences & Certificates</div>
        {t.certs.map((cert,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:`1px solid ${C.border}22`}}>
          <span style={{color:C.success,fontSize:16,flexShrink:0}}>📄</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontFamily:F,fontWeight:700}}>{cert}</div><div style={{fontSize:10,color:C.muted}}>Verified on file</div></div>
          <Pill label="VERIFIED" color={C.success}/>
        </div>)}
        {!t.photo&&<div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:10,padding:"10px 12px",marginTop:10}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.amber}}>⚠ No training photo on file</div>
        </div>}
        {t.photo&&<div style={{background:`${C.success}08`,border:`1px solid ${C.success}22`,borderRadius:10,padding:"10px 12px",marginTop:10}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.success,marginBottom:6}}>📷 Training photo on file</div>
          <div style={{background:C.card,borderRadius:8,height:120,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.border}`}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:6}}>🪪</div><div style={{fontSize:11,color:C.muted}}>Certificate / ID photo</div><div style={{fontSize:10,color:`${C.muted}88`}}>Stored in Supabase Storage</div></div>
          </div>
        </div>}
      </div>
    </div>;}

  // ── SDS view ─────────────────────────────────────────────────────────────────
  if(view==="sds"){
    const filtered=DEMO_SDS.filter(s=>s.name.toLowerCase().includes(sdsSearch.toLowerCase()));
    const hazCol=h=>h==="Explosive"?C.danger:h==="Flammable"?C.amber:h==="Irritant"?C.info:C.muted;
    return <div style={{paddingBottom:20}} className="up">
      <PageHdr title="SDS Library" sub="Safety Data Sheets · tap to view or upload" back onBack={()=>setView("overview")}/>
      <div style={{padding:"12px 16px"}}>
        <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"9px 12px",marginBottom:12}}>
          <div style={{fontSize:11,color:C.info}}>SDS sheets must be accessible to all workers. Upload the current SDS for every chemical or substance used on site. In production: stored in Supabase Storage, viewable by all mine users.</div>
        </div>
        <input value={sdsSearch} onChange={e=>setSdsSearch(e.target.value)} placeholder="Search substances…" style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,width:"100%",outline:"none",marginBottom:12}}/>
        {filtered.map(s=>{const hc=hazCol(s.hazard);return <div key={s.id} style={{background:C.card,border:`1px solid ${s.uploaded?C.border:C.amber+"33"}`,borderRadius:12,padding:"13px 14px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{s.name}</div><div style={{fontSize:11,color:C.muted}}>{s.supplier}</div></div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <span style={{background:`${hc}20`,color:hc,border:`1px solid ${hc}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{s.hazard}</span>
              {!s.uploaded&&<span style={{background:`${C.amber}20`,color:C.amber,border:`1px solid ${C.amber}44`,borderRadius:6,padding:"2px 8px",fontSize:9,fontFamily:F,fontWeight:700}}>NEEDS UPLOAD</span>}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,color:C.muted}}>Revised: {s.revised}</div>
            <span style={{background:s.uploaded?`${C.success}15`:`${C.amber}15`,border:`1px solid ${s.uploaded?C.success:C.amber}33`,borderRadius:7,padding:"4px 10px",color:s.uploaded?C.success:C.amber,fontSize:11,fontFamily:F,fontWeight:700}}>{s.uploaded?"📄 On file":"⚠ Not uploaded"}</span>
          </div>
        </div>;})}
      </div>
    </div>;}

  // ── Competent persons ────────────────────────────────────────────────────────
  if(view==="competent"){
    const expirySoon=DEMO_COMPETENT.filter(c=>c.status==="expires-soon").length;
    return <div style={{paddingBottom:20}} className="up">
      <PageHdr title="Competent Persons" sub="MQSHA required roles — certificates on file" back onBack={()=>setView("overview")}/>
      <div style={{padding:"12px 16px"}}>
        {expirySoon>0&&<div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:12,padding:"11px 13px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:22}}>⚠️</span><div><div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.amber}}>{expirySoon} certificate{expirySoon!==1?"s":""} expiring soon</div><div style={{fontSize:11,color:C.muted}}>Renew before expiry date</div></div></div>}
        <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"9px 12px",marginBottom:12}}>
          <div style={{fontSize:11,color:C.info}}>MQSHA 1999 requires nominated competent persons for each statutory role. Records must be kept on site and available for inspection.</div>
        </div>
        {DEMO_COMPETENT.map(c=>{const ec=expiryCol(c.status);return <div key={c.id} style={{background:C.card,border:`1.5px solid ${c.status!=="current"?ec+"44":C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.role}</div></div>
            <span style={{background:`${ec}20`,color:ec,border:`1px solid ${ec}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700,flexShrink:0}}>{expiryLabel(c.status)}</span>
          </div>
          <div>
            <div style={{fontSize:12,color:C.textSub,marginBottom:2}}>📄 {c.cert}</div>
            <div style={{fontSize:10,color:C.muted}}>Expires: {c.expiry}</div>
          </div>
        </div>;})}
      </div>
    </div>;}

  // ── Training list ────────────────────────────────────────────────────────────
  if(view==="training"){
    const filtered=DEMO_TRAINING.filter(t=>t.name.toLowerCase().includes(trainingSearch.toLowerCase()));
    const noPhoto=DEMO_TRAINING.filter(t=>!t.photo).length;
    return <div style={{paddingBottom:20}} className="up">
      <PageHdr title="Training Records" sub="Induction status · licences · certificates" back onBack={()=>setView("overview")}/>
      <div style={{padding:"12px 16px"}}>
        {noPhoto>0&&<div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:10,padding:"9px 12px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}><span>⚠️</span><div style={{fontSize:11,color:C.amber,fontFamily:F,fontWeight:700}}>{noPhoto} record{noPhoto!==1?"s":""} missing certificate photo — tap to upload</div></div>}
        <button onClick={()=>setShowInductionForm(true)} style={{width:"100%",background:`linear-gradient(135deg,${C.success},#2db87a)`,border:"none",borderRadius:12,padding:"14px",marginBottom:12,color:"#000",fontFamily:F,fontWeight:900,fontSize:16,cursor:"pointer"}}>+ New Miner Induction Form</button>
        <input value={trainingSearch} onChange={e=>setTrainingSearch(e.target.value)} placeholder="Search by name…" style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,width:"100%",outline:"none",marginBottom:12}}/>
        {filtered.map(t=>{const rc=ROLES[t.role.toLowerCase().replace(/\s/g,"")]?.color||C.accent;return <div key={t.id} onClick={()=>setSelTraining(t.id)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:8,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:8}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`${rc}22`,border:`2px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:14,color:rc,flexShrink:0}}>{t.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
            <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{t.name}</div><div style={{fontSize:11,color:C.muted}}>{t.role}{t.machine!=="—"?` · ${t.machine}`:""}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.muted}}>Inducted</div><div style={{fontFamily:F,fontWeight:700,fontSize:12}}>{t.date}</div></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{t.certs.slice(0,2).map((c,i)=><span key={i} style={{background:`${C.info}15`,color:C.info,borderRadius:5,padding:"2px 7px",fontSize:10,fontFamily:F,fontWeight:700}}>{c}</span>)}{t.certs.length>2&&<span style={{background:C.surface,color:C.muted,borderRadius:5,padding:"2px 7px",fontSize:10}}>+{t.certs.length-2}</span>}</div>
            {!t.photo?<span style={{background:`${C.amber}20`,color:C.amber,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>📷 NEEDED</span>:<span style={{background:`${C.success}20`,color:C.success,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>📷 ON FILE</span>}
          </div>
        </div>;})}
      </div>
    </div>;}

  // ── Overview ─────────────────────────────────────────────────────────────────
  const expiringSoon=DEMO_COMPETENT.filter(c=>c.status==="expires-soon").length;
  const sdsNeeded=DEMO_SDS.filter(s=>!s.uploaded).length;
  const TILES=[
    {id:"training",  icon:"📋",title:"Training Records",        sub:`${DEMO_TRAINING.length} workers on file · new miner induction`,color:C.success},
    {id:"competent", icon:"🏅",title:"Competent Persons List",  sub:`${DEMO_COMPETENT.length} roles · ${expiringSoon>0?expiringSoon+" expiring soon":"all current"}`,color:expiringSoon>0?C.amber:C.success,badge:expiringSoon>0?`${expiringSoon} EXPIRING`:null},
    {id:"sds",       icon:"⚗",title:"SDS Library",             sub:`${DEMO_SDS.length} substances · ${sdsNeeded>0?sdsNeeded+" need upload":"all uploaded"}`,color:sdsNeeded>0?C.amber:C.success,badge:sdsNeeded>0?`${sdsNeeded} NEEDED`:null},
  ];
  return <div style={{paddingBottom:80}} className="up">
    <PageHdr title="Compliance" sub="Training · competency · SDS · records"/>
    <div style={{padding:"14px 16px"}}>
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"9px 12px",marginBottom:14}}>
        <div style={{fontSize:11,color:C.info}}>All records stored securely per mine. Viewable by supervisors and management only. Operators can see their own records.</div>
      </div>
      {TILES.map(t=><button key={t.id} onClick={()=>setView(t.id)} style={{width:"100%",background:C.card,border:`1px solid ${t.color}33`,borderRadius:14,padding:"16px 15px",marginBottom:10,display:"flex",alignItems:"center",gap:13,textAlign:"left",cursor:"pointer"}}>
        <div style={{width:50,height:50,borderRadius:13,background:`${t.color}18`,border:`2px solid ${t.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{t.icon}</div>
        <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:17}}>{t.title}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.sub}</div></div>
        {t.badge&&<span style={{background:`${t.color}20`,color:t.color,border:`1px solid ${t.color}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700,flexShrink:0}}>{t.badge}</span>}
        <span style={{color:C.muted,fontSize:14,flexShrink:0}}>›</span>
      </button>)}
    </div>
  </div>;
}

// ── Fire Extinguisher Photo Upload ────────────────────────────────────────
async function uploadExtinguisherPhoto(file,mineId,scopeId){
  if(!file||!mineId)return null;
  const ext=(file.name||"photo.jpg").split(".").pop().toLowerCase();
  const path=`${mineId}/${scopeId||"tmp"}/${Date.now()}.${ext}`;
  const{error}=await supabase.storage.from("fire-extinguishers").upload(path,file,{contentType:file.type||"image/jpeg",upsert:false});
  if(error){console.error("ext photo upload:",error);return null;}
  return path;
}
// ── Records Hub ───────────────────────────────────────────────────────────
// Mine-wide read-only archive across 6 record types. Filter chips, date
// range, operator search. Tap a row to expand its full detail in-place.

const RECORD_TYPES=[
  {id:"prestart",    label:"Pre-Start Inspections",        shortLabel:"Pre-Start",       icon:"✅",color:C.success},
  {id:"workplace",   label:"Workplace Exams",              shortLabel:"Workplace",       icon:"🗺",color:C.info},
  {id:"vehicle",     label:"Vehicle / Truck Checks",       shortLabel:"Vehicle",         icon:"🚗",color:C.purple},
  {id:"fire",        label:"Fire Extinguisher Inspections",shortLabel:"Fire Ext",        icon:"🧯",color:"#ec4899"},
  {id:"maintenance", label:"Maintenance",                  shortLabel:"Maintenance",     icon:"🔧",color:C.accent},
  {id:"downtime",    label:"Downtime",                     shortLabel:"Downtime",        icon:"⏸️",color:C.amber},
  {id:"handover",    label:"Handover Tickets",             shortLabel:"Handover",        icon:"🎟",color:C.danger},
];

function _humanDate(ymd){
  const t=_today();
  const y=_ymd(_addDays(new Date(),-1));
  if(ymd===t)return"Today";
  if(ymd===y)return"Yesterday";
  return new Date(ymd+"T00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
}
function _fmtTime(iso){
  if(!iso)return"";
  const d=new Date(iso);
  return`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
// Map vehicle-check item_key → human label (drawn from VEHICLE_CHECK_SECTIONS).
const _vehicleItemLabel=key=>{
  for(const sec of (typeof VEHICLE_CHECK_SECTIONS!=="undefined"?VEHICLE_CHECK_SECTIONS:[])){
    const it=sec.items.find(x=>x.key===key);
    if(it)return it.label;
  }
  return key;
};

// ── Records Hub ───────────────────────────────────────────────────────────
// Category-first: top-level cards per paperwork type. Tap into a list of that
// single type with date-range + operator filters. Tap a row to expand its
// per-type detail renderer.
function RecordsHub({activeMine,allMachines,remoteOperators,onBack,initialType,readOnly,categoryFilter}){
  const[records,setRecords]=useState([]);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState(initialType?"list":"categories"); // categories | list
  const[activeType,setActiveType]=useState(initialType||null);
  const[from,setFrom]=useState("");
  const[to,setTo]=useState("");
  const[opSearch,setOpSearch]=useState("");
  const[expanded,setExpanded]=useState(null);
  const[locById,setLocById]=useState({});
  const[extById,setExtById]=useState({});
  const[photosByTicket,setPhotosByTicket]=useState({});
  const[signedUrls,setSignedUrls]=useState({});
  const[lightbox,setLightbox]=useState(null);

  const opMap=useMemo(()=>new Map((remoteOperators||[]).map(o=>[o.id,o.name])),[remoteOperators]);
  const machineMap=useMemo(()=>{const m={};(allMachines||[]).forEach(x=>{m[x.id]=x.model||x.id;});return m;},[allMachines]);
  const machineLabel=id=>machineMap[id]||id||"—";
  const opLabel=id=>opMap.get(id)||"—";
  const loadSignedUrl=async(bucket,path)=>{
    if(!path||signedUrls[path])return signedUrls[path];
    try{const{data}=await supabase.storage.from(bucket).createSignedUrl(path,3600);
      if(data?.signedUrl){setSignedUrls(s=>({...s,[path]:data.signedUrl}));return data.signedUrl;}
    }catch(e){console.error("signed url:",e);}
    return null;
  };
  const loadHandoverPhotos=async ticketId=>{
    if(photosByTicket[ticketId])return;
    try{
      const{data}=await supabase.from("handover_photos").select("*").eq("ticket_id",ticketId).order("created_at");
      setPhotosByTicket(p=>({...p,[ticketId]:data||[]}));
      for(const ph of data||[])loadSignedUrl("handover",ph.storage_path);
    }catch(e){console.error("handover photos:",e);}
  };

  useEffect(()=>{
    if(!activeMine?.id){setLoading(false);setRecords([]);return;}
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try{
        const limit=400;
        const r=async(table,tsCol,fn)=>{
          const{data,error}=await supabase.from(table).select("*").eq("mine_id",activeMine.id).order(tsCol,{ascending:false}).limit(limit);
          if(error){console.warn(`records ${table}:`,error.message);return[];}
          return(data||[]).map(fn).filter(Boolean);
        };
        const[prestarts,exams,maints,downs,handovers,fires,vehicles,locRes,extRes]=await Promise.all([
          r("prestart_logs","signed_off_at",row=>({
            id:`p_${row.id}`,type:"prestart",ts:new Date(row.signed_off_at).getTime(),iso:row.signed_off_at,
            title:`Pre-start · ${machineLabel(row.machine_id)}`,
            subtitle:`Fuel ${row.fuel_level??"—"}%`,
            operatorName:opLabel(row.operator_id),machineId:row.machine_id,raw:row,
          })),
          r("workplace_exams","created_at",row=>({
            id:`w_${row.id}`,type:"workplace",ts:new Date(row.created_at||row.examined_at||Date.now()).getTime(),iso:row.created_at||row.examined_at,
            title:`Workplace exam · ${row.area||"—"}`,
            subtitle:row.acknowledged_exam_id?"Acknowledged":(row.findings&&row.findings!=="none"?"⚠ Adverse findings":"No findings"),
            operatorName:row.operator_name||opLabel(row.operator_id),raw:row,
          })),
          r("maintenance_logs","logged_at",row=>({
            id:`m_${row.id}`,type:"maintenance",ts:new Date(row.logged_at).getTime(),iso:row.logged_at,
            title:`Maintenance · ${row.task_id||"task"} on ${machineLabel(row.machine_id)}`,
            subtitle:row.supervisor_approved_by?`Supervisor: ${row.supervisor_approved_by}`:(row.notes||"").slice(0,80),
            operatorName:row.technician_name||"—",machineId:row.machine_id,raw:row,
          })),
          r("downtime_logs","logged_at",row=>{
            const cat=DT_CATS[row.category]||{label:row.category,icon:"❓"};
            return{
              id:`d_${row.id}`,type:"downtime",ts:new Date(row.logged_at).getTime(),iso:row.logged_at,
              title:`Downtime · ${cat.label} · ${machineLabel(row.machine_id)}`,
              subtitle:`${row.duration_min||0} min${row.flagged_for_supervisor?" · flagged":""}${row.note?` · "${row.note.slice(0,40)}"`:""}`,
              operatorName:"—",machineId:row.machine_id,raw:row,
            };
          }),
          r("handover_tickets","created_at",row=>({
            id:`h_${row.id}`,type:"handover",ts:new Date(row.created_at).getTime(),iso:row.created_at,
            title:`Handover · ${machineLabel(row.machine_id)}`,
            subtitle:`${row.status||"open"} · ${(row.description||"").slice(0,80)}`,
            operatorName:row.created_by_name||"—",machineId:row.machine_id,raw:row,
          })),
          r("fire_extinguisher_inspections","inspected_at",row=>({
            id:`f_${row.id}`,type:"fire",ts:new Date(row.inspected_at).getTime(),iso:row.inspected_at,
            title:`Fire ext · ${row.status==="pass"?"PASS":"FAIL"}`,
            subtitle:row.notes?row.notes.slice(0,80):(row.status==="pass"?"Inspection passed":"⚠ Inspection failed"),
            operatorName:row.inspector_name||"—",raw:row,
          })),
          r("vehicle_checks","created_at",row=>({
            id:`v_${row.id}`,type:"vehicle",ts:new Date(row.created_at).getTime(),iso:row.created_at,
            title:`Vehicle · ${row.vehicle_label||"—"}`,
            subtitle:`${row.pass_count||0} pass · ${row.fail_count||0} fail${row.fail_count>0?" ⚠":""}`,
            operatorName:row.operator_name||"—",raw:row,
          })),
          supabase.from("extinguisher_locations").select("id,name").eq("mine_id",activeMine.id),
          supabase.from("fire_extinguishers").select("id,serial_number,serial_photo_path,location_id").eq("mine_id",activeMine.id),
        ]);
        if(cancelled)return;
        const all=[...prestarts,...exams,...maints,...downs,...handovers,...fires,...vehicles].sort((a,b)=>b.ts-a.ts);
        setRecords(all);
        if(locRes?.data){const m={};for(const l of locRes.data)m[l.id]=l.name;setLocById(m);}
        if(extRes?.data){const m={};for(const e of extRes.data)m[e.id]=e;setExtById(m);}
      }catch(e){console.error("records hub:",e);}
      finally{if(!cancelled)setLoading(false);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,(remoteOperators||[]).length,(allMachines||[]).length]);

  // Per-type aggregates for the category cards.
  const visibleTypes=useMemo(()=>{
    if(!categoryFilter)return RECORD_TYPES;
    return RECORD_TYPES.filter(t=>categoryFilter.includes(t.id));
  },[categoryFilter]);
  const typeStats=useMemo(()=>{
    const out={};
    for(const t of visibleTypes){
      const items=records.filter(r=>r.type===t.id);
      out[t.id]={count:items.length,latest:items[0]?.ts||null};
    }
    return out;
  },[records,visibleTypes]);

  // ── Detail building blocks ─────────────────────────────────────────────
  const KV=({label,value,mono,full})=>(
    <div style={{display:"flex",gap:10,padding:"5px 0",borderBottom:`1px solid ${C.border}22`,fontSize:12,alignItems:full?"flex-start":"center"}}>
      <div style={{color:C.muted,minWidth:96,flexShrink:0,fontFamily:F,fontWeight:700,fontSize:9,letterSpacing:".06em",textTransform:"uppercase",paddingTop:full?3:0}}>{label}</div>
      <div style={{color:C.text,wordBreak:"break-word",fontFamily:mono?"monospace":"inherit",flex:1,lineHeight:1.5}}>{value??"—"}</div>
    </div>
  );
  const Check=({label,state})=>{
    const passed=state===true||state==="pass";
    const failed=state===false||state==="fail";
    const na=state==="na";
    const col=passed?C.success:failed?C.danger:na?C.muted:C.muted;
    const icon=passed?"✓":failed?"✗":na?"—":"–";
    return<div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 0",fontSize:12}}>
      <span style={{width:18,height:18,borderRadius:5,background:passed||failed?col:"transparent",border:passed||failed?"none":`1.5px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:passed||failed?"#000":col,flexShrink:0,fontWeight:900}}>{icon}</span>
      <span style={{color:C.text,flex:1}}>{label}</span>
    </div>;
  };
  const SectionHdr=({label})=>(
    <div style={{fontFamily:F,fontWeight:700,fontSize:9,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",margin:"12px 0 4px",paddingTop:10,borderTop:`1px solid ${C.border}22`}}>{label}</div>
  );
  const SeverityBadge=({n})=>{
    const colors=[C.info,C.success,C.amber,"#e07c2e",C.danger];
    const labels=["Info","Minor","Notable","Major","Critical"];
    const i=Math.max(1,Math.min(5,n||1))-1;
    return<span style={{background:`${colors[i]}22`,color:colors[i],border:`1px solid ${colors[i]}55`,borderRadius:6,padding:"3px 8px",fontSize:10,fontFamily:F,fontWeight:700,whiteSpace:"nowrap"}}>SEV {n} · {labels[i]}</span>;
  };
  const StatusBadge=({status})=>{
    const m={open:C.danger,in_progress:C.amber,awaiting_verification:C.info,fixed:C.info,verified:C.success,closed:C.success,pass:C.success,fail:C.danger};
    const col=m[status]||C.muted;
    return<span style={{background:`${col}22`,color:col,border:`1px solid ${col}55`,borderRadius:6,padding:"3px 8px",fontSize:10,fontFamily:F,fontWeight:700,textTransform:"uppercase",whiteSpace:"nowrap"}}>{(status||"—").replace(/_/g," ")}</span>;
  };
  const PhotoThumb=({url,size=64,onClick,label})=>(
    <button onClick={onClick} disabled={!url} style={{width:size,height:size,borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,padding:0,overflow:"hidden",cursor:url?"pointer":"default",position:"relative",flexShrink:0}}>
      {url?<img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:10}}>…</div>}
      {label&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.6)",color:"#fff",fontSize:8,padding:"2px 4px",fontFamily:F,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>{label}</div>}
    </button>
  );

  // ── Per-type renderers ─────────────────────────────────────────────────
  const renderPrestart=raw=>{
    const checks=raw.checks_passed||{};
    return<>
      <KV label="Machine" value={machineLabel(raw.machine_id)}/>
      <KV label="Operator" value={opLabel(raw.operator_id)}/>
      <KV label="Fuel level" value={raw.fuel_level!=null?`${raw.fuel_level}%`:null}/>
      <KV label="Signed off" value={raw.signed_off_at?new Date(raw.signed_off_at).toLocaleString():null}/>
      <SectionHdr label="Pre-start checks"/>
      {PRESTART.map(c=><Check key={c.id} label={c.label} state={checks[c.id]??false}/>)}
    </>;
  };
  const WORKPLACE_CHECKS=[
    ["ground","Ground conditions"],
    ["walls","Walls / highwall / face"],
    ["equipment","Equipment & guarding"],
    ["access","Access & egress"],
    ["housekeeping","Housekeeping"],
  ];
  const renderWorkplace=raw=>{
    const conds=raw.conditions_checked||{};
    const adverse=raw.findings==="adverse";
    return<>
      <KV label="Area" value={raw.area}/>
      {raw.acknowledged_exam_id&&<KV label="Inherited" value={`Acknowledged from earlier exam (${String(raw.acknowledged_exam_id).slice(0,8)}…)`}/>}
      <KV label="Operator" value={raw.operator_name||opLabel(raw.operator_id)}/>
      <KV label="Regulator" value={(raw.regulator||"msha").toUpperCase()}/>
      <SectionHdr label="Conditions"/>
      {WORKPLACE_CHECKS.map(([k,lb])=><Check key={k} label={lb} state={conds[k]}/>)}
      <Check label="Task known to operator" state={raw.task_known}/>
      <Check label="Area safe to work" state={raw.area_safe}/>
      <SectionHdr label="Findings"/>
      {adverse?<>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
          <StatusBadge status="fail"/>
          <span style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.danger}}>Adverse conditions reported</span>
        </div>
        {raw.findings_detail&&<KV label="Detail" value={raw.findings_detail} full/>}
        {raw.corrective_action&&<KV label="Corrective" value={raw.corrective_action} full/>}
        {raw.reported_to&&<KV label="Reported to" value={raw.reported_to}/>}
      </>:<div style={{padding:"4px 0",fontSize:12,color:C.success,fontFamily:F,fontWeight:700}}>✓ No adverse conditions</div>}
    </>;
  };
  const renderMaintenance=raw=>{
    const smh=raw.smh_at_service??raw.hours_at_service;
    return<>
      <KV label="Machine" value={machineLabel(raw.machine_id)}/>
      <KV label="Task" value={raw.task_id}/>
      <KV label="SMH at service" value={smh!=null?String(smh):null}/>
      <KV label="Technician" value={raw.technician_name}/>
      {raw.supervisor_approved_by&&<KV label="Supervisor" value={raw.supervisor_approved_by}/>}
      <KV label="Logged" value={raw.logged_at?new Date(raw.logged_at).toLocaleString():null}/>
      {raw.notes&&<KV label="Notes" value={raw.notes} full/>}
    </>;
  };
  const renderDowntime=raw=>{
    const cat=DT_CATS[raw.category]||{label:raw.category,icon:"❓"};
    return<>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0 10px"}}>
        <span style={{fontSize:22}}>{cat.icon}</span>
        <span style={{fontFamily:F,fontWeight:900,fontSize:15,color:C.text}}>{cat.label}</span>
        {raw.is_operator_fault&&<span style={{background:`${C.danger}22`,color:C.danger,border:`1px solid ${C.danger}55`,borderRadius:6,padding:"2px 7px",fontSize:9,fontFamily:F,fontWeight:700,marginLeft:"auto"}}>OP FAULT</span>}
        {raw.flagged_for_supervisor&&<span style={{background:`${C.amber}22`,color:C.amber,border:`1px solid ${C.amber}55`,borderRadius:6,padding:"2px 7px",fontSize:9,fontFamily:F,fontWeight:700}}>FLAGGED</span>}
      </div>
      <KV label="Machine" value={machineLabel(raw.machine_id)}/>
      <KV label="Duration" value={raw.duration_min!=null?`${raw.duration_min} min`:null}/>
      <KV label="Category" value={cat.label}/>
      <KV label="Logged" value={raw.logged_at?new Date(raw.logged_at).toLocaleString():null}/>
      {raw.note&&<KV label="Notes" value={raw.note} full/>}
    </>;
  };
  const renderHandover=raw=>{
    const photos=photosByTicket[raw.id]||null;
    const stages=["original","in_progress","fix","verification"];
    const stageLabels={original:"Original",in_progress:"In progress",fix:"Fix",verification:"Verification"};
    return<>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"4px 0 10px"}}>
        <SeverityBadge n={raw.severity}/>
        <StatusBadge status={raw.status}/>
      </div>
      <KV label="Machine" value={machineLabel(raw.machine_id)}/>
      <KV label="Created by" value={raw.created_by_name}/>
      <KV label="Created" value={raw.created_at?new Date(raw.created_at).toLocaleString():null}/>
      {raw.assigned_to&&<KV label="Assigned to" value={raw.assigned_to}/>}
      <KV label="Description" value={raw.description} full/>
      {raw.status==="closed"&&<>
        {raw.closed_by_name&&<KV label="Closed by" value={raw.closed_by_name}/>}
        {raw.closed_at&&<KV label="Closed" value={new Date(raw.closed_at).toLocaleString()}/>}
        {raw.resolution_notes&&<KV label="Resolution" value={raw.resolution_notes} full/>}
      </>}
      <SectionHdr label={`Photos${photos?` · ${photos.length}`:""}`}/>
      {photos===null?<div style={{padding:"6px 0",color:C.muted,fontSize:11}}>Loading photos…</div>
        :photos.length===0?<div style={{padding:"6px 0",color:C.muted,fontSize:11}}>No photos attached.</div>
        :stages.map(st=>{
          const subset=photos.filter(p=>p.stage===st);
          if(subset.length===0)return null;
          return<div key={st} style={{marginTop:6}}>
            <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>{stageLabels[st]} · {subset.length}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {subset.map(p=>{
                const url=signedUrls[p.storage_path];
                return<PhotoThumb key={p.id} url={url} onClick={()=>url&&setLightbox(url)}/>;
              })}
            </div>
          </div>;
        })}
    </>;
  };
  const renderFire=raw=>{
    const locName=raw.location_id?locById[raw.location_id]:null;
    const ext=raw.extinguisher_id?extById[raw.extinguisher_id]:null;
    const photoPath=raw.serial_photo_path||ext?.serial_photo_path;
    const photoUrl=photoPath?signedUrls[photoPath]:null;
    return<>
      <div style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0 10px"}}>
        <StatusBadge status={raw.status}/>
        <span style={{fontFamily:F,fontWeight:900,fontSize:13,color:raw.status==="pass"?C.success:C.danger}}>{raw.status==="pass"?"Inspection passed":"⚠ Inspection failed"}</span>
      </div>
      <KV label="Location" value={locName||(raw.location_id?String(raw.location_id).slice(0,8)+"…":null)}/>
      <KV label="Serial" value={ext?.serial_number||"(pending OCR)"} mono/>
      <KV label="Inspector" value={raw.inspector_name}/>
      <KV label="Inspected" value={raw.inspected_at?new Date(raw.inspected_at).toLocaleString():null}/>
      {raw.notes&&<KV label="Notes" value={raw.notes} full/>}
      {photoPath&&<>
        <SectionHdr label="Serial-tag photo"/>
        <div style={{display:"flex",gap:6,paddingTop:2}}>
          <PhotoThumb url={photoUrl} size={96} onClick={()=>photoUrl&&setLightbox(photoUrl)} label="Serial"/>
          {!photoUrl&&<button onClick={()=>loadSignedUrl("fire-extinguishers",photoPath)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 10px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",alignSelf:"center"}}>Load photo</button>}
        </div>
      </>}
    </>;
  };
  const renderVehicle=raw=>{
    const results=raw.results||{};
    const entries=Object.entries(results);
    const fails=entries.filter(([,v])=>v?.state==="fail");
    return<>
      <div style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0 10px"}}>
        <StatusBadge status={raw.fail_count>0?"fail":"pass"}/>
        <span style={{fontFamily:F,fontWeight:900,fontSize:13,color:raw.fail_count>0?C.danger:C.success}}>
          {raw.fail_count>0?`⚠ ${raw.fail_count} defect${raw.fail_count!==1?"s":""}`:"All clear"}
        </span>
      </div>
      <KV label="Vehicle" value={raw.vehicle_label}/>
      <KV label="Operator" value={raw.operator_name}/>
      {raw.odometer_km!=null&&<KV label="Odometer" value={`${Number(raw.odometer_km).toLocaleString()} km`}/>}
      <KV label="Submitted" value={raw.created_at?new Date(raw.created_at).toLocaleString():null}/>
      <KV label="Summary" value={`${raw.pass_count||0} pass · ${raw.fail_count||0} fail · ${raw.na_count||0} N/A`}/>
      {fails.length>0&&<>
        <SectionHdr label="Defects"/>
        {fails.map(([k,v])=><div key={k} style={{padding:"5px 0",borderBottom:`1px solid ${C.danger}22`}}>
          <div style={{fontSize:12,fontFamily:F,fontWeight:700,color:C.danger}}>{_vehicleItemLabel(k)}</div>
          {v.note&&<div style={{fontSize:11,color:C.textSub,marginTop:2,lineHeight:1.4}}>{v.note}</div>}
        </div>)}
      </>}
      <SectionHdr label="All items"/>
      {entries.map(([k,v])=><Check key={k} label={_vehicleItemLabel(k)} state={v?.state}/>)}
      {raw.defect_notes&&<KV label="Notes" value={raw.defect_notes} full/>}
    </>;
  };
  const renderDetail=rec=>{
    switch(rec.type){
      case"prestart":return renderPrestart(rec.raw);
      case"workplace":return renderWorkplace(rec.raw);
      case"maintenance":return renderMaintenance(rec.raw);
      case"downtime":return renderDowntime(rec.raw);
      case"handover":return renderHandover(rec.raw);
      case"fire":return renderFire(rec.raw);
      case"vehicle":return renderVehicle(rec.raw);
      default:return<div style={{fontSize:11,color:C.muted}}>Unknown record type.</div>;
    }
  };
  const onExpand=rec=>{
    const willOpen=expanded!==rec.id;
    setExpanded(willOpen?rec.id:null);
    if(!willOpen)return;
    if(rec.type==="handover")loadHandoverPhotos(rec.raw.id);
    if(rec.type==="fire"){
      const p=rec.raw.serial_photo_path||extById[rec.raw.extinguisher_id]?.serial_photo_path;
      if(p)loadSignedUrl("fire-extinguishers",p);
    }
  };

  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none",fontFamily:"inherit"};
  const fmtLatest=ts=>{
    if(!ts)return"No records yet";
    const k=_ymd(new Date(ts));
    return`Latest: ${_humanDate(k)} ${_fmtTime(new Date(ts).toISOString())}`;
  };

  // ── Categories view ───────────────────────────────────────────────────
  if(view==="categories"){
    const total=visibleTypes.reduce((a,t)=>a+(typeStats[t.id]?.count||0),0);
    return<div style={{paddingBottom:80}}>
      {lightbox&&<div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <img src={lightbox} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:10}}/>
        <button onClick={e=>{e.stopPropagation();setLightbox(null);}} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,.6)",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕ Close</button>
      </div>}
      <PageHdr title={readOnly?"Compliance Records":"Records"} sub={`${total.toLocaleString()} record${total!==1?"s":""}${activeMine?.name?` · ${activeMine.name}`:""}${readOnly?" · read only":""}`} back={!!onBack} onBack={onBack}/>
      <div style={{padding:"14px 16px"}}>
        {loading?<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading records…</div>:
         !activeMine?.id?<div style={{textAlign:"center",padding:"50px 22px"}}>
          <div style={{fontSize:46,marginBottom:10,opacity:.6}}>📁</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text,marginBottom:6}}>Demo mode</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Records appear here when you're signed into a real mine.</div>
        </div>:visibleTypes.map(t=>{
           const s=typeStats[t.id]||{count:0,latest:null};
           const empty=s.count===0;
           return<button key={t.id} onClick={()=>{setActiveType(t.id);setView("list");setExpanded(null);}}
             style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${t.color}`,borderRadius:14,padding:"15px 16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",opacity:empty?.65:1,transition:"all .15s"}}>
             <div style={{width:44,height:44,borderRadius:12,background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{t.icon}</div>
             <div style={{flex:1,minWidth:0}}>
               <div style={{fontFamily:F,fontWeight:900,fontSize:15,color:C.text}}>{t.label}</div>
               <div style={{fontSize:11,color:C.muted,marginTop:3}}>{empty?"No records yet":fmtLatest(s.latest)}</div>
             </div>
             <div style={{textAlign:"right",flexShrink:0,minWidth:46}}>
               <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:empty?C.muted:t.color,lineHeight:1}}>{s.count}</div>
               <div style={{fontSize:9,color:C.muted,marginTop:3,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>record{s.count!==1?"s":""}</div>
             </div>
             <span style={{color:C.muted,fontSize:18,marginLeft:2,flexShrink:0}}>›</span>
           </button>;
         })}
      </div>
    </div>;
  }

  // ── List view (single type) ───────────────────────────────────────────
  const meta=RECORD_TYPES.find(t=>t.id===activeType)||RECORD_TYPES[0];
  const typeRecords=records.filter(r=>r.type===activeType);
  const filtered=typeRecords.filter(r=>{
    const recIso=r.iso?new Date(r.iso).getTime():r.ts;
    if(from&&recIso<new Date(`${from}T00:00:00`).getTime())return false;
    if(to&&recIso>new Date(`${to}T23:59:59`).getTime())return false;
    if(opSearch.trim()){
      const q=opSearch.toLowerCase();
      if(!(r.operatorName||"").toLowerCase().includes(q))return false;
    }
    return true;
  });
  // Group by local day
  const groups=[];
  let curKey=null,curBucket=null;
  for(const rec of filtered){
    const k=_ymd(new Date(rec.ts));
    if(k!==curKey){curKey=k;curBucket={key:k,label:_humanDate(k),items:[]};groups.push(curBucket);}
    curBucket.items.push(rec);
  }

  return<div style={{paddingBottom:80}}>
    {lightbox&&<div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <img src={lightbox} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:10}}/>
      <button onClick={e=>{e.stopPropagation();setLightbox(null);}} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,.6)",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer"}}>✕ Close</button>
    </div>}
    <PageHdr title={meta.label} sub={`${typeRecords.length} record${typeRecords.length!==1?"s":""}${filtered.length!==typeRecords.length?` · ${filtered.length} matching filter`:""}`} back onBack={()=>{setView("categories");setActiveType(null);setExpanded(null);setFrom("");setTo("");setOpSearch("");}}/>

    {/* Filter strip */}
    <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${C.border}`,background:`${C.surface}cc`,position:"sticky",top:0,zIndex:10,backdropFilter:"blur(8px)"}}>
      <div style={{display:"flex",gap:6}}>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inp,flex:1,minWidth:0}} title="From"/>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inp,flex:1,minWidth:0}} title="To"/>
        <input value={opSearch} onChange={e=>setOpSearch(e.target.value)} placeholder="Operator" style={{...inp,flex:1.1,minWidth:0}}/>
      </div>
      {(from||to||opSearch)&&<button onClick={()=>{setFrom("");setTo("");setOpSearch("");}}
        style={{background:"none",border:"none",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",padding:"6px 0 0",letterSpacing:".04em"}}>Clear filters ×</button>}
    </div>

    <div style={{padding:"10px 14px"}}>
      {loading&&<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>}
      {!loading&&typeRecords.length===0&&<div style={{textAlign:"center",padding:"50px 22px"}}>
        <div style={{fontSize:46,marginBottom:10,opacity:.6}}>{meta.icon}</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text,marginBottom:6}}>No {meta.shortLabel.toLowerCase()} records yet</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>Records appear here once they're signed off in the app.</div>
      </div>}
      {!loading&&typeRecords.length>0&&filtered.length===0&&<div style={{textAlign:"center",padding:"40px 22px",color:C.muted,fontSize:13}}>No records match these filters.</div>}
      {groups.map(g=><div key={g.key} style={{marginBottom:14}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:11,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 8px"}}>{g.label} · {g.items.length}</div>
        {g.items.map(rec=>{
          const isOpen=expanded===rec.id;
          return<div key={rec.id} style={{background:C.card,border:`1px solid ${isOpen?meta.color+"66":C.border}`,borderLeft:`3px solid ${meta.color}`,borderRadius:10,marginBottom:6,overflow:"hidden"}}>
            <button onClick={()=>onExpand(rec)}
              style={{width:"100%",background:"none",border:"none",padding:"10px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:18,flexShrink:0}}>{meta.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{rec.title}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{rec.operatorName} · {_fmtTime(rec.iso)}{rec.subtitle?` · ${rec.subtitle}`:""}</div>
              </div>
              <span style={{color:C.muted,fontSize:14,flexShrink:0,transform:isOpen?"rotate(90deg)":"none",transition:"transform .15s"}}>›</span>
            </button>
            {isOpen&&<div style={{borderTop:`1px solid ${C.border}`,padding:"8px 12px 12px",background:C.surface}}>
              {renderDetail(rec)}
            </div>}
          </div>;
        })}
      </div>)}
    </div>
  </div>;
}

// ── Compliance PIN helper ─────────────────────────────────────────────────
async function hashCompliancePin(pin,mineId){
  if(!pin||!mineId)return null;
  const enc=new TextEncoder().encode(`${mineId}:${pin}`);
  const buf=await crypto.subtle.digest("SHA-256",enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// ── PIN entry modal (used to exit compliance view) ────────────────────────
function CompliancePinModal({mineId,pinHash,onClose,onSuccess}){
  const[digits,setDigits]=useState("");
  const[checking,setChecking]=useState(false);
  const[err,setErr]=useState("");
  const[shake,setShake]=useState(false);
  const submit=async d=>{
    if(d.length!==4||checking)return;
    setChecking(true);setErr("");
    try{
      const h=await hashCompliancePin(d,mineId);
      if(h===pinHash){onSuccess();}
      else{setErr("Wrong PIN. Try again.");setShake(true);setDigits("");setTimeout(()=>setShake(false),420);}
    }catch(e){console.error("pin check:",e);setErr("Couldn't verify PIN.");}
    finally{setChecking(false);}
  };
  const setD=v=>{
    const cleaned=v.replace(/\D/g,"").slice(0,4);
    setDigits(cleaned);setErr("");
    if(cleaned.length===4)submit(cleaned);
  };
  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,border:`2px solid ${C.accent}`,borderRadius:20,padding:"28px 24px 24px",width:"100%",maxWidth:340,textAlign:"center",animation:shake?"shakeX .4s":"none"}}>
      <div style={{fontSize:42,marginBottom:10}}>🔒</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.text,marginBottom:6}}>Enter PIN to exit</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.5}}>Compliance View is read-only. Enter the 4-digit PIN to return to the full app.</div>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:14}}>
        {[0,1,2,3].map(i=>{
          const filled=i<digits.length;
          return<div key={i} style={{width:46,height:54,borderRadius:10,border:`2px solid ${err?C.danger:filled?C.accent:C.border}`,background:filled?`${C.accent}15`:C.card,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:filled?C.accent:"transparent"}}/>
          </div>;
        })}
      </div>
      <input autoFocus type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="off"
        value={digits} onChange={e=>setD(e.target.value)}
        style={{position:"absolute",opacity:0,pointerEvents:"none",width:1,height:1}}/>
      <input autoFocus type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={4}
        value={digits} onChange={e=>setD(e.target.value)}
        style={{background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",fontSize:22,width:"100%",outline:"none",boxSizing:"border-box",textAlign:"center",letterSpacing:".4em",fontFamily:'"SF Mono","Menlo",monospace',fontWeight:900,marginBottom:10}}/>
      {err&&<div style={{fontSize:12,color:C.danger,fontFamily:F,fontWeight:700,marginBottom:8}}>{err}</div>}
      {checking&&<div style={{fontSize:11,color:C.muted}}>Checking…</div>}
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer",padding:"6px 0",marginTop:6}}>Cancel — stay in Compliance View</button>
    </div>
    <style>{`@keyframes shakeX{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-6px)}}`}</style>
  </div>;
}

// ── Compliance View (full screen, read-only) ──────────────────────────────
// Wraps RecordsHub with a regulatory categoryFilter, suppresses normal
// onBack, and adds a top "🔒 COMPLIANCE VIEW" band whose lock button opens
// the PIN modal. If no PIN is set yet, shows a friendly admin prompt.
const COMPLIANCE_TYPES=["workplace","prestart","fire","vehicle","handover"];

function ComplianceView({activeMine,user,allMachines,remoteOperators,onExit,onSetupPin}){
  const[showExit,setShowExit]=useState(false);
  const pinHash=activeMine?.compliance_pin_hash||null;
  const isAdmin=user?.role==="admin"||user?.role==="minemanager";

  if(!pinHash)return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"36px 22px",textAlign:"center",background:`radial-gradient(ellipse at top, ${C.amber}10, ${C.bg} 60%)`}}>
    <div style={{fontSize:56,marginBottom:14}}>🔒</div>
    <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.amber,marginBottom:8}}>Compliance View PIN required</div>
    <div style={{fontSize:13,color:C.muted,lineHeight:1.55,maxWidth:320,margin:"0 auto 22px"}}>Compliance View hands an inspector a read-only view of your records — but it needs a 4-digit PIN so they can't navigate out into the rest of the app.</div>
    {isAdmin?<button onClick={onSetupPin}
      style={{width:"100%",maxWidth:300,margin:"0 auto",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:14,padding:"15px",fontFamily:F,fontWeight:900,fontSize:16,letterSpacing:".04em",cursor:"pointer"}}>Set Compliance PIN →</button>
    :<div style={{background:`${C.info}10`,border:`1px solid ${C.info}33`,borderRadius:12,padding:"12px 14px",maxWidth:340,margin:"0 auto",fontSize:12,color:C.textSub,lineHeight:1.5}}>Ask your admin to set the PIN in <b style={{color:C.text}}>Setup → Compliance View PIN</b>.</div>}
    <button onClick={onExit} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer",marginTop:24}}>← Back to app</button>
  </div>;

  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    {/* Read-only band */}
    <div style={{flexShrink:0,background:`linear-gradient(90deg, ${C.accent}28, ${C.amber}28)`,borderBottom:`2px solid ${C.accent}88`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:18}}>🔒</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:12,color:C.accent,letterSpacing:".1em",textTransform:"uppercase"}}>Compliance View · Read only</div>
        <div style={{fontSize:10,color:C.textSub,marginTop:1}}>{activeMine?.name||"—"} · for inspector / audit handover</div>
      </div>
      <button onClick={()=>setShowExit(true)}
        style={{background:`${C.accent}25`,border:`1px solid ${C.accent}66`,borderRadius:8,padding:"7px 12px",color:C.accent,fontFamily:F,fontWeight:900,fontSize:12,letterSpacing:".04em",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:6}}>🔒 Exit</button>
    </div>

    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <RecordsHub activeMine={activeMine} allMachines={allMachines} remoteOperators={remoteOperators}
        categoryFilter={COMPLIANCE_TYPES} readOnly/>
    </div>

    {showExit&&<CompliancePinModal mineId={activeMine.id} pinHash={pinHash}
      onClose={()=>setShowExit(false)} onSuccess={onExit}/>}
  </div>;
}

// ── Compliance PIN Setup (admin) ──────────────────────────────────────────
function CompliancePinSetupScreen({activeMine,onBack,onSaved}){
  const[pin,setPin]=useState("");
  const[confirm,setConfirm]=useState("");
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const[saved,setSaved]=useState(false);
  const hasPin=!!activeMine?.compliance_pin_hash;

  const cleanPin=pin.replace(/\D/g,"").slice(0,4);
  const cleanConfirm=confirm.replace(/\D/g,"").slice(0,4);
  const valid=cleanPin.length===4&&cleanPin===cleanConfirm;

  const save=async()=>{
    if(!valid||saving||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      const h=await hashCompliancePin(cleanPin,activeMine.id);
      const{error}=await supabase.from("mines").update({compliance_pin_hash:h}).eq("id",activeMine.id);
      if(error)throw error;
      setSaved(true);setPin("");setConfirm("");
      onSaved&&onSaved(h);
      setTimeout(()=>setSaved(false),2500);
    }catch(e){console.error("save pin:",e);setErr(e.message||"Couldn't save PIN");}
    finally{setSaving(false);}
  };
  const clear=async()=>{
    if(!confirm("Remove the Compliance PIN? Compliance View will be unusable until a new one is set."))return;
    setSaving(true);setErr("");
    try{
      const{error}=await supabase.from("mines").update({compliance_pin_hash:null}).eq("id",activeMine.id);
      if(error)throw error;
      onSaved&&onSaved(null);
    }catch(e){setErr(e.message||"Couldn't clear PIN");}
    finally{setSaving(false);}
  };

  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px",fontSize:24,width:"100%",outline:"none",boxSizing:"border-box",textAlign:"center",letterSpacing:".4em",fontFamily:'"SF Mono","Menlo",monospace',fontWeight:900,marginBottom:10};

  return<div style={{paddingBottom:80}}>
    <PageHdr title="Compliance View PIN" sub="4-digit PIN to exit Compliance View · admin only" back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"11px 13px",marginBottom:18,fontSize:12,color:C.textSub,lineHeight:1.55}}>
        <div style={{fontFamily:F,fontWeight:700,color:C.info,fontSize:10,letterSpacing:".06em",textTransform:"uppercase",marginBottom:5}}>How it works</div>
        Hand the device to an inspector after tapping <b style={{color:C.text}}>Menu → Compliance View</b>. They see a read-only filing cabinet of your regulatory records and nothing else. The 4-digit PIN is required to exit back into the full app — so they can't fiddle with settings or other operators' data.
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",marginBottom:14}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:10}}>{hasPin?"Set a new PIN":"Choose a 4-digit PIN"}</div>
        <input autoFocus type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="new-password" maxLength={4}
          value={cleanPin} onChange={e=>setPin(e.target.value)} placeholder="••••" style={{...inp,border:`1px solid ${cleanPin.length===4?C.success:C.border}`}}/>
        <div style={{fontSize:11,color:C.muted,marginBottom:6,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",textAlign:"center"}}>Confirm</div>
        <input type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="new-password" maxLength={4}
          value={cleanConfirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••" style={{...inp,border:`1px solid ${cleanConfirm&&cleanPin===cleanConfirm?C.success:cleanConfirm?C.danger:C.border}`}}/>
        {cleanConfirm&&cleanPin!==cleanConfirm&&<div style={{fontSize:11,color:C.danger,marginBottom:8,textAlign:"center"}}>PINs don't match</div>}
        {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger}}>{err}</div>}
        <button onClick={save} disabled={!valid||saving}
          style={{width:"100%",background:!valid||saving?C.border:C.success,color:!valid||saving?C.muted:"#000",border:"none",borderRadius:11,padding:"13px",fontFamily:F,fontWeight:900,fontSize:15,letterSpacing:".04em",cursor:valid&&!saving?"pointer":"default",marginTop:4}}>
          {saving?"Saving…":saved?"✓ Saved":hasPin?"Update PIN":"Save PIN"}
        </button>
      </div>

      {hasPin&&<>
        <div style={{fontSize:10,color:C.danger,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 8px"}}>Danger zone</div>
        <div style={{background:`${C.danger}08`,border:`1px solid ${C.danger}33`,borderRadius:12,padding:"14px"}}>
          <div style={{fontSize:12,color:C.textSub,lineHeight:1.5,marginBottom:10}}>Remove the current PIN. Compliance View will be locked again until a new PIN is set.</div>
          <button onClick={clear} disabled={saving}
            style={{width:"100%",background:"transparent",border:`1px solid ${C.danger}55`,borderRadius:10,padding:"11px",color:C.danger,fontFamily:F,fontWeight:700,fontSize:13,cursor:saving?"default":"pointer"}}>Remove PIN</button>
        </div>
      </>}
    </div>
  </div>;
}

// ── Extinguisher Locations Admin ──────────────────────────────────────────
function ExtinguisherLocationsAdminScreen({activeMine,onBack}){
  const[locs,setLocs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showCreate,setShowCreate]=useState(false);
  const[newName,setNewName]=useState("");const[newDesc,setNewDesc]=useState("");
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");
  const load=async()=>{
    if(!activeMine?.id){setLoading(false);return;}
    setLoading(true);
    const{data,error}=await supabase.from("extinguisher_locations").select("*").eq("mine_id",activeMine.id).order("created_at",{ascending:true});
    if(!error)setLocs(data||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[activeMine?.id]);
  const create=async()=>{
    if(!newName.trim()||!activeMine?.id)return;
    setSaving(true);setErr("");
    try{
      const{error}=await supabase.from("extinguisher_locations").insert({mine_id:activeMine.id,name:newName.trim(),description:newDesc.trim()||null});
      if(error)throw error;
      setNewName("");setNewDesc("");setShowCreate(false);await load();
    }catch(e){setErr(e.message||"Could not create location");}finally{setSaving(false);}
  };
  const archive=async(id)=>{
    if(!confirm("Archive this location? It won't appear in the inspection picker."))return;
    await supabase.from("extinguisher_locations").update({is_active:false}).eq("id",id);
    await load();
  };
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 14px",fontSize:14,width:"100%",outline:"none"};
  return <div style={{paddingBottom:80}}>
    <PageHdr title="Extinguisher Locations" sub="Crusher building · workshop · office trailer · etc." back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      {loading?<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>:locs.length===0&&!showCreate?
        <div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"22px 16px",textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:42,marginBottom:8}}>🧯</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.accent,marginBottom:4}}>No locations defined yet</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:14}}>Define each place that has extinguishers — operators pick a location, then log each extinguisher they find there. The list of known extinguishers per location builds itself over time.</div>
        </div>:null}
      {locs.map(l=>(
        <div key={l.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px",marginBottom:8,opacity:l.is_active?1:0.5}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.text}}>{l.name}{!l.is_active&&<span style={{fontSize:10,color:C.muted,marginLeft:8}}>· archived</span>}</div>
              {l.description&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{l.description}</div>}
            </div>
            {l.is_active&&<button onClick={()=>archive(l.id)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Archive</button>}
          </div>
        </div>
      ))}
      {showCreate?
        <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:12,padding:"14px",marginTop:10}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:13,color:C.accent,marginBottom:10}}>New location</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Name *</div>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Crusher Building" style={{...inp,marginBottom:10}}/>
          <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Description (optional)</div>
          <input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="e.g. Walk-up steps · 2 ABC + 1 CO2" style={{...inp,marginBottom:10}}/>
          {err&&<div style={{fontSize:12,color:C.danger,marginBottom:8}}>⚠ {err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowCreate(false);setNewName("");setNewDesc("");setErr("");}} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",color:C.muted,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancel</button>
            <button onClick={create} disabled={!newName.trim()||saving} style={{flex:1,background:newName.trim()?C.success:C.border,color:newName.trim()?"#000":C.muted,border:"none",borderRadius:9,padding:"11px",fontFamily:F,fontWeight:900,fontSize:13,cursor:newName.trim()?"pointer":"default"}}>{saving?"Saving…":"Create"}</button>
          </div>
        </div>:
        <button onClick={()=>setShowCreate(true)} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:16,cursor:"pointer",marginTop:10}}>+ Add Location</button>
      }
    </div>
  </div>;
}

// ── Fire Extinguisher Inspection ──────────────────────────────────────────
function FireExtinguisherInspectScreen({activeMine,user,onBack}){
  const[stage,setStage]=useState("locations"); // locations | location | inspect
  const[locs,setLocs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[selLoc,setSelLoc]=useState(null);
  const[knownExts,setKnownExts]=useState([]);
  const[doneThisVisit,setDoneThisVisit]=useState(new Set()); // extinguisher_id (or `new:<idx>` for new ones)
  const[insptByLoc,setInsptByLoc]=useState({}); // location_id → count of inspections this month
  const[inspectExt,setInspectExt]=useState(null); // extinguisher row OR {isNew:true}
  const camRef=useRef(null);
  const[file,setFile]=useState(null);
  const[status,setStatus]=useState("pass");
  const[notes,setNotes]=useState("");
  const[serialText,setSerialText]=useState("");
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");

  // Initial load: locations + this-month inspection counts
  useEffect(()=>{
    if(!activeMine?.id){setLoading(false);return;}
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try{
        const monthStart=new Date();monthStart.setDate(1);monthStart.setHours(0,0,0,0);
        const[locRes,inspRes]=await Promise.all([
          supabase.from("extinguisher_locations").select("*").eq("mine_id",activeMine.id).eq("is_active",true).order("name"),
          supabase.from("fire_extinguisher_inspections").select("location_id,inspected_at").eq("mine_id",activeMine.id).gte("inspected_at",monthStart.toISOString()),
        ]);
        if(cancelled)return;
        if(!locRes.error)setLocs(locRes.data||[]);
        if(!inspRes.error){
          const counts={};
          for(const r of inspRes.data||[]){counts[r.location_id]=(counts[r.location_id]||0)+1;}
          setInsptByLoc(counts);
        }
      }catch(e){console.error("fire load:",e);}
      finally{if(!cancelled)setLoading(false);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id]);

  // When a location is selected, load its known extinguishers
  const openLocation=async loc=>{
    setSelLoc(loc);setStage("location");setDoneThisVisit(new Set());
    try{
      const{data}=await supabase.from("fire_extinguishers").select("*").eq("location_id",loc.id).eq("is_active",true).order("first_seen_at");
      setKnownExts(data||[]);
    }catch(e){console.error("load known exts:",e);setKnownExts([]);}
  };

  const startInspection=ext=>{
    setInspectExt(ext);
    setFile(null);setStatus("pass");setNotes("");
    setSerialText(ext?.serial_number||"");
    setErr("");
    setStage("inspect");
  };

  const saveInspection=async()=>{
    if(saving)return;
    setSaving(true);setErr("");
    try{
      let photoPath=null;
      if(file){
        photoPath=await uploadExtinguisherPhoto(file,activeMine.id,selLoc.id);
        if(!photoPath){throw new Error("Photo upload failed");}
      }
      // Resolve extinguisher row: either reuse existing or create new
      let extRow=inspectExt&&!inspectExt.isNew?inspectExt:null;
      if(!extRow){
        // New extinguisher: try to dedupe by serial within mine if provided
        if(serialText.trim()){
          const{data:existing}=await supabase.from("fire_extinguishers")
            .select("*").eq("mine_id",activeMine.id).eq("serial_number",serialText.trim()).maybeSingle();
          if(existing)extRow=existing;
        }
        if(!extRow){
          const{data:created,error:cErr}=await supabase.from("fire_extinguishers").insert({
            mine_id:activeMine.id,
            location_id:selLoc.id,
            serial_number:serialText.trim()||null,
            serial_photo_path:photoPath,
            first_seen_at:new Date().toISOString(),
          }).select().single();
          if(cErr)throw cErr;
          extRow=created;
        }
      }
      // Insert inspection row
      const{data:auth}=await supabase.auth.getUser();
      const{error:iErr}=await supabase.from("fire_extinguisher_inspections").insert({
        mine_id:activeMine.id,
        location_id:selLoc.id,
        extinguisher_id:extRow?.id||null,
        inspector_id:auth?.user?.id||null,
        inspector_name:user?.name||"Operator",
        serial_photo_path:photoPath,
        status,
        notes:notes.trim()||null,
      });
      if(iErr)throw iErr;
      // Update extinguisher's last_inspected_at
      if(extRow?.id){
        await supabase.from("fire_extinguishers").update({last_inspected_at:new Date().toISOString()}).eq("id",extRow.id);
      }
      // Update local state for visit progress
      setDoneThisVisit(prev=>{const n=new Set(prev);n.add(extRow?.id||`new:${Date.now()}`);return n;});
      // Refresh known exts (in case it was new)
      if(!inspectExt||inspectExt.isNew){
        const{data}=await supabase.from("fire_extinguishers").select("*").eq("location_id",selLoc.id).eq("is_active",true).order("first_seen_at");
        setKnownExts(data||[]);
      }
      setStage("location");
    }catch(e){console.error("save inspection:",e);setErr(e.message||"Could not save inspection");}
    finally{setSaving(false);}
  };

  const finishLocation=()=>{
    // Bump local counter so the locations list updates without a re-fetch
    setInsptByLoc(prev=>({...prev,[selLoc.id]:(prev[selLoc.id]||0)+doneThisVisit.size}));
    setSelLoc(null);setStage("locations");setKnownExts([]);setDoneThisVisit(new Set());
  };

  // ── render stages ───────────────────────────────────────────────────
  if(stage==="inspect"){
    const isNew=!inspectExt||inspectExt.isNew;
    const canSave=!!file||!isNew; // require photo when adding new
    return<div style={{paddingBottom:80}}>
      <PageHdr title={isNew?"New Extinguisher":"Inspect Extinguisher"} sub={selLoc?.name} back onBack={()=>setStage("location")}/>
      <div style={{padding:"14px 16px"}}>
        {/* Photo capture */}
        <div style={{fontSize:11,color:C.muted,marginBottom:6,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Serial tag photo {isNew&&<span style={{color:C.danger}}>*</span>}</div>
        <button onClick={()=>camRef.current?.click()} style={{width:"100%",background:C.card,border:`2px dashed ${file?C.success:C.accent}55`,borderRadius:12,padding:file?10:"22px",color:file?C.success:C.accent,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14}}>
          {file?<>
            <img src={URL.createObjectURL(file)} style={{width:54,height:54,borderRadius:8,objectFit:"cover",border:`1px solid ${C.border}`}}/>
            <span>Photo captured · tap to retake</span>
          </>:<><span style={{fontSize:32}}>📷</span><span>Take photo of serial tag</span></>}
        </button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)setFile(f);e.target.value="";}}/>

        {/* Serial (optional manual entry — OCR later) */}
        <div style={{fontSize:11,color:C.muted,marginBottom:6,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Serial number <span style={{color:C.muted,fontWeight:400}}>· optional, OCR fills later</span></div>
        <input value={serialText} onChange={e=>setSerialText(e.target.value)} placeholder="e.g. AB-12345"
          style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",marginBottom:14,fontFamily:"monospace"}}/>

        {/* Pass / Fail */}
        <div style={{fontSize:11,color:C.muted,marginBottom:6,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Status *</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["pass","✓ Pass",C.success],["fail","✕ Fail",C.danger]].map(([k,lb,col])=>{
            const sel=status===k;
            return<button key={k} onClick={()=>setStatus(k)}
              style={{flex:1,background:sel?col:`${col}15`,border:`2px solid ${col}`,borderRadius:11,padding:"14px",color:sel?"#000":col,fontFamily:F,fontWeight:900,fontSize:15,cursor:"pointer",letterSpacing:".04em"}}>{lb}</button>;
          })}
        </div>

        {/* Notes */}
        <div style={{fontSize:11,color:C.muted,marginBottom:6,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Notes <span style={{color:C.muted,fontWeight:400}}>· optional</span></div>
        <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="e.g. gauge in green · seal intact · next service due 2027-01"
          style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",marginBottom:14}}/>

        {err&&<div style={{fontSize:12,color:C.danger,marginBottom:10}}>⚠ {err}</div>}

        <button onClick={saveInspection} disabled={!canSave||saving}
          style={{width:"100%",background:canSave&&!saving?C.success:C.border,color:canSave&&!saving?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:17,letterSpacing:".04em",cursor:canSave&&!saving?"pointer":"default",marginBottom:6}}>
          {saving?"Saving…":canSave?"✅ SAVE INSPECTION":(isNew?"Take photo to continue":"Save inspection")}
        </button>
        <button onClick={()=>setStage("location")} disabled={saving} style={{width:"100%",background:"transparent",border:"none",color:C.muted,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,cursor:saving?"default":"pointer"}}>Cancel</button>
      </div>
    </div>;
  }

  if(stage==="location"){
    const doneN=doneThisVisit.size;
    const undone=knownExts.filter(e=>!doneThisVisit.has(e.id));
    return<div style={{paddingBottom:100}}>
      <PageHdr title={selLoc?.name} sub={`${knownExts.length} known extinguisher${knownExts.length!==1?"s":""} · ${doneN} inspected this visit`} back onBack={()=>{setSelLoc(null);setStage("locations");}}/>
      <div style={{padding:"14px 16px"}}>
        {/* Known extinguishers */}
        {knownExts.length===0&&<div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:12,padding:"14px",marginBottom:12,fontSize:12,color:C.textSub,lineHeight:1.5}}>
          No extinguishers have been logged at this location yet. Tap <b>Add New</b> below for each one you find.
        </div>}
        {knownExts.map(ext=>{
          const done=doneThisVisit.has(ext.id);
          const last=ext.last_inspected_at?new Date(ext.last_inspected_at).toLocaleDateString():"—";
          return<div key={ext.id} style={{background:C.card,border:`1px solid ${done?C.success+"66":C.border}`,borderLeft:`3px solid ${done?C.success:C.muted}`,borderRadius:10,padding:"11px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:done?C.success:`${C.muted}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:done?"#000":C.muted,flexShrink:0}}>{done?"✓":"○"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ext.serial_number||"(serial pending OCR)"}</div>
              <div style={{fontSize:11,color:C.muted}}>Last inspected: {last}</div>
            </div>
            {!done&&<button onClick={()=>startInspection(ext)}
              style={{background:`${C.accent}22`,border:`1px solid ${C.accent}55`,borderRadius:8,padding:"6px 12px",color:C.accent,fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>Inspect →</button>}
          </div>;
        })}

        {/* Add new */}
        <button onClick={()=>startInspection({isNew:true})}
          style={{width:"100%",background:`${C.info}15`,border:`2px dashed ${C.info}55`,borderRadius:12,padding:"15px",color:C.info,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:6,marginBottom:14}}>
          + Add new extinguisher found here
        </button>

        {/* Finish location */}
        <button onClick={finishLocation}
          style={{width:"100%",background:doneN>0||undone.length===0?C.success:C.card,color:doneN>0||undone.length===0?"#000":C.muted,border:doneN>0||undone.length===0?"none":`1px solid ${C.border}`,borderRadius:12,padding:"14px",fontFamily:F,fontWeight:900,fontSize:15,cursor:"pointer",letterSpacing:".04em"}}>
          {undone.length===0&&knownExts.length>0?"✅ All extinguishers inspected · finish here":doneN>0?`Done at this location (${doneN})`:"No more extinguishers here"}
        </button>
      </div>
    </div>;
  }

  // Stage: locations
  const monthLabel=new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"});
  return<div style={{paddingBottom:80}}>
    <PageHdr title="Fire Extinguishers" sub={`MSHA monthly inspection · ${monthLabel}`} back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      {loading?<div style={{textAlign:"center",padding:40,color:C.muted}}>Loading locations…</div>:
       locs.length===0?<div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"24px 18px",textAlign:"center"}}>
        <div style={{fontSize:42,marginBottom:8}}>🧯</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.accent,marginBottom:4}}>No locations configured</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Ask your mine manager to add extinguisher locations from Settings → Extinguisher Locations before you can run inspections.</div>
      </div>:
       <>
        <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"10px 13px",marginBottom:12,fontSize:12,color:C.textSub,lineHeight:1.5}}>
          Pick a location, then log each extinguisher you find. <b style={{color:C.text}}>Take a photo of the serial tag</b> — OCR will fill the serial later.
        </div>
        {locs.map(l=>{
          const inspectedThisMonth=insptByLoc[l.id]||0;
          const fresh=inspectedThisMonth>0;
          return<button key={l.id} onClick={()=>openLocation(l)}
            style={{width:"100%",background:C.card,border:`1px solid ${fresh?C.success+"55":C.border}`,borderLeft:`4px solid ${fresh?C.success:C.amber}`,borderRadius:12,padding:"14px 15px",marginBottom:8,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28,flexShrink:0}}>🧯</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.text}}>{l.name}</div>
              {l.description&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{l.description}</div>}
              <div style={{fontSize:11,color:fresh?C.success:C.amber,marginTop:3,fontFamily:F,fontWeight:700}}>
                {fresh?`✓ ${inspectedThisMonth} inspection${inspectedThisMonth!==1?"s":""} this month`:"⚠ Not inspected this month"}
              </div>
            </div>
            <span style={{color:C.muted,fontSize:18,flexShrink:0}}>›</span>
          </button>;
        })}
       </>
      }
    </div>
  </div>;
}

// ── Today Screen ──────────────────────────────────────────────────────────
// Operator landing page. Surfaces required-today actions (workplace exam,
// pre-start, end-shift), shows machine status, plus quick links for the
// most common shift actions. Only operators see this.

function TodayScreen({user,activeMine,activeShiftId,allMachines,onGoChecks,onGoProduction,onGoRecords,onReportIssue,onVehicleCheck,onWorkplaceExam}){
  const machine=(allMachines||[]).find(m=>m.id===user?.machine)
              ||BASE_MACHINES.find(m=>m.id===user?.machine);
  const crusher=OP.crushers.find(c=>c.id===(machine?.crusher_assigned||machine?.crusherAssigned||user?.crusherAssigned));
  const cat=CAT_DEMO[user?.machine];

  const[examDone,setExamDone]=useState(null);   // null = unknown / loading
  const[prestartDone,setPrestartDone]=useState(null);
  const[tonnesLogged,setTonnesLogged]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!activeMine?.id){
      // Demo mode — show optimistic defaults so the screen is testable.
      setExamDone(false);setPrestartDone(false);setTonnesLogged(null);setLoading(false);
      return;
    }
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try{
        const startIso=`${_today()}T00:00:00`;
        const[exam,ps,dp]=await Promise.all([
          supabase.from("workplace_exams").select("id").eq("mine_id",activeMine.id).eq("operator_id",user?.id||"_").gte("created_at",startIso).limit(1),
          user?.machine?supabase.from("prestart_logs").select("id,fuel_level,signed_off_at").eq("mine_id",activeMine.id).eq("operator_id",user?.id||"_").eq("machine_id",user.machine).gte("signed_off_at",startIso).order("signed_off_at",{ascending:false}).limit(1):Promise.resolve({data:[]}),
          activeShiftId?supabase.from("daily_production").select("tonnage").eq("shift_id",activeShiftId).maybeSingle():Promise.resolve({data:null}),
        ]);
        if(cancelled)return;
        setExamDone((exam?.data?.length||0)>0);
        setPrestartDone((ps?.data?.length||0)>0);
        setTonnesLogged(dp?.data?.tonnage??null);
      }catch(e){console.error("today load:",e);}
      finally{if(!cancelled)setLoading(false);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,user?.id,user?.machine,activeShiftId]);

  // Action item — three states: pending (red), done (green), no-machine (muted)
  const ActionItem=({icon,title,sub,state,cta,onClick,disabled})=>{
    const color=state==="done"?C.success:state==="pending"?C.danger:C.muted;
    const bg=state==="done"?`${C.success}10`:state==="pending"?`${C.danger}10`:C.card;
    const border=state==="done"?`${C.success}55`:state==="pending"?`${C.danger}55`:C.border;
    return<button onClick={onClick} disabled={disabled} style={{width:"100%",background:bg,border:`1px solid ${border}`,borderLeft:`4px solid ${color}`,borderRadius:12,padding:"14px 15px",display:"flex",alignItems:"center",gap:12,cursor:disabled?"default":"pointer",textAlign:"left",marginBottom:8,opacity:disabled?0.6:1}}>
      <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.text}}>{title}</div>
        <div style={{fontSize:11,color:state==="pending"?color:C.muted,marginTop:2,fontFamily:F,fontWeight:state==="pending"?700:400}}>{sub}</div>
      </div>
      {!disabled&&cta&&<span style={{background:state==="done"?"transparent":`${color}22`,border:state==="done"?"none":`1px solid ${color}55`,borderRadius:8,padding:state==="done"?"0":"6px 12px",color:color,fontFamily:F,fontWeight:700,fontSize:11,flexShrink:0,whiteSpace:"nowrap"}}>{state==="done"?"✓":cta}</span>}
    </button>;
  };

  const QuickAction=({icon,label,color,onClick})=>(
    <button onClick={onClick} style={{flex:"1 1 calc(50% - 4px)",background:C.card,border:`1px solid ${color}33`,borderRadius:11,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",minHeight:78}}>
      <span style={{fontSize:24}}>{icon}</span>
      <span style={{fontFamily:F,fontWeight:700,fontSize:11,color,textAlign:"center"}}>{label}</span>
    </button>
  );

  const greeting=(()=>{
    const h=new Date().getHours();
    if(h<12)return"Good morning";
    if(h<18)return"Good afternoon";
    return"Good evening";
  })();

  const remaining=[examDone===false,prestartDone===false,activeShiftId&&tonnesLogged==null].filter(Boolean).length;

  return<div style={{paddingBottom:80}} className="up">
    {/* Greeting header */}
    <div style={{background:`linear-gradient(160deg,${C.accent}18,${C.bg} 70%)`,borderBottom:`1px solid ${C.border}`,padding:"16px 16px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",fontFamily:F,fontWeight:700}}>{greeting}</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.text,marginTop:2,lineHeight:1.15}}>{user?.name||"Operator"}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:3}}>
            {machine?.model||"No machine assigned"}{crusher?` · ${crusher.name}`:""}
          </div>
        </div>
        {!loading&&<div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
          <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Required</div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:remaining===0?C.success:C.danger,lineHeight:1}}>{remaining===0?"✓":remaining}</div>
        </div>}
      </div>
    </div>

    <div style={{padding:"14px 16px"}}>
      {/* Required-today section */}
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8,paddingLeft:4}}>Today's checklist</div>

      <ActionItem
        icon="🗺"
        title="Workplace Exam"
        sub={examDone?"Done today":examDone===false?"Required before shift work · MSHA":"Checking…"}
        state={examDone?"done":examDone===false?"pending":"loading"}
        cta="Do now →"
        onClick={onWorkplaceExam}
      />

      <ActionItem
        icon="✅"
        title="Pre-start Check"
        sub={!user?.machine?"No machine assigned":prestartDone?`Signed off · ${machine?.model||""}`:"Required before operating · HSMP"}
        state={!user?.machine?"muted":prestartDone?"done":"pending"}
        cta="Do now →"
        onClick={onGoChecks}
        disabled={!user?.machine}
      />

      {activeShiftId&&<ActionItem
        icon="🪣"
        title="End-of-shift Tonnage"
        sub={tonnesLogged!=null?`${Number(tonnesLogged).toLocaleString()} t logged today`:"Log when shift wraps · daily production"}
        state={tonnesLogged!=null?"done":"pending"}
        cta="Log →"
        onClick={onGoProduction}
      />}

      {/* Machine status (demo only — real machines may not have CAT_DEMO data) */}
      {cat&&<>
        <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",margin:"18px 4px 8px"}}>My machine</div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontFamily:F,fontWeight:900,fontSize:15,color:C.text}}>{machine?.model}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>SMH {cat.smh?.toLocaleString()||"—"} · {machine?.type}</div>
            </div>
            <Pill label={(cat.status||"—").toUpperCase()} color={STATUS_COL[cat.status]||C.muted}/>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Stat label="Fuel" value={`${cat.fuel??"—"}%`} color={cat.fuel>=30?C.success:C.amber} small/>
            <Stat label="Engine" value={cat.engineTemp?`${cat.engineTemp}°C`:"—"} color={cat.engineTemp&&cat.engineTemp<95?C.success:C.amber} small/>
            <Stat label="Util" value={`${cat.utilToday??0}%`} color={C.info} small/>
          </div>
          {(cat.faults?.length||0)>0&&<div style={{marginTop:10,padding:"8px 10px",background:`${C.danger}10`,border:`1px solid ${C.danger}33`,borderRadius:8}}>
            {cat.faults.map((f,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:11}}>
              <span style={{fontFamily:F,fontWeight:900,color:f.sev==="high"?C.danger:C.amber,flexShrink:0}}>{f.code}</span>
              <span style={{color:C.textSub,lineHeight:1.4}}>{f.desc}</span>
            </div>)}
          </div>}
        </div>
      </>}

      {/* Quick actions */}
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",margin:"4px 4px 8px"}}>Quick actions</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <QuickAction icon="🚨" label="Report Issue"   color={C.danger}  onClick={onReportIssue}/>
        <QuickAction icon="🚗" label="Vehicle Check"  color={C.accent}  onClick={onVehicleCheck}/>
        <QuickAction icon="📈" label="My Production"  color={C.info}    onClick={onGoProduction}/>
        <QuickAction icon="📁" label="Records"        color={C.purple}  onClick={onGoRecords}/>
      </div>

      {!activeShiftId&&<div style={{marginTop:14,background:`${C.info}10`,border:`1px solid ${C.info}33`,borderRadius:10,padding:"10px 12px",fontSize:11,color:C.textSub,lineHeight:1.5}}>
        <div style={{color:C.info,fontFamily:F,fontWeight:700,fontSize:10,letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>No active shift</div>
        Sign back in from the app entry to open a new shift and unlock end-of-shift tonnage logging.
      </div>}
    </div>
  </div>;
}
// ── Today's Operator Rankings (header section of Team tab) ────────────────
// Loads daily_production rows for today, joins to operators via map,
// renders a compact leaderboard. No data → friendly empty state.
function TodayLeaderboard({activeMine,remoteOperators}){
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!activeMine?.id){
      // Demo mode: synthesize from LIVE_OPS
      const demo=USERS.filter(u=>u.role==="operator"&&LIVE_OPS[u.id]).map(u=>{
        const liveTph=LIVE_OPS[u.id]?.tph||120;
        const tonnage=Math.round(liveTph*(0.5+Math.random()*4));
        return{operatorId:u.id,name:u.name,tonnage,machineId:u.machine};
      }).sort((a,b)=>b.tonnage-a.tonnage);
      setRows(demo);setLoading(false);
      return;
    }
    let cancelled=false;
    (async()=>{
      try{
        const{data,error}=await supabase.from("daily_production")
          .select("operator_id,machine_id,tonnage")
          .eq("mine_id",activeMine.id)
          .eq("date",_today());
        if(error)throw error;
        const opMap=new Map((remoteOperators||[]).map(o=>[o.id,o.name]));
        const totals=new Map();
        for(const r of data||[]){
          const k=r.operator_id;
          if(!totals.has(k))totals.set(k,{operatorId:k,name:opMap.get(k)||"Operator",tonnage:0,machineId:r.machine_id});
          totals.get(k).tonnage+=Number(r.tonnage||0);
        }
        if(!cancelled){
          setRows([...totals.values()].sort((a,b)=>b.tonnage-a.tonnage));
        }
      }catch(e){console.error("today leaderboard:",e);}
      finally{if(!cancelled)setLoading(false);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,(remoteOperators||[]).length]);

  const total=rows.reduce((a,r)=>a+r.tonnage,0);

  if(loading)return <div style={{padding:"20px 14px",color:C.muted,fontSize:12,textAlign:"center"}}>Loading today's rankings…</div>;
  if(rows.length===0){
    return<div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:12,padding:"14px",marginBottom:12,fontSize:12,color:C.textSub,lineHeight:1.5}}>
      <div style={{color:C.info,fontFamily:F,fontWeight:700,fontSize:10,letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>Today's rankings</div>
      No operators have logged today's tonnage yet. Rankings update as operators end shifts.
    </div>;
  }

  return<div style={{marginBottom:14}}>
    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",padding:"0 4px 6px"}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>Today's rankings</div>
      <div style={{fontSize:11,color:C.muted}}>Total: <b style={{color:C.accent}}>{total.toLocaleString()} t</b></div>
    </div>
    {rows.slice(0,8).map((r,i)=>{
      const pct=total>0?Math.round((r.tonnage/total)*100):0;
      const col=i===0?C.accent:i===1?C.info:i===2?C.success:C.muted;
      const avatar=(r.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase();
      return<div key={r.operatorId} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:11}}>
        <div style={{fontFamily:F,fontWeight:900,fontSize:14,width:22,textAlign:"center",color:col}}>#{i+1}</div>
        <div style={{width:30,height:30,borderRadius:"50%",background:`${col}22`,border:`1.5px solid ${col}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:11,color:col,flexShrink:0}}>{avatar}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
          <div style={{height:4,background:C.border,borderRadius:99,marginTop:4,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:99}}/>
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:15,color:col,lineHeight:1}}>{r.tonnage.toLocaleString()}<span style={{fontSize:10,color:C.muted,fontWeight:400}}> t</span></div>
        </div>
      </div>;
    })}
    {rows.length>8&&<div style={{fontSize:11,color:C.muted,textAlign:"center",padding:"4px 0"}}>+{rows.length-8} more</div>}
  </div>;
}
// ── Setup Hub ─────────────────────────────────────────────────────────────
// Admin / MineManager only. Single place for all mine-setup work — replaces
// the old SettingsScreen and consolidates Add Machine + VisionLink Sync that
// used to live as scattered menu items.

function SetupHub({user,activeMine,allMachines,onClose,onNavPlants,onNavWorkplaceAreas,onNavExtinguisherLocations,onNavCheckItemConfig,onNavPeople,onNavShareCode,onNavCompliancePin,onAddMachine,onPreshiftHistory}){
  const Row=({icon,title,sub,onClick,color=C.text,right})=><button onClick={onClick} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:13,textAlign:"left"}}>
    <span style={{fontSize:22,width:30,textAlign:"center",flexShrink:0}}>{icon}</span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:14,color}}>{title}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</div>
    </div>
    {right||<span style={{color:C.muted,fontSize:14,flexShrink:0}}>›</span>}
  </button>;
  const SectionLabel=({label})=><div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",padding:"14px 4px 6px"}}>{label}</div>;
  const machineCount=(allMachines||[]).length;
  return<div style={{paddingBottom:80}}>
    <PageHdr title="Setup" sub={`Mine configuration · ${activeMine?.name||"demo"} · ${ROLES[user?.role]?.label||"admin"}`} back onBack={onClose}/>
    <div style={{padding:"4px 16px 14px"}}>
      <SectionLabel label="Crew"/>
      <Row icon="👷" title="People"                  sub="Roles · soft-remove · invite history"               onClick={onNavPeople}/>
      <Row icon="🔗" title="Mine Code"               sub={`${activeMine?.code||"——————"} · tap to share or regenerate`} onClick={onNavShareCode}/>

      <SectionLabel label="Areas & locations"/>
      <Row icon="🗺"  title="Workplace Areas"        sub="MSHA exam areas · pit benches · crusher · roads"     onClick={onNavWorkplaceAreas}/>
      <Row icon="🧯" title="Extinguisher Locations" sub="Places that have extinguishers · for monthly checks"  onClick={onNavExtinguisherLocations}/>
      <Row icon="🏭" title="Plants"                  sub="Processing lines · crusher + screens + conveyors"    onClick={onNavPlants}/>

      <SectionLabel label="Checks"/>
      <Row icon="📷" title="Check Item Configuration" sub="Toggle photo-required per check item" onClick={onNavCheckItemConfig}/>
      <Row icon="🔒" title="Compliance View PIN"      sub={activeMine?.compliance_pin_hash?"PIN set · tap to change or remove":"Not set · required for Compliance View"} onClick={onNavCompliancePin}/>

      <SectionLabel label="Fleet"/>
      <Row icon="🚛" title="Add Machine"             sub={`${machineCount} machine${machineCount!==1?"s":""} in fleet · add new equipment`} onClick={onAddMachine}/>
      <Row icon="📋" title="Pre-shift History"       sub="All operator pre-start sign-offs · audit trail"      onClick={onPreshiftHistory}/>

      <SectionLabel label="Integrations"/>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 15px",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:10}}>
          <span style={{fontSize:22,width:30,textAlign:"center"}}>📡</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:14,color:C.text}}>CAT VisionLink</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Fleet telemetry · cycle times · fluids</div>
          </div>
        </div>
        <VisionLinkSyncButton activeMine={activeMine}/>
      </div>
    </div>
  </div>;
}

function Nav({active,set,role}){
  const lv=ROLES[role]?.level||1;
  // Operators (lv 1): focused 4-tab shift workflow.
  // Supervisor / MineManager (lv 2+): mine-wide view.
  const tabs=lv===1
    ?[
      {id:"today",   icon:"🏠",label:"Today"},
      {id:"checks",  icon:"✅",label:"Checks"},
      {id:"ops",     icon:"📈",label:"Production"},
      {id:"records", icon:"📁",label:"Records"},
     ]
    :[
      {id:"board",   icon:"📡",label:"Live"},
      {id:"ops",     icon:"📈",label:"Production"},
      {id:"perf",    icon:"👷",label:"Team"},
      {id:"records", icon:"📁",label:"Records"},
      {id:"intel",   icon:"🧠",label:"Intel"},
     ];
  return <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`${C.surface}f5`,backdropFilter:"blur(12px)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
    {tabs.map(t=><button key={t.id} onClick={()=>set(t.id)} style={{flex:1,padding:"9px 0",background:"none",border:"none",color:active===t.id?C.accent:C.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:active===t.id?10:9,fontFamily:F,fontWeight:active===t.id?700:400,cursor:"pointer",borderTop:active===t.id?`2px solid ${C.accent}`:"2px solid transparent"}}>
      <span style={{fontSize:17}}>{t.icon}</span>{t.label}
    </button>)}
  </div>;
}

// ── Login ──────────────────────────────────────────────────────────────────
// ── Multi-tenant onboarding ────────────────────────────────────────────────
// Demo mines database — in production this is a Supabase `mines` table
// ── Onboarding (Welcome) ──────────────────────────────────────────────────
// Shown after sign-up / sign-in when the user has no mine memberships yet.
// Two big paths: create a new mine or join one via 6-char code.
function OnboardingScreen({onCreateMine,onJoinMine,onSignOut,onCancel}){
  const addMode=!!onCancel;
  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"space-between",background:`radial-gradient(ellipse at top, ${C.accent}12, ${C.bg} 60%)`,padding:"44px 22px 28px"}}>
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:14}}>⛏</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:32,color:C.text,marginBottom:8,letterSpacing:".02em"}}>{addMode?"Add a mine":"You're in"}</div>
      <div style={{fontSize:14,color:C.muted,lineHeight:1.55,maxWidth:300,margin:"0 auto"}}>{addMode?"Start a new one as admin, or join one with a code.":"One last step — set up your crew. You can join more mines later."}</div>
    </div>

    <div>
      <button onClick={onCreateMine}
        style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:16,padding:"20px 22px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",marginBottom:12,boxShadow:`0 6px 24px ${C.accent}33`,textAlign:"left",display:"flex",alignItems:"center",gap:16,letterSpacing:".02em"}}>
        <span style={{fontSize:34,flexShrink:0}}>⛏</span>
        <div style={{flex:1,minWidth:0}}>Create a new mine
          <div style={{fontSize:11,fontWeight:600,marginTop:4,opacity:.78,letterSpacing:".02em"}}>You'll be admin · get a code to share with your crew</div>
        </div>
        <span style={{fontSize:22}}>→</span>
      </button>

      <button onClick={onJoinMine}
        style={{width:"100%",background:C.card,border:`2px solid ${C.border}`,color:C.text,borderRadius:16,padding:"20px 22px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",marginBottom:18,textAlign:"left",display:"flex",alignItems:"center",gap:16,letterSpacing:".02em"}}>
        <span style={{fontSize:34,flexShrink:0}}>👷</span>
        <div style={{flex:1,minWidth:0}}>Join an existing mine
          <div style={{fontSize:11,fontWeight:600,marginTop:4,color:C.muted,letterSpacing:".02em"}}>Got a 6-character code from your admin?</div>
        </div>
        <span style={{fontSize:22,color:C.muted}}>→</span>
      </button>
    </div>

    <div style={{textAlign:"center",fontSize:13,color:C.muted}}>
      {addMode
        ?<button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer",padding:0}}>← Cancel</button>
        :<>Wrong account?{" "}<button onClick={onSignOut} style={{background:"none",border:"none",color:C.accent,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer",textDecoration:"underline",padding:0}}>Sign out</button></>}
    </div>
  </div>;
}

// ── Share Code Screen ─────────────────────────────────────────────────────
// Big mono share code · tap-to-copy · native share sheet · instructions.
// ── Mine Picker ───────────────────────────────────────────────────────────
// Shown when:
//   (1) sign-in lands a user with multiple mine memberships and no
//       localStorage preference yet, or
//   (2) the user taps "Switch Mine" from the menu.
// Lists each membership with role + last-active timestamp. "+ Add another"
// routes to OnboardingScreen for Create/Join.
function MinePickerScreen({onPick,onAddMine,onCancel,onSignOut}){
  const{session}=useSupabase();
  const[items,setItems]=useState([]); // {operator, mine}
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState("");

  useEffect(()=>{
    if(!session?.user?.id){setLoading(false);return;}
    let cancelled=false;
    (async()=>{
      try{
        const{data:ops,error:opErr}=await supabase.from("operators")
          .select("id,name,role,status,mine_id,last_active_at,created_at")
          .eq("auth_id",session.user.id);
        if(opErr)throw opErr;
        if(!ops||ops.length===0){setItems([]);setLoading(false);return;}
        const mineIds=[...new Set(ops.map(o=>o.mine_id).filter(Boolean))];
        const{data:mines,error:mErr}=await supabase.from("mines")
          .select("id,name,location,code")
          .in("id",mineIds);
        if(mErr)throw mErr;
        if(cancelled)return;
        const mineMap=new Map((mines||[]).map(m=>[m.id,m]));
        const enriched=ops.map(op=>({operator:op,mine:mineMap.get(op.mine_id)}))
          .filter(x=>x.mine)
          .sort((a,b)=>{
            const ta=a.operator.last_active_at?new Date(a.operator.last_active_at).getTime():0;
            const tb=b.operator.last_active_at?new Date(b.operator.last_active_at).getTime():0;
            return tb-ta||a.mine.name.localeCompare(b.mine.name);
          });
        setItems(enriched);
      }catch(e){console.error("mine picker:",e);setErr("Couldn't load your mines. Try again.");}
      finally{if(!cancelled)setLoading(false);}
    })();
    return()=>{cancelled=true;};
  },[session?.user?.id]);

  const fmtLast=ts=>{
    if(!ts)return"Never visited";
    const d=new Date(ts);
    const now=Date.now();
    const ago=now-d.getTime();
    if(ago<60_000)return"Just now";
    if(ago<3_600_000)return`${Math.floor(ago/60_000)}m ago`;
    if(ago<86_400_000)return`${Math.floor(ago/3_600_000)}h ago`;
    if(ago<7*86_400_000)return`${Math.floor(ago/86_400_000)}d ago`;
    return d.toLocaleDateString();
  };

  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`radial-gradient(ellipse at top, ${C.accent}10, ${C.bg} 60%)`,padding:"36px 22px 28px"}}>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.text,letterSpacing:".02em"}}>Choose a mine</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>{items.length>0?`${items.length} membership${items.length!==1?"s":""}`:"Pick where you're working today"}</div>
      </div>
      {onCancel&&<button onClick={onCancel}
        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 11px",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Cancel</button>}
    </div>

    <div style={{flex:1}}>
      {loading?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>Loading…</div>:
       err?<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",fontSize:12,color:C.danger}}>{err}</div>:
       items.length===0?<div style={{textAlign:"center",padding:"40px 22px"}}>
         <div style={{fontSize:46,marginBottom:10,opacity:.6}}>⛏</div>
         <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text,marginBottom:6}}>You're not in any mine yet</div>
         <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Create your own, or join one with a 6-character code.</div>
       </div>:
       items.map(({operator,mine})=>{
         const role=ROLES[operator.role]||{label:operator.role,color:C.muted,icon:"·"};
         const initials=(mine.name||"?").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
         return<button key={operator.id} onClick={()=>onPick(mine.id)}
           style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",transition:"all .15s"}}>
           <div style={{width:44,height:44,borderRadius:12,background:`${role.color}22`,border:`2px solid ${role.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:900,fontSize:15,color:role.color,flexShrink:0}}>{initials}</div>
           <div style={{flex:1,minWidth:0}}>
             <div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mine.name}</div>
             <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
               <span style={{background:`${role.color}20`,color:role.color,border:`1px solid ${role.color}44`,borderRadius:6,padding:"1px 7px",fontSize:9,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>{role.icon} {role.label.toUpperCase()}</span>
               <span style={{fontSize:11,color:C.muted}}>{fmtLast(operator.last_active_at||operator.created_at)}</span>
             </div>
             {mine.location&&<div style={{fontSize:11,color:C.muted,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mine.location}</div>}
           </div>
           <span style={{color:C.muted,fontSize:18,flexShrink:0}}>›</span>
         </button>;
       })
      }
    </div>

    <button onClick={onAddMine}
      style={{width:"100%",background:`${C.accent}15`,border:`2px dashed ${C.accent}55`,color:C.accent,borderRadius:14,padding:"15px",fontFamily:F,fontWeight:900,fontSize:15,cursor:"pointer",marginTop:14,letterSpacing:".02em"}}>
      + Add another mine
    </button>

    {onSignOut&&<div style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:18}}>
      Wrong account?{" "}<button onClick={onSignOut} style={{background:"none",border:"none",color:C.accent,fontFamily:F,fontWeight:700,fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0}}>Sign out</button>
    </div>}
  </div>;
}

function ShareCodeScreen({mine,onContinue,onBack,heroTitle="🎉",heroLine="Mine created"}){
  const[copied,setCopied]=useState(false);
  const[shared,setShared]=useState(false);
  const shareUrl="https://mineops-ten.vercel.app";
  const shareMessage=`Join my crew on MineOps. Code: ${mine.code}\n\nDownload: ${shareUrl}`;
  const copy=async()=>{
    try{await navigator.clipboard.writeText(mine.code);setCopied(true);setTimeout(()=>setCopied(false),1800);}
    catch(e){console.error("clipboard:",e);}
  };
  const share=async()=>{
    if(navigator.share){
      try{await navigator.share({title:"Join my crew on MineOps",text:shareMessage});setShared(true);setTimeout(()=>setShared(false),1800);}
      catch(e){/* user cancelled — ignore */}
    }else{
      try{await navigator.clipboard.writeText(shareMessage);setShared(true);setTimeout(()=>setShared(false),1800);}catch(e){}
    }
  };
  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`radial-gradient(ellipse at top, ${C.success}10, ${C.bg} 60%)`,padding:"36px 22px 28px"}}>
    {onBack&&<button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer",textAlign:"left",marginBottom:8,padding:0,alignSelf:"flex-start"}}>← Back</button>}
    <div style={{textAlign:"center",marginBottom:28}}>
      <div style={{fontSize:56,marginBottom:14}}>{heroTitle}</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.success}}>{mine.name}</div>
      <div style={{fontSize:12,color:C.muted,marginTop:4}}>{[mine.location,heroLine].filter(Boolean).join(" · ")}</div>
    </div>

    <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{fontSize:11,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",textAlign:"center",marginBottom:12}}>Mine share code</div>
      <button onClick={copy}
        style={{background:C.card,border:`2px solid ${C.accent}66`,borderRadius:20,padding:"28px 20px",cursor:"pointer",marginBottom:14,width:"100%"}}>
        <div style={{fontFamily:'"SF Mono","Menlo",monospace',fontWeight:900,fontSize:46,color:C.accent,letterSpacing:".24em",textAlign:"center"}}>{mine.code}</div>
        <div style={{fontSize:10,color:copied?C.success:C.muted,marginTop:12,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase"}}>{copied?"✓ Copied":"Tap to copy"}</div>
      </button>

      <button onClick={share}
        style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:14,padding:"16px",fontFamily:F,fontWeight:900,fontSize:17,letterSpacing:".04em",cursor:"pointer",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <span style={{fontSize:20}}>↗</span> {shared?"Shared":"Share with crew"}
      </button>

      <div style={{background:`${C.info}10`,border:`1px solid ${C.info}33`,borderRadius:12,padding:"12px 14px",fontSize:12,color:C.textSub,lineHeight:1.55}}>
        <div style={{fontFamily:F,fontWeight:700,color:C.info,fontSize:10,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>What's next</div>
        Your crew downloads MineOps, signs up, then enters this code on the Welcome screen. They join as Operators — change roles anytime from Setup → People.
      </div>
    </div>

    {onContinue&&<button onClick={onContinue}
      style={{width:"100%",background:C.success,color:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,fontSize:18,letterSpacing:".04em",cursor:"pointer",marginTop:22}}>
      Enter MineOps →
    </button>}
  </div>;
}

// ── Create Mine Flow ──────────────────────────────────────────────────────
// Assumes session exists (onboarding is only reached post-signup).
function CreateMineFlow({onComplete,onBack}){
  const{session}=useSupabase();
  const[mineName,setMineName]=useState("");
  const[location,setLocation]=useState("");
  const[creating,setCreating]=useState(false);
  const[err,setErr]=useState("");
  const[created,setCreated]=useState(null);
  const code=useMemo(()=>{
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skip 0/O/1/I/L
    let out="";for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;
  },[]);

  const canCreate=!!(mineName.trim()&&session);
  const submit=async()=>{
    if(!canCreate||creating)return;
    setCreating(true);setErr("");
    try{
      const{data:mine,error:mineErr}=await supabase.from("mines").insert({
        name:mineName.trim(),
        location:location.trim()||null,
        code,
        plan:"starter",
        owner_id:session.user.id,
      }).select().single();
      if(mineErr)throw mineErr;
      const adminName=session.user.user_metadata?.name||session.user.email?.split("@")[0]||"Admin";
      const{error:opErr}=await supabase.from("operators").insert({
        auth_id:session.user.id,mine_id:mine.id,name:adminName,
        role:"admin",status:"active",
      });
      if(opErr)throw opErr;
      try{localStorage.setItem("mineops:activeMineId",mine.id);}catch(e){}
      setCreated(mine);
    }catch(e){console.error("create mine:",e);setErr(friendlyAuthError(e));}
    finally{setCreating(false);}
  };

  if(created)return<ShareCodeScreen mine={created} onContinue={()=>onComplete(created)}/>;

  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 14px",fontSize:15,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:14};

  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"28px 22px"}}>
    <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer",textAlign:"left",marginBottom:18,padding:0,alignSelf:"flex-start"}}>← Back</button>
    <div style={{marginBottom:22}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.accent,letterSpacing:".02em"}}>Create your mine</div>
      <div style={{fontSize:13,color:C.muted,marginTop:6}}>You'll get a share code once it's created.</div>
    </div>
    <form onSubmit={e=>{e.preventDefault();submit();}} style={{flex:1,display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Mine name <span style={{color:C.danger}}>*</span></div>
      <input autoFocus value={mineName} onChange={e=>setMineName(e.target.value)} placeholder="Redrock Quarry"
        style={{...inp,border:`1px solid ${mineName.trim()?C.success:C.border}`}}/>
      <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Location <span style={{color:C.muted,fontWeight:400}}>· optional</span></div>
      <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Queensland, AU" style={inp}/>
      {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:C.danger,lineHeight:1.5}}>{err}</div>}
      <button type="submit" disabled={!canCreate||creating}
        style={{width:"100%",background:!canCreate||creating?C.border:`linear-gradient(135deg,${C.accent},#d4881e)`,color:!canCreate||creating?C.muted:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,fontSize:18,letterSpacing:".04em",cursor:canCreate&&!creating?"pointer":"default",transition:"all .15s",marginTop:"auto"}}>
        {creating?"Creating mine…":"Create Mine →"}
      </button>
    </form>
  </div>;
}

// ── Join Mine Flow ────────────────────────────────────────────────────────
// Single-screen 6-char code entry, auto-uppercase, auto-lookup, single tap join.
function JoinMineFlow({onComplete,onBack}){
  const{session}=useSupabase();
  const[code,setCode]=useState("");
  const[foundMine,setFoundMine]=useState(null);
  const[lookup,setLookup]=useState(false);
  const[err,setErr]=useState("");
  const[joining,setJoining]=useState(false);

  const cleanCode=code.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);

  useEffect(()=>{
    if(cleanCode.length!==6){setFoundMine(null);return;}
    if(foundMine?.code===cleanCode)return;
    let cancelled=false;
    setLookup(true);setErr("");
    (async()=>{
      try{
        const{data,error}=await supabase.from("mines").select("id,name,location,code,plan").eq("code",cleanCode).maybeSingle();
        if(cancelled)return;
        if(error)throw error;
        if(!data){setErr("No mine found with that code. Check with your admin.");setFoundMine(null);}
        else{setFoundMine(data);}
      }catch(e){if(!cancelled){setErr(friendlyAuthError(e));}}
      finally{if(!cancelled)setLookup(false);}
    })();
    return()=>{cancelled=true;};
  },[cleanCode]);

  const join=async()=>{
    if(!foundMine||!session||joining)return;
    setJoining(true);setErr("");
    try{
      const operatorName=session.user.user_metadata?.name||session.user.email?.split("@")[0]||"Operator";
      const{data:existing}=await supabase.from("operators")
        .select("id").eq("auth_id",session.user.id).eq("mine_id",foundMine.id).maybeSingle();
      if(!existing){
        const{error:opErr}=await supabase.from("operators").insert({
          auth_id:session.user.id,mine_id:foundMine.id,
          name:operatorName,role:"operator",status:"active",
        });
        if(opErr)throw opErr;
      }
      try{localStorage.setItem("mineops:activeMineId",foundMine.id);}catch(e){}
      onComplete({mine:foundMine});
    }catch(e){console.error("join mine:",e);setErr(friendlyAuthError(e));}
    finally{setJoining(false);}
  };

  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"28px 22px"}}>
    <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer",textAlign:"left",marginBottom:18,padding:0,alignSelf:"flex-start"}}>← Back</button>
    <div style={{marginBottom:24}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.accent,letterSpacing:".02em"}}>Join a mine</div>
      <div style={{fontSize:13,color:C.muted,marginTop:6}}>Enter the 6-character code your admin shared.</div>
    </div>

    <div style={{fontSize:11,color:C.muted,marginBottom:10,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",textAlign:"center"}}>Mine code</div>
    <input autoFocus value={cleanCode} onChange={e=>setCode(e.target.value)}
      onKeyDown={e=>e.key==="Enter"&&foundMine&&join()}
      placeholder="• • • • • •" autoCapitalize="characters" inputMode="text" autoComplete="one-time-code" maxLength={6}
      style={{background:C.surface,color:C.text,border:`2px solid ${foundMine?C.success:err?C.danger:C.border}`,borderRadius:16,padding:"24px 18px",fontSize:36,width:"100%",outline:"none",boxSizing:"border-box",textAlign:"center",letterSpacing:".4em",fontFamily:'"SF Mono","Menlo",monospace',fontWeight:900,textTransform:"uppercase",marginBottom:16,transition:"border-color .15s"}}/>

    {lookup&&<div style={{textAlign:"center",fontSize:12,color:C.muted,marginBottom:14}}>Looking up code…</div>}

    {foundMine&&!lookup&&<div style={{background:`${C.success}10`,border:`1.5px solid ${C.success}44`,borderRadius:14,padding:"16px 18px",marginBottom:16}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:C.success}}>{foundMine.name}</div>
      {foundMine.location&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{foundMine.location}</div>}
      <div style={{fontSize:11,color:C.textSub,marginTop:10,lineHeight:1.5}}>You'll join as an <b style={{color:C.text}}>Operator</b>. Your admin can change your role from Setup → People.</div>
    </div>}

    {err&&!lookup&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:C.danger,lineHeight:1.5}}>{err}</div>}

    <button onClick={join} disabled={!foundMine||joining||!session}
      style={{width:"100%",background:foundMine&&!joining?C.success:C.border,color:foundMine&&!joining?"#000":C.muted,border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,fontSize:18,letterSpacing:".04em",cursor:foundMine&&!joining?"pointer":"default",transition:"all .15s",marginTop:"auto"}}>
      {joining?"Joining…":foundMine?`Join ${foundMine.name} →`:"Enter a 6-character code"}
    </button>
  </div>;
}


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

// ── Auth helpers ──────────────────────────────────────────────────────────
function friendlyAuthError(e){
  const raw=(e?.message||String(e||"")).toLowerCase();
  if(raw.includes("invalid login credentials"))return"That email and password don't match.";
  if(raw.includes("user already registered")||raw.includes("already exists"))return"An account with that email already exists. Sign in instead?";
  if(raw.includes("email not confirmed"))return"Check your inbox to confirm your email.";
  if(raw.includes("rate limit"))return"Too many attempts. Try again in a few minutes.";
  if(raw.includes("password should be")||raw.includes("password is too short"))return"Use at least 8 characters for your password.";
  if(raw.includes("invalid email"))return"That doesn't look like a valid email.";
  if(raw.includes("user not found"))return"No account with that email.";
  if(raw.includes("network")||raw.includes("fetch"))return"Connection problem. Check your network and try again.";
  // Fallback — strip codes, keep readable text.
  return e?.message?e.message.replace(/^AuthApiError:\s*/,""):"Something went wrong. Try again.";
}
function passwordStrength(pw){
  if(!pw)return{score:0,label:"",color:C.muted};
  let s=0;
  if(pw.length>=8)s++;
  if(pw.length>=12)s++;
  if(/[A-Z]/.test(pw)&&/[a-z]/.test(pw))s++;
  if(/\d/.test(pw))s++;
  if(/[^\w\s]/.test(pw))s++;
  const tiers=[
    {label:"Too short",color:C.danger},
    {label:"Weak",     color:C.danger},
    {label:"Fair",     color:C.amber},
    {label:"Good",     color:C.info},
    {label:"Strong",   color:C.success},
    {label:"Excellent",color:C.success},
  ];
  return{score:s,...tiers[Math.min(s,tiers.length-1)]};
}
function isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||"").trim());}

// ── Auth Screen ───────────────────────────────────────────────────────────
// Unified sign-in / sign-up / magic-link / forgot-password / reset-password.
// Mode is internal state; URL-detected PASSWORD_RECOVERY events flip to
// "reset" via the `forceMode` prop set by the parent.
// ── People Screen (admin / minemanager) ───────────────────────────────────
// Lists every operator in the active mine. Inline role change + soft-remove.
function PeopleScreen({activeMine,user,onBack}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState("");
  const[saving,setSaving]=useState(null); // operator id currently saving
  const[bump,setBump]=useState(0);

  useEffect(()=>{
    if(!activeMine?.id){setLoading(false);return;}
    let cancelled=false;
    (async()=>{
      try{
        const{data,error}=await supabase.from("operators")
          .select("id,name,role,status,machine_id,auth_id,created_at,last_active_at,is_active")
          .eq("mine_id",activeMine.id)
          .order("created_at",{ascending:true});
        if(error)throw error;
        if(!cancelled)setItems(data||[]);
      }catch(e){console.error("people:",e);setErr("Couldn't load people.");}
      finally{if(!cancelled)setLoading(false);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,bump]);

  const ROLE_OPTS=[
    {id:"operator",label:"Operator",color:C.info},
    {id:"supervisor",label:"Supervisor",color:C.amber},
    {id:"minemanager",label:"Mine Manager",color:C.purple},
    {id:"admin",label:"Admin",color:C.danger},
  ];
  const updateRole=async(op,newRole)=>{
    if(op.role===newRole)return;
    setSaving(op.id);
    try{
      const{error}=await supabase.from("operators").update({role:newRole}).eq("id",op.id);
      if(error)throw error;
      setBump(n=>n+1);
    }catch(e){console.error(e);alert("Could not change role: "+(e.message||e));}
    finally{setSaving(null);}
  };
  const setActive=async(op,nextActive)=>{
    if(op.id===user?.id&&!nextActive){alert("You can't remove yourself. Ask another admin.");return;}
    if(!nextActive&&!confirm(`Remove ${op.name} from ${activeMine.name}? Their past records stay; they'll lose access until reactivated.`))return;
    setSaving(op.id);
    try{
      const{error}=await supabase.from("operators").update({is_active:nextActive}).eq("id",op.id);
      if(error)throw error;
      setBump(n=>n+1);
    }catch(e){console.error(e);alert("Could not "+(nextActive?"reactivate":"remove")+": "+(e.message||e));}
    finally{setSaving(null);}
  };
  const fmtLast=ts=>{
    if(!ts)return"Never";
    const ago=Date.now()-new Date(ts).getTime();
    if(ago<60_000)return"Just now";
    if(ago<3_600_000)return`${Math.floor(ago/60_000)}m ago`;
    if(ago<86_400_000)return`${Math.floor(ago/3_600_000)}h ago`;
    if(ago<7*86_400_000)return`${Math.floor(ago/86_400_000)}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const active=items.filter(o=>o.is_active!==false);
  const removed=items.filter(o=>o.is_active===false);

  return<div style={{paddingBottom:80}}>
    <PageHdr title="People" sub={`${active.length} active · ${removed.length} removed · ${activeMine?.name||"—"}`} back onBack={onBack}/>
    <div style={{padding:"12px 16px"}}>
      {loading?<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:13}}>Loading…</div>:
       err?<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",fontSize:12,color:C.danger}}>{err}</div>:
       items.length===0?<div style={{textAlign:"center",padding:"40px 22px"}}>
        <div style={{fontSize:46,marginBottom:10,opacity:.6}}>👷</div>
        <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text,marginBottom:6}}>No one's joined yet</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>Share your mine code so the crew can join. Find it in Setup → Mine Code.</div>
      </div>:<>
        {active.map(op=>{
          const role=ROLE_OPTS.find(r=>r.id===op.role)||{label:op.role,color:C.muted};
          const isSelf=op.id===user?.id;
          const isSaving=saving===op.id;
          const initials=(op.name||"?").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
          return<div key={op.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,opacity:isSaving?.5:1}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:`${role.color}22`,border:`2px solid ${role.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:900,fontSize:13,color:role.color,flexShrink:0}}>{initials}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F,fontWeight:900,fontSize:14,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{op.name}{isSelf&&<span style={{color:C.muted,fontWeight:400,fontSize:11,marginLeft:6}}>(you)</span>}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>Last active {fmtLast(op.last_active_at||op.created_at)}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
              {ROLE_OPTS.map(r=>{
                const sel=op.role===r.id;
                return<button key={r.id} onClick={()=>updateRole(op,r.id)} disabled={isSaving||isSelf&&op.role==="admin"&&r.id!=="admin"}
                  style={{flex:"1 1 auto",background:sel?`${r.color}22`:"transparent",border:`1px solid ${sel?r.color:C.border}`,borderRadius:8,padding:"5px 9px",color:sel?r.color:C.muted,fontSize:10,fontFamily:F,fontWeight:700,cursor:isSaving?"default":"pointer",letterSpacing:".04em"}}>{r.label}</button>;
              })}
              {!isSelf&&<button onClick={()=>setActive(op,false)} disabled={isSaving}
                style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:8,padding:"5px 9px",color:C.danger,fontSize:10,fontFamily:F,fontWeight:700,cursor:isSaving?"default":"pointer",letterSpacing:".04em"}}>Remove</button>}
            </div>
          </div>;
        })}

        {removed.length>0&&<>
          <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",margin:"18px 4px 8px"}}>Removed · {removed.length}</div>
          {removed.map(op=>{
            const role=ROLE_OPTS.find(r=>r.id===op.role)||{label:op.role,color:C.muted};
            const isSaving=saving===op.id;
            return<div key={op.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px",marginBottom:8,opacity:.6,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{op.name}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{role.label} · removed</div>
              </div>
              <button onClick={()=>setActive(op,true)} disabled={isSaving}
                style={{background:`${C.success}15`,border:`1px solid ${C.success}44`,borderRadius:8,padding:"5px 10px",color:C.success,fontSize:11,fontFamily:F,fontWeight:700,cursor:isSaving?"default":"pointer"}}>Reactivate</button>
            </div>;
          })}
        </>}
      </>}
    </div>
  </div>;
}

// ── Share Code Hub (admin) ────────────────────────────────────────────────
// Lets admins view, copy, share, and regenerate the mine's share code.
function ShareCodeHub({activeMine,onBack,onRegenerate}){
  const[regenerating,setRegenerating]=useState(false);
  const[err,setErr]=useState("");
  const regen=async()=>{
    if(!confirm("Regenerate the mine code? Anyone with the old code won't be able to join — they'll need the new one.\n\nExisting members aren't affected."))return;
    setRegenerating(true);setErr("");
    try{
      const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let next="";for(let i=0;i<6;i++)next+=chars[Math.floor(Math.random()*chars.length)];
      const{error}=await supabase.from("mines").update({code:next}).eq("id",activeMine.id);
      if(error)throw error;
      onRegenerate&&onRegenerate(next);
    }catch(e){console.error("regen code:",e);setErr(e.message||"Could not regenerate code");}
    finally{setRegenerating(false);}
  };
  if(!activeMine)return null;
  return<div style={{paddingBottom:80,position:"relative"}}>
    <ShareCodeScreen mine={activeMine} onBack={onBack} heroTitle="🔗" heroLine="Mine code"/>
    <div style={{padding:"0 22px 80px"}}>
      {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginTop:14,fontSize:12,color:C.danger}}>{err}</div>}
      <button onClick={regen} disabled={regenerating}
        style={{width:"100%",background:"transparent",border:`1px solid ${C.danger}55`,borderRadius:12,padding:"14px",color:C.danger,fontFamily:F,fontWeight:700,fontSize:14,cursor:regenerating?"default":"pointer",marginTop:14,letterSpacing:".02em"}}>
        {regenerating?"Regenerating…":"🔄 Regenerate code"}
      </button>
      <div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:8,lineHeight:1.5}}>Use this if the code has leaked. Existing members keep their access — only future joiners need the new code.</div>
    </div>
  </div>;
}

// ── Account Screen ────────────────────────────────────────────────────────
// User-scoped: name + email + memberships + change password + delete account.
function AccountScreen({user,activeMine,onBack,onSignOut,onProfileChanged}){
  const{session}=useSupabase();
  const[name,setName]=useState(user?.name||"");
  const[savingName,setSavingName]=useState(false);
  const[nameSaved,setNameSaved]=useState(false);
  const[sendingReset,setSendingReset]=useState(false);
  const[resetSent,setResetSent]=useState(false);
  const[err,setErr]=useState("");
  const[deleting,setDeleting]=useState(false);
  const[deleteConfirm,setDeleteConfirm]=useState("");
  const[mines,setMines]=useState([]);
  const[loadingMines,setLoadingMines]=useState(true);

  useEffect(()=>{
    if(!session?.user?.id){setLoadingMines(false);return;}
    let cancelled=false;
    (async()=>{
      try{
        const{data:ops}=await supabase.from("operators")
          .select("mine_id,role,is_active").eq("auth_id",session.user.id);
        const ids=[...new Set((ops||[]).map(o=>o.mine_id))];
        const{data:mineRows}=ids.length?await supabase.from("mines").select("id,name,location").in("id",ids):{data:[]};
        const mineMap=new Map((mineRows||[]).map(m=>[m.id,m]));
        const enriched=(ops||[]).map(o=>({...o,mine:mineMap.get(o.mine_id)})).filter(x=>x.mine);
        if(!cancelled)setMines(enriched);
      }catch(e){console.error("acct mines:",e);}
      finally{if(!cancelled)setLoadingMines(false);}
    })();
    return()=>{cancelled=true;};
  },[session?.user?.id]);

  const saveName=async()=>{
    const next=name.trim();
    if(!next||next===user?.name||savingName)return;
    setSavingName(true);setErr("");setNameSaved(false);
    try{
      // Update the current mine's operator row + auth metadata so it appears across mines.
      const tasks=[
        supabase.auth.updateUser({data:{name:next}}),
      ];
      if(user?.id)tasks.push(supabase.from("operators").update({name:next}).eq("id",user.id));
      const results=await Promise.all(tasks);
      const errs=results.map(r=>r.error).filter(Boolean);
      if(errs.length)throw errs[0];
      setNameSaved(true);setTimeout(()=>setNameSaved(false),1800);
      onProfileChanged&&onProfileChanged();
    }catch(e){console.error("save name:",e);setErr(friendlyAuthError(e));}
    finally{setSavingName(false);}
  };
  const sendReset=async()=>{
    if(!session?.user?.email||sendingReset)return;
    setSendingReset(true);setErr("");
    try{
      const{error}=await supabase.auth.resetPasswordForEmail(session.user.email,{redirectTo:window.location.origin});
      if(error)throw error;
      setResetSent(true);setTimeout(()=>setResetSent(false),3500);
    }catch(e){setErr(friendlyAuthError(e));}
    finally{setSendingReset(false);}
  };
  const doDelete=async()=>{
    if(deleteConfirm!=="DELETE"||deleting)return;
    setDeleting(true);setErr("");
    try{
      // Soft delete: mark every membership inactive. The auth user remains; full
      // deletion needs service-role and lives in a future Edge Function.
      await supabase.from("operators").update({is_active:false}).eq("auth_id",session.user.id);
      await supabase.auth.signOut();
      try{localStorage.removeItem("mineops:activeMineId");}catch(e){}
      onSignOut&&onSignOut();
    }catch(e){console.error("delete acct:",e);setErr(friendlyAuthError(e));setDeleting(false);}
  };

  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 13px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

  return<div style={{paddingBottom:80}}>
    <PageHdr title="Account" sub={session?.user?.email||"—"} back onBack={onBack}/>
    <div style={{padding:"14px 16px"}}>
      {/* Profile */}
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 8px"}}>Profile</div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:14}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{...inp,marginBottom:8}}/>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>Email</div>
        <input value={session?.user?.email||""} disabled style={{...inp,opacity:.7,marginBottom:10}}/>
        <button onClick={saveName} disabled={!name.trim()||name.trim()===user?.name||savingName}
          style={{width:"100%",background:!name.trim()||name.trim()===user?.name?C.border:C.success,color:!name.trim()||name.trim()===user?.name?C.muted:"#000",border:"none",borderRadius:9,padding:"10px",fontFamily:F,fontWeight:900,fontSize:13,cursor:"pointer"}}>
          {savingName?"Saving…":nameSaved?"✓ Saved":"Save name"}
        </button>
      </div>

      {/* Memberships */}
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 8px"}}>Memberships</div>
      {loadingMines?<div style={{padding:"14px",color:C.muted,fontSize:12}}>Loading…</div>:
       mines.length===0?<div style={{padding:"14px",color:C.muted,fontSize:12}}>You're not a member of any mine yet.</div>:
       mines.map(m=>{
         const role=ROLES[m.role]||{label:m.role,color:C.muted};
         const removed=m.is_active===false;
         return<div key={m.mine_id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px",marginBottom:8,opacity:removed?.55:1,display:"flex",alignItems:"center",gap:12}}>
           <div style={{flex:1,minWidth:0}}>
             <div style={{fontFamily:F,fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.mine.name}{m.mine_id===activeMine?.id&&<span style={{color:C.success,fontSize:10,marginLeft:8,fontWeight:900,letterSpacing:".04em"}}>· ACTIVE</span>}</div>
             {m.mine.location&&<div style={{fontSize:11,color:C.muted}}>{m.mine.location}</div>}
           </div>
           <span style={{background:`${role.color}22`,color:role.color,border:`1px solid ${role.color}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700,whiteSpace:"nowrap"}}>{removed?"REMOVED":role.label.toUpperCase()}</span>
         </div>;
       })}

      {/* Security */}
      <div style={{fontSize:10,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"18px 4px 8px"}}>Security</div>
      <button onClick={sendReset} disabled={sendingReset||!session?.user?.email}
        style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px",color:C.text,fontFamily:F,fontWeight:700,fontSize:14,cursor:sendingReset?"default":"pointer",marginBottom:8,textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20}}>🔑</span>
        <div style={{flex:1}}>{sendingReset?"Sending reset link…":resetSent?"✓ Check your inbox":"Change password"}<div style={{fontSize:11,color:C.muted,fontWeight:400,marginTop:2}}>We'll email you a reset link.</div></div>
      </button>
      <button onClick={onSignOut}
        style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px",color:C.text,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:14,textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20}}>👋</span>
        <div style={{flex:1}}>Sign out<div style={{fontSize:11,color:C.muted,fontWeight:400,marginTop:2}}>You'll need to sign back in to use the app.</div></div>
      </button>

      {/* Danger zone */}
      <div style={{fontSize:10,color:C.danger,fontFamily:F,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 8px"}}>Danger zone</div>
      <div style={{background:`${C.danger}08`,border:`1px solid ${C.danger}33`,borderRadius:12,padding:"14px"}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.danger,marginBottom:6}}>Delete account</div>
        <div style={{fontSize:12,color:C.textSub,lineHeight:1.5,marginBottom:10}}>You'll be removed from every mine and signed out. Records you signed (pre-starts, exams, tonnage) stay with the mine for compliance — only your access is revoked.</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Type <b style={{color:C.danger,letterSpacing:".1em"}}>DELETE</b> to confirm</div>
        <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE"
          style={{...inp,border:`1px solid ${deleteConfirm==="DELETE"?C.danger:C.border}`,marginBottom:10,letterSpacing:".1em",fontFamily:'"SF Mono","Menlo",monospace'}}/>
        {err&&<div style={{fontSize:12,color:C.danger,marginBottom:8}}>{err}</div>}
        <button onClick={doDelete} disabled={deleteConfirm!=="DELETE"||deleting}
          style={{width:"100%",background:deleteConfirm==="DELETE"&&!deleting?C.danger:C.border,color:deleteConfirm==="DELETE"&&!deleting?"#fff":C.muted,border:"none",borderRadius:10,padding:"12px",fontFamily:F,fontWeight:900,fontSize:14,cursor:deleteConfirm==="DELETE"&&!deleting?"pointer":"default"}}>
          {deleting?"Deleting…":"Delete my account"}
        </button>
      </div>
    </div>
  </div>;
}

// ── Email Verification Banner ─────────────────────────────────────────────
// Non-blocking. Shown at the top of the app when the auth user's email
// isn't yet confirmed. Stays dismissed (per session) once the user closes it.
function EmailVerifyBanner({email,emailConfirmed}){
  const[dismissed,setDismissed]=useState(false);
  const[resent,setResent]=useState(false);
  const[sending,setSending]=useState(false);
  useEffect(()=>{
    try{if(sessionStorage.getItem("mineops:verifyBannerDismissed")==="1")setDismissed(true);}catch(e){}
  },[]);
  if(emailConfirmed||dismissed||!email)return null;
  const dismiss=()=>{setDismissed(true);try{sessionStorage.setItem("mineops:verifyBannerDismissed","1");}catch(e){}};
  const resend=async()=>{
    if(sending)return;setSending(true);
    try{
      await supabase.auth.resend({type:"signup",email,options:{emailRedirectTo:window.location.origin}});
      setResent(true);setTimeout(()=>setResent(false),3000);
    }catch(e){console.error("resend verify:",e);}
    finally{setSending(false);}
  };
  return<div style={{background:`${C.amber}15`,borderBottom:`1px solid ${C.amber}44`,padding:"9px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
    <span style={{fontSize:16}}>✉️</span>
    <div style={{flex:1,minWidth:0,fontSize:11,color:C.text,lineHeight:1.4}}>
      Verify your email to enable password reset — check your inbox.
    </div>
    <button onClick={resend} disabled={sending} style={{background:"none",border:`1px solid ${C.amber}55`,borderRadius:7,padding:"4px 10px",color:C.amber,fontSize:10,fontFamily:F,fontWeight:700,cursor:sending?"default":"pointer",flexShrink:0}}>{sending?"…":resent?"Sent":"Resend"}</button>
    <button onClick={dismiss} style={{background:"none",border:"none",color:C.muted,fontSize:14,cursor:"pointer",padding:"2px 6px",flexShrink:0}}>✕</button>
  </div>;
}

function AuthScreen({forceMode,onResetComplete}){
  const[mode,setMode]=useState(forceMode||"signIn"); // signIn|signUp|magic|forgot|reset
  useEffect(()=>{if(forceMode)setMode(forceMode);},[forceMode]);
  const[email,setEmail]=useState("");
  const[name,setName]=useState("");
  const[pass,setPass]=useState("");
  const[newPass,setNewPass]=useState("");
  const[showPass,setShowPass]=useState(false);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const[info,setInfo]=useState("");
  const emailRef=useRef(null);
  useEffect(()=>{
    // Auto-focus email on initial render (except in reset mode where there's no email field).
    if(mode!=="reset")emailRef.current?.focus();
    setErr("");setInfo("");
  },[mode]);

  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 14px",fontSize:15,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const switchMode=m=>{setMode(m);};

  // Helpers
  const emailOk=isValidEmail(email);
  const passOk=pass.length>=8;
  const strength=passwordStrength(pass);
  const newPassStrength=passwordStrength(newPass);
  const submitDisabled=loading||(
    mode==="signIn"  ? !emailOk||pass.length<6 :
    mode==="signUp"  ? !emailOk||!passOk||!name.trim() :
    mode==="magic"   ? !emailOk :
    mode==="forgot"  ? !emailOk :
    mode==="reset"   ? newPass.length<8 :
    true);

  const submit=async()=>{
    if(submitDisabled)return;
    setLoading(true);setErr("");setInfo("");
    try{
      if(mode==="signIn"){
        const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass});
        if(error)throw error;
      }else if(mode==="signUp"){
        const{error}=await supabase.auth.signUp({
          email:email.trim(),password:pass,
          options:{data:{name:name.trim()},emailRedirectTo:window.location.origin},
        });
        if(error)throw error;
        // Some Supabase configs require email confirmation before a session is issued.
        // If no session was returned, sign in directly so we don't strand the user.
        const{data:s}=await supabase.auth.getSession();
        if(!s?.session){
          const{error:siErr}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass});
          if(siErr)throw siErr;
        }
      }else if(mode==="magic"){
        const{error}=await supabase.auth.signInWithOtp({
          email:email.trim(),
          options:{emailRedirectTo:window.location.origin},
        });
        if(error)throw error;
        setInfo("Check your inbox for a sign-in link.");
      }else if(mode==="forgot"){
        const{error}=await supabase.auth.resetPasswordForEmail(email.trim(),{
          redirectTo:window.location.origin,
        });
        if(error)throw error;
        setInfo("If an account exists for that email, we've sent reset instructions.");
      }else if(mode==="reset"){
        const{error}=await supabase.auth.updateUser({password:newPass});
        if(error)throw error;
        setInfo("Password updated.");
        setTimeout(()=>{onResetComplete&&onResetComplete();},800);
      }
    }catch(e){
      console.error("auth submit:",e);
      setErr(friendlyAuthError(e));
    }finally{setLoading(false);}
  };

  // Headers per mode
  const title={
    signIn:"Welcome back",
    signUp:"Create your account",
    magic:"Sign in with a link",
    forgot:"Reset your password",
    reset:"Set a new password",
  }[mode];
  const subtitle={
    signIn:"Sign in to your crew",
    signUp:"Two steps to your first shift",
    magic:"We'll email you a one-tap sign-in link",
    forgot:"We'll email you a reset link",
    reset:"Make it something only you'd guess",
  }[mode];

  return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`radial-gradient(ellipse at top, ${C.accent}10, ${C.bg} 60%)`,padding:"32px 22px 24px"}}>
    {/* Brand */}
    <div style={{textAlign:"center",marginBottom:18}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:38,color:C.accent,letterSpacing:".08em"}}>MINEOPS</div>
      <div style={{fontSize:10,color:C.muted,letterSpacing:".16em",textTransform:"uppercase",marginTop:2}}>Production Intelligence</div>
    </div>

    {/* Mode toggle (only on default modes) */}
    {(mode==="signIn"||mode==="signUp")&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:4,display:"flex",marginBottom:18}}>
      {[["signIn","Sign In"],["signUp","Sign Up"]].map(([m,lb])=>{
        const active=mode===m;
        return<button key={m} onClick={()=>switchMode(m)}
          style={{flex:1,background:active?C.accent:"transparent",color:active?"#000":C.muted,border:"none",borderRadius:9,padding:"10px",fontFamily:F,fontWeight:900,fontSize:13,letterSpacing:".04em",cursor:"pointer",transition:"all .15s"}}>{lb}</button>;
      })}
    </div>}

    {/* Title block */}
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.text}}>{title}</div>
      <div style={{fontSize:13,color:C.muted,marginTop:4}}>{subtitle}</div>
    </div>

    {/* Form */}
    <form onSubmit={e=>{e.preventDefault();submit();}} style={{flex:1}}>
      {/* Name (sign up only) */}
      {mode==="signUp"&&<>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Full name</div>
        <input type="text" autoComplete="name" autoCapitalize="words" value={name} onChange={e=>setName(e.target.value)}
          placeholder="Jane Smith" style={{...inp,marginBottom:12,border:`1px solid ${name.trim()?C.success:C.border}`}}/>
      </>}

      {/* Email (all but reset) */}
      {mode!=="reset"&&<>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Email</div>
        <input ref={emailRef} type="email" autoComplete="email" autoCapitalize="none" inputMode="email"
          value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"
          style={{...inp,marginBottom:12,border:`1px solid ${emailOk?C.success:C.border}`}}/>
      </>}

      {/* Password (signIn + signUp) */}
      {(mode==="signIn"||mode==="signUp")&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
          <div style={{fontSize:11,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Password</div>
          {mode==="signIn"&&<button type="button" onClick={()=>switchMode("forgot")}
            style={{background:"none",border:"none",color:C.info,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",padding:0}}>Forgot?</button>}
        </div>
        <div style={{position:"relative"}}>
          <input type={showPass?"text":"password"} autoComplete={mode==="signUp"?"new-password":"current-password"}
            value={pass} onChange={e=>setPass(e.target.value)}
            placeholder={mode==="signUp"?"At least 8 characters":"Your password"}
            style={{...inp,marginBottom:mode==="signUp"?6:12,paddingRight:62,border:`1px solid ${(mode==="signUp"?passOk:pass.length>=6)?C.success:C.border}`}}/>
          <button type="button" onClick={()=>setShowPass(s=>!s)}
            style={{position:"absolute",right:8,top:13,background:"none",border:"none",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",padding:"4px 8px"}}>{showPass?"Hide":"Show"}</button>
        </div>
        {mode==="signUp"&&pass&&<div style={{marginBottom:12}}>
          <div style={{display:"flex",gap:3,marginBottom:4}}>
            {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=strength.score?strength.color:C.border,transition:"background .15s"}}/>)}
          </div>
          <div style={{fontSize:10,color:strength.color,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>{strength.label}</div>
        </div>}
      </>}

      {/* New password (reset) */}
      {mode==="reset"&&<>
        <div style={{fontSize:11,color:C.muted,marginBottom:5,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>New password</div>
        <div style={{position:"relative"}}>
          <input type={showPass?"text":"password"} autoComplete="new-password" value={newPass} onChange={e=>setNewPass(e.target.value)}
            placeholder="At least 8 characters"
            style={{...inp,marginBottom:6,paddingRight:62,border:`1px solid ${newPass.length>=8?C.success:C.border}`}}/>
          <button type="button" onClick={()=>setShowPass(s=>!s)}
            style={{position:"absolute",right:8,top:13,background:"none",border:"none",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",padding:"4px 8px"}}>{showPass?"Hide":"Show"}</button>
        </div>
        {newPass&&<div style={{marginBottom:12}}>
          <div style={{display:"flex",gap:3,marginBottom:4}}>
            {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=newPassStrength.score?newPassStrength.color:C.border}}/>)}
          </div>
          <div style={{fontSize:10,color:newPassStrength.color,fontFamily:F,fontWeight:700,letterSpacing:".04em"}}>{newPassStrength.label}</div>
        </div>}
      </>}

      {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger,lineHeight:1.5}}>{err}</div>}
      {info&&<div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.success,lineHeight:1.5}}>{info}</div>}

      <button type="submit" disabled={submitDisabled}
        style={{width:"100%",background:submitDisabled?C.border:`linear-gradient(135deg,${C.accent},#d4881e)`,color:submitDisabled?C.muted:"#000",border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:17,letterSpacing:".04em",cursor:submitDisabled?"default":"pointer",transition:"all .15s",marginTop:4}}>
        {loading?<span style={{display:"inline-flex",alignItems:"center",gap:8}}><span className="auth-spinner"/>{ {signIn:"Signing in…",signUp:"Creating account…",magic:"Sending…",forgot:"Sending…",reset:"Updating…"}[mode] }</span>:{
          signIn:"Sign In →", signUp:"Create Account →",
          magic:"Send Magic Link", forgot:"Send Reset Link",
          reset:"Update Password",
        }[mode]}
      </button>

      {/* Mode switches */}
      {(mode==="signIn"||mode==="signUp")&&<div style={{textAlign:"center",marginTop:18}}>
        <button type="button" onClick={()=>switchMode("magic")}
          style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",color:C.textSub,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>✉ Sign in with a magic link instead</button>
      </div>}
      {(mode==="magic"||mode==="forgot")&&<div style={{textAlign:"center",marginTop:18}}>
        <button type="button" onClick={()=>switchMode("signIn")}
          style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:F,fontWeight:700,cursor:"pointer"}}>← Back to sign in</button>
      </div>}
    </form>

    {/* Footer */}
    <div style={{textAlign:"center",fontSize:10,color:C.muted,lineHeight:1.6,marginTop:24}}>
      By continuing you agree to MineOps' terms.<br/>MSHA 30 CFR Part 56 · Secure multi-tenant.
    </div>

    <style>{`@keyframes authSpin{to{transform:rotate(360deg)}}
.auth-spinner{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:authSpin .6s linear infinite}`}</style>
  </div>;
}
function TruckQuestion({user,onAnswer}){
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <div style={{textAlign:"center",marginBottom:32}}><div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.text}}>G'day, {user.name.split(" ")[0]}</div><div style={{fontFamily:F,fontWeight:700,fontSize:18,color:C.muted,marginTop:10,lineHeight:1.4}}>Did you drive a company<br/>vehicle to site today?</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <button onClick={()=>onAnswer(true)} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:16,padding:"28px 16px",color:C.text,textAlign:"center",cursor:"pointer"}}><div style={{fontSize:42,marginBottom:10}}>🚗</div><div style={{fontFamily:F,fontWeight:900,fontSize:24}}>YES</div><div style={{fontSize:11,color:C.muted,marginTop:5}}>Truck check required</div></button>
      <button onClick={()=>onAnswer(false)} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:16,padding:"28px 16px",color:C.text,textAlign:"center",cursor:"pointer"}}><div style={{fontSize:42,marginBottom:10}}>🚶</div><div style={{fontFamily:F,fontWeight:900,fontSize:24}}>NO</div><div style={{fontSize:11,color:C.muted,marginTop:5}}>Skip truck check</div></button>
    </div>
  </div>;
}

function SignOutConfirm({onConfirm,onCancel}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px 20px",width:"100%",maxWidth:320,textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:10}}>👋</div><div style={{fontFamily:F,fontWeight:900,fontSize:20,marginBottom:6}}>End Shift?</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Make sure all downtime events are logged before you go.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={onCancel} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px",fontFamily:F,fontWeight:700,fontSize:14,color:C.muted,cursor:"pointer"}}>Cancel</button><button onClick={onConfirm} style={{background:C.danger,border:"none",borderRadius:10,padding:"12px",fontFamily:F,fontWeight:700,fontSize:14,color:"#fff",cursor:"pointer"}}>Sign Out</button></div>
    </div>
  </div>;
}

// ── App Root ───────────────────────────────────────────────────────────────

function MineOpsApp() {
  const { session, authEvent, clearAuthEvent } = useSupabase()
  const [user,setUser]=useState(null)
  const [tab,setTab]=useState("board")
  const [flow,setFlow]=useState("auth")
  const [activeMine,setActiveMine]=useState(null)
  const [showSignOut,setShowSignOut]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [customMachines,setCustomMachines]=useState([])
  const [activeShiftId,setActiveShiftId]=useState(null)
  const [customCatData,setCustomCatData]=useState([])
  const [custPerfData,setCustPerfData]=useState({})
  const [profileBump,setProfileBump]=useState(0) // re-runs loadProfile after Create/Join
  // Load the user's operator profile + mine whenever session changes.
  // A single auth.uid() can belong to multiple mines (contractor, multi-site).
  // We load all rows, then pick the active mine from localStorage > first.
  useEffect(()=>{
    let cancelled=false;
    async function loadProfile(){
      if(session===undefined)return; // initial getSession() still pending
      if(!session){setUser(null);setActiveMine(null);return;}
      // Password-recovery URL: don't advance routing; AuthScreen reset mode handles it.
      if(authEvent==="PASSWORD_RECOVERY")return;
      try{
        const {data:ops,error:opErr}=await supabase
          .from("operators")
          .select("id,name,role,status,machine_id,crusher_assigned,employee_id,auth_id,mine_id")
          .eq("auth_id",session.user.id);
        if(opErr)throw opErr;
        if(cancelled)return;
        if(!ops||ops.length===0){
          // Signed in but no mine memberships → onboarding welcome
          setUser(null);
          setFlow(f=>(["auth","onboarding"].includes(f)?"onboarding":f));
          return;
        }
        // Pick active mine: localStorage preference > picker (if many) > sole row.
        const preferred=typeof localStorage!=="undefined"?localStorage.getItem("mineops:activeMineId"):null;
        let chosen=ops.find(o=>o.mine_id===preferred);
        if(!chosen){
          if(ops.length>1){
            // Multiple memberships and no remembered choice — let the user pick.
            setUser(null);setActiveMine(null);
            setFlow(f=>(["auth","onboarding","login"].includes(f)?"minePicker":f));
            return;
          }
          chosen=ops[0];
        }
        let mineRow=null;
        if(chosen.mine_id){
          const {data:m,error:mErr}=await supabase
            .from("mines")
            .select("id,name,code,location,plan,owner_id,compliance_pin_hash")
            .eq("id",chosen.mine_id)
            .maybeSingle();
          if(!mErr)mineRow=m;
        }
        const u={
          id:chosen.id,
          name:chosen.name,
          role:chosen.role,
          machine:chosen.machine_id||undefined,
          crusherAssigned:chosen.crusher_assigned||undefined,
          employeeId:chosen.employee_id||chosen.id.slice(0,8).toUpperCase(),
          avatar:(chosen.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase(),
          status:chosen.status,
          email:session.user.email,
        };
        setUser(u);
        if(mineRow){
          setActiveMine(mineRow);
          try{localStorage.setItem("mineops:activeMineId",mineRow.id);}catch(e){}
          // Fire-and-forget last_active_at bump (column added in migration 20260526010000).
          try{await supabase.from("operators").update({last_active_at:new Date().toISOString()}).eq("id",chosen.id);}catch(e){/* column may not exist yet */}
        }
        setFlow(f=>(["auth","onboarding","login","minePicker"].includes(f)?"truckQ":f));
      }catch(e){console.error("loadProfile failed:",e);}
    }
    loadProfile();
    return()=>{cancelled=true;};
  },[session,authEvent,profileBump])
  // When we have a real mine, load its machines + operators from Supabase.
  // Otherwise (demo mode) fall back to BASE_MACHINES + hardcoded USERS.
  const[remoteMachines,setRemoteMachines]=useState(null)
  const[remoteOperators,setRemoteOperators]=useState(null)
  useEffect(()=>{
    let cancelled=false;
    if(!activeMine?.id){setRemoteMachines(null);setRemoteOperators(null);return;}
    (async()=>{
      try{
        const [mRes,oRes]=await Promise.all([
          supabase.from("machines").select("*").eq("mine_id",activeMine.id),
          supabase.from("operators").select("id,name,role,status,machine_id,crusher_assigned,employee_id").eq("mine_id",activeMine.id),
        ]);
        if(cancelled)return;
        if(!mRes.error)setRemoteMachines(mRes.data||[]);
        if(!oRes.error)setRemoteOperators(oRes.data||[]);
      }catch(e){console.error("load mine data failed:",e);}
    })();
    return()=>{cancelled=true;};
  },[activeMine?.id,customMachines.length])
  // Machines: Supabase when real mine, BASE when demo
  const allMachines=activeMine?.id
    ?[...(remoteMachines||[]),...customMachines]
    :[...BASE_MACHINES,...customMachines]
  const catDemo=[...Object.entries(CAT_DEMO).map(([id,data])=>({id,meta:BASE_MACHINES.find(m=>m.id===id),data})),...customCatData]
  const lv=ROLES[user?.role]?.level||1
  // When the user/role becomes known, snap to the right home tab if the
  // current tab isn't one this role can see.
  useEffect(()=>{
    if(!user)return;
    const op=["today","checks","ops","records"];
    const mgr=["board","ops","perf","records","intel","comply"];
    const valid=lv===1?op:mgr;
    if(!valid.includes(tab))setTab(lv===1?"today":"board");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user?.role])
  const ensureShift=async(truckDriven)=>{
    if(!user?.id||!activeMine?.id||activeShiftId)return activeShiftId;
    const hr=new Date().getHours();
    const shiftType=(hr>=6&&hr<18)?"day":"night";
    try{
      const {data,error}=await supabase.from("shifts").insert({
        operator_id:user.id,mine_id:activeMine.id,
        shift_start:new Date().toISOString(),status:"active",
        truck_driven:!!truckDriven,shift_type:shiftType,
      }).select().single();
      if(error)throw error;
      setActiveShiftId(data.id);
      return data.id;
    }catch(e){console.error("ensureShift failed:",e);return null;}
  }
  const handleTruck=async drove=>{await ensureShift(drove);if(drove)setFlow("truckCheck");else setFlow(lv===1?"machines":"app")}
  const handleAddMachine=async(machine,catData)=>{
    setCustomMachines(p=>[...p,machine]);
    setCustomCatData(p=>[...p,{id:machine.id,meta:machine,data:catData}]);
    setCustPerfData(p=>({...p,[machine.id]:[]}));
    if(activeMine?.id){
      try{
        await supabase.from("machines").insert({
          id:machine.id,
          mine_id:activeMine.id,
          model:machine.model,
          type:machine.type,
          bucket_size:machine.bucket||null,
          crusher_assigned:machine.crusherAssigned||null,
          serial_number:catData?.sn||null,
          status:catData?.status||"standby",
        });
      }catch(e){console.error("persist machine failed:",e);}
    }
  }
  const handleSignOut=async()=>{await supabase.auth.signOut();try{localStorage.removeItem("mineops:activeMineId");}catch(e){}setUser(null);setActiveMine(null);setRemoteMachines(null);setRemoteOperators(null);setActiveShiftId(null);setFlow("auth");setTab("today");setShowSignOut(false);setMenuOpen(false);}
  const homeTab=lv===1?"today":"board";
  const screen=()=>{
    if(flow==="vehicleCheck")return <TruckCheckScreen onComplete={()=>setFlow("app")} activeMine={activeMine} activeShiftId={activeShiftId} user={user}/>
    if(tab==="today")return <TodayScreen user={user} activeMine={activeMine} activeShiftId={activeShiftId} allMachines={allMachines}
      onGoChecks={()=>setTab("checks")} onGoProduction={()=>setTab("ops")} onGoRecords={()=>setTab("records")}
      onReportIssue={()=>setFlow("reportIssue")} onVehicleCheck={()=>setFlow("vehicleCheck")} onWorkplaceExam={()=>setFlow("workplaceExam")}/>
    if(tab==="ops")return <ProductionScreen user={user} activeMine={activeMine} activeShiftId={activeShiftId} machineId={user?.machine} role={user?.role} allMachines={allMachines} remoteOperators={remoteOperators} onShiftEnded={()=>setActiveShiftId(null)}/>
    if(tab==="records")return <RecordsHub activeMine={activeMine} allMachines={allMachines} remoteOperators={remoteOperators} onBack={()=>setTab(homeTab)}/>
    if(tab==="checks")return <ChecksHub allMachines={allMachines} catDemo={catDemo} activeMine={activeMine} activeShiftId={activeShiftId} user={user}/>
    if(tab==="perf")return <MachinePerformanceScreen allMachines={allMachines} custPerfData={custPerfData} activeMine={activeMine} remoteOperators={remoteOperators}/>
    if(tab==="intel")return <IntelligenceHub/>
    if(tab==="comply")return <ComplianceHub/>
    return <LiveBoard remoteOperators={remoteOperators} remoteMachines={remoteMachines} activeMine={activeMine}/>
  }
  return <div style={{maxWidth:420,margin:"0 auto",height:"100vh",display:"flex",flexDirection:"column",background:C.bg,position:"relative",overflow:"hidden"}}>
    {showSignOut&&<SignOutConfirm onConfirm={handleSignOut} onCancel={()=>setShowSignOut(false)}/>}
    {menuOpen&&<MenuOverlay user={user} allMachines={allMachines} activeMine={activeMine} onNav={t=>{if(["setup","tickets","reportIssue","ticketDetail","workplaceExam","workplaceAreas","fireInspect","extinguisherLocations","minePicker","account","people","shareCode","compliance","compliancePin"].includes(t)){setFlow(t);}else{setTab(t);setFlow("app");}}} onVehicleCheck={()=>setFlow("vehicleCheck")} onClose={()=>setMenuOpen(false)}/>}
    {user&&!["auth","onboarding","createMine","joinMine","minePicker","subscription","vlSetup","login","app","vehicleCheck","addMachine","setup","plants","inspHistory","extinguisherLocations","workplaceAreas","checkItemConfig","account","people","shareCode","compliance","compliancePin"].includes(flow)&&
      <div style={{flexShrink:0,background:`${C.surface}f2`,backdropFilter:"blur(10px)",borderBottom:`1px solid ${C.border}`,padding:"9px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setMenuOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.muted,fontSize:16,cursor:"pointer",lineHeight:1}}>☰</button>
          <div style={{fontFamily:F,fontWeight:900,fontSize:16,letterSpacing:".05em",color:C.accent}}>MINEOPS</div>
        </div>
        <button onClick={()=>setShowSignOut(true)} style={{background:"none",border:"none",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Sign out</button>
      </div>}
    {(flow==="auth"||authEvent==="PASSWORD_RECOVERY")&&<div style={{flex:1,overflowY:"auto"}}><AuthScreen forceMode={authEvent==="PASSWORD_RECOVERY"?"reset":undefined} onResetComplete={()=>{clearAuthEvent&&clearAuthEvent();setFlow("auth");}}/></div>}
    {flow==="onboarding"&&authEvent!=="PASSWORD_RECOVERY"&&<div style={{flex:1,overflowY:"auto"}}><OnboardingScreen onCreateMine={()=>setFlow("createMine")} onJoinMine={()=>setFlow("joinMine")} onSignOut={handleSignOut} onCancel={activeMine?()=>setFlow("app"):undefined}/></div>}
    {flow==="minePicker"&&<div style={{flex:1,overflowY:"auto"}}><MinePickerScreen onPick={mineId=>{try{localStorage.setItem("mineops:activeMineId",mineId);}catch(e){}setProfileBump(n=>n+1);setFlow("truckQ");}} onAddMine={()=>setFlow("onboarding")} onCancel={activeMine?()=>setFlow("app"):undefined} onSignOut={activeMine?undefined:handleSignOut}/></div>}
    {flow==="createMine"&&<div style={{flex:1,overflowY:"auto"}}><CreateMineFlow onComplete={()=>{setProfileBump(n=>n+1);setFlow("truckQ");}} onBack={()=>setFlow(activeMine?"app":"onboarding")}/></div>}
    {flow==="joinMine"&&<div style={{flex:1,overflowY:"auto"}}><JoinMineFlow onComplete={()=>{setProfileBump(n=>n+1);setFlow("truckQ");}} onBack={()=>setFlow(activeMine?"app":"onboarding")}/></div>}
    {flow==="truckQ"&&<div style={{flex:1,overflowY:"auto"}}><TruckQuestion user={user} onAnswer={handleTruck}/></div>}
    {flow==="truckCheck"&&<div style={{flex:1,overflowY:"auto"}}><TruckCheckScreen onComplete={()=>setFlow(lv===1?"machines":"app")} activeMine={activeMine} activeShiftId={activeShiftId} user={user}/></div>}
    {flow==="machines"&&<div style={{flex:1,overflowY:"auto"}}><MachineSelectScreen allMachines={allMachines} catDemo={catDemo} isAdmin={user?.role==="admin"} activeMine={activeMine} activeShiftId={activeShiftId} user={user} onAddMachine={()=>setFlow("addMachine")} onComplete={()=>setFlow("app")}/></div>}
    {flow==="addMachine"&&<div style={{flex:1,overflowY:"auto"}}><AddMachineScreen allMachines={allMachines} onAdd={handleAddMachine} onBack={()=>setFlow("app")}/></div>}
    {flow==="inspHistory"&&<div style={{flex:1,overflowY:"auto"}}><PreshiftHistoryScreen mineId={activeMine?.id} onBack={()=>setFlow("setup")}/></div>}
    {flow==="setup"&&<div style={{flex:1,overflowY:"auto"}}><SetupHub user={user} activeMine={activeMine} allMachines={allMachines} onClose={()=>setFlow("app")} onNavPlants={()=>setFlow("plants")} onNavWorkplaceAreas={()=>setFlow("workplaceAreas")} onNavExtinguisherLocations={()=>setFlow("extinguisherLocations")} onNavCheckItemConfig={()=>setFlow("checkItemConfig")} onNavPeople={()=>setFlow("people")} onNavShareCode={()=>setFlow("shareCode")} onNavCompliancePin={()=>setFlow("compliancePin")} onAddMachine={()=>setFlow("addMachine")} onPreshiftHistory={()=>setFlow("inspHistory")}/></div>}
    {flow==="compliance"&&<div style={{flex:1,overflowY:"auto"}}><ComplianceView activeMine={activeMine} user={user} allMachines={allMachines} remoteOperators={remoteOperators} onExit={()=>setFlow("app")} onSetupPin={()=>setFlow("compliancePin")}/></div>}
    {flow==="compliancePin"&&<div style={{flex:1,overflowY:"auto"}}><CompliancePinSetupScreen activeMine={activeMine} onBack={()=>setFlow("setup")} onSaved={hash=>setActiveMine(m=>m?{...m,compliance_pin_hash:hash}:m)}/></div>}
    {flow==="people"&&<div style={{flex:1,overflowY:"auto"}}><PeopleScreen activeMine={activeMine} user={user} onBack={()=>setFlow("setup")}/></div>}
    {flow==="shareCode"&&<div style={{flex:1,overflowY:"auto"}}><ShareCodeHub activeMine={activeMine} onBack={()=>setFlow("setup")} onRegenerate={code=>{setActiveMine(m=>m?{...m,code}:m);setProfileBump(n=>n+1);}}/></div>}
    {flow==="account"&&<div style={{flex:1,overflowY:"auto"}}><AccountScreen user={user} activeMine={activeMine} onBack={()=>setFlow("app")} onSignOut={handleSignOut} onProfileChanged={()=>setProfileBump(n=>n+1)}/></div>}
    {flow==="checkItemConfig"&&<div style={{flex:1,overflowY:"auto"}}><CheckItemConfigScreen activeMine={activeMine} onBack={()=>setFlow("setup")}/></div>}
    {flow==="plants"&&<div style={{flex:1,overflowY:"auto"}}><PlantsAdminScreen activeMine={activeMine} onBack={()=>setFlow("setup")}/></div>}
    {flow==="extinguisherLocations"&&<div style={{flex:1,overflowY:"auto"}}><ExtinguisherLocationsAdminScreen activeMine={activeMine} onBack={()=>setFlow("setup")}/></div>}
    {flow==="fireInspect"&&<div style={{flex:1,overflowY:"auto"}}><FireExtinguisherInspectScreen activeMine={activeMine} user={user} onBack={()=>setFlow("app")}/></div>}
    {flow==="workplaceExam"&&<div style={{flex:1,overflowY:"auto"}}><WorkplaceExamScreen activeMine={activeMine} activeShiftId={activeShiftId} user={user} onComplete={()=>setFlow("app")} onBack={()=>setFlow("app")}/></div>}
    {flow==="workplaceAreas"&&<div style={{flex:1,overflowY:"auto"}}><WorkplaceAreasAdminScreen activeMine={activeMine} onBack={()=>setFlow("setup")}/></div>}
    {flow==="reportIssue"&&<div style={{flex:1,overflowY:"auto"}}><CreateTicketScreen activeMine={activeMine} activeShiftId={activeShiftId} user={user} allMachines={allMachines} defaultMachineId={user?.machine} onDone={()=>setFlow("tickets")} onBack={()=>setFlow("app")}/></div>}
    {flow==="tickets"&&<div style={{flex:1,overflowY:"auto"}}><HandoverTicketsScreen activeMine={activeMine} user={user} allMachines={allMachines} onCreate={()=>setFlow("reportIssue")} onSelect={t=>{window.__currentTicketId=t.id;setFlow("ticketDetail");}} onBack={()=>setFlow("app")}/></div>}
    {flow==="ticketDetail"&&<div style={{flex:1,overflowY:"auto"}}><TicketDetailScreen ticketId={window.__currentTicketId} activeMine={activeMine} user={user} allMachines={allMachines} onBack={()=>setFlow("tickets")}/></div>}
    {(flow==="app"||flow==="vehicleCheck")&&<>
      <EmailVerifyBanner email={session?.user?.email} emailConfirmed={!!session?.user?.email_confirmed_at}/>
      <div style={{flexShrink:0,background:`${C.surface}f2`,backdropFilter:"blur(10px)",borderBottom:`1px solid ${C.border}`,padding:"9px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setMenuOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",color:C.muted,fontSize:16,cursor:"pointer",lineHeight:1}}>☰</button>
          <div style={{fontFamily:F,fontWeight:900,fontSize:18,letterSpacing:".05em",color:C.accent}}>MINEOPS</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:`${ROLES[user?.role]?.color}20`,color:ROLES[user?.role]?.color,borderRadius:6,padding:"3px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>{ROLES[user?.role]?.icon} {ROLES[user?.role]?.label}</span>
          <button onClick={()=>setShowSignOut(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 10px",color:C.muted,fontSize:10,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:62}}>{screen()}</div>
      {flow==="app"&&<Nav active={tab} set={setTab} role={user?.role}/>}
    </>}
  </div>
}
export default function App() {
  return <AuthProvider><MineOpsApp/></AuthProvider>
}
