import { altitudeLabel } from './journey.js';
import { KITS, milestoneHeight, startExpedition } from './expeditions.js';
import { newProgram } from './engine.js';
import { fittedParts, partById } from './parts.js';
import { rocketArt } from './builder.js';
import { worldFor, destinationFor, worldRoute, worldMarkup } from './worlds.js';
import { researchLoadout } from './research.js';
import { researchButtonState } from './research-ui.js?v=research-states';

const kitBenefits = {
  scrapper: 'Credits to customize.',
  stager: 'Extra lift from boosters.',
  scientist: 'More pay. Better engine.',
};
function kitArt(item,profile) {
  const program = newProgram();
  for (const id of researchLoadout(profile,item).parts) program.parts.equipped[partById(id).slot] = id;
  return rocketArt(fittedParts(program));
}

// Setup describes only the upcoming journey; the flight report covers the result.
export function createExpeditionUI({ getSession, onBuild, onResume }) {
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
    document.querySelector('.expedition-progress').hidden=true;
    $('expedition-goal').hidden=!hub;
    $('expedition-stats').hidden=!!ended;
    $('expedition-stats').textContent=`${profile.wins} wins · ${profile.totalGates} milestones cleared`;
    $('expedition-choices').className='expedition-choices';
    if(hub) {
      const key=run?`${profile.runs}/${run.seed}/${run.status}`:'fresh';
      if(key!==setupKey) {
        setupKey=key;
        kit=run?.kit||'scrapper';
        difficulty=run?.status==='won'?Math.min(profile.maxDifficulty,run.difficulty+1):run?.difficulty||0;
      }
      const world=worldFor({difficulty}),next=destinationFor({difficulty});
      $('expedition-step').textContent=profile.campaignComplete?'TAU CETI REACHED · EXPLORE AGAIN':`ROAD TO TAU CETI · WORLD ${difficulty+1} / 9`;
      $('expedition-title').innerHTML=`${worldMarkup(world)}<span>Launch from ${world.name==='Moon'?'the Moon':world.name}</span>`;
      $('expedition-summary').textContent=`Reach ${altitudeLabel(milestoneHeight({difficulty},5))} → ${next.name}. Six milestones, three misses.`;
      $('expedition-goal').innerHTML=`<nav class="world-route" aria-label="Road to Tau Ceti. Select an unlocked world to replay.">${worldRoute(profile,difficulty)}</nav>`;
      const kits=KITS.filter(item=>profile.totalGates>=item.unlock);
      $('expedition').dataset.kits=kits.length;
      if(!kits.some(item=>item.id===kit))kit='scrapper';
      $('expedition-choices').style.setProperty('--choices',kits.length);
      $('expedition-choices').innerHTML=kits.map(item=>{
        const loadout=researchLoadout(profile,item);
        const upgraded=loadout.parts.filter(id=>!item.parts.includes(id));
        const latest=upgraded.at(-1);
        return `<button class="expedition-card kit-card" data-kit="${item.id}" aria-pressed="${kit===item.id}"><span class="card-icon kit-rocket">${kitArt(item,profile)}</span><strong>${item.name}${loadout.rank?` <small>R${loadout.rank}</small>`:''}<span class="kit-check" aria-hidden="true">${kit===item.id?' ✓':''}</span></strong><p>${latest?`Starts with ${partById(latest).name}`:kitBenefits[item.id]}</p><b>${loadout.credits} starting credits</b></button>`;
      }).join('');
      const researchButton=researchButtonState(profile,kit);
      $('expedition-footer').innerHTML=`<p class="kit-unlock">${ended?'Fresh rocket. Research, worlds, and starting builds stay yours.':'Build, upgrade, and leave Earth. Tau Ceti awaits.'}</p><div class="start-actions"><button id="research-hub" class="research-action ${researchButton.available?'research-ready':''}" data-research-state="${researchButton.state}" aria-label="${researchButton.ariaLabel}">${researchButton.label}</button><button id="run-start" class="primary">Build rocket ↗</button></div>`;
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
    if(id==='run-start' && startExpedition(session,{seed:crypto.getRandomValues(new Uint32Array(1))[0],kit,difficulty}))onBuild();
    if(id==='run-build')onBuild();
    if(id==='run-resume')onResume();
  });
  return {render,getSelectedKit:()=>{const run=getSession().active;return run&&!['won','lost'].includes(run.status)?run.kit:kit;},reset:()=>{kit='scrapper';difficulty=0;setupKey=null;}};
}
