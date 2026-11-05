import { flightConditions } from './worlds.js?v=goals-visible-1';
import { PART_SLOTS, partById, partForProgram, fittedParts, assemblySpecs, fitPart, catalogFor } from './parts.js?v=goals-visible-1';
import { createFlight, stepFlight } from './engine.js?v=goals-visible-1';
import { partInsight } from './part-insights.js?v=goals-visible-1';
import { abilityDescription } from './experimental.js?v=goals-visible-1';
import { buildIdentity, buildEffects, combinationChange } from './rocket-insights.js?v=goals-visible-1';
import { rocketArt } from './rocket-art.js?v=goals-visible-1';
import { planBuild, fitBuild } from './build-plan.js?v=goals-visible-1';
export { rocketArt };

const estimates = new Map();
export function estimateHeight(program, quality = 1.1) {
  const key = PART_SLOTS.map(slot => program.parts.equipped[slot.id]).join('/')+'|'+(program.relics||[]).join('/')+'|'+(program.route||'')+'|'+PART_SLOTS.map(slot=>program.partTraits?.[program.parts.equipped[slot.id]]||'').join('/')+'|'+quality+'|'+(program.research?.kit||'')+'/'+(program.research?.rank||0)+'|'+(program.launchWorld??'classic')+'|'+(program.conditionsVersion??1)+'|'+(program.rulesVersion||0)+'|'+(program.equipmentVersion||1);
  if (estimates.has(key)) return estimates.get(key);
  const flight = createFlight(program.levels, quality, { plan: 'explorer', assembly: assemblySpecs(program) });
  for (let step = 0; step < 12000 && !flight.done; step++) stepFlight(flight, .05);
  const height = Math.round(flight.peak);
  if(estimates.size>512)estimates.clear();
  estimates.set(key, height);
  return height;
}
export function previewPart(program, id) {
  const part = partById(id);
  if (!part || !catalogFor(program).some(candidate=>candidate.id===id)) return null;
  const preview = { ...program, parts: { ...program.parts, equipped: { ...program.parts.equipped, [part.slot]: id } } };
  return { program: preview, height: estimateHeight(preview), previousHeight: estimateHeight(program), stats: assemblySpecs(preview), previousStats: assemblySpecs(program) };
}

export function launchReadiness(program,target,contract=false) {
  if(!target)return {text:'Estimated at 110% launch power',state:'true'};
  const expected=estimateHeight(program);
  if(expected>=target) {
    if(estimateHeight(program,1)<target)return {text:'Aim for gold',state:'timing'};
    return {text:contract?'Contract within reach':'Within reach',state:'true'};
  }
  if(estimateHeight(program,1.2)>=target)return {text:'Gold can reach it',state:'timing'};
  return {text:`${((target-expected)/1000).toFixed(1)} km short`,state:'false'};
}

function partArt(part) {
  let shape = '';
  if (part.slot === 'aero') {
    shape = part.shape === 'round' ? '<path d="M22 52V36Q22 17 40 9Q58 17 58 36V52Z"/>' : part.shape === 'capsule' ? '<path d="M18 52L23 17Q40 5 57 17L62 52Z"/><rect x="29" y="22" width="22" height="13" rx="3" fill="#355369"/>' : '<path d="M22 52L40 5L58 52Z"/>';
    shape += `<path d="M23 46H57" stroke="${part.id === 'ceramic' ? '#97cfc7' : '#e1b968'}" stroke-width="5"/>`;
  } else if (part.slot === 'tank') {
    const h = 20 + part.height * .32;
    shape = `<rect x="24" y="${56-h}" width="32" height="${h}" rx="4"/><path d="M25 ${61-h}H55M25 50H55" stroke="${part.id === 'composite' ? '#97cfc7' : '#e1b968'}" stroke-width="4"/><path d="M33 ${65-h}V44" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>`;
  } else if (part.slot === 'engine') {
    shape = part.shape === 'cluster' ? '<rect x="16" y="9" width="48" height="14" rx="3"/><path d="M19 23H29L35 51H13ZM35 23H45L51 51H29ZM51 23H61L67 51H45Z" fill="#91a9b4"/>' : `<rect x="25" y="10" width="30" height="15" rx="3"/><path d="M29 25H51L${part.shape === 'long' ? 57 : 61} 52H${part.shape === 'long' ? 23 : 19}Z" fill="${part.id === 'ember' ? '#c0a076' : '#91a9b4'}"/><path d="M29 24H51" stroke="#e1b968" stroke-width="4"/>`;
  } else if (!part.kick) {
    shape = '<g fill="none" stroke="#91a3b8" stroke-dasharray="3 3"><rect x="16" y="14" width="15" height="39" rx="7"/><rect x="49" y="14" width="15" height="39" rx="7"/></g><path d="M25 44L55 20" stroke="#91a3b8" stroke-width="2"/>';
  } else {
    const top = 20 - part.kick*2;
    shape = `<rect x="15" y="${top}" width="17" height="${54-top}" rx="8"/><rect x="48" y="${top}" width="17" height="${54-top}" rx="8"/><path d="M16 41H31M49 41H64" stroke="${part.id === 'orbitals' ? '#97cfc7' : '#e1b968'}" stroke-width="5"/>`;
  }
  return `<svg viewBox="0 0 80 64" aria-hidden="true"><g fill="#e9e3ce" stroke="#788f9e" stroke-width="1">${shape}</g></svg>`;
}

export function createBuilder({ getProgram, canEdit, onFit, getTarget = () => null, getTargetLabel=()=>'', getReserved=()=>null, onReserve=()=>{} }) {
  const $ = id => document.getElementById(id);
  let slotId = 'engine', candidateId = null, shelfSlot = null, choices = {}, draftProgram = null, draftFlight = null;
  function discard() { choices = {}; candidateId = null; render(); }
  function keepPreviewVisible() {
    const shelf=$('part-shelf'),selected=shelf.querySelector('[aria-pressed="true"]');
    if(!selected||!shelf.clientWidth)return;
    const bounds=shelf.getBoundingClientRect(),part=selected.getBoundingClientRect();
    if(part.left<bounds.left)shelf.scrollLeft+=part.left-bounds.left;
    else if(part.right>bounds.right)shelf.scrollLeft+=part.right-bounds.right;
  }
  new ResizeObserver(keepPreviewVisible).observe($('part-shelf'));
  $('assembly-slots').innerHTML = PART_SLOTS.map(slot => `<button class="assembly-slot slot-${slot.id}" data-build-slot="${slot.id}" aria-pressed="false"><span>${slot.name}</span><strong></strong></button>`).join('');
  function render() {
    const program = getProgram(), conditions=flightConditions(program.launchWorld,program.conditionsVersion??1);
    if (draftProgram !== program || draftFlight !== program.flights) {
      choices = {}; candidateId = null; draftProgram = program; draftFlight = program.flights;
    }
    if (partById(candidateId)?.slot !== slotId) candidateId = program.parts.equipped[slotId];
    const prototype=program.rulesVersion===1;
    const available=part=>!Array.isArray(program.stock)||program.stock.includes(part.id)||program.parts.owned.includes(part.id);
    const options = catalogFor(program).filter(part => part.slot === slotId && (!prototype||available(part)));
    document.querySelector('.part-picker').dataset.unified=prototype;
    if(!options.some(p=>p.id===candidateId))candidateId=options[0]?.id||program.parts.equipped[slotId];
    let plan = prototype ? planBuild(program, choices) : null;
    if (prototype && !plan) { choices = {}; plan = planBuild(program); candidateId = program.parts.equipped[slotId]; }
    const draft = plan?.program;
    const candidate = partForProgram(program, candidateId), preview = prototype
      ? { program: draft, height: estimateHeight(draft), previousHeight: estimateHeight(program), stats: assemblySpecs(draft), previousStats: assemblySpecs(program) }
      : previewPart(program, candidateId);
    const parts = fittedParts(prototype ? draft : program), changed = prototype ? plan.changes.length > 0 : program.parts.equipped[slotId] !== candidateId;
    const equipped = program.parts.equipped[slotId] === candidateId, owned = program.parts.owned.includes(candidateId);
    const shelfKey=slotId+'/'+options.map(part=>part.id).join('/');
    if (shelfSlot !== shelfKey) {
      $('part-shelf').innerHTML = options.map(part => `<button class="shelf-part" data-part="${part.id}" data-experimental="${!!part.ability}" aria-label="Preview ${part.name}${part.ability?', experimental':''}">${partArt(part)}<span class="shelf-name">${part.name.replace(/ engine| tank| fairing| capsule| boosters| cluster/g, '')}</span><small></small></button>`).join('');
      shelfSlot = shelfKey;
    }
    for (const button of $('part-shelf').querySelectorAll('[data-part]')) {
      const part = partById(button.dataset.part), fitted = program.parts.equipped[slotId] === part.id;
      button.setAttribute('aria-pressed', part.id === candidateId);
      button.querySelector('small').textContent = fitted ? 'Fitted ✓' : program.parts.owned.includes(part.id) ? 'Owned' : Array.isArray(program.stock)&&!program.stock.includes(part.id) ? 'Not stocked' : `✦ ${part.price}`;
      const unavailable = Array.isArray(program.stock)&&!program.stock.includes(part.id)&&!program.parts.owned.includes(part.id);
      button.classList.toggle('unavailable', unavailable);
      button.classList.toggle('affordable', !unavailable && !program.parts.owned.includes(part.id) && part.price <= program.credits);
      button.disabled = !canEdit();
    }
    const artKey = PART_SLOTS.map(slot => parts[slot.id].id).join('/') + '/' + slotId + '/' + (plan?.changes.join('/') || '');
    if ($('assembly-art').dataset.key !== artKey) {
      $('assembly-art').innerHTML = rocketArt(parts, slotId, prototype && changed, plan?.changes || []);
      $('assembly-art').dataset.key = artKey;
    }
    $('assembly-stage').dataset.workbench = prototype;
    $('assembly-stage').dataset.planning = prototype && changed;
    $('build-state').textContent = changed && prototype ? `PREVIEW · ${plan.changes.length} ${plan.changes.length === 1 ? 'PART' : 'PARTS'}` : 'YOUR ROCKET';
    $('build-reset').hidden = !prototype || !changed;
    $('build-reset').disabled = !canEdit();
    $('build-state').parentElement.hidden = !prototype;
    $('assembly-hint').textContent = prototype ? buildIdentity(draft) : conditions.label || 'EQUIPPED · tap a section to choose parts';
    for (const button of document.querySelectorAll('button[data-build-slot]')) {
      button.setAttribute('aria-pressed', button.dataset.buildSlot === slotId);
      button.querySelector('strong').textContent = parts[button.dataset.buildSlot].name;
      const pending = prototype && plan.changes.includes(parts[button.dataset.buildSlot].id);
      button.dataset.pending = pending;
      button.setAttribute('aria-label', `${button.querySelector('span').textContent}: ${parts[button.dataset.buildSlot].name}, ${pending ? 'preview, not fitted' : 'equipped'}`);
      button.disabled = !canEdit();
    }
    $('category-label').textContent = `${PART_SLOTS.find(slot => slot.id === slotId).name} · ${slotId==='aero'&&program.launchWorld!==undefined?(conditions.drag===0?'weight matters':conditions.drag>1?'strong air drag':'air drag'):'browse parts'}`;
    if(prototype)$('category-label').textContent = `${PART_SLOTS.find(slot => slot.id === slotId).name} · available parts`;
    $('candidate-position').textContent = prototype ? `${options.length} options ↔` : `${options.findIndex(part => part.id === candidateId)+1} / ${options.length}`;
    $('candidate-state').textContent = equipped ? 'ON YOUR ROCKET' : owned ? 'OWNED · FREE TO FIT' : 'NEW PART';
    $('candidate-name').textContent = candidate.name;
    $('candidate-trait').hidden = !candidate.trait;
    $('candidate-trait').textContent = candidate.trait ? `${candidate.trait.name} · ${candidate.trait.detail}` : '';
    $('candidate-description').textContent = partInsight(program, candidateId);
    $('candidate-height').textContent = `${(preview.height/1000).toFixed(1)} km`;
    const target = getTarget(preview.program),fittedTarget=getTarget(program);
    $('comparison-label').textContent = !changed ? 'Equipped estimate' : getTargetLabel(preview.program)==='Contract' ? (preview.height>=target?'After fitting: contract ready':`Contract: ${((target-preview.height)/1000).toFixed(1)} km short`) : target ? (preview.height>=target ? `After fitting: clears ${Number((target/1000).toFixed(1))} km` : `After fitting: ${((target-preview.height)/1000).toFixed(1)} km short`) : 'With this part';
    if (prototype) $('comparison-label').textContent = 'Preview at 110%';
    $('fitted-height').textContent = `~${(preview.previousHeight/1000).toFixed(1)} km`;
    const readiness=launchReadiness(program,fittedTarget,getTargetLabel(program)==='Contract');
    $('fitted-readiness').textContent=readiness.text;
    $('fitted-readiness').dataset.ready=readiness.state;
    $('fitted-readiness').title = 'Estimates use 110% power. Gold timing can give up to 120%.';
    document.querySelector('.part-comparison').hidden = !changed;
    const difference = (preview.height-preview.previousHeight)/1000;
    $('candidate-difference').textContent = !changed ? 'Current rocket' : `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} km`;
    $('candidate-difference').title = 'Change compared with your equipped rocket';
    $('candidate-difference').dataset.change = !changed ? 'same' : difference >= 0 ? 'better' : 'worse';
    const burn = preview.stats.burn, weight = preview.stats.mass;
    $('candidate-tradeoff').textContent = preview.stats.thrust/(preview.stats.gravity??.5) < 1 ? 'Too heavy for this engine. Try a lighter tank.' : slotId==='aero'&&conditions.drag===0?`No air drag here · ${weight.toFixed(2)}t total`:equipped ? `${burn.toFixed(1)}s fuel · ${weight.toFixed(2)}t total` : `${preview.previousStats.burn.toFixed(1)} → ${burn.toFixed(1)}s fuel · ${weight.toFixed(2)}t total`;
    const stocked = !Array.isArray(program.stock)||program.stock.includes(candidateId)||owned;
    $('part-fit').textContent = !stocked ? 'Not stocked here' : equipped ? 'Fitted ✓' : owned ? 'Fit part · free' : program.credits >= candidate.price ? `Buy & fit · ✦ ${candidate.price}` : `Need ✦ ${candidate.price-program.credits} more`;
    if (prototype) $('part-fit').textContent = !changed ? 'Fitted ✓' : !plan.affordable ? `Need ✦ ${plan.cost-program.credits} more` : plan.cost ? `Buy & fit${plan.changes.length > 1 ? ' build' : ''} · ✦ ${plan.cost}` : `Fit ${plan.changes.length > 1 ? 'build' : 'part'} · free`;
    $('shop-launch').firstChild.textContent = prototype && changed ? 'Launch fitted ' : 'Launch rocket ';
    $('shop-launch').title = prototype && changed ? 'Launch your fitted rocket. Unpurchased preview changes are discarded.' : 'Launch your fitted rocket';
    $('part-info-title').textContent = candidate.name;
    $('part-info-description').textContent = candidate.detail + (candidate.trait ? ` This run: ${candidate.trait.name.toLowerCase()} — ${candidate.trait.detail}.` : '');
    const order = prototype && changed ? `Preview changes: ${plan.changes.map(id => partById(id).name).join(' + ')}. Total: ${plan.cost} credits. ` : '';
    $('part-info-stats').textContent = `${order}${$('candidate-state').textContent}. ${prototype ? 'Complete preview' : 'With this part'}: ${burn.toFixed(1)}s fuel, ${weight.toFixed(2)} tonnes. Height estimates use 110% launch power; actual timing affects the result. ${flightConditions(program.launchWorld,program.conditionsVersion??1).tip}`;
    $('part-fit').disabled = !canEdit() || (prototype ? !changed || !plan.affordable : !stocked || equipped || (!owned && program.credits < candidate.price));
    $('part-fit').title = prototype && changed ? `Fit ${plan.changes.map(id => partById(id).name).join(', ')}. Total cost: ${plan.cost} credits.` : '';
    $('part-reservation').hidden=!candidate.ability||owned||!stocked;
    $('reserve-part').textContent=getReserved()===candidateId?'Reserved · release offer':'Reserve offer · free';
    $('reserve-part').setAttribute('aria-pressed',getReserved()===candidateId);
    $('reserve-part').disabled=!canEdit();
    if(candidate.ability) {
      $('candidate-description').textContent=abilityDescription(candidate,preview.stats);
      $('candidate-trait').hidden=false;$('candidate-trait').textContent=candidate.detail;
      $('part-info-description').textContent=`Experimental part. ${candidate.detail}`;
    }
    const interaction=!changed?null:combinationChange(program,preview.program);
    $('candidate-description').dataset.warning=!!interaction?.warning;
    if(interaction)$('candidate-description').textContent=interaction.text;
    const effects=buildEffects(preview.program);
    const inactivePartner = effects.find(effect => !effect.active && effect.part !== candidate.name);
    if (prototype && changed && !interaction && inactivePartner) {
      $('candidate-description').textContent = `${inactivePartner.part}: ${inactivePartner.reason}.`;
      $('candidate-description').dataset.warning = true;
    }
    $('part-info-effects').replaceChildren(...effects.map(effect=>{
      const line=document.createElement('p');
      line.textContent=`${effect.active?'✓':'○'} ${effect.part}: ${effect.active?effect.detail:effect.reason}.`;
      line.dataset.active=effect.active;return line;
    }));
    requestAnimationFrame(keepPreviewVisible);
  }

  function selectSlot(id) {
    if (!canEdit() || !PART_SLOTS.some(slot => slot.id === id)) return;
    slotId = id; candidateId = getProgram().rulesVersion === 1 ? choices[id] || getProgram().parts.equipped[id] : getProgram().parts.equipped[id]; render();
  }
  $('assembly-stage').addEventListener('click', event => {
    const slot = event.target.closest('[data-build-slot]');
    if (slot) selectSlot(slot.dataset.buildSlot);
  });
  $('part-shelf').addEventListener('click', event => {
    const button = event.target.closest('[data-part]');
    if (!canEdit() || !button) return;
    candidateId = button.dataset.part;
    if (getProgram().rulesVersion === 1) choices[slotId] = candidateId;
    render();
  });
  $('part-info').addEventListener('click', () => $('part-dialog').showModal());
  $('part-info-close').addEventListener('click', () => $('part-dialog').close());
  $('part-fit').addEventListener('click', () => {
    if (!canEdit()) return;
    const program = getProgram();
    if (program.rulesVersion === 1) {
      const fitted = fitBuild(program, choices);
      if (!fitted) return;
      choices = {};
      onFit({ name: fitted.changes.length > 1 ? `${fitted.changes.length}-part build` : partById(fitted.changes[0]).name });
    } else {
      if (!fitPart(program, candidateId)) return;
      onFit(partById(candidateId));
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $('assembly-stage').animate([{boxShadow:'inset 0 0 0 2px #a5dcc4'},{boxShadow:'inset 0 0 0 0px transparent'}],{duration:450});
  });
  $('reserve-part')?.addEventListener('click',()=>{if(canEdit()){onReserve(getReserved()===candidateId?null:candidateId);render();}});
  $('build-reset').addEventListener('click', () => { if (canEdit()) discard(); });
  return { render, selectSlot, discard };
}
