// Browser helpers for an isolated incognito playtest tab only.
// Import in the tab; never run seed() against a player's browser.
const $=id=>document.getElementById(id);
const assert=(ok,message)=>{if(!ok)throw Error(message);};
export function layout() {
 const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Horizontal overflow');
 assert(document.documentElement.scrollHeight<=innerHeight+1,'Vertical overflow');
 const heading=$('journey-destination').getBoundingClientRect(),count=$('journey-count').getBoundingClientRect();
 if(heading.width&&count.width)assert(heading.right<=count.left+1,'Journey heading overlap');
 const names=['shop-launch','research-open','discoveries-open','return'];
 for(const id of names){const e=$(id);if(!visible(e))continue;const b=e.getBoundingClientRect();assert(b.left>=-1&&b.right<=innerWidth+1&&b.top>=0&&b.bottom<=innerHeight+1,`${id} outside viewport`);}
 const actions=['research-open','discoveries-open','shop-launch'].map($).filter(visible).map(e=>e.getBoundingClientRect());
 for(let i=1;i<actions.length;i++)assert(actions[i].left>=actions[i-1].right-1,'Hangar action overlap');
 return {width:innerWidth,height:innerHeight,passed:true};
}
export async function seed(seed=43,world=0) {
 assert(globalThis.__isolatedDiscoveryPlaytest===true,'Explicit isolated-session marker required');
 const m=await import('../prototype-run.js?v=discovery-4'),c=await import('../campaign-save.js?v=discovery-4');
 const s=m.newExpeditions();s.profile.maxDifficulty=world;m.startPrototype(s,{seed,difficulty:world});
 localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(c.packCampaignSave(s,m.newExpeditions())));
 location.reload();
}
export function save(){return JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'));}
export async function launchNormally() {
 $('shop-launch').click();
 // Wait for a readable good-power opportunity, then use the same ignition button.
 await new Promise((resolve,reject)=>{const start=performance.now();function tick(){if(Number($('timing-quality').textContent.replace('%',''))>=108){$('launch').click();resolve();}else if(performance.now()-start>5000)reject(Error('Timing meter did not advance'));else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 await new Promise((resolve,reject)=>{const start=performance.now();function tick(){if(!$('overlay').hidden&&save().active?.status!=='flying')resolve();else if(performance.now()-start>24000)reject(Error('Ordinary flight did not finish within 24 seconds'));else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 return {report:$('result').innerText,run:save().active};
}
