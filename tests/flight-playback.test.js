import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlight, newProgram, stepFlight } from '../engine.js';
import { assemblySpecs } from '../parts.js';
import { FAST_FORWARD_SECONDS, fastForwardRate, advanceFlight } from '../flight-playback.js';

function worldFlight(world=1,upgraded=true) {
 const p=newProgram();p.launchWorld=world;p.conditionsVersion=3;
 if(upgraded)p.parts.equipped={aero:'needle',tank:'jumbo',engine:'mammoth',boosters:'orbitals'};
 return createFlight(p.levels,1.2,{assembly:assemblySpecs(p)});
}
test('fast forward consumes all simulated seconds of a frame',()=>{
 const flight=worldFlight();advanceFlight(flight,5);
 assert.ok(Math.abs(flight.time-5)<1e-9);
});
test('one fast-forward mode reaches the result in six seconds across world gravity and builds',()=>{
 for(const world of[0,1,3,5,8])for(const upgraded of[false,true])for(const frameTimes of[[1/60],[.05],[.013,.021,.008,.05,.017,.033]]){
  const flight=worldFlight(world,upgraded),saved=structuredClone(flight);
  const rate=fastForwardRate(flight);assert.deepEqual(flight,saved,'preview cannot mutate the real flight');
  const baseline=structuredClone(flight);while(!baseline.done)stepFlight(baseline,1/60);
  let elapsed=0,frames=0;
  while(!flight.done&&elapsed<8){const dt=frameTimes[frames++%frameTimes.length];advanceFlight(flight,dt*rate);elapsed+=dt;}
  assert.ok(flight.done,`world ${world} must finish`);
  assert.ok(Math.abs(elapsed-Math.min(baseline.time,FAST_FORWARD_SECONDS))<.1,`world ${world}: ${elapsed}s`);
  assert.ok(Math.abs(flight.peak-baseline.peak)<1e-6,'playback speed and frame timing cannot change apogee');
 }
});
test('turning fast forward on midway measures remaining flight, and switching off returns to normal',()=>{
 const flight=worldFlight();advanceFlight(flight,40);
 const rate=fastForwardRate(flight),before=flight.time;advanceFlight(flight,.1*rate);
 assert.ok(flight.time-before>1,'fast forward advances the long coast');
 const normalStart=flight.time;advanceFlight(flight,.1);assert.ok(Math.abs(flight.time-normalStart-.1)<1e-8);
 const resumedRate=fastForwardRate(flight);let elapsed=0;
 while(!flight.done&&elapsed<8){advanceFlight(flight,.02*resumedRate);elapsed+=.02;}
 assert.ok(flight.done);assert.ok(Math.abs(elapsed-FAST_FORWARD_SECONDS)<.1);
});
test('fast playback stops for encounters and leaves completed flights untouched',()=>{
 const flight=createFlight(newProgram().levels,1.2,{encounterId:1});
 while(!flight.pendingEncounter&&!flight.done)advanceFlight(flight,5);
 assert.ok(flight.pendingEncounter);const paused=structuredClone(flight);
 fastForwardRate(flight);advanceFlight(flight,5);assert.deepEqual(flight,paused);
 const finished=worldFlight();while(!finished.done)advanceFlight(finished,5);
 const saved=structuredClone(finished);advanceFlight(finished,5);assert.deepEqual(finished,saved);
});
