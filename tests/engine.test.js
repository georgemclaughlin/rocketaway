import test from 'node:test';
import {assemblySpecs,fitPart} from '../parts.js';
import assert from 'node:assert/strict';
import { GOAL, UPGRADES, MILESTONES, newProgram, restoreProgram, upgradeCost, buyUpgrade, launchQuality, createFlight, stepFlight, settleFlight, resolveEncounter, currentContract, missionGoal } from '../engine.js';
const fly = (levels, quality = 1.1, dt = 1 / 60, options = {}) => {
  const flight = createFlight(levels, quality, options);
  for (let i = 0; !flight.done && i < 20000; i++) { stepFlight(flight, dt); if (flight.pendingEncounter) resolveEncounter(flight, options.encounterChoice ?? 0); }
  assert.ok(flight.done, 'Flights must end at apogee');
  return flight;
};
test('a starter rocket finishes, earns an affordable upgrade, and has room to improve', () => {
  const program = newProgram(), flight = fly(program.levels, .9);
  assert.ok(flight.peak > 1000 && flight.peak < 10000);
  const result = settleFlight(program, flight);
  assert.ok(result.total >= upgradeCost(program, 'aero'));
  assert.equal(program.flights, 1); assert.equal(program.best, result.altitude);
});
test('each upgrade improves peak altitude with identical launch timing', () => {
  const levels = newProgram().levels, baseline = fly(levels).peak;
  for (const item of UPGRADES) assert.ok(fly({ ...levels, [item.id]: 1 }).peak > baseline, item.id);
});
test('launch timing rewards the center, but the edges still produce viable flights', () => {
  assert.equal(launchQuality(.5), 1.2);
  assert.ok(launchQuality(0) >= .89);
  const levels = newProgram().levels;
  assert.ok(fly(levels, launchQuality(.5)).peak > fly(levels, launchQuality(0)).peak);
});
test('purchases enforce affordability, deduct the price, and respect max levels', () => {
  const program = newProgram(); assert.equal(buyUpgrade(program, 'engine'), false);
  assert.equal(buyUpgrade(program, 'unknown'), false);
  program.credits = 10000;
  for (let i = 0; i < 6; i++) { const cost = upgradeCost(program, 'engine'), before = program.credits; assert.equal(buyUpgrade(program, 'engine'), true); assert.equal(program.credits, before - cost); }
  assert.equal(upgradeCost(program, 'engine'), null);
  assert.equal(buyUpgrade(program, 'engine'), false); assert.equal(program.levels.engine, 6);
});
test('rewards settle once and milestone bonuses cannot be collected twice', () => {
  const program = newProgram(), levels = { engine: 6, tank: 6, aero: 6, boosters: 6 };
  const flight = fly(levels, 1.2, 1 / 60, { plan: 'explorer', encounterId: 1 }), first = settleFlight(program, flight);
  assert.ok(first.firstWin); assert.equal(first.milestones.length, MILESTONES.length);
  const balance = program.credits;
  assert.equal(settleFlight(program, flight), null); assert.equal(program.credits, balance);
  const again = settleFlight(program, fly(levels, 1.2, 1 / 60, { plan: 'explorer', encounterId: 1 })); assert.equal(again.bonus, 0); assert.equal(again.firstWin, false);
});
test('unfinished flights cannot pay out', () => {
  const program = newProgram(); assert.equal(settleFlight(program, createFlight(program.levels)), null); assert.equal(program.credits, 0);
});
test('save loading repairs invalid values and preserves a valid campaign', () => {
  const program = newProgram(); program.credits = 125; program.levels.tank = 2; program.flights = 3;
  assert.deepEqual(restoreProgram(JSON.parse(JSON.stringify(program))), program);
  const corrupt = restoreProgram({ credits: -10, best: 'invalid', flights: Infinity, levels: { engine: 99, tank: -4, aero: '4' }, milestones: [10000, 999], won: true });
  assert.equal(corrupt.credits, 0); assert.equal(corrupt.best, 0); assert.equal(corrupt.flights, 0);
  assert.equal(corrupt.levels.engine, 6); assert.equal(corrupt.levels.tank, 0); assert.equal(corrupt.levels.aero, 0);
  assert.deepEqual(corrupt.milestones, [10000]); assert.equal(corrupt.won, false);
});
test('physics stays consistent across frame rates and flight speed', () => {
  const levels = { engine: 3, tank: 3, aero: 3, boosters: 3 };
  const normal = fly(levels, 1.1, 1 / 60), fast = fly(levels, 1.1, .05), slow = fly(levels, 1.1, 1 / 120);
  assert.ok(Math.abs(normal.peak - fast.peak) < 150); assert.ok(Math.abs(normal.peak - slow.peak) < 150);
});
test('a balanced campaign reaches the goal through earned upgrades in a reasonable number of flights', () => {
  const program = newProgram();
  while (!program.won && program.flights < 20) {
    settleFlight(program, fly(program.levels));
    let available;
    while ((available = UPGRADES.filter(u => upgradeCost(program, u.id) !== null && upgradeCost(program, u.id) <= program.credits).sort((a, b) => program.levels[a.id] - program.levels[b.id] || upgradeCost(program, a.id) - upgradeCost(program, b.id))).length) buyUpgrade(program, available[0].id);
  }
  assert.ok(program.won); assert.ok(program.best >= GOAL); assert.ok(program.flights >= 6 && program.flights <= 16);
});
test('flight plans have real tradeoffs and salvage is added only once', () => {
  const levels = { engine: 3, tank: 3, aero: 3, boosters: 3 };
  const explorer = fly(levels, 1.1, 1/60, {plan:'explorer'});
  const research = fly(levels, 1.1, 1/60, {plan:'research'});
  const hotrod = createFlight(levels, 1.1, {plan:'hotrod'});
  assert.ok(explorer.peak > research.peak);
  assert.ok(hotrod.thrust > explorer.thrust && hotrod.burn < explorer.burn);
  assert.ok(settleFlight(newProgram(), research).flightPay > settleFlight(newProgram(), explorer).flightPay);
  const salvage = fly(levels, 1.1, 1/60, {plan:'research',encounterId:1,encounterChoice:1});
  const program = newProgram(), result = settleFlight(program,salvage);
  assert.ok(result.salvage > 0); assert.equal(program.credits,result.total);
  assert.equal(settleFlight(program,salvage),null);
});
test('encounters freeze simulation and each benefit can be claimed only once', () => {
  for (const encounterId of [0,1,2]) {
    const flight = createFlight(newProgram().levels,1.1,{encounterId});
    while(!flight.pendingEncounter) stepFlight(flight,.05);
    const time=flight.time, altitude=flight.altitude;
    stepFlight(flight,1); assert.equal(flight.time,time); assert.equal(flight.altitude,altitude);
    const before={velocity:flight.velocity,burn:flight.burn,thrust:flight.thrust};
    assert.equal(resolveEncounter(flight,0),true);
    assert.equal(resolveEncounter(flight,0),false);
    assert.ok(flight.velocity>before.velocity || flight.burn>before.burn || flight.thrust>before.thrust);
    while(!flight.done) { stepFlight(flight,.05); assert.equal(flight.pendingEncounter,null); }
  }
});
test('contracts reward the current objective, advance once, and reject stale claims', () => {
  const program=newProgram();
  const result=settleFlight(program,fly(program.levels,1.2,1/60,{contractIndex:0}));
  assert.equal(result.contractPay,70); assert.equal(program.contracts,1);
  assert.equal(currentContract(program).title,'Cloud chaser');
  const stale=settleFlight(program,fly(program.levels,1.2,1/60,{contractIndex:0}));
  assert.equal(stale.contractPay,0); assert.equal(program.contracts,1);
  const stronger={engine:2,tank:2,aero:2,boosters:2};
  const next=settleFlight(program,fly(stronger,1.1,1/60,{contractIndex:1}));
  assert.equal(next.contractPay,90); assert.equal(program.contracts,2);
  program.credits=1000;fitPart(program,'dart');fitPart(program,'composite');
  const withoutCapsule=settleFlight(program,fly(program.levels,1.1,1/60,{contractIndex:2,assembly:assemblySpecs(program)}));
  assert.equal(withoutCapsule.contractPay,0);
  program.credits+=300;fitPart(program,'lab');
  const withCapsule=settleFlight(program,fly(program.levels,1.1,1/60,{contractIndex:2,assembly:assemblySpecs(program)}));
  assert.equal(withCapsule.contractPay,120); assert.equal(program.contracts,3);
});
test('older saves migrate without losing progress and invalid plans fall back safely', () => {
  const saved=restoreProgram({credits:400,best:110000,flights:12,levels:{engine:4,tank:4,aero:3,boosters:2},milestones:[10000,25000,50000,100000]});
  assert.equal(saved.credits,400); assert.equal(saved.levels.engine,4); assert.equal(saved.best,110000);
  assert.equal(saved.plan,'explorer'); assert.equal(saved.contracts,0); assert.equal(saved.eventPreference,'performance');
  assert.equal(missionGoal(saved),200000);
  assert.equal(restoreProgram({eventPreference:'credits'}).eventPreference,'credits');
  assert.equal(restoreProgram({autopilot:false,credits:400}).credits,400);
  const corrupt=restoreProgram({plan:'nope',contracts:-5,eventPreference:'invalid'});
  assert.equal(corrupt.plan,'explorer'); assert.equal(corrupt.contracts,0); assert.equal(corrupt.eventPreference,'performance');
});
test('the extended mission is reachable and pays its milestone once', () => {
  const levels={engine:6,tank:6,aero:6,boosters:6}, program=newProgram();
  const flight=fly(levels,1.1,1/60,{plan:'explorer',encounterId:1});
  assert.ok(flight.peak>=200000);
  const result=settleFlight(program,flight); assert.equal(result.firstOrbit,true);
  assert.ok(program.milestones.includes(200000));
  const repeat=settleFlight(program,fly(levels,1.1,1/60,{plan:'explorer',encounterId:1}));
  assert.equal(repeat.firstOrbit,false); assert.equal(repeat.bonus,0);
});
