// Fictional expedition salvage. Pure, bounded and deterministic; no storage or DOM.
export const CORES = [
 {id:'cascade',name:'Cascade coupler',icon:'⇈',color:'#ffb474',identity:'Chain-reaction rocket',part:'twins',detail:'After booster separation, two extra kicks fire 3s apart at 60% of the original kick. Bring side boosters.',hint:'Pair with Reserve tank and Separation engine for a chain of releases.'},
 {id:'sail',name:'Star sail',icon:'✧',color:'#b9b4ff',identity:'Star-sail glider',part:'feather-shell',detail:'With no boosters and launch mass ≤1.60t, a sail opens at burnout and cuts arcade coast gravity by 30%.',hint:'Keep it light. Feather shell and Endurance engine make a compact glider.'},
 {id:'scanner',name:'Echo scanner',icon:'⌁',color:'#8ce5c3',identity:'Flying observatory',part:'survey-capsule',detail:'A Science or Survey capsule gets 35% longer burn. Three scans at 4s intervals charge an 8s overdrive at 3× thrust. Each scan earns 60 credits on success.',hint:'Use a capsule and enough fuel to reach all three scans. Instrument engine is a natural partner.'},
];
export const coreById=id=>CORES.find(core=>core.id===id)||null;
export function discoverySnapshot(p) {return p?.discoveryVersion===1?{discoveryVersion:1,core:coreById(p.core)?.id||null}:{};}
export function discoveryOrder(seed) { const offset=(seed>>>0)%3;return [0,1,2].map(i=>CORES[(i+offset)%3].id); }
export function cacheSites(run) {
 if(run?.discoveryVersion!==1||run.difficulty>1)return [];
 const order=discoveryOrder(run.seed);
 const sites=run.startWorld===1?[[1,1,'Silent relay'],[1,3,'Drifting observatory'],[1,5,'Departure beacon']]:[[0,1,'Weather-balloon wreck'],[0,3,'Lost orbital crate'],[0,5,'Deep-sky relay']];
 return sites.map(([world,stage,name],i)=>({id:i,world,stage,name,core:order[i]}));
}
export function nextCache(run) {return cacheSites(run).find(site=>site.world===run.difficulty&&!run.discoveries?.includes(site.core))||null;}
export function recoverDiscoveries(run) {
 if(run.discoveryVersion!==1)return [];
 const recovered=[];
 for(const site of cacheSites(run))if(site.world===run.difficulty&&run.stage>=site.stage&&!run.discoveries.includes(site.core)) {
  run.discoveries.push(site.core);const core=coreById(site.core);
  if(!run.program.parts.owned.includes(core.part))run.program.parts.owned.push(core.part);
  recovered.push({...site,part:core.part});
 }
 return recovered;
}
export function fitCore(run,id) {
 if(run?.discoveryVersion!==1||run.status!=='build'||(id!==null&&!run.discoveries.includes(id))||id!==null&&!coreById(id))return false;
 run.program.core=id;return true;
}
export function discoveryAssembly(stats,parts,program) {
 if(program.discoveryVersion!==1||!coreById(program.core))return stats;
 const s={...stats,discoveryCore:program.core};
 s.cascade=program.core==='cascade'&&s.hasBoosters;
 s.sail=program.core==='sail'&&!s.hasBoosters&&s.mass<=1.6+1e-9;
 s.scanner=program.core==='scanner'&&parts.aero.shape==='capsule';
 if(s.scanner){s.burn*=1.35;s.reserveSeconds*=1.35;}
 return s;
}
export function coreStatus(core,stats) {
 if(!core)return 'No core fitted';
 if(core.id==='cascade')return stats.hasBoosters?'Ready · two echo kicks after separation':'Needs side boosters';
 if(core.id==='sail')return !stats.hasBoosters&&stats.mass<=1.6+1e-9?'Ready · sail opens after burnout':`Needs no boosters and ≤1.60t (${stats.mass.toFixed(2)}t)`;
 return stats.scanner?'Ready · longer burn and up to 180 scan credits':'Needs a Science or Survey capsule';
}
export const DISCOVERY_EVENTS=['Cascade · echo kick 1','Cascade · echo kick 2','Star sail deployed','Echo scan 1 / 3','Echo scan 2 / 3','Echo scan 3 / 3','Echo overdrive · 3× thrust'];
export function stepDiscovery(flight,powered) {
 if(!flight.discoveryCore)return;
 if(flight.cascade&&flight.boosted&&flight.hasBoosters){
  const echoes=flight.echoes||0;
  if(echoes<2&&flight.time>=flight.separationAt+(echoes+1)*3){flight.velocity+=flight.kick*.6;flight.echoes=echoes+1;flight.events.push(`Cascade · echo kick ${flight.echoes}`);}
 }
 if(flight.sail&&!powered&&!flight.sailOpened){flight.sailOpened=true;flight.events.push('Star sail deployed');}
 if(flight.scanner&&powered&&(flight.scans||0)<3&&flight.time>=((flight.scans||0)+1)*4){flight.scans=(flight.scans||0)+1;flight.events.push(`Echo scan ${flight.scans} / 3`);if(flight.scans===3){flight.scanSurgeUntil=flight.time+8;flight.events.push('Echo overdrive · 3× thrust');}}
}
