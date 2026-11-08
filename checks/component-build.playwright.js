// Run only in a fresh isolated browser session: replaces that session's save.
async page => {
  const assert=(value,message)=>{if(!value)throw Error(message);},errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
  const slot=id=>page.locator(`button[data-build-slot="${id}"]`).click();
  const tune=async id=>{await page.locator('#part-info').click();await page.locator(`[data-tuning="${id}"]`).click();await page.locator('#part-info-close').click();};
  await page.evaluate(async()=>{
    const r=await import('./prototype-run.js'),c=await import('./component-research.js'),p=await import('./parts.js'),research=await import('./research.js');
    const s=r.newExpeditions();s.profile.research.components={scrapper:c.COMPONENT_NODES.map(n=>n.id)};
    r.startPrototype(s,{seed:42});research.syncResearch(s);s.active.program.credits=2000;
    s.active.program.stock=p.catalogFor(s.active.program).map(p=>p.id);
    localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s));
  });
  await page.reload();await page.setViewportSize({width:390,height:844});
  const before=await read();
  await tune('pressure-feed');await page.locator('[data-part="ember"]').click();
  await slot('tank');await tune('light-shell');
  assert((await page.locator('#build-state').innerText()).includes('3 CHANGES'),'parts and cross-section tuning previews accumulate');
  assert(JSON.stringify(await read())===JSON.stringify(before),'preview never persists or spends');
  await page.reload();assert(await page.locator('#build-reset').isHidden(),'reload clears all tuning previews');
  await slot('engine');await tune('pressure-feed');await page.locator('[data-part="ember"]').click();
  await slot('tank');await tune('light-shell');
  await page.locator('#part-fit').click();
  const fitted=await read();
  assert(fitted.credits===before.credits-120&&fitted.parts.equipped.engine==='ember'&&fitted.tunings.engine==='pressure-feed'&&fitted.tunings.tank==='light-shell','one explicit fit commits the full quote');
  await page.reload();assert(JSON.stringify((await read()).tunings)===JSON.stringify(fitted.tunings),'fitted tunings persist');
  for(const [width,height] of [[320,568],[375,667],[390,720],[390,740],[390,844],[414,736],[667,375],[844,390],[1366,768]]){
    await page.setViewportSize({width,height});await slot('engine');await page.locator('#part-info').click();
    const bad=await page.locator('#part-dialog').evaluate(dialog=>{
      const bounds=dialog.getBoundingClientRect();
      return bounds.left<0||bounds.right>innerWidth||bounds.top<0||bounds.bottom>innerHeight||[...dialog.querySelectorAll('[data-tuning]')].some(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<48;});
    });
    assert(!bad,`${width}x${height}: tuning dialog bounds and tap sizes`);
    await page.locator('[data-tuning="cruise-feed"]').click();
    await page.screenshot({path:`/tmp/rocketaway-tuning-${width}-${height}.png`});
    await page.locator('#part-info-close').click();
    assert(await page.locator('#part-fit').isEnabled(),'tuning-only change can be fitted');
    await page.locator('#build-reset').click();
  }
  await slot('boosters');await page.locator('#part-info').click();await page.locator('[data-tuning="high-impulse"]').click();
  assert((await page.locator('#part-tuning-note').innerText()).includes('No effect without side boosters'),'bare mounts explain no effect');
  await page.locator('#part-info-close').click();await page.locator('#build-reset').click();
  await slot('engine');await tune('cruise-feed');
  await page.setViewportSize({width:390,height:844});await page.locator('#shop-launch').click();
  await page.waitForFunction(()=>{const power=parseInt(document.querySelector('#timing-quality').textContent);if(power===110){document.querySelector('#launch').click();return true;}return false;});
  assert((await read()).tunings.engine==='pressure-feed','Launch fitted ignores uncommitted tuning');
  await page.waitForFunction(()=>document.querySelector('#ability-flight').textContent.includes('High-pressure feed'));
  assert((await page.locator('#ability-flight').innerText()).includes('High-pressure feed'),'flight labels actual tuning');
  const estimate=await page.evaluate(async()=>{const b=await import('./builder.js'),run=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active;return b.estimateHeight(run.program,run.launchQuality);});
  await page.reload();assert((await read()).tunings.engine==='pressure-feed','interrupted flight retains fitted tuning');
  await page.getByRole('button',{name:'Resume flight'}).click();
  await page.locator('#speed').click();await page.locator('#report').waitFor({state:'visible',timeout:15000});
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.lastResult);
  assert(Math.abs(result.altitude-estimate)<2,'browser flight agrees with the same-power estimate after reload');
  assert(result.engineering.tunings.engine==='pressure-feed','report records actual tuning');
  assert(result.engineering.effects.some(text=>text.includes('High-pressure feed')),'report explains tuning');
  await page.locator('#return').click();await tune('standard');await page.locator('#part-fit').click();
  assert((await read()).tunings.engine==='standard','ordinary configuration remains free to refit');
  assert((await read()).componentResearch.includes('engine-calibration'),'returning to ordinary keeps calibration');
  assert(!errors.length,JSON.stringify(errors));
  return {passed:'Atomic part+tuning fits, persistent ownership, discard/reload, nine tuning layouts, bare mounts, actual tuned flight and interrupted-flight parity',errors};
}
