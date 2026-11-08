import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions,startPrototype } from '../prototype-run.js';
import { COMPONENT_RESEARCH } from '../component-research.js';
import { estimateHeight } from '../builder.js';
import { earnedComponentRun } from '../checks/component-research-audit.js';

function compare(slot,world,ids) {
 const session=newExpeditions();session.profile.maxDifficulty=world;
 startPrototype(session,{seed:42,difficulty:world});const p=session.active.program,branch=COMPONENT_RESEARCH.find(s=>s.id===slot);
 p.parts.equipped=Object.fromEntries(['aero','tank','engine','boosters'].map((s,i)=>[s,ids[i]]));
 p.componentResearch=[branch.calibration.id,...branch.tunings.map(n=>n.id)];
 return Object.fromEntries(['standard',...branch.tunings.map(n=>n.id)].map(id=>[id,estimateHeight({...p,tunings:{[slot]:id}},1.1)]));
}
// These intentional all-parts fixtures test tradeoffs, not affordability or a full journey.
test('engine pressure helps weak lift while cruise helps a long-burning Momentum build',()=>{
 const lift=compare('engine',0,['cap','long','spark','bare']);
 assert.ok(lift['pressure-feed']>lift.standard*1.10);assert.ok(lift['pressure-feed']>lift['cruise-feed']*1.10);
 const cruise=compare('engine',1,['needle','drop-tank','momentum-engine','return-boosters']);
 assert.ok(cruise['cruise-feed']>cruise.standard*1.08);assert.ok(cruise['cruise-feed']>cruise['pressure-feed']*1.10);
});
test('tank light shell helps heavy lifting while reservoir helps an efficient engine',()=>{
 const light=compare('tank',0,['cap','long','spark','bare']);
 assert.ok(light['light-shell']>light.standard*1.02);assert.ok(light['light-shell']>light['extended-reservoir']*1.05);
 const long=compare('tank',0,['needle','composite','dart','twins']);
 assert.ok(long['extended-reservoir']>long.standard*1.03);assert.ok(long['extended-reservoir']>long['light-shell']*1.04);
});
test('nose tuning responds to atmosphere rather than one branch always winning',()=>{
 const titan=compare('aero',5,['needle','drop-tank','momentum-engine','return-boosters']);
 assert.ok(titan['streamlined-shell']>titan.standard*1.07);assert.ok(titan['streamlined-shell']>titan['minimal-shell']*1.10);
 const moon=compare('aero',1,['survey-capsule','composite','instrument-engine','bare']);
 assert.ok(moon['minimal-shell']>moon.standard*1.04);assert.ok(moon['minimal-shell']>moon['streamlined-shell']*1.08);
});
test('booster impulse helps early propulsion while light casings help a strong engine',()=>{
 const early=compare('boosters',0,['cap','pocket','spark','twins']);
 assert.ok(early['high-impulse']>early.standard*1.07);assert.ok(early['high-impulse']>early['light-casings']*1.10);
 const late=compare('boosters',1,['needle','drop-tank','momentum-engine','return-boosters']);
 assert.ok(late['light-casings']>late.standard*1.03);assert.ok(late['light-casings']>late['high-impulse']*1.04);
});
test('earned research policy completes Earth–Moon for each kit without pre-owned components',()=>{
 for(const kit of ['scrapper','stager','scientist']) {
  const run=earnedComponentRun({kit,seed:42});assert.equal(run.status,'won',kit);
  assert.deepEqual(run.launches[0].research,[],`${kit} first flight has no free component unlocks`);
  assert.ok(run.launches.some(l=>l.research.includes('engine-calibration')),`${kit} buys permanent research with earned points`);
  assert.equal(run.launches.at(-1).world,1);
 }
});
