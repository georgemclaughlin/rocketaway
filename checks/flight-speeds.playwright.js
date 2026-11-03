// Isolated browser only: fixtures replace this session's save.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 const expected=await page.evaluate(async()=>{
  const e=await import('./expeditions.js'),p=await import('./parts.js'),b=await import('./builder.js');
  const s=e.newExpeditions();s.profile.maxDifficulty=1;e.startExpedition(s,{seed:1,difficulty:1});
  s.active.program.credits=10000;s.active.program.stock=['needle','jumbo','mammoth','orbitals'];
  for(const id of s.active.program.stock)p.fitPart(s.active.program,id);
  const peak=b.estimateHeight(s.active.program,1.2);e.beginExpeditionFlight(s,1.2);
  localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));return peak;
 });
 await page.reload();await page.locator('#run-resume').click();
 for(const speed of [3,8,25,100,1,3,8,25,100]){
  await page.locator('#speed').click();assert(await page.locator('#speed').innerText()===`Speed ×${speed}`,`cycle to ${speed}`);
 }
 await page.locator('#pause').click();
 const altitude=await page.locator('#altitude').innerText();await page.waitForTimeout(150);
 assert(await page.locator('#altitude').innerText()===altitude,'pause holds at 100x');
 for(const [width,height]of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  const bad=await page.locator('#speed,#pause,#launch').evaluateAll(els=>els.filter(e=>{
   if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();
   return r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||r.width<44||r.height<44||e.scrollWidth>e.clientWidth+2;
  }).map(e=>e.id));assert(!bad.length,`${width}×${height}: ${bad}`);
 }
 await page.locator('#return').click();
 await page.locator('#report').waitFor({state:'visible',timeout:30000});
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
 assert(result.program.flights===1,'one settlement');
 assert(Math.abs(result.lastResult.altitude-expected)<expected*.001,'100x actual flight matches predicted peak');
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'All five speeds, cycling, 100x pause/resume, six layouts, natural low-gravity apogee and accurate single settlement',errors};
}
