import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions, startPrototype, beginFlight, settle, restoreSession, prototypeContracts, contractsFor } from '../prototype-run.js';
import { startExpedition, milestoneHeight } from '../expeditions.js';
import { openCampaignSave, packCampaignSave, hasNextWorldOffer } from '../campaign-save.js';
import { estimateHeight } from '../builder.js';
import { earnedPrototype } from '../checks/prototype-audit.js';

function clearedMoon() {
  const s=newExpeditions();s.profile.maxDifficulty=1;
  startPrototype(s,{seed:42,difficulty:1});beginFlight(s,1.17);
  settle(s,{done:true,peak:milestoneHeight(s.active,5)+1,quality:1.17,payMultiplier:1});
  return s;
}
test('old Moon completion unlocks Mars on reload without replaying rewards or changing the saved rocket',()=>{
  const old=clearedMoon();old.prototypeVersion=1;old.profile.maxDifficulty=1;
  const before=structuredClone(old),s=restoreSession(old);
  assert.equal(s.profile.maxDifficulty,2);
  assert.equal(s.active.program.credits,old.active.program.credits);
  assert.deepEqual(s.profile.research,old.profile.research);
  assert.deepEqual(s.active.program.parts,old.active.program.parts);
  assert.deepEqual(old,before);
  assert.ok(startPrototype(s,{seed:7,difficulty:2}));
  assert.equal(s.active.difficulty,2);assert.equal(s.active.program.flights,0);
  assert.equal(s.active.program.credits,260);assert.equal(s.active.strikes,0);
  assert.ok(prototypeContracts(2).every(c=>c.id.startsWith('world-2-')));
});
test('every world unlocks the next and Eris completes the journey only once',()=>{
  const s=newExpeditions();
  for(let world=0;world<9;world++) {
    assert.ok(startPrototype(s,{seed:42+world,difficulty:world}));
    beginFlight(s,1.1);
    const flight={done:true,peak:milestoneHeight(s.active,5)+1,quality:1.1,payMultiplier:1};
    settle(s,flight);
    assert.equal(s.profile.maxDifficulty,Math.min(8,world+1));
    assert.equal(s.profile.campaignComplete,world===8);
    const before=structuredClone(s);assert.equal(settle(s,flight),null);assert.deepEqual(s,before);
  }
  assert.equal(restoreSession(s).profile.prototypeWorlds.length,9);
});
test('earlier unlocked worlds are recognised once while the saved rocket and original campaign stay intact',()=>{
  const original=newExpeditions();original.profile.maxDifficulty=5;original.profile.totalGates=30;
  startExpedition(original,{seed:99,difficulty:5});
  const rogue=newExpeditions();startPrototype(rogue,{seed:42});
  const raw=packCampaignSave(rogue,original),before=structuredClone(raw);
  const opened=openCampaignSave(raw);
  assert.equal(opened.session.profile.maxDifficulty,5);assert.ok(hasNextWorldOffer(opened.session));
  assert.deepEqual(opened.session.active.program.parts,rogue.active.program.parts);
  assert.equal(opened.session.active.program.credits,rogue.active.program.credits);
  assert.deepEqual(opened.other,original);assert.deepEqual(raw,before);
  opened.session.pendingWorld=null;
  const reloaded=openCampaignSave(packCampaignSave(opened.session,opened.other));
  assert.equal(hasNextWorldOffer(reloaded.session),false,'returning to a saved rocket is remembered');
  assert.equal(reloaded.session.active.difficulty,0);
});
test('importing unlocked worlds does not divert an interrupted flight or alter its physics',()=>{
  const original=newExpeditions();original.profile.maxDifficulty=6;original.profile.totalGates=36;
  const rogue=newExpeditions();startPrototype(rogue,{seed:42});beginFlight(rogue,1.17);
  const height=estimateHeight(rogue.active.program,1.17);
  const opened=openCampaignSave(packCampaignSave(rogue,original));
  assert.equal(hasNextWorldOffer(opened.session),false);
  assert.equal(opened.session.active.status,'flying');assert.equal(opened.session.active.launchQuality,1.17);
  assert.equal(estimateHeight(opened.session.active.program,1.17),height);
});
test('all kits can earn the full roguelite journey through real purchases and flights',()=>{
  for(const kit of ['scrapper','stager','scientist'])for(const seed of [7,42]) {
    const row=earnedPrototype({seed,kit,endWorld:8,policy:'contracts'});
    assert.equal(row.session.active.difficulty,8,JSON.stringify({kit,seed,last:row.launches.slice(-5)}));
    assert.equal(row.session.profile.campaignComplete,true,JSON.stringify({kit,seed,last:row.launches.slice(-5)}));
  }
});

test('choosing the recovered launchpad starts a new rocket only on explicit build',()=>{
  const original=newExpeditions();original.profile.maxDifficulty=5;original.profile.totalGates=30;
  const rogue=newExpeditions();startPrototype(rogue,{seed:42});
  const opened=openCampaignSave(packCampaignSave(rogue,original));
  assert.equal(opened.session.active.seed,42);
  assert.ok(startPrototype(opened.session,{seed:77,difficulty:5}));
  assert.equal(opened.session.active.difficulty,5);
  assert.equal(opened.session.active.program.flights,0);
  assert.equal(opened.session.pendingWorld,null);
  assert.deepEqual(opened.other,original);
});
test('later-world interrupted flights keep their world, equipment, contract, and preview through reload',()=>{
  for(const world of [2,5,8]) {
    const s=newExpeditions();s.profile.maxDifficulty=world;
    startPrototype(s,{seed:42,difficulty:world});
    s.active.contractId=contractsFor(s.active)[0].id;
    beginFlight(s,1.17);
    const restored=restoreSession(s);
    assert.equal(restored.active.difficulty,world);
    assert.equal(restored.active.launchQuality,1.17);
    assert.equal(restored.active.contractId,s.active.contractId);
    assert.deepEqual(restored.active.launchSnapshot,s.active.launchSnapshot);
    assert.equal(estimateHeight(restored.active.program,1.17),estimateHeight(s.active.program,1.17));
  }
});

test('completed Moon progress still unlocks Mars after the old UI already started an Earth replay',()=>{
  const old=clearedMoon();
  assert.ok(startPrototype(old,{seed:99,difficulty:0}));
  old.prototypeVersion=1;old.profile.maxDifficulty=1;
  const before=structuredClone(old.active),opened=openCampaignSave(old);
  assert.equal(opened.session.profile.maxDifficulty,2);
  assert.equal(opened.session.pendingWorld,2);
  assert.equal(opened.session.active.seed,99);
  assert.deepEqual(opened.session.active.program.parts,before.program.parts);
  assert.equal(opened.session.active.program.credits,before.program.credits);
});
