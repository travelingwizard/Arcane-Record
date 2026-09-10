export const DRAGONBANE_SYSTEM_ID = 'dragonbane';
export const DRAGONBANE_SCHEMA_VERSION = 1;

export const dragonbaneGroupIds = [
  'character',
  'attributes',
  'skills',
  'abilities',
  'equipment',
  'weapons',
  'conditions',
  'health',
  'adventure',
  'advancement',
  'records',
] as const;

export const dragonbaneGroups = dragonbaneGroupIds.map((id) => ({
  id,
  label:
    id === 'health' ? 'Health & Willpower' : id[0]!.toUpperCase() + id.slice(1),
}));

export const dragonbaneSections = dragonbaneGroups.map((group) => ({
  id: group.id,
  label:
    group.id === 'attributes'
      ? 'Attributes & Derived Ratings'
      : group.id === 'abilities'
        ? 'Abilities & Spells'
        : group.id === 'equipment'
          ? 'Equipment & Encumbrance'
          : group.id === 'weapons'
            ? 'Weapons & Armor'
            : group.label,
  group: group.id,
}));
