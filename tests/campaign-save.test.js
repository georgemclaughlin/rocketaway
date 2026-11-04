import test from 'node:test';
import assert from 'node:assert/strict';
import { openCampaignSave, packCampaignSave } from '../campaign-save.js';
import { newExpeditions, startExpedition, beginExpeditionFlight } from '../expeditions.js';
import { startPrototype } from '../prototype-run.js';

test('opening roguelite preserves an existing interrupted campaign exactly', () => {
  const legacy = newExpeditions();
  startExpedition(legacy, { seed: 42 });
  beginExpeditionFlight(legacy, 1.17);
  const before = structuredClone(legacy);
  const opened = openCampaignSave(legacy);
  assert.equal(opened.session.active, null);
  assert.equal(opened.session.prototypeVersion, 2);
  startPrototype(opened.session, { seed: 7 });
  const stored = packCampaignSave(opened.session, opened.other);
  assert.deepEqual(stored.originalCampaign, before);
  assert.deepEqual(legacy, before);
  const original = openCampaignSave(stored, true);
  assert.equal(original.session.active.status, 'flying');
  assert.equal(original.session.active.launchQuality, 1.17);
  assert.deepEqual(original.session.active.program.parts, before.active.program.parts);
  original.session.profile.research.data += 10;
  const switchedBack = openCampaignSave(packCampaignSave(original.session, original.other, true));
  assert.equal(switchedBack.session.active.seed, 7);
  assert.equal(switchedBack.other.profile.research.data, before.profile.research.data + 10);
});

test('existing prototype saves resume without losing their rocket', () => {
  const prototype = newExpeditions();
  startPrototype(prototype, { seed: 99 });
  const opened = openCampaignSave(prototype);
  assert.equal(opened.session.active.seed, 99);
  assert.deepEqual(opened.session.active.program.parts, prototype.active.program.parts);
  assert.equal(opened.other.active, null);
});

test('unsupported active or inactive save versions reject writes without mutation', () => {
  const saved = packCampaignSave(openCampaignSave(null).session, newExpeditions());
  for (const raw of [
    { ...saved, campaignSaveVersion: 2 },
    { ...saved, prototypeVersion: 99 },
    { ...saved, originalCampaign: { version: 99 } },
  ]) {
    const before = structuredClone(raw);
    for (const original of [false, true]) assert.throws(() => openCampaignSave(raw, original));
    assert.deepEqual(raw, before);
  }
});
