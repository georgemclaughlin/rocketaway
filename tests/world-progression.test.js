import test from 'node:test';
import assert from 'node:assert/strict';
import { CONDITIONS_VERSION, flightConditions } from '../worlds.js';
import { newExpeditions, startExpedition, expeditionLoadout, KITS, milestoneHeight, beginExpeditionFlight, settleExpedition, restoreExpeditions, continueExpedition } from '../expeditions.js';
import { assemblySpecs, PARTS, fitPart } from '../parts.js';
import { estimateHeight, previewPart } from '../builder.js';
import { createFlight, stepFlight } from '../engine.js';
import { buyResearch } from '../research.js';
const copy=x=>JSON.parse(JSON.stringify(x));
function start(world,kit='scrapper',seed=42,rank=0) {
 const s=newExpeditions();s.profile.maxDifficulty=8;s.profile.totalGates=48;s.profile.research.levels[kit]=rank;
 startExpedition(s,{seed,difficulty:world,kit});return s;
}
function fly(p,quality=1.1) {
 const f=createFlight(p.levels,quality,{plan:'explorer',assembly:assemblySpecs(p)});
 for(let i=0;i<12000&&!f.done;i++)stepFlight(f,.05);
 assert.equal(f.done,true,'flight must finish within the estimate horizon');return f;
}
test('Mars and Titan reward different purchases; Stagehand boosters help in thin air',()=>{
 const mars=start(2,'stager',42,5).active.program,titan=copy(mars);titan.launchWorld=5;
 mars.partTraits={};titan.partTraits={};
 mars.parts.equipped={aero:'needle',tank:'composite',engine:'dart',boosters:'bare'};titan.parts.equipped={...mars.parts.equipped};
 const boostMars=previewPart(mars,'orbitals').height/estimateHeight(mars),noseMars=previewPart(mars,'ceramic').height/estimateHeight(mars);
 const boostTitan=previewPart(titan,'orbitals').height/estimateHeight(titan),noseTitan=previewPart(titan,'ceramic').height/estimateHeight(titan);
 assert.ok(boostMars>noseMars,'Mars makes a staged boost more useful than the heavy fairing');
 assert.ok(noseTitan>boostTitan,'Titan makes streamlining more useful than the same boost');
 assert.ok(boostMars>1.2,'researched Stagehand stages must earn their weight');
 for(const p of[mars,titan])assert.equal(Math.round(fly(p).peak),estimateHeight(p));
});
test('each world offers a funded first choice, and displayed starting credits equal the actual budget',()=>{
 for(let world=0;world<9;world++)for(const kit of KITS){
  const s=start(world,kit.id),p=s.active.program,loadout=expeditionLoadout(s.profile,kit,world);
  assert.equal(p.credits,loadout.credits);assert.equal(loadout.grant,flightConditions(world).grant);
  const saved=restoreExpeditions(copy(s));assert.equal(saved.active.program.credits,p.credits,'reload cannot award funding twice');
  assert.equal(saved.active.conditionsVersion,CONDITIONS_VERSION);assert.equal(estimateHeight(saved.active.program),estimateHeight(p));
  if(world>=2)assert.ok(p.stock.some(id=>PARTS.find(part=>part.id===id).tier>=4),'later stock should be available before launch');
 }
});
test('v0 and v1 expeditions keep old physics, goals, launch quality and earnings through reload',()=>{
 for(const version of[0,1])for(const world of[0,1,2,5,8]){
  const s=start(world);s.active.conditionsVersion=version;
  const p=s.active.program;p.parts.equipped={aero:'needle',tank:'long',engine:'ember',boosters:'twins'};p.parts.owned.push('needle','long','ember','twins');
  if(version===0){delete p.launchWorld;delete p.conditionsVersion;}else p.conditionsVersion=1;
  const height=estimateHeight(p),target=milestoneHeight(s.active,5);beginExpeditionFlight(s,1.15);
  const saved=restoreExpeditions(copy(s));assert.equal(saved.active.status,'flying');assert.equal(saved.active.launchQuality,1.15);
  assert.equal(estimateHeight(saved.active.program),height);assert.equal(milestoneHeight(saved.active,5),target);
  const expected=60+Math.floor(50000/220);
  assert.equal(settleExpedition(saved,{done:true,peak:50000,payMultiplier:1}).flightPay,expected);
  assert.equal(milestoneHeight(restoreExpeditions(copy(saved)).active,5),target);
 }
});
test('altitude credits follow departure progress rather than rewarding vacuum worlds disproportionately',()=>{
 const earnings=[];
 for(const world of[0,1,2,5,8]){
  const s=start(world);beginExpeditionFlight(s,1.1);
  earnings.push(settleExpedition(s,{done:true,peak:milestoneHeight(s.active,5)/2,payMultiplier:1}).flightPay);
 }
 assert.ok(earnings.every(n=>n===earnings[0]));
});
test('full journeys remain finishable with each kit through earned upgrades and real flights',()=>{
 for(const preferred of['scrapper','stager','scientist'])for(const seed of[1,7,42]){
  const s=newExpeditions();let total=0;
  for(let world=0;world<9;world++){
   const kit=s.profile.totalGates>=KITS.find(k=>k.id===preferred).unlock?preferred:'scrapper';
   while(buyResearch(s,kit));startExpedition(s,{seed:seed*100+world,difficulty:world,kit});
   for(let turn=0;turn<12&&!['won','lost'].includes(s.active.status);turn++){
    while(buyResearch(s,kit));const p=s.active.program;
    // Buy toward the next milestone, retaining credits once a viable launch is ready.
    for(let choice=0;choice<8&&estimateHeight(p)<milestoneHeight(s.active);choice++){
     const height=estimateHeight(p),options=PARTS.filter(x=>(p.stock.includes(x.id)||p.parts.owned.includes(x.id))&&(p.parts.owned.includes(x.id)||x.price<=p.credits)).map(x=>({id:x.id,height:previewPart(p,x.id).height})).filter(x=>x.height>height+1).sort((a,b)=>b.height-a.height);
     if(!options.length)break;assert.ok(fitPart(p,options[0].id));
    }
    beginExpeditionFlight(s,1.1);settleExpedition(s,fly(p));continueExpedition(s);total++;
   }
   assert.equal(s.active.status,'won',`${preferred}, seed ${seed}, world ${world}`);
  }
  assert.ok(total>=18&&total<=40,`${preferred}: ${total} launches`);assert.equal(s.profile.campaignComplete,true);
 }
});
