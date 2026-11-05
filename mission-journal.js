// Bounded, permanent collection records. No storage or DOM dependencies.
import { missionPool } from './missions.js?v=flight-feel-1';
import { PART_SLOTS, partById, assemblySpecs, restorePartTraits } from './parts.js?v=flight-feel-1';

export const JOURNAL_KITS=['scrapper','stager','scientist'];
const int=(value,max=1e9)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
const missionIds=Array.from({length:9},(_,world)=>missionPool(world)).flat().map(c=>c.id);

function restoreRocket(raw) {
  if(!raw||!JOURNAL_KITS.includes(raw.kit)||!Number.isInteger(raw.launches)||raw.launches<1||raw.launches>1e9||!Number.isFinite(raw.mass)||raw.mass<=0||raw.mass>100)return null;
  if(!PART_SLOTS.every(slot=>partById(raw.equipped?.[slot.id])?.slot===slot.id))return null;
  return {launches:raw.launches,mass:raw.mass,kit:raw.kit,rank:int(raw.rank,5),seed:int(raw.seed,4294967295),
    equipped:Object.fromEntries(PART_SLOTS.map(slot=>[slot.id,raw.equipped[slot.id]])),traits:restorePartTraits(raw.traits)};
}
export function restoreJournal(raw) {
  const journal={version:1,missions:missionIds.filter(id=>Array.isArray(raw?.missions)&&raw.missions.includes(id)),worlds:{}};
  for(let world=0;world<9;world++) {
    const row=raw?.worlds?.[world];if(!row||typeof row!=='object')continue;
    const best={};
    for(const entry of ['fresh','carried']) {
      if(entry==='carried'&&world!==1)continue;
      const rocket=restoreRocket(row.best?.[entry]);if(rocket)best[entry]=rocket;
    }
    journal.worlds[world]={clears:int(row.clears),kits:JOURNAL_KITS.filter(kit=>Array.isArray(row.kits)&&row.kits.includes(kit)),best};
  }
  return journal;
}
export function recordMission(profile,id) {
  profile.missionJournal??=restoreJournal();
  if(!missionIds.includes(id)||profile.missionJournal.missions.includes(id))return false;
  profile.missionJournal.missions=missionIds.filter(key=>key===id||profile.missionJournal.missions.includes(key));return true;
}
export function recordWorldClear(profile,run) {
  profile.missionJournal??=restoreJournal();
  const row=profile.missionJournal.worlds[run.difficulty]??={clears:0,kits:[],best:{}};
  row.clears=int(row.clears+1);
  row.kits=JOURNAL_KITS.filter(kit=>kit===run.kit||row.kits.includes(kit));
  // Old carried saves do not contain the Earth/Moon launch boundary.
  // Keep their badges, but do not invent a competitive launch count.
  if(!Number.isInteger(run.worldStartFlights))return false;
  const launches=run.program.flights-run.worldStartFlights;
  if(launches<1)return false;
  const entry=run.difficulty===1&&run.startWorld===0?'carried':'fresh';
  const mass=assemblySpecs(run.program).mass,previous=row.best[entry];
  if(previous&&(previous.launches<launches||(previous.launches===launches&&previous.mass<=mass)))return false;
  row.best[entry]={launches,mass,kit:run.kit,rank:int(run.program.research?.rank,5),seed:run.seed,
    equipped:structuredClone(run.program.parts.equipped),traits:restorePartTraits(run.program.partTraits)};
  return true;
}
