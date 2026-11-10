// Two campaigns share the existing save key without replacing either one's progress.
import { newExpeditions, restoreSession, PROTOTYPE_VERSION } from './prototype-run.js?v=discovery-4';

export function openCampaignSave(raw, original = false) {
  if (raw?.campaignSaveVersion !== undefined && raw.campaignSaveVersion !== 1) {
    throw Error('This save needs a newer game build.');
  }
  let roguelite = null, legacy = null;
  if (raw?.campaignSaveVersion === 1) {
    const { originalCampaign, campaignSaveVersion, ...current } = raw;
    roguelite = current;
    legacy = originalCampaign;
  } else if (raw?.prototypeVersion !== undefined) roguelite = raw;
  else legacy = raw;
  // Validate both before permitting a write, including the inactive campaign.
  restoreSession(roguelite);
  const previous=restoreSession(legacy);
  const session = restoreSession(original ? legacy : roguelite);
  if (!original) {
    session.prototypeVersion = PROTOTYPE_VERSION;
    session.progressImportVersion = 1;
    if (!roguelite?.progressImportVersion) {
      const next=Math.max(session.profile.maxDifficulty,previous.profile.maxDifficulty);
      session.profile.maxDifficulty=next;
      session.profile.totalGates=Math.max(session.profile.totalGates,previous.profile.totalGates);
      const cleared=Array.from({length:previous.profile.maxDifficulty},(_,world)=>world);
      if(previous.profile.campaignComplete)cleared.push(8);
      session.profile.prototypeWorlds=[...new Set([...(session.profile.prototypeWorlds||[]),...cleared])].sort((a,b)=>a-b);
      if(previous.profile.campaignComplete)session.profile.campaignComplete=true;
      // Present the next launchpad while retaining the current rocket until a choice is made.
      if(session.active&&next>session.active.difficulty&&!['won','lost'].includes(session.active.status))session.pendingWorld=next;
    }
  }
  return { session, other: structuredClone((original ? roguelite : legacy) || newExpeditions()) };
}

export function packCampaignSave(session, other, original = false) {
  const roguelite = original ? other : session;
  const legacy = original ? session : other;
  return { ...roguelite, prototypeVersion: PROTOTYPE_VERSION, campaignSaveVersion: 1, originalCampaign: legacy };
}

// An interrupted flight must resume with its saved rocket and timing first.
export function hasNextWorldOffer(session) {
  return Number.isInteger(session.pendingWorld)&&session.active&&['build','debrief'].includes(session.active.status)&&session.pendingWorld>session.active.difficulty;
}
