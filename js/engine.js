
const TRA={};

TRA.status={
  OPEN:"OPEN", IN_PROGRESS:"IN_PROGRESS", BLOCKED:"BLOCKED",
  DONE:"DONE", DECISION_REQUIRED:"DECISION_REQUIRED", ON_HOLD:"ON_HOLD"
};

TRA.exposure={NORMAL:"NORMAL",LOW:"LOW",MEDIUM:"MEDIUM",HIGH:"HIGH",CRITICAL:"CRITICAL"};

TRA.traffic=function(status,exposure){
  if(status==="BLOCKED" || exposure==="CRITICAL") return "RED";
  if(status==="DECISION_REQUIRED" || exposure==="HIGH" || exposure==="MEDIUM") return "YELLOW";
  if(status==="DONE") return "GREEN";
  if(status==="OPEN" || status==="IN_PROGRESS") return exposure==="NORMAL" ? "GREEN" : "YELLOW";
  return "WHITE";
};

TRA.isoDate=function(v){
  return /^\d{4}-\d{2}-\d{2}$/.test(v||"");
};

TRA.overdue=function(item,today){
  if(!TRA.isoDate(item.end) || !TRA.isoDate(today)) return false;
  if(item.status==="DONE") return false;
  return item.end < today;
};

TRA.graph=function(nodes,edges){
  const out=new Map(), inc=new Map();
  nodes.forEach(n=>{out.set(n.id,[]);inc.set(n.id,[])});
  edges.forEach(e=>{
    if(!out.has(e.from)||!inc.has(e.to)) return;
    out.get(e.from).push(e.to); inc.get(e.to).push(e.from);
  });
  return {out,inc};
};

TRA.traceBack=function(id,graph){
  const seen=new Set(), stack=[id], result=[];
  while(stack.length){
    const x=stack.pop();
    (graph.inc.get(x)||[]).forEach(p=>{
      if(!seen.has(p)){seen.add(p);result.push(p);stack.push(p)}
    });
  }
  return result;
};

TRA.traceForward=function(id,graph){
  const seen=new Set(), stack=[id], result=[];
  while(stack.length){
    const x=stack.pop();
    (graph.out.get(x)||[]).forEach(n=>{
      if(!seen.has(n)){seen.add(n);result.push(n);stack.push(n)}
    });
  }
  return result;
};

TRA.applyExposure=function(actions,edges){
  const nodes=actions.map(x=>({...x}));
  const g=TRA.graph(nodes,edges);
  const byId=new Map(nodes.map(x=>[x.id,x]));
  nodes.filter(x=>x.status==="BLOCKED").forEach(blocked=>{
    TRA.traceForward(blocked.id,g).forEach(id=>{
      const n=byId.get(id);
      if(!n || n.status==="DONE") return;
      const old=n.exposure;
      n.exposure = old==="CRITICAL"?"CRITICAL":old==="HIGH"?"HIGH":"HIGH";
      n.traffic_light=TRA.traffic(n.status,n.exposure);
      n.network_exposed=true;
    });
  });
  return nodes;
};

TRA.gateState=function(gateId,gateInputs,byId){
  const inputs=(gateInputs[gateId]||[]).map(id=>byId.get(id)).filter(Boolean);
  if(!inputs.length) return {status:"OPEN",exposure:"NORMAL",traffic_light:"WHITE"};
  if(inputs.some(x=>x.status==="BLOCKED")) return {status:"OPEN",exposure:"CRITICAL",traffic_light:"RED"};
  if(inputs.some(x=>x.status==="DECISION_REQUIRED")) return {status:"DECISION_REQUIRED",exposure:"HIGH",traffic_light:"YELLOW"};
  if(inputs.every(x=>x.status==="DONE")) return {status:"DONE",exposure:"NORMAL",traffic_light:"GREEN"};
  if(inputs.some(x=>x.exposure==="HIGH"||x.exposure==="CRITICAL")) return {status:"OPEN",exposure:"HIGH",traffic_light:"YELLOW"};
  return {status:"OPEN",exposure:"NORMAL",traffic_light:"GREEN"};
};

TRA.whatIf=function(items,shiftDays){
  return items.map(x=>{
    if(!TRA.isoDate(x.start)||!TRA.isoDate(x.end)) return {...x,simulated_start:x.start,simulated_end:x.end,simulation:"TBC"};
    const shift=d=>new Date(new Date(d+"T00:00:00").getTime()+shiftDays*86400000).toISOString().slice(0,10);
    return {...x,simulated_start:shift(x.start),simulated_end:shift(x.end),simulation:"COMPUTED"};
  });
};

TRA.validate=function(state){
  const errors=[];
  const ids=new Set();
  const all=[...(state.actions||[]),...(state.gates||[]),...(state.milestones||[])];
  all.forEach(x=>{if(ids.has(x.id)) errors.push("Duplicate ID: "+x.id);ids.add(x.id)});
  (state.dependencies||[]).forEach(e=>{
    if(!ids.has(e.from)) errors.push("Invalid predecessor: "+e.from);
    if(!ids.has(e.to)) errors.push("Invalid successor: "+e.to);
    if(e.from===e.to) errors.push("Self dependency: "+e.from);
  });
  return errors;
};

TRA.runTests=function(){
  const blocked={id:"A6.15",status:"BLOCKED",exposure:"NORMAL",traffic_light:"GREEN"};
  const successor={id:"G4",status:"OPEN",exposure:"NORMAL",traffic_light:"GREEN"};
  const nodes=[blocked,successor];
  const edges=[{from:"A6.15",to:"G4"}];
  const r=TRA.applyExposure(nodes,edges);
  return {
    blocked_status_preserved:r.find(x=>x.id==="A6.15").status==="BLOCKED",
    successor_status_preserved:r.find(x=>x.id==="G4").status==="OPEN",
    successor_exposed:r.find(x=>x.id==="G4").exposure==="HIGH",
    successor_yellow:r.find(x=>x.id==="G4").traffic_light==="YELLOW"
  };
};


/* V3.4 CORE CONSOLIDATION
   Single derived control model consumed by views. Source data remains unchanged. */
TRA.buildControlModel=function(state,derived){
  const actions=(state.actions||[]).map(x=>({...x}));
  const gaps=(state.gaps||[]).map(x=>({...x}));
  const gates=(state.gates||[]).map(x=>({...x}));
  const milestones=(state.milestones||[]).map(x=>({...x}));
  const dependencies=(state.dependencies||[]).map(x=>({...x}));
  const all=[...actions,...gaps,...gates,...milestones];
  const byId=new Map(all.map(x=>[x.id,x]));
  const graph=TRA.graph(all,dependencies);
  const gateInputs=(derived&&derived.gateInputs)||{};
  const gapTrace=(derived&&derived.gapTrace)||{};
  const gateChain=(derived&&derived.chain)||{};
  const candidates=(derived&&derived.decisionCandidates)||[];
  const gateIds=Object.keys(gateInputs);
  const gateForAction=new Map();
  gateIds.forEach(g=>gateInputs[g].forEach(id=>gateForAction.set(id,g)));
  const milestoneByGate=(derived&&derived.milestoneByGate)||{};
  const integrity=TRA.validate(state);
  const actionExposure=TRA.applyExposure(actions,dependencies);
  const actionById=new Map(actionExposure.map(x=>[x.id,x]));
  const exposedActions=actionExposure.filter(x=>x.network_exposed===true);
  const blockedActions=actionExposure.filter(x=>x.status==='BLOCKED');
  const actualDecisionCount=(state.decisions||[]).length;
  const uniqueControlCount=actions.length+gaps.length+candidates.length+gates.length+milestones.length;
  return {
    byId, graph, actions:actionExposure, gaps, gates, milestones, dependencies,
    decisionCandidates:candidates, integrity,
    counts:{actions:actions.length,gaps:gaps.length,decisionCandidates:candidates.length,gates:gates.length,milestones:milestones.length,total:uniqueControlCount,actualDecisions:actualDecisionCount},
    exposure:{blockedActions,exposedActions},
    gateInputs, gapTrace, gateChain, gateForAction, milestoneByGate,
    traceBack:id=>TRA.traceBack(id,graph), traceForward:id=>TRA.traceForward(id,graph),
    get:id=>byId.get(id)||actionById.get(id)||null
  };
};

TRA.coreIntegrity=function(model){
  if(!model) return {ok:false,total:0,errors:['Control model not built']};
  const expected=model.counts.actions+model.counts.gaps+model.counts.decisionCandidates+model.counts.gates+model.counts.milestones;
  return {ok:model.integrity.length===0 && expected===model.counts.total,total:model.counts.total,expected,errors:model.integrity};
};
