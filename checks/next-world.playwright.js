// Isolated browser only: fixtures replace this test session's saved games.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const sizes=[[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]];
 const fits=async label=>{
  for(const[width,height]of sizes){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert(await page.locator('.world-stop[aria-pressed="true"]').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1;}),`${label}: selected world stays visible at ${width}`);
   const bad=await page.locator('#expedition,.kit-card,#expedition-summary,#run-start,#run-keep,#expedition-footer').evaluateAll(es=>es.filter(e=>{if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2;}).map(e=>e.id||e.className));
   assert(!bad.length,JSON.stringify({label,width,height,bad}));
  }
 };
 const before=await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),e=await import('./expeditions.js');const s=r.newExpeditions();
  s.profile.maxDifficulty=1;s.profile.totalGates=6;s.profile.prototypeWorlds=[0];
  r.startPrototype(s,{seed:42,difficulty:1});r.beginFlight(s,1.17);r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.17,payMultiplier:1});
  s.prototypeVersion=1;s.profile.maxDifficulty=1;
  localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));return s.active.program.credits;
 });await page.reload();
 assert(await page.locator('[data-world="2"]').getAttribute('aria-pressed')==='true','old completed Moon defaults to Mars');
 assert((await page.locator('#expedition-title').innerText()).includes('Mars'),'Mars launchpad shown');
 assert(await page.locator('[data-world]').count()===9,'all nine launch worlds shown');
 assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program.credits)===before,'reload did not pay the Moon again');
 await fits('Moon to Mars');
 await page.setViewportSize({width:375,height:667});await page.screenshot({path:'/tmp/rocketaway-next-mars.png'});
 await page.locator('[data-world="0"]').click();await page.locator('[data-kit="scientist"]').click();
 assert(await page.locator('[data-world="0"]').getAttribute('aria-pressed')==='true','explicit replay choice survives kit change');
 await page.reload();await page.locator('#run-start').click();
 let run=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
 assert(run.difficulty===2&&run.program.flights===0&&run.strikes===0,'new funded Mars rocket');
 await page.locator('#contracts-open').click();assert((await page.locator('#contract-offers').innerText()).includes('Mars instruments'),'Mars contracts');await page.locator('#contracts-close').click();
 await page.evaluate(async()=>{const r=await import('./prototype-run.js'),e=await import('./expeditions.js');const s=JSON.parse(localStorage.getItem(e.EXPEDITION_KEY));r.beginFlight(s,1.1);r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.1,payMultiplier:1});localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 assert(await page.locator('[data-world="3"]').getAttribute('aria-pressed')==='true','Mars completion defaults to Ceres');
 // An older, farther campaign can suggest a new launchpad without discarding the current build.
 const saved=await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),e=await import('./expeditions.js'),c=await import('./campaign-save.js');
  const old=e.newExpeditions();old.profile.maxDifficulty=6;old.profile.totalGates=36;e.startExpedition(old,{seed:99,difficulty:6});
  const s=r.newExpeditions();r.startPrototype(s,{seed:7});const raw=c.packCampaignSave(s,old);
  localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(raw));return {rocket:s.active,old};
 });await page.reload();
 assert(await page.locator('[data-world="6"]').getAttribute('aria-pressed')==='true','older unlocked Triton selected');
 await fits('older progress recovered');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
 assert(JSON.stringify(after.originalCampaign)===JSON.stringify(saved.old),'original campaign untouched');
 assert(after.active.seed===saved.rocket.seed&&after.active.program.credits===saved.rocket.program.credits,'current rocket retained until player chooses');
 await page.locator('#run-keep').click();assert(await page.locator('#shop-launch').isVisible(),'can return to saved Earth rocket');
 await page.reload();assert(await page.locator('#shop-launch').isVisible(),'return-to-rocket choice remembered');
 // The final world still has its dedicated ending, rather than a forced Earth restart.
 await page.evaluate(async()=>{const r=await import('./prototype-run.js'),e=await import('./expeditions.js');const s=r.newExpeditions();s.profile.maxDifficulty=8;s.profile.totalGates=48;s.profile.prototypeWorlds=[0,1,2,3,4,5,6,7];r.startPrototype(s,{seed:1,difficulty:8});r.beginFlight(s,1.2);r.settle(s,{done:true,peak:e.milestoneHeight(s.active,5)+1,quality:1.2,payMultiplier:1});localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(s));});await page.reload();
 assert((await page.locator('#expedition-title').innerText()).includes('Tau Ceti'),'dedicated Tau Ceti ending');
 assert(await page.locator('#ending-explore').isVisible(),'replay remains optional');
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'Old Moon save to Mars, Mars to Ceres, explicit replay selection, funded next rocket, older unlock recovery without deleting builds, six layouts and Tau Ceti ending',errors};
}
