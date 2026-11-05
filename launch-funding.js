// A first departure helps the next fresh rocket without snowballing its budget.
export const FUNDING_CAP=200;
export const fundingFor=(profile,world)=>Number.isInteger(world)&&Number.isFinite(profile.launchFunding?.[world])?Math.max(0,Math.min(FUNDING_CAP,Math.floor(profile.launchFunding[world]))):0;
export const restoreFunding=value=>Array.from({length:9},(_,world)=>Number.isFinite(value?.[world])?Math.max(0,Math.min(FUNDING_CAP,Math.floor(value[world]))):0);
export function reserveLaunchFunding(session,firstWorld) {
  const run=session.active;
  if(run.journeyVersion!==1||!firstWorld||run.difficulty===0||run.difficulty>=8)return 0;
  const amount=Math.min(FUNDING_CAP,Math.floor(run.program.credits/10));
  session.profile.launchFunding??=restoreFunding();
  session.profile.launchFunding[run.difficulty+1]=amount;
  run.program.credits-=amount;
  return amount;
}
