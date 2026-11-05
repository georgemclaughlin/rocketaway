import { WORLDS, flightConditions } from './worlds.js?v=flight-feel-1';
import { assemblySpecs, partById } from './parts.js?v=flight-feel-1';

export function prototypeContracts(world) {
  if(world>1) {
    const name=WORLDS[world].name,goals=flightConditions(world,4).checkpoints;
    return [
      {id:`world-${world}-light`,name:'Quiet ascent',detail:`Reach ${goals[1]/1000} km with no side boosters`,target:goals[1],kind:'bare',reward:240},
      {id:`world-${world}-science`,name:`${name} instruments`,detail:`Reach ${goals[3]/1000} km carrying a science capsule`,target:goals[3],kind:'science',reward:320},
    ];
  }
  return world===0?[
    {id:'earth-light',name:'Small but mighty',detail:'Reach 12 km at ≤1.30t launch mass',target:12000,kind:'light',reward:180},
    {id:'earth-science',name:'Atmosphere survey',detail:'Reach 40 km carrying a science capsule',target:40000,kind:'science',reward:240},
  ]:[
    {id:'moon-light',name:'Quiet ascent',detail:'Reach 900 km with no side boosters',target:900000,kind:'bare',reward:240},
    {id:'moon-science',name:'Lunar instruments',detail:'Reach 1800 km carrying a science capsule',target:1800000,kind:'science',reward:320},
  ];
}
export function contractReady(program,contract) {
  const s=assemblySpecs(program),p=program.parts.equipped;
  switch(contract.kind) {
    case 'light': return s.mass<=1.30+1e-9;
    case 'bare': return partById(p.boosters).kick===0;
    case 'staged': return partById(p.boosters).kick>0;
    case 'pointed': return partById(p.aero).shape==='pointed';
    case 'science': return partById(p.aero).shape==='capsule';
    default: return false;
  }
}

// Keep legacy IDs and targets stable. New boards offer one early and one later
// mission, with the same reward budget as the original pair.
const titles=[
  ['Staging debut','Sky arrow'],['Lunar relay','Moon dart'],
  ['Red planet relay','Mars arrow'],['Ceres kickstart','Belt sprinter'],
  ['Europa relay','Ice arrow'],['Titan lifter','Titan dart'],
  ['Triton relay','Cold sprinter'],['Pluto kickstart','Pluto arrow'],
  ['Final relay','Starward dart'],
];
export function missionPool(world) {
  const [early,late]=prototypeContracts(world);
  return [early,late,
    {id:`world-${world}-staged`,name:titles[world][0],detail:`Reach ${early.target/1000} km with side boosters fitted`,target:early.target,kind:'staged',reward:early.reward},
    {id:`world-${world}-pointed`,name:titles[world][1],detail:`Reach ${late.target/1000} km with a pointed fairing`,target:late.target,kind:'pointed',reward:late.reward},
  ];
}
export function contractsFor(run) {
  if(run.missionVersion!==2)return prototypeContracts(run.difficulty);
  // Seed mixing is independent of stock refresh, UI reads, and flight count.
  let x=((run.seed>>>0)^Math.imul(run.difficulty+1,0x9e3779b9))>>>0;
  x^=x<<13;x^=x>>>17;x^=x<<5;
  const pool=missionPool(run.difficulty);
  return [pool[x&1?2:0],pool[x&2?3:1]];
}
