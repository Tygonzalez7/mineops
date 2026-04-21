import { createClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
const AuthCtx = createContext(null)
function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  return <AuthCtx.Provider value={{ session, supabase }}>{children}</AuthCtx.Provider>
}
function useSupabase() { return useContext(AuthCtx) }

import { useRef } from "react";


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

const TRUCK_CHECKS=[
  {id:"lights",label:"Lights & indicators working"},
  {id:"tyres", label:"Tyre condition — no cuts or bulges"},
  {id:"brakes",label:"Brakes operational"},
  {id:"fluid", label:"No fluid leaks under vehicle"},
  {id:"belt",  label:"Seatbelt functional & clicks in"},
];
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
const SITE_AREAS=[
  {id:"pit1",   name:"Pit 1 — Active Bench",    zone:"North",      risk:"high",  checks:[{id:"berm",label:"Berm height adequate (≥ half tyre dia.)"},{id:"crest",label:"Crest edge clearly marked"},{id:"road",label:"Haul road clear and trafficable"},{id:"access",label:"Emergency access clear"}]},
  {id:"pit2",   name:"Pit 2 — Inactive Bench",  zone:"South",      risk:"medium",checks:[{id:"berm",label:"Berm height adequate"},{id:"crest",label:"Crest edge clearly marked"},{id:"access",label:"Emergency access clear"}]},
  {id:"crusher",name:"Crusher Station",          zone:"Processing", risk:"high",  checks:[{id:"guard",label:"All guards in place"},{id:"estop",label:"Emergency stops functional"},{id:"access",label:"Emergency access clear"}]},
  {id:"roads",  name:"Haul Roads — Main Circuit",zone:"Site-wide",  risk:"low",   checks:[{id:"berm",label:"Edge berms intact"},{id:"width",label:"Road width adequate"},{id:"road",label:"Road surface trafficable"}]},
];
const RISK_COL={high:C.danger,medium:C.amber,low:C.success};
const STATUS_COL={operating:C.success,standby:C.amber,maintenance:C.danger};
const fmt$=n=>`$${n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":Math.round(n)}`;
const scGrade=s=>s>=850?C.success:s>=700?C.info:s>=500?"#8b95aa":C.amber;

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



function getCrusherFeed(crusherId){
  return USERS.filter(u=>u.role==="operator"&&u.crusherAssigned===crusherId&&LIVE_OPS[u.id]?.active).map(u=>{
    const m=BASE_MACHINES.find(x=>x.id===u.machine),lv=LIVE_OPS[u.id];
    return{userId:u.id,name:u.name,avatar:u.avatar,machine:m?.model||"?",tph:lv?.tph||0};
  });
}
const C1_FEED=Math.round((287*.87+311*.79+241*.52)/3*1.15);
const C2_FEED=54;

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
const SIZES=[
  {key:"small", label:"Small", icon:"▪",  pct:70},
  {key:"medium",label:"Medium",icon:"▪▪", pct:85},
  {key:"full",  label:"Full",  icon:"▪▪▪",pct:95},
  {key:"heaped",label:"Heaped",icon:"⬛", pct:108},
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
function MiniLine({values,color}){const W=80,H=24,mn=Math.min(...values)-2,mx=Math.max(...values)+2;const sx=i=>(i/(values.length-1))*W,sy=v=>H-((v-mn)/(mx-mn))*H;return <svg width={W} height={H} style={{overflow:"visible"}}><polyline points={values.map((v,i)=>`${sx(i)},${sy(v)}`).join(" ")} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><circle cx={sx(values.length-1)} cy={sy(values[values.length-1])} r={2.5} fill={color}/></svg>}

// ── Truck Check (shared by all roles) ────────────────────────────────────
function TruckCheckScreen({onComplete}){
  const[checks,setChecks]=useState({});const allDone=TRUCK_CHECKS.every(c=>checks[c.id]);
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <div style={{textAlign:"center",marginBottom:22}}><div style={{fontSize:48,marginBottom:8}}>🚗</div><div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.accent}}>TRUCK CHECK</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>MQSHA Reg 2017 Sch 5 · tick each item</div></div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"4px 16px",marginBottom:18}}>
      {TRUCK_CHECKS.map(c=>{const done=!!checks[c.id];return <div key={c.id} onClick={()=>setChecks(p=>({...p,[c.id]:!p[c.id]}))} style={{display:"flex",alignItems:"center",gap:14,padding:"15px 0",borderBottom:`1px solid ${C.border}22`,cursor:"pointer"}}>
        <div style={{width:28,height:28,borderRadius:7,background:done?C.success:"transparent",border:`2px solid ${done?C.success:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,transition:"all .15s"}}>{done?"✓":""}</div>
        <span style={{fontSize:15,color:done?C.text:C.textSub,fontFamily:F,fontWeight:done?700:400,flex:1}}>{c.label}</span>
      </div>;})}
    </div>
    <button onClick={()=>{if(allDone)onComplete();}} style={{width:"100%",background:allDone?C.success:C.border,color:allDone?"#000":C.muted,border:"none",borderRadius:12,padding:"17px",fontFamily:F,fontWeight:900,fontSize:20,cursor:allDone?"pointer":"default",transition:"background .2s"}}>
      {allDone?"✅  ALL GOOD — CONTINUE":`${TRUCK_CHECKS.filter(c=>!checks[c.id]).length} items remaining`}
    </button>
  </div>;
}

// ── Maintenance Gate ──────────────────────────────────────────────────────
// Fires after pre-start sign-off, before machine is cleared to operate.
// Checks grease (10 SMH), filter (100 SMH), and scheduled service (SMH-based).
// Each item must be acknowledged before the operator can start the shift.

function MaintenanceGate({machineId,allMachines,onClear,onBack}){
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
  React.useEffect(()=>{if(items.length===0)onClear([]);},[]);
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
function SinglePreStart({machineId,catDemo,allMachines,onDone}){
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
      {showGate&&<MaintenanceGate machineId={machineId} allMachines={allMachines} onClear={maintLog=>onDone({machineId,fuel:parseInt(fuel),maintLog})} onBack={()=>setShowGate(false)}/>}
      {photoViewing&&<PhotoViewer guide={photoViewing} machineType={machineType} onClose={()=>setPhotoViewing(null)}/>}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 14px",marginBottom:14}}>{PRESTART.map(c=>{const tk=machineType==="Haul Truck"?"truck":"loader";const hp=!!(PHOTO_GUIDES[tk]?.[c.id]);return <CkRow key={c.id} label={c.label} checked={!!checks[c.id]} onChange={()=>setChecks(p=>({...p,[c.id]:!p[c.id]}))} checkId={c.id} machineType={machineType} onPhoto={hp?id=>setPhotoViewing(id):null}/>;})}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Fuel level at start (%)<span style={{color:C.danger}}> *</span></div>
        <input type="number" placeholder="e.g. 78" value={fuel} onChange={e=>handleFuel(e.target.value)} style={{background:C.surface,color:C.text,border:`1px solid ${fuelErr?C.danger:fuelOk&&fuel?C.success:C.border}`,borderRadius:9,padding:"13px 14px",fontSize:16,width:"100%",outline:"none"}}/>
        {fuelErr&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>{fuelErr}</div>}
      </div>
      <button onClick={()=>{if(can)setShowGate(true);}} style={{width:"100%",background:can?C.success:C.border,color:can?"#000":C.muted,border:"none",borderRadius:12,padding:"16px",fontFamily:F,fontWeight:900,fontSize:18,cursor:can?"pointer":"default",transition:"background .2s"}}>
        {can?`✅  ${m?.model} SIGNED OFF`:"Complete all items + fuel level"}
      </button>
    </div>
  </div>;
}

function MachineSelectScreen({allMachines,catDemo,onComplete,isAdmin,onAddMachine}){
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
  if(checking)return <SinglePreStart machineId={checking} catDemo={catDemo} onDone={d=>{setCompleted(p=>({...p,[d.machineId]:d}));setChecking(null);}}/>;
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
  const[status,setStatus]=useState("standby");
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
    const newCat={sn:serial.trim()||`CUSTOM-${Date.now()}`,smh:0,fuel:100,engineTemp:0,status,faults:[],utilToday:0};
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
        <div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:10,padding:"11px 14px",marginBottom:16}}>
          <div style={{fontSize:11,color:C.accent,fontFamily:F,fontWeight:700,marginBottom:2}}>DEMO MODE</div>
          <div style={{fontSize:12,color:C.muted}}>Machine is added to local fleet only. Data is not persisted between sessions.</div>
        </div>

        <label style={lbl}>Machine model <span style={{color:C.danger}}>*</span></label>
        <input value={model} onChange={e=>setModel(e.target.value)} placeholder="e.g. CAT 777F, Komatsu PC1250, Liebherr T 264" style={{...inp,marginBottom:14,border:`1px solid ${model?C.success:C.border}`}}/>

        <label style={lbl}>Machine type <span style={{color:C.danger}}>*</span></label>
        <select value={type} onChange={e=>setType(e.target.value)} style={{...sel,marginBottom:14}}>
          {MACHINE_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={lbl}>Bucket / blade size (t)</label><input type="number" value={bucket} onChange={e=>setBucket(e.target.value)} placeholder="e.g. 8.5" style={inp}/></div>
          <div><label style={lbl}>Status</label><select value={status} onChange={e=>setStatus(e.target.value)} style={sel}><option value="operating">Operating</option><option value="standby">Standby</option><option value="maintenance">Maintenance</option></select></div>
        </div>

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
function LiveBoard(){
  const ops=USERS.filter(u=>u.role==="operator");
  const peerAvg=(uid,mtype,truck)=>{
    const peers=ops.filter(u=>{const m=BASE_MACHINES.find(x=>x.id===u.machine);return u.id!==uid&&m?.type===mtype&&LIVE_OPS[u.id]?.active;});
    if(!peers.length)return null;
    const avg=arr=>+(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
    return{val:truck?avg(peers.map(u=>LIVE_OPS[u.id].cycleMin)):avg(peers.map(u=>LIVE_OPS[u.id].tph)),count:peers.length};
  };
  const sorted=[...ops].sort((a,b)=>{
    const da=LIVE_OPS[a.id],db=LIVE_OPS[b.id];
    if(da?.active&&!db?.active)return -1;if(!da?.active&&db?.active)return 1;
    const ma=BASE_MACHINES.find(x=>x.id===a.machine),mb=BASE_MACHINES.find(x=>x.id===b.machine);
    const ta=isMachTruck(ma?.type),tb=isMachTruck(mb?.type);
    if(ta!==tb)return ta?1:-1;
    if(ta)return (da?.cycleMin||99)-(db?.cycleMin||99);
    return (db?.tph||0)-(da?.tph||0);
  });
  const tphCol=v=>v>=250?C.success:v>=150?C.accent:C.danger;
  const cycCol=v=>v<=19?C.success:v<=22?C.accent:C.danger;
  const crusherCards=OP.crushers.map(c=>{
    const contributors=getCrusherFeed(c.id);
    const total=contributors.reduce((a,x)=>a+x.tph,0);
    const pct=Math.min(100,(total/c.capacityTph)*100);
    const col=pct>=95?C.success:pct>=70?C.accent:C.danger;
    return{...c,contributors,total,pct,col};
  });
  return <div style={{paddingBottom:80}} className="up">
    <div style={{background:`linear-gradient(160deg,#0d1a08,${C.bg} 70%)`,borderBottom:`1px solid ${C.border}`,padding:"14px 15px 12px"}}>
      <div style={{fontSize:9,color:C.muted,letterSpacing:".14em",textTransform:"uppercase"}}>LIVE OPERATIONS BOARD</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.text,marginTop:1,marginBottom:12}}>Shift Performance</div>
      {crusherCards.filter(c=>c.contributors.length>0).map(c=><div key={c.id} style={{background:C.card,border:`1.5px solid ${c.col}44`,borderRadius:12,padding:"11px 13px",marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>{c.name} · {c.contributors.length} machine{c.contributors.length!==1?"s":""}</div><div style={{display:"flex",alignItems:"baseline",gap:5,marginTop:2}}><span style={{fontFamily:F,fontWeight:900,fontSize:28,color:c.col,lineHeight:1}}>{c.total}</span><span style={{fontSize:12,color:C.muted}}>/ {c.capacityTph} t/hr</span></div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:F,fontWeight:900,fontSize:22,color:c.col}}>{Math.round(c.pct)}%</div></div>
        </div>
        <Bar value={c.total} max={c.capacityTph} color={c.col} thin/>
        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
          {c.contributors.map(x=>{const frac=c.total>0?x.tph/c.total:0;const xc=x.tph>0?C.success:C.muted;return <div key={x.userId} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:`${xc}20`,border:`1.5px solid ${xc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:9,color:xc,flexShrink:0}}>{x.avatar}</div>
            <div style={{flex:1,minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:C.textSub,fontFamily:F,fontWeight:700}}>{x.machine}</span><span style={{fontSize:11,color:xc,fontFamily:F,fontWeight:900}}>{x.tph} t/hr · {Math.round(frac*100)}%</span></div><div style={{background:C.border,borderRadius:99,height:3,overflow:"hidden"}}><div style={{width:`${frac*100}%`,height:"100%",background:xc,borderRadius:99}}/></div></div>
          </div>;})}
        </div>
      </div>)}
    </div>
    <div style={{padding:"12px 15px"}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>{ops.filter(u=>LIVE_OPS[u.id]?.active).length} Operators Active</div>
      {sorted.map(user=>{
        const data=LIVE_OPS[user.id],m=BASE_MACHINES.find(x=>x.id===user.machine);
        if(!data)return null;
        const truck=isMachTruck(m?.type);
        if(!data.active)return <div key={user.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",marginBottom:8,opacity:.55}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:38,height:38,borderRadius:"50%",background:`${C.muted}22`,border:`2px solid ${C.muted}33`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:13,color:C.muted}}>{user.avatar}</div><div><div style={{fontFamily:F,fontWeight:700,fontSize:15,color:C.textSub}}>{user.name}</div><div style={{fontSize:11,color:C.muted}}>{m?.model}</div></div><div style={{marginLeft:"auto"}}><Pill label="STANDBY" color={C.muted}/></div></div></div>;
        const pc=truck?(data.cycleMin<=19?C.success:data.cycleMin<=22?C.accent:C.danger):(data.tph>=250?C.success:data.tph>=150?C.accent:C.danger);
        const pa=peerAvg(user.id,m?.type,truck);
        const diff=pa?Math.round(truck?((pa.val-data.cycleMin)/pa.val)*100:((data.tph-pa.val)/pa.val)*100):null;
        const good=diff!==null&&diff>=5,bad=diff!==null&&diff<=-5;
        return <div key={user.id} style={{background:good?`${C.success}08`:bad?`${C.danger}08`:C.card,border:`1.5px solid ${good?C.success+"33":bad?C.danger+"33":C.border}`,borderRadius:14,padding:"13px 14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:`${pc}22`,border:`2px solid ${pc}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:15,color:pc,flexShrink:0}}>{user.avatar}</div>
            <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{user.name}</div><div style={{fontSize:10,color:C.muted}}>{m?.model}{truck?` · ${m?.payload}t payload`:m?.bucket?` · ${m.bucket}t bucket`:""} · {m?.type}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontFamily:F,fontWeight:900,fontSize:30,color:pc,lineHeight:1}}>{truck?data.cycleMin:data.tph}</div><div style={{fontSize:10,color:C.muted}}>{truck?"min/cycle":"t/hr"}</div></div>
          </div>
          {truck?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:9}}>{[{l:"Trips/hr",v:data.tripsHr,c:data.tripsHr>=3?C.success:C.amber},{l:"Payload",v:`${data.payloadT}t`,c:C.info},{l:"Util",v:`${data.utilPct}%`,c:data.utilPct>=80?C.success:C.amber}].map(x=><div key={x.l} style={{background:C.surface,borderRadius:8,padding:"7px 8px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontFamily:F,fontWeight:900,fontSize:16,color:x.c,lineHeight:1.2,marginTop:2}}>{x.v}</div></div>)}</div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:9}}>{[{l:"Cycle",v:`${data.cycleMin}m`,c:data.cycleMin<=2.5?C.success:data.cycleMin<=5?C.amber:C.danger},{l:"Fill %",v:`${data.fillPct}%`,c:data.fillPct>=95?C.success:C.amber},{l:"Util",v:`${data.utilPct}%`,c:data.utilPct>=70?C.success:C.amber},{l:"t/hr",v:data.tph,c:pc}].map(x=><div key={x.l} style={{background:C.surface,borderRadius:8,padding:"7px 8px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontFamily:F,fontWeight:900,fontSize:16,color:x.c,lineHeight:1.2,marginTop:2}}>{x.v}</div></div>)}</div>}
          <div style={{background:good?`${C.success}15`:bad?`${C.danger}12`:`${C.amber}12`,border:`1px solid ${good?C.success:bad?C.danger:C.amber}33`,borderRadius:8,padding:"7px 11px"}}><span style={{fontFamily:F,fontWeight:700,fontSize:12,color:good?C.success:bad?C.danger:C.amber}}>{diff===null?`Only ${m?.type} on shift — no peer comparison`:truck?(good?`🔥 ${diff}% faster cycle than peers`:bad?`⚠ ${Math.abs(diff)}% slower than peers`:`≈ Avg cycle (${pa?.count} peers)`):good?`🔥 +${diff}% t/hr above peers`:bad?`⚠ ${diff}% t/hr below peers`:`≈ Avg t/hr (${pa?.count} peers)`}</span></div>
        </div>;
      })}
    </div>
  </div>;
}

// ── Machine Performance — weekly, machine-first, relative % ranking ─────────
function MachinePerformanceScreen({allMachines,custPerfData}){
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
  return <div style={{paddingBottom:80}} className="up">
    <PageHdr title="Machine Performance" sub="Weekly averages · tap machine to rank operators"/>
    <div style={{padding:"12px 15px"}}>
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"10px 13px",marginBottom:12}}><div style={{fontSize:11,color:C.info,fontFamily:F,fontWeight:700}}>% shown = how much better each operator is vs the one directly below them</div></div>
      {allMachines.map(m=>{
        const truck=isMachTruck(m.type),raw=[...(MACHINE_PERF[m.id]||[]),...(custPerfData[m.id]||[])];
        const ops=raw.sort((a,b)=>truck?(a.cycleMin||99)-(b.cycleMin||99):b.tph-a.tph);
        const crusher=OP.crushers.find(c=>c.id===m.crusherAssigned),cat=CAT_DEMO[m.id],sc=STATUS_COL[cat?.status]||C.info;
        const topOp=ops[0],secOp=ops[1],topVal=topOp?(truck?topOp.cycleMin:topOp.tph):null,secVal=secOp?(truck?secOp.cycleMin:secOp.tph):null;
        const gap=topVal!=null&&secVal!=null?(truck?Math.round(((secVal-topVal)/secVal)*100):Math.round(((topVal-secVal)/secVal)*100)):null;
        const topC=topOp?(truck?(topOp.cycleMin<=19?C.success:topOp.cycleMin<=22?C.accent:C.danger):(topOp.tph>=250?C.success:topOp.tph>=150?C.accent:C.danger)):C.muted;
        return <div key={m.id} onClick={()=>setSel(m.id)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 15px",marginBottom:10,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:ops.length?10:0}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:19,marginBottom:2}}>{m.model}</div><div style={{fontSize:11,color:C.muted}}>{m.type}{m.bucket?` · ${m.bucket}t`:m.payload?` · ${m.payload}t payload`:""}</div></div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}><Pill label={cat?.status?.toUpperCase()||"NEW"} color={sc}/>{crusher&&<div style={{fontSize:10,color:C.muted}}>{crusher.name}</div>}</div>
          </div>
          {ops.length>0?<div>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8,background:C.surface,borderRadius:10,padding:"9px 11px"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:`${topC}22`,border:`2px solid ${topC}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:11,color:topC}}>{topOp.avatar}</div>
              <div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:14}}>{topOp.name}</div><div style={{fontSize:10,color:C.muted}}>#1 · {topOp.shifts} shifts this week</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:F,fontWeight:900,fontSize:22,color:topC,lineHeight:1}}>{topVal}</div><div style={{fontSize:9,color:C.muted}}>{truck?"min/cycle":"t/hr"}</div></div>
            </div>
            <div style={{display:"flex",alignItems:"center",fontSize:11}}><span style={{color:C.muted}}>{ops.length} operator{ops.length!==1?"s":""} this week</span>{gap!=null&&<span style={{fontFamily:F,fontWeight:700,color:gap>=5?C.success:C.accent,marginLeft:"auto"}}>{gap>0?(truck?`#1 ${gap}% faster than #2`:`#1 +${gap}% vs #2`):"Same"} → tap to rank all</span>}</div>
          </div>:<div style={{background:C.surface,borderRadius:8,padding:"9px 11px",fontSize:12,color:C.muted,textAlign:"center"}}>No shifts recorded this week</div>}
        </div>;
      })}
    </div>
  </div>;
}

// ── Scoop Logger ──────────────────────────────────────────────────────────



function ScoopLoggerScreen({user}){
  const machine=BASE_MACHINES.find(m=>m.id===user?.machine),crusher=OP.crushers.find(c=>c.id===user?.crusherAssigned),bucketT=machine?.bucket||7.5;
  const[scoops,setScoops]=useState([]);const[sel,setSel]=useState("full");const[pop,setPop]=useState(false);const[tab,setTab]=useState("scoops");const[events,setEvents]=useState([]);
  const[idleVis,setIdleVis]=useState(false);const[idleMins,setIdleMins]=useState(0);const[simOn,setSimOn]=useState(false);const[idleNote,setIdleNote]=useState("");
  const[tick,setTick]=useState(0);
  const shiftStart=useRef(Date.now()-3*3600*1000);const firstScoop=useRef(null);const lastTap=useRef(null);const idleRef=useRef(null);const tickRef=useRef(null);
  useEffect(()=>{tickRef.current=setInterval(()=>setTick(n=>n+1),15000);return()=>{clearInterval(tickRef.current);clearInterval(idleRef.current);};},[]);
  const logScoop=()=>{const sz=SIZES.find(s=>s.key===sel),tonnes=+(bucketT*(sz.pct/100)).toFixed(2),now=Date.now(),cycle=lastTap.current?+((now-lastTap.current)/60000).toFixed(2):null;if(!firstScoop.current)firstScoop.current=now;lastTap.current=now;setPop(true);setTimeout(()=>setPop(false),220);setScoops(p=>[...p,{size:sel,tonnes,pct:sz.pct,cycle,t:now}]);};
  const rateBase=firstScoop.current?Math.max((Date.now()-firstScoop.current)/3600000,.05):null;
  const shiftElapsedH=((Date.now()-shiftStart.current)/3600000).toFixed(1);
  const totalT=+scoops.reduce((a,s)=>a+s.tonnes,0).toFixed(1);
  const sphr=scoops.length&&rateBase?+(scoops.length/rateBase).toFixed(1):0;
  const avgFill=scoops.length?Math.round(scoops.reduce((a,s)=>a+s.pct,0)/scoops.length):0;
  const avgScT=scoops.length?+(totalT/scoops.length).toFixed(2):0;
  const cycles=scoops.map(s=>s.cycle).filter(Boolean);
  const avgCyc=cycles.length?+(cycles.reduce((a,c)=>a+c,0)/cycles.length).toFixed(2):null;
  const lastCyc=cycles.length?cycles[cycles.length-1]:null;
  const tph=scoops.length?+(sphr*avgScT).toFixed(1):0;
  const gap=crusher?Math.max(0,crusher.capacityTph-tph):0;
  const fillPct=crusher&&tph?Math.min(100,(tph/crusher.capacityTph)*100):0;const barCol=fillPct>=95?C.success:fillPct>=80?C.accent:C.danger;const selSz=SIZES.find(s=>s.key===sel);
  const startIdle=()=>{if(simOn)return;setSimOn(true);let m=0;idleRef.current=setInterval(()=>{m++;setIdleMins(m);if(m>=OP.idleAlertMins){setIdleVis(true);clearInterval(idleRef.current);}},400);};
  const logReason=cat=>{const now=new Date();setEvents(p=>[...p,{cat,hrs:+(idleMins/60).toFixed(2),time:`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,note:idleNote}]);setIdleVis(false);setSimOn(false);setIdleMins(0);setIdleNote("");clearInterval(idleRef.current);};
  const flagLater=()=>{const now=new Date();setEvents(p=>[...p,{cat:"other",hrs:+(idleMins/60).toFixed(2),time:`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,note:"⚠ Reason not recorded — flagged for supervisor",flagged:true}]);setIdleVis(false);setSimOn(false);setIdleMins(0);clearInterval(idleRef.current);};
  const tb=(t,ic,lb)=><button onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",background:"none",border:"none",color:tab===t?C.accent:C.muted,fontFamily:F,fontWeight:700,fontSize:9,borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,cursor:"pointer"}}><span style={{fontSize:13}}>{ic}</span>{" "}{lb}</button>;
  return <div style={{paddingBottom:80}} className="up">
    {idleVis&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:C.surface,borderTop:`3px solid ${C.danger}`,borderRadius:"18px 18px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:420,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:16}}><div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.danger}}>🕒 IDLE {idleMins} MIN</div><div style={{fontSize:13,color:C.textSub,marginTop:4}}>Log the reason to continue.</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>{Object.entries(DT_CATS).map(([k,v])=><button key={k} onClick={()=>logReason(k)} style={{background:v.fault?`${C.danger}22`:C.card,border:`2px solid ${v.fault?C.danger:C.border}`,borderRadius:13,padding:"16px 10px",color:v.fault?C.danger:C.text,textAlign:"center",cursor:"pointer"}}><div style={{fontSize:28,marginBottom:6}}>{v.icon}</div><div style={{fontFamily:F,fontWeight:700,fontSize:14}}>{v.short}</div></button>)}</div>
        <textarea value={idleNote} onChange={e=>setIdleNote(e.target.value)} placeholder="Optional note…" rows={2} style={{background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",resize:"none",marginBottom:10}}/>
        <button onClick={flagLater} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",color:C.muted,fontSize:12,fontFamily:F,fontWeight:600,cursor:"pointer"}}>Flag for later — supervisor will be notified</button>
      </div>
    </div>}
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 15px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{fontFamily:F,fontWeight:900,fontSize:19,marginBottom:2}}>{machine?.model||"—"} <span style={{color:C.accent}}>· {crusher?.name||"—"}</span></div><div style={{fontSize:10,color:C.muted}}>{user?.employeeId} · {bucketT}t bucket · Target {OP.targetFillPct}% fill</div></div>
        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Shift</div><div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.muted}}>{shiftElapsedH}h</div></div>
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${C.border}`,paddingTop:5,marginTop:9}}>{tb("scoops","🪣","Scoops")}{tb("log","📋","Log")}{tb("blast","💥","Blast")}</div>
    </div>
    <div style={{padding:"12px 15px"}}>
      {tab==="scoops"&&<div>
        {scoops.length===0&&<div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"18px 16px",marginBottom:14,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>🪣</div><div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.accent,marginBottom:4}}>READY TO LOG</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Select scoop size below, then tap LOG SCOOP after each bucket load.</div><div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12}}><div style={{background:`${C.accent}15`,borderRadius:7,padding:"4px 10px",fontSize:10,color:C.accent,fontFamily:F,fontWeight:700}}>Cap: {crusher?.capacityTph} t/hr</div><div style={{background:`${C.info}15`,borderRadius:7,padding:"4px 10px",fontSize:10,color:C.info,fontFamily:F,fontWeight:700}}>Bucket: {bucketT}t</div></div></div>}
        {scoops.length>0&&<div style={{background:C.card,border:`1.5px solid ${barCol}44`,borderRadius:14,padding:"13px 15px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontSize:9,color:C.muted,fontFamily:F,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:3}}>Live t/hr</div><div style={{fontFamily:F,fontWeight:900,fontSize:52,color:barCol,lineHeight:1}}>{tph}</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>vs {crusher?.capacityTph} t/hr cap</div></div>
            <div style={{textAlign:"right",paddingTop:4}}>{gap>0?<div style={{background:`${C.danger}12`,border:`1px solid ${C.danger}30`,borderRadius:9,padding:"8px 12px"}}><div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.danger}}>-{gap.toFixed(0)} t/hr</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{fmt$(gap*OP.revenuePerTonne*8)} / shift</div></div>:<div style={{background:`${C.success}12`,border:`1px solid ${C.success}30`,borderRadius:9,padding:"8px 12px"}}><div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.success}}>✓ Full cap</div></div>}</div>
          </div>
          <div style={{marginTop:10}}><Bar value={tph} max={crusher?.capacityTph||320} color={barCol}/></div>
        </div>}
        <div style={{display:"flex",gap:5,marginBottom:7}}><Stat label="Scoops" value={scoops.length} color={C.accent}/><Stat label="Material" value={`${totalT}t`} color={C.success}/><Stat label="Scoops/hr" value={sphr||"—"} color={C.info}/></div>
        {scoops.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}><Stat label="Avg Cycle" value={avgCyc?`${avgCyc}min`:"—"} color={avgCyc&&avgCyc<2.5?C.success:C.amber} small/><Stat label="Avg Fill" value={`${avgFill}%`} color={avgFill>=OP.targetFillPct?C.success:C.amber} small/><Stat label="Last Cycle" value={lastCyc?`${lastCyc}min`:"—"} color={lastCyc&&lastCyc<2.5?C.success:lastCyc?C.amber:C.muted} small/></div>}
        <div style={{marginBottom:10}}><div style={{fontSize:10,color:C.muted,marginBottom:6}}>Scoop size</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7}}>{SIZES.map(s=>{const active=sel===s.key;return <button key={s.key} onClick={()=>setSel(s.key)} style={{background:active?`${C.accent}22`:"transparent",border:`2px solid ${active?C.accent:C.border}`,borderRadius:11,padding:"11px 3px",color:active?C.accent:C.muted,textAlign:"center",cursor:"pointer"}}><div style={{fontFamily:F,fontWeight:900,fontSize:20}}>{s.icon}</div><div style={{fontSize:10,fontFamily:F,fontWeight:700,marginTop:3}}>{s.label}</div><div style={{fontSize:9,color:active?C.accent:C.muted,marginTop:2}}>{s.pct}%·{(bucketT*s.pct/100).toFixed(1)}t</div></button>;})}</div></div>
        <button onClick={logScoop} className={pop?"pop":""} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#e09520)`,color:"#000",border:"none",borderRadius:14,padding:"18px",fontFamily:F,fontWeight:900,fontSize:26,letterSpacing:".04em",boxShadow:`0 4px 24px ${C.accent}44`,marginBottom:10,cursor:"pointer"}}>🪣 LOG SCOOP<div style={{fontSize:13,fontWeight:600,marginTop:3,opacity:.8}}>#{scoops.length+1} · {(bucketT*selSz.pct/100).toFixed(2)}t · {selSz.label}</div></button>
        {scoops.length>0&&<div style={{maxHeight:130,overflowY:"auto"}}><div style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto auto",gap:"0 8px",padding:"3px 0",borderBottom:`1px solid ${C.border}`,marginBottom:3}}>{["#","Size","Fill","Tonnes","Cycle"].map(h=><div key={h} style={{fontSize:8,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase"}}>{h}</div>)}</div>{[...scoops].reverse().slice(0,8).map((s,i)=>{const sz=SIZES.find(x=>x.key===s.size),fc=s.pct>=OP.targetFillPct?C.success:s.pct>=80?C.amber:C.danger,cc=s.cycle?s.cycle<2.5?C.success:s.cycle<5?C.amber:C.danger:C.muted;return <div key={i} style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto auto",gap:"0 8px",padding:"5px 0",borderBottom:`1px solid ${C.border}22`,fontSize:12}}><span style={{fontFamily:F,fontWeight:700,color:C.muted}}>#{scoops.length-i}</span><span style={{fontFamily:F,fontWeight:700,color:fc}}>{sz?.label}</span><span style={{fontFamily:F,fontWeight:700,color:fc}}>{s.pct}%</span><span style={{color:C.muted}}>{s.tonnes}t</span><span style={{fontFamily:F,fontWeight:700,color:cc}}>{s.cycle?`${s.cycle}m`:"—"}</span></div>;})}
        </div>}
        <div style={{marginTop:14,background:`${C.danger}08`,border:`1px solid ${C.danger}22`,borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:10,color:C.danger,fontFamily:F,fontWeight:700,marginBottom:6}}>⚡ IDLE DETECTION · {OP.idleAlertMins}min · DEMO: 1 sec ≈ 1 min</div><button onClick={startIdle} disabled={simOn} style={{background:simOn?C.border:C.danger,color:simOn?C.muted:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontFamily:F,fontWeight:700,cursor:simOn?"default":"pointer"}}>{simOn?`⏱ Running… ${idleMins}/${OP.idleAlertMins}min`:"Simulate Idle Alert"}</button></div>
      </div>}
      
      {tab==="log"&&<div><div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",marginBottom:10}}>Downtime Log</div>{events.length===0?<Card><div style={{fontSize:13,color:C.success,textAlign:"center",padding:16}}>✓ No downtime events this shift</div></Card>:events.map((e,i)=>{const dc=DT_CATS[e.cat];return <div key={i} style={{background:C.card,border:`1px solid ${e.flagged?C.amber:dc?.fault?C.danger:C.border}33`,borderLeft:`4px solid ${e.flagged?C.amber:dc?.fault?C.danger:C.muted}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:20,flexShrink:0}}>{dc?.icon}</span><div style={{flex:1}}><div style={{fontFamily:F,fontWeight:700,fontSize:14}}>{dc?.label}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{e.time} · {(e.hrs*60).toFixed(0)}min{e.note?` · "${e.note}"`:""}</div></div>{(dc?.fault||e.flagged)&&<Pill label={e.flagged?"FLAGGED":"OP FAULT"} color={e.flagged?C.amber:C.danger}/>}</div></div>;})}
      </div>}
      {tab==="blast"&&<div>{BLASTS.filter(b=>b.status==="upcoming").map(b=><div key={b.id} style={{background:`${C.amber}10`,border:`1px solid ${C.amber}44`,borderRadius:12,padding:"14px 15px",marginBottom:10}}><div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.amber,marginBottom:3}}>⚠ NEXT BLAST</div><div style={{fontFamily:F,fontWeight:900,fontSize:18,marginBottom:2}}>{b.label}</div><div style={{fontSize:12,color:C.muted}}>Today at {b.time} · {b.dur}min hold</div></div>)}{BLASTS.map(b=>{const sc={upcoming:C.amber,completed:C.muted,scheduled:C.info};return <Card key={b.id} style={{padding:"11px 13px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:F,fontWeight:700,fontSize:13}}>{b.label}</div><div style={{fontSize:11,color:C.muted}}>Today · {b.time} · {b.dur}min hold</div></div><Pill label={b.status.toUpperCase()} color={sc[b.status]}/></div></Card>;})}
      </div>}
    </div>
  </div>;
}

// ── Machine Check ──────────────────────────────────────────────────────────
function MachineCheckScreen({allMachines,catDemo}){
  const[sel,setSel]=useState(null);const[checks,setChecks]=useState({});const[done,setDone]=useState({});const[fuel,setFuel]=useState("");const[fuelErr,setFuelErr]=useState("");
  const count=id=>Object.values(checks[id]||{}).filter(Boolean).length;const allDone=id=>PRESTART.every(c=>(checks[id]||{})[c.id]);
  const handleFuel=v=>{setFuel(v);const n=parseInt(v);if(v==="")return setFuelErr("");if(isNaN(n)||n<1||n>100)return setFuelErr("Enter 1–100%");setFuelErr("");};
  if(sel){const m=allMachines.find(x=>x.id===sel),cat=catDemo.find(x=>x.id===sel)?.data,isDone=done[sel],cnt=count(sel);const fuelOk=parseInt(fuel)>=1&&parseInt(fuel)<=100&&!fuelErr;const can=allDone(sel)&&fuelOk;
    return <div style={{paddingBottom:20}}><PageHdr title="Pre-Start Inspection" sub={`${m?.model} · HSMP minimum`} back onBack={()=>setSel(null)}/>
      {isDone?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:52,marginBottom:10}}>✅</div><div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.success}}>Signed Off</div><div style={{fontSize:12,color:C.muted,marginTop:5}}>{m?.model} · {new Date().toLocaleTimeString()}</div><div style={{background:`${C.success}12`,border:`1px solid ${C.success}33`,borderRadius:10,padding:"12px 16px",marginTop:20,textAlign:"left"}}><div style={{fontSize:12,color:C.success,fontFamily:F,fontWeight:700}}>Pre-start logged. Machine cleared for operation.</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Contact supervisor if issues arise during shift.</div></div></div>:
      <div style={{padding:"13px 15px"}}>
        {cat?.faults?.map((f,i)=><div key={i} style={{display:"flex",gap:8,background:`${f.sev==="high"?C.danger:C.amber}12`,border:`1px solid ${f.sev==="high"?C.danger:C.amber}30`,borderRadius:8,padding:"8px 11px",marginBottom:9}}><span style={{fontFamily:F,fontWeight:900,fontSize:13,color:f.sev==="high"?C.danger:C.amber,flexShrink:0}}>{f.code}</span><span style={{fontSize:12,color:C.textSub}}>{f.desc}</span></div>)}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:5}}><span>{cnt} of {PRESTART.length} items</span><span>{Math.round((cnt/PRESTART.length)*100)}%</span></div>
        <Bar value={cnt} max={PRESTART.length} color={cnt===PRESTART.length?C.success:C.accent}/>
        {viewingPhoto&&<PhotoViewer guide={viewingPhoto} machineType={allMachines.find(x=>x.id===sel)?.type||"Wheel Loader"} onClose={()=>setViewingPhoto(null)}/>}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 14px",marginTop:13,marginBottom:14}}>{PRESTART.map(c=>{const mt=allMachines.find(x=>x.id===sel)?.type||"Wheel Loader";const tk=mt==="Haul Truck"?"truck":"loader";const hp=!!(PHOTO_GUIDES[tk]?.[c.id]);return <CkRow key={c.id} label={c.label} checked={(checks[sel]||{})[c.id]||false} onChange={()=>setChecks(p=>({...p,[sel]:{...(p[sel]||{}),[c.id]:!(p[sel]||{})[c.id]}}))} checkId={c.id} machineType={mt} onPhoto={hp?id=>setViewingPhoto(id):null}/>;})}</div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Fuel level (%)<span style={{color:C.danger}}> *</span></div><input type="number" placeholder="e.g. 78" value={fuel} onChange={e=>handleFuel(e.target.value)} style={{background:C.surface,color:C.text,border:`1px solid ${fuelErr?C.danger:parseInt(fuel)>=1&&parseInt(fuel)<=100?C.success:C.border}`,borderRadius:9,padding:"13px 14px",fontSize:16,width:"100%",outline:"none"}}/>{fuelErr&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>{fuelErr}</div>}</div>
        <button onClick={()=>{if(can)setDone(p=>({...p,[sel]:true}));}} style={{width:"100%",background:can?C.success:C.border,color:can?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:can?"pointer":"default",transition:"background .2s"}}>{can?"✅ SIGN OFF":"Complete all items + valid fuel level"}</button>
      </div>}
    </div>;
  }
  return <div style={{paddingBottom:20}}><PageHdr title="Daily Machine Check" sub="MQSHA Reg 2017 minimum — select machine"/>
    <div style={{padding:"13px 15px"}}><div style={{display:"flex",gap:5,marginBottom:12}}><Stat label="Signed Off" value={Object.values(done).filter(Boolean).length} color={C.success}/><Stat label="Pending" value={allMachines.length-Object.values(done).filter(Boolean).length} color={C.amber}/></div>
      {allMachines.map(m=>{const cat=catDemo.find(x=>x.id===m.id)?.data,isDone=done[m.id],cnt=count(m.id),sc=STATUS_COL[cat?.status]||C.info;return <Card key={m.id} onClick={()=>setSel(m.id)} style={{padding:"13px 14px",border:`1px solid ${isDone?C.success:C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}><div><div style={{fontFamily:F,fontWeight:900,fontSize:17}}>{m.model}</div><div style={{fontSize:11,color:C.muted}}>{m.type} · {cat?.sn||"Custom"}</div></div><Pill label={isDone?"✓ SIGNED OFF":cat?.status?.toUpperCase()||"NEW"} color={isDone?C.success:sc}/></div>{!isDone&&cnt>0&&<div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>{cnt}/{PRESTART.length} items</div><Bar value={cnt} max={PRESTART.length} color={C.accent} thin/></div>}{isDone?<div style={{fontSize:11,color:C.success}}>✓ Pre-start complete</div>:cnt===0?<div style={{fontSize:11,color:C.muted}}>Tap to begin →</div>:null}</Card>;})}
    </div>
  </div>;
}

// ── Site Check ─────────────────────────────────────────────────────────────
function SiteCheckScreen(){
  const[sel,setSel]=useState(null);const[checks,setChecks]=useState({});const[done,setDone]=useState({});const[insp,setInsp]=useState("");const[haz,setHaz]=useState("");
  const count=(id,area)=>area.checks.filter(c=>(checks[id]||{})[c.id]).length;const allDone=(id,area)=>area.checks.every(c=>(checks[id]||{})[c.id]);
  if(sel){const area=SITE_AREAS.find(a=>a.id===sel),isDone=done[sel],rc=RISK_COL[area.risk],cnt=count(sel,area),can=allDone(sel,area)&&insp;
    return <div style={{paddingBottom:20}}><PageHdr title={area.name} sub={`${area.zone} · Risk: ${area.risk.toUpperCase()}`} back onBack={()=>setSel(null)}/>
      {isDone?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:52,marginBottom:10}}>✅</div><div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.success}}>Area Cleared</div><div style={{fontSize:12,color:C.muted,marginTop:5}}>Inspected by {insp}</div><button onClick={()=>{setDone(p=>({...p,[sel]:false}));setChecks(p=>({...p,[sel]:{}}));setInsp("");setHaz("");}} style={{marginTop:20,background:`${C.accent}22`,border:`1px solid ${C.accent}44`,borderRadius:9,padding:"9px 18px",color:C.accent,fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>Re-inspect</button></div>:
      <div style={{padding:"13px 15px"}}><div style={{background:`${rc}15`,border:`1px solid ${rc}44`,borderRadius:9,padding:"9px 12px",marginBottom:10}}><div style={{fontFamily:F,fontWeight:700,fontSize:11,color:rc}}>RISK: {area.risk.toUpperCase()}</div></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:5}}><span>{cnt} of {area.checks.length}</span><span>{Math.round((cnt/area.checks.length)*100)}%</span></div>
        <Bar value={cnt} max={area.checks.length} color={cnt===area.checks.length?C.success:C.accent}/>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"4px 14px",marginTop:13,marginBottom:14}}>{area.checks.map(c=><CkRow key={c.id} label={c.label} checked={(checks[sel]||{})[c.id]||false} onChange={()=>setChecks(p=>({...p,[sel]:{...(p[sel]||{}),[c.id]:!(p[sel]||{})[c.id]}}))}/>)}</div>
        <div style={{marginBottom:10}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Inspector name<span style={{color:C.danger}}> *</span></div><input placeholder="Full name" value={insp} onChange={e=>setInsp(e.target.value)} style={{background:C.surface,color:C.text,border:`1px solid ${insp?C.success:C.border}`,borderRadius:8,padding:"12px 14px",fontSize:14,width:"100%",outline:"none"}}/></div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Hazards / actions</div><textarea value={haz} onChange={e=>setHaz(e.target.value)} rows={2} placeholder="Note any hazards…" style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 13px",fontSize:13,width:"100%",outline:"none",resize:"vertical"}}/></div>
        <button onClick={()=>{if(can)setDone(p=>({...p,[sel]:true}));}} style={{width:"100%",background:can?C.success:C.border,color:can?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:17,cursor:can?"pointer":"default",transition:"background .2s"}}>{can?"✅ SUBMIT AREA CHECK":"Complete all items + inspector name"}</button>
      </div>}
    </div>;
  }
  const cleared=Object.values(done).filter(Boolean).length;
  return <div style={{paddingBottom:20}}><PageHdr title="Site Area Check" sub="Mine Code minimum — select area"/>
    <div style={{padding:"13px 15px"}}><div style={{display:"flex",gap:5,marginBottom:10}}><Stat label="Areas Clear" value={`${cleared}/${SITE_AREAS.length}`} color={C.success}/><Stat label="Pending" value={SITE_AREAS.length-cleared} color={C.amber}/></div><Bar value={cleared} max={SITE_AREAS.length} color={C.success}/>
      <div style={{marginTop:12}}>{SITE_AREAS.map(area=>{const isDone=done[area.id],cnt=count(area.id,area),rc=RISK_COL[area.risk];return <Card key={area.id} onClick={()=>setSel(area.id)} style={{padding:"13px 14px",border:`1px solid ${isDone?C.success:C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><div><div style={{fontFamily:F,fontWeight:900,fontSize:16}}>{area.name}</div><div style={{fontSize:11,color:C.muted}}>{area.zone} · {area.checks.length} items</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}><Pill label={area.risk.toUpperCase()} color={rc}/>{isDone&&<Pill label="✓ CLEAR" color={C.success}/>}</div></div>{isDone?<div style={{fontSize:11,color:C.success}}>✓ All checks passed</div>:cnt>0?<div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>{cnt}/{area.checks.length} checked</div><Bar value={cnt} max={area.checks.length} color={C.accent} thin/></div>:<div style={{fontSize:11,color:C.muted}}>Not yet inspected →</div>}</Card>;})}
      </div>
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
          const faultPts=hist.filter(h=>h.fault);
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
    <div style={{padding:"13px 15px"}}>
      {allMachines.map(m=>{
        const cd=catDemo.find(x=>x.id===m.id),cat=cd?.data,ext=DIAG_EXT[m.id];
        const sc=STATUS_COL[cat?.status]||C.info,svcCol=ext?.svc?.left<0?C.danger:ext?.svc?.left<100?C.amber:C.success;
        const lim=MACHINE_LIMITS[m.id],hasLimit=lim?.incidents?.length>0;
        return <Card key={m.id} onClick={()=>{setSel(m.id);setTab("overview");}}
          style={{padding:"13px 14px",border:`1px solid ${hasLimit?C.danger+"44":cat?.faults?.length>0?C.amber+"44":C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:17}}>{m.model}</div><div style={{fontSize:11,color:C.muted}}>{m.type} · {cat?.sn||"Custom"}</div></div>
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

// ── Scoring ────────────────────────────────────────────────────────────────
// ── Performance Rankings — exact machine model, with coaching tips ────────
// Each machine model is its own leaderboard.
// Non-leaders get specific, actionable coaching based on the leader's numbers.
function ScoringHub(){
  const cycCol=v=>v<=19?C.success:v<=22?C.accent:C.danger;
  const tphCol=v=>v>=250?C.success:v>=150?C.accent:C.danger;

  // Build coaching tip for an operator vs the leader on the same machine
  function coachTip(op, leader, truck, m){
    if(!leader||op===leader)return null;
    if(truck){
      const cycleDiff=+(op.cycleMin-leader.cycleMin).toFixed(1);
      const payDiff=+(leader.payloadT-op.payloadT).toFixed(1);
      // Trips lost per 10-hr shift: each extra minute of cycle = fewer trips
      const tripsPerHr=60/op.cycleMin, leaderTripsPerHr=60/leader.cycleMin;
      const tripsLostPerShift=Math.round((leaderTripsPerHr-tripsPerHr)*10*10)/10;
      if(cycleDiff>=2){
        return{icon:"⏱",color:C.danger,
          headline:`Cycle time ${op.cycleMin}min vs leader's ${leader.cycleMin}min`,
          detail:`${cycleDiff}min slower per cycle = ~${tripsLostPerShift} fewer trips per 10-hr shift. Tighten your load-haul-dump loop and reduce wait time at the dump point.`};
      }
      if(payDiff>1.0){
        const tphLost=Math.round(payDiff*(60/op.cycleMin));
        return{icon:"⚖",color:C.amber,
          headline:`Payload ${op.payloadT}t vs leader's ${leader.payloadT}t per load`,
          detail:`Loading ${payDiff}t lighter per trip. Load heavier to the rated capacity — that's ~${tphLost} t/hr you're leaving on the table.`};
      }
      return{icon:"📈",color:C.success,
        headline:"Close to the leader",
        detail:"Numbers are tight. Maintain consistency and focus on reducing queue time at the crusher."};
    } else {
      // Loaders / excavators
      const bucketDiff=op.avgBucketT!=null&&leader.avgBucketT!=null?+(leader.avgBucketT-op.avgBucketT).toFixed(2):0;
      const cycleDiff=op.cycleMin!=null&&leader.cycleMin!=null?+(op.cycleMin-leader.cycleMin).toFixed(2):0;
      const bucketPctGap=leader.avgBucketT>0?(bucketDiff/leader.avgBucketT)*100:0;
      const cyclePctGap=leader.cycleMin>0?(cycleDiff/leader.cycleMin)*100:0;
      const bucketWeight=bucket=>bucket||m?.bucket||1;
      // Which gap is bigger?
      if(bucketPctGap>cyclePctGap&&bucketDiff>0.2){
        const fillPct=Math.round((op.avgBucketT/bucketWeight(op.avgBucketT))*100);
        const leaderFill=Math.round((leader.avgBucketT/bucketWeight(leader.avgBucketT))*100);
        const tphGain=Math.round(bucketDiff*(3600/(op.cycleMin*60)));
        return{icon:"🪣",color:C.amber,
          headline:`Bucket fill ${op.avgBucketT}t vs leader's ${leader.avgBucketT}t`,
          detail:`You're leaving ${bucketDiff}t per scoop on the ground. Dig deeper and fill the bucket — that alone could add ~${tphGain} t/hr. Target: ${leader.avgBucketT}t per bucket.`};
      }
      if(cycleDiff>0.15){
        const pct=Math.round((cycleDiff/leader.cycleMin)*100);
        const tphLost=Math.round(op.tph*(cycleDiff/op.cycleMin));
        return{icon:"⚡",color:C.danger,
          headline:`Cycle time ${op.cycleMin}min vs leader's ${leader.cycleMin}min`,
          detail:`${cycleDiff}min slower between loads (${pct}% slower). Tighten your dig-to-truck swing and reduce bucket positioning time. Faster cycles = ~${tphLost} more t/hr.`};
      }
      return{icon:"📈",color:C.success,
        headline:"Metrics are close to the leader",
        detail:"Focus on consistency — maintain bucket fill above 90% and keep cycle time steady. Small gains here compound over a full shift."};
    }
  }

  // Build machine sections from MACHINE_PERF — grouped by exact model
  const activeMachines=BASE_MACHINES.filter(m=>MACHINE_PERF[m.id]?.length>0);

  return <div style={{paddingBottom:80}}>
    <PageHdr title="Performance Rankings" sub="By machine model · weekly avg · coaching tips"/>
    <div style={{padding:"14px 16px"}}>
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"9px 13px",marginBottom:14}}>
        <div style={{fontSize:11,color:C.info,fontFamily:F,fontWeight:700}}>Rankings are by exact machine model — same specs, same conditions, fair comparison. Non-leaders get coaching tips.</div>
      </div>
      {activeMachines.map(m=>{
        const truck=isMachTruck(m.type);
        const raw=[...(MACHINE_PERF[m.id]||[])];
        const ops=raw.sort((a,b)=>truck?(a.cycleMin||99)-(b.cycleMin||99):b.tph-a.tph);
        if(!ops.length)return null;
        const leader=ops[0];
        const crusher=OP.crushers.find(c=>c.id===m.crusherAssigned);
        return <div key={m.id} style={{marginBottom:22}}>
          {/* Machine header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.text}}>{m.model}</div>
              <div style={{fontSize:11,color:C.muted}}>{m.type}{m.bucket?` · ${m.bucket}t bucket`:m.payload?` · ${m.payload}t payload`:""}  {crusher?`· ${crusher.name}`:""}  · {ops.length} operator{ops.length!==1?"s":""} this week</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:truck?cycCol(leader.cycleMin):tphCol(leader.tph),lineHeight:1}}>{truck?leader.cycleMin:leader.tph}</div>
              <div style={{fontSize:9,color:C.muted}}>{truck?"best min/cycle":"best t/hr"}</div>
            </div>
          </div>

          {/* Operator rows */}
          {ops.map((op,i)=>{
            const isTop=i===0;
            const next=ops[i+1];
            const pv=truck?op.cycleMin:op.tph;
            const nv=next?(truck?next.cycleMin:next.tph):null;
            const pctAhead=nv!=null?(truck?Math.round(((nv-pv)/nv)*100):Math.round(((pv-nv)/nv)*100)):null;
            const pc=truck?cycCol(op.cycleMin):tphCol(op.tph);
            const tip=!isTop?coachTip(op,leader,truck,m):null;
            const[showTip,setShowTip]=React.useState(false);
            return <div key={i} style={{marginBottom:10}}>
              {/* Rank row */}
              <div style={{background:isTop?`${C.accent}0a`:C.card,border:`1.5px solid ${isTop?C.accent+"55":C.border}`,borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {/* Rank number */}
                  <div style={{fontFamily:F,fontWeight:900,fontSize:20,width:26,textAlign:"center",color:isTop?C.accent:C.muted}}>#{i+1}</div>
                  {/* Avatar */}
                  <div style={{width:38,height:38,borderRadius:"50%",background:`${pc}22`,border:`2px solid ${pc}55`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:700,fontSize:13,color:pc,flexShrink:0}}>{op.avatar}</div>
                  {/* Name + shifts */}
                  <div style={{flex:1}}>
                    <div style={{fontFamily:F,fontWeight:900,fontSize:15}}>{op.name}</div>
                    <div style={{fontSize:10,color:C.muted}}>{op.shifts} shift{op.shifts!==1?"s":""}{op.fault?" · ⚠ fault":""}</div>
                  </div>
                  {/* Primary metric */}
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:pc,lineHeight:1}}>{pv}</div>
                    <div style={{fontSize:9,color:C.muted}}>{truck?"min/cycle":"t/hr"}</div>
                  </div>
                </div>

                {/* Leader badge / gap badge */}
                {isTop&&<div style={{marginTop:9,background:`${C.accent}18`,border:`1px solid ${C.accent}44`,borderRadius:7,padding:"5px 10px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14}}>🏆</span>
                  <span style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.accent}}>Leader this week</span>
                  {pctAhead!=null&&pctAhead>0&&<span style={{marginLeft:"auto",fontSize:11,color:C.muted,fontFamily:F}}>{truck?`${pctAhead}% faster than #2`:`+${pctAhead}% vs #2`}</span>}
                </div>}
                {!isTop&&pctAhead!=null&&<div style={{marginTop:9,background:`${C.muted}10`,border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.muted}}>{truck?`${Math.round(((pv-leader[truck?"cycleMin":"tph"])/(leader[truck?"cycleMin":"tph"]))*100*(truck?-1:1))}% behind leader`:`${Math.round(((leader.tph-op.tph)/leader.tph)*100)}% behind leader`}</span>
                  {pctAhead>0&&<span style={{marginLeft:"auto",fontSize:10,color:C.muted}}>{truck?`${pctAhead}% faster than #${i+2}`:`+${pctAhead}% vs #${i+2}`}</span>}
                </div>}
              </div>

              {/* Coaching tip (tap to expand for non-leaders) */}
              {tip&&<div style={{marginTop:4}}>
                <button onClick={()=>setShowTip(s=>!s)} style={{width:"100%",background:showTip?`${tip.color}12`:`${tip.color}08`,border:`1px solid ${tip.color}${showTip?"55":"22"}`,borderRadius:10,padding:"9px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,textAlign:"left",transition:"all .15s"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{tip.icon}</span>
                  <span style={{flex:1,fontFamily:F,fontWeight:700,fontSize:12,color:tip.color}}>{tip.headline}</span>
                  <span style={{fontSize:11,color:`${tip.color}88`,flexShrink:0}}>{showTip?"▲":"▼ How to improve"}</span>
                </button>
                {showTip&&<div style={{background:`${tip.color}08`,border:`1px solid ${tip.color}22`,borderTopWidth:0,borderRadius:"0 0 10px 10px",padding:"10px 14px 12px"}}>
                  <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>{tip.detail}</div>
                  {/* Secondary stats comparison */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
                    {(truck
                      ?[{l:"Your cycle",v:`${op.cycleMin}min`,c:cycCol(op.cycleMin)},{l:"Leader cycle",v:`${leader.cycleMin}min`,c:cycCol(leader.cycleMin)},{l:"Your payload",v:`${op.payloadT}t`,c:C.muted},{l:"Leader payload",v:`${leader.payloadT}t`,c:C.muted}]
                      :[{l:"Your bucket",v:`${op.avgBucketT}t`,c:C.muted},{l:"Leader bucket",v:`${leader.avgBucketT}t`,c:C.muted},{l:"Your cycle",v:`${op.cycleMin}min`,c:C.muted},{l:"Leader cycle",v:`${leader.cycleMin}min`,c:C.muted}]
                    ).map(x=><div key={x.l} style={{background:C.card,borderRadius:7,padding:"7px 9px",border:`1px solid ${C.border}`}}><div style={{fontSize:7,color:C.muted,fontFamily:F,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{x.l}</div><div style={{fontFamily:F,fontWeight:900,fontSize:15,color:x.c}}>{x.v}</div></div>)}
                  </div>
                </div>}
              </div>}
            </div>;
          })}
        </div>;
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
    <div style={{padding:"12px 15px"}}>
      {totalAlerts>0&&<div style={{background:`${C.danger}12`,border:`1px solid ${C.danger}33`,borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:28}}>⚠️</div><div><div style={{fontFamily:F,fontWeight:900,fontSize:16,color:C.danger}}>{totalAlerts} item{totalAlerts!==1?"s":""} need attention</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Tap a machine to view and log</div></div></div>}
      <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>🚛 Mobile Fleet</div>
      {mobileAlerts.map(m=>{
        const sc=m.ov.length>0?C.danger:m.ds.length>0?C.amber:C.border;
        return <div key={m.id} onClick={()=>{setSel(m.id);setView("machine");}} style={{background:C.card,border:`1.5px solid ${m.alerts>0?sc+"55":C.border}`,borderRadius:14,padding:"13px 15px",marginBottom:10,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontFamily:F,fontWeight:900,fontSize:17}}>{m.model}</div><div style={{fontSize:11,color:C.muted}}>{m.type} · {m.smh.toLocaleString()} SMH</div></div>
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
function ChecksHub({allMachines,catDemo}){
  const[active,setActive]=useState(null);
  const Bk=()=><button onClick={()=>setActive(null)} style={{margin:"10px 16px 0",background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 13px",color:C.muted,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer",display:"block"}}>← Back</button>;
  if(active==="machine")    return <div><Bk/><MachineCheckScreen allMachines={allMachines} catDemo={catDemo}/></div>;
  if(active==="site")       return <div><Bk/><SiteCheckScreen/></div>;
  if(active==="diag")       return <div><Bk/><DiagnosticsScreen allMachines={allMachines} catDemo={catDemo}/></div>;
  if(active==="maintenance")return <MaintenanceScreen allMachines={allMachines} catDemo={catDemo}/>;
  const MENU=[
    {id:"maintenance",icon:"🔧",title:"Maintenance",        sub:"Grease · filter blow · scheduled tasks · VisionLink fluids",color:C.accent},
    {id:"machine",    icon:"✅",title:"Daily Machine Check",sub:"HSMP pre-start · MQSHA Reg 2017 minimum",                  color:C.success},
    {id:"site",       icon:"🗺",title:"Site Area Check",    sub:"Mine Code minimum",                                         color:C.info},
    {id:"diag",       icon:"⚙", title:"Machine Diagnostics",sub:"Fault codes · fluids · CAT VisionLink",                    color:C.amber},
  ];
  return <div style={{paddingBottom:80}}><PageHdr title="Checks & Maintenance"/>
    <div style={{padding:"14px 16px"}}>{MENU.map(m=><button key={m.id} onClick={()=>setActive(m.id)} style={{width:"100%",background:C.card,border:`1px solid ${m.color}33`,borderRadius:14,padding:"17px 15px",marginBottom:10,display:"flex",alignItems:"center",gap:13,textAlign:"left",cursor:"pointer"}}><div style={{width:50,height:50,borderRadius:13,background:`${m.color}18`,border:`2px solid ${m.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div><div style={{flex:1}}><div style={{fontFamily:F,fontWeight:900,fontSize:17}}>{m.title}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{m.sub}</div></div><span style={{color:C.muted,fontSize:16}}>→</span></button>)}
    </div>
  </div>;
}

// ── Full Menu Overlay ──────────────────────────────────────────────────────



function MenuOverlay({user,onNav,onAddMachine,onVehicleCheck,onClose,allMachines}){
  const lv=ROLES[user?.role]?.level||1;
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
        <Section title="Operations">
          <Item icon="📡" label="Live Board" sub="All active operators · crusher feed" onClick={()=>{onNav("board");onClose();}}/>
          {ROLES[user?.role]?.level===1&&<Item icon="🪣" label="My Operations" sub="Scoop logging · idle tracking · blast schedule" onClick={()=>{onNav("ops");onClose();}}/>}
        </Section>
        <Section title="Checks">
          <Item icon="✅" label="Machine Check" sub="HSMP pre-start · MQSHA minimum" color={C.success} onClick={()=>{onNav("checks");onClose();}}/>
          <Item icon="🗺" label="Site Area Check" sub="Mine Code minimum" color={C.info} onClick={()=>{onNav("checks");onClose();}}/>
          <Item icon="🔧" label="Maintenance" sub="Grease · filter blow · VisionLink fluids" color={C.accent} onClick={()=>{onNav("checks");onClose();}}/>
          <Item icon="⚙" label="Diagnostics" sub="Fault codes · fluids · service" color={C.amber} onClick={()=>{onNav("checks");onClose();}}/>
          <Item icon="🚗" label="Vehicle Check" sub="Company truck / ute inspection" color={C.accent} onClick={()=>{onVehicleCheck();onClose();}}/>
        </Section>
        <Section title="Performance">
          <Item icon="📋" label="Compliance" sub="Training · competent persons · SDS" color={C.info} onClick={()=>{setTab("comply");setFlow("app");onClose();}}/>
          <Item icon="📷" label="Photo Guides" sub="Reference photos for pre-start checks" color={C.info} onClick={()=>{setFlow("photoManager");onClose();}}/>
          <Item icon="🧠" label="Intelligence" sub="Forecast · weather · fuel · fatigue · predictive" color={C.purple} onClick={()=>{onNav("intel");onClose();}}/>
          <Item icon="👷" label="Machine Performance" sub={`${allMachines.length} machines · ranked by t/hr`} onClick={()=>{onNav("perf");onClose();}}/>
          <Item icon="📊" label="Shift Scoring" sub="Score = t/hr ÷ crusher cap × 1000" onClick={()=>{onNav("scoring");onClose();}}/>
        </Section>
        <Section title="Fleet">
          <Item icon="🚛" label="Add Machine" sub="Add new equipment to the fleet" color={C.purple} onClick={()=>{onAddMachine();onClose();}}/>
          <Item icon="🔍" label="All Machines" sub={`${allMachines.length} in fleet · tap to view diagnostics`} onClick={()=>{onNav("checks");onClose();}}/>
        </Section>
        <div style={{padding:"16px 20px",marginTop:4}}>
          <div style={{fontSize:11,color:C.muted,textAlign:"center",lineHeight:1.5}}>MineOps · Demo Mode<br/>CAT VisionLink · MQSHA 1999 / Reg 2017</div>
        </div>
      </div>
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
const FUEL_RATES={
  CAT988K: [{tph:200,lhr:22},{tph:250,lhr:25},{tph:287,lhr:27.5},{tph:300,lhr:29}],
  CAT992K: [{tph:250,lhr:31},{tph:300,lhr:35},{tph:311,lhr:36.5},{tph:320,lhr:39}],
  CAT6060:  [{tph:200,lhr:45},{tph:241,lhr:52},{tph:260,lhr:56},{tph:280,lhr:61}],
  CAT390F:  [{tph:40, lhr:18},{tph:54, lhr:21},{tph:60, lhr:23}],
  CAT745_1: [{cycleMin:22,lhr:28},{cycleMin:20,lhr:31},{cycleMin:18.5,lhr:34}],
  CAT745_2: [{cycleMin:22,lhr:28},{cycleMin:21.2,lhr:30},{cycleMin:19,lhr:33}],
};

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
function SubscriptionScreen({mineName,onSelect}){
  const[selected,setSelected]=useState("pro");
  const PLANS=[
    {id:"starter",label:"Starter",price:"$149",period:"/month",color:C.muted,
     features:["Up to 5 machines","Up to 10 operators","CAT VisionLink integration","Daily production reports","Email support"],
     limits:["No Powerscreen Pulse","No predictive maintenance","No multi-site"]},
    {id:"pro",label:"Pro",price:"$299",period:"/month",color:C.accent,tag:"Most Popular",
     features:["Up to 15 machines","Unlimited operators","CAT VisionLink + Powerscreen Pulse","All Intelligence features","Weather integration","Predictive maintenance","Photo guides","Priority support"],
     limits:["Single site only"]},
    {id:"enterprise",label:"Enterprise",price:"Custom",period:"",color:C.purple,
     features:["Unlimited machines","Unlimited operators","Multiple mine sites","Custom API integrations","Dedicated account manager","On-site training","SLA guarantee"],
     limits:[]},
  ];
  return <div style={{paddingBottom:30}} className="up">
    <div style={{textAlign:"center",padding:"28px 20px 20px"}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent}}>Choose Your Plan</div>
      <div style={{fontSize:12,color:C.muted,marginTop:4}}>{mineName} · Cancel anytime · 14-day free trial</div>
    </div>
    <div style={{padding:"0 16px"}}>
      {PLANS.map(p=><div key={p.id} onClick={()=>setSelected(p.id)} style={{background:selected===p.id?`${p.color}10`:C.card,border:`2px solid ${selected===p.id?p.color:C.border}`,borderRadius:16,padding:"18px 16px",marginBottom:12,cursor:"pointer",transition:"all .15s",position:"relative"}}>
        {p.tag&&<div style={{position:"absolute",top:-1,right:16,background:p.color,color:"#000",borderRadius:"0 0 8px 8px",padding:"3px 10px",fontSize:10,fontFamily:F,fontWeight:900}}>{p.tag}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div><div style={{fontFamily:F,fontWeight:900,fontSize:20,color:selected===p.id?p.color:C.text}}>{p.label}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:F,fontWeight:900,fontSize:26,color:selected===p.id?p.color:C.muted,lineHeight:1}}>{p.price}</div><div style={{fontSize:10,color:C.muted}}>{p.period}</div></div>
        </div>
        {p.features.map((f,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-start"}}><span style={{color:p.color,flexShrink:0,marginTop:1}}>✓</span><span style={{fontSize:12,color:selected===p.id?C.text:C.textSub}}>{f}</span></div>)}
        {p.limits.map((f,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-start"}}><span style={{color:C.muted,flexShrink:0}}>·</span><span style={{fontSize:11,color:C.muted}}>{f}</span></div>)}
      </div>)}
      <button onClick={()=>onSelect(selected)} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,fontSize:20,cursor:"pointer",marginBottom:10}}>
        Start 14-Day Free Trial →
      </button>
      <div style={{textAlign:"center",fontSize:11,color:C.muted,lineHeight:1.6}}>No credit card required for trial<br/>Billing starts after 14 days · Cancel anytime</div>
    </div>
  </div>;
}

// ── VisionLink Setup Wizard ────────────────────────────────────────────────
function VisionLinkSetup({onComplete,onSkip}){
  const[step,setStep]=useState(1);
  const[clientId,setClientId]=useState("");const[secret,setSecret]=useState("");const[appKey,setAppKey]=useState("");
  const[importing,setImporting]=useState(false);const[imported,setImported]=useState(false);
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 14px",fontSize:14,width:"100%",outline:"none",fontFamily:"monospace",marginBottom:10};
  const simulate=()=>{setImporting(true);setTimeout(()=>{setImporting(false);setImported(true);setTimeout(()=>setStep(3),800);},2200);};
  if(step===1)return <div style={{padding:"28px 20px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}} className="up">
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:52,marginBottom:8}}>📡</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:24,color:C.accent}}>Connect CAT VisionLink</div>
      <div style={{fontSize:12,color:C.muted,marginTop:4}}>Auto-import your entire fleet in seconds</div>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",marginBottom:16}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>What you'll need:</div>
      {[["1","Contact your CAT dealer and request VisionLink API credentials","~1 business day"],["2","You'll receive a Client ID, Client Secret, and Application Key","via email"],["3","Paste them below and we'll import your fleet automatically","2 minutes"]].map(([n,t,s])=><div key={n} style={{display:"flex",gap:12,marginBottom:10,alignItems:"flex-start"}}><div style={{width:24,height:24,borderRadius:"50%",background:`${C.accent}22`,border:`1px solid ${C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:900,fontSize:12,color:C.accent,flexShrink:0}}>{n}</div><div><div style={{fontSize:13,color:C.text,lineHeight:1.4}}>{t}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{s}</div></div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <button onClick={onSkip} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",fontFamily:F,fontWeight:700,fontSize:14,color:C.muted,cursor:"pointer"}}>Skip for now</button>
      <button onClick={()=>setStep(2)} style={{background:`linear-gradient(135deg,${C.accent},#d4881e)`,border:"none",borderRadius:12,padding:"14px",fontFamily:F,fontWeight:900,fontSize:14,color:"#000",cursor:"pointer"}}>I have credentials →</button>
    </div>
  </div>;
  if(step===2)return <div style={{padding:"28px 20px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}} className="up">
    <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:C.accent,marginBottom:4}}>Enter VisionLink Credentials</div>
    <div style={{fontSize:11,color:C.muted,marginBottom:18}}>Stored securely · never exposed to browser · server-side only</div>
    <div style={{background:`${C.success}08`,border:`1px solid ${C.success}22`,borderRadius:10,padding:"10px 13px",marginBottom:16}}>
      <div style={{fontSize:11,color:C.success,fontFamily:F,fontWeight:700}}>🔒 Your credentials are encrypted at rest and transmitted only via HTTPS from our server directly to CAT's API. They are never stored in the app or visible to any client.</div>
    </div>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Client ID</div>
    <input value={clientId} onChange={e=>setClientId(e.target.value)} placeholder="e.g. mineops-demo-a1b2c3d4" style={{...inp,border:`1px solid ${clientId?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Client Secret</div>
    <input type="password" value={secret} onChange={e=>setSecret(e.target.value)} placeholder="••••••••••••••••" style={{...inp,border:`1px solid ${secret?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Application Key</div>
    <input value={appKey} onChange={e=>setAppKey(e.target.value)} placeholder="e.g. APPKEY-XYZ-12345" style={{...inp,border:`1px solid ${appKey?C.success:C.border}`}}/>
    {imported&&<div style={{background:`${C.success}12`,border:`1px solid ${C.success}33`,borderRadius:10,padding:"10px 13px",marginBottom:10}}><div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success}}>✅ Importing fleet from VisionLink…</div></div>}
    <button onClick={simulate} disabled={importing||!clientId||!secret||!appKey} style={{width:"100%",background:clientId&&secret&&appKey?C.success:C.border,color:clientId&&secret&&appKey?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",marginBottom:8,transition:"background .2s"}}>
      {importing?"⏳ Connecting to VisionLink…":"Import Fleet →"}
    </button>
    <button onClick={()=>setStep(1)} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>← Back</button>
  </div>;
  // Step 3 — imported
  return <div style={{padding:"28px 20px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}} className="up">
    <div style={{fontSize:56,marginBottom:12}}>✅</div>
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.success,marginBottom:8}}>Fleet Imported!</div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",marginBottom:20,textAlign:"left"}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:10}}>Machines found via VisionLink:</div>
      {BASE_MACHINES.filter(m=>CAT_DEMO[m.id]).map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}><span style={{fontSize:13,color:C.text,fontFamily:F,fontWeight:700}}>{m.model}</span><span style={{fontSize:11,color:C.success}}>✓ {CAT_DEMO[m.id]?.smh?.toLocaleString()} SMH</span></div>)}
    </div>
    <button onClick={onComplete} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,fontSize:20,cursor:"pointer"}}>
      Enter MineOps →
    </button>
  </div>;
}

// ── Photo Manager (admin/supervisor uploads reference photos) ─────────────
function PhotoManagerScreen(){
  const[selMachine,setSelMachine]=useState(null);const[selCheck,setSelCheck]=useState(null);
  const[viewPhoto,setViewPhoto]=useState(null);
  const machineTypes=[{type:"Wheel Loader",key:"loader"},{type:"Excavator",key:"loader"},{type:"Haul Truck",key:"truck"}];
  const hasPhoto=(type,checkId)=>{const k=type==="Haul Truck"?"truck":"loader";return !!(PHOTO_GUIDES[k]?.[checkId]);};
  const totalItems=PRESTART.length,totalMachineTypes=[...new Set(BASE_MACHINES.map(m=>m.type))].filter(t=>t!=="Dozer").length;
  const coveredItems=PRESTART.filter(c=>hasPhoto("Wheel Loader",c.id)).length;
  return <div style={{paddingBottom:80}} className="up">
    <PageHdr title="Photo Guides" sub="Reference photos for pre-start checks"/>
    <div style={{padding:"12px 15px"}}>
      <div style={{background:`${C.success}08`,border:`1px solid ${C.success}22`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:6}}>📷 {coveredItems}/{totalItems} check items have reference photos</div>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Operators see a 📷 button next to items that have photos during pre-start. Tap it to see the reference image and caption. Upload photos for each machine type below.</div>
      </div>
      {viewPhoto&&<PhotoViewer guide={viewPhoto.checkId} machineType={viewPhoto.type} onClose={()=>setViewPhoto(null)}/>}
      {[...new Set(BASE_MACHINES.filter(m=>m.type!=="Dozer").map(m=>m.type))].map(mtype=>{
        const key=mtype==="Haul Truck"?"truck":"loader";
        const covered=PRESTART.filter(c=>hasPhoto(mtype,c.id)).length;
        return <div key={mtype} style={{marginBottom:16}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.muted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>{mtype} · {covered}/{PRESTART.length} photos</div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            {PRESTART.map((c,i)=>{
              const has=hasPhoto(mtype,c.id);
              return <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderBottom:i<PRESTART.length-1?`1px solid ${C.border}22`:"none"}}>
                <div style={{fontSize:15,flexShrink:0}}>{has?"📷":"⬜"}</div>
                <div style={{flex:1}}><div style={{fontSize:13,color:C.text}}>{c.label}</div>{has&&<div style={{fontSize:10,color:C.success,marginTop:1}}>Photo guide set · tap to preview</div>}</div>
                {has
                  ?<button onClick={()=>setViewPhoto({checkId:c.id,type:mtype})} style={{background:`${C.success}15`,border:`1px solid ${C.success}33`,borderRadius:7,padding:"5px 10px",color:C.success,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>Preview</button>
                  :<button style={{background:`${C.accent}15`,border:`1px solid ${C.accent}33`,borderRadius:7,padding:"5px 10px",color:C.accent,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>+ Upload</button>}
              </div>;
            })}
          </div>
        </div>;
      })}
      <div style={{background:`${C.info}08`,border:`1px solid ${C.info}22`,borderRadius:10,padding:"10px 13px",marginTop:4}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:11,color:C.info,marginBottom:4}}>In production</div>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Photos are uploaded via this screen and stored in Supabase Storage under your mine_id. Only Mine Admin and Supervisors can upload or replace photos. All operators across all shifts see the same reference photos.</div>
      </div>
    </div>
  </div>;
}

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
          <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.amber,marginBottom:4}}>⚠ No training photo on file</div>
          <button style={{background:`${C.amber}18`,border:`1px solid ${C.amber}44`,borderRadius:8,padding:"8px 12px",color:C.amber,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer"}}>📷 Upload Certificate Photo</button>
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
            {s.uploaded
              ?<button style={{background:`${C.success}15`,border:`1px solid ${C.success}33`,borderRadius:7,padding:"5px 11px",color:C.success,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>📄 View SDS</button>
              :<button style={{background:`${C.accent}15`,border:`1px solid ${C.accent}33`,borderRadius:7,padding:"5px 11px",color:C.accent,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>⬆ Upload SDS</button>}
          </div>
        </div>;})}
        <button style={{width:"100%",background:C.card,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"13px",marginTop:6,color:C.accent,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add New Substance</button>
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:12,color:C.textSub,marginBottom:2}}>📄 {c.cert}</div><div style={{fontSize:10,color:C.muted}}>Expires: {c.expiry}</div></div>
            <button style={{background:`${C.success}15`,border:`1px solid ${C.success}33`,borderRadius:7,padding:"5px 10px",color:C.success,fontSize:11,fontFamily:F,fontWeight:700,cursor:"pointer"}}>View</button>
          </div>
        </div>;})}
        <button style={{width:"100%",background:C.card,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"13px",marginTop:6,color:C.accent,fontFamily:F,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Competent Person</button>
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
  const pendingApproval=0; // in production: count from operators table where status=pending
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

function Nav({active,set,role}){
  const lv=ROLES[role]?.level||1;
  const tabs=[{id:"board",icon:"📡",label:"Live"},{id:"ops",icon:"🪣",label:"My Ops",op:true},{id:"checks",icon:"✅",label:"Checks"},{id:"perf",icon:"👷",label:"Performance"},{id:"intel",icon:"🧠",label:"Intel"},{id:"comply",icon:"📋",label:"Comply",mgr:true},{id:"scoring",icon:"📊",label:"Rankings",mgr:true}].filter(t=>(!t.op||lv===1)&&(!t.mgr||lv>=2));
  return <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`${C.surface}f5`,backdropFilter:"blur(12px)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
    {tabs.map(t=><button key={t.id} onClick={()=>set(t.id)} style={{flex:1,padding:"9px 0",background:"none",border:"none",color:active===t.id?C.accent:C.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:active===t.id?10:9,fontFamily:F,fontWeight:active===t.id?700:400,cursor:"pointer",borderTop:active===t.id?`2px solid ${C.accent}`:"2px solid transparent"}}>
      <span style={{fontSize:17}}>{t.icon}</span>{t.label}
    </button>)}
  </div>;
}

// ── Login ──────────────────────────────────────────────────────────────────
// ── Multi-tenant onboarding ────────────────────────────────────────────────
// Demo mines database — in production this is a Supabase `mines` table
const DEMO_MINES=[
  {id:"mine_001",name:"Redrock Quarry",       code:"REDROCK",location:"Queensland, AU",machines:7,operators:12,plan:"pro"},
  {id:"mine_002",name:"Ironstone Mining Co.", code:"IRON82", location:"Western Australia",machines:4,operators:8, plan:"starter"},
  {id:"mine_003",name:"Blue Hills Aggregates",code:"BLUE44", location:"New South Wales, AU",machines:5,operators:9, plan:"pro"},
];

function OnboardingScreen({onEnterDemo,onJoinMine,onCreateMine}){
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"40px 22px 32px"}} className="up">
    <div style={{textAlign:"center"}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:52,color:C.accent,letterSpacing:".06em",marginBottom:6}}>MINEOPS</div>
      <div style={{fontSize:11,color:C.muted,letterSpacing:".18em",textTransform:"uppercase"}}>Production Intelligence Platform</div>
      <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginTop:16}}>
        {["CAT VisionLink","Powerscreen Pulse","Weather API","Multi-site"].map(t=><div key={t} style={{background:`${C.accent}12`,border:`1px solid ${C.accent}22`,borderRadius:6,padding:"3px 10px",fontSize:10,color:C.accent,fontFamily:F,fontWeight:700}}>{t}</div>)}
      </div>
    </div>
    <div>
      <button onClick={onCreateMine} style={{width:"100%",background:`linear-gradient(135deg,${C.accent},#d4881e)`,color:"#000",border:"none",borderRadius:14,padding:"18px",fontFamily:F,fontWeight:900,fontSize:20,cursor:"pointer",marginBottom:12}}>
        ⛏ Create a Mine
        <div style={{fontSize:12,fontWeight:600,marginTop:4,opacity:.75}}>Set up your operation · get your team code</div>
      </button>
      <button onClick={onJoinMine} style={{width:"100%",background:C.card,border:`2px solid ${C.border}`,borderRadius:14,padding:"16px",fontFamily:F,fontWeight:900,fontSize:18,color:C.text,cursor:"pointer",marginBottom:12}}>
        👷 Join a Mine
        <div style={{fontSize:12,fontWeight:600,marginTop:3,color:C.muted}}>Have a mine code? Sign in to your operation</div>
      </button>
      <button onClick={onEnterDemo} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,padding:"12px",fontFamily:F,fontWeight:700,fontSize:14,color:C.muted,cursor:"pointer"}}>
        Try Demo →
      </button>
    </div>
    <div style={{textAlign:"center",fontSize:10,color:C.muted,lineHeight:1.6}}>
      MineOps · MQSHA 1999 / Reg 2017 · CAT VisionLink AEMP 2.0<br/>
      Secure multi-tenant · Data never shared between mines
    </div>
  </div>;
}

function CreateMineFlow({onComplete,onBack}){
  const[step,setStep]=useState(1); // 1=account 2=mine setup 3=crushers 4=code
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[pass2,setPass2]=useState("");
  const[mineName,setMineName]=useState("");const[location,setLocation]=useState("");
  const[adminName,setAdminName]=useState("");
  const[numCrushers,setNumCrushers]=useState(1);
  const[code]=useState(()=>Math.random().toString(36).slice(2,8).toUpperCase());
  const[creating,setCreating]=useState(false);
  const[createErr,setCreateErr]=useState("");
  const passOk=pass.length>=8&&pass===pass2;
  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 14px",fontSize:15,width:"100%",outline:"none",marginBottom:10};
  const steps=["Account","Mine Setup","Done"];
  const Progress=()=><div style={{display:"flex",gap:0,marginBottom:22}}>
    {steps.map((s,i)=><div key={i} style={{flex:1,textAlign:"center"}}>
      <div style={{height:3,background:i<step-1?C.success:i===step-1?C.accent:C.border,borderRadius:99,marginBottom:5,transition:"background .3s"}}/>
      <div style={{fontSize:9,color:i<step?C.text:C.muted,fontFamily:F,fontWeight:700}}>{s}</div>
    </div>)}
  </div>;
  if(step===1)return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer",textAlign:"left",marginBottom:16}}>← Back</button>
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent,marginBottom:4}}>Create Account</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:20}}>This becomes your Mine Admin account</div>
    <Progress/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Your name</div>
    <input value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="e.g. Craig O'Brien" style={{...inp,border:`1px solid ${adminName.trim()?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Work email</div>
    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com.au" style={{...inp,border:`1px solid ${emailOk?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Password <span style={{color:C.muted,fontWeight:400}}>(min 8 characters)</span></div>
    <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={{...inp,border:`1px solid ${pass.length>=8?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Confirm password</div>
    <input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="••••••••" style={{...inp,border:`1px solid ${passOk&&pass?C.success:pass2&&!passOk?C.danger:C.border}`}}/>
    {pass2&&!passOk&&pass2.length>0&&<div style={{fontSize:11,color:C.danger,marginBottom:8}}>Passwords don't match</div>}
    <button onClick={()=>{if(emailOk&&passOk&&adminName.trim())setStep(2);}} style={{width:"100%",background:emailOk&&passOk&&adminName.trim()?C.success:C.border,color:emailOk&&passOk&&adminName.trim()?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",transition:"background .2s",marginTop:4}}>
      Continue →
    </button>
  </div>;
  if(step===2)return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent,marginBottom:4}}>Mine Setup</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:20}}>Tell us about your operation</div>
    <Progress/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Mine / quarry name</div>
    <input value={mineName} onChange={e=>setMineName(e.target.value)} placeholder="e.g. Redrock Quarry" style={{...inp,border:`1px solid ${mineName.trim()?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Location</div>
    <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Queensland, Australia" style={{...inp,border:`1px solid ${location.trim()?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:8}}>How many crushers?</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[1,2,3].map(n=><button key={n} onClick={()=>setNumCrushers(n)} style={{background:numCrushers===n?`${C.accent}22`:"transparent",border:`2px solid ${numCrushers===n?C.accent:C.border}`,borderRadius:10,padding:"14px 8px",color:numCrushers===n?C.accent:C.muted,fontFamily:F,fontWeight:900,fontSize:24,cursor:"pointer"}}>{n}</button>)}
    </div>
    <button onClick={()=>{if(mineName.trim()&&location.trim())setStep(3);}} style={{width:"100%",background:mineName.trim()&&location.trim()?C.success:C.border,color:mineName.trim()&&location.trim()?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",transition:"background .2s"}}>
      Create Mine →
    </button>
    <button onClick={()=>setStep(1)} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"12px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>← Back</button>
  </div>;
  // Step 3 — success + code
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px",textAlign:"center"}} className="up">
    <div style={{fontSize:56,marginBottom:12}}>⛏</div>
    <div style={{fontFamily:F,fontWeight:900,fontSize:28,color:C.success,marginBottom:4}}>{mineName}</div>
    <div style={{fontSize:13,color:C.muted,marginBottom:28}}>{location} · {numCrushers} crusher{numCrushers!==1?"s":""}</div>
    <div style={{background:C.card,border:`2px solid ${C.accent}`,borderRadius:16,padding:"22px",marginBottom:20}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:C.muted,letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Your mine code — share this with your team</div>
      <div style={{fontFamily:F,fontWeight:900,fontSize:46,color:C.accent,letterSpacing:".15em"}}>{code}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:10}}>Staff enter this code when signing up · keep it safe</div>
    </div>
    <div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:12,padding:"12px 14px",marginBottom:20,textAlign:"left"}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:6}}>What happens next</div>
      {["Your team downloads MineOps and taps Join a Mine","They enter code "+code+" to find "+mineName,"They create their profile and select their role","You approve them as Admin — or set auto-approve on","Your machines and crushers are set up in Settings"].map((s,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:5}}><span style={{color:C.success,flexShrink:0}}>✓</span><span style={{fontSize:12,color:C.muted}}>{s}</span></div>)}
    </div>
    {createErr&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:C.danger,textAlign:"left"}}>{createErr}</div>}
    <button disabled={creating} onClick={async()=>{
      setCreating(true); setCreateErr("");
      try {
        const { data: auth, error: authErr } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { name: adminName } },
        });
        if (authErr) throw authErr;
        if (!auth?.user) throw new Error("Sign-up returned no user");
        // Force a session so auth.uid() is set for the inserts below
        const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (siErr) throw siErr;
        const { data: mine, error: mineErr } = await supabase.from("mines").insert({
          name: mineName, location, code, plan: "starter", owner_id: auth.user.id,
        }).select().single();
        if (mineErr) throw mineErr;
        const { error: opErr } = await supabase.from("operators").insert({
          auth_id: auth.user.id, mine_id: mine.id, name: adminName,
          role: "admin", status: "active",
        });
        if (opErr) throw opErr;
        onComplete({ ...mine, mineName: mine.name, adminName, email });
      } catch (err) {
        console.error("Create mine failed:", err);
        setCreateErr(err.message || "Something went wrong. Try again.");
        setCreating(false);
      }
    }} style={{width:"100%",background:creating?C.border:`linear-gradient(135deg,${C.accent},#d4881e)`,color:creating?C.muted:"#000",border:"none",borderRadius:14,padding:"17px",fontFamily:F,fontWeight:900,fontSize:20,cursor:creating?"default":"pointer"}}>
      {creating ? "Creating mine…" : "Enter MineOps →"}
    </button>
  </div>;
}

function JoinMineFlow({onComplete,onBack}){
  const[step,setStep]=useState(1); // 1=find mine 2=account 3=role 4=pending
  const[search,setSearch]=useState("");const[code,setCode]=useState("");
  const[foundMine,setFoundMine]=useState(null);const[searchErr,setSearchErr]=useState("");
  const[name,setName]=useState("");const[email,setEmail]=useState("");const[pass,setPass]=useState("");
  const[role,setRole]=useState(null);const[machine,setMachine]=useState(null);
  const[searchLoading,setSearchLoading]=useState(false);
  const[joining,setJoining]=useState(false);
  const[joinErr,setJoinErr]=useState("");
  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passOk=pass.length>=8;
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 14px",fontSize:15,width:"100%",outline:"none",marginBottom:10};
  const searchMine=async()=>{
    const q=(search||code).toUpperCase().trim();
    if(!q){setSearchErr("Enter a mine code first.");return;}
    setSearchLoading(true);setSearchErr("");setFoundMine(null);
    try{
      const {data,error}=await supabase.from("mines").select("id,name,location,code,plan").eq("code",q).maybeSingle();
      if(error)throw error;
      if(!data){setSearchErr("No mine found. Check the code and try again.");return;}
      setFoundMine({...data,operators:0,machines:0});
    }catch(err){
      console.error("searchMine failed:",err);
      setSearchErr(err.message||"Lookup failed. Try again.");
    }finally{setSearchLoading(false);}
  };
  const ROLE_OPTS=[{id:"operator",label:"Operator",icon:"👷",color:"#4fa3e0",desc:"I operate mobile plant"},{id:"supervisor",label:"Supervisor",icon:"🔶",color:"#f5a623",desc:"I supervise the shift"},{id:"minemanager",label:"Mine Manager",icon:"⛏",color:"#a78bfa",desc:"I manage the operation"}];
  if(step===1)return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontSize:12,fontFamily:F,fontWeight:700,cursor:"pointer",textAlign:"left",marginBottom:16}}>← Back</button>
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent,marginBottom:4}}>Find Your Mine</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:20}}>Enter the mine code your admin gave you, or search by name</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Mine code or name</div>
    <input value={search} onChange={e=>{setSearch(e.target.value);setSearchErr("");setFoundMine(null);}} onKeyDown={e=>e.key==="Enter"&&searchMine()} placeholder="e.g. REDROCK or Redrock Quarry" style={{...inp,border:`1px solid ${foundMine?C.success:searchErr?C.danger:C.border}`,textTransform:"uppercase"}}/>
    {searchErr&&<div style={{fontSize:11,color:C.danger,marginBottom:10}}>{searchErr}</div>}
    {foundMine&&<div style={{background:`${C.success}10`,border:`1.5px solid ${C.success}44`,borderRadius:12,padding:"14px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div><div style={{fontFamily:F,fontWeight:900,fontSize:18,color:C.success}}>{foundMine.name}</div><div style={{fontSize:11,color:C.muted}}>{foundMine.location}</div></div>
        <span style={{background:`${C.success}20`,color:C.success,border:`1px solid ${C.success}44`,borderRadius:6,padding:"2px 8px",fontSize:10,fontFamily:F,fontWeight:700}}>FOUND</span>
      </div>
      <div style={{display:"flex",gap:8,fontSize:11,color:C.muted}}><span>👷 {foundMine.operators} operators</span><span>🚛 {foundMine.machines} machines</span></div>
    </div>}
    <button onClick={()=>foundMine?setStep(2):searchMine()} style={{width:"100%",background:foundMine?C.success:C.accent,color:"#000",border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",transition:"background .2s"}}>
      {foundMine?"Join "+foundMine.name+" →":"Search →"}
    </button>
  </div>;
  if(step===2)return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent,marginBottom:2}}>Create Account</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:20}}>{foundMine?.name}</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Your full name</div>
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. James Smith" style={{...inp,border:`1px solid ${name.trim()?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Work email</div>
    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com.au" style={{...inp,border:`1px solid ${emailOk?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Password <span style={{color:C.muted,fontWeight:400}}>(min 8 characters)</span></div>
    <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={{...inp,border:`1px solid ${passOk?C.success:C.border}`}}/>
    <button onClick={()=>{if(name.trim()&&emailOk&&passOk)setStep(3);}} style={{width:"100%",background:name.trim()&&emailOk&&passOk?C.success:C.border,color:name.trim()&&emailOk&&passOk?"#000":C.muted,border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer",transition:"background .2s",marginTop:4}}>
      Continue →
    </button>
    <button onClick={()=>setStep(1)} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>← Back</button>
  </div>;
  if(step===3)return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.accent,marginBottom:4}}>Your Role</div>
    <div style={{fontSize:12,color:C.muted,marginBottom:20}}>What do you do at {foundMine?.name}?</div>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
      {ROLE_OPTS.map(r=><button key={r.id} onClick={()=>setRole(r.id)} style={{background:role===r.id?`${r.color}15`:C.card,border:`2px solid ${role===r.id?r.color:C.border}`,borderRadius:14,padding:"16px 15px",display:"flex",alignItems:"center",gap:13,cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${r.color}20`,border:`2px solid ${r.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{r.icon}</div>
        <div><div style={{fontFamily:F,fontWeight:900,fontSize:17,color:role===r.id?r.color:C.text}}>{r.label}</div><div style={{fontSize:11,color:C.muted}}>{r.desc}</div></div>
        {role===r.id&&<div style={{marginLeft:"auto",color:r.color,fontSize:20}}>✓</div>}
      </button>)}
    </div>
    {role==="operator"&&<div style={{marginBottom:16}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Primary machine (your admin can update this)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {BASE_MACHINES.filter(m=>m.type!=="Dozer").map(m=><button key={m.id} onClick={()=>setMachine(m.id)} style={{background:machine===m.id?`${C.accent}15`:C.card,border:`1.5px solid ${machine===m.id?C.accent:C.border}`,borderRadius:10,padding:"10px 11px",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:machine===m.id?C.accent:C.text}}>{m.model}</div>
          <div style={{fontSize:10,color:C.muted}}>{m.type}</div>
        </button>)}
      </div>
    </div>}
    {joinErr&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger,textAlign:"left"}}>{joinErr}</div>}
    <button disabled={joining||!role||(role==="operator"&&!machine)} onClick={async()=>{
      if(!role||(role==="operator"&&!machine))return;
      setJoining(true);setJoinErr("");
      try{
        const {data:auth,error:authErr}=await supabase.auth.signUp({email,password:pass,options:{data:{name}}});
        if(authErr)throw authErr;
        if(!auth?.user)throw new Error("Sign-up returned no user");
        const {error:siErr}=await supabase.auth.signInWithPassword({email,password:pass});
        if(siErr)throw siErr;
        const {error:opErr}=await supabase.from("operators").insert({
          auth_id:auth.user.id,mine_id:foundMine.id,name,role,
          machine_id:role==="operator"?machine:null,status:"active",
        });
        if(opErr)throw opErr;
        setStep(4);
      }catch(err){
        console.error("Join mine failed:",err);
        setJoinErr(err.message||"Could not join. Try again.");
      }finally{setJoining(false);}
    }} style={{width:"100%",background:joining?C.border:(role&&(role!=="operator"||machine)?C.success:C.border),color:joining?C.muted:(role&&(role!=="operator"||machine)?"#000":C.muted),border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:joining?"default":"pointer",transition:"background .2s"}}>
      {joining?"Requesting…":"Request Access →"}
    </button>
    <button onClick={()=>setStep(2)} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"10px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>← Back</button>
  </div>;
  // Step 4 — pending or approved
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px",textAlign:"center"}} className="up">
    <div style={{fontSize:56,marginBottom:12}}>🎉</div>
    <div style={{fontFamily:F,fontWeight:900,fontSize:26,color:C.success,marginBottom:6}}>Welcome, {name.split(" ")[0]}!</div>
    <div style={{fontSize:13,color:C.muted,marginBottom:24}}>{foundMine?.name} · {ROLES[role]?.label}</div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",marginBottom:20,textAlign:"left"}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:10}}>Account created ✓</div>
      {[`Name: ${name}`,`Mine: ${foundMine?.name}`,`Role: ${ROLES[role]?.label}`,role==="operator"?`Machine: ${BASE_MACHINES.find(m=>m.id===machine)?.model||"—"}`:"Access: All shift data"].map((s,i)=><div key={i} style={{fontSize:12,color:C.muted,marginBottom:4}}>· {s}</div>)}
    </div>
    <div style={{background:`${C.success}10`,border:`1px solid ${C.success}33`,borderRadius:12,padding:"12px 14px",marginBottom:20}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:13,color:C.success,marginBottom:4}}>✓ You're in</div>
      <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>You now have access to {foundMine?.name}. Tap below to get started.</div>
    </div>
    <button onClick={()=>onComplete({name,email,role,machine,mine:foundMine})} style={{width:"100%",background:C.accent,color:"#000",border:"none",borderRadius:14,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:"pointer"}}>
      Enter MineOps →
    </button>
  </div>;
}

function Login({onLogin,mine,onBack}){
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passOk=pass.length>=6;
  const inp={background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 14px",fontSize:15,width:"100%",outline:"none",marginBottom:10};
  const go=async()=>{
    if(!emailOk||!passOk)return;
    setLoading(true);setErr("");
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
      if(error)throw error;
      onLogin(data.session);
    }catch(e){
      console.error("signIn failed:",e);
      setErr(e.message||"Sign-in failed.");
    }finally{setLoading(false);}
  };
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 20px"}} className="up">
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontFamily:F,fontWeight:900,fontSize:44,color:C.accent,letterSpacing:".06em"}}>MINEOPS</div>
      {mine?<div style={{fontFamily:F,fontWeight:700,fontSize:16,color:C.text,marginTop:4}}>{mine.name||mine.mineName}</div>:null}
    </div>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Email</div>
    <input type="email" autoCapitalize="none" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com.au" style={{...inp,border:`1px solid ${emailOk?C.success:C.border}`}}/>
    <div style={{fontSize:12,color:C.muted,marginBottom:5}}>Password</div>
    <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{...inp,border:`1px solid ${passOk?C.success:C.border}`}}/>
    {err&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}44`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:C.danger}}>{err}</div>}
    <button disabled={loading||!emailOk||!passOk} onClick={go} style={{width:"100%",background:loading?C.border:(emailOk&&passOk?C.accent:C.border),color:loading?C.muted:(emailOk&&passOk?"#000":C.muted),border:"none",borderRadius:12,padding:"15px",fontFamily:F,fontWeight:900,fontSize:18,cursor:loading?"default":"pointer",marginTop:6}}>
      {loading?"Signing in…":"Sign In →"}
    </button>
    {onBack&&<button onClick={onBack} style={{width:"100%",background:"none",border:"none",color:C.muted,padding:"12px",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>← Back</button>}
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
  const { session } = useSupabase()
  const [user,setUser]=useState(null)
  const [tab,setTab]=useState("board")
  const [flow,setFlow]=useState("onboarding")
  const [pendingMine,setPendingMine]=useState(null)
  const [activeMine,setActiveMine]=useState(null)
  const [showSignOut,setShowSignOut]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [customMachines,setCustomMachines]=useState([])
  const [customCatData,setCustomCatData]=useState([])
  const [custPerfData,setCustPerfData]=useState({})
  // Load the user's operator profile + mine whenever session changes
  useEffect(()=>{
    let cancelled=false;
    async function loadProfile(){
      if(!session){setUser(null);return;}
      try{
        const {data,error}=await supabase
          .from("operators")
          .select("id,name,role,status,machine_id,crusher_assigned,employee_id,auth_id,mine_id,mines(id,name,code,location,plan)")
          .eq("auth_id",session.user.id)
          .maybeSingle();
        if(error)throw error;
        if(cancelled)return;
        if(!data){
          // Signed in but no operator row yet — stay on onboarding so they can create/join a mine
          return;
        }
        // Shape the user to mimic the BASE_USERS format the rest of the app expects
        const u={
          id:data.id,
          name:data.name,
          role:data.role,
          machine:data.machine_id||undefined,
          crusherAssigned:data.crusher_assigned||undefined,
          employeeId:data.employee_id||data.id.slice(0,8).toUpperCase(),
          avatar:(data.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase(),
          status:data.status,
        };
        setUser(u);
        if(data.mines){setActiveMine(data.mines);}
        // If still on onboarding/login screens, advance into the app
        setFlow(f=>((f==="onboarding"||f==="login")?"truckQ":f));
      }catch(e){console.error("loadProfile failed:",e);}
    }
    loadProfile();
    return()=>{cancelled=true;};
  },[session])
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
  const handleLogin=()=>{ /* session is already set by AuthProvider; loadProfile effect handles the rest */ }
  const handleTruck=drove=>{if(drove)setFlow("truckCheck");else setFlow(lv===1?"machines":"app")}
  const handleAddMachine=async(machine,catData)=>{
    setCustomMachines(p=>[...p,machine]);
    setCustomCatData(p=>[...p,{id:machine.id,meta:machine,data:catData}]);
    setCustPerfData(p=>({...p,[machine.id]:[]}));
    if(activeMine?.id){
      try{
        await supabase.from("machines").insert({mine_id:activeMine.id,...machine,...(catData?{telematics:catData}:{})});
      }catch(e){console.error("persist machine failed:",e);}
    }
  }
  const handleSignOut=async()=>{await supabase.auth.signOut();setUser(null);setActiveMine(null);setRemoteMachines(null);setRemoteOperators(null);setFlow("onboarding");setTab("board");setShowSignOut(false);setMenuOpen(false);}
  const screen=()=>{
    if(flow==="vehicleCheck")return <TruckCheckScreen onComplete={()=>setFlow("app")}/>
    if(flow==="addMachine")return <AddMachineScreen allMachines={allMachines} onAdd={handleAddMachine} onBack={()=>setFlow("app")}/>
    if(flow==="photoManager")return <PhotoManagerScreen/>
    if(flow==="settings")return <SettingsScreen onClose={()=>setFlow("app")}/>
    if(tab==="ops"&&lv===1)return <ScoopLoggerScreen user={user}/>
    if(tab==="checks")return <ChecksHub allMachines={allMachines} catDemo={catDemo}/>
    if(tab==="perf")return <MachinePerformanceScreen allMachines={allMachines} custPerfData={custPerfData}/>
    if(tab==="intel")return <IntelligenceHub/>
    if(tab==="comply")return <ComplianceHub/>
    if(tab==="scoring")return <ScoringHub/>
    return <LiveBoard/>
  }
  return <div style={{maxWidth:420,margin:"0 auto",height:"100vh",display:"flex",flexDirection:"column",background:C.bg,position:"relative",overflow:"hidden"}}>
    {showSignOut&&<SignOutConfirm onConfirm={handleSignOut} onCancel={()=>setShowSignOut(false)}/>}
    {menuOpen&&<MenuOverlay user={user} allMachines={allMachines} onNav={t=>{setTab(t);setFlow("app")}} onAddMachine={()=>setFlow("addMachine")} onVehicleCheck={()=>setFlow("vehicleCheck")} onClose={()=>setMenuOpen(false)}/>}
    {flow==="onboarding"&&<div style={{flex:1,overflowY:"auto"}}><OnboardingScreen onEnterDemo={()=>setFlow("login")} onCreateMine={()=>setFlow("createMine")} onJoinMine={()=>setFlow("joinMine")}/></div>}
    {flow==="createMine"&&<div style={{flex:1,overflowY:"auto"}}><CreateMineFlow onComplete={m=>{setActiveMine(m);setPendingMine(m);setFlow("subscription")}} onBack={()=>setFlow("onboarding")}/></div>}
    {flow==="joinMine"&&<div style={{flex:1,overflowY:"auto"}}><JoinMineFlow onComplete={m=>{setActiveMine(m.mine);setFlow("login")}} onBack={()=>setFlow("onboarding")}/></div>}
    {flow==="subscription"&&<div style={{flex:1,overflowY:"auto"}}><SubscriptionScreen mineName={pendingMine?.mineName||"Your Mine"} onSelect={()=>setFlow("vlSetup")}/></div>}
    {flow==="vlSetup"&&<div style={{flex:1,overflowY:"auto"}}><VisionLinkSetup onComplete={()=>setFlow("login")} onSkip={()=>setFlow("login")}/></div>}
    {flow==="login"&&<div style={{flex:1,overflowY:"auto"}}><Login onLogin={handleLogin} mine={activeMine}/></div>}
    {flow==="truckQ"&&<div style={{flex:1,overflowY:"auto"}}><TruckQuestion user={user} onAnswer={handleTruck}/></div>}
    {flow==="truckCheck"&&<div style={{flex:1,overflowY:"auto"}}><TruckCheckScreen onComplete={()=>setFlow(lv===1?"machines":"app")}/></div>}
    {flow==="machines"&&<div style={{flex:1,overflowY:"auto"}}><MachineSelectScreen allMachines={allMachines} catDemo={catDemo} isAdmin={user?.role==="admin"} onAddMachine={()=>setFlow("addMachine")} onComplete={()=>setFlow("app")}/></div>}
    {(flow==="app"||flow==="vehicleCheck"||flow==="addMachine"||flow==="photoManager"||flow==="settings")&&<>
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
