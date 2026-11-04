import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions,startPrototype,beginFlight,settle,arrivePrototype,restoreSession,chooseContract } from '../prototype-run.js';
import { continueExpedition,milestoneHeight } from '../expeditions.js';
import { contractsFor,prototypeContracts,missionPool,contractReady } from '../missions.js';
import { restoreJournal } from '../mission-journal.js';
import { catalogFor,fitPart,assemblySpecs } from '../parts.js';
import { createFlight } from '../engine.js';
import { advanceFlight } from '../flight-playback.js';
import { bestAffordable } from '../checks/prototype-audit.js';
import { packCampaignSave,openCampaignSave } from '../campaign-save.js';

function start(world=0,seed=42,kit='scrapper') {
  const s=newExpeditions();s.profile.maxDifficulty=world;s.profile.totalGates=6;
  startPrototype(s,{seed,difficulty:world,kit});return s;
}
function result(s,peak=milestoneHeight(s.active,5)+1) {
  assert.ok(beginFlight(s,1.1));
  return settle(s,{done:true,peak,quality:1.1,payMultiplier:1});
}
function fit(s,id) {
  s.active.program.credits=10000;s.active.program.stock=catalogFor(s.active.program).map(p=>p.id);
  assert.ok(fitPart(s.active.program,id));
}
test('new mission boards vary by seed, retain reward budgets, and never reroll on reads or refits',()=>{
  for(let world=0;world<9;world++) {
    const pairs=new Set();
    for(const seed of [1,2,3,4,7,42,99,2025]) {
      const s=start(world,seed),board=contractsFor(s.active),before=structuredClone(s);
      assert.equal(board.length,2);assert.ok(board[0].target<board[1].target);
      assert.equal(board.reduce((n,c)=>n+c.reward,0),prototypeContracts(world).reduce((n,c)=>n+c.reward,0));
      assert.deepEqual(contractsFor(restoreSession(s).active),board);assert.deepEqual(s,before);
      result(s,0);continueExpedition(s);assert.deepEqual(contractsFor(s.active),board);
      const absent=missionPool(world).find(c=>!board.some(b=>b.id===c.id));assert.equal(chooseContract(s,absent.id),false);
      pairs.add(board.map(c=>c.id).join(','));
    }
    assert.equal(pairs.size,4,'all four pairings occur in the fixed sample');
  }
});
test('all 36 missions have reachable qualifying builds at ordinary timing, with no experimental part requirement',()=>{
  for(let world=0;world<9;world++)for(const contract of missionPool(world)) {
    const s=start(world),p=s.active.program;p.credits=10000;
    p.stock=catalogFor(p).filter(part=>!part.ability).map(part=>part.id);
    const best=bestAffordable(p,contract);assert.ok(best,contract.id);
    for(const id of best.ids)assert.ok(fitPart(p,id));
    assert.ok(contractReady(p,contract));
    const flight=createFlight(p.levels,1.1,{plan:'explorer',assembly:assemblySpecs(p)});
    for(let i=0;i<12000&&!flight.done;i++)advanceFlight(flight,.05);
    assert.ok(flight.done&&flight.peak>=contract.target,contract.id);
  }
});
test('staging and pointed missions test the fitted build, not a preview or ownership',()=>{
  const s=start(),staged=missionPool(0)[2],pointed=missionPool(0)[3];
  assert.equal(contractReady(s.active.program,staged),false);fit(s,'twins');assert.equal(contractReady(s.active.program,staged),true);
  fit(s,'bare');assert.equal(contractReady(s.active.program,staged),false);
  assert.equal(contractReady(s.active.program,pointed),false);fit(s,'needle');assert.equal(contractReady(s.active.program,pointed),true);
  fit(s,'cap');assert.equal(contractReady(s.active.program,pointed),false);
});
test('interrupted new missions preserve eligibility, timing, rewards and journal entries',()=>{
  const s=start(),c=contractsFor(s.active)[1];fit(s,c.kind==='science'?'lab':'needle');
  chooseContract(s,c.id);beginFlight(s,1.17);
  const resumed=restoreSession(s);assert.deepEqual(resumed.active.launchSnapshot,s.active.launchSnapshot);
  assert.equal(resumed.active.launchQuality,1.17);
  const flight={done:true,peak:c.target,quality:1.17,payMultiplier:1};
  assert.deepEqual(settle(resumed,structuredClone(flight)),settle(s,flight));
  assert.deepEqual(resumed.profile.missionJournal,s.profile.missionJournal);
  const saved=restoreSession(resumed);assert.equal(settle(saved,structuredClone(flight)),null);
  assert.deepEqual(saved.profile.missionJournal,s.profile.missionJournal);
});
test('legacy flights keep their old contracts, rewards and rocket and do not invent launch records',()=>{
  const raw=start(1);raw.prototypeVersion=2;delete raw.active.missionVersion;delete raw.active.worldStartFlights;delete raw.profile.missionJournal;
  raw.active.contractId='moon-science';fit(raw,'lab');beginFlight(raw,1.17);
  const s=restoreSession(raw);assert.equal(s.prototypeVersion,4);assert.deepEqual(contractsFor(s.active),prototypeContracts(1));
  assert.equal(s.active.launchQuality,1.17);assert.equal(s.active.contractId,'moon-science');
  assert.deepEqual(s.active.program.parts,raw.active.program.parts);
  const r=settle(s,{done:true,peak:milestoneHeight(s.active,5)+1,quality:1.17,payMultiplier:1});
  assert.equal(r.contractPay,320);assert.deepEqual(s.profile.missionJournal.missions,['moon-science']);
  assert.equal(s.profile.missionJournal.worlds[1].clears,1);assert.deepEqual(s.profile.missionJournal.worlds[1].best,{});
});
test('mission stamps survive loss, new attempts, and campaign switching, with no duplicate settlement',()=>{
  const s=start(),c=contractsFor(s.active)[1];fit(s,c.kind==='science'?'lab':'needle');
  chooseContract(s,c.id);s.active.stage=5;result(s,c.target);
  assert.deepEqual(s.profile.missionJournal.missions,[c.id]);
  continueExpedition(s);assert.equal(chooseContract(s,c.id),false);
  for(let i=0;i<3;i++){result(s,0);continueExpedition(s);}
  assert.equal(s.active.status,'lost');startPrototype(s,{seed:99});
  const original=newExpeditions(),loaded=openCampaignSave(packCampaignSave(s,original));
  assert.deepEqual(loaded.session.profile.missionJournal,s.profile.missionJournal);assert.deepEqual(loaded.other,original);
  result(loaded.session);const before=structuredClone(loaded.session);
  assert.equal(settle(loaded.session,{done:true,peak:1e8}),null);assert.deepEqual(loaded.session,before);
});
test('Moon records count only Moon launches and separate carried rockets from funded starts',()=>{
  const s=start();result(s,0);continueExpedition(s);result(s);
  assert.equal(s.profile.missionJournal.worlds[0].best.fresh.launches,2);
  arrivePrototype(s);assert.equal(s.active.worldStartFlights,2);
  const resumed=restoreSession(s);result(resumed);
  const row=resumed.profile.missionJournal.worlds[1];assert.equal(row.best.carried.launches,1);
  assert.ok(startPrototype(resumed,{difficulty:1,seed:7,kit:'scientist'}));result(resumed,0);continueExpedition(resumed);result(resumed);
  assert.equal(row.best.fresh.launches,2);assert.equal(row.best.carried.launches,1);
  assert.deepEqual(row.kits,['scrapper','scientist']);
  assert.deepEqual(restoreSession(resumed).profile.missionJournal,resumed.profile.missionJournal);
});
test('winning rocket snapshots are stable, prefer fewer launches, and use mass only as a tie breaker',()=>{
  const s=start();fit(s,'jumbo');result(s);const first=structuredClone(s.profile.missionJournal.worlds[0].best.fresh);
  startPrototype(s,{seed:99});result(s,0);continueExpedition(s);result(s);
  assert.deepEqual(s.profile.missionJournal.worlds[0].best.fresh,first,'lighter but slower does not win');
  startPrototype(s,{seed:7});result(s);const best=structuredClone(s.profile.missionJournal.worlds[0].best.fresh);
  assert.ok(best.mass<first.mass);assert.equal(best.equipped.tank,'pocket');
  s.active.program.parts.equipped.tank='jumbo';assert.deepEqual(s.profile.missionJournal.worlds[0].best.fresh,best);
});
test('journal validation bounds stored data and future versions are preserved by rejection',()=>{
  const s=start();result(s);const raw=structuredClone(s.profile.missionJournal);
  raw.missions=['earth-light','earth-light','<script>'];raw.worlds[9]=raw.worlds[0];
  raw.worlds[0].kits=['stager','stager','invalid'];raw.worlds[0].best.carried=raw.worlds[0].best.fresh;
  raw.worlds[0].best.fresh.equipped.engine='needle';
  const restored=restoreJournal(raw);assert.deepEqual(restored.missions,['earth-light']);assert.equal(restored.worlds[9],undefined);
  assert.deepEqual(restored.worlds[0].kits,['stager']);assert.deepEqual(restored.worlds[0].best,{});
  for(const field of ['missions','journal']) {
    const newer=structuredClone(s);if(field==='missions')newer.active.missionVersion=99;else newer.profile.missionJournal.version=99;
    const before=structuredClone(newer);assert.throws(()=>restoreSession(newer),/newer/);assert.deepEqual(newer,before);
  }
});
