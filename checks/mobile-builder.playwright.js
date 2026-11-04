// Isolated browser only: these fixtures replace this session's game saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(async()=>{
  const r=await import('./prototype-run.js'),p=await import('./parts.js');
  const s=r.newExpeditions();r.startPrototype(s,{seed:42});
  s.active.program.credits=2000;s.active.program.stock=p.catalogFor(s.active.program).map(p=>p.id);
  localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
 });await page.reload();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 await page.locator('button[data-build-slot="engine"]').click();
 assert(await page.locator('[data-part="spark"]').count()===1&&await page.locator('[data-part="endurance-engine"]').count()===1,'standard and special engines share one shelf');
 await page.locator('[data-part="instrument-engine"]').click();
 assert(await page.locator('button[data-build-slot="engine"]').getAttribute('aria-pressed')==='true','browsing stays in chosen section');
 const preview=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 assert(JSON.stringify(before.parts)===JSON.stringify(preview.parts)&&before.credits===preview.credits,'preview does not fit or spend');
 await page.locator('#part-fit').click();
 const fitted=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
 assert(fitted.parts.equipped.engine==='instrument-engine'&&fitted.credits===before.credits-560,'explicit fit buys selected part');
 await page.locator('button[data-build-slot="aero"]').click();await page.locator('[data-part="feather-shell"]').click();
 assert(!await page.locator('#reserve-part').isVisible(),'reservation is outside main builder');
 await page.locator('#part-info').click();
 assert((await page.locator('#part-reservation').innerText()).includes('does not buy or fit'),'reservation has a clear explanation');
 await page.locator('#part-info-close').click();
 await page.locator('#contracts-open').click();await page.locator('[data-contract="earth-science"]').click();
 assert((await page.locator('#contract-selection').innerText())==='Atmosphere survey','selected optional goal stays visible');
 for(const [width,height] of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert(await page.locator('#part-shelf [aria-pressed="true"]').evaluate(e=>{const r=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1;}),'preview stays visible after rotating or resizing');
  const bad=await page.evaluate(()=>{
   const ids=['contracts-open','part-info','part-fit','shop-launch','research-open'];
   const controls=[...document.querySelectorAll('button[data-build-slot]'),...ids.map(id=>document.getElementById(id))];
   return controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44||r.top<0||r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}).map(e=>e.id||e.dataset.buildSlot);
  });assert(!bad.length,JSON.stringify({width,height,bad}));
  assert(await page.locator('.app').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'no vertical app overflow');
  assert(await page.locator('#part-shelf').evaluate(e=>{const r=e.getBoundingClientRect(),next=document.querySelector('.part-browser').getBoundingClientRect();return e.scrollHeight<=e.clientHeight+1&&r.bottom<=next.top+1&&[...e.querySelectorAll('small')].every(p=>{const b=p.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom;});}),'part names and prices fit without clipping or overlap');
  if([320,375,667].includes(width))await page.screenshot({path:`/tmp/rocketaway-builder-${width}.png`});
 }
 assert(!errors.length,JSON.stringify(errors));
 return {passed:'Unified shelf, section stability, preview versus purchase, explained reservation, optional goal, six-size touch targets and overlap checks',errors};
}
