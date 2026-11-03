// Run in an isolated Playwright CLI session; fixtures replace only that browser's saves.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 const full=await page.evaluate(async()=>{const e=await import('./expeditions.js'),r=await import('./research.js'),s=e.newExpeditions();for(let world=0;world<9;world++){e.startExpedition(s,{seed:world+1,difficulty:world});e.beginExpeditionFlight(s,.95);e.settleExpedition(s,{done:true,peak:1000,payMultiplier:1});e.continueExpedition(s);e.beginExpeditionFlight(s,1.2);e.settleExpedition(s,{done:true,peak:world===3?4500000:e.milestoneHeight(s.active,5)+50000,payMultiplier:1});}for(const kit of ['scrapper','stager','scientist'])for(let i=0;i<5;i++)r.buyResearch(s,kit);return s;});
 for(const legacy of [false,true]){
  const state=JSON.parse(JSON.stringify(full));if(legacy)delete state.profile.flightRecords;
  await page.evaluate(s=>localStorage.setItem('rocket-away-expeditions-v1',JSON.stringify(s)),state);await page.reload();
  assert((await page.locator('[data-record="launches"]').innerText()).includes(legacy?'Recorded launches':'Total launches'),'complete vs recovered label');
  assert(await page.locator('[data-record="launches"] b').innerText()===(legacy?'2':'18'),'launch total');
  assert(await page.locator('[data-record="perfect"] b').innerText()===(legacy?'1':'9'),'perfect count');
  assert((await page.locator('[data-record="highest"]').innerText()).includes(legacy?'Eris':'Ceres'),'record world');
  if(!legacy)assert((await page.locator('[data-record="highest"] b').innerText()).replace(',','').includes('4500'),'record altitude across worlds');
  assert(await page.locator('[data-record="upgrades"] b').innerText()==='15','upgrades');
  assert((await page.locator('#ending-record-note').innerText()).includes('Older flights')===legacy,'incomplete history explained');
  for(const [width,height]of [[320,568],[375,667],[390,844],[667,375],[844,390],[1366,768]]){
   await page.setViewportSize({width,height});const bad=await page.evaluate(()=>[...document.querySelectorAll('#expedition,.finale-stats,.finale-stats > div,.finale-stats b,#ending-explore,#ending-record-note')].filter(e=>{const r=e.getBoundingClientRect();return r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2}).map(e=>e.id||e.dataset.record||e.className));assert(!bad.length,JSON.stringify({legacy,width,height,bad}));
  }
  await page.reload();assert(await page.locator('[data-record="launches"] b').innerText()===(legacy?'2':'18'),'reload does not duplicate migration');
 }
 assert(!errors.length,JSON.stringify(errors));return {passed:'Full nine-world records, recovered older saves, six layouts, persistent totals without duplication',errors};
}
