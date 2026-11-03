import { worldFor, destinationFor, worldMarkup } from './worlds.js';
import { fittedParts } from './parts.js';
import { rocketArt } from './builder.js';

export function createTravel(onArrive) {
  const dialog=document.getElementById('travel-dialog');
  const skip=document.getElementById('travel-skip');
  let timer=null, arriving=false;
  dialog.addEventListener('close',()=>{
    clearTimeout(timer);
    if(!arriving)return;
    arriving=false;
    onArrive();
  });
  skip.addEventListener('click',()=>dialog.close());
  return run=>{
    if(arriving)return;
    const from=worldFor(run),to=destinationFor(run);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('travel-title').textContent=to.star?'Destination: Tau Ceti':`Next stop: ${to.name}`;
    document.getElementById('travel-caption').textContent=to.star?'Nine worlds behind you. A new star ahead.':`${from.name} cleared. Your next launchpad awaits.`;
    document.getElementById('travel-scene').innerHTML=`${worldMarkup(from,'travel-from')}${worldMarkup(to,'travel-to')}<div class="travel-ship">${rocketArt(fittedParts(run.program))}</div><span class="travel-from-name">${from.name}</span><span class="travel-to-name">${to.name}</span>`;
    dialog.dataset.reduced=reduced;
    arriving=true;
    dialog.showModal();skip.focus();
    timer=setTimeout(()=>dialog.close(),reduced?500:3400);
  };
}
