import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPONENT_NODES,normalizeComponentUnlocks,normalizeTunings,resolveComponentParts,componentResearchSnapshot} from '../component-research.js';
import {buyComponentResearch,canBuyComponentResearch,componentOwned,buyResearch,restoreResearch} from '../research.js';
import {newExpeditions,startPrototype,beginFlight,settle,restoreSession,PROTOTYPE_VERSION} from '../prototype-run.js';
import {startExpedition,milestoneHeight} from '../expeditions.js';
import {assemblySpecs,fittedParts,catalogFor,fitPart} from '../parts.js';
import {createFlight} from '../engine.js';
import {advanceFlight} from '../flight-playback.js';
import {estimateHeight} from '../builder.js';
import {missionJournalMarkup} from '../mission-journal-ui.js';
import {packCampaignSave,openCampaignSave} from '../campaign-save.js';
const copy=structuredClone;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≈ ${b}`);
function start(kit='scrapper') {
 const s=newExpeditions();s.profile.totalGates=6;s.profile.research.data=100;startPrototype(s,{seed:42,kit});return s;
}
function unlock(s,...ids){for(const id of ids)assert.equal(buyComponentResearch(s,s.active.kit,id),true,id);}
function fit(s,...ids){const p=s.active.program;p.credits=10000;p.stock=catalogFor(p).map(x=>x.id);for(const id of ids)assert.ok(fitPart(p,id));return p;}
function fly(p,quality=1.17,dt=.05){const f=createFlight(p.levels,quality,{plan:'explorer',assembly:assemblySpecs(p)});for(let i=0;i<100000&&!f.done;i++)advanceFlight(f,dt);assert.ok(f.done);return f;}

test('component purchases enforce prerequisites, costs, kit and phase while leaving unlocked tunings unfitted',()=>{
 const s=start(),p=s.active.program,base=assemblySpecs(p),credits=p.credits;
 assert.equal(canBuyComponentResearch(s,'scrapper','pressure-feed'),false);
 assert.equal(buyComponentResearch(s,'scrapper','unknown'),false);
 unlock(s,'engine-calibration');near(assemblySpecs(p).thrust,base.thrust*1.03);
 assert.equal(s.profile.research.data,97);assert.equal(p.credits,credits);
 assert.equal(buyComponentResearch(s,'scrapper','engine-calibration'),false);
 const calibrated=assemblySpecs(p);unlock(s,'pressure-feed');assert.deepEqual(assemblySpecs(p),calibrated);
 assert.equal(p.tunings.engine,'standard');assert.equal(s.profile.research.data,92);
 assert.ok(componentOwned(s.profile,'scrapper','pressure-feed'));
 assert.equal(buyComponentResearch(s,'stager','engine-calibration'),true);assert.deepEqual(assemblySpecs(p),calibrated);
 s.profile.research.data=4;assert.equal(buyComponentResearch(s,'scrapper','cruise-feed'),false);
 s.profile.research.data=100;beginFlight(s,1.1);assert.equal(buyComponentResearch(s,'scrapper','cruise-feed'),false);
 const locked=start();locked.profile.totalGates=0;assert.equal(buyComponentResearch(locked,'scientist','engine-calibration'),false);
 const original=newExpeditions();startExpedition(original);original.profile.research.data=100;
 assert.equal(buyComponentResearch(original,'scrapper','engine-calibration'),false);
});

test('bounded migration rejects unknown nodes, orphan tunings and invalid slot assignments',()=>{
 const ids=['pressure-feed','engine-calibration','pressure-feed','unknown','light-shell'];
 assert.deepEqual(normalizeComponentUnlocks(ids),['engine-calibration','pressure-feed']);
 assert.deepEqual(normalizeTunings({engine:'pressure-feed',tank:'pressure-feed',aero:'unknown'},ids),{aero:'standard',tank:'standard',engine:'pressure-feed',boosters:'standard'});
 assert.deepEqual(normalizeTunings(),{aero:'standard',tank:'standard',engine:'standard',boosters:'standard'});
 assert.deepEqual(restoreResearch({data:10,components:{scrapper:ids,fake:ids}}).components,{scrapper:['engine-calibration','pressure-feed'],stager:[],scientist:[]});
 assert.equal(normalizeComponentUnlocks([...COMPONENT_NODES.map(n=>n.id),...Array(100).fill('unknown')]).length,COMPONENT_NODES.length);
});

test('calibrations and selected tunings resolve cloned scoped parts without rewriting traits or catalog entries',()=>{
 const s=start(),p=fit(s,'reserve-tank','separation-engine','return-boosters'),parts=fittedParts(p),before=copy(parts);
 unlock(s,'engine-calibration','pressure-feed','cruise-feed');
 const calibrated=assemblySpecs(p);p.tunings.engine='pressure-feed';const pressure=assemblySpecs(p);
 near(pressure.thrust,calibrated.thrust*1.12);near(pressure.burn,calibrated.burn*.9);near(pressure.reserveSeconds,calibrated.reserveSeconds*.9);
 p.tunings.engine='cruise-feed';const cruise=assemblySpecs(p);near(cruise.thrust,calibrated.thrust*.92);near(cruise.burn,calibrated.burn*1.12);
 assert.equal(cruise.fuelMass,calibrated.fuelMass);assert.equal(cruise.mass,calibrated.mass);assert.equal(cruise.recovery,90);
 const resolved=resolveComponentParts(p,parts);assert.notEqual(resolved.engine,parts.engine);assert.deepEqual(parts,before);
 p.tunings.engine='standard';unlock(s,'tank-calibration');const tank=assemblySpecs(p);assert.equal(tank.fuelMass,calibrated.fuelMass);assert.equal(tank.burn,calibrated.burn);assert.ok(tank.mass<calibrated.mass);
 unlock(s,'aero-calibration');const aero=assemblySpecs(p);assert.equal(aero.drag,tank.drag);assert.ok(aero.mass<tank.mass);
});

test('Drop tank structural research scales discarded mass, and booster research leaves bare mounts alone',()=>{
 const s=start(),p=fit(s,'drop-tank','momentum-engine'),baseline=assemblySpecs(p);
 unlock(s,'tank-calibration');near(assemblySpecs(p).dropMass,baseline.dropMass*.95);
 unlock(s,'boosters-calibration','high-impulse','light-casings');p.tunings.boosters='high-impulse';const high=assemblySpecs(p);p.tunings.boosters='light-casings';assert.deepEqual(assemblySpecs(p),high);
 assert.equal(high.momentum,true);assert.equal(high.kick,0);
});

test('old attempts and original campaign ignore component fields while fresh attempts inherit permanent unlocks',()=>{
 const s=start();unlock(s,'engine-calibration','pressure-feed');s.active.program.tunings.engine='pressure-feed';
 const old=copy(s);old.prototypeVersion=5;delete old.active.componentResearchVersion;delete old.active.program.componentResearchVersion;
 const before=assemblySpecs(old.active.program),resumed=restoreSession(old);assert.deepEqual(assemblySpecs(resumed.active.program),before);
 assert.equal(resumed.active.program.componentResearchVersion,undefined);assert.equal(resumed.prototypeVersion,PROTOTYPE_VERSION);
 const original=newExpeditions();startExpedition(original);const stats=assemblySpecs(original.active.program);
 Object.assign(original.active.program,componentResearchSnapshot(s.active.program));assert.deepEqual(assemblySpecs(original.active.program),stats);
 s.active.status='lost';assert.ok(startPrototype(s,{seed:7}));assert.deepEqual(s.active.program.componentResearch,['engine-calibration','pressure-feed']);assert.equal(s.active.program.tunings.engine,'standard');
 assert.ok(buyResearch(s,'scrapper'));assert.deepEqual(s.active.program.componentResearch,['engine-calibration','pressure-feed']);
});

test('ignition snapshots survive reload and campaign switching with identical real-flight outcomes',()=>{
 const s=start(),p=fit(s,'reserve-tank','momentum-engine','return-boosters');unlock(s,'engine-calibration','pressure-feed','cruise-feed');p.tunings.engine='cruise-feed';
 const estimated=estimateHeight(p);p.tunings.engine='pressure-feed';assert.notEqual(estimateHeight(p),estimated);p.tunings.engine='cruise-feed';
 beginFlight(s,1.17);const before=copy(s.active.launchSnapshot);
 // Profile growth cannot retrofit an already launched program when resuming.
 s.profile.research.components.scrapper.push('tank-calibration');
 const resumed=openCampaignSave(packCampaignSave(s,newExpeditions())).session;
 assert.deepEqual(resumed.active.launchSnapshot,before);assert.equal(resumed.active.launchQuality,1.17);
 assert.deepEqual(assemblySpecs(resumed.active.program),assemblySpecs(p));
 const a=fly(p),b=fly(resumed.active.program,1.17,.017);near(a.peak,b.peak);
 assert.deepEqual(settle(resumed,b),settle(s,a));
 assert.equal(resumed.active.lastResult.engineering.tunings.engine,'cruise-feed');
 assert.ok(resumed.active.lastResult.engineering.effects.some(x=>x.startsWith('Cruise feed:')));
 assert.deepEqual(restoreSession(resumed).active.lastResult.engineering,resumed.active.lastResult.engineering);
});

test('winning records keep bounded tuning snapshots without inventing historical research',()=>{
 const s=start();unlock(s,'engine-calibration','pressure-feed');s.active.program.tunings.engine='pressure-feed';beginFlight(s,1.1);
 settle(s,{done:true,peak:milestoneHeight(s.active,5)+1,quality:1.1,payMultiplier:1});
 const record=s.profile.missionJournal.worlds[0].best.fresh;assert.equal(record.tunings.engine,'pressure-feed');assert.deepEqual(record.componentResearch,['engine-calibration','pressure-feed']);
 assert.deepEqual(restoreSession(s).profile.missionJournal,s.profile.missionJournal);
 assert.match(missionJournalMarkup(s.profile),/Improved combustion/);assert.match(missionJournalMarkup(s.profile),/Configuration: High-pressure feed/);
 const old=copy(s);delete old.profile.missionJournal.worlds[0].best.fresh.componentResearchVersion;delete old.active.lastResult.engineering.componentResearchVersion;
 const restored=restoreSession(old);assert.equal(restored.profile.missionJournal.worlds[0].best.fresh.tunings,undefined);assert.equal(restored.active.lastResult.engineering.tunings,undefined);
 assert.doesNotMatch(missionJournalMarkup(restored.profile),/Configuration:|Improved combustion/);
});

test('unsupported save or component versions reject without mutating recoverable input',()=>{
 for(const field of ['prototypeVersion','run','program']){
  const raw=start();if(field==='prototypeVersion')raw.prototypeVersion=PROTOTYPE_VERSION+1;else if(field==='run')raw.active.componentResearchVersion=2;else raw.active.program.componentResearchVersion=2;
  const before=copy(raw);assert.throws(()=>restoreSession(raw),/newer/);assert.deepEqual(raw,before);
 }
});

test('tank tunings preserve fuel-duration ratios and detach only their researched dry structure',()=>{
 const s=start('scientist'),p=fit(s,'drop-tank','momentum-engine','twins');
 s.profile.research.levels.scientist=5;buyResearch(s,'scrapper');
 unlock(s,'tank-calibration','light-shell','extended-reservoir');
 const baseline=assemblySpecs(p),baseParts=resolveComponentParts(p,fittedParts(p));
 for(const [id,dry,fuel] of [['light-shell',.75,.95],['extended-reservoir',1.4,1.1]]) {
  p.tunings.tank=id;const tuned=assemblySpecs(p),parts=resolveComponentParts(p,fittedParts(p));
  near(tuned.fuelMass,baseline.fuelMass*fuel);near(tuned.burn,baseline.burn*fuel);near(tuned.dropMass,baseline.dropMass*dry);
  near(parts.tank.mass-parts.tank.fuelMass,(baseParts.tank.mass-baseParts.tank.fuelMass)*dry);
  assert.deepEqual(parts.engine,baseParts.engine);assert.deepEqual(parts.aero,baseParts.aero);assert.deepEqual(parts.boosters,baseParts.boosters);
 }
});
