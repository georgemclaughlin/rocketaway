import { PART_SLOTS, catalogFor, partById } from './parts.js?v=component-research-1';
import { componentNode, normalizeTunings } from './component-research.js?v=component-research-1';

// A workbench is a quote, not inventory. Validate the entire order before spending.
export function planBuild(program, choices = {}, tuningChoices = {}) {
  const catalog = catalogFor(program), equipped = { ...program.parts.equipped };
  for (const slot of PART_SLOTS) {
    const id = choices[slot.id] ?? equipped[slot.id], part = partById(id);
    if (part?.slot !== slot.id || !catalog.some(p => p.id === id)) return null;
    if (!program.parts.owned.includes(id) && Array.isArray(program.stock) && !program.stock.includes(id)) return null;
    equipped[slot.id] = id;
  }
  const changes = PART_SLOTS.filter(slot => equipped[slot.id] !== program.parts.equipped[slot.id]).map(slot => equipped[slot.id]);
  const purchases = changes.filter(id => !program.parts.owned.includes(id));
  const cost = purchases.reduce((sum, id) => sum + partById(id).price, 0);
  const compatible = program.componentResearchVersion === 1 && program.rulesVersion === 1;
  const tunings = normalizeTunings(program.tunings, program.componentResearch);
  for (const [slot, id] of Object.entries(tuningChoices)) {
    if (!compatible || !PART_SLOTS.some(part => part.id === slot)) return null;
    if (id !== 'standard' && (componentNode(id)?.slot !== slot || componentNode(id)?.kind !== 'tuning' || normalizeTunings({...tunings,[slot]:id},program.componentResearch)[slot] !== id)) return null;
    tunings[slot] = id;
  }
  const tuningChanges = compatible ? PART_SLOTS.filter(slot => tunings[slot.id] !== (program.tunings?.[slot.id] || 'standard')).map(slot => slot.id) : [];
  return { program: { ...program, parts: { ...program.parts, equipped }, ...(compatible ? {tunings} : {}) }, changes, tuningChanges, changeCount: changes.length+tuningChanges.length, purchases, cost, affordable: cost <= program.credits };
}

export function fitBuild(program, choices, tuningChoices = {}) {
  const plan = planBuild(program, choices, tuningChoices);
  if (!plan?.affordable || !plan.changeCount) return null;
  program.credits -= plan.cost;
  program.parts.owned.push(...plan.purchases);
  program.parts.equipped = { ...plan.program.parts.equipped };
  if (program.componentResearchVersion === 1) program.tunings = { ...plan.program.tunings };
  return plan;
}
