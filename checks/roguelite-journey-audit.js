// Earned later-world starts, exhaustive affordable build comparisons at each refit.
import { earnedPrototype } from './prototype-audit.js';
const rows=[];
for(const seed of [1,7,42,99,2025])for(const kit of ['scrapper','stager','scientist'])for(const rank of [0,5])for(let world=2;world<9;world++) {
  const result=earnedPrototype({seed,kit,rank,world,endWorld:world,policy:'contracts'});
  rows.push({seed,kit,rank,world,status:result.status,launches:result.launches.length,firstLaunchClear:result.status==='won'&&result.launches.length===1});
}
console.log(JSON.stringify({cases:rows.length,completed:rows.filter(r=>r.status==='won').length,firstLaunchClears:rows.filter(r=>r.firstLaunchClear).length,rows},null,2));
