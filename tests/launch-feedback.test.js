import test from 'node:test';
import assert from 'node:assert/strict';
import {launchRating} from '../launch-feedback.js';
import {launchQuality} from '../engine.js';

test('launch ratings agree with displayed power at each threshold',()=>{
 for(const [quality,label,power]of [[.9,'Off target',90],[.994,'Off target',99],[.995,'Good',100],[1.094,'Good',109],[1.095,'Great',110],[1.174,'Great',117],[1.175,'Perfect',118],[1.2,'Perfect',120]]){
  assert.equal(launchRating(quality).label,label);assert.equal(launchRating(quality).power,power);
 }
});
test('the timing center earns Perfect and equal misses on either side receive the same rating',()=>{
 assert.equal(launchRating(launchQuality(.5)).tier,'perfect');
 for(const position of [0,.1,.2,.3,.4])assert.deepEqual(launchRating(launchQuality(position)),launchRating(launchQuality(1-position)));
});
