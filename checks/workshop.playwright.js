// Run in a new isolated session at workshop.html. Never uses campaign saves.
async page => {
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>localStorage.removeItem('rocket-away-workshop-v1'));await page.reload();
 const campaigns=await page.evaluate(()=>[localStorage.getItem('rocket-away-program-v1'),localStorage.getItem('rocket-away-expeditions-v1')]);
 for(const [width,height] of [[320,568],[375,667],[390,844],[390,720],[390,740],[414,736],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  const bounds=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,button:document.getElementById('arm').getBoundingClientRect().bottom}));
  assert(bounds.w<=width&&bounds.h<=height&&bounds.button<=height,`hangar fits ${width}x${height}: ${JSON.stringify(bounds)}`);
  await page.screenshot({path:`/tmp/rocketaway-workshop-${width}x${height}.png`});
 }
 await page.setViewportSize({width:390,height:720});
 await page.locator('[data-part="reserve-tank"]').click();assert((await page.locator('#state-label').innerText()).includes('PREVIEW'),'part selection previews');
 await page.reload();assert((await page.locator('[data-part="long"]').getAttribute('aria-pressed'))==='true','reload discards preview');
 await page.locator('[data-part="reserve-tank"]').click();await page.locator('#fit').click();
 await page.locator('#arm').click();await page.locator('#ignite').click();await page.locator('#pause').click();
 const altitude=await page.locator('#altitude').innerText();await page.waitForTimeout(150);assert(await page.locator('#altitude').innerText()===altitude,'pause stops flight');
 await page.reload();assert(await page.locator('#result').isVisible(),'reload resumes ignition');
 await page.locator('#pause').click();
 for(const [width,height] of [[320,568],[375,667],[390,844],[390,720],[390,740],[414,736],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'flight fits');
 }
 await page.locator('#result').click();assert(await page.locator('#report').isVisible(),'actual flight reports');
 for(const [width,height] of [[320,568],[375,667],[390,844],[390,720],[390,740],[414,736],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'report fits');
 }
 await page.screenshot({path:'/tmp/rocketaway-workshop-report.png'});
 await page.locator('#continue').click();
 // Earn a complete journey; choose affordable builds using the same public domain model.
 for(let turn=0;turn<12;turn++){
  const pick=await page.evaluate(async()=>{const m=await import('./workshop-model.js?v=workshop-art-4');const s=JSON.parse(localStorage.getItem('rocket-away-workshop-v1'));if(s.cleared[1]===6)return null;let best;for(const engine of m.BENCH.engine)for(const tank of m.BENCH.tank)for(const boosters of m.BENCH.boosters){const build={aero:'lab',engine,tank,boosters};if(m.cost(build)<=s.budget){const peak=m.measured(build,s.world,.9).peak;if(!best||peak>best.peak)best={build,peak};}}return best.build;});
  if(!pick)break;
  for(const slot of ['engine','tank','boosters']){await page.locator(`[data-slot="${slot}"]`).click();await page.locator(`[data-part="${pick[slot]}"]`).click();}
  if(await page.locator('#fit').isEnabled())await page.locator('#fit').click();
  await page.locator('#arm').click();await page.locator('#ignite').click();await page.locator('#result').click();await page.locator('#continue').click();
 }
 assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-workshop-v1')).cleared[1]===6),'earned full workshop completes');
 const after=await page.evaluate(()=>[localStorage.getItem('rocket-away-program-v1'),localStorage.getItem('rocket-away-expeditions-v1')]);assert(JSON.stringify(campaigns)===JSON.stringify(after),'campaign saves unchanged');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();assert(await page.locator('#arm').isVisible(),'reduced motion and saved completion');
 assert(errors.length===0,errors.join('\n'));return 'Workshop: nine layouts, preview/fit, pause, interrupted flight, earned journey, save isolation passed';
}
