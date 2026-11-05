// Isolated browser only: replaces this test session's save.
async page => {
  const assert = (value,message) => { if(!value)throw Error(message); }, errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});
  const expected = await page.evaluate(async()=>{
    const r=await import('./prototype-run.js'),b=await import('./builder.js'),p=await import('./parts.js');
    const s=r.newExpeditions();r.startPrototype(s,{seed:42});
    s.active.program.stock=p.catalogFor(s.active.program).map(part=>part.id);
    s.active.program.credits=2000;
    localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
    return b.previewPart(s.active.program,'ember');
  });
  await page.reload();
  await page.locator('[data-part="ember"]').click();
  assert((await page.locator('#comparison-label').innerText()).includes('km'),'preview shows the engineering gain');
  await page.locator('#part-fit').click();
  assert((await page.locator('#build-state').innerText()).startsWith('FITTED · +'),'fitting celebrates the actual gain');
  assert((await page.locator('#build-state').innerText()).includes('110%'),'gain states its timing baseline');
  await page.screenshot({path:'/tmp/rocketaway-feel-fit.png'});
  await page.locator('#game-menu').click();await page.locator('#sound').click();
  assert(await page.locator('#sound').getAttribute('aria-pressed')==='true','sound is explicitly opt-in');
  await page.locator('#menu-close').click();
  await page.locator('#shop-launch').click();
  await page.waitForFunction(()=>{
    if(parseInt(document.querySelector('#timing-quality').textContent)>=118){document.querySelector('#launch').click();return true;}
    return false;
  });
  await page.locator('#pause').click();
  const held=await page.locator('#flight-goal-label').innerText();
  await page.waitForTimeout(180);
  assert(await page.locator('#flight-goal-label').innerText()===held,'pause freezes goal feedback');
  await page.locator('#return').click();
  const started=Date.now();
  await page.waitForFunction(()=>document.querySelector('#launch-title').textContent.includes('reached!'));
  await page.screenshot({path:'/tmp/rocketaway-feel-milestone.png'});
  await page.locator('#report').waitFor({state:'visible',timeout:18000});
  const seconds=(Date.now()-started)/1000;
  assert(seconds<17,'ordinary flight does not spend longer than sixteen seconds coasting');
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);
  assert(result.lastResult.altitude>=expected.height,'gold timing realizes the fitted improvement');
  assert(result.program.flights===1,'presentation effects do not settle a second flight');
  assert(await page.locator('#result').getAttribute('data-outcome')==='success','success report has its celebration');
  await page.screenshot({path:'/tmp/rocketaway-feel-report.png'});
  // Pause a fresh launch to inspect all flight layouts without a moving deadline.
  await page.locator('#return').click();await page.locator('#shop-launch').click();await page.locator('#launch').click();await page.locator('#pause').click();
  for(const [width,height] of [[320,568],[375,667],[390,844],[390,720],[390,740],[414,736],[667,375],[844,390],[1366,768]]) {
    await page.setViewportSize({width,height});
    const bad=await page.locator('#flight-goal,#launch-title,.launch-console,#pause,#speed').evaluateAll(elements=>elements.filter(e=>{
      const r=e.getBoundingClientRect();return r.top<0||r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1;
    }).map(e=>e.id||e.className));
    assert(!bad.length,`${width}x${height} flight feedback fits: ${bad}`);
    assert(await page.locator('.viewport').evaluate(e=>e.clientHeight>=100),'rocket retains visible sky');
    // Hide only the pause overlay for a static layout screenshot; the simulation stays paused.
    await page.locator('#overlay').evaluate(e=>e.style.visibility='hidden');
    await page.screenshot({path:`/tmp/rocketaway-feel-flight-${width}-${height}.png`});
    await page.locator('#overlay').evaluate(e=>e.style.visibility='');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();await page.locator('#run-resume').click();
  await page.locator('#pause').click();
  assert(await page.locator('#launch-title').evaluate(e=>e.getAnimations().length===0),'reduced motion omits notice animation');
  assert(await page.locator('#flight-goal').isVisible(),'reduced motion keeps useful progress');
  await page.locator('#return').click();await page.locator('#speed').click();
  await page.locator('#report').waitFor({state:'visible',timeout:9000});
  assert(!errors.length,JSON.stringify(errors));
  return {passed:'Fitted gains, opt-in audio, normal pacing, actual milestone and report, pause, nine flight layouts and reduced motion',seconds,errors};
}
