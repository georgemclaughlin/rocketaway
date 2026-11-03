import { newProgram, restoreProgram } from './engine.js?v=space-guide';
import { PARTS, PART_SLOTS, PART_TRAITS, restorePartTraits } from './parts.js?v=space-guide';
import { MODULES, ROUTES } from './modifiers.js?v=space-guide';
import { newResearch, restoreResearch, researchLoadout, syncResearch, awardResearch } from './research.js?v=space-guide';
import { newFlightRecords, restoreFlightRecords, recordLaunch, recordFlightPeak } from './flight-records.js?v=space-guide';
export const EXPEDITION_KEY = 'rocket-away-expeditions-v1';
export const ASCENT_STEP = .05;
export const MOON_CHECKPOINTS = [6000,20000,60000,150000,300000,600000];
export const CHECKPOINTS = [2500,10000,25000,55000,100000,160000];
export const KITS = [
  {id:'scrapper',name:'Scrapper',icon:'⚒',detail:'Starter rocket · 160 credits',credits:160,parts:[],unlock:0},
  {id:'stager',name:'Stagehand',icon:'⇈',detail:'Twin kickers fitted · 140 credits',credits:140,parts:['twins'],unlock:3},
  {id:'scientist',name:'Scientist',icon:'⌁',detail:'Science capsule + Ember · 100 credits',credits:100,parts:['lab','ember'],unlock:6},
];
export function newExpeditions() {
  return {version:2,mode:'expedition',active:null,profile:{runs:0,wins:0,totalGates:0,bestStage:0,maxDifficulty:0,campaignComplete:false,endingAcknowledged:false,discoveries:[],research:newResearch(),flightRecords:newFlightRecords()},history:[]};
}
const int = (value,max=1e8) => Number.isFinite(value) ? Math.max(0,Math.min(max,Math.floor(value))) : 0;
function rng(run) { let x=run.rng|0; x^=x<<13; x^=x>>>17; x^=x<<5; run.rng=x>>>0; return run.rng/4294967296; }
function draw(run,items,count) {
  const pool=[...items], result=[];
  while(pool.length && result.length<count) result.push(pool.splice(Math.floor(rng(run)*pool.length),1)[0]);
  return result;
}
function restock(run) {
  run.program.stock = PART_SLOTS.flatMap(slot => {
    const choices = PARTS.filter(part => part.slot===slot.id && !run.program.parts.owned.includes(part.id) && part.tier<=Math.min(6,2+run.stage*2));
    // Keep the cheapest next upgrade available; the second offer varies by run.
    const cheapest = [...choices].sort((a,b)=>a.price-b.price)[0];
    return cheapest ? [cheapest.id,...draw(run,choices.filter(part=>part!==cheapest),1).map(part=>part.id)] : [];
  });
}
export function milestoneHeight(run,index=run.stage) {
  if(run.difficulty===1 && run.conditionsVersion===1) return MOON_CHECKPOINTS[Math.min(index,5)];
  return Math.round(CHECKPOINTS[Math.min(index,5)]*(1+run.difficulty*ASCENT_STEP)/100)*100;
}
export function checkpoint(run) { return milestoneHeight(run); }
const milestoneReward = index => 160+index*100;
function advanceMilestones(session,altitude) {
  const run=session.active, cleared=[];
  let bonus=0;
  while(run.stage<CHECKPOINTS.length && altitude>=milestoneHeight(run)) {
    cleared.push(milestoneHeight(run)); bonus+=milestoneReward(run.stage); run.stage++; session.profile.totalGates++;
  }
  session.profile.bestStage=Math.max(session.profile.bestStage,run.stage);
  return {cleared,bonus};
}
export function startExpedition(session,{seed,kit='scrapper',difficulty=0}={}) {
  if(session.active && !['won','lost'].includes(session.active.status)) return false;
  const loadout=KITS.find(item=>item.id===kit);
  if(!loadout || session.profile.totalGates<loadout.unlock) return false;
  difficulty=Math.min(int(difficulty,8),session.profile.maxDifficulty);
  const program=newProgram();
  program.launchWorld=difficulty;
  const researched=researchLoadout(session.profile,loadout);
  program.credits=researched.credits; program.relics=[]; program.route=null; program.stock=[]; program.partTraits={};
  const run={seed:(seed>>>0)||1,rng:(seed>>>0)||1,kit,difficulty,conditionsVersion:1,stage:0,strikes:0,status:'build',program,launchQuality:null,lastResult:null,recorded:false};
  for(const part of PARTS.filter(part=>part.price>0)) program.partTraits[part.id]=draw(run,PART_TRAITS.filter(trait=>trait.slots.includes(part.slot)),1)[0].id;
  for(const id of researched.parts) { if(!program.parts.owned.includes(id))program.parts.owned.push(id); program.parts.equipped[PARTS.find(part=>part.id===id).slot]=id; }
  session.active=run; session.mode='expedition'; session.profile.runs++;
  syncResearch(session);
  restock(run); return true;
}
export function beginExpeditionFlight(session,quality) {
  const run=session.active;
  if(!run || run.status!=='build' || !Number.isFinite(quality)) return false;
  run.launchQuality=Math.max(.9,Math.min(1.2,quality)); run.status='flying';
  recordLaunch(session.profile,run.launchQuality);return true;
}
function recordRun(session) {
  const run=session.active;
  if(run.recorded) return;
  run.recorded=true;
  if(run.status==='won') { session.profile.wins++; session.profile.maxDifficulty=Math.max(session.profile.maxDifficulty,Math.min(8,run.difficulty+1)); }
  if(run.status==='won' && run.difficulty===8) { session.profile.campaignComplete=true; session.profile.endingAcknowledged=false; }
  session.history.unshift({seed:run.seed,kit:run.kit,stage:run.stage,won:run.status==='won',difficulty:run.difficulty,modules:[...run.program.relics]});
  session.history=session.history.slice(0,8);
}
export function settleExpedition(session,flight) {
  const run=session.active;
  if(!run || run.status!=='flying' || !flight.done || flight.settled) return null;
  flight.settled=true;
  const altitude=Math.floor(flight.peak), target=checkpoint(run), stage=run.stage+1, oldBest=run.program.best;
  const oldGates=session.profile.totalGates, oldStock=[...run.program.stock];
  const {cleared,bonus}=advanceMilestones(session,altitude), success=cleared.length>0;
  const firstWorld=run.stage===6 && (run.difficulty===8?!session.profile.campaignComplete:run.difficulty===session.profile.maxDifficulty);
  const data=awardResearch(session,cleared.length,firstWorld);
  const flightPay=60+Math.floor(Math.min(altitude,500000)/220*flight.payMultiplier)+(flight.creditBonus||0), total=flightPay+bonus;
  run.program.credits+=total; run.program.best=Math.max(oldBest,altitude); run.program.flights++;
  recordFlightPeak(session.profile,altitude,run.difficulty);
  const result={altitude,target,success,total,flightPay,bonus,data,stage,power:Math.round((flight.quality||run.launchQuality)*100),cleared,nextTarget:run.stage<6?checkpoint(run):null,record:altitude>oldBest,improvement:Math.max(0,altitude-oldBest)};
  run.lastResult=result; run.launchQuality=null; run.program.route=null;
  if(!success) run.strikes++;
  restock(run);
  result.newParts=run.stage<6&&run.strikes<3?run.program.stock.filter(id=>!oldStock.includes(id)):[];
  result.unlockedKits=KITS.filter(kit=>kit.unlock>oldGates&&kit.unlock<=session.profile.totalGates).map(kit=>kit.id);
  if(run.stage===CHECKPOINTS.length) { run.status='won'; recordRun(session); }
  else if(run.strikes>=3) { run.status='lost'; recordRun(session); }
  else run.status='debrief';
  return result;
}
export function continueExpedition(session) {
  const run=session.active;
  if(!run || run.status!=='debrief') return false;
  run.status='build'; return true;
}
export function abandonExpedition(session) {
  const run=session.active;
  if(!run || ['won','lost'].includes(run.status)) return false;
  run.status='lost'; recordRun(session); return true;
}
export function restoreExpeditions(raw) {
  const session=newExpeditions();
  if(!raw || ![1,2].includes(raw.version)) return session;
  session.mode=raw.mode==='classic'?'classic':'expedition';
  const profile=raw.profile||{};
  session.profile.campaignComplete=profile.campaignComplete===true;
  session.profile.endingAcknowledged=profile.endingAcknowledged===true;
  for(const key of ['runs','wins','totalGates','bestStage','maxDifficulty']) session.profile[key]=int(profile[key],key==='bestStage'?6:key==='maxDifficulty'?8:1e8);
  session.profile.flightRecords=restoreFlightRecords(profile.flightRecords,null,session.profile.runs);
  session.profile.research=restoreResearch(profile.research,session.profile);
  session.profile.discoveries=MODULES.filter(item=>Array.isArray(profile.discoveries)&&profile.discoveries.includes(item.id)).map(item=>item.id);
  session.history=(Array.isArray(raw.history)?raw.history:[]).slice(0,8).filter(item=>item&&Number.isFinite(item.seed)).map(item=>({seed:int(item.seed,4294967295),kit:KITS.some(kit=>kit.id===item.kit)?item.kit:'scrapper',stage:int(item.stage,6),won:item.won===true,difficulty:int(item.difficulty,8),modules:MODULES.filter(m=>Array.isArray(item.modules)&&item.modules.includes(m.id)).map(m=>m.id)}));
  if(session.history.some(item=>item.won&&item.difficulty===8)) session.profile.campaignComplete=true;
  const input=raw.active;
  if(!input || !KITS.some(kit=>kit.id===input.kit) || !['draft','route','build','flying','debrief','won','lost'].includes(input.status)) return session;
  const program=restoreProgram(input.program); program.plan='explorer';
  // Old runs keep their earned bonuses. New runs use only physical part traits.
  program.relics=(Array.isArray(input.program?.relics)?input.program.relics:[]).filter((id,index,ids)=>MODULES.some(m=>m.id===id)&&ids.indexOf(id)===index);
  program.route=input.status==='flying' && ROUTES.some(route=>route.id===input.program?.route)?input.program.route:null;
  program.partTraits=restorePartTraits(input.program?.partTraits);
  program.stock=PARTS.filter(part=>Array.isArray(input.program?.stock)&&input.program.stock.includes(part.id)).map(part=>part.id);
  const run={seed:int(input.seed,4294967295)||1,rng:int(input.rng,4294967295)||1,kit:input.kit,difficulty:int(input.difficulty,8),stage:int(input.stage,6),strikes:int(input.strikes,3),status:input.status,program,launchQuality:Number.isFinite(input.launchQuality)?Math.max(.9,Math.min(1.2,input.launchQuality)):(input.status==='flying'?1.1:null),lastResult:null,recorded:input.recorded===true};
  run.conditionsVersion=input.conditionsVersion===1?1:0;
  // Preserve the physics and goals of already-started expeditions.
  if(run.conditionsVersion===1)program.launchWorld=run.difficulty;
  if(input.lastResult && Number.isFinite(input.lastResult.altitude)) {
    const r=input.lastResult;
    run.lastResult={altitude:int(r.altitude),target:int(r.target),success:r.success===true,total:int(r.total),flightPay:int(r.flightPay),bonus:int(r.bonus),data:int(r.data),stage:int(r.stage,6),newParts:PARTS.filter(p=>Array.isArray(r.newParts)&&r.newParts.includes(p.id)).map(p=>p.id),unlockedKits:KITS.filter(k=>Array.isArray(r.unlockedKits)&&r.unlockedKits.includes(k.id)).map(k=>k.id),power:Number.isFinite(r.power)?Math.max(90,Math.min(120,Math.round(r.power))):null,cleared:Array.isArray(r.cleared)?r.cleared.filter(Number.isFinite).map(n=>int(n)):r.success?[int(r.target)]:[],nextTarget:run.stage<6?checkpoint(run):null,record:r.record===true,improvement:int(r.improvement)};
  }
  if(run.stage>=6) run.status='won'; else if(run.strikes>=3) run.status='lost';
  if(run.status==='won' && run.difficulty===8) session.profile.campaignComplete=true;
  if(['draft','route'].includes(run.status) || (run.status==='debrief'&&!run.lastResult)) run.status='build';
  session.active=run;
  session.profile.flightRecords=restoreFlightRecords(profile.flightRecords,run,session.profile.runs);
  syncResearch(session);
  if(raw.version===1 && !['won','lost'].includes(run.status)) {
    // Credit previously flown milestones once when upgrading an old save.
    const {bonus}=advanceMilestones(session,program.best); program.credits+=bonus;
    if(run.stage===6) { run.status='won'; recordRun(session); }
    if(run.lastResult)run.lastResult.nextTarget=run.stage<6?checkpoint(run):null;
    restock(run);
  }
  return session;
}
