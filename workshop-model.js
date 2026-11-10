// Isolated workshop experiment. No campaign save or economy dependencies.
import { assemblySpecs, partById } from './parts.js?v=discovery-4';
import { createFlight } from './engine.js?v=discovery-4';
import { advanceFlight } from './flight-playback.js?v=discovery-4';
export const BENCH = { engine:['ember','momentum-engine','separation-engine','mammoth'], tank:['long','reserve-tank','drop-tank','jumbo'], boosters:['bare','twins','solids'] };
export const TARGETS = [[2500,8000,18000,35000,65000,100000],[100000,200000,350000,550000,800000,1100000]];
export const initialBuild = () => ({aero:'lab',engine:'ember',tank:'long',boosters:'twins'});
export const newWorkshop = () => ({version:1,world:0,budget:500,flights:0,cleared:[0,0],build:initialBuild(),pending:null,last:null});
export const cost = build => Object.keys(BENCH).reduce((sum,slot)=>sum+(partById(build[slot])?.price ?? Infinity),0);
export function validBuild(build) { return build?.aero==='lab' && Object.entries(BENCH).every(([slot,ids])=>ids.includes(build[slot])); }
export function program(build,world) { return {parts:{equipped:build},launchWorld:world,conditionsVersion:4,rulesVersion:1,equipmentVersion:2}; }
export function ignition(build,world,quality=1.1) { return createFlight({},quality,{assembly:assemblySpecs(program(build,world))}); }
export function measured(build,world,quality=1.1) {
  const flight=ignition(build,world,quality);
  for(let i=0;i<12000&&!flight.done;i++)advanceFlight(flight,1);
  return flight;
}
export function fit(state,build) {
  if(state.pending||!validBuild(build)||cost(build)>state.budget)return false;
  state.build={...build};return true;
}
export function launch(state,quality) {
  if(state.pending||!Number.isFinite(quality)||quality<.9||quality>1.2)return false;
  state.pending={quality,build:{...state.build},world:state.world};return true;
}
export function settle(state,flight) {
  if(!state.pending||!flight.done)return null;
  const world=state.pending.world, before=state.cleared[world];
  const count=TARGETS[world].filter(height=>flight.peak>=height).length;
  state.cleared[world]=Math.max(before,count);
  const gained=state.cleared[world]-before, earned=Math.min(4000-state.budget,80+gained*220);
  state.budget=Math.min(4000,state.budget+earned);state.flights++;
  state.last={world,peak:flight.peak,gained,earned,events:[...flight.events],quality:state.pending.quality};
  state.pending=null;return state.last;
}
export function restore(raw) {
  if(raw?.version!==1||![0,1].includes(raw.world)||!validBuild(raw.build)||!Number.isInteger(raw.budget)||raw.budget<500||raw.budget>4000||cost(raw.build)>raw.budget||!Number.isInteger(raw.flights)||raw.flights<0||!Array.isArray(raw.cleared)||raw.cleared.length!==2||!raw.cleared.every(n=>Number.isInteger(n)&&n>=0&&n<=6))return null;
  if(raw.world===1&&raw.cleared[0]!==6)return null;
  if(raw.pending&&(!validBuild(raw.pending.build)||raw.pending.world!==raw.world||JSON.stringify(raw.pending.build)!==JSON.stringify(raw.build)||!Number.isFinite(raw.pending.quality)||raw.pending.quality<.9||raw.pending.quality>1.2))return null;
  return {...raw,last:null};
}
export function advice(build,world,peak,target) {
  if(measured(build,world,1.2).peak>=target&&peak<target)return 'This build can reach the next marker. Try catching the gold timing zone.';
  if(build.tank==='reserve-tank'&&build.boosters==='bare')return 'The reserve stayed locked. Try side boosters: separation opens the second fuel supply.';
  if(build.engine==='separation-engine'&&build.boosters==='bare')return 'The surge needs a separation. Preview side boosters to activate it.';
  if(build.engine==='momentum-engine'&&build.tank==='long')return 'Momentum needs time to build thrust. Preview a Drop tank or a staged reserve.';
  return world===0?'Try a staged reserve for a second burn, or compare Momentum with a Drop tank.':'Your rocket keeps its parts here. With no air drag, compare a longer burn against a stronger staging kick.';
}
