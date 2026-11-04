import { worldFor, destinationFor, worldMarkup } from './worlds.js?v=equipment-synergy-1';
import { fittedParts } from './parts.js?v=equipment-synergy-1';
import { rocketArt } from './builder.js?v=equipment-synergy-1';

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
    dialog.dataset.interstellar=to.star===true;
    dialog.querySelector('.eyebrow').textContent=to.star?'THE FINAL CROSSING':'ROAD TO TAU CETI';
    document.getElementById('travel-title').textContent=to.star?'Crossing to Tau Ceti':`Next stop: ${to.name}`;
    document.getElementById('travel-caption').textContent=to.star?'Leaving the Solar System behind. Your final destination is another star.':`${from.name} cleared. Your next launchpad awaits.`;
    skip.textContent=to.star?'Arrive at Tau Ceti →':'Skip travel →';
    document.getElementById('travel-scene').innerHTML=`${worldMarkup(from,'travel-from')}${worldMarkup(to,'travel-to')}<div class="travel-ship">${rocketArt(fittedParts(run.program))}</div><span class="travel-from-name">${from.name}</span><span class="travel-to-name">${to.name}</span>`;
    dialog.dataset.reduced=reduced;
    arriving=true;
    dialog.showModal();skip.focus();
    timer=setTimeout(()=>dialog.close(),reduced?500:to.star?5200:3400);
  };
}
