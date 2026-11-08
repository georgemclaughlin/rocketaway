// Run in a new isolated Playwright CLI session; fixtures replace only this browser's saves.
async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);},errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 await page.evaluate(async()=>{
  const e=await import('./expeditions.js'),p=await import('./prototype-run.js'),s=e.newExpeditions();
  s.profile.totalGates=6;s.profile.research.data=80;p.startPrototype(s,{seed:12345});
  localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));
 });await page.reload();
 const fitted=(await saved()).active.program.parts.equipped;
 await page.locator('#research-open').click();
 assert(await page.locator('[data-research-section="engine"]').getAttribute('aria-pressed')==='true','component lab is default');
 await page.locator('[data-research-node="pressure-feed"]').click();
 assert(await page.locator('#research-buy').isDisabled(),'calibration prerequisite enforced');
 assert((await page.locator('#research-cost').innerText()).includes('3 points'),'prerequisite cost visible');
 await page.locator('[data-research-node="engine-calibration"]').click();
 const preview=await page.locator('#research-steps').innerText();assert(preview.includes('Height at 110%')&&preview.includes('Mass'),'live build consequences');
 await page.locator('#research-buy').click();
 let state=await saved();assert(state.profile.research.data===77&&state.active.program.componentResearch.includes('engine-calibration'),'calibration purchased and active');
 await page.locator('[data-research-node="pressure-feed"]').click();await page.locator('#research-buy').click();
 state=await saved();assert(state.profile.research.data===72&&state.active.program.tunings.engine==='standard','tuning unlock does not fit');
 assert(JSON.stringify(state.active.program.parts.equipped)===JSON.stringify(fitted),'research never replaces parts');
 await page.locator('#research-preview').click();
 assert(!(await page.locator('#research-dialog').isVisible())&&(await page.locator('#build-state').innerText()).includes('PREVIEW'),'explicit action previews in hangar');
 assert((await saved()).active.program.tunings.engine==='standard','preview not persisted');
 await page.reload();assert((await page.locator('#build-state').innerText())==='YOUR ROCKET','reload clears draft');
 await page.locator('#research-open').click();await page.locator('[data-research-section="engine"]').click();await page.locator('[data-research-node="pressure-feed"]').click();await page.locator('#research-preview').click();
 await page.locator('#part-fit').click();assert((await saved()).active.program.tunings.engine==='pressure-feed','explicit fit commits tuning');
 await page.locator('#research-open').click();
 for(const [width,height]of [[320,568],[375,667],[390,844],[390,720],[390,740],[414,736],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  for(const kit of ['scrapper','stager','scientist']){
   await page.locator(`[data-research-tab="${kit}"]`).click();
   for(const section of ['engine','tank','aero','boosters','kit']){
    await page.locator(`[data-research-section="${section}"]`).click();
    const bad=await page.evaluate(()=>[...document.querySelectorAll('#research-dialog,#research-buy,#research-preview,#research-steps li,#research-tabs,#research-close,#research-nodes button,#research-sections button')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.top<0||r.left<0||r.bottom>innerHeight+1||r.right>innerWidth+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2}).map(e=>e.id||e.tagName));
    assert(!bad.length,JSON.stringify({width,height,kit,section,bad}));
   }
  }
 }
 await page.setViewportSize({width:320,height:568});await page.locator('[data-research-tab="scientist"]').click();await page.locator('[data-research-section="engine"]').click();
 assert((await page.locator('#research-timing').innerText()).includes('new rockets'),'other-kit activation explained');
 const before=(await saved()).active.program;await page.locator('#research-buy').click();
 assert(JSON.stringify((await saved()).active.program)===JSON.stringify(before),'other-kit purchase leaves current rocket intact');
 await page.locator('#research-close').click();await page.reload();await page.locator('#research-open').click();await page.locator('[data-research-section="engine"]').click();await page.locator('[data-research-node="pressure-feed"]').click();
 assert(await page.locator('#research-preview').isVisible(),'ownership survives reload');
 await page.locator('#research-close').click();
 await page.evaluate(async()=>{const c=await import('./component-research.js'),key='rocket-away-expeditions-v1',s=JSON.parse(localStorage.getItem(key));s.profile.research.components.scrapper=c.COMPONENT_NODES.map(n=>n.id);s.profile.research.data=3;localStorage.setItem(key,JSON.stringify(s));});await page.reload();await page.locator('#research-open').click();
 assert(await page.locator('[data-research-section="kit"]').getAttribute('aria-pressed')==='true','affordable legacy perk opens when components complete');
 await page.locator('#research-close').click();
 await page.evaluate(()=>{const key='rocket-away-expeditions-v1',s=JSON.parse(localStorage.getItem(key));delete s.active.program.componentResearchVersion;delete s.active.componentResearchVersion;s.profile.research.components.scrapper=[];localStorage.setItem(key,JSON.stringify(s));});await page.reload();await page.locator('#research-open').click();
 assert((await page.locator('#research-timing').innerText()).includes('new rockets'),'old rocket activation scope explained');
 await page.locator('#research-buy').click();assert(!(await saved()).active.program.componentResearchVersion,'old rocket is not silently upgraded');
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'Component prerequisites, active calibration, unlock versus preview versus fit, reload, kit scope, and nine viewport layouts across every branch and kit',errors};
}
