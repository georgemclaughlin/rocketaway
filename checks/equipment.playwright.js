// Isolated browser only: fixture equipment, then real previews, fitting and flights.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const seedBuild=async(ids=[],world=0)=>{
  await page.evaluate(async({ids,world})=>{
   const r=await import('./prototype-run.js'),p=await import('./parts.js');
   const s=r.newExpeditions();s.profile.maxDifficulty=world;s.profile.totalGates=6;s.progressImportVersion=1;
   r.startPrototype(s,{seed:42,difficulty:world});s.active.program.credits=10000;s.active.program.stock=p.catalogFor(s.active.program).map(p=>p.id);
   for(const id of ids)p.fitPart(s.active.program,id);
   localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
  },{ids,world});await page.reload();
 };
 await seedBuild(['needle','long','ember']);
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 for(const [width,height] of sizes) {
  await page.setViewportSize({width,height});
  for(const [slot,id,phrase] of [['engine','momentum-engine','Short burn'],['tank','drop-tank','Sheds'],['boosters','return-boosters','Recover +90']]) {
   await page.locator(`button[data-build-slot="${slot}"]`).click();
   await page.locator(`[data-part="${id}"]`).click();
   assert((await page.locator('#candidate-description').innerText()).includes(phrase),`ability preview ${id}`);
   const issues=await page.locator('#workshop,.part-picker,#candidate-description,#part-fit,#shop-launch').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id||e.className));
   assert(!issues.length,JSON.stringify({width,height,id,issues}));
   await page.locator('#part-info').click();
   const description=await page.locator('#part-info-description').innerText();assert(description.includes(id==='momentum-engine'?'190%':id==='drop-tank'?'0.20t':'No recovery pay'),'full tradeoff in Info');
   await page.locator('#part-info-close').click();
  }
  await page.screenshot({path:`/tmp/rocketaway-equipment-builder-${width}.png`});
 }
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 assert(before.parts.equipped.boosters==='bare','previews never fit');
 await page.locator('#part-fit').click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 assert(after.parts.equipped.boosters==='return-boosters'&&after.credits===before.credits-180,'explicit Buy & fit');
 await seedBuild(['needle','momentum-engine','drop-tank','return-boosters'],1);
 const expected=await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),b=await import('./builder.js');const s=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'));
  r.beginFlight(s,1.17);localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));return b.estimateHeight(s.active.program,1.17);
 });await page.reload();await page.setViewportSize({width:390,height:844});
 await page.locator('#run-resume').click();await page.locator('#ability-flight').waitFor({state:'visible'});
 assert((await page.locator('#ability-flight').innerText()).includes('MOMENTUM'),'ramp feedback visible before any staging event');
 for(const [width,height] of sizes) {
  await page.setViewportSize({width,height});
  const bounds=await page.locator('#ability-flight').boundingBox();
  const canvas=await page.locator('#game').boundingBox();
  assert(bounds.x+bounds.width<canvas.x+canvas.width*.48,'ability feedback stays left of the rocket');
  assert(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1,'ramp label fits viewport');
  await page.screenshot({path:`/tmp/rocketaway-equipment-flight-${width}.png`});
 }
 await page.locator('#speed').click();await page.locator('#pause').click();
 const altitude=await page.locator('#altitude').innerText();await page.waitForTimeout(120);assert(await page.locator('#altitude').innerText()===altitude,'pause freezes accelerated flight');
 await page.locator('#return').click();
 await page.locator('#report').waitFor({state:'visible',timeout:12000});
 const done=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(Math.abs(done.active.lastResult.altitude-expected)<2,'resumed new abilities equal preview');
 assert(done.active.lastResult.recoveryPay===90,'recovery paid on actual successful flight');
 assert(done.active.lastResult.events.includes('Empty tank released')&&done.active.lastResult.events.includes('Momentum engine · full thrust'),'new effects occurred');
 assert((await page.locator('#bonus-note').innerText()).includes('Recovery +90'),'distinct recovery earnings');
 for(const [width,height] of sizes) {
  await page.setViewportSize({width,height});
  const issues=await page.locator('#result,#return,#bonus-note,#result-stock').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id));
  assert(!issues.length,JSON.stringify({width,height,issues}));
  await page.screenshot({path:`/tmp/rocketaway-equipment-report-${width}.png`});
 }
 await page.reload();const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(reloaded.active.program.credits===done.active.program.credits,'no duplicate recovery after reload');
 assert(reloaded.active.lastResult.recoveryPay===90,'recovery report retained');
 assert(JSON.stringify(reloaded.active.lastResult.events)===JSON.stringify(done.active.lastResult.events),'effect history retained');
 // All three bonus types can share a report without losing the main actions.
 await seedBuild(['survey-capsule','momentum-engine','drop-tank','return-boosters']);
 await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),s=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'));
  r.chooseContract(s,'earth-science');r.beginFlight(s,1.17);localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
 });await page.reload();await page.locator('#run-resume').click();await page.locator('#speed').click();
 await page.locator('#report').waitFor({state:'visible',timeout:12000});
 const bonus=await page.locator('#bonus-note').innerText();assert(bonus.includes('Contract +')&&bonus.includes('Survey +')&&bonus.includes('Recovery +90'),'three bonus sources are distinct');
 for(const [width,height] of sizes) {
  await page.setViewportSize({width,height});
  assert(await page.locator('#result').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&e.scrollHeight<=e.clientHeight+1;}),'combined bonus report fits');
  await page.screenshot({path:`/tmp/rocketaway-equipment-bonuses-${width}.png`});
 }
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'Three new part previews and fitting, six layouts, visible ramp, accelerated pause/resume, actual combination flight, distinct recovery pay, once-only rewards',errors};
}
