import { stepFlight } from './engine.js?v=mobile-builder-1';

export const FAST_FORWARD_SECONDS = 6;
const PHYSICS_STEP = 1 / 120;
const remainders = new WeakMap();

// Measure the remaining trajectory once when fast forward starts. Recalculating
// every frame would continually push the finish away instead of reaching it.
export function fastForwardRate(flight) {
  const preview = structuredClone(flight);
  remainders.set(preview, remainders.get(flight) || 0);
  for (let steps = 0; steps < 12000 && !preview.done && !preview.pendingEncounter; steps++) {
    advanceFlight(preview, 1);
  }
  return Math.max(1, (preview.time - flight.time) / FAST_FORWARD_SECONDS);
}

// Fixed physics ticks keep burnout and staging identical when frame timing or
// playback speed changes. Carry partial ticks into the next rendered frame.
export function advanceFlight(flight, elapsed) {
  if (!Number.isFinite(elapsed) || elapsed <= 0 || flight.done || flight.pendingEncounter) return;
  let remaining = elapsed + (remainders.get(flight) || 0);
  while (remaining + 1e-10 >= PHYSICS_STEP && !flight.done && !flight.pendingEncounter) {
    stepFlight(flight, PHYSICS_STEP);
    remaining -= PHYSICS_STEP;
  }
  remainders.set(flight, flight.done || flight.pendingEncounter ? 0 : Math.max(0, remaining));
}
