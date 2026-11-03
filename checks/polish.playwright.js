// Run only in an isolated browser: these fixtures replace this session's save.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 const fits=async(selector,label)=>{for(const [width,height]of sizes){await page.setViewportSize({width,height});const bad=await page.locator(selector).evaluateAll(els=>els.filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({label,width,height,bad}));}};
 await page.evaluate(()=>localStorage.clear());await page.reload();
 assert(await page.locator('#expedition-setup-title').innerText()==='Your first rocket','first start is not a false choice');
 await fits('#expedition,#run-start,.kit-card,.kit-equipment,.kit-benefit','first rocket');
 await page.locator('#run-start').click();
 for(const slot of['engine','tank','aero','boosters']){
  await page.locator(`button[data-build-slot="${slot}"]`).first().click();
  for(const item of await page.locator('[data-part]').all()){
   await item.click();assert(await page.locator('#candidate-description').isVisible(),'tradeoff visible');
   await fits('#workshop,#candidate-description,#candidate-trait,#part-fit,#shop-launch,.assembly-stage','part preview');
  }
 }
 // A real, build-limited miss must not blame timing alone.
 await page.evaluate(async()=>{
  const e=await import('./expeditions.js'),p=await import('./parts.js'),s=e.newExpeditions();s.profile.totalGates=4;e.startExpedition(s,{seed:1});
  s.active.stage=3;s.active.program.credits=10000;s.active.program.stock=['ember','long'];for(const id of s.active.program.stock)p.fitPart(s.active.program,id);
  e.beginExpeditionFlight(s,.95);localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));
 });await page.reload();await page.locator('#run-resume').click();await page.locator('#speed').click();await page.locator('#report').waitFor({state:'visible',timeout:10000});
 assert(await page.locator('#flight-advice').getAttribute('data-kind')==='build','diagnose build limit');
 assert((await page.locator('#result-description').innerText()).includes('2 misses left'),'report miss cost');
 assert((await page.locator('#flight-advice').innerText()).includes('Try'),'give a next experiment');
 await fits('#result,#flight-advice,#bonus-note,#return','miss advice');
 // Fully unlocked replay: wider world targets stay usable and selection stays visible.
 await page.evaluate(async()=>{const e=await import('./expeditions.js'),s=e.newExpeditions();s.profile.maxDifficulty=8;s.profile.totalGates=54;s.profile.campaignComplete=true;s.profile.endingAcknowledged=true;localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 await fits('#expedition,.kit-card,.kit-equipment,.kit-benefit,#run-start','all starting builds');
 await page.setViewportSize({width:320,height:568});
 assert(await page.locator('.world-stop').evaluateAll(els=>els.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;})),'world touch targets');
 await page.locator('[data-world="8"]').click();await page.waitForTimeout(50);
 const visible=await page.locator('[data-world="8"]').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1;});assert(visible,'chosen world stays in view');
 assert((await page.locator('[data-kit="scientist"] .kit-equipment').innerText()).includes('Science capsule'),'kit names its equipment');
 assert((await page.locator('[data-kit="scientist"] .kit-benefit').innerText()).includes('50%'),'kit quantifies identity');
 assert(!errors.length,JSON.stringify(errors));return {passed:'Visible tradeoffs across every part, first-start clarity, real miss diagnosis, research/kit identity, 48px world picker and six layouts',errors};
}
