import { WORLDS } from './worlds.js?v=flight-feel-1';
import { missionPool } from './missions.js?v=flight-feel-1';
import { restoreJournal, JOURNAL_KITS } from './mission-journal.js?v=flight-feel-1';
import { PART_SLOTS, partById, PART_TRAITS } from './parts.js?v=flight-feel-1';

const kitNames={scrapper:'Scrapper',stager:'Stagehand',scientist:'Scientist'};
export function missionJournalMarkup(profile,world=0) {
  world=Number.isInteger(world)&&world>=0&&world<9?world:0;
  const journal=restoreJournal(profile.missionJournal),row=journal.worlds[world];
  const badges=Object.values(journal.worlds).reduce((n,r)=>n+r.kits.length,0);
  return `<section class="mission-journal" aria-label="Flight journal">
    <h3>Flight journal</h3><p class="journal-total">${journal.missions.length} / 36 mission stamps · ${badges} / 27 kit badges</p>
    <p>Replay an unlocked world to collect another mission stamp, clear it with a different kit, or beat your launch record. These goals are optional.</p>
    <div class="science-select"><label for="journal-world">World</label><select id="journal-world">${WORLDS.slice(0,9).map((w,i)=>`<option value="${i}" ${i===world?'selected':''}>${w.name}${i>profile.maxDifficulty?' · Locked':''}</option>`).join('')}</select></div>
    <div class="journal-badges" aria-label="${WORLDS[world].name} kit clear badges">${JOURNAL_KITS.map(kit=>`<span data-earned="${!!row?.kits.includes(kit)}">${row?.kits.includes(kit)?'✓':'○'} ${kitNames[kit]}</span>`).join('')}</div>
    <h4>Mission collection</h4><p>Two missions are offered per attempt. New attempts can offer different pairs; unfinished stamps do not block your journey.</p>
    <ul class="journal-missions">${missionPool(world).map(c=>`<li data-earned="${journal.missions.includes(c.id)}"><strong>${journal.missions.includes(c.id)?'✓':'○'} ${c.name}</strong><span>${c.detail}</span></li>`).join('')}</ul>
    <h4>Winning rockets</h4><p>Fewest launches within this world; lighter winning rockets break ties. Research can improve records. Carried Moon arrivals have their own record.</p>
    ${Object.entries(row?.best||{}).map(([entry,r])=>`<details class="journal-rocket"><summary>${entry==='carried'?'Arrived from Earth':'Fresh start'} · ${r.launches} launch${r.launches===1?'':'es'}<span>${kitNames[r.kit]} · ${r.mass.toFixed(2)} t · Research ${r.rank}/5</span></summary><ul>${PART_SLOTS.map(slot=>{const id=r.equipped[slot.id],trait=PART_TRAITS.find(t=>t.id===r.traits[id]);return `<li><span>${slot.name}</span><strong>${partById(id).name}</strong>${trait?`<small>${trait.name} · ${trait.detail}</small>`:''}</li>`;}).join('')}</ul><p>Saved winning build. View only; your current rocket stays fitted.</p></details>`).join('')||'<p class="journal-empty">Clear this world to save a winning rocket here. Earlier wins remain unlocked; detailed records start with this update.</p>'}
  </section>`;
}
