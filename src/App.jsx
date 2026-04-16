import { useState, useMemo } from "react";

const HOTELS = [
  { entity: "AG Propinvest", name: "IBIS Castleford", keys: 63, budget: 363.46, hasKitchen: true, hasEvening: true },
  { entity: "AG Force", name: "Lakeside", keys: 44, budget: 253.85, hasKitchen: true, hasEvening: false },
  { entity: "AG Max", name: "Fortune", keys: 41, budget: 236.54, hasKitchen: false, hasEvening: false },
  { entity: "AG Blue", name: "Casa Mere", keys: 40, budget: 288.46, hasKitchen: true, hasEvening: true, hasPub: true },
  { entity: "AG Plus", name: "Orchid", keys: 29, budget: 209.13, hasKitchen: false, hasEvening: false },
  { entity: "AG Spot", name: "Plaza", keys: 30, budget: 216.35, hasKitchen: false, hasEvening: false },
  { entity: "AG North", name: "Embassy", keys: 42, budget: 242.31, hasKitchen: false, hasEvening: false },
  { entity: "AG Derbyshire", name: "Stuart", keys: 100, budget: 504.81, hasKitchen: true, hasEvening: true },
  { entity: "AG Sunderland", name: "Magnum", keys: 63, budget: 318.03, hasKitchen: false, hasEvening: false },
  { entity: "AG Blackpool", name: "Blue Waters", keys: 63, budget: 318.03, hasKitchen: true, hasEvening: true },
  { entity: "AG Wilmslow", name: "Pinewood", keys: 89, budget: 770.19, hasKitchen: true, hasEvening: true, hasPublicArea: true },
  { entity: "AG Water Road", name: "Crown", keys: 152, budget: 1096.15, hasKitchen: true, hasEvening: true, hasPublicArea: true, isCrown: true },
  { entity: "AG Peterborough", name: "Milestone", keys: 99, budget: 464.06, hasKitchen: true, hasEvening: true },
  { entity: "AG Kendal", name: "Lakeland", keys: 43, budget: 279.09, hasKitchen: true, hasEvening: true },
  { entity: "AG Coventry", name: "Crossway", keys: 50, budget: 180.29, hasKitchen: true, hasEvening: true },
  { entity: "AG Cardiff", name: "Beacon", keys: 50, budget: 252.40, hasKitchen: true, hasEvening: true },
  { entity: "AG Washington", name: "Reston", keys: 79, budget: 330.43, hasKitchen: true, hasEvening: true },
  { entity: "AG Wakefield", name: "Kiln", keys: 77, budget: 322.07, hasKitchen: true, hasEvening: true, hasPub: true },
  { entity: "AG Hull", name: "Galleon", keys: 50, budget: 144.23, hasKitchen: true, hasEvening: true },
  { entity: "AG Runcorn", name: "Runmere", keys: 53, budget: 267.55, hasKitchen: true, hasEvening: true },
  { entity: "AG Doncaster", name: "Raceby", keys: 50, budget: 252.40, hasKitchen: true, hasEvening: true },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GRID = "140px repeat(7, 1fr) 60px";

function sumStaff(staff) {
  return staff.reduce((s, p) => s + p.schedule.reduce((h, d) => h + (d ? d.hours : 0), 0), 0);
}
const roundHalf = (n) => Math.round(n * 2) / 2;

function generateRota(hotel, dailyDepartures, amCovers, pmCovers) {
  const h = hotel, budget = h.budget, sections = [], warnings = [];
  let used = 0;
  const postRecBudget = budget - 168;
  const recStaff = [];

  const hmDays = postRecBudget < 80 ? 6 : budget > 500 ? 6 : 5;
  recStaff.push({ title: "Hotel Manager (AM Desk)", schedule: DAYS.map((_, i) => i < hmDays ? { shift: "AM", hours: 8 } : null), isHM: true, isFixed: true });
  recStaff.push({ title: "Duty Manager 1 (PM)", schedule: DAYS.map((_, i) => i <= 4 ? { shift: "PM", hours: 8 } : null), isFixed: true });
  recStaff.push({ title: "Duty Manager 2", schedule: DAYS.map((_, i) => { if (i===5||i===6) return {shift:"AM",hours:8}; if (i===2||i===3) return {shift:"PM",hours:8}; return null; }), isFixed: true });
  recStaff.push({ title: "Duty Manager 3", schedule: DAYS.map((_, i) => (i===5||i===6)?{shift:"PM",hours:8}:null), isFixed: true });
  recStaff.push({ title: "Night Porter 1", schedule: DAYS.map((_, i) => i<=3?{shift:"NT",hours:8}:null), isFixed: true });
  recStaff.push({ title: "Night Porter 2", schedule: DAYS.map((_, i) => i>=4?{shift:"NT",hours:8}:null), isFixed: true });

  const recHrs = sumStaff(recStaff);
  sections.push({ role: "Reception (24/7) — HM on desk", staff: recStaff, weeklyHours: recHrs });
  used += recHrs;

  if (h.hasPublicArea) {
    const paStaff = [
      { title: "General Assistant Day 1", schedule: DAYS.map((_,i)=>i<=4?{shift:"AM",hours:8}:null), isFixed: true },
      { title: "General Assistant Day 2", schedule: DAYS.map((_,i)=>i>=5?{shift:"AM",hours:8}:null), isFixed: true },
      { title: "General Assistant Night 1", schedule: DAYS.map((_,i)=>i<=3?{shift:"NT",hours:8}:null), isFixed: false },
      { title: "General Assistant Night 2", schedule: DAYS.map((_,i)=>i>=4?{shift:"NT",hours:8}:null), isFixed: false },
    ];
    const paHrs = sumStaff(paStaff);
    sections.push({ role: "Public Area + Stayovers", staff: paStaff, weeklyHours: paHrs });
    used += paHrs;
  }

  const bufferPct = 0.10, bufferHrs = Math.round(budget*bufferPct*10)/10;
  let flexBudget = Math.max(0, budget-used-bufferHrs);
  const fixedPA = h.hasPublicArea?112:0;
  const totalDeptMin = dailyDepartures.reduce((s,d)=>s+d*25,0);
  const idealHK = 40 + totalDeptMin/60;
  let idealKit = 0;
  if(h.hasKitchen){ idealKit+=70; if(h.hasEvening) idealKit+=24; idealKit+=35; if(h.keys>50) idealKit+=24; }
  let idealFB = 0;
  if(h.hasKitchen){ idealFB+=40+Math.max(1,Math.ceil(h.keys*0.75/20))*4*6; if(h.hasEvening) idealFB+=24; }
  const flexAfterPA = Math.max(0, flexBudget-fixedPA);
  const idealTotal = idealHK+idealKit+idealFB;
  const scale = idealTotal>0?Math.min(1,flexAfterPA/idealTotal):0;

  const RPH=2.4, RASH=6, RAC=Math.floor(RPH*RASH);
  const hkStaff = [{ title: "Head Housekeeper", schedule: DAYS.map((_,i)=>i<=4?{shift:"AM",hours:8}:null), isFixed: true }];
  const raRPD = dailyDepartures.map(d=>Math.max(0,d-10));
  const rasNPD = raRPD.map(r=>r>0?Math.max(1,Math.ceil(r/RAC)):0);
  const totalSlots = rasNPD.reduce((s,n)=>s+n,0);
  if(totalSlots>0){
    const numRA = Math.max(Math.max(...rasNPD), Math.ceil(totalSlots/5));
    const rem=[...rasNPD]; const schedules=[];
    for(let r=0;r<numRA;r++){
      const sch=DAYS.map(()=>null); let assigned=0;
      const order=DAYS.map((_,i)=>i).filter(i=>rem[i]>0).sort((a,b)=>rem[b]-rem[a]);
      for(const di of order){ if(assigned>=5) break; if(rem[di]>0){ const rpr=Math.ceil(raRPD[di]/rasNPD[di]); const hrs=roundHalf(rpr/RPH); sch[di]={shift:"AM",hours:Math.min(RASH,Math.max(2,hrs))}; rem[di]--; assigned++; }}
      if(assigned>0) schedules.push(sch);
    }
    schedules.forEach((sch,r)=>hkStaff.push({title:schedules.length===1?"Room Attendant":`Room Att. ${r+1}`,schedule:sch, isFixed: false}));
  }
  const hkHrs=sumStaff(hkStaff);
  const raOnly=hkStaff.filter(s=>s.title!=="Head Housekeeper");
  sections.push({role:`Housekeeping (target ${RPH} rooms/hr)`,staff:hkStaff,weeklyHours:hkHrs,departures:dailyDepartures,raStaff:raOnly});
  used+=hkHrs;

  if(h.hasKitchen){
    const kS = [];

    const amChefsNeeded = amCovers.map(c => c <= 0 ? 0 : c <= 30 ? 1 : 2);
    const pmChefsNeeded = pmCovers.map(c => c <= 0 ? 0 : c <= 30 ? 1 : 2);
    const amKPNeeded = amCovers.map(c => c > 20);
    const pmKPNeeded = pmCovers.map(c => c > 20);

    const AM_HRS = 5;
    const HC_HRS = 8;
    const PM_HRS = 4;

    kS.push({ title: "Head Chef", schedule: DAYS.map((_,i) => i<=4 && amCovers[i]>0 ? {shift:"AM",hours:HC_HRS} : i<=4 ? {shift:"AM",hours:HC_HRS} : null), isFixed: true });

    const amExtraSlots = DAYS.map((_,di) => {
      if (di >= 5) return amChefsNeeded[di];
      return Math.max(0, amChefsNeeded[di] - 1);
    });
    const totalAmExtraSlots = amExtraSlots.reduce((s,n) => s+n, 0);

    if (totalAmExtraSlots > 0) {
      const numPT = Math.max(1, Math.ceil(totalAmExtraSlots / 5));
      const rem = [...amExtraSlots];
      for (let p = 0; p < numPT; p++) {
        const sch = DAYS.map(() => null);
        let assigned = 0;
        const order = DAYS.map((_,i) => i).filter(i => rem[i] > 0).sort((a,b) => rem[b] - rem[a]);
        for (const di of order) {
          if (assigned >= 5) break;
          if (rem[di] > 0) {
            sch[di] = {shift:"AM", hours: h.hasPub && di >= 5 ? 8 : AM_HRS};
            rem[di]--;
            assigned++;
          }
        }
        if (assigned > 0) kS.push({ title: numPT===1 ? "PT Chef" : `PT Chef ${p+1}`, schedule: sch, isFixed: false });
      }
    }

    if (h.hasEvening) {
      const pmSlots = pmChefsNeeded.reduce((s,n) => s+n, 0);
      if (pmSlots > 0) {
        const numEvChefs = Math.max(1, Math.ceil(pmSlots / 6));
        const rem = [...pmChefsNeeded];
        for (let e = 0; e < numEvChefs; e++) {
          const sch = DAYS.map(() => null);
          let assigned = 0;
          const order = DAYS.map((_,i) => i).filter(i => rem[i] > 0).sort((a,b) => rem[b] - rem[a]);
          for (const di of order) {
            if (assigned >= 6) break;
            if (rem[di] > 0) {
              sch[di] = {shift:"PM", hours: h.hasPub && di===5 ? 8 : PM_HRS};
              rem[di]--;
              assigned++;
            }
          }
          if (assigned > 0) kS.push({ title: numEvChefs===1 ? "Evening Chef" : `Evening Chef ${e+1}`, schedule: sch, isFixed: e===0 });
        }
      }
    }

    if (h.isCrown) {
      kS.push({ title: "Night Chef", schedule: DAYS.map(() => ({shift:"NT",hours:8})), isFixed: false });
    }

    if (amKPNeeded.some(d=>d)) {
      kS.push({ title: "Kitchen Porter (AM)", schedule: DAYS.map((_,di) => amKPNeeded[di]?{shift:"AM",hours:4}:null), isFixed: false });
    }
    if (h.hasEvening && pmKPNeeded.some(d=>d)) {
      kS.push({ title: "Kitchen Porter (PM)", schedule: DAYS.map((_,di) => pmKPNeeded[di]?{shift:"PM",hours:4}:null), isFixed: false });
    }

    const kH = sumStaff(kS);
    const kitLabel = h.isCrown?"Kitchen (24hr)":h.hasPub?"Kitchen (Pub)":h.hasEvening?"Kitchen":"Kitchen (B/fast only)";
    sections.push({ role: kitLabel, staff: kS, weeklyHours: kH, amCovers, pmCovers });
    used += kH;
  }

  if(h.hasKitchen){
    const fS = [];
    const isCrownOrPinewood = h.isCrown || h.hasPublicArea;

    const amHostsNeeded = amCovers.map(c => c <= 0 ? 0 : Math.max(1, Math.ceil(c / 30)));
    const pmHostsNeeded = pmCovers.map((c, di) => {
      if (!h.hasEvening && !isCrownOrPinewood) return 0;
      if (c <= 0) return 0;
      return Math.max(1, Math.ceil(c / 30));
    });

    const totalAmSlots = amHostsNeeded.reduce((s,n)=>s+n, 0);
    if (totalAmSlots > 0) {
      const numAM = Math.max(1, Math.ceil(totalAmSlots / 5));
      const rem = [...amHostsNeeded];
      for (let p = 0; p < numAM; p++) {
        const sch = DAYS.map(() => null); let a = 0;
        const ord = DAYS.map((_,i) => i).filter(i => rem[i] > 0).sort((x,y) => rem[y] - rem[x]);
        for (const di of ord) { if (a >= 5) break; if (rem[di] > 0) { sch[di] = {shift:"AM", hours:8}; rem[di]--; a++; }}
        if (a > 0) fS.push({ title: numAM === 1 ? "Host AM" : `Host AM ${p+1}`, schedule: sch, isFixed: false });
      }
    }

    const totalPmSlots = pmHostsNeeded.reduce((s,n) => s+n, 0);
    if (totalPmSlots > 0) {
      const numPM = Math.max(1, Math.ceil(totalPmSlots / 5));
      const rem = [...pmHostsNeeded];
      for (let p = 0; p < numPM; p++) {
        const sch = DAYS.map(() => null); let a = 0;
        const ord = DAYS.map((_,i) => i).filter(i => rem[i] > 0).sort((x,y) => rem[y] - rem[x]);
        for (const di of ord) { if (a >= 5) break; if (rem[di] > 0) { sch[di] = {shift:"PM", hours:8}; rem[di]--; a++; }}
        if (a > 0) fS.push({ title: numPM === 1 ? "Host PM" : `Host PM ${p+1}`, schedule: sch, isFixed: false });
      }
    }

    const fH = sumStaff(fS);
    if (fH > 0) {
      sections.push({ role: isCrownOrPinewood?"F&B (Crown/Pinewood)":"F&B", staff: fS, weeklyHours: fH });
      used += fH;
    }
  }

  const overBudget = used + bufferHrs - budget;
  if (overBudget > 0) {
    let toTrim = overBudget;

    const fbSections = sections.filter(s => s.role.startsWith("F&B"));
    for (const sec of fbSections) {
      const varStaff = sec.staff.filter(p => p.isFixed === false);
      for (let i = varStaff.length - 1; i >= 0 && toTrim > 0; i--) {
        const staffHrs = varStaff[i].schedule.reduce((s,d) => s + (d ? d.hours : 0), 0);
        sec.staff = sec.staff.filter(p => p !== varStaff[i]);
        toTrim -= staffHrs;
        used -= staffHrs;
      }
      sec.weeklyHours = sumStaff(sec.staff);
    }

    if (toTrim > 0) {
      const kitSec = sections.find(s => s.role.startsWith("Kitchen"));
      if (kitSec) {
        const evChefs = kitSec.staff.filter(p => p.title.includes("Evening Chef"));
        for (const ec of evChefs) {
          const ecHrs = ec.schedule.reduce((s,d) => s + (d ? d.hours : 0), 0);
          kitSec.staff = kitSec.staff.filter(p => p !== ec);
          toTrim -= ecHrs;
          used -= ecHrs;
        }
        const headChef = kitSec.staff.find(p => p.title === "Head Chef");
        if (headChef) {
          const oldHrs = sumStaff([headChef]);
          headChef.schedule = headChef.schedule.map(d => d ? {...d, hours: 5} : null);
          const newHrs = sumStaff([headChef]);
          const saved = oldHrs - newHrs;
          toTrim -= saved;
          used -= saved;
        }
        const pmKPs = kitSec.staff.filter(p => p.title.includes("Kitchen Porter (PM)"));
        for (const kp of pmKPs) {
          const kpHrs = kp.schedule.reduce((s,d) => s + (d ? d.hours : 0), 0);
          kitSec.staff = kitSec.staff.filter(p => p !== kp);
          toTrim -= kpHrs;
          used -= kpHrs;
        }
        kitSec.weeklyHours = sumStaff(kitSec.staff);
        if (evChefs.length > 0) {
          kitSec.role = kitSec.role.replace("Kitchen", "Kitchen (B/fast only)").replace("(B/fast only) (B/fast only)", "(B/fast only)");
          warnings.push("Evening kitchen closed to fit budget — breakfast only");
        }
      }
    }

    if (toTrim > 0) {
      const kitSec = sections.find(s => s.role.startsWith("Kitchen"));
      if (kitSec) {
        const varStaff = kitSec.staff.filter(p => p.isFixed === false);
        for (let i = varStaff.length - 1; i >= 0 && toTrim > 0; i--) {
          const staffHrs = varStaff[i].schedule.reduce((s,d) => s + (d ? d.hours : 0), 0);
          kitSec.staff = kitSec.staff.filter(p => p !== varStaff[i]);
          toTrim -= staffHrs;
          used -= staffHrs;
        }
        kitSec.weeklyHours = sumStaff(kitSec.staff);
      }
    }

    if (overBudget > 10) warnings.push("Variable staff trimmed — reception covers F&B duties");
  }

  if(budget-used-bufferHrs<0) warnings.push(`Still over budget by ${Math.abs(Math.round((budget-used-bufferHrs)*10)/10)}h — review staffing`);
  return {sections,totalHours:Math.round(used*10)/10,warnings,scale:Math.round(scale*100),bufferHrs};
}

const COLORS = { AM:{bg:"#2d6a4f"}, PM:{bg:"#1b4965"}, NT:{bg:"#3d2c5e"}, "AM/PM":{bg:"#6b4226"} };
const fmtHrs = (n) => Number.isInteger(n)?`${n}`:`${Math.round(n*2)/2}`;

export default function App() {
  const [selectedIdx, setSelectedIdx] = useState(11);
  const hotel = HOTELS[selectedIdx];
  const [occPct, setOccPct] = useState(DAYS.map(()=>75));
  const [adr, setAdr] = useState(DAYS.map(()=>65));
  const defDept = Math.ceil(Math.ceil(hotel.keys*0.75)*0.50);
  const [departures, setDepartures] = useState(DAYS.map(()=>defDept));
  const [deptEdited, setDeptEdited] = useState(DAYS.map(()=>false));
  const defAmCovers = Math.round(hotel.keys * 0.75 * 0.7);
  const [amCovers, setAmCovers] = useState(DAYS.map(()=>defAmCovers));
  const [pmCovers, setPmCovers] = useState(DAYS.map(()=> hotel.hasEvening ? Math.round(hotel.keys * 0.3) : 0));
  const roomsOcc = occPct.map(p=>Math.round(hotel.keys*p/100));

  const changeHotel=(idx)=>{ const h=HOTELS[idx]; setSelectedIdx(idx); const nd=Math.ceil(Math.ceil(h.keys*0.75)*0.50); setOccPct(DAYS.map(()=>75)); setAdr(DAYS.map(()=>65)); setDepartures(DAYS.map(()=>nd)); setDeptEdited(DAYS.map(()=>false)); setAmCovers(DAYS.map(()=>Math.round(h.keys*0.75*0.7))); setPmCovers(DAYS.map(()=>h.hasEvening?Math.round(h.keys*0.3):0)); };
  const changeOcc=(di,val)=>{ const c=Math.max(0,Math.min(100,val)); setOccPct(p=>{const n=p.map((v,i)=>i===di?c:v); const r=Math.round(hotel.keys*c/100); const nx=(di+1)%7; if(!deptEdited[nx]) setDepartures(p=>p.map((v,i)=>i===nx?Math.ceil(r*0.5):v)); return n;}); };
  const changeDept=(di,val)=>{ setDepartures(p=>p.map((v,i)=>i===di?Math.max(0,Math.min(hotel.keys,val)):v)); setDeptEdited(p=>p.map((v,i)=>i===di?true:v)); };
  const changeAdr=(di,val)=>{ setAdr(p=>p.map((v,i)=>i===di?Math.max(0,Math.min(999,val)):v)); };
  const changeAmCovers=(di,val)=>{ setAmCovers(p=>p.map((v,i)=>i===di?Math.max(0,val):v)); };
  const changePmCovers=(di,val)=>{ setPmCovers(p=>p.map((v,i)=>i===di?Math.max(0,val):v)); };

  const dailyRev = roomsOcc.map((r,i)=>r*adr[i]);
  const weeklyRoomsRev = dailyRev.reduce((s,r)=>s+r,0);

  const dailyBfastRev = amCovers.map(c => c * 10);
  const dailyDinnerRev = pmCovers.map(c => c * 20);
  const dailyBarRev = DAYS.map((_,di) => Math.round(pmCovers[di] * 5 + roomsOcc[di] * 3));
  const dailyFBRev = DAYS.map((_,di) => dailyBfastRev[di] + dailyDinnerRev[di] + dailyBarRev[di]);
  const weeklyFBRev = dailyFBRev.reduce((s,r)=>s+r,0);
  const weeklyTotalRev = weeklyRoomsRev + weeklyFBRev;

  const avgOcc = Math.round(occPct.reduce((s,p)=>s+p,0)/7);
  const avgAdr = Math.round(adr.reduce((s,a)=>s+a,0)/7);

  const rota = useMemo(()=>generateRota(hotel,departures,amCovers,pmCovers),[selectedIdx,departures,amCovers,pmCovers]);
  const variance = Math.round((hotel.budget-rota.totalHours-rota.bufferHrs)*10)/10;
  const pctUsed = Math.round((rota.totalHours/hotel.budget)*100);
  const wageCost = rota.totalHours*15;
  const wagePct = weeklyTotalRev>0?(wageCost/weeklyTotalRev*100):0;
  const wColor = wagePct<=30?"#2d6a4f":wagePct<=40?"#b58900":"#c1121f";

  const inp = {width:"100%",padding:"3px 0",fontSize:11,textAlign:"center",borderRadius:3,border:"1px solid #333",background:"#0f1117",color:"#f0f0f0",fontWeight:600,boxSizing:"border-box"};

  return (
    <div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",background:"#0f1117",color:"#e0e0e0",minHeight:"100vh",padding:"16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:18,fontWeight:700,color:"#f0f0f0"}}>AG Hotels — Draft Weekly Rota</h1>
          <p style={{margin:"2px 0 0",fontSize:11,color:"#555"}}>Budget-constrained &bull; 10% holiday buffer &bull; HM covers desk in smaller hotels</p>
        </div>
        <select value={selectedIdx} onChange={e=>changeHotel(Number(e.target.value))} style={{padding:"7px 12px",fontSize:13,borderRadius:6,border:"1px solid #333",background:"#1a1d27",color:"#f0f0f0",cursor:"pointer",minWidth:260}}>
          {HOTELS.map((h,i)=><option key={i} value={i}>{h.name} ({h.keys} keys) — {h.budget}h</option>)}
        </select>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        {[{l:"Hotel",v:hotel.name,s:hotel.entity},{l:"Keys",v:hotel.keys},{l:"Budget",v:`${hotel.budget.toFixed(1)}h`},{l:"Drafted",v:`${rota.totalHours.toFixed(1)}h`,s:`${pctUsed}%`},{l:"Buffer",v:`${rota.bufferHrs.toFixed(1)}h`,c:"#b58900"},{l:"Remaining",v:`${variance>=0?"+":""}${variance.toFixed(1)}h`,c:variance>=0?"#2d6a4f":"#c1121f"}].map((c,i)=>(
          <div key={i} style={{background:"#1a1d27",borderRadius:6,padding:"8px 12px",border:"1px solid #262a36",flex:"1 1 70px",minWidth:70}}>
            <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:1}}>{c.l}</div>
            <div style={{fontSize:15,fontWeight:700,color:c.c||"#f0f0f0",marginTop:1}}>{c.v}</div>
            {c.s&&<div style={{fontSize:9,color:"#444",marginTop:1}}>{c.s}</div>}
          </div>
        ))}
      </div>

      {rota.warnings.length>0&&<div style={{marginBottom:12,padding:"7px 12px",background:"#2a1e10",border:"1px solid #4a3520",borderRadius:4,fontSize:10,color:"#e8c080"}}>{rota.warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}</div>}

      <div style={{display:"flex",gap:10,marginBottom:12,fontSize:10,flexWrap:"wrap"}}>
        {[["AM","07–15"],["PM","15–23"],["NT","23–07"],["AM/PM","Flex"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:11,height:11,borderRadius:2,background:COLORS[k].bg,display:"inline-block"}}/>
            <span style={{color:"#777"}}>{k} {v}</span>
          </div>
        ))}
      </div>

      <div style={{marginBottom:14,background:"#1a1d27",borderRadius:6,border:"1px solid #262a36",overflowX:"auto"}}>
        <div style={{minWidth:640,padding:"10px"}}>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:4}}>
            <div style={{padding:"4px 6px",fontSize:12,fontWeight:600,color:"#b0b8c4"}}>Forecast</div>
            {DAYS.map(d=><div key={d} style={{textAlign:"center",padding:"4px 2px",color:"#555",fontWeight:500,fontSize:11}}>{d}</div>)}
            <div style={{textAlign:"center",padding:"4px 2px",color:"#555",fontWeight:500,fontSize:10}}>Wk/Avg</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:3}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:10}}>Occupancy %</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"1px 3px"}}><input type="number" min="0" max="100" value={occPct[di]} onChange={e=>changeOcc(di,parseInt(e.target.value)||0)} style={inp}/><div style={{fontSize:8,color:"#444"}}>{roomsOcc[di]} rm</div></div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#888",fontWeight:600,fontSize:10}}>{avgOcc}%</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:3}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:10}}>ADR (£)</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"1px 3px"}}><input type="number" min="0" max="999" value={adr[di]} onChange={e=>changeAdr(di,parseInt(e.target.value)||0)} style={inp}/></div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#888",fontWeight:600,fontSize:10}}>£{avgAdr}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:1}}>
            <div style={{padding:"3px 6px",color:"#2d6a4f",fontSize:10,fontWeight:600}}>Rooms Revenue</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"3px 2px",color:"#2d6a4f",fontWeight:600,fontSize:10}}>£{dailyRev[di].toLocaleString()}</div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#2d6a4f",fontWeight:700,fontSize:10}}>£{weeklyRoomsRev.toLocaleString()}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:1}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:9}}>B/fast (£10/cover)</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"2px 2px",color:"#666",fontSize:9}}>£{dailyBfastRev[di]}</div>)}
            <div style={{textAlign:"center",padding:"2px 2px",color:"#666",fontSize:9}}>£{dailyBfastRev.reduce((s,r)=>s+r,0).toLocaleString()}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:1}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:9}}>Dinner (£20/cover)</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"2px 2px",color:"#666",fontSize:9}}>£{dailyDinnerRev[di]}</div>)}
            <div style={{textAlign:"center",padding:"2px 2px",color:"#666",fontSize:9}}>£{dailyDinnerRev.reduce((s,r)=>s+r,0).toLocaleString()}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:1}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:9}}>Bar (est.)</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"2px 2px",color:"#666",fontSize:9}}>£{dailyBarRev[di]}</div>)}
            <div style={{textAlign:"center",padding:"2px 2px",color:"#666",fontSize:9}}>£{dailyBarRev.reduce((s,r)=>s+r,0).toLocaleString()}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:3,borderBottom:"1px solid #262a36",paddingBottom:4}}>
            <div style={{padding:"3px 6px",color:"#2d6a4f",fontSize:10,fontWeight:700}}>Total Revenue</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"3px 2px",color:"#2d6a4f",fontWeight:700,fontSize:10}}>£{(dailyRev[di]+dailyFBRev[di]).toLocaleString()}</div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#2d6a4f",fontWeight:700,fontSize:11}}>£{weeklyTotalRev.toLocaleString()}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,marginBottom:4,borderBottom:"1px solid #262a36",paddingBottom:4,paddingTop:2}}>
            <div style={{padding:"3px 6px",color:wColor,fontSize:10,fontWeight:600}}>Wage/Revenue</div>
            <div style={{gridColumn:"2/-1",padding:"3px 6px",fontSize:10}}>
              <span style={{color:wColor,fontWeight:700}}>£{wageCost.toLocaleString()}</span>
              <span style={{color:"#555"}}> ({fmtHrs(rota.totalHours)}h × £15)</span>
              <span style={{color:"#888"}}> ÷ £{weeklyTotalRev.toLocaleString()} = </span>
              <span style={{color:wColor,fontWeight:700,fontSize:13}}>{wagePct.toFixed(1)}%</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,paddingTop:2}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:10}}>Departures</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"1px 3px"}}><input type="number" min="0" max={hotel.keys} value={departures[di]} onChange={e=>changeDept(di,parseInt(e.target.value)||0)} style={{...inp,border:deptEdited[di]?"1px solid #6b4226":"1px solid #333",color:deptEdited[di]?"#e8c080":"#f0f0f0"}}/></div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#b58900",fontWeight:700,fontSize:10}}>{departures.reduce((s,d)=>s+d,0)}</div>
          </div>
          {hotel.hasKitchen && <>
          <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,paddingTop:4,borderTop:"1px solid #262a36",marginTop:4}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:10}}>B/fast Covers</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"1px 3px"}}><input type="number" min="0" max="300" value={amCovers[di]} onChange={e=>changeAmCovers(di,parseInt(e.target.value)||0)} style={inp}/></div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#888",fontWeight:600,fontSize:10}}>{Math.round(amCovers.reduce((s,c)=>s+c,0)/7)}/d</div>
          </div>
          {hotel.hasEvening && <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,paddingTop:2}}>
            <div style={{padding:"3px 6px",color:"#888",fontSize:10}}>Dinner Covers</div>
            {DAYS.map((d,di)=><div key={d} style={{textAlign:"center",padding:"1px 3px"}}><input type="number" min="0" max="300" value={pmCovers[di]} onChange={e=>changePmCovers(di,parseInt(e.target.value)||0)} style={inp}/></div>)}
            <div style={{textAlign:"center",padding:"3px 2px",color:"#888",fontWeight:600,fontSize:10}}>{Math.round(pmCovers.reduce((s,c)=>s+c,0)/7)}/d</div>
          </div>}
          </>}
          <div style={{padding:"4px 6px 2px",fontSize:9,color:"#444"}}>Departures = 50% of prev day occ • Covers: &gt;20 = KP, &gt;30 = extra chef • Amber = overridden</div>
        </div>
      </div>

      {rota.sections.map((section,si)=>(
        <div key={si} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",borderBottom:"1px solid #222633",paddingBottom:4,marginBottom:5}}>
            <h2 style={{margin:0,fontSize:12,fontWeight:600,color:"#b0b8c4"}}>{section.role}</h2>
            <span style={{fontSize:11,color:"#666",fontWeight:600}}>{fmtHrs(section.weeklyHours)}h ({Math.round(section.weeklyHours/hotel.budget*100)}%)</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <div style={{minWidth:640}}>
              <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,borderBottom:"1px solid #1a1d25"}}>
                <div style={{padding:"4px 6px",color:"#555",fontWeight:500,fontSize:11}}>Staff</div>
                {DAYS.map(d=><div key={d} style={{textAlign:"center",padding:"4px 2px",color:"#555",fontWeight:500,fontSize:11}}>{d}</div>)}
                <div style={{textAlign:"center",padding:"4px 2px",color:"#555",fontWeight:500,fontSize:10}}>Hrs</div>
              </div>
              {(() => {
                const shiftOrder = {"AM":0,"AM/PM":1,"PM":2,"NT":3};
                const getMainShift = (person) => {
                  const shifts = person.schedule.filter(d=>d).map(d=>d.shift);
                  if (shifts.length === 0) return 4;
                  const counts = {};
                  shifts.forEach(s => counts[s] = (counts[s]||0)+1);
                  const main = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
                  return shiftOrder[main] ?? 4;
                };
                const fixed = section.staff.filter(p=>p.isFixed!==false).sort((a,b)=>getMainShift(a)-getMainShift(b));
                const variable = section.staff.filter(p=>p.isFixed===false).sort((a,b)=>getMainShift(a)-getMainShift(b));
                const sorted = [...fixed, ...variable];

                return (<>
                  {sorted.map((person, pi) => {
                    const total = person.schedule.reduce((s,d)=>s+(d?d.hours:0),0);
                    const isF = person.isFixed !== false;
                    const nameColor = person.isHM ? "#e8c080" : isF ? "#4a9" : "#b58900";
                    return (
                      <div key={pi} style={{display:"grid",gridTemplateColumns:GRID,gap:0,borderBottom:"1px solid #13151b"}}>
                        <div style={{padding:"3px 6px",color:nameColor,whiteSpace:"nowrap",fontSize:10,fontWeight:person.isHM?600:400,overflow:"hidden",textOverflow:"ellipsis"}}>{person.title}</div>
                        {person.schedule.map((day,di)=>(
                          <div key={di} style={{textAlign:"center",padding:"2px 1px"}}>
                            {day?<span style={{display:"inline-block",padding:"2px 4px",borderRadius:3,background:COLORS[day.shift]?.bg||"#333",color:"#fff",fontSize:9,fontWeight:500,minWidth:38}}>{day.shift} {fmtHrs(day.hours)}h</span>:<span style={{color:"#222",fontSize:9}}>OFF</span>}
                          </div>
                        ))}
                        <div style={{textAlign:"center",padding:"3px 2px",color:"#888",fontWeight:600,fontSize:10}}>{fmtHrs(total)}h</div>
                      </div>
                    );
                  })}
                </>);
              })()}
              <div style={{display:"grid",gridTemplateColumns:GRID,gap:0,borderTop:"1px solid #333"}}>
                <div style={{padding:"4px 6px",color:"#b58900",fontSize:10,fontWeight:600}}>Daily Total</div>
                {DAYS.map((_,di)=>{const dt=section.staff.reduce((s,p)=>s+(p.schedule[di]?.hours||0),0); return <div key={di} style={{textAlign:"center",padding:"4px 2px",color:"#b58900",fontWeight:700,fontSize:10}}>{fmtHrs(dt)}h</div>;})}
                <div style={{textAlign:"center",padding:"4px 2px",color:"#b58900",fontWeight:700,fontSize:10}}>{fmtHrs(section.weeklyHours)}h</div>
              </div>
              {section.departures&&(
                <div style={{display:"grid",gridTemplateColumns:GRID,gap:0}}>
                  <div style={{padding:"3px 6px",color:"#666",fontSize:9,fontStyle:"italic"}}>Rooms/hr (RAs)</div>
                  {DAYS.map((_,di)=>{
                    const rh=(section.raStaff||[]).reduce((s,p)=>s+(p.schedule[di]?.hours||0),0);
                    const rr=Math.max(0,section.departures[di]-10);
                    const eff=rh>0?(rr/rh):0;
                    return <div key={di} style={{textAlign:"center",padding:"3px 2px",fontSize:9,fontWeight:600,color:eff===0?"#333":(eff>=2.2&&eff<=2.6)?"#2d6a4f":eff>2.6?"#c1121f":"#b58900"}}>{rr>0&&rh>0?eff.toFixed(1):"—"}</div>;
                  })}
                  <div style={{textAlign:"center",padding:"3px 2px",fontSize:9,color:"#666"}}>target 2.4</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{marginTop:16,padding:12,background:"#1a1d27",borderRadius:5,border:"1px solid #222633",fontSize:10,color:"#555",lineHeight:1.7}}>
        <strong style={{color:"#888"}}>Logic:</strong>{" "}
        Reception 168h fixed &bull; HM on desk if tight budget &bull;
        PA: Crown & Pinewood only &bull;
        HK: Head HK covers 10 rooms, RAs 2.4 rooms/hr, 6hr shifts, max 5 days &bull;
        Kitchen/F&B scaled to budget &bull;
        No kitchen: {HOTELS.filter(x=>!x.hasKitchen).map(x=>x.name).join(", ")} &bull;
        Wage: £15/hr blended &bull;
        <span style={{color:"#c1121f"}}>Guide only — GMs adjust to demand</span>
      </div>
    </div>
  );
}
