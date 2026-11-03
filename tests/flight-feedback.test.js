import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions,startExpedition,KITS } from '../expeditions.js';
import { missedFlightAdvice,progressTitle } from '../flight-feedback.js';
import { partInsight } from '../part-insights.js';
import { estimateHeight } from '../builder.js';
import { kitDetails } from '../kit-details.js';
const setup=()=>{const s=newExpeditions();startExpedition(s,{seed:1});return s;};

test('a build-limited miss cannot imply that better timing alone is enough',()=>{
 const s=setup(),run=s.active;run.strikes=1;run.program.credits=200;
 const result={target:100000,altitude:2000};const saved=structuredClone(run);
 const advice=missedFlightAdvice(run,result);
 assert.equal(advice.kind,'build');assert.match(advice.advice,/timing alone won’t/);assert.match(advice.summary,/2 misses left/);
 assert.deepEqual(run,saved,'advice must not buy, fit, or mutate anything');
});
test('timing advice appears only when perfect power can plausibly bridge the goal',()=>{
 const run=setup().active;run.strikes=2;
 const average=estimateHeight(run.program,1.1),perfect=estimateHeight(run.program,1.2);
 const advice=missedFlightAdvice(run,{target:(average+perfect)/2,altitude:average});
 assert.equal(advice.kind,'timing');assert.match(advice.advice,/Gold timing/);assert.match(advice.summary,/1 miss left/);
});
test('a finished attempt offers a retry, and unavailable parts cannot become advice',()=>{
 const run=setup().active;run.program.stock=[];run.program.credits=10000;
 assert.match(missedFlightAdvice(run,{target:100000,altitude:2000}).advice,/Compare weight, fuel and thrust/);
 run.status='lost';run.strikes=3;const advice=missedFlightAdvice(run,{target:100000,altitude:2000});
 assert.equal(advice.kind,'ended');assert.match(advice.advice,/research and unlocked worlds/);assert.match(advice.summary,/0 misses left/);
});
test('part comparisons explain total fuel-duration tradeoffs even with efficient traits',()=>{
 const p=setup().active.program;p.parts.equipped.engine='dart';p.partTraits.dart='thrust';p.partTraits.mammoth='efficient';
 assert.match(partInsight(p,'mammoth'),/More thrust; shorter fuel duration/);
 p.launchWorld=1;p.parts.equipped.aero='cap';p.partTraits.needle='smooth';
 assert.match(partInsight(p,'needle'),/vacuum/);assert.doesNotMatch(partInsight(p,'needle'),/Less air drag/);
});
test('first milestones, multiple milestones and new records get distinct headlines',()=>{
 assert.match(progressTitle({cleared:[2500],stage:1}),/first milestone/);
 assert.match(progressTitle({cleared:[2500,10000],stage:1}),/2 milestones/);
 assert.match(progressTitle({cleared:[],stage:3,record:true,improvement:100}),/new best/);
});
test('starting builds retain their identity and show researched equipment',()=>{
 const s=setup();s.profile.research.levels.scientist=5;
 const details=kitDetails(KITS.find(k=>k.id==='scientist'),s.profile);
 assert.match(details.equipment,/Dart.*Science capsule/);assert.match(details.benefit,/50% altitude credits/);
 assert.equal(details.parts.tank.id,'composite');
});

test('tiny numerical records do not celebrate an unchanged displayed result',()=>{
 assert.equal(progressTitle({cleared:[],stage:3,record:true,improvement:1}),'Refit. Try again.');
});
