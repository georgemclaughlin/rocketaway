// Run only on port 4174 in a uniquely named isolated browser session.
async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);},errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 assert(page.url().includes(':4174/'),'prototype origin required');
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 const fits=async(selector,label)=>{
  for(const[width,height]of sizes){await page.setViewportSize({width,height});const bad=await page.locator(selector).evaluateAll(es=>es.filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id||e.className));assert(!bad.length,JSON.stringify({label,width,height,bad}));}
 };
 await page.evaluate(()=>{localStorage.removeItem('rocket-away-program-v1');localStorage.removeItem('rocket-away-expeditions-v1');});await page.reload();
 assert((await page.locator('#expedition-step').innerText()).includes('ROAD TO TAU CETI'),'roguelite journey identity');
 assert(await page.locator('[data-world]').count()===9,'full world route offered');
 await fits('#expedition,#run-start,.kit-card','start');
 await page.locator('#run-start').click();await page.locator('button[data-build-slot="aero"]').click();
 await page.locator('[data-experimental="true"]').first().click();
 assert(await page.locator('#part-fit').isEnabled(),'opening special offer is affordable');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 await page.locator('#part-info').click();await page.locator('#reserve-part').click();await page.locator('#part-info-close').click();
 const reserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(reserved.active.reservedOffer&&reserved.active.program.credits===before.active.program.credits,'reservation is free');
 await page.reload();await page.locator('button[data-build-slot="aero"]').click();await page.locator(`[data-part="${reserved.active.reservedOffer}"]`).click();await page.locator('#part-info').click();assert((await page.locator('#reserve-part').innerText()).includes('Reserved'),'reservation survives reload');await fits('#part-dialog,#reserve-part,#part-info-close','reservation details');await page.locator('#part-info-close').click();
 await fits('#workshop,.part-picker,#candidate-description,#part-fit,#shop-launch,.assembly-stage,#contracts-open','opening offer');
 await page.locator('#contracts-open').click();await fits('#contracts-dialog,.contract-card,#contracts-close,#contract-none','contracts');
 const selectedName=await page.locator('.contract-card strong').first().innerText();await page.locator('.contract-card').first().click();assert(!(await page.locator('#contracts-dialog').isVisible()),'selection returns to build');
 assert((await page.locator('#contracts-open').innerText()).includes(selectedName),'selected goal is visible');
 // Inspect every experimental ability with a saved, isolated build fixture.
 await page.evaluate(async()=>{const r=await import('./prototype-run.js'),p=await import('./parts.js'),x=await import('./experimental.js');const s=r.newExpeditions();s.profile.totalGates=6;s.profile.maxDifficulty=1;r.startPrototype(s,{seed:42});s.active.program.credits=10000;s.active.program.stock=[...p.PARTS,...x.EXPERIMENTAL_PARTS].map(p=>p.id);localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));});await page.reload();
 for(const slot of ['aero','tank','engine']){
  await page.locator(`button[data-build-slot="${slot}"]`).click();
  const ids=await page.locator('[data-part]').evaluateAll(es=>es.map(e=>e.dataset.part));
  for(const id of ids){await page.locator(`[data-part="${id}"]`).click();await fits('#workshop,.part-picker,#part-fit,#shop-launch,#candidate-description,#contracts-open',id);}
 }
 // An interrupted ability flight reproduces its outcome, and no reward repeats.
 const expected=await page.evaluate(async()=>{const r=await import('./prototype-run.js'),p=await import('./parts.js'),b=await import('./builder.js');const s=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'));for(const id of ['reserve-tank','separation-engine','orbitals'])p.fitPart(s.active.program,id);r.beginFlight(s,1.1);localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));return b.estimateHeight(s.active.program);});await page.reload();
 await page.locator('#run-resume').click();await page.locator('#speed').click();await page.locator('#pause').click();const altitude=await page.locator('#altitude').innerText();await page.waitForTimeout(100);assert(await page.locator('#altitude').innerText()===altitude,'pause stops flight');await page.locator('#return').click();
 await page.locator('#report').waitFor({state:'visible',timeout:10000});
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(Math.abs(result.active.lastResult.altitude-expected)<2,'real flight equals preview');
 assert(result.active.lastResult.events.includes('Reserve fuel released'),'ability was triggered');
 assert((await page.locator('#result-stock').innerText()).includes('Reserve fuel released'),'ability summary is visible');
 await fits('#result,#return,#bonus-note,#result-stock','ability report');
 await page.reload();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));assert(after.active.program.credits===result.active.program.credits,'reload cannot repay');
 // Saved departure is a durable handoff, including skip/reduced motion.
 const depart=await page.evaluate(async()=>{const r=await import('./prototype-run.js'),e=await import('./expeditions.js');const s=r.newExpeditions();r.startPrototype(s,{seed:42});s.active.strikes=1;r.beginFlight(s,1.1);r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.1,payMultiplier:1,events:[]});localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));return {credits:s.active.program.credits,parts:s.active.program.parts};});await page.reload();
 await fits('#expedition,#run-travel','saved departure');await page.locator('#run-travel').click();await page.locator('#travel-skip').click();await page.locator('#shop-launch').waitFor({state:'visible'});
 const arrived=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));assert(arrived.active.difficulty===1&&arrived.active.strikes===1,'Moon and shared miss budget');assert(arrived.active.program.credits===depart.credits,'no arrival grant');assert(JSON.stringify(arrived.active.program.parts)===JSON.stringify(depart.parts),'rocket carried');
 await page.reload();assert(await page.locator('#shop-launch').isVisible(),'arrival resumes in hangar');
 // Future saves remain byte-for-byte intact and export is available.
 const future=await page.evaluate(()=>{const text=JSON.stringify({prototypeVersion:99,version:2,profile:{valuable:true}});localStorage.setItem('rocket-away-expeditions-v1',text);return text;});await page.reload();
 assert(await page.locator('#save-export').isVisible(),'recovery export visible');assert(await page.evaluate(()=>localStorage.getItem('rocket-away-expeditions-v1'))===future,'unsupported save is preserved');
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'Six viewport sizes, all experimental previews, reservation, contracts, resumed ability flight, pause, deterministic outcome, reward integrity, saved travel, future-save protection',errors};
}
