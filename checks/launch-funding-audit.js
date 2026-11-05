// Exhaustive affordable openings with/without the maximum departure contribution.
// These are simulated possibilities, not player telemetry.
import { newExpeditions,startPrototype } from '../prototype-run.js';
import { milestoneHeight } from '../expeditions.js';
import { FUNDING_CAP,restoreFunding } from '../launch-funding.js';
import { bestAffordable } from './prototype-audit.js';

const rows=[];
for(const seed of [1,7,42,99,2025])for(const kit of ['scrapper','stager','scientist'])for(const rank of [0,5])for(let world=2;world<9;world++) {
  const possibilities=[];
  for(const funding of [0,FUNDING_CAP]) {
    const s=newExpeditions();s.profile.totalGates=6;s.profile.maxDifficulty=world;s.profile.research.levels[kit]=rank;
    s.profile.launchFunding=restoreFunding();s.profile.launchFunding[world]=funding;
    startPrototype(s,{seed,kit,difficulty:world});
    const best=bestAffordable(s.active.program,null,1.2);
    possibilities.push({funding,height:best.height,firstLaunchClear:best.height>=milestoneHeight(s.active,5)});
  }
  rows.push({seed,kit,rank,world,possibilities});
}
console.log(JSON.stringify({cases:rows.length,withoutFunding:rows.filter(r=>r.possibilities[0].firstLaunchClear).length,withFunding:rows.filter(r=>r.possibilities[1].firstLaunchClear).length,fullyResearchedWithFunding:rows.filter(r=>r.rank===5&&r.possibilities[1].firstLaunchClear).length,rows},null,2));
