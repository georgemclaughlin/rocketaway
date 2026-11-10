import test from 'node:test';
import assert from 'node:assert/strict';
import { CORES, discoveryOrder, recoverDiscoveries, fitCore } from '../discoveries.js';
import { newExpeditions,startPrototype,beginFlight,settle,restoreSession,arrivePrototype } from '../prototype-run.js';
import { continueExpedition } from '../expeditions.js';
import { assemblySpecs } from '../parts.js';
import { createFlight } from '../engine.js';
import { advanceFlight } from '../flight-playback.js';
import { estimateHeight } from '../builder.js';
import { bestAffordable } from '../checks/prototype-audit.js';
import { fitBuild } from '../build-plan.js';
const copy=x=>structuredClone(x);
function start(seed=42,world=0){const s=newExpeditions();s.profile.maxDifficulty=world;startPrototype(s,{seed,difficulty:world});return s;}
function fly(p,q=1.1,dt=.05){const f=createFlight(p.levels,q,{plan:'explorer',assembly:assemblySpecs(p)});while(!f.done)advanceFlight(f,dt);return f;}
test('discoveries are deterministic, cumulative, once-only, and never silently fitted',()=>{
 const s=start(),r=s.active,p=r.program,build=copy(p.parts.equipped);assert.deepEqual(discoveryOrder(42),['cascade','sail','scanner']);
 r.stage=3;assert.equal(recoverDiscoveries(r).length,2);assert.deepEqual(recoverDiscoveries(r),[]);assert.deepEqual(p.parts.equipped,build);assert.equal(p.core,null);
 assert.ok(p.parts.owned.includes('twins'));assert.ok(p.parts.owned.includes('feather-shell'));
 assert.ok(fitCore(r,'cascade'));assert.equal(fitCore(r,'scanner'),false);
 beginFlight(s,1.17);assert.equal(fitCore(r,'sail'),false);const restored=restoreSession(copy(s));assert.equal(restored.active.program.core,'cascade');assert.deepEqual(fly(p,1.17),fly(restored.active.program,1.17));
});
test('cores have distinct activation requirements, real events, preview parity and fixed-tick playback',()=>{
 const s=start(),r=s.active,p=r.program;r.stage=6;recoverDiscoveries(r);r.difficulty=1;r.stage=2;recoverDiscoveries(r);p.launchWorld=1;
 const builds={cascade:{aero:'cap',tank:'reserve-tank',engine:'separation-engine',boosters:'twins'},sail:{aero:'feather-shell',tank:'composite',engine:'endurance-engine',boosters:'bare'},scanner:{aero:'survey-capsule',tank:'composite',engine:'instrument-engine',boosters:'bare'}};
 for(const core of CORES){p.parts.equipped=builds[core.id];p.core=core.id;const f=fly(p),fast=fly(p,1.1,4);assert.equal(f.peak,fast.peak);assert.deepEqual(f.events,fast.events);assert.ok(Math.abs(estimateHeight(p)-f.peak)<30);assert.ok(f.events.some(e=>e.includes(core.id==='sail'?'sail':core.id==='cascade'?'echo kick':'Echo scan')));const enhanced=f.peak;p.core=null;assert.ok(enhanced>fly(p).peak);}
 p.core='sail';p.parts.equipped={...builds.sail,boosters:'twins'};assert.equal(assemblySpecs(p).sail,false);
 p.core='scanner';p.parts.equipped={...builds.scanner,aero:'cap'};assert.equal(assemblySpecs(p).scanner,false);
 p.core='cascade';p.parts.equipped=builds.sail;assert.equal(assemblySpecs(p).cascade,false);
});
test('scanner pay requires success and ignition eligibility, is bounded and settles once',()=>{
 const s=start(44),r=s.active,p=r.program;r.stage=1;recoverDiscoveries(r);fitCore(r,'scanner');p.parts.equipped={aero:'survey-capsule',tank:'composite',engine:'instrument-engine',boosters:'bare'};
 beginFlight(s,1.1);const f=fly(p),result=settle(s,f);assert.equal(result.scanPay,180);assert.ok(f.events.includes('Echo overdrive · 3× thrust'));assert.ok(f.scanSurgeUntil>12);assert.equal(settle(s,f),null);assert.equal(restoreSession(copy(s)).active.lastResult.scanPay,180);
 continueExpedition(s);r.stage=5;beginFlight(s,1.1);assert.equal(settle(s,{...fly(p),peak:1}).scanPay,0);
});
test('legacy attempts retain exact physics and future discovery saves are rejected untouched',()=>{
 const s=start(),raw=copy(s);raw.prototypeVersion=6;delete raw.active.discoveryVersion;delete raw.active.program.discoveryVersion;delete raw.active.program.core;delete raw.active.discoveries;
 const old=restoreSession(raw);assert.equal(old.active.program.discoveryVersion,undefined);assert.equal(fly(old.active.program).peak,fly(s.active.program).peak);
 for(const field of ['run','program']){const bad=copy(s);(field==='run'?bad.active:bad.active.program).discoveryVersion=2;const before=copy(bad);assert.throws(()=>restoreSession(bad),/newer/);assert.deepEqual(bad,before);}
});
test('earned Earth–Moon progression remains feasible with each first discovery',()=>{
 for(const seed of [42,43,44]){const s=start(seed);for(let turn=0;turn<20&&!(s.active.difficulty===1&&s.active.status==='won');turn++){
  const r=s.active;if(r.status==='won')arrivePrototype(s);else if(r.status==='debrief')continueExpedition(s);assert.notEqual(r.status,'lost');
  let best=null;for(const core of [null,...r.discoveries]){const candidate=bestAffordable({...r.program,core});if(!best||candidate.height>best.height)best={...candidate,core};}
  fitCore(r,best.core);
  // Audit's chosen IDs are ordered nose, tank, engine, boosters.
  fitBuild(r.program,Object.fromEntries(['aero','tank','engine','boosters'].map((slot,i)=>[slot,best.ids[i]])));
  beginFlight(s,1.1);settle(s,fly(r.program));
 }assert.equal(s.active.difficulty,1);assert.equal(s.active.status,'won');assert.equal(s.active.discoveries.length,3);}
});
