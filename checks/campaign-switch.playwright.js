// Run only in a new isolated browser session: this script replaces that session's saves.
async page => {
  const assert=(value,message)=>{if(!value)throw Error(message);},errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const legacy=await page.evaluate(async()=>{
    const e=await import('./expeditions.js');
    const session=e.newExpeditions();e.startExpedition(session,{seed:42});
    session.profile.research.data=17;e.beginExpeditionFlight(session,1.17);
    localStorage.setItem(e.EXPEDITION_KEY,JSON.stringify(session));
    localStorage.removeItem('rocket-away-program-v1');
    return session;
  });
  await page.reload();
  await page.locator('#run-start').click();
  assert(await page.locator('#prototype-builder-tools').isVisible(),'new default has roguelite tools');
  await page.locator('#experimental-browse').click();
  await page.locator('#reserve-part').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
  assert(JSON.stringify(saved.originalCampaign)===JSON.stringify(legacy),'original save preserved exactly');
  const reserved=saved.active.reservedOffer;
  await page.locator('#game-menu').click();
  for(const [width,height] of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]) {
    await page.setViewportSize({width,height});
    const visible=await page.locator('#switch-campaign').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;});
    assert(visible,`campaign switch visible at ${width}×${height}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/rocketaway-campaign-menu.png'});
  await page.locator('#switch-campaign').click();await page.waitForURL('**campaign=original');
  await page.locator('#run-resume').waitFor({state:'visible'});
  assert(!await page.locator('#prototype-builder-tools').isVisible(),'original campaign stays original');
  await page.locator('#game-menu').click();await page.locator('#switch-campaign').click();
  await page.waitForURL(url=>!url.searchParams.has('campaign'));
  await page.locator('#experimental-browse').click();
  assert((await page.locator('#reserve-part').innerText()).includes('Reserved'),'roguelite reservation survived switching');
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')));
  assert(after.active.reservedOffer===reserved,'same roguelite rocket');
  assert(after.originalCampaign.active.launchQuality===1.17,'original ignition quality retained');
  assert(after.originalCampaign.profile.research.data===17,'original research retained');
  await page.locator('#shop-launch').click();await page.locator('#launch').click();await page.locator('#speed').click();
  await page.locator('#report').waitFor({state:'visible',timeout:15000});
  await page.reload();
  assert(await page.locator('#shop-launch').isVisible(),'new campaign report resumes in hangar');
  assert(!errors.length,JSON.stringify(errors));
  return {passed:'Public default, original-save preservation, six-size menu, campaign switching, interrupted legacy flight, roguelite launch and reload',errors};
}
