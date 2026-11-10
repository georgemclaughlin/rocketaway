import { BENCH,TARGETS,newWorkshop,cost,program,ignition,measured,fit,launch,settle,restore,advice } from './workshop-model.js?v=workshop-3';
import { partById,fittedParts } from './parts.js?v=component-research-1';
import { rocketArt } from './rocket-art.js?v=component-research-1';
import { launchQuality } from './engine.js?v=component-research-1';
import { advanceFlight,presentationRate,fastForwardRate } from './flight-playback.js?v=component-research-1';
import { flightAbilityLabel } from './experimental.js?v=component-research-1';
const $=id=>document.getElementById(id), key='rocket-away-workshop-v1', km=n=>`${(n/1000).toLocaleString(undefined,{maximumFractionDigits:1})} km`;
let state=newWorkshop(), blocked=false;
try { const raw=localStorage.getItem(key);if(raw){const loaded=restore(JSON.parse(raw));if(loaded)state=loaded;else blocked=true;} } catch {blocked=true;}
function save(){if(blocked)return;try{localStorage.setItem(key,JSON.stringify(state));}catch{$('footnote').textContent='Storage unavailable · keep this tab open to continue';}}
let preview={...state.build}, slot='tank', phase='bench', flight=null, paused=false, fast=false, normalRate=1, fastRate=1, elapsed=0, last=0, position=0, fullDuration=1;
const changed=()=>JSON.stringify(preview)!==JSON.stringify(state.build);
function art(build){$('rocket').style.transform='';$('rocket').innerHTML=rocketArt(fittedParts(program(build,state.world)),null,changed());}
function show(next){phase=next;for(const id of ['bench','controls','report'])$(id).hidden=id!==(next==='timing'||next==='flight'?'controls':next);$('meter').hidden=next!=='timing';$('ignite').hidden=next!=='timing';for(const id of ['pause','fast','result'])$(id).hidden=next!=='flight';}
function renderBench(){
  show('bench');const world=state.world, target=TARGETS[world][state.cleared[world]], estimate=measured(preview,world).peak, fitted=measured(state.build,world).peak;
  document.querySelector('.stage').className=`stage${world?' moon':''}`;
  $('route').textContent=world?'EARTH ✓ → MOON · SAME ROCKET':'EARTH → MOON · ONE ROCKET';
  $('title').textContent=world?'Let your little lab go further.':'Give this little lab a lift.';
  $('mission').textContent=world?'Same capsule, same rocket. No air drag: make your fuel and staging count.':'Your science capsule is heavy. Try a staged reserve or a long-burning engine.';
  $('markers').innerHTML=TARGETS[world].map((n,i)=>`<span class="${i<state.cleared[world]?'passed':''}">${km(n)}</span>`).join('');
  $('state-label').textContent=changed()?'PREVIEW · AT 110%':'FITTED · AT 110%';$('altitude').textContent=km(estimate);
  $('estimate').textContent=`Fitted ${km(fitted)}${target?` · next ${km(target)}`:''}`;
  $('event').textContent=target&&measured(preview,world,1).peak<target&&estimate>=target?'Aim for gold · timing matters':changed()?`Preview change: ${estimate>=fitted?'+':''}${km(estimate-fitted)}`:'Science capsule stays aboard';
  $('budget').textContent=`Bench ${cost(preview)} / ${state.budget}`;
  $('tabs').innerHTML=Object.keys(BENCH).map(s=>`<button data-slot="${s}" aria-pressed="${slot===s}">${s==='boosters'?'Boosters':s==='tank'?'Tank':'Engine'}</button>`).join('');
  $('shelf').innerHTML=BENCH[slot].map(id=>{const p=partById(id);return `<button data-part="${id}" aria-pressed="${preview[slot]===id}">${p.name}<small>${p.price} budget${state.build[slot]===id?' · fitted':''}</small></button>`;}).join('');
  $('detail').textContent=partById(preview[slot]).detail;
  $('fit').disabled=!changed()||cost(preview)>state.budget||blocked;
  $('fit').textContent=cost(preview)>state.budget?'Over budget':'Fit build';$('discard').disabled=!changed();$('arm').disabled=blocked;$('arm').textContent=state.world===0&&state.cleared[0]===6?'Take rocket to Moon':'Launch fitted';
  art(preview);$('shelf').querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});
}
$('tabs').onclick=e=>{const button=e.target.closest('[data-slot]');if(button){slot=button.dataset.slot;renderBench();}};
$('shelf').onclick=e=>{const button=e.target.closest('[data-part]');if(button){preview[slot]=button.dataset.part;renderBench();}};
$('fit').onclick=()=>{if(fit(state,preview)){save();renderBench();}};
$('discard').onclick=()=>{preview={...state.build};renderBench();};
$('arm').onclick=()=>{if(state.world===0&&state.cleared[0]===6){state.world=1;save();preview={...state.build};renderBench();return;}preview={...state.build};renderBench();show('timing');elapsed=0;position=0;$('meter').querySelector('b').style.left='0%';$('flight-copy').textContent='Tap Ignite in gold · 90% power';$('state-label').textContent='READY TO TEST';};
function startFlight(){const pending=state.pending;flight=ignition(pending.build,pending.world,pending.quality);normalRate=presentationRate(flight);fastRate=fastForwardRate(flight);fullDuration=measured(pending.build,pending.world,pending.quality).time;paused=false;$('pause').textContent='Pause';$('fast').setAttribute('aria-pressed',String(fast));show('flight');art(state.build);$('state-label').textContent='SCIENCE CAPSULE · IN FLIGHT';document.querySelector('.stage').classList.add('flying');}
$('ignite').onclick=()=>{if(launch(state,launchQuality(position))){save();startFlight();}};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';};
$('fast').onclick=()=>{fast=!fast;if(fast)fastRate=fastForwardRate(flight);$('fast').setAttribute('aria-pressed',String(fast));};
function finish(){
  const report=settle(state,flight);if(!report)return;save();show('report');document.querySelector('.stage').classList.remove('flying');
  $('event').textContent=report.events.at(-1)||'Test complete';document.querySelector('.stage').classList.toggle('separated',flight.boosted&&flight.hasBoosters);document.querySelector('.stage').classList.toggle('dropped',!!flight.dropReleased);$('markers').innerHTML=TARGETS[state.world].map((n,i)=>`<span class="${i<state.cleared[state.world]?'passed':''}">${km(n)}</span>`).join('');$('state-label').textContent='TEST COMPLETE';$('altitude').textContent=km(report.peak);$('estimate').textContent=`${Math.round(report.quality*100)}% launch power`;
  $('report-title').textContent=state.cleared[1]===6?'Your little lab made it.':state.cleared[0]===6&&state.world===0?'Next stop: the Moon.':report.gained?`${report.gained===1?'A new marker':`${report.gained} markers`} reached!`:'An idea tested. Rocket intact.';
  $('report-copy').textContent=`Test ${state.flights} · ${km(report.peak)} · +${report.earned} bench funding. ${report.events.join(' → ')||'One continuous burn.'}`;
  $('diagnosis').textContent=state.cleared[state.world]===6?(state.world?'Earth to Moon with the same science capsule. Which refit made the biggest difference?':'Your whole rocket and bench budget travel with you. The next flight has no air drag.'):advice(state.build,state.world,report.peak,TARGETS[state.world][state.cleared[state.world]]);
  $('continue').textContent=state.cleared[0]===6&&state.world===0?'Take this rocket to the Moon':state.cleared[1]===6?'Keep experimenting':'Back to workshop';
}
$('result').onclick=()=>{while(!flight.done)advanceFlight(flight,1);finish();};
$('continue').onclick=()=>{if(state.world===0&&state.cleared[0]===6){state.world=1;save();}preview={...state.build};renderBench();};
$('help').onclick=()=>{if(phase==='flight'){paused=true;$('pause').textContent='Resume';}$('help-dialog').showModal();};$('help-close').onclick=()=>$('help-dialog').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='flight'){paused=true;$('pause').textContent='Resume';}});
window.addEventListener('resize',()=>{if(phase==='bench')$('shelf').querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});});
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;
  if(phase==='timing'&&!document.hidden&&!$('help-dialog').open){elapsed+=dt;position=(1-Math.cos(elapsed*2.7))/2;$('meter').querySelector('b').style.left=`${position*99}%`;$('flight-copy').textContent=`Tap Ignite in gold · ${Math.round(launchQuality(position)*100)}% power`;}
  if(phase==='flight'&&!paused&&!document.hidden){advanceFlight(flight,dt*Math.max(normalRate,fast?fastRate:1));if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('rocket').style.transform=`translateY(${-Math.min(18,flight.altitude/Math.max(1,TARGETS[state.world].at(-1))*18)}px)`;$('altitude').textContent=km(flight.altitude);$('estimate').textContent=`${Math.round(flight.fuel*100)}% fuel · ${flight.phase==='powered'?'engine burning':'coasting'}`;$('event').textContent=flightAbilityLabel(flight)||'Lifting the science capsule';$('flight-copy').textContent=`${Math.min(100,Math.round(flight.time/fullDuration*100))}% of flight · ${state.world?'Moon':'Earth'}`;document.querySelector('.stage').classList.toggle('flying',flight.phase==='powered');document.querySelector('.stage').classList.toggle('separated',flight.boosted&&flight.hasBoosters);document.querySelector('.stage').classList.toggle('dropped',!!flight.dropReleased);$('plume').style.transform=`scaleY(${flight.momentum? .45+Math.min(1,flight.time/10):1})`;if(flight.done)finish();}
  requestAnimationFrame(frame);
}
renderBench();if(blocked)$('footnote').textContent='Workshop save unreadable · preserved unchanged. Campaigns remain available.';
if(state.pending)startFlight();requestAnimationFrame(frame);
