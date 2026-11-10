import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorkshop,BENCH,TARGETS,cost,fit,launch,settle,restore,measured,ignition} from '../workshop-model.js';
import {advanceFlight} from '../flight-playback.js';
test('workshop fits atomically, returns full loan value, and preserves ignition on reload',()=>{
 const s=newWorkshop(),before=structuredClone(s);assert.equal(fit(s,{...s.build,engine:'mammoth'}),false);assert.deepEqual(s,before);
 assert.ok(fit(s,{...s.build,tank:'reserve-tank'}));assert.equal(cost(s.build),500);assert.equal(s.budget,500);
 assert.ok(launch(s,1.1));assert.equal(fit(s,before.build),false);const loaded=restore(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded.pending,s.pending);
 const f=measured(loaded.build,0,loaded.pending.quality);assert.ok(settle(loaded,f).gained>1);assert.equal(settle(loaded,f),null);assert.equal(loaded.flights,1);
 assert.equal(restore({...s,version:2}),null);assert.equal(restore({...s,budget:0}),null);
});
test('workshop completes using earned budget at ordinary timing; misses never remove parts',()=>{
 const s=newWorkshop();let launches=0;
 for(const world of [0,1]){s.world=world;while(s.cleared[world]<6&&launches<20){let best;
 for(const engine of BENCH.engine)for(const tank of BENCH.tank)for(const boosters of BENCH.boosters){const b={aero:'lab',engine,tank,boosters};if(cost(b)<=s.budget){const f=measured(b,world,1.1);if(!best||f.peak>best.f.peak)best={b,f};}}
 fit(s,best.b);launch(s,1.1);settle(s,best.f);launches++;}
 assert.equal(s.cleared[world],6);}
 const build={...s.build};launch(s,.9);settle(s,measured(build,1,.9));assert.deepEqual(s.build,build);assert.equal(s.cleared[1],6);
});
test('optimal opening cannot skip Earth; full bench can finish both worlds without research',()=>{
 for(const world of [0,1]){let opening=0,full=0;for(const engine of BENCH.engine)for(const tank of BENCH.tank)for(const boosters of BENCH.boosters){const b={aero:'lab',engine,tank,boosters},peak=measured(b,world,1.2).peak;full=Math.max(full,peak);if(cost(b)<=500)opening=Math.max(opening,peak);}assert.ok(opening<TARGETS[world].at(-1));assert.ok(full>=TARGETS[world].at(-1));}
});
test('workshop fast and ordinary playback produce the same staging and altitude',()=>{
 const b={aero:'lab',engine:'momentum-engine',tank:'reserve-tank',boosters:'twins'},a=ignition(b,1),f=ignition(b,1);
 while(!a.done)advanceFlight(a,1/60);while(!f.done)advanceFlight(f,5);
 assert.equal(a.peak,f.peak);assert.deepEqual(a.events,f.events);
});
