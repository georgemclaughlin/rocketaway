import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlight, newProgram, stepFlight } from '../engine.js';
import { assemblySpecs } from '../parts.js';
import { FLIGHT_SPEEDS, advanceFlight } from '../flight-playback.js';

function moonFlight() {
 const p=newProgram();p.launchWorld=1;p.conditionsVersion=3;
 p.parts.equipped={aero:'needle',tank:'jumbo',engine:'mammoth',boosters:'orbitals'};
 return createFlight(p.levels,1.2,{assembly:assemblySpecs(p)});
}
test('100x playback consumes all five simulated seconds of a 20fps frame',()=>{
 const flight=moonFlight();advanceFlight(flight,.05*100);
 assert.ok(Math.abs(flight.time-5)<1e-9);
});
test('fast playback preserves low-gravity apogee across speeds and slower phone frame rates',()=>{
 const baseline=moonFlight();while(!baseline.done)stepFlight(baseline,1/60);
 for(const speed of FLIGHT_SPEEDS)for(const dt of[1/60,.05]){
  const flight=moonFlight();let frames=0;
  while(!flight.done&&frames++<200000)advanceFlight(flight,dt*speed);
  assert.ok(flight.done,`×${speed} must reach apogee`);
  assert.ok(Math.abs(flight.peak-baseline.peak)<baseline.peak*.001,`×${speed} at ${1/dt}fps preserves altitude`);
  assert.ok(Math.abs(flight.time-baseline.time)<.05,'flight duration remains consistent');
 }
});
test('fast playback stops for encounters and leaves completed flights untouched',()=>{
 const flight=createFlight(newProgram().levels,1.2,{encounterId:1});
 while(!flight.pendingEncounter&&!flight.done)advanceFlight(flight,5);
 assert.ok(flight.pendingEncounter);const paused=structuredClone(flight);
 advanceFlight(flight,5);assert.deepEqual(flight,paused);
 const finished=moonFlight();while(!finished.done)advanceFlight(finished,5);
 const saved=structuredClone(finished);advanceFlight(finished,5);assert.deepEqual(finished,saved);
});

test('irregular phone frames preserve flight outcome when changing speed',()=>{
 const baseline=moonFlight();while(!baseline.done)stepFlight(baseline,.05);
 const flight=moonFlight(),frames=[.013,.021,.008,.05,.017,.033];let i=0;
 while(!flight.done&&i<200000){
  advanceFlight(flight,frames[i%frames.length]*FLIGHT_SPEEDS[Math.floor(i/17)%FLIGHT_SPEEDS.length]);i++;
 }
 assert.ok(flight.done);
 assert.ok(Math.abs(flight.peak-baseline.peak)<baseline.peak*.003,'frame boundary variation stays below 0.3%');
});
