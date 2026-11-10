import { CORES, coreById, coreStatus, nextCache, cacheSites, fitCore } from './discoveries.js?v=discovery-4';
import { assemblySpecs, partById } from './parts.js?v=discovery-4';
import { estimateHeight } from './builder.js?v=discovery-4';
import { milestoneHeight } from './expeditions.js?v=discovery-4';
export function createDiscoveryUI({getRun,canEdit,onFit}) {
 const $=id=>document.getElementById(id);let selected=null;
 function renderButton(){const run=getRun(),enabled=run?.discoveryVersion===1;
  $('discoveries-open').hidden=!enabled;document.querySelector('.hangar-actions').dataset.discoveries=enabled;
  if(!enabled)return;
  const core=coreById(run.program.core);$('discoveries-open').innerHTML=`<span>${core?core.icon:'✧'} Discoveries</span><small>${core?core.name:`${run.discoveries.length} / 3 recovered`}</small>`;
 }
 function render(){const run=getRun();if(!run||run.discoveryVersion!==1)return;
  const p=run.program,core=coreById(selected),next=nextCache(run),draft={...p,core:selected};
  $('discovery-next').textContent=next?`${next.name} · reach ${(milestoneHeight(run,next.stage-1)/1000).toLocaleString()} km to recover its hardware.`:'All signals recovered. Take these cores to the Moon. Keep one fitted; swap freely in the hangar.';
  $('discovery-cards').innerHTML=CORES.map(c=>{const owned=run.discoveries.includes(c.id),site=cacheSites(run).find(s=>s.core===c.id);return `<button class="discovery-card" data-core="${c.id}" ${owned?'':'disabled'} aria-pressed="${selected===c.id}" style="--core-color:${c.color}"><span class="core-icon">${owned?c.icon:'?'}</span><span><strong>${owned?c.name:'Unidentified hardware'}</strong><small>${owned?(p.core===c.id?'Fitted · ':'Recovered · ')+c.identity:site?`${site.world?'Moon':'Earth'} · marker ${site.stage}`:'No signal on this expedition'}</small></span></button>`;}).join('');
  $('discovery-description').textContent=core?core.detail:'Fly with ordinary hardware. Your recovered cores stay available.';
  $('discovery-hint').textContent=core?`${core.hint} Recovered with ${partById(core.part).name} (owned; fit separately).`:'';
  $('discovery-estimate').textContent=`Fitted ${(estimateHeight(p)/1000).toFixed(1)} km → preview ${(estimateHeight(draft)/1000).toFixed(1)} km at 110%`;
  $('discovery-state').textContent=coreStatus(core,assemblySpecs(draft));
  $('discovery-fit').disabled=!canEdit()||selected===p.core;
  $('discovery-fit').textContent=selected===p.core?'Core fitted':canEdit()?'Fit core · free':'Return to the hangar to fit';
 }
 $('discoveries-open').onclick=()=>{selected=getRun()?.program.core||null;render();$('discovery-dialog').showModal();};
 $('discovery-close').onclick=()=>$('discovery-dialog').close();
 $('discovery-cards').onclick=e=>{const id=e.target.closest('[data-core]')?.dataset.core;if(id&&getRun().discoveries.includes(id)){selected=id;render();}};
 $('discovery-none').onclick=()=>{selected=null;render();};
 $('discovery-fit').onclick=()=>{if(canEdit()&&fitCore(getRun(),selected)){onFit();$('discovery-dialog').close();}};
 return {render:renderButton};
}
