// Run with Playwright CLI in a fresh isolated session; fixtures replace saves in that test browser.
async page => {
const checkLab = async page => {
 const assert=(v,m)=>{if(!v)throw Error(m);};const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(async()=>{const e=await import('./expeditions.js');const s=e.newExpeditions();s.profile.totalGates=6;s.profile.research.data=60;e.startExpedition(s,{seed:12345});localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 const before=await page.locator('#fitted-height').innerText();
 await page.locator('#research-open').click();assert(await page.locator('#research-dialog').isVisible(),'open from hangar');
 for(const [width,height]of[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  for(const kit of ['scrapper','stager','scientist']){
   await page.locator(`[data-research-tab="${kit}"]`).click();
   const bad=await page.evaluate(()=>[...document.querySelectorAll('#research-dialog,#research-buy,#research-steps li,#research-tabs,#research-close')].filter(e=>{const r=e.getBoundingClientRect();return r.top<0||r.left<0||r.bottom>innerHeight+1||r.right>innerWidth+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2}).map(e=>e.id||e.tagName));
   assert(!bad.length,JSON.stringify({width,height,kit,bad}));
  }
 }
 await page.setViewportSize({width:320,height:568});await page.locator('[data-research-tab="scrapper"]').click();
 assert((await page.locator('#research-balance').innerText()).includes('60 research points'),'currency explained');
 assert((await page.locator('#research-cost').innerText()).includes('have 57 left'),'balance after purchase preview');
 await page.locator('#research-buy').click();await page.locator('#research-buy').click();
 assert(await page.locator('#research-dialog').evaluate(e=>e.scrollHeight<=e.clientHeight+2),'next upgrade and purchase feedback fit smallest phone');
 assert((await page.locator('#research-balance').innerText()).includes('52'),'costs paid');
 await page.locator('#research-close').click();assert(await page.locator('#fitted-height').innerText()!==before,'estimate updates');
 let save=await page.evaluate(()=>(saved=>saved.originalCampaign||saved)(JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'))));assert(save.active.program.parts.equipped.engine==='spark','no replacement of fitted parts');
 await page.reload();assert((await page.locator('#research-open').innerText()).includes('52'),'data saved');await page.locator('#research-open').click();assert((await page.locator('#research-rank').innerText()).includes('2'),'rank saved');await page.keyboard.press('Escape');
 await page.evaluate(async()=>{const e=await import('./expeditions.js');const s=e.restoreExpeditions((saved=>saved.originalCampaign||saved)(JSON.parse(localStorage.getItem(e.EXPEDITION_KEY))));e.abandonExpedition(s);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 await page.locator('#research-hub').click();await page.locator('#research-close').click();await page.locator('#run-start').click();
 save=await page.evaluate(()=>(saved=>saved.originalCampaign||saved)(JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'))));assert(save.active.program.parts.equipped.engine==='ember'&&save.active.program.credits===180,'upgraded next start');
 await page.locator('#shop-launch').click();assert(await page.locator('#research-open').isDisabled(),'research blocked during ignition');await page.locator('#cancel-launch').click();
 await page.locator('#game-menu').click();await page.locator('#reset-all').click();await page.locator('#reset-confirm').click();
 save=await page.evaluate(()=>(saved=>saved.originalCampaign||saved)(JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'))));assert(save.profile.research.data===0&&save.profile.research.levels.scrapper===0,'full reset clears research');
 assert(!errors.length,JSON.stringify(errors));return{passed:'Lab layout at six sizes for all builds, purchase, estimates, reload, upgraded starter, phase guard, full reset',errors};
};
const checkEdges = async page => {
 const assert=(v,m)=>{if(!v)throw Error(m);};
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.totalGates=6;s.profile.research.data=200;s.profile.research.levels={scrapper:4,stager:5,scientist:5};e.startExpedition(s,{seed:1,difficulty:0});localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 await page.setViewportSize({width:320,height:568});await page.locator('#research-open').click();await page.locator('#research-buy').click();
 for(const [width,height]of[[320,568],[390,844],[667,375]]){
  await page.setViewportSize({width,height});
  const bad=await page.evaluate(()=>[...document.querySelectorAll('#research-dialog,#research-buy,#research-steps li,#research-status')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>innerHeight+1||e.scrollHeight>e.clientHeight+2}).map(e=>e.id||e.tagName));assert(!bad.length,JSON.stringify({width,height,bad}));
 }
 await page.locator('[data-research-tab="scientist"]').click();assert((await page.locator('#research-timing').innerText()).includes('future Scientist'),'other build timing clear');await page.locator('#research-close').click();
 for(const [width,height]of[[320,568],[390,844],[667,375]]){
  await page.setViewportSize({width,height});
  const bad=await page.evaluate(()=>[...document.querySelectorAll('.journey-heading,.journey-tools,#research-open,#shop-launch')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({width,height,bad}));
 }
 await page.evaluate(async()=>{const e=await import('./expeditions.js');const s=e.restoreExpeditions((saved=>saved.originalCampaign||saved)(JSON.parse(localStorage.getItem(e.EXPEDITION_KEY))));e.abandonExpedition(s);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 for(const [width,height]of[[320,568],[390,844],[667,375]]){
  await page.setViewportSize({width,height});
  const bad=await page.evaluate(()=>[...document.querySelectorAll('.kit-card,.setup-heading,#research-hub,#run-start')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>innerHeight+1||r.right>innerWidth+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({width,height,bad}));
 }
 return{passed:'Max rank, purchase feedback, compact hangar lab button, upgraded starter cards at phone and landscape sizes'};
};
return {lab:await checkLab(page),edges:await checkEdges(page)};
}
