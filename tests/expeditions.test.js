import test from 'node:test';
import assert from 'node:assert/strict';
import {newExpeditions,startExpedition,checkpoint,milestoneHeight,beginExpeditionFlight,settleExpedition,continueExpedition,restoreExpeditions,abandonExpedition} from '../expeditions.js';
import {newProgram,createFlight,stepFlight} from '../engine.js';
import {assemblySpecs,fitPart,partForProgram} from '../parts.js';
import {estimateHeight} from '../builder.js';
const start=(seed=12345)=>{const s=newExpeditions();startExpedition(s,{seed});return s;};
const completed=peak=>({done:true,settled:false,peak,payMultiplier:1});
const copy=x=>JSON.parse(JSON.stringify(x));

test('new runs go straight to the hangar with deterministic physical parts',()=>{
 const a=start(),b=start();assert.deepEqual(a,b);assert.equal(a.active.status,'build');
 assert.deepEqual(a.active.program.relics,[]);assert.equal(a.active.program.route,null);
 assert.deepEqual(restoreExpeditions(copy(a)),a);
 assert.notDeepEqual(start(999).active.program.partTraits,a.active.program.partTraits);
});
test('one flight clears every crossed milestone and pays each exactly once',()=>{
 const s=start();beginExpeditionFlight(s,1.1);
 const flight=completed(12710),r=settleExpedition(s,flight);
 assert.deepEqual(r.cleared,[2500,10000]);assert.equal(r.power,110);assert.equal(r.bonus,160+260);assert.equal(r.nextTarget,25000);
 assert.equal(s.active.stage,2);assert.equal(s.profile.totalGates,2);assert.equal(s.active.status,'debrief');
 const credits=s.active.program.credits;assert.equal(settleExpedition(s,flight),null);
 assert.equal(continueExpedition(s),true);assert.equal(s.active.status,'build');assert.equal(continueExpedition(s),false);
 const restored=restoreExpeditions(copy(s));assert.equal(restored.active.program.credits,credits);assert.equal(checkpoint(restored.active),25000);
 beginExpeditionFlight(restored,1.1);const again=settleExpedition(restored,completed(12710));
 assert.equal(again.bonus,0);assert.equal(again.success,false);assert.equal(restored.active.strikes,1);
});
test('launches and results reject duplicate or out-of-phase actions',()=>{
 const s=start();assert.equal(beginExpeditionFlight(s,NaN),false);
 assert.equal(beginExpeditionFlight(s,1.18),true);assert.equal(beginExpeditionFlight(s,1.18),false);
 const restored=restoreExpeditions(copy(s));assert.equal(restored.active.status,'flying');assert.equal(restored.active.launchQuality,1.18);
 assert.equal(settleExpedition(s,{done:false}),null);settleExpedition(s,completed(3000));
 assert.equal(beginExpeditionFlight(s,1.1),false);assert.equal(settleExpedition(s,completed(50000)),null);
});
test('three misses end a run, with recovery credits and no repeated planning',()=>{
 const s=start();
 for(let i=0;i<3;i++){
  beginExpeditionFlight(s,1);const r=settleExpedition(s,completed(0));assert.equal(r.success,false);assert.ok(r.total>=60);
  if(i<2){continueExpedition(s);assert.equal(s.active.status,'build');}
 }
 assert.equal(s.active.status,'lost');assert.equal(s.active.strikes,3);assert.equal(s.history.length,1);
 const previous=s.active;assert.equal(startExpedition(s,{seed:999}),true);assert.equal(s.active.strikes,0);assert.equal(s.active.program.credits,160);assert.notEqual(s.active,previous);
});
test('a flight passing the top awards all milestones and unlocks the next difficulty once',()=>{
 const s=start();beginExpeditionFlight(s,1.1);const r=settleExpedition(s,completed(200000));
 assert.equal(r.cleared.length,6);assert.equal(r.nextTarget,null);assert.equal(r.bonus,2460);
 assert.equal(s.active.status,'won');assert.equal(s.profile.wins,1);assert.equal(s.profile.totalGates,6);assert.equal(s.profile.maxDifficulty,1);assert.equal(s.history.length,1);
 assert.equal(abandonExpedition(s),false);assert.equal(startExpedition(s,{seed:1,kit:'scientist',difficulty:1}),true);
 assert.equal(s.active.program.parts.equipped.aero,'lab');assert.equal(s.active.difficulty,1);assert.equal(milestoneHeight(s.active,5),2000000);
});
test('shop stock retains affordable upgrade steps, and owned parts always refit for free',()=>{
 for(let seed=1;seed<=20;seed++){
  const s=start(seed),p=s.active.program;assert.ok(p.stock.includes('ember'));assert.ok(p.stock.includes('long'));
  assert.equal(fitPart(p,'mammoth'),false);assert.equal(fitPart(p,'ember'),true);
  beginExpeditionFlight(s,1.1);settleExpedition(s,completed(12710));continueExpedition(s);
  assert.ok(p.stock.includes('dart'));assert.ok(p.stock.includes('long'));assert.ok(p.stock.includes('needle'));
  p.stock=[];assert.equal(fitPart(p,'spark'),true);const credits=p.credits;assert.equal(fitPart(p,'ember'),true);assert.equal(p.credits,credits);
 }
});
test('part bonuses change actual physics and estimates, remain fixed, and affect only fitted parts',()=>{
 const p=newProgram();p.credits=10000;fitPart(p,'ember');const base=assemblySpecs(p),height=estimateHeight(p);
 p.partTraits={ember:'thrust'};assert.equal(assemblySpecs(p).thrust,base.thrust*1.15);assert.ok(estimateHeight(p)>height);
 assert.equal(partForProgram(p,'ember').trait.detail,'15% more thrust');
 const flight=createFlight(p.levels,1.1,{plan:'explorer',assembly:assemblySpecs(p)});while(!flight.done)stepFlight(flight,.05);
 assert.equal(estimateHeight(p),Math.round(flight.peak));
 fitPart(p,'spark');const withUnfittedTrait=assemblySpecs(p);p.partTraits={};assert.deepEqual(assemblySpecs(p),withUnfittedTrait);
 const s=start(),traits=copy(s.active.program.partTraits);beginExpeditionFlight(s,1.1);settleExpedition(s,completed(3000));continueExpedition(s);
 assert.deepEqual(s.active.program.partTraits,traits);assert.deepEqual(restoreExpeditions(copy(s)).active.program.partTraits,traits);
});
test('old planning saves retain rocket, credits and earned bonuses, and skip already flown goals once',()=>{
 const old=start();old.version=1;const r=old.active;r.status='draft';r.stage=1;r.program.best=30000;r.program.credits=500;r.program.relics=['ion'];r.program.partTraits=undefined;
 old.profile.totalGates=1;old.profile.bestStage=1;
 const next=restoreExpeditions(copy(old));assert.equal(next.active.status,'build');assert.equal(next.active.stage,3);
 assert.equal(next.active.program.credits,500+260+360);assert.equal(next.profile.totalGates,3);
 assert.deepEqual(next.active.program.parts,r.program.parts);assert.deepEqual(next.active.program.relics,['ion']);
 assert.equal(checkpoint(next.active),55000);assert.deepEqual(restoreExpeditions(copy(next)),next);
});
test('damaged saves recover to a playable hangar and reject invalid part traits',()=>{
 assert.deepEqual(restoreExpeditions(null),newExpeditions());
 const s=start();s.active.status='route';s.active.program.relics={bad:true};s.active.program.stock=['missing'];s.active.program.parts={owned:['fake'],equipped:{engine:'fake'}};
 s.active.program.partTraits={ember:'kick',pocket:'capacity',dart:'thrust',fake:'light'};
 const restored=restoreExpeditions(s);assert.equal(restored.active.status,'build');assert.deepEqual(restored.active.program.relics,[]);assert.equal(restored.active.program.parts.equipped.engine,'spark');assert.deepEqual(restored.active.program.partTraits,{dart:'thrust'});
});
test('Free Flight is untouched and chosen mode survives an empty or active hub reload',()=>{
 const classic=newProgram();classic.credits=5000;fitPart(classic,'mammoth');const saved=JSON.stringify(classic);
 const s=start();abandonExpedition(s);startExpedition(s,{seed:40});assert.equal(JSON.stringify(classic),saved);
 const empty=newExpeditions();assert.equal(empty.mode,'expedition');empty.mode='classic';assert.equal(restoreExpeditions(copy(empty)).mode,'classic');
 s.mode='classic';assert.deepEqual(restoreExpeditions(copy(s)),s);
});

test('legacy highest Ascent remains reachable without legacy modules, including weaker part rolls',()=>{
 for(const seed of [8,20,48]){
  const s=newExpeditions();s.profile.maxDifficulty=8;startExpedition(s,{seed:seed*1640531527,difficulty:8});
  s.active.conditionsVersion=1;const p=s.active.program;p.conditionsVersion=1;p.credits=10000;p.stock=['ceramic','jumbo','mammoth'];
  for(const id of p.stock)assert.equal(fitPart(p,id),true);
  const f=createFlight(p.levels,1.18,{plan:'explorer',assembly:assemblySpecs(p)});while(!f.done)stepFlight(f,.05);
  assert.ok(f.peak>=milestoneHeight(s.active,5),`seed ${seed}: ${f.peak}`);
  assert.equal(estimateHeight(p,1.18),Math.round(f.peak));
 }
});
