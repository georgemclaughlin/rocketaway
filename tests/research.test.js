import test from 'node:test';
import assert from 'node:assert/strict';
import {newExpeditions,startExpedition,beginExpeditionFlight,settleExpedition,continueExpedition,restoreExpeditions,abandonExpedition} from '../expeditions.js';
import {buyResearch,newResearch,restoreResearch,researchLoadout,RESEARCH_TRACKS} from '../research.js';
import {assemblySpecs,fitPart} from '../parts.js';
import {estimateHeight} from '../builder.js';
import {newProgram,createFlight,stepFlight} from '../engine.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const finish=(s,peak)=>{beginExpeditionFlight(s,1.1);return settleExpedition(s,{done:true,peak,payMultiplier:1});};
const start=()=>{const s=newExpeditions();startExpedition(s,{seed:12345});return s;};

test('every completed flight earns permanent data; milestone and first-world rewards pay once',()=>{
 const s=start();const r=finish(s,0);assert.equal(r.data,1);assert.equal(s.profile.research.data,1);
 assert.equal(settleExpedition(s,{done:true,peak:50000,payMultiplier:1}),null);assert.equal(s.profile.research.data,1);
 continueExpedition(s);const win=finish(s,200000);assert.equal(win.data,17);assert.equal(s.profile.research.data,18);
 startExpedition(s,{seed:2,difficulty:0});assert.equal(finish(s,200000).data,13);
 assert.equal(restoreExpeditions(copy(s)).profile.research.data,31);
});
test('research purchases enforce cost, unlocks, rank caps, mode and flight phase',()=>{
 const s=start();assert.equal(buyResearch(s,'scrapper'),false);
 s.profile.research.data=100;assert.equal(buyResearch(s,'missing'),false);assert.equal(buyResearch(s,'stager'),false);
 beginExpeditionFlight(s,1);assert.equal(buyResearch(s,'scrapper'),false);settleExpedition(s,{done:true,peak:0,payMultiplier:1});
 assert.equal(buyResearch(s,'scrapper'),false);continueExpedition(s);
 s.mode='classic';assert.equal(buyResearch(s,'scrapper'),false);s.mode='expedition';
 for(let rank=1;rank<=5;rank++){assert.equal(buyResearch(s,'scrapper'),true);assert.equal(s.profile.research.levels.scrapper,rank);}
 assert.equal(s.profile.research.data,101-46);assert.equal(buyResearch(s,'scrapper'),false);
});
test('research changes actual physics and cached estimates immediately for the matching build only',()=>{
 for(const kit of ['scrapper','stager','scientist']){
  const s=newExpeditions();s.profile.totalGates=6;startExpedition(s,{seed:12345,kit});s.profile.research.data=100;
  const old=assemblySpecs(s.active.program),oldHeight=estimateHeight(s.active.program);
  assert.equal(buyResearch(s,kit),true);
  const next=assemblySpecs(s.active.program);assert.ok(estimateHeight(s.active.program)>oldHeight,kit);
  if(kit==='scrapper'){assert.ok(next.mass<old.mass);assert.equal(next.fuelMass,old.fuelMass);}
  if(kit==='stager')assert.ok(next.kick>old.kick);
  if(kit==='scientist'){assert.ok(next.burn>old.burn);assert.ok(next.pay>old.pay);}
  const flight=createFlight(s.active.program.levels,1.1,{plan:'explorer',assembly:next});while(!flight.done)stepFlight(flight,.05);
  assert.equal(estimateHeight(s.active.program),Math.round(flight.peak));
  const other=kit==='scrapper'?'stager':'scrapper';assert.equal(buyResearch(s,other),true);assert.deepEqual(assemblySpecs(s.active.program),next);
  assert.deepEqual(restoreExpeditions(copy(s)).active.program,s.active.program);
 }
});
test('rank unlocks improve future starting builds without replacing currently fitted parts or granting credits twice',()=>{
 const s=start();s.profile.research.data=100;const oldParts=copy(s.active.program.parts),credits=s.active.program.credits;
 buyResearch(s,'scrapper');buyResearch(s,'scrapper');
 assert.deepEqual(s.active.program.parts,oldParts);assert.equal(s.active.program.credits,credits);
 const restored=restoreExpeditions(copy(s));assert.deepEqual(restored.active.program.parts,oldParts);
 abandonExpedition(restored);startExpedition(restored,{seed:2});assert.equal(restored.active.program.parts.equipped.engine,'ember');assert.equal(restored.active.program.credits,180);
 assert.ok(!restored.active.program.stock.includes('ember'));assert.equal(restored.profile.research.data,92);
 const p=newProgram();p.credits=1000;fitPart(p,'ember');const baseline=copy(p);
 buyResearch(restored,'scrapper');assert.deepEqual(p,baseline);
});
test('each max-rank starting rocket has different geometry and simulation strengths',()=>{
 const starts=[];
 for(const track of RESEARCH_TRACKS){
  const s=newExpeditions();s.profile.totalGates=6;s.profile.research.levels[track.id]=5;startExpedition(s,{seed:1,kit:track.id});
  starts.push(s.active.program.parts.equipped);
  assert.equal(new Set(s.active.program.parts.owned).size,s.active.program.parts.owned.length);
  assert.ok(estimateHeight(s.active.program)>2500,track.id);
 }
 assert.equal(starts[0].engine,'dart');assert.equal(starts[0].aero,'needle');assert.equal(starts[1].boosters,'solids');assert.equal(starts[1].tank,'composite');assert.equal(starts[2].aero,'lab');assert.equal(starts[2].engine,'dart');
});
test('old saves receive research credit once and damaged research is sanitized',()=>{
 const old=start();old.profile.totalGates=10;old.profile.wins=2;delete old.profile.research;
 const migrated=restoreExpeditions(copy(old));assert.equal(migrated.profile.research.data,28);
 assert.deepEqual(restoreExpeditions(copy(migrated)),migrated);
 const damaged=restoreResearch({data:-10,levels:{scrapper:999,stager:NaN,scientist:-2,fake:9}});
 assert.deepEqual(damaged,{data:0,levels:{scrapper:5,stager:0,scientist:0}});
 assert.deepEqual(newExpeditions().profile.research,newResearch());
});
