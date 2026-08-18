export const EXALTED1E_SYSTEM_ID = 'exalted1e' as const;
export const EXALTED1E_SCHEMA_VERSION = 6 as const;

export const exaltedSheetTypes = ['solar', 'dragon-blooded'] as const;
export type ExaltedSheetType = (typeof exaltedSheetTypes)[number];

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
  { id: 'exalted-notes', label: 'Notes', group: 'advancement' },
  {
    id: 'exalted-later-pages',
    label: 'Later pages',
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

export type ExaltedBackgroundId =
  | (typeof solarBackgrounds)[number]['id']
  | (typeof dragonBloodedBackgrounds)[number]['id'];

export const abilityById = new Map(
  exaltedAbilities.map((ability) => [ability.id, ability]),
);
