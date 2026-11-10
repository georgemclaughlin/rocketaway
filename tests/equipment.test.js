import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions,startPrototype,beginFlight,settle,restoreSession,chooseContract,contractsFor,reserveOffer } from '../prototype-run.js';
import { continueExpedition,milestoneHeight } from '../expeditions.js';
import { catalogFor,assemblySpecs,fitPart } from '../parts.js';
import { momentumMultiplier,companionOffers,abilityDescription,flightAbilityLabel } from '../experimental.js';
import { createFlight,stepFlight } from '../engine.js';
import { advanceFlight,fastForwardRate } from '../flight-playback.js';
import { estimateHeight,previewPart } from '../builder.js';
const copy=v=>structuredClone(v);
function start(world=0,kit='scrapper',rank=0,seed=42) {
 const s=newExpeditions();s.profile.maxDifficulty=world;s.profile.totalGates=6;s.profile.research.levels[kit]=rank;
 startPrototype(s,{seed,kit,difficulty:world});return s;
}
function fit(s,ids) {
 const p=s.active.program;p.credits=10000;p.stock=catalogFor(p).map(p=>p.id);
 for(const id of ids)assert.ok(fitPart(p,id),id);return p;
}
function ignition(p,q=1.1){return createFlight(p.levels,q,{plan:'explorer',assembly:assemblySpecs(p)});}
function fly(p,q=1.1,dt=.05) {
 const f=ignition(p,q);for(let i=0;i<Math.ceil(600/dt)&&!f.done;i++)advanceFlight(f,dt);assert.ok(f.done);return f;
}
test('Momentum ramps with burn time, needs fuel, and trades early performance for late power',()=>{
 assert.equal(momentumMultiplier(0),.65);assert.equal(momentumMultiplier(5),1.275);assert.equal(momentumMultiplier(10),1.9);assert.equal(momentumMultiplier(100),1.9);
 const s=start(1),p=fit(s,['needle','momentum-engine','pocket','twins']);
 const short=fly(p);assert.equal(short.momentumFull,false);assert.match(flightAbilityLabel(ignition(p)),/65% THRUST/);
 assert.match(abilityDescription(catalogFor(p).find(p=>p.id==='momentum-engine'),assemblySpecs(p)),/Short burn/);
 const shortHeight=short.peak;fitPart(p,'dart');assert.ok(fly(p).peak>shortHeight,'Dart is better on short fuel');
 fitPart(p,'jumbo');const dart=fly(p).peak;fitPart(p,'momentum-engine');const long=fly(p);
 assert.ok(long.peak>dart,'long fuel lets Momentum beat the same seeded Dart build');
 assert.equal(long.events.filter(e=>e.includes('full thrust')).length,1);
 fitPart(p,'reserve-tank');const reserve=fly(p);assert.ok(reserve.reserveOpened&&reserve.momentumFull);
 fitPart(p,'bare');const locked=fly(p);assert.equal(locked.reserveOpened,false);assert.equal(locked.momentumFull,false);
});
test('Drop tank releases only dry mass exactly once and research scales the released shell',()=>{
 for(const rank of [0,5]) {
  const p=fit(start(1,'scrapper',rank),['drop-tank','momentum-engine','bare']),stats=assemblySpecs(p),f=ignition(p);
  assert.ok(Math.abs(stats.dropMass-.2*(1-rank*.03))<1e-12);
  advanceFlight(f,f.dropAt-1/120);assert.equal(f.dropReleased,false);
  const fuelBefore=f.fuel;advanceFlight(f,1/120);assert.equal(f.dropReleased,true);
  assert.ok(Math.abs(f.dryMass-(stats.dryMass-stats.dropMass))<1e-12);assert.ok(f.fuel<=fuelBefore&&fuelBefore-f.fuel<.002,'no fuel jump on release');
  while(!f.done)advanceFlight(f,.05);
  assert.equal(f.fuel,0);assert.ok(f.dryMass>0);assert.equal(f.events.filter(e=>e==='Empty tank released').length,1);
  assert.ok(f.peak>0);
 }
});
test('new abilities, existing partner effects, previews, skip and playback speeds agree without mutation',()=>{
 for(const ids of [
  ['momentum-engine','drop-tank','return-boosters'],
  ['momentum-engine','reserve-tank','return-boosters'],
  ['separation-engine','drop-tank','return-boosters'],
  ['instrument-engine','drop-tank','survey-capsule'],
  ['endurance-engine','drop-tank','bare'],
 ]) {
  const p=fit(start(1),ids),baseline=fly(p,1.17,1/120),state=copy(p);
  assert.ok(Math.abs(estimateHeight(p,1.17)-baseline.peak)<2);
  previewPart(p,'jumbo');assert.deepEqual(p,state);
  for(const dt of [1/60,.05,.91]){const actual=fly(p,1.17,dt);assert.equal(actual.peak,baseline.peak);assert.deepEqual(actual.events,baseline.events);}
  const f=ignition(p,1.17);advanceFlight(f,1.017);const before=copy(f),rate=fastForwardRate(f);assert.deepEqual(f,before);
  while(!f.done)advanceFlight(f,.017*rate);
  assert.equal(f.peak,baseline.peak);assert.ok(f.events.length<=5);
  const skipped=ignition(p,1.17);for(let i=0;i<12000&&!skipped.done;i++)stepFlight(skipped,.05);
  assert.ok(skipped.done);assert.ok(Math.abs(skipped.peak-baseline.peak)<2);assert.deepEqual(skipped.events,baseline.events);
 }
});
test('recovery pays once on a new milestone or selected contract, never on a miss',()=>{
 const s=start(0,'scrapper',0,2),p=fit(s,['needle','dart','composite','return-boosters']);
 assert.ok(chooseContract(s,'world-0-pointed'));s.active.stage=5;
 assert.ok(beginFlight(s,1.1));const f=fly(p),r=settle(s,f);
 assert.ok(f.recovered);assert.equal(r.cleared.length,0);assert.equal(r.contract,'Sky arrow');assert.equal(r.recoveryPay,90);
 assert.equal(r.total,r.flightPay+r.bonus+r.contractPay+r.surveyPay+90);
 const before=copy(s);assert.equal(settle(s,f),null);assert.deepEqual(s,before);
 const resumed=restoreSession(s);assert.equal(resumed.active.lastResult.recoveryPay,90);
 continueExpedition(resumed);beginFlight(resumed,1.1);const missed=settle(resumed,fly(resumed.active.program));
 assert.equal(missed.success,false);assert.equal(missed.recoveryPay,0);
 const fresh=start();fit(fresh,['return-boosters','ember','long']);beginFlight(fresh,1.1);
 const milestone=settle(fresh,fly(fresh.active.program));assert.ok(milestone.cleared.length);assert.equal(milestone.recoveryPay,90);
});
test('interrupted combinations retain build, timing, events and earnings through reload',()=>{
 const s=start(1,'scientist',3),p=fit(s,['survey-capsule','momentum-engine','reserve-tank','return-boosters']);
 chooseContract(s,contractsFor(s.active)[1].id);beginFlight(s,1.17);
 const resumed=restoreSession(s);assert.deepEqual(resumed.active.launchSnapshot,s.active.launchSnapshot);
 assert.equal(resumed.active.program.equipmentVersion,2);assert.equal(resumed.active.launchQuality,1.17);
 const a=settle(s,fly(p,1.17)),b=settle(resumed,fly(resumed.active.program,1.17));assert.deepEqual(b,a);
 assert.deepEqual(resumed.profile.missionJournal,s.profile.missionJournal);
 assert.deepEqual(restoreSession(resumed).active.lastResult.events,b.events);
});
test('new offers support fitted partners, keep reservations, and never change on reload or reads',()=>{
 const s=start(),p=fit(s,['momentum-engine','long']);
 assert.ok(companionOffers(p).includes('drop-tank'));
 assert.ok(reserveOffer(s,'survey-capsule'));beginFlight(s,1.1);settle(s,fly(p));
 assert.ok(p.stock.includes('survey-capsule'));assert.ok(p.stock.includes('drop-tank'));
 const stock=copy(p.stock),before=copy(s);companionOffers(p);restoreSession(s);assert.deepEqual(s,before);
 assert.deepEqual(restoreSession(s).active.program.stock,stock);
});
test('old equipment pools cannot fit new parts; unsupported equipment versions preserve the raw save',()=>{
 const s=start();delete s.active.equipmentVersion;delete s.active.program.equipmentVersion;s.prototypeVersion=3;
 const restored=restoreSession(s);assert.equal(restored.active.equipmentVersion,1);
 assert.equal(catalogFor(restored.active.program).filter(p=>p.ability).length,6);
 restored.active.program.credits=10000;restored.active.program.stock.push('momentum-engine');
 assert.equal(fitPart(restored.active.program,'momentum-engine'),false);
 assert.equal(previewPart(restored.active.program,'momentum-engine'),null);
 const future=start();future.active.equipmentVersion=99;const before=copy(future);assert.throws(()=>restoreSession(future),/newer/);assert.deepEqual(future,before);
});
// Outcomes captured from the preceding public release a5323fb at 117% power.
test('legacy rocket outcomes and next offers remain identical to the preceding release',()=>{
 const cases=[
  [0,'scrapper',128661.57869388458,10291,['survey-capsule','instrument-engine']],
  [0,'scientist',139020.21650098963,10968,['feather-shell','endurance-engine']],
  [1,'scrapper',2682176.323519052,11038,['instrument-engine','survey-capsule']],
  [1,'scientist',1926172.1187143386,10982,['endurance-engine','feather-shell']],
  [5,'scrapper',84273.34491787945,10307,['feather-shell','endurance-engine']],
  [5,'scientist',95152.41670182369,11002,['reserve-tank','separation-engine']],
 ];
 for(const [world,kit,peak,credits,offers] of cases) {
  const raw=start(world,kit);raw.prototypeVersion=3;delete raw.active.discoveryVersion;delete raw.active.program.discoveryVersion;delete raw.active.discoveries;delete raw.active.program.core;delete raw.active.equipmentVersion;delete raw.active.program.equipmentVersion;
  const s=restoreSession(raw),ids=kit==='scrapper'?['reserve-tank','separation-engine','solids']:['survey-capsule','instrument-engine','composite'];
  const p=fit(s,ids);beginFlight(s,1.17);const f=fly(p,1.17);settle(s,f);
  assert.equal(f.peak,peak);assert.equal(p.credits,credits);assert.deepEqual(p.stock.filter(id=>catalogFor(p).find(p=>p.id===id).ability),offers);
 }
});
