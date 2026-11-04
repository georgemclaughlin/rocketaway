import { catalogFor } from './parts.js?v=roguelite-prototype-1';
import { estimateHeight, previewPart } from './builder.js?v=roguelite-prototype-1';
import { buildExperiment } from './part-insights.js?v=roguelite-prototype-1';
import { altitudeLabel } from './journey.js?v=roguelite-prototype-1';

export function missedFlightAdvice(run,result) {
 const perfect=estimateHeight(run.program,1.2),shortfall=Math.max(0,result.target-result.altitude),misses=Math.max(0,3-run.strikes);
 const summary=`${altitudeLabel(shortfall)} short · ${misses} ${misses===1?'miss':'misses'} left.`;
 if(run.status==='lost')return {kind:'ended',summary,advice:'Your research and unlocked worlds stay with you. Try a different build on your next attempt.'};
 if(perfect>=result.target)return {kind:'timing',summary,advice:'Gold timing could reach this goal. Aim for the center, or refit for more margin.'};
 // Look for a real available improvement, but suggest an experiment rather than
 // prescribing the optimal part. Advice must never recommend an unstocked item.
 const options=catalogFor(run.program).filter(p=>p.id!==run.program.parts.equipped[p.slot]&&(run.program.parts.owned.includes(p.id)||(run.program.stock.includes(p.id)&&p.price<=run.program.credits)))
  .map(p=>({part:p,preview:previewPart(run.program,p.id)}))
  .filter(p=>p.preview.height>p.preview.previousHeight*1.01)
  .sort((a,b)=>b.preview.height-a.preview.height);
 const experiment=options.length?buildExperiment(run.program,options[0].part.id):'Compare weight, fuel and thrust before the next launch.';
 return {kind:'build',summary,advice:`Better timing alone won’t reach this goal. ${experiment}`};
}

export function progressTitle(result) {
 const count=result.cleared.length;
 if(count>1)return `${count} milestones in one launch!`;
 if(count===1&&result.stage===1)return 'Your first milestone!';
 if(count===1)return 'Another milestone reached!';
 return result.record&&result.improvement>=10?'A new best. Keep building.':'Refit. Try again.';
}
