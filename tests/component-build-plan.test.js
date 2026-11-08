import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions, startPrototype } from '../prototype-run.js';
import { planBuild, fitBuild } from '../build-plan.js';
import { estimateHeight } from '../builder.js';

function rocket() {
  const session=newExpeditions();startPrototype(session,{seed:42});
  const program=session.active.program;
  program.componentResearch=['engine-calibration','pressure-feed','cruise-feed','tank-calibration','light-shell'];
  program.credits=500;program.stock=['ember','long'];
  return program;
}
test('component tuning is a pure whole-build preview and explicit free fit',()=>{
  const p=rocket(),before=structuredClone(p);
  const quote=planBuild(p,{engine:'ember'},{engine:'pressure-feed'});
  assert.deepEqual(p,before);
  assert.equal(quote.cost,120);assert.equal(quote.changeCount,2);
  assert.equal(quote.program.tunings.engine,'pressure-feed');
  const fit=fitBuild(p,{engine:'ember'},{engine:'pressure-feed'});
  assert.equal(fit.cost,120);assert.equal(p.credits,380);
  assert.equal(p.parts.equipped.engine,'ember');assert.equal(p.tunings.engine,'pressure-feed');
  const retune=fitBuild(p,{}, {engine:'cruise-feed'});
  assert.equal(retune.cost,0);assert.equal(retune.changeCount,1);
  assert.equal(p.credits,380);assert.equal(p.tunings.engine,'cruise-feed');
  assert.equal(fitBuild(p,{}, {engine:'cruise-feed'}),null);
  assert.ok(fitBuild(p,{}, {engine:'standard'}));
});
test('invalid or unaffordable combined orders cannot partly fit parts or tunings',()=>{
  const p=rocket();p.credits=10;const saved=structuredClone(p);
  assert.equal(fitBuild(p,{engine:'ember'},{engine:'pressure-feed'}),null);
  assert.deepEqual(p,saved);
  for(const tunings of [{engine:'missing'},{engine:'light-shell'},{engine:'engine-calibration'},{tank:'extended-reservoir'},{missing:'standard'}]) {
    assert.equal(fitBuild(p,{},tunings),null);assert.deepEqual(p,saved);
  }
  delete p.componentResearchVersion;
  assert.equal(planBuild(p,{}, {engine:'pressure-feed'}),null);
});
test('height cache distinguishes research and fitted tunings without changing actual equipment',()=>{
  const p=rocket(),baseline=structuredClone(p);
  const ordinary=estimateHeight(p);
  const pressure=planBuild(p,{}, {engine:'pressure-feed'}).program;
  const cruise=planBuild(p,{}, {engine:'cruise-feed'}).program;
  assert.notEqual(estimateHeight(pressure),ordinary);
  assert.notEqual(estimateHeight(cruise),estimateHeight(pressure));
  assert.deepEqual(p,baseline);assert.equal(estimateHeight(p),ordinary);
  const unresearched={...p,componentResearch:[]};
  assert.notEqual(estimateHeight(unresearched),ordinary);
});
