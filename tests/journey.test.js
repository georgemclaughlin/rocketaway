import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions, startExpedition } from '../expeditions.js';
import { journeyState, journeyMarkup } from '../journey.js';
const start=()=>{const s=newExpeditions();startExpedition(s,{seed:12345});return s.active;};

test('a fresh journey shows the whole ladder, current target, and final destination',()=>{
 const state=journeyState(start());
 assert.equal(state.reached,0);assert.equal(state.next.altitude,2500);assert.equal(state.goal,160000);
 assert.deepEqual(state.steps.map(s=>s.state),['next','ahead','ahead','ahead','ahead','ahead']);
 assert.equal((journeyMarkup(state).match(/aria-current="step"/g)||[]).length,1);
});
test('live journey advances through multiple milestones without mutating saved progress',()=>{
 const run=start();const state=journeyState(run,15370);
 assert.equal(state.reached,2);assert.equal(state.next.altitude,25000);assert.equal(run.stage,0);
 assert.deepEqual(state.steps.map(s=>s.state),['reached','reached','next','ahead','ahead','ahead']);
 run.stage=2;assert.deepEqual(journeyState(run),state);
});
test('a low retry cannot erase cleared milestones, and completion has no next target',()=>{
 const run=start();run.stage=3;
 assert.equal(journeyState(run,1000).reached,3);assert.equal(journeyState(run,1000).next.altitude,55000);
 const done=journeyState(run,170000);assert.equal(done.reached,6);assert.equal(done.next,null);
 assert.equal((journeyMarkup(done).match(/aria-current="step"/g)||[]).length,0);
});
test('journey labels follow new world targets and preserve legacy Ascent targets',()=>{
 const run=start();run.difficulty=8;
 const state=journeyState(run);assert.equal(state.next.altitude,50000);assert.equal(state.goal,2800000);
 assert.match(journeyMarkup(state),/2800 km/);
 run.conditionsVersion=1;const old=journeyState(run);assert.equal(old.next.altitude,3500);assert.equal(old.goal,224000);
});
