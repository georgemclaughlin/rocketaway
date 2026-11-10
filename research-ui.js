import { RESEARCH_TRACKS, researchRank, researchCost, buyResearch, componentOwned, canBuyComponentResearch, buyComponentResearch } from './research.js?v=discovery-4';

import { COMPONENT_RESEARCH, COMPONENT_NODES, componentNode, normalizeComponentUnlocks } from './component-research.js?v=discovery-4';
import { estimateHeight } from './builder.js?v=discovery-4';
import { assemblySpecs } from './parts.js?v=discovery-4';

function componentAffordable(profile,kit) {
 return COMPONENT_NODES.some(node=>!componentOwned(profile,kit,node.id)&&profile.research.data>=node.cost&&(node.kind==='calibration'||componentOwned(profile,kit,COMPONENT_RESEARCH.find(branch=>branch.id===node.slot).calibration.id)));
}
export function researchButtonState(profile,selectedKit='scrapper',components=false) {
 const data=profile.research.data;
 const affordable=RESEARCH_TRACKS.filter(t=>profile.totalGates>=t.unlock&&((researchCost(profile,t.id)!==null&&data>=researchCost(profile,t.id))||(components&&componentAffordable(profile,t.id))));
 const current=affordable.find(t=>t.id===selectedKit),available=affordable.length>0;
 const state=current?'current':available?'other':'none';
 const complete=RESEARCH_TRACKS.every(t=>researchCost(profile,t.id)===null&&(!components||COMPONENT_NODES.every(node=>componentOwned(profile,t.id,node.id))));
 const cue=current?`↑ Upgrade ${current.name}`:available?'↗ Other rockets only':complete?'All upgrades owned':'Earn more points';
 return {available,state,targetKit:current?.id||affordable[0]?.id||selectedKit,label:`<span class="research-button-title">Research <b>${data}</b></span><small>${cue}</small>`,ariaLabel:`Permanent research lab, ${data} research points. ${current?`Upgrade available for your selected ${current.name} rocket`:available?'Upgrades available for other rockets only':complete?'All upgrades owned':'No affordable upgrades yet'}`};
}

export function createResearchUI({getSession,getSelectedKit,onPurchase,canOpen,prototype=false,onPreviewTuning=()=>{}}) {
 const $=id=>document.getElementById(id);
 let selected='scrapper',section=prototype?'engine':'kit',nodeId='engine-calibration';
 const dialog=$('research-dialog');
 const shortNames={'pressure-feed':'Pressure','cruise-feed':'Cruise','light-shell':'Light shell','extended-reservoir':'Reservoir','streamlined-shell':'Streamline','minimal-shell':'Minimal','high-impulse':'Impulse','light-casings':'Light pods'};
 function selectFirstNode() {
  const branch=COMPONENT_RESEARCH.find(branch=>branch.id===section);
  if(!branch)return;
  const {profile}=getSession(),nodes=[branch.calibration,...branch.tunings];
  nodeId=(nodes.find(node=>!componentOwned(profile,selected,node.id))||nodes[0]).id;
 }
 function renderComponent(track,locked) {
  const session=getSession(),{profile,active}=session,branch=COMPONENT_RESEARCH.find(branch=>branch.id===section);
  const nodes=[branch.calibration,...branch.tunings],node=nodes.find(n=>n.id===nodeId)||nodes[0];nodeId=node.id;
  const owned=componentOwned(profile,selected,node.id),prerequisite=componentOwned(profile,selected,branch.calibration.id);
  const matches=active?.status==='build'&&active.kit===selected&&active.program.componentResearchVersion===1;
  const compatible=matches&&(section!=='boosters'||active.program.parts.equipped.boosters!=='bare');
  $('research-nodes').innerHTML=nodes.map(n=>`<button class="small-button" data-research-node="${n.id}" aria-pressed="${n.id===nodeId}"><span>${n.kind==='calibration'?'Calibrate':shortNames[n.id]||n.name}</span><small>${componentOwned(profile,selected,n.id)?'Owned ✓':`${n.cost} points`}</small></button>`).join('');
  $('research-offer-label').textContent=owned?'PERMANENTLY OWNED':node.kind==='calibration'?'COMPONENT UPGRADE':'UNLOCK A SPECIALIZATION';
  $('research-rank').textContent=`${nodes.filter(n=>componentOwned(profile,selected,n.id)).length}/3 owned`;
  $('research-track-title').textContent=node.name;
  $('research-benefit').textContent=node.description;
  $('research-steps').replaceChildren();
  if(matches) {
   const before=active.program,after={...before,componentResearch:normalizeComponentUnlocks([...(before.componentResearch||[]),branch.calibration.id,node.id]),tunings:{...before.tunings}};
   if(node.kind==='tuning')after.tunings[section]=node.id;
   const oldStats=assemblySpecs(before),newStats=assemblySpecs(after);
   const metrics=[['Height at 110%',`${(estimateHeight(before)/1000).toFixed(1)}`,`${(estimateHeight(after)/1000).toFixed(1)} km`],['Burn',`${oldStats.burn.toFixed(1)}`,`${newStats.burn.toFixed(1)}s`],['Mass',`${oldStats.mass.toFixed(2)}`,`${newStats.mass.toFixed(2)}t`]];
   $('research-steps').innerHTML=metrics.map(([label,from,to])=>`<li><span class="research-metric">${label}</span><strong><span class="research-before">${from}</span><span class="research-arrow" aria-label="becomes">→</span><span class="research-after">${to}</span></strong></li>`).join('');
  }
  $('research-timing').textContent=locked?`Clear ${Math.max(0,track.unlock-profile.totalGates)} more milestones to unlock ${track.name}.`:!matches?`${track.name} only · applies to new rockets. Your current rocket stays as fitted.`:!compatible?`${track.name} only · no effect with no boosters fitted.`:node.kind==='calibration'?`${track.name} only · ${owned?'active on this rocket':'applies immediately when bought'}.`:`${track.name} only · preview includes calibration. Unlocking does not fit it.`;
  $('research-cost').textContent=locked?'Unlock this starting kit first.':owned?node.kind==='tuning'?'Owned · free to fit or change later.':'Owned · permanent component improvement.':node.kind==='tuning'&&!prerequisite?`First research ${branch.calibration.name} (${branch.calibration.cost} points).`:profile.research.data>=node.cost?`Cost ${node.cost} points · ${profile.research.data-node.cost} left after purchase`:`Cost ${node.cost} points · need ${node.cost-profile.research.data} more`;
  $('research-buy').hidden=owned&&node.kind==='tuning'&&matches;
  $('research-buy').disabled=!canBuyComponentResearch(session,selected,node.id);
  $('research-buy').textContent=locked?'Kit locked':owned?'Owned ✓':node.kind==='tuning'&&!prerequisite?'Calibration required':profile.research.data<node.cost?`Earn ${node.cost-profile.research.data} more points`:`Research · ${node.cost} points`;
  $('research-preview').hidden=!(owned&&node.kind==='tuning'&&matches);
  $('research-preview').textContent='Preview in hangar →';
 }

 function render() {
  const {profile,active}=getSession(),track=RESEARCH_TRACKS.find(t=>t.id===selected);
  dialog.dataset.component=prototype&&section!=='kit';
  $('research-component-controls').hidden=!prototype;
  $('research-buy').hidden=false;$('research-preview').hidden=true;
  $('research-nodes').hidden=section==='kit';
  $('research-sections').innerHTML=[...COMPONENT_RESEARCH.map(branch=>({id:branch.id,name:branch.name})),{id:'kit',name:'Kit perks'}].map(branch=>`<button class="small-button" data-research-section="${branch.id}" aria-pressed="${section===branch.id}">${branch.id==='boosters'?'Boosters':branch.id==='aero'?'Nose':branch.id==='tank'?'Tank':branch.name}</button>`).join('');
  const rank=researchRank(profile,selected),cost=researchCost(profile,selected),locked=profile.totalGates<track.unlock;
  const next=Math.min(rank+1,5),part=track.parts.find(p=>p.rank===next),complete=cost===null;
  const matches=active?.status==='build'&&active.kit===selected;
  const titles={scrapper:'Lighter rocket frame',stager:'Stronger booster stages',scientist:'Longer science flights'};
  $('research-balance').textContent=`You have ${profile.research.data} research point${profile.research.data===1?'':'s'}`;
  $('research-tabs').innerHTML=RESEARCH_TRACKS.map(t=>`<button class="small-button" data-research-tab="${t.id}" aria-pressed="${t.id===selected}">${t.name}${profile.totalGates<t.unlock?'<small>Locked</small>':active?.kit===t.id&&active.status==='build'?'<small>Current rocket</small>':'<small>Future rockets</small>'}</button>`).join('');
  if(prototype&&section!=='kit'){renderComponent(track,locked);return;}
  $('research-offer-label').textContent=locked?'BUILD LOCKED':complete?'ALL UPGRADES OWNED':'YOUR NEXT UPGRADE';
  $('research-track-title').textContent=complete?`${track.name} fully upgraded`:part?`${part.name} starter`:titles[selected];
  $('research-rank').textContent=`${rank} / 5 owned`;
  $('research-benefit').textContent=locked?`Clear ${track.unlock-profile.totalGates} more milestones to unlock ${track.name}.`:complete?`All bonuses stay with your ${track.name} rockets.`:`For ${track.name} rockets only. ${matches?'Stat bonuses apply now.':'Bonuses apply when you choose this build.'}`;
  const metrics=selected==='scrapper'
    ? [{label:'Body weight',before:`${100-rank*3}%`,after:`${100-next*3}%`},{label:'Base starting credits',before:160+rank*10,after:160+next*10}]
    : selected==='stager'
      ? [{label:'Booster power',before:`${100+rank*6}%`,after:`${100+next*6}%`}]
      : [{label:'Burn time bonus',before:`+${rank*3}%`,after:`+${next*3}%`},{label:'Altitude credits bonus',before:`+${rank*5}%`,after:`+${next*5}%`}];
  $('research-steps').innerHTML=metrics.map(m=>`<li><span class="research-metric">${m.label}</span><strong>${complete?m.before:`<span class="research-before">${m.before}</span><span class="research-arrow" aria-label="becomes">→</span><span class="research-after">${m.after}</span>`}</strong></li>`).join('');
  $('research-timing').textContent=complete?`Permanent for every future ${track.name} rocket.`:part?`Free ${part.name} with every future ${track.name}. Your fitted parts stay as they are.`:selected==='scrapper'?`Starting credits arrive with your next Scrapper. Body weight excludes fuel.`:`Permanent for every future ${track.name} rocket.`;
  $('research-cost').textContent=locked?'Earn milestones by reaching new altitude goals.':complete?'Nothing else to buy for this build.':profile.research.data>=cost?`Cost: ${cost} points · You’ll have ${profile.research.data-cost} left`:`Cost: ${cost} points · You need ${cost-profile.research.data} more`;
  $('research-buy').disabled=locked||complete||profile.research.data<cost;
  $('research-buy').textContent=locked?'Unlock this rocket first':complete?'Fully upgraded':profile.research.data<cost?`Earn ${cost-profile.research.data} more points`:`Buy upgrade · ${cost} points`;
 }
 function open() {
  if(!canOpen())return;
  const session=getSession();
  selected=researchButtonState(session.profile,getSelectedKit(),prototype).targetKit;
  const affordable=prototype&&COMPONENT_NODES.find(node=>canBuyComponentResearch(session,selected,node.id));
  const legacyCost=researchCost(session.profile,selected),legacyAffordable=legacyCost!==null&&session.profile.research.data>=legacyCost;
  section=prototype?(affordable?.slot||(legacyAffordable?'kit':'engine')):'kit';selectFirstNode();
  if(affordable)nodeId=affordable.id;
  render();$('research-status').textContent='';dialog.showModal();$('research-close').focus();
 }
 $('research-close').addEventListener('click',()=>dialog.close());
 $('research-tabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-research-tab]');
  if(button){selected=button.dataset.researchTab;selectFirstNode();$('research-status').textContent='';render();$('research-tabs').querySelector(`[data-research-tab="${selected}"]`).focus();}
 });
 $('research-buy').addEventListener('click',()=>{
  if(!canOpen())return;
  const component=prototype&&section!=='kit',node=component?componentNode(nodeId):null;
  if(!(component?buyComponentResearch(getSession(),selected,nodeId):buyResearch(getSession(),selected)))return;
  onPurchase();render();$('research-status').textContent=`✓ ${node?.name||RESEARCH_TRACKS.find(t=>t.id===selected).name+' upgrade'} saved permanently.`;
  if(!$('research-preview').hidden)$('research-preview').focus();
 });
 $('research-sections').addEventListener('click',event=>{
  const button=event.target.closest('[data-research-section]');if(!button)return;
  section=button.dataset.researchSection;selectFirstNode();$('research-status').textContent='';render();
  $('research-sections').querySelector(`[data-research-section="${section}"]`).focus();
 });
 $('research-nodes').addEventListener('click',event=>{
  const button=event.target.closest('[data-research-node]');if(!button)return;
  nodeId=button.dataset.researchNode;$('research-status').textContent='';render();
  $('research-nodes').querySelector(`[data-research-node="${nodeId}"]`).focus();
 });
 $('research-preview').addEventListener('click',()=>{
  const {active,profile}=getSession(),node=componentNode(nodeId);
  if(!canOpen()||!node||node.kind!=='tuning'||active?.status!=='build'||active.kit!==selected||active.program.componentResearchVersion!==1||!componentOwned(profile,selected,nodeId))return;
  dialog.close();onPreviewTuning(section,nodeId);
 });
 return {open};
}
