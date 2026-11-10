// Simulation policies, not player telemetry: openings, earned runs and fixed-build identities.
import {newExpeditions,startPrototype,beginFlight,settle,arrivePrototype,chooseContract,contractsFor,contractReady} from '../prototype-run.js';
import {continueExpedition,milestoneHeight} from '../expeditions.js';
import {fitCore,CORES} from '../discoveries.js';
import {assemblySpecs} from '../parts.js';
import {fitBuild} from '../build-plan.js';
import {estimateHeight} from '../builder.js';
import {createFlight} from '../engine.js';
import {advanceFlight} from '../flight-playback.js';
import {bestAffordable} from './prototype-audit.js';
import {bestComponentBuild} from './component-research-audit.js';
import {COMPONENT_NODES} from '../component-research.js';
const setups=[];
for(const seed of [42,43,44])for(const kit of ['scrapper','stager','scientist'])for(const rank of [0,5])for(const world of [0,1])setups.push({seed,kit,rank,world});
function setup(o){const s=newExpeditions();s.profile.totalGates=6;s.profile.maxDifficulty=1;s.profile.research.levels[o.kit]=o.rank;startPrototype(s,{...o,difficulty:o.world});return s;}
const openings=[];
for(const o of process.argv.includes('--earned-only')?[]:setups){const s=setup(o),p=s.active.program;const full={...p,componentResearch:COMPONENT_NODES.map(n=>n.id)};
 const best=bestComponentBuild(full,null,1.2),old=bestComponentBuild({...full,discoveryVersion:undefined,core:undefined},null,1.2);
 if(best.height!==old.height)throw Error('Opening changed before a discovery was earned');openings.push({...o,clear:best.height>=milestoneHeight(s.active,5)});
}
if(openings.length)console.log(JSON.stringify({openingCases:openings.length,changedOpenings:0,fullyResearchedPossibleClears:openings.filter(r=>r.clear).length}));
const rows=[];
for(const o of setups){const s=setup(o),log=[];
 for(let n=0;n<25;n++){
  const r=s.active;if(r.status==='lost'||r.status==='won'&&r.difficulty===1)break;
  if(r.status==='won')arrivePrototype(s);else if(r.status==='debrief')continueExpedition(s);
  let best=null;for(const core of [null,...r.discoveries]){const b=bestAffordable({...r.program,core});if(!best||b.height>best.height)best={...b,core};}
  let contract=null;
  if(best.height<milestoneHeight(r))for(const c of contractsFor(r).filter(c=>!r.completedContracts.includes(c.id))){for(const core of [null,...r.discoveries]){const b=bestAffordable({...r.program,core},c);if(b){best={...b,core};contract=c;break;}}if(contract)break;}
  fitCore(r,best.core);fitBuild(r.program,Object.fromEntries(['aero','tank','engine','boosters'].map((slot,i)=>[slot,best.ids[i]])));
  if(contract)chooseContract(s,contract.id);else {const c=contractsFor(r).find(c=>!r.completedContracts.includes(c.id)&&contractReady(r.program,c));if(c)chooseContract(s,c.id);}
  const q=estimateHeight(r.program)<milestoneHeight(r)&&estimateHeight(r.program,1.2)>=milestoneHeight(r)?1.2:1.1;
  beginFlight(s,q);const f=createFlight(r.program.levels,q,{plan:'explorer',assembly:assemblySpecs(r.program)});while(!f.done)advanceFlight(f,1);
  const result=settle(s,f);log.push({world:r.difficulty,core:r.program.core,peak:Math.round(f.peak),cleared:result.cleared.length,scans:result.scanPay,misses:r.strikes});
 }
 rows.push({...o,status:s.active.status,launches:log.length,log});
}
console.log(JSON.stringify({earnedCases:rows.length,completed:rows.filter(r=>r.status==='won').length,min:Math.min(...rows.map(r=>r.launches)),max:Math.max(...rows.map(r=>r.launches)),cores:CORES.map(c=>({id:c.id,flights:rows.flatMap(r=>r.log).filter(f=>f.core===c.id).length})),rows}));
