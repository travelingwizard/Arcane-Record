export const BOB_SYSTEM_ID = 'band-of-blades';
export const BOB_LEGION_SYSTEM_ID = 'band-of-blades-legion';
export const BOB_CHOSEN_SYSTEM_ID = 'band-of-blades-chosen';
export const BOB_SCHEMA_VERSION = 1;

export const characterGroups = [
  { id: 'character', label: 'Character' },
  { id: 'actions', label: 'Actions' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'loadout', label: 'Loadout' },
  { id: 'stress', label: 'Stress & Trauma' },
  { id: 'harm', label: 'Harm & Corruption' },
  { id: 'mission', label: 'Mission' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const characterSections = characterGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const characterGroupIds = characterGroups.map((x) => x.id);

export const legionGroups = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'personnel', label: 'Personnel & Squads' },
  { id: 'missions', label: 'Missions' },
  { id: 'commander', label: 'Commander' },
  { id: 'marshal', label: 'Marshal' },
  { id: 'quartermaster', label: 'Quartermaster' },
  { id: 'lorekeeper', label: 'Lorekeeper' },
  { id: 'spymaster', label: 'Spymaster' },
  { id: 'divine', label: 'Chosen & Broken' },
  { id: 'clocks', label: 'Clocks' },
  { id: 'history', label: 'Campaign History' },
  { id: 'records', label: 'Records' },
] as const;
export const legionSections = legionGroups.map((x) => ({ ...x, group: x.id }));
export const legionGroupIds = legionGroups.map((x) => x.id);

export const chosenGroups = [
  { id: 'identity', label: 'Chosen' },
  { id: 'favor', label: 'Favor & Abilities' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'mission', label: 'Starting Mission' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const chosenSections = chosenGroups.map((x) => ({ ...x, group: x.id }));
export const chosenGroupIds = chosenGroups.map((x) => x.id);
