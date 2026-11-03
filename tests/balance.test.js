import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFirstLaunches } from '../checks/balance-audit.js';
import { newExpeditions, startExpedition, milestoneHeight } from '../expeditions.js';
import { assemblySpecs } from '../parts.js';

test('fully researched optimal first-launch builds rarely clear whole worlds, even with perfect timing',()=>{
 const old=auditFirstLaunches(2),current=auditFirstLaunches();
 assert.equal(old.cases,135);assert.equal(current.cases,135);
 assert.equal(old.clears,65,'reproduce the reported previous-balance problem');
 assert.ok(current.clears<=15,`${current.clears} first-launch clears out of135`);
 assert.ok(current.clears<old.clears/4,'improvement must hold for optimal spending, not just a cautious bot');
 for(const row of current.rows.filter(row=>row.world!=='Earth'))assert.ok(row.clears<=3,`${row.world}: ${row.clears}/${row.cases}`);
});
test('research keeps its physics benefits and goals are fixed rather than scaling up with player strength',()=>{
 for(let world=0;world<9;world++)for(const kit of['scrapper','stager','scientist']){
  const goals=[];
  for(const rank of[0,5]){
   const s=newExpeditions();s.profile.maxDifficulty=8;s.profile.totalGates=48;s.profile.research.levels[kit]=rank;startExpedition(s,{seed:42,difficulty:world,kit});
   goals.push(milestoneHeight(s.active,5));const p=s.active.program;
   assert.deepEqual(assemblySpecs(p),assemblySpecs({...p,conditionsVersion:2}),'earned power must not be nerfed');
  }
  assert.equal(goals[0],goals[1],'upgrading research cannot move the goal');
 }
});
