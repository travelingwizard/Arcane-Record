export const MM_SYSTEM_ID = 'miseries-and-misfortunes';
export const MM_CAMPAIGN_SYSTEM_ID = 'miseries-and-misfortunes-campaign';
export const MM_SCHEMA_VERSION = 1;
export const characterGroups = [
  { id: 'character', label: 'Character' },
  { id: 'birth', label: 'Birth & Station' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'lifepaths', label: 'Lifepaths' },
  { id: 'mentalities', label: 'Mentalities & Languages' },
  { id: 'reputation', label: 'Reputation & Precedence' },
  { id: 'fortune', label: 'Fortune & Mortal Coil' },
  { id: 'virtues', label: 'Virtues & Flaws' },
  { id: 'sacred', label: 'Sacred & Profane' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'combat', label: 'Combat' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const characterSections = characterGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const characterGroupIds = characterGroups.map((x) => x.id);
export const campaignGroups = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'motif', label: 'Motif' },
  { id: 'protagonists', label: 'Protagonists' },
  { id: 'moments', label: 'Moments & Plots' },
  { id: 'factions', label: 'Factions & Politics' },
  { id: 'favor', label: 'Favor & Patrons' },
  { id: 'history', label: 'Campaign History' },
  { id: 'records', label: 'Records' },
] as const;
export const campaignSections = campaignGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const campaignGroupIds = campaignGroups.map((x) => x.id);
