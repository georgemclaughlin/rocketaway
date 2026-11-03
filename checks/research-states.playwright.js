// Run in an isolated Playwright CLI session; fixtures replace only that browser's saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.totalGates=6;s.profile.maxDifficulty=1;s.profile.research.data=3;s.profile.research.levels.scrapper=1;e.startExpedition(s,{seed:1});e.abandonExpedition(s);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 assert(await page.locator('#research-hub').getAttribute('data-research-state')==='other','other rocket state');
 await page.locator('#research-hub').click();assert(await page.locator('[data-research-tab="stager"]').getAttribute('aria-pressed')==='true','opens affordable other build');await page.locator('#research-close').click();
 const colors={};
 for(const [width,height]of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  for(const kit of ['scrapper','stager','scientist']){
   await page.locator(`[data-kit="${kit}"]`).click();
   assert(await page.locator('#research-hub').getAttribute('data-research-state')===(kit==='scrapper'?'other':'current'),'selected kit cue');
   const fit=await page.locator('#research-hub').evaluate(e=>[e,...e.children].every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1)&&e.getBoundingClientRect().bottom<=innerHeight);
   assert(fit,JSON.stringify({width,height,kit}));
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-world="1"]').click();await page.locator('#game-menu').click();await page.keyboard.press('Escape');
 assert((await page.locator('#research-hub').innerText()).includes('Upgrade Scientist'),'selection survives world and screen sync');
 colors.current=await page.locator('#research-hub').evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.locator('#research-hub').click();assert(await page.locator('[data-research-tab="scientist"]').getAttribute('aria-pressed')==='true','opens selected upcoming rocket despite previous Scrapper run');
 await page.locator('#research-buy').click();await page.locator('#research-close').click();
 assert(await page.locator('#research-hub').getAttribute('data-research-state')==='none','updates after spending');
 colors.none=await page.locator('#research-hub').evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.locator('#run-start').click();assert(await page.locator('#research-open').getAttribute('data-research-state')==='none','hangar has same state');
 await page.evaluate(()=>{const key='rocket-away-expeditions-v1',s=JSON.parse(localStorage.getItem(key));s.profile.research.data=3;localStorage.setItem(key,JSON.stringify(s));});await page.reload();
 assert(await page.locator('#research-open').getAttribute('data-research-state')==='other','hangar knows Scientist costs more');colors.other=await page.locator('#research-open').evaluate(e=>getComputedStyle(e).backgroundColor);
 await page.locator('#research-open').click();assert(await page.locator('[data-research-tab="stager"]').getAttribute('aria-pressed')==='true','hangar opens affordable other build');await page.locator('#research-close').click();
 assert(new Set(Object.values(colors)).size===3,'visually distinct states');assert(!errors.length,JSON.stringify(errors));return {passed:'Three states, selected kit changes, world/menu sync, correct lab tab, purchase refresh, hub and hangar, six sizes',colors,errors};
}
