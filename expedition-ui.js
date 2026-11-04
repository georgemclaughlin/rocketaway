import { journeyRecordsMarkup } from './journey-records-ui.js?v=mobile-builder-1';
import { CONDITIONS_VERSION, flightConditions } from './worlds.js?v=mobile-builder-1';
import { altitudeLabel } from './journey.js?v=mobile-builder-1';
import { KITS, milestoneHeight, startExpedition, expeditionLoadout } from './expeditions.js?v=mobile-builder-1';
import { newProgram } from './engine.js?v=mobile-builder-1';
import { fittedParts } from './parts.js?v=mobile-builder-1';
import { rocketArt } from './builder.js?v=mobile-builder-1';
import { WORLDS, TAU_CETI, worldFor, destinationFor, worldRoute, worldMarkup } from './worlds.js?v=mobile-builder-1';
import { researchButtonState } from './research-ui.js?v=mobile-builder-1';
import { kitDetails } from './kit-details.js?v=mobile-builder-1';

function kitArt(item,profile) {
  return rocketArt(kitDetails(item,profile).parts);
}

// Setup describes only the upcoming journey; the flight report covers the result.
export function createExpeditionUI({ getSession, onBuild, onResume, onExplore, startRun=startExpedition, prototype=false, onTravel=()=>{} }) {
  const $=id=>document.getElementById(id);
  let kit='scrapper', difficulty=0, setupKey=null;
  function render() {
    const session=getSession(),run=session.active,profile=session.profile;
    const ended=run && ['won','lost'].includes(run.status), hub=!run || ended;
    $('expedition').dataset.phase=hub?'hub':'resume';
    $('expedition').dataset.ended=!!ended;
    $('expedition-step').textContent=hub?`EXPEDITION ${profile.runs+1} · NEW JOURNEY`:'EXPEDITION IN PROGRESS';
    $('expedition-title').textContent='Your rocket is ready';
    document.querySelector('.setup-heading').hidden=!hub;
    $('expedition-setup-title').textContent='Choose a starting build';
    $('world-briefing').hidden=!hub;
    document.querySelector('.expedition-progress').hidden=true;
    $('expedition-goal').hidden=!hub;
    $('expedition-stats').hidden=!!ended;
    $('expedition-stats').textContent=`${profile.wins} wins · ${profile.totalGates} milestones cleared`;
    $('expedition-choices').className='expedition-choices';
    if(prototype&&run?.rulesVersion===1&&run.status==='won'&&run.difficulty===0) {
      $('expedition-step').textContent='EARTH CLEARED · ROCKET SAVED';
      $('expedition-title').textContent='Your next stop is the Moon';
      $('expedition-summary').textContent='Carry your parts and credits into vacuum. Your remaining misses carry too.';
      document.querySelector('.setup-heading').hidden=true;$('expedition-goal').hidden=true;
      $('expedition-choices').innerHTML=`<div class="expedition-card briefing"><strong>${run.program.credits} credits · ${3-run.strikes} misses left</strong><p>No air drag on the Moon. Reconsider heavy fairings and extend your fuel supply.</p></div>`;
      $('expedition-footer').innerHTML='<button id="run-travel" class="primary">Travel to Moon ↗</button>';
      return;
    }
    if(hub) {
      if(profile.campaignComplete&&!profile.endingAcknowledged) {
        $('expedition').dataset.phase='finale';
        $('world-briefing').hidden=true;
        $('expedition-step').textContent='JOURNEY COMPLETE';
        $('expedition-title').textContent='Tau Ceti. You made it.';
        $('expedition-summary').textContent='From Earth to another star. It all began with one little launch.';
        document.querySelector('.setup-heading').hidden=true;
        $('expedition-goal').hidden=true;$('expedition-stats').hidden=true;
        const records=profile.flightRecords;
        $('expedition-choices').innerHTML=`<div class="finale-vista" aria-hidden="true"><div class="finale-rays"></div>${worldMarkup(TAU_CETI,'finale-star')}<div class="finale-rocket">${rocketArt(fittedParts(run?.program||newProgram()))}</div><span class="finale-signal">SIGNAL RECEIVED · TAU CETI</span></div><div class="finale-message"><img src="./assets/astronaut-cartoon.png?v=2" width="64" height="96" alt="Your astronaut waving"><div><strong>Look how far you’ve come.</strong><p>You built, launched, and kept going. Every small step brought you here.</p></div></div><div class="finale-route" aria-label="All nine launch worlds cleared">${WORLDS.map(w=>`<span title="${w.name} cleared" aria-label="${w.name} cleared">${worldMarkup(w)}<b aria-hidden="true">✓</b></span>`).join('')}</div>${journeyRecordsMarkup(profile)}`;
        $('expedition-footer').innerHTML=`<p id="ending-record-note">${records.partial?'Older flights may be missing from these records.':'Your journey is complete. Keep your upgrades and revisit any world when you’re ready.'}</p><button id="ending-explore" class="primary">Explore cleared worlds ↗</button>`;
        return;
      }
      const key=run?`${profile.runs}/${run.seed}/${run.status}`:'fresh';
      if(key!==setupKey) {
        setupKey=key;
        kit=run?.kit||'scrapper';
        difficulty=prototype&&run?.status==='won'?0:run?.status==='won'?Math.min(profile.maxDifficulty,run.difficulty+1):run?.difficulty||0;
      }
      const world=worldFor({difficulty}),next=destinationFor({difficulty});
      $('world-briefing').textContent=`${flightConditions(difficulty).brief} ⓘ`;
      $('world-briefing').setAttribute('aria-label',`${flightConditions(difficulty).brief} Open world guide.`);
      $('expedition-step').textContent=profile.campaignComplete?'JOURNEY COMPLETE · OPTIONAL REPLAY':`ROAD TO TAU CETI · WORLD ${difficulty+1} / 9`;
      $('expedition-title').innerHTML=`${worldMarkup(world)}<span>Launch from ${world.name==='Moon'?'the Moon':world.name}</span>`;
      $('expedition-summary').textContent=profile.campaignComplete?`Replay ${world.name} with a new build. Your Tau Ceti journey stays complete.`:`Reach ${altitudeLabel(milestoneHeight({difficulty,conditionsVersion:CONDITIONS_VERSION},5))} → ${next.name}. Six milestones, three misses.`;
      $('expedition-goal').innerHTML=`<nav class="world-route" aria-label="Road to Tau Ceti. Select an unlocked world to replay.">${worldRoute(profile,difficulty)}</nav>`;
      const route=$('expedition-goal').querySelector('.world-route');
      if(prototype)route.querySelectorAll('[data-world]').forEach(button=>{if(Number(button.dataset.world)>1)button.remove();});
      requestAnimationFrame(()=>{
        if(!route.isConnected)return;
        const selected=route.querySelector('[aria-pressed="true"]');
        if(selected)route.scrollLeft+=selected.getBoundingClientRect().left-route.getBoundingClientRect().left-(route.clientWidth-selected.clientWidth)/2;
      });
      const kits=KITS.filter(item=>profile.totalGates>=item.unlock);
      $('expedition').dataset.kits=kits.length;
      $('expedition-setup-title').textContent=kits.length===1?'Your first rocket':'Choose a starting build';
      if(!kits.some(item=>item.id===kit))kit='scrapper';
      $('expedition-choices').style.setProperty('--choices',kits.length);
      $('expedition-choices').innerHTML=kits.map(item=>{
        const loadout=expeditionLoadout(profile,item,difficulty);
        if(prototype&&difficulty===1)loadout.credits+=1100;
        const details=kitDetails(item,profile);
        return `<button class="expedition-card kit-card" data-kit="${item.id}" aria-pressed="${kit===item.id}"><span class="card-icon kit-rocket">${kitArt(item,profile)}</span><strong>${item.name}${loadout.rank?` <small>R${loadout.rank}</small>`:''}<span class="kit-check" aria-hidden="true">${kit===item.id?' ✓':''}</span></strong><p><span class="kit-equipment">${details.equipment}</span><span class="kit-benefit">${details.benefit}</span></p><b>${loadout.credits} credits</b></button>`;
      }).join('');
      const researchButton=researchButtonState(profile,kit);
      $('expedition-footer').innerHTML=`<p class="kit-unlock">${flightConditions(difficulty).grant?`Starting credits include ${flightConditions(difficulty).grant} world funding.`:ended?'Fresh rocket. Your research stays yours.':'Choose parts, then test your build. Tau Ceti awaits.'}</p><div class="start-actions"><button id="research-hub" class="research-action ${researchButton.available?'research-ready':''}" data-research-state="${researchButton.state}" aria-label="${researchButton.ariaLabel}">${researchButton.label}</button><button id="run-start" class="primary">Build rocket ↗</button></div>`;
      if(prototype) {
        $('expedition-step').textContent=run?.status==='won'?'PROTOTYPE EXPEDITION COMPLETE':'EARTH → MOON · ROGUELITE PLAYTEST';
        $('expedition-summary').textContent=difficulty===0?'One rocket across two worlds. Find experimental combinations. Three misses end the expedition.':'Moon checkpoint: a fresh funded rocket. Three misses. Research stays with you.';
        $('expedition-footer').querySelector('.kit-unlock').textContent=difficulty===1?'Includes 1,100 checkpoint credits.':run?.status==='won'?'Try another combination. Your research and Moon access are kept.':'Experimental parts and optional contracts await in the hangar.';
      }
    } else {
      $('expedition-title').textContent=`Return to ${worldFor(run).name}`;
      $('expedition-summary').textContent='Your flight was saved. Resume from ignition with the same rocket and launch power.';
      $('expedition-choices').classList.add('briefing-choices');
      $('expedition-choices').innerHTML=`<div class="expedition-card briefing"><span class="card-icon">↟</span><strong>${altitudeLabel(milestoneHeight(run))} goal</strong><p>${run.program.credits} credits · ${3-run.strikes} misses left</p></div>`;
      $('expedition-footer').innerHTML=run.status==='flying'?'<button id="run-resume" class="primary">Resume flight ↗</button>':'<button id="run-build" class="primary">Back to rocket ↗</button>';
    }
  }
  $('expedition-choices').addEventListener('click',event=>{
    const button=event.target.closest('[data-kit]');
    if(button){kit=button.dataset.kit;render();}
  });
  $('expedition-goal').addEventListener('click',event=>{
    const button=event.target.closest('[data-world]');
    if(button&&!button.disabled){difficulty=Number(button.dataset.world);render();$('expedition-goal').querySelector(`[data-world="${difficulty}"]`).focus({preventScroll:true});}
  });
  $('expedition-footer').addEventListener('click',event=>{
    const id=event.target.closest('button')?.id,session=getSession();
    if(id==='ending-explore') {
      session.profile.endingAcknowledged=true;
      setupKey=session.active?`${session.profile.runs}/${session.active.seed}/${session.active.status}`:'fresh';
      difficulty=0;kit=session.active?.kit||'scrapper';
      onExplore();render();$('expedition-title').focus({preventScroll:true});
    }
    if(id==='run-start' && startRun(session,{seed:crypto.getRandomValues(new Uint32Array(1))[0],kit,difficulty}))onBuild();
    if(id==='run-travel')onTravel();
    if(id==='run-build')onBuild();
    if(id==='run-resume')onResume();
  });
  return {render,getSelectedWorld:()=>{const run=getSession().active;return run&&!['won','lost'].includes(run.status)?run.difficulty:difficulty;},getSelectedKit:()=>{const run=getSession().active;return run&&!['won','lost'].includes(run.status)?run.kit:kit;},reset:()=>{kit='scrapper';difficulty=0;setupKey=null;}};
}
