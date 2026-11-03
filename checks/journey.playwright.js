// Run with Playwright CLI in a fresh, isolated browser session.
// Test fixtures replace saves only in that test browser. No application secrets or services.
async page => {
const checkLayout = async page => {
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);};const fixtures=await page.evaluate(async()=>{
  const e=await import('./expeditions.js');const fresh=e.newExpeditions(),won=e.newExpeditions();e.startExpedition(won,{seed:12345});e.beginExpeditionFlight(won,1.1);e.settleExpedition(won,{done:true,peak:175000,quality:1.1,payMultiplier:1});
  const lost=e.newExpeditions();e.startExpedition(lost,{seed:22});e.abandonExpedition(lost);return{fresh,won,lost};
 });
 for(const [name,state]of Object.entries(fixtures))for(const [width,height]of[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});await page.evaluate(s=>localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s)),state);await page.reload();
  assert(await page.locator('#run-start').isVisible(),`${name} start available`);
  const bad=await page.evaluate(()=>[...document.querySelectorAll('.expedition-card,#expedition,#expedition-footer,#run-start,.world-route,#expedition-title')].filter(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight+1||r.right>innerWidth+1||el.scrollHeight>el.clientHeight+2}).map(el=>el.id||el.className));assert(!bad.length,JSON.stringify({name,width,height,bad}));
  if(name==='won')assert((await page.locator('#expedition-title').innerText()).includes('Moon'),'next goal');
 }
 await page.evaluate(s=>localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s)),fixtures.won);await page.reload();await page.locator('[data-world="0"]').click();await page.locator('[data-kit=scientist]').click();assert(await page.locator('[data-world="0"]').getAttribute('aria-pressed')==='true','goal preserved');await page.locator('#run-start').click();assert(await page.locator('#shop-launch').isVisible(),'starts in hangar');const selected=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));assert(selected.active.kit==='scientist'&&selected.active.difficulty===0&&selected.active.program.credits===100&&selected.profile.wins===1,'chosen build, credits, goal and unlocks');
 await page.locator('#game-menu').click();await page.locator('#reset-all').click();await page.locator('#reset-confirm').click();
 assert(await page.locator('[data-kit]').count()===1,'reset restores first starting rocket');
 await page.locator('#run-start').click();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));assert(state.active.kit==='scrapper'&&state.active.difficulty===0,'reset clears setup selection');
 return {passed:'fresh, won, lost setups at six sizes; replay Earth; preserve chosen kit; reset worlds'};
};
const checkFlights = async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(v,m)=>{if(!v)throw Error(m);};
 const seedFixture=async difficulty=>{
  await page.evaluate(async difficulty=>{
   const e=await import('./expeditions.js'),p=await import('./parts.js');const s=e.newExpeditions();
   s.profile.maxDifficulty=difficulty;s.profile.totalGates=6*difficulty;
   e.startExpedition(s,{seed:8*1640531527,difficulty});const program=s.active.program;
   program.credits=10000;program.stock=['ceramic','jumbo','mammoth','orbitals'];
   for(const id of program.stock)p.fitPart(program,id);
   e.beginExpeditionFlight(s,1.2);
   localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));
  },difficulty);
  await page.reload();
 };
 await page.setViewportSize({width:390,height:844});
 for(const [difficulty,method] of [[0,'auto'],[8,'skip']]){
  await seedFixture(difficulty);await page.locator('#run-resume').click();await page.locator('#speed').click();
  await page.waitForFunction(()=>document.querySelector('#launch').textContent.includes('See result'),{timeout:30000});
  await page.locator('#launch').click();
  assert((await page.locator('#return').innerText()).includes(difficulty===0?'Moon':'Tau Ceti'),'travel CTA');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
  assert(before.active.status==='won','real flight wins');
  await page.locator('#return').click();
  assert(await page.locator('#travel-dialog').isVisible(),'travel opens');
  assert((await page.locator('#travel-title').innerText()).includes(difficulty===0?'Moon':'Tau Ceti'),'correct destination');
  
  if(method==='skip')await page.locator('#travel-skip').click();
  await page.locator('#run-start').waitFor({state:'visible',timeout:6000});
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
  assert(after.profile.wins===before.profile.wins,'travel does not pay twice');
  assert(after.profile.maxDifficulty===(difficulty===0?1:8),'unlock correct');
  assert(after.profile.campaignComplete===(difficulty===8),'campaign finish correct');
  if(difficulty===0){
   assert((await page.locator('#expedition-title').innerText()).includes('Moon'),'Moon setup after travel');
   await page.locator('#run-start').click();
   assert((await page.locator('#journey-destination').innerText()).includes('Moon → Mars'),'new world journey');
   await page.locator('#shop-launch').click();
  }else{
   assert((await page.locator('#expedition-step').innerText()).includes('TAU CETI REACHED'),'campaign celebration');
   await page.reload();assert((await page.locator('#expedition-step').innerText()).includes('TAU CETI REACHED'),'completion survives reload');
  }
 }
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'Real full flights on Earth and Eris, animated travel, auto-arrival, skip, Moon journey, Tau Ceti completion, persistence',errors};
}
;
const checkTravel = async page => {
 const assert=(v,m)=>{if(!v)throw Error(m);};
 await page.evaluate(async()=>{
  const {createTravel}=await import('./travel.js'),e=await import('./expeditions.js');
  const s=e.newExpeditions();e.startExpedition(s,{seed:1});
  window.travelFixture=s.active;window.arrivals=0;window.testTravel=createTravel(()=>window.arrivals++);
 });
 for(const [width,height]of[[320,568],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>testTravel(travelFixture));
  const bad=await page.evaluate(()=>[...document.querySelectorAll('#travel-dialog,#travel-skip,#travel-title,#travel-caption')].filter(e=>{const r=e.getBoundingClientRect();return r.top<0||r.left<0||r.right>innerWidth||r.bottom>innerHeight||e.scrollHeight>e.clientHeight+2}).map(e=>e.id));
  assert(!bad.length,JSON.stringify({width,height,bad}));
  await page.keyboard.press('Escape');await page.waitForTimeout(30);
 }
 assert(await page.evaluate(()=>arrivals)===5,'escape completes once');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>testTravel(travelFixture));
 assert(await page.locator('#travel-dialog').getAttribute('data-reduced')==='true','reduced motion honored');
 const animations=await page.evaluate(()=>document.querySelector('#travel-scene').getAnimations({subtree:true}).length);
 assert(animations===0,'no travel animations for reduced motion');
 await page.waitForTimeout(600);assert(!await page.locator('#travel-dialog').isVisible(),'reduced arrival auto-closes');
 assert(await page.evaluate(()=>arrivals)===6,'reduced arrival once');
 await page.emulateMedia({reducedMotion:'no-preference'});
 return {passed:'travel layout at five viewports, Escape, reduced motion without animations, one arrival per trip'};
}
;
return {
 layout:await checkLayout(page),
 flights:await checkFlights(page),
 travel:await checkTravel(page),
};
}
