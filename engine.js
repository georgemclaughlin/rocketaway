import { newInventory, restoreInventory } from './parts.js?v=flight-feel-1';
import { momentumMultiplier } from './experimental.js?v=flight-feel-1';
export const GOAL = 100000;
export const SAVE_KEY = 'rocket-away-program-v1';
export const UPGRADES = [
  { id: 'engine', name: 'Engine', icon: '↟', description: 'More thrust. More sky.', baseCost: 70, max: 6 },
  { id: 'tank', name: 'Fuel tank', icon: '▥', description: 'Keep the good part going.', baseCost: 60, max: 6 },
  { id: 'aero', name: 'Aerodynamics', icon: '◇', description: 'Less drag. A longer coast.', baseCost: 50, max: 6 },
  { id: 'boosters', name: 'Side boosters', icon: '⇈', description: 'An automatic midflight kick.', baseCost: 90, max: 6 },
];
export const MILESTONES = [
  { altitude: 10000, label: 'Above the clouds', reward: 150 },
  { altitude: 25000, label: 'Into the stratosphere', reward: 300 },
  { altitude: 50000, label: 'Halfway to space', reward: 600 },
  { altitude: GOAL, label: 'Hello, outer space', reward: 1200 },
  { altitude: 200000, label: 'Satellite country', reward: 2000 },
];
export const PLANS = [
  { id: 'explorer', name: 'Explorer', icon: '◇', color: '#f6d47b', description: 'Chase altitude. A streamlined hull helps you coast higher.', tradeoff: '25% less drag · 15% less altitude pay', thrust: 1, burn: 1, drag: .75, pay: .85 },
  { id: 'research', name: 'Research', icon: '⌁', color: '#91d8c6', description: 'Fund your next big upgrade with a heavier science payload.', tradeoff: '55% more altitude pay · 10% less thrust', thrust: .9, burn: 1, drag: 1, pay: 1.55 },
  { id: 'hotrod', name: 'Hot rod', icon: '↟', color: '#f0a090', description: 'Burn bright. Pair this thirsty engine with a bigger tank.', tradeoff: '25% more thrust · 18% shorter burn', thrust: 1.25, burn: .82, drag: 1, pay: 1 },
];
const CONTRACTS = [
  { title: 'Clean ignition', detail: 'Launch at 114% power or better', type: 'quality', target: 1.14, reward: 70 },
  { title: 'Cloud chaser', detail: 'Reach 5 km in one flight', type: 'altitude', target: 5000, reward: 90 },
  { title: 'Science delivery', detail: 'Reach 3 km with a Science capsule', type: 'science', target: 3000, reward: 120 },
  { title: 'Look, no engines', detail: 'Coast for at least 3 seconds', type: 'coast', target: 3, reward: 130 },
  { title: 'Stratosphere express', detail: 'Reach 25 km in one flight', type: 'altitude', target: 25000, reward: 200 },
  { title: 'Above the clouds', detail: 'Reach 15 km in one flight', type: 'altitude', target: 15000, reward: 150 },
  { title: 'Needle in the gold', detail: 'Launch at 118% power or better', type: 'quality', target: 1.18, reward: 180 },
  { title: 'Staged ascent', detail: 'Reach 30 km with side boosters', type: 'boosters', target: 30000, reward: 250 },
  { title: 'Space mail', detail: 'Reach 100 km', type: 'altitude', target: 100000, reward: 600 },
];
export function currentContract(program) {
  return { ...CONTRACTS[program.contracts % CONTRACTS.length], index: program.contracts };
}
export function missionGoal(program) { return program.best >= GOAL ? 200000 : GOAL; }
export function flightPlan(id) { return PLANS.find(plan => plan.id === id) || PLANS[0]; }
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function newProgram() {
  return { credits: 0, best: 0, flights: 0, levels: { engine: 0, tank: 0, aero: 0, boosters: 0 }, milestones: [], won: false, plan: 'explorer', contracts: 0, eventPreference: 'performance', parts: newInventory() };
}
export function restoreProgram(raw) {
  const save = newProgram();
  if (!raw || typeof raw !== 'object') return save;
  for (const key of ['credits', 'best', 'flights', 'contracts']) if (Number.isFinite(raw[key])) save[key] = clamp(Math.floor(raw[key]), 0, 1e9);
  save.plan = flightPlan(raw.plan).id;
  save.eventPreference = raw.eventPreference === 'credits' ? 'credits' : 'performance';
  for (const upgrade of UPGRADES) {
    const value = raw.levels?.[upgrade.id];
    if (Number.isFinite(value)) save.levels[upgrade.id] = clamp(Math.floor(value), 0, upgrade.max);
  }
  save.milestones = MILESTONES.filter(m => Array.isArray(raw.milestones) && raw.milestones.includes(m.altitude)).map(m => m.altitude);
  save.won = save.best >= GOAL;
  save.parts = restoreInventory(raw.parts, save.levels);
  return save;
}
export function upgradeCost(program, id) {
  const item = UPGRADES.find(item => item.id === id);
  if (!item || program.levels[id] >= item.max) return null;
  return Math.round(item.baseCost * 1.65 ** program.levels[id] / 5) * 5;
}
export function buyUpgrade(program, id) {
  const cost = upgradeCost(program, id);
  if (cost === null || program.credits < cost) return false;
  program.credits -= cost; program.levels[id] += 1; return true;
}
export function specs(levels, planId) {
  const plan = planId ? flightPlan(planId) : { thrust: 1, burn: 1, drag: 1 };
  return { thrust: (.8 + levels.engine * .34) * plan.thrust, burn: (4 + levels.tank * 1.15) * plan.burn, drag: .018 / (1 + levels.aero * .65) * plan.drag, kick: levels.boosters * .8 };
}
export function launchQuality(position) { return 1.2 - Math.abs(clamp(position, 0, 1) - .5) * .6; }
export function createFlight(levels, quality = 1, options = {}) {
  let stats = specs(levels, options.plan);
  if (options.assembly) {
    const plan = flightPlan(options.plan);
    stats = { ...options.assembly, thrust: options.assembly.thrust * plan.thrust, burn: options.assembly.burn * plan.burn, drag: options.assembly.drag * plan.drag };
  }
  return { ...stats, quality: clamp(quality, .9, 1.2), time: 0, altitude: 0, velocity: 0, peak: 0, fuel: 1, boosted: false, phase: 'powered', done: false, settled: false,
    ...(stats.rulesVersion===1?{separationAt:stats.burn*.6,mainBurn:stats.burn,reserveOpened:false,surgeUntil:0,events:[]} : {}),
    ...(stats.equipmentVersion===2?{dropAt:stats.burn*.5,dropReleased:false,momentumFull:false,recovered:false}:{}),
    plan: options.plan || 'standard', payMultiplier: (options.plan ? flightPlan(options.plan).pay : 1) * (options.assembly?.pay || 1), contractIndex: options.contractIndex ?? null,
    encounterId: Number.isInteger(options.encounterId) ? options.encounterId % 3 : null, encounterAt: stats.burn * .55, encountered: false, pendingEncounter: null,
    salvage: 0, choice: null, power: options.assembly?.power ?? Object.values(levels).reduce((sum, level) => sum + level, 0), coastTime: 0 };
}
export function encounterDetails(flight) {
  const pay = 40 + flight.power * 7;
  return [
    { icon: '≋', title: 'A perfect updraft.', description: 'A rising current is carrying something interesting.', choices: [{ title: 'Ride the current', effect: 'Extra upward speed', type: 'lift' }, { title: 'Scan the current', effect: `+${pay} credits`, type: 'credits' }], pay },
    { icon: '▧', title: 'Supply drone incoming.', description: 'Mission control has a little something for you.', choices: [{ title: 'Take the fuel', effect: '20% longer engine burn', type: 'fuel' }, { title: 'Collect the parts', effect: `+${pay} credits`, type: 'credits' }], pay },
    { icon: '✧', title: 'An unusual signal.', description: 'Your instruments are picking up a pocket of energy.', choices: [{ title: 'Charge the engine', effect: '12% more thrust', type: 'thrust' }, { title: 'Record the signal', effect: `+${pay} credits`, type: 'credits' }], pay },
  ][flight.encounterId ?? 0];
}
export function resolveEncounter(flight, choice = 0) {
  if (!flight.pendingEncounter || ![0, 1].includes(choice)) return false;
  const encounter = encounterDetails(flight), option = encounter.choices[choice];
  if (option.type === 'lift') flight.velocity += .65 + flight.power * .035;
  if (option.type === 'fuel') flight.burn *= 1.2;
  if (option.type === 'thrust') flight.thrust *= 1.12;
  if (option.type === 'credits') flight.salvage += encounter.pay;
  flight.choice = option.type;
  flight.pendingEncounter = null;
  return true;
}
export function stepFlight(flight, elapsed) {
  if (flight.done || flight.pendingEncounter) return;
  let remaining = clamp(elapsed, 0, 1);
  while (remaining > 0 && !flight.done) {
    const dt = Math.min(remaining, 1 / 120); remaining -= dt;
    flight.time += dt;
    if(flight.rulesVersion===1) {
      if(!flight.boosted&&flight.time>=flight.separationAt) {
        flight.boosted=true;
        if(flight.hasBoosters) {
          flight.velocity+=flight.kick;flight.dryMass-=flight.stageMass;
          flight.events.push('Boosters separated');
          if(flight.recovery){flight.recovered=true;flight.events.push('Recovery pods deployed');}
          if(flight.reserveSeconds) {flight.reserveOpened=true;flight.burn+=flight.reserveSeconds;flight.events.push('Reserve fuel released');}
          if(flight.surge) {flight.surgeUntil=flight.time+5;flight.events.push('Separation surge · 2× thrust');}
        }
      }
      const powered=flight.time<flight.burn;
      if(flight.dropMass&&!flight.dropReleased&&flight.time>=flight.dropAt) {
        flight.dropReleased=true;flight.dryMass-=flight.dropMass;flight.events.push('Empty tank released');
      }
      if(flight.momentum&&powered&&!flight.momentumFull&&flight.time>=10) {
        flight.momentumFull=true;flight.events.push('Momentum engine · full thrust');
      }
      if(!powered)flight.coastTime+=dt;
      const reserve=flight.reserveRatio||0;
      const totalBurn=flight.mainBurn+(flight.reserveSeconds||0);
      // Inaccessible reserve stays aboard; accessible fuel drains at a constant rate.
      const consumed=flight.reserveOpened?Math.min(1,flight.time/totalBurn):(1-reserve)*Math.min(1,flight.time/flight.mainBurn);
      flight.fuel=Math.max(0,1-consumed);
      const massFactor=flight.mass/(flight.dryMass+flight.fuelMass*flight.fuel);
      const surge=flight.time<flight.surgeUntil?2:1;
      const ramp=flight.momentum?momentumMultiplier(flight.time):1;
      const acceleration=(powered?flight.thrust*massFactor*flight.quality*surge*ramp:0)-flight.gravity-flight.drag*flight.velocity*Math.abs(flight.velocity);
      flight.velocity+=acceleration*dt;flight.altitude=Math.max(0,flight.altitude+flight.velocity*dt*500);
      flight.peak=Math.max(flight.peak,flight.altitude);flight.phase=powered?'powered':'coasting';
      if(!powered&&flight.velocity<=0){flight.done=true;flight.phase='complete';}
      continue;
    }
    const powered = flight.time < flight.burn;
    if (!powered) flight.coastTime += dt;
    if (!flight.boosted && flight.time >= flight.burn * .6) { flight.velocity += flight.kick; flight.boosted = true; if (flight.dryMass) flight.dryMass -= flight.stageMass; }
    const massFactor = flight.mass ? flight.mass / (flight.dryMass + flight.fuelMass * flight.fuel) : 1;
    const acceleration = (powered ? flight.thrust * massFactor * flight.quality : 0) - (flight.gravity??.5) - flight.drag * flight.velocity * Math.abs(flight.velocity);
    flight.velocity += acceleration * dt;
    flight.altitude = Math.max(0, flight.altitude + flight.velocity * dt * 500);
    flight.peak = Math.max(flight.peak, flight.altitude);
    flight.fuel = Math.max(0, 1 - flight.time / flight.burn);
    flight.phase = powered ? 'powered' : 'coasting';
    if (!powered && flight.velocity <= 0) { flight.done = true; flight.phase = 'complete'; }
    if (flight.encounterId !== null && !flight.encountered && flight.time >= flight.encounterAt && !flight.done) {
      flight.encountered = true; flight.pendingEncounter = encounterDetails(flight); break;
    }
  }
}
export function settleFlight(program, flight) {
  if (!flight.done || flight.settled) return null;
  flight.settled = true;
  const altitude = Math.floor(flight.peak);
  const earnedMilestones = MILESTONES.filter(m => altitude >= m.altitude && !program.milestones.includes(m.altitude));
  const flightPay = 45 + Math.floor(altitude / 130 * flight.payMultiplier);
  const bonus = earnedMilestones.reduce((sum, m) => sum + m.reward, 0);
  const record = altitude > program.best;
  const firstWin = altitude >= GOAL && !program.won;
  const improvement = Math.max(0, altitude - program.best);
  const contract = currentContract(program);
  const met = contract.type === 'quality' ? flight.quality >= contract.target : contract.type === 'altitude' ? altitude >= contract.target : contract.type === 'coast' ? flight.coastTime >= contract.target : contract.type === 'science' ? flight.pay > 1 && altitude >= contract.target : contract.type === 'boosters' ? flight.kick > 0 && altitude >= contract.target : false;
  const contractCompleted = flight.contractIndex === contract.index && met;
  const contractPay = contractCompleted ? contract.reward : 0;
  if (contractCompleted) program.contracts += 1;
  const total = flightPay + bonus + flight.salvage + contractPay;
  program.credits += total; program.flights += 1;
  program.best = Math.max(program.best, altitude);
  program.milestones.push(...earnedMilestones.map(m => m.altitude));
  program.won ||= altitude >= GOAL;
  return { altitude, flightPay, bonus, salvage: flight.salvage, contractPay, contract: contractCompleted ? contract : null, total, milestones: earnedMilestones, record, firstWin, improvement, firstOrbit: earnedMilestones.some(m => m.altitude === 200000) };
}
