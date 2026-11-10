import { discoveryAssembly } from './discoveries.js?v=discovery-4';
import { resolveComponentParts } from './component-research.js?v=discovery-4';
import { modifyAssembly } from './modifiers.js?v=discovery-4';
import { researchModifiers } from './research.js?v=discovery-4';
import { flightConditions } from './worlds.js?v=discovery-4';
import { EXPERIMENTAL_PARTS, experimentalAssembly, experimentalCatalog } from './experimental.js?v=discovery-4';
export const PART_SLOTS = [
  { id: 'aero', name: 'Nose cone', icon: '◇' },
  { id: 'tank', name: 'Fuel tank', icon: '▥' },
  { id: 'engine', name: 'Engine', icon: '↟' },
  { id: 'boosters', name: 'Side boosters', icon: '⇈' },
];
export const PARTS = [
  { id:'cap', slot:'aero', name:'Round cap', price:0, tier:0, mass:.10, drag:.018, pay:1, shape:'round', detail:'A simple, dependable nose cone.' },
  { id:'needle', slot:'aero', name:'Needle fairing', price:90, tier:2, mass:.08, drag:.010, pay:1, shape:'pointed', detail:'Light and slippery. Built for altitude.' },
  { id:'lab', slot:'aero', name:'Science capsule', price:300, tier:4, mass:.30, drag:.016, pay:1.5, shape:'capsule', detail:'50% more altitude credits, with extra weight and drag.' },
  { id:'ceramic', slot:'aero', name:'Ceramic fairing', price:850, tier:6, mass:.16, drag:.006, pay:1, shape:'pointed', detail:'Very low drag for long coasts into space.' },
  { id:'pocket', slot:'tank', name:'Pocket tank', price:0, tier:0, mass:.22, fuelMass:.10, burn:4, height:32, detail:'Light enough for your first little engine.' },
  { id:'long', slot:'tank', name:'Long tank', price:100, tier:2, mass:.37, fuelMass:.22, burn:7, height:55, detail:'More fuel, but your engine has more to lift.' },
  { id:'composite', slot:'tank', name:'Composite tank', price:360, tier:4, mass:.33, fuelMass:.20, burn:10, height:75, detail:'Lightweight construction. A useful all-rounder.' },
  { id:'jumbo', slot:'tank', name:'Jumbo tank', price:1000, tier:6, mass:.90, fuelMass:.60, burn:15, height:100, detail:'A huge fuel supply. Bring a strong engine.' },
  { id:'spark', slot:'engine', name:'Spark engine', price:0, tier:0, mass:.18, thrust:.80, efficiency:1, shape:'single', detail:'Small, light, and just enough to leave the pad.' },
  { id:'ember', slot:'engine', name:'Ember engine', price:120, tier:2, mass:.24, thrust:1.50, efficiency:1, shape:'single', detail:'A reliable step up in lifting power.' },
  { id:'dart', slot:'engine', name:'Dart engine', price:420, tier:4, mass:.22, thrust:2.80, efficiency:1.2, shape:'long', detail:'Efficient and light. Squeezes 20% more burn from a tank.' },
  { id:'mammoth', slot:'engine', name:'Mammoth cluster', price:1200, tier:6, mass:.65, thrust:6.20, efficiency:.9, shape:'cluster', detail:'Enormous thrust, but heavy and 10% thirstier.' },
  { id:'bare', slot:'boosters', name:'No boosters', price:0, tier:0, mass:0, kick:0, detail:'Keep the rocket light. No extra stage.' },
  { id:'twins', slot:'boosters', name:'Twin kickers', price:140, tier:2, mass:.16, kick:1.3, detail:'A small automatic boost, then the empty pods detach.' },
  { id:'solids', slot:'boosters', name:'Solid boosters', price:480, tier:4, mass:.36, kick:3.2, detail:'A powerful kick. Heavier until the stage separates.' },
  { id:'orbitals', slot:'boosters', name:'Orbital boosters', price:1300, tier:6, mass:.40, kick:5.5, detail:'A big midflight push to reach satellite country.' },
];
// Run-specific bonuses belong to physical parts and stay fixed for the whole run.
export const PART_TRAITS = [
  {id:'light',name:'Lightweight',detail:'20% less dry weight',slots:['aero','tank','engine','boosters'],stat:'mass',factor:.8},
  {id:'thrust',name:'Tuned',detail:'15% more thrust',slots:['engine'],stat:'thrust',factor:1.15},
  {id:'efficient',name:'Efficient',detail:'15% longer engine burn',slots:['engine'],stat:'efficiency',factor:1.15},
  {id:'capacity',name:'Extra capacity',detail:'15% more fuel',slots:['tank'],stat:'burn',factor:1.15},
  {id:'smooth',name:'Streamlined',detail:'20% less drag',slots:['aero'],stat:'drag',factor:.8},
  {id:'science',name:'Survey bonus',detail:'25% more altitude credits',slots:['aero'],stat:'pay',factor:1.25},
  {id:'kick',name:'High output',detail:'20% more booster kick',slots:['boosters'],stat:'kick',factor:1.2},
];
export function restorePartTraits(raw) {
  return Object.fromEntries(PARTS.filter(part => part.price > 0 && PART_TRAITS.some(trait => trait.id === raw?.[part.id] && trait.slots.includes(part.slot))).map(part => [part.id, raw[part.id]]));
}
export function partForProgram(program, id) {
  const part = partById(id);
  if (!part) return null;
  const trait = PART_TRAITS.find(trait => trait.id === program.partTraits?.[id] && trait.slots.includes(part.slot));
  if (!trait) return part;
  const result = {...part, trait, [trait.stat]: part[trait.stat] * trait.factor};
  // Capacity adds fuel mass too; a lightweight tank retains its original fuel capacity.
  if (trait.id === 'capacity') { result.fuelMass *= trait.factor; result.mass += result.fuelMass-part.fuelMass; }
  if (trait.id === 'light' && part.fuelMass) result.mass = (part.mass-part.fuelMass)*trait.factor+part.fuelMass;
  return result;
}
export function partById(id) { return PARTS.find(part => part.id === id) || EXPERIMENTAL_PARTS.find(part=>part.id===id); }
export function catalogFor(program) { return program.rulesVersion===1?[...PARTS,...experimentalCatalog(program)]:PARTS; }
export function newInventory() {
  const starters=PARTS.filter(part=>part.price===0);
  return {owned:starters.map(part=>part.id),equipped:Object.fromEntries(starters.map(part=>[part.slot,part.id]))};
}
export function restoreInventory(raw, legacyLevels={}) {
  const inventory=newInventory();
  if (!raw || typeof raw !== 'object') {
    for (const slot of PART_SLOTS) {
      const level=legacyLevels[slot.id] || 0;
      if (!level) continue;
      const tier=slot.id==='aero' && level>2 ? 6 : Math.min(6,Math.ceil(level/2)*2);
      const unlocked=PARTS.filter(part=>part.slot===slot.id && part.tier<=tier);
      for(const part of unlocked) if(!inventory.owned.includes(part.id)) inventory.owned.push(part.id);
      inventory.equipped[slot.id]=unlocked.at(-1).id;
    }
    return inventory;
  }
  for(const id of Array.isArray(raw.owned)?raw.owned:[]) if(partById(id) && !inventory.owned.includes(id)) inventory.owned.push(id);
  for(const slot of PART_SLOTS) {
    const part=partById(raw.equipped?.[slot.id]);
    if(part?.slot===slot.id && inventory.owned.includes(part.id)) inventory.equipped[slot.id]=part.id;
  }
  return inventory;
}
export function fitPart(program,id) {
  const part=partById(id);
  if(!part || !catalogFor(program).some(candidate=>candidate.id===id)) return false;
  if(Array.isArray(program.stock)&&!program.stock.includes(id)&&!program.parts.owned.includes(id))return false;
  if(!program.parts.owned.includes(id)) {
    if(program.credits<part.price) return false;
    program.credits-=part.price; program.parts.owned.push(id);
  }
  program.parts.equipped[part.slot]=id;
  return true;
}
export function fittedParts(program) {
  return Object.fromEntries(PART_SLOTS.map(slot=>[slot.id,partForProgram(program,program.parts.equipped[slot.id])]));
}
export function assemblySpecs(program) {
  const parts=resolveComponentParts(program,fittedParts(program)), research=researchModifiers(program), baseMass=.5+Object.values(parts).reduce((sum,part)=>sum+part.mass,0);
  const mass=(baseMass-parts.tank.fuelMass)*research.dry+parts.tank.fuelMass,conditions=flightConditions(program.launchWorld,program.conditionsVersion??1);
  return discoveryAssembly(experimentalAssembly(modifyAssembly({thrust:parts.engine.thrust/mass,burn:parts.tank.burn*parts.engine.efficiency*research.burn,drag:parts.aero.drag*conditions.drag,gravity:conditions.gravity,kick:parts.boosters.kick/mass*research.kick*(program.conditionsVersion>=2?4:1),
    mass,dryMass:mass-parts.tank.fuelMass,fuelMass:parts.tank.fuelMass,stageMass:parts.boosters.mass*.8*research.dry,pay:parts.aero.pay*research.pay,
    power:Object.values(parts).reduce((sum,part)=>sum+part.tier,0)},parts,program),parts,program),parts,program);
}
export function partStats(part) {
  const weight=`${part.mass.toFixed(2)} t`;
  if(part.slot==='engine')return `${part.thrust.toFixed(1)} thrust · ${Math.round(part.efficiency*100)}% efficiency · ${weight}`;
  if(part.slot==='tank')return `${part.burn}s fuel · ${weight}`;
  if(part.slot==='aero')return `${Math.round(part.drag/.018*100)}% drag${part.pay>1?' · +50% pay':''} · ${weight}`;
  return `${part.kick?part.kick.toFixed(1)+' kick':'No staging'} · ${weight}`;
}
