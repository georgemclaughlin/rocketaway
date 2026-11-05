// Isolated test browser only. Fixtures exercise warnings, reports and saved funding.
async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);},errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),p=await import('./parts.js');const s=r.newExpeditions();
  r.startPrototype(s,{seed:42});s.active.program.credits=10000;s.active.program.stock=p.catalogFor(s.active.program).map(p=>p.id);
  for(const id of ['feather-shell','endurance-engine','composite'])p.fitPart(s.active.program,id);
  localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
 });await page.reload();
 for(const[width,height]of sizes){
  await page.setViewportSize({width,height});await page.locator('button[data-build-slot="tank"]').click();await page.locator('[data-part="jumbo"]').click();
  assert((await page.locator('#candidate-description').innerText()).includes('Disables Feather shell'),'heavy tank explains lost combination');
  const bad=await page.locator('#candidate-description,#part-fit,#shop-launch').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollHeight>e.clientHeight+1;}).map(e=>e.id));
  assert(!bad.length,JSON.stringify({width,height,bad}));
  await page.screenshot({path:`/tmp/rocketaway-combination-${width}.png`});
  await page.locator('#part-info').click();assert((await page.locator('#part-info-effects').innerText()).includes('needs launch mass'),'Info explains the full combination');await page.locator('#part-info-close').click();
 }
 // A completed Moon reserves funding, but Mars starts with its normal budget.
 await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),e=await import('./expeditions.js');const s=r.newExpeditions();s.profile.maxDifficulty=1;s.profile.totalGates=6;
  r.startPrototype(s,{seed:42,difficulty:1});r.beginFlight(s,1.1);r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.1,payMultiplier:1,time:30,burn:10,coastTime:20});
  localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
 });await page.reload();
 for(const[width,height]of sizes){
  await page.setViewportSize({width,height});
  assert((await page.locator('#expedition-footer').innerText()).includes('first flight'),'funding timing explained before starting');
  assert(await page.locator('#expedition').evaluate(e=>e.scrollHeight<=e.clientHeight+2),'funded setup fits');
 }
 await page.locator('#run-start').click();
 const base=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
 assert(base.program.credits===260&&base.pendingFunding===200,'contribution does not inflate opening purchases');
 const armed=await page.evaluate(()=>{document.querySelector('#timing-quality').textContent='120%';document.querySelector('#shop-launch').click();return document.querySelector('#timing-quality').textContent;});
 assert(armed==='90%','arming resets the previous launch reading synchronously');
 await page.waitForFunction(()=>{const n=parseInt(document.querySelector('#timing-quality').textContent);if(n>=109&&n<=111){document.querySelector('#launch').click();return true;}return false;});
 await page.locator('#speed').click();await page.locator('#report').waitFor({state:'visible',timeout:15000});
 assert((await page.locator('#bonus-note').innerText()).includes('Saved funding +200'),'funding is separately paid in first report');
 const settled=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
 assert(settled.lastResult.power>=109&&settled.lastResult.power<=111,'displayed timing agrees with actual ignition');
 assert(settled.pendingFunding===0,'funding consumed');
 for(const[width,height]of sizes){
  await page.setViewportSize({width,height});await page.locator('#flight-log-open').click();
  assert((await page.locator('#flight-log-earnings').innerText()).includes('Saved funding +200'),'log explains earnings');
  const close=await page.locator('#flight-log-close').boundingBox();assert(close.width>=44&&close.height>=44&&close.y>=0&&close.y+close.height<=height,'log exit visible and tappable');
  await page.screenshot({path:`/tmp/rocketaway-flight-log-${width}.png`});await page.locator('#flight-log-close').click();
 }
 await page.reload();
 const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
 assert(reloaded.program.credits===settled.program.credits&&reloaded.pendingFunding===0,'reload never repeats funding');
 await page.locator('#game-menu').click();await page.locator('#flight-log-menu').click();assert(await page.locator('#flight-log-dialog').isVisible(),'last flight remains available after reload');await page.locator('#flight-log-close').click();
 assert(!errors.length,JSON.stringify(errors));return {passed:'Six-size combination warnings and flight logs, funded setup, real first flight, distinct earnings, reload and menu recovery',errors};
}
