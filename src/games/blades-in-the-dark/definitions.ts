export const BITD_SYSTEM_ID = 'blades-in-the-dark';
export const BITD_CREW_SYSTEM_ID = 'blades-in-the-dark-crew';
export const BITD_SCHEMA_VERSION = 1;
export const characterGroups = [
  { id: 'character', label: 'Character' },
  { id: 'actions', label: 'Actions' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'vice', label: 'Vice' },
  { id: 'relationships', label: 'Friends & Rivals' },
  { id: 'loadout', label: 'Loadout' },
  { id: 'stress', label: 'Stress & Trauma' },
  { id: 'harm', label: 'Harm & Healing' },
  { id: 'score', label: 'Score' },
  { id: 'downtime', label: 'Downtime' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const characterSections = characterGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const characterGroupIds = characterGroups.map((x) => x.id);
export const crewGroups = [
  { id: 'crew', label: 'Crew' },
  { id: 'reputation', label: 'Reputation & Lair' },
  { id: 'abilities', label: 'Abilities & Upgrades' },
  { id: 'cohorts', label: 'Cohorts' },
  { id: 'claims', label: 'Claims' },
  { id: 'factions', label: 'Factions' },
  { id: 'scores', label: 'Scores' },
  { id: 'heat', label: 'Heat & Wanted Level' },
  { id: 'coin', label: 'Coin & Tier' },
  { id: 'downtime', label: 'Downtime' },
  { id: 'history', label: 'Campaign History' },
  { id: 'gm', label: 'GM Workspace' },
  { id: 'clocks', label: 'Clocks' },
  { id: 'records', label: 'Records' },
] as const;
export const crewSections = crewGroups.map((x) => ({ ...x, group: x.id }));
export const crewGroupIds = crewGroups.map((x) => x.id);
