import test from 'node:test';
import assert from 'node:assert/strict';
import {newExpeditions,startExpedition,beginExpeditionFlight,settleExpedition,continueExpedition,abandonExpedition,restoreExpeditions} from '../expeditions.js';
import {restoreFlightRecords} from '../flight-records.js';
const copy=value=>JSON.parse(JSON.stringify(value));
const land=(session,peak)=>settleExpedition(session,{done:true,peak,payMultiplier:1});

test('launches count at ignition once, including misses and abandoned flights, across worlds and reloads',()=>{
 let s=newExpeditions();startExpedition(s,{seed:1});
 assert.equal(s.profile.flightRecords.launches,0);
 assert.equal(beginExpeditionFlight(s,1.2),true);assert.equal(beginExpeditionFlight(s,1.2),false);
 s=restoreExpeditions(copy(s));assert.equal(s.profile.flightRecords.launches,1);assert.equal(beginExpeditionFlight(s,1.2),false);
 land(s,1000);assert.equal(land(s,200000),null);continueExpedition(s);
 beginExpeditionFlight(s,1.1);land(s,200000);
 startExpedition(s,{seed:2,difficulty:1});beginExpeditionFlight(s,1.18);abandonExpedition(s);
 assert.deepEqual(s.profile.flightRecords,{launches:3,perfectLaunches:2,highestAltitude:200000,highestWorld:0,partial:false});
 s=restoreExpeditions(copy(s));startExpedition(s,{seed:3,difficulty:1});beginExpeditionFlight(s,1.04);land(s,300000);
 assert.equal(s.profile.flightRecords.highestAltitude,300000);assert.equal(s.profile.flightRecords.highestWorld,1);assert.equal(s.profile.flightRecords.launches,4);
 assert.equal(newExpeditions().profile.flightRecords.launches,0);
});

test('legacy records recover only known flights, stay partial, and never add the same history twice',()=>{
 const s=newExpeditions();startExpedition(s,{seed:1});beginExpeditionFlight(s,1.2);land(s,200000);
 startExpedition(s,{seed:2,difficulty:1});beginExpeditionFlight(s,1.2);land(s,1000);continueExpedition(s);beginExpeditionFlight(s,1.2);
 delete s.profile.flightRecords;
 let restored=restoreExpeditions(copy(s));
 assert.deepEqual(restored.profile.flightRecords,{launches:2,perfectLaunches:2,highestAltitude:1000,highestWorld:1,partial:true});
 const once=copy(restored.profile.flightRecords);restored=restoreExpeditions(copy(restored));assert.deepEqual(restored.profile.flightRecords,once);
 land(restored,250000);continueExpedition(restored);assert.equal(restored.profile.flightRecords.launches,2);
 startExpedition(restored,{seed:3,difficulty:0});beginExpeditionFlight(restored,1.1);
 assert.equal(restored.profile.flightRecords.launches,3);assert.equal(restored.profile.flightRecords.highestAltitude,250000);assert.equal(restored.profile.flightRecords.partial,true);
});

test('old empty saves are complete zero records, and corrupt values stay bounded',()=>{
 const old=newExpeditions();delete old.profile.flightRecords;assert.equal(restoreExpeditions(copy(old)).profile.flightRecords.partial,false);
 const raw={launches:-10,perfectLaunches:999,highestAltitude:-5,highestWorld:30};
 assert.deepEqual(restoreFlightRecords(raw,null),{launches:0,perfectLaunches:0,highestAltitude:0,highestWorld:8,partial:false});
 old.profile.runs=8;assert.equal(restoreExpeditions(copy(old)).profile.flightRecords.partial,true);
});
