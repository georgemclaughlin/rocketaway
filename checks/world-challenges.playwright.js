// Isolated test browser only: fixtures never touch a player's real save.
async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 const check=async(selector,phase)=>{for(const [width,height]of sizes){await page.setViewportSize({width,height});const bad=await page.locator(selector).evaluateAll(elements=>elements.filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.bottom>innerHeight+1||r.right>innerWidth+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({phase,width,height,bad}));}};
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.maxDifficulty=8;s.profile.totalGates=48;s.profile.research.levels={scrapper:5,stager:5,scientist:5};localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 for(let world=0;world<9;world++){
  await page.locator(`[data-world="${world}"]`).click();await check('#expedition,#world-briefing,.kit-card,#run-start,.kit-unlock',`world ${world} setup`);
  if(world===2)assert((await page.locator('#world-briefing').innerText()).includes('boosts'),'Mars advises staged boosts');
  if(world===5)assert((await page.locator('#world-briefing').innerText()).includes('Streamline'),'Titan advises streamlining');
 }
 await page.locator('[data-world="5"]').click();await page.locator('[data-kit="stager"]').click();
 const advertised=Number((await page.locator('[data-kit="stager"] b').innerText()).split(' ')[0]);await page.locator('#run-start').click();
 assert(Number(await page.locator('#credits').innerText())===advertised,'actual world-funded budget equals card');
 await page.locator('[data-build-slot="aero"]').first().click();await page.locator('[data-part="ceramic"]').click();
 await check('#workshop,#category-label,#comparison-label,#candidate-height,#part-fit,#shop-launch,.rocket-readiness','Titan build comparison');
 assert((await page.locator('#category-label').innerText()).includes('strong air drag'),'build reminder describes this world');
 // All old save generations retain their launch target and announce that their rules stay unchanged.
 for(const version of[0,1,2])for(const difficulty of[0,1,2,5]){
  await page.evaluate(async({version,difficulty})=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.maxDifficulty=difficulty;e.startExpedition(s,{seed:7,difficulty});s.active.conditionsVersion=version;delete s.active.program.conditionsVersion;localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));},{version,difficulty});await page.reload();
  const target=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
  assert(target.conditionsVersion===version,'old run version retained');
  await page.locator('#game-menu').click();await page.locator('#science-menu').click();assert((await page.locator('#science-gameplay').innerText()).includes('saved expedition keeps'),'guide explains legacy conditions');await check('#science-dialog,#science-close','legacy guide');await page.locator('#science-close').click();
 }
 // A flight that cannot reach the next milestone can finish its coast without waiting.
 const expected=await page.evaluate(async()=>{const e=await import('./expeditions.js'),b=await import('./builder.js'),s=e.newExpeditions();s.profile.maxDifficulty=8;e.startExpedition(s,{seed:1,difficulty:8});s.active.stage=5;const peak=b.estimateHeight(s.active.program,1.1);e.beginExpeditionFlight(s,1.1);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));return peak;});await page.reload();await page.locator('#run-resume').click();
 await page.locator('#speed').click();assert(await page.locator('#speed').getAttribute('aria-pressed')==='true','fast forward enabled');
 await page.waitForFunction(()=>!document.querySelector('#launch').disabled,null,{timeout:10000});
 await page.locator('#pause').click();await check('#launch,#speed,#pause,.launch-actions','coasting controls');await page.locator('#return').click();await page.locator('#launch').click();
 const settled=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(Math.abs(settled.active.lastResult.altitude-expected)<=Math.max(10,expected*.001),'skip matches the flight estimate within frame integration tolerance');assert(settled.active.strikes===1,'skip records the miss honestly');assert(settled.active.program.flights===1,'settles once');
 await check('#result,#result-description,#return','large target miss');
 await page.locator('#return').click();await page.locator('#shop-launch').click();await page.locator('#launch').click();assert(await page.locator('#speed').getAttribute('aria-pressed')==='true','fast forward kept for next flight');
 assert(!errors.length,JSON.stringify(errors));return {passed:'Nine world briefings, funded budgets, Titan parts, old saves, adaptive fast forward, accurate coast skip before a missed target, six layouts',errors};
}
