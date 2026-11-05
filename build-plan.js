import { PART_SLOTS, catalogFor, partById } from './parts.js?v=goals-visible-1';

// A workbench is a quote, not inventory. Validate the entire order before spending.
export function planBuild(program, choices = {}) {
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
  return { program: { ...program, parts: { ...program.parts, equipped } }, changes, purchases, cost, affordable: cost <= program.credits };
}

export function fitBuild(program, choices) {
  const plan = planBuild(program, choices);
  if (!plan?.affordable || !plan.changes.length) return null;
  program.credits -= plan.cost;
  program.parts.owned.push(...plan.purchases);
  program.parts.equipped = { ...plan.program.parts.equipped };
  return plan;
}
