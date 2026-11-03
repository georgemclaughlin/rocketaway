import test from 'node:test';
import assert from 'node:assert/strict';
import {newExpeditions} from '../expeditions.js';
import {researchButtonState} from '../research-ui.js';

test('research availability follows the selected rocket and directs to an affordable upgrade',()=>{
 const {profile}=newExpeditions();profile.totalGates=6;profile.research.data=3;profile.research.levels.scrapper=1;
 const other=researchButtonState(profile,'scrapper');
 assert.equal(other.state,'other');assert.equal(other.targetKit,'stager');assert.match(other.label,/Other rockets only/);
 const current=researchButtonState(profile,'scientist');
 assert.equal(current.state,'current');assert.equal(current.targetKit,'scientist');assert.match(current.label,/Upgrade Scientist/);
 profile.research.data=0;assert.equal(researchButtonState(profile,'scientist').state,'none');
});
test('locked and completed research cannot advertise a purchasable upgrade',()=>{
 const {profile}=newExpeditions();profile.research.data=100;profile.research.levels.scrapper=5;
 assert.equal(researchButtonState(profile,'scrapper').state,'none');
 profile.totalGates=6;profile.research.levels={scrapper:5,stager:5,scientist:5};
 const done=researchButtonState(profile,'scrapper');assert.equal(done.state,'none');assert.match(done.label,/All upgrades owned/);
});
