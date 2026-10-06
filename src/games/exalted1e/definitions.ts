export const EXALTED1E_SYSTEM_ID = 'exalted1e' as const;
export const EXALTED1E_SCHEMA_VERSION = 11 as const;

/**
 * Legal `sheetType` values for a STORED character. Re-exported from
 * `profiles.ts` (the single canonical list of all seven Exalted 1e
 * character types) rather than redefined here, so this project has exactly
 * one enum of character types instead of two independently-maintained
 * ones. All five new families (Lunar, Abyssal, Sidereal, Alchemical, Fair
 * Folk) are legal STORED `sheetType` values -- each has at least a blank
 * character (`createBlankExaltedCharacter`) and a `familyState` shape --
 * but none has a creator/editor UI exposed to end users yet:
 * `definition.tsx`'s `variants` array only lists the two production
 * families, and `schema.ts`'s per-family Background/Charm/Merit-Flaw/Spell
 * validation only actually accepts real selections for the families with a
 * promoted catalog (today: Solar, Dragon-Blooded, Abyssal, Sidereal, Lunar,
 * Alchemical for Backgrounds/Merits-Flaws; Abyssal, Sidereal, Lunar, and
 * Alchemical for Charms/spells) -- every other combination is explicitly
 * rejected, never
 * silently unrestricted. See `plannedExaltedFamilies` below and
 * `src/games/exalted1e/verification.ts` for the family-level release gate
 * that keeps all five locked in the UI until they each separately earn it.
 */
export {
  exaltedCharacterTypes as exaltedSheetTypes,
  type ExaltedCharacterType as ExaltedSheetType,
} from './profiles';

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

/**
 * Ability groupings for Sidereal's five Castes (Journeys, Serenity,
 * Battles, Secrets, Endings). Unlike Abyssal (which mirrors its opposed
 * Solar Caste's Ability list exactly), Sidereal's Caste-Ability trees are
 * genuinely its own, arranged around the five Auspicious Abilities per
 * Caste that Exalted: The Sidereals' Chapter Five actually documents. This
 * list is derived directly from `sidereal-charms.json`'s own `caste`/
 * `ability` fields on the 152 already-promoted, page-cited Caste-and-
 * Auspicious-Ability Charms (Phase 2b) -- not retyped from memory -- so it
 * is exactly as reliable as the catalog itself.
 */
export const siderealAbilityGroups: readonly AbilityGroup[] = [
  {
    id: 'journeys',
    label: 'Journeys',
    abilityIds: ['endurance', 'ride', 'sail', 'survival', 'thrown'],
  },
  {
    id: 'serenity',
    label: 'Serenity',
    abilityIds: ['craft', 'dodge', 'linguistics', 'performance', 'socialize'],
  },
  {
    id: 'battles',
    label: 'Battles',
    abilityIds: ['archery', 'brawl', 'melee', 'presence', 'resistance'],
  },
  {
    id: 'secrets',
    label: 'Secrets',
    abilityIds: ['investigation', 'larceny', 'lore', 'occult', 'stealth'],
  },
  {
    id: 'endings',
    label: 'Endings',
    abilityIds: [
      'athletics',
      'awareness',
      'bureaucracy',
      'martialArts',
      'medicine',
    ],
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

/**
 * Backgrounds available to Sidereal characters. Exalted: The Sidereals'
 * Chapter Four ('Altered Backgrounds' / 'New Backgrounds', see
 * `docs/references/exalted1e/sidereal/inventory/exalted-the-sidereals.json`)
 * reuses six of the shared, splat-neutral ids (Allies, Artifact, Backing,
 * Familiar, Manse, Resources), each re-flavored in play (e.g. Familiar is
 * capped at one until expanded by a Charm; Manse is deprioritized in favor
 * of the new Celestial Manse; Resources remains the ronin Sidereal's
 * economic Background even though most non-ronin Sidereals use the new
 * Salary Background instead) -- but, unlike Abyssal, explicitly drops four
 * of Solar's shared ids that the source states are wholly UNAVAILABLE to
 * Sidereals, each fully replaced by one of the six new ids below: Contacts
 * and Influence are both replaced by Connections; Followers is replaced by
 * Acquaintances (Sidereals' innate Arcane Fate makes mortals forget them
 * without it); Mentor is replaced by Sifu (a dedicated secret-martial-arts
 * tutor Background). The six new ids -- Acquaintances, Celestial Manse,
 * Connections, Salary, Savant, Sifu -- match the source manifest's
 * `newBackgrounds: 6`/`alteredBackgrounds: 5` counts (five of the six
 * reused shared ids -- all but Resources -- have their own dedicated
 * "altered" inventory row; Resources' alteration is a one-line note folded
 * into the Salary row instead of a separate row, per the source text).
 */
export const siderealBackgrounds = [
  { id: 'allies', label: 'Allies' },
  { id: 'artifact', label: 'Artifact' },
  { id: 'backing', label: 'Backing' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'manse', label: 'Manse' },
  { id: 'resources', label: 'Resources' },
  { id: 'acquaintances', label: 'Acquaintances' },
  { id: 'celestial-manse', label: 'Celestial Manse' },
  { id: 'connections', label: 'Connections' },
  { id: 'salary', label: 'Salary' },
  { id: 'savant', label: 'Savant' },
  { id: 'sifu', label: 'Sifu' },
] as const;

/**
 * Backgrounds available to Lunar characters. Exalted: The Lunars' Chapter
 * Four ('Altered Backgrounds' / 'New Backgrounds') reuses all ten of
 * Solar's shared, splat-neutral ids verbatim -- five of them (Artifact,
 * Backing, Followers, Manse, Mentor) get their own dedicated "altered"
 * inventory row describing how the Background plays differently for a
 * Lunar (e.g. Mentor is re-flavored around closeness to the character's
 * Silver Pact elder-mentor), while the other five (Allies, Contacts,
 * Familiar, Influence, Resources) are confirmed unaltered by the source
 * text -- plus three wholly new ids the same chapter adds: Cult, Heart's
 * Blood, and Renown (a bonus-point grant into the separate Renown Trait;
 * Casteless Lunars may not take it).
 */
export const lunarBackgrounds = [
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
  { id: 'cult', label: 'Cult' },
  { id: 'hearts-blood', label: "Heart's Blood" },
  { id: 'renown', label: 'Renown' },
] as const;

/**
 * Backgrounds available to Alchemical characters. Exalted: The
 * Autochthonians' Chapter Two ('Expanded Backgrounds', see
 * `docs/references/exalted1e/alchemical/inventory/exalted-the-autochthonians.json`)
 * is narrower and more prescriptive than the other four families' own
 * Background sections: it explicitly adds two wholly new ids -- Class (which
 * folds the shared Followers/Influence/Resources ids into a single
 * socioeconomic rating, explicitly replacing all three for ordinary
 * Autochthonians) and Vats (access to a home Vat Complex's refit queue and
 * spare-Charm retainer slots) -- and explicitly alters four reused shared
 * ids for this family's construct nature: Artifact (triple value per dot,
 * reachable to ••••• at character creation), Backing (keyed to a named
 * Tripartite branch/Sodality instead of a generic power bloc), Familiar (a
 * requisitioned construct servitor instead of a living animal), and Manse
 * (wholly unavailable until a story reaches Creation, since Autochthonia
 * itself has none). Followers, Influence, and Resources are explicitly
 * EXCLUDED for ordinary Autochthonians (subsumed into Class) per that same
 * chapter -- see `followers-influence-resources-subsumed` in the inventory.
 * Allies, Contacts, and Mentor are deliberately left OUT of this list: unlike
 * Lunar's own Background section (which the inventory confirms explicitly
 * states its unaltered shared ids remain available), Exalted: The
 * Autochthonians never mentions these three ids at all in either direction,
 * so including them would be an unconfirmed guess rather than a
 * page-cited fact. Revisit if a later source (e.g. the Autochthonians'
 * own later chapters, or a cross-splat supplement) settles the question.
 */
export const alchemicalBackgrounds = [
  { id: 'artifact', label: 'Artifact' },
  { id: 'backing', label: 'Backing' },
  { id: 'class', label: 'Class' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'manse', label: 'Manse' },
  { id: 'vats', label: 'Vats' },
] as const;

export type ExaltedBackgroundId =
  | (typeof solarBackgrounds)[number]['id']
  | (typeof dragonBloodedBackgrounds)[number]['id']
  | (typeof abyssalBackgrounds)[number]['id']
  | (typeof siderealBackgrounds)[number]['id']
  | (typeof lunarBackgrounds)[number]['id']
  | (typeof alchemicalBackgrounds)[number]['id'];

export const abilityById = new Map(
  exaltedAbilities.map((ability) => [ability.id, ability]),
);
