// Use a fresh isolated browser: this check seeds only its own save.
async page => {
  const assert = (value, message) => { if (!value) throw Error(message); }, errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program);
  const slot = id => page.locator(`button[data-build-slot="${id}"]`).click();
  const part = id => page.locator(`[data-part="${id}"]`).click();
  await page.evaluate(async () => {
    const r = await import('./prototype-run.js'), parts = await import('./parts.js');
    const s = r.newExpeditions(); r.startPrototype(s, { seed: 42 });
    s.active.program.stock = parts.catalogFor(s.active.program).map(p => p.id);
    s.active.program.credits = 900;
    localStorage.setItem('rocket-away-expeditions-v1', JSON.stringify(s));
  });
  await page.reload();
  const before = await read();
  await part('instrument-engine'); await slot('aero'); await part('lab');
  assert((await page.locator('#build-state').innerText()).includes('2 PARTS'), 'both preview changes retained');
  assert((await page.locator('#part-fit').innerText()).includes('860'), 'total purchase cost visible');
  await slot('engine');
  assert(await page.locator('[data-part="instrument-engine"]').getAttribute('aria-pressed') === 'true', 'returning to section retains preview');
  assert(JSON.stringify(await read()) === JSON.stringify(before), 'complete preview leaves save untouched');
  await page.locator('#build-reset').click();
  await slot('engine'); await part('endurance-engine'); await slot('boosters'); await part('twins');
  assert((await page.locator('#candidate-description').textContent()).includes('Endurance engine: needs no side boosters'), 'inactive partner in an unpurchased combination is explained');
  await page.locator('#build-reset').click();
  await slot('engine'); await part('instrument-engine'); await slot('aero'); await part('lab');
  await page.locator('#part-info').click();
  assert((await page.locator('#part-info-stats').innerText()).includes('Science capsule + Instrument engine. Total: 860'), 'Info names every proposed purchase');
  await page.locator('#part-info-close').click();
  await slot('tank'); await part('jumbo');
  assert(await page.locator('#part-fit').isDisabled(), 'unaffordable total cannot be committed');
  await part('pocket');
  const expected = await page.evaluate(async () => {
    const { planBuild } = await import('./build-plan.js'), { estimateHeight } = await import('./builder.js');
    const p = JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active.program;
    return (estimateHeight(planBuild(p, { engine: 'instrument-engine', aero: 'lab' }).program) / 1000).toFixed(1);
  });
  assert((await page.locator('#candidate-height').innerText()).includes(expected), 'estimate includes both pending parts even on a fitted section');
  for (const [width, height] of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
    const bad = await page.evaluate(() => {
      const stage = document.querySelector('#assembly-stage').getBoundingClientRect(), footer = document.querySelector('.rocket-readiness').getBoundingClientRect();
      const controls = [...document.querySelectorAll('button[data-build-slot]'), document.querySelector('#build-reset')];
      return controls.filter(e => {
        const r = e.getBoundingClientRect();
        return r.width < 44 || r.height < 44 || r.top < stage.top || r.bottom > footer.top + 1 || !e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }).map(e => e.id || e.dataset.buildSlot);
    });
    assert(!bad.length, `${width}x${height}: clipped workbench controls ${bad}`);
    assert(await page.locator('.app').evaluate(e => e.scrollHeight <= e.clientHeight + 1), 'app fits');
    assert(await page.locator('#part-fit').evaluate(e => { const r=e.getBoundingClientRect(); return r.bottom<=innerHeight && r.width>=44 && r.height>=44 && e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); }), 'whole-build purchase is visible and tappable');
    await page.screenshot({ path: `/tmp/rocketaway-workbench-${width}.png` });
  }
  await page.locator('#part-fit').click();
  const fitted = await read();
  assert(fitted.credits === 40 && fitted.parts.equipped.engine === 'instrument-engine' && fitted.parts.equipped.aero === 'lab', 'one explicit purchase fits both parts');
  assert(await page.locator('#build-reset').isHidden(), 'committed preview clears');
  await page.reload();
  assert(JSON.stringify((await read()).parts) === JSON.stringify(fitted.parts), 'fitted combination survives reload');
  await slot('engine'); await part('spark'); await slot('aero'); await part('cap');
  await page.locator('#build-reset').click();
  assert(JSON.stringify(await read()) === JSON.stringify(fitted), 'discarding free refits does not mutate save');
  await slot('engine'); await part('spark');
  assert((await page.locator('#shop-launch').innerText()).includes('Launch fitted'), 'launch identifies the actual fitted rocket');
  await page.locator('#shop-launch').click();
  await page.waitForFunction(() => {
    const n = parseInt(document.querySelector('#timing-quality').textContent);
    if (n >= 109 && n <= 111) { document.querySelector('#launch').click(); return true; }
    return false;
  });
  assert((await read()).parts.equipped.engine === 'instrument-engine', 'launch never silently fits a preview');
  await page.locator('#speed').click(); await page.locator('#report').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#return').click();
  assert((await page.locator('#build-state').innerText()) === 'YOUR ROCKET', 'returning from flight starts with the fitted build');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await slot('engine'); await part('spark');
  assert(await page.locator('#assembly-art svg').evaluate(e => getComputedStyle(e).animationName === 'none'), 'reduced motion suppresses assembly animation');
  assert(!errors.length, JSON.stringify(errors));
  return { passed: 'Whole-build previews, combined quote, atomic fitting, discard, reload, fitted launch, six layouts, reduced motion and a real flight', errors };
}
