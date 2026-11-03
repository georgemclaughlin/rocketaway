// Run in an isolated Playwright CLI session; fixtures replace only that browser's saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 const seed=async quality=>{await page.evaluate(async quality=>{const e=await import('./expeditions.js'),s=e.newExpeditions();e.startExpedition(s,{seed:1});e.beginExpeditionFlight(s,quality);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));},quality);await page.reload();await page.locator('#run-resume').click();};
 for(const [quality,label]of [[.9,'Off target'],[1.04,'Good'],[1.14,'Great'],[1.2,'Perfect']]){
  await seed(quality);
  assert(await page.locator('#launch-rating').innerText()===`${label} · ${Math.round(quality*100)}%`,'rating from actual saved launch');
  await page.locator('#pause').click();
  for(const [width,height]of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
   await page.setViewportSize({width,height});
   const layout=await page.evaluate(()=>{const badge=document.querySelector('#launch-rating'),r=badge.getBoundingClientRect(),c=document.querySelector('#game').getBoundingClientRect();return{clearance:c.left+c.width*.56-37*.95-r.right,fit:r.left>=0&&r.bottom<=innerHeight&&badge.scrollWidth<=badge.clientWidth&&badge.scrollHeight<=badge.clientHeight};});
   assert(layout.fit&&layout.clearance>=4,JSON.stringify({quality,width,height,layout}));
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#return').click();await page.locator('#speed').click();await page.waitForTimeout(200);
  assert((await page.locator('#launch-rating').innerText()).startsWith(label),'rating survives speed and pause');
 }
 await page.setViewportSize({width:320,height:568});
 await page.waitForFunction(()=>document.querySelector('#launch').textContent.includes('See result'),null,{timeout:30000});await page.locator('#launch').click();
 assert((await page.locator('#bonus-note').innerText()).includes('Perfect launch · 120% power'),'result repeats rating');
 for(const [width,height]of [[320,568],[390,844],[667,375]]){
  await page.setViewportSize({width,height});assert(await page.locator('#result').evaluate(e=>e.scrollHeight<=e.clientHeight+2&&e.getBoundingClientRect().bottom<=innerHeight),'result fits');
 }
 await page.locator('#return').click();await page.locator('#shop-launch').click();assert(await page.locator('#launch-rating').isHidden(),'previous launch badge cleared during new timing');
 await page.locator('#launch').click();
 const actual=await page.evaluate(async()=>{const {launchRating}=await import('./launch-feedback.js'),s=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'));return launchRating(s.active.launchQuality);});
 assert(await page.locator('#launch-rating').innerText()===`${actual.label} · ${actual.power}%`,'live timing click uses actual outcome');
 assert(!errors.length,JSON.stringify(errors));return {passed:'Four ratings, resumed and live launches, six layouts clear of rocket, pause/speed persistence, results, next-launch reset',errors};
}
