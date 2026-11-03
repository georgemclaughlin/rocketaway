import { stepFlight } from './engine.js?v=balanced-journeys';

export const FLIGHT_SPEEDS = [1, 3, 8, 25, 100];

// stepFlight accepts at most one simulated second. Consume the whole frame's
// elapsed time at high speed, preserving its small physics steps and stop rules.
export function advanceFlight(flight, elapsed) {
  if (!Number.isFinite(elapsed)) return;
  for (let remaining = elapsed; remaining > 0 && !flight.done && !flight.pendingEncounter;) {
    const step = Math.min(remaining, 1);
    stepFlight(flight, step);
    remaining -= step;
  }
}
