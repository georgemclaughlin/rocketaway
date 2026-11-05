import { launchRating } from './launch-feedback.js?v=build-story-1';

const count=(value,max=1e9)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
export const newFlightRecords=()=>({launches:0,perfectLaunches:0,highestAltitude:0,highestWorld:0,partial:false});

export function restoreFlightRecords(raw,run,runs=0) {
 const completed=count(run?.program.flights),unsettled=Number.isFinite(run?.launchQuality)&&['flying','lost'].includes(run?.status);
 const knownLaunches=completed+Number(unsettled);
 const best=count(run?.program.best),world=count(run?.difficulty,8);
 if(raw&&typeof raw==='object'&&['launches','perfectLaunches','highestAltitude'].every(key=>Number.isFinite(raw[key]))) {
  const launches=Math.max(count(raw.launches),knownLaunches);
  return {launches,perfectLaunches:Math.min(launches,count(raw.perfectLaunches)),highestAltitude:Math.max(count(raw.highestAltitude),best),highestWorld:best>count(raw.highestAltitude)?world:count(raw.highestWorld,8),partial:raw.partial===true};
 }
 // Earlier versions retained only the current rocket's count, best flight, and last result.
 const lastPower=run?.lastResult?.power;
 const perfectLaunches=Math.min(knownLaunches,Number(completed>0&&lastPower>=118)+Number(unsettled&&launchRating(run.launchQuality).tier==='perfect'));
 const partial=runs>(run?1:0)||completed>1||(completed===1&&!Number.isFinite(lastPower));
 return {launches:knownLaunches,perfectLaunches,highestAltitude:best,highestWorld:world,partial};
}

export function recordLaunch(profile,quality) {
 profile.flightRecords.launches++;
 if(launchRating(quality).tier==='perfect')profile.flightRecords.perfectLaunches++;
}

export function recordFlightPeak(profile,altitude,world) {
 if(altitude>profile.flightRecords.highestAltitude) {
  profile.flightRecords.highestAltitude=count(altitude);
  profile.flightRecords.highestWorld=count(world,8);
 }
}
