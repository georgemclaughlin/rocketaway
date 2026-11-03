import { RESEARCH_TRACKS, researchRank, researchCost, buyResearch } from './research.js';

export function researchButtonState(profile) {
 const data=profile.research.data;
 const available=RESEARCH_TRACKS.some(t=>profile.totalGates>=t.unlock&&researchCost(profile,t.id)!==null&&data>=researchCost(profile,t.id));
 return {available,label:`<span class="research-button-title">Research <b>${data}</b></span><small>${available?'Upgrade available':'Permanent upgrades'}</small>`,ariaLabel:`Permanent research lab, ${data} data${available?', upgrade available':''}`};
}

export function createResearchUI({getSession,onPurchase,canOpen}) {
 const $=id=>document.getElementById(id);
 let selected='scrapper';
 const dialog=$('research-dialog');
 function render() {
  const {profile,active}=getSession(),track=RESEARCH_TRACKS.find(t=>t.id===selected);
  const rank=researchRank(profile,selected),cost=researchCost(profile,selected),locked=profile.totalGates<track.unlock;
  $('research-balance').textContent=`${profile.research.data} data`;
  $('research-tabs').innerHTML=RESEARCH_TRACKS.map(t=>`<button class="small-button" data-research-tab="${t.id}" aria-pressed="${t.id===selected}">${t.name}</button>`).join('');
  $('research-track-title').textContent=track.theme;
  $('research-rank').textContent=`Rank ${rank} / 5`;
  $('research-benefit').textContent=rank?track.benefit(rank):'Choose a rank to improve this build permanently.';
  $('research-steps').innerHTML=Array.from({length:5},(_,index)=>{
   const level=index+1,part=track.parts.find(p=>p.rank===level);
   return `<li data-earned="${level<=rank}"><span>${level<=rank?'✓':level}</span><div><strong>${part?`Start with ${part.name}`:track.benefit(level)}</strong>${part?`<small>${track.benefit(level)}</small>`:''}</div></li>`;
  }).join('');
  $('research-timing').textContent=active?.status==='build'&&active.kit===selected
    ? 'Bonuses apply to this rocket now. Starting parts and credits apply next run.'
    : `Kept for every future ${track.name} rocket. Starting parts are fitted free.`;
  $('research-active').textContent=active?`Current rocket: ${RESEARCH_TRACKS.find(t=>t.id===active.kit).name}. Research for other builds waits until you choose them.`:'Choose your build on the world screen. Every research rank stays unlocked.';
  $('research-buy').disabled=locked||cost===null||profile.research.data<cost;
  $('research-buy').textContent=locked?`Clear ${track.unlock-profile.totalGates} more milestones to unlock`:cost===null?'Fully researched':profile.research.data<cost?`Need ${cost-profile.research.data} more data`:`Research rank ${rank+1} · ${cost} data`;
 }
 function open() {
  if(!canOpen())return;
  selected=getSession().active?.kit||'scrapper';render();$('research-status').textContent='';dialog.showModal();$('research-close').focus();
 }
 $('research-close').addEventListener('click',()=>dialog.close());
 $('research-tabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-research-tab]');
  if(button){selected=button.dataset.researchTab;render();$('research-tabs').querySelector(`[data-research-tab="${selected}"]`).focus();}
 });
 $('research-buy').addEventListener('click',()=>{
  if(!canOpen()||!buyResearch(getSession(),selected))return;
  onPurchase();render();$('research-status').textContent=`${RESEARCH_TRACKS.find(t=>t.id===selected).name} rank ${researchRank(getSession().profile,selected)} saved permanently.`;
 });
 return {open};
}
