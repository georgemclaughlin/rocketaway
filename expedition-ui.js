import { altitudeLabel } from './journey.js';
import { KITS, milestoneHeight, startExpedition } from './expeditions.js';
import { newProgram } from './engine.js';
import { fittedParts, partById } from './parts.js';
import { rocketArt } from './builder.js';

const kitBenefits = {
  scrapper: 'Credits to customize.',
  stager: 'Extra lift from boosters.',
  scientist: 'More pay. Better engine.',
};
const kitArt = Object.fromEntries(KITS.map(item => {
  const program = newProgram();
  for (const id of item.parts) program.parts.equipped[partById(id).slot] = id;
  return [item.id, rocketArt(fittedParts(program))];
}));

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
    $('expedition-setup-title').hidden=!hub;
    $('expedition-setup-title').textContent='Choose a starting build';
    document.querySelector('.expedition-progress').hidden=true;
    $('expedition-goal').hidden=!hub || profile.maxDifficulty===0;
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
      $('expedition-title').textContent=`Next stop: ${altitudeLabel(milestoneHeight({difficulty},5))}`;
      $('expedition-summary').textContent=`6 milestones · 3 misses allowed. First target: ${altitudeLabel(milestoneHeight({difficulty},0))}.`;
      $('expedition-goal').innerHTML=`<label class="difficulty-label"><span>Finish line</span><select id="run-difficulty" aria-label="Goal for the new expedition">${Array.from({length:profile.maxDifficulty+1},(_,i)=>`<option value="${i}" ${i===difficulty?'selected':''}>${altitudeLabel(milestoneHeight({difficulty:i},5))}${i===0?' · Standard':' · Harder'}</option>`).join('')}</select></label>`;
      const kits=KITS.filter(item=>profile.totalGates>=item.unlock);
      $('expedition').dataset.kits=kits.length;
      if(!kits.some(item=>item.id===kit))kit='scrapper';
      $('expedition-choices').style.setProperty('--choices',kits.length);
      $('expedition-choices').innerHTML=kits.map(item=>`<button class="expedition-card kit-card" data-kit="${item.id}" aria-pressed="${kit===item.id}"><span class="card-icon kit-rocket">${kitArt[item.id]}</span><strong>${item.name}<span class="kit-check" aria-hidden="true">${kit===item.id?' ✓':''}</span></strong><p>${kitBenefits[item.id]}</p><b>${item.credits} starting credits</b></button>`).join('');
      $('expedition-footer').innerHTML=`<p class="kit-unlock">${ended?'Restart at 0 km with fresh parts & credits. Unlocked builds and goals stay yours.':'Pick a build, then buy upgrades in the hangar.'}</p><div class="start-actions"><button id="run-start" class="primary">Build this rocket ↗</button></div>`;
    } else {
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
  $('expedition-goal').addEventListener('change',event=>{
    if(event.target.id==='run-difficulty'){difficulty=Number(event.target.value);render();}
  });
  $('expedition-footer').addEventListener('click',event=>{
    const id=event.target.closest('button')?.id,session=getSession();
    if(id==='run-start' && startExpedition(session,{seed:crypto.getRandomValues(new Uint32Array(1))[0],kit,difficulty}))onBuild();
    if(id==='run-build')onBuild();
    if(id==='run-resume')onResume();
  });
  return {render,reset:()=>{kit='scrapper';difficulty=0;setupKey=null;}};
}
