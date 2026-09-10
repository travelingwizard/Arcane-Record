export const COC2E_SYSTEM_ID = 'call-of-cthulhu-2e';
export const COC2E_KEEPER_SYSTEM_ID = 'call-of-cthulhu-2e-keeper';
export const COC2E_SCHEMA_VERSION = 1;

export const investigatorGroups = [
  { id: 'investigator', label: 'Investigator' },
  { id: 'characteristics', label: 'Characteristics' },
  { id: 'resources', label: 'Derived Rolls & Resources' },
  { id: 'skills', label: 'Skills' },
  { id: 'sanity', label: 'Sanity & Mythos' },
  { id: 'combat', label: 'Combat' },
  { id: 'equipment', label: 'Equipment & Finances' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const investigatorSections = investigatorGroups.map((x) => ({
  ...x,
  group: x.id,
}));
export const investigatorGroupIds = investigatorGroups.map((x) => x.id);

export const keeperGroups = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'roster', label: 'Investigator Roster' },
  { id: 'investigations', label: 'Investigations' },
  { id: 'clues', label: 'Clues & Handouts' },
  { id: 'mythos', label: 'Keeper Mythos' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'records', label: 'Private Records' },
] as const;
export const keeperSections = keeperGroups.map((x) => ({ ...x, group: x.id }));
export const keeperGroupIds = keeperGroups.map((x) => x.id);
