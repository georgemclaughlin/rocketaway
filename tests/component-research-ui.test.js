import test from 'node:test';
import assert from 'node:assert/strict';
import {newExpeditions} from '../expeditions.js';
import {researchButtonState} from '../research-ui.js';
import {COMPONENT_NODES} from '../component-research.js';

test('component research keeps the current kit available after its legacy ranks complete',()=>{
 const {profile}=newExpeditions();profile.research.levels.scrapper=5;profile.research.data=3;
 assert.equal(researchButtonState(profile,'scrapper').state,'none');
 assert.equal(researchButtonState(profile,'scrapper',true).state,'current');
 profile.research.components={scrapper:COMPONENT_NODES.map(node=>node.id)};
 assert.equal(researchButtonState(profile,'scrapper',true).state,'none');
 profile.totalGates=6;
 assert.equal(researchButtonState(profile,'scrapper',true).state,'other');
});

test('component tuning affordability respects its higher cost and locked starting kits',()=>{
 const {profile}=newExpeditions();profile.research.levels.scrapper=5;profile.research.data=3;
 profile.research.components={scrapper:COMPONENT_NODES.filter(node=>node.kind==='calibration').map(node=>node.id)};
 assert.equal(researchButtonState(profile,'scrapper',true).state,'none');
 profile.research.data=5;
 assert.equal(researchButtonState(profile,'scrapper',true).state,'current');
});
