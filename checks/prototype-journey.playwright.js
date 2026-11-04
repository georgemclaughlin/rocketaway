// A fresh, earned UI expedition. Run only in an isolated browser on port 4174.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[],reports=[];
 page.on('pageerror',e=>errors.push(e.message));
 assert(page.url().includes(':4174/'),'prototype origin required');
 await page.evaluate(()=>{localStorage.removeItem('rocket-away-expeditions-v1');localStorage.removeItem('rocket-away-program-v1');});await page.reload();await page.setViewportSize({width:390,height:844});
 await page.locator('#run-start').click();
 for(let turn=0;turn<20;turn++) {
  await page.locator('#research-open').click();await page.locator('[data-research-tab="scrapper"]').click();
  while(await page.locator('#research-buy').isEnabled())await page.locator('#research-buy').click();
  await page.locator('#research-close').click();
  // Read-only planning: all purchases and launches still go through visible controls.
  const plan=await page.evaluate(async()=>{
   const {catalogFor}=await import('./parts.js'),{estimateHeight}=await import('./builder.js'),{milestoneHeight}=await import('./expeditions.js'),{prototypeContracts,contractReady}=await import('./prototype-run.js');
   const s=JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')),r=s.active,p=r.program;
   const cat=catalogFor(p).filter(x=>p.parts.owned.includes(x.id)||p.stock.includes(x.id)),slots=['aero','tank','engine','boosters'].map(slot=>cat.filter(x=>x.slot===slot));
   let best={height:estimateHeight(p),parts:[]};
   if(best.height<milestoneHeight(r))for(const a of slots[0])for(const t of slots[1])for(const e of slots[2])for(const b of slots[3]){
    const parts=[a,t,e,b],cost=parts.reduce((n,x)=>n+(p.parts.owned.includes(x.id)?0:x.price),0);if(cost>p.credits)continue;
    const candidate={...p,parts:{...p.parts,equipped:Object.fromEntries(parts.map(x=>[x.slot,x.id]))}},height=estimateHeight(candidate);
    if(height>best.height+1)best={height,parts:parts.filter(x=>p.parts.equipped[x.slot]!==x.id)};
   }
   const equipped={...p.parts.equipped,...Object.fromEntries(best.parts.map(x=>[x.slot,x.id]))},candidate={...p,parts:{...p.parts,equipped}};
   const contract=prototypeContracts(r.difficulty).find(c=>!r.completedContracts.includes(c.id)&&contractReady(candidate,c));
   return {parts:best.parts.map(x=>({id:x.id,slot:x.slot,experimental:!!x.ability})),contract:contract?.id||null};
  });
  for(const part of plan.parts){
   await page.locator(`button[data-build-slot="${part.slot}"]`).click();
   const experimental=await page.locator('#experimental-browse').getAttribute('aria-pressed')==='true';
   if(experimental!==part.experimental)await page.locator('#experimental-browse').click();
   await page.locator(`[data-part="${part.id}"]`).click();assert(await page.locator('#part-fit').isEnabled(),`cannot fit earned ${part.id}`);await page.locator('#part-fit').click();
  }
  await page.locator('#contracts-open').click();
  if(plan.contract)await page.locator(`[data-contract="${plan.contract}"]`).click();else await page.locator('#contract-none').click();
  await page.locator('#shop-launch').click();
  await page.evaluate(()=>new Promise(resolve=>{const aim=()=>{if(parseInt(document.querySelector('#timing-quality').textContent)>=118){document.querySelector('#launch').click();resolve();}else requestAnimationFrame(aim);};requestAnimationFrame(aim);}));
  if(await page.locator('#speed').getAttribute('aria-pressed')==='false')await page.locator('#speed').click();
  await page.locator('#report').waitFor({state:'visible',timeout:12000});
  const run=await page.evaluate(()=>JSON.parse(localStorage.getItem('rocket-away-expeditions-v1')).active);reports.push({world:run.difficulty,status:run.status,altitude:run.lastResult.altitude,contract:run.lastResult.contract,misses:run.strikes});
  assert(run.status!=='lost',JSON.stringify(reports));
  if(run.status==='won'&&run.difficulty===1){assert(await page.locator('#result-title').innerText()==='Expedition complete!','distinct prototype ending report');assert(!(await page.locator('#return').innerText()).includes('Mars'),'no unimplemented Mars travel');await page.screenshot({path:'/tmp/rocketaway-prototype-earned-finish.png'});await page.locator('#return').click();assert((await page.locator('#expedition-step').innerText()).includes('COMPLETE'),'prototype completion shown');assert(!errors.length,JSON.stringify(errors));return {passed:'Fresh earned Earth–Moon expedition through UI with automated gold timing',reports,errors};}
  await page.locator('#return').click();
  if(run.status==='won'){await page.locator('#travel-skip').click();await page.locator('#shop-launch').waitFor({state:'visible'});await page.screenshot({path:'/tmp/rocketaway-prototype-earned-arrival.png'});}
 }
 throw Error('Expedition did not finish: '+JSON.stringify(reports));
}
