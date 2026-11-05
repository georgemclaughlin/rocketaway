import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions,startPrototype,beginFlight,settle,restoreSession,arrivePrototype } from '../prototype-run.js';
import { milestoneHeight,continueExpedition } from '../expeditions.js';
import { assemblySpecs,fitPart,catalogFor } from '../parts.js';
import { createFlight } from '../engine.js';
import { advanceFlight } from '../flight-playback.js';
import { estimateHeight,previewPart,launchReadiness } from '../builder.js';
import { buildEffects,combinationChange } from '../rocket-insights.js';
import { fundingFor } from '../launch-funding.js';
import { packCampaignSave,openCampaignSave } from '../campaign-save.js';

function start(world=0){const s=newExpeditions();s.profile.maxDifficulty=world;startPrototype(s,{seed:42,difficulty:world});return s;}
function fit(s,ids){const p=s.active.program;p.credits=10000;p.stock=catalogFor(p).map(p=>p.id);for(const id of ids)assert.ok(fitPart(p,id));return p;}
function fly(s,power=1.1){assert.ok(beginFlight(s,power));const p=s.active.program,f=createFlight(p.levels,power,{plan:'explorer',assembly:assemblySpecs(p)});while(!f.done)advanceFlight(f,.1);return settle(s,f);}
function clear(s){beginFlight(s,1.1);return settle(s,{done:true,peak:milestoneHeight(s.active,5)+1,quality:1.1,payMultiplier:1,time:30,burn:10,coastTime:20});}

test('part previews explain breaking and reactivating existing combinations without spending',()=>{
  const s=start(),p=fit(s,['feather-shell','endurance-engine','composite']);const before=structuredClone(p);
  assert.ok(buildEffects(p).every(e=>e.active));
  const heavy=previewPart(p,'jumbo');
  assert.match(combinationChange(p,heavy.program).text,/Disables Feather shell/);
  assert.match(combinationChange(p,previewPart(p,'twins').program).text,/Disables Endurance engine/);
  assert.match(combinationChange(heavy.program,p).text,/Activates Feather shell/);
  assert.deepEqual(p,before);
});
test('a fragile 110% estimate warns about timing instead of presenting a safe margin',()=>{
  const p=start().active.program,normal=estimateHeight(p,1),expected=estimateHeight(p,1.1),perfect=estimateHeight(p,1.2),before=structuredClone(p);
  assert.equal(launchReadiness(p,normal).state,'true');
  assert.deepEqual(launchReadiness(p,expected-1),{text:'Aim for gold',state:'timing'});
  assert.deepEqual(launchReadiness(p,perfect-1),{text:'Gold can reach it',state:'timing'});
  assert.equal(launchReadiness(p,perfect+100).state,'false');assert.deepEqual(p,before);
});
test('flight log compares builds at equal power and survives interrupted flight and reload',()=>{
  const s=start();fit(s,['ember']);const first=fly(s,.91);continueExpedition(s);
  fit(s,['long']);const expected=estimateHeight(s.active.program);beginFlight(s,1.17);
  const resumed=restoreSession(s),p=resumed.active.program,f=createFlight(p.levels,1.17,{plan:'explorer',assembly:assemblySpecs(p)});
  while(!f.done)advanceFlight(f,.1);
  const result=settle(resumed,f);
  assert.equal(result.engineering.previousEstimate,first.engineering.estimate);
  assert.equal(result.engineering.estimate,expected);
  assert.ok(result.engineering.burn>0&&result.engineering.coast>0);
  assert.deepEqual(restoreSession(resumed).active.lastResult.engineering,result.engineering);
  const state=structuredClone(resumed);assert.equal(settle(resumed,f),null);assert.deepEqual(resumed,state);
});
test('first departure transfers bounded credits once, survives campaign switching, and funds only its destination',()=>{
  const s=start(1),p=s.active.program;const credits=p.credits,result=clear(s);
  assert.equal(result.nextFunding,200);assert.equal(p.credits,credits+result.total-200);assert.equal(fundingFor(s.profile,2),200);
  const original=newExpeditions(),restored=openCampaignSave(packCampaignSave(s,original)).session;
  assert.equal(fundingFor(restored.profile,2),200);
  startPrototype(restored,{seed:7,difficulty:0});assert.equal(restored.active.startingFunding,0);assert.equal(fundingFor(restored.profile,2),200);
  restored.active.status='lost';assert.ok(startPrototype(restored,{seed:7,difficulty:2}));
  assert.equal(restored.active.program.credits,260);assert.equal(restored.active.pendingFunding,200);assert.equal(fundingFor(restored.profile,2),0);
  beginFlight(restored,.9);const resumed=restoreSession(restored);
  const first=settle(resumed,{done:true,peak:0,quality:.9,payMultiplier:1,time:12,burn:4,coastTime:8});
  assert.equal(first.success,false);assert.equal(resumed.active.strikes,1);
  assert.equal(first.fundingPay,200);assert.equal(resumed.active.pendingFunding,0);
  assert.equal(resumed.active.program.credits,260+first.total);
  continueExpedition(resumed);assert.equal(fly(resumed,.9).fundingPay,0);
  restored.active.status='lost';startPrototype(restored,{seed:7,difficulty:2});assert.equal(restored.active.program.credits,260);
  restored.active.status='lost';startPrototype(restored,{seed:7,difficulty:1});assert.equal(clear(restored).nextFunding,0);
});
test('Earth keeps its entire budget, the Moon clears its comparison, and old runs keep old earnings',()=>{
  const s=start(),before=s.active.program.credits,result=clear(s);
  assert.equal(result.nextFunding,0);assert.equal(s.active.program.credits,before+result.total);
  assert.ok(arrivePrototype(s));assert.equal(s.active.previousEstimate,null);
  const old=start(1);delete old.active.journeyVersion;old.prototypeVersion=4;
  const restored=restoreSession(old),credits=restored.active.program.credits,r=clear(restored);
  assert.equal(r.nextFunding,0);assert.equal(restored.active.program.credits,credits+r.total);
  const final=start(8);assert.equal(clear(final).nextFunding,0);
});
test('future journey versions remain untouched and invalid funding is bounded',()=>{
  const s=start();s.active.journeyVersion=2;const before=structuredClone(s);
  assert.throws(()=>restoreSession(s),/newer journey/);assert.deepEqual(s,before);
  delete s.active.journeyVersion;s.profile.launchFunding=[NaN,-50,Infinity,9999,101.7];
  assert.deepEqual(restoreSession(s).profile.launchFunding,[0,0,0,200,101,0,0,0,0]);
});
