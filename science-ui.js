import { EARTH_LAYERS, SCIENCE_WORLDS, GRAVITY_SOURCE, earthLayerAt } from './science-data.js?v=component-research-1';
import { WORLDS, TAU_CETI, worldMarkup, flightConditions } from './worlds.js?v=component-research-1';
export function createScienceUI() {
  const $=id=>document.getElementById(id);
  let world=0,layer=0,legacyWorld=null;
  $('science-world').innerHTML=SCIENCE_WORLDS.map((item,index)=>`<option value="${index}">${item.name}</option>`).join('');
  function render() {
    const info=SCIENCE_WORLDS[world],earth=world===0;
    $('science-world').value=String(world);
    $('science-dialog').dataset.earth=earth;
    $('science-world-art').innerHTML=worldMarkup(WORLDS[world]||TAU_CETI);
    $('science-environment').textContent=info.label;
    $('science-fact').textContent=earth?EARTH_LAYERS[layer].fact:info.fact;
    $('science-layers').hidden=!earth;
    $('science-layers').innerHTML=earth?EARTH_LAYERS.map((item,index)=>`<button class="science-layer" data-layer="${index}" aria-pressed="${layer===index}"><strong>${item.name}</strong><span>~${item.bottom/1000}–${(item.top/1000).toLocaleString()} km</span></button>`).join(''):'';
    $('science-boundaries').hidden=!earth;
    $('science-gravity').hidden=!info.gravity;
    $('science-gravity').textContent=info.gravity?`Real surface gravity: ${info.gravity.toFixed(2)} m/s²${world===1?' · Earth: 9.80 m/s²':''}`:'';
    const conditions=flightConditions(world);
    $('science-gameplay').textContent=world===9?'Your journey ends at this distant star.':`${world===legacyWorld?'This saved expedition keeps its original flight conditions. ':''}New expeditions: ${conditions.tip}`;
    $('science-source').href=info.source;
    $('science-gravity-source').hidden=!info.gravity;
    $('science-gravity-source').href=info.gravitySource||GRAVITY_SOURCE;
  }
  $('science-world').addEventListener('change',()=>{world=Number($('science-world').value);layer=0;render();});
  $('science-layers').addEventListener('click',event=>{const button=event.target.closest('[data-layer]');if(button){layer=Number(button.dataset.layer);render();$('science-layers').querySelector(`[data-layer="${layer}"]`).focus();}});
  $('science-close').addEventListener('click',()=>$('science-dialog').close());
  return {render(worldIndex,altitude=0,savedWorld=null){legacyWorld=savedWorld;world=Math.max(0,Math.min(9,worldIndex));layer=EARTH_LAYERS.indexOf(earthLayerAt(altitude)||EARTH_LAYERS.at(-1));render();}};
}
