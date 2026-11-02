import test from 'node:test';
import assert from 'node:assert/strict';
import {newProgram,restoreProgram,createFlight,stepFlight,settleFlight,resolveEncounter,currentContract} from '../engine.js';
import {estimateHeight,previewPart} from '../builder.js';
import {PARTS,PART_SLOTS,assemblySpecs,fitPart,restoreInventory} from '../parts.js';
function fly(program) {
  const flight=createFlight(program.levels,1.18,{plan:program.plan,assembly:assemblySpecs(program),contractIndex:program.contracts});
  for(let i=0;i<10000&&!flight.done;i++){stepFlight(flight,.05);}
  assert.ok(flight.done);return flight;
}
test('parts are bought once and can be refitted for free',()=>{
  const p=newProgram();assert.equal(fitPart(p,'mammoth'),false);assert.equal(fitPart(p,'unknown'),false);
  p.credits=500;assert.equal(fitPart(p,'ember'),true);assert.equal(p.credits,380);assert.equal(p.parts.equipped.engine,'ember');
  assert.equal(fitPart(p,'spark'),true);assert.equal(fitPart(p,'ember'),true);assert.equal(p.credits,380);
  assert.equal(p.parts.owned.filter(id=>id==='ember').length,1);
});
test('weight changes lift and tanks change burn time',()=>{
  const p=newProgram(),starter=assemblySpecs(p);p.credits=10000;
  fitPart(p,'jumbo');const heavy=assemblySpecs(p);
  assert.ok(heavy.mass>starter.mass);assert.ok(heavy.burn>starter.burn);assert.ok(heavy.thrust<starter.thrust);
  fitPart(p,'mammoth');assert.ok(assemblySpecs(p).thrust>heavy.thrust);
  fitPart(p,'dart');assert.ok(assemblySpecs(p).burn>heavy.burn);
});
test('staging drops booster mass and fuel consumption improves thrust-to-weight',()=>{
  const p=newProgram();p.credits=1000;fitPart(p,'twins');
  const f=createFlight(p.levels,1.1,{assembly:assemblySpecs(p),plan:p.plan});
  const initialDry=f.dryMass;
  while(!f.boosted)stepFlight(f,.05);
  assert.ok(f.dryMass<initialDry);assert.ok(f.fuel<1);assert.ok(f.velocity>0);
});
test('old upgrade progress becomes owned and fitted components',()=>{
  const p=restoreProgram({credits:321,best:90000,levels:{engine:4,tank:3,aero:3,boosters:2}});
  assert.equal(p.credits,321);assert.equal(p.best,90000);
  assert.equal(p.parts.equipped.engine,'dart');assert.equal(p.parts.equipped.tank,'composite');
  assert.equal(p.parts.equipped.aero,'ceramic');assert.equal(p.parts.equipped.boosters,'twins');
  assert.ok(p.parts.owned.includes('ember'));assert.deepEqual(restoreProgram(JSON.parse(JSON.stringify(p))),p);
});
test('invalid or unowned components cannot be loaded into a slot',()=>{
  const inventory=restoreInventory({owned:['spark','mammoth','fake'],equipped:{engine:'jumbo',tank:'mammoth',aero:'ceramic'}});
  assert.equal(inventory.equipped.engine,'spark');assert.equal(inventory.equipped.tank,'pocket');assert.equal(inventory.equipped.aero,'cap');
  assert.ok(!inventory.owned.includes('fake'));
  for(const slot of PART_SLOTS)assert.ok(PARTS.some(part=>part.id===inventory.equipped[slot.id]&&part.slot===slot.id));
});
test('earned parts can complete both missions without a forced reset',()=>{
  const p=newProgram(),order=['ember','long','needle','twins','dart','composite','solids','ceramic','mammoth','jumbo','orbitals'];let next=0;
  while(p.best<200000 && p.flights<20){
    settleFlight(p,fly(p));
    while(next<order.length && fitPart(p,order[next]))next++;
  }
  assert.ok(p.best>=200000);assert.ok(p.won);assert.ok(p.milestones.includes(100000)&&p.milestones.includes(200000));
  assert.ok(p.flights>=5&&p.flights<=15);
});

test('previewing parts cannot spend money or change the fitted rocket',()=>{
  const p=newProgram(),before=JSON.stringify(p), preview=previewPart(p,'jumbo');
  assert.equal(JSON.stringify(p),before);
  assert.equal(preview.program.parts.equipped.tank,'jumbo');
  assert.ok(preview.stats.mass>preview.previousStats.mass);
  assert.ok(preview.stats.burn>preview.previousStats.burn);
  assert.equal(previewPart(p,'missing'),null);
});
test('height estimates match a real uninterrupted flight at the displayed launch power',()=>{
  const p=newProgram();p.credits=3000;fitPart(p,'dart');fitPart(p,'composite');fitPart(p,'twins');
  const flight=createFlight(p.levels,1.1,{plan:'explorer',assembly:assemblySpecs(p)});
  while(!flight.done)stepFlight(flight,.05);
  assert.equal(estimateHeight(p),Math.round(flight.peak));
});
test('replacement contracts remain achievable without flight plans or events',()=>{
  const p=newProgram();p.credits=10000;fitPart(p,'mammoth');fitPart(p,'jumbo');fitPart(p,'ceramic');
  p.contracts=5;assert.equal(settleFlight(p,fly(p)).contractPay,150);
  p.contracts=7;assert.equal(settleFlight(p,fly(p)).contractPay,0);
  fitPart(p,'orbitals');assert.equal(settleFlight(p,fly(p)).contractPay,250);
});
