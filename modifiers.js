export const MODULES = [
  {id:'feather',name:'Feather frame',icon:'◇',detail:'20% less dry mass. Lighter rockets lift harder.',tag:'LIGHTWEIGHT'},
  {id:'afterburner',name:'Afterburner',icon:'↟',detail:'30% more thrust, but 15% less engine burn.',tag:'POWER'},
  {id:'recycler',name:'Fuel recycler',icon:'♲',detail:'With side boosters fitted: 35% longer engine burn.',tag:'BOOSTER COMBO'},
  {id:'slipstream',name:'Slipstream skin',icon:'≋',detail:'Long or Composite tank: 45% less drag. Other tanks: 15% less.',tag:'TANK COMBO'},
  {id:'grant',name:'Research grant',icon:'⌁',detail:'Science capsule: double altitude pay. Other noses: 20% more.',tag:'SCIENCE COMBO'},
  {id:'ion',name:'Ion coil',icon:'◎',detail:'Dart engine: 40% more thrust. Other engines: 12% more.',tag:'ENGINE COMBO'},
  {id:'solids',name:'Stage amplifier',icon:'⇈',detail:'Side boosters deliver 75% more upward kick.',tag:'BOOSTER COMBO'},
  {id:'vacuum',name:'Vacuum shell',icon:'◌',detail:'35% less drag. Coast further after the fuel runs out.',tag:'COAST'},
  {id:'reserve',name:'Deep reserves',icon:'▥',detail:'Jumbo tank: 40% longer burn. Other tanks: 15% longer.',tag:'TANK COMBO'},
  {id:'nimble',name:'Small but mighty',icon:'✧',detail:'Below 1.5 tonnes: 35% more thrust. Heavier rockets: 10% more.',tag:'LIGHTWEIGHT'},
  {id:'salvager',name:'Salvage crew',icon:'⚒',detail:'Every launch earns 90 extra credits, even a miss.',tag:'ECONOMY'},
  {id:'coolant',name:'Cryo cooling',icon:'❄',detail:'20% longer engine burn and 8% more thrust.',tag:'ENDURANCE'},
];
export const ROUTES = [
  {id:'clear',name:'Clear skies',icon:'☀',detail:'Normal conditions. A reliable way through.',target:1,bonus:0,drag:1,burn:1,thrust:1},
  {id:'thin',name:'Thin atmosphere',icon:'◌',detail:'30% less drag, but the checkpoint is 15% higher.',target:1.15,bonus:60,drag:.7,burn:1,thrust:1},
  {id:'headwind',name:'Storm front',icon:'≋',detail:'35% more drag. Extra pay if you clear it.',target:1,bonus:160,drag:1.35,burn:1,thrust:1},
  {id:'cold',name:'Frozen sky',icon:'❄',detail:'20% less burn time. A shorter climb for less pay.',target:.75,bonus:-50,drag:1,burn:.8,thrust:1},
  {id:'slingshot',name:'Updraft corridor',icon:'↟',detail:'20% more thrust. A checkpoint 30% higher.',target:1.3,bonus:110,drag:1,burn:1,thrust:1.2},
  {id:'longhaul',name:'Long haul',icon:'✦',detail:'Normal conditions, but a 25% higher checkpoint.',target:1.25,bonus:180,drag:1,burn:1,thrust:1},
];
export function modifyAssembly(stats, parts, program) {
  const result={...stats};
  if((program.relics||[]).includes('feather')) {const mass=result.fuelMass+result.dryMass*.8;result.thrust*=result.mass/mass;result.kick*=result.mass/mass;result.mass=mass;result.dryMass*=.8;result.stageMass*=.8;}
  for(const id of program.relics || []) {
    if(id==='afterburner'){result.thrust*=1.3;result.burn*=.85;}
    if(id==='recycler'&&parts.boosters.kick)result.burn*=1.35;
    if(id==='slipstream')result.drag*= ['long','composite'].includes(parts.tank.id)?.55:.85;
    if(id==='grant')result.pay*=parts.aero.id==='lab'?2:1.2;
    if(id==='ion')result.thrust*=parts.engine.id==='dart'?1.4:1.12;
    if(id==='solids')result.kick*=1.75;
    if(id==='vacuum')result.drag*=.65;
    if(id==='reserve')result.burn*=parts.tank.id==='jumbo'?1.4:1.15;
    if(id==='nimble')result.thrust*=result.mass<1.5?1.35:1.1;
    if(id==='salvager')result.creditBonus=(result.creditBonus||0)+90;
    if(id==='coolant'){result.burn*=1.2;result.thrust*=1.08;}
  }
  const route=ROUTES.find(route=>route.id===program.route);
  if(route){result.drag*=route.drag;result.burn*=route.burn;result.thrust*=route.thrust;}
  return result;
}
