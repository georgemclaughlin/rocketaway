import { RESEARCH_TRACKS, researchRank, researchCost, buyResearch } from './research.js';

export function researchButtonState(profile) {
 const data=profile.research.data;
 const available=RESEARCH_TRACKS.some(t=>profile.totalGates>=t.unlock&&researchCost(profile,t.id)!==null&&data>=researchCost(profile,t.id));
 return {available,label:`<span class="research-button-title">Research <b>${data}</b></span><small>${available?'Upgrade available':'Permanent upgrades'}</small>`,ariaLabel:`Permanent research lab, ${data} research points${available?', upgrade available':''}`};
}

export function createResearchUI({getSession,onPurchase,canOpen}) {
 const $=id=>document.getElementById(id);
 let selected='scrapper';
 const dialog=$('research-dialog');
 function render() {
  const {profile,active}=getSession(),track=RESEARCH_TRACKS.find(t=>t.id===selected);
  const rank=researchRank(profile,selected),cost=researchCost(profile,selected),locked=profile.totalGates<track.unlock;
  const next=Math.min(rank+1,5),part=track.parts.find(p=>p.rank===next),complete=cost===null;
  const matches=active?.status==='build'&&active.kit===selected;
  const titles={scrapper:'Lighter rocket frame',stager:'Stronger booster stages',scientist:'Longer science flights'};
  $('research-balance').textContent=`You have ${profile.research.data} research point${profile.research.data===1?'':'s'}`;
  $('research-tabs').innerHTML=RESEARCH_TRACKS.map(t=>`<button class="small-button" data-research-tab="${t.id}" aria-pressed="${t.id===selected}">${t.name}${profile.totalGates<t.unlock?'<small>Locked</small>':active?.kit===t.id&&active.status==='build'?'<small>Current rocket</small>':'<small>Future rockets</small>'}</button>`).join('');
  $('research-offer-label').textContent=locked?'BUILD LOCKED':complete?'ALL UPGRADES OWNED':'YOUR NEXT UPGRADE';
  $('research-track-title').textContent=complete?`${track.name} fully upgraded`:part?`${part.name} starter`:titles[selected];
  $('research-rank').textContent=`${rank} / 5 owned`;
  $('research-benefit').textContent=locked?`Clear ${track.unlock-profile.totalGates} more milestones to unlock ${track.name}.`:complete?`All bonuses stay with your ${track.name} rockets.`:`For ${track.name} rockets only. ${matches?'Stat bonuses apply now.':'Bonuses apply when you choose this build.'}`;
  const metrics=selected==='scrapper'
    ? [{label:'Body weight',before:`${100-rank*3}%`,after:`${100-next*3}%`},{label:'Starting credits',before:160+rank*10,after:160+next*10}]
    : selected==='stager'
      ? [{label:'Booster power',before:`${100+rank*6}%`,after:`${100+next*6}%`}]
      : [{label:'Burn time bonus',before:`+${rank*3}%`,after:`+${next*3}%`},{label:'Altitude pay bonus',before:`+${rank*5}%`,after:`+${next*5}%`}];
  $('research-steps').innerHTML=metrics.map(m=>`<li><span class="research-metric">${m.label}</span><strong>${complete?m.before:`<span class="research-before">${m.before}</span><span class="research-arrow" aria-label="becomes">→</span><span class="research-after">${m.after}</span>`}</strong></li>`).join('');
  $('research-timing').textContent=complete?`Permanent for every future ${track.name} rocket.`:part?`Free ${part.name} with every future ${track.name}. Your fitted parts stay as they are.`:selected==='scrapper'?`Starting credits arrive with your next Scrapper. Body weight excludes fuel.`:`Permanent for every future ${track.name} rocket.`;
  $('research-cost').textContent=locked?'Earn milestones by reaching new altitude goals.':complete?'Nothing else to buy for this build.':profile.research.data>=cost?`Cost: ${cost} points · You’ll have ${profile.research.data-cost} left`:`Cost: ${cost} points · You need ${cost-profile.research.data} more`;
  $('research-buy').disabled=locked||complete||profile.research.data<cost;
  $('research-buy').textContent=locked?'Unlock this rocket first':complete?'Fully upgraded':profile.research.data<cost?`Earn ${cost-profile.research.data} more points`:`Buy upgrade · ${cost} points`;
 }
 function open() {
  if(!canOpen())return;
  selected=getSession().active?.kit||'scrapper';render();$('research-status').textContent='';dialog.showModal();$('research-close').focus();
 }
 $('research-close').addEventListener('click',()=>dialog.close());
 $('research-tabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-research-tab]');
  if(button){selected=button.dataset.researchTab;$('research-status').textContent='';render();$('research-tabs').querySelector(`[data-research-tab="${selected}"]`).focus();}
 });
 $('research-buy').addEventListener('click',()=>{
  if(!canOpen()||!buyResearch(getSession(),selected))return;
  onPurchase();render();$('research-status').textContent=`✓ ${RESEARCH_TRACKS.find(t=>t.id===selected).name} upgrade saved permanently.`;
 });
 return {open};
}
