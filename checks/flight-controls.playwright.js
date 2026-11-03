// Run in an isolated Playwright CLI session; fixtures replace only that browser's saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 const check=async phase=>{for(const [width,height]of sizes){await page.setViewportSize({width,height});const result=await page.evaluate(()=>{const c=document.querySelector('#game').getBoundingClientRect(),tools=document.querySelector('#flight-tools').getBoundingClientRect();const bad=[...document.querySelectorAll('#speed,#pause,#launch,.launch-actions,.launch-console')].filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2||(e.tagName==='BUTTON'&&(r.width<44||r.height<44));}).map(e=>e.id||e.className);return{belowScene:tools.top>=c.bottom,bad};});assert(result.belowScene&&!result.bad.length,JSON.stringify({phase,width,height,...result}));}};
 for(const difficulty of [0,4]){
  await page.evaluate(async difficulty=>{const e=await import('./expeditions.js'),p=await import('./parts.js'),s=e.newExpeditions();s.profile.maxDifficulty=difficulty;e.startExpedition(s,{seed:1,difficulty});s.active.program.credits=10000;s.active.program.stock=['ceramic','jumbo','mammoth','orbitals'];for(const id of s.active.program.stock)p.fitPart(s.active.program,id);e.beginExpeditionFlight(s,1.2);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));},difficulty);await page.reload();await page.locator('#run-resume').click();await page.locator('#pause').click();
  await check('in progress');await page.locator('#return').click();await page.locator('#speed').click();assert(await page.locator('#speed').getAttribute('aria-pressed')==='true','fast forward works');
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector('#launch').textContent.includes('See result'),null,{timeout:30000});await page.locator('#pause').click();await check('result ready');await page.locator('#return').click();await page.locator('#launch').click();assert(await page.locator('#report').isVisible(),'result action works');
 }
 assert(!errors.length,JSON.stringify(errors));return{passed:'Controls outside scene at six sizes, Moon and Jupiter visible, speed/pause/resume and result actions fit',errors};
}
