// Isolated browser only. Fixtures establish collection states, then exercise UI.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),e=await import('./expeditions.js'),p=await import('./parts.js');
  const s=r.newExpeditions();s.progressImportVersion=1;s.profile.totalGates=6;
  r.startPrototype(s,{seed:2});s.active.program.credits=5000;s.active.program.stock=p.catalogFor(s.active.program).map(p=>p.id);
  p.fitPart(s.active.program,'twins');p.fitPart(s.active.program,'needle');r.chooseContract(s,'world-0-staged');r.beginFlight(s,1.17);
  r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.17,payMultiplier:1});
  r.arrivePrototype(s);r.beginFlight(s,1.17);r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.17,payMultiplier:1});
  r.startPrototype(s,{seed:2});
  localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
 });await page.reload();
 await page.locator('#contracts-open').click();
 assert(await page.locator('.contract-card').count()===2,'two offers keep the goal panel focused');
 assert(await page.locator('[data-contract="world-0-staged"]').count()===1,'new staging mission is visible');
 assert(await page.locator('[data-contract="world-0-pointed"]').count()===1,'new fairing mission is visible');
 await page.locator('[data-contract="world-0-pointed"]').click();
 assert((await page.locator('#contract-selection').innerText())==='Sky arrow','chosen mission is visible in the hangar');
 await page.reload();
 assert((await page.locator('#contract-selection').innerText())==='Sky arrow','mission selection survives reload');
 const rocketBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 await page.locator('#game-menu').click();await page.locator('#records-menu').click();
 assert((await page.locator('.journal-total').innerText())==='1 / 36 mission stamps · 2 / 27 kit badges','permanent collection counts');
 assert(await page.locator('.journal-missions li[data-earned="true"]').count()===1,'completed mission marked');
 assert((await page.locator('.journal-rocket').innerText()).includes('Fresh start · 1 launch'),'world-local winning rocket');
 for(const [width,height] of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]) {
  await page.setViewportSize({width,height});
  await page.locator('#journal-world').selectOption('0');
  await page.locator('.journal-rocket summary').click();
  assert((await page.locator('.journal-rocket').innerText()).includes('Twin kickers'),'winning parts are readable');
  assert((await page.locator('.journal-rocket').innerText()).includes('Needle fairing'),'winning nose retained');
  await page.locator('.journal-rocket').scrollIntoViewIfNeeded();
  const bad=await page.locator('#records-dialog').evaluate(e=>{
   const r=e.getBoundingClientRect(),close=document.querySelector('#records-close'),c=close.getBoundingClientRect();
   return {overflow:e.scrollWidth>e.clientWidth+1,outside:r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1,
    close:c.width<44||c.height<44||c.top<0||c.bottom>innerHeight||!close.contains(document.elementFromPoint(c.x+c.width/2,c.y+c.height/2))};
  });assert(!Object.values(bad).some(Boolean),JSON.stringify({width,height,bad}));
  await page.screenshot({path:`/tmp/rocketaway-journal-${width}x${height}.png`});
  await page.locator('#journal-world').selectOption('1');
  assert((await page.locator('.journal-rocket summary').innerText()).includes('Arrived from Earth · 1 launch'),'carried record is separate');
  await page.locator('#journal-world').selectOption('8');
  assert(await page.locator('.journal-empty').count()===1,'no fabricated historical rocket');
  assert(await page.locator('.journal-missions li').count()===4,'four collection missions per world');
 }
 await page.locator('#records-close').click();
 const rocketAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 assert(JSON.stringify(rocketAfter)===JSON.stringify(rocketBefore),'journal does not fit parts or spend credits');
 // New mission ignition resumes with the same target and settles a real flight once.
 await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),p=await import('./parts.js');
  const s=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1'));
  s.active.program.credits=5000;s.active.program.stock=p.catalogFor(s.active.program).map(p=>p.id);
  for(const id of ['needle','composite','dart'])p.fitPart(s.active.program,id);
  r.beginFlight(s,1.17);localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
 });await page.reload();
 await page.locator('#run-resume').click();await page.locator('#speed').click();await page.locator('#report').waitFor({state:'visible'});
 const settled=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(settled.active.lastResult.contract==='Sky arrow','real resumed flight completed the new mission');
 assert(settled.profile.missionJournal.missions.includes('world-0-pointed'),'new stamp saved');
 await page.reload();
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(restored.active.program.credits===settled.active.program.credits,'reload cannot repay the mission');
 assert(JSON.stringify(restored.profile.missionJournal)===JSON.stringify(settled.profile.missionJournal),'journal survives reload exactly');
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'New mission selection, permanent stamps, kit badges, winning builds, six journal layouts, read-only browsing, resumed real mission flight, one-time rewards',errors};
}
