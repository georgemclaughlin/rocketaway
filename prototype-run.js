// Roguelite journey. Existing flights retain their physics and equipment.
import { newExpeditions, restoreExpeditions, startExpedition, beginExpeditionFlight, settleExpedition, abandonExpedition, KITS, milestoneHeight } from './expeditions.js?v=mission-journal-1';
import { PARTS, assemblySpecs } from './parts.js?v=mission-journal-1';
import { EXPERIMENTAL_PARTS } from './experimental.js?v=mission-journal-1';
import { awardResearch } from './research.js?v=mission-journal-1';
import { recordFlightPeak } from './flight-records.js?v=mission-journal-1';
import { contractsFor, missionPool, contractReady } from './missions.js?v=mission-journal-1';
import { restoreJournal, recordMission, recordWorldClear } from './mission-journal.js?v=mission-journal-1';
export { prototypeContracts, contractsFor, contractReady } from './missions.js?v=mission-journal-1';
import { WORLDS, flightConditions } from './worlds.js?v=mission-journal-1';

export const PROTOTYPE_VERSION=3;
export const isPrototype = run => run?.rulesVersion===1;
const bounded=(v,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
const copy=v=>structuredClone(v);
function shuffled(items,seed) {
  const result=[...items];let x=(seed>>>0)||1;
  for(let i=result.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function selectedContract(run) {
  return contractsFor(run).find(c=>c.id===run.contractId&&!run.completedContracts.includes(c.id))||null;
}
export function chooseContract(session,id) {
  const run=session.active;
  if(!isPrototype(run)||run.status!=='build')return false;
  if(id!==null&&!contractsFor(run).some(c=>c.id===id&&!run.completedContracts.includes(id)))return false;
  run.contractId=id;return true;
}
export function reserveOffer(session,id) {
  const run=session.active;
  if(!isPrototype(run)||run.status!=='build')return false;
  if(id!==null&&(!EXPERIMENTAL_PARTS.some(p=>p.id===id)||!run.program.stock.includes(id)||run.program.parts.owned.includes(id)))return false;
  run.reservedOffer=id;return true;
}
function restock(run) {
  const p=run.program,seed=run.seed+run.offerIndex*7919+run.difficulty*104729;
  const stock=PARTS.filter(part=>part.price>0&&!p.parts.owned.includes(part.id)&&part.tier<=Math.max(run.difficulty>1?flightConditions(run.difficulty,4).stockTier:0,Math.min(6,2+run.stage*2+(run.difficulty?2:0)))).map(part=>part.id);
  const pool=EXPERIMENTAL_PARTS.filter(part=>!p.parts.owned.includes(part.id));
  if(p.parts.owned.includes(run.reservedOffer))run.reservedOffer=null;
  const offered=run.reservedOffer?[run.reservedOffer]:[];
  if(run.offerIndex===0&&run.difficulty===0)offered.push(shuffled(pool.filter(part=>part.price<=130),seed)[0]?.id);
  for(const part of shuffled(pool,seed))if(offered.length<2&&!offered.includes(part.id))offered.push(part.id);
  p.stock=[...stock,...offered.filter(Boolean)];
}
export function startPrototype(session,options={}) {
  // Choosing a new launchpad explicitly replaces the saved rocket; merely opening setup does not.
  if(Number.isInteger(session.pendingWorld)&&session.active&&session.pendingWorld>session.active.difficulty&&['build','debrief'].includes(session.active.status)) {
    if(!KITS.some(kit=>kit.id===(options.kit||'scrapper')&&kit.unlock<=session.profile.totalGates))return false;
    abandonExpedition(session);
  }
  if(!startExpedition(session,{...options,difficulty:bounded(options.difficulty,8)}))return false;
  session.pendingWorld=null;
  const run=session.active,difficulty=run.difficulty;
  session.prototypeVersion=PROTOTYPE_VERSION;
  session.profile.prototypeWorlds??=[];
  session.profile.missionJournal??=restoreJournal();
  Object.assign(run,{rulesVersion:1,missionVersion:2,worldStartFlights:0,startWorld:difficulty,conditionsVersion:4,offerIndex:0,reservedOffer:null,contractId:null,completedContracts:[],launchSnapshot:null});
  Object.assign(run.program,{rulesVersion:1,conditionsVersion:4});
  // A checkpoint is a new funded build, never a duplicate arrival stipend.
  if(difficulty===1)run.program.credits+=1100;
  restock(run);return true;
}
export function beginFlight(session,quality) {
  if(!beginExpeditionFlight(session,quality))return false;
  const run=session.active;
  if(isPrototype(run)) {
    const contract=selectedContract(run);
    run.launchSnapshot={world:run.difficulty,contractId:contract?.id||null,eligible:!!contract&&contractReady(run.program,contract),equipped:copy(run.program.parts.equipped),survey:assemblySpecs(run.program).survey===true};
  }
  return true;
}
export function settle(session,flight) {
  const run=session.active;
  if(!isPrototype(run))return settleExpedition(session,flight);
  if(run.status!=='flying'||!flight.done||flight.settled)return null;
  flight.settled=true;
  const p=run.program,oldStage=run.stage,oldGates=session.profile.totalGates,oldBest=p.best,oldStock=[...p.stock];
  const altitude=Math.floor(flight.peak),target=milestoneHeight(run),cleared=[];
  let bonus=0;
  while(run.stage<6&&altitude>=milestoneHeight(run)){cleared.push(milestoneHeight(run));bonus+=160+run.stage*100;run.stage++;session.profile.totalGates++;}
  session.profile.bestStage=Math.max(session.profile.bestStage,run.stage);
  const contract=contractsFor(run).find(c=>c.id===run.launchSnapshot?.contractId);
  const completed=contract&&run.launchSnapshot?.eligible&&!run.completedContracts.includes(contract.id)&&altitude>=contract.target;
  if(completed){run.completedContracts.push(contract.id);run.contractId=null;recordMission(session.profile,contract.id);}
  const contractPay=completed?contract.reward:0,surveyPay=run.launchSnapshot?.survey?cleared.length*90:0;
  const flightPay=60+Math.floor(Math.min(altitude*160000/milestoneHeight(run,5),500000)/220*flight.payMultiplier);
  const total=flightPay+bonus+contractPay+surveyPay,success=cleared.length>0||!!completed;
  const firstWorld=run.stage===6&&!session.profile.prototypeWorlds.includes(run.difficulty);
  const data=awardResearch(session,cleared.length,firstWorld);
  p.credits+=total;p.best=Math.max(p.best,altitude);p.flights++;
  recordFlightPeak(session.profile,altitude,run.difficulty);
  if(!success)run.strikes++;
  run.offerIndex++;restock(run);
  const result={altitude,target,success,total,flightPay,bonus,contractPay,surveyPay,contract:completed?contract.name:null,data,stage:oldStage+1,power:Math.round(flight.quality*100),cleared,nextTarget:run.stage<6?milestoneHeight(run):null,record:altitude>oldBest,improvement:Math.max(0,altitude-oldBest),events:[...(flight.events||[])],newParts:p.stock.filter(id=>!oldStock.includes(id)),unlockedKits:KITS.filter(k=>k.unlock>oldGates&&k.unlock<=session.profile.totalGates).map(k=>k.id)};
  run.lastResult=result;run.launchQuality=null;run.launchSnapshot=null;
  run.status=run.stage===6?'won':run.strikes>=3?'lost':'debrief';
  if(run.status==='won') {
    recordWorldClear(session.profile,run);
    if(firstWorld)session.profile.prototypeWorlds.push(run.difficulty);
    session.profile.wins++;session.profile.maxDifficulty=Math.max(session.profile.maxDifficulty,Math.min(8,run.difficulty+1));
    if(run.difficulty===8){session.profile.campaignComplete=true;session.profile.endingAcknowledged=false;}
  }
  return result;
}
export function arrivePrototype(session) {
  const run=session.active;
  if(!isPrototype(run)||run.status!=='won'||run.difficulty!==0)return false;
  run.difficulty=1;run.stage=0;run.status='build';run.lastResult=null;run.contractId=null;
  run.worldStartFlights=run.program.flights;
  run.program.launchWorld=1;run.program.best=0;run.program.won=false;
  restock(run);return true;
}
export function restoreSession(raw) {
  if(raw?.prototypeVersion!==undefined&&![1,2,PROTOTYPE_VERSION].includes(raw.prototypeVersion))throw Error('This save needs a newer prototype build.');
  if(raw?.active?.rulesVersion!==undefined&&raw.active.rulesVersion!==1)throw Error('This expedition needs a newer rules version.');
  if(raw?.version!==undefined&&![1,2].includes(raw.version))throw Error('This save needs a newer game build.');
  if(raw?.active?.missionVersion!==undefined&&![1,2].includes(raw.active.missionVersion))throw Error('This expedition needs a newer mission version.');
  if(raw?.profile?.missionJournal?.version!==undefined&&raw.profile.missionJournal.version!==1)throw Error('This journal needs a newer game build.');
  if(raw?.active?.conditionsVersion>4)throw Error('This save needs newer flight conditions.');
  if(raw?.active?.conditionsVersion===4&&!raw?.prototypeVersion)throw Error('This expedition requires its prototype save envelope.');
  if(!raw?.prototypeVersion)return restoreExpeditions(raw);
  if(raw.version!==2)throw Error('Unsupported prototype save schema.');
  if(raw.active&&!isPrototype(raw.active))throw Error('Prototype save has an unsupported expedition.');
  // Restore the shared profile and inventory through the established migration,
  // then restore only validated prototype fields. Do not downgrade a v4 run.
  const legacy=copy(raw);
  if(legacy.active)legacy.active.conditionsVersion=3;
  const session=restoreExpeditions(legacy);session.prototypeVersion=PROTOTYPE_VERSION;
  session.profile.missionJournal=restoreJournal(raw.profile?.missionJournal);
  session.profile.prototypeWorlds=WORLDS.map((_,i)=>i).filter(w=>raw.profile?.prototypeWorlds?.includes(w));
  // A player may already have started an Earth replay after the old Moon ending.
  for(const world of session.profile.prototypeWorlds)session.profile.maxDifficulty=Math.max(session.profile.maxDifficulty,Math.min(8,world+1));
  if(session.profile.prototypeWorlds.includes(8))session.profile.campaignComplete=true;
  session.pendingWorld=Number.isInteger(raw.pendingWorld)&&raw.pendingWorld>=0&&raw.pendingWorld<=session.profile.maxDifficulty?raw.pendingWorld:null;
  const run=session.active,input=raw.active;
  if(!run)return session;
  if(!Number.isInteger(input.difficulty)||input.difficulty<0||input.difficulty>8)throw Error('Unsupported roguelite destination.');
  if(run.status==='won')session.profile.maxDifficulty=Math.max(session.profile.maxDifficulty,Math.min(8,run.difficulty+1));
  Object.assign(run,{rulesVersion:1,missionVersion:input.missionVersion===2?2:1,worldStartFlights:Number.isInteger(input.worldStartFlights)&&input.worldStartFlights>=0&&input.worldStartFlights<=run.program.flights?input.worldStartFlights:null,conditionsVersion:4,startWorld:bounded(input.startWorld,8),offerIndex:bounded(input.offerIndex),reservedOffer:null,contractId:null,completedContracts:[],launchSnapshot:null});
  Object.assign(run.program,{rulesVersion:1,conditionsVersion:4});
  const allContracts=WORLDS.flatMap((_,world)=>missionPool(world));
  run.completedContracts=allContracts.filter(c=>input.completedContracts?.includes(c.id)).map(c=>c.id);
  for(const id of run.completedContracts)recordMission(session.profile,id);
  run.contractId=contractsFor(run).some(c=>c.id===input.contractId&&!run.completedContracts.includes(c.id))?input.contractId:null;
  const validIds=[...PARTS,...EXPERIMENTAL_PARTS].map(p=>p.id);
  run.program.stock=[...new Set((input.program?.stock||[]).filter(id=>validIds.includes(id)))];
  if(EXPERIMENTAL_PARTS.some(p=>p.id===input.reservedOffer)&&!run.program.parts.owned.includes(input.reservedOffer))run.reservedOffer=input.reservedOffer;
  if(run.status==='flying') {
    const contract=selectedContract(run);
    // The build is immutable while flying. Reconstruct eligibility from validated equipment.
    run.launchSnapshot={world:run.difficulty,contractId:contract?.id||null,eligible:!!contract&&contractReady(run.program,contract),equipped:copy(run.program.parts.equipped),survey:assemblySpecs(run.program).survey===true};
  }
  if(run.lastResult) {
    const r=input.lastResult;
    Object.assign(run.lastResult,{success:r.success===true,contractPay:bounded(r.contractPay),surveyPay:bounded(r.surveyPay),contract:allContracts.find(c=>c.name===r.contract)?.name||null,events:(Array.isArray(r.events)?r.events:[]).filter(e=>['Boosters separated','Reserve fuel released','Separation surge · 2× thrust'].includes(e)).slice(0,3)});
    run.lastResult.nextTarget=run.stage<6?milestoneHeight(run):null;
    run.lastResult.newParts=(r.newParts||[]).filter(id=>validIds.includes(id));
  }
  return session;
}
export { newExpeditions };
