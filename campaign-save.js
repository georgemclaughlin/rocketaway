// Two campaigns share the existing save key without replacing either one's progress.
import { newExpeditions, restoreSession } from './prototype-run.js?v=mobile-builder-1';

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
  restoreSession(legacy);
  const session = restoreSession(original ? legacy : roguelite);
  if (!original) session.prototypeVersion = 1;
  return { session, other: structuredClone((original ? roguelite : legacy) || newExpeditions()) };
}

export function packCampaignSave(session, other, original = false) {
  const roguelite = original ? other : session;
  const legacy = original ? session : other;
  return { ...roguelite, prototypeVersion: 1, campaignSaveVersion: 1, originalCampaign: legacy };
}
