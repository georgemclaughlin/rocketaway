// Exhaustive affordable first-launch builds, not player telemetry or an earned-run policy.
import { newExpeditions,startPrototype } from '../prototype-run.js';
import { milestoneHeight } from '../expeditions.js';
import { bestAffordable } from './prototype-audit.js';

const rows=[];
for(const equipmentVersion of [1,2])for(const seed of [1,7,42,99,2025])for(const kit of ['scrapper','stager','scientist'])for(const rank of [0,5])for(let world=0;world<9;world++) {
 const s=newExpeditions();s.profile.totalGates=6;s.profile.maxDifficulty=world;s.profile.research.levels[kit]=rank;
 startPrototype(s,{seed,kit,difficulty:world,equipmentVersion});
 const best=bestAffordable(s.active.program,null,1.2),firstLaunchClear=best.height>=milestoneHeight(s.active,5);
 rows.push({equipmentVersion,seed,kit,rank,world,height:Math.floor(best.height),cost:best.cost,parts:best.ids,firstLaunchClear});
}
const summaries=[1,2].map(equipmentVersion=>({equipmentVersion,cases:rows.filter(r=>r.equipmentVersion===equipmentVersion).length,
 firstLaunchClears:rows.filter(r=>r.equipmentVersion===equipmentVersion&&r.firstLaunchClear).length,
 fullyResearchedClears:rows.filter(r=>r.equipmentVersion===equipmentVersion&&r.rank===5&&r.firstLaunchClear).length,
 clearWorlds:rows.filter(r=>r.equipmentVersion===equipmentVersion&&r.firstLaunchClear).map(r=>r.world),
}));
console.log(JSON.stringify({summaries,rows},null,2));
