import test from 'node:test';
import assert from 'node:assert/strict';
import { earthLayerAt, environmentLabel } from '../science-data.js';
import { newExpeditions, startExpedition, restoreExpeditions, milestoneHeight, beginExpeditionFlight, settleExpedition, continueExpedition } from '../expeditions.js';
import { newProgram, createFlight, stepFlight } from '../engine.js';
import { assemblySpecs, fitPart } from '../parts.js';
import { estimateHeight, previewPart } from '../builder.js';
const copy=x=>JSON.parse(JSON.stringify(x));

test('Earth layer transitions use physical altitude and never appear on other worlds',()=>{
 for(const [altitude,name] of [[0,'Troposphere'],[11999,'Troposphere'],[12000,'Stratosphere'],[50000,'Mesosphere'],[80000,'Thermosphere'],[700000,'Exosphere']])assert.equal(earthLayerAt(altitude).name,name);
 assert.equal(environmentLabel(0,10000000),'Beyond exosphere');
 assert.equal(environmentLabel(1,50000),'Near vacuum');
 assert.equal(environmentLabel(5,50000),'Thick atmosphere');
});
test('Earth rewards a streamlined fairing while the Moon rewards lower weight, using the real flight engine',()=>{
 const p=newProgram();p.parts.equipped={aero:'cap',tank:'composite',engine:'dart',boosters:'bare'};
 p.launchWorld=0;
 assert.ok(previewPart(p,'ceramic').height>estimateHeight(p)*1.5);
 const earth=estimateHeight(p);p.launchWorld=1;
 assert.ok(estimateHeight(p)>earth*2);
 assert.ok(previewPart(p,'ceramic').height<estimateHeight(p));
 assert.ok(previewPart(p,'jumbo').height>estimateHeight(p));
 const flight=createFlight(p.levels,1.1,{plan:'explorer',assembly:assemblySpecs(p)});
 for(let i=0;i<12000&&!flight.done;i++)stepFlight(flight,.05);
 assert.equal(flight.done,true);assert.equal(Math.round(flight.peak),estimateHeight(p));
});
test('new Moon expeditions preserve their conditions and old Moon flights keep their original goals and physics',()=>{
 const s=newExpeditions();s.profile.maxDifficulty=1;startExpedition(s,{seed:51,difficulty:1});
 const restored=restoreExpeditions(copy(s));
 assert.equal(restored.active.conditionsVersion,2);assert.equal(milestoneHeight(restored.active,5),600000);
 assert.equal(estimateHeight(restored.active.program),estimateHeight(s.active.program));
 delete s.active.conditionsVersion;delete s.active.program.launchWorld;delete s.active.program.conditionsVersion;
 beginExpeditionFlight(s,1.17);
 const legacy=restoreExpeditions(copy(s));
 assert.equal(legacy.active.status,'flying');assert.equal(legacy.active.launchQuality,1.17);
 assert.equal(milestoneHeight(legacy.active,5),168000);
 assert.equal(estimateHeight(legacy.active.program),estimateHeight(s.active.program));
 assert.equal(restoreExpeditions(copy(legacy)).active.program.launchWorld,undefined);
});
test('new stock and kit unlock notices survive reload and kits are announced only once',()=>{
 const s=newExpeditions();startExpedition(s,{seed:7});beginExpeditionFlight(s,1.1);
 const result=settleExpedition(s,{done:true,peak:26000,payMultiplier:1});
 assert.deepEqual(result.unlockedKits,['stager']);assert.ok(result.newParts.length);
 assert.deepEqual(restoreExpeditions(copy(s)).active.lastResult.newParts,result.newParts);
 continueExpedition(s);beginExpeditionFlight(s,1.1);
 assert.deepEqual(settleExpedition(s,{done:true,peak:26000,payMultiplier:1}).unlockedKits,[]);
});
test('Moon runs can reach departure through affordable, stocked improvements before three misses',()=>{
 for(const seed of [1,7,42,99,177]){
  const s=newExpeditions();s.profile.maxDifficulty=1;s.profile.totalGates=6;startExpedition(s,{seed,difficulty:1,kit:'scrapper'});
  for(let attempt=0;attempt<12 && !['won','lost'].includes(s.active.status);attempt++){
   const p=s.active.program;
   for(let purchase=0;purchase<4;purchase++){
    const options=p.stock.filter(id=>!p.parts.owned.includes(id)).map(id=>({id,preview:previewPart(p,id)})).filter(x=>x.preview.height>estimateHeight(p));
    options.sort((a,b)=>b.preview.height-a.preview.height);
    if(!options.some(x=>fitPart(p,x.id)))break;
   }
   beginExpeditionFlight(s,1.1);
   settleExpedition(s,{done:true,peak:estimateHeight(p),payMultiplier:1,quality:1.1});continueExpedition(s);
  }
  assert.equal(s.active.status,'won',`seed ${seed}`);
 }
});
