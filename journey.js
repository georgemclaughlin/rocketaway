import { CHECKPOINTS, milestoneHeight } from './expeditions.js';

export const JOURNEY_NAMES = ['Liftoff', 'Climbing', 'High above', 'Dark skies', 'Deep sky', 'Departure'];
export const altitudeLabel = altitude => `${Number((altitude/1000).toFixed(1))} km`;

// Milestones describe the whole expedition, even while a single flight passes several.
export function journeyState(run, flightPeak = null) {
  let reached = run.stage;
  if (flightPeak !== null) {
    while (reached < CHECKPOINTS.length && flightPeak >= milestoneHeight(run,reached)) reached++;
  }
  const steps = CHECKPOINTS.map((_,index) => ({
    index, name:JOURNEY_NAMES[index], altitude:milestoneHeight(run,index),
    state:index < reached ? 'reached' : index === reached ? 'next' : 'ahead',
  }));
  return {steps,reached,next:steps[reached] || null,goal:steps.at(-1).altitude};
}
export function journeyMarkup(journey) {
  return journey.steps.map(step => `<li class="journey-step" data-state="${step.state}" ${step.state === 'next' ? 'aria-current="step"' : ''} aria-label="Milestone ${step.index+1}: ${step.name}, ${altitudeLabel(step.altitude)}, ${step.state === 'reached' ? 'reached' : step.state === 'next' ? 'next goal' : 'ahead'}"><span class="journey-dot" aria-hidden="true">${step.state === 'reached' ? '✓' : step.index+1}</span><span class="journey-altitude">${altitudeLabel(step.altitude)}</span><span class="journey-place">${step.name}</span></li>`).join('');
}
