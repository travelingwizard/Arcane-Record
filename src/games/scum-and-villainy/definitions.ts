export const SANDV_SYSTEM_ID = 'scum-and-villainy';
export const SANDV_SHIP_SYSTEM_ID = 'scum-and-villainy-ship';
export const SANDV_SCHEMA_VERSION = 1;
export const characterGroupIds = [
  'character',
  'actions',
  'abilities',
  'vice',
  'loadout',
  'stress-harm',
  'job',
  'downtime',
  'advancement',
  'records',
] as const;
export const shipGroupIds = [
  'ship',
  'crew',
  'systems',
  'upgrades',
  'damage',
  'jobs',
  'heat',
  'factions',
  'downtime',
  'clocks',
  'records',
] as const;
const groups = (ids: readonly string[]) =>
  ids.map((id) => ({
    id,
    label: id
      .split('-')
      .map((x) => x[0]!.toUpperCase() + x.slice(1))
      .join(' & '),
  }));
export const characterGroups = groups(characterGroupIds),
  shipGroups = groups(shipGroupIds);
export const characterSections = characterGroups.map((x) => ({
    ...x,
    group: x.id,
  })),
  shipSections = shipGroups.map((x) => ({ ...x, group: x.id }));
