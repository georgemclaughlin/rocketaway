// Build explanations use the same resolved equipment/research as the simulator.
import { assemblySpecs, fittedParts } from './parts.js?v=build-story-1';

export function buildEffects(program) {
  if(program.rulesVersion!==1)return [];
  const s=assemblySpecs(program),p=fittedParts(program),effects=[];
  const add=(key,part,active,detail,reason)=>effects.push({key,part:part.name,active:!!active,detail,reason});
  if(p.aero.ability==='feather')add('feather',p.aero,s.feather,'25% more thrust',`needs launch mass ≤1.30t (${s.mass.toFixed(2)}t fitted)`);
  if(p.engine.ability==='endurance')add('endurance',p.engine,s.endurance,'75% longer burn','needs no side boosters');
  if(p.engine.ability==='instrument')add('instrument',p.engine,s.instrument,'70% longer burn','needs a science capsule');
  if(p.tank.ability==='reserve')add('reserve',p.tank,s.hasBoosters,`${s.reserveSeconds.toFixed(1)}s reserve fuel`,'needs side boosters');
  if(p.engine.ability==='surge')add('surge',p.engine,s.surge,'2× thrust for 5s after separation','needs side boosters');
  if(s.momentum)add('momentum',p.engine,s.burn+(s.hasBoosters?s.reserveSeconds:0)>10,'thrust reaches 190% after 10s','needs more than 10s of fuel for full thrust');
  if(s.dropMass)add('drop',p.tank,true,`drops ${s.dropMass.toFixed(2)}t of dry mass`,'');
  if(s.survey)add('survey',p.aero,true,'+90 credits per new milestone','');
  if(s.recovery)add('recovery',p.boosters,true,'+90 credits after separation on success','');
  return effects;
}

export function buildIdentity(program) {
  const s=assemblySpecs(program);
  if(s.feather&&s.endurance)return 'Featherweight explorer';
  if(s.instrument)return 'Science vessel';
  if(s.surge&&s.reserveSeconds&&s.hasBoosters)return 'Staged pathfinder';
  if(s.momentum)return 'Momentum rocket';
  if(s.endurance)return 'Endurance explorer';
  if(s.hasBoosters)return 'Staged rocket';
  if(s.survey)return 'Survey rocket';
  if(s.feather)return 'Lightweight rocket';
  return s.burn>=10?'Long-range rocket':'Your rocket';
}

export function combinationChange(before,after) {
  const previous=buildEffects(before),next=buildEffects(after);
  // Warn about a retained partner losing its effect, even when previewing a standard part.
  const lost=next.find(effect=>!effect.active&&previous.some(old=>old.key===effect.key&&old.active));
  if(lost)return {warning:true,text:`Disables ${lost.part}: ${lost.reason}.`};
  const gained=next.find(effect=>effect.active&&previous.some(old=>old.key===effect.key&&!old.active));
  if(gained)return {warning:false,text:`Activates ${gained.part}: ${gained.detail}.`};
  return null;
}

export function flightBuildSummary(program,flight) {
  const effects=buildEffects(program).map(e=>{
    const activated=e.key==='drop'?flight.dropReleased:e.key==='reserve'?flight.reserveOpened:e.key==='surge'?flight.events?.includes('Separation surge · 2× thrust'):e.key==='momentum'?flight.momentumFull:e.active;
    const detail=activated?e.detail:e.key==='momentum'?'fuel ended before full thrust':e.active?'did not activate':e.reason;
    return `${e.part}: ${detail}`;
  });
  return {name:buildIdentity(program),effects,mass:assemblySpecs(program).mass,burn:Number.isFinite(flight.time)&&Number.isFinite(flight.burn)?Math.min(flight.time,flight.burn):0,coast:flight.coastTime||0};
}
