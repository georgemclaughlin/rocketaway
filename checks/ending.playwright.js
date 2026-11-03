// Run in an isolated Playwright CLI session; fixtures replace only that browser's saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.maxDifficulty=8;s.profile.totalGates=48;s.profile.runs=17;s.profile.wins=8;s.profile.research.data=21;s.profile.research.levels={scrapper:2,stager:1,scientist:3};e.startExpedition(s,{seed:1,difficulty:8});e.beginExpeditionFlight(s,1.2);e.settleExpedition(s,{done:true,peak:e.milestoneHeight(s.active,5)+1000,quality:1.2,payMultiplier:1});localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 for(const [width,height]of[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  const bad=await page.evaluate(()=>[...document.querySelectorAll('#expedition,#expedition-title,.finale-vista,.finale-message,.finale-route,.finale-stats,#ending-explore,#expedition-footer')].filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||(!e.classList.contains('finale-vista')&&(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2))}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({width,height,bad}));
 }
 assert(await page.locator('#run-start').count()===0,'no automatic replay setup');assert(await page.locator('.finale-route > span').count()===9,'all launch worlds commemorated');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));await page.reload();assert(await page.locator('#ending-explore').isVisible(),'ending persists');
 await page.locator('#ending-explore').click();assert(await page.locator('#run-start').isVisible(),'explicit exploration choice');assert((await page.locator('#expedition-step').innerText()).includes('OPTIONAL REPLAY'),'replay clear');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));assert(after.profile.endingAcknowledged&&after.profile.campaignComplete,'choice saved');assert(after.profile.wins===before.profile.wins&&after.profile.runs===before.profile.runs&&JSON.stringify(after.profile.research)===JSON.stringify(before.profile.research),'no rewards or progress reset');
 await page.reload();assert(await page.locator('#run-start').isVisible(),'exploration choice survives reload');await page.locator('[data-world="0"]').click();await page.locator('#run-start').click();assert(await page.locator('#shop-launch').isVisible(),'optional replay starts normally');
 assert(!errors.length,JSON.stringify(errors));return {passed:'Ending across six sizes, no forced replay, persistent completion and exploration choice, progress retained, optional replay',errors};
}
