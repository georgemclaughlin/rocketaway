// Prototype equipment: fixed abilities, no extra random affixes. Pure data/logic.
export const PROTOTYPE_RULES = 1;
export const EQUIPMENT_VERSION = 2;
export const EXPERIMENTAL_PARTS = [
  {id:'reserve-tank',slot:'tank',name:'Reserve tank',price:240,tier:2,mass:.44,fuelMass:.28,burn:6,height:60,ability:'reserve',family:'Staging',detail:'6s main fuel + 6s reserve after booster separation. Carries the reserve mass even without boosters.'},
  {id:'separation-engine',slot:'engine',name:'Separation engine',price:620,tier:4,mass:.24,thrust:3.1,efficiency:1.15,shape:'long',ability:'surge',family:'Staging',detail:'After booster separation: double thrust for 5s. Lower thrust before the surge.'},
  {id:'feather-shell',slot:'aero',name:'Feather shell',price:100,tier:2,mass:.04,drag:.014,pay:1,shape:'pointed',ability:'feather',family:'Lightweight',detail:'25% more thrust at or below 1.30t launch mass. Larger tanks or boosters can disable it.'},
  {id:'endurance-engine',slot:'engine',name:'Endurance engine',price:400,tier:4,mass:.16,thrust:2.4,efficiency:1,shape:'long',ability:'endurance',family:'Lightweight',detail:'75% longer burn with no boosters. Light construction, but modest lifting power.'},
  {id:'survey-capsule',slot:'aero',name:'Survey capsule',price:130,tier:2,mass:.15,drag:.017,pay:1,shape:'capsule',ability:'survey',family:'Science',detail:'Earn 90 extra credits for each new altitude milestone. Added payload mass shortens the climb.'},
  {id:'instrument-engine',slot:'engine',name:'Instrument engine',price:560,tier:4,mass:.22,thrust:2.7,efficiency:1,shape:'long',ability:'instrument',family:'Science',detail:'70% longer burn with a Science or Survey capsule. Lower thrust than the Dart engine.'},
  {id:'momentum-engine',slot:'engine',name:'Momentum engine',price:560,tier:4,mass:.26,thrust:3.1,efficiency:1,shape:'long',ability:'momentum',family:'Long burn',equipmentVersion:2,detail:'Thrust builds from 65% to 190% over 10s of burning. Weak at ignition; long tanks or released reserve fuel reward the wait.'},
  {id:'drop-tank',slot:'tank',name:'Drop tank',price:540,tier:4,mass:.62,fuelMass:.32,burn:13,height:80,ability:'drop',family:'Long burn',equipmentVersion:2,detail:'Sheds 0.20t of empty tank halfway through the burn. Heavy at launch, lighter later; all remaining fuel stays aboard. Research also lightens the discarded tank.'},
  {id:'return-boosters',slot:'boosters',name:'Return boosters',price:180,tier:2,mass:.28,kick:1.2,ability:'recovery',family:'Recovery',equipmentVersion:2,detail:'Recover 90 credits after separation if the flight clears a new milestone or its selected contract. Heavier and weaker than Twin kickers. No recovery pay on a miss.'},
];
export const experimentalCatalog=program=>EXPERIMENTAL_PARTS.filter(part=>(part.equipmentVersion||1)<=(program.equipmentVersion||1));
export function companionOffers(program) {
  if(program.equipmentVersion!==2)return [];
  const fitted=Object.values(program.parts.equipped),hasBoosters=program.parts.equipped.boosters!=='bare';
  const partners={
    'reserve-tank':hasBoosters?['separation-engine','momentum-engine']:['return-boosters'],
    'separation-engine':hasBoosters?['reserve-tank']:['return-boosters'],
    'feather-shell':['endurance-engine'],
    'endurance-engine':['feather-shell','drop-tank'],
    'survey-capsule':['instrument-engine','return-boosters'],
    'instrument-engine':['survey-capsule'],
    'momentum-engine':hasBoosters?['reserve-tank','drop-tank']:['drop-tank'],
    'drop-tank':['momentum-engine','endurance-engine'],
    'return-boosters':['reserve-tank','separation-engine','survey-capsule'],
  };
  return [...new Set(fitted.flatMap(id=>partners[id]||[]))].filter(id=>!program.parts.owned.includes(id));
}
export const ABILITY_EVENTS=['Boosters separated','Reserve fuel released','Separation surge · 2× thrust','Momentum engine · full thrust','Empty tank released','Recovery pods deployed'];
export const momentumMultiplier=time=>.65+1.25*Math.min(1,Math.max(0,time)/10);
export function flightAbilityLabel(flight) {
  if(flight.time<flight.surgeUntil)return 'SEPARATION SURGE · 2× THRUST';
  if(flight.momentum&&flight.phase==='powered')return `MOMENTUM · ${Math.round(momentumMultiplier(flight.time)*100)}% THRUST`;
  return flight.events?.at(-1)||'';
}
export function experimentalAssembly(stats,parts,program) {
  if(program.rulesVersion!==PROTOTYPE_RULES)return stats;
  const result={...stats,rulesVersion:PROTOTYPE_RULES},boosters=parts.boosters.kick>0;
  result.reserveSeconds=parts.tank.ability==='reserve'?6*parts.engine.efficiency:0;
  result.reserveRatio=result.reserveSeconds?6/12:0;
  result.hasBoosters=boosters;
  result.surge=parts.engine.ability==='surge'&&boosters;
  result.feather=parts.aero.ability==='feather'&&stats.mass<=1.30+1e-9;
  result.endurance=parts.engine.ability==='endurance'&&!boosters;
  result.instrument=parts.engine.ability==='instrument'&&parts.aero.shape==='capsule';
  result.survey=parts.aero.ability==='survey';
  if(result.feather)result.thrust*=1.25;
  if(result.endurance)result.burn*=1.75;
  if(result.instrument)result.burn*=1.7;
  // Reserve uses the same fuel efficiency as the main tank, including research.
  if(result.reserveSeconds)result.reserveSeconds=result.burn;
  if(program.equipmentVersion===2) {
    result.equipmentVersion=2;
    result.momentum=parts.engine.ability==='momentum';
    // Research modifies all dry mass equally, including the detachable section.
    const baseDry=.5+Object.values(parts).reduce((sum,part)=>sum+part.mass,0)-parts.tank.fuelMass;
    result.dropMass=parts.tank.ability==='drop'?.20*stats.dryMass/baseDry:0;
    result.recovery=parts.boosters.ability==='recovery'?90:0;
  }
  return result;
}
export function abilityDescription(part,stats) {
  if(!part.ability)return '';
  if(part.ability==='reserve')return stats.hasBoosters?'Ready · reserve opens at separation':'Inactive · fit side boosters to use reserve';
  if(part.ability==='surge')return stats.surge?'Ready · 2× thrust for 5s after separation':'Inactive · needs side boosters';
  if(part.ability==='feather')return stats.feather?'Active · +25% thrust below 1.30t':`Inactive · ${stats.mass.toFixed(2)}t exceeds 1.30t`;
  if(part.ability==='endurance')return stats.endurance?'Active · +75% burn without boosters':'Inactive · remove side boosters';
  if(part.ability==='instrument')return stats.instrument?'Active · capsule gives +70% burn':'Inactive · fit a Science or Survey capsule';
  if(part.ability==='momentum')return stats.burn+(stats.hasBoosters?stats.reserveSeconds:0)>10?'Ramps 65% → 190% thrust over 10s':'Short burn · more fuel unlocks full thrust';
  if(part.ability==='drop')return `Sheds ${stats.dropMass.toFixed(2)}t halfway through burn`;
  if(part.ability==='recovery')return 'Recover +90 credits on a successful flight';
  return 'Active · +90 credits per new milestone';
}
