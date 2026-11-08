// Diagnostic fixtures, exhaustive affordable openings, and earned play are reported separately.
// These deterministic simulations are not player telemetry or human enjoyment testing.
import { pathToFileURL } from 'node:url';
import { COMPONENT_RESEARCH, COMPONENT_NODES } from '../component-research.js';
import { newExpeditions, startPrototype, beginFlight, settle, arrivePrototype, chooseContract, contractsFor, contractReady } from '../prototype-run.js';
import { continueExpedition, milestoneHeight } from '../expeditions.js';
import { catalogFor, fitPart, assemblySpecs } from '../parts.js';
import { estimateHeight } from '../builder.js';
import { createFlight } from '../engine.js';
import { advanceFlight } from '../flight-playback.js';
import { buyResearch, buyComponentResearch } from '../research.js';

const seeds=[1,7,42,99,2025],kits=['scrapper','stager','scientist'];
const calibrations=COMPONENT_RESEARCH.map(s=>s.calibration.id),allNodes=COMPONENT_NODES.map(n=>n.id);
const builds=[['cap','pocket','spark','twins'],['cap','long','spark','twins'],['needle','long','ember','solids'],['cap','pocket','spark','bare'],['cap','long','spark','bare'],['needle','long','ember','bare'],['needle','jumbo','ember','bare'],['needle','composite','dart','twins'],['feather-shell','composite','endurance-engine','bare'],['survey-capsule','composite','instrument-engine','bare'],['needle','reserve-tank','separation-engine','twins'],['needle','drop-tank','momentum-engine','return-boosters'],['ceramic','jumbo','mammoth','orbitals']];
function setup({seed=42,kit='scrapper',rank=0,world=0,unlocks=[]}={}) {
 const s=newExpeditions();s.profile.totalGates=6;s.profile.maxDifficulty=Math.max(world,1);s.profile.research.levels[kit]=rank;
 s.profile.research.components={[kit]:unlocks.slice()};startPrototype(s,{seed,kit,difficulty:world,equipmentVersion:2});return s;
}
function tuningChoices(p) {
 let choices=[{}];
 for(const section of COMPONENT_RESEARCH) {
  const ids=['standard',...section.tunings.filter(n=>p.componentResearch?.includes(n.id)).map(n=>n.id)];
  choices=choices.flatMap(choice=>ids.map(id=>({...choice,[section.id]:id})));
 }
 return choices;
}
export function bestComponentBuild(program,contract=null,quality=1.1) {
 const available=catalogFor(program).filter(p=>program.parts.owned.includes(p.id)||program.stock.includes(p.id));
 const slots=['aero','tank','engine','boosters'].map(slot=>available.filter(p=>p.slot===slot));
 const choices=tuningChoices(program);let best=null;
 for(const a of slots[0])for(const t of slots[1])for(const e of slots[2])for(const b of slots[3]) {
  const parts=[a,t,e,b],cost=parts.reduce((sum,p)=>sum+(program.parts.owned.includes(p.id)?0:p.price),0);
  if(cost>program.credits)continue;
  for(const tunings of choices) {
   if(b.id==='bare'&&tunings.boosters!=='standard')continue;
   const candidate={...program,tunings,parts:{...program.parts,equipped:Object.fromEntries(parts.map(p=>[p.slot,p.id]))}};
   if(contract&&!contractReady(candidate,contract))continue;
   const height=estimateHeight(candidate,quality);
   if(contract&&height<contract.target)continue;
   if(!best||(contract?cost<best.cost:height>best.height+1))best={height,cost,ids:parts.map(p=>p.id),tunings};
  }
 }
 return best;
}
export function auditBranches() {
 const rows=[];
 // All-parts diagnostic fixtures; some are unavailable or unaffordable at an opening.
 for(const kit of kits)for(const rank of [0,5])for(let world=0;world<9;world++) {
  const p=setup({kit,rank,world}).active.program;
  for(const ids of builds)for(const section of COMPONENT_RESEARCH) {
   if(section.id==='boosters'&&ids[3]==='bare')continue;
   const candidate={...p,componentResearch:[section.calibration.id,...section.tunings.map(n=>n.id)],parts:{...p.parts,equipped:Object.fromEntries(['aero','tank','engine','boosters'].map((slot,i)=>[slot,ids[i]]))}};
   const results=Object.fromEntries(['standard',...section.tunings.map(n=>n.id)].map(id=>[id,Math.round(estimateHeight({...candidate,tunings:{[section.id]:id}},1.1))]));
   const winner=Object.entries(results).sort((a,b)=>b[1]-a[1])[0][0];rows.push({kit,rank,world,ids,slot:section.id,winner,results});
  }
 }
 return {scope:'Fixed build diagnostics, seed42, 110% timing; not affordability or earned play.',summaries:COMPONENT_RESEARCH.map(s=>({slot:s.id,cases:rows.filter(r=>r.slot===s.id).length,winners:Object.fromEntries(['standard',...s.tunings.map(n=>n.id)].map(id=>[id,rows.filter(r=>r.slot===s.id&&r.winner===id).length]))})),rows};
}
export function auditOpenings() {
 const rows=[];
 for(const seed of seeds)for(const kit of kits)for(const rank of [0,5])for(let world=0;world<9;world++) {
  const s=setup({seed,kit,rank,world}),p=s.active.program;
  for(const [research,unlocks] of [['ordinary',[]],['calibrations',calibrations],['all-specializations',allNodes]]) {
   const best=bestComponentBuild({...p,componentResearch:unlocks},null,1.2);
   rows.push({seed,kit,rank,world,research,height:Math.round(best.height),cost:best.cost,parts:best.ids,tunings:best.tunings,firstLaunchClear:best.height>=milestoneHeight(s.active,5)});
  }
 }
 return {scope:'Optimal affordable opening builds and unlocked tunings, perfect120% timing. Research is pre-owned; not an earned progression policy.',summaries:['ordinary','calibrations','all-specializations'].map(research=>({research,cases:rows.filter(r=>r.research===research).length,firstLaunchClears:rows.filter(r=>r.research===research&&r.firstLaunchClear).length,rank5Clears:rows.filter(r=>r.research===research&&r.rank===5&&r.firstLaunchClear).length,clearWorlds:rows.filter(r=>r.research===research&&r.firstLaunchClear).map(r=>r.world)})),rows};
}
export function earnedComponentRun({seed=42,kit='scrapper',rank=0,world=0,endWorld=1,components=true,unlocks=[]}={}) {
 const session=setup({seed,kit,rank,world,unlocks}),launches=[];
 // Earn research from completed flights; buy calibrations first, then each specialization, then kit ranks.
 const order=[...calibrations,...COMPONENT_RESEARCH.flatMap(s=>s.tunings.map(n=>n.id))];
 for(let i=0;i<90;i++) {
  if(session.active.status==='lost'||(session.active.status==='won'&&session.active.difficulty===endWorld))break;
  if(components)for(const id of order)buyComponentResearch(session,kit,id);
  while(buyResearch(session,kit));
  if(session.active.status==='won'&&!arrivePrototype(session))startPrototype(session,{seed:seed+session.active.difficulty+1,kit,difficulty:session.active.difficulty+1});
  const run=session.active,p=run.program;let chosen=null;
  if(estimateHeight(p)<milestoneHeight(run)) {
   let best=bestComponentBuild(p);
   if(best.height<milestoneHeight(run))for(const contract of contractsFor(run).filter(c=>!run.completedContracts.includes(c.id))) {
    const alternative=bestComponentBuild(p,contract);if(alternative){best=alternative;chosen=contract;break;}
   }
   for(const id of best.ids)fitPart(p,id);
   p.tunings={...best.tunings};
  }
  const contract=chosen||contractsFor(run).find(c=>!run.completedContracts.includes(c.id)&&contractReady(p,c));chooseContract(session,contract?.id||null);
  const power=estimateHeight(p)<milestoneHeight(run)&&estimateHeight(p,1.2)>=milestoneHeight(run)?1.2:1.1;
  beginFlight(session,power);const flight=createFlight(p.levels,power,{plan:'explorer',assembly:assemblySpecs(p)});
  for(let tick=0;tick<12000&&!flight.done;tick++)advanceFlight(flight,.05);
  if(!flight.done)throw Error('Nonterminating component flight');
  const result=settle(session,flight);
  launches.push({world:run.difficulty,height:Math.round(flight.peak),power,cleared:result.cleared.length,contract:result.contract,misses:run.strikes,credits:p.credits,research:p.componentResearch.slice(),tunings:{...p.tunings},rank:p.research.rank});
  continueExpedition(session);
 }
 return {seed,kit,rank,world,endWorld,components,status:session.active.status,launches};
}
export function auditLaterWorlds() {
 const rows=[];
 for(const seed of seeds)for(const kit of kits)for(const rank of [0,5])for(let world=2;world<9;world++)rows.push(earnedComponentRun({seed,kit,rank,world,endWorld:world,unlocks:allNodes}));
 return {scope:'Later-world refit policy with all component research pre-owned; flight credits are earned. This is maximum-research feasibility, not research earned from a fresh profile.',cases:rows.length,completed:rows.filter(r=>r.status==='won').length,rows};
}
export function auditEarned() {
 const rows=[];
 for(const seed of seeds)for(const kit of kits)for(const rank of [0,5])for(const world of [0,1])for(const components of [false,true])rows.push(earnedComponentRun({seed,kit,rank,world,components}));
 return {scope:'Earned Earth–Moon policy; exhaustive refit only when next goal is unreachable, contracts and perfect timing used when sufficient. Components bought only with flight earnings.',summaries:[false,true].map(components=>{const selected=rows.filter(r=>r.components===components);return {components,cases:selected.length,completed:selected.filter(r=>r.status==='won').length,starts:[0,1].map(world=>{const runs=selected.filter(r=>r.world===world);return {world,cases:runs.length,minLaunches:Math.min(...runs.map(r=>r.launches.length)),maxLaunches:Math.max(...runs.map(r=>r.launches.length)),meanLaunches:runs.reduce((sum,r)=>sum+r.launches.length,0)/runs.length};})};}),rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 const mode=process.argv[2]||'all';const result={};
 if(mode==='all'||mode==='branches')result.branches=auditBranches();
 if(mode==='all'||mode==='openings')result.openings=auditOpenings();
 if(mode==='all'||mode==='earned')result.earned=auditEarned();
 if(mode==='all'||mode==='later')result.later=auditLaterWorlds();
 console.log(JSON.stringify(result,null,2));
}
