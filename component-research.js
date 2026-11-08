// Permanent engineering choices. This module does not depend on DOM or storage.
const calibration=(slot,name,description)=>({id:`${slot}-calibration`,slot,kind:'calibration',name,description,cost:3});
const tuning=(slot,id,name,description)=>({id,slot,kind:'tuning',name,description,cost:5});
export const COMPONENT_RESEARCH=[
  {id:'engine',name:'Engine',calibration:calibration('engine','Improved combustion','3% more engine thrust.'),tunings:[
    tuning('engine','pressure-feed','High-pressure feed','12% more thrust; 10% shorter burn.'),
    tuning('engine','cruise-feed','Cruise feed','12% longer burn; 8% less thrust.'),
  ]},
  {id:'tank',name:'Tank',calibration:calibration('tank','Refined tank walls','5% less tank dry mass; fuel unchanged.'),tunings:[
    tuning('tank','light-shell','Light shell','25% less tank dry mass; 5% less fuel and shorter burn.'),
    tuning('tank','extended-reservoir','Extended reservoir','10% more fuel and longer burn; 40% more tank dry mass.'),
  ]},
  {id:'aero',name:'Aero',calibration:calibration('aero','Refined structure','5% less aero-section mass.'),tunings:[
    tuning('aero','streamlined-shell','Streamlined shell','14% less drag; 12% more aero-section mass.'),
    tuning('aero','minimal-shell','Minimal shell','20% less aero-section mass; 16% more drag.'),
  ]},
  {id:'boosters',name:'Boosters',calibration:calibration('boosters','Refined nozzles','4% stronger booster impulse.'),tunings:[
    tuning('boosters','high-impulse','High impulse','12% stronger booster impulse; 15% more booster mass.'),
    tuning('boosters','light-casings','Light casings','20% less booster mass; 10% weaker booster impulse.'),
  ]},
];
export const COMPONENT_NODES=COMPONENT_RESEARCH.flatMap(section=>[section.calibration,...section.tunings]);
const SLOTS=['aero','tank','engine','boosters'];
export const componentNode=id=>COMPONENT_NODES.find(node=>node.id===id)||null;
export function normalizeComponentUnlocks(raw) {
  const ids=Array.isArray(raw)?raw:[];
  return COMPONENT_NODES.filter(node=>ids.includes(node.id)&&(node.kind==='calibration'||ids.includes(`${node.slot}-calibration`))).map(node=>node.id);
}
export function normalizeTunings(raw,unlocks) {
  const owned=normalizeComponentUnlocks(unlocks);
  return Object.fromEntries(SLOTS.map(slot=>{
    const node=componentNode(raw?.[slot]);
    return [slot,node?.kind==='tuning'&&node.slot===slot&&owned.includes(node.id)?node.id:'standard'];
  }));
}
export function componentResearchSnapshot(program) {
  if(program?.componentResearchVersion!==1||program.rulesVersion!==1)return {};
  const componentResearch=normalizeComponentUnlocks(program.componentResearch);
  return {componentResearchVersion:1,componentResearch,tunings:normalizeTunings(program.tunings,componentResearch)};
}
export function resolveComponentParts(program,parts) {
  const result=Object.fromEntries(Object.entries(parts).map(([slot,part])=>[slot,{...part}]));
  if(program.componentResearchVersion!==1||program.rulesVersion!==1)return result;
  const owned=normalizeComponentUnlocks(program.componentResearch),tunings=normalizeTunings(program.tunings,owned);
  if(owned.includes('engine-calibration'))result.engine.thrust*=1.03;
  if(tunings.engine==='pressure-feed'){result.engine.thrust*=1.12;result.engine.efficiency*=.90;}
  if(tunings.engine==='cruise-feed'){result.engine.thrust*=.92;result.engine.efficiency*=1.12;}
  let tankDry=1,tankFuel=1;
  if(owned.includes('tank-calibration'))tankDry*=.95;
  if(tunings.tank==='light-shell'){tankDry*=.75;tankFuel*=.95;}
  if(tunings.tank==='extended-reservoir'){tankDry*=1.40;tankFuel*=1.10;}
  const dry=result.tank.mass-result.tank.fuelMass;
  result.tank.fuelMass*=tankFuel;result.tank.mass=dry*tankDry+result.tank.fuelMass;result.tank.burn*=tankFuel;
  // Experimental tanks shed only their dry structure, with this same scoped reduction.
  result.tank.componentDryFactor=tankDry;
  if(owned.includes('aero-calibration'))result.aero.mass*=.95;
  if(tunings.aero==='streamlined-shell'){result.aero.drag*=.86;result.aero.mass*=1.12;}
  if(tunings.aero==='minimal-shell'){result.aero.mass*=.80;result.aero.drag*=1.16;}
  if(owned.includes('boosters-calibration'))result.boosters.kick*=1.04;
  if(tunings.boosters==='high-impulse'){result.boosters.kick*=1.12;result.boosters.mass*=1.15;}
  if(tunings.boosters==='light-casings'){result.boosters.mass*=.80;result.boosters.kick*=.90;}
  return result;
}
