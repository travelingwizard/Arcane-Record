export const EXALTED1E_SYSTEM_ID = 'exalted1e' as const;
export const EXALTED1E_SCHEMA_VERSION = 7 as const;

/**
 * Legal `sheetType` values for a STORED character. `'abyssal'` is included
 * here so the schema can validate a blank Abyssal character (see
 * `createBlankExaltedCharacter`/tests), even though Abyssal has no
 * creator/editor UI yet -- `definition.tsx`'s `variants` array (the thing
 * that actually exposes a sheet type to end users) intentionally does not
 * list `'abyssal'`. See `plannedExaltedFamilies` below for the family-level
 * release gate that keeps it locked in the UI.
 */
export const exaltedSheetTypes = [
  'solar',
  'dragon-blooded',
  'abyssal',
] as const;
export type ExaltedSheetType = (typeof exaltedSheetTypes)[number];

/**
 * Splats that are planned for Exalted First Edition but have no schema,
 * catalog, creator, or editor yet. These IDs are never valid persisted
 * `sheetType` values — `exaltedSheetTypes` above is the only enum a stored
 * character can use. They exist solely so the certification gate
 * (`./verification.ts`) and the source audit script have a stable, shared
 * identifier per family while that family's real implementation is pending.
 */
export const plannedExaltedFamilies = [
  'lunar',
  'abyssal',
  'sidereal',
  'alchemical',
  'fair-folk',
] as const;
export type PlannedExaltedFamily = (typeof plannedExaltedFamilies)[number];

export const plannedExaltedFamilyLabels: Record<PlannedExaltedFamily, string> =
  {
    lunar: 'Lunar',
    abyssal: 'Abyssal',
    sidereal: 'Sidereal',
    alchemical: 'Alchemical',
    'fair-folk': 'Fair Folk',
  };

export const exaltedSectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'exalted', label: 'Exalted' },
  { id: 'combat', label: 'Combat' },
  { id: 'resources', label: 'Resources' },
  { id: 'advancement', label: 'Advancement' },
] as const;

export type ExaltedSectionGroupId = (typeof exaltedSectionGroups)[number]['id'];

export const exaltedSectionGroupIds = exaltedSectionGroups.map(
  ({ id }) => id,
) as ExaltedSectionGroupId[];

export const exaltedSections = [
  {
    id: 'exalted-identity',
    label: 'Character',
    group: 'character',
  },
  {
    id: 'exalted-attributes',
    label: 'Attributes',
    group: 'character',
  },
  {
    id: 'exalted-abilities',
    label: 'Abilities',
    group: 'character',
  },
  {
    id: 'exalted-languages',
    label: 'Languages',
    group: 'character',
  },
  {
    id: 'exalted-backgrounds',
    label: 'Backgrounds',
    group: 'character',
  },
  {
    id: 'exalted-advantages',
    label: 'Advantages',
    group: 'exalted',
  },
  {
    id: 'exalted-merits-flaws',
    label: 'Merits & Flaws',
    group: 'character',
  },
  {
    id: 'exalted-derangements',
    label: 'Derangements',
    group: 'character',
  },
  {
    id: 'exalted-charms-sorcery',
    label: 'Charms & Sorcery',
    group: 'exalted',
  },
  {
    id: 'exalted-equipment',
    label: 'Equipment',
    group: 'resources',
  },
  {
    id: 'exalted-combat',
    label: 'Combat',
    group: 'combat',
  },
  {
    id: 'exalted-combos',
    label: 'Combos',
    group: 'combat',
  },
  {
    id: 'exalted-possessions',
    label: 'Possessions',
    group: 'resources',
  },
  {
    id: 'exalted-experience',
    label: 'Experience',
    group: 'advancement',
  },
  {
    id: 'exalted-history-description',
    label: 'History & Description',
    group: 'advancement',
  },
] as const;

export type ExaltedSectionId = (typeof exaltedSections)[number]['id'];

export const defaultExaltedSectionGroupOrder: ExaltedSectionGroupId[] = [
  'character',
  'exalted',
  'combat',
  'resources',
  'advancement',
];

export const exaltedAttributeGroups = [
  {
    id: 'physical',
    label: 'Physical',
    traits: [
      { id: 'strength', label: 'Strength' },
      { id: 'dexterity', label: 'Dexterity' },
      { id: 'stamina', label: 'Stamina' },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    traits: [
      { id: 'charisma', label: 'Charisma' },
      { id: 'manipulation', label: 'Manipulation' },
      { id: 'appearance', label: 'Appearance' },
    ],
  },
  {
    id: 'mental',
    label: 'Mental',
    traits: [
      { id: 'perception', label: 'Perception' },
      { id: 'intelligence', label: 'Intelligence' },
      { id: 'wits', label: 'Wits' },
    ],
  },
] as const;

export type ExaltedAttributeGroupId =
  (typeof exaltedAttributeGroups)[number]['id'];
export type ExaltedAttributeId =
  (typeof exaltedAttributeGroups)[number]['traits'][number]['id'];

export const exaltedAbilities = [
  { id: 'archery', label: 'Archery' },
  { id: 'athletics', label: 'Athletics' },
  { id: 'awareness', label: 'Awareness' },
  { id: 'brawl', label: 'Brawl' },
  { id: 'bureaucracy', label: 'Bureaucracy' },
  { id: 'craft', label: 'Craft' },
  { id: 'dodge', label: 'Dodge' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'larceny', label: 'Larceny' },
  { id: 'linguistics', label: 'Linguistics' },
  { id: 'lore', label: 'Lore' },
  { id: 'martialArts', label: 'Martial Arts' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'melee', label: 'Melee' },
  { id: 'occult', label: 'Occult' },
  { id: 'performance', label: 'Performance' },
  { id: 'presence', label: 'Presence' },
  { id: 'resistance', label: 'Resistance' },
  { id: 'ride', label: 'Ride' },
  { id: 'sail', label: 'Sail' },
  { id: 'socialize', label: 'Socialize' },
  { id: 'stealth', label: 'Stealth' },
  { id: 'survival', label: 'Survival' },
  { id: 'thrown', label: 'Thrown' },
] as const;

export type ExaltedAbilityId = (typeof exaltedAbilities)[number]['id'];

type AbilityGroup = {
  id: string;
  label: string;
  abilityIds: readonly ExaltedAbilityId[];
};

export const solarAbilityGroups: readonly AbilityGroup[] = [
  {
    id: 'dawn',
    label: 'Dawn',
    abilityIds: ['archery', 'brawl', 'martialArts', 'melee', 'thrown'],
  },
  {
    id: 'zenith',
    label: 'Zenith',
    abilityIds: [
      'endurance',
      'performance',
      'presence',
      'resistance',
      'survival',
    ],
  },
  {
    id: 'twilight',
    label: 'Twilight',
    abilityIds: ['craft', 'investigation', 'lore', 'medicine', 'occult'],
  },
  {
    id: 'night',
    label: 'Night',
    abilityIds: ['athletics', 'awareness', 'dodge', 'larceny', 'stealth'],
  },
  {
    id: 'eclipse',
    label: 'Eclipse',
    abilityIds: ['bureaucracy', 'linguistics', 'ride', 'sail', 'socialize'],
  },
];

/**
 * Ability groupings for Abyssal's five Castes (Dusk, Midnight, Daybreak,
 * Day, Moonshadow). Unlike Dragon-Blooded (grouped by classical Element),
 * Abyssal is Caste-based like Solar — Exalted: The Abyssals states each
 * Abyssal Caste mirrors its opposed Solar Caste's Ability list exactly
 * (Dawn<->Dusk, Zenith<->Midnight, Twilight<->Daybreak, Night<->Day,
 * Eclipse<->Moonshadow), so this reuses `solarAbilityGroups`'s Ability
 * lists positionally rather than duplicating them, substituting only the
 * Abyssal Caste ids/labels.
 */
export const abyssalAbilityGroups: readonly AbilityGroup[] = [
  'dusk',
  'midnight',
  'daybreak',
  'day',
  'moonshadow',
].map((id, index) => ({
  id,
  label: id[0]!.toUpperCase() + id.slice(1),
  abilityIds: solarAbilityGroups[index]!.abilityIds,
}));

export const dragonBloodedAbilityGroups: readonly AbilityGroup[] = [
  {
    id: 'air',
    label: 'Air',
    abilityIds: ['linguistics', 'lore', 'occult', 'stealth', 'thrown'],
  },
  {
    id: 'earth',
    label: 'Earth',
    abilityIds: [
      'awareness',
      'craft',
      'endurance',
      'martialArts',
      'resistance',
    ],
  },
  {
    id: 'fire',
    label: 'Fire',
    abilityIds: ['athletics', 'dodge', 'melee', 'presence', 'socialize'],
  },
  {
    id: 'water',
    label: 'Water',
    abilityIds: ['brawl', 'bureaucracy', 'investigation', 'larceny', 'sail'],
  },
  {
    id: 'wood',
    label: 'Wood',
    abilityIds: ['archery', 'medicine', 'performance', 'ride', 'survival'],
  },
];

export const exaltedVirtues = [
  { id: 'compassion', label: 'Compassion' },
  { id: 'temperance', label: 'Temperance' },
  { id: 'conviction', label: 'Conviction' },
  { id: 'valor', label: 'Valor' },
] as const;

export type ExaltedVirtueId = (typeof exaltedVirtues)[number]['id'];

export const solarBackgrounds = [
  { id: 'allies', label: 'Allies' },
  { id: 'artifact', label: 'Artifact' },
  { id: 'backing', label: 'Backing' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'followers', label: 'Followers' },
  { id: 'influence', label: 'Influence' },
  { id: 'manse', label: 'Manse' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'resources', label: 'Resources' },
] as const;

export const dragonBloodedBackgrounds = [
  { id: 'allies', label: 'Allies' },
  { id: 'artifact', label: 'Artifact' },
  { id: 'backing', label: 'Backing' },
  { id: 'breeding', label: 'Breeding' },
  { id: 'connections', label: 'Connections' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'family', label: 'Family' },
  { id: 'followers', label: 'Followers' },
  { id: 'henchmen', label: 'Henchmen' },
  { id: 'influence', label: 'Influence' },
  { id: 'manse', label: 'Manse' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'resources', label: 'Resources' },
] as const;

/**
 * Backgrounds available to Abyssal characters: the shared, splat-neutral
 * Backgrounds every Exalt can take (the same set as `solarBackgrounds`,
 * since none of Dragon-Blooded's extra ids -- Breeding, Connections,
 * Family, Henchmen -- are elemental-specific rather than Abyssal-specific),
 * plus the six Backgrounds Exalted: The Abyssals adds for deathknights.
 * Five further Backgrounds (Artifact, Backing/Mentor, Familiar, Followers,
 * Manse) work differently in play for Abyssals per the source text, but
 * reuse these same shared ids rather than needing new schema rows.
 */
export const abyssalBackgrounds = [
  { id: 'allies', label: 'Allies' },
  { id: 'artifact', label: 'Artifact' },
  { id: 'backing', label: 'Backing' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'followers', label: 'Followers' },
  { id: 'influence', label: 'Influence' },
  { id: 'manse', label: 'Manse' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'resources', label: 'Resources' },
  { id: 'abyssal-command', label: 'Abyssal Command' },
  { id: 'liege', label: 'Liege' },
  { id: 'necromancy', label: 'Necromancy' },
  { id: 'spies', label: 'Spies' },
  { id: 'underworld-manse', label: 'Underworld Manse' },
  { id: 'whispers', label: 'Whispers' },
] as const;

export type ExaltedBackgroundId =
  | (typeof solarBackgrounds)[number]['id']
  | (typeof dragonBloodedBackgrounds)[number]['id']
  | (typeof abyssalBackgrounds)[number]['id'];

export const abilityById = new Map(
  exaltedAbilities.map((ability) => [ability.id, ability]),
);
