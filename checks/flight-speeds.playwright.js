// Isolated browser only: fixtures replace this session's save.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[],timings=[];page.on('pageerror',e=>errors.push(e.message));
 for(const world of[0,1,3]){
  await page.setViewportSize({width:390,height:844});
  const expected=await page.evaluate(async world=>{
   const e=await import('./expeditions.js'),p=await import('./parts.js'),b=await import('./builder.js');
   const s=e.newExpeditions();s.profile.maxDifficulty=world;e.startExpedition(s,{seed:1,difficulty:world});
   s.active.program.credits=10000;s.active.program.stock=['needle','jumbo','mammoth','orbitals'];
   for(const id of s.active.program.stock)p.fitPart(s.active.program,id);
   const peak=b.estimateHeight(s.active.program,1.2);e.beginExpeditionFlight(s,1.2);
   localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));return peak;
  },world);
  await page.reload();await page.locator('#run-resume').click();
  assert(await page.locator('#speed').getAttribute('aria-pressed')==='false','normal speed initially');
  await page.locator('#speed').click();assert(await page.locator('#speed').getAttribute('aria-pressed')==='true','fast forward on');
  await page.locator('#speed').click();assert(await page.locator('#speed').getAttribute('aria-pressed')==='false','second tap returns to normal');
  await page.locator('#speed').click();await page.locator('#pause').click();
  const altitude=await page.locator('#altitude').innerText();await page.waitForTimeout(150);
  assert(await page.locator('#altitude').innerText()===altitude,'pause holds fast forward');
  if(world===0)for(const [width,height]of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
   await page.setViewportSize({width,height});
   const bad=await page.locator('#speed,#pause,#launch').evaluateAll(els=>els.filter(e=>{
    if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();
    return r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||r.width<44||r.height<44||e.scrollWidth>e.clientWidth+2;
   }).map(e=>e.id));assert(!bad.length,`${width}×${height}: ${bad}`);
  }
  await page.setViewportSize({width:390,height:844});
  const start=Date.now();await page.locator('#return').click();
  await page.locator('#report').waitFor({state:'visible',timeout:10000});
  const elapsed=(Date.now()-start)/1000;timings.push({world,seconds:elapsed});
  assert(elapsed>=5&&elapsed<8,`world ${world} should take about six seconds: ${elapsed}`);
  const result=await page.evaluate(()=>(saved=>saved.originalCampaign||saved)(JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'))).active);
  assert(result.program.flights===1,'one settlement');
  assert(Math.abs(result.lastResult.altitude-expected)<expected*.003,'fast-forward outcome matches predicted peak within frame integration tolerance');
 }
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'One toggle, normal-speed return, pause/resume, six layouts, consistent Earth/Moon/Ceres time to result and accurate single settlement',timings,errors};
}
