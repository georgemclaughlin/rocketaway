import test from 'node:test';
import assert from 'node:assert/strict';
import {newExpeditions,startPrototype,beginFlight,settle,arrivePrototype,restoreSession,prototypeContracts,chooseContract,reserveOffer} from '../prototype-run.js';
import {startExpedition,beginExpeditionFlight,continueExpedition,milestoneHeight} from '../expeditions.js';
import {assemblySpecs,fitPart,partById,PARTS} from '../parts.js';
import {EXPERIMENTAL_PARTS} from '../experimental.js';
import {createFlight} from '../engine.js';
import {advanceFlight,fastForwardRate} from '../flight-playback.js';
import {estimateHeight,previewPart} from '../builder.js';
import {earnedPrototype} from '../checks/prototype-audit.js';
const copy=v=>structuredClone(v);
function start(world=0,kit='scrapper',seed=42) {
  const s=newExpeditions();s.profile.maxDifficulty=1;s.profile.totalGates=6;startPrototype(s,{seed,difficulty:world,kit});s.active.missionVersion=1;return s;
}
function equipped(s,ids) {
  const p=s.active.program;p.credits=10000;p.stock=[...PARTS,...EXPERIMENTAL_PARTS].map(p=>p.id);
  for(const id of ids)assert.ok(fitPart(p,id));return p;
}
function flightFor(p,quality=1.1) {return createFlight(p.levels,quality,{plan:'explorer',assembly:assemblySpecs(p)});}
function fly(p,dt=.05,quality=1.1) {
  const f=flightFor(p,quality);for(let i=0;i<100000&&!f.done;i++)advanceFlight(f,dt);assert.ok(f.done);return f;
}
test('experimental effects have explicit conditions and useful combinations',()=>{
  const s=start();let p=equipped(s,['feather-shell','endurance-engine']);let stats=assemblySpecs(p);
  assert.ok(stats.feather&&stats.endurance);assert.equal(stats.burn,7);
  fitPart(p,'jumbo');assert.equal(assemblySpecs(p).feather,false);
  fitPart(p,'twins');assert.equal(assemblySpecs(p).endurance,false);
  fitPart(p,'instrument-engine');assert.equal(assemblySpecs(p).instrument,false);
  fitPart(p,'survey-capsule');assert.equal(assemblySpecs(p).instrument,true);
  assert.equal(assemblySpecs(p).survey,true);
  p=equipped(s,['reserve-tank','separation-engine','solids']);
  const full=fly(p);assert.deepEqual(full.events,['Boosters separated','Reserve fuel released','Separation surge · 2× thrust']);
  assert.equal(full.burn,full.mainBurn*2);assert.equal(full.fuel,0);
  fitPart(p,'bare');const noBoosters=fly(p);assert.equal(noBoosters.reserveOpened,false);assert.equal(noBoosters.fuel,.5);
  assert.ok(full.peak>noBoosters.peak);
});
test('ability flights match previews and every playback path without mutation',()=>{
  const p=equipped(start(1),['reserve-tank','separation-engine','orbitals']);
  const baseline=fly(p,1/120),probe=flightFor(p);advanceFlight(probe,2.017);const before=copy(probe);
  const speed=fastForwardRate(probe);assert.deepEqual(probe,before);
  while(!probe.done)advanceFlight(probe,.017*speed);
  assert.ok(Math.abs(probe.peak-baseline.peak)<1e-6);assert.deepEqual(probe.events,baseline.events);
  for(const dt of [1/60,.05,.91])assert.ok(Math.abs(fly(p,dt).peak-baseline.peak)<1e-6);
  assert.ok(Math.abs(estimateHeight(p)-baseline.peak)<2);
  const saved=copy(p);previewPart(p,'jumbo');assert.deepEqual(p,saved);
});
test('offers and reservations are deterministic and reading a save never rerolls',()=>{
  const a=start(),b=start();assert.deepEqual(a.active.program.stock,b.active.program.stock);
  const id=a.active.program.stock.find(id=>partById(id).ability);assert.ok(reserveOffer(a,id));
  const restored=restoreSession(copy(a));assert.deepEqual(restored.active.program.stock,a.active.program.stock);assert.equal(restored.active.reservedOffer,id);
  beginFlight(restored,1.1);settle(restored,fly(restored.active.program));assert.ok(restored.active.program.stock.includes(id));
  const after=copy(restored);restoreSession(copy(restored));assert.deepEqual(restored,after);
  assert.equal(reserveOffer(restored,id),false,'cannot edit during debrief');
});
test('a selected contract can succeed below the next milestone and pays only once',()=>{
  const s=start(),p=equipped(s,['survey-capsule','dart','composite']);s.active.stage=5;
  const contract=prototypeContracts(0)[1];assert.ok(chooseContract(s,contract.id));
  beginFlight(s,1.1);assert.equal(chooseContract(s,null),false);
  const flight=fly(p),result=settle(s,flight);
  assert.equal(result.cleared.length,0);assert.equal(result.contractPay,contract.reward);assert.equal(s.active.strikes,0);assert.equal(result.success,true);
  const before=copy(s);assert.equal(settle(s,flight),null);assert.deepEqual(s,before);
  const restored=restoreSession(copy(s));assert.equal(restored.active.lastResult.contract,contract.name);assert.equal(restored.active.lastResult.success,true);
  continueExpedition(restored);assert.equal(chooseContract(restored,contract.id),false);
  beginFlight(restored,1.1);const again=settle(restored,fly(restored.active.program));assert.equal(again.contractPay,0);assert.equal(restored.active.strikes,1);
});
test('contract failure still allows altitude success; survey rewards only new milestones',()=>{
  const s=start(),p=equipped(s,['survey-capsule','ember','jumbo']);chooseContract(s,'earth-light');
  beginFlight(s,1.1);const first=settle(s,fly(p));assert.ok(first.cleared.length>0);assert.equal(first.contractPay,0);assert.equal(first.surveyPay,first.cleared.length*90);assert.equal(s.active.strikes,0);
  continueExpedition(s);beginFlight(s,1.1);const second=settle(s,fly(p));assert.equal(second.surveyPay,0);
});
test('travel carries rocket, money and misses exactly once and checkpoints are fresh',()=>{
  const s=start(),p=equipped(s,['mammoth','jumbo','ceramic','orbitals']);s.active.strikes=1;
  beginFlight(s,1.2);settle(s,fly(p,.05,1.2));assert.equal(s.active.status,'won');
  const money=p.credits,parts=copy(p.parts),runs=s.profile.runs;const restored=restoreSession(copy(s));
  assert.ok(arrivePrototype(restored));assert.equal(restored.active.difficulty,1);assert.equal(restored.active.program.credits,money);assert.deepEqual(restored.active.program.parts,parts);assert.equal(restored.active.strikes,1);assert.equal(restored.profile.runs,runs);assert.equal(restored.active.program.best,0);
  assert.equal(arrivePrototype(restored),false);assert.deepEqual(restoreSession(copy(restored)).active.program.parts,parts);
  restored.active.status='lost';assert.ok(startPrototype(restored,{seed:9,difficulty:1}));assert.equal(restored.active.program.credits,1260);assert.equal(restored.active.strikes,0);assert.ok(!restored.active.program.parts.owned.includes('mammoth'));
});
test('resuming ignition preserves contract, parts, timing and one-time rewards',()=>{
  const s=start(),p=equipped(s,['survey-capsule','instrument-engine','composite']);chooseContract(s,'earth-science');beginFlight(s,1.17);
  const restored=restoreSession(copy(s));assert.equal(restored.active.launchQuality,1.17);assert.equal(restored.active.status,'flying');assert.deepEqual(restored.active.launchSnapshot,s.active.launchSnapshot);
  const a=settle(s,fly(p,.05,1.17)),b=settle(restored,fly(restored.active.program,.017,1.17));assert.deepEqual(b,a);assert.equal(restored.profile.flightRecords.launches,s.profile.flightRecords.launches);
});
test('legacy v0–v3 flights retain conditions and estimates; future saves are rejected without mutation',()=>{
  for(const version of [0,1,2,3]) {
    const s=newExpeditions();startExpedition(s,{seed:42});s.active.conditionsVersion=version;s.active.program.conditionsVersion=version;
    if(version===0){delete s.active.program.conditionsVersion;delete s.active.program.launchWorld;}
    const height=estimateHeight(s.active.program);beginExpeditionFlight(s,1.17);const restored=restoreSession(copy(s));
    assert.equal(restored.active.conditionsVersion,version);assert.equal(estimateHeight(restored.active.program),height);assert.equal(restored.active.launchQuality,1.17);
  }
  const future=start();future.prototypeVersion=99;const before=copy(future);assert.throws(()=>restoreSession(future),/newer/);assert.deepEqual(future,before);
});
test('sample earned expeditions and Moon checkpoint starts finish with real purchases',()=>{
  for(const kit of ['scrapper','stager','scientist'])for(const world of [0,1]) {
    const row=earnedPrototype({seed:42,kit,world,policy:'contracts'});
    assert.equal(row.status,'won',JSON.stringify(row.launches));assert.equal(row.session.active.difficulty,1);
    assert.ok(row.launches.length<=20);
  }
});

test('every affordable experimental opening offer keeps the first goal reachable at estimated power',()=>{
  for(const seed of [1,7,42,99,2025]) {
    const s=start(0,'scrapper',seed),p=s.active.program;
    const offers=p.stock.map(partById).filter(part=>part.ability&&part.price<=p.credits);
    assert.ok(offers.length);
    for(const part of offers)assert.ok(previewPart(p,part.id).height>=milestoneHeight(s.active),part.name);
  }
});
test('a locked Moon start cannot grant checkpoint money on Earth',()=>{
  const s=newExpeditions();assert.ok(startPrototype(s,{seed:42,difficulty:1}));
  assert.equal(s.active.difficulty,0);assert.equal(s.active.startWorld,0);assert.equal(s.active.program.credits,160);
});
