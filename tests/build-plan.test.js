import test from 'node:test';
import assert from 'node:assert/strict';
import { newExpeditions, startPrototype, restoreSession } from '../prototype-run.js';
import { catalogFor, assemblySpecs, fitPart } from '../parts.js';
import { planBuild, fitBuild } from '../build-plan.js';
import { buildEffects } from '../rocket-insights.js';
import { estimateHeight } from '../builder.js';

function setup() {
  const session = newExpeditions(); startPrototype(session, { seed: 42 });
  const p = session.active.program;
  p.stock = catalogFor(p).map(part => part.id);
  p.credits = 1000;
  return { session, p };
}

test('a complete combination can be explored without owning, spending, or mutating a save', () => {
  const { p } = setup(), before = structuredClone(p);
  const plan = planBuild(p, { aero: 'lab', engine: 'instrument-engine' });
  assert.equal(plan.cost, 860);
  assert.deepEqual(plan.changes, ['lab', 'instrument-engine']);
  assert.ok(buildEffects(plan.program).find(e => e.key === 'instrument').active);
  assert.ok(estimateHeight(plan.program) > 0);
  assert.deepEqual(p, before);
});

test('purchase validates total cost and availability before committing any part of an order', () => {
  const { p } = setup(); p.credits = 219;
  let before = structuredClone(p);
  assert.equal(planBuild(p, { engine: 'ember', tank: 'long' }).cost, 220);
  assert.equal(fitBuild(p, { engine: 'ember', tank: 'long' }), null);
  assert.deepEqual(p, before);
  p.credits = 220; p.stock = p.stock.filter(id => id !== 'long'); before = structuredClone(p);
  assert.equal(fitBuild(p, { engine: 'ember', tank: 'long' }), null);
  assert.deepEqual(p, before);
  assert.equal(planBuild(p, { aero: 'ember' }), null);
  assert.equal(planBuild(p, { engine: 'unknown' }), null);
});

test('one order exactly matches normal part fitting and survives existing save restoration', () => {
  const { session, p } = setup(), sequential = structuredClone(p);
  const choices = { engine: 'instrument-engine', aero: 'lab' }, preview = planBuild(p, choices);
  const expected = assemblySpecs(preview.program), height = estimateHeight(preview.program);
  assert.equal(fitBuild(p, choices).cost, 860);
  fitPart(sequential, 'lab'); fitPart(sequential, 'instrument-engine');
  assert.deepEqual(p, sequential);
  assert.deepEqual(assemblySpecs(p), expected);
  assert.equal(estimateHeight(p), height);
  const restored = restoreSession(session).active.program;
  assert.deepEqual(restored.parts, p.parts);
  assert.equal(restored.credits, p.credits);
  const before = structuredClone(p);
  assert.equal(fitBuild(p, choices), null);
  assert.deepEqual(p, before);
});

test('free owned combinations remain available off stock and cancelled changes cost nothing', () => {
  const { p } = setup(); fitBuild(p, { engine: 'ember', tank: 'long' });
  const credits = p.credits;
  fitBuild(p, { engine: 'spark', tank: 'pocket' }); p.stock = [];
  const plan = planBuild(p, { engine: 'ember', tank: 'long' });
  assert.equal(plan.cost, 0);
  assert.equal(fitBuild(p, plan.program.parts.equipped).cost, 0);
  assert.equal(p.credits, credits);
  assert.deepEqual(planBuild(p, {}).changes, []);
});

test('legacy equipment and original campaigns cannot preview parts outside their catalog', () => {
  const { p } = setup(); p.equipmentVersion = 1;
  assert.equal(planBuild(p, { engine: 'momentum-engine' }), null);
  assert.ok(planBuild(p, { engine: 'endurance-engine' }));
  delete p.rulesVersion;
  assert.equal(planBuild(p, { engine: 'endurance-engine' }), null);
});
