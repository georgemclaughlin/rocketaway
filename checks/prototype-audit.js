// Sampled earned play policies plus exhaustive affordable loadouts at each decision.
import { pathToFileURL } from 'node:url';
import { newExpeditions,startPrototype,beginFlight,settle,arrivePrototype,chooseContract,prototypeContracts,contractReady } from '../prototype-run.js';
import { continueExpedition,milestoneHeight } from '../expeditions.js';
import { catalogFor,fitPart,assemblySpecs } from '../parts.js';
import { estimateHeight } from '../builder.js';
import { createFlight } from '../engine.js';
import { advanceFlight } from '../flight-playback.js';
import { buyResearch } from '../research.js';

export function bestAffordable(program,contract=null) {
  const available=catalogFor(program).filter(p=>program.parts.owned.includes(p.id)||program.stock.includes(p.id));
  const slots=['aero','tank','engine','boosters'].map(slot=>available.filter(p=>p.slot===slot));
  let best=contract?null:{height:estimateHeight(program),cost:0,ids:Object.values(program.parts.equipped)};
  for(const a of slots[0])for(const t of slots[1])for(const e of slots[2])for(const b of slots[3]) {
    const parts=[a,t,e,b],cost=parts.reduce((sum,p)=>sum+(program.parts.owned.includes(p.id)?0:p.price),0);
    if(cost>program.credits)continue;
    const candidate={...program,parts:{...program.parts,equipped:Object.fromEntries(parts.map(p=>[p.slot,p.id]))}};
    const height=estimateHeight(candidate);
    if(contract) {
      if(height>=contract.target&&contractReady(candidate,contract)&&(!best||cost<best.cost))best={height,cost,ids:parts.map(p=>p.id)};
    } else if(height>best.height+1)best={height,cost,ids:parts.map(p=>p.id)};
  }
  return best;
}
export function earnedPrototype({seed=42,kit='scrapper',rank=0,world=0,policy='altitude',quality=1.1}={}) {
  const session=newExpeditions();session.profile.totalGates=6;session.profile.maxDifficulty=1;session.profile.research.levels[kit]=rank;
  startPrototype(session,{seed,kit,difficulty:world});const launches=[];
  for(let i=0;i<30;i++) {
    const run=session.active,p=run.program;
    while(buyResearch(session,kit));
    if(run.status==='lost'||(run.status==='won'&&run.difficulty===1))break;
    if(run.status==='won')arrivePrototype(session);
    const buys=[];let chosenContract=null;
    if(estimateHeight(p)<milestoneHeight(run)) {
      let best=bestAffordable(p);
      if(policy==='contracts'&&best.height<milestoneHeight(run)) {
        for(const contract of prototypeContracts(run.difficulty).filter(c=>!run.completedContracts.includes(c.id))) {
          const alternative=bestAffordable(p,contract);
          if(alternative){best=alternative;chosenContract=contract;break;}
        }
      }
      for(const id of best.ids)if(id!==p.parts.equipped[catalogFor(p).find(x=>x.id===id).slot]){fitPart(p,id);buys.push(id);}
    }
    if(policy==='contracts') {
      const contract=chosenContract||prototypeContracts(run.difficulty).find(c=>!run.completedContracts.includes(c.id)&&contractReady(p,c));
      chooseContract(session,contract?.id||null);
    }
    const power=policy==='contracts'&&estimateHeight(p)<milestoneHeight(run)&&estimateHeight(p,1.2)>=milestoneHeight(run)?1.2:quality;
    beginFlight(session,power);
    const flight=createFlight(p.levels,power,{plan:'explorer',assembly:assemblySpecs(p)});
    for(let tick=0;tick<12000&&!flight.done;tick++)advanceFlight(flight,.05);
    if(!flight.done)throw Error('Nonterminating prototype flight');
    const result=settle(session,flight);
    launches.push({world:run.difficulty,buys,km:Math.round(flight.peak/1000),power,cleared:result.cleared.length,contract:result.contract,misses:run.strikes,credits:p.credits});
    continueExpedition(session);
  }
  return {seed,kit,rank,world,policy,status:session.active.status,launches,session};
}
export function auditPrototype() {
  const rows=[];
  for(const seed of [1,7,42,99,2025])for(const kit of ['scrapper','stager','scientist'])for(const rank of [0,5])for(const world of [0,1]) {
    const row=earnedPrototype({seed,kit,rank,world,policy:'contracts'});
    rows.push({...row,session:undefined});
  }
  return {cases:rows.length,completed:rows.filter(r=>r.status==='won').length,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(auditPrototype(),null,2));
