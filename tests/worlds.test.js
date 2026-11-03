import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, TAU_CETI, worldFor, destinationFor, worldRoute } from '../worlds.js';
import { newExpeditions, startExpedition, beginExpeditionFlight, settleExpedition, restoreExpeditions, abandonExpedition, milestoneHeight } from '../expeditions.js';
const copy=value=>JSON.parse(JSON.stringify(value));
const win=session=>{beginExpeditionFlight(session,1.2);return settleExpedition(session,{done:true,peak:milestoneHeight(session.active,5)+100,payMultiplier:1});};

test('nine real launch worlds lead to Tau Ceti, a star rather than a launch surface',()=>{
 assert.deepEqual(WORLDS.map(w=>w.name),['Earth','Moon','Mars','Ceres','Europa','Titan','Triton','Pluto','Eris']);
 assert.equal(worldFor({difficulty:0}).name,'Earth');assert.equal(destinationFor({difficulty:0}).name,'Moon');
 assert.equal(worldFor({difficulty:8}).name,'Eris');assert.equal(destinationFor({difficulty:8}),TAU_CETI);assert.equal(TAU_CETI.star,true);
});
test('the complete journey unlocks one world at a time, persists completion, and allows replay',()=>{
 let s=newExpeditions();
 for(let world=0;world<9;world++){
  assert.equal(s.profile.maxDifficulty,world);assert.equal(s.profile.campaignComplete,false);
  assert.equal(startExpedition(s,{seed:world+1,difficulty:world}),true);
  win(s);assert.equal(s.active.status,'won');assert.equal(s.profile.wins,world+1);
  assert.equal(s.profile.maxDifficulty,Math.min(8,world+1));assert.equal(s.profile.campaignComplete,world===8);
  s=restoreExpeditions(copy(s));assert.equal(s.profile.campaignComplete,world===8);
 }
 assert.equal(s.profile.wins,9);assert.equal((worldRoute(s.profile,8).match(/disabled/g)||[]).length,0);
 assert.equal(startExpedition(s,{seed:20,difficulty:0}),true);abandonExpedition(s);
 assert.equal(s.profile.campaignComplete,true);assert.equal(s.profile.maxDifficulty,8);
 assert.equal(restoreExpeditions(copy(s)).profile.campaignComplete,true);
});
test('loss does not unlock another world and duplicate settlement cannot advance the journey',()=>{
 const s=newExpeditions();startExpedition(s,{seed:1,difficulty:8});assert.equal(s.active.difficulty,0);
 abandonExpedition(s);assert.equal(s.profile.maxDifficulty,0);assert.equal(s.profile.campaignComplete,false);
 startExpedition(s,{seed:2});win(s);const state=copy(s);
 assert.equal(settleExpedition(s,{done:true,peak:999999,payMultiplier:1}),null);assert.deepEqual(s,state);
 assert.equal((worldRoute(s.profile,1).match(/disabled/g)||[]).length,7);
});
test('existing ascent saves keep their rocket and map to the corresponding world',()=>{
 const s=newExpeditions();s.profile.maxDifficulty=4;startExpedition(s,{seed:42,difficulty:4});delete s.profile.campaignComplete;
 const restored=restoreExpeditions(copy(s));assert.equal(worldFor(restored.active).name,'Europa');
 assert.deepEqual(restored.active.program,s.active.program);assert.equal(restored.profile.maxDifficulty,4);assert.equal(restored.profile.campaignComplete,false);
 const final=newExpeditions();final.profile.maxDifficulty=8;startExpedition(final,{seed:43,difficulty:8});win(final);delete final.profile.campaignComplete;
 assert.equal(restoreExpeditions(copy(final)).profile.campaignComplete,true);
 final.active=null;assert.equal(restoreExpeditions(copy(final)).profile.campaignComplete,true);
});
