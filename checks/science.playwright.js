// Use an isolated browser session: these fixtures replace that session's saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 const fits=async(selector,label)=>{
  for(const [width,height]of sizes){await page.setViewportSize({width,height});const bad=await page.locator(selector).evaluateAll(els=>els.filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({label,width,height,bad}));}
 };
 await page.evaluate(()=>{localStorage.clear();});await page.reload();
 await fits('#expedition,#run-start,#world-briefing','setup');
 await page.locator('#world-briefing').click();
 await fits('#science-dialog,#science-close,#science-layers,#science-fact','Earth guide');
 await page.locator('[data-layer="3"]').click();assert((await page.locator('#science-fact').innerText()).includes('thin gas'),'layer facts change');
 for(const world of ['1','4','5','8','9']){await page.locator('#science-world').selectOption(world);await fits('#science-dialog,#science-fact','other world guide');assert(!(await page.locator('#science-layers').isVisible()),'Earth layers hidden elsewhere');}
 assert((await page.locator('#science-fact').innerText()).includes('11.9 light-years'),'Tau Ceti distance');
 await page.locator('#science-close').click();
 // All starting builds plus Moon conditions must still fit the setup.
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.maxDifficulty=1;s.profile.totalGates=6;localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();await page.locator('[data-world="1"]').click();
 assert((await page.locator('#expedition-summary').innerText()).includes('600 km'),'Moon briefing uses new departure target');
 await fits('#expedition,#run-start,.kit-card,#world-briefing','three builds');
 await page.locator('#run-start').click();await page.locator('[data-part="ember"]').click();
 assert((await page.locator('#comparison-label').innerText()).includes('After fitting: clears'),'preview compares with goal');
 await fits('#workshop,#part-fit,#comparison-label,#shop-launch','build preview');
 // Start a real Earth flight that crosses several scientific layer boundaries.
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),p=await import('./parts.js'),s=e.newExpeditions();e.startExpedition(s,{seed:1});s.active.program.credits=10000;s.active.program.stock=['dart','composite','ceramic'];for(const id of s.active.program.stock)p.fitPart(s.active.program,id);e.beginExpeditionFlight(s,1.2);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();await page.locator('#run-resume').click();
 await page.locator('#flight-number').click();assert(await page.locator('#science-dialog').isVisible(),'HUD opens guide');const altitude=await page.locator('#altitude').innerText();await page.waitForTimeout(150);assert(await page.locator('#altitude').innerText()===altitude,'guide pauses flight');await page.locator('#science-close').click();await page.locator('#overlay').waitFor({state:'hidden'});assert(!(await page.locator('#overlay').isVisible()),'guide resumes flight');
 await page.locator('#game-menu').click();await page.locator('#science-menu').click();assert(await page.locator('#science-dialog').isVisible(),'menu opens guide during flight');await page.waitForTimeout(150);assert(await page.locator('#overlay').isVisible(),'menu-to-guide retains pause');await page.locator('#science-close').click();await page.locator('#overlay').waitFor({state:'hidden'});assert(!(await page.locator('#overlay').isVisible()),'menu guide closes and resumes');
 await page.locator('#speed').click();await page.waitForFunction(()=>Number(document.querySelector('#altitude').textContent)>=12,null,{timeout:30000});
 const env=await page.locator('#flight-number').innerText();assert(!env.includes('Troposphere')&&!env.includes('FLIGHT'),'altitude changes Earth layer');
 await fits('#flight-number,#flight-status,.flight-top','live HUD');
 await page.waitForFunction(()=>document.querySelector('#launch').textContent.includes('See result'),null,{timeout:30000});await page.locator('#launch').click();
 assert((await page.locator('#result-unlocks').innerText()).includes('unlocked'),'starting builds announced');
 await fits('#result,#return,#result-unlocks','flight report');
 // A mid-expedition report has both stock news and a newly unlocked kit.
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),p=await import('./parts.js'),s=e.newExpeditions();e.startExpedition(s,{seed:1});s.active.program.credits=1000;for(const id of ['ember','long'])p.fitPart(s.active.program,id);e.beginExpeditionFlight(s,1.2);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();await page.locator('#run-resume').click();await page.locator('#speed').click();await page.waitForFunction(()=>document.querySelector('#launch').textContent.includes('See result'),null,{timeout:30000});await page.locator('#launch').click();
 assert((await page.locator('#result-unlocks').innerText()).includes('New stock'),'midflight stock notice');
 await fits('#result,#return,#result-unlocks','ongoing expedition report');
 // Completed journey records remain accessible after choosing replay, without changing progress.
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.maxDifficulty=8;e.startExpedition(s,{seed:1,difficulty:8});e.beginExpeditionFlight(s,1.2);e.settleExpedition(s,{done:true,peak:e.milestoneHeight(s.active,5)+1000,payMultiplier:1});localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();await page.locator('#ending-explore').click();
 await page.locator('#game-menu').click();await page.locator('#records-menu').click();assert((await page.locator('#records-summary').innerText()).includes('Tau Ceti reached'),'completion can be revisited');
 assert(await page.locator('#records-content [data-record="launches"] b').innerText()==='1','record values');await fits('#records-dialog,#records-close,#records-content','records');await page.locator('#records-close').click();
 await page.reload();assert(await page.locator('#run-start').isVisible(),'reference keeps replay selection');
 assert(!errors.length,JSON.stringify(errors));return {passed:'Real layer HUD, guide pause/resume, ten worlds, Moon setup, previews, unlocks, revisitable records, six viewport sizes',errors};
}
