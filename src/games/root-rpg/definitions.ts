export const ROOT_SYSTEM_ID = 'root-rpg';
export const ROOT_CAMPAIGN_SYSTEM_ID = 'root-rpg-campaign';
export const ROOT_SCHEMA_VERSION = 1;
export const vagabondGroups = [
  { id: 'character', label: 'Character' },
  { id: 'stats', label: 'Stats' },
  { id: 'nature-drives', label: 'Nature & Drives' },
  { id: 'moves', label: 'Moves' },
  { id: 'feats', label: 'Feats & Weapon Skills' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'connections', label: 'Connections' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'harm', label: 'Harm' },
  { id: 'jobs', label: 'Jobs & Travel' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const campaignGroups = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'band', label: 'Band' },
  { id: 'clearings', label: 'Clearings' },
  { id: 'factions', label: 'Factions' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'travel', label: 'Travel' },
  { id: 'clocks', label: 'Clocks' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'records', label: 'Records' },
] as const;
export const vagabondSections = vagabondGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const campaignSections = campaignGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const vagabondGroupIds = vagabondGroups.map((x) => x.id);
export const campaignGroupIds = campaignGroups.map((x) => x.id);
