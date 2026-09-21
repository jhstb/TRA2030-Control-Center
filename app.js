

const TRACE_DERIVED = {
  gateInputs: {
    G0:["A1.15"], G1:["A1.11","A1.12","A6.01","A6.02"],
    G2:["A2.05","A2.14","A3.01","A3.04","A3.09"],
    G3:["A4.01","A4.04","A4.08","A4.10"],
    G4:["A6.15","A6.16"], G5:["A6.04","A6.05","A6.06","A6.07"],
    G6:["A5.11","A5.12","ED5.10"], G7:["ED6.08","ED8.06","ED1.08"],
    G8:["G2","G4","G5","G6","G7","A6.17"], G9:["G8"], G10:["M15","A7.12"]
  },
  chain: {
    G8:["G9"], G9:["M14"], "A6.15":["G4"], "A6.16":["G4"], "A6.17":["G8"]
  }
};

let DATA={};
let CONTROL_MODEL=null;
let CHANGE_STATE={simulation:null,log:[]};
const PRIVATE_COST_KEY="TRA2030_PRIVATE_COSTS_V1";

function privateCostLoad(){
  try{
    const raw=localStorage.getItem(PRIVATE_COST_KEY);
    if(!raw) return null;
    const obj=JSON.parse(raw);
    return obj && obj.schema==="TRA2030_PRIVATE_COSTS_V1" && Array.isArray(obj.allocations) ? obj : null;
  }catch(e){return null;}
}
function privateCostSave(obj){
  localStorage.setItem(PRIVATE_COST_KEY,JSON.stringify(obj));
}
function privateCostClear(){
  localStorage.removeItem(PRIVATE_COST_KEY);
  render("COSTS 🔒");
}
function privateCostImport(input){
  const file=input && input.files && input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const obj=JSON.parse(reader.result);
      if(!obj || obj.schema!=="TRA2030_PRIVATE_COSTS_V1" || !Array.isArray(obj.allocations)) throw new Error("Ungültiges Format");
      obj.importedAt=new Date().toISOString();
      privateCostSave(obj);
      render("COSTS 🔒");
    }catch(e){alert("Private Kostendatei konnte nicht geladen werden. Erwartet wird TRA2030_PRIVATE_COSTS_V1.");}
  };
  reader.readAsText(file);
}
function privateCostExportTemplate(){
  const obj={schema:"TRA2030_PRIVATE_COSTS_V1",version:1,lastUpdated:"",allocations:[{id:"PC-001",label:"Beispiel – interne Geldzuordnung",wp:"WP1",ed:"",amount_eur:0,note:"Nur lokale/private Daten. Keine vertraulichen Werte in GitHub speichern."}]};
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="TRA2030-private-costs-template.json"; a.click(); URL.revokeObjectURL(a.href);
}
function privateCostsView(){
  const d=privateCostLoad();
  const n=d?d.allocations.length:0;
  const total=d?d.allocations.reduce((sum,x)=>sum+(Number(x.amount_eur)||0),0):0;
  const fmt=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0});
  return `<div class="view-head"><div><div class="eyebrow">PROTECTED DATA</div><h1>Costs 🔒</h1></div><span class="private-badge">LOCAL PRIVATE LAYER</span></div>
  <section class="panel private-cost-panel">
    <div class="panel-title"><h2>Confidential cost allocation</h2><span>never part of the GitHub data model</span></div>
    <div class="private-cost-status"><div class="private-lock">🔒</div><div><b>${d?"PRIVATE DATA LOADED":"NO PRIVATE DATA LOADED"}</b><span>${d?`${n} allocation records · local browser storage · imported ${d.importedAt?new Date(d.importedAt).toLocaleString("de-DE"):""}`:"The public build contains no confidential cost allocation."}</span></div></div>
    ${d?`<div class="private-cost-total"><span>Confidential allocation total</span><b>${fmt.format(total)}</b></div>`:""}
    <div class="private-cost-actions"><label class="private-btn">IMPORT PRIVATE JSON<input type="file" accept="application/json,.json" onchange="privateCostImport(this)" hidden></label><button type="button" class="private-btn secondary" onclick="privateCostExportTemplate()">DOWNLOAD TEMPLATE</button>${d?`<button type="button" class="private-btn danger" onclick="privateCostClear()">CLEAR LOCAL DATA</button>`:""}</div>
    <div class="note"><b>Security boundary:</b> confidential amounts are stored only in this browser's local storage after import. They are not written into <code>data/</code>, <code>local-data.js</code>, GitHub or GitHub Pages. This is a data-separation measure, not cryptographic protection.</div>
  </section>
  <section class="panel"><div class="panel-title"><h2>Public / private rule</h2><span>V3.9 architecture</span></div><div class="private-rule-grid"><div><b>PUBLIC</b><span>Project structure, milestones, gates, actions, dependencies, public budget framework.</span></div><div><b>PRIVATE</b><span>Detailed internal money allocation and confidential cost lines.</span></div></div></section>`;
}
window.privateCostImport=privateCostImport; window.privateCostClear=privateCostClear; window.privateCostExportTemplate=privateCostExportTemplate;
const VIEWS=["START","EXECUTIVE","CONTROL","MATRIX","GANTT","NETWORK","GATES","ACTIONS","RISKS","DECISIONS","TRACE","ACTION CONTROL","RISK CONTROL","DECISION CONTROL","CHANGE CONTROL","SNAPSHOT / DELTA","SYSTEM HEALTH","COSTS 🔒","DATA"];

function load(){
  const names=["project","milestones","gates","actions","gaps","dependencies"];
  names.forEach(n=>DATA[n]=window.TRA_DATA[n]);
  CONTROL_MODEL=TRA.buildControlModel(DATA,{
    gateInputs:TRACE_DERIVED.gateInputs,
    chain:TRACE_DERIVED.chain,
    gapTrace:(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED:{}),
    decisionCandidates:(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]),
    milestoneByGate:(typeof GM!=="undefined"?GM:{})
  });
  DATA.actions=CONTROL_MODEL.actions;
  render("START");
}
function nav(v){
  const primary=["START","CONTROL","GANTT","NETWORK","GATES","ACTIONS","RISKS","DECISIONS","COSTS 🔒","DATA"];
  const tools=["EXECUTIVE","MATRIX","TRACE","ACTION CONTROL","RISK CONTROL","DECISION CONTROL","CHANGE CONTROL","SNAPSHOT / DELTA","SYSTEM HEALTH"];
  document.querySelector("nav").innerHTML=`<div class="nav-primary"><div class="nav-section-label">PROJECT CONTROL</div>${primary.map(x=>`<button class="${x===v?"active":""}" onclick="render('${x}')"><span>${navIcon(x)}</span><b>${x}</b></button>`).join("")}<div class="nav-section-label nav-tools-label">TOOLS</div>${tools.map(x=>`<button class="${x===v?"active":""} nav-tool" onclick="render('${x}')"><span>${navIcon(x)}</span><b>${x}</b></button>`).join("")}</div><div class="nav-footer"><strong>TRA 2030</strong><span>European mobility platform</span><small>Munich · ICM</small></div>`;
}
function navIcon(x){const m={"START":"⌂","CONTROL":"▤","GANTT":"▥","NETWORK":"⌘","GATES":"⚑","ACTIONS":"☷","RISKS":"△","DECISIONS":"●","COSTS 🔒":"▣","DATA":"▤","EXECUTIVE":"◈","MATRIX":"▦","TRACE":"↗","ACTION CONTROL":"✓","RISK CONTROL":"△","DECISION CONTROL":"◆","CHANGE CONTROL":"↻","SNAPSHOT / DELTA":"◫","SYSTEM HEALTH":"♥"};return m[x]||"•";}
function signal(s){return `<span class="signal ${String(s).toLowerCase()}"><i></i>${s}</span>`;}
function status(s){return `<span class="status">${s}</span>`;}

function executiveControl(){
  const model=CONTROL_MODEL||TRA.buildControlModel(DATA,{gateInputs:TRACE_DERIVED.gateInputs,chain:TRACE_DERIVED.chain,decisionCandidates:(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]),gapTrace:(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED:{})});
  const actions=model.actions||[], gaps=model.gaps||[], gates=model.gates||[], milestones=model.milestones||[];
  const candidates=model.decisionCandidates||[];
  const actualDecisions=typeof decisionRecords==="function"?decisionRecords():[];
  const blocked=actions.filter(x=>x.status==="BLOCKED");
  const exposed=actions.filter(x=>x.network_exposed || ["HIGH","CRITICAL"].includes(String(x.exposure||"").toUpperCase()));
  const criticalGaps=gaps.filter(x=>String(x.priority||"").toUpperCase()==="CRITICAL");
  const attention=[...blocked.map(x=>({id:x.id,title:x.task||x.title||x.id,kind:"BLOCKED",target:x.gate||"TBC"})),
    ...criticalGaps.map(x=>({id:x.id,title:x.title||x.description||x.id,kind:"CRITICAL GAP",target:(typeof GAP_TRACE_DERIVED!=="undefined"?(GAP_TRACE_DERIVED[x.id]||[])[0]:"TBC")||"TBC"}))];
  const nextGate=gates.find(x=>x.id==="G0")||gates[0]||{id:"G0",title:"Consortium Ready",status:"OPEN"};
  const nextM=milestones.find(x=>x.id==="M1")||milestones[0]||{id:"M1",title:"Consortium / roles confirmed",period:"Q4/2026–Q2/2027"};
  const attentionRows=attention.slice(0,5).map(x=>`<button class="exec-item" type="button" onclick="window.traceSelect('${x.id}')"><span class="exec-dot ${x.kind==='BLOCKED'?'red':'yellow'}"></span><b>${x.id}</b><div><strong>${x.title}</strong><small>${x.kind} · ${x.target}</small></div><em>TRACE →</em></button>`).join("") || `<div class="muted">No blocked or critical attention item is currently computed.</div>`;
  const actionRows=actions.filter(x=>x.status!=="DONE").slice(0,5).map(x=>`<button class="exec-row" type="button" onclick="window.traceSelect('${x.id}')"><b>${x.id}</b><span>${x.task||x.title||"Action"}</span><small>${x.owner||"TBC"}</small><em>${x.gate||"TBC"}</em></button>`).join("") || `<div class="muted">No open actions.</div>`;
  return `<div class="view-head"><div><div class="eyebrow">EXECUTIVE CONTROL · V3.5</div><h1>Executive Control</h1></div><div class="legend">Live management view · calculated from master data</div></div>
  <section class="cards control-kpis">
    <div class="metric"><label>ATTENTION</label><b>${attention.length}</b><span>blocked + critical gaps</span></div>
    <div class="metric"><label>DECISIONS</label><b>${actualDecisions.length}</b><span>${candidates.length} candidates</span></div>
    <div class="metric"><label>NETWORK EXPOSURE</label><b>${exposed.length}</b><span>computed from current data</span></div>
    <div class="metric"><label>MASTER INTEGRITY</label><b>${model.counts.total}/${model.counts.total} ✓</b><span>single derived control model</span></div>
  </section>
  <section class="grid2">
    <div class="panel"><div class="panel-title"><h2>What needs attention?</h2><span>live</span></div><div class="exec-list">${attentionRows}</div></div>
    <div class="panel"><div class="panel-title"><h2>Next control points</h2><span>source-supported</span></div>
      <button class="exec-focus" type="button" onclick="window.traceSelect('${nextGate.id}')"><small>NEXT GATE</small><b>${nextGate.id} · ${nextGate.title}</b><span>${nextGate.status||"OPEN"} · TRACE →</span></button>
      <button class="exec-focus" type="button" onclick="window.traceSelect('${nextM.id}')"><small>NEXT MILESTONE</small><b>${nextM.id} · ${nextM.title}</b><span>${nextM.period||"TBC"} · TRACE →</span></button>
    </div>
  </section>
  <section class="grid2">
    <div class="panel"><div class="panel-title"><h2>Action Focus</h2><span>open actions</span></div><div class="exec-rows">${actionRows}</div></div>
    <div class="panel"><div class="panel-title"><h2>Management Network</h2><span>G0 → G10</span></div><div class="exec-network">${gates.map(x=>`<button type="button" onclick="window.traceSelect('${x.id}')"><b>${x.id}</b><span>${x.title}</span></button>`).join("")}</div></div>
  </section>
  <section class="panel"><div class="panel-title"><h2>Executive Control Rule</h2><span>V3.5</span></div><div class="note"><b>Status ≠ Exposure.</b> Executive values are computed from the existing master data. Network exposure does not automatically change the actual status of downstream gates or milestones. Missing source information remains TBC.</div></section>`;
}

function start(){
  const a=CONTROL_MODEL?.actions||DATA.actions||[], g=DATA.gates||[], m=DATA.milestones||[], gaps=DATA.gaps||[];
  const counts={OPEN:a.filter(x=>x.status==="OPEN").length,IN_PROGRESS:a.filter(x=>x.status==="IN_PROGRESS").length,BLOCKED:a.filter(x=>x.status==="BLOCKED").length,DONE:a.filter(x=>x.status==="DONE").length};
  const gateStates=g.map(x=>{const s=TRA.gateState(x.id,TRACE_DERIVED.gateInputs,new Map([...a,...g,...m].map(y=>[y.id,y])));return {...x,...s};});
  const gateOn=gateStates.filter(x=>x.traffic_light==="GREEN").length, gateRisk=gateStates.filter(x=>x.traffic_light==="YELLOW").length, gateBlocked=gateStates.filter(x=>x.traffic_light==="RED").length;
  const criticalGaps=gaps.filter(x=>String(x.priority).toUpperCase()==="CRITICAL").length, highGaps=gaps.filter(x=>String(x.priority).toUpperCase()==="HIGH").length;
  const exposed=a.filter(x=>x.network_exposed===true).length;
  const liveSnapshot=(typeof snapshotLoad==="function"?snapshotLoad():null);
  const liveDelta=(typeof deltaCompute==="function"?deltaCompute():{items:[]});
  const candidates=(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]);
  const years=["2026","2027","2028","2029","2030","2031"];
  const spans={M1:[0,2],M2:[1,1],M3:[1,1],M4:[1,1],M5:[2,1],M6:[2,1],M7:[2,2],M8:[3,1],M9:[3,1],M10:[3,1],M11:[3,2],M12:[4,1],M13:[4,1],M14:[4,1],M15:[4,2],M16:[5,1]};
  const ganttRows=[["WP1","Governance & Economic Plan",0,2],["WP2","Programme / Content",0,4],["WP3","Scientific Review & Awards",2,4],["WP4","Europe / Partnerships",1,4],["WP5","Industry / Expo & Visits",2,5],["WP6","Operations / Digital",1,5],["WP7","Impact / Legacy",2,5],["ED1","Venue / Site / Spatial Operations",1,4],["ED2","Production / AV / Stage",2,5],["ED3","Registration / Accreditation",2,5],["ED4","Hospitality / Catering",2,5],["ED5","Expo / Demonstrators / Visits",2,5],["ED6","Security / Safety / Medical",3,5],["ED7","Digital / Media / Streaming",2,5],["ED8","Mobility / Transfers / Accommodation",2,5],["ED9","Sustainability / Legacy",3,6],["ED10","Contingency / Reserve",3,5]];
  const miniRows=ganttRows.map(r=>`<div class="mini-gantt-row"><div class="mini-label"><b>${r[0]}</b><span>${r[1]}</span></div><div class="mini-track">${years.map((_,i)=>i>=r[2]&&i<r[3]?'<i></i>':'<span></span>').join('')}</div></div>`).join('');
  const milestoneRows=m.map(x=>{const s=spans[x.id]||[0,0];return `<div class="mini-mile"><b>${x.id}</b><span>${x.title}</span><em>${x.period}</em><div class="mini-mile-track">${years.map((_,i)=>i>=s[0]&&i<s[0]+s[1]?'<i></i>':'<span></span>').join('')}</div></div>`}).join('');
  const actionRows=a.slice(0,5).map(x=>`<button class="dash-table-row" onclick="window.traceSelect('${x.id}')"><b>${x.id}</b><span>${x.task}</span><small>${x.owner||"TBC"}</small><em>${x.status}</em></button>`).join('');
  const riskRows=gaps.slice().sort((x,y)=>(x.priority==='CRITICAL'?0:1)-(y.priority==='CRITICAL'?0:1)).slice(0,5).map(x=>`<button class="dash-table-row" onclick="window.traceSelect('${x.id}')"><b>${x.id}</b><span>${x.title}</span><small class="priority-${String(x.priority).toLowerCase().replace('/','-')}">${x.priority}</small><em>${x.status}</em></button>`).join('');
  const decisionRows=candidates.slice(0,5).map(x=>`<button class="dash-table-row" onclick="window.traceSelect('${x.gap}')"><b>${x.id}</b><span>${x.title}</span><small>${x.gap}</small><em>${x.gate}</em></button>`).join('');
  return `<div class="dashboard-shell">
    <section class="tra-hero" aria-label="TRA 2030 project identity">
<svg class="tra-mobility-silhouette" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="mobSky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#123845"/>
      <stop offset=".55" stop-color="#0c4b5a"/>
      <stop offset="1" stop-color="#08323d"/>
    </linearGradient>
    <linearGradient id="mobGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9fd7d2" stop-opacity=".10"/>
      <stop offset=".5" stop-color="#ffffff" stop-opacity=".22"/>
      <stop offset="1" stop-color="#9fd7d2" stop-opacity=".06"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="520" fill="url(#mobSky)"/>
  <circle cx="1180" cy="120" r="82" fill="#d8e9df" opacity=".14"/>
  <path d="M0 320 L0 290 95 270 155 285 225 245 285 270 360 230 430 265 505 220 565 255 650 205 735 250 820 210 900 255 990 195 1070 245 1160 205 1250 250 1340 210 1425 260 1510 220 1600 250 L1600 520 L0 520Z" fill="#071f29" opacity=".62"/>
  <!-- skyline -->
  <g fill="#061a23" opacity=".72">
    <rect x="830" y="210" width="42" height="110"/><rect x="880" y="178" width="58" height="142"/>
    <rect x="950" y="230" width="35" height="90"/><rect x="995" y="155" width="50" height="165"/>
    <rect x="1060" y="195" width="80" height="125"/><rect x="1155" y="225" width="48" height="95"/>
    <rect x="1220" y="175" width="72" height="145"/><rect x="1310" y="235" width="54" height="85"/>
  </g>
  <!-- rail line -->
  <path d="M0 355 C330 305 620 295 980 315 C1210 328 1410 350 1600 380" fill="none" stroke="#b9d8d7" stroke-opacity=".24" stroke-width="8"/>
  <path d="M0 365 C330 315 620 305 980 325 C1210 338 1410 360 1600 390" fill="none" stroke="#b9d8d7" stroke-opacity=".12" stroke-width="5"/>
  <!-- train silhouette -->
  <g transform="translate(90 305)">
    <path d="M0 34 Q12 0 48 0 H240 Q272 0 294 34 V76 H0Z" fill="#041821" opacity=".92"/>
    <rect x="30" y="15" width="58" height="26" rx="5" fill="#9fd7d2" opacity=".18"/>
    <rect x="98" y="15" width="58" height="26" rx="5" fill="#9fd7d2" opacity=".18"/>
    <rect x="166" y="15" width="58" height="26" rx="5" fill="#9fd7d2" opacity=".18"/>
    <circle cx="58" cy="78" r="15" fill="#021118"/><circle cx="245" cy="78" r="15" fill="#021118"/>
  </g>
  <!-- bridge -->
  <path d="M760 360 Q910 205 1060 360" fill="none" stroke="#d6e9e4" stroke-opacity=".16" stroke-width="10"/>
  <path d="M770 360 Q910 230 1050 360" fill="none" stroke="#d6e9e4" stroke-opacity=".10" stroke-width="6"/>
  <path d="M745 365 H1075" stroke="#d6e9e4" stroke-opacity=".16" stroke-width="8"/>
  <!-- road -->
  <path d="M0 520 C360 405 700 382 1020 405 C1280 425 1450 475 1600 520Z" fill="#020f15" opacity=".84"/>
  <path d="M430 520 L735 400 M620 520 L790 405 M1040 520 L920 405" stroke="#d8e7e4" stroke-opacity=".18" stroke-width="4"/>
  <!-- bus -->
  <g transform="translate(1120 355)">
    <rect x="0" y="0" width="210" height="82" rx="15" fill="#041821" opacity=".94"/>
    <rect x="20" y="13" width="165" height="34" rx="6" fill="#a6d9d3" opacity=".18"/>
    <circle cx="40" cy="86" r="14" fill="#020f15"/><circle cx="168" cy="86" r="14" fill="#020f15"/>
  </g>
  <!-- car -->
  <g transform="translate(900 418)">
    <path d="M0 38 Q12 5 50 0 H120 Q150 5 168 38 L185 55 H0Z" fill="#020f15" opacity=".96"/>
    <circle cx="38" cy="58" r="12" fill="#020f15"/><circle cx="150" cy="58" r="12" fill="#020f15"/>
  </g>
  <!-- clean horizon -->
  <rect y="440" width="1600" height="80" fill="url(#mobGlow)" opacity=".55"/>
</svg>
      <div class="tra-hero-pill">Executive Control Cockpit</div>
      <div class="tra-hero-grid">
        <div>
          <div class="tra-hero-kicker">TRA 2030 · Transport Research Arena</div>
          <h1 class="tra-hero-title"><span>SHAPING THE FUTURE</span><span>OF MOBILITY</span></h1>
          <div class="tra-hero-sub">Science · Europe · Policy · Industry · City · Delivery</div>
          <div class="tra-hero-tagline">One project · one network · one integrated control system</div>
        </div>
        <div class="tra-hero-side">
          <div class="tra-proof"><b>2026–2031</b><small>Project horizon</small></div>
          <div class="tra-proof"><b>7 + 10</b><small>CSA + Delivery WPs</small></div>
          <div class="tra-proof"><b>G0 → G10</b><small>Readiness architecture</small></div>
          <div class="tra-proof"><b>2030</b><small>Event delivery</small></div>
        </div>
      </div>
    </section>
    <section class="dash-kpis">
      <button class="dash-kpi kpi-blue" onclick="render('ACTIONS')"><div class="kpi-icon">▱</div><div><label>OPERATIVE UNITS</label><strong>${a.length}</strong><span><i></i> Open ${counts.OPEN} · In progress ${counts.IN_PROGRESS} · Blocked ${counts.BLOCKED}</span></div></button>
      <button class="dash-kpi kpi-green" onclick="render('GATES')"><div class="kpi-icon">⚑</div><div><label>READINESS GATES</label><strong>${g.length}</strong><span><i class="good"></i> On track ${gateOn} · Risk ${gateRisk} · Blocked ${gateBlocked}</span></div></button>
      <button class="dash-kpi kpi-orange" onclick="render('RISKS')"><div class="kpi-icon">△</div><div><label>OPEN GAPS</label><strong>${gaps.length}</strong><span><i class="critical"></i> Critical ${criticalGaps} · High ${highGaps}</span></div></button>
      <button class="dash-kpi kpi-violet" onclick="render('NETWORK')"><div class="kpi-icon">⌘</div><div><label>NETWORK EXPOSED</label><strong>${exposed}</strong><span><i class="${exposed?'critical':'good'}"></i> Current computed exposure</span></div></button>
    </section>
    <section class="exec-status-ribbon" aria-label="Executive control status">
      <div class="exec-status-left">
        <span class="exec-status-dot"></span>
        <div><b>SYSTEM HEALTH</b><small>${TRA.coreIntegrity(CONTROL_MODEL).ok?'HEALTHY':'ATTENTION'}</small></div>
      </div>
      <div class="exec-status-item"><span>BASELINE</span><b>18.09.2026</b></div>
      <div class="exec-status-item"><span>SNAPSHOT</span><b>${liveSnapshot?'AVAILABLE':'NOT CREATED'}</b></div>
      <div class="exec-status-item"><span>DELTA</span><b>${liveDelta.items?liveDelta.items.length:0} changes</b></div>
      <div class="exec-status-item"><span>EXPOSURE</span><b>${exposed} units</b></div>
      <button class="exec-status-action" onclick="render('SNAPSHOT / DELTA')">Open snapshot →</button>
    </section>
    <section class="dash-main-grid">
      <div class="dash-left">
        <section class="dash-panel readiness-panel"><div class="dash-panel-head"><div><h2>Readiness chain</h2><span>G0 → G10 · current control state</span></div><button onclick="render('GATES')">Show details →</button></div><div class="readiness-chain">${gateStates.map((x,i)=>`<button class="readiness-node ${String(x.traffic_light).toLowerCase()}" onclick="window.traceSelect('${x.id}')"><b>${x.id}</b><span>${x.title.replace(' Ready','')}</span><i>${i<gateStates.length-1?'→':''}</i></button>`).join('')}</div></section>
        <section class="dash-panel gantt-panel"><div class="dash-panel-head"><div><h2>Gantt — Work Packages, Event Delivery & Milestones</h2><span>Master planning backbone · source periods + network-derived visual windows</span></div><button onclick="render('GANTT')">Open full Gantt →</button></div><div class="mini-gantt"><div class="mini-gantt-head"><div>WORKSTREAM</div><div>${years.map(y=>`<b>${y}</b>`).join('')}</div></div>${miniRows}<div class="mini-gantt-divider">MILESTONES M1 — M16</div>${milestoneRows}</div></section>
      </div>
      <aside class="dash-side"><section class="dash-panel milestone-panel"><div class="dash-panel-head"><div><h2>Key Milestones</h2><span>M1 — M16</span></div><button onclick="render('GANTT')">Show all →</button></div><div class="milestone-list">${m.slice(0,8).map(x=>`<button class="milestone-item" onclick="window.traceSelect('${x.id}')"><b>${x.id}</b><span>${x.title}</span><em>${x.period}</em></button>`).join('')}</div></section><section class="dash-quote"><div>“</div><p>Bringing together research, industry, policy and society for a more sustainable and resilient mobility future.</p><span>TRA 2030 · Munich</span></section></aside>
    </section>
    <section class="dash-bottom-grid">
      <section class="dash-panel"><div class="dash-panel-head"><div><h2>Top Actions</h2><span>next 5 · current source baseline</span></div><button onclick="render('ACTIONS')">Show all →</button></div><div class="dash-table">${actionRows}</div></section>
      <section class="dash-panel"><div class="dash-panel-head"><div><h2>Open Gaps</h2><span>top 5 by documented priority</span></div><button onclick="render('RISKS')">Show all →</button></div><div class="dash-table">${riskRows}</div></section>
      <section class="dash-panel"><div class="dash-panel-head"><div><h2>Decision Candidates</h2><span>NETWORK_DERIVED · not actual decisions</span></div><button onclick="render('DECISION CONTROL')">Show all →</button></div><div class="dash-table">${decisionRows}</div></section>
    </section>
    <section class="dash-footer-note"><span>CONTROL RULE</span><b>Status ≠ Exposure.</b> Network exposure is computed and does not automatically change downstream status. Source gaps and TBC values remain visible rather than being inferred.</section>
  </div>`;
}

function gantt(){
  const m=DATA.milestones, cols=["2026","2027","2028","2029","2030","2031"];
  const spans={M1:[0,2],M2:[1,1],M3:[1,1],M4:[1,1],M5:[2,1],M6:[2,1],M7:[2,2],M8:[3,1],M9:[3,1],M10:[3,1],M11:[3,2],M12:[4,1],M13:[4,1],M14:[4,1],M15:[4,2],M16:[5,1]};
  const rows=[
    ["WP1","Governance & Economic Plan",0,2],["WP2","Programme / Content",0,5],["WP3","Scientific Review & Awards",2,5],
    ["WP4","Europe / Partnerships",2,6],["WP5","Industry / Expo & Visits",2,5],["WP6","Operations / Digital",1,5],["WP7","Impact / Legacy",2,6],
    ["ED1","Venue / Site / Spatial Operations",3,5],["ED2","Production / AV / Stage",3,5],["ED3","Registration / Accreditation",3,5],
    ["ED4","Hospitality / Catering",3,5],["ED5","Expo / Demonstrators / Visits",3,5],["ED6","Security / Safety / Medical",3,5],
    ["ED7","Digital / Media / Streaming",3,5],["ED8","Mobility / Transfers / Accommodation",3,5],["ED9","Sustainability / Legacy",3,5],["ED10","Contingency / Reserve",3,5]
  ];
  return `<div class="view-head"><div><div class="eyebrow">TIME BACKBONE · V1.3</div><h1>Master Gantt</h1></div><div class="legend">Source-supported periods · no invented task-level dates</div></div>
  <div class="gantt"><div class="g-head"><div>WORKSTREAM</div>${cols.map(c=>`<div>${c}</div>`).join("")}</div>
  ${rows.map(r=>`<div class="g-row"><div class="g-label"><b>${r[0]}</b><span>${r[1]}</span></div>${cols.map((c,i)=>`<div class="cell">${i>=r[2]&&i<r[3]?`<span class="gbar work" title="${r[1]}"></span>`:""}</div>`).join("")}</div>`).join("")}
  <div class="g-divider"><span>MILESTONES</span></div>
  ${m.map(x=>{let s=spans[x.id]||[0,0];return `<div class="g-row milestone-row"><div class="g-label"><b>${x.id}</b><span>${x.title}</span></div>${cols.map((c,i)=>`<div class="cell">${i>=s[0]&&i<s[0]+s[1]?`<span class="gbar milebar" title="${x.title}">●</span>`:""}</div>`).join("")}</div>`}).join("")}</div>
  <div class="note"><b>Source discipline:</b> WP/ED bars are planning windows for the visual master schedule. Exact action durations remain TBC where the source does not define them.</div>`;
}

function network(){
  return `<div class="view-head"><div><div class="eyebrow">DEPENDENCY LOGIC · V2.1</div><h1>Master Network</h1></div><div class="legend">Derived network relationships are clearly marked · status does not propagate automatically.</div></div>
  <div class="network-canvas">
    <div class="net-column inputs">
      <div class="net-caption">READINESS INPUTS</div>
      ${["G2","G4","G5","G6","G7"].map(x=>`<div class="net-node input"><b>${x}</b><span>${DATA.gates.find(g=>g.id===x)?.title||"Ready Gate"}</span></div>`).join("")}
    </div>
    <div class="net-flow"><span>converge</span><b>→</b></div>
    <div class="net-column central">
      <div class="net-caption">INTEGRATION POINT</div>
      <div class="net-node central-node"><b>G8</b><span>Full Rehearsal</span><em>CRITICAL CONVERGENCE</em></div>
    </div>
    <div class="net-flow"><b>→</b></div>
    <div class="net-column">
      <div class="net-caption">DELIVERY</div>
      <div class="net-node milestone-node"><b>M13</b><span>Full operational rehearsal</span></div>
      <div class="net-arrow-down">↓</div>
      <div class="net-node"><b>G9</b><span>Event Ready</span></div>
      <div class="net-arrow-down">↓</div>
      <div class="net-node milestone-node"><b>M14</b><span>TRA 2030 delivered</span></div>
    </div>
  </div>
  <div class="network-legend"><span><i class="dot blue"></i>Readiness gate</span><span><i class="dot green"></i>Integration / delivery gate</span><span><i class="dot orange"></i>Milestone</span></div>
  <div class="panel"><div class="panel-title"><h2>Dependency register</h2><span>NETWORK_DERIVED</span></div>
  <table><tr><th>FROM</th><th>RELATION</th><th>TO</th><th>ORIGIN</th></tr>${DATA.dependencies.map(x=>`<tr><td><b>${x.from}</b></td><td><b>→</b> ${x.type}</td><td><b>${x.to}</b></td><td>${x.source_flag}</td></tr>`).join("")}</table></div>`;
}

function gates(){
  const by=new Map([...DATA.gates,...DATA.milestones,...DATA.actions].map(x=>[x.id,x]));
  const inputs={
    G0:["A1.15"],
    G1:["A1.11","A1.12","A6.01","A6.02"],
    G2:["A2.05","A2.14","A3.01","A3.04","A3.09"],
    G3:["A4.01","A4.04","A4.08","A4.10"],
    G4:["A6.15","A6.16"],
    G5:["A6.04","A6.05","A6.06","A6.07"],
    G6:["A5.11","A5.12","ED5.10"],
    G7:["ED6.08","ED8.06","ED1.08"],
    G8:["G2","G4","G5","G6","G7","A6.17"],
    G9:["G8"],
    G10:["M15","A7.12"]
  };
  const descriptions={
    G0:"Roles, RACI, budget lines and commitments",
    G1:"Venue, capacity, host services and Economic Plan",
    G2:"Pillars, Call, Review and programme architecture",
    G3:"Partner Charter, Handover and Presidency engagement",
    G4:"Production specification, suppliers and technical concept",
    G5:"Registration, accreditation and speaker system",
    G6:"Exhibitors, demos, visits, permits and safety",
    G7:"Mobility, accessibility, security and emergency",
    G8:"Integrated technical + content + emergency rehearsal",
    G9:"Critical risks closed; contingency activated",
    G10:"Data, proceedings, impact and follow-up plan"
  };

  function gateCard(x){
    const s=TRA.gateState(x.id,inputs,by);
    const inp=inputs[x.id]||[];
    const critical=x.id==="G8";
    return `<article class="gate-detail ${critical?"gate-critical":""}">
      <div class="gate-top">
        <div class="gate-id">${x.id}</div>
        <div><h2>${x.title}</h2><p>${descriptions[x.id]||""}</p></div>
        <div class="gate-signal">${signal(s.traffic_light)}</div>
      </div>
      <div class="gate-body">
        <div class="gate-status"><label>STATUS</label><strong>${s.status}</strong></div>
        <div class="gate-status"><label>EXPOSURE</label><strong>${s.exposure}</strong></div>
        <div class="gate-status"><label>OWNER</label><strong>${x.owner}</strong></div>
        <div class="gate-status"><label>INPUTS</label><strong>${inp.length}</strong></div>
      </div>
      <div class="gate-inputs"><label>READINESS INPUTS</label>${inp.map(id=>{
        const n=by.get(id); const st=n?.status||"TBC";
        const sig=n?.traffic_light||"WHITE";
        return `<span class="input-chip ${String(sig).toLowerCase()}"><b>${id}</b><small>${n?.title||n?.task||""}</small><em>${st}</em></span>`;
      }).join("")}</div>
    </article>`;
  }

  return `<div class="view-head"><div><div class="eyebrow">READINESS CONTROL · V2.1</div><h1>Gate Control</h1></div>
  <div class="legend">G0–G10 · each gate has explicit readiness inputs · derived dependencies remain labelled.</div></div>
  <div class="gate-summary">
    <div><b>11</b><span>Readiness Gates</span></div>
    <div><b>1</b><span>Central Convergence</span></div>
    <div><b>G8</b><span>Full Rehearsal</span></div>
    <div><b>G9</b><span>Event Ready</span></div>
  </div>
  <div class="gate-detail-list">${DATA.gates.map(gateCard).join("")}</div>`;
}


function relationChips(id){
  const deps=DATA.dependencies||[];
  const all=[...(DATA.actions||[]),...(DATA.gates||[]),...(DATA.milestones||[]),...(DATA.gaps||[])];
  const by=new Map(all.map(x=>[x.id,x]));
  const up=deps.filter(d=>d.to===id).map(d=>d.from);
  const down=deps.filter(d=>d.from===id).map(d=>d.to);
  const nm=x=>(by.get(x)?.title||by.get(x)?.task||by.get(x)?.name||x);
  return `<div class="relation-panel">
    <div><label>TRACE BACK</label><div class="relation-chips">${up.length?up.map(x=>`<span class="rel-chip"><b>${x}</b> ${nm(x)}</span>`).join(""):'<span class="muted">No registered upstream dependency</span>'}</div></div>
    <div><label>TRACE FORWARD</label><div class="relation-chips">${down.length?down.map(x=>`<span class="rel-chip"><b>${x}</b> ${nm(x)}</span>`).join(""):'<span class="muted">No registered downstream dependency</span>'}</div></div>
  </div>`;
}


function actionGateBridge(){
  const actions=DATA.actions||[];
  const deps=DATA.dependencies||[];
  const gates=DATA.gates||[];
  const gateIds=new Set(gates.map(g=>g.id));
  const links=deps.filter(d=>gateIds.has(d.to) && String(d.from||"").startsWith("A"));
  const byA=new Map(actions.map(a=>[a.id,a]));
  const byG=new Map(gates.map(g=>[g.id,g]));
  const rows=links.map(d=>{
    const a=byA.get(d.from), g=byG.get(d.to);
    const at=a?.title||a?.task||a?.name||d.from;
    const gt=g?.title||g?.task||g?.name||d.to;
    return `<div class="bridge-row">
      <div class="bridge-node"><b>${d.from}</b><span>${at}</span></div>
      <div class="bridge-arrow">→</div>
      <div class="bridge-node"><b>${d.to}</b><span>${gt}</span></div>
      <div class="bridge-tag">${d.type||"DEPENDENCY"} · ${d.source_flag||"NETWORK_DERIVED"}</div>
    </div>`;
  }).join("");
  return `<section class="panel bridge-panel">
    <div class="panel-title"><h2>Actions ↔ Gates</h2><span>${links.length} registered links</span></div>
    <p class="muted">Operational actions feed readiness gates. Relationship provenance remains explicit.</p>
    <div class="bridge-list">${rows||'<div class="muted">No action→gate links registered.</div>'}</div>
  </section>`;
}



function actionGateLinks(actionId){
  const deps=DATA.dependencies||[];
  const gates=DATA.gates||[];
  const gateSet=new Set(gates.map(g=>g.id));
  const direct=deps.filter(d=>d.from===actionId && gateSet.has(d.to)).map(d=>d.to);
  const derived=[];
  Object.entries(TRACE_DERIVED.gateInputs||{}).forEach(([g,items])=>{
    if(items.includes(actionId) && !direct.includes(g)) derived.push(g);
  });
  return [...new Set([...direct,...derived])];
}
function actionControlCard(a){
  const id=a.id, gates=actionGateLinks(id);
  const status=a.status||"OPEN";
  const exposure=a.exposure||"NONE";
  return `<article class="action-control-card">
    <div class="action-card-top"><div><b>${id}</b><span>${a.title||a.task||a.name||""}</span></div>
      <button class="mini-trace" onclick="window.traceSelect('${id}')">Trace →</button>
    </div>
    <div class="action-meta"><span>STATUS <b>${status}</b></span><span>EXPOSURE <b>${exposure}</b></span><span>GATE(S) <b>${gates.length||"—"}</b></span></div>
    <div class="action-gates">${gates.length?gates.map(g=>`<button type="button" class="gate-link-chip" onclick="window.traceSelect('${g}')" title="Open ${g} in TRACE"><b>${g}</b> ${traceTitle(g)} <span>↗</span></button>`).join(""):'<span class="muted">No registered gate relationship</span>'}</div>
  </article>`;
}
function actionControl(){
  const actions=DATA.actions||[];
  const visible=actions.filter(a=>String(a.id||"").startsWith("A")).slice(0,40);
  return `<div class="view-head">
    <div><div class="eyebrow">ACTION CONTROL · V2.3.1</div><h1>Actions & Trace</h1></div>
    <div class="legend">Each action can be traced to registered readiness gates. Relationship provenance remains explicit.</div>
  </div>
  <section class="panel action-summary">
    <div class="summary-cell"><b>${actions.length}</b><span>CSA / operational actions loaded</span></div>
    <div class="summary-cell"><b>${actions.filter(a=>(a.status||"OPEN")==="OPEN").length}</b><span>currently OPEN in dataset</span></div>
    <div class="summary-cell"><b>${actions.filter(a=>actionGateLinks(a.id).length).length}</b><span>with gate relationship</span></div>
  </section>
  <section class="panel gate-click-test">
    <div class="panel-title"><h2>Gate click test</h2><span>explicit network-derived links</span></div>
    <div class="test-path">
      <div class="test-action"><b>A6.15</b><span>Production Specification</span><button type="button" onclick="window.traceSelect('A6.15')">Trace A6.15 →</button></div>
      <div class="test-arrow">→</div>
      <button type="button" class="gate-test-button" onclick="window.traceSelect('G4')"><b>G4</b><span>Production Ready</span><small>CLICK GATE →</small></button>
      <div class="test-arrow">→</div>
      <button type="button" class="gate-test-button" onclick="window.traceSelect('G8')"><b>G8</b><span>Full Rehearsal</span><small>CLICK GATE →</small></button>
      <div class="test-arrow">→</div>
      <button type="button" class="gate-test-button" onclick="window.traceSelect('G9')"><b>G9</b><span>Event Ready</span><small>CLICK GATE →</small></button>
      <div class="test-arrow">→</div>
      <button type="button" class="gate-test-button" onclick="window.traceSelect('M14')"><b>M14</b><span>TRA 2030 delivered</span><small>TRACE RESULT →</small></button>
    </div>
  </section>
  <section class="action-control-grid">${visible.map(actionControlCard).join("")}</section>`;
}


function riskRecords(){
  return DATA.risks||[];
}
function decisionRecords(){
  return DATA.decisions||[];
}
function riskDecisionLinks(riskId){
  const deps=DATA.dependencies||[];
  const out=deps.filter(d=>d.from===riskId).map(d=>d.to);
  return [...new Set(out)];
}
function decisionActionLinks(decisionId){
  const deps=DATA.dependencies||[];
  return [...new Set(deps.filter(d=>d.from===decisionId).map(d=>d.to))];
}

/* V2.5 DECISION CONTROL — source-safe */

/* V2.5.1 DECISION CANDIDATES — derived from documented gaps, not actual decisions */
const DECISION_CANDIDATES = [
  {id:"DC-E1", gap:"E1", title:"Formal BMV role / Coordinator / Beneficiary klären", gate:"G0", priority:"CRITICAL"},
  {id:"DC-E2", gap:"E2", title:"München Beneficiary vs. Host/Associated klären", gate:"G1", priority:"CRITICAL"},
  {id:"DC-E3", gap:"E3", title:"Venue / Host Capacity entscheiden", gate:"G1", priority:"CRITICAL"},
  {id:"DC-E4", gap:"E4", title:"Economic Plan / additional financing klären", gate:"G1", priority:"CRITICAL"},
  {id:"DC-E5", gap:"E5", title:"PCO Leistungsbild / Beschaffung festlegen", gate:"G4", priority:"HIGH"},
  {id:"DC-E6", gap:"E6", title:"European Commitments sichern", gate:"G3", priority:"CRITICAL"},
  {id:"DC-E7", gap:"E7", title:"TRA2028 Handover sichern", gate:"G3", priority:"HIGH"},
  {id:"DC-E8", gap:"E8", title:"Presidency 2030 engagement klären", gate:"G3", priority:"HIGH"},
  {id:"DC-E9", gap:"E9", title:"Industry Advisory Board aufsetzen", gate:"G6", priority:"HIGH"},
  {id:"DC-E10",gap:"E10",title:"Scientific architecture festlegen", gate:"G2", priority:"HIGH"},
  {id:"DC-E11",gap:"E11",title:"Urban mobility / Munich demos klären", gate:"G7", priority:"HIGH"},
  {id:"DC-E12",gap:"E12",title:"Mobility partners sichern", gate:"G7", priority:"MEDIUM/HIGH"},
  {id:"DC-E13",gap:"E13",title:"Security / accessibility klären", gate:"G7", priority:"HIGH"},
  {id:"DC-E14",gap:"E14",title:"CSA budget reallocation entscheiden", gate:"G0", priority:"CRITICAL"},
  {id:"DC-E15",gap:"E15",title:"Event Delivery financing sichern", gate:"G0", priority:"CRITICAL"},
  {id:"DC-E16",gap:"E16",title:"Procurement packages festlegen", gate:"G4", priority:"HIGH"},
  {id:"DC-E17",gap:"E17",title:"Impact KPIs / baselines festlegen", gate:"G10", priority:"HIGH"}
];

function decisionCandidates(){
  const rows=DECISION_CANDIDATES.map(d=>`
    <article class="decision-candidate-card" onclick="window.traceSelect('${d.gap}')">
      <div class="decision-card-top">
        <div><b>${d.id}</b><span>${d.title}</span></div>
        <button type="button" class="mini-trace" onclick="event.stopPropagation();window.traceSelect('${d.gap}')">GO TO TRACE →</button>
      </div>
      <div class="action-meta">
        <span>TYPE <b>DECISION CANDIDATE</b></span>
        <span>GAP <b>${d.gap}</b></span>
        <span>TARGET GATE <b>${d.gate}</b></span>
        <span>PRIORITY <b>${d.priority}</b></span>
      </div>
      <div class="candidate-foot">NOT AN ACTUAL DECISION · NETWORK_DERIVED</div>
    </article>`).join("");
  return `<div class="view-head">
    <div><div class="eyebrow">DECISION CONTROL · V2.5.1</div><h1>Decision Candidates</h1></div>
    <div class="legend">Derived decision needs from the documented Gap Register.</div>
  </div>
  <section class="panel action-summary">
    <div class="summary-cell"><b>0</b><span>actual decisions</span></div>
    <div class="summary-cell"><b>${DECISION_CANDIDATES.length}</b><span>decision candidates</span></div>
    <div class="summary-cell"><b>${DECISION_CANDIDATES.filter(x=>x.priority==="CRITICAL").length}</b><span>critical candidates</span></div>
  </section>
  <section class="panel">
    <div class="panel-title"><h2>Gap → Decision Candidate → Gate</h2><span>derived control layer</span></div>
    <div class="note"><b>Important:</b> These are decision needs derived from documented gaps. They are not recorded decisions and do not change project status.</div>
  </section>
  <section class="decision-control-grid">${rows}</section>`;
}






/* V3.0 MASTER CONTROL MATRIX — unified control view */
function masterMatrix(){
 const A=DATA.actions||[], G=DATA.gaps||[], GT=DATA.gates||[], M=DATA.milestones||[];
 const C=typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[];
 const GI=typeof GATE_IMPACT_DERIVED!=="undefined"?GATE_IMPACT_DERIVED:{};
 const IM=typeof IMPACT_DERIVED!=="undefined"?IMPACT_DERIVED:{};
 const GM={G0:["M1"],G1:["M2","M3"],G2:["M7","M8"],G3:["M5","M6"],G4:["M9","M13"],G5:["M10"],G6:["M11"],G7:["M12","M13"],G8:["M13"],G9:["M14"],G10:["M15","M16"]};
 const gateForAction=id=>Object.entries((typeof TRACE_DERIVED!=="undefined"?TRACE_DERIVED.gateInputs:{})).filter(([g,ids])=>(ids||[]).includes(id)).map(([g])=>g);
 const gapForAction=id=>Object.entries(IM).filter(([g,x])=>(x.actions||[]).includes(id)).map(([g])=>g);
 const decisionsForGap=gap=>C.filter(c=>c.gap===gap||c.source_gap===gap||c.id==="DC-"+gap).map(c=>c.id);
 const mileForGates=gs=>[...new Set((gs||[]).flatMap(g=>GM[g]||[]))];
 const rows=[];
 // TRUE MASTER: one row per underlying control unit, preserving type identity.
 A.forEach(a=>{
   const gs=gateForAction(a.id), gaps=gapForAction(a.id), ds=[...new Set(gaps.flatMap(decisionsForGap))], ms=mileForGates(gs);
   rows.push({id:a.id,type:"ACTION",status:a.status||"TBC",exposure:a.exposure||"NORMAL",gap:gaps.join(" · ")||"—",decision:ds.join(" · ")||"—",action:a.id,gate:gs.join(" · ")||a.gate||"TBC",mile:ms.join(" · ")||a.milestone||"TBC",cp:"CANDIDATE"});
 });
 G.forEach(g=>{
   const im=IM[g.id]||{}, gs=(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED[g.id]:[])||[];
   const ds=decisionsForGap(g.id), ms=mileForGates(gs);
   rows.push({id:g.id,type:"GAP",status:g.status||"OPEN",exposure:gs.join(" · ")||"NORMAL",gap:g.id,decision:ds.join(" · ")||"—",action:(im.actions||[]).join(" · ")||"—",gate:gs.join(" · ")||"TBC",mile:ms.join(" · ")||"TBC",cp:"CANDIDATE"});
 });
 C.forEach(c=>{
   const gap=c.gap||c.source_gap||c.id.replace("DC-","");
   const im=IM[gap]||{}, gs=(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED[gap]:[])||[];
   rows.push({id:c.id,type:"DECISION",status:"CANDIDATE",exposure:gs.join(" · ")||"NORMAL",gap:gap,decision:c.id,action:(im.actions||[]).join(" · ")||"—",gate:gs.join(" · ")||c.target_gate||"TBC",mile:mileForGates(gs).join(" · ")||"TBC",cp:"CANDIDATE"});
 });
 GT.forEach(g=>{
   const x=GI[g.id]||{}, ms=x.milestones||GM[g.id]||[];
   rows.push({id:g.id,type:"GATE",status:g.status||"OPEN",exposure:g.exposure||"NORMAL",gap:(x.gaps||[]).join(" · ")||"—",decision:(x.decisions||[]).join(" · ")||"—",action:(x.actions||[]).join(" · ")||"—",gate:g.id,mile:ms.join(" · ")||"TBC",cp:"CANDIDATE"});
 });
 M.forEach(m=>{
   const gs=Object.entries(GM).filter(([,ms])=>ms.includes(m.id)).map(([g])=>g);
   rows.push({id:m.id,type:"MILESTONE",status:m.status||"OPEN",exposure:m.exposure||"NORMAL",gap:"—",decision:"—",action:"—",gate:gs.join(" · ")||"TBC",mile:m.id,cp:"CANDIDATE"});
 });

 const q=(window.TRA_MATRIX_QUERY||"").trim().toLowerCase(), f=window.TRA_MATRIX_FILTER||"ALL";
 const filtered=rows.filter(r=>(f==="ALL"||r.type===f)&&(!q||[r.id,r.type,r.status,r.exposure,r.gap,r.decision,r.action,r.gate,r.mile].join(" ").toLowerCase().includes(q)));
 const counts=rows.reduce((o,r)=>(o[r.type]=(o[r.type]||0)+1,o),{});
 const expected=A.length+G.length+C.length+GT.length+M.length;
 return `<div class="view-head"><div><div class="eyebrow">MASTER DATA VIEW · V3.1.1</div><h1>True Master Matrix</h1></div><div class="legend">ONE ROW PER CONTROL UNIT · ${rows.length}/${expected}</div></div>
 <section class="cards matrix-kpis">
  <div class="metric"><label>MASTER ROWS</label><b>${rows.length}</b><span>unique control units</span></div>
  <div class="metric"><label>ACTIONS</label><b>${counts.ACTION||0}</b><span>operative units</span></div>
  <div class="metric"><label>GAPS / DECISIONS</label><b>${(counts.GAP||0)+(counts.DECISION||0)}</b><span>control units</span></div>
  <div class="metric"><label>GATES / MILESTONES</label><b>${(counts.GATE||0)+(counts.MILESTONE||0)}</b><span>control anchors</span></div>
 </section>
 <section class="panel matrix-panel">
  <div class="panel-title"><h2>True master matrix</h2><span>one unique row per underlying unit</span></div>
  <div class="matrix-tools">
   <input id="matrixSearch" type="search" placeholder="Search ID, gap, action, gate, milestone…" value="${window.TRA_MATRIX_QUERY||""}" oninput="window.matrixSearch(this.value)">
   <div class="matrix-filters">${["ALL","ACTION","GAP","DECISION","GATE","MILESTONE"].map(x=>`<button type="button" class="${f===x?"active":""}" onclick="window.matrixFilter('${x}')">${x}</button>`).join("")}</div>
  </div>
  <div class="matrix-wrap"><table class="master-matrix"><thead><tr><th>ID</th><th>TYPE</th><th>STATUS</th><th>EXPOSURE</th><th>GAP</th><th>DECISION</th><th>ACTION</th><th>GATE</th><th>MILESTONE</th><th>CP</th></tr></thead>
  <tbody>${filtered.map(r=>`<tr><td><button class="matrix-id" onclick="window.traceSelect('${r.id}')">${r.id}</button></td><td>${r.type}</td><td><span class="matrix-status">${r.status}</span></td><td>${r.exposure}</td><td>${r.gap}</td><td>${r.decision}</td><td>${r.action}</td><td>${r.gate}</td><td>${r.mile}</td><td><span class="cp-tag">${r.cp}</span></td></tr>`).join("")}</tbody></table></div>
  <div class="matrix-note"><b>TRUE MASTER PRINCIPLE:</b> Every underlying control unit occurs exactly once. Relationships are attributes of that unit, not additional rows. Network-derived mappings remain distinguishable from source-defined fields. “CP CANDIDATE” is not a calculated CPM result.</div>
 </section>
 <section class="panel">
  <div class="panel-title"><h2>Integrity check</h2><span>automatic</span></div>
  <div class="matrix-integrity"><b>${rows.length===expected?"✓ UNIQUE ROW COUNT OK":"⚠ ROW COUNT MISMATCH"}</b><span>${rows.length} generated = ${A.length} actions + ${G.length} gaps + ${C.length} decisions + ${GT.length} gates + ${M.length} milestones</span></div>
 </section>`;
}

/* V2.9 GATE IMPACT ENGINE — gate readiness view, derived links explicitly marked */
const GATE_IMPACT_DERIVED = {
 G0:{actions:["A1.15"],gaps:["E1","E14","E15"],decisions:["DC-E1","DC-E14","DC-E15"],milestones:["M1","M3","M4"]},
 G1:{actions:["A1.11","A1.12","A6.01","A6.02"],gaps:["E2","E3","E4"],decisions:["DC-E2","DC-E3","DC-E4"],milestones:["M2","M3","M9"]},
 G2:{actions:["A2.05","A2.14","A3.01","A3.04","A3.09"],gaps:["E10"],decisions:["DC-E10"],milestones:["M7","M8"]},
 G3:{actions:["A4.01","A4.04","A4.08","A4.10"],gaps:["E6","E7","E8"],decisions:["DC-E6","DC-E7","DC-E8"],milestones:["M5","M6"]},
 G4:{actions:["A6.15","A6.16"],gaps:["E5","E16"],decisions:["DC-E5","DC-E16"],milestones:["M9","M13"]},
 G5:{actions:["A6.04","A6.05","A6.06","A6.07"],gaps:[],decisions:[],milestones:["M10"]},
 G6:{actions:["A5.11","A5.12","ED5.10"],gaps:["E9","E11"],decisions:["DC-E9","DC-E11"],milestones:["M11"]},
 G7:{actions:["ED6.08","ED8.06","ED1.08"],gaps:["E11","E12","E13"],decisions:["DC-E11","DC-E12","DC-E13"],milestones:["M12","M13"]},
 G8:{actions:["A6.17"],gaps:[],decisions:[],milestones:["M13"]},
 G9:{actions:[],gaps:[],decisions:[],milestones:["M14"]},
 G10:{actions:["A7.12"],gaps:["E17"],decisions:["DC-E17"],milestones:["M15","M16"]}
};
function gateImpact(id){
 const g=(DATA.gates||[]).find(x=>x.id===id)||{};
 const m=GATE_IMPACT_DERIVED[id]||{actions:[],gaps:[],decisions:[],milestones:[]};
 const actions=(DATA.actions||[]).filter(a=>m.actions.includes(a.id));
 const gaps=(DATA.gaps||[]).filter(x=>m.gaps.includes(x.id));
 const decisions=(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]).filter(x=>m.decisions.includes(x.id));
 const blocked=actions.filter(a=>a.status==="BLOCKED");
 const open=actions.filter(a=>a.status==="OPEN");
 return {g,m,actions,gaps,decisions,blocked,open};
}
function gateImpactPanel(id){
 const x=gateImpact(id);
 return `<div class="gate-impact-panel">
  <div class="panel-title"><h2>Gate Impact · ${id}</h2><span>NETWORK_DERIVED</span></div>
  <div class="gate-impact-head"><b>${id}</b><span>${x.g.title||traceTitle(id)}</span><em>${x.blocked.length?x.blocked.length+" blocked":x.open.length+" open actions"}</em></div>
  <div class="gate-impact-cols">
   <div><small>ACTIONS</small>${x.actions.map(a=>`<button onclick="window.traceSelect('${a.id}')"><b>${a.id}</b><span>${a.title||""}</span><em>${a.status||"TBC"}</em></button>`).join("")||"<i>No mapped actions</i>"}</div>
   <div><small>OPEN GAPS / DECISIONS</small>${x.gaps.map(g=>`<button onclick="window.traceSelect('${g.id}')"><b>${g.id}</b><span>${g.title||""}</span></button>`).join("")}${x.decisions.map(d=>`<button onclick="window.traceSelect('${d.id}')"><b>${d.id}</b><span>${d.title||""}</span></button>`).join("")||""}</div>
   <div><small>MILESTONES</small>${x.m.milestones.map(m=>`<button onclick="window.traceSelect('${m}')"><b>${m}</b><span>${traceTitle(m)}</span></button>`).join("")}</div>
  </div>
  <div class="gate-impact-note"><b>READINESS LOGIC:</b> mapped open/blocked actions and documented gaps are shown as control inputs. This view does not assert that the source itself defines these relationships.</div>
 </div>`;
}
function showGateImpact(id){
 const el=document.getElementById("gateImpactDetail");
 if(el) el.innerHTML=gateImpactPanel(id);
}

/* V2.8 EXPOSURE ENGINE — actual status stays untouched; exposure is computed */
function exposureForAction(id){
  const deps=DATA.dependencies||[];
  const gates=DATA.gates||[], milestones=DATA.milestones||[], gaps=DATA.gaps||[];
  const directGates=[];
  Object.entries((typeof TRACE_DERIVED!=="undefined"?TRACE_DERIVED.gateInputs:{})).forEach(([g,ids])=>{
    if((ids||[]).includes(id)) directGates.push(g);
  });
  const directMilestones=[];
  const gateToMilestone={G0:["M1"],G1:["M2"],G2:["M7","M8"],G3:["M5","M6"],G4:["M9","M13"],G5:["M10"],G6:["M11"],G7:["M12","M13"],G8:["M13"],G9:["M14"],G10:["M15","M16"]};
  directGates.forEach(g=>(gateToMilestone[g]||[]).forEach(m=>directMilestones.push(m)));

  // Traverse explicit dependencies forward where available.
  const seen=new Set([id]), queue=[id], downstream=[];
  while(queue.length){
    const cur=queue.shift();
    deps.forEach(d=>{
      const from=d.from||d.predecessor||d.source, to=d.to||d.successor||d.target;
      if(from===cur && to && !seen.has(to)){seen.add(to);queue.push(to);downstream.push(to);}
    });
  }
  const exposedGates=new Set(directGates);
  const exposedMilestones=new Set(directMilestones);
  downstream.forEach(n=>{
    directGates.concat().forEach(g=>{});
    Object.entries((typeof TRACE_DERIVED!=="undefined"?TRACE_DERIVED.gateInputs:{})).forEach(([g,ids])=>{
      if((ids||[]).includes(n)) exposedGates.add(g);
    });
  });
  exposedGates.forEach(g=>(gateToMilestone[g]||[]).forEach(m=>exposedMilestones.add(m)));

  const exposedGaps=new Set();
  gaps.forEach(g=>{
    const map=typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED[g.id]:[];
    if((map||[]).some(x=>exposedGates.has(x))) exposedGaps.add(g.id);
    const im=typeof IMPACT_DERIVED!=="undefined"?IMPACT_DERIVED[g.id]:null;
    if(im && (im.actions||[]).some(a=>a===id || downstream.includes(a))) exposedGaps.add(g.id);
  });
  return {downstream, gates:[...exposedGates], milestones:[...exposedMilestones], gaps:[...exposedGaps]};
}
function exposurePanel(id){
  const a=(DATA.actions||[]).find(x=>x.id===id);
  if(!a) return `<div class="panel"><b>${id}</b><p>No action found.</p></div>`;
  const ex=exposureForAction(id);
  return `<div class="exposure-panel">
    <div class="panel-title"><h2>Network Exposure · ${id}</h2><span>COMPUTED · status unchanged</span></div>
    <div class="exposure-banner"><b>${a.status||"TBC"}</b><span>Actual action status is not modified by exposure calculation.</span></div>
    <div class="exposure-cols">
      <div><small>EXPOSED GAPS</small>${ex.gaps.map(x=>`<button onclick="window.traceSelect('${x}')"><b>${x}</b><span>${traceTitle(x)}</span></button>`).join("")||"<em>None mapped</em>"}</div>
      <div><small>EXPOSED GATES</small>${ex.gates.map(x=>`<button onclick="window.traceSelect('${x}')"><b>${x}</b><span>${traceTitle(x)}</span></button>`).join("")||"<em>None</em>"}</div>
      <div><small>EXPOSED MILESTONES</small>${ex.milestones.map(x=>`<button onclick="window.traceSelect('${x}')"><b>${x}</b><span>${traceTitle(x)}</span></button>`).join("")||"<em>None</em>"}</div>
    </div>
  </div>`;
}
function showActionExposure(id){
  const el=document.getElementById("actionExposureDetail");
  if(el) el.innerHTML=exposurePanel(id);
}

/* V2.7 CONTROL IMPACT ENGINE — Gap → Decision → Action → Gate → Milestone → Exposure */
const IMPACT_DERIVED = {
  E1:{decisions:["DC-E1"],actions:["A1.01","A1.02","A1.03","A1.04","A1.10"],gates:["G0"],milestones:["M1","M3","M4"]},
  E2:{decisions:["DC-E2"],actions:["A1.11","A1.12","A6.01","A6.02"],gates:["G1"],milestones:["M2","M3"]},
  E3:{decisions:["DC-E3"],actions:["A6.01","A6.02","ED1.01","ED1.02","ED1.03"],gates:["G1"],milestones:["M2","M9"]},
  E4:{decisions:["DC-E4"],actions:["A1.12","A1.13","A1.14"],gates:["G1","G0"],milestones:["M1","M3","M9"]},
  E5:{decisions:["DC-E5"],actions:["A6.15","A6.16","ED2.01","ED2.07"],gates:["G4"],milestones:["M9","M13"]},
  E6:{decisions:["DC-E6"],actions:["A4.01","A4.02","A4.03","A4.04","A4.06"],gates:["G3"],milestones:["M5","M6"]},
  E7:{decisions:["DC-E7"],actions:["A4.08","A4.09"],gates:["G3"],milestones:["M5","M6","M15"]},
  E8:{decisions:["DC-E8"],actions:["A4.10"],gates:["G3"],milestones:["M6","M14"]},
  E9:{decisions:["DC-E9"],actions:["A5.01","A5.02","A5.11"],gates:["G6"],milestones:["M7","M11"]},
  E10:{decisions:["DC-E10"],actions:["A2.04","A2.05","A2.06","A3.01"],gates:["G2"],milestones:["M7","M8"]},
  E11:{decisions:["DC-E11"],actions:["A5.07","A5.08","ED5.04","ED5.05"],gates:["G6","G7"],milestones:["M11","M12"]},
  E12:{decisions:["DC-E12"],actions:["ED8.01","ED8.02","ED8.05"],gates:["G7"],milestones:["M12","M13"]},
  E13:{decisions:["DC-E13"],actions:["ED6.01","ED6.02","ED6.03","ED6.04","ED6.05","ED6.08"],gates:["G7"],milestones:["M12","M13"]},
  E14:{decisions:["DC-E14"],actions:["A1.12","A1.13","A1.14"],gates:["G0"],milestones:["M1","M3"]},
  E15:{decisions:["DC-E15"],actions:["A1.14"],gates:["G0"],milestones:["M9","M13","M14"]},
  E16:{decisions:["DC-E16"],actions:["A6.15","A6.16"],gates:["G4"],milestones:["M9","M13"]},
  E17:{decisions:["DC-E17"],actions:["A7.07","A7.08","A7.09","A7.10"],gates:["G10"],milestones:["M15","M16"]}
};
function impactMeta(id){
  const x=IMPACT_DERIVED[id];
  if(x) return x;
  const a=(DATA.actions||[]).find(z=>z.id===id);
  if(a) return {decisions:[],actions:[id],gates:[],milestones:[]};
  return {decisions:[],actions:[],gates:[],milestones:[]};
}
function impactNodes(ids,kind){
  return (ids||[]).map(id=>{
    let title=traceTitle(id);
    if(kind==="decision"){
      const c=(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]).find(z=>z.id===id);
      title=c?c.title:title;
    }
    return `<button class="impact-node ${kind}" onclick="window.traceSelect('${id}')"><b>${id}</b><span>${title}</span></button>`;
  }).join("");
}
function controlImpact(id){
  const m=impactMeta(id), gap=(DATA.gaps||[]).find(x=>x.id===id);
  if(!gap) return `<div class="panel"><b>${id}</b><p>No impact map available.</p></div>`;
  return `<section class="panel impact-detail">
    <div class="panel-title"><h2>Impact Chain · ${id}</h2><span>NETWORK_DERIVED</span></div>
    <div class="impact-origin"><b>${id}</b><span>${gap.title||gap.description||"Gap"}</span><em>${gap.priority||"TBC"}</em></div>
    <div class="impact-chain">
      <div><small>DECISION CANDIDATE</small>${impactNodes(m.decisions,"decision")||"<span class='empty'>—</span>"}</div>
      <i>→</i>
      <div><small>ACTIONS</small>${impactNodes(m.actions,"action")||"<span class='empty'>—</span>"}</div>
      <i>→</i>
      <div><small>GATES</small>${impactNodes(m.gates,"gate")||"<span class='empty'>—</span>"}</div>
      <i>→</i>
      <div><small>MILESTONES</small>${impactNodes(m.milestones,"milestone")||"<span class='empty'>—</span>"}</div>
    </div>
    <div class="impact-exposure"><b>EXPOSURE</b><span>Downstream network exposure is derived from the mapped gates and milestones. It does not change actual status.</span><button onclick="window.traceSelect('${id}')">OPEN FULL TRACE →</button></div>
  </section>`;
}

/* V2.6 MASTER CONTROL — integrated overview */
function masterControl(){
  const actions=DATA.actions||[], gaps=DATA.gaps||[], gates=DATA.gates||[], milestones=DATA.milestones||[];
  const candidates=typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[];
  const exposed=actions.filter(x=>x.network_exposed).length;
  const blocked=actions.filter(x=>x.status==="BLOCKED").length;
  const open=actions.filter(x=>x.status==="OPEN").length;
  const criticalGaps=gaps.filter(x=>String(x.priority||"").toUpperCase()==="CRITICAL").length;
  const nextGate=(gates.find(x=>x.id==="G0")||gates[0]||{id:"G0",title:"Consortium Ready"});
  const nextM=(milestones.find(x=>x.id==="M1")||milestones[0]||{id:"M1",title:"Consortium / roles confirmed",period:"Q4/2026–Q2/2027"});

  return `<div class="view-head">
    <div><div class="eyebrow">EXECUTIVE CONTROL · V3.5</div><h1>Master Control Board</h1></div>
    <div class="legend">Integrated view · source data + explicit network-derived control logic</div>
  </div>

  <section class="cards control-kpis">
    <div class="metric"><label>OPEN ACTIONS</label><b>${open}</b><span>${actions.length} operative units</span></div>
    <div class="metric"><label>NETWORK EXPOSED</label><b>${exposed}</b><span>computed exposure</span></div>
    <div class="metric"><label>CRITICAL GAPS</label><b>${criticalGaps}</b><span>of ${gaps.length} documented gaps</span></div>
    <div class="metric"><label>DECISION CANDIDATES</label><b>${candidates.length}</b><span>actual decisions: ${decisionRecords().length}</span></div>
  </section>

  <section class="grid2">
    <div class="panel control-focus-card">
      <div class="panel-title"><h2>Immediate control focus</h2><span>baseline 18.09.2026</span></div>
      <div class="focus-row">
        <div class="focus-icon gate">G</div>
        <div><small>NEXT READINESS GATE</small><b>${nextGate.id} · ${nextGate.title}</b><span>Open TRACE</span></div>
        <button onclick="window.traceSelect('${nextGate.id}')">TRACE →</button>
      </div>
      <div class="focus-row">
        <div class="focus-icon mile">M</div>
        <div><small>NEXT MASTER MILESTONE</small><b>${nextM.id} · ${nextM.title}</b><span>${nextM.period||"TBC"}</span></div>
        <button onclick="window.traceSelect('${nextM.id}')">TRACE →</button>
      </div>
      <div class="focus-row">
        <div class="focus-icon gap">!</div>
        <div><small>CRITICAL GAPS</small><b>${criticalGaps} require control attention</b><span>Open Risk Control</span></div>
        <button onclick="render('RISK CONTROL')">OPEN →</button>
      </div>
    </div>

    <div class="panel control-chain-card">
      <div class="panel-title"><h2>Control chain</h2><span>integrated</span></div>
      <div class="master-chain">
        <button onclick="render('RISK CONTROL')"><b>GAP / RISK</b><span>${gaps.length} records</span></button>
        <i>→</i>
        <button onclick="render('DECISION CONTROL')"><b>DECISION</b><span>${candidates.length} candidates</span></button>
        <i>→</i>
        <button onclick="render('ACTION CONTROL')"><b>ACTION</b><span>${actions.length} units</span></button>
        <i>→</i>
        <button onclick="render('GATES')"><b>GATE</b><span>${gates.length} gates</span></button>
        <i>→</i>
        <button onclick="render('GANTT')"><b>MILESTONE</b><span>${milestones.length} milestones</span></button>
      </div>
    </div>
  </section>

  <section class="grid2">
    <div class="panel">
      <div class="panel-title"><h2>Attention</h2><span>control signals</span></div>
      <div class="attention-list">
        <button onclick="render('RISK CONTROL')"><b>GAPS</b><span>${gaps.length} documented · ${criticalGaps} critical</span><em>OPEN →</em></button>
        <button onclick="render('ACTION CONTROL')"><b>BLOCKED ACTIONS</b><span>${blocked} currently blocked in dataset</span><em>OPEN →</em></button>
        <button onclick="render('DECISION CONTROL')"><b>DECISION NEEDS</b><span>${candidates.length} candidates · 0 actual decisions</span><em>OPEN →</em></button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-title"><h2>Network convergence</h2><span>critical integration</span></div>
      <div class="convergence">
        ${["G2","G4","G5","G6","G7"].map(id=>`<button onclick="window.traceSelect('${id}')"><b>${id}</b><span>${traceTitle(id)}</span></button>`).join("")}
        <b class="conv-arrow">→</b>
        <button class="hub" onclick="window.traceSelect('G8')"><b>G8</b><span>Full Rehearsal</span></button>
        <b class="conv-arrow">→</b>
        <button onclick="window.traceSelect('G9')"><b>G9</b><span>Event Ready</span></button>
      </div>
      <div class="note">G8 is the central integrated convergence point in the network-derived control model.</div>
    </div>
  </section>

  <section class="panel">
    <div class="panel-title"><h2>Gate impact</h2><span>select a readiness gate</span></div>
    <div class="gate-select-grid">
      ${["G0","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10"].map(id=>`<button type="button" class="gate-impact-select" data-gate-id="${id}"><b>${id}</b><span>${traceTitle(id)}</span></button>`).join("")}
    </div>
    <div id="gateImpactDetail">${gateImpactPanel("G4")}</div>
  </section>

  <section class="panel">
    <div class="panel-title"><h2>Network exposure</h2><span>select an action</span></div>
    <div class="exposure-select-grid">
      ${["A1.15","A6.01","A6.15","A6.17","A7.12"].map(id=>{
        const a=(DATA.actions||[]).find(x=>x.id===id)||{};
        return `<button type="button" class="exposure-select" data-exposure-id="${id}"><b>${id}</b><span>${a.title||"Action"}</span><em>${a.status||"TBC"}</em></button>`;
      }).join("")}
    </div>
    <div id="actionExposureDetail">${exposurePanel("A6.15")}</div>
  </section>

  <section class="panel">
    <div class="panel-title"><h2>Impact chain</h2><span>select a critical gap</span></div>
    <div class="impact-grid">
      ${["E1","E2","E3","E4","E6","E10","E13","E14","E15"].map(id=>{
        const g=(DATA.gaps||[]).find(x=>x.id===id)||{};
        return `<button type="button" class="impact-select" data-impact-id="${id}"><b>${id}</b><span>${g.title||"Gap"}</span><em>${g.priority||"TBC"}</em></button>`;
      }).join("")}
    </div>
    <div id="impactDetail">${controlImpact("E3")}</div>
  </section>

  <section class="panel">
    <div class="panel-title"><h2>Cost control</h2><span>confidential figures protected</span></div>
    <div class="cost-strip">
      <div><b>CSA</b><span>€1.60m target / €1.64m working</span></div>
      <div><b>EVENT DELIVERY</b><span>€6.00m planning framework</span></div>
      <button onclick="render('COSTS 🔒')">OPEN PROTECTED LAYER →</button>
    </div>
    <div class="note">Budget figures above are source-level planning values; no silent reconciliation is applied.</div>
  </section>`;
}


function showImpact(id){
  const el=document.getElementById("impactDetail");
  if(el) el.innerHTML=controlImpact(id);
}

window.showImpact = showImpact;
window.showGateImpact = showGateImpact;

if(!window.TRA_EXPOSURE_HANDLER){
  document.addEventListener("click",function(e){
    const el=e.target.closest && e.target.closest(".exposure-select");
    if(!el) return;
    e.preventDefault();
    e.stopPropagation();
    const id=el.getAttribute("data-exposure-id");
    if(id) showActionExposure(id);
  });
  window.TRA_EXPOSURE_HANDLER=true;

if(!window.TRA_GATE_IMPACT_HANDLER){
 document.addEventListener("click",function(e){
  const el=e.target.closest && e.target.closest(".gate-impact-select");
  if(!el) return;
  e.preventDefault(); e.stopPropagation();
  const id=el.getAttribute("data-gate-id");
  if(id) showGateImpact(id);
 });
 window.TRA_GATE_IMPACT_HANDLER=true;
}

}


/* V2.7.2: delegated click handler — survives dynamic re-rendering and Safari file:// caching quirks */
if(!window.TRA_IMPACT_HANDLER){
  document.addEventListener("click",function(e){
    const el=e.target.closest && e.target.closest(".impact-select");
    if(!el) return;
    e.preventDefault();
    e.stopPropagation();
    const id=el.getAttribute("data-impact-id");
    if(id) showImpact(id);
  });
  window.TRA_IMPACT_HANDLER=true;
}


function decisionControl(){
  const decisions=decisionRecords();
  const rows=decisions.slice(0,40).map(d=>{
    const id=d.id||"DECISION";
    const title=d.title||d.name||d.description||"";
    const links=decisionActionLinks(id);
    return `<article class="decision-control-card" onclick="window.traceSelect('${id}')">
      <div class="decision-card-top">
        <div><b>${id}</b><span>${title}</span></div>
        <button type="button" class="mini-trace" onclick="event.stopPropagation();window.traceSelect('${id}')">GO TO TRACE →</button>
      </div>
      <div class="action-meta">
        <span>STATUS <b>${d.status||"OPEN"}</b></span>
        <span>OWNER <b>${d.owner||"TBC"}</b></span>
        <span>IMPACT <b>${d.impact||"TBC"}</b></span>
      </div>
      <div class="decision-links">
        <span>ACTION / DOWNSTREAM</span>
        ${links.length?links.map(x=>`<button type="button" class="gate-link-chip" onclick="event.stopPropagation();window.traceSelect('${x}')"><b>${x}</b> ${traceTitle(x)} ↗</button>`):'<span class="muted">No registered downstream relationship</span>'}
      </div>
    </article>`;
  }).join("");
  return `<div class="view-head">
    <div><div class="eyebrow">DECISION CONTROL · V2.5</div><h1>Decisions & Trace</h1></div>
    <div class="legend">Decision relationships are shown only when explicitly registered.</div>
  </div>
  <section class="panel action-summary">
    <div class="summary-cell"><b>${decisions.length}</b><span>decision records loaded</span></div>
    <div class="summary-cell"><b>${decisions.filter(d=>(d.status||"OPEN")==="OPEN").length}</b><span>OPEN</span></div>
    <div class="summary-cell"><b>${decisions.filter(d=>decisionActionLinks(d.id).length).length}</b><span>with downstream link</span></div>
  </section>
  <section class="panel">
    <div class="panel-title"><h2>Decision → Action → Gate → Milestone</h2><span>source-safe control chain</span></div>
    <div class="rd-steps">
      <div><b>DECISION</b><span>Governance decision</span></div><i>→</i>
      <div><b>ACTION</b><span>Operative unit</span></div><i>→</i>
      <div><b>GATE</b><span>Readiness</span></div><i>→</i>
      <div><b>MILESTONE</b><span>Result</span></div>
    </div>
    <div class="note"><b>Rule:</b> absence of a registered relationship is displayed as such; no action, gate or milestone is inferred.</div>
  </section>
  <section class="decision-control-grid">${rows||'<div class="muted">No decision records loaded.</div>'}</section>`;
}

function riskControl(){
  const risks=riskRecords().length ? riskRecords() : (DATA.gaps||[]).map(g=>({id:g.id,title:g.title,status:g.status||"OPEN",priority:g.priority||"TBC",impact:g.priority||"TBC",owner:g.owner||"TBC",_sourceType:"GAP"}));
  const decisions=decisionRecords();
  const riskCount=risks.length;
  const openRisks=risks.filter(r=>(r.status||"OPEN")==="OPEN").length;
  const critical=risks.filter(r=>String(r.impact||"").toUpperCase()==="CRITICAL" || String(r.priority||"").toUpperCase()==="CRITICAL").length;
  const rows=risks.slice(0,40).map(r=>{
    const id=r.id||"RISK";
    const title=r.title||r.name||r.description||"";
    const linked=riskDecisionLinks(id);
    return `<article class="risk-control-card" onclick="window.traceSelect('${id}')">
      <div class="risk-card-top"><div><b>${id}</b><span>${title}</span></div>
        <button type="button" class="mini-trace" onclick="window.traceSelect('${id}')">Trace →</button></div>
      <div class="action-meta"><span>STATUS <b>${r.status||"OPEN"}</b></span><span>IMPACT <b>${r.impact||"TBC"}</b></span><span>OWNER <b>${r.owner||"TBC"}</b></span></div>
      <div class="risk-link-line"><span>REGISTERED LINKS</span>${linked.length?linked.map(x=>`<button type="button" class="gate-link-chip" onclick="window.traceSelect('${x}')"><b>${x}</b> ${traceTitle(x)} ↗</button>`).join(""):'<span class="muted">No registered downstream relationship</span>'}</div>
    </article>`;
  }).join("");
  return `<div class="view-head">
    <div><div class="eyebrow">RISK CONTROL · V2.3</div><h1>Risks & Decision Trace</h1></div>
    <div class="legend">Risk severity and network exposure are separate control dimensions.</div>
  </div>
  <section class="panel action-summary">
    <div class="summary-cell"><b>${riskCount}</b><span>risk records loaded</span></div>
    <div class="summary-cell"><b>${openRisks}</b><span>OPEN risk records</span></div>
    <div class="summary-cell"><b>${critical}</b><span>critical-impact records</span></div>
  </section>
  <section class="panel risk-decision-bridge">
    <div class="panel-title"><h2>Risk → Decision → Action</h2><span>registered relationships only</span></div>
    <div class="rd-steps">
      <div><b>RISK</b><span>Identify / assess</span></div><i>→</i>
      <div><b>DECISION</b><span>Resolve / govern</span></div><i>→</i>
      <div><b>ACTION</b><span>Execute</span></div><i>→</i>
      <div><b>GATE</b><span>Readiness</span></div>
    </div>
    <div class="note"><b>Rule:</b> a risk does not create a decision automatically. A decision does not change an action or gate status automatically.</div>
  </section>
  <section class="risk-control-grid">${rows||'<div class="muted">No risk records loaded.</div>'}</section>
  <section class="panel">
    <div class="panel-title"><h2>Decision register</h2><span>${decisions.length} records loaded</span></div>
    <div class="decision-mini-grid">${decisions.slice(0,24).map(d=>{
      const id=d.id||"DECISION", title=d.title||d.name||d.description||"";
      const links=decisionActionLinks(id);
      return `<div class="decision-mini-card"><div><b>${id}</b><span>${title}</span></div>
        <button type="button" class="mini-trace" onclick="window.traceSelect('${id}')">Trace →</button>
        <small>${links.length?links.join(" · "):"No registered action relationship"}</small></div>`;
    }).join("")||'<div class="muted">No decision records loaded.</div>'}</div>
  </section>`;
}

function traceSelect(id){
  window.TRA_TRACE_SELECTED=id;
  render("TRACE");
}
function traceMeta(id){
  const all=[...(DATA.actions||[]),...(DATA.gates||[]),...(DATA.milestones||[]),...(DATA.gaps||[])];
  return all.find(x=>x.id===id)||{id,title:id};
}
function traceTitle(id){
  const n=traceMeta(id);
  return n.title||n.task||n.name||id;
}
function traceType(id){
  const n=traceMeta(id);
  return n.type||(
    id.startsWith("G")?"GATE":id.startsWith("M")?"MILESTONE":
    id.startsWith("A")?"ACTION":id.startsWith("E")?"GAP":"NODE"
  );
}
function traceNode(id, active=false){
  return `<button class="trace-node trace-node-btn ${active?"selected":""}" onclick="window.traceSelect('${id}')">
    <b>${id}</b><small>${traceTitle(id)}</small><em>${traceType(id)}</em><span class="trace-open">OPEN TRACE</span>
  </button>`;
}
const GAP_TRACE_DERIVED = {
  E1:["G0"],
  E2:["G1"],
  E3:["G1"],
  E4:["G1"],
  E5:["G4"],
  E6:["G3"],
  E7:["G3"],
  E8:["G3"],
  E9:["G6"],
  E10:["G2"],
  E11:["G6","G7"],
  E12:["G7"],
  E13:["G7"],
  E14:["G0"],
  E15:["G0"],
  E16:["G4"],
  E17:["G10"]
};

function traceRelations(id){
  const deps=DATA.dependencies||[];
  const up=deps.filter(d=>d.to===id).map(d=>({id:d.from,rel:d.type||"DEPENDENCY",flag:d.source_flag||"NETWORK_DERIVED"}));
  const down=deps.filter(d=>d.from===id).map(d=>({id:d.to,rel:d.type||"DEPENDENCY",flag:d.source_flag||"NETWORK_DERIVED"}));

  // Add only the explicitly defined network-derived control links.
  Object.entries(TRACE_DERIVED.gateInputs).forEach(([g,items])=>{
    if(items.includes(id) && !up.some(x=>x.id===g)) up.push({id:g,rel:"FS",flag:"NETWORK_DERIVED"});
    if(g===id) items.forEach(x=>{if(!up.some(y=>y.id===x)) up.push({id:x,rel:"INPUT",flag:"NETWORK_DERIVED"});});
  });
  Object.entries(TRACE_DERIVED.chain).forEach(([from,to])=>{
    const tos=Array.isArray(to)?to:[to];
    if(from===id) tos.forEach(x=>{if(!down.some(y=>y.id===x)) down.push({id:x,rel:"FS",flag:"NETWORK_DERIVED"});});
    tos.forEach(x=>{if(x===id && !up.some(y=>y.id===from)) up.push({id:from,rel:"FS",flag:"NETWORK_DERIVED"});});
  });
  // G8's complete derived readiness convergence is explicit in the project control architecture.
  if(id==="G8"){
    ["G2","G4","G5","G6","G7","A6.17"].forEach(x=>{if(!up.some(y=>y.id===x))up.push({id:x,rel:"FS",flag:"NETWORK_DERIVED"});});
    ["G9"].forEach(x=>{if(!down.some(y=>y.id===x))down.push({id:x,rel:"FS",flag:"NETWORK_DERIVED"});});
  }
  if(id==="G9" && !down.some(y=>y.id==="M14")) down.push({id:"M14",rel:"FS",flag:"NETWORK_DERIVED"});
  (GAP_TRACE_DERIVED[id]||[]).forEach(g=>{
    if(!down.some(x=>x.id===g)) down.push({id:g,rel:"CONTROL INPUT",flag:"NETWORK_DERIVED"});
  });
  Object.entries(GAP_TRACE_DERIVED).forEach(([gap,gates])=>{
    if(gates.includes(id) && !up.some(x=>x.id===gap)) up.push({id:gap,rel:"GAP INPUT",flag:"NETWORK_DERIVED"});
  });
  return {up,down};
}

function controlContextData(id){
  const n=traceMeta(id);
  const rel=traceRelations(id);
  const gates=[...new Set([...rel.up,...rel.down].map(x=>x.id).filter(x=>/^G\d+$/.test(x)))];
  const miles=[...new Set([...rel.up,...rel.down].map(x=>x.id).filter(x=>/^M\d+$/.test(x)))];
  const gaps=new Set(); const actions=new Set(); const decisions=new Set();
  if(/^E\d+$/.test(id)) gaps.add(id);
  if(/^A/.test(id)) actions.add(id);
  if(/^G\d+$/.test(id)){
    const gi=(typeof GATE_IMPACT_DERIVED!=="undefined"?GATE_IMPACT_DERIVED[id]:{})||{};
    (gi.gaps||[]).forEach(x=>gaps.add(x)); (gi.actions||[]).forEach(x=>actions.add(x)); (gi.decisions||[]).forEach(x=>decisions.add(x));
    (gi.milestones||[]).forEach(x=>miles.push(x));
  }
  if(/^E\d+$/.test(id) && typeof IMPACT_DERIVED!=="undefined"){
    const im=IMPACT_DERIVED[id]||{}; (im.actions||[]).forEach(x=>actions.add(x));
    (GAP_TRACE_DERIVED[id]||[]).forEach(x=>gates.push(x));
    (typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]).filter(x=>x.gap===id||x.source_gap===id).forEach(x=>decisions.add(x.id));
  }
  if(/^A/.test(id) && typeof IMPACT_DERIVED!=="undefined"){
    Object.entries(IMPACT_DERIVED).forEach(([g,x])=>{if((x.actions||[]).includes(id)) gaps.add(g);});
  }
  if(/^DC-E\d+$/.test(id)){
    const gap=id.replace('DC-',''); gaps.add(gap); const c=(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]).find(x=>x.id===id); if(c&&c.target_gate) gates.push(c.target_gate);
  }
  const uniqueG=[...new Set(gates)];
  const uniqueM=[...new Set(miles)];
  const owner=n.owner||n.responsible||"TBC";
  const time=n.period||[n.start,n.end,n.duration].filter(Boolean).join(" · ")||"TBC";
  const status=n.status||(/^E/.test(id)?"OPEN":"TBC");
  const exposure=n.exposure||"NORMAL";
  return {n,rel,gaps:[...gaps],actions:[...actions],decisions:[...decisions],gates:uniqueG,milestones:uniqueM,owner,time,status,exposure};
}
function contextLink(id){ return `<button class="context-link" type="button" onclick="window.traceSelect('${id}')"><b>${id}</b><span>${traceTitle(id)}</span></button>`; }
function traceView(){
  const selected=window.TRA_TRACE_SELECTED||"G8";
  const x=controlContextData(selected);
  const {up,down}=x.rel;
  const selectedTitle=x.n.title||x.n.task||x.n.name||selected;
  const selectedType=traceType(selected);
  const riskState=(DATA.risks&&DATA.risks.length)?"REGISTERED":"TBC / register not populated";
  return `<div class="view-head">
    <div><div class="eyebrow">MASTER CONTROL CONTEXT · V3.2</div><h1>360° Control Context</h1></div>
    <div class="legend">One object · complete project context · NETWORK_DERIVED links remain explicit.</div>
  </div>

  <section class="panel context-hero">
    <div class="trace-head">
      <div><span class="trace-kicker">SELECTED OBJECT · ${selectedType}</span><h2>${selected} · ${selectedTitle}</h2><p>Integrated control context</p></div>
      <div class="trace-badge">${x.status} · ${x.exposure}</div>
    </div>
    <div class="context-kpis">
      <div class="metric"><label>STATUS</label><b>${x.status}</b><span>source/current object state</span></div>
      <div class="metric"><label>EXPOSURE</label><b>${x.exposure}</b><span>network-derived where applicable</span></div>
      <div class="metric"><label>OWNER</label><b>${x.owner}</b><span>no owner invented</span></div>
      <div class="metric"><label>TIME</label><b>${x.time}</b><span>source-supported / TBC</span></div>
    </div>
  </section>

  <section class="context-grid">
    <div class="panel"><div class="panel-title"><h2>TRACE BACK</h2><span>${up.length} links</span></div><div class="context-list">${up.length?up.map(z=>contextLink(z.id)+`<small>${z.rel} · ${z.flag}</small>`).join(""):"<span class='muted'>No registered upstream relationship.</span>"}</div></div>
    <div class="panel"><div class="panel-title"><h2>TRACE FORWARD</h2><span>${down.length} links</span></div><div class="context-list">${down.length?down.map(z=>contextLink(z.id)+`<small>${z.rel} · ${z.flag}</small>`).join(""):"<span class='muted'>No registered downstream relationship.</span>"}</div></div>
  </section>

  <section class="context-grid">
    <div class="panel"><div class="panel-title"><h2>GAPS</h2><span>linked control issues</span></div><div class="context-list">${x.gaps.length?x.gaps.map(contextLink).join(""):"<span class='muted'>None mapped.</span>"}</div></div>
    <div class="panel"><div class="panel-title"><h2>DECISIONS</h2><span>actual / candidate</span></div><div class="context-list">${x.decisions.length?x.decisions.map(contextLink).join(""):"<span class='muted'>None mapped.</span>"}</div></div>
  </section>

  <section class="context-grid">
    <div class="panel"><div class="panel-title"><h2>ACTIONS</h2><span>operative units</span></div><div class="context-list">${x.actions.length?x.actions.map(contextLink).join(""):"<span class='muted'>None mapped.</span>"}</div></div>
    <div class="panel"><div class="panel-title"><h2>GATES / MILESTONES</h2><span>readiness chain</span></div><div class="context-list">${x.gates.map(contextLink).join("")||"<span class='muted'>No gate mapped.</span>"}${x.milestones.map(contextLink).join("")}</div></div>
  </section>

  <section class="panel"><div class="panel-title"><h2>RISK / CAPACITY / CHANGE</h2><span>control completeness</span></div>
    <div class="context-status-row"><div><b>RISKS</b><span>${riskState}</span></div><div><b>CAPACITY</b><span>TBC · no source capacity value</span></div><div><b>CHANGE HISTORY</b><span>Baseline 18.09.2026 · no recorded change layer in V3.2</span></div></div>
    <div class="note"><b>Control rule:</b> Exposure does not change actual status. Decision Candidates are not actual decisions. Schedule impact remains TBC where the source does not provide task-level dates/durations.</div>
  </section>

  <section class="panel"><div class="panel-title"><h2>CONTROL CHAIN</h2><span>STATUS → EXPOSURE → DECISION → ACTION → OWNER → GATE → MILESTONE</span></div>
    <div class="chain"><div class="chain-step"><b>STATUS</b><span>${x.status}</span></div><i>→</i><div class="chain-step"><b>EXPOSURE</b><span>${x.exposure}</span></div><i>→</i><div class="chain-step"><b>DECISION</b><span>${x.decisions.length||"—"}</span></div><i>→</i><div class="chain-step"><b>ACTION</b><span>${x.actions.length||"—"}</span></div><i>→</i><div class="chain-step"><b>OWNER</b><span>${x.owner}</span></div><i>→</i><div class="chain-step"><b>GATE</b><span>${x.gates.join(" · ")||"TBC"}</span></div><i>→</i><div class="chain-step"><b>MILESTONE</b><span>${x.milestones.join(" · ")||"TBC"}</span></div></div>
  </section>`;
}

function rowAction(x){return `<tr data-search="${(x.id+" "+x.task+" "+x.area).toLowerCase()}" data-status="${x.status}"><td><b>${x.id}</b></td><td>${x.area}</td><td>${x.task}</td><td>${x.owner}</td><td>${status(x.status)}</td><td>${x.exposure}</td><td>${signal(x.traffic_light)}</td><td><button class="mini-trace" onclick="traceSelect('${x.id}')">Trace →</button></td></tr>`;}
function filterActions(q){document.querySelectorAll("#action-table tbody tr, #action-table table tr").forEach((r,i)=>{if(i===0)return;r.style.display=(r.dataset.search||"").includes(q.toLowerCase())?"":"none";});}
function filterStatus(q){document.querySelectorAll("#action-table table tr").forEach((r,i)=>{if(i===0)return;r.style.display=(!q||r.dataset.status===q)?"":"none";});}


/* V3.5 CHANGE / WHAT-IF ENGINE — simulation is isolated from master state until APPLY */
function rebuildControlModel(){
  CONTROL_MODEL=TRA.buildControlModel(DATA,{gateInputs:TRACE_DERIVED.gateInputs,chain:TRACE_DERIVED.chain,gapTrace:(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED:{}),decisionCandidates:(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]),milestoneByGate:(typeof GM!=="undefined"?GM:{})});
  DATA.actions=CONTROL_MODEL.actions;
}
function changeUniverse(){
  return [
    ...(DATA.actions||[]).map(x=>({id:x.id,type:"ACTION",title:x.task||x.title||x.id,status:x.status||"TBC"})),
    ...(DATA.gates||[]).map(x=>({id:x.id,type:"GATE",title:x.title||x.id,status:x.status||"OPEN"})),
    ...(DATA.milestones||[]).map(x=>({id:x.id,type:"MILESTONE",title:x.title||x.id,status:x.status||"TBC"}))
  ];
}
function simulatedExposure(id, value){
  const actions=(DATA.actions||[]).map(x=>({...x}));
  const idx=actions.findIndex(x=>x.id===id);
  if(idx>=0) actions[idx].status=value;
  const simData={...DATA,actions};
  const model=TRA.buildControlModel(simData,{gateInputs:TRACE_DERIVED.gateInputs,chain:TRACE_DERIVED.chain,gapTrace:(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED:{}),decisionCandidates:(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]),milestoneByGate:(typeof GM!=="undefined"?GM:{})});
  const ex=(typeof exposureForAction==='function' && idx>=0)?exposureForActionWithData(id,simData):{gates:[],milestones:[],gaps:[],downstream:[]};
  const direct=(TRACE_DERIVED.gateInputs&&Object.entries(TRACE_DERIVED.gateInputs).filter(([g,ids])=>ids.includes(id)).map(([g])=>g))||[];
  const gates=[...new Set([...(ex.gates||[]),...direct])];
  const milestones=[...new Set(ex.milestones||[])];
  return {model,exposure:{gates,milestones,gaps:ex.gaps||[],downstream:ex.downstream||[]}};
}
function exposureForActionWithData(id, d){
  const deps=d.dependencies||[], directGates=[];
  Object.entries(TRACE_DERIVED.gateInputs||{}).forEach(([g,ids])=>{if(ids.includes(id)) directGates.push(g);});
  const gateToMilestone={G0:["M1"],G1:["M2"],G2:["M7","M8"],G3:["M5","M6"],G4:["M9","M13"],G5:["M10"],G6:["M11"],G7:["M12","M13"],G8:["M13"],G9:["M14"],G10:["M15","M16"]};
  const seen=new Set([id]),q=[id],down=[]; while(q.length){const cur=q.shift();deps.forEach(x=>{const f=x.from||x.predecessor||x.source,t=x.to||x.successor||x.target;if(f===cur&&t&&!seen.has(t)){seen.add(t);q.push(t);down.push(t);}})}
  const gs=new Set(directGates),ms=new Set(); down.forEach(n=>Object.entries(TRACE_DERIVED.gateInputs||{}).forEach(([g,ids])=>{if(ids.includes(n))gs.add(g);}));
  gs.forEach(g=>(gateToMilestone[g]||[]).forEach(m=>ms.add(m)));
  const gaps=new Set(); (d.gaps||[]).forEach(g=>{const gm=(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED[g.id]:[])||[]; if(gm.some(x=>gs.has(x)))gaps.add(g.id);});
  return {gates:[...gs],milestones:[...ms],gaps:[...gaps],downstream:down};
}
function simulateChange(){
  const id=document.getElementById("change-object")?.value;
  const value=document.getElementById("change-value")?.value;
  if(!id||!value)return;
  const current=changeUniverse().find(x=>x.id===id);
  if(!current)return;
  const result=simulatedExposure(id,value);
  CHANGE_STATE.simulation={id,type:current.type,title:current.title,field:"STATUS",oldValue:current.status,newValue:value,result};
  render("CHANGE CONTROL");
}
function applyChange(){
  const c=CHANGE_STATE.simulation;if(!c)return;
  const target=[...(DATA.actions||[]),...(DATA.gates||[]),...(DATA.milestones||[])].find(x=>x.id===c.id);
  if(!target)return;
  target.status=c.newValue;
  const rec={id:`CH-${String(CHANGE_STATE.log.length+1).padStart(4,"0")}`,object:c.id,type:c.type,field:c.field,oldValue:c.oldValue,newValue:c.newValue,impact:c.result.exposure,timestamp:new Date().toISOString(),source:"USER_UPDATED"};
  CHANGE_STATE.log.unshift(rec);
  try{localStorage.setItem("TRA2030_CHANGE_LOG",JSON.stringify(CHANGE_STATE.log));}catch(e){}
  CHANGE_STATE.simulation=null;
  rebuildControlModel();
  render("CHANGE CONTROL");
}
function discardChange(){CHANGE_STATE.simulation=null;render("CHANGE CONTROL");}
function loadChangeLog(){try{const x=JSON.parse(localStorage.getItem("TRA2030_CHANGE_LOG")||"[]");if(Array.isArray(x))CHANGE_STATE.log=x;}catch(e){}}
function snapshotState(){
  const model=CONTROL_MODEL||TRA.buildControlModel(DATA,{gateInputs:TRACE_DERIVED.gateInputs,chain:TRACE_DERIVED.chain,decisionCandidates:(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]),gapTrace:(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED:{})});
  return {version:"V3.6.2",createdAt:new Date().toISOString(),counts:model.counts,actions:model.actions||[],gaps:model.gaps||[],gates:model.gates||[],milestones:model.milestones||[],decisionCandidates:model.decisionCandidates||[]};
}
function snapshotLoad(){try{return JSON.parse(localStorage.getItem("TRA2030_SNAPSHOT")||"null")}catch(e){return null}}
function snapshotSave(){localStorage.setItem("TRA2030_SNAPSHOT",JSON.stringify(snapshotState())); window.SNAPSHOT_REFRESHED_AT=new Date().toISOString();}
function snapshotIndex(st){const m=new Map(); if(!st)return m; [...(st.actions||[]),...(st.gaps||[]),...(st.gates||[]),...(st.milestones||[]),...(st.decisionCandidates||[])].forEach(x=>m.set(x.id,x)); return m;}
function deltaCompute(){
  const old=snapshotLoad(), cur=snapshotState();
  if(!old) return {hasSnapshot:false,items:[],summary:{new:0,changed:0,resolved:0,newExposure:0,removedExposure:0}};
  const a=snapshotIndex(old), b=snapshotIndex(cur), items=[];
  for(const [id,x] of b){const y=a.get(id); if(!y){items.push({type:"NEW",id,title:x.title||x.task||id});continue;} const fields=["status","owner","gate","milestone","period","start","end"]; for(const f of fields){if((x[f]??"")!==(y[f]??"")){items.push({type:"CHANGED",id,title:x.title||x.task||id,field:f,old:y[f]??"TBC",value:x[f]??"TBC"});}}
    const xe=!!x.network_exposed, ye=!!y.network_exposed; if(xe&&!ye)items.push({type:"NEW EXPOSURE",id,title:x.title||x.task||id}); if(!xe&&ye)items.push({type:"REMOVED EXPOSURE",id,title:x.title||x.task||id});
  }
  for(const [id,y] of a){if(!b.has(id))items.push({type:"RESOLVED",id,title:y.title||y.task||id});}
  const summary={new:items.filter(x=>x.type==="NEW").length,changed:items.filter(x=>x.type==="CHANGED").length,resolved:items.filter(x=>x.type==="RESOLVED").length,newExposure:items.filter(x=>x.type==="NEW EXPOSURE").length,removedExposure:items.filter(x=>x.type==="REMOVED EXPOSURE").length};
  return {hasSnapshot:true,items,summary,current:cur,previous:old};
}
function snapshotDelta(){
  const snap=snapshotLoad(), d=deltaCompute(), refreshed=window.SNAPSHOT_REFRESHED_AT||null;
  const rows=d.items.map(x=>`<button class="exec-row" type="button" onclick="window.traceSelect('${x.id}')"><b>${x.type}</b><span>${x.id} · ${x.title}</span><small>${x.field?x.field+": "+x.old+" → "+x.value:""}</small><em>TRACE →</em></button>`).join("") || `<div class="muted">${snap?"No changes since the last snapshot.":"No snapshot exists yet. Create one to start delta tracking."}</div>`;
  return `<div class="view-head"><div><div class="eyebrow">SNAPSHOT / DELTA · V3.6.1</div><h1>Snapshot & Delta</h1></div><div class="legend">LAST SNAPSHOT ↔ CURRENT STATE</div></div>
  <section class="cards control-kpis"><div class="metric"><label>LAST SNAPSHOT</label><b>${snap?new Date(snap.createdAt).toLocaleString("de-DE"):"—"}</b><span>${snap?"stored locally":"not created"}</span></div><div class="metric"><label>NEW</label><b>${d.summary.new}</b><span>since snapshot</span></div><div class="metric"><label>CHANGED</label><b>${d.summary.changed}</b><span>since snapshot</span></div><div class="metric"><label>EXPOSURE DELTA</label><b>${d.summary.newExposure+d.summary.removedExposure}</b><span>${d.summary.newExposure} new · ${d.summary.removedExposure} removed</span></div></section>
  <section class="panel"><div class="panel-title"><h2>SNAPSHOT CONTROL</h2><span>BASELINE PROTECTED</span></div><div class="change-actions"><button class="primary" id="snapshot-save" type="button" onclick="snapshotSave();render('SNAPSHOT / DELTA')">CREATE / UPDATE SNAPSHOT</button><button id="snapshot-refresh" type="button" onclick="window.refreshSnapshotDelta()">REFRESH DELTA</button></div><div class="note">A snapshot is a local comparison point. It does not alter the project baseline or master data.${refreshed?` · Last refresh: ${new Date(refreshed).toLocaleTimeString("de-DE")}`:""}</div></section>
  <section class="panel"><div class="panel-title"><h2>DELTA SINCE LAST SNAPSHOT</h2><span>${d.items.length} changes</span></div><div class="exec-list">${rows}</div></section>`;
}

function changeControl(){
  const uni=changeUniverse(), c=CHANGE_STATE.simulation;
  const options=uni.map(x=>`<option value="${x.id}" ${c&&c.id===x.id?"selected":""}>${x.id} · ${x.title}</option>`).join("");
  const values=["OPEN","IN_PROGRESS","BLOCKED","DONE","DECISION_REQUIRED"];
  const sim=c?`<section class="panel change-result"><div class="panel-title"><h2>WHAT-IF RESULT · NOT SAVED</h2><span>SIMULATION ONLY</span></div><div class="change-summary"><div><small>CHANGED OBJECT</small><b>${c.id}</b><span>${c.title}</span></div><div><small>STATUS</small><b>${c.oldValue} → ${c.newValue}</b><span>No automatic downstream status changes</span></div><div><small>DIRECT GATES</small><b>${c.result.exposure.gates.length}</b><span>${c.result.exposure.gates.join(" · ")||"None"}</span></div><div><small>EXPOSED MILESTONES</small><b>${c.result.exposure.milestones.length}</b><span>${c.result.exposure.milestones.join(" · ")||"None"}</span></div></div><div class="change-links"><div><small>EXPOSED GAPS</small>${c.result.exposure.gaps.map(x=>`<button onclick="window.traceSelect('${x}')">${x} · ${traceTitle(x)} ↗</button>`).join("")||"<em>None</em>"}</div><div><small>DOWNSTREAM</small>${c.result.exposure.downstream.map(x=>`<button onclick="window.traceSelect('${x}')">${x} · ${traceTitle(x)} ↗</button>`).join("")||"<em>None registered</em>"}</div></div><div class="change-actions"><button class="primary" onclick="applyChange()">APPLY CHANGE</button><button onclick="discardChange()">DISCARD</button></div></section>`:"<div class='note'>No active simulation. Select a control object and simulate a change. The master state is not modified until APPLY.</div>";
  const log=CHANGE_STATE.log.slice(0,12).map(x=>`<tr><td><b>${x.id}</b></td><td><button class="mini-trace" onclick="window.traceSelect('${x.object}')">${x.object}</button></td><td>${x.oldValue} → ${x.newValue}</td><td>${x.timestamp.replace("T"," ").replace("Z","")}</td></tr>`).join("")||`<tr><td colspan="4" class="muted">No applied changes.</td></tr>`;
  return `<div class="view-head"><div><div class="eyebrow">CHANGE CONTROL · V3.5</div><h1>What-if / Change Control</h1></div><div class="legend">SIMULATE → REVIEW → APPLY / DISCARD</div></div><section class="panel"><div class="panel-title"><h2>SIMULATE CHANGE</h2><span>MASTER STATE PROTECTED</span></div><div class="change-form"><label>OBJECT<select id="change-object">${options}</select></label><label>NEW STATUS<select id="change-value">${values.map(v=>`<option value="${v}" ${c&&c.newValue===v?"selected":""}>${v}</option>`).join("")}</select></label><button class="primary" onclick="simulateChange()">SIMULATE</button></div><div class="note"><b>Rule:</b> simulation does not modify the master data. Downstream gates and milestones keep their actual status; only network exposure is calculated.</div></section>${sim}<section class="panel"><div class="panel-title"><h2>CHANGE HISTORY</h2><span>${CHANGE_STATE.log.length} applied</span></div><table><tr><th>CHANGE</th><th>OBJECT</th><th>STATUS</th><th>TIMESTAMP</th></tr>${log}</table></section>`;
}

/* V3.7 SYSTEM HEALTH / AUDIT
   Read-only control-center health view. It validates the current derived model,
   checks the snapshot/change layer and exposes the main control counts without
   mutating project data.
*/
function systemHealth(){
  const model=CONTROL_MODEL||TRA.buildControlModel(DATA,{gateInputs:TRACE_DERIVED.gateInputs,chain:TRACE_DERIVED.chain,decisionCandidates:(typeof DECISION_CANDIDATES!=="undefined"?DECISION_CANDIDATES:[]),gapTrace:(typeof GAP_TRACE_DERIVED!=="undefined"?GAP_TRACE_DERIVED:{}),milestoneByGate:(typeof GM!=="undefined"?GM:{})});
  const errors=(model.integrity||[]);
  const core=TRA.coreIntegrity(model);
  const snap=snapshotLoad();
  const delta=deltaCompute();
  const log=CHANGE_STATE.log||[];
  const blocked=(model.actions||[]).filter(x=>x.status==="BLOCKED").length;
  const exposed=(model.actions||[]).filter(x=>x.network_exposed===true).length;
  const health=errors.length===0?"HEALTHY":"ATTENTION";
  const checks=[
    ["DATA STRUCTURE",errors.length===0?"PASS":"CHECK",errors.length===0?"No structural validation errors":"See validation errors below"],
    ["CONTROL MODEL",core.ok?"PASS":"CHECK",`${core.total} control records in derived model`],
    ["DEPENDENCY GRAPH",(model.graph?"PASS":"CHECK"),`${(DATA.dependencies||[]).length} registered dependency links`],
    ["SNAPSHOT",snap?"ACTIVE":"OPEN",snap?`Created ${new Date(snap.createdAt).toLocaleString("de-DE")}`:"No snapshot stored"],
    ["CHANGE LOG",`${log.length}`,"Applied user changes stored locally"],
    ["BASELINE", "PROTECTED", "No automatic baseline mutation by this view"]
  ];
  const rows=checks.map(c=>`<div class="health-check"><b>${c[0]}</b><span class="health-badge ${String(c[1]).toLowerCase()}">${c[1]}</span><em>${c[2]}</em></div>`).join("");
  const errorsHtml=errors.length?`<pre class="health-errors">${errors.join("\n")}</pre>`:`<div class="health-ok">✓ Structural validation passed.</div>`;
  return `<div class="view-head"><div><div class="eyebrow">SYSTEM HEALTH · V3.7</div><h1>System Health & Audit</h1></div><div class="legend">READ-ONLY · ${health}</div></div>
  <section class="cards control-kpis">
    <div class="metric"><label>HEALTH</label><b>${health}</b><span>derived control model</span></div>
    <div class="metric"><label>BLOCKED</label><b>${blocked}</b><span>actual action status</span></div>
    <div class="metric"><label>EXPOSURE</label><b>${exposed}</b><span>network-derived</span></div>
    <div class="metric"><label>DELTA</label><b>${delta.hasSnapshot?delta.items.length:"—"}</b><span>${delta.hasSnapshot?"since last snapshot":"no snapshot"}</span></div>
  </section>
  <section class="panel"><div class="panel-title"><h2>CONTROL HEALTH</h2><span>read-only</span></div><div class="health-list">${rows}</div></section>
  <section class="grid2">
    <div class="panel"><div class="panel-title"><h2>VALIDATION</h2><span>${errors.length?"attention":"pass"}</span></div>${errorsHtml}</div>
    <div class="panel"><div class="panel-title"><h2>SNAPSHOT / CHANGE AUDIT</h2><span>local</span></div>
      <div class="audit-lines"><div><b>LAST SNAPSHOT</b><span>${snap?new Date(snap.createdAt).toLocaleString("de-DE"):"—"}</span></div><div><b>LAST REFRESH</b><span>${window.SNAPSHOT_REFRESHED_AT?new Date(window.SNAPSHOT_REFRESHED_AT).toLocaleString("de-DE"):"—"}</span></div><div><b>APPLIED CHANGES</b><span>${log.length}</span></div><div><b>CURRENT DELTA</b><span>${delta.hasSnapshot?delta.items.length:"—"}</span></div></div>
      <button class="primary health-open" type="button" onclick="render('SNAPSHOT / DELTA')">OPEN SNAPSHOT / DELTA →</button>
    </div>
  </section>
  <section class="panel"><div class="panel-title"><h2>MASTER COUNTS</h2><span>derived</span></div><div class="health-counts">
    <div><b>${model.counts.actions}</b><span>Actions</span></div><div><b>${model.counts.gates}</b><span>Gates</span></div><div><b>${model.counts.milestones}</b><span>Milestones</span></div><div><b>${model.counts.gaps}</b><span>Gaps</span></div><div><b>${model.counts.decisionCandidates}</b><span>Decision candidates</span></div>
  </div><div class="note"><b>Rule:</b> this view diagnoses the control system; it does not silently repair, reconcile or overwrite project data.</div></section>`;
}

function render(v){
 nav(v);
 let h=v==="START"?start():v==="EXECUTIVE"?executiveControl():v==="MATRIX"?masterMatrix():v==="GANTT"?gantt():v==="NETWORK"?network():v==="GATES"?gates():v==="ACTIONS"?actions():
 v==="DECISION CONTROL"?decisionCandidates():
v==="CHANGE CONTROL"?changeControl():
v==="SNAPSHOT / DELTA"?snapshotDelta():
v==="SYSTEM HEALTH"?systemHealth():
v==="RISK CONTROL"?riskControl():
v==="ACTION CONTROL"?actionControl():
v==="TRACE"?traceView():
v==="CONTROL"?masterControl():
 v==="RISKS"?`<div class="view-head"><div><div class="eyebrow">RISK CONTROL</div><h1>Risks</h1></div></div><div class="note">Risk register architecture is prepared; individual records remain TBC until populated from the project governance process.</div>`:
 v==="DECISIONS"?`<div class="view-head"><div><div class="eyebrow">DECISION CONTROL</div><h1>Decisions</h1></div></div><div class="note">Decision register is prepared; unresolved decisions remain TBC until explicitly entered.</div>`:
 v==="COSTS 🔒"?privateCostsView():
 `<div class="view-head"><div><div class="eyebrow">DATA INTEGRITY</div><h1>Data</h1></div></div><div class="panel"><h2>Validation</h2><pre>${TRA.validate(DATA).join("\n")||"✓ Structural validation passed"}</pre><p>SOURCE · NETWORK_DERIVED · USER_UPDATED · COMPUTED</p></div>`;
 document.querySelector("main").innerHTML=h;
}
load();
loadChangeLog();
/* V2.4.1: explicitly expose navigation functions */
window.traceSelect = traceSelect;
window.render = render;
window.TRA_TRACE_GLOBAL_FIX = true;

/* V3.6.2 SNAPSHOT REFRESH FIX
   Keep refresh as an explicit action and bind it independently of inline-render timing.
*/
function refreshSnapshotDelta(){
  const snap=snapshotLoad();
  if(!snap){ render("SNAPSHOT / DELTA"); return; }
  // Rebuild the derived control model first. This is essential after APPLY CHANGE,
  // because the snapshot must be compared with the freshly derived CURRENT STATE.
  try{ rebuildControlModel(); }catch(e){}
  window.SNAPSHOT_REFRESHED_AT=new Date().toISOString();
  render("SNAPSHOT / DELTA");
}
window.refreshSnapshotDelta = refreshSnapshotDelta;

(function(){
  document.addEventListener("click",function(e){
    const btn=e.target.closest && e.target.closest("#snapshot-refresh");
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    refreshSnapshotDelta();
  },true);
})();



/* V2.3.2 CLICK FIX — interaction layer */
(function(){
  function goTrace(id){
    if(!id) return;
    if(typeof window.traceSelect === "function"){
      window.traceSelect(id);
    } else {
      window.TRA_TRACE_SELECTED=id;
      if(typeof render==="function") render();
    }
  }
  window.TRA_GO_TRACE=goTrace;

  document.addEventListener("click",function(e){
    const gate=e.target.closest("[data-gate-id]");
    if(gate){ e.preventDefault(); e.stopPropagation(); goTrace(gate.dataset.gateId); return; }
    const trace=e.target.closest("[data-trace-id]");
    if(trace){ e.preventDefault(); e.stopPropagation(); goTrace(trace.dataset.traceId); return; }
  },true);
})();


(function(){
  const gateRe=/\bG(?:10|[0-9])\b/g;
  function makeGatesClickable(){
    document.querySelectorAll("button.gate-link-chip, .gate-link-chip").forEach(el=>{
      const m=(el.textContent||"").match(/\bG(?:10|[0-9])\b/);
      if(m){
        el.dataset.gateId=m[0];
        el.classList.add("clickable-gate");
        if(el.tagName!=="BUTTON") el.setAttribute("role","button");
      }
    });
  }
  const oldRender=window.render;
  if(typeof oldRender==="function"){
    window.render=function(){
      const r=oldRender.apply(this,arguments);
      setTimeout(makeGatesClickable,0);
      return r;
    };
  }
  setTimeout(makeGatesClickable,0);
  window.TRA_MAKE_GATES_CLICKABLE=makeGatesClickable;
})();


(function(){
  function makeRiskCardsClickable(){
    document.querySelectorAll(".risk-control-card").forEach(card=>{
      if(card.dataset.traceId) return;
      const b=card.querySelector("b");
      const m=b && (b.textContent||"").match(/R[A-Z0-9._-]+/);
      if(m){ card.dataset.traceId=m[0]; card.classList.add("clickable-risk"); }
    });
    document.querySelectorAll(".decision-mini-card").forEach(card=>{
      if(card.dataset.traceId) return;
      const b=card.querySelector("b");
      if(b && b.textContent.trim()) { card.dataset.traceId=b.textContent.trim(); card.classList.add("clickable-decision"); }
    });
  }
  setTimeout(makeRiskCardsClickable,0);
  window.TRA_MAKE_RISK_CLICKABLE=makeRiskCardsClickable;
})();


/* V2.4 RISK / DECISION CONTROL — source-safe bridge */
(function(){
  const srcGaps = [
    ["E1","Formal BMV role / Coordinator / Beneficiary","CRITICAL"],
    ["E2","München Beneficiary vs. Host/Associated","CRITICAL"],
    ["E3","Venue / Host Capacity","CRITICAL"],
    ["E4","Economic Plan / additional financing","CRITICAL"],
    ["E5","PCO Leistungsbild / Beschaffung","HIGH"],
    ["E6","European Commitments","CRITICAL"],
    ["E7","TRA2028 Handover","HIGH"],
    ["E8","Presidency 2030 engagement","HIGH"],
    ["E9","Industry Advisory Board","HIGH"],
    ["E10","Scientific architecture","HIGH"],
    ["E11","Urban mobility / Munich demos","HIGH"],
    ["E12","Mobility partners","MEDIUM/HIGH"],
    ["E13","Security/accessibility","HIGH"],
    ["E14","CSA budget reallocation","CRITICAL"],
    ["E15","Event Delivery financing","CRITICAL"],
    ["E16","Procurement packages","HIGH"],
    ["E17","Impact KPIs / baselines","HIGH"]
  ];
  window.TRA_GAPS = srcGaps.map(x=>({id:x[0],title:x[1],priority:x[2],source:"SOURCE"}));

  window.TRA_RISK_DECISION_MODEL = {
    rule:"Only explicitly registered relationships are shown. No risk→decision→action link is inferred.",
    gaps: window.TRA_GAPS
  };

  window.TRA_OPEN_GAP = function(id){
    window.TRA_TRACE_SELECTED=id;
    if(typeof window.render==="function") window.render();
    else if(typeof traceSelect==="function") traceSelect(id);
  };

  function decorateRiskControl(){
    document.querySelectorAll(".risk-control-card").forEach(card=>{
      const id=(card.textContent.match(/\bE\d+\b/)||[])[0];
      if(id){
        card.dataset.traceId=id;
        card.onclick=()=>window.TRA_OPEN_GAP(id);
      }
    });
  }
  setTimeout(decorateRiskControl,50);
  setTimeout(decorateRiskControl,300);
  window.TRA_DECORATE_RISK_CONTROL=decorateRiskControl;
})();


