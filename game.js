import { componentNode } from './component-research.js?v=component-research-1';
import { createFlightAudio } from './flight-audio.js?v=component-research-1';
import { flightAbilityLabel } from './experimental.js?v=component-research-1';
import { drawTerrain } from './world-scenery.js?v=component-research-1';
import { createScienceUI } from './science-ui.js?v=component-research-1';
import { environmentLabel } from './science-data.js?v=component-research-1';
import { missionJournalMarkup } from './mission-journal-ui.js?v=component-research-1';
import { journeyRecordsMarkup } from './journey-records-ui.js?v=component-research-1';
import { SAVE_KEY, MILESTONES, newProgram, restoreProgram, launchQuality, createFlight, settleFlight, flightPlan, missionGoal, currentContract } from './engine.js?v=component-research-1';
import { fittedParts, assemblySpecs, partById } from './parts.js?v=component-research-1';
import { KITS, EXPEDITION_KEY, newExpeditions, checkpoint, continueExpedition, abandonExpedition } from './expeditions.js?v=component-research-1';
import { MODULES } from './modifiers.js?v=component-research-1';
import { createExpeditionUI } from './expedition-ui.js?v=component-research-1';
import { createBuilder, rocketArt } from './builder.js?v=component-research-1';
import { journeyState, journeyMarkup, altitudeLabel } from './journey.js?v=component-research-1';
import { CONDITIONS_VERSION, worldFor, destinationFor, WORLDS } from './worlds.js?v=component-research-1';
import { createTravel } from './travel.js?v=component-research-1';
import { createResearchUI, researchButtonState } from './research-ui.js?v=component-research-1';
import { launchRating } from './launch-feedback.js?v=component-research-1';
import { FAST_FORWARD_SECONDS, fastForwardRate, presentationRate, advanceFlight } from './flight-playback.js?v=component-research-1';
import { missedFlightAdvice, progressTitle } from './flight-feedback.js?v=component-research-1';
import { kitDetails } from './kit-details.js?v=component-research-1';
import { startPrototype, beginFlight, settle, arrivePrototype, isPrototype, selectedContract, chooseContract, reserveOffer, contractsFor, contractReady } from './prototype-run.js?v=component-research-1';
import { openCampaignSave, packCampaignSave, hasNextWorldOffer } from './campaign-save.js?v=component-research-1';
const prototype = new URLSearchParams(location.search).get('campaign') !== 'original';
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const astronautArt = new Image();
astronautArt.src = new URL('./assets/astronaut-cartoon.png?v=2', import.meta.url).href;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentScreen = 'workshop';
let program = newProgram(), mode = 'workshop', flight = null, width = 0, height = 0;
let ambientTime = 0, lastTime = 0, armTime = 0, timingPosition = .5, fastForward = false, playbackRate = 1, stars = [], soundEnabled = false, storageAvailable = true;
let flightMilestonesShown = 0, lastJourneyKey = '';
let saveFailure = '', rawExpeditionSave = null, rawFreeSave = null;
let particles = [], recordBefore = 0, recordShown = false, zoneSeen = 0;
let visualFlightTime=0,detachedHardware=[];
let normalPlaybackRate = 1, flightGoals = [], flightRings = [], timingTier = '', noticeAnimation;
const flightAudio = createFlightAudio();
function readSave(key) {try{return localStorage.getItem(key);}catch{storageAvailable=false;return null;}}
rawFreeSave=readSave(SAVE_KEY);
try { program = restoreProgram(JSON.parse(rawFreeSave)); } catch { saveFailure='Your saved game could not be read. Export it before recovering.'; }
// The rocket itself now determines performance; old inventory and records carry over.
program.plan = 'explorer';
let freeProgram = program, expeditionSession = newExpeditions(), otherCampaign = newExpeditions();
rawExpeditionSave=readSave(EXPEDITION_KEY);
try { const saved=openCampaignSave(JSON.parse(rawExpeditionSave),!prototype); expeditionSession=saved.session; otherCampaign=saved.other; } catch(error) { saveFailure=error.message; }
document.querySelector('.app').dataset.prototype=prototype;
const inExpedition = () => expeditionSession.mode === 'expedition' && !!expeditionSession.active;
const canBuild = () => mode === 'workshop' && (expeditionSession.mode === 'classic' || expeditionSession.active?.status === 'build');
if (expeditionSession.mode === 'expedition') currentScreen = 'expedition';
if (inExpedition()) { continueExpedition(expeditionSession); program = expeditionSession.active.program; currentScreen = expeditionSession.active.status === 'build' && !hasNextWorldOffer(expeditionSession) ? 'workshop' : 'expedition'; }
const expeditionUI = createExpeditionUI({ getSession: () => expeditionSession, prototype, ...(prototype?{startRun:startPrototype}:{}), onTravel:()=>travelToNextWorld(expeditionSession.active),
  onExplore: () => persist(),
  onBuild: () => { continueExpedition(expeditionSession); expeditionSession.mode = 'expedition'; program = expeditionSession.active.program; persist(); renderWorkshop(); builder.selectSlot('engine'); showScreen('workshop'); $('workshop-title').focus({ preventScroll: true }); },
  onResume: () => { expeditionSession.mode = 'expedition'; program = expeditionSession.active.program; launch(expeditionSession.active.launchQuality); }
});
const builder = createBuilder({ getProgram: () => program, getReserved:()=>expeditionSession.active?.reservedOffer, onReserve:id=>{if(reserveOffer(expeditionSession,id))persist();}, canEdit: canBuild, getTarget: candidate => buildTarget(candidate).height, getTargetLabel: candidate => buildTarget(candidate).label, onFit: part => {
  persist(); renderWorkshop();
  tone(520,.16,'triangle'); tone(780,.2,'sine',.045,.09);
  const gain = part.height - part.previousHeight;
  $('build-state').textContent = `FITTED · ${gain >= 0 ? '+' : '−'}${altitudeLabel(Math.abs(gain))} AT 110%`;
  if (!reducedMotion) $('assembly-art').animate([{transform:'translateY(5px) scale(.96)'},{transform:'translateY(0) scale(1)'}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
  $('launch-title').textContent = `${part.name}, fitted.`;
  $('launch-description').textContent = 'Ready to see how it flies.';
  $('hangar-status').textContent = `${part.name} fitted. Ready to test.`;
  announce(`${part.name} fitted. Estimated height ${(part.previousHeight/1000).toFixed(1)} to ${(part.height/1000).toFixed(1)} kilometers at 110% power. ${program.credits} credits remaining.`);
} });
const travelToNextWorld = createTravel(() => { if(arrivePrototype(expeditionSession)){program=expeditionSession.active.program;persist();workshop();announce('Arrived at the Moon. Your rocket and credits are kept. No air drag: rethink your build.');return;} workshop(); announce(expeditionSession.active?.difficulty===8 ? 'Tau Ceti reached. Your journey is complete. Take a moment to enjoy it.' : `Arrived at ${destinationFor(expeditionSession.active).name}. Choose your starting rocket.`); });
const researchUI=createResearchUI({prototype,onPreviewTuning:(slot,id)=>{if(builder.previewTuning(slot,id)){showScreen('workshop');$('part-fit').focus({preventScroll:true});}},getSession:()=>expeditionSession,getSelectedKit:()=>expeditionUI.getSelectedKit(),canOpen:()=>mode==='workshop'&&expeditionSession.mode==='expedition'&&(!expeditionSession.active||['build','won','lost'].includes(expeditionSession.active.status)),onPurchase:()=>{persist();renderWorkshop();tone(820,.12);}});
$('research-open').addEventListener('click',()=>researchUI.open());
$('expedition-footer').addEventListener('click',event=>{if(event.target.closest('#research-hub'))researchUI.open();});
$('research-menu').addEventListener('click',()=>{$('menu-dialog').close();researchUI.open();});
function persist() {
  if(saveFailure)return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(freeProgram)); localStorage.setItem(EXPEDITION_KEY, JSON.stringify(packCampaignSave(expeditionSession,otherCampaign,!prototype))); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('save-status').textContent = storageAvailable ? 'PROGRESS SAVED ON THIS DEVICE' : 'PROGRESS LASTS FOR THIS VISIT';
}
function announce(text) { $('announcement').textContent = text; }
function buildTarget(candidate=program) {
  if(!inExpedition()||expeditionSession.active.status!=='build')return {height:null,label:''};
  const run=expeditionSession.active,target=checkpoint(run),contract=isPrototype(run)?selectedContract(run):null;
  return contract&&contractReady(candidate,contract)&&contract.target<=target?{height:contract.target,label:'Contract'}:{height:target,label:'Milestone'};
}
function renderPrototypeTools() {
  const run=expeditionSession.active;
  const visible=inExpedition()&&isPrototype(run)&&mode==='workshop'&&run.status==='build';
  $('contracts-open').hidden=!visible;
  document.querySelector('.app').dataset.contractGoal=visible;
  if(!visible)return;
  const selected=selectedContract(run),offers=contractsFor(run),available=offers.filter(c=>!run.completedContracts.includes(c.id));
  const rewards=available.map(c=>c.reward),low=Math.min(...rewards),high=Math.max(...rewards);
  const prize=selected?`✦ +${selected.reward}`:available.length?low===high?`✦ +${high}`:`✦ ${low}–${high}`:'✓';
  $('contract-selection').textContent=selected?selected.name:available.length?'Choose a goal':'Goals complete';
  $('contract-prize').textContent=prize;
  $('contracts-open').dataset.complete=!available.length;
  $('contracts-open').setAttribute('aria-label',selected?`Optional goal: ${selected.name}. Reward: ${selected.reward} credits. View goals.`:available.length?`Choose an optional goal. Rewards from ${low} to ${high} credits.`:'Optional goals complete. View completed goals.');
  $('contracts-open').title=selected?`${selected.detail}. Reward: ${selected.reward} credits.`:available.length?'Choose an optional goal to earn bonus credits':'Both optional goals are complete for this world';
  $('contracts-open').dataset.selected=!!selected;
  $('contracts-open').disabled=!canBuild();
  $('contracts-help').textContent='Clear a new milestone OR your selected contract to avoid a miss. Each contract pays once per attempt. First completions earn permanent journal stamps.';
  $('contract-offers').innerHTML=offers.map(contract=>{
    const done=run.completedContracts.includes(contract.id),active=selected?.id===contract.id,ready=contractReady(run.program,contract);
    return `<button class="contract-card" data-contract="${contract.id}" aria-pressed="${active}" ${done?'disabled':''}><strong>${contract.name}${done?' · Completed':active?' ✓':''}</strong><span>${contract.detail}</span><small>${done?'Reward already collected':`+${contract.reward} credits · ${ready?'Equipment qualifies':'Refit required'}`}</small></button>`;
  }).join('');
}
$('contracts-open').addEventListener('click',()=>{if(canBuild()&&isPrototype(expeditionSession.active)){renderPrototypeTools();$('contracts-dialog').showModal();$('contracts-close').focus();}});
$('contracts-close').addEventListener('click',()=>$('contracts-dialog').close());
$('contract-offers').addEventListener('click',event=>{
  const id=event.target.closest('[data-contract]')?.dataset.contract;
  if(id&&chooseContract(expeditionSession,id)){persist();renderWorkshop();$('contracts-dialog').close();}
});
$('contract-none').addEventListener('click',()=>{if(chooseContract(expeditionSession,null)){persist();renderWorkshop();$('contracts-dialog').close();}});
function renderPrototypeResult(result) {
  const run=expeditionSession.active;
  if(result.contract) {
    $('result-eyebrow').textContent=result.cleared.length?'MILESTONES + CONTRACT':'CONTRACT COMPLETE';
    $('result-title').textContent=`${result.contract}, complete!`;
    $('result-description').textContent=`${result.cleared.length} new milestones · ${run.stage}/6 cleared. ${3-run.strikes} misses left.`;
  }
  if(!result.success) {
    const contract=selectedContract(run);
    const target=contract&&contractReady(run.program,contract)?Math.min(result.target,contract.target):result.target;
    const feedback=missedFlightAdvice(run,{...result,target});
    $('flight-advice').textContent=feedback.advice+(contract&&!contractReady(run.program,contract)?' Your contract also needs different equipment.':'');
    $('flight-advice').dataset.kind=feedback.kind;
    $('result-description').textContent=`${altitudeLabel(Math.max(0,target-result.altitude))} short · ${3-run.strikes} misses left across this expedition.`;
  }
  if(run.status==='won') {
    $('result-title').textContent=`${worldFor(run).name}, cleared!`;
    $('result-description').textContent=run.difficulty===0?'Take this rocket to the Moon. Parts, credits and remaining misses carry over.':run.difficulty===8?'The last launchpad is behind you. One final crossing to Tau Ceti.':`Next launchpad: ${destinationFor(run).name}. Start a fresh rocket there; research and unlocked worlds stay yours.`;
    $('return').textContent=`Travel to ${destinationFor(run).name} ↗`;
    if(result.nextFunding)$('result-description').textContent=`Fresh rocket on ${destinationFor(run).name} next. ${result.nextFunding} credits saved for its first refit; research stays yours.`;
  }
  if(result.contractPay||result.surveyPay||result.recoveryPay||result.fundingPay) {
    const line=document.createElement('span');line.textContent=[result.contractPay?`Contract +${result.contractPay}`:'',result.surveyPay?`Survey +${result.surveyPay}`:'',result.recoveryPay?`Recovery +${result.recoveryPay}`:'',result.fundingPay?`Saved funding +${result.fundingPay}`:''].filter(Boolean).join(' · ');$('bonus-note').append(line);
  }
  if(result.events?.length) {
    $('result-stock').textContent=result.events.join(' · ');$('result-stock').hidden=false;
  }
  const engineering=result.engineering;
  if(engineering) {
    $('flight-log-open').hidden=false;
    const gain=engineering.estimate-engineering.previousEstimate;
    if(result.success&&run.status!=='won'&&engineering.previousEstimate!==null&&gain>=1000) {
      $('flight-advice').textContent=`Build improved: +${altitudeLabel(gain)} at equal launch power.`;
      $('flight-advice').dataset.kind='record';$('flight-advice').hidden=false;
    }
    if(!result.events?.length&&engineering.effects.length) {
      $('result-stock').textContent=engineering.effects.slice(0,2).join(' · ');
      $('result-stock').hidden=false;
    }
  }
}
function openFlightLog() {
  const result=expeditionSession.active?.lastResult,e=result?.engineering;
  if(!e)return;
  $('flight-log-title').textContent=e.name;
  $('flight-log-comparison').textContent=e.previousEstimate!==null
    ?`At the same 110% launch power: ${altitudeLabel(e.previousEstimate)} → ${altitudeLabel(e.estimate)}. This compares your builds, including research, without the timing difference.`
    :`This build estimates ${altitudeLabel(e.estimate)} at 110% launch power. Your actual launch was ${result.power}%.`;
  $('flight-log-stats').replaceChildren(...[['Peak',altitudeLabel(result.altitude)],['Launch mass',`${e.mass.toFixed(2)} t`],['Powered',`${e.burn.toFixed(1)} s`],['Coasting',`${e.coast.toFixed(1)} s`]].map(([name,value])=>{
    const card=document.createElement('div'),label=document.createElement('span'),number=document.createElement('strong');label.textContent=name;number.textContent=value;card.append(label,number);return card;
  }));
  $('flight-log-effects').replaceChildren(...(e.effects.length?e.effects:['Standard equipment: fuel, mass, thrust and drag shaped this flight.']).map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
  $('flight-log-earnings').textContent=[`Flight +${result.flightPay}`,`Milestones +${result.bonus}`,result.contractPay?`Contract +${result.contractPay}`:'',result.surveyPay?`Survey +${result.surveyPay}`:'',result.recoveryPay?`Recovery +${result.recoveryPay}`:'',result.fundingPay?`Saved funding +${result.fundingPay}`:''].filter(Boolean).join(' · ');
  $('flight-log-funding').textContent=result.nextFunding?`${result.nextFunding} credits reserved for your next ${destinationFor(expeditionSession.active).name} rocket, paid after its first flight. First-time departures save 10% of the closing budget, up to 200 credits. The rest retires with this rocket.`:'';
  $('flight-log-funding').hidden=!result.nextFunding;
  $('flight-log-dialog').showModal();
}
$('flight-log-open').addEventListener('click',openFlightLog);
$('flight-log-menu').addEventListener('click',()=>{$('menu-dialog').close();openFlightLog();});
$('flight-log-close').addEventListener('click',()=>$('flight-log-dialog').close());
function syncScreens() {
  const modal = !$('overlay').hidden;
  if (mode !== 'flying') flightAudio.quiet();
  const app = document.querySelector('.app'), run = expeditionSession.active;
  const expeditionMode = expeditionSession.mode === 'expedition';
  app.dataset.view = currentScreen;
  app.dataset.mode = expeditionMode ? 'expedition' : 'classic';
  app.dataset.hub = expeditionMode && (!run || ['won','lost'].includes(run.status) || hasNextWorldOffer(expeditionSession)) && currentScreen === 'expedition';
  app.dataset.flight = mode !== 'workshop';
  app.style.setProperty('--world-accent', worldFor(run).color);
  $('launchpad').inert = modal || currentScreen !== 'launchpad';
  $('workshop').inert = modal || currentScreen !== 'workshop';
  $('expedition').inert = modal || currentScreen !== 'expedition';
  document.querySelector('.header').inert = modal;
  $('shop-launch').disabled = !canBuild();
  if (mode === 'workshop') $('launch').disabled = !canBuild();
  $('run-classic').disabled = mode !== 'workshop' || !expeditionMode;
  $('switch-campaign').disabled = mode !== 'workshop';
  $('flight-log-menu').disabled=mode!=='workshop'||!inExpedition()||!expeditionSession.active?.lastResult?.engineering;
  $('switch-campaign').textContent = prototype ? 'Original campaign · saved separately' : 'Play roguelite journey';
  $('run-expeditions').textContent = prototype ? 'Roguelite journey' : 'Road to Tau Ceti';
  $('run-expeditions').disabled = mode !== 'workshop' || expeditionMode;
  $('run-classic').setAttribute('aria-pressed', !expeditionMode);
  $('run-expeditions').setAttribute('aria-pressed', expeditionMode);
  $('reset-all').disabled = mode !== 'workshop';
  const data=expeditionSession.profile.research.data;
  const researchButton=researchButtonState(expeditionSession.profile,expeditionUI.getSelectedKit(),prototype);
  for(const id of ['research-open','research-hub','research-menu']){
    if(!$(id))continue;
    $(id).disabled=mode!=='workshop'||!expeditionMode||!!(run&&!['build','won','lost'].includes(run.status));
    if(id==='research-menu')$(id).textContent=`Permanent research · ${data} points`;
    else $(id).innerHTML=researchButton.label;
    if(id!=='research-menu')$(id).setAttribute('aria-label',researchButton.ariaLabel);
    $(id).classList.toggle('research-ready',researchButton.available);
    $(id).dataset.researchState=researchButton.state;
  }
  $('run-abandon').hidden = !inExpedition() || ['won','lost'].includes(run.status);
  $('run-abandon').disabled = mode !== 'workshop';
  $('menu-flight-note').hidden = mode === 'workshop';
  $('menu-context').textContent = expeditionMode ? run && !['won','lost'].includes(run.status) ? `${worldFor(run).name} → ${destinationFor(run).name} · ${run.stage}/6 milestones` : 'Road to Tau Ceti · nine worlds, one journey' : 'Free Flight · permanent rocket and upgrades';
  if (prototype && expeditionMode) $('menu-context').textContent = isPrototype(run) && !['won','lost'].includes(run.status) ? `${worldFor(run).name} · ${run.stage}/6 milestones · World ${run.difficulty+1}/9` : 'Road to Tau Ceti · roguelite journey';
  $('run-details').hidden = !inExpedition() || !run.program.relics.length;
  $('module-count').textContent = run?.program.relics.length || '';
  $('menu-modules').innerHTML = (run?.program.relics || []).map(id => { const m = MODULES.find(m => m.id === id); return `<p><strong>${m.name}</strong><br>${m.detail}</p>`; }).join('');
}
function showScreen(screen) {
  const changed = screen !== currentScreen;
  currentScreen = screen;
  syncScreens();
  if (changed && !reducedMotion) $(screen === 'workshop' ? 'workshop' : screen === 'expedition' ? 'expedition' : 'launchpad').animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:170,easing:'ease-out'});
}
let menuPausedFlight = false;
$('game-menu').addEventListener('click', () => {
  menuPausedFlight = mode === 'flying';
  if (menuPausedFlight) pause();
  syncScreens(); $('menu-dialog').showModal();
});
$('menu-close').addEventListener('click', () => $('menu-dialog').close());
$('menu-dialog').addEventListener('close', () => {
  if (menuPausedFlight && mode === 'paused') pause();
  menuPausedFlight = false;
});
const scienceUI=createScienceUI();
function openReference(id) {
  const resume=menuPausedFlight || mode==='flying';
  menuPausedFlight=false;
  if(mode==='flying')pause();
  $('menu-dialog').close();
  $(id).showModal();
  $(id).addEventListener('close',()=>{if(resume&&mode==='paused')pause();},{once:true});
}
function openScience() {
  const run=inExpedition()?expeditionSession.active:null;
  const world=expeditionSession.mode==='classic'?0:currentScreen==='launchpad'&&run?run.difficulty:$('expedition').dataset.phase==='finale'?9:expeditionUI.getSelectedWorld();
  const legacyWorld=run&&run.conditionsVersion<CONDITIONS_VERSION&&!['won','lost'].includes(run.status)?run.difficulty:null;
  scienceUI.render(world,currentScreen==='launchpad'?flight?.altitude||0:0,legacyWorld);
  openReference('science-dialog');
}
for(const id of ['science-menu','world-briefing','flight-number'])$(id).addEventListener('click',openScience);
$('records-menu').addEventListener('click',()=>{
  const profile=expeditionSession.profile;
  $('records-summary').textContent=profile.campaignComplete?'Tau Ceti reached. Your journey is complete.':`Road to Tau Ceti · ${profile.maxDifficulty} of 9 worlds cleared`;
  if (prototype) $('records-summary').textContent=`Road to Tau Ceti · ${profile.prototypeWorlds?.length||0} of 9 worlds cleared`;
  $('records-content').innerHTML=journeyRecordsMarkup(profile)+(prototype?missionJournalMarkup(profile,expeditionSession.active?.difficulty??profile.maxDifficulty):'');
  $('records-note').textContent=profile.flightRecords.partial?'Older flights may be missing from these records.':'Your expedition records stay with you across retries and replays.';
  openReference('records-dialog');
});
$('records-content').addEventListener('change',event=>{
  if(event.target.id==='journal-world') {
    const world=Number(event.target.value);
    document.querySelector('.mission-journal').outerHTML=missionJournalMarkup(expeditionSession.profile,world);
    $('journal-world').focus({preventScroll:true});
  }
});
$('records-close').addEventListener('click',()=>$('records-dialog').close());
function unlockNotice(result) {
  return (result.unlockedKits||[]).map(id=>KITS.find(k=>k.id===id)).filter(Boolean).map(kit=>{
    const details=kitDetails(kit,expeditionSession.profile);
    return `<div class="unlock-card"><span class="unlock-rocket" aria-hidden="true">${rocketArt(details.parts)}</span><div><strong>${kit.name} unlocked!</strong><span>${details.benefit}</span><small>Choose it on your next expedition.</small></div></div>`;
  }).join('');
}
$('switch-campaign').addEventListener('click', () => {
  if (mode !== 'workshop') return;
  persist();
  const url = new URL(location.href);
  if (prototype) url.searchParams.set('campaign','original');
  else url.searchParams.delete('campaign');
  location.href = url.href;
});
$('run-classic').addEventListener('click', () => {
  if (mode !== 'workshop') return;
  $('menu-dialog').close(); expeditionSession.mode = 'classic'; program = freeProgram;
  workshop(); builder.selectSlot('engine'); persist();
});
$('run-expeditions').addEventListener('click', () => {
  if (mode !== 'workshop') return;
  $('menu-dialog').close(); expeditionSession.mode = 'expedition'; continueExpedition(expeditionSession);
  if (expeditionSession.active) program = expeditionSession.active.program;
  builder.selectSlot('engine'); persist(); renderWorkshop();
  showScreen(expeditionSession.active?.status === 'build' ? 'workshop' : 'expedition');
  $(currentScreen === 'workshop' ? 'workshop-title' : 'expedition-title').focus({ preventScroll: true });
});
$('run-abandon').addEventListener('click', () => {
  if (mode !== 'workshop') return;
  if (confirm('End this expedition? Its rocket and credits will be lost. Your unlocked worlds and starting rockets are kept.')) {
    abandonExpedition(expeditionSession); $('menu-dialog').close();
    persist(); renderWorkshop(); showScreen('expedition'); $('run-start').focus({ preventScroll: true });
  }
});
function tone(...args) { flightAudio.tone(...args); }
function chord(root = 660) {
  [1, 1.25, 1.5].forEach((ratio, index) => tone(root*ratio,.24,'sine',.055,index*.085));
}
$('sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled; flightAudio.enable(soundEnabled);
  $('sound').setAttribute('aria-label', `Turn sound ${soundEnabled ? 'off' : 'on'}`);
  $('sound').setAttribute('aria-pressed', soundEnabled); $('sound-state').textContent = soundEnabled ? 'ON' : 'OFF'; tone(640);
});
function renderJourney() {
  const active = inExpedition();
  $('journey').hidden = !active;
  if (!active) { lastJourneyKey = ''; return; }
  const run = expeditionSession.active;
  const airborne = ['flying','paused'].includes(mode) && flight;
  const journey = journeyState(run, airborne ? flight.peak : null);
  const key = `${run.seed}/${run.difficulty}/${journey.reached}/${mode}/${run.status}/${run.strikes}`;
  if (key === lastJourneyKey) return;
  lastJourneyKey = key;
  $('journey-destination').textContent = `${worldFor(run).name} → ${destinationFor(run).name}`;
  $('journey-count').textContent = `World ${run.difficulty+1}/9`;
  $('journey-steps').innerHTML = journeyMarkup(journey);
  $('journey-current').textContent = run.status === 'lost' ? 'Expedition ended' : journey.next ? `${airborne ? 'Climbing to' : 'Next'}: ${journey.next.name} · ${altitudeLabel(journey.next.altitude)}` : 'Departure target reached!';
  $('journey-lives').textContent = `${3-run.strikes} misses left`;
  document.querySelector('.mission').setAttribute('aria-label', `World ${run.difficulty+1} of 9: ${worldFor(run).name}. Reach ${altitudeLabel(journey.goal)} to travel to ${destinationFor(run).name}. ${journey.reached} of 6 milestones reached.`);
}
function renderWorkshop() {
  $('credits').textContent = program.credits.toLocaleString();
  $('best').textContent = (program.best / 1000).toFixed(1);
  const goal = missionGoal(program);
  const progress = Math.min(100, program.best / goal * 100);
  $('mission-fill').style.width = `${progress}%`;
  $('mission-progress').setAttribute('aria-valuenow', progress.toFixed(1));
  $('mission-status').textContent = program.best >= 200000 ? 'MISSIONS COMPLETE · FREE FLIGHT' : program.won ? 'MISSION 02 · SATELLITE COUNTRY' : 'MISSION 01 · REACH SPACE';
  $('goal-limit').textContent = goal / 1000;
  $('goal-unit').textContent = 'km';
  $('mission-progress').setAttribute('aria-label', 'Best altitude toward space');
  document.querySelector('.mission').setAttribute('aria-label', `Journey to ${goal / 1000} kilometers`);
  const contract = currentContract(program);
  $('contract-detail').textContent = `CONTRACT · ${contract.detail}`;
  $('contract-detail').title = `${contract.title}: ${contract.detail}`;
  $('contract-reward').textContent = `+${contract.reward}`;
  $('milestones').innerHTML = MILESTONES.map(m => `<div class="milestone ${program.milestones.includes(m.altitude) ? 'completed' : ''}" title="${m.label}: +${m.reward} credits"><span>${program.milestones.includes(m.altitude) ? '✓' : '○'}</span>${m.altitude / 1000} km <small>+${m.reward}</small></div>`).join('');
  $('hangar-status').textContent = 'Buy a part, or launch your rocket as-is.';
  if (inExpedition()) {
    const run = expeditionSession.active, result = run.lastResult;
    $('best').textContent = run.stage; $('goal-limit').textContent = '6'; $('goal-unit').textContent = 'cleared';
    const reporting = mode === 'report' && result;
    $('mission-status').textContent = reporting ? `Flight complete · ${(result.altitude/1000).toFixed(1)} km` : run.status === 'won' ? 'EXPEDITION COMPLETE' : run.status === 'lost' ? 'EXPEDITION ENDED' : `Next goal: ${(checkpoint(run)/1000).toFixed(1)} km`;
    $('mission-fill').style.width = `${run.stage/6*100}%`;
    $('mission-progress').setAttribute('aria-valuenow', run.stage/6*100);
    $('mission-progress').setAttribute('aria-label', 'Expedition milestones cleared');
    document.querySelector('.mission').setAttribute('aria-label', `Expedition: ${run.stage} of 6 milestones cleared`);
    $('contract-detail').textContent = reporting ? result.success ? `${result.cleared.length} milestone${result.cleared.length===1?'':'s'} cleared this flight` : 'Goal missed · rocket recovered' : `Best ${(program.best/1000).toFixed(1)} km · ${run.stage}/6 milestones`;
    $('contract-detail').title = 'Pass several milestones in one flight to clear them all.';
    $('contract-reward').textContent = `${3-run.strikes} misses left`;
    if(result) $('hangar-status').textContent = `Last ${(result.altitude/1000).toFixed(1)} km${result.power ? ` · ${result.power}% power` : ''} · +${result.total} credits · +${result.data||0} research points`;
  }
  renderJourney();
  expeditionUI.render();
  builder.render();
  if (mode === 'workshop') { $('flight-number').textContent = `FLIGHT ${String(program.flights + 1).padStart(2, '0')}`; $('flight-number').setAttribute('aria-label','Open world guide'); }
  renderPrototypeTools();
  syncScreens();
}
let lastRocket = null;
function openParts(slotId) {
  if (!canBuild()) return;
  showScreen('workshop'); builder.selectSlot(slotId);
  document.querySelector(`[data-build-slot="${slotId}"]`).focus({ preventScroll: true });
}
canvas.addEventListener('click', event => {
  if (mode !== 'workshop' || !lastRocket) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left - lastRocket.x) / lastRocket.scale;
  const y = (event.clientY - rect.top - lastRocket.y) / lastRocket.scale;
  if (Math.abs(x) > 55 || y < -lastRocket.tankHeight - 42 || y > 45) return;
  openParts(Math.abs(x) > 23 ? 'boosters' : y > 8 ? 'engine' : y < -lastRocket.tankHeight ? 'aero' : 'tank');
});
function updateFlightHud() {
  $('altitude').textContent = (flight.altitude / 1000).toFixed(2);
  $('velocity').textContent = `${Math.max(0, Math.round(flight.velocity * 500)).toLocaleString()} m/s`;
  $('fuel').style.width = `${flight.fuel * 100}%`;
  const environment=environmentLabel(inExpedition()?expeditionSession.active.difficulty:0,flight.altitude);
  $('flight-number').textContent = `${environment} ⓘ`;
  $('flight-number').setAttribute('aria-label',`${environment}. Open world guide.`);
  $('flight-status').textContent = flight.done ? 'APOGEE REACHED' : flight.phase === 'powered' ? 'ENGINES FIRING' : 'COASTING';
  flightAudio.engine(mode === 'flying' && flight.phase === 'powered', Math.max(0,flight.velocity)/12);
  const nextIndex = flightGoals.findIndex(goal => goal.altitude > flight.peak);
  const next = flightGoals[nextIndex], previous = flightGoals[nextIndex-1]?.altitude || 0;
  $('flight-goal').hidden = !flightGoals.length;
  const progress = next ? Math.max(0,Math.min(1,(flight.peak-previous)/(next.altitude-previous))) : 1;
  $('flight-goal-label').textContent = next ? `${altitudeLabel(Math.max(0,next.altitude-flight.peak))} to ${next.name} · ${altitudeLabel(next.altitude)}` : 'All altitude goals crossed';
  $('flight-goal-fill').style.width = `${progress*100}%`;
  $('flight-goal-progress').setAttribute('aria-valuenow',Math.round(progress*100));
  $('flight-goal-progress').setAttribute('aria-label', next ? `Progress to ${next.name} at ${altitudeLabel(next.altitude)}` : 'All altitude goals crossed');
}
function cancelLaunch() {
  if (mode !== 'arming') return;
  mode = 'workshop';
  $('timing').hidden = true; document.querySelector('.launch-console').classList.remove('arming');
  $('launch').innerHTML = 'Prepare launch <span aria-hidden="true">↗</span>';
  $('flight-status').textContent = 'ON THE PAD';
  showScreen('workshop'); renderWorkshop(); $('shop-launch').focus({ preventScroll: true });
  announce('Back to build. No attempt used.');
}
$('cancel-launch').addEventListener('click', cancelLaunch);
function finishEarly() {
  if (mode !== 'flying' || !inExpedition() || (flight.phase==='powered' && flight.peak < checkpoint(expeditionSession.active))) return;
  for (let step = 0; step < 12000 && !flight.done; step++) advanceFlight(flight, 1);
  if (flight.done) finish();
}
function prepare() {
  if (!canBuild()) return;
  builder.discard();
  $('launch-rating').hidden = true;$('ability-flight').hidden=true;
  mode = 'arming'; armTime = 0; timingPosition = 0; timingTier = '';
  $('flight-goal').hidden = true; $('timing').dataset.rating = 'off';
  $('timing-quality').textContent='90%';$('needle').style.left='0px';
  showScreen('launchpad');
  $('timing').hidden = false; document.querySelector('.launch-console').classList.add('arming');
  $('scene-tag').hidden = false;
  $('scene-tag').textContent = inExpedition() ? `${worldFor(expeditionSession.active).name} · ${worldFor(expeditionSession.active).kind}` : 'Ready for ignition';
  if(inExpedition()&&isPrototype(expeditionSession.active)){const c=selectedContract(expeditionSession.active);if(c)$('scene-tag').textContent=c.detail;}
  $('launch').innerHTML = 'Launch! <span aria-hidden="true">↟</span>'; $('flight-status').textContent = 'AWAITING IGNITION';
  renderWorkshop(); announce('Launch ready. Tap Launch when the marker reaches the gold zone. Every launch earns credits.');
  $('launch').focus({ preventScroll: true });
}
function launch(resumeQuality) {
  const resuming = typeof resumeQuality === 'number' && inExpedition() && expeditionSession.active.status === 'flying';
  if (mode !== 'arming' && !resuming) return;
  const quality = resuming ? resumeQuality : launchQuality(timingPosition);
  if (inExpedition() && !resuming && !beginFlight(expeditionSession, quality)) return;
  showScreen('launchpad');
  persist();
  flight = createFlight(program.levels, quality, { plan: program.plan, contractIndex: program.contracts, assembly: assemblySpecs(program) }); mode = 'flying';
  normalPlaybackRate = presentationRate(flight);
  playbackRate = fastForward ? Math.max(normalPlaybackRate, fastForwardRate(flight)) : normalPlaybackRate;
  recordBefore = program.best; flightMilestonesShown = inExpedition() ? expeditionSession.active.stage : 0; recordShown = false; zoneSeen = 0; particles = [];
  visualFlightTime=0;detachedHardware=[];flightRings=[];
  flightGoals = inExpedition() ? journeyState(expeditionSession.active).steps.slice(expeditionSession.active.stage) : MILESTONES.map(goal=>({...goal,name:goal.label}));
  flightImpact('#ffe2a0');
  $('timing').hidden = true; document.querySelector('.launch-console').classList.remove('arming');
  $('launch').disabled = true; $('launch').textContent = 'Flight in progress';
  const rating=launchRating(quality);
  $('launch-rating').textContent = `${rating.label} · ${rating.power}%`;
  $('launch-rating').dataset.rating = rating.tier;
  $('launch-rating').title = `Launch timing: ${rating.label}. ${rating.power}% power; maximum 120%.`;
  $('launch-rating').setAttribute('aria-label', $('launch-rating').title);
  $('launch-rating').hidden = false;
  $('launch-eyebrow').textContent = 'LAUNCH TIMING';
  $('launch-title').textContent = `${rating.label} launch${rating.tier==='off'?'.':'!'}`;
  $('launch-description').textContent = `${rating.power}% power · maximum 120%. Flight computer has control.`;
  $('flight-tools').hidden = false; $('telemetry').hidden = false; $('scene-tag').hidden = true;
  renderSpeed(); $('pause').textContent = 'Ⅱ Pause'; $('pause').setAttribute('aria-label', 'Pause flight');
  syncScreens(); renderJourney();
  tone(90, .5, 'triangle', .09); if(rating.tier==='perfect')chord(660);
  animateNotice(); updateFlightHud();
  announce(`${rating.label} launch. ${rating.power} percent power out of a maximum 120. Flight is automatic.`);
}
$('launch').addEventListener('click', () => mode === 'workshop' ? prepare() : mode === 'flying' ? finishEarly() : launch());
$('shop-launch').addEventListener('click', prepare);
function renderSpeed() {
  $('speed').textContent = fastForward ? '▶▶ Fast ✓' : '▶▶ Fast';
  $('speed').setAttribute('aria-pressed', String(fastForward));
  $('speed').setAttribute('aria-label', fastForward ? 'Fast forward on. Return to normal speed.' : `Fast forward. Finish the remaining flight in about ${FAST_FORWARD_SECONDS} seconds.`);
  $('speed').title = fastForward ? 'Fast forward on · tap for normal speed' : `Fast forward · about ${FAST_FORWARD_SECONDS} seconds to the result`;
}
$('speed').addEventListener('click', () => {
  fastForward = !fastForward;
  playbackRate = fastForward ? Math.max(normalPlaybackRate, fastForwardRate(flight)) : normalPlaybackRate;
  renderSpeed(); announce(fastForward ? `Fast forward. About ${FAST_FORWARD_SECONDS} seconds to the result.` : 'Normal flight speed.');
});
function animateNotice() {
  noticeAnimation?.cancel();
  if (!reducedMotion) noticeAnimation = $('launch-title').animate([{opacity:.3,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
}
function flightImpact(color) {
  if (reducedMotion) return;
  flightRings.push({at:visualFlightTime,color}); flightRings=flightRings.slice(-4);
}
function showFlightNotice(title, detail) {
  $('launch-title').textContent = title; $('launch-description').textContent = detail;
  animateNotice(); announce(`${title} ${detail}`);
}
function pause() {
  if (mode === 'flying') {
    if (noticeAnimation?.playState === 'running') noticeAnimation.pause();
    delete $('result').dataset.outcome;
    mode = 'paused'; $('overlay').hidden = false; $('report').hidden = true;
    $('result').hidden = false;
    $('result-eyebrow').textContent = 'TAKE A LITTLE SPACE'; $('result-title').textContent = 'Just floating.';
    $('result-unlocks').hidden=true;
    $('flight-advice').hidden=true; $('result-stock').hidden=true;$('flight-log-open').hidden=true;
    $('result-description').textContent = 'Your mission will be right here.'; $('bonus-note').textContent = '';
    $('return').textContent = 'Keep flying'; $('pause').textContent = '▷ Resume'; $('pause').setAttribute('aria-label', 'Resume flight');
    syncScreens(); $('return').focus({ preventScroll: true }); announce('Flight paused.');
  } else if (mode === 'paused') {
    if (noticeAnimation?.playState === 'paused') noticeAnimation.play();
    mode = 'flying'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ Pause'; $('pause').setAttribute('aria-label', 'Pause flight');
    syncScreens(); $('pause').focus({ preventScroll: true }); announce('Flight resumed.');
  }
}
$('pause').addEventListener('click', pause);
function finish() {
  const result = inExpedition() ? settle(expeditionSession, flight) : settleFlight(program, flight);
  if (!result) return;
  mode = 'report'; flightAudio.quiet(); $('launch').disabled = true; persist(); renderWorkshop(); updateFlightHud();
  $('flight-advice').hidden=true;
  $('flight-log-open').hidden=true;
  $('result').hidden = false;
  $('result').classList.toggle('record', result.record);
  $('flight-tools').hidden = true; $('overlay').hidden = false; $('report').hidden = false;
  $('result-eyebrow').textContent = result.firstOrbit ? 'MISSION COMPLETE · 200 KM' : result.firstWin ? 'MISSION COMPLETE · 100 KM' : result.contract ? 'CONTRACT COMPLETE' : result.record ? 'A NEW PERSONAL BEST' : 'EVERY FLIGHT IS PROGRESS';
  $('result-title').textContent = result.firstOrbit ? 'Satellite country.' : result.firstWin ? 'Hello, outer space.' : result.altitude < 10000 ? 'Off the ground.' : 'A little closer.';
  $('result-description').textContent = result.firstOrbit ? 'Two hundred kilometers. That little rocket has come a long way.' : result.firstWin ? 'You reached space! Next mission: 200 km. Your parts stay with you.' : result.contract ? `${result.contract.title} completed! ${result.record ? `New best by ${(result.improvement / 1000).toFixed(2)} km.` : 'Another bright idea, funded.'}` : result.record ? `You beat your best by ${(result.improvement / 1000).toFixed(2)} km.` : 'Every experiment funds the next bright idea.';
  $('final-altitude').textContent = `${(result.altitude / 1000).toFixed(2)} km`;
  $('earnings').textContent = `+${result.total.toLocaleString()}`;
  $('bonus-note').textContent = [`Flight +${result.flightPay}`, result.salvage ? `Finds +${result.salvage}` : '', result.contractPay ? `Contract +${result.contractPay}` : '', result.bonus ? `Milestones +${result.bonus}` : ''].filter(Boolean).join(' · ');
  $('return').innerHTML = result.firstWin ? 'Keep exploring <span aria-hidden="true">↗</span>' : 'Improve rocket <span aria-hidden="true">↗</span>';
  if (inExpedition()) {
    const run = expeditionSession.active;
    const count = result.cleared.length;
    $('result-eyebrow').textContent = run.status === 'won' ? 'ALL MILESTONES CLEARED' : run.status === 'lost' ? 'EXPEDITION ENDED' : result.success ? `${count} MILESTONE${count===1?'':'S'} CLEARED` : 'GOAL MISSED';
    $('result-title').textContent = run.status === 'won' ? `${worldFor(run).name}, cleared!` : run.status === 'lost' ? 'A new build awaits.' : progressTitle(result);
    $('result-description').textContent = run.status === 'won' ? `Departure target reached: ${altitudeLabel(journeyState(run).goal)}. ${destinationFor(run).star ? 'The last launchpad is behind you. One final crossing to Tau Ceti.' : `Next launchpad: ${destinationFor(run).name}. A fresh rocket, one step closer to Tau Ceti.`}` : run.status === 'lost' ? 'Your unlocked worlds and starting rockets are kept.' : result.success ? `Journey progress: ${result.stage-1} → ${run.stage} of 6 milestones. Next: ${journeyState(run).next.name} at ${altitudeLabel(result.nextTarget)}.` : `Still working toward ${journeyState(run).next.name} at ${altitudeLabel(result.target)}. Your ${run.stage} cleared milestone${run.stage===1?'':'s'} stay cleared.`;
    $('bonus-note').textContent = `+${result.data} research points · spend in Research`;
    if(!result.success) {
      const feedback=missedFlightAdvice(run,result);
      $('result-description').textContent=`${feedback.summary} ${run.stage} of 6 milestones kept.`;
      $('flight-advice').textContent=feedback.advice;
      $('flight-advice').dataset.kind=feedback.kind;
      $('flight-advice').hidden=false;
    } else if(result.record&&result.improvement>=10&&result.stage>1) {
      $('flight-advice').textContent=`New best · ${altitudeLabel(result.improvement)} higher than your last record.`;
      $('flight-advice').dataset.kind='record'; $('flight-advice').hidden=false;
    }
    $('return').textContent = run.status==='won' ? `Travel to ${destinationFor(run).name} ↗` : run.status==='lost' ? `Retry ${worldFor(run).name} ↗` : 'Back to rocket ↗';
  }
  $('result-unlocks').innerHTML=unlockNotice(result);
  $('result-unlocks').hidden=!$('result-unlocks').textContent;
  const newParts=(result.newParts||[]).map(id=>partById(id)?.name).filter(Boolean);
  $('result-stock').textContent=newParts.length?`New stock: ${newParts.slice(0,2).join(', ')}${newParts.length>2?` +${newParts.length-2} more`:''}.`:'';
  $('result-stock').hidden=!newParts.length;
  const rating=launchRating(flight.quality);
  if(inExpedition())$('bonus-note').innerHTML=`<span class="report-research">+${result.data} research points</span><span>${rating.label} launch · ${rating.power}% power</span>`;
  else $('bonus-note').textContent += ` · ${rating.label} launch · ${rating.power}% power`;
  if(inExpedition()&&isPrototype(expeditionSession.active))renderPrototypeResult(result);
  syncScreens(); $('return').focus({ preventScroll: true }); $('launch').textContent = 'Flight complete';
  const success = inExpedition() ? result.success : result.record || result.firstWin;
  $('result').dataset.outcome = success ? 'success' : 'miss';
  if(success)chord(660);else tone(330,.25,'triangle');
  if(!reducedMotion) {
    $('result').animate([{opacity:0,transform:'translateY(12px) scale(.97)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
    $('earnings').animate([{transform:'scale(1.18)',color:'#fff5ce'},{transform:'scale(1)',color:'#f6d47b'}],{duration:600,easing:'ease-out'});
  }
  announce(`${result.firstWin ? 'Mission complete! ' : ''}Peak altitude ${(result.altitude / 1000).toFixed(2)} kilometers. Earned ${result.total} credits.`);
}
function workshop() {
  mode = 'workshop'; flight = null; flightRings=[]; $('flight-goal').hidden=true;
  $('overlay').hidden = true; $('telemetry').hidden = true; $('scene-tag').hidden = false; $('scene-tag').textContent = 'TAP ROCKET PARTS TO BUILD'; $('flight-tools').hidden = true;
  $('result').hidden = false;
  particles = [];
  $('altitude').textContent = '0.00'; $('flight-status').textContent = 'ON THE PAD';
  $('launch').disabled = false; $('launch').innerHTML = 'Prepare launch <span aria-hidden="true">↗</span>';
  $('launch-eyebrow').textContent = program.won ? 'THE UNIVERSE IS STILL OUT THERE' : 'A NEW DAY AT THE LAUNCHPAD';
  $('launch-title').textContent = program.won ? 'How much further can we go?' : 'A little wiser. A little higher.';
  $('launch-description').textContent = 'Try a new part or swap your build, then give it another go.';
  if (inExpedition()) {
    continueExpedition(expeditionSession);
    const ready = expeditionSession.active.status === 'build' && !hasNextWorldOffer(expeditionSession);
    persist(); showScreen(ready ? 'workshop' : 'expedition'); renderWorkshop();
    (ready ? $('workshop-title') : $('expedition-title')).focus({ preventScroll: true }); return;
  }
  showScreen('workshop'); renderWorkshop();
  document.querySelector('[data-build-slot="engine"]').focus({ preventScroll: true });
}
$('return').addEventListener('click', () => {
  if(mode==='paused')pause();
  else if(mode==='report' && inExpedition() && expeditionSession.active.status==='won')travelToNextWorld(expeditionSession.active);
  else workshop();
});
$('reset-all').addEventListener('click', () => {
  if (mode !== 'workshop') return;
  $('menu-dialog').close(); $('reset-dialog').showModal();
});
$('reset-cancel').addEventListener('click', () => $('reset-dialog').close());
$('reset-confirm').addEventListener('click', () => {
  if (!$('reset-dialog').open || mode !== 'workshop') return;
  $('reset-dialog').close();
  expeditionSession = newExpeditions();
  otherCampaign = newExpeditions();
  expeditionUI.reset();
  program = newProgram(); freeProgram = program;
  builder.selectSlot('engine');
  fastForward = false; playbackRate = 1;
  persist();
  workshop(); showScreen('expedition'); $('run-start').focus({ preventScroll: true });
  announce('Entire game reset. Free Flight and expeditions are ready for a fresh start.');
});
window.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]')) return;
  if (!$('overlay').hidden && event.key === 'Tab') {
    event.preventDefault();
    const buttons = [...$('overlay').querySelectorAll('button')].filter(button => button.getClientRects().length && !button.disabled);
    const index = buttons.indexOf(document.activeElement);
    buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); return;
  }
  if (event.repeat) return;
  if (event.key === 'Escape' && mode === 'arming') { event.preventDefault(); cancelLaunch(); return; }
  if (event.key.toLowerCase() === 'p' || event.key === 'Escape') { if (['flying', 'paused'].includes(mode)) { event.preventDefault(); pause(); } }
  if (event.code === 'Space' && !event.target.closest('button, a')) { event.preventDefault(); if (mode === 'workshop' && currentScreen !== 'expedition') prepare(); else if (mode === 'arming') launch(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'flying') pause(); });
window.addEventListener('blur', () => { if (mode === 'flying') pause(); });
function resize() {
  const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: 100 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: .4 + Math.random() * 1.1, opacity: .2 + Math.random() * .65 }));
  drawScene();
}
new ResizeObserver(resize).observe(canvas);
function mix(a, b, amount) { return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, amount)))).join(',')})`; }
function cloud(x, y, size, opacity) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size); ctx.fillStyle = `rgba(240,235,221,${opacity})`;
  ctx.beginPath(); ctx.ellipse(0, 0, 60, 12, 0, 0, Math.PI * 2); ctx.ellipse(-22, -8, 22, 18, 0, 0, Math.PI * 2); ctx.ellipse(12, -15, 29, 24, 0, 0, Math.PI * 2); ctx.ellipse(39, -5, 22, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function landscape(altitude) {
  const groundY = height - 44 + altitude * .08;
  const world = inExpedition() ? worldFor(expeditionSession.active) : WORLDS[0];
  if (groundY > height + 220) return;
  drawTerrain(ctx,world,width,height,groundY);
  // A tiny observatory watches over the launchpad.
  const buildingX = width * .16;
  ctx.fillStyle = '#d0c8b3'; ctx.fillRect(buildingX - 26, groundY - 30, 52, 30);
  ctx.fillStyle = '#a2b9b8'; ctx.beginPath(); ctx.arc(buildingX, groundY - 30, 26, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#405a67'; ctx.fillRect(buildingX - 3, groundY - 51, 6, 20); ctx.fillRect(buildingX - 17, groundY - 20, 11, 10); ctx.fillRect(buildingX + 6, groundY - 20, 11, 10);
  const x = width * .56;
  ctx.fillStyle = '#2f404e'; ctx.fillRect(x - 48, groundY - 9, 96, 9); ctx.fillStyle = '#bdafa0'; ctx.fillRect(x - 43, groundY - 14, 86, 6);
  ctx.strokeStyle = '#c5bba8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 61, groundY - 6); ctx.lineTo(x - 61, groundY - 145); ctx.lineTo(x - 43, groundY - 145); ctx.lineTo(x - 43, groundY - 6); ctx.stroke();
  ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const y = groundY - 9 - i * 27; ctx.beginPath(); ctx.moveTo(x - 61, y); ctx.lineTo(x - 43, y - 27); ctx.moveTo(x - 43, y); ctx.lineTo(x - 61, y - 27); ctx.stroke(); }
  ctx.fillStyle = '#d8b87c'; ctx.fillRect(x - 43, groundY - 110, 31, 4);
  ctx.strokeStyle = '#c5bba8'; ctx.beginPath(); ctx.moveTo(width * .84, groundY); ctx.lineTo(width * .84, groundY - 49); ctx.stroke();
  ctx.fillStyle = '#e4a38a'; ctx.beginPath(); ctx.moveTo(width * .84, groundY - 49); ctx.lineTo(width * .84 + 26, groundY - 42); ctx.lineTo(width * .84, groundY - 34); ctx.fill();
  if (astronautArt.complete && astronautArt.naturalWidth) {
    const crewHeight = Math.min(84, height * .22), crewWidth = crewHeight * astronautArt.naturalWidth / astronautArt.naturalHeight;
    ctx.drawImage(astronautArt, 10, groundY - crewHeight + 4, crewWidth, crewHeight);
  }
}
function drawScene() {
  if (!width || !height) return;
  const altitude = flight?.altitude || 0, space = Math.min(1, altitude / 80000);
  const world = inExpedition() ? worldFor(expeditionSession.active) : WORLDS[0];
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, mix(world.sky, [12,17,38], space)); gradient.addColorStop(1, mix(world.haze, [41,43,77], space));
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  const visibility = Math.max(world.clouds || world.name==='Mars' ? .08 : .65, space);
  for (const star of stars) { ctx.fillStyle = `rgba(240,236,220,${star.opacity * visibility})`; ctx.beginPath(); ctx.arc(star.x, (star.y + altitude * .0006) % height, star.r, 0, Math.PI * 2); ctx.fill(); }
  const tankHeight = fittedParts(program).tank.height;
  const rocketScale = Math.min(.95, Math.max(.35, height / 320), (height - 65) / (tankHeight + 100));
  const padY = height - 44 - rocketScale * 49;
  const cruiseY = Math.min(height - 45, Math.max((tankHeight + 38) * rocketScale + 12, height * .48));
  const rocketY = padY + (cruiseY - padY) * Math.min(1, altitude / 1300);
  // Gates are altitude markers, not obstacles. Their distance is normalized per
  // goal so a Moon departure is as readable as the first Earth milestone.
  if (flight && ['flying','paused'].includes(mode)) {
    for (const goal of flightGoals) {
      const distance = (goal.altitude - altitude) / Math.max(2500,goal.altitude);
      const y = rocketY - distance * height * 1.8;
      if (distance > .4 || distance < -.18 || y < 100 || y > height-55) continue;
      ctx.save(); ctx.globalAlpha = .8;
      ctx.strokeStyle = '#b8ffe1'; ctx.lineWidth = 2; ctx.setLineDash([12,8]);
      ctx.beginPath(); ctx.moveTo(16,y); ctx.lineTo(width-16,y); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#102c37';
      const label = `${goal.name.toUpperCase()} · ${altitudeLabel(goal.altitude)}`;
      ctx.font = 'bold 10px monospace';
      ctx.fillRect(16,y-24,ctx.measureText(label).width+16,20);
      ctx.fillStyle = '#caffdf'; ctx.fillText(label,24,y-10); ctx.restore();
    }
  }
  if (altitude > 25000) {
    ctx.save(); ctx.globalAlpha = Math.min(.5, (altitude - 25000) / 100000);
    const earth = ctx.createRadialGradient(width * .5, height * 3.8, height * 3.15, width * .5, height * 3.8, height * 3.5); earth.addColorStop(0, world.terrain[2]); earth.addColorStop(.5, world.color); earth.addColorStop(1, world.color+'00');
    ctx.fillStyle = earth; ctx.fillRect(0, height * .3, width, height); ctx.restore();
  }
  if (world.name==='Earth' && altitude > 40000 && altitude < 140000) {
    ctx.save(); ctx.globalAlpha = .12;
    for (let band = 0; band < 3; band++) {
      ctx.strokeStyle = ['#90e1c5', '#96a7ee', '#e1b5e4'][band]; ctx.lineWidth = 20;
      ctx.beginPath(); ctx.moveTo(-20, height * .4 + band * 20);
      ctx.bezierCurveTo(width * .3, height * .05, width * .6, height * .7, width + 20, height * .2 + band * 20); ctx.stroke();
    }
    ctx.restore();
  }
  // Recognizable companions above the moons; no invented moon over every world.
  const companion = world.name==='Earth'?'moon':world.companion;
  if(companion) {
    const colors={moon:'#ece7cf',earth:'#72adc5',jupiter:'#d5b08b',neptune:'#567fc4'};
    const radius=companion==='moon'?19:companion==='jupiter'?40:29;
    ctx.save(); ctx.globalAlpha=.65+space*.25;ctx.fillStyle=colors[companion];
    ctx.beginPath();ctx.arc(width*.84,height*.25,radius,0,Math.PI*2);ctx.fill();ctx.clip();
    ctx.fillStyle=companion==='earth'?'#7caa85':'#8d7b8066';
    if(companion==='jupiter')for(let i=-2;i<=2;i++)ctx.fillRect(width*.84-radius,height*.25+i*12,radius*2,5);
    else {ctx.beginPath();ctx.ellipse(width*.84+5,height*.25-4,radius*.35,radius*.5,.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  const drift = reducedMotion ? 0 : Math.sin(ambientTime * .1) * 20;
  for (const [x, at, size] of [[.12,800,.8],[.78,2400,1.2],[.27,5100,1.4],[.83,8500,1],[.32,12500,.8]]) {
    const y = rocketY + (altitude - at) * .032;
    if (world.clouds && y > -70 && y < height + 70) cloud(width * x + drift, y, size, .48);
  }
  drawDiscoveries(altitude, rocketY);
  if (flight && recordBefore > 0) {
    const recordY = rocketY + (altitude - recordBefore) * .018;
    if (recordY > 100 && recordY < height - 60) {
      ctx.save(); ctx.strokeStyle = '#f6d47b88'; ctx.setLineDash([4, 7]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, recordY); ctx.lineTo(width, recordY); ctx.stroke();
      ctx.fillStyle = '#ffedb4'; ctx.font = '9px monospace'; ctx.fillText(`YOUR BEST · ${(recordBefore / 1000).toFixed(1)} km`, 18, recordY - 8); ctx.restore();
    }
  }
  if (altitude > 1200) {
    ctx.strokeStyle = '#e3eaf026'; ctx.fillStyle = '#f2f2e59c'; ctx.lineWidth = 1; ctx.font = '9px monospace';
    const nearest = Math.floor(altitude / 10000) * 10000;
    for (let marker = nearest - 10000; marker <= nearest + 20000; marker += 10000) {
      if (marker <= 0) continue;
      const y = rocketY + (altitude - marker) * .018;
      if (y > 115 && y < height - 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(24, y); ctx.stroke(); ctx.fillText(`${marker / 1000} km`, 30, y + 3); }
    }
  }
  landscape(altitude);
  // Visible speed and falling hardware use presentation time, never physics time.
  // Fast Forward still gives a separation a readable moment; pause freezes it.
  if(flight&&!reducedMotion&&mode!=='workshop') {
    const speed=Math.min(1,Math.max(0,flight.velocity)/16);
    ctx.strokeStyle=`rgba(196,224,234,${speed*.18})`;ctx.lineWidth=1;
    for(let i=0;i<8;i++) {
      const px=width*(i<4 ? .06+i*.095 : .70+(i-4)*.08);
      const py=(i*97+visualFlightTime*(50+speed*260))%(height+80)-40;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+12+speed*32);ctx.stroke();
    }
    for(const piece of detachedHardware) {
      const age=visualFlightTime-piece.at;if(age>1.3)continue;
      for(const side of [-1,1]) {
        ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.3);ctx.translate(width*.56+side*(26+age*70),height*piece.y+age*85);ctx.rotate(side*(age*1.8+.15));
        ctx.fillStyle=piece.kind==='tank'?'#92d7c2':'#c5d5db';ctx.beginPath();ctx.roundRect(-6,-19,12,piece.kind==='tank'?25:38,4);ctx.fill();ctx.fillStyle='#d7b468';ctx.fillRect(-6,-10,12,4);ctx.restore();
      }
    }
  }
  const x = width * .56, powered = mode === 'flying' && flight.phase === 'powered';
  if (powered) {
    ctx.save();
    const glow = ctx.createRadialGradient(x,rocketY+35*rocketScale,0,x,rocketY+35*rocketScale,85*rocketScale);
    glow.addColorStop(0,'#ffd27c55'); glow.addColorStop(1,'#ff9b4000');
    ctx.fillStyle=glow;ctx.fillRect(x-90*rocketScale,rocketY-55*rocketScale,180*rocketScale,180*rocketScale);
    ctx.restore();
  }
  if (!reducedMotion) for (const ring of flightRings) {
    const age=visualFlightTime-ring.at;
    if(age>1)continue;
    ctx.save();ctx.globalAlpha=(1-age)*.7;ctx.strokeStyle=ring.color;ctx.lineWidth=3*(1-age)+1;
    ctx.beginPath();ctx.ellipse(x,rocketY,20+age*width*.5,12+age*height*.25,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  if (powered && altitude < 1200 && !reducedMotion) { cloud(x - 23, height - 52 + altitude * .06, .55 + flight.time * .2, .25); cloud(x + 25, height - 48 + altitude * .06, .55 + flight.time * .2, .25); }
  rocket(x, rocketY, rocketScale, 0, powered && (flight.quality > 1.13||flight.time<flight.surgeUntil||flight.momentumFull), ambientTime, powered);
  lastRocket = { x, y: rocketY, scale: rocketScale, tankHeight };
  canvas.classList.toggle('buildable', mode === 'workshop');
  if (powered && !reducedMotion) {
    particles.push({ x: x + (Math.random() - .5) * 7, y: rocketY + rocketScale * 52, vx: (Math.random() - .5) * 22, vy: 35 + Math.random() * 45, life: .7, age: 0, color: flightPlan(program.plan).color, size: 2 + Math.random() * 4 });
  }
  if (mode === 'arming') { ctx.fillStyle = '#f6d47b'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText('READY FOR IGNITION', x, rocketY - rocketScale * 90); ctx.textAlign = 'left'; }
}

function rocket(x, y, scale, rotation, boosting = false, time = ambientTime, flameEnabled = true) {
  const parts = fittedParts(program), tankHeight = parts.tank.height-(flight?.dropReleased?20:0), paint = flightPlan(program.plan).color;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(scale, scale);
  if (flameEnabled) {
    const ramp=flight?.momentum&&flight.phase==='powered' ? .65+1.25*Math.min(1,flight.time/10) : 1;
    const tuningFlame=program.componentResearchVersion===1 ? (program.tunings?.engine==='pressure-feed' ? 1.12 : program.tunings?.engine==='cruise-feed' ? .92 : 1) : 1;
    const length = Math.min(88,(boosting ? 66 : 48)*ramp*tuningFlame) * (1 + Math.sin(time * 25) * .10);
    ctx.fillStyle = '#f19a6f33'; ctx.beginPath(); ctx.ellipse(0, 53, 23, length * .7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flight&&flight.time<flight.surgeUntil?'#91e6db':parts.engine.ability==='endurance'?'#e8b66d':'#ee9a70'; ctx.beginPath(); ctx.moveTo(-13, 34); ctx.quadraticCurveTo(-15, 54, 0, 35 + length); ctx.quadraticCurveTo(15, 54, 13, 34); ctx.fill();
    ctx.fillStyle = '#ffe9a4'; ctx.beginPath(); ctx.moveTo(-7, 34); ctx.lineTo(0, 35 + length * .6); ctx.lineTo(7, 34); ctx.fill();
  }
  // Separate side-mounted boosters are discarded after their automatic stage fires.
  if (parts.boosters.kick > 0 && (!flight || !flight.boosted)) {
    const boosterHeight = 43 + parts.boosters.tier * 5;
    for (const side of [-1, 1]) {
      const bx = side * 30;
      ctx.fillStyle = '#a8b8bc'; ctx.fillRect(Math.min(bx, 0), 2, Math.abs(bx), 5);
      ctx.fillStyle = '#dce0d5'; ctx.beginPath(); ctx.roundRect(bx - 7, 30 - boosterHeight, 14, boosterHeight, 5); ctx.fill();
      ctx.fillStyle = paint; ctx.fillRect(bx - 7, 34 - boosterHeight, 14, 7);
      ctx.fillStyle = '#536b7b'; ctx.fillRect(bx - 6, 27, 12, 7);
    }
  }
  // The tank is an actual visible stack section; longer tanks make taller rockets.
  ctx.fillStyle = '#e8e9dc'; ctx.beginPath(); ctx.roundRect(-17, -tankHeight, 34, tankHeight + 10, 3); ctx.fill();
  ctx.fillStyle = '#bac8c6'; ctx.fillRect(8, -tankHeight, 9, tankHeight + 10);
  ctx.fillStyle = parts.tank.id === 'composite' ? '#6a8591' : '#d8d6bf';
  for (let ty = -tankHeight + 10; ty < 6; ty += 24) ctx.fillRect(-17, ty, 34, 3);
  ctx.fillStyle = paint; ctx.fillRect(-17, -tankHeight + 3, 34, 5);
  if(parts.tank.ability==='drop'&&!flight?.dropReleased) {
    ctx.fillStyle='#79b9ac';ctx.fillRect(-19,-tankHeight*.45,38,17);ctx.strokeStyle='#d9eae1';ctx.lineWidth=1;ctx.strokeRect(-19,-tankHeight*.45,38,17);
  }
  if(parts.tank.ability==='reserve') {
    ctx.fillStyle=flight?.reserveOpened?'#9aebc4':'#7a91ac';ctx.fillRect(-17,-tankHeight*.75,34,8);
  }
  ctx.fillStyle = '#354d61'; ctx.fillRect(-8, -tankHeight * .5 - 7, 16, 14);
  ctx.fillStyle = '#b8dfd7'; ctx.fillRect(-5, -tankHeight * .5 - 4, 5, 5);
  // Nose cones include a rounded starter, a pointed fairing, and a science capsule.
  if (parts.aero.shape === 'capsule') {
    ctx.fillStyle = '#9fc7c4'; ctx.beginPath(); ctx.roundRect(-23, -tankHeight - 32, 46, 32, [16,16,3,3]); ctx.fill();
    ctx.fillStyle = '#294154'; ctx.beginPath(); ctx.arc(0, -tankHeight - 17, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cbe5db'; ctx.beginPath(); ctx.arc(-3, -tankHeight - 20, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    const tip = parts.aero.shape === 'pointed' ? 42 : 28;
    ctx.fillStyle = parts.aero.id === 'ceramic' ? '#ece7d3' : paint;
    ctx.beginPath(); ctx.moveTo(-17, -tankHeight);
    ctx.quadraticCurveTo(-15, -tankHeight - tip * .6, 0, -tankHeight - tip);
    ctx.quadraticCurveTo(15, -tankHeight - tip * .6, 17, -tankHeight); ctx.closePath(); ctx.fill();
    if (parts.aero.id === 'ceramic') { ctx.fillStyle = paint; ctx.fillRect(-17, -tankHeight - 4, 34, 4); }
  }
  // Bells change silhouette: a compact starter, efficient long bell, or triple cluster.
  ctx.fillStyle = '#879b9f'; ctx.fillRect(-16, 8, 32, 8);
  const bell = (bx, halfWidth, bottom) => {
    ctx.fillStyle = '#506879'; ctx.beginPath(); ctx.moveTo(bx - halfWidth * .6, 15); ctx.lineTo(bx - halfWidth, bottom); ctx.lineTo(bx + halfWidth, bottom); ctx.lineTo(bx + halfWidth * .6, 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = flameEnabled ? '#f6d47b' : '#253b4c'; ctx.fillRect(bx - halfWidth, bottom - 3, halfWidth * 2, 3);
  };
  if (parts.engine.shape === 'cluster') { bell(-14, 9, 35); bell(14, 9, 35); bell(0, 9, 39); }
  else bell(0, parts.engine.id === 'spark' ? 12 : 18, parts.engine.shape === 'long' ? 40 : 34);
  if(parts.engine.ability) {
    ctx.strokeStyle=parts.engine.ability==='momentum'?'#eba475':parts.engine.ability==='surge'?'#91e6db':'#9bc8ba';ctx.lineWidth=3;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-12-i,18+i*5);ctx.lineTo(12+i,18+i*5);ctx.stroke();}
  }
  if(parts.aero.ability==='feather') {
    ctx.strokeStyle='#8ae3c6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,-tankHeight-5);ctx.lineTo(0,-tankHeight-28);ctx.lineTo(10,-tankHeight-5);ctx.stroke();
  }
  ctx.fillStyle = paint;
  for (const side of [-1,1]) { ctx.beginPath(); ctx.moveTo(side * 17, -8); ctx.lineTo(side * 31, 36); ctx.lineTo(side * 17, 27); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawDiscoveries(altitude, rocketY) {
  const balloonY = rocketY + (altitude - 1300) * .045;
  if ((!inExpedition() || worldFor(expeditionSession.active).name==='Earth') && balloonY > -80 && balloonY < height + 80) {
    ctx.save(); ctx.translate(width * .22, balloonY); ctx.fillStyle = '#e4b8a1';
    ctx.beginPath(); ctx.ellipse(0, 0, 19, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffe4bb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-11, 20); ctx.lineTo(-6, 45); ctx.moveTo(11, 20); ctx.lineTo(6, 45); ctx.stroke();
    ctx.fillStyle = '#756053'; ctx.fillRect(-8, 43, 16, 12); ctx.fillStyle = '#f6d47b'; ctx.fillRect(-2, 46, 4, 5); ctx.restore();
  }
  const satelliteY = rocketY + (altitude - 95000) * .008;
  if (satelliteY > -70 && satelliteY < height + 70) {
    ctx.save(); ctx.translate(width * .25, satelliteY); ctx.rotate(-.3);
    ctx.fillStyle = '#7d9bb8'; ctx.fillRect(-54, -13, 37, 26); ctx.fillRect(17, -13, 37, 26);
    ctx.strokeStyle = '#abcbd3'; ctx.lineWidth = 1;
    for (const x of [-42,-29,29,42]) { ctx.beginPath(); ctx.moveTo(x,-13); ctx.lineTo(x,13); ctx.stroke(); }
    ctx.fillStyle = '#e2d7b9'; ctx.fillRect(-14,-18,28,36);
    ctx.strokeStyle = '#e2d7b9'; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,-35); ctx.stroke();
    ctx.fillStyle = '#f6d47b'; ctx.beginPath(); ctx.arc(0,-36,3,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}
function burst(x, y, color, count = 30) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2, velocity = 35 + Math.random() * 100;
    particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: 1 + Math.random(), age: 0, color, size: 2 + Math.random() * 3 });
  }
}
function drawParticles(dt) {
  for (const particle of particles) {
    if (mode !== 'paused') { particle.age += dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt; }
    ctx.globalAlpha = Math.max(0, 1 - particle.age / particle.life) * .7; ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
  particles = particles.filter(p => p.age < p.life).slice(-180);
}
function checkFlightMoments() {
  if (inExpedition()) {
    const run = expeditionSession.active, journey = journeyState(run,flight.peak);
    renderJourney();
    if(flight.phase==='coasting') { $('launch').disabled=false; $('launch').textContent='See result ↗'; }
    if (flight.peak >= checkpoint(run)) {
      $('flight-status').textContent = `${journey.reached} OF 6 MILESTONES`;
      $('launch').disabled = false; $('launch').textContent = 'See result ↗';
    }
    if (journey.reached > flightMilestonesShown) {
      flightMilestonesShown = journey.reached;
      const reached = journey.steps[journey.reached-1];
      zoneSeen = Math.max(zoneSeen,reached.altitude);
      showFlightNotice(journey.next ? `${reached.name} reached!` : 'Departure target reached!', `${journey.reached} of 6 milestones · ${journey.next ? `next: ${altitudeLabel(journey.next.altitude)}` : 'expedition complete'}`);
      burst(width*.56,height*.48,'#a5dcc4',45); flightImpact('#a5dcc4'); chord(520+journey.reached*80);
      return;
    }
  }
  if (!recordShown && recordBefore > 0 && flight.altitude > recordBefore + 20) {
    recordShown = true; showFlightNotice('A new personal best!', 'Keep going. There’s more sky up there.');
    burst(width * .56, height * .48, '#f6d47b', 38); tone(1040, .2);
  }
  if(inExpedition())return;
  const zones = [[1000,'Through the clouds','The ground is getting rather small.'],[10000,'Above the weather','Next stop: the stratosphere.'],[25000,'The stratosphere','You’re flying higher than the airliners.'],[50000,'Halfway to space','The sky is starting to change.'],[100000,'Hello, outer space!','A tiny rocket. An enormous achievement.'],[200000,'Satellite country!','You have a whole planet beneath you.']];
  for (let i = zones.length - 1; i >= 0; i--) {
    if (flight.altitude >= zones[i][0] && zoneSeen < zones[i][0]) {
      zoneSeen = zones[i][0]; showFlightNotice(zones[i][1], zones[i][2]);
      if (zoneSeen >= 100000) { burst(width * .5, height * .4, '#f6d47b', 70); tone(1200, .4); }
      break;
    }
  }
}
function frame(now) {
  const dt = Math.min(.05, (now - (lastTime || now)) / 1000); lastTime = now;
  if (mode !== 'paused' && !reducedMotion) ambientTime += dt;
  if (mode === 'arming') {
    armTime += dt; timingPosition = (1 - Math.cos(armTime * 2.3)) / 2;
    $('needle').style.left = `calc(${timingPosition * 100}% - ${timingPosition * 3}px)`;
    const rating = launchRating(launchQuality(timingPosition));
    $('timing-quality').textContent = `${rating.power}%`;
    $('timing').dataset.rating = rating.tier;
    if (rating.tier === 'perfect' && timingTier !== 'perfect') tone(880,.055,'sine',.025);
    timingTier = rating.tier;
  }
  if (mode === 'flying') {
    const wasBoosted = flight.boosted,wasDropped=flight.dropReleased,wasPowered=flight.phase==='powered';
    visualFlightTime+=dt;
    advanceFlight(flight, dt * playbackRate);
    if (wasPowered && flight.phase==='coasting') {
      showFlightNotice('Burn complete. Still climbing.', 'Momentum carries your rocket toward its peak.');
      tone(220,.22,'triangle',.035);
    }
    if (flight.boosted && !wasBoosted && flight.kick > 0) { tone(280, .25, 'triangle'); $('launch-eyebrow').textContent = 'STAGE SEPARATION'; showFlightNotice('Stage separation!', 'Boosters fired. Empty pods away.'); burst(width * .56, height * .55, '#b7cbd5', 18); flightImpact('#b7cbd5'); }
    if(!reducedMotion&&((flight.boosted&&!wasBoosted&&flight.kick>0)||(flight.dropReleased&&!wasDropped))) {
      const y=(lastRocket?.y||height*.48)/height;
      if(flight.boosted&&!wasBoosted&&flight.kick>0)detachedHardware.push({kind:'boosters',at:visualFlightTime,y});
      if(flight.dropReleased&&!wasDropped){detachedHardware.push({kind:'tank',at:visualFlightTime,y});tone(420,.15,'triangle');}
      detachedHardware=detachedHardware.slice(-4);
    }
    updateFlightHud();
    if(flight.rulesVersion===1){const tuning=program.componentResearchVersion===1?componentNode(program.tunings?.engine)?.name:'';const label=[flightAbilityLabel(flight),tuning].filter(Boolean).join(' · ');$('ability-flight').hidden=!label;$('ability-flight').textContent=label;}
    checkFlightMoments();
    if (flight.done) finish();
  }
  drawScene(); drawParticles(dt); requestAnimationFrame(frame);
}
if (program.flights > 0) {
  $('launch-eyebrow').textContent = program.won ? 'THE UNIVERSE IS STILL OUT THERE' : 'WELCOME BACK TO THE LAUNCHPAD';
  $('launch-title').textContent = program.won ? 'How much further can we go?' : 'A little wiser. A little higher.';
  $('launch-description').textContent = 'Your rocket is ready. Let’s see what this build can do.';
}
if(saveFailure) {
  document.querySelector('.app').hidden=true;$('save-recovery').hidden=false;$('save-error').textContent=saveFailure;
  $('save-export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({[SAVE_KEY]:rawFreeSave,[EXPEDITION_KEY]:rawExpeditionSave},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='rocket-away-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
} else {persist(); renderWorkshop(); resize(); requestAnimationFrame(frame);}
