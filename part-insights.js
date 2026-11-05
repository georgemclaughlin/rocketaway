import { partForProgram, partById } from './parts.js?v=flight-feel-1';
import { flightConditions } from './worlds.js?v=flight-feel-1';

const word=(delta,more,less)=>delta>=0?more:less;
export function partInsight(program,id) {
 const part=partById(id),old=partById(program.parts.equipped[part.slot]);
 if(part.id===old.id)return part.detail;
 const mass=part.mass-old.mass,conditions=flightConditions(program.launchWorld,program.conditionsVersion??1);
 if(part.slot==='aero') {
  if(part.pay>old.pay)return 'More altitude credits; extra weight can shorten the climb.';
  if(conditions.drag===0)return mass<0?'Less weight to lift. Streamlining adds nothing in a vacuum.':'More weight to lift. Streamlining adds nothing in a vacuum.';
  if(part.drag<old.drag)return `Less air drag; ${mass>0?'extra weight to lift':'a lighter nose too'}.`;
  return `More air drag; ${mass<0?'less weight to lift':'check the altitude tradeoff'}.`;
 }
 if(part.slot==='tank')return `${word(part.burn-old.burn,'Longer','Shorter')} burn; ${word(mass,'more','less')} weight for your engine to lift.`;
 if(part.slot==='engine')return `${word(part.thrust-old.thrust,'More','Less')} thrust; ${Math.abs(part.efficiency-old.efficiency)<.001?'same fuel duration':word(part.efficiency-old.efficiency,'longer','shorter')+' fuel duration'}.`;
 if(!part.kick)return 'Shed booster weight, but lose the midflight push.';
 return `${word(part.kick-old.kick,'Stronger','Smaller')} midflight push; ${word(mass,'more','less')} weight until separation.`;
}

export function buildExperiment(program,partId) {
 const part=partForProgram(program,partId),old=partForProgram(program,program.parts.equipped[part.slot]);
 const conditions=flightConditions(program.launchWorld,program.conditionsVersion??1);
 if(part.slot==='aero')return conditions.drag>0&&part.drag<old.drag?'Try reducing nose-cone drag.':'Try a lighter nose cone.';
 if(part.slot==='tank')return part.burn>old.burn?'Try more fuel for a longer burn.':'Try shedding tank weight.';
 if(part.slot==='engine')return part.efficiency>old.efficiency?'Try an engine with a longer burn.':part.thrust>old.thrust?'Try more engine power for the climb.':'Try a lighter engine.';
 return part.kick>old.kick?'Try a stronger midflight boost.':'Try shedding booster weight.';
}
