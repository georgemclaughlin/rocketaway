// Exhaust every affordable first-launch loadout, including free refits of researched parts.
// Run with: node checks/balance-audit.js
import { pathToFileURL } from 'node:url';
import { newExpeditions, startExpedition, milestoneHeight } from '../expeditions.js';
import { PARTS } from '../parts.js';
import { estimateHeight } from '../builder.js';
import { CONDITIONS_VERSION, WORLDS, flightConditions } from '../worlds.js';
export function bestAffordableStart(program,quality=1.2) {
 const options=PARTS.filter(part=>program.parts.owned.includes(part.id)||program.stock.includes(part.id));
 const slots=['aero','tank','engine','boosters'].map(slot=>options.filter(part=>part.slot===slot));
 let best={height:0,cost:0,parts:null};
 for(const aero of slots[0])for(const tank of slots[1])for(const engine of slots[2])for(const boosters of slots[3]){
  const parts=[aero,tank,engine,boosters],cost=parts.reduce((sum,part)=>sum+(program.parts.owned.includes(part.id)?0:part.price),0);
  if(cost>program.credits)continue;
  const equipped=Object.fromEntries(parts.map(part=>[part.slot,part.id]));
  const height=estimateHeight({...program,parts:{...program.parts,equipped}},quality);
  if(height>best.height)best={height,cost,parts:equipped};
 }
 return best;
}
export function auditFirstLaunches(version=CONDITIONS_VERSION) {
 const rows=WORLDS.map(world=>({world:world.name,clears:0,cases:0}));
 for(let world=0;world<WORLDS.length;world++)for(const seed of[1,7,42,99,2025])for(const kit of['scrapper','stager','scientist']){
  const session=newExpeditions();session.profile.maxDifficulty=8;session.profile.totalGates=48;session.profile.research.levels[kit]=5;
  startExpedition(session,{seed,difficulty:world,kit});const run=session.active;
  // These versions have identical stock generation and research; only funds and goals differ.
  run.program.credits+=flightConditions(world,version).grant-flightConditions(world).grant;
  run.conditionsVersion=version;run.program.conditionsVersion=version;
  const best=bestAffordableStart(run.program);
  rows[world].cases++;rows[world].clears+=best.height>=milestoneHeight(run,5);
 }
 return {version,cases:rows.reduce((sum,row)=>sum+row.cases,0),clears:rows.reduce((sum,row)=>sum+row.clears,0),rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log(JSON.stringify({previous:auditFirstLaunches(2),current:auditFirstLaunches()},null,2));
}
