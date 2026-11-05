import { newProgram } from './engine.js?v=flight-feel-1';
import { partById, fittedParts } from './parts.js?v=flight-feel-1';
import { researchLoadout } from './research.js?v=flight-feel-1';

export function kitDetails(kit,profile) {
 const loadout=researchLoadout(profile,kit),program=newProgram();
 for(const id of loadout.parts)program.parts.equipped[partById(id).slot]=id;
 const parts=fittedParts(program),short=part=>part.name.replace(/ engine| boosters| fairing/g,'');
 const equipment=kit.id==='scientist'?[parts.engine,parts.aero]:kit.id==='stager'?[parts.tank.id==='pocket'?parts.engine:parts.tank,parts.boosters]:[parts.engine,parts.tank];
 const benefit=kit.id==='scientist'?'Capsule: +50% altitude credits':kit.id==='stager'?`Automatic boost${loadout.rank?` · +${loadout.rank*6}% power`:''}`:loadout.rank?`${loadout.rank*3}% lighter frame`:'Flexible starting budget';
 return {parts,equipment:equipment.map(short).join(' · '),benefit};
}
