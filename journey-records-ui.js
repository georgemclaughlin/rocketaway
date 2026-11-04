import { worldFor } from './worlds.js?v=roguelite-live-1';
export function journeyRecordsMarkup(profile) {
  const records=profile.flightRecords;
  const stats=[
    ['launches',records.launches.toLocaleString(),records.partial?'Recorded launches':'Total launches'],
    ['highest',`${(records.highestAltitude/1000).toLocaleString(undefined,{maximumFractionDigits:1})} <small>km</small>`,records.launches?`Highest flight · ${worldFor({difficulty:records.highestWorld}).name}`:'Highest flight'],
    ['perfect',records.perfectLaunches.toLocaleString(),'Perfect launches'],
    ['worlds',Array.isArray(profile.prototypeWorlds)?`${profile.prototypeWorlds.length} / 2`:`${profile.campaignComplete?9:profile.maxDifficulty} / 9`,'Worlds cleared'],
    ['expeditions',profile.runs.toLocaleString(),'Expeditions'],
    ['upgrades',Object.values(profile.research.levels).reduce((sum,n)=>sum+n,0).toLocaleString(),'Research upgrades'],
  ];
  return `<div class="finale-stats" aria-label="Your journey records">${stats.map(([id,value,label])=>`<div data-record="${id}"><b>${value}</b><span>${label}</span></div>`).join('')}</div>`;
}
